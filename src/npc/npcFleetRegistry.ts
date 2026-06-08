// ============================================================
// NPC 전함·함장 DB 레지스트리 (조회·결합·AI 운용 진입점)
// ============================================================

import type {
  Combatant,
  NpcCaptain,
  NpcCapitalAiContext,
  NpcCapitalShip,
  NpcCapitalShipResolved,
} from '../types';
import { NPC_CAPTAINS } from '../data/npcCaptains';
import { NPC_CAPITAL_SHIPS } from '../data/npcCapitalShips';
import { assertNpcCapitalShipsHullClassesRegistered, getNpcCapitalHullClassDef } from './npcCapitalClassRegistry';

function buildCaptainMap(): Map<string, NpcCaptain> {
  const m = new Map<string, NpcCaptain>();
  for (const c of NPC_CAPTAINS) {
    if (m.has(c.id)) throw new Error(`npcFleetRegistry: duplicate captain id ${c.id}`);
    m.set(c.id, c);
  }
  return m;
}

function buildShipMap(): Map<string, NpcCapitalShip> {
  const m = new Map<string, NpcCapitalShip>();
  for (const s of NPC_CAPITAL_SHIPS) {
    if (m.has(s.id)) throw new Error(`npcFleetRegistry: duplicate capital ship id ${s.id}`);
    m.set(s.id, s);
  }
  return m;
}

const CAPTAIN_BY_ID = buildCaptainMap();
const SHIP_BY_ID = buildShipMap();
const CAPTAIN_BY_ASSIGNED_SHIP_ID = new Map<string, NpcCaptain>();
for (const captain of NPC_CAPTAINS) {
  const assigned = (captain.assignedShipId ?? '').trim();
  if (!assigned) continue;
  if (!SHIP_BY_ID.has(assigned)) continue;
  if (!CAPTAIN_BY_ASSIGNED_SHIP_ID.has(assigned)) {
    CAPTAIN_BY_ASSIGNED_SHIP_ID.set(assigned, captain);
  }
}
const DEFAULT_SHIP_CAPTAIN_ID = 'npc_cpt_ai_robot_default';

function assertCaptainForShip(ship: NpcCapitalShip): NpcCaptain {
  const c =
    CAPTAIN_BY_ASSIGNED_SHIP_ID.get(ship.id)
    ?? CAPTAIN_BY_ID.get(ship.captainId)
    ?? CAPTAIN_BY_ID.get(DEFAULT_SHIP_CAPTAIN_ID);
  if (!c) {
    throw new Error(
      `npcFleetRegistry: no captain resolved for ship ${ship.id}`,
    );
  }
  return c;
}

/** 모듈 로드 시 참조 무결성 검사 */
function validateNpcFleetMasterData(): void {
  const assignedOwnerByShipId = new Map<string, string>();
  for (const captain of NPC_CAPTAINS) {
    const sid = (captain.assignedShipId ?? '').trim();
    if (!sid) continue;
    if (!SHIP_BY_ID.has(sid)) {
      throw new Error(`npcFleetRegistry: captain ${captain.id} assignedShipId missing ship ${sid}`);
    }
    const priorOwner = assignedOwnerByShipId.get(sid);
    if (priorOwner) {
      // 런타임은 첫 번째 captain을 우선 사용하고 중복은 경고로만 남긴다.
      console.warn(
        `npcFleetRegistry: duplicate assignedShipId ${sid} in npc_ai_captains.csv (keep=${priorOwner}, ignore=${captain.id})`,
      );
      continue;
    }
    assignedOwnerByShipId.set(sid, captain.id);
  }
  for (const ship of NPC_CAPITAL_SHIPS) {
    void assertCaptainForShip(ship);
  }
}

validateNpcFleetMasterData();
assertNpcCapitalShipsHullClassesRegistered(NPC_CAPITAL_SHIPS);

/** 플레이어 소유 전함 — `npc_ai_ships.csv` id 가 `Player_` 로 시작 (NPC 궤도·월드 풀에서 제외) */
export function isPlayerRegistryCapitalShipId(shipId: string): boolean {
  return shipId.startsWith('Player_');
}

export function getNpcCaptain(id: string): NpcCaptain | undefined {
  return CAPTAIN_BY_ID.get(id);
}

export function getNpcCapitalShip(id: string): NpcCapitalShip | undefined {
  return SHIP_BY_ID.get(id);
}

export function resolveNpcCapitalShip(id: string): NpcCapitalShipResolved | undefined {
  const ship = SHIP_BY_ID.get(id);
  if (!ship) return undefined;
  const captain = assertCaptainForShip(ship);
  const hullClass = getNpcCapitalHullClassDef(ship.hullTypeId);
  return { ...ship, captain, hullClass };
}

/** 전투·월드 AI가 사용할 단일 스냅샷 */
export function getNpcCapitalAiContext(shipId: string): NpcCapitalAiContext | undefined {
  const ship = SHIP_BY_ID.get(shipId);
  if (!ship) return undefined;
  const captain = assertCaptainForShip(ship);
  const hullClass = getNpcCapitalHullClassDef(ship.hullTypeId);
  return { ship, captain, hullClass };
}

export function listNpcCaptains(): readonly NpcCaptain[] {
  return NPC_CAPTAINS;
}

export function listNpcCapitalShips(): readonly NpcCapitalShip[] {
  return NPC_CAPITAL_SHIPS.filter(s => !isPlayerRegistryCapitalShipId(s.id));
}

export function listNpcCapitalShipsInSystem(systemId: string): NpcCapitalShip[] {
  return NPC_CAPITAL_SHIPS.filter(s => {
    if (isPlayerRegistryCapitalShipId(s.id)) return false;
    const captain = CAPTAIN_BY_ASSIGNED_SHIP_ID.get(s.id) ?? CAPTAIN_BY_ID.get(s.captainId);
    if (captain) {
      // 함장이 전투 상태면 월드(행성 근접) 일반 배치에서는 제외
      if (captain.operationalState === 'combat') return false;
      const inActive = captain.activitySystemIds.includes(systemId);
      if (inActive) return true;
      if (captain.baseSystemId === systemId) return true;
    }
    // 하위호환: 함장 활동/거점이 비어 있을 때 기존 전함 homeSystemId 사용
    return s.homeSystemId === systemId;
  });
}

export function listNpcCapitalShipsByFaction(factionId: string): NpcCapitalShip[] {
  return NPC_CAPITAL_SHIPS.filter(s => {
    if (isPlayerRegistryCapitalShipId(s.id)) return false;
    const c = CAPTAIN_BY_ASSIGNED_SHIP_ID.get(s.id) ?? CAPTAIN_BY_ID.get(s.captainId);
    return c?.factionId === factionId;
  });
}

/** 한 함장이 지휘하는 전함(현재 스키마는 전함당 1명 함장) */
export function listNpcCapitalShipsByCaptain(captainId: string): NpcCapitalShip[] {
  return NPC_CAPITAL_SHIPS.filter((s) => {
    const mapped = CAPTAIN_BY_ASSIGNED_SHIP_ID.get(s.id);
    if (mapped) return mapped.id === captainId;
    return s.captainId === captainId;
  });
}

/** 기존 전투 루프(Combatant)에 넣기 위한 스냅샷 변환 */
export function npcCapitalResolvedToCombatant(resolved: NpcCapitalShipResolved): Combatant {
  const { captain, combat, name } = resolved;
  return {
    name: `${name} · ${captain.displayName}`,
    hp: combat.maxHp,
    maxHp: combat.maxHp,
    shield: combat.maxShield,
    maxShield: combat.maxShield,
    armor: combat.armor,
    attackBonus: combat.attackBonus,
    damageDice: combat.damageDice,
  };
}
