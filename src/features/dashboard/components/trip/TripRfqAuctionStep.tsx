import React from 'react';
import { FontAwesome, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthCard } from '@/features/auth/components/AuthCard';
import { AuthTextField } from '@/features/auth/components/AuthTextField';
import { DurationSlider } from '@/features/dashboard/components/trip/DurationSlider';
import { SeatsStepper } from '@/features/dashboard/components/SeatsStepper';
import { useDashboardSession } from '@/features/dashboard/context/DashboardSessionContext';
import type {
  TripDraft,
  TripListingType,
  TripPaymentMethod,
} from '@/features/dashboard/types/trip.types';
import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { colors, radius, spacing } from '@/theme';

type TripRfqAuctionStepProps = {
  draft: TripDraft;
  onChange: (partial: Partial<TripDraft>) => void;
  onContinue: () => void;
};

type SelectCardProps = {
  selected: boolean;
  onPress: () => void;
  title: string;
  description?: string;
  icon: React.ReactNode;
  selectedIcon: React.ReactNode;
  compact?: boolean;
};

function SelectCard({
  selected,
  onPress,
  title,
  description,
  icon,
  selectedIcon,
  compact = false,
}: SelectCardProps): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.selectCard,
        compact && styles.selectCardCompact,
        selected && styles.selectCardSelected,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <FontAwesome name="check" size={9} color={colors.white} /> : null}
      </View>

      <View
        style={[
          styles.selectIcon,
          compact && styles.selectIconCompact,
          selected && styles.selectIconSelected,
        ]}
      >
        {selected ? selectedIcon : icon}
      </View>

      <View style={[styles.selectCopy, compact && styles.selectCopyCompact]}>
        <AppText
          weight="bold"
          style={[styles.selectTitle, compact && styles.selectTitleCompact]}
          numberOfLines={1}
        >
          {title}
        </AppText>
        {description && !compact ? (
          <AppText style={styles.selectDescription}>{description}</AppText>
        ) : null}
      </View>
    </Pressable>
  );
}

function isListingComplete(draft: TripDraft, requirePrice: boolean, requireSeats: boolean): boolean {
  const seatsParsed = Number.parseInt(draft.seats.trim(), 10);
  const seatsValid =
    Number.isInteger(seatsParsed) && seatsParsed >= 1 && seatsParsed <= 50;
  return Boolean(
    draft.listingType &&
      draft.paymentMethod &&
      (!requirePrice || draft.startingPrice.trim().length > 0) &&
      (!requireSeats || seatsValid),
  );
}

function parseTripSeats(value: string): number {
  const seats = Number.parseInt(value.trim(), 10);
  return Number.isInteger(seats) && seats >= 1 ? seats : 1;
}

export function TripRfqAuctionStep({
  draft,
  onChange,
  onContinue,
}: TripRfqAuctionStepProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { user } = useDashboardSession();
  const isPassenger = user.role === 'passenger';
  const auctionAllowed = draft.vehicleMode === 'fullPrivate';

  const listingOptions: Array<{
    id: TripListingType;
    title: string;
    description: string;
    icon: React.ReactNode;
    selectedIcon: React.ReactNode;
  }> = [
    {
      id: 'rfq',
      title: t('trips.create.listingRfq'),
      description: t('trips.create.listingRfqHint'),
      icon: <MaterialCommunityIcons name="file-document-outline" size={18} color={colors.text.tertiary} />,
      selectedIcon: (
        <MaterialCommunityIcons name="file-document-outline" size={18} color={colors.primary} />
      ),
    },
    ...(auctionAllowed
      ? [
          {
            id: 'auction' as const,
            title: t('trips.create.listingAuction'),
            description: t('trips.create.listingAuctionHint'),
            icon: <FontAwesome5 name="gavel" size={15} color={colors.text.tertiary} />,
            selectedIcon: <FontAwesome5 name="gavel" size={15} color={colors.primary} />,
          },
        ]
      : []),
  ];

  React.useEffect(() => {
    if (!auctionAllowed && draft.listingType === 'auction') {
      onChange({ listingType: 'rfq', durationHours: 24 });
    }
  }, [auctionAllowed, draft.listingType, onChange]);

  const paymentOptions: Array<{
    id: TripPaymentMethod;
    title: string;
    icon: React.ReactNode;
    selectedIcon: React.ReactNode;
  }> = [
    {
      id: 'cash',
      title: t('trips.create.paymentCash'),
      icon: <FontAwesome name="money" size={16} color={colors.text.tertiary} />,
      selectedIcon: <FontAwesome name="money" size={16} color={colors.primary} />,
    },
    {
      id: 'online',
      title: t('trips.create.paymentOnline'),
      icon: <FontAwesome name="credit-card" size={15} color={colors.text.tertiary} />,
      selectedIcon: <FontAwesome name="credit-card" size={15} color={colors.primary} />,
    },
    {
      id: 'both',
      title: t('trips.create.paymentBoth'),
      icon: <FontAwesome name="exchange" size={15} color={colors.text.tertiary} />,
      selectedIcon: <FontAwesome name="exchange" size={15} color={colors.primary} />,
    },
  ];

  return (
    <AuthCard>
      <View style={styles.form}>
        <View style={styles.section}>
          <AppText weight="medium" style={styles.sectionLabel}>
            {t('trips.create.listingTypeLabel')}
            <AppText style={styles.required}> *</AppText>
          </AppText>
          <View style={styles.cardsRow}>
            {listingOptions.map((option) => (
              <SelectCard
                key={option.id}
                selected={draft.listingType === option.id}
                onPress={() =>
                  onChange({
                    listingType: option.id,
                    // RFQ uses RMS default expiry (24h) — no user duration control.
                    ...(option.id === 'rfq' ? { durationHours: 24 } : {}),
                    ...(option.id === 'auction' ? { vehicleMode: 'fullPrivate' } : {}),
                  })
                }
                title={option.title}
                description={option.description}
                icon={option.icon}
                selectedIcon={option.selectedIcon}
              />
            ))}
            {!auctionAllowed ? <View style={styles.listingCardSpacer} /> : null}
          </View>
        </View>

        {!isPassenger ? (
          <AuthTextField
            label={t(
              draft.vehicleMode === 'fullPrivate'
                ? 'trips.create.startingPriceFullVehicle'
                : 'trips.create.startingPrice',
            )}
            required
            value={draft.startingPrice}
            onChangeText={(startingPrice) => onChange({ startingPrice })}
            placeholder={t(
              draft.vehicleMode === 'fullPrivate'
                ? 'trips.create.startingPriceFullVehiclePlaceholder'
                : 'trips.create.startingPricePlaceholder',
            )}
            keyboardType="decimal-pad"
            dense
          />
        ) : (
          <SeatsStepper
            label={t('trips.create.seats')}
            required
            value={parseTripSeats(draft.seats)}
            min={1}
            max={50}
            onChange={(seats) => onChange({ seats: String(seats) })}
          />
        )}

        <View style={styles.section}>
          <AppText weight="medium" style={styles.sectionLabel}>
            {t('trips.create.paymentMethodLabel')}
            <AppText style={styles.required}> *</AppText>
          </AppText>
          <View style={styles.cardsRow}>
            {paymentOptions.map((option) => (
              <SelectCard
                key={option.id}
                compact
                selected={draft.paymentMethod === option.id}
                onPress={() => onChange({ paymentMethod: option.id })}
                title={option.title}
                icon={option.icon}
                selectedIcon={option.selectedIcon}
              />
            ))}
          </View>
          <AppText style={styles.helperText}>{t('trips.create.paymentMethodHint')}</AppText>
        </View>

        {draft.listingType === 'auction' ? (
          <DurationSlider
            label={t('trips.create.durationLabel')}
            value={draft.durationHours}
            onChange={(durationHours) => onChange({ durationHours })}
          />
        ) : null}

        <Button
          label={t('common.continue')}
          onPress={onContinue}
          disabled={!isListingComplete(draft, !isPassenger, isPassenger)}
        />
      </View>
    </AuthCard>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.sm,
  },
  section: {
    gap: spacing.xs,
  },
  sectionLabel: {
    fontSize: 13,
    color: colors.text.primary,
  },
  required: {
    fontSize: 13,
    color: colors.primary,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  listingCardSpacer: {
    flex: 1,
  },
  selectCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 96,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    position: 'relative',
  },
  selectCardCompact: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 78,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
    gap: 6,
  },
  selectCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  radio: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.border.strong,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  selectIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectIconCompact: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  selectIconSelected: {
    backgroundColor: colors.white,
  },
  selectCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    paddingRight: spacing.md,
  },
  selectCopyCompact: {
    flex: 0,
    flexGrow: 0,
    width: '100%',
    paddingRight: 0,
    alignItems: 'center',
  },
  selectTitle: {
    fontSize: 14,
    color: colors.text.primary,
  },
  selectTitleCompact: {
    fontSize: 12,
    textAlign: 'center',
  },
  selectDescription: {
    fontSize: 11,
    lineHeight: 15,
    color: colors.text.secondary,
  },
  helperText: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
});
