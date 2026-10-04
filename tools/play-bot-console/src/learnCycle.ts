import fs from 'node:fs';
import path from 'node:path';
import { atomicWriteFile } from './learnedIo';

/** 벽시계. 가상일 환산 금지. policy 디바운스와 키를 나누기 위해 scheduleLearnedWrite 를 쓰지 않는다. */
export const LEARN_CYCLE_FLUSH_MIN_MS = 10 * 60 * 1000;
export const LIVE_PARENT_COUNT = 55;
export const ENDGAME_ENTRY_LEVEL = 52;

export type LearnGapClass = 'bot_function' | 'game_function' | 'hold' | 'twin_hold';

export type LearnGap = {
  code: string;
  class: LearnGapClass;
  detail: string;
};

export type LearnPhaseId = 'P0' | 'P1' | 'P2' | 'P3' | 'P4' | 'P5';

export type LearnCycleInput = {
  day: number;
  level: number;
  questCleared: number;
  annexOk: number;
  colonizeOk: number;
  blue: number;
  red: number;
  independent: number;
  capitalDestroyed: number;
  credits: number;
  combatWins: number;
  combatLosses: number;
  planetId: string;
  combatMethod: 'absent' | 'present';
};

export type LearnCycleAssessment = {
  phase: LearnPhaseId;
  design: string;
  declareComplete: false;
  declareReason: string;
  gaps: LearnGap[];
  signature: string;
};

export type LearnCycleClock = {
  signature: string;
  wallMs: number;
};

const STANDING: readonly LearnGap[] = [
  {
    code: 'DESIGN_BLANK',
    class: 'game_function',
    detail: '실행은 고정 분기와 주사위 전투다. 웨이브 9·이터니티 복제·레벨밴드 전략은 설계에 없다.',
  },
  {
    code: 'MARKER_TRAVEL_ONLY',
    class: 'game_function',
    detail: '중요 플레이 마커는 이동 4종이다. 전투 방식은 이 수집에서 생기지 않는다.',
  },
  {
    code: 'READ_OFFSET_BEFORE_AWAKE',
    class: 'twin_hold',
    detail: '화면 판정보다 읽기 위치를 먼저 올린다. 선행 합의로 이번 반영에서 보류.',
  },
];

export function designPhase(level: number): { phase: LearnPhaseId; design: string } {
  if (level < 3) {
    return { phase: 'P0', design: '튜토리얼. 아르카디아·솔라, 본편 첫 퀘스트.' };
  }
  if (level < 12) {
    return { phase: 'P1', design: '초반 요새. 베가 웨이브, 드라코 보스, 본편 q02–q06.' };
  }
  if (level < 37) {
    return { phase: 'P2', design: '중반. 수락의뢰 33, 무역, 개발, 분쟁.' };
  }
  if (level < ENDGAME_ENTRY_LEVEL) {
    return { phase: 'P3', design: '후반 침투. 오메가~블러드. 수도 교전은 주사위 1승이 아니다.' };
  }
  if (level < 56) {
    return { phase: 'P4', design: '종반 문턱. 어비스 착륙, story_022, 독립국 1.' };
  }
  return { phase: 'P5', design: '엔드. 이터니티 착륙 9웨이브. 레벨 상한은 완료가 아니다.' };
}

export function assessLearnCycle(input: LearnCycleInput): LearnCycleAssessment {
  const phased = designPhase(input.level);
  const gaps: LearnGap[] = STANDING.slice();
  if (input.combatMethod !== 'present') {
    gaps.push({
      code: 'COMBAT_METHOD_ABSENT',
      class: 'game_function',
      detail: '거리·무기·접근 기록이 없다.',
    });
  }
  if (input.questCleared >= LIVE_PARENT_COUNT) {
    gaps.push({
      code: 'QUEST_COUNT_NOT_CLOSE',
      class: 'hold',
      detail: `퀘스트 ${input.questCleared}은 부모 ${LIVE_PARENT_COUNT}의 대리가 아니다. story_022와 의뢰 33의 개별 클리어는 이 수로 확정하지 않는다.`,
    });
  }
  if (input.independent === 0 && input.colonizeOk === 0 && input.annexOk === 0) {
    gaps.push({
      code: 'INDEPENDENT_ZERO',
      class: 'bot_function',
      detail: `독립국 0 · 편입 ${input.annexOk} · 개척 ${input.colonizeOk}. 이번 사이클은 편입 가중을 올리지 않는다.`,
    });
  }
  if (input.blue < input.red) {
    gaps.push({
      code: 'BLUE_BELOW_RED',
      class: 'hold',
      detail: `블루 ${input.blue} · 레드 ${input.red}. 소프트 관측. 가중 보정은 하지 않는다.`,
    });
  }
  if (input.capitalDestroyed > 0) {
    gaps.push({
      code: 'CAPITAL_DICE',
      class: 'game_function',
      detail: '수도 플래그는 core_prime 주사위다. 이터니티 웨이브 9가 아니다.',
    });
  }
  if (input.level >= 60) {
    gaps.push({
      code: 'LEVEL_CAP_NOT_END',
      class: 'hold',
      detail: `레벨 ${input.level}은 경험치 표 상한이다. 크레딧 ${input.credits} · 전투 ${input.combatWins}승/${input.combatLosses}패.`,
    });
  }
  const codes = gaps.map((g) => g.code).sort();
  const signature = `${phased.phase}|${codes.join(',')}`;
  return {
    phase: phased.phase,
    design: phased.design,
    declareComplete: false,
    declareReason: '전투 방식 기록이 없고 독립국이 없으면 인간 수준과 시나리오 완료를 말하지 않는다.',
    gaps,
    signature,
  };
}

export function nextLearnCycleWrite(
  prev: LearnCycleClock | null,
  signature: string,
  nowMs: number,
): { write: boolean; next: LearnCycleClock } {
  if (!prev || prev.signature !== signature || nowMs - prev.wallMs >= LEARN_CYCLE_FLUSH_MIN_MS) {
    return { write: true, next: { signature, wallMs: nowMs } };
  }
  return { write: false, next: prev };
}

let clock: LearnCycleClock | null = null;
let methodCache: 'absent' | 'present' = 'absent';
let methodMtime = -1;

export function resetLearnCycleForTest(): void {
  clock = null;
  methodCache = 'absent';
  methodMtime = -1;
}

export function readCombatMethod(dir: string): 'absent' | 'present' {
  const file = path.join(dir, 'human-delta.json');
  let mtime = -1;
  try {
    mtime = fs.statSync(file).mtimeMs;
  } catch {
    methodCache = 'absent';
    methodMtime = -1;
    return 'absent';
  }
  if (mtime === methodMtime) return methodCache;
  try {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8')) as { combatMethod?: string };
    methodCache = raw.combatMethod === 'present' ? 'present' : 'absent';
  } catch {
    methodCache = 'absent';
  }
  methodMtime = mtime;
  return methodCache;
}

export function learnCyclePath(dir: string): string {
  return path.join(dir, 'learn-cycle-latest.json');
}

export function commitLearnCycle(
  dir: string,
  input: LearnCycleInput & { runId: string; planetId: string; botPatchLoaded: boolean },
  nowMs: number,
): { wrote: boolean; assessment: LearnCycleAssessment } {
  const assessment = assessLearnCycle(input);
  const decision = nextLearnCycleWrite(clock, assessment.signature, nowMs);
  if (!decision.write) return { wrote: false, assessment };
  const body = `${JSON.stringify({
    version: 1,
    updatedAt: new Date(nowMs).toISOString(),
    runId: input.runId,
    day: input.day,
    planetId: input.planetId,
    phase: assessment.phase,
    design: assessment.design,
    declareComplete: assessment.declareComplete,
    declareReason: assessment.declareReason,
    botPatchLoaded: input.botPatchLoaded,
    appliedThisCycle: ['fightHere: BLUE 승리는 영토를 유지. RED 승리만 중립.'],
    gaps: assessment.gaps,
    signature: assessment.signature,
  }, null, 2)}\n`;
  const ok = atomicWriteFile(learnCyclePath(dir), body);
  if (ok) clock = decision.next;
  return { wrote: ok, assessment };
}
