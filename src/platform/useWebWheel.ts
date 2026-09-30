/**
 * Mouse-wheel/trackpad support on web (touch pan already works via RNGH).
 * On react-native-web the host View ref is the DOM element.
 */
import { useEffect, useRef, type RefObject } from 'react';
import { Platform, type View } from 'react-native';

export function useWebWheel(ref: RefObject<View | null>, onDelta: (deltaY: number) => void): void {
  const handlerRef = useRef(onDelta);
  handlerRef.current = onDelta;

  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    const node = ref.current as unknown as HTMLElement | null;
    if (!node || typeof node.addEventListener !== 'function') return undefined;
    const listener = (event: WheelEvent) => {
      event.preventDefault();
      handlerRef.current(event.deltaY);
    };
    node.addEventListener('wheel', listener, { passive: false });
    return () => node.removeEventListener('wheel', listener);
  }, [ref]);
}
