#!/usr/bin/env node
/**
 * Resident Set tier / lazy boot 정적 감사
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const REPORT_DIR = path.join(__dirname, 'reports');
const REPORT_PATH = path.join(REPORT_DIR, 'resident-set-audit-latest.md');

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function check(name, ok, detail) {
  return { name, ok, detail };
}

const checks = [];

checks.push(
  check(
    'ArcMemoryGovernor module exists',
    fs.existsSync(path.join(ROOT, 'src/arcCore/memory/arcMemoryGovernor.ts')),
    'src/arcCore/memory/',
  ),
);

checks.push(
  check(
    'AiTradePortLevelPolicySubCore onBoot no full catalog sync',
    !/syncTradePortCatalogFromBalance\s*\(\s*true\s*\)/.test(read('src/arcCore/subcores/AiTradePortLevelPolicySubCore.ts')),
    'onBoot must not force full catalog',
  ),
);

checks.push(
  check(
    'AiEconomySubCore boot skipCatalog',
    /skipCatalog:\s*true/.test(read('src/arcCore/subcores/AiEconomySubCore.ts')),
    'boot economy pass',
  ),
);

checks.push(
  check(
    'planet warmPlanetHubResidentSet on stage enter',
    /warmPlanetHubResidentSet/.test(read('app/(game)/planet.tsx')),
    'planet.tsx',
  ),
);

checks.push(
  check(
    'departure warmGalaxyDeparturePreflight',
    /warmGalaxyDeparturePreflight/.test(read('app/(game)/planet.tsx')),
    'planet.tsx handleDeparture',
  ),
);

checks.push(
  check(
    'buildCsvStaticIndexesMinimal at boot',
    read('app/_layout.tsx').includes('buildCsvStaticIndexesMinimal()'),
    '_layout.tsx',
  ),
);

checks.push(
  check(
    'MEM_PROFILE release env gate',
    /EXPO_PUBLIC_ARCFIRE_MEM_PROFILE/.test(read('src/game/devMemoryProfileBridge.ts')),
    'devMemoryProfileBridge.ts',
  ),
);

const failed = checks.filter((c) => !c.ok);
const passed = checks.filter((c) => c.ok);

const lines = [
  '# Resident Set / Lazy Boot Audit',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  `**Result:** ${failed.length === 0 ? 'PASS' : 'FAIL'} (${passed.length}/${checks.length})`,
  '',
  ...passed.map((c) => `- [x] ${c.name}`),
  ...(failed.length ? ['', '## Failed', ...failed.map((c) => `- [ ] ${c.name} — ${c.detail}`)] : []),
  '',
];

if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(REPORT_PATH, lines.join('\n'), 'utf8');
console.log(lines.slice(0, 5).join('\n'));
process.exit(failed.length ? 1 : 0);
