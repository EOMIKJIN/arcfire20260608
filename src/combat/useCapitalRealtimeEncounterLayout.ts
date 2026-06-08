import { useEffect } from 'react';
import type { CapitalRealtimeCombatSim, CapitalRealtimeEncounterLayout } from './capitalRealtimeTypes';

/** 전투 진입 시 팀별 외곽선·최대 HP를 맞춘다(살아 있으면 현재 HP는 max로 클램프). */
export function applyCapitalRealtimeEncounterLayout(
  sim: CapitalRealtimeCombatSim,
  layout: CapitalRealtimeEncounterLayout,
): void {
  const agents = sim.agentsRef.current;
  if (agents.length < 1) return;
  for (const ag of agents) {
    const slot = ag.team === layout.slot0.team ? layout.slot0 : layout.slot1;
    ag.team = slot.team;
    ag.stroke = slot.stroke;
    ag.maxHullHp = slot.maxHullHp;
    ag.hullHp = Math.min(ag.hullHp, ag.maxHullHp);
  }
}

/** `layout`이 바뀔 때마다 시뮬 에이전트에 반영(동일 스테이지에서 재교전 시 deps로 제어). */
export function useCapitalRealtimeEncounterLayoutEffect(
  sim: CapitalRealtimeCombatSim | null,
  layout: CapitalRealtimeEncounterLayout | null,
): void {
  useEffect(() => {
    if (!sim || !layout) return;
    applyCapitalRealtimeEncounterLayout(sim, layout);
  }, [sim, layout]);
}
