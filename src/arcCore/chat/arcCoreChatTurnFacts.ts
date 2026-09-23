// 읽기 전용 팩트 — 오픈/전송 1회. 명령버스·AABS·경제 정적 import 금지.

import { resolveDictionaryLocale } from '../../i18n';
import { getLastMatchSummarySync } from '../../store/combatMatchTelemetryStore';
import { useAppSettingsStore } from '../../store/appSettingsStore';
import { getPendingArcCoreSpyIntelAlert } from '../spy/arcCoreSpyIntelAlertStore';
import { usePlayerStore } from '../../store/playerStore';
import { resolvePlanetById } from '../../world/resolvePlanetById';
import { parseArcCoreChatMemoryTags } from './arcCoreChatMemoryTags';
import { getArcCoreChatRollingSummary } from './arcCoreChatDialogueState';
import {
  getArcCoreChatLastAcceptedProposalId,
  getArcCoreChatLastRefusedProposalId,
  getArcCoreChatPendingProposalId,
} from './arcCoreChatJudgmentMemory';
import { readArcCoreChatGmSession } from './arcCoreChatGmBeat';
import type { ArcCoreChatFactSnapshot, ArcCoreChatTurnRecent } from './arcCoreChatTurn';

function readDailyOpsSettledToday(): boolean {
  try {
    const state = require('../schedule/arcCoreDailyOpsState') as typeof import('../schedule/arcCoreDailyOpsState');
    const policyMod = require('../schedule/arcCoreDailyOpsPolicy') as typeof import('../schedule/arcCoreDailyOpsPolicy');
    const completed = state.getArcCoreDailyOpsLastBatchCompletedDayKey();
    if (!completed) return false;
    const policy = policyMod.resolveArcCoreDailyOpsPolicy();
    const today = policyMod.formatArcCoreOpsDayKey(Date.now(), policy.timeZone);
    return completed === today;
  } catch {
    return false;
  }
}

function readMiningExhausted(planetId: string): boolean {
  if (!planetId) return false;
  try {
    const mining =
      require('../../game/mining/orbitMiningPlayerLimitPolicy') as typeof import('../../game/mining/orbitMiningPlayerLimitPolicy');
    return mining.isOrbitMiningDailyAllowanceExhausted(planetId);
  } catch {
    return false;
  }
}

function readVitalityTier(planetId: string): string {
  if (!planetId) return '';
  try {
    const fabric =
      require('../economy/planetEconomyFabric') as typeof import('../economy/planetEconomyFabric');
    const scale = fabric.resolvePlanetSupplyStockScale(planetId);
    return fabric.resolvePlanetSupplyVitalityTier(scale);
  } catch {
    return '';
  }
}

function readHasActiveMission(): boolean {
  try {
    const { useMissionStore } = require('../../store/missionStore') as typeof import('../../store/missionStore');
    return useMissionStore.getState().getActiveMission() != null;
  } catch {
    return false;
  }
}

function readFacilityFlags(planetId: string): { hasTradePort: boolean; hasShipyard: boolean } {
  if (!planetId) return { hasTradePort: false, hasShipyard: false };
  try {
    const gates =
      require('../../game/planetDevelopment/planetHubFacilityGates') as typeof import('../../game/planetDevelopment/planetHubFacilityGates');
    return {
      hasTradePort: gates.isPlanetHubTradePortEnabled(planetId),
      hasShipyard: gates.isPlanetHubShipyardEnabled(planetId),
    };
  } catch {
    return { hasTradePort: false, hasShipyard: false };
  }
}

export function readArcCoreChatFacts(
  recent: readonly ArcCoreChatTurnRecent[],
): ArcCoreChatFactSnapshot {
  const planetId = usePlayerStore.getState().player?.currentPlanetId?.trim() ?? '';
  let planetLabel = '';
  if (planetId) {
    const planet = resolvePlanetById(planetId);
    const name = planet?.name?.trim();
    planetLabel = name || planetId;
  }
  let hasCombatRecord = getLastMatchSummarySync() != null;
  if (!hasCombatRecord) {
    for (let i = 0; i < recent.length; i += 1) {
      if (recent[i]?.reason === 'combat_end') {
        hasCombatRecord = true;
        break;
      }
    }
  }
  const locale = resolveDictionaryLocale(useAppSettingsStore.getState().locale);
  const prefer = parseArcCoreChatMemoryTags(getArcCoreChatRollingSummary()).tags.find((row) => row.key === '좋아');
  const facilities = readFacilityFlags(planetId);
  return {
    planetLabel,
    spyAlertPending: getPendingArcCoreSpyIntelAlert() != null,
    hasCombatRecord,
    hasStoryBeat: readArcCoreChatGmSession(locale).hasStoryBeat,
    dailyOpsSettledToday: readDailyOpsSettledToday(),
    miningAllowanceExhausted: readMiningExhausted(planetId),
    vitalityTier: readVitalityTier(planetId),
    hasActiveMission: readHasActiveMission(),
    hasTradePort: facilities.hasTradePort,
    hasShipyard: facilities.hasShipyard,
    pendingProposalId: getArcCoreChatPendingProposalId(),
    lastAcceptedProposalId: getArcCoreChatLastAcceptedProposalId(),
    lastRefusedProposalId: getArcCoreChatLastRefusedProposalId(),
    preferTag: prefer?.value ?? '',
    lastOrbitCommCaptainName: readLastOrbitCommCaptainName(),
    worldChangeDigestLine: readWorldChangeDigestLine(),
  };
}

function readLastOrbitCommCaptainName(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const memory = require('../../store/orbitPresenceMemoryStore') as typeof import('../../store/orbitPresenceMemoryStore');
    return memory.getLastOrbitCommCaptainName().trim();
  } catch {
    return '';
  }
}

function readWorldChangeDigestLine(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const memory = require('../../store/orbitPresenceMemoryStore') as typeof import('../../store/orbitPresenceMemoryStore');
    return memory.getLastHubWorldChangeDigest()?.factLine?.trim() ?? '';
  } catch {
    return '';
  }
}
