// ============================================================
// 분쟁 순차 차례 + 플레이어 체류 → 허브 웨이브 이관 플래그 (세션 휘발 1슬롯).
//
// 계약(대표님 2026-08-18):
// - 블루 점령은 플레이어가 **없는** 행성의 NPC 자동전에서만 (RED/NEUTRAL → BLUE).
// - 착륙 중(currentPlanetId === duePlanetId)이면 NPC 퀵컴뱃 금지.
//   패스는 완료하지 않고 이 플래그만 세운다. 허브 컨트롤러가 웨이브를 시작하고,
//   웨이브 종료(승/패) 후 completeTerritorialPassAfterPlayerWave 가 커서를 전진한다.
// - persist/틱 할당 없음. 동일 행성 재요청은 revision을 올리지 않는다(60s probe 리렌더 방지).
// ============================================================

import { markTerritorialCombatPassCompleted } from './arcCoreTerritorialCombatState';

export type TerritorialPlayerWavePending = {
  planetId: string;
  systemId: string;
  campaignGroup?: string;
  orderIndex?: number;
  passIntervalSec: number;
  requestedAtMs: number;
};

type PendingListener = () => void;

let pending: TerritorialPlayerWavePending | null = null;
let revision = 0;
const listeners = new Set<PendingListener>();

function bumpRevision(): void {
  revision += 1;
  for (const listener of listeners) {
    listener();
  }
}

export function getTerritorialPlayerWavePendingRevision(): number {
  return revision;
}

export function subscribeTerritorialPlayerWavePending(listener: PendingListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getTerritorialPlayerWavePending(): TerritorialPlayerWavePending | null {
  return pending;
}

export function isTerritorialPlayerWavePending(planetId: string | null | undefined): boolean {
  const id = planetId?.trim();
  if (!id || !pending) return false;
  return pending.planetId === id;
}

/** 분쟁 차례 + 체류 — 허브 웨이브 1회 요청. 동일 슬롯이면 no-op. */
export function requestTerritorialPlayerWavePending(next: TerritorialPlayerWavePending): void {
  const planetId = next.planetId?.trim();
  const systemId = next.systemId?.trim();
  if (!planetId || !systemId) return;
  const normalized: TerritorialPlayerWavePending = {
    planetId,
    systemId,
    campaignGroup: next.campaignGroup,
    orderIndex: next.orderIndex,
    passIntervalSec: next.passIntervalSec,
    requestedAtMs: next.requestedAtMs,
  };
  if (
    pending &&
    pending.planetId === normalized.planetId &&
    pending.systemId === normalized.systemId &&
    pending.campaignGroup === normalized.campaignGroup &&
    pending.orderIndex === normalized.orderIndex
  ) {
    return;
  }
  pending = normalized;
  bumpRevision();
}

export function clearTerritorialPlayerWavePending(planetId?: string): void {
  if (!pending) return;
  if (planetId) {
    const id = planetId.trim();
    if (!id || pending.planetId !== id) return;
  }
  pending = null;
  bumpRevision();
}

/**
 * 웨이브 종료 후 분쟁 패스 완료 + 순차 커서 전진.
 * pending 이 해당 행성이 아니면 no-op (일반 [전투]/endgame 과 구분).
 */
export async function completeTerritorialPassAfterPlayerWave(
  planetId: string,
  nowMs = Date.now(),
): Promise<boolean> {
  const id = planetId?.trim();
  if (!id || !pending || pending.planetId !== id) return false;
  const snap = pending;
  pending = null;
  bumpRevision();
  await markTerritorialCombatPassCompleted(
    snap.planetId,
    nowMs,
    snap.campaignGroup != null && snap.orderIndex != null
      ? { group: snap.campaignGroup, orderIndex: snap.orderIndex }
      : undefined,
    snap.passIntervalSec,
  );
  return true;
}
