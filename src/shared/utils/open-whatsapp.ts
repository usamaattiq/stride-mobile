import { Linking } from 'react-native';

/** Digits only for wa.me (no +, spaces, or dashes). */
export function whatsAppDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

export async function openWhatsAppChat(phone: string, message: string): Promise<void> {
  const digits = whatsAppDigits(phone);
  if (!digits) {
    return;
  }
  const url = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
  await Linking.openURL(url);
}
