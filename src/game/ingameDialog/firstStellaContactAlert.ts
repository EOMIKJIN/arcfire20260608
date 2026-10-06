/**
 * 최초 스텔라 착륙 대사 전 — 연락 팝업 1회.
 * 수락(또는 40초 자동닫힘) 뒤에만 planet_landed 대사를 연다. 틱·persist 없음.
 */
import { t } from '../../i18n';
import { useArcOverlayStore } from '../../ui/overlay/arcOverlayStore';
import { usePlayerStore } from '../../store/playerStore';
import { useIngameDialogStore } from '../../store/ingameDialogStore';
import { showArcAlert } from '../../utils/showArcAlert';
import { listIngameDialogScenesForTrigger } from './ingameDialogSceneIndex';
import { isUnseenFirstStellaLandScene } from './firstStellaContactPrelude';

export const STELLA_FIRST_LAND_CONTACT_ALERT_ID = 'stella-first-land-contact';

function contactAlertIsOpen(): boolean {
  const stack = useArcOverlayStore.getState().stack;
  for (let i = 0; i < stack.length; i += 1) {
    if (stack[i]!.id === STELLA_FIRST_LAND_CONTACT_ALERT_ID) return true;
  }
  return false;
}

/** true면 이번 착륙 대사는 팝업 수락 뒤로 미룬다. */
export function tryPresentFirstStellaLandContact(planetId: string): boolean {
  const pid = planetId.trim();
  if (!pid) return false;
  const dialog = useIngameDialogStore.getState();
  if (dialog.isActive()) return false;
  if (dialog.lastPlanetLandedId === pid) return false;
  const seen = usePlayerStore.getState().player?.flags.seenStorySceneIds ?? [];
  const scenes = listIngameDialogScenesForTrigger('planet_landed', pid);
  if (!isUnseenFirstStellaLandScene(scenes, seen)) return false;
  if (contactAlertIsOpen()) return true;

  showArcAlert(
    t('conversation.operatorName'),
    t('conversation.gate1.operator.incomingBody'),
    [
      {
        text: t('arcCoreChat.inbound.accept'),
        onPress: () => {
          const current = (usePlayerStore.getState().player?.currentPlanetId ?? '').trim();
          if (current !== pid) return;
          if (useIngameDialogStore.getState().isActive()) return;
          useIngameDialogStore.getState().tryFireTrigger({
            triggerKey: 'planet_landed',
            targetId: pid,
          });
        },
      },
    ],
    { id: STELLA_FIRST_LAND_CONTACT_ALERT_ID, dismissOnBackdrop: false },
  );
  return true;
}
