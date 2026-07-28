import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Keyboard, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  CITY_RESULTS_MAX_HEIGHT,
  CitySearchField,
} from '@/features/dashboard/components/trip/CitySearchField';
import type { TripBrowseFilters } from '@/features/dashboard/types/tripBrowse.types';
import {
  countActiveTripBrowseFilters,
  EMPTY_TRIP_BROWSE_FILTERS,
} from '@/features/dashboard/types/tripBrowse.types';
import type { TripPaymentMethod, TripVehicleMode } from '@/features/dashboard/types/trip.types';
import { i18n as appI18n } from '@/i18n';
import { AppBottomSheet } from '@/shared/components/AppBottomSheet';
import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

type TripFilterSheetProps = {
  visible: boolean;
  filters: TripBrowseFilters;
  onClose: () => void;
  onApply: (filters: TripBrowseFilters) => void;
};

type ChipOption<T extends string> = {
  id: T;
  labelKey: string;
};

const PAYMENT_OPTIONS: ChipOption<TripPaymentMethod>[] = [
  { id: 'cash', labelKey: 'trips.create.paymentCash' },
  { id: 'online', labelKey: 'trips.create.paymentOnline' },
  { id: 'both', labelKey: 'trips.create.paymentBoth' },
];

const VEHICLE_MODE_OPTIONS: ChipOption<TripVehicleMode>[] = [
  { id: 'shared', labelKey: 'trips.create.vehicleModeShared' },
  { id: 'fullPrivate', labelKey: 'trips.create.vehicleModeFullPrivate' },
];

const SEAT_OPTIONS = Array.from({ length: 50 }, (_, index) => index + 1);
const SEAT_OPTION_HEIGHT = 40;
const SEAT_DROPDOWN_VISIBLE_COUNT = 3;
const SEAT_DROPDOWN_HEIGHT = SEAT_OPTION_HEIGHT * SEAT_DROPDOWN_VISIBLE_COUNT;

export function TripFilterSheet({
  visible,
  filters,
  onClose,
  onApply,
}: TripFilterSheetProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const [draft, setDraft] = React.useState<TripBrowseFilters>(filters);
  const [resetSeed, setResetSeed] = React.useState(0);
  const [seatDropdownOpen, setSeatDropdownOpen] = React.useState(false);
  const [seatDropdownLayout, setSeatDropdownLayout] = React.useState<{
    x: number;
    y: number;
    width: number;
  } | null>(null);
  const seatTriggerRef = React.useRef<View>(null);
  const scrollRef = React.useRef<ScrollView>(null);
  const departureFieldY = React.useRef(0);
  const arrivalFieldY = React.useRef(0);

  const scrollFieldIntoView = React.useCallback((yRef: React.MutableRefObject<number>) => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: Math.max(yRef.current - spacing.sm, 0), animated: true });
    });
  }, []);

  React.useEffect(() => {
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
    return () => hideSub.remove();
  }, []);

  const closeSeatDropdown = React.useCallback(() => {
    setSeatDropdownOpen(false);
    setSeatDropdownLayout(null);
  }, []);

  React.useEffect(() => {
    if (visible) {
      setDraft(filters);
      closeSeatDropdown();
    }
  }, [closeSeatDropdown, filters, visible]);

  const activeCount = countActiveTripBrowseFilters(draft);
  const hasActiveFilters = activeCount > 0;

  const patchDraft = (partial: Partial<TripBrowseFilters>) => {
    setDraft((current) => ({ ...current, ...partial }));
  };

  const openSeatDropdown = () => {
    seatTriggerRef.current?.measureInWindow((x, y, width, height) => {
      setSeatDropdownLayout({
        x,
        y: y + height + spacing.xs,
        width,
      });
      setSeatDropdownOpen(true);
    });
  };

  const handleReset = () => {
    const clearedFilters = EMPTY_TRIP_BROWSE_FILTERS;
    setDraft(clearedFilters);
    setResetSeed((current) => current + 1);
    closeSeatDropdown();
    onApply(clearedFilters);
    onClose();
  };

  const handleApply = () => {
    if (!hasActiveFilters) {
      return;
    }
    closeSeatDropdown();
    onApply(draft);
    onClose();
  };

  return (
    <AppBottomSheet visible={visible} onClose={onClose} heightRatio={0.7}>
      <View style={styles.sheetHandle} />
      <View style={styles.headerRow}>
        <AppText weight="semibold" style={styles.sheetTitle}>
          {t('dashboard.home.filterSheetTitle')}
        </AppText>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
        scrollEnabled={false}
      >
        <FilterSection title={t('dashboard.home.filterSeats')}>
          <View ref={seatTriggerRef} collapsable={false} style={styles.seatDropdownWrap}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (seatDropdownOpen) {
                  closeSeatDropdown();
                  return;
                }
                openSeatDropdown();
              }}
              style={({ pressed }) => [styles.seatDropdownTrigger, pressed && styles.pressed]}
            >
              <AppText style={[styles.seatDropdownValue, draft.minSeats == null && styles.seatPlaceholder]}>
                {draft.minSeats == null
                  ? 'Select seats'
                  : t('dashboard.home.filterSeatsCount', { count: draft.minSeats })}
              </AppText>
              <FontAwesome
                name={seatDropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={12}
                color={colors.text.secondary}
              />
            </Pressable>
          </View>
        </FilterSection>

        <View onLayout={(event) => { departureFieldY.current = event.nativeEvent.layout.y; }}>
          <CitySearchField
            key={`departure-${resetSeed}`}
            label={t('dashboard.home.filterDepartureCity')}
            placeholder={t('trips.create.cityPlaceholder')}
            value={draft.departureCity}
            onChange={(departureCity) => patchDraft({ departureCity })}
            onFocus={() => scrollFieldIntoView(departureFieldY)}
          />
        </View>

        <View onLayout={(event) => { arrivalFieldY.current = event.nativeEvent.layout.y; }}>
          <CitySearchField
            key={`arrival-${resetSeed}`}
            label={t('dashboard.home.filterArrivalCity')}
            placeholder={t('trips.create.cityPlaceholder')}
            value={draft.arrivalCity}
            onChange={(arrivalCity) => patchDraft({ arrivalCity })}
            onFocus={() => scrollFieldIntoView(arrivalFieldY)}
          />
        </View>

        <FilterSection title={t('dashboard.home.filterVehicleMode')}>
          <ChipRow>
            {VEHICLE_MODE_OPTIONS.map((option) => {
              const selected = draft.vehicleMode === option.id;
              return (
                <FilterChip
                  key={option.id}
                  label={t(option.labelKey)}
                  selected={selected}
                  onPress={() =>
                    patchDraft({
                      vehicleMode: selected ? null : option.id,
                    })
                  }
                />
              );
            })}
          </ChipRow>
        </FilterSection>

        <FilterSection title={t('dashboard.home.filterPaymentMethod')}>
          <ChipRow>
            {PAYMENT_OPTIONS.map((option) => {
              const selected = draft.paymentMethod === option.id;
              return (
                <FilterChip
                  key={option.id}
                  label={t(option.labelKey)}
                  selected={selected}
                  onPress={() =>
                    patchDraft({
                      paymentMethod: selected ? null : option.id,
                    })
                  }
                />
              );
            })}
          </ChipRow>
        </FilterSection>

      </ScrollView>

      <View style={styles.footerRow}>
        <Pressable
          accessibilityRole="button"
          disabled={!hasActiveFilters}
          onPress={handleReset}
          style={({ pressed }) => [
            styles.footerResetButton,
            !hasActiveFilters && styles.headerActionDisabled,
            pressed && hasActiveFilters && styles.pressed,
          ]}
        >
          <AppText
            weight="semibold"
            style={[styles.footerResetText, !hasActiveFilters && styles.headerActionTextDisabled]}
          >
            {t('dashboard.home.filterReset')}
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={!hasActiveFilters}
          onPress={handleApply}
          style={({ pressed }) => [
            styles.footerApplyButton,
            !hasActiveFilters && styles.headerActionPrimaryDisabled,
            pressed && hasActiveFilters && styles.pressed,
          ]}
        >
          <AppText
            weight="bold"
            style={[styles.footerApplyText, !hasActiveFilters && styles.footerApplyTextDisabled]}
          >
            {t('dashboard.home.filterApply')}
          </AppText>
        </Pressable>
      </View>

      <Modal
        visible={seatDropdownOpen && seatDropdownLayout != null}
        transparent
        animationType="none"
        onRequestClose={closeSeatDropdown}
        statusBarTranslucent
      >
        <View style={styles.seatModalRoot} pointerEvents="box-none">
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeSeatDropdown}
            accessibilityRole="button"
            accessibilityLabel="Close seats"
          />
          {seatDropdownLayout ? (
            <View
              style={[
                styles.seatDropdownList,
                {
                  top: seatDropdownLayout.y,
                  left: seatDropdownLayout.x,
                  width: seatDropdownLayout.width,
                },
              ]}
            >
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
                style={styles.seatDropdownScroll}
              >
                {SEAT_OPTIONS.map((seats) => {
                  const selected = draft.minSeats === seats;
                  return (
                    <Pressable
                      key={seats}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => {
                        patchDraft({ minSeats: selected ? null : seats });
                        closeSeatDropdown();
                      }}
                      style={({ pressed }) => [
                        styles.seatOptionRow,
                        selected && styles.seatOptionRowSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <AppText
                        weight={selected ? 'semibold' : 'regular'}
                        style={[styles.seatOptionText, selected && styles.seatOptionTextSelected]}
                      >
                        {seats}
                      </AppText>
                      {selected ? (
                        <FontAwesome name="check" size={12} color={colors.primary} />
                      ) : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}
        </View>
      </Modal>

    </AppBottomSheet>
  );
}

type FilterSectionProps = {
  title: string;
  children: React.ReactNode;
};

function FilterSection({ title, children }: FilterSectionProps): React.ReactElement {
  return (
    <View style={styles.section}>
      <AppText weight="medium" style={styles.sectionTitle}>
        {title}
      </AppText>
      {children}
    </View>
  );
}

function ChipRow({ children }: { children: React.ReactNode }): React.ReactElement {
  return <View style={styles.chipRow}>{children}</View>;
}

type FilterChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function FilterChip({ label, selected, onPress }: FilterChipProps): React.ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.chipSelected : styles.chipIdle,
        pressed && styles.pressed,
      ]}
    >
      <AppText
        weight="semibold"
        style={[styles.chipLabel, selected ? styles.chipLabelSelected : styles.chipLabelIdle]}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.border.strong,
    marginBottom: spacing.sm,
  },
  sheetTitle: {
    fontSize: 17,
    color: colors.text.primary,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  headerActionDisabled: {
    opacity: 0.45,
  },
  headerActionPrimaryDisabled: {
    backgroundColor: colors.primaryDisabled,
    borderColor: colors.primaryDisabled,
  },
  headerActionTextDisabled: {
    color: colors.text.tertiary,
  },
  scrollContent: {
    gap: spacing.md,
    paddingBottom: CITY_RESULTS_MAX_HEIGHT + spacing.md,
  },
  scroll: {
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.default,
  },
  footerResetButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerResetText: {
    fontSize: 14,
    color: colors.primary,
  },
  footerApplyButton: {
    flex: 2,
    minHeight: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerApplyText: {
    fontSize: 14,
    color: colors.white,
  },
  footerApplyTextDisabled: {
    color: colors.text.tertiary,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: 13,
    color: colors.text.primary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipIdle: {
    backgroundColor: colors.white,
    borderColor: colors.border.default,
  },
  chipLabel: {
    fontSize: 12,
  },
  chipLabelSelected: {
    color: colors.white,
  },
  chipLabelIdle: {
    color: colors.text.primary,
  },
  seatDropdownWrap: {},
  seatDropdownTrigger: {
    minHeight: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  seatDropdownValue: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
  },
  seatPlaceholder: {
    color: colors.text.tertiary,
  },
  seatModalRoot: {
    flex: 1,
  },
  seatDropdownList: {
    position: 'absolute',
    height: SEAT_DROPDOWN_HEIGHT,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  seatDropdownScroll: {
    flexGrow: 0,
    height: SEAT_DROPDOWN_HEIGHT,
  },
  seatOptionRow: {
    height: SEAT_OPTION_HEIGHT,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
  },
  seatOptionRowSelected: {
    backgroundColor: colors.primarySoft,
  },
  seatOptionText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  seatOptionTextSelected: {
    color: colors.primary,
  },
  pressed: {
    opacity: 0.85,
  },
});
