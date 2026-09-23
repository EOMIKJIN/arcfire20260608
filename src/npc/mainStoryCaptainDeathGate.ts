// ============================================================
// 메인스토리 함장 영구 사망 — 자격 게이트 + mark API
// docs/NPC_CAPTAIN_PERMANENT_DEATH_DESIGN.md v0.2
// ============================================================

import { getNpcCaptain } from './npcFleetRegistry';
import {
  useMainStoryCaptainDeadStore,
} from '../store/mainStoryCaptainDeadStore';
import type { MainStoryCaptainDeathCause, NpcCaptain } from '../types';

export type MarkMainStoryCaptainDeadResult =
  | { ok: true; captainId: string; cause: MainStoryCaptainDeathCause; alreadyDead?: boolean }
  | {
      ok: false;
      reason: 'invalid_id' | 'not_eligible' | 'wrong_death_class' | 'captain_missing';
    };

/** CSV 자격: deathEligible ∧ deathClass=main_story */
export function isMainStoryDeathEligibleCaptain(captain: NpcCaptain | undefined | null): boolean {
  if (!captain) return false;
  return Boolean(captain.deathEligible) && captain.deathClass === 'main_story';
}

export function isMainStoryDeathEligibleCaptainId(captainId: string): boolean {
  return isMainStoryDeathEligibleCaptain(getNpcCaptain(String(captainId ?? '').trim()));
}

/** 런타임 원장 — 사망 여부 (O(1) Set) */
export function isMainStoryCaptainDead(captainId: string): boolean {
  return useMainStoryCaptainDeadStore.getState().isDead(captainId);
}

/**
 * 전투 시드·미션 전투 리졸버용.
 * 일반 함장(미자격)은 항상 true · 메인스토리 자격+사망만 false.
 */
export function isCaptainAllowedInCombat(captainId: string): boolean {
  const id = String(captainId ?? '').trim();
  if (!id) return false;
  if (!isMainStoryCaptainDead(id)) return true;
  // 사망 기록이 있어도 자격 없는 id면(데이터 이상) 전투 허용 — 트래픽 보호
  if (!isMainStoryDeathEligibleCaptainId(id)) return true;
  return false;
}

/** 스토리 씬 출연·대화 캐스트 */
export function isCaptainAllowedInStoryCast(captainId: string): boolean {
  return isCaptainAllowedInCombat(captainId);
}

/**
 * 스토리 전투/스크립트 사망 확정.
 * deathEligible∧main_story 가 아니면 무시(일반 트래픽·웨이브 보호).
 */
export function markMainStoryCaptainDead(
  captainId: string,
  cause: MainStoryCaptainDeathCause,
): MarkMainStoryCaptainDeadResult {
  const id = String(captainId ?? '').trim();
  if (!id) return { ok: false, reason: 'invalid_id' };
  const captain = getNpcCaptain(id);
  if (!captain) return { ok: false, reason: 'captain_missing' };
  if (!captain.deathEligible) return { ok: false, reason: 'not_eligible' };
  if (captain.deathClass !== 'main_story') return { ok: false, reason: 'wrong_death_class' };

  const store = useMainStoryCaptainDeadStore.getState();
  if (store.isDead(id)) {
    return { ok: true, captainId: id, cause, alreadyDead: true };
  }
  const marked = store.markDead(id, cause);
  if (marked) void store.persistLocal();
  return { ok: true, captainId: id, cause };
}
