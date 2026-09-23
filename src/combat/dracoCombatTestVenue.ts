/**
 * 드라코 성운 — 임시 전투 테스트 베뉴 (2026-09-11)
 *
 * 2026-09-16 시험 종료. `DRACO_COMBAT_TEST_VENUE_ENABLED=false` —
 * 착륙 강제 9웨이브·시험 동료 4척 없음. 전투는 play_scenario CSV
 * (`targetCombatLevel=9` · `mainStageCombatEnabled` · `draco_boss`) 정본.
 * 재시험 시에만 아래 스위치를 true.
 *
 * 에셋 import 없음 — 트리거·시드 테스트에서 tsx 직접 실행 가능.
 */

import type { CombatFleetSeedSlot } from './capitalRealtimeCombatGate';
import type { PlanetWaveCombatTrigger } from '../game/waveDefense/evaluatePlanetWaveCombatTrigger';
import {
  getCaptainTacticDoctrine,
  type CaptainTacticDoctrine,
} from './maneuver/captainTacticDoctrine';

export const DRACO_COMBAT_TEST_PLANET_ID = 'draco_haven';
export const DRACO_COMBAT_TEST_SYSTEM_ID = 'draco_nebula';

/** 대표님 2026-09-16 — 시험 종료. 일반 전투레벨만. */
export const DRACO_COMBAT_TEST_VENUE_ENABLED = false;

export const DRACO_TEST_LONG_CAPTAIN_ID = 'npc_cpt_draco_test_long';
export const DRACO_TEST_SHORT_CAPTAIN_ID = 'npc_cpt_draco_test_short';
export const DRACO_TEST_DRONE_CAPTAIN_ID = 'npc_cpt_draco_test_drone';
export const DRACO_TEST_CARRIER_CAPTAIN_ID = 'npc_cpt_draco_test_carrier';
export const DRACO_TEST_LONG_SHIP_ID = 'npc_draco_patrol_01';
export const DRACO_TEST_SHORT_SHIP_ID = 'npc_draco_escort_01';

/** 기존 장거리 미사일(사거리 211) — 신규 CSV 행 없음 */
export const DRACO_TEST_LONG_MISSILE_WEAPON_ID = 'w_missile_arc_022';
export const DRACO_TEST_LONG_LASER_WEAPON_ID = 'w_laser_light_01';
/** 단거리 로켓(사거리 93) */
export const DRACO_TEST_SHORT_CLOSE_WEAPON_ID = 'w_missile_arc_005';
export const DRACO_TEST_SHORT_LASER_WEAPON_ID = 'w_laser_heavy_01';
/** 기존 드론·함재기 행 — weapon_list 곡선 미변경 */
export const DRACO_TEST_DRONE_MISSILE_WEAPON_ID = 'w_missile_arc_003';
export const DRACO_TEST_CARRIER_MISSILE_WEAPON_ID = 'w_missile_arc_006';

export function isDracoCombatTestVenue(planetId: string | null | undefined): boolean {
  if (!DRACO_COMBAT_TEST_VENUE_ENABLED) return false;
  return (planetId ?? '').trim() === DRACO_COMBAT_TEST_PLANET_ID;
}

export function isDracoCombatTestAllyCaptain(captainId: string | null | undefined): boolean {
  const id = (captainId ?? '').trim();
  return (
    id === DRACO_TEST_LONG_CAPTAIN_ID
    || id === DRACO_TEST_SHORT_CAPTAIN_ID
    || id === DRACO_TEST_DRONE_CAPTAIN_ID
    || id === DRACO_TEST_CARRIER_CAPTAIN_ID
  );
}

export function dracoCombatTestAllySlots(): CombatFleetSeedSlot[] {
  return [
    {
      team: 'blue',
      npcShipId: DRACO_TEST_LONG_SHIP_ID,
      captainId: DRACO_TEST_LONG_CAPTAIN_ID,
      combatInstanceKey: 'draco_test_ally_long',
    },
    {
      team: 'blue',
      npcShipId: DRACO_TEST_SHORT_SHIP_ID,
      captainId: DRACO_TEST_SHORT_CAPTAIN_ID,
      combatInstanceKey: 'draco_test_ally_short',
    },
    {
      team: 'blue',
      npcShipId: DRACO_TEST_LONG_SHIP_ID,
      captainId: DRACO_TEST_DRONE_CAPTAIN_ID,
      combatInstanceKey: 'draco_test_ally_drone',
    },
    {
      team: 'blue',
      npcShipId: DRACO_TEST_SHORT_SHIP_ID,
      captainId: DRACO_TEST_CARRIER_CAPTAIN_ID,
      combatInstanceKey: 'draco_test_ally_carrier',
    },
  ];
}

export function appendDracoCombatTestAllies(
  planetId: string,
  slots: CombatFleetSeedSlot[],
): CombatFleetSeedSlot[] {
  if (!isDracoCombatTestVenue(planetId)) return slots;
  const out = slots.slice();
  const allies = dracoCombatTestAllySlots();
  for (let i = 0; i < allies.length; i++) {
    const ally = allies[i]!;
    if (out.some((s) => s.captainId === ally.captainId)) continue;
    out.push(ally);
  }
  return out;
}

export type DracoCombatTestRuntimePatch = {
  laserWeaponId: string;
  missileWeaponId: string;
  closeRangeWeaponId: string;
  displayName: string;
};

export function resolveDracoCombatTestRuntimePatch(
  captainId: string | null | undefined,
): DracoCombatTestRuntimePatch | null {
  const id = (captainId ?? '').trim();
  if (id === DRACO_TEST_LONG_CAPTAIN_ID) {
    return {
      laserWeaponId: DRACO_TEST_LONG_LASER_WEAPON_ID,
      missileWeaponId: DRACO_TEST_LONG_MISSILE_WEAPON_ID,
      closeRangeWeaponId: '',
      displayName: '시험 장거리',
    };
  }
  if (id === DRACO_TEST_SHORT_CAPTAIN_ID) {
    return {
      laserWeaponId: DRACO_TEST_SHORT_LASER_WEAPON_ID,
      missileWeaponId: '',
      closeRangeWeaponId: DRACO_TEST_SHORT_CLOSE_WEAPON_ID,
      displayName: '시험 단거리',
    };
  }
  if (id === DRACO_TEST_DRONE_CAPTAIN_ID) {
    return {
      laserWeaponId: DRACO_TEST_LONG_LASER_WEAPON_ID,
      missileWeaponId: DRACO_TEST_DRONE_MISSILE_WEAPON_ID,
      closeRangeWeaponId: DRACO_TEST_SHORT_CLOSE_WEAPON_ID,
      displayName: '시험 드론',
    };
  }
  if (id === DRACO_TEST_CARRIER_CAPTAIN_ID) {
    return {
      laserWeaponId: DRACO_TEST_LONG_LASER_WEAPON_ID,
      missileWeaponId: DRACO_TEST_CARRIER_MISSILE_WEAPON_ID,
      closeRangeWeaponId: DRACO_TEST_SHORT_CLOSE_WEAPON_ID,
      displayName: '시험 함재기',
    };
  }
  return null;
}

export function resolveDracoCombatTestDoctrine(
  captainId: string | null | undefined,
): CaptainTacticDoctrine | null {
  const id = (captainId ?? '').trim();
  if (id === DRACO_TEST_LONG_CAPTAIN_ID) return getCaptainTacticDoctrine('long_range_hold');
  if (id === DRACO_TEST_SHORT_CAPTAIN_ID) return getCaptainTacticDoctrine('close_assault');
  if (id === DRACO_TEST_DRONE_CAPTAIN_ID) return getCaptainTacticDoctrine('long_range_hold');
  if (id === DRACO_TEST_CARRIER_CAPTAIN_ID) return getCaptainTacticDoctrine('long_range_hold');
  return null;
}

/** 베뉴 OFF면 평가값 그대로. ON일 때만 쿨다운 외 9웨이브 시험 발화. */
export function applyDracoCombatTestWaveTrigger(
  planetId: string,
  evaluated: PlanetWaveCombatTrigger,
): PlanetWaveCombatTrigger {
  if (!isDracoCombatTestVenue(planetId)) return evaluated;
  if (evaluated.enabled) {
    if (evaluated.variant === 'endgame_boss') return evaluated;
    return { ...evaluated, variant: 'draco_wave' };
  }
  if (evaluated.rule === 'victory_cooldown') return evaluated;
  return { enabled: true, rule: 'draco_combat_test', variant: 'draco_wave' };
}
