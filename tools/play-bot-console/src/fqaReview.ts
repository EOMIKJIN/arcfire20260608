/**
 * FQA 정기 검토. 플레이봇 문제에 플레이 카드 한 단계만 올린다.
 * 가격·전투 계수·현금 바닥 400은 이 함수가 바꾸지 않는다.
 */
import type { GameIssue } from './gameIssues';
import {
  PLAY_INTEL_CASH_FLOOR,
  PLAY_INTEL_FAIR_MAX,
  PLAY_INTEL_FAIR_MIN,
  PLAY_INTEL_MINE_CAP_MAX,
  PLAY_INTEL_MINE_CAP_MIN,
  type PlayIntelligenceCard,
  defaultPlayIntelligence,
} from './playIntelligence';

export const FQA_CASH_ISSUE_IDS = [
  'balance:credit-drain',
  'balance:insolvency',
  'balance:opening-insolvency',
] as const;

export const FQA_FIGHT_ISSUE_IDS = [
  'balance:early-combat',
  'balance:early-hangar-wipe',
] as const;

const CASH = new Set<string>(FQA_CASH_ISSUE_IDS);
const FIGHT = new Set<string>(FQA_FIGHT_ISSUE_IDS);

/** 새 전투 모델 증거가 쌓이기 전에는 옛 패배 증거로 수련선·채굴 상한을 올리지 않는다. */
export const FQA_CARD_RAISE_HOLD = true;

export type FqaReviewState = {
  version: 1;
  updatedAt: string;
  lastSig: string;
  seenEvidence: Record<string, number>;
  reviews: number;
  consultPending: boolean;
};

export type FqaReviewPlan = {
  card: PlayIntelligenceCard;
  cardChanged: boolean;
  signature: string;
  seenEvidence: Record<string, number>;
  responses: { id: string; text: string }[];
  outside: string[];
};

export function emptyFqaReviewState(): FqaReviewState {
  return {
    version: 1,
    updatedAt: '',
    lastSig: '',
    seenEvidence: {},
    reviews: 0,
    consultPending: false,
  };
}

export function issueSignature(issues: readonly GameIssue[]): string {
  const parts: string[] = [];
  for (let i = 0; i < issues.length; i += 1) {
    parts.push(`${issues[i].id}:${issues[i].evidence}`);
  }
  parts.sort();
  return parts.join('|');
}

export function reviewNeeded(state: FqaReviewState, issues: readonly GameIssue[]): boolean {
  if (state.consultPending) return true;
  return issueSignature(issues) !== state.lastSig;
}

function bumpFair(current: number): number {
  const next = Math.round((current + 0.05) * 100) / 100;
  return next > PLAY_INTEL_FAIR_MAX ? PLAY_INTEL_FAIR_MAX : next;
}

/** 증거가 처음이면 기준만 남긴다. 늘어난 뒤에만 카드 한 단계. */
export function planFqaReview(
  issues: readonly GameIssue[],
  card: PlayIntelligenceCard,
  seenEvidence: Readonly<Record<string, number>>,
): FqaReviewPlan {
  const next = defaultPlayIntelligence();
  next.updatedAt = card.updatedAt;
  next.mineCap = card.mineCap;
  next.fairFightMin = card.fairFightMin;
  next.earnEnabled = card.earnEnabled !== false;
  next.fairFightEnabled = card.fairFightEnabled !== false;
  next.cashFloor = PLAY_INTEL_CASH_FLOOR;
  const seen: Record<string, number> = { ...seenEvidence };
  let cashGrew = false;
  let fightGrew = false;
  for (let i = 0; i < issues.length; i += 1) {
    const row = issues[i];
    const prev = seen[row.id];
    const grew = prev !== undefined && row.evidence > prev;
    if (grew && CASH.has(row.id)) cashGrew = true;
    if (grew && FIGHT.has(row.id)) fightGrew = true;
  }
  const mineBefore = next.mineCap;
  const fairBefore = next.fairFightMin;
  if (!FQA_CARD_RAISE_HOLD && cashGrew && next.mineCap < PLAY_INTEL_MINE_CAP_MAX) {
    next.mineCap = Math.min(PLAY_INTEL_MINE_CAP_MAX, next.mineCap + 4);
  }
  if (!FQA_CARD_RAISE_HOLD && fightGrew && next.fairFightMin < PLAY_INTEL_FAIR_MAX) {
    next.fairFightMin = bumpFair(next.fairFightMin);
  }
  if (next.mineCap < PLAY_INTEL_MINE_CAP_MIN) next.mineCap = PLAY_INTEL_MINE_CAP_MIN;
  if (next.fairFightMin < PLAY_INTEL_FAIR_MIN) next.fairFightMin = PLAY_INTEL_FAIR_MIN;
  const responses: { id: string; text: string }[] = [];
  const outside: string[] = [];
  for (let i = 0; i < issues.length; i += 1) {
    const row = issues[i];
    const prev = seen[row.id];
    const first = prev === undefined;
    seen[row.id] = row.evidence;
    if (CASH.has(row.id)) {
      const step = next.mineCap !== mineBefore
        ? `증거 ${prev}→${row.evidence}. 채굴 상한 ${mineBefore}→${next.mineCap}.`
        : (first
          ? `기준 증거 ${row.evidence} 기록. 채굴 상한 ${next.mineCap} 유지.`
          : `증거 ${row.evidence} 유지. 채굴 상한 ${next.mineCap} 유지.`);
      responses.push({
        id: row.id,
        text: `${step} 돈은 퀘스트 보상, 없으면 채굴 후 매도 310으로 번다. 매수는 820 이상. 가격·개발비·바닥 400은 유지.`,
      });
      continue;
    }
    if (FIGHT.has(row.id)) {
      const step = next.fairFightMin !== fairBefore
        ? `증거 ${prev}→${row.evidence}. 수련선 ${fairBefore}→${next.fairFightMin}.`
        : (first
          ? `기준 증거 ${row.evidence} 기록. 수련선 ${next.fairFightMin} 유지.`
          : `증거 ${row.evidence} 유지. 수련선 ${next.fairFightMin} 유지.`);
      responses.push({
        id: row.id,
        text: `${step} 수련·유랑은 그 승률 미만이면 하지 않는다. 주사위 계수는 유지.`,
      });
      continue;
    }
    outside.push(row.id);
    responses.push({
      id: row.id,
      text: `증거 ${row.evidence}. 카탈로그 밖이라 플레이 카드는 올리지 않는다. 게임 수치는 유지. 김팀장 세션에서 플레이 기능을 추가한다.`,
    });
  }
  const cardChanged = next.mineCap !== card.mineCap || next.fairFightMin !== card.fairFightMin;
  return {
    card: next,
    cardChanged,
    signature: issueSignature(issues),
    seenEvidence: seen,
    responses,
    outside,
  };
}
