#!/usr/bin/env node
/**
 * Reanimated worklet 계약 정적 감사 — JS 스레드 SharedValue.value **읽기** 탐지
 * 근거: WorkletRuntime::executeSync SIGSEGV (2026-06-21 tombstone_12)
 * 출력: tools/worklet-contract-audit/reports/latest.md
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const REPORT_DIR = path.join(__dirname, 'reports');
const REPORT_PATH = path.join(REPORT_DIR, 'latest.md');

const SCAN_DIRS = ['app', 'src/components/planet', 'src/arcCore'];

/** worklet 내부 허용 — useAnimatedStyle/useFrameCallback/useAnimatedReaction 본문 */
const WORKLET_HOOK_RE =
  /useAnimatedStyle\s*\(|useFrameCallback\s*\(|useAnimatedReaction\s*\(/;

/** JS 훅 본문에서 .value 읽기(=) 의심 — 쓰기(= …)는 허용 */
const JS_READ_SV_RE =
  /(?:const|let|var|,|\()\s*\w+\s*=\s*\w+(?:Sv|Ms|ClockMs)\.value(?!\s*=)/;

/** orbitClockMsBridge readPlanetOrbitClockMs 내부 제외 */
const ALLOW_FILES = new Set([
  path.normalize('src/arcCore/orbitClockMsBridge.ts'),
]);

/** runOnUI(식별자) — useCallback 래퍼는 worklet 아님 → executeSync SIGSEGV (2026-06-23 worldmap) */
const RUN_ON_UI_IDENT_RE = /runOnUI\s*\(\s*[A-Za-z_$][\w$]*\s*\)/;

function scanRunOnUiNonInlineWorklet(text, relPath) {
  const hits = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!RUN_ON_UI_IDENT_RE.test(line)) continue;
    // runOnUI(() => { 'worklet' … }) 인라인은 허용
    if (/runOnUI\s*\(\s*\(\s*\)\s*=>/.test(line)) continue;
    hits.push({
      file: relPath,
      line: i + 1,
      text: line.trim(),
      rule: 'runOnUI_non_inline_worklet',
    });
  }
  return hits;
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === 'generated') continue;
      walk(p, out);
    } else if (/\.(tsx?|jsx?)$/.test(ent.name)) {
      out.push(p);
    }
  }
  return out;
}

function rel(p) {
  return path.relative(ROOT, p).replace(/\\/g, '/');
}

function scanFile(absPath) {
  const r = rel(absPath);
  if (ALLOW_FILES.has(r)) return [];
  const text = fs.readFileSync(absPath, 'utf8');
  const lines = text.split('\n');
  const hits = [];
  let inWorkletHook = false;
  let parenDepth = 0;
  let hookStarted = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (WORKLET_HOOK_RE.test(line)) {
      inWorkletHook = true;
      hookStarted = true;
      parenDepth = (line.match(/\(/g) || []).length - (line.match(/\)/g) || []).length;
      continue;
    }

    if (inWorkletHook && hookStarted) {
      parenDepth += (line.match(/\(/g) || []).length - (line.match(/\)/g) || []).length;
      if (trimmed.includes("'worklet'") || trimmed.includes('"worklet"')) continue;
      if (parenDepth <= 0 && /^\}\);?\s*$/.test(trimmed)) {
        inWorkletHook = false;
        hookStarted = false;
      }
      continue;
    }

    if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
    if (/\.value\s*[+\-*\/]?=/.test(line)) continue; // compound assign or write
    if (/\.value\s*=/.test(line)) continue; // JS write OK

    if (/\w+\.value/.test(line)) {
      const window = lines.slice(Math.max(0, i - 3), i + 4).join('\n');
      if (/'worklet'|"worklet"/.test(window)) continue;
      if (
        /useEffect|useLayoutEffect|useCallback|useMemo/.test(lines.slice(Math.max(0, i - 8), i + 1).join('\n'))
        && !trimmed.includes("'worklet'")
      ) {
        if (JS_READ_SV_RE.test(line) || /\.value(?!\s*=)/.test(line.replace(/orbitClockMs\.value\s*\+=/, ''))) {
          if (!/runOnJS|useAnimatedStyle|useFrameCallback|useAnimatedReaction|'worklet'/.test(line)) {
            hits.push({ line: i + 1, text: trimmed });
          }
        }
      }
    }
  }
  return hits.map((h) => ({ file: r, ...h }));
}

const files = SCAN_DIRS.flatMap((d) => walk(path.join(ROOT, d)));
const readHits = files.flatMap(scanFile);
const runOnUiHits = files.flatMap((absPath) => {
  const r = rel(absPath);
  if (ALLOW_FILES.has(r)) return [];
  return scanRunOnUiNonInlineWorklet(fs.readFileSync(absPath, 'utf8'), r);
});
const allHits = [...readHits, ...runOnUiHits];
const ok = allHits.length === 0;

fs.mkdirSync(REPORT_DIR, { recursive: true });
const md = [
  '# Worklet Contract Audit',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  `**Result: ${ok ? 'PASS' : 'FAIL'}** (${allHits.length} suspected violations: ${readHits.length} JS SharedValue reads, ${runOnUiHits.length} runOnUI non-inline worklet)`,
  '',
  'Contract: `src/components/planet/planetHubWorkletContract.ts`',
  '',
];
if (ok) {
  md.push('No suspected violations in scanned paths.');
} else {
  md.push('| File | Line | Rule | Snippet |');
  md.push('|------|------|------|---------|');
  for (const h of allHits) {
    md.push(`| \`${h.file}\` | ${h.line} | ${h.rule ?? 'js_sv_read'} | \`${h.text.slice(0, 80)}\` |`);
  }
}
fs.writeFileSync(REPORT_PATH, md.join('\n'));
console.log(ok ? 'PASS' : 'FAIL', REPORT_PATH);
process.exit(ok ? 0 : 1);
