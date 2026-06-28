// ============================================================
// 범용 인게임 대화 — 타입·액션 계약 (Table-First CSV + 런타임 훅)
// ============================================================

import type { ImageSourcePropType } from 'react-native';
import type { StorySceneTriggerKey } from '../../types';

/** ArcOverlayHost narrative 파이프라인 단일 overlay id */
export const INGAME_DIALOG_OVERLAY_ID = 'ingame-dialog';

/** 씬 종료 후 실행 — 미션·플래그·커스텀 연동 */
export type IngameDialogCompletionAction =
  | { type: 'mark_scene_seen'; sceneId: string }
  | { type: 'grant_mission_rewards'; missionId: string }
  | { type: 'start_mission'; missionId: string }
  /** 수락형 퀘스트(sandbox_*) — 선술집·허브 NPC */
  | { type: 'accept_quest_mission'; missionId: string; planetId: string; expectCaptainId?: string }
  /** @deprecated `accept_quest_mission` */
  | { type: 'accept_instance_mission'; missionId: string; planetId: string; expectCaptainId?: string }
  | { type: 'mark_intro_seen_and_start_first_mission' }
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
};

export type IngameDialogTextContext = {
  missionTitle?: string;
  missionTitleEn?: string;
};

/** CSV 없이 1회성 대화 (여관 폴백 등) */
export type AdHocIngameDialogPayload = {
  label: string;
  text: string;
  typewriterSpeedMs?: number;
  imageSource?: ImageSourcePropType;
  portraitScale?: number;
  buttonText?: string;
  completionActions?: IngameDialogCompletionAction[];
  onDismiss?: () => void;
};

export type IngameDialogSession =
  | {
      kind: 'csv_scene';
      sceneId: string;
      pageIndex: number;
      segmentIndex: number;
      pageComplete: boolean;
      completionActions: IngameDialogCompletionAction[];
      onDismiss?: () => void;
      context: IngameDialogTextContext;
    }
  | {
      kind: 'adhoc';
      adhocId: string;
      pageComplete: boolean;
      payload: AdHocIngameDialogPayload;
    };

export type IngameDialogTriggerQuery = {
  triggerKey: StorySceneTriggerKey;
  targetId: string | null;
};
