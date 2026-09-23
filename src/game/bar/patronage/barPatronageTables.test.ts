/**
 * 후원 피커 상한 · 정찰 단가 · 바당 1~2 · 1등급 고유 초상
 * npx tsx --test src/game/bar/patronage/barPatronageTables.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  BAR_ATTENDANT_HELLO_FROM_CSV,
  BAR_ATTENDANTS_FROM_CSV,
  BAR_DIALOG_TURNS_FROM_CSV,
  BAR_PLANET_ROSTER_POLICY_FROM_CSV,
  BAR_SONGS_FROM_CSV,
} from '../../../data/generated/csvBarPatronage';
import {
  PATRONAGE_DRINK_QTY_UI_CAP,
  BAR_DRINK_UNIT_PRICE_MAX,
  BAR_DRINK_UNIT_PRICE_MIN,
  buildBarPatronageRoster,
  findBarAttendantByDisplayName,
  getBarAttendantById,
  getBarAttendantHelloByName,
  listUniqueBarAttendantSpokenNames,
  getBarPatronagePolicy,
  getBarPlanetRosterPolicy,
  getBarSongById,
  listBarSongs,
  resolvePatronageDrinkMaxQty,
  resolveBarAttendantHelloOverlay,
  resolveBarDrinkUnitPrice,
  listBarDrinksUnlockedForLevel,
  resolveBarDrinkForBarLevel,
} from './barPatronageTables';

const CORE_BAR_PLANETS = 18;
const GRADE1_NAMES = [
  '미라',
  '레나',
  '소라',
  '유나',
  '키라',
  '노바',
  '아이리스',
  '베가',
  '루나',
  '아리아',
  '플룸',
];
const GRADE1_PORTRAIT_RE = /^assets\/images\/npc\/bar_att_char0(0[6-9]|1[0-6])\.png$/;

test('resolvePatronageDrinkMaxQty is UI cap 1000 (no session drink cap)', () => {
  assert.equal(resolvePatronageDrinkMaxQty(), 1000);
  assert.equal(resolvePatronageDrinkMaxQty(), PATRONAGE_DRINK_QTY_UI_CAP);
});

test('resolveBarDrinkUnitPrice uses planet table and stays in 150–250', () => {
  const table = resolveBarDrinkUnitPrice('arcadia_prime', 'drink_house_ale');
  assert.equal(table, 193);
  assert.ok(table >= BAR_DRINK_UNIT_PRICE_MIN && table <= BAR_DRINK_UNIT_PRICE_MAX);

  const catalogFallback = resolveBarDrinkUnitPrice('unknown_planet_xyz', 'drink_house_ale');
  assert.ok(
    catalogFallback >= BAR_DRINK_UNIT_PRICE_MIN &&
      catalogFallback <= BAR_DRINK_UNIT_PRICE_MAX,
  );
});

test('drink unlocks at bar L1/L2/L3', () => {
  assert.equal(listBarDrinksUnlockedForLevel(1).length, 1);
  assert.equal(resolveBarDrinkForBarLevel(1).drinkId, 'drink_house_ale');
  assert.equal(resolveBarDrinkForBarLevel(2).drinkId, 'drink_nebula_wine');
  assert.equal(resolveBarDrinkForBarLevel(3).drinkId, 'drink_phosphor_fizz');
  assert.equal(resolveBarDrinkForBarLevel(15).drinkId, 'drink_phosphor_fizz');
});

test('planet roster policy is 1–2 per bar', () => {
  const core = BAR_PLANET_ROSTER_POLICY_FROM_CSV.filter((r) => !r.planetId.startsWith('synth_'));
  const frontier = BAR_PLANET_ROSTER_POLICY_FROM_CSV.filter((r) => r.planetId.startsWith('synth_'));
  assert.equal(core.length, CORE_BAR_PLANETS);
  assert.ok(frontier.length >= 1, 'synth hasBar planets must have roster policy');
  for (const row of BAR_PLANET_ROSTER_POLICY_FROM_CSV) {
    assert.ok(row.rosterBase >= 1 && row.rosterBase <= 2, row.planetId);
    assert.ok(row.poolSize >= row.rosterBase && row.poolSize <= 2, row.planetId);
    assert.ok(row.qualityTier >= 1 && row.qualityTier <= 5, row.planetId);
  }
  assert.equal(getBarPlanetRosterPolicy('arcadia_prime')?.rosterBase, 2);
  assert.equal(getBarPlanetRosterPolicy('vega_base')?.rosterBase, 2);
  assert.equal(getBarPlanetRosterPolicy('blood_station')?.rosterBase, 1);
  assert.equal(getBarPlanetRosterPolicy('synth_002_p')?.rosterBase, 1);
  assert.equal(getBarPlanetRosterPolicy('synth_002_p')?.poolSize, 1);
});

test('attendants match pool policy; grade1 portraits unique; empties reserved', () => {
  const ids = new Set<string>();
  const portraits = new Set<string>();
  const byPlanet = new Map<string, number>();
  const namesKoByPlanet = new Map<string, Set<string>>();
  const expectedPool = new Map(
    BAR_PLANET_ROSTER_POLICY_FROM_CSV.map((r) => [r.planetId, r.poolSize] as const),
  );
  const grade1Seen = new Set<string>();

  let expectedTotal = 0;
  for (const n of expectedPool.values()) expectedTotal += n;
  assert.equal(BAR_ATTENDANTS_FROM_CSV.length, expectedTotal);

  for (const row of BAR_ATTENDANTS_FROM_CSV) {
    assert.notEqual(row.planetId, '*');
    assert.equal(ids.has(row.attendantId), false, `dup attendantId ${row.attendantId}`);
    const key = String(row.portraitImageAssetKey ?? '').trim();
    if (key) {
      assert.match(key, GRADE1_PORTRAIT_RE, row.attendantId);
      assert.equal(portraits.has(key), false, `dup portrait ${key}`);
      portraits.add(key);
      assert.ok(GRADE1_NAMES.includes(row.displayNameKo), `filled portrait on ${row.displayNameKo}`);
      assert.equal(grade1Seen.has(row.displayNameKo), false, `grade1 name reused ${row.displayNameKo}`);
      grade1Seen.add(row.displayNameKo);
    }
    const planetNamesKo = namesKoByPlanet.get(row.planetId) ?? new Set<string>();
    assert.equal(
      planetNamesKo.has(row.displayNameKo),
      false,
      `dup nameKo ${row.displayNameKo} on ${row.planetId}`,
    );
    planetNamesKo.add(row.displayNameKo);
    namesKoByPlanet.set(row.planetId, planetNamesKo);
    ids.add(row.attendantId);
    byPlanet.set(row.planetId, (byPlanet.get(row.planetId) ?? 0) + 1);
    assert.ok(getBarSongById(row.songId), `missing song ${row.songId}`);
  }

  assert.equal(ids.size, expectedTotal);
  assert.equal(portraits.size, 11);
  assert.equal(grade1Seen.size, 11);
  assert.equal(byPlanet.size, BAR_PLANET_ROSTER_POLICY_FROM_CSV.length);
  for (const [planetId, n] of byPlanet) {
    assert.equal(n, expectedPool.get(planetId), `${planetId} count ${n}`);
    assert.ok(n >= 1 && n <= 2, planetId);
  }
  assert.ok(getBarAttendantById('ta_att_001'));
  assert.equal(getBarAttendantById('ta_mira_01'), undefined);
});

test('findBarAttendantByDisplayName prefers current planet', () => {
  const mira = findBarAttendantByDisplayName('미라', 'arcadia_prime');
  assert.equal(mira?.attendantId, 'ta_att_001');
  assert.equal(findBarAttendantByDisplayName('Mira', 'arcadia_prime')?.attendantId, 'ta_att_001');
  assert.ok(listUniqueBarAttendantSpokenNames().length >= 11);
});

test('songs are 5 shared placeholders', () => {
  assert.equal(listBarSongs().length, 5);
  assert.equal(BAR_SONGS_FROM_CSV.length, 5);
  assert.equal(getBarSongById('song_01')?.titleKo, '네온 선셋');
});

test('name-keyed hello lines stay unique and overlay attendant_hello', () => {
  assert.equal(BAR_ATTENDANT_HELLO_FROM_CSV.length, 20);
  const names = new Set<string>();
  const textsKo = new Set<string>();
  const textsEn = new Set<string>();
  for (const row of BAR_ATTENDANT_HELLO_FROM_CSV) {
    assert.ok(row.displayNameKo);
    assert.ok(row.textKo);
    assert.ok(row.textEn);
    assert.equal(names.has(row.displayNameKo), false, `dup hello name ${row.displayNameKo}`);
    assert.equal(textsKo.has(row.textKo), false, `dup hello ko ${row.textKo}`);
    assert.equal(textsEn.has(row.textEn), false, `dup hello en ${row.textEn}`);
    names.add(row.displayNameKo);
    textsKo.add(row.textKo);
    textsEn.add(row.textEn);
    assert.equal(getBarAttendantHelloByName(row.displayNameKo)?.textKo, row.textKo);
  }

  for (const name of GRADE1_NAMES) {
    assert.ok(names.has(name), `hello missing grade1 ${name}`);
  }
  for (const row of BAR_ATTENDANTS_FROM_CSV) {
    assert.ok(
      getBarAttendantHelloByName(row.displayNameKo),
      `galaxy attendant missing hello ${row.displayNameKo}`,
    );
  }

  assert.equal(
    resolveBarAttendantHelloOverlay('ta_att_001', 'ko'),
    '오케스트라가 켜지기 전에 먼저 웃어 드릴게요.',
  );
  assert.equal(
    resolveBarAttendantHelloOverlay('ta_att_004', 'ko'),
    '포스포 불빛 아래에서는 말수가 없어도 괜찮아요.',
  );
  assert.equal(resolveBarAttendantHelloOverlay('missing_att', 'ko'), undefined);
});

test('dialog archetypes (8) plus host/shared exist', () => {
  const sets = new Set(BAR_DIALOG_TURNS_FROM_CSV.map((t) => t.dialogSetId));
  for (const id of [
    'dset_host',
    'dset_shared',
    'dset_cheerful',
    'dset_calm',
    'dset_jazz',
    'dset_star',
    'dset_ballroom',
    'dset_whisper',
    'dset_ember',
    'dset_echo',
  ]) {
    assert.ok(sets.has(id), `missing dialog set ${id}`);
  }
});

test('roster is 1–2 and capital shows two grade1 attendants', () => {
  const policy = getBarPatronagePolicy();
  assert.equal(policy.rosterMin, 1);
  assert.equal(policy.rosterMax, 2);
  assert.equal(policy.rosterDevBonusCap, 0);

  const capital = buildBarPatronageRoster({
    planetId: 'arcadia_prime',
    barLevel: 1,
    dayKey: '2026-09-06',
  });
  assert.equal(capital.length, 2);
  assert.ok(capital.every((r) => r.planetId === 'arcadia_prime'));
  assert.deepEqual(
    capital.map((r) => r.displayNameKo).sort(),
    ['레나', '미라'],
  );
  assert.ok(capital.every((r) => String(r.portraitImageAssetKey ?? '').trim()));

  const capitalHigh = buildBarPatronageRoster({
    planetId: 'arcadia_prime',
    barLevel: 10,
    dayKey: '2026-09-06',
  });
  assert.equal(capitalHigh.length, 2);

  const vega = buildBarPatronageRoster({
    planetId: 'vega_base',
    barLevel: 1,
    dayKey: '2026-09-16',
  });
  assert.equal(vega.length, 2);
  assert.deepEqual(
    vega.map((r) => r.displayNameKo).sort(),
    ['노바', '키라'],
  );

  const rim = buildBarPatronageRoster({
    planetId: 'blood_station',
    barLevel: 1,
    dayKey: '2026-09-06',
  });
  assert.equal(rim.length, 1);
  assert.equal(String(rim[0]?.portraitImageAssetKey ?? '').trim(), '');
});

test('frontier aurora bar lists 1 reserved empty-portrait attendant', () => {
  const aurora = buildBarPatronageRoster({
    planetId: 'synth_002_p',
    barLevel: 1,
    dayKey: '2026-09-09',
  });
  assert.equal(aurora.length, 1);
  assert.ok(aurora.every((r) => r.planetId === 'synth_002_p'));
  assert.equal(String(aurora[0]?.portraitImageAssetKey ?? '').trim(), '');
});
