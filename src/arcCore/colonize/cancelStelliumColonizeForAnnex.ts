/**
 * 편입된 행성으로 가던 개척 도착을 끊는다.
 * 성공(success) 장부는 남긴다. 틱·프레임 루프 아님.
 */
import { resolveHoldFactionSide } from '../territorial/territorialFactionSide';
import { useClanWarFoundationStore } from '../../store/clanWarFoundationStore';
import {
  replaceStelliumColonizeRecords,
  useStelliumColonizeStore,
} from '../../store/stelliumColonizeStore';
import { countInFlight } from './stelliumColonizeEngine';
import { seedFleetReadyAtMs } from './stelliumColonizeDispatch';
import { resolveStelliumColonizeFleet } from './stelliumColonizeFleet';
import { resolveStelliumColonizePolicy } from './stelliumColonizePolicy';
import { collectAnnexedColonizeArrivalIds } from './stelliumColonizeAnnexGuard';
import {
  isStelliumColonizeActivePhase,
  type StelliumColonizeRecord,
} from './stelliumColonizeTypes';

export function isStelliumColonizeBlockingAnnex(planetId: string): boolean {
  const id = String(planetId ?? '').trim();
  if (!id) return false;
  if (!resolveStelliumColonizePolicy().enabled) return false;
  const row = useStelliumColonizeStore.getState().byPlanetId[id];
  if (!row) return false;
  return row.phase !== 'success';
}

function isAnnexedBlueHold(planetId: string): boolean {
  const hold = useClanWarFoundationStore.getState().getHold(planetId);
  return resolveHoldFactionSide(hold?.occupierClanId) === 'BLUE';
}

function clearOutpostWatch(planetId: string): void {
  try {
    const { clearStelliumColonizeOutpostWatch } =
      require('./tickStelliumColonizeRealtime') as typeof import('./tickStelliumColonizeRealtime');
    clearStelliumColonizeOutpostWatch(planetId);
  } catch {
    /* 타이머 미기동 */
  }
}

/** 진행 중 장부만 제거. success 는 유지. 활성 척 슬롯은 즉시 반환. */
export function cancelStelliumColonizeArrivals(planetIds: readonly string[]): boolean {
  if (planetIds.length === 0) return false;
  const state = useStelliumColonizeStore.getState();
  const next: Record<string, StelliumColonizeRecord> = { ...state.byPlanetId };
  let droppedActive = 0;
  let changed = false;
  for (let i = 0; i < planetIds.length; i += 1) {
    const id = planetIds[i];
    const row = next[id];
    if (!row || row.phase === 'success') continue;
    if (isStelliumColonizeActivePhase(row.phase)) droppedActive += 1;
    delete next[id];
    changed = true;
    clearOutpostWatch(id);
  }
  if (!changed) return false;
  const fleet = resolveStelliumColonizeFleet(resolveStelliumColonizePolicy());
  const cap = Math.max(1, fleet.operationalCap);
  const ready = seedFleetReadyAtMs(
    state.fleetReadyAtMs,
    cap,
    countInFlight(state.byPlanetId),
  );
  const nowMs = Date.now();
  for (let i = 0; i < droppedActive; i += 1) ready.push(nowMs);
  replaceStelliumColonizeRecords(next, true, ready);
  return true;
}

export function cancelStelliumColonizeArrival(planetId: string): boolean {
  const id = String(planetId ?? '').trim();
  if (!id) return false;
  return cancelStelliumColonizeArrivals([id]);
}

export function cancelStelliumColonizeArrivalsForAnnexedHolds(): boolean {
  const ids = collectAnnexedColonizeArrivalIds(
    useStelliumColonizeStore.getState().byPlanetId,
    isAnnexedBlueHold,
  );
  return cancelStelliumColonizeArrivals(ids);
}
