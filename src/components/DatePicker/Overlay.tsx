/** Modal / bottom-sheet surface. All motion comes from Reanimated; the OS contributes none. */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { SHADOW } from '../../platform/styles';
import { cn } from '../../theme/cn';
import type { ResolvedPickerTheme } from '../../theme/DatePickerThemeProvider';
import type { DatePickerClassNames } from '../../types';

export const OVERLAY_MS = 220;
export const SHEET_DISMISS_DISTANCE = 120;
export const SHEET_DISMISS_VELOCITY = 800;
const SNAP_BACK = { damping: 22, stiffness: 240, mass: 1 } as const;
const MODAL_MAX_WIDTH = 400;

export interface OverlayProps {
  visible: boolean;
  variant: 'modal' | 'sheet';
  onRequestClose: () => void;
  rootStyle: ResolvedPickerTheme['rootStyle'];
  classNames?: DatePickerClassNames;
  testID: string;
  children: ReactNode;
}

export function Overlay({ visible, variant, onRequestClose, rootStyle, classNames, testID, children }: OverlayProps) {
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(0);
  const drag = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      drag.value = 0;
      progress.value = withTiming(1, { duration: OVERLAY_MS });
      return;
    }
    progress.value = withTiming(0, { duration: OVERLAY_MS }, (finished) => {
      if (finished) scheduleOnRN(setMounted, false);
    });
  }, [visible, progress, drag]);

  const handlePan = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate((e) => {
          drag.value = Math.max(0, e.translationY);
        })
        .onEnd((e) => {
          if (e.translationY > SHEET_DISMISS_DISTANCE || e.velocityY > SHEET_DISMISS_VELOCITY) {
            scheduleOnRN(onRequestClose);
          } else {
            drag.value = withSpring(0, SNAP_BACK);
          }
        }),
    [drag, onRequestClose],
  );

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * height + drag.value }],
  }));
  const modalStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.96 + 0.04 * progress.value }],
  }));

  return (
    <Modal
      transparent
      visible={mounted}
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onRequestClose}
    >
      <GestureHandlerRootView style={styles.fill}>
        <View style={[styles.fill, rootStyle]}>
          <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
            <Pressable
              onPress={onRequestClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              testID={`${testID}-backdrop`}
              className={cn('flex-1 bg-black/50 select-none', classNames?.backdrop)}
            />
          </Animated.View>

          {variant === 'sheet' ? (
            <Animated.View
              testID={`${testID}-sheet`}
              accessibilityViewIsModal
              style={[styles.sheet, SHADOW, sheetStyle]}
              className={cn('rounded-t-2xl bg-background px-4 pb-8', classNames?.sheet)}
            >
              <GestureDetector gesture={handlePan}>
                <View testID={`${testID}-sheet-handle`} className="h-6 items-center justify-center">
                  <View className={cn('h-1.5 w-10 rounded-full bg-muted-foreground/40', classNames?.sheetHandle)} />
                </View>
              </GestureDetector>
              {children}
            </Animated.View>
          ) : (
            <View pointerEvents="box-none" className="flex-1 items-center justify-center p-4">
              <Animated.View
                testID={`${testID}-modal`}
                accessibilityViewIsModal
                style={[styles.modal, SHADOW, modalStyle]}
                className={cn('rounded-lg bg-background p-2', classNames?.modal)}
              >
                {children}
              </Animated.View>
            </View>
          )}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  modal: { width: '100%', maxWidth: MODAL_MAX_WIDTH },
});
