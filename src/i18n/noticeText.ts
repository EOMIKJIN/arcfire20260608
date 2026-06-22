import type { TavernNotice } from '../store/tavernBoardStore';
import type { I18nParams } from './types';

function buildParams(
  notice: Pick<TavernNotice, 'i18nKey' | 'i18nParams'>,
  t: (key: string, params?: I18nParams) => string,
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
    return { ...raw, leaderLine };
  }

  if (notice.i18nKey === 'news.territorialHold') {
    const prevSide = String(raw.prevSide ?? 'neutral');
    const nextSide = String(raw.nextSide ?? 'neutral');
    const decision = String(raw.decision ?? 'status_quo');
    const prevLabel = t(`territorial.side.${prevSide}`);
    const nextLabel = t(`territorial.side.${nextSide}`);
    const decisionLabel = t(`news.territorialHold.decision.${decision}`);
    return { ...raw, prevLabel, nextLabel, decisionLabel };
  }

  return raw;
}

export function resolveNoticeTitle(
  notice: Pick<TavernNotice, 'title' | 'i18nKey' | 'i18nParams'>,
  t: (key: string, params?: I18nParams) => string,
): string {
  if (notice.i18nKey) {
    const key = `${notice.i18nKey}.title`;
    const val = t(key, buildParams(notice, t));
    if (val !== key) return val;
  }
  return notice.title ?? '';
}

export function resolveNoticeBody(
  notice: Pick<TavernNotice, 'body' | 'i18nKey' | 'i18nParams'>,
  t: (key: string, params?: I18nParams) => string,
): string {
  if (notice.i18nKey) {
    const key = `${notice.i18nKey}.body`;
    const val = t(key, buildParams(notice, t));
    if (val !== key) return val;
  }
  return notice.body ?? '';
}
