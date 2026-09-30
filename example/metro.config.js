/**
 * Metro config for the example. Resolves `react-native-dateflow` to the repo root source
 * (consumers install it from npm instead) and keeps a single React/RN copy (hoisted root node_modules).
 */
const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const projectRoot = __dirname;
const repoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);
config.watchFolders = [repoRoot];
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules'), path.resolve(repoRoot, 'node_modules')];
config.resolver.extraNodeModules = { 'react-native-dateflow': repoRoot };

module.exports = withNativeWind(config, { input: './global.css', inlineRem: 16 });
