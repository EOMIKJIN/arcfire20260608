/**
 * AsyncStorage `arcfire_planet_core_runtime_v1` 크기 추정 (부트 시드·일일 배치 후 상한).
 * 실행: npx tsx tools/session-stability-watch/estimate-planet-core-storage.ts
 */
import { GALAXY_SYSTEMS } from '../../src/data/galaxy100';
import type { PlanetCoreRuntime } from '../../src/store/planetCoreRuntimeStore';
import { planetCsvBaselineToRuntime } from '../../src/store/planetCoreRuntimeStore';
import type { PlanetMasterBalanceDetail } from '../../src/store/planetCoreMetricTypes';

function minimalBoot(): Record<string, PlanetCoreRuntime> {
  const out: Record<string, PlanetCoreRuntime> = {};
  for (const sys of Object.values(GALAXY_SYSTEMS)) {
    for (const p of sys.planets) {
      out[p.id] = planetCsvBaselineToRuntime(p);
    }
  }
  return out;
}

function withMasterBalanceAll(byPlanetId: Record<string, PlanetCoreRuntime>): Record<string, PlanetCoreRuntime> {
  const next = { ...byPlanetId };
  for (const [id, rec] of Object.entries(next)) {
    const masterBalance: PlanetMasterBalanceDetail = {
      version: 1,
      zoneIndex: 1,
      sectorBand: 'mid',
      recommendedPilotLevel: 12,
      requiredFleetMinDps: 5000,
      targetCreditsEarned: 12000,
      enemyAffinityKind: 'default',
      recommendedHullTierKey: 'destroyer',
      recommendedWeaponTierKey: 'tier_1',
      combatsInZone: 0,
      combatMinutesTotal: 0,
      targetEngageSec: 32,
      mineralUpgradeCapAtZone: 1,
    };
    next[id] = {
      ...rec,
      detail: { ...rec.detail, masterBalance },
    };
  }
  return next;
}

function withAttackDetailGameplay(byPlanetId: Record<string, PlanetCoreRuntime>): Record<string, PlanetCoreRuntime> {
  const next = { ...byPlanetId };
  for (const id of Object.keys(next)) {
    if (!id.includes('arcadia') && !id.endsWith('_p') && !id.includes('prime')) continue;
    next[id] = {
      ...next[id],
      detail: {
        ...next[id].detail,
        attackDamage: {
          version: 1,
          daily: { kstDayKey: '2026-06-16', byKind: { arc_inbound_drone_impact: 3 } },
          lastEvents: Array.from({ length: 8 }, (_, i) => ({
            attackKind: 'arc_inbound_drone_impact',
            atMs: Date.now() - i * 1000,
            sourceId: `drone_${i}`,
            applied: { resource: 0, population: 0, defense: -1, technology: -1, environment: 0 },
          })),
          totalEvents: 42,
        },
      },
    };
  }
  return next;
}

function withFabricDailyAll(byPlanetId: Record<string, PlanetCoreRuntime>): Record<string, PlanetCoreRuntime> {
  const kst = '2026-06-16';
  const next = { ...byPlanetId };
  for (const [id, rec] of Object.entries(next)) {
    next[id] = {
      ...rec,
      detail: {
        ...rec.detail,
        economyFabric: {
          version: 1,
          window: {
            kstDayKey: kst,
            convoyProfitCredits: 0,
            convoyTrips: 0,
            supplyUnitsDelivered: 0,
            attackDefenseLoss: 0,
            attackPopulationLoss: 0,
            playerTradeGrossCredits: 0,
            playerTradeCount: 0,
            playerBuyUnits: 0,
            playerSellUnits: 0,
          },
          lastDailyReconcile: {
            atMs: Date.now(),
            supplyStockScale: 0.72,
            operationalBase: 0.5,
            resourceNudge: 1,
            populationNudge: 0,
            windowSummary: {
              kstDayKey: '2026-06-15',
              convoyProfitCredits: 800,
              convoyTrips: 2,
              supplyUnitsDelivered: 40,
              attackDefenseLoss: 2,
              attackPopulationLoss: 0,
              playerTradeGrossCredits: 0,
              playerTradeCount: 0,
              playerBuyUnits: 0,
              playerSellUnits: 0,
            },
          },
          recentEvents: [],
        },
      },
    };
  }
  return next;
}

const boot = minimalBoot();
const bootJson = JSON.stringify({ byPlanetId: boot, globalMultipliers: { globalEngageHpMul: 1 } });

const withMb = withMasterBalanceAll(boot);
const mbJson = JSON.stringify({ byPlanetId: withMb, globalMultipliers: { globalEngageHpMul: 1 } });

const withAtk = withAttackDetailGameplay(withMb);
const atkJson = JSON.stringify({ byPlanetId: withAtk, globalMultipliers: { globalEngageHpMul: 1.05 } });

console.log('planets', Object.keys(boot).length);
console.log('boot KB', (bootJson.length / 1024).toFixed(1));
console.log('+masterBalance all planets KB', (mbJson.length / 1024).toFixed(1));
console.log('+attack on gameplay subset KB', (atkJson.length / 1024).toFixed(1));

const withFabric = withFabricDailyAll(withMb);
const fabricJson = JSON.stringify({ byPlanetId: withFabric, globalMultipliers: { globalEngageHpMul: 1.05 } });
console.log('+economyFabric daily all planets KB', (fabricJson.length / 1024).toFixed(1));
console.log('avg bytes/planet boot', Math.round(bootJson.length / Object.keys(boot).length));
