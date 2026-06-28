// ============================================================
// 행성 궤도 근접 NPC — 표시(info) · 궤도 · NPC AI DB 연동 (단일 시스템)
// - planetId + systemId 로 결정론적 변형 (행성마다 이름·궤도 다름)
// - 주둔 기함: `captainPresence` 전역 primary 인덱스(3h·팩션·총사령관 배타) — arc 수송은 AiNpcSubCore
// - 함급(hull class) 레지스트리에서 궤도·이름 패턴을 읽음
// - 전함 DB(CSV 함장의 assignedShipId) + 함장의 base/activity **행성** 또는 **성계** 매칭으로 슬롯 구성
// ============================================================

import type { NpcCapitalAiContext, NpcCapitalOrbitKinematic, NpcCapitalShip } from '../types';
import {
  formatCapitalShipInfoPanelBadge,
  resolveCapitalShipClassification,
} from '../arcCore/balance/capitalShipClassification';
import { NPC_CAPITAL_SHIPS_FROM_CSV, NPC_CAPTAINS_FROM_CSV } from '../data/generated';
import { getNpcCapitalAiContext } from './npcFleetRegistry';
import { getNpcCapitalHullClassDef, resolveNpcCapitalOrbitKinematic } from './npcCapitalClassRegistry';
import { npcDeterministicHash32 } from './npcDeterministicHash';
import { isCaptainHubOrbitPrimaryAtPlanet } from '../arcCore/captainPresence/buildCaptainPresenceWorldIndex';
import { syncCaptainOrbitAssignmentEpochMemo } from '../arcCore/orbitPresence/captainOrbitPlanetAssignment';
import { memoizePerPlanetSystem } from '../game/planetMemoCache';
import { useArcNpcTrafficStore } from '../store/arcNpcTrafficStore';

type CaptainShipRow = { captain: (typeof NPC_CAPTAINS_FROM_CSV)[number]; ship: NpcCapitalShip };

/**
 * NPC 전함 CSV 정적 인덱스 — 매 호출 시 `new Map(...)`을 만들면 GC 압박이 커지므로
 * 모듈 레벨에서 1회만 빌드한다. CSV는 빌드 산출물이라 런타임 변경되지 않는다.
 */
let cachedShipById: Map<string, NpcCapitalShip> | null = null;
function getShipByIdIndex(): Map<string, NpcCapitalShip> {
  if (!cachedShipById) {
    cachedShipById = new Map(NPC_CAPITAL_SHIPS_FROM_CSV.map((s) => [s.id, s]));
  }
  return cachedShipById;
}

/** Table-First 부트스트랩 — 함선·arcOrbitPresenceFill 풀 Map 1회 빌드 */
export function warmNearbyOrbitPresenceTableIndexes(): void {
  void getShipByIdIndex().size;
}

/**
 * 궤도 근접 목록: 함장 id·전함 id·표시명(displayName) 각각 한 번만.
 * 다른 컬럼이 같아도 이름이 같으면 동일 인물로 간주해 한 행만 유지(CSV 순서 우선).
 */
function dedupeCaptainShipRowsForOrbit(rows: CaptainShipRow[]): CaptainShipRow[] {
  const seenCaptains = new Set<string>();
  const seenShips = new Set<string>();
  const seenDisplayNames = new Set<string>();
  const out: CaptainShipRow[] = [];
  for (const row of rows) {
    if (seenCaptains.has(row.captain.id)) continue;
    if (seenShips.has(row.ship.id)) continue;
    const displayKey = row.captain.displayName.trim();
    if (displayKey && seenDisplayNames.has(displayKey)) continue;
    seenCaptains.add(row.captain.id);
    seenShips.add(row.ship.id);
    if (displayKey) seenDisplayNames.add(displayKey);
    out.push(row);
  }
  return out;
}

/** @deprecated 동일 구현은 `npcDeterministicHash32` — 외부 API 호환용 별칭 */
export const nearbyPresenceHash32 = npcDeterministicHash32;

export type NearbyOrbitMotion = NpcCapitalOrbitKinematic;

/** info 패널: 함장·함선명과 우측 요약(박스 그림 세로선) — 우측은 전함 CSV `infoLineSuffix`, 없으면 결정론 MK */
export const NEARBY_PRESENCE_DISPLAY_SEP = ' \u2502 ';

export type NearbyOrbitPresenceRow = {
  /** 궤도·info 행 슬롯 (0..주둔수-1) — UI 키·애니메이션 안정용 */
  slotIndex: number;
  /** 레지스트리 함급 id (`ship.hullTypeId`) */
  hullClassId: string;
  displayLine: string;
  orbit: NearbyOrbitMotion;
  /** 등록 전함 DB id — 전투/월드 AI 진입 시 사용 */
  linkedCapitalShipId?: string;
};

/** MK.I ~ MK.V (로마 숫자) */
const MK_ROMAN_MARKS = ['I', 'II', 'III', 'IV', 'V'] as const;

function mkMarkFromSeed(seed: number): string {
  return `MK.${MK_ROMAN_MARKS[seed % 5]}`;
}

function buildPlanetNearbyPresence(
  planetId: string,
  systemId: string,
): NearbyOrbitPresenceRow[] {
  const shipById = getShipByIdIndex();
  const arcShips = useArcNpcTrafficStore.getState().ships;
  const tableDrivenPairs = NPC_CAPTAINS_FROM_CSV.flatMap(captain => {
    const state = captain.operationalState;
    if (captain.arcOrbitPresenceFill) return [];
    if (!isCaptainHubOrbitPrimaryAtPlanet(captain, planetId, arcShips)) return [];
    const assignedShip = captain.assignedShipId ? shipById.get(captain.assignedShipId) : undefined;
    if (!assignedShip) return [];
    return [{ captain, ship: assignedShip, state }];
  });
  const inSystemGeneral = dedupeCaptainShipRowsForOrbit(
    tableDrivenPairs.filter(row =>
      row.state === 'general' || row.state === 'neutral' || row.state === 'hostile',
    ),
  );

  const rows: NearbyOrbitPresenceRow[] = [];
  const slotCount = inSystemGeneral.length > 0 ? inSystemGeneral.length : 0;

  for (let slot = 0; slot < slotCount; slot++) {
    const h = npcDeterministicHash32(`row:${planetId}:${systemId}:${slot}`);
    const mk = mkMarkFromSeed(h);
    const sep = NEARBY_PRESENCE_DISPLAY_SEP;

    const generalShip = inSystemGeneral[slot] ?? null;
    if (!generalShip) continue;

    const hullClass = getNpcCapitalHullClassDef(generalShip.ship.hullTypeId);
    const orbit = resolveNpcCapitalOrbitKinematic(planetId, systemId, slot, hullClass.orbit);
    const classification = resolveCapitalShipClassification(generalShip.ship.id);
    const infoRight = classification
      ? formatCapitalShipInfoPanelBadge(classification)
      : (generalShip.ship.infoLineSuffix && generalShip.ship.infoLineSuffix.trim()) || mk;
    rows.push({
      slotIndex: slot,
      hullClassId: hullClass.id,
      displayLine: `${generalShip.captain.displayName} · ${generalShip.ship.name}${sep}${infoRight}`,
      orbit,
      linkedCapitalShipId: generalShip.ship.id,
    });
  }

  return rows;
}

/**
 * 행성 주변 근접 NPC 슬롯 전부 (info 줄 + 궤도 + DB 링크).
 *
 * (planetId, systemId)에만 의존하는 결정론 결과 — `memoizePerPlanetSystem`으로
 * 행성 단위 캐시. 행성 변경/메인스테이지 이탈 시 `releasePlanetMainStageSession`이
 * 자동으로 캐시를 무효화한다.
 */
export const resolvePlanetNearbyPresence = (
  planetId: string,
  systemId: string,
): NearbyOrbitPresenceRow[] => {
  syncCaptainOrbitAssignmentEpochMemo();
  return resolvePlanetNearbyPresenceCached(planetId, systemId);
};

const resolvePlanetNearbyPresenceCached = memoizePerPlanetSystem(
  'nearbyOrbitPresenceSystem.resolvePlanetNearbyPresence',
  buildPlanetNearbyPresence,
);

/** 슬롯별 AI 스냅샷 (등록 전함만; 나머지는 null — 추후 적 NPC 슬롯 확장) */
export function resolveNearbyPresenceAiContexts(
  planetId: string,
  systemId: string,
): (NpcCapitalAiContext | null)[] {
  const rows = resolvePlanetNearbyPresence(planetId, systemId);
  return rows.map(r =>
    r.linkedCapitalShipId ? getNpcCapitalAiContext(r.linkedCapitalShipId) ?? null : null,
  );
}
