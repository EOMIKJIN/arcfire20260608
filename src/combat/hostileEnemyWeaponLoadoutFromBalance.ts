// ============================================================
// hostile_enemy_weapon_loadout_policy.csv — 적 스폰 A/B/C 패턴
// 무기 id 는 존 combatLevel 곡선(CSV requiredLevel)에서 고른다.
// 정책 CSV 키 값은 폴백만 — 기존 행을 덮어쓰지 않음.
// ============================================================

import { getHostileLoadoutPolicyValue } from '../arcCore/balance/balanceTableRegistry';
import { CAPITAL_WEAPON_LIST_FROM_CSV } from '../data/generated/csvWeapons';

export type HostileEnemyWeaponLoadout = {
  laserWeaponId: string;
  missileWeaponId: string;
};

type WeaponFamily = 'laser' | 'missile' | 'rocket';

type CurveEntry = {
  id: string;
  requiredLevel: number;
};

function policyWeaponId(key: string, fallback: string): string {
  const v = getHostileLoadoutPolicyValue(key)?.trim();
  return v && v.length > 0 ? v : fallback;
}

let curveByFamily: Map<WeaponFamily, CurveEntry[]> | null = null;

function isCurveEligibleWeaponId(id: string): boolean {
  if (id.includes('wave') || id.includes('vmock')) return false;
  return true;
}

function getWeaponCurve(family: WeaponFamily): CurveEntry[] {
  if (!curveByFamily) {
    const built: Map<WeaponFamily, CurveEntry[]> = new Map([
      ['laser', []],
      ['missile', []],
      ['rocket', []],
    ]);
    const ids = Object.keys(CAPITAL_WEAPON_LIST_FROM_CSV);
    for (let i = 0; i < ids.length; i += 1) {
      const id = ids[i]!;
      if (!isCurveEligibleWeaponId(id)) continue;
      const row = CAPITAL_WEAPON_LIST_FROM_CSV[id];
      if (!row) continue;
      const fam = row.familyKind;
      if (fam !== 'laser' && fam !== 'missile' && fam !== 'rocket') continue;
      built.get(fam)!.push({
        id,
        requiredLevel: Number.isFinite(row.requiredLevel) ? row.requiredLevel : 1,
      });
    }
    for (const list of built.values()) {
      list.sort((a, b) => a.requiredLevel - b.requiredLevel || a.id.localeCompare(b.id));
    }
    curveByFamily = built;
  }
  return curveByFamily.get(family) ?? [];
}

/** requiredLevel ≤ combatLevel 중 최고. 없으면 정책 폴백. */
export function pickHostileWeaponByFamily(
  family: WeaponFamily,
  combatLevel: number,
  fallbackWeaponId: string,
): string {
  const list = getWeaponCurve(family);
  const cap = Math.max(1, Math.floor(combatLevel));
  let bestId = '';
  let bestLv = -1;
  for (let i = 0; i < list.length; i += 1) {
    const entry = list[i]!;
    if (entry.requiredLevel > cap) break;
    if (entry.requiredLevel >= bestLv) {
      bestLv = entry.requiredLevel;
      bestId = entry.id;
    }
  }
  if (bestId) return bestId;
  // 캡 아래 없음 → 고티어 정책 폴백 대신 계열 최저(초반 구매 가능)
  if (list.length > 0) return list[0]!.id;
  return fallbackWeaponId;
}

export function resolveHostileWeaponRequiredLevel(weaponId: string): number {
  const row = CAPITAL_WEAPON_LIST_FROM_CSV[weaponId.trim()];
  const lv = row?.requiredLevel;
  return typeof lv === 'number' && Number.isFinite(lv) ? lv : 1;
}

/** spawnIndex % 3 → type_a / type_b / type_c 균등 분배 */
export function resolveHostileEnemyWeaponLoadout(
  spawnIndex: number,
  combatLevel: number,
): HostileEnemyWeaponLoadout {
  const pattern = ((spawnIndex % 3) + 3) % 3;
  const longMissileMin = Number(getHostileLoadoutPolicyValue('missile_long_combat_level_min') ?? 13);
  const useLongMissile = combatLevel >= longMissileMin;
  const level = Math.max(1, Math.floor(combatLevel));

  if (pattern === 0) {
    return {
      laserWeaponId: pickHostileWeaponByFamily(
        'laser',
        level,
        policyWeaponId('type_a_laser_weapon_id', 'w_laser_light_01'),
      ),
      missileWeaponId: pickHostileWeaponByFamily(
        'rocket',
        level,
        policyWeaponId('type_a_rocket_weapon_id', 'w_laser_arc_007'),
      ),
    };
  }
  if (pattern === 1) {
    return {
      laserWeaponId: pickHostileWeaponByFamily(
        'laser',
        level,
        policyWeaponId('type_b_laser_weapon_id', 'w_laser_light_01'),
      ),
      missileWeaponId: pickHostileWeaponByFamily(
        'missile',
        level,
        useLongMissile
          ? policyWeaponId('type_b_missile_long_weapon_id', 'w_missile_arc_008')
          : policyWeaponId('type_b_missile_mid_weapon_id', 'w_missile_guided_triple_01'),
      ),
    };
  }
  return {
    laserWeaponId: pickHostileWeaponByFamily(
      'rocket',
      level,
      policyWeaponId('type_c_rocket_weapon_id', 'w_laser_arc_012'),
    ),
    missileWeaponId: pickHostileWeaponByFamily(
      'missile',
      level,
      useLongMissile
        ? policyWeaponId('type_c_missile_long_weapon_id', 'w_missile_arc_014')
        : policyWeaponId('type_c_missile_mid_weapon_id', 'w_missile_barrage_01'),
    ),
  };
}
