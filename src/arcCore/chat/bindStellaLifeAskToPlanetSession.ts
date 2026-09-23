import { AppState } from 'react-native';
import { isIngameDialogActive } from '../../game/ingameDialog/ingameDialogApi';
import { runAfterIngameDialogIdle } from '../../game/ingameDialog/ingameDialogIdle';
import { registerPlanetSessionResource } from '../../game/planetSessionRegistry';
import { useWaveDefenseStore } from '../../game/waveDefense/waveDefenseStore';
import { useArcOverlayStore } from '../../ui/overlay/arcOverlayStore';
import { resolveDictionaryLocale } from '../../i18n';
import { useAppSettingsStore } from '../../store/appSettingsStore';
import { useArcCoreChatStore } from '../../store/arcCoreChatStore';
import { isArcCoreAgentSurfaceOpen } from './arcCoreAgentSurfaceStore';
import { ARC_CORE_INBOUND_DND_DEFAULT, isInboundTalkDndBlocked } from './arcCoreInboundTalkDnd';
import { hasInboundTalkPending } from './arcCoreInboundTalkPending';
import { isInboundTalkSafeSlot } from './arcCoreInboundTalkRequestPolicy';
import { isArcCoreTutorialForceActive } from './arcCoreChatTutorialForce';
import { presentStellaLifeAskComm } from './presentStellaLifeAskComm';
import { resolveStellaHumanAsk } from './stellaLifeAsk';
import { clearStellaLifeAskPending } from './stellaLifeAskPending';
import { readStellaLifeEnv, readStellaLifeUid } from './stellaLifeEnvRead';
import { snapshotStellaLifeMemory } from './stellaLifeMemory';
import { clearStellaLifeSessionCache, readStellaLifeSession } from './stellaLifeSession';

function readSafeSlot(): boolean {
  return isInboundTalkSafeSlot({
    hubArmed: true,
    appActive: AppState.currentState === 'active',
    overlayBusy: useArcOverlayStore.getState().stack.length > 0 || isArcCoreAgentSurfaceOpen(),
    dialogBusy: isIngameDialogActive(),
    waveActive: useWaveDefenseStore.getState().active === true,
  });
}

function tryPresentStellaLifeAsk(disposed: () => boolean): void {
  if (disposed()) return;
  if (hasInboundTalkPending()) return;
  if (isArcCoreTutorialForceActive()) return;
  if (isInboundTalkDndBlocked(new Date(), ARC_CORE_INBOUND_DND_DEFAULT)) return;
  if (isIngameDialogActive()) {
    runAfterIngameDialogIdle(() => {
      tryPresentStellaLifeAsk(disposed);
    });
    return;
  }
  if (!readSafeSlot()) return;
  const nowMs = Date.now();
  const uid = readStellaLifeUid();
  const resolved = readStellaLifeSession(nowMs, uid, readStellaLifeEnv(nowMs));
  const locale = resolveDictionaryLocale(useAppSettingsStore.getState().locale);
  const why = resolveStellaHumanAsk({
    resolved,
    snapshot: snapshotStellaLifeMemory(),
    locale,
    tutorialForce: isArcCoreTutorialForceActive(),
    operatorIntroPlayed: useArcCoreChatStore.getState().operatorIntroPlayed,
    nowMs,
  });
  if (!why) return;
  presentStellaLifeAskComm(why);
}

export function bindStellaLifeAskToPlanetSession(planetId: string): () => void {
  let disposed = false;
  tryPresentStellaLifeAsk(() => disposed);
  const token = registerPlanetSessionResource({
    ownerId: 'stella_life_ask',
    planetId,
    dispose: () => {
      disposed = true;
      clearStellaLifeAskPending();
      clearStellaLifeSessionCache();
    },
  });
  return () => {
    token.release();
  };
}
