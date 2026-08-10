import * as Location from 'expo-location';

const RETRY_DELAY_MS = 400;

async function sleep(ms: number): Promise<void> {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function readCurrentPositionOnce(accuracy: Location.Accuracy): Promise<Location.LocationObject> {
  return Location.getCurrentPositionAsync({
    accuracy,
    mayShowUserSettingsDialog: true,
  });
}

/**
 * Resolves device coordinates for signup / map recenter. Cold GPS on Android often
 * fails the first one-shot read; retries and last-known fallback avoid a false error.
 */
export async function readDeviceCoordinates(): Promise<{ latitude: number; longitude: number }> {
  const recent = await Location.getLastKnownPositionAsync({ maxAge: 600_000 });
  if (recent) {
    return { latitude: recent.coords.latitude, longitude: recent.coords.longitude };
  }

  const accuracies: Location.Accuracy[] = [
    Location.Accuracy.Low,
    Location.Accuracy.Balanced,
    Location.Accuracy.Low,
  ];

  for (let attempt = 0; attempt < accuracies.length; attempt += 1) {
    try {
      const position = await readCurrentPositionOnce(accuracies[attempt]);
      return { latitude: position.coords.latitude, longitude: position.coords.longitude };
    } catch {
      if (attempt < accuracies.length - 1) {
        await sleep(RETRY_DELAY_MS);
      }
    }
  }

  const lastKnown = await Location.getLastKnownPositionAsync();
  if (lastKnown) {
    return { latitude: lastKnown.coords.latitude, longitude: lastKnown.coords.longitude };
  }

  throw new Error('Unable to read device location');
}
