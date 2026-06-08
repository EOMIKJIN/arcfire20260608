export type StageId =
  | 'title'
  | 'story'
  | 'pilot_registration'
  | 'main'
  | 'galaxy_map'
  | 'transit_combat'
  | 'transit_warp'
  | 'trade'
  | 'shipyard'
  | 'tavern'
  | 'skill_tree';

export type StageRouteName =
  | 'title'
  | 'nickname'
  | 'intro'
  | 'continue_warp'
  | 'planet'
  | 'worldmap'
  | 'combat'
  | 'trade'
  | 'shipyard'
  | 'tavern'
  | 'skilltree';

export interface StageDefinition {
  id: StageId;
  /** expo-router 파일 기준 route name (`app/(game)/*.tsx`) */
  routeName: StageRouteName;
  /** 기획 표시명(나중에 로컬라이즈/리네이밍 용) */
  displayName: string;
}
