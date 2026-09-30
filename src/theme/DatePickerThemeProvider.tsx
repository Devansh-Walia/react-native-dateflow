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
