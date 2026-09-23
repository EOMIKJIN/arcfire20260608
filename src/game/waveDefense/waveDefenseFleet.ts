// ============================================================
// 웨이브 디펜스 적함대 빌더 — 'red' 적 슬롯만 생성(플레이어 blue 기함은
// resolveStageFleetSeedSlotsForPlanet 가 자동 추가).
// 행성이 있으면 npc_enemy_* 목적지 헐, 없으면 targetCombatLevel → invader t1..t30.
// ============================================================

import { resolvePlanetTargetCombatLevel } from '../../arcCore/balance/balanceTableRegistry';
import type { CombatFleetSeedSlot } from '../../combat/capitalRealtimeCombatGate';
import { hasWaveShipId, listPlanetWaveEnemySlots } from './waveDefensePlanetEnemyIndex';

/** 테스트 한정: 전체 9웨이브 */
export const WAVE_DEFENSE_MAX_WAVES = 9;

/**
 * 동시 적함 상한 — 프레임·메모리 안전(전투 에이전트 폭증 방지).
 * 스펙상 ×2(3·6·12·24…)이나 9웨이브면 비현실적(768척)이라 12척으로 캡.
 * 웨이브 1~3은 스펙 그대로 3·6·12, 4+는 12 유지하고 상위 티어 적함으로 난도 상승.
 */
const WAVE_DEFENSE_MAX_CONCURRENT_ENEMIES = 12;

const WAVE_INVADER_TIER_MAX = 30;
const WAVE_INVADER_FALLBACK_ID = 'npc_wave_invader_t1';

const WAVE_ENEMY_CAPTAIN_ID = 'npc_cpt_ai_robot_default';

/** 웨이브 N 적함 수 — 3·6·12…(×2), 단 동시 상한 캡 */
export function waveDefenseEnemyCount(waveIndex: number): number {
  const n = Math.max(1, Math.floor(waveIndex));
  const ideal = 3 * Math.pow(2, n - 1);
  return Math.min(WAVE_DEFENSE_MAX_CONCURRENT_ENEMIES, ideal);
}

export function waveDefenseInvaderTier(combatLevel: number, waveIndex: number): number {
  const level = Math.max(1, Math.floor(combatLevel));
  const wave = Math.max(1, Math.floor(waveIndex));
  const base = Math.max(1, Math.ceil(level / 2));
  return Math.min(WAVE_INVADER_TIER_MAX, base + wave - 1);
}

export function waveDefenseInvaderShipId(combatLevel: number, waveIndex: number): string {
  const tier = waveDefenseInvaderTier(combatLevel, waveIndex);
  const id = `npc_wave_invader_t${tier}`;
  return hasWaveShipId(id) ? id : WAVE_INVADER_FALLBACK_ID;
}

/** 웨이브 N의 적 함선 id — planetId 있으면 목적지 헐/레벨, 없으면 레거시 t1..t5 */
export function waveDefenseEnemyShipId(waveIndex: number, planetId?: string | null): string {
  const wave = Math.max(1, Math.floor(waveIndex));
  const pid = planetId?.trim() ?? '';
  if (pid) {
    const planetSlots = listPlanetWaveEnemySlots(pid);
    if (planetSlots.length > 0) {
      const idx = Math.min(wave - 1, planetSlots.length - 1);
      return planetSlots[idx]!.shipId;
    }
    return waveDefenseInvaderShipId(resolvePlanetTargetCombatLevel(pid), wave);
  }
  const legacyTier = Math.min(5, wave);
  return `npc_wave_invader_t${legacyTier}`;
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
export function buildWaveDefenseEnemyFleet(
  waveIndex: number,
  planetId?: string | null,
): CombatFleetSeedSlot[] {
  const wave = Math.max(1, Math.floor(waveIndex));
  const count = waveDefenseEnemyCount(wave);
  const pid = planetId?.trim() ?? '';
  const planetSlots = pid ? listPlanetWaveEnemySlots(pid) : [];
  const fallbackShipId = waveDefenseEnemyShipId(wave, pid || null);
  const slots: CombatFleetSeedSlot[] = [];
  for (let i = 0; i < count; i += 1) {
    if (planetSlots.length > 0) {
      const pick = planetSlots[(wave - 1 + i) % planetSlots.length]!;
      slots.push({
        team: 'red',
        npcShipId: pick.shipId,
        captainId: pick.captainId,
        combatInstanceKey: `wave_defense_w${wave}_s${i}`,
      });
      continue;
    }
    slots.push({
      team: 'red',
      npcShipId: fallbackShipId,
      captainId: WAVE_ENEMY_CAPTAIN_ID,
      combatInstanceKey: `wave_defense_w${wave}_s${i}`,
    });
  }
  return slots;
}
