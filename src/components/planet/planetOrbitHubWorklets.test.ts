/**
 * 아크 수송선 궤도 적분 단일화 — unit tests
 * npx tsx --test src/components/planet/planetOrbitHubWorklets.test.ts
 */
import assert from 'node:assert/strict';
import {
  computeArcNpcShipScreenPacked,
  jsArcNpcDistanceFromCenter,
  ARC_ORBIT_PACK_STRIDE,
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

/** dwelling(phaseCode=1) 1척짜리 flat 버퍼 */
function packDwellingShip(input: {
  phaseElapsedSec: number;
  orbitAngleRad: number;
  orbitRadiusPx: number;
  dwellRadPerSec: number;
}): number[] {
  const out = new Array<number>(ARC_ORBIT_PACK_STRIDE).fill(0);
  out[0] = 1; // phaseCode dwelling
  out[1] = input.phaseElapsedSec;
  out[2] = 999; // phaseDurationSec(dwelling엔 phaseP 미사용)
  out[3] = input.orbitAngleRad;
  out[4] = input.orbitRadiusPx;
  out[5] = 0; // edgeAngleRad(dwelling 미사용)
  out[6] = input.dwellRadPerSec;
  return out;
}

test('M2: re-pack 경계에서 각도 연속(점프 없음) — 이전 pack의 dt만큼 진행된 각과 새 pack(dt=0)의 phaseEl0 반영 각이 일치', () => {
  const anchor = 0.3;
  const dwellRate = 0.44;
  const center = 100;

  // 1차 pack — phaseElapsedSec=2.0에서 pack, 이후 dt=1.5초 경과 후 렌더
  const flatA = packDwellingShip({
    phaseElapsedSec: 2.0,
    orbitAngleRad: anchor,
    orbitRadiusPx: 120,
    dwellRadPerSec: dwellRate,
  });
  const tA0 = 10_000;
  const mAAfter = tA0 + 1500; // 1.5s 경과
  const posBeforeRepack = computeArcNpcShipScreenPacked(0, mAAfter, tA0, flatA, 1, center)!;

  // 이 순간 다른 함선 phase 변경으로 전원 재-pack — JS tickShips가 그동안(2.0+1.5=3.5s) 누적한
  // phaseElapsedSec을 그대로 실어 보낸다. 새 pack 직후(dt=0)에는 정확히 같은 위치여야 한다(연속).
  const flatB = packDwellingShip({
    phaseElapsedSec: 3.5,
    orbitAngleRad: anchor,
    orbitRadiusPx: 120,
    dwellRadPerSec: dwellRate,
  });
  const tB0 = mAAfter; // 재-pack 시각 = 방금 렌더된 시각
  const posAfterRepack = computeArcNpcShipScreenPacked(0, tB0, tB0, flatB, 1, center)!;

  assert.ok(Math.abs(posBeforeRepack.x - posAfterRepack.x) < 1e-9, 'x 연속');
  assert.ok(Math.abs(posBeforeRepack.y - posAfterRepack.y) < 1e-9, 'y 연속');
});

test('dwelling 각도는 phaseElapsedSec+dt에 비례해 단조 증가(dwellRate)', () => {
  const flat = packDwellingShip({
    phaseElapsedSec: 0,
    orbitAngleRad: 0,
    orbitRadiusPx: 100,
    dwellRadPerSec: 0.5,
  });
  const t0 = 0;
  const p0 = computeArcNpcShipScreenPacked(0, 0, t0, flat, 1, 0)!;
  const p1 = computeArcNpcShipScreenPacked(0, 1000, t0, flat, 1, 0)!; // 1s 경과 → 0.5rad 회전
  const angle0 = Math.atan2(p0.y / 0.66, p0.x);
  const angle1 = Math.atan2(p1.y / 0.66, p1.x);
  let delta = angle1 - angle0;
  if (delta < 0) delta += Math.PI * 2;
  assert.ok(Math.abs(delta - 0.5) < 1e-6, `delta=${delta} ≈ 0.5rad 이어야 함`);
});

test('jsArcNpcDistanceFromCenter — computeArcNpcShipScreenPacked와 동일 궤도(같은 dt·phaseEl0 조합에서 반경 일치)', () => {
  const flat = packDwellingShip({
    phaseElapsedSec: 4.0,
    orbitAngleRad: 1.1,
    orbitRadiusPx: 130,
    dwellRadPerSec: 0.3,
  });
  const m = 2500;
  const t0 = 1000;
  const screen = computeArcNpcShipScreenPacked(0, m, t0, flat, 1, 0)!;
  const dist = jsArcNpcDistanceFromCenter(0, m, t0, flat, 1)!;
  const screenDist = Math.hypot(screen.x, screen.y);
  assert.ok(Math.abs(dist - screenDist) < 1e-9, `dist=${dist} screenDist=${screenDist}`);
});

console.log('[planetOrbitHubWorklets] all tests passed');
