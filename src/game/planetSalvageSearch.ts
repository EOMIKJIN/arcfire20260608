import { getItemDef } from '../data/goods';
import { getArcCorePantheonRelicByItemId, listArcCorePantheonRelics } from '../arcCore/pantheon/arcCorePantheonRelicRegistry';
import { useArcCorePantheonCodexStore } from '../arcCore/pantheon/arcCorePantheonCodexStore';
import { resolveMineralCatalogSellPrice } from '../arcCore/economy/mineralTradePricing';
import { resolveItemNameNow } from '../i18n/itemText';
import { getLocale, isKoUi } from '../i18n';
import type { ArcCorePantheonRelicRow } from '../types';
import { resolvePlanetSalvageSearchPolicy } from './planetSalvageSearchPolicy';

/** 잔해 수색 기본 루트 — 추후 CSV·아크코어 테이블로 이전 */
const SALVAGE_LOOT_ITEM_IDS = [
  'ore_ferrite',
  'ore_silicate',
  'ore_carbon',
  'ore_mineral_1',
  'ore_nickel',
] as const;

/** 판테온 유물 저확률 드롭 — CSV 가산점 여지는 있으나 MVP는 상수(≤5%) */
const RELIC_DROP_PCT = 5;

function hash32(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function salvageAttemptSeedKey(
  planetId: string,
  wreckId: string,
  attemptIndex: number,
  dayKey = '',
): string {
  return `${dayKey}:${planetId}:${wreckId}:${attemptIndex}`;
}

/** 아직 해금 안 된 유물 중 결정적 해시로 1개 선택 — 전부 해금이면 null(호출부가 광물 풀로 폴백) */
function pickUndiscoveredRelicItemId(seed: number): string | null {
  const unlockedGodIds = useArcCorePantheonCodexStore.getState().listUnlocked();
  const unlockedSet = unlockedGodIds.length > 0 ? new Set(unlockedGodIds) : null;
  const available = listArcCorePantheonRelics().filter((r) => !unlockedSet?.has(r.godId));
  if (available.length === 0) return null;
  return available[seed % available.length]!.relicItemId;
}

/** salvage 버튼 실행 시 1회 호출 — 저확률로 판테온 유물, 그 외엔 기존 광물 풀 */
export function pickSalvageLootItemId(
  planetId: string,
  wreckId: string,
  attemptIndex: number,
  dayKey = '',
): string {
  const attemptKey = salvageAttemptSeedKey(planetId, wreckId, attemptIndex, dayKey);
  const seed = hash32(attemptKey);
  const relicRoll = hash32(`relic:${attemptKey}`) % 100;
  if (relicRoll < RELIC_DROP_PCT) {
    const relicItemId = pickUndiscoveredRelicItemId(seed);
    if (relicItemId) return relicItemId;
  }
  const pool = SALVAGE_LOOT_ITEM_IDS.filter((id) => Boolean(getItemDef(id)));
  const list = pool.length > 0 ? pool : ['ore_ferrite'];
  return list[seed % list.length]!;
}

export type SalvageSearchOutcome =
  | { kind: 'relic'; itemId: string }
  | { kind: 'cash'; itemId: string; credits: number }
  | { kind: 'item'; itemId: string }
  | { kind: 'anomaly_relic'; itemId: string; instanceId: string }
  | { kind: 'anomaly_threat'; instanceId: string };

/** 광물 시세 CR — 유물은 null. 카탈로그 앵커, 없으면 item_defs.basePrice. */
export function resolveSalvageMineralCashCredits(itemId: string): number | null {
  if (!itemId || getArcCorePantheonRelicByItemId(itemId)) return null;
  const catalog = resolveMineralCatalogSellPrice(itemId);
  const def = getItemDef(itemId);
  const base = catalog != null && catalog > 0
    ? catalog
    : def && def.basePrice > 0
      ? Math.floor(def.basePrice)
      : null;
  if (base == null || base <= 0) return null;
  const mul = resolvePlanetSalvageSearchPolicy().cashPriceMul;
  if (mul <= 0) return null;
  return Math.max(1, Math.floor(base * mul));
}

export function rollSalvageMineralCashHit(
  planetId: string,
  wreckId: string,
  attemptIndex: number,
  chancePct: number,
  dayKey = '',
): boolean {
  if (chancePct <= 0) return false;
  if (chancePct >= 100) return true;
  return hash32(`cash:${salvageAttemptSeedKey(planetId, wreckId, attemptIndex, dayKey)}`) % 100 < chancePct;
}

function tryAnomalySalvageReveal(
  planetId: string,
  wreckId: string,
  attemptIndex: number,
  dayKey: string,
): SalvageSearchOutcome | null {
  try {
    const { useUnidentifiedAnomalyStore } =
      require('../store/unidentifiedAnomalyStore') as typeof import('../store/unidentifiedAnomalyStore');
    const { shouldRevealAnomalyPayload } =
      require('../missions/unidentifiedAnomaly/shouldRevealAnomalyPayload') as typeof import('../missions/unidentifiedAnomaly/shouldRevealAnomalyPayload');
    const { resolveUnidentifiedAnomalyPolicy } =
      require('../missions/unidentifiedAnomaly/unidentifiedAnomalyPolicy') as typeof import('../missions/unidentifiedAnomaly/unidentifiedAnomalyPolicy');
    const { ANOMALY_RELIC_ITEM_ID } =
      require('../missions/unidentifiedAnomaly/unidentifiedAnomalyIds') as typeof import('../missions/unidentifiedAnomaly/unidentifiedAnomalyIds');
    const active = useUnidentifiedAnomalyStore.getState().active;
    if (!active || active.planetId !== planetId) return null;
    if (active.status === 'listed') return null;
    if (
      !shouldRevealAnomalyPayload({
        planetId,
        wreckId,
        attemptIndex,
        dayKey,
        instanceId: active.instanceId,
        accepted: active.status === 'accepted' || active.status === 'revealed',
        alreadyRevealed: active.payloadRevealed,
        chancePct: resolveUnidentifiedAnomalyPolicy().questRelicSalvagePct,
      })
    ) {
      return null;
    }
    useUnidentifiedAnomalyStore.getState().markRevealed(active.instanceId);
    void useUnidentifiedAnomalyStore.getState().persistLocal();
    if (active.payloadKind === 'threat') {
      return { kind: 'anomaly_threat', instanceId: active.instanceId };
    }
    return { kind: 'anomaly_relic', itemId: ANOMALY_RELIC_ITEM_ID, instanceId: active.instanceId };
  } catch {
    return null;
  }
}

/** 수색 1회 결과 — 유물 유지, 광물은 정책 확률로 시세 CR. */
export function resolvePlanetSalvageSearchOutcome(
  planetId: string,
  wreckId: string,
  attemptIndex: number,
  dayKey = '',
): SalvageSearchOutcome {
  const anomaly = tryAnomalySalvageReveal(planetId, wreckId, attemptIndex, dayKey);
  if (anomaly) return anomaly;
  const itemId = pickSalvageLootItemId(planetId, wreckId, attemptIndex, dayKey);
  if (getArcCorePantheonRelicByItemId(itemId)) {
    return { kind: 'relic', itemId };
  }
  const policy = resolvePlanetSalvageSearchPolicy();
  const credits = resolveSalvageMineralCashCredits(itemId);
  if (
    policy.enabled
    && credits != null
    && rollSalvageMineralCashHit(planetId, wreckId, attemptIndex, policy.mineralCashChancePct, dayKey)
  ) {
    return { kind: 'cash', itemId, credits };
  }
  return { kind: 'item', itemId };
}

/** 수색 알림·UI용 — ItemDef `name`/`nameEn` 로케일 해석 (무역소와 동일 계약) */
export function formatSalvageLootLabel(itemId: string): string {
  const def = getItemDef(itemId);
  if (!def) return itemId;
  return resolveItemNameNow(def);
}

/** 판테온 신명 — CSV에 godNameEn 없으면 godId 타이틀케이스로 EN 폴백 */
export function formatPantheonGodLabel(relic: Pick<ArcCorePantheonRelicRow, 'godId' | 'godNameKo'>): string {
  if (isKoUi(getLocale())) return relic.godNameKo;
  const id = relic.godId?.trim() ?? '';
  if (!id) return relic.godNameKo;
  return id.charAt(0).toUpperCase() + id.slice(1);
}
