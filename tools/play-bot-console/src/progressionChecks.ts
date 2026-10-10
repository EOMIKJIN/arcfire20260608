/**
 * 밸런싱 안정화 감시 (대표님 2026-10-10) — 레벨 = 들인 플레이 시간 기준으로
 *  ① 첫 상위 함선 구매 레벨이 사다리 목표 창(구매 가능 Lv ~ 목표 Lv+2) 안인가
 *  ② 레벨 시간 절벽(벤치 cliffs)
 *  ③ 5레벨 구간마다 새로 살·배울 것(함선·무기·장비·스킬)이 있는가 — 테이블 정적 점검
 */
import { CapitalHullPurchasePolicy_FROM_BALANCE_CSV } from '../../../src/data/balance/generated/csvCapitalHullPurchasePolicy';
import { CAPITAL_WEAPON_LIST_FROM_CSV } from '../../../src/data/generated/csvWeapons';
import { ITEM_DEFS_FROM_CSV } from '../../../src/data/generated/csvItemDefs';
import { SKILLS_FROM_CSV } from '../../../src/data/generated/csvSkills';
import { PLAYER_LEVEL_EXP_FROM_CSV } from '../../../src/data/generated/csvPlayerLevelExp';

export type CheckState = 'OK' | 'RISK' | 'WAIT';

type Ladder = { key: string; step: number; unlock: number; target: number };

export function ladderSteps(): Ladder[] {
  return CapitalHullPurchasePolicy_FROM_BALANCE_CSV
    .filter((r) => String(r.ladderListed ?? '').toUpperCase() === 'TRUE' && String(r.ladderStep ?? '') !== '')
    .map((r) => ({ key: r.hullTierKey, step: Number(r.ladderStep), unlock: Number(r.requiredPilotLevelMin), target: Number(r.targetPurchaseLevel) }))
    .sort((a, b) => a.step - b.step);
}

/** ① 첫 상위 함선 구매 레벨 — 사다리 1단계 창 */
export function checkHullBuyWindow(avg: { level: number; hullBuyLevel?: number; hullBuySeeds?: number }): { state: CheckState; detail: string } {
  const first = ladderSteps().find((s) => s.step > 0);
  if (!first) return { state: 'WAIT', detail: '사다리 없음' };
  const hi = first.target + 2;
  const buy = avg.hullBuyLevel ?? -1;
  if (buy < 0) {
    return avg.level >= hi
      ? { state: 'RISK', detail: `${first.key} 미구매 — 평균 L${avg.level} (목표 창 L${first.unlock}~${hi})` }
      : { state: 'OK', detail: `아직 창 이전 (평균 L${avg.level} · 창 L${first.unlock}~${hi})` };
  }
  const ok = buy >= first.unlock && buy <= hi;
  return { state: ok ? 'OK' : 'RISK', detail: `${first.key} 첫 구매 L${buy} (창 L${first.unlock}~${hi} · ${avg.hullBuySeeds ?? '?'}시드)` };
}

/** ② 레벨 시간 절벽 */
export function checkLevelCliffs(cliffs: string[] | undefined): { state: CheckState; detail: string } {
  if (!cliffs) return { state: 'WAIT', detail: '벤치에 레벨 시간 기록 없음(다음 벤치부터)' };
  return cliffs.length === 0
    ? { state: 'OK', detail: '레벨 시간 절벽 없음' }
    : { state: 'RISK', detail: `레벨 시간 절벽 ${cliffs.join(' ')}` };
}

/** ③ 5레벨 구간마다 새 성장 요소 수 — 0인 구간은 RISK */
export function checkContentBands(): { state: CheckState; detail: string; empty: string[] } {
  const maxLv = PLAYER_LEVEL_EXP_FROM_CSV.reduce((m, r) => Math.max(m, Number(r.level) || 0), 1);
  const counts = new Map<number, number>();
  const add = (lv: number) => {
    if (!Number.isFinite(lv) || lv < 1 || lv > maxLv) return;
    const b = Math.floor((lv - 1) / 5);
    counts.set(b, (counts.get(b) ?? 0) + 1);
  };
  for (const s of ladderSteps()) if (s.step > 0) add(s.unlock);
  for (const w of Object.values(CAPITAL_WEAPON_LIST_FROM_CSV)) if (w.tradePortListed && w.specialUse === '') add(w.requiredLevel);
  for (const it of Object.values(ITEM_DEFS_FROM_CSV)) {
    if (it.type !== 'ship_equipment' || !it.tradeable) continue;
    add(Number((it.attrs as Record<string, unknown> | undefined)?.equipmentRequiredLevel ?? 1));
  }
  for (const s of Object.values(SKILLS_FROM_CSV)) add(s.levelRequired);
  const empty: string[] = [];
  for (let b = 0; b * 5 < maxLv; b += 1) if (!counts.get(b)) empty.push(`L${b * 5 + 1}-${Math.min(maxLv, b * 5 + 5)}`);
  return empty.length === 0
    ? { state: 'OK', detail: `5레벨 구간 ${Math.ceil(maxLv / 5)}개 모두 새 성장 요소 있음`, empty }
    : { state: 'RISK', detail: `새로 살·배울 것 없는 구간 ${empty.join(' ')}`, empty };
}
