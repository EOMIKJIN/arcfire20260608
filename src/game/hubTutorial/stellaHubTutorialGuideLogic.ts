/** L0 허브 가이드 A1–D2 — 순수 판정. persist/present 없음. */

export const STELLA_HUB_TUTORIAL_HOME_PLANET_ID = 'arcadia_prime';

export const STELLA_HUB_TUTORIAL_SCENE_IDS = {
  a1: 'ingame_dialog_scan_main_quest',
  a2: 'hub_tut_a2_mine',
  a3: 'hub_tut_a3_mine_ok',
  a4: 'hub_tut_a4_trade',
  a5: 'hub_tut_a5_sell',
  b1: 'hub_tut_b1_shipyard',
  c1: 'hub_tut_c1_talk',
  c2: 'hub_tut_c2_bar',
  d1: 'hub_tut_d1_wrap',
  d2: 'hub_tut_d2_depart',
  barViewed: 'hub_tut_bar_viewed',
} as const;

export type StellaHubTutorialEvent =
  | 'a1_dismissed'
  | 'hub_focused'
  | 'mine_started'
  | 'mine_granted'
  | 'trade_opened'
  | 'sold'
  | 'shipyard_opened'
  | 'talk_started'
  | 'talk_done'
  | 'bar_opened'
  | 'bar_accept_blocked'
  | 'talk_operator_blocked';

export type StellaHubTutorialPresent = {
  sceneId: string;
  skipSeenCheck?: boolean;
  chainOnDismiss?: 'a4' | 'd2' | 'start_first_mission';
  markOnly?: string;
};

const S = STELLA_HUB_TUTORIAL_SCENE_IDS;

function hasSeen(seen: readonly string[], sceneId: string): boolean {
  return seen.includes(sceneId);
}

export function isStellaHubTutorialComplete(seen: readonly string[]): boolean {
  return hasSeen(seen, S.d2);
}

export function isStellaHubTutorialInProgress(seen: readonly string[]): boolean {
  return hasSeen(seen, S.a1) && !hasSeen(seen, S.d2);
}

/** 조선소 이후 · 바 안내 전 — [대화]는 본기능 2게이트. */
export function isStellaHubTutorialAwaitingTalk(seen: readonly string[]): boolean {
  return hasSeen(seen, S.b1) && !hasSeen(seen, S.c2) && !hasSeen(seen, S.d2);
}

export function resolveStellaHubTutorialPresent(
  event: StellaHubTutorialEvent,
  seen: readonly string[],
): StellaHubTutorialPresent | null {
  if (event === 'bar_opened') {
    if (hasSeen(seen, S.d2) || hasSeen(seen, S.barViewed)) return null;
    if (!hasSeen(seen, S.c2)) return null;
    return { sceneId: S.barViewed, markOnly: S.barViewed };
  }

  if (event === 'bar_accept_blocked') {
    if (hasSeen(seen, S.d2)) return null;
    return { sceneId: S.c2, skipSeenCheck: true };
  }

  if (hasSeen(seen, S.d2)) return null;

  if (event === 'talk_operator_blocked') {
    if (!hasSeen(seen, S.b1) || hasSeen(seen, S.c1) || hasSeen(seen, S.c2)) return null;
    return { sceneId: S.c1 };
  }

  if (event === 'talk_started') {
    if (!hasSeen(seen, S.b1) || hasSeen(seen, S.c1) || hasSeen(seen, S.c2) || hasSeen(seen, S.d2)) {
      return null;
    }
    return { sceneId: S.c1, markOnly: S.c1 };
  }

  if (event === 'a1_dismissed' || event === 'hub_focused') {
    if (hasSeen(seen, S.a1) && !hasSeen(seen, S.a2)) return { sceneId: S.a2 };
    if (hasSeen(seen, S.b1) && !hasSeen(seen, S.c1)) return { sceneId: S.c1 };
    if (hasSeen(seen, S.c2) && hasSeen(seen, S.barViewed) && !hasSeen(seen, S.d1)) {
      return { sceneId: S.d1, chainOnDismiss: 'd2' };
    }
    if (hasSeen(seen, S.d1) && !hasSeen(seen, S.d2)) {
      return { sceneId: S.d2, chainOnDismiss: 'start_first_mission' };
    }
    return null;
  }

  if (event === 'mine_started') {
    return null;
  }

  if (event === 'mine_granted') {
    if (hasSeen(seen, S.a2) && !hasSeen(seen, S.a3)) {
      return { sceneId: S.a3, chainOnDismiss: 'a4' };
    }
    return null;
  }

  if (event === 'trade_opened') return null;

  if (event === 'sold') {
    if (hasSeen(seen, S.a4) && !hasSeen(seen, S.a5)) return { sceneId: S.a5 };
    return null;
  }

  if (event === 'shipyard_opened') {
    if (hasSeen(seen, S.a5) && !hasSeen(seen, S.b1)) return { sceneId: S.b1 };
    return null;
  }

  if (event === 'talk_done') {
    if (hasSeen(seen, S.c1) && !hasSeen(seen, S.c2)) return { sceneId: S.c2 };
    return null;
  }

  return null;
}
