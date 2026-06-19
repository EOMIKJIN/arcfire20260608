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
import { releasePlanetHubStageMemory } from './stageMemoryRelease';

const PREPARE_EVENT = 'ArcfirePrepareMetroReload';
const PREPARE_DELAY_MS = 350;

let skiaMountBlocked = false;
let prepareInFlight = false;
const gateListeners = new Set<() => void>();

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
  notifyGateListeners();

  try {
    releasePlanetHubStageMemory(null);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn(`[devMetroReloadGuard] cleanup (${reason})`, e);
  }

  // eslint-disable-next-line no-console
  console.log(`[devMetroReloadGuard] prepared for reload (${reason})`);
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

  patchDevSettingsReload();

  DeviceEventEmitter.addListener(PREPARE_EVENT, () => {
    prepareDevMetroReload('native_packager_reload');
  });

  InteractionManager.runAfterInteractions(() => {
    ackDevMetroReloadMount();
  });
}
