// ============================================================
// 오퍼레이터 인게임 대화 — 빈부격차·반란 알림 문구 (i18n)
// ============================================================

import { t } from '../../i18n';
import { useAppSettingsStore } from '../../store/appSettingsStore';
import { usePlayerStore } from '../../store/playerStore';
import type { MapFactionSide } from '../../galaxyMap/mapFactionSideCore';
import type { PlanetRebellionOperatorAlertPending } from './planetRebellionOperatorAlertStore';

const NICK_TOKEN = /\[닉네임\]|\[Pilot\]/g;

function applyPilotTokens(text: string): string {
  const locale = useAppSettingsStore.getState().locale;
  const nickname = usePlayerStore.getState().player?.nickname;
  const fallback = locale === 'ko' ? '파일럿' : 'Pilot';
  return text.replace(NICK_TOKEN, (nickname ?? '').trim() || fallback);
}

function sideLabel(side: MapFactionSide | undefined): string {
  if (side === 'blue') return t('territorial.side.blue');
  if (side === 'red') return t('territorial.side.red');
  return t('territorial.side.neutral');
}

export function resolvePlanetRebellionOperatorDialogCopy(
  alert: PlanetRebellionOperatorAlertPending,
): { label: string; text: string } {
  const planet = alert.planetLabel;
  const wdi = String(alert.wdi);

  switch (alert.kind) {
    case 'wdi_unrest':
      return {
        label: t('operatorRebellion.wdiUnrest.label'),
        text: applyPilotTokens(t('operatorRebellion.wdiUnrest.text', { planet, wdi })),
      };
    case 'wdi_danger':
      return {
        label: t('operatorRebellion.wdiDanger.label'),
        text: applyPilotTokens(t('operatorRebellion.wdiDanger.text', { planet, wdi })),
      };
    case 'civil_war_simmering':
      return {
        label: t('operatorRebellion.simmering.label'),
        text: applyPilotTokens(t('operatorRebellion.simmering.text', { planet, wdi })),
      };
    case 'rebellion_overthrow':
      return {
        label: t('operatorRebellion.overthrow.label'),
        text: applyPilotTokens(
          t('operatorRebellion.overthrow.text', {
            planet,
            wdi,
            prevSide: sideLabel(alert.previousFactionSide),
          }),
        ),
      };
    default:
      return {
        label: t('operatorRebellion.fallback.label'),
        text: applyPilotTokens(t('operatorRebellion.fallback.text', { planet, wdi })),
      };
  }
}
