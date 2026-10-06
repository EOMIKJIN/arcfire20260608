/**
 * 정체 판단 — 가상일 마감 1회. 디스크는 재플레이를 결정할 때만.
 * [pss-pre-dev] hot_path=가상일 1회 alloc=판정 객체 1 cache=연속 서명
 * [pss-pre-dev] stage=Node 트윈 risk=P6 verdict=PASS
 * 정책·세포·실기 수집은 지우지 않는다. 메모리 세계만 하니스가 다시 시드한다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { nextStoryLevelGate } from './catalog';
import { atomicWriteFile } from './learnedIo';
import { designPhase } from './learnCycle';

/** 레벨·경험치·퀘스트·개발·영토 진행이 이 일수만큼 같으면 성장 정체. */
export const HARD_STALL_DAYS = 12;
/** 퀘스트·편입·개척·독립국이 이 일수만큼 같고 그 사이 전투가 있으면 구간 정체. */
export const SECTION_STALL_DAYS = 40;
/** 오프닝 직후 정체로 세계를 끊지 않는다. */
export const STALL_MIN_DAY = 21;

export type StallReason = 'hard' | 'section';

export type StallSnap = {
  day: number;
  level: number;
  totalExp: number;
  questCleared: number;
  annexOk: number;
  colonizeOk: number;
  independent: number;
  devSum: number;
  combatWins: number;
  credits: number;
  /** 진행을 막는 축 한 줄(progressWall). 판정에는 쓰지 않고 기록만 한다. */
  wall?: string;
};

export type StallMemory = {
  hardSig: string;
  hardStreak: number;
  sectionSig: string;
  sectionStreak: number;
  sectionWins: number;
  /** 구간 연속일이 시작된 레벨 — 그 사이 레벨이 오르면 관문(본편 Lv 게이트)을 향해 진행 중이다 */
  sectionLevel: number;
  /** 구간 연속일이 시작된 경험치. 다음 본편 관문보다 레벨이 낮고 이게 오르면 수련이다 */
  sectionExp: number;
};

export type StallMark = {
  restartIndex: number;
  reason: StallReason;
  runId: string;
  at: string;
  day: number;
  level: number;
  phase: string;
  questCleared: number;
  annexOk: number;
  colonizeOk: number;
  independent: number;
  totalExp: number;
  devSum: number;
  combatWins: number;
  credits: number;
  wall?: string;
  reanalysis: string;
};

type StallFile = {
  version: 1;
  restarts: number;
  baseline: StallMark | null;
  history: StallMark[];
};

export function emptyStallMemory(): StallMemory {
  return {
    hardSig: '',
    hardStreak: 0,
    sectionSig: '',
    sectionStreak: 0,
    sectionWins: -1,
    sectionLevel: 0,
    sectionExp: 0,
  };
}

export function stepStall(
  mem: StallMemory,
  snap: StallSnap,
): { mem: StallMemory; restart: boolean; reason: StallReason | ''; sectionStreak: number; hardStreak: number } {
  const hardSig = `${snap.level}|${snap.totalExp}|${snap.questCleared}|${snap.devSum}|${snap.annexOk}|${snap.colonizeOk}|${snap.independent}`;
  const sectionSig = `${snap.questCleared}|${snap.annexOk}|${snap.colonizeOk}|${snap.independent}`;
  const hardSame = mem.hardSig === hardSig && mem.hardStreak > 0;
  // 퀘스트가 멈춰도 레벨이 오르면 다음 본편 Lv 관문(25·28·32…)을 향한 수련 — 구간 정체가 아니다.
  // 이 조건 없이는 L26→28 수련 중 40일마다 세계를 재시드해 관문에 끝내 못 닿았다(2026-10-05 재시작 54회).
  const gate = nextStoryLevelGate(snap.level);
  const expUp = mem.sectionStreak > 0 && snap.totalExp > (mem.sectionExp ?? 0);
  const gateTraining = gate > snap.level && expUp;
  const sectionSame = mem.sectionSig === sectionSig
    && mem.sectionStreak > 0
    && snap.level <= mem.sectionLevel
    && !gateTraining;
  const hardStreak = hardSame ? mem.hardStreak + 1 : 1;
  const sectionStreak = sectionSame ? mem.sectionStreak + 1 : 1;
  const sectionWins = sectionSame ? mem.sectionWins : snap.combatWins;
  const sectionLevel = sectionSame ? mem.sectionLevel : snap.level;
  const sectionExp = sectionSame ? (mem.sectionExp ?? snap.totalExp) : snap.totalExp;
  const fought = snap.combatWins > sectionWins;
  const hard = hardStreak >= HARD_STALL_DAYS && snap.day >= STALL_MIN_DAY;
  const section = sectionStreak >= SECTION_STALL_DAYS && snap.day >= SECTION_STALL_DAYS && fought;
  const reason: StallReason | '' = section ? 'section' : hard ? 'hard' : '';
  return {
    mem: { hardSig, hardStreak, sectionSig, sectionStreak, sectionWins, sectionLevel, sectionExp },
    restart: reason !== '',
    reason,
    sectionStreak,
    hardStreak,
  };
}

export function reanalysisText(
  prev: Pick<StallMark, 'reason' | 'day' | 'level' | 'questCleared'> | null,
  next: { reason: StallReason; day: number; level: number; questCleared: number; independent: number },
): string {
  const kind = next.reason === 'section' ? '구간 정체' : '성장 정체';
  if (!prev) {
    return `${kind}. D${next.day} L${next.level} 퀘스트 ${next.questCleared} 독립국 ${next.independent}. 처음부터 다시 플레이해 같은 축이 다시 멈추는지 본다.`;
  }
  const same = prev.reason === next.reason
    && prev.level === next.level
    && prev.questCleared === next.questCleared;
  if (same) {
    return `같은 ${kind} 재발. 레벨 ${next.level} · 퀘스트 ${next.questCleared}이 직전 정체와 같다. 다시 플레이해도 이 구간에서 같은 축이 멈춘다.`;
  }
  return `${kind} 재발. 직전 D${prev.day} L${prev.level} 퀘스트 ${prev.questCleared} → 이번 D${next.day} L${next.level} 퀘스트 ${next.questCleared}.`;
}

let memory = emptyStallMemory();
let baseline: StallMark | null = null;
let restarts = 0;
let history: StallMark[] = [];

export function resetStallForTest(): void {
  memory = emptyStallMemory();
  baseline = null;
  restarts = 0;
  history = [];
}

/** 새 세계의 연속일만 지운다. 직전 정체 기록은 유지한다. */
export function resetStallStreak(): void {
  memory = emptyStallMemory();
}

export function stallReplayPath(dir: string): string {
  return path.join(dir, 'stall-replay.json');
}

export function loadStallReplay(dir: string): void {
  try {
    const raw = JSON.parse(fs.readFileSync(stallReplayPath(dir), 'utf8')) as Partial<StallFile>;
    restarts = typeof raw.restarts === 'number' ? raw.restarts : 0;
    baseline = raw.baseline ?? null;
    history = Array.isArray(raw.history) ? raw.history.slice(0, 8) : [];
  } catch {
    baseline = null;
    restarts = 0;
    history = [];
  }
  memory = emptyStallMemory();
}

export function stallRestartCount(): number {
  return restarts;
}

export function lastStallReanalysis(): string {
  return baseline?.reanalysis ?? '';
}

function writeStall(dir: string): void {
  const body = `${JSON.stringify({
    version: 1,
    restarts,
    baseline,
    history,
  }, null, 2)}\n`;
  atomicWriteFile(stallReplayPath(dir), body);
}

export function observeStall(
  dir: string,
  snap: StallSnap,
  runId: string,
  nowMs: number,
): { restart: boolean; reason: StallReason | ''; sectionStreak: number; reanalysis: string } {
  const stepped = stepStall(memory, snap);
  memory = stepped.mem;
  if (!stepped.restart || !stepped.reason) {
    return { restart: false, reason: '', sectionStreak: stepped.sectionStreak, reanalysis: '' };
  }
  const phase = designPhase(snap.level).phase;
  const text = reanalysisText(baseline, {
    reason: stepped.reason,
    day: snap.day,
    level: snap.level,
    questCleared: snap.questCleared,
    independent: snap.independent,
  });
  const reanalysis = snap.wall ? `${text} 벽: ${snap.wall}` : text;
  restarts += 1;
  const mark: StallMark = {
    restartIndex: restarts,
    reason: stepped.reason,
    runId,
    at: new Date(nowMs).toISOString(),
    day: snap.day,
    level: snap.level,
    phase,
    questCleared: snap.questCleared,
    annexOk: snap.annexOk,
    colonizeOk: snap.colonizeOk,
    independent: snap.independent,
    totalExp: snap.totalExp,
    devSum: snap.devSum,
    combatWins: snap.combatWins,
    credits: snap.credits,
    wall: snap.wall ?? '',
    reanalysis,
  };
  history = [mark, ...history].slice(0, 8);
  baseline = mark;
  memory = emptyStallMemory();
  writeStall(dir);
  return { restart: true, reason: stepped.reason, sectionStreak: stepped.sectionStreak, reanalysis };
}
