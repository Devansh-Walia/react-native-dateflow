/** 3-column month/year picker grid. Rows are flex-1 so it fills the measured day-grid height. */
import { Pressable, Text, View } from 'react-native';
import { TEXT_RESET } from '../../platform/styles';
import { cn } from '../../theme/cn';
import type { CalendarClassNames } from '../../types';

export interface JumperItem {
  readonly key: string;
  readonly label: string;
  readonly selected: boolean;
  readonly disabled: boolean;
  readonly onPress: () => void;
}

export interface JumperGridProps {
  items: readonly JumperItem[];
  columns?: number;
  classNames?: CalendarClassNames;
  testID?: string;
}

const chunk = <T,>(items: readonly T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, i * size + size));

export function JumperGrid({ items, columns = 3, classNames, testID }: JumperGridProps) {
  return (
    <View className={cn('flex-1 gap-2', classNames?.jumper)} testID={testID}>
      {chunk(items, columns).map((row, r) => (
        <View key={row[0]?.key ?? r} className="flex-1 flex-row gap-2" testID={testID ? `${testID}-row-${r}` : undefined}>
          {row.map((item) => (
            <Pressable
              key={item.key}
              onPress={item.onPress}
              disabled={item.disabled}
              accessibilityRole="button"
              accessibilityState={{ selected: item.selected, disabled: item.disabled }}
              testID={testID ? `${testID}-${item.key}` : undefined}
              className={cn(
                'min-h-10 flex-1 items-center justify-center rounded-lg select-none',
                item.selected && 'bg-primary',
                item.disabled && 'opacity-40',
                classNames?.jumperItem,
                item.selected && classNames?.jumperItemSelected,
              )}
            >
              <Text
                style={TEXT_RESET}
                className={cn(
                  'text-sm text-foreground',
                  item.selected && 'font-semibold text-primary-foreground',
                  classNames?.jumperItemText,
                  item.selected && classNames?.jumperItemSelectedText,
                )}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ))}
    </View>
  );
}
