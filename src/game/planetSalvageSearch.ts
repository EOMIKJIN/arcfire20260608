import { getItemDef } from '../data/goods';
import { listArcCorePantheonRelics } from '../arcCore/pantheon/arcCorePantheonRelicRegistry';
import { useArcCorePantheonCodexStore } from '../arcCore/pantheon/arcCorePantheonCodexStore';

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

/** 아직 해금 안 된 유물 중 결정적 해시로 1개 선택 — 전부 해금이면 null(호출부가 광물 풀로 폴백) */
function pickUndiscoveredRelicItemId(seed: number): string | null {
  const unlockedGodIds = useArcCorePantheonCodexStore.getState().listUnlocked();
  const unlockedSet = unlockedGodIds.length > 0 ? new Set(unlockedGodIds) : null;
  const available = listArcCorePantheonRelics().filter((r) => !unlockedSet?.has(r.godId));
  if (available.length === 0) return null;
  return available[seed % available.length]!.relicItemId;
}

/** salvage 버튼 실행 시 1회 호출 — 저확률로 판테온 유물, 그 외엔 기존 광물 풀 */
export function pickSalvageLootItemId(planetId: string, wreckId: string, attemptIndex: number): string {
  const seed = hash32(`${planetId}:${wreckId}:${attemptIndex}`);
  const relicRoll = hash32(`relic:${planetId}:${wreckId}:${attemptIndex}`) % 100;
  if (relicRoll < RELIC_DROP_PCT) {
    const relicItemId = pickUndiscoveredRelicItemId(seed);
    if (relicItemId) return relicItemId;
  }
  const pool = SALVAGE_LOOT_ITEM_IDS.filter((id) => Boolean(getItemDef(id)));
  const list = pool.length > 0 ? pool : ['ore_ferrite'];
  return list[seed % list.length]!;
}

export function formatSalvageLootLabel(itemId: string): string {
  return getItemDef(itemId)?.name ?? itemId;
}
