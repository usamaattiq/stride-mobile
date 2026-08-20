import React from "react";
import { Pressable, ScrollView, StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { i18n as appI18n } from "@/i18n";
import { AppText } from "@/shared/components/AppText";
import { colors, radius, spacing } from "@/theme";

import {
  ROUTE_TYPE_ICONS,
  ROUTE_TYPE_LABEL_KEYS,
} from "../constants/routeTypes";
import type { TripRouteType } from "../types/trip.types";

type RouteTypeFilterChipsProps = {
  value: TripRouteType | null;
  onChange: (next: TripRouteType | null) => void;
};

const ROUTE_TYPES: TripRouteType[] = ["land", "sea", "air"];

export function RouteTypeFilterChips({
  value,
  onChange,
}: RouteTypeFilterChipsProps): React.ReactElement {
  const { t } = useTranslation(undefined, { i18n: appI18n });

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityLabel={t("dashboard.home.routeFilterA11y")}
    >
      <Chip
        selected={value === null}
        label={t("dashboard.home.routeFilterAll")}
        onPress={() => onChange(null)}
      />
      {ROUTE_TYPES.map((routeType) => {
        const selected = value === routeType;
        return (
          <Chip
            key={routeType}
            selected={selected}
            label={t(ROUTE_TYPE_LABEL_KEYS[routeType])}
            icon={ROUTE_TYPE_ICONS[routeType]}
            onPress={() => onChange(selected ? null : routeType)}
          />
        );
      })}
    </ScrollView>
  );
}

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: React.ComponentProps<typeof FontAwesome>["name"];
};

function Chip({
  label,
  selected,
  onPress,
  icon,
}: ChipProps): React.ReactElement {
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
      {icon ? (
        <FontAwesome
          name={icon}
          size={11}
          color={selected ? colors.white : colors.text.secondary}
        />
      ) : null}
      <AppText
        weight="semibold"
        style={[
          styles.label,
          selected ? styles.labelSelected : styles.labelIdle,
        ]}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    gap: spacing.xs,
    paddingRight: spacing.md,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
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
  label: {
    fontSize: 12,
  },
  labelSelected: {
    color: colors.white,
  },
  labelIdle: {
    color: colors.text.primary,
  },
  pressed: {
    opacity: 0.85,
  },
});
