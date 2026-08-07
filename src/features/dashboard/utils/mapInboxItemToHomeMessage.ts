import type { TFunction } from 'i18next';

import type { TripConversationInboxItem } from '@/services/api/chatApi.types';
import { cityDisplayName } from '@/shared/utils/city-display-name';

import type { HomeMessage, MessageAvatarTone } from '../types/messages.types';

const AVATAR_TONES: MessageAvatarTone[] = ['purple', 'green', 'pink', 'blue'];

function avatarToneFromId(id: string): MessageAvatarTone {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash + id.charCodeAt(i) * (i + 1)) % AVATAR_TONES.length;
  }
  return AVATAR_TONES[hash] ?? 'purple';
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0]!.charAt(0).toUpperCase();
  }
  return `${parts[0]!.charAt(0)}${parts[1]!.charAt(0)}`.toUpperCase();
}

function formatInboxTime(iso: string, t: TFunction, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMsg = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round((startOfToday.getTime() - startOfMsg.getTime()) / 86_400_000);

  if (dayDiff === 0) {
    return date.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });
  }
  if (dayDiff === 1) {
    return t('dashboard.messages.yesterday');
  }
  if (dayDiff > 1 && dayDiff < 7) {
    return t('dashboard.messages.daysAgo', { count: dayDiff });
  }
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

export function mapInboxItemToHomeMessage(
  item: TripConversationInboxItem,
  t: TFunction,
  locale: string,
): HomeMessage {
  const name =
    item.counterpartyName?.trim() || t('dashboard.listings.detail.contact.fallbackName');
  const departure = cityDisplayName(item.departureCityLabel);
  const arrival = cityDisplayName(item.arrivalCityLabel);
  const activityAt = item.lastMessage?.createdAt ?? item.updatedAt;

  return {
    id: item.id,
    tripId: item.tripId,
    listingType: item.listingType,
    offerId: item.offerId,
    counterpartyId: item.counterpartyId,
    senderName: name,
    preview: item.lastMessage?.body?.trim() || t('dashboard.messages.noPreview'),
    timeLabel: formatInboxTime(activityAt, t, locale),
    unread: item.unread,
    avatar: {
      initials: initialsFromName(name),
      tone: avatarToneFromId(item.counterpartyId),
      ...(item.counterpartyAvatarUrl ? { imageUri: item.counterpartyAvatarUrl } : {}),
    },
    context: {
      kind: item.listingType,
      title: `${departure} → ${arrival}`,
      subtitle:
        item.listingType === 'auction'
          ? t('dashboard.messages.contextAuction')
          : t('dashboard.messages.contextRfq'),
    },
  };
}
