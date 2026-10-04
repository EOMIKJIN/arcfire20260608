/**
 * 플레이 지능 카드. 하니스는 가상일마다 다시 읽고, 리뷰 주기는 이 카드만 올린다.
 * [pss-pre-dev] hot_path=가상일 1회 alloc=파일 시각이 같을 때 없음 cache=카드 1개
 * [pss-pre-dev] stage=Node 트윈 risk=P6 카드 기록만 verdict=PASS
 */
import fs from 'node:fs';
import path from 'node:path';
import { atomicWriteFile } from './learnedIo';

export const PLAY_INTEL_CASH_FLOOR = 400;
export const PLAY_INTEL_MINE_CAP_MIN = 8;
export const PLAY_INTEL_MINE_CAP_MAX = 16;
export const PLAY_INTEL_FAIR_MIN = 0.5;
export const PLAY_INTEL_FAIR_MAX = 0.65;
export const FQA_REVIEW_INTERVAL_MS = 30 * 60 * 1000;

export type PlayIntelligenceCard = {
  version: 1;
  updatedAt: string;
  cashFloor: number;
  mineCap: number;
  fairFightMin: number;
  earnEnabled: boolean;
  fairFightEnabled: boolean;
};

let cache: PlayIntelligenceCard = defaultPlayIntelligence();
let cacheMtime = 0;

export function defaultPlayIntelligence(): PlayIntelligenceCard {
  return {
    version: 1,
    updatedAt: '',
    cashFloor: PLAY_INTEL_CASH_FLOOR,
    mineCap: PLAY_INTEL_MINE_CAP_MIN,
    fairFightMin: PLAY_INTEL_FAIR_MIN,
    earnEnabled: true,
    fairFightEnabled: true,
  };
}

export function playIntelligencePath(dir: string): string {
  return path.join(dir, 'play-intelligence.json');
}

export function clampPlayIntelligence(raw: Partial<PlayIntelligenceCard> | null | undefined): PlayIntelligenceCard {
  const base = defaultPlayIntelligence();
  if (!raw) return base;
  const mine = Number(raw.mineCap);
  const fair = Number(raw.fairFightMin);
  return {
    version: 1,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : '',
    cashFloor: PLAY_INTEL_CASH_FLOOR,
    mineCap: Number.isFinite(mine)
      ? Math.min(PLAY_INTEL_MINE_CAP_MAX, Math.max(PLAY_INTEL_MINE_CAP_MIN, Math.round(mine)))
      : base.mineCap,
    fairFightMin: Number.isFinite(fair)
      ? Math.min(PLAY_INTEL_FAIR_MAX, Math.max(PLAY_INTEL_FAIR_MIN, Math.round(fair * 100) / 100))
      : base.fairFightMin,
    earnEnabled: raw.earnEnabled !== false,
    fairFightEnabled: raw.fairFightEnabled !== false,
  };
}

export function currentPlayIntelligence(): PlayIntelligenceCard {
  return cache;
}

export function resetPlayIntelligenceForTest(): void {
  cache = defaultPlayIntelligence();
  cacheMtime = 0;
}

export function loadPlayIntelligence(dir: string): PlayIntelligenceCard {
  const file = playIntelligencePath(dir);
  try {
    return clampPlayIntelligence(JSON.parse(fs.readFileSync(file, 'utf8')) as Partial<PlayIntelligenceCard>);
  } catch {
    return defaultPlayIntelligence();
  }
}

export function savePlayIntelligence(dir: string, card: PlayIntelligenceCard, nowMs: number): boolean {
  const next = clampPlayIntelligence({ ...card, updatedAt: new Date(nowMs).toISOString() });
  fs.mkdirSync(dir, { recursive: true });
  const ok = atomicWriteFile(playIntelligencePath(dir), JSON.stringify(next, null, 2));
  if (ok) {
    cache = next;
    try {
      cacheMtime = fs.statSync(playIntelligencePath(dir)).mtimeMs;
    } catch {
      cacheMtime = nowMs;
    }
  }
  return ok;
}

/** 가상일 1회. 시각이 같으면 디스크를 다시 읽지 않는다. */
export function reloadPlayIntelligence(dir: string): { changed: boolean; card: PlayIntelligenceCard } {
  const file = playIntelligencePath(dir);
  let mtime = 0;
  try {
    mtime = fs.statSync(file).mtimeMs;
  } catch {
    if (cacheMtime !== 0) {
      cache = defaultPlayIntelligence();
      cacheMtime = 0;
      return { changed: true, card: cache };
    }
    return { changed: false, card: cache };
  }
  if (mtime === cacheMtime) return { changed: false, card: cache };
  const prev = JSON.stringify(cache);
  cache = loadPlayIntelligence(dir);
  cacheMtime = mtime;
  return { changed: JSON.stringify(cache) !== prev, card: cache };
}
