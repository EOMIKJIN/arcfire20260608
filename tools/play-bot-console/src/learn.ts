import fs from 'node:fs';
import path from 'node:path';
import type { AnalyzeReport, JournalEntry, KpiSnapshot, PersonaId, WorldState } from './types';
import { safeWriteFile, toolRoot } from './io';
import { learnedDir } from './policy';
import { summarizeEarlyFeel, type EarlyFeelSample } from './earlyFeel';

export type GrowthSample = {
  day: number;
  level: number;
  totalExp: number;
  credits: number;
  combatWins: number;
  combatLosses: number;
  shipDestroys: number;
  reboards: number;
  hangarShips: number;
  questCleared: number;
  holdCount?: number;
  annexOk: number;
  trades: number;
  dLevel: number;
  dExp: number;
  skills?: number;
  gearScore?: number;
  devSum?: number;
  capitalDestroyed?: number;
};

export type PatternSample = {
  day: number;
  persona: PersonaId;
  actions: Record<string, number>;
  journalKinds: Record<string, number>;
  lastHoldReason: string;
  dominantAction: string;
};

export type LearningRun = {
  runId: string;
  persona: PersonaId;
  endedAt: string;
  kpi: KpiSnapshot;
  codes: string[];
};

export type LearningState = {
  version: 2;
  updatedAt: string;
  runs: LearningRun[];
  codeCounts: Record<string, number>;
  growth: GrowthSample[];
  patterns: PatternSample[];
  earlyFeels: EarlyFeelSample[];
  /** 사람 체감 플레이 + 그 이상. 정체·반복은 현재 adapt로 해소하며 지능을 쌓는다. */
  goal: 'player_growth_and_play_pattern';
};

const CAP_RUNS = 20;
const CAP_SERIES = 90;
const CAP_EARLY = 16;

export function learningPath(): string {
  return path.join(learnedDir(), 'playbot-learning-state.json');
}

function migrateLegacyLearning(): void {
  const next = learningPath();
  if (fs.existsSync(next)) return;
  const legacy = path.join(toolRoot(), 'logs', 'playbot-learning-state.json');
  if (!fs.existsSync(legacy)) return;
  fs.mkdirSync(learnedDir(), { recursive: true });
  fs.copyFileSync(legacy, next);
}

export function loadLearning(): LearningState {
  const empty: LearningState = {
    version: 2,
    updatedAt: new Date().toISOString(),
    runs: [],
    codeCounts: {},
    growth: [],
    patterns: [],
    earlyFeels: [],
    goal: 'player_growth_and_play_pattern',
  };
  migrateLegacyLearning();
  const p = learningPath();
  if (!fs.existsSync(p)) return empty;
  try {
    const raw = JSON.parse(fs.readFileSync(p, 'utf8')) as Partial<LearningState> & { version?: number };
    if (!raw || !Array.isArray(raw.runs)) return empty;
    return {
      version: 2,
      updatedAt: raw.updatedAt ?? empty.updatedAt,
      runs: raw.runs,
      codeCounts: raw.codeCounts ?? {},
      growth: Array.isArray(raw.growth) ? raw.growth : [],
      patterns: Array.isArray(raw.patterns) ? raw.patterns : [],
      earlyFeels: Array.isArray(raw.earlyFeels) ? raw.earlyFeels : [],
      goal: 'player_growth_and_play_pattern',
    };
  } catch {
    return empty;
  }
}

function saveLearning(state: LearningState): LearningState {
  state.updatedAt = new Date().toISOString();
  const p = learningPath();
  fs.mkdirSync(path.dirname(p), { recursive: true });
  safeWriteFile(p, JSON.stringify(state, null, 2));
  return state;
}

function countKinds(entries: readonly JournalEntry[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (let i = 0; i < entries.length; i += 1) {
    const k = entries[i].kind;
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

function dominant(counts: Record<string, number>): string {
  let best = '';
  let n = -1;
  const keys = Object.keys(counts);
  for (let i = 0; i < keys.length; i += 1) {
    const c = counts[keys[i]] ?? 0;
    if (c > n) {
      n = c;
      best = keys[i];
    }
  }
  return best || 'idle';
}

export function recordDailyLearning(
  world: WorldState,
  report: AnalyzeReport,
  dayJournal: readonly JournalEntry[],
): LearningState {
  const state = loadLearning();
  const prev = state.growth[state.growth.length - 1];
  const kpi = report.kpi;
  state.growth.push({
    day: kpi.day,
    level: kpi.level,
    totalExp: kpi.totalExp,
    credits: kpi.credits,
    combatWins: kpi.combatWins,
    combatLosses: kpi.combatLosses,
    shipDestroys: kpi.shipDestroys,
    reboards: kpi.reboards,
    hangarShips: kpi.hangarShips,
    questCleared: kpi.questCleared,
    annexOk: kpi.annexOk,
    trades: kpi.trades,
    dLevel: prev ? kpi.level - prev.level : kpi.level - 1,
    dExp: prev ? kpi.totalExp - prev.totalExp : kpi.totalExp,
    skills: kpi.skills,
    gearScore: kpi.gearScore,
    devSum: kpi.devSum,
    capitalDestroyed: kpi.capitalDestroyed,
  });
  const journalKinds = countKinds(dayJournal);
  state.patterns.push({
    day: kpi.day,
    persona: world.persona,
    actions: { ...world.actionCounts },
    journalKinds,
    lastHoldReason: world.lastHoldReason,
    dominantAction: dominant(journalKinds),
  });
  if (world.earlyFeelClosed && !state.earlyFeels.some((e) => e.runId === world.runId)) {
    state.earlyFeels.push(summarizeEarlyFeel(world));
    if (state.earlyFeels.length > CAP_EARLY) {
      state.earlyFeels.splice(0, state.earlyFeels.length - CAP_EARLY);
    }
  }
  if (state.growth.length > CAP_SERIES) state.growth.splice(0, state.growth.length - CAP_SERIES);
  if (state.patterns.length > CAP_SERIES) state.patterns.splice(0, state.patterns.length - CAP_SERIES);
  for (const f of report.findings) {
    state.codeCounts[f.code] = (state.codeCounts[f.code] ?? 0) + 1;
  }
  return saveLearning(state);
}

export function recordLearning(
  runId: string,
  persona: PersonaId,
  kpi: KpiSnapshot,
  reports: readonly AnalyzeReport[],
): LearningState {
  const state = loadLearning();
  const codes: string[] = [];
  for (const r of reports) {
    for (const f of r.findings) {
      if (!codes.includes(f.code)) codes.push(f.code);
      state.codeCounts[f.code] = (state.codeCounts[f.code] ?? 0) + 1;
    }
  }
  state.runs.push({
    runId,
    persona,
    endedAt: new Date().toISOString(),
    kpi,
    codes,
  });
  if (state.runs.length > CAP_RUNS) state.runs.splice(0, state.runs.length - CAP_RUNS);
  return saveLearning(state);
}
