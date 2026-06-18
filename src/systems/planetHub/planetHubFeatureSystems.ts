import type { Href } from 'expo-router';
import { runThrottledPlanetHubNavigation } from '../../navigation/safePlanetHubNavigate';
import type { I18nParams } from '../../i18n/types';

type TranslateFn = (key: string, params?: I18nParams) => string;

type PlanetHubMenuPlanet = {
  hasTradePort: boolean;
  hasShipyard: boolean;
  hasTavern: boolean;
};

export type PlanetHubFeatureMenuItem = {
  id: string;
  label: string;
  /** 스캔 행과 동일한 유니코드·심볼 아이콘 슬롯 */
  icon: string;
  disabled?: boolean;
  showBadge?: boolean;
  primary?: boolean;
  onPress: () => void;
};

type PlanetHubFeatureContext = {
  planet: PlanetHubMenuPlanet | null | undefined;
  hasTradeBadge: boolean;
  clearTradeBadge: () => void;
  /** 시설 4곳 — 출발과 동일하게 메인스테이지 suspend·스냅샷 후 `router.push`. */
  onFacilityNavigate: (href: Href) => void;
  /** 출발 폴백 전용 (`onDeparture` 미지정 시). */
  push: (href: Href) => void;
  /**
   * 출발(은하지도 이동) 전용 훅. 채굴·전투 등 진행 중 상태를 안전 종료(스냅샷 후 정리)한 다음
   * `push('/(game)/worldmap')`을 직접 호출해야 한다. 미지정이면 기본 동작(스냅샷 없이 push)을 사용한다.
   */
  onDeparture?: () => void;
};

/**
 * 행성 허브 메뉴.
 *
 * 네비게이션 규칙:
 * - 모든 진입은 `push` (시설 4개 + 출발)
 *   → planet이 스택에 살아남아 Skia 캔버스가 안전하게 freeze된다 (Skia surface 해제 크래시 방지)
 * - 시설 나가기·worldmap ☰ 메뉴는 `back()` (useSafeRouterBack 사용)
 *   → planet으로 자연스럽게 pop 복귀
 * - 시설·출발 onPress 모두 700ms 글로벌 락(`runThrottledPlanetHubNavigation`)을 공유
 *   → react-native-screens 애니메이션 경합 방지
 */
export function buildPlanetHubFeatureMenuItems(
  ctx: PlanetHubFeatureContext,
  tr: TranslateFn,
): PlanetHubFeatureMenuItem[] {
  const hasTradePort = Boolean(ctx.planet?.hasTradePort);
  const hasShipyard = Boolean(ctx.planet?.hasShipyard);
  const hasTavern = Boolean(ctx.planet?.hasTavern);
  return [
    {
      id: 'trade',
      label: tr('hubMenu.trade'),
      icon: '🏪',
      disabled: !hasTradePort,
      showBadge: ctx.hasTradeBadge,
      onPress: () => {
        if (!hasTradePort) return;
        runThrottledPlanetHubNavigation(() => {
          ctx.clearTradeBadge();
          ctx.onFacilityNavigate('/(game)/trade');
        });
      },
    },
    {
      id: 'shipyard',
      label: tr('hubMenu.shipyard'),
      icon: '⚓',
      disabled: !hasShipyard,
      onPress: () => {
        if (!hasShipyard) return;
        runThrottledPlanetHubNavigation(() => ctx.onFacilityNavigate('/(game)/shipyard'));
      },
    },
    {
      id: 'tavern',
      label: tr('hubMenu.tavern'),
      icon: '🍺',
      disabled: !hasTavern,
      onPress: () => {
        if (!hasTavern) return;
        runThrottledPlanetHubNavigation(() => ctx.onFacilityNavigate('/(game)/tavern'));
      },
    },
    {
      id: 'skilltree',
      label: tr('hubMenu.skilltree'),
      icon: '⚗',
      onPress: () => {
        runThrottledPlanetHubNavigation(() => ctx.onFacilityNavigate('/(game)/skilltree'));
      },
    },
    {
      id: 'departure',
      label: tr('hubMenu.departure'),
      icon: '🚀',
      primary: true,
      onPress: () => {
        runThrottledPlanetHubNavigation(() => {
          if (ctx.onDeparture) {
            /** 채굴·전투 안전 종료(스냅샷 + sim refs 정리 setState) 후 push 까지 onDeparture 가 직접 책임진다. */
            ctx.onDeparture();
          } else {
            ctx.push('/(game)/worldmap' as Href);
          }
        });
      },
    },
  ];
}
