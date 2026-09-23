/**
 * 함장 개인미션 오퍼 게이트 — 순수 함수. 스토어/RN 금지.
 * 정본: docs/CAPTAIN_PERSONAL_MISSION_DESIGN.md
 */

import {
  CAPTAIN_PERSONAL_ACTIVE_ACCOUNT_MAX,
  CAPTAIN_PERSONAL_DECLINE_COOLDOWN_DAYS,
} from './captainPersonalMissionIds';

export type CaptainPersonalOfferGateReason =
  | 'ok'
  | 'comm_not_accepted'
  | 'talk_disabled'
  | 'hostile_refuse'
  | 'flagship'
  | 'orbit_fill'
  | 'main_story_priority'
  | 'talk_contact_priority'
  | 'captain_active'
  | 'account_cap'
  | 'decline_cooldown'
  | 'same_day_offer'
  | 'no_template';

export type CaptainPersonalOfferGateInput = {
  commAccepted: boolean;
  talkEnabled: boolean;
  isHostileRefuse: boolean;
  isFlagship: boolean;
  isOrbitFill: boolean;
  hasOfferableMainStory: boolean;
  hasActiveTalkContact: boolean;
  captainActivePersonalCount: number;
  accountActivePersonalCount: number;
  dayKey: string;
  declineUntilDayKey?: string;
  lastPersonalOfferDayKey?: string;
  templateAvailable: boolean;
};

export function compareDayKey(a: string, b: string): number {
  const left = a.trim();
  const right = b.trim();
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

export function kstDayKeyFromMs(nowMs = Date.now()): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(nowMs);
}

/** 달력 일자 키에 일수를 더한다(KST YYYY-MM-DD를 날짜로만 취급). */
export function addDayKeyDays(dayKey: string, days: number): string {
  const parts = dayKey.trim().split('-');
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return dayKey.trim();
  const utc = Date.UTC(y, m - 1, d + Math.floor(days));
  const dt = new Date(utc);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function resolvePersonalDeclineUntilDayKey(dayKey: string): string {
  return addDayKeyDays(dayKey, CAPTAIN_PERSONAL_DECLINE_COOLDOWN_DAYS);
}

export function hashSeed(parts: readonly string[]): number {
  let h = 0;
  for (const part of parts) {
    for (let i = 0; i < part.length; i += 1) {
      h = (h * 31 + part.charCodeAt(i)) | 0;
    }
  }
  return Math.abs(h);
}

export function evaluateCaptainPersonalOfferGate(
  input: CaptainPersonalOfferGateInput,
): { ok: boolean; reason: CaptainPersonalOfferGateReason } {
  if (!input.commAccepted) return { ok: false, reason: 'comm_not_accepted' };
  if (input.isFlagship) return { ok: false, reason: 'flagship' };
  if (input.isOrbitFill) return { ok: false, reason: 'orbit_fill' };
  if (!input.talkEnabled) return { ok: false, reason: 'talk_disabled' };
  if (input.isHostileRefuse) return { ok: false, reason: 'hostile_refuse' };
  if (input.hasOfferableMainStory) return { ok: false, reason: 'main_story_priority' };
  if (input.hasActiveTalkContact) return { ok: false, reason: 'talk_contact_priority' };
  if (input.captainActivePersonalCount > 0) return { ok: false, reason: 'captain_active' };
  if (input.accountActivePersonalCount >= CAPTAIN_PERSONAL_ACTIVE_ACCOUNT_MAX) {
    return { ok: false, reason: 'account_cap' };
  }
  const dayKey = input.dayKey.trim();
  const declineUntil = input.declineUntilDayKey?.trim() ?? '';
  if (declineUntil && compareDayKey(dayKey, declineUntil) < 0) {
    return { ok: false, reason: 'decline_cooldown' };
  }
  const lastOffer = input.lastPersonalOfferDayKey?.trim() ?? '';
  if (lastOffer && lastOffer === dayKey) {
    return { ok: false, reason: 'same_day_offer' };
  }
  if (!input.templateAvailable) return { ok: false, reason: 'no_template' };
  return { ok: true, reason: 'ok' };
}

export function pickCaptainPersonalTemplateId(
  templateIds: readonly string[],
  captainId: string,
  planetId: string,
  dayKey: string,
): string | null {
  if (templateIds.length === 0) return null;
  const seed = hashSeed([captainId.trim(), planetId.trim(), dayKey.trim(), String(templateIds.length)]);
  return templateIds[seed % templateIds.length] ?? null;
}

export function rotateIds(ids: readonly string[], offset: number): string[] {
  if (ids.length === 0) return [];
  const start = ((offset % ids.length) + ids.length) % ids.length;
  const out: string[] = [];
  for (let i = 0; i < ids.length; i += 1) {
    out.push(ids[(start + i) % ids.length]!);
  }
  return out;
}
