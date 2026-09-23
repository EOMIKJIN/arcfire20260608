/**
 * npx tsx --test src/worldObjects/providers/stelliumColonizeWorldObjectProvider.test.ts
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { useStelliumColonizeStore } from '../../store/stelliumColonizeStore';
import type { StelliumColonizeRecord } from '../../arcCore/colonize/stelliumColonizeTypes';
import {
  isStelliumColonizeWorldObject,
  stelliumColonizeWorldObjectProvider,
} from './stelliumColonizeWorldObjectProvider';

const ROW: StelliumColonizeRecord = {
  planetId: 'helios_core',
  systemId: 'helios',
  factionId: 'stellium',
  phase: 'in_flight',
  hopDistance: 1,
  travelDays: 1,
  attempt: 0,
  departedDayKey: '2026-09-19',
  dueDayKey: '2026-09-20',
  outpostDueAtMs: 1_000,
};

test('colonize WO — 레코드 없으면 비어 있고, 있으면 행성 근궤도 1대', () => {
  useStelliumColonizeStore.setState({ hydrated: true, revision: 1, byPlanetId: {} });
  assert.equal(
    stelliumColonizeWorldObjectProvider.list({ planetId: 'helios_core', systemId: 'helios' }).length,
    0,
  );

  useStelliumColonizeStore.setState({
    hydrated: true,
    revision: 2,
    byPlanetId: { helios_core: ROW },
  });
  const list = stelliumColonizeWorldObjectProvider.list({
    planetId: 'helios_core',
    systemId: 'helios',
  });
  assert.equal(list.length, 1);
  assert.ok(list[0]!.transform.radiusScale < 0.58);
  assert.ok(list[0]!.transform.radiusScale > 0.375);
  assert.equal(list[0]?.transform.phaseBias, 0.18);
  assert.equal(isStelliumColonizeWorldObject(list[0]!), true);

  useStelliumColonizeStore.setState({
    hydrated: true,
    revision: 3,
    byPlanetId: { helios_core: { ...ROW, phase: 'queued' } },
  });
  assert.equal(
    stelliumColonizeWorldObjectProvider.list({ planetId: 'helios_core', systemId: 'helios' }).length,
    0,
  );
});
