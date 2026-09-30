import fs from 'node:fs';
import path from 'node:path';
import type { AnalyzeReport, JournalEntry, KpiSnapshot, WorldState } from './types';
import { formatAnalyzeMarkdown } from './analyze';
import { formatHud } from './mud';
import { snapshotKpi } from './world';

export type RunPaths = {
  root: string;
  runDir: string;
  journal: string;
  mud: string;
  timeline: string;
  kpi: string;
  analyze: string;
  status: string;
  dashboard: string;
  mudLatest: string;
};

export function toolRoot(): string {
  return path.resolve(__dirname, '..');
}

let ioLogsOverride: string | null = null;

export function setPlaybotIoLogsForTest(dir: string | null): void {
  ioLogsOverride = dir;
}

function logsDir(): string {
  return ioLogsOverride ?? path.join(toolRoot(), 'logs');
}

const recordingFlag = () => path.join(logsDir(), 'PLAYBOT_RECORDING.flag');

const JOURNAL_FLUSH = 16;
let bufJournal = '';
let bufMud = '';
let bufCount = 0;
let bufPaths: RunPaths | null = null;

export function flushJournalWrites(): void {
  if (!bufPaths || bufCount === 0) return;
  try {
    fs.appendFileSync(bufPaths.journal, bufJournal, 'utf8');
    fs.appendFileSync(bufPaths.mud, bufMud, 'utf8');
  } catch {
    /* ignore */
  }
  bufJournal = '';
  bufMud = '';
  bufCount = 0;
}

let recording = true;

export function isRecording(): boolean {
  return recording;
}

export function beginRecording(): void {
  recording = true;
  const logs = logsDir();
  fs.mkdirSync(logs, { recursive: true });
  fs.writeFileSync(recordingFlag(), `on\nstartedAt=${new Date().toISOString()}\n`, 'utf8');
}

export function endRecording(reason = 'stop'): void {
  flushJournalWrites();
  if (!recording) return;
  recording = false;
  try {
    fs.unlinkSync(recordingFlag());
  } catch {
    /* already off */
  }
  const stamp = path.join(logsDir(), 'PLAYBOT_RECORDING_STOPPED.txt');
  try {
    fs.writeFileSync(stamp, `stoppedAt=${new Date().toISOString()}\nreason=${reason}\n`, 'utf8');
  } catch {
    /* ignore */
  }
}

export function ensureRunPaths(runId: string): RunPaths {
  const root = toolRoot();
  const logs = path.join(root, 'logs');
  const runDir = path.join(root, 'runs', runId);
  fs.mkdirSync(logs, { recursive: true });
  fs.mkdirSync(runDir, { recursive: true });
  return {
    root,
    runDir,
    journal: path.join(runDir, 'journal.ndjson'),
    mud: path.join(runDir, 'mud.log'),
    timeline: path.join(runDir, 'timeline.csv'),
    kpi: path.join(runDir, 'kpi.json'),
    analyze: path.join(runDir, 'ANALYZE_LATEST.md'),
    status: path.join(logs, 'PLAYBOT_STATUS_LATEST.json'),
    dashboard: path.join(logs, 'PLAYBOT_DASHBOARD_LATEST.html'),
    mudLatest: path.join(logs, 'PLAYBOT_MUD_LATEST.txt'),
  };
}

export function appendJournal(paths: RunPaths, entry: JournalEntry, mudLine: string): void {
  if (!recording) return;
  if (bufPaths && bufPaths.journal !== paths.journal) flushJournalWrites();
  bufPaths = paths;
  bufJournal += `${JSON.stringify(entry)}\n`;
  bufMud += `${mudLine}\n`;
  bufCount += 1;
  if (bufCount >= JOURNAL_FLUSH) flushJournalWrites();
}

export function appendTimeline(paths: RunPaths, world: WorldState, action: string): void {
  if (!recording) return;
  const exists = fs.existsSync(paths.timeline);
  if (!exists) {
    safeWriteFile(
      paths.timeline,
      'day,tick,planet,level,exp,credits,vault,blue,red,neutral,action,hold\n',
    );
  }
  const k = snapshotKpi(world);
  safeAppendFile(
    paths.timeline,
    `${k.day},${world.tick},${world.currentPlanetId},${k.level},${k.totalExp},${k.credits},${k.blueVault},${k.blue},${k.red},${k.neutral},${action},${world.lastHoldReason}\n`,
  );
}

/** Cursor/미리보기·AV가 파일을 잠가도 하니스가 죽지 않게 스냅샷만 포기한다. */
export function safeWriteFile(dest: string, body: string): void {
  try {
    fs.writeFileSync(dest, body, 'utf8');
    return;
  } catch {
    /* in-place 잠금 — tmp 후 교체 시도 */
  }
  const tmp = `${dest}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(tmp, body, 'utf8');
    try {
      fs.copyFileSync(tmp, dest);
    } catch {
      /* 관측 파일 1프레임 스킵 */
    }
  } catch {
    /* ignore */
  }
  try {
    fs.unlinkSync(tmp);
  } catch {
    /* leftover tmp ok */
  }
}

export function safeAppendFile(dest: string, body: string): void {
  try {
    fs.appendFileSync(dest, body, 'utf8');
  } catch {
    /* 관측 파일 1줄 스킵 */
  }
}

export function writeStatus(
  paths: RunPaths,
  world: WorldState,
  mudTail: readonly string[],
  reports: readonly AnalyzeReport[],
): void {
  if (!recording) return;
  flushJournalWrites();
  const payload = {
    recording,
    updatedAt: new Date().toISOString(),
    runId: world.runId,
    persona: world.persona,
    kpi: snapshotKpi(world),
    planet: world.currentPlanetId,
    quest: world.activeQuest,
    lastHold: world.lastHoldReason,
    lastAnalyze: reports[reports.length - 1] ?? null,
    mudTail,
  };
  safeWriteFile(paths.status, JSON.stringify(payload, null, 2));
  safeWriteFile(paths.mudLatest, `${formatHud(world)}\n\n${mudTail.join('\n')}\n`);
  safeWriteFile(paths.kpi, JSON.stringify(snapshotKpi(world), null, 2));
  const tail = reports.length > 14 ? reports.slice(-14) : reports;
  safeWriteFile(paths.analyze, formatAnalyzeMarkdown(tail, world));
  safeWriteFile(paths.dashboard, renderDashboard(world, mudTail, reports));
}

export function writeFinalKpi(paths: RunPaths, kpi: KpiSnapshot): void {
  flushJournalWrites();
  if (!recording) return;
  safeWriteFile(paths.kpi, JSON.stringify(kpi, null, 2));
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderDashboard(
  world: WorldState,
  mudTail: readonly string[],
  reports: readonly AnalyzeReport[],
): string {
  const k = snapshotKpi(world);
  const last = reports[reports.length - 1];
  const findings = (last?.findings ?? []).map((f) => `<li>[${f.severity}] ${esc(f.code)} ${esc(f.detail)}</li>`).join('');
  const mud = mudTail.map((l) => esc(l)).join('\n');
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"/><title>플레이봇콘솔</title>
<style>
body{font-family:Consolas,monospace;background:#0b1020;color:#d7e0f2;margin:16px}
h1{color:#7ec8ff;font-size:18px}
.kpi{color:#9dffb0}
pre{background:#11182b;padding:12px;border:1px solid #2a3558;white-space:pre-wrap}
</style></head><body>
<h1>Arcfire 플레이봇콘솔 · ${esc(world.persona)} · ${esc(world.runId)}</h1>
<p class="kpi">D${k.day} L${k.level} ${esc(world.currentPlanetId)} B${k.blue}/R${k.red}/N${k.neutral} cr=${k.credits} vault=${k.blueVault} W${k.combatWins}/L${k.combatLosses} 퀘${k.questCleared} 편입${k.annexOk} 스킬${k.skills} 장비${k.gearScore} 개발${k.devSum} 수도${k.capitalDestroyed}</p>
<ul>${findings || '<li>ANALYZE 대기</li>'}</ul>
<pre>${mud}</pre>
<p>갱신 ${esc(new Date().toISOString())} · 앱 APK 미포함 · 세이브 미기록</p>
</body></html>`;
}
