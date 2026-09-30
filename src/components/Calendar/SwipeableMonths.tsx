/**
 * Horizontal month pager: prev | current | next laid out in a row that is
 * 3 pages wide and moved with a custom pan (no platform pager, so it behaves the same everywhere).
 */
import { addMonths } from 'date-fns';
import { useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { resolveSwipe } from '../../core/navigation';

const PAGE_DURATION_MS = 220;
const RUBBER_BAND = 0.2;
const SNAP_BACK = { damping: 22, stiffness: 240, mass: 1 } as const;

export interface SwipeableMonthsProps {
  month: Date;
  canPrev: boolean;
  canNext: boolean;
  enabled: boolean;
  onNavigate: (direction: -1 | 1) => void;
  renderMonth: (month: Date, isCurrent: boolean) => ReactNode;
  testID?: string;
}

export function SwipeableMonths({ month, canPrev, canNext, enabled, onNavigate, renderMonth, testID }: SwipeableMonthsProps) {
  const [width, setWidth] = useState(0);
  const translateX = useSharedValue(0);
  const monthTime = month.getTime();

  // New month content is on screen, so recentre before paint.
  useLayoutEffect(() => {
    translateX.value = 0;
  }, [monthTime, translateX]);

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(enabled && width > 0)
        .activeOffsetX([-12, 12])
        .failOffsetY([-12, 12])
        .onUpdate((e) => {
          const blocked = (e.translationX > 0 && !canPrev) || (e.translationX < 0 && !canNext);
          translateX.value = blocked ? e.translationX * RUBBER_BAND : e.translationX;
        })
        .onEnd((e) => {
          const direction = resolveSwipe(e.translationX, e.velocityX, width, canPrev, canNext);
          if (direction === 0) {
            translateX.value = withSpring(0, SNAP_BACK);
            return;
          }
          translateX.value = withTiming(-direction * width, { duration: PAGE_DURATION_MS }, (finished) => {
            if (finished) scheduleOnRN(onNavigate, direction);
          });
        }),
    [enabled, width, canPrev, canNext, onNavigate, translateX],
  );

  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value - width }] }));

  if (width === 0) {
    return (
      <View onLayout={onLayout} testID={testID}>
        {renderMonth(month, true)}
      </View>
    );
  }

  return (
    <View onLayout={onLayout} className="overflow-hidden" testID={testID}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[{ flexDirection: 'row', width: width * 3 }, rowStyle]}>
          <View style={{ width }} aria-hidden>
            {renderMonth(addMonths(month, -1), false)}
          </View>
          <View style={{ width }}>{renderMonth(month, true)}</View>
          <View style={{ width }} aria-hidden>
            {renderMonth(addMonths(month, 1), false)}
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
