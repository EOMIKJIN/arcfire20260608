// ============================================================
// 전선 알림 표현 — 전투 롤 불변. 틱/persist 없음.
// docs/strategy/MOBILE_WAR_IMMERSION_v1.md
// ============================================================

export type TerritorialPresentDecision =
  | 'battle'
  | 'neutral_declare'
  | 'status_quo'
  | 'player_wave_pending';

export type TerritorialPresentCombatMode =
  | 'blue_red'
  | 'blue_neutral'
  | 'red_neutral'
  | 'independent_invasion';

export type TerritorialPresentKind = 'battle' | 'seize' | 'declare' | 'quiet';

export function resolveTerritorialPresentKind(input: {
  decision: TerritorialPresentDecision;
  combatMode?: TerritorialPresentCombatMode;
}): TerritorialPresentKind {
  if (input.decision === 'status_quo') return 'quiet';
  if (input.decision === 'neutral_declare') return 'declare';
  if (input.decision === 'player_wave_pending') return 'battle';
  const mode = input.combatMode;
  if (mode === 'blue_neutral' || mode === 'red_neutral') return 'seize';
  return 'battle';
}
