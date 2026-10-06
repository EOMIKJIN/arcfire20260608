/**
 * FQA 정기 주기. 플레이봇 문제가 늘면 김팀장 카드안을 김클로드가 확인한 뒤 적용한다.
 * 하니스·owner-auto 는 끄지 않는다. 게임 CSV·가격은 쓰지 않는다.
 * npx tsx tools/play-bot-console/review-fqa-cycle.ts --once
 * npx tsx tools/play-bot-console/review-fqa-cycle.ts --loop
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { attachFqaResponse, loadGameIssues } from './src/gameIssues';
import { atomicWriteFile } from './src/learnedIo';
import { toolRoot } from './src/io';
import { learnedDir } from './src/policy';
import { runProcessBoard, worstState } from './src/processBoard';
import {
  cardSignature,
  FQA_CARD_RAISE_HOLD,
  emptyFqaReviewState,
  planFqaReview,
  reviewNeeded,
  type FqaReviewState,
} from './src/fqaReview';
import {
  FQA_REVIEW_INTERVAL_MS,
  loadPlayIntelligence,
  savePlayIntelligence,
} from './src/playIntelligence';

const STOP_FLAG = path.join(toolRoot(), 'logs', 'PLAYBOT_EXPLICIT_STOP.flag');

function statePath(dir: string): string {
  return path.join(dir, 'fqa-review-state.json');
}

function reportPath(dir: string): string {
  return path.join(dir, 'fqa-review-latest.md');
}

function loadState(dir: string): FqaReviewState {
  try {
    const raw = JSON.parse(fs.readFileSync(statePath(dir), 'utf8')) as Partial<FqaReviewState>;
    return {
      version: 1,
      updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : '',
      lastSig: typeof raw.lastSig === 'string' ? raw.lastSig : '',
      seenEvidence: raw.seenEvidence && typeof raw.seenEvidence === 'object' ? raw.seenEvidence : {},
      reviews: Number.isFinite(raw.reviews) ? Number(raw.reviews) : 0,
      consultPending: raw.consultPending === true,
      cardSig: typeof raw.cardSig === 'string' ? raw.cardSig : '',
    };
  } catch {
    return emptyFqaReviewState();
  }
}

function claudeBin(): string | null {
  const candidates = [
    process.env.CLAUDE_BIN || '',
    'C:\\Users\\eomsp\\.local\\bin\\claude.exe',
    'claude',
  ];
  for (let i = 0; i < candidates.length; i += 1) {
    const bin = candidates[i];
    if (!bin) continue;
    if (bin === 'claude') return bin;
    if (fs.existsSync(bin)) return bin;
  }
  return null;
}

function askClaude(prompt: string): Promise<'agree' | 'hold' | 'unanswered'> {
  const bin = claudeBin();
  if (!bin) return Promise.resolve('unanswered');
  return new Promise((resolve) => {
    let out = '';
    let settled = false;
    const finish = (value: 'agree' | 'hold' | 'unanswered') => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const child = spawn(bin, [
      '-p', prompt,
      '--allowedTools', 'Read',
      '--output-format', 'text',
      '--max-turns', '2',
    ], {
      cwd: path.resolve(toolRoot(), '..', '..'),
      windowsHide: true,
    });
    const timer = setTimeout(() => {
      child.kill();
      finish('unanswered');
    }, 150000);
    child.stdout.on('data', (buf: Buffer) => {
      out += buf.toString('utf8');
    });
    child.on('error', () => {
      clearTimeout(timer);
      finish('unanswered');
    });
    child.on('close', () => {
      clearTimeout(timer);
      const line = out.split(/\r?\n/).map((row) => row.trim()).find((row) => row.length > 0) || '';
      if (line.startsWith('AGREE')) finish('agree');
      else if (line.startsWith('HOLD')) finish('hold');
      else finish('unanswered');
    });
  });
}

function writeReport(dir: string, body: string): void {
  fs.mkdirSync(dir, { recursive: true });
  atomicWriteFile(reportPath(dir), body);
}

export async function runFqaReviewOnce(dir: string, nowMs: number, consult: boolean): Promise<string> {
  if (fs.existsSync(STOP_FLAG)) return 'stop';
  const issues = loadGameIssues(dir);
  const state = loadState(dir);
  const card = loadPlayIntelligence(dir);
  if (!reviewNeeded(state, issues, card)) return 'idle';
  const plan = planFqaReview(issues, card, state.seenEvidence);
  let verdict: 'agree' | 'hold' | 'unanswered' = 'agree';
  if (consult && plan.responses.length > 0) {
    const lines = plan.responses.map((row) => `- ${row.id}: ${row.text}`);
    verdict = await askClaude([
      '너는 김클로드다. 파일을 수정하지 마라. src app tables 를 쓰지 마라.',
      '아래는 김팀장 플레이 카드안이다. 게임 가격·전투 계수를 바꾸지 않는 안이면 첫 줄에 AGREE, 아니면 첫 줄에 HOLD.',
      '둘째 줄에 한국어 한 문장만.',
      ...lines,
    ].join('\n'));
  }
  const prefix = verdict === 'agree' ? '협의 AGREE. ' : (verdict === 'hold' ? '협의 HOLD. 플레이 카드는 유지. ' : '');
  if (verdict === 'agree') {
    if (plan.cardChanged) savePlayIntelligence(dir, plan.card, nowMs);
    for (let i = 0; i < plan.responses.length; i += 1) {
      attachFqaResponse(dir, plan.responses[i].id, prefix + plan.responses[i].text, nowMs);
    }
  } else if (verdict === 'hold') {
    for (let i = 0; i < plan.responses.length; i += 1) {
      attachFqaResponse(dir, plan.responses[i].id, `${prefix}${plan.responses[i].id} 보류.`, nowMs);
    }
  }
  const next: FqaReviewState = {
    version: 1,
    updatedAt: new Date(nowMs).toISOString(),
    lastSig: verdict === 'unanswered' ? state.lastSig : plan.signature,
    seenEvidence: verdict === 'unanswered' ? state.seenEvidence : plan.seenEvidence,
    reviews: state.reviews + (verdict === 'unanswered' ? 0 : 1),
    consultPending: verdict === 'unanswered',
    cardSig: verdict === 'unanswered'
      ? state.cardSig
      : cardSignature(verdict === 'agree' && plan.cardChanged ? plan.card : card),
  };
  fs.mkdirSync(dir, { recursive: true });
  atomicWriteFile(statePath(dir), JSON.stringify(next, null, 2));
  const outside = plan.outside.length > 0 ? plan.outside.join(' ') : '없음';
  writeReport(dir, [
    '# FQA 정기 검토',
    '',
    `- 시각: ${next.updatedAt}`,
    `- 협의: ${verdict}`,
    `- 카드 변경: ${verdict === 'agree' && plan.cardChanged ? 'yes' : 'no'}`,
    `- 채굴 상한: ${plan.card.mineCap}`,
    `- 수련선: ${plan.card.fairFightMin}`,
    `- 카탈로그 밖: ${outside}`,
    '',
  ].join('\n'));
  return verdict;
}

async function main(): Promise<void> {
  const loop = process.argv.includes('--loop');
  const dir = learnedDir();
  do {
    const verdict = await runFqaReviewOnce(dir, Date.now(), true);
    console.log(`fqa-review ${verdict}`);
    try {
      const board = runProcessBoard({ cardRaiseHold: FQA_CARD_RAISE_HOLD, bench: true });
      console.log(`process-board ${worstState(board.checks)}${board.alerted ? ' alerted' : ''}`);
    } catch (err) {
      console.error('process-board failed', err);
    }
    if (!loop) break;
    await new Promise((resolve) => setTimeout(resolve, FQA_REVIEW_INTERVAL_MS));
  } while (!fs.existsSync(STOP_FLAG));
}

if (process.argv.some((arg) => arg === '--once' || arg === '--loop')) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}
