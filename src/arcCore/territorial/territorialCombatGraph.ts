// ============================================================
// 성계 노드 그래프 → 접전 combatMode 검증
// 분쟁·진행 중 정본 = 런타임 planetHolds (시드 initialOwner는 디폴트·폴백만)
// ============================================================

import { PlanetOccupationSeeds_FROM_BALANCE_CSV } from '../../data/balance/generated';
import { STAR_SYSTEMS_FROM_CSV } from '../../data/generated/csvSystems';
import type { PlanetClanHold } from '../../types';
import type { TerritorialCombatMode } from './arcCoreTerritorialCombatPolicy';
import { resolveHoldFactionSide } from './territorialFactionSide';
import { listAdjacentSystemIds } from './territorialSupplyLine';

type SeedOwner = 'BLUE' | 'RED' | 'NEUTRAL';

function parseSeedOwner(raw: string): SeedOwner {
  const o = String(raw ?? '').trim().toUpperCase();
  if (o === 'RED') return 'RED';
  if (o === 'BLUE') return 'BLUE';
  return 'NEUTRAL';
}

type SystemOwnerPresence = { hasBlue: boolean; hasRed: boolean };

/**
 * 시드 CSV만으로 성계 owner 존재 인덱스 — **부트 전·테스트·정적 참고 전용**.
 * 분쟁 패스·보급·P0 판정에는 사용 금지(런타임 holds 우선).
 */
let systemOwnerPresenceIndexFromSeeds: Map<string, SystemOwnerPresence> | null = null;

function getSystemOwnerPresenceIndexFromSeeds(): Map<string, SystemOwnerPresence> {
  if (systemOwnerPresenceIndexFromSeeds) return systemOwnerPresenceIndexFromSeeds;
  const idx = new Map<string, SystemOwnerPresence>();
  for (const row of PlanetOccupationSeeds_FROM_BALANCE_CSV) {
    const owner = parseSeedOwner(row.initialOwner);
    if (owner === 'NEUTRAL') continue;
    const cur = idx.get(row.systemId) ?? { hasBlue: false, hasRed: false };
    if (owner === 'BLUE') cur.hasBlue = true;
    if (owner === 'RED') cur.hasRed = true;
    idx.set(row.systemId, cur);
  }
  systemOwnerPresenceIndexFromSeeds = idx;
  return idx;
}

/** 런타임 holds → 성계별 BLUE/RED 존재 (NEUTRAL·INDEPENDENT는 팩션 인접에 미가산) */
function buildSystemOwnerPresenceFromHolds(
  holds: Readonly<Record<string, PlanetClanHold>>,
): Map<string, SystemOwnerPresence> {
  const idx = new Map<string, SystemOwnerPresence>();
  for (const planetId of Object.keys(holds)) {
    const hold = holds[planetId];
    if (!hold?.systemId) continue;
    const side = resolveHoldFactionSide(hold.occupierClanId);
    if (side !== 'BLUE' && side !== 'RED') continue;
    const cur = idx.get(hold.systemId) ?? { hasBlue: false, hasRed: false };
    if (side === 'BLUE') cur.hasBlue = true;
    if (side === 'RED') cur.hasRed = true;
    idx.set(hold.systemId, cur);
  }
  return idx;
}

export type ResolveAdjacentSystemFactionPresenceInput = {
  systemId: string;
  /**
   * 런타임 점유. **분쟁·진행 중에는 반드시 전달** — 있으면 시드 initialOwner는 무시.
   * 생략 시에만 시드 폴백(부트 전/정적 테스트).
   */
  holds?: Readonly<Record<string, PlanetClanHold>>;
};

/** 인접 성계(1홉) BLUE/RED 존재 — holds 있으면 런타임 정본, 없으면 시드 폴백 */
export function resolveAdjacentSystemFactionPresence(
  systemIdOrInput: string | ResolveAdjacentSystemFactionPresenceInput,
  holdsArg?: Readonly<Record<string, PlanetClanHold>>,
): {
  hasBlue: boolean;
  hasRed: boolean;
} {
  const systemId =
    typeof systemIdOrInput === 'string' ? systemIdOrInput : systemIdOrInput.systemId;
  const holds =
    typeof systemIdOrInput === 'string' ? holdsArg : systemIdOrInput.holds;

  if (!STAR_SYSTEMS_FROM_CSV[systemId] && !listAdjacentSystemIds(systemId).length) {
    return { hasBlue: false, hasRed: false };
  }

  const idx = holds
    ? buildSystemOwnerPresenceFromHolds(holds)
    : getSystemOwnerPresenceIndexFromSeeds();

  let hasBlue = false;
  let hasRed = false;
  for (const connId of listAdjacentSystemIds(systemId)) {
    const presence = idx.get(connId);
    if (!presence) continue;
    if (presence.hasBlue) hasBlue = true;
    if (presence.hasRed) hasRed = true;
  }
  return { hasBlue, hasRed };
}

/** 그래프 기준 권장 combatMode — holds 있으면 런타임 인접 기준 */
export function inferTerritorialCombatModeFromGraph(
  systemId: string,
  holds?: Readonly<Record<string, PlanetClanHold>>,
): TerritorialCombatMode {
  const { hasBlue, hasRed } = resolveAdjacentSystemFactionPresence({ systemId, holds });
  if (hasBlue && hasRed) return 'blue_red';
  if (hasBlue && !hasRed) return 'blue_neutral';
  if (hasRed && !hasBlue) return 'red_neutral';
  return 'blue_red';
}

export function validateTerritorialCombatModeForSystem(input: {
  systemId: string;
  combatMode: TerritorialCombatMode;
  /** 분쟁 패스에서는 planetHolds 필수 — 시드와 비교하지 않음 */
  holds?: Readonly<Record<string, PlanetClanHold>>;
}): { ok: boolean; expected: TerritorialCombatMode } {
  const expected = inferTerritorialCombatModeFromGraph(input.systemId, input.holds);
  return { ok: expected === input.combatMode, expected };
}
