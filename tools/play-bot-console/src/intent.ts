import type { Rng } from './rng';
import type { ActionKind, PersonaId, WorldState } from './types';
import { pickWeighted } from './rng';
import { getLiveWeights } from './policy';
import {
  canBuyBetterGear,
  canDevelop,
  canLearnAny,
  nextPlayableMissionId,
} from './progress';
import { paintOf } from './world';

/**
 * 학습 정체(combat_off HOLD · 퀘 1개 · L8 동결)를 반영한 의도 우선순위.
 * 1 전 퀘스트 2 크림슨 수도 3 최고 장비 4 전 스킬 5 집중 성계 개발.
 */
function interleaveGrowth(world: WorldState, rng: Rng): ActionKind | null {
  if (canLearnAny(world) && rng() < 0.55) return 'skill';
  if (canBuyBetterGear(world) && rng() < 0.4) return 'gear';
  if (canDevelop(world) && world.credits >= 400 && rng() < 0.35) return 'develop';
  if (!world.capitalDestroyed && world.level >= 6 && rng() < 0.22) return 'capital';
  return null;
}

export function decideIntentKind(world: WorldState, rng: Rng, persona: PersonaId): ActionKind {
  if (world.hangarShips <= 0) return 'travel';
  if (!world.activeQuest && world.questCleared === 0 && nextPlayableMissionId(world)) {
    return 'quest';
  }
  const growth = interleaveGrowth(world, rng);
  if (world.activeQuest) {
    if (growth && rng() < 0.42) return growth;
    return 'quest';
  }
  if (growth && (growth === 'skill' || growth === 'gear')) return growth;
  if (nextPlayableMissionId(world)) {
    if (growth && rng() < 0.38) return growth;
    return 'quest';
  }
  if (growth) return growth;

  if (!world.capitalDestroyed && world.level >= 6) {
    if (world.level >= 16 || rng() < 0.62) return 'capital';
  }

  if (world.credits < 700) return 'trade';

  const here = world.planets[world.currentPlanetId];
  if (here && here.combatEnabled && (paintOf(here) === 'RED' || here.contested)) {
    return 'combat';
  }
  if (persona === 'colonize_edge') return 'colonize';
  if (persona === 'front_annex') return 'annex_path';
  return 'combat';
}

export function pickStepKind(world: WorldState, rng: Rng, persona: PersonaId): ActionKind {
  if (world.hangarShips <= 0) return 'travel';
  const intent = decideIntentKind(world, rng, persona);
  if (rng() < 0.12) {
    const w = pickWeighted(rng, getLiveWeights(persona));
    if (w === 'combat' && world.hangarShips <= 1) return intent;
    return w;
  }
  return intent;
}
