/**
 * 플레이봇 1일 학습 데일리 리포트 기록.
 * npx tsx tools/play-bot-console/write-daily-learning-report.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { buildDailyLearningReport, type DailySnapshot, type PlaybotStatusLite } from './src/dailyLearningReport';
import { buildDailyTriage } from './src/dailyUrgentTriage';
import { loadLearning } from './src/learn';
import { loadPolicy } from './src/policy';
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

  const status = readJson<PlaybotStatusLite>(path.join(logs, 'PLAYBOT_STATUS_LATEST.json'));
  const prev = readJson<DailySnapshot>(path.join(learned, 'playbot-daily-snapshot.json'));
  const learning = loadLearning();
  const policy = loadPolicy();
  const botAlive = procAlive(readPid(logs, 'playbot-console.pid'))
    || procAlive(readPid(logs, 'playbot-harness.pid'))
    || fs.existsSync(path.join(logs, 'PLAYBOT_RECORDING.flag'));

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
  });

  const triage = buildDailyTriage({
    verdict: built.verdict,
    botAlive,
    recording: status?.recording === true,
    findings: status?.lastAnalyze?.findings ?? [],
    questCleared: built.snapshot.kpi.questCleared,
    level: built.snapshot.kpi.level,
    credits: built.snapshot.kpi.credits,
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
