import { getLocale, isKoUi, resolveDictionaryLocale, t } from '../../i18n';
import type { MapFactionSide } from '../../galaxyMap/mapFactionSideCore';
import { resolveNationDisplayNameForMapSide } from '../../world/megaFactionNationPolicy';

/** 한글 받침 — 을/를 · 이/가 */
export function koJosa(word: string, withBatchim: string, without: string): string {
  const ch = [...word.trim()].pop() ?? '';
  const code = ch.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return without;
  return (code - 0xac00) % 28 === 0 ? without : withBatchim;
}

function nationLabel(side: MapFactionSide | undefined): string {
  if (!side) return '';
  const locale = resolveDictionaryLocale(getLocale());
  return resolveNationDisplayNameForMapSide(side, locale) ?? t('territorial.side.neutral');
}

function oppositeFrontSide(side: MapFactionSide | undefined): MapFactionSide | undefined {
  if (side === 'blue') return 'red';
  if (side === 'red') return 'blue';
  return undefined;
}

function withJosaToken(word: string, withBatchim: string, without: string): string {
  if (!isKoUi(getLocale())) return word;
  return `${word}${koJosa(word, withBatchim, without)}`;
}

/** 으로/로 — 받침 없거나 ㄹ이면 로 */
function withEuroToken(word: string): string {
  if (!isKoUi(getLocale())) return word;
  const ch = [...word.trim()].pop() ?? '';
  const code = ch.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return `${word}로`;
  const jong = (code - 0xac00) % 28;
  return jong === 0 || jong === 8 ? `${word}로` : `${word}으로`;
}

export type TerritorialBattleAlertCopy = {
  context: string;
  outcome: string;
};

export function formatTerritorialBattleAlertCopy(input: {
  planet: string;
  previousSide?: MapFactionSide;
  newSide?: MapFactionSide;
  holdSide?: MapFactionSide;
  attackerSide?: MapFactionSide;
  defenderSide?: MapFactionSide;
  occupationChanged: boolean;
}): TerritorialBattleAlertCopy {
  const prevSide = input.previousSide ?? input.holdSide;
  const nextSide = input.newSide ?? input.holdSide;
  const holdSide = input.holdSide ?? nextSide ?? prevSide;
  const attackerSide =
    input.attackerSide
    ?? (input.occupationChanged ? nextSide : oppositeFrontSide(holdSide));
  const defenderSide =
    input.defenderSide
    ?? (input.occupationChanged ? prevSide : holdSide);

  const attacker = nationLabel(attackerSide) || t('territorial.alert.attackerUnknown');
  const defender = nationLabel(defenderSide) || t('territorial.alert.defenderUnknown');
  const prev = nationLabel(prevSide) || t('territorial.side.neutral');
  const next = nationLabel(nextSide) || t('territorial.side.neutral');
  const side = nationLabel(holdSide) || t('territorial.side.neutral');
  const planetJosa = withJosaToken(input.planet, '을', '를');
  const attackerJosa = withJosaToken(attacker, '이', '가');
  const defenderJosa = withJosaToken(defender, '이', '가');
  const nextTo = withEuroToken(next);
  const outcome = input.occupationChanged
    ? t('territorial.alert.attackerWin', { attacker, attackerJosa, prev, next, nextTo })
    : t('territorial.alert.defenderWin', { defender, defenderJosa, side });

  return {
    context: t('territorial.alert.battleBody', {
      planet: input.planet,
      planetJosa,
      attacker,
      attackerJosa,
      defender,
    }),
    outcome,
  };
}
