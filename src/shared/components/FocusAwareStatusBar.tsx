import React from 'react';
import { useIsFocused } from '@react-navigation/native';
import { StatusBar, type StatusBarProps } from 'expo-status-bar';

/**
 * Only applies StatusBar props while the screen is focused.
 * Needed because stack/tab screens stay mounted — last StatusBar otherwise wins
 * (e.g. Welcome/Settings `light` icons become invisible on white dashboard).
 */
export function FocusAwareStatusBar(props: StatusBarProps): React.ReactElement | null {
  const isFocused = useIsFocused();
  return isFocused ? <StatusBar {...props} /> : null;
}
