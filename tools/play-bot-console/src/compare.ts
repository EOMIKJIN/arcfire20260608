import fs from 'node:fs';
import type { KpiSnapshot } from './types';

export type CompareDelta = {
  field: keyof KpiSnapshot;
  bot: number;
  human: number;
  delta: number;
};

/** 대표님 실기 KPI 스냅샷과 봇 종료 KPI 비교. 세이브 파일은 읽지 않음. */
export function compareKpi(bot: KpiSnapshot, humanPath: string): CompareDelta[] | { error: string } {
  if (!fs.existsSync(humanPath)) return { error: `snapshot missing: ${humanPath}` };
  let human: KpiSnapshot;
  try {
    human = JSON.parse(fs.readFileSync(humanPath, 'utf8')) as KpiSnapshot;
  } catch {
    return { error: 'snapshot parse fail' };
  }
  const fields: (keyof KpiSnapshot)[] = [
    'level',
    'totalExp',
    'credits',
    'blue',
    'red',
    'neutral',
    'combatWins',
    'trades',
    'annexOk',
    'colonizeOk',
    'questCleared',
  ];
  const out: CompareDelta[] = [];
  for (let i = 0; i < fields.length; i += 1) {
    const f = fields[i];
    const b = Number(bot[f] ?? 0);
    const h = Number(human[f] ?? 0);
    out.push({ field: f, bot: b, human: h, delta: b - h });
  }
  return out;
}

export function formatCompare(rows: CompareDelta[]): string {
  const lines = ['field,bot,human,delta'];
  for (const r of rows) lines.push(`${r.field},${r.bot},${r.human},${r.delta}`);
  return lines.join('\n');
}
