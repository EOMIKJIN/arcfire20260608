#!/usr/bin/env node
/**
 * 행성별 유지비·무역 수수료 3h 전수 검사
 * node tools/planet-economy-3h-audit/run-planet-economy-3h-audit.cjs
 */
'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const REPORT_DIR = path.join(__dirname, 'reports');
const SNAPSHOT_JSON = path.join(REPORT_DIR, 'planet-economy-snapshot.json');
const TIMELINE_CSV = path.join(REPORT_DIR, 'planet-economy-timeline.csv');
const LATEST_MD = path.join(REPORT_DIR, 'latest.md');

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

function parseCsv(text) {
  const rows = [];
  let i = 0;
  let field = '';
  let row = [];
  let inQuotes = false;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
      } else field += ch;
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ',') {
      row.push(field);
      field = '';
      i += 1;
      continue;
    }
    if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function loadCsv(rel) {
  const raw = readText(path.join(ROOT, rel)).trim();
  const rows = parseCsv(raw);
  const header = rows[0].map((h) => String(h).replace(/^\uFEFF/, ''));
  return rows.slice(1).map((cols) => {
    const out = {};
    for (let i = 0; i < header.length; i += 1) out[header[i]] = cols[i] ?? '';
    return out;
  });
}

function runConvoyHeadlessSim() {
  const proc = spawnSync('npx', ['tsx', 'tools/planet-economy-3h-audit/convoy-headless-sim.ts'], {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    env: { ...process.env, ARCFIRE_HEADLESS_ECONOMY_AUDIT: '1' },
    maxBuffer: 16 * 1024 * 1024,
  });
  if (proc.status !== 0) {
    return { ok: false, error: proc.stderr || proc.stdout || 'convoy sim failed' };
  }
  const line = proc.stdout.trim().split(/\r?\n/).pop();
  try {
    return { ok: true, data: JSON.parse(line) };
  } catch {
    return { ok: false, error: 'invalid json from convoy sim' };
  }
}

function computeUpkeepProjection() {
  const policyRows = loadCsv('tables/balance/arc_core_planet_upkeep_policy.csv');
  const kv = {};
  for (const row of policyRows) kv[row.key] = row.value;
  const base = Number(kv.upkeep_base_credits) || 200;
  const perPop = Number(kv.upkeep_per_population_credit) || 12;
  const occupation = loadCsv('tables/balance/planet_occupation_seeds.csv');
  const tradeProfiles = loadCsv('tables/balance/planet_trade_route_profile.csv');
  const planetsCsv = loadCsv('tables/content/planets.csv');

  const popByPlanet = new Map();
  for (const p of planetsCsv) {
    const pop = Number(p.corePopulation);
    popByPlanet.set(p.id, Number.isFinite(pop) ? pop : 50);
  }

  const upkeepByPlanet = {};
  let redDailyTotal = 0;
  let blueDailyTotal = 0;
  const ownerByPlanet = {};

  for (const row of occupation) {
    const owner = String(row.initialOwner || '').trim().toUpperCase();
    ownerByPlanet[row.planetId] = owner;
    const pop = popByPlanet.get(row.planetId) ?? 50;
    const daily = base + perPop * pop;
    upkeepByPlanet[row.planetId] = { owner, population: pop, upkeepDaily: daily };
    if (owner === 'RED') redDailyTotal += daily;
    if (owner === 'BLUE') blueDailyTotal += daily;
  }

  return {
    base,
    perPop,
    tradePlanetCount: tradeProfiles.length,
    upkeepByPlanet,
    redDailyTotal,
    blueDailyTotal,
    occupiedPlanetCount: occupation.length,
  };
}

function diagnoseZero(planetId, row, convoyRan, kstDayKey) {
  return [
    `KST ${kstDayKey} ledger에서 수익 0`,
    convoyRan
      ? '헤드리스 convoy 배치 후에도 0 → 당일 해당 행성 convoy/플레이어 거래 미기록'
      : 'convoy_daily_coverage 비활성',
    '실기기 0: 12:00 KST 전·앱 미실행·무역 없음·AsyncStorage ledger 미갱신',
    `행성 ${planetId}`,
  ].join('; ');
}

function buildReport(sim, upkeep, prev) {
  const timestamp = new Date().toISOString();
  const planets = sim.planets.map((p) => {
    const up = upkeep.upkeepByPlanet[p.planetId];
    const revenueOk =
      p.arcFeeCredits > 0 || p.convoyFeeCredits > 0 || p.playerTradeFeeCredits > 0;
    return {
      ...p,
      upkeepExpectedDaily: up?.upkeepDaily ?? null,
      occupierSeed: up?.owner ?? '—',
      revenueOk,
      zeroReason: revenueOk ? '' : diagnoseZero(p.planetId, p, sim.convoyDaily.ran, sim.kstDayKey),
    };
  });

  const withRevenue = planets.filter((p) => p.revenueOk).length;
  const zeroRevenue = planets.length - withRevenue;
  let overall = 'PASS';
  if (!sim.convoyDaily.ran || sim.convoyDaily.supplyRoundTripsFailed > 0) overall = 'WARN';
  if (withRevenue === 0) overall = 'FAIL';

  const snapshot = {
    timestamp,
    kstDayKey: sim.kstDayKey,
    overall,
    convoyDaily: sim.convoyDaily,
    fleetBankBalance: sim.fleetBankBalance,
    arcVaultDelta: sim.arcVaultDelta,
    blueVaultDelta: sim.blueVaultDelta,
    arcVaultBalance: sim.arcVaultBalance,
    blueVaultBalance: sim.blueVaultBalance,
    upkeepProjection: upkeep,
    tradePlanetsWithRevenue: withRevenue,
    tradePlanetsZeroRevenue: zeroRevenue,
    planets,
  };

  const lines = [
    '# 행성 경제 3h 전수 검사',
    '',
    `Generated: ${timestamp}`,
    `KST day: ${sim.kstDayKey}`,
    `**Overall:** ${overall}`,
    '',
    '## 시스템 동작 (헤드리스 convoy + CSV 유지비 예측)',
    '',
    `- Convoy 일일: ran=${sim.convoyDaily.ran} ok=${sim.convoyDaily.supplyRoundTripsOk} fail=${sim.convoyDaily.supplyRoundTripsFailed} demandCovered=${sim.convoyDaily.demandPlanetsCovered}`,
    `- 수송선단 금고: ${sim.fleetBankBalance.toLocaleString('ko-KR')} cr`,
    `- RED 금고 Δ(수수료·헤드리스): ${sim.arcVaultDelta.toLocaleString('ko-KR')} cr`,
  ];

  if (sim.convoyDaily.failedPlanetIds?.length) {
    lines.push(`- Convoy 실패: ${sim.convoyDaily.failedPlanetIds.join(', ')}`);
  }

  lines.push(
    `- 유지비 예측(점유 시드): RED 일합 ${upkeep.redDailyTotal} cr · BLUE 일합 ${upkeep.blueDailyTotal} cr · 점유 ${upkeep.occupiedPlanetCount}행성`,
    `- 교역 행성 수익 발생: ${withRevenue}/${planets.length}`,
    '',
    '## 행성별 (교역 17)',
    '',
    '| 행성 | 점유시드 | 유지비(일) | 팩션수수료 | convoy수수료 | 플레이어수수료 | 상태 |',
    '|------|---------|-----------|----------|-------------|--------------|------|',
  );

  for (const p of planets) {
    lines.push(
      `| ${p.planetId} | ${p.occupierSeed} | ${p.upkeepExpectedDaily ?? '—'} | ${p.arcFeeCredits} | ${p.convoyFeeCredits ?? 0} | ${p.playerTradeFeeCredits ?? 0} | ${p.revenueOk ? 'OK' : '**0**'} |`,
    );
  }

  const zeros = planets.filter((p) => !p.revenueOk);
  if (zeros.length) {
    lines.push('', '## 수익 0 — 원인', '');
    for (const p of zeros) lines.push(`- **${p.planetId}**: ${p.zeroReason}`);
  }

  if (prev) {
    const feeDelta = planets.reduce((sum, p) => {
      const old = prev.planets?.find((x) => x.planetId === p.planetId);
      return sum + (p.arcFeeCredits - (old?.arcFeeCredits ?? 0));
    }, 0);
    lines.push('', '## 3h 델타', '', `- 이전: ${prev.timestamp}`, `- 팩션 수수료 합계 Δ: ${feeDelta} cr`);
    if (feeDelta === 0 && withRevenue === prev.tradePlanetsWithRevenue) {
      lines.push(
        '- **정체**: 동일 KST 일자 재실행·실기기 무거래·12:00 KST 배치 전이면 정상. 앱 실행·무역·배치 후 재확인.',
      );
    }
  }

  lines.push(
    '',
    '## 실기기 행성정보 팝업',
    '',
    '- `금일 팩션 몫` = AsyncStorage `arcfire_planet_trade_fee_ledger_v1`',
    '- 즉시: 플레이어/수송선 거래 · 12:00 KST: 일일 convoy+유지비 배치',
    '',
  );

  return { snapshot, md: lines.join('\n') };
}

function appendTimeline(snapshot) {
  const header =
    'timestamp,kstDayKey,overall,tradeWithRevenue,tradeZero,convoyOk,convoyFail,arcVaultDelta,redUpkeepProj,blueUpkeepProj';
  const row = [
    snapshot.timestamp,
    snapshot.kstDayKey,
    snapshot.overall,
    snapshot.tradePlanetsWithRevenue,
    snapshot.tradePlanetsZeroRevenue,
    snapshot.convoyDaily.supplyRoundTripsOk,
    snapshot.convoyDaily.supplyRoundTripsFailed,
    snapshot.arcVaultDelta,
    snapshot.upkeepProjection.redDailyTotal,
    snapshot.upkeepProjection.blueDailyTotal,
  ].join(',');
  if (!fs.existsSync(TIMELINE_CSV)) {
    fs.writeFileSync(TIMELINE_CSV, `${header}\n${row}\n`, 'utf8');
    return;
  }
  fs.appendFileSync(TIMELINE_CSV, `${row}\n`, 'utf8');
}

function main() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const prev = readJson(SNAPSHOT_JSON, null);
  const upkeep = computeUpkeepProjection();
  const simResult = runConvoyHeadlessSim();

  if (!simResult.ok) {
    const errMd = `# 행성 경제 3h 검사 FAIL\n\n${simResult.error}\n`;
    fs.writeFileSync(LATEST_MD, errMd, 'utf8');
    console.error(simResult.error);
    process.exitCode = 1;
    return;
  }

  const { snapshot, md } = buildReport(simResult.data, upkeep, prev);
  fs.writeFileSync(SNAPSHOT_JSON, JSON.stringify(snapshot, null, 2), 'utf8');
  fs.writeFileSync(LATEST_MD, md, 'utf8');
  const dayDir = path.join(REPORT_DIR, snapshot.timestamp.slice(0, 10));
  fs.mkdirSync(dayDir, { recursive: true });
  fs.writeFileSync(
    path.join(dayDir, `audit-${snapshot.timestamp.replace(/[:.]/g, '-')}.md`),
    md,
    'utf8',
  );
  appendTimeline(snapshot);
  console.log(md.split('\n').slice(0, 22).join('\n'));
  if (snapshot.overall === 'FAIL') process.exitCode = 1;
}

main();
