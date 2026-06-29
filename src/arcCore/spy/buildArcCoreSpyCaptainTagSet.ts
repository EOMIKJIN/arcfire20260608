// ============================================================
// 아크코어 스파이 — NPC 함장 태그 풀 (결정론 · 전투 비참여 ~1%)
// ============================================================

import { NPC_CAPTAINS_FROM_CSV } from '../../data/generated';
import { getNpcCaptain } from '../../npc/npcFleetRegistry';
import { npcDeterministicHash32 } from '../../npc/npcDeterministicHash';
import { resolveArcCoreSpyPolicy } from './arcCoreSpyPolicy';
import { useArcCoreSpyExpelledStore } from '../../store/arcCoreSpyExpelledStore';

let cachedTagKey = '';
let cachedTagSet: ReadonlySet<string> = new Set();

function rebuildSpyTagSet(): ReadonlySet<string> {
  const policy = resolveArcCoreSpyPolicy();
  const threshold = Math.max(0, Math.min(10000, Math.round(policy.spyPoolFractionPct * 100)));
  const out = new Set<string>();
  for (const captain of NPC_CAPTAINS_FROM_CSV) {
    if (captain.operationalState === 'combat') continue;
    const h = npcDeterministicHash32(`arcCoreSpyTag:v1:${captain.id}`) % 10000;
    if (h < threshold) out.add(captain.id);
  }
  return out;
}

export function getArcCoreSpyTaggedCaptainIds(): ReadonlySet<string> {
  const policy = resolveArcCoreSpyPolicy();
  const key = `pct:${policy.spyPoolFractionPct}`;
  if (cachedTagKey !== key) {
    cachedTagSet = rebuildSpyTagSet();
    cachedTagKey = key;
  }
  return cachedTagSet;
}

export function invalidateArcCoreSpyTagCache(): void {
  cachedTagKey = '';
  cachedTagSet = new Set();
}

/** CSV 함장이 스파이 태그 대상인지(색출·expel 전) */
export function isArcCoreSpyTaggedCaptain(captainId: string): boolean {
  const id = String(captainId ?? '').trim();
  if (!id) return false;
  const captain = getNpcCaptain(id);
  if (!captain || captain.operationalState === 'combat') return false;
  return getArcCoreSpyTaggedCaptainIds().has(id);
}

/** 색출·expel 후 제외 — 현재 스파이 전술에 참여 가능한지 */
export function isArcCoreSpyCaptainActive(captainId: string): boolean {
  if (!isArcCoreSpyTaggedCaptain(captainId)) return false;
  return !useArcCoreSpyExpelledStore.getState().isExpelled(captainId);
}

export function countArcCoreSpyTaggedCaptains(): number {
  return getArcCoreSpyTaggedCaptainIds().size;
}
