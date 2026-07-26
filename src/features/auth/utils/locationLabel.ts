export type LocationLabelParts = {
  /** Freely editable portion (street, building, area, etc). */
  addressLine: string;
  /** Second-to-last comma segment — locked once a location is picked. */
  city: string;
  /** Last comma segment — locked once a location is picked. */
  country: string;
};

/**
 * Geocoded labels are comma-separated with city/country as the last two
 * segments (see formatGeocodedAddressLabel). Splitting them lets the address
 * line stay editable while city/country stay pinned until a new location is
 * picked.
 */
export function splitLocationLabel(label: string): LocationLabelParts {
  const parts = label
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return { addressLine: '', city: '', country: '' };
  if (parts.length === 1) return { addressLine: '', city: '', country: parts[0] };
  if (parts.length === 2) return { addressLine: '', city: parts[0], country: parts[1] };

  const country = parts[parts.length - 1];
  const city = parts[parts.length - 2];
  const addressLine = parts.slice(0, parts.length - 2).join(', ');
  return { addressLine, city, country };
}

export function combineLocationLabel(addressLine: string, city: string, country: string): string {
  return [addressLine.trim(), city, country].filter(Boolean).join(', ');
}
