/**
 * npx tsx --test src/store/stelliumColonizeMerge.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mergeStelliumColonizeRecords } from './stelliumColonizeStore';
import type { StelliumColonizeRecord } from '../arcCore/colonize/stelliumColonizeTypes';

function row(over: Partial<StelliumColonizeRecord> & Pick<StelliumColonizeRecord, 'phase'>): StelliumColonizeRecord {
  return {
    planetId: 'synth_078_p',
    systemId: 'synth_078',
    factionId: 'stellium',
    hopDistance: 4,
    travelDays: 3,
    attempt: 0,
    departedDayKey: '2026-09-21',
    dueDayKey: '2026-09-24',
    outpostDueAtMs: 1,
    lastOpexDayKey: null,
    ...over,
  };
}

test('merge — 디스크 전초기지가 착륙 재출항 in_flight보다 우선', () => {
  const merged = mergeStelliumColonizeRecords(
    { synth_078_p: row({ phase: 'in_flight', outpostDueAtMs: Date.now() + 300_000 }) },
    { synth_078_p: row({ phase: 'outpost', outpostDueAtMs: 1 }) },
  );
  assert.equal(merged.synth_078_p?.phase, 'outpost');
  assert.equal(merged.synth_078_p?.outpostDueAtMs, 1);
});

test('merge — 메모리 전초기지는 디스크 접근보다 우선', () => {
  const merged = mergeStelliumColonizeRecords(
    { synth_078_p: row({ phase: 'outpost', outpostDueAtMs: 1 }) },
    { synth_078_p: row({ phase: 'in_flight', outpostDueAtMs: 9 }) },
  );
  assert.equal(merged.synth_078_p?.phase, 'outpost');
});
