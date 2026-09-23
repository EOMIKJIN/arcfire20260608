import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getItemDef } from '../data/itemRegistry';
import { NPC_CAPITAL_SHIPS_FROM_CSV } from '../data/generated';
import { resolveTradeMineralSinkRequirement } from '../arcCore/economy/tradeMineralSinkPolicy';
import { resolveTradePortWeaponIdsForZone } from '../arcCore/balance/weaponTradeListingPolicy';
import { resolveCombatWeaponSlotForWeaponId } from '../game/combatWeaponSlots';
import { isWeaponItemId } from '../game/weaponItemId';
import {
  WAVE_TEST_TRADE_PRICE_CREDITS,
  isWaveTestTradeItemDef,
  isWaveTestTradeShipId,
  isWaveTestTradeWeaponId,
} from './waveDefenseTestTradeItems';

const WAVE_LASER_ITEM = 'weapon_item_w_laser_wave';
const WAVE_MISSILE_ITEM = 'weapon_item_w_missile_wave';
const WAVE_SHIP_ITEM = 'capital_ship_player_wave_ship';

test('웨이브 테스트 3종 — itemDef·가격 화이트리스트', () => {
  assert.equal(isWaveTestTradeWeaponId('w_laser_wave'), true);
  assert.equal(isWaveTestTradeWeaponId('w_missile_wave'), true);
  assert.equal(isWaveTestTradeShipId('player_wave_ship'), true);
  assert.equal(isWaveTestTradeItemDef(getItemDef(WAVE_LASER_ITEM)), true);
  assert.equal(isWaveTestTradeItemDef(getItemDef(WAVE_MISSILE_ITEM)), true);
  assert.equal(isWaveTestTradeItemDef(getItemDef(WAVE_SHIP_ITEM)), true);
  assert.equal(WAVE_TEST_TRADE_PRICE_CREDITS, 1);
});

test('무역소 구매 광물 싱크 — CSV 비움 · 웨이브·운영 전부 null', () => {
  assert.equal(resolveTradeMineralSinkRequirement(getItemDef(WAVE_LASER_ITEM)), null);
  assert.equal(resolveTradeMineralSinkRequirement(getItemDef(WAVE_MISSILE_ITEM)), null);
  assert.equal(resolveTradeMineralSinkRequirement(getItemDef(WAVE_SHIP_ITEM)), null);
  assert.equal(resolveTradeMineralSinkRequirement(getItemDef('weapon_item_w_laser_arc_001')), null);
  assert.equal(resolveTradeMineralSinkRequirement(getItemDef('capital_ship_Player_scout_ship')), null);
  assert.equal(resolveTradeMineralSinkRequirement(getItemDef('ore_ferrite')), null);
});

test('웨이브 무기 — zone 진열 pinned · 장착 슬롯 레이저1/미사일2', () => {
  const zone1 = resolveTradePortWeaponIdsForZone(1);
  const zone3 = resolveTradePortWeaponIdsForZone(3);
  assert.ok(zone1.includes('w_laser_wave'));
  assert.ok(zone1.includes('w_missile_wave'));
  assert.ok(zone3.includes('w_laser_wave'));
  assert.ok(zone3.includes('w_missile_wave'));
  assert.equal(isWeaponItemId(WAVE_LASER_ITEM), true);
  assert.equal(isWeaponItemId(WAVE_MISSILE_ITEM), true);
  assert.equal(resolveCombatWeaponSlotForWeaponId('w_laser_wave'), 'WEAPON_1');
  assert.equal(resolveCombatWeaponSlotForWeaponId('w_missile_wave'), 'WEAPON_2');
});

test('웨이브 전함 — CSV 등록·무역소 상장 · 테스트 헐 식별', () => {
  const row = NPC_CAPITAL_SHIPS_FROM_CSV.find((s) => s.id === 'player_wave_ship');
  assert.ok(row);
  assert.equal(row.tradePortListed, true);
  assert.equal(getItemDef(WAVE_SHIP_ITEM)?.type, 'capital_ship');
  assert.equal(isWaveTestTradeShipId('player_wave_ship'), true);
  assert.equal(isWaveTestTradeShipId('Player_scout_ship'), false);
});
