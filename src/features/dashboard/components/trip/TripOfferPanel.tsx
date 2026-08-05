import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Image } from 'expo-image';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { i18n as appI18n } from '@/i18n';
import { getErrorMessage } from '@/services/api/errorMessage';
import { rfqApi } from '@/services/api/rfqApi';
import type {
  RfqOfferStatus,
  RfqOfferVehicleSummary,
  RfqResponderSnapshot,
  RfqSnapshot,
} from '@/services/api/rfqApi.types';
import { AuthTextField } from '@/features/auth/components/AuthTextField';
import { AppBottomSheet } from '@/shared/components/AppBottomSheet';
import { AppDialog } from '@/shared/components/AppDialog';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { colors, radius, spacing } from '@/theme';

import { useVehicles } from '../../context/VehicleContext';
import type { DashboardRootStackParamList } from '../../navigation/dashboardRootTypes';
import type { TripVehicleMode } from '../../types/trip.types';
import type { Vehicle } from '../../types/vehicle.types';
import { TripVehicleSelectStep } from './TripVehicleSelectStep';
import { WhatsAppContactCard } from './WhatsAppContactCard';

export type TripOfferPanelProps = {
  tripId: string;
  vehicleMode: TripVehicleMode;
  vehicleTotalSeats: number | null;
  /** When true, driver must pick one of their vehicles before sending the offer. */
  requiresVehicle?: boolean;
  /** Pre-select this vehicle after returning from the add-vehicle flow. */
  initialVehicleId?: string | null;
  /** Keep the parent listing card in sync after submit / confirm / decline / withdraw. */
  onOfferChange?: (update: {
    rfqStatus: RfqResponderSnapshot['status'];
    myOfferStatus: RfqOfferStatus | null;
    myOfferPrice: string | null;
    counterpartyName: string | null;
    counterpartyPhone: string | null;
  }) => void;
};

const TERMINAL_STATUSES: RfqOfferStatus[] = ['withdrawn', 'declined', 'timed_out', 'lapsed'];

function latestOfferFromSnapshot(snapshot: RfqResponderSnapshot) {
  return (
    snapshot.myOffers.find((offer) => !TERMINAL_STATUSES.includes(offer.status)) ??
    snapshot.myOffers[0] ??
    null
  );
}

function offerUpdateFromSnapshot(snapshot: RfqResponderSnapshot) {
  const latest = latestOfferFromSnapshot(snapshot);
  return {
    rfqStatus: snapshot.status,
    myOfferStatus: latest?.status ?? null,
    myOfferPrice: latest?.price ?? null,
    counterpartyName: snapshot.ownerName ?? null,
    counterpartyPhone: snapshot.ownerPhone ?? null,
  };
}

function OfferStatusBadge({ status, label }: { status: RfqOfferStatus; label: string }): React.ReactElement {
  const isConfirmed = status === 'confirmed';
  const isTerminal = TERMINAL_STATUSES.includes(status);
  const bg = isConfirmed ? colors.accent.green.soft : isTerminal ? colors.background.subtle : colors.primarySoft;
  const text = isConfirmed ? colors.accent.green.text : isTerminal ? colors.text.tertiary : colors.primary;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <AppText weight="semibold" style={[styles.badgeText, { color: text }]}>
        {label}
      </AppText>
    </View>
  );
}

export function OfferVehicleSummaryCard({
  vehicle,
}: {
  vehicle: RfqOfferVehicleSummary | Vehicle;
}): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const isOfferVehicle = 'photoUrl' in vehicle;
  const photoUri = isOfferVehicle
    ? (vehicle.photoViewUrl ?? vehicle.photoUrl)
    : (vehicle.photoDisplayUris?.[0] ?? vehicle.photoUris[0] ?? null);
  const brandModel = [vehicle.brand, vehicle.model].filter(Boolean).join(' ');
  const subtitle = [brandModel, t('vehicles.seatsCount', { count: vehicle.totalSeats })]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.vehicleSummary}>
      <View style={styles.vehicleThumb}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.vehicleThumbImage} contentFit="cover" />
        ) : (
          <FontAwesome name="car" size={18} color={colors.text.tertiary} />
        )}
      </View>
      <View style={styles.vehicleCopy}>
        <AppText weight="semibold" style={styles.vehicleTitle} numberOfLines={1}>
          {vehicle.title}
        </AppText>
        {subtitle ? (
          <AppText style={styles.vehicleSubtitle} numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
        {vehicle.plateNumber ? (
          <AppText style={styles.vehiclePlate} numberOfLines={1}>
            {vehicle.plateNumber}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

export function TripOfferPanel({
  tripId,
  vehicleMode,
  vehicleTotalSeats,
  requiresVehicle = false,
  initialVehicleId = null,
  onOfferChange,
}: TripOfferPanelProps): React.ReactElement | null {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const navigation =
    useNavigation<NativeStackNavigationProp<DashboardRootStackParamList>>();
  const { vehicles, isLoading: vehiclesLoading, refreshVehicles, beginAddVehicle } = useVehicles();
  const isFullPrivate = vehicleMode === 'fullPrivate';

  const [snapshot, setSnapshot] = React.useState<RfqResponderSnapshot | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [seats, setSeats] = React.useState(isFullPrivate ? String(vehicleTotalSeats ?? 1) : '1');
  const [price, setPrice] = React.useState('');
  const [selectedVehicleId, setSelectedVehicleId] = React.useState<string | null>(
    initialVehicleId,
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [withdrawing, setWithdrawing] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = React.useState(false);
  const [confirmDecline, setConfirmDecline] = React.useState(false);
  const [vehiclePickerOpen, setVehiclePickerOpen] = React.useState(false);

  const selectedVehicle = React.useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? null,
    [vehicles, selectedVehicleId],
  );

  const applySnapshot = React.useCallback(
    (result: RfqSnapshot) => {
      const next = result as RfqResponderSnapshot;
      setSnapshot(next);
      onOfferChange?.(offerUpdateFromSnapshot(next));
    },
    [onOfferChange],
  );

  const load = React.useCallback(() => {
    setLoading(true);
    setError(null);
    void rfqApi
      .getSnapshot(tripId)
      .then((result) => applySnapshot(result))
      .catch((err) => setError(getErrorMessage(err, t('dashboard.listings.detail.offer.loadFailed'))))
      .finally(() => setLoading(false));
  }, [applySnapshot, tripId, t]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    if (!requiresVehicle) {
      return;
    }
    void refreshVehicles().catch(() => undefined);
  }, [requiresVehicle, refreshVehicles]);

  React.useEffect(() => {
    if (!requiresVehicle) {
      return;
    }
    if (initialVehicleId) {
      setSelectedVehicleId(initialVehicleId);
      return;
    }
    if (!selectedVehicleId && vehicles.length === 1) {
      setSelectedVehicleId(vehicles[0]!.id);
    }
  }, [requiresVehicle, initialVehicleId, selectedVehicleId, vehicles]);

  if (loading && !snapshot) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!snapshot) {
    return error ? (
      <View style={styles.card}>
        <AppText style={styles.errorText}>{error}</AppText>
        <Button label={t('dashboard.listings.detail.offer.retry')} onPress={load} />
      </View>
    ) : null;
  }

  const activeOffer = snapshot ? latestOfferFromSnapshot(snapshot) : null;
  const hasActionableOffer = activeOffer != null && !TERMINAL_STATUSES.includes(activeOffer.status);
  const isConfirmedOffer = activeOffer?.status === 'confirmed';
  // Offering on a passenger request → viewer is the driver; otherwise passenger.
  const whatsappMessage = requiresVehicle
    ? t('dashboard.listings.detail.contact.messageAsDriver')
    : t('dashboard.listings.detail.contact.messageAsPassenger');
  // Trip creator contact: passenger request → passenger owner; driver listing → driver owner.
  const creatorContactTitle = requiresVehicle
    ? t('dashboard.listings.detail.contact.passengerContact')
    : t('dashboard.listings.detail.contact.driverContact');
  const panelTitle = isConfirmedOffer
    ? t('dashboard.listings.detail.offer.titleConfirmed')
    : t('dashboard.listings.detail.offer.title');

  const seatsNumber = Number(seats);
  const maxSeats = vehicleTotalSeats ?? 50;
  const seatsValid = isFullPrivate || (Number.isInteger(seatsNumber) && seatsNumber >= 1 && seatsNumber <= maxSeats);
  const priceNumber = Number(price);
  const priceValid = price.trim().length > 0 && Number.isFinite(priceNumber) && priceNumber >= 0;
  const vehicleValid = !requiresVehicle || Boolean(selectedVehicleId);
  const canSubmit = seatsValid && priceValid && vehicleValid && !submitting;
  const effectiveSeats = isFullPrivate ? (vehicleTotalSeats ?? 1) : seatsNumber;
  const totalPrice =
    priceValid && seatsValid
      ? isFullPrivate
        ? priceNumber
        : priceNumber * effectiveSeats
      : null;

  const submitOffer = () => {
    if (!canSubmit) {
      return;
    }
    setSubmitting(true);
    setError(null);
    void rfqApi
      .submitOffer(tripId, {
        // Full-private capacity is 1 whole-vehicle slot on the RFQ, not the seat count.
        seats: isFullPrivate ? 1 : seatsNumber,
        price: priceNumber,
        ...(requiresVehicle && selectedVehicleId ? { vehicleId: selectedVehicleId } : {}),
      })
      .then(() => load())
      .catch((err) => setError(getErrorMessage(err, t('dashboard.listings.detail.offer.submitFailed'))))
      .finally(() => setSubmitting(false));
  };

  const withdrawOffer = () => {
    if (!activeOffer) {
      return;
    }
    setWithdrawing(true);
    setError(null);
    void rfqApi
      .withdrawOffer(tripId, activeOffer.id)
      .then((result) => applySnapshot(result))
      .catch((err) => setError(getErrorMessage(err, t('dashboard.listings.detail.offer.withdrawFailed'))))
      .finally(() => {
        setWithdrawing(false);
        setConfirmWithdraw(false);
      });
  };

  const confirmOffer = () => {
    if (!activeOffer) {
      return;
    }
    setConfirming(true);
    setError(null);
    void rfqApi
      .confirmOffer(tripId, activeOffer.id)
      .then((result) => applySnapshot(result))
      .catch((err) => setError(getErrorMessage(err, t('dashboard.listings.detail.responses.actionFailed'))))
      .finally(() => setConfirming(false));
  };

  const declineOffer = () => {
    if (!activeOffer) {
      return;
    }
    setConfirming(true);
    setError(null);
    void rfqApi
      .declineOffer(tripId, activeOffer.id)
      .then((result) => applySnapshot(result))
      .catch((err) => setError(getErrorMessage(err, t('dashboard.listings.detail.responses.actionFailed'))))
      .finally(() => {
        setConfirming(false);
        setConfirmDecline(false);
      });
  };

  const goAddVehicle = () => {
    setVehiclePickerOpen(false);
    beginAddVehicle();
    navigation.navigate('VehicleDetails', {
      mode: 'add',
      returnTo: 'ListingDetail',
      listingTripId: tripId,
    });
  };

  const selectVehicle = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    setVehiclePickerOpen(false);
  };

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <FontAwesome name="tag" size={14} color={colors.primary} />
          <AppText weight="bold" style={styles.title}>
            {panelTitle}
          </AppText>
        </View>

        {error ? <AppText style={styles.errorText}>{error}</AppText> : null}

        {hasActionableOffer && activeOffer ? (
          <View style={styles.statusBlock}>
            {activeOffer.vehicle ? <OfferVehicleSummaryCard vehicle={activeOffer.vehicle} /> : null}
            <View style={styles.statusRow}>
              <View style={styles.statusCopy}>
                {activeOffer.offeredQuantity != null ? (
                  <AppText style={styles.meta}>
                    {t('dashboard.listings.detail.responses.seats', {
                      // Full-private offers hold offeredQuantity=1 (the whole-vehicle
                      // capacity slot) — show the vehicle's real seat count instead.
                      count: isFullPrivate
                        ? (activeOffer.vehicle?.totalSeats ?? vehicleTotalSeats ?? 1)
                        : Number(activeOffer.offeredQuantity),
                    })}
                  </AppText>
                ) : null}
                {activeOffer.price != null ? (
                  <AppText weight="semibold" style={styles.price}>
                    {t('dashboard.listings.card.priceWithCurrency', { price: activeOffer.price })}
                    {!isFullPrivate ? (
                      <AppText style={styles.priceSuffix}>
                        {t('dashboard.listings.pricePerSeatSuffix')}
                      </AppText>
                    ) : null}
                  </AppText>
                ) : null}
              </View>
              <OfferStatusBadge
                status={activeOffer.status}
                label={t(`dashboard.listings.detail.responses.offerStatus.${activeOffer.status}`)}
              />
            </View>
          </View>
        ) : null}

        {hasActionableOffer && activeOffer?.status === 'active' && snapshot.actions.canWithdraw ? (
          <Button
            label={t('dashboard.listings.detail.offer.withdraw')}
            variant="secondary"
            onPress={() => setConfirmWithdraw(true)}
            loading={withdrawing}
            disabled={withdrawing}
          />
        ) : null}

        {hasActionableOffer &&
        activeOffer?.status === 'selected' &&
        (snapshot.actions.canConfirm || snapshot.actions.canDecline) ? (
          <View style={styles.confirmActions}>
            {snapshot.actions.canDecline ? (
              <Button
                label={t('dashboard.listings.detail.offer.decline')}
                variant="secondary"
                onPress={() => setConfirmDecline(true)}
                disabled={confirming}
                style={styles.confirmActionButton}
              />
            ) : null}
            {snapshot.actions.canConfirm ? (
              <Button
                label={t('dashboard.listings.detail.offer.confirm')}
                onPress={confirmOffer}
                loading={confirming}
                disabled={confirming}
                style={styles.confirmActionButton}
              />
            ) : null}
          </View>
        ) : null}

        {!hasActionableOffer && snapshot.actions.canSubmitOffer ? (
          <View style={styles.form}>
            {requiresVehicle ? (
              <View style={styles.vehiclePicker}>
                <AppText weight="semibold" style={styles.vehiclePickerLabel}>
                  {t('dashboard.listings.detail.offer.vehicleLabel')}
                </AppText>
                {selectedVehicle ? (
                  <View style={styles.selectedVehicleBlock}>
                    <OfferVehicleSummaryCard vehicle={selectedVehicle} />
                    <Button
                      label={t('dashboard.listings.detail.offer.changeVehicle')}
                      variant="secondary"
                      onPress={() => setVehiclePickerOpen(true)}
                    />
                  </View>
                ) : (
                  <Button
                    label={t('dashboard.listings.detail.offer.selectVehicle')}
                    variant="secondary"
                    onPress={() => setVehiclePickerOpen(true)}
                  />
                )}
              </View>
            ) : null}
            {!isFullPrivate ? (
              <AuthTextField
                label={t('dashboard.listings.detail.offer.seatsLabel')}
                value={seats}
                onChangeText={setSeats}
                keyboardType="number-pad"
                placeholder={t('dashboard.listings.detail.offer.seatsPlaceholder')}
                dense
              />
            ) : null}
            <AuthTextField
              label={t(
                isFullPrivate
                  ? 'dashboard.listings.detail.offer.priceFullVehicleLabel'
                  : 'dashboard.listings.detail.offer.pricePerSeatLabel',
              )}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
              placeholder={t('dashboard.listings.detail.offer.pricePlaceholder')}
              dense
            />
            {totalPrice != null && !isFullPrivate ? (
              <View style={styles.totalBox}>
                <AppText weight="semibold" style={styles.totalLabel}>
                  {t('dashboard.listings.detail.offer.totalLabel')}
                </AppText>
                <View style={styles.totalCalcRow}>
                  <AppText style={styles.totalCalc}>
                    {t('dashboard.listings.detail.offer.totalCalc', {
                      price: t('dashboard.listings.card.priceWithCurrency', { price: priceNumber }),
                      seats: t('dashboard.listings.detail.responses.seats', {
                        count: effectiveSeats,
                      }),
                    })}
                  </AppText>
                  <AppText weight="bold" style={styles.totalValue}>
                    {t('dashboard.listings.card.priceWithCurrency', { price: totalPrice })}
                  </AppText>
                </View>
              </View>
            ) : null}
            <Button
              label={t('dashboard.listings.detail.offer.submit')}
              onPress={submitOffer}
              loading={submitting}
              disabled={!canSubmit}
            />
          </View>
        ) : null}

        {!hasActionableOffer && !snapshot.actions.canSubmitOffer ? (
          <AppText style={styles.closedText}>{t('dashboard.listings.detail.offer.closed')}</AppText>
        ) : null}
      </View>

      {isConfirmedOffer && snapshot.ownerPhone ? (
        <WhatsAppContactCard
          title={creatorContactTitle}
          icon={requiresVehicle ? 'user' : 'car'}
          name={snapshot.ownerName ?? null}
          phone={snapshot.ownerPhone}
          message={whatsappMessage}
        />
      ) : null}

      <AppBottomSheet
        visible={requiresVehicle && vehiclePickerOpen}
        onClose={() => setVehiclePickerOpen(false)}
        heightRatio={0.75}
      >
        <View style={styles.sheetHeader}>
          <AppText weight="bold" style={styles.sheetTitle}>
            {t('dashboard.listings.detail.offer.selectVehicleTitle')}
          </AppText>
          <Pressable
            onPress={() => setVehiclePickerOpen(false)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t('common.cancel')}
          >
            <FontAwesome name="times" size={18} color={colors.text.secondary} />
          </Pressable>
        </View>
        <ScrollView
          style={styles.sheetScroll}
          contentContainerStyle={styles.sheetScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TripVehicleSelectStep
            vehicles={vehicles}
            isLoading={vehiclesLoading}
            selectedVehicleId={selectedVehicleId}
            onSelectVehicle={selectVehicle}
            onAddVehicle={goAddVehicle}
          />
        </ScrollView>
      </AppBottomSheet>

      <AppDialog
        visible={confirmWithdraw}
        icon="undo"
        title={t('dashboard.listings.detail.offer.withdrawConfirmTitle')}
        message={
          requiresVehicle
            ? t('dashboard.listings.detail.offer.withdrawConfirmBodyNotifyPassenger')
            : t('dashboard.listings.detail.offer.withdrawConfirmBodyNotifyDriver')
        }
        cancelAction={{
          label: t('common.cancel'),
          onPress: () => setConfirmWithdraw(false),
        }}
        confirmAction={{
          label: t('dashboard.listings.detail.offer.withdrawConfirmAction'),
          onPress: withdrawOffer,
        }}
      />

      <AppDialog
        visible={confirmDecline}
        icon="times"
        title={t('dashboard.listings.detail.offer.declineConfirmTitle')}
        message={
          requiresVehicle
            ? t('dashboard.listings.detail.offer.declineConfirmBodyNotifyPassenger')
            : t('dashboard.listings.detail.offer.declineConfirmBodyNotifyDriver')
        }
        cancelAction={{
          label: t('common.cancel'),
          onPress: () => setConfirmDecline(false),
        }}
        confirmAction={{
          label: t('dashboard.listings.detail.offer.decline'),
          onPress: declineOffer,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: spacing.sm,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    fontSize: 15,
    color: colors.text.primary,
  },
  errorText: {
    fontSize: 12,
    color: colors.primary,
  },
  statusBlock: {
    gap: spacing.sm,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  confirmActionButton: {
    flex: 1,
    minHeight: 40,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  statusCopy: {
    gap: 2,
  },
  meta: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  price: {
    fontSize: 15,
    color: colors.text.primary,
  },
  priceSuffix: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  badge: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 11,
  },
  form: {
    gap: spacing.sm,
  },
  vehiclePicker: {
    gap: spacing.xs,
  },
  vehiclePickerLabel: {
    fontSize: 13,
    color: colors.text.primary,
  },
  selectedVehicleBlock: {
    gap: spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
  },
  sheetTitle: {
    fontSize: 17,
    color: colors.text.primary,
  },
  sheetScroll: {
    flex: 1,
  },
  sheetScrollContent: {
    paddingBottom: spacing.lg,
  },
  vehicleSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.background.subtle,
  },
  vehicleThumb: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  vehicleThumbImage: {
    width: '100%',
    height: '100%',
  },
  vehicleCopy: {
    flex: 1,
    gap: 2,
  },
  vehicleTitle: {
    fontSize: 14,
    color: colors.text.primary,
  },
  vehicleSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  vehiclePlate: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  totalBox: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    gap: 2,
  },
  totalLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  totalCalcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  totalCalc: {
    flexShrink: 1,
    fontSize: 13,
    color: colors.text.secondary,
  },
  totalValue: {
    fontSize: 16,
    color: colors.primary,
  },
  closedText: {
    fontSize: 13,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});
