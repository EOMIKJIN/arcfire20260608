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

/** 전역 일정용 — 현재 위치 편향 없이 결정적(사전순) frontier 1개 */
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
  const expansionPick = pickLexicographicMin(expansionFrontier);
  if (expansionPick) return expansionPick;

  for (const sys of Object.values(systems)) {
    if (!unlocked.has(sys.id)) return sys.id;
  }
  return null;
}
