/**
 * Three projects so that parity is checked by the test run itself:
 * - ios / android: every test (pure + component)
 * - web: pure logic tests (core + theme); component tests there would need
 *   @testing-library/react instead of RNTL, and web visuals are covered by
 *   the Playwright parity spec in example/ (Task 15).
 */
const transformIgnorePatterns = [
  'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|react-native-.*|@react-native/.*|nativewind|react-native-css-interop|date-fns|@date-fns/.*))',
];

const shared = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transformIgnorePatterns,
};

const allTests = ['<rootDir>/src/**/__tests__/**/*.test.ts?(x)'];
const pureTests = ['<rootDir>/src/**/__tests__/**/*.test.ts'];

module.exports = {
  projects: [
    { ...shared, displayName: 'ios', preset: 'jest-expo/ios', testMatch: allTests },
    { ...shared, displayName: 'android', preset: 'jest-expo/android', testMatch: allTests },
    {
      ...shared,
      displayName: 'web',
      setupFiles: ['<rootDir>/jest.setup.web.js'],
      preset: 'jest-expo/web', testMatch: pureTests,
    },
  ],
};
