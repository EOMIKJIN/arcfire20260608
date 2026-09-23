// 세축 세계 변화 — digest 한 줄. 틱/배치 패스 없음. 소비자만.
// 정본: docs/세축_반응_잔상_세계변화_설계.md v1.1 §8

import { translate } from '../../i18n';
import type { AppLocale } from '../../i18n/types';
import {
  parsePlanetHoldSig,
  type PlanetVisitSnapshot,
  type WorldChangeItem,
} from './orbitPresenceMemory';

export function resolveHoldOccupierLabel(holdSig: string, locale: AppLocale): string {
  const parsed = parsePlanetHoldSig(holdSig);
  const occ = parsed.occupierClanId;
  if (!occ || occ === 'neutral') return locale === 'en' ? 'Neutral' : '중립';
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { resolveMapFactionSideFromClanId } =
      require('../../galaxyMap/resolveMapFactionSide') as typeof import('../../galaxyMap/resolveMapFactionSide');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { resolveNationDisplayForSide } =
      require('../../world/resolvePlanetRuntimeNationDisplayCore') as typeof import('../../world/resolvePlanetRuntimeNationDisplayCore');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { usePlayerStore } = require('../../store/playerStore') as typeof import('../../store/playerStore');
    const side = resolveMapFactionSideFromClanId(occ);
    const nation = resolveNationDisplayForSide(
      side,
      locale,
      usePlayerStore.getState().player?.nickname ?? '',
    );
    if (nation) return nation;
  } catch {
    /* node test / 미기동 */
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useClanWarFoundationStore } =
      require('../../store/clanWarFoundationStore') as typeof import('../../store/clanWarFoundationStore');
    const name = useClanWarFoundationStore.getState().clans[occ]?.displayName?.trim();
    if (name) return name;
  } catch {
    /* node test / 미기동 */
  }
  return occ;
}

export function resolveRememberedCaptainLabel(captainId: string, locale: AppLocale): string {
  const id = captainId.trim();
  if (!id) return '';
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getNpcCaptain } = require('../../npc/npcFleetRegistry') as typeof import('../../npc/npcFleetRegistry');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { resolveNpcCaptainDisplayName } =
      require('../../i18n/captainText') as typeof import('../../i18n/captainText');
    const name = resolveNpcCaptainDisplayName(getNpcCaptain(id), locale).trim();
    if (name) return name;
  } catch {
    /* node test / 미기동 */
  }
  return id;
}

export function formatWorldChangeFactLine(
  item: WorldChangeItem | undefined,
  input: {
    locale: AppLocale;
    planetLabel: string;
    prevHoldLabel: string;
    nextHoldLabel: string;
    captainLabel: string;
  },
): string {
  if (!item) return '';
  if (item.kind === 'hold') {
    return translate(input.locale, 'orbitPresence.world.hold', {
      planet: input.planetLabel,
      prev: input.prevHoldLabel,
      next: input.nextHoldLabel,
    }).slice(0, 180);
  }
  if (item.kind === 'roster') {
    const key = item.direction === 'gone'
      ? 'orbitPresence.world.rosterGone'
      : 'orbitPresence.world.rosterBack';
    return translate(input.locale, key, { name: input.captainLabel }).slice(0, 180);
  }
  return translate(input.locale, 'orbitPresence.world.board', {
    planet: input.planetLabel,
  }).slice(0, 180);
}

export function buildWorldChangeFactLine(
  item: WorldChangeItem | undefined,
  input: {
    locale: AppLocale;
    planetId: string;
    planetLabel: string;
    prev?: PlanetVisitSnapshot;
    next: Pick<PlanetVisitSnapshot, 'holdSig'>;
  },
): string {
  if (!item) return '';
  const prevHold = resolveHoldOccupierLabel(input.prev?.holdSig ?? '', input.locale);
  const nextHold = resolveHoldOccupierLabel(input.next.holdSig, input.locale);
  const captainLabel =
    item.kind === 'roster'
      ? resolveRememberedCaptainLabel(item.captainId, input.locale)
      : '';
  return formatWorldChangeFactLine(item, {
    locale: input.locale,
    planetLabel: input.planetLabel || input.planetId,
    prevHoldLabel: prevHold,
    nextHoldLabel: nextHold,
    captainLabel,
  });
}
