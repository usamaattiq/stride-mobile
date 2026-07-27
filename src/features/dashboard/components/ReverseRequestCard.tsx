import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

import type { ReverseRequest } from '../types/requests.types';

type ReverseRequestCardProps = {
  request: ReverseRequest;
  onPress?: (request: ReverseRequest) => void;
};

export function ReverseRequestCard({
  request,
  onPress,
}: ReverseRequestCardProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const isAuctionCta = request.ctaKey === 'viewDetails';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress?.(request)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.topRow}>
        <View style={styles.badges}>
          {request.kinds.map((kind) => (
            <View
              key={kind}
              style={[
                styles.kindBadge,
                kind === 'auction' ? styles.kindAuction : styles.kindRfq,
              ]}
            >
              <AppText
                weight="bold"
                style={[
                  styles.kindText,
                  kind === 'auction' ? styles.kindTextAuction : styles.kindTextRfq,
                ]}
              >
                {kind === 'auction'
                  ? t('dashboard.home.badgeAuction')
                  : t('dashboard.home.badgeRfq')}
              </AppText>
            </View>
          ))}
        </View>
        <View style={styles.meta}>
          <AppText style={styles.postedAgo}>{request.postedAgo}</AppText>
          <FontAwesome5
            name="bookmark"
            size={14}
            color={request.bookmarked ? colors.primary : colors.text.tertiary}
            solid={Boolean(request.bookmarked)}
          />
        </View>
      </View>

      <View style={styles.main}>
        <View style={styles.left}>
          <View style={styles.routeRow}>
            <AppText weight="bold" style={styles.city}>
              {request.fromCity}
            </AppText>
            <FontAwesome5
              name="exchange-alt"
              size={12}
              color={colors.primary}
              style={styles.routeIcon}
            />
            <AppText weight="bold" style={styles.city}>
              {request.toCity}
            </AppText>
          </View>

          <DetailRow icon="map-marker-alt" text={`${request.fromArea} → ${request.toArea}`} />
          <DetailRow icon="calendar-alt" text={request.dateRange} />
          <DetailRow icon="clock" text={request.timeLabel} />
          <View style={styles.specs}>
            <DetailRow icon="car" text={request.vehicle} compact />
            <DetailRow icon="users" text={request.seats} compact />
            <DetailRow icon="suitcase" text={request.bags} compact />
          </View>
        </View>

        <View style={styles.right}>
          <AppText style={styles.priceLabel}>
            {t(`dashboard.home.${request.priceLabelKey}`)}
          </AppText>
          <AppText weight="bold" style={styles.price}>
            {request.price}
          </AppText>
          <View
            style={[
              styles.statusBadge,
              request.statusBadge.tone === 'danger'
                ? styles.statusDanger
                : request.statusBadge.tone === 'purple'
                  ? styles.statusPurple
                  : styles.statusMuted,
            ]}
          >
            <AppText
              weight="semibold"
              style={[
                styles.statusText,
                request.statusBadge.tone === 'danger'
                  ? styles.statusTextDanger
                  : request.statusBadge.tone === 'purple'
                    ? styles.statusTextPurple
                    : styles.statusTextMuted,
              ]}
            >
              {request.statusBadge.label}
            </AppText>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.footer,
          isAuctionCta ? styles.footerAuction : styles.footerRfq,
        ]}
      >
        <AppText
          weight="medium"
          style={[styles.footerLabel, isAuctionCta ? styles.footerLabelLight : styles.footerLabelDark]}
          numberOfLines={1}
        >
          {request.footerLabel}
        </AppText>
        <View
          style={[
            styles.cta,
            isAuctionCta ? styles.ctaAuction : styles.ctaRfq,
          ]}
        >
          <AppText weight="bold" style={styles.ctaText}>
            {t(`dashboard.home.${request.ctaKey}`)}
          </AppText>
          <FontAwesome5 name="arrow-right" size={11} color={colors.white} />
        </View>
      </View>
    </Pressable>
  );
}

type DetailRowProps = {
  icon: React.ComponentProps<typeof FontAwesome5>['name'];
  text: string;
  compact?: boolean;
};

function DetailRow({ icon, text, compact }: DetailRowProps): React.ReactElement {
  return (
    <View style={[styles.detailRow, compact && styles.detailCompact]}>
      <FontAwesome5 name={icon} size={10} color={colors.text.tertiary} solid />
      <AppText style={styles.detailText} numberOfLines={1}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.96,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xxs,
    flex: 1,
  },
  kindBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  kindAuction: {
    backgroundColor: colors.primarySoft,
  },
  kindRfq: {
    backgroundColor: colors.accent.purple.soft,
  },
  kindText: {
    fontSize: 10,
    letterSpacing: 0.4,
  },
  kindTextAuction: {
    color: colors.primary,
  },
  kindTextRfq: {
    color: colors.accent.purple.text,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  postedAgo: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  main: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  left: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: 2,
  },
  city: {
    fontSize: 16,
    color: colors.text.primary,
  },
  routeIcon: {
    marginTop: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailCompact: {
    flexShrink: 1,
  },
  detailText: {
    flexShrink: 1,
    fontSize: 11,
    color: colors.text.secondary,
  },
  specs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
    minWidth: 96,
  },
  priceLabel: {
    fontSize: 10,
    color: colors.text.tertiary,
  },
  price: {
    fontSize: 14,
    color: colors.text.primary,
  },
  statusBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: radius.sm,
    maxWidth: 110,
  },
  statusDanger: {
    backgroundColor: colors.primarySoft,
  },
  statusPurple: {
    backgroundColor: colors.accent.purple.soft,
  },
  statusMuted: {
    backgroundColor: colors.background.subtle,
  },
  statusText: {
    fontSize: 10,
    textAlign: 'center',
  },
  statusTextDanger: {
    color: colors.primary,
  },
  statusTextPurple: {
    color: colors.accent.purple.text,
  },
  statusTextMuted: {
    color: colors.text.secondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  footerAuction: {
    backgroundColor: colors.primarySoft,
  },
  footerRfq: {
    backgroundColor: colors.accent.purple.soft,
  },
  footerLabel: {
    flex: 1,
    fontSize: 12,
  },
  footerLabelLight: {
    color: colors.primary,
  },
  footerLabelDark: {
    color: colors.accent.purple.text,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  ctaAuction: {
    backgroundColor: colors.primary,
  },
  ctaRfq: {
    backgroundColor: colors.accent.purple.text,
  },
  ctaText: {
    fontSize: 12,
    color: colors.white,
  },
});
