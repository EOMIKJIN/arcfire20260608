// ============================================================
// 행성개발 비용 — 플레이어 크레딧 vs 아크코어 금고
// ============================================================

import { usePlayerStore } from '../../store/playerStore';
import { useArcCoreVaultStore } from '../../store/factionVault/arcCoreVaultStore';
import { ARC_CORE_CENTRAL_BANK_TXN_KIND } from '../economy/arcCoreCentralBank';
import type { PlanetDevFundingSource } from '../../game/planetDevelopment/planetDevelopmentActionOptions';

export type PlanetDevSpendMeta = {
  planetId?: string;
  moduleId?: string;
  note?: string;
};

export function spendPlanetDevelopmentCredits(
  amount: number,
  source: PlanetDevFundingSource,
  meta?: PlanetDevSpendMeta,
): boolean {
  const credits = Math.floor(amount);
  if (credits <= 0) return true;

  if (source === 'player') {
    const ok = usePlayerStore.getState().spendCredits(credits);
    if (ok) void usePlayerStore.getState().persist();
    return ok;
  }

  return useArcCoreVaultStore.getState().trySpend(credits, {
    kind: ARC_CORE_CENTRAL_BANK_TXN_KIND.spendPlanetDevelopment,
    planetId: meta?.planetId,
    note: meta?.note ?? `arc_planet_dev ${meta?.planetId ?? ''} ${meta?.moduleId ?? ''}`.trim(),
  });
}

export function refundPlanetDevelopmentCredits(
  amount: number,
  source: PlanetDevFundingSource,
): void {
  const credits = Math.floor(amount);
  if (credits <= 0) return;

  if (source === 'player') {
    usePlayerStore.getState().addCredits(credits);
    void usePlayerStore.getState().persist();
    return;
  }

  useArcCoreVaultStore.getState().appendInflow(credits, {
    kind: 'arc_planet_dev_refund',
    note: 'arc_planet_dev_refund',
  });
}

export function resolvePlanetDevFundingBalance(source: PlanetDevFundingSource): number {
  if (source === 'player') {
    return usePlayerStore.getState().player?.credits ?? 0;
  }
  return useArcCoreVaultStore.getState().getBalance();
}
