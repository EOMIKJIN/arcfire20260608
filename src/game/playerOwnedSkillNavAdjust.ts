// ============================================================
// 항법 스킬 — 스캔·워프 연료 캡 후 절감 · 시장 감지 (견적 1회)
// ============================================================

import type { StarSystem } from '../types';
import { getItemDef } from '../data/itemRegistry';
import { sumOwnedSkillStatBonus } from './ownedSkillStatBonus';
import { resolveSkillAutoCombatPolicy } from './skillAutoCombatPolicy';

const MARKET_SENSE_SKU_FALLBACK = ['food', 'minerals', 'tech'] as const;

function pickNeighborPreviewSku(tradeGoods: readonly string[] | undefined): string {
  if (tradeGoods) {
    for (let i = 0; i < tradeGoods.length; i += 1) {
      const id = tradeGoods[i]!;
      if (id === 'food' || id === 'minerals' || id === 'tech') return id;
    }
    if (tradeGoods[0]) return tradeGoods[0];
  }
  return MARKET_SENSE_SKU_FALLBACK[0];
}

function readOwnedSkillIds(ownedSkillIds?: readonly string[]): readonly string[] {
  if (ownedSkillIds) return ownedSkillIds;
  const { usePlayerStore } = require('../store/playerStore') as typeof import('../store/playerStore');
  return usePlayerStore.getState().player?.skills ?? [];
}

function owns(id: string, ownedSkillIds?: readonly string[]): boolean {
  return readOwnedSkillIds(ownedSkillIds).includes(id);
}

function stat(key: string, ownedSkillIds?: readonly string[]): number {
  return sumOwnedSkillStatBonus(key, readOwnedSkillIds(ownedSkillIds));
}

export function applySensorArrayToDurationMs(
  durationMs: number,
  ownedSkillIds?: readonly string[],
): number {
  const raw = Math.max(0, durationMs);
  const policy = resolveSkillAutoCombatPolicy();
  const reduce = Math.min(policy.scanDurationReduceCapPct, Math.max(0, stat('sensor_range', ownedSkillIds)));
  if (reduce <= 0) return raw;
  return Math.max(800, Math.round(raw * (1 - reduce / 100)));
}

export function applyPostCapNavFuelDiscount(
  credits: number,
  input: {
    ownedSkillIds?: readonly string[];
    destSystemId?: string | null;
    visitedSystemIds?: readonly string[];
    hopCount?: number;
    hopSkipped?: boolean;
  },
): { credits: number; wormhole: boolean; jumpBoost: boolean; uncharted: boolean } {
  let next = Math.max(0, Math.floor(credits));
  const policy = resolveSkillAutoCombatPolicy();
  const owned = input.ownedSkillIds;
  let wormhole = false;
  let jumpBoost = false;
  let uncharted = false;

  const finder = owns('wormhole_finder', owned) || stat('shortcut_find', owned) > 0;
  if (finder && !input.hopSkipped && policy.wormholeFinderPostcapPct > 0) {
    next = Math.max(0, Math.round(next * (1 - policy.wormholeFinderPostcapPct / 100)));
    wormhole = true;
  }

  const dest = String(input.destSystemId ?? '').trim();
  if (owns('star_pathfinder', owned) && dest) {
    const visited = input.visitedSystemIds ?? [];
    let seen = false;
    for (let i = 0; i < visited.length; i += 1) {
      if (visited[i] === dest) {
        seen = true;
        break;
      }
    }
    if (!seen && policy.starPathfinderUnchartedPct > 0) {
      next = Math.max(0, Math.round(next * (1 - policy.starPathfinderUnchartedPct / 100)));
      uncharted = true;
    }
  }

  return { credits: next, wormhole, jumpBoost: false, uncharted };
}

/** 하이퍼점프 연출 시간 — jump_boost `jump_speed` % */
export function applyJumpBoostToTransitMs(
  durationMs: number,
  ownedSkillIds?: readonly string[],
): number {
  const jump = Math.max(0, Math.min(60, stat('jump_speed', ownedSkillIds)));
  if (jump <= 0) return Math.max(400, durationMs);
  return Math.max(400, Math.round(durationMs * (1 - jump / 100)));
}

export function resolveWormholeGeneratorSkipHops(ownedSkillIds?: readonly string[]): number {
  if (!owns('wormhole_generator', ownedSkillIds)) return 0;
  return resolveSkillAutoCombatPolicy().wormholeGeneratorSkipHops;
}

/** 0..99 결정론 롤 — 같은 출발·도착은 견적이 흔들리지 않는다 */
export function wormholeFinderShortcutRoll(fromSystemId: string, destSystemId: string): number {
  const s = `${fromSystemId}>${destSystemId}`;
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 100;
}

/** 웜홀 탐색 — 2홉 이상에서 shortcut_find% 로 1홉 스킵 */
export function resolveWormholeFinderSkipHops(input: {
  ownedSkillIds?: readonly string[];
  hopCount: number;
  fromSystemId?: string | null;
  destSystemId?: string | null;
}): number {
  if (input.hopCount < 2) return 0;
  if (!owns('wormhole_finder', input.ownedSkillIds) && stat('shortcut_find', input.ownedSkillIds) <= 0) {
    return 0;
  }
  const chance = Math.max(0, Math.min(80, stat('shortcut_find', input.ownedSkillIds) || 15));
  const from = String(input.fromSystemId ?? '').trim();
  const dest = String(input.destSystemId ?? '').trim();
  if (!from || !dest) return 0;
  return wormholeFinderShortcutRoll(from, dest) < chance ? 1 : 0;
}

export function playerOwnsSensorArray(ownedSkillIds?: readonly string[]): boolean {
  return owns('sensor_array', ownedSkillIds) || stat('sensor_range', ownedSkillIds) > 0;
}

/** 이동 안개 추가 홉. sensor_range 20 → 1 */
export function resolveSensorFogExtraHops(ownedSkillIds?: readonly string[]): number {
  if (!playerOwnsSensorArray(ownedSkillIds)) return 0;
  const range = Math.max(0, stat('sensor_range', ownedSkillIds));
  return Math.min(2, Math.max(1, Math.floor((range || 20) / 20)));
}

export function listMarketSenseNeighborLabels(
  currentSystemId: string,
  systems: Record<string, StarSystem>,
): string[] {
  const sys = systems[currentSystemId];
  if (!sys) return [];
  const out: string[] = [];
  for (let i = 0; i < sys.connections.length && out.length < 4; i += 1) {
    const n = systems[sys.connections[i]!];
    if (!n) continue;
    const sku = pickNeighborPreviewSku(n.planets[0]?.tradeGoods);
    const def = getItemDef(sku);
    const price = def && def.basePrice > 0 ? Math.floor(def.basePrice) : 0;
    if (price > 0 && def) {
      out.push(`${n.name} · ${def.name} ${price}`);
    } else {
      out.push(`${n.name} · ${n.planets[0]?.name ?? n.name}`);
    }
  }
  return out;
}
