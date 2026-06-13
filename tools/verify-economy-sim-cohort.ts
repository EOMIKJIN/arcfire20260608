/**
 * Macro cohort F2P < Dolphin < Whale 검증
 * npx tsx tools/verify-economy-sim-cohort.ts
 */
import { EconomySimMacroPolicy_FROM_BALANCE_CSV } from '../src/data/balance/generated/csvEconomySimMacroPolicy';
import {
  runMacroCohortSimulation,
  type MacroCohortPolicy,
} from '../src/arcCore/economy/macroCohortSim';

function macroPolicyNum(key: string, fallback: number): number {
  const row = EconomySimMacroPolicy_FROM_BALANCE_CSV.find((r) => r.key === key);
  const n = Number(row?.value);
  return Number.isFinite(n) ? n : fallback;
}

function loadPolicy(): MacroCohortPolicy {
  return {
    simDays: 30,
    goldPerHour: 150,
    itemCostGold: 1000,
    itemCostGems: 100,
    powerPerItem: 0.5,
    f2pOptimalHours: macroPolicyNum('f2p_optimal_hours', 5),
    f2pExcessHourEfficiency: macroPolicyNum('f2p_excess_hour_efficiency', 0.25),
    dolphinGemEfficiency: macroPolicyNum('dolphin_gem_efficiency', 1.5),
    dolphinRestedPlayThreshold: macroPolicyNum('dolphin_rested_play_threshold', 2.5),
    dolphinRestedBonus: macroPolicyNum('dolphin_rested_bonus', 1.25),
    dolphinPowerMul: macroPolicyNum('dolphin_power_mul', 1.12),
    whalePowerLogDivisor: macroPolicyNum('whale_power_log_divisor', 10),
    mineralSinkPerPowerUnit: macroPolicyNum('mineral_sink_per_power_unit', 3),
    mineralIncomePerHour: macroPolicyNum('mineral_income_per_hour', 12),
  };
}

const policy = loadPolicy();
const seeds = [42, 1337, 20260613];
let failed = false;

for (const seed of seeds) {
  const { kpi } = runMacroCohortSimulation({ playerCount: 2000, policy, seed });
  const ok = kpi.cohortOrderValid;
  console.log(
    `[${ok ? 'OK' : 'FAIL'}] seed=${seed} F2P=${kpi.f2pAvgPower.toFixed(2)} Dolphin=${kpi.dolphinAvgPower.toFixed(2)} Whale=${kpi.whaleAvgPower.toFixed(2)} ratio=${kpi.whaleToF2pPowerRatio.toFixed(2)}`,
  );
  if (!ok) failed = true;
}

if (failed) {
  console.error('verify-economy-sim-cohort: cohort order check failed');
  process.exit(1);
}
console.log('verify-economy-sim-cohort: all checks passed');
