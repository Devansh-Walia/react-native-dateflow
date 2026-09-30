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
