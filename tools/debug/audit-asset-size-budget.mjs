/**
 * 설치 용량 예산 감사 — assets/images 전수 스캔.
 * 정본: tables/content/asset_size_budget_policy.csv (카테고리별 warnKb/hardCapKb)
 * hardCap 초과만 FAIL(exit 1). warn 초과는 리포트에만 표시(기존 콘텐츠 즉시 실패 방지).
 * 재현: node tools/debug/audit-asset-size-budget.mjs
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');
const ASSETS_DIR = path.join(ROOT, 'assets', 'images');
const POLICY_PATH = path.join(ROOT, 'tables', 'content', 'asset_size_budget_policy.csv');
const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp']);

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
      } else {
        field += ch;
      }
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
      if (row.some((c) => String(c).trim() !== '')) rows.push(row);
      field = '';
      row = [];
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }
  if (field.length || row.length) {
    row.push(field);
    if (row.some((c) => String(c).trim() !== '')) rows.push(row);
  }
  return rows;
}

function loadPolicy() {
  if (!existsSync(POLICY_PATH)) {
    console.error(`FAIL missing policy: ${POLICY_PATH}`);
    process.exit(1);
  }
  const raw = readFileSync(POLICY_PATH, 'utf8').replace(new RegExp('^﻿'), '');
  const matrix = parseCsv(raw);
  const headers = matrix[0].map((h) => h.trim());
  return matrix.slice(1).map((cells) => {
    const o = {};
    headers.forEach((h, idx) => {
      o[h] = (cells[idx] ?? '').trim();
    });
    return {
      category: o.category,
      pathPrefix: o.pathPrefix.replace(/\\/g, '/'),
      warnBytes: Number(o.warnKb) * 1024,
      hardCapBytes: Number(o.hardCapKb) * 1024,
      note: o.note ?? '',
    };
  });
}

/** 가장 긴(가장 구체적인) pathPrefix 매치 — misc는 최후 폴백 */
function resolveCategory(relPath, policy) {
  let best = null;
  for (const row of policy) {
    if (!relPath.startsWith(row.pathPrefix)) continue;
    if (!best || row.pathPrefix.length > best.pathPrefix.length) best = row;
  }
  return best;
}

function walkImages(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walkImages(p, acc);
    } else if (IMAGE_EXT.has(path.extname(ent.name).toLowerCase())) {
      acc.push(p);
    }
  }
  return acc;
}

function fmtKb(bytes) {
  return `${Math.round(bytes / 1024)}KB`;
}

function main() {
  const policy = loadPolicy();
  const files = walkImages(ASSETS_DIR);

  const byCategory = new Map();
  const warns = [];
  const fails = [];
  let totalBytes = 0;

  for (const abs of files) {
    const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
    const size = statSync(abs).size;
    totalBytes += size;

    const cat = resolveCategory(rel, policy);
    const catKey = cat?.category ?? 'uncategorized';
    const agg = byCategory.get(catKey) ?? { count: 0, bytes: 0 };
    agg.count += 1;
    agg.bytes += size;
    byCategory.set(catKey, agg);

    if (!cat) continue;
    if (size > cat.hardCapBytes) {
      fails.push({ rel, size, cat });
    } else if (size > cat.warnBytes) {
      warns.push({ rel, size, cat });
    }
  }

  console.log('# 에셋 설치 용량 예산 감사\n');
  console.log(`총 이미지: ${files.length}개 · ${fmtKb(totalBytes)} (${(totalBytes / 1024 / 1024).toFixed(1)}MB)\n`);

  console.log('## 카테고리별');
  for (const [cat, agg] of [...byCategory.entries()].sort((a, b) => b[1].bytes - a[1].bytes)) {
    console.log(`- ${cat}: ${agg.count}개 · ${fmtKb(agg.bytes)}`);
  }

  if (warns.length > 0) {
    console.log(`\n## WARN — 권장 용량 초과 (${warns.length}건, 즉시 실패 아님)`);
    for (const w of warns.slice(0, 30)) {
      console.log(`- ${w.rel} : ${fmtKb(w.size)} > warn ${fmtKb(w.cat.warnBytes)} (${w.cat.category})`);
    }
    if (warns.length > 30) console.log(`  ... 외 ${warns.length - 30}건`);
  }

  if (fails.length > 0) {
    console.log(`\n## FAIL — 하드캡 초과 (${fails.length}건)`);
    for (const f of fails) {
      console.log(`- ${f.rel} : ${fmtKb(f.size)} > hardCap ${fmtKb(f.cat.hardCapBytes)} (${f.cat.category})`);
    }
    console.log('\nFAIL — 하드캡 초과 파일이 있습니다. 표시 크기에 맞춰 압축/리사이즈하거나 정책(csv) 재확인 필요.');
    process.exit(1);
  }

  console.log('\nPASS — 하드캡 초과 없음.');
}

main();
