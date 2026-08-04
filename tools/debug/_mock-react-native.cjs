// react-native 최소 모크 — daily batch 재현 스크립트에서 import-time 크래시 회피용.
// UI 렌더 없음, 순수 로직 재현이 목적이라 대부분 no-op으로 충분.
function noop() {}
const listeners = new Map();

module.exports = {
  Platform: { OS: 'android', select: (obj) => obj.android ?? obj.default, Version: 34 },
  NativeModules: new Proxy({}, { get: () => new Proxy({}, { get: () => noop }) }),
  NativeEventEmitter: class {
    addListener() { return { remove: noop }; }
    removeAllListeners() {}
  },
  DeviceEventEmitter: { addListener: () => ({ remove: noop }), emit: noop },
  InteractionManager: {
    runAfterInteractions: (cb) => { const r = typeof cb === 'function' ? cb() : undefined; return { then: (f) => Promise.resolve(r).then(f), done: noop, cancel: noop }; },
    createInteractionHandle: () => 1,
    clearInteractionHandle: noop,
  },
  AppState: {
    currentState: 'active',
    addEventListener: (event, cb) => {
      const set = listeners.get(event) ?? new Set();
      set.add(cb);
      listeners.set(event, set);
      return { remove: () => set.delete(cb) };
    },
  },
  Dimensions: {
    get: () => ({ width: 1080, height: 2280, scale: 3, fontScale: 1 }),
    addEventListener: () => ({ remove: noop }),
  },
  StyleSheet: { create: (x) => x, flatten: (x) => x, absoluteFill: {}, hairlineWidth: 1 },
  Animated: new Proxy({}, { get: () => noop }),
  Easing: new Proxy({}, { get: () => ((x) => x) }),
  Alert: { alert: noop },
  PixelRatio: { get: () => 3, getFontScale: () => 1, roundToNearestPixel: (x) => x },
  Keyboard: { addListener: () => ({ remove: noop }), dismiss: noop },
  BackHandler: { addEventListener: () => ({ remove: noop }), exitApp: noop },
  Linking: { openURL: async () => {}, addEventListener: () => ({ remove: noop }) },
  UIManager: { measure: noop, measureInWindow: noop },
  I18nManager: { isRTL: false },
  Vibration: { vibrate: noop, cancel: noop },
  View: 'View',
  Text: 'Text',
  ScrollView: 'ScrollView',
  TouchableOpacity: 'TouchableOpacity',
  Image: 'Image',
  FlatList: 'FlatList',
  Pressable: 'Pressable',
  Modal: 'Modal',
  ActivityIndicator: 'ActivityIndicator',
  TextInput: 'TextInput',
  useWindowDimensions: () => ({ width: 1080, height: 2280, scale: 3, fontScale: 1 }),
  useColorScheme: () => 'dark',
};
