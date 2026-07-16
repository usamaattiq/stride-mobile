import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

import { AppText } from '@/shared/components/AppText';
import { colors, radius, spacing } from '@/theme';

import {
  settingsMenuIconStyle,
  type SettingsMenuItem,
  type SettingsMenuSection,
} from '../constants/settingsMenu';

type SettingsMenuSectionCardProps = {
  section: SettingsMenuSection;
  title: string;
  itemLabel: (item: SettingsMenuItem) => { title: string; subtitle: string };
  resolveAccessory?: (item: SettingsMenuItem) => string | undefined;
  onPressItem: (item: SettingsMenuItem) => void;
};

export function SettingsMenuSectionCard({
  section,
  title,
  itemLabel,
  resolveAccessory,
  onPressItem,
}: SettingsMenuSectionCardProps): React.ReactElement {
  return (
    <View style={styles.group}>
      <AppText weight="bold" style={styles.heading}>
        {title}
      </AppText>
      <View style={styles.card}>
        {section.items.map((item, index) => {
          const labels = itemLabel(item);
          return (
            <SettingsMenuRow
              key={item.id}
              item={item}
              title={labels.title}
              subtitle={labels.subtitle}
              accessory={resolveAccessory?.(item)}
              isLast={index === section.items.length - 1}
              onPress={() => onPressItem(item)}
            />
          );
        })}
      </View>
    </View>
  );
}

type SettingsMenuRowProps = {
  item: SettingsMenuItem;
  title: string;
  subtitle: string;
  accessory?: string;
  isLast: boolean;
  onPress: () => void;
};

function SettingsMenuRow({
  item,
  title,
  subtitle,
  accessory,
  isLast,
  onPress,
}: SettingsMenuRowProps): React.ReactElement {
  return (
    <Pressable
      style={[styles.row, !isLast && styles.rowBorder]}
      accessibilityRole="button"
      onPress={onPress}
    >
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: settingsMenuIconStyle.iconBackgroundColor },
        ]}
      >
        <FontAwesome name={item.icon} size={14} color={settingsMenuIconStyle.iconColor} />
      </View>
      <View style={styles.copy}>
        <AppText weight="semibold" style={styles.rowTitle} numberOfLines={1}>
          {title}
        </AppText>
        <AppText style={styles.rowSubtitle} numberOfLines={1}>
          {subtitle}
        </AppText>
      </View>
      {accessory && item.action === 'language' ? (
        <AppText style={styles.accessory} numberOfLines={1}>
          {accessory}
        </AppText>
      ) : null}
      <FontAwesome name="chevron-right" size={11} color={colors.border.strong} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.xs,
  },
  heading: {
    fontSize: 13,
    color: colors.text.secondary,
    marginLeft: 2,
  },
  card: {
    borderRadius: radius.md,
    backgroundColor: colors.white,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.default,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rowTitle: {
    fontSize: 14,
    color: colors.text.primary,
  },
  rowSubtitle: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  accessory: {
    fontSize: 12,
    color: colors.text.secondary,
    marginRight: 4,
    maxWidth: 96,
  },
});
