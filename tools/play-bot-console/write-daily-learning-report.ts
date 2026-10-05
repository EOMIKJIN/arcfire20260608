/**
 * 플레이봇 1일 학습 데일리 리포트 기록.
 * npx tsx tools/play-bot-console/write-daily-learning-report.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  buildDailyLearningReport,
  type DailyLearningHealth,
  type DailySnapshot,
  type PlaybotStatusLite,
} from './src/dailyLearningReport';
import { buildDailyTriage } from './src/dailyUrgentTriage';
import { formatHumanSeedLine, loadHumanSeed } from './src/humanSeed';
import { loadLearning } from './src/learn';
import { learnedDir, loadPolicy } from './src/policy';
import { refreshHumanSeedForDaily } from './src/refreshHumanSeed';
import { toolRoot } from './src/io';

function kstNow(): Date {
  const now = new Date();
  return new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 9 * 60 * 60000);
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function kstDateKey(d = kstNow()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function readJson<T>(file: string): T | null {
  try {
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
  } catch {
    return null;
  }
}

function procAlive(pid: number): boolean {
  if (!Number.isFinite(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readPid(logs: string, name: string): number {
  try {
    return Number.parseInt(fs.readFileSync(path.join(logs, name), 'utf8').trim(), 10) || 0;
  } catch {
    return 0;
  }
}

type StallRow = { at?: string; level?: number; questCleared?: number; annexOk?: number; colonizeOk?: number; independent?: number };

/** 정체 재시작·FQA 협의·실기 델타 — 18:00 판정에 학습 건강을 넣는다 */
export function readLearningHealth(learned: string, nowMs = Date.now()): DailyLearningHealth {
  const stall = readJson<{ restarts?: number; history?: StallRow[] }>(path.join(learned, 'stall-replay.json'));
  const fqa = readJson<{ consultPending?: boolean; reviews?: number }>(path.join(learned, 'fqa-review-state.json'));
  const delta = readJson<{ coveredKinds?: string[] }>(path.join(learned, 'human-delta.json'));
  const history = stall?.history ?? [];
  let in24h = 0;
  let ceilingLevel = 0;
  let ceilingQuest = 0;
  let endgameZero = true;
  for (let i = 0; i < history.length; i += 1) {
    const h = history[i];
    const t = Date.parse(h.at ?? '');
    if (Number.isFinite(t) && nowMs - t <= 24 * 3_600_000) in24h += 1;
    ceilingLevel = Math.max(ceilingLevel, h.level ?? 0);
    ceilingQuest = Math.max(ceilingQuest, h.questCleared ?? 0);
    if ((h.annexOk ?? 0) > 0 || (h.colonizeOk ?? 0) > 0 || (h.independent ?? 0) > 0) endgameZero = false;
  }
  return {
    stallRestartsTotal: stall?.restarts ?? 0,
    stallRestarts24h: in24h,
    ceilingLevel,
    ceilingQuest,
    endgameZero,
    fqaConsultPending: fqa?.consultPending === true,
    fqaReviews: fqa?.reviews ?? 0,
    humanDeltaKinds: delta?.coveredKinds ?? [],
  };
}

function appendLedger(file: string, row: string): void {
  const header = 'date,verdict,runId,level,quest,skills,gear,dev,hold,recording\n';
  if (!fs.existsSync(file)) fs.writeFileSync(file, header, 'utf8');
  fs.appendFileSync(file, `${row}\n`, 'utf8');
}

export function writeDailyLearningReportFiles(root = toolRoot()): {
  latest: string;
  dated: string;
  verdict: string;
} {
  const logs = path.join(root, 'logs');
  const learned = path.join(logs, 'learned');
  fs.mkdirSync(logs, { recursive: true });
  fs.mkdirSync(learned, { recursive: true });

  try {
    refreshHumanSeedForDaily();
  } catch {
    /* adb 없어도 리포트는 기록 */
  }

  const status = readJson<PlaybotStatusLite>(path.join(logs, 'PLAYBOT_STATUS_LATEST.json'));
  const prev = readJson<DailySnapshot>(path.join(learned, 'playbot-daily-snapshot.json'));
  const learning = loadLearning();
  const policy = loadPolicy();
  const humanSeedLine = formatHumanSeedLine(loadHumanSeed(learnedDir()));
  const botAlive = procAlive(readPid(logs, 'playbot-console.pid'))
    || procAlive(readPid(logs, 'playbot-harness.pid'));

  const now = kstNow();
  const dateKey = kstDateKey(now);
  const built = buildDailyLearningReport({
    status,
    learning,
    policy,
    prev,
    botAlive,
    nowIso: new Date().toISOString(),
    dateKey,
    humanSeedLine,
    learningHealth: readLearningHealth(learned),
  });

  const findings = status?.lastAnalyze?.findings ?? [];
  const triage = buildDailyTriage({
    verdict: built.verdict,
    botAlive,
    recording: status?.recording === true,
    findings,
    questCleared: built.snapshot.kpi.questCleared,
    level: built.snapshot.kpi.level,
    credits: built.snapshot.kpi.credits,
    policyStuck: policy.health?.stuck === true,
    equalWeights: policy.health?.equalWeights === true,
    sameNotes: (policy.lastNotes ?? []).join(' / '),
    saturated: findings.some((f) => f.code === 'LEARN_SATURATED' || f.code === 'LEARN_HORIZON')
      || built.snapshot.kpi.level >= 60,
    twinBorder: findings.some((f) => f.code.startsWith('BORDER_')),
    persistRecovered: learning.persistHealth?.recoveredFromBak === true,
  });
  const withTriage = `${built.markdown}\n---\n\n${triage.markdown}`;
  const dateTag = dateKey.replace(/-/g, '');
  const dated = path.join(logs, `playbot-learning-daily-${dateTag}-1800.md`);
  const latest = path.join(logs, 'DAILY_18_PLAYBOT_LEARNING_LATEST.md');
  const pending = path.join(logs, 'PLAYBOT_CHAT_REPORT_PENDING.md');
  const triagePath = path.join(logs, 'PLAYBOT_DAILY_TRIAGE_LATEST.md');
  fs.writeFileSync(dated, withTriage, 'utf8');
  fs.writeFileSync(latest, withTriage, 'utf8');
  fs.writeFileSync(triagePath, triage.markdown, 'utf8');
  const chat = triage.escalate
    ? `${built.chatBrief}\n## 보고이슈 (승인·조치 필요)\n${triage.reasons.map((r) => `- ${r}`).join('\n')}\n`
    : built.chatBrief;
  fs.writeFileSync(pending, chat, 'utf8');
  fs.writeFileSync(path.join(learned, 'playbot-daily-snapshot.json'), JSON.stringify(built.snapshot, null, 2), 'utf8');
  appendLedger(
    path.join(logs, 'playbot-learning-daily-ledger.csv'),
    [
      dateKey,
      built.verdict,
      built.snapshot.runId,
      built.snapshot.kpi.level,
      built.snapshot.kpi.questCleared,
      built.snapshot.kpi.skills,
      built.snapshot.kpi.gearScore,
      built.snapshot.kpi.devSum,
      built.snapshot.kpi.holdCount,
      status?.recording ? '1' : '0',
    ].join(','),
  );
  return { latest, dated, verdict: built.verdict };
}

if (process.argv[1] && path.normalize(process.argv[1]).includes('write-daily-learning-report')) {
  const out = writeDailyLearningReportFiles();
  console.log(`playbot_daily_18=${out.verdict} ${out.latest}`);
}
