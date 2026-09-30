/** 가상 벽시계. 1틱 = 90분 게임시간 · 16틱 = 1일. 앱 persist 없음. */
export const TICKS_PER_DAY = 16;
export const TICK_GAME_MS = 90 * 60 * 1000;
export const EPOCH_MS = 1_700_000_000_000;

export function gameNowMs(tick: number): number {
  return EPOCH_MS + tick * TICK_GAME_MS;
}

export function dayOfTick(tick: number): number {
  return Math.floor(tick / TICKS_PER_DAY) + 1;
}

export function tickInDay(tick: number): number {
  return tick % TICKS_PER_DAY;
}

export function isDayBoundary(tick: number): boolean {
  return tick > 0 && tick % TICKS_PER_DAY === 0;
}
