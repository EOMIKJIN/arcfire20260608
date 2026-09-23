/**
 * 허브 원반 베이크 에셋 삼각 동기 — 룩 정본 · generated require · PNG.
 * 런타임 메모리 계약: prewarm 미편입 · sample은 tools/test만.
 */
import fs from 'node:fs';
import path from 'node:path';
import { STAR_SYSTEMS_FROM_CSV } from '../../src/data/generated/csvSystems';
import { PLANET_GLOBE_LOOK_COLONIZED } from '../../src/data/generated/planetGlobeLookColonized';
import { PLANET_GLOBE_BAKED_PLANET_IDS } from '../../src/data/generated/planetGlobeBakedPlanetIds';
import { PLANET_GLOBE_LOOK_CANON } from '../../src/game/planetGlobeLookCanon';
import { listColonizedSynthPlanetTargets } from '../planet-globe-bake/listColonizedSynthPlanets';

const ROOT = path.resolve(__dirname, '../..');
const BAKED_DIR = path.join(ROOT, 'assets/images/planet/baked');
const REGISTRY = path.join(ROOT, 'src/data/generated/planetGlobeBakedAssets.ts');
const PREWARM = path.join(ROOT, 'src/assetPipeline/criticalSessionImageModules.ts');
const MAX_PNG_BYTES = 256 * 1024;

function fail(msg: string): never {
  console.error(`FAIL ${msg}`);
  process.exit(1);
}

function csvPlanetIds(): string[] {
  const ids: string[] = [];
  for (const sys of Object.values(STAR_SYSTEMS_FROM_CSV)) {
    for (const p of sys.planets) ids.push(p.id);
  }
  return ids;
}

function walkTs(dir: string, acc: string[] = []): string[] {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === 'generated') continue;
      walkTs(p, acc);
    } else if (/\.(ts|tsx)$/.test(ent.name)) acc.push(p);
  }
  return acc;
}

function main() {
  const canon = PLANET_GLOBE_LOOK_CANON.map((r) => r.planetId).sort();
  const csvIds = csvPlanetIds().sort();
  if (canon.join('|') !== csvIds.join('|')) {
    fail(`canon ≠ planets.csv\ncanon=${canon.join(',')}\ncsv=${csvIds.join(',')}`);
  }

  const { targets } = listColonizedSynthPlanetTargets();
  const scheduleIds = [...new Set(targets.map((t) => t.planetId))].sort();
  const colonizedIds = PLANET_GLOBE_LOOK_COLONIZED.map((r) => r.planetId).sort();
  if (colonizedIds.join('|') !== scheduleIds.join('|')) {
    fail(
      `colonized looks ≠ daily-unlock schedule\nlooks=${colonizedIds.join(',')}\nschedule=${scheduleIds.join(',')}`,
    );
  }
  const allIds = [...canon, ...colonizedIds].sort();
  const slimIds = [...PLANET_GLOBE_BAKED_PLANET_IDS].sort();
  if (slimIds.join('|') !== allIds.join('|')) {
    fail(`baked planet ids ≠ core+colonized\nids=${slimIds.join(',')}\nall=${allIds.join(',')}`);
  }

  const pngs = fs
    .readdirSync(BAKED_DIR)
    .filter((n) => n.endsWith('.png'))
    .map((n) => n.replace(/\.png$/, ''))
    .sort();
  if (pngs.join('|') !== allIds.join('|')) {
    fail(`PNG set ≠ core+colonized\npng=${pngs.join(',')}\nall=${allIds.join(',')}`);
  }

  const reg = fs.readFileSync(REGISTRY, 'utf8');
  const regIds = [...reg.matchAll(/"([a-z0-9_]+)": require\(/g)].map((m) => m[1]!).sort();
  if (regIds.join('|') !== allIds.join('|')) {
    fail(`generated require ≠ core+colonized\nreg=${regIds.join(',')}`);
  }

  let pngBytes = 0;
  for (const id of allIds) {
    const st = fs.statSync(path.join(BAKED_DIR, `${id}.png`));
    pngBytes += st.size;
    if (st.size > MAX_PNG_BYTES) fail(`${id}.png ${st.size} > ${MAX_PNG_BYTES}`);
    if (!reg.includes(`assets/images/planet/baked/${id}.png`)) {
      fail(`registry missing require path for ${id}`);
    }
  }

  const prewarm = fs.readFileSync(PREWARM, 'utf8');
  if (prewarm.includes('planet/baked') || prewarm.includes('planetGlobe')) {
    fail('globe bakes must not be in listCriticalSessionImageSources');
  }
  const continuePrewarm = fs.readFileSync(path.join(ROOT, 'src/game/continueSessionPrewarm.ts'), 'utf8');
  if (continuePrewarm.includes('planetGlobe')) {
    fail('continueSessionPrewarm must not rasterize or hydrate globe bakes');
  }
  const portraitOverride = fs.readFileSync(
    path.join(ROOT, 'src/game/tempAdminArcadiaPlanetPortraitOverride.ts'),
    'utf8',
  );
  if (portraitOverride.includes('planetGlobeBakedAssets')) {
    fail('portrait override must not import 80-asset require map');
  }

  const bannedRoots = [
    path.join(ROOT, 'app'),
    path.join(ROOT, 'src/components'),
    path.join(ROOT, 'src/arcCore'),
    path.join(ROOT, 'src/store'),
  ];
  for (const root of bannedRoots) {
    for (const file of walkTs(root)) {
      const txt = fs.readFileSync(file, 'utf8');
      if (
        txt.includes('planetGlobeBakeSample') ||
        txt.includes('planetGlobeLookDerive') ||
        txt.includes('planetGlobeRuntimeRasterize') ||
        txt.includes('planetGlobeLookColonized')
      ) {
        fail(`runtime import of bake/derive: ${path.relative(ROOT, file)}`);
      }
    }
  }

  console.log('PASS planet-globe-assets');
  console.log(`  core=${canon.length} colonized=${colonizedIds.length} pngBytes=${pngBytes} maxEach=${MAX_PNG_BYTES}`);
  console.log('  prewarm=excluded persist=off bakeSample=lazy-rasterize-only remount=nebula-only');
}

main();
