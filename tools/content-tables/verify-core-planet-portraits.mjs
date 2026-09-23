import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const mapSrc = readFileSync(resolve(ROOT, 'src/game/planetInfoPortraitAssets.ts'), 'utf8');
const csv = readFileSync(resolve(ROOT, 'tables/content/planets.csv'), 'utf8');
const keys = [...mapSrc.matchAll(/'(assets\/images\/planet\/pip_[^']+)'/g)].map((m) => m[1]);
const uniq = [...new Set(keys)];
let missing = 0;
let bytes = 0;
for (const key of uniq) {
  const path = resolve(ROOT, key);
  if (!existsSync(path)) {
    console.log(`MISSING ${key}`);
    missing += 1;
    continue;
  }
  bytes += statSync(path).size;
}
const csvCore = [...csv.matchAll(/assets\/images\/planet\/pip_core_[a-z0-9_]+\.jpg/g)];
const leftover = readdirSync(resolve(ROOT, 'assets/images/planet')).filter(
  (name) => /^pip_00[123]\.png$/.test(name) || name === 'pip_synth_052.png',
);
console.log(
  JSON.stringify({
    requireKeys: uniq.length,
    csvCore: csvCore.length,
    missing,
    bundleKb: Number((bytes / 1024).toFixed(1)),
    discardedLeft: leftover,
  }),
);
if (missing > 0 || leftover.length > 0 || csvCore.length !== 21) process.exit(1);
