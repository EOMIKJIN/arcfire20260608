/**
 * planets.csv systemConnectionsPipe → star_system_connections.csv 전량 동기화
 * (부분 오버라이드 함정 제거: 빌드가 star 행이 있으면 pipe를 무시함)
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const lines = readFileSync(resolve(root, 'tables/content/planets.csv'), 'utf8')
  .replace(/^\uFEFF/, '')
  .trim()
  .split(/\r?\n/);
const h = lines[0].split(',');
const ix = Object.fromEntries(h.map((x, i) => [x, i]));
const rows = ['systemId,connectedSystemId'];
for (const line of lines.slice(1)) {
  const c = line.split(',');
  const id = c[ix.systemId];
  const pipe = String(c[ix.systemConnectionsPipe] || '')
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const n of pipe) rows.push(`${id},${n}`);
}
const out = resolve(root, 'tables/content/star_system_connections.csv');
writeFileSync(out, rows.join('\n') + '\n', 'utf8');
console.log(`[sync-star-connections] wrote ${rows.length - 1} directed edges -> ${out}`);
