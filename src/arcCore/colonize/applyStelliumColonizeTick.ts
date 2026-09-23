import { t } from '../../i18n';
import { showArcAlert } from '../../utils/showArcAlert';
import { useClanWarFoundationStore } from '../../store/clanWarFoundationStore';
import { replaceStelliumColonizeRecords } from '../../store/stelliumColonizeStore';
import { publishStelliumColonizeSuccessNotice } from './publishStelliumColonizeNotice';
import { addKstDayKey } from './stelliumColonizeDayKey';
import { tryChargeStelliumColonizeSuccessBond } from './stelliumColonizeFiscal';
import type { StelliumColonizeEvent, StelliumColonizePolicy, StelliumColonizeRecord } from './stelliumColonizeTypes';

export function applyStelliumColonizeTickResult(input: {
  records: Record<string, StelliumColonizeRecord>;
  events: StelliumColonizeEvent[];
  policy: StelliumColonizePolicy;
  persistNow?: boolean;
  presentHqAlert?: boolean;
  fleetReadyAtMs?: number[] | null;
  todayKey?: string;
  applySuccessBond?: boolean;
}): { succeeded: number; failed: number; outposts: number } {
  let succeeded = 0;
  let failed = 0;
  let outposts = 0;
  const war = useClanWarFoundationStore.getState();
  let records = input.records;
  for (let i = 0; i < input.events.length; i += 1) {
    const ev = input.events[i];
    if (ev.kind === 'outpost_established') outposts += 1;
    if (ev.kind === 'hq_fail') failed += 1;
    if (ev.kind !== 'hq_success') continue;
    if (input.applySuccessBond !== false
      && !tryChargeStelliumColonizeSuccessBond(input.policy, ev.planetId)) {
      const rec = records[ev.planetId];
      if (rec) {
        const today = input.todayKey ?? rec.dueDayKey ?? rec.departedDayKey;
        records = {
          ...records,
          [ev.planetId]: {
            ...rec,
            phase: 'fail_wait',
            dueDayKey: today ? addKstDayKey(today, rec.travelDays) : rec.dueDayKey,
          },
        };
      }
      continue;
    }
    succeeded += 1;
    war.applyPlayerColonizeHold({
      planetId: ev.planetId,
      systemId: ev.systemId,
      occupierClanId: input.policy.holdOccupierClanId,
    });
    publishStelliumColonizeSuccessNotice(ev.planetId);
    if (input.presentHqAlert !== false) {
      try {
        const { getPlanetOccupationSeedRow } =
          require('../balance/balanceTableRegistry') as typeof import('../balance/balanceTableRegistry');
        const { resolveTerritorialAlertPlanetLabel } =
          require('../territorial/showTerritorialOccupationChangeAlert') as typeof import('../territorial/showTerritorialOccupationChangeAlert');
        const row = getPlanetOccupationSeedRow(ev.planetId);
        const planet = resolveTerritorialAlertPlanetLabel({
          alertLabelKo: row?.alertLabelKo,
          alertLabelEn: row?.alertLabelEn,
          fallback: ev.planetId,
        });
        showArcAlert(
          t('news.stelliumColonize.title'),
          t('news.stelliumColonize.body', { planet }),
        );
      } catch {
        showArcAlert(t('news.stelliumColonize.title'), ev.planetId);
      }
    }
  }
  const persistNow = input.persistNow === true
    || input.events.some((e) => e.kind === 'outpost_established');
  replaceStelliumColonizeRecords(records, persistNow, input.fleetReadyAtMs);
  return { succeeded, failed, outposts };
}
