# react-native-dateflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pure JS/TS Calendar / TimePicker / DatePicker / DateTimePicker library for Expo that looks and feels the same on iOS, Android and Web. It is styled with NativeWind v4 and inherits the host's Tailwind tokens.

**Architecture:** All date and wheel maths lives in pure `src/core/*` modules. These are unit-tested under the jest-expo `ios`, `android` **and** `web` projects. Components are thin NativeWind views over that core. Gestures and animation are custom Reanimated 4 + Gesture Handler code: no ScrollView, no native pickers, no platform-specific visuals. The theme comes from semantic Tailwind classes backed by CSS variables, with an optional `vars()` injection through `<DatePickerThemeProvider>`.

**Tech Stack:** Expo SDK 57, RN 0.86, React 19.2, Reanimated 4.5 + react-native-worklets 0.10, RNGH 2.32, NativeWind 4.2 + Tailwind 3.4, tailwind-merge 2, clsx, cva, date-fns 4 + @date-fns/tz, expo-haptics, jest-expo 57, RNTL 14, TypeScript 6, pnpm 11.

**Spec:** `docs/superpowers/specs/2026-09-29-react-native-dateflow-design.md`

## Global Constraints

- Package manager: **pnpm** only (`pnpm install`, `pnpm test`, `pnpm exec …`). Linker: `nodeLinker: hoisted` in `pnpm-workspace.yaml`.
- **No git commits.** Repo rule from the owner: every "Checkpoint" step is `git status` / `git diff --stat` review only. Never `git commit`, never `--no-verify`.
- No Docker/Colima. Containers (if ever needed) use podman.
- Versions: `expo ~57.0.25`, `react-native 0.86.3`, `react 19.2.3`, `react-native-reanimated 4.5.1`, `react-native-worklets 0.10.1`, `react-native-gesture-handler ~2.32.0`, `nativewind ^4.2.7`, `tailwindcss ^3.4.19`, `tailwind-merge ^2.6.1`, `clsx ^2.1.1`, `class-variance-authority ^0.7.1`, `date-fns ^4.4.0`, `@date-fns/tz ^1.5.0`, `expo-haptics ~57.0.3`, `react-native-web ~0.21.0`, `jest-expo ~57.0.5`, `jest ^29.7.0`, `@testing-library/react-native ^14.0.1`, `typescript ~6.0.3`.
- Worklet → JS calls use `scheduleOnRN` from `react-native-worklets` (`runOnJS` is deprecated in Reanimated 4, so don't use it).
- RNTL 14 is async: `await render(...)`, `await fireEvent.press(...)`, `await renderHook(...)`.
- Parity rules (spec §3): no ScrollView/FlatList for pickers, no native date pickers, no `Intl`, no text glyph icons, no `rotateX`/`perspective`, no `elevation` (use `SHADOW` / `boxShadow`), every `Text` gets `style={TEXT_RESET}`, pressables get `select-none`, and hosts must set `inlineRem: 16`.
- TypeScript strict + `noUncheckedIndexedAccess`. No `any` in `src/` (use `unknown` + narrowing).
- Every file gets a short module doc comment. Match the comment density of the code shown here.
- Functional style: pure functions in `core/`, and immutable updates (no mutation of dates, arrays or props).
- The owner's global rules also forbid printing secrets and editing `.env`.

## Review Focus

1. **DST month** — a month grid for November 2026 in `America/New_York` (DST ends Nov 1) must have 42 unique consecutive days, all at 00:00 wall time. Test: Task 3 `monthGrid.test.ts`.
2. **Minute not aligned to the step** — value 10:07 with `minuteStep=15` shows `00`, and changing the hour emits 11:00, not 11:07. Tests: Task 5 `time.test.ts`, Task 11 `TimePicker.test.tsx`.
3. **Midnight/noon in 12h mode** — 00:15 shows `12` + `AM`; switching to PM gives 12:15, not 00:15 or 24:15. Tests: Task 5 `time.test.ts`, Task 11 `TimePicker.test.tsx`.
4. **Today outside the allowed range** — with `minDate` in a future month and no value, the calendar opens on the `minDate` month, not on an all-disabled current month. Tests: Task 4 `navigation.test.ts`, Task 9 `Calendar.test.tsx`.
5. **Infinite-wheel wrap** — negative/overflow indices wrap (`mod(-1, 12) === 11`), and syncing from outside takes the shortest path (59 → 0 moves forward one row, not back 59). Tests: Task 6 `wheelMath.test.ts`, Task 10 `Wheel.test.tsx`.

---

## File Structure

```
lib/
├── package.json                 # Task 1
├── pnpm-workspace.yaml          # Task 1 (Task 15 adds example)
├── tsconfig.json                # Task 1
├── babel.config.js              # Task 1
├── jest.config.js               # Task 1
├── jest.setup.ts                # Task 1
├── nativewind-env.d.ts          # Task 1
├── tailwind.preset.js           # Task 1
├── theme.css                    # Task 1
├── README.md                    # Task 1, completed in Task 14
├── src/
│   ├── index.ts                 # Task 1 stub → Task 14 final
│   ├── types.ts                 # Task 2
│   ├── __tests__/setup.test.tsx, types.typecheck.tsx, index.test.tsx (Task 14)
│   ├── core/ dateUtils.ts monthGrid.ts locale.ts          # Task 3
│   │         selection.ts navigation.ts                    # Task 4
│   │         time.ts dateTime.ts                           # Task 5
│   │         wheelMath.ts                                  # Task 6
│   ├── theme/ cn.ts                                        # Task 2
│   │          tokens.ts resolveTheme.ts DatePickerThemeProvider.tsx  # Task 7
│   ├── hooks/useControllableState.ts                       # Task 8
│   │         useDateValue.ts                               # Task 11
│   ├── platform/ haptics.ts styles.ts useWebWheel.ts       # Task 8
│   └── components/
│       ├── shared/Chevron.tsx                              # Task 8
│       │          passthrough.ts                           # Task 12
│       ├── Calendar/ calendarVariants.ts DayCell.tsx MonthGrid.tsx WeekdayRow.tsx
│       │             CalendarHeader.tsx JumperGrid.tsx SwipeableMonths.tsx   # Task 9a
│       │             useCalendarState.ts Calendar.tsx                         # Task 9b
│       ├── TimePicker/ Wheel.tsx                            # Task 10
│       │               InlineTime.tsx TimePicker.tsx        # Task 11
│       ├── DateTimePicker/ SegmentedTabs.tsx CollapsibleSection.tsx DateTimePicker.tsx  # Task 12
│       └── DatePicker/ Overlay.tsx DefaultTrigger.tsx DatePicker.tsx               # Task 13
└── example/  App.tsx, Metro/Tailwind/Babel config, e2e/parity.yaml (Maestro), e2e-web/parity.spec.ts (Playwright)   # Task 15
```

Test naming: `src/**/__tests__/*.test.ts` = pure (runs on ios + android + web); `*.test.tsx` = component/hook (runs on ios + android).

---

### Task 1: Repository tooling scaffold

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `tsconfig.json`, `babel.config.js`, `jest.config.js`, `jest.setup.ts`, `nativewind-env.d.ts`, `tailwind.preset.js`, `theme.css`, `README.md`, `src/index.ts`
- Test: `src/__tests__/setup.test.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `pnpm test` (3 jest projects: `ios`, `android`, `web`), `pnpm typecheck`, and the mocks in `jest.setup.ts`: `expo-haptics` (jest.fn), and `nativewind` (`useColorScheme()` backed by `__setColorScheme(mode)`, and `vars(v) => ({ __vars: v })`).

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "react-native-dateflow",
  "version": "0.1.0",
  "description": "Pixel-consistent Calendar, TimePicker, DatePicker and DateTimePicker for React Native + Expo (iOS, Android, Web), styled with NativeWind v4.",
  "license": "MIT",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "react-native": "./src/index.ts",
  "source": "./src/index.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "react-native": "./src/index.ts",
      "default": "./src/index.ts"
    },
    "./tailwind-preset": "./tailwind.preset.js",
    "./theme.css": "./theme.css",
    "./package.json": "./package.json"
  },
  "files": ["src", "!src/**/__tests__", "tailwind.preset.js", "theme.css"],
  "sideEffects": ["*.css"],
  "packageManager": "pnpm@11.24.0",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "jest",
    "test:ios": "jest --selectProjects ios",
    "test:android": "jest --selectProjects android",
    "test:web": "jest --selectProjects web",
    "verify": "pnpm typecheck && pnpm test"
  },
  "dependencies": {
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.1"
  },
  "peerDependencies": {
    "@date-fns/tz": "^1.2.0",
    "date-fns": "^4.1.0",
    "expo-haptics": ">=14.0.0",
    "nativewind": "^4.2.0",
    "react": ">=19.0.0",
    "react-native": ">=0.81.0",
    "react-native-gesture-handler": ">=2.28.0",
    "react-native-reanimated": ">=4.1.0",
    "react-native-worklets": ">=0.5.0",
    "tailwindcss": "^3.4.0"
  },
  "devDependencies": {
    "@date-fns/tz": "^1.5.0",
    "@react-native/jest-preset": "0.86.3",
    "@testing-library/react-native": "^14.0.1",
    "@types/jest": "^29.5.14",
    "@types/react": "~19.2.2",
    "babel-preset-expo": "~57.0.13",
    "date-fns": "^4.4.0",
    "expo": "~57.0.25",
    "expo-haptics": "~57.0.3",
    "jest": "^29.7.0",
    "jest-expo": "~57.0.5",
    "nativewind": "^4.2.7",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "react-native": "0.86.3",
    "react-native-gesture-handler": "~2.32.0",
    "react-native-reanimated": "4.5.1",
    "react-native-web": "~0.21.0",
    "react-native-worklets": "0.10.1",
    "tailwindcss": "^3.4.19",
    "test-renderer": "^1.3.0",
    "typescript": "~6.0.3"
  }
}
```

- [ ] **Step 2: Create `pnpm-workspace.yaml`** (the hoisted linker keeps a single copy of React/RN, which jest and Metro need)

```yaml
nodeLinker: hoisted
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "lib": ["DOM", "ESNext"],
    "jsx": "react-jsx"
  },
  "include": ["src", "nativewind-env.d.ts", "jest.setup.ts"]
}
```

- [ ] **Step 4: Create `nativewind-env.d.ts`**

```ts
/// <reference types="nativewind/types" />
```

- [ ] **Step 5: Create `babel.config.js`**

```js
/**
 * Babel config used only for this repo's tests.
 * Consumers compile `src/` with their own Babel config.
 * In tests we leave out NativeWind so `className` stays a plain string prop that
 * tests can assert on. Outside tests we mirror a normal NativeWind host.
 */
module.exports = function babelConfig(api) {
  const isTest = api.env('test');
  return {
    presets: [
      ['babel-preset-expo', isTest ? {} : { jsxImportSource: 'nativewind' }],
      ...(isTest ? [] : ['nativewind/babel']),
    ],
  };
};
```

- [ ] **Step 6: Create `jest.config.js`**

```js
/**
 * Three projects so that parity is checked by the test run itself:
 * - ios / android: every test (pure + component)
 * - web: pure logic tests (core + theme); component tests there would need
 *   @testing-library/react instead of RNTL, and web visuals are covered by
 *   the Playwright parity spec in example/ (Task 15).
 */
const transformIgnorePatterns = [
  'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|react-native-.*|@react-native/.*|nativewind|react-native-css-interop|date-fns|@date-fns/.*))',
];

const shared = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transformIgnorePatterns,
};

const allTests = ['<rootDir>/src/**/__tests__/**/*.test.ts?(x)'];
const pureTests = ['<rootDir>/src/**/__tests__/**/*.test.ts'];

module.exports = {
  projects: [
    { ...shared, displayName: 'ios', preset: 'jest-expo/ios', testMatch: allTests },
    { ...shared, displayName: 'android', preset: 'jest-expo/android', testMatch: allTests },
    { ...shared, displayName: 'web', preset: 'jest-expo/web', testMatch: pureTests },
  ],
};
```

- [ ] **Step 7: Create `jest.setup.ts`**

```ts
/**
 * Global test setup: gesture-handler + Reanimated 4 test mode, plus mocks for
 * expo-haptics and NativeWind (colour scheme is switchable, and vars() is observable).
 */
import 'react-native-gesture-handler/jestSetup';
import { setUpTests } from 'react-native-reanimated';

jest.mock('react-native-worklets', () =>
  jest.requireActual('react-native-worklets/lib/module/mock'),
);

setUpTests();

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));

jest.mock('nativewind', () => {
  const state: { colorScheme: 'light' | 'dark' } = { colorScheme: 'light' };
  return {
    __setColorScheme: (mode: 'light' | 'dark') => {
      state.colorScheme = mode;
    },
    useColorScheme: () => ({
      colorScheme: state.colorScheme,
      setColorScheme: jest.fn(),
      toggleColorScheme: jest.fn(),
    }),
    vars: (variables: Record<string, string>) => ({ __vars: variables }),
  };
});
```

- [ ] **Step 8: Create `tailwind.preset.js`**

```js
/**
 * Tailwind preset for react-native-dateflow.
 * Maps the semantic tokens the components use onto CSS variables that hold
 * HSL channels (shadcn convention). It only uses `extend`, so a host that
 * already defines these colours keeps its own values.
 */
const hsl = (token) => `hsl(var(--${token}) / <alpha-value>)`;

module.exports = {
  theme: {
    extend: {
      colors: {
        background: hsl('background'),
        foreground: hsl('foreground'),
        border: hsl('border'),
        primary: { DEFAULT: hsl('primary'), foreground: hsl('primary-foreground') },
        muted: { DEFAULT: hsl('muted'), foreground: hsl('muted-foreground') },
        accent: { DEFAULT: hsl('accent'), foreground: hsl('accent-foreground') },
      },
      borderRadius: {
        lg: 'var(--radius)',
      },
    },
  },
};
```

- [ ] **Step 9: Create `theme.css`** (optional import for hosts without their own tokens; the values match `FALLBACK_THEME` in Task 7)

```css
/* react-native-dateflow fallback tokens. Import before your own globals. */
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;
  --border: 240 5.9% 90%;
  --radius: 12px;
}

.dark:root {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  --primary-foreground: 240 5.9% 10%;
  --muted: 240 3.7% 15.9%;
  --muted-foreground: 240 5% 64.9%;
  --accent: 240 3.7% 15.9%;
  --accent-foreground: 0 0% 98%;
  --border: 240 3.7% 15.9%;
}
```

- [ ] **Step 10: Create `src/index.ts` stub and `README.md` stub**

`src/index.ts`:
```ts
/** Public entry point for react-native-dateflow. Filled in by Task 14. */
export {};
```

`README.md`:
```md
# react-native-dateflow

Pixel-consistent date & time pickers for Expo (iOS, Android, Web), styled with NativeWind v4.

Status: under construction. See `docs/superpowers/plans/2026-09-29-react-native-dateflow.md`.
```

- [ ] **Step 11: Write the smoke test** `src/__tests__/setup.test.tsx`

```tsx
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import Animated, { useSharedValue } from 'react-native-reanimated';

function Probe() {
  const value = useSharedValue(1);
  return (
    <Animated.View style={{ opacity: value.value }}>
      <Text>ok</Text>
    </Animated.View>
  );
}

describe('test environment', () => {
  it('renders Reanimated components with the Reanimated 4 test setup', async () => {
    await render(<Probe />);
    expect(screen.getByText('ok')).toBeTruthy();
  });
});
```

- [ ] **Step 12: Install and run**

Run: `pnpm install && pnpm test`
Expected: `ios` and `android` each show `1 passed`; `web` shows "No tests found" for its pattern, which is fine at this stage. If jest reports that `react-native-worklets/lib/module/mock` can't be found, run `ls node_modules/react-native-worklets/lib/module | grep -i mock` and point `jest.requireActual` at the file that exists.

Run: `pnpm typecheck`
Expected: exit 0.

- [ ] **Step 13: Checkpoint (no commit)**

Run: `git status --short`
Expected: the new files above are listed as untracked. Do **not** commit.

---

### Task 2: Public types + `cn` helper

**Files:**
- Create: `src/types.ts`, `src/theme/cn.ts`
- Test: `src/theme/__tests__/cn.test.ts`, `src/__tests__/types.typecheck.tsx` (checked by `tsc`, not jest)

**Interfaces:**
- Consumes: nothing.
- Produces: every type below, used verbatim by later tasks, and `cn(...inputs: ClassValue[]): string`.

- [ ] **Step 1: Write the failing `cn` test** `src/theme/__tests__/cn.test.ts`

```ts
import { cn } from '../cn';

describe('cn', () => {
  it('lets later utilities override conflicting earlier ones', () => {
    expect(cn('h-10 px-2', 'px-4')).toBe('h-10 px-4');
    expect(cn('bg-primary', 'bg-accent')).toBe('bg-accent');
  });

  it('keeps font-size and semantic text colour side by side', () => {
    expect(cn('text-sm text-foreground', 'text-primary-foreground')).toBe(
      'text-sm text-primary-foreground',
    );
  });

  it('drops falsy inputs', () => {
    expect(cn('a', false, undefined, null, '')).toBe('a');
  });
});
```

- [ ] **Step 2: Write the type-level test** `src/__tests__/types.typecheck.tsx`

```tsx
/** Compile-time contract for the public types. Checked by `pnpm typecheck`. */
import type {
  CalendarClassNames,
  CalendarProps,
  DateRange,
  DateTimePickerProps,
  TimePickerProps,
} from '../types';

const range: CalendarProps = { mode: 'range', onChange: (v: DateRange) => void v };
const single: CalendarProps = { onChange: (v: Date) => void v };
const multiple: CalendarProps = { mode: 'multiple', value: [new Date()] };
const dateTime: DateTimePickerProps = { layout: 'stacked', classNames: { calendar: { dayCell: 'h-12' } } };

// @ts-expect-error range mode never receives a single Date
const badRange: CalendarProps = { mode: 'range', value: new Date() };
// @ts-expect-error 7 is not a supported minute step
const badStep: TimePickerProps = { minuteStep: 7 };
// @ts-expect-error unknown slot names are rejected
const badSlot: CalendarClassNames = { notASlot: 'x' };
// @ts-expect-error firstDayOfWeek is 0-6
const badWeek: CalendarProps = { firstDayOfWeek: 7 };

export const typeFixtures = [range, single, multiple, dateTime, badRange, badStep, badSlot, badWeek];
```

- [ ] **Step 3: Run both and verify they fail**

Run: `pnpm test:ios -- src/theme` → FAIL "Cannot find module '../cn'".
Run: `pnpm typecheck` → FAIL "Cannot find module '../types'".

- [ ] **Step 4: Implement `src/theme/cn.ts`**

```ts
/** Class-name merge helper: clsx for conditionals, tailwind-merge for conflicts. */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge class lists; later Tailwind utilities win over earlier conflicting ones. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 5: Implement `src/types.ts`**

```ts
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
```

- [ ] **Step 6: Run and verify both pass**

Run: `pnpm test -- src/theme/__tests__/cn.test.ts` → PASS in ios, android, web.
Run: `pnpm typecheck` → exit 0. Each `@ts-expect-error` is consumed; if one reports "Unused '@ts-expect-error'", the matching type is too loose, so fix the type.

- [ ] **Step 7: Checkpoint (no commit)** — `git status --short`.

---

### Task 3: Core date utilities, month grid, locale labels

**Files:**
- Create: `src/core/dateUtils.ts`, `src/core/monthGrid.ts`, `src/core/locale.ts`
- Test: `src/core/__tests__/dateUtils.test.ts`, `src/core/__tests__/monthGrid.test.ts`, `src/core/__tests__/locale.test.ts`

**Interfaces:**
- Consumes: `DateConstraints`, `WeekdayIndex` from `src/types.ts`.
- Produces:
  - `toZoned(date: Date, timeZone?: string): Date` (returns the **same instance** when `timeZone` is undefined)
  - `now(timeZone?: string): Date`
  - `dayKey(date: Date, timeZone?: string): string` → `'yyyy-MM-dd'`
  - `monthKey(date: Date, timeZone?: string): string` → `'yyyy-MM'`
  - `clampDate(date: Date, minDate?: Date, maxDate?: Date): Date`
  - `type DayMatcher = (date: Date) => boolean`; `createDisabledMatcher(c: DateConstraints): DayMatcher`
  - `interface DayCellModel { date: Date; key: string; inMonth: boolean }`; `GRID_WEEKS = 6`; `buildMonthGrid(month: Date, firstDayOfWeek: WeekdayIndex): DayCellModel[][]`
  - `weekdayLabels(firstDayOfWeek: WeekdayIndex, locale?: Locale): string[]`, `monthLabels(locale?: Locale): string[]`, `monthName(month: Date, locale?: Locale): string`, `yearLabel(month: Date, locale?: Locale): string`

- [ ] **Step 1: Write the failing tests**

`src/core/__tests__/dateUtils.test.ts`:
```ts
import { TZDate } from '@date-fns/tz';
import { clampDate, createDisabledMatcher, dayKey, monthKey, toZoned } from '../dateUtils';

describe('toZoned', () => {
  it('returns the same instance when no zone is given', () => {
    const d = new Date(2026, 8, 29);
    expect(toZoned(d)).toBe(d);
  });

  it('wraps the same instant in a TZDate when a zone is given', () => {
    const d = new Date(Date.UTC(2026, 8, 29, 12));
    const zoned = toZoned(d, 'Asia/Tokyo');
    expect(zoned).toBeInstanceOf(TZDate);
    expect(zoned.getTime()).toBe(d.getTime());
  });
});

describe('dayKey / monthKey', () => {
  it('formats local dates', () => {
    expect(dayKey(new Date(2026, 8, 5))).toBe('2026-09-05');
    expect(monthKey(new Date(2026, 8, 5))).toBe('2026-09');
  });

  it('evaluates the calendar day in the requested zone', () => {
    const instant = new Date(Date.UTC(2026, 8, 30, 2, 0));
    expect(dayKey(instant, 'America/Los_Angeles')).toBe('2026-09-29');
    expect(dayKey(instant, 'Asia/Tokyo')).toBe('2026-09-30');
  });
});

describe('clampDate', () => {
  const min = new Date(2026, 8, 10);
  const max = new Date(2026, 8, 20);
  it('clamps below, above and passes through inside', () => {
    expect(clampDate(new Date(2026, 8, 1), min, max)).toBe(min);
    expect(clampDate(new Date(2026, 8, 25), min, max)).toBe(max);
    const inside = new Date(2026, 8, 15);
    expect(clampDate(inside, min, max)).toBe(inside);
  });
});

describe('createDisabledMatcher', () => {
  it('treats min/max as inclusive calendar days regardless of time', () => {
    const isDisabled = createDisabledMatcher({
      minDate: new Date(2026, 8, 10, 18, 30),
      maxDate: new Date(2026, 8, 20, 6, 0),
      disabledDates: [new Date(2026, 8, 15, 12)],
    });
    expect(isDisabled(new Date(2026, 8, 9))).toBe(true);
    expect(isDisabled(new Date(2026, 8, 10))).toBe(false);
    expect(isDisabled(new Date(2026, 8, 20, 23, 59))).toBe(false);
    expect(isDisabled(new Date(2026, 8, 21))).toBe(true);
    expect(isDisabled(new Date(2026, 8, 15))).toBe(true);
  });

  it('supports a predicate', () => {
    const weekends = createDisabledMatcher({
      disabledDates: (d) => d.getDay() === 0 || d.getDay() === 6,
    });
    expect(weekends(new Date(2026, 8, 26))).toBe(true); // Saturday
    expect(weekends(new Date(2026, 8, 28))).toBe(false); // Monday
  });
});
```

`src/core/__tests__/monthGrid.test.ts`:
```ts
import { TZDate } from '@date-fns/tz';
import { buildMonthGrid, GRID_WEEKS } from '../monthGrid';

describe('buildMonthGrid', () => {
  it('always returns 6 weeks of 7 days (fixed height on every platform)', () => {
    const grid = buildMonthGrid(new Date(2026, 1, 1), 0); // Feb 2026 fits in 4 weeks
    expect(grid).toHaveLength(GRID_WEEKS);
    grid.forEach((week) => expect(week).toHaveLength(7));
  });

  it('starts on the configured weekday', () => {
    // 1 Sep 2026 is a Tuesday
    expect(buildMonthGrid(new Date(2026, 8, 1), 0)[0]?.[0]?.key).toBe('2026-08-30');
    expect(buildMonthGrid(new Date(2026, 8, 1), 1)[0]?.[0]?.key).toBe('2026-08-31');
  });

  it('flags in-month days', () => {
    const flat = buildMonthGrid(new Date(2026, 8, 1), 0).flat();
    expect(flat.filter((c) => c.inMonth)).toHaveLength(30);
    expect(flat[0]?.inMonth).toBe(false);
  });

  it('yields 42 unique consecutive midnight days across a DST change (review focus)', () => {
    const flat = buildMonthGrid(new TZDate(2026, 10, 1, 'America/New_York'), 0).flat();
    const keys = flat.map((c) => c.key);
    expect(new Set(keys).size).toBe(42);
    expect(keys[0]).toBe('2026-11-01');
    expect(keys[41]).toBe('2026-12-12');
    flat.forEach((c) => expect(c.date.getHours()).toBe(0));
  });
});
```

`src/core/__tests__/locale.test.ts`:
```ts
import { fr } from 'date-fns/locale';
import { monthLabels, monthName, weekdayLabels, yearLabel } from '../locale';

describe('locale labels', () => {
  it('builds weekday labels starting at firstDayOfWeek', () => {
    expect(weekdayLabels(0)).toEqual(['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']);
    expect(weekdayLabels(1)[0]).toBe('Mo');
    expect(weekdayLabels(1, fr)[0]).toBe('lu');
  });

  it('builds month labels', () => {
    const labels = monthLabels();
    expect(labels).toHaveLength(12);
    expect(labels[0]).toBe('Jan');
    expect(labels[11]).toBe('Dec');
  });

  it('formats header parts', () => {
    const sep = new Date(2026, 8, 1);
    expect(monthName(sep)).toBe('September');
    expect(yearLabel(sep)).toBe('2026');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test -- src/core`
Expected: FAIL "Cannot find module '../dateUtils'" (and the same for the other two modules).

- [ ] **Step 3: Implement `src/core/dateUtils.ts`**

```ts
/**
 * Zone-aware day arithmetic. Every calendar-day comparison goes through
 * `dayKey`, so min/max/disabled checks don't depend on time of day or device zone.
 */
import { TZDate } from '@date-fns/tz';
import { format } from 'date-fns';
import type { DateConstraints } from '../types';

/** `date` viewed in `timeZone` (TZDate), or the same instance when no zone is given. */
export function toZoned(date: Date, timeZone?: string): Date {
  return timeZone ? new TZDate(date.getTime(), timeZone) : date;
}

/** The current instant, viewed in `timeZone`. */
export function now(timeZone?: string): Date {
  return toZoned(new Date(), timeZone);
}

/** Calendar-day key `yyyy-MM-dd`; lexicographic order equals chronological order. */
export function dayKey(date: Date, timeZone?: string): string {
  return format(toZoned(date, timeZone), 'yyyy-MM-dd');
}

/** Month key `yyyy-MM`. */
export function monthKey(date: Date, timeZone?: string): string {
  return format(toZoned(date, timeZone), 'yyyy-MM');
}

/** Clamp an instant into [minDate, maxDate]. */
export function clampDate(date: Date, minDate?: Date, maxDate?: Date): Date {
  if (minDate && date.getTime() < minDate.getTime()) return minDate;
  if (maxDate && date.getTime() > maxDate.getTime()) return maxDate;
  return date;
}

export type DayMatcher = (date: Date) => boolean;

/** Build a predicate that returns true when a day may NOT be selected. Keys are precomputed once. */
export function createDisabledMatcher(constraints: DateConstraints): DayMatcher {
  const { minDate, maxDate, disabledDates, timeZone } = constraints;
  const minKey = minDate ? dayKey(minDate, timeZone) : undefined;
  const maxKey = maxDate ? dayKey(maxDate, timeZone) : undefined;
  const predicate = typeof disabledDates === 'function' ? disabledDates : undefined;
  const listed =
    disabledDates && typeof disabledDates !== 'function'
      ? new Set(disabledDates.map((d) => dayKey(d, timeZone)))
      : undefined;

  return (date) => {
    const key = dayKey(date, timeZone);
    if (minKey !== undefined && key < minKey) return true;
    if (maxKey !== undefined && key > maxKey) return true;
    if (listed?.has(key)) return true;
    return predicate ? predicate(date) : false;
  };
}
```

- [ ] **Step 4: Implement `src/core/monthGrid.ts`**

```ts
/** Fixed 6×7 month grid model. Constant height means no layout jump when swiping between months. */
import { addDays, isSameMonth, startOfMonth, startOfWeek } from 'date-fns';
import type { WeekdayIndex } from '../types';
import { dayKey } from './dateUtils';

export interface DayCellModel {
  readonly date: Date;
  readonly key: string;
  readonly inMonth: boolean;
}

export const GRID_WEEKS = 6;

/**
 * Build the grid for `month`. Pass a TZDate to compute in a specific zone:
 * date-fns v4 keeps the zone through `addDays`, so wall-clock midnight
 * survives DST changes.
 */
export function buildMonthGrid(month: Date, firstDayOfWeek: WeekdayIndex): DayCellModel[][] {
  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: firstDayOfWeek });
  return Array.from({ length: GRID_WEEKS }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => {
      const date = addDays(gridStart, week * 7 + day);
      return { date, key: dayKey(date), inMonth: isSameMonth(date, month) };
    }),
  );
}
```

- [ ] **Step 5: Implement `src/core/locale.ts`**

```ts
/** Locale labels through date-fns only (no Intl), so output is identical on Hermes and browsers. */
import { addDays, format, startOfWeek, type Locale } from 'date-fns';
import type { WeekdayIndex } from '../types';

/** Any fixed date; labels must not depend on "today". */
const REFERENCE_DAY = new Date(2026, 0, 4);

export function weekdayLabels(firstDayOfWeek: WeekdayIndex, locale?: Locale): string[] {
  const start = startOfWeek(REFERENCE_DAY, { weekStartsOn: firstDayOfWeek });
  return Array.from({ length: 7 }, (_, i) => format(addDays(start, i), 'EEEEEE', { locale }));
}

export function monthLabels(locale?: Locale): string[] {
  return Array.from({ length: 12 }, (_, i) => format(new Date(2026, i, 1), 'LLL', { locale }));
}

export function monthName(month: Date, locale?: Locale): string {
  return format(month, 'LLLL', { locale });
}

export function yearLabel(month: Date, locale?: Locale): string {
  return format(month, 'yyyy', { locale });
}
```

- [ ] **Step 6: Run to verify pass**

Run: `pnpm test -- src/core`
Expected: PASS in ios, android and web (3 suites × 3 projects).

- [ ] **Step 7: Checkpoint (no commit)** — `git status --short`.

---

### Task 4: Selection model + calendar navigation rules

**Files:**
- Create: `src/core/selection.ts`, `src/core/navigation.ts`
- Test: `src/core/__tests__/selection.test.ts`, `src/core/__tests__/navigation.test.ts`

**Interfaces:**
- Consumes: `dayKey`, `monthKey`, `toZoned`, `clampDate` (Task 3); `SelectionMode`, `SelectionValue`, `DateRange`, `DateConstraints`, `RangePosition` (Task 2).
- Produces:
  - `emptySelection(mode: SelectionMode): SelectionValue`
  - `applySelection(mode: SelectionMode, value: SelectionValue, date: Date, timeZone?: string): SelectionValue`
  - `interface DaySelectionState { isSelected; isRangeStart; isRangeEnd; isInRange: boolean; rangePosition: RangePosition }`
  - `type SelectionMatcher = (date: Date) => DaySelectionState`; `createSelectionMatcher(mode, value, timeZone?): SelectionMatcher`
  - `anchorDate(mode: SelectionMode, value: SelectionValue): Date | null`
  - `canNavigate(month: Date, direction: -1 | 1, c: DateConstraints): boolean`
  - `isMonthOutOfRange(month: Date, c: DateConstraints): boolean`, `isYearOutOfRange(year: number, c: DateConstraints): boolean`
  - `clampToMonth(date: Date, c: DateConstraints): Date` (start of the clamped month), `getInitialMonth(anchor: Date | null, c: DateConstraints, today: Date): Date`
  - `resolveSwipe(translationX: number, velocityX: number, width: number, canPrev: boolean, canNext: boolean): -1 | 0 | 1` (a worklet)

- [ ] **Step 1: Write the failing tests**

`src/core/__tests__/selection.test.ts`:
```ts
import type { DateRange } from '../../types';
import { dayKey } from '../dateUtils';
import { anchorDate, applySelection, createSelectionMatcher, emptySelection } from '../selection';

const d = (day: number) => new Date(2026, 8, day);
const keys = (v: unknown) => (v as Date[]).map((x) => dayKey(x));
const rangeKeys = (v: unknown) => {
  const r = v as DateRange;
  return [r.start ? dayKey(r.start) : null, r.end ? dayKey(r.end) : null];
};

describe('emptySelection', () => {
  it('returns the empty shape per mode', () => {
    expect(emptySelection('single')).toBeNull();
    expect(emptySelection('multiple')).toEqual([]);
    expect(emptySelection('range')).toEqual({ start: null, end: null });
  });
});

describe('applySelection', () => {
  it('single replaces', () => {
    expect(dayKey(applySelection('single', d(1), d(2)) as Date)).toBe('2026-09-02');
    expect(dayKey(applySelection('single', null, d(3)) as Date)).toBe('2026-09-03');
  });

  it('multiple toggles by calendar day', () => {
    const added = applySelection('multiple', [d(1)], d(2));
    expect(keys(added)).toEqual(['2026-09-01', '2026-09-02']);
    const removed = applySelection('multiple', added, new Date(2026, 8, 1, 15));
    expect(keys(removed)).toEqual(['2026-09-02']);
  });

  it('range: start → end → restart', () => {
    const empty = emptySelection('range');
    const started = applySelection('range', empty, d(10));
    expect(rangeKeys(started)).toEqual(['2026-09-10', null]);
    const done = applySelection('range', started, d(14));
    expect(rangeKeys(done)).toEqual(['2026-09-10', '2026-09-14']);
    expect(rangeKeys(applySelection('range', done, d(20)))).toEqual(['2026-09-20', null]);
  });

  it('range: tapping before start restarts from the new day', () => {
    const started = applySelection('range', emptySelection('range'), d(10));
    expect(rangeKeys(applySelection('range', started, d(5)))).toEqual(['2026-09-05', null]);
  });

  it('range: tapping start again makes a single-day range', () => {
    const started = applySelection('range', emptySelection('range'), d(10));
    expect(rangeKeys(applySelection('range', started, d(10)))).toEqual(['2026-09-10', '2026-09-10']);
  });
});

describe('createSelectionMatcher', () => {
  it('marks range positions', () => {
    const match = createSelectionMatcher('range', { start: d(10), end: d(14) });
    expect(match(d(10))).toMatchObject({ isSelected: true, isRangeStart: true, rangePosition: 'start' });
    expect(match(d(12))).toMatchObject({ isSelected: false, isInRange: true, rangePosition: 'middle' });
    expect(match(d(14))).toMatchObject({ isSelected: true, isRangeEnd: true, rangePosition: 'end' });
    expect(match(d(15)).rangePosition).toBe('none');
  });

  it('single-day range shows as selected without a band', () => {
    const match = createSelectionMatcher('range', { start: d(10), end: d(10) });
    expect(match(d(10))).toMatchObject({ isSelected: true, rangePosition: 'none' });
  });

  it('single and multiple', () => {
    expect(createSelectionMatcher('single', d(3))(d(3)).isSelected).toBe(true);
    expect(createSelectionMatcher('single', null)(d(3)).isSelected).toBe(false);
    expect(createSelectionMatcher('multiple', [d(1), d(4)])(d(4)).isSelected).toBe(true);
  });
});

describe('anchorDate', () => {
  it('picks the first meaningful date', () => {
    expect(anchorDate('single', null)).toBeNull();
    expect(anchorDate('multiple', [])).toBeNull();
    expect(dayKey(anchorDate('range', { start: d(7), end: null }) as Date)).toBe('2026-09-07');
  });
});
```

`src/core/__tests__/navigation.test.ts`:
```ts
import { monthKey } from '../dateUtils';
import {
  canNavigate,
  clampToMonth,
  getInitialMonth,
  isMonthOutOfRange,
  isYearOutOfRange,
  resolveSwipe,
} from '../navigation';

const sep = new Date(2026, 8, 1);

describe('canNavigate', () => {
  it('blocks moving before the minDate month', () => {
    expect(canNavigate(sep, -1, { minDate: new Date(2026, 8, 10) })).toBe(false);
    expect(canNavigate(sep, -1, { minDate: new Date(2026, 7, 31) })).toBe(true);
  });
  it('blocks moving past the maxDate month', () => {
    expect(canNavigate(sep, 1, { maxDate: new Date(2026, 8, 30) })).toBe(false);
    expect(canNavigate(sep, 1, { maxDate: new Date(2026, 9, 2) })).toBe(true);
  });
  it('is unrestricted without constraints', () => {
    expect(canNavigate(sep, -1, {})).toBe(true);
    expect(canNavigate(sep, 1, {})).toBe(true);
  });
});

describe('range checks', () => {
  const c = { minDate: new Date(2026, 8, 10), maxDate: new Date(2027, 1, 3) };
  it('months', () => {
    expect(isMonthOutOfRange(new Date(2026, 7, 1), c)).toBe(true);
    expect(isMonthOutOfRange(sep, c)).toBe(false);
    expect(isMonthOutOfRange(new Date(2027, 2, 1), c)).toBe(true);
  });
  it('years', () => {
    expect(isYearOutOfRange(2025, c)).toBe(true);
    expect(isYearOutOfRange(2026, c)).toBe(false);
    expect(isYearOutOfRange(2027, c)).toBe(false);
    expect(isYearOutOfRange(2028, c)).toBe(true);
  });
});

describe('getInitialMonth / clampToMonth (review focus)', () => {
  const today = new Date(2026, 8, 29);
  it('opens on the minDate month when today is before it', () => {
    const month = getInitialMonth(null, { minDate: new Date(2027, 2, 10) }, today);
    expect(monthKey(month)).toBe('2027-03');
    expect(month.getDate()).toBe(1);
  });
  it('opens on the maxDate month when today is after it', () => {
    expect(monthKey(getInitialMonth(null, { maxDate: new Date(2026, 0, 15) }, today))).toBe('2026-01');
  });
  it('prefers the anchor (selected value)', () => {
    expect(monthKey(getInitialMonth(new Date(2026, 11, 25), {}, today))).toBe('2026-12');
  });
  it('clampToMonth returns the month start', () => {
    const m = clampToMonth(new Date(2026, 8, 17), {});
    expect(m.getDate()).toBe(1);
    expect(m.getHours()).toBe(0);
  });
});

describe('resolveSwipe', () => {
  it('commits past 25% width or 500px/s', () => {
    expect(resolveSwipe(-120, 0, 300, true, true)).toBe(1);
    expect(resolveSwipe(120, 0, 300, true, true)).toBe(-1);
    expect(resolveSwipe(-30, -800, 300, true, true)).toBe(1);
    expect(resolveSwipe(-30, -100, 300, true, true)).toBe(0);
  });
  it('refuses blocked directions', () => {
    expect(resolveSwipe(-120, 0, 300, true, false)).toBe(0);
    expect(resolveSwipe(120, 0, 300, false, true)).toBe(0);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test -- src/core/__tests__/selection.test.ts src/core/__tests__/navigation.test.ts`
Expected: FAIL "Cannot find module '../selection'" / "'../navigation'".

- [ ] **Step 3: Implement `src/core/selection.ts`**

```ts
/** Pure selection model for single / multiple / range calendars. */
import type { DateRange, RangePosition, SelectionMode, SelectionValue } from '../types';
import { dayKey } from './dateUtils';

const EMPTY_RANGE: DateRange = { start: null, end: null };

const asArray = (value: SelectionValue): readonly Date[] => (Array.isArray(value) ? value : []);

const asRange = (value: SelectionValue): DateRange =>
  value !== null && !Array.isArray(value) && !(value instanceof Date) ? value : EMPTY_RANGE;

export function emptySelection(mode: SelectionMode): SelectionValue {
  if (mode === 'single') return null;
  if (mode === 'multiple') return [];
  return EMPTY_RANGE;
}

function toggleMultiple(values: readonly Date[], date: Date, timeZone?: string): Date[] {
  const key = dayKey(date, timeZone);
  return values.some((v) => dayKey(v, timeZone) === key)
    ? values.filter((v) => dayKey(v, timeZone) !== key)
    : [...values, date];
}

function selectRange(range: DateRange, date: Date, timeZone?: string): DateRange {
  const { start, end } = range;
  if (!start || end) return { start: date, end: null };
  if (dayKey(date, timeZone) < dayKey(start, timeZone)) return { start: date, end: null };
  return { start, end: date };
}

/** Next selection after the user taps `date`. */
export function applySelection(
  mode: SelectionMode,
  value: SelectionValue,
  date: Date,
  timeZone?: string,
): SelectionValue {
  switch (mode) {
    case 'single':
      return date;
    case 'multiple':
      return toggleMultiple(asArray(value), date, timeZone);
    case 'range':
      return selectRange(asRange(value), date, timeZone);
  }
}

export interface DaySelectionState {
  readonly isSelected: boolean;
  readonly isRangeStart: boolean;
  readonly isRangeEnd: boolean;
  readonly isInRange: boolean;
  readonly rangePosition: RangePosition;
}

export type SelectionMatcher = (date: Date) => DaySelectionState;

const NONE: DaySelectionState = {
  isSelected: false,
  isRangeStart: false,
  isRangeEnd: false,
  isInRange: false,
  rangePosition: 'none',
};

const SELECTED: DaySelectionState = { ...NONE, isSelected: true };

/** Precompute keys once per render; the returned matcher is O(1) per cell. */
export function createSelectionMatcher(
  mode: SelectionMode,
  value: SelectionValue,
  timeZone?: string,
): SelectionMatcher {
  if (mode === 'single') {
    const key = value instanceof Date ? dayKey(value, timeZone) : undefined;
    return (date) => (key !== undefined && dayKey(date, timeZone) === key ? SELECTED : NONE);
  }
  if (mode === 'multiple') {
    const keys = new Set(asArray(value).map((v) => dayKey(v, timeZone)));
    return (date) => (keys.has(dayKey(date, timeZone)) ? SELECTED : NONE);
  }
  const { start, end } = asRange(value);
  const s = start ? dayKey(start, timeZone) : undefined;
  const e = end ? dayKey(end, timeZone) : undefined;
  const hasBand = s !== undefined && e !== undefined && s !== e;
  return (date) => {
    const key = dayKey(date, timeZone);
    const isRangeStart = key === s;
    const isRangeEnd = key === e;
    const isInRange = hasBand && key > (s as string) && key < (e as string);
    const rangePosition: RangePosition = !hasBand
      ? 'none'
      : isRangeStart
        ? 'start'
        : isRangeEnd
          ? 'end'
          : isInRange
            ? 'middle'
            : 'none';
    return { isSelected: isRangeStart || isRangeEnd, isRangeStart, isRangeEnd, isInRange, rangePosition };
  };
}

/** The date the calendar should open on, if any. */
export function anchorDate(mode: SelectionMode, value: SelectionValue): Date | null {
  if (mode === 'single') return value instanceof Date ? value : null;
  if (mode === 'multiple') return asArray(value)[0] ?? null;
  return asRange(value).start;
}
```

- [ ] **Step 4: Implement `src/core/navigation.ts`**

```ts
/** Month/year navigation limits and the swipe decision (shared by the UI thread and tests). */
import { addMonths, getYear, startOfMonth } from 'date-fns';
import type { DateConstraints } from '../types';
import { clampDate, monthKey, toZoned } from './dateUtils';

export function canNavigate(month: Date, direction: -1 | 1, c: DateConstraints): boolean {
  const target = monthKey(addMonths(month, direction), c.timeZone);
  if (direction < 0 && c.minDate) return target >= monthKey(c.minDate, c.timeZone);
  if (direction > 0 && c.maxDate) return target <= monthKey(c.maxDate, c.timeZone);
  return true;
}

export function isMonthOutOfRange(month: Date, c: DateConstraints): boolean {
  const key = monthKey(month, c.timeZone);
  if (c.minDate && key < monthKey(c.minDate, c.timeZone)) return true;
  return Boolean(c.maxDate && key > monthKey(c.maxDate, c.timeZone));
}

export function isYearOutOfRange(year: number, c: DateConstraints): boolean {
  if (c.minDate && year < getYear(toZoned(c.minDate, c.timeZone))) return true;
  return Boolean(c.maxDate && year > getYear(toZoned(c.maxDate, c.timeZone)));
}

/** Start of the month containing `date`, clamped into [minDate, maxDate]. */
export function clampToMonth(date: Date, c: DateConstraints): Date {
  return startOfMonth(toZoned(clampDate(date, c.minDate, c.maxDate), c.timeZone));
}

/** First visible month: the selection anchor, else today, clamped to the allowed range. */
export function getInitialMonth(anchor: Date | null, c: DateConstraints, today: Date): Date {
  return clampToMonth(anchor ?? today, c);
}

const SWIPE_DISTANCE_RATIO = 0.25;
const SWIPE_VELOCITY = 500;

/** -1 = previous month, 1 = next month, 0 = snap back. Runs as a worklet inside the pan gesture. */
export function resolveSwipe(
  translationX: number,
  velocityX: number,
  width: number,
  canPrev: boolean,
  canNext: boolean,
): -1 | 0 | 1 {
  'worklet';
  const farEnough = Math.abs(translationX) > width * SWIPE_DISTANCE_RATIO;
  const fastEnough = Math.abs(velocityX) > SWIPE_VELOCITY;
  if (!farEnough && !fastEnough) return 0;
  const direction = (farEnough ? translationX : velocityX) < 0 ? 1 : -1;
  if (direction === 1 && !canNext) return 0;
  if (direction === -1 && !canPrev) return 0;
  return direction;
}
```

- [ ] **Step 5: Run to verify pass**

Run: `pnpm test -- src/core`
Expected: PASS on ios, android, web.

- [ ] **Step 6: Checkpoint (no commit)** — `git status --short`.

---

### Task 5: Time model + date/time combination

**Files:**
- Create: `src/core/time.ts`, `src/core/dateTime.ts`
- Test: `src/core/__tests__/time.test.ts`, `src/core/__tests__/dateTime.test.ts`

**Interfaces:**
- Consumes: `toZoned`, `now` (Task 3); `HourFormat`, `MinuteStep` (Task 2).
- Produces:
  - `type Period = 'AM' | 'PM'`; `HOURS_24: readonly number[]` (0..23); `HOURS_12: readonly number[]` ([12, 1..11])
  - `to12h(hours24: number): { hour12: number; period: Period }`; `to24h(hour12: number, period: Period): number`
  - `buildMinuteOptions(step: MinuteStep): number[]`; `snapMinute(minute: number, step: MinuteStep): number`
  - `withTime(base: Date, hours: number, minutes: number): Date`; `pad2(n: number): string`
  - `periodLabels(locale?: Locale): [string, string]`
  - `interface WheelIndices { hour: number; minute: number; period: 0 | 1 }`
  - `timeToIndices(date: Date, hourFormat: HourFormat, step: MinuteStep): WheelIndices`
  - `indicesToTime(base: Date, indices: WheelIndices, hourFormat: HourFormat, step: MinuteStep): Date`
  - `combineDateAndTime(datePart: Date, timePart: Date, timeZone?: string): Date`; `defaultTime(step: MinuteStep, timeZone?: string): Date`

- [ ] **Step 1: Write the failing tests**

`src/core/__tests__/time.test.ts`:
```ts
import {
  buildMinuteOptions,
  HOURS_12,
  indicesToTime,
  periodLabels,
  snapMinute,
  timeToIndices,
  to12h,
  to24h,
} from '../time';

describe('12h ↔ 24h (review focus: midnight/noon)', () => {
  it('converts to 12h', () => {
    expect(to12h(0)).toEqual({ hour12: 12, period: 'AM' });
    expect(to12h(12)).toEqual({ hour12: 12, period: 'PM' });
    expect(to12h(13)).toEqual({ hour12: 1, period: 'PM' });
    expect(to12h(11)).toEqual({ hour12: 11, period: 'AM' });
  });
  it('converts to 24h', () => {
    expect(to24h(12, 'AM')).toBe(0);
    expect(to24h(12, 'PM')).toBe(12);
    expect(to24h(1, 'PM')).toBe(13);
    expect(to24h(11, 'AM')).toBe(11);
  });
  it('orders 12h wheel with 12 first', () => {
    expect(HOURS_12).toEqual([12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });
});

describe('minute steps (review focus: unaligned minutes)', () => {
  it('builds options', () => {
    expect(buildMinuteOptions(15)).toEqual([0, 15, 30, 45]);
    expect(buildMinuteOptions(1)).toHaveLength(60);
  });
  it('floors to the step so the hour never carries', () => {
    expect(snapMinute(7, 15)).toBe(0);
    expect(snapMinute(53, 15)).toBe(45);
    expect(snapMinute(59, 1)).toBe(59);
  });
  it('shows 10:07 at step 15 as minute index 0 and emits 11:00 on hour change', () => {
    const base = new Date(2026, 8, 29, 10, 7);
    const idx = timeToIndices(base, '24h', 15);
    expect(idx.minute).toBe(0);
    const next = indicesToTime(base, { ...idx, hour: 11 }, '24h', 15);
    expect([next.getHours(), next.getMinutes(), next.getDate()]).toEqual([11, 0, 29]);
  });
});

describe('wheel indices', () => {
  it('maps 00:15 in 12h to hour index 0 (label 12) AM', () => {
    expect(timeToIndices(new Date(2026, 8, 29, 0, 15), '12h', 5)).toEqual({ hour: 0, minute: 3, period: 0 });
  });
  it('maps 13:40 in 24h', () => {
    expect(timeToIndices(new Date(2026, 8, 29, 13, 40), '24h', 10)).toEqual({ hour: 13, minute: 4, period: 1 });
  });
  it('12h index 0 + PM is noon', () => {
    const t = indicesToTime(new Date(2026, 8, 29), { hour: 0, minute: 3, period: 1 }, '12h', 5);
    expect([t.getHours(), t.getMinutes()]).toEqual([12, 15]);
  });
  it('clears seconds', () => {
    const t = indicesToTime(new Date(2026, 8, 29, 1, 2, 33, 400), { hour: 1, minute: 2, period: 0 }, '24h', 1);
    expect([t.getSeconds(), t.getMilliseconds()]).toEqual([0, 0]);
  });
});

describe('periodLabels', () => {
  it('uses locale day periods', () => {
    expect(periodLabels()).toEqual(['AM', 'PM']);
  });
});
```

`src/core/__tests__/dateTime.test.ts`:
```ts
import { combineDateAndTime, defaultTime } from '../dateTime';

describe('combineDateAndTime', () => {
  it('takes the calendar day from one and the clock from the other', () => {
    const out = combineDateAndTime(new Date(2026, 8, 10, 8, 0), new Date(2026, 0, 1, 14, 45, 12));
    expect([out.getFullYear(), out.getMonth(), out.getDate(), out.getHours(), out.getMinutes(), out.getSeconds()]).toEqual([
      2026, 8, 10, 14, 45, 0,
    ]);
  });

  it('works in an explicit zone', () => {
    const tz = 'Asia/Tokyo';
    const datePart = new Date(Date.UTC(2026, 8, 9, 20)); // 10 Sep 05:00 in Tokyo
    const timePart = new Date(Date.UTC(2026, 8, 1, 5, 30)); // 14:30 in Tokyo
    const out = combineDateAndTime(datePart, timePart, tz);
    expect(out.toISOString()).toBe('2026-09-10T05:30:00.000Z'); // 14:30 JST
  });
});

describe('defaultTime', () => {
  it('floors now to the minute step', () => {
    expect(defaultTime(15).getMinutes() % 15).toBe(0);
    expect(defaultTime(15).getSeconds()).toBe(0);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test -- src/core/__tests__/time.test.ts src/core/__tests__/dateTime.test.ts`
Expected: FAIL "Cannot find module".

- [ ] **Step 3: Implement `src/core/time.ts`**

```ts
/** Time-of-day model shared by the wheel and inline TimePicker variants. */
import { format, getHours, getMinutes, set, setHours, type Locale } from 'date-fns';
import type { HourFormat, MinuteStep } from '../types';

export type Period = 'AM' | 'PM';

export const HOURS_24: readonly number[] = Array.from({ length: 24 }, (_, i) => i);
/** 12h wheel order: 12, 1, 2 … 11. Index i ↔ (hours24 % 12). */
export const HOURS_12: readonly number[] = Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i));

export function to12h(hours24: number): { hour12: number; period: Period } {
  const rem = hours24 % 12;
  return { hour12: rem === 0 ? 12 : rem, period: hours24 < 12 ? 'AM' : 'PM' };
}

export function to24h(hour12: number, period: Period): number {
  const base = hour12 % 12;
  return period === 'PM' ? base + 12 : base;
}

export function buildMinuteOptions(step: MinuteStep): number[] {
  return Array.from({ length: 60 / step }, (_, i) => i * step);
}

/** Floor (never round) so a snapped minute never rolls into the next hour or day. */
export function snapMinute(minute: number, step: MinuteStep): number {
  return Math.floor(minute / step) * step;
}

export function withTime(base: Date, hours: number, minutes: number): Date {
  return set(base, { hours, minutes, seconds: 0, milliseconds: 0 });
}

export const pad2 = (n: number): string => String(n).padStart(2, '0');

const PERIOD_REFERENCE = new Date(2026, 0, 1);

export function periodLabels(locale?: Locale): [string, string] {
  return [
    format(setHours(PERIOD_REFERENCE, 9), 'a', { locale }),
    format(setHours(PERIOD_REFERENCE, 21), 'a', { locale }),
  ];
}

export interface WheelIndices {
  readonly hour: number;
  readonly minute: number;
  readonly period: 0 | 1;
}

export function timeToIndices(date: Date, hourFormat: HourFormat, step: MinuteStep): WheelIndices {
  const hours = getHours(date);
  return {
    hour: hourFormat === '24h' ? hours : hours % 12,
    minute: snapMinute(getMinutes(date), step) / step,
    period: hours < 12 ? 0 : 1,
  };
}

export function indicesToTime(
  base: Date,
  { hour, minute, period }: WheelIndices,
  hourFormat: HourFormat,
  step: MinuteStep,
): Date {
  const hours = hourFormat === '24h' ? hour : (hour % 12) + (period === 1 ? 12 : 0);
  return withTime(base, hours, minute * step);
}
```

- [ ] **Step 4: Implement `src/core/dateTime.ts`**

```ts
/** Combines a calendar day and a time of day for DateTimePicker. */
import { getHours, getMinutes, set } from 'date-fns';
import type { MinuteStep } from '../types';
import { now, toZoned } from './dateUtils';
import { snapMinute, withTime } from './time';

/** Day (Y/M/D) from `datePart`, clock (h:m) from `timePart`, both read in `timeZone`. Seconds are cleared. */
export function combineDateAndTime(datePart: Date, timePart: Date, timeZone?: string): Date {
  const time = toZoned(timePart, timeZone);
  return set(toZoned(datePart, timeZone), {
    hours: getHours(time),
    minutes: getMinutes(time),
    seconds: 0,
    milliseconds: 0,
  });
}

/** "Now", floored to `step`. Used when the user picks a date before any time exists. */
export function defaultTime(step: MinuteStep, timeZone?: string): Date {
  const current = now(timeZone);
  return withTime(current, getHours(current), snapMinute(getMinutes(current), step));
}
```

- [ ] **Step 5: Run to verify pass**

Run: `pnpm test -- src/core`
Expected: PASS on ios, android, web.

- [ ] **Step 6: Checkpoint (no commit)** — `git status --short`.

---

### Task 6: Wheel physics maths (worklet-safe)

**Files:**
- Create: `src/core/wheelMath.ts`
- Test: `src/core/__tests__/wheelMath.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces (all start with `'worklet'`):
  - `mod(n: number, m: number): number`
  - `shouldLoop(count: number, visibleCount: number): boolean`
  - `offsetForIndex(index: number, itemHeight: number): number`
  - `indexForOffset(offset: number, itemHeight: number, count: number, loop: boolean): number`
  - `snapTargetOffset(offset: number, velocityY: number, itemHeight: number, count: number, loop: boolean): number`
  - `nearestLoopOffset(currentOffset: number, targetIndex: number, itemHeight: number, count: number): number`
  - `itemDistance(index: number, offset: number, itemHeight: number, count: number, loop: boolean): number`
  - `applyOverscroll(offset: number, minOffset: number): number`
  - `VELOCITY_PROJECTION_S = 0.12`, `OVERSCROLL_RESISTANCE = 0.3`

Model: a shared `offset` (px). `offset = -index * itemHeight` puts `index` in the centre row. In loop mode the offset is unbounded, and indices are taken `mod count`.

- [ ] **Step 1: Write the failing test** `src/core/__tests__/wheelMath.test.ts`

```ts
import {
  applyOverscroll,
  indexForOffset,
  itemDistance,
  mod,
  nearestLoopOffset,
  offsetForIndex,
  shouldLoop,
  snapTargetOffset,
} from '../wheelMath';

const H = 44;

describe('mod (review focus: wrap)', () => {
  it('is always non-negative', () => {
    expect(mod(-1, 12)).toBe(11);
    expect(mod(13, 12)).toBe(1);
    expect(mod(-24, 12)).toBe(0);
  });
});

describe('shouldLoop', () => {
  it('only loops when there are enough rows to fill the viewport plus a buffer', () => {
    expect(shouldLoop(2, 5)).toBe(false);
    expect(shouldLoop(6, 5)).toBe(false);
    expect(shouldLoop(7, 5)).toBe(true);
    expect(shouldLoop(60, 5)).toBe(true);
  });
});

describe('index ↔ offset', () => {
  it('round-trips', () => {
    expect(offsetForIndex(5, H)).toBe(-220);
    expect(indexForOffset(-220 - 10, H, 60, true)).toBe(5);
  });
  it('wraps in loop mode and clamps otherwise', () => {
    expect(indexForOffset(H, H, 60, true)).toBe(59);
    expect(indexForOffset(H, H, 2, false)).toBe(0);
    expect(indexForOffset(-10 * H, H, 2, false)).toBe(1);
  });
});

describe('snapTargetOffset', () => {
  it('projects velocity then snaps to a row', () => {
    expect(snapTargetOffset(-100, 0, H, 60, true)).toBe(-88);
    expect(snapTargetOffset(-100, -1000, H, 60, true)).toBe(-220); // -100 + -120 = -220
  });
  it('clamps to the ends when not looping', () => {
    expect(snapTargetOffset(50, 2000, H, 12, false)).toBe(-0);
    expect(snapTargetOffset(-2000, -2000, H, 12, false)).toBe(-11 * H);
  });
});

describe('nearestLoopOffset (review focus: shortest path)', () => {
  it('59 → 0 moves forward one row', () => {
    expect(nearestLoopOffset(-59 * H, 0, H, 60)).toBe(-60 * H);
  });
  it('0 → 59 moves back one row', () => {
    expect(nearestLoopOffset(0, 59, H, 60)).toBe(H);
  });
  it('keeps the current lap', () => {
    expect(nearestLoopOffset(-125 * H, 7, H, 60)).toBe(-127 * H); // 125 ≡ 5, +2
  });
});

describe('itemDistance', () => {
  it('is the signed row distance from the centre', () => {
    expect(itemDistance(3, offsetForIndex(3, H), H, 12, false)).toBe(0);
    expect(itemDistance(5, offsetForIndex(3, H), H, 12, false)).toBe(2);
  });
  it('wraps around in loop mode', () => {
    expect(itemDistance(0, offsetForIndex(59, H), H, 60, true)).toBe(1);
    expect(itemDistance(59, offsetForIndex(0, H), H, 60, true)).toBe(-1);
  });
});

describe('applyOverscroll', () => {
  const min = -11 * H;
  it('resists past both ends', () => {
    expect(applyOverscroll(20, min)).toBeCloseTo(6);
    expect(applyOverscroll(min - 20, min)).toBeCloseTo(min - 6);
  });
  it('passes through inside the range', () => {
    expect(applyOverscroll(-100, min)).toBe(-100);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test -- src/core/__tests__/wheelMath.test.ts`
Expected: FAIL "Cannot find module '../wheelMath'".

- [ ] **Step 3: Implement `src/core/wheelMath.ts`**

```ts
/**
 * Wheel physics shared by the UI thread (as worklets) and unit tests.
 * Using our own maths instead of ScrollView momentum is what makes the wheel
 * feel the same on iOS, Android and Web.
 */

/** Seconds of velocity to project when a fling is released. */
export const VELOCITY_PROJECTION_S = 0.12;
/** Fraction of drag applied beyond the ends of a non-looping wheel. */
export const OVERSCROLL_RESISTANCE = 0.3;

export function mod(n: number, m: number): number {
  'worklet';
  return ((n % m) + m) % m;
}

/** Loop only when there are enough rows that the wrap seam is never visible. */
export function shouldLoop(count: number, visibleCount: number): boolean {
  'worklet';
  return count >= visibleCount + 2;
}

export function offsetForIndex(index: number, itemHeight: number): number {
  'worklet';
  return -index * itemHeight;
}

function clampIndex(index: number, count: number): number {
  'worklet';
  return Math.min(Math.max(index, 0), count - 1);
}

export function indexForOffset(offset: number, itemHeight: number, count: number, loop: boolean): number {
  'worklet';
  const raw = Math.round(-offset / itemHeight);
  return loop ? mod(raw, count) : clampIndex(raw, count);
}

/** Resting offset after a release with `velocityY` (px/s). */
export function snapTargetOffset(
  offset: number,
  velocityY: number,
  itemHeight: number,
  count: number,
  loop: boolean,
): number {
  'worklet';
  const projected = offset + velocityY * VELOCITY_PROJECTION_S;
  const raw = Math.round(-projected / itemHeight);
  return -(loop ? raw : clampIndex(raw, count)) * itemHeight;
}

/** Offset that shows `targetIndex` via the shortest path from the current lap. */
export function nearestLoopOffset(
  currentOffset: number,
  targetIndex: number,
  itemHeight: number,
  count: number,
): number {
  'worklet';
  const currentRaw = Math.round(-currentOffset / itemHeight);
  let delta = mod(targetIndex - currentRaw, count);
  if (delta > count / 2) delta -= count;
  return -(currentRaw + delta) * itemHeight;
}

/** Signed distance (rows) of item `index` from the centre row. */
export function itemDistance(
  index: number,
  offset: number,
  itemHeight: number,
  count: number,
  loop: boolean,
): number {
  'worklet';
  const rel = index + offset / itemHeight;
  return loop ? mod(rel + count / 2, count) - count / 2 : rel;
}

/** Rubber-band resistance beyond [minOffset, 0]. */
export function applyOverscroll(offset: number, minOffset: number): number {
  'worklet';
  if (offset > 0) return offset * OVERSCROLL_RESISTANCE;
  if (offset < minOffset) return minOffset + (offset - minOffset) * OVERSCROLL_RESISTANCE;
  return offset;
}
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm test -- src/core/__tests__/wheelMath.test.ts`
Expected: PASS on ios, android, web. The `-0` vs `0` case: `toBe(-0)` is written on purpose, because `Object.is(-0, -0)` holds. If the implementation returns `0`, change the assertion to `toEqual(0)`; don't change the maths.

- [ ] **Step 5: Checkpoint (no commit)** — `git status --short`.

---

### Task 7: Theme tokens, CSS-variable resolution, provider

**Files:**
- Create: `src/theme/tokens.ts`, `src/theme/resolveTheme.ts`, `src/theme/DatePickerThemeProvider.tsx`
- Test: `src/theme/__tests__/resolveTheme.test.ts` (pure), `src/theme/__tests__/DatePickerThemeProvider.test.tsx`

**Interfaces:**
- Consumes: `ThemeMode` (Task 2); NativeWind `useColorScheme`, `vars` (mocked in `jest.setup.ts`).
- Produces:
  - `THEME_TOKENS` (readonly tuple), `type ThemeToken`, `type ThemeColors = Record<ThemeToken, string>`
  - `interface DatePickerTheme { colors: ThemeColors; radius: string }`, `interface DatePickerThemeInput { colors?: Partial<ThemeColors>; radius?: string }`, `type ThemeMap = Partial<Record<ThemeMode, DatePickerThemeInput>>`
  - `FALLBACK_THEME: Record<ThemeMode, DatePickerTheme>`
  - `toHslChannels(value: string): string`, `resolveTheme(mode: ThemeMode, map?: ThemeMap): DatePickerTheme`, `toCssVariables(theme: DatePickerTheme): Record<string, string>`, `resolveColor(theme: DatePickerTheme, token: ThemeToken): string` (comma `hsl(h, s%, l%)`, safe for RN colour parsing)
  - `<DatePickerThemeProvider theme? themeOverride? useFallbackTokens? />`
  - `useDatePickerTheme(themeOverride?: ThemeMode): { mode: ThemeMode; theme: DatePickerTheme; rootStyle: ReturnType<typeof vars> | undefined }`. **Every component spreads `rootStyle` onto its root View.**

- [ ] **Step 1: Write the failing pure test** `src/theme/__tests__/resolveTheme.test.ts`

```ts
import { FALLBACK_THEME, THEME_TOKENS } from '../tokens';
import { resolveColor, resolveTheme, toCssVariables, toHslChannels } from '../resolveTheme';

describe('toHslChannels', () => {
  it('converts hex (3 and 6 digit)', () => {
    expect(toHslChannels('#ffffff')).toBe('0 0% 100%');
    expect(toHslChannels('#000')).toBe('0 0% 0%');
    expect(toHslChannels('#ff0000')).toBe('0 100% 50%');
    expect(toHslChannels('#3b82f6')).toBe('217.2 91.2% 59.8%');
  });
  it('unwraps hsl() in comma and space syntax', () => {
    expect(toHslChannels('hsl(217, 91%, 60%)')).toBe('217 91% 60%');
    expect(toHslChannels('hsl(217 91% 60%)')).toBe('217 91% 60%');
  });
  it('passes channels through', () => {
    expect(toHslChannels(' 240 5.9% 10% ')).toBe('240 5.9% 10%');
  });
  it('rejects malformed hex', () => {
    expect(() => toHslChannels('#12')).toThrow('Invalid hex colour');
  });
});

describe('resolveTheme', () => {
  it('returns the fallback when no map is given', () => {
    expect(resolveTheme('dark')).toBe(FALLBACK_THEME.dark);
  });
  it('merges partial overrides and normalises them', () => {
    const t = resolveTheme('light', { light: { colors: { primary: '#ff0000' }, radius: '8px' } });
    expect(t.colors.primary).toBe('0 100% 50%');
    expect(t.colors.background).toBe(FALLBACK_THEME.light.colors.background);
    expect(t.radius).toBe('8px');
  });
});

describe('toCssVariables / resolveColor', () => {
  it('emits one variable per token plus radius', () => {
    const vars = toCssVariables(FALLBACK_THEME.light);
    expect(Object.keys(vars)).toHaveLength(THEME_TOKENS.length + 1);
    expect(vars['--primary-foreground']).toBe(FALLBACK_THEME.light.colors['primary-foreground']);
    expect(vars['--radius']).toBe('12px');
  });
  it('resolves an RN-parsable colour string', () => {
    expect(resolveColor(resolveTheme('light', { light: { colors: { primary: '#ff0000' } } }), 'primary')).toBe(
      'hsl(0, 100%, 50%)',
    );
  });
});
```

- [ ] **Step 2: Write the failing provider test** `src/theme/__tests__/DatePickerThemeProvider.test.tsx`

```tsx
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import type { ThemeMode } from '../../types';
import { DatePickerThemeProvider, useDatePickerTheme } from '../DatePickerThemeProvider';
import { FALLBACK_THEME } from '../tokens';
import { toCssVariables } from '../resolveTheme';

const nativewind = jest.requireMock<{ __setColorScheme: (m: ThemeMode) => void }>('nativewind');

function Probe({ override }: { override?: ThemeMode }) {
  const { mode, rootStyle } = useDatePickerTheme(override);
  return <Text testID="probe">{JSON.stringify({ mode, rootStyle })}</Text>;
}

async function readProbe() {
  const text = screen.getByTestId('probe').props.children as string;
  return JSON.parse(text) as { mode: ThemeMode; rootStyle?: { __vars: Record<string, string> } };
}

afterEach(() => nativewind.__setColorScheme('light'));

describe('useDatePickerTheme', () => {
  it('inherits host tokens by default (no injected variables)', async () => {
    await render(<Probe />);
    expect(await readProbe()).toEqual({ mode: 'light' });
  });

  it('follows the NativeWind colour scheme', async () => {
    nativewind.__setColorScheme('dark');
    await render(<Probe />);
    expect((await readProbe()).mode).toBe('dark');
  });

  it('themeOverride injects the resolved variables for that mode', async () => {
    await render(<Probe override="dark" />);
    const probe = await readProbe();
    expect(probe.mode).toBe('dark');
    expect(probe.rootStyle?.__vars['--background']).toBe(FALLBACK_THEME.dark.colors.background);
  });
});

describe('DatePickerThemeProvider', () => {
  it('injects a custom theme', async () => {
    await render(
      <DatePickerThemeProvider theme={{ light: { colors: { primary: '#ff0000' } } }}>
        <Probe />
      </DatePickerThemeProvider>,
    );
    expect((await readProbe()).rootStyle?.__vars['--primary']).toBe('0 100% 50%');
  });

  it('can inject fallback tokens for hosts without CSS variables', async () => {
    await render(
      <DatePickerThemeProvider useFallbackTokens>
        <Probe />
      </DatePickerThemeProvider>,
    );
    expect((await readProbe()).rootStyle?.__vars).toEqual(toCssVariables(FALLBACK_THEME.light));
  });

  it('provider themeOverride sets the mode for descendants', async () => {
    await render(
      <DatePickerThemeProvider themeOverride="dark">
        <Probe />
      </DatePickerThemeProvider>,
    );
    expect((await readProbe()).mode).toBe('dark');
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `pnpm test -- src/theme`
Expected: FAIL "Cannot find module '../tokens'".

- [ ] **Step 4: Implement `src/theme/tokens.ts`**

```ts
/** Semantic colour tokens and the built-in fallback palette (shadcn/zinc, HSL channels). */
import type { ThemeMode } from '../types';

export const THEME_TOKENS = [
  'background',
  'foreground',
  'primary',
  'primary-foreground',
  'muted',
  'muted-foreground',
  'accent',
  'accent-foreground',
  'border',
] as const;

export type ThemeToken = (typeof THEME_TOKENS)[number];
/** Values are HSL channels, e.g. `"240 5.9% 10%"`. */
export type ThemeColors = Record<ThemeToken, string>;

export interface DatePickerTheme {
  readonly colors: ThemeColors;
  /** CSS length in px (rem differs between native and web). */
  readonly radius: string;
}

/** User input: any colour may be hex, `hsl(...)`, or raw channels. */
export interface DatePickerThemeInput {
  readonly colors?: Partial<ThemeColors>;
  readonly radius?: string;
}

export type ThemeMap = Partial<Record<ThemeMode, DatePickerThemeInput>>;

export const FALLBACK_THEME: Record<ThemeMode, DatePickerTheme> = {
  light: {
    radius: '12px',
    colors: {
      background: '0 0% 100%',
      foreground: '240 10% 3.9%',
      primary: '240 5.9% 10%',
      'primary-foreground': '0 0% 98%',
      muted: '240 4.8% 95.9%',
      'muted-foreground': '240 3.8% 46.1%',
      accent: '240 4.8% 95.9%',
      'accent-foreground': '240 5.9% 10%',
      border: '240 5.9% 90%',
    },
  },
  dark: {
    radius: '12px',
    colors: {
      background: '240 10% 3.9%',
      foreground: '0 0% 98%',
      primary: '0 0% 98%',
      'primary-foreground': '240 5.9% 10%',
      muted: '240 3.7% 15.9%',
      'muted-foreground': '240 5% 64.9%',
      accent: '240 3.7% 15.9%',
      'accent-foreground': '0 0% 98%',
      border: '240 3.7% 15.9%',
    },
  },
};
```

- [ ] **Step 5: Implement `src/theme/resolveTheme.ts`**

```ts
/** Normalises user colours to HSL channels and maps a theme onto CSS variables. */
import type { ThemeMode } from '../types';
import { FALLBACK_THEME, THEME_TOKENS, type DatePickerTheme, type ThemeMap, type ThemeToken } from './tokens';

const round1 = (n: number): number => Math.round(n * 10) / 10;

function hexToHslChannels(hex: string): string {
  const raw = hex.slice(1);
  const full = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;
  if (!/^[0-9a-f]{6}$/i.test(full)) throw new Error(`Invalid hex colour: ${hex}`);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255) as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return `0 0% ${round1(l * 100)}%`;
  const s = d / (1 - Math.abs(2 * l - 1));
  const sector = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  const h = (sector * 60 + 360) % 360;
  return `${round1(h)} ${round1(s * 100)}% ${round1(l * 100)}%`;
}

/** Accepts `#rgb`, `#rrggbb`, `hsl(h, s%, l%)`, `hsl(h s% l%)` or raw channels. */
export function toHslChannels(value: string): string {
  const v = value.trim();
  if (v.startsWith('#')) return hexToHslChannels(v);
  const fn = /^hsla?\((.+)\)$/i.exec(v);
  const body = fn?.[1] ?? v;
  return body.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Fallback palette for `mode`, with any provided overrides merged over it. */
export function resolveTheme(mode: ThemeMode, map?: ThemeMap): DatePickerTheme {
  const base = FALLBACK_THEME[mode];
  const input = map?.[mode];
  if (!input) return base;
  const colors = Object.fromEntries(
    THEME_TOKENS.map((token) => {
      const override = input.colors?.[token];
      return [token, override === undefined ? base.colors[token] : toHslChannels(override)];
    }),
  ) as DatePickerTheme['colors'];
  return { colors, radius: input.radius ?? base.radius };
}

/** `{ '--primary': '240 5.9% 10%', …, '--radius': '12px' }` for NativeWind `vars()`. */
export function toCssVariables(theme: DatePickerTheme): Record<string, string> {
  return Object.fromEntries([
    ...THEME_TOKENS.map((token) => [`--${token}`, theme.colors[token]] as const),
    ['--radius', theme.radius] as const,
  ]);
}

/** Concrete colour for JS-only consumers (e.g. custom renderDay with inline styles). */
export function resolveColor(theme: DatePickerTheme, token: ThemeToken): string {
  return `hsl(${theme.colors[token].split(' ').join(', ')})`;
}
```

- [ ] **Step 6: Implement `src/theme/DatePickerThemeProvider.tsx`**

```tsx
/**
 * Theme context. By default components inherit the host's CSS variables and
 * nothing is injected. Variables are injected with NativeWind `vars()` only when
 * a custom theme, fallback tokens, or a themeOverride is requested.
 */
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme, vars } from 'nativewind';
import type { ThemeMode } from '../types';
import { resolveTheme, toCssVariables } from './resolveTheme';
import type { DatePickerTheme, ThemeMap } from './tokens';

interface ThemeContextValue {
  readonly mode: ThemeMode;
  readonly themes: ThemeMap | undefined;
  readonly injectVariables: boolean;
}

const DatePickerThemeContext = createContext<ThemeContextValue | null>(null);

export interface DatePickerThemeProviderProps {
  children: ReactNode;
  /** Per-mode overrides (hex, hsl() or channels). Enables variable injection. */
  theme?: ThemeMap;
  /** Force light/dark for every descendant picker. */
  themeOverride?: ThemeMode;
  /** Inject the built-in palette when the host defines no CSS variables. */
  useFallbackTokens?: boolean;
}

export function DatePickerThemeProvider({
  children,
  theme,
  themeOverride,
  useFallbackTokens = false,
}: DatePickerThemeProviderProps) {
  const { colorScheme } = useColorScheme();
  const mode: ThemeMode = themeOverride ?? colorScheme ?? 'light';
  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      themes: theme,
      injectVariables: useFallbackTokens || theme !== undefined || themeOverride !== undefined,
    }),
    [mode, theme, useFallbackTokens, themeOverride],
  );
  return <DatePickerThemeContext.Provider value={value}>{children}</DatePickerThemeContext.Provider>;
}

export interface ResolvedPickerTheme {
  readonly mode: ThemeMode;
  readonly theme: DatePickerTheme;
  /** Spread onto the component root; `undefined` means "inherit host tokens". */
  readonly rootStyle: ReturnType<typeof vars> | undefined;
}

export function useDatePickerTheme(themeOverride?: ThemeMode): ResolvedPickerTheme {
  const ctx = useContext(DatePickerThemeContext);
  const { colorScheme } = useColorScheme();
  const mode: ThemeMode = themeOverride ?? ctx?.mode ?? colorScheme ?? 'light';
  const inject = themeOverride !== undefined || (ctx?.injectVariables ?? false);
  const themes = ctx?.themes;
  return useMemo(() => {
    const theme = resolveTheme(mode, themes);
    return { mode, theme, rootStyle: inject ? vars(toCssVariables(theme)) : undefined };
  }, [mode, inject, themes]);
}
```

- [ ] **Step 7: Run to verify pass**

Run: `pnpm test -- src/theme && pnpm typecheck`
Expected: pure suites PASS on ios/android/web; the provider suite PASSES on ios/android; typecheck exits 0.

- [ ] **Step 8: Checkpoint (no commit)** — `git status --short`.

---

### Task 8: Shared hooks, platform helpers, Chevron

**Files:**
- Create: `src/hooks/useControllableState.ts`, `src/platform/haptics.ts`, `src/platform/styles.ts`, `src/platform/useWebWheel.ts`, `src/components/shared/Chevron.tsx`
- Test: `src/hooks/__tests__/useControllableState.test.tsx`, `src/platform/__tests__/haptics.test.tsx`, `src/components/shared/__tests__/Chevron.test.tsx`

**Interfaces:**
- Consumes: `cn` (Task 2).
- Produces:
  - `useControllableState<T>(opts: { value: T | undefined; defaultValue: T; onChange?: (next: T) => void }): [T, (next: T) => void]`. Controlled when `value !== undefined` (so `null` is a controlled "empty").
  - `triggerHaptic(kind: 'selection' | 'impact', enabled: boolean): void` (no-op on web or when disabled)
  - `TEXT_RESET: TextStyle`, `SHADOW: ViewStyle` (a `boxShadow` string)
  - `useWebWheel(ref: RefObject<View | null>, onDelta: (deltaY: number) => void): void`
  - `<Chevron direction="left" | "right" | "up" | "down" className? />`

- [ ] **Step 1: Write the failing tests**

`src/hooks/__tests__/useControllableState.test.tsx`:
```tsx
import { act, renderHook } from '@testing-library/react-native';
import { useControllableState } from '../useControllableState';

describe('useControllableState', () => {
  it('manages internal state when uncontrolled', async () => {
    const onChange = jest.fn();
    const { result } = await renderHook(() => useControllableState({ value: undefined, defaultValue: 1, onChange }));
    await act(async () => result.current[1](2));
    expect(result.current[0]).toBe(2);
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('defers to the prop when controlled (null counts as controlled)', async () => {
    const onChange = jest.fn();
    const { result } = await renderHook(() =>
      useControllableState<Date | null>({ value: null, defaultValue: new Date(), onChange }),
    );
    const next = new Date(2026, 8, 1);
    await act(async () => result.current[1](next));
    expect(result.current[0]).toBeNull();
    expect(onChange).toHaveBeenCalledWith(next);
  });
});
```

`src/platform/__tests__/haptics.test.tsx`:
```tsx
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { triggerHaptic } from '../haptics';

describe('triggerHaptic', () => {
  beforeEach(() => jest.clearAllMocks());

  it('fires selection and impact feedback on native', () => {
    triggerHaptic('selection', true);
    triggerHaptic('impact', true);
    expect(Haptics.selectionAsync).toHaveBeenCalledTimes(1);
    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light);
  });

  it('does nothing when disabled', () => {
    triggerHaptic('selection', false);
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });

  it('does nothing on web', () => {
    const original = Platform.OS;
    Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
    triggerHaptic('selection', true);
    Object.defineProperty(Platform, 'OS', { value: original, configurable: true });
    expect(Haptics.selectionAsync).not.toHaveBeenCalled();
  });
});
```

`src/components/shared/__tests__/Chevron.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react-native';
import { Chevron } from '../Chevron';

describe('Chevron', () => {
  it.each([
    ['left', '45deg'],
    ['right', '-135deg'],
    ['up', '135deg'],
    ['down', '-45deg'],
  ] as const)('rotates the border corner to point %s', async (direction, rotate) => {
    await render(<Chevron direction={direction} testID="c" className="border-primary" />);
    const el = screen.getByTestId('c');
    expect(el.props.style).toEqual({ transform: [{ rotate }] });
    expect(el.props.className).toContain('border-primary');
    expect(el.props.className).not.toContain('border-foreground');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test:ios -- src/hooks src/platform src/components/shared`
Expected: FAIL "Cannot find module".

- [ ] **Step 3: Implement `src/hooks/useControllableState.ts`**

```ts
/** Controlled/uncontrolled state. `undefined` = uncontrolled; any other value (including null) = controlled. */
import { useCallback, useState } from 'react';

export interface ControllableStateOptions<T> {
  value: T | undefined;
  defaultValue: T;
  onChange?: (next: T) => void;
}

export function useControllableState<T>({
  value,
  defaultValue,
  onChange,
}: ControllableStateOptions<T>): [T, (next: T) => void] {
  const [internal, setInternal] = useState<T>(defaultValue);
  const isControlled = value !== undefined;
  const setValue = useCallback(
    (next: T) => {
      if (!isControlled) setInternal(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );
  return [isControlled ? value : internal, setValue];
}
```

- [ ] **Step 4: Implement `src/platform/haptics.ts`**

```ts
/** Haptic feedback via expo-haptics. It's non-visual, so skipping it on web keeps UI parity. */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticKind = 'selection' | 'impact';

export function triggerHaptic(kind: HapticKind, enabled: boolean): void {
  if (!enabled || Platform.OS === 'web') return;
  const pending =
    kind === 'selection' ? Haptics.selectionAsync() : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  pending.catch(() => undefined);
}
```

- [ ] **Step 5: Implement `src/platform/styles.ts`**

```ts
/** Cross-platform style constants that remove per-OS rendering differences. */
import { Platform, type TextStyle, type ViewStyle } from 'react-native';

/** Android adds font padding and top-aligns text; this makes glyph boxes match iOS/web. */
export const TEXT_RESET: TextStyle =
  Platform.select<TextStyle>({
    android: { includeFontPadding: false, textAlignVertical: 'center' },
    default: {},
  }) ?? {};

/** One shadow definition for every platform (New Architecture boxShadow; never `elevation`). */
export const SHADOW: ViewStyle = { boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.18)' };
```

- [ ] **Step 6: Implement `src/platform/useWebWheel.ts`**

```ts
/**
 * Mouse-wheel/trackpad support on web (touch pan already works via RNGH).
 * On react-native-web the host View ref is the DOM element.
 */
import { useEffect, useRef, type RefObject } from 'react';
import { Platform, type View } from 'react-native';

export function useWebWheel(ref: RefObject<View | null>, onDelta: (deltaY: number) => void): void {
  const handlerRef = useRef(onDelta);
  handlerRef.current = onDelta;

  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    const node = ref.current as unknown as HTMLElement | null;
    if (!node || typeof node.addEventListener !== 'function') return undefined;
    const listener = (event: WheelEvent) => {
      event.preventDefault();
      handlerRef.current(event.deltaY);
    };
    node.addEventListener('wheel', listener, { passive: false });
    return () => node.removeEventListener('wheel', listener);
  }, [ref]);
}
```

- [ ] **Step 7: Implement `src/components/shared/Chevron.tsx`**

```tsx
/** Chevron drawn from two borders of a rotated square, so it's identical on every platform (no font glyphs). */
import { View } from 'react-native';
import { cn } from '../../theme/cn';

export type ChevronDirection = 'left' | 'right' | 'up' | 'down';

const ROTATION: Record<ChevronDirection, string> = {
  left: '45deg',
  right: '-135deg',
  up: '135deg',
  down: '-45deg',
};

export interface ChevronProps {
  direction: ChevronDirection;
  className?: string;
  testID?: string;
}

export function Chevron({ direction, className, testID }: ChevronProps) {
  return (
    <View
      testID={testID}
      pointerEvents="none"
      className={cn('h-2.5 w-2.5 border-b-2 border-l-2 border-foreground', className)}
      style={{ transform: [{ rotate: ROTATION[direction] }] }}
    />
  );
}
```

- [ ] **Step 8: Run to verify pass**

Run: `pnpm test -- src/hooks src/platform src/components/shared && pnpm typecheck`
Expected: PASS on ios/android; typecheck exits 0.

- [ ] **Step 9: Checkpoint (no commit)** — `git status --short`.

---

### Task 9a: Calendar building blocks

**Files:**
- Create: `src/components/Calendar/calendarVariants.ts`, `DayCell.tsx`, `MonthGrid.tsx`, `WeekdayRow.tsx`, `CalendarHeader.tsx`, `JumperGrid.tsx`, `SwipeableMonths.tsx` (all in `src/components/Calendar/`)
- Test: `src/components/Calendar/__tests__/DayCell.test.tsx`, `CalendarHeader.test.tsx`, `JumperGrid.test.tsx`, `SwipeableMonths.test.tsx`

**Interfaces:**
- Consumes: `DayCellModel`, `buildMonthGrid` (Task 3); `DaySelectionState`, `SelectionMatcher`, `resolveSwipe` (Task 4); `DayMatcher` (Task 3); `cn` (Task 2); `TEXT_RESET`, `triggerHaptic` (Task 8); `Chevron` (Task 8); types `CalendarClassNames`, `CalendarBaseProps`, `RenderDayInfo`, `WeekdayIndex` (Task 2).
- Produces:
  - `dayCellVariants`, `dayCircleVariants`, `dayTextVariants` (cva); `type DayVisualState = 'idle' | 'selected' | 'today' | 'disabled' | 'outside'`; `dayVisualState(p: { isDisabled: boolean; isSelected: boolean; isToday: boolean; inMonth: boolean }): DayVisualState`
  - `<DayCell cell selection isToday isDisabled showOutsideDays locale? classNames? renderDay? onPress(date, inMonth) testID? />`. testIDs: `${testID}` on the pressable and `${testID}-circle` on the inner circle.
  - `<MonthGrid month firstDayOfWeek showOutsideDays isDisabled selection todayKey locale? classNames? renderDay? onDayPress testID? />`. Day testIDs: `${testID}-day-${yyyy-MM-dd}`.
  - `<WeekdayRow labels classNames? testID />`. testIDs: `${testID}-weekday-${i}`.
  - `<CalendarHeader monthLabel yearLabel canGoPrev canGoNext onPrev onNext onMonthPress onYearPress labels classNames? testID />`. testIDs: `${testID}-prev`, `-next`, `-month-label`, `-year-label`.
  - `interface JumperItem { key: string; label: string; selected: boolean; disabled: boolean; onPress: () => void }`; `<JumperGrid items columns? classNames? testID? />`. Item testIDs: `${testID}-${item.key}`.
  - `<SwipeableMonths month canPrev canNext enabled onNavigate(dir) renderMonth(month, isCurrent) testID? />`

- [ ] **Step 1: Write the failing tests**

`src/components/Calendar/__tests__/DayCell.test.tsx`:
```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { dayKey } from '../../../core/dateUtils';
import type { DaySelectionState } from '../../../core/selection';
import { DayCell } from '../DayCell';

const NONE: DaySelectionState = { isSelected: false, isRangeStart: false, isRangeEnd: false, isInRange: false, rangePosition: 'none' };
const cell = (inMonth = true) => {
  const date = new Date(2026, 8, 15);
  return { date, key: dayKey(date), inMonth };
};
const base = { isToday: false, isDisabled: false, showOutsideDays: true, testID: 'd' };

describe('DayCell', () => {
  it('renders the day number and fires onPress with the date and month flag', async () => {
    const onPress = jest.fn();
    await render(<DayCell {...base} cell={cell()} selection={NONE} onPress={onPress} />);
    expect(screen.getByText('15')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('d'));
    expect(onPress).toHaveBeenCalledWith(cell().date, true);
  });

  it('applies selected styling plus the selectedDay slot', async () => {
    await render(
      <DayCell {...base} cell={cell()} selection={{ ...NONE, isSelected: true }} onPress={jest.fn()} classNames={{ selectedDay: 'bg-red-500' }} />,
    );
    expect(screen.getByTestId('d-circle').props.className).toContain('bg-red-500');
    expect(screen.getByTestId('d-circle').props.className).not.toContain('bg-primary');
    expect(screen.getByTestId('d').props.accessibilityState).toMatchObject({ selected: true });
  });

  it('does not fire when disabled', async () => {
    const onPress = jest.fn();
    await render(<DayCell {...base} isDisabled cell={cell()} selection={NONE} onPress={onPress} />);
    await fireEvent.press(screen.getByTestId('d'));
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByTestId('d').props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('renders an empty same-size placeholder for hidden outside days', async () => {
    await render(<DayCell {...base} showOutsideDays={false} cell={cell(false)} selection={NONE} onPress={jest.fn()} />);
    expect(screen.queryByText('15')).toBeNull();
  });

  it('draws the range band and lets classNames override the cell size', async () => {
    await render(
      <DayCell {...base} cell={cell()} selection={{ ...NONE, isInRange: true, rangePosition: 'middle' }} onPress={jest.fn()} classNames={{ dayCell: 'h-12' }} />,
    );
    const cls = screen.getByTestId('d').props.className as string;
    expect(cls).toContain('bg-accent');
    expect(cls).toContain('h-12');
    expect(cls).not.toContain('h-10');
  });

  it('delegates to renderDay', async () => {
    const onPress = jest.fn();
    await render(
      <DayCell
        {...base}
        isToday
        cell={cell()}
        selection={NONE}
        onPress={onPress}
        renderDay={(info) => <Text onPress={info.onPress}>{`custom-${info.label}-${String(info.isToday)}`}</Text>}
      />,
    );
    await fireEvent.press(screen.getByText('custom-15-true'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

`src/components/Calendar/__tests__/CalendarHeader.test.tsx`:
```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';
import { CalendarHeader } from '../CalendarHeader';

const handlers = () => ({ onPrev: jest.fn(), onNext: jest.fn(), onMonthPress: jest.fn(), onYearPress: jest.fn() });

describe('CalendarHeader', () => {
  it('shows labels and wires every button', async () => {
    const h = handlers();
    await render(
      <CalendarHeader {...h} monthLabel="September" yearLabel="2026" canGoPrev canGoNext labels={{ previous: 'Prev', next: 'Next' }} testID="cal" />,
    );
    await fireEvent.press(screen.getByTestId('cal-prev'));
    await fireEvent.press(screen.getByTestId('cal-next'));
    await fireEvent.press(screen.getByText('September'));
    await fireEvent.press(screen.getByText('2026'));
    expect([h.onPrev, h.onNext, h.onMonthPress, h.onYearPress].map((f) => f.mock.calls.length)).toEqual([1, 1, 1, 1]);
    expect(screen.getByTestId('cal-prev').props.accessibilityLabel).toBe('Prev');
  });

  it('disables blocked directions', async () => {
    const h = handlers();
    await render(
      <CalendarHeader {...h} monthLabel="September" yearLabel="2026" canGoPrev={false} canGoNext labels={{ previous: 'Prev', next: 'Next' }} testID="cal" />,
    );
    await fireEvent.press(screen.getByTestId('cal-prev'));
    expect(h.onPrev).not.toHaveBeenCalled();
  });
});
```

`src/components/Calendar/__tests__/JumperGrid.test.tsx`:
```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';
import { JumperGrid, type JumperItem } from '../JumperGrid';

const items = (onPress: jest.Mock): JumperItem[] =>
  Array.from({ length: 12 }, (_, i) => ({ key: `m-${i}`, label: `M${i}`, selected: i === 2, disabled: i === 5, onPress: () => onPress(i) }));

describe('JumperGrid', () => {
  it('lays out 12 items as 4 rows of 3 and marks the selected one', async () => {
    await render(<JumperGrid items={items(jest.fn())} testID="j" />);
    expect(screen.getByTestId('j-row-3')).toBeTruthy();
    expect(screen.queryByTestId('j-row-4')).toBeNull();
    expect(screen.getByTestId('j-m-2').props.className).toContain('bg-primary');
  });

  it('fires enabled items only', async () => {
    const onPress = jest.fn();
    await render(<JumperGrid items={items(onPress)} testID="j" />);
    await fireEvent.press(screen.getByTestId('j-m-1'));
    await fireEvent.press(screen.getByTestId('j-m-5'));
    expect(onPress.mock.calls).toEqual([[1]]);
  });
});
```

`src/components/Calendar/__tests__/SwipeableMonths.test.tsx`:
```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { monthKey } from '../../../core/dateUtils';
import { SwipeableMonths } from '../SwipeableMonths';

const renderMonth = (m: Date, isCurrent: boolean) => <Text>{`${monthKey(m)}${isCurrent ? '*' : ''}`}</Text>;

describe('SwipeableMonths', () => {
  it('renders only the current month until width is known', async () => {
    await render(
      <SwipeableMonths month={new Date(2026, 8, 1)} canPrev canNext enabled onNavigate={jest.fn()} renderMonth={renderMonth} testID="s" />,
    );
    expect(screen.getByText('2026-09*')).toBeTruthy();
    expect(screen.queryByText('2026-08')).toBeNull();
  });

  it('renders prev/current/next pages after layout', async () => {
    await render(
      <SwipeableMonths month={new Date(2026, 8, 1)} canPrev canNext enabled onNavigate={jest.fn()} renderMonth={renderMonth} testID="s" />,
    );
    await fireEvent(screen.getByTestId('s'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 280 } } });
    // Side pages are aria-hidden, so opt in to hidden elements explicitly.
    expect(screen.getByText('2026-08', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByText('2026-09*')).toBeTruthy();
    expect(screen.getByText('2026-10', { includeHiddenElements: true })).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test:ios -- src/components/Calendar`
Expected: FAIL "Cannot find module".

- [ ] **Step 3: Implement `src/components/Calendar/calendarVariants.ts`**

```ts
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
```

- [ ] **Step 4: Implement `src/components/Calendar/DayCell.tsx`**

```tsx
/** One day in the grid: range band (outer), selection circle (inner), label. */
import { format, type Locale } from 'date-fns';
import { Pressable, Text, View } from 'react-native';
import type { DayCellModel } from '../../core/monthGrid';
import type { DaySelectionState } from '../../core/selection';
import { TEXT_RESET } from '../../platform/styles';
import { cn } from '../../theme/cn';
import type { CalendarBaseProps, CalendarClassNames } from '../../types';
import { dayCellVariants, dayCircleVariants, dayTextVariants, dayVisualState } from './calendarVariants';

export interface DayCellProps {
  cell: DayCellModel;
  selection: DaySelectionState;
  isToday: boolean;
  isDisabled: boolean;
  showOutsideDays: boolean;
  locale?: Locale;
  classNames?: CalendarClassNames;
  renderDay?: CalendarBaseProps['renderDay'];
  onPress: (date: Date, inMonth: boolean) => void;
  testID?: string;
}

export function DayCell({
  cell,
  selection,
  isToday,
  isDisabled,
  showOutsideDays,
  locale,
  classNames,
  renderDay,
  onPress,
  testID,
}: DayCellProps) {
  const { rangePosition } = selection;
  const cellClass = cn(
    dayCellVariants({ range: rangePosition }),
    classNames?.dayCell,
    rangePosition === 'start' && classNames?.rangeStart,
    rangePosition === 'middle' && classNames?.rangeMiddle,
    rangePosition === 'end' && classNames?.rangeEnd,
    !cell.inMonth && classNames?.outsideDay,
  );

  if (!cell.inMonth && !showOutsideDays) return <View className={cellClass} />;

  const label = format(cell.date, 'd', { locale });
  const press = () => onPress(cell.date, cell.inMonth);

  if (renderDay) {
    return (
      <View className={cellClass} testID={testID}>
        {renderDay({
          date: cell.date,
          label,
          isSelected: selection.isSelected,
          isToday,
          isDisabled,
          isOutside: !cell.inMonth,
          isRangeStart: selection.isRangeStart,
          isRangeEnd: selection.isRangeEnd,
          isInRange: selection.isInRange,
          onPress: press,
        })}
      </View>
    );
  }

  const visual = dayVisualState({ isDisabled, isSelected: selection.isSelected, isToday, inMonth: cell.inMonth });
  const isMiddle = rangePosition === 'middle';

  return (
    <Pressable
      onPress={press}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={format(cell.date, 'PPPP', { locale })}
      accessibilityState={{ selected: selection.isSelected, disabled: isDisabled }}
      className={cellClass}
      testID={testID}
    >
      <View
        testID={testID ? `${testID}-circle` : undefined}
        className={cn(
          dayCircleVariants({ state: visual }),
          visual === 'selected' && classNames?.selectedDay,
          visual === 'today' && classNames?.todayIndicator,
          visual === 'disabled' && classNames?.disabledDay,
        )}
      >
        <Text
          style={TEXT_RESET}
          className={cn(
            dayTextVariants({ state: visual }),
            isMiddle && visual === 'idle' && 'text-accent-foreground',
            classNames?.dayText,
            visual === 'selected' && classNames?.selectedDayText,
            visual === 'today' && classNames?.todayText,
            visual === 'disabled' && classNames?.disabledDayText,
            visual === 'outside' && classNames?.outsideDayText,
            isMiddle && classNames?.rangeMiddleText,
          )}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
```

- [ ] **Step 5: Implement `src/components/Calendar/MonthGrid.tsx`**

```tsx
/** Renders one month page (always 6 weeks). */
import type { Locale } from 'date-fns';
import { useMemo } from 'react';
import { View } from 'react-native';
import type { DayMatcher } from '../../core/dateUtils';
import { buildMonthGrid } from '../../core/monthGrid';
import type { SelectionMatcher } from '../../core/selection';
import { cn } from '../../theme/cn';
import type { CalendarBaseProps, CalendarClassNames, WeekdayIndex } from '../../types';
import { DayCell } from './DayCell';

export interface MonthGridProps {
  month: Date;
  firstDayOfWeek: WeekdayIndex;
  showOutsideDays: boolean;
  isDisabled: DayMatcher;
  selection: SelectionMatcher;
  todayKey: string;
  locale?: Locale;
  classNames?: CalendarClassNames;
  renderDay?: CalendarBaseProps['renderDay'];
  onDayPress: (date: Date, inMonth: boolean) => void;
  /** Only the visible page gets testIDs, so ids stay unique across the 3 swipe pages. */
  testID?: string;
}

export function MonthGrid({
  month,
  firstDayOfWeek,
  showOutsideDays,
  isDisabled,
  selection,
  todayKey,
  locale,
  classNames,
  renderDay,
  onDayPress,
  testID,
}: MonthGridProps) {
  const monthTime = month.getTime();
  // Keyed by the instant (not Date identity, which changes every render).
  const weeks = useMemo(() => buildMonthGrid(month, firstDayOfWeek), [monthTime, firstDayOfWeek]);
  return (
    <View className={cn('gap-1', classNames?.grid)}>
      {weeks.map((week, index) => (
        <View key={week[0]?.key ?? index} className={cn('flex-row', classNames?.week)}>
          {week.map((cell) => (
            <DayCell
              key={cell.key}
              cell={cell}
              selection={selection(cell.date)}
              isToday={cell.key === todayKey}
              isDisabled={isDisabled(cell.date)}
              showOutsideDays={showOutsideDays}
              locale={locale}
              classNames={classNames}
              renderDay={renderDay}
              onPress={onDayPress}
              testID={testID ? `${testID}-day-${cell.key}` : undefined}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
```

- [ ] **Step 6: Implement `src/components/Calendar/WeekdayRow.tsx`**

```tsx
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
```

- [ ] **Step 7: Implement `src/components/Calendar/CalendarHeader.tsx`**

```tsx
/** Month/year title (tappable → jumper views) with prev/next chevrons. */
import { Pressable, Text, View } from 'react-native';
import { TEXT_RESET } from '../../platform/styles';
import { cn } from '../../theme/cn';
import type { CalendarClassNames, CalendarLabels } from '../../types';
import { Chevron, type ChevronDirection } from '../shared/Chevron';

export interface CalendarHeaderProps {
  monthLabel: string;
  yearLabel: string;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onMonthPress: () => void;
  onYearPress: () => void;
  labels: CalendarLabels;
  classNames?: CalendarClassNames;
  testID: string;
}

interface NavButtonProps {
  direction: ChevronDirection;
  disabled: boolean;
  onPress: () => void;
  label: string;
  classNames?: CalendarClassNames;
  testID: string;
}

function NavButton({ direction, disabled, onPress, label, classNames, testID }: NavButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      testID={testID}
      className={cn('h-9 w-9 items-center justify-center rounded-full select-none', disabled && 'opacity-30', classNames?.headerButton)}
    >
      <Chevron direction={direction} className={classNames?.chevron} />
    </Pressable>
  );
}

function TitleButton({ text, onPress, classNames, testID }: { text: string; onPress: () => void; classNames?: CalendarClassNames; testID: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      testID={testID}
      className={cn('rounded-md px-2 py-1 select-none', classNames?.headerTitle)}
    >
      <Text style={TEXT_RESET} className={cn('text-base font-semibold text-foreground', classNames?.headerTitleText)}>
        {text}
      </Text>
    </Pressable>
  );
}

export function CalendarHeader({
  monthLabel,
  yearLabel,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  onMonthPress,
  onYearPress,
  labels,
  classNames,
  testID,
}: CalendarHeaderProps) {
  return (
    <View className={cn('h-12 flex-row items-center justify-between px-1', classNames?.header)}>
      <NavButton direction="left" disabled={!canGoPrev} onPress={onPrev} label={labels.previous} classNames={classNames} testID={`${testID}-prev`} />
      <View className="flex-row items-center">
        <TitleButton text={monthLabel} onPress={onMonthPress} classNames={classNames} testID={`${testID}-month-label`} />
        <TitleButton text={yearLabel} onPress={onYearPress} classNames={classNames} testID={`${testID}-year-label`} />
      </View>
      <NavButton direction="right" disabled={!canGoNext} onPress={onNext} label={labels.next} classNames={classNames} testID={`${testID}-next`} />
    </View>
  );
}
```

- [ ] **Step 8: Implement `src/components/Calendar/JumperGrid.tsx`**

```tsx
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
```

- [ ] **Step 9: Implement `src/components/Calendar/SwipeableMonths.tsx`**

```tsx
/**
 * Horizontal month pager: prev | current | next laid out in a row that is
 * 3 pages wide and moved with a custom pan (no platform pager, so it behaves the same everywhere).
 */
import { addMonths } from 'date-fns';
import { useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { resolveSwipe } from '../../core/navigation';

const PAGE_DURATION_MS = 220;
const RUBBER_BAND = 0.2;
const SNAP_BACK = { damping: 22, stiffness: 240, mass: 1 } as const;

export interface SwipeableMonthsProps {
  month: Date;
  canPrev: boolean;
  canNext: boolean;
  enabled: boolean;
  onNavigate: (direction: -1 | 1) => void;
  renderMonth: (month: Date, isCurrent: boolean) => ReactNode;
  testID?: string;
}

export function SwipeableMonths({ month, canPrev, canNext, enabled, onNavigate, renderMonth, testID }: SwipeableMonthsProps) {
  const [width, setWidth] = useState(0);
  const translateX = useSharedValue(0);
  const monthTime = month.getTime();

  // New month content is on screen, so recentre before paint.
  useLayoutEffect(() => {
    translateX.value = 0;
  }, [monthTime, translateX]);

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(enabled && width > 0)
        .activeOffsetX([-12, 12])
        .failOffsetY([-12, 12])
        .onUpdate((e) => {
          const blocked = (e.translationX > 0 && !canPrev) || (e.translationX < 0 && !canNext);
          translateX.value = blocked ? e.translationX * RUBBER_BAND : e.translationX;
        })
        .onEnd((e) => {
          const direction = resolveSwipe(e.translationX, e.velocityX, width, canPrev, canNext);
          if (direction === 0) {
            translateX.value = withSpring(0, SNAP_BACK);
            return;
          }
          translateX.value = withTiming(-direction * width, { duration: PAGE_DURATION_MS }, (finished) => {
            if (finished) scheduleOnRN(onNavigate, direction);
          });
        }),
    [enabled, width, canPrev, canNext, onNavigate, translateX],
  );

  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value - width }] }));

  if (width === 0) {
    return (
      <View onLayout={onLayout} testID={testID}>
        {renderMonth(month, true)}
      </View>
    );
  }

  return (
    <View onLayout={onLayout} className="overflow-hidden" testID={testID}>
      <GestureDetector gesture={gesture}>
        <Animated.View style={[{ flexDirection: 'row', width: width * 3 }, rowStyle]}>
          <View style={{ width }} aria-hidden>
            {renderMonth(addMonths(month, -1), false)}
          </View>
          <View style={{ width }}>{renderMonth(month, true)}</View>
          <View style={{ width }} aria-hidden>
            {renderMonth(addMonths(month, 1), false)}
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
```

- [ ] **Step 10: Run to verify pass**

Run: `pnpm test -- src/components/Calendar && pnpm typecheck`
Expected: PASS on ios/android; typecheck exits 0.

- [ ] **Step 11: Checkpoint (no commit)** — `git status --short`.

---

### Task 9b: Calendar state hook + `<Calendar />`

**Files:**
- Create: `src/components/Calendar/useCalendarState.ts`, `src/components/Calendar/Calendar.tsx`
- Test: `src/components/Calendar/__tests__/Calendar.test.tsx`

**Interfaces:**
- Consumes: everything from Tasks 3, 4, 7, 8 and 9a.
- Produces:
  - `YEARS_PER_PAGE = 12`
  - `useCalendarState(props: CalendarProps): CalendarState`, where `CalendarState = { mode; value: SelectionValue; month: Date; view: CalendarView; setView(v); yearPageStart: number; constraints: DateConstraints; isDisabled: DayMatcher; selection: SelectionMatcher; todayKey: string; nav: { canPrev; canNext; prev(); next() }; swipe: { canPrev; canNext; navigate(dir: -1 | 1) }; selectDay(date, inMonth); selectMonth(index); selectYear(year); openView('months' | 'years') }`
  - `<Calendar {...CalendarProps} />`. Default `testID = 'calendar'`. Jumper testIDs: `calendar-month-${0..11}`, `calendar-year-${yyyy}`.

- [ ] **Step 1: Write the failing test** `src/components/Calendar/__tests__/Calendar.test.tsx`

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { dayKey } from '../../../core/dateUtils';
import type { DateRange } from '../../../types';
import { Calendar } from '../Calendar';

const SEP = new Date(2026, 8, 1);
const day = (key: string) => screen.getByTestId(`calendar-day-${key}`);
const lastArg = <T,>(fn: jest.Mock): T => fn.mock.calls.at(-1)?.[0] as T;

describe('<Calendar />', () => {
  it('renders the header for defaultMonth', async () => {
    await render(<Calendar defaultMonth={SEP} />);
    expect(screen.getByText('September')).toBeTruthy();
    expect(screen.getByText('2026')).toBeTruthy();
  });

  it('opens on the minDate month when today is outside the range (review focus)', async () => {
    await render(<Calendar minDate={new Date(2099, 2, 10)} />);
    expect(screen.getByText('March')).toBeTruthy();
    expect(screen.getByText('2099')).toBeTruthy();
  });

  it('single: selects a day (uncontrolled)', async () => {
    const onChange = jest.fn();
    await render(<Calendar defaultMonth={SEP} onChange={onChange} />);
    await fireEvent.press(day('2026-09-15'));
    expect(dayKey(lastArg<Date>(onChange))).toBe('2026-09-15');
    expect(day('2026-09-15').props.accessibilityState).toMatchObject({ selected: true });
  });

  it('multiple: toggles days', async () => {
    const onChange = jest.fn();
    await render(<Calendar mode="multiple" defaultMonth={SEP} onChange={onChange} />);
    await fireEvent.press(day('2026-09-03'));
    await fireEvent.press(day('2026-09-05'));
    await fireEvent.press(day('2026-09-03'));
    expect(lastArg<Date[]>(onChange).map((d) => dayKey(d))).toEqual(['2026-09-05']);
  });

  it('range: selects start and end and paints the band', async () => {
    const onChange = jest.fn();
    await render(<Calendar mode="range" defaultMonth={SEP} onChange={onChange} />);
    await fireEvent.press(day('2026-09-10'));
    await fireEvent.press(day('2026-09-14'));
    const range = lastArg<DateRange>(onChange);
    expect([range.start && dayKey(range.start), range.end && dayKey(range.end)]).toEqual(['2026-09-10', '2026-09-14']);
    expect(day('2026-09-12').props.className).toContain('bg-accent');
  });

  it('respects minDate / disabledDates', async () => {
    const onChange = jest.fn();
    await render(
      <Calendar defaultMonth={SEP} minDate={new Date(2026, 8, 10)} disabledDates={[new Date(2026, 8, 20)]} onChange={onChange} />,
    );
    await fireEvent.press(day('2026-09-05'));
    await fireEvent.press(day('2026-09-20'));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByTestId('calendar-prev').props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('navigates with header buttons and reports onMonthChange', async () => {
    const onMonthChange = jest.fn();
    await render(<Calendar defaultMonth={SEP} onMonthChange={onMonthChange} />);
    await fireEvent.press(screen.getByTestId('calendar-next'));
    expect(screen.getByText('October')).toBeTruthy();
    expect(dayKey(lastArg<Date>(onMonthChange))).toBe('2026-10-01');
  });

  it('pressing an outside day selects it and moves to its month', async () => {
    const onChange = jest.fn();
    await render(<Calendar defaultMonth={SEP} onChange={onChange} />);
    await fireEvent.press(day('2026-10-01'));
    expect(dayKey(lastArg<Date>(onChange))).toBe('2026-10-01');
    expect(screen.getByText('October')).toBeTruthy();
  });

  it('month jumper', async () => {
    await render(<Calendar defaultMonth={SEP} />);
    await fireEvent.press(screen.getByTestId('calendar-month-label'));
    await fireEvent.press(screen.getByTestId('calendar-month-11'));
    expect(screen.getByText('December')).toBeTruthy();
    expect(screen.getByTestId('calendar-day-2026-12-25')).toBeTruthy();
  });

  it('year jumper leads into the month jumper', async () => {
    await render(<Calendar defaultMonth={SEP} maxDate={new Date(2031, 0, 1)} />);
    await fireEvent.press(screen.getByTestId('calendar-year-label'));
    // 2026 sits on the 2016–2027 page; move to 2028–2039.
    expect(screen.getByTestId('calendar-year-2016')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('calendar-next'));
    expect(screen.getByTestId('calendar-year-2032').props.accessibilityState).toMatchObject({ disabled: true });
    await fireEvent.press(screen.getByTestId('calendar-year-2030'));
    expect(screen.getByTestId('calendar-month-0')).toBeTruthy();
    expect(screen.getByText('2030')).toBeTruthy();
  });

  it('firstDayOfWeek, hideHeader and hideWeekdays', async () => {
    const { rerender } = await render(<Calendar defaultMonth={SEP} firstDayOfWeek={1} />);
    expect(screen.getByTestId('calendar-weekday-0')).toHaveTextContent('Mo');
    await rerender(<Calendar defaultMonth={SEP} hideHeader hideWeekdays />);
    expect(screen.queryByTestId('calendar-prev')).toBeNull();
    expect(screen.queryByTestId('calendar-weekday-0')).toBeNull();
  });

  it('merges classNames slots and supports render overrides', async () => {
    const onChange = jest.fn();
    await render(
      <Calendar
        defaultMonth={SEP}
        onChange={onChange}
        classNames={{ dayCell: 'h-12', container: 'bg-red-500' }}
        renderHeader={({ monthLabel, goNext }) => <Text onPress={goNext}>{`H:${monthLabel}`}</Text>}
        renderFooter={({ month }) => <Text>{`F:${dayKey(month)}`}</Text>}
      />,
    );
    expect(day('2026-09-15').props.className).toContain('h-12');
    expect(screen.getByTestId('calendar').props.className).toContain('bg-red-500');
    await fireEvent.press(screen.getByText('H:September'));
    expect(screen.getByText('F:2026-10-01')).toBeTruthy();
  });

  it('themeOverride injects variables on the root', async () => {
    await render(<Calendar defaultMonth={SEP} themeOverride="dark" />);
    expect(screen.getByTestId('calendar').props.style).toHaveProperty('__vars');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test:ios -- src/components/Calendar/__tests__/Calendar.test.tsx`
Expected: FAIL "Cannot find module '../Calendar'".

- [ ] **Step 3: Implement `src/components/Calendar/useCalendarState.ts`**

```ts
/** All Calendar state and transitions; the component itself only renders. */
import { addMonths, addYears, getYear, setMonth as setMonthIndex, setYear } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';
import { createDisabledMatcher, dayKey, now, type DayMatcher } from '../../core/dateUtils';
import { canNavigate, clampToMonth, getInitialMonth, isYearOutOfRange } from '../../core/navigation';
import {
  anchorDate,
  applySelection,
  createSelectionMatcher,
  emptySelection,
  type SelectionMatcher,
} from '../../core/selection';
import { useControllableState } from '../../hooks/useControllableState';
import { triggerHaptic } from '../../platform/haptics';
import type { CalendarProps, CalendarView, DateConstraints, SelectionMode, SelectionValue } from '../../types';

export const YEARS_PER_PAGE = 12;
const pageStartFor = (year: number): number => Math.floor(year / YEARS_PER_PAGE) * YEARS_PER_PAGE;

export interface HeaderNav {
  readonly canPrev: boolean;
  readonly canNext: boolean;
  readonly prev: () => void;
  readonly next: () => void;
}

export interface CalendarState {
  readonly mode: SelectionMode;
  readonly value: SelectionValue;
  readonly month: Date;
  readonly view: CalendarView;
  readonly setView: (view: CalendarView) => void;
  readonly yearPageStart: number;
  readonly constraints: DateConstraints;
  readonly isDisabled: DayMatcher;
  readonly selection: SelectionMatcher;
  readonly todayKey: string;
  readonly nav: HeaderNav;
  readonly swipe: { canPrev: boolean; canNext: boolean; navigate: (direction: -1 | 1) => void };
  readonly selectDay: (date: Date, inMonth: boolean) => void;
  readonly selectMonth: (index: number) => void;
  readonly selectYear: (year: number) => void;
  readonly openView: (view: 'months' | 'years') => void;
}

export function useCalendarState(props: CalendarProps): CalendarState {
  const { minDate, maxDate, disabledDates, timeZone, hapticFeedback = true } = props;
  const mode: SelectionMode = props.mode ?? 'single';

  const constraints = useMemo<DateConstraints>(
    () => ({ minDate, maxDate, disabledDates, timeZone }),
    [minDate, maxDate, disabledDates, timeZone],
  );

  const [value, setValue] = useControllableState<SelectionValue>({
    value: props.value,
    defaultValue: props.defaultValue ?? emptySelection(mode),
    onChange: props.onChange as ((next: SelectionValue) => void) | undefined,
  });

  const [initialMonth] = useState(() => getInitialMonth(anchorDate(mode, value), constraints, now(timeZone)));
  const [month, setMonth] = useControllableState<Date>({
    value: props.month ? clampToMonth(props.month, { timeZone }) : undefined,
    defaultValue: props.defaultMonth ? clampToMonth(props.defaultMonth, constraints) : initialMonth,
    onChange: props.onMonthChange,
  });

  const [view, setView] = useState<CalendarView>('days');
  const [yearPageStart, setYearPageStart] = useState(() => pageStartFor(getYear(month)));

  const isDisabled = useMemo(() => createDisabledMatcher(constraints), [constraints]);
  const selection = useMemo(() => createSelectionMatcher(mode, value, timeZone), [mode, value, timeZone]);
  const todayKey = dayKey(now(timeZone), timeZone);
  const year = getYear(month);

  const navigate = useCallback(
    (direction: -1 | 1) => {
      triggerHaptic('selection', hapticFeedback);
      setMonth(addMonths(month, direction));
    },
    [month, setMonth, hapticFeedback],
  );

  const canPrevMonth = canNavigate(month, -1, constraints);
  const canNextMonth = canNavigate(month, 1, constraints);

  const nav: HeaderNav =
    view === 'days'
      ? { canPrev: canPrevMonth, canNext: canNextMonth, prev: () => navigate(-1), next: () => navigate(1) }
      : view === 'months'
        ? {
            canPrev: !isYearOutOfRange(year - 1, constraints),
            canNext: !isYearOutOfRange(year + 1, constraints),
            prev: () => setMonth(clampToMonth(addYears(month, -1), constraints)),
            next: () => setMonth(clampToMonth(addYears(month, 1), constraints)),
          }
        : {
            canPrev: !isYearOutOfRange(yearPageStart - 1, constraints),
            canNext: !isYearOutOfRange(yearPageStart + YEARS_PER_PAGE, constraints),
            prev: () => setYearPageStart((start) => start - YEARS_PER_PAGE),
            next: () => setYearPageStart((start) => start + YEARS_PER_PAGE),
          };

  const selectDay = useCallback(
    (date: Date, inMonth: boolean) => {
      if (isDisabled(date)) return;
      triggerHaptic('selection', hapticFeedback);
      setValue(applySelection(mode, value, date, timeZone));
      if (!inMonth) setMonth(clampToMonth(date, constraints));
    },
    [isDisabled, hapticFeedback, setValue, mode, value, timeZone, setMonth, constraints],
  );

  const selectMonth = (index: number) => {
    setMonth(clampToMonth(setMonthIndex(month, index), constraints));
    setView('days');
  };

  const selectYear = (nextYear: number) => {
    setMonth(clampToMonth(setYear(month, nextYear), constraints));
    setView('months');
  };

  const openView = (target: 'months' | 'years') => {
    if (target === 'years') setYearPageStart(pageStartFor(year));
    setView((current) => (current === target ? 'days' : target));
  };

  return {
    mode,
    value,
    month,
    view,
    setView,
    yearPageStart,
    constraints,
    isDisabled,
    selection,
    todayKey,
    nav,
    swipe: { canPrev: canPrevMonth, canNext: canNextMonth, navigate },
    selectDay,
    selectMonth,
    selectYear,
    openView,
  };
}
```

- [ ] **Step 4: Implement `src/components/Calendar/Calendar.tsx`**

```tsx
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
          <JumperGrid items={jumperItems} classNames={classNames} testID={testID} />
        </View>
      )}

      {renderFooter && <View className={classNames?.footer}>{renderFooter({ month: state.month, value: state.value })}</View>}
    </View>
  );
}
```

- [ ] **Step 5: Run to verify pass**

Run: `pnpm test -- src/components/Calendar && pnpm typecheck`
Expected: PASS on ios/android; typecheck exits 0.

- [ ] **Step 6: Checkpoint (no commit)** — `git status --short`.

---

### Task 10: Custom wheel (no ScrollView)

**Files:**
- Create: `src/components/TimePicker/Wheel.tsx`
- Test: `src/components/TimePicker/__tests__/Wheel.test.tsx`

**Interfaces:**
- Consumes: `shouldLoop`, `offsetForIndex`, `indexForOffset`, `snapTargetOffset`, `nearestLoopOffset`, `itemDistance`, `applyOverscroll`, `mod` (Task 6); `triggerHaptic`, `TEXT_RESET`, `useWebWheel` (Task 8); `cn` (Task 2); `TimePickerClassNames` (Task 2).
- Produces:
  - `interface WheelOption { key: string; label: string }`
  - `<Wheel items selectedIndex onChange(index) itemHeight visibleCount hapticFeedback accessibilityLabel classNames? testID? />`. The component with `testID` is the adjustable accessibility element: `accessibilityValue.text` is the selected label, and it responds to `increment`/`decrement` actions. The wheel draws **no** highlight band; the parent draws one band behind every wheel so the band is continuous.
  - `WHEEL_SPRING` (spring config), `WEB_WHEEL_STEP_PX = 40`.

**Physics:** a single `Gesture.Pan` drives the `offset` shared value (`offset = -index * itemHeight`).
- `onBegin`: cancel the running animation and record the start offset.
- `onUpdate`: `start + translationY`; rubber-band past the ends when not looping.
- `onFinalize(e, success)`: if the pan never activated and moved less than `TAP_SLOP`, it was a tap, so move the tapped row to the centre. Otherwise snap to `snapTargetOffset(offset, velocityY)`. Spring there, then `scheduleOnRN(commit, index)`.

Using one gesture (no `Tap` racing a `Pan`) avoids handlers finishing in a different order on different platforms.

- [ ] **Step 1: Write the failing test** `src/components/TimePicker/__tests__/Wheel.test.tsx`

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Wheel, type WheelOption } from '../Wheel';

const options = (n: number): WheelOption[] =>
  Array.from({ length: n }, (_, i) => ({ key: String(i), label: String(i).padStart(2, '0') }));

const action = (actionName: 'increment' | 'decrement') => ({ nativeEvent: { actionName } });

const setup = async (count: number, selectedIndex: number, onChange = jest.fn()) => {
  const utils = await render(
    <Wheel
      items={options(count)}
      selectedIndex={selectedIndex}
      onChange={onChange}
      itemHeight={44}
      visibleCount={5}
      hapticFeedback={false}
      accessibilityLabel="Minutes"
      testID="w"
    />,
  );
  return { ...utils, onChange };
};

describe('<Wheel />', () => {
  it('exposes an adjustable element with the selected label', async () => {
    await setup(60, 7);
    const wheel = screen.getByTestId('w');
    expect(wheel.props.accessibilityRole).toBe('adjustable');
    expect(wheel.props.accessibilityValue).toEqual({ text: '07' });
    expect(wheel.props.accessibilityLabel).toBe('Minutes');
  });

  it('renders every option (looping wheels keep all rows mounted)', async () => {
    await setup(12, 0);
    expect(screen.getByText('00')).toBeTruthy();
    expect(screen.getByText('11')).toBeTruthy();
  });

  it('wraps forward past the last item when looping (review focus)', async () => {
    const { onChange } = await setup(12, 11);
    await fireEvent(screen.getByTestId('w'), 'accessibilityAction', action('increment'));
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it('wraps backward past the first item when looping', async () => {
    const { onChange } = await setup(12, 0);
    await fireEvent(screen.getByTestId('w'), 'accessibilityAction', action('decrement'));
    expect(onChange).toHaveBeenLastCalledWith(11);
  });

  it('clamps when there are too few items to loop', async () => {
    const { onChange } = await setup(2, 1);
    await fireEvent(screen.getByTestId('w'), 'accessibilityAction', action('increment'));
    expect(onChange).not.toHaveBeenCalled();
    await fireEvent(screen.getByTestId('w'), 'accessibilityAction', action('decrement'));
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it('follows controlled selectedIndex changes (59 → 0, then +1 = 1)', async () => {
    const onChange = jest.fn();
    const { rerender } = await setup(60, 59, onChange);
    await rerender(
      <Wheel
        items={options(60)}
        selectedIndex={0}
        onChange={onChange}
        itemHeight={44}
        visibleCount={5}
        hapticFeedback={false}
        accessibilityLabel="Minutes"
        testID="w"
      />,
    );
    expect(screen.getByTestId('w').props.accessibilityValue).toEqual({ text: '00' });
    await fireEvent(screen.getByTestId('w'), 'accessibilityAction', action('increment'));
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it('sizes the viewport to visibleCount rows', async () => {
    await setup(60, 0);
    expect(screen.getByTestId('w-viewport').props.style).toEqual(expect.objectContaining({ height: 220 }));
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test:ios -- src/components/TimePicker/__tests__/Wheel.test.tsx`
Expected: FAIL "Cannot find module '../Wheel'".

- [ ] **Step 3: Implement `src/components/TimePicker/Wheel.tsx`**

```tsx
/**
 * Infinite / clamped picker wheel built from a pan gesture and a shared value,
 * with its own snap physics (core/wheelMath) so it feels the same on every platform.
 */
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Text, View, type AccessibilityActionEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
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
          const tapped = !success && Math.abs(e.translationY) < TAP_SLOP;
          const rowFromCentre = Math.floor(e.y / itemHeight) - (visibleCount - 1) / 2;
          const base = tapped ? offset.value - rowFromCentre * itemHeight : offset.value;
          const target = snapTargetOffset(base, tapped ? 0 : e.velocityY, itemHeight, count, loop);
          const index = indexForOffset(target, itemHeight, count, loop);
          offset.value = withSpring(target, WHEEL_SPRING, (finished) => {
            if (finished) scheduleOnRN(commit, index);
          });
        }),
    [offset, start, loop, minOffset, itemHeight, visibleCount, count, commit],
  );

  const onAccessibilityAction = (event: AccessibilityActionEvent) => {
    if (event.nativeEvent.actionName === 'increment') stepBy(1);
    if (event.nativeEvent.actionName === 'decrement') stepBy(-1);
  };

  return (
    <View
      ref={containerRef}
      testID={testID}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: items[selectedIndex]?.label ?? '' }}
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
```

- [ ] **Step 4: Run to verify pass**

Run: `pnpm test -- src/components/TimePicker/__tests__/Wheel.test.tsx && pnpm typecheck`
Expected: PASS on ios/android; typecheck exits 0.

A note on the controlled-sync test: `accessibilityValue` comes from the `selectedIndex` prop, and the `increment` result proves that `committed` was re-synced to `0`. The shortest-path maths itself is pinned in `wheelMath.test.ts`.

- [ ] **Step 5: Checkpoint (no commit)** — `git status --short`.

---

### Task 11: `<TimePicker />` (wheel + inline variants)

**Files:**
- Create: `src/hooks/useDateValue.ts`, `src/components/TimePicker/InlineTime.tsx`, `src/components/TimePicker/TimePicker.tsx`
- Test: `src/hooks/__tests__/useDateValue.test.tsx`, `src/components/TimePicker/__tests__/TimePicker.test.tsx`

**Interfaces:**
- Consumes: `useControllableState` (Task 8); `HOURS_12`, `HOURS_24`, `buildMinuteOptions`, `pad2`, `periodLabels`, `timeToIndices`, `indicesToTime`, `WheelIndices` (Task 5); `defaultTime` (Task 5); `toZoned` (Task 3); `Wheel`, `WheelOption` (Task 10); `useDatePickerTheme` (Task 7); `TEXT_RESET`, `triggerHaptic` (Task 8).
- Produces:
  - `useDateValue({ value?, defaultValue?, onChange? }): [Date | null, (next: Date) => void]`. `undefined` means uncontrolled; `null` means controlled and empty. Tasks 12 and 13 reuse this.
  - `hourOptions(format): WheelOption[]`, `minuteOptions(step): WheelOption[]` (exported from `TimePicker.tsx`).
  - `<InlineTime indices hourFormat minuteStep locale? hapticFeedback onChange(patch: Partial<WheelIndices>) classNames? testID />`. testIDs: `${testID}-hour`, `${testID}-minute`, `${testID}-option-hour-${i}`, `${testID}-option-minute-${i}`, `${testID}-period-${0|1}`.
  - `<TimePicker {...TimePickerProps} />`. Default `testID = 'time-picker'`. Wheel testIDs: `${testID}-hours`, `${testID}-minutes`, `${testID}-period`.

- [ ] **Step 1: Write the failing tests**

`src/hooks/__tests__/useDateValue.test.tsx`:
```tsx
import { act, renderHook } from '@testing-library/react-native';
import { useDateValue } from '../useDateValue';

describe('useDateValue', () => {
  it('uncontrolled: stores the value and reports it', async () => {
    const onChange = jest.fn();
    const { result } = await renderHook(() => useDateValue({ onChange }));
    expect(result.current[0]).toBeNull();
    const next = new Date(2026, 8, 29);
    await act(async () => result.current[1](next));
    expect(result.current[0]).toBe(next);
    expect(onChange).toHaveBeenCalledWith(next);
  });

  it('controlled null stays null until the parent updates', async () => {
    const onChange = jest.fn();
    const { result } = await renderHook(() => useDateValue({ value: null, onChange }));
    await act(async () => result.current[1](new Date(2026, 8, 29)));
    expect(result.current[0]).toBeNull();
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
```

`src/components/TimePicker/__tests__/TimePicker.test.tsx`:
```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';
import { format } from 'date-fns';
import { TimePicker } from '../TimePicker';

const at = (h: number, m: number) => new Date(2026, 8, 29, h, m);
const increment = { nativeEvent: { actionName: 'increment' } };
const decrement = { nativeEvent: { actionName: 'decrement' } };
const last = (fn: jest.Mock): Date => fn.mock.calls.at(-1)?.[0] as Date;
const valueOf = (id: string) => screen.getByTestId(id).props.accessibilityValue.text as string;

describe('<TimePicker /> wheel', () => {
  it('24h: 23 → 00 wraps the hour without changing the date', async () => {
    const onChange = jest.fn();
    await render(<TimePicker hourFormat="24h" defaultValue={at(23, 40)} onChange={onChange} />);
    await fireEvent(screen.getByTestId('time-picker-hours'), 'accessibilityAction', increment);
    expect(format(last(onChange), 'yyyy-MM-dd HH:mm')).toBe('2026-09-29 00:40');
  });

  it('shows a floored minute for unaligned values and emits the snapped one (review focus)', async () => {
    const onChange = jest.fn();
    await render(<TimePicker hourFormat="24h" minuteStep={15} defaultValue={at(10, 7)} onChange={onChange} />);
    expect(valueOf('time-picker-minutes')).toBe('00');
    expect(onChange).not.toHaveBeenCalled();
    await fireEvent(screen.getByTestId('time-picker-hours'), 'accessibilityAction', increment);
    expect(format(last(onChange), 'HH:mm')).toBe('11:00');
  });

  it('12h: 00:15 shows 12 AM and switching to PM gives 12:15 (review focus)', async () => {
    const onChange = jest.fn();
    await render(<TimePicker hourFormat="12h" defaultValue={at(0, 15)} onChange={onChange} />);
    expect(valueOf('time-picker-hours')).toBe('12');
    expect(valueOf('time-picker-period')).toBe('AM');
    await fireEvent(screen.getByTestId('time-picker-period'), 'accessibilityAction', increment);
    expect(format(last(onChange), 'HH:mm')).toBe('12:15');
  });

  it('24h hides the period wheel', async () => {
    await render(<TimePicker hourFormat="24h" defaultValue={at(9, 0)} />);
    expect(screen.queryByTestId('time-picker-period')).toBeNull();
  });

  it('minute steps drive the option count (step 30 = 2 rows, clamped, not looping)', async () => {
    const onChange = jest.fn();
    await render(<TimePicker hourFormat="24h" minuteStep={30} defaultValue={at(9, 0)} onChange={onChange} />);
    await fireEvent(screen.getByTestId('time-picker-minutes'), 'accessibilityAction', decrement);
    expect(onChange).not.toHaveBeenCalled();
    await fireEvent(screen.getByTestId('time-picker-minutes'), 'accessibilityAction', increment);
    expect(format(last(onChange), 'HH:mm')).toBe('09:30');
  });

  it('controlled: reflects the value prop', async () => {
    const { rerender } = await render(<TimePicker hourFormat="24h" value={at(8, 5)} />);
    expect(valueOf('time-picker-hours')).toBe('08');
    await rerender(<TimePicker hourFormat="24h" value={at(17, 5)} />);
    expect(valueOf('time-picker-hours')).toBe('17');
  });

  it('merges container slot classes and injects theme vars on override', async () => {
    await render(<TimePicker themeOverride="dark" classNames={{ container: 'p-6' }} />);
    const root = screen.getByTestId('time-picker');
    expect(root.props.className).toContain('p-6');
    expect(root.props.className).not.toContain('p-3');
    expect(root.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ __vars: expect.any(Object) })]));
  });
});

describe('<TimePicker /> inline', () => {
  it('picks the hour from the grid, then PM → 15:30', async () => {
    const onChange = jest.fn();
    await render(<TimePicker variant="inline" hourFormat="12h" defaultValue={at(9, 30)} onChange={onChange} />);
    await fireEvent.press(screen.getByTestId('time-picker-hour'));
    await fireEvent.press(screen.getByTestId('time-picker-option-hour-3'));
    expect(format(last(onChange), 'HH:mm')).toBe('03:30');
    expect(screen.queryByTestId('time-picker-option-hour-3')).toBeNull();
    await fireEvent.press(screen.getByTestId('time-picker-period-1'));
    expect(format(last(onChange), 'HH:mm')).toBe('15:30');
  });

  it('minute grid honours minuteStep', async () => {
    const onChange = jest.fn();
    await render(<TimePicker variant="inline" hourFormat="24h" minuteStep={15} defaultValue={at(9, 0)} onChange={onChange} />);
    await fireEvent.press(screen.getByTestId('time-picker-minute'));
    expect(screen.queryByTestId('time-picker-option-minute-4')).toBeNull();
    await fireEvent.press(screen.getByTestId('time-picker-option-minute-3'));
    expect(format(last(onChange), 'HH:mm')).toBe('09:45');
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test:ios -- src/hooks/__tests__/useDateValue.test.tsx src/components/TimePicker/__tests__/TimePicker.test.tsx`
Expected: FAIL "Cannot find module".

- [ ] **Step 3: Implement `src/hooks/useDateValue.ts`**

```ts
/** Controllable `Date | null` whose public onChange only ever receives a Date. */
import { useCallback } from 'react';
import { useControllableState } from './useControllableState';

export interface DateValueOptions {
  value?: Date | null;
  defaultValue?: Date | null;
  onChange?: (value: Date) => void;
}

export function useDateValue({ value, defaultValue, onChange }: DateValueOptions): [Date | null, (next: Date) => void] {
  const [current, setCurrent] = useControllableState<Date | null>({ value, defaultValue: defaultValue ?? null });
  const set = useCallback(
    (next: Date) => {
      setCurrent(next);
      onChange?.(next);
    },
    [setCurrent, onChange],
  );
  return [current, set];
}
```

- [ ] **Step 4: Implement `src/components/TimePicker/InlineTime.tsx`**

```tsx
/** Compact time entry: tappable hour/minute pills that open option grids, plus an AM/PM toggle. No TextInput. */
import type { Locale } from 'date-fns';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { buildMinuteOptions, HOURS_12, HOURS_24, pad2, periodLabels, type WheelIndices } from '../../core/time';
import { triggerHaptic } from '../../platform/haptics';
import { TEXT_RESET } from '../../platform/styles';
import { cn } from '../../theme/cn';
import type { HourFormat, MinuteStep, TimePickerClassNames } from '../../types';

type Segment = 'hour' | 'minute';

export interface InlineTimeProps {
  indices: WheelIndices;
  hourFormat: HourFormat;
  minuteStep: MinuteStep;
  locale?: Locale;
  hapticFeedback: boolean;
  onChange: (patch: Partial<WheelIndices>) => void;
  classNames?: TimePickerClassNames;
  testID: string;
}

interface PillProps {
  label: string;
  active: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  classNames?: TimePickerClassNames;
  testID: string;
}

function SegmentPill({ label, active, onPress, accessibilityLabel, classNames, testID }: PillProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ expanded: active }}
      testID={testID}
      className={cn(
        'h-11 min-w-14 items-center justify-center rounded-lg bg-muted px-3 select-none',
        active && 'border-2 border-primary',
        classNames?.inlineSegment,
        active && classNames?.inlineSegmentActive,
      )}
    >
      <Text style={TEXT_RESET} className={cn('text-xl font-semibold text-foreground tabular-nums', classNames?.inlineSegmentText)}>
        {label}
      </Text>
    </Pressable>
  );
}

export function InlineTime({ indices, hourFormat, minuteStep, locale, hapticFeedback, onChange, classNames, testID }: InlineTimeProps) {
  const [open, setOpen] = useState<Segment | null>(null);
  const hours = hourFormat === '24h' ? HOURS_24.map(pad2) : HOURS_12.map(String);
  const minutes = buildMinuteOptions(minuteStep).map(pad2);
  const periods = periodLabels(locale);

  const choose = (patch: Partial<WheelIndices>) => {
    triggerHaptic('selection', hapticFeedback);
    onChange(patch);
    setOpen(null);
  };
  const toggle = (segment: Segment) => setOpen((current) => (current === segment ? null : segment));

  const options = open === 'hour' ? hours : open === 'minute' ? minutes : [];
  const activeIndex = open === 'hour' ? indices.hour : indices.minute;

  return (
    <View className={cn('gap-3', classNames?.inlineContainer)}>
      <View className="flex-row items-center justify-center gap-2">
        <SegmentPill
          label={hours[indices.hour] ?? ''}
          active={open === 'hour'}
          onPress={() => toggle('hour')}
          accessibilityLabel="Hour"
          classNames={classNames}
          testID={`${testID}-hour`}
        />
        <Text style={TEXT_RESET} className={cn('text-xl font-semibold text-foreground', classNames?.separatorText)}>
          :
        </Text>
        <SegmentPill
          label={minutes[indices.minute] ?? ''}
          active={open === 'minute'}
          onPress={() => toggle('minute')}
          accessibilityLabel="Minute"
          classNames={classNames}
          testID={`${testID}-minute`}
        />
        {hourFormat === '12h' && (
          <View className={cn('ml-2 flex-row rounded-lg bg-muted p-1', classNames?.periodToggle)} accessibilityRole="radiogroup">
            {periods.map((label, i) => {
              const active = indices.period === i;
              return (
                <Pressable
                  key={label}
                  onPress={() => choose({ period: i === 0 ? 0 : 1 })}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  testID={`${testID}-period-${i}`}
                  className={cn(
                    'h-9 min-w-12 items-center justify-center rounded-md px-2 select-none',
                    active && 'bg-background',
                    classNames?.periodOption,
                    active && classNames?.periodOptionActive,
                  )}
                >
                  <Text
                    style={TEXT_RESET}
                    className={cn(
                      'text-sm text-muted-foreground',
                      active && 'font-semibold text-foreground',
                      classNames?.periodOptionText,
                      active && classNames?.periodOptionActiveText,
                    )}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {open && (
        <View className={cn('flex-row flex-wrap justify-center gap-2', classNames?.inlineOptions)}>
          {options.map((label, i) => {
            const active = i === activeIndex;
            return (
              <Pressable
                key={label}
                onPress={() => choose(open === 'hour' ? { hour: i } : { minute: i })}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                testID={`${testID}-option-${open}-${i}`}
                className={cn(
                  'h-10 w-12 items-center justify-center rounded-lg select-none',
                  active && 'bg-primary',
                  classNames?.inlineOption,
                  active && classNames?.inlineOptionActive,
                )}
              >
                <Text
                  style={TEXT_RESET}
                  className={cn(
                    'text-sm text-foreground tabular-nums',
                    active && 'font-semibold text-primary-foreground',
                    classNames?.inlineOptionText,
                    active && classNames?.inlineOptionActiveText,
                  )}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}
```

- [ ] **Step 5: Implement `src/components/TimePicker/TimePicker.tsx`**

```tsx
/** Time of day picker: infinite wheels (default) or the inline pill variant. Never changes the calendar date. */
import { useState } from 'react';
import { Text, View } from 'react-native';
import { toZoned } from '../../core/dateUtils';
import { defaultTime } from '../../core/dateTime';
import {
  buildMinuteOptions,
  HOURS_12,
  HOURS_24,
  indicesToTime,
  pad2,
  periodLabels,
  timeToIndices,
  type WheelIndices,
} from '../../core/time';
import { useDateValue } from '../../hooks/useDateValue';
import { TEXT_RESET } from '../../platform/styles';
import { cn } from '../../theme/cn';
import { useDatePickerTheme } from '../../theme/DatePickerThemeProvider';
import type { HourFormat, MinuteStep, TimePickerProps } from '../../types';
import { InlineTime } from './InlineTime';
import { Wheel, type WheelOption } from './Wheel';

export const hourOptions = (hourFormat: HourFormat): WheelOption[] =>
  (hourFormat === '24h' ? HOURS_24.map(pad2) : HOURS_12.map(String)).map((label, i) => ({ key: `h${i}`, label }));

export const minuteOptions = (step: MinuteStep): WheelOption[] =>
  buildMinuteOptions(step).map((m) => ({ key: `m${m}`, label: pad2(m) }));

export function TimePicker(props: TimePickerProps) {
  const {
    variant = 'wheel',
    hourFormat = '12h',
    minuteStep = 1,
    visibleItemCount = 5,
    itemHeight = 44,
    locale,
    timeZone,
    hapticFeedback = true,
    themeOverride,
    className,
    classNames,
    testID = 'time-picker',
  } = props;

  const { rootStyle } = useDatePickerTheme(themeOverride);
  const [value, setValue] = useDateValue(props);
  // Stable fallback so an empty picker doesn't drift every render.
  const [fallback] = useState(() => defaultTime(minuteStep, timeZone));
  const base = toZoned(value ?? fallback, timeZone);
  const indices = timeToIndices(base, hourFormat, minuteStep);

  const update = (patch: Partial<WheelIndices>) =>
    setValue(indicesToTime(base, { ...indices, ...patch }, hourFormat, minuteStep));

  const containerClass = cn('items-center justify-center rounded-lg bg-background p-3', className, classNames?.container);

  if (variant === 'inline') {
    return (
      <View style={[rootStyle]} className={containerClass} testID={testID}>
        <InlineTime
          indices={indices}
          hourFormat={hourFormat}
          minuteStep={minuteStep}
          locale={locale}
          hapticFeedback={hapticFeedback}
          onChange={update}
          classNames={classNames}
          testID={testID}
        />
      </View>
    );
  }

  const periods: WheelOption[] = periodLabels(locale).map((label, i) => ({ key: `p${i}`, label }));
  const bandTop = ((visibleItemCount - 1) / 2) * itemHeight;
  const shared = { itemHeight, visibleCount: visibleItemCount, hapticFeedback, classNames } as const;

  return (
    <View style={[rootStyle]} className={containerClass} testID={testID}>
      <View className="relative flex-row items-center justify-center gap-1" style={{ height: itemHeight * visibleItemCount }}>
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: 0, right: 0, top: bandTop, height: itemHeight }}
          className={cn('rounded-lg bg-muted', classNames?.wheelHighlight)}
        />
        <Wheel
          {...shared}
          items={hourOptions(hourFormat)}
          selectedIndex={indices.hour}
          onChange={(hour) => update({ hour })}
          accessibilityLabel="Hours"
          testID={`${testID}-hours`}
        />
        <View className={cn('w-4 items-center', classNames?.separator)}>
          <Text style={TEXT_RESET} className={cn('text-lg font-semibold text-foreground', classNames?.separatorText)}>
            :
          </Text>
        </View>
        <Wheel
          {...shared}
          items={minuteOptions(minuteStep)}
          selectedIndex={indices.minute}
          onChange={(minute) => update({ minute })}
          accessibilityLabel="Minutes"
          testID={`${testID}-minutes`}
        />
        {hourFormat === '12h' && (
          <Wheel
            {...shared}
            items={periods}
            selectedIndex={indices.period}
            onChange={(period) => update({ period: period === 0 ? 0 : 1 })}
            accessibilityLabel="AM/PM"
            testID={`${testID}-period`}
          />
        )}
      </View>
    </View>
  );
}
```

Both variants pass `style={[rootStyle]}` (an array), which is what the theme test asserts.

- [ ] **Step 6: Run to verify pass**

Run: `pnpm test -- src/hooks src/components/TimePicker && pnpm typecheck`
Expected: PASS on ios/android; typecheck exits 0.

- [ ] **Step 7: Checkpoint (no commit)** — `git status --short`.

---

### Task 12: `<DateTimePicker />` (tabs + stacked)

**Files:**
- Create: `src/components/shared/passthrough.ts`, `src/components/DateTimePicker/SegmentedTabs.tsx`, `src/components/DateTimePicker/CollapsibleSection.tsx`, `src/components/DateTimePicker/DateTimePicker.tsx`
- Test: `src/components/shared/__tests__/passthrough.test.ts`, `src/components/DateTimePicker/__tests__/DateTimePicker.test.tsx`

**Interfaces:**
- Consumes: `Calendar` (Task 9b); `TimePicker` (Task 11); `useDateValue` (Task 11); `combineDateAndTime`, `defaultTime` (Task 5); `toZoned` (Task 3); `Chevron` (Task 8); `useDatePickerTheme` (Task 7); `CalendarPassthroughProps`, `DateTimePickerProps` (Task 2).
- Produces:
  - `pickCalendarPassthrough<P extends CalendarPassthroughProps>(props: P): CalendarPassthroughProps`. Task 13 reuses it.
  - `interface TabItem { key: string; title: string; subtitle?: string }`; `<SegmentedTabs tabs activeIndex onChange classNames? testID />`. testIDs: `${testID}-tab-${key}`, `${testID}-indicator`.
  - `<CollapsibleSection title subtitle? expanded onToggle classNames? testID>{children}</CollapsibleSection>`. testIDs: `${testID}-header`, `${testID}-body`.
  - `<DateTimePicker {...DateTimePickerProps} />`. Default `testID = 'date-time-picker'`. Children: `${testID}-calendar`, `${testID}-time`. Tabs: `${testID}-tab-date`, `${testID}-tab-time`. Stacked sections: `${testID}-date-section`, `${testID}-time-section`.

**Design notes:**
- Tab content that isn't active is unmounted. The calendar re-opens on the value's month, so nothing visible is lost.
- The stacked sections expand and collapse instantly, with no height animation. Measuring height to animate it lands on different frames on each platform, and an instant toggle looks the same everywhere.
- The indicator pads by the numeric value `TAB_PADDING = 4`, not rem, so it lines up on every platform even if a host forgets `inlineRem`.

- [ ] **Step 1: Write the failing tests**

`src/components/shared/__tests__/passthrough.test.ts`:
```ts
import { pickCalendarPassthrough } from '../passthrough';

describe('pickCalendarPassthrough', () => {
  it('keeps only calendar passthrough keys and drops undefined ones', () => {
    const minDate = new Date(2026, 0, 1);
    const picked = pickCalendarPassthrough({ minDate, firstDayOfWeek: 1, hideHeader: undefined, placeholder: 'x' } as never);
    expect(picked).toEqual({ minDate, firstDayOfWeek: 1 });
  });
});
```

`src/components/DateTimePicker/__tests__/DateTimePicker.test.tsx`:
```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';
import { format } from 'date-fns';
import { DateTimePicker } from '../DateTimePicker';

const VALUE = new Date(2026, 8, 29, 14, 45);
const increment = { nativeEvent: { actionName: 'increment' } };
const last = (fn: jest.Mock): Date => fn.mock.calls.at(-1)?.[0] as Date;

describe('<DateTimePicker /> tabs', () => {
  it('shows the calendar first with date/time subtitles', async () => {
    await render(<DateTimePicker defaultValue={VALUE} />);
    expect(screen.getByTestId('date-time-picker-calendar')).toBeTruthy();
    expect(screen.queryByTestId('date-time-picker-time')).toBeNull();
    expect(screen.getByText('Sep 29, 2026')).toBeTruthy();
    expect(screen.getByText('2:45 PM')).toBeTruthy();
  });

  it('changing the date keeps the time', async () => {
    const onChange = jest.fn();
    await render(<DateTimePicker defaultValue={VALUE} onChange={onChange} />);
    await fireEvent.press(screen.getByTestId('date-time-picker-calendar-day-2026-09-10'));
    expect(format(last(onChange), 'yyyy-MM-dd HH:mm')).toBe('2026-09-10 14:45');
  });

  it('changing the time keeps the date', async () => {
    const onChange = jest.fn();
    await render(<DateTimePicker defaultValue={VALUE} hourFormat="24h" onChange={onChange} />);
    await fireEvent.press(screen.getByTestId('date-time-picker-tab-time'));
    expect(screen.queryByTestId('date-time-picker-calendar')).toBeNull();
    await fireEvent(screen.getByTestId('date-time-picker-time-hours'), 'accessibilityAction', increment);
    expect(format(last(onChange), 'yyyy-MM-dd HH:mm')).toBe('2026-09-29 15:45');
    expect(screen.getByText('15:45')).toBeTruthy();
  });

  it('with no value, picking a date uses now floored to minuteStep', async () => {
    const onChange = jest.fn();
    await render(<DateTimePicker minuteStep={15} onChange={onChange} minDate={new Date(2026, 8, 1)} maxDate={new Date(2026, 8, 30)} />);
    await fireEvent.press(screen.getByTestId('date-time-picker-calendar-day-2026-09-10'));
    const picked = last(onChange);
    expect(format(picked, 'yyyy-MM-dd')).toBe('2026-09-10');
    expect(picked.getMinutes() % 15).toBe(0);
    expect(picked.getSeconds()).toBe(0);
  });

  it('forwards nested classNames and tab labels', async () => {
    await render(
      <DateTimePicker
        defaultValue={VALUE}
        tabLabels={{ date: 'Day', time: 'Clock' }}
        classNames={{ calendar: { container: 'bg-red-500' }, tabs: 'mb-4' }}
      />,
    );
    expect(screen.getByText('Day')).toBeTruthy();
    expect(screen.getByText('Clock')).toBeTruthy();
    expect(screen.getByTestId('date-time-picker-calendar').props.className).toContain('bg-red-500');
    expect(screen.getByTestId('date-time-picker-tabs').props.className).toContain('mb-4');
  });
});

describe('<DateTimePicker /> stacked', () => {
  it('starts with date expanded and time collapsed; sections toggle independently', async () => {
    await render(<DateTimePicker layout="stacked" defaultValue={VALUE} />);
    expect(screen.getByTestId('date-time-picker-calendar')).toBeTruthy();
    expect(screen.queryByTestId('date-time-picker-time')).toBeNull();
    await fireEvent.press(screen.getByTestId('date-time-picker-time-section-header'));
    expect(screen.getByTestId('date-time-picker-time')).toBeTruthy();
    expect(screen.getByTestId('date-time-picker-calendar')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('date-time-picker-date-section-header'));
    expect(screen.queryByTestId('date-time-picker-calendar')).toBeNull();
    expect(screen.getByTestId('date-time-picker-date-section-header').props.accessibilityState).toMatchObject({ expanded: false });
  });
});
```

The "no value" test pins the range to Sep 2026 (min/max), so the calendar opens on September 2026 whatever today's date is.

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test -- src/components/shared src/components/DateTimePicker`
Expected: FAIL "Cannot find module".

- [ ] **Step 3: Implement `src/components/shared/passthrough.ts`**

```ts
/** Picks the Calendar props that DatePicker / DateTimePicker forward unchanged. */
import type { CalendarPassthroughProps } from '../../types';

const KEYS = [
  'minDate',
  'maxDate',
  'disabledDates',
  'firstDayOfWeek',
  'showOutsideDays',
  'hideHeader',
  'hideWeekdays',
  'swipeEnabled',
  'labels',
  'renderDay',
  'renderHeader',
  'renderFooter',
] as const satisfies readonly (keyof CalendarPassthroughProps)[];

export function pickCalendarPassthrough<P extends CalendarPassthroughProps>(props: P): CalendarPassthroughProps {
  return Object.fromEntries(
    KEYS.filter((key) => props[key] !== undefined).map((key) => [key, props[key]]),
  ) as CalendarPassthroughProps;
}
```

- [ ] **Step 4: Implement `src/components/DateTimePicker/SegmentedTabs.tsx`**

```tsx
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
```

- [ ] **Step 5: Implement `src/components/DateTimePicker/CollapsibleSection.tsx`**

```tsx
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
```

- [ ] **Step 6: Implement `src/components/DateTimePicker/DateTimePicker.tsx`**

```tsx
/** Date + time in one value. Tabs (default) or stacked collapsible sections. */
import { format } from 'date-fns';
import { useState } from 'react';
import { View } from 'react-native';
import { combineDateAndTime, defaultTime } from '../../core/dateTime';
import { toZoned } from '../../core/dateUtils';
import { useDateValue } from '../../hooks/useDateValue';
import { cn } from '../../theme/cn';
import { useDatePickerTheme } from '../../theme/DatePickerThemeProvider';
import type { DateTimePickerProps } from '../../types';
import { Calendar } from '../Calendar/Calendar';
import { pickCalendarPassthrough } from '../shared/passthrough';
import { TimePicker } from '../TimePicker/TimePicker';
import { CollapsibleSection } from './CollapsibleSection';
import { SegmentedTabs } from './SegmentedTabs';

const EMPTY = '—';

export function DateTimePicker(props: DateTimePickerProps) {
  const {
    layout = 'tabs',
    hourFormat = '12h',
    minuteStep = 1,
    timeVariant = 'wheel',
    tabLabels,
    locale,
    timeZone,
    hapticFeedback = true,
    themeOverride,
    className,
    classNames,
    testID = 'date-time-picker',
  } = props;

  const { rootStyle } = useDatePickerTheme(themeOverride);
  const [value, setValue] = useDateValue(props);
  const [activeTab, setActiveTab] = useState(0);
  const [expanded, setExpanded] = useState({ date: true, time: false });

  const zoned = value ? toZoned(value, timeZone) : null;
  const dateText = zoned ? format(zoned, 'PP', { locale }) : EMPTY;
  const timeText = zoned ? format(zoned, hourFormat === '12h' ? 'h:mm a' : 'HH:mm', { locale }) : EMPTY;
  const labels = { date: tabLabels?.date ?? 'Date', time: tabLabels?.time ?? 'Time' };

  const onDate = (day: Date) => setValue(combineDateAndTime(day, value ?? defaultTime(minuteStep, timeZone), timeZone));
  const onTime = (time: Date) => setValue(combineDateAndTime(value ?? time, time, timeZone));

  const calendar = (
    <Calendar
      {...pickCalendarPassthrough(props)}
      mode="single"
      value={value}
      onChange={onDate}
      locale={locale}
      timeZone={timeZone}
      hapticFeedback={hapticFeedback}
      themeOverride={themeOverride}
      classNames={classNames?.calendar}
      testID={`${testID}-calendar`}
    />
  );
  const timePicker = (
    <TimePicker
      value={value}
      onChange={onTime}
      variant={timeVariant}
      hourFormat={hourFormat}
      minuteStep={minuteStep}
      locale={locale}
      timeZone={timeZone}
      hapticFeedback={hapticFeedback}
      themeOverride={themeOverride}
      classNames={classNames?.timePicker}
      testID={`${testID}-time`}
    />
  );

  return (
    <View style={rootStyle} className={cn('w-full gap-3 rounded-lg bg-background p-2', className, classNames?.container)} testID={testID}>
      {layout === 'tabs' ? (
        <>
          <SegmentedTabs
            tabs={[
              { key: 'date', title: labels.date, subtitle: dateText },
              { key: 'time', title: labels.time, subtitle: timeText },
            ]}
            activeIndex={activeTab}
            onChange={setActiveTab}
            classNames={classNames}
            testID={testID}
          />
          <View className={classNames?.body}>{activeTab === 0 ? calendar : timePicker}</View>
        </>
      ) : (
        <>
          <CollapsibleSection
            title={labels.date}
            subtitle={dateText}
            expanded={expanded.date}
            onToggle={() => setExpanded((s) => ({ ...s, date: !s.date }))}
            classNames={classNames}
            testID={`${testID}-date-section`}
          >
            {calendar}
          </CollapsibleSection>
          <CollapsibleSection
            title={labels.time}
            subtitle={timeText}
            expanded={expanded.time}
            onToggle={() => setExpanded((s) => ({ ...s, time: !s.time }))}
            classNames={classNames}
            testID={`${testID}-time-section`}
          >
            {timePicker}
          </CollapsibleSection>
        </>
      )}
    </View>
  );
}
```

- [ ] **Step 7: Run to verify pass**

Run: `pnpm test -- src/components/shared src/components/DateTimePicker && pnpm typecheck`
Expected: PASS (passthrough on ios/android/web, DateTimePicker on ios/android); typecheck exits 0.

- [ ] **Step 8: Checkpoint (no commit)** — `git status --short`.

---

### Task 13: `<DatePicker />` (modal / sheet / popover)

**Files:**
- Create: `src/components/DatePicker/Overlay.tsx`, `src/components/DatePicker/DefaultTrigger.tsx`, `src/components/DatePicker/DatePicker.tsx`
- Test: `src/components/DatePicker/__tests__/DatePicker.test.tsx`

**Interfaces:**
- Consumes: `Calendar` (Task 9b); `useDateValue` (Task 11); `useControllableState` (Task 8); `pickCalendarPassthrough` (Task 12); `toZoned` (Task 3); `SHADOW`, `TEXT_RESET` (Task 8); `Chevron` (Task 8); `useDatePickerTheme`, `ResolvedPickerTheme` (Task 7); `DatePickerProps`, `DatePickerClassNames` (Task 2).
- Produces:
  - `OVERLAY_MS = 220`, `SHEET_DISMISS_DISTANCE = 120`, `SHEET_DISMISS_VELOCITY = 800`
  - `<Overlay visible variant onRequestClose rootStyle classNames? testID>{children}</Overlay>`. testIDs: `${testID}-backdrop`, `${testID}-modal` | `${testID}-sheet`, `${testID}-sheet-handle`.
  - `<DefaultTrigger displayValue placeholder isOpen onPress classNames? testID />`. testID: `${testID}-trigger`.
  - `<DatePicker {...DatePickerProps} />`. Default `testID = 'date-picker'`. Calendar: `${testID}-calendar`. Popover: `${testID}-popover`.

**Overlay rules (parity):**
- RN `Modal` with `transparent`, `animationType="none"`, `statusBarTranslucent` and `navigationBarTranslucent`, so the OS contributes no animation or insets.
- A `GestureHandlerRootView` goes inside the Modal (Android needs it for gestures in a Modal).
- Motion is a single `progress` shared value (0 → 1 over 220 ms). The Modal stays mounted until the exit animation finishes.
- `onRequestClose` covers Android back and web Escape (react-native-web's Modal maps Escape to it).
- `rootStyle` is applied again inside the Modal, because a Modal renders outside the component tree's styled root.
- The sheet has a fixed `pb-8` bottom padding instead of safe-area insets. That keeps the library free of `react-native-safe-area-context` and the same on every platform. Hosts can override it with `classNames.sheet`.

- [ ] **Step 1: Write the failing test** `src/components/DatePicker/__tests__/DatePicker.test.tsx`

```tsx
import { fireEvent, render, screen } from '@testing-library/react-native';
import { format } from 'date-fns';
import { Text } from 'react-native';
import { DatePicker } from '../DatePicker';

const VALUE = new Date(2026, 8, 29);
const last = (fn: jest.Mock): unknown => fn.mock.calls.at(-1)?.[0];

describe('<DatePicker />', () => {
  it('shows the placeholder when empty', async () => {
    await render(<DatePicker />);
    expect(screen.getByText('Select date')).toBeTruthy();
    expect(screen.queryByTestId('date-picker-modal')).toBeNull();
  });

  it('formats the value with displayFormat (default PP)', async () => {
    const { rerender } = await render(<DatePicker defaultValue={VALUE} />);
    expect(screen.getByText('Sep 29, 2026')).toBeTruthy();
    await rerender(<DatePicker value={VALUE} displayFormat="dd/MM/yyyy" />);
    expect(screen.getByText('29/09/2026')).toBeTruthy();
  });

  it('modal: opens from the trigger, selects, and closes', async () => {
    const onChange = jest.fn();
    const onOpenChange = jest.fn();
    await render(<DatePicker defaultValue={VALUE} onChange={onChange} onOpenChange={onOpenChange} />);
    await fireEvent.press(screen.getByTestId('date-picker-trigger'));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByTestId('date-picker-modal')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('date-picker-calendar-day-2026-09-10'));
    expect(format(last(onChange) as Date, 'yyyy-MM-dd')).toBe('2026-09-10');
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.getByText('Sep 10, 2026')).toBeTruthy();
  });

  it('closeOnSelect=false keeps it open', async () => {
    const onOpenChange = jest.fn();
    await render(<DatePicker defaultValue={VALUE} defaultOpen closeOnSelect={false} onOpenChange={onOpenChange} />);
    await fireEvent.press(screen.getByTestId('date-picker-calendar-day-2026-09-10'));
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('backdrop press requests close; controlled open stays open until the parent changes it', async () => {
    const onOpenChange = jest.fn();
    await render(<DatePicker defaultValue={VALUE} open onOpenChange={onOpenChange} />);
    await fireEvent.press(screen.getByTestId('date-picker-backdrop'));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.getByTestId('date-picker-modal')).toBeTruthy();
  });

  it('sheet: renders the sheet and its drag handle', async () => {
    await render(<DatePicker presentation="sheet" defaultValue={VALUE} defaultOpen />);
    expect(screen.getByTestId('date-picker-sheet')).toBeTruthy();
    expect(screen.getByTestId('date-picker-sheet-handle')).toBeTruthy();
    expect(screen.queryByTestId('date-picker-modal')).toBeNull();
  });

  it('popover: expands inline under the trigger, with no Modal', async () => {
    await render(<DatePicker presentation="popover" defaultValue={VALUE} />);
    await fireEvent.press(screen.getByTestId('date-picker-trigger'));
    expect(screen.getByTestId('date-picker-popover')).toBeTruthy();
    expect(screen.queryByTestId('date-picker-backdrop')).toBeNull();
    await fireEvent.press(screen.getByTestId('date-picker-trigger'));
    expect(screen.queryByTestId('date-picker-popover')).toBeNull();
  });

  it('renderTrigger replaces the default trigger', async () => {
    await render(
      <DatePicker
        defaultValue={VALUE}
        renderTrigger={({ open, displayValue, isOpen }) => <Text onPress={open}>{`${displayValue ?? 'none'}:${String(isOpen)}`}</Text>}
      />,
    );
    expect(screen.queryByTestId('date-picker-trigger')).toBeNull();
    await fireEvent.press(screen.getByText('Sep 29, 2026:false'));
    expect(screen.getByText('Sep 29, 2026:true')).toBeTruthy();
    expect(screen.getByTestId('date-picker-modal')).toBeTruthy();
  });

  it('forwards calendar props and nested classNames', async () => {
    await render(
      <DatePicker
        defaultValue={VALUE}
        defaultOpen
        firstDayOfWeek={1}
        minDate={new Date(2026, 8, 5)}
        classNames={{ trigger: 'h-14', calendar: { container: 'bg-red-500' } }}
      />,
    );
    expect(screen.getByTestId('date-picker-trigger').props.className).toContain('h-14');
    expect(screen.getByTestId('date-picker-trigger').props.className).not.toContain('h-11');
    expect(screen.getByTestId('date-picker-calendar').props.className).toContain('bg-red-500');
    expect(screen.getByTestId('date-picker-calendar-weekday-0')).toHaveTextContent('Mo');
    expect(screen.getByTestId('date-picker-calendar-day-2026-09-04').props.accessibilityState).toMatchObject({ disabled: true });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test:ios -- src/components/DatePicker`
Expected: FAIL "Cannot find module '../DatePicker'".

- [ ] **Step 3: Implement `src/components/DatePicker/Overlay.tsx`**

```tsx
/** Modal / bottom-sheet surface. All motion comes from Reanimated; the OS contributes none. */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { SHADOW } from '../../platform/styles';
import { cn } from '../../theme/cn';
import type { ResolvedPickerTheme } from '../../theme/DatePickerThemeProvider';
import type { DatePickerClassNames } from '../../types';

export const OVERLAY_MS = 220;
export const SHEET_DISMISS_DISTANCE = 120;
export const SHEET_DISMISS_VELOCITY = 800;
const SNAP_BACK = { damping: 22, stiffness: 240, mass: 1 } as const;
const MODAL_MAX_WIDTH = 400;

export interface OverlayProps {
  visible: boolean;
  variant: 'modal' | 'sheet';
  onRequestClose: () => void;
  rootStyle: ResolvedPickerTheme['rootStyle'];
  classNames?: DatePickerClassNames;
  testID: string;
  children: ReactNode;
}

export function Overlay({ visible, variant, onRequestClose, rootStyle, classNames, testID, children }: OverlayProps) {
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const progress = useSharedValue(0);
  const drag = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      drag.value = 0;
      progress.value = withTiming(1, { duration: OVERLAY_MS });
      return;
    }
    progress.value = withTiming(0, { duration: OVERLAY_MS }, (finished) => {
      if (finished) scheduleOnRN(setMounted, false);
    });
  }, [visible, progress, drag]);

  const handlePan = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate((e) => {
          drag.value = Math.max(0, e.translationY);
        })
        .onEnd((e) => {
          if (e.translationY > SHEET_DISMISS_DISTANCE || e.velocityY > SHEET_DISMISS_VELOCITY) {
            scheduleOnRN(onRequestClose);
          } else {
            drag.value = withSpring(0, SNAP_BACK);
          }
        }),
    [drag, onRequestClose],
  );

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * height + drag.value }],
  }));
  const modalStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.96 + 0.04 * progress.value }],
  }));

  return (
    <Modal
      transparent
      visible={mounted}
      animationType="none"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onRequestClose}
    >
      <GestureHandlerRootView style={styles.fill}>
        <View style={[styles.fill, rootStyle]}>
          <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
            <Pressable
              onPress={onRequestClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              testID={`${testID}-backdrop`}
              className={cn('flex-1 bg-black/50', classNames?.backdrop)}
            />
          </Animated.View>

          {variant === 'sheet' ? (
            <Animated.View
              testID={`${testID}-sheet`}
              accessibilityViewIsModal
              style={[styles.sheet, SHADOW, sheetStyle]}
              className={cn('rounded-t-2xl bg-background px-4 pb-8', classNames?.sheet)}
            >
              <GestureDetector gesture={handlePan}>
                <View testID={`${testID}-sheet-handle`} className="h-6 items-center justify-center">
                  <View className={cn('h-1.5 w-10 rounded-full bg-muted-foreground/40', classNames?.sheetHandle)} />
                </View>
              </GestureDetector>
              {children}
            </Animated.View>
          ) : (
            <View pointerEvents="box-none" className="flex-1 items-center justify-center p-4">
              <Animated.View
                testID={`${testID}-modal`}
                accessibilityViewIsModal
                style={[styles.modal, SHADOW, modalStyle]}
                className={cn('rounded-lg bg-background p-2', classNames?.modal)}
              >
                {children}
              </Animated.View>
            </View>
          )}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  modal: { width: '100%', maxWidth: MODAL_MAX_WIDTH },
});
```

- [ ] **Step 4: Implement `src/components/DatePicker/DefaultTrigger.tsx`**

```tsx
/** Pre-styled input-like trigger button. */
import { Pressable, Text } from 'react-native';
import { TEXT_RESET } from '../../platform/styles';
import { cn } from '../../theme/cn';
import type { DatePickerClassNames } from '../../types';
import { Chevron } from '../shared/Chevron';

export interface DefaultTriggerProps {
  displayValue: string | null;
  placeholder: string;
  isOpen: boolean;
  onPress: () => void;
  classNames?: DatePickerClassNames;
  testID: string;
}

export function DefaultTrigger({ displayValue, placeholder, isOpen, onPress, classNames, testID }: DefaultTriggerProps) {
  const empty = displayValue === null;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ expanded: isOpen }}
      accessibilityLabel={displayValue ?? placeholder}
      testID={`${testID}-trigger`}
      className={cn(
        'h-11 w-full flex-row items-center justify-between rounded-lg border border-border bg-background px-3 select-none',
        classNames?.trigger,
      )}
    >
      <Text
        style={TEXT_RESET}
        numberOfLines={1}
        className={cn(
          'text-sm text-foreground tabular-nums',
          classNames?.triggerText,
          empty && cn('text-muted-foreground', classNames?.triggerPlaceholder),
        )}
      >
        {displayValue ?? placeholder}
      </Text>
      <Chevron direction={isOpen ? 'up' : 'down'} className="border-muted-foreground" />
    </Pressable>
  );
}
```

- [ ] **Step 5: Implement `src/components/DatePicker/DatePicker.tsx`**

```tsx
/** Trigger + Calendar in a modal, bottom sheet or inline popover. Single date (v1). */
import { format } from 'date-fns';
import { View } from 'react-native';
import { toZoned } from '../../core/dateUtils';
import { useControllableState } from '../../hooks/useControllableState';
import { useDateValue } from '../../hooks/useDateValue';
import { SHADOW } from '../../platform/styles';
import { cn } from '../../theme/cn';
import { useDatePickerTheme } from '../../theme/DatePickerThemeProvider';
import type { DatePickerProps } from '../../types';
import { Calendar } from '../Calendar/Calendar';
import { pickCalendarPassthrough } from '../shared/passthrough';
import { DefaultTrigger } from './DefaultTrigger';
import { Overlay } from './Overlay';

export function DatePicker(props: DatePickerProps) {
  const {
    presentation = 'modal',
    placeholder = 'Select date',
    displayFormat = 'PP',
    closeOnSelect = true,
    renderTrigger,
    locale,
    timeZone,
    hapticFeedback = true,
    themeOverride,
    className,
    classNames,
    testID = 'date-picker',
  } = props;

  const { rootStyle } = useDatePickerTheme(themeOverride);
  const [value, setValue] = useDateValue(props);
  const [isOpen, setOpen] = useControllableState<boolean>({
    value: props.open,
    defaultValue: props.defaultOpen ?? false,
    onChange: props.onOpenChange,
  });

  const displayValue = value ? format(toZoned(value, timeZone), displayFormat, { locale }) : null;
  const open = () => setOpen(true);
  const close = () => setOpen(false);

  const onSelect = (date: Date) => {
    setValue(date);
    if (closeOnSelect) close();
  };

  const calendar = (
    <Calendar
      {...pickCalendarPassthrough(props)}
      mode="single"
      value={value}
      onChange={onSelect}
      locale={locale}
      timeZone={timeZone}
      hapticFeedback={hapticFeedback}
      themeOverride={themeOverride}
      classNames={classNames?.calendar}
      testID={`${testID}-calendar`}
    />
  );

  return (
    <View style={rootStyle} className={cn('w-full', className, classNames?.container)} testID={testID}>
      {renderTrigger ? (
        renderTrigger({ isOpen, value, displayValue, open, close })
      ) : (
        <DefaultTrigger
          displayValue={displayValue}
          placeholder={placeholder}
          isOpen={isOpen}
          onPress={isOpen ? close : open}
          classNames={classNames}
          testID={testID}
        />
      )}

      {presentation === 'popover' ? (
        isOpen && (
          <View
            testID={`${testID}-popover`}
            style={SHADOW}
            className={cn('mt-2 rounded-lg border border-border bg-background', classNames?.popover)}
          >
            {calendar}
          </View>
        )
      ) : (
        <Overlay
          visible={isOpen}
          variant={presentation}
          onRequestClose={close}
          rootStyle={rootStyle}
          classNames={classNames}
          testID={testID}
        >
          {calendar}
        </Overlay>
      )}
    </View>
  );
}
```

- [ ] **Step 6: Run to verify pass**

Run: `pnpm test -- src/components/DatePicker && pnpm typecheck`
Expected: PASS on ios/android; typecheck exits 0.

About the "modal closes" test: after `onOpenChange(false)`, the Modal stays mounted until the 220 ms exit animation finishes. The test only asserts the callback and the updated trigger text, never that the modal is gone. That keeps it independent of timers.

- [ ] **Step 7: Checkpoint (no commit)** — `git status --short`.

---

### Task 14: Public API + README

**Files:**
- Modify: `src/index.ts` (replace the Task 1 stub), `README.md` (replace the Task 1 stub)
- Test: `src/__tests__/index.test.tsx`

**Interfaces:**
- Consumes: every earlier task.
- Produces: the published surface. Runtime exports, exactly: `Calendar`, `TimePicker`, `DatePicker`, `DateTimePicker`, `DatePickerThemeProvider`, `useDatePickerTheme`, `cn`, `resolveTheme`, `toHslChannels`, `toCssVariables`, `resolveColor`, `FALLBACK_THEME`, `THEME_TOKENS`. Plus every public type.

- [ ] **Step 1: Write the failing test** `src/__tests__/index.test.tsx`

```tsx
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
```

- [ ] **Step 2: Run to verify failure**

Run: `pnpm test:ios -- src/__tests__/index.test.tsx`
Expected: FAIL. The key list is `[]`, and typecheck reports missing exports.

- [ ] **Step 3: Replace `src/index.ts`**

```ts
/** Public entry point for react-native-dateflow. */
export { Calendar } from './components/Calendar/Calendar';
export { TimePicker } from './components/TimePicker/TimePicker';
export { DatePicker } from './components/DatePicker/DatePicker';
export { DateTimePicker } from './components/DateTimePicker/DateTimePicker';

export {
  DatePickerThemeProvider,
  useDatePickerTheme,
  type DatePickerThemeProviderProps,
  type ResolvedPickerTheme,
} from './theme/DatePickerThemeProvider';
export { cn } from './theme/cn';
export { resolveColor, resolveTheme, toCssVariables, toHslChannels } from './theme/resolveTheme';
export {
  FALLBACK_THEME,
  THEME_TOKENS,
  type DatePickerTheme,
  type DatePickerThemeInput,
  type ThemeColors,
  type ThemeMap,
  type ThemeToken,
} from './theme/tokens';

export type * from './types';
```

- [ ] **Step 4: Replace `README.md`**

````md
# react-native-dateflow

Date and time pickers for Expo that look and behave the same on iOS, Android and Web: `Calendar`, `TimePicker`, `DatePicker`, `DateTimePicker`. They're pure TypeScript, driven by Reanimated 4 and Gesture Handler, styled with NativeWind v4, and inherit your Tailwind theme.

## Requirements

Expo SDK 57 (React Native 0.86, New Architecture), `react-native-reanimated` 4, `react-native-worklets`, `react-native-gesture-handler`, `nativewind` 4 + `tailwindcss` 3, `date-fns` 4 + `@date-fns/tz`, `expo-haptics`.

```sh
pnpm add react-native-dateflow date-fns @date-fns/tz
pnpm expo install react-native-reanimated react-native-worklets react-native-gesture-handler expo-haptics nativewind tailwindcss
```

The package ships TypeScript source, and your Metro/Babel config compiles it. Expo/Metro is the only supported bundler.

## Setup

1. **Tailwind**: scan the library and add the preset.

   ```js
   // tailwind.config.js
   module.exports = {
     darkMode: 'class',
     content: ['./app/**/*.{ts,tsx}', './node_modules/react-native-dateflow/src/**/*.{ts,tsx}'],
     presets: [require('nativewind/preset'), require('react-native-dateflow/tailwind-preset')],
   };
   ```

2. **Metro**: set `inlineRem: 16`. This is required for identical sizes: NativeWind otherwise uses 14px rem on native and 16px on web.

   ```js
   // metro.config.js
   const { getDefaultConfig } = require('expo/metro-config');
   const { withNativeWind } = require('nativewind/metro');
   module.exports = withNativeWind(getDefaultConfig(__dirname), { input: './global.css', inlineRem: 16 });
   ```

3. **Gesture root**: wrap your app once.

   ```tsx
   import { GestureHandlerRootView } from 'react-native-gesture-handler';
   export default function App() {
     return <GestureHandlerRootView style={{ flex: 1 }}>{/* … */}</GestureHandlerRootView>;
   }
   ```

4. **Tokens**: components use `bg-background`, `text-foreground`, `bg-primary`, `text-primary-foreground`, `bg-muted`, `text-muted-foreground`, `bg-accent`, `text-accent-foreground`, `border-border` and `rounded-lg`. These read `--background`, `--foreground`, `--primary`, `--primary-foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--border` and `--radius`, written as HSL channels (shadcn style, e.g. `--primary: 221 83% 53%`).
   - Already have them (shadcn / NativeWind UI setups)? You're done.
   - Don't have them? Add `@import 'react-native-dateflow/theme.css';` to `global.css`, or wrap your app in `<DatePickerThemeProvider useFallbackTokens>`.

## Usage

```tsx
import { Calendar, DatePicker, DateTimePicker, TimePicker } from 'react-native-dateflow';

<Calendar mode="range" value={range} onChange={setRange} minDate={new Date()} firstDayOfWeek={1} />
<TimePicker value={time} onChange={setTime} hourFormat="24h" minuteStep={5} />
<TimePicker variant="inline" value={time} onChange={setTime} />
<DatePicker value={date} onChange={setDate} presentation="sheet" />
<DateTimePicker value={when} onChange={setWhen} layout="stacked" minuteStep={15} />
```

### Styling slots

Every component takes `className` (root) and a typed `classNames` slot map. Slot classes are merged with `tailwind-merge`, so yours win:

```tsx
<Calendar classNames={{ dayCell: 'h-12', selectedDay: 'bg-emerald-600', headerTitleText: 'text-lg' }} />
<DateTimePicker classNames={{ tabs: 'bg-transparent', calendar: { dayText: 'text-base' }, timePicker: { wheelHighlight: 'bg-accent' } }} />
```

### Render overrides

`renderDay`, `renderHeader`, `renderFooter` (Calendar, and forwarded by DatePicker/DateTimePicker), and `renderTrigger` (DatePicker).

### Theming

```tsx
import { DatePickerThemeProvider } from 'react-native-dateflow';

<DatePickerThemeProvider
  theme={{ light: { colors: { primary: '#2563eb' }, radius: '16px' }, dark: { colors: { primary: 'hsl(217 91% 60%)' } } }}
>
  <App />
</DatePickerThemeProvider>
```

Light/dark mode follows NativeWind's `useColorScheme()`. Use `themeOverride="dark"` on the provider or on any single component to force a mode.

### Locale & time zone

Pass a date-fns `Locale` (`import { de } from 'date-fns/locale'`) and an IANA `timeZone` (`"Europe/Berlin"`). Labels come from `date-fns` `format`, never `Intl`, so text is the same on Hermes and in browsers.

## Pixel parity checklist

- Keep `inlineRem: 16` (see Setup).
- Load one custom font and apply it with your Tailwind `fontFamily` or `classNames`. System fonts differ by OS. Android can't synthesise weights for custom fonts, so ship a variable font or one family per weight.
- Nothing uses native pickers, `ScrollView`, text glyph icons or `elevation`. If you override parts with render props, follow the same rules.

## Behaviour notes

- Minutes that don't match `minuteStep` display floored and are only rewritten when the user interacts.
- Wheels loop when they have at least `visibleItemCount + 2` items (hours, minutes); AM/PM clamps.
- Time wheels never change the date. DateTimePicker keeps the time when the date changes, and the date when the time changes.
- Range mode: a tap before the start, or after a completed range, starts a new range.
````

- [ ] **Step 5: Run the full verification**

Run: `pnpm verify`
Expected: typecheck exits 0. Jest: every suite passes in `ios` and `android`, and the pure `*.test.ts` suites pass in `web`.

- [ ] **Step 6: Checkpoint (no commit)** — `git status --short`.

---

### Task 15: Example app + parity harness (Maestro + Playwright)

**Files:**
- Modify: `pnpm-workspace.yaml`, `.gitignore`
- Create: `example/package.json`, `example/app.json`, `example/index.ts`, `example/App.tsx`, `example/babel.config.js`, `example/metro.config.js`, `example/tailwind.config.js`, `example/global.css`, `example/nativewind-env.d.ts`, `example/tsconfig.json`, `example/e2e/parity.yaml`, `example/playwright.config.ts`, `example/e2e-web/parity.spec.ts`

**Interfaces:**
- Consumes: the public API (Task 14); `tailwind.preset.js` (Task 1).
- Produces: a parity screen with fixed data. The same testIDs are driven by Maestro (iOS/Android) and Playwright (web, via `data-testid`), and both save screenshots at a 390×844 logical viewport for side-by-side review.

The root `tsconfig.json` and `jest.config.js` only include `src/`, so `example/` doesn't affect `pnpm verify`.

- [ ] **Step 1: Modify `pnpm-workspace.yaml`**

```yaml
nodeLinker: hoisted
packages:
  - example
```

- [ ] **Step 2: Create `example/package.json`**

```json
{
  "name": "react-native-dateflow-example",
  "private": true,
  "version": "0.0.0",
  "main": "index.ts",
  "scripts": {
    "start": "expo start",
    "ios": "expo run:ios",
    "android": "expo run:android",
    "web": "expo start --web",
    "typecheck": "tsc --noEmit",
    "export:web": "expo export --platform web",
    "e2e:native": "maestro test e2e/parity.yaml",
    "e2e:web": "playwright test"
  },
  "dependencies": {
    "@date-fns/tz": "^1.5.0",
    "date-fns": "^4.4.0",
    "expo": "~57.0.25",
    "expo-haptics": "~57.0.3",
    "expo-status-bar": "~57.0.2",
    "nativewind": "^4.2.7",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "react-native": "0.86.3",
    "react-native-dateflow": "link:..",
    "react-native-gesture-handler": "~2.32.0",
    "react-native-reanimated": "4.5.1",
    "react-native-web": "~0.21.0",
    "react-native-worklets": "0.10.1",
    "tailwindcss": "^3.4.19"
  },
  "devDependencies": {
    "@playwright/test": "^1.56.0",
    "@types/react": "~19.2.2",
    "typescript": "~6.0.3"
  }
}
```

Version note: after `pnpm install`, run `pnpm --filter react-native-dateflow-example exec expo install --check`. If Expo reports a different patch for `expo-status-bar` or any other package, use the version it prints. Don't guess.

- [ ] **Step 3: Create `example/app.json`, `example/index.ts`, `example/babel.config.js`, `example/nativewind-env.d.ts`, `example/tsconfig.json`**

`example/app.json`:
```json
{
  "expo": {
    "name": "react-native-dateflow-example",
    "slug": "react-native-dateflow-example",
    "scheme": "react-native-dateflow",
    "userInterfaceStyle": "automatic",
    "ios": { "bundleIdentifier": "dev.dateflow.example" },
    "android": { "package": "dev.dateflow.example", "edgeToEdgeEnabled": true },
    "web": { "bundler": "metro", "output": "single" }
  }
}
```

`example/index.ts`:
```ts
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
```

`example/babel.config.js`:
```js
/** Standard NativeWind host config; it also compiles the library source from ../src. */
module.exports = function babelConfig(api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
  };
};
```

`example/nativewind-env.d.ts`:
```ts
/// <reference types="nativewind/types" />
```

`example/tsconfig.json`:
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": { "strict": true, "noUncheckedIndexedAccess": true, "jsx": "react-jsx" },
  "include": ["App.tsx", "index.ts", "nativewind-env.d.ts", "e2e-web", "playwright.config.ts"]
}
```

- [ ] **Step 4: Create `example/metro.config.js`, `example/tailwind.config.js`, `example/global.css`**

`example/metro.config.js`:
```js
/**
 * Resolves `react-native-dateflow` to the repo root source, and keeps a single
 * React/RN copy (hoisted root node_modules).
 */
const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const repoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);
config.watchFolders = [repoRoot];
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules'), path.resolve(repoRoot, 'node_modules')];
config.resolver.extraNodeModules = { 'react-native-dateflow': repoRoot };

module.exports = withNativeWind(config, { input: './global.css', inlineRem: 16 });
```

`example/tailwind.config.js`:
```js
/** Host config: scans the library source and uses its preset (exactly what the README tells consumers to do). */
module.exports = {
  darkMode: 'class',
  content: ['./App.tsx', '../src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset'), require('../tailwind.preset.js')],
  theme: { extend: {} },
  plugins: [],
};
```

`example/global.css` (a host with its **own** tokens: blue primary, to show that inheritance works):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --primary: 221 83% 53%;
  --primary-foreground: 210 40% 98%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --accent: 214 95% 93%;
  --accent-foreground: 222 47% 11%;
  --border: 214 32% 91%;
  --radius: 12px;
}

.dark:root {
  --background: 222 47% 7%;
  --foreground: 210 40% 98%;
  --primary: 217 91% 60%;
  --primary-foreground: 222 47% 11%;
  --muted: 217 33% 17%;
  --muted-foreground: 215 20% 65%;
  --accent: 217 33% 22%;
  --accent-foreground: 210 40% 98%;
  --border: 217 33% 20%;
}
```

- [ ] **Step 5: Create `example/App.tsx`** (the parity screen, with fixed data so screenshots are deterministic)

```tsx
/**
 * Parity screen. Every value is fixed (Sep 2026, 14:45) so iOS / Android / Web
 * screenshots can be compared pixel for pixel.
 */
import './global.css';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Calendar, DatePicker, DateTimePicker, TimePicker, type DateRange } from 'react-native-dateflow';

const SEP_2026 = new Date(2026, 8, 1);
const FIXED = new Date(2026, 8, 29, 14, 45);

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="text-xs font-semibold uppercase text-muted-foreground">{title}</Text>
      {children}
    </View>
  );
}

export default function App() {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const [single, setSingle] = useState<Date | null>(null);
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  const [time, setTime] = useState<Date>(FIXED);
  const [date, setDate] = useState<Date | null>(FIXED);
  const [when, setWhen] = useState<Date | null>(FIXED);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      {/* ScrollView only holds the demo page; the library itself never uses one. */}
      <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-6 px-4 pb-16 pt-14">
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-semibold text-foreground">react-native-dateflow parity</Text>
          <Pressable testID="toggle-theme" onPress={toggleColorScheme} className="rounded-lg border border-border px-3 py-2">
            <Text className="text-sm text-foreground">{colorScheme === 'dark' ? 'Light' : 'Dark'}</Text>
          </Pressable>
        </View>

        <Section title="Calendar · single">
          <Calendar defaultMonth={SEP_2026} value={single} onChange={setSingle} testID="calendar" />
        </Section>

        <Section title="Calendar · range">
          <Calendar mode="range" defaultMonth={SEP_2026} value={range} onChange={setRange} testID="range" />
        </Section>

        <Section title="TimePicker · wheel 12h">
          <TimePicker value={time} onChange={setTime} testID="wheel" />
        </Section>

        <Section title="TimePicker · inline 24h / 15 min">
          <TimePicker variant="inline" hourFormat="24h" minuteStep={15} value={time} onChange={setTime} testID="inline" />
        </Section>

        <Section title="DatePicker · sheet">
          <DatePicker presentation="sheet" value={date} onChange={setDate} testID="date-picker" />
        </Section>

        <Section title="DateTimePicker · tabs">
          <DateTimePicker value={when} onChange={setWhen} minuteStep={5} testID="dtp" />
        </Section>
      </ScrollView>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 6: Create `example/e2e/parity.yaml`** (Maestro, iOS + Android)

```yaml
appId: dev.dateflow.example
---
- launchApp:
    clearState: true
- assertVisible: "September"
- takeScreenshot: parity-01-initial
- tapOn:
    id: "calendar-next"
- assertVisible: "October"
- tapOn:
    id: "calendar-day-2026-10-14"
- takeScreenshot: parity-02-calendar-selected
- tapOn:
    id: "calendar-month-label"
- takeScreenshot: parity-03-month-jumper
- tapOn:
    id: "calendar-month-2"
- assertVisible: "March"
- scrollUntilVisible:
    element:
      id: "date-picker-trigger"
- tapOn:
    id: "date-picker-trigger"
- assertVisible:
    id: "date-picker-sheet"
- takeScreenshot: parity-04-sheet
- tapOn:
    id: "date-picker-backdrop"
- tapOn:
    id: "toggle-theme"
- takeScreenshot: parity-05-dark
```

- [ ] **Step 7: Create `example/playwright.config.ts` and `example/e2e-web/parity.spec.ts`**

`example/playwright.config.ts`:
```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-web',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: 'http://localhost:8081',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
  },
  webServer: {
    command: 'pnpm expo start --web --port 8081',
    url: 'http://localhost:8081',
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
```

`example/e2e-web/parity.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

test('parity flow (mirrors e2e/parity.yaml)', async ({ page }) => {
  await page.goto('/');
  const id = (testId: string) => page.getByTestId(testId);

  await expect(page.getByText('September').first()).toBeVisible();
  await page.screenshot({ path: 'screenshots/parity-01-initial.png' });

  await id('calendar-next').click();
  await expect(page.getByText('October').first()).toBeVisible();
  await id('calendar-day-2026-10-14').click();
  await page.screenshot({ path: 'screenshots/parity-02-calendar-selected.png' });

  await id('calendar-month-label').click();
  await page.screenshot({ path: 'screenshots/parity-03-month-jumper.png' });
  await id('calendar-month-2').click();
  await expect(page.getByText('March').first()).toBeVisible();

  await id('date-picker-trigger').scrollIntoViewIfNeeded();
  await id('date-picker-trigger').click();
  await expect(id('date-picker-sheet')).toBeVisible();
  await page.screenshot({ path: 'screenshots/parity-04-sheet.png' });
  await id('date-picker-backdrop').click({ position: { x: 20, y: 20 } });

  await id('toggle-theme').click();
  await page.screenshot({ path: 'screenshots/parity-05-dark.png' });
});

test('mouse wheel steps the time wheel', async ({ page }) => {
  await page.goto('/');
  const hours = page.getByTestId('wheel-hours');
  await hours.scrollIntoViewIfNeeded();
  const before = await hours.getAttribute('aria-valuetext');
  await hours.hover();
  await page.mouse.wheel(0, 40);
  await expect(hours).not.toHaveAttribute('aria-valuetext', before ?? '');
});
```

Append these lines to the root `.gitignore`:
```
example/screenshots/
example/test-results/
example/playwright-report/
```

- [ ] **Step 8: Install and verify the example compiles for every platform**

Run: `pnpm install && pnpm --filter react-native-dateflow-example exec expo install --check`
Expected: no dependency mismatches. If it reports any, apply the versions it suggests.

Run: `pnpm --filter react-native-dateflow-example typecheck`
Expected: exit 0.

Run: `pnpm --filter react-native-dateflow-example export:web`
Expected: the web bundle builds into `example/dist/` with no "Unable to resolve" errors (this proves the Metro link and NativeWind setup).

- [ ] **Step 9: Run the parity harness (manual, needs a simulator/emulator + Maestro CLI + Playwright browsers)**

1. Web: `pnpm --filter react-native-dateflow-example exec playwright install chromium`, then `pnpm --filter react-native-dateflow-example e2e:web`.
   Expected: 2 passed, and PNGs in `example/screenshots/`.
2. iOS: `pnpm --filter react-native-dateflow-example ios` (the dev build), then `pnpm --filter react-native-dateflow-example e2e:native`.
   Expected: the flow passes, and screenshots are written to the working directory.
3. Android: `pnpm --filter react-native-dateflow-example android`, then `pnpm --filter react-native-dateflow-example e2e:native`.
   Expected: the same.
4. Compare `parity-0N-*` across the three platforms side by side. Any difference in layout, spacing, colour or radius is a bug; fix it in the library, not the example. Font rasterisation differences are expected until a custom font is loaded (README "Pixel parity checklist").

No containers are needed. If any tooling ever needs one, use podman, never docker or colima.

- [ ] **Step 10: Final verification + checkpoint (no commit)**

Run: `pnpm verify && pnpm --filter react-native-dateflow-example typecheck`
Expected: all green.
Run: `git status --short`
Expected: only untracked or modified project files. Do **not** commit.
