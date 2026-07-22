// ============================================================
// 무기 연출 색상 — weapon_list(개별) + laser_tier_color_policy(등급 폴백)
// ============================================================

import { WeaponLaserTierColorPolicy_FROM_BALANCE_CSV } from '../data/balance/generated';
import { getCapitalWeaponRow } from '../game/capitalWeaponRegistry';
import { resolveCapitalWeaponRuntimeSpec } from './capitalWeaponRuntimeSpec';

export type CapitalLaserBeamPresentation = {
  coreColor: string;
  glowColor: string;
  glowWidthMul: number;
  tierLabelKo: string;
};

export type CapitalProjectilePresentation = {
  trailColor: string;
  trailGlowColor: string;
  headColor: string;
  headRadiusMul: number;
  /** false면 궤적(트레일) 미표시 — 탄두 점만 렌더(로켓탄 발칸 연출) */
  trailEnabled: boolean;
};

const DEFAULT_LASER: CapitalLaserBeamPresentation = {
  coreColor: '#EF4444',
  glowColor: '#FCA5A5',
  glowWidthMul: 1,
  tierLabelKo: 'T1',
};

const FAMILY_PROJECTILE_DEFAULTS: Record<
  string,
  Omit<CapitalProjectilePresentation, 'headRadiusMul' | 'trailEnabled'>
> = {
  missile: {
    trailColor: 'rgba(139,149,168,0.9)',
    trailGlowColor: 'rgba(156,170,194,0.7)',
    headColor: 'rgba(186,196,214,0.98)',
  },
  rocket: {
    trailColor: 'rgba(251,146,60,0.82)',
    trailGlowColor: 'rgba(249,115,22,0.55)',
    headColor: 'rgba(255,180,90,0.98)',
  },
  drone: {
    trailColor: 'rgba(134,239,172,0.75)',
    trailGlowColor: 'rgba(74,222,128,0.45)',
    headColor: 'rgba(167,243,208,0.98)',
  },
  carrier: {
    trailColor: 'rgba(196,181,253,0.8)',
    trailGlowColor: 'rgba(167,139,250,0.5)',
    headColor: 'rgba(221,214,254,0.98)',
  },
};

function normalizeHexColor(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (/^#[0-9A-Fa-f]{6}$/.test(t)) return t;
  if (/^#[0-9A-Fa-f]{3}$/.test(t)) {
    const r = t[1];
    const g = t[2];
    const b = t[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return null;
}

function hexToRgba(hex: string, alpha: number): string {
  const h = normalizeHexColor(hex) ?? '#EF4444';
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function resolveLaserTierPolicy(requiredLevel: number) {
  for (const row of WeaponLaserTierColorPolicy_FROM_BALANCE_CSV) {
    const min = Number(row.minRequiredLevel) || 1;
    const max = Number(row.maxRequiredLevel) || 999;
    if (requiredLevel >= min && requiredLevel <= max) return row;
  }
  return WeaponLaserTierColorPolicy_FROM_BALANCE_CSV[0];
}

/** 레이저 빔 색 — CSV laserColor 우선, 없으면 요구레벨 구간 정책(약=붉음 → 강=백색) */
export function resolveCapitalLaserBeamPresentation(weaponId: string): CapitalLaserBeamPresentation {
  const row = getCapitalWeaponRow(weaponId);
  if (!row) return DEFAULT_LASER;

  const csvCore = normalizeHexColor(row.laserColor);
  const csvGlow = normalizeHexColor(row.glowColor);
  if (csvCore) {
    return {
      coreColor: csvCore,
      glowColor: csvGlow ?? csvCore,
      glowWidthMul: 1.1,
      tierLabelKo: row.tierLabel || 'CSV',
    };
  }

  const tier = resolveLaserTierPolicy(Math.max(1, row.requiredLevel || 1));
  const core = normalizeHexColor(tier.beamCoreColor) ?? DEFAULT_LASER.coreColor;
  const glow = normalizeHexColor(tier.beamGlowColor) ?? DEFAULT_LASER.glowColor;
  return {
    coreColor: core,
    glowColor: glow,
    glowWidthMul: Number(tier.glowWidthMul) || 1,
    tierLabelKo: tier.tierLabelKo,
  };
}

/** 로켓탄 테스트 기간 통일 연출 — 궤적 없음 · 기본 흰색 최소 타원 탄두 (대표님 지시 2026-07-22) */
export const ROCKET_TEST_PRESENTATION: CapitalProjectilePresentation = Object.freeze({
  trailColor: 'rgba(255,255,255,0.9)',
  trailGlowColor: 'rgba(255,255,255,0.4)',
  headColor: 'rgba(255,255,255,0.98)',
  headRadiusMul: 1,
  trailEnabled: false,
});

/** 발사체 궤적·탄두 — CSV projectileColor 우선, 없으면 familyKind 기본 팔레트 */
export function resolveCapitalProjectilePresentation(weaponId: string): CapitalProjectilePresentation {
  const spec = resolveCapitalWeaponRuntimeSpec(weaponId);
  const family = spec?.familyKind ?? 'missile';
  /** 로켓 family는 테스트 기간 동안 CSV 색상보다 우선해 흰색·무궤적으로 통일 */
  if (family === 'rocket') return ROCKET_TEST_PRESENTATION;
  const base = FAMILY_PROJECTILE_DEFAULTS[family] ?? FAMILY_PROJECTILE_DEFAULTS.missile;
  const row = spec?.row;
  const csvColor = normalizeHexColor(row?.projectileColor ?? '');
  if (csvColor) {
    return {
      trailColor: hexToRgba(csvColor, 0.88),
      trailGlowColor: hexToRgba(csvColor, 0.45),
      headColor: hexToRgba(csvColor, 0.98),
      headRadiusMul: 1,
      trailEnabled: true,
    };
  }
  return {
    ...base,
    headRadiusMul: 1,
    trailEnabled: true,
  };
}
