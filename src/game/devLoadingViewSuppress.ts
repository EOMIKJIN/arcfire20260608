/**
 * Metro 번들 로드·HMR 시 화면 상단 회색 DevLoadingView("Loading from…") 깜빡임 억제.
 * __DEV__ 전용 — 릴리스 번들에는 LoadingView 경로가 없다.
 */
export function installDevLoadingViewSuppress(): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const LoadingView = require('react-native/Libraries/Utilities/LoadingView') as {
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
