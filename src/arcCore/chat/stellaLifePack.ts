import { stellaLifeAllowsLifeLine, stellaLifePackAnchorBudget } from './stellaLifeCognition';
import { resolveStellaLifeNarrativeLine } from './stellaLifeTableIndex';
import type { StellaLifeResolved, StellaLifeSnapshot } from './stellaLifeTypes';

export const STELLA_LIFE_PACK_MAX = 400;

export type StellaLifePackFragment = {
  block: string;
  lifeLine: string;
};

function cut(text: string, max: number): string {
  const raw = text.trim();
  if (raw.length <= max) return raw;
  return raw.slice(0, max).trim();
}

export function buildStellaLifePackFragment(input: {
  resolved: StellaLifeResolved | null;
  snapshot: StellaLifeSnapshot;
  humanFirst: boolean;
  locale: 'ko' | 'en';
}): StellaLifePackFragment {
  if (input.humanFirst || !input.resolved) return { block: '', lifeLine: '' };
  if (!stellaLifeAllowsLifeLine(input.snapshot, input.humanFirst)) {
    return { block: '', lifeLine: '' };
  }
  const r = input.resolved;
  const ko = input.locale !== 'en';
  const nowLine = cut(ko ? r.activityKo : r.activityEn, 60);
  const driveLine = cut(
    r.energy < 40
      ? (ko ? '조금 처져 있어' : 'A bit worn')
      : r.energy > 70
        ? (ko ? '아직 버틸 만해' : 'Still holding')
        : '',
    60,
  );
  const today = input.snapshot.digests[input.snapshot.digests.length - 1];
  const digestLine = cut((ko ? today?.done[0] : today?.done[1] || today?.done[0]) ?? '', 80);
  const narrative = cut(
    resolveStellaLifeNarrativeLine(input.snapshot.traits, ko ? 'ko' : 'en') || input.snapshot.narrative,
    80,
  );
  const budget = stellaLifePackAnchorBudget(input.snapshot, input.humanFirst);
  const anchors = input.snapshot.anchors.slice(0, Math.max(0, budget)).join(' / ').slice(0, 80);
  const parts = [nowLine, driveLine, digestLine, narrative, anchors].filter(Boolean);
  let block = '';
  for (let i = 0; i < parts.length; i += 1) {
    const next = block ? `${block}\n${parts[i]}` : parts[i]!;
    if (next.length > STELLA_LIFE_PACK_MAX) break;
    block = next;
  }
  return { block, lifeLine: nowLine };
}

export function shouldAttachStellaLifeToPack(input: {
  speakerId: string;
  inboundWhy?: string;
  originHold?: boolean;
}): boolean {
  if (input.speakerId !== 'operator') return false;
  if (input.originHold) return false;
  if (input.inboundWhy) return false;
  return true;
}
