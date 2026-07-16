import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';

import { i18n as appI18n } from '@/i18n';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { AppBottomSheet } from '@/shared/components/AppBottomSheet';
import { AppDialog } from '@/shared/components/AppDialog';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { ENV } from '@/shared/config/env';
import { colors, getFontFamily, radius, spacing } from '@/theme';

import { resolveAddressLabel } from '../utils/geocodedAddressLabel';
import { searchMapLocations, type MapSearchResult } from '../utils/signup-map-geocode';
import { buildSignupMapPickerHtml } from '../utils/signup-map-picker';

export type LocationSelection = {
  label: string;
  latitude: number;
  longitude: number;
};

type MapRegion = {
  latitude: number;
  longitude: number;
};

// Default map focus (Karachi) used when no coordinates are available yet.
const DEFAULT_REGION: MapRegion = {
  latitude: 24.8607,
  longitude: 67.0011,
};

type UseLocationMapPicker = {
  locationLoading: boolean;
  openMapPickerForSelection: (
    onConfirm: (selection: LocationSelection) => void,
    initial?: LocationSelection | null,
  ) => void;
  getCurrentLocation: () => Promise<LocationSelection | null>;
  mapPickerSheet: React.ReactElement;
};

export function useLocationMapPicker(): UseLocationMapPicker {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { currentLanguage } = useLanguage();
  const mapsApiKey = ENV.googleMapsApiKey;

  const mapWebViewRef = useRef<WebView>(null);
  const skipMapSearchRef = useRef(false);
  const confirmSelectionRef = useRef<((selection: LocationSelection) => void) | null>(null);

  const [locationLoading, setLocationLoading] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [mapSearchResults, setMapSearchResults] = useState<MapSearchResult[]>([]);
  const [mapSearchLoading, setMapSearchLoading] = useState(false);
  const [mapSearchShowEmpty, setMapSearchShowEmpty] = useState(false);
  const [mapRegion, setMapRegion] = useState<MapRegion>(DEFAULT_REGION);
  const [mapPin, setMapPin] = useState<{ latitude: number; longitude: number } | null>(null);
  const [infoDialog, setInfoDialog] = useState<{ title: string; body: string } | null>(null);

  const pinMapToLocation = useCallback((latitude: number, longitude: number, address?: string) => {
    mapWebViewRef.current?.injectJavaScript(
      `window.__STRIDE_SET_LOCATION && window.__STRIDE_SET_LOCATION(${latitude}, ${longitude}, ${JSON.stringify(address ?? '')}); true;`,
    );
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
    confirmSelectionRef.current = null;
  }, []);

  const openMapPickerForSelection = useCallback(
    (onConfirm: (selection: LocationSelection) => void, initial?: LocationSelection | null) => {
      confirmSelectionRef.current = onConfirm;
      setMapSearchQuery('');
      setMapSearchResults([]);
      setMapSearchLoading(false);
      setMapSearchShowEmpty(false);

      if (initial) {
        setMapPin({ latitude: initial.latitude, longitude: initial.longitude });
        setMapRegion({ latitude: initial.latitude, longitude: initial.longitude });
      } else {
        setMapPin(null);
        setMapRegion(DEFAULT_REGION);
      }

      setMapVisible(true);
    },
    [],
  );

  const getCurrentLocation = useCallback(async (): Promise<LocationSelection | null> => {
    try {
      setLocationLoading(true);

      // Check-then-request avoids the Android permission hang.
      const existing = await Location.getForegroundPermissionsAsync();
      let status = existing.status;
      if (status !== Location.PermissionStatus.GRANTED) {
        const requested = await Location.requestForegroundPermissionsAsync();
        status = requested.status;
      }

      if (status !== Location.PermissionStatus.GRANTED) {
        setInfoDialog({
          title: t('auth.signup.personal.locationPermissionTitle'),
          body: t('auth.signup.personal.locationPermissionBody'),
        });
        return null;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = current.coords;
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

  const handleConfirmMapSelection = useCallback(async () => {
    if (!mapPin) {
      setInfoDialog({
        title: t('auth.signup.personal.mapSelectTitle'),
        body: t('auth.signup.personal.mapSelectBody'),
      });
      return;
    }

    const label = await resolveAddressLabel(mapPin.latitude, mapPin.longitude);
    confirmSelectionRef.current?.({
      label,
      latitude: mapPin.latitude,
      longitude: mapPin.longitude,
    });
    closeMapPicker();
  }, [closeMapPicker, mapPin, t]);

  const handleSelectMapSearchResult = useCallback(
    (result: MapSearchResult) => {
      skipMapSearchRef.current = true;
      setMapSearchQuery(result.label);
      setMapSearchResults([]);
      pinMapToLocation(result.latitude, result.longitude, result.label);
    },
    [pinMapToLocation],
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

  const mapPickerHtml = useMemo(
    () =>
      buildSignupMapPickerHtml(
        mapsApiKey,
        mapPin ?? { latitude: mapRegion.latitude, longitude: mapRegion.longitude },
      ),
    [mapPin, mapRegion.latitude, mapRegion.longitude, mapsApiKey],
  );

  const searchFontFamily = getFontFamily(currentLanguage, 'regular');

  const mapPickerSheet = (
    <>
      <AppBottomSheet
        visible={mapVisible}
        onClose={closeMapPicker}
        heightRatio={0.72}
        sheetStyle={styles.mapSheet}
      >
        <View style={styles.sheetGrabber} />
        <View style={styles.mapHeader}>
          <AppText weight="semibold" style={styles.mapHeaderTitle}>
            {t('auth.signup.personal.mapTitle')}
          </AppText>
          <Pressable onPress={closeMapPicker} style={styles.mapCloseButton} accessibilityRole="button">
            <AppText style={styles.mapCloseText}>{t('auth.signup.personal.mapClose')}</AppText>
          </Pressable>
        </View>

        <View style={styles.mapSearchRow}>
          <View style={styles.mapSearchInputWrap}>
            <FontAwesome name="search" size={14} color={colors.text.tertiary} />
            <TextInput
              value={mapSearchQuery}
              onChangeText={setMapSearchQuery}
              placeholder={t('auth.signup.personal.mapSearchPlaceholder')}
              placeholderTextColor={colors.text.tertiary}
              style={[styles.mapSearchInput, { fontFamily: searchFontFamily }]}
              returnKeyType="search"
              onSubmitEditing={() => {
                void runMapSearch(mapSearchQuery);
              }}
            />
          </View>
          <Pressable
            style={styles.mapSearchButton}
            onPress={() => {
              void runMapSearch(mapSearchQuery);
            }}
            disabled={mapSearchLoading || !mapSearchQuery.trim()}
            accessibilityRole="button"
          >
            {mapSearchLoading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <AppText weight="semibold" style={styles.mapSearchButtonText}>
                {t('auth.signup.personal.mapSearchAction')}
              </AppText>
            )}
          </Pressable>
        </View>

        {mapSearchResults.length > 0 ? (
          <View style={styles.mapSearchResults}>
            {mapSearchResults.map((result) => (
              <Pressable
                key={result.id}
                style={styles.mapSearchResultRow}
                onPress={() => handleSelectMapSearchResult(result)}
                accessibilityRole="button"
              >
                <FontAwesome name="map-marker" size={14} color={colors.primary} />
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

        {mapsApiKey ? (
          <WebView
            ref={mapWebViewRef}
            style={styles.map}
            originWhitelist={['*']}
            source={{ html: mapPickerHtml }}
            onMessage={(event) => {
              try {
                const payload = JSON.parse(event.nativeEvent.data) as {
                  latitude?: number;
                  longitude?: number;
                };
                if (typeof payload.latitude === 'number' && typeof payload.longitude === 'number') {
                  setMapPin({ latitude: payload.latitude, longitude: payload.longitude });
                  setMapRegion({ latitude: payload.latitude, longitude: payload.longitude });
                }
              } catch {
                // no-op
              }
            }}
          />
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
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  mapHeaderTitle: {
    color: colors.text.primary,
    fontSize: 15,
  },
  mapCloseButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  mapCloseText: {
    color: colors.primary,
    fontSize: 13,
  },
  mapSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  mapSearchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
  },
  mapSearchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  mapSearchButton: {
    minWidth: 72,
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  mapSearchButtonText: {
    color: colors.white,
    fontSize: 13,
  },
  mapSearchResults: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    overflow: 'hidden',
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
  map: {
    flex: 1,
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
