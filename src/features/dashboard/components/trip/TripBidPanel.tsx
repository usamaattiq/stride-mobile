import React from "react";
import { FontAwesome } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { i18n as appI18n } from "@/i18n";
import { getErrorMessage } from "@/services/api/errorMessage";
import { isApiErrorWithCode } from "@/services/api/apiError";
import { auctionApi } from "@/services/api/auctionApi";
import { creditsApi } from "@/services/api/creditsApi";
import type {
  AuctionParticipantSnapshot,
  AuctionParticipantStatus,
  AuctionPublicSnapshot,
  AuctionStatusValue,
  AuctionType,
} from "@/services/api/auctionApi.types";
import { useLanguage } from "@/i18n/hooks/useLanguage";
import { AppBottomSheet } from "@/shared/components/AppBottomSheet";
import { AppDialog } from "@/shared/components/AppDialog";
import { AppText } from "@/shared/components/AppText";
import { Button } from "@/shared/components/Button";
import { CreditCostBadge } from "@/shared/components/CreditCostBadge";
import { ENV } from "@/shared/config/env";
import { formatPriceAmount, toLatinDigits } from "@/shared/utils/latin-digits";
import { formatPriceWithCurrency, getDisplayCurrency } from "@/shared/utils/currency";
import { refreshSessionProfile } from "@/shared/utils/refresh-session-profile";
import { buildWhatsAppContactMessage } from "@/shared/utils/open-whatsapp";
import { colors, getInputFontFamily, radius, spacing } from "@/theme";
import { cardBackShadow } from "@/theme/cardShadow";

import { useDashboardSession } from "../../context/DashboardSessionContext";
import { useVehicles } from "../../context/VehicleContext";
import type { DashboardRootStackParamList } from "../../navigation/dashboardRootTypes";
import type { Vehicle } from "../../types/vehicle.types";
import { isTerminalListingStatus } from "../../utils/listingFilters";
import {
  AuctionLeadingBidHeader,
  auctionEndsAtMs,
  remainingSecondsUntil,
} from "./AuctionLeadingBidHeader";
import { fromListVehicle, OfferResponseCard } from "./OfferResponseCard";
import { OfferVehicleSummaryCard } from "./TripOfferPanel";
import { TripVehicleSelectStep } from "./TripVehicleSelectStep";
import {
  OfferVehicleDetailSheet,
  type OfferVehicleDetailSource,
} from "./OfferVehicleDetailSheet";
import { TripMessagingSheet } from "./TripMessagingSheet";

export type TripBidPanelProps = {
  tripId: string;
  /** Public listing code shown in WhatsApp prefill (e.g. AUC-2026-0001). */
  referenceCode?: string | null;
  routeLabel: string;
  isPassengerRequest?: boolean;
  /** When true, driver must pick one of their vehicles before placing a bid. */
  requiresVehicle?: boolean;
  /** Pre-select this vehicle after returning from add-vehicle flow. */
  initialVehicleId?: string | null;
  /** Listing window from the trip — used when auction snapshot has no remaining_seconds. */
  listingStartsAtMs?: number | null;
  listingExpiresAtMs?: number | null;
  onBidChange?: (update: {
    auctionStatus: AuctionStatusValue;
    auctionStatusLabel: string;
    auctionStatusVariant: "muted" | "accent" | "warning" | "success";
    myBidStatus: AuctionParticipantStatus | null;
    myBidAmount: number | null;
    counterpartyName: string | null;
    counterpartyPhone: string | null;
  }) => void;
  onCanWithdrawChange?: (canWithdraw: boolean) => void;
  /** Render the amount field outside this panel (fixed screen footer). */
  pinComposer?: boolean;
  onPinnedComposerChange?: (composer: React.ReactNode | null) => void;
};

export type TripBidPanelHandle = {
  openWithdrawConfirm: () => void;
};

function formatAmount(amount: number | null | undefined): string {
  if (amount == null) {
    return "—";
  }
  return formatPriceWithCurrency(amount);
}

function BidComposerBar({
  amount,
  onAmountChange,
  placeholder,
  submitLabel,
  submitting,
  disabled,
  hint,
  error,
  onSubmit,
  creditCost,
}: {
  amount: string;
  onAmountChange: (text: string) => void;
  placeholder: string;
  submitLabel: string;
  submitting: boolean;
  disabled?: boolean;
  hint?: string | null;
  error?: string | null;
  onSubmit: () => void;
  creditCost: number;
}): React.ReactElement {
  const { currentLanguage } = useLanguage();
  const fontFamily = getInputFontFamily(currentLanguage, "number-pad");

  return (
    <View style={styles.composer}>
      {hint ? (
        <AppText style={styles.composerHint} numberOfLines={1}>
          {hint}
        </AppText>
      ) : null}
      <View style={styles.composerRow}>
        <TextInput
          value={toLatinDigits(amount)}
          onChangeText={(text) => onAmountChange(toLatinDigits(text).replace(/[^\d]/g, ""))}
          keyboardType="number-pad"
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
          style={[styles.composerInput, { fontFamily }]}
          editable={!submitting}
        />
        <Pressable
          onPress={onSubmit}
          accessibilityRole="button"
          accessibilityLabel={`${submitLabel}, ${creditCost}`}
          disabled={disabled || submitting}
          style={({ pressed }) => [
            styles.composerSend,
            (disabled || submitting) && styles.composerSendDisabled,
            pressed && !disabled && !submitting && styles.composerSendPressed,
          ]}
        >
          {submitting ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <View style={styles.composerSendContent}>
              <AppText weight="bold" style={styles.composerSendLabel}>
                {submitLabel}
              </AppText>
              <CreditCostBadge count={creditCost} />
            </View>
          )}
        </Pressable>
      </View>
      {error ? <AppText style={styles.errorText}>{error}</AppText> : null}
    </View>
  );
}

function BidHeader({
  remainingSeconds,
  currentAmount,
  auctionType,
  myBidAmount = null,
  ownerName = null,
  showMessage = false,
  onMessagePress,
}: {
  remainingSeconds: number | null;
  currentAmount: number;
  auctionType: AuctionType;
  myBidAmount?: number | null;
  ownerName?: string | null;
  showMessage?: boolean;
  onMessagePress?: () => void;
}): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const yourBidLabel =
    myBidAmount != null
      ? t("dashboard.listings.detail.bid.yourBid", {
          amount: formatAmount(myBidAmount),
        })
      : null;
  const ownerLabel =
    ownerName?.trim() ||
    (showMessage ? t("dashboard.listings.detail.contact.fallbackName") : null);
  const ownerInitial = (ownerLabel ?? "?").charAt(0).toUpperCase();

  return (
    <View style={styles.headerBlock}>
      {ownerLabel || showMessage ? (
        <View style={styles.ownerTile}>
          <View style={styles.ownerIdentity}>
            <View style={styles.ownerAvatar}>
              <AppText weight="bold" style={styles.ownerAvatarInitial}>
                {ownerInitial}
              </AppText>
            </View>
            <AppText
              weight="semibold"
              style={styles.ownerName}
              numberOfLines={1}
            >
              {ownerLabel ??
                t("dashboard.listings.detail.contact.fallbackName")}
            </AppText>
          </View>
          {showMessage ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t(
                "dashboard.listings.detail.contact.messageA11y",
              )}
              onPress={onMessagePress}
              style={({ pressed }) => [
                styles.headerMessageChip,
                pressed && styles.headerMessageChipPressed,
              ]}
            >
              <FontAwesome name="comment" size={11} color={colors.white} />
              <AppText weight="bold" style={styles.headerMessageLabel}>
                {t("dashboard.listings.detail.contact.message")}
              </AppText>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      <AuctionLeadingBidHeader
        auctionType={auctionType}
        currentAmount={currentAmount}
        remainingSeconds={remainingSeconds}
        trailing={
          yourBidLabel ? (
            <View style={styles.yourBidChip}>
              <AppText
                weight="semibold"
                style={styles.yourBidChipText}
                numberOfLines={1}
              >
                {yourBidLabel}
              </AppText>
            </View>
          ) : null
        }
      />
    </View>
  );
}

function bidUpdateFromSnapshot(snapshot: AuctionParticipantSnapshot) {
  return {
    auctionStatus: snapshot.status,
    auctionStatusLabel: snapshot.statusLabel,
    auctionStatusVariant: snapshot.statusVariant,
    myBidStatus: snapshot.participantStatus,
    myBidAmount: snapshot.myPeakAmount,
    counterpartyName: snapshot.ownerName ?? null,
    counterpartyPhone: snapshot.ownerPhone ?? null,
  };
}

function nextBidHint(
  auctionType: AuctionType,
  minNextAmount: number | null | undefined,
  currentAmount: number,
  t: TFunction,
): string {
  if (auctionType === "reverse") {
    const ceiling = currentAmount > 0 ? currentAmount : minNextAmount;
    return ceiling != null && ceiling > 1
      ? t("dashboard.listings.detail.bid.maxNext", {
          currency: getDisplayCurrency(),
          amount: formatPriceAmount(ceiling),
        })
      : t("dashboard.listings.detail.bid.amountPlaceholder");
  }
  return minNextAmount != null
    ? t("dashboard.listings.detail.bid.minNext", {
        currency: getDisplayCurrency(),
        amount: formatPriceAmount(minNextAmount),
      })
    : t("dashboard.listings.detail.bid.amountPlaceholder");
}

export const TripBidPanel = React.forwardRef<
  TripBidPanelHandle,
  TripBidPanelProps
>(function TripBidPanel(
  {
    tripId,
    referenceCode,
    routeLabel,
      isPassengerRequest = false,
      requiresVehicle = false,
      initialVehicleId = null,
    listingStartsAtMs = null,
    listingExpiresAtMs = null,
    onBidChange,
    onCanWithdrawChange,
    pinComposer = false,
    onPinnedComposerChange,
  },
  ref,
): React.ReactElement | null {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const { user } = useDashboardSession();
  const navigation =
    useNavigation<NativeStackNavigationProp<DashboardRootStackParamList>>();
  const {
    vehicles,
    isLoading: vehiclesLoading,
    refreshVehicles,
    beginAddVehicle,
  } = useVehicles();
  const [snapshot, setSnapshot] =
    React.useState<AuctionParticipantSnapshot | null>(null);
  const [publicSnapshot, setPublicSnapshot] =
    React.useState<AuctionPublicSnapshot | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [amount, setAmount] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [confirmWithdraw, setConfirmWithdraw] = React.useState(false);
  const [confirmDecline, setConfirmDecline] = React.useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = React.useState<
    string | null
  >(initialVehicleId);
  const [vehiclePickerOpen, setVehiclePickerOpen] = React.useState(false);
  const [vehicleDetail, setVehicleDetail] =
    React.useState<OfferVehicleDetailSource | null>(null);
  const [chatOpen, setChatOpen] = React.useState(false);
  const [bidOfferCredits, setBidOfferCredits] = React.useState(ENV.bidOfferCredits);
  const amountTouchedRef = React.useRef(false);

  React.useEffect(() => {
    void creditsApi
      .getCatalog()
      .then((catalog) => {
        if (Number.isFinite(catalog.bidOfferCredits)) {
          setBidOfferCredits(catalog.bidOfferCredits);
        }
      })
      .catch(() => undefined);
  }, []);
  const selectedVehicle = React.useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? null,
    [selectedVehicleId, vehicles],
  );

  const whatsappMessage = buildWhatsAppContactMessage(t, {
    asDriver: isPassengerRequest,
    name: user.fullName,
    route: routeLabel,
    ref: referenceCode?.trim() || tripId,
  });

  const applySnapshot = React.useCallback(
    (
      result: AuctionParticipantSnapshot,
      options?: { seedAmount?: boolean },
    ) => {
      setSnapshot(result);
      setPublicSnapshot(null);
      onBidChange?.(bidUpdateFromSnapshot(result));
      // Only prefill once — polling must not clobber what the user is typing.
      // Reverse auctions report minNextAmount=1, which was resetting the field to "1".
      if (
        options?.seedAmount &&
        !amountTouchedRef.current &&
        result.auctionType === "forward" &&
        result.minNextAmount != null &&
        !result.hasParticipated
      ) {
        setAmount(String(result.minNextAmount));
      }
    },
    [onBidChange],
  );

  const handleAmountChange = React.useCallback((text: string) => {
    amountTouchedRef.current = true;
    setAmount(text.replace(/[^\d]/g, ""));
  }, []);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(null);
    void auctionApi
      .getSnapshot(tripId)
      .then((result) => {
        if (result.role === "owner") {
          setError(t("dashboard.listings.detail.bid.loadFailed"));
          return;
        }
        if (result.role === "public") {
          setSnapshot(null);
          setPublicSnapshot(result);
          setError(null);
          return;
        }
        applySnapshot(result, { seedAmount: true });
      })
      .catch((err) =>
        setError(
          getErrorMessage(err, t("dashboard.listings.detail.bid.loadFailed")),
        ),
      )
      .finally(() => setLoading(false));
  }, [applySnapshot, t, tripId]);

  React.useEffect(() => {
    amountTouchedRef.current = false;
    setAmount("");
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

  // Poll while live so countdown / lead status stay fresh without a WS client.
  React.useEffect(() => {
    const isOpen =
      snapshot != null && !isTerminalListingStatus(snapshot.status);
    const publicOpen =
      publicSnapshot != null && !isTerminalListingStatus(publicSnapshot.status);
    if (!isOpen && !publicOpen) {
      return undefined;
    }
    const timer = setInterval(() => {
      void auctionApi
        .getSnapshot(tripId)
        .then((result) => {
          if (result.role === "participant") {
            applySnapshot(result);
          } else if (result.role === "public") {
            setPublicSnapshot(result);
          }
        })
        .catch(() => undefined);
    }, 5000);
    return () => clearInterval(timer);
  }, [applySnapshot, publicSnapshot?.status, snapshot?.status, tripId]);

  const [nowMs, setNowMs] = React.useState(() => Date.now());
  const endsAtMs =
    auctionEndsAtMs(snapshot) ??
    auctionEndsAtMs(publicSnapshot) ??
    listingExpiresAtMs ??
    null;
  const listingStarted =
    listingStartsAtMs == null || listingStartsAtMs <= nowMs;
  const liveRemaining = listingStarted
    ? remainingSecondsUntil(endsAtMs, nowMs)
    : null;

  React.useEffect(() => {
    if (endsAtMs == null || endsAtMs <= Date.now()) {
      return undefined;
    }
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [endsAtMs]);

  const canWithdraw = Boolean(snapshot?.actions.canWithdraw);

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

  const placeBid = React.useCallback(() => {
    if (requiresVehicle && !selectedVehicleId) {
      setError(t("dashboard.listings.detail.offer.selectVehicle"));
      return;
    }
    const parsed = Math.round(Number(amount.replace(/[^\d]/g, "")));
    if (!Number.isFinite(parsed) || parsed < 1) {
      setError(t("dashboard.listings.detail.bid.invalidAmount"));
      return;
    }
    setSubmitting(true);
    setError(null);
    void auctionApi
      .placeBid(tripId, {
        amount: parsed,
        ...(requiresVehicle && selectedVehicleId ? { vehicleId: selectedVehicleId } : {}),
      })
      .then((result) => {
        if (result.role === "participant") {
          amountTouchedRef.current = false;
          setAmount("");
          applySnapshot(result);
        }
        void refreshSessionProfile();
      })
      .catch((err) =>
        setError(
          isApiErrorWithCode(err, "INSUFFICIENT_CREDITS")
            ? t("common.insufficientCredits")
            : getErrorMessage(err, t("dashboard.listings.detail.bid.submitFailed")),
        ),
      )
      .finally(() => setSubmitting(false));
  }, [amount, applySnapshot, requiresVehicle, selectedVehicleId, t, tripId]);

  const publicCanBid =
    publicSnapshot != null && !isTerminalListingStatus(publicSnapshot.status);
  const participantCanBid = snapshot?.actions.canPlaceBid === true;
  const canCompose = publicCanBid || participantCanBid;
  const composerHint = snapshot
    ? nextBidHint(snapshot.auctionType, snapshot.minNextAmount, snapshot.currentAmount, t)
    : publicSnapshot
      ? nextBidHint(publicSnapshot.auctionType, null, publicSnapshot.currentAmount, t)
      : t("dashboard.listings.detail.bid.amountPlaceholder");
  const composerSubmitLabel =
    snapshot && (snapshot.hasParticipated || snapshot.participantStatus === "active")
      ? t("dashboard.listings.detail.bid.update")
      : t("dashboard.listings.detail.bid.submit");
  const composerDisabled = requiresVehicle && !selectedVehicleId;

  React.useLayoutEffect(() => {
    if (!pinComposer) {
      return undefined;
    }
    if (!canCompose) {
      onPinnedComposerChange?.(null);
      return () => onPinnedComposerChange?.(null);
    }
    onPinnedComposerChange?.(
      <BidComposerBar
        amount={amount}
        onAmountChange={handleAmountChange}
        placeholder={t("dashboard.listings.detail.bid.amountPlaceholder")}
        hint={composerHint}
        submitLabel={composerSubmitLabel}
        submitting={submitting}
        disabled={composerDisabled}
        error={error}
        onSubmit={placeBid}
        creditCost={bidOfferCredits}
      />,
    );
    return () => onPinnedComposerChange?.(null);
  }, [
    amount,
    bidOfferCredits,
    canCompose,
    composerDisabled,
    composerHint,
    composerSubmitLabel,
    error,
    handleAmountChange,
    onPinnedComposerChange,
    pinComposer,
    placeBid,
    submitting,
    t,
  ]);

  const goAddVehicle = () => {
    setVehiclePickerOpen(false);
    beginAddVehicle();
    navigation.navigate("VehicleDetails", {
      mode: "add",
      returnTo: "ListingDetail",
      listingTripId: tripId,
    });
  };

  const runAction = (action: "withdraw" | "confirm" | "decline") => {
    setSubmitting(true);
    setError(null);
    const request =
      action === "withdraw"
        ? auctionApi.withdraw
        : action === "confirm"
          ? auctionApi.confirm
          : auctionApi.decline;
    void request(tripId)
      .then((result) => {
        if (result.role === "participant") {
          if (action === "withdraw") {
            amountTouchedRef.current = false;
            setAmount("");
          }
          applySnapshot(result);
        }
      })
      .catch((err) =>
        setError(
          getErrorMessage(err, t("dashboard.listings.detail.bid.actionFailed")),
        ),
      )
      .finally(() => {
        setSubmitting(false);
        setConfirmWithdraw(false);
        setConfirmDecline(false);
      });
  };

  if (loading && !snapshot && !publicSnapshot) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error && !snapshot && !publicSnapshot) {
    return (
      <View style={styles.centered}>
        <AppText style={styles.errorText}>{error}</AppText>
        <Button
          label={t("dashboard.listings.detail.bid.retry")}
          onPress={load}
        />
      </View>
    );
  }

  if (!snapshot && publicSnapshot) {
    return (
      <View style={styles.root}>
        <BidHeader
          remainingSeconds={liveRemaining}
          currentAmount={publicSnapshot.currentAmount}
          auctionType={publicSnapshot.auctionType}
        />
        <AppText style={styles.meta}>
          {t("dashboard.listings.detail.bid.openHint")}
        </AppText>
        {error && !pinComposer ? (
          <AppText style={styles.errorText}>{error}</AppText>
        ) : null}
        {requiresVehicle ? (
          <View style={styles.vehiclePicker}>
            <AppText weight="semibold" style={styles.vehiclePickerLabel}>
              {t("dashboard.listings.detail.offer.vehicleLabel")}
            </AppText>
            {selectedVehicle ? (
              <View style={styles.selectedVehicleBlock}>
                <OfferVehicleSummaryCard
                  vehicle={selectedVehicle as Vehicle}
                  onPress={() => setVehicleDetail(selectedVehicle)}
                />
                <Button
                  label={t("dashboard.listings.detail.offer.changeVehicle")}
                  variant="secondary"
                  onPress={() => setVehiclePickerOpen(true)}
                />
              </View>
            ) : (
              <Button
                label={t("dashboard.listings.detail.offer.selectVehicle")}
                variant="secondary"
                onPress={() => setVehiclePickerOpen(true)}
              />
            )}
          </View>
        ) : null}
        {!pinComposer ? (
          <BidComposerBar
            amount={amount}
            onAmountChange={handleAmountChange}
            placeholder={t("dashboard.listings.detail.bid.amountPlaceholder")}
            hint={nextBidHint(
              publicSnapshot.auctionType,
              null,
              publicSnapshot.currentAmount,
              t,
            )}
            submitLabel={t("dashboard.listings.detail.bid.submit")}
            submitting={submitting}
            disabled={requiresVehicle && !selectedVehicleId}
            error={error}
            onSubmit={placeBid}
            creditCost={bidOfferCredits}
          />
        ) : null}
        <AppBottomSheet
          visible={requiresVehicle && vehiclePickerOpen}
          onClose={() => setVehiclePickerOpen(false)}
          heightRatio={0.8}
        >
          <View style={styles.sheetHeader}>
            <AppText weight="bold" style={styles.sheetTitle}>
              {t("dashboard.listings.detail.offer.selectVehicleTitle")}
            </AppText>
            <Pressable
              onPress={() => setVehiclePickerOpen(false)}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t("common.cancel")}
            >
              <FontAwesome
                name="times"
                size={18}
                color={colors.text.secondary}
              />
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
              onSelectVehicle={(vehicleId) => {
                setSelectedVehicleId(vehicleId);
                setVehiclePickerOpen(false);
              }}
              onAddVehicle={goAddVehicle}
            />
          </ScrollView>
        </AppBottomSheet>
        <OfferVehicleDetailSheet
          visible={vehicleDetail != null}
          vehicle={vehicleDetail}
          onClose={() => setVehicleDetail(null)}
        />
      </View>
    );
  }

  if (!snapshot) {
    return <View />;
  }

  const actions = snapshot.actions;
  const hasActiveBid = snapshot.participantStatus === "active";
  const showPlaceBidForm = actions.canPlaceBid;
  const isUpdatingBid = hasActiveBid || snapshot.hasParticipated;
  const auctionStatus = snapshot.status.replaceAll("_", "-");
  const isSelectedBidder =
    actions.isSelectedParticipant === true ||
    auctionStatus === "awaiting-your-confirmation";
  const isConfirmedBid =
    auctionStatus === "completed" &&
    Boolean(snapshot.confirmedParticipantId) &&
    isSelectedBidder;
  const ownerPhone = snapshot.ownerPhone?.trim() || null;
  const canDecideBid = actions.canConfirm || actions.canDecline;
  const showHeaderMessage = true;
  const showOwnerCard =
    hasActiveBid && (canDecideBid || Boolean(ownerPhone) || isSelectedBidder);
  const bidTag = isConfirmedBid
    ? t("dashboard.listings.detail.auctionBids.confirmed")
    : isSelectedBidder
      ? t("dashboard.listings.detail.auctionBids.selected")
      : snapshot.statusLabel;
  const bidPriceLabel =
    snapshot.myPeakAmount != null
      ? t("dashboard.listings.detail.auctionBids.amount", {
          amount: formatAmount(snapshot.myPeakAmount),
        })
      : "";

  const ranking = snapshot.ranking ?? [];
  const showRanking = ranking.length > 0;

  return (
    <View style={styles.root}>
      <BidHeader
        remainingSeconds={liveRemaining}
        currentAmount={snapshot.currentAmount}
        auctionType={snapshot.auctionType}
        myBidAmount={snapshot.myPeakAmount}
        ownerName={snapshot.ownerName}
        showMessage={showHeaderMessage}
        onMessagePress={() => setChatOpen(true)}
      />

      {error && !pinComposer ? (
        <AppText style={styles.errorText}>{error}</AppText>
      ) : null}

      {showPlaceBidForm && requiresVehicle ? (
            <View style={styles.vehiclePicker}>
              <AppText weight="semibold" style={styles.vehiclePickerLabel}>
                {t("dashboard.listings.detail.offer.vehicleLabel")}
              </AppText>
              {selectedVehicle ? (
                <View style={styles.selectedVehicleBlock}>
                  <OfferVehicleSummaryCard
                    vehicle={selectedVehicle as Vehicle}
                    onPress={() => setVehicleDetail(selectedVehicle)}
                  />
                  <Button
                    label={t("dashboard.listings.detail.offer.changeVehicle")}
                    variant="secondary"
                    onPress={() => setVehiclePickerOpen(true)}
                  />
                </View>
              ) : (
                <Button
                  label={t("dashboard.listings.detail.offer.selectVehicle")}
                  variant="secondary"
                  onPress={() => setVehiclePickerOpen(true)}
                />
              )}
            </View>
      ) : null}

      {showPlaceBidForm && !pinComposer ? (
          <BidComposerBar
            amount={amount}
            onAmountChange={handleAmountChange}
            placeholder={t("dashboard.listings.detail.bid.amountPlaceholder")}
            hint={nextBidHint(
              snapshot.auctionType,
              snapshot.minNextAmount,
              snapshot.currentAmount,
              t,
            )}
            submitLabel={
              isUpdatingBid
                ? t("dashboard.listings.detail.bid.update")
                : t("dashboard.listings.detail.bid.submit")
            }
            submitting={submitting}
            disabled={requiresVehicle && !selectedVehicleId}
            error={error}
            onSubmit={placeBid}
            creditCost={bidOfferCredits}
          />
      ) : null}

      {showRanking ? (
        <View style={styles.rankingBlock}>
          <AppText weight="bold" style={styles.rankingTitle}>
            {t("dashboard.listings.detail.bid.liveRanking")}
          </AppText>
          {ranking.map((row) => {
            const isYou =
              snapshot.myPeakAmount != null &&
              row.peakAmount === snapshot.myPeakAmount &&
              ranking.find(
                (entry) => entry.peakAmount === snapshot.myPeakAmount,
              )?.participantId === row.participantId;
            return (
              <OfferResponseCard
                key={row.participantId}
                tag={t("dashboard.listings.detail.auctionBids.rank", {
                  rank: row.rank,
                })}
                tagTone={row.rank === 1 ? "selected" : "muted"}
                name={
                  isYou
                    ? t("dashboard.listings.detail.bid.you")
                    : row.participantName?.trim() ||
                      t("dashboard.listings.detail.auctionBids.bidderLabel", {
                        rank: row.rank,
                      })
                }
                priceLabel={t("dashboard.listings.detail.auctionBids.amount", {
                  amount: formatPriceWithCurrency(row.peakAmount),
                })}
                showWinner={row.rank === 1}
              />
            );
          })}
        </View>
      ) : null}

      {showOwnerCard ? (
        <OfferResponseCard
          tag={bidTag}
          tagTone={
            isConfirmedBid
              ? "confirmed"
              : isSelectedBidder
                ? "selected"
                : "warning"
          }
          cardTone={
            isConfirmedBid
              ? "confirmed"
              : isSelectedBidder
                ? "selected"
                : "default"
          }
          name={
            snapshot.ownerName?.trim() ||
            t("dashboard.listings.detail.contact.fallbackName")
          }
          priceLabel={bidPriceLabel}
          showMessage={hasActiveBid || isSelectedBidder}
          onMessagePress={() => setChatOpen(true)}
          vehicle={selectedVehicle ? fromListVehicle(selectedVehicle) : null}
          onVehiclePress={() => {
            if (selectedVehicle) {
              setVehicleDetail(selectedVehicle);
            }
          }}
          footer={canDecideBid ? "decide" : ownerPhone ? "whatsapp" : null}
          rejectLabel={t("dashboard.listings.detail.bid.decline")}
          acceptLabel={t("dashboard.listings.detail.bid.confirm")}
          onReject={() => setConfirmDecline(true)}
          onAccept={() => runAction("confirm")}
          acceptLoading={submitting}
          actionsDisabled={submitting}
          whatsappPhone={ownerPhone}
          whatsappMessage={whatsappMessage}
        />
      ) : null}

      <TripMessagingSheet
        visible={chatOpen}
        onClose={() => setChatOpen(false)}
        tripId={tripId}
        counterpartyName={snapshot?.ownerName ?? null}
        counterpartyRole={isPassengerRequest ? "passenger" : "driver"}
      />

      <AppDialog
        visible={confirmWithdraw}
        title={t("dashboard.listings.detail.bid.withdrawConfirmTitle")}
        message={t("dashboard.listings.detail.bid.withdrawConfirmBody")}
        confirmAction={{
          label: t("dashboard.listings.detail.bid.withdraw"),
          onPress: () => runAction("withdraw"),
        }}
        cancelAction={{
          label: t("common.cancel"),
          onPress: () => setConfirmWithdraw(false),
        }}
      />
      <AppDialog
        visible={confirmDecline}
        title={t("dashboard.listings.detail.bid.declineConfirmTitle")}
        message={t("dashboard.listings.detail.bid.declineConfirmBody")}
        confirmAction={{
          label: t("dashboard.listings.detail.bid.decline"),
          onPress: () => runAction("decline"),
        }}
        cancelAction={{
          label: t("common.cancel"),
          onPress: () => setConfirmDecline(false),
        }}
      />
      <AppBottomSheet
        visible={requiresVehicle && vehiclePickerOpen}
        onClose={() => setVehiclePickerOpen(false)}
        heightRatio={0.8}
      >
        <View style={styles.sheetHeader}>
          <AppText weight="bold" style={styles.sheetTitle}>
            {t("dashboard.listings.detail.offer.selectVehicleTitle")}
          </AppText>
          <Pressable
            onPress={() => setVehiclePickerOpen(false)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t("common.cancel")}
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
            onSelectVehicle={(vehicleId) => {
              setSelectedVehicleId(vehicleId);
              setVehiclePickerOpen(false);
            }}
            onAddVehicle={goAddVehicle}
          />
        </ScrollView>
      </AppBottomSheet>
      <OfferVehicleDetailSheet
        visible={vehicleDetail != null}
        vehicle={vehicleDetail}
        onClose={() => setVehicleDetail(null)}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  centered: {
    paddingVertical: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
  },
  headerBlock: {
    gap: spacing.sm,
  },
  ownerTile: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    ...cardBackShadow,
  },
  ownerIdentity: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  ownerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  ownerAvatarInitial: {
    fontSize: 15,
    color: colors.primary,
  },
  ownerName: {
    flex: 1,
    fontSize: 15,
    color: colors.text.primary,
  },
  yourBidChip: {
    flexShrink: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
  },
  yourBidChipText: {
    fontSize: 13,
    color: colors.primary,
  },
  headerMessageChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    backgroundColor: colors.primary,
    flexShrink: 0,
  },
  headerMessageChipPressed: {
    opacity: 0.75,
  },
  headerMessageLabel: {
    fontSize: 12,
    color: colors.white,
  },
  rankingBlock: {
    gap: spacing.sm,
  },
  rankingTitle: {
    fontSize: 15,
    color: colors.text.primary,
  },
  meta: {
    color: colors.text.secondary,
    fontSize: 13,
  },
  errorText: {
    color: colors.primary,
    fontSize: 13,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  composer: {
    gap: spacing.xs,
  },
  composerHint: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  composerInput: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.white,
  },
  composerSend: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  composerSendContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  composerSendDisabled: {
    opacity: 0.5,
  },
  composerSendPressed: {
    opacity: 0.8,
  },
  composerSendLabel: {
    fontSize: 14,
    color: colors.white,
  },
});
