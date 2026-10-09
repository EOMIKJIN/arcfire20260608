module.exports = function (api) {
  api.cache(true);
  const plugins = [];
  // 성능 측정 전용 release 빌드(EXPO_PUBLIC_ARC_PERF_LOG=1)는 console 을 남긴다 — [arc-hitch-min] 계측 확인용.
  if (process.env.NODE_ENV === 'production' && process.env.EXPO_PUBLIC_ARC_PERF_LOG !== '1') {
    plugins.push('transform-remove-console');
  }
  plugins.push('react-native-reanimated/plugin');
  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
