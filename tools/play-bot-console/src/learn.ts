import fs from 'node:fs';
import path from 'node:path';
import type { AnalyzeReport, JournalEntry, KpiSnapshot, PersonaId, WorldState } from './types';
import { toolRoot } from './io';
import { learnedDir } from './policy';
import { summarizeEarlyFeel, type EarlyFeelSample } from './earlyFeel';
import {
  flushLearnedWrites,
  loadJsonDurable,
  scheduleLearnedWrite,
  shouldForceLearnFlush,
} from './learnedIo';
import {
  CODE_WINDOW_CAP,
  inCampaignLearnWindow,
  isSaturatedGrowth,
  rebuildCodeCounts,
} from './learnGate';

export type GrowthSample = {
  day: number;
  runId?: string;
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
  saturated?: boolean;
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

export type CodeWindowRow = {
  day: number;
  runId?: string;
  codes: string[];
};

export type PersistHealth = {
  lastWriteAt?: string;
  recoveredFromBak: boolean;
  corruptSeen: number;
};

export type LearningState = {
  version: 2;
  updatedAt: string;
  runs: LearningRun[];
  codeCounts: Record<string, number>;
  codeWindow?: CodeWindowRow[];
  growth: GrowthSample[];
  patterns: PatternSample[];
  earlyFeels: EarlyFeelSample[];
  lastRunId?: string;
  persistHealth?: PersistHealth;
  /** 사람 체감 플레이 + 그 이상. Clock C는 창·게이트 통과분만. */
  goal: 'player_growth_and_play_pattern';
};

const CAP_RUNS = 20;
const CAP_SERIES = 90;
const CAP_EARLY = 16;

let cached: LearningState | null = null;

export function learningPath(): string {
  return path.join(learnedDir(), 'playbot-learning-state.json');
}

function emptyLearning(): LearningState {
  return {
    version: 2,
    updatedAt: new Date().toISOString(),
    runs: [],
    codeCounts: {},
    codeWindow: [],
    growth: [],
    patterns: [],
    earlyFeels: [],
    lastRunId: '',
    persistHealth: { recoveredFromBak: false, corruptSeen: 0 },
    goal: 'player_growth_and_play_pattern',
  };
}

function isLearningState(raw: unknown): raw is LearningState {
  if (!raw || typeof raw !== 'object') return false;
  const o = raw as LearningState;
  return Array.isArray(o.runs);
}

function migrateLegacyLearning(): void {
  const next = learningPath();
  if (fs.existsSync(next)) return;
  const legacy = path.join(toolRoot(), 'logs', 'playbot-learning-state.json');
  if (!fs.existsSync(legacy)) return;
  fs.mkdirSync(learnedDir(), { recursive: true });
  fs.copyFileSync(legacy, next);
}

export function resetLearningCacheForTest(): void {
  cached = null;
}

export function loadLearning(): LearningState {
  if (cached) return cached;
  migrateLegacyLearning();
  const empty = emptyLearning();
  const loaded = loadJsonDurable(learningPath(), empty, isLearningState);
  if (!fs.existsSync(learningPath()) && !loaded.corrupt) {
    cached = empty;
    return cached;
  }
  const raw = loaded.value;
  const window = Array.isArray(raw.codeWindow) ? raw.codeWindow : [];
  cached = {
    version: 2,
    updatedAt: raw.updatedAt ?? empty.updatedAt,
    runs: raw.runs ?? [],
    codeWindow: window,
    codeCounts: window.length ? rebuildCodeCounts(window) : (raw.codeCounts ?? {}),
    growth: Array.isArray(raw.growth) ? raw.growth : [],
    patterns: Array.isArray(raw.patterns) ? raw.patterns : [],
    earlyFeels: Array.isArray(raw.earlyFeels) ? raw.earlyFeels : [],
    lastRunId: raw.lastRunId ?? '',
    persistHealth: {
      recoveredFromBak: loaded.recovered,
      corruptSeen: (raw.persistHealth?.corruptSeen ?? 0) + (loaded.corrupt ? 1 : 0),
      lastWriteAt: raw.persistHealth?.lastWriteAt,
    },
    goal: 'player_growth_and_play_pattern',
  };
  return cached;
}

function saveLearning(state: LearningState, force = false): LearningState {
  state.updatedAt = new Date().toISOString();
  state.codeCounts = rebuildCodeCounts(state.codeWindow ?? []);
  state.persistHealth = {
    ...(state.persistHealth ?? { recoveredFromBak: false, corruptSeen: 0 }),
    lastWriteAt: state.updatedAt,
  };
  cached = state;
  const ok = scheduleLearnedWrite('learning', learningPath(), JSON.stringify(state, null, 2), force);
  if (ok) flushLearnedWrites();
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
  const runChanged = Boolean(state.lastRunId && state.lastRunId !== world.runId);
  const prev = runChanged ? undefined : state.growth[state.growth.length - 1];
  const kpi = report.kpi;
  const saturated = isSaturatedGrowth(state.growth) || !inCampaignLearnWindow(kpi.day);
  state.growth.push({
    day: kpi.day,
    runId: world.runId,
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
    dLevel: prev ? kpi.level - prev.level : 0,
    dExp: prev ? Math.max(0, kpi.totalExp - prev.totalExp) : 0,
    skills: kpi.skills,
    gearScore: kpi.gearScore,
    devSum: kpi.devSum,
    capitalDestroyed: kpi.capitalDestroyed,
    saturated,
  });
  const journalKinds = countKinds(dayJournal);
  const holdActive = world.lastHoldStreak > 0 && world.lastHoldReason.length > 0;
  state.patterns.push({
    day: kpi.day,
    persona: world.persona,
    actions: { ...world.actionCounts },
    journalKinds,
    lastHoldReason: holdActive ? world.lastHoldReason : '',
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

  const dayCodes = report.findings.map((f) => f.code);
  if (inCampaignLearnWindow(kpi.day) && !saturated) {
    const window = state.codeWindow ?? [];
    window.push({ day: kpi.day, runId: world.runId, codes: dayCodes });
    if (window.length > CODE_WINDOW_CAP) window.splice(0, window.length - CODE_WINDOW_CAP);
    state.codeWindow = window;
  }
  state.lastRunId = world.runId;
  return saveLearning(state, shouldForceLearnFlush(kpi.day));
}

export function recordLearning(
  runId: string,
  persona: PersonaId,
  kpi: KpiSnapshot,
  reports: readonly AnalyzeReport[],
): LearningState {
  const state = loadLearning();
  const codes: string[] = [];
  const window = state.codeWindow ?? [];
  for (const r of reports) {
    const dayCodes: string[] = [];
    for (const f of r.findings) {
      if (!codes.includes(f.code)) codes.push(f.code);
      dayCodes.push(f.code);
    }
    if (inCampaignLearnWindow(r.day)) {
      window.push({ day: r.day, runId, codes: dayCodes });
    }
  }
  if (window.length > CODE_WINDOW_CAP) window.splice(0, window.length - CODE_WINDOW_CAP);
  state.codeWindow = window;
  state.runs.push({
    runId,
    persona,
    endedAt: new Date().toISOString(),
    kpi,
    codes,
  });
  if (state.runs.length > CAP_RUNS) state.runs.splice(0, state.runs.length - CAP_RUNS);
  state.lastRunId = runId;
  return saveLearning(state, true);
}

export function persistLearningNow(): void {
  if (cached) saveLearning(cached, true);
  flushLearnedWrites();
}
