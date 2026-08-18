import type { TFunction } from 'i18next';
import { Linking } from 'react-native';

/** Digits only for wa.me (no +, spaces, or dashes). */
export function whatsAppDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function buildWhatsAppContactMessage(
  t: TFunction,
  params: {
    asDriver: boolean;
    name: string;
    route: string;
    requestId: string;
  },
): string {
  const key = params.asDriver
    ? 'dashboard.listings.detail.contact.messageAsDriver'
    : 'dashboard.listings.detail.contact.messageAsPassenger';
  return t(key, {
    name: params.name.trim() || t('dashboard.listings.detail.contact.fallbackName'),
    route: params.route,
    requestId: params.requestId,
  });
}

export async function openWhatsAppChat(phone: string, message: string): Promise<void> {
  const digits = whatsAppDigits(phone);
  if (!digits) {
    return;
  }
  const url = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
  await Linking.openURL(url);
}
