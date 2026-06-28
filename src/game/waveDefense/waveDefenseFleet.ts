// ============================================================
// 웨이브 디펜스 적함대 빌더 — 'red' 적 슬롯만 생성(플레이어 blue 기함은
// resolveStageFleetSeedSlotsForPlanet 가 자동 추가).
// 적함은 기존 테이블의 웨이브 적함(npc_wave_invader_t*) + AI봇 함장(npc_cpt_ai_robot_default).
// ============================================================

import type { CombatFleetSeedSlot } from '../../combat/capitalRealtimeCombatGate';

/** 테스트 한정: 전체 9웨이브 */
export const WAVE_DEFENSE_MAX_WAVES = 9;

/**
 * 동시 적함 상한 — 프레임·메모리 안전(전투 에이전트 폭증 방지).
 * 스펙상 ×2(3·6·12·24…)이나 9웨이브면 비현실적(768척)이라 12척으로 캡.
 * 웨이브 1~3은 스펙 그대로 3·6·12, 4+는 12 유지하고 상위 티어 적함으로 난도 상승.
 */
const WAVE_DEFENSE_MAX_CONCURRENT_ENEMIES = 12;

/** 웨이브 적함 티어(이미 테이블에 존재) — 웨이브가 올라갈수록 상위 티어 */
const WAVE_ENEMY_SHIP_TIERS = [
  'npc_wave_invader_t1',
  'npc_wave_invader_t2',
  'npc_wave_invader_t3',
  'npc_wave_invader_t4',
  'npc_wave_invader_t5',
];

const WAVE_ENEMY_CAPTAIN_ID = 'npc_cpt_ai_robot_default';

/** 웨이브 N 적함 수 — 3·6·12…(×2), 단 동시 상한 캡 */
export function waveDefenseEnemyCount(waveIndex: number): number {
  const n = Math.max(1, Math.floor(waveIndex));
  const ideal = 3 * Math.pow(2, n - 1);
  return Math.min(WAVE_DEFENSE_MAX_CONCURRENT_ENEMIES, ideal);
}

/** 웨이브 N의 적 함선 id(웨이브↑ → 상위 티어, 가용 티어 내에서 클램프) */
export function waveDefenseEnemyShipId(waveIndex: number): string {
  const idx = Math.min(Math.max(0, Math.floor(waveIndex) - 1), WAVE_ENEMY_SHIP_TIERS.length - 1);
  return WAVE_ENEMY_SHIP_TIERS[idx] ?? WAVE_ENEMY_SHIP_TIERS[0]!;
}

/** 적함 1척당 기본 경험치(npc_wave_invader expReward 기준) */
const WAVE_DEFENSE_EXP_PER_ENEMY = 10;

/**
 * 웨이브 N 클리어 보상 경험치 — 적함 수 × 적함당 기본 exp × 웨이브 가중(깊을수록 ↑).
 * 전투 결과창의 "경험치 획득" 표기 및 실제 지급(addExp)에 사용한다.
 */
export function waveDefenseWaveExpReward(waveIndex: number): number {
  const n = Math.max(1, Math.floor(waveIndex));
  return waveDefenseEnemyCount(n) * WAVE_DEFENSE_EXP_PER_ENEMY * n;
}

/** 웨이브 N의 적(red) 함대 시드 — 플레이어 blue 슬롯은 seam이 자동 추가 */
export function buildWaveDefenseEnemyFleet(waveIndex: number): CombatFleetSeedSlot[] {
  const count = waveDefenseEnemyCount(waveIndex);
  const shipId = waveDefenseEnemyShipId(waveIndex);
  const slots: CombatFleetSeedSlot[] = [];
  for (let i = 0; i < count; i += 1) {
    slots.push({
      team: 'red',
      npcShipId: shipId,
      captainId: WAVE_ENEMY_CAPTAIN_ID,
      combatInstanceKey: `wave_defense_w${waveIndex}_s${i}`,
    });
  }
  return slots;
}
