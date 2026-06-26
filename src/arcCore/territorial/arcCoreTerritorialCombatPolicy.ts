import {
  ArcCoreTerritorialCombatPolicy_FROM_BALANCE_CSV,
  ArcCoreTerritorialFleetComposition_FROM_BALANCE_CSV,
} from '../../data/balance/generated';

export type TerritorialFactionSide = 'BLUE' | 'RED';
export type TerritorialCombatParticipant = TerritorialFactionSide | 'NEUTRAL';
export type TerritorialCombatMode = 'blue_red' | 'blue_neutral' | 'red_neutral';

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
  combatMode: TerritorialCombatMode;
  campaignGroup: string | null;
  campaignOrder: number;
  /** blue_neutral → BLUE, red_neutral → RED 우세 확률(%) */
  dominantSideWeightPct: number;
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

function parseCombatMode(raw: string | undefined): TerritorialCombatMode {
  const v = String(raw ?? '').trim().toLowerCase();
  if (v === 'blue_neutral') return 'blue_neutral';
  if (v === 'red_neutral') return 'red_neutral';
  return 'blue_red';
}

let policyByPlanetId: Map<string, TerritorialCombatPolicy> | null = null;
let fleetByPlanetSide: Map<string, string[]> | null = null;

function fleetKey(planetId: string, side: TerritorialCombatParticipant): string {
  return `${planetId}::${side}`;
}

function buildPolicyIndex(): Map<string, TerritorialCombatPolicy> {
  const m = new Map<string, TerritorialCombatPolicy>();
  for (const row of ArcCoreTerritorialCombatPolicy_FROM_BALANCE_CSV) {
    const campaignGroupRaw = String(row.campaignGroup ?? '').trim();
    const dominantRaw = String(row.dominantSideWeightPct ?? '').trim();
    const dominantSideWeightPct =
      dominantRaw.length > 0
        ? Math.min(100, Math.max(50, parseNum(dominantRaw, 51)))
        : 51;
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
      combatMode: parseCombatMode(row.combatMode),
      campaignGroup: campaignGroupRaw.length > 0 ? campaignGroupRaw : null,
      campaignOrder: Math.max(0, parseNum(row.campaignOrder, 0)),
      dominantSideWeightPct,
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
    const side = row.factionSide.trim().toUpperCase() as TerritorialCombatParticipant;
    if (side !== 'BLUE' && side !== 'RED' && side !== 'NEUTRAL') continue;
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

let contestedZoneSystemIdSet: Set<string> | null = null;

/** 1h 순환 점유(`contestedZone=true`·enabled) 성계 id — 은하 지도 분쟁 표기용 */
export function listContestedZoneSystemIds(): readonly string[] {
  if (!contestedZoneSystemIdSet) {
    contestedZoneSystemIdSet = new Set(
      listTerritorialCombatPolicies()
        .filter((p) => p.enabled && p.contestedZone)
        .map((p) => p.systemId),
    );
  }
  return Array.from(contestedZoneSystemIdSet);
}

export function isContestedZoneSystemId(systemId: string): boolean {
  if (!contestedZoneSystemIdSet) {
    listContestedZoneSystemIds();
  }
  return contestedZoneSystemIdSet?.has(systemId) ?? false;
}

export function listTerritorialCombatPoliciesForCampaign(
  campaignGroup: string,
): TerritorialCombatPolicy[] {
  return listTerritorialCombatPolicies()
    .filter((p) => p.enabled && p.campaignGroup === campaignGroup)
    .sort((a, b) => a.campaignOrder - b.campaignOrder);
}

export function getTerritorialCombatPolicy(planetId: string): TerritorialCombatPolicy | null {
  if (!policyByPlanetId) policyByPlanetId = buildPolicyIndex();
  return policyByPlanetId.get(planetId) ?? null;
}

export function listTerritorialFleetShipIds(
  planetId: string,
  side: TerritorialCombatParticipant,
): readonly string[] {
  if (!fleetByPlanetSide) fleetByPlanetSide = buildFleetIndex();
  return fleetByPlanetSide.get(fleetKey(planetId, side)) ?? [];
}

/** 테스트·핫리로드 — CSV 재빌드 후 캐시 무효화 */
export function invalidateTerritorialCombatPolicyCache(): void {
  policyByPlanetId = null;
  fleetByPlanetSide = null;
  contestedZoneSystemIdSet = null;
}
