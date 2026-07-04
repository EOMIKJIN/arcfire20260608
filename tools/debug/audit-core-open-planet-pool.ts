/**
 * 코어 개방 행성 풀 — 정적 CI 게이트 (worldStore 없이 baseline 21)
 * npx tsx tools/debug/audit-core-open-planet-pool.ts
 */
import {
  BASELINE_CORE_OPEN_SYSTEM_IDS,
  isCanonicalCoreOpenPlanetId,
  listCoreOpenGameplayPlanetIds,
} from '../../src/world/coreOpenGameplayPlanets';
import { PlayScenarioZonePlanets_FROM_BALANCE_CSV } from '../../src/data/balance/generated/csvPlayScenarioZonePlanets';

let pass = true;
function gate(label: string, ok: boolean, detail: string): void {
  console.log(`${ok ? '[PASS]' : '[FAIL]'} ${label}: ${detail}`);
  if (!ok) pass = false;
}

const coreOpenIds = listCoreOpenGameplayPlanetIds();
gate('baseline system count', BASELINE_CORE_OPEN_SYSTEM_IDS.size === 21, String(BASELINE_CORE_OPEN_SYSTEM_IDS.size));
gate('headless pool >= 21', coreOpenIds.length >= 21, String(coreOpenIds.length));

for (const row of PlayScenarioZonePlanets_FROM_BALANCE_CSV) {
  const pid = row.primaryPlanetId;
  gate(
    `canonical anchor ${pid}`,
    coreOpenIds.includes(pid) && isCanonicalCoreOpenPlanetId(pid),
    pid,
  );
}

if (!pass) {
  console.error('\naudit-core-open-planet-pool: FAIL');
  process.exit(1);
}
console.log('\naudit-core-open-planet-pool: PASS (baseline 21 in core-open pool)');
