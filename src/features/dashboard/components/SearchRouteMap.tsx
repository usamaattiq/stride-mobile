import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTranslation } from 'react-i18next';

import { searchMapLocations } from '@/features/auth/utils/signup-map-geocode';
import { i18n as appI18n } from '@/i18n';
import { useLanguage } from '@/i18n/hooks/useLanguage';
import { locationsApi } from '@/services/api/locationsApi';
import { AppText } from '@/shared/components/AppText';
import { hasGoogleMapsApiKey } from '@/shared/config/env';
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
  const [routeCoordinates, setRouteCoordinates] = React.useState<
    Array<{ latitude: number; longitude: number }> | null
  >(null);
  const [drawnCoordinates, setDrawnCoordinates] = React.useState<
    Array<{ latitude: number; longitude: number }> | null
  >(null);
  const mapRef = React.useRef<MapView | null>(null);
  const onReadyRef = React.useRef(onReady);
  onReadyRef.current = onReady;
  const drawAnimationRef = React.useRef<number | null>(null);

  const animateRouteDraw = React.useCallback(
    (points: Array<{ latitude: number; longitude: number }>) => {
      if (drawAnimationRef.current != null) {
        cancelAnimationFrame(drawAnimationRef.current);
      }

      const durationMs = 1500;
      const startedAt = Date.now();
      // Ease-out: fast start, gentle finish — reads as a path being traced in.
      const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

      const step = () => {
        const elapsed = Date.now() - startedAt;
        const linearProgress = Math.min(1, elapsed / durationMs);
        const progress = easeOutCubic(linearProgress);
        const count = Math.max(2, Math.round(points.length * progress));
        setDrawnCoordinates(points.slice(0, count));

        if (linearProgress < 1) {
          drawAnimationRef.current = requestAnimationFrame(step);
        } else {
          drawAnimationRef.current = null;
        }
      };

      drawAnimationRef.current = requestAnimationFrame(step);
    },
    [],
  );

  React.useEffect(() => {
    return () => {
      if (drawAnimationRef.current != null) {
        cancelAnimationFrame(drawAnimationRef.current);
      }
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    async function resolveRoute() {
      setLoading(true);
      setError(null);
      setFrom(null);
      setTo(null);
      setRouteCoordinates(null);
      setDrawnCoordinates(null);

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
          searchMapLocations(departureLabel, undefined, currentLanguage),
          searchMapLocations(arrivalLabel, undefined, currentLanguage),
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

        if (cancelled) {
          return;
        }

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

        // Wait for the real driving route before animating anything, so the
        // draw-in only happens once, along the actual road path. Falls back
        // to a straight line only if directions aren't available at all.
        locationsApi
          .directions({
            originLat: origin.latitude,
            originLng: origin.longitude,
            destinationLat: destination.latitude,
            destinationLng: destination.longitude,
          })
          .then((directions) => {
            if (cancelled) return;
            if (directions?.points?.length) {
              // Directions snaps start/end to the nearest road, which can
              // sit slightly off the geocoded pin — force the drawn path to
              // touch the markers exactly.
              const points = [
                { latitude: origin.latitude, longitude: origin.longitude },
                ...directions.points,
                { latitude: destination.latitude, longitude: destination.longitude },
              ];
              setRouteCoordinates(points);
              animateRouteDraw(points);
            } else {
              animateRouteDraw([
                { latitude: origin.latitude, longitude: origin.longitude },
                { latitude: destination.latitude, longitude: destination.longitude },
              ]);
            }
          })
          .catch(() => {
            if (!cancelled) {
              animateRouteDraw([
                { latitude: origin.latitude, longitude: origin.longitude },
                { latitude: destination.latitude, longitude: destination.longitude },
              ]);
            }
          });
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
  }, [animateRouteDraw, arrivalLabel, currentLanguage, departureLabel, t]);

  const handleMapReady = React.useCallback(() => {
    if (!from || !to || !mapRef.current) {
      return;
    }
    mapRef.current.fitToCoordinates(
      routeCoordinates ?? [
        { latitude: from.latitude, longitude: from.longitude },
        { latitude: to.latitude, longitude: to.longitude },
      ],
      {
        edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
        animated: true,
      },
    );
  }, [from, to, routeCoordinates]);

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
            pinColor={colors.accent.green.text}
          />
          <Marker
            coordinate={{ latitude: to.latitude, longitude: to.longitude }}
            title={to.label}
            pinColor={colors.primary}
          />
          {drawnCoordinates ? (
            <Polyline
              coordinates={drawnCoordinates}
              strokeColor={colors.primary}
              strokeWidth={3}
            />
          ) : null}
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
