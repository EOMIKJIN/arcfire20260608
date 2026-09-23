/**
 * 미션 진행 blob 로드 정규화 — 손상 키·비객체·상태 오염을 persist에 다시 쓰지 않는다.
 */
import type { MissionProgress, MissionStatus } from '../types';

const STATUS_OK: ReadonlySet<string> = new Set([
  'locked',
  'available',
  'active',
  'complete',
  'failed',
]);

const MAX_OBJECTIVE_KEYS = 32;
const MAX_TITLE = 80;

function asFiniteInt(raw: unknown): number | undefined {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return undefined;
  return Math.floor(raw);
}

function sanitizeObjectives(raw: unknown): Record<string, boolean> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const src = raw as Record<string, unknown>;
  const keys = Object.keys(src);
  const out: Record<string, boolean> = {};
  const limit = Math.min(keys.length, MAX_OBJECTIVE_KEYS);
  for (let i = 0; i < limit; i += 1) {
    const key = keys[i]!.trim();
    if (!key) continue;
    out[key] = src[keys[i]!] === true;
  }
  return out;
}

export function sanitizeMissionProgress(
  key: string,
  raw: unknown,
): MissionProgress | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const row = raw as Record<string, unknown>;
  const idRaw = typeof row.missionId === 'string' ? row.missionId.trim() : '';
  const missionId = idRaw || key.trim();
  if (!missionId || missionId !== key.trim()) return null;
  const status = typeof row.status === 'string' && STATUS_OK.has(row.status)
    ? (row.status as MissionStatus)
    : null;
  if (!status) return null;
  const startedAt = asFiniteInt(row.startedAt);
  const completedAt = asFiniteInt(row.completedAt);
  const expiresAtMs = asFiniteInt(row.expiresAtMs);
  const rewardedAt = asFiniteInt(row.rewardedAt);
  const titleSnapshot =
    typeof row.titleSnapshot === 'string' ? row.titleSnapshot.trim().slice(0, MAX_TITLE) : '';
  const assigned =
    typeof row.assignedClearNpcCaptainId === 'string'
      ? row.assignedClearNpcCaptainId.trim()
      : '';
  const captainPersonalTemplateId =
    typeof row.captainPersonalTemplateId === 'string'
      ? row.captainPersonalTemplateId.trim()
      : '';
  const captainPersonalOfferPlanetId =
    typeof row.captainPersonalOfferPlanetId === 'string'
      ? row.captainPersonalOfferPlanetId.trim()
      : '';
  return {
    missionId,
    status,
    objectives: sanitizeObjectives(row.objectives),
    ...(startedAt != null ? { startedAt } : {}),
    ...(completedAt != null ? { completedAt } : {}),
    ...(expiresAtMs != null ? { expiresAtMs } : {}),
    ...(rewardedAt != null ? { rewardedAt } : {}),
    ...(titleSnapshot ? { titleSnapshot } : {}),
    ...(assigned ? { assignedClearNpcCaptainId: assigned } : {}),
    ...(captainPersonalTemplateId ? { captainPersonalTemplateId } : {}),
    ...(captainPersonalOfferPlanetId ? { captainPersonalOfferPlanetId } : {}),
  };
}

export function sanitizeMissionProgresses(
  raw: unknown,
): { progresses: Record<string, MissionProgress>; changed: boolean } {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { progresses: {}, changed: raw != null };
  }
  const src = raw as Record<string, unknown>;
  const keys = Object.keys(src);
  const progresses: Record<string, MissionProgress> = {};
  let changed = false;
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i]!;
    const next = sanitizeMissionProgress(key, src[key]);
    if (!next) {
      changed = true;
      continue;
    }
    progresses[key] = next;
    const rawRow = src[key] as Record<string, unknown>;
    const rawObjs = rawRow.objectives;
    if (rawObjs && typeof rawObjs === 'object' && !Array.isArray(rawObjs)) {
      const objKeys = Object.keys(rawObjs as Record<string, unknown>);
      for (let j = 0; j < objKeys.length; j += 1) {
        if (typeof (rawObjs as Record<string, unknown>)[objKeys[j]!] !== 'boolean') {
          changed = true;
          break;
        }
      }
    }
  }
  return { progresses, changed };
}

export function sanitizeActiveMissionId(
  raw: unknown,
  progresses: Record<string, MissionProgress>,
): string | null {
  if (typeof raw !== 'string') return null;
  const id = raw.trim();
  if (!id) return null;
  const progress = progresses[id];
  if (!progress || progress.status !== 'active') return null;
  return id;
}
