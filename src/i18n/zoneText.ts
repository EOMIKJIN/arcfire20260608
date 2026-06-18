import type { ZoneType } from '../types';
import type { I18nParams } from './types';

type TFn = (key: string, params?: I18nParams) => string;

export function resolveZoneLabel(zone: ZoneType, t: TFn): string {
  const key = `zone.${zone}`;
  const val = t(key);
  return val !== key ? val : zone;
}
