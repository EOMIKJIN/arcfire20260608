// ============================================================
// hostile_enemy_weapon_loadout_policy.csv — 적 스폰 A/B/C 무기 패턴
// ============================================================

import { getHostileLoadoutPolicyValue } from '../arcCore/balance/balanceTableRegistry';

export type HostileEnemyWeaponLoadout = {
  laserWeaponId: string;
  missileWeaponId: string;
};

function policyWeaponId(key: string, fallback: string): string {
  const v = getHostileLoadoutPolicyValue(key)?.trim();
  return v && v.length > 0 ? v : fallback;
}

/** spawnIndex % 3 → type_a / type_b / type_c 균등 분배 */
export function resolveHostileEnemyWeaponLoadout(
  spawnIndex: number,
  combatLevel: number,
): HostileEnemyWeaponLoadout {
  const pattern = ((spawnIndex % 3) + 3) % 3;
  const longMissileMin = Number(getHostileLoadoutPolicyValue('missile_long_combat_level_min') ?? 13);
  const useLongMissile = combatLevel >= longMissileMin;

  if (pattern === 0) {
    return {
      laserWeaponId: policyWeaponId('type_a_laser_weapon_id', 'w_laser_light_01'),
      missileWeaponId: policyWeaponId('type_a_rocket_weapon_id', 'w_laser_arc_007'),
    };
  }
  if (pattern === 1) {
    return {
      laserWeaponId: policyWeaponId('type_b_laser_weapon_id', 'w_laser_light_01'),
      missileWeaponId: useLongMissile
        ? policyWeaponId('type_b_missile_long_weapon_id', 'w_missile_arc_008')
        : policyWeaponId('type_b_missile_mid_weapon_id', 'w_missile_guided_triple_01'),
    };
  }
  return {
    laserWeaponId: policyWeaponId('type_c_rocket_weapon_id', 'w_laser_arc_012'),
    missileWeaponId: useLongMissile
      ? policyWeaponId('type_c_missile_long_weapon_id', 'w_missile_arc_014')
      : policyWeaponId('type_c_missile_mid_weapon_id', 'w_missile_barrage_01'),
  };
}
