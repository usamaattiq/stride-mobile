import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthCard } from '@/features/auth/components/AuthCard';
import { AuthTextField } from '@/features/auth/components/AuthTextField';
import type {
  TripDraft,
  TripLuggageOption,
  TripLuggageType,
} from '@/features/dashboard/types/trip.types';
import { isLuggageComplete } from '@/features/dashboard/types/trip.types';
import { i18n as appI18n } from '@/i18n';
import { AppBottomSheet } from '@/shared/components/AppBottomSheet';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { colors, radius, spacing } from '@/theme';

type TripLuggageStepProps = {
  draft: TripDraft;
  onChange: (partial: Partial<TripDraft>) => void;
  onContinue: () => void;
};

const LUGGAGE_TYPES: TripLuggageType[] = [
  'suitcase',
  'backpack',
  'duffel',
  'box',
  'other',
];

export function TripLuggageStep({
  draft,
  onChange,
  onContinue,
}: TripLuggageStepProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const [typeSheetOpen, setTypeSheetOpen] = React.useState(false);
  const hasLuggage = draft.luggageOption === 'checked';

  const selectOption = (luggageOption: TripLuggageOption) => {
    if (luggageOption === 'handCarry') {
      onChange({
        luggageOption,
        luggageType: null,
        luggageLength: '',
        luggageWidth: '',
        luggageWeight: '',
      });
      return;
    }
    onChange({ luggageOption });
  };

  const typeLabel = draft.luggageType
    ? t(`trips.create.luggageType_${draft.luggageType}`)
    : t('trips.create.luggageTypePlaceholder');

  return (
    <>
      <AuthCard>
        <View style={styles.form}>
          <AppText weight="medium" style={styles.label}>
            {t('trips.create.luggageChoiceLabel')}
            <AppText style={styles.required}> *</AppText>
          </AppText>

          <Pressable
            onPress={() => selectOption('handCarry')}
            style={[
              styles.optionCard,
              draft.luggageOption === 'handCarry' && styles.optionCardSelected,
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: draft.luggageOption === 'handCarry' }}
          >
            <View
              style={[
                styles.radio,
                draft.luggageOption === 'handCarry' && styles.radioSelected,
              ]}
            >
              {draft.luggageOption === 'handCarry' ? (
                <FontAwesome name="check" size={9} color={colors.white} />
              ) : null}
            </View>
            <View style={styles.optionCopy}>
              <AppText weight="bold" style={styles.optionTitle}>
                {t('trips.create.luggageHandCarry')}
              </AppText>
              <AppText style={styles.optionHint}>{t('trips.create.luggageHandCarryHint')}</AppText>
            </View>
          </Pressable>

          <Pressable
            onPress={() => selectOption('checked')}
            style={[styles.optionCard, hasLuggage && styles.optionCardSelected]}
            accessibilityRole="button"
            accessibilityState={{ selected: hasLuggage }}
          >
            <View style={[styles.radio, hasLuggage && styles.radioSelected]}>
              {hasLuggage ? <FontAwesome name="check" size={9} color={colors.white} /> : null}
            </View>
            <View style={styles.optionCopy}>
              <AppText weight="bold" style={styles.optionTitle}>
                {t('trips.create.luggageChecked')}
              </AppText>
              <AppText style={styles.optionHint}>{t('trips.create.luggageCheckedHint')}</AppText>
            </View>
          </Pressable>

          {hasLuggage ? (
            <View style={styles.fields}>
              <View style={styles.dropdownWrap}>
                <AppText weight="medium" style={styles.label}>
                  {t('trips.create.luggageType')}
                  <AppText style={styles.required}> *</AppText>
                </AppText>
                <Pressable
                  onPress={() => setTypeSheetOpen(true)}
                  style={styles.dropdown}
                  accessibilityRole="button"
                >
                  <AppText
                    weight="semibold"
                    style={[
                      styles.dropdownValue,
                      !draft.luggageType && styles.dropdownPlaceholder,
                    ]}
                    numberOfLines={1}
                  >
                    {typeLabel}
                  </AppText>
                  <FontAwesome name="chevron-down" size={12} color={colors.text.secondary} />
                </Pressable>
              </View>

              <View style={styles.dimsRow}>
                <View style={styles.dimField}>
                  <AuthTextField
                    label={t('trips.create.luggageLength')}
                    required
                    dense
                    value={draft.luggageLength}
                    onChangeText={(luggageLength) => onChange({ luggageLength })}
                    placeholder="cm"
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.dimField}>
                  <AuthTextField
                    label={t('trips.create.luggageWidth')}
                    required
                    dense
                    value={draft.luggageWidth}
                    onChangeText={(luggageWidth) => onChange({ luggageWidth })}
                    placeholder="cm"
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              <AuthTextField
                label={t('trips.create.luggageWeight')}
                required
                dense
                value={draft.luggageWeight}
                onChangeText={(luggageWeight) => onChange({ luggageWeight })}
                placeholder="kg"
                keyboardType="decimal-pad"
              />
            </View>
          ) : null}

          <Button
            label={t('common.continue')}
            onPress={onContinue}
            disabled={!isLuggageComplete(draft)}
          />
        </View>
      </AuthCard>

      <AppBottomSheet visible={typeSheetOpen} onClose={() => setTypeSheetOpen(false)} heightRatio={0.55}>
        <View style={styles.sheetBody}>
          <AppText weight="bold" style={styles.sheetTitle}>
            {t('trips.create.luggageType')}
          </AppText>
          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {LUGGAGE_TYPES.map((type) => {
              const selected = draft.luggageType === type;
              return (
                <Pressable
                  key={type}
                  onPress={() => {
                    onChange({ luggageType: type });
                    setTypeSheetOpen(false);
                  }}
                  style={[styles.sheetRow, selected && styles.sheetRowSelected]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  <AppText weight={selected ? 'bold' : 'medium'} style={styles.sheetRowLabel}>
                    {t(`trips.create.luggageType_${type}`)}
                  </AppText>
                  {selected ? <FontAwesome name="check" size={14} color={colors.primary} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </AppBottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.sm,
  },
  label: {
    fontSize: 13,
    color: colors.text.primary,
  },
  required: {
    fontSize: 13,
    color: colors.primary,
  },
  optionCard: {
    minHeight: 72,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  optionCopy: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontSize: 15,
    color: colors.text.primary,
  },
  optionHint: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.secondary,
  },
  fields: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  dropdownWrap: {
    gap: spacing.xs,
  },
  dropdown: {
    minHeight: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md - 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  dropdownValue: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
  },
  dropdownPlaceholder: {
    color: colors.text.tertiary,
  },
  dimsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  dimField: {
    flex: 1,
  },
  sheetBody: {
    flex: 1,
    paddingTop: spacing.xs,
  },
  sheetTitle: {
    fontSize: 17,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  sheetScroll: {
    flex: 1,
  },
  sheetScrollContent: {
    paddingBottom: spacing.md,
    gap: spacing.xxs,
  },
  sheetRow: {
    minHeight: 52,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetRowSelected: {
    backgroundColor: colors.primarySoft,
  },
  sheetRowLabel: {
    fontSize: 15,
    color: colors.text.primary,
  },
});
