'use strict';
/**
 * sessionStart — [김경제 메모리 테스트] 모니터 자동 가동 (멱등)
 *   Cursor 세션이 켜지는 시점에, 별도 호출 없이 장기 메모리 모니터를 자동 재가동한다.
 *   - watch-30m.pid 의 프로세스가 살아있으면 아무것도 하지 않음(중복 가동 방지).
 *   - 죽었거나 없으면 start-watch-30m.ps1 을 detached 로 띄움(Cursor 종료와 무관하게 생존).
 *   - 어떤 경우에도 세션 시작을 막지 않는다(fail-open). 게임/빌드 코드와 무관한 데브옵스 훅.
 * 정본: tools/long-run-monitor/logs/WATCH_README.md · arcfire-economy-specialist-agent.mdc
 */
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

// 프로젝트 훅은 프로젝트 루트에서 실행된다.
const ROOT = process.cwd();
const MONITOR_DIR = path.join(ROOT, 'tools', 'long-run-monitor');
const PID_FILE = path.join(MONITOR_DIR, 'logs', 'watch-30m.pid');
const START_SCRIPT = path.join(MONITOR_DIR, 'start-watch-30m.ps1');

function readPid() {
  try {
    const raw = fs.readFileSync(PID_FILE, 'utf8').trim();
    const pid = parseInt(raw, 10);
    return Number.isFinite(pid) && pid > 0 ? pid : null;
  } catch {
    return null;
  }
}

/** Windows tasklist 로 해당 PID 가 살아있는지 확인(없으면 false). */
function isPidAlive(pid) {
  if (!pid) return false;
  try {
    const out = execSync(`tasklist /FI "PID eq ${pid}" /NH`, {
      encoding: 'utf8',
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return new RegExp(`\\b${pid}\\b`).test(out);
  } catch {
    return false;
  }
}

function startMonitorDetached() {
  const child = spawn(
    'powershell',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', START_SCRIPT],
    { detached: true, stdio: 'ignore', windowsHide: true, cwd: MONITOR_DIR },
  );
  child.unref();
}

function main() {
  // stdin 소비(훅 계약)
  try {
    fs.readFileSync(0, 'utf8');
  } catch {
    /* ignore */
  }

  let note = '';
  try {
    if (!fs.existsSync(START_SCRIPT)) {
      note = '';
    } else {
      const pid = readPid();
      if (isPidAlive(pid)) {
        note = `[메모리 모니터] 이미 가동 중 (PID ${pid}) — 자동 가동 생략.`;
      } else {
        startMonitorDetached();
        note = '[메모리 모니터] 세션 시작 시 자동 재가동함 (start-watch-30m.ps1, Cursor와 독립 생존).';
      }
    }
  } catch (e) {
    // fail-open: 세션 시작을 절대 막지 않는다.
    note = '';
  }

  process.stdout.write(JSON.stringify(note ? { additional_context: note } : {}));
}

main();
