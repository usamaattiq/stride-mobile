import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthCard } from '@/features/auth/components/AuthCard';
import type { TripRouteType } from '@/features/dashboard/types/trip.types';
import { i18n as appI18n } from '@/i18n';
import { AppText } from '@/shared/components/AppText';
import { Button } from '@/shared/components/Button';
import { colors, radius, spacing } from '@/theme';

type TripRouteTypeStepProps = {
  value: TripRouteType | null;
  onChange: (value: TripRouteType) => void;
  onContinue: () => void;
};

const OPTIONS: Array<{
  id: TripRouteType;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
}> = [
  { id: 'land', icon: 'road' },
  { id: 'sea', icon: 'ship' },
  { id: 'air', icon: 'plane' },
];


export function TripRouteTypeStep({
  value,
  onChange,
  onContinue,
}: TripRouteTypeStepProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  const titleFor = (id: TripRouteType) => {
    if (id === 'land') {
      return t('trips.create.routeTypeLand');
    }
    if (id === 'sea') {
      return t('trips.create.routeTypeSea');
    }
    return t('trips.create.routeTypeAir');
  };

  return (
    <AuthCard>
      <View style={styles.form}>
        <View style={styles.tiles}>
          {OPTIONS.map((option) => {
            const selected = value === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => onChange(option.id)}
                style={[styles.tile, selected && styles.tileSelected]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                {selected ? (
                  <View style={styles.checkBadge}>
                    <FontAwesome name="check" size={11} color={colors.white} />
                  </View>
                ) : null}

                <AppText weight="bold" style={styles.tileTitle} numberOfLines={1}>
                  {titleFor(option.id)}
                </AppText>

                <View style={styles.iconWrap}>
                  <FontAwesome name={option.icon} size={32} color={colors.text.secondary} />
                </View>
              </Pressable>
            );
          })}
        </View>

        <Button label={t('common.continue')} onPress={onContinue} disabled={!value} eagerPress />
      </View>
    </AuthCard>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
  },
  tiles: {
    width: '100%',
    gap: spacing.sm + 2,
  },
  tile: {
    width: '100%',
    minHeight: 92,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  tileSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  checkBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileTitle: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    paddingRight: spacing.sm,
  },
  iconWrap: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
