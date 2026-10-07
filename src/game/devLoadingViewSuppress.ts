/**
 * Metro 번들 로드·HMR 시 화면 상단 회색 DevLoadingView("Loading from…") 깜빡임 억제.
 * __DEV__ 전용 — 릴리스 번들에는 이 require가 없다.
 * RN 0.76에서 `Libraries/Utilities/LoadingView`는 `DevLoadingView`로 바뀌었다.
 * 없는 경로를 optional require하면 Metro가 모듈 id를 undefined로 두고,
 * try/catch가 막지 못하는 uncaught LogBox가 뜬다.
 */
export function installDevLoadingViewSuppress(): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const LoadingView = require('react-native/Libraries/Utilities/DevLoadingView') as {
      showMessage?: (message: string, type: 'load' | 'refresh') => void;
      hide?: () => void;
    };
    const noop = (): void => {};
    if (LoadingView.showMessage) {
      LoadingView.showMessage = noop;
    }
    if (LoadingView.hide) {
      LoadingView.hide = noop;
    }
  } catch {
    /* ignore — RN 내부 경로 변경 시 no-op */
  }
}
