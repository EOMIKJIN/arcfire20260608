import { arcCoreHub } from '../ArcCoreHub';
import { ArcCoreTerritorialCombatSubCore } from '../subcores/ArcCoreTerritorialCombatSubCore';

const TERRITORIAL_SUBCORE_ID = 'arc_core_territorial_combat_subcore';

/** 오프라인 catch-up 직후 — 60s probe 게이트 없이 접전 패스 재검사 */
export async function requestTerritorialCombatProbeAfterCatchUp(): Promise<void> {
  const sub = arcCoreHub.getSubCore(TERRITORIAL_SUBCORE_ID);
  if (!(sub instanceof ArcCoreTerritorialCombatSubCore)) return;
  await sub.probeAfterCatchUp();
}
