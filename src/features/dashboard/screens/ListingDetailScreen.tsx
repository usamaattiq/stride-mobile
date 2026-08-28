import React from "react";
import { FontAwesome } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useResizeMode } from "react-native-keyboard-controller";

import { AuthScaffold } from "@/features/auth/components/AuthScaffold";
import { i18n as appI18n } from "@/i18n";
import { adminApi } from "@/services/api/adminApi";
import { auctionApi } from "@/services/api/auctionApi";
import { chatApi } from "@/services/api/chatApi";
import type { TripConversationInboxItem } from "@/services/api/chatApi.types";
import { getErrorMessage } from "@/services/api/errorMessage";
import { tripApi } from "@/services/api/tripApi";
import { AppDialog } from "@/shared/components/AppDialog";
import { AppText } from "@/shared/components/AppText";
import { Button } from "@/shared/components/Button";
import { usePullToRefresh } from "@/shared/hooks/usePullToRefresh";
import { useLocalizedCityName } from "@/shared/hooks/useLocalizedCityName";
import { colors, radius, spacing } from "@/theme";

import { ListingCard } from "../components/ListingCard";
import { WhatsAppContactCard } from "../components/trip/WhatsAppContactCard";
import {
  formatDateRangeLabel,
  formatTripDateTime,
  isMultiDayWindow,
} from "../components/trip/dateRangeUtils";
import { TripAuctionBidsPanel } from "../components/trip/TripAuctionBidsPanel";
import {
  TripBidPanel,
  type TripBidPanelHandle,
} from "../components/trip/TripBidPanel";
import { TripDetailsOverview } from "../components/trip/TripDetailsOverview";
import {
  TripOfferPanel,
  type TripOfferPanelHandle,
} from "../components/trip/TripOfferPanel";
import { TripResponsesPanel } from "../components/trip/TripResponsesPanel";
import { TripMessagingSheet } from "../components/trip/TripMessagingSheet";
import { SegmentControl } from "../components/SegmentControl";
import { VEHICLE_CLASS_OPTIONS } from "../constants/vehicleClasses";
import { useTrips } from "../context/TripContext";
import type { DashboardRootStackParamList } from "../navigation/dashboardRootTypes";
import { openTripCreationFlow } from "../navigation/homeStackNavigation";
import { isSeaOrAirRoute, type Trip } from "../types/trip.types";
import { getListingStatusBucket } from "../utils/listingFilters";
import {
  getListingExpiresAtMs,
  getListingStartsAtMs,
} from "../utils/listingWindow";
import { mapTripDtoToTrip } from "../utils/trip.mapper";
import { mapAdminTripDetailToTrip } from "@/features/admin/utils/admin.mapper";
import type { AdminTripsStackParamList } from "@/features/admin/navigation/adminNavigationTypes";
import { authStore } from "@/store/authStore";
import type { AdminTripDetail, AdminTripParticipant, AdminTripResponse } from "@/services/api/adminApi";
import { formatPriceWithCurrency } from "@/shared/utils/currency";
import { OfferResponseCard } from "../components/trip/OfferResponseCard";

type DetailTab = "overview" | "responses";

type NotificationChatTarget = {
  conversationId: string;
  counterpartyName: string | null;
  counterpartyAvatarUrl?: string | null;
  counterpartyRole?: TripConversationInboxItem["counterpartyRole"];
};

const INITIAL_PAGE_WIDTH = Dimensions.get("window").width - spacing.md * 2;

function tabToIndex(tab: DetailTab): number {
  return tab === "overview" ? 0 : 1;
}

function indexToTab(index: number): DetailTab {
  return index === 0 ? "overview" : "responses";
}

export function ListingDetailScreen(): React.ReactElement {
  const { t, i18n } = useTranslation(undefined, { i18n: appI18n });
  const navigation = useNavigation<
    NativeStackNavigationProp<
      { ListingDetail: DashboardRootStackParamList["ListingDetail"] } & AdminTripsStackParamList
    >
  >();
  const route =
    useRoute<RouteProp<{ ListingDetail: DashboardRootStackParamList["ListingDetail"] }, "ListingDetail">>();
  const isAdminViewer = authStore.getSessionKind() === "admin";
  const { getTripById, patchTrip, removeTrip, refreshTrips, beginRepostTrip } =
    useTrips();

  const cached = getTripById(route.params.tripId);
  const [trip, setTrip] = React.useState<Trip | null>(cached ?? null);
  const [adminTrip, setAdminTrip] = React.useState<AdminTripDetail | null>(null);
  const [loading, setLoading] = React.useState(!cached);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<DetailTab>("responses");
  const [pageWidth, setPageWidth] = React.useState(INITIAL_PAGE_WIDTH);
  const pagerRef = React.useRef<ScrollView>(null);
  const scrollX = React.useRef(new Animated.Value(0)).current;
  const [confirmRemove, setConfirmRemove] = React.useState(false);
  const [removing, setRemoving] = React.useState(false);
  const [removeError, setRemoveError] = React.useState<string | null>(null);
  const [confirmCloseListing, setConfirmCloseListing] = React.useState(false);
  const [closingListing, setClosingListing] = React.useState(false);
  const [closeListingError, setCloseListingError] = React.useState<
    string | null
  >(null);
  const [canCloseAuction, setCanCloseAuction] = React.useState(false);
  const [auctionPanelKey, setAuctionPanelKey] = React.useState(0);
  const [responsesCount, setResponsesCount] = React.useState(0);
  const [canWithdrawOffer, setCanWithdrawOffer] = React.useState(false);
  const offerPanelRef = React.useRef<TripOfferPanelHandle>(null);
  const bidPanelRef = React.useRef<TripBidPanelHandle>(null);
  const [auctionComposer, setAuctionComposer] =
    React.useState<React.ReactNode>(null);
  const [notificationChat, setNotificationChat] =
    React.useState<NotificationChatTarget | null>(null);
  const fromCity = useLocalizedCityName(
    trip?.departureCity,
    trip?.departurePoint,
  );
  const toCity = useLocalizedCityName(trip?.arrivalCity, trip?.arrivalPoint);

  /** Owned listings come from the user's My Listings cache; discovery items do not.
   * Messages can pass viewerIsOwner so owner UI works even before the cache is warm. */
  const isOwnListing =
    !isAdminViewer &&
    (route.params.viewerIsOwner === true ||
      Boolean(getTripById(route.params.tripId)));
  // Offer form needs adjustResize so the price field can scroll above the keyboard
  // (app default is Android pan, which leaves the focused field covered).
  useResizeMode();

  const pagerPageWidth = pageWidth + spacing.md * 2;

  const selectTab = React.useCallback(
    (next: DetailTab, animated = true) => {
      setTab(next);
      if (pageWidth <= 0) {
        return;
      }
      const index = tabToIndex(next);
      pagerRef.current?.scrollTo({ x: index * pagerPageWidth, animated });
      if (!animated) {
        scrollX.setValue(index * pagerPageWidth);
      }
    },
    [pageWidth, pagerPageWidth, scrollX],
  );

  const animatedTabIndex = React.useMemo(() => {
    if (pagerPageWidth <= 0) {
      return undefined;
    }
    return scrollX.interpolate({
      inputRange: [0, pagerPageWidth],
      outputRange: [0, 1],
      extrapolate: "clamp",
    });
  }, [pagerPageWidth, scrollX]);

  const syncTabFromOffset = React.useCallback(
    (offsetX: number) => {
      if (pagerPageWidth <= 0) {
        return;
      }
      const index = Math.round(offsetX / pagerPageWidth);
      const nextTab = indexToTab(index);
      setTab((current) => (current === nextTab ? current : nextTab));
    },
    [pagerPageWidth],
  );

  const onPagerScrollEnd = React.useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      syncTabFromOffset(event.nativeEvent.contentOffset.x);
    },
    [syncTabFromOffset],
  );

  const hasPositionedPagerRef = React.useRef(false);

  React.useEffect(() => {
    hasPositionedPagerRef.current = false;
    setTab("responses");
  }, [route.params.tripId]);

  const onPagerLayout = React.useCallback(
    (event: LayoutChangeEvent) => {
      const width = event.nativeEvent.layout.width;
      if (width <= 0) {
        return;
      }
      const widthChanged = width !== pageWidth;
      if (widthChanged) {
        setPageWidth(width);
      }
      if (!hasPositionedPagerRef.current || widthChanged) {
        hasPositionedPagerRef.current = true;
        const index = tabToIndex(tab);
        scrollX.setValue(index * (width + spacing.md * 2));
        requestAnimationFrame(() => {
          pagerRef.current?.scrollTo({
            x: index * (width + spacing.md * 2),
            animated: false,
          });
        });
      }
    },
    [pageWidth, scrollX, tab],
  );

  React.useEffect(() => {
    const seeded = isAdminViewer ? undefined : getTripById(route.params.tripId);
    if (seeded) {
      setTrip(seeded);
    }

    let cancelled = false;
    setLoading(!seeded);
    setLoadError(null);
    const load = isAdminViewer
      ? adminApi.getTrip(route.params.tripId).then((detail) => {
          if (!cancelled) {
            setAdminTrip(detail);
            setTrip(mapAdminTripDetailToTrip(detail));
          }
        })
      : tripApi.getById(route.params.tripId).then((dto) => {
          if (!cancelled) {
            const next = mapTripDtoToTrip(dto);
            setTrip(next);
            patchTrip(next.id, next);
          }
        });

    void load
      .catch((error) => {
        if (!cancelled && !seeded) {
          setLoadError(
            getErrorMessage(error, t("dashboard.listings.detail.loadFailed")),
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getTripById/patchTrip would retrigger and overwrite live tags
  }, [route.params.tripId, t, isAdminViewer]);

  const requestedConversationId = route.params.conversationId;
  React.useEffect(() => {
    if (!requestedConversationId || isAdminViewer) {
      return;
    }
    setNotificationChat({
      conversationId: requestedConversationId,
      counterpartyName: null,
    });
    navigation.setParams({ conversationId: undefined });
    void chatApi
      .listInbox()
      .then((inbox) => {
        const match = inbox.find((row) => row.id === requestedConversationId);
        if (!match) {
          return;
        }
        setNotificationChat((current) =>
          current?.conversationId === requestedConversationId
            ? {
                conversationId: match.id,
                counterpartyName: match.counterpartyName,
                counterpartyAvatarUrl: match.counterpartyAvatarUrl,
                counterpartyRole: match.counterpartyRole,
              }
            : current,
        );
        if (match.viewerIsOwner) {
          navigation.setParams({ viewerIsOwner: true });
        }
      })
      .catch(() => undefined);
  }, [isAdminViewer, navigation, requestedConversationId]);

  const reloadTrip = React.useCallback(async () => {
    setLoadError(null);
    if (isAdminViewer) {
      const detail = await adminApi.getTrip(route.params.tripId);
      setAdminTrip(detail);
      setTrip(mapAdminTripDetailToTrip(detail));
      return;
    }
    const dto = await tripApi.getById(route.params.tripId);
    setTrip(mapTripDtoToTrip(dto));
    if (isOwnListing) {
      await refreshTrips().catch(() => undefined);
    }
  }, [isAdminViewer, isOwnListing, refreshTrips, route.params.tripId]);

  const { refreshControlProps } = usePullToRefresh(reloadTrip);

  React.useEffect(() => {
    if (!isOwnListing || !trip || trip.listingType !== "auction") {
      setCanCloseAuction(false);
      return;
    }
    let cancelled = false;
    void auctionApi
      .getSnapshot(trip.id)
      .then((result) => {
        if (cancelled) {
          return;
        }
        setCanCloseAuction(result.role === "owner" && result.actions.canClose);
      })
      .catch(() => {
        if (!cancelled) {
          setCanCloseAuction(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isOwnListing, trip?.id, trip?.listingType, trip?.auctionStatus]);

  const handleRemove = () => {
    if (!trip || removing) {
      return;
    }
    setRemoving(true);
    setRemoveError(null);
    void removeTrip(trip.id)
      .then(async () => {
        setConfirmRemove(false);
        await refreshTrips().catch(() => undefined);
        navigation.goBack();
      })
      .catch((error) => {
        setRemoveError(
          getErrorMessage(error, t("dashboard.listings.remove.failed")),
        );
      })
      .finally(() => setRemoving(false));
  };

  const handleCloseListing = () => {
    if (!trip || closingListing) {
      return;
    }
    setClosingListing(true);
    setCloseListingError(null);
    const request = isAdminViewer
      ? adminApi.closeListing(trip.id).then(async (detail) => {
          setAdminTrip(detail);
          setTrip(mapAdminTripDetailToTrip(detail));
        })
      : auctionApi.close(trip.id);
    void request
      .then(async () => {
        setConfirmCloseListing(false);
        setCanCloseAuction(false);
        setAuctionPanelKey((key) => key + 1);
        if (!isAdminViewer) {
          await reloadTrip().catch(() => undefined);
        }
      })
      .catch((error) => {
        setCloseListingError(
          getErrorMessage(
            error,
            isAdminViewer
              ? t("admin.trips.closeFailed")
              : t("dashboard.listings.detail.auctionBids.actionFailed"),
          ),
        );
      })
      .finally(() => setClosingListing(false));
  };

  const goBack = () => navigation.goBack();

  const notificationChatSheet = (
    <TripMessagingSheet
      key={notificationChat?.conversationId ?? "notification-chat"}
      visible={notificationChat != null}
      onClose={() => setNotificationChat(null)}
      tripId={route.params.tripId}
      existingConversationId={notificationChat?.conversationId}
      counterpartyName={notificationChat?.counterpartyName ?? null}
      counterpartyAvatarUrl={notificationChat?.counterpartyAvatarUrl}
      counterpartyRole={notificationChat?.counterpartyRole ?? null}
    />
  );

  const handleOfferChange = React.useCallback(
    (update: {
      rfqStatus: Trip["rfqStatus"];
      myOfferStatus: Trip["myOfferStatus"];
      myOfferPrice: Trip["myOfferPrice"];
      counterpartyName: Trip["counterpartyName"];
      counterpartyPhone: Trip["counterpartyPhone"];
    }) => {
      setTrip((current) =>
        current
          ? {
              ...current,
              rfqStatus: update.rfqStatus,
              myOfferStatus: update.myOfferStatus,
              myOfferPrice: update.myOfferPrice,
              counterpartyName: update.counterpartyName,
              counterpartyPhone: update.counterpartyPhone,
            }
          : current,
      );
      patchTrip(route.params.tripId, {
        rfqStatus: update.rfqStatus,
        myOfferStatus: update.myOfferStatus,
        myOfferPrice: update.myOfferPrice,
        counterpartyName: update.counterpartyName,
        counterpartyPhone: update.counterpartyPhone,
      });
    },
    [patchTrip, route.params.tripId],
  );

  const handleBidChange = React.useCallback(
    (update: {
      auctionStatus: Trip["auctionStatus"];
      auctionStatusLabel: Trip["auctionStatusLabel"];
      auctionStatusVariant: Trip["auctionStatusVariant"];
      myBidStatus: Trip["myBidStatus"];
      myBidAmount: Trip["myBidAmount"];
      counterpartyName: Trip["counterpartyName"];
      counterpartyPhone: Trip["counterpartyPhone"];
    }) => {
      setTrip((current) =>
        current
          ? {
              ...current,
              auctionStatus: update.auctionStatus,
              auctionStatusLabel: update.auctionStatusLabel,
              auctionStatusVariant: update.auctionStatusVariant,
              myBidStatus: update.myBidStatus,
              myBidAmount: update.myBidAmount,
              counterpartyName: update.counterpartyName,
              counterpartyPhone: update.counterpartyPhone,
            }
          : current,
      );
      patchTrip(route.params.tripId, {
        auctionStatus: update.auctionStatus,
        auctionStatusLabel: update.auctionStatusLabel,
        auctionStatusVariant: update.auctionStatusVariant,
        myBidStatus: update.myBidStatus,
        myBidAmount: update.myBidAmount,
        counterpartyName: update.counterpartyName,
        counterpartyPhone: update.counterpartyPhone,
      });
    },
    [patchTrip, route.params.tripId],
  );

  const handleOwnerRfqStatusChange = React.useCallback(
    (rfqStatus: Trip["rfqStatus"]) => {
      setTrip((current) => (current ? { ...current, rfqStatus } : current));
      patchTrip(route.params.tripId, { rfqStatus });
    },
    [patchTrip, route.params.tripId],
  );

  const handleOwnerAuctionStatusChange = React.useCallback(
    (update: {
      auctionStatus: Trip["auctionStatus"];
      auctionStatusLabel: Trip["auctionStatusLabel"];
      auctionStatusVariant: Trip["auctionStatusVariant"];
    }) => {
      setTrip((current) =>
        current
          ? {
              ...current,
              auctionStatus: update.auctionStatus,
              auctionStatusLabel: update.auctionStatusLabel,
              auctionStatusVariant: update.auctionStatusVariant,
            }
          : current,
      );
      patchTrip(route.params.tripId, update);
    },
    [patchTrip, route.params.tripId],
  );

  const openAdminUserProfile = React.useCallback(
    (user: Pick<AdminTripParticipant, "id" | "role">) => {
      navigation.navigate("UserDetail", {
        userId: user.id,
        listRole: user.role,
      });
    },
    [navigation],
  );

  if (loading) {
    return (
      <AuthScaffold
        onBack={goBack}
        title={t("dashboard.listings.detail.title")}
        showLegalFooter={false}
        showLanguageSwitcher={false}
        compactHeader
        manualTopInset={isAdminViewer}
      >
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </AuthScaffold>
    );
  }

  if (!trip || loadError) {
    return (
      <AuthScaffold
        onBack={goBack}
        title={t("dashboard.listings.detail.title")}
        showLegalFooter={false}
        showLanguageSwitcher={false}
        compactHeader
        manualTopInset={isAdminViewer}
      >
        <View style={styles.centered}>
          <AppText style={styles.errorText}>
            {loadError ?? t("dashboard.listings.detail.notFound")}
          </AppText>
          <Button label={t("common.ok")} onPress={goBack} />
        </View>
        {notificationChatSheet}
      </AuthScaffold>
    );
  }

  const classLabel = trip.vehicleClass
    ? t(
        VEHICLE_CLASS_OPTIONS.find((item) => item.id === trip.vehicleClass)
          ?.labelKey ?? "vehicles.classPlaceholder",
      )
    : t("trips.create.previewVehicle");
  const modeLabel =
    trip.vehicleMode === "fullPrivate"
      ? t("trips.create.vehicleModeFullPrivate")
      : t("trips.create.vehicleModeShared");
  const isPassengerRequest = trip.vehicleId == null;
  // Sea/air requests are served by a ferry or flight, so responders attach photos
  // at offer time instead of picking one of their saved vehicles.
  const skipsVehicleSelection =
    isPassengerRequest && isSeaOrAirRoute(trip.routeType);
  const locale = i18n.language;
  const departureWhen = trip.departureOpen
    ? t("dashboard.listings.card.open")
    : isMultiDayWindow(trip.departureAt, trip.departureUntil)
      ? formatDateRangeLabel(
          trip.departureAt,
          trip.departureUntil,
          locale,
          trip.departureAt,
        )
      : formatTripDateTime(trip.departureAt, locale, "—", trip.departureTimeSet);
  const arrivalWhen = trip.arrivalOpen
    ? undefined
    : formatTripDateTime(trip.arrivalAt, locale, "—", trip.arrivalTimeSet);
  const vehicleTitle = trip.vehicleTitle ?? classLabel;
  const description =
    trip.description?.trim() ||
    t("dashboard.listings.detail.descriptionBody", {
      from: fromCity,
      to: toCity || "—",
      vehicle: vehicleTitle,
      mode: modeLabel,
    });
  const adminTripWinner = adminTrip
    ? adminTrip.isPassengerRequest
      ? adminTrip.driver
      : adminTrip.winningPassenger
    : null;

  const tabs: Array<{ id: DetailTab; label: string }> = [
    { id: "overview", label: t("dashboard.listings.detail.tabs.overview") },
    {
      id: "responses",
      label: t("dashboard.listings.detail.tabs.responses", {
        count: responsesCount,
      }),
    },
  ];

  const openRemove = () => {
    setRemoveError(null);
    setConfirmRemove(true);
  };

  // Hide delete once the listing is past / completed / closed / expired / ended.
  const canRemoveListing =
    isOwnListing && trip != null && getListingStatusBucket(trip) === "live";
  const canAdminCloseListing =
    isAdminViewer && trip != null && getListingStatusBucket(trip) === "live";
  const closeListingLabel = isPassengerRequest
    ? t("admin.trips.closeRequest")
    : t("admin.trips.closeTrip");
  const showHeaderActions =
    canCloseAuction ||
    canAdminCloseListing ||
    canRemoveListing ||
    canWithdrawOffer;

  return (
    <AuthScaffold
      onBack={goBack}
      title={t("dashboard.listings.detail.title")}
      showLegalFooter={false}
      showLanguageSwitcher={false}
      compactHeader
      manualTopInset={isAdminViewer}
      // Only affects keyboard-open scroll — no permanent empty gap at the bottom.
      scrollBottomOffset={
        isOwnListing || isAdminViewer ? undefined : spacing.huge + spacing.sm
      }
      refreshControlProps={refreshControlProps}
      footer={
        !isOwnListing && !isAdminViewer && trip?.listingType === "auction"
          ? auctionComposer
          : undefined
      }
      headerRight={
        showHeaderActions ? (
          <View style={styles.headerActions}>
            {canWithdrawOffer ? (
              <Pressable
                onPress={() => {
                  offerPanelRef.current?.openWithdrawConfirm();
                  bidPanelRef.current?.openWithdrawConfirm();
                }}
                style={styles.headerActionButton}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={
                  trip.listingType === "auction"
                    ? t("dashboard.listings.detail.bid.withdraw")
                    : t("dashboard.listings.detail.offer.withdraw")
                }
              >
                <FontAwesome name="undo" size={13} color={colors.white} />
                <AppText weight="semibold" style={styles.headerActionLabel}>
                  {t("dashboard.listings.detail.offer.withdrawConfirmAction")}
                </AppText>
              </Pressable>
            ) : null}
            {canCloseAuction || canAdminCloseListing ? (
              <Pressable
                onPress={() => {
                  setCloseListingError(null);
                  setConfirmCloseListing(true);
                }}
                style={styles.headerActionButton}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={
                  canAdminCloseListing
                    ? closeListingLabel
                    : t("dashboard.listings.detail.auctionBids.close")
                }
              >
                <FontAwesome
                  name="stop-circle"
                  size={14}
                  color={colors.white}
                />
                <AppText weight="semibold" style={styles.headerActionLabel}>
                  {canAdminCloseListing
                    ? closeListingLabel
                    : t("common.close")}
                </AppText>
              </Pressable>
            ) : null}
            {canRemoveListing ? (
              <Pressable
                onPress={openRemove}
                style={styles.headerActionButton}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={t("dashboard.listings.remove.a11y")}
              >
                <FontAwesome name="trash-o" size={16} color={colors.white} />
              </Pressable>
            ) : null}
          </View>
        ) : undefined
      }
    >
      <View style={styles.content} onLayout={onPagerLayout}>
        <ListingCard
          trip={trip}
          showPhotoCount
          onRepost={
            isOwnListing
              ? () => {
                  beginRepostTrip(trip);
                  openTripCreationFlow(
                    navigation as NativeStackNavigationProp<DashboardRootStackParamList>,
                    { repost: true },
                  );
                }
              : undefined
          }
        />

        {!isOwnListing ? (
          <>
            <TripDetailsOverview
              description={description}
              listingVehicle={trip.listingVehicle}
              luggage={trip.luggage}
              fromCity={fromCity}
              toCity={toCity}
              departureWhen={departureWhen}
              arrivalWhen={arrivalWhen}
              departurePoint={trip.departurePoint}
              arrivalPoint={trip.arrivalPoint}
            />
            {isAdminViewer && adminTrip ? (
              <View style={styles.adminContacts}>
                <WhatsAppContactCard
                  title={
                    adminTrip.isPassengerRequest
                      ? t('admin.trips.passenger')
                      : t('admin.trips.driver')
                  }
                  icon={adminTrip.isPassengerRequest ? 'user' : 'car'}
                  name={adminTrip.owner.fullName}
                  avatarUrl={adminTrip.owner.avatarViewUrl}
                  phone={adminTrip.owner.phoneE164}
                  message={t(
                    adminTrip.isPassengerRequest
                      ? 'admin.trips.whatsappPassenger'
                      : 'admin.trips.whatsappDriver',
                    {
                      ref: trip.referenceCode ?? trip.id,
                    },
                  )}
                  onProfilePress={() => openAdminUserProfile(adminTrip.owner)}
                />
                {adminTripWinner ? (
                  <WhatsAppContactCard
                    title={
                      adminTrip.isPassengerRequest
                        ? t('admin.trips.winningDriver')
                        : t('admin.trips.winningPassenger')
                    }
                    icon={adminTrip.isPassengerRequest ? 'car' : 'user'}
                    name={adminTripWinner.fullName}
                    avatarUrl={adminTripWinner.avatarViewUrl}
                    phone={adminTripWinner.phoneE164}
                    message={t(
                      adminTrip.isPassengerRequest
                        ? 'admin.trips.whatsappDriver'
                        : 'admin.trips.whatsappPassenger',
                      {
                        ref: trip.referenceCode ?? trip.id,
                      },
                    )}
                    onProfilePress={() => openAdminUserProfile(adminTripWinner)}
                  />
                ) : null}
                <AppText weight="bold" style={styles.adminResponsesTitle}>
                  {trip.listingType === 'auction'
                    ? t('admin.trips.bidders')
                    : t('admin.trips.offerSenders')}
                </AppText>
                {(adminTrip.responses ?? []).length === 0 ? (
                  <AppText style={styles.adminResponsesEmpty}>
                    {t('admin.trips.noResponses')}
                  </AppText>
                ) : (
                  (adminTrip.responses ?? []).map((response: AdminTripResponse) => {
                    const offerStatusKey =
                      `dashboard.listings.detail.responses.offerStatus.${response.status}` as const;
                    const tag =
                      response.rank != null
                        ? t('dashboard.listings.detail.bid.rank', { rank: response.rank })
                        : t(offerStatusKey, { defaultValue: response.status });
                    return (
                      <OfferResponseCard
                        key={response.userId}
                        tag={tag}
                        tagTone={
                          response.status === 'confirmed'
                            ? 'confirmed'
                            : response.status === 'selected'
                              ? 'selected'
                              : response.rank === 1
                                ? 'warning'
                                : 'muted'
                        }
                        name={response.fullName}
                        priceLabel={
                          response.amount != null ? formatPriceWithCurrency(response.amount) : '—'
                        }
                        footer="whatsapp"
                        whatsappPhone={response.phoneE164}
                        whatsappMessage={t(
                          response.role === 'driver'
                            ? 'admin.trips.whatsappDriver'
                            : 'admin.trips.whatsappPassenger',
                          { ref: trip.referenceCode ?? trip.id },
                        )}
                        onProfilePress={() =>
                          openAdminUserProfile({
                            id: response.userId,
                            role: response.role,
                          })
                        }
                      />
                    );
                  })
                )}
              </View>
            ) : isAdminViewer ? null : trip.listingType === 'auction' ? (
              <TripBidPanel
                ref={bidPanelRef}
                tripId={trip.id}
                routeLabel={`${fromCity} → ${toCity}`}
                isPassengerRequest={isPassengerRequest}
                requiresVehicle={isPassengerRequest}
                initialVehicleId={route.params.selectVehicleId ?? null}
                listingStartsAtMs={getListingStartsAtMs(trip)}
                listingExpiresAtMs={getListingExpiresAtMs(trip)}
                onBidChange={handleBidChange}
                onCanWithdrawChange={setCanWithdrawOffer}
                pinComposer
                onPinnedComposerChange={setAuctionComposer}
              />
            ) : (
              <TripOfferPanel
                ref={offerPanelRef}
                tripId={trip.id}
                routeLabel={`${fromCity} → ${toCity}`}
                vehicleMode={trip.vehicleMode}
                vehicleTotalSeats={trip.vehicleTotalSeats}
                isPassengerRequest={isPassengerRequest}
                requiresVehicle={isPassengerRequest && !skipsVehicleSelection}
                allowsPhotoAttachments={skipsVehicleSelection}
                initialVehicleId={route.params.selectVehicleId ?? null}
                onOfferChange={handleOfferChange}
                onCanWithdrawChange={setCanWithdrawOffer}
              />
            )}
          </>
        ) : (
          <>
            <SegmentControl
              options={tabs}
              value={tab}
              onChange={selectTab}
              animatedIndex={animatedTabIndex}
            />

            <View style={[styles.pagerBleed, { width: pagerPageWidth }]}>
              <Animated.ScrollView
                ref={pagerRef}
                horizontal
                pagingEnabled
                bounces={false}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                onScroll={Animated.event(
                  [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                  {
                    useNativeDriver: true,
                  },
                )}
                onScrollEndDrag={onPagerScrollEnd}
                onMomentumScrollEnd={onPagerScrollEnd}
                scrollEventThrottle={16}
              >
                <View style={[styles.page, { width: pagerPageWidth }]}>
                  <View style={styles.pageInner}>
                    <TripDetailsOverview
                      description={description}
                      luggage={trip.luggage}
                      fromCity={fromCity}
                      toCity={toCity}
                      departureWhen={departureWhen}
                      arrivalWhen={arrivalWhen}
                      departurePoint={trip.departurePoint}
                      arrivalPoint={trip.arrivalPoint}
                    />
                  </View>
                </View>

                <View style={[styles.page, { width: pagerPageWidth }]}>
                  <View style={styles.pageInner}>
                    {trip.listingType === "auction" ? (
                      <TripAuctionBidsPanel
                        key={auctionPanelKey}
                        tripId={trip.id}
                        routeLabel={`${fromCity} → ${toCity}`}
                        isPassengerRequest={trip.vehicleId == null}
                        onCountChange={setResponsesCount}
                        onAuctionStatusChange={handleOwnerAuctionStatusChange}
                      />
                    ) : (
                      <TripResponsesPanel
                        tripId={trip.id}
                        routeLabel={`${fromCity} → ${toCity}`}
                        vehicleMode={trip.vehicleMode}
                        vehicleTotalSeats={trip.vehicleTotalSeats}
                        isPassengerRequest={trip.vehicleId == null}
                        onCountChange={setResponsesCount}
                        onRfqStatusChange={handleOwnerRfqStatusChange}
                      />
                    )}
                  </View>
                </View>
              </Animated.ScrollView>
            </View>
          </>
        )}
      </View>

      <AppDialog
        visible={confirmCloseListing}
        icon="stop-circle"
        title={
          canAdminCloseListing
            ? isPassengerRequest
              ? t("admin.trips.closeRequestTitle")
              : t("admin.trips.closeTripTitle")
            : t("dashboard.listings.detail.auctionBids.closeConfirmTitle")
        }
        message={
          closeListingError ??
          (canAdminCloseListing
            ? isPassengerRequest
              ? t("admin.trips.closeRequestBody")
              : t("admin.trips.closeTripBody")
            : t("dashboard.listings.detail.auctionBids.closeConfirmBody"))
        }
        cancelAction={{
          label: t("common.cancel"),
          onPress: () => {
            if (closingListing) {
              return;
            }
            setConfirmCloseListing(false);
            setCloseListingError(null);
          },
        }}
        confirmAction={{
          label: canAdminCloseListing
            ? closeListingLabel
            : t("dashboard.listings.detail.auctionBids.close"),
          onPress: handleCloseListing,
          loading: closingListing,
          disabled: closingListing,
        }}
      />

      <AppDialog
        visible={confirmRemove}
        icon="trash"
        title={t("dashboard.listings.remove.title")}
        message={
          removeError ??
          t("dashboard.listings.remove.confirm", {
            from: fromCity,
            to: toCity,
          })
        }
        cancelAction={{
          label: t("common.cancel"),
          onPress: () => {
            if (removing) {
              return;
            }
            setConfirmRemove(false);
            setRemoveError(null);
          },
        }}
        confirmAction={{
          label: t("dashboard.listings.remove.confirmAction"),
          onPress: handleRemove,
        }}
      />
      {notificationChatSheet}
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  errorText: {
    fontSize: 13,
    color: colors.primary,
    textAlign: "center",
  },
  content: {
    gap: spacing.xs,
  },
  adminContacts: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  adminResponsesTitle: {
    fontSize: 16,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  adminResponsesEmpty: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  pagerBleed: {
    marginLeft: -spacing.md,
    overflow: "hidden",
  },
  page: {
    overflow: "visible",
  },
  pageInner: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
    overflow: "visible",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  headerActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 34,
    paddingHorizontal: spacing.sm,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  headerActionLabel: {
    color: colors.white,
    fontSize: 12,
    lineHeight: 16,
  },
});
