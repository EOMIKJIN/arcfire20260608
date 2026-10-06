import assert from 'node:assert/strict';
import { test } from 'node:test';
import { emptyPlayerObserveDigest, type PlayerObserveDigest } from '../../game/playerObserve/playerObserveSink';
import {
  STELLA_OBSERVE_DETECTORS,
  detectStellaSituations,
  renderStellaObserveLine,
  type StellaObserveHit,
  type StellaObserveInput,
  type StellaObserveSituationRow,
} from './stellaObserveSituations';
import {
  decideStellaObserve,
  emptyStellaObserveGateState,
  nextOriginInboundWindowMs,
  noteStellaObserveAccepted,
  noteStellaObserveIgnored,
  noteStellaObserveShown,
  stellaLifeAskHit,
  stellaYieldsToOrigin,
  type StellaObserveContext,
  type StellaObserveRecent,
} from './stellaObserveGate';
import { getStellaObserveGatePolicy, listStellaObserveSituations } from './stellaObserveTableIndex';

const ROWS = listStellaObserveSituations();
const POLICY = getStellaObserveGatePolicy();

function row(id: string): StellaObserveSituationRow {
  const r = ROWS.find((x) => x.id === id);
  assert.ok(r, `표에 ${id} 없음`);
  return r;
}

function input(patch: Partial<StellaObserveInput> = {}, dg: Partial<PlayerObserveDigest> = {}): StellaObserveInput {
  return {
    digest: { ...emptyPlayerObserveDigest(), day: 20000, ...dg },
    hullPct: 100,
    sessionStart: false,
    sessionGapHours: 0,
    sessionMinutes: 10,
    localHour: 15,
    level: 3,
    objectiveStallCount: 0,
    objectiveStallMinutes: 0,
    adviceIgnoredThenDestroyed: false,
    adviceFollowedThenWon: false,
    announcedFirsts: 0,
    lastLevelMark: 0,
    ...patch,
  };
}

function hits(i: StellaObserveInput): string[] {
  return detectStellaSituations(ROWS, i, { includeDisabled: true }).map((h) => h.row.id);
}

test('표 — 13행 · 감지기 이름 전부 유효 · 전 행 enabled=0 (잠금 1·4) · priority 정렬', () => {
  assert.equal(ROWS.length, 13);
  for (const r of ROWS) {
    assert.ok(STELLA_OBSERVE_DETECTORS.includes(r.detector), r.id);
    assert.equal(r.enabled, false, `${r.id} 는 O4 합격 전 0`);
  }
  for (let i = 1; i < ROWS.length; i += 1) assert.ok(ROWS[i - 1]!.priority <= ROWS[i]!.priority);
  assert.deepEqual(detectStellaSituations(ROWS, input({}, { dstr: 3 })), [], '앱 경로는 꺼진 행을 안 본다');
});

test('표 문장 — 적·전황·수치·목표 이름 금지 (잠금 5)', () => {
  for (const r of ROWS) {
    for (const line of [r.lineKo, r.lineEn]) {
      assert.doesNotMatch(line, /\d/, `${r.id} 숫자`);
      assert.doesNotMatch(line, /적|함대|크림슨|근원체|승률|크레딧|enemy|fleet|crimson|credit/i, `${r.id} 적·전황`);
    }
  }
  assert.doesNotMatch(row('sit_risky_launch').lineKo, /소멸|잃|해제/, '잠금 1 — 아이템 소멸 문장 금지');
});

test('rough_day — 오늘 파괴 2 이상. 연패만으로는 「실려 왔어」를 만들지 않음', () => {
  assert.ok(hits(input({}, { dstr: 2 })).includes('sit_rough_day'));
  assert.ok(!hits(input({}, { loss: 9, dstr: 0 })).includes('sit_rough_day'));
  assert.ok(!hits(input({}, { dstr: 1, loss: 4 })).includes('sit_rough_day'));
});

test('risky_launch — 내구도 30 이하 · 모르면 침묵', () => {
  assert.ok(hits(input({ hullPct: 30 })).includes('sit_risky_launch'));
  assert.ok(!hits(input({ hullPct: 31 })).includes('sit_risky_launch'));
  assert.ok(!hits(input({ hullPct: null })).includes('sit_risky_launch'));
});

test('advice_* — O6 전에는 입력이 false 라 침묵', () => {
  assert.ok(!hits(input()).includes('sit_advice_ignored_hurt'));
  assert.ok(hits(input({ adviceIgnoredThenDestroyed: true })).includes('sit_advice_ignored_hurt'));
  assert.ok(hits(input({ adviceFollowedThenWon: true })).includes('sit_advice_followed_ok'));
});

test('welcome_back — 세션 시작에서만 · 36시간 이상', () => {
  assert.ok(hits(input({ sessionStart: true, sessionGapHours: 50 })).includes('sit_welcome_back'));
  assert.ok(!hits(input({ sessionStart: false, sessionGapHours: 50 })).includes('sit_welcome_back'));
  assert.ok(!hits(input({ sessionStart: true, sessionGapHours: 30 })).includes('sit_welcome_back'));
});

test('first_* — 새 비트만 · 이미 말한 비트는 침묵', () => {
  assert.ok(hits(input({}, { firsts: 1 })).includes('sit_first_ship'));
  assert.ok(!hits(input({ announcedFirsts: 1 }, { firsts: 1 })).includes('sit_first_ship'));
  assert.deepEqual(
    hits(input({ announcedFirsts: 1 }, { firsts: 1 | 2 | 4 })).filter((id) => id.startsWith('sit_first_')),
    ['sit_first_annex', 'sit_first_develop'],
  );
});

test('level_mark — 오늘 레벨업이 관찰됐고 새 5배수일 때만', () => {
  assert.ok(hits(input({ level: 10, lastLevelMark: 1 }, { c: { level: 1 } })).includes('sit_level_mark'));
  assert.ok(!hits(input({ level: 10, lastLevelMark: 2 }, { c: { level: 1 } })).includes('sit_level_mark'));
  assert.ok(!hits(input({ level: 12, lastLevelMark: 0 })).includes('sit_level_mark'), '접속만 했으면 지어내지 않음');
});

test('quest_stall · grind_loop · long_session · trade_run 경계', () => {
  assert.ok(hits(input({ objectiveStallCount: 6, objectiveStallMinutes: 40 })).includes('sit_quest_stall'));
  assert.ok(!hits(input({ objectiveStallCount: 6, objectiveStallMinutes: 39 })).includes('sit_quest_stall'));
  assert.ok(hits(input({ sessionMinutes: 60 }, { run: 8 })).includes('sit_grind_loop'));
  assert.ok(!hits(input({ sessionMinutes: 59 }, { run: 8 })).includes('sit_grind_loop'));
  assert.ok(hits(input({ sessionMinutes: 120 })).includes('sit_long_session'));
  assert.ok(hits(input({ sessionMinutes: 60, localHour: 3 })).includes('sit_long_session'), '새벽 + 절반 이상');
  assert.ok(!hits(input({ sessionMinutes: 5, localHour: 3 })).includes('sit_long_session'), '새벽에 막 접속');
  assert.ok(hits(input({}, { c: { trade: 10 } })).includes('sit_trade_run'));
  assert.ok(!hits(input({}, { c: { trade: 9 } })).includes('sit_trade_run'));
});

test('문장 — 5 이하만 말로, 그 밖은 수 없이', () => {
  const rough = (n: number): StellaObserveHit => ({ row: row('sit_rough_day'), vars: { nth: n, d: 0, intensity: 1 } });
  assert.match(renderStellaObserveLine(rough(2), 'ko'), /오늘 두 번째로 실려/);
  assert.match(renderStellaObserveLine(rough(9), 'ko'), /오늘 또 실려/);
  assert.match(renderStellaObserveLine(rough(3), 'en'), /a third time/);
  const back = (d: number): StellaObserveHit => ({ row: row('sit_welcome_back'), vars: { nth: 0, d, intensity: 1 } });
  assert.match(renderStellaObserveLine(back(2), 'ko'), /이틀 만이네/);
  assert.match(renderStellaObserveLine(back(12), 'ko'), /며칠 만이네/);
  for (const r of ROWS) {
    const line = renderStellaObserveLine({ row: r, vars: { nth: 2, d: 2, intensity: 1 } }, 'ko');
    assert.doesNotMatch(line, /[{}]/, `${r.id} 자리표시자 남음`);
  }
});

test('심한 정도 — 감지기가 intensity 를 낸다 (1 이상)', () => {
  const two = detectStellaSituations(ROWS, input({}, { dstr: 2 }), { includeDisabled: true }).find((h) => h.row.id === 'sit_rough_day');
  const four = detectStellaSituations(ROWS, input({}, { dstr: 4 }), { includeDisabled: true }).find((h) => h.row.id === 'sit_rough_day');
  assert.ok(two && four);
  assert.equal(two.vars.intensity, 1);
  assert.equal(four.vars.intensity, 2);
  const hull = detectStellaSituations(ROWS, input({ hullPct: 15 }), { includeDisabled: true }).find((h) => h.row.id === 'sit_risky_launch');
  assert.ok(hull && hull.vars.intensity > 1, '내구도가 낮을수록 더 심하다');
});

// ── 게이트 — 말하고 싶은 마음 × 지금이 말할 때인가 ──

const T0 = Date.UTC(2026, 9, 6, 6);
const MIN = 60_000;
const HOUR = 3_600_000;

function ctx(patch: Partial<StellaObserveContext> = {}): StellaObserveContext {
  return {
    nowMs: T0,
    day: 20000,
    safeSlot: true,
    otherPopupThisEntry: false,
    originLastAtMs: 0,
    originPendingNow: false,
    lifeAskLastAtMs: 0,
    stellaOnDuty: false,
    casualFirstHigh: false,
    recent: [],
    ...patch,
  };
}

/** 최신순. [동사, 몇 분 전] */
function recent(...pairs: [string, number][]): StellaObserveRecent[] {
  return pairs.map(([verb, ago]) => ({ verb, at: T0 - ago * MIN }));
}

function hit(id: string, intensity = 1): StellaObserveHit {
  return { row: row(id), vars: { nth: 2, d: 2, intensity } };
}

function speak(d: ReturnType<typeof decideStellaObserve>) {
  assert.equal(d.kind, 'speak', JSON.stringify(d));
  return d as Extract<typeof d, { kind: 'speak' }>;
}

test('게이트 정책 — 표 값 (예산 없음 · 판단 문턱·타이밍)', () => {
  assert.deepEqual(
    [POLICY.speakThreshold, POLICY.askThreshold, POLICY.minGapMin, POLICY.failsafeMaxPerDay],
    [0.4, 0.7, 15, 6],
  );
  assert.deepEqual(
    [POLICY.fitFreshMin, POLICY.fitHalfLifeMin, POLICY.fitFloor, POLICY.busyWindowMin, POLICY.busyActions, POLICY.busyDamp],
    [10, 30, 0.3, 5, 6, 0.5],
  );
  assert.deepEqual(
    [POLICY.newsRestraintScale, POLICY.ignoreHalfLifeHours, POLICY.repeatWindowHours, POLICY.repeatDamp, POLICY.lifeCooldownHours],
    [0.5, 72, 72, 0.4, 24],
  );
  assert.equal(POLICY.motiveWeight.worry, 1);
  assert.ok(!('askPerDay' in POLICY), '하루 예산은 폐지');
});

test('기술 조정 — 말할 수 없는 순간 · 다른 팝업 · 근원체 간격 · 고장 방지 상한', () => {
  const s = emptyStellaObserveGateState();
  const h = [hit('sit_risky_launch')];
  assert.deepEqual(decideStellaObserve(h, s, ctx({ safeSlot: false }), POLICY), { kind: 'silent', reason: 'unsafe' });
  assert.deepEqual(decideStellaObserve(h, s, ctx({ otherPopupThisEntry: true }), POLICY), { kind: 'silent', reason: 'popup' });
  assert.deepEqual(decideStellaObserve(h, s, ctx({ originLastAtMs: T0 - 10 * MIN }), POLICY), { kind: 'silent', reason: 'gap' });
  speak(decideStellaObserve(h, s, ctx({ originLastAtMs: T0 - 16 * MIN }), POLICY));
  s.day = 20000;
  s.count = 6;
  assert.deepEqual(decideStellaObserve(h, s, ctx(), POLICY), { kind: 'silent', reason: 'failsafe' });
});

test('근원체 슬롯은 취소 없이 다음 창으로 · 같은 순간이면 걱정·귀환 인사만 먼저', () => {
  const s = emptyStellaObserveGateState();
  const d = speak(decideStellaObserve([hit('sit_risky_launch')], s, ctx(), POLICY));
  noteStellaObserveShown(s, d, { nowMs: T0, day: 20000, level: 3 });
  assert.equal(nextOriginInboundWindowMs(s, T0 + MIN, POLICY), T0 + 15 * MIN);
  assert.equal(nextOriginInboundWindowMs(s, T0 + 20 * MIN, POLICY), T0 + 20 * MIN);
  assert.equal(stellaYieldsToOrigin(row('sit_rough_day')), false);
  assert.equal(stellaYieldsToOrigin(row('sit_welcome_back')), false);
  assert.equal(stellaYieldsToOrigin(row('sit_long_session')), true);
  const y = decideStellaObserve([hit('sit_long_session')], emptyStellaObserveGateState(), ctx({ originPendingNow: true }), POLICY);
  assert.deepEqual(y, { kind: 'silent', reason: 'yield_origin' });
});

test('지금이 말할 때 — 방금 실려 왔으면 바로 묻고, 한 시간 지난 일은 꺼내지 않는다', () => {
  const s = emptyStellaObserveGateState();
  const now = speak(decideStellaObserve([hit('sit_rough_day')], s, ctx({ recent: recent(['land', 1], ['destroy', 3]) }), POLICY));
  assert.equal(now.channel, 'ask');
  assert.equal(now.fit, 1);
  const stale = decideStellaObserve([hit('sit_rough_day')], s, ctx({ recent: recent(['trade', 2], ['destroy', 60]) }), POLICY);
  assert.deepEqual(stale, { kind: 'silent', reason: 'not_now' }, '마음은 있지만 때가 지났다');
  const unknown = decideStellaObserve([hit('sit_rough_day')], s, ctx(), POLICY);
  assert.deepEqual(unknown, { kind: 'silent', reason: 'not_now' }, '근거 행동이 기록에 없으면 지금 일이 아니다');
});

test('지금이 말할 때 — 지금 상태 자체가 이유인 상황은 늘 때가 맞다', () => {
  const s = emptyStellaObserveGateState();
  assert.equal(speak(decideStellaObserve([hit('sit_risky_launch')], s, ctx(), POLICY)).fit, 1);
  assert.equal(speak(decideStellaObserve([hit('sit_long_session')], s, ctx(), POLICY)).fit, 1);
});

test('한창 바쁘면 흐름을 끊지 않는다 — 걱정만 예외', () => {
  const s = emptyStellaObserveGateState();
  const busy = recent(['trade', 0.5], ['trade', 1], ['trade', 1.5], ['ship', 2], ['trade', 2.5], ['trade', 3]);
  const calm = recent(['ship', 2]);
  speak(decideStellaObserve([hit('sit_first_ship')], s, ctx({ recent: calm }), POLICY));
  assert.deepEqual(decideStellaObserve([hit('sit_first_ship')], s, ctx({ recent: busy }), POLICY), { kind: 'silent', reason: 'not_now' });
  const worry = speak(decideStellaObserve([hit('sit_rough_day')], s, ctx({ recent: [{ verb: 'destroy', at: T0 - MIN }, ...busy] }), POLICY));
  assert.equal(worry.hit.row.id, 'sit_rough_day');
});

test('여러 상황이면 지금 가장 말하고 싶은 하나 — 때가 지난 걱정보다 방금의 기쁨', () => {
  const s = emptyStellaObserveGateState();
  const d = speak(
    decideStellaObserve([hit('sit_rough_day'), hit('sit_first_ship')], s, ctx({ recent: recent(['ship', 1], ['destroy', 120]) }), POLICY),
  );
  assert.equal(d.hit.row.id, 'sit_first_ship');
});

test('표의 모든 행은 감지 문턱에서 때가 맞으면 말할 수 있다 (죽은 행 없음)', () => {
  for (const r of ROWS) {
    const recentAnchor = r.anchorVerb ? recent([r.anchorVerb, 1]) : [];
    const d = decideStellaObserve([hit(r.id, 1)], emptyStellaObserveGateState(), ctx({ recent: recentAnchor }), POLICY);
    assert.equal(d.kind, 'speak', `${r.id} ${JSON.stringify(d)}`);
  }
});

test('심할수록 더 말하고 싶다 · ask 는 무게가 될 때만', () => {
  const s = emptyStellaObserveGateState();
  speak(decideStellaObserve([hit('sit_trade_run', 1)], s, ctx({ recent: recent(['trade', 1]) }), POLICY));
  const q = ctx({ lifeAskLastAtMs: T0 - 60 * MIN });
  assert.deepEqual(decideStellaObserve([hit('sit_quest_stall', 1)], s, q, POLICY), { kind: 'silent', reason: 'restraint' }, '한 시간 전에 물었으면 가벼운 막힘은 참음');
  assert.equal(speak(decideStellaObserve([hit('sit_quest_stall', 2)], s, q, POLICY)).channel, 'message', '많이 막히면 말하되, 물을 만큼은 아님');
  assert.equal(speak(decideStellaObserve([hit('sit_quest_stall', 2)], s, ctx(), POLICY)).channel, 'ask');
});

test('막힘·장시간·함선 상태는 지금 상태가 곧 이유 — 근거 행동 없음', () => {
  for (const id of ['sit_quest_stall', 'sit_long_session', 'sit_risky_launch']) assert.equal(row(id).anchorVerb, '', id);
});

test('방금 말했으면 자제 — 일상 질문도 자기가 한 말로 친다 · 시간이 지나면 풀린다', () => {
  const s = emptyStellaObserveGateState();
  const d = speak(decideStellaObserve([hit('sit_risky_launch')], s, ctx(), POLICY));
  noteStellaObserveShown(s, d, { nowMs: T0, day: 20000, level: 3 });
  assert.deepEqual(decideStellaObserve([hit('sit_long_session')], s, ctx({ nowMs: T0 + 16 * MIN }), POLICY), { kind: 'silent', reason: 'restraint' });
  speak(decideStellaObserve([hit('sit_long_session')], s, ctx({ nowMs: T0 + 3 * HOUR }), POLICY));
  const fresh = emptyStellaObserveGateState();
  assert.deepEqual(
    decideStellaObserve([hit('sit_long_session')], fresh, ctx({ lifeAskLastAtMs: T0 - 5 * MIN }), POLICY),
    { kind: 'silent', reason: 'restraint' },
  );
});

test('방금 말한 뒤에 새로 생긴 일은 새 소식 — 일상 질문 직후 실려 와도 걱정은 말한다', () => {
  const s = emptyStellaObserveGateState();
  const c = ctx({ lifeAskLastAtMs: T0 - 10 * MIN, recent: recent(['land', 1], ['destroy', 3]) });
  speak(decideStellaObserve([hit('sit_rough_day')], s, c, POLICY));
  const old = ctx({ lifeAskLastAtMs: T0 - 10 * MIN, recent: recent(['land', 1], ['destroy', 12]) });
  assert.equal(decideStellaObserve([hit('sit_rough_day')], s, old, POLICY).kind, 'silent', '말하기 전에 있던 일은 그때 말했어야 — 자제 그대로');
  assert.deepEqual(
    decideStellaObserve([hit('sit_first_ship')], s, ctx({ lifeAskLastAtMs: T0 - 10 * MIN, recent: recent(['ship', 1]) }), POLICY),
    { kind: 'silent', reason: 'restraint' },
    '작은 소식은 새것이어도 조금 기다린다',
  );
});

test('한 말은 기억 — 같은 정도면 다시 안 꺼내고, 더 나빠지면 다시 말한다', () => {
  const s = emptyStellaObserveGateState();
  const c0 = ctx({ recent: recent(['destroy', 1]) });
  const d = speak(decideStellaObserve([hit('sit_rough_day', 1)], s, c0, POLICY));
  noteStellaObserveShown(s, d, { nowMs: T0, day: 20000, level: 3 });
  const later = (min: number) => ctx({ nowMs: T0 + min * MIN, recent: [{ verb: 'destroy', at: T0 + (min - 1) * MIN }] });
  assert.deepEqual(decideStellaObserve([hit('sit_rough_day', 1)], s, later(240), POLICY), { kind: 'silent', reason: 'said' });
  speak(decideStellaObserve([hit('sit_rough_day', 2)], s, later(240), POLICY));
});

test('대표님 반응 — 무시하면 그 얘기와 말 거는 것 자체를 덜 하고, 받아 주면 풀린다', () => {
  const s = emptyStellaObserveGateState();
  speak(decideStellaObserve([hit('sit_long_session')], s, ctx(), POLICY));
  noteStellaObserveIgnored(s, 'sit_long_session', T0, POLICY);
  assert.deepEqual(decideStellaObserve([hit('sit_long_session')], s, ctx(), POLICY), { kind: 'silent', reason: 'restraint' });
  assert.equal(s.globalIgn, 1);
  noteStellaObserveAccepted(s, 'sit_long_session');
  speak(decideStellaObserve([hit('sit_long_session')], s, ctx(), POLICY));
});

test('무시당한 기억은 시간이 지나면 풀린다 — 영원히 입을 닫지 않는다', () => {
  const s = emptyStellaObserveGateState();
  for (let i = 0; i < 4; i += 1) noteStellaObserveIgnored(s, 'sit_long_session', T0, POLICY);
  assert.deepEqual(decideStellaObserve([hit('sit_long_session')], s, ctx(), POLICY), { kind: 'silent', reason: 'restraint' });
  const weekLater = T0 + 7 * 24 * HOUR;
  speak(decideStellaObserve([hit('sit_long_session')], s, ctx({ nowMs: weekLater, day: 20007 }), POLICY));
  noteStellaObserveIgnored(s, 'sit_long_session', weekLater, POLICY);
  assert.ok(s.ign.sit_long_session! < 2, '다시 무시당하면 풀린 값에 1을 더한다');
});

test('자주 한 말은 덜 하고 싶다 — 사흘 연달아 같은 걱정을 같은 정도로 꺼내지 않는다', () => {
  const s = emptyStellaObserveGateState();
  const at = (dayN: number) => T0 + dayN * 24 * HOUR;
  const c = (dayN: number) => ctx({ nowMs: at(dayN), day: 20000 + dayN, recent: [{ verb: 'destroy', at: at(dayN) - MIN }] });
  const shown = (dayN: number, intensity: number) => {
    const d = speak(decideStellaObserve([hit('sit_rough_day', intensity)], s, c(dayN), POLICY));
    noteStellaObserveShown(s, d, { nowMs: at(dayN), day: 20000 + dayN, level: 3 });
  };
  shown(0, 1);
  assert.deepEqual(decideStellaObserve([hit('sit_rough_day', 1)], s, c(1), POLICY), { kind: 'silent', reason: 'restraint' }, '어제 같은 정도로 말했으면 오늘은 참는다');
  shown(1, 2);
  assert.deepEqual(decideStellaObserve([hit('sit_rough_day', 2)], s, c(2), POLICY), { kind: 'silent', reason: 'restraint' }, '사흘째는 더 심해도 참는다');
  speak(decideStellaObserve([hit('sit_rough_day', 1)], s, c(6), POLICY));
});

test('당직 중이면 off_only 를 참고 걱정은 말한다 · casualFirst 높으면 걱정 외를 조금 덜', () => {
  const s = emptyStellaObserveGateState();
  assert.deepEqual(decideStellaObserve([hit('sit_long_session')], s, ctx({ stellaOnDuty: true }), POLICY), { kind: 'silent', reason: 'restraint' });
  speak(decideStellaObserve([hit('sit_risky_launch')], s, ctx({ stellaOnDuty: true }), POLICY));
  speak(decideStellaObserve([hit('sit_long_session')], s, ctx({ casualFirstHigh: true }), POLICY));
});

test('첫 비트·레벨 표식은 말한 뒤 다시 감지되지 않음', () => {
  const s = emptyStellaObserveGateState();
  const ship = speak(decideStellaObserve([hit('sit_first_ship')], s, ctx({ recent: recent(['ship', 1]) }), POLICY));
  noteStellaObserveShown(s, ship, { nowMs: T0, day: 20000, level: 10 });
  assert.equal(s.announcedFirsts & 1, 1);
  const lv = speak(decideStellaObserve([hit('sit_level_mark')], s, ctx({ nowMs: T0 + 4 * HOUR, recent: [{ verb: 'level', at: T0 + 4 * HOUR - MIN }] }), POLICY));
  noteStellaObserveShown(s, lv, { nowMs: T0 + 4 * HOUR, day: 20000, level: 10 });
  assert.equal(s.lastLevelMark, 2);
  const i = input({ level: 10, lastLevelMark: s.lastLevelMark, announcedFirsts: s.announcedFirsts }, { firsts: 1, c: { level: 1 } });
  assert.deepEqual(hits(i).filter((x) => x === 'sit_first_ship' || x === 'sit_level_mark'), []);
});

test('일상 질문도 같은 판단 — 하루 1회 규칙 없음, 물은 뒤엔 며칠 쉬고 다시 묻는다', () => {
  const s = emptyStellaObserveGateState();
  const life = stellaLifeAskHit('check_in', 'care', POLICY);
  const at = (h: number) => T0 + h * HOUR;
  const c = (h: number) => ctx({ nowMs: at(h), day: 20000 + Math.floor(h / 24) });
  const d0 = speak(decideStellaObserve([life], s, c(0), POLICY));
  assert.equal(d0.channel, 'ask');
  noteStellaObserveShown(s, d0, { nowMs: at(0), day: 20000, level: 3 });
  assert.deepEqual(decideStellaObserve([life], s, c(5), POLICY), { kind: 'silent', reason: 'said' }, '같은 날 다시 묻지 않음');
  assert.deepEqual(decideStellaObserve([life], s, c(26), POLICY), { kind: 'silent', reason: 'restraint' }, '다음 날도 굳이 또 묻지 않음');
  speak(decideStellaObserve([life], s, c(80), POLICY));
});

test('일상 질문과 걱정이 겹치면 더 말하고 싶은 쪽 하나만', () => {
  const life = stellaLifeAskHit('check_in', 'care', POLICY);
  const d = speak(decideStellaObserve([life, hit('sit_rough_day', 2)], emptyStellaObserveGateState(), ctx({ recent: recent(['destroy', 1]) }), POLICY));
  assert.equal(d.hit.row.id, 'sit_rough_day');
});
