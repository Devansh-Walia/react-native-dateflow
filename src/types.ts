/**
 * Public type surface of react-native-dateflow.
 * Every component prop, render-override payload and `classNames` slot map lives here.
 */
import type { Locale } from 'date-fns';
import type { ReactNode } from 'react';

/* ------------------------------------------------------------------ primitives */

export type ThemeMode = 'light' | 'dark';
export type WeekdayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type MinuteStep = 1 | 5 | 10 | 15 | 30;
export type HourFormat = '12h' | '24h';
export type SelectionMode = 'single' | 'multiple' | 'range';
export type CalendarView = 'days' | 'months' | 'years';
export type TimePickerVariant = 'wheel' | 'inline';
export type DatePickerPresentation = 'modal' | 'sheet' | 'popover';
export type DateTimePickerLayout = 'tabs' | 'stacked';
export type RangePosition = 'none' | 'start' | 'middle' | 'end';

export interface DateRange {
  readonly start: Date | null;
  readonly end: Date | null;
}

/** Union of every selection shape; narrowed per `SelectionMode`. */
export type SelectionValue = Date | null | Date[] | DateRange;

/** Days that cannot be selected: an explicit list or a predicate. */
export type DisabledDates = readonly Date[] | ((date: Date) => boolean);

export interface DateConstraints {
  readonly minDate?: Date;
  readonly maxDate?: Date;
  readonly disabledDates?: DisabledDates;
  /** IANA zone (e.g. "Europe/Berlin"). Omit to use the device zone. */
  readonly timeZone?: string;
}

/** Props shared by every component. */
export interface CommonProps {
  locale?: Locale;
  timeZone?: string;
  /** expo-haptics feedback on selection (no-op on web). Default `true`. */
  hapticFeedback?: boolean;
  /** Force a colour mode for this component (injects resolved theme variables). */
  themeOverride?: ThemeMode;
  className?: string;
  testID?: string;
}

/* ---------------------------------------------------------------- slot maps */

export type CalendarSlot =
  | 'container'
  | 'header'
  | 'headerButton'
  | 'headerTitle'
  | 'headerTitleText'
  | 'chevron'
  | 'weekdayRow'
  | 'weekdayText'
  | 'grid'
  | 'week'
  | 'dayCell'
  | 'dayText'
  | 'selectedDay'
  | 'selectedDayText'
  | 'todayIndicator'
  | 'todayText'
  | 'disabledDay'
  | 'disabledDayText'
  | 'outsideDay'
  | 'outsideDayText'
  | 'rangeStart'
  | 'rangeEnd'
  | 'rangeMiddle'
  | 'rangeMiddleText'
  | 'jumper'
  | 'jumperItem'
  | 'jumperItemText'
  | 'jumperItemSelected'
  | 'jumperItemSelectedText'
  | 'footer';

export type TimePickerSlot =
  | 'container'
  | 'timeWheel'
  | 'wheelItem'
  | 'wheelItemText'
  | 'wheelSelectedItemText'
  | 'wheelHighlight'
  | 'separator'
  | 'separatorText'
  | 'inlineContainer'
  | 'inlineSegment'
  | 'inlineSegmentActive'
  | 'inlineSegmentText'
  | 'inlineOptions'
  | 'inlineOption'
  | 'inlineOptionActive'
  | 'inlineOptionText'
  | 'inlineOptionActiveText'
  | 'periodToggle'
  | 'periodOption'
  | 'periodOptionActive'
  | 'periodOptionText'
  | 'periodOptionActiveText';

export type DatePickerSlot =
  | 'container'
  | 'trigger'
  | 'triggerText'
  | 'triggerPlaceholder'
  | 'backdrop'
  | 'modal'
  | 'sheet'
  | 'sheetHandle'
  | 'popover';

export type DateTimePickerSlot =
  | 'container'
  | 'tabs'
  | 'tab'
  | 'tabActive'
  | 'tabText'
  | 'tabActiveText'
  | 'tabSubtitle'
  | 'tabIndicator'
  | 'section'
  | 'sectionHeader'
  | 'sectionTitle'
  | 'sectionSubtitle'
  | 'body';

export type CalendarClassNames = Partial<Record<CalendarSlot, string>>;
export type TimePickerClassNames = Partial<Record<TimePickerSlot, string>>;
export type DatePickerClassNames = Partial<Record<DatePickerSlot, string>> & {
  calendar?: CalendarClassNames;
};
export type DateTimePickerClassNames = Partial<Record<DateTimePickerSlot, string>> & {
  calendar?: CalendarClassNames;
  timePicker?: TimePickerClassNames;
};

/* ---------------------------------------------------------- render overrides */

export interface RenderDayInfo {
  date: Date;
  label: string;
  isSelected: boolean;
  isToday: boolean;
  isDisabled: boolean;
  isOutside: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
  isInRange: boolean;
  onPress: () => void;
}

export interface RenderHeaderInfo {
  month: Date;
  view: CalendarView;
  monthLabel: string;
  yearLabel: string;
  canGoPrev: boolean;
  canGoNext: boolean;
  goPrev: () => void;
  goNext: () => void;
  setView: (view: CalendarView) => void;
}

export interface RenderFooterInfo {
  month: Date;
  value: SelectionValue;
}

export interface RenderTriggerInfo {
  isOpen: boolean;
  value: Date | null;
  displayValue: string | null;
  open: () => void;
  close: () => void;
}

export interface CalendarLabels {
  previous: string;
  next: string;
}

/* ------------------------------------------------------------------ Calendar */

export interface CalendarBaseProps extends CommonProps {
  minDate?: Date;
  maxDate?: Date;
  disabledDates?: DisabledDates;
  month?: Date;
  defaultMonth?: Date;
  onMonthChange?: (month: Date) => void;
  /** 0 = Sunday … 6 = Saturday. Default 0. */
  firstDayOfWeek?: WeekdayIndex;
  /** Default `true`. */
  showOutsideDays?: boolean;
  hideHeader?: boolean;
  hideWeekdays?: boolean;
  /** Horizontal swipe month navigation. Default `true`. */
  swipeEnabled?: boolean;
  labels?: Partial<CalendarLabels>;
  classNames?: CalendarClassNames;
  renderDay?: (info: RenderDayInfo) => ReactNode;
  renderHeader?: (info: RenderHeaderInfo) => ReactNode;
  renderFooter?: (info: RenderFooterInfo) => ReactNode;
}

export interface SingleCalendarProps extends CalendarBaseProps {
  mode?: 'single';
  value?: Date | null;
  defaultValue?: Date | null;
  onChange?: (value: Date) => void;
}

export interface MultipleCalendarProps extends CalendarBaseProps {
  mode: 'multiple';
  value?: Date[];
  defaultValue?: Date[];
  onChange?: (value: Date[]) => void;
}

export interface RangeCalendarProps extends CalendarBaseProps {
  mode: 'range';
  value?: DateRange;
  defaultValue?: DateRange;
  onChange?: (value: DateRange) => void;
}

export type CalendarProps = SingleCalendarProps | MultipleCalendarProps | RangeCalendarProps;

/** Calendar props that DatePicker / DateTimePicker forward unchanged. */
export type CalendarPassthroughProps = Pick<
  CalendarBaseProps,
  | 'minDate'
  | 'maxDate'
  | 'disabledDates'
  | 'firstDayOfWeek'
  | 'showOutsideDays'
  | 'hideHeader'
  | 'hideWeekdays'
  | 'swipeEnabled'
  | 'labels'
  | 'renderDay'
  | 'renderHeader'
  | 'renderFooter'
>;

/* ---------------------------------------------------------------- TimePicker */

export interface TimePickerProps extends CommonProps {
  value?: Date | null;
  defaultValue?: Date | null;
  onChange?: (value: Date) => void;
  /** Default `'wheel'`. */
  variant?: TimePickerVariant;
  /** Default `'12h'`. */
  hourFormat?: HourFormat;
  /** Default `1`. */
  minuteStep?: MinuteStep;
  /** Rows visible in wheel mode. Default `5`. */
  visibleItemCount?: 3 | 5 | 7;
  /** Row height in px for wheel mode. Default `44`. */
  itemHeight?: number;
  classNames?: TimePickerClassNames;
}

/* ---------------------------------------------------------------- DatePicker */

export interface DatePickerProps extends CommonProps, CalendarPassthroughProps {
  value?: Date | null;
  defaultValue?: Date | null;
  onChange?: (value: Date) => void;
  /** Default `'modal'`. `'popover'` expands inline below the trigger. */
  presentation?: DatePickerPresentation;
  /** Default `'Select date'`. */
  placeholder?: string;
  /** date-fns format string for the trigger. Default `'PP'`. */
  displayFormat?: string;
  /** Default `true`. */
  closeOnSelect?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  renderTrigger?: (info: RenderTriggerInfo) => ReactNode;
  classNames?: DatePickerClassNames;
}

/* ------------------------------------------------------------ DateTimePicker */

export interface DateTimePickerProps extends CommonProps, CalendarPassthroughProps {
  value?: Date | null;
  defaultValue?: Date | null;
  onChange?: (value: Date) => void;
  /** Default `'tabs'`. */
  layout?: DateTimePickerLayout;
  hourFormat?: HourFormat;
  minuteStep?: MinuteStep;
  /** Default `'wheel'`. */
  timeVariant?: TimePickerVariant;
  tabLabels?: { date?: string; time?: string };
  classNames?: DateTimePickerClassNames;
}
