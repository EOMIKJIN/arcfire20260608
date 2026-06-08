#!/usr/bin/env node
/**
 * 메모리·스테이지 계약 정적 점검 — `2.1.memory.md` §11
 * 출력: tools/memory-audit/reports/latest.md
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const REPORT_DIR = path.join(__dirname, 'reports');
const REPORT_PATH = path.join(REPORT_DIR, 'latest.md');

function read(rel) {
  const p = path.join(ROOT, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

function check(name, ok, detail) {
  return { name, ok, detail };
}

const checks = [];

// P0 — replace on main stage transitions
const appGame = read('app/(game)/worldmap.tsx');
checks.push(
  check(
    'worldmap → combat uses replace (full path)',
    /router\.replace\('\/\(game\)\/combat'\)/.test(appGame),
    'Expected router.replace(\'/(game)/combat\')',
  ),
);
checks.push(
  check(
    'planet departure uses replace → worldmap',
    /router\.replace\('\/\(game\)\/worldmap'\)/.test(read('app/(game)/planet.tsx')),
    'Expected replace for galaxy map departure',
  ),
);

// P0 — postStepRef null on sim inactive
const simLayer = read('src/components/planet/PlanetEdenRaidTestLayer.tsx');
checks.push(
  check(
    'combatOrbitPostStepRef cleared when active=false',
    /if \(active\) return;\s*\n\s*combatOrbitPostStepRef\.current = null/.test(simLayer),
    'Sim hook must null postStepRef on deactivate',
  ),
);

const skiaCombat = read('src/components/planet/PlanetEdenRaidOrbitSkiaCombat.tsx');
checks.push(
  check(
    'Skia combat unmount clears postStepRef',
    /combatOrbitPostStepRef\.current = null/.test(skiaCombat),
    'PlanetEdenRaidOrbitSkiaCombat cleanup',
  ),
);

// P0 — rAF cancel in sim loop
checks.push(
  check(
    'combat sim loop cancelAnimationFrame',
    /cancelAnimationFrame\(raf\)/.test(simLayer),
    'Sim rAF must be cancelled',
  ),
);

// P1 — useStageMemory on main stages
const mainStages = [
  ['planet.tsx', 'useStageMemory'],
  ['worldmap.tsx', 'useStageMemory'],
  ['combat.tsx', 'useStageMemory'],
];
for (const [file, needle] of mainStages) {
  const body = read(`app/(game)/${file}`);
  checks.push(check(`${file} has ${needle}`, body.includes(needle), file));
}

// P1 — sub-stage memory hooks
for (const file of ['trade.tsx', 'shipyard.tsx', 'tavern.tsx', 'skilltree.tsx']) {
  const body = read(`app/(game)/${file}`);
  checks.push(
    check(`${file} has usePlanetSubStageMemory`, body.includes('usePlanetSubStageMemory'), file),
  );
}

// P1 — planet memo cache invalidation path
checks.push(
  check(
    'releasePlanetMainStageSession invalidates memo cache',
    /invalidateAllPlanetMemoCaches|invalidatePlanetMemoCachesForPlanet/.test(
      read('src/game/planetMainStageSession.ts'),
    ),
    'planetMainStageSession.ts',
  ),
);

// P1 — distance sort interval 5000ms (memory spec §9)
checks.push(
  check(
    'INFO_DISTANCE_SORT_INTERVAL_MS = 5000',
    /INFO_DISTANCE_SORT_INTERVAL_MS = 5000/.test(read('app/(game)/planet.tsx')),
    '2.1.memory.md §9',
  ),
);

// Bootstrap
checks.push(
  check(
    'buildCsvStaticIndexes at app boot',
    read('app/_layout.tsx').includes('buildCsvStaticIndexes()'),
    '_layout.tsx',
  ),
);

// Hooks exist
for (const rel of [
  'src/hooks/useStageMemory.ts',
  'src/hooks/useDisposable.ts',
  'src/hooks/usePlanetSubStageMemory.ts',
  'src/game/stageMemoryRelease.ts',
]) {
  checks.push(check(`file exists: ${rel}`, fs.existsSync(path.join(ROOT, rel)), rel));
}

// Forbidden: push to worldmap from planet (main stage)
const planet = read('app/(game)/planet.tsx');
const pushWorldmap = /router\.push\('\/\(game\)\/worldmap'\)/.test(planet);
checks.push(
  check(
    'planet does not push worldmap (replace only)',
    !pushWorldmap,
    pushWorldmap ? 'Found router.push worldmap — use replace' : 'ok',
  ),
);

const failed = checks.filter((c) => !c.ok);
const passed = checks.filter((c) => c.ok);

const lines = [
  '# Memory / Stage Contract Audit',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  `**Result:** ${failed.length === 0 ? 'PASS' : 'FAIL'} (${passed.length}/${checks.length} checks)`,
  '',
  '## Passed',
  ...passed.map((c) => `- [x] ${c.name}`),
  '',
];

if (failed.length > 0) {
  lines.push('## Failed', ...failed.map((c) => `- [ ] **${c.name}** — ${c.detail}`), '');
}

lines.push(
  '## Reference',
  '- `docs/2.1.memory.md`',
  '- `docs/rendering-pipeline-baseline.md`',
  '',
);

if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(REPORT_PATH, lines.join('\n'), 'utf8');

console.log(lines.slice(0, 6).join('\n'));
if (failed.length > 0) {
  console.error('\nFailed checks:');
  for (const f of failed) console.error(`  - ${f.name}: ${f.detail}`);
  process.exitCode = 1;
}
