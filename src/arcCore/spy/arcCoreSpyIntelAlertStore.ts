// ============================================================
// 스파이 정보원 알림 — 행성 허브 대화 배지·자동 오픈 큐 (세션 휘발)
// ============================================================

export type ArcCoreSpyIntelAlertPending = {
  planetId: string;
  /** 알림 트리거 스파이(대표 1명) */
  primarySpyCaptainId: string;
  /** 동시 활성 스파이 id 스냅샷 */
  spyCaptainIds: readonly string[];
  informantCaptainId: string;
  sceneId: string;
  ackKey: string;
  detectedAtMs: number;
};

type SpyIntelAlertListener = () => void;

let revision = 0;
let pending: ArcCoreSpyIntelAlertPending | null = null;
const listeners = new Set<SpyIntelAlertListener>();

function bumpRevision(): void {
  revision += 1;
  for (const listener of listeners) {
    listener();
  }
}

export function getArcCoreSpyIntelAlertRevision(): number {
  return revision;
}

export function subscribeArcCoreSpyIntelAlert(listener: SpyIntelAlertListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getPendingArcCoreSpyIntelAlert(): ArcCoreSpyIntelAlertPending | null {
  return pending;
}

export function getPendingArcCoreSpyIntelAlertForPlanet(planetId: string): ArcCoreSpyIntelAlertPending | null {
  const pid = String(planetId ?? '').trim();
  if (!pid || !pending || pending.planetId !== pid) return null;
  return pending;
}

export function queueArcCoreSpyIntelAlert(next: ArcCoreSpyIntelAlertPending): void {
  pending = next;
  bumpRevision();
}

export function clearPendingArcCoreSpyIntelAlert(planetId?: string): void {
  if (planetId) {
    const pid = planetId.trim();
    if (!pending || pending.planetId !== pid) return;
  }
  pending = null;
  bumpRevision();
}

export function resetArcCoreSpyIntelAlertStore(): void {
  pending = null;
  revision = 0;
}
