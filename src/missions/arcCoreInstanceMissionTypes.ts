/** ArcCore AI 자동 생성 인스턴스 미션 — 선술집 신규 의뢰 보드 (Table-First 템플릿 clone). */

export const ARC_CORE_INSTANCE_MISSION_ID_PREFIX = 'arc_inst_';

export const ARC_CORE_INSTANCE_BOARD_MAX = 7;

/** 상위 카테고리 태그 — 향후 타입 확장 시 CSV/정책과 동기화. */
export type ArcCoreInstanceMissionCategoryTag =
  | 'delivery'
  | 'combat'
  | 'bounty'
  | 'travel'
  | 'trade'
  | 'explore'
  | 'mixed';

export type ArcCoreInstanceMissionBoardStatus = 'listed' | 'accepted' | 'cleared';

export type ArcCoreInstanceMissionBoardEntry = {
  instanceId: string;
  templateMissionId: string;
  categoryTag: ArcCoreInstanceMissionCategoryTag;
  offerPlanetId: string;
  offerCaptainId: string | null;
  registeredAtMs: number;
  dayKeyKst: string;
  boardStatus: ArcCoreInstanceMissionBoardStatus;
  /** 수락 전 NPC 브리핑 대화 (향후 talk_npc 목표와 연동). */
  briefingDialogSceneId?: string | null;
};

export type ArcCoreInstanceMissionBoardState = {
  entries: ArcCoreInstanceMissionBoardEntry[];
  lastRegistrationDayKeyKst: string | null;
  cycleStartedAtMs: number;
};

export type ArcCoreInstanceMissionDailyPassResult = {
  ran: boolean;
  registered: boolean;
  refreshed: boolean;
  instanceId: string | null;
  reason: string;
};
