import { useBarBoardStore } from '../../store/barBoardStore';
import type { MapFactionSide } from '../../galaxyMap/resolveMapFactionSide';
import type { TerritorialPassDecision } from './runTerritorialCombatPass';
import { resolveTerritorialAlertPlanetLabel } from './showTerritorialOccupationChangeAlert';

function sideKey(side: MapFactionSide): string {
  if (side === 'blue') return 'blue';
  if (side === 'red') return 'red';
  return 'neutral';
}

/** 점유 변경 시 바 공지 — 행성별 dedupeKey 갱신(최신 점령 상태로 교체) */
export function publishTerritorialHoldChangeNotice(input: {
  planetLabelKo: string;
  planetLabelEn?: string;
  planetId: string;
  previousSide: MapFactionSide;
  newSide: MapFactionSide;
  decision: TerritorialPassDecision;
}): void {
  if (input.previousSide === input.newSide) return;

  const planet = resolveTerritorialAlertPlanetLabel({
    alertLabelKo: input.planetLabelKo,
    alertLabelEn: input.planetLabelEn,
    fallback: input.planetLabelKo,
  });

  const dedupeKey = `territorial_hold_${input.planetId}`;
  useBarBoardStore.getState().pushOrRefreshNotice(
    {
      i18nKey: 'news.territorialHold',
      i18nParams: {
        planet,
        prevSide: sideKey(input.previousSide),
        nextSide: sideKey(input.newSide),
        decision: input.decision,
      },
      title: 'Contested Zone — Occupation Changed',
      body: `${planet}: ${input.previousSide} → ${input.newSide}`,
      tag: 'ops',
    },
    dedupeKey,
  );
}
