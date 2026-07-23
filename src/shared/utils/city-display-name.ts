/**
 * Places/autocomplete labels are often "City, Region, Country".
 * Listing UI should show the city name only.
 */
export function cityDisplayName(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) {
    return trimmed;
  }
  return trimmed.split(',')[0]?.trim() || trimmed;
}
