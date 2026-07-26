import { ENV } from '@/shared/config/env';

export type ComplianceDocSlug =
  | 'privacy-policy'
  | 'terms-and-conditions'
  | 'child-safety'
  | 'account-deletion';

/** Hosted compliance docs for store listings + in-app legal links. */
export function complianceDocUrl(
  slug: ComplianceDocSlug,
  locale: 'en' | 'ar' = 'en',
): string | null {
  const base = ENV.complianceBaseUrl.replace(/\/+$/, '');
  if (!base) return null;
  return `${base}/${locale}/${slug}.html`;
}

export function hasComplianceBaseUrl(): boolean {
  return ENV.complianceBaseUrl.length > 0;
}
