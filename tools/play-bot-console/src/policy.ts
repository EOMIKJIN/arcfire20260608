import fs from 'node:fs';
import path from 'node:path';
import type { ActionKind, AnalyzeReport, PersonaId } from './types';
import { PERSONAS } from './personas';
import { safeAppendFile, toolRoot } from './io';
import type { LearningState } from './learn';
import {
  atomicWriteFile,
  flushLearnedWrites,
  loadJsonDurable,
  resetLearnedIoForTest,
  scheduleLearnedWrite,
  setLearnedImmediateForTest,
} from './learnedIo';
import {
  inCampaignLearnWindow,
  isAdaptExcludedCode,
  isCollapsedWeights,
  isSaturatedGrowth,
  LEARN_WINDOW_DAYS,
  isNewRunForScore,
  notesEqual,
  weightsNear,
  shouldRollbackScore,
  windowCombatDelta,
  windowHangarDelta,
  windowScore,
} from './learnGate';
import { blendPersonaWeights, loadHumanSeed } from './humanSeed';

export type PolicyHealth = {
  stuck: boolean;
  equalWeights: boolean;
  sameNotesStreak: number;
  lastScore: number | null;
  /** lastScore를 잰 가상일 — 런/캠페인이 바뀌어 day가 되돌아가면 기준 초기화(T1 래칫 방지). */
  lastScoreDay?: number | null;
  unstuckAt?: string;
};

export type PolicyFile = {
  version: 2;
  updatedAt: string;
  generation: number;
  preferSell: boolean;
  adaptEveryDays: number;
  personas: Partial<Record<PersonaId, Record<ActionKind, number>>>;
  lastNotes: string[];
  health?: PolicyHealth;
  rollbackPersonas?: Partial<Record<PersonaId, Record<ActionKind, number>>>;
};

const INTENT_FLOORS: Record<ActionKind, number> = {
  quest: 0.18,
  combat: 0.10,
  trade: 0.05,
  annex_path: 0.05,
  colonize: 0,
  travel: 0.03,
  idle: 0.02,
  skill: 0.06,
  gear: 0.06,
  develop: 0.06,
  capital: 0.08,
};

const HISTORY_CAP = 400;
const DECAY = 0.9;

let learnedRootOverride: string | null = null;

export function setLearnedRootForTest(dir: string | null): void {
  learnedRootOverride = dir;
  cached = null;
  resetLearnedIoForTest();
  setLearnedImmediateForTest(true);
  try {
    const learn = require('./learn') as { resetLearningCacheForTest?: () => void };
    learn.resetLearningCacheForTest?.();
    const seed = require('./humanSeed') as { resetHumanSeedForTest?: () => void };
    seed.resetHumanSeedForTest?.();
  } catch {
    /* 순환 로드 시점에는 캐시가 아직 없음 */
  }
}

export function learnedDir(): string {
  if (learnedRootOverride) return learnedRootOverride;
  return path.join(toolRoot(), 'logs', 'learned');
}

export function policyPath(): string {
  return path.join(learnedDir(), 'playbot-policy.json');
}

function cloneWeights(id: PersonaId): Record<ActionKind, number> {
  const base = { ...PERSONAS[id].weights };
  const seed = loadHumanSeed(learnedDir());
  return seed ? blendPersonaWeights(base, seed) : base;
}

function emptyHealth(): PolicyHealth {
  return {
    stuck: false,
    equalWeights: false,
    sameNotesStreak: 0,
    lastScore: null,
  };
}

export function emptyPolicy(): PolicyFile {
  return {
    version: 2,
    updatedAt: new Date().toISOString(),
    generation: 0,
    preferSell: false,
    adaptEveryDays: 4,
    personas: {},
    lastNotes: [],
    health: emptyHealth(),
    rollbackPersonas: {},
  };
}

function isPolicyFile(raw: unknown): raw is PolicyFile {
  if (!raw || typeof raw !== 'object') return false;
  const o = raw as PolicyFile;
  return o.version === 2 && typeof o.generation === 'number';
}

let cached: PolicyFile | null = null;

export function loadPolicy(): PolicyFile {
  if (cached) return cached;
  const p = policyPath();
  const loaded = loadJsonDurable(p, emptyPolicy(), isPolicyFile);
  if (loaded.corrupt && !loaded.recovered) {
    cached = emptyPolicy();
    cached.health = { ...emptyHealth(), stuck: false };
    return cached;
  }
  const raw = loaded.value;
  cached = {
    ...emptyPolicy(),
    ...raw,
    health: { ...emptyHealth(), ...(raw.health ?? {}) },
    rollbackPersonas: raw.rollbackPersonas ?? {},
  };
  if (loaded.recovered) {
    cached.health = { ...emptyHealth(), ...cached.health, unstuckAt: cached.health?.unstuckAt };
    cached.lastNotes = [...(cached.lastNotes ?? []), '정책파일 손상→bak복구'];
  }
  return cached;
}

export function savePolicy(policy: PolicyFile, force = false): void {
  cached = policy;
  policy.updatedAt = new Date().toISOString();
  const body = JSON.stringify(policy, null, 2);
  scheduleLearnedWrite('policy', policyPath(), body, force);
  const hist = path.join(learnedDir(), 'policy-history.ndjson');
  safeAppendFile(
    hist,
    `${JSON.stringify({
      at: policy.updatedAt,
      generation: policy.generation,
      notes: policy.lastNotes,
      adaptEveryDays: policy.adaptEveryDays,
      stuck: policy.health?.stuck === true,
    })}\n`,
  );
  trimHistory(hist);
}

function trimHistory(file: string): void {
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
  if (lines.length <= HISTORY_CAP) return;
  atomicWriteFile(file, `${lines.slice(-HISTORY_CAP).join('\n')}\n`);
}

export function getLiveWeights(id: PersonaId): Record<ActionKind, number> {
  const overlay = loadPolicy().personas[id];
  return applyFloors({ ...cloneWeights(id), ...(overlay ?? {}) });
}

export function getPreferSell(): boolean {
  return loadPolicy().preferSell === true;
}

export function getPolicyHealth(): PolicyHealth {
  return loadPolicy().health ?? emptyHealth();
}

/** 고착 정책은 탐색을 줄이고, 건강한 정책만 영향력을 키운다. */
export function getLearnExploreRate(): number {
  const h = getPolicyHealth();
  if (h.stuck || h.equalWeights) return 0.08;
  return 0.28;
}

/** 바닥을 정규화 전에 넣으면 바닥이 사라진다. 바닥 할당 후 잉여만 분배. */
function applyFloors(w: Record<ActionKind, number>): Record<ActionKind, number> {
  const keys = Object.keys(INTENT_FLOORS) as ActionKind[];
  const next = { ...cloneWeights('mixed_ref'), ...w };
  let floorSum = 0;
  const raw: number[] = [];
  for (let i = 0; i < keys.length; i += 1) {
    const floor = INTENT_FLOORS[keys[i]];
    const cap = keys[i] === 'colonize' ? 0.4 : 0.42;
    raw[i] = Math.max(floor, Math.min(cap, next[keys[i]] ?? floor));
    floorSum += floor;
  }
  const surplus: number[] = [];
  let surplusSum = 0;
  for (let i = 0; i < keys.length; i += 1) {
    const s = Math.max(0, raw[i] - INTENT_FLOORS[keys[i]]);
    surplus[i] = s;
    surplusSum += s;
  }
  const remain = Math.max(0, 1 - floorSum);
  for (let i = 0; i < keys.length; i += 1) {
    const extra = surplusSum > 0 ? remain * (surplus[i] / surplusSum) : remain / keys.length;
    next[keys[i]] = INTENT_FLOORS[keys[i]] + extra;
  }
  return next;
}

function bump(w: Record<ActionKind, number>, key: ActionKind, delta: number): void {
  w[key] = (w[key] ?? 0) + delta;
}

function decayTowardBase(w: Record<ActionKind, number>, persona: PersonaId): void {
  const base = cloneWeights(persona);
  const keys = Object.keys(base) as ActionKind[];
  for (let i = 0; i < keys.length; i += 1) {
    const k = keys[i];
    const cur = w[k] ?? base[k];
    w[k] = base[k] + DECAY * (cur - base[k]);
  }
}

function adaptCodes(report: AnalyzeReport): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i < report.findings.length; i += 1) {
    const c = report.findings[i].code;
    if (!isAdaptExcludedCode(c)) out.add(c);
  }
  return out;
}

function holdActive(state: LearningState, kpiHold: string): string {
  const last = state.patterns[state.patterns.length - 1];
  if (last && last.dominantAction === 'HOLD' && last.lastHoldReason) return last.lastHoldReason;
  return '';
}

/**
 * 데이터 생성 주기=가상 1일. 창 델타·현재 HOLD만.
 */
export function decideAdaptPeriodDays(state: LearningState): number {
  const g = state.growth.slice(-6);
  if (g.length < 2) return 2;
  let dExpSum = 0;
  for (let i = 0; i < g.length; i += 1) dExpSum += Math.max(0, g[i].dExp);
  const avg = dExpSum / g.length;
  const plateau = g.length >= 3 && g[g.length - 1].questCleared === g[g.length - 3].questCleared
    && g[g.length - 1].level === g[g.length - 3].level;
  const holdish = state.patterns.slice(-3).some((p) => p.dominantAction === 'HOLD' && p.lastHoldReason.length > 0);
  if (holdish || plateau) return 2;
  if (avg < 60) return 3;
  if (avg > 500) return 6;
  return 4;
}

export function adaptPolicy(
  persona: PersonaId,
  report: AnalyzeReport,
  state: LearningState,
): { notes: string[]; everyDays: number; skipped: boolean } {
  const policy = loadPolicy();
  const w = { ...(policy.personas[persona] ?? cloneWeights(persona)) };
  const notes: string[] = [];
  const codes = adaptCodes(report);
  const kpi = report.kpi;
  const horizon = inCampaignLearnWindow(kpi.day);
  const saturated = isSaturatedGrowth(state.growth);
  const combat = windowCombatDelta(state);
  const holdWhy = holdActive(state, kpi.lastHoldReason);

  if (isCollapsedWeights(w)) {
    const base = cloneWeights(persona);
    const keys = Object.keys(base) as ActionKind[];
    for (let i = 0; i < keys.length; i += 1) w[keys[i]] = base[keys[i]];
    notes.push('고착해제→기준가중');
    policy.health = {
      ...(policy.health ?? emptyHealth()),
      stuck: false,
      equalWeights: false,
      sameNotesStreak: 0,
      unstuckAt: new Date().toISOString(),
    };
  }

  if (!horizon || saturated) {
    const everyDays = saturated ? 6 : decideAdaptPeriodDays(state);
    if (notes.length > 0) {
      policy.personas[persona] = applyFloors(w);
      policy.adaptEveryDays = everyDays;
      policy.generation += 1;
      policy.lastNotes = notes;
      savePolicy(policy, true);
      return { notes, everyDays, skipped: false };
    }
    notes.push(!horizon ? '학습창밖·감시만' : '포화·학습제외');
    return { notes, everyDays, skipped: true };
  }

  decayTowardBase(w, persona);

  if (codes.has('COMBAT_UNDERLEVEL') || (combat.fights >= 3 && combat.dLoss > combat.dWins + 2)) {
    bump(w, 'combat', -0.03);
    bump(w, 'gear', 0.04);
    bump(w, 'skill', 0.03);
    bump(w, 'quest', 0.02);
    notes.push('창전투열세→장비·스킬↑ 전투는 바닥 유지');
  } else if (combat.fights >= 2 && combat.dWins >= combat.dLoss && combat.dWins >= 2) {
    bump(w, 'combat', 0.03);
    bump(w, 'capital', 0.03);
    notes.push('창전투우세→수도 접근↑');
  }

  if (codes.has('INSOLVENCY') || codes.has('CREDIT_DRAIN') || kpi.credits < 800) {
    bump(w, 'trade', 0.08);
    bump(w, 'annex_path', -0.04);
    policy.preferSell = true;
    notes.push('자금↓→매도 편중');
  } else if (kpi.credits > 6000) {
    policy.preferSell = false;
  }

  if (codes.has('QUEST_SLOW') || codes.has('QUEST_PLATEAU')) {
    if (holdWhy === 'combat_off') {
      bump(w, 'travel', 0.04);
      bump(w, 'capital', 0.03);
      notes.push('퀘정체+combat_off→전선 이동(가중 과적응 금지)');
    } else {
      bump(w, 'quest', 0.05);
      bump(w, 'gear', 0.02);
      notes.push('퀘정체→퀘스트 유지·장비↑');
    }
  }

  if (codes.has('PLACEHOLDER_HOLD') || codes.has('PLACEHOLDER_UNRESOLVED')) {
    notes.push('플레이스홀더 HOLD→해석기·미해석 퀘 스킵 (가중으로 안 품)');
  }

  if (codes.has('REPEATED_HOLD') || codes.has('HOLD_PATTERN') || codes.has('DAY_HOLD_SPIKE')) {
    if (
      holdWhy === 'no_dest_system'
      || holdWhy === 'unresolved_placeholder'
      || holdWhy === 'no_discovery'
    ) {
      notes.push('HOLD 토큰→해석/스킵 (이동가중 금지)');
    } else if (holdWhy === 'combat_off') {
      bump(w, 'travel', 0.05);
      bump(w, 'capital', 0.04);
      notes.push('HOLD combat_off→수도 항로');
    } else if (holdWhy) {
      bump(w, 'travel', 0.03);
      bump(w, 'develop', 0.03);
      notes.push('HOLD→이동·개발');
    }
  }

  const hangar = windowHangarDelta(state);
  if (hangar.dDestroys >= 2 && hangar.lastHangar <= 1) {
    bump(w, 'combat', -0.05);
    bump(w, 'trade', 0.03);
    notes.push('창격납고 고갈→전투↓');
  }

  if (notes.length === 0) notes.push('유지');

  const nextW = applyFloors(w);
  const prevW = applyFloors(policy.personas[persona] ?? cloneWeights(persona));
  const sameMemo = notesEqual(notes, policy.lastNotes ?? []);
  const sameW = weightsNear(prevW, nextW);
  const health = policy.health ?? emptyHealth();
  health.sameNotesStreak = sameMemo ? health.sameNotesStreak + 1 : 0;
  health.equalWeights = isCollapsedWeights(nextW);
  health.stuck = health.sameNotesStreak >= 8 || health.equalWeights;

  if (sameMemo && sameW && !notes.includes('고착해제→기준가중')) {
    policy.health = health;
    cached = policy;
    return { notes, everyDays: policy.adaptEveryDays, skipped: true };
  }

  const score = windowScore(state);
  const experimental = notes[0] !== '유지' && !notes[0].startsWith('고착해제');
  // 새 런/캠페인(가상일 되감김) — 이전 런 고레벨 점수와 비교하지 않는다.
  if (isNewRunForScore(health.lastScoreDay, kpi.day)) {
    health.lastScore = null;
    health.lastScoreDay = null;
    if (policy.rollbackPersonas) delete policy.rollbackPersonas[persona];
  }
  // 캠페인 첫 창(LEARN_WINDOW_DAYS)은 점수 창이 안 차서 비교 불가 — 롤백·기준 갱신 모두 보류.
  const scoreReady = kpi.day > LEARN_WINDOW_DAYS;
  if (
    experimental
    && scoreReady
    && health.lastScore != null
    && shouldRollbackScore(health.lastScore, score)
    && policy.rollbackPersonas?.[persona]
  ) {
    policy.personas[persona] = applyFloors(policy.rollbackPersonas[persona]!);
    notes.unshift('평가악화→롤백');
    // 롤백 후 기준을 현재 점수로 — 악화 기준이 영구 고정되면 매번 롤백(래칫)된다.
    health.lastScore = score;
    health.lastScoreDay = kpi.day;
    policy.health = health;
    policy.adaptEveryDays = decideAdaptPeriodDays(state);
    policy.generation += 1;
    policy.lastNotes = notes;
    savePolicy(policy, true);
    return { notes, everyDays: policy.adaptEveryDays, skipped: false };
  }

  if (experimental && scoreReady) {
    policy.rollbackPersonas = {
      ...(policy.rollbackPersonas ?? {}),
      [persona]: { ...prevW },
    };
    health.lastScore = score;
    health.lastScoreDay = kpi.day;
  }

  const everyDays = decideAdaptPeriodDays(state);
  policy.personas[persona] = nextW;
  policy.adaptEveryDays = everyDays;
  policy.generation += 1;
  policy.lastNotes = notes;
  policy.health = health;
  savePolicy(policy, true);
  return { notes, everyDays, skipped: false };
}

export function resetPolicyForTest(): void {
  cached = null;
  savePolicy(emptyPolicy(), true);
  flushLearnedWrites();
}
