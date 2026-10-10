#!/usr/bin/env node
/**
 * 함선 장비 4·5등급 생성 (대표님 승인 2026-10-10 — L31~60 장비 절벽 메우기)
 * 규칙(값은 테이블에서):
 *   - 대상: item_defs.csv ship_equipment 중 3등급이 진열(tradeable)되는 계열
 *   - 효과값 = 1등급 효과값 × 등급 배율(1·1.5·2 다음 → 2.5·3)
 *   - 요구 레벨 = 3등급 요구 레벨 + 14(4등급) / + 28(5등급)  → L35~44 · L49~58
 *   - 가격 = progression_spine.csv 요구 레벨 ±5 구간 평균 시간당 수입 × progression_ladder_policy equipment_item_play_minutes ÷ 60
 * 이미 있는 4·5등급 행은 다시 만들지 않는다(멱등).
 * 2026-10-10 대표님 결정 5: 1~3등급 가격도 같은 규칙으로 정렬(진열 장비 전 등급 · 실행할 때마다 재계산).
 */
import { readFileSync, writeFileSync } from 'node:fs';

const ITEM = 'tables/content/item_defs.csv';
const SPINE = 'tables/balance/progression_spine.csv';
const POLICY = 'tables/balance/progression_ladder_policy.csv';
const GRADE = { 4: { mul: 2.5, lvAdd: 14 }, 5: { mul: 3, lvAdd: 28 } };
const META = new Set(['equipmentCategory', 'equipmentGrade', 'equipmentLineKey', 'equipmentSlot', 'equipmentRequiredLevel', 'equipmentPerformanceMul', 'effectPending', 'miningCycleTimeBonusPct']);

function parseLine(line) {
  const r = []; let f = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === '"') { if (line[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true; else if (c === ',') { r.push(f); f = ''; } else f += c;
  }
  r.push(f);
  return r;
}
const esc = (s) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
const kv = (path) => {
  const lines = readFileSync(path, 'utf8').replace(/^﻿/, '').trim().split(/\r?\n/);
  const h = parseLine(lines[0]);
  return lines.slice(1).map((l) => { const c = parseLine(l); return Object.fromEntries(h.map((k, i) => [k, c[i] ?? ''])); });
};
const minutes = Number(kv(POLICY).find((r) => r.key === 'equipment_item_play_minutes')?.value);
if (!Number.isFinite(minutes)) throw new Error('equipment_item_play_minutes 없음');
// 시간당 수입은 존 단위로 들쭉날쭉 → ±5레벨 구간 평균(누적 수입 ÷ 누적 시간)으로 매끈하게(등급 가격 역전 방지)
const spineRows = kv(SPINE).map((r) => ({ lv: Number(r.level), h: Number(r.targetCumHours), c: Number(r.targetCumCredits) }));
const maxLv = spineRows.reduce((m, r) => Math.max(m, r.lv), 1);
const at = (lv) => spineRows.find((r) => r.lv === Math.max(1, Math.min(maxLv, lv)));
const smoothRate = (lv) => {
  const a = at(lv - 5), b = at(lv + 5);
  const dh = b.h - a.h;
  return dh > 0 ? (b.c - a.c) / dh : 0;
};
// 레벨이 오르면 가격이 내려가지 않게 누적 최고치 사용(기준표 L11 시간축 4배 점프로 L11~20 시간당 수입이 낮아지는 불일치 · S2 보정 대상)
const perHour = new Map();
let runMax = 0;
for (let lv = 1; lv <= maxLv; lv++) { runMax = Math.max(runMax, smoothRate(lv)); perHour.set(lv, runMax); }

const text = readFileSync(ITEM, 'utf8');
const nl = text.includes('\r\n') ? '\r\n' : '\n';
const lines = text.split(nl);
const header = parseLine(lines[0].replace(/^﻿/, ''));
const I = Object.fromEntries(header.map((k, i) => [k, i]));
const rows = lines.map((l, i) => (i === 0 || !l ? null : parseLine(l)));
const byId = new Map(rows.filter(Boolean).map((c) => [c[I.id], c]));

const out = [];
let added = 0;
for (let li = 0; li < lines.length; li++) {
  out.push(lines[li]);
  const c = rows[li];
  if (!c || c[I.type] !== 'ship_equipment' || c[I.tradeable] !== 'true') continue;
  const a = JSON.parse(c[I.attrsJson] || '{}');
  if (Number(a.equipmentGrade) !== 3) continue;
  const line = a.equipmentLineKey;
  const g1 = byId.get(`${line}_1`);
  if (!g1) throw new Error(`${line}_1 없음`);
  const a1 = JSON.parse(g1[I.attrsJson]);
  const effectKeys = Object.keys(a1).filter((k) => !META.has(k) && typeof a1[k] === 'number');
  for (const g of [4, 5]) {
    const id = `${line}_${g}`;
    if (byId.has(id)) continue;
    const req = Number(a.equipmentRequiredLevel) + GRADE[g].lvAdd;
    const price = Math.max(1000, Math.round(((perHour.get(req) ?? 0) * minutes) / 60 / 1000) * 1000);
    const attrs = { ...a, equipmentGrade: g, equipmentRequiredLevel: req, equipmentPerformanceMul: GRADE[g].mul };
    for (const k of effectKeys) attrs[k] = Math.round(a1[k] * GRADE[g].mul * 10) / 10;
    const n = [...c];
    n[I.id] = id;
    n[I.name] = c[I.name].replace(/3$/, String(g));
    n[I.basePrice] = String(price);
    n[I.tagsPipe] = c[I.tagsPipe].replace('grade3', `grade${g}`);
    n[I.attrsJson] = JSON.stringify(attrs);
    if (I.name_en != null && n[I.name_en]) n[I.name_en] = n[I.name_en].replace(/3$/, String(g));
    out.push(n.map(esc).join(','));
    added += 1;
  }
}
// 등급 가격 정렬(대표님 결정 5 · 2026-10-10)
//   1등급 = 초반 설계 가격 그대로(기준점 · 초반 구매 게이트 · earlyHubCombatBalance.test)
//   4·5등급 = 요구 레벨 시간당 수입 × 분(규칙)
//   2·3등급 = 1등급 → 4등급 사이 등비로 고르게(3등급→4등급 가격 절벽 제거)
// 기준표 초반 수입(planet_leveling)과 초반 경제 설계(play_scenario_economy)가 어긋나 1등급은 규칙에서 뺀다 — S2 보정 대상.
const rulePrice = (req) => Math.max(1000, Math.round(((perHour.get(req) ?? 0) * minutes) / 60 / 1000) * 1000);
const rowIdx = new Map();
for (let li = 1; li < out.length; li++) {
  if (!out[li]) continue;
  const c = parseLine(out[li]);
  if (c[I.type] !== 'ship_equipment') continue;
  rowIdx.set(c[I.id], li);
}
let repriced = 0;
const setPrice = (id, price) => {
  const li = rowIdx.get(id);
  if (li == null) return;
  const c = parseLine(out[li]);
  if (c[I.tradeable] !== 'true' || String(price) === c[I.basePrice]) return;
  c[I.basePrice] = String(price);
  out[li] = c.map(esc).join(',');
  repriced += 1;
};
const priceOf = (id) => Number(parseLine(out[rowIdx.get(id)])[I.basePrice]);
const reqOf = (id) => Number(JSON.parse(parseLine(out[rowIdx.get(id)])[I.attrsJson] || '{}').equipmentRequiredLevel) || 1;
const lineKeys = new Set([...rowIdx.keys()].map((id) => id.replace(/_\d$/, '')));
for (const line of lineKeys) {
  if (!rowIdx.has(`${line}_1`) || !rowIdx.has(`${line}_4`)) continue;
  const p1 = priceOf(`${line}_1`);
  const p4 = rulePrice(reqOf(`${line}_4`));
  setPrice(`${line}_4`, p4);
  if (rowIdx.has(`${line}_5`)) setPrice(`${line}_5`, Math.max(p4, rulePrice(reqOf(`${line}_5`))));
  for (const g of [2, 3]) {
    if (!rowIdx.has(`${line}_${g}`)) continue;
    setPrice(`${line}_${g}`, Math.round((p1 * Math.pow(p4 / p1, (g - 1) / 3)) / 100) * 100);
  }
}writeFileSync(ITEM, out.join(nl), 'utf8');
console.log(`[equipment-high-grades] 가격 정렬 ${repriced}행`);
console.log(`[equipment-high-grades] 추가 ${added}행 (가격 = 요구 Lv 목표 시간당 수입 × ${minutes}분)`);
