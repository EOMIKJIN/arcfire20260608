import {
  getTransportFleetDisplayNameEn,
  getTransportFleetDisplayNameKo,
} from '../arcCore/economy/planetUpkeepPolicy';
import { isKoUi, translate } from './index';
import type { AppLocale } from './types';

export function resolveTransportFleetDisplayName(locale: AppLocale): string {
  if (isKoUi(locale)) return getTransportFleetDisplayNameKo();
  const fromPolicy = getTransportFleetDisplayNameEn().trim();
  if (fromPolicy) return fromPolicy;
  return translate(locale, 'econSnap.transportFleetName');
}
