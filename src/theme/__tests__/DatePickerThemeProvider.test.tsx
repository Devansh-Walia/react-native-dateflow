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
