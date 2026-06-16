/**
 * 전 행성 PGP 순위 (CSV 시드 또는 --runtime JSON 경로)
 * npx tsx tools/session-stability-watch/print-planet-pgp-rank.ts
 */
import fs from 'node:fs';
import { calculatePlanetPgpFromStats } from '../../src/world/planetPgpModel';
import { useWorldStore } from '../../src/store/worldStore';
import { planetCsvBaselineToRuntime } from '../../src/store/planetCoreRuntimeStore';
import type { PlanetCoreRuntime } from '../../src/store/planetCoreRuntimeStore';

type Row = {
  rank: number;
  planetId: string;
  nameKo: string;
  systemName: string;
  pgpBmu: number;
  R: number;
  P: number;
  D: number;
  T: number;
  E: number;
  source: 'csv_seed' | 'runtime';
};

function loadRuntimeFromArg(): Record<string, PlanetCoreRuntime> | null {
  const arg = process.argv.find((a) => a.startsWith('--runtime='));
  if (!arg) return null;
  const path = arg.slice('--runtime='.length);
  const raw = JSON.parse(fs.readFileSync(path, 'utf8')) as {
    byPlanetId?: Record<string, PlanetCoreRuntime>;
  };
  return raw.byPlanetId ?? null;
}

const runtimeBag = loadRuntimeFromArg();
const rows: Row[] = [];

for (const sys of Object.values(useWorldStore.getState().systems)) {
  for (const planet of sys.planets) {
    const stored = runtimeBag?.[planet.id];
    const core = stored ?? planetCsvBaselineToRuntime(planet);
    rows.push({
      rank: 0,
      planetId: planet.id,
      nameKo: planet.name,
      systemName: sys.name,
      pgpBmu: calculatePlanetPgpFromStats({
        resource: core.resource,
        population: core.population,
        defense: core.defense,
        technology: core.technology,
        environment: core.environment,
      }),
      R: core.resource,
      P: core.population,
      D: core.defense,
      T: core.technology,
      E: core.environment,
      source: stored ? 'runtime' : 'csv_seed',
    });
  }
}

rows.sort((a, b) => b.pgpBmu - a.pgpBmu || a.nameKo.localeCompare(b.nameKo, 'ko'));

let prevPgp = -1;
let rank = 0;
for (let i = 0; i < rows.length; i++) {
  if (rows[i].pgpBmu !== prevPgp) {
    rank = i + 1;
    prevPgp = rows[i].pgpBmu;
  }
  rows[i].rank = rank;
}

console.log(`\n=== 행성 PGP 순위 (${runtimeBag ? 'runtime' : 'CSV 시드'}) · ${rows.length}행성 ===\n`);
console.log('순위 | PGP(BMU) | 행성 | 성계 | R P D T E | 출처');
console.log('-----|----------|------|------|-----------|------');
for (const r of rows) {
  const stats = `${String(r.R).padStart(2)} ${String(r.P).padStart(2)} ${String(r.D).padStart(2)} ${String(r.T).padStart(2)} ${String(r.E).padStart(2)}`;
  console.log(
    `${String(r.rank).padStart(4)} | ${r.pgpBmu.toLocaleString('ko-KR').padStart(8)} | ${r.nameKo} | ${r.systemName} | ${stats} | ${r.source}`,
  );
}
