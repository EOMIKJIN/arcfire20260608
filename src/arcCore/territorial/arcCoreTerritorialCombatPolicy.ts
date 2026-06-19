import {
  ArcCoreTerritorialCombatPolicy_FROM_BALANCE_CSV,
  ArcCoreTerritorialFleetComposition_FROM_BALANCE_CSV,
} from '../../data/balance/generated';

export type TerritorialFactionSide = 'BLUE' | 'RED';

export type TerritorialCombatPolicy = {
  planetId: string;
  systemId: string;
  enabled: boolean;
  contestedZone: boolean;
  passIntervalSec: number;
  battleWeightPct: number;
  neutralDeclareWeightPct: number;
  statusQuoWeightPct: number;
  defenderAdvantagePct: number;
  combatNoisePct: number;
  alertLabelKo: string;
};

function parseNum(raw: string | number | undefined, fallback = 0): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function parseBool(raw: string | boolean | undefined): boolean {
  if (typeof raw === 'boolean') return raw;
  return String(raw ?? '').trim().toLowerCase() === 'true';
}

let policyByPlanetId: Map<string, TerritorialCombatPolicy> | null = null;
let fleetByPlanetSide: Map<string, string[]> | null = null;

function fleetKey(planetId: string, side: TerritorialFactionSide): string {
  return `${planetId}::${side}`;
}

function buildPolicyIndex(): Map<string, TerritorialCombatPolicy> {
  const m = new Map<string, TerritorialCombatPolicy>();
  for (const row of ArcCoreTerritorialCombatPolicy_FROM_BALANCE_CSV) {
    m.set(row.planetId, {
      planetId: row.planetId,
      systemId: row.systemId,
      enabled: parseBool(row.enabled),
      contestedZone: parseBool(row.contestedZone),
      passIntervalSec: Math.max(60, parseNum(row.passIntervalSec, 3600)),
      battleWeightPct: Math.max(0, parseNum(row.battleWeightPct, 51)),
      neutralDeclareWeightPct: Math.max(0, parseNum(row.neutralDeclareWeightPct, 29)),
      statusQuoWeightPct: Math.max(0, parseNum(row.statusQuoWeightPct, 20)),
      defenderAdvantagePct: Math.max(0, parseNum(row.defenderAdvantagePct, 8)),
      combatNoisePct: Math.max(0, parseNum(row.combatNoisePct, 12)),
      alertLabelKo: row.alertLabelKo?.trim() || row.planetId,
    });
  }
  return m;
}

function buildFleetIndex(): Map<string, string[]> {
  const m = new Map<string, string[]>();
  const sorted = [...ArcCoreTerritorialFleetComposition_FROM_BALANCE_CSV].sort(
    (a, b) => parseNum(a.sortOrder, 0) - parseNum(b.sortOrder, 0),
  );
  for (const row of sorted) {
    const side = row.factionSide.trim().toUpperCase() as TerritorialFactionSide;
    if (side !== 'BLUE' && side !== 'RED') continue;
    const key = fleetKey(row.planetId, side);
    const list = m.get(key) ?? [];
    const shipId = row.shipAssetId.trim();
    if (shipId) list.push(shipId);
    m.set(key, list);
  }
  return m;
}

export function listTerritorialCombatPolicies(): TerritorialCombatPolicy[] {
  if (!policyByPlanetId) policyByPlanetId = buildPolicyIndex();
  return Array.from(policyByPlanetId.values());
}

export function getTerritorialCombatPolicy(planetId: string): TerritorialCombatPolicy | null {
  if (!policyByPlanetId) policyByPlanetId = buildPolicyIndex();
  return policyByPlanetId.get(planetId) ?? null;
}

export function listTerritorialFleetShipIds(
  planetId: string,
  side: TerritorialFactionSide,
): readonly string[] {
  if (!fleetByPlanetSide) fleetByPlanetSide = buildFleetIndex();
  return fleetByPlanetSide.get(fleetKey(planetId, side)) ?? [];
}
