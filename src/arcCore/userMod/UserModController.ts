// ============================================================
// UserMod / Governor — Daily Ops 관측 큐 경유 (v3.1: 실시간 AABS 금지)
// ============================================================

import { dispatchArcCoreCommand } from '../ArcCoreCommandBus';
import { enqueueDailyOpsObservation, type GovernorPolicyChoice } from './dailyOpsObservationQueue';

export type { GovernorPolicyChoice };

export class UserModController {
  applyPolicyShift(choice: GovernorPolicyChoice, planetId: string): void {
    void enqueueDailyOpsObservation({
      kind: 'governor_policy',
      choice,
      planetId,
      observedAt: Date.now(),
    });

    if (choice === 'security') {
      dispatchArcCoreCommand({
        type: 'npc_gather_planet',
        planetId,
        meta: { origin: 'arc_core_policy', reason: 'governor_security' },
      });
    }
  }

  /** 번영 비콘 — AABS는 다음 Daily Ops 배치에서 반영 */
  deployProsperityBeacon(planetId: string): void {
    void enqueueDailyOpsObservation({
      kind: 'prosperity_beacon',
      planetId,
      observedAt: Date.now(),
    });
  }

  /** 유인 비콘 — NPC gather (연출·명령 축, AABS 아님) */
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
