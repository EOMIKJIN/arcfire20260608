// 두 .heapsnapshot 의 constructor(이름)별 개수·self size 차이 상위 — 김플레이 2026-10-09
// 사용: node tools/play-bot-console/soak/heap-snapshot-diff.cjs <a.heapsnapshot> <b.heapsnapshot> [topN]
'use strict';

const fs = require('fs');

function summarize(path) {
  const snap = JSON.parse(fs.readFileSync(path, 'utf8'));
  const meta = snap.snapshot.meta;
  const fields = meta.node_fields;
  const stride = fields.length;
  const typeIdx = fields.indexOf('type');
  const nameIdx = fields.indexOf('name');
  const sizeIdx = fields.indexOf('self_size');
  const types = meta.node_types[typeIdx];
  const nodes = snap.nodes;
  const strings = snap.strings;
  const byKey = new Map();
  let total = 0;
  for (let i = 0; i < nodes.length; i += stride) {
    const type = types[nodes[i + typeIdx]];
    let name = strings[nodes[i + nameIdx]] ?? '';
    // 문자열은 내용별로 쪼개면 수천 개가 된다 → 길이 묶음만
    if (type === 'string' || type === 'concatenated string' || type === 'sliced string') {
      name = `(string len~${Math.min(1000, Math.round(name.length / 10) * 10)})`;
    }
    const key = `${type}:${name}`;
    const size = nodes[i + sizeIdx];
    total += size;
    const cur = byKey.get(key) ?? { count: 0, size: 0 };
    cur.count += 1;
    cur.size += size;
    byKey.set(key, cur);
  }
  return { byKey, total, nodeCount: nodes.length / stride };
}

const [a, b, topRaw] = process.argv.slice(2);
if (!a || !b) {
  console.error('usage: heap-snapshot-diff.cjs <a> <b> [topN]');
  process.exit(2);
}
const top = Number(topRaw) || 30;
const A = summarize(a);
const B = summarize(b);
console.log(`A nodes=${A.nodeCount} self=${(A.total / 1048576).toFixed(1)}MB`);
console.log(`B nodes=${B.nodeCount} self=${(B.total / 1048576).toFixed(1)}MB`);
const rows = [];
for (const [key, vb] of B.byKey) {
  const va = A.byKey.get(key) ?? { count: 0, size: 0 };
  rows.push({ key, dCount: vb.count - va.count, dSize: vb.size - va.size, bCount: vb.count, bSize: vb.size });
}
rows.sort((x, y) => y.dSize - x.dSize);
console.log('\nTop growth by self size:');
for (const r of rows.slice(0, top)) {
  console.log(`${(r.dSize / 1024).toFixed(0).padStart(8)}KB ${String(r.dCount).padStart(8)} cnt | now ${(r.bSize / 1024).toFixed(0)}KB/${r.bCount} | ${r.key.slice(0, 120)}`);
}
rows.sort((x, y) => y.dCount - x.dCount);
console.log('\nTop growth by count:');
for (const r of rows.slice(0, top)) {
  console.log(`${String(r.dCount).padStart(8)} cnt ${(r.dSize / 1024).toFixed(0).padStart(8)}KB | ${r.key.slice(0, 120)}`);
}
