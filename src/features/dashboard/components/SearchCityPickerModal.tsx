import React from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { SUGGESTED_CITIES } from '@/features/dashboard/constants/suggestedCities';
import type { TripCity } from '@/features/dashboard/types/trip.types';
import { i18n as appI18n } from '@/i18n';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import type { TripSubzonePointDto } from '@/services/api/tripApi.types';
import { AppText } from '@/shared/components/AppText';
import { FocusAwareStatusBar } from '@/shared/components/FocusAwareStatusBar';
import { ENV } from '@/shared/config/env';
import { cityDisplayName } from '@/shared/utils/city-display-name';
import { searchCities } from '@/shared/utils/city-search';
import { enrichSelectedCity } from '@/shared/utils/localized-city-name';
import { colors, getFontFamily, radius, spacing } from '@/theme';

type SearchCityPickerModalProps = {
  visible: boolean;
  mode: 'departure' | 'arrival';
  value: TripCity | null;
  /** City id that cannot be selected (e.g. departure when picking arrival). */
  excludeCityId?: string | null;
  /** `light` matches trip-create (white chrome). Default is passenger-home brand. */
  appearance?: 'brand' | 'light';
  onClose: () => void;
  onSelect: (city: TripCity) => void;
  onChooseMap?: () => void;
  savedLocations?: TripSubzonePointDto[];
  onSelectSavedLocation?: (location: TripSubzonePointDto) => void;
};

const OPEN_MS = 180;
const CLOSE_MS = 160;
const ROW_HEIGHT = 52;
const SLIDE_DISTANCE = Math.round(Dimensions.get('window').height * 0.28);
const HIT_SLOP_8 = { top: 8, bottom: 8, left: 8, right: 8 } as const;
const HIT_SLOP_10 = { top: 10, bottom: 10, left: 10, right: 10 } as const;

function filterSuggested(query: string): TripCity[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return SUGGESTED_CITIES;
  }
  return SUGGESTED_CITIES.filter((city) => city.label.toLowerCase().includes(trimmed));
}

const keyExtractor = (item: TripCity) => item.id;

const getItemLayout = (_: ArrayLike<TripCity> | null | undefined, index: number) => ({
  length: ROW_HEIGHT,
  offset: ROW_HEIGHT * index,
  index,
});

type CityRowProps = {
  city: TripCity;
  selected: boolean;
  onPress: (city: TripCity) => void;
};

const CityRow = React.memo(function CityRow({
  city,
  selected,
  onPress,
}: CityRowProps): React.ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => onPress(city)}
      style={({ pressed }) => [
        styles.cityRow,
        selected && styles.cityRowSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.cityIcon}>
        <FontAwesome name="map-marker" size={14} color={colors.primary} />
      </View>
      <AppText
        weight={selected ? 'semibold' : 'regular'}
        style={[styles.cityLabel, selected && styles.cityLabelSelected]}
        numberOfLines={2}
      >
        {cityDisplayName(city.label)}
      </AppText>
      {selected ? <FontAwesome name="check" size={14} color={colors.primary} /> : null}
    </Pressable>
  );
});

type SavedLocationRowProps = {
  location: TripSubzonePointDto;
  onPress: (location: TripSubzonePointDto) => void;
};

const SavedLocationRow = React.memo(function SavedLocationRow({
  location,
  onPress,
}: SavedLocationRowProps): React.ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(location)}
      style={({ pressed }) => [styles.savedLocationRow, pressed && styles.pressed]}
    >
      <View style={styles.cityIcon}>
        <FontAwesome name="map-marker" size={14} color={colors.primary} />
      </View>
      <View style={styles.locationCopy}>
        <AppText weight="regular" style={styles.locationName} numberOfLines={1}>
          {location.name}
        </AppText>
        <AppText style={styles.locationCity} numberOfLines={1}>
          {cityDisplayName(location.cityLabel)}
        </AppText>
      </View>
    </Pressable>
  );
});

export const SearchCityPickerModal = React.memo(function SearchCityPickerModal({
  visible,
  mode,
  value,
  excludeCityId = null,
  appearance = 'brand',
  onClose,
  onSelect,
  onChooseMap,
  savedLocations = [],
  onSelectSavedLocation,
}: SearchCityPickerModalProps): React.ReactElement | null {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { currentLanguage } = useLanguage();
  const insets = useSafeAreaInsets();
  const inputRef = React.useRef<TextInput>(null);
  const progress = React.useRef(new Animated.Value(0)).current;
  const panelTranslateY = React.useRef(
    progress.interpolate({
      inputRange: [0, 1],
      outputRange: [SLIDE_DISTANCE, 0],
    }),
  ).current;
  const closingRef = React.useRef(false);
  const pendingSelectRef = React.useRef<TripCity | null>(null);
  const pendingSavedLocationRef = React.useRef<TripSubzonePointDto | null>(null);
  const pendingMapRef = React.useRef(false);
  const onCloseRef = React.useRef(onClose);
  const onSelectRef = React.useRef(onSelect);
  const onChooseMapRef = React.useRef(onChooseMap);
  const onSelectSavedLocationRef = React.useRef(onSelectSavedLocation);
  const searchGenRef = React.useRef(0);

  onCloseRef.current = onClose;
  onSelectRef.current = onSelect;
  onChooseMapRef.current = onChooseMap;
  onSelectSavedLocationRef.current = onSelectSavedLocation;

  const [rendered, setRendered] = React.useState(visible);
  const [query, setQuery] = React.useState('');
  const [remoteResults, setRemoteResults] = React.useState<TripCity[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showEmpty, setShowEmpty] = React.useState(false);

  const selectedId = value?.id ?? null;
  const isLight = appearance === 'light';
  const chromeIcon = isLight ? colors.text.primary : colors.white;
  const chromeMuted = isLight ? colors.text.tertiary : colors.text.onBrandMuted;
  const inputFontFamily = React.useMemo(
    () => getFontFamily(currentLanguage, 'semibold'),
    [currentLanguage],
  );
  const listPadding = React.useMemo(
    () => [styles.listContent, { paddingBottom: Math.max(insets.bottom, spacing.md) }],
    [insets.bottom],
  );

  const cities = React.useMemo(() => {
    const suggested = filterSuggested(query);
    const source = suggested.length > 0 ? suggested : remoteResults;
    if (!excludeCityId) {
      return source;
    }
    return source.filter((city) => city.id !== excludeCityId);
  }, [excludeCityId, query, remoteResults]);

  const filteredSavedLocations = React.useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    return savedLocations.filter((location) => {
      const cityKey = location.cityId ?? `subzone-${location.id}`;
      if (excludeCityId && cityKey === excludeCityId) {
        return false;
      }
      if (!trimmed) {
        return true;
      }
      return (
        location.name.toLowerCase().includes(trimmed) ||
        location.cityLabel.toLowerCase().includes(trimmed)
      );
    });
  }, [excludeCityId, query, savedLocations]);

  const finishClose = React.useCallback(() => {
    const selected = pendingSelectRef.current;
    const savedLocation = pendingSavedLocationRef.current;
    const openMap = pendingMapRef.current;
    pendingSelectRef.current = null;
    pendingSavedLocationRef.current = null;
    pendingMapRef.current = false;
    closingRef.current = false;
    setRendered(false);
    if (savedLocation) {
      onSelectSavedLocationRef.current?.(savedLocation);
    } else if (selected) {
      onSelectRef.current(selected);
    }
    onCloseRef.current();
    if (openMap) {
      onChooseMapRef.current?.();
    }
  }, []);

  const runClose = React.useCallback(() => {
    if (closingRef.current) {
      return;
    }
    closingRef.current = true;
    Keyboard.dismiss();
    Animated.timing(progress, {
      toValue: 0,
      duration: CLOSE_MS,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        finishClose();
      } else {
        closingRef.current = false;
      }
    });
  }, [finishClose, progress]);

  React.useEffect(() => {
    if (visible) {
      closingRef.current = false;
      pendingSelectRef.current = null;
      pendingSavedLocationRef.current = null;
      pendingMapRef.current = false;
      setRendered(true);
      setQuery(value?.label ?? '');
      setRemoteResults([]);
      setShowEmpty(false);
      setLoading(false);
      progress.setValue(0);
      const frame = requestAnimationFrame(() => {
        Animated.timing(progress, {
          toValue: 1,
          duration: OPEN_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished && !closingRef.current) {
            inputRef.current?.focus();
          }
        });
      });
      return () => cancelAnimationFrame(frame);
    }

    if (rendered && !closingRef.current) {
      runClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open/close only on visible
  }, [visible]);

  React.useEffect(() => {
    if (!rendered) {
      return;
    }

    const trimmed = query.trim();
    const localMatches = filterSuggested(trimmed).filter(
      (city) => !excludeCityId || city.id !== excludeCityId,
    );
    if (trimmed.length < 2 || localMatches.length > 0) {
      setRemoteResults((current) => (current.length === 0 ? current : []));
      setShowEmpty(false);
      setLoading(false);
      return;
    }

    const gen = ++searchGenRef.current;
    const timer = setTimeout(() => {
      setLoading(true);
      setShowEmpty(false);
      void searchCities(trimmed, ENV.googleMapsApiKey, currentLanguage)
        .then((items) => {
          if (searchGenRef.current !== gen) {
            return;
          }
          const filtered = excludeCityId
            ? items.filter((city) => city.id !== excludeCityId)
            : items;
          setRemoteResults(filtered);
          setShowEmpty(filtered.length === 0);
        })
        .finally(() => {
          if (searchGenRef.current === gen) {
            setLoading(false);
          }
        });
    }, 280);

    return () => {
      clearTimeout(timer);
      searchGenRef.current += 1;
    };
  }, [excludeCityId, query, rendered, currentLanguage]);

  const handleSavedLocationPress = React.useCallback(
    (location: TripSubzonePointDto) => {
      const cityKey = location.cityId ?? `subzone-${location.id}`;
      if (excludeCityId && cityKey === excludeCityId) {
        return;
      }
      pendingSavedLocationRef.current = location;
      runClose();
    },
    [excludeCityId, runClose],
  );

  const handleSelect = React.useCallback(
    (city: TripCity) => {
      if (excludeCityId && city.id === excludeCityId) {
        return;
      }
      void enrichSelectedCity(city, currentLanguage, ENV.googleMapsApiKey).then((enriched) => {
        pendingSelectRef.current = enriched;
        runClose();
      });
    },
    [currentLanguage, excludeCityId, runClose],
  );

  const renderItem = React.useCallback(
    ({ item }: ListRenderItemInfo<TripCity>) => (
      <CityRow city={item} selected={selectedId === item.id} onPress={handleSelect} />
    ),
    [handleSelect, selectedId],
  );

  const listEmpty = React.useMemo(() => {
    if (loading) {
      return (
        <View style={styles.empty}>
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }
    if (showEmpty || query.trim().length > 0) {
      return (
        <View style={styles.empty}>
          <AppText style={styles.emptyText}>{t('trips.create.cityNoResults')}</AppText>
        </View>
      );
    }
    return null;
  }, [loading, query, showEmpty, t]);

  if (!rendered) {
    return null;
  }

  const sectionTitle =
    mode === 'departure'
      ? t('dashboard.search.suggestedDepartures')
      : t('dashboard.search.suggestedArrivals');
  const placeholder =
    mode === 'departure'
      ? t('dashboard.search.departure')
      : t('dashboard.search.arrival');

  return (
    <Modal
      visible={rendered}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={runClose}
    >
      <View style={styles.root} pointerEvents="box-none">
        <FocusAwareStatusBar style={isLight ? 'dark' : 'light'} />
        <Animated.View
          needsOffscreenAlphaCompositing={false}
          renderToHardwareTextureAndroid
          shouldRasterizeIOS
          style={[
            styles.panel,
            isLight && styles.panelLight,
            { transform: [{ translateY: panelTranslateY }] },
          ]}
        >
          <View style={[styles.topBar, isLight && styles.topBarLight, { paddingTop: insets.top }]}>
            <View style={styles.searchBar}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('dashboard.search.back')}
                onPress={runClose}
                hitSlop={HIT_SLOP_10}
                style={({ pressed }) => [
                  styles.backButton,
                  isLight && styles.backButtonLight,
                  pressed && styles.pressed,
                ]}
              >
                <FontAwesome name="chevron-left" size={16} color={chromeIcon} />
              </Pressable>

              <View style={[styles.inputWrap, isLight && styles.inputWrapLight]}>
                <FontAwesome
                  name={mode === 'departure' ? 'arrow-up' : 'arrow-down'}
                  size={13}
                  color={chromeIcon}
                />
                <TextInput
                  ref={inputRef}
                  value={query}
                  onChangeText={setQuery}
                  placeholder={placeholder}
                  placeholderTextColor={chromeMuted}
                  autoCorrect={false}
                  autoCapitalize="words"
                  returnKeyType="search"
                  style={[
                    styles.input,
                    isLight && styles.inputLight,
                    { fontFamily: inputFontFamily },
                  ]}
                />
                {loading ? <ActivityIndicator size="small" color={chromeIcon} /> : null}
                {query.length > 0 && !loading ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setQuery('')}
                    hitSlop={HIT_SLOP_8}
                  >
                    <FontAwesome name="times-circle" size={16} color={chromeMuted} />
                  </Pressable>
                ) : null}
              </View>
            </View>
          </View>

          <View style={styles.body}>
            {onChooseMap ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  pendingMapRef.current = true;
                  runClose();
                }}
                style={({ pressed }) => [styles.mapRow, pressed && styles.pressed]}
              >
                <View style={styles.cityIcon}>
                  <FontAwesome name="map-o" size={14} color={colors.primary} />
                </View>
                <AppText weight="semibold" style={styles.mapRowLabel}>
                  {t('trips.create.selectOnMap')}
                </AppText>
                <FontAwesome name="chevron-right" size={12} color={colors.text.tertiary} />
              </Pressable>
            ) : null}

            {filteredSavedLocations.length > 0 ? (
              <View style={styles.listSection}>
                <View style={styles.sectionHeaderInline}>
                  <AppText weight="semibold" style={styles.sectionTitle}>
                    {t('trips.create.savedLocations')}
                  </AppText>
                </View>
                {filteredSavedLocations.map((location) => (
                  <SavedLocationRow
                    key={location.id}
                    location={location}
                    onPress={handleSavedLocationPress}
                  />
                ))}
              </View>
            ) : null}

            <View style={styles.sectionHeader}>
              <AppText weight="semibold" style={styles.sectionTitle}>
                {sectionTitle}
              </AppText>
            </View>

            <FlatList
              data={cities}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              getItemLayout={getItemLayout}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              removeClippedSubviews
              initialNumToRender={10}
              maxToRenderPerBatch={8}
              updateCellsBatchingPeriod={50}
              windowSize={7}
              extraData={selectedId}
              contentContainerStyle={listPadding}
              ListEmptyComponent={listEmpty}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  panel: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  panelLight: {
    backgroundColor: colors.white,
  },
  topBar: {
    backgroundColor: colors.primary,
    paddingBottom: spacing.sm,
  },
  topBarLight: {
    backgroundColor: colors.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  backButtonLight: {
    backgroundColor: colors.background.subtle,
  },
  inputWrap: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inputWrapLight: {
    borderColor: colors.border.default,
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.white,
    paddingVertical: spacing.xs,
  },
  inputLight: {
    color: colors.text.primary,
  },
  body: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    marginTop: -spacing.sm,
    overflow: 'hidden',
  },
  sectionHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  sectionHeaderInline: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  listSection: {
    paddingHorizontal: spacing.md,
  },
  mapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    minHeight: 48,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.background.subtle,
  },
  mapRowLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
  },
  sectionTitle: {
    fontSize: 13,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    flexGrow: 1,
  },
  cityRow: {
    height: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
  },
  savedLocationRow: {
    minHeight: ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
  },
  cityRowSelected: {
    backgroundColor: colors.primarySoft,
    marginHorizontal: -spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  cityIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cityLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
  },
  cityLabelSelected: {
    color: colors.primary,
  },
  locationCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  locationName: {
    fontSize: 15,
    color: colors.text.primary,
  },
  locationCity: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
