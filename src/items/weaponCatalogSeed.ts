// ============================================================
// 무기·아이템 카탈로그 시드 (200+ 엔트리 규모 대비)
// - 실제 게임 밸런스는 추후 데이터 파이프라인·청크 파일로 분할 가능
// ============================================================

import type { AnyCatalogEntry, WeaponSystemCatalogEntry } from './catalogTypes';

const T = {
  common: 'common',
  uncommon: 'uncommon',
  rare: 'rare',
} as const;

function baseMeta(
  id: string,
  displayName: string,
  description: string,
  overrides: Partial<Pick<WeaponSystemCatalogEntry, 'rarity' | 'baseValueCredits' | 'tags' | 'techTier'>> = {},
): Pick<
  WeaponSystemCatalogEntry,
  | 'id'
  | 'displayName'
  | 'description'
  | 'rarity'
  | 'baseValueCredits'
  | 'massUnits'
  | 'stackPolicy'
  | 'maxStack'
  | 'tags'
  | 'techTier'
> {
  return {
    id,
    displayName,
    description,
    rarity: overrides.rarity ?? T.common,
    baseValueCredits: overrides.baseValueCredits ?? 0,
    massUnits: 1,
    stackPolicy: 'none',
    maxStack: 1,
    tags: overrides.tags ?? ['catalog', 'weapon_system'],
    techTier: overrides.techTier ?? 1,
  };
}

/** 함선 템플릿·기존 id 와 동일하게 유지 (마이그레이션 최소화) */
export const CANONICAL_WEAPON_ENTRIES: WeaponSystemCatalogEntry[] = [
  {
    kind: 'weapon_system',
    ...baseMeta(
      'pulse_laser_i',
      '펄스 레이저 I',
      '초보 파일럿용 표준 에너지 병기. 안정적인 열 분포.',
      { baseValueCredits: 1200, tags: ['eden', 'energy', 'starter'] },
    ),
    mount: 'primary',
    combat: {
      damageDice: { count: 1, sides: 8, bonus: 2 },
      attackBonus: 3,
      range: 500,
      family: 'laser',
    },
    realtime: { visualKind: 'laser', nominalFireIntervalMs: 300, salvoCount: 1 },
  },
  {
    kind: 'weapon_system',
    ...baseMeta(
      'light_cannon',
      '경량 캐논',
      '탄자 속도를 살린 실탄 계열. 정찰함 주무장으로 흔하다.',
      { baseValueCredits: 900, tags: ['kinetic', 'scout'] },
    ),
    mount: 'primary',
    combat: {
      damageDice: { count: 1, sides: 6, bonus: 1 },
      attackBonus: 5,
      range: 400,
      family: 'cannon',
    },
    realtime: { visualKind: 'missile', nominalFireIntervalMs: 450, salvoCount: 1 },
  },
  {
    kind: 'weapon_system',
    ...baseMeta(
      'defense_turret',
      '방어 터렛',
      '화물선 거점 방어용. 화력보다 지속 사격과 내구에 치중.',
      { baseValueCredits: 600, tags: ['turret', 'civilian'] },
    ),
    mount: 'turret',
    combat: {
      damageDice: { count: 1, sides: 6, bonus: 0 },
      attackBonus: 1,
      range: 300,
      family: 'laser',
    },
    realtime: { visualKind: 'laser', nominalFireIntervalMs: 250, salvoCount: 1 },
  },
];

/** 대량 무기 체계 슬롯 예약(프로토·로드 테스트용). 실제 릴리스 전 스펙 교체 또는 제거. */
function stubWeaponSystem(idx: number): WeaponSystemCatalogEntry {
  const id = `wpn_catalog_stub_${idx.toString().padStart(3, '0')}`;
  const tier = ((idx % 5) + 1) as 1 | 2 | 3 | 4 | 5;
  const families = ['laser', 'missile', 'cannon', 'emp', 'plasma'] as const;
  const family = families[idx % families.length];
  return {
    kind: 'weapon_system',
    ...baseMeta(
      id,
      `카탈로그 스텁 ${idx}`,
      '데이터베이스·레지스트리 스트레스 및 UI 페이지네이션용 플레이스홀더.',
      {
        rarity: idx % 11 === 0 ? T.rare : idx % 4 === 0 ? T.uncommon : T.common,
        baseValueCredits: 500 + (idx % 50) * 20,
        tags: ['stub', `tier_${tier}`, family],
        techTier: tier,
      },
    ),
    mount: idx % 3 === 0 ? 'turret' : 'primary',
    combat: {
      damageDice: { count: 1 + (idx % 2), sides: 6 + (idx % 4), bonus: idx % 5 },
      attackBonus: 1 + (idx % 6),
      range: 280 + (idx % 120) * 5,
      family,
    },
    realtime: {
      visualKind:
        family === 'missile'
          ? 'missile'
          : family === 'emp'
            ? 'emp_burst'
            : 'laser',
      nominalFireIntervalMs: 280 + (idx % 8) * 40,
      salvoCount: 1 + (idx % 3),
    },
  };
}

/** 스텁 개수: 총 엔트리 200+ 유지 (무기만, 모듈은 별도) */
const STUB_WEAPON_COUNT = 197;

const STUB_WEAPON_ENTRIES: WeaponSystemCatalogEntry[] = Array.from({ length: STUB_WEAPON_COUNT }, (_, i) =>
  stubWeaponSystem(i),
);

/** 향후 장착형 모듈(비무기) 예시 — 인벤토리·슬롯 파이프라인 연동용 */
export const SAMPLE_MODULE_ENTRIES: AnyCatalogEntry[] = [
  {
    kind: 'ship_module',
    id: 'mod_shield_capacitor_i',
    displayName: '실드 커패시터 I',
    description: '실드 회복률 소폭 상승.',
    rarity: T.common,
    baseValueCredits: 800,
    massUnits: 2,
    stackPolicy: 'none',
    maxStack: 1,
    tags: ['module', 'shield'],
    techTier: 1,
    combat: {
      moduleKind: 'shield_booster',
      flatEffects: { shieldRegen: 0.05 },
    },
  },
  {
    kind: 'ship_module',
    id: 'mod_scanner_array_ii',
    displayName: '스캐너 어레이 II',
    description: '성계 지도 해상도 향상(향후 스킬과 연동).',
    rarity: T.uncommon,
    baseValueCredits: 2400,
    massUnits: 1,
    stackPolicy: 'none',
    maxStack: 1,
    tags: ['module', 'scanner'],
    techTier: 2,
    combat: {
      moduleKind: 'scanner',
      flatEffects: { scanRange: 1 },
    },
  },
];

export const WEAPON_CATALOG_SEED_ENTRIES: AnyCatalogEntry[] = [
  ...CANONICAL_WEAPON_ENTRIES,
  ...STUB_WEAPON_ENTRIES,
  ...SAMPLE_MODULE_ENTRIES,
];

export const WEAPON_CATALOG_WEAPON_COUNT =
  CANONICAL_WEAPON_ENTRIES.length + STUB_WEAPON_ENTRIES.length;

if (typeof __DEV__ !== 'undefined' && __DEV__) {
  const seen = new Set<string>();
  for (const e of WEAPON_CATALOG_SEED_ENTRIES) {
    if (seen.has(e.id)) throw new Error(`[weaponCatalogSeed] duplicate catalog id: ${e.id}`);
    seen.add(e.id);
  }
}
