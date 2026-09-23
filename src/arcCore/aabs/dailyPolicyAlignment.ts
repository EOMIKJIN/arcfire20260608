// ============================================================
// Daily Policy Alignment — AABS §3 (Observe→Analyze→Write→Verify)
// ============================================================

import { AABS_DAILY_ALIGNMENT_MS } from './aabsConstants';
import { useAabsPolicyStore } from './aabsPolicyStore';
import { runSimBot200Engine } from './simBotEngine';
import { applyGrowthSyncFromSim, syncEconomicMultipliers } from './growthSyncEngine';
import { activateGuardianSafeMode, evaluateGuardianMode } from './guardianMode';
import { reloadBalanceOverlayIndices } from './reloadBalanceIndices';

export type DailyAlignmentResult = {
  ran: boolean;
  simBots: number;
  deploymentMoves: number;
  guardianTriggered: boolean;
  multipliers: Record<string, number>;
};

export function shouldRunDailyAlignment(nowMs = Date.now()): boolean {
  const last = useAabsPolicyStore.getState().lastAlignmentAt;
  if (!last) return true;
  return nowMs - last >= AABS_DAILY_ALIGNMENT_MS;
}

/** Observe → Analyze → Write → Verify */
export async function runDailyPolicyAlignment(force = false): Promise<DailyAlignmentResult> {
  const store = useAabsPolicyStore.getState();
  if (!force && !shouldRunDailyAlignment()) {
    return {
      ran: false,
      simBots: 0,
      deploymentMoves: 0,
      guardianTriggered: false,
      multipliers: store.multipliers,
    };
  }

  reloadBalanceOverlayIndices();

  const expMul = store.getEffectiveMultiplier('expReward');
  const creditMul = store.getEffectiveMultiplier('creditReward');
  const sim = runSimBot200Engine(expMul, creditMul);

  const guardian = evaluateGuardianMode(sim);
  if (guardian.triggered) {
    activateGuardianSafeMode(guardian.reason);
    await store.persistAsync();
    return {
      ran: true,
      simBots: sim.bots.length,
      deploymentMoves: 0,
      guardianTriggered: true,
      multipliers: useAabsPolicyStore.getState().multipliers,
    };
  }

  applyGrowthSyncFromSim(sim);
  syncEconomicMultipliers();
  /**
   * NPC 재배치는 여기서 실행하지 않는다.
   * `enforceNpcDeploymentPolicy` → `npc_gather_planet` 은 유인 비콘·총독 security 전용이며
   * AiNpcSubCore가 **궤도 수송선 전부**를 한 행성으로 리셋한다. 일일 AABS에 붙이면
   * 정오마다 허브 트래픽이 한 행성으로 몰리는 부작용이 난다.
   */

  store.markAlignment();
  await store.persistAsync();

  return {
    ran: true,
    simBots: sim.bots.length,
    deploymentMoves: 0,
    guardianTriggered: false,
    multipliers: useAabsPolicyStore.getState().multipliers,
  };
}
