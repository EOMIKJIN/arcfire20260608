// 제안 집행 — 명시 요청 또는 확인 1장 후 기존 허브 문만. 명령버스·경제 write 없음.

import type { Href } from 'expo-router';
import {
  hasArcCoreChatFacilityOpener,
  runArcCoreChatFacilityOpener,
} from './arcCoreChatFacilityBridge';
import { recordArcCoreChatProposalDecision } from './arcCoreChatJudgmentMemory';
import {
  isArcCoreChatExecutableProposalId,
  isArcCoreChatFacilityProposalId,
  type ArcCoreChatWorldProposalId,
} from './arcCoreChatWorldProposal';
import { isArcCoreChatOverlayToDismiss } from './arcCoreChatOverlayDismissPolicy';
import { peekArcCoreChatActionPayload, takeArcCoreChatActionPayload } from './arcCoreChatActionPayload';

function hrefForProposal(id: ArcCoreChatWorldProposalId): Href | null {
  if (id === 'open_trade') return '/(game)/trade';
  if (id === 'open_shipyard') return '/(game)/shipyard';
  if (id === 'open_bar') return '/(game)/bar';
  if (id === 'open_skilltree') return '/(game)/skilltree';
  return null;
}

function facilityKind(
  id: ArcCoreChatWorldProposalId,
): 'trade' | 'shipyard' | 'bar' | 'research_lab' | null {
  if (id === 'open_trade') return 'trade';
  if (id === 'open_shipyard') return 'shipyard';
  if (id === 'open_bar') return 'bar';
  if (id === 'open_skilltree') return 'research_lab';
  return null;
}

function dismissChatThen(run: () => void): void {
  const { useArcOverlayStore } =
    require('../../ui/overlay/arcOverlayStore') as typeof import('../../ui/overlay/arcOverlayStore');
  useArcOverlayStore.getState().dismissWhere(isArcCoreChatOverlayToDismiss);
  const { useArcCoreAgentSurfaceStore } =
    require('./arcCoreAgentSurfaceStore') as typeof import('./arcCoreAgentSurfaceStore');
  useArcCoreAgentSurfaceStore.getState().activateGame();
  const { InteractionManager } = require('react-native') as typeof import('react-native');
  InteractionManager.runAfterInteractions(() => {
    requestAnimationFrame(run);
  });
}

function currentPlanetId(): string {
  const { usePlayerStore } = require('../../store/playerStore') as typeof import('../../store/playerStore');
  return usePlayerStore.getState().player?.currentPlanetId?.trim() ?? '';
}

function currentPlanetLabel(planetId: string): string {
  const { getPlanetOccupationSeedRow } =
    require('../balance/balanceTableRegistry') as typeof import('../balance/balanceTableRegistry');
  return getPlanetOccupationSeedRow(planetId)?.alertLabelKo?.trim() || planetId;
}

function executeFacility(id: ArcCoreChatWorldProposalId): boolean {
  const href = hrefForProposal(id);
  const kind = facilityKind(id);
  if (!href || !kind) return false;

  const { runPlanetHubSubmenuPreflight } =
    require('../../ui/heavyUiDataSession/preflightPlanetHubFacility') as typeof import('../../ui/heavyUiDataSession/preflightPlanetHubFacility');
  const { runThrottledPlanetHubNavigation } =
    require('../../navigation/safePlanetHubNavigate') as typeof import('../../navigation/safePlanetHubNavigate');

  const planetId = currentPlanetId();
  if (!runPlanetHubSubmenuPreflight(kind, planetId)) return false;
  if (!hasArcCoreChatFacilityOpener()) return false;

  dismissChatThen(() => {
    runThrottledPlanetHubNavigation(() => {
      runArcCoreChatFacilityOpener(href);
    });
  });
  recordArcCoreChatProposalDecision(id, 'accept');
  return true;
}

function executeTalkBar(id: ArcCoreChatWorldProposalId): boolean {
  const snap = peekArcCoreChatActionPayload();
  const attendantId = snap?.id === id ? snap.attendantId?.trim() ?? '' : '';
  if (!attendantId) return false;
  const { getBarAttendantById, listDialogTurnsForAttendant } =
    require('../../game/bar/patronage/barPatronageTables') as typeof import('../../game/bar/patronage/barPatronageTables');
  const attendant = getBarAttendantById(attendantId);
  if (!attendant) return false;

  takeArcCoreChatActionPayload(id);
  const planetId = currentPlanetId() || attendant.planetId;
  dismissChatThen(() => {
    const { resolveDictionaryLocale } = require('../../i18n') as typeof import('../../i18n');
    const { useAppSettingsStore } =
      require('../../store/appSettingsStore') as typeof import('../../store/appSettingsStore');
    const { presentBarDialogTurns } =
      require('../../game/bar/patronage/barPatronageDialog') as typeof import('../../game/bar/patronage/barPatronageDialog');
    const { presentAdHocIngameDialog } =
      require('../../game/ingameDialog/ingameDialogApi') as typeof import('../../game/ingameDialog/ingameDialogApi');
    const { resolveBarAttendantHelloOverlay } =
      require('../../game/bar/patronage/barPatronageTables') as typeof import('../../game/bar/patronage/barPatronageTables');
    const { resolveBarAttendantPortraitById } =
      require('../../game/bar/patronage/barPatronagePortrait') as typeof import('../../game/bar/patronage/barPatronagePortrait');

    const locale = resolveDictionaryLocale(useAppSettingsStore.getState().locale);
    const loc = locale === 'en' ? 'en' : 'ko';
    const name = loc === 'en'
      ? attendant.displayNameEn || attendant.displayNameKo
      : attendant.displayNameKo;
    const helloTurns = listDialogTurnsForAttendant({
      dialogSetId: attendant.dialogSetId,
      maxBundleTier: 1,
    }).filter((turn) => turn.speechAct === 'attendant_hello').slice(0, 1);

    if (helloTurns.length > 0) {
      void presentBarDialogTurns({
        turns: helloTurns,
        locale: loc,
        label: name,
        planetId,
        attendantId,
      });
      return;
    }
    const text = resolveBarAttendantHelloOverlay(attendantId, loc) || name;
    presentAdHocIngameDialog({
      label: name,
      text,
      imageSource: resolveBarAttendantPortraitById(attendantId),
      autoDismissMs: 0,
    });
  });
  recordArcCoreChatProposalDecision(id, 'accept');
  return true;
}

function executeTalkNpc(id: ArcCoreChatWorldProposalId): boolean {
  const snap = peekArcCoreChatActionPayload();
  const captainId = snap?.id === id ? snap.captainId?.trim() ?? '' : '';
  if (!captainId) return false;
  const planetId = currentPlanetId();
  if (!planetId) return false;
  takeArcCoreChatActionPayload(id);
  const { markResumeArcCoreAgentAfterIngameDialog, useArcCoreAgentSurfaceStore } =
    require('./arcCoreAgentSurfaceStore') as typeof import('./arcCoreAgentSurfaceStore');
  const { scheduleResumeArcCoreAgentAfterIngameDialog } =
    require('./resumeArcCoreAgentAfterIngameDialog') as typeof import('./resumeArcCoreAgentAfterIngameDialog');
  const { useArcOverlayStore } =
    require('../../ui/overlay/arcOverlayStore') as typeof import('../../ui/overlay/arcOverlayStore');
  markResumeArcCoreAgentAfterIngameDialog();
  useArcOverlayStore.getState().dismissWhere(isArcCoreChatOverlayToDismiss);
  useArcCoreAgentSurfaceStore.getState().activateGame({ immediate: true });
  const { openPlanetHubTalkByCaptainId } =
    require('../../game/planetHubTalkRoster') as typeof import('../../game/planetHubTalkRoster');
  const presented = openPlanetHubTalkByCaptainId(planetId, captainId);
  scheduleResumeArcCoreAgentAfterIngameDialog(presented);
  recordArcCoreChatProposalDecision(id, 'accept');
  return true;
}

function executeArmWave(id: ArcCoreChatWorldProposalId): boolean {
  const snap = peekArcCoreChatActionPayload();
  const planetId = (snap?.id === id ? snap.planetId : '')?.trim()
    || currentPlanetId();
  if (!planetId) return false;
  const { getPlanetOccupationSeedRow } =
    require('../balance/balanceTableRegistry') as typeof import('../balance/balanceTableRegistry');
  if (!getPlanetOccupationSeedRow(planetId) && planetId !== currentPlanetId()) return false;
  const { markChatArmedWavePending } =
    require('../../game/waveDefense/chatArmedWavePending') as typeof import('../../game/waveDefense/chatArmedWavePending');
  markChatArmedWavePending(planetId);
  takeArcCoreChatActionPayload(id);
  dismissChatThen(() => {
    /* 메신저만 닫음. 이미 그 행성이면 허브 resolver가 웨이브를 켬 */
  });
  recordArcCoreChatProposalDecision(id, 'accept');
  return true;
}

function executeOverlay(id: ArcCoreChatWorldProposalId): boolean {
  const planetId = currentPlanetId();
  if (!planetId) return false;
  const label = currentPlanetLabel(planetId);
  if (id === 'open_talk_roster') {
    const { presentPlanetHubTalkRosterFromAgent } =
      require('../../game/planetHubTalkRoster') as typeof import('../../game/planetHubTalkRoster');
    if (!presentPlanetHubTalkRosterFromAgent()) return false;
    recordArcCoreChatProposalDecision(id, 'accept');
    return true;
  }
  dismissChatThen(() => {
    const overlay =
      require('../../ui/overlay/arcOverlayStore') as typeof import('../../ui/overlay/arcOverlayStore');
    if (id === 'open_economy') {
      overlay.presentPlanetEconomyInfoOverlay(planetId, label);
      return;
    }
    if (id === 'open_development') {
      overlay.presentPlanetDevelopmentOverlay(planetId, label, 'list');
    }
  });
  recordArcCoreChatProposalDecision(id, 'accept');
  return true;
}

export function canExecuteArcCoreChatWorldProposal(rawId: string): boolean {
  const id = rawId.trim();
  if (!isArcCoreChatExecutableProposalId(id)) return false;
  if (isArcCoreChatFacilityProposalId(id)) return hasArcCoreChatFacilityOpener();
  if (id === 'talk_bar') return Boolean(peekArcCoreChatActionPayload()?.attendantId);
  if (id === 'talk_npc') return Boolean(peekArcCoreChatActionPayload()?.captainId);
  if (id === 'arm_wave') {
    return Boolean(peekArcCoreChatActionPayload()?.planetId || currentPlanetId());
  }
  return Boolean(currentPlanetId());
}

export function executeArcCoreChatWorldProposal(rawId: string): boolean {
  const id = rawId.trim() as ArcCoreChatWorldProposalId;
  if (!isArcCoreChatExecutableProposalId(id)) return false;
  if (isArcCoreChatFacilityProposalId(id)) return executeFacility(id);
  if (id === 'talk_bar') return executeTalkBar(id);
  if (id === 'talk_npc') return executeTalkNpc(id);
  if (id === 'arm_wave') return executeArmWave(id);
  if (id === 'open_economy' || id === 'open_development' || id === 'open_talk_roster') {
    return executeOverlay(id);
  }
  return false;
}

function confirmBodyKey(id: string): string {
  if (id === 'open_shipyard') return 'arcCoreChat.proposal.confirmShipyard';
  if (id === 'open_bar') return 'arcCoreChat.proposal.confirmBar';
  if (id === 'open_skilltree') return 'arcCoreChat.proposal.confirmSkilltree';
  if (id === 'open_economy') return 'arcCoreChat.proposal.confirmEconomy';
  if (id === 'open_development') return 'arcCoreChat.proposal.confirmDevelopment';
  if (id === 'open_talk_roster') return 'arcCoreChat.proposal.confirmTalkRoster';
  if (id === 'talk_bar') return 'arcCoreChat.proposal.confirmTalkBar';
  if (id === 'talk_npc') return 'arcCoreChat.proposal.confirmTalkNpc';
  if (id === 'arm_wave') return 'arcCoreChat.proposal.confirmArmWave';
  return 'arcCoreChat.proposal.confirmTrade';
}

export function presentArcCoreChatWorldProposalConfirm(rawId: string): boolean {
  const id = rawId.trim();
  if (!canExecuteArcCoreChatWorldProposal(id)) return false;
  const { t } = require('../../i18n') as typeof import('../../i18n');
  const { showArcAlert } = require('../../utils/showArcAlert') as typeof import('../../utils/showArcAlert');
  const snap = peekArcCoreChatActionPayload();
  const name = snap?.attendantName || snap?.captainName || snap?.planetLabel || '';
  const title = t('arcCoreChat.proposal.confirmTitle');
  const body = t(confirmBodyKey(id), name ? { name } : undefined);
  showArcAlert(
    title,
    body,
    [
      {
        text: t('arcCoreChat.proposal.later'),
        style: 'cancel',
        onPress: () => {
          recordArcCoreChatProposalDecision(id, 'refuse');
        },
      },
      {
        text: t('arcCoreChat.proposal.open'),
        onPress: () => {
          executeArcCoreChatWorldProposal(id);
        },
      },
    ],
    { autoDismissMs: 0 },
  );
  return true;
}
