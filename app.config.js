const appJson = require('./app.json');
const pkg = require('./package.json');

function toAndroidVersionCode(version) {
  const [maj = '0', min = '0', patch = '0'] = String(version).split('.');
  const major = Number.parseInt(maj, 10) || 0;
  const minor = Number.parseInt(min, 10) || 0;
  const fix = Number.parseInt(patch, 10) || 0;
  return major * 10000 + minor * 100 + fix;
}

module.exports = ({ config }) => {
  const baseExpo = appJson.expo ?? {};
  const version = pkg.version ?? baseExpo.version ?? '0.0.0';
  const versionCode = toAndroidVersionCode(version);

  return {
    ...config,
    ...baseExpo,
    version,
    ios: {
      ...(baseExpo.ios ?? {}),
      buildNumber: String(versionCode),
    },
    android: {
      ...(baseExpo.android ?? {}),
      allowBackup: false,
      versionCode,
    },
    extra: {
      ...(baseExpo.extra ?? {}),
      appVersion: version,
      appVersionCode: versionCode,
    },
  };
};
