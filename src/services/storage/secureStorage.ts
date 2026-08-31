import * as SecureStore from 'expo-secure-store';

export type SessionKind = 'user' | 'admin';

const STORAGE_KEYS = {
  accessToken: 'musafir249.auth.accessToken',
  sessionKind: 'musafir249.auth.sessionKind',
  deviceInstallId: 'musafir249.device.installId',
  cachedMpin: 'musafir249.security.cachedMpin',
  pushToken: 'musafir249.push.token',
} as const;

async function getItem(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

async function setItem(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

async function removeItem(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}

export const secureStorage = {
  getAccessToken: (): Promise<string | null> => getItem(STORAGE_KEYS.accessToken),
  setAccessToken: (token: string): Promise<void> => setItem(STORAGE_KEYS.accessToken, token),
  clearAccessToken: (): Promise<void> => removeItem(STORAGE_KEYS.accessToken),

  getSessionKind: (): Promise<SessionKind | null> => getItem(STORAGE_KEYS.sessionKind) as Promise<SessionKind | null>,
  setSessionKind: (kind: SessionKind): Promise<void> => setItem(STORAGE_KEYS.sessionKind, kind),
  clearSessionKind: (): Promise<void> => removeItem(STORAGE_KEYS.sessionKind),

  getDeviceInstallId: (): Promise<string | null> => getItem(STORAGE_KEYS.deviceInstallId),
  setDeviceInstallId: (id: string): Promise<void> => setItem(STORAGE_KEYS.deviceInstallId, id),

  getCachedMpin: (): Promise<string | null> => getItem(STORAGE_KEYS.cachedMpin),
  setCachedMpin: (mpin: string): Promise<void> => setItem(STORAGE_KEYS.cachedMpin, mpin),
  clearCachedMpin: (): Promise<void> => removeItem(STORAGE_KEYS.cachedMpin),

  getPushToken: (): Promise<string | null> => getItem(STORAGE_KEYS.pushToken),
  setPushToken: (token: string): Promise<void> => setItem(STORAGE_KEYS.pushToken, token),
  clearPushToken: (): Promise<void> => removeItem(STORAGE_KEYS.pushToken),
};
