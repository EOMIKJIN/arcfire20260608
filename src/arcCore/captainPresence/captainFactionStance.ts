// ============================================================
// NPC 함장 팩션 상호 stance — 행성 co-presence · 향후 교전/대화 이벤트
// ============================================================

import type { NpcCaptain } from '../../types';
import { getNpcCaptain } from '../../npc/npcFleetRegistry';
import type { CaptainFactionStance } from './captainPresenceTypes';

function factionOf(captain: NpcCaptain): string {
  return String(captain.factionId ?? '').trim();
}

/** CSV friendly/hostile pipe + 동일 팩션 */
export function resolveCaptainFactionStance(
  captainAId: string,
  captainBId: string,
): CaptainFactionStance {
  if (captainAId === captainBId) return 'allied';
  const a = getNpcCaptain(captainAId);
  const b = getNpcCaptain(captainBId);
  if (!a || !b) return 'neutral';

  const fa = factionOf(a);
  const fb = factionOf(b);
  if (fa && fb && fa === fb) return 'allied';

  if (fa && b.hostileFactionIds.includes(fa)) return 'hostile';
  if (fb && a.hostileFactionIds.includes(fb)) return 'hostile';

  if (fa && b.friendlyFactionIds.includes(fa)) return 'friendly';
  if (fb && a.friendlyFactionIds.includes(fb)) return 'friendly';

  if (fa && fb && fa !== fb) return 'rival';

  return 'neutral';
}

export function listCaptainCoPresencePairsAtPlanet(
  planetId: string,
  captainIds: readonly string[],
): import('./captainPresenceTypes').CaptainCoPresencePair[] {
  const ids = [...new Set(captainIds.filter(Boolean))].sort();
  const out: import('./captainPresenceTypes').CaptainCoPresencePair[] = [];
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      const captainIdA = ids[i]!;
      const captainIdB = ids[j]!;
      out.push({
        captainIdA,
        captainIdB,
        stance: resolveCaptainFactionStance(captainIdA, captainIdB),
        planetId,
      });
    }
  }
  return out;
}
