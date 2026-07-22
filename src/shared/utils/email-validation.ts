const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns true when empty (optional field) or a well-formed email address. */
export function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }
  return EMAIL_PATTERN.test(trimmed);
}
