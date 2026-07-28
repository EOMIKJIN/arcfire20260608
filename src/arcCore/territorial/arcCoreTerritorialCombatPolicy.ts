import {
  ArcCoreTerritorialCombatPolicy_FROM_BALANCE_CSV,
  ArcCoreTerritorialFleetComposition_FROM_BALANCE_CSV,
} from '../../data/balance/generated';
import {
  DYNAMIC_CONTESTED_TEMPLATE_PLANET_ID,
  getDynamicContestedZoneRevision,
  listDynamicContestedZoneEntries,
  listDynamicContestedZoneSystemIdSet,
} from './dynamicContestedZoneStore';
import { getPlanetOccupationSeedRow } from '../balance/balanceTableRegistry';

export type TerritorialFactionSide = 'BLUE' | 'RED';
export type TerritorialCombatParticipant = TerritorialFactionSide | 'NEUTRAL' | 'INDEPENDENT';
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
  /** 보급선 — 인접 아군 성계 0개(고립) 측 전투력 페널티(%) */
  supplyIsolatedPenaltyPct: number;
  /** 보급선 — 인접 아군 성계 1개당 전투력 가산(%) */
  supplyBonusPctPerNode: number;
  /** 보급선 — 인접 가산 상한(%) */
  supplyBonusCapPct: number;
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
      passIntervalSec: Math.max(60, parseNum(row.passIntervalSec, 1200)),
      battleWeightPct: Math.max(0, parseNum(row.battleWeightPct, 51)),
      neutralDeclareWeightPct: Math.max(0, parseNum(row.neutralDeclareWeightPct, 29)),
      statusQuoWeightPct: Math.max(0, parseNum(row.statusQuoWeightPct, 20)),
      defenderAdvantagePct: Math.max(0, parseNum(row.defenderAdvantagePct, 8)),
      combatNoisePct: Math.max(0, parseNum(row.combatNoisePct, 12)),
      combatMode: parseCombatMode(row.combatMode),
      campaignGroup: campaignGroupRaw.length > 0 ? campaignGroupRaw : null,
      campaignOrder: Math.max(0, parseNum(row.campaignOrder, 0)),
      dominantSideWeightPct,
      supplyIsolatedPenaltyPct: Math.min(
        90,
        Math.max(0, parseNum(row.supplyIsolatedPenaltyPct, 35)),
      ),
      supplyBonusPctPerNode: Math.max(0, parseNum(row.supplyBonusPctPerNode, 6)),
      supplyBonusCapPct: Math.max(0, parseNum(row.supplyBonusCapPct, 18)),
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
    if (side !== 'BLUE' && side !== 'RED' && side !== 'NEUTRAL' && side !== 'INDEPENDENT') continue;
    const key = fleetKey(row.planetId, side);
    const list = m.get(key) ?? [];
    const shipId = row.shipAssetId.trim();
    if (shipId) list.push(shipId);
    m.set(key, list);
  }
  return m;
}

function getPolicyMap(): Map<string, TerritorialCombatPolicy> {
  if (!policyByPlanetId) policyByPlanetId = buildPolicyIndex();
  return policyByPlanetId;
}

/**
 * 동적 분쟁지역(플레이어 전투 편입) 합성 정책 — CSV `__dynamic_default__` 템플릿 행의
 * 수학(가중치·주기·모드)과 campaignGroup을 그대로 상속하고 행성 축만 치환한다.
 * campaignOrder는 CSV 정적 멤버 뒤에 승격 시각 순으로 이어 붙여 **순차 1곳 판정 규칙**에 합류.
 */
function listDynamicContestedPolicies(): TerritorialCombatPolicy[] {
  const map = getPolicyMap();
  const template = map.get(DYNAMIC_CONTESTED_TEMPLATE_PLANET_ID);
  if (!template) return [];
  const entries = [...listDynamicContestedZoneEntries()].sort(
    (a, b) => a.promotedAtMs - b.promotedAtMs || a.planetId.localeCompare(b.planetId),
  );
  if (entries.length === 0) return [];

  let baseOrder = 0;
  if (template.campaignGroup) {
    for (const p of map.values()) {
      if (p.planetId === DYNAMIC_CONTESTED_TEMPLATE_PLANET_ID) continue;
      if (p.campaignGroup === template.campaignGroup && p.campaignOrder > baseOrder) {
        baseOrder = p.campaignOrder;
      }
    }
  }

  return entries.map((entry, i) => ({
    ...template,
    planetId: entry.planetId,
    systemId: entry.systemId,
    enabled: true,
    contestedZone: true,
    campaignOrder: template.campaignGroup ? baseOrder + 1 + i : 0,
    alertLabelKo:
      getPlanetOccupationSeedRow(entry.planetId)?.alertLabelKo?.trim() || entry.planetId,
  }));
}

// listTerritorialCombatPolicies() revision 캐시 — 동적 분쟁지역 promote/reset(dynamicContestedZoneStore
// revision) 또는 invalidateTerritorialCombatPolicyCache() 호출 시에만 재빌드. 매 probe(60s)·패스마다
// [...csv, ...dyn] 신규 배열을 만들지 않도록(핫패스 O(n) 재생성 회피).
let cachedPolicies: TerritorialCombatPolicy[] | null = null;
let cachedPoliciesRevision = -1;

export function listTerritorialCombatPolicies(): TerritorialCombatPolicy[] {
  const rev = getDynamicContestedZoneRevision();
  if (cachedPolicies && cachedPoliciesRevision === rev) return cachedPolicies;
  const csv = Array.from(getPolicyMap().values()).filter(
    (p) => p.planetId !== DYNAMIC_CONTESTED_TEMPLATE_PLANET_ID,
  );
  cachedPolicies = [...csv, ...listDynamicContestedPolicies()];
  cachedPoliciesRevision = rev;
  return cachedPolicies;
}

let contestedZoneSystemIdSet: Set<string> | null = null;

function getCsvContestedZoneSystemIdSet(): Set<string> {
  if (!contestedZoneSystemIdSet) {
    contestedZoneSystemIdSet = new Set(
      Array.from(getPolicyMap().values())
        .filter((p) => p.enabled && p.contestedZone)
        .map((p) => p.systemId),
    );
  }
  return contestedZoneSystemIdSet;
}

/** 1회 순환 점유(`contestedZone=true`·enabled) 성계 id — 은하 지도 분쟁 표기용 (동적 편입 포함) */
export function listContestedZoneSystemIds(): readonly string[] {
  const csv = getCsvContestedZoneSystemIdSet();
  const dyn = listDynamicContestedZoneSystemIdSet();
  if (dyn.size === 0) return Array.from(csv);
  return Array.from(new Set([...csv, ...dyn]));
}

export function isContestedZoneSystemId(systemId: string): boolean {
  if (getCsvContestedZoneSystemIdSet().has(systemId)) return true;
  return listDynamicContestedZoneSystemIdSet().has(systemId);
}

const campaignPoliciesCache = new Map<string, { rev: number; list: TerritorialCombatPolicy[] }>();

export function listTerritorialCombatPoliciesForCampaign(
  campaignGroup: string,
): TerritorialCombatPolicy[] {
  const rev = getDynamicContestedZoneRevision();
  const cached = campaignPoliciesCache.get(campaignGroup);
  if (cached && cached.rev === rev) return cached.list;
  const list = listTerritorialCombatPolicies()
    .filter((p) => p.enabled && p.campaignGroup === campaignGroup)
    .sort((a, b) => a.campaignOrder - b.campaignOrder);
  campaignPoliciesCache.set(campaignGroup, { rev, list });
  return list;
}

export function getTerritorialCombatPolicy(planetId: string): TerritorialCombatPolicy | null {
  const csv = getPolicyMap().get(planetId);
  if (csv) return csv;
  // 동적 분쟁지역(플레이어 전투 편입) — 캠페인 순번 포함 합성 정책
  for (const p of listDynamicContestedPolicies()) {
    if (p.planetId === planetId) return p;
  }
  return null;
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
  cachedPolicies = null;
  cachedPoliciesRevision = -1;
  campaignPoliciesCache.clear();
}
