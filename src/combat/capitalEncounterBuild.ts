import { useEffect } from 'react';
import type { Agent } from '../components/planet/PlanetEdenRaidTestLayer';
import type { PlayerShip } from '../types';
import { resolveNpcCapitalShip } from '../npc';
import type { NpcCapitalShipResolved } from '../types';
import type { CapitalRealtimeCombatSim, CapitalRealtimeEncounterLayout } from './capitalRealtimeTypes';
import { applyCapitalRealtimeEncounterLayout } from './useCapitalRealtimeEncounterLayout';

/** 실시간 시뮬 Agent에 덮어쓸 운동·가속 필드(미지정 시 init 기본 유지) */
export type CapitalRealtimeSimSlotKnobs = Partial<
  Pick<Agent, 'maxMoveSpeedPxPerMs' | 'accelPxPerMs2' | 'maxTurnRateRadPerMs' | 'turnAccelRadPerMs2'>
>;

/**
 * `initAgents` 기본값과 동기화할 것 (`PlanetEdenRaidTestLayer`).
 * 살보·미사일 상한 등 규약은 `capitalCombatConventions.ts`, 시뮬 튜닝은 이 베이스에 슬롯 배율을 곱한다.
 */
const SIM_BASE_RED: CapitalRealtimeSimSlotKnobs = {
  maxMoveSpeedPxPerMs: 0.0238,
  accelPxPerMs2: 0.000038,
  maxTurnRateRadPerMs: 0.0042 * 0.5,
  turnAccelRadPerMs2: 0.00012 * 0.5,
};

const SIM_BASE_BLUE: CapitalRealtimeSimSlotKnobs = {
  maxMoveSpeedPxPerMs: 0.0196,
  accelPxPerMs2: 0.000032,
  maxTurnRateRadPerMs: 0.0036 * 0.5,
  turnAccelRadPerMs2: 0.0001 * 0.5,
};

export type CapitalRealtimeEncounterSimPatch = {
  slot0?: CapitalRealtimeSimSlotKnobs;
  slot1?: CapitalRealtimeSimSlotKnobs;
};

export type CapitalRealtimeEncounterBuildSource = {
  kind: 'duel_capital';
  enemyCapitalNpcId: string;
  /** 스냅샷(빌드 시점 함선 상태) */
  playerShipSnapshot: PlayerShip;
};

/** 플레이어·NPC·장비에서 파생한 단일 교전 패키지 */
export type CapitalRealtimeEncounterBuild = {
  source: CapitalRealtimeEncounterBuildSource;
  layout: CapitalRealtimeEncounterLayout;
  simPatch: CapitalRealtimeEncounterSimPatch;
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function derivePlayerSlotSimPatch(ship: PlayerShip): CapitalRealtimeSimSlotKnobs {
  const refSpeed = 5;
  let mul = 1 + (ship.speed - refSpeed) * 0.035;
  for (const eq of ship.equipment) {
    if (eq.type === 'engine' && typeof eq.effect.speed === 'number') {
      mul += eq.effect.speed * 0.025;
    }
  }
  mul = clamp(mul, 0.86, 1.14);
  return {
    maxMoveSpeedPxPerMs: (SIM_BASE_BLUE.maxMoveSpeedPxPerMs ?? 0) * mul,
    accelPxPerMs2: (SIM_BASE_BLUE.accelPxPerMs2 ?? 0) * mul,
    maxTurnRateRadPerMs: (SIM_BASE_BLUE.maxTurnRateRadPerMs ?? 0) * mul,
    turnAccelRadPerMs2: (SIM_BASE_BLUE.turnAccelRadPerMs2 ?? 0) * mul,
  };
}

function deriveEnemySlotSimPatch(resolved: NpcCapitalShipResolved): CapitalRealtimeSimSlotKnobs {
  const tier = resolved.hullClass.threatTier;
  const mul = clamp(0.9 + (tier - 5) * 0.028, 0.84, 1.18);
  return {
    maxMoveSpeedPxPerMs: (SIM_BASE_RED.maxMoveSpeedPxPerMs ?? 0) * mul,
    accelPxPerMs2: (SIM_BASE_RED.accelPxPerMs2 ?? 0) * mul,
    maxTurnRateRadPerMs: (SIM_BASE_RED.maxTurnRateRadPerMs ?? 0) * mul,
    turnAccelRadPerMs2: (SIM_BASE_RED.turnAccelRadPerMs2 ?? 0) * mul,
  };
}

function applySlotKnobs(ag: Agent, knobs: CapitalRealtimeSimSlotKnobs | undefined): void {
  if (!knobs) return;
  if (knobs.maxMoveSpeedPxPerMs !== undefined) ag.maxMoveSpeedPxPerMs = knobs.maxMoveSpeedPxPerMs;
  if (knobs.accelPxPerMs2 !== undefined) ag.accelPxPerMs2 = knobs.accelPxPerMs2;
  if (knobs.maxTurnRateRadPerMs !== undefined) ag.maxTurnRateRadPerMs = knobs.maxTurnRateRadPerMs;
  if (knobs.turnAccelRadPerMs2 !== undefined) ag.turnAccelRadPerMs2 = knobs.turnAccelRadPerMs2;
}

/** 레이아웃(HP·팀) + 시뮬 운동계 패치를 한 번에 적용 */
export function applyCapitalRealtimeEncounterBuild(
  sim: CapitalRealtimeCombatSim,
  build: CapitalRealtimeEncounterBuild,
): void {
  applyCapitalRealtimeEncounterLayout(sim, build.layout);
  const agents = sim.agentsRef.current;
  if (agents.length < 1) return;
  for (const ag of agents) {
    const knobs = ag.team === build.layout.slot0.team ? build.simPatch.slot0 : build.simPatch.slot1;
    applySlotKnobs(ag, knobs);
  }
}

/**
 * 전함 1:1 실시간 교전용 빌드 — 플레이어 함선(장비 포함) + NPC 전함 id.
 * 이동중 전투는 테이블 정본만 사용하므로, 미등록 id는 즉시 오류로 본다.
 */
export function buildCapitalRealtimeEncounterDuel(input: {
  playerShip: PlayerShip;
  enemyCapitalNpcId: string;
}): CapitalRealtimeEncounterBuild {
  const enemy = resolveNpcCapitalShip(input.enemyCapitalNpcId);
  if (!enemy) {
    throw new Error(`buildCapitalRealtimeEncounterDuel: unknown enemyCapitalNpcId=${input.enemyCapitalNpcId}`);
  }
  const enemyHp = Math.max(1, enemy.combat.maxHp);

  const layout: CapitalRealtimeEncounterLayout = {
    slot0: {
      team: 'red',
      stroke: '#D62839',
      maxHullHp: enemyHp,
    },
    slot1: {
      team: 'blue',
      stroke: '#5B8DEF',
      maxHullHp: Math.max(1, input.playerShip.maxHp),
    },
  };

  const simPatch: CapitalRealtimeEncounterSimPatch = {
    slot0: deriveEnemySlotSimPatch(enemy),
    slot1: derivePlayerSlotSimPatch(input.playerShip),
  };

  return {
    source: {
      kind: 'duel_capital',
      enemyCapitalNpcId: input.enemyCapitalNpcId,
      playerShipSnapshot: input.playerShip,
    },
    layout,
    simPatch,
  };
}

/** 교전 진입·`build` 변경 시 레이아웃·시뮬 패치 재적용 */
export function useCapitalRealtimeEncounterBuildEffect(
  sim: CapitalRealtimeCombatSim | null,
  build: CapitalRealtimeEncounterBuild | null,
): void {
  useEffect(() => {
    if (!sim || !build) return;
    applyCapitalRealtimeEncounterBuild(sim, build);
  }, [sim, build]);
}
