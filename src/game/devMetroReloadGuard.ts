/**
 * Metro / DevSettings reload 직전 Skia·허브 세션 정리.
 *
 * logcat 근거(2026-06-19): FinalizerDaemon → JsiSkImage::~JsiSkImage (librnskia)
 * — reload 시 Skia Image 노드가 살아 있는 채 HostObject 가 GC 되며 SIGSEGV.
 *
 * Android: react-native 패치가 reload 350ms 전 `ArcfirePrepareMetroReload` 이벤트 emit.
 * JS: DevSettings.reload 래핑 + Skia Canvas mount gate.
 */
import { DeviceEventEmitter, DevSettings, InteractionManager } from 'react-native';
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

/** reload 직전 — Skia Canvas 언마운트 + STAGE 1 세션 dispose */
export function prepareDevMetroReload(reason = 'metro_reload'): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  if (prepareInFlight) return;
  prepareInFlight = true;
  skiaMountBlocked = true;
  routeBlurSkipUntilMs = Date.now() + FAST_REFRESH_ROUTE_BLUR_SKIP_MS;
  notifyGateListeners();

  try {
    releasePlanetHubStageMemory(null);
    releaseGalaxyMapStageMemory({ reason: 'route_blur' });
    releaseCombatStageMemory();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`[devMetroReloadGuard] cleanup (${reason})`, e);
  }

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
    prepareDevMetroReload(`hmr_dispose:${owner}`);
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

function patchDevSettingsReload(): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__) return;
  const settings = DevSettings as typeof DevSettings & {
    reload: (reason?: string) => void;
  };
  if ((settings as { __arcfirePatched?: boolean }).__arcfirePatched) return;

  const original = settings.reload.bind(settings);
  settings.reload = (reason?: string) => {
    prepareDevMetroReload(reason ?? 'DevSettings.reload');
    setTimeout(() => {
      original(reason);
    }, PREPARE_DELAY_MS);
  };
  (settings as { __arcfirePatched?: boolean }).__arcfirePatched = true;
}

let installed = false;

/** app/_layout.tsx 부트 시 1회 */
export function installDevMetroReloadGuard(): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__ || installed) return;
  installed = true;

  installDevLoadingViewSuppress();
  patchDevSettingsReload();

  DeviceEventEmitter.addListener(PREPARE_EVENT, () => {
    prepareDevMetroReload('native_packager_reload');
  });

  InteractionManager.runAfterInteractions(() => {
    ackDevMetroReloadMount();
  });
}
