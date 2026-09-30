/** cva variant maps for day cells. The visual rules live here in one place. */
import { cva } from 'class-variance-authority';

export type DayVisualState = 'idle' | 'selected' | 'today' | 'disabled' | 'outside';

export const dayCellVariants = cva('h-10 flex-1 items-center justify-center select-none', {
  variants: {
    range: {
      none: '',
      start: 'rounded-l-full bg-accent',
      middle: 'bg-accent',
      end: 'rounded-r-full bg-accent',
    },
  },
  defaultVariants: { range: 'none' },
});

export const dayCircleVariants = cva('h-9 w-9 items-center justify-center rounded-full', {
  variants: {
    state: {
      idle: '',
      selected: 'bg-primary',
      today: 'border border-primary',
      disabled: 'opacity-40',
      outside: 'opacity-50',
    },
  },
  defaultVariants: { state: 'idle' },
});

export const dayTextVariants = cva('text-sm text-foreground tabular-nums', {
  variants: {
    state: {
      idle: '',
      selected: 'font-semibold text-primary-foreground',
      today: 'font-semibold text-primary',
      disabled: 'text-muted-foreground',
      outside: 'text-muted-foreground',
    },
  },
  defaultVariants: { state: 'idle' },
});

/** Precedence: disabled > selected > today > outside > idle. */
export function dayVisualState(p: {
  isDisabled: boolean;
  isSelected: boolean;
  isToday: boolean;
  inMonth: boolean;
}): DayVisualState {
  if (p.isDisabled) return 'disabled';
  if (p.isSelected) return 'selected';
  if (p.isToday) return 'today';
  return p.inMonth ? 'idle' : 'outside';
}
