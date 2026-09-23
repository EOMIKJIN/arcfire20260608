import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  getCaptainPresenceMemory,
  getLastHubWorldChangeDigest,
  getPlanetVisitSnapshot,
  recordOrbitComm,
  recordPlanetVisitSnapshot,
  resetOrbitPresenceMemory,
  setLastHubWorldChangeDigest,
  useOrbitPresenceMemoryStore,
} from './orbitPresenceMemoryStore';

test('record then get · reset clears in-memory payload', async () => {
  await resetOrbitPresenceMemory();
  assert.equal(useOrbitPresenceMemoryStore.getState().payload.captains.length, 0);
  const ok = recordOrbitComm({
    captainId: 'npc_cpt_mireille',
    planetId: 'arcadia_prime',
    outcome: 'accept',
    sceneId: 'npc_dialog_mireille',
    writeId: 'store-1',
    atMs: 10,
  });
  assert.equal(ok, true);
  assert.equal(getCaptainPresenceMemory('npc_cpt_mireille')?.commCount, 1);
  await resetOrbitPresenceMemory();
  assert.equal(getCaptainPresenceMemory('npc_cpt_mireille'), undefined);
  assert.equal(useOrbitPresenceMemoryStore.getState().payload.captains.length, 0);
});

test('purge 후 같은 writeId 재기록 가능', async () => {
  await resetOrbitPresenceMemory();
  recordOrbitComm({
    captainId: 'npc_cpt_orin',
    planetId: 'vega_base',
    outcome: 'accept',
    sceneId: 'npc_dialog_orin',
    writeId: 'repeat',
    atMs: 1,
  });
  await resetOrbitPresenceMemory();
  const ok = recordOrbitComm({
    captainId: 'npc_cpt_orin',
    planetId: 'vega_base',
    outcome: 'accept',
    sceneId: 'npc_dialog_orin',
    writeId: 'repeat',
    atMs: 2,
  });
  assert.equal(ok, true);
  assert.equal(getCaptainPresenceMemory('npc_cpt_orin')?.commCount, 1);
});

test('방문 스냅 기록 · 세션 digest는 persist 밖 · reset 시 비움', async () => {
  await resetOrbitPresenceMemory();
  recordPlanetVisitSnapshot({
    planetId: 'arcadia_prime',
    visitedAtMs: 20,
    holdSig: 'ai_blue||clan_hold|0',
    captainIds: ['npc_cpt_mireille'],
    boardHeadId: 'n1',
    boardHeadTag: 'ops',
  });
  assert.equal(getPlanetVisitSnapshot('arcadia_prime')?.holdSig, 'ai_blue||clan_hold|0');
  setLastHubWorldChangeDigest({
    planetId: 'arcadia_prime',
    items: [{ kind: 'hold' }],
    factLine: '점유가 바뀌었다.',
  });
  assert.equal(getLastHubWorldChangeDigest()?.factLine, '점유가 바뀌었다.');
  await resetOrbitPresenceMemory();
  assert.equal(getPlanetVisitSnapshot('arcadia_prime'), undefined);
  assert.equal(getLastHubWorldChangeDigest(), null);
});
