// ============================================================
// 아이템 / 무기 체계 — 카탈로그 타입 (200+ 엔트리 확장 전제)
// - 모든 정의는 불변(immutable) 데이터로 DB화
// - 런타임 인스턴스(내구·개조)는 별도 슬롯/인벤토리 모델에서 참조
// ============================================================

import type { BattleWeaponVisualKind } from '../combat/battleVisualTypes';
import type { DiceDef } from '../types';

/** 카탈로그 문자열 id (예: wpn_pulse_laser_i, mod_shield_i) */
export type CatalogItemId = string;

export type ItemRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

/** 인벤토리·상점·장착 슬롯 정책 (향후 확장) */
export type ItemStackPolicy = 'none' | 'stack_count' | 'unique_equip';

export type WeaponFamily =
  | 'laser'
  | 'missile'
  | 'cannon'
  | 'emp'
  | 'railgun'
  | 'torpedo'
  | 'plasma'
  | 'particle'
  | 'mine'
  | 'other';

/** 장착 슬롯(무기) — 함선 템플릿의 weaponSlots 와 매핑 */
export type WeaponMountKind = 'primary' | 'secondary' | 'turret' | 'point_defense' | 'spinal';

/** D20 턴제 전투용 수치 */
export interface WeaponCombatProfile {
  damageDice: DiceDef;
  attackBonus: number;
  /** 함선 무기 사거리(추상 단위) */
  range: number;
  family: WeaponFamily;
}

/** 실시간 전투·궤도 연출 힌트 (선택) */
export interface WeaponRealtimeProfile {
  visualKind: BattleWeaponVisualKind;
  /** 대략적 연사 간격(ms), UI·AI 힌트 */
  nominalFireIntervalMs?: number;
  /** 동시탄·샐보 등 메타 */
  salvoCount?: number;
}

/** 함선 외 장비·모듈(향후 장착형) — 최소 골격 */
export interface ShipModuleCombatProfile {
  /** shield_booster 등 types/index 의 EquipmentData.type 과 정렬 예정 */
  moduleKind: 'shield_booster' | 'engine' | 'scanner' | 'cargo_ext' | 'reactor' | 'unknown';
  flatEffects: Record<string, number>;
}

/** 모든 카탈로그 엔트리 공통 메타 (무기·모듈·소모품 공통) */
export interface ItemCatalogMeta {
  id: CatalogItemId;
  displayName: string;
  description: string;
  rarity: ItemRarity;
  /** 기본 매입/매도 기준가 (0이면 미설정) */
  baseValueCredits: number;
  /** 질량·볼륨 등은 추후 함선 제한과 연동 */
  massUnits: number;
  stackPolicy: ItemStackPolicy;
  maxStack: number;
  /** 제조사·진영·태그 — 필터·퀘스트 조건용 */
  tags: readonly string[];
  techTier: 1 | 2 | 3 | 4 | 5;
}

/** 무기 체계 1종 = 카탈로그 아이템 1건 */
export interface WeaponSystemCatalogEntry extends ItemCatalogMeta {
  kind: 'weapon_system';
  mount: WeaponMountKind;
  combat: WeaponCombatProfile;
  realtime: WeaponRealtimeProfile;
}

/** 장착형 모듈(비무기) */
export interface ShipModuleCatalogEntry extends ItemCatalogMeta {
  kind: 'ship_module';
  combat: ShipModuleCombatProfile;
}

/** 소모품·탄약류 골격 */
export interface ConsumableCatalogEntry extends ItemCatalogMeta {
  kind: 'consumable';
  /** 연동 무기 catalog id 또는 독립 효과 키 */
  linkedWeaponId?: CatalogItemId;
  effectKey?: string;
}

/** 재료·상거래 전용(무기가 아닌 일반 아이템) */
export interface TradeGoodCatalogEntry extends ItemCatalogMeta {
  kind: 'trade_good';
  tradeCategory: string;
}

/** DB에 올라갈 수 있는 모든 정의(판별 유니온) */
export type AnyCatalogEntry =
  | WeaponSystemCatalogEntry
  | ShipModuleCatalogEntry
  | ConsumableCatalogEntry
  | TradeGoodCatalogEntry;

export function isWeaponSystemEntry(e: AnyCatalogEntry): e is WeaponSystemCatalogEntry {
  return e.kind === 'weapon_system';
}

export function isShipModuleEntry(e: AnyCatalogEntry): e is ShipModuleCatalogEntry {
  return e.kind === 'ship_module';
}
