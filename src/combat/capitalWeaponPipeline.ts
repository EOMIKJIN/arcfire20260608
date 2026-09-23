// ============================================================
// 전함 무기 파이프라인 — 단일 import 축
//
// 데이터 정본: weapon_list.csv → CAPITAL_WEAPON_LIST_FROM_CSV
// 패밀리 규약: tables/balance/weapon_family_runtime_policy.csv
// 레이저 등급색: tables/balance/weapon_laser_tier_color_policy.csv
// 특수무기 색·아이콘·상태: tables/balance/weapon_special_fx_policy.csv
// 상성: weapon_affinity_matrix.csv
//
// 구현 상태(2026-09):
// | family  | trajectory      | impact        | 연출           | 전투 |
// | laser   | instant_beam    | target_track  | 등급색 빔      | O    |
// | missile | bezier_guided   | target_track  | 회색 궤적      | O    |
// | rocket  | straight_fixed  | spread_circle | 흰색 직선      | O    |
// | drone   | orbit_loiter    | spread_circle | 붉은 원궤도    | O    |
// | carrier | arc_loiter_turn | spread_circle | 보라 8자+귀환  | O    |
//
// PlanetEdenRaidTestLayer = 본선 시뮬(허브·웨이브·STAGE3). 드라코는 같은 경로의 시험 베뉴.
// drone/carrier 스폰·틱은 본선 발사 큐(pushCapitalProjectileMissile → trySpawnCapitalCraftVolley).
// 재장전 < 선회수명이면 항창 회수(가장 오래된 동패밀리 기체). weapon_list 곡선은 읽지 않음.
// ============================================================

export {
  resolveCapitalWeaponRuntimeSpec,
  isCapitalWeaponCombatActive,
  isRocketFamilyWeapon,
  isCraftFamilyKind,
  isCraftFamilyWeapon,
  isCraftLoiterRuntimeActive,
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
  ROCKET_TEST_PRESENTATION,
  CRAFT_DRONE_HEAD_COLOR,
  CRAFT_CARRIER_HEAD_COLOR,
  CRAFT_DRONE_TRAIL_GLOW_COLOR,
  CRAFT_CARRIER_TRAIL_GLOW_COLOR,
  type CapitalLaserBeamPresentation,
  type CapitalProjectilePresentation,
} from './capitalWeaponPresentation';

export {
  getWeaponCraftLoiterPolicy,
  type WeaponCraftLoiterPolicy,
  type WeaponCraftFamilyKind,
} from './weaponCraftLoiterPolicy';

export {
  getWeaponSpecialFxPolicy,
  formatWeaponSpecialDisplayName,
  type WeaponSpecialFxPolicy,
  type WeaponSpecialIconKind,
} from './weaponSpecialFxPolicy';

export {
  CAPITAL_CRAFT_POOL_SIZE,
  countAliveCapitalCrafts,
  createCapitalCraftImpactScratch,
  createCapitalCraftPool,
  resetCapitalCraftPool,
  tickCapitalCrafts,
  trySpawnCapitalCraft,
  trySpawnCapitalCraftVolley,
  type CapitalCraft,
  type CapitalCraftAgentPose,
  type CapitalCraftImpactEvent,
  type CapitalCraftImpactScratch,
  type CapitalCraftSpawnInput,
} from './capitalCraftPool';

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
  applySpecialWeaponStatusOnAgent,
  applySpecialWeaponAoeAroundPoint,
  applyAllyHealAroundPoint,
  type CapitalWeaponImpactContext,
  type CapitalWeaponImpactResult,
  type SpecialWeaponAoeArgs,
} from './capitalWeaponImpact';
