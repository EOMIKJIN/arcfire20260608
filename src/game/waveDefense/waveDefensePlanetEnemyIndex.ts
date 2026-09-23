// ============================================================
// 행성 RED 적함 — 웨이브 시드용 모듈 1회 인덱스
// operationalState 를 combat 으로 바꾸지 않음(허브 교전 게이트와 분리).
// ============================================================

import { NPC_CAPTAINS } from '../../data/npcCaptains';
import { NPC_CAPITAL_SHIPS_FROM_CSV } from '../../data/generated/csvNpcCapitalShips';

const SHIP_ID_SET = new Set(NPC_CAPITAL_SHIPS_FROM_CSV.map((row) => row.id));

export function hasWaveShipId(id: string): boolean {
  return SHIP_ID_SET.has(id);
}

export type PlanetWaveEnemySlot = {
  shipId: string;
  captainId: string;
};

const EMPTY_SLOTS: readonly PlanetWaveEnemySlot[] = [];

let planetEnemySlots: Map<string, PlanetWaveEnemySlot[]> | null = null;

function buildPlanetWaveEnemyIndex(): Map<string, PlanetWaveEnemySlot[]> {
  const out = new Map<string, PlanetWaveEnemySlot[]>();
  for (const captain of NPC_CAPTAINS) {
    if (captain.combatTeam !== 'red') continue;
    if (!captain.id.startsWith('npc_cpt_enemy_')) continue;
    const shipId = (captain.assignedShipId ?? '').trim();
    const planetId = (captain.basePlanetId ?? '').trim();
    if (!planetId || !shipId || !hasWaveShipId(shipId)) continue;
    let list = out.get(planetId);
    if (!list) {
      list = [];
      out.set(planetId, list);
    }
    list.push({ shipId, captainId: captain.id });
  }
  for (const list of out.values()) {
    list.sort((a, b) => a.shipId.localeCompare(b.shipId));
  }
  return out;
}

function getPlanetWaveEnemyIndex(): Map<string, PlanetWaveEnemySlot[]> {
  if (!planetEnemySlots) planetEnemySlots = buildPlanetWaveEnemyIndex();
  return planetEnemySlots;
}

/** 행성 고정 적함(npc_enemy_*) — 없으면 빈 배열. 부트 1회 스캔 후 O(1). */
export function listPlanetWaveEnemySlots(planetId: string): readonly PlanetWaveEnemySlot[] {
  const pid = planetId.trim();
  if (!pid) return EMPTY_SLOTS;
  return getPlanetWaveEnemyIndex().get(pid) ?? EMPTY_SLOTS;
}
