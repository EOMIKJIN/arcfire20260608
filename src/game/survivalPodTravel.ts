// ============================================================
// 생존포드 이동·전투 게이트 — 이미지/구매 경로 import 없음 (tsx --test 호환)
// 전함 격침 후: 착륙 가능(비-RED) 성계로 이동해 조선소 재탑승. 전투는 불가.
// ============================================================

import type { Player, PlayerShip } from '../types';
import { isSurvivalPodNpcShipId } from './survivalPodIds';

function shipDurabilityPct(ship: PlayerShip | null | undefined): number {
  if (!ship) return 0;
  const raw = ship.durabilityPct;
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return 100;
  return Math.max(0, Math.min(100, raw));
}

export function isPlayerOnSurvivalPod(
  player: Pick<Player, 'ship'> | null | undefined,
): boolean {
  const id = player?.ship?.portraitNpcCapitalShipId?.trim();
  return Boolean(id && isSurvivalPodNpcShipId(id));
}

export function isPlayerShipCombatCapable(ship: PlayerShip | null | undefined): boolean {
  if (!ship) return false;
  const id = ship.portraitNpcCapitalShipId?.trim();
  if (id && isSurvivalPodNpcShipId(id)) return false;
  return shipDurabilityPct(ship) > 0;
}

export type PlayerTravelBlockReason = 'durability' | 'missing_ship';
export type SurvivalPodDestinationBlockReason = 'pod_unlandable';

export function resolvePlayerTravelBlock(
  player: Pick<Player, 'ship'> | null | undefined,
): PlayerTravelBlockReason | null {
  if (!player?.ship) return 'missing_ship';
  if (isPlayerOnSurvivalPod(player)) return null;
  if (shipDurabilityPct(player.ship) <= 0) return 'durability';
  return null;
}

export function resolveSurvivalPodDestinationBlock(input: {
  player: Pick<Player, 'ship'> | null | undefined;
  destStayBlocked: boolean;
}): SurvivalPodDestinationBlockReason | null {
  if (!isPlayerOnSurvivalPod(input.player)) return null;
  if (input.destStayBlocked) return 'pod_unlandable';
  return null;
}
