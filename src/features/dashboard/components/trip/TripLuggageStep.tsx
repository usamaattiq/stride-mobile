import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthCard } from '@/features/auth/components/AuthCard';
import { AuthTextField } from '@/features/auth/components/AuthTextField';
import type {
  TripDraft,
  TripLuggageDraftItem,
  TripLuggageOption,
  TripLuggageType,
} from '@/features/dashboard/types/trip.types';
import {
  emptyLuggageDraftItem,
  isLuggageComplete,
  isLuggageDraftItemComplete,
  MAX_LUGGAGE_ITEMS,
} from '@/features/dashboard/types/trip.types';
import { i18n as appI18n } from '@/i18n';
import { AppBottomSheet } from '@/shared/components/AppBottomSheet';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { colors, radius, spacing } from '@/theme';

type TripLuggageStepProps = {
  draft: TripDraft;
  onChange: (partial: Partial<TripDraft>) => void;
  onContinue: () => void;
  errorMessage?: string | null;
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
  errorMessage,
}: TripLuggageStepProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });
  const [typeSheetOpen, setTypeSheetOpen] = React.useState(false);
  const [editingIndex, setEditingIndex] = React.useState(0);
  const hasLuggage = draft.luggageOption === 'checked';
  const itemsComplete =
    draft.luggageItems.length > 0 && draft.luggageItems.every(isLuggageDraftItemComplete);
  const canAddMore = itemsComplete && draft.luggageItems.length < MAX_LUGGAGE_ITEMS;
  const lastIndex = Math.max(0, draft.luggageItems.length - 1);
  const safeEditingIndex =
    editingIndex < 0 ? -1 : Math.min(editingIndex, lastIndex);
  const editingItem =
    safeEditingIndex >= 0 ? draft.luggageItems[safeEditingIndex] : undefined;

  const itemTypeLabel = (item: TripLuggageDraftItem) =>
    item.type ? t(`trips.create.luggageType_${item.type}`) : t('trips.create.luggageNew');

  const itemSummary = (item: TripLuggageDraftItem) => {
    const size =
      item.length.trim() && item.width.trim() ? `${item.length}×${item.width} cm` : null;
    const weight = item.weight.trim() ? `${item.weight} kg` : null;
    return [size, weight].filter(Boolean).join(' · ');
  };

  const isExpanded = (index: number, item: TripLuggageDraftItem) =>
    index === safeEditingIndex || !isLuggageDraftItemComplete(item);

  const patchItems = (luggageItems: TripLuggageDraftItem[]) => {
    onChange({ luggageItems });
  };

  const selectOption = (luggageOption: TripLuggageOption) => {
    if (luggageOption === 'handCarry') {
      onChange({ luggageOption, luggageItems: [] });
      setEditingIndex(0);
      return;
    }
    const nextItems =
      draft.luggageItems.length > 0 ? draft.luggageItems : [emptyLuggageDraftItem()];
    onChange({ luggageOption, luggageItems: nextItems });
    setEditingIndex(nextItems.length - 1);
  };

  const updateItem = (index: number, partial: Partial<TripLuggageDraftItem>) => {
    patchItems(
      draft.luggageItems.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...partial } : item,
      ),
    );
  };

  const addItem = () => {
    if (!canAddMore) {
      return;
    }
    const next = [...draft.luggageItems, emptyLuggageDraftItem()];
    patchItems(next);
    setEditingIndex(next.length - 1);
  };

  const removeItem = (index: number) => {
    if (draft.luggageItems.length <= 1) {
      return;
    }
    const next = draft.luggageItems.filter((_, itemIndex) => itemIndex !== index);
    patchItems(next);
    setEditingIndex(Math.min(index, next.length - 1));
  };

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

          {hasLuggage
            ? draft.luggageItems.map((item, index) => {
                const expanded = isExpanded(index, item);
                const summary = itemSummary(item);
                return (
                  <View
                    key={`luggage-${index}`}
                    style={[styles.pieceCard, expanded && styles.pieceCardExpanded]}
                  >
                    <View style={styles.pieceHeader}>
                      <Pressable
                        onPress={() =>
                          setEditingIndex(expanded && isLuggageDraftItemComplete(item) ? -1 : index)
                        }
                        style={styles.pieceHeaderMain}
                        accessibilityRole="button"
                        accessibilityState={{ expanded }}
                      >
                        <View style={styles.pieceHeaderCopy}>
                          <AppText weight="semibold" style={styles.pieceTitle} numberOfLines={1}>
                            {itemTypeLabel(item)}
                          </AppText>
                          {!expanded && summary ? (
                            <AppText style={styles.pieceSummary} numberOfLines={1}>
                              {summary}
                            </AppText>
                          ) : null}
                        </View>
                        <FontAwesome
                          name={expanded ? 'chevron-up' : 'chevron-down'}
                          size={12}
                          color={colors.text.secondary}
                        />
                      </Pressable>
                      {draft.luggageItems.length > 1 ? (
                        <Pressable
                          onPress={() => removeItem(index)}
                          hitSlop={8}
                          accessibilityRole="button"
                          accessibilityLabel={t('common.remove')}
                          style={styles.removeHit}
                        >
                          <AppText style={styles.removeText}>{t('common.remove')}</AppText>
                        </Pressable>
                      ) : null}
                    </View>

                    {expanded ? (
                      <View style={styles.fields}>
                        <View style={styles.dropdownWrap}>
                          <AppText weight="medium" style={styles.label}>
                            {t('trips.create.luggageType')}
                            <AppText style={styles.required}> *</AppText>
                          </AppText>
                          <Pressable
                            onPress={() => {
                              setEditingIndex(index);
                              setTypeSheetOpen(true);
                            }}
                            style={styles.dropdown}
                            accessibilityRole="button"
                          >
                            <AppText
                              weight="semibold"
                              style={[
                                styles.dropdownValue,
                                !item.type && styles.dropdownPlaceholder,
                              ]}
                              numberOfLines={1}
                            >
                              {item.type
                                ? t(`trips.create.luggageType_${item.type}`)
                                : t('trips.create.luggageTypePlaceholder')}
                            </AppText>
                            <FontAwesome
                              name="chevron-down"
                              size={12}
                              color={colors.text.secondary}
                            />
                          </Pressable>
                        </View>

                        <View style={styles.dimsRow}>
                          <View style={styles.dimField}>
                            <AuthTextField
                              label={t('trips.create.luggageLength')}
                              required
                              dense
                              value={item.length}
                              onChangeText={(length) => updateItem(index, { length })}
                              placeholder="cm"
                              keyboardType="decimal-pad"
                            />
                          </View>
                          <View style={styles.dimField}>
                            <AuthTextField
                              label={t('trips.create.luggageWidth')}
                              required
                              dense
                              value={item.width}
                              onChangeText={(width) => updateItem(index, { width })}
                              placeholder="cm"
                              keyboardType="decimal-pad"
                            />
                          </View>
                        </View>
                        <AuthTextField
                          label={t('trips.create.luggageWeight')}
                          required
                          dense
                          value={item.weight}
                          onChangeText={(weight) => updateItem(index, { weight })}
                          placeholder="kg"
                          keyboardType="decimal-pad"
                        />
                      </View>
                    ) : null}
                  </View>
                );
              })
            : null}

          {hasLuggage ? (
            <Button
              label={t('trips.create.luggageAddMore')}
              variant="secondary"
              onPress={addItem}
              disabled={!canAddMore}
            />
          ) : null}

          {errorMessage ? <AppText style={styles.submitError}>{errorMessage}</AppText> : null}
          <Button
            label={t('common.continue')}
            onPress={onContinue}
            disabled={!isLuggageComplete(draft)}
            eagerPress
          />
        </View>
      </AuthCard>

      <AppBottomSheet
        visible={typeSheetOpen}
        onClose={() => setTypeSheetOpen(false)}
        heightRatio={0.55}
      >
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
              const selected = editingItem?.type === type;
              return (
                <Pressable
                  key={type}
                  onPress={() => {
                    updateItem(safeEditingIndex, { type });
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
  pieceCard: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  pieceCardExpanded: {
    borderColor: colors.primaryMuted,
  },
  pieceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pieceHeaderMain: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pieceHeaderCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  pieceTitle: {
    fontSize: 14,
    color: colors.text.primary,
  },
  pieceSummary: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  removeHit: {
    paddingLeft: spacing.xs,
  },
  fields: {
    gap: spacing.sm,
  },
  removeText: {
    fontSize: 13,
    color: colors.primary,
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
  submitError: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.primary,
  },
});
