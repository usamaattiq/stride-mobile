import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import MapView, { PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import * as Location from 'expo-location';

import { i18n as appI18n } from '@/i18n';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { ensureLocationPermission } from '@/services/locationPermission';
import { readDeviceCoordinates } from '@/services/readDeviceCoordinates';
import { AppBottomSheet } from '@/shared/components/AppBottomSheet';
import { AppDialog } from '@/shared/components/AppDialog';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { ENV, hasGoogleMapsApiKey } from '@/shared/config/env';
import { colors, getFontFamily, radius, spacing } from '@/theme';

import { resolveAddressLabel } from '../utils/geocodedAddressLabel';
import { searchMapLocations, type MapSearchResult } from '../utils/signup-map-geocode';

export type LocationSelection = {
  label: string;
  latitude: number;
  longitude: number;
};

type MapPin = {
  latitude: number;
  longitude: number;
  label?: string;
};

// Default map focus (Lahore) used when no coordinates are available yet.
const DEFAULT_REGION: Region = {
  latitude: 31.5204,
  longitude: 74.3587,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

const PIN_REGION_DELTA = 0.02;

type UseLocationMapPicker = {
  locationLoading: boolean;
  openMapPickerForSelection: (
    onConfirm: (selection: LocationSelection) => void,
    initial?: LocationSelection | null,
  ) => void;
  getCurrentLocation: () => Promise<LocationSelection | null>;
  mapPickerSheet: React.ReactElement;
};

function toRegion(latitude: number, longitude: number): Region {
  return {
    latitude,
    longitude,
    latitudeDelta: PIN_REGION_DELTA,
    longitudeDelta: PIN_REGION_DELTA,
  };
}

export function useLocationMapPicker(): UseLocationMapPicker {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { currentLanguage } = useLanguage();
  const mapsApiKey = ENV.googleMapsApiKey;

  const mapRef = useRef<MapView | null>(null);
  const skipMapSearchRef = useRef(false);
  const confirmSelectionRef = useRef<((selection: LocationSelection) => void) | null>(null);
  const suppressRegionResolveRef = useRef(false);
  const lastUserLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const locationWatchRef = useRef<Location.LocationSubscription | null>(null);

  const [locationLoading, setLocationLoading] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [mapSearchResults, setMapSearchResults] = useState<MapSearchResult[]>([]);
  const [mapSearchLoading, setMapSearchLoading] = useState(false);
  const [mapSearchShowEmpty, setMapSearchShowEmpty] = useState(false);
  const [mapPin, setMapPin] = useState<MapPin | null>(null);
  const [mapRegion, setMapRegion] = useState<Region>(DEFAULT_REGION);
  const [mapInstanceKey, setMapInstanceKey] = useState(0);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [infoDialog, setInfoDialog] = useState<{ title: string; body: string } | null>(null);

  const animateTo = useCallback((latitude: number, longitude: number) => {
    const next = toRegion(latitude, longitude);
    suppressRegionResolveRef.current = true;
    setMapRegion(next);
    mapRef.current?.animateToRegion(next, 350);
  }, []);

  const runMapSearch = useCallback(
    async (query: string) => {
      const trimmed = query.trim();
      if (!trimmed || !mapsApiKey) {
        setMapSearchResults([]);
        return;
      }

      setMapSearchLoading(true);
      setMapSearchShowEmpty(false);
      try {
        const results = await searchMapLocations(trimmed, mapsApiKey);
        setMapSearchResults(results);
        setMapSearchShowEmpty(results.length === 0);
      } catch {
        setMapSearchResults([]);
        setMapSearchShowEmpty(true);
      } finally {
        setMapSearchLoading(false);
      }
    },
    [mapsApiKey],
  );

  const closeMapPicker = useCallback(() => {
    setMapVisible(false);
    setMapSearchQuery('');
    setMapSearchResults([]);
    setMapSearchLoading(false);
    setMapSearchShowEmpty(false);
    setIsResolvingAddress(false);
    confirmSelectionRef.current = null;
  }, []);

  const openMapPickerForSelection = useCallback(
    (onConfirm: (selection: LocationSelection) => void, initial?: LocationSelection | null) => {
      confirmSelectionRef.current = onConfirm;
      setMapSearchQuery('');
      setMapSearchResults([]);
      setMapSearchLoading(false);
      setMapSearchShowEmpty(false);
      setIsResolvingAddress(false);

      if (initial) {
        const seed: MapPin = {
          latitude: initial.latitude,
          longitude: initial.longitude,
          label: initial.label?.trim() || undefined,
        };
        setMapPin(seed);
        setMapRegion(toRegion(seed.latitude, seed.longitude));
      } else {
        setMapPin(null);
        setMapRegion(DEFAULT_REGION);
      }

      setMapInstanceKey((key) => key + 1);
      setMapVisible(true);
    },
    [],
  );

  const getCurrentLocation = useCallback(async (): Promise<LocationSelection | null> => {
    try {
      setLocationLoading(true);

      const granted = await ensureLocationPermission();
      if (!granted) {
        setInfoDialog({
          title: t('auth.signup.personal.locationPermissionTitle'),
          body: t('auth.signup.personal.locationPermissionBody'),
        });
        return null;
      }

      const { latitude, longitude } = await readDeviceCoordinates();
      const label = await resolveAddressLabel(latitude, longitude);
      return { label, latitude, longitude };
    } catch {
      setInfoDialog({
        title: t('auth.signup.personal.locationErrorTitle'),
        body: t('auth.signup.personal.locationErrorBody'),
      });
      return null;
    } finally {
      setLocationLoading(false);
    }
  }, [t]);

  // Keep last GPS fix while the sheet is open (for locate-me without a second one-shot).
  useEffect(() => {
    if (!mapVisible) {
      void locationWatchRef.current?.remove();
      locationWatchRef.current = null;
      return;
    }

    let cancelled = false;

    void (async () => {
      const granted = await ensureLocationPermission();
      if (!granted || cancelled) {
        return;
      }
      const subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 15 },
        (position) => {
          lastUserLocationRef.current = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
        },
      );
      if (cancelled) {
        void subscription.remove();
        return;
      }
      locationWatchRef.current = subscription;
    })();

    return () => {
      cancelled = true;
      void locationWatchRef.current?.remove();
      locationWatchRef.current = null;
    };
  }, [mapVisible]);

  const recenterToMyLocation = useCallback(async () => {
    try {
      const granted = await ensureLocationPermission();
      if (!granted) {
        setInfoDialog({
          title: t('auth.signup.personal.locationPermissionTitle'),
          body: t('auth.signup.personal.locationPermissionBody'),
        });
        return;
      }

      let coords = lastUserLocationRef.current;
      if (!coords) {
        coords = await readDeviceCoordinates();
      }

      const { latitude, longitude } = coords;
      const label = await resolveAddressLabel(latitude, longitude);
      setMapPin({ latitude, longitude, label });
      animateTo(latitude, longitude);
    } catch {
      setInfoDialog({
        title: t('auth.signup.personal.locationErrorTitle'),
        body: t('auth.signup.personal.locationErrorBody'),
      });
    }
  }, [animateTo, t]);

  const handleConfirmMapSelection = useCallback(async () => {
    if (!mapPin) {
      setInfoDialog({
        title: t('auth.signup.personal.mapSelectTitle'),
        body: t('auth.signup.personal.mapSelectBody'),
      });
      return;
    }

    const cachedLabel = mapPin.label?.trim();
    const label =
      cachedLabel && cachedLabel.length > 0
        ? cachedLabel
        : await resolveAddressLabel(mapPin.latitude, mapPin.longitude);
    confirmSelectionRef.current?.({
      label,
      latitude: mapPin.latitude,
      longitude: mapPin.longitude,
    });
    closeMapPicker();
  }, [closeMapPicker, mapPin, t]);

  const handleRegionChangeComplete = useCallback((nextRegion: Region) => {
    setMapRegion(nextRegion);

    if (suppressRegionResolveRef.current) {
      suppressRegionResolveRef.current = false;
      return;
    }

    setIsResolvingAddress(true);
    void resolveAddressLabel(nextRegion.latitude, nextRegion.longitude)
      .then((label) => {
        setMapPin({
          latitude: nextRegion.latitude,
          longitude: nextRegion.longitude,
          label,
        });
      })
      .finally(() => setIsResolvingAddress(false));
  }, []);

  const handleSelectMapSearchResult = useCallback(
    (result: MapSearchResult) => {
      skipMapSearchRef.current = true;
      setMapSearchQuery(result.label);
      setMapSearchResults([]);
      setMapPin({
        latitude: result.latitude,
        longitude: result.longitude,
        label: result.label,
      });
      animateTo(result.latitude, result.longitude);
    },
    [animateTo],
  );

  useEffect(() => {
    if (!mapVisible) return;
    if (skipMapSearchRef.current) {
      skipMapSearchRef.current = false;
      return;
    }

    const query = mapSearchQuery.trim();
    if (query.length < 3) {
      setMapSearchResults([]);
      return;
    }

    const id = setTimeout(() => {
      void runMapSearch(query);
    }, 400);

    return () => clearTimeout(id);
  }, [mapSearchQuery, mapVisible, runMapSearch]);

  const searchFontFamily = getFontFamily(currentLanguage, 'regular');
  const mapsReady = hasGoogleMapsApiKey();

  const mapPickerSheet = (
    <>
      <AppBottomSheet
        visible={mapVisible}
        onClose={closeMapPicker}
        heightRatio={0.77}
        sheetStyle={styles.mapSheet}
      >
        <View style={styles.sheetGrabber} />

        <View style={styles.mapHeader}>
          <View style={styles.mapHeaderIconWrap}>
            <FontAwesome name="map-marker" size={15} color={colors.primary} />
          </View>
          <AppText weight="bold" style={styles.mapHeaderTitle}>
            {t('auth.signup.personal.mapTitle')}
          </AppText>
        </View>

        <View style={styles.searchCard}>
          <View style={styles.searchCardInner}>
            <View style={styles.mapSearchInputWrap}>
              <FontAwesome name="search" size={14} color={colors.text.tertiary} />
              <TextInput
                value={mapSearchQuery}
                onChangeText={setMapSearchQuery}
                placeholder={t('auth.signup.personal.mapSearchPlaceholder')}
                placeholderTextColor={colors.text.tertiary}
                style={[styles.mapSearchInput, { fontFamily: searchFontFamily }]}
                returnKeyType="search"
              />
              {mapSearchLoading ? (
                <ActivityIndicator size="small" color={colors.text.tertiary} />
              ) : null}
            </View>

            {mapSearchResults.length > 0 ? (
              <View style={styles.mapSearchResults}>
                {mapSearchResults.map((result, index) => (
                  <Pressable
                    key={result.id}
                    style={({ pressed }) => [
                      styles.mapSearchResultRow,
                      index === mapSearchResults.length - 1 && styles.mapSearchResultRowLast,
                      pressed && styles.mapSearchResultRowPressed,
                    ]}
                    onPress={() => handleSelectMapSearchResult(result)}
                    accessibilityRole="button"
                  >
                    <View style={styles.resultIconWrap}>
                      <FontAwesome name="map-marker" size={12} color={colors.primary} />
                    </View>
                    <AppText style={styles.mapSearchResultText} numberOfLines={2}>
                      {result.label}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {!mapSearchLoading && mapSearchShowEmpty ? (
              <View style={styles.mapSearchResults}>
                <AppText style={styles.mapSearchEmptyText}>
                  {t('auth.signup.personal.mapNoResults')}
                </AppText>
              </View>
            ) : null}
          </View>
        </View>

        {mapsReady ? (
          <View style={styles.mapWrap}>
            <MapView
              key={mapInstanceKey}
              ref={mapRef}
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={mapRegion}
              onRegionChangeComplete={handleRegionChangeComplete}
              showsUserLocation
              showsMyLocationButton={false}
              toolbarEnabled={false}
            />

            <View style={styles.pinWrap} pointerEvents="none">
              <FontAwesome name="map-marker" size={36} color={colors.primary} />
              <View style={styles.pinShadow} />
            </View>

            {isResolvingAddress ? (
              <View style={styles.resolvingBadge}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null}

            <Pressable
              style={styles.locateButton}
              onPress={() => void recenterToMyLocation()}
              accessibilityRole="button"
              accessibilityLabel={t('auth.signup.personal.mapTitle')}
            >
              <FontAwesome name="crosshairs" size={18} color={colors.text.secondary} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.mapFallback}>
            <AppText weight="semibold" style={styles.mapFallbackTitle}>
              {t('auth.signup.personal.mapFallbackTitle')}
            </AppText>
            <AppText style={styles.mapFallbackBody}>
              {t('auth.signup.personal.mapFallbackBody')}
            </AppText>
          </View>
        )}

        <View style={styles.mapFooter}>
          <Button
            label={t('auth.signup.personal.mapConfirm')}
            onPress={() => void handleConfirmMapSelection()}
          />
        </View>
      </AppBottomSheet>

      <AppDialog
        visible={infoDialog != null}
        icon="map-marker"
        title={infoDialog?.title ?? ''}
        message={infoDialog?.body}
        confirmAction={{
          label: t('common.ok'),
          onPress: () => setInfoDialog(null),
        }}
      />
    </>
  );

  return {
    locationLoading,
    openMapPickerForSelection,
    getCurrentLocation,
    mapPickerSheet,
  };
}

const styles = StyleSheet.create({
  mapSheet: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  sheetGrabber: {
    alignSelf: 'center',
    width: 46,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: colors.border.strong,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  mapHeader: {
    minHeight: 40,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mapHeaderIconWrap: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  mapHeaderTitle: {
    color: colors.text.primary,
    fontSize: 17,
  },
  searchCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    zIndex: 10,
  },
  searchCardInner: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  mapSearchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  mapSearchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  mapSearchResults: {
    borderTopWidth: 1,
    borderTopColor: colors.background.subtle,
  },
  mapSearchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.subtle,
  },
  mapSearchResultRowLast: {
    borderBottomWidth: 0,
  },
  mapSearchResultRowPressed: {
    backgroundColor: colors.background.subtle,
  },
  resultIconWrap: {
    width: 26,
    height: 26,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    flexShrink: 0,
  },
  mapSearchResultText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.primary,
  },
  mapSearchEmptyText: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  mapWrap: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  pinWrap: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -12,
    marginTop: -36,
    alignItems: 'center',
  },
  pinShadow: {
    width: 10,
    height: 4,
    borderRadius: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    marginTop: -2,
  },
  resolvingBadge: {
    position: 'absolute',
    top: spacing.md,
    alignSelf: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.full,
    padding: spacing.sm,
  },
  locateButton: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 2,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
  mapFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
    backgroundColor: colors.background.subtle,
  },
  mapFallbackTitle: {
    fontSize: 15,
    color: colors.text.primary,
    textAlign: 'center',
  },
  mapFallbackBody: {
    fontSize: 13,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  mapFooter: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
});
