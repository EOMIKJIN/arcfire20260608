#!/usr/bin/env node
/** AGDS §2 — audit logic_input 기반 dynamic_overlay.csv 패치 (정본 CSV는 수정하지 않음) */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const LOGIC = path.join(ROOT, 'tools/balance-audit/reports/logic_input.json');
const OVERLAY = path.join(ROOT, 'tables/balance/dynamic_overlay.csv');

if (!fs.existsSync(LOGIC)) {
  console.error('Missing logic_input.json — run npm run audit:balance first');
  process.exitCode = 1;
  process.exit();
}

const input = JSON.parse(fs.readFileSync(LOGIC, 'utf8'));
const header = 'key,multiplier,source,updatedAt';
const now = new Date().toISOString();
const keys = ['expReward', 'creditReward', 'tradeIncome', 'dropWeight', 'miningYield', 'combatDifficulty'];

const existing = {};
if (fs.existsSync(OVERLAY)) {
  const lines = fs.readFileSync(OVERLAY, 'utf8').trim().split(/\r?\n/);
  for (let i = 1; i < lines.length; i += 1) {
    const [key, mul] = lines[i].split(',');
    if (key) existing[key.trim()] = mul?.trim() || '1';
  }
}

const rows = keys.map((key) => {
  let mul = Number(existing[key] ?? 1);
  const drift = (input.drifts ?? []).find((d) => String(d.key).includes('exp') && key === 'expReward');
  if (drift && drift.gapPercent < -10) mul = Math.min(1.15, mul * 1.03);
  if (drift && drift.gapPercent > 10) mul = Math.max(0.85, mul * 0.97);
  return `${key},${mul.toFixed(3)},aabs_agds,${now}`;
});

fs.writeFileSync(OVERLAY, [header, ...rows].join('\n') + '\n', 'utf8');
console.log(`Patched ${OVERLAY}`);
