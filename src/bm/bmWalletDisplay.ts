import type { Player } from '../types';

/** v2.0 BM — 보석 잔액 표시 (IAP·교환 연동 전 optional 필드, 없으면 0) */
export function resolvePlayerGemBalance(player: Pick<Player, 'gems'> | null | undefined): number {
  const raw = player?.gems;
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return 0;
  return Math.max(0, Math.floor(raw));
}

export function formatGemBalance(amount: number): string {
  const n = Number.isFinite(amount) ? Math.max(0, Math.floor(amount)) : 0;
  return n.toLocaleString();
}
