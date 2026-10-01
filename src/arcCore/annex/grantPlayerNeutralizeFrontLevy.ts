/**
 * 플레이어 점령 중립화 → 블루 금고 전선 징수.
 * 틱/부트 금지. applyArcCoreTerritorialHold 1회 경로만.
 */
import { useBlueTeamSharedVaultStore } from '../../store/factionVault/blueTeamSharedVaultStore';

export const PLAYER_NEUTRALIZE_FRONT_LEVY_CREDITS = 2000;

export function grantPlayerNeutralizeFrontLevy(planetId: string): number {
  const id = String(planetId ?? '').trim();
  if (!id) return 0;
  useBlueTeamSharedVaultStore.getState().appendInflow(PLAYER_NEUTRALIZE_FRONT_LEVY_CREDITS, {
    kind: 'player_front_levy',
    planetId: id,
    note: 'player_neutralize',
  });
  return PLAYER_NEUTRALIZE_FRONT_LEVY_CREDITS;
}
