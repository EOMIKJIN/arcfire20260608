// ============================================================
// 플레이어 클랜 해산·계정 purge — 행성 hold 복원 단일 정책
// ============================================================

import type { PlanetClanHold } from '../types';
import {
  isPlayerOriginatedClanId,
  resolveSeedOccupierClanForPlanet,
} from './planetOwnershipModel';

export type PlanetHoldReleaseMode = 'dissolve_clan' | 'purge_account' | 'purge_all_non_ai';

export type ReleasePlayerPlanetHoldsInput = {
  holds: Record<string, PlanetClanHold>;
  removedClanIds: ReadonlySet<string>;
  /** purge 시 orphan 판정 — 남은 클랜 id 집합 */
  remainingClanIds: ReadonlySet<string>;
  uid?: string | null;
  mode: PlanetHoldReleaseMode;
};

export type ReleasePlayerPlanetHoldsResult = {
  holds: Record<string, PlanetClanHold>;
  releasedPlanetCount: number;
};

function shouldReleaseHold(
  hold: PlanetClanHold,
  planetId: string,
  input: ReleasePlayerPlanetHoldsInput,
  remainingClanIds: ReadonlySet<string>,
): boolean {
  const { removedClanIds, uid, mode } = input;
  const deedOwned = Boolean(hold.deedOwnerClanId && removedClanIds.has(hold.deedOwnerClanId));
  const legacyOccupierOwned = removedClanIds.has(hold.occupierClanId);

  if (mode === 'dissolve_clan') {
    if (hold.kind === 'player_home' && legacyOccupierOwned) return true;
    return deedOwned || (legacyOccupierOwned && isPlayerOriginatedClanId(hold.occupierClanId));
  }

  if (mode === 'purge_account') {
    const isTargetPlayerHold =
      (uid != null && hold.homePlayerUid === uid) || deedOwned || legacyOccupierOwned;
    const isOrphanNonAiHold =
      !hold.occupierClanId.startsWith('ai_clan_') && !remainingClanIds.has(hold.occupierClanId);
    return isTargetPlayerHold || isOrphanNonAiHold;
  }

  // purge_all_non_ai — 플레이어 유래(독립국·거점·플레이어 클랜 점유/증서) hold만 축소 릴리스한다.
  // (2026-07-28 account-purge-ownership-neutralize) 예전엔 "!ai_clan_*"이라 국가 시드
  // (balance_seed_faction_*)·이미 중립인 hold까지 전부 걸려 release → CSV 재시드가 반복 발생,
  // ArcCore 영토 진행이 계정 purge마다 리셋될 위험이 있었음.
  return (
    hold.kind === 'player_independent'
    || hold.kind === 'player_home'
    || isPlayerOriginatedClanId(hold.occupierClanId)
    || Boolean(hold.deedOwnerClanId && isPlayerOriginatedClanId(hold.deedOwnerClanId))
  );
}

function restoreHoldAfterPlayerRelease(
  planetId: string,
  hold: PlanetClanHold,
  mode: PlanetHoldReleaseMode,
  uid?: string | null,
): PlanetClanHold | null {
  if (mode === 'dissolve_clan' && hold.kind === 'player_home') {
    return null;
  }

  // 플레이어 독립국(소유권 구매) 해제 — CSV 국가 시드(BLUE/RED)로 되돌리지 않고 중립화한다.
  // (2026-07-28 account-purge-ownership-neutralize) `neutralizedAt`은 이미 존재하는 시드
  // 파이프라인 가드(`seedPlanetOccupationFromBalance.ts`)가 소비하는 마커 — neutral kind/occupier +
  // neutralizedAt 설정 시 다음 부트/hydrate에서 CSV 시드(BLUE/RED) 재적용을 건너뛴다(신규 로직 아님,
  // 2026-07-20 도입된 기존 마커를 여기서도 재사용). 부수 효과: `territorialSide`가 neutral이 되어
  // 시리우스처럼 RED 시드였던 곳도 재구매 거부(`red_territory`)가 풀린다.
  if (hold.kind === 'player_independent') {
    return {
      ...hold,
      occupierClanId: 'neutral',
      deedOwnerClanId: null,
      homePlayerUid: uid != null && hold.homePlayerUid === uid ? null : hold.homePlayerUid,
      kind: 'neutral',
      neutralizedAt: Date.now(),
    };
  }

  const seed = resolveSeedOccupierClanForPlanet(planetId);
  return {
    ...hold,
    occupierClanId: seed.occupierClanId,
    deedOwnerClanId: null,
    homePlayerUid: uid != null && hold.homePlayerUid === uid ? null : hold.homePlayerUid,
    kind: seed.kind,
  };
}

/** dissolve / purge 공용 — CSV 시드 기준 복원 */
export function releasePlayerPlanetHolds(
  input: ReleasePlayerPlanetHoldsInput,
): ReleasePlayerPlanetHoldsResult {
  let releasedPlanetCount = 0;
  const next: Record<string, PlanetClanHold> = {};

  for (const [planetId, hold] of Object.entries(input.holds)) {
    if (!shouldReleaseHold(hold, planetId, input, input.remainingClanIds)) {
      next[planetId] = hold;
      continue;
    }

    releasedPlanetCount += 1;
    const restored = restoreHoldAfterPlayerRelease(planetId, hold, input.mode, input.uid);
    if (restored) next[planetId] = restored;
  }

  return { holds: next, releasedPlanetCount };
}
