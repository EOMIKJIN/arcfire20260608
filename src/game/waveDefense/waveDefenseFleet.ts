// ============================================================
// 웨이브 디펜스 적함대 빌더 — 'red' 적 슬롯만 생성(플레이어 blue 기함은
// resolveStageFleetSeedSlotsForPlanet 가 자동 추가).
// 판 수·척수·편성 존은 planet_wave_defense_policy.csv (수도 방향으로 강화).
// ============================================================

import { resolvePlanetTargetCombatLevel } from '../../arcCore/balance/balanceTableRegistry';
import type { CombatFleetSeedSlot } from '../../combat/capitalRealtimeCombatGate';
import { hasWaveShipId, listPlanetWaveEnemySlots } from './waveDefensePlanetEnemyIndex';
import {
  resolvePlanetWaveDefenseMaxWaves,
  resolvePlanetWaveDefenseWave,
  WAVE_DEFENSE_ABSOLUTE_MAX_WAVES,
} from './planetWaveDefensePolicy';

/** 절대 상한(후반·수도). 행성별 판 수는 resolvePlanetWaveDefenseMaxWaves */
export const WAVE_DEFENSE_MAX_WAVES = WAVE_DEFENSE_ABSOLUTE_MAX_WAVES;

export {
  resolvePlanetWaveDefenseMaxWaves,
  resolvePlanetWaveDefenseWave,
  WAVE_DEFENSE_ABSOLUTE_MAX_WAVES,
} from './planetWaveDefensePolicy';

const WAVE_INVADER_TIER_MAX = 30;
const WAVE_INVADER_FALLBACK_ID = 'npc_wave_invader_t1';

const WAVE_ENEMY_CAPTAIN_ID = 'npc_cpt_ai_robot_default';

/** 웨이브 N 적함 수. planetId 있으면 CSV, 없으면 레거시 3·6·12 */
export function waveDefenseEnemyCount(waveIndex: number, planetId?: string | null): number {
  const wave = Math.max(1, Math.floor(waveIndex));
  if (planetId?.trim()) {
    return resolvePlanetWaveDefenseWave(planetId, wave).enemyCount;
  }
  const ideal = 3 * Math.pow(2, wave - 1);
  return Math.min(12, ideal);
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

/** 웨이브 N의 적 함선 id — 수도 방향 소스 행성 헐, 없으면 인베이더 */
export function waveDefenseEnemyShipId(waveIndex: number, planetId?: string | null): string {
  const wave = Math.max(1, Math.floor(waveIndex));
  const pid = planetId?.trim() ?? '';
  if (pid) {
    const spec = resolvePlanetWaveDefenseWave(pid, wave);
    const planetSlots = listPlanetWaveEnemySlots(spec.sourcePlanetId);
    if (planetSlots.length > 0) {
      return planetSlots[(wave - 1) % planetSlots.length]!.shipId;
    }
    return waveDefenseInvaderShipId(resolvePlanetTargetCombatLevel(spec.sourcePlanetId), wave);
  }
  const legacyTier = Math.min(5, wave);
  return `npc_wave_invader_t${legacyTier}`;
}

const WAVE_DEFENSE_EXP_PER_ENEMY = 10;

export function waveDefenseWaveExpReward(waveIndex: number, planetId?: string | null): number {
  const n = Math.max(1, Math.floor(waveIndex));
  return waveDefenseEnemyCount(n, planetId) * WAVE_DEFENSE_EXP_PER_ENEMY * n;
}

/** 웨이브 N의 적(red) 함대 시드 — 플레이어 blue 슬롯은 seam이 자동 추가 */
export function buildWaveDefenseEnemyFleet(
  waveIndex: number,
  planetId?: string | null,
): CombatFleetSeedSlot[] {
  const wave = Math.max(1, Math.floor(waveIndex));
  const pid = planetId?.trim() ?? '';
  const spec = pid
    ? resolvePlanetWaveDefenseWave(pid, wave)
    : { enemyCount: waveDefenseEnemyCount(wave), sourcePlanetId: '', maxWaves: WAVE_DEFENSE_MAX_WAVES, sourceZoneIndex: 1 };
  const count = spec.enemyCount;
  const sourcePlanetId = spec.sourcePlanetId;
  const planetSlots = sourcePlanetId ? listPlanetWaveEnemySlots(sourcePlanetId) : [];
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
        isLeader: i === 0,
        sourcePlanetId,
      });
      continue;
    }
    slots.push({
      team: 'red',
      npcShipId: fallbackShipId,
      captainId: WAVE_ENEMY_CAPTAIN_ID,
      combatInstanceKey: `wave_defense_w${wave}_s${i}`,
      isLeader: i === 0,
      sourcePlanetId: sourcePlanetId || null,
    });
  }
  return slots;
}
