/** Inline month calendar: single / multiple / range, swipe navigation, month & year jumpers. */
import { getMonth, getYear, setMonth as setMonthIndex } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { monthLabels, monthName, weekdayLabels, yearLabel } from '../../core/locale';
import { isMonthOutOfRange, isYearOutOfRange } from '../../core/navigation';
import { cn } from '../../theme/cn';
import { useDatePickerTheme } from '../../theme/DatePickerThemeProvider';
import type { CalendarLabels, CalendarProps, RenderHeaderInfo } from '../../types';
import { CalendarHeader } from './CalendarHeader';
import { JumperGrid, type JumperItem } from './JumperGrid';
import { MonthGrid } from './MonthGrid';
import { SwipeableMonths } from './SwipeableMonths';
import { useCalendarState, YEARS_PER_PAGE } from './useCalendarState';
import { WeekdayRow } from './WeekdayRow';

const DEFAULT_LABELS: CalendarLabels = { previous: 'Previous', next: 'Next' };

export function Calendar(props: CalendarProps) {
  const {
    firstDayOfWeek = 0,
    showOutsideDays = true,
    hideHeader = false,
    hideWeekdays = false,
    swipeEnabled = true,
    locale,
    themeOverride,
    classNames,
    className,
    labels,
    renderDay,
    renderHeader,
    renderFooter,
    testID = 'calendar',
  } = props;

  const { rootStyle } = useDatePickerTheme(themeOverride);
  const state = useCalendarState(props);
  const [bodyHeight, setBodyHeight] = useState<number | undefined>(undefined);

  const weekdays = useMemo(() => weekdayLabels(firstDayOfWeek, locale), [firstDayOfWeek, locale]);
  const monthText = monthName(state.month, locale);
  const yearText = yearLabel(state.month, locale);
  const mergedLabels: CalendarLabels = { ...DEFAULT_LABELS, ...labels };

  const { isDisabled, selection, todayKey, selectDay } = state;
  const renderMonth = useCallback(
    (month: Date, isCurrent: boolean) => (
      <MonthGrid
        month={month}
        firstDayOfWeek={firstDayOfWeek}
        showOutsideDays={showOutsideDays}
        isDisabled={isDisabled}
        selection={selection}
        todayKey={todayKey}
        locale={locale}
        classNames={classNames}
        renderDay={renderDay}
        onDayPress={selectDay}
        testID={isCurrent ? testID : undefined}
      />
    ),
    [firstDayOfWeek, showOutsideDays, isDisabled, selection, todayKey, locale, classNames, renderDay, selectDay, testID],
  );

  const headerInfo: RenderHeaderInfo = {
    month: state.month,
    view: state.view,
    monthLabel: monthText,
    yearLabel: yearText,
    canGoPrev: state.nav.canPrev,
    canGoNext: state.nav.canNext,
    goPrev: state.nav.prev,
    goNext: state.nav.next,
    setView: state.setView,
  };

  const jumperItems: JumperItem[] =
    state.view === 'months'
      ? monthLabels(locale).map((label, index) => ({
          key: `month-${index}`,
          label,
          selected: index === getMonth(state.month),
          disabled: isMonthOutOfRange(setMonthIndex(state.month, index), state.constraints),
          onPress: () => state.selectMonth(index),
        }))
      : Array.from({ length: YEARS_PER_PAGE }, (_, i) => state.yearPageStart + i).map((year) => ({
          key: `year-${year}`,
          label: String(year),
          selected: year === getYear(state.month),
          disabled: isYearOutOfRange(year, state.constraints),
          onPress: () => state.selectYear(year),
        }));

  return (
    <View style={rootStyle} className={cn('w-full rounded-lg bg-background p-3', className, classNames?.container)} testID={testID}>
      {!hideHeader &&
        (renderHeader ? (
          renderHeader(headerInfo)
        ) : (
          <CalendarHeader
            monthLabel={monthText}
            yearLabel={yearText}
            canGoPrev={state.nav.canPrev}
            canGoNext={state.nav.canNext}
            onPrev={state.nav.prev}
            onNext={state.nav.next}
            onMonthPress={() => state.openView('months')}
            onYearPress={() => state.openView('years')}
            labels={mergedLabels}
            classNames={classNames}
            testID={testID}
          />
        ))}

      {state.view === 'days' ? (
        <View onLayout={(e) => setBodyHeight(e.nativeEvent.layout.height)}>
          {!hideWeekdays && <WeekdayRow labels={weekdays} classNames={classNames} testID={testID} />}
          <SwipeableMonths
            month={state.month}
            canPrev={state.swipe.canPrev}
            canNext={state.swipe.canNext}
            enabled={swipeEnabled}
            onNavigate={state.swipe.navigate}
            renderMonth={renderMonth}
            testID={`${testID}-pages`}
          />
        </View>
      ) : (
        <View style={bodyHeight ? { height: bodyHeight } : undefined} className="py-1">
          <JumperGrid items={jumperItems} classNames={classNames} testID={`${testID}-jumper`} />
        </View>
      )}

      {renderFooter && <View className={classNames?.footer}>{renderFooter({ month: state.month, value: state.value })}</View>}
    </View>
  );
}
