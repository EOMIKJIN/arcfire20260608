/**
 * npx tsx src/combat/weaponSpecialFxPolicy.test.ts
 */
import assert from 'node:assert/strict';
import {
  formatWeaponSpecialDisplayName,
  getWeaponSpecialFxPolicy,
} from './weaponSpecialFxPolicy';
import {
  resolveCapitalLaserBeamPresentation,
  resolveCapitalProjectilePresentation,
  ROCKET_TEST_PRESENTATION,
} from './capitalWeaponPresentation';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

test('generic weapon has no special fx row', () => {
  assert.equal(getWeaponSpecialFxPolicy('w_laser_light_01'), null);
  assert.equal(getWeaponSpecialFxPolicy(''), null);
});

test('ghost laser ignore shield/armor + purple tint', () => {
  const p = getWeaponSpecialFxPolicy('w_laser_arc_010');
  assert.ok(p);
  assert.equal(p.ignoreShield, true);
  assert.equal(p.ignoreArmor, true);
  assert.equal(p.tintHex, '#A78BFA');
  assert.equal(p.iconEmoji, '👻');
  assert.equal(p.iconKind, 'ghost');
  const laser = resolveCapitalLaserBeamPresentation('w_laser_arc_010');
  assert.equal(laser.coreColor, '#A78BFA');
  assert.equal(laser.glowColor, '#E9D5FF');
});

test('infinity laser ignore shield/armor', () => {
  const p = getWeaponSpecialFxPolicy('w_laser_arc_064');
  assert.ok(p);
  assert.equal(p.ignoreShield, true);
  assert.equal(p.ignoreArmor, true);
});

test('EMP missile aoe + slow flags', () => {
  const p = getWeaponSpecialFxPolicy('w_missile_arc_054');
  assert.ok(p);
  assert.equal(p.iconKind, 'emp');
  assert.ok(p.aoeRadiusPx >= 40);
  assert.ok(p.slowMul > 0 && p.slowMul < 1);
  assert.ok(p.slowMs >= 3000);
  const vis = resolveCapitalProjectilePresentation('w_missile_arc_054');
  assert.equal(vis.headColor.startsWith('rgba('), true);
  assert.equal(vis.trailEnabled, true);
});

test('energy bow ignoreShield', () => {
  const p = getWeaponSpecialFxPolicy('w_missile_arc_032');
  assert.ok(p);
  assert.equal(p.ignoreShield, true);
  assert.equal(p.ignoreArmor, false);
});

test('intercept nearby flag', () => {
  const p = getWeaponSpecialFxPolicy('w_intercept_missile_01');
  assert.ok(p);
  assert.equal(p.interceptNearby, true);
  assert.equal(p.iconKind, 'intercept');
});

test('thundering strips nearby shields', () => {
  const p = getWeaponSpecialFxPolicy('w_missile_arc_052');
  assert.ok(p);
  assert.equal(p.stripShield, true);
  assert.ok(p.aoeRadiusPx > 0);
});

test('generic rocket stays white no-trail', () => {
  const vis = resolveCapitalProjectilePresentation('w_missile_arc_005');
  assert.equal(vis, ROCKET_TEST_PRESENTATION);
  assert.equal(vis.trailEnabled, false);
});

test('special rocket tint beats white but keeps no-trail', () => {
  const vis = resolveCapitalProjectilePresentation('w_laser_arc_055');
  assert.notEqual(vis, ROCKET_TEST_PRESENTATION);
  assert.equal(vis.trailEnabled, false);
  assert.equal(vis.headColor.startsWith('rgba('), true);
});

test('display name prefixes emoji only for specials', () => {
  assert.equal(formatWeaponSpecialDisplayName('w_laser_light_01', '라이트 레이저'), '라이트 레이저');
  assert.equal(
    formatWeaponSpecialDisplayName('w_laser_arc_010', '고스트 위상 레이저'),
    '👻 고스트 위상 레이저',
  );
});

test('presentation cache returns same object', () => {
  const a = resolveCapitalLaserBeamPresentation('w_laser_arc_046');
  const b = resolveCapitalLaserBeamPresentation('w_laser_arc_046');
  assert.equal(a, b);
  const c = resolveCapitalProjectilePresentation('w_missile_arc_009');
  const d = resolveCapitalProjectilePresentation('w_missile_arc_009');
  assert.equal(c, d);
});

test('hijack visual uses shield strip not control steal', () => {
  const p = getWeaponSpecialFxPolicy('w_laser_arc_056');
  assert.ok(p);
  assert.equal(p.stripShield, true);
  assert.equal(p.iconKind, 'hijack_visual');
});

test('kass absorb is 039 slow not 048', () => {
  const kass = getWeaponSpecialFxPolicy('w_laser_arc_039');
  assert.ok(kass);
  assert.ok(kass.slowMul > 0 && kass.slowMul < 1);
  const slay = getWeaponSpecialFxPolicy('w_laser_arc_048');
  assert.ok(slay);
  assert.ok(slay.aoeRadiusPx > 0);
  assert.equal(slay.slowMul, 0);
});

test('range-flavor missiles get tint only', () => {
  const cruise = getWeaponSpecialFxPolicy('w_missile_arc_022');
  assert.ok(cruise);
  assert.equal(cruise.aoeRadiusPx, 0);
  assert.equal(cruise.ignoreShield, false);
  assert.ok(cruise.tintHex.length > 0);
});

test('omni and echo use wide aoe approximation', () => {
  assert.ok((getWeaponSpecialFxPolicy('w_missile_arc_060')?.aoeRadiusPx ?? 0) >= 60);
  assert.ok((getWeaponSpecialFxPolicy('w_missile_arc_061')?.aoeRadiusPx ?? 0) >= 56);
});

test('genesis mothership aoe + ally heal flag', () => {
  const p = getWeaponSpecialFxPolicy('w_missile_arc_063');
  assert.ok(p);
  assert.ok(p.aoeRadiusPx >= 52);
  assert.ok(p.allyHealPct > 0);
});

test('adamantine is armor ignore not shield ignore', () => {
  const p = getWeaponSpecialFxPolicy('w_missile_arc_036');
  assert.ok(p);
  assert.equal(p.ignoreArmor, true);
  assert.equal(p.ignoreShield, false);
});

console.log('weaponSpecialFxPolicy tests done');
