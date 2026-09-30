/** Header row that shows or hides its body (instant toggle, the same on every platform). */
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { TEXT_RESET } from '../../platform/styles';
import { cn } from '../../theme/cn';
import type { DateTimePickerClassNames } from '../../types';
import { Chevron } from '../shared/Chevron';

export interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  expanded: boolean;
  onToggle: () => void;
  classNames?: DateTimePickerClassNames;
  testID: string;
  children: ReactNode;
}

export function CollapsibleSection({ title, subtitle, expanded, onToggle, classNames, testID, children }: CollapsibleSectionProps) {
  return (
    <View className={cn('overflow-hidden rounded-lg border border-border', classNames?.section)} testID={testID}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        testID={`${testID}-header`}
        className={cn('h-14 flex-row items-center justify-between px-4 select-none', classNames?.sectionHeader)}
      >
        <View>
          <Text style={TEXT_RESET} className={cn('text-sm font-medium text-foreground', classNames?.sectionTitle)}>
            {title}
          </Text>
          {subtitle !== undefined && (
            <Text style={TEXT_RESET} className={cn('text-xs text-muted-foreground tabular-nums', classNames?.sectionSubtitle)}>
              {subtitle}
            </Text>
          )}
        </View>
        <Chevron direction={expanded ? 'up' : 'down'} />
      </Pressable>
      {expanded && (
        <View testID={`${testID}-body`} className={classNames?.body}>
          {children}
        </View>
      )}
    </View>
  );
}
