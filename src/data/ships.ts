// ============================================================
// 플레이어 함선 템플릿 — npc_ai_ships(Player_*) + weapon_list 정본
// 레거시 templateId(starter_fighter 등)는 저장 호환용 별칭으로 유지.
// ============================================================

import { SHIP_TEMPLATES_FROM_CSV } from './generated/csvShipTemplates';
import {
  CAPITAL_WEAPON_LIST_FROM_CSV,
  type CapitalWeaponCsvRow,
} from './generated/csvWeapons';
import type { ShipTemplate, WeaponData } from '../types';

/** 저장/온보딩에 쓰는 레거시 templateId → CSV Player_ 전함 id */
const LEGACY_TEMPLATE_TO_NPC_SHIP: Record<string, string> = {
  starter_fighter: 'Player_npc_red_fleet_1',
  scout_ship: 'Player_scout_ship',
  // 주의: Player_freighter CSV는 생존포드 — 레거시 freighter(화물선)와 의미 불일치.
  // freighter 키는 아래 FROZEN_LEGACY_FREIGHTER로만 유지한다.
};

const STARTER_SPRITE: number[][] = [
  [0, 0, 0, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 0],
  [2, 1, 1, 1, 1, 1, 2],
  [0, 1, 3, 1, 3, 1, 0],
  [0, 0, 1, 0, 1, 0, 0],
];

function getWeaponRow(weaponId: string): CapitalWeaponCsvRow | null {
  const id = weaponId.trim();
  if (!id) return null;
  return CAPITAL_WEAPON_LIST_FROM_CSV[id] ?? null;
}

function weaponDataFromWeaponListId(weaponId: string, fallback: WeaponData): WeaponData {
  const row = getWeaponRow(weaponId);
  if (!row) return fallback;
  const diceSides = Math.max(4, Math.min(12, Math.round(row.damage)));
  return {
    id: row.id,
    name: row.name,
    type: row.kind === 'missile' ? 'missile' : 'laser',
    attackBonus: Math.max(0, Math.floor(row.damage)),
    range: Math.max(1, Math.floor(row.rangePx)),
    damageDice: {
      count: 1,
      sides: diceSides,
      bonus: Math.max(0, Math.floor(row.damage / 4)),
    },
  };
}

function cloneTemplateFromNpcShip(
  legacyId: string,
  npcShipId: string,
): ShipTemplate | null {
  const csv = SHIP_TEMPLATES_FROM_CSV[npcShipId];
  if (!csv) return null;
  const baseWeapon = weaponDataFromWeaponListId(csv.baseWeapon.id, csv.baseWeapon);
  return {
    ...csv,
    id: legacyId,
    portraitNpcCapitalShipId: npcShipId,
    baseWeapon,
    pixelSprite: csv.pixelSprite,
  };
}

/**
 * 레거시 `freighter` templateId 전용 동결 스냅샷.
 * CSV `Player_freighter`는 생존포드이므로 별칭 금지(계정 저장 호환·의미 분리).
 */
function buildFrozenLegacyFreighter(): ShipTemplate {
  const baseWeapon = weaponDataFromWeaponListId('w_laser_light_01', {
    id: 'w_laser_light_01',
    name: '경량 레이저',
    type: 'laser',
    attackBonus: 2,
    range: 151,
    damageDice: { count: 1, sides: 4, bonus: 1 },
  });
  return {
    id: 'freighter',
    portraitNpcCapitalShipId: 'Player_npc_red_fleet_1',
    name: '코스모스 화물선',
    description: '무역에 특화된 대형 화물선. 전투력은 낮지만 화물칸이 넓다.',
    maxHp: 150,
    maxShield: 30,
    armor: 10,
    speed: 3,
    cargoCapacity: 80,
    weaponSlots: 1,
    equipSlots: 3,
    baseWeapon,
    pixelSprite: STARTER_SPRITE,
  };
}

function buildShipTemplates(): Record<string, ShipTemplate> {
  const out: Record<string, ShipTemplate> = {};

  for (const [legacyId, npcShipId] of Object.entries(LEGACY_TEMPLATE_TO_NPC_SHIP)) {
    const tmpl = cloneTemplateFromNpcShip(legacyId, npcShipId);
    if (tmpl) out[legacyId] = tmpl;
  }

  out.freighter = buildFrozenLegacyFreighter();

  // CSV Player_* 키도 직접 조회 가능하게 노출
  for (const [npcShipId, csv] of Object.entries(SHIP_TEMPLATES_FROM_CSV)) {
    if (out[npcShipId]) continue;
    out[npcShipId] = {
      ...csv,
      portraitNpcCapitalShipId: csv.portraitNpcCapitalShipId ?? npcShipId,
      baseWeapon: weaponDataFromWeaponListId(csv.baseWeapon.id, csv.baseWeapon),
    };
  }

  return out;
}

export const SHIP_TEMPLATES: Record<string, ShipTemplate> = buildShipTemplates();

export const STARTER_SHIP_ID = 'starter_fighter';

export function resolveNpcShipIdForTemplateId(templateId: string): string {
  const id = String(templateId ?? '').trim();
  if (id === 'freighter') return 'Player_npc_red_fleet_1';
  return LEGACY_TEMPLATE_TO_NPC_SHIP[id] ?? id;
}

export function createStarterShip() {
  const template = SHIP_TEMPLATES[STARTER_SHIP_ID];
  if (!template) {
    throw new Error('[ships] STARTER_SHIP_ID missing — rebuild content tables');
  }
  return {
    templateId: template.id,
    name: template.name,
    hp: template.maxHp,
    maxHp: template.maxHp,
    shield: template.maxShield,
    maxShield: template.maxShield,
    armor: template.armor,
    speed: template.speed,
    equipCapacity: Math.max(0, Math.floor(template.equipSlots ?? 0)),
    weapons: [template.baseWeapon],
    equipment: [],
  };
}
