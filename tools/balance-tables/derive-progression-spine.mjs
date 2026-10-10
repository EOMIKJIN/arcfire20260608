#!/usr/bin/env node
/**
 * 진행 기준축(progression spine) — 레벨 = 들인 플레이 시간 (대표님 승인 2026-10-10)
 *
 * 입력(정본 테이블):
 *   level_band_targets.csv            — 레벨당 목표 분(시간축)
 *   planet_leveling_progression.csv   — 존별 목표 수입(돈축)
 *   capital_hull_purchase_policy.csv  — 함선 사다리(ladderListed · ladderStep · targetPurchaseLevel)
 *   progression_ladder_policy.csv     — 가격 규칙(본 등급 60% · 반 단계 25%)
 *   mineral_upgrade_level_caps.csv · item_defs.csv — 강화 상한 · 장비 등급(표시용)
 * 출력:
 *   progression_spine.csv              — 레벨 1~60 기준축
 *   capital_hull_purchase_policy.csv   — purchaseCredits 를 규칙으로 갱신(사다리 등급만)
 *
 * npm run balance:progression-spine
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const BAL = (n) => resolve(ROOT, 'tables', 'balance', n);
const CON = (n) => resolve(ROOT, 'tables', 'content', n);

function parseCsv(text) {
  const R = []; let r = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true; else if (c === ',') { r.push(f); f = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; r.push(f); f = ''; R.push(r); r = []; }
    else f += c;
  }
  if (f || r.length) { r.push(f); R.push(r); }
  return R.filter((x) => x.length > 1 || x[0] !== '');
}
function load(path) {
  const R = parseCsv(readFileSync(path, 'utf8').replace(/^﻿/, ''));
  const h = R[0];
  return { header: h, rows: R.slice(1).map((r) => Object.fromEntries(h.map((k, i) => [k, r[i] ?? '']))) };
}
const num = (v, d = 0) => { const n = Number(v); return Number.isFinite(n) ? n : d; };

const MAX_LEVEL = load(CON('player_level_exp.csv')).rows.reduce((m, r) => Math.max(m, num(r.level)), 1);
const policy = new Map(load(BAL('progression_ladder_policy.csv')).rows.map((r) => [r.key, num(r.value, NaN)]));
const P = (k) => { const v = policy.get(k); if (!Number.isFinite(v)) throw new Error(`progression_ladder_policy.csv ${k} 없음`); return v; };

// ── 시간축: 레벨 L 도달 누적 시간(h) = Σ(1..L-1) 레벨당 목표 분 ─────────────────
const bands = load(BAL('level_band_targets.csv')).rows;
function minutesForLevel(lv) {
  const b = bands.find((x) => lv >= num(x.minLevel) && lv <= num(x.maxLevel));
  return b ? num(b.targetMinutesPerLevel) : num(bands[bands.length - 1].targetMinutesPerLevel);
}
const cumHours = [0, 0];
for (let lv = 2; lv <= MAX_LEVEL; lv++) cumHours[lv] = cumHours[lv - 1] + minutesForLevel(lv - 1) / 60;

// ── 돈축: 존 목표 수입을 그 존 레벨 구간에 고르게 · 레벨 L 도달 누적 수입 ─────────
const zones = load(BAL('planet_leveling_progression.csv')).rows
  .map((z) => ({ lv: num(z.recommendedPilotLevel, 1), credits: num(z.targetCreditsEarned) }))
  .sort((a, b) => a.lv - b.lv);
const earnAtLevel = new Array(MAX_LEVEL + 2).fill(0); // 레벨 lv 에 머무는 동안 버는 목표 수입
for (let i = 0; i < zones.length; i++) {
  const from = zones[i].lv;
  const to = i + 1 < zones.length ? Math.max(from, zones[i + 1].lv - 1) : MAX_LEVEL;
  if (i + 1 < zones.length && zones[i + 1].lv === from) continue; // 같은 레벨 중복 존(z21)
  const span = to - from + 1;
  for (let lv = from; lv <= to; lv++) earnAtLevel[lv] += zones[i].credits / span;
}
const cumCredits = [0, 0];
for (let lv = 2; lv <= MAX_LEVEL; lv++) cumCredits[lv] = cumCredits[lv - 1] + earnAtLevel[lv - 1];
const between = (a, b) => cumCredits[Math.min(MAX_LEVEL, b)] - cumCredits[Math.min(MAX_LEVEL, a)];

// ── 함선 사다리 · 가격 규칙 ────────────────────────────────────────────
const hullFile = BAL('capital_hull_purchase_policy.csv');
const hull = load(hullFile);
const ladder = hull.rows
  .filter((r) => r.ladderListed === 'TRUE' && r.ladderStep !== '')
  .map((r) => ({ key: r.hullTierKey, step: num(r.ladderStep), target: num(r.targetPurchaseLevel, 1), unlock: num(r.requiredPilotLevelMin, 1) }))
  .sort((a, b) => a.step - b.step);
for (const t of ladder) {
  if (t.unlock > MAX_LEVEL || t.target > MAX_LEVEL) throw new Error(`사다리 ${t.key} 요구 레벨이 최대 레벨 ${MAX_LEVEL} 초과`);
}
const round = P('hull_price_round_credits');
const priceByKey = new Map();
let prevMain = ladder[0];
for (const t of ladder) {
  if (t.step === 0) { priceByKey.set(t.key, 0); continue; }
  const isMain = Number.isInteger(t.step);
  const share = isMain ? P('hull_price_share_main') : P('hull_price_share_half');
  // 반 단계 = 직전 본 등급 가격 + 구간 수입 × 반 단계 비율(본 등급보다 싸지지 않게)
  const base = isMain ? 0 : (priceByKey.get(prevMain.key) ?? 0);
  const raw = base + between(prevMain.target, t.target) * share;
  priceByKey.set(t.key, Math.max(round, Math.round(raw / round) * round));
  if (isMain) prevMain = t;
}

// purchaseCredits 갱신(사다리 등급만 · 사다리 밖 행은 그대로)
const hullText = readFileSync(hullFile, 'utf8');
const nl = hullText.includes('\r\n') ? '\r\n' : '\n';
const hullLines = hullText.trimEnd().split(/\r?\n/);
const iKey = 0;
const iPrice = hull.header.indexOf('purchaseCredits');
const nextHull = hullLines.map((line, i) => {
  if (i === 0) return line;
  const c = line.split(',');
  if (priceByKey.has(c[iKey])) c[iPrice] = String(priceByKey.get(c[iKey]));
  return c.join(',');
});
writeFileSync(hullFile, nextHull.join(nl) + nl, 'utf8');

// ── 표시용: 강화 상한 · 장비 최고 등급 ─────────────────────────────────
const caps = load(CON('mineral_upgrade_level_caps.csv')).rows
  .map((r) => ({ lv: num(r.combatLevelMaxInclusive), cap: num(r.maxUpgradeLevel) }))
  .sort((a, b) => a.lv - b.lv);
const capFor = (lv) => (caps.find((c) => lv <= c.lv) ?? caps[caps.length - 1]).cap;
const equipReq = load(CON('item_defs.csv')).rows
  .filter((r) => r.type === 'ship_equipment' && r.tradeable === 'true')
  .map((r) => { const a = JSON.parse(r.attrsJson || '{}'); return { lv: num(a.equipmentRequiredLevel, 1), g: num(a.equipmentGrade, 1) }; });
const gradeFor = (lv) => equipReq.filter((e) => e.lv <= lv).reduce((m, e) => Math.max(m, e.g), 0);
const hullFor = (lv) => ladder.filter((t) => t.target <= lv).slice(-1)[0]?.key ?? ladder[0].key;

const out = ['level,targetCumHours,targetCreditsPerHour,targetCumCredits,hullTierKey,mineralUpgradeCap,equipmentGradeMax,notesKo'];
for (let lv = 1; lv <= MAX_LEVEL; lv++) {
  const perHour = Math.round(earnAtLevel[lv] / Math.max(1e-6, minutesForLevel(lv) / 60));
  const note = ladder.find((t) => t.target === lv && t.step > 0) ? `함선 목표 구매 ${ladder.find((t) => t.target === lv).key}` : '';
  out.push([lv, cumHours[lv].toFixed(2), perHour, Math.round(cumCredits[lv]), hullFor(lv), capFor(lv), gradeFor(lv), note].join(','));
}
writeFileSync(BAL('progression_spine.csv'), out.join('\n') + '\n', 'utf8');

// planet_leveling_progression.csv recommendedHullTierKey ← 기준축(존 추천 레벨에서 「맞는」 함선)
{
  const path = BAL('planet_leveling_progression.csv');
  const text = readFileSync(path, 'utf8');
  const lnl = text.includes('\r\n') ? '\r\n' : '\n';
  const lines = text.trimEnd().split(/\r?\n/);
  const header = parseCsv(lines[0].replace(/^﻿/, ''))[0];
  const iLv = header.indexOf('recommendedPilotLevel');
  const iHull = header.indexOf('recommendedHullTierKey');
  const esc = (s) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  let changed = 0;
  const next = lines.map((line, i) => {
    if (i === 0) return line;
    const cols = parseCsv(line)[0];
    const want = hullFor(num(cols[iLv], 1));
    if (cols[iHull] === want) return line;
    cols[iHull] = want;
    changed += 1;
    return cols.map(esc).join(',');
  });
  writeFileSync(path, next.join(lnl) + lnl, 'utf8');
  console.log(`[progression-spine] planet_leveling recommendedHullTierKey ${changed}행 정렬`);
}

console.log('[progression-spine] hull prices:');
for (const t of ladder) console.log(`  ${t.key} step${t.step} unlock L${t.unlock} target L${t.target} (${cumHours[t.target].toFixed(1)}h) → ${priceByKey.get(t.key)}cr`);
