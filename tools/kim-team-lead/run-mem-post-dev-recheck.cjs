'use strict';
/**
 * 개발 반영 후 mem-post-dev-recheck — 정적 audit + retention 스냅샷 + handoff·status 갱신
 * npm run audit:mem-post-dev-recheck
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = process.cwd();
const HANDOFF = path.join(ROOT, 'tools', 'kim-team-lead', 'reports', 'kim-economy-handoff.md');
const STATUS = path.join(ROOT, 'tools', 'kim-team-lead', 'reports', 'DEV_PROCESS_GATE_STATUS.md');
const RETENTION = path.join(ROOT, 'tools', 'memory-profiler', 'reports', 'latest-retention-audit.md');
const FLAG = path.join(ROOT, 'tools', 'kim-team-lead', 'reports', '.mem-post-dev-recheck-pending.flag');
const MEM_TIMELINE = path.join(ROOT, 'tools', 'long-run-monitor', 'logs', 'mem-timeline.csv');

function run(cmd, label) {
  try {
    execSync(cmd, { cwd: ROOT, stdio: 'pipe', encoding: 'utf8', timeout: 300000 });
    return { label, ok: true, detail: 'PASS' };
  } catch (err) {
    const tail = String(err.stdout || err.stderr || err.message || '').slice(-800);
    return { label, ok: false, detail: tail || 'FAIL' };
  }
}

function readRetentionVerdict() {
  try {
    const raw = fs.readFileSync(RETENTION, 'utf8');
    const m = raw.match(/Verdict:\s*\*\*(PASS|FAIL|WARN|NO_DATA)\*\*/i);
    return m ? m[1].toUpperCase() : 'NO_DATA';
  } catch {
    return 'NO_DATA';
  }
}

function readMemTimelineTail() {
  try {
    const raw = fs.readFileSync(MEM_TIMELINE, 'utf8').trim().split('\n');
    const rows = raw.slice(-5);
    return rows.join('\n');
  } catch {
    return '(mem-timeline unavailable)';
  }
}

function listDirtyDevPaths() {
  try {
    const out = execSync('git status --porcelain', { encoding: 'utf8', timeout: 8000 });
    return out
      .split('\n')
      .filter((l) => l.trim())
      .map((l) => l.slice(3).trim())
      .filter((f) => /^(src\/|app\/|tables\/)/.test(f));
  } catch {
    return [];
  }
}

function overallVerdict(gates, retention) {
  if (gates.some((g) => !g.ok)) return 'CRITICAL';
  if (retention === 'FAIL') return 'CRITICAL';
  if (retention === 'NO_DATA' || retention === 'WARN') return 'WARN';
  return 'OK';
}

function appendHandoff(block) {
  const sep = fs.existsSync(HANDOFF) ? '\n' : '';
  fs.appendFileSync(HANDOFF, `${sep}${block}\n`, 'utf8');
}

function writeStatus(payload) {
  fs.mkdirSync(path.dirname(STATUS), { recursive: true });
  fs.writeFileSync(STATUS, payload, 'utf8');
}

function clearFlag() {
  try {
    if (fs.existsSync(FLAG)) fs.unlinkSync(FLAG);
  } catch {
    /* ignore */
  }
}

function main() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const stamp = kst.toISOString().replace('T', ' ').slice(0, 19) + ' KST';
  const dirty = listDirtyDevPaths();

  const gates = [
    run('npx tsc --noEmit -p tsconfig.client.json', 'tsc'),
    run('npm run audit:memory:all', 'audit:memory:all'),
  ];

  const retention = readRetentionVerdict();
  const verdict = overallVerdict(gates, retention);
  const timelineTail = readMemTimelineTail();

  const gateLines = gates.map((g) => `- ${g.label}: **${g.ok ? 'PASS' : 'FAIL'}**`).join('\n');

  const handoffBlock = [
    `## [관측] ${stamp} — mem-post-dev-recheck (자동)`,
    '',
    `- **mem-post-dev-recheck**: **${verdict}**`,
    `- **retention**: ${retention} (\`latest-retention-audit.md\`)`,
    gateLines,
    `- **dirty dev paths**: ${dirty.length}${dirty.length ? ` — ${dirty.slice(0, 8).join(', ')}${dirty.length > 8 ? '…' : ''}` : ''}`,
    `- **mem-timeline tail**:`,
    '```',
    timelineTail,
    '```',
    `- **next**: ${verdict === 'OK' ? 'soak·floor 실측은 김경제 주기 감시' : '김팀장 P0 — FAIL 게이트·retention 조치'}`,
    '',
    `> status: mem-post-dev-recheck **${verdict}**`,
  ].join('\n');

  appendHandoff(handoffBlock);

  const statusDoc = [
    '# Arcfire Dev Process Gate Status',
    '',
    `> **Auto-updated**: ${stamp} · \`npm run audit:mem-post-dev-recheck\``,
    '',
    '| 항목 | 상태 |',
    '|------|------|',
    '| mem-post-dev-recheck | **' + verdict + '** |',
    '| retention audit | ' + retention + ' |',
    ...gates.map((g) => `| ${g.label} | ${g.ok ? 'PASS' : 'FAIL'} |`),
    '| Cursor hook pss-pre-dev-gate | REGISTERED |',
    '| Cursor hook session pss brief | REGISTERED |',
    '| Cursor hook mem-post-dev trigger | REGISTERED |',
    '',
    '## Hooks (beforeSubmitPrompt / sessionStart)',
    '- `.cursor/hooks/on-before-submit-prompt-pss-pre-dev-gate.cjs`',
    '- `.cursor/hooks/on-session-start-pss-pre-dev-brief.cjs`',
    '- `.cursor/hooks/on-session-start-mem-post-dev-trigger.cjs`',
    '',
    '## 정본',
    '- `.cursor/rules/arcfire-memory-leak-audit-first.mdc` §0-A',
    '',
    verdict === 'OK'
      ? '**프로세스 게이트: OPERATIONAL** — 정적 audit PASS · retention ' + retention
      : '**프로세스 게이트: ACTION REQUIRED** — FAIL 항목 수정 후 재실행',
    '',
  ].join('\n');

  writeStatus(statusDoc);
  if (verdict === 'OK') clearFlag();

  console.log(`mem-post-dev-recheck: ${verdict}`);
  for (const g of gates) {
    console.log(`  ${g.label}: ${g.ok ? 'PASS' : 'FAIL'}`);
  }
  console.log(`  retention: ${retention}`);
  console.log(`  handoff appended · status: ${path.relative(ROOT, STATUS)}`);

  process.exit(gates.some((g) => !g.ok) ? 1 : 0);
}

main();
