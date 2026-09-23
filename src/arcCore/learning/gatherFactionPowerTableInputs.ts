// ============================================================
// 테이블 정본 입력 — occupation seed · CSV 함대 · 항로 · 함장
// 스토어/RN 없음. CLI·테스트·라이브 오버레이 공통.
// ============================================================

import { PlanetOccupationSeeds_FROM_BALANCE_CSV } from '../../data/balance/generated';
import { NPC_CAPITAL_SHIPS_FROM_CSV, NPC_CAPTAINS_FROM_CSV, STAR_SYSTEMS_FROM_CSV } from '../../data/generated';
import { listTerritorialFleetShipIds } from '../territorial/arcCoreTerritorialCombatPolicy';
import { listScenarioCorePlanetIds } from '../territorial/resolveMaginotExternalSupply';
import { resolveHoldFactionSide } from '../territorial/territorialFactionSide';
import { calculatePlanetPgpFromStats } from '../../world/planetPgpModel';
import { resolveCanonRouteForPlanetId } from '../../world/quadNationRouteCanon';
import type { NpcCapitalCombatStats } from '../../types';
import type {
  FactionPowerCaptainRow,
  FactionPowerEvaluateInput,
  FactionPowerHoldSide,
  FactionPowerPlanetRow,
} from './factionPowerTypes';

/** scoreCapitalCombatStats 기본 가중과 동일(정책 미로드 CLI 경로) */
function scoreCombatStatsForFactionPower(c: NpcCapitalCombatStats): number {
  const diceMean = c.damageDice.count * ((c.damageDice.sides + 1) / 2) + c.damageDice.bonus;
  return (
    c.maxHp * 1
    + c.maxShield * 0.55
    + c.armor * 8
    + diceMean * 12
    + c.attackBonus * 6
  );
}

let shipCombatById: Map<string, NpcCapitalCombatStats> | null = null;
let pgpBaselineByPlanetId: Map<string, number> | null = null;

function getShipCombatById(): Map<string, NpcCapitalCombatStats> {
  if (shipCombatById) return shipCombatById;
  const map = new Map<string, NpcCapitalCombatStats>();
  for (const ship of NPC_CAPITAL_SHIPS_FROM_CSV) {
    map.set(ship.id, ship.combat);
  }
  shipCombatById = map;
  return map;
}

function scoreFleet(planetId: string, side: 'BLUE' | 'RED'): number {
  const ids = listTerritorialFleetShipIds(planetId, side);
  const combatById = getShipCombatById();
  let total = 0;
  for (let i = 0; i < ids.length; i += 1) {
    const combat = combatById.get(ids[i]!);
    if (!combat) continue;
    total += scoreCombatStatsForFactionPower(combat);
  }
  return total;
}

function getPgpBaselineByPlanetId(): Map<string, number> {
  if (pgpBaselineByPlanetId) return pgpBaselineByPlanetId;
  const map = new Map<string, number>();
  for (const system of Object.values(STAR_SYSTEMS_FROM_CSV)) {
    for (const planet of system.planets) {
      map.set(
        planet.id,
        calculatePlanetPgpFromStats({
          resource: planet.coreResource,
          population: planet.corePopulation,
          defense: planet.coreDefense,
          technology: planet.coreTechnology,
          environment: planet.coreEnvironment,
        }),
      );
    }
  }
  pgpBaselineByPlanetId = map;
  return map;
}

function seedHoldSide(planetId: string): FactionPowerHoldSide {
  const row = PlanetOccupationSeeds_FROM_BALANCE_CSV.find((r) => r.planetId === planetId);
  const owner = String(row?.initialOwner ?? '').trim().toUpperCase();
  if (owner === 'BLUE') return 'BLUE';
  if (owner === 'RED') return 'RED';
  return 'NEUTRAL';
}

export function resolveFactionPowerHoldSideFromOccupier(
  occupierClanId: string | null | undefined,
  kind?: string | null,
): FactionPowerHoldSide {
  if (kind === 'player_independent') return 'INDEPENDENT';
  const side = resolveHoldFactionSide(occupierClanId);
  if (side === 'BLUE' || side === 'RED' || side === 'INDEPENDENT' || side === 'NEUTRAL') return side;
  return 'NEUTRAL';
}

export function listFactionPowerCaptainRows(): FactionPowerCaptainRow[] {
  const out: FactionPowerCaptainRow[] = [];
  for (const captain of NPC_CAPTAINS_FROM_CSV) {
    out.push({
      combatTeam: captain.combatTeam,
      operationalState: captain.operationalState,
      basePlanetId: captain.basePlanetId,
      initialLevel: captain.progression.initialLevel,
    });
  }
  return out;
}

export function gatherFactionPowerTableInputs(opts?: {
  nowMs?: number;
  holdByPlanetId?: Readonly<Record<string, { occupierClanId?: string; kind?: string }>>;
  pgpByPlanetId?: Readonly<Record<string, number>>;
  governorsByPlanetId?: Readonly<
    Record<string, { side: 'BLUE' | 'RED' | 'NEUTRAL'; tacticsGrade: number }>
  >;
  vaults?: FactionPowerEvaluateInput['vaults'];
  source?: FactionPowerEvaluateInput['source'];
}): FactionPowerEvaluateInput {
  const pgpBaseline = getPgpBaselineByPlanetId();
  const planetIds = listScenarioCorePlanetIds();
  const planets: FactionPowerPlanetRow[] = [];
  for (let i = 0; i < planetIds.length; i += 1) {
    const planetId = planetIds[i]!;
    const hold = opts?.holdByPlanetId?.[planetId];
    const holdSide = hold
      ? resolveFactionPowerHoldSideFromOccupier(hold.occupierClanId, hold.kind)
      : seedHoldSide(planetId);
    const governor = opts?.governorsByPlanetId?.[planetId];
    const livePgp = opts?.pgpByPlanetId?.[planetId];
    planets.push({
      planetId,
      holdSide,
      pgpBmu: typeof livePgp === 'number' && Number.isFinite(livePgp) ? Math.max(0, Math.floor(livePgp)) : pgpBaseline.get(planetId) ?? 0,
      route: resolveCanonRouteForPlanetId(planetId),
      blueFleetPower: scoreFleet(planetId, 'BLUE'),
      redFleetPower: scoreFleet(planetId, 'RED'),
      governorSide: governor?.side,
      governorTacticsGrade: governor?.tacticsGrade,
    });
  }
  return {
    nowMs: opts?.nowMs ?? Date.now(),
    source: opts?.source ?? 'table_seed',
    planets,
    captains: listFactionPowerCaptainRows(),
    vaults: opts?.vaults ?? { blue: null, redArcCore: null },
  };
}
