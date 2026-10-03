import type { BarNotice } from '../store/barBoardStore';
import type { AppLocale, I18nParams } from './types';
import { getLocale, resolveDictionaryLocale } from './index';
import { resolveLocalizedSystemNameById } from './systemText';
import { resolveNationDisplayNameForMapSide } from '../world/megaFactionNationPolicy';
import type { MapFactionSide } from '../galaxyMap/mapFactionSideCore';

function resolveHoldSideLabel(
  side: string,
  locale: AppLocale,
  t: (key: string, params?: I18nParams) => string,
): string {
  const nationLocale = resolveDictionaryLocale(locale) === 'en' ? 'en' : 'ko';
  if (side === 'blue' || side === 'red' || side === 'independent') {
    const nation = resolveNationDisplayNameForMapSide(side as MapFactionSide, nationLocale);
    if (nation) return nation;
  }
  return t(`territorial.side.${side}`);
}

function buildParams(
  notice: Pick<BarNotice, 'i18nKey' | 'i18nParams'>,
  t: (key: string, params?: I18nParams) => string,
  locale: AppLocale,
): I18nParams | undefined {
  const raw = notice.i18nParams;
  if (!raw || !notice.i18nKey) return raw;

  if (notice.i18nKey === 'news.economyBulk') {
    const scopeLabel =
      raw.scopeKind === 'all'
        ? t('news.scope.allTradePorts')
        : t('news.scope.planetTradePorts', { count: raw.planetCount ?? 0 });
    return { ...raw, scopeLabel, action: raw.action ?? '' };
  }

  if (notice.i18nKey === 'news.megaFactionPgp') {
    const leader = String(raw.leader ?? 'tie');
    const leaderLine = t(`news.megaFactionPgp.leader.${leader}`);
    const dict = resolveDictionaryLocale(locale);
    const blueNation =
      dict === 'en'
        ? String(raw.blueNationEn ?? raw.blueNation ?? '')
        : String(raw.blueNation ?? raw.blueNationEn ?? '');
    const redNation =
      dict === 'en'
        ? String(raw.redNationEn ?? raw.redNation ?? '')
        : String(raw.redNation ?? raw.redNationEn ?? '');
    return { ...raw, leaderLine, blueNation, redNation };
  }

  if (notice.i18nKey === 'news.worldUnlock' || notice.i18nKey === 'news.expansionTest') {
    const systemId = String(raw.systemId ?? '');
    const systemName = resolveLocalizedSystemNameById(
      systemId,
      String(raw.systemName ?? ''),
      locale,
    );
    return { ...raw, systemId, systemName };
  }

  if (notice.i18nKey === 'news.territorialHold') {
    const prevSide = String(raw.prevSide ?? 'neutral');
    const nextSide = String(raw.nextSide ?? 'neutral');
    const decision = String(raw.decision ?? 'status_quo');
    const presentKind = String(raw.presentKind ?? '');
    const prevLabel = resolveHoldSideLabel(prevSide, locale, t);
    const nextLabel = resolveHoldSideLabel(nextSide, locale, t);
    const presentKey = presentKind
      ? `news.territorialHold.present.${presentKind}`
      : `news.territorialHold.decision.${decision}`;
    const decisionLabel = t(presentKey);
    return { ...raw, prevLabel, nextLabel, decisionLabel };
  }

  return raw;
}

export function resolveNoticeTitle(
  notice: Pick<BarNotice, 'title' | 'i18nKey' | 'i18nParams'>,
  t: (key: string, params?: I18nParams) => string,
): string {
  if (notice.i18nKey) {
    const key = `${notice.i18nKey}.title`;
    const val = t(key, buildParams(notice, t, getLocale()));
    if (val !== key) return val;
  }
  return notice.title ?? '';
}

export function resolveNoticeBody(
  notice: Pick<BarNotice, 'body' | 'i18nKey' | 'i18nParams'>,
  t: (key: string, params?: I18nParams) => string,
): string {
  if (notice.i18nKey) {
    const key = `${notice.i18nKey}.body`;
    const val = t(key, buildParams(notice, t, getLocale()));
    if (val !== key) return val;
  }
  return notice.body ?? '';
}
