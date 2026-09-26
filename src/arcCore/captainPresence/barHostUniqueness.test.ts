import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import { NPC_CAPTAINS_FROM_CSV } from '../../data/generated/csvNpcCaptains';

function parsePlanets() {
  const raw = readFileSync(resolve(__dirname, '../../../tables/content/planets.csv'), 'utf8')
    .trim()
    .split(/\r?\n/);
  const header = raw[0]!.split(',');
  const iId = header.indexOf('id');
  const iBar = header.indexOf('hasBar');
  return raw.slice(1).map((line) => {
    const cols = line.split(',');
    return { id: cols[iId]!, hasBar: cols[iBar] === 'true' };
  });
}

test('each core hasBar planet has exactly one unique bar host', () => {
  const hasBarPlanets = parsePlanets().filter((p) => p.hasBar);
  const hosts = NPC_CAPTAINS_FROM_CSV.filter((c) => c.barPlanetIds.length > 0);
  const planetToHost = new Map<string, string>();
  for (const host of hosts) {
    assert.equal(
      host.barPlanetIds.length,
      1,
      `${host.id} must own exactly one bar planet, got ${host.barPlanetIds.join('|')}`,
    );
    const planetId = host.barPlanetIds[0]!;
    assert.equal(host.basePlanetId, planetId, `${host.id} basePlanetId must match bar planet`);
    assert.ok(!planetToHost.has(planetId), `planet ${planetId} already hosted by ${planetToHost.get(planetId)}`);
    planetToHost.set(planetId, host.id);
  }
  for (const planet of hasBarPlanets) {
    assert.ok(planetToHost.has(planet.id), `hasBar planet ${planet.id} has no unique host`);
  }
  assert.equal(planetToHost.get('solar_station'), 'npc_cpt_bar_ret_01');
  assert.equal(planetToHost.get('arcadia_prime'), 'npc_cpt_bar_ret_05');
});

test('bar screen does not hash-reuse a host on another planet', () => {
  const bar = readFileSync(resolve(__dirname, '../../../app/(game)/bar.tsx'), 'utf8');
  assert.doesNotMatch(bar, /hash % retiredPool/);
  assert.match(bar, /resolveBarHostCaptainAtPlanet/);
});
