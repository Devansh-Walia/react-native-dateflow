/**
 * Host Tailwind config: scans the library source and uses its preset.
 * Paths are relative to the repo for the workspace; consumers instead use
 * `require('react-native-dateflow/tailwind-preset')` and scan
 * `./node_modules/react-native-dateflow/src/**` (exactly what the README tells them to do).
 */
module.exports = {
  darkMode: 'class',
  content: ['./App.tsx', '../src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset'), require('../tailwind.preset.js')],
  theme: { extend: {} },
  plugins: [],
};
