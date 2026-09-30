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
