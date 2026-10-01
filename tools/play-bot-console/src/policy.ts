import fs from 'node:fs';
import path from 'node:path';
import type { ActionKind, AnalyzeReport, PersonaId } from './types';
import { PERSONAS } from './personas';
import { safeAppendFile, safeWriteFile, toolRoot } from './io';
import type { LearningState } from './learn';

export type PolicyFile = {
  version: 2;
  updatedAt: string;
  generation: number;
  preferSell: boolean;
  adaptEveryDays: number;
  personas: Partial<Record<PersonaId, Record<ActionKind, number>>>;
  lastNotes: string[];
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

const HISTORY_CAP = 40;

let learnedRootOverride: string | null = null;

export function setLearnedRootForTest(dir: string | null): void {
  learnedRootOverride = dir;
  cached = null;
}

export function learnedDir(): string {
  if (learnedRootOverride) return learnedRootOverride;
  return path.join(toolRoot(), 'logs', 'learned');
}

export function policyPath(): string {
  return path.join(learnedDir(), 'playbot-policy.json');
}

function cloneWeights(id: PersonaId): Record<ActionKind, number> {
  return { ...PERSONAS[id].weights };
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
  };
}

let cached: PolicyFile | null = null;

export function loadPolicy(): PolicyFile {
  if (cached) return cached;
  const p = policyPath();
  if (!fs.existsSync(p)) {
    cached = emptyPolicy();
    return cached;
  }
  try {
    const raw = JSON.parse(fs.readFileSync(p, 'utf8')) as PolicyFile;
    if (!raw || raw.version !== 2) {
      cached = emptyPolicy();
      return cached;
    }
    cached = raw;
    return cached;
  } catch {
    cached = emptyPolicy();
    return cached;
  }
}

export function savePolicy(policy: PolicyFile): void {
  cached = policy;
  fs.mkdirSync(learnedDir(), { recursive: true });
  policy.updatedAt = new Date().toISOString();
  safeWriteFile(policyPath(), JSON.stringify(policy, null, 2));
  const hist = path.join(learnedDir(), 'policy-history.ndjson');
  safeAppendFile(
    hist,
    `${JSON.stringify({ at: policy.updatedAt, generation: policy.generation, notes: policy.lastNotes, adaptEveryDays: policy.adaptEveryDays })}\n`,
  );
  trimHistory(hist);
}

function trimHistory(file: string): void {
  if (!fs.existsSync(file)) return;
  const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
  if (lines.length <= HISTORY_CAP) return;
  safeWriteFile(file, `${lines.slice(-HISTORY_CAP).join('\n')}\n`);
}

export function getLiveWeights(id: PersonaId): Record<ActionKind, number> {
  const overlay = loadPolicy().personas[id];
  return applyFloors({ ...cloneWeights(id), ...(overlay ?? {}) });
}

export function getPreferSell(): boolean {
  return loadPolicy().preferSell === true;
}

function clampNorm(w: Record<ActionKind, number>): Record<ActionKind, number> {
  return applyFloors(w);
}

function applyFloors(w: Record<ActionKind, number>): Record<ActionKind, number> {
  const keys = Object.keys(INTENT_FLOORS) as ActionKind[];
  const next = { ...cloneWeights('mixed_ref'), ...w };
  for (let i = 0; i < keys.length; i += 1) {
    const floor = INTENT_FLOORS[keys[i]];
    const cap = keys[i] === 'colonize' ? 0.4 : 0.42;
    next[keys[i]] = Math.max(floor, Math.min(cap, next[keys[i]] ?? floor));
  }
  let sum = 0;
  for (let i = 0; i < keys.length; i += 1) sum += next[keys[i]];
  if (sum <= 0) return cloneWeights('mixed_ref');
  for (let i = 0; i < keys.length; i += 1) next[keys[i]] = next[keys[i]] / sum;
  return next;
}

function bump(w: Record<ActionKind, number>, key: ActionKind, delta: number): void {
  w[key] = (w[key] ?? 0) + delta;
}

/**
 * 데이터 생성 주기=가상 1일. 학습 효율=최근 dExp·정체·HOLD.
 * 효율 높으면 주기를 늘려 정책을 덜 흔들고, 정체·HOLD면 2일로 당긴다.
 */
export function decideAdaptPeriodDays(state: LearningState): number {
  const early = state.earlyFeels[state.earlyFeels.length - 1];
  if (
    early
    && early.codes.some((c) => c === 'EARLY_OFF_SPINE' || c === 'EARLY_HANGAR_WIPE' || c === 'EARLY_DEAD_AIR' || c === 'EARLY_QUEST_GAP')
  ) {
    return 2;
  }
  const g = state.growth.slice(-6);
  if (g.length < 2) return 2;
  let dExpSum = 0;
  for (let i = 0; i < g.length; i += 1) dExpSum += Math.max(0, g[i].dExp);
  const avg = dExpSum / g.length;
  const plateau = g.length >= 3 && g[g.length - 1].questCleared === g[g.length - 3].questCleared
    && g[g.length - 1].level === g[g.length - 3].level;
  const holdish = state.patterns.slice(-3).some((p) => p.lastHoldReason.length > 0);
  if (holdish || plateau) return 2;
  if (avg < 60) return 3;
  if (avg > 500) return 6;
  return 4;
}

export function adaptPolicy(
  persona: PersonaId,
  report: AnalyzeReport,
  state: LearningState,
): { notes: string[]; everyDays: number } {
  const policy = loadPolicy();
  const w = { ...(policy.personas[persona] ?? cloneWeights(persona)) };
  const notes: string[] = [];
  const codes = new Set(report.findings.map((f) => f.code));
  const kpi = report.kpi;

  if (codes.has('COMBAT_UNDERLEVEL') || kpi.combatLosses > kpi.combatWins + 3) {
    bump(w, 'combat', -0.03);
    bump(w, 'gear', 0.04);
    bump(w, 'skill', 0.03);
    bump(w, 'quest', 0.02);
    notes.push('underlevel→장비·스킬↑ 전투는 바닥 유지');
  } else if (kpi.combatWins >= kpi.combatLosses && kpi.combatWins >= 3) {
    bump(w, 'combat', 0.03);
    bump(w, 'capital', 0.03);
    notes.push('전투우세→수도 접근↑');
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
    if (kpi.lastHoldReason === 'combat_off') {
      bump(w, 'travel', 0.04);
      bump(w, 'capital', 0.03);
      notes.push('퀘정체+combat_off→전선 이동(가중 과적응 금지)');
    } else {
      bump(w, 'quest', 0.05);
      bump(w, 'gear', 0.02);
      notes.push('퀘정체→퀘스트 유지·장비↑');
    }
  }

  if (codes.has('BORDER_RED_SLOPE') || codes.has('BORDER_RED_ACCEL') || codes.has('BORDER_BLUE_THIN')) {
    bump(w, 'annex_path', 0.08);
    bump(w, 'combat', 0.04);
    bump(w, 'travel', 0.02);
    notes.push('국경악화→편입 경로↑');
  }

  if (codes.has('EARLY_OFF_SPINE') || codes.has('EARLY_DENSITY_THIN')) {
    bump(w, 'quest', 0.08);
    bump(w, 'gear', -0.04);
    bump(w, 'develop', -0.04);
    bump(w, 'skill', -0.03);
    bump(w, 'capital', -0.06);
    bump(w, 'annex_path', -0.04);
    bump(w, 'combat', -0.03);
    notes.push('초반3분 스파인밖→퀘스트 밀도↑ 성장끼어들기↓');
  }
  if (codes.has('EARLY_HANGAR_WIPE')) {
    bump(w, 'combat', -0.06);
    bump(w, 'travel', 0.03);
    notes.push('초반3분 격납고 파괴→수련전투↓');
  }
  if (codes.has('EARLY_DEAD_AIR') || codes.has('EARLY_QUEST_GAP')) {
    bump(w, 'quest', 0.06);
    notes.push('초반3분 공백→본편 비트 유지');
  }

  if (codes.has('PLACEHOLDER_HOLD') || codes.has('PLACEHOLDER_UNRESOLVED')) {
    notes.push('플레이스홀더 HOLD→해석기·미해석 퀘 스킵 (가중으로 안 품)');
  }

  if (codes.has('REPEATED_HOLD') || codes.has('HOLD_PATTERN') || codes.has('DAY_HOLD_SPIKE')) {
    if (
      kpi.lastHoldReason === 'no_dest_system'
      || kpi.lastHoldReason === 'unresolved_placeholder'
      || kpi.lastHoldReason === 'no_discovery'
    ) {
      notes.push('HOLD 토큰→해석/스킵 (이동가중 금지)');
    } else if (kpi.lastHoldReason === 'combat_off') {
      bump(w, 'travel', 0.05);
      bump(w, 'capital', 0.04);
      notes.push('HOLD combat_off→수도 항로');
    } else {
      bump(w, 'travel', 0.03);
      bump(w, 'develop', 0.03);
      notes.push('HOLD→이동·개발');
    }
  }

  if (kpi.shipDestroys > 8 && kpi.hangarShips <= 1) {
    bump(w, 'combat', -0.05);
    bump(w, 'trade', 0.03);
    notes.push('격납고 고갈→전투↓');
  }

  if (notes.length === 0) {
    notes.push('유지');
  }

  const everyDays = decideAdaptPeriodDays(state);
  policy.personas[persona] = clampNorm(w);
  policy.adaptEveryDays = everyDays;
  policy.generation += 1;
  policy.lastNotes = notes;
  savePolicy(policy);
  return { notes, everyDays };
}

export function resetPolicyForTest(): void {
  cached = null;
  savePolicy(emptyPolicy());
}
