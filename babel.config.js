/**
 * Babel config used only for this repo's tests.
 * Consumers compile `src/` with their own Babel config.
 * In tests we leave out NativeWind so `className` stays a plain string prop that
 * tests can assert on. Outside tests we mirror a normal NativeWind host.
 */
module.exports = function babelConfig(api) {
  const isTest = api.env('test');
  return {
    presets: [
      ['babel-preset-expo', isTest ? {} : { jsxImportSource: 'nativewind' }],
      ...(isTest ? [] : ['nativewind/babel']),
    ],
  };
};
