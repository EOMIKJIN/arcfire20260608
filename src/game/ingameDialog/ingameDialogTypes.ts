// ============================================================
// 범용 인게임 대화 — 타입·액션 계약 (Table-First CSV + 런타임 훅)
// ============================================================

import type { ImageSourcePropType } from 'react-native';
import type { StorySceneTriggerKey } from '../../types';
import type { IngameDialogSessionPack } from './ingameDialogSessionPack';

/** ArcOverlayHost narrative 파이프라인 단일 overlay id */
export const INGAME_DIALOG_OVERLAY_ID = 'ingame-dialog';

/** 보고형 자동 닫힘 — 마지막 페이지 vs 첫 창 무입력 */
export type IngameDialogAutoDismissMode = 'final_page' | 'first_idle';

/** 씬 종료 후 실행 — 미션·플래그·커스텀 연동 */
export type IngameDialogCompletionAction =
  | { type: 'mark_scene_seen'; sceneId: string }
  | { type: 'grant_mission_rewards'; missionId: string }
  | { type: 'start_mission'; missionId: string }
  /** 수락형 퀘스트(sandbox_*) — 바·허브 NPC */
  | { type: 'accept_quest_mission'; missionId: string; planetId: string; expectCaptainId?: string }
  /** 메인 스토리(story_*) — 허브 [대화] 수락 */
  | { type: 'accept_main_story_mission'; missionId: string; planetId: string; expectCaptainId?: string }
  /** @deprecated `accept_quest_mission` */
  | { type: 'accept_instance_mission'; missionId: string; planetId: string; expectCaptainId?: string }
  | { type: 'mark_intro_seen_and_start_first_mission' }
  | { type: 'complete_talk_npc'; captainId: string; planetId: string }
  | {
      type: 'record_orbit_comm';
      captainId: string;
      planetId: string;
      outcome: 'accept' | 'refuse_hostile' | 'refuse_unidentified' | 'refuse_talk_disabled';
      sceneId: string;
      writeId: string;
    }
  | { type: 'run_callback'; callbackId: string };

export type PresentIngameDialogOptions = {
  /** CSV completionPolicy 외 추가 액션 */
  completionActions?: IngameDialogCompletionAction[];
  /** dismiss 직후 1회 (UI 체인 — 웨이브 결과 등) */
  onDismiss?: () => void;
  /** once 씬 seenStorySceneIds 무시 (디버그·GM) */
  skipSeenCheck?: boolean;
  /** 텍스트 치환 컨텍스트 */
  context?: IngameDialogTextContext;
  /** ms 후 자동 dismiss — 생략/0=수동만. 보고형 기본은 마지막 페이지 완료 후 40초 */
  autoDismissMs?: number;
  /**
   * `final_page`(기본) — 마지막 보고가 끝난 뒤 타이머.
   * `first_idle` — 첫 창 오픈 직후 무입력 타이머. 만료 시 남은 페이지·대기 대사 전부 취소.
   */
  autoDismissMode?: IngameDialogAutoDismissMode;
  /** true — 화면 셸 대기 없이 즉시 present (내부 flush 전용) */
  bypassScreenShell?: boolean;
};

export type IngameDialogTextContext = {
  missionTitle?: string;
  missionTitleEn?: string;
  /** 퀘스트 완료 담당 NPC — [담당자] 토큰 + 초상 오버라이드(speakerNpcCaptainId보다 우선) */
  npcCaptainId?: string;
  npcName?: string;
  npcNameEn?: string;
  orbitCommVisitCount?: number;
  orbitCommLastPlanetName?: string;
  orbitCommLastPlanetNameEn?: string;
  orbitCommHadRefuse?: boolean;
};

/** CSV 없이 1회성 대화 (여관 폴백 등) */
export type AdHocIngameDialogPayload = {
  label: string;
  text: string;
  typewriterSpeedMs?: number;
  imageSource?: ImageSourcePropType;
  portraitScale?: number;
  buttonText?: string;
  /** inbound 등 수락형 통신 — [취소] 라벨 */
  secondaryButtonText?: string;
  /** true면 최종 단계 [수락]/[취소]. 취소는 onCancel만(메신저 열지 않음) */
  showAcceptCancelChoice?: boolean;
  completionActions?: IngameDialogCompletionAction[];
  onDismiss?: () => void | Promise<void>;
  /**
   * true — 진행 중 adhoc을 닫지 않고 같은 overlay에서 교체.
   * 바 턴 체인처럼 [다음] 직후 초상이 다시 뜨는 깜박임을 막는다.
   */
  replaceActiveAdhoc?: boolean;
  /** 수락형 통신 [취소] — completion·onDismiss 없이 종료 */
  onCancel?: () => void;
  /** STAGE 이탈 시 수락(메신저) 없이 닫기 — NL 통신 기본 */
  abortOnStageLeave?: boolean;
  /** ms 후 자동 dismiss — 생략/0=수동만 */
  autoDismissMs?: number;
  autoDismissMode?: IngameDialogAutoDismissMode;
  /** true — 화면 셸 대기 없이 즉시 present (내부 flush 전용) */
  bypassScreenShell?: boolean;
};

export type IngameDialogSession =
  | {
      kind: 'csv_scene';
      sceneId: string;
      pageIndex: number;
      segmentIndex: number;
      stepIndex?: number;
      pageComplete: boolean;
      ready?: boolean;
      pack?: IngameDialogSessionPack | null;
      completionActions: IngameDialogCompletionAction[];
      onDismiss?: () => void;
      context: IngameDialogTextContext;
      autoDismissMs?: number;
      autoDismissMode?: IngameDialogAutoDismissMode;
    }
  | {
      kind: 'adhoc';
      adhocId: string;
      segmentIndex: number;
      stepIndex?: number;
      pageComplete: boolean;
      ready?: boolean;
      pack?: IngameDialogSessionPack | null;
      payload: AdHocIngameDialogPayload;
    };

export type IngameDialogTriggerQuery = {
  triggerKey: StorySceneTriggerKey;
  targetId: string | null;
};
