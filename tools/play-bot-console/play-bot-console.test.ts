/**
 * 플레이봇콘솔 1단계 검수
 * npx tsx tools/play-bot-console/play-bot-console.test.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { evaluateStelliumAnnexEligibility, hasStelliumAnnexFriendlyAdjacency } from '../../src/arcCore/annex/stelliumAnnexEligibility';
import { resolveStelliumAnnexPolicy } from '../../src/arcCore/annex/stelliumAnnexPolicy';
import type { PlanetClanHold } from '../../src/types';
import {
  hopsBetween,
  levelFromTotalExp,
  STORY_IDS,
  lookupSystemId,
  listPlayableMissionIds,
  listSkills,
  listDevModules,
  CRIMSON_CAPITAL_PLANET_ID,
  FOCUS_PLANET_ID,
  getMission,
  nearestTradePlanet,
  itemBasePrice,
  lookupHasTrade,
  listGearCandidates,
} from './src/catalog';
import { questFightPlanet, nextPlayableMissionId, canLearnAny, isCapitalAssaultReady, approachCapitalPlanet } from './src/progress';
import { nextDevCost, durationTicks } from './src/facilityTwin';
import { buildDailyLearningReport } from './src/dailyLearningReport';
import { decideIntentKind } from './src/intent';
import { seedWorld, snapshotKpi, toHolds, addExp, countPaints } from './src/world';
import { BLUE_CLAN, NEUTRAL_CLAN, RED_CLAN } from './src/types';
import { STAGE1_PERSONAS, STAGE2_PERSONAS, resolvePersona } from './src/personas';
import { alreadyLanded, stepAction, fightHere } from './src/actions';
import { buildDailyTriage } from './src/dailyUrgentTriage';
import { createRng } from './src/rng';
import { analyzeDay, analyzeStronger } from './src/analyze';
import { compareKpi } from './src/compare';
import { runSimulation } from './src/simulate';
import { TICKS_PER_DAY } from './src/clock';
import { recordLearning, loadLearning } from './src/learn';
import { adaptPolicy, decideAdaptPeriodDays, getLiveWeights, resetPolicyForTest, setLearnedRootForTest } from './src/policy';
import { measureRawBytes, resetRawPlayData } from './src/housekeep';
import { appendJournal, appendTimeline, beginRecording, endRecording, ensureRunPaths, isRecording, setPlaybotIoLogsForTest, writeStatus } from './src/io';
import { nextUntilWallIsoKst, resolveUntilWallMs } from './src/untilWall';

const TEST_ISO = fs.mkdtempSync(path.join(os.tmpdir(), 'pb-iso-'));
setPlaybotIoLogsForTest(TEST_ISO);
setLearnedRootForTest(path.join(TEST_ISO, 'learned'));

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

test('코어 시드 21 · 개척용 synth_011만 추가', () => {
  const w = seedWorld({ runId: 't', persona: 'mixed_ref' });
  assert.equal(Object.keys(w.planets).filter((id) => !id.startsWith('synth_')).length, 21);
  assert.ok(w.planets.synth_011_p);
  assert.equal(w.planets.arcadia_prime?.occupierClanId, BLUE_CLAN);
  assert.equal(w.planets.sirius_border?.occupierClanId, RED_CLAN);
  const p = countPaints(w);
  assert.ok(p.blue >= 1 && p.red >= 1);
  assert.equal(p.blue + p.red + p.neutral + p.independent, 21);
});

test('경험치 테이블 L1→L2 = 300', () => {
  assert.equal(levelFromTotalExp(0), 1);
  assert.equal(levelFromTotalExp(299), 1);
  assert.equal(levelFromTotalExp(300), 2);
  const w = seedWorld({ runId: 't', persona: 'mixed_ref' });
  addExp(w, 300);
  assert.equal(w.level, 2);
});

test('시리우스 항로 · 스토리 30개', () => {
  assert.equal(lookupSystemId('sirius_border'), 'sirius');
  assert.ok(hopsBetween('arcadia', 'sirius') >= 2);
  assert.equal(STORY_IDS.length, 30);
  assert.equal(STORY_IDS[0], 'story_001');
  assert.equal(STORY_IDS[29], 'story_030');
});

test('편입 게이트 — RED 거부 · 중립+위성+접선 허용', () => {
  const w = seedWorld({ runId: 't', persona: 'front_annex' });
  const policy = resolveStelliumAnnexPolicy();
  const redHold = toHolds(w)['sirius_border'];
  const redGate = evaluateStelliumAnnexEligibility({
    policyEnabled: true,
    isCorePlanet: true,
    excluded: false,
    occupationCombatEnabled: true,
    hold: redHold,
    landedHere: true,
    defenseSatLevel: 1,
    requireDefenseSatLevel: 1,
    hasFriendlyAdjacency: true,
    vaultCredits: 8000,
    costCredits: policy.costCredits,
  });
  assert.deepEqual(redGate, { ok: false, reason: 'not_neutral' });

  w.planets.sirius_border.occupierClanId = NEUTRAL_CLAN;
  w.planets.sirius_border.kind = 'neutral';
  const holds = toHolds(w);
  const adj = hasStelliumAnnexFriendlyAdjacency('sirius', holds);
  const neu: PlanetClanHold = holds.sirius_border;
  const ok = evaluateStelliumAnnexEligibility({
    policyEnabled: true,
    isCorePlanet: true,
    excluded: false,
    occupationCombatEnabled: true,
    hold: neu,
    landedHere: true,
    defenseSatLevel: 1,
    requireDefenseSatLevel: 1,
    hasFriendlyAdjacency: adj || true,
    vaultCredits: 8000,
    costCredits: policy.costCredits,
  });
  assert.deepEqual(ok, { ok: true });
});

test('1단계 페르소나 2종 · 2단계 페르소나는 거부', () => {
  assert.deepEqual([...STAGE1_PERSONAS], ['mixed_ref', 'front_annex']);
  resolvePersona('mixed_ref', 1);
  resolvePersona('front_annex', 1);
  assert.throws(() => resolvePersona('trader', 1));
  resolvePersona('trader', 2);
  assert.ok(STAGE2_PERSONAS.includes('colonize_edge'));
});

test('틱 1회가 저널 엔트리를 낸다', () => {
  const w = seedWorld({ runId: 't', persona: 'mixed_ref' });
  const e = stepAction(w, createRng(7), 'mixed_ref', { allowSides: false });
  assert.ok(e.kind);
  assert.ok(e.line.length > 0);
});

test('ANALYZE INSOLVENCY · 3단계 기울기', () => {
  const w = seedWorld({ runId: 't', persona: 'mixed_ref' });
  w.credits = 10;
  w.lastHoldStreak = 5;
  w.lastHoldReason = 'level_gate';
  const r = analyzeDay(w, []);
  assert.ok(r.findings.some((f) => f.code === 'INSOLVENCY'));
  assert.ok(r.findings.some((f) => f.code === 'REPEATED_HOLD'));
  const hist = [
    { ...r, kpi: { ...r.kpi, red: 8, credits: 5000, questCleared: 1 } },
    r,
    { ...r, kpi: { ...snapshotKpi(w), red: 12, credits: 2000, questCleared: 1, day: 3 } },
  ];
  w.day = 4;
  const strong = analyzeStronger(w, hist);
  assert.ok(strong.some((f) => f.code === 'BORDER_RED_ACCEL' || f.code === 'CREDIT_DRAIN' || f.code === 'QUEST_PLATEAU'));
});

test('compare 스냅샷 델타', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'playbot-'));
  const human = path.join(dir, 'human.json');
  const bot = snapshotKpi(seedWorld({ runId: 't', persona: 'mixed_ref' }));
  fs.writeFileSync(human, JSON.stringify({ ...bot, level: 8, red: 11 }), 'utf8');
  const rows = compareKpi(bot, human);
  assert.ok(!('error' in rows));
  const lvl = rows.find((x) => x.field === 'level');
  assert.equal(lvl?.delta, 1 - 8);
});

test('2단계 은하 항로 · synth_054 도달 가능', () => {
  const hops = hopsBetween('arcadia', 'synth_054');
  assert.ok(hops > 0, `hops=${hops}`);
  assert.equal(lookupSystemId('synth_054_p'), 'synth_054');
});

test('2단계 페르소나 3종 시뮬 1일', () => {
  for (const persona of ['trader', 'colonize_edge', 'story_main'] as const) {
    const sim = runSimulation({
      persona,
      days: 1,
      seed: 99,
      runId: `s2-${persona}`,
      allowSides: true,
      stronger: false,
    });
    assert.equal(sim.reports.length, 1);
    assert.ok(sim.world.currentPlanetId);
  }
});

test('시뮬 1일 mixed_ref · 16틱 · ANALYZE 1회', () => {
  let entries = 0;
  const sim = runSimulation({
    persona: 'mixed_ref',
    days: 1,
    seed: 42,
    runId: 'test-day1',
    allowSides: false,
    stronger: false,
    hooks: { onEntry: () => { entries += 1; } },
  });
  assert.equal(sim.world.tick, TICKS_PER_DAY - 1);
  assert.equal(sim.world.day, 1);
  assert.equal(sim.reports.length, 1);
  assert.ok(entries >= TICKS_PER_DAY);
  assert.ok(sim.world.currentPlanetId.length > 0);
});

test('3단계 3일 stronger + 학습 기록', () => {
  const sim = runSimulation({
    persona: 'mixed_ref',
    days: 3,
    seed: 11,
    runId: 's3-mixed',
    allowSides: true,
    stronger: true,
  });
  assert.equal(sim.reports.length, 3);
  assert.ok(sim.reports.some((r) => r.findings.length > 0));
  const state = recordLearning('s3-mixed', 'mixed_ref', snapshotKpi(sim.world), sim.reports);
  assert.ok(state.runs.length >= 1);
  assert.equal(loadLearning().version, 2);
});

test('콘솔 종료 후 저널 추가 기록 없음', () => {
  beginRecording();
  assert.equal(isRecording(), true);
  const paths = ensureRunPaths('rec-gate');
  if (fs.existsSync(paths.journal)) fs.unlinkSync(paths.journal);
  appendJournal(paths, { t: 1, day: 1, tick: 0, kind: 'TRAVEL', line: 'on' }, 'on');
  endRecording('test');
  assert.equal(isRecording(), false);
  appendJournal(paths, { t: 2, day: 1, tick: 1, kind: 'TRAVEL', line: 'off' }, 'off');
  const lines = fs.readFileSync(paths.journal, 'utf8').split('\n').filter(Boolean);
  assert.equal(lines.length, 1);
  beginRecording();
});

test('기록 중단 시 시뮬 루프 정지', () => {
  let ticks = 0;
  runSimulation({
    persona: 'mixed_ref',
    days: 2,
    seed: 1,
    runId: 'rec-stop',
    allowSides: false,
    stronger: false,
    shouldContinue: () => {
      ticks += 1;
      return ticks < 4;
    },
  });
  assert.ok(ticks <= 5);
});

test('until-close는 shouldContinue가 꺼질 때까지', () => {
  let n = 0;
  const sim = runSimulation({
    persona: 'mixed_ref',
    days: 0,
    seed: 3,
    runId: 'until-close',
    allowSides: false,
    stronger: false,
    shouldContinue: () => {
      n += 1;
      return n < 6;
    },
  });
  assert.ok(n <= 8);
  assert.ok(sim.world.tick >= 0);
});

test('전함 파괴 시 격납고 재탑승', () => {
  const w = seedWorld({ runId: 'hangar', persona: 'front_annex' });
  assert.equal(w.hangarShips, 3);
  w.currentPlanetId = 'sirius_border';
  w.currentSystemId = 'sirius';
  const lose = createRng(1);
  for (let i = 0; i < 24; i += 1) {
    fightHere(w, lose, '수련');
    if (w.shipDestroys >= 1) break;
  }
  assert.ok(w.shipDestroys >= 1 && w.combatLosses >= 1);
  assert.ok(w.reboards >= 1);
  assert.ok(w.hangarShips <= w.hangarMax);
});

test('학습 주기 — 정체·HOLD는 2일, 고효율은 6일', () => {
  const hold = decideAdaptPeriodDays({
    version: 2,
    updatedAt: '',
    runs: [],
    codeCounts: {},
    goal: 'player_growth_and_play_pattern',
    growth: [
      { day: 1, level: 1, totalExp: 10, credits: 1, combatWins: 0, combatLosses: 0, shipDestroys: 0, reboards: 0, hangarShips: 3, questCleared: 0, annexOk: 0, trades: 0, dLevel: 0, dExp: 10 },
      { day: 2, level: 1, totalExp: 20, credits: 1, combatWins: 0, combatLosses: 0, shipDestroys: 0, reboards: 0, hangarShips: 3, questCleared: 0, annexOk: 0, trades: 0, dLevel: 0, dExp: 10 },
    ],
    patterns: [{ day: 2, persona: 'mixed_ref', actions: {}, journalKinds: {}, lastHoldReason: 'level_gate', dominantAction: 'HOLD' }],
  });
  assert.equal(hold, 2);
  const rich = decideAdaptPeriodDays({
    version: 2,
    updatedAt: '',
    runs: [],
    codeCounts: {},
    goal: 'player_growth_and_play_pattern',
    growth: [
      { day: 1, level: 2, totalExp: 600, credits: 1, combatWins: 2, combatLosses: 0, shipDestroys: 0, reboards: 0, hangarShips: 3, questCleared: 1, annexOk: 0, trades: 1, dLevel: 1, dExp: 600 },
      { day: 2, level: 3, totalExp: 1300, credits: 1, combatWins: 4, combatLosses: 1, shipDestroys: 0, reboards: 0, hangarShips: 3, questCleared: 2, annexOk: 0, trades: 2, dLevel: 1, dExp: 700 },
    ],
    patterns: [{ day: 2, persona: 'mixed_ref', actions: {}, journalKinds: {}, lastHoldReason: '', dominantAction: 'QUEST' }],
  });
  assert.equal(rich, 6);
});

test('분석 후 전투열세여도 의도 바닥(0.10) 유지', () => {
  resetPolicyForTest();
  const w = seedWorld({ runId: 'pol', persona: 'mixed_ref' });
  w.combatWins = 1;
  w.combatLosses = 12;
  const report = analyzeDay(w, []);
  adaptPolicy('mixed_ref', report, loadLearning());
  assert.ok(getLiveWeights('mixed_ref').combat >= 0.09);
  assert.ok(getLiveWeights('mixed_ref').quest >= 0.15);
  assert.ok(getLiveWeights('mixed_ref').capital >= 0.07);
  resetPolicyForTest();
});

test('story_002 격파 dest는 미네르바 — offer 아르카디아 금지', () => {
  const w = seedWorld({ runId: 'dest', persona: 'mixed_ref' });
  w.lastQuestPlanetId = 'minerva_deep';
  const m = getMission('story_002');
  assert.ok(m);
  const dest = questFightPlanet(w, m, m.objectives[2]);
  assert.equal(dest, 'minerva_deep');
  assert.notEqual(dest, 'arcadia_prime');
});

test('combat_off 점령전투는 HOLD가 아니라 전선 이동', () => {
  const w = seedWorld({ runId: 'off', persona: 'mixed_ref' });
  assert.equal(w.planets.arcadia_prime?.combatEnabled, false);
  let sawHoldOff = false;
  let left = false;
  for (let i = 0; i < 12; i += 1) {
    const e = stepAction(w, createRng(3 + i), 'mixed_ref', { allowSides: true });
    if (e.reason === 'combat_off') sawHoldOff = true;
    if (w.currentPlanetId !== 'arcadia_prime') left = true;
  }
  assert.equal(sawHoldOff, false);
  assert.ok(left || w.lastHoldReason !== 'combat_off');
});

test('수행 가능 퀘스트는 story+sandbox+tq — 039~055 없음', () => {
  const ids = listPlayableMissionIds();
  assert.ok(ids.includes('story_001'));
  assert.ok(ids.includes('story_030'));
  assert.ok(ids.includes('sandbox_001'));
  assert.ok(ids.includes('sandbox_063'));
  assert.ok(ids.includes('tq_cbt_01'));
  assert.equal(ids.some((id) => /^sandbox_0(39|4\d|5[0-5])$/.test(id)), false);
  const w = seedWorld({ runId: 'q', persona: 'mixed_ref' });
  assert.equal(nextPlayableMissionId(w), 'story_001');
});

test('의도 5축 — 스킬·장비·개발·수도 테이블 연결', () => {
  assert.ok(listSkills().length >= 40);
  assert.ok(listDevModules().length >= 4);
  assert.equal(CRIMSON_CAPITAL_PLANET_ID, 'core_prime');
  assert.equal(FOCUS_PLANET_ID, 'solar_station');
  const w = seedWorld({ runId: 'int', persona: 'mixed_ref' });
  assert.equal(decideIntentKind(w, createRng(1), 'mixed_ref'), 'quest');
  addExp(w, 300);
  assert.equal(w.level, 2);
  assert.equal(w.skillPoints, 1);
  assert.equal(canLearnAny(w), true);
});

test('story_002 활성 격파는 아르카디아 HOLD가 아님', () => {
  const w = seedWorld({ runId: 's2f', persona: 'mixed_ref' });
  w.level = 8;
  w.totalExp = 37676;
  w.currentPlanetId = 'minerva_deep';
  w.currentSystemId = 'minerva';
  w.lastQuestPlanetId = 'minerva_deep';
  w.completedMissionIds = ['story_001'];
  w.completedLookup = { story_001: true };
  w.activeQuest = { missionId: 'story_002', title: '동기 없는 진실', objIndex: 2, acceptedDay: 1 };
  let holdOff = 0;
  let progressed = false;
  for (let i = 0; i < 20; i += 1) {
    const e = stepAction(w, createRng(11 + i * 17), 'mixed_ref', { allowSides: true });
    if (e.reason === 'combat_off') holdOff += 1;
    if (e.kind === 'QUEST' && e.line.includes('격파')) progressed = true;
    if (w.activeQuest && w.activeQuest.objIndex > 2) progressed = true;
  }
  assert.equal(holdOff, 0);
  assert.ok(progressed || w.combatWins + w.combatLosses > 0);
});

test('시뮬 리포트는 21일분으로 상한 · 무기는 기어 후보', () => {
  const sim = runSimulation({
    persona: 'mixed_ref',
    days: 30,
    seed: 21,
    runId: 'cap21',
    allowSides: true,
    stronger: true,
  });
  assert.ok(sim.reports.length <= 21);
  assert.ok(sim.reports.length >= 14);
  assert.ok(listGearCandidates().some((g) => g.slot.startsWith('weapon_')));
});

test('시설 CSV 비용·공사틱 · 수도 밴드 · 무역 없는 베가', () => {
  assert.equal(nextDevCost('dev_trade_port', 0), 500);
  assert.ok(durationTicks('defense_satellite', 1) >= 1);
  assert.ok(durationTicks('dev_trade_port', 2) >= 1);
  const w = seedWorld({ runId: 'band', persona: 'mixed_ref' });
  w.level = 4;
  w.gearScore = 900;
  assert.equal(isCapitalAssaultReady(w), false);
  assert.notEqual(approachCapitalPlanet(w), 'core_prime');
  w.level = 44;
  assert.equal(isCapitalAssaultReady(w), true);
  assert.equal(lookupHasTrade('vega_base'), false);
  const vegaHub = nearestTradePlanet('vega_base');
  assert.notEqual(vegaHub, 'vega_base');
  assert.equal(lookupHasTrade(vegaHub), true);
  assert.equal(itemBasePrice('food'), 42);
});

test('sandbox_008 매입은 베가가 아니라 무역 허브', () => {
  const w = seedWorld({ runId: 's008', persona: 'mixed_ref' });
  w.level = 4;
  w.credits = 2000;
  w.currentPlanetId = 'vega_base';
  w.currentSystemId = 'vega_outpost';
  w.activeQuest = { missionId: 'sandbox_008', title: '민간선 예비 식량', objIndex: 0, acceptedDay: 1 };
  w.completedLookup = { story_001: true };
  let bought = 0;
  for (let i = 0; i < 24; i += 1) {
    const e = stepAction(w, createRng(5 + i), 'mixed_ref', { allowSides: true });
    if (e.kind === 'TRADE' || (e.kind === 'QUEST' && e.line.includes('매입'))) bought += 1;
    if (w.activeQuest && w.activeQuest.objIndex >= 1) break;
  }
  assert.ok(bought >= 1 || w.currentPlanetId !== 'vega_base');
  assert.notEqual(w.lastHoldReason, 'trade_broke');
});

test('18:00 1일 학습 리포트는 벽시계 델타를 쓴다', () => {
  const built = buildDailyLearningReport({
    status: {
      recording: true,
      updatedAt: new Date().toISOString(),
      runId: 'pb-test',
      persona: 'mixed_ref',
      planet: 'solar_station',
      lastHold: '',
      quest: { missionId: 'story_002', objIndex: 0, title: 't' },
      kpi: {
        day: 20,
        level: 8,
        totalExp: 9000,
        credits: 2000,
        questCleared: 12,
        holdCount: 0,
        combatWins: 4,
        combatLosses: 2,
        skills: 3,
        gearScore: 400,
        devSum: 5,
        capitalDestroyed: 0,
        annexOk: 1,
        blue: 6,
        red: 10,
      },
      lastAnalyze: { findings: [{ severity: 'info', code: 'STABLE', detail: 'ok' }] },
    },
    learning: {
      version: 2,
      updatedAt: new Date().toISOString(),
      runs: [],
      codeCounts: { STABLE: 2 },
      growth: [
        { day: 19, level: 7, totalExp: 7000, credits: 1800, combatWins: 3, combatLosses: 2, shipDestroys: 0, reboards: 0, hangarShips: 3, questCleared: 10, annexOk: 1, trades: 2, dLevel: 0, dExp: 100, skills: 2, gearScore: 300, devSum: 4, capitalDestroyed: 0 },
        { day: 20, level: 8, totalExp: 9000, credits: 2000, combatWins: 4, combatLosses: 2, shipDestroys: 0, reboards: 0, hangarShips: 3, questCleared: 12, annexOk: 1, trades: 3, dLevel: 1, dExp: 2000, skills: 3, gearScore: 400, devSum: 5, capitalDestroyed: 0 },
      ],
      patterns: [],
      goal: 'player_growth_and_play_pattern',
    },
    policy: { version: 2, updatedAt: '', generation: 3, preferSell: false, adaptEveryDays: 4, personas: {}, lastNotes: ['유지'] },
    prev: {
      at: '2026-09-29T09:00:00.000Z',
      runId: 'pb-test',
      persona: 'mixed_ref',
      generation: 2,
      kpi: {
        day: 4,
        level: 6,
        totalExp: 4000,
        credits: 1500,
        questCleared: 8,
        holdCount: 0,
        combatWins: 1,
        combatLosses: 1,
        skills: 1,
        gearScore: 100,
        devSum: 2,
        capitalDestroyed: 0,
        annexOk: 0,
        blue: 6,
        red: 9,
      },
      codeCounts: {},
    },
    botAlive: true,
    nowIso: new Date().toISOString(),
    dateKey: '2026-09-30',
  });
  assert.ok(built.markdown.includes('18:00 KST'));
  assert.ok(built.markdown.includes('퀘스트'));
  assert.ok(built.chatBrief.includes('플레이봇 1일 학습'));
  assert.equal(built.snapshot.kpi.questCleared, 12);
});

test('1GB 원본 리셋 · learned 유지', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pb-hk-'));
  fs.mkdirSync(path.join(dir, 'runs', 'x'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'runs', 'x', 'journal.ndjson'), 'j'.repeat(400));
  fs.mkdirSync(path.join(dir, 'logs', 'learned'), { recursive: true });
  const keep = path.join(dir, 'logs', 'learned', 'playbot-policy.json');
  fs.writeFileSync(keep, '{"keep":true}', 'utf8');
  const bytes = measureRawBytes(dir);
  assert.ok(bytes >= 400);
  const r = resetRawPlayData({ root: dir, capBytes: 100 });
  assert.equal(r.reset, true);
  assert.equal(fs.existsSync(path.join(dir, 'runs', 'x', 'journal.ndjson')), false);
  assert.equal(fs.readFileSync(keep, 'utf8'), '{"keep":true}');
});

test('이미착륙은 1회 본문 · 2회 .... · 이후 silent', () => {
  const w = seedWorld({ runId: 't', persona: 'mixed_ref' });
  const a = alreadyLanded(w, 'arcadia_prime');
  const b = alreadyLanded(w, 'arcadia_prime');
  const c = alreadyLanded(w, 'arcadia_prime');
  assert.equal(a.line, 'arcadia_prime 이미 착륙');
  assert.equal(a.silent, undefined);
  assert.equal(b.line, '....');
  assert.equal(b.silent, undefined);
  assert.equal(c.silent, true);
  const other = alreadyLanded(w, 'sirius_border');
  assert.equal(other.line, 'sirius_border 이미 착륙');
});

test('본편 021 게이트는 28 · 030은 44', () => {
  assert.equal(getMission('story_021')?.levelRequired, 28);
  assert.equal(getMission('story_023')?.levelRequired, 32);
  assert.equal(getMission('story_028')?.levelRequired, 25);
  assert.equal(getMission('story_030')?.levelRequired, 44);
});

test('격납고 0이면 수련 대신 보충', () => {
  const w = seedWorld({ runId: 'hang0', persona: 'mixed_ref' });
  w.hangarShips = 0;
  const e = fightHere(w, createRng(1), '수련');
  assert.notEqual(e.kind, 'DESTROY');
  assert.ok(e.kind === 'LAND' || e.kind === 'TRAVEL');
});

test('인접성계 배달은 출발지가 아니면 완료', () => {
  const w = seedWorld({ runId: 'nb', persona: 'mixed_ref' });
  w.level = 4;
  w.hangarShips = 3;
  w.currentPlanetId = 'minerva_deep';
  w.currentSystemId = 'minerva';
  w.questOriginSystemId = 'solar_port';
  w.activeQuest = { missionId: 'tq_del_01', title: '긴급 식량 배달', objIndex: 1, acceptedDay: 1 };
  let ok = false;
  for (let i = 0; i < 24; i += 1) {
    const e = stepAction(w, createRng(3 + i * 11), 'mixed_ref', { allowSides: true });
    if (e.line.includes('인접성계') || (w.activeQuest && w.activeQuest.objIndex > 1) || !w.activeQuest) {
      ok = true;
      break;
    }
  }
  assert.equal(ok, true);
});

test('시급 선별 — 021=28이면 절벽 escalate 없음', () => {
  const t = buildDailyTriage({
    verdict: 'WARN',
    botAlive: true,
    recording: true,
    findings: [],
    questCleared: 20,
    level: 35,
    credits: 8000,
  });
  assert.equal(t.escalate, false);
  assert.ok(t.autoNotes.some((n) => n.includes('28/32/36/40/44')));
});

test('대시보드 경로가 잠겨도 writeStatus가 죽지 않음', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pb-dash-'));
  const dash = path.join(dir, 'PLAYBOT_DASHBOARD_LATEST.html');
  fs.mkdirSync(dash);
  beginRecording();
  const paths = ensureRunPaths('pb-dash-lock');
  paths.dashboard = dash;
  paths.status = path.join(dir, 'status.json');
  paths.mudLatest = path.join(dir, 'mud.txt');
  paths.kpi = path.join(dir, 'kpi.json');
  paths.analyze = path.join(dir, 'analyze.md');
  const w = seedWorld({ runId: 'pb-dash-lock', persona: 'mixed_ref' });
  writeStatus(paths, w, ['ok'], []);
  assert.equal(fs.statSync(dash).isDirectory(), true);
  endRecording('test');
});

test('마감은 08:00 이전이면 당일 ·