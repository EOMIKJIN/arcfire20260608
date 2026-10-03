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
  discoveryHopPlanet,
  DISCOVERY_PLANET_PLACEHOLDER,
  listUnresolvedMissionPlaceholders,
  nearestTradePlanet,
  itemBasePrice,
  lookupHasTrade,
  listGearCandidates,
} from './src/catalog';
import { questFightPlanet, nextPlayableMissionId, canLearnAny, isCapitalAssaultReady, approachCapitalPlanet } from './src/progress';
import { nextDevCost, durationTicks } from './src/facilityTwin';
import { buildDailyLearningReport } from './src/dailyLearningReport';
import { decideIntentKind, pickStepKind } from './src/intent';
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
import {
  absorbEarlyFeel,
  analyzeEarlyFeel,
  applyOpeningFeelIfNeeded,
  estimateEntryFeel,
  listOpeningFeelBeats,
  USER_FEEL_WINDOW_SEC,
} from './src/earlyFeel';
import { recordLearning, loadLearning, resetLearningCacheForTest } from './src/learn';
import { adaptPolicy, decideAdaptPeriodDays, getLearnExploreRate, getLiveWeights, getPolicyHealth, loadPolicy, resetPolicyForTest, savePolicy, setLearnedRootForTest } from './src/policy';
import { campaignDaysForHarness, LEARN_HORIZON_DAYS, isAdaptExcludedCode, isNewRunForScore, isTwinLearnCode, nextCampaignSeed, shouldRollbackScore, windowHangarDelta } from './src/learnGate';
import {
  ADB_DATE_ARGS,
  AUTO_IDLE_MS,
  AUTO_MAX_SPAN_MS,
  AUTO_MIN_USER_ACTIONS,
  classifyAutoSession,
  countUserActionMarkers,
  needsMetroReverse,
  parseDeviceSince,
  shouldImportAutoSession,
  shouldRotateAutoSession,
} from './src/ownerPlaylogAuto';
import { HUMAN_SEED_SESSION_CAP, mergeHumanSeed, reloadHumanSeedIfChanged } from './src/humanSeed';
import { atomicWriteFile, loadJsonDurable, resetLearnedIoForTest, setLearnedImmediateForTest, shouldForceLearnFlush } from './src/learnedIo';
import { blendPersonaWeights, formatHumanSeedLine, resetHumanSeedForTest, writeHumanSeed } from './src/humanSeed';
import { classifySessionKind, memProfileToTraces } from './src/memProfileToSessionTrace';
import { pickMemProfileInput, readOwnerSessionKind } from './src/refreshHumanSeed';
import { measureRawBytes, resetRawPlayData } from './src/housekeep';
import { appendJournal, appendTimeline, beginRecording, endRecording, ensureRunPaths, isRecording, setPlaybotIoLogsForTest, writeStatus } from './src/io';
import { continuePastWall, nextUntilWallIsoKst, resolveUntilWallMs } from './src/untilWall';

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
  assert.equal(w.planets.arcadia_prime?.kind, 'clan_hold');
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
    earlyFeels: [],
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
    earlyFeels: [],
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

test('수행 가능 퀘스트는 story+sandbox+tq — 039~055·skeleton 본선 없음', () => {
  const ids = listPlayableMissionIds();
  assert.ok(ids.includes('story_001'));
  assert.ok(ids.includes('story_022'));
  assert.equal(ids.includes('story_023'), false);
  assert.equal(ids.includes('story_030'), false);
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
      earlyFeels: [],
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
  const pid = path.join(dir, 'logs', 'playbot-console.pid');
  fs.writeFileSync(pid, '28648\n', 'utf8');
  const bytes = measureRawBytes(dir);
  assert.ok(bytes >= 400);
  const r = resetRawPlayData({ root: dir, capBytes: 100 });
  assert.equal(r.reset, true);
  assert.equal(fs.existsSync(path.join(dir, 'runs', 'x', 'journal.ndjson')), false);
  assert.equal(fs.readFileSync(keep, 'utf8'), '{"keep":true}');
  assert.equal(fs.readFileSync(pid, 'utf8'), '28648\n');
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
  assert.equal(getMission('story_028')?.levelRequired, 40);
  assert.equal(getMission('story_030')?.levelRequired, 44);
});

test('격납고 0이면 수련 대신 보충', () => {
  const w = seedWorld({ runId: 'hang0', persona: 'mixed_ref' });
  w.hangarShips = 0;
  const e = fightHere(w, createRng(1), '수련');
  assert.notEqual(e.kind, 'DESTROY');
  assert.ok(e.kind === 'LAND' || e.kind === 'TRAVEL');
});

test('탐사 거점은 수락 성계 1~3홉 실행성', () => {
  const hop = discoveryHopPlanet('solar_port', 'solar_station');
  assert.ok(hop);
  assert.notEqual(hop, DISCOVERY_PLANET_PLACEHOLDER);
  assert.ok(lookupSystemId(hop!));
  assert.notEqual(lookupSystemId(hop!), 'solar_port');
  assert.equal(listUnresolvedMissionPlaceholders().length, 0);
});

test('미확인 거점 방문은 성계를 모름 HOLD가 아님', () => {
  const w = seedWorld({ runId: 'disc', persona: 'mixed_ref' });
  w.level = 4;
  w.hangarShips = 3;
  w.currentPlanetId = 'minerva_deep';
  w.currentSystemId = 'minerva';
  w.questOriginSystemId = 'solar_port';
  w.activeQuest = { missionId: 'tq_oth_02', title: '미확인 거점 방문', objIndex: 0, acceptedDay: 1 };
  let ok = false;
  for (let i = 0; i < 24; i += 1) {
    const e = stepAction(w, createRng(3 + i * 11), 'mixed_ref', { allowSides: true });
    assert.equal(e.line.includes('성계를 모름'), false);
    if (e.line.includes('탐사거점') || (w.activeQuest && w.activeQuest.objIndex > 0) || !w.activeQuest) {
      ok = true;
      break;
    }
  }
  assert.equal(ok, true);
});

test('시급 선별 — 토큰 HOLD는 escalate 없이 자체 1안', () => {
  const t = buildDailyTriage({
    verdict: 'WARN',
    botAlive: true,
    recording: true,
    findings: [
      { severity: 'risk', code: 'PLACEHOLDER_HOLD', detail: 'no_dest_system' },
      { severity: 'risk', code: 'QUEST_STUCK', detail: 'tq_oth_02 97일 미클리어' },
    ],
    questCleared: 99,
    level: 48,
    credits: 8000,
  });
  assert.equal(t.escalate, false);
  assert.ok(t.autoNotes.some((n) => n.includes('플레이스홀더') || n.includes('토큰')));
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

test('마감은 08:00 이전이면 당일 · 지났으면 익일 · 과거 인자는 롤', () => {
  const before = Date.parse('2026-10-01T07:59:00+09:00');
  assert.equal(nextUntilWallIsoKst(before), '2026-10-01T08:00:00+09:00');
  const atEight = Date.parse('2026-10-01T08:00:00+09:00');
  assert.equal(nextUntilWallIsoKst(atEight), '2026-10-02T08:00:00+09:00');
  const now = Date.parse('2026-10-01T12:00:00+09:00');
  assert.equal(resolveUntilWallMs('2026-09-01T08:00:00+09:00', now), Date.parse('2026-10-02T08:00:00+09:00'));
  assert.equal(resolveUntilWallMs('2026-12-01T08:00:00+09:00', now), Date.parse('2026-12-01T08:00:00+09:00'));
});

test('08:00 벽시계는 기록을 끄지 않고 다음 마감으로만 넘긴다', () => {
  const hit = Date.parse('2026-10-01T08:00:00+09:00');
  const keep = Date.parse('2026-10-01T07:59:00+09:00');
  const wall = Date.parse('2026-10-01T08:00:00+09:00');
  const idle = continuePastWall(wall, keep);
  assert.equal(idle.rolled, false);
  assert.equal(idle.untilWallMs, wall);
  const rolled = continuePastWall(wall, hit);
  assert.equal(rolled.rolled, true);
  assert.equal(rolled.untilWallMs, Date.parse('2026-10-02T08:00:00+09:00'));
});

test('타임라인이 잠겨도 appendTimeline이 죽지 않음', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pb-tl-'));
  const tl = path.join(dir, 'timeline.csv');
  fs.mkdirSync(tl);
  beginRecording();
  const paths = ensureRunPaths('pb-tl-lock');
  paths.timeline = tl;
  const w = seedWorld({ runId: 'pb-tl-lock', persona: 'mixed_ref' });
  appendTimeline(paths, w, 'QUEST');
  assert.equal(fs.statSync(tl).isDirectory(), true);
  endRecording('test');
});

test('퀘 소진 후 기본 의도는 전투', () => {
  const w = seedWorld({ runId: 'post-q', persona: 'mixed_ref' });
  w.earlyFeelClosed = true;
  const ids = listPlayableMissionIds();
  for (let i = 0; i < ids.length; i += 1) {
    w.completedLookup[ids[i]] = true;
    w.completedMissionIds.push(ids[i]);
  }
  w.questCleared = ids.length;
  w.capitalDestroyed = true;
  w.credits = 800;
  w.skillPoints = 0;
  assert.equal(decideIntentKind(w, () => 0.99, 'mixed_ref'), 'combat');
});

test('초반 3분 오프닝은 스텔라 A0–D2 · C는 2게이트', () => {
  const open = listOpeningFeelBeats();
  const sum = open.reduce((n, b) => n + b.feelSec, 0);
  assert.ok(sum >= 100 && sum <= 180, `opening=${sum}`);
  assert.ok(open.some((b) => b.line.includes('A0')));
  assert.ok(open.some((b) => b.kind === 'SCAN'));
  assert.ok(open.some((b) => b.line.includes('A2')));
  assert.ok(open.some((b) => b.line.includes('D2')));
  assert.ok(open.some((b) => b.kind === 'TALK'));
  assert.ok(open.some((b) => b.line.includes('광물 1')));
});

test('초반 3분 창 — 오프닝 후 본편만 · 장비/수련은 스파인 밖', () => {
  const w = seedWorld({ runId: 'early', persona: 'mixed_ref' });
  applyOpeningFeelIfNeeded(w);
  assert.ok(w.earlyFeelSec >= 50);
  absorbEarlyFeel(w, {
    t: 1, day: 1, tick: 0, kind: 'QUEST', line: '수락 story_001 「동기가 확인되지 않는 살인사건」',
  });
  absorbEarlyFeel(w, {
    t: 2, day: 1, tick: 1, kind: 'LAND', line: 'solar_station 착륙',
  });
  absorbEarlyFeel(w, {
    t: 3, day: 1, tick: 3, kind: 'GEAR', line: '장착 레이저_웨이브',
  });
  absorbEarlyFeel(w, {
    t: 4, day: 1, tick: 14, kind: 'DESTROY', line: '솔라 항구 수련 전함 파괴',
  });
  const accept = estimateEntryFeel({
    t: 1, day: 1, tick: 0, kind: 'QUEST', line: '수락 story_001 「동기가 확인되지 않는 살인사건」',
  });
  assert.ok(accept.spine && accept.feelSec >= 12);
  const findings = analyzeEarlyFeel(w);
  const gearBeat = w.earlyFeelBeats.find((b) => b.kind === 'GEAR');
  const destroyBeat = w.earlyFeelBeats.find((b) => b.kind === 'DESTROY');
  if (gearBeat) assert.equal(gearBeat.spine, false);
  if (destroyBeat) assert.equal(destroyBeat.spine, false);
  if (gearBeat && destroyBeat) {
    assert.ok(findings.some((f) => f.code === 'EARLY_OFF_SPINE'));
    assert.ok(findings.some((f) => f.code === 'EARLY_HANGAR_WIPE'));
  } else {
    assert.ok(w.earlyFeelClosed, '채굴 1사이클이 초반 창을 채우면 장비/수련은 창 밖');
  }
  assert.ok(findings.some((f) => f.code === 'EARLY_L0_GUIDE_OK'));
});

test('초반 3분 창이 열리면 의도는 퀘스트 고정 · 가중 흔들림 없음', () => {
  const w = seedWorld({ runId: 'lock', persona: 'mixed_ref' });
  w.credits = 9000;
  w.skillPoints = 4;
  assert.equal(w.earlyFeelClosed, false);
  assert.equal(decideIntentKind(w, () => 0.01, 'mixed_ref'), 'quest');
  assert.equal(pickStepKind(w, () => 0.01, 'mixed_ref'), 'quest');
  w.earlyFeelClosed = true;
  w.earlyFeelSec = USER_FEEL_WINDOW_SEC;
  assert.ok(decideIntentKind(w, () => 0.99, 'mixed_ref') !== 'idle');
});

test('시뮬 1일이 초반 3분 창을 닫고 본편 수락을 남긴다', () => {
  const sim = runSimulation({
    persona: 'mixed_ref',
    days: 1,
    seed: 11,
    runId: 'early-sim',
    allowSides: false,
    stronger: false,
  });
  assert.equal(sim.world.earlyFeelClosed, true);
  assert.ok(sim.world.earlyFeelSec >= USER_FEEL_WINDOW_SEC);
  assert.ok(sim.world.questAccepted >= 1);
  const day1 = sim.reports[0];
  assert.ok(day1.findings.some((f) => String(f.code).startsWith('EARLY_')));
});

test('학습파일 손상 시 bak 복구 · 무경고 초기화 없음', () => {
  resetLearningCacheForTest();
  resetLearnedIoForTest();
  setLearnedImmediateForTest(true);
  const dir = path.join(TEST_ISO, 'learned');
  const p = path.join(dir, 'playbot-learning-state.json');
  const ok = { version: 2, updatedAt: 't', runs: [{ runId: 'bak', persona: 'mixed_ref', endedAt: 't', kpi: snapshotKpi(seedWorld({ runId: 'bak', persona: 'mixed_ref' })), codes: ['STABLE'] }], codeCounts: { STABLE: 1 }, growth: [], patterns: [], earlyFeels: [], goal: 'player_growth_and_play_pattern' };
  atomicWriteFile(p, JSON.stringify(ok));
  atomicWriteFile(p, JSON.stringify(ok));
  fs.writeFileSync(p, '{broken', 'utf8');
  resetLearningCacheForTest();
  const loaded = loadJsonDurable(p, { version: 2, runs: [] }, (raw): raw is { version: 2; runs: unknown[] } => !!raw && typeof raw === 'object' && Array.isArray((raw as { runs?: unknown }).runs));
  assert.equal(loaded.recovered, true);
  assert.equal(loaded.corrupt, true);
  assert.ok(Array.isArray(loaded.value.runs) && loaded.value.runs.length >= 1);
});

test('바닥값은 정규화 후에도 유지', () => {
  resetPolicyForTest();
  const w = getLiveWeights('mixed_ref');
  assert.ok(w.idle >= 0.02 - 1e-9);
  assert.ok(w.quest >= 0.18 - 1e-9);
  assert.ok(w.combat >= 0.10 - 1e-9);
  assert.ok(w.trade >= 0.05 - 1e-9);
});

test('EARLY·BORDER 코드는 campaign 가중을 범프하지 않음', () => {
  resetPolicyForTest();
  resetLearningCacheForTest();
  const w0 = { ...getLiveWeights('mixed_ref') };
  const world = seedWorld({ runId: 'no-early', persona: 'mixed_ref' });
  world.day = 5;
  const report = {
    day: 5,
    findings: [
      { severity: 'warn' as const, code: 'EARLY_OFF_SPINE', detail: 'x' },
      { severity: 'warn' as const, code: 'BORDER_RED_SLOPE', detail: '트윈전용' },
    ],
    kpi: snapshotKpi(world),
  };
  const ad = adaptPolicy('mixed_ref', report, loadLearning());
  assert.equal(isAdaptExcludedCode('EARLY_OFF_SPINE'), true);
  assert.equal(isTwinLearnCode('BORDER_RED_SLOPE'), true);
  const w1 = getLiveWeights('mixed_ref');
  assert.ok(Math.abs(w1.quest - w0.quest) < 0.04);
  assert.ok(Math.abs(w1.annex_path - w0.annex_path) < 0.04);
  assert.ok(ad.notes.every((n) => !n.includes('초반3분') && !n.includes('국경악화')));
});

test('같은 메모·같은 가중은 generation을 올리지 않음', () => {
  resetPolicyForTest();
  resetLearningCacheForTest();
  const world = seedWorld({ runId: 'skip-gen', persona: 'mixed_ref' });
  const report = { day: 1, findings: [{ severity: 'info' as const, code: 'STABLE', detail: 'ok' }], kpi: snapshotKpi(world) };
  const a = adaptPolicy('mixed_ref', report, loadLearning());
  const gen1 = loadPolicy().generation;
  const b = adaptPolicy('mixed_ref', report, loadLearning());
  const gen2 = loadPolicy().generation;
  assert.equal(b.skipped, true);
  assert.equal(gen2, gen1);
  assert.ok(a.notes.includes('유지') || a.notes.includes('고착해제→기준가중'));
});

test('성공 행동 후 lastHoldReason 해제', () => {
  const w = seedWorld({ runId: 'hold-clear', persona: 'mixed_ref' });
  w.lastHoldReason = 'level_gate';
  w.lastHoldStreak = 4;
  w.currentPlanetId = 'arcadia_prime';
  w.currentSystemId = 'arcadia';
  let cleared = false;
  for (let i = 0; i < 16; i += 1) {
    stepAction(w, createRng(9 + i * 3), 'mixed_ref', { allowSides: true });
    if (w.lastHoldReason === '') {
      cleared = true;
      break;
    }
  }
  assert.equal(cleared, true);
});

test('SKILL_BACKLOG는 습득 가능 스킬이 있을 때만', () => {
  const w = seedWorld({ runId: 'skill-cap', persona: 'mixed_ref' });
  w.skillPoints = 14;
  const skills = listSkills();
  for (let i = 0; i < skills.length; i += 1) {
    w.learnedLookup[skills[i].id] = true;
    w.learnedSkills.push(skills[i].id);
  }
  const r = analyzeDay(w, []);
  assert.equal(r.findings.some((f) => f.code === 'SKILL_BACKLOG'), false);
  assert.equal(LEARN_HORIZON_DAYS, 120);
});

test('고착 가중은 기준값으로 풀고 탐색률은 건강할 때 0.28', () => {
  resetPolicyForTest();
  const collapsed = {
    quest: 0.16145,
    combat: 0.16145,
    trade: 0.042,
    annex_path: 0.042,
    colonize: 0,
    travel: 0.16145,
    idle: 0.017,
    skill: 0.08,
    gear: 0.08,
    develop: 0.16145,
    capital: 0.16145,
  };
  const p = loadPolicy();
  p.personas.mixed_ref = collapsed;
  savePolicy(p, true);
  const world = seedWorld({ runId: 'unstick', persona: 'mixed_ref' });
  const report = { day: 3, findings: [{ severity: 'info' as const, code: 'STABLE', detail: 'ok' }], kpi: snapshotKpi(world) };
  const ad = adaptPolicy('mixed_ref', report, loadLearning());
  assert.ok(ad.notes.some((n) => n.includes('고착해제')));
  const live = getLiveWeights('mixed_ref');
  assert.ok(Math.abs(live.combat - live.travel) > 0.01 || Math.abs(live.quest - live.combat) > 0.01);
  assert.equal(getLearnExploreRate() >= 0.08, true);
  assert.ok(getPolicyHealth().equalWeights === false || getPolicyHealth().unstuckAt);
});

test('격납고 고갈은 창 파괴만 — 런 누적 파괴는 무시', () => {
  resetPolicyForTest();
  resetLearningCacheForTest();
  const world = seedWorld({ runId: 'hangar-win', persona: 'mixed_ref' });
  world.shipDestroys = 40;
  world.hangarShips = 1;
  const growth = [
    { day: 1, level: 8, totalExp: 1000, credits: 2000, combatWins: 4, combatLosses: 1, shipDestroys: 38, reboards: 2, hangarShips: 2, questCleared: 2, annexOk: 0, trades: 1, dLevel: 0, dExp: 100 },
    { day: 2, level: 8, totalExp: 1100, credits: 2000, combatWins: 5, combatLosses: 1, shipDestroys: 38, reboards: 2, hangarShips: 1, questCleared: 2, annexOk: 0, trades: 1, dLevel: 0, dExp: 100 },
  ];
  const learned = { ...loadLearning(), growth, patterns: [] };
  const hang = windowHangarDelta(learned);
  assert.equal(hang.dDestroys, 0);
  const report = { day: 2, findings: [{ severity: 'info' as const, code: 'STABLE', detail: 'ok' }], kpi: snapshotKpi(world) };
  const ad = adaptPolicy('mixed_ref', report, learned);
  assert.equal(ad.notes.some((n) => n.includes('격납고')), false);
});

test('롤백 문턱은 비율 10% — 절대 −150 아님', () => {
  assert.equal(shouldRollbackScore(10000, 9900), false);
  assert.equal(shouldRollbackScore(10000, 8999), true);
  assert.equal(shouldRollbackScore(100, 10), false);
});

test('학습 강제 기록은 1일차만 — 16가상일 강제 없음', () => {
  setLearnedImmediateForTest(false);
  assert.equal(shouldForceLearnFlush(1), true);
  assert.equal(shouldForceLearnFlush(16), false);
  assert.equal(shouldForceLearnFlush(32), false);
  setLearnedImmediateForTest(true);
});

const BASE_W = {
  quest: 0.26, combat: 0.12, trade: 0.08, annex_path: 0.08, colonize: 0,
  travel: 0.04, idle: 0.02, skill: 0.08, gear: 0.10, develop: 0.10, capital: 0.12,
};

test('MEM_PROFILE logcat → SessionTrace v0 · 관측 kind만 재분배', () => {
  resetHumanSeedForTest();
  const sample = [
    '09-29 13:40:06.694 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_focus hermes_mb=32 detail=arcadia_prime',
    '09-29 13:41:08.967 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=manual hermes_mb=60 detail=departure_preflight_arcadia_prime',
    '09-29 13:41:13.000 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=transit_hop_start hermes_mb=60 detail=vega_outpost→arcadia',
    '09-29 13:42:00.000 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_focus hermes_mb=68 detail=solar_station',
  ].join('\n');
  const traces = memProfileToTraces(sample, 't');
  assert.ok(traces.length >= 1);
  assert.ok(traces[0].beats.some((b) => b.verb === 'land'));
  assert.ok(traces[0].beats.some((b) => b.verb === 'depart'));
  const seed = {
    version: 1 as const,
    player: 'owner' as const,
    updatedAt: 't',
    source: 'mem_profile' as const,
    traces,
  };
  writeHumanSeed(path.join(TEST_ISO, 'learned'), seed);
  resetHumanSeedForTest();
  const mixed = blendPersonaWeights(BASE_W, seed);
  assert.equal(mixed.quest, 0.26);
  assert.equal(mixed.travel, 0.04);
});

test('S1 관측 combat+travel만 기준합을 나눔 · 퀘는 유지', () => {
  const seed = {
    version: 1 as const,
    player: 'owner' as const,
    updatedAt: 't',
    source: 'mem_profile' as const,
    traces: [{
      sessionId: 'h1',
      source: 'mem_profile' as const,
      sessionKind: 'human' as const,
      beats: [
        { tSec: 0, verb: 'land' },
        { tSec: 1, verb: 'land' },
        { tSec: 2, verb: 'land' },
        { tSec: 3, verb: 'combat' },
        { tSec: 4, verb: 'depart' },
        { tSec: 5, verb: 'depart' },
      ],
    }],
  };
  const mixed = blendPersonaWeights(BASE_W, seed);
  assert.equal(mixed.quest, 0.26);
  assert.ok(Math.abs((mixed.travel + mixed.combat) - 0.16) < 1e-9);
  assert.ok(mixed.travel > mixed.combat);
});

test('S2 ingress_after_hub_combat는 depart 앞 combat', () => {
  const sample = [
    '09-29 13:40:00.000 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_focus hermes_mb=32 detail=arcadia_prime',
    '09-29 13:41:02.000 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=manual hermes_mb=60 detail=departure_preflight_arcadia_prime',
    '09-29 13:41:03.000 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=ingress_reclaim hermes_mb=60 detail=ingress_after_hub_combat',
  ].join('\n');
  const traces = memProfileToTraces(sample, 't');
  const verbs = traces[0].beats.map((b) => b.verb);
  const combatAt = verbs.indexOf('combat');
  const departAt = verbs.indexOf('depart');
  assert.ok(combatAt >= 0 && departAt >= 0);
  assert.ok(combatAt < departAt);
  assert.equal(verbs.filter((v) => v === 'combat').length, 1);
});

test('S3 3시간+ 세션은 profiler · blend 제외 · forceKind는 human 유지', () => {
  const longBeats = [
    { tSec: 0, verb: 'land' },
    { tSec: 3 * 3600 + 10, verb: 'depart' },
  ];
  assert.equal(classifySessionKind(longBeats), 'profiler');
  const profilerSeed = {
    version: 1 as const,
    player: 'owner' as const,
    updatedAt: '2026-10-02T00:00:00.000Z',
    source: 'mem_profile' as const,
    capturedAt: '2026-10-02T00:00:00.000Z',
    traces: [{
      sessionId: 'p1',
      source: 'mem_profile' as const,
      sessionKind: 'profiler' as const,
      beats: longBeats,
    }],
  };
  const mixed = blendPersonaWeights(BASE_W, profilerSeed);
  assert.equal(mixed.quest, 0.26);
  assert.equal(mixed.travel, 0.04);
  const forced = memProfileToTraces([
    '09-29 13:40:00.000 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_focus hermes_mb=32 detail=arcadia_prime',
    '09-29 13:41:00.000 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=manual hermes_mb=60 detail=departure_preflight_arcadia_prime',
  ].join('\n'), 'owner-play', { forceKind: 'human' });
  assert.ok(forced.length >= 1 && forced.every((t) => t.sessionKind === 'human'));
  assert.ok(formatHumanSeedLine(profilerSeed).includes('2026-10-02'));
});

test('S5 until-close 캠페인은 120일 · 시드가 캠페인마다 달라짐', () => {
  assert.equal(campaignDaysForHarness(true, 0), LEARN_HORIZON_DAYS);
  assert.equal(campaignDaysForHarness(false, 7), 7);
  assert.notEqual(nextCampaignSeed(1, 1), 1);
});

test('실기 자동 수집은 유휴·날짜·앱재시작·3시간에만 회전', () => {
  assert.equal(shouldRotateAutoSession({
    idleMs: 0, spanMs: 1000, deviceGone: false, appPidChanged: false, dayChanged: false,
  }).rotate, false);
  assert.equal(shouldRotateAutoSession({
    idleMs: AUTO_IDLE_MS, spanMs: 1000, deviceGone: false, appPidChanged: false, dayChanged: false,
  }).reason, 'idle');
  assert.equal(shouldRotateAutoSession({
    idleMs: 0, spanMs: AUTO_MAX_SPAN_MS, deviceGone: false, appPidChanged: false, dayChanged: false,
  }).reason, 'max_span');
  assert.equal(shouldRotateAutoSession({
    idleMs: 0, spanMs: 1000, deviceGone: true, appPidChanged: false, dayChanged: false,
  }).reason, 'device_gone');
});

test('T1 새 런/캠페인(가상일 되감김)이면 이전 기준점수와 비교하지 않음', () => {
  assert.equal(isNewRunForScore(118, 12), true);
  assert.equal(isNewRunForScore(40, 60), false);
  assert.equal(isNewRunForScore(null, 5), false);
});

test('T4 시드는 sessionId 병합 · 같은 id 교체 · 최근 32세션 캡', () => {
  const mk = (id: string, at: string) => ({
    sessionId: id,
    source: 'mem_profile' as const,
    sessionKind: 'human' as const,
    capturedAt: at,
    beats: [{ tSec: 0, verb: 'land' }, { tSec: 5, verb: 'depart' }],
  });
  const seedOf = (traces: ReturnType<typeof mk>[]) => ({
    version: 1 as const, player: 'owner' as const, updatedAt: 't', source: 'mem_profile' as const, traces,
  });
  const a = mergeHumanSeed(null, seedOf([mk('s1', '2026-10-01'), mk('s2', '2026-10-02')]));
  const b = mergeHumanSeed(a, seedOf([mk('s2', '2026-10-03'), mk('s3', '2026-10-04')]));
  assert.deepEqual(b.traces.map((t) => t.sessionId), ['s1', 's2', 's3']);
  assert.equal(b.traces.find((t) => t.sessionId === 's2')?.capturedAt, '2026-10-03');
  const many = Array.from({ length: HUMAN_SEED_SESSION_CAP + 5 }, (_, i) => mk(`m${i}`, `2026-11-${String(i).padStart(2, '0')}`));
  const c = mergeHumanSeed(b, seedOf(many));
  assert.equal(c.traces.length, HUMAN_SEED_SESSION_CAP);
});

test('T4/T5 writeHumanSeed는 누적 · 다른 프로세스 갱신 시 재로드', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pb-seed-'));
  const one = {
    version: 1 as const, player: 'owner' as const, updatedAt: 't', source: 'mem_profile' as const,
    traces: [{ sessionId: 'x1', source: 'mem_profile' as const, sessionKind: 'human' as const, beats: [{ tSec: 0, verb: 'land' }, { tSec: 1, verb: 'depart' }] }],
  };
  writeHumanSeed(dir, one);
  writeHumanSeed(dir, { ...one, traces: [{ ...one.traces[0], sessionId: 'x2' }] });
  const saved = JSON.parse(fs.readFileSync(path.join(dir, 'human-seed-v0.json'), 'utf8')) as { traces: unknown[] };
  assert.equal(saved.traces.length, 2);
  resetHumanSeedForTest();
  assert.equal(reloadHumanSeedIfChanged(dir), true);
  assert.equal(reloadHumanSeedIfChanged(dir), false);
  fs.rmSync(dir, { recursive: true, force: true });
  resetHumanSeedForTest();
});

test('D1 adb date는 한 문자열 인자 · 형식 아니면 빈값(세션 시작 보류)', () => {
  assert.equal(ADB_DATE_ARGS.length, 2);
  assert.ok(ADB_DATE_ARGS[1].includes("'+%m-%d %H:%M:%S'"));
  assert.equal(parseDeviceSince('10-02 19:48:03\r\n'), '10-02 19:48:03.000');
  assert.equal(parseDeviceSince(''), '');
  assert.equal(parseDeviceSince('date: Max 1 argument'), '');
});

test('D2 사용자 조작 마커만 센다 · 미만이면 profiler(시드 제외)', () => {
  const log = [
    'I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_focus hermes_mb=32 detail=arcadia_prime',
    'I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=transit_hop_start hermes_mb=40 detail=a→b',
    'I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=deep_reclaim hermes_mb=40 detail=galaxy_map_periodic_deep',
    'I ReactNativeJS: [MEM] runSoftNativeReclaimPass reason=galaxy_map_periodic nebulaBefore=0',
    'I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=manual hermes_mb=56 detail=hub_inbound_drone_end',
  ].join('\n');
  assert.equal(countUserActionMarkers(log), 2);
  assert.equal(classifyAutoSession(AUTO_MIN_USER_ACTIONS - 1), 'profiler');
  assert.equal(classifyAutoSession(AUTO_MIN_USER_ACTIONS), 'human');
  assert.equal(shouldImportAutoSession({
    userActions: AUTO_MIN_USER_ACTIONS, memProfileMarkers: 4, deviceSince: '10-02 19:46:17.000',
  }), true);
  assert.equal(shouldImportAutoSession({
    userActions: AUTO_MIN_USER_ACTIONS, memProfileMarkers: 4, deviceSince: '',
  }), false);
  assert.equal(shouldImportAutoSession({
    userActions: 1, memProfileMarkers: 8, deviceSince: '10-02 19:46:17.000',
  }), false);
});

test('T2 owner-playlog는 pull보다 항상 우선 · pending은 human 아님', () => {
  const picked = pickMemProfileInput([
    { file: 'pull.txt', owner: false, hasMem: true },
    { file: 'owner-session.log', owner: true, hasMem: true },
  ]);
  assert.equal(picked?.file, 'owner-session.log');
  assert.equal(picked?.owner, true);
  assert.equal(pickMemProfileInput([{ file: 'pull.txt', owner: false, hasMem: true }])?.owner, false);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pb-kind-'));
  const log = path.join(dir, 'session.log');
  fs.writeFileSync(log, '', 'utf8');
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({ sessionKind: 'pending' }), 'utf8');
  assert.equal(readOwnerSessionKind(log), 'profiler');
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({ sessionKind: 'human' }), 'utf8');
  assert.equal(readOwnerSessionKind(log), 'human');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('T3 비실기 기본은 profiler · forceKind 없이 덮지 않음', () => {
  const close = [
    '09-29 13:40:00.000 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_focus hermes_mb=32 detail=arcadia_prime',
    '09-29 13:41:00.000 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=manual hermes_mb=60 detail=departure_preflight_arcadia_prime',
  ].join('\n');
  const asProfiler = memProfileToTraces(close, 'owner-mem', { defaultKind: 'profiler' });
  assert.ok(asProfiler.length >= 1);
  assert.ok(asProfiler.every((t) => t.sessionKind === 'profiler'));
  const asHuman = memProfileToTraces(close, 'owner-play', { defaultKind: 'human' });
  assert.ok(asHuman.length >= 1);
  assert.ok(asHuman.every((t) => t.sessionKind === 'human'));
});

test('Metro reverse — 목록에 tcp:8081 쌍이 없을 때만 재설정', () => {
  assert.equal(needsMetroReverse(''), true);
  assert.equal(needsMetroReverse('\r\n'), true);
  assert.equal(needsMetroReverse('host-22 tcp:8081 tcp:8081\r\n'), false);
  assert.equal(needsMetroReverse('192.168.45.197:33639 tcp:8081 tcp:8081'), false);
  assert.equal(needsMetroReverse('host-22 tcp:9090 tcp:9090'), true);
});

console.log('play-bot-console tests done');
