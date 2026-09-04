import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTranslation } from 'react-i18next';

import { searchMapLocations } from '@/features/auth/utils/signup-map-geocode';
import { i18n as appI18n } from '@/i18n';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { AppText } from '@/shared/components/AppText';
import { ENV, hasGoogleMapsApiKey } from '@/shared/config/env';
import { colors, spacing } from '@/theme';

type SearchRouteMapProps = {
  departureLabel: string;
  arrivalLabel: string;
  onReady?: () => void;
};

type ResolvedPoint = {
  latitude: number;
  longitude: number;
  label: string;
};

export const SearchRouteMap = React.memo(function SearchRouteMap({
  departureLabel,
  arrivalLabel,
  onReady,
}: SearchRouteMapProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { currentLanguage } = useLanguage();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [from, setFrom] = React.useState<ResolvedPoint | null>(null);
  const [to, setTo] = React.useState<ResolvedPoint | null>(null);
  const mapRef = React.useRef<MapView | null>(null);
  const onReadyRef = React.useRef(onReady);
  onReadyRef.current = onReady;

  React.useEffect(() => {
    let cancelled = false;

    async function resolveRoute() {
      setLoading(true);
      setError(null);
      setFrom(null);
      setTo(null);

      if (!hasGoogleMapsApiKey()) {
        if (!cancelled) {
          setError(t('dashboard.search.results.mapUnavailable'));
          setLoading(false);
          onReadyRef.current?.();
        }
        return;
      }

      try {
        const [originHits, destinationHits] = await Promise.all([
          searchMapLocations(departureLabel, ENV.googleMapsApiKey, currentLanguage),
          searchMapLocations(arrivalLabel, ENV.googleMapsApiKey, currentLanguage),
        ]);

        const origin = originHits[0];
        const destination = destinationHits[0];

        if (!origin || !destination) {
          if (!cancelled) {
            setError(t('dashboard.search.results.mapUnavailable'));
            setLoading(false);
            onReadyRef.current?.();
          }
          return;
        }

        if (!cancelled) {
          setFrom({
            latitude: origin.latitude,
            longitude: origin.longitude,
            label: departureLabel,
          });
          setTo({
            latitude: destination.latitude,
            longitude: destination.longitude,
            label: arrivalLabel,
          });
          setLoading(false);
          onReadyRef.current?.();
        }
      } catch {
        if (!cancelled) {
          setError(t('dashboard.search.results.mapUnavailable'));
          setLoading(false);
          onReadyRef.current?.();
        }
      }
    }

    void resolveRoute();
    return () => {
      cancelled = true;
    };
  }, [arrivalLabel, currentLanguage, departureLabel, t]);

  const handleMapReady = React.useCallback(() => {
    if (!from || !to || !mapRef.current) {
      return;
    }
    mapRef.current.fitToCoordinates(
      [
        { latitude: from.latitude, longitude: from.longitude },
        { latitude: to.latitude, longitude: to.longitude },
      ],
      {
        edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
        animated: false,
      },
    );
  }, [from, to]);

  React.useEffect(() => {
    handleMapReady();
  }, [handleMapReady]);

  return (
    <View style={styles.root}>
      {from && to ? (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          onMapReady={handleMapReady}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}
        >
          <Marker
            coordinate={{ latitude: from.latitude, longitude: from.longitude }}
            title={from.label}
            pinColor={colors.primary}
          />
          <Marker
            coordinate={{ latitude: to.latitude, longitude: to.longitude }}
            title={to.label}
            pinColor={colors.primary}
          />
          <Polyline
            coordinates={[
              { latitude: from.latitude, longitude: from.longitude },
              { latitude: to.latitude, longitude: to.longitude },
            ]}
            strokeColor={colors.primary}
            strokeWidth={3}
          />
        </MapView>
      ) : null}

      {loading ? (
        <View style={styles.overlay}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}

      {!loading && error ? (
        <View style={styles.overlay}>
          <AppText style={styles.errorText}>{error}</AppText>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    height: 200,
    overflow: 'hidden',
    backgroundColor: colors.background.subtle,
  },
  map: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  errorText: {
    color: colors.text.secondary,
    textAlign: 'center',
    fontSize: 13,
  },
});
