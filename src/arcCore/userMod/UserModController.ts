// ============================================================
// UserMod / Governor — `5.Arcfire_Integrated_Master_Spec_v1.0.md` §2.1
// ============================================================

import { dispatchArcCoreCommand } from '../ArcCoreCommandBus';
import { useAabsPolicyStore, type AabsGlobalMultipliers } from '../aabs/aabsPolicyStore';
import type { AabsMultiplierKey } from '../aabs/aabsConstants';

export type GovernorPolicyChoice = 'security' | 'free_trade' | 'tech_prospecting';

const POLICY_SHIFTS: Record<GovernorPolicyChoice, Partial<AabsGlobalMultipliers>> = {
  security: { expReward: 1.05, combatDifficulty: 1.05, tradeIncome: 0.98 },
  free_trade: { tradeIncome: 1.05, creditReward: 1.03, combatDifficulty: 0.98 },
  tech_prospecting: { dropWeight: 1.05, miningYield: 1.04, expReward: 1.02 },
};

export class UserModController {
  applyPolicyShift(choice: GovernorPolicyChoice, planetId: string): void {
    const shift = POLICY_SHIFTS[choice];
    const store = useAabsPolicyStore.getState();
    if (store.safeModeEnabled) return;

    (Object.keys(shift) as AabsMultiplierKey[]).forEach((key) => {
      const target = shift[key as keyof typeof shift];
      if (target != null) store.applyStepToward(key, target);
    });

    void store.persistAsync();

    if (choice === 'security') {
      dispatchArcCoreCommand({
        type: 'npc_gather_planet',
        planetId,
        meta: { origin: 'arc_core_policy', reason: 'governor_security' },
      });
    }
  }

  /** 번영 비콘 — 채굴·드랍 보정 */
  deployProsperityBeacon(_planetId: string): void {
    const store = useAabsPolicyStore.getState();
    store.applyStepToward('miningYield', (store.multipliers.miningYield ?? 1) * 1.05);
    store.applyStepToward('dropWeight', (store.multipliers.dropWeight ?? 1) * 1.05);
    void store.persistAsync();
  }

  /** 유인 비콘 — NPC gather */
  deployLureBeacon(planetId: string): void {
    dispatchArcCoreCommand({
      type: 'npc_gather_planet',
      planetId,
      meta: { origin: 'arc_core_policy', reason: 'beacon_lure' },
    });
  }
}

export const userModController = new UserModController();

export function applyPolicyShift(choice: GovernorPolicyChoice, planetId: string): void {
  userModController.applyPolicyShift(choice, planetId);
}
