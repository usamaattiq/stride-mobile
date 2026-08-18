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
import { SeatsStepper } from '@/features/dashboard/components/SeatsStepper';
import { AppBottomSheet } from '@/shared/components/AppBottomSheet';
import { AppDialog } from '@/shared/components/AppDialog';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { buildWhatsAppContactMessage } from '@/shared/utils/open-whatsapp';
import { colors, radius, spacing } from '@/theme';

import { useDashboardSession } from '../../context/DashboardSessionContext';
import { useVehicles } from '../../context/VehicleContext';
import type { DashboardRootStackParamList } from '../../navigation/dashboardRootTypes';
import type { TripVehicleMode } from '../../types/trip.types';
import type { Vehicle } from '../../types/vehicle.types';
import { isTerminalListingStatus } from '../../utils/listingFilters';
import { OfferResponseCard, type OfferResponseTagTone } from './OfferResponseCard';
import { TripVehicleSelectStep } from './TripVehicleSelectStep';
import { OfferVehicleDetailSheet, type OfferVehicleDetailSource } from './OfferVehicleDetailSheet';
import { TripMessagingSheet } from './TripMessagingSheet';

export type TripOfferPanelProps = {
  tripId: string;
  routeLabel: string;
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
  onCanWithdrawChange?: (canWithdraw: boolean) => void;
};

export type TripOfferPanelHandle = {
  openWithdrawConfirm: () => void;
};

const TERMINAL_STATUSES: RfqOfferStatus[] = ['withdrawn', 'declined', 'timed_out', 'lapsed'];

function parseQuantity(value: string | null | undefined): number | null {
  if (value == null || value.trim().length === 0) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return Math.floor(parsed);
}

const TAG_TONE_BY_STATUS: Record<RfqOfferStatus, OfferResponseTagTone> = {
  active: 'warning',
  selected: 'selected',
  confirmed: 'confirmed',
  withdrawn: 'muted',
  declined: 'muted',
  timed_out: 'muted',
  lapsed: 'muted',
};

function latestOfferFromSnapshot(snapshot: RfqResponderSnapshot) {
  return snapshot.myOffers.find((offer) => !TERMINAL_STATUSES.includes(offer.status)) ?? null;
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

export function OfferVehicleSummaryCard({
  vehicle,
  onPress,
  headline,
  compact = false,
}: {
  vehicle: RfqOfferVehicleSummary | Vehicle;
  onPress?: () => void;
  headline?: string;
  compact?: boolean;
}): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const isOfferVehicle = 'photoUrl' in vehicle;
  const photoUri = isOfferVehicle
    ? (vehicle.photoViewUrl ?? vehicle.photoUrl)
    : (vehicle.photoDisplayUris?.[0] ?? vehicle.photoUris[0] ?? null);
  const brandModel = [vehicle.brand, vehicle.model].filter(Boolean).join(' ');
  const subtitle = headline
    ? brandModel
    : [brandModel, t('vehicles.seatsCount', { count: vehicle.totalSeats })].filter(Boolean).join(' · ');

  const content = (
    <>
      <View style={[styles.vehicleThumb, compact && styles.vehicleThumbCompact]}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.vehicleThumbImage} contentFit="cover" />
        ) : (
          <FontAwesome name="car" size={compact ? 14 : 18} color={colors.text.tertiary} />
        )}
      </View>
      <View style={styles.vehicleCopy}>
        <AppText weight="semibold" style={styles.vehicleTitle} numberOfLines={1}>
          {headline ?? vehicle.title}
        </AppText>
        {subtitle ? (
          <AppText style={styles.vehicleSubtitle} numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
        {!compact && vehicle.plateNumber ? (
          <AppText style={styles.vehiclePlate} numberOfLines={1}>
            {vehicle.plateNumber}
          </AppText>
        ) : null}
      </View>
      {onPress ? (
        <FontAwesome name="chevron-right" size={12} color={colors.text.tertiary} />
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.vehicleSummary,
          compact && styles.vehicleSummaryCompact,
          pressed && styles.vehicleSummaryPressed,
        ]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={t('dashboard.listings.detail.responses.viewVehicleA11y', {
          title: vehicle.title,
        })}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.vehicleSummary, compact && styles.vehicleSummaryCompact]}>{content}</View>;
}

export const TripOfferPanel = React.forwardRef<TripOfferPanelHandle, TripOfferPanelProps>(
  function TripOfferPanel(
    {
      tripId,
      routeLabel,
      vehicleMode,
      vehicleTotalSeats,
      requiresVehicle = false,
      initialVehicleId = null,
      onOfferChange,
      onCanWithdrawChange,
    },
    ref,
  ): React.ReactElement | null {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { user } = useDashboardSession();
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
  const [confirming, setConfirming] = React.useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = React.useState(false);
  const [confirmDecline, setConfirmDecline] = React.useState(false);
  const [vehiclePickerOpen, setVehiclePickerOpen] = React.useState(false);
  const [vehicleDetail, setVehicleDetail] = React.useState<OfferVehicleDetailSource | null>(null);
  const [chatOpen, setChatOpen] = React.useState(false);

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
    if (!snapshot || isTerminalListingStatus(snapshot.status)) {
      return undefined;
    }
    const timer = setInterval(() => {
      void rfqApi
        .getSnapshot(tripId)
        .then((result) => applySnapshot(result))
        .catch(() => undefined);
    }, 5000);
    return () => clearInterval(timer);
  }, [applySnapshot, snapshot?.status, tripId]);

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

  React.useEffect(() => {
    if (isFullPrivate) {
      return;
    }
    const remaining = parseQuantity(snapshot?.availableQuantity);
    if (remaining == null) {
      return;
    }
    const cap = Math.max(0, Math.min(vehicleTotalSeats ?? 50, remaining));
    const current = Number(seats);
    if (cap >= 1 && Number.isInteger(current) && current > cap) {
      setSeats(String(cap));
    }
  }, [isFullPrivate, seats, snapshot?.availableQuantity, vehicleTotalSeats]);

  const previewOffer = snapshot ? latestOfferFromSnapshot(snapshot) : null;
  const canWithdraw = Boolean(
    snapshot && previewOffer?.status === 'active' && snapshot.actions.canWithdraw,
  );

  React.useEffect(() => {
    onCanWithdrawChange?.(canWithdraw);
    return () => onCanWithdrawChange?.(false);
  }, [canWithdraw, onCanWithdrawChange]);

  React.useImperativeHandle(
    ref,
    () => ({
      openWithdrawConfirm: () => {
        if (canWithdraw) {
          setConfirmWithdraw(true);
        }
      },
    }),
    [canWithdraw],
  );

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
  const whatsappMessage = buildWhatsAppContactMessage(t, {
    asDriver: Boolean(requiresVehicle),
    name: user.fullName,
    route: routeLabel,
    requestId: tripId,
  });
  const panelTitle = isConfirmedOffer
    ? t('dashboard.listings.detail.offer.titleConfirmed')
    : t('dashboard.listings.detail.offer.title');

  const seatsNumber = Number(seats);
  const listedSeats = vehicleTotalSeats ?? 50;
  const remainingSeats = parseQuantity(snapshot.availableQuantity) ?? listedSeats;
  const maxSeats = Math.max(0, Math.min(listedSeats, remainingSeats));
  const seatsValid =
    isFullPrivate ||
    (maxSeats >= 1 && Number.isInteger(seatsNumber) && seatsNumber >= 1 && seatsNumber <= maxSeats);
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
    setError(null);
    void rfqApi
      .withdrawOffer(tripId, activeOffer.id)
      .then((result) => applySnapshot(result))
      .catch((err) => setError(getErrorMessage(err, t('dashboard.listings.detail.offer.withdrawFailed'))))
      .finally(() => {
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

  const ownerPhone = snapshot.ownerPhone?.trim() || null;
  const canDecideOffer =
    activeOffer?.status === 'selected' &&
    (snapshot.actions.canConfirm || snapshot.actions.canDecline);
  const showOfferMessage =
    activeOffer != null &&
    (activeOffer.status === 'active' ||
      activeOffer.status === 'selected' ||
      (activeOffer.status === 'confirmed' && Boolean(ownerPhone)));
  const offerPriceLabel =
    activeOffer?.price != null
      ? t('dashboard.listings.card.priceWithCurrency', { price: activeOffer.price })
      : '';

  return (
    <View style={styles.root}>
      <View style={styles.titleRow}>
        <FontAwesome name="tag" size={14} color={colors.primary} />
        <AppText weight="bold" style={styles.title}>
          {panelTitle}
        </AppText>
      </View>

      {error ? <AppText style={styles.errorText}>{error}</AppText> : null}

      {hasActionableOffer && activeOffer ? (
        <OfferResponseCard
          tag={t(`dashboard.listings.detail.responses.offerStatus.${activeOffer.status}`)}
          tagTone={TAG_TONE_BY_STATUS[activeOffer.status]}
          cardTone={
            activeOffer.status === 'confirmed'
              ? 'confirmed'
              : activeOffer.status === 'selected'
                ? 'selected'
                : 'default'
          }
          name={
            snapshot.ownerName?.trim() || t('dashboard.listings.detail.contact.fallbackName')
          }
          priceLabel={offerPriceLabel}
          showMessage={showOfferMessage}
          onMessagePress={() => setChatOpen(true)}
          vehicle={activeOffer.vehicle}
          onVehiclePress={() => {
            if (activeOffer.vehicle) {
              setVehicleDetail(activeOffer.vehicle);
            }
          }}
          footer={canDecideOffer ? 'decide' : ownerPhone ? 'whatsapp' : null}
          rejectLabel={t('dashboard.listings.detail.offer.decline')}
          acceptLabel={t('dashboard.listings.detail.offer.confirm')}
          onReject={() => setConfirmDecline(true)}
          onAccept={confirmOffer}
          acceptLoading={confirming}
          actionsDisabled={confirming}
          whatsappPhone={ownerPhone}
          whatsappMessage={whatsappMessage}
        />
      ) : null}

      {!hasActionableOffer && snapshot.actions.canSubmitOffer ? (
        <View style={styles.card}>
          <View style={styles.form}>
            {requiresVehicle ? (
              <View style={styles.vehiclePicker}>
                <AppText weight="semibold" style={styles.vehiclePickerLabel}>
                  {t('dashboard.listings.detail.offer.vehicleLabel')}
                </AppText>
                {selectedVehicle ? (
                  <View style={styles.selectedVehicleBlock}>
                    <OfferVehicleSummaryCard
                      vehicle={selectedVehicle}
                      onPress={() => setVehicleDetail(selectedVehicle)}
                    />
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
              <SeatsStepper
                label={t('dashboard.listings.detail.offer.seatsLabel')}
                hint={t('dashboard.listings.detail.offer.seatsRemaining', { count: maxSeats })}
                required
                value={
                  Number.isInteger(seatsNumber) && seatsNumber >= 1
                    ? Math.min(seatsNumber, Math.max(1, maxSeats))
                    : 1
                }
                min={1}
                max={Math.max(1, maxSeats)}
                onChange={(next) => setSeats(String(next))}
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
        </View>
      ) : null}

      {!hasActionableOffer && !snapshot.actions.canSubmitOffer ? (
        <View style={styles.card}>
          <AppText style={styles.closedText}>{t('dashboard.listings.detail.offer.closed')}</AppText>
        </View>
      ) : null}

      <TripMessagingSheet
        visible={chatOpen && activeOffer != null}
        onClose={() => setChatOpen(false)}
        tripId={tripId}
        counterpartyName={snapshot?.ownerName ?? null}
        counterpartyRole={requiresVehicle ? 'passenger' : 'driver'}
        offerId={activeOffer?.id}
      />

      <AppBottomSheet
        visible={requiresVehicle && vehiclePickerOpen}
        onClose={() => setVehiclePickerOpen(false)}
        heightRatio={0.8}
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

      <OfferVehicleDetailSheet
        visible={vehicleDetail != null}
        vehicle={vehicleDetail}
        onClose={() => setVehicleDetail(null)}
      />

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
});

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
  vehicleSummaryPressed: {
    backgroundColor: colors.primarySoft,
  },
  vehicleSummaryCompact: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    gap: spacing.xs,
    backgroundColor: 'transparent',
    borderRadius: radius.sm,
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
  vehicleThumbCompact: {
    width: 40,
    height: 40,
    borderRadius: 8,
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
