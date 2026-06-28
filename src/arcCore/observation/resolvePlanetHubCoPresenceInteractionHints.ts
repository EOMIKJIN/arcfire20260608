// ============================================================
// 행성 허브 co-presence → 대화 트리거 힌트 (미션·스토리 상호작용 축)
// ============================================================

import type { CaptainCoPresencePair } from '../captainPresence/captainPresenceTypes';
import { buildHubCoPresenceCombatInstanceKey } from '../captainPresence/buildCombatInstanceKey';
import { pickBestDialogSceneForCaptainPair } from '../../game/planetHubNpcDialog';

export type PlanetHubCoPresenceInteractionKind = 'dialog_tension' | 'dialog_neutral';

export type PlanetHubCoPresenceInteractionHint = {
  kind: PlanetHubCoPresenceInteractionKind;
  captainIdA: string;
  captainIdB: string;
  planetId: string;
  /** 우선 대화 sceneId — planetHubNpcDialog 와 동일 pick 규칙 */
  preferredDialogSceneId: string | null;
  /** 향후 인스턴스 상호작용 dedupe 키 (전투 경로 미사용) */
  interactionInstanceKey: string;
};

function stanceToKind(stance: CaptainCoPresencePair['stance']): PlanetHubCoPresenceInteractionKind {
  if (stance === 'hostile' || stance === 'rival') return 'dialog_tension';
  return 'dialog_neutral';
}

/** rival/hostile 우선 정렬 — observation·UI 훅 공용 */
export function resolvePlanetHubCoPresenceInteractionHints(
  pairs: readonly CaptainCoPresencePair[],
): PlanetHubCoPresenceInteractionHint[] {
  const ranked = [...pairs].sort((a, b) => {
    const rank = (s: CaptainCoPresencePair['stance']) =>
      s === 'hostile' ? 4 : s === 'rival' ? 3 : s === 'neutral' ? 2 : s === 'friendly' ? 1 : 0;
    return rank(b.stance) - rank(a.stance);
  });

  return ranked.map((pair) => ({
    kind: stanceToKind(pair.stance),
    captainIdA: pair.captainIdA,
    captainIdB: pair.captainIdB,
    planetId: pair.planetId,
    preferredDialogSceneId: pickBestDialogSceneForCaptainPair(pair.captainIdA, pair.captainIdB),
    interactionInstanceKey: buildHubCoPresenceCombatInstanceKey(
      pair.planetId,
      pair.captainIdA,
      pair.captainIdB,
    ),
  }));
}
