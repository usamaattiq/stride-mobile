import React from 'react';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { DateTimePickerField } from '@/features/dashboard/components/trip/DateTimePickerField';
import type { TripDraft, TripStartMode } from '@/features/dashboard/types/trip.types';
import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { colors, radius, spacing } from '@/theme';

type TripScheduleStepProps = {
  draft: TripDraft;
  onChange: (partial: Partial<TripDraft>) => void;
  onContinue: () => void;
};

type StartModeOption = {
  id: TripStartMode;
  title: string;
  description: string;
  icon: React.ReactNode;
  selectedIcon: React.ReactNode;
};

function isScheduleComplete(draft: TripDraft): boolean {
  if (!draft.startMode) {
    return false;
  }
  if (draft.startMode === 'instant') {
    return true;
  }
  return Boolean(draft.scheduledStartAt);
}

export function TripScheduleStep({
  draft,
  onChange,
  onContinue,
}: TripScheduleStepProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  const options: StartModeOption[] = [
    {
      id: 'instant',
      title: t('trips.create.startInstant'),
      description: t('trips.create.startInstantHint'),
      icon: <FontAwesome name="paper-plane" size={16} color={colors.text.tertiary} />,
      selectedIcon: <FontAwesome name="paper-plane" size={16} color={colors.primary} />,
    },
    {
      id: 'scheduled',
      title: t('trips.create.startScheduled'),
      description: t('trips.create.startScheduledHint'),
      icon: <FontAwesome name="calendar" size={16} color={colors.text.tertiary} />,
      selectedIcon: <FontAwesome name="calendar" size={16} color={colors.primary} />,
    },
  ];

  const selectMode = (startMode: TripStartMode) => {
    onChange({
      startMode,
      scheduledStartAt: startMode === 'instant' ? null : draft.scheduledStartAt,
    });
  };

  return (
    <View style={styles.form}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <MaterialCommunityIcons name="calendar-clock" size={26} color={colors.primary} />
          </View>
          <AppText weight="bold" style={styles.headerTitle}>
            {t('trips.create.schedulePrompt')}
          </AppText>
          <AppText style={styles.headerSubtitle}>{t('trips.create.schedulePromptHint')}</AppText>
        </View>

        <View style={styles.options}>
          {options.map((option) => {
            const selected = draft.startMode === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => selectMode(option.id)}
                style={[styles.optionCard, selected && styles.optionCardSelected]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                {selected ? (
                  <View style={styles.checkBadge}>
                    <FontAwesome name="check" size={9} color={colors.white} />
                  </View>
                ) : null}

                <View style={[styles.optionIcon, selected && styles.optionIconSelected]}>
                  {selected ? option.selectedIcon : option.icon}
                </View>

                <View style={styles.optionCopy}>
                  <AppText weight="bold" style={styles.optionTitle}>
                    {option.title}
                  </AppText>
                  <AppText style={styles.optionDescription}>{option.description}</AppText>
                </View>
              </Pressable>
            );
          })}
        </View>

        {draft.startMode === 'scheduled' ? (
          <DateTimePickerField
            label={t('trips.create.scheduledStart')}
            value={draft.scheduledStartAt}
            onChange={(scheduledStartAt) => onChange({ scheduledStartAt })}
            minimumDate={new Date()}
            required
          />
        ) : null}

        <View style={styles.infoBanner}>
          <View style={styles.infoIcon}>
            <FontAwesome name="info" size={12} color={colors.accent.blue.text} />
          </View>
          <View style={styles.infoCopy}>
            <AppText weight="bold" style={styles.infoTitle}>
              {t('trips.create.scheduleChangeLaterTitle')}
            </AppText>
            <AppText style={styles.infoBody}>
              {t('trips.create.scheduleChangeLaterBody')}
            </AppText>
          </View>
        </View>

        <Button
          label={`${t('common.continue')} →`}
          onPress={onContinue}
          disabled={!isScheduleComplete(draft)}
        />
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
  },
  header: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.xxs,
  },
  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxs,
  },
  headerTitle: {
    fontSize: 18,
    lineHeight: 24,
    color: colors.text.primary,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
    textAlign: 'center',
    maxWidth: 300,
  },
  options: {
    gap: spacing.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    position: 'relative',
  },
  optionCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconSelected: {
    backgroundColor: colors.white,
  },
  optionCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    paddingRight: spacing.md,
  },
  optionTitle: {
    fontSize: 15,
    color: colors.text.primary,
  },
  optionDescription: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.secondary,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.accent.blue.soft,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  infoIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent.blue.text,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  infoCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  infoTitle: {
    fontSize: 13,
    color: colors.text.primary,
  },
  infoBody: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.text.secondary,
  },
});
