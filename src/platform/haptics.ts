/** Haptic feedback via expo-haptics. It's non-visual, so skipping it on web keeps UI parity. */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticKind = 'selection' | 'impact';

export function triggerHaptic(kind: HapticKind, enabled: boolean): void {
  if (!enabled || Platform.OS === 'web') return;
  const pending =
    kind === 'selection' ? Haptics.selectionAsync() : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  pending.catch(() => undefined);
}
