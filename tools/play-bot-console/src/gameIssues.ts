/**
 * FQA. 플레이봇은 문제와 증거만 올린다. 대응 문장은 김팀장·김클로드 협의본만 유지한다.
 * [pss-pre-dev] hot_path=가상일 1회 alloc=조건이 바뀔 때만 배열 cache=id+evidence+대응시각
 * [pss-pre-dev] stage=Node 트윈 risk=P6 신규 문제·정체·벽시계 10분만 기록 verdict=PASS
 * 플레이 수준 보고 시 logs/learned/FQA.md 를 함께 읽는다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { atomicWriteFile } from './learnedIo';
import { LIVE_PARENT_COUNT } from './learnCycle';
import { CREDIT_DRAIN_LOW_BALANCE, CREDIT_DRAIN_MIN_DROP, isCreditDrain } from './analyze';

export const GAME_ISSUE_FLUSH_MIN_MS = 10 * 60 * 1000;
export const QUEST_END_FLAT_DAYS = 8;
export const FQA_OPENING_DAYS = 3;

export type GameIssueCategory = 'balance' | 'section' | 'system';

export type FqaResponse = {
  at: string;
  by: 'kim-team-lead+kim-claude';
  text: string;
};

export type GameIssue = {
  id: string;
  category: GameIssueCategory;
  title: string;
  detail: string;
  evidence: number;
  firstDay: number;
  lastDay: number;
  runId: string;
  response: FqaResponse | null;
};

export type GameIssueObservation = {
  runId: string;
  day: number;
  level: number;
  questCleared: number;
  independent: number;
  annexOk: number;
  colonizeOk: number;
  combatWins: number;
  combatLosses: number;
  questFlatDays: number;
  insolventDays: number;
  drainHits: number;
  lastHoldReason: string;
  credits: number;
  hangarShips: number;
  findings: readonly { code: string; detail: string }[];
};

const DEST_REASONS = new Set(['no_dest_system', 'unresolved_placeholder', 'no_discovery']);

const CATEGORY_TITLE: Record<GameIssueCategory, string> = {
  section: '구간콘텐츠',
  balance: '밸런싱',
  system: '플레이시스템',
};

type IssueFile = {
  version: 1;
  updatedAt: string;
  stallRestarts: number;
  lastReanalysis: string;
  issues: GameIssue[];
};

let issues: GameIssue[] = [];
let stallRestarts = 0;
let lastReanalysis = '';
let lastWriteMs = 0;
let lastSig = '';
let creditRing: number[] = [];
let drainHits = 0;
let drainLatched = false;
let drainReported = false;

export function resetGameIssuesForTest(): void {
  issues = [];
  stallRestarts = 0;
  lastReanalysis = '';
  lastWriteMs = 0;
  lastSig = '';
  resetGameIssueRunMemory();
}

/** 캠페인 시드 직후. 확정된 문제 목록은 유지하고 이번 세계 경제 창만 비운다. */
export function resetGameIssueRunMemory(): void {
  creditRing = [];
  drainHits = 0;
  drainLatched = false;
  drainReported = false;
}

export function gameIssuesPath(dir: string): string {
  return path.join(dir, 'FQA.json');
}

export function gameIssuesMarkdownPath(dir: string): string {
  return path.join(dir, 'FQA.md');
}

function findingDetail(obs: GameIssueObservation, code: string): string {
  for (let i = 0; i < obs.findings.length; i += 1) {
    if (obs.findings[i].code === code) return obs.findings[i].detail;
  }
  return '';
}

function hasFinding(obs: GameIssueObservation, code: string): boolean {
  for (let i = 0; i < obs.findings.length; i += 1) {
    if (obs.findings[i].code === code) return true;
  }
  return false;
}

function touch(
  prev: readonly GameIssue[],
  id: string,
  category: GameIssueCategory,
  title: string,
  detail: string,
  obs: GameIssueObservation,
): { issues: GameIssue[]; added: boolean } {
  const idx = prev.findIndex((row) => row.id === id);
  if (idx >= 0) {
    const cur = prev[idx];
    if (cur.lastDay === obs.day && cur.runId === obs.runId) {
      return { issues: prev as GameIssue[], added: false };
    }
    const next = prev.slice();
    next[idx] = {
      ...cur,
      detail,
      evidence: cur.evidence + 1,
      lastDay: obs.day,
      runId: obs.runId,
    };
    return { issues: next, added: false };
  }
  return {
    issues: prev.concat([{
      id,
      category,
      title,
      detail,
      evidence: 1,
      firstDay: obs.day,
      lastDay: obs.day,
      runId: obs.runId,
      response: null,
    }]),
    added: true,
  };
}

export function issuesFromObservation(
  prev: readonly GameIssue[],
  obs: GameIssueObservation,
): { issues: GameIssue[]; addedIds: string[] } {
  let next = prev as GameIssue[];
  const addedIds: string[] = [];
  const apply = (id: string, category: GameIssueCategory, title: string, detail: string) => {
    const touched = touch(next, id, category, title, detail, obs);
    next = touched.issues;
    if (touched.added) addedIds.push(id);
  };

  if (hasFinding(obs, 'PLACEHOLDER_UNRESOLVED')) {
    apply(
      'section:placeholder-unresolved',
      'section',
      '미해석 퀘스트 토큰',
      findingDetail(obs, 'PLACEHOLDER_UNRESOLVED'),
    );
  }
  if (hasFinding(obs, 'QUEST_STUCK')) {
    apply(
      'section:quest-stuck',
      'section',
      '수락 퀘스트 장기 미클리어',
      findingDetail(obs, 'QUEST_STUCK'),
    );
  }
  if (
    obs.questFlatDays >= QUEST_END_FLAT_DAYS
    && obs.questCleared >= LIVE_PARENT_COUNT
    && obs.independent === 0
    && obs.annexOk === 0
    && obs.colonizeOk === 0
  ) {
    apply(
      'section:quest-end-before-endgame',
      'section',
      '수행 가능 퀘스트가 엔드 전에 멈춤',
      `퀘스트 수 ${obs.questCleared}이 ${obs.questFlatDays}일째 멈추고 독립국·편입·개척이 없다. 레벨 ${obs.level}. 다음 구간으로 이어지는 플레이가 확인되지 않는다.`,
    );
  }
  if (obs.insolventDays >= 2) {
    apply(
      'balance:insolvency',
      'balance',
      '크레딧 부족 반복',
      `최근 창에서 크레딧 400 미만이 ${obs.insolventDays}일이다. 매입·설치가 막힌다.`,
    );
  }
  const fights = obs.combatWins + obs.combatLosses;
  if (fights >= 6 && fights <= 48 && obs.combatLosses > obs.combatWins + 4) {
    apply(
      'balance:early-combat',
      'balance',
      '초반 전투 패배 우위',
      `초반 전투 ${obs.combatWins}승 ${obs.combatLosses}패. 레벨 ${obs.level}에서 패가 더 많다.`,
    );
  }
  if (obs.drainHits >= 1 && !drainReported) {
    drainReported = true;
    apply(
      'balance:credit-drain',
      'balance',
      '크레딧 급감',
      `크레딧이 3일 안에 ${CREDIT_DRAIN_MIN_DROP} 이상 줄어 잔액 ${CREDIT_DRAIN_LOW_BALANCE} 아래로 떨어진 구간이 이번 세계에서 1회다.`,
    );
  }
  if (obs.day <= FQA_OPENING_DAYS && obs.hangarShips <= 0 && obs.combatLosses >= 1) {
    apply(
      'balance:early-hangar-wipe',
      'balance',
      '초반 격납고 소진',
      `초반 ${obs.day}일에 격납고가 비었다. 전투 ${obs.combatWins}승 ${obs.combatLosses}패. 레벨 ${obs.level}.`,
    );
  }
  if (obs.day <= FQA_OPENING_DAYS && obs.credits < 400) {
    apply(
      'balance:opening-insolvency',
      'balance',
      '초반 크레딧 바닥',
      `초반 ${obs.day}일 마감 크레딧 ${obs.credits}. 매입·설치 선 400 아래다.`,
    );
  }
  if (hasFinding(obs, 'PLACEHOLDER_HOLD') || DEST_REASONS.has(obs.lastHoldReason)) {
    const detail = findingDetail(obs, 'PLACEHOLDER_HOLD') || obs.lastHoldReason;
    apply('system:unresolved-destination', 'system', '퀘스트 목적지 미해석', detail);
  }
  if (hasFinding(obs, 'QUEST_BUY')) {
    apply('system:quest-buy', 'system', '퀘스트 매입 불가', findingDetail(obs, 'QUEST_BUY'));
  }
  return { issues: next, addedIds };
}

export function formatGameIssuesMarkdown(
  rows: readonly GameIssue[],
  reanalysis: string,
  restarts: number,
): string {
  const lines = [
    '# FQA',
    '',
    '플레이봇이 반복 플레이로 문제를 판단해 올리고, 증거만 갱신한다.',
    '문제가 명시되면 김팀장과 김클로드가 협의하고 대응만 항목에 붙인다.',
    '플레이봇은 대응 문장을 수정하지 않는다.',
    '',
    `정체 재시작 ${restarts}회.`,
    reanalysis ? `최근 재분석: ${reanalysis}` : '최근 재분석: 아직 없음.',
    '',
  ];
  const order: GameIssueCategory[] = ['section', 'balance', 'system'];
  let any = false;
  for (let i = 0; i < order.length; i += 1) {
    const category = order[i];
    const group = rows.filter((row) => row.category === category);
    if (group.length === 0) continue;
    any = true;
    lines.push(`## ${CATEGORY_TITLE[category]}`);
    for (let j = 0; j < group.length; j += 1) {
      const row = group[j];
      const response = row.response?.text ? row.response.text : '협의 전';
      lines.push(`- ${row.title} — ${row.detail} (확인 ${row.evidence}회 · D${row.firstDay}–D${row.lastDay})`);
      lines.push(`  - 대응: ${response}`);
    }
    lines.push('');
  }
  if (!any) lines.push('아직 플레이로 확인된 항목이 없다.');
  lines.push('');
  return lines.join('\n');
}

function economySample(credits: number): { insolventDays: number; drainHits: number } {
  creditRing.push(credits);
  if (creditRing.length > 8) creditRing.shift();
  let insolventDays = 0;
  for (let i = 0; i < creditRing.length; i += 1) {
    if (creditRing[i] < 400) insolventDays += 1;
  }
  if (creditRing.length >= 4) {
    if (isCreditDrain(creditRing[creditRing.length - 4], creditRing[creditRing.length - 1])) {
      if (!drainLatched) {
        drainHits += 1;
        drainLatched = true;
      }
    }
  }
  return { insolventDays, drainHits };
}

function issueSig(rows: readonly GameIssue[], reanalysis: string, restartCount: number): string {
  const body = rows.map((row) => `${row.id}:${row.evidence}:${row.lastDay}:${row.response?.at ?? ''}`).join(',');
  return `${restartCount}|${reanalysis}|${body}`;
}

function readIssueFile(dir: string): Partial<IssueFile> | null {
  const files = [gameIssuesPath(dir), path.join(dir, 'game-issues-latest.json')];
  for (let i = 0; i < files.length; i += 1) {
    try {
      return JSON.parse(fs.readFileSync(files[i], 'utf8')) as Partial<IssueFile>;
    } catch {
      /* 다음 파일 */
    }
  }
  return null;
}

function normalizeIssue(row: GameIssue): GameIssue {
  return { ...row, response: row.response ?? null };
}

function writeFqaFiles(dir: string, nowMs: number): boolean {
  const json = `${JSON.stringify({
    version: 2,
    updatedAt: new Date(nowMs).toISOString(),
    stallRestarts,
    lastReanalysis,
    issues,
  }, null, 2)}\n`;
  const md = formatGameIssuesMarkdown(issues, lastReanalysis, stallRestarts);
  return atomicWriteFile(gameIssuesPath(dir), json)
    && atomicWriteFile(gameIssuesMarkdownPath(dir), md);
}

export function loadGameIssues(dir: string): GameIssue[] {
  resetGameIssueRunMemory();
  const raw = readIssueFile(dir);
  if (!raw) {
    issues = [];
    stallRestarts = 0;
    lastReanalysis = '';
    lastSig = '';
    lastWriteMs = 0;
    return issues;
  }
  issues = Array.isArray(raw.issues) ? raw.issues.map((row) => normalizeIssue(row)) : [];
  stallRestarts = typeof raw.stallRestarts === 'number' ? raw.stallRestarts : 0;
  lastReanalysis = typeof raw.lastReanalysis === 'string' ? raw.lastReanalysis : '';
  lastSig = issueSig(issues, lastReanalysis, stallRestarts);
  lastWriteMs = Date.now();
  return issues;
}

export function ensureFqaProblem(
  dir: string,
  row: Omit<GameIssue, 'response'>,
  nowMs: number,
): void {
  loadGameIssues(dir);
  if (issues.some((item) => item.id === row.id)) return;
  issues = issues.concat([{ ...row, response: null }]);
  if (writeFqaFiles(dir, nowMs)) {
    lastWriteMs = nowMs;
    lastSig = issueSig(issues, lastReanalysis, stallRestarts);
  }
}

export function attachFqaResponse(dir: string, id: string, text: string, nowMs: number): boolean {
  loadGameIssues(dir);
  const idx = issues.findIndex((item) => item.id === id);
  if (idx < 0) return false;
  const next = issues.slice();
  next[idx] = {
    ...next[idx],
    response: {
      at: new Date(nowMs).toISOString(),
      by: 'kim-team-lead+kim-claude',
      text,
    },
  };
  issues = next;
  const ok = writeFqaFiles(dir, nowMs);
  if (ok) {
    lastWriteMs = nowMs;
    lastSig = issueSig(issues, lastReanalysis, stallRestarts);
  }
  return ok;
}

export function commitGameIssues(
  dir: string,
  obs: Omit<GameIssueObservation, 'insolventDays' | 'drainHits'> & { credits: number },
  nowMs: number,
  opts?: { force?: boolean; reanalysis?: string; stallRestarts?: number },
): { addedIds: string[]; wrote: boolean } {
  const economy = economySample(obs.credits);
  const folded = issuesFromObservation(issues, {
    ...obs,
    insolventDays: economy.insolventDays,
    drainHits: economy.drainHits,
  });
  issues = folded.issues;
  if (opts?.reanalysis) lastReanalysis = opts.reanalysis;
  if (typeof opts?.stallRestarts === 'number') stallRestarts = opts.stallRestarts;
  const sig = issueSig(issues, lastReanalysis, stallRestarts);
  const changed = sig !== lastSig;
  const due = lastWriteMs === 0 || nowMs - lastWriteMs >= GAME_ISSUE_FLUSH_MIN_MS;
  const write = folded.addedIds.length > 0 || !!opts?.force || (changed && due);
  if (!write) return { addedIds: folded.addedIds, wrote: false };
  const ok = writeFqaFiles(dir, nowMs);
  if (ok) {
    lastWriteMs = nowMs;
    lastSig = sig;
  }
  return { addedIds: folded.addedIds, wrote: ok };
}
