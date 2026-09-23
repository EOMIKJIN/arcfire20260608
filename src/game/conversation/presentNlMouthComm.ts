/**
 * NL 입 1차 통신 — 수락/[확인] 후에만 호출측이 메신저를 연다.
 * 게이트 2는 presentArcCoreBackchannel. 이 모듈은 메신저를 import 하지 않는다(순환 방지).
 */

import type { ImageSourcePropType } from 'react-native';
import { presentAdHocIngameDialog } from '../ingameDialog/ingameDialogApi';
import type { IngameDialogAutoDismissMode } from '../ingameDialog/ingameDialogTypes';
import { runAfterIngameDialogFeatureLinkDelay } from '../ingameDialog/ingameDialogFeatureLink';

export type PresentNlMouthCommInput = {
  label: string;
  text: string;
  imageSource?: ImageSourcePropType;
  portraitScale?: number;
  typewriterSpeedMs?: number;
  /** true면 [수락]/[취소]. inbound 선제 연락. */
  requireAccept?: boolean;
  buttonText?: string;
  secondaryButtonText?: string;
  onAccept: () => void | Promise<void>;
  onCancel?: () => void;
  /** 생략/0=수동만. 선제 자동팝업은 40초 + first_idle */
  autoDismissMs?: number;
  autoDismissMode?: IngameDialogAutoDismissMode;
};

export function presentNlMouthComm(input: PresentNlMouthCommInput): boolean {
  return presentAdHocIngameDialog({
    label: input.label,
    text: input.text,
    imageSource: input.imageSource,
    portraitScale: input.portraitScale,
    typewriterSpeedMs: input.typewriterSpeedMs ?? 42,
    buttonText: input.buttonText,
    secondaryButtonText: input.secondaryButtonText,
    showAcceptCancelChoice: input.requireAccept === true,
    onDismiss: () => {
      runAfterIngameDialogFeatureLinkDelay(() => {
        void input.onAccept();
      });
    },
    onCancel: input.onCancel,
    abortOnStageLeave: true,
    autoDismissMs: input.autoDismissMs,
    autoDismissMode: input.autoDismissMode,
  });
}
