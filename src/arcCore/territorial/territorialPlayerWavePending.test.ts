/**
 * 분쟁 차례 체류 웨이브 pending — 세션 1슬롯
 * npx tsx --test src/arcCore/territorial/territorialPlayerWavePending.test.ts
 */
import assert from 'node:assert/strict';
import {
  clearTerritorialPlayerWavePending,
  getTerritorialPlayerWavePending,
  getTerritorialPlayerWavePendingRevision,
  isTerritorialPlayerWavePending,
  requestTerritorialPlayerWavePending,
} from './territorialPlayerWavePending';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

clearTerritorialPlayerWavePending();

test('요청 후 해당 행성만 pending', () => {
  requestTerritorialPlayerWavePending({
    planetId: 'draco_haven',
    systemId: 'sys_draco_haven',
    campaignGroup: 'draco_front',
    orderIndex: 0,
    passIntervalSec: 1200,
    requestedAtMs: 1,
  });
  assert.equal(isTerritorialPlayerWavePending('draco_haven'), true);
  assert.equal(isTerritorialPlayerWavePending('vega_base'), false);
  assert.equal(getTerritorialPlayerWavePending()?.planetId, 'draco_haven');
});

test('동일 슬롯 재요청은 revision 고정(probe 리렌더 방지)', () => {
  const rev = getTerritorialPlayerWavePendingRevision();
  requestTerritorialPlayerWavePending({
    planetId: 'draco_haven',
    systemId: 'sys_draco_haven',
    campaignGroup: 'draco_front',
    orderIndex: 0,
    passIntervalSec: 1200,
    requestedAtMs: 99,
  });
  assert.equal(getTerritorialPlayerWavePendingRevision(), rev);
});

test('다른 행성 요청은 슬롯 교체', () => {
  requestTerritorialPlayerWavePending({
    planetId: 'omega_station',
    systemId: 'sys_omega',
    campaignGroup: 'draco_front',
    orderIndex: 1,
    passIntervalSec: 1200,
    requestedAtMs: 2,
  });
  assert.equal(isTerritorialPlayerWavePending('draco_haven'), false);
  assert.equal(isTerritorialPlayerWavePending('omega_station'), true);
});

test('행성 지정 clear', () => {
  clearTerritorialPlayerWavePending('omega_station');
  assert.equal(getTerritorialPlayerWavePending(), null);
  assert.equal(isTerritorialPlayerWavePending('omega_station'), false);
});

console.log('territorialPlayerWavePending.test.ts — all PASS');
