// 읽기 도구 ≤4 — 동기 스칼라. 월드 write · 80건 디스크 금지.
// 세계 콘트롤 B 제안 집행은 여기에 두지 않음.

import { resolveDictionaryLocale } from '../../i18n';
import { getLastMatchSummarySync } from '../../store/combatMatchTelemetryStore';
import { useAppSettingsStore } from '../../store/appSettingsStore';
import { usePlayerStore } from '../../store/playerStore';
import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';
import { resolvePlanetById } from '../../world/resolvePlanetById';
import { getPendingArcCoreSpyIntelAlert } from '../spy/arcCoreSpyIntelAlertStore';
import type { ArcCoreChatTurn } from './arcCoreChatTurn';

export type ArcCoreChatToolResult = {
  name: string;
  data: Record<string, string | number | boolean | null>;
};

const ALLOWED_TOOLS: readonly string[] = [
  'get_location',
  'get_callsign',
  'get_spy_alert',
  'get_last_combat',
  'get_planet_cores',
  'get_latest_notice',
  'get_active_mission',
  'get_planet_vitality',
  'get_mining_allowance',
  'get_daily_ops_status',
];

function runLatestNotice(): ArcCoreChatToolResult {
  const { useBarBoardStore } = require('../../store/barBoardStore') as typeof import('../../store/barBoardStore');
  const { resolveNoticeTitle } = require('../../i18n/noticeText') as typeof import('../../i18n/noticeText');
  const { t } = require('../../i18n') as typeof import('../../i18n');
  const notice = useBarBoardStore.getState().notices[0];
  if (!notice) {
    return { name: 'get_latest_notice', data: { hasNotice: false, title: null } };
  }
  const title = resolveNoticeTitle(notice, t).trim().slice(0, 80) || notice.title?.trim().slice(0, 80) || null;
  return {
    name: 'get_latest_notice',
    data: {
      hasNotice: true,
      title,
      tag: notice.tag,
    },
  };
}

function runActiveMission(): ArcCoreChatToolResult {
  const { useMissionStore } = require('../../store/missionStore') as typeof import('../../store/missionStore');
  const { getCurrentSequentialObjective } = require('../../missions/missionObjectiveSequence') as typeof import('../../missions/missionObjectiveSequence');
  const bundle = useMissionStore.getState().getActiveMission();
  if (!bundle) {
    return { name: 'get_active_mission', data: { hasMission: false, title: null } };
  }
  const locale = resolveDictionaryLocale(useAppSettingsStore.getState().locale);
  const title =
    locale === 'en'
      ? (bundle.mission.titleEn?.trim() || bundle.mission.title?.trim() || bundle.mission.id)
      : (bundle.mission.title?.trim() || bundle.mission.id);
  const current = getCurrentSequentialObjective(bundle.mission, bundle.progress);
  const objectiveLabel = current
    ? (locale === 'en'
      ? (current.descriptionEn?.trim() || current.description?.trim() || current.id)
      : (current.description?.trim() || current.id))
    : '';
  return {
    name: 'get_active_mission',
    data: {
      hasMission: true,
      title: title.slice(0, 80),
      missionId: bundle.mission.id,
      objectiveId: current?.id ?? '',
      objectiveLabel: objectiveLabel.slice(0, 80) || null,
    },
  };
}

function runOne(name: string, turn: ArcCoreChatTurn): ArcCoreChatToolResult | null {
  const player = usePlayerStore.getState().player;
  if (name === 'get_location') {
    const planetId = player?.currentPlanetId?.trim() ?? '';
    const planet = planetId ? resolvePlanetById(planetId) : null;
    return {
      name,
      data: {
        planetId: planetId || null,
        planetLabel: turn.facts.planetLabel || planet?.name?.trim() || null,
      },
    };
  }
  if (name === 'get_callsign') {
    const nick = player?.nickname?.trim() ?? '';
    const locale = resolveDictionaryLocale(useAppSettingsStore.getState().locale);
    return { name, data: { callsign: nick || (locale === 'en' ? 'Pilot' : '파일럿') } };
  }
  if (name === 'get_spy_alert') {
    const pending = getPendingArcCoreSpyIntelAlert();
    return {
      name,
      data: {
        pending: pending != null,
        planetId: pending?.planetId?.trim() || null,
      },
    };
  }
  if (name === 'get_last_combat') {
    const last = getLastMatchSummarySync();
    if (!last) {
      return {
        name,
        data: { hasRecord: turn.facts.hasCombatRecord, planetId: null, playerWon: null },
      };
    }
    return {
      name,
      data: {
        hasRecord: true,
        planetId: last.planetId,
        playerWon: last.playerWon,
        engageSec: last.engageSec,
      },
    };
  }
  if (name === 'get_latest_notice') return runLatestNotice();
  if (name === 'get_active_mission') return runActiveMission();
  if (name === 'get_planet_vitality') {
    return {
      name,
      data: {
        planetId: player?.currentPlanetId?.trim() || null,
        tier: turn.facts.vitalityTier?.trim() || null,
      },
    };
  }
  if (name === 'get_mining_allowance') {
    return {
      name,
      data: {
        planetId: player?.currentPlanetId?.trim() || null,
        exhausted: turn.facts.miningAllowanceExhausted === true,
      },
    };
  }
  if (name === 'get_daily_ops_status') {
    return {
      name,
      data: {
        settledToday: turn.facts.dailyOpsSettledToday === true,
      },
    };
  }
  if (name === 'get_planet_cores') {
    const planetId = player?.currentPlanetId?.trim() ?? '';
    const runtime = planetId
      ? usePlanetCoreRuntimeStore.getState().getPlanetCoreRuntime(planetId)
      : undefined;
    if (!runtime) {
      return { name, data: { planetId: planetId || null, resource: null } };
    }
    return {
      name,
      data: {
        planetId,
        resource: runtime.resource,
        population: runtime.population,
        defense: runtime.defense,
        technology: runtime.technology,
        environment: runtime.environment,
      },
    };
  }
  return null;
}

export function runArcCoreChatReadTools(
  requested: readonly string[],
  turn: ArcCoreChatTurn,
): ArcCoreChatToolResult[] {
  const out: ArcCoreChatToolResult[] = [];
  const seen = new Set<string>();
  const names = requested.length > 0 ? requested : ['get_location'];
  for (let i = 0; i < names.length && out.length < 4; i += 1) {
    const name = names[i]!.trim();
    if (!name || seen.has(name) || !ALLOWED_TOOLS.includes(name)) continue;
    seen.add(name);
    const row = runOne(name, turn);
    if (row) out.push(row);
  }
  return out;
}
