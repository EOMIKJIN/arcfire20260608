/**
 * Macro economy SIM — F2P/Dolphin/Whale + in-app 수요 sim → overlay delta
 * npx tsx tools/economy-sim/run-economy-sim.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { EconomySimMacroPolicy_FROM_BALANCE_CSV } from '../../src/data/balance/generated/csvEconomySimMacroPolicy';
import {
  runMacroCohortSimulation,
  type MacroCohortPolicy,
} from '../../src/arcCore/economy/macroCohortSim';
import {
  pressureToTargetMultiplier,
  runVirtualMarketDemandSim,
} from '../../src/arcCore/economy/simMarketDemandEngine';
import {
  BALANCE_OVERLAY_DELTA_SCHEMA_VERSION,
  type BalanceOverlayDelta,
  type EconomySimKpiStatus,
} from '../../src/arcCore/economy/balanceOverlayDeltaTypes';
import type { AabsMultiplierKey } from '../../src/arcCore/aabs/aabsConstants';
import type { EconomyCategoryKey } from '../../src/arcCore/economy/economyPriceOverlayStore';
import { ECONOMY_CATEGORY_KEYS } from '../../src/arcCore/economy/economyPriceOverlayStore';

const ROOT = process.cwd();
const OUTBOX = path.join(ROOT, 'tools/economy-sim/outbox');
const REPORTS = path.join(ROOT, 'tools/economy-sim/reports');
const GENERATED_TS = path.join(ROOT, 'src/data/balance/generated/economySimOverlayDelta.ts');

const NUM_PLAYERS = 1000;
const COMBAT_WEIGHT = 0;

function macroPolicyNum(key: string, fallback: number): number {
  const row = EconomySimMacroPolicy_FROM_BALANCE_CSV.find((r) => r.key === key);
  const n = Number(row?.value);
  return Number.isFinite(n) ? n : fallback;
}

function loadMacroCohortPolicy(): MacroCohortPolicy {
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

function resolveKpiStatus(ratio: number): EconomySimKpiStatus {
  const warn = macroPolicyNum('whale_f2p_warn', 5);
  const critical = macroPolicyNum('whale_f2p_critical', 8);
  if (ratio >= critical) return 'critical';
  if (ratio >= warn) return 'warn';
  return 'ok';
}

function clampTargetMul(n: number): number {
  return Math.max(0.75, Math.min(1.25, n));
}

function buildCategoryTargets(
  demandSim: ReturnType<typeof runVirtualMarketDemandSim>,
): Partial<Record<EconomyCategoryKey, number>> {
  const categoryGain = macroPolicyNum('category_pressure_gain', 0.25);
  const mineralGain = macroPolicyNum('mineral_pressure_gain', 0.15);
  const out: Partial<Record<EconomyCategoryKey, number>> = {};
  for (const key of ECONOMY_CATEGORY_KEYS) {
    const pressure = demandSim.categoryPressures[key];
    const gain = key === 'mineral' ? mineralGain : categoryGain;
    out[key] = clampTargetMul(pressureToTargetMultiplier(pressure, gain));
  }
  return out;
}

function buildAabsTargets(
  ratio: number,
  status: EconomySimKpiStatus,
  demandSim: ReturnType<typeof runVirtualMarketDemandSim>,
): Partial<Record<AabsMultiplierKey, number>> {
  const out: Partial<Record<AabsMultiplierKey, number>> = {};
  const cphGap =
    demandSim.targetCreditsPerHour > 0
      ? demandSim.observedCreditsPerHour / demandSim.targetCreditsPerHour
      : 1;

  if (cphGap > 1) {
    const excess = Math.min(0.15, cphGap - 1);
    out.creditReward = clampTargetMul(1 - excess * 0.8);
    out.tradeIncome = clampTargetMul(1 - excess * 0.6);
  } else if (cphGap < 0.92) {
    out.creditReward = 1.02;
  }

  if (status === 'critical') {
    out.tradeIncome = Math.min(out.tradeIncome ?? 1, 0.96);
    out.creditReward = Math.min(out.creditReward ?? 1, 0.96);
  } else if (status === 'warn') {
    out.tradeIncome = Math.min(out.tradeIncome ?? 1, 0.985);
    out.creditReward = Math.min(out.creditReward ?? 1, 0.99);
  }

  if (ratio >= macroPolicyNum('whale_f2p_warn', 5)) {
    out.tradeIncome = Math.min(out.tradeIncome ?? 1, 0.98);
  }

  return out;
}

function bumpCategoryForWhaleGap(
  categoryTargetMul: Partial<Record<EconomyCategoryKey, number>>,
  status: EconomySimKpiStatus,
): void {
  if (status === 'ok') return;
  const bump = status === 'critical' ? 1.06 : 1.03;
  categoryTargetMul.luxury = clampTargetMul(Math.max(categoryTargetMul.luxury ?? 1, bump));
  categoryTargetMul.contraband = clampTargetMul(Math.max(categoryTargetMul.contraband ?? 1, bump));
  categoryTargetMul.weapon = clampTargetMul(Math.max(categoryTargetMul.weapon ?? 1, status === 'critical' ? 1.05 : 1.03));
  categoryTargetMul.capital_ship = clampTargetMul(Math.max(categoryTargetMul.capital_ship ?? 1, status === 'critical' ? 1.05 : 1.03));
  categoryTargetMul.mineral = clampTargetMul(Math.min(categoryTargetMul.mineral ?? 1, status === 'critical' ? 0.92 : 0.96));
}

function formatGeneratedTs(delta: BalanceOverlayDelta): string {
  return `// AUTO-GENERATED by npm run sim:economy — 수동 편집 금지
import type { BalanceOverlayDelta } from '../../../arcCore/economy/balanceOverlayDeltaTypes';

export const EconomySimOverlayDelta_FROM_SIM: BalanceOverlayDelta = ${JSON.stringify(delta, null, 2)};
`;
}

function writeReport(
  reportDir: string,
  delta: BalanceOverlayDelta,
  demandSim: ReturnType<typeof runVirtualMarketDemandSim>,
  cohortOrderValid: boolean,
): void {
  const md = `# Economy SIM Report — ${delta.generatedAt.slice(0, 10)}

## Macro cohort (${delta.simDays}d · n=${NUM_PLAYERS})

| 코호트 | 평균 power |
|--------|------------|
| F2P | ${delta.kpi.f2pAvgPower.toFixed(2)} |
| Dolphin | ${delta.kpi.dolphinAvgPower.toFixed(2)} |
| Whale | ${delta.kpi.whaleAvgPower.toFixed(2)} |
| Whale/F2P | **${delta.kpi.whaleToF2pPowerRatio.toFixed(2)}** (${delta.kpi.status}) |
| F2P < Dolphin < Whale | **${cohortOrderValid ? 'OK' : 'FAIL'}** |

## In-app demand sim (표본 ${demandSim.sampleCount})

- observed CPH: ${Math.round(demandSim.observedCreditsPerHour)}
- target CPH: ${Math.round(demandSim.targetCreditsPerHour)}

## Overlay delta (\`deltaId=${delta.deltaId}\`)

### categoryTargetMul
${JSON.stringify(delta.categoryTargetMul, null, 2)}

### aabsTargetMul
${JSON.stringify(delta.aabsTargetMul, null, 2)}

앱 일일 배치 시 \`ingestBalanceOverlayDeltaIfPending\` → AsyncStorage overlay 반영.
`;
  fs.writeFileSync(path.join(reportDir, 'summary.md'), md, 'utf8');
  fs.writeFileSync(path.join(reportDir, 'metrics.json'), JSON.stringify({ delta, demandSim }, null, 2), 'utf8');
}

function main(): void {
  const policy = loadMacroCohortPolicy();
  const { kpi } = runMacroCohortSimulation({ playerCount: NUM_PLAYERS, policy });

  const ratio = kpi.whaleToF2pPowerRatio;
  const status = resolveKpiStatus(ratio);

  const demandSim = runVirtualMarketDemandSim();
  const categoryTargetMul = buildCategoryTargets(demandSim);
  bumpCategoryForWhaleGap(categoryTargetMul, status);
  const aabsTargetMul = buildAabsTargets(ratio, status, demandSim);

  const now = new Date();
  const dayKey = now.toISOString().slice(0, 10);
  const delta: BalanceOverlayDelta = {
    schemaVersion: BALANCE_OVERLAY_DELTA_SCHEMA_VERSION,
    deltaId: `${dayKey}-${now.getTime()}`,
    generatedAt: now.toISOString(),
    simDays: policy.simDays,
    virtualPopulation: NUM_PLAYERS,
    combatWeight: COMBAT_WEIGHT,
    kpi: {
      f2pAvgPower: kpi.f2pAvgPower,
      dolphinAvgPower: kpi.dolphinAvgPower,
      whaleAvgPower: kpi.whaleAvgPower,
      whaleToF2pPowerRatio: ratio,
      status,
    },
    categoryTargetMul,
    aabsTargetMul,
  };

  fs.mkdirSync(OUTBOX, { recursive: true });
  fs.mkdirSync(REPORTS, { recursive: true });
  const reportDir = path.join(REPORTS, dayKey);
  fs.mkdirSync(reportDir, { recursive: true });

  fs.writeFileSync(path.join(OUTBOX, 'latest-delta.json'), JSON.stringify(delta, null, 2), 'utf8');
  fs.writeFileSync(GENERATED_TS, formatGeneratedTs(delta), 'utf8');
  writeReport(reportDir, delta, demandSim, kpi.cohortOrderValid);
  fs.writeFileSync(path.join(REPORTS, 'latest.md'), fs.readFileSync(path.join(reportDir, 'summary.md'), 'utf8'), 'utf8');

  console.log('[sim:economy] OK', {
    deltaId: delta.deltaId,
    kpi: delta.kpi.status,
    cohortOrder: kpi.cohortOrderValid ? 'OK' : 'FAIL',
    whaleToF2p: ratio.toFixed(2),
    f2p: kpi.f2pAvgPower.toFixed(2),
    dolphin: kpi.dolphinAvgPower.toFixed(2),
    whale: kpi.whaleAvgPower.toFixed(2),
  });

  if (!kpi.cohortOrderValid) {
    process.exitCode = 1;
  }
}

main();
