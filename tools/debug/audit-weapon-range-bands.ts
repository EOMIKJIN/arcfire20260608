// 무기 사거리 분류 전수검사 (2026-07-22 대표님 기준안)
// 단거리 80~140 · 중거리 141~210(~175 목표) · 장거리 211~268(~240 목표)
import fs from 'node:fs';
import path from 'node:path';

const CSV = path.resolve(__dirname, '../../tables/content/weapon_list.csv');
const BANDS: Record<string, { min: number; max: number; targetAvg: number | null }> = {
  단거리: { min: 80, max: 140, targetAvg: null },
  중거리: { min: 141, max: 210, targetAvg: 175 },
  장거리: { min: 211, max: 268, targetAvg: 240 },
};

const lines = fs.readFileSync(CSV, 'utf8').split(/\r?\n/).filter((l) => l.trim());
const header = lines[0].split(',');
const idxId = header.indexOf('id');
const idxKind = header.indexOf('종류');
const idxRange = header.indexOf('사거리px');
const idxClass = header.indexOf('무기분류');
const idxLabel = header.indexOf('등급라벨');

type Row = { id: string; kind: string; range: number; cls: string; label: string };
const rows: Row[] = [];
for (const line of lines.slice(1)) {
  // 간이 파서 — 이 CSV는 따옴표 필드에 콤마가 있는 행(반물질)이 있어 주의
  const cells: string[] = [];
  let cur = '';
  let inQ = false;
  for (const ch of line) {
    if (ch === '"') inQ = !inQ;
    else if (ch === ',' && !inQ) {
      cells.push(cur);
      cur = '';
    } else cur += ch;
  }
  cells.push(cur);
  rows.push({
    id: cells[idxId],
    kind: cells[idxKind],
    range: Number(cells[idxRange]),
    cls: cells[idxClass],
    label: cells[idxLabel],
  });
}

console.log(`무기 총 ${rows.length}종\n`);
let mismatch = 0;
const byClass = new Map<string, number[]>();
const byClassFamily = new Map<string, number[]>();
for (const r of rows) {
  const band = BANDS[r.cls];
  if (!band) {
    console.log(`  ?? ${r.id} 무기분류='${r.cls}' — 기준안에 없는 분류`);
    mismatch++;
    continue;
  }
  if (!(byClass.get(r.cls))) byClass.set(r.cls, []);
  byClass.get(r.cls)!.push(r.range);
  const fk = `${r.cls}/${r.kind}`;
  if (!byClassFamily.get(fk)) byClassFamily.set(fk, []);
  byClassFamily.get(fk)!.push(r.range);
  if (r.range < band.min || r.range > band.max) {
    console.log(
      `  MISMATCH ${r.id.padEnd(26)} [${r.label}] ${r.cls} range=${r.range} (기준 ${band.min}~${band.max})`,
    );
    mismatch++;
  }
}

console.log(`\n분류-범위 불일치: ${mismatch}건`);
console.log('\n분류별 평균 (목표 대비):');
for (const [cls, arr] of byClass) {
  const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
  const t = BANDS[cls]?.targetAvg;
  console.log(
    `  ${cls}: ${arr.length}종 · min=${Math.min(...arr)} max=${Math.max(...arr)} avg=${avg.toFixed(1)}${t ? ` (목표 ~${t} · 편차 ${(avg - t).toFixed(1)})` : ''}`,
  );
}
console.log('\n분류×종류별 평균:');
for (const [k, arr] of [...byClassFamily.entries()].sort()) {
  const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
  console.log(`  ${k.padEnd(16)}: ${String(arr.length).padStart(2)}종 · avg=${avg.toFixed(1)} (${Math.min(...arr)}~${Math.max(...arr)})`);
}
