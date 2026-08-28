import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';

import { colors, radius, spacing } from '@/theme';

import { AppText } from './AppText';
import { Button } from './Button';

export type AppDialogAction = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export type AppDialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  children?: React.ReactNode;
  /** FontAwesome glyph shown in the badge above the title. */
  icon?: React.ComponentProps<typeof FontAwesome>['name'];
  confirmAction: AppDialogAction;
  /** Omit for a single-button, informational dialog. */
  cancelAction?: AppDialogAction;
};

/**
 * Branded stand-in for Alert.alert — same "confirm or cancel" shape, but
 * themed to match the app instead of the bare OS dialog.
 */
export function AppDialog({
  visible,
  title,
  message,
  children,
  icon = 'exclamation',
  confirmAction,
  cancelAction,
}: AppDialogProps): React.ReactElement {
  const dismiss = cancelAction?.onPress ?? confirmAction.onPress;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <KeyboardAvoidingView behavior="padding" style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={dismiss}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <FontAwesome name={icon} size={20} color={colors.primary} />
          </View>

          <AppText weight="bold" style={styles.title}>
            {title}
          </AppText>

          {message ? <AppText style={styles.message}>{message}</AppText> : null}
          {children ? <View style={styles.body}>{children}</View> : null}

          <View style={styles.actions}>
            {cancelAction ? (
              <Button
                label={cancelAction.label}
                onPress={cancelAction.onPress}
                variant="secondary"
                style={styles.actionButton}
              />
            ) : null}
            <Button
              label={confirmAction.label}
              onPress={confirmAction.onPress}
              variant="primary"
              style={styles.actionButton}
              disabled={confirmAction.disabled}
              loading={confirmAction.loading}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    color: colors.text.primary,
    textAlign: 'center',
  },
  message: {
    marginTop: spacing.xs,
    fontSize: 13,
    lineHeight: 19,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  body: {
    width: '100%',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    minHeight: 46,
    paddingHorizontal: spacing.md,
  },
});
