// ============================================================
// 일 1회 — 군사·함선·함장·R&D 프록시 오펙스
// 삽입: planetCoreGaugeComposition 직후 · 트렌드 커밋 직전
// 틱·부트·타이틀 금지. 라이브 시 시드 위 spendUpToBalance만.
// ============================================================

import { planetAttackKstDayKey } from '../planetAttack/planetAttackKstDayKey';
import { useArcCoreVaultStore } from '../../store/factionVault/arcCoreVaultStore';
import { useBlueTeamSharedVaultStore } from '../../store/factionVault/blueTeamSharedVaultStore';
import { useNeutralNationVaultStore } from '../../store/factionVault/neutralNationVaultStore';
import { usePlayerIndependentNationVaultStore } from '../../store/factionVault/playerIndependentNationVaultStore';
import { useArcCoreTransportFleetBankStore } from '../../store/factionVault/arcCoreTransportFleetBankStore';
import { useClanWarFoundationStore } from '../../store/clanWarFoundationStore';
import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';
import type { FactionVaultState } from '../../store/factionVault/createFactionVaultStore';
import {
  getArcCoreTransportFleetSeedCredits,
  getArcCoreVaultSeedCredits,
  getBlueTeamVaultSeedCredits,
} from './planetUpkeepPolicy';
import {
  emptyFiscalOpexVaultMap,
  resolveArcCoreFiscalOpexPolicy,
  type ArcCoreFiscalOpexVaultKey,
} from './arcCoreFiscalOpexPolicy';
import {
  computeArcCoreFiscalOpexRequested,
  computeResidualForSurplus,
  spendableAboveSeed,
} from './computeArcCoreFiscalOpexProxy';
import { gatherArcCoreFiscalOpexInputs } from './gatherArcCoreFiscalOpexInputs';
import { ensureConvoyRamCargoRestored, summarizeConvoyRamCargo } from './runArcTransportTradePass';
import {
  applyFiscalOpexCoeffHints,
  hydrateFiscalOpexCoeffOverlay,
  scaleFiscalOpexPolicyCoeffs,
} from './fiscalOpexCoeffOverlay';
import { persistFiscalOpexHudSnapshot } from './fiscalOpexSnapshot';

export type ArcCoreFiscalOpexPassResult = {
  ran: boolean;
  kstDayKey: string;
  shadow: boolean;
  requestedSum: number;
  spentSum: number;
  shortfallSum: number;
  residualRequested: number;
  residualSpent: number;
  f7RamCargoLots: number;
  f7RamCargoBuyCredits: number;
  orbitUsed: number;
  captainCount: number;
};

type VaultHandle = Pick<FactionVaultState, 'hydrate' | 'getBalance' | 'spendUpToBalance' | 'recordAudit'>;

function vaultFor(key: ArcCoreFiscalOpexVaultKey): VaultHandle {
  if (key === 'blue') return useBlueTeamSharedVaultStore.getState();
  if (key === 'neutral') return useNeutralNationVaultStore.getState();
  if (key === 'independent') return usePlayerIndependentNationVaultStore.getState();
  if (key === 'fleet') return useArcCoreTransportFleetBankStore.getState();
  return useArcCoreVaultStore.getState();
}

function seedFor(key: ArcCoreFiscalOpexVaultKey): number {
  if (key === 'blue') return getBlueTeamVaultSeedCredits();
  if (key === 'fleet') return getArcCoreTransportFleetSeedCredits();
  if (key === 'neutral' || key === 'independent') return 0;
  return getArcCoreVaultSeedCredits();
}

async function hydrateFiscalOpexStores(): Promise<void> {
  if (!usePlanetCoreRuntimeStore.getState().hydrated) {
    await usePlanetCoreRuntimeStore.getState().bootstrapFromWorldAsync();
  }
  if (!useClanWarFoundationStore.getState().hydrated) {
    await useClanWarFoundationStore.getState().loadLocalClanWarFoundation();
  }
  if (!useArcCoreVaultStore.getState().hydrated) await useArcCoreVaultStore.getState().hydrate();
  if (!useBlueTeamSharedVaultStore.getState().hydrated) await useBlueTeamSharedVaultStore.getState().hydrate();
  if (!useNeutralNationVaultStore.getState().hydrated) await useNeutralNationVaultStore.getState().hydrate();
  if (!usePlayerIndependentNationVaultStore.getState().hydrated) {
    await usePlayerIndependentNationVaultStore.getState().hydrate();
  }
  if (!useArcCoreTransportFleetBankStore.getState().hydrated) {
    await useArcCoreTransportFleetBankStore.getState().hydrate();
  }
}

function applyLine(
  key: ArcCoreFiscalOpexVaultKey,
  amount: number,
  kind: string,
  shadow: boolean,
  kstDayKey: string,
): { spent: number; shortfall: number } {
  const requested = Math.max(0, Math.floor(amount));
  if (requested <= 0) return { spent: 0, shortfall: 0 };
  const vault = vaultFor(key);
  const cap = spendableAboveSeed(vault.getBalance(), seedFor(key));
  const target = Math.min(requested, cap);
  const note = `fiscal_opex ${kind} vault=${key} kst=${kstDayKey} req=${requested} cap=${cap} shadow=${shadow}`;
  if (shadow) {
    vault.recordAudit(`${kind}_shadow`, { note });
    return { spent: 0, shortfall: requested };
  }
  const result = vault.spendUpToBalance(target, { kind, note });
  return { spent: result.spent, shortfall: requested - result.spent };
}

export async function runArcCoreFiscalOpexPass(): Promise<ArcCoreFiscalOpexPassResult> {
  const kstDayKey = planetAttackKstDayKey();
  const empty: ArcCoreFiscalOpexPassResult = {
    ran: false,
    kstDayKey,
    shadow: true,
    requestedSum: 0,
    spentSum: 0,
    shortfallSum: 0,
    residualRequested: 0,
    residualSpent: 0,
    f7RamCargoLots: 0,
    f7RamCargoBuyCredits: 0,
    orbitUsed: 0,
    captainCount: 0,
  };

  const policy = resolveArcCoreFiscalOpexPolicy();
  if (!policy.enabled) return empty;

  await hydrateFiscalOpexStores();
  await hydrateFiscalOpexCoeffOverlay();
  await ensureConvoyRamCargoRestored();

  const redBal = useArcCoreVaultStore.getState().getBalance();
  const fleetBal = useArcCoreTransportFleetBankStore.getState().getBalance();
  const redSeed = seedFor('red');
  const fleetSeed = seedFor('fleet');
  const overlay = applyFiscalOpexCoeffHints(policy, kstDayKey, {
    redMultiple: redSeed > 0 ? redBal / redSeed : 0,
    fleetMultiple: fleetSeed > 0 ? fleetBal / fleetSeed : 0,
  });
  const scaled = scaleFiscalOpexPolicyCoeffs(policy, overlay);

  const gathered = gatherArcCoreFiscalOpexInputs();
  const requested = computeArcCoreFiscalOpexRequested(gathered, scaled);
  const f7 = summarizeConvoyRamCargo();
  const fleetOpex = computeResidualForSurplus(
    spendableAboveSeed(fleetBal, fleetSeed),
    policy.fleetOpexOfSurplusPct,
  );

  const keys: ArcCoreFiscalOpexVaultKey[] = ['red', 'blue', 'neutral', 'independent', 'fleet'];
  const lines: Array<{ key: ArcCoreFiscalOpexVaultKey; amount: number; kind: string }> = [];
  for (const key of keys) {
    lines.push({ key, amount: requested.military[key], kind: 'fiscal_opex_military' });
    lines.push({ key, amount: requested.ship[key], kind: 'fiscal_opex_ship' });
    lines.push({ key, amount: requested.captain[key], kind: 'fiscal_opex_captain' });
    lines.push({ key, amount: requested.rd[key], kind: 'fiscal_opex_rd' });
  }
  if (fleetOpex > 0) {
    lines.push({ key: 'fleet', amount: fleetOpex, kind: 'fiscal_opex_fleet' });
  }

  let spentSum = 0;
  let shortfallSum = 0;
  for (const line of lines) {
    const applied = applyLine(line.key, line.amount, line.kind, policy.shadowMode, kstDayKey);
    spentSum += applied.spent;
    shortfallSum += applied.shortfall;
  }

  const residualReq = emptyFiscalOpexVaultMap();
  let residualRequested = 0;
  let residualSpent = 0;
  if (policy.residualSurplusPct > 0) {
    for (const key of keys) {
      const remaining = spendableAboveSeed(vaultFor(key).getBalance(), seedFor(key));
      const amt = computeResidualForSurplus(remaining, policy.residualSurplusPct);
      residualReq[key] = amt;
      residualRequested += amt;
      const applied = applyLine(key, amt, 'fiscal_opex_residual', policy.shadowMode, kstDayKey);
      residualSpent += applied.spent;
      spentSum += applied.spent;
      shortfallSum += applied.shortfall;
    }
  }

  const requestedSum = requested.requestedSum + residualRequested + fleetOpex;
  await persistFiscalOpexHudSnapshot({
    kstDayKey,
    shadow: policy.shadowMode,
    requestedSum,
    spentSum,
    captainCount: requested.captainCount,
    laboratoryLevelSum: requested.laboratoryLevelSum,
    kCap: scaled.kCap,
    kRd: scaled.kRd,
    kMilMul: overlay.kMilMul,
    kShipMul: overlay.kShipMul,
  });

  if (__DEV__) {
    console.log(
      `[ArcCore/FiscalOpex] day=${kstDayKey} shadow=${policy.shadowMode} req=${requestedSum} spent=${spentSum} residualReq=${residualRequested} fleetOpex=${fleetOpex} f7lots=${f7.lots} f7buy=${f7.buyCredits} orbit=${requested.orbitUsed} capn=${requested.captainCount}`,
    );
  }

  return {
    ran: true,
    kstDayKey,
    shadow: policy.shadowMode,
    requestedSum,
    spentSum,
    shortfallSum,
    residualRequested,
    residualSpent,
    f7RamCargoLots: f7.lots,
    f7RamCargoBuyCredits: f7.buyCredits,
    orbitUsed: requested.orbitUsed,
    captainCount: requested.captainCount,
  };
}
