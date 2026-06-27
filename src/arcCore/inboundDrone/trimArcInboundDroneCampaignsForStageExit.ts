import { arcCoreHub } from '../ArcCoreHub';
import type { ArcInboundDroneSubCore } from '../subcores/ArcInboundDroneSubCore';

const INBOUND_DRONE_SUBCORE_ID = 'arc_inbound_drone_subcore';

/**
 * STAGE 이탈(허브→worldmap, worldmap→허브) — 드론 캠페인 Map·스냅샷 정리.
 * 6/25~26 캠페인 보존 정책으로 off-hub 에도 Map 이 남아 Native/JS floor 상승 → keep 1행성만 유지.
 */
export function trimArcInboundDroneCampaignsForStageExit(keepPlanetId: string | null): void {
  const sub = arcCoreHub.getSubCore(INBOUND_DRONE_SUBCORE_ID) as ArcInboundDroneSubCore | undefined;
  sub?.trimCampaignsForStageExit(keepPlanetId);
}
