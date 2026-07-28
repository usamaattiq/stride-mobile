import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
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
import { Button } from '@/shared/components/Button';
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

const SEAT_OPTIONS = [1, 2, 4, 6, 8] as const;

export function TripFilterSheet({
  visible,
  filters,
  onClose,
  onApply,
}: TripFilterSheetProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const [draft, setDraft] = React.useState<TripBrowseFilters>(filters);
  const [resetSeed, setResetSeed] = React.useState(0);

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
    <AppBottomSheet visible={visible} onClose={onClose} heightRatio={0.82}>
      <View style={styles.sheetHandle} />
      <AppText weight="semibold" style={styles.sheetTitle}>
        {t('dashboard.home.filterSheetTitle')}
      </AppText>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
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

        <FilterSection title={t('dashboard.home.filterSeats')}>
          <ChipRow>
            {SEAT_OPTIONS.map((seats) => {
              const selected = draft.minSeats === seats;
              const label = t('dashboard.home.filterSeatsCount', { count: seats });
              return (
                <FilterChip
                  key={seats}
                  label={label}
                  selected={selected}
                  onPress={() => patchDraft({ minSeats: selected ? null : seats })}
                />
              );
            })}
          </ChipRow>
        </FilterSection>
      </ScrollView>

      <View style={styles.actions}>
        <Button
          label={t('dashboard.home.filterReset')}
          variant="secondary"
          onPress={handleReset}
          disabled={!hasActiveFilters}
          style={styles.actionButton}
        />
        <Button
          label={t('dashboard.home.filterApply')}
          onPress={handleApply}
          disabled={!hasActiveFilters}
          style={styles.actionButton}
        />
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
    marginBottom: spacing.md,
  },
  scrollContent: {
    gap: spacing.md,
    paddingBottom: spacing.md,
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
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
  pressed: {
    opacity: 0.85,
  },
});
