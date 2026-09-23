/**
 * 인게임 대사 페이지 분할 순수 로직 (RN 없음).
 * 공개 API는 `splitNarrativeDialogSegments.ts`.
 *
 * 작성 `\n`은 그대로 존중한다.
 * 한 작성 줄이 폭을 넘기면 시각 줄 비용으로 페이지를 나누고, 넘친 줄은 엔진 `\n`으로 고정한다.
 * 3줄 박스를 넘는 페이지는 만들지 않는다(CSV 수동 줄바꿈 없이 자동 대응).
 */

const MIN_LINES_PER_PAGE = 2;
const ASCII_UNIT = 0.62;
const SPACE_UNIT = 0.35;

function isWideDialogChar(code: number): boolean {
  return (
    (code >= 0x1100 && code <= 0x11ff)
    || (code >= 0x2e80 && code <= 0x9fff)
    || (code >= 0xac00 && code <= 0xd7af)
    || (code >= 0xf900 && code <= 0xfaff)
    || (code >= 0x3040 && code <= 0x30ff)
    || (code >= 0xff01 && code <= 0xff60)
    || (code >= 0xffe0 && code <= 0xffe6)
  );
}

function dialogCharUnit(ch: string): number {
  const code = ch.codePointAt(0) ?? 0;
  if (isWideDialogChar(code)) return 1;
  if (ch === ' ' || ch === '\t') return SPACE_UNIT;
  return ASCII_UNIT;
}

export function measureNarrativeDialogLineUnits(text: string): number {
  let units = 0;
  for (const ch of text) units += dialogCharUnit(ch);
  return units;
}

function findMaxFitIndex(text: string, maxUnits: number): number {
  let units = 0;
  let index = 0;
  for (const ch of text) {
    const next = units + dialogCharUnit(ch);
    if (next > maxUnits) return Math.max(1, index);
    units = next;
    index += ch.length;
  }
  return text.length;
}

function isGoodBreakAfter(text: string, lastIncluded: number): boolean {
  const ch = text[lastIncluded];
  if (!ch) return false;
  if (/\s/.test(ch)) return true;
  if (/[.,!?。！？…、，·:;"'」』”’)\]\}>]/.test(ch)) return true;
  const prefix = text.slice(0, lastIncluded + 1);
  if (/(으로|부터|까지|에서|에게|처럼|보다)$/.test(prefix)) return true;
  return /(은|는|이|가|을|를|에|의|와|과|도|만|로|고|며|요|다|까|군|네|죠)$/.test(prefix);
}

function findPreferredCut(text: string, maxIndex: number): number {
  const minIndex = Math.max(1, Math.floor(maxIndex * 0.45));
  for (let i = maxIndex; i >= minIndex; i--) {
    if (isGoodBreakAfter(text, i - 1)) return i;
  }
  return maxIndex;
}

function wrapHardLine(line: string, maxUnits: number): string[] {
  const trimmed = line.trim();
  if (!trimmed) return [];
  const limit = Math.max(1, maxUnits);
  if (measureNarrativeDialogLineUnits(trimmed) <= limit) return [trimmed];

  const rows: string[] = [];
  let rest = trimmed;
  while (measureNarrativeDialogLineUnits(rest) > limit) {
    const maxIndex = findMaxFitIndex(rest, limit);
    let cut = findPreferredCut(rest, maxIndex);
    const leftover = rest.slice(cut).trimStart();
    if (leftover.length > 0 && measureNarrativeDialogLineUnits(leftover) < 2) {
      const pulled = findPreferredCut(rest, Math.max(1, maxIndex - 1));
      if (pulled >= Math.floor(maxIndex * 0.45) && pulled < cut) cut = pulled;
    }
    const row = rest.slice(0, cut).trimEnd();
    if (!row) {
      const hard = Math.max(1, maxIndex);
      rows.push(rest.slice(0, hard));
      rest = rest.slice(hard).trimStart();
      continue;
    }
    rows.push(row);
    rest = rest.slice(cut).trimStart();
  }
  if (rest.length > 0) rows.push(rest);
  return rows;
}

/** 이 줄에서 페이지를 넘겨도 문맥이 비교적 안전한지 */
export function isNarrativeDialogContextBreak(line: string): boolean {
  const t = line.trim();
  if (!t) return true;
  if (/[.!?。！？…]$/.test(t)) return true;
  if (/[.!?。！？…]["'」』”’)]$/.test(t)) return true;
  if (/(습니다|습니까|십시오|세요|니다|니까|이다|인가|다|요|까|군|네|죠)[.,!?。！？…]*$/.test(t)) {
    return true;
  }
  return false;
}

export function countNarrativeDialogVisualLines(chunk: string, charsPerLine: number): number {
  if (!chunk) return 0;
  let total = 0;
  for (const para of chunk.split('\n')) {
    if (!para.trim()) continue;
    total += wrapHardLine(para, charsPerLine).length;
  }
  return total;
}

function packVisualLines(visualLines: string[], maxLines: number, joinWith: string): string[] {
  if (visualLines.length === 0) return [''];
  const safeMax = Math.max(1, maxLines | 0);
  const chunks: string[] = [];
  let i = 0;
  while (i < visualLines.length) {
    const remaining = visualLines.length - i;
    if (remaining <= safeMax) {
      chunks.push(visualLines.slice(i).join(joinWith));
      break;
    }

    let take = safeMax;
    if (safeMax >= MIN_LINES_PER_PAGE) {
      const endAtMin = isNarrativeDialogContextBreak(visualLines[i + MIN_LINES_PER_PAGE - 1] ?? '');
      const endAtMax = isNarrativeDialogContextBreak(visualLines[i + safeMax - 1] ?? '');
      if (remaining === safeMax + 1 && !endAtMax) {
        take = MIN_LINES_PER_PAGE;
      } else if (endAtMin && !endAtMax) {
        take = MIN_LINES_PER_PAGE;
      }
    }

    chunks.push(visualLines.slice(i, i + take).join(joinWith));
    i += take;
  }
  return chunks;
}

/** 실제 접힌 시각 줄 수. 문장 종료여도 2줄이면 비용 2 — 3줄 박스 초과 금지. */
function authorLinePackCost(_raw: string, rows: string[]): number {
  return Math.max(1, rows.length);
}

function itemDisplayText(raw: string, rows: string[]): string {
  if (rows.length <= 1) return raw;
  return rows.join('\n');
}

export function narrativeDialogPagesFitLineBudget(
  pages: string[],
  maxLines: number,
  charsPerLine: number,
): boolean {
  const safeMax = Math.max(1, maxLines | 0);
  return pages.every((page) => countNarrativeDialogVisualLines(page, charsPerLine) <= safeMax);
}

export function splitNarrativeDialogSegmentsCore(
  text: string,
  maxLinesPerSegment: number,
  charsPerLine: number,
): string[] {
  const normalized = String(text ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();

  if (!normalized) return [''];

  const paras = normalized.split('\n').map((p) => p.trim()).filter(Boolean);
  if (paras.length === 0) return [''];
  const safeMax = Math.max(1, maxLinesPerSegment | 0);
  const items = paras.map((raw) => {
    const rows = wrapHardLine(raw, charsPerLine);
    return { raw, rows, cost: authorLinePackCost(raw, rows) };
  });

  if (items.every((it) => it.cost === 1)) {
    if (items.length <= safeMax) return [paras.join('\n')];
    return packVisualLines(paras, safeMax, '\n');
  }

  const chunks: string[] = [];
  let page: string[] = [];
  let used = 0;

  const flush = () => {
    if (page.length === 0) return;
    chunks.push(page.join('\n'));
    page = [];
    used = 0;
  };

  for (const item of items) {
    if (item.cost <= safeMax) {
      if (used + item.cost > safeMax && page.length > 0) flush();
      page.push(itemDisplayText(item.raw, item.rows));
      used += item.cost;
      continue;
    }
    if (page.length > 0) flush();
    for (const part of packVisualLines(item.rows, safeMax, '\n')) {
      chunks.push(part);
    }
  }
  flush();
  const result = chunks.length > 0 ? chunks : [''];
  if (narrativeDialogPagesFitLineBudget(result, safeMax, charsPerLine)) return result;

  const visualRows: string[] = [];
  for (let i = 0; i < paras.length; i += 1) {
    const rows = wrapHardLine(paras[i]!, charsPerLine);
    for (let j = 0; j < rows.length; j += 1) visualRows.push(rows[j]!);
  }
  return packVisualLines(visualRows, safeMax, '\n');
}
