// ============================================================
// 반란 전복·내전 — 일 1회 ArcCore 배치
// ============================================================

import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';
import { resolveCoreOpenGameplayPlanetRef, forEachCoreOpenGameplayPlanet } from '../../world/coreOpenGameplayPlanets';
import { isPlanetContestedZone } from '../balance/balanceTableRegistry';
import {
  resolveRebellionOverthrowProbMul,
  resolveRebellionResolutionPolicy,
  resolveWealthDisparityGlobalPolicy,
} from '../balance/wealthDisparityPolicy';
import { planetAttackKstDayKey } from '../planetAttack/planetAttackKstDayKey';
import { shouldRebellionOverthrowSucceed } from '../rebellion/computePlanetWealthDisparityDailyDelta';
import { applyRebellionOverthrowHold } from '../rebellion/applyRebellionOverthrowHold';
import {
  publishRebellionOverthrowNotice,
  publishRebellionSimmeringNotice,
} from '../rebellion/notifyPlanetRebellionOperatorAlert';
import { tryPresentRealtimeCivilWarSimmeringOperatorAlert } from '../../game/planetHubRebellionOperatorDialog';
import { useClanWarFoundationStore } from '../../store/clanWarFoundationStore';
import { resolveMapFactionSideFromClanIdPure } from '../../galaxyMap/mapFactionSideCore';
import {
  isPlanetCoreGaugeIntentBatchActive,
  pushPlanetCoreGaugeIntent,
} from './planetCoreGaugeIntent';
import type { PlanetWealthDisparityDetail } from '../../store/planetCoreMetricTypes';

export type PlanetRebellionResolutionDailyPassResult = {
  ran: boolean;
  overthrows: number;
  simmering: number;
  penaltiesApplied: number;
};

function applySimmeringPenalties(planetId: string, policy: ReturnType<typeof resolveRebellionResolutionPolicy>): boolean {
  if (!isPlanetCoreGaugeIntentBatchActive()) return false;
  pushPlanetCoreGaugeIntent(
    planetId,
    {
      population: -policy.simmeringPopPenaltyPerDay,
      resource: -policy.simmeringResourcePenaltyPerDay,
    },
    'arc_core',
  );
  return true;
}

/**
 * 일 1회 — wealthDisparity 직후 · stat equilibrium 직전.
 */
export function runPlanetRebellionResolutionDailyPass(): PlanetRebellionResolutionDailyPassResult {
  const wdiPolicy = resolveWealthDisparityGlobalPolicy();
  const policy = resolveRebellionResolutionPolicy();
  const empty: PlanetRebellionResolutionDailyPassResult = {
    ran: false,
    overthrows: 0,
    simmering: 0,
    penaltiesApplied: 0,
  };
  if (!policy.enabled || !wdiPolicy.enabled) return empty;

  const coreStore = usePlanetCoreRuntimeStore.getState();
  if (!coreStore.hydrated) return empty;

  const kstDayKey = planetAttackKstDayKey();
  let overthrows = 0;
  let simmering = 0;
  let penaltiesApplied = 0;

  forEachCoreOpenGameplayPlanet(({ planetId, planet }) => {
    if (isPlanetContestedZone(planetId)) return;

    const runtime = coreStore.getPlanetCoreRuntime(planetId);
    const wealth = runtime?.detail?.wealthDisparity;
    if (!runtime || !wealth || wealth.version !== 1) return;
    if (wealth.rebellionPhase === 'overthrow') return;

    const ref = resolveCoreOpenGameplayPlanetRef(planetId);
    if (!ref) return;

    if (wealth.rebellionPhase === 'simmering') {
      if (applySimmeringPenalties(planetId, policy)) penaltiesApplied += 1;
    }

    if (wealth.wdi < wdiPolicy.wdiDangerMin) return;

    const hold = useClanWarFoundationStore.getState().planetHolds[planetId];
    const clans = useClanWarFoundationStore.getState().clans;
    const factionSide = resolveMapFactionSideFromClanIdPure(hold?.occupierClanId ?? 'neutral', clans);
    const factionMul = resolveRebellionOverthrowProbMul(factionSide);

    const rollPolicy = {
      wdiDangerMin: wdiPolicy.wdiDangerMin,
      overthrowBaseProbAtDanger: policy.overthrowBaseProbAtDanger,
      overthrowProbSpanToMax: policy.overthrowProbSpanToMax,
    };

    const succeeded = shouldRebellionOverthrowSucceed(
      planetId,
      kstDayKey,
      wealth.wdi,
      factionMul,
      rollPolicy,
    );

    let nextDetail: PlanetWealthDisparityDetail = { ...wealth };

    if (succeeded) {
      const applied = applyRebellionOverthrowHold(planetId, ref.system.id);
      nextDetail = {
        ...nextDetail,
        rebellionPhase: 'overthrow',
        wdi: policy.overthrowWdiOnSuccess,
        tier: 'danger',
        kstDayKey,
        updatedAtMs: Date.now(),
      };
      overthrows += 1;

      if (applied.applied) {
        publishRebellionOverthrowNotice({
          planetId,
          planetLabelKo: planet.name ?? planetId,
          previousSide: applied.previousSide,
          wdi: policy.overthrowWdiOnSuccess,
        });
      }
    } else if (wealth.rebellionPhase !== 'simmering') {
      nextDetail = {
        ...nextDetail,
        rebellionPhase: 'simmering',
        kstDayKey,
        updatedAtMs: Date.now(),
      };
      simmering += 1;
      publishRebellionSimmeringNotice({
        planetId,
        planetLabelKo: planet.name ?? planetId,
        wdi: wealth.wdi,
      });
      tryPresentRealtimeCivilWarSimmeringOperatorAlert(planetId);
      if (applySimmeringPenalties(planetId, policy)) penaltiesApplied += 1;
    }

    const changed =
      nextDetail.rebellionPhase !== wealth.rebellionPhase
      || nextDetail.wdi !== wealth.wdi
      || nextDetail.tier !== wealth.tier;

    if (changed) {
      coreStore.patchPlanetCore(planetId, {
        detail: { ...runtime.detail, wealthDisparity: nextDetail },
      });
    }
  });

  return {
    ran: overthrows > 0 || simmering > 0 || penaltiesApplied > 0,
    overthrows,
    simmering,
    penaltiesApplied,
  };
}
