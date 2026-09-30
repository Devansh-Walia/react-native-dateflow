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
