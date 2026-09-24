/**
 * 테스트 스폰 성계 — 은하 지도에 실제로 보이는 구역(표시 목록 ∩ 이동안개).
 */
import {
  EXPANSION_GATEWAYS_PER_DIRECTION,
  GAMEPLAY_SYSTEM_IDS,
  LEGACY_VISIBLE_TOTAL_SYSTEMS,
  isExpansionGatewayOrdinal,
  parseSynthOrdinal,
} from '../../data/galaxy100';

const LEGACY_SYNTH_VISIBLE_COUNT = Math.max(0, LEGACY_VISIBLE_TOTAL_SYSTEMS - GAMEPLAY_SYSTEM_IDS.size);

export function isUnidentifiedAnomalyMapListedSystemId(
  systemId: string,
  unlockedSystemIds: readonly string[],
): boolean {
  const id = String(systemId ?? '').trim();
  if (!id) return false;
  if (!id.startsWith('synth_')) return true;
  const ord = parseSynthOrdinal(id);
  if (ord !== null && ord <= LEGACY_SYNTH_VISIBLE_COUNT) return true;
  if (ord !== null && isExpansionGatewayOrdinal(ord, LEGACY_SYNTH_VISIBLE_COUNT, EXPANSION_GATEWAYS_PER_DIRECTION)) {
    return true;
  }
  return unlockedSystemIds.includes(id);
}

export function listUnidentifiedAnomalyVisibleSystemIds(
  systemIds: readonly string[],
  unlockedSystemIds: readonly string[],
  fogRevealedIds: ReadonlySet<string>,
): string[] {
  const out: string[] = [];
  for (let i = 0; i < systemIds.length; i += 1) {
    const id = String(systemIds[i] ?? '').trim();
    if (!id || !fogRevealedIds.has(id)) continue;
    if (!isUnidentifiedAnomalyMapListedSystemId(id, unlockedSystemIds)) continue;
    if (!out.includes(id)) out.push(id);
  }
  out.sort();
  return out;
}

/** 직전 성계 다음 칸으로 로테이션. 풀이 1개면 그 성계. */
export function selectUnidentifiedAnomalyTestSite(
  visibleIds: readonly string[],
  lastSystemId?: string | null,
): string | null {
  const n = visibleIds.length;
  if (n === 0) return null;
  if (n === 1) return visibleIds[0] ?? null;
  const last = String(lastSystemId ?? '').trim();
  if (!last) return visibleIds[0] ?? null;
  let idx = -1;
  for (let i = 0; i < n; i += 1) {
    if (visibleIds[i] === last) {
      idx = i;
      break;
    }
  }
  if (idx < 0) return visibleIds[0] ?? null;
  return visibleIds[(idx + 1) % n] ?? null;
}
