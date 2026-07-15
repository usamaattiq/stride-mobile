import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/shared/components/AppText';
import { AppBottomSheet } from '@/shared/components/AppBottomSheet';
import { colors, spacing } from '@/theme';

export type LegalDocumentSection = {
  title: string;
  body: string;
};

type LegalDocumentBottomSheetProps = {
  visible: boolean;
  title: string;
  lastUpdated: string;
  intro: string;
  sections: LegalDocumentSection[];
  closeLabel: string;
  onClose: () => void;
  heightRatio?: number;
};

export function LegalDocumentBottomSheet({
  visible,
  title,
  lastUpdated,
  intro,
  sections,
  closeLabel,
  onClose,
  heightRatio = 0.8,
}: LegalDocumentBottomSheetProps): React.ReactElement {
  return (
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      heightRatio={heightRatio}
      sheetStyle={styles.sheet}
    >
      <View style={styles.sheetHandle} />
      <View style={styles.headerRow}>
        <AppText weight="semibold" style={styles.sheetTitle}>
          {title}
        </AppText>
        <Pressable
          onPress={onClose}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
        >
          <AppText weight="medium" style={styles.closeAction}>
            {closeLabel}
          </AppText>
        </Pressable>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AppText style={styles.lastUpdated}>{lastUpdated}</AppText>
        <AppText style={styles.intro}>{intro}</AppText>
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <AppText weight="semibold" style={styles.sectionTitle}>
              {section.title}
            </AppText>
            <AppText style={styles.sectionBody}>{section.body}</AppText>
          </View>
        ))}
      </ScrollView>
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  sheet: {
    paddingHorizontal: spacing.lg,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 99,
    backgroundColor: colors.border.strong,
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sheetTitle: {
    flex: 1,
    fontSize: 17,
    color: colors.text.primary,
  },
  closeAction: {
    fontSize: 14,
    color: colors.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  lastUpdated: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  intro: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.text.primary,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
  sectionBody: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.text.secondary,
  },
});
