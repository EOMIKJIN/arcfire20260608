// ============================================================
// 빈부격차·반란 — 오퍼레이터 인게임 대화 알림 큐 (배치·패스 진입)
// ============================================================

import type { MapFactionSide } from '../../galaxyMap/mapFactionSideCore';
import { planetAttackKstDayKey } from '../planetAttack/planetAttackKstDayKey';
import {
  buildPlanetRebellionOperatorAckKey,
  queuePlanetRebellionOperatorAlert,
  type PlanetRebellionOperatorAlertKind,
} from './planetRebellionOperatorAlertStore';

export function notifyPlanetRebellionOperatorAlert(input: {
  planetId: string;
  planetLabel: string;
  kind: PlanetRebellionOperatorAlertKind;
  wdi: number;
  previousFactionSide?: MapFactionSide;
  kstDayKey?: string;
}): void {
  const planetId = input.planetId.trim();
  if (!planetId) return;

  const kstDayKey = input.kstDayKey ?? planetAttackKstDayKey();
  queuePlanetRebellionOperatorAlert({
    planetId,
    planetLabel: input.planetLabel,
    kind: input.kind,
    wdi: Math.max(0, Math.min(100, Math.round(input.wdi))),
    previousFactionSide: input.previousFactionSide,
    ackKey: buildPlanetRebellionOperatorAckKey(planetId, input.kind, kstDayKey),
    queuedAtMs: Date.now(),
  });
}

/** @deprecated 선술집 공지 대신 notifyPlanetRebellionOperatorAlert 사용 */
export function publishRebellionOverthrowNotice(input: {
  planetLabelKo: string;
  planetId: string;
  previousSide: MapFactionSide;
  wdi?: number;
}): void {
  notifyPlanetRebellionOperatorAlert({
    planetId: input.planetId,
    planetLabel: input.planetLabelKo,
    kind: 'rebellion_overthrow',
    wdi: input.wdi ?? 100,
    previousFactionSide: input.previousSide,
  });
}

/** @deprecated 선술집 공지 대신 notifyPlanetRebellionOperatorAlert 사용 */
export function publishRebellionSimmeringNotice(input: {
  planetLabelKo: string;
  planetId: string;
  wdi?: number;
}): void {
  notifyPlanetRebellionOperatorAlert({
    planetId: input.planetId,
    planetLabel: input.planetLabelKo,
    kind: 'civil_war_simmering',
    wdi: input.wdi ?? 70,
  });
}
