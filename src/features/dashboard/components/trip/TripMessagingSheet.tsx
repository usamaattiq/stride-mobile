import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { chatApi } from '@/services/api/chatApi';
import type { ChatMessageDeliveryStatus, TripChatMessage } from '@/services/api/chatApi.types';
import { getErrorMessage } from '@/services/api/errorMessage';
import { chatSocket } from '@/services/socket/chatSocket';
import { AppBottomSheet } from '@/shared/components/AppBottomSheet';
import { AppText } from '@/shared/components/AppText';
import { useProfileStore } from '@/store/profileStore';
import { colors, radius, spacing } from '@/theme';

export type TripMessagingSheetProps = {
  visible: boolean;
  onClose: () => void;
  tripId: string;
  /** Required when the listing owner opens chat. */
  counterpartyId?: string;
  counterpartyName: string | null;
  /** Optional profile photo for the chat header. */
  counterpartyAvatarUrl?: string | null;
  /** Optional role label under the name (Passenger / Driver). */
  counterpartyRole?: 'passenger' | 'driver' | null;
  /** Required for RFQ threads. */
  offerId?: string;
};

const AVATAR_FALLBACKS = [
  colors.accent.purple.avatar,
  colors.accent.green.avatar,
  colors.accent.pink.avatar,
  colors.accent.blue.avatar,
] as const;

function avatarFallbackColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_FALLBACKS[hash % AVATAR_FALLBACKS.length] ?? colors.accent.purple.avatar;
}

function initialsFromName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return '?';
  }
  // First visible character (works for full names and masked "Ali***").
  return trimmed.charAt(0).toUpperCase();
}

function mergeMessages(existing: TripChatMessage[], incoming: TripChatMessage[]): TripChatMessage[] {
  if (incoming.length === 0) {
    return existing;
  }
  const byId = new Map(existing.map((m) => [m.id, m]));
  for (const message of incoming) {
    byId.set(message.id, message);
  }
  return Array.from(byId.values()).sort((a, b) => {
    const time = a.createdAt.localeCompare(b.createdAt);
    return time !== 0 ? time : a.id.localeCompare(b.id);
  });
}

function DeliveryTicks({
  status,
  isMine,
}: {
  status: ChatMessageDeliveryStatus;
  isMine: boolean;
}): React.ReactElement | null {
  if (!isMine) {
    return null;
  }
  const color = status === 'read' ? '#93C5FD' : 'rgba(255,255,255,0.85)';
  if (status === 'sent') {
    return (
      <View style={styles.ticks}>
        <FontAwesome name="check" size={10} color={color} />
      </View>
    );
  }
  return (
    <View style={styles.ticks}>
      <FontAwesome name="check" size={10} color={color} style={styles.tickBack} />
      <FontAwesome name="check" size={10} color={color} style={styles.tickFront} />
    </View>
  );
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function TripMessagingSheet({
  visible,
  onClose,
  tripId,
  counterpartyId,
  counterpartyName,
  counterpartyAvatarUrl,
  counterpartyRole,
  offerId,
}: TripMessagingSheetProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const myUserId = useProfileStore((s) => s.profile?.id);
  const myUserIdRef = React.useRef(myUserId);
  myUserIdRef.current = myUserId;
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<TripChatMessage[]>([]);
  const [draft, setDraft] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  /** Newest-first for inverted FlatList — opens pinned to the latest message. */
  const listData = React.useMemo(() => [...messages].reverse(), [messages]);

  const titleName =
    counterpartyName?.trim() || t('dashboard.listings.detail.contact.fallbackName');
  const avatarSeed = counterpartyId?.trim() || titleName;
  const avatarInitials = initialsFromName(titleName);
  const avatarColor = avatarFallbackColor(avatarSeed);
  const roleLabel =
    counterpartyRole === 'driver'
      ? t('profile.roles.driver')
      : counterpartyRole === 'passenger'
        ? t('profile.roles.passenger')
        : null;

  const refresh = React.useCallback(
    async (activeConversationId: string, opts?: { silent?: boolean }) => {
      if (!opts?.silent) {
        setLoading(true);
      }
      try {
        const [listed] = await Promise.all([
          chatApi.listMessages(tripId, activeConversationId, { limit: 100 }),
          chatApi.markRead(tripId, activeConversationId).catch(() => undefined),
        ]);
        setMessages((prev) => mergeMessages(opts?.silent ? prev : [], listed));
        setError(null);
      } catch (err) {
        if (!opts?.silent) {
          setError(getErrorMessage(err, t('dashboard.listings.detail.contact.chatLoadFailed')));
        }
      } finally {
        if (!opts?.silent) {
          setLoading(false);
        }
      }
    },
    [t, tripId],
  );

  React.useEffect(() => {
    if (!visible) {
      setConversationId(null);
      setMessages([]);
      setDraft('');
      setError(null);
      setLoading(false);
      setSending(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    void chatApi
      .openConversation(tripId, {
        ...(counterpartyId ? { counterpartyId } : {}),
        ...(offerId ? { offerId } : {}),
      })
      .then(async (conversation) => {
        if (cancelled) {
          return;
        }
        setConversationId(conversation.id);
        await refresh(conversation.id);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoading(false);
          setError(getErrorMessage(err, t('dashboard.listings.detail.contact.chatOpenFailed')));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [visible, tripId, counterpartyId, offerId, refresh, t]);

  React.useEffect(() => {
    if (!visible || !conversationId) {
      return;
    }

    let cancelled = false;
    const unsubMessage = chatSocket.onMessage((message) => {
      if (message.conversationId !== conversationId) {
        return;
      }
      setMessages((prev) => mergeMessages(prev, [message]));
      // Viewing this thread — mark inbound as read so the sender gets live ticks.
      if (message.senderId !== myUserIdRef.current) {
        void chatApi.markRead(tripId, conversationId).catch(() => undefined);
      }
    });
    const unsubStatus = chatSocket.onStatus((payload) => {
      if (payload.conversationId !== conversationId) {
        return;
      }
      setMessages((prev) => mergeMessages(prev, payload.messages));
    });

    void chatSocket
      .joinConversation(tripId, conversationId)
      .then((result) => {
        if (cancelled || result.ok) {
          return;
        }
        setError(result.error ?? t('dashboard.listings.detail.contact.chatOpenFailed'));
      })
      .catch(() => {
        if (!cancelled) {
          setError(t('dashboard.listings.detail.contact.chatOpenFailed'));
        }
      });

    void chatApi.markRead(tripId, conversationId).catch(() => undefined);

    return () => {
      cancelled = true;
      unsubMessage();
      unsubStatus();
      chatSocket.leaveConversation(conversationId);
    };
  }, [visible, conversationId, tripId, t]);

  React.useEffect(() => {
    if (!visible) {
      chatSocket.disconnect();
    }
  }, [visible]);

  const send = () => {
    const text = draft.trim();
    if (!text || !conversationId || sending) {
      return;
    }
    setSending(true);
    setDraft('');
    void chatApi
      .sendMessage(tripId, conversationId, text)
      .then((message) => {
        setMessages((prev) => mergeMessages(prev, [message]));
        setError(null);
      })
      .catch((err) => {
        setDraft(text);
        setError(getErrorMessage(err, t('dashboard.listings.detail.contact.chatSendFailed')));
      })
      .finally(() => setSending(false));
  };

  const renderItem = ({ item }: ListRenderItemInfo<TripChatMessage>) => {
    const isMine = item.senderId === myUserId;
    return (
      <View style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
          <AppText style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{item.body}</AppText>
          <View style={styles.metaRow}>
            <AppText style={[styles.timeText, isMine && styles.timeTextMine]}>
              {formatTime(item.createdAt)}
            </AppText>
            <DeliveryTicks status={item.status} isMine={isMine} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <AppBottomSheet visible={visible} onClose={onClose} heightRatio={0.95}>
      <View style={styles.root}>
        <View style={styles.header}>
          {counterpartyAvatarUrl ? (
            <Image
              source={{ uri: counterpartyAvatarUrl }}
              style={styles.headerAvatar}
              cachePolicy="memory-disk"
              recyclingKey={avatarSeed}
            />
          ) : (
            <View style={[styles.headerAvatar, styles.headerAvatarFallback, { backgroundColor: avatarColor }]}>
              <AppText weight="bold" style={styles.headerAvatarInitial}>
                {avatarInitials}
              </AppText>
            </View>
          )}
          <View style={styles.headerCopy}>
            <AppText weight="bold" style={styles.headerTitle} numberOfLines={1}>
              {titleName}
            </AppText>
            {roleLabel ? (
              <AppText style={styles.headerHint} numberOfLines={1}>
                {roleLabel}
              </AppText>
            ) : null}
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('common.cancel')}
          >
            <FontAwesome name="times" size={18} color={colors.text.secondary} />
          </Pressable>
        </View>

        {loading && messages.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : error && messages.length === 0 ? (
          <View style={styles.centered}>
            <AppText style={styles.errorText}>{error}</AppText>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.centered}>
            <AppText style={styles.emptyText}>
              {t('dashboard.listings.detail.contact.chatEmpty')}
            </AppText>
          </View>
        ) : (
          <FlatList
            style={styles.list}
            data={listData}
            inverted
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          />
        )}

        {error && messages.length > 0 ? (
          <AppText style={styles.inlineError}>{error}</AppText>
        ) : null}

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            placeholder={t('dashboard.listings.detail.contact.chatPlaceholder')}
            placeholderTextColor={colors.text.tertiary}
            multiline
            maxLength={2000}
            editable={Boolean(conversationId) && !loading}
          />
          <Pressable
            onPress={send}
            disabled={!draft.trim() || !conversationId || sending}
            style={({ pressed }) => [
              styles.sendButton,
              (!draft.trim() || !conversationId || sending) && styles.sendButtonDisabled,
              pressed && draft.trim() && conversationId && !sending && styles.sendButtonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={t('dashboard.listings.detail.contact.chatSend')}
          >
            {sending ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <FontAwesome name="send" size={14} color={colors.white} />
            )}
          </Pressable>
        </View>
      </View>
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
  },
  headerAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarInitial: {
    fontSize: 14,
    color: colors.white,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  headerTitle: {
    fontSize: 16,
    color: colors.text.primary,
  },
  headerHint: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingVertical: spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.text.secondary,
    fontSize: 13,
    paddingVertical: spacing.xl,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  bubbleRowMine: {
    justifyContent: 'flex-end',
  },
  bubbleRowTheirs: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: colors.background.subtle,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
  bubbleTextMine: {
    color: colors.white,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  timeText: {
    fontSize: 10,
    color: colors.text.tertiary,
  },
  timeTextMine: {
    color: 'rgba(255,255,255,0.75)',
  },
  ticks: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 16,
    height: 12,
    marginLeft: 2,
  },
  tickBack: {
    position: 'absolute',
    left: 0,
  },
  tickFront: {
    position: 'absolute',
    left: 5,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontSize: 14,
    color: colors.text.primary,
    backgroundColor: colors.white,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonPressed: {
    backgroundColor: colors.primaryPressed,
  },
  sendButtonDisabled: {
    backgroundColor: colors.primaryDisabled,
  },
  errorText: {
    fontSize: 13,
    color: colors.primary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  inlineError: {
    fontSize: 12,
    color: colors.primary,
    paddingBottom: spacing.xs,
  },
});
