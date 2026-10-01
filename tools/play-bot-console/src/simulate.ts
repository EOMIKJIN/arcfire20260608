import { createRng } from './rng';
import type { AnalyzeReport, JournalEntry, PersonaId, WorldState } from './types';
import { seedWorld } from './world';
import { stepAction } from './actions';
import { runTerritorialDay } from './territorial';
import { analyzeDay, analyzeStronger } from './analyze';
import { dayOfTick, gameNowMs, isDayBoundary, TICKS_PER_DAY } from './clock';
import { absorbEarlyFeel, applyOpeningFeelIfNeeded } from './earlyFeel';

export type SimHooks = {
  onEntry?: (world: WorldState, entry: JournalEntry) => void;
  onDay?: (world: WorldState, report: AnalyzeReport, dayJournal: readonly JournalEntry[]) => void;
};

export function runSimulation(input: {
  persona: PersonaId;
  days: number;
  seed: number;
  runId: string;
  allowSides: boolean;
  stronger: boolean;
  shouldContinue?: () => boolean;
  hooks?: SimHooks;
}): { world: WorldState; reports: AnalyzeReport[] } {
  const world = seedWorld({ runId: input.runId, persona: input.persona });
  applyOpeningFeelIfNeeded(world);
  const rng = createRng(input.seed);
  const reports: AnalyzeReport[] = [];
  const REPORT_KEEP = 21;
  let dayBuf: JournalEntry[] = [];
  const perpetual = input.days <= 0;
  const total = perpetual ? Number.POSITIVE_INFINITY : Math.max(1, input.days) * TICKS_PER_DAY;

  for (let i = 0; i < total; i += 1) {
    if (input.shouldContinue && !input.shouldContinue()) break;
    world.tick = i;
    world.day = dayOfTick(i);
    world.nowMs = gameNowMs(i);
    const entry = stepAction(world, rng, input.persona, { allowSides: input.allowSides });
    if (!entry.silent) {
      absorbEarlyFeel(world, entry);
      dayBuf.push(entry);
      input.hooks?.onEntry?.(world, entry);
    }

    const finiteEnd = !perpetual && i + 1 === total;
    if (isDayBoundary(i + 1) || finiteEnd) {
      const terr = runTerritorialDay(world, rng);
      for (const te of terr) {
        dayBuf.push(te);
        input.hooks?.onEntry?.(world, te);
      }
      const report = analyzeDay(world, dayBuf);
      reports.push(report);
      if (reports.length > REPORT_KEEP) reports.splice(0, reports.length - REPORT_KEEP);
      if (input.stronger) report.findings.push(...analyzeStronger(world, reports));
      input.hooks?.onDay?.(world, report, dayBuf);
      dayBuf = [];
    }
  }

  if (dayBuf.length > 0) {
    const report = analyzeDay(world, dayBuf);
    reports.push(report);
    if (reports.length > REPORT_KEEP) reports.splice(0, reports.length - REPORT_KEEP);
    if (input.stronger) report.findings.push(...analyzeStronger(world, reports));
    input.hooks?.onDay?.(world, report, dayBuf);
  }

  return { world, reports };
}
