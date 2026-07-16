import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

import type {
  HomeMessage,
  MessageAvatarTone,
  MessageContextKind,
} from '../types/messages.types';

type MessageCardProps = {
  message: HomeMessage;
  onPress?: (message: HomeMessage) => void;
};

const AVATAR_TONES: Record<MessageAvatarTone, string> = {
  purple: colors.accent.purple.avatar,
  green: colors.accent.green.avatar,
  pink: colors.accent.pink.avatar,
  blue: colors.accent.blue.avatar,
};

const CONTEXT_THEME: Record<
  MessageContextKind,
  { soft: string; text: string; icon: React.ComponentProps<typeof FontAwesome>['name'] }
> = {
  request: {
    soft: colors.primarySoft,
    text: colors.primary,
    icon: 'bus',
  },
  booking: {
    soft: colors.accent.blue.soft,
    text: colors.accent.blue.text,
    icon: 'calendar',
  },
  listing: {
    soft: colors.accent.green.soft,
    text: colors.accent.green.text,
    icon: 'list-alt',
  },
};

export function MessageCard({ message, onPress }: MessageCardProps): React.ReactElement {
  const contextTheme = CONTEXT_THEME[message.context.kind];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress?.(message)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.row}>
        {message.avatar.imageUri ? (
          <Image source={{ uri: message.avatar.imageUri }} style={styles.avatar} />
        ) : (
          <View
            style={[
              styles.avatar,
              styles.avatarFallback,
              { backgroundColor: AVATAR_TONES[message.avatar.tone] },
            ]}
          >
            <AppText weight="bold" style={styles.avatarInitial}>
              {message.avatar.initials}
            </AppText>
          </View>
        )}

        <View style={styles.body}>
          <View style={styles.headerRow}>
            <AppText weight="bold" style={styles.name} numberOfLines={1}>
              {message.senderName}
            </AppText>
            <View style={styles.meta}>
              <AppText style={styles.time}>{message.timeLabel}</AppText>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: message.unread
                      ? colors.accent.unread
                      : colors.accent.read,
                  },
                ]}
              />
            </View>
          </View>

          <AppText
            weight={message.unread ? 'medium' : 'regular'}
            style={[styles.preview, message.unread && styles.previewUnread]}
            numberOfLines={2}
          >
            {message.preview}
          </AppText>

          <View style={[styles.context, { backgroundColor: contextTheme.soft }]}>
            <View style={styles.contextIconWrap}>
              <FontAwesome name={contextTheme.icon} size={14} color={contextTheme.text} />
            </View>
            <View style={styles.contextCopy}>
              <AppText
                weight="semibold"
                style={[styles.contextTitle, { color: contextTheme.text }]}
                numberOfLines={1}
              >
                {message.context.title}
              </AppText>
              <AppText style={styles.contextSubtitle} numberOfLines={1}>
                {message.context.subtitle}
              </AppText>
            </View>
            <FontAwesome name="chevron-right" size={12} color={colors.text.tertiary} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    padding: spacing.sm,
  },
  pressed: {
    opacity: 0.92,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 15,
    color: colors.white,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xxs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  time: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
  },
  preview: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.secondary,
  },
  previewUnread: {
    color: colors.text.primary,
  },
  context: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: 2,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
  },
  contextIconWrap: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  contextCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  contextTitle: {
    fontSize: 12,
  },
  contextSubtitle: {
    fontSize: 10,
    color: colors.text.secondary,
  },
});
