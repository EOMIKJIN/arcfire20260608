// ============================================================
// 팩션 side 판정 — 경량 모듈 (에셋·함대 레지스트리 의존 없음)
// 보급선·테스트 등 Node 순수 경로에서도 import 가능해야 한다.
// ============================================================

import type { TerritorialFactionSide } from './arcCoreTerritorialCombatPolicy';

/** hold 점유 side — 플레이어 독립국(INDEPENDENT·녹색)은 정식 팩션으로 판정에 참여 (2026-07-21) */
export type TerritorialHoldSide = TerritorialFactionSide | 'INDEPENDENT' | 'NEUTRAL';

export function resolveHoldFactionSide(
  occupierClanId: string | null | undefined,
): TerritorialHoldSide {
  if (!occupierClanId || occupierClanId === 'neutral') return 'NEUTRAL';
  if (occupierClanId === 'balance_seed_faction_red') return 'RED';
  if (occupierClanId === 'balance_seed_faction_blue') return 'BLUE';
  if (occupierClanId.includes('_red') || occupierClanId.includes('crimson')) return 'RED';
  if (occupierClanId.includes('_blue') || occupierClanId.includes('stellium')) return 'BLUE';
  // 플레이어 유래 클랜(솔로/클랜 — 지도 independent 판정과 동일 규칙) → 독립국 팩션
  if (!occupierClanId.startsWith('ai_clan_')) return 'INDEPENDENT';
  return 'NEUTRAL';
}

export function opposingTerritorialSide(
  side: TerritorialFactionSide | 'NEUTRAL',
): TerritorialFactionSide {
  return side === 'RED' ? 'BLUE' : 'RED';
}
