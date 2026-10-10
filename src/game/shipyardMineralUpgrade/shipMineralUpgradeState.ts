// ============================================================
// 광물 강화 — 함선별 저장 (대표님 결정 2026-10-10)
// 강화·진행 job 은 격납고 항목(PlayerHangarShip)에 붙는다.
// 다른 함선으로 넘겨주지 않는다. 격침·제거로 항목이 빠지면 강화도 같이 사라진다.
// 생존포드는 강화 대상이 아니다.
// ============================================================

import type { MineralUpgradeJob, Player, PlayerHangarShip } from '../../types';
import { isSurvivalPodNpcShipId } from '../survivalPodIds';

/** 탑승 함선의 격납고 항목 index — 없거나 생존포드면 -1 */
export function findActiveShipHangarIndex(player: Pick<Player, 'ship' | 'shipHangar'>): number {
  const npcId = player.ship?.portraitNpcCapitalShipId?.trim();
  if (!npcId || isSurvivalPodNpcShipId(npcId)) return -1;
  return player.shipHangar.findIndex((h) => h.npcCapitalShipId === npcId);
}

export function getActiveShipMineralUpgrades(
  player: Pick<Player, 'ship' | 'shipHangar'> | null | undefined,
): Record<string, number> | undefined {
  if (!player) return undefined;
  const idx = findActiveShipHangarIndex(player);
  return idx >= 0 ? player.shipHangar[idx]!.mineralUpgrades : undefined;
}

export function getActiveShipMineralUpgradeJobs(
  player: Pick<Player, 'ship' | 'shipHangar'> | null | undefined,
): Record<string, MineralUpgradeJob> | undefined {
  if (!player) return undefined;
  const idx = findActiveShipHangarIndex(player);
  return idx >= 0 ? player.shipHangar[idx]!.mineralUpgradeJobs : undefined;
}

/** 어느 함선이든 진행 중 강화가 있는가(완료 감시 예약용) */
export function hasAnyShipMineralUpgradeJob(player: Pick<Player, 'shipHangar'> | null | undefined): boolean {
  if (!player) return false;
  for (let i = 0; i < player.shipHangar.length; i += 1) {
    const jobs = player.shipHangar[i]!.mineralUpgradeJobs;
    if (jobs && Object.keys(jobs).length > 0) return true;
  }
  return false;
}

/** 진행 중 강화 job 중 가장 이른 완료 시각 */
export function resolveEarliestShipMineralUpgradeCompleteAtMs(
  player: Pick<Player, 'shipHangar'> | null | undefined,
): number | null {
  if (!player) return null;
  let earliest: number | null = null;
  for (let i = 0; i < player.shipHangar.length; i += 1) {
    const jobs = player.shipHangar[i]!.mineralUpgradeJobs;
    if (!jobs) continue;
    for (const job of Object.values(jobs)) {
      if (earliest == null || job.completeAtMs < earliest) earliest = job.completeAtMs;
    }
  }
  return earliest;
}

/** 탑승 함선 격납고 항목만 바꾼 새 Player — 항목이 없으면 null */
export function patchActiveShipHangarEntry(
  player: Player,
  patch: (entry: PlayerHangarShip) => PlayerHangarShip,
): Player | null {
  const idx = findActiveShipHangarIndex(player);
  if (idx < 0) return null;
  const shipHangar = [...player.shipHangar];
  shipHangar[idx] = patch(shipHangar[idx]!);
  return { ...player, shipHangar };
}

export type SettledShipMineralUpgrade = { npcCapitalShipId: string; statId: string; targetLevel: number };

/** 완료 시각이 지난 job 을 각 함선 강화 레벨로 반영 — 변화 없으면 null */
export function settleShipMineralUpgradeJobs(
  player: Player,
  nowMs: number,
): { player: Player; completed: SettledShipMineralUpgrade[] } | null {
  const completed: SettledShipMineralUpgrade[] = [];
  let changed = false;
  const shipHangar = player.shipHangar.map((entry) => {
    const jobs = entry.mineralUpgradeJobs;
    if (!jobs) return entry;
    const statIds = Object.keys(jobs);
    if (statIds.length === 0) return entry;
    const nextJobs: Record<string, MineralUpgradeJob> = {};
    const nextUpgrades = { ...(entry.mineralUpgrades ?? {}) };
    let entryChanged = false;
    for (const statId of statIds) {
      const job = jobs[statId]!;
      if (nowMs >= job.completeAtMs) {
        const prevLv = Math.max(0, Math.floor(nextUpgrades[statId] ?? 0));
        nextUpgrades[statId] = Math.max(prevLv, job.targetLevel);
        completed.push({ npcCapitalShipId: entry.npcCapitalShipId, statId, targetLevel: job.targetLevel });
        entryChanged = true;
      } else {
        nextJobs[statId] = job;
      }
    }
    if (!entryChanged) return entry;
    changed = true;
    return {
      ...entry,
      mineralUpgrades: nextUpgrades,
      mineralUpgradeJobs: Object.keys(nextJobs).length > 0 ? nextJobs : undefined,
    };
  });
  if (!changed) return null;
  return { player: { ...player, shipHangar }, completed };
}

/**
 * 구세이브 이전 — 계정(player)에 있던 강화·job 을 그 시점 탑승 함선 항목으로 옮긴다(1회).
 * 탑승 함선 항목이 없으면(생존포드 등) 구 데이터는 버린다(함선별 원칙 · 넘겨주지 않음).
 */
export function migrateLegacyMineralUpgradesToActiveShip(player: Player): Player {
  const legacy = player.mineralUpgrades;
  const legacyJobs = player.mineralUpgradeJobs;
  if (legacy === undefined && legacyJobs === undefined) return player;
  const { mineralUpgrades: _u, mineralUpgradeJobs: _j, ...rest } = player;
  const base = rest as Player;
  const hasLegacy = (legacy && Object.keys(legacy).length > 0) || (legacyJobs && Object.keys(legacyJobs).length > 0);
  if (!hasLegacy) return base;
  const patched = patchActiveShipHangarEntry(base, (entry) => ({
    ...entry,
    mineralUpgrades: entry.mineralUpgrades ?? (legacy && Object.keys(legacy).length > 0 ? { ...legacy } : undefined),
    mineralUpgradeJobs: entry.mineralUpgradeJobs ?? (legacyJobs && Object.keys(legacyJobs).length > 0 ? { ...legacyJobs } : undefined),
  }));
  return patched ?? base;
}

/** 격납고 항목 강화 필드 정규화(저장 로드) */
export function sanitizeHangarMineralUpgrades(raw: unknown): Record<string, number> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const n = typeof v === 'number' ? Math.floor(v) : Number.NaN;
    if (Number.isFinite(n) && n > 0) out[k] = n;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function sanitizeHangarMineralUpgradeJobs(raw: unknown): Record<string, MineralUpgradeJob> | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const out: Record<string, MineralUpgradeJob> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!v || typeof v !== 'object') continue;
    const j = v as Record<string, unknown>;
    if (typeof j.targetLevel === 'number' && typeof j.startedAtMs === 'number' && typeof j.completeAtMs === 'number') {
      out[k] = { targetLevel: Math.floor(j.targetLevel), startedAtMs: j.startedAtMs, completeAtMs: j.completeAtMs };
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}
