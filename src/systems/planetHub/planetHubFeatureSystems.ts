import type { Href } from 'expo-router';
import { runThrottledPlanetHubNavigation } from '../../navigation/safePlanetHubNavigate';
import type { I18nParams } from '../../i18n/types';
import { runPlanetHubSubmenuPreflight } from '../../ui/heavyUiDataSession/preflightPlanetHubFacility';
import { PLANET_HUB_ACTION_ICONS, type PlanetHubActionIconSpec } from '../../ui/tactical/planetHubActionIcons';

type TranslateFn = (key: string, params?: I18nParams) => string;

type PlanetHubMenuPlanet = {
  hasTradePort: boolean;
  hasShipyard: boolean;
  hasTavern: boolean;
  hasResearchLab: boolean;
};

export type PlanetHubFeatureMenuItem = {
  id: string;
  label: string;
  /** Sci-Fi MDI 심볼 */
  icon: PlanetHubActionIconSpec;
  disabled?: boolean;
  showBadge?: boolean;
  primary?: boolean;
  onPress: () => void;
};

type PlanetHubFeatureContext = {
  planetId: string | null;
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
  const hasResearchLab = Boolean(ctx.planet?.hasResearchLab);
  return [
    {
      id: 'trade',
      label: tr('hubMenu.trade'),
      icon: PLANET_HUB_ACTION_ICONS.trade,
      disabled: !hasTradePort,
      showBadge: ctx.hasTradeBadge,
      onPress: () => {
        if (!hasTradePort) return;
        if (!runPlanetHubSubmenuPreflight('trade', ctx.planetId)) return;
        runThrottledPlanetHubNavigation(() => {
          ctx.clearTradeBadge();
          ctx.onFacilityNavigate('/(game)/trade');
        });
      },
    },
    {
      id: 'shipyard',
      label: tr('hubMenu.shipyard'),
      icon: PLANET_HUB_ACTION_ICONS.shipyard,
      disabled: !hasShipyard,
      onPress: () => {
        if (!hasShipyard) return;
        if (!runPlanetHubSubmenuPreflight('shipyard', ctx.planetId)) return;
        runThrottledPlanetHubNavigation(() => ctx.onFacilityNavigate('/(game)/shipyard'));
      },
    },
    {
      id: 'tavern',
      label: tr('hubMenu.tavern'),
      icon: PLANET_HUB_ACTION_ICONS.tavern,
      disabled: !hasTavern,
      onPress: () => {
        if (!hasTavern) return;
        if (!runPlanetHubSubmenuPreflight('tavern', ctx.planetId)) return;
        runThrottledPlanetHubNavigation(() => ctx.onFacilityNavigate('/(game)/tavern'));
      },
    },
    {
      id: 'skilltree',
      label: tr('hubMenu.skilltree'),
      icon: PLANET_HUB_ACTION_ICONS.skilltree,
      disabled: !hasResearchLab,
      onPress: () => {
        if (!hasResearchLab) return;
        if (!runPlanetHubSubmenuPreflight('research_lab', ctx.planetId)) return;
        runThrottledPlanetHubNavigation(() => ctx.onFacilityNavigate('/(game)/skilltree'));
      },
    },
    {
      id: 'departure',
      label: tr('hubMenu.departure'),
      icon: PLANET_HUB_ACTION_ICONS.departure,
      primary: true,
      onPress: () => {
        if (!runPlanetHubSubmenuPreflight('departure', ctx.planetId)) return;
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
