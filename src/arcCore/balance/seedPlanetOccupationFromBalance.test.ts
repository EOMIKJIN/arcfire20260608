/**
 * Occupation seed repair — unit tests
 * npx tsx src/arcCore/balance/seedPlanetOccupationFromBalance.test.ts
 */
import assert from 'node:assert/strict';
import {
  ARC_CORE_SEED_RED_CLAN_ID,
  ARC_CORE_SEED_BLUE_CLAN_ID,
  seedPlanetOccupationHoldsFromBalance,
} from './seedPlanetOccupationFromBalance';
import { applyPlanetOccupationSeedPipeline } from '../../clanWar/planetOccupationSeedPipeline';
import { resolveEffectiveMapOccupierClanId } from '../../clanWar/planetOwnershipModel';
import type { ClanBasicsRecord, PlanetClanHold } from '../../types';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

function aiClanHold(planetId: string, systemId: string): PlanetClanHold {
  return {
    planetId,
    systemId,
    occupierClanId: 'ai_clan_npc_cpt_ai_clan_neutral_01',
    homePlayerUid: 'npc_leader_ai_clan_neutral_01',
    kind: 'clan_hold',
    capturedAt: 1,
  };
}

test('omega_hub AI클랜 → 크림슨 레기온 RED 시드', () => {
  const { holds } = seedPlanetOccupationHoldsFromBalance({
    omega_hub: aiClanHold('omega_hub', 'omega_station'),
  });
  assert.equal(holds.omega_hub?.occupierClanId, ARC_CORE_SEED_RED_CLAN_ID);
  assert.equal(holds.omega_hub?.kind, 'clan_hold');
  assert.equal(
    resolveEffectiveMapOccupierClanId('omega_hub', holds.omega_hub),
    ARC_CORE_SEED_RED_CLAN_ID,
  );
});

test('perseus_memorial neutral → RED 시드', () => {
  const { holds } = seedPlanetOccupationHoldsFromBalance({
    perseus_memorial: {
      planetId: 'perseus_memorial',
      systemId: 'perseus',
      occupierClanId: 'neutral',
      homePlayerUid: null,
      kind: 'neutral',
      capturedAt: 1,
    },
  });
  assert.equal(holds.perseus_memorial?.occupierClanId, ARC_CORE_SEED_RED_CLAN_ID);
  assert.equal(
    resolveEffectiveMapOccupierClanId('perseus_memorial', holds.perseus_memorial),
    ARC_CORE_SEED_RED_CLAN_ID,
  );
});

test('draco_haven contested neutral 유지 (ArcCore 판정)', () => {
  const { holds } = seedPlanetOccupationHoldsFromBalance({
    draco_haven: {
      planetId: 'draco_haven',
      systemId: 'draco_nebula',
      occupierClanId: 'neutral',
      homePlayerUid: null,
      kind: 'neutral',
      capturedAt: 1,
    },
  });
  assert.equal(holds.draco_haven?.occupierClanId, 'neutral');
  assert.equal(resolveEffectiveMapOccupierClanId('draco_haven', holds.draco_haven), undefined);
});

test('draco_haven AI클랜 → BLUE 국가 시드', () => {
  const { holds } = seedPlanetOccupationHoldsFromBalance({
    draco_haven: aiClanHold('draco_haven', 'draco_nebula'),
  });
  assert.equal(holds.draco_haven?.occupierClanId, ARC_CORE_SEED_BLUE_CLAN_ID);
});

test('pipeline — AI sync 후 legacy ai_clan on nation seed 복구', () => {
  const holds: Record<string, PlanetClanHold> = {
    omega_hub: aiClanHold('omega_hub', 'omega_station'),
    perseus_memorial: {
      planetId: 'perseus_memorial',
      systemId: 'perseus',
      occupierClanId: 'neutral',
      homePlayerUid: null,
      kind: 'neutral',
      capturedAt: 1,
    },
  };
  const piped = applyPlanetOccupationSeedPipeline(holds, {} as Record<string, ClanBasicsRecord>);
  assert.equal(piped.holds.omega_hub?.occupierClanId, ARC_CORE_SEED_RED_CLAN_ID);
  assert.equal(piped.holds.perseus_memorial?.occupierClanId, ARC_CORE_SEED_RED_CLAN_ID);
  assert.equal(piped.mutated, true);
});

console.log('seedPlanetOccupationFromBalance.test.ts — all PASS');
