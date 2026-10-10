import type { Rng } from './rng';
import type { ActionKind, PersonaId, WorldState } from './types';
import { pickWeighted } from './rng';
import { getLearnExploreRate, getLiveWeights } from './policy';
import {
  canBuyBetterGear,
  canDevelop,
  canLearnAny,
  nextPlayableMissionId,
} from './progress';
import { paintOf } from './world';
import { canMineralUpgrade, mineralUpgradeTarget } from './mineralUpgrade';
import { planetHasMineableOrbitalDeposits } from '../../../src/world/mineralDepositModel';

/**
 * 학습 정체(combat_off HOLD · 퀘 1개 · L8 동결)를 반영한 의도 우선순위.
 * 1 전 퀘스트 2 크림슨 수도 3 최고 장비 4 전 스킬 5 집중 성계 개발.
 */
function interleaveGrowth(world: WorldState, rng: Rng): ActionKind | null {
  if (canLearnAny(world) && rng() < 0.55) return 'skill';
  if ((canBuyBetterGear(world) || canMineralUpgrade(world)) && rng() < 0.4) return 'gear';
  // A-11: 강화 광물 모으기 — 채굴 가능한 행성에 내렸을 때(사람 플레이: 착륙 → 스캔 → 채굴)
  if (mineralUpgradeTarget(world) && planetHasMineableOrbitalDeposits(world.currentPlanetId) && rng() < 0.1) return 'gear';
  // 산 함선 지키기(대표님 「파괴당하지 않게 함선을 업그레이드」) — 산 함선이고 강화할 게 남았으면 광물 산지 채굴·강화를 더 자주
  if ((world.hullRank ?? 0) > 0 && mineralUpgradeTarget(world) && rng() < 0.25) return 'gear';
  // 정복 유지 — 적과 맞닿은 아군 행성에 방위위성(돈이 남을 때)
  if (fortifyProbe(world) && rng() < 0.2) return 'develop';
  if (canDevelop(world) && world.credits >= 400 && rng() < 0.35) return 'develop';
  if (!world.capitalDestroyed && world.level >= 6 && rng() < 0.22) return 'capital';
  return null;
}

/** 정복 가능 여부(actions.ts 가 주입 — 순환 import 회피) */
let conquestProbe: (world: WorldState) => boolean = () => false;
export function setConquestProbe(fn: (world: WorldState) => boolean): void {
  conquestProbe = fn;
}

/** 위성으로 지킬 아군 행성이 있는가(actions.ts 주입) */
let fortifyProbe: (world: WorldState) => boolean = () => false;
export function setFortifyProbe(fn: (world: WorldState) => boolean): void {
  fortifyProbe = fn;
}

/**
 * 정복 우선(대표님 2026-10-10 플레이봇 목표: 레벨을 올리며 적정 레벨에 모든 행성 정복 → 엔드 콘텐츠).
 * 이길 수 있는 적 행성·편입 가능한 중립이 있으면 퀘스트 사이사이에 정복으로 간다. 트윈 행동 상수.
 */
const CONQUEST_PICK_FREE = 0.5;
const CONQUEST_PICK_ON_QUEST = 0.2;

export function decideIntentKind(world: WorldState, rng: Rng, persona: PersonaId): ActionKind {
  if (world.hangarShips <= 0) return 'travel';
  if (!world.earlyFeelClosed) return 'quest';
  if (!world.activeQuest && world.questCleared === 0 && nextPlayableMissionId(world)) {
    return 'quest';
  }
  if (rng() < (world.activeQuest ? CONQUEST_PICK_ON_QUEST : CONQUEST_PICK_FREE) && conquestProbe(world)) {
    return 'annex_path';
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
  if (!world.earlyFeelClosed) return intent;
  if (rng() < getLearnExploreRate()) {
    const w = pickWeighted(rng, getLiveWeights(persona));
    if (w === 'combat' && world.hangarShips <= 1) return intent;
    return w;
  }
  return intent;
}
