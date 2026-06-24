#!/usr/bin/env node
/**
 * 김팀장 일 1회 경제·밸런스 총괄 검수
 * — 김경제 에이전트 산출물(audit:balance-ops·SIM·handoff) 자동 점검
 * — 연동·tsc 게이트 → 김팀장 연동 체크리스트 생성
 * 보고서: tools/kim-team-lead/reports/daily-review-latest.md
 */
'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const REPORT_DIR = path.join(__dirname, 'reports');
const REPORT_MD = path.join(REPORT_DIR, 'daily-review-latest.md');
const STATE_JSON = path.join(REPORT_DIR, 'daily-review-state.json');
const HANDOFF_MD = path.join(REPORT_DIR, 'kim-economy-handoff.md');
const RETENTION_JSON = path.join(ROOT, 'tools/memory-profiler/reports/latest-retention-audit.json');
const RETENTION_MD = path.join(ROOT, 'tools/memory-profiler/reports/latest-retention-audit.md');

const BALANCE_OPS_LATEST = path.join(ROOT, 'tools/balance-ops-audit/reports/latest.md');
const LEARNING_JSON = path.join(ROOT, 'tools/balance-ops-audit/reports/learning-state.json');
const ECONOMY_SIM_LATEST = path.join(ROOT, 'tools/economy-sim/reports/latest.md');

const ECONOMY_PATH_PREFIXES = [
  'src/arcCore/economy/',
  'src/arcCore/balance/',
  'src/arcCore/aabs/',
  'src/arcCore/schedule/',
  'tools/economy-sim/',
  'tools/balance-ops-audit/',
  'tools/balance-audit/',
  'tables/balance/economy',
  'tables/balance/arc_core_daily_ops',
];

function readText(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return '';
  }
}

function readJson(p, fallback) {
  try {
    return JSON.parse(readText(p));
  } catch {
    return fallback;
  }
}

function kstDateKey(d = new Date()) {
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const y = kst.getUTCFullYear();
  const m = String(kst.getUTCMonth() + 1).padStart(2, '0');
  const day = String(kst.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function runNpm(script) {
  return spawnSync('npm', ['run', script], {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    maxBuffer: 12 * 1024 * 1024,
  });
}

function runTsc() {
  return spawnSync('npx', ['tsc', '--noEmit', '-p', 'tsconfig.client.json'], {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    maxBuffer: 12 * 1024 * 1024,
  });
}

function parseOverallFromBalanceOps(md) {
  const m = md.match(/\*\*Overall:\*\*\s*(PASS|FAIL)/i);
  return m ? m[1].toUpperCase() : 'UNKNOWN';
}

function gitEconomyDirtyFiles() {
  const r = spawnSync('git', ['status', '--porcelain'], {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (r.status !== 0) return [];
  return r.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^\?\?\s+|^[ MADRCU?!]{2}\s+/, '').trim())
    .filter((f) => ECONOMY_PATH_PREFIXES.some((p) => f.replace(/\\/g, '/').startsWith(p)));
}

function extractHandoffPending(handoff) {
  const stripped = handoff.replace(/<!--[\s\S]*?-->/g, '');
  const lines = stripped.split('\n');
  const pending = [];
  let inPending = false;
  for (const line of lines) {
    if (/^##\s*김팀장\s*연동\s*대기/i.test(line) || /^##\s*연동\s*대기/i.test(line)) {
      inPending = true;
      continue;
    }
    if (inPending && /^##\s/.test(line)) break;
    if (inPending && /^-\s*\[ \]/.test(line)) pending.push(line.replace(/^-\s*\[ \]\s*/, '').trim());
  }
  return pending;
}

function extractMemProfileObservation(handoff) {
  const blocks = handoff.split(/(?=##\s*\[관측\])/i).slice(1);
  for (const block of blocks) {
    if (/템플릿|갱신 템플릿/i.test(block)) continue;
    const retentionLine = block.match(/mem-profile[^\n]*/i)?.[0] ?? block.match(/retention[^\n]*/i)?.[0] ?? '';
    if (!retentionLine || /PASS\|FAIL\|NO_DATA/.test(retentionLine)) continue;
    if (/\d{4}-\d{2}-\d{2}/.test(block)) return retentionLine.trim();
  }
  return null;
}

function loadRetentionAudit() {
  const j = readJson(RETENTION_JSON, null);
  if (!j) return { verdict: 'NO_REPORT', failures: 0, results: [] };
  const failures = (j.results ?? []).filter((r) => r.verdict === 'FAIL').length;
  return {
    verdict: j.verdict ?? 'UNKNOWN',
    failures,
    generatedAt: j.generatedAt ?? null,
    results: j.results ?? [],
  };
}

function buildIntegrationChecklist({ tscOk, balanceOpsOk, handoffPending, economyDirty, retention }) {
  const items = [];
  items.push({ ok: balanceOpsOk, text: '김경제 산출물 `audit:balance-ops` PASS' });
  items.push({ ok: tscOk, text: 'TypeScript `tsc --noEmit` 통과 (연동 전 타입 검증)' });
  items.push({
    ok: handoffPending.length === 0,
    text:
      handoffPending.length === 0
        ? '김경제 handoff 연동 대기 항목 없음'
        : `김경제 handoff 연동 대기 ${handoffPending.length}건 — 김팀장 검수·머지 필요`,
  });
  items.push({
    ok: economyDirty.length === 0,
    text:
      economyDirty.length === 0
        ? '경제 축 git 미커밋 변경 없음'
        : `경제 축 미커밋 ${economyDirty.length}건 — 김팀장 연동·정리 검토`,
  });
  items.push({
    ok: retention.verdict !== 'FAIL',
    text:
      retention.verdict === 'FAIL'
        ? `김경제 retention audit FAIL (${retention.failures}건) — 김팀장 P1 메모리 수정`
        : retention.verdict === 'NO_DATA' || retention.verdict === 'NO_REPORT'
          ? 'retention audit: 데이터 없음 (profile:mem:watch 대기)'
          : `retention audit: ${retention.verdict}`,
  });
  return items;
}

function main() {
  const force = process.argv.includes('--force');
  const skipAudit = process.argv.includes('--skip-audit');
  const dateKey = kstDateKey();
  const prev = readJson(STATE_JSON, {});

  if (!force && prev.lastKstDate === dateKey && prev.overall === 'PASS') {
    console.log(`[kim-team-lead] 오늘(${dateKey}) PASS 검수 완료. --force 로 재실행.`);
    console.log(readText(REPORT_MD) || '(보고서 없음)');
    process.exit(0);
  }

  fs.mkdirSync(REPORT_DIR, { recursive: true });

  let balanceOpsExit = 0;
  if (!skipAudit) {
    const r = runNpm('audit:balance-ops');
    balanceOpsExit = r.status ?? 1;
    if (balanceOpsExit !== 0) {
      console.error(r.stdout || r.stderr || 'audit:balance-ops failed');
    }
  }

  const tscR = runTsc();
  const tscOk = tscR.status === 0;

  const balanceOpsMd = readText(BALANCE_OPS_LATEST);
  const balanceOpsOverall = parseOverallFromBalanceOps(balanceOpsMd);
  const balanceOpsOk = balanceOpsExit === 0 && balanceOpsOverall === 'PASS';

  const learning = readJson(LEARNING_JSON, {});
  const lastSnap = learning.snapshots?.[learning.snapshots.length - 1] ?? null;
  const handoff = readText(HANDOFF_MD);
  const handoffPending = handoff ? extractHandoffPending(handoff) : [];
  const economyDirty = gitEconomyDirtyFiles();
  const retention = loadRetentionAudit();
  const memProfileObs = handoff ? extractMemProfileObservation(handoff) : null;
  const retentionMd = readText(RETENTION_MD);
  const retentionFailLines = (retention.results ?? [])
    .filter((r) => r.verdict === 'FAIL')
    .map((r) => `- **${r.flag ?? r.stage}** @ ${r.stage ?? '—'} (${r.detail ?? ''})`)
    .join('\n');

  const checklist = buildIntegrationChecklist({
    tscOk,
    balanceOpsOk,
    handoffPending,
    economyDirty,
    retention,
  });
  const allCheckOk = checklist.every((c) => c.ok);
  const overall = balanceOpsOk && tscOk && allCheckOk ? 'PASS' : 'FAIL';

  const insights = (learning.lastInsights ?? [])
    .map((i) => `- [${i.severity}] ${i.message} → **${i.action}**`)
    .join('\n');

  const ts = new Date().toISOString();
  const md = `# 김팀장 일일 경제·밸런스 총괄 검수

Generated: ${ts} (KST ${dateKey})

**Overall:** ${overall}

> **역할**: 김경제 에이전트가 구축·테스트한 경제·밸런스·아크코어 운영 산출물을 김팀장이 **1일 1회** 자동 검수.  
> **최종 연동·코드 정리 책임**: **김팀장 에이전트** (\`@김팀장\`)

## 1. 김경제 산출물 검수 (자동)

| 항목 | 결과 |
|------|------|
| \`audit:balance-ops\` | ${balanceOpsOverall} (exit ${balanceOpsExit}) |
| Whale/F2P KPI | ${lastSnap?.kpiStatus ?? '—'} (ratio ${lastSnap?.whaleF2pRatio?.toFixed?.(2) ?? '—'}) |
| 일일 배치 계약 | ${lastSnap?.dailyPolicyOk ? 'OK' : 'CHECK'} |
| 고빈도 호출 위반 | ${(lastSnap?.dailyViolations?.length ?? 0) === 0 ? '없음' : `${lastSnap.dailyViolations.length}건`} |
| \`tsc --noEmit\` | ${tscOk ? 'PASS' : 'FAIL'} |
| **retention audit** | **${retention.verdict}** (${retention.failures} FAIL) |

### 메모리 프로파일링 (김경제 → 김팀장)

| 항목 | 값 |
|------|-----|
| verdict | ${retention.verdict} |
| generated | ${retention.generatedAt ?? '—'} |
| handoff 관측 | ${memProfileObs ?? '_(없음)_'} |

${retentionFailLines ? `\n**P1 retention FAIL:**\n${retentionFailLines}\n` : ''}

${retentionMd.trim() ? `\n<details><summary>latest-retention-audit.md</summary>\n\n${retentionMd.trim()}\n\n</details>\n` : '_(latest-retention-audit.md 없음)_'}

### balance-ops 요약

${balanceOpsMd.trim() || '_(latest.md 없음)_'}

### Economy SIM

${readText(ECONOMY_SIM_LATEST).trim() || '_(latest.md 없음)_'}

### 학습 인사이트

${insights || '_없음_'}

## 2. 김팀장 연동 체크리스트

${checklist.map((c) => `- [${c.ok ? 'x' : ' '}] ${c.text}`).join('\n')}

${handoffPending.length ? `\n### handoff 연동 대기\n\n${handoffPending.map((p) => `- [ ] ${p}`).join('\n')}\n` : ''}
${economyDirty.length ? `\n### 경제 축 미커밋 파일\n\n${economyDirty.map((f) => `- \`${f}\``).join('\n')}\n` : ''}

## 3. 김팀장 후속 (수동)

1. handoff \`${path.relative(ROOT, HANDOFF_MD)}\` · retention audit 검토 → **FAIL 시 STAGE·Skia·reclaim 코드 수정**
2. 경제 FAIL → **본 세션** 수정 · 김경제에는 **재감사만** 배정
3. 수정 후 \`audit:memory:retention\` · handoff \`[mem-profile-fix]\` · 체크박스 갱신

## 4. 재실행

\`\`\`bash
npm run audit:team-lead:daily          # 오늘 1회 (PASS면 스킵)
npm run audit:team-lead:daily -- --force
\`\`\`

워크플로: \`docs/KIM_TEAM_ECONOMY_WORKFLOW.md\`
`;

  fs.writeFileSync(REPORT_MD, md, 'utf8');

  const state = {
    lastRun: ts,
    lastKstDate: dateKey,
    overall,
    balanceOpsOverall,
    tscOk,
    handoffPendingCount: handoffPending.length,
    economyDirtyCount: economyDirty.length,
    retentionVerdict: retention.verdict,
    retentionFailures: retention.failures,
    kimEconomyInsights: learning.lastInsights ?? [],
  };
  fs.writeFileSync(STATE_JSON, JSON.stringify(state, null, 2) + '\n', 'utf8');

  const dayDir = path.join(REPORT_DIR, dateKey);
  fs.mkdirSync(dayDir, { recursive: true });
  fs.writeFileSync(path.join(dayDir, `review-${ts.replace(/[:.]/g, '-')}.md`), md, 'utf8');

  console.log(md);
  process.exit(overall === 'PASS' ? 0 : 1);
}

main();
