/** Guards the published surface: exact runtime exports and root-importable public types. */
import * as api from '../index';
import type {
  CalendarProps,
  DatePickerProps,
  DatePickerTheme,
  DatePickerThemeProviderProps,
  DateRange,
  DateTimePickerProps,
  ThemeMap,
  TimePickerProps,
} from '../index';

// Type-level: these must stay importable from the package root.
type PublicTypes = [
  CalendarProps,
  DatePickerProps,
  DatePickerTheme,
  DatePickerThemeProviderProps,
  DateRange,
  DateTimePickerProps,
  ThemeMap,
  TimePickerProps,
];
export type { PublicTypes };

describe('public API', () => {
  it('exports exactly the documented runtime values', () => {
    expect(Object.keys(api).sort()).toEqual(
      [
        'Calendar',
        'DatePicker',
        'DatePickerThemeProvider',
        'DateTimePicker',
        'FALLBACK_THEME',
        'THEME_TOKENS',
        'TimePicker',
        'cn',
        'resolveColor',
        'resolveTheme',
        'toCssVariables',
        'toHslChannels',
        'useDatePickerTheme',
      ].sort(),
    );
  });
});
