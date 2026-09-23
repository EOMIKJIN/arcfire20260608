// ============================================================
// 행성 거래 독점 선단 표시 — 추후 팩션별 선단 CSV 확장
// ============================================================

import { resolveOccupierFactionKindForHold } from './resolveFactionVault';
import { useClanWarFoundationStore } from '../../store/clanWarFoundationStore';
import { resolveTransportFleetDisplayName } from '../../i18n/transportFleetText';
import { useAppSettingsStore } from '../../store/appSettingsStore';
import type { AppLocale } from '../../i18n/types';

export function resolvePlanetTradeConvoyMonopolyLabel(
  planetId: string,
  locale: AppLocale = useAppSettingsStore.getState().locale,
): string {
  const hold = useClanWarFoundationStore.getState().getHold(planetId);
  const faction = resolveOccupierFactionKindForHold(hold);
  // 팩션별 선단 테이블 도입 전 — 아크 수송선단이 전 행성 중립 교역
  if (faction === 'blue') {
    return resolveTransportFleetDisplayName(locale);
  }
  return resolveTransportFleetDisplayName(locale);
}
