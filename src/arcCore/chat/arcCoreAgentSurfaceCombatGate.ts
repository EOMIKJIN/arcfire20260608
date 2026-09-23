import { useWaveDefenseStore } from '../../game/waveDefense/waveDefenseStore';
import { useOrbitCapitalCombatUiStore } from '../../store/orbitCapitalCombatUiStore';

export function resolveArcCoreAgentSurfaceCombatBlocked(input: {
  waveActive: boolean;
  orbitCombatActive: boolean;
}): boolean {
  return input.waveActive || input.orbitCombatActive;
}

/** 전투(허브 궤도·웨이브·이동전) 중 에이전트 면 활성화 금지. */
export function isArcCoreAgentSurfaceCombatBlocked(): boolean {
  return resolveArcCoreAgentSurfaceCombatBlocked({
    waveActive: useWaveDefenseStore.getState().active === true,
    orbitCombatActive: useOrbitCapitalCombatUiStore.getState().active === true,
  });
}
