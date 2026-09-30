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
