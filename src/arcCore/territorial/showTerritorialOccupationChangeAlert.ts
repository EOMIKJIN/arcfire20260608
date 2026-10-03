import { getLocale, isKoUi, resolveDictionaryLocale, t } from '../../i18n';
import { showArcNotificationAlert } from '../../utils/showArcAlert';
import { TERRITORIAL_OCCUPATION_ALERT_ID } from '../../ui/overlay/overlayAlertContract';
import type { MapFactionSide } from '../../galaxyMap/resolveMapFactionSide';
import { resolveNationDisplayNameForMapSide } from '../../world/megaFactionNationPolicy';
import { shouldSkipTerritorialOccupationAlert } from './territorialAlertGate';
import { formatTerritorialBattleAlertCopy, koJosa } from './territorialBattleAlertCopy';
import {
  resolveTerritorialPresentKind,
  type TerritorialPresentCombatMode,
} from './resolveTerritorialPresentKind';

export { shouldSkipTerritorialOccupationAlert };
export { formatTerritorialBattleAlertCopy, koJosa } from './territorialBattleAlertCopy';

function sideLabel(side: MapFactionSide): string {
  const locale = resolveDictionaryLocale(getLocale()) === 'en' ? 'en' : 'ko';
  const nation = resolveNationDisplayNameForMapSide(side, locale);
  if (nation) return nation;
  if (side === 'blue') return t('territorial.side.blue');
  if (side === 'red') return t('territorial.side.red');
  if (side === 'independent') return t('territorial.side.independent');
  return t('territorial.side.neutral');
}

function withIga(word: string): string {
  if (!isKoUi(getLocale())) return word;
  return `${word}${koJosa(word, '이', '가')}`;
}

/** 로케일별 점령 알림 성계명 — EN UI면 alertLabelEn, 없으면 Ko/fallback */
export function resolveTerritorialAlertPlanetLabel(input: {
  alertLabelKo?: string | null;
  alertLabelEn?: string | null;
  fallback?: string | null;
}): string {
  const ko = input.alertLabelKo?.trim() || '';
  const en = input.alertLabelEn?.trim() || '';
  const fb = input.fallback?.trim() || '';
  if (isKoUi(getLocale())) return ko || en || fb;
  return en || ko || fb;
}

type TerritorialAlertLabelInput = {
  planetLabelKo: string;
  planetLabelEn?: string;
};

function planetLabelAtShow(input: TerritorialAlertLabelInput): string {
  return resolveTerritorialAlertPlanetLabel({
    alertLabelKo: input.planetLabelKo,
    alertLabelEn: input.planetLabelEn,
    fallback: input.planetLabelKo,
  });
}

/** 타이틀·항로·부트에서 스킵되면 폐기. 허브 진입 flush 없음 — 판정 시점에만 표시. */
function presentTerritorialAlertNow(show: () => void): void {
  if (shouldSkipTerritorialOccupationAlert()) return;
  setTimeout(() => {
    if (shouldSkipTerritorialOccupationAlert()) return;
    show();
  }, 0);
}

export function showTerritorialOccupationChangeAlert(input: {
  planetLabelKo: string;
  planetLabelEn?: string;
  previousSide: MapFactionSide;
  newSide: MapFactionSide;
  decision: 'battle' | 'neutral_declare' | 'status_quo';
  combatMode?: TerritorialPresentCombatMode;
  attackerWon?: boolean;
  attackerSide?: MapFactionSide;
  defenderSide?: MapFactionSide;
}): void {
  if (input.previousSide === input.newSide) return;

  const prev = sideLabel(input.previousSide);
  const next = sideLabel(input.newSide);
  const presentKind = resolveTerritorialPresentKind({
    decision: input.decision,
    combatMode: input.combatMode,
  });

  presentTerritorialAlertNow(() => {
    const alertOpts = { id: TERRITORIAL_OCCUPATION_ALERT_ID };
    const planet = planetLabelAtShow(input);

    if (presentKind === 'declare') {
      showArcNotificationAlert(
        t('territorial.alert.neutralTitle'),
        t('territorial.alert.neutralBody', { planet, prev, next }),
        alertOpts,
      );
      return;
    }

    if (presentKind === 'seize') {
      showArcNotificationAlert(
        t('territorial.alert.seizeTitle'),
        t('territorial.alert.seizeBody', { planet, prev, next, nextJosa: withIga(next) }),
        alertOpts,
      );
      return;
    }

    if (presentKind === 'battle') {
      const copy = formatTerritorialBattleAlertCopy({
        planet,
        previousSide: input.previousSide,
        newSide: input.newSide,
        attackerSide: input.attackerSide,
        defenderSide: input.defenderSide,
        occupationChanged: true,
      });
      showArcNotificationAlert(t('territorial.alert.battleTitle'), copy.context, {
        ...alertOpts,
        messageSection: {
          label: t('territorial.alert.resultLabel'),
          text: copy.outcome,
        },
      });
      return;
    }

    showArcNotificationAlert(
      t('territorial.alert.changeTitle'),
      t('territorial.alert.changeBody', { planet, prev, next }),
      alertOpts,
    );
  });
}

/** status_quo — 교전 없이 전선 소강 (40초 자동 닫힘) */
export function showTerritorialStatusQuoAlert(input: {
  planetLabelKo: string;
  planetLabelEn?: string;
  side: MapFactionSide;
}): void {
  const held = sideLabel(input.side);

  presentTerritorialAlertNow(() => {
    showArcNotificationAlert(
      t('territorial.alert.statusQuoTitle'),
      t('territorial.alert.statusQuoBody', {
        planet: planetLabelAtShow(input),
        side: held,
      }),
      { id: TERRITORIAL_OCCUPATION_ALERT_ID },
    );
  });
}

/** 자동전투 후 점유 side 동일 — 유지 안내 (40초 자동 닫힘) */
export function showTerritorialOccupationMaintainedAlert(input: {
  planetLabelKo: string;
  planetLabelEn?: string;
  side: MapFactionSide;
  decision: 'battle' | 'neutral_declare';
  combatMode?: TerritorialPresentCombatMode;
  attackerWon?: boolean;
  attackerSide?: MapFactionSide;
  defenderSide?: MapFactionSide;
}): void {
  const sideKey =
    input.side === 'blue' ? 'blue'
    : input.side === 'red' ? 'red'
    : input.side === 'independent' ? 'independent'
    : 'neutral';
  const held = sideLabel(input.side);
  const presentKind = resolveTerritorialPresentKind({
    decision: input.decision,
    combatMode: input.combatMode,
  });

  presentTerritorialAlertNow(() => {
    const alertOpts = { id: TERRITORIAL_OCCUPATION_ALERT_ID };
    const planet = planetLabelAtShow(input);

    if (presentKind === 'seize') {
      showArcNotificationAlert(
        t('territorial.alert.seizeMaintainedTitle'),
        t('territorial.alert.seizeMaintainedBody', { planet, side: held }),
        alertOpts,
      );
      return;
    }

    if (presentKind === 'battle') {
      const copy = formatTerritorialBattleAlertCopy({
        planet,
        previousSide: input.side,
        newSide: input.side,
        holdSide: input.side,
        attackerSide: input.attackerSide,
        defenderSide: input.defenderSide,
        occupationChanged: false,
      });
      showArcNotificationAlert(t('territorial.alert.maintainedBattleTitle'), copy.context, {
        ...alertOpts,
        messageSection: {
          label: t('territorial.alert.resultLabel'),
          text: copy.outcome,
        },
      });
      return;
    }

    const diplomaticBodyKey =
      sideKey === 'neutral'
        ? 'territorial.alert.maintained.neutralDiplomaticBody'
        : 'territorial.alert.maintained.diplomaticBody';
    showArcNotificationAlert(
      t('territorial.alert.maintainedNeutralDeclareTitle'),
      t(diplomaticBodyKey, { planet, side: held }),
      alertOpts,
    );
  });
}
