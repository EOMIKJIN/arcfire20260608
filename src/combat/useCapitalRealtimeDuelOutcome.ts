import { useEffect, useRef } from 'react';
import type { CapitalRealtimeCombatSim } from './capitalRealtimeTypes';

/**
 * 팀 생존 폴링. 통상 red=적 슬롯, blue=플레이어(아군) 슬롯.
 * 콜백 참조는 매 프레임 최신으로 유지한다.
 */
export function useCapitalRealtimeDuelOutcome(
  sim: CapitalRealtimeCombatSim | null,
  onEnemySlotDefeated: (() => void) | undefined,
  onPlayerSlotDefeated: (() => void) | undefined,
  pollMs = 90,
): void {
  const onEnemy = useRef(onEnemySlotDefeated);
  const onPlayer = useRef(onPlayerSlotDefeated);
  onEnemy.current = onEnemySlotDefeated;
  onPlayer.current = onPlayerSlotDefeated;

  useEffect(() => {
    if (!sim) return;
    const id = setInterval(() => {
      const agents = sim.agentsRef.current;
      const anyRedAlive = agents.some(a => a.alive && a.team === 'red');
      const anyBlueAlive = agents.some(a => a.alive && a.team === 'blue');
      if (!anyBlueAlive) onPlayer.current?.();
      else if (!anyRedAlive) onEnemy.current?.();
    }, pollMs);
    return () => clearInterval(id);
  }, [sim, pollMs]);
}
