import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { VEHICLE_CLASS_OPTIONS } from '@/features/dashboard/constants/vehicleClasses';
import type { TripListingType, TripPaymentMethod } from '@/features/dashboard/types/trip.types';
import {
  countActiveSearchResultsFilters,
  EMPTY_SEARCH_RESULTS_FILTERS,
  type SearchResultsFilters,
} from '@/features/dashboard/types/tripBrowse.types';
import { i18n as appI18n } from '@/i18n';
import { AppBottomSheet } from '@/shared/components/AppBottomSheet';
import { AppText } from '@/shared/components/AppText';
import { formatPriceWithCurrency } from '@/shared/utils/currency';
import { colors, radius, spacing } from '@/theme';

import { PriceRangeSlider } from './trip/PriceRangeSlider';

const PRICE_FLOOR = 0;
const PRICE_CEILING = 1000000;
const PRICE_STEP = 500;

type SearchResultsFilterSheetProps = {
  visible: boolean;
  filters: SearchResultsFilters;
  onClose: () => void;
  onApply: (filters: SearchResultsFilters) => void;
};

type ChipOption<T extends string> = {
  id: T;
  labelKey: string;
};

const LISTING_TYPE_OPTIONS: ChipOption<TripListingType>[] = [
  { id: 'rfq', labelKey: 'trips.create.listingRfq' },
  { id: 'auction', labelKey: 'trips.create.listingAuction' },
];

const PAYMENT_OPTIONS: ChipOption<TripPaymentMethod>[] = [
  { id: 'cash', labelKey: 'trips.create.paymentCash' },
  { id: 'online', labelKey: 'trips.create.paymentOnline' },
  { id: 'both', labelKey: 'trips.create.paymentBoth' },
];

function formatPrice(value: number): string {
  return formatPriceWithCurrency(value);
}

export function SearchResultsFilterSheet({
  visible,
  filters,
  onClose,
  onApply,
}: SearchResultsFilterSheetProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const [draft, setDraft] = React.useState<SearchResultsFilters>(filters);
  const [priceDragging, setPriceDragging] = React.useState(false);

  React.useEffect(() => {
    if (visible) {
      setDraft(filters);
      setPriceDragging(false);
    }
  }, [filters, visible]);

  const activeCount = countActiveSearchResultsFilters(draft);
  const hasActiveFilters = activeCount > 0;

  const patchDraft = (partial: Partial<SearchResultsFilters>) => {
    setDraft((current) => ({ ...current, ...partial }));
  };

  const handleReset = () => {
    setDraft(EMPTY_SEARCH_RESULTS_FILTERS);
    onApply(EMPTY_SEARCH_RESULTS_FILTERS);
    onClose();
  };

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  return (
    <AppBottomSheet visible={visible} onClose={onClose} heightRatio={0.66}>
      <View style={styles.sheetHandle} />
      <View style={styles.headerRow}>
        <AppText weight="semibold" style={styles.sheetTitle}>
          {t('dashboard.home.filterSheetTitle')}
        </AppText>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        // iOS: ScrollView steals horizontal thumb drags unless locked while sliding.
        scrollEnabled={!priceDragging}
        keyboardShouldPersistTaps="handled"
      >
        <FilterSection title={t('dashboard.search.results.priceRange')}>
          <PriceRangeSlider
            floor={PRICE_FLOOR}
            ceiling={PRICE_CEILING}
            step={PRICE_STEP}
            value={draft.priceRange}
            onChange={(priceRange) => patchDraft({ priceRange })}
            onDraggingChange={setPriceDragging}
            formatValue={formatPrice}
          />
        </FilterSection>

        <FilterSection title={t('dashboard.search.results.listingType')}>
          <ChipRow>
            {LISTING_TYPE_OPTIONS.map((option) => {
              const selected = draft.listingType === option.id;
              return (
                <FilterChip
                  key={option.id}
                  label={t(option.labelKey)}
                  selected={selected}
                  onPress={() =>
                    patchDraft({ listingType: selected ? null : option.id })
                  }
                />
              );
            })}
          </ChipRow>
        </FilterSection>

        <FilterSection title={t('dashboard.search.results.vehicleType')}>
          <ChipRow>
            {VEHICLE_CLASS_OPTIONS.map((option) => {
              const selected = draft.vehicleClass === option.id;
              return (
                <FilterChip
                  key={option.id}
                  label={t(option.labelKey)}
                  selected={selected}
                  onPress={() =>
                    patchDraft({ vehicleClass: selected ? null : option.id })
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
                    patchDraft({ paymentMethod: selected ? null : option.id })
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
          onPress={handleApply}
          style={({ pressed }) => [styles.footerApplyButton, pressed && styles.pressed]}
        >
          <AppText weight="bold" style={styles.footerApplyText}>
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
  headerActionTextDisabled: {
    color: colors.text.tertiary,
  },
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    gap: spacing.lg,
    paddingBottom: spacing.md,
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
  section: {
    gap: spacing.sm,
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
