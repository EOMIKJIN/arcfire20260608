/**
 * Metro / DevSettings reload 직전 Skia·허브 세션 정리.
 *
 * logcat 근거(2026-06-19): FinalizerDaemon → JsiSkImage::~JsiSkImage (librnskia)
 * — reload 시 Skia Image 노드가 살아 있는 채 HostObject 가 GC 되며 SIGSEGV.
 *
 * Android: react-native 패치가 reload 350ms 전 `ArcfirePrepareMetroReload` 이벤트 emit.
 * JS: DevSettings.reload 래핑 + Skia Canvas mount gate.
 *
 * 2026-10-09 (SDK 54 · old arch): 같은 프로세스 안 JS 전체 리로드는 expo-modules-core 가 이전 런타임의
 * HybridData 를 건드려 SIGABRT 로 죽는다(JNI 「field operation on NULL object」 · expo::LazyObject::get ·
 * 직전 「Cannot find native module ExpoNavigationBar/ExpoFontLoader」 · 16:06·16:57 2/2 재현, 3.0.30 최신).
 * → dev 기본: 전체 리로드 대신 앱 프로세스를 재시작한다(restartAppAsync = 런처 cold start + exitProcess).
 *   Fast Refresh(컴포넌트 HMR)는 그대로다. 예전 동작이 필요하면 EXPO_PUBLIC_ARC_DEV_RELOAD_INPLACE=1 로 Metro 재시작.
 */
import { DeviceEventEmitter, DevSettings, InteractionManager } from 'react-native';
import { restartNativeAppAsync } from 'arcfire-native-memory';
import { releaseCombatStageMemory, releaseGalaxyMapStageMemory, releasePlanetHubStageMemory } from './stageMemoryRelease';
import { installDevLoadingViewSuppress } from './devLoadingViewSuppress';

const PREPARE_EVENT = 'ArcfirePrepareMetroReload';
const PREPARE_DELAY_MS = 350;
/** Fast Refresh 직후 useFocusEffect blur/route_blur 연쇄 억제 (logcat 22:19:50~22:20:01) */
const FAST_REFRESH_ROUTE_BLUR_SKIP_MS = 20_000;

let skiaMountBlocked = false;
let prepareInFlight = false;
let routeBlurSkipUntilMs = 0;
const gateListeners = new Set<() => void>();

type HotDisposeModule = { hot?: { dispose: (cb: () => void) => void } };

function notifyGateListeners(): void {
  gateListeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* ignore */
    }
  });
}

/** 같은 프로세스 리로드 직전 STAGE 세션 해제(Skia HostObject GC SIGSEGV 회피) */
function releaseDevStagesForReload(reason: string): void {
  try {
    releasePlanetHubStageMemory(null);
    releaseGalaxyMapStageMemory({ reason: 'route_blur' });
    releaseCombatStageMemory();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`[devMetroReloadGuard] cleanup (${reason})`, e);
  }
}

/**
 * reload 직전 — Skia Canvas 언마운트 + STAGE 1 세션 dispose.
 * releaseStages=false(Fast Refresh · hmr_dispose): 게이트만 닫는다. 같은 프로세스에서 화면이 그대로 남으므로
 * 허브 세션(orbit clock 토큰 · 5분/15분 회수 타이머)을 해제하면 다시 등록되지 않는다
 * (2026-10-09 19:45 hmr_dispose 뒤 hub_periodic_soft 중단 실측).
 */
export function prepareDevMetroReload(reason = 'metro_reload', opts?: { releaseStages?: boolean }): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  if (prepareInFlight) return;
  prepareInFlight = true;
  skiaMountBlocked = true;
  routeBlurSkipUntilMs = Date.now() + FAST_REFRESH_ROUTE_BLUR_SKIP_MS;
  notifyGateListeners();

  if (opts?.releaseStages !== false) releaseDevStagesForReload(reason);

  // eslint-disable-next-line no-console
  console.log(`[devMetroReloadGuard] prepared for reload (${reason})`);
}

export function isDevMetroReloadPrepareInFlight(): boolean {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return false;
  return prepareInFlight || skiaMountBlocked || Date.now() < routeBlurSkipUntilMs;
}

/** Fast Refresh — module 교체 직전 dispose 에서 prepare (DevSettings.reload 미경유 HMR) */
export function registerDevHotModuleDisposeGuard(owner: string): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  const hot = (module as HotDisposeModule).hot;
  if (!hot?.dispose) return;
  hot.dispose(() => {
    prepareDevMetroReload(`hmr_dispose:${owner}`, { releaseStages: false });
  });
}

/** reload 후 허브 재진입 시 Skia mount 재허용 */
export function ackDevMetroReloadMount(): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  skiaMountBlocked = false;
  prepareInFlight = false;
  notifyGateListeners();
}

export function isDevSkiaMountAllowed(): boolean {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return true;
  return !skiaMountBlocked;
}

export function subscribeDevSkiaMountGate(listener: () => void): () => void {
  gateListeners.add(listener);
  return () => {
    gateListeners.delete(listener);
  };
}

/** EXPO_PUBLIC_* 는 번들 시점에 인라인된다 — 값을 바꾸면 Metro 재시작 필요 */
const DEV_RELOAD_AS_PROCESS_RESTART = process.env.EXPO_PUBLIC_ARC_DEV_RELOAD_INPLACE !== '1';

/**
 * 전체 리로드 대신 프로세스 재시작. 재시작을 먼저 부른다 — 네이티브 패키저 리로드는 350ms 뒤 시작되므로
 * 그 창을 허브·지도 정리(prepare)로 쓰지 않는다. 프로세스가 끝나면 정리는 필요 없다.
 * 재시작을 못 하면 그때 prepare 후 원래 리로드(fallback).
 */
function restartProcessInsteadOfReload(reason: string, fallback?: () => void): void {
  void restartNativeAppAsync().then((r) => {
    if (r.ok) return;
    // eslint-disable-next-line no-console
    console.warn(`[devMetroReloadGuard] restart failed (${r.reason ?? 'unknown'}) → in-place reload`);
    prepareDevMetroReload(reason);
    // 직전 hmr_dispose(게이트만)로 prepareInFlight 가 남아 있으면 위 prepare 가 건너뛰어진다 → 해제는 강제한다.
    releaseDevStagesForReload(reason);
    fallback?.();
  });
  // eslint-disable-next-line no-console
  console.log(`[devMetroReloadGuard] full reload → app process restart (${reason})`);
}

function patchDevSettingsReload(): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  const settings = DevSettings as typeof DevSettings & {
    reload: (reason?: string) => void;
  };
  if ((settings as { __arcfirePatched?: boolean }).__arcfirePatched) return;

  const original = settings.reload.bind(settings);
  settings.reload = (reason?: string) => {
    if (DEV_RELOAD_AS_PROCESS_RESTART) {
      restartProcessInsteadOfReload(reason ?? 'DevSettings.reload', () => original(reason));
      return;
    }
    prepareDevMetroReload(reason ?? 'DevSettings.reload');
    setTimeout(() => {
      original(reason);
    }, PREPARE_DELAY_MS);
  };
  (settings as { __arcfirePatched?: boolean }).__arcfirePatched = true;
}

/**
 * Fast Refresh(같은 프로세스 HMR) 완료 → Skia mount 게이트 재개방.
 * hmr_dispose 가 prepare 로 게이트를 닫는데, 화면이 다시 마운트되지 않으면 ack 할 주체가 없어
 * 드론 꼬리·폭발 FX·성운 dodge Skia 가 계속 내려가 있었다(2026-10-09 19:45 ArcCoreHub 저장 뒤 gpuLayers=-).
 * 모듈 교체 순간의 차단(SIGSEGV 회피)은 유지하고, 교체가 끝나면(onFastRefresh) 연다.
 */
function patchDevSettingsFastRefresh(): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  const settings = DevSettings as typeof DevSettings & {
    onFastRefresh?: () => void;
    __arcfireFastRefreshPatched?: boolean;
  };
  if (settings.__arcfireFastRefreshPatched || typeof settings.onFastRefresh !== 'function') return;
  const original = settings.onFastRefresh.bind(settings);
  settings.onFastRefresh = () => {
    original();
    InteractionManager.runAfterInteractions(() => {
      ackDevMetroReloadMount();
    });
  };
  settings.__arcfireFastRefreshPatched = true;
}

let installed = false;

/** app/_layout.tsx 부트 시 1회 */
export function installDevMetroReloadGuard(): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__ || installed) return;
  installed = true;

  installDevLoadingViewSuppress();
  patchDevSettingsReload();
  patchDevSettingsFastRefresh();

  DeviceEventEmitter.addListener(PREPARE_EVENT, () => {
    // 네이티브 패키저 리로드(Metro 'r')는 350ms 뒤 네이티브가 직접 실행한다 → 그 전에 프로세스를 바꾼다.
    if (DEV_RELOAD_AS_PROCESS_RESTART) {
      restartProcessInsteadOfReload('native_packager_reload');
      return;
    }
    prepareDevMetroReload('native_packager_reload');
  });

  InteractionManager.runAfterInteractions(() => {
    ackDevMetroReloadMount();
  });
}
