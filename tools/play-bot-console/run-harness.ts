/**
 * 플레이봇콘솔 하니스 — Node 전용. 앱/Expo/세이브 미접촉.
 * npx tsx tools/play-bot-console/run-harness.ts --days 7 --persona front_annex --live
 */
import { PERSONAS, resolvePersona, STAGE1_PERSONAS, STAGE2_PERSONAS } from './src/personas';
import { snapshotKpi } from './src/world';
import { formatMudLine, formatHud, pushMudTail } from './src/mud';
import {
  appendJournal,
  appendTimeline,
  beginRecording,
  endRecording,
  ensureRunPaths,
  isRecording,
  writeCurrentRun,
  writeFinalKpi,
  writeLiveView,
  writeStatus,
} from './src/io';
import { persistLearningNow, recordDailyLearning, recordLearning } from './src/learn';
import { adaptPolicy, learnedDir, loadPolicy } from './src/policy';
import { commitLearnCycle, readCombatMethod } from './src/learnCycle';
import { flushCellLap, loadCellLoop } from './src/cellLoop';
import { commitGameIssues, loadGameIssues, resetGameIssueRunMemory } from './src/gameIssues';
import { reloadPlayIntelligence } from './src/playIntelligence';
import { loadStallReplay, observeStall, resetStallStreak, stallRestartCount } from './src/stallReplay';
import { reloadHumanSeedIfChanged } from './src/humanSeed';
import { flushLearnedWrites } from './src/learnedIo';
import { enableCombatEfficiencyMemory, progressWall, rememberCombatDay } from './src/combatEfficiency';
import { resetRawPlayData } from './src/housekeep';
import { compareKpi, formatCompare } from './src/compare';
import { runSimulation } from './src/simulate';
import {
  campaignDaysForHarness,
  nextCampaignRunId,
  nextCampaignSeed,
  shouldLoopNextCampaign,
} from './src/learnGate';
import type { AnalyzeReport, JournalEntry, PersonaId, WorldState } from './src/types';
import { continuePastWall, resolveUntilWallMs } from './src/untilWall';
import { takeObs } from './src/observeVocab';

function arg(flag: string, fallback: string): string {
  const i = process.argv.indexOf(flag);
  if (i < 0 || i + 1 >= process.argv.length) return fallback;
  return process.argv[i + 1];
}

function has(flag: string): boolean {
  return process.argv.includes(flag);
}

function emit(
  world: WorldState,
  paths: ReturnType<typeof ensureRunPaths>,
  mudTail: string[],
  entry: JournalEntry,
): void {
  if (entry.silent) return;
  const obs = takeObs(world);
  if (obs) entry.obs = obs;
  const line = formatMudLine(world, entry);
  pushMudTail(mudTail, line, 80);
  appendJournal(paths, entry, line);
  writeLiveView(paths, world, mudTail);
  if (!has('--quiet')) console.log(line);
}

function resolveStage(): number {
  if (has('--stage2')) return 2;
  const n = Number(arg('--stage', '1')) || 1;
  if (n >= 3) return 3;
  if (n === 2) return 2;
  return 1;
}

async function main(): Promise<void> {
  const stage = resolveStage();
  const minPersonaStage = stage >= 2 ? 2 : 1;
  const personaId = arg('--persona', 'mixed_ref') as PersonaId;
  resolvePersona(personaId, minPersonaStage as 1 | 2);
  const untilClose = has('--until-close') || !has('--days');
  const requestedDays = untilClose ? 0 : Math.max(1, Math.min(3650, Number(arg('--days', '7')) || 7));
  const campaignDays = campaignDaysForHarness(untilClose, requestedDays || 7);
  const live = has('--live');
  const liveMs = Math.max(20, Number(arg('--live-ms', '120')) || 120);
  const seed = Number(arg('--seed', String(Date.now() % 1_000_000_007))) || 1;
  const baseRunId = arg('--run-id', `pb-${new Date().toISOString().replace(/[:.]/g, '').slice(0, 15)}-${personaId}`);
  const allowSides = stage >= 2;
  const learn = !has('--no-learn');
  const comparePath = arg('--compare', '');
  const strong = stage >= 3;
  let untilWall = resolveUntilWallMs(arg('--until-wall', ''));
  let wallRolled = false;
  const allowed = stage >= 2 ? STAGE2_PERSONAS : STAGE1_PERSONAS;
  if (!allowed.includes(personaId)) {
    throw new Error(`persona ${personaId} not in stage ${stage} allowlist`);
  }

  beginRecording();
  const stop = (): void => {
    persistLearningNow();
    flushLearnedWrites();
    endRecording(has('--console-session') ? 'console_close' : 'signal');
  };
  process.once('SIGINT', () => {
    stop();
    process.exit(0);
  });
  process.once('SIGTERM', () => {
    stop();
    process.exit(0);
  });
  process.once('SIGHUP', () => {
    /* 창 분리와 기록 중지를 묶지 않음 */
  });

  if (!has('--quiet')) {
    console.log('=== Arcfire 플레이봇콘솔 ===');
    console.log(`persona=${personaId} (${PERSONAS[personaId].titleKo})  stage=${stage}  ${untilClose ? 'until-close · 한 세계 연속 · 학습 유지' : `days=${campaignDays}`}  seed=${seed}`);
    console.log(`run=${baseRunId}`);
    console.log('명시 종료 또는 콘솔 창 종료까지 지속 · 파괴 시 재탑승 · 주기 분석 후 정책 자체 개선');
    if (untilWall > 0) {
      console.log(`벽시계 ${new Date(untilWall).toISOString()} 는 학습 체크만 · 기록은 다음 08:00으로 넘김`);
    }
    console.log('앱 빌드 미포함 · 대표님 세이브 미기록');
    console.log('');
  }

  let campaign = 0;
  let lastWorld: WorldState | null = null;
  let lastPaths: ReturnType<typeof ensureRunPaths> | null = null;
  let lastAnalyze = '';
  let stallRestart = false;
  loadStallReplay(learnedDir());
  loadGameIssues(learnedDir());
  enableCombatEfficiencyMemory();

  while (isRecording()) {
    stallRestart = false;
    resetStallStreak();
    resetGameIssueRunMemory();
    // 수집 데몬이 대표님 세션을 넣었으면 이번 캠페인부터 반영(T5)
    if (reloadHumanSeedIfChanged(learnedDir()) && campaign > 0 && !has('--quiet')) {
      console.log('대표님 시드 갱신 감지 → 이번 캠페인부터 반영');
    }
    loadCellLoop(learnedDir());
    const campaignRunId = nextCampaignRunId(baseRunId, campaign);
    const campaignSeed = nextCampaignSeed(seed, campaign);
    const paths = ensureRunPaths(campaignRunId);
    const mudTail: string[] = [];
    const reports: AnalyzeReport[] = [];
    writeCurrentRun(campaignRunId);
    if (campaign > 0 && !has('--quiet')) {
      console.log(`캠페인#${campaign} 재시작 run=${campaignRunId} seed=${campaignSeed} days=${campaignDays}`);
    }

    const sim = runSimulation({
      persona: personaId,
      days: campaignDays,
      seed: campaignSeed,
      runId: campaignRunId,
      allowSides,
      stronger: strong,
      shouldContinue: () => {
        if (!isRecording()) return false;
        if (stallRestart) return false;
        const rolled = continuePastWall(untilWall, Date.now());
        if (rolled.rolled) {
          untilWall = rolled.untilWallMs;
          wallRolled = true;
        }
        return true;
      },
      hooks: {
        onEntry: (world, entry) => {
          if (wallRolled) {
            wallRolled = false;
            emit(world, paths, mudTail, {
              t: Date.now(),
              day: world.day,
              tick: world.tick,
              kind: 'LEARN',
              line: `벽시계 08:00 경과 · 기록 유지 · 다음 ${new Date(untilWall).toISOString()}`,
            });
          }
          emit(world, paths, mudTail, entry);
          if (world.tick % 4 === 0) appendTimeline(paths, world, entry.kind);
          if (live) {
            Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, liveMs);
          }
        },
        onDay: (world, report, dayJournal) => {
          rememberCombatDay(world);
          const intel = reloadPlayIntelligence(learnedDir());
          if (intel.changed) {
            emit(world, paths, mudTail, {
              t: Date.now(),
              day: world.day,
              tick: world.tick,
              kind: 'LEARN',
              line: `플레이지능 갱신 · 채굴상한 ${intel.card.mineCap} · 수련선 ${intel.card.fairFightMin}`,
            });
          }
          if (reloadHumanSeedIfChanged(learnedDir()) && !has('--quiet')) {
            emit(world, paths, mudTail, {
              t: Date.now(),
              day: world.day,
              tick: world.tick,
              kind: 'LEARN',
              line: '대표님 시드 갱신 · 진행 세계는 유지',
            });
          }
          if (reports.length >= 21) reports.shift();
          reports.push(report);
          if (learn) {
            const learned = recordDailyLearning(world, report, dayJournal);
            const ad = adaptPolicy(personaId, report, learned);
            emit(world, paths, mudTail, {
              t: Date.now(),
              day: world.day,
              tick: world.tick,
              kind: 'LEARN',
              line: ad.skipped
                ? `성장 L${report.kpi.level} exp=${report.kpi.totalExp} · ${ad.notes.join(' / ')}`
                : `정책#${loadPolicy().generation} · ${ad.notes.join(' / ')}`,
            });
            const kpi = report.kpi;
            const cycle = commitLearnCycle(learnedDir(), {
              runId: world.runId,
              day: world.day,
              level: kpi.level,
              questCleared: kpi.questCleared,
              annexOk: kpi.annexOk,
              colonizeOk: kpi.colonizeOk,
              blue: kpi.blue,
              red: kpi.red,
              independent: kpi.independent,
              capitalDestroyed: kpi.capitalDestroyed,
              credits: kpi.credits,
              combatWins: kpi.combatWins,
              combatLosses: kpi.combatLosses,
              planetId: world.currentPlanetId,
              combatMethod: readCombatMethod(learnedDir()),
              botPatchLoaded: true,
            }, Date.now());
            if (cycle.wrote) {
              emit(world, paths, mudTail, {
                t: Date.now(),
                day: world.day,
                tick: world.tick,
                kind: 'LEARN',
                line: `학습주기 ${cycle.assessment.phase} · 완료선언 없음 · 차이 ${cycle.assessment.gaps.length}`,
              });
            }
            const cell = flushCellLap(learnedDir(), Date.now());
            emit(world, paths, mudTail, {
              t: Date.now(),
              day: world.day,
              tick: world.tick,
              kind: 'LEARN',
              line: `세포반복 ${cell.lap} · 완료선언 없음 · 전투 ${cell.combatPlace || '기존경로'} · 사람순위밖 · 교역보류`,
            });
            const stall = observeStall(learnedDir(), {
              day: world.day,
              level: kpi.level,
              totalExp: kpi.totalExp,
              questCleared: kpi.questCleared,
              annexOk: kpi.annexOk,
              colonizeOk: kpi.colonizeOk,
              independent: kpi.independent,
              devSum: kpi.devSum,
              combatWins: kpi.combatWins,
              credits: kpi.credits,
              wall: progressWall(world),
            }, world.runId, Date.now());
            const issues = commitGameIssues(learnedDir(), {
              runId: world.runId,
              day: world.day,
              level: kpi.level,
              questCleared: kpi.questCleared,
              independent: kpi.independent,
              annexOk: kpi.annexOk,
              colonizeOk: kpi.colonizeOk,
              combatWins: kpi.combatWins,
              combatLosses: kpi.combatLosses,
              questFlatDays: stall.sectionStreak,
              lastHoldReason: world.lastHoldReason,
              credits: kpi.credits,
              hangarShips: kpi.hangarShips,
              findings: report.findings,
            }, Date.now(), stall.restart ? {
              force: true,
              reanalysis: stall.reanalysis,
              stallRestarts: stallRestartCount(),
            } : undefined);
            if (issues.addedIds.length > 0) {
              emit(world, paths, mudTail, {
                t: Date.now(),
                day: world.day,
                tick: world.tick,
                kind: 'LEARN',
                line: `게임문제 ${issues.addedIds.join(' ')}`,
              });
            }
            if (stall.restart) {
              stallRestart = true;
              emit(world, paths, mudTail, {
                t: Date.now(),
                day: world.day,
                tick: world.tick,
                kind: 'LEARN',
                line: `정체판단 ${stall.reason === 'section' ? '구간' : '성장'} · 처음부터 재플레이 · ${stall.reanalysis}`,
              });
            }
          }
          emit(world, paths, mudTail, {
            t: Date.now(),
            day: world.day,
            tick: world.tick,
            kind: 'ANALYZE',
            line: report.findings.map((f) => `${f.code}`).join(', '),
          });
          writeStatus(paths, world, mudTail, reports);
          const hk = resetRawPlayData();
          if (hk.reset) {
            const fresh = ensureRunPaths(campaignRunId);
            paths.runDir = fresh.runDir;
            paths.journal = fresh.journal;
            paths.mud = fresh.mud;
            paths.timeline = fresh.timeline;
            paths.kpi = fresh.kpi;
            paths.analyze = fresh.analyze;
            beginRecording();
            emit(world, paths, mudTail, {
              t: Date.now(),
              day: world.day,
              tick: world.tick,
              kind: 'LEARN',
              line: `원본 ${(hk.bytes / 1e9).toFixed(2)}GB≥1GB 리셋 · 학습결과는 logs/learned 유지`,
            });
          }
        },
      },
    });

    const world = sim.world;
    if (reports.length === 0) reports.push(...sim.reports);
    const kpi = snapshotKpi(world);
    writeFinalKpi(paths, kpi);
    writeStatus(paths, world, mudTail, reports);
    if (learn) recordLearning(campaignRunId, personaId, kpi, reports);
    persistLearningNow();
    flushLearnedWrites();
    lastWorld = world;
    lastPaths = paths;
    lastAnalyze = paths.analyze;

    if (comparePath && !shouldLoopNextCampaign(untilClose, isRecording())) {
      const cmp = compareKpi(kpi, comparePath);
      if ('error' in cmp) {
        if (!has('--quiet')) console.log(`COMPARE ${cmp.error}`);
      } else {
        const fs = await import('node:fs');
        fs.writeFileSync(`${paths.runDir}/compare.csv`, formatCompare(cmp), 'utf8');
        if (!has('--quiet')) console.log(formatCompare(cmp));
      }
    }

    if (stallRestart && isRecording()) {
      campaign += 1;
      continue;
    }
    if (!shouldLoopNextCampaign(untilClose, isRecording())) break;
    campaign += 1;
  }

  if (!has('--quiet') && lastWorld && lastPaths) {
    console.log('');
    console.log(formatHud(lastWorld));
    console.log(`ANALYZE ${lastAnalyze}`);
    console.log(`journal ${lastPaths.journal}`);
    console.log(untilClose ? '플레이봇콘솔 기록 종료(명시 중지)' : '플레이봇콘솔 지정 일수 종료');
  }
  persistLearningNow();
  flushLearnedWrites();
  endRecording('complete');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
