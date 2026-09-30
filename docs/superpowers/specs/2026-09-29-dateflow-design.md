# react-native-dateflow — Design Spec

**Date:** 2026-09-29
**Status:** Approved for planning
**Package name:** `react-native-dateflow` (working name, rename freely before publishing)

## 1. Goal

A pure JS/TS date and time picker suite for React Native + Expo that looks and behaves **the same on iOS, Android and Web**. It is styled with NativeWind v4 and picks up the host app's Tailwind theme.

Components: `<Calendar />`, `<TimePicker />`, `<DatePicker />`, `<DateTimePicker />`, `<DatePickerThemeProvider />`.

## 2. Target stack (locked)

| Concern | Choice | Version |
|---|---|---|
| Runtime | Expo SDK 57, React Native 0.86 (New Architecture), React 19.2 | `expo ~57.0.25`, `react-native 0.86.3`, `react 19.2.3` |
| Animation | Reanimated 4 + react-native-worklets (user decision: v4 over v3, because v3 does not support RN 0.86) | `react-native-reanimated 4.5.1`, `react-native-worklets 0.10.1` |
| Gestures | react-native-gesture-handler | `~2.32.0` (Expo SDK 57 bundled) |
| Styling | NativeWind v4 + Tailwind CSS 3 | `nativewind ^4.2.7`, `tailwindcss ^3.4.19` |
| Class utils | `clsx`, `tailwind-merge` v2 (Tailwind 3 line), `class-variance-authority` | `2.1.1`, `^2.6.1`, `^0.7.1` |
| Dates | `date-fns` v4 + `@date-fns/tz` (`TZDate`) | `^4.4.0`, `^1.5.0` |
| Haptics | `expo-haptics` | `~57.0.3` |
| Web | `react-native-web` | `~0.21.0` |
| Tests | `jest-expo` (ios / android / web projects), RNTL 14 (async API) | `~57.0.5`, `^14.0.1` |
| Package manager | pnpm (hoisted linker) | `11.x` |
| TypeScript | strict + `noUncheckedIndexedAccess` | `~6.0.3` |

We chose date-fns over dayjs because it is tree-shakable, has immutable pure functions (easy to test), ships its own locale objects, and `TZDate` gives real IANA time zone support without plugins.

## 3. Cross-platform parity strategy (the core constraint)

"Exact same UI on iOS, Android and Web" drives every decision below. The rule: **never delegate a visual or physics decision to the platform.**

| Risk | Platform difference | Our decision |
|---|---|---|
| Native pickers | `@react-native-community/datetimepicker` / `<input type="date">` look completely different per OS | Never used. Everything is drawn with `View`/`Text`. |
| Scroll physics | `ScrollView` momentum, `snapToInterval`, overscroll bounce (iOS) vs glow (Android) vs scrollbars (web) all differ | The time wheel does **not** use ScrollView/FlatList. It is a `Gesture.Pan` driving a Reanimated shared value, with our own velocity projection and spring snapping (`core/wheelMath.ts`). Same maths on every platform. |
| Month swipe | Pager views differ per platform | Custom `Gesture.Pan` + `translateX`, with a pure `resolveSwipe()` threshold function. |
| 3D wheel effects | `perspective`/`rotateX` render differently on web | Only `scale` + `opacity` + `translateY` are used. |
| Icons / glyphs | `‹ ›` characters render differently in SF / Roboto / system-ui | Chevrons are drawn with bordered, rotated `View`s (`Chevron.tsx`). |
| Shadows | Android `elevation` ≠ iOS `shadow*` ≠ CSS | `boxShadow` style (supported on iOS/Android under the New Architecture, and on web) with a single shared constant. |
| `rem` size | NativeWind defaults to 14px rem on native and 16px on web, so `h-10` is 35px vs 40px | **Required host setting:** `withNativeWind(config, { inlineRem: 16 })`. Documented in the README and used by the example app. Hard-coded pixel values (tab padding) use numbers, not rem. |
| Text metrics | Android adds font padding; web text is selectable | `TEXT_RESET` (`includeFontPadding: false`, `textAlignVertical: 'center'` on Android) on every `Text`; `select-none` on pressables; numerals use `tabular-nums`. |
| Typography | SF Pro vs Roboto vs system-ui | The library ships no font. For pixel parity the host loads one font (variable font, or one family per weight, because Android cannot synthesise weights for custom fonts) and sets it through `classNames`/its Tailwind `fontFamily`. |
| Intl | Hermes `Intl` coverage differs from browsers | No `Intl` calls. All labels come from `date-fns` `format()` with an explicit `Locale` object. |
| Layout jumps | Months have 4–6 weeks | The grid is always 6×7. The month/year jumper takes the measured height of the day grid. |
| Overlay | RN `Modal` animations differ per OS | `Modal` with `transparent`, `animationType="none"`, `statusBarTranslucent`, `navigationBarTranslucent`. All motion is Reanimated. Content is wrapped in `GestureHandlerRootView` (required on Android). Back button (Android) and Escape (web) both route to `onRequestClose`. |
| Web input | No touch on desktop | Pan works with mouse drag (RNGH web). The wheel also listens to DOM `wheel` events (`useWebWheel`). |
| Haptics | Not available on web | `triggerHaptic` is a no-op on web. Haptics are non-visual, so parity is kept. |
| Keyboard input | Soft keyboards differ per platform | The inline time variant uses tap-to-choose option grids, never `TextInput`. |

Verification: the unit/component tests run under the `ios` and `android` jest-expo projects, and the pure logic tests also run under `web`. An example app has a parity screen, a Maestro flow (iOS/Android) and a Playwright spec (web) that run the same interactions and take screenshots at a 390×844 viewport for side-by-side review.

## 4. Architecture

```
src/
  index.ts                     public API
  types.ts                     all public types + classNames slot unions
  core/                        pure, platform-agnostic, tested on ios/android/web
    dateUtils.ts               toZoned, now, dayKey, monthKey, clampDate, createDisabledMatcher
    monthGrid.ts               buildMonthGrid (fixed 6×7)
    locale.ts                  weekdayLabels, monthLabels, monthName, yearLabel
    selection.ts               applySelection, createSelectionMatcher, anchorDate, emptySelection
    navigation.ts              canNavigate, isMonthOutOfRange, isYearOutOfRange, clampToMonth, getInitialMonth, resolveSwipe
    time.ts                    12h/24h conversion, minute steps, wheel indices ↔ Date
    dateTime.ts                combineDateAndTime, defaultTime
    wheelMath.ts               worklet-safe wheel physics helpers
  theme/
    cn.ts                      clsx + tailwind-merge
    tokens.ts                  token list + light/dark fallback map (shadcn-style HSL channels)
    resolveTheme.ts            toHslChannels (hex/hsl/channels), resolveTheme, toCssVariables, resolveColor
    DatePickerThemeProvider.tsx provider + useDatePickerTheme
  hooks/useControllableState.ts
  platform/                    haptics.ts, styles.ts (TEXT_RESET, SHADOW), useWebWheel.ts
  components/
    shared/Chevron.tsx
    Calendar/                  Calendar, useCalendarState, CalendarHeader, WeekdayRow, MonthGrid, DayCell, JumperGrid, SwipeableMonths, calendarVariants
    TimePicker/                TimePicker, Wheel, InlineTime
    DateTimePicker/            DateTimePicker, SegmentedTabs, CollapsibleSection
    DatePicker/                DatePicker, Overlay, DefaultTrigger
tailwind.preset.js             semantic colour tokens → CSS variables
theme.css                      optional fallback :root / .dark:root variables
example/                       Expo app: parity screen + Maestro + Playwright
```

**Distribution:** the package ships TypeScript source (`exports["."]` → `./src/index.ts`, with the `react-native` condition). The host's Metro + Babel compiles it with the host's NativeWind `jsxImportSource`, so `className` works without the library running its own CSS interop. The target is Expo/Metro only; webpack consumers are a non-goal.

## 5. Theming

1. **Inherit (default).** Components only use semantic classes (`bg-primary`, `text-foreground`, `border-border`, `bg-muted`, `bg-accent`, `rounded-lg`). The host's own Tailwind build compiles them, so the host's `tailwind.config.js` and `--primary`/`--background`/… CSS variables apply automatically, including `.dark` switching. Host setup: add `node_modules/react-native-dateflow/src/**/*.{ts,tsx}` to `content`, and add `require('react-native-dateflow/tailwind-preset')` to `presets`. The preset only *extends*, so the host's own colour definitions win.
2. **Host has no tokens.** Import `react-native-dateflow/theme.css` into the global CSS, or wrap in `<DatePickerThemeProvider useFallbackTokens>`.
3. **Custom theme object.** `<DatePickerThemeProvider theme={{ light: { colors: { primary: '#2563eb' } }, dark: {...} }}>`. Values may be hex, `hsl(...)` or raw HSL channels. They are normalised to channels and injected with NativeWind `vars()` on each component root.
4. **Light/Dark.** `useColorScheme()` from NativeWind. `themeOverride` (on the provider or on any component) forces a mode and makes that component inject resolved variables. Limitation: when overriding, the host's CSS-defined tokens can't be read from JS on native, so the override uses the provider theme merged over the fallback map.

## 6. Public API summary

See `src/types.ts` in the plan for exact types. Highlights:

- Every component: `className`, `classNames` (typed slot map, merged with `twMerge`), `locale`, `timeZone`, `hapticFeedback` (default `true`), `themeOverride`, `testID`.
- Calendar: `mode: 'single' | 'multiple' | 'range'` (discriminated union typing `value`/`onChange`), controlled or uncontrolled (`value`/`defaultValue`, `month`/`defaultMonth`/`onMonthChange`), `minDate`, `maxDate`, `disabledDates` (array or predicate), `firstDayOfWeek` 0–6, `showOutsideDays`, `hideHeader`, `hideWeekdays`, `swipeEnabled`, `labels`, `renderDay`, `renderHeader`, `renderFooter`.
- TimePicker: `variant: 'wheel' | 'inline'`, `hourFormat: '12h' | '24h'`, `minuteStep: 1 | 5 | 10 | 15 | 30`, `visibleItemCount: 3 | 5 | 7`, `itemHeight`.
- DatePicker: `presentation: 'modal' | 'sheet' | 'popover'` (popover = inline drop-down in the layout flow), `renderTrigger`, `placeholder`, `displayFormat`, `closeOnSelect`, `open`/`defaultOpen`/`onOpenChange`, plus calendar passthrough props. Single-date selection only (v1).
- DateTimePicker: `layout: 'tabs' | 'stacked'`, `timeVariant`, `hourFormat`, `minuteStep`, `tabLabels`, plus calendar passthrough props.

## 7. Behavioural decisions

- Day identity is compared through `dayKey` (`yyyy-MM-dd` in the chosen zone). Lexicographic comparison of keys gives inclusive `minDate`/`maxDate`, whatever the time of day.
- Range: first tap sets `start`. A second tap on or after `start` sets `end`. A tap before `start`, or any tap after the range is complete, starts a new range. Disabled days may lie *inside* a range; only endpoints are validated.
- Pressing an outside day selects it and moves to its month.
- Minute values that don't align with `minuteStep` are displayed floored (10:07 with step 15 shows `00`). The value isn't rewritten until the user interacts, and then the snapped minute is emitted.
- Wheels loop (infinite) when `items.length >= visibleItemCount + 2`, otherwise they clamp with rubber-band overscroll.
- Time wheels never change the calendar date (23 → 00 stays on the same day).
- DateTimePicker keeps the time when the date changes and vice versa. With no value yet, picking a date uses "now" floored to `minuteStep`.

## 8. Non-goals (v1)

Webpack/Vite consumers, week numbers, multi-month side-by-side layout, range/multiple selection inside `<DatePicker>`, seconds wheel, RTL layout mirroring (tracked for v2), and CI setup.
