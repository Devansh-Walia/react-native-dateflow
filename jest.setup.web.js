/**
 * Web-only jest pre-setup (listed in `setupFiles`, so it runs before any module
 * import). jsdom has no `window.matchMedia`, which react-native-reanimated reads
 * at import time; this stub reports "no match" for every query.
 */
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (media) => ({
    matches: false,
    media,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
