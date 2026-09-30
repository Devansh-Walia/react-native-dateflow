/**
 * Global test setup: gesture-handler + Reanimated 4 test mode, plus mocks for
 * expo-haptics and NativeWind (colour scheme is switchable, and vars() is observable).
 */
import 'react-native-gesture-handler/jestSetup';
import { setUpTests } from 'react-native-reanimated';

jest.mock('react-native-worklets', () =>
  jest.requireActual('react-native-worklets/lib/module/mock'),
);

setUpTests();

jest.mock('expo-haptics', () => ({
  selectionAsync: jest.fn(() => Promise.resolve()),
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
}));

jest.mock('nativewind', () => {
  const state: { colorScheme: 'light' | 'dark' } = { colorScheme: 'light' };
  return {
    __setColorScheme: (mode: 'light' | 'dark') => {
      state.colorScheme = mode;
    },
    useColorScheme: () => ({
      colorScheme: state.colorScheme,
      setColorScheme: jest.fn(),
      toggleColorScheme: jest.fn(),
    }),
    vars: (variables: Record<string, string>) => ({ __vars: variables }),
  };
});
