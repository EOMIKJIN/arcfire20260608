// ============================================================
// ship_equipment_effect_policy.csv — 장비 효과 환산·상한 (Table-First · 2026-10-10)
// 코드에 수치를 두지 않는다. 키 누락은 테스트(shipEquipmentEffectPolicy.test)에서 잡는다.
// ============================================================

import { ShipEquipmentEffectPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated/csvShipEquipmentEffectPolicy';

export const SHIP_EQUIPMENT_EFFECT_POLICY_KEYS = [
  'stat_hp_pct_per_armor_pct',
  'stat_hp_pct_per_power_efficiency_pct',
  'cap_shield_pct',
  'cap_armor_pct',
  'cap_damage_reduction_pct',
  'cap_cooldown_reduction_pct',
  'cap_detect_range_pct',
  'cap_speed_pct',
  'cap_maneuver_pct',
  'conv_detect_per_link_stability',
  'conv_detect_per_stealth_detect',
  'conv_cooldown_per_overheat',
  'conv_cooldown_per_power_efficiency',
  'conv_cooldown_per_overheat_post_sum',
  'runtime_speed_motion_mul',
  'runtime_maneuver_motion_mul',
  'runtime_cooldown_factor_min',
  'runtime_cooldown_floor_ms',
  'knob_evasion_pct_per_ac',
  'knob_incoming_damage_mul_floor',
  'knob_missile_miss_max',
  'knob_missile_miss_per_pct',
  'knob_hull_regen_min_per_tick',
  'knob_hull_regen_ticks_per_sec',
] as const;

export type ShipEquipmentEffectPolicyKey = (typeof SHIP_EQUIPMENT_EFFECT_POLICY_KEYS)[number];

let byKey: Map<string, number> | null = null;

/** 정책 값 — 키가 없으면 NaN(테스트로 차단) */
export function shipEquipmentPolicy(key: ShipEquipmentEffectPolicyKey): number {
  if (!byKey) {
    const m = new Map<string, number>();
    for (const row of ShipEquipmentEffectPolicy_FROM_BALANCE_CSV) {
      m.set(String(row.key).trim(), Number(row.value));
    }
    byKey = m;
  }
  return byKey.get(key) ?? Number.NaN;
}
