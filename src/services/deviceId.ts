import { secureStorage } from '@/services/storage/secureStorage';

function generateDeviceId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `musafir249-${timestamp}-${random}`;
}

let cachedDeviceId: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  const stored = await secureStorage.getDeviceInstallId();
  if (stored) {
    cachedDeviceId = stored;
    return stored;
  }

  const generated = generateDeviceId();
  await secureStorage.setDeviceInstallId(generated);
  cachedDeviceId = generated;
  return generated;
}
