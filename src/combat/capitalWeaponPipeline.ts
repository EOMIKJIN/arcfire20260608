// ============================================================
// 전함 무기 파이프라인 — 단일 import 축
//
// 데이터 정본: weapon_list.csv → CAPITAL_WEAPON_LIST_FROM_CSV
// 패밀리 규약: tables/balance/weapon_family_runtime_policy.csv
// 레이저 등급색: tables/balance/weapon_laser_tier_color_policy.csv
// 상성: weapon_affinity_matrix.csv
//
// 구현 상태(2026-06):
// | family  | trajectory      | impact        | 연출        | 전투 |
// | laser   | instant_beam    | target_track  | 등급색 빔   | O    |
// | missile | bezier_guided   | target_track  | 회색 궤적   | O    |
// | rocket  | straight_fixed  | spread_circle | 주황 직선   | O    |
// | drone   | orbit_loiter    | spread_circle | 녹색 스텁   | △    |
// | carrier | arc_loiter_turn | spread_circle | 보라 스텁   | △    |
//
// 미구현 패밀리(drone/carrier)는 effectPending — 스폰은 straight 폴백,
// 선회·투하 경로는 capitalProjectileSpawn 확장 예정.
// ============================================================

export {
  resolveCapitalWeaponRuntimeSpec,
  isCapitalWeaponCombatActive,
  isRocketFamilyWeapon,
  isNovaAoeWeapon,
  type CapitalWeaponRuntimeSpec,
  type CapitalWeaponFamilyKind,
  type WeaponTrajectoryMode,
  type WeaponImpactMode,
  type WeaponHitFxKind,
  type WeaponImplementationStatus,
} from './capitalWeaponRuntimeSpec';

export {
  resolveCapitalLaserBeamPresentation,
  resolveCapitalProjectilePresentation,
  type CapitalLaserBeamPresentation,
  type CapitalProjectilePresentation,
} from './capitalWeaponPresentation';

export {
  buildCapitalProjectileSpawn,
  computeCapitalProjectileTravelMs,
  resolveCapitalProjectileSpeedPxPerMs,
  type CapitalProjectileSpawnParams,
  type CapitalProjectileSpawnResult,
} from './capitalProjectileSpawn';

export {
  resolveCapitalWeaponImpact,
  resolveCapitalWeaponHitFxKind,
  applyNovaAoeOnImpact,
  type CapitalWeaponImpactContext,
  type CapitalWeaponImpactResult,
} from './capitalWeaponImpact';
