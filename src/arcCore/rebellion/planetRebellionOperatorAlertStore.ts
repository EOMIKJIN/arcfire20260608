// ============================================================
// 빈부격차·반란 — 오퍼레이터 인게임 대화 알림 큐 (세션 휘발)
// ============================================================

import type { MapFactionSide } from '../../galaxyMap/mapFactionSideCore';

export type PlanetRebellionOperatorAlertKind =
  | 'wdi_unrest'
  | 'wdi_danger'
  | 'civil_war_simmering'
  | 'rebellion_overthrow';

export type PlanetRebellionOperatorAlertPending = {
  planetId: string;
  planetLabel: string;
  kind: PlanetRebellionOperatorAlertKind;
  wdi: number;
  previousFactionSide?: MapFactionSide;
  ackKey: string;
  queuedAtMs: number;
};

const ALERT_PRIORITY: Record<PlanetRebellionOperatorAlertKind, number> = {
  rebellion_overthrow: 0,
  civil_war_simmering: 1,
  wdi_danger: 2,
  wdi_unrest: 3,
};

type RebellionAlertListener = () => void;

let revision = 0;
const pendingByPlanetId = new Map<string, PlanetRebellionOperatorAlertPending>();
const listeners = new Set<RebellionAlertListener>();

function bumpRevision(): void {
  revision += 1;
  for (const listener of listeners) {
    listener();
  }
}

export function getPlanetRebellionOperatorAlertRevision(): number {
  return revision;
}

export function subscribePlanetRebellionOperatorAlert(listener: RebellionAlertListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function buildPlanetRebellionOperatorAckKey(
  planetId: string,
  kind: PlanetRebellionOperatorAlertKind,
  kstDayKey: string,
): string {
  return `hub_rebellion_operator:${planetId}:${kind}:${kstDayKey}`;
}

export function getPendingPlanetRebellionOperatorAlertForPlanet(
  planetId: string,
): PlanetRebellionOperatorAlertPending | null {
  const pid = String(planetId ?? '').trim();
  if (!pid) return null;
  return pendingByPlanetId.get(pid) ?? null;
}

export function queuePlanetRebellionOperatorAlert(next: PlanetRebellionOperatorAlertPending): void {
  const pid = next.planetId.trim();
  if (!pid) return;

  const cur = pendingByPlanetId.get(pid);
  if (cur) {
    const curPri = ALERT_PRIORITY[cur.kind];
    const nextPri = ALERT_PRIORITY[next.kind];
    if (nextPri > curPri) return;
    if (nextPri === curPri && cur.ackKey === next.ackKey) return;
  }

  pendingByPlanetId.set(pid, next);
  bumpRevision();
}

export function clearPendingPlanetRebellionOperatorAlert(planetId?: string): void {
  if (planetId) {
    const pid = planetId.trim();
    if (!pendingByPlanetId.has(pid)) return;
    pendingByPlanetId.delete(pid);
    bumpRevision();
    return;
  }
  if (pendingByPlanetId.size === 0) return;
  pendingByPlanetId.clear();
  bumpRevision();
}

export function resetPlanetRebellionOperatorAlertStore(): void {
  pendingByPlanetId.clear();
  revision = 0;
}
