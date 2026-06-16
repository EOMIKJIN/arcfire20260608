import type { StageDefinition, StageId, StageRouteName } from './types';

export const STAGES: Record<StageRouteName, StageDefinition> = {
  title: {
    id: 'title',
    routeName: 'title',
    displayName: '시작',
  },
  character_select: {
    id: 'pilot_registration',
    routeName: 'character_select',
    displayName: '캐릭터 선택',
  },
  nickname: {
    id: 'pilot_registration',
    routeName: 'nickname',
    displayName: '닉네임 생성',
  },
  intro: {
    id: 'story',
    routeName: 'intro',
    displayName: '스토리',
  },
  continue_warp: {
    id: 'transit_warp',
    routeName: 'continue_warp',
    displayName: '항로 진입',
  },
  planet: {
    id: 'main',
    routeName: 'planet',
    displayName: '메인스테이지',
  },
  worldmap: {
    id: 'galaxy_map',
    routeName: 'worldmap',
    displayName: '은하계 지도',
  },
  combat: {
    id: 'transit_combat',
    routeName: 'combat',
    displayName: '이동중 전투',
  },
  trade: {
    id: 'trade',
    routeName: 'trade',
    displayName: '무역소',
  },
  shipyard: {
    id: 'shipyard',
    routeName: 'shipyard',
    displayName: '조선소',
  },
  tavern: {
    id: 'tavern',
    routeName: 'tavern',
    displayName: '선술집',
  },
  skilltree: {
    id: 'skill_tree',
    routeName: 'skilltree',
    displayName: '연구소',
  },
};

export function getStageByRouteName(routeName: StageRouteName): StageDefinition {
  return STAGES[routeName];
}

export function getStageById(id: StageId): StageDefinition | undefined {
  return Object.values(STAGES).find((s) => s.id === id);
}
