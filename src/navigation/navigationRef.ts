import { createNavigationContainerRef } from '@react-navigation/native';

import type { AuthStackParamList } from '@/features/auth/navigation/types';

export const navigationRef = createNavigationContainerRef<AuthStackParamList>();

/** Reset to the logged-out entry screen from outside the React tree (e.g. an axios interceptor). */
export function resetToWelcome(): void {
  if (navigationRef.isReady()) {
    navigationRef.reset({ index: 0, routes: [{ name: 'Welcome' }] });
  }
}
