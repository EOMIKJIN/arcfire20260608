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
  writeFinalKpi,
  writeStatus,
} from './src/io';
import { recordDailyLearning, recordLearning } from './src/learn';
import { adaptPolicy, decideAdaptPeriodDays, loadPolicy } from './src/policy';
import { resetRawPlayData } from './src/housekeep';
import { compareKpi, formatCompare } from './src/compare';
import { runSimulation } from './src/simulate';
import type { AnalyzeReport, JournalEntry, PersonaId, WorldState } from './src/types';
import { resolveUntilWallMs } from './src/untilWall';

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
  const line = formatMudLine(world, entry);
  pushMudTail(mudTail, line, 80);
  appendJournal(paths, entry, line);
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
  const days = untilClose ? 0 : Math.max(1, Math.min(3650, Number(arg('--days', '7')) || 7));
  const live = has('--live');
  const liveMs = Math.max(20, Number(arg('--live-ms', '120')) || 120);
  const seed = Number(arg('--seed', String(Date.now() % 1_000_000_007))) || 1;
  const runId = arg('--run-id', `pb-${new Date().toISOString().replace(/[:.]/g, '').slice(0, 15)}-${personaId}`);
  const allowSides = stage >= 2;
  const learn = !has('--no-learn');
  const comparePath = arg('--compare', '');
  const strong = stage >= 3;
  const untilWall = resolveUntilWallMs(arg('--until-wall', ''));
  const allowed = stage >= 2 ? STAGE2_PERSONAS : STAGE1_PERSONAS;
  if (!allowed.includes(personaId)) {
    throw new Error(`persona ${personaId} not in stage ${stage} allowlist`);
  }

  const paths = ensureRunPaths(runId);
  const mudTail: string[] = [];
  const reports: AnalyzeReport[] = [];
  beginRecording();
  const stop = (): void => {
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
    stop();
    process.exit(0);
  });

  if (!has('--quiet')) {
    console.log('=== Arcfire 플레이봇콘솔 ===');
    console.log(`persona=${personaId} (${PERSONAS[personaId].titleKo})  stage=${stage}  ${untilClose ? 'until-close' : `days=${days}`}  seed=${seed}`);
    console.log(`run=${runId}`);
    console.log('창을 닫을 때까지 지속 · 파괴 시 재탑승 · 주기 분석 후 정책 자체 개선');
    if (untilWall > 0) {
      console.log(`벽시계 마감 ${new Date(untilWall).toISOString()} 이후 정지 · 학습결과는 logs/learned`);
    }
    console.log('앱 빌드 미포함 · 대표님 세이브 미기록');
    console.log('');
  }

  const sim = runSimulation({
    persona: personaId,
    days,
    seed,
    runId,
    allowSides,
    stronger: strong,
    shouldContinue: () => {
      if (!isRecording()) return false;
      if (untilWall > 0 && Date.now() >= untilWall) {
        endRecording('wall_deadline_0800_kst');
        return false;
      }
      return true;
    },
    hooks: {
      onEntry: (world, entry) => {
        emit(world, paths, mudTail, entry);
        if (world.tick % 4 === 0) appendTimeline(paths, world, entry.kind);
        if (live) {
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, liveMs);
        }
      },
      onDay: (world, report, dayJournal) => {
        if (reports.length >= 21) reports.shift();
        reports.push(report);
        if (learn) {
          const learned = recordDailyLearning(world, report, dayJournal);
          const every = Math.max(2, loadPolicy().adaptEveryDays || decideAdaptPeriodDays(learned));
          if (world.day === 2 || world.day % every === 0) {
            const ad = adaptPolicy(personaId, report, learned);
            emit(world, paths, mudTail, {
              t: Date.now(),
              day: world.day,
              tick: world.tick,
              kind: 'LEARN',
              line: `정책# 주기${ad.everyDays}일 · ${ad.notes.join(' / ')}`,
            });
          } else {
            emit(world, paths, mudTail, {
              t: Date.now(),
              day: world.day,
              tick: world.tick,
              kind: 'LEARN',
              line: `성장 L${report.kpi.level} exp=${report.kpi.totalExp} 다음정책 D${every}`,
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
          const fresh = ensureRunPaths(runId);
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

  if (learn) recordLearning(runId, personaId, kpi, reports);
  if (comparePath) {
    const cmp = compareKpi(kpi, comparePath);
    if ('error' in cmp) {
      if (!has('--quiet')) console.log(`COMPARE ${cmp.error}`);
    } else {
      const fs = await import('node:fs');
      fs.writeFileSync(`${paths.runDir}/compare.csv`, formatCompare(cmp), 'utf8');
      if (!has('--quiet')) console.log(formatCompare(cmp));
    }
  }

  if (!has('--quiet')) {
    console.log('');
    console.log(formatHud(world));
    console.log(`ANALYZE ${paths.analyze}`);
    console.log(`journal ${paths.journal}`);
    console.log(untilClose ? '플레이봇콘솔 기록 종료(창 닫힘)' : '플레이봇콘솔 지정 일수 종료');
  }
  endRecording('complete');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
