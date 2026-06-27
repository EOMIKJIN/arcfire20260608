import { useEffect, useMemo, useState } from 'react';
import { resolveContestedZonePreviewSystemIds } from '../arcCore/territorial/resolveContestedZonePreviewSystemIds';
import {
  ensureTerritorialCampaignPreviewSchedules,
  getTerritorialCampaignGroupState,
  getTerritorialPreviewScheduleRevision,
  listTerritorialCampaignGroups,
  subscribeTerritorialPreviewSchedule,
} from '../arcCore/territorial/arcCoreTerritorialCombatState';
import { listTerritorialCombatPolicies } from '../arcCore/territorial/arcCoreTerritorialCombatPolicy';
import { TERRITORIAL_CAMPAIGN_PASS_INTERVAL_SEC } from '../arcCore/territorial/territorialCombatCampaign';

const PREVIEW_REFRESH_FALLBACK_MS = 60_000;

function msUntilNextPreviewRefresh(nowMs: number): number {
  const intervalMs = TERRITORIAL_CAMPAIGN_PASS_INTERVAL_SEC * 1000;
  const policies = listTerritorialCombatPolicies();
  let nextMs = PREVIEW_REFRESH_FALLBACK_MS;

  for (const group of listTerritorialCampaignGroups(policies)) {
    const state = getTerritorialCampaignGroupState(group);
    if (!state) continue;
    const remain = intervalMs - (nowMs - state.lastPassAtMs);
    if (remain > 0 && remain < nextMs) nextMs = remain + 500;
  }

  return Math.max(5_000, Math.min(PREVIEW_REFRESH_FALLBACK_MS, nextMs));
}

/** worldmap — 분쟁 링 대상 성계 id (미리 고정된 다음 판정 예고 1곳·캠페인당) */
export function useContestedZonePreviewSystemIds(active: boolean): ReadonlySet<string> {
  const [tick, setTick] = useState(() => getTerritorialPreviewScheduleRevision());

  useEffect(() => {
    if (!active) return;
    void ensureTerritorialCampaignPreviewSchedules().then(() => {
      setTick(getTerritorialPreviewScheduleRevision());
    });
  }, [active]);

  useEffect(() => {
    if (!active) return;
    return subscribeTerritorialPreviewSchedule(() => {
      setTick(getTerritorialPreviewScheduleRevision());
    });
  }, [active]);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      const delay = msUntilNextPreviewRefresh(Date.now());
      timer = setTimeout(() => {
        if (cancelled) return;
        setTick(getTerritorialPreviewScheduleRevision());
        schedule();
      }, delay);
    };

    schedule();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [active]);

  return useMemo(() => {
    void tick;
    return new Set(resolveContestedZonePreviewSystemIds(Date.now()));
  }, [tick]);
}
