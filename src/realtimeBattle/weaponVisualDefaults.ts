// ============================================================
// 실시간 전투 — 무기 시각 스펙 기본값 (이미지 없이 수치만)
// ============================================================

import type { BattleEmpVisualSpec, BattleLaserVisualSpec, BattleMissileVisualSpec, BattleWeaponVisualKind } from './battleTypes';

const LASER_DEFAULT: BattleLaserVisualSpec = {
  kind: 'laser',
  widthPx: 3,
  segmentCount: 3,
  coreColor: 0xff6b9d,
  glowColor: 0x5b9bff,
};

const MISSILE_DEFAULT: BattleMissileVisualSpec = {
  kind: 'missile',
  trailMaxPoints: 12,
  headColor: 0xffcc66,
  trailColor: 0xaa6622,
};

const EMP_DEFAULT: BattleEmpVisualSpec = {
  kind: 'emp_burst',
  ringCount: 3,
  durationMs: 420,
  color: 0x9f7bff,
};

export function defaultWeaponVisual(kind: BattleWeaponVisualKind): BattleLaserVisualSpec | BattleMissileVisualSpec | BattleEmpVisualSpec {
  switch (kind) {
    case 'laser':
      return { ...LASER_DEFAULT };
    case 'missile':
      return { ...MISSILE_DEFAULT };
    case 'emp_burst':
      return { ...EMP_DEFAULT };
    default:
      return { ...LASER_DEFAULT };
  }
}
