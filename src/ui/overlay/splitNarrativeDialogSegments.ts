import { Dimensions } from 'react-native';
import {
  NARRATIVE_DIALOG_LAYOUT,
  resolveNarrativeDialogCharsPerLine,
  type NarrativeDialogWidthInsets,
} from './narrativeDialogLayout';
import {
  countNarrativeDialogVisualLines,
  splitNarrativeDialogSegmentsCore,
} from './splitNarrativeDialogSegmentsCore';

export type NarrativeDialogSplitOptions = {
  windowWidth?: number;
  widthInsets?: NarrativeDialogWidthInsets;
  /** 테스트 전용 — 넘기면 폭 계산·재분할을 건너뜀 */
  charsPerLine?: number;
};

export {
  isNarrativeDialogContextBreak,
  narrativeDialogPagesFitLineBudget,
  splitNarrativeDialogSegmentsCore,
} from './splitNarrativeDialogSegmentsCore';

/**
 * 인게임 대화 세그먼트 — hud 실제 너비 기준 soft-wrap · 2~3줄.
 * 빈 줄은 표시하지 않고, 가능하면 문장 경계에서 페이지를 넘긴다.
 * 초상은 상단이라 본문 너비에서 빼지 않는다. 3줄 초과 시에만 1글자씩 재분할(최대 2회).
 * 작성 `\n` 존중. 폭을 넘는 작성 줄은 시각 줄로 페이지 분할(3줄 박스 초과 금지).
 */
export function splitNarrativeDialogSegments(
  text: string,
  maxLinesPerSegment: number = NARRATIVE_DIALOG_LAYOUT.maxLinesDefault,
  options?: NarrativeDialogSplitOptions,
): string[] {
  if (options?.charsPerLine != null) {
    return splitNarrativeDialogSegmentsCore(text, maxLinesPerSegment, options.charsPerLine);
  }

  const windowWidth = options?.windowWidth ?? Dimensions.get('window').width;
  const widthInsets = options?.widthInsets ?? {};

  let charsPerLine = resolveNarrativeDialogCharsPerLine(windowWidth, widthInsets);

  for (let attempt = 0; attempt < 3; attempt++) {
    const chunks = splitNarrativeDialogSegmentsCore(text, maxLinesPerSegment, charsPerLine);
    const fits = chunks.every(
      (chunk) => countNarrativeDialogVisualLines(chunk, charsPerLine) <= maxLinesPerSegment,
    );
    if (fits && chunks.length > 0) return chunks;
    charsPerLine = Math.max(10, charsPerLine - 1);
  }

  return splitNarrativeDialogSegmentsCore(text, maxLinesPerSegment, charsPerLine);
}

export function narrativeDialogSegmentCount(
  text: string,
  options?: NarrativeDialogSplitOptions,
): number {
  return Math.max(
    1,
    splitNarrativeDialogSegments(text, NARRATIVE_DIALOG_LAYOUT.maxLinesDefault, options).length,
  );
}

/** IngameDialogHost ↔ store 세그먼트 카운트 동기용 */
let activeSplitOptions: NarrativeDialogSplitOptions | undefined;

export function setActiveNarrativeDialogSplitOptions(
  options: NarrativeDialogSplitOptions | undefined,
): void {
  activeSplitOptions = options;
}

export function getActiveNarrativeDialogSplitOptions(): NarrativeDialogSplitOptions {
  return (
    activeSplitOptions ?? {
      windowWidth: Dimensions.get('window').width,
      widthInsets: {},
    }
  );
}
