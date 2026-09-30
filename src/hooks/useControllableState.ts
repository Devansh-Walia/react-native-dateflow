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
