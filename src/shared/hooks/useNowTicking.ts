import * as React from 'react';

/** Re-renders every `intervalMs` while `active`, for countdowns/expiry timers. */
export function useNowTicking(intervalMs: number, active: boolean): number {
  const [now, setNow] = React.useState(() => Date.now());

  React.useEffect(() => {
    if (!active) {
      return undefined;
    }
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, active]);

  return now;
}
