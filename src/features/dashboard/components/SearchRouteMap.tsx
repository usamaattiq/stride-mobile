import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTranslation } from 'react-i18next';

import { searchMapLocations } from '@/features/auth/utils/signup-map-geocode';
import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { ENV, hasGoogleMapsApiKey } from '@/shared/config/env';
import { colors, spacing } from '@/theme';

import { buildSearchRouteMapHtml } from '../utils/search-route-map';

type SearchRouteMapProps = {
  departureLabel: string;
  arrivalLabel: string;
};

type ResolvedPoint = {
  latitude: number;
  longitude: number;
  label: string;
};

export const SearchRouteMap = React.memo(function SearchRouteMap({
  departureLabel,
  arrivalLabel,
}: SearchRouteMapProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [html, setHtml] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function resolveRoute() {
      setLoading(true);
      setError(null);
      setHtml(null);

      if (!hasGoogleMapsApiKey()) {
        if (!cancelled) {
          setError(t('dashboard.search.results.mapUnavailable'));
          setLoading(false);
        }
        return;
      }

      try {
        const [originHits, destinationHits] = await Promise.all([
          searchMapLocations(departureLabel, ENV.googleMapsApiKey),
          searchMapLocations(arrivalLabel, ENV.googleMapsApiKey),
        ]);

        const origin = originHits[0];
        const destination = destinationHits[0];

        if (!origin || !destination) {
          if (!cancelled) {
            setError(t('dashboard.search.results.mapUnavailable'));
            setLoading(false);
          }
          return;
        }

        const from: ResolvedPoint = {
          latitude: origin.latitude,
          longitude: origin.longitude,
          label: departureLabel,
        };
        const to: ResolvedPoint = {
          latitude: destination.latitude,
          longitude: destination.longitude,
          label: arrivalLabel,
        };

        if (!cancelled) {
          setHtml(buildSearchRouteMapHtml(ENV.googleMapsApiKey, from, to));
        }
      } catch {
        if (!cancelled) {
          setError(t('dashboard.search.results.mapUnavailable'));
          setLoading(false);
        }
      }
    }

    void resolveRoute();
    return () => {
      cancelled = true;
    };
  }, [arrivalLabel, departureLabel, t]);

  return (
    <View style={styles.root}>
      {html ? (
        <WebView
          originWhitelist={['*']}
          source={{ html }}
          style={styles.map}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
          bounces={false}
          setSupportMultipleWindows={false}
          onLoadEnd={() => setLoading(false)}
        />
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
