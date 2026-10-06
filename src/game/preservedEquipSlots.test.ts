/**
 * 격침 후 장착 보관 · 내구도 0% 미소멸
 * npx tsx src/game/preservedEquipSlots.test.ts
 */
import assert from 'node:assert/strict';
import type { Player } from '../types';
import { applyNpcCapitalShipToPlayerShip } from './applyNpcCapitalShipPurchase';
import { applyPostCombatDurabilityPass } from './durability/durabilityModel';
import { SURVIVAL_POD_NPC_SHIP_ID } from './survivalPodIds';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

const weaponSlot = {
  itemDefId: 'weapon_item_w_laser_light_01',
  name: '경량 레이저',
};

test('생존포드에 맡긴 장착은 다음 전함에서 돌아온다', () => {
  const boarded = applyNpcCapitalShipToPlayerShip(
    {
      templateId: 'starter_fighter',
      name: '시작',
      hp: 1,
      maxHp: 1,
      shield: 0,
      maxShield: 0,
      armor: 0,
      speed: 1,
      equipCapacity: 4,
      weapons: [],
      equipment: [],
      portraitNpcCapitalShipId: 'Player_npc_red_fleet_1',
      equipSlots: { WEAPON_1: weaponSlot },
    },
    SURVIVAL_POD_NPC_SHIP_ID,
  );
  assert.equal(boarded.ok, true);
  if (!boarded.ok) return;
  assert.equal(boarded.ship.equipSlots?.WEAPON_1, undefined);
  assert.equal(
    boarded.ship.preservedEquipSlots?.WEAPON_1?.itemDefId,
    weaponSlot.itemDefId,
  );

  const next = applyNpcCapitalShipToPlayerShip(boarded.ship, 'Player_frigate_mk2');
  assert.equal(next.ok, true);
  if (!next.ok) return;
  assert.equal(next.ship.equipSlots?.WEAPON_1?.itemDefId, weaponSlot.itemDefId);
  assert.equal(next.ship.preservedEquipSlots, undefined);
});

test('내구도 0% 무기는 인벤토리와 장착에 남는다', () => {
  const player = {
    ship: {
      portraitNpcCapitalShipId: 'Player_npc_red_fleet_1',
      equipSlots: { WEAPON_1: weaponSlot },
      weapons: [],
    },
    inventorySlots: [
      {
        goodId: weaponSlot.itemDefId,
        quantity: 1,
        buyPrice: 1,
        durabilityPct: 0,
      },
    ],
    shipHangar: [],
  } as unknown as Player;
  const result = applyPostCombatDurabilityPass(player, 1);
  assert.equal(result.destroyedItemLabels.length, 0);
  assert.equal(result.player.inventorySlots[0]?.goodId, weaponSlot.itemDefId);
  assert.equal(result.player.inventorySlots[0]?.durabilityPct, 0);
  assert.equal(
    result.player.ship.equipSlots?.WEAPON_1?.itemDefId,
    weaponSlot.itemDefId,
  );
});

console.log('preservedEquipSlots.test.ts — all PASS');
