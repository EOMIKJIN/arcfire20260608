import type { StarSystem } from '../types';
import { parseSynthOrdinal } from '../data/galaxy100';
import { getWorldExpansionTimingPolicy } from './balance/balanceTableRegistry';

function resolveLegacySynthColonizationCount(): number {
  return getWorldExpansionTimingPolicy().legacySynthColonizationCount;
}

export function isLegacySynthSystemId(id: string): boolean {
  const ord = parseSynthOrdinal(id);
  if (ord === null) return false;
  return ord <= resolveLegacySynthColonizationCount();
}

export function isExpansionSynthSystemId(id: string): boolean {
  const ord = parseSynthOrdinal(id);
  if (ord === null) return false;
  return ord > resolveLegacySynthColonizationCount();
}

function collectFrontierSynthIds(
  systems: Record<string, StarSystem>,
  unlocked: Set<string>,
  orderedFromIds: readonly string[],
  pred: (id: string) => boolean,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const fromId of orderedFromIds) {
    const sys = systems[fromId];
    if (!sys) continue;
    for (const cid of [...sys.connections].sort()) {
      if (unlocked.has(cid)) continue;
      const t = systems[cid];
      if (!t || !cid.startsWith('synth_')) continue;
      if (!pred(cid)) continue;
      if (seen.has(cid)) continue;
      seen.add(cid);
      out.push(cid);
    }
  }
  return out;
}

function pickLexicographicMin(ids: readonly string[]): string | null {
  if (ids.length === 0) return null;
  let best = ids[0]!;
  for (let i = 1; i < ids.length; i += 1) {
    const id = ids[i]!;
    if (id.localeCompare(best) < 0) best = id;
  }
  return best;
}

const EXPANSION_DIRECTIONS = ['north', 'east', 'south', 'west'] as const;
type ExpansionDirection = (typeof EXPANSION_DIRECTIONS)[number];

/**
 * 확장(미발견) ordinal → 방향. `buildExpansionSpiderPositions`(galaxy100.ts)의
 * `cluster = i % 4`(north,east,south,west 순 라운드로빈) 배치와 동일 산식이라
 * 좌표 재계산 없이 ordinal만으로 방향을 복원한다.
 */
function resolveExpansionDirection(id: string, legacyCount: number): ExpansionDirection | null {
  const ord = parseSynthOrdinal(id);
  if (ord === null || ord <= legacyCount) return null;
  const expansionIdx = ord - legacyCount - 1;
  return EXPANSION_DIRECTIONS[expansionIdx % 4]!;
}

/**
 * 확장(미발견) 단계 선택 — 매 pick마다 "현재 개방 수가 가장 적은 방향(N/E/S/W)"부터 순서대로 시도한다.
 * 1) 그 방향에 실제 인접(frontier) 후보가 있으면 그중 사전순 최소.
 * 2) 없으면(그 방향 클러스터가 아직 나머지 그래프와 연결선이 없어 도달 전이거나 방금 소진된 직후)
 *    그 방향의 아직 안 열린 노드 중 사전순 최소를 직접 시드(seed)한다 — 기존에도 프론티어가
 *    비면 결국 "아무 성계나" 강제로 여는 폴백이 있었으므로 새로운 동작이 아니라,
 *    그 강제 선택을 "가장 뒤처진 방향"으로 정밀화한 것뿐이다.
 * 3) 그래도 없으면(그 방향 165개 전부 이미 열림) 다음으로 적은 방향으로 넘어간다.
 * 이렇게 매 pick마다 재평가하므로, 한 클러스터가 내부 인접만으로 몇 걸음 앞서가더라도
 * 다음 pick에서 다시 가장 뒤처진 방향이 우선권을 가져가 자연스럽게 골고루 진행된다.
 */
function pickDirectionBalancedExpansion(
  systems: Record<string, StarSystem>,
  organicCandidates: readonly string[],
  unlocked: ReadonlySet<string>,
  legacyCount: number,
): string | null {
  const unlockedCountByDir: Record<ExpansionDirection, number> = {
    north: 0, east: 0, south: 0, west: 0,
  };
  for (const id of unlocked) {
    const dir = resolveExpansionDirection(id, legacyCount);
    if (dir) unlockedCountByDir[dir] += 1;
  }

  const organicByDir: Record<ExpansionDirection, string[]> = {
    north: [], east: [], south: [], west: [],
  };
  for (const id of organicCandidates) {
    const dir = resolveExpansionDirection(id, legacyCount);
    if (dir) organicByDir[dir].push(id);
  }

  const orderedDirs = [...EXPANSION_DIRECTIONS].sort(
    (a, b) => unlockedCountByDir[a] - unlockedCountByDir[b],
  );

  for (const dir of orderedDirs) {
    const organicPick = pickLexicographicMin(organicByDir[dir]);
    if (organicPick) return organicPick;

    const reseedCandidates: string[] = [];
    for (const id of Object.keys(systems)) {
      if (unlocked.has(id)) continue;
      if (resolveExpansionDirection(id, legacyCount) === dir) reseedCandidates.push(id);
    }
    const reseedPick = pickLexicographicMin(reseedCandidates);
    if (reseedPick) return reseedPick;
  }
  return null;
}

/** 전역 일정용 — 현재 위치 편향 없이 결정적 frontier 1개 (확장 단계는 방향 균형 우선) */
export function pickDeterministicSynthFrontierCandidate(
  systems: Record<string, StarSystem>,
  unlockedIds: readonly string[],
): string | null {
  const unlocked = new Set(unlockedIds);
  const orderedFromIds = unlockedIds.filter((id) => systems[id]).sort();

  const legacyFrontier = collectFrontierSynthIds(
    systems,
    unlocked,
    orderedFromIds,
    isLegacySynthSystemId,
  );
  const legacyPick = pickLexicographicMin(legacyFrontier);
  if (legacyPick) return legacyPick;

  const expansionFrontier = collectFrontierSynthIds(
    systems,
    unlocked,
    orderedFromIds,
    isExpansionSynthSystemId,
  );
  const expansionPick = pickDirectionBalancedExpansion(
    systems,
    expansionFrontier,
    unlocked,
    resolveLegacySynthColonizationCount(),
  );
  if (expansionPick) return expansionPick;

  for (const sys of Object.values(systems)) {
    if (!unlocked.has(sys.id)) return sys.id;
  }
  return null;
}
