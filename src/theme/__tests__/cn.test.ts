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
