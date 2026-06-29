// ============================================================
// 아크코어 스파이 색출 — 함장 제거·expel (향후 플레이어 스킬 연동)
// ============================================================

import { dispatchArcCoreCommand } from '../ArcCoreCommandBus';
import { invalidateCaptainPresenceWorldIndexCache } from '../captainPresence/captainPresenceWorldIndexCache';
import { useArcCoreSpyExpelledStore } from '../../store/arcCoreSpyExpelledStore';
import { isArcCoreSpyTaggedCaptain } from './buildArcCoreSpyCaptainTagSet';

export type ExposeArcCoreSpyCaptainInput = {
  captainId: string;
  planetId: string;
  /** 향후: player_skill · counter_intel 등 */
  reason?: string;
};

export type ExposeArcCoreSpyCaptainResult =
  | { ok: true; captainId: string; planetId: string }
  | { ok: false; reason: 'not_spy_tagged' | 'already_expelled' | 'invalid_input' };

/**
 * 스파이 색출 — expel 기록 + 궤도 수송 함장은 즉시 이탈 phase.
 * 테이블 순찰 함장은 expel 로 스파이 피해 중단(다음 epoch 재배치 전까지 태그 무효).
 */
export function exposeArcCoreSpyCaptain(
  input: ExposeArcCoreSpyCaptainInput,
): ExposeArcCoreSpyCaptainResult {
  const captainId = String(input.captainId ?? '').trim();
  const planetId = String(input.planetId ?? '').trim();
  if (!captainId || !planetId) return { ok: false, reason: 'invalid_input' };
  if (!isArcCoreSpyTaggedCaptain(captainId)) return { ok: false, reason: 'not_spy_tagged' };

  const expelled = useArcCoreSpyExpelledStore.getState();
  if (expelled.isExpelled(captainId)) return { ok: false, reason: 'already_expelled' };

  expelled.markExpelled(captainId);
  void expelled.persistLocal();

  dispatchArcCoreCommand({
    type: 'npc_eject_captain_orbit',
    captainId,
    planetId,
    meta: { origin: 'arc_core_policy', reason: input.reason ?? 'spy_exposed' },
  });
  invalidateCaptainPresenceWorldIndexCache();

  return { ok: true, captainId, planetId };
}

/** dev·향후 스킬 없이 강제 색출 테스트 */
export function devExposeArcCoreSpyAtPlayerPlanet(
  captainId: string,
  playerPlanetId: string | null | undefined,
): ExposeArcCoreSpyCaptainResult {
  if (!playerPlanetId?.trim()) return { ok: false, reason: 'invalid_input' };
  return exposeArcCoreSpyCaptain({
    captainId,
    planetId: playerPlanetId.trim(),
    reason: 'dev_expose',
  });
}
