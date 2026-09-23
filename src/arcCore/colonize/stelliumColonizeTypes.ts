export const STELLIUM_COLONIZE_FACTION_ID = 'stellium';
export const STELLIUM_COLONIZE_ORIGIN = 'player_colonize' as const;

export type StelliumColonizePhase =
  | 'queued'
  | 'in_flight'
  | 'outpost'
  | 'fail_wait'
  | 'success';

/** 허브에 개척선 마크 — 실제 운용 중만. queued는 대기이므로 비표시 */
export function isStelliumColonizeMarkPhase(
  phase: string | undefined,
): phase is 'in_flight' | 'outpost' | 'fail_wait' {
  return phase === 'in_flight' || phase === 'outpost' || phase === 'fail_wait';
}

/** 은하 지도 노드 맥박 — 사령부 전까지. queued/success 제외 */
export function collectStelliumColonizeMarkSystemIds(
  records: Readonly<Record<string, Pick<StelliumColonizeRecord, 'systemId' | 'phase'> | undefined>>,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const keys = Object.keys(records);
  for (let i = 0; i < keys.length; i += 1) {
    const row = records[keys[i]];
    if (!row || !isStelliumColonizeMarkPhase(row.phase)) continue;
    const systemId = String(row.systemId ?? '').trim();
    if (!systemId || seen.has(systemId)) continue;
    seen.add(systemId);
    out.push(systemId);
  }
  return out;
}

/** 행성 볼드 림 오렌지 — 완전 도착 후 체류 회전부터. 접근(in_flight)은 성운색 유지 */
export function isStelliumColonizeRimPhase(
  phase: string | undefined,
): phase is 'outpost' | 'fail_wait' {
  return phase === 'outpost' || phase === 'fail_wait';
}

export function isStelliumColonizeActivePhase(
  phase: string | undefined,
): boolean {
  return phase === 'in_flight' || phase === 'outpost' || phase === 'fail_wait';
}

export type StelliumColonizeRecord = {
  planetId: string;
  systemId: string;
  factionId: typeof STELLIUM_COLONIZE_FACTION_ID;
  phase: StelliumColonizePhase;
  hopDistance: number;
  travelDays: number;
  attempt: number;
  departedDayKey: string | null;
  dueDayKey: string | null;
  /** 전초기지 도착 벽시계. 없으면 레거시 in_flight → 즉시 outpost */
  outpostDueAtMs: number | null;
  /** 일 운용비 청구한 KST dayKey. 활성 마크만 */
  lastOpexDayKey?: string | null;
};

export type StelliumColonizeEvent =
  | { kind: 'enqueued'; planetId: string; phase: StelliumColonizePhase }
  | { kind: 'departed'; planetId: string }
  | { kind: 'approach_held'; planetId: string }
  | { kind: 'outpost_established'; planetId: string }
  | { kind: 'hq_success'; planetId: string; systemId: string; attempt: number }
  | { kind: 'hq_fail'; planetId: string; attempt: number; nextDueDayKey: string };

export type StelliumColonizePolicy = {
  factionId: string;
  enabled: boolean;
  concurrentInFlightCap: number;
  hopDays1: number;
  hopDays2: number;
  hopDays3Plus: number;
  attempt1MinPct: number;
  attempt1MaxPct: number;
  attempt2MinPct: number;
  attempt2MaxPct: number;
  attempt3MinPct: number;
  attempt3MaxPct: number;
  successCapPct: number;
  originTag: typeof STELLIUM_COLONIZE_ORIGIN;
  holdOccupierClanId: string;
  outpostArriveSec: number;
  baseShipCount: number;
  baseSpeedMul: number;
  maxShipCount: number;
  /** 임무 종료 후 다음 성계 출항까지 초 */
  handoffSec: number;
  /** 사령부 수립에 필요한 방위위성 레벨. 0이면 게이트 없음 */
  requireDefenseSatLevel: number;
  /** true면 개척선은 전 자동화 AI 운용. 플레이어/함장 조작 없음 */
  aiAutomated: boolean;
  /** true면 npc_ai_ships / capital_ship 테이블 등록 필수. 기본 false */
  requireShipTable: boolean;
  /** true면 npc_ai_captains 함장 배정 필수. 기본 false */
  requireCaptain: boolean;
  /** 척당 의장(1회). 전투함 구매표와 분리 */
  hullOutfittingCredits: number;
  /** 활성 척·일 운용 */
  opexCreditsPerShipDay: number;
  /** 사령부 시도 = 이 값 × travelDays */
  attemptCreditsPerHopDay: number;
  /** 성공 hold write 직전 편입 보증 */
  successBondCredits: number;
  /** true면 사령부 롤 전 시도×D+보증 잔고. 5분 접근(방위위성 게이트)은 선지급 없음 */
  requirePrepaidEnqueue: boolean;
  /** 개척 현금 금고. 수송 금고 금지 */
  chargeVaultKey: StelliumColonizeVaultKey;
  /** true면 블루 현금 부족 시 아크코어 중앙금고 대출로 운용 */
  loanEnabled: boolean;
};

export type StelliumColonizeVaultKey = 'blue_team' | 'arccore_vault';

export const STELLIUM_COLONIZE_POLICY_FISCAL_DEFAULTS = {
  hullOutfittingCredits: 4000,
  opexCreditsPerShipDay: 200,
  attemptCreditsPerHopDay: 400,
  successBondCredits: 8000,
  requirePrepaidEnqueue: true,
  chargeVaultKey: 'blue_team' as StelliumColonizeVaultKey,
  loanEnabled: true,
};

export type StelliumColonizeCoreGauges = {
  resource: number;
  population: number;
  defense: number;
  technology: number;
  environment: number;
};

export function isPlayerColonizeHoldOrigin(
  origin: string | null | undefined,
): boolean {
  return origin === STELLIUM_COLONIZE_ORIGIN;
}

export function travelDaysForHopDistance(
  hops: number,
  policy: Pick<StelliumColonizePolicy, 'hopDays1' | 'hopDays2' | 'hopDays3Plus'>,
): number {
  if (hops <= 1) return policy.hopDays1;
  if (hops === 2) return policy.hopDays2;
  return policy.hopDays3Plus;
}
