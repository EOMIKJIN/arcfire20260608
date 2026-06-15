const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const nodeModules = path.join(projectRoot, 'node_modules');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// react-native/node_modules/pretty-format → ansi-styles (npm hoist 시 Metro 누락 방지)
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  'ansi-styles': path.join(nodeModules, 'ansi-styles'),
  'color-convert': path.join(nodeModules, 'color-convert'),
};

module.exports = config;
