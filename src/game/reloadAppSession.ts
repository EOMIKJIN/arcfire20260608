import { DevSettings, Platform } from 'react-native';
import { arcCoreHub } from '../arcCore/ArcCoreHub';
import { persistArcCoreWallClockLeftActiveNow } from '../arcCore/arcCoreWallClockSessionPersistence';
import { restartNativeAppAsync } from 'arcfire-native-memory';
import { releasePlanetHubStageMemory } from './stageMemoryRelease';
import { usePlayerStore } from '../store/playerStore';
import { useUserSessionStore } from '../store/userSessionStore';
import { useAccountProfileStore } from '../store/accountProfileStore';
import { useItemLedgerStore } from '../store/itemLedgerStore';

let reloadInFlight = false;

/** Metro reload·idle 재시작 공통 — Skia·허브·ArcCore 정리 후 JS/액티비티 재기동 */
export async function prepareAppSessionReload(reason: string): Promise<void> {
  if (reloadInFlight) return;
  reloadInFlight = true;
  try {
    useUserSessionStore.getState().finalizeForegroundSlice();
    await persistArcCoreWallClockLeftActiveNow();
    const planetId = usePlayerStore.getState().player?.currentPlanetId ?? null;
    try {
      releasePlanetHubStageMemory(planetId);
    } catch {
      /* best-effort */
    }
    try {
      arcCoreHub.stop();
    } catch {
      /* best-effort */
    }
    await Promise.all([
      useUserSessionStore.getState().persistUserSession(),
      useItemLedgerStore.getState().persistItemLedger(),
      useAccountProfileStore.getState().persistAccountProfiles(),
    ]).catch(() => {
      /* 재시작 직전 persist 실패 — 네이티브 재기동 후 로컬 데이터로 복구 */
    });
    // eslint-disable-next-line no-console
    if (__DEV__) console.log(`[reloadAppSession] prepared (${reason})`);
  } catch (e) {
    reloadInFlight = false;
    throw e;
  }
}

export async function reloadAppSessionAsync(reason = 'idle_session_restart'): Promise<boolean> {
  await prepareAppSessionReload(reason);

  if (__DEV__ && typeof DevSettings.reload === 'function') {
    setTimeout(() => {
      DevSettings.reload(`arcfire:${reason}`);
    }, 350);
    return true;
  }

  const native = await restartNativeAppAsync();
  if (native.ok) return true;

  if (Platform.OS === 'android') {
    // eslint-disable-next-line no-console
    console.warn('[reloadAppSession] native restart unavailable', native.reason);
  }
  reloadInFlight = false;
  return false;
}
