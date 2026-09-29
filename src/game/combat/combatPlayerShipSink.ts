/**
 * 플레이어 기함 격침 — 전투 루프는 플래그만. 파괴·귀환 팝업은 결과창 확인 뒤 파이프라인.
 * persist/틱 없음.
 */

import { t } from '../../i18n';
import { isSurvivalPodNpcShipId } from '../playerSurvivalPod';
import { usePlayerStore } from '../../store/playerStore';

export {
  consumeCombatPlayerShipSinkPending,
  markCombatPlayerShipSinkPending,
  peekCombatPlayerShipSinkPending,
} from './combatPlayerShipSinkFlag';

export function resolveCombatShipDestroyedNotice(): { title: string; body: string } {
  return {
    title: t('combat.shipDestroyedTitle'),
    body: t('combat.shipDestroyedBody'),
  };
}

export async function applyCombatCapitalShipDestructionIfNeeded(): Promise<void> {
  const shipId = usePlayerStore.getState().player?.ship?.portraitNpcCapitalShipId;
  if (isSurvivalPodNpcShipId(shipId)) return;
  await usePlayerStore.getState().applyCapitalShipDestruction();
}
