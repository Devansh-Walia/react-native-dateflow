/** Static weekday labels (not part of the swipe pages). */
import { Text, View } from 'react-native';
import { TEXT_RESET } from '../../platform/styles';
import { cn } from '../../theme/cn';
import type { CalendarClassNames } from '../../types';

export interface WeekdayRowProps {
  labels: readonly string[];
  classNames?: CalendarClassNames;
  testID: string;
}

export function WeekdayRow({ labels, classNames, testID }: WeekdayRowProps) {
  return (
    <View className={cn('h-8 flex-row', classNames?.weekdayRow)} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {labels.map((label, i) => (
        <View key={`${i}-${label}`} className="flex-1 items-center justify-center">
          <Text
            testID={`${testID}-weekday-${i}`}
            style={TEXT_RESET}
            className={cn('text-xs font-medium text-muted-foreground', classNames?.weekdayText)}
          >
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}
