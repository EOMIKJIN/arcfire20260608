import assert from 'node:assert/strict';
import { test } from 'node:test';
import { UNEQUIPPED_WEAPON_ITEM_ID } from './combatWeaponSlots';
import { resolvePlayerCombatWeaponChannels } from './resolvePlayerCombatWeaponChannels';

const FALLBACK = {
  laserWeaponId: 'w_laser_arc_001',
  missileWeaponId: 'w_missile_wave',
  closeRangeWeaponId: 'w_missile_arc_005',
  auxWeaponId: 'w_laser_wave',
};

const UNEQUIPPED = {
  WEAPON_1: { itemDefId: UNEQUIPPED_WEAPON_ITEM_ID, name: '' },
  WEAPON_2: { itemDefId: UNEQUIPPED_WEAPON_ITEM_ID, name: '' },
  WEAPON_3: { itemDefId: UNEQUIPPED_WEAPON_ITEM_ID, name: '' },
  WEAPON_4: { itemDefId: UNEQUIPPED_WEAPON_ITEM_ID, name: '' },
} as const;

test('4슬롯 전량 해제 — 4채널 전부 빈 문자열 (CSV·전역 폴백 없음)', () => {
  const ch = resolvePlayerCombatWeaponChannels(UNEQUIPPED, FALLBACK);
  assert.deepEqual(ch, {
    laserWeaponId: '',
    missileWeaponId: '',
    closeRangeWeaponId: '',
    auxWeaponId: '',
  });
});

test('슬롯 키 없음 — 빈 채널 (기종 기본무장으로 채우지 않음)', () => {
  const ch = resolvePlayerCombatWeaponChannels({}, FALLBACK);
  assert.equal(ch.laserWeaponId, '');
  assert.equal(ch.missileWeaponId, '');
  assert.equal(ch.closeRangeWeaponId, '');
  assert.equal(ch.auxWeaponId, '');
});

test('레이저만 장착 — 그 채널만 값, 나머지 빈 문자열', () => {
  const ch = resolvePlayerCombatWeaponChannels({
    ...UNEQUIPPED,
    WEAPON_1: { itemDefId: 'weapon_item_w_laser_wave', name: '레이저_웨이브' },
  }, FALLBACK);
  assert.equal(ch.laserWeaponId, 'w_laser_wave');
  assert.equal(ch.missileWeaponId, '');
  assert.equal(ch.closeRangeWeaponId, '');
  assert.equal(ch.auxWeaponId, '');
});

test('손상 슬롯 id — 해당 채널만 CSV 기본값으로 방어 복구', () => {
  const ch = resolvePlayerCombatWeaponChannels({
    ...UNEQUIPPED,
    WEAPON_1: { itemDefId: 'weapon_item_not_a_real_weapon', name: '손상' },
  }, FALLBACK);
  assert.equal(ch.laserWeaponId, 'w_laser_arc_001');
  assert.equal(ch.missileWeaponId, '');
  assert.equal(ch.closeRangeWeaponId, '');
  assert.equal(ch.auxWeaponId, '');
});
