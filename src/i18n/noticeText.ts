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
