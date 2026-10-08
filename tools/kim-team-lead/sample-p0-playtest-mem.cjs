/**
 * 김플레이 부재 시 P0 재현 구간 meminfo 30초 샘플.
 * 앱을 재시작하지 않는다. 기록만 한다.
 */
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const serial = 'adb-RFCW31QCRAZ-UUU7DH._adb-tls-connect._tcp';
const pkg = 'com.arcfire.online';
const out = path.join(__dirname, 'reports', 'p0-playtest-mem-20261008.csv');
const samples = 80;
const intervalMs = 30000;

function adb(args) {
  return execFileSync('adb', ['-s', serial, ...args], {
    encoding: 'utf8',
    timeout: 25000,
    windowsHide: true,
  });
}

function num(raw, re) {
  const m = raw.match(re);
  return m ? Number(m[1]) : 0;
}

function hintFromLog() {
  let text = '';
  try {
    text = adb(['logcat', '-d', '-t', '120', '-s', 'ReactNativeJS:I']);
  } catch {
    return '';
  }
  const lines = text.split(/\r?\n/);
  let hint = '';
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const line = lines[i];
    if (!line) continue;
    if (
      line.includes('galaxy_map')
      || line.includes('planet_main_stage')
      || line.includes('combat-hitch')
      || line.includes('[PLAY_VERB]')
    ) {
      hint = line.replace(/,/g, ' ').slice(-180);
      break;
    }
  }
  return hint;
}

function sample() {
  const iso = new Date().toISOString();
  let pid = '';
  try {
    pid = adb(['shell', 'pidof', pkg]).trim();
  } catch {
    pid = '';
  }
  if (!pid) {
    const line = `${iso},NO_PROCESS,,,,,,`;
    fs.appendFileSync(out, `${line}\n`);
    console.log(line);
    return;
  }
  const raw = adb(['shell', 'dumpsys', 'meminfo', pkg]);
  const pss = Math.round((num(raw, /TOTAL PSS:\s+(\d+)/) / 1024) * 10) / 10;
  const nativeMb = Math.round((num(raw, /Native Heap:\s+(\d+)/) / 1024) * 10) / 10;
  const gl = Math.round((num(raw, /^\s*GL mtrack\s+(\d+)/m) / 1024) * 10) / 10;
  const gfx = Math.round((num(raw, /Graphics:\s+(\d+)/) / 1024) * 10) / 10;
  const views = num(raw, /Views:\s+(\d+)/);
  const hint = hintFromLog();
  const line = `${iso},${pid},${pss},${nativeMb},${gl},${gfx},${views},${hint}`;
  fs.appendFileSync(out, `${line}\n`);
  console.log(line);
}

if (!fs.existsSync(out)) {
  fs.writeFileSync(
    out,
    'iso,pid,pss_mb,native_mb,gl_mb,graphics_mb,views,hint\n',
  );
}

for (let i = 0; i < samples; i += 1) {
  try {
    sample();
  } catch (err) {
    const iso = new Date().toISOString();
    const msg = String(err && err.message ? err.message : err).replace(/,/g, ' ').slice(0, 180);
    fs.appendFileSync(out, `${iso},SAMPLE_FAIL,,,,,,${msg}\n`);
    console.log(`SAMPLE_FAIL ${msg}`);
  }
  if (i + 1 < samples) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, intervalMs);
  }
}
