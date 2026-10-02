/**
 * 대표님 실기 자동 수집 데몬.
 * 기기(adb)가 있으면 logcat을 받고, 유휴·날짜·앱 재시작·3시간에 세션을 닫아 시드에 넣는다.
 * 대표님 start/stop 불필요. 앱 코드 변경 없음.
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {
  ADB_DATE_ARGS,
  AUTO_POLL_MS,
  classifyAutoSession,
  countUserActionMarkers,
  parseDeviceSince,
  shouldImportAutoSession,
  shouldRotateAutoSession,
} from './src/ownerPlaylogAuto';
import { toolRoot } from './src/io';

const PKG = 'com.arcfire.online';
const root = toolRoot();
const logs = path.join(root, 'logs');
const rawRoot = path.join(logs, 'learned', 'human-raw');
const pidFile = path.join(logs, 'playbot-owner-auto.pid');
const disableFlag = path.join(logs, 'owner-playlog-auto-DISABLED.flag');
const daemonLog = path.join(logs, 'owner-playlog-auto.log');

type Active = {
  dir: string;
  sid: string;
  startedAt: number;
  dayKey: string;
  appPid: string;
  /** session.log 증분 읽기 위치 */
  readOffset: number;
  /** 화면 켜짐 상태에서 관측한 사용자 조작 마커 수 */
  userActions: number;
  /** 마지막 사용자 조작을 관측한 PC 시각(유휴 판정 기준) */
  lastActionAt: number;
};

function log(msg: string): void {
  const line = `[${new Date().toISOString()}] ${msg}`;
  try {
    fs.appendFileSync(daemonLog, `${line}\n`, 'utf8');
  } catch {
    /* ignore */
  }
  console.log(line);
}

function kstDateKey(d = new Date()): string {
  const t = new Date(d.getTime() + d.getTimezoneOffset() * 60000 + 9 * 60 * 60000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${t.getFullYear()}${p(t.getMonth() + 1)}${p(t.getDate())}`;
}

function hasDevice(): boolean {
  const r = spawnSync('adb', ['devices'], { encoding: 'utf8', timeout: 8000, windowsHide: true });
  if (r.status !== 0 || !r.stdout) return false;
  return /\tdevice\s*$/m.test(r.stdout);
}

function readAppPid(): string {
  const r = spawnSync('adb', ['shell', 'pidof', PKG], {
    encoding: 'utf8',
    timeout: 8000,
    windowsHide: true,
  });
  return (r.stdout ?? '').trim().split(/\s+/)[0] ?? '';
}

function deviceSince(): string {
  const r = spawnSync('adb', [...ADB_DATE_ARGS], {
    encoding: 'utf8',
    timeout: 8000,
    windowsHide: true,
  });
  return parseDeviceSince(r.stdout);
}

/** 화면 켜짐(Awake)일 때만 조작을 사람 플레이로 센다. */
function screenAwake(): boolean {
  const r = spawnSync('adb', ['shell', 'dumpsys', 'power'], {
    encoding: 'utf8',
    timeout: 8000,
    windowsHide: true,
    maxBuffer: 4 * 1024 * 1024,
  });
  return /mWakefulness=Awake/.test(r.stdout ?? '');
}

/** session.log 새로 붙은 부분만 읽어 사용자 조작 마커를 센다. */
function absorbNewLog(active: Active, awake: boolean): void {
  const logFile = path.join(active.dir, 'session.log');
  let size = 0;
  try {
    size = fs.statSync(logFile).size;
  } catch {
    return;
  }
  if (size <= active.readOffset) return;
  const fd = fs.openSync(logFile, 'r');
  try {
    const len = size - active.readOffset;
    const buf = Buffer.alloc(len);
    fs.readSync(fd, buf, 0, len, active.readOffset);
    active.readOffset = size;
    if (!awake) return;
    const n = countUserActionMarkers(buf.toString('utf8'));
    if (n > 0) {
      active.userActions += n;
      active.lastActionAt = Date.now();
    }
  } finally {
    fs.closeSync(fd);
  }
}

/**
 * cmd.exe /c 경유 금지 — Node가 인자 속 큰따옴표를 \" 로 넘겨 cmd 리다이렉트 경로가 깨진다(실측: before/after 0건).
 * adb 표준출력을 바이너리로 받아 직접 쓴다.
 */
function copyRkStorage(dest: string): void {
  try {
    const r = spawnSync('adb', ['exec-out', 'run-as', PKG, 'cat', 'databases/RKStorage'], {
      timeout: 15000,
      windowsHide: true,
      maxBuffer: 64 * 1024 * 1024,
    });
    const out = r.stdout as Buffer | null;
    if (r.status === 0 && out && out.length >= 16 && out.subarray(0, 15).toString('latin1') === 'SQLite format 3') {
      fs.writeFileSync(dest, out);
    } else {
      log(`rkstorage_skip status=${r.status} bytes=${out?.length ?? 0}`);
    }
  } catch {
    /* 권한·미실행이면 생략 */
  }
}

function killTree(pid: number): void {
  if (!Number.isFinite(pid) || pid <= 0) return;
  spawnSync('taskkill.exe', ['/T', '/F', '/PID', String(pid)], { windowsHide: true });
}

function findOpen(): Active | null {
  if (!fs.existsSync(rawRoot)) return null;
  const ents = fs.readdirSync(rawRoot, { withFileTypes: true });
  for (let i = ents.length - 1; i >= 0; i -= 1) {
    const e = ents[i];
    if (!e.isDirectory()) continue;
    const dir = path.join(rawRoot, e.name);
    const cap = path.join(dir, 'capture.pid');
    if (!fs.existsSync(cap)) continue;
    const pid = Number.parseInt(fs.readFileSync(cap, 'utf8').trim(), 10) || 0;
    try {
      if (pid > 0) process.kill(pid, 0);
    } catch {
      try { fs.unlinkSync(cap); } catch { /* ignore */ }
      continue;
    }
    let startedAt = Date.now();
    let appPid = '';
    try {
      const m = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8')) as {
        startedAt?: string;
        appPid?: string;
      };
      const t = Date.parse(m.startedAt ?? '');
      if (Number.isFinite(t)) startedAt = t;
      appPid = String(m.appPid ?? '');
    } catch {
      /* ignore */
    }
    return {
      dir, sid: e.name, startedAt, dayKey: kstDateKey(new Date(startedAt)), appPid,
      readOffset: 0, userActions: 0, lastActionAt: startedAt,
    };
  }
  return null;
}

function startSession(): Active | null {
  // D1 — 시작 시각을 못 읽으면 시작 보류(과거 버퍼 전체 유입 금지)
  const since = deviceSince();
  if (!since) {
    log('start_hold device_since_empty');
    return null;
  }
  fs.mkdirSync(rawRoot, { recursive: true });
  const sid = `owner-auto-${new Date().toISOString().replace(/[:.]/g, '').slice(0, 15)}`;
  const dir = path.join(rawRoot, sid);
  fs.mkdirSync(dir, { recursive: true });
  const before = path.join(dir, 'before.sqlite');
  copyRkStorage(before);
  const logFile = path.join(dir, 'session.log');
  fs.writeFileSync(logFile, '', 'utf8');
  const out = fs.openSync(logFile, 'a');
  const args = ['logcat', '-v', 'threadtime', '-T', since, 'ReactNativeJS:V', '*:S'];
  const child = spawn('adb', args, {
    stdio: ['ignore', out, 'ignore'],
    windowsHide: true,
    detached: true,
  });
  fs.closeSync(out);
  if (!child.pid) {
    log('start_fail no logcat pid');
    return null;
  }
  child.unref();
  fs.writeFileSync(path.join(dir, 'capture.pid'), `${child.pid}\n`, 'ascii');
  const appPid = readAppPid();
  const startedAt = Date.now();
  const manifest = {
    schema: 'owner-playlog-v1',
    sessionId: sid,
    player: 'owner',
    // 종료 시 사용자 조작 증거로 human/profiler 확정(D2). 진행 중엔 pending.
    sessionKind: 'pending',
    captureMode: 'auto',
    startedAt: new Date(startedAt).toISOString(),
    deviceSince: since,
    appPid,
  };
  fs.writeFileSync(path.join(dir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  log(`start ${sid} logcat=${child.pid} app=${appPid || '-'} since=${since}`);
  return {
    dir, sid, startedAt, dayKey: kstDateKey(), appPid,
    readOffset: 0, userActions: 0, lastActionAt: startedAt,
  };
}

function closeSession(active: Active, reason: string): void {
  const cap = path.join(active.dir, 'capture.pid');
  const pid = fs.existsSync(cap) ? Number.parseInt(fs.readFileSync(cap, 'utf8').trim(), 10) || 0 : 0;
  killTree(pid);
  try { fs.unlinkSync(cap); } catch { /* ignore */ }
  absorbNewLog(active, reason !== 'device_gone' && screenAwake());
  const kind = classifyAutoSession(active.userActions);
  copyRkStorage(path.join(active.dir, 'after.sqlite'));
  const logFile = path.join(active.dir, 'session.log');
  let lines = 0;
  let markers = 0;
  try {
    const text = fs.readFileSync(logFile, 'utf8');
    const arr = text.split(/\r?\n/);
    lines = arr.length;
    for (let i = 0; i < arr.length; i += 1) {
      if (arr[i].includes('[MEM_PROFILE]')) markers += 1;
    }
  } catch {
    /* ignore */
  }
  let deviceSince = '';
  try {
    const mf = path.join(active.dir, 'manifest.json');
    const m = JSON.parse(fs.readFileSync(mf, 'utf8')) as Record<string, unknown>;
    deviceSince = String(m.deviceSince ?? '');
    m.endedAt = new Date().toISOString();
    m.endReason = reason;
    m.sessionKind = kind;
    m.userActions = active.userActions;
    m.minutes = Math.round((Date.now() - active.startedAt) / 6000) / 10;
    m.logLines = lines;
    m.memProfileMarkers = markers;
    fs.writeFileSync(mf, `${JSON.stringify(m, null, 2)}\n`, 'utf8');
  } catch {
    /* ignore */
  }
  log(`close ${active.sid} reason=${reason} markers=${markers} lines=${lines} userActions=${active.userActions} kind=${kind}`);
  // D2 — 조작 증거 없는 세션·D1 과거버퍼(since 공란)는 시드에 넣지 않는다. 원본은 보관.
  if (!shouldImportAutoSession({
    userActions: active.userActions,
    memProfileMarkers: markers,
    deviceSince,
  })) return;
  const importer = path.join(root, 'import-mem-profile-trace.ts');
  const repo = path.join(root, '..', '..');
  // cmd.exe/npx 경유 시 따옴표가 \" 로 깨져 ERR_MODULE_NOT_FOUND(실측 21:05). node로 tsx CLI 직접 실행.
  const tsxCli = path.join(repo, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  const r = spawnSync(
    process.execPath,
    [tsxCli, importer, '--in', logFile, '--kind', 'human', '--run-id', active.sid],
    { cwd: repo, encoding: 'utf8', timeout: 60_000, windowsHide: true },
  );
  log(`import ${active.sid} status=${r.status} ${(r.stdout ?? '').trim()} ${(r.stderr ?? '').trim()}`.slice(0, 400));
}

function tick(active: Active | null): Active | null {
  if (fs.existsSync(disableFlag)) {
    if (active) closeSession(active, 'disabled');
    return null;
  }
  const device = hasDevice();
  if (!active) {
    if (!device) return null;
    return startSession();
  }
  const curPid = readAppPid();
  if (device) absorbNewLog(active, screenAwake());
  const decision = shouldRotateAutoSession({
    // D3 — 로그 mtime이 아니라 마지막 사용자 조작 기준([MEM] 주기 로그가 mtime을 계속 갱신)
    idleMs: Date.now() - active.lastActionAt,
    spanMs: Date.now() - active.startedAt,
    deviceGone: !device,
    appPidChanged: Boolean(active.appPid) && Boolean(curPid) && curPid !== active.appPid,
    dayChanged: kstDateKey() !== active.dayKey,
  });
  if (!decision.rotate) return active;
  closeSession(active, decision.reason);
  if (!device || decision.reason === 'device_gone') return null;
  return startSession();
}

function main(): void {
  fs.mkdirSync(logs, { recursive: true });
  fs.mkdirSync(rawRoot, { recursive: true });
  fs.writeFileSync(pidFile, `${process.pid}\n`, 'ascii');
  log(`daemon pid=${process.pid}`);
  let active = findOpen();
  if (active) log(`adopt ${active.sid}`);
  const stop = (): void => {
    if (active) closeSession(active, 'signal');
    process.exit(0);
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  const loop = (): void => {
    try {
      active = tick(active);
    } catch (err) {
      log(`tick_err ${err instanceof Error ? err.message : String(err)}`);
    }
    setTimeout(loop, AUTO_POLL_MS);
  };
  loop();
}

main();
