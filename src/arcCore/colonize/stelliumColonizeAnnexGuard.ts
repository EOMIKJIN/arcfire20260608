import type { StelliumColonizeRecord } from './stelliumColonizeTypes';

/** 편입(블루)된 행성의 진행 중 개척만. success 장부는 제외. */
export function collectAnnexedColonizeArrivalIds(
  records: Readonly<Record<string, Pick<StelliumColonizeRecord, 'phase'> | undefined>>,
  isAnnexedBlue: (planetId: string) => boolean,
): string[] {
  const out: string[] = [];
  const keys = Object.keys(records);
  for (let i = 0; i < keys.length; i += 1) {
    const id = keys[i];
    const row = records[id];
    if (!row || row.phase === 'success') continue;
    if (isAnnexedBlue(id)) out.push(id);
  }
  return out;
}
