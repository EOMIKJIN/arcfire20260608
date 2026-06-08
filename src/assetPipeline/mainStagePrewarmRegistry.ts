// ============================================================
// 메인 스테이지별 부하 분산 — 화면 포커스 직후 `InteractionManager` 뒤에 실행
// - Metro 번들: `require()` 로 서브모듈을 한 번 평가(이미 로드 시 즉시 반환)
// - 스테이지 전용 이미지는 `prefetchImageSources` + `listCriticalSessionImageSources` 패턴으로 확장
// ============================================================

import type { StageRouteName } from '../stages/types';

export type StageAssetPrewarmContext = {
  routeName: StageRouteName;
};

export type StageAssetPrewarmFn = (ctx: StageAssetPrewarmContext) => Promise<void>;

/** 포커스 직후 비동기 워밍 — 실패해도 인게임 동작은 유지 */
export const STAGE_ASSET_PREWARM_REGISTRY: Partial<Record<StageRouteName, StageAssetPrewarmFn>> = {
  planet: async () => {
    require('../npc/nearbyOrbitPresenceSystem');
    require('../components/planet/PlanetHubOrbitSkiaLayer');
  },
  worldmap: async () => {
    require('../data/systems');
  },
  trade: async () => {
    require('../store/itemLedgerStore');
  },
  shipyard: async () => {
    require('../data/ships');
  },
  skilltree: async () => {
    require('../data/skills');
  },
  combat: async () => {
    require('../combat');
  },
};
