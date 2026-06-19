import { InteractionManager } from 'react-native';
import { t } from '../../i18n';
import { showArcAlert } from '../../utils/showArcAlert';
import type { MapFactionSide } from '../../galaxyMap/resolveMapFactionSide';

function sideLabelKo(side: MapFactionSide): string {
  if (side === 'blue') return t('territorial.side.blue');
  if (side === 'red') return t('territorial.side.red');
  return t('territorial.side.neutral');
}

export function showTerritorialOccupationChangeAlert(input: {
  planetLabelKo: string;
  previousSide: MapFactionSide;
  newSide: MapFactionSide;
  decision: 'battle' | 'neutral_declare' | 'status_quo';
  attackerWon?: boolean;
}): void {
  if (input.previousSide === input.newSide) return;

  const prev = sideLabelKo(input.previousSide);
  const next = sideLabelKo(input.newSide);

  // ArcCore 틱 → Fabric/Skia 동시 구간 회피: 오버레이는 UI 유휴 후 표시
  InteractionManager.runAfterInteractions(() => {
    if (input.decision === 'neutral_declare') {
      showArcAlert(
        t('territorial.alert.neutralTitle'),
        t('territorial.alert.neutralBody', { planet: input.planetLabelKo, prev, next }),
      );
      return;
    }

    if (input.decision === 'battle') {
      showArcAlert(
        t('territorial.alert.battleTitle'),
        t('territorial.alert.battleBody', {
          planet: input.planetLabelKo,
          prev,
          next,
          outcome: input.attackerWon
            ? t('territorial.alert.attackerWin')
            : t('territorial.alert.defenderWin'),
        }),
      );
      return;
    }

    showArcAlert(
      t('territorial.alert.changeTitle'),
      t('territorial.alert.changeBody', { planet: input.planetLabelKo, prev, next }),
    );
  });
}
