/** 엔진이 넣은 `\n`을 고정 행 슬롯에 펼친다. RN 추가 wrap이 4행을 만들지 못하게 한다. */
export function mapTypewriterDisplayToLineSlots(displayed: string, maxLines: number): string[] {
  const rows = String(displayed ?? '').split('\n');
  const cap = Math.max(1, maxLines | 0);
  const out: string[] = new Array(cap);
  for (let i = 0; i < cap; i += 1) out[i] = rows[i] ?? '';
  return out;
}
