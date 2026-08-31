/**
 * Places/autocomplete labels are often "City, Region, Country".
 * Airport/port search labels are "JED · Airport Name, Jeddah".
 * Listing UI should show the city name only.
 */
export function cityDisplayName(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) {
    return trimmed;
  }

  const terminalMatch = trimmed.match(/^[A-Z0-9]{2,5}\s*[·•]\s*(.+)$/i);
  if (terminalMatch?.[1]) {
    const parts = terminalMatch[1]
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length >= 2) {
      return parts[1];
    }
    return parts[0] || trimmed;
  }

  return trimmed.split(',')[0]?.trim() || trimmed;
}
