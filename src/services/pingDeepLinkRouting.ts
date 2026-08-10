import { useEffect } from 'react';
import { Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import { CommonActions } from '@react-navigation/native';

import { navigationRef } from '@/navigation/navigationRef';
import { resolveDeepLinkFromNotificationData } from '@/services/pushNotifications';

const SCHEME = 'musafir249';

function navigateToListing(tripId: string): void {
  if (!navigationRef.isReady()) {
    return;
  }

  navigationRef.dispatch(
    CommonActions.navigate({
      name: 'Dashboard',
      params: {
        screen: 'ListingDetail',
        params: { tripId },
      },
    }),
  );
}

function parsePath(url: string): string[] {
  // musafir249://listing/abc → host=listing, path=abc  OR path=/listing/abc
  const withoutScheme = url.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
  return withoutScheme.split(/[/?#]/).filter(Boolean);
}

/**
 * Handles `musafir249://listing/<tripId>` and `musafir249://chat/<tripId>/<conversationId>`.
 * Chat taps open the listing detail (messaging sheet lives there).
 */
export function handlePingDeepLink(url: string): void {
  try {
    const segments = parsePath(url);
    if (segments[0] === 'listing' && segments[1]) {
      navigateToListing(segments[1]);
      return;
    }
    if (segments[0] === 'chat' && segments[1]) {
      navigateToListing(segments[1]);
    }
  } catch (error) {
    console.warn('[push] Failed to handle deep link', url, error);
  }
}

/** Subscribe to notification taps + cold-start / linking. Returns unsubscribe. */
export function subscribePingNotificationRouting(): () => void {
  const handled = { current: null as string | null };

  const openFromData = (data: Record<string, unknown> | undefined) => {
    const deepLink = resolveDeepLinkFromNotificationData(data);
    if (!deepLink || handled.current === deepLink) {
      return;
    }
    handled.current = deepLink;
    handlePingDeepLink(deepLink);
  };

  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    openFromData(response.notification.request.content.data as Record<string, unknown>);
  });

  const linkingSub = Linking.addEventListener('url', ({ url }) => {
    if (url.startsWith(`${SCHEME}://`)) {
      handlePingDeepLink(url);
    }
  });

  void Notifications.getLastNotificationResponseAsync().then((last) => {
    openFromData(last?.notification.request.content.data as Record<string, unknown> | undefined);
  });

  void Linking.getInitialURL().then((url) => {
    if (url?.startsWith(`${SCHEME}://`)) {
      handlePingDeepLink(url);
    }
  });

  return () => {
    responseSub.remove();
    linkingSub.remove();
  };
}

/** Hook wrapper for notification deep-link routing. */
export function usePingNotificationRouting(): void {
  useEffect(() => subscribePingNotificationRouting(), []);
}
