/**
 * Metro Fast Refresh 시 화면 상단 "Refreshing..." 막대 억제.
 * __DEV__ 전용 — 릴리스 번들에는 이 require가 없다.
 * HMRClient는 `require('DevLoadingView').default`를 붙잡는다.
 * 모듈 네임스페이스에 noop을 달면 default.showMessage는 그대로라 막대가 남는다.
 * 없는 경로를 optional require하면 Metro가 모듈 id를 undefined로 두고,
 * try/catch가 막지 못하는 uncaught LogBox가 뜬다. 이 경로는 RN 0.79에 있다.
 */
type DevLoadingViewApi = {
  showMessage?: (message: string, type: 'load' | 'refresh') => void;
  hide?: () => void;
};

export function installDevLoadingViewSuppress(): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const loaded = require('react-native/Libraries/Utilities/DevLoadingView') as DevLoadingViewApi & {
      default?: DevLoadingViewApi;
    };
    const view = loaded.default?.showMessage ? loaded.default : loaded;
    const hideNow = view.hide;
    const noop = (): void => {};
    view.showMessage = noop;
    view.hide = noop;
    hideNow?.();
  } catch {
    /* ignore — RN 내부 경로 변경 시 no-op */
  }
}

installDevLoadingViewSuppress();
