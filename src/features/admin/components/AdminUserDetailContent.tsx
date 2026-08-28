import React from 'react';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatTripDateTime } from '@/features/dashboard/components/trip/dateRangeUtils';
import { i18n as appI18n } from '@/i18n';
import { adminApi, type AdminUserDetail, type IdentityDocumentStatus } from '@/services/api/adminApi';
import { AppDialog } from '@/shared/components/AppDialog';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { ImageGalleryModal } from '@/shared/components/ImageGalleryModal';
import { getErrorMessage } from '@/services/api/errorMessage';
import { useDisplayCurrency } from '@/shared/utils/currency';
import { openWhatsAppChat } from '@/shared/utils/open-whatsapp';
import { colors, radius, spacing } from '@/theme';
import { cardBackShadow } from '@/theme/cardShadow';

const WHATSAPP_GREEN = '#25D366';
const DOC_PHOTO_SIZE = 72;

type AdminUserDetailContentProps = {
  user: AdminUserDetail;
  listRole: 'passenger' | 'driver';
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
  const [expanded, setExpanded] = React.useState(false);

  return (
    <View style={styles.docTile}>
      <Pressable
        onPress={() => setExpanded((open) => !open)}
        style={({ pressed }) => [styles.docHeader, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <AppText weight="bold" style={styles.docTitle}>
          {title}
        </AppText>
        <View style={[styles.docBadge, badgeStyle]}>
          <FontAwesome name={badgeIcon} size={10} color={badgeIconColor} />
          <AppText weight="semibold" style={[styles.docBadgeText, badgeTextStyle]}>
            {statusLabel}
          </AppText>
        </View>
        <FontAwesome
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={12}
          color={colors.text.tertiary}
        />
      </Pressable>

      {expanded ? (
      <>
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
      ) : (
        <AppText style={styles.docEmpty}>{t('admin.users.notVerified')}</AppText>
      )}
      </>
      ) : null}
    </View>
  );
}

export function AdminUserDetailContent({
  user,
  listRole,
  onUserUpdated,
}: AdminUserDetailContentProps): React.ReactElement {
  const { t, i18n } = useTranslation(undefined, { i18n: appI18n });
  const currency = useDisplayCurrency();
  const memberSince = formatTripDateTime(user.createdAt, i18n.language, '—', false);
  const [reviewingDoc, setReviewingDoc] = React.useState<'nic' | 'license' | null>(null);
  const [creditsDraft, setCreditsDraft] = React.useState(String(user.credits));
  const [unitPriceDraft, setUnitPriceDraft] = React.useState(String(user.creditUnitPrice ?? ''));
  const [tripCreateDraft, setTripCreateDraft] = React.useState(
    String(user.tripCreateCredits ?? ''),
  );
  const [bidOfferDraft, setBidOfferDraft] = React.useState(String(user.bidOfferCredits ?? ''));
  const [savingCredits, setSavingCredits] = React.useState(false);
  const [savingPrices, setSavingPrices] = React.useState(false);
  const [creditsErrorKey, setCreditsErrorKey] = React.useState<string | null>(null);
  const [priceErrorKey, setPriceErrorKey] = React.useState<string | null>(null);
  const [creditsOpen, setCreditsOpen] = React.useState(false);
  const [blockOpen, setBlockOpen] = React.useState(false);
  const [blocking, setBlocking] = React.useState(false);
  const [blockError, setBlockError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setCreditsDraft(String(user.credits));
    setUnitPriceDraft(String(user.creditUnitPrice ?? ''));
    setTripCreateDraft(String(user.tripCreateCredits ?? ''));
    setBidOfferDraft(String(user.bidOfferCredits ?? ''));
  }, [user.credits, user.creditUnitPrice, user.tripCreateCredits, user.bidOfferCredits]);

  const nicPhotos = [user.nicFrontViewUrl, user.nicBackViewUrl].filter(
    (url): url is string => Boolean(url),
  );
  const licensePhotos = [user.driverLicenseFrontViewUrl, user.driverLicenseBackViewUrl].filter(
    (url): url is string => Boolean(url),
  );

  const creditsDirty = creditsDraft !== String(user.credits);
  const pricesDirty =
    unitPriceDraft !== String(user.creditUnitPrice ?? '') ||
    tripCreateDraft !== String(user.tripCreateCredits ?? '') ||
    bidOfferDraft !== String(user.bidOfferCredits ?? '');
  const showLicense = listRole === 'driver';
  const isBlocked = user.status === 'SUSPENDED';

  const openWhatsApp = () => {
    void openWhatsAppChat(
      user.phoneE164,
      t('admin.users.whatsappMessage', { name: user.fullName }),
    ).catch(() => undefined);
  };

  const saveCredits = async () => {
    const credits = Number(creditsDraft);
    if (!Number.isInteger(credits) || credits < 0) {
      setCreditsErrorKey('admin.credits.invalid');
      return;
    }

    setSavingCredits(true);
    setCreditsErrorKey(null);
    try {
      const updated = await adminApi.updateCredits(user.id, credits);
      onUserUpdated(updated);
    } catch {
      setCreditsErrorKey('admin.credits.saveFailed');
    } finally {
      setSavingCredits(false);
    }
  };

  const savePrices = async () => {
    const unitPrice = Number(unitPriceDraft);
    const tripCreateCredits = Number(tripCreateDraft);
    const bidOfferCredits = Number(bidOfferDraft);
    if (
      ![unitPrice, tripCreateCredits, bidOfferCredits].every(
        (value) => Number.isInteger(value) && value >= 0,
      )
    ) {
      setPriceErrorKey('admin.credits.settingsInvalid');
      return;
    }

    setSavingPrices(true);
    setPriceErrorKey(null);
    try {
      const updated = await adminApi.updateCredits(user.id, user.credits, {
        unitPrice,
        tripCreateCredits,
        bidOfferCredits,
      });
      onUserUpdated(updated);
    } catch {
      setPriceErrorKey('admin.credits.saveFailed');
    } finally {
      setSavingPrices(false);
    }
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

  const confirmBlock = async () => {
    setBlocking(true);
    setBlockError(null);
    try {
      const updated = await adminApi.setUserBlocked(user.id, !isBlocked);
      onUserUpdated(updated);
      setBlockOpen(false);
    } catch (err) {
      setBlockError(getErrorMessage(err, t('admin.users.detail.blockFailed')));
    } finally {
      setBlocking(false);
    }
  };

  return (
    <>
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

      <View style={styles.shadowCard}>
        <Pressable
          onPress={() => setCreditsOpen((open) => !open)}
          style={({ pressed }) => [styles.sectionHeader, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityState={{ expanded: creditsOpen }}
        >
          <AppText weight="bold" style={styles.docTitle}>
            {t('admin.users.detail.credits')}
          </AppText>
          <FontAwesome
            name={creditsOpen ? 'chevron-up' : 'chevron-down'}
            size={12}
            color={colors.text.tertiary}
          />
        </Pressable>
        {creditsOpen ? (
          <View style={styles.creditsBody}>
            <View style={styles.settingRow}>
              <AppText weight="medium" style={styles.settingLabel}>
                {t('admin.users.detail.totalCredits')}
              </AppText>
              <TextInput
                value={creditsDraft}
                onChangeText={setCreditsDraft}
                keyboardType="number-pad"
                style={styles.settingInput}
              />
              <Pressable
                onPress={() => void saveCredits()}
                disabled={!creditsDirty || savingCredits}
                style={({ pressed }) => [
                  styles.creditsSaveButton,
                  pressed && creditsDirty && styles.pressed,
                  (!creditsDirty || savingCredits) && styles.creditsSaveDisabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('admin.common.save')}
                accessibilityState={{ disabled: !creditsDirty || savingCredits }}
                hitSlop={8}
              >
                <AppText weight="semibold" style={styles.creditsSaveLabel}>
                  {savingCredits ? t('admin.common.saving') : t('admin.common.save')}
                </AppText>
              </Pressable>
            </View>
            {creditsErrorKey ? (
              <AppText style={styles.creditsError}>{t(creditsErrorKey)}</AppText>
            ) : null}

            <View style={styles.settingsGroup}>
              <View style={styles.settingRow}>
                <View style={styles.settingCopy}>
                  <AppText weight="medium" style={styles.settingLabel}>
                    {t('admin.users.detail.creditPrices')}
                  </AppText>
                  <AppText style={styles.settingHint}>
                    {t('admin.users.detail.perCredit')}
                  </AppText>
                </View>
                <View style={styles.priceValue}>
                  <AppText weight="semibold" style={styles.currencyLabel}>
                    {currency}
                  </AppText>
                  <TextInput
                    value={unitPriceDraft}
                    onChangeText={setUnitPriceDraft}
                    keyboardType="number-pad"
                    style={styles.settingInput}
                  />
                </View>
              </View>

              <View style={styles.groupDivider} />

              <AppText weight="medium" style={styles.groupTitle}>
                {t('admin.users.detail.creditsRequired')}
              </AppText>
              <View style={styles.settingRow}>
                <AppText style={styles.settingHint}>{t('admin.users.detail.perRequest')}</AppText>
                <TextInput
                  value={tripCreateDraft}
                  onChangeText={setTripCreateDraft}
                  keyboardType="number-pad"
                  style={styles.settingInput}
                />
              </View>
              <View style={styles.settingRow}>
                <AppText style={styles.settingHint}>{t('admin.users.detail.perBid')}</AppText>
                <TextInput
                  value={bidOfferDraft}
                  onChangeText={setBidOfferDraft}
                  keyboardType="number-pad"
                  style={styles.settingInput}
                />
              </View>

              <Pressable
                onPress={() => void savePrices()}
                disabled={!pricesDirty || savingPrices}
                style={({ pressed }) => [
                  styles.settingsSaveBar,
                  pressed && pricesDirty && styles.pressed,
                  (!pricesDirty || savingPrices) && styles.creditsSaveDisabled,
                ]}
                accessibilityRole="button"
                accessibilityLabel={t('admin.common.save')}
                accessibilityState={{ disabled: !pricesDirty || savingPrices }}
              >
                <AppText weight="semibold" style={styles.settingsSaveBarLabel}>
                  {savingPrices ? t('admin.common.saving') : t('admin.common.save')}
                </AppText>
              </Pressable>
            </View>
            {priceErrorKey ? (
              <AppText style={styles.creditsError}>{t(priceErrorKey)}</AppText>
            ) : null}
          </View>
        ) : null}
      </View>

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

      {blockError ? <AppText style={styles.creditsError}>{blockError}</AppText> : null}
      <Button
        label={isBlocked ? t('admin.users.detail.unblock') : t('admin.users.detail.block')}
        variant={isBlocked ? 'secondary' : 'primary'}
        onPress={() => setBlockOpen(true)}
        loading={blocking}
        disabled={blocking}
      />
    </View>
    <AppDialog
      visible={blockOpen}
      icon={isBlocked ? 'unlock' : 'ban'}
      title={isBlocked ? t('admin.users.detail.unblockTitle') : t('admin.users.detail.blockTitle')}
      message={
        isBlocked ? t('admin.users.detail.unblockMessage') : t('admin.users.detail.blockMessage')
      }
      cancelAction={{
        label: t('common.cancel'),
        onPress: () => setBlockOpen(false),
      }}
      confirmAction={{
        label: isBlocked ? t('admin.users.detail.unblock') : t('admin.users.detail.block'),
        onPress: () => void confirmBlock(),
        loading: blocking,
        disabled: blocking,
      }}
    />
    </>
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
    flex: 1,
    fontSize: 13,
    color: colors.text.secondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pricesDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  creditsBody: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  settingsGroup: {
    backgroundColor: colors.background.subtle,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  groupTitle: {
    fontSize: 13,
    color: colors.text.primary,
  },
  groupDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border.default,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  settingCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  settingLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    color: colors.text.primary,
  },
  settingHint: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    color: colors.text.secondary,
  },
  priceValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingInput: {
    width: 72,
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.white,
    fontSize: 15,
    color: colors.text.primary,
    textAlign: 'center',
  },
  settingsSaveBar: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  settingsSaveBarLabel: {
    fontSize: 13,
    color: colors.white,
  },
  currencyLabel: {
    fontSize: 13,
    color: colors.text.primary,
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
  creditsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  creditsSaveButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  creditsSaveDisabled: {
    opacity: 0.55,
  },
  creditsSaveLabel: {
    fontSize: 12,
    color: colors.white,
  },
  creditsError: {
    color: colors.primary,
    fontSize: 13,
    marginTop: spacing.xs,
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
