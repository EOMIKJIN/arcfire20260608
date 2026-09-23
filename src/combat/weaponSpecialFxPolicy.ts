// ============================================================
// weapon_special_fx_policy.csv — 특수무기 색·아이콘·상태 오버레이
// weapon_list 대미지·사거리·재장전은 읽지 않는다.
// 일반무기는 행 없음 → null (패밀리 기본 연출 유지).
// ============================================================

import { WeaponSpecialFxPolicy_FROM_BALANCE_CSV } from '../data/balance/generated';

export type WeaponSpecialIconKind =
  | 'none'
  | 'pierce'
  | 'ghost'
  | 'void'
  | 'emp'
  | 'shield_break'
  | 'shard'
  | 'intercept'
  | 'star'
  | 'cut'
  | 'overload'
  | 'time'
  | 'soul'
  | 'hijack_visual';

export type WeaponSpecialFxPolicy = {
  weaponId: string;
  profileId: string;
  tintHex: string;
  glowHex: string;
  iconEmoji: string;
  iconKind: WeaponSpecialIconKind;
  ignoreShield: boolean;
  ignoreArmor: boolean;
  aoeRadiusPx: number;
  slowMul: number;
  slowMs: number;
  empMs: number;
  markMs: number;
  interceptNearby: boolean;
  stripShield: boolean;
  /** 착탄 반경 아군 선체 회복 % (0=없음). 틱 할당 없음 */
  allyHealPct: number;
};

const ICON_KINDS = new Set<string>([
  'pierce',
  'ghost',
  'void',
  'emp',
  'shield_break',
  'shard',
  'intercept',
  'star',
  'cut',
  'overload',
  'time',
  'soul',
  'hijack_visual',
]);

type CsvRow = (typeof WeaponSpecialFxPolicy_FROM_BALANCE_CSV)[number];

const cache = new Map<string, WeaponSpecialFxPolicy | null>();

function num(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === '') return fallback;
  const v = Number(raw);
  return Number.isFinite(v) ? v : fallback;
}

function flag(raw: string | undefined): boolean {
  const t = String(raw ?? '').trim();
  return t === '1' || t === 'true' || t === 'TRUE';
}

function normalizeHex(raw: string | undefined): string {
  const t = String(raw ?? '').trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(t)) return t;
  if (/^#[0-9A-Fa-f]{3}$/.test(t)) {
    return `#${t[1]}${t[1]}${t[2]}${t[2]}${t[3]}${t[3]}`;
  }
  return '';
}

function parseIconKind(raw: string | undefined): WeaponSpecialIconKind {
  const t = String(raw ?? '').trim();
  if (ICON_KINDS.has(t)) return t as WeaponSpecialIconKind;
  return 'none';
}

function parseRow(row: CsvRow): WeaponSpecialFxPolicy {
  const tintHex = normalizeHex(row.tintHex);
  const glowHex = normalizeHex(row.glowHex) || tintHex;
  return {
    weaponId: String(row.weaponId ?? '').trim(),
    profileId: String(row.profileId ?? '').trim() || 'default',
    tintHex,
    glowHex,
    iconEmoji: String(row.iconEmoji ?? '').trim(),
    iconKind: parseIconKind(row.iconKind),
    ignoreShield: flag(row.ignoreShield),
    ignoreArmor: flag(row.ignoreArmor),
    aoeRadiusPx: Math.max(0, num(row.aoeRadiusPx, 0)),
    slowMul: Math.max(0, num(row.slowMul, 0)),
    slowMs: Math.max(0, num(row.slowMs, 0)),
    empMs: Math.max(0, num(row.empMs, 0)),
    markMs: Math.max(0, num(row.markMs, 0)),
    interceptNearby: flag(row.interceptNearby),
    stripShield: flag(row.stripShield),
    allyHealPct: Math.max(0, Math.min(100, num(row.allyHealPct, 0))),
  };
}

function findCsvRow(weaponId: string): CsvRow | undefined {
  const rows = WeaponSpecialFxPolicy_FROM_BALANCE_CSV as readonly CsvRow[];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]!;
    if (String(r.weaponId ?? '').trim() === weaponId) return r;
  }
  return undefined;
}

/** O(1) — 모듈 캐시. 틱에서 신규 객체 생성 없음. */
export function getWeaponSpecialFxPolicy(weaponId: string): WeaponSpecialFxPolicy | null {
  const id = weaponId.trim();
  if (!id) return null;
  if (cache.has(id)) return cache.get(id) ?? null;
  const row = findCsvRow(id);
  const parsed = row ? parseRow(row) : null;
  cache.set(id, parsed);
  return parsed;
}

export function formatWeaponSpecialDisplayName(weaponId: string, baseName: string): string {
  const policy = getWeaponSpecialFxPolicy(weaponId);
  if (!policy?.iconEmoji) return baseName;
  return `${policy.iconEmoji} ${baseName}`;
}
