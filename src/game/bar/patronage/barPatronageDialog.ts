// ============================================================
// 바 후원 대화 — 스크립트 폴백 + 향후 NL 연계 슬롯
// ============================================================

import type { ImageSourcePropType } from 'react-native';
import type { BarDialogTurnCsvRow } from '../../../data/generated/csvBarPatronage';
import { translate } from '../../../i18n';
import { presentAdHocIngameDialog } from '../../ingameDialog/ingameDialogApi';
import { getIngameDialogLeaveAbortGen } from '../../ingameDialog/ingameDialogLeaveAbort';
import { listHostDialogTurns, resolveBarAttendantHelloOverlay } from './barPatronageTables';
import {
  resolveBarAttendantPortraitById,
  resolveBarHostPortraitByCaptainId,
} from './barPatronagePortrait';

export type BarNlResolveContext = {
  planetId: string;
  attendantId?: string;
  hostCaptainId?: string;
  speechAct: string;
  nlTopicId: string;
  locale: 'ko' | 'en';
};

/**
 * 향후 ArcCore/자연어 채널이 붙을 때 이 함수만 교체·확장한다.
 * 현재는 항상 null → 스크립트 textKo/En 사용.
 */
export type BarNlLineResolver = (
  ctx: BarNlResolveContext,
) => string | null | Promise<string | null>;

let nlLineResolver: BarNlLineResolver | null = null;

/** 테스트·향후 NL 브리지 등록 */
export function registerBarPatronageNlResolver(resolver: BarNlLineResolver | null): void {
  nlLineResolver = resolver;
}

export function resolveBarDialogLineSync(
  turn: BarDialogTurnCsvRow,
  locale: 'ko' | 'en',
  attendantId?: string,
): string {
  if (turn.speechAct === 'attendant_hello') {
    const overlay = resolveBarAttendantHelloOverlay(attendantId, locale);
    if (overlay) return overlay;
  }
  return locale === 'en' ? turn.textEn || turn.textKo : turn.textKo || turn.textEn;
}

/**
 * delivery=nl_preferred 이면 resolver 시도 후 폴백.
 * 동기 UI 경로용 — async NL은 presentBarDialogTurnAsync 사용.
 */
export async function resolveBarDialogLine(
  turn: BarDialogTurnCsvRow,
  ctx: Omit<BarNlResolveContext, 'speechAct' | 'nlTopicId'>,
): Promise<string> {
  const fallback = resolveBarDialogLineSync(turn, ctx.locale, ctx.attendantId);
  if (turn.delivery !== 'nl_preferred' || !nlLineResolver) return fallback;
  try {
    const nl = await nlLineResolver({
      ...ctx,
      speechAct: turn.speechAct,
      nlTopicId: turn.nlTopicId,
    });
    const trimmed = typeof nl === 'string' ? nl.trim() : '';
    return trimmed || fallback;
  } catch {
    return fallback;
  }
}

function resolveTurnPortrait(
  turn: BarDialogTurnCsvRow,
  attendantId?: string,
  hostCaptainId?: string,
): ImageSourcePropType | undefined {
  if (turn.speakerRole === 'host') {
    return resolveBarHostPortraitByCaptainId(hostCaptainId);
  }
  if (turn.speakerRole === 'attendant') {
    return resolveBarAttendantPortraitById(attendantId);
  }
  return (
    resolveBarAttendantPortraitById(attendantId) ??
    resolveBarHostPortraitByCaptainId(hostCaptainId)
  );
}

export async function presentBarDialogTurns(params: {
  turns: readonly BarDialogTurnCsvRow[];
  locale: 'ko' | 'en';
  label: string;
  planetId: string;
  attendantId?: string;
  hostCaptainId?: string;
  onDismiss?: () => void;
}): Promise<void> {
  const { turns, locale, label } = params;
  if (turns.length === 0) {
    params.onDismiss?.();
    return;
  }

  let i = 0;
  const leaveGen = getIngameDialogLeaveAbortGen();
  const showNext = async () => {
    if (getIngameDialogLeaveAbortGen() !== leaveGen) return;
    if (i >= turns.length) {
      params.onDismiss?.();
      return;
    }
    const turn = turns[i]!;
    i += 1;
    const text = await resolveBarDialogLine(turn, {
      locale,
      planetId: params.planetId,
      attendantId: params.attendantId,
      hostCaptainId: params.hostCaptainId,
    });
    if (getIngameDialogLeaveAbortGen() !== leaveGen) return;
    const isLast = i >= turns.length;
    const imageSource = resolveTurnPortrait(turn, params.attendantId, params.hostCaptainId);
    const presented = presentAdHocIngameDialog({
      label: `${label} · ${turn.speechAct}`,
      text,
      buttonText: isLast ? translate(locale, 'dialog.ok') : translate(locale, 'dialog.next'),
      imageSource,
      autoDismissMs: 0,
      replaceActiveAdhoc: true,
      bypassScreenShell: true,
      onDismiss: () => showNext(),
    });
    if (!presented) {
      if (__DEV__) {
        console.log('[bar/patronage] presentAdHoc busy — dialog chain abort');
      }
      params.onDismiss?.();
    }
  };

  await showNext();
}

/** 호스트 맞이 2턴(인사+술요청) 텍스트 — 선택지는 UI에서 처리 */
export function pickHostOfferTurns(): BarDialogTurnCsvRow[] {
  return listHostDialogTurns().filter(
    (t) => t.speechAct === 'host_greet' || t.speechAct === 'host_ask_drink',
  );
}
