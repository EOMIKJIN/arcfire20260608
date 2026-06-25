// ============================================================
// 아크코어 드론 캠페인 — 계정 초기화·앱 shutdown 연동
// ============================================================

import { arcCoreHub } from '../ArcCoreHub';
import { resetArcInboundDroneStore } from '../../store/arcInboundDroneStore';
import type { ArcInboundDroneSubCore } from '../subcores/ArcInboundDroneSubCore';

const INBOUND_DRONE_SUBCORE_ID = 'arc_inbound_drone_subcore';

export function resetArcInboundDroneCampaigns(): void {
  const sub = arcCoreHub.getSubCore(INBOUND_DRONE_SUBCORE_ID) as ArcInboundDroneSubCore | undefined;
  sub?.resetAllCampaigns();
  resetArcInboundDroneStore();
}
