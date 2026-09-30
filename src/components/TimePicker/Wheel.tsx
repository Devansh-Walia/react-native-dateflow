/**
 * Infinite / clamped picker wheel built from a pan gesture and a shared value,
 * with its own snap physics (core/wheelMath) so it feels the same on every platform.
 */
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Text, View, type AccessibilityActionEvent } from 'react-native';
import { Gesture, GestureDetector, State } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  Extrapolation,
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import {
  applyOverscroll,
  indexForOffset,
  itemDistance,
  mod,
  nearestLoopOffset,
  offsetForIndex,
  shouldLoop,
  snapTargetOffset,
} from '../../core/wheelMath';
import { triggerHaptic } from '../../platform/haptics';
import { TEXT_RESET } from '../../platform/styles';
import { useWebWheel } from '../../platform/useWebWheel';
import { cn } from '../../theme/cn';
import type { TimePickerClassNames } from '../../types';

export const WHEEL_SPRING = { damping: 26, stiffness: 260, mass: 1 } as const;
export const WEB_WHEEL_STEP_PX = 40;
const TAP_SLOP = 6;
const DISTANCES = [0, 1, 3];
const SCALES = [1, 0.9, 0.8];
const OPACITIES = [1, 0.5, 0.15];

export interface WheelOption {
  readonly key: string;
  readonly label: string;
}

export interface WheelProps {
  items: readonly WheelOption[];
  selectedIndex: number;
  onChange: (index: number) => void;
  itemHeight: number;
  visibleCount: number;
  hapticFeedback: boolean;
  accessibilityLabel: string;
  classNames?: TimePickerClassNames;
  testID?: string;
}

interface WheelItemProps {
  index: number;
  label: string;
  selected: boolean;
  offset: SharedValue<number>;
  itemHeight: number;
  count: number;
  loop: boolean;
  centerTop: number;
  classNames?: TimePickerClassNames;
}

function WheelItem({ index, label, selected, offset, itemHeight, count, loop, centerTop, classNames }: WheelItemProps) {
  const style = useAnimatedStyle(() => {
    const d = itemDistance(index, offset.value, itemHeight, count, loop);
    const abs = Math.abs(d);
    return {
      opacity: interpolate(abs, DISTANCES, OPACITIES, Extrapolation.CLAMP),
      transform: [
        { translateY: centerTop + d * itemHeight },
        { scale: interpolate(abs, DISTANCES, SCALES, Extrapolation.CLAMP) },
      ],
    };
  });
  return (
    <Animated.View
      style={[{ position: 'absolute', left: 0, right: 0, top: 0, height: itemHeight }, style]}
      className={cn('items-center justify-center', classNames?.wheelItem)}
    >
      <Text
        style={TEXT_RESET}
        className={cn(
          'text-lg text-foreground tabular-nums',
          classNames?.wheelItemText,
          selected && cn('font-semibold', classNames?.wheelSelectedItemText),
        )}
      >
        {label}
      </Text>
    </Animated.View>
  );
}

export function Wheel({
  items,
  selectedIndex,
  onChange,
  itemHeight,
  visibleCount,
  hapticFeedback,
  accessibilityLabel,
  classNames,
  testID,
}: WheelProps) {
  const count = items.length;
  const loop = shouldLoop(count, visibleCount);
  const height = itemHeight * visibleCount;
  const centerTop = ((visibleCount - 1) / 2) * itemHeight;
  const minOffset = -(count - 1) * itemHeight;

  const offset = useSharedValue(offsetForIndex(selectedIndex, itemHeight));
  const start = useSharedValue(0);
  const committed = useRef(selectedIndex);
  const containerRef = useRef<View>(null);
  const wheelAccumulator = useRef(0);

  const commit = useCallback(
    (index: number) => {
      if (index === committed.current) return;
      committed.current = index;
      onChange(index);
    },
    [onChange],
  );

  // Controlled sync: move to an externally changed index by the shortest path.
  useEffect(() => {
    committed.current = selectedIndex;
    if (indexForOffset(offset.value, itemHeight, count, loop) === selectedIndex) return;
    const target = loop
      ? nearestLoopOffset(offset.value, selectedIndex, itemHeight, count)
      : offsetForIndex(selectedIndex, itemHeight);
    offset.value = withSpring(target, WHEEL_SPRING);
  }, [selectedIndex, itemHeight, count, loop, offset]);

  const tick = useCallback(() => triggerHaptic('selection', hapticFeedback), [hapticFeedback]);
  useAnimatedReaction(
    () => indexForOffset(offset.value, itemHeight, count, loop),
    (current, previous) => {
      if (hapticFeedback && previous !== null && current !== previous) scheduleOnRN(tick);
    },
    [itemHeight, count, loop, hapticFeedback, tick],
  );

  const stepBy = useCallback(
    (delta: number) => {
      const raw = committed.current + delta;
      const next = loop ? mod(raw, count) : Math.min(Math.max(raw, 0), count - 1);
      if (next === committed.current) return;
      const target = loop ? nearestLoopOffset(offset.value, next, itemHeight, count) : offsetForIndex(next, itemHeight);
      offset.value = withSpring(target, WHEEL_SPRING);
      commit(next);
    },
    [loop, count, itemHeight, offset, commit],
  );

  useWebWheel(containerRef, (deltaY) => {
    wheelAccumulator.current += deltaY;
    const steps = Math.trunc(wheelAccumulator.current / WEB_WHEEL_STEP_PX);
    if (steps === 0) return;
    wheelAccumulator.current -= steps * WEB_WHEEL_STEP_PX;
    stepBy(steps);
  });

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .withTestId(testID ? `${testID}-pan` : 'wheel-pan')
        .activeOffsetY([-TAP_SLOP, TAP_SLOP])
        .onBegin(() => {
          cancelAnimation(offset);
          start.value = offset.value;
        })
        .onUpdate((e) => {
          const next = start.value + e.translationY;
          offset.value = loop ? next : applyOverscroll(next, minOffset);
        })
        .onFinalize((e, success) => {
          // A tap is a touch released without ever activating the pan; a cancelled
          // (stolen) or mostly-horizontal touch just settles from where it is.
          const tapped =
            !success &&
            e.state === State.FAILED &&
            Math.abs(e.translationX) < TAP_SLOP &&
            Math.abs(e.translationY) < TAP_SLOP;
          const rowFromCentre = Math.floor(e.y / itemHeight) - (visibleCount - 1) / 2;
          const base = tapped ? offset.value - rowFromCentre * itemHeight : offset.value;
          const target = snapTargetOffset(base, tapped ? 0 : e.velocityY, itemHeight, count, loop);
          const index = indexForOffset(target, itemHeight, count, loop);
          offset.value = withSpring(target, WHEEL_SPRING, (finished) => {
            if (finished) scheduleOnRN(commit, index);
          });
        }),
    [offset, start, loop, minOffset, itemHeight, visibleCount, count, commit, testID],
  );

  const onAccessibilityAction = (event: AccessibilityActionEvent) => {
    if (event.nativeEvent.actionName === 'increment') stepBy(1);
    if (event.nativeEvent.actionName === 'decrement') stepBy(-1);
  };

  const selectedLabel = items[selectedIndex]?.label ?? '';

  return (
    <View
      ref={containerRef}
      testID={testID}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: selectedLabel }}
      aria-valuetext={selectedLabel}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={onAccessibilityAction}
      className={cn('w-16 select-none', classNames?.timeWheel)}
    >
      <GestureDetector gesture={gesture}>
        <View testID={testID ? `${testID}-viewport` : undefined} style={{ height }} className="overflow-hidden">
          {items.map((item, index) => (
            <WheelItem
              key={item.key}
              index={index}
              label={item.label}
              selected={index === selectedIndex}
              offset={offset}
              itemHeight={itemHeight}
              count={count}
              loop={loop}
              centerTop={centerTop}
              classNames={classNames}
            />
          ))}
        </View>
      </GestureDetector>
    </View>
  );
}
