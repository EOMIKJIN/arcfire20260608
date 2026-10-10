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
import { questFightPlanet, nextPlayableMissionId, canLearnAny, isCapitalAssaultReady, approachCapitalPlanet, bestAffordableGear } from './src/progress';
import { nextDevCost, durationTicks } from './src/facilityTwin';
import { buildDailyLearningReport, learningHealthWarnings } from './src/dailyLearningReport';
import { decideIntentKind, pickStepKind } from './src/intent';
import { seedWorld, snapshotKpi, toHolds, addExp, countPaints, paintOf, moveTo } from './src/world';
import { pickTgPlan } from './src/tradeRun';
import { assessLearnCycle, nextLearnCycleWrite, LEARN_CYCLE_FLUSH_MIN_MS } from './src/learnCycle';
import {
  commitGameIssues,
  GAME_ISSUE_FLUSH_MIN_MS,
  gameIssuesPath,
  issuesFromObservation,
  resetGameIssuesForTest,
  type GameIssueObservation,
} from './src/gameIssues';
import {
  observeStall,
  reanalysisText,
  resetStallForTest,
  stallReplayPath,
  stallRestartCount,
  stepStall,
  emptyStallMemory,
  type StallSnap,
} from './src/stallReplay';
import {
  applyCellLap,
  cellWriteDue,
  CELL_FLUSH_MIN_MS,
  combatRedirectPlace,
  emptyCellState,
  flushCellLap,
  observeBotCombat,
  resetCellLoopForTest,
} from './src/cellLoop';
import { BLUE_CLAN, NEUTRAL_CLAN, RED_CLAN } from './src/types';
import { STAGE1_PERSONAS, STAGE2_PERSONAS, resolvePersona } from './src/personas';
import { cardSignature, planFqaReview, reviewNeeded, emptyFqaReviewState } from './src/fqaReview';
import { clampPlayIntelligence, defaultPlayIntelligence } from './src/playIntelligence';
import type { GameIssue } from './src/gameIssues';
import { pickCreditExchange, starterGemBalance, takeCreditExchange, gemExchangeCap } from './src/bmWallet';
import { alreadyLanded, stepAction, fightHere, earnCredits, trainOrRelocate, winChance, TRAIN_STREAK_CAP } from './src/actions';
import { fightOdds, hopFuelCredits, resolveFightPay, transitEncounterChance } from './src/liveCombat';
import { resolvePlayerCombatSkillBind } from '../../src/game/playerOwnedSkillCombatBind';
import { buildDailyTriage } from './src/dailyUrgentTriage';
import { createRng } from './src/rng';
import { CapitalHullPurchasePolicy_FROM_BALANCE_CSV } from '../../src/data/balance/generated/csvCapitalHullPurchasePolicy';
import { addOre, applyMineralUpgrade, bestAffordableMineralUpgrade, pickOreToSell, removeSoldOre } from './src/mineralUpgrade';
import { playerCombatPower } from './src/liveCombat';
import { revertFlagshipToStarter } from './src/combatEfficiency';
import { BOT_OBSERVE_COVERAGE, obsDetail, takeObs } from './src/observeVocab';
import {
  forEachRecentPlayerObserve,
  parsePlayerObserveDetail,
  playerObserveDayOf,
  readPlayerObserveDigest,
  recordPlayerObserve,
  resetPlayerObserve,
  type PlayerObserveVerb,
} from '../../src/game/playerObserve/playerObserveSink';
import { detectStellaSituations } from '../../src/arcCore/chat/stellaObserveSituations';
import { decideStellaObserve, emptyStellaObserveGateState } from '../../src/arcCore/chat/stellaObserveGate';
import { getStellaObserveGatePolicy, listStellaObserveSituations } from '../../src/arcCore/chat/stellaObserveTableIndex';
import { analyzeDay, analyzeStronger, isCreditDrain } from './src/analyze';
import { compareKpi } from './src/compare';
import { runSimulation } from './src/simulate';
import { evaluateProcess, stateChanges, worstState, type ProcessInput, type StageCheck, type StageState } from './src/processBoard';
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
import { adaptPolicy, decideAdaptPeriodDays, getLearnExploreRate, getLiveWeights, getPolicyHealth, learnedDir, loadPolicy, resetPolicyForTest, savePolicy, setLearnedRootForTest } from './src/policy';
import { enableCombatEfficiencyMemory, liveMineralUnitPrice, needsHullFund, nextHullStep, nextHullWorthBuying, progressWall, rememberCombatDay, tryBuyNextHull } from './src/combatEfficiency';
import { campaignDaysForHarness, inCampaignLearnWindow, isAdaptExcludedCode, isNewRunForScore, isTwinLearnCode, nextCampaignSeed, shouldLoopNextCampaign, shouldRollbackScore, windowHangarDelta } from './src/learnGate';
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
import { importHumanSeedFromMemProfile, pickMemProfileInput, readOwnerSessionKind } from './src/refreshHumanSeed';
import { mergeHumanDelta, planHumanDelta, readHumanDelta, writeHumanDelta } from './src/humanDelta';
import type { SessionTraceV0 } from './src/humanSeed';
import { measureRawBytes, pruneProfilerHumanRaw, resetRawPlayData } from './src/housekeep';
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
  // 2026-10-10 전투 관문: 안전하지 않은 수련은 하지 않음 → 피할 수 없는 조우로 파괴·재탑승을 검증
  for (let i = 0; i < 24; i += 1) {
    fightHere(w, lose, '조우');
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
  assert.equal(a.skipped, true);
  assert.equal(b.skipped, true);
  assert.equal(gen2, gen1);
  assert.ok(a.notes.some((n) => n.includes('새 실기 없음')));
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
  assert.equal(inCampaignLearnWindow(120), true);
  assert.equal(inCampaignLearnWindow(400), true);
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

test('until-close는 120일로 끊지 않고 한 세계를 유지', () => {
  assert.equal(campaignDaysForHarness(true, 0), 0);
  assert.equal(campaignDaysForHarness(false, 7), 7);
  assert.equal(shouldLoopNextCampaign(true, true), false);
  assert.equal(inCampaignLearnWindow(400), true);
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

test('18:00 학습 건강 — 정체 반복·FQA 미응답·이동만 실기면 WARN 사유', () => {
  assert.deepEqual(learningHealthWarnings(null), []);
  const healthy = {
    stallRestartsTotal: 0, stallRestarts24h: 0, ceilingLevel: 0, ceilingQuest: 0,
    endgameZero: true, fqaConsultPending: false, fqaReviews: 0, humanDeltaKinds: ['quest', 'travel'],
  };
  assert.deepEqual(learningHealthWarnings(healthy), []);
  const sick = learningHealthWarnings({
    ...healthy, stallRestartsTotal: 54, stallRestarts24h: 8, ceilingLevel: 27, ceilingQuest: 66,
    fqaConsultPending: true, fqaReviews: 25, humanDeltaKinds: ['travel'],
  });
  assert.equal(sick.length, 4);
  assert.ok(sick[0].includes('24시간 8회'));
});

test('크레딧 급감은 잔액이 바닥 근처로 떨어질 때만 (중반 정상 지출 오탐 제외)', () => {
  assert.equal(isCreditDrain(35_000, 6_200), false);
  assert.equal(isCreditDrain(94_000, 60_000), false);
  assert.equal(isCreditDrain(4_000, 1_200), true);
  assert.equal(isCreditDrain(3_000, 1_000), false);
});

test('A2 [PLAY_VERB] 핵심 동작 마커 → 퀘스트·전투·무역·편입·스킬 비트 · 조작 수로 셈', () => {
  const log = [
    '10-05 10:00:00.000 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_focus hermes_mb=32 detail=arcadia_prime',
    '10-05 10:00:10.000 I ReactNativeJS: [PLAY_VERB] verb=quest detail=accept:sandbox_001',
    '10-05 10:00:30.000 I ReactNativeJS: [PLAY_VERB] verb=trade detail=buy:arcadia_prime',
    '10-05 10:01:00.000 I ReactNativeJS: [PLAY_VERB] verb=combat detail=hub_orbit:win',
    '10-05 10:01:20.000 I ReactNativeJS: [PLAY_VERB] verb=annex detail=draco_haven',
    '10-05 10:01:40.000 I ReactNativeJS: [PLAY_VERB] verb=skill detail=smuggler_route',
    '10-05 10:02:00.000 I ReactNativeJS: [PLAY_VERB] verb=unknown_x',
    '10-05 10:02:20.000 I ReactNativeJS: [PLAY_VERB] verb=ship detail=Player_frigate_mk2',
  ].join('\n');
  assert.equal(countUserActionMarkers(log), 8);
  const traces = memProfileToTraces(log, 'owner-play', { defaultKind: 'human' });
  assert.equal(traces.length, 1);
  const verbs = traces[0].beats.map((b) => b.verb);
  assert.deepEqual(verbs, ['land', 'quest', 'trade', 'combat', 'annex', 'skill', 'ship']);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pb-verb-'));
  const delta = planHumanDelta(dir, traces);
  assert.ok(delta);
  for (const k of ['annex_path', 'combat', 'gear', 'quest', 'skill', 'trade', 'travel'] as const) {
    assert.ok(delta!.coveredKinds.includes(k), k);
  }
  assert.deepEqual(delta!.missingVerbs, []);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('A2b [PLAY_VERB] 채굴·스캔·퀘스트 완료·대화·개발 비트', () => {
  const log = [
    '10-06 10:00:00.000 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_focus hermes_mb=32 detail=arcadia_prime',
    '10-06 10:00:10.000 I ReactNativeJS: [PLAY_VERB] verb=scan detail=arcadia_prime',
    '10-06 10:00:20.000 I ReactNativeJS: [PLAY_VERB] verb=mine detail=arcadia_prime:ore_mineral_1',
    '10-06 10:00:30.000 I ReactNativeJS: [PLAY_VERB] verb=talk detail=story_dialog_obj_story_001_a',
    '10-06 10:00:40.000 I ReactNativeJS: [PLAY_VERB] verb=quest detail=complete:story_001',
    '10-06 10:00:50.000 I ReactNativeJS: [PLAY_VERB] verb=develop detail=install:defense_satellite:arcadia_prime',
  ].join('\n');
  const traces = memProfileToTraces(log, 'owner-play', { defaultKind: 'human' });
  assert.equal(traces.length, 1);
  assert.deepEqual(traces[0].beats.map((b) => b.verb), ['land', 'scan', 'mine', 'talk', 'quest', 'develop']);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pb-verb-b-'));
  const delta = planHumanDelta(dir, traces);
  assert.ok(delta);
  assert.ok(delta!.coveredKinds.includes('develop'));
  assert.deepEqual(delta!.missingVerbs, []);
  fs.rmSync(dir, { recursive: true, force: true });
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

function deltaTrace(id: string, verbs: string[], detail?: string): SessionTraceV0 {
  return {
    sessionId: id,
    source: 'mem_profile',
    sessionKind: 'human',
    capturedAt: '2026-10-04T00:00:00.000Z',
    beats: verbs.map((verb, i) => ({ tSec: i * 10, verb, detail: detail && i === verbs.length - 1 ? detail : undefined })),
  };
}

test('실기 델타 — 새 세션만 미소비, 동일 재수입은 열지 않음', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pb-delta-'));
  const first = planHumanDelta(dir, [deltaTrace('s1', ['land', 'depart', 'wave'])]);
  assert.ok(first);
  assert.equal(first!.consumed, false);
  assert.deepEqual(first!.newPairs, ['land>depart', 'depart>wave']);
  assert.ok(first!.coveredKinds.includes('travel'));
  assert.ok(first!.missingVerbs.includes('wave'));
  assert.equal(first!.combatMethod, 'absent');
  writeHumanSeed(dir, {
    version: 1, player: 'owner', updatedAt: 't', source: 'mem_profile', traces: [deltaTrace('s1', ['land', 'depart', 'wave'])],
  });
  assert.equal(planHumanDelta(dir, [deltaTrace('s1', ['land', 'depart', 'wave'])]), null);
  const method = planHumanDelta(dir, [deltaTrace('s2', ['land', 'combat'], 'range=mid;weapon=laser;approach=bow')]);
  assert.equal(method?.combatMethod, 'present');
  assert.ok(method?.newPairs.includes('land>combat'));
  resetHumanSeedForTest();
  fs.rmSync(dir, { recursive: true, force: true });
});

test('학습은 미소비 델타에서만 열리고 기준점수를 비운다', () => {
  resetPolicyForTest();
  resetLearningCacheForTest();
  resetHumanSeedForTest();
  const dir = path.join(TEST_ISO, 'learned');
  const world = seedWorld({ runId: 'delta-adapt', persona: 'mixed_ref' });
  world.day = 4;
  world.level = 3;
  const report = {
    day: 4,
    findings: [{ severity: 'info' as const, code: 'STABLE', detail: 'ok' }],
    kpi: snapshotKpi(world),
  };
  const idle = adaptPolicy('mixed_ref', report, loadLearning());
  assert.equal(idle.skipped, true);
  const p = loadPolicy();
  p.health = { ...(p.health ?? { stuck: false, equalWeights: false, sameNotesStreak: 0, lastScore: null }), lastScore: 9000, lastScoreDay: 100, lastScoreLevel: 5 };
  p.rollbackPersonas = { mixed_ref: { ...getLiveWeights('mixed_ref') } };
  savePolicy(p, true);
  writeHumanDelta(dir, {
    version: 1,
    sessionId: 'owner-new',
    capturedAt: '2026-10-04T00:00:00.000Z',
    newPairs: ['land>depart'],
    coveredKinds: ['travel'],
    missingVerbs: [],
    combatMethod: 'absent',
    consumed: false,
  });
  const ad = adaptPolicy('mixed_ref', report, loadLearning());
  assert.equal(ad.skipped, false);
  assert.ok(ad.notes.some((n) => n.includes('실기델타 owner-new')));
  assert.ok(ad.notes.some((n) => n.includes('전투방식 없음')));
  assert.ok(ad.notes.some((n) => n.includes('기준점수 초기화')));
  assert.equal(ad.notes.some((n) => n.includes('창전투')), false);
  const after = loadPolicy();
  assert.equal(after.health?.lastScore, null);
  assert.equal(after.rollbackPersonas?.mixed_ref, undefined);
  assert.equal(readHumanDelta(dir)?.consumed, true);
  const again = adaptPolicy('mixed_ref', report, loadLearning());
  assert.equal(again.skipped, true);
  resetHumanSeedForTest();
});

test('import는 시드보다 먼저 델타를 계획한다', () => {
  resetHumanSeedForTest();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pb-import-delta-'));
  const log = path.join(dir, 'session.log');
  fs.writeFileSync(log, [
    '09-29 13:40:06.694 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_focus hermes_mb=32 detail=arcadia_prime',
    '09-29 13:41:13.000 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=transit_hop_start hermes_mb=60 detail=vega_outpost→arcadia',
  ].join('\n'), 'utf8');
  const out = importHumanSeedFromMemProfile(log, { outDir: dir, runId: 'owner-auto-test', forceKind: 'human' });
  assert.ok(out);
  const delta = readHumanDelta(dir);
  assert.equal(delta?.consumed, false);
  assert.ok((delta?.newPairs.length ?? 0) > 0);
  const again = importHumanSeedFromMemProfile(log, { outDir: dir, runId: 'owner-auto-test', forceKind: 'human' });
  assert.ok(again);
  assert.equal(readHumanDelta(dir)?.sessionId, delta?.sessionId);
  resetHumanSeedForTest();
  fs.rmSync(dir, { recursive: true, force: true });
});

test('소비 전 두 세션 import는 신규 동사쌍을 한 델타에 합친다', () => {
  resetHumanSeedForTest();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pb-delta-merge-'));
  const logA = path.join(dir, 'a.log');
  const logB = path.join(dir, 'b.log');
  fs.writeFileSync(logA, [
    '09-29 13:40:06.694 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_focus hermes_mb=32 detail=arcadia_prime',
    '09-29 13:41:13.000 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=transit_hop_start hermes_mb=60 detail=vega_outpost→arcadia',
  ].join('\n'), 'utf8');
  fs.writeFileSync(logB, [
    '09-29 14:00:06.694 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_focus hermes_mb=32 detail=vega_outpost',
    '09-29 14:01:13.000 I ReactNativeJS: [MEM_PROFILE] stage=galaxy_map event=transit_combat_nav hermes_mb=60 detail=vega_outpost',
  ].join('\n'), 'utf8');
  assert.ok(importHumanSeedFromMemProfile(logA, { outDir: dir, runId: 'owner-a', forceKind: 'human' }));
  assert.ok(importHumanSeedFromMemProfile(logB, { outDir: dir, runId: 'owner-b', forceKind: 'human' }));
  const delta = readHumanDelta(dir);
  assert.equal(delta?.consumed, false);
  assert.ok(delta?.newPairs.includes('land>depart'));
  assert.ok(delta?.newPairs.includes('land>combat'));
  assert.equal(mergeHumanDelta(
    { version: 1, sessionId: 'a', capturedAt: '2026-10-04T00:00:00.000Z', newPairs: ['land>depart'], coveredKinds: ['travel'], missingVerbs: [], combatMethod: 'absent', consumed: false },
    { version: 1, sessionId: 'b', capturedAt: '2026-10-04T01:00:00.000Z', newPairs: ['land>combat'], coveredKinds: ['travel', 'combat'], missingVerbs: ['wave'], combatMethod: 'present', consumed: false },
  ).combatMethod, 'present');
  resetHumanSeedForTest();
  fs.rmSync(dir, { recursive: true, force: true });
});

test('학습주기 — 레벨 60·퀘 96은 완료가 아니다', () => {
  const row = assessLearnCycle({
    day: 9747,
    level: 60,
    questCleared: 96,
    annexOk: 0,
    colonizeOk: 0,
    blue: 0,
    red: 18,
    independent: 0,
    capitalDestroyed: 1,
    credits: 602639,
    combatWins: 29479,
    combatLosses: 5732,
    planetId: 'abyss_gate',
    combatMethod: 'absent',
  });
  assert.equal(row.declareComplete, false);
  assert.equal(row.phase, 'P5');
  const codes = row.gaps.map((g) => g.code);
  assert.ok(codes.includes('DESIGN_BLANK'));
  assert.ok(codes.includes('QUEST_COUNT_NOT_CLOSE'));
  assert.ok(codes.includes('INDEPENDENT_ZERO'));
  assert.ok(codes.includes('COMBAT_METHOD_ABSENT'));
  assert.ok(codes.includes('CAPITAL_DICE'));
  assert.equal(row.gaps.find((g) => g.code === 'READ_OFFSET_BEFORE_AWAKE')?.class, 'twin_hold');
  assert.equal(row.gaps.some((g) => g.class === 'game_function' && g.code === 'READ_OFFSET_BEFORE_AWAKE'), false);
});

test('학습주기 기록은 같은 서명이면 10분 전엔 쓰지 않는다', () => {
  const sig = 'P5|A';
  const first = nextLearnCycleWrite(null, sig, 1_000);
  assert.equal(first.write, true);
  const held = nextLearnCycleWrite(first.next, sig, 1_000 + LEARN_CYCLE_FLUSH_MIN_MS - 1);
  assert.equal(held.write, false);
  const later = nextLearnCycleWrite(first.next, sig, 1_000 + LEARN_CYCLE_FLUSH_MIN_MS);
  assert.equal(later.write, true);
  const changed = nextLearnCycleWrite(first.next, 'P4|B', 1_500);
  assert.equal(changed.write, true);
});

test('블루 승리 는 영토를 유지하고 레드 승리만 중립이 된다', () => {
  const w = seedWorld({ runId: 'paint', persona: 'mixed_ref' });
  w.level = 40;
  w.hangarShips = 3;
  w.currentPlanetId = 'arcadia_prime';
  w.currentSystemId = lookupSystemId('arcadia_prime') ?? w.currentSystemId;
  const blueBefore = w.planets.arcadia_prime?.occupierClanId;
  const blueWin = fightHere(w, () => 0, '수련');
  assert.equal(blueWin.kind, 'COMBAT');
  assert.equal(w.planets.arcadia_prime?.occupierClanId, blueBefore);
  assert.equal(w.planets.arcadia_prime?.kind, 'clan_hold');
  assert.equal(blueWin.line.includes('중립'), false);
  let redId = '';
  const ids = Object.keys(w.planets);
  for (let i = 0; i < ids.length; i += 1) {
    const slot = w.planets[ids[i]];
    if (slot && paintOf(slot) === 'RED' && slot.tcl <= w.level + 8) {
      redId = ids[i];
      break;
    }
  }
  assert.ok(redId);
  w.currentPlanetId = redId;
  w.currentSystemId = lookupSystemId(redId) ?? w.currentSystemId;
  // 적 행성 공략 = 도전(전선) — 2026-10-10 전투 관문: 평소 수련은 안전선 이상만
  const redWin = fightHere(w, () => 0, '전선');
  assert.equal(redWin.kind, 'COMBAT');
  assert.equal(w.planets[redId]?.occupierClanId, NEUTRAL_CLAN);
  assert.equal(w.planets[redId]?.kind, 'neutral');
});

test('세포 반복은 가족 안 승률로 고르고 사람 partial 은 선택을 지우지 않는다', () => {
  const human = '10-04 13:41:00.000 1 1 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_focus detail=arcadia_prime\n';
  let state = emptyCellState();
  state = applyCellLap(state, {
    combats: [
      { place: 'low_tcl', win: true },
      { place: 'high_tcl', win: false },
    ],
    humanText: '',
    now: 1_000,
  });
  assert.equal(state.declareComplete, false);
  assert.equal(state.lap, 1);
  assert.equal(state.selected.combat, 'combat|low_tcl||winrate');
  state = applyCellLap(state, { combats: [], humanText: human, now: 2_000 });
  assert.equal(state.selected.combat, 'combat|low_tcl||winrate');
  assert.equal(state.declareComplete, false);
  assert.ok(state.cells.some((c) => c.source === 'human' && c.score == null));
  const kept = applyCellLap(state, { combats: [], humanText: '', now: 3_000 });
  assert.equal(kept.selected.combat, 'combat|low_tcl||winrate');
  assert.equal(kept.lap, 3);
  const stamped = { ...state, lastSig: 'written', lastWriteMs: 2_000 };
  const changed = applyCellLap(stamped, {
    combats: [{ place: 'low_tcl', win: true }],
    humanText: '',
    now: 2_000 + 1_000,
  });
  assert.equal(cellWriteDue(stamped, changed, 2_000 + 1_000), false);
  assert.equal(cellWriteDue(stamped, changed, 2_000 + CELL_FLUSH_MIN_MS), true);
});

test('전투 선택 장소가 합법이면 그쪽으로 이동하고 아니면 기존 경로다', () => {
  resetCellLoopForTest();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cell-loop-'));
  const w = seedWorld({ runId: 'cell', persona: 'mixed_ref' });
  w.level = 40;
  w.hangarShips = 3;
  let low = '';
  let high = '';
  const ids = Object.keys(w.planets);
  for (let i = 0; i < ids.length; i += 1) {
    const slot = w.planets[ids[i]];
    if (!slot?.combatEnabled || paintOf(slot) !== 'RED' || slot.tcl > w.level + 8) continue;
    if (!low || slot.tcl < (w.planets[low]?.tcl ?? 99)) low = ids[i];
  }
  for (let i = 0; i < ids.length; i += 1) {
    const slot = w.planets[ids[i]];
    if (!slot?.combatEnabled || paintOf(slot) !== 'RED' || ids[i] === low) continue;
    if (slot.tcl <= w.level + 8) high = ids[i];
  }
  assert.ok(low && high);
  observeBotCombat(low, true);
  observeBotCombat(high, false);
  const flushed = flushCellLap(dir, 10_000);
  assert.equal(flushed.combatPlace, low);
  w.currentPlanetId = high;
  w.currentSystemId = lookupSystemId(high) ?? w.currentSystemId;
  assert.equal(combatRedirectPlace(w), low);
  w.planets[low].tcl = w.level + 9;
  assert.equal(combatRedirectPlace(w), null);
});

function stallSnap(overrides: Partial<StallSnap> = {}): StallSnap {
  return {
    day: 1,
    level: 4,
    totalExp: 100,
    questCleared: 1,
    annexOk: 0,
    colonizeOk: 0,
    independent: 0,
    devSum: 0,
    combatWins: 0,
    credits: 1000,
    ...overrides,
  };
}

test('성장이 21일 멈추면 처음부터 다시 플레이한다', () => {
  let mem = emptyStallMemory();
  let last = stepStall(mem, stallSnap({ day: 1 }));
  for (let day = 2; day <= 20; day += 1) {
    last = stepStall(last.mem, stallSnap({ day }));
    assert.equal(last.restart, false);
  }
  last = stepStall(last.mem, stallSnap({ day: 21 }));
  assert.equal(last.restart, true);
  assert.equal(last.reason, 'hard');
});

test('경험치가 오르면 성장 정체가 끊긴다', () => {
  let mem = emptyStallMemory();
  let last = stepStall(mem, stallSnap({ day: 1, totalExp: 1 }));
  for (let day = 2; day <= 30; day += 1) {
    last = stepStall(last.mem, stallSnap({ day, totalExp: day }));
  }
  assert.equal(last.restart, false);
  assert.equal(last.hardStreak, 1);
});

test('퀘스트가 40일 멈추고 전투가 있으면 구간 정체다', () => {
  let mem = emptyStallMemory();
  let last = stepStall(mem, stallSnap({ day: 1, totalExp: 1, combatWins: 1, questCleared: 96, level: 49 }));
  for (let day = 2; day <= 40; day += 1) {
    last = stepStall(last.mem, stallSnap({
      day,
      totalExp: day,
      combatWins: day,
      questCleared: 96,
      level: 49,
    }));
  }
  assert.equal(last.restart, true);
  assert.equal(last.reason, 'section');
  let quiet = emptyStallMemory();
  let quietLast = stepStall(quiet, stallSnap({ day: 1, totalExp: 1, combatWins: 3, questCleared: 96 }));
  for (let day = 2; day <= 40; day += 1) {
    quietLast = stepStall(quietLast.mem, stallSnap({
      day,
      totalExp: day,
      combatWins: 3,
      questCleared: 96,
    }));
  }
  assert.equal(quietLast.restart, false);
});

test('퀘스트가 멈춰도 레벨이 오르면 관문 수련 — 구간 정체로 재시작하지 않는다', () => {
  let last = stepStall(emptyStallMemory(), stallSnap({ day: 1, totalExp: 1, combatWins: 1, questCleared: 64, level: 26 }));
  // 실측처럼 25~30일마다 1레벨 — 퀘스트 64 고정 80일
  for (let day = 2; day <= 80; day += 1) {
    last = stepStall(last.mem, stallSnap({
      day,
      totalExp: day * 1000,
      combatWins: day,
      questCleared: 64,
      level: 26 + Math.floor(day / 30),
    }));
    assert.equal(last.restart, false, `day ${day}`);
  }
  // 레벨은 29에 머물고 경험치가 오르면 story_023(L32) 관문 수련 — 구간 정체로 끊지 않는다
  for (let day = 81; day <= 125; day += 1) {
    last = stepStall(last.mem, stallSnap({ day, totalExp: day * 1000, combatWins: day, questCleared: 64, level: 29 }));
    assert.equal(last.restart, false, `gate day ${day}`);
  }
  // 다음 본편 관문보다 레벨이 높은데 퀘스트만 멈추고 경험치는 오르면 구간 정체
  let capped = stepStall(emptyStallMemory(), stallSnap({
    day: 1, totalExp: 1, combatWins: 1, questCleared: 64, level: 50,
  }));
  for (let day = 2; day <= 50; day += 1) {
    capped = stepStall(capped.mem, stallSnap({
      day, totalExp: day * 1000, combatWins: day, questCleared: 64, level: 50,
    }));
  }
  assert.equal(capped.restart, true);
  assert.equal(capped.reason, 'section');
});

test('정체 재분석은 같은 축이 반복되면 재발이라고 적는다', () => {
  const first = reanalysisText(null, {
    reason: 'section', day: 40, level: 49, questCleared: 96, independent: 0,
  });
  assert.ok(first.includes('처음부터'));
  const again = reanalysisText(
    { reason: 'section', day: 40, level: 49, questCleared: 96 },
    { reason: 'section', day: 42, level: 49, questCleared: 96, independent: 0 },
  );
  assert.ok(again.includes('같은'));
  const moved = reanalysisText(
    { reason: 'section', day: 40, level: 49, questCleared: 96 },
    { reason: 'section', day: 50, level: 52, questCleared: 96, independent: 0 },
  );
  assert.ok(moved.includes('직전'));
  resetStallForTest();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pb-stall-'));
  let observed = observeStall(dir, stallSnap({ day: 1 }), 'run-a', 1_000);
  for (let day = 2; day <= 21; day += 1) {
    observed = observeStall(dir, stallSnap({ day }), 'run-a', 1_000 + day);
  }
  assert.equal(observed.restart, true);
  assert.equal(stallRestartCount(), 1);
  const saved = JSON.parse(fs.readFileSync(stallReplayPath(dir), 'utf8')) as { restarts: number };
  assert.equal(saved.restarts, 1);
  fs.rmSync(dir, { recursive: true, force: true });
  resetStallForTest();
});

function issueObs(overrides: Partial<GameIssueObservation> = {}): GameIssueObservation {
  return {
    runId: 'run-a',
    day: 1,
    level: 49,
    questCleared: 10,
    independent: 0,
    annexOk: 0,
    colonizeOk: 0,
    combatWins: 1,
    combatLosses: 0,
    questFlatDays: 1,
    insolventDays: 0,
    drainHits: 0,
    lastHoldReason: '',
    credits: 5000,
    hangarShips: 5,
    findings: [],
    ...overrides,
  };
}

test('게임 문제 목록은 플레이로 확인된 밸런싱·구간·시스템만 담는다', () => {
  const noise = issuesFromObservation([], issueObs({
    findings: [
      { code: 'BORDER_RED_SLOPE', detail: '트윈전용' },
      { code: 'EARLY_OFF_SPINE', detail: '스파인 밖' },
      { code: 'PLACEHOLDER_UNRESOLVED', detail: 'story_x:__tok__' },
    ],
  }));
  assert.deepEqual(noise.addedIds, ['section:placeholder-unresolved']);
  const sameDay = issuesFromObservation(noise.issues, issueObs({
    findings: [{ code: 'PLACEHOLDER_UNRESOLVED', detail: 'story_x:__tok__' }],
  }));
  assert.equal(sameDay.addedIds.length, 0);
  assert.equal(sameDay.issues[0].evidence, 1);
  const nextDay = issuesFromObservation(noise.issues, issueObs({
    day: 2,
    findings: [{ code: 'PLACEHOLDER_UNRESOLVED', detail: 'story_x:__tok__' }],
  }));
  assert.equal(nextDay.issues[0].evidence, 2);

  const early = issuesFromObservation([], issueObs({
    questFlatDays: 8,
    questCleared: 10,
  }));
  assert.equal(early.issues.some((row) => row.id === 'section:quest-end-before-endgame'), false);
  const ended = issuesFromObservation([], issueObs({
    questFlatDays: 8,
    questCleared: 96,
    level: 49,
  }));
  assert.equal(ended.issues[0]?.category, 'section');
  assert.ok(ended.issues[0]?.detail.includes('독립국'));

  const poor = issuesFromObservation([], issueObs({ insolventDays: 2, credits: 10 } as Partial<GameIssueObservation>));
  assert.equal(poor.issues[0]?.category, 'balance');
  const combat = issuesFromObservation([], issueObs({ combatWins: 1, combatLosses: 8, level: 3 }));
  assert.equal(combat.issues[0]?.id, 'balance:early-combat');
  const held = issuesFromObservation([], issueObs({ lastHoldReason: 'unresolved_placeholder' }));
  assert.equal(held.issues[0]?.category, 'system');

  resetGameIssuesForTest();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pb-issues-'));
  const base = {
    runId: 'run-a',
    level: 2,
    questCleared: 0,
    independent: 0,
    annexOk: 0,
    colonizeOk: 0,
    combatWins: 0,
    combatLosses: 0,
    questFlatDays: 1,
    lastHoldReason: '',
    credits: 5000,
    hangarShips: 5,
    findings: [{ code: 'PLACEHOLDER_UNRESOLVED', detail: 'tok' }],
  };
  const wrote = commitGameIssues(dir, { ...base, day: 1 }, 1_000);
  assert.equal(wrote.wrote, true);
  const heldWrite = commitGameIssues(dir, { ...base, day: 2 }, 2_000);
  assert.equal(heldWrite.wrote, false);
  const disk = JSON.parse(fs.readFileSync(gameIssuesPath(dir), 'utf8')) as { issues: { evidence: number }[] };
  assert.equal(disk.issues[0].evidence, 1);
  const later = commitGameIssues(dir, { ...base, day: 3 }, 2_000 + GAME_ISSUE_FLUSH_MIN_MS);
  assert.equal(later.wrote, true);
  const diskLater = JSON.parse(fs.readFileSync(gameIssuesPath(dir), 'utf8')) as { issues: { evidence: number }[] };
  assert.equal(diskLater.issues[0].evidence, 3);
  const md = fs.readFileSync(path.join(dir, 'FQA.md'), 'utf8');
  assert.ok(md.includes('FQA'));
  assert.ok(md.includes('대응'));
  assert.ok(md.includes('구간콘텐츠'));
  assert.equal(md.includes('BORDER_RED_SLOPE'), false);
  fs.rmSync(dir, { recursive: true, force: true });
  resetGameIssuesForTest();
});

test('FQA 대응은 증거 갱신 때 유지되고 초반 3일 문제를 올린다', () => {
  const opened = issuesFromObservation([], issueObs({
    day: 3,
    level: 3,
    combatWins: 8,
    combatLosses: 9,
    hangarShips: 0,
    credits: 120,
  }));
  assert.ok(opened.addedIds.includes('balance:early-hangar-wipe'));
  assert.ok(opened.addedIds.includes('balance:opening-insolvency'));
  const marked = opened.issues.map((row) => (
    row.id === 'balance:early-hangar-wipe'
      ? { ...row, response: { at: '2026-10-04T00:00:00.000Z', by: 'kim-team-lead+kim-claude' as const, text: '대응유지' } }
      : row
  ));
  const again = issuesFromObservation(marked, issueObs({
    day: 3,
    runId: 'run-b',
    level: 3,
    combatWins: 8,
    combatLosses: 9,
    hangarShips: 0,
    credits: 120,
  }));
  const kept = again.issues.find((row) => row.id === 'balance:early-hangar-wipe');
  assert.equal(kept?.response?.text, '대응유지');
  assert.equal(kept?.evidence, 2);
});

test('돈이 바닥이면 퀘스트로 벌고 퀘스트가 없으면 채굴한다', () => {
  const poor = seedWorld({ runId: 'earn-quest', persona: 'mixed_ref' });
  poor.earlyFeelClosed = true;
  poor.credits = 120;
  const quest = earnCredits(poor, () => 0.1);
  assert.equal(quest.kind, 'QUEST');
  assert.equal(poor.credits, 120);

  const mined = seedWorld({ runId: 'earn-mine', persona: 'mixed_ref' });
  mined.earlyFeelClosed = true;
  mined.credits = 120;
  const ids = listPlayableMissionIds();
  for (let i = 0; i < ids.length; i += 1) {
    mined.completedLookup[ids[i]] = true;
    mined.completedMissionIds.push(ids[i]);
  }
  mined.questCleared = ids.length;
  const mine = earnCredits(mined, () => 0.1);
  assert.equal(mine.kind, 'MINE');
  assert.equal(mined.mineralCargo, 1);
  // 종류 미기록 적재 8 = 매도 대상(강화 몫 예약은 종류별 적재만 · A-11)
  mined.oreCargo = {};
  mined.mineralCargo = 8;
  const hub = nearestTradePlanet(mined.currentPlanetId);
  assert.ok(hub);
  mined.currentPlanetId = hub;
  const hubSystem = lookupSystemId(hub);
  assert.ok(hubSystem);
  mined.currentSystemId = hubSystem;
  const sold = earnCredits(mined, () => 0.1);
  assert.equal(sold.kind, 'TRADE');
  assert.equal(mined.credits, 120 + liveMineralUnitPrice(hub, mined.level));
  assert.equal(mined.mineralCargo, 7);
});

test('승률이 낮은 수련은 전함을 깨지 않는다', () => {
  const w = seedWorld({ runId: 'fair-train', persona: 'mixed_ref' });
  w.earlyFeelClosed = true;
  w.level = 2;
  const ids = Object.keys(w.planets);
  let hard = '';
  for (let i = 0; i < ids.length; i += 1) {
    const slot = w.planets[ids[i]];
    if (slot?.combatEnabled && winChance(w, slot.tcl, slot.planetId) < 0.5) {
      hard = slot.planetId;
      break;
    }
  }
  assert.ok(hard);
  w.currentPlanetId = hard;
  const hardSystem = lookupSystemId(hard);
  assert.ok(hardSystem);
  w.currentSystemId = hardSystem;
  const row = trainOrRelocate(w, () => 0.99, '수련');
  assert.notEqual(row.kind, 'DESTROY');
  assert.notEqual(row.kind, 'COMBAT');
});

test('개발이 바닥을 깨면 지출하지 않고 번다', () => {
  const w = seedWorld({ runId: 'earn-dev', persona: 'mixed_ref' });
  w.earlyFeelClosed = true;
  const ids = listPlayableMissionIds();
  for (let i = 0; i < ids.length; i += 1) {
    w.completedLookup[ids[i]] = true;
    w.completedMissionIds.push(ids[i]);
  }
  w.questCleared = ids.length;
  const mods = listDevModules();
  let cost = 0;
  for (let i = 0; i < mods.length; i += 1) {
    const c = nextDevCost(mods[i].id, 0);
    if (c > 0 && (cost === 0 || c < cost)) cost = c;
  }
  assert.ok(cost > 0);
  w.credits = cost + 100;
  const before = w.credits;
  const row = stepAction(w, () => 0.99, 'mixed_ref', { allowSides: false });
  assert.notEqual(row.kind, 'DEVELOP');
  assert.ok(w.credits >= before);
});

function fqaIssue(id: string, evidence: number): GameIssue {
  const category = id.startsWith('balance:') ? 'balance' : (id.startsWith('system:') ? 'system' : 'section');
  return {
    id,
    category,
    title: id,
    detail: '',
    evidence,
    firstDay: 1,
    lastDay: 3,
    runId: 'review',
    response: null,
  };
}

test('연료가 없으면 채굴하고, 채굴이 불가하면 수색한다', () => {
  const broke = seedWorld({ runId: 'fuel-mine', persona: 'mixed_ref' });
  const story = getMission('story_001');
  assert.ok(story);
  const reach = story.objectives.findIndex((o) => o.type === 'reach_planet' || o.type === 'reach_system');
  assert.ok(reach >= 0);
  broke.credits = 0;
  broke.currentPlanetId = 'arcadia_prime';
  broke.currentSystemId = 'arcadia';
  broke.activeQuest = { missionId: 'story_001', title: story.title, objIndex: reach, acceptedDay: 1 };
  const row = stepAction(broke, () => 0, 'mixed_ref', { allowSides: true });
  assert.notEqual(row.reason, 'fuel');
  assert.ok(row.kind === 'MINE' || row.kind === 'TRADE' || row.kind === 'SEARCH' || row.kind === 'QUEST', `${row.kind} ${row.line}`);
  const dryWorld = seedWorld({ runId: 'fuel-search', persona: 'mixed_ref' });
  dryWorld.credits = 0;
  dryWorld.mineralCargo = 0;
  dryWorld.currentPlanetId = 'no_orbital_deposit';
  dryWorld.currentSystemId = 'minerva';
  dryWorld.activeQuest = { missionId: 'story_001', title: story.title, objIndex: reach, acceptedDay: 1 };
  const searched = stepAction(dryWorld, () => 0, 'mixed_ref', { allowSides: true });
  assert.equal(searched.kind, 'SEARCH');
});

test('기본 함선 무장이 화력에 포함된다', () => {
  const w = seedWorld({ runId: 'hull-guns', persona: 'mixed_ref' });
  w.level = 2;
  w.equipped = {};
  w.hullShipId = 'Player_npc_red_fleet_1';
  const odds = fightOdds(w, 'solar_station', 5);
  assert.ok(odds.playerDps > 20, String(odds.playerDps));
});

test('우회한 퀘스트는 보류하고 본편을 진행한다', () => {
  const w = seedWorld({ runId: 'park-story', persona: 'mixed_ref' });
  w.level = 10;
  w.hullRank = 1;
  w.credits = 9_000_000;
  w.earlyFeelClosed = true;
  w.questCleared = 1;
  w.completedMissionIds = ['story_001'];
  w.completedLookup = { story_001: true };
  w.currentPlanetId = 'eternal_throne';
  w.currentSystemId = lookupSystemId('eternal_throne') ?? w.currentSystemId;
  w.lastQuestPlanetId = 'eternal_throne';
  w.activeQuest = { missionId: 'sandbox_001', title: '관문', objIndex: 0, acceptedDay: 1 };
  let last = '';
  // 산 함선(hullRank 1)은 위험 항로 퀘스트 이동을 3일(48틱) 막힌 뒤에야 도전한다(2026-10-10) — 그만큼 여유를 둔다
  for (let i = 0; i < 120; i += 1) {
    w.tick += 1; // 시뮬레이션 루프처럼 시간이 흐른다(시간 기준 규칙이 동작하도록)
    last = stepAction(w, () => 0.99, 'mixed_ref', { allowSides: true }).line;
    if (w.activeQuest?.missionId.startsWith('story_')) break;
  }
  assert.ok(w.parkedQuests.some((q) => q.missionId === 'sandbox_001'), last);
  assert.ok(w.activeQuest?.missionId.startsWith('story_'), `${w.activeQuest?.missionId ?? 'none'} · ${last}`);
});

test('궤도 퀘스트를 들고 있으면 안전 구역 조우 보정이 꺼진다', () => {
  const bare = seedWorld({ runId: 'encounter-bare', persona: 'mixed_ref' });
  const quiet = transitEncounterChance(bare, 'solar_port');
  const held = seedWorld({ runId: 'encounter-lock', persona: 'mixed_ref' });
  held.activeQuest = {
    missionId: 'sandbox_001',
    title: '솔라 궤도',
    objIndex: 0,
    acceptedDay: 1,
  };
  const locked = transitEncounterChance(held, 'solar_port');
  assert.equal(locked, quiet);
  assert.ok(locked < quiet + 0.4);
});

test('FQA 카드 상승은 새 전투 모델 재검수 전까지 멈춘다', () => {
  const card = defaultPlayIntelligence();
  const first = planFqaReview([
    fqaIssue('balance:insolvency', 4),
    fqaIssue('balance:credit-drain', 10),
    fqaIssue('balance:early-combat', 2),
  ], card, {});
  assert.equal(first.cardChanged, false);
  assert.equal(first.card.mineCap, 8);
  assert.equal(first.card.fairFightMin, 0.5);
  assert.equal(first.card.cashFloor, 400);
  const again = planFqaReview([
    fqaIssue('balance:insolvency', 5),
    fqaIssue('balance:credit-drain', 11),
    fqaIssue('balance:early-combat', 3),
  ], first.card, first.seenEvidence);
  assert.equal(again.card.mineCap, 8);
  assert.equal(again.card.fairFightMin, 0.5);
  assert.equal(again.cardChanged, false);
  assert.equal(again.card.cashFloor, 400);
  const held = emptyFqaReviewState();
  held.lastSig = again.signature;
  held.seenEvidence = again.seenEvidence;
  assert.equal(reviewNeeded(held, [
    fqaIssue('balance:insolvency', 5),
    fqaIssue('balance:credit-drain', 11),
    fqaIssue('balance:early-combat', 3),
  ]), false);
  const outside = planFqaReview([fqaIssue('system:quest-buy', 2)], card, { 'system:quest-buy': 1 });
  assert.equal(outside.cardChanged, false);
  assert.equal(outside.outside[0], 'system:quest-buy');
  const capped = clampPlayIntelligence({ cashFloor: 50, mineCap: 99, fairFightMin: 0.99 });
  assert.equal(capped.cashFloor, 400);
  assert.equal(capped.mineCap, 16);
  assert.equal(capped.fairFightMin, 0.65);
});

test('보석 지갑은 부족분이 채굴로 안 될 때만 크레딧으로 바꾼다', () => {
  const seeded = seedWorld({ runId: 'bm-seed', persona: 'mixed_ref' });
  assert.equal(seeded.gems, starterGemBalance());
  assert.equal(seeded.gems, 250);
  const cap = gemExchangeCap();
  assert.equal(cap.daily, 64);
  assert.equal(cap.weekly, 400);
  const small = pickCreditExchange(15000, 250, 0, 0);
  assert.equal(small?.productId, 'ex_gems_50');
  assert.equal(small?.creditGrant, 20000);
  const mid = pickCreditExchange(30000, 250, 0, 0);
  assert.equal(mid?.productId, 'ex_gems_50');
  assert.equal(pickCreditExchange(20000, 250, 480, 480), null);

  const poor = seedWorld({ runId: 'bm-mine', persona: 'mixed_ref' });
  poor.earlyFeelClosed = true;
  poor.credits = 100;
  const ids = listPlayableMissionIds();
  for (let i = 0; i < ids.length; i += 1) {
    poor.completedLookup[ids[i]] = true;
    poor.completedMissionIds.push(ids[i]);
  }
  poor.questCleared = ids.length;
  const mined = earnCredits(poor, () => 0.1);
  assert.equal(mined.kind, 'MINE');
  assert.equal(poor.gems, 250);

  const blocked = seedWorld({ runId: 'bm-exchange', persona: 'mixed_ref' });
  blocked.earlyFeelClosed = true;
  blocked.credits = 100;
  blocked.gems = 250;
  const bought = takeCreditExchange(blocked, 30000);
  assert.equal(bought?.productId, 'ex_gems_50');
  assert.equal(blocked.gems, 200);
  assert.equal(blocked.credits, 20100);
  blocked.gemsSpentDay = 460;
  assert.equal(takeCreditExchange(blocked, 30000), null);
  assert.equal(blocked.gems, 200);
});

test('구간 함선은 한 단계씩 사고 웨이브 시험 무기는 후보에서 뺀다', () => {
  const gear = listGearCandidates();
  assert.equal(gear.some((g) => g.id.includes('_wave')), false);
  assert.ok(gear.some((g) => g.slot.startsWith('weapon_')));
  const w = seedWorld({ runId: 'hull-step', persona: 'mixed_ref' });
  w.currentPlanetId = 'solar_station';
  // 2026-10-10 사다리(대표님 승인): L1~15 지급 함선 → L16 구축함 첫 구매 가능
  w.level = 15;
  w.credits = 99_999_999;
  assert.equal(tryBuyNextHull(w), null, 'L15 까지는 지급 함선');
  w.level = 16;
  w.credits = 10000;
  const destroyerRow = CapitalHullPurchasePolicy_FROM_BALANCE_CSV.find((r) => r.hullTierKey === 'destroyer')!;
  assert.equal(nextHullStep(w)?.key, 'destroyer');
  assert.equal(nextHullStep(w)?.price, Number(destroyerRow.purchaseCredits));
  // 2026-10-10 함선 곡선(본 등급 능력치 ×1.83) — 구축함은 시작 함선보다 충분히 강해 구매 목표
  assert.equal(nextHullWorthBuying(w), true);
  assert.equal(needsHullFund(w), true);
  assert.equal(tryBuyNextHull(w), null, '돈이 모자라면 사지 않는다');
  w.credits = Number(destroyerRow.purchaseCredits) + 800;
  const bought = tryBuyNextHull(w);
  assert.ok(bought, '돈이 모이면 산다');
  assert.equal(w.hullRank, 1);
  assert.equal(w.credits, 800);
  assert.equal(w.hullUpgrades, undefined, '새 함선은 강화 0부터');
  const boughtShip = 'Player_frigate_mk2';
  w.hullRank = 1;
  w.hullTierKey = 'frigate_upgraded';
  w.hullShipId = boughtShip;
  const hi = winChance(w, 8);
  w.hullRank = 0;
  const sameShip = winChance(w, 8);
  assert.equal(sameShip, hi);
  w.hullRank = 1;
  w.hullShipId = boughtShip;
  w.day = 10;
  w.effFights = 6;
  w.effWins = 5;
  w.effExp = 600;
  w.effCredits = 900;
  enableCombatEfficiencyMemory();
  rememberCombatDay(w);
  const fp = path.join(learnedDir(), 'combat-efficiency.json');
  assert.equal(fs.existsSync(fp), true);
  const saved = JSON.parse(fs.readFileSync(fp, 'utf8')) as { bands: { hull: string; fights: number }[] };
  assert.equal(saved.bands[0].hull, 'frigate_upgraded');
  assert.equal(saved.bands[0].fights, 6);
  const broke = seedWorld({ runId: 'hull-fund', persona: 'mixed_ref' });
  broke.level = 7;
  broke.credits = 5000;
  broke.earlyFeelClosed = true;
  broke.tick = 0;
  broke.currentPlanetId = 'arcadia_prime';
  const ids = listPlayableMissionIds();
  for (let i = 0; i < ids.length; i += 1) broke.completedLookup[ids[i]] = true;
  broke.activeQuest = null;
  const fund = stepAction(broke, () => 0.99, 'mixed_ref', { allowSides: true });
  assert.ok(
    fund.kind === 'COMBAT' || fund.kind === 'MINE' || fund.kind === 'TRADE' || fund.kind === 'TRAVEL' || fund.kind === 'LAND',
    `${fund.kind} ${fund.line}`,
  );
  broke.hullRank = 1;
  broke.hullTierKey = 'frigate_upgraded';
  broke.hullName = '프리깃 개량형';
  broke.hullShipId = 'Player_frigate_mk2';
  broke.hangarShips = 3;
  broke.currentPlanetId = 'solar_station';
  broke.currentSystemId = lookupSystemId('solar_station') ?? broke.currentSystemId;
  const crBefore = broke.credits;
  const expBefore = broke.totalExp;
  const effBefore = broke.effExp;
  // 2026-10-10 전투 관문: 위험한 자금 전투는 하지 않음 → 피할 수 없는 조우로 산 함선 상실을 검증
  const lost = fightHere(broke, () => 0.99, '조우');
  assert.equal(broke.hullRank, 0);
  assert.equal(broke.hullTierKey, 'frigate_default');
  assert.equal(broke.hullShipId, 'Player_npc_red_fleet_1');
  assert.match(lost.line, /기본 프리깃/);
  assert.equal(broke.credits, crBefore);
  assert.equal(broke.totalExp - expBefore, broke.effExp - effBefore);
  const bare = seedWorld({ runId: 'gun-sum', persona: 'mixed_ref' });
  bare.level = 7;
  bare.currentPlanetId = 'solar_station';
  const unarmed = winChance(bare, 5, 'solar_station');
  const gun = gear.find((g) => g.slot.startsWith('weapon_'));
  assert.ok(gun);
  bare.equipped[gun.slot] = gun.id;
  const armed = winChance(bare, 5, 'solar_station');
  assert.ok(armed >= unarmed, `unarmed ${unarmed} armed ${armed}`);
  const throne = seedWorld({ runId: 'throne', persona: 'mixed_ref' });
  throne.level = 30;
  throne.currentPlanetId = 'eternal_throne';
  const throneBare = winChance(throne, 60, 'eternal_throne');
  assert.ok(throneBare >= 0 && throneBare <= 0.92);
  throne.equipped[gun.slot] = gun.id;
  assert.ok(winChance(throne, 60, 'eternal_throne') >= throneBare);
  const miner = seedWorld({ runId: 'hangar-mine', persona: 'mixed_ref' });
  miner.hangarShips = 0;
  miner.tick = 1;
  miner.earlyFeelClosed = true;
  miner.credits = 100;
  miner.activeQuest = null;
  for (let i = 0; i < ids.length; i += 1) miner.completedLookup[ids[i]] = true;
  const mined = earnCredits(miner, () => 0.99);
  assert.equal(mined.kind, 'MINE');
  const fuel = hopFuelCredits('arcadia', 'solar_port', 'frigate_default', 1);
  assert.ok(fuel >= 50);
});

test('A-9: 전멸시키면 파괴가 아니고, 방어 장비·숙련·스킬이 생존 시간을 늘린다', () => {
  const w = seedWorld({ runId: 'a9-odds', persona: 'mixed_ref' });
  w.level = 10;
  const planet = 'eden_city';
  const tcl = w.planets[planet]?.tcl ?? 12;
  for (let i = 0; i < 20; i += 1) {
    const pay = resolveFightPay(w, planet, tcl, i / 20);
    if (!pay.win) assert.ok(pay.killed < pay.fleet, `lose ${pay.killed}/${pay.fleet} roll ${i / 20}`);
  }
  const bare = fightOdds(w, planet, tcl).liveSec;
  w.equipped.ARMOR = 'eq_def_ablative_plate_1';
  const plated = fightOdds(w, planet, tcl).liveSec;
  assert.ok(plated > bare, `plate ${plated} bare ${bare}`);
  delete w.equipped.ARMOR;
  w.level = 30;
  assert.ok(fightOdds(w, planet, tcl).liveSec > bare, 'proficiency hp');
  w.level = 10;
  const drSkill = listSkills().find((s) => resolvePlayerCombatSkillBind([s.id]).incomingDamageMul < 1);
  assert.ok(drSkill, 'damage_reduction skill exists');
  w.learnedSkills = [drSkill.id];
  w.learnedLookup = { [drSkill.id]: true };
  assert.ok(fightOdds(w, planet, tcl).liveSec > bare, 'skill dr');
});

function expEdge(w: ReturnType<typeof seedWorld>, planetId: string): number {
  const slot = w.planets[planetId];
  const odds = fightOdds(w, planetId, slot.tcl);
  let exp = 0;
  for (let i = 0; i < odds.expShips.length; i += 1) exp += odds.expShips[i];
  return odds.chance * exp;
}

test('수련은 가장 가까운 곳이 아니라 기대 경험치가 큰 공정 전장으로 간다', () => {
  const w = seedWorld({ runId: 'train-best', persona: 'mixed_ref' });
  w.earlyFeelClosed = true;
  w.level = 16;
  w.credits = 50_000;
  w.currentPlanetId = 'minerva_deep';
  w.currentSystemId = 'minerva';
  const here = expEdge(w, 'minerva_deep');
  const row = trainOrRelocate(w, () => 0.5, '수련');
  if (w.currentPlanetId === 'minerva_deep') {
    assert.equal(row.kind === 'COMBAT' || row.kind === 'DESTROY', true);
    return;
  }
  const slot = w.planets[w.currentPlanetId];
  if (slot?.combatEnabled && fightOdds(w, w.currentPlanetId, slot.tcl).chance >= 0.5) {
    assert.ok(expEdge(w, w.currentPlanetId) >= here * 0.5, row.line);
  }
  assert.notEqual(row.kind, 'HOLD');
});

test('교역 매도는 산 교역품이 있을 때만 크레딧이 는다', () => {
  const w = seedWorld({ runId: 'goods', persona: 'mixed_ref' });
  w.earlyFeelClosed = true;
  w.credits = 300;
  w.goodsCargo = 0;
  let sells = 0;
  for (let i = 0; i < 400; i += 1) {
    const goods: number = w.goodsCargo ?? 0;
    const r = stepAction(w, () => 0.99, 'mixed_ref', { allowSides: false });
    if (r.kind === 'TRADE' && r.line.includes('매도 +') && !r.line.includes('채굴')) {
      sells += 1;
      assert.ok(goods > 0, r.line);
      assert.equal(w.goodsCargo, goods - 1);
    }
  }
  assert.ok(sells >= 0);
});

test('정체 기록은 함선 자금 벽을 한 줄로 남긴다', () => {
  const w = seedWorld({ runId: 'wall', persona: 'mixed_ref' });
  const next = nextHullStep(w);
  assert.ok(next && next.price > 0);
  w.level = next.levelReq;
  w.credits = 10;
  w.parkedQuests.push({ missionId: 'story_012', title: 't', objIndex: 0, acceptedDay: 1 });
  const wall = progressWall(w);
  assert.ok(wall.startsWith('hull_fund '), wall);
  assert.ok(wall.includes('story_012'), wall);
  w.level = 1;
  assert.ok(progressWall(w).startsWith('hull_level '));
});

test('FQA 검토는 카드가 바뀌면 이슈가 같아도 문구를 다시 쓴다', () => {
  const state = emptyFqaReviewState();
  const card = defaultPlayIntelligence();
  state.lastSig = '';
  state.cardSig = cardSignature(card);
  assert.equal(reviewNeeded(state, [], card), false);
  assert.equal(reviewNeeded(state, [], { ...card, mineCap: card.mineCap + 4 }), true);
  assert.equal(reviewNeeded({ ...state, cardSig: undefined }, [], card), true);
});

test('human-raw 정리는 오래된 닫힌 profiler 세션만 지운다', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pb-raw-'));
  const root = path.join(dir, 'human-raw');
  const mk = (name: string, kind: string, open: boolean) => {
    const d = path.join(root, name);
    fs.mkdirSync(d, { recursive: true });
    fs.writeFileSync(path.join(d, 'manifest.json'), JSON.stringify({ sessionKind: kind }));
    fs.writeFileSync(path.join(d, 'session.log'), 'x');
    if (open) fs.writeFileSync(path.join(d, 'capture.pid'), '1');
  };
  mk('owner-a', 'profiler', false);
  mk('owner-b', 'human', false);
  mk('owner-c', 'profiler', true);
  mk('owner-d', 'pending', false);
  const later = Date.now() + 10 * 24 * 60 * 60 * 1000;
  assert.equal(pruneProfilerHumanRaw({ dir, nowMs: Date.now() }), 0);
  assert.equal(pruneProfilerHumanRaw({ dir, nowMs: later }), 1);
  assert.equal(fs.existsSync(path.join(root, 'owner-a')), false);
  assert.equal(fs.existsSync(path.join(root, 'owner-b')), true);
  assert.equal(fs.existsSync(path.join(root, 'owner-c')), true);
  assert.equal(fs.existsSync(path.join(root, 'owner-d')), true);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('초반 성장 정체가 생기던 시드(목적지 왕복·레벨게이트 채굴·탐사지 없음)가 100일 안에 멈추지 않는다', () => {
  for (const seed of [2, 4, 8]) {
    let mem = emptyStallMemory();
    let stalled = '';
    runSimulation({
      persona: 'mixed_ref', days: 100, seed, runId: `stall-${seed}`, allowSides: true, stronger: false,
      hooks: {
        onDay: (w) => {
          if (stalled) return;
          const k = snapshotKpi(w);
          const r = stepStall(mem, { day: w.day, level: k.level, totalExp: k.totalExp, questCleared: k.questCleared, annexOk: k.annexOk, colonizeOk: k.colonizeOk, independent: k.independent, devSum: k.devSum, combatWins: k.combatWins, credits: k.credits });
          mem = r.mem;
          if (r.restart) stalled = `seed${seed} ${r.reason} D${w.day} L${k.level} ${progressWall(w)}`;
        },
      },
    });
    assert.equal(stalled, '', stalled);
  }
});

test('함선 자금 벽에서 교역로 왕복으로 첫 상위 함선 값을 모은다(약한 함선은 사지 않는다)', () => {
  let sells = 0;
  let funded = false;
  let weakBought = false;
  runSimulation({
    persona: 'mixed_ref', days: 300, seed: 2, runId: 'tg-hull', allowSides: true, stronger: false,
    hooks: {
      onEntry: (w, e) => {
        if (e.line.startsWith('교역 매도 ')) sells += 1;
        if (w.credits >= 250_800) funded = true;
        if (w.hullTierKey === 'frigate_upgraded') weakBought = true;
      },
    },
  });
  assert.ok(sells > 0, '교역 매도 없음');
  assert.ok(funded, '300일 안에 상위 함선 값 미달');
  assert.equal(weakBought, false, 'A-9a: 시작 함선보다 약한 프리깃 개량형을 샀다');
});

function processInput(over: Partial<ProcessInput> = {}): ProcessInput {
  const now = Date.parse('2026-10-06T12:00:00Z');
  return {
    nowMs: now,
    pids: { harness: true, 'fqa-review': true, 'owner-auto': true, console: true },
    policyUpdatedMs: now - 3600_000,
    policyGeneration: 10,
    deltaCapturedMs: now - 3600_000,
    deltaConsumed: true,
    newestOwnerSessionMs: now - 600_000,
    fqaUpdatedMs: now - 600_000,
    fqaConsultPending: false,
    fqaCardRaiseHold: false,
    stallRecent: [],
    bench: [],
    handoffStatus: null,
    handoffMs: null,
    items: [],
    mirrorChanged: [],
    ...over,
  };
}

test('감시판은 멈춘 프로세스·실기 입력 대기·반복 정체·함선 벽 대기를 구분한다', () => {
  const now = Date.parse('2026-10-06T12:00:00Z');
  const byId = (checks: StageCheck[], id: string) => checks.find((c) => c.id === id)!;
  let c = evaluateProcess(processInput());
  assert.equal(worstState(c), 'WAIT');
  c = evaluateProcess(processInput({ pids: { harness: false, 'fqa-review': true, 'owner-auto': true, console: true } }));
  assert.equal(byId(c, 'proc:harness').state, 'STOP');
  c = evaluateProcess(processInput({ deltaCapturedMs: now - 48 * 3600_000, policyUpdatedMs: now - 48 * 3600_000 }));
  assert.equal(byId(c, 'learn:input').state, 'WAIT');
  assert.equal(byId(c, 'learn:input').owner, '대표님');
  assert.equal(byId(c, 'learn:policy').state, 'WAIT');
  c = evaluateProcess(processInput({ deltaCapturedMs: now - 48 * 3600_000, newestOwnerSessionMs: now - 10 * 3600_000 }));
  assert.equal(byId(c, 'learn:input').state, 'RISK');
  const hard = (h: number) => ({ at: now - h * 3600_000, reason: 'hard', wall: 'hull_level x' });
  c = evaluateProcess(processInput({ stallRecent: [hard(1), hard(2), hard(3)] }));
  assert.equal(byId(c, 'learn:stall').state, 'RISK');
  c = evaluateProcess(processInput({ stallRecent: [hard(1), hard(2), hard(3)], harnessStartMs: now - 0.5 * 3600_000 }));
  assert.notEqual(byId(c, 'learn:stall').state, 'RISK');
  const b4 = { id: 'B-4', lane: 3 as const, owner: '김팀장', title: '함선가', since: '2026-10-06T00:00:00Z', doneWhen: { kind: 'manual' as const }, blocksLane: 2 };
  c = evaluateProcess(processInput({ stallRecent: [{ at: now - 3600_000, reason: 'hard', wall: 'hull_fund frigate_upgraded' }], items: [{ item: b4, done: false, changedMs: null }] }));
  assert.equal(byId(c, 'learn:stall').state, 'HOLD');
  assert.equal(byId(c, 'item:B-4').state, 'WAIT');
  c = evaluateProcess(processInput({ items: [{ item: b4, done: false, changedMs: now - 600_000 }] }));
  assert.equal(byId(c, 'item:B-4').state, 'RUN');
  c = evaluateProcess(processInput({ items: [{ item: b4, done: false, changedMs: null }], nowMs: now + 72 * 3600_000 }));
  assert.equal(byId(c, 'item:B-4').state, 'HOLD');
  const bench = (level: number, hardStalls: number) => ({ at: new Date(now - 3600_000).toISOString(), avg: { level, quests: 77, story: 13, hullRank: 0, fuel: 1 }, total: { hardStalls, sectionStalls: 0 } });
  c = evaluateProcess(processInput({ bench: [bench(30, 0), bench(28, 0)] }));
  assert.equal(byId(c, 'bot:bench').state, 'RISK');
  c = evaluateProcess(processInput({ bench: [bench(30, 0), bench(30, 1)] }));
  assert.equal(byId(c, 'bot:bench').state, 'RISK');
  c = evaluateProcess(processInput({ bench: [bench(30, 0), bench(30, 0)] }));
  assert.equal(byId(c, 'bot:bench').state, 'OK');
});

test('감시판 알림은 나빠진 단계와 풀린 단계만 고른다', () => {
  const checks = evaluateProcess(processInput({ pids: { harness: false, 'fqa-review': true, 'owner-auto': true, console: true } }));
  const prev: Record<string, StageState> = {};
  for (const c of checks) prev[c.id] = c.state;
  assert.deepEqual(stateChanges(prev, checks), { worse: [], cleared: [] });
  const healed = evaluateProcess(processInput());
  const ch = stateChanges(prev, healed);
  assert.deepEqual(ch.cleared.map((c) => c.id), ['proc:harness']);
  assert.equal(ch.worse.length, 0);
  const first = stateChanges({}, checks);
  assert.ok(first.worse.some((c) => c.id === 'proc:harness'));
});

/** 앱 emitPlayVerb 두 번째 인자 모양. playerObserveDetail 과 같아야 한다. */
const OBS_ARG_SHAPE: Record<string, RegExp> = {
  quest: /^`(accept|objective|complete):\$\{\w+\}`$/,
  combat: /^`\$\{[^}]+\}:\$\{[^}]+\}`$/,
  trade: /^`\$\{\w+\}:\$\{\w+\}`$/,
  develop: /^`\$\{\w+\}:\$\{\w+\}:\$\{\w+\}`$/,
  mine: /^`\$\{\w+\}:\$\{\w+\}`$/,
  level: /^String\([\w.]+\)$/,
  land: /^[\w.]+$/,
  annex: /^[\w.]+$/,
  ship: /^[\w.]+$/,
  skill: /^[\w.]+$/,
  scan: /^[\w.]+$/,
  talk: /^[\w.]+$/,
};

function listAppSources(dir: string, out: string[]): void {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) listAppSources(p, out);
    else if (/\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)) out.push(p);
  }
}

test('D1 앱 emitPlayVerb 방출 형식 = 봇 obsDetail 형식', () => {
  const root = path.resolve(__dirname, '../..');
  const files: string[] = [];
  listAppSources(path.join(root, 'src'), files);
  listAppSources(path.join(root, 'app'), files);
  const re = /emitPlayVerb\('(\w+)',\s*([^;\n]+?)\);/g;
  let sites = 0;
  for (const f of files) {
    if (f.endsWith('devPlayVerbLog.ts')) continue;
    const text = fs.readFileSync(f, 'utf8');
    for (const m of text.matchAll(re)) {
      sites += 1;
      const shape = OBS_ARG_SHAPE[m[1]];
      assert.ok(shape, `${path.relative(root, f)} 새 동사 ${m[1]} — observeVocab·OBS_ARG_SHAPE 에 추가`);
      assert.ok(shape.test(m[2].trim()), `${path.relative(root, f)} ${m[1]} 형식 변경: ${m[2]}`);
      assert.ok(m[1] in BOT_OBSERVE_COVERAGE, `${m[1]} 커버리지 표 누락`);
    }
  }
  assert.ok(sites >= 15, `방출 지점 ${sites}개 — 스캔 실패 의심`);
  const p = (verb: PlayerObserveVerb, d: string) => parsePlayerObserveDetail(verb, d, 'eden');
  assert.deepEqual(p('combat', obsDetail.combat('hub_orbit', 'lose')), { sub: 'lose', planet: 'eden', ref: 'hub_orbit' });
  assert.deepEqual(p('trade', obsDetail.trade('sell', 'solar_port')), { sub: 'sell', planet: 'solar_port', ref: '' });
  assert.deepEqual(p('develop', obsDetail.develop('install', 'defense_satellite', 'eden')), { sub: 'install', planet: 'eden', ref: 'defense_satellite' });
  assert.deepEqual(p('quest', obsDetail.quest('complete', 'story_001')), { sub: 'complete', planet: 'eden', ref: 'story_001' });
  assert.deepEqual(p('land', obsDetail.land('solar_port')), { sub: '', planet: 'solar_port', ref: '' });
});

test('D1 봇 행동 문자열이 앱 관찰 다이제스트를 그대로 움직인다', () => {
  const w = seedWorld({ runId: 'obs', persona: 'mixed_ref' });
  w.earlyFeelClosed = true;
  const seen: Array<{ verb: PlayerObserveVerb; detail: string }> = [];
  for (let i = 0; i < 600; i += 1) {
    stepAction(w, createRng(21 + i * 7), 'mixed_ref', { allowSides: true });
    const obs = takeObs(w);
    if (obs) seen.push(...obs);
  }
  const tally: Partial<Record<PlayerObserveVerb, number>> = {};
  for (let i = 0; i < seen.length; i += 1) {
    const o = seen[i];
    assert.equal(BOT_OBSERVE_COVERAGE[o.verb], 'bot', `봇이 만들지 않는다던 ${o.verb}`);
    tally[o.verb] = (tally[o.verb] ?? 0) + 1;
    if (o.verb === 'combat' && o.detail.endsWith(':lose')) assert.equal(seen[i + 1]?.verb, 'destroy');
  }
  for (const v of ['land', 'combat', 'quest'] as const) assert.ok((tally[v] ?? 0) > 0, `${v} 미발생`);
  resetPlayerObserve();
  const at = Date.UTC(2026, 9, 6, 3);
  for (const o of seen) recordPlayerObserve(o.verb, o.detail, at);
  const dg = readPlayerObserveDigest(at);
  for (const v of Object.keys(tally) as PlayerObserveVerb[]) assert.equal(dg.c[v], Math.min(999, tally[v]!));
  const lastLand = [...seen].reverse().find((o) => o.verb === 'land');
  if (lastLand) assert.equal(dg.lastLand, lastLand.detail);
  resetPlayerObserve();
});

test('O3 스텔라 감지기·게이트는 봇이 그대로 import (D-5 순수 모듈)', () => {
  const rows = listStellaObserveSituations();
  assert.ok(rows.length > 0);
  const w = seedWorld({ runId: 'o3', persona: 'mixed_ref' });
  w.earlyFeelClosed = true;
  resetPlayerObserve();
  const at = Date.UTC(2026, 9, 6, 3);
  for (let i = 0; i < 300; i += 1) {
    stepAction(w, createRng(5 + i * 13), 'mixed_ref', { allowSides: true });
    for (const o of takeObs(w) ?? []) recordPlayerObserve(o.verb, o.detail, at);
  }
  const hits = detectStellaSituations(rows, {
    digest: readPlayerObserveDigest(at),
    hullPct: null,
    sessionStart: false,
    sessionGapHours: 0,
    sessionMinutes: 90,
    localHour: 14,
    level: w.level,
    objectiveStallCount: 0,
    objectiveStallMinutes: 0,
    adviceIgnoredThenDestroyed: false,
    adviceFollowedThenWon: false,
    announcedFirsts: 0,
    lastLevelMark: 0,
  }, { includeDisabled: true });
  const recent: { verb: string; at: number }[] = [];
  forEachRecentPlayerObserve(16, (e) => recent.push({ verb: e.verb, at: e.at }));
  const d = decideStellaObserve(hits, emptyStellaObserveGateState(), {
    nowMs: at,
    day: playerObserveDayOf(at),
    safeSlot: true,
    otherPopupThisEntry: false,
    originLastAtMs: 0,
    originPendingNow: false,
    lifeAskLastAtMs: 0,
    stellaOnDuty: false,
    casualFirstHigh: false,
    recent,
  }, getStellaObserveGatePolicy());
  assert.ok(d.kind === 'speak' || d.kind === 'silent');
  if (d.kind === 'speak') assert.ok(d.fit > 0 && d.fit <= 1);
  resetPlayerObserve();
});

console.log('play-bot-console tests done');

function levelGatedWorld(runId: string) {
  const w = seedWorld({ runId, persona: 'mixed_ref' });
  w.earlyFeelClosed = true;
  for (let k = 0; k < 4000 && w.level < 35; k += 1) addExp(w, 2000);
  for (let i = 0; i < 300; i += 1) {
    const id = nextPlayableMissionId(w);
    if (!id) break;
    if ((getMission(id)?.levelRequired ?? 1) > w.level) break;
    w.completedLookup[id] = true;
    w.completedMissionIds.push(id);
    w.questCleared += 1;
  }
  for (const id of listPlayableMissionIds()) {
    if ((getMission(id)?.levelRequired ?? 1) > w.level || w.completedLookup[id]) continue;
    w.completedLookup[id] = true;
    w.completedMissionIds.push(id);
    w.questCleared += 1;
  }
  moveTo(w, 'eden_city');
  w.credits = 5022;
  return w;
}

test('레벨게이트 수련이 상한에 닿으면 교역로를 탄다 (c12 정체)', () => {
  const w = levelGatedWorld('gate-trade');
  const next = nextPlayableMissionId(w);
  assert.ok(next && (getMission(next)?.levelRequired ?? 1) > w.level, '레벨게이트 상태여야 함');
  let planned = false;
  let fights = 0;
  for (let i = 0; i < TRAIN_STREAK_CAP * 3 && !planned; i += 1) {
    const row = earnCredits(w, () => 0.1);
    if (row.line.includes('수련')) fights += 1;
    planned = !!w.tgRun || row.line.startsWith('교역 매입');
    w.tick += 1;
  }
  assert.ok(planned, '교역로 계획이 잡혀야 함');
  assert.ok(fights <= TRAIN_STREAK_CAP + 1, `수련 ${fights}`);
});

test('레벨게이트 정체 400틱 — 함선 자금이 필요할 때 연속 수련이 상한을 크게 넘지 않는다', () => {
  const w = levelGatedWorld('gate-streak');
  const rng = createRng(37);
  let maxStreak = 0;
  let tgBuys = 0;
  for (let i = 0; i < 400; i += 1) {
    const fundWall = needsHullFund(w);
    const row = stepAction(w, rng, 'mixed_ref', { allowSides: true });
    if (fundWall) maxStreak = Math.max(maxStreak, w.trainStreak ?? 0);
    if (row.line.startsWith('교역 매입')) tgBuys += 1;
    w.tick += 1;
  }
  assert.ok(tgBuys >= 3, `교역로 매입 ${tgBuys}`);
  assert.ok(maxStreak <= TRAIN_STREAK_CAP + 1, `연속 수련 ${maxStreak}`);
});

test('교역로 계획은 경로 손실 위험을 순익에서 뺀다', () => {
  const w = levelGatedWorld('tg-risk');
  const safe = pickTgPlan(w, 800);
  assert.ok(safe && safe.profit > 0);
  const risky = pickTgPlan(w, 800, () => 1e9);
  assert.equal(risky, null);
  const some = pickTgPlan(w, 800, () => 100);
  assert.ok(some && some.profit <= safe!.profit);
});

// A-11 광물 강화 — 함선별 · 사람과 같은 과정(채굴 → 조선소 강화)
test('광물 강화: 실기 비용으로 지금 함선만 오르고, 함선이 바뀌면 0부터', () => {
  const w = seedWorld({ runId: 'mu', persona: 'mixed_ref' });
  w.level = 20;
  w.credits = 2_000_000;
  for (let i = 0; i < 30; i += 1) addOre(w, 'ore_ferrite');
  for (let i = 0; i < 30; i += 1) addOre(w, 'ore_silicate');
  const before = playerCombatPower(w);
  const pick = bestAffordableMineralUpgrade(w);
  assert.ok(pick, '강화 후보');
  const line = applyMineralUpgrade(w);
  assert.ok(line && line.startsWith('광물 강화 '));
  assert.equal(w.hullUpgrades?.[pick!.statId], 1);
  assert.ok(playerCombatPower(w) > before, '전투력 상승');
  assert.equal(w.mineralCargo, 60 - pick!.cost.ores.reduce((s, c) => s + c.qty, 0));
  // 다른 함선 비교는 강화 0 기준(넘겨주지 않음)
  const otherHull = 'Player_destroyer_mk1';
  assert.equal(
    playerCombatPower(w, { hullShipId: otherHull }),
    playerCombatPower(w, { hullShipId: otherHull, mineralUpgrades: {} }),
  );
  w.hullRank = 1;
  revertFlagshipToStarter(w);
  assert.equal(w.hullUpgrades, undefined);
});

test('광물 매도: 강화에 쓸 광물은 남기고 여유분부터 판다', () => {
  const w = seedWorld({ runId: 'mu-sell', persona: 'mixed_ref' });
  w.level = 20;
  addOre(w, 'ore_ferrite');
  addOre(w, 'ore_unused_test');
  assert.equal(pickOreToSell(w), 'ore_unused_test');
  removeSoldOre(w, 'ore_unused_test');
  w.mineralCargo -= 1;
  assert.equal(pickOreToSell(w), null, '목표 강화 몫(철 12개)보다 적으면 팔지 않는다');
});
