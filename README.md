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

Limitation: `themeOverride` (like `theme` and `useFallbackTokens`) makes the picker inject its own resolved token values on its root, so inside that subtree they replace your host CSS variables. With `themeOverride` alone you get the built-in palette for that mode, not your host's dark tokens; pair it with `theme` to supply your own colours. It only affects dateflow components and does not change NativeWind's global colour scheme.

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
