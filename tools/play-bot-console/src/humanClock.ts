/**
 * 트윈 행동을 사람이 실기에서 들일 시간(초)으로 환산한다.
 * 근거는 human-seed 의 비트 간격(직전 비트 → 이 비트). fast=중앙값(빠른 손), real=평균(메뉴·대기 포함).
 * 채굴·수색은 실기 비트가 아직 없어 가정값이다(assumed=true).
 */
import fs from 'node:fs';
import path from 'node:path';
import type { JournalEntry, JournalKind } from './types';

export type HumanClock = {
  fast: Record<string, number>;
  real: Record<string, number>;
  sessions: number;
  assumed: string[];
};

const FALLBACK_FAST: Record<string, number> = { depart: 14, travel: 7, land: 13, combat: 54, trade: 84, quest: 5 };
const FALLBACK_REAL: Record<string, number> = { depart: 112, travel: 7, land: 82, combat: 123, trade: 133, quest: 21 };
/** 실기 비트 없음 — 화면 1회 조작 기준 가정 */
const ASSUMED_FAST: Record<string, number> = { mine: 15, search: 10, menu: 5 };
const ASSUMED_REAL: Record<string, number> = { mine: 30, search: 20, menu: 21 };

export function loadHumanClock(learnedDir: string): HumanClock {
  const fast: Record<string, number> = { ...FALLBACK_FAST, ...ASSUMED_FAST };
  const real: Record<string, number> = { ...FALLBACK_REAL, ...ASSUMED_REAL };
  let sessions = 0;
  const assumed = ['mine', 'search', 'menu'];
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(learnedDir, 'human-seed-v0.json'), 'utf8')) as {
      traces?: { beats?: { tSec: number; verb: string }[] }[];
    };
    const gaps: Record<string, number[]> = {};
    const traces = raw.traces ?? [];
    sessions = traces.length;
    for (let i = 0; i < traces.length; i += 1) {
      const b = traces[i].beats ?? [];
      for (let j = 1; j < b.length; j += 1) {
        const d = b[j].tSec - b[j - 1].tSec;
        if (d >= 0) (gaps[b[j].verb] ??= []).push(d);
      }
    }
    for (const [verb, arr] of Object.entries(gaps)) {
      if (arr.length < 5) continue;
      arr.sort((a, z) => a - z);
      fast[verb] = arr[Math.floor(arr.length / 2)];
      real[verb] = Math.round(arr.reduce((a, z) => a + z, 0) / arr.length);
      const at = assumed.indexOf(verb);
      if (at >= 0) assumed.splice(at, 1);
    }
  } catch {
    /* 시드 없으면 고정 기본값 */
  }
  return { fast, real, sessions, assumed };
}

function verbsFor(kind: JournalKind, prevKind: JournalKind | ''): string[] {
  switch (kind) {
    case 'TRAVEL':
    case 'LAND':
      return ['depart', 'travel', 'land'];
    case 'COMBAT':
    case 'DESTROY':
      return ['combat'];
    case 'TRADE':
      return prevKind === 'TRADE' ? [] : ['trade'];
    case 'QUEST':
      return ['quest'];
    case 'MINE':
      return ['mine'];
    case 'SEARCH':
      return ['search'];
    case 'SAT':
    case 'ANNEX':
    case 'COLONIZE':
    case 'SKILL':
    case 'GEAR':
    case 'DEVELOP':
    case 'EXCHANGE':
    case 'REBOARD':
      return ['menu'];
    default:
      return [];
  }
}

/** 한 행동의 사람 초 [fast, real]. 이미 착륙(....)·정지·일일 분석은 0. 연속 매도는 한 화면으로 본다. */
export function humanSecondsFor(clock: HumanClock, e: JournalEntry, prevKind: JournalKind | ''): [number, number] {
  if (e.silent || e.hold || e.line === '....' || e.line.endsWith('이미 착륙')) return [0, 0];
  const verbs = verbsFor(e.kind, prevKind);
  let f = 0;
  let r = 0;
  for (let i = 0; i < verbs.length; i += 1) {
    f += clock.fast[verbs[i]] ?? 0;
    r += clock.real[verbs[i]] ?? 0;
  }
  return [f, r];
}
