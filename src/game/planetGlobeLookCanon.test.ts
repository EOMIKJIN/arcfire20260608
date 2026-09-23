/**
 * npx tsx --test src/game/planetGlobeLookCanon.test.ts
 * 빌드타임 룩 정본 — 런타임 RN 경로 아님.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  PLANET_GLOBE_LOOK_CANON,
  assertPlanetGlobeLookUniqueness,
  assertPlanetGlobeLooksUniqueness,
  getPlanetGlobeLook,
} from './planetGlobeLookCanon';
import { PLANET_GLOBE_LOOK_COLONIZED } from '../data/generated/planetGlobeLookColonized';
import {
  deriveColonizedGlobeLook,
  pickColonizedGlobeKind,
  seedColonizedLookUniquenessState,
} from './planetGlobeLookDerive';
import { samplePlanetGlobeLookRgba } from './planetGlobeBakeSample';

test('정본 21행성 · 시드·베리에이션 충돌 없음', () => {
  assert.equal(PLANET_GLOBE_LOOK_CANON.length, 21);
  assertPlanetGlobeLookUniqueness();
});

test('getPlanetGlobeLook — 정본 맵만 (개척 룩은 generated)', () => {
  assert.equal(getPlanetGlobeLook('arcadia_prime')?.kind, 'habit');
  assert.equal(getPlanetGlobeLook('core_prime')?.kind, 'aether');
  assert.equal(getPlanetGlobeLook('synth_002_p'), null);
});

test('개척 룩은 8 kind 디렉토리 변형이며 정본과 충돌 없음', () => {
  if (PLANET_GLOBE_LOOK_COLONIZED.length === 0) return;
  const kinds = new Set(PLANET_GLOBE_LOOK_COLONIZED.map((r) => r.kind));
  for (const kind of kinds) {
    assert.ok(
      PLANET_GLOBE_LOOK_CANON.some((r) => r.kind === kind),
      `unknown kind ${kind}`,
    );
  }
  assertPlanetGlobeLooksUniqueness([...PLANET_GLOBE_LOOK_CANON, ...PLANET_GLOBE_LOOK_COLONIZED]);
});

test('deriveColonizedGlobeLook — 존 디렉토리·고유 시드', () => {
  const { usedSeeds, usedFingerprintsByKind } = seedColonizedLookUniquenessState(PLANET_GLOBE_LOOK_CANON);
  const a = deriveColonizedGlobeLook('synth_002_p', 'neutral', usedSeeds, usedFingerprintsByKind);
  const b = deriveColonizedGlobeLook('synth_003_p', 'pvp', usedSeeds, usedFingerprintsByKind);
  assert.equal(a.kind, pickColonizedGlobeKind('synth_002_p', 'neutral'));
  assert.notEqual(a.planetId, b.planetId);
  assert.notEqual(a.seed, b.seed);
  assert.notDeepEqual(a.variant, b.variant);
});

test('samplePlanetGlobeLookRgba 결정론', () => {
  const row = getPlanetGlobeLook('arcadia_prime');
  assert.ok(row);
  const a = samplePlanetGlobeLookRgba(row, 128, 96, 256);
  const b = samplePlanetGlobeLookRgba(row, 128, 96, 256);
  assert.deepEqual(a, b);
});

test('같은 kind라도 중심 샘플이 동일하지 않음', () => {
  const byKind = new Map<string, Array<(typeof PLANET_GLOBE_LOOK_CANON)[number]>>();
  for (const row of PLANET_GLOBE_LOOK_CANON) {
    const list = byKind.get(row.kind) ?? [];
    list.push(row);
    byKind.set(row.kind, list);
  }
  for (const [kind, rows] of byKind) {
    if (rows.length < 2) continue;
    for (let i = 0; i < rows.length; i += 1) {
      for (let j = i + 1; j < rows.length; j += 1) {
        const pa = samplePlanetGlobeLookRgba(rows[i]!, 128, 100, 256);
        const pb = samplePlanetGlobeLookRgba(rows[j]!, 128, 100, 256);
        const same = pa[0] === pb[0] && pa[1] === pb[1] && pa[2] === pb[2] && pa[3] === pb[3];
        assert.equal(same, false, `${kind}: ${rows[i]!.planetId} === ${rows[j]!.planetId}`);
      }
    }
  }
});
