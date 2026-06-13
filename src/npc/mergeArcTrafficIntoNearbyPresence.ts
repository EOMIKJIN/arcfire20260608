// ============================================================
// 행성 허브 info — 아크코어 수송선(실제 planetId 체류)을 근접 목록에 합류
// 궤도 그리기(Skia)는 별도 시뮬 좌표 사용 — 본 행의 orbit 은 info 타입 충족용 플레이스홀더
// ============================================================

import type { ArcNpcTrafficCaptain, ArcNpcTrafficShip } from '../store/arcNpcTrafficStore';
import { NPC_CAPITAL_HULL_FALLBACK_ID } from '../types';
import { getNpcCapitalHullClassDef, resolveNpcCapitalOrbitKinematic } from './npcCapitalClassRegistry';
import { getNpcCapitalShip } from './npcFleetRegistry';
import {
  formatCapitalShipInfoPanelBadge,
  resolveCapitalShipClassification,
} from '../arcCore/balance/capitalShipClassification';
import { NEARBY_PRESENCE_DISPLAY_SEP, type NearbyOrbitPresenceRow } from './nearbyOrbitPresenceSystem';

const ARC_HUB_INFO_SLOT_BASE = 1000;

function captainLabelFromDisplayLine(displayLine: string): string {
  const sep = NEARBY_PRESENCE_DISPLAY_SEP;
  const head = (displayLine.split(sep)[0] ?? displayLine).trim();
  const dot = head.indexOf(' · ');
  return dot >= 0 ? head.slice(0, dot).trim() : head;
}

/** 행성 주변 전시용 — 반지름을 줄인 결정론 궤도(플레이스홀더) */
function arcTrafficPlaceholderOrbit(
  planetId: string,
  systemId: string,
  slotSalt: number,
): NearbyOrbitPresenceRow['orbit'] {
  const motion = { ...getNpcCapitalHullClassDef(NPC_CAPITAL_HULL_FALLBACK_ID).orbit };
  const tight = {
    ...motion,
    radiusBase: Math.max(28, Math.round(motion.radiusBase * 0.52)),
    radiusSpread: Math.max(2, Math.floor(motion.radiusSpread * 0.35)),
    stillProbability: 0.08,
  };
  return resolveNpcCapitalOrbitKinematic(planetId, systemId, 64 + (slotSalt % 32), tight);
}

/**
 * `nearbyPresence`(테이블 정적 슬롯) 뒤에, **현재 이 행성에 있는** 아크 수송선 행을 붙인다.
 * 동일 전함 id·함장 id·표시명이 이미 있으면 생략(중복 방지).
 */
export function mergeArcShipsIntoNearbyHubPresence(
  baseRows: NearbyOrbitPresenceRow[],
  arcShipsAtPlanet: ArcNpcTrafficShip[],
  captains: ArcNpcTrafficCaptain[],
  planetId: string,
  systemId: string,
): NearbyOrbitPresenceRow[] {
  const nameById = new Map(captains.map((c) => [c.id, c.name] as const));
  const seenShip = new Set(
    baseRows.map((r) => r.linkedCapitalShipId).filter((id): id is string => Boolean(id)),
  );
  const seenCaptainId = new Set<string>();
  const seenCaptainLabel = new Set<string>();
  for (const row of baseRows) {
    const shipId = row.linkedCapitalShipId;
    if (shipId) seenShip.add(shipId);
    const label = captainLabelFromDisplayLine(row.displayLine);
    if (label) seenCaptainLabel.add(label);
  }
  for (const c of captains) {
    if (seenCaptainLabel.has(c.name.trim())) seenCaptainId.add(c.id);
  }
  const sep = NEARBY_PRESENCE_DISPLAY_SEP;
  const extra: NearbyOrbitPresenceRow[] = [];
  let salt = 0;
  const arcShipsStable = [...arcShipsAtPlanet].sort((a, b) => a.id.localeCompare(b.id));
  for (let i = 0; i < arcShipsStable.length; i++) {
    const ship = arcShipsStable[i]!;
    if (seenShip.has(ship.id)) continue;
    if (seenCaptainId.has(ship.captainId)) continue;
    const hull = getNpcCapitalShip(ship.id);
    const captainName = nameById.get(ship.captainId) ?? ship.captainId;
    if (seenCaptainLabel.has(captainName.trim())) continue;
    const shipName = hull?.name ?? ship.id;
    const classification = resolveCapitalShipClassification(ship.id);
    const infoRight = classification
      ? formatCapitalShipInfoPanelBadge(classification)
      : (hull?.infoLineSuffix && hull.infoLineSuffix.trim()) || '';
    const mk = 'MK.I';
    const hullClassId = hull?.hullTypeId ?? NPC_CAPITAL_HULL_FALLBACK_ID;
    extra.push({
      slotIndex: ARC_HUB_INFO_SLOT_BASE + i,
      hullClassId,
      displayLine: `${captainName} · ${shipName}${sep}${infoRight || mk}`,
      orbit: arcTrafficPlaceholderOrbit(planetId, systemId, salt++),
      linkedCapitalShipId: ship.id,
    });
    seenShip.add(ship.id);
    seenCaptainId.add(ship.captainId);
    seenCaptainLabel.add(captainName.trim());
  }
  return [...baseRows, ...extra];
}
