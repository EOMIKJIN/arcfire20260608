import { useTavernBoardStore } from '../../store/tavernBoardStore';
import type { MapFactionSide } from '../../galaxyMap/resolveMapFactionSide';
import type { TerritorialPassDecision } from './runTerritorialCombatPass';

function sideKey(side: MapFactionSide): string {
  if (side === 'blue') return 'blue';
  if (side === 'red') return 'red';
  return 'neutral';
}

/** 점유 변경 시 선술집 공지 — 행성별 dedupeKey 갱신(최신 점령 상태로 교체) */
export function publishTerritorialHoldChangeNotice(input: {
  planetLabelKo: string;
  planetId: string;
  previousSide: MapFactionSide;
  newSide: MapFactionSide;
  decision: TerritorialPassDecision;
}): void {
  if (input.previousSide === input.newSide) return;

  const dedupeKey = `territorial_hold_${input.planetId}`;
  useTavernBoardStore.getState().pushOrRefreshNotice(
    {
      i18nKey: 'news.territorialHold',
      i18nParams: {
        planet: input.planetLabelKo,
        prevSide: sideKey(input.previousSide),
        nextSide: sideKey(input.newSide),
        decision: input.decision,
      },
      title: '접전지역 점령 변경',
      body: `${input.planetLabelKo} 점유: ${input.previousSide} → ${input.newSide}`,
      tag: '작전',
    },
    dedupeKey,
  );
}
