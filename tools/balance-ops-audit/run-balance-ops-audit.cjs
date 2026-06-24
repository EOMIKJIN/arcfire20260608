#!/usr/bin/env node
/**
 * ArcCore 경제·밸런스 운영 감사 — 일 1회 배치 계약 준수 + KPI·드리프트 학습
 * 보고서: tools/balance-ops-audit/reports/latest.md
 * 타임라인: tools/balance-ops-audit/reports/timeline.csv (3h 주기 누적)
 */
'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const REPORT_DIR = path.join(__dirname, 'reports');
const REPORT_MD = path.join(REPORT_DIR, 'latest.md');
const TIMELINE_CSV = path.join(REPORT_DIR, 'timeline.csv');
const LEARNING_JSON = path.join(REPORT_DIR, 'learning-state.json');

const DAILY_ONLY_CALLS = [
  'runMarketMicroAdjustPass',
  'runIntegratedEngageHpAdjustPass',
  'ingestBalanceOverlayDeltaIfPending',
  'runTradeRouteDailyMarketPass',
  'runDailyPolicyAlignment',
  'runPlanetEnergyCorePass',
  'runPlanetEnvironmentDiversityPass',
  'runGlobalPlanetMasterBalancePass',
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

function runNpm(script) {
  return spawnSync('npm', ['run', script], {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    maxBuffer: 12 * 1024 * 1024,
  });
}

function walkTsFiles(dir, out, depth = 0) {
  if (depth > 40) return;
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkTsFiles(p, out, depth + 1);
    else if (e.isFile() && /\.(ts|tsx)$/.test(e.name)) out.push(p);
  }
}

function scanDailyOnlyViolations() {
  const allowFiles = new Set([
    path.normalize(path.join(ROOT, 'src/arcCore/schedule/runArcCoreDailyOpsBatch.ts')),
    path.normalize(path.join(ROOT, 'tools/economy-sim/run-economy-sim.ts')),
  ]);
  const files = [];
  walkTsFiles(path.join(ROOT, 'src'), files);
  walkTsFiles(path.join(ROOT, 'app'), files);
  const violations = [];
  for (const f of files) {
    const norm = path.normalize(f);
    if (allowFiles.has(norm)) continue;
    const src = readText(f);
    const lines = src.split(/\r?\n/);
    for (const fn of DAILY_ONLY_CALLS) {
      const callRe = new RegExp(`\\b${fn}\\s*\\(`);
      const defRe = new RegExp(`\\b(?:export\\s+)?(?:async\\s+)?function\\s+${fn}\\b`);
      let hit = false;
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
        if (defRe.test(line)) continue;
        if (callRe.test(line)) {
          hit = true;
          break;
        }
      }
      if (hit) violations.push({ file: path.relative(ROOT, f).replace(/\\/g, '/'), fn });
    }
  }
  return violations;
}

function parseDailyOpsPolicy() {
  const csvPath = path.join(ROOT, 'tables/balance/arc_core_daily_ops_policy.csv');
  const raw = readText(csvPath);
  if (!raw.trim()) return { ok: false, detail: 'missing csv' };
  const lines = raw.trim().split(/\r?\n/);
  const header = lines[0].split(',');
  const row = lines[1]?.split(',') ?? [];
  const kv = {};
  for (let i = 0; i < header.length; i += 1) kv[header[i]] = row[i] ?? '';
  const enabled = String(kv.enabled).toUpperCase() === 'TRUE';
  const batchHour = Number(kv.batchRunHour);
  const batchMinute = Number(kv.batchRunMinute);
  const windowH = Number(kv.observationWindowHours);
  const flags = [
    'runPlanetEnergyPass',
    'runPlanetEnvironmentPass',
    'runPlanetMasterBalancePass',
    'runScenarioEconomyPass',
    'runMarketPricePass',
    'runAabsAlignmentPass',
    'runWorldExpansionUnlock',
  ];
  const allPasses = flags.every((k) => String(kv[k]).toUpperCase() === 'TRUE');
  return {
    ok: enabled && batchHour === 12 && batchMinute === 0 && windowH === 24 && allPasses,
    enabled,
    timeZone: kv.timeZone ?? 'Asia/Seoul',
    batchRunHour: batchHour,
    batchRunMinute: batchMinute,
    observationWindowHours: windowH,
    allPasses,
    notesKo: kv.notesKo ?? '',
  };
}

function readEconomySimKpi() {
  const deltaPath = path.join(ROOT, 'tools/economy-sim/outbox/latest-delta.json');
  const delta = readJson(deltaPath, null);
  const reportMd = readText(path.join(ROOT, 'tools/economy-sim/reports/latest.md'));
  let whaleF2p = null;
  let kpiStatus = 'unknown';
  const ratioMatch = reportMd.match(/Whale\/F2P\s*\|\s*\*\*([\d.]+)\*\*\s*\((\w+)\)/);
  if (ratioMatch) {
    whaleF2p = Number(ratioMatch[1]);
    kpiStatus = ratioMatch[2];
  }
  if (delta?.kpi) {
    whaleF2p = delta.kpi.whaleToF2pPowerRatio ?? delta.kpi.whaleF2pRatio ?? whaleF2p;
    kpiStatus = delta.kpi.status ?? kpiStatus;
  }
  return {
    deltaId: delta?.deltaId ?? null,
    whaleF2pRatio: whaleF2p,
    kpiStatus,
    generatedAt: delta?.generatedAt ?? null,
  };
}

function readBalanceDrift() {
  const logic = readJson(path.join(ROOT, 'tools/balance-audit/reports/logic_input.json'), null);
  if (!logic?.drifts) return { drifts: [], maxGapPercent: null, warnCount: 0 };
  const drifts = logic.drifts;
  const gaps = drifts.map((d) => Number(d.gapPercent));
  const maxGap = gaps.length ? Math.max(...gaps.map((g) => Math.abs(g))) : null;
  const warnCount = drifts.filter((d) => d.severity === 'warn' || d.severity === 'critical').length;
  return { drifts, maxGapPercent: maxGap, warnCount, generatedAt: logic.generatedAt };
}

function readPriceElasticity() {
  const csv = readText(path.join(ROOT, 'tables/balance/economy_price_micro_policy.csv'));
  const tradeRouteRow = csv
    .split(/\r?\n/)
    .find((line) => line.startsWith('price_elasticity_trade_route,'));
  const elasticity = tradeRouteRow ? Number(tradeRouteRow.split(',')[1]) : null;
  return { priceElasticity: elasticity, realtimeDisabled: elasticity === 0 };
}

function computeLearningInsights(snapshot, prev) {
  const insights = [];
  if (prev?.whaleF2pRatio != null && snapshot.whaleF2pRatio != null) {
    const delta = snapshot.whaleF2pRatio - prev.whaleF2pRatio;
    if (Math.abs(delta) >= 0.3) {
      insights.push({
        kind: 'kpi_trend',
        severity: snapshot.kpiStatus === 'critical' ? 'critical' : 'warn',
        message: `Whale/F2P ratio moved ${delta > 0 ? '+' : ''}${delta.toFixed(2)} (${prev.whaleF2pRatio} → ${snapshot.whaleF2pRatio})`,
        action: snapshot.kpiStatus === 'critical' ? 'review_macro_policy_csv' : 'monitor',
      });
    }
  }
  if (prev?.maxGapPercent != null && snapshot.maxGapPercent != null) {
    const gapDelta = snapshot.maxGapPercent - prev.maxGapPercent;
    if (gapDelta >= 5) {
      insights.push({
        kind: 'drift_worsening',
        severity: 'warn',
        message: `Level-band drift max gap +${gapDelta.toFixed(1)}% (${prev.maxGapPercent}% → ${snapshot.maxGapPercent}%)`,
        action: 'run_sim_economy_before_daily_batch',
      });
    } else if (gapDelta <= -5) {
      insights.push({
        kind: 'drift_improving',
        severity: 'ok',
        message: `Level-band drift max gap improved ${gapDelta.toFixed(1)}%`,
        action: 'none',
      });
    }
  }
  if (snapshot.dailyViolations.length > 0) {
    insights.push({
      kind: 'architecture_violation',
      severity: 'critical',
      message: `${snapshot.dailyViolations.length} high-frequency balance call(s) outside daily batch`,
      action: 'move_to_runArcCoreDailyOpsBatch',
    });
  }
  if (!snapshot.dailyPolicyOk) {
    insights.push({
      kind: 'daily_policy',
      severity: 'critical',
      message: 'arc_core_daily_ops_policy.csv does not match v4.0 12:00 / 24h contract',
      action: 'fix_arc_core_daily_ops_policy_csv',
    });
  }
  if (snapshot.kpiStatus === 'warn' || snapshot.kpiStatus === 'critical') {
    insights.push({
      kind: 'macro_kpi',
      severity: snapshot.kpiStatus,
      message: `Economy SIM KPI status: ${snapshot.kpiStatus} (Whale/F2P=${snapshot.whaleF2pRatio ?? '?'})`,
      action: 'audit_balance_tables_and_macro_policy',
    });
  }
  if (snapshot.balanceAuditExit !== 0) {
    insights.push({
      kind: 'balance_audit',
      severity: 'critical',
      message: 'balance audit failed — table linkage or weapon economy drift',
      action: 'npm_run_audit_balance',
    });
  }
  if (insights.length === 0) {
    insights.push({
      kind: 'stable',
      severity: 'ok',
      message: 'No actionable drift or contract violations detected',
      action: 'continue_3h_monitor',
    });
  }
  return insights;
}

function appendTimeline(snapshot) {
  const header =
    'timestamp,overall,dailyPolicyOk,violations,whaleF2p,kpiStatus,maxGapPercent,warnBands,balanceAuditExit,deltaId';
  const row = [
    snapshot.timestamp,
    snapshot.overall,
    snapshot.dailyPolicyOk ? 1 : 0,
    snapshot.dailyViolations.length,
    snapshot.whaleF2pRatio ?? '',
    snapshot.kpiStatus,
    snapshot.maxGapPercent ?? '',
    snapshot.warnBandCount,
    snapshot.balanceAuditExit,
    snapshot.deltaId ?? '',
  ].join(',');
  if (!fs.existsSync(TIMELINE_CSV)) {
    fs.writeFileSync(TIMELINE_CSV, `${header}\n${row}\n`, 'utf8');
    return;
  }
  fs.appendFileSync(TIMELINE_CSV, `${row}\n`, 'utf8');
}

function updateLearningState(snapshot, insights) {
  const prev = readJson(LEARNING_JSON, { snapshots: [], lastInsights: [] });
  const last = prev.snapshots[prev.snapshots.length - 1];
  const learning = {
    lastUpdated: snapshot.timestamp,
    snapshots: [...prev.snapshots.slice(-47), snapshot],
    lastInsights: insights,
    recommendedNext: insights.filter((i) => i.severity !== 'ok').slice(0, 3),
    trend: {
      whaleF2pDelta:
        last?.whaleF2pRatio != null && snapshot.whaleF2pRatio != null
          ? snapshot.whaleF2pRatio - last.whaleF2pRatio
          : null,
      maxGapDelta:
        last?.maxGapPercent != null && snapshot.maxGapPercent != null
          ? snapshot.maxGapPercent - last.maxGapPercent
          : null,
    },
  };
  fs.writeFileSync(LEARNING_JSON, JSON.stringify(learning, null, 2), 'utf8');
  return learning;
}

function isCiContractOnlyMode() {
  return (
    process.env.ARC_BALANCE_OPS_CI === '1'
    || process.env.ARC_SKIP_PLANET_ECONOMY_HEADLESS === '1'
    || process.env.GITHUB_ACTIONS === 'true'
  );
}

function main() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const ciContractOnly = isCiContractOnlyMode();

  const balanceAudit = runNpm('audit:balance');
  let planetEconomyAudit = { status: 0, stdout: '', stderr: '' };
  let planetEconomyMd = '';
  if (ciContractOnly) {
    planetEconomyMd =
      '# 행성 경제 3h 검사 — CI contract-only skip\n\n'
      + 'GitHub Actions / `ARC_BALANCE_OPS_CI=1` — React Native headless 경로 미실행.\n'
      + '전수 검사: 로컬 `npm run audit:planet-economy-3h` · 김팀장 `audit:team-lead:daily`.\n';
  } else {
    planetEconomyAudit = spawnSync('node', ['tools/planet-economy-3h-audit/run-planet-economy-3h-audit.cjs'], {
      cwd: ROOT,
      encoding: 'utf8',
      shell: process.platform === 'win32',
      maxBuffer: 16 * 1024 * 1024,
    });
    planetEconomyMd = readText(path.join(ROOT, 'tools/planet-economy-3h-audit/reports/latest.md'));
  }
  const planetEconomyExit = ciContractOnly ? 0 : (planetEconomyAudit.status ?? 1);
  const dailyPolicy = parseDailyOpsPolicy();
  const violations = scanDailyOnlyViolations();
  const economyKpi = readEconomySimKpi();
  const drift = readBalanceDrift();
  const elasticity = readPriceElasticity();

  const timestamp = new Date().toISOString();
  const snapshot = {
    timestamp,
    ciContractOnly,
    dailyPolicyOk: dailyPolicy.ok,
    dailyPolicy: dailyPolicy,
    dailyViolations: violations,
    whaleF2pRatio: economyKpi.whaleF2pRatio,
    kpiStatus: economyKpi.kpiStatus,
    deltaId: economyKpi.deltaId,
    maxGapPercent: drift.maxGapPercent,
    warnBandCount: drift.warnCount,
    balanceAuditExit: balanceAudit.status ?? 1,
    planetEconomyExit,
    planetEconomyOverall: planetEconomyMd.match(/\*\*Overall:\*\* (\w+)/)?.[1] ?? 'unknown',
    priceElasticity: elasticity.priceElasticity,
    realtimePriceDisabled: elasticity.realtimeDisabled,
  };

  const prevLearning = readJson(LEARNING_JSON, { snapshots: [] });
  const prevSnap = prevLearning.snapshots[prevLearning.snapshots.length - 1];
  const insights = computeLearningInsights(snapshot, prevSnap);
  const criticalInsights = insights.filter((i) => i.severity === 'critical');
  const warnInsights = insights.filter((i) => i.severity === 'warn');
  snapshot.overall =
    violations.length > 0 ||
    !dailyPolicy.ok ||
    balanceAudit.status !== 0 ||
    planetEconomyExit !== 0 ||
    criticalInsights.length > 0
      ? 'FAIL'
      : warnInsights.length > 0
        ? 'WARN'
        : 'PASS';

  const learning = updateLearningState(snapshot, insights);
  appendTimeline(snapshot);

  const lines = [
    '# ArcCore Balance Ops Audit',
    '',
    `Generated: ${timestamp}`,
    '',
    `**Overall:** ${snapshot.overall}`,
    ciContractOnly ? '**Mode:** CI contract-only (planet-economy headless skipped)' : '',
    '',
    '## 일 1회 배치 계약 (v4.0 §10)',
    '',
    `- Policy CSV: ${dailyPolicy.ok ? 'OK' : '**FAIL**'} — ${dailyPolicy.timeZone} ${dailyPolicy.batchRunHour}:${String(dailyPolicy.batchRunMinute).padStart(2, '0')}, window ${dailyPolicy.observationWindowHours}h`,
    `- ${dailyPolicy.notesKo}`,
    `- SubCore probe: ` +
      '`ArcCoreDailyOpsSubCore` 60s tick → `shouldRunArcCoreDailyBatch` → `runArcCoreDailyOpsBatch`',
    '- Economy SIM ingest: 일일 배치 runMarketPricePass 내부만 (ingestBalanceOverlayDeltaIfPending)',
    `- Price elasticity: ${elasticity.priceElasticity} (realtime disabled: ${elasticity.realtimeDisabled ? 'yes' : 'no'})`,
    '',
    '## 고빈도 밸런스 호출 스캔',
    '',
    violations.length === 0
      ? '- OK — daily-only passes confined to `runArcCoreDailyOpsBatch`'
      : violations.map((v) => `- **VIOLATION** \`${v.fn}\` in \`${v.file}\``).join('\n'),
    '',
    '## Balance audit (`npm run audit:balance`)',
    '',
    `exit: ${balanceAudit.status ?? 1}`,
    '',
    '## Economy SIM KPI',
    '',
    `- deltaId: ${economyKpi.deltaId ?? '—'}`,
    `- Whale/F2P: ${economyKpi.whaleF2pRatio ?? '—'} (${economyKpi.kpiStatus})`,
  ];

  if (drift.drifts.length) {
    lines.push('', '## Level-band drift', '');
    for (const d of drift.drifts) {
      lines.push(`- ${d.key}: gap ${d.gapPercent}% (${d.severity}) → ${d.decision}`);
    }
  }

  lines.push('', '## 학습 인사이트 (자동)', '');
  for (const i of insights) {
    lines.push(`- [${i.severity}] ${i.message} → **${i.action}**`);
  }

  if (learning.recommendedNext.length) {
    lines.push('', '## 권장 다음 조치 (우선순위)', '');
    for (const i of learning.recommendedNext) {
      lines.push(`1. ${i.action} — ${i.message}`);
    }
  }

  if (planetEconomyMd.trim()) {
    lines.push('', '---', '', planetEconomyMd.trim());
  }

  lines.push('', '## 타임라인', '', `- CSV: \`${path.relative(ROOT, TIMELINE_CSV).replace(/\\/g, '/')}\``);
  lines.push(`- 학습 상태: \`${path.relative(ROOT, LEARNING_JSON).replace(/\\/g, '/')}\``);
  lines.push(`- 스냅샷 수: ${learning.snapshots.length}`, '');

  const md = lines.join('\n');
  fs.writeFileSync(REPORT_MD, md, 'utf8');

  const dayDir = path.join(REPORT_DIR, timestamp.slice(0, 10));
  fs.mkdirSync(dayDir, { recursive: true });
  fs.writeFileSync(path.join(dayDir, `audit-${timestamp.replace(/[:.]/g, '-')}.md`), md, 'utf8');

  console.log(md.split('\n').slice(0, 12).join('\n'));
  if (snapshot.overall === 'FAIL') process.exitCode = 1;
}

main();
