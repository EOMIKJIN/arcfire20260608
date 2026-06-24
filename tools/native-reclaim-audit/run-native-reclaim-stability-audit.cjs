#!/usr/bin/env node
/**
 * Native Reclaim Tier — 콘텐츠·이미지 스킵/회귀 정적 검증
 * 출력: tools/native-reclaim-audit/reports/latest.md
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

const planetMain = read('src/game/planetMainStageSession.ts');
const reclaimPass = read('src/game/nativeReclaim/runStageNativeReclaimPass.ts');
const planetChangeLight = read('src/game/nativeReclaim/runPlanetChangeNativeReclaimLight.ts');
const clearCombat = read('src/combat/clearCapitalRealtimeCombatCaches.ts');
const hubSub = read('src/components/planet/planetHub/planetHubSubcomponents.tsx');
const skiaBackdrop = read('src/components/planet/SkiaPlanetNebulaShaderBackdrop.tsx');
const galaxySession = read('src/game/galaxyMapStageSession.ts');

checks.push(
  check(
    'planet_change uses light reclaim (no hub Skia tear-down)',
    /runPlanetChangeNativeReclaimLight/.test(planetMain)
      && /planet_change[\s\S]*runPlanetChangeNativeReclaimLight[\s\S]*return;/.test(planetMain),
    'planetMainStageSession.ts — full reclaim only on route_blur',
  ),
);

checks.push(
  check(
    'route_blur full reclaim with keepPlanetIds',
    /reason === 'route_blur'/.test(planetMain) && /runStageNativeReclaimPass/.test(planetMain),
    'planetMainStageSession.ts',
  ),
);

checks.push(
  check(
    'clearCapital does NOT run full stage reclaim (hub-safe)',
    (() => {
      const fnMatch = clearCombat.match(
        /export function clearCapitalRealtimeCombatPresentationCaches\(\)[^{]*\{([^}]*)\}/,
      );
      const fnBody = fnMatch ? fnMatch[1] : clearCombat;
      return /runCombatSkiaPresentationReclaim/.test(fnBody)
        && !/runStageNativeReclaimPass/.test(fnBody);
    })(),
    'clearCapitalRealtimeCombatCaches.ts',
  ),
);

checks.push(
  check(
    'nebula profile re-hydrate on planet hub entry',
    /ensureNebulaProfileForPlanet\(planetId\)/.test(hubSub)
      || /ensureProfileForPlanet\(planetId\)/.test(hubSub),
    'planetHubSubcomponents.tsx',
  ),
);

checks.push(
  check(
    'hub Skia reclaim gated by reclaimHubSkia flag',
    /reclaimHubSkia/.test(reclaimPass) && /reclaimHubSkia !== false/.test(reclaimPass),
    'runStageNativeReclaimPass.ts',
  ),
);

checks.push(
  check(
    'no Image.clearMemoryCache in reclaim modules',
    !/clearMemoryCache/.test(reclaimPass)
      && !/clearMemoryCache/.test(planetChangeLight)
      && !/clearMemoryCache/.test(clearCombat),
    'ANR-safe reclaim',
  ),
);

checks.push(
  check(
    'Skia nebula hideUntilImagesReady + RN fallback on image lost',
    /hideUntilImagesReady/.test(skiaBackdrop)
      && /onNebulaImagesLost/.test(skiaBackdrop)
      && /everReadyRef/.test(skiaBackdrop),
    'SkiaPlanetNebulaShaderBackdrop.tsx',
  ),
);

checks.push(
  check(
    'hub native reclaim signal subscribed (release path)',
    /subscribeHubSkiaNativeReclaim/.test(hubSub),
    'planetHubSubcomponents.tsx',
  ),
);

checks.push(
  check(
    'galaxy route_blur native reclaim wired',
    /runStageNativeReclaimPass/.test(galaxySession) && /stage: 'galaxy_map'/.test(galaxySession),
    'galaxyMapStageSession.ts',
  ),
);

checks.push(
  check(
    'SkImage manual dispose forbidden (SIGSEGV guard)',
    /수동 dispose 금지|dispose 금지/.test(skiaBackdrop),
    'SkiaPlanetNebulaShaderBackdrop.tsx',
  ),
);

checks.push(
  check(
    'planet_change light reclaim prunes previous planet only',
    /prunePlanetNebulaProfilesForPlanets/.test(planetChangeLight),
    'runPlanetChangeNativeReclaimLight.ts',
  ),
);

checks.push(
  check(
    'combat Skia module cache reclaim registered',
    /registerCombatSkiaPresentationReclaim/.test(read('src/components/planet/PlanetEdenRaidOrbitSkiaCombat.tsx')),
    'PlanetEdenRaidOrbitSkiaCombat.tsx',
  ),
);

checks.push(
  check(
    'native reclaim bootstrap installed at app boot',
    /installNativeReclaimBootstrap/.test(read('app/_layout.tsx')),
    'app/_layout.tsx',
  ),
);

checks.push(
  check(
    'soft native reclaim pass (PSS 800 zone)',
    /runSoftNativeReclaimPass/.test(read('src/game/nativeReclaim/runSoftNativeReclaimPass.ts')),
    'runSoftNativeReclaimPass.ts',
  ),
);

checks.push(
  check(
    'planet core persist dirty-skip (no redundant JSON sync)',
    /planetCorePersistDirty/.test(read('src/store/planetCoreRuntimeStore.ts')),
    'planetCoreRuntimeStore.ts',
  ),
);

checks.push(
  check(
    'deep native reclaim pass (Fresco trim + hub remount)',
    /runDeepNativeReclaimPass/.test(read('src/game/nativeReclaim/runDeepNativeReclaimPass.ts'))
      && /trimNativeBitmapCachesAsync/.test(read('src/game/nativeReclaim/runDeepNativeReclaimPass.ts'))
      && /HUB_DEEP_NATIVE_RECLAIM_INTERVAL_MS/.test(read('app/(game)/planet.tsx')),
    'runDeepNativeReclaimPass.ts + planet.tsx',
  ),
);

checks.push(
  check(
    'hub backdrop remount signal subscribed',
    /subscribeHubBackdropNativeRemount/.test(hubSub)
      && /hubBackdropRemountGen/.test(hubSub),
    'planetHubSubcomponents.tsx',
  ),
);

checks.push(
  check(
    'arcfire-native-memory expo module present',
    fs.existsSync(path.join(ROOT, 'modules/arcfire-native-memory/expo-module.config.json'))
      && /trimBitmapMemoryCachesAsync/.test(read('modules/arcfire-native-memory/android/src/main/java/expo/modules/arcfirenativememory/ArcfireNativeMemoryModule.kt')),
    'modules/arcfire-native-memory',
  ),
);

checks.push(
  check(
    'PGP daily pass marks planet core dirty before persist',
    /markPlanetCoreRuntimeDirty/.test(read('src/arcCore/economy/runPlanetPgpDailyPass.ts')),
    'runPlanetPgpDailyPass.ts',
  ),
);

checks.push(
  check(
    'deferred nebula reclaim respects keepPlanetIds',
    /keepPlanetIds/.test(read('src/game/nativeReclaim/nativeReclaimBootstrap.ts'))
      && /prunePlanetNebulaProfilesExceptPlanetIds/.test(read('src/game/nativeReclaim/nativeReclaimBootstrap.ts')),
    'nativeReclaimBootstrap.ts',
  ),
);

const passed = checks.filter((c) => c.ok).length;
const failed = checks.filter((c) => !c.ok);

const lines = [
  '# Native Reclaim — Content & Image Stability Audit',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  `**Result:** ${failed.length === 0 ? 'PASS' : 'FAIL'} (${passed}/${checks.length} checks)`,
  '',
];

if (failed.length > 0) {
  lines.push('## Failed', '');
  for (const c of failed) {
    lines.push(`- [ ] **${c.name}** — ${c.detail}`);
  }
  lines.push('');
}

lines.push('## Passed', '');
for (const c of checks.filter((x) => x.ok)) {
  lines.push(`- [x] ${c.name}`);
}

lines.push('', '## Manual soak checklist (device)', '');
lines.push('1. 행성 허브 진입 — 성운·배경 이미지 3초 내 표시 (hideUntilImagesReady)');
lines.push('2. 허브 → 은하맵 → 허브 5회 — 성운 소실·검은 화면 없음');
lines.push('3. 행성 A → B 착륙 — 성운/배경 즉시 교체, 스킵 없음');
lines.push('4. 전투 진입·퇴장 — 함선/미사일 렌더 정상');
lines.push('5. mem-timeline — blur 후 PSS floor 하락 또는 재진입 spike 후 회수');

fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(REPORT_PATH, lines.join('\n'), 'utf8');

console.log(`native-reclaim stability audit: ${passed}/${checks.length} -> ${REPORT_PATH}`);
process.exit(failed.length > 0 ? 1 : 0);
