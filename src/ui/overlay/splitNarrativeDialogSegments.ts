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
 * 인게임 대화 세그먼트 — 박스 가로폭 산술 soft-wrap · 최대 3행.
 * CSV·작성 `\n` 규칙은 없다(인게임은 공백으로 정규화 후 엔진만 접음).
 * 3행까지 채우고, 넘는 줄은 다음 페이지로 `[ 다음 ]`만 넘긴다.
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
