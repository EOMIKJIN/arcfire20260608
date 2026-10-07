/**
 * 편입된 행성의 개척 도착 취소 · 드라코는 분쟁이라 개척 대상이 아님
 * npx tsx --test src/arcCore/colonize/cancelStelliumColonizeForAnnex.test.ts
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { PlanetOccupationSeeds_FROM_BALANCE_CSV } from '../../data/balance/generated/csvPlanetOccupationSeeds';
import { evaluateStelliumColonizeEligibility } from './stelliumColonizeEligibility';
import { collectAnnexedColonizeArrivalIds } from './stelliumColonizeAnnexGuard';
import type { StelliumColonizeRecord } from './stelliumColonizeTypes';

function row(planetId: string, phase: StelliumColonizeRecord['phase']): StelliumColonizeRecord {
  return {
    planetId,
    systemId: 'helios',
    factionId: 'stellium',
    phase,
    hopDistance: 1,
    travelDays: 1,
    attempt: 0,
    departedDayKey: null,
    dueDayKey: null,
    outpostDueAtMs: null,
  };
}

test('블루로 편입된 진행 중 개척만 도착 취소 대상', () => {
  const records = {
    helios_core: row('helios_core', 'in_flight'),
    aurora_obs: row('aurora_obs', 'queued'),
    done_world: row('done_world', 'success'),
  };
  const blue = new Set(['helios_core', 'done_world']);
  assert.deepEqual(
    collectAnnexedColonizeArrivalIds(records, (id) => blue.has(id)),
    ['helios_core'],
  );
});

test('드라코 성운은 분쟁 시드라 개척선을 보내지 않음', () => {
  const draco = PlanetOccupationSeeds_FROM_BALANCE_CSV.find((row) => row.planetId === 'draco_haven');
  const helios = PlanetOccupationSeeds_FROM_BALANCE_CSV.find((row) => row.planetId === 'helios_core');
  assert.equal(draco?.contestedZone, 'true');
  assert.equal(helios?.contestedZone, 'false');
  const gate = evaluateStelliumColonizeEligibility({
    planetId: 'draco_haven',
    systemId: 'draco_nebula',
    systemUnlocked: true,
    planetInfoRevealed: true,
    hold: undefined,
    csvInitialOwner: 'BLUE',
    contested: draco?.contestedZone === 'true',
  });
  assert.deepEqual(gate, { ok: false, reason: 'contested' });
});
