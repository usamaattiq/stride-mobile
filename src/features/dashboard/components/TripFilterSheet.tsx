import React from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { SeatsStepper } from '@/features/dashboard/components/SeatsStepper';
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

const FILTER_SEATS_MIN = 1;
const FILTER_SEATS_MAX = 50;

export function TripFilterSheet({
  visible,
  filters,
  onClose,
  onApply,
}: TripFilterSheetProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const [draft, setDraft] = React.useState<TripBrowseFilters>(filters);
  const [resetSeed, setResetSeed] = React.useState(0);
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

  React.useEffect(() => {
    if (visible) {
      setDraft(filters);
    }
  }, [filters, visible]);

  const activeCount = countActiveTripBrowseFilters(draft);
  const hasActiveFilters = activeCount > 0;

  const patchDraft = (partial: Partial<TripBrowseFilters>) => {
    setDraft((current) => ({ ...current, ...partial }));
  };

  const handleReset = () => {
    const clearedFilters = EMPTY_TRIP_BROWSE_FILTERS;
    setDraft(clearedFilters);
    setResetSeed((current) => current + 1);
    onApply(clearedFilters);
    onClose();
  };

  const handleApply = () => {
    if (!hasActiveFilters) {
      return;
    }
    onApply(draft);
    onClose();
  };

  return (
    <AppBottomSheet visible={visible} onClose={onClose} heightRatio={0.75}>
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
        <SeatsStepper
          label={t('dashboard.home.filterSeats')}
          value={draft.minSeats ?? FILTER_SEATS_MIN}
          min={FILTER_SEATS_MIN}
          max={FILTER_SEATS_MAX}
          onChange={(minSeats) => patchDraft({ minSeats })}
        />

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
  pressed: {
    opacity: 0.85,
  },
});
