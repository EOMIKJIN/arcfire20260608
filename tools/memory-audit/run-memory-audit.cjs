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
    'combatOrbitPostStepRef cleared on hub departure halt',
    /haltForGalaxyDeparture[\s\S]{0,200}?combatOrbitPostStepRef\.current = null/.test(simLayer),
    'PlanetEdenRaidTestLayer haltForGalaxyDeparture',
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
    'releaseGalaxyMapStageMemory clears scroll + memo + nebula + heavyUi',
    /releaseGalaxyMapStageMemoryFull/.test(read('src/game/galaxyMapStageSession.ts'))
      && /invalidateAllPlanetMemoCaches/.test(read('src/game/galaxyMapStageSession.ts'))
      && /abortHeavyUiSessions/.test(read('src/game/galaxyMapStageSession.ts'))
      && /GALAXY_RELEASE_DEDUPE_MS/.test(read('src/game/galaxyMapStageSession.ts')),
    'galaxyMapStageSession.ts symmetric full release',
  ),
);

checks.push(
  check(
    'releasePlanetMainStageSession dedupe blur+unmount',
    /PLANET_MAIN_RELEASE_DEDUPE_MS|releasePlanetMainStageSession dedupe/.test(
      read('src/game/planetMainStageSession.ts'),
    ),
    'planetMainStageSession.ts',
  ),
);

checks.push(
  check(
    'Native Reclaim Tier wired on STAGE release',
    /runStageNativeReclaimPass/.test(read('src/game/planetMainStageSession.ts'))
      && /runPlanetChangeNativeReclaimLight/.test(read('src/game/planetMainStageSession.ts'))
      && /runStageNativeReclaimPass/.test(read('src/game/galaxyMapStageSession.ts'))
      && /runCombatSkiaPresentationReclaim/.test(read('src/combat/clearCapitalRealtimeCombatCaches.ts')),
    'nativeReclaim/runStageNativeReclaimPass.ts',
  ),
);

checks.push(
  check(
    'GPU supervisor enforces onRelease on layer release',
    /onRelease\?\.\(\)/.test(read('src/game/planetStageGpuSupervisor.ts')),
    'planetStageGpuSupervisor.ts',
  ),
);

checks.push(
  check(
    'hub Skia native reclaim signal subscribed',
    /subscribeHubSkiaNativeReclaim/.test(read('src/components/planet/planetHub/planetHubSubcomponents.tsx')),
    'planetHubSubcomponents.tsx',
  ),
);

checks.push(
  check(
    'planet_change light reclaim (content-safe)',
    /runPlanetChangeNativeReclaimLight/.test(read('src/game/planetMainStageSession.ts')),
    'planetMainStageSession.ts',
  ),
);

checks.push(
  check(
    'clearCapital combat-only (no full reclaim on planet_change)',
    (() => {
      const body = read('src/combat/clearCapitalRealtimeCombatCaches.ts');
      const fnMatch = body.match(/export function clearCapitalRealtimeCombatPresentationCaches\(\)[^{]*\{([^}]*)\}/);
      const fnBody = fnMatch ? fnMatch[1] : body;
      return /runCombatSkiaPresentationReclaim/.test(fnBody)
        && !/runStageNativeReclaimPass/.test(fnBody);
    })(),
    'clearCapitalRealtimeCombatCaches.ts',
  ),
);

checks.push(
  check(
    'planet departure navigate uses stage UI idle barrier',
    /scheduleStageNavigateAfterDrain|runStageUiAfterIdle/.test(read('src/game/usePlanetStageSession.ts')),
    'usePlanetStageSession.ts frozen→navigate',
  ),
);

// P1 — distance sort interval 5000ms (memory spec §9)
checks.push(
  check(
    'INFO_DISTANCE_SORT_INTERVAL_MS = 5000',
    /INFO_DISTANCE_SORT_INTERVAL_MS = 5000/.test(read('src/game/planetHub/planetHubConstants.ts')),
    '2.1.memory.md §9 — planetHubConstants.ts',
  ),
);

// Bootstrap
checks.push(
  check(
    'buildCsvStaticIndexes at app boot',
    read('app/_layout.tsx').includes('buildCsvStaticIndexesMinimal()')
      || read('app/_layout.tsx').includes('buildCsvStaticIndexes()'),
    '_layout.tsx — minimal tier at boot',
  ),
);

checks.push(
  check(
    'planet core persist dirty-skip',
    /planetCorePersistDirty/.test(read('src/store/planetCoreRuntimeStore.ts'))
      && /if \(!planetCorePersistDirty\) return/.test(read('src/store/planetCoreRuntimeStore.ts')),
    'planetCoreRuntimeStore.ts',
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

checks.push(
  check(
    'ArcMemoryGovernor warmPlanetHubResidentSet',
    /warmPlanetHubResidentSet/.test(planet),
    'lazy resident set on hub',
  ),
);

checks.push(
  check(
    'hub Skia 2-stage arm (hubSkiaArmReady)',
    /hubSkiaArmReady/.test(planet),
    'ingress native step mitigation',
  ),
);

checks.push(
  check(
    'stageTransitionPhaseGate module',
    fs.existsSync(path.join(ROOT, 'src/game/stageTransitionPhaseGate.ts')),
    'stageTransitionPhaseGate.ts',
  ),
);

checks.push(
  check(
    'planet stage session uses phase gate navigate drain',
    /scheduleStageNavigateAfterDrain/.test(read('src/game/usePlanetStageSession.ts')),
    'usePlanetStageSession frozen effect',
  ),
);

checks.push(
  check(
    'MEM_PROFILE release build flag',
    /EXPO_PUBLIC_ARCFIRE_MEM_PROFILE/.test(read('src/game/devMemoryProfileBridge.ts')),
    'retention soak on release',
  ),
);

checks.push(
  check(
    'planet hub SUB-STAGE blur skips full route_blur',
    /hubSubStageNavRef/.test(planet)
      && /hubSubStageNavRef\.current/.test(planet)
      && /if \(hubSubStageNavRef\.current\)[\s\S]{0,120}return/.test(planet),
    'usePlanetSubStageMemory — hub stays mounted on facility push',
  ),
);

checks.push(
  check(
    'hub soft reclaim Fresco trim deferred-only (no immediate+deferred double trim)',
    !read('src/game/nativeReclaim/runPlanetHubSoftNativeReclaimPass.ts').includes('trimNativeBitmapCachesAsync'),
    'runPlanetHubSoftNativeReclaimPass.ts — align with runGalaxyMapSoftNativeReclaimPass',
  ),
);

checks.push(
  check(
    'planet hub store selectors avoid JSON.stringify hot path',
    !/JSON\.stringify\(s\.progresses\)/.test(planet)
      && !/JSON\.stringify\(s\.byPlanetId\[pid\]\?\.detail\?\.development/.test(planet),
    'planet.tsx — use planetHubStoreMemoRevisions',
  ),
);

checks.push(
  check(
    'dev Metro reload guard releases all STAGE + blur skip',
    /releaseGalaxyMapStageMemory/.test(read('src/game/devMetroReloadGuard.ts'))
      && /isDevMetroReloadPrepareInFlight/.test(read('src/game/devMetroReloadGuard.ts'))
      && /isDevMetroReloadPrepareInFlight/.test(planet)
      && /isDevMetroReloadPrepareInFlight/.test(read('app/(game)/worldmap.tsx')),
    'devMetroReloadGuard.ts + planet/worldmap focus blur',
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

// Skia worklet 계약 — ArcCore missile·Nebula lazy mount (별도 리포트 skia-worklet-latest.md)
const { execSync } = require('child_process');
console.log('\n--- Skia worklet contract (chained) ---');
try {
  execSync('node tools/memory-audit/run-skia-worklet-memory-audit.cjs', {
    cwd: ROOT,
    stdio: 'inherit',
  });
} catch {
  process.exitCode = 1;
}
