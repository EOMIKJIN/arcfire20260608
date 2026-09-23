/**
 * npx tsx --test src/components/planet/arcOrbitPackEpoch.test.ts
 */
import assert from 'node:assert/strict';
import type { ArcNpcTrafficShip } from '../../store/arcNpcTrafficStore';
import {
  createArcOrbitPackEpochState,
  resolveArcOrbitPackElapsed,
} from './arcOrbitPackEpoch';
import { bakeEnteringLerpToOrbitAnchor } from '../../arcCore/orbitPresence/arcNpcTrafficPhaseMath';
import {
  ARC_ORBIT_EDGE_R,
  ARC_ORBIT_PACK_STRIDE,
  computeArcNpcShipScreenPacked,
} from './planetOrbitHubWorklets';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

function ship(partial: Partial<ArcNpcTrafficShip> & { id: string }): ArcNpcTrafficShip {
  return {
    id: partial.id,
    captainId: partial.captainId ?? 'c1',
    planetId: partial.planetId ?? 'arcadia_prime',
    phase: partial.phase ?? 'dwelling',
    phaseElapsedSec: partial.phaseElapsedSec ?? 0,
    phaseDurationSec: partial.phaseDurationSec ?? 100,
    orbitAngleRad: partial.orbitAngleRad ?? 0.5,
    orbitRadiusPx: partial.orbitRadiusPx ?? 120,
    edgeAngleRad: partial.edgeAngleRad ?? 1,
    arcTrafficDwellRadPerSec: partial.arcTrafficDwellRadPerSec ?? 0.44,
    arcTrafficPhaseDurationMul: partial.arcTrafficPhaseDurationMul ?? 2,
    arcTrafficPlanetDwellSecMin: 60,
    arcTrafficPlanetDwellSecMax: 600,
  };
}

test('pack epoch: 재-pack 시 wall stale(0)여도 orbit-clock Δ로 경과 연속', () => {
  const epoch = createArcOrbitPackEpochState();
  const s = ship({ id: 'a', phase: 'dwelling', phaseElapsedSec: 10 });

  const r1 = resolveArcOrbitPackElapsed([s], epoch, 1000);
  assert.equal(r1.elapsedById.get('a'), 10);
  assert.equal(r1.syncMs, 1000);

  // store가 stale 0을 줘도, 직전 pack+Δmirror로 연속
  const sStale = ship({ id: 'a', phase: 'dwelling', phaseElapsedSec: 0 });
  const r2 = resolveArcOrbitPackElapsed([sStale], epoch, 2500);
  assert.ok(Math.abs((r2.elapsedById.get('a') ?? 0) - 11.5) < 1e-9, `el=${r2.elapsedById.get('a')}`);
});

test('pack epoch: phase 변경 시 store elapsed로 리셋', () => {
  const epoch = createArcOrbitPackEpochState();
  const dwell = ship({ id: 'a', phase: 'dwelling', phaseElapsedSec: 40 });
  resolveArcOrbitPackElapsed([dwell], epoch, 5000);

  const depart = ship({ id: 'a', phase: 'departing', phaseElapsedSec: 0 });
  const r = resolveArcOrbitPackElapsed([depart], epoch, 5200);
  assert.equal(r.elapsedById.get('a'), 0);
});

test('entering bake: lerp 중간 위치 = departing(phaseP=0) 시작점', () => {
  // worklet은 edgeR를 패킹하지 않고 ARC_ORBIT_EDGE_R 상수만 사용 — bake도 동일 상수.
  const orbitR = 120;
  const edgeAng = 0.2;
  const orbitAng = 1.4;
  const elapsed = 2;
  const dur = 4;
  const baked = bakeEnteringLerpToOrbitAnchor({
    phaseElapsedSec: elapsed,
    phaseDurationSec: dur,
    orbitAngleRad: orbitAng,
    orbitRadiusPx: orbitR,
    edgeAngleRad: edgeAng,
    edgeRadiusPx: ARC_ORBIT_EDGE_R,
  });

  const enterFlat = new Array(ARC_ORBIT_PACK_STRIDE).fill(0);
  enterFlat[0] = 0;
  enterFlat[1] = elapsed;
  enterFlat[2] = dur;
  enterFlat[3] = orbitAng;
  enterFlat[4] = orbitR;
  enterFlat[5] = edgeAng;
  enterFlat[6] = 0.44;
  const pEnter = computeArcNpcShipScreenPacked(0, 0, 0, enterFlat, 1, 0)!;

  const depFlat = new Array(ARC_ORBIT_PACK_STRIDE).fill(0);
  depFlat[0] = 2;
  depFlat[1] = 0;
  depFlat[2] = 5;
  depFlat[3] = baked.orbitAngleRad;
  depFlat[4] = baked.orbitRadiusPx;
  depFlat[5] = 2.0; // new edge — phaseP=0이면 orbit 앵커만 사용
  depFlat[6] = 0.44;
  const pDep = computeArcNpcShipScreenPacked(0, 0, 0, depFlat, 1, 0)!;

  assert.ok(Math.abs(pEnter.x - pDep.x) < 1e-6, `x ${pEnter.x} vs ${pDep.x}`);
  assert.ok(Math.abs(pEnter.y - pDep.y) < 1e-6, `y ${pEnter.y} vs ${pDep.y}`);
});

console.log('[arcOrbitPackEpoch] all tests passed');
