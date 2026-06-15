'use strict';
/**
 * 일일·경제·밸런스 점검 실행 후 Cursor 에이전트 핸드오프 (학습 인사이트 포함)
 * 출력: tools/arc-core-self-optimize/outbox/cursor-handoff.md
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const OUT_DIR = path.join(__dirname, 'outbox');
const OUT = path.join(OUT_DIR, 'cursor-handoff.md');
const TEMPLATE = path.join(__dirname, 'PROMPT_TEMPLATE.md');

const SECTIONS = [
  {
    title: '일일 성능·위생 점검',
    path: path.join(ROOT, 'tools', 'daily-perf-audit', 'reports', 'latest.md'),
    run: 'audit:daily',
  },
  {
    title: 'ArcCore 경제·밸런스 운영 감사 (3h 학습)',
    path: path.join(ROOT, 'tools', 'balance-ops-audit', 'reports', 'latest.md'),
    run: 'audit:balance-ops',
  },
  {
    title: 'Balance audit (level-band drift)',
    path: path.join(ROOT, 'tools', 'balance-audit', 'reports', 'latest.md'),
    skipRun: true,
  },
  {
    title: 'Economy SIM KPI',
    path: path.join(ROOT, 'tools', 'economy-sim', 'reports', 'latest.md'),
    skipRun: true,
  },
];

function runNpm(script) {
  return spawnSync('npm', ['run', script], {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    maxBuffer: 12 * 1024 * 1024,
  });
}

function readSectionFile(p) {
  try {
    return fs.readFileSync(p, 'utf8').trimEnd();
  } catch {
    return `_(보고서 없음 — \`${path.relative(ROOT, p)}\`)_`;
  }
}

function readLearningRecommendations() {
  const p = path.join(ROOT, 'tools', 'balance-ops-audit', 'reports', 'learning-state.json');
  try {
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    const rec = j.recommendedNext ?? [];
    if (!rec.length) return '_권장 조치 없음 (stable)_';
    return rec.map((r, i) => `${i + 1}. [${r.severity}] ${r.action} — ${r.message}`).join('\n');
  } catch {
    return '_(learning-state.json 없음 — `npm run audit:balance-ops` 먼저 실행)_';
  }
}

function main() {
  for (const sec of SECTIONS) {
    if (sec.skipRun) continue;
    const r = runNpm(sec.run);
    if (r.status !== 0) {
      console.error(r.stdout || r.stderr || `${sec.run} failed`);
      process.exit(r.status || 1);
    }
  }

  let template = '';
  try {
    template = fs.readFileSync(TEMPLATE, 'utf8');
  } catch (e) {
    console.error('Missing PROMPT_TEMPLATE.md', e);
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const bodyParts = [
    '---',
    'handoff: arc-core-self-optimize',
    `generated: ${new Date().toISOString()}`,
    '---',
    '',
    '# 에이전트 지시문 (템플릿)',
    '',
    template.trim(),
    '',
    '---',
    '',
    '# 학습 권장 조치 (balance-ops 자동)',
    '',
    readLearningRecommendations(),
    '',
    '---',
    '',
  ];

  for (const sec of SECTIONS) {
    bodyParts.push(`# ${sec.title}`, '', readSectionFile(sec.path), '', '---', '');
  }

  fs.writeFileSync(OUT, bodyParts.join('\n'), 'utf8');
  console.log(`Handoff written: ${path.relative(ROOT, OUT)}`);
}

main();
