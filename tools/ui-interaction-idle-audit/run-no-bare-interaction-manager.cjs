#!/usr/bin/env node
/**
 * UI·진행 경로 InteractionManager.runAfterInteractions 단독 사용 금지.
 * 정본: runStageUiAfterIdle (IM idle 또는 2500ms).
 * 배경(reclaim·부트 persist·서브코어·auth warmup)만 allowlist.
 *
 * npm run audit:no-bare-interaction-manager
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const REPORT_DIR = path.join(__dirname, 'reports');
const REPORT_PATH = path.join(REPORT_DIR, 'latest.md');

const SCAN_DIRS = ['app', 'src'];
const CALL_RE = /InteractionManager\.runAfterInteractions\s*\(/;

/** 의도적 유휴 대기 — 데드라인 강제 시 PSS·타이틀 히치·재탈환 조기 실행 */
const ALLOWLIST = new Set([
  'src/navigation/stageNavGate.ts',
  'app/_layout.tsx',
  'src/store/planetCoreRuntimeStore.ts',
  'src/game/nativeReclaim/runPlanetHubPostSkiaPeakReclaimPass.ts',
  'src/game/nativeReclaim/runDeepNativeReclaimPass.ts',
  'src/game/nativeReclaim/deferredNativeReclaimScheduler.ts',
  'src/arcCore/subcores/ArcCoreTerritorialCombatSubCore.ts',
  'src/arcCore/subcores/AiEconomySubCore.ts',
  'src/arcCore/subcores/ArcCoreDailyOpsSubCore.ts',
  'src/firebase/firebaseAnonymousAuth.ts',
  'src/game/devMetroReloadGuard.ts',
]);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (
        ent.name === 'node_modules' ||
        ent.name === 'generated' ||
        ent.name === '__tests__'
      ) {
        continue;
      }
      walk(p, out);
    } else if (/\.(tsx?|jsx?)$/.test(ent.name)) {
      if (/\.test\.(tsx?|jsx?)$/.test(ent.name)) continue;
      out.push(p);
    }
  }
  return out;
}

function rel(abs) {
  return path.relative(ROOT, abs).replace(/\\/g, '/');
}

function scanFile(absPath) {
  const r = rel(absPath);
  const text = fs.readFileSync(absPath, 'utf8');
  if (!CALL_RE.test(text)) return [];
  if (ALLOWLIST.has(r)) return [];
  const hits = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      continue;
    }
    if (CALL_RE.test(lines[i])) {
      hits.push({ file: r, line: i + 1, text: trimmed });
    }
  }
  return hits;
}

function main() {
  const files = [];
  for (const d of SCAN_DIRS) {
    walk(path.join(ROOT, d), files);
  }
  const hits = [];
  for (const f of files) {
    hits.push(...scanFile(f));
  }

  if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
  const status = hits.length === 0 ? 'PASS' : 'FAIL';
  const body = [
    `# no-bare-interaction-manager`,
    '',
    `status=${status}`,
    `hits=${hits.length}`,
    '',
    hits.length === 0
      ? 'UI·진행 경로 bare `runAfterInteractions` 없음. 배경 allowlist만 남음.'
      : hits.map((h) => `- ${h.file}:${h.line} \`${h.text}\``).join('\n'),
    '',
  ].join('\n');
  fs.writeFileSync(REPORT_PATH, body, 'utf8');

  if (hits.length > 0) {
    console.error(`[audit:no-bare-interaction-manager] FAIL ${hits.length}`);
    for (const h of hits) {
      console.error(`  ${h.file}:${h.line} ${h.text}`);
    }
    process.exit(1);
  }
  console.log('[audit:no-bare-interaction-manager] PASS');
}

main();
