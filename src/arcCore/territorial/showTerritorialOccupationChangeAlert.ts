import { InteractionManager } from 'react-native';
import { t } from '../../i18n';
import { showArcNotificationAlert } from '../../utils/showArcAlert';
import { TERRITORIAL_OCCUPATION_ALERT_ID } from '../../ui/overlay/overlayAlertContract';
import type { MapFactionSide } from '../../galaxyMap/resolveMapFactionSide';
import { presentTerritorialAlertGatedToGalaxyMap } from './territorialAlertGalaxyMapGate';

function sideLabelKo(side: MapFactionSide): string {
  if (side === 'blue') return t('territorial.side.blue');
  if (side === 'red') return t('territorial.side.red');
  if (side === 'independent') return t('territorial.side.independent');
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

  // 은하계 허브(worldmap) 진입 상태가 아니면 보류 — 진입 시 자동으로 흘려보낸다.
  presentTerritorialAlertGatedToGalaxyMap(() => {
    // ArcCore 틱 → Fabric/Skia 동시 구간 회피: 오버레이는 UI 유휴 후 표시
    InteractionManager.runAfterInteractions(() => {
      const alertOpts = { id: TERRITORIAL_OCCUPATION_ALERT_ID };

      if (input.decision === 'neutral_declare') {
        showArcNotificationAlert(
          t('territorial.alert.neutralTitle'),
          t('territorial.alert.neutralBody', { planet: input.planetLabelKo, prev, next }),
          alertOpts,
        );
        return;
      }

      if (input.decision === 'battle') {
        showArcNotificationAlert(
          t('territorial.alert.battleTitle'),
          t('territorial.alert.battleBody', {
            planet: input.planetLabelKo,
            prev,
            next,
            outcome: input.attackerWon
              ? t('territorial.alert.attackerWin')
              : t('territorial.alert.defenderWin'),
          }),
          alertOpts,
        );
        return;
      }

      showArcNotificationAlert(
        t('territorial.alert.changeTitle'),
        t('territorial.alert.changeBody', { planet: input.planetLabelKo, prev, next }),
        alertOpts,
      );
    });
  });
}

/** status_quo — 교전·외교 없이 현상 유지 (30초 자동 닫힘) */
export function showTerritorialStatusQuoAlert(input: {
  planetLabelKo: string;
  side: MapFactionSide;
}): void {
  const sideLabel = sideLabelKo(input.side);

  presentTerritorialAlertGatedToGalaxyMap(() => {
    InteractionManager.runAfterInteractions(() => {
      showArcNotificationAlert(
        t('territorial.alert.statusQuoTitle'),
        t('territorial.alert.statusQuoBody', { planet: input.planetLabelKo, side: sideLabel }),
        { id: TERRITORIAL_OCCUPATION_ALERT_ID },
      );
    });
  });
}

/** 전투·중립화 판정 후 점유 side 동일 — 유지 안내 (30초 자동 닫힘) */
export function showTerritorialOccupationMaintainedAlert(input: {
  planetLabelKo: string;
  side: MapFactionSide;
  decision: 'battle' | 'neutral_declare';
  attackerWon?: boolean;
}): void {
  const sideKey =
    input.side === 'blue' ? 'blue'
    : input.side === 'red' ? 'red'
    : input.side === 'independent' ? 'independent'
    : 'neutral';
  const sideLabel = sideLabelKo(input.side);

  presentTerritorialAlertGatedToGalaxyMap(() => {
    InteractionManager.runAfterInteractions(() => {
      const alertOpts = { id: TERRITORIAL_OCCUPATION_ALERT_ID };

      if (input.decision === 'battle') {
        const bodyKey =
          sideKey === 'neutral'
            ? 'territorial.alert.maintained.neutralBody'
            : (`territorial.alert.maintained.${sideKey}Body` as const);
        showArcNotificationAlert(
          t('territorial.alert.maintainedBattleTitle'),
          t(bodyKey, {
            planet: input.planetLabelKo,
            side: sideLabel,
            outcome: input.attackerWon
              ? t('territorial.alert.attackerWin')
              : t('territorial.alert.defenderWin'),
          }),
          alertOpts,
        );
        return;
      }

      const diplomaticBodyKey =
        sideKey === 'neutral'
          ? 'territorial.alert.maintained.neutralBody'
          : 'territorial.alert.maintained.diplomaticBody';
      showArcNotificationAlert(
        t('territorial.alert.maintainedNeutralDeclareTitle'),
        t(diplomaticBodyKey, { planet: input.planetLabelKo, side: sideLabel }),
        alertOpts,
      );
    });
  });
}
