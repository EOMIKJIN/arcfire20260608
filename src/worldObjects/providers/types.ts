import type { WorldObject, WorldObjectKind } from '../types';

/** 행성별 월드오브젝트 프로바이더 입력 — 각 행성 `planetId`로 인스턴스 구분 */
export type PlanetWorldObjectProviderContext = {
  planetId: string;
  systemId: string;
};

/**
 * 행성 단위 오브젝트 소스 — 종류별 도메인 모듈이 구현·등록.
 * 추후 CSV/런타임 개수·상태는 프로바이더 내부 또는 instance runtime 병합.
 */
export type PlanetWorldObjectProvider = {
  /** 디버그·무효화 식별 */
  id: string;
  kinds: readonly WorldObjectKind[];
  list: (ctx: PlanetWorldObjectProviderContext) => WorldObject[];
};
