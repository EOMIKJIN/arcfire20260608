// ============================================================
// 행성 허브 스캔 잠금 해제 — 행성 id 단위 세션 메모 (단일 정본)
//
// 초기화(잠금) 허용:
//   1) 스캔 버튼 재클릭 — setPlanetHubScanUnlocked(pid, false)
//   2) 은하계 출발 — clearPlanetHubScanUnlockOnDeparture(pid)
//
// 그 외(전투 토글·route blur·prop flicker·재마운트) 자동 초기화 금지.
// ============================================================

const unlockedByPlanetId = new Map<string, boolean>();

type ScanUnlockListener = () => void;
const listeners = new Set<ScanUnlockListener>();

function emitPlanetHubScanUnlockChanged(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribePlanetHubScanUnlock(listener: ScanUnlockListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isPlanetHubScanUnlocked(planetId: string | null | undefined): boolean {
  if (!planetId) return false;
  return unlockedByPlanetId.get(planetId) === true;
}

export function setPlanetHubScanUnlocked(planetId: string | null | undefined, unlocked: boolean): void {
  if (!planetId) return;
  const prev = isPlanetHubScanUnlocked(planetId);
  if (unlocked) {
    unlockedByPlanetId.set(planetId, true);
  } else {
    unlockedByPlanetId.delete(planetId);
  }
  if (prev !== isPlanetHubScanUnlocked(planetId)) {
    emitPlanetHubScanUnlockChanged();
  }
}

/** 은하계 출발(재착륙 시 스캔 재요구) — 무역소·조선소 등 시설 이동에서는 호출하지 않는다. */
export function clearPlanetHubScanUnlockOnDeparture(planetId: string | null | undefined): void {
  setPlanetHubScanUnlocked(planetId, false);
}

/** 계정 초기화 — session Map 전량 purge */
export function purgeAllPlanetHubScanUnlockState(): void {
  if (unlockedByPlanetId.size === 0) return;
  unlockedByPlanetId.clear();
  emitPlanetHubScanUnlockChanged();
}
