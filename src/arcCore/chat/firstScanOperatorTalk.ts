/**
 * 첫 스캔 뒤 스텔라 NL — 문구·턴캡만. persist 신규 스토어 없음.
 * 활성 시점: A1(`planet_scan_complete`) dismiss 이후 1회.
 * 카피 수정: `arcCoreChat.firstScan.*` (ko/en).
 */
import { t } from '../../i18n';
import type { ArcCoreBackchannelReason } from './arcCoreBackchannelTriggers';

export const FIRST_SCAN_BACKCHANNEL_REASON = 'first_scan' satisfies ArcCoreBackchannelReason;
export const FIRST_SCAN_MAX_USER_TURNS = 2;

export type FirstScanTalkKind = 'self' | 'location' | 'war' | 'other';

export type FirstScanAuthoredCopy = {
  self: string;
  location: string;
  war: string;
  other: string;
  close: string;
  closeAgain: string;
};

export function firstScanTriggerId(planetId: string): string {
  return `scan:${planetId.trim()}`;
}

export function firstScanOpenerText(): string {
  return t('arcCoreChat.firstScan.opener');
}

export function isFirstScanSession(
  session: readonly { reason?: string }[],
): boolean {
  for (let i = 0; i < session.length; i += 1) {
    if (session[i]?.reason === FIRST_SCAN_BACKCHANNEL_REASON) return true;
  }
  return false;
}

export function countSessionUserTurns(
  session: readonly { role?: string }[],
): number {
  let n = 0;
  for (let i = 0; i < session.length; i += 1) {
    if (session[i]?.role === 'user') n += 1;
  }
  return n;
}

export function hintFirstScanTalkKind(userText: string): FirstScanTalkKind {
  const spoken = userText.trim();
  if (!spoken) return 'other';
  if (/누구|정체|who\s*are\s*you|who\s*are|identity/i.test(spoken)) return 'self';
  if (/어디|여기|행성|where|planet/i.test(spoken)) return 'location';
  if (/전쟁|전란|적대|크림슨|레기온|war\b|crimson|legion/i.test(spoken)) return 'war';
  return 'other';
}

export function composeFirstScanReply(input: {
  userText: string;
  pipelineReply: string;
  userTurnCount: number;
  authored: FirstScanAuthoredCopy;
}): string {
  const kind = hintFirstScanTalkKind(input.userText);
  const authoredBody =
    kind === 'self'
      ? input.authored.self
      : kind === 'location'
        ? input.authored.location
        : kind === 'war'
          ? input.authored.war
          : '';
  const pipeline = (input.pipelineReply ?? '').trim();
  const body = authoredBody || pipeline || input.authored.other;

  if (input.userTurnCount > FIRST_SCAN_MAX_USER_TURNS) {
    return input.authored.closeAgain;
  }
  if (input.userTurnCount >= FIRST_SCAN_MAX_USER_TURNS) {
    if (body.includes(input.authored.close)) return body;
    return `${body}\n${input.authored.close}`;
  }
  return body;
}

function readDockedPlanetLabel(): string {
  try {
    const { usePlayerStore } = require('../../store/playerStore') as typeof import('../../store/playerStore');
    const { resolvePlanetById } =
      require('../../world/resolvePlanetById') as typeof import('../../world/resolvePlanetById');
    const planetId = usePlayerStore.getState().player?.currentPlanetId?.trim() ?? '';
    if (!planetId) return '';
    const name = resolvePlanetById(planetId)?.name?.trim() ?? '';
    return name || planetId;
  } catch {
    return '';
  }
}

export function readFirstScanAuthoredCopy(planetLabel?: string): FirstScanAuthoredCopy {
  const planet =
    (planetLabel ?? '').trim()
    || readDockedPlanetLabel()
    || t('arcCoreChat.firstScan.planetFallback');
  return {
    self: t('arcCoreChat.firstScan.reply.self'),
    location: t('arcCoreChat.firstScan.reply.location', { planet }),
    war: t('arcCoreChat.firstScan.reply.war'),
    other: t('arcCoreChat.firstScan.reply.other'),
    close: t('arcCoreChat.firstScan.close'),
    closeAgain: t('arcCoreChat.firstScan.closeAgain'),
  };
}

export function applyFirstScanTalkToReply(input: {
  userText: string;
  pipelineReply: string;
  userTurnCount: number;
  planetLabel?: string;
}): string {
  return composeFirstScanReply({
    userText: input.userText,
    pipelineReply: input.pipelineReply,
    userTurnCount: input.userTurnCount,
    authored: readFirstScanAuthoredCopy(input.planetLabel),
  });
}
