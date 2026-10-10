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

// 네이티브 빌드 산출물(android/build · .cxx · .gradle)은 감시·해석 제외 — release 빌드 중 임시 폴더가
// 생겼다 지워지면 Metro 파일 감시기가 ENOENT로 종료됐다(2026-10-10 11:49). JS 소스는 이 폴더에 없다.
const nativeBuildDirs = /[\\/]android[\\/](?:app[\\/])?(?:build|\.cxx|\.gradle)[\\/].*/;
const existingBlockList = config.resolver.blockList;
config.resolver.blockList = [
  ...(Array.isArray(existingBlockList) ? existingBlockList : existingBlockList ? [existingBlockList] : []),
  nativeBuildDirs,
];

module.exports = config;
