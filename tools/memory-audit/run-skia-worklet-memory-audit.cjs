#!/usr/bin/env node
/**
 * Skia + Reanimated worklet 메모리 계약 — 허브 궤도·전투 (장거리 미사ile 제거 후)
 * 출력: tools/memory-audit/reports/skia-worklet-latest.md
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const REPORT_DIR = path.join(__dirname, 'reports');
const REPORT_PATH = path.join(REPORT_DIR, 'skia-worklet-latest.md');

function read(rel) {
  const p = path.join(ROOT, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function check(name, ok, detail) {
  return { name, ok, detail };
}

const combat = read('src/components/planet/PlanetEdenRaidOrbitSkiaCombat.tsx');
const hubOrbit = read('src/components/planet/PlanetHubOrbitSkiaLayer.tsx');
const hub = read('src/components/planet/planetHub/planetHubSubcomponents.tsx');
const gpuSupervisor = read('src/game/planetStageGpuSupervisor.ts');
const nebulaBackdrop = read('src/components/planet/SkiaPlanetNebulaShaderBackdrop.tsx');
const skiaLifecycle = read('src/game/skia/skiaMemoryLifecycle.ts');
const inboundTrail = read('src/components/planet/PlanetHubInboundDroneSkiaTrailLayer.tsx');
const transitParallax = read('src/components/combat/TransitCombatSkiaParallaxBackdrop.tsx');
const hitFxContract = read('src/components/planet/planetSkiaHitFxContract.ts');

const checks = [];

checks.push(
  check(
    'removed: PlanetArcCoreStrikePresentation',
    !exists('src/components/planet/PlanetArcCoreStrikePresentation.tsx'),
    '장거리 미사ile Skia mount 제거',
  ),
);
checks.push(
  check(
    'removed: arcCoreMessageStore',
    !exists('src/store/arcCoreMessageStore.ts'),
    'strike store 제거',
  ),
);
checks.push(
  check(
    'removed: src/arcCore/message',
    !exists('src/arcCore/message/arcCoreMessagePolicy.ts'),
    'message 모듈 제거',
  ),
);
checks.push(
  check(
    'removed: ArcCoreMessageSubCore',
    !exists('src/arcCore/subcores/ArcCoreMessageSubCore.ts'),
    'strike 스케줄 subcore 제거',
  ),
);
checks.push(
  check(
    'hub: no strike Skia imports',
    !hub.includes('PlanetArcCoreStrikePresentation')
      && !hub.includes('PlanetArcCoreMessageMissileSkiaLayer')
      && !hub.includes('useArcCoreMessageStore'),
    'planetHubSubcomponents.tsx',
  ),
);
checks.push(
  check(
    'hub: defense satellite RN mark only',
    hub.includes("object.kind === 'defense_satellite'")
      && !hub.includes('interceptLaunchAtWallMs'),
    '요격 연출 blink 제거',
  ),
);
checks.push(
  check(
    'combat: Picture pool or path reuse',
    combat.includes('Picture') || combat.includes('path.reset'),
    'PlanetEdenRaidOrbitSkiaCombat',
  ),
);
checks.push(
  check(
    'hub orbit: Skia layer present',
    hub.includes('PlanetHubOrbitSkiaLayer') && hubOrbit.length > 0,
    'PlanetHubOrbitSkiaLayer.tsx',
  ),
);
checks.push(
  check(
    'gpu supervisor: no arc_core_missile layer ids',
    !gpuSupervisor.includes('arc_core_missile')
      && !gpuSupervisor.includes('defense_intercept_missile'),
    'planetStageGpuSupervisor.ts',
  ),
);

  checks.push(
    check(
      'removed: arcCoreMissileFlightHost',
      !exists('src/game/arcCoreMissileFlightHost.tsx'),
      'FlightHost 제거',
    ),
  );
  checks.push(
    check(
      'removed: usePlanetHubArcCoreWarningBlink',
      !exists('src/game/planetHub/usePlanetHubArcCoreWarningBlink.ts'),
      '경고 blink hook 제거',
    ),
  );
  checks.push(
    check(
      'policy: no intercept_enabled runtime flag',
      !read('src/arcCore/balance/planetDefenseSatellitePolicy.ts').includes('interceptEnabled'),
      'planetDefenseSatellitePolicy.ts',
    ),
  );

checks.push(
  check(
    'combat: path spare pool + recorder reuse',
    combat.includes('missileTrailSpare')
      && combat.includes('getCombatPictureRecorder')
      && combat.includes('acquireSkPathFromPool'),
    'PlanetEdenRaidOrbitSkiaCombat.tsx',
  ),
);

// scheduleSkPictureDispose 직접 호출 또는 그걸 내부에서 호출하는 공용 래퍼
// (commitSkPictureReactFrame/dropSkPictureReactFrame, skiaMemoryLifecycle.ts) 사용 둘 다 인정.
function usesSkPictureDispose(src) {
  return (
    src.includes('scheduleSkPictureDispose')
    || (src.includes('commitSkPictureReactFrame') && src.includes('dropSkPictureReactFrame'))
  );
}

checks.push(
  check(
    'combat: rAF-coalesced Picture + loop stop on unmount',
    combat.includes('pictureFlushRafRef')
      && combat.includes('combatSkiaLoopsActiveRef')
      && usesSkPictureDispose(combat),
    'PlanetEdenRaidOrbitSkiaCombat.tsx',
  ),
);

checks.push(
  check(
    'combat: single Canvas + single Picture (no Path.map)',
    combat.includes('<Picture picture={picture} />')
      && !/<Path[\s\S]*\.map\(/.test(combat),
    'PlanetEdenRaidOrbitSkiaCombat.tsx',
  ),
);

checks.push(
  check(
    'nebula dodge: Picture batch (no per-FX Group.map)',
    nebulaBackdrop.includes('drawNebulaColorDodgeFxTransformedOnSkCanvas')
      && nebulaBackdrop.includes('<Picture picture={dodgePicture} />')
      && !nebulaBackdrop.includes('blendMode="colorDodge"'),
    'SkiaPlanetNebulaShaderBackdrop.tsx',
  ),
);

checks.push(
  check(
    'nebula: skiaLoopsActive + delayed Picture dispose',
    nebulaBackdrop.includes('skiaLoopsActiveRef')
      && usesSkPictureDispose(nebulaBackdrop),
    'SkiaPlanetNebulaShaderBackdrop.tsx',
  ),
);

checks.push(
  check(
    'shared skiaMemoryLifecycle helpers',
    skiaLifecycle.includes('scheduleSkPictureDispose')
      && skiaLifecycle.includes('acquireSkPathFromPool')
      && skiaLifecycle.includes('drainSkPathPool'),
    'skiaMemoryLifecycle.ts',
  ),
);

checks.push(
  check(
    'inbound drone: shared lifecycle import',
    inboundTrail.includes('skiaMemoryLifecycle'),
    'PlanetHubInboundDroneSkiaTrailLayer.tsx',
  ),
);

checks.push(
  check(
    'SkImage manual dispose forbidden (SIGSEGV guard)',
    /수동 dispose 금지|dispose 금지/.test(combat)
      && /수동 dispose 금지|dispose 금지/.test(nebulaBackdrop)
      && /수동 dispose 금지|dispose 금지/.test(transitParallax),
    'combat + nebula + transit parallax',
  ),
);

checks.push(
  check(
    'transit parallax: single Canvas + Picture (no Path.map, no worklet)',
    exists('src/components/combat/TransitCombatSkiaParallaxBackdrop.tsx')
      && transitParallax.includes('<Picture picture={picture} />')
      && transitParallax.includes('BlendMode.Screen')
      && transitParallax.includes('drawNebulaColorDodgeFxTransformedOnSkCanvas')
      && !transitParallax.includes('useFrameCallback')
      && !/<Path[\s\S]*\.map\(/.test(transitParallax),
    'TransitCombatSkiaParallaxBackdrop.tsx',
  ),
);

checks.push(
  check(
    'transit parallax: skiaLoopsActive + delayed Picture drop',
    transitParallax.includes('skiaLoopsActiveRef')
      && usesSkPictureDispose(transitParallax),
    'TransitCombatSkiaParallaxBackdrop.tsx',
  ),
);

checks.push(
  check(
    'transit parallax: no PictureRecorder dispose (combat-end SIGSEGV)',
    transitParallax.includes('getParallaxRecorder')
      && !/_parallaxRecorder\)[\s\S]{0,40}safeSkiaDispose/.test(transitParallax)
      && !transitParallax.includes('safeSkiaDispose(_parallaxRecorder'),
    'TransitCombatSkiaParallaxBackdrop.tsx',
  ),
);

checks.push(
  check(
    'transit parallax: no clipRect on PictureRecorder (JsiSkCanvas getBool assert)',
    !transitParallax.includes('clipRect'),
    'TransitCombatSkiaParallaxBackdrop.tsx',
  ),
);

checks.push(
  check(
    'transit parallax: no SkImage.width/height on tick (JsiSkImage::width SIGSEGV)',
    !transitParallax.includes('.width()') && !transitParallax.includes('.height()'),
    'TransitCombatSkiaParallaxBackdrop.tsx',
  ),
);

checks.push(
  check(
    'ColorDodge FX: no dodgeImage.width/height (JsiSkImage::width SIGSEGV)',
    !hitFxContract.includes('dodgeImage.width()') && !hitFxContract.includes('dodgeImage.height()'),
    'planetSkiaHitFxContract.ts',
  ),
);

checks.push(
  check(
    'transit parallax: overlay is full-bleed (no container chrome inset)',
    transitParallax.includes('StyleSheet.absoluteFillObject')
      && !/top:\s*chromePad/.test(transitParallax)
      && !/style=\{\[styles\.root,/.test(transitParallax),
    'TransitCombatSkiaParallaxBackdrop.tsx',
  ),
);

checks.push(
  check(
    'transit parallax: one/two drifting clouds (no tile grid)',
    transitParallax.includes('resolveTransitCloudSpriteSize')
      && transitParallax.includes('drawDriftingCloud')
      && !transitParallax.includes('TRANSIT_CLOUD_TILE_COLS')
      && !transitParallax.includes('drawCloudCoverage'),
    'TransitCombatSkiaParallaxBackdrop.tsx',
  ),
);

checks.push(
  check(
    'transit parallax: tick interval not rebound on layout/dodge (flush ref)',
    transitParallax.includes('flushPictureRef')
      && /setInterval\(\(\) => \{\s*flushPictureRef\.current\(\);/.test(transitParallax)
      && /\[active, stopParallaxLoops\]/.test(transitParallax),
    'TransitCombatSkiaParallaxBackdrop.tsx',
  ),
);

checks.push(
  check(
    'transit parallax: starfield is Skia catalog (no RN StarField Views)',
    transitParallax.includes('drawTransitStarField')
      && transitParallax.includes('fillTransitStarCatalog')
      && !transitParallax.includes('from \'../../renderer/StarField\'')
      && !transitParallax.includes('new Array('),
    'TransitCombatSkiaParallaxBackdrop.tsx',
  ),
);

checks.push(
  check(
    'transit parallax: image refs sync in useEffect (not render body)',
    /useEffect\(\(\) => \{\s*bakedImageRef\.current = bakedImage/.test(transitParallax)
      && /useEffect\(\(\) => \{\s*dodgeImageRef\.current = dodgeImage/.test(transitParallax),
    'TransitCombatSkiaParallaxBackdrop.tsx',
  ),
);

  const pass = checks.filter((c) => c.ok).length;
const fail = checks.length - pass;

if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

const lines = [
  '# Skia worklet memory audit',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  `**${pass}/${checks.length}** passed`,
  '',
  '| Status | Check | Detail |',
  '|--------|-------|--------|',
  ...checks.map((c) => `| ${c.ok ? 'PASS' : 'FAIL'} | ${c.name} | ${c.detail} |`),
  '',
  fail > 0 ? '**Action:** fix FAIL rows before memory isolation test.' : '**OK:** no strike-system residue in audit scope.',
];

fs.writeFileSync(REPORT_PATH, lines.join('\n'));
console.log(`skia-worklet audit: ${pass}/${checks.length} -> ${REPORT_PATH}`);
process.exit(fail > 0 ? 1 : 0);
