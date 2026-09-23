import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ORBIT_PRESENCE_CAPTAINS_MAX,
  ORBIT_PRESENCE_EVENTS_MAX,
  ORBIT_PRESENCE_VISITS_MAX,
  buildPlanetHoldSig,
  computeWorldChangeDigest,
  emptyOrbitPresenceMemoryPayload,
  getCaptainPresenceMemoryFromPayload,
  getPlanetVisitSnapshotFromPayload,
  mergeOrbitPresenceMemoryPayload,
  normalizeOrbitPresenceMemoryPayload,
  patchCaptainPersonalMemoryOnPayload,
  recordOrbitCommOnPayload,
  parsePlanetHoldSig,
  recordPlanetVisitSnapshotOnPayload,
  resolveOrbitCommConnectedBodyKind,
  resolveOrbitCommSceneVariant,
} from './orbitPresenceMemory';

function record(
  payload: ReturnType<typeof emptyOrbitPresenceMemoryPayload>,
  captainId: string,
  opts?: { planetId?: string; outcome?: 'accept' | 'refuse_hostile'; sceneId?: string; atMs?: number; writeId?: string },
): boolean {
  return recordOrbitCommOnPayload(payload, {
    captainId,
    planetId: opts?.planetId ?? 'arcadia_prime',
    outcome: opts?.outcome ?? 'accept',
    sceneId: opts?.sceneId ?? 'npc_dialog_mireille',
    atMs: opts?.atMs ?? 1_000,
    writeId: opts?.writeId ?? `w_${captainId}_${opts?.atMs ?? 1_000}`,
  });
}

test('LRU 65번째 함장 삽입 → 가장 오래된 lastSeenAtMs 축출', () => {
  const payload = emptyOrbitPresenceMemoryPayload();
  for (let i = 0; i < ORBIT_PRESENCE_CAPTAINS_MAX; i += 1) {
    record(payload, `cpt_${i}`, { atMs: 1_000 + i, writeId: `w${i}` });
  }
  assert.equal(payload.captains.length, ORBIT_PRESENCE_CAPTAINS_MAX);
  assert.ok(getCaptainPresenceMemoryFromPayload(payload, 'cpt_0'));
  record(payload, 'cpt_new', { atMs: 9_000, writeId: 'w_new' });
  assert.equal(payload.captains.length, ORBIT_PRESENCE_CAPTAINS_MAX);
  assert.equal(getCaptainPresenceMemoryFromPayload(payload, 'cpt_0'), undefined);
  assert.ok(getCaptainPresenceMemoryFromPayload(payload, 'cpt_new'));
});

test('동일 통신 2회 → commCount==2, events.length≤4', () => {
  const payload = emptyOrbitPresenceMemoryPayload();
  record(payload, 'npc_cpt_mireille', { atMs: 1, writeId: 'a' });
  record(payload, 'npc_cpt_mireille', { atMs: 2, writeId: 'b' });
  const mem = getCaptainPresenceMemoryFromPayload(payload, 'npc_cpt_mireille');
  assert.equal(mem?.commCount, 2);
  assert.ok((mem?.events.length ?? 0) <= ORBIT_PRESENCE_EVENTS_MAX);
  for (let i = 0; i < 6; i += 1) {
    record(payload, 'npc_cpt_mireille', { atMs: 10 + i, writeId: `e${i}` });
  }
  const again = getCaptainPresenceMemoryFromPayload(payload, 'npc_cpt_mireille');
  assert.equal(again?.events.length, ORBIT_PRESENCE_EVENTS_MAX);
  assert.equal(again?.commCount, 8);
});

test('거부 후 수락 → refuseCount≥1, 첫 accept 플래그', () => {
  const payload = emptyOrbitPresenceMemoryPayload();
  record(payload, 'npc_cpt_kresh', { outcome: 'refuse_hostile', writeId: 'r1' });
  const refused = getCaptainPresenceMemoryFromPayload(payload, 'npc_cpt_kresh');
  assert.equal(refused?.refuseCount, 1);
  assert.equal(refused?.commCount, 0);
  record(payload, 'npc_cpt_kresh', { outcome: 'accept', writeId: 'a1' });
  const accepted = getCaptainPresenceMemoryFromPayload(payload, 'npc_cpt_kresh');
  assert.equal(accepted?.refuseCount, 1);
  assert.equal(accepted?.commCount, 1);
  assert.equal(accepted?.lastOutcome, 'accept');
});

test('digest: hold+roster+board → 상위 2만 (hold, roster)', () => {
  const prev = {
    planetId: 'vega_base',
    visitedAtMs: 1,
    holdSig: buildPlanetHoldSig({ occupierClanId: 'ai_blue', kind: 'clan_hold' }),
    captainIds: ['npc_cpt_a'],
    boardHeadId: 'old',
    boardHeadTag: 'ops',
  };
  const next = {
    planetId: 'vega_base',
    holdSig: buildPlanetHoldSig({ occupierClanId: 'ai_red', kind: 'clan_hold' }),
    captainIds: ['npc_cpt_b'],
    boardHeadId: 'new',
    boardHeadTag: 'ops',
  };
  const items = computeWorldChangeDigest(prev, next, new Set(['npc_cpt_a', 'npc_cpt_b']));
  assert.equal(items.length, 2);
  assert.equal(items[0]?.kind, 'hold');
  assert.equal(items[1]?.kind, 'roster');
});

test('digest: prev 없음 → 빈 배열', () => {
  const items = computeWorldChangeDigest(
    undefined,
    {
      planetId: 'vega_base',
      holdSig: 'x',
      captainIds: [],
      boardHeadId: 'n',
    },
    new Set(),
  );
  assert.deepEqual(items, []);
});

test('씬 변이: commCount=0 → base; ≥1 + revisit 존재 → __revisit; 없으면 base', () => {
  const scenes = new Set(['npc_dialog_mireille', 'npc_dialog_mireille__revisit']);
  const hasScene = (id: string) => scenes.has(id);
  const empty = resolveOrbitCommSceneVariant('npc_dialog_mireille', undefined, hasScene);
  assert.equal(empty.sceneId, 'npc_dialog_mireille');
  assert.equal(empty.visitCount, 0);

  const payload = emptyOrbitPresenceMemoryPayload();
  record(payload, 'npc_cpt_mireille', { writeId: 'v1' });
  const mem = getCaptainPresenceMemoryFromPayload(payload, 'npc_cpt_mireille');
  const revisited = resolveOrbitCommSceneVariant('npc_dialog_mireille', mem, hasScene, 'arcadia_prime');
  assert.equal(revisited.sceneId, 'npc_dialog_mireille__revisit');

  const noExtra = resolveOrbitCommSceneVariant('npc_dialog_kresh', mem, hasScene);
  assert.equal(noExtra.sceneId, 'npc_dialog_kresh');
});

test('기함·빈 id 기록 no-op', () => {
  const payload = emptyOrbitPresenceMemoryPayload();
  assert.equal(
    recordOrbitCommOnPayload(payload, {
      captainId: '',
      planetId: 'arcadia_prime',
      outcome: 'accept',
      sceneId: 'x',
      atMs: 1,
      writeId: 'z',
    }),
    false,
  );
  assert.equal(payload.captains.length, 0);
});

test('normalize 후 빈 payload · 캡 유지', () => {
  const parsed = normalizeOrbitPresenceMemoryPayload(null);
  assert.equal(parsed.captains.length, 0);
  assert.equal(parsed.visits.length, 0);
  assert.equal(parsed.lastOrbitCommWriteId, '');
});

test('방문 25번째 다른 행성 → 가장 오래된 visitedAtMs 축출. 축출된 행성 digest 빈 배열', () => {
  const payload = emptyOrbitPresenceMemoryPayload();
  for (let i = 0; i < ORBIT_PRESENCE_VISITS_MAX; i += 1) {
    recordPlanetVisitSnapshotOnPayload(payload, {
      planetId: `p_${i}`,
      visitedAtMs: 100 + i,
      holdSig: 'a',
      captainIds: [],
      boardHeadId: 'h',
    });
  }
  assert.equal(payload.visits.length, ORBIT_PRESENCE_VISITS_MAX);
  recordPlanetVisitSnapshotOnPayload(payload, {
    planetId: 'p_new',
    visitedAtMs: 9_000,
    holdSig: 'b',
    captainIds: [],
    boardHeadId: 'n',
  });
  assert.equal(payload.visits.length, ORBIT_PRESENCE_VISITS_MAX);
  assert.equal(getPlanetVisitSnapshotFromPayload(payload, 'p_0'), undefined);
  const evictedPrev = undefined;
  const digest = computeWorldChangeDigest(
    evictedPrev,
    { planetId: 'p_0', holdSig: 'z', captainIds: [], boardHeadId: 'x', boardHeadTag: 'ops' },
    new Set(),
  );
  assert.deepEqual(digest, []);
});

test('동일 통신 W1 후 W2 → commCount +1만 (writeId idempotent)', () => {
  const payload = emptyOrbitPresenceMemoryPayload();
  const writeId = 'same-session';
  assert.equal(record(payload, 'npc_cpt_orin', { writeId, atMs: 5 }), true);
  assert.equal(record(payload, 'npc_cpt_orin', { writeId, atMs: 6 }), false);
  assert.equal(getCaptainPresenceMemoryFromPayload(payload, 'npc_cpt_orin')?.commCount, 1);
});

test('lastPlanetId≠now 이고 __revisit_from 없음 → __revisit(있으면) 또는 base', () => {
  const payload = emptyOrbitPresenceMemoryPayload();
  record(payload, 'npc_cpt_sela', { planetId: 'arcadia_prime', writeId: 's1' });
  const mem = getCaptainPresenceMemoryFromPayload(payload, 'npc_cpt_sela');
  const onlyRevisit = new Set(['npc_dialog_sela', 'npc_dialog_sela__revisit']);
  const variant = resolveOrbitCommSceneVariant(
    'npc_dialog_sela',
    mem,
    (id) => onlyRevisit.has(id),
    'vega_base',
  );
  assert.equal(variant.sceneId, 'npc_dialog_sela__revisit');

  const withFrom = new Set(['npc_dialog_sela', 'npc_dialog_sela__revisit', 'npc_dialog_sela__revisit_from']);
  const from = resolveOrbitCommSceneVariant(
    'npc_dialog_sela',
    mem,
    (id) => withFrom.has(id),
    'vega_base',
  );
  assert.equal(from.sceneId, 'npc_dialog_sela__revisit_from');
});

test('재조우 팝업 키: commCount=0 connected · 같은 행성 revisit · 다른 행성 revisit_from', () => {
  assert.equal(resolveOrbitCommConnectedBodyKind(0, 'arcadia_prime', 'arcadia_prime'), 'connected');
  assert.equal(resolveOrbitCommConnectedBodyKind(1, 'arcadia_prime', 'arcadia_prime'), 'revisit');
  assert.equal(resolveOrbitCommConnectedBodyKind(1, 'arcadia_prime', 'vega_base'), 'revisit_from');
});

test('holdSig parse keeps occupier and deed', () => {
  const sig = buildPlanetHoldSig({
    occupierClanId: 'ai_blue',
    deedOwnerClanId: 'player_solo',
    kind: 'clan_hold',
    neutralizedAt: 12,
  });
  const parsed = parsePlanetHoldSig(sig);
  assert.equal(parsed.occupierClanId, 'ai_blue');
  assert.equal(parsed.deedOwnerClanId, 'player_solo');
  assert.equal(parsed.kind, 'clan_hold');
  assert.equal(parsed.neutralizedAt, 12);
});

test('holdSig includes deed owner', () => {
  const a = buildPlanetHoldSig({ occupierClanId: 'ai_blue', kind: 'clan_hold' });
  const b = buildPlanetHoldSig({
    occupierClanId: 'ai_blue',
    deedOwnerClanId: 'player_solo',
    kind: 'clan_hold',
  });
  assert.notEqual(a, b);
});

test('개인미션 쿨다운 필드는 hydrate 후에도 유지', () => {
  const payload = emptyOrbitPresenceMemoryPayload();
  assert.equal(
    patchCaptainPersonalMemoryOnPayload(payload, 'npc_cpt_mireille', {
      lastPersonalOfferDayKey: '2026-09-18',
      declineUntilDayKey: '2026-09-19',
      personalThanksPending: true,
    }, 5_000),
    true,
  );
  const raw = JSON.parse(JSON.stringify(payload));
  const normalized = normalizeOrbitPresenceMemoryPayload(raw);
  const mem = getCaptainPresenceMemoryFromPayload(normalized, 'npc_cpt_mireille');
  assert.equal(mem?.lastPersonalOfferDayKey, '2026-09-18');
  assert.equal(mem?.declineUntilDayKey, '2026-09-19');
  assert.equal(mem?.personalThanksPending, true);
});

test('hydrate merge: 메모리 기록이 디스크 기존 함장을 덮지 않음', () => {
  const disk = emptyOrbitPresenceMemoryPayload();
  record(disk, 'npc_cpt_old', { writeId: 'disk', atMs: 1 });
  const memory = emptyOrbitPresenceMemoryPayload();
  record(memory, 'npc_cpt_new', { writeId: 'mem', atMs: 2 });
  const merged = mergeOrbitPresenceMemoryPayload(disk, memory);
  assert.ok(getCaptainPresenceMemoryFromPayload(merged, 'npc_cpt_old'));
  assert.ok(getCaptainPresenceMemoryFromPayload(merged, 'npc_cpt_new'));
  assert.equal(getCaptainPresenceMemoryFromPayload(merged, 'npc_cpt_new')?.commCount, 1);
});
