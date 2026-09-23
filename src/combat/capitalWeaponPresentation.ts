// ============================================================
// 무기 연출 색상 — weapon_list(개별) + laser_tier_color_policy(등급 폴백)
// ============================================================

import { WeaponLaserTierColorPolicy_FROM_BALANCE_CSV } from '../data/balance/generated';
import { getCapitalWeaponRow } from '../game/capitalWeaponRegistry';
import { resolveCapitalWeaponRuntimeSpec } from './capitalWeaponRuntimeSpec';
import { getWeaponSpecialFxPolicy } from './weaponSpecialFxPolicy';

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
    trailColor: 'rgba(248,113,113,0.82)',
    trailGlowColor: 'rgba(220,38,38,0.5)',
    headColor: 'rgba(239,68,68,0.98)',
  },
  carrier: {
    trailColor: 'rgba(196,181,253,0.8)',
    trailGlowColor: 'rgba(167,139,250,0.5)',
    headColor: 'rgba(221,214,254,0.98)',
  },
};

/** STAGE3 크래프트 헤드 — 렌더 틱에서 resolveCapitalProjectilePresentation 재할당 금지 */
export const CRAFT_DRONE_HEAD_COLOR = 'rgba(239,68,68,0.98)';
export const CRAFT_CARRIER_HEAD_COLOR = 'rgba(221,214,254,0.98)';
export const CRAFT_DRONE_TRAIL_GLOW_COLOR = 'rgba(220,38,38,0.5)';
export const CRAFT_CARRIER_TRAIL_GLOW_COLOR = 'rgba(167,139,250,0.5)';

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

const laserPresentationCache = new Map<string, CapitalLaserBeamPresentation>();
const projectilePresentationCache = new Map<string, CapitalProjectilePresentation>();

/** 레이저 빔 색 — 특수 FX 틴트 > CSV laserColor > 요구레벨 구간 정책 */
export function resolveCapitalLaserBeamPresentation(weaponId: string): CapitalLaserBeamPresentation {
  const cached = laserPresentationCache.get(weaponId);
  if (cached) return cached;

  const special = getWeaponSpecialFxPolicy(weaponId);
  if (special?.tintHex) {
    const resolved: CapitalLaserBeamPresentation = {
      coreColor: special.tintHex,
      glowColor: special.glowHex || special.tintHex,
      glowWidthMul: 1.28,
      tierLabelKo: special.iconEmoji || 'SP',
    };
    laserPresentationCache.set(weaponId, resolved);
    return resolved;
  }

  const row = getCapitalWeaponRow(weaponId);
  if (!row) {
    laserPresentationCache.set(weaponId, DEFAULT_LASER);
    return DEFAULT_LASER;
  }

  const csvCore = normalizeHexColor(row.laserColor);
  const csvGlow = normalizeHexColor(row.glowColor);
  if (csvCore) {
    const resolved: CapitalLaserBeamPresentation = {
      coreColor: csvCore,
      glowColor: csvGlow ?? csvCore,
      glowWidthMul: 1.1,
      tierLabelKo: row.tierLabel || 'CSV',
    };
    laserPresentationCache.set(weaponId, resolved);
    return resolved;
  }

  const tier = resolveLaserTierPolicy(Math.max(1, row.requiredLevel || 1));
  const resolved: CapitalLaserBeamPresentation = {
    coreColor: normalizeHexColor(tier.beamCoreColor) ?? DEFAULT_LASER.coreColor,
    glowColor: normalizeHexColor(tier.beamGlowColor) ?? DEFAULT_LASER.glowColor,
    glowWidthMul: Number(tier.glowWidthMul) || 1,
    tierLabelKo: tier.tierLabelKo,
  };
  laserPresentationCache.set(weaponId, resolved);
  return resolved;
}

/** 로켓탄 테스트 기간 통일 연출 — 궤적 없음 · 기본 흰색 최소 타원 탄두 (대표님 지시 2026-07-22) */
export const ROCKET_TEST_PRESENTATION: CapitalProjectilePresentation = Object.freeze({
  trailColor: 'rgba(255,255,255,0.9)',
  trailGlowColor: 'rgba(255,255,255,0.4)',
  headColor: 'rgba(255,255,255,0.98)',
  headRadiusMul: 1,
  trailEnabled: false,
});

/** 발사체 궤적·탄두 — 특수 FX 틴트 > (로켓=흰색 무궤적) > CSV projectileColor > family 팔레트 */
export function resolveCapitalProjectilePresentation(weaponId: string): CapitalProjectilePresentation {
  const cached = projectilePresentationCache.get(weaponId);
  if (cached) return cached;

  const spec = resolveCapitalWeaponRuntimeSpec(weaponId);
  const family = spec?.familyKind ?? 'missile';
  const special = getWeaponSpecialFxPolicy(weaponId);
  if (special?.tintHex) {
    const resolved: CapitalProjectilePresentation = {
      trailColor: hexToRgba(special.tintHex, 0.88),
      trailGlowColor: hexToRgba(special.glowHex || special.tintHex, 0.45),
      headColor: hexToRgba(special.tintHex, 0.98),
      headRadiusMul: 1.12,
      trailEnabled: family !== 'rocket',
    };
    projectilePresentationCache.set(weaponId, resolved);
    return resolved;
  }

  /** 일반 로켓은 테스트 기간 흰색·무궤적 유지 (대표님 지시 2026-07-22) */
  if (family === 'rocket') {
    projectilePresentationCache.set(weaponId, ROCKET_TEST_PRESENTATION);
    return ROCKET_TEST_PRESENTATION;
  }

  const base = FAMILY_PROJECTILE_DEFAULTS[family] ?? FAMILY_PROJECTILE_DEFAULTS.missile;
  const csvColor = normalizeHexColor(spec?.row?.projectileColor ?? '');
  const resolved: CapitalProjectilePresentation = csvColor
    ? {
        trailColor: hexToRgba(csvColor, 0.88),
        trailGlowColor: hexToRgba(csvColor, 0.45),
        headColor: hexToRgba(csvColor, 0.98),
        headRadiusMul: 1,
        trailEnabled: true,
      }
    : {
        ...base,
        headRadiusMul: 1,
        trailEnabled: true,
      };
  projectilePresentationCache.set(weaponId, resolved);
  return resolved;
}
