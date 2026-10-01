import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const errs = [];
const allKeys = new Set();
let total = 0;
for (let i = 1; i <= 4; i += 1) {
  const batch = JSON.parse(readFileSync(resolve(ROOT, `tools/content-tables/_naturalness-batch-${i}.json`), 'utf8'));
  const raw = JSON.parse(readFileSync(resolve(ROOT, `tools/content-tables/_naturalness-patch-b${i}.json`), 'utf8'));
  const p = Array.isArray(raw) ? raw : raw.items || [];
  const b = new Set(batch.items.map((x) => x.key));
  if (p.length !== b.size) errs.push(`b${i} count ${p.length} vs ${b.size}`);
  for (const it of p) {
    total += 1;
    if (allKeys.has(it.key)) errs.push(`dup ${it.key}`);
    allKeys.add(it.key);
    if (!b.has(it.key)) errs.push(`extra ${it.key}`);
    const lines = String(it.text || '').split('\n');
    if (lines.length > 3) errs.push(`${it.key} lines ${lines.length}`);
    lines.forEach((ln, li) => {
      const n = Array.from(ln).length;
      if (n > 21) errs.push(`${it.key} L${li + 1} ${n} ${ln}`);
    });
    if ((it.text || '').includes('"') || (it.text_en || '').includes('"')) errs.push(`${it.key} quote`);
    if (!it.text_en) errs.push(`${it.key} no en`);
  }
  for (const k of b) {
    if (!p.some((x) => x.key === k)) errs.push(`missing ${k}`);
  }
}
console.log(JSON.stringify({ total, unique: allKeys.size, errCount: errs.length, errs: errs.slice(0, 50) }, null, 2));
if (errs.length) process.exit(2);
