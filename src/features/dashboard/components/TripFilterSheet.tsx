import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CitySearchField } from '@/features/dashboard/components/trip/CitySearchField';
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
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            disabled={!hasActiveFilters}
            onPress={handleReset}
            style={({ pressed }) => [
              styles.headerActionButton,
              !hasActiveFilters && styles.headerActionDisabled,
              pressed && hasActiveFilters && styles.pressed,
            ]}
          >
            <AppText
              weight="semibold"
              style={[styles.headerActionText, !hasActiveFilters && styles.headerActionTextDisabled]}
            >
              {t('dashboard.home.filterReset')}
            </AppText>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={!hasActiveFilters}
            onPress={handleApply}
            style={({ pressed }) => [
              styles.headerActionPrimary,
              !hasActiveFilters && styles.headerActionPrimaryDisabled,
              pressed && hasActiveFilters && styles.pressed,
            ]}
          >
            <View style={styles.headerActionPrimaryContent}>
              <FontAwesome
                name="check"
                size={12}
                color={hasActiveFilters ? colors.white : colors.text.tertiary}
              />
            </View>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
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

        <CitySearchField
          key={`departure-${resetSeed}`}
          label={t('dashboard.home.filterDepartureCity')}
          placeholder={t('trips.create.cityPlaceholder')}
          value={draft.departureCity}
          onChange={(departureCity) => patchDraft({ departureCity })}
        />

        <CitySearchField
          key={`arrival-${resetSeed}`}
          label={t('dashboard.home.filterArrivalCity')}
          placeholder={t('trips.create.cityPlaceholder')}
          value={draft.arrivalCity}
          onChange={(arrivalCity) => patchDraft({ arrivalCity })}
        />

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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerActionButton: {
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  headerActionPrimary: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  headerActionDisabled: {
    opacity: 0.45,
  },
  headerActionPrimaryDisabled: {
    backgroundColor: colors.primaryDisabled,
    borderColor: colors.primaryDisabled,
  },
  headerActionText: {
    fontSize: 12,
    color: colors.text.primary,
  },
  headerActionPrimaryText: {
    fontSize: 12,
    color: colors.white,
  },
  headerActionPrimaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActionTextDisabled: {
    color: colors.text.tertiary,
  },
  scrollContent: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  scroll: {
    flex: 1,
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
