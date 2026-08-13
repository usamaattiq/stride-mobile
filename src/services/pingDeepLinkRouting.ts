import { useEffect } from 'react';
import { Linking } from 'react-native';
import * as Notifications from 'expo-notifications';

import { navigationRef } from '@/navigation/navigationRef';
import { resolveDeepLinkFromNotificationData } from '@/services/pushNotifications';

const SCHEME = 'musafir249';
const NAV_RETRY_MS = 80;
const NAV_RETRY_TIMEOUT_MS = 12_000;

let pendingDeepLink: string | null = null;
let navRetryTimer: ReturnType<typeof setInterval> | null = null;

function rootRouteName(): string | undefined {
  if (!navigationRef.isReady()) {
    return undefined;
  }
  const state = navigationRef.getRootState();
  return state?.routes[state.index ?? 0]?.name;
}

function canNavigateInDashboard(): boolean {
  return rootRouteName() === 'Dashboard';
}

function stopNavRetry(): void {
  if (navRetryTimer) {
    clearInterval(navRetryTimer);
    navRetryTimer = null;
  }
}

function navigateToListing(tripId: string): void {
  navigationRef.navigate('Dashboard', {
    screen: 'ListingDetail',
    params: { tripId },
    initial: false,
  });
}

function navigateToNotifications(): void {
  navigationRef.navigate('Dashboard', {
    screen: 'MainTabs',
    params: {
      screen: 'Home',
      params: {
        screen: 'HomeMain',
        params: { panel: 'notifications' },
      },
    },
    initial: false,
  });
}

/**
 * Handles `musafir249://listing/<tripId>`, `musafir249://chat/<tripId>/...`,
 * and `musafir249://notifications`.
 */
export function handlePingDeepLink(url: string): void {
  try {
    if (!canNavigateInDashboard()) {
      pendingDeepLink = url;
      ensureNavRetry();
      return;
    }

    pendingDeepLink = null;
    const segments = parsePath(url);
    const target = segments[0];
    const tripId = segments[1];

    if (target === 'listing' && tripId) {
      navigateToListing(tripId);
      return;
    }
    if (target === 'chat' && tripId) {
      navigateToListing(tripId);
      return;
    }
    if (target === 'notifications') {
      navigateToNotifications();
    }
  } catch (error) {
    console.warn('[push] Failed to handle deep link', url, error);
  }
}

/** Opens a queued notification link once Dashboard is on screen. */
export function flushPendingPingDeepLink(): void {
  const url = pendingDeepLink;
  if (!url || !canNavigateInDashboard()) {
    return;
  }
  handlePingDeepLink(url);
}

function ensureNavRetry(): void {
  if (navRetryTimer) {
    return;
  }
  const startedAt = Date.now();
  navRetryTimer = setInterval(() => {
    if (canNavigateInDashboard()) {
      stopNavRetry();
      flushPendingPingDeepLink();
      return;
    }
    if (Date.now() - startedAt > NAV_RETRY_TIMEOUT_MS) {
      stopNavRetry();
    }
  }, NAV_RETRY_MS);
}

function parsePath(url: string): string[] {
  const withoutScheme = url.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
  return withoutScheme.split(/[/?#]/).filter(Boolean);
}

function openFromData(data: Record<string, unknown> | undefined): void {
  const deepLink = resolveDeepLinkFromNotificationData(data);
  if (!deepLink) {
    return;
  }
  handlePingDeepLink(deepLink);
}

/** Subscribe to notification taps + cold-start / linking. Returns unsubscribe. */
export function subscribePingNotificationRouting(): () => void {
  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    openFromData(response.notification.request.content.data as Record<string, unknown>);
  });

  const linkingSub = Linking.addEventListener('url', ({ url }) => {
    if (url.startsWith(`${SCHEME}://`)) {
      handlePingDeepLink(url);
    }
  });

  void Notifications.getLastNotificationResponseAsync().then((last) => {
    if (!last) {
      return;
    }
    openFromData(last.notification.request.content.data as Record<string, unknown> | undefined);
    void Notifications.clearLastNotificationResponseAsync?.();
  });

  void Linking.getInitialURL().then((url) => {
    if (url?.startsWith(`${SCHEME}://`)) {
      handlePingDeepLink(url);
    }
  });

  return () => {
    stopNavRetry();
    responseSub.remove();
    linkingSub.remove();
  };
}

/** Hook wrapper for notification deep-link routing. */
export function usePingNotificationRouting(): void {
  useEffect(() => subscribePingNotificationRouting(), []);
}
