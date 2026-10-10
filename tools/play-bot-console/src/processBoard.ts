/**
 * 김플레이 3단 프로세스 감시판.
 * 1단 김플레이(봇 개선) · 2단 플레이봇(자체 학습) · 3단 김팀장·대표님(게임 개선).
 * 단계마다 OK/RUN/WAIT/HOLD/RISK/STOP 을 매기고, 상태가 바뀌면 채팅 보고 대기 파일로 알린다.
 * 30분 FQA 루프에서 1회씩 돈다. 앱·게임 코드는 읽기만 한다.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { toolRoot } from './io';
import { checkContentBands, checkHullBuyWindow, checkLevelCliffs } from './progressionChecks';

export type StageState = 'OK' | 'RUN' | 'WAIT' | 'HOLD' | 'RISK' | 'STOP';

export type StageCheck = {
  id: string;
  lane: 1 | 2 | 3;
  label: string;
  state: StageState;
  owner: string;
  detail: string;
};

type DoneWhen =
  | { kind: 'committed'; paths: string[] }
  | { kind: 'changed'; paths: string[] }
  | { kind: 'npmScript'; script: string }
  | { kind: 'manual' };

export type ProcessItem = {
  id: string;
  lane: 1 | 3;
  owner: string;
  title: string;
  since: string;
  doneWhen: DoneWhen;
  done?: boolean;
  blocksLane?: number;
};

export type BenchRecord = {
  at: string;
  avg: {
    level: number;
    quests: number;
    story: number;
    hullRank: number;
    fuel: number;
    /** 밸런싱 안정화(2026-10-10) — 첫 상위 함선 구매 레벨 · 구매 시드 수 · 레벨 시간 절벽 */
    hullBuyLevel?: number;
    hullBuySeeds?: number;
    cliffs?: string[];
  };
  total: { hardStalls: number; sectionStalls: number };
};

export type ProcessInput = {
  nowMs: number;
  pids: Record<string, boolean | null>;
  /** 하네스 pid 파일 시각 = 현재 코드 기동 시각. */
  harnessStartMs?: number | null;
  policyUpdatedMs: number | null;
  policyGeneration: number | null;
  deltaCapturedMs: number | null;
  deltaConsumed: boolean | null;
  newestOwnerSessionMs: number | null;
  fqaUpdatedMs: number | null;
  fqaConsultPending: boolean;
  fqaCardRaiseHold: boolean;
  stallRecent: { at: number; reason: string; wall: string }[];
  bench: BenchRecord[];
  handoffStatus: string | null;
  handoffMs: number | null;
  items: { item: ProcessItem; done: boolean; changedMs: number | null }[];
  mirrorChanged: { path: string; ms: number }[];
  /** 트윈 규칙을 실기에 맞춘 기준 시각 — 이전 벤치는 「최고 대비 후퇴」 비교에서 제외 */
  benchBaselineMs?: number;
};

const HOUR = 3600_000;
const ORDER: StageState[] = ['STOP', 'RISK', 'HOLD', 'WAIT', 'RUN', 'OK'];

function ageText(nowMs: number, ms: number | null): string {
  if (ms == null) return '기록 없음';
  const h = (nowMs - ms) / HOUR;
  if (h < 1) return `${Math.max(0, Math.round(h * 60))}분 전`;
  if (h < 48) return `${Math.round(h)}시간 전`;
  return `${Math.round(h / 24)}일 전`;
}

/** 입력만으로 단계 판정. 파일·프로세스 접근 없음(테스트 대상). */
export function evaluateProcess(input: ProcessInput): StageCheck[] {
  const now = input.nowMs;
  const out: StageCheck[] = [];
  const push = (c: StageCheck) => out.push(c);

  // ── 2단 플레이봇 자체 학습 ──
  const procs: [string, string][] = [
    ['harness', '시뮬레이션 하네스'],
    ['fqa-review', 'FQA 30분 검토 루프'],
    ['owner-auto', '실기 로그 자동 수집기'],
    ['console', '콘솔'],
  ];
  for (const [key, label] of procs) {
    const alive = input.pids[key];
    push({
      id: `proc:${key}`,
      lane: 2,
      label,
      state: alive ? 'OK' : 'STOP',
      owner: '김플레이',
      detail: alive ? '가동 중' : alive === null ? 'pid 파일 없음' : '프로세스 종료됨 → `npm run playbot:restart`',
    });
  }

  const deltaAgeH = input.deltaCapturedMs == null ? Infinity : (now - input.deltaCapturedMs) / HOUR;
  const collectorFresh = input.newestOwnerSessionMs != null && now - input.newestOwnerSessionMs < 2 * HOUR;
  push({
    id: 'learn:input',
    lane: 2,
    label: '실기 입력 (대표님 플레이 → human-delta)',
    state: deltaAgeH <= 24 ? 'OK' : collectorFresh ? 'WAIT' : 'RISK',
    owner: deltaAgeH <= 24 ? '플레이봇' : collectorFresh ? '대표님' : '김플레이',
    detail: deltaAgeH <= 24
      ? `마지막 반영 ${ageText(now, input.deltaCapturedMs)}`
      : collectorFresh
        ? `새 실기 플레이 기록 없음 (마지막 ${ageText(now, input.deltaCapturedMs)}). 수집기는 정상 — 대표님 실기 플레이 대기`
        : `수집기 세션도 끊김 (마지막 ${ageText(now, input.newestOwnerSessionMs)}) — 기기 연결·수집기 확인 필요`,
  });

  const policyAgeH = input.policyUpdatedMs == null ? Infinity : (now - input.policyUpdatedMs) / HOUR;
  push({
    id: 'learn:policy',
    lane: 2,
    label: '정책 적응 (사람 패턴 반영)',
    state: policyAgeH <= 24 ? 'OK' : input.deltaConsumed ? 'WAIT' : 'RISK',
    owner: policyAgeH <= 24 ? '플레이봇' : input.deltaConsumed ? '대표님' : '김플레이',
    detail: policyAgeH <= 24
      ? `세대 ${input.policyGeneration ?? '-'} · ${ageText(now, input.policyUpdatedMs)} 갱신`
      : input.deltaConsumed
        ? `세대 ${input.policyGeneration ?? '-'}에서 정지 (${ageText(now, input.policyUpdatedMs)}). 새 입력이 없어 적응할 것이 없음`
        : `미소비 입력이 있는데 ${ageText(now, input.policyUpdatedMs)} 이후 적응 안 됨 — 하네스 확인`,
  });

  // 검토할 새 이슈가 없으면 상태 파일을 안 쓰므로 나이로 생존을 판정하지 않는다(생존은 pid).
  push({
    id: 'learn:fqa',
    lane: 2,
    label: 'FQA 자체 검토 (김클로드 CLI 판정)',
    state: input.fqaConsultPending ? 'WAIT' : 'OK',
    owner: input.fqaConsultPending ? '김클로드 CLI' : '플레이봇',
    detail: input.fqaConsultPending
      ? `CLI 판정 응답 없음 — 다음 30분 회차에 재시도 (마지막 판정 ${ageText(now, input.fqaUpdatedMs)})`
      : `새 이슈 있을 때만 판정 · 마지막 판정 ${ageText(now, input.fqaUpdatedMs)}`,
  });
  if (input.fqaCardRaiseHold) {
    push({
      id: 'learn:card',
      lane: 2,
      label: '판단 카드 자동 상향',
      state: 'HOLD',
      owner: '김플레이',
      detail: '의도적 동결. 벤치에서 카드 값이 진행에 영향 없음(8/0.5 ≈ 16/0.65). 교역 자금 경로 반영 후 재측정 예정',
    });
  }

  // 재기동 전(이전 코드)의 정체는 세지 않는다.
  const since = Math.max(now - 6 * HOUR, input.harnessStartMs ?? 0);
  const hard6h = input.stallRecent.filter((s) => s.reason === 'hard' && s.at >= since);
  const latestStall = input.stallRecent[0];
  const hullWall = latestStall?.wall.startsWith('hull_fund') ?? false;
  const blocker = input.items.find((x) => x.item.blocksLane === 2 && !x.done);
  const held = hullWall && blocker != null;
  push({
    id: 'learn:stall',
    lane: 2,
    label: '성장 정체 (재시작)',
    state: hard6h.length >= 3 ? 'RISK' : held ? 'HOLD' : 'OK',
    owner: hard6h.length >= 3 ? '김플레이' : held ? blocker.item.owner : '플레이봇',
    detail: hard6h.length >= 3
      ? `현재 코드 기동 후 6시간 내 성장 정지 ${hard6h.length}회 — 봇 행동 결함 의심. 최근 벽: ${latestStall?.wall || '-'}`
      : latestStall
        ? `최근 ${latestStall.reason} ${ageText(now, latestStall.at)} · 벽: ${latestStall.wall || '-'}${held ? ` → ${blocker.item.id} 대기` : ''}`
        : '정체 없음',
  });

  // ── 1단 김플레이 봇 개선 ──
  const last = input.bench[input.bench.length - 1];
  const prev = input.bench[input.bench.length - 2];
  const benchAgeH = last ? (now - Date.parse(last.at)) / HOUR : Infinity;
  let benchState: StageState = 'OK';
  let benchDetail = last
    ? `L${last.avg.level} · 퀘스트 ${last.avg.quests} · 본편 ${last.avg.story} · 함선 ${last.avg.hullRank} · 정체 ${last.total.hardStalls}/${last.total.sectionStalls} (${ageText(now, Date.parse(last.at))})`
    : '벤치 기록 없음';
  if (last && (last.total.hardStalls > 0)) {
    benchState = 'RISK';
    benchDetail += ' — 벤치 중 성장 정체 발생';
  }
  if (last && prev && (last.avg.level < prev.avg.level || last.avg.story < prev.avg.story || last.avg.quests < prev.avg.quests)) {
    benchState = 'RISK';
    benchDetail += ` — 직전 대비 후퇴 (L${prev.avg.level}·본편 ${prev.avg.story}·퀘스트 ${prev.avg.quests})`;
  }
  // 직전 1회 비교만으로는 하루 떨어진 뒤 낮은 값끼리 비교해 OK가 된다(2026-10-08 L29→25 를 3일간 놓침).
  // 최근 7일 최고 기록보다 낮으면 회복할 때까지 RISK 유지.
  if (last) {
    // 트윈 규칙을 의도적으로 실기에 맞춘 날(--bench-baseline) 이전 기록은 비교에서 뺀다.
    const weekAgo = Math.max(Date.parse(last.at) - 7 * 24 * HOUR, input.benchBaselineMs ?? 0);
    const recent = input.bench.filter((b) => Date.parse(b.at) >= weekAgo);
    const best = recent.reduce<BenchRecord | null>((acc, b) => {
      if (!acc) return b;
      const score = (r: BenchRecord) => r.avg.story * 1e6 + r.avg.quests * 1e3 + r.avg.level;
      return score(b) > score(acc) ? b : acc;
    }, null);
    if (best && best !== last && (last.avg.story < best.avg.story || last.avg.quests < best.avg.quests || last.avg.level < best.avg.level)) {
      benchState = 'RISK';
      benchDetail += ` — 7일 최고 대비 후퇴 (L${best.avg.level}·본편 ${best.avg.story}·퀘스트 ${best.avg.quests} @ ${best.at.slice(0, 10)})`;
    }
  }
  if (benchState === 'OK' && benchAgeH > 26) benchState = 'WAIT';
  push({ id: 'bot:bench', lane: 1, label: '봇 성능 벤치 (1,200일 × 4시드 · 일 1회)', state: benchState, owner: '김플레이', detail: benchDetail });

  // ── 밸런싱 안정화(대표님 2026-10-10): 레벨 = 플레이 시간 기준 절벽·정체·공백 ──
  const hullWin = last ? checkHullBuyWindow(last.avg) : { state: 'WAIT' as const, detail: '벤치 기록 없음' };
  push({ id: 'bal:hull-window', lane: 1, label: '함선 첫 구매 레벨 — 사다리 목표 창', state: hullWin.state, owner: '김플레이', detail: hullWin.detail });
  const cliff = checkLevelCliffs(last?.avg.cliffs);
  push({ id: 'bal:level-cliff', lane: 1, label: '레벨 시간 절벽(이웃 대비 설계비×1.5 초과)', state: cliff.state, owner: '김플레이', detail: cliff.detail });
  const bands = checkContentBands();
  push({ id: 'bal:content-bands', lane: 1, label: '5레벨 구간별 새 성장 요소(함선·무기·장비·스킬)', state: bands.state, owner: '김플레이', detail: bands.detail });

  // ── 등록 항목 (1단 김플레이 · 3단 김팀장·대표님) ──
  for (const { item, done, changedMs } of input.items) {
    const sinceMs = Date.parse(item.since);
    const ageH = (now - sinceMs) / HOUR;
    let state: StageState;
    let detail: string;
    if (done) {
      state = 'OK';
      detail = '완료';
    } else if (changedMs != null && changedMs > sinceMs) {
      state = 'RUN';
      detail = `${item.owner} 쪽 파일 변경 감지 (${ageText(now, changedMs)}) → 김플레이 트윈 재측정 필요`;
    } else if (item.lane === 1) {
      state = ageH > 72 ? 'HOLD' : 'RUN';
      detail = `${state === 'HOLD' ? '3일 이상 미처리' : '처리 예정'} · 등록 ${ageText(now, sinceMs)}`;
    } else {
      state = ageH > 48 ? 'HOLD' : 'WAIT';
      detail = `${item.owner} 응답 대기 · 요청 ${ageText(now, sinceMs)}${item.blocksLane ? ` · ${item.blocksLane}단 성장을 막는 중` : ''}`;
    }
    push({ id: `item:${item.id}`, lane: item.lane, label: `${item.id} ${item.title}`, state, owner: done ? '-' : item.owner, detail });
  }

  // ── 3단 김팀장 감시 ──
  if (input.handoffStatus) {
    const pending = /PENDING/.test(input.handoffStatus);
    const hAge = input.handoffMs == null ? 0 : (now - input.handoffMs) / HOUR;
    push({
      id: 'lead:handoff',
      lane: 3,
      label: '김팀장 검수 (김플레이 보고서)',
      state: pending ? (hAge > 24 ? 'HOLD' : 'WAIT') : 'OK',
      owner: pending ? '김팀장' : '-',
      detail: `${input.handoffStatus} · 보고 ${ageText(now, input.handoffMs)}`,
    });
  }
  if (input.mirrorChanged.length) {
    const names = input.mirrorChanged.map((m) => path.basename(m.path)).join(', ');
    push({
      id: 'lead:mirror',
      lane: 3,
      label: '게임 변경 → 트윈 정합',
      state: 'RUN',
      owner: '김플레이',
      detail: `봇이 흉내 내는 게임 파일 변경: ${names} → 트윈 반영 확인 후 \`process-board.ts --ack-mirror\``,
    });
  } else {
    push({ id: 'lead:mirror', lane: 3, label: '게임 변경 → 트윈 정합', state: 'OK', owner: '-', detail: '변경 없음' });
  }

  return out;
}

const LANE_TITLE: Record<number, string> = {
  1: '1단 · 봇 성능 개선 (김플레이)',
  2: '2단 · 플레이봇 자체 학습',
  3: '3단 · 게임 기능·밸런스·성능 개선 (대표님·김팀장)',
};

export function worstState(checks: StageCheck[]): StageState {
  let worst: StageState = 'OK';
  for (const c of checks) if (ORDER.indexOf(c.state) < ORDER.indexOf(worst)) worst = c.state;
  return worst;
}

export function renderBoard(checks: StageCheck[], nowMs: number): string {
  const kst = new Date(nowMs + 9 * HOUR).toISOString().replace('T', ' ').slice(0, 16);
  const lines: string[] = [`# 플레이봇 3단 프로세스 감시판 (${kst} KST)`, ''];
  const stuck = checks.filter((c) => c.state !== 'OK' && c.state !== 'RUN').sort((a, b) => ORDER.indexOf(a.state) - ORDER.indexOf(b.state));
  lines.push(`전체: **${worstState(checks)}** · 정체·대기 ${stuck.length}건`, '');
  if (stuck.length) {
    lines.push('## 지금 멈춘 곳', '');
    for (const c of stuck) lines.push(`- **${c.state}** [${c.lane}단 · ${c.owner}] ${c.label} — ${c.detail}`);
    lines.push('');
  }
  for (const lane of [1, 2, 3] as const) {
    lines.push(`## ${LANE_TITLE[lane]} — ${worstState(checks.filter((c) => c.lane === lane))}`, '', '| 상태 | 단계 | 담당 | 내용 |', '|---|---|---|---|');
    for (const c of checks) if (c.lane === lane) lines.push(`| ${c.state} | ${c.label} | ${c.owner} | ${c.detail.replace(/\|/g, '/')} |`);
    lines.push('');
  }
  lines.push('> OK 정상 · RUN 진행 중 · WAIT 다른 담당 응답 대기 · HOLD 장기 대기·의도적 보류 · RISK 이상 징후 · STOP 멈춤');
  return lines.join('\n') + '\n';
}

type BoardState = {
  version: 1;
  states: Record<string, StageState>;
  mirrorAckMs: number;
  lastAlertMs: number;
  /** 반영 확인 시점의 파일 내용 해시 — 수정 시각만 바뀐 경우(데일리 커밋 재기록 등) 오탐 방지 (2026-10-10) */
  mirrorAckHashes?: Record<string, string>;
  /** `--bench-baseline` 시각 — 이전 벤치는 최고 대비 비교에서 제외 */
  benchBaselineMs?: number;
};

/** 줄바꿈 차이를 무시한 내용 해시. 없는 파일은 null. */
function contentHash(file: string): string | null {
  try {
    const text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
    return crypto.createHash('sha1').update(text).digest('hex');
  } catch {
    return null;
  }
}

/** 이전 판정과 비교해 알릴 변화만 고른다. 나빠진 것과 풀린 것. */
export function stateChanges(prev: Record<string, StageState>, checks: StageCheck[]): { worse: StageCheck[]; cleared: StageCheck[] } {
  const worse: StageCheck[] = [];
  const cleared: StageCheck[] = [];
  for (const c of checks) {
    const before = prev[c.id];
    if (!before) {
      if (c.state !== 'OK' && c.state !== 'RUN') worse.push(c);
      continue;
    }
    if (before === c.state) continue;
    if (ORDER.indexOf(c.state) < ORDER.indexOf(before) && c.state !== 'RUN') worse.push(c);
    else if ((c.state === 'OK' || c.state === 'RUN') && before !== 'OK' && before !== 'RUN') cleared.push(c);
  }
  return { worse, cleared };
}

// ── 파일·프로세스 수집 ──

function readJson<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
  } catch {
    return null;
  }
}

function mtimeMs(file: string): number | null {
  try {
    return fs.statSync(file).mtimeMs;
  } catch {
    return null;
  }
}

function pidAlive(file: string): boolean | null {
  let raw = '';
  try {
    raw = fs.readFileSync(file, 'utf8').trim();
  } catch {
    return null;
  }
  const pid = Number(raw.split(/\s+/)[0]);
  if (!Number.isFinite(pid) || pid <= 0) return null;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === 'EPERM';
  }
}

function committed(root: string, paths: string[]): boolean {
  try {
    const out = execFileSync('git', ['status', '--porcelain', '--', ...paths], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    if (out.trim()) return false;
    execFileSync('git', ['ls-files', '--error-unmatch', '--', ...paths], { cwd: root, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

export type ProcessPaths = { root: string; logs: string; learned: string; itemsFile: string };

export function defaultProcessPaths(root = path.resolve(toolRoot(), '..', '..')): ProcessPaths {
  const logs = path.join(root, 'tools', 'play-bot-console', 'logs');
  return { root, logs, learned: path.join(logs, 'learned'), itemsFile: path.join(root, 'tools', 'play-bot-console', 'process-items.json') };
}

function readBench(learned: string): BenchRecord[] {
  try {
    return fs.readFileSync(path.join(learned, 'bench-history.ndjson'), 'utf8').trim().split('\n').filter(Boolean).slice(-10).map((l) => JSON.parse(l) as BenchRecord);
  } catch {
    return [];
  }
}

function readBoardState(learned: string): BoardState {
  const s = readJson<BoardState>(path.join(learned, 'process-board-state.json'));
  return s?.version === 1 ? s : { version: 1, states: {}, mirrorAckMs: 0, lastAlertMs: 0 };
}

export function collectProcessInput(p: ProcessPaths, nowMs: number, cardRaiseHold: boolean): { input: ProcessInput; mirrorPaths: string[] } {
  const reg = readJson<{ handoff?: string; twinMirrorPaths?: string[]; items?: ProcessItem[] }>(p.itemsFile) ?? {};
  const policy = readJson<{ updatedAt?: string; generation?: number }>(path.join(p.learned, 'playbot-policy.json'));
  const delta = readJson<{ capturedAt?: string; consumed?: boolean }>(path.join(p.learned, 'human-delta.json'));
  const fqa = readJson<{ updatedAt?: string; consultPending?: boolean }>(path.join(p.learned, 'fqa-review-state.json'));
  const stall = readJson<{ history?: { at: string; reason: string; wall?: string }[] }>(path.join(p.learned, 'stall-replay.json'));
  const pkg = readJson<{ scripts?: Record<string, string> }>(path.join(p.root, 'package.json'));

  let newestOwner: number | null = null;
  try {
    const raw = path.join(p.learned, 'human-raw');
    for (const name of fs.readdirSync(raw)) {
      if (!name.startsWith('owner')) continue;
      const ms = mtimeMs(path.join(raw, name));
      if (ms != null && (newestOwner == null || ms > newestOwner)) newestOwner = ms;
    }
  } catch {
    /* 수집 전 */
  }

  const items = (reg.items ?? []).map((item) => {
    const dw = item.doneWhen;
    let done = !!item.done;
    let changedMs: number | null = null;
    if (!done && dw.kind === 'committed') done = committed(p.root, dw.paths);
    if (!done && dw.kind === 'npmScript') done = !!pkg?.scripts?.[dw.script];
    if (dw.kind === 'changed') {
      for (const f of dw.paths) {
        const ms = mtimeMs(path.join(p.root, f));
        if (ms != null && (changedMs == null || ms > changedMs)) changedMs = ms;
      }
    }
    return { item, done, changedMs };
  });

  const board = readBoardState(p.learned);
  const mirrorPaths = reg.twinMirrorPaths ?? [];
  const mirrorChanged: { path: string; ms: number }[] = [];
  for (const f of mirrorPaths) {
    const ms = mtimeMs(path.join(p.root, f));
    if (ms == null || ms <= board.mirrorAckMs) continue;
    const ackHash = board.mirrorAckHashes?.[f];
    if (ackHash && ackHash === contentHash(path.join(p.root, f))) continue;
    mirrorChanged.push({ path: f, ms });
  }

  let handoffStatus: string | null = null;
  let handoffMs: number | null = null;
  if (reg.handoff) {
    const file = path.join(p.root, reg.handoff);
    handoffMs = mtimeMs(file);
    try {
      handoffStatus = /status:\s*\*{0,2}([A-Z_]+)/.exec(fs.readFileSync(file, 'utf8'))?.[1] ?? null;
    } catch {
      handoffStatus = null;
    }
  }

  const pid = (name: string) => pidAlive(path.join(p.logs, `playbot-${name}.pid`));
  return {
    mirrorPaths,
    input: {
      nowMs,
      pids: { harness: pid('harness'), 'fqa-review': pid('fqa-review'), 'owner-auto': pid('owner-auto'), console: pid('console') },
      harnessStartMs: mtimeMs(path.join(p.logs, 'playbot-harness.pid')),
      policyUpdatedMs: policy?.updatedAt ? Date.parse(policy.updatedAt) : null,
      policyGeneration: policy?.generation ?? null,
      deltaCapturedMs: delta?.capturedAt ? Date.parse(delta.capturedAt) : null,
      deltaConsumed: delta ? !!delta.consumed : null,
      newestOwnerSessionMs: newestOwner,
      fqaUpdatedMs: fqa?.updatedAt ? Date.parse(fqa.updatedAt) : null,
      fqaConsultPending: !!fqa?.consultPending,
      fqaCardRaiseHold: cardRaiseHold,
      stallRecent: (stall?.history ?? []).map((h) => ({ at: Date.parse(h.at), reason: h.reason, wall: h.wall ?? '' })),
      bench: readBench(p.learned),
      handoffStatus,
      handoffMs,
      items,
      mirrorChanged,
      benchBaselineMs: board.benchBaselineMs,
    },
  };
}

/** 하루 1회 벤치. 별도 프로세스라 하네스·learned 상태와 섞이지 않는다. */
export function runDailyBench(p: ProcessPaths, nowMs: number, force = false): BenchRecord | null {
  const hist = readBench(p.learned);
  const last = hist[hist.length - 1];
  if (!force && last && nowMs - Date.parse(last.at) < 24 * HOUR) return null;
  const script = path.join(p.root, 'tools', 'play-bot-console', 'bench-bot.ts');
  const r = spawnSync(`npx tsx "${script}" 1200 4`, { cwd: p.root, encoding: 'utf8', shell: true, timeout: 15 * 60_000, windowsHide: true });
  const lastLine = (r.stdout ?? '').trim().split('\n').pop() ?? '';
  let parsed: { avg?: BenchRecord['avg']; total?: BenchRecord['total'] } = {};
  try {
    parsed = JSON.parse(lastLine);
  } catch {
    return null;
  }
  if (!parsed.avg || !parsed.total) return null;
  const rec: BenchRecord = { at: new Date(nowMs).toISOString(), avg: parsed.avg, total: parsed.total };
  fs.appendFileSync(path.join(p.learned, 'bench-history.ndjson'), `${JSON.stringify(rec)}\n`, 'utf8');
  return rec;
}

const ALERT_FILE = 'PLAYBOT_CHAT_REPORT_PENDING.md';
const ALERT_ACK = 'PLAYBOT_CHAT_REPORT_PENDING.ack.md';
const ALERT_MIN_GAP_MS = 2 * HOUR;

function renderAlert(worse: StageCheck[], cleared: StageCheck[], nowMs: number): string {
  const kst = new Date(nowMs + 9 * HOUR).toISOString().replace('T', ' ').slice(0, 16);
  const lines = [`## 김플레이 프로세스 알림 (${kst} KST)`, ''];
  for (const c of worse) lines.push(`- **${c.state}** [${c.lane}단 · ${c.owner}] ${c.label} — ${c.detail}`);
  for (const c of cleared) lines.push(`- 해소 [${c.lane}단] ${c.label} — ${c.detail}`);
  lines.push('', '전체 감시판: `tools/play-bot-console/logs/PLAYBOT_PROCESS_BOARD.md`');
  return lines.join('\n');
}

/**
 * 채팅 보고 대기 파일에 알림을 쓴다. 아직 확인 안 된 다른 보고(18:00 데일리 등)가 있으면 뒤에 붙인다.
 * STOP·RISK 는 바로, 그 외는 2시간에 한 번만.
 */
function writeAlert(p: ProcessPaths, body: string): void {
  const file = path.join(p.logs, ALERT_FILE);
  const pendingMs = mtimeMs(file);
  const ackMs = mtimeMs(path.join(p.logs, ALERT_ACK));
  const unacked = pendingMs != null && (ackMs == null || ackMs < pendingMs);
  let prev = '';
  if (unacked) {
    try {
      prev = fs.readFileSync(file, 'utf8').replace(/\n## 김플레이 프로세스 알림[\s\S]*$/, '').trim();
    } catch {
      prev = '';
    }
  }
  fs.writeFileSync(file, prev ? `${prev}\n\n${body}\n` : `${body}\n`, 'utf8');
}

export type BoardResult = { checks: StageCheck[]; alerted: boolean; boardFile: string };

export function runProcessBoard(opts: { paths?: ProcessPaths; nowMs?: number; cardRaiseHold: boolean; bench?: boolean; alert?: boolean }): BoardResult {
  const p = opts.paths ?? defaultProcessPaths();
  const nowMs = opts.nowMs ?? Date.now();
  fs.mkdirSync(p.learned, { recursive: true });
  if (opts.bench) runDailyBench(p, nowMs);
  const { input } = collectProcessInput(p, nowMs, opts.cardRaiseHold);
  const checks = evaluateProcess(input);
  const boardFile = path.join(p.logs, 'PLAYBOT_PROCESS_BOARD.md');
  fs.writeFileSync(boardFile, renderBoard(checks, nowMs), 'utf8');

  const state = readBoardState(p.learned);
  const { worse, cleared } = stateChanges(state.states, checks);
  const urgent = worse.some((c) => c.state === 'STOP' || c.state === 'RISK');
  let alerted = false;
  if (opts.alert !== false && (worse.length || cleared.length) && (urgent || nowMs - state.lastAlertMs >= ALERT_MIN_GAP_MS)) {
    writeAlert(p, renderAlert(worse, cleared, nowMs));
    alerted = true;
  }
  const changed = [...worse, ...cleared];
  const deferred = changed.length > 0 && !alerted && opts.alert !== false;
  if (changed.length && !deferred) {
    const ledger = path.join(p.learned, 'process-board-ledger.ndjson');
    fs.appendFileSync(ledger, `${JSON.stringify({ at: new Date(nowMs).toISOString(), worse: worse.map((c) => [c.id, c.state]), cleared: cleared.map((c) => [c.id, c.state]) })}\n`, 'utf8');
  }
  const nextStates: Record<string, StageState> = {};
  for (const c of checks) nextStates[c.id] = c.state;
  // 알림을 미룬 변화는 다음 회차에 다시 잡히도록 이전 상태로 남긴다.
  if (deferred) {
    for (const c of changed) {
      if (state.states[c.id]) nextStates[c.id] = state.states[c.id];
      else delete nextStates[c.id];
    }
  }
  fs.writeFileSync(
    path.join(p.learned, 'process-board-state.json'),
    JSON.stringify({
      version: 1,
      states: nextStates,
      mirrorAckMs: state.mirrorAckMs,
      lastAlertMs: alerted ? nowMs : state.lastAlertMs,
      mirrorAckHashes: state.mirrorAckHashes,
      benchBaselineMs: state.benchBaselineMs,
    }, null, 2),
    'utf8',
  );
  return { checks, alerted, boardFile };
}

/** 김플레이가 트윈 규칙을 실기에 맞춰 바꿨음 — 이후 벤치를 새 비교 기준으로 쓴다. */
export function setBenchBaseline(p: ProcessPaths = defaultProcessPaths(), nowMs = Date.now()): void {
  const state = readBoardState(p.learned);
  fs.writeFileSync(path.join(p.learned, 'process-board-state.json'), JSON.stringify({ ...state, benchBaselineMs: nowMs }, null, 2), 'utf8');
}

/** 김플레이가 게임 변경을 트윈에 반영했다고 확인. */
export function ackMirror(p: ProcessPaths = defaultProcessPaths(), nowMs = Date.now()): void {
  const state = readBoardState(p.learned);
  const reg = readJson<{ twinMirrorPaths?: string[] }>(p.itemsFile) ?? {};
  const mirrorAckHashes: Record<string, string> = {};
  for (const f of reg.twinMirrorPaths ?? []) {
    const h = contentHash(path.join(p.root, f));
    if (h) mirrorAckHashes[f] = h;
  }
  fs.writeFileSync(
    path.join(p.learned, 'process-board-state.json'),
    JSON.stringify({ ...state, mirrorAckMs: nowMs, mirrorAckHashes }, null, 2),
    'utf8',
  );
}
