import { Dimensions } from 'react-native';
import {
  NARRATIVE_DIALOG_LAYOUT,
  resolveNarrativeDialogCharsPerLine,
  type NarrativeDialogWidthInsets,
} from './narrativeDialogLayout';

export type NarrativeDialogSplitOptions = {
  windowWidth?: number;
  widthInsets?: NarrativeDialogWidthInsets;
};

function wrapHardLine(line: string, maxChars: number): string[] {
  const trimmed = line.trim();
  if (!trimmed) return [''];
  if (trimmed.length <= maxChars) return [trimmed];

  const rows: string[] = [];
  let rest = trimmed;
  while (rest.length > maxChars) {
    let cut = maxChars;
    const slice = rest.slice(0, maxChars + 1);
    const lastSpace = slice.lastIndexOf(' ');
    if (lastSpace > Math.floor(maxChars * 0.45)) {
      cut = lastSpace;
    }
    rows.push(rest.slice(0, cut).trimEnd());
    rest = rest.slice(cut).trimStart();
  }
  if (rest.length > 0) rows.push(rest);
  return rows;
}

function countVisualLines(chunk: string, charsPerLine: number): number {
  if (!chunk) return 0;
  let total = 0;
  for (const para of chunk.split('\n')) {
    if (!para) {
      total += 1;
      continue;
    }
    total += wrapHardLine(para, charsPerLine).length;
  }
  return total;
}

function splitWithCharsPerLine(
  text: string,
  maxLinesPerSegment: number,
  charsPerLine: number,
): string[] {
  const normalized = String(text ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!normalized) return [''];

  const visualLines: string[] = [];
  for (const para of normalized.split('\n')) {
    if (!para) {
      visualLines.push('');
      continue;
    }
    for (const row of wrapHardLine(para, charsPerLine)) {
      visualLines.push(row);
    }
  }

  const safeMax = Math.max(1, maxLinesPerSegment | 0);
  const chunks: string[] = [];
  for (let i = 0; i < visualLines.length; i += safeMax) {
    chunks.push(visualLines.slice(i, i + safeMax).join('\n'));
  }
  return chunks.length > 0 ? chunks : [''];
}

/**
 * 인게임 대화 세그먼트 — hud 실제 너비 기준 soft-wrap · 3줄 단위.
 * 가로를 임의로 줄이지 않는다. 3줄 초과 시에만 1글자씩 재분할(최대 2회).
 */
export function splitNarrativeDialogSegments(
  text: string,
  maxLinesPerSegment: number = NARRATIVE_DIALOG_LAYOUT.maxLinesDefault,
  options?: NarrativeDialogSplitOptions,
): string[] {
  const windowWidth = options?.windowWidth ?? Dimensions.get('window').width;
  const widthInsets = options?.widthInsets ?? {};

  let charsPerLine = resolveNarrativeDialogCharsPerLine(windowWidth, widthInsets);

  for (let attempt = 0; attempt < 3; attempt++) {
    const chunks = splitWithCharsPerLine(text, maxLinesPerSegment, charsPerLine);
    const fits = chunks.every(
      (chunk) => countVisualLines(chunk, charsPerLine) <= maxLinesPerSegment,
    );
    if (fits && chunks.length > 0) return chunks;
    charsPerLine = Math.max(10, charsPerLine - 1);
  }

  return splitWithCharsPerLine(text, maxLinesPerSegment, charsPerLine);
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
