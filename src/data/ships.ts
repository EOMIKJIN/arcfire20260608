// ============================================================
// 아크파이어 온라인 - 함선 데이터
// ============================================================

import { weaponDataFromCatalogId } from '../items';
import { ShipTemplate } from '../types';

// 도트 스프라이트: 0=빈칸, 1=선체, 2=엔진, 3=무기
const STARTER_SPRITE = [
  [0,0,0,1,0,0,0],
  [0,0,1,1,1,0,0],
  [0,1,1,1,1,1,0],
  [2,1,1,1,1,1,2],
  [0,1,3,1,3,1,0],
  [0,0,1,0,1,0,0],
];

export const SHIP_TEMPLATES: Record<string, ShipTemplate> = {
  starter_fighter: {
    id: 'starter_fighter',
    portraitNpcCapitalShipId: 'Player_npc_red_fleet_1',
    name: '아크파이어 Mk.I',
    description: '낡았지만 믿음직한 기본형 전투함. 모든 파일럿의 첫 번째 함선.',
    maxHp: 100,
    maxShield: 50,
    armor: 12,              // AC 12 (D20 기본)
    speed: 5,
    cargoCapacity: 20,
    weaponSlots: 1,
    equipSlots: 2,
    baseWeapon: {
      id: 'pulse_laser_i',
      name: '펄스 레이저 I',
      damageDice: { count: 1, sides: 8, bonus: 2 },
      attackBonus: 3,
      range: 500,
      type: 'laser',
    },
    pixelSprite: STARTER_SPRITE,
  },

  scout_ship: {
    id: 'scout_ship',
    portraitNpcCapitalShipId: 'Player_npc_red_fleet_1',
    name: '스카우트 레이더',
    description: '빠르고 날렵한 정찰함. 회피율이 높다.',
    maxHp: 70,
    maxShield: 80,
    armor: 14,
    speed: 8,
    cargoCapacity: 10,
    weaponSlots: 1,
    equipSlots: 2,
    baseWeapon: weaponDataFromCatalogId('light_cannon'),
    pixelSprite: STARTER_SPRITE,
  },

  freighter: {
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
    baseWeapon: weaponDataFromCatalogId('defense_turret'),
    pixelSprite: STARTER_SPRITE,
  },
};

export const STARTER_SHIP_ID = 'starter_fighter';

export function createStarterShip() {
  const template = SHIP_TEMPLATES[STARTER_SHIP_ID];
  return {
    templateId: template.id,
    name: template.name,
    hp: template.maxHp,
    maxHp: template.maxHp,
    shield: template.maxShield,
    maxShield: template.maxShield,
    armor: template.armor,
    speed: template.speed,
    equipCapacity: template.cargoCapacity,
    weapons: [template.baseWeapon],
    equipment: [],
  };
}
