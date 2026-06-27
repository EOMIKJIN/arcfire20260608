import type { ComponentProps } from 'react';
import type Ionicons from '@expo/vector-icons/Ionicons';
import type MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

type IonName = ComponentProps<typeof Ionicons>['name'];
type MciName = ComponentProps<typeof MaterialCommunityIcons>['name'];

/** 메인스테이지 액션 타일 — Sci-Fi 톤 MDI + Ionicons */
export type PlanetHubActionIconSpec =
  | { family: 'ionicons'; name: IonName }
  | { family: 'material-community'; name: MciName };

/** @deprecated use PlanetHubActionIconSpec */
export type PlanetHubActionIconName = IonName;

export const PLANET_HUB_ACTION_ICONS = {
  /** 무역소 — 궤도 물류·카고 스캔 */
  trade: { family: 'material-community', name: 'cube-scan' },
  /** 조선소 — 궤도 도크·정비 기지 */
  shipyard: { family: 'material-community', name: 'space-station' },
  /** 선술집 — 크루 라운지·홀로 coms */
  tavern: { family: 'material-community', name: 'account-voice' },
  /** 연구소 — 테크 트리·분기 */
  skilltree: { family: 'material-community', name: 'source-branch' },
  /** 출발 — 함대 상륙 */
  departure: { family: 'material-community', name: 'rocket-launch-outline' },
  planetInfo: { family: 'material-community', name: 'database-outline' },
  planetDev: { family: 'material-community', name: 'city-variant-outline' },
  planetDevSatellite: { family: 'material-community', name: 'satellite-variant' },
  scan: { family: 'material-community', name: 'radar' },
  mining: { family: 'material-community', name: 'pickaxe' },
  dialog: { family: 'material-community', name: 'message-processing-outline' },
  search: { family: 'material-community', name: 'magnify-scan' },
} as const satisfies Record<string, PlanetHubActionIconSpec>;
