/**
 * 전투 종료 출력 — 단일 파이프라인 (웨이브 · 허브 궤도 · 이동중 공통)
 *
 * 고정 순서: 결과창 → 미션 클리어 대사 → 레벨업 → (조기 종료 훅) → 알림 → 백채널 → 완료
 * 패배 인앱대사는 호출부가 이 함수 전에 await 한다 (1순위).
 * 순서 정본은 `combatEndOutcomePlan.planCombatEndOutcomeSteps`.
 *
 * 전 단계를 `onClose` 콜백으로 잇는다. 폴링(`while + delay`) 금지.
 */

import { t } from '../../i18n';
import { isIngameDialogActive } from '../ingameDialog/ingameDialogApi';
import { runAfterIngameDialogIdleNow } from '../ingameDialog/ingameDialogIdle';
import { tryPresentPendingMissionClearDialog } from '../../missions/presentPendingMissionClearDialog';
import { showArcAlert } from '../../utils/showArcAlert';
import { setCombatEndOutcomeHold } from './combatEndOutcomeHold';
import {
  presentCombatResultOverlay,
  presentPendingCombatLevelUpThen,
  type PresentCombatResultInput,
} from './presentCombatResultOverlay';

export {
  COMBAT_END_OUTCOME_STEPS,
  planCombatEndOutcomeSteps,
} from './combatEndOutcomePlan';
export type { CombatEndOutcomeStep } from './combatEndOutcomePlan';

export type CombatEndNotice = {
  title: string;
  body: string;
};

export type RunCombatEndOutcomeFlowInput = {
  /** 결과 카드 payload — `onClose` 는 파이프라인이 채운다 */
  result: Omit<PresentCombatResultInput, 'onClose'>;
  /** 결과창이 닫힌 직후 1회 — 경험치 지급·store reset 등 */
  onResultClosed?: () => void;
  /**
   * 결과창 닫힌 뒤 · 미션 대사 전. `true` 면 미션을 건너뛰고 레벨업·이후만 진행.
   * (예: RED 점유 행성 퇴거 — 미션 대사를 띄우면 안 되는 경우)
   */
  shouldSkipMissionClear?: () => boolean;
  /**
   * 레벨업 뒤 · 알림 전. `true` 면 이후 단계를 건너뛰고 종료.
   * (예: RED 점유 행성 퇴거 — 남은 연출을 띄우면 안 되는 경우)
   */
  shouldStopAfterLevelUp?: () => boolean;
  /** 미션 클리어 대사 시도 여부. 기본 true */
  missionClearEnabled?: boolean;
  /** 격침·파손 등 알림. null 이면 건너뜀 */
  notice?: CombatEndNotice | null;
  /** 아크코어 전투종료 백채널. null 이면 건너뜀 */
  onBackchannel?: (() => void) | null;
  /** 전 단계 종료 후 1회 */
  onFinished?: () => void;
};

export function runCombatEndOutcomeFlow(input: RunCombatEndOutcomeFlowInput): void {
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    setCombatEndOutcomeHold(false);
    input.onFinished?.();
  };

  const runBackchannel = () => {
    input.onBackchannel?.();
    finish();
  };

  const runNotice = () => {
    const notice = input.notice;
    if (!notice) {
      runBackchannel();
      return;
    }
    // 버튼 1개 + onPress 면 40초 자동 닫힘도 `dismiss_then_press` 로 같은 콜백을 태운다
    showArcAlert(notice.title, notice.body, [
      { text: t('combat.confirm'), onPress: runNoticeClosed },
    ]);
  };

  function runNoticeClosed(): void {
    runBackchannel();
  }

  const runLevelUpAndLater = () => {
    presentPendingCombatLevelUpThen(() => {
      if (input.shouldStopAfterLevelUp?.() === true) {
        finish();
        return;
      }
      runNotice();
    });
  };

  const runMissionClear = () => {
    if (
      input.missionClearEnabled === false
      || input.shouldSkipMissionClear?.() === true
    ) {
      runLevelUpAndLater();
      return;
    }
    // 이미 인앱대사가 열려 있으면 tryPresent 를 부르지 않는다.
    // idleNow — feature-link 지연·행성 세션 dispose 로 레벨업/이탈이 끊기지 않게.
    if (isIngameDialogActive()) {
      runAfterIngameDialogIdleNow(runMissionClear);
      return;
    }
    if (tryPresentPendingMissionClearDialog()) {
      runAfterIngameDialogIdleNow(runMissionClear);
      return;
    }
    runLevelUpAndLater();
  };

  setCombatEndOutcomeHold(true);
  let resultClosed = false;
  presentCombatResultOverlay({
    ...input.result,
    onClose: () => {
      if (resultClosed) return;
      resultClosed = true;
      input.onResultClosed?.();
      runMissionClear();
    },
  });
}
