import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { VEHICLE_CLASS_OPTIONS } from '@/features/dashboard/constants/vehicleClasses';
import {
  countActiveVehicleBrowseFilters,
  EMPTY_VEHICLE_BROWSE_FILTERS,
  type VehicleAcFilter,
  type VehicleBrowseFilters,
} from '@/features/dashboard/types/vehicleBrowse.types';
import { i18n as appI18n } from '@/i18n';
import { AppBottomSheet } from '@/shared/components/AppBottomSheet';
import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

type VehicleFilterSheetProps = {
  visible: boolean;
  filters: VehicleBrowseFilters;
  onClose: () => void;
  onApply: (filters: VehicleBrowseFilters) => void;
};

const AC_OPTIONS: { id: VehicleAcFilter; labelKey: string }[] = [
  { id: 'any', labelKey: 'vehicles.filter.acAny' },
  { id: 'ac', labelKey: 'vehicles.fields.acOn' },
  { id: 'nonAc', labelKey: 'vehicles.fields.acOff' },
];

export function VehicleFilterSheet({
  visible,
  filters,
  onClose,
  onApply,
}: VehicleFilterSheetProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const [draft, setDraft] = React.useState<VehicleBrowseFilters>(filters);

  React.useEffect(() => {
    if (visible) {
      setDraft(filters);
    }
  }, [filters, visible]);

  const activeCount = countActiveVehicleBrowseFilters(draft);
  const hasActiveFilters = activeCount > 0;

  const handleReset = () => {
    setDraft(EMPTY_VEHICLE_BROWSE_FILTERS);
    onApply(EMPTY_VEHICLE_BROWSE_FILTERS);
    onClose();
  };

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  return (
    <AppBottomSheet visible={visible} onClose={onClose} heightRatio={0.52}>
      <View style={styles.sheetHandle} />
      <View style={styles.headerRow}>
        <AppText weight="semibold" style={styles.sheetTitle}>
          {t('vehicles.filter.title')}
        </AppText>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <FilterSection title={t('vehicles.fields.class')}>
          <ChipRow>
            {VEHICLE_CLASS_OPTIONS.map((option) => {
              const selected = draft.vehicleClass === option.id;
              return (
                <FilterChip
                  key={option.id}
                  label={t(option.labelKey)}
                  selected={selected}
                  onPress={() =>
                    setDraft((current) => ({
                      ...current,
                      vehicleClass: selected ? null : option.id,
                    }))
                  }
                />
              );
            })}
          </ChipRow>
        </FilterSection>

        <FilterSection title={t('vehicles.fields.acTitle')}>
          <ChipRow>
            {AC_OPTIONS.map((option) => {
              const selected = draft.ac === option.id;
              return (
                <FilterChip
                  key={option.id}
                  label={t(option.labelKey)}
                  selected={selected}
                  onPress={() => setDraft((current) => ({ ...current, ac: option.id }))}
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
            !hasActiveFilters && styles.actionDisabled,
            pressed && hasActiveFilters && styles.pressed,
          ]}
        >
          <AppText
            weight="semibold"
            style={[styles.footerResetText, !hasActiveFilters && styles.actionTextDisabled]}
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
  scroll: {
    flex: 1,
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
  actionDisabled: {
    opacity: 0.45,
  },
  actionTextDisabled: {
    color: colors.text.tertiary,
  },
  pressed: {
    opacity: 0.85,
  },
});
