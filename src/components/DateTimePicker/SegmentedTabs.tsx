/** Two-or-more segment control with an animated sliding indicator. */
import { useEffect, useState } from 'react';
import { Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { TEXT_RESET } from '../../platform/styles';
import { cn } from '../../theme/cn';
import type { DateTimePickerClassNames } from '../../types';

const TAB_PADDING = 4;
const INDICATOR_MS = 200;

export interface TabItem {
  readonly key: string;
  readonly title: string;
  readonly subtitle?: string;
}

export interface SegmentedTabsProps {
  tabs: readonly TabItem[];
  activeIndex: number;
  onChange: (index: number) => void;
  classNames?: DateTimePickerClassNames;
  testID: string;
}

export function SegmentedTabs({ tabs, activeIndex, onChange, classNames, testID }: SegmentedTabsProps) {
  const [width, setWidth] = useState(0);
  const tabWidth = tabs.length > 0 ? Math.max(0, (width - TAB_PADDING * 2) / tabs.length) : 0;
  const x = useSharedValue(0);

  useEffect(() => {
    x.value = withTiming(activeIndex * tabWidth, { duration: INDICATOR_MS });
  }, [activeIndex, tabWidth, x]);

  const indicatorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <View
      onLayout={onLayout}
      accessibilityRole="tablist"
      testID={`${testID}-tabs`}
      style={{ padding: TAB_PADDING }}
      className={cn('relative flex-row rounded-lg bg-muted', classNames?.tabs)}
    >
      {width > 0 && (
        <Animated.View
          testID={`${testID}-indicator`}
          pointerEvents="none"
          style={[{ position: 'absolute', top: TAB_PADDING, bottom: TAB_PADDING, left: TAB_PADDING, width: tabWidth }, indicatorStyle]}
          className={cn('rounded-md border border-border bg-background', classNames?.tabIndicator)}
        />
      )}
      {tabs.map((tab, index) => {
        const active = index === activeIndex;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(index)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            testID={`${testID}-tab-${tab.key}`}
            className={cn('flex-1 items-center justify-center py-2 select-none', classNames?.tab, active && classNames?.tabActive)}
          >
            <Text
              style={TEXT_RESET}
              className={cn(
                'text-sm font-medium text-muted-foreground',
                active && 'text-foreground',
                classNames?.tabText,
                active && classNames?.tabActiveText,
              )}
            >
              {tab.title}
            </Text>
            {tab.subtitle !== undefined && (
              <Text style={TEXT_RESET} className={cn('text-xs text-muted-foreground tabular-nums', classNames?.tabSubtitle)}>
                {tab.subtitle}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
