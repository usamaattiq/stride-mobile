import React from 'react';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatTripDateTime } from '@/features/dashboard/components/trip/dateRangeUtils';
import { i18n as appI18n } from '@/i18n';
import { adminApi, type AdminUserDetail, type IdentityDocumentStatus } from '@/services/api/adminApi';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { ImageGalleryModal } from '@/shared/components/ImageGalleryModal';
import { openWhatsAppChat } from '@/shared/utils/open-whatsapp';
import { colors, radius, spacing } from '@/theme';
import { cardBackShadow } from '@/theme/cardShadow';

const WHATSAPP_GREEN = '#25D366';
const DOC_PHOTO_SIZE = 72;

type AdminUserDetailContentProps = {
  user: AdminUserDetail;
  onUserUpdated: (user: AdminUserDetail) => void;
};

function DetailRow({
  icon,
  label,
  value,
  isLast = false,
}: {
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  label: string;
  value: string;
  isLast?: boolean;
}): React.ReactElement {
  return (
    <View style={[styles.detailRow, !isLast && styles.detailRowBorder]}>
      <View style={styles.detailIconWrap}>
        <FontAwesome name={icon} size={14} color={colors.primary} />
      </View>
      <View style={styles.detailCopy}>
        <AppText style={styles.detailLabel}>{label}</AppText>
        <AppText weight="semibold" style={styles.detailValue} numberOfLines={2}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

function DocField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <View style={styles.docField}>
      <AppText style={styles.docFieldLabel}>{label}</AppText>
      {children}
    </View>
  );
}

function DocPhotos({ photos }: { photos: string[] }): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const [galleryIndex, setGalleryIndex] = React.useState<number | null>(null);

  if (!photos.length) {
    return <AppText style={styles.docEmpty}>{t('admin.users.noImage')}</AppText>;
  }

  return (
    <>
      <View style={styles.docPhotoRow}>
        {photos.map((uri, index) => (
          <Pressable
            key={`${uri}-${index}`}
            onPress={() => setGalleryIndex(index)}
            style={({ pressed }) => [styles.docPhotoTile, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Image
              source={{ uri }}
              style={styles.docPhotoImage}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          </Pressable>
        ))}
      </View>
      <ImageGalleryModal
        visible={galleryIndex != null}
        images={photos}
        initialIndex={galleryIndex ?? 0}
        onClose={() => setGalleryIndex(null)}
      />
    </>
  );
}

function DocSection({
  title,
  reviewStatus,
  rejectionReason,
  number,
  photos,
  onApprove,
  onReject,
  reviewing,
}: {
  title: string;
  reviewStatus: IdentityDocumentStatus;
  rejectionReason?: string | null;
  number: string | null;
  photos: string[];
  onApprove: () => void;
  onReject: () => void;
  reviewing: boolean;
}): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  const badgeStyle =
    reviewStatus === 'approved'
      ? styles.docBadgeGreen
      : reviewStatus === 'pending'
        ? styles.docBadgeBlue
        : reviewStatus === 'rejected'
          ? styles.docBadgeRed
          : styles.docBadgeAmber;
  const badgeTextStyle =
    reviewStatus === 'approved'
      ? styles.docTextGreen
      : reviewStatus === 'pending'
        ? styles.docTextBlue
        : reviewStatus === 'rejected'
          ? styles.docTextRed
          : styles.docTextAmber;
  const badgeIcon =
    reviewStatus === 'approved'
      ? 'check'
      : reviewStatus === 'pending'
        ? 'clock-o'
        : reviewStatus === 'rejected'
          ? 'times-circle'
          : 'exclamation-circle';
  const badgeIconColor =
    reviewStatus === 'approved'
      ? colors.accent.green.text
      : reviewStatus === 'pending'
        ? colors.accent.blue.text
        : reviewStatus === 'rejected'
          ? colors.primary
          : colors.accent.amber.text;

  const statusLabel =
    reviewStatus === 'approved'
      ? t('admin.users.verified')
      : reviewStatus === 'pending'
        ? t('admin.users.pendingApproval')
        : reviewStatus === 'rejected'
          ? t('admin.users.rejected')
          : t('admin.users.notVerified');

  const isNotSubmitted = reviewStatus === 'not_submitted';

  return (
    <View style={styles.docTile}>
      <View style={styles.docHeader}>
        <AppText weight="bold" style={styles.docTitle}>
          {title}
        </AppText>
        <View style={[styles.docBadge, badgeStyle]}>
          <FontAwesome name={badgeIcon} size={10} color={badgeIconColor} />
          <AppText weight="semibold" style={[styles.docBadgeText, badgeTextStyle]}>
            {statusLabel}
          </AppText>
        </View>
      </View>

      {!isNotSubmitted ? (
        <>
          <DocField label={t('admin.users.documentNumber')}>
            <AppText weight="semibold" style={styles.docFieldValue}>
              {number?.trim() || '—'}
            </AppText>
          </DocField>

          {rejectionReason?.trim() ? (
            <AppText style={styles.rejectionReason}>
              {`${t('admin.users.rejectionReason')}: ${rejectionReason.trim()}`}
            </AppText>
          ) : null}

          <DocField label={t('admin.users.document')}>
            <DocPhotos photos={photos} />
          </DocField>

          {reviewStatus === 'pending' ? (
            <View style={styles.reviewActions}>
              <Button
                label={t('admin.users.reject')}
                onPress={onReject}
                disabled={reviewing}
                variant="secondary"
                style={styles.reviewButton}
              />
              <Button
                label={t('admin.users.approve')}
                onPress={onApprove}
                disabled={reviewing}
                style={styles.reviewButton}
              />
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

export function AdminUserDetailContent({
  user,
  onUserUpdated,
}: AdminUserDetailContentProps): React.ReactElement {
  const { t, i18n } = useTranslation(undefined, { i18n: appI18n });
  const isDriver = user.role === 'driver';
  const memberSince = formatTripDateTime(user.createdAt, i18n.language, '—', false);
  const [reviewingDoc, setReviewingDoc] = React.useState<'nic' | 'license' | null>(null);

  const nicPhotos = [user.nicFrontViewUrl, user.nicBackViewUrl].filter(
    (url): url is string => Boolean(url),
  );
  const licensePhotos = [user.driverLicenseFrontViewUrl, user.driverLicenseBackViewUrl].filter(
    (url): url is string => Boolean(url),
  );

  const showNic = true;
  const showLicense = isDriver;

  const openWhatsApp = () => {
    void openWhatsAppChat(
      user.phoneE164,
      t('admin.users.whatsappMessage', { name: user.fullName }),
    ).catch(() => undefined);
  };

  const reviewDocument = async (document: 'nic' | 'license', action: 'approve' | 'reject') => {
    setReviewingDoc(document);
    try {
      const updated = await adminApi.reviewDocument(user.id, { document, action });
      onUserUpdated(updated);
    } finally {
      setReviewingDoc(null);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.shadowCard}>
        <AppText weight="bold" style={styles.cardHeading}>
          {t('admin.users.detail.contactInfo')}
        </AppText>
        <DetailRow icon="phone" label={t('admin.users.detail.phone')} value={user.phoneE164} />
        <DetailRow
          icon="envelope"
          label={t('admin.users.detail.email')}
          value={user.email?.trim() || t('admin.users.noEmail')}
        />
        <DetailRow
          icon="map-marker"
          label={t('admin.users.detail.address')}
          value={user.address?.trim() || t('admin.users.noAddress')}
        />
        <DetailRow
          icon="calendar"
          label={t('admin.users.detail.memberSince')}
          value={memberSince}
          isLast
        />
        <Pressable
          onPress={openWhatsApp}
          style={({ pressed }) => [styles.whatsappButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={t('dashboard.listings.detail.contact.whatsappA11y', {
            phone: user.phoneE164,
          })}
        >
          <FontAwesome5 name="whatsapp" size={18} color={colors.white} brand />
          <AppText weight="semibold" style={styles.whatsappLabel}>
            {t('dashboard.listings.detail.contact.whatsapp')}
          </AppText>
        </Pressable>
      </View>

      {showNic ? (
        <DocSection
          title={t('admin.users.nic')}
          reviewStatus={user.documents.nicStatus}
          rejectionReason={user.nicRejectionReason}
          number={user.nicNumber}
          photos={nicPhotos}
          reviewing={reviewingDoc === 'nic'}
          onApprove={() => {
            void reviewDocument('nic', 'approve');
          }}
          onReject={() => {
            void reviewDocument('nic', 'reject');
          }}
        />
      ) : null}
      {showLicense ? (
        <DocSection
          title={t('admin.users.license')}
          reviewStatus={user.documents.licenseStatus}
          rejectionReason={user.licenseRejectionReason}
          number={user.driverLicenseNumber}
          photos={licensePhotos}
          reviewing={reviewingDoc === 'license'}
          onApprove={() => {
            void reviewDocument('license', 'approve');
          }}
          onReject={() => {
            void reviewDocument('license', 'reject');
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  shadowCard: {
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    padding: spacing.md,
    gap: spacing.xxs,
    ...cardBackShadow,
  },
  cardHeading: {
    fontSize: 13,
    color: colors.text.secondary,
    marginBottom: spacing.xxs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs + 2,
  },
  detailRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
  },
  detailIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryMuted,
  },
  detailCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  detailLabel: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  detailValue: {
    fontSize: 14,
    color: colors.text.primary,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: WHATSAPP_GREEN,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  whatsappLabel: {
    color: colors.white,
    fontSize: 15,
  },
  docTile: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    ...cardBackShadow,
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  docTitle: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
  },
  docField: {
    gap: 4,
  },
  docFieldLabel: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  docFieldValue: {
    fontSize: 14,
    color: colors.text.primary,
  },
  docEmpty: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  docPhotoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  docPhotoTile: {
    width: DOC_PHOTO_SIZE,
    height: DOC_PHOTO_SIZE,
    borderRadius: radius.sm,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
  },
  docPhotoImage: {
    width: '100%',
    height: '100%',
  },
  docBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  docBadgeGreen: {
    backgroundColor: colors.accent.green.soft,
  },
  docBadgeBlue: {
    backgroundColor: colors.accent.blue.soft,
  },
  docBadgeAmber: {
    backgroundColor: colors.accent.amber.soft,
  },
  docBadgeRed: {
    backgroundColor: colors.primaryMuted,
  },
  docBadgeText: {
    fontSize: 11,
  },
  docTextGreen: {
    color: colors.accent.green.text,
  },
  docTextBlue: {
    color: colors.accent.blue.text,
  },
  docTextAmber: {
    color: colors.accent.amber.text,
  },
  docTextRed: {
    color: colors.primary,
  },
  rejectionReason: {
    fontSize: 13,
    color: colors.primary,
  },
  reviewActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  reviewButton: {
    flex: 1,
    minHeight: 40,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
});
