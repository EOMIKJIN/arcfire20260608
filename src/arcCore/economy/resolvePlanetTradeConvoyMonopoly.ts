// ============================================================
// 행성 거래 독점 선단 표시 — 추후 팩션별 선단 CSV 확장
// ============================================================

import { getTransportFleetDisplayNameKo } from './planetUpkeepPolicy';
import { resolveOccupierFactionKindForHold } from './resolveFactionVault';
import { useClanWarFoundationStore } from '../../store/clanWarFoundationStore';

export function resolvePlanetTradeConvoyMonopolyLabel(planetId: string): string {
  const hold = useClanWarFoundationStore.getState().getHold(planetId);
  const faction = resolveOccupierFactionKindForHold(hold);
  if (faction === 'blue') {
    // 팩션별 선단 테이블 도입 전 — 아크 수송선단이 전 행성 중립 교역
    return getTransportFleetDisplayNameKo();
  }
  return getTransportFleetDisplayNameKo();
}
