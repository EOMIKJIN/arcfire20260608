import { WeaponRocketBurstPolicy_FROM_BALANCE_CSV } from '../data/balance/generated';
import type { CapitalWeaponCsvRow } from '../data/generated';
import { getCapitalWeaponRow, isKnownCapitalWeaponId } from './capitalWeaponRowLookup';

export { getCapitalWeaponRow, isKnownCapitalWeaponId };
export type { CapitalWeaponCsvRow };

/** weapon_rocket_burst_policy.csv — 발칸식 연사·탄착분포 파라미터 (모듈 1회 파싱) */
export type RocketBurstPolicy = {
  dispersionRadiusMulOfRange: number;
  dispersionRadiusMinPx: number;
  dispersionRadiusMaxPx: number;
  hitRadiusMulOfDispersion: number;
  missOvershootMinPx: number;
  missOvershootMaxPx: number;
  salvoIntervalFloorMs: number;
  /** 발사구 좌우 오프셋(px) — 선수(레이저)는 레이저 전용, 로켓은 좌우 교대 발사 */
  muzzleLateralOffsetPx: number;
  muzzleForwardOffsetPx: number;
};

/** 분산 기준: 전함 정면 실픽셀(다이아몬드 half 7px → 정면폭 ≈14px)에 맞춘 탄착군 */
const FALLBACK_ROCKET_BURST_POLICY: RocketBurstPolicy = {
  dispersionRadiusMulOfRange: 0.1,
  dispersionRadiusMinPx: 8,
  dispersionRadiusMaxPx: 12,
  hitRadiusMulOfDispersion: 0.84,
  missOvershootMinPx: 44,
  missOvershootMaxPx: 84,
  salvoIntervalFloorMs: 45,
  muzzleLateralOffsetPx: 6,
  muzzleForwardOffsetPx: 4,
};

let rocketBurstPolicyCache: RocketBurstPolicy | null = null;

export function getRocketBurstPolicy(): RocketBurstPolicy {
  if (rocketBurstPolicyCache) return rocketBurstPolicyCache;
  const row = WeaponRocketBurstPolicy_FROM_BALANCE_CSV.find(
    (r) => r.familyKind.trim() === 'rocket',
  );
  const num = (raw: string | undefined, fallback: number): number => {
    const v = Number(raw);
    return Number.isFinite(v) && v > 0 ? v : fallback;
  };
  const fb = FALLBACK_ROCKET_BURST_POLICY;
  rocketBurstPolicyCache = {
    dispersionRadiusMulOfRange: num(row?.dispersionRadiusMulOfRange, fb.dispersionRadiusMulOfRange),
    dispersionRadiusMinPx: num(row?.dispersionRadiusMinPx, fb.dispersionRadiusMinPx),
    dispersionRadiusMaxPx: num(row?.dispersionRadiusMaxPx, fb.dispersionRadiusMaxPx),
    hitRadiusMulOfDispersion: Math.min(
      1,
      num(row?.hitRadiusMulOfDispersion, fb.hitRadiusMulOfDispersion),
    ),
    missOvershootMinPx: num(row?.missOvershootMinPx, fb.missOvershootMinPx),
    missOvershootMaxPx: num(row?.missOvershootMaxPx, fb.missOvershootMaxPx),
    salvoIntervalFloorMs: num(row?.salvoIntervalFloorMs, fb.salvoIntervalFloorMs),
    muzzleLateralOffsetPx: num(
      (row as { muzzleLateralOffsetPx?: string } | undefined)?.muzzleLateralOffsetPx,
      fb.muzzleLateralOffsetPx,
    ),
    muzzleForwardOffsetPx: num(
      (row as { muzzleForwardOffsetPx?: string } | undefined)?.muzzleForwardOffsetPx,
      fb.muzzleForwardOffsetPx,
    ),
  };
  return rocketBurstPolicyCache;
}

/** CSV `타겟팅`=타겟점 — 유도 재조준 없이 착탄점 고정 */
export function shouldLockMissileImpactPoint(weaponId: string): boolean {
  return getCapitalWeaponRow(weaponId)?.lockImpactPoint ?? false;
}

export function resolveMissileSalvoCount(weaponId: string): number {
  const row = getCapitalWeaponRow(weaponId);
  if (!row) return 1;
  return Math.max(1, row.salvoCount);
}

export function resolveMissileSalvoIntervalMs(
  weaponId: string,
  fallbackMs: number,
): number {
  const row = getCapitalWeaponRow(weaponId);
  if (!row) return fallbackMs;
  /** 로켓 family만 발칸식 고속 연사 허용 — 하한을 정책 CSV로 분리(기타는 기존 140ms 유지) */
  const floorMs =
    row.familyKind === 'rocket' ? getRocketBurstPolicy().salvoIntervalFloorMs : 140;
  return Math.max(floorMs, row.salvoIntervalMs > 0 ? row.salvoIntervalMs : fallbackMs);
}

/** 로켓탄 착탄 분산 반경(px) — 단일 점이 아닌 원형 스프레드 (전함 정면폭 기준) */
export const ROCKET_IMPACT_SPREAD_RADIUS_PX = 10;

export function resolveRocketImpactSpreadRadiusPx(weaponId: string): number {
  const row = getCapitalWeaponRow(weaponId);
  if (!row) return ROCKET_IMPACT_SPREAD_RADIUS_PX;
  const p = getRocketBurstPolicy();
  return Math.max(
    p.dispersionRadiusMinPx,
    Math.min(p.dispersionRadiusMaxPx, Math.round(row.rangePx * p.dispersionRadiusMulOfRange)),
  );
}

/** 유효(명중) 반경 — 분산 반경보다 작게 잡아 탄착분포에서 1~2발이 자연 미스·통과 */
export function resolveRocketImpactHitRadiusPx(weaponId: string): number {
  const p = getRocketBurstPolicy();
  return Math.max(6, Math.round(resolveRocketImpactSpreadRadiusPx(weaponId) * p.hitRadiusMulOfDispersion));
}

/** 무기 테이블 기준 초당 피해량(평균) */
export function computeCapitalWeaponDps(weaponId: string): number | null {
  const row = getCapitalWeaponRow(weaponId);
  if (!row) return null;
  const reloadSec = Math.max(0.45, row.cooldownMs / 1000);
  const salvo = Math.max(1, row.salvoCount);
  return (row.damage * salvo) / reloadSec;
}
