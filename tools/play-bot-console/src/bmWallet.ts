/**
 * BM v2.0 — 보석 지갑에서 크레딧 교환. 크레딧으로 보석을 사지 않는다.
 * 교환 상품·스타터 보석량은 앱 표를 읽는다.
 * 일 64 · 주 400은 플레이봇 지갑만의 월 2만 원 상한이다.
 * 실제 앱의 실사용 유저에게는 이 상한이 없다. 앱 정책 표를 이 숫자로 바꾸지 않는다.
 * 소형팩 ₩11/💎 기준 봇 31일 최대 1,792💎 ≈ ₩19,712.
 */
import { GemExchangeCatalog_FROM_BALANCE_CSV } from '../../../src/data/balance/generated/csvGemExchangeCatalog';
import { GemPackCatalog_FROM_BALANCE_CSV } from '../../../src/data/balance/generated/csvGemPackCatalog';
import type { WorldState } from './types';

const BOT_EXCHANGE_DAILY_CAP_GEMS = 64;
const BOT_EXCHANGE_WEEKLY_CAP_GEMS = 400;

export type CreditExchangeOffer = {
  productId: string;
  gemCost: number;
  creditGrant: number;
};

const OFFERS: CreditExchangeOffer[] = GemExchangeCatalog_FROM_BALANCE_CSV.map((row) => ({
  productId: row.productId,
  gemCost: Math.max(0, Math.floor(Number(row.gemCost) || 0)),
  creditGrant: Math.max(0, Math.floor(Number(row.creditAmount) || 0)),
})).filter((row) => row.gemCost > 0 && row.creditGrant > 0);

export function starterGemBalance(): number {
  for (let i = 0; i < GemPackCatalog_FROM_BALANCE_CSV.length; i += 1) {
    const row = GemPackCatalog_FROM_BALANCE_CSV[i];
    if (row.productId === 'starter_pack') {
      return Math.max(0, Math.floor(Number(row.gemAmount) || 0));
    }
  }
  return 0;
}

export function gemExchangeCap(): { daily: number; weekly: number } {
  return {
    daily: BOT_EXCHANGE_DAILY_CAP_GEMS,
    weekly: BOT_EXCHANGE_WEEKLY_CAP_GEMS,
  };
}

function rollExchangeWindow(world: WorldState): void {
  const week = Math.floor(Math.max(0, world.day - 1) / 7);
  if (world.gemExchangeDay !== world.day) {
    world.gemExchangeDay = world.day;
    world.gemsSpentDay = 0;
  }
  if (world.gemExchangeWeek !== week) {
    world.gemExchangeWeek = week;
    world.gemsSpentWeek = 0;
  }
}

/** 부족분을 덮는 가장 작은 상품. 없으면 상한 안에서 가장 큰 한 건. */
export function pickCreditExchange(
  shortfall: number,
  gems: number,
  spentDay: number,
  spentWeek: number,
): CreditExchangeOffer | null {
  if (shortfall <= 0 || gems <= 0) return null;
  const cap = gemExchangeCap();
  let cover: CreditExchangeOffer | null = null;
  let partial: CreditExchangeOffer | null = null;
  for (let i = 0; i < OFFERS.length; i += 1) {
    const row = OFFERS[i];
    if (row.gemCost > gems) continue;
    if (spentDay + row.gemCost > cap.daily) continue;
    if (spentWeek + row.gemCost > cap.weekly) continue;
    if (row.creditGrant >= shortfall) {
      if (!cover || row.gemCost < cover.gemCost) cover = row;
    } else if (!partial || row.creditGrant > partial.creditGrant) {
      partial = row;
    }
  }
  return cover ?? partial;
}

export function takeCreditExchange(
  world: WorldState,
  shortfall: number,
): CreditExchangeOffer | null {
  rollExchangeWindow(world);
  const pick = pickCreditExchange(shortfall, world.gems, world.gemsSpentDay, world.gemsSpentWeek);
  if (!pick) return null;
  world.gems -= pick.gemCost;
  world.gemsSpentDay += pick.gemCost;
  world.gemsSpentWeek += pick.gemCost;
  world.credits += pick.creditGrant;
  world.trades += 1;
  return pick;
}
