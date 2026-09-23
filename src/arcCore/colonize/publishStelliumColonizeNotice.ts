import { useBarBoardStore } from '../../store/barBoardStore';
import { getPlanetOccupationSeedRow } from '../balance/balanceTableRegistry';
import { resolveTerritorialAlertPlanetLabel } from '../territorial/showTerritorialOccupationChangeAlert';

export function publishStelliumColonizeSuccessNotice(planetId: string): void {
  const row = getPlanetOccupationSeedRow(planetId);
  const planet = resolveTerritorialAlertPlanetLabel({
    alertLabelKo: row?.alertLabelKo,
    alertLabelEn: row?.alertLabelEn,
    fallback: planetId,
  });
  useBarBoardStore.getState().pushOrRefreshNotice(
    {
      i18nKey: 'news.stelliumColonize',
      i18nParams: { planet },
      title: 'Stellium Colonize — Headquarters',
      body: `${planet}: Stellium Alliance incorporated`,
      tag: 'ops',
    },
    `stellium_colonize_${planetId}`,
  );
}
