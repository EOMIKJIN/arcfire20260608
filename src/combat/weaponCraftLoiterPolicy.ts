// ============================================================
// weapon_craft_loiter_policy.csv — 드론·함재기 선회 파라미터
// 기존 weapon_list 대미지·사거리·재장전은 읽지 않는다.
// family 기본행 + weaponId 개별행. 빈 칸은 기본행 상속.
// ============================================================

import { WeaponCraftLoiterPolicy_FROM_BALANCE_CSV } from '../data/balance/generated';

export type WeaponCraftFamilyKind = 'drone' | 'carrier';

export type WeaponCraftLoiterPolicy = {
  familyKind: WeaponCraftFamilyKind;
  weaponId: string;
  profileId: string;
  approachSpeedMul: number;
  orbitRadiusPx: number;
  orbitEnterPx: number;
  orbitLaps: number;
  orbitMsMax: number;
  strikeHitPx: number;
  standoffPx: number;
  figure8RadiusPx: number;
  figure8PeriodMs: number;
  engageMs: number;
  attackPeriodMs: number;
  craftHp: number;
  recoverPx: number;
  maxAlivePerOwner: number;
  poolHardCap: number;
  craftCount: number;
  orbitAttack: boolean;
  ignoreShield: boolean;
  aoeRadiusPx: number;
  pierceAfterStrike: boolean;
  ramThenRtb: boolean;
  interceptMissiles: boolean;
  pierceMs: number;
  slowMul: number;
  slowMs: number;
};

const FALLBACK_DRONE: WeaponCraftLoiterPolicy = {
  familyKind: 'drone',
  weaponId: '',
  profileId: 'default',
  approachSpeedMul: 1,
  orbitRadiusPx: 28,
  orbitEnterPx: 32,
  orbitLaps: 1,
  orbitMsMax: 1800,
  strikeHitPx: 10,
  standoffPx: 0,
  figure8RadiusPx: 0,
  figure8PeriodMs: 0,
  engageMs: 0,
  attackPeriodMs: 0,
  craftHp: 1,
  recoverPx: 0,
  maxAlivePerOwner: 2,
  poolHardCap: 8,
  craftCount: 1,
  orbitAttack: false,
  ignoreShield: false,
  aoeRadiusPx: 0,
  pierceAfterStrike: false,
  ramThenRtb: false,
  interceptMissiles: false,
  pierceMs: 0,
  slowMul: 0,
  slowMs: 0,
};

const FALLBACK_CARRIER: WeaponCraftLoiterPolicy = {
  familyKind: 'carrier',
  weaponId: '',
  profileId: 'default',
  approachSpeedMul: 1,
  orbitRadiusPx: 0,
  orbitEnterPx: 0,
  orbitLaps: 0,
  orbitMsMax: 0,
  strikeHitPx: 0,
  standoffPx: 52,
  figure8RadiusPx: 22,
  figure8PeriodMs: 1600,
  engageMs: 2800,
  attackPeriodMs: 450,
  craftHp: 8,
  recoverPx: 16,
  maxAlivePerOwner: 2,
  poolHardCap: 8,
  craftCount: 1,
  orbitAttack: false,
  ignoreShield: false,
  aoeRadiusPx: 0,
  pierceAfterStrike: false,
  ramThenRtb: false,
  interceptMissiles: false,
  pierceMs: 0,
  slowMul: 0,
  slowMs: 0,
};

type CsvRow = (typeof WeaponCraftLoiterPolicy_FROM_BALANCE_CSV)[number] & {
  weaponId?: string;
  profileId?: string;
  craftCount?: string;
  orbitAttack?: string;
  ignoreShield?: string;
  aoeRadiusPx?: string;
  pierceAfterStrike?: string;
  ramThenRtb?: string;
  interceptMissiles?: string;
  pierceMs?: string;
  slowMul?: string;
  slowMs?: string;
};

const cache = new Map<string, WeaponCraftLoiterPolicy>();

function num(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === '') return fallback;
  const v = Number(raw);
  return Number.isFinite(v) ? v : fallback;
}

function flag(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined || raw === '') return fallback;
  const t = raw.trim();
  if (t === '1' || t === 'true' || t === 'TRUE') return true;
  if (t === '0' || t === 'false' || t === 'FALSE') return false;
  return fallback;
}

function overlayRow(base: WeaponCraftLoiterPolicy, row: CsvRow | undefined): WeaponCraftLoiterPolicy {
  if (!row) return base;
  const mul = num(row.approachSpeedMul, base.approachSpeedMul);
  return {
    familyKind: base.familyKind,
    weaponId: String(row.weaponId ?? base.weaponId).trim(),
    profileId: String(row.profileId ?? base.profileId).trim() || base.profileId,
    approachSpeedMul: mul > 0 ? mul : base.approachSpeedMul,
    orbitRadiusPx: Math.max(0, num(row.orbitRadiusPx, base.orbitRadiusPx)),
    orbitEnterPx: Math.max(0, num(row.orbitEnterPx, base.orbitEnterPx)),
    orbitLaps: Math.max(0, num(row.orbitLaps, base.orbitLaps)),
    orbitMsMax: Math.max(0, num(row.orbitMsMax, base.orbitMsMax)),
    strikeHitPx: Math.max(0, num(row.strikeHitPx, base.strikeHitPx)),
    standoffPx: Math.max(0, num(row.standoffPx, base.standoffPx)),
    figure8RadiusPx: Math.max(0, num(row.figure8RadiusPx, base.figure8RadiusPx)),
    figure8PeriodMs: Math.max(0, num(row.figure8PeriodMs, base.figure8PeriodMs)),
    engageMs: Math.max(0, num(row.engageMs, base.engageMs)),
    attackPeriodMs: Math.max(0, num(row.attackPeriodMs, base.attackPeriodMs)),
    craftHp: Math.max(1, Math.round(num(row.craftHp, base.craftHp))),
    recoverPx: Math.max(0, num(row.recoverPx, base.recoverPx)),
    maxAlivePerOwner: Math.max(1, Math.round(num(row.maxAlivePerOwner, base.maxAlivePerOwner))),
    poolHardCap: Math.max(1, Math.round(num(row.poolHardCap, base.poolHardCap))),
    craftCount: Math.max(1, Math.round(num(row.craftCount, base.craftCount))),
    orbitAttack: flag(row.orbitAttack, base.orbitAttack),
    ignoreShield: flag(row.ignoreShield, base.ignoreShield),
    aoeRadiusPx: Math.max(0, num(row.aoeRadiusPx, base.aoeRadiusPx)),
    pierceAfterStrike: flag(row.pierceAfterStrike, base.pierceAfterStrike),
    ramThenRtb: flag(row.ramThenRtb, base.ramThenRtb),
    interceptMissiles: flag(row.interceptMissiles, base.interceptMissiles),
    pierceMs: Math.max(0, num(row.pierceMs, base.pierceMs)),
    slowMul: Math.max(0, num(row.slowMul, base.slowMul)),
    slowMs: Math.max(0, num(row.slowMs, base.slowMs)),
  };
}

function findCsvRow(family: WeaponCraftFamilyKind, weaponId: string): CsvRow | undefined {
  const rows = WeaponCraftLoiterPolicy_FROM_BALANCE_CSV as readonly CsvRow[];
  if (weaponId) {
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]!;
      if (r.familyKind.trim() === family && String(r.weaponId ?? '').trim() === weaponId) {
        return r;
      }
    }
  }
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]!;
    if (r.familyKind.trim() === family && !String(r.weaponId ?? '').trim()) {
      return r;
    }
  }
  return undefined;
}

export function getWeaponCraftLoiterPolicy(
  family: WeaponCraftFamilyKind,
  weaponId: string = '',
): WeaponCraftLoiterPolicy {
  const id = weaponId.trim();
  const key = `${family}:${id}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const fallback = family === 'drone' ? FALLBACK_DRONE : FALLBACK_CARRIER;
  const familyRow = findCsvRow(family, '');
  const withFamily = overlayRow(fallback, familyRow);
  const weaponRow = id ? findCsvRow(family, id) : undefined;
  const parsed = overlayRow(withFamily, weaponRow);
  parsed.weaponId = id;
  cache.set(key, parsed);
  return parsed;
}
