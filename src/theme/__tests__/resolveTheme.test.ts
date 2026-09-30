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
