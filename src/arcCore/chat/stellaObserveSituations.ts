// 스텔라 관찰 상황 감지 — 순수 함수. store·RN import 금지 (플레이봇이 그대로 import).
// 결정 순간(허브 진입·복귀·세션 시작)에만 부른다. 머무는 동안 시간 경과로 부르지 않는다.
import type { PlayerObserveDigest } from '../../game/playerObserve/playerObserveSink';

export type StellaObserveChannel = 'ask' | 'message' | 'remark';

export type StellaObserveDetector =
  | 'destroy_or_loss_streak'
  | 'advice_ignored_then_destroy'
  | 'hull_low'
  | 'session_gap_hours'
  | 'first_bit'
  | 'advice_followed_then_win'
  | 'level_multiple'
  | 'objective_stall'
  | 'same_planet_combat_run'
  | 'long_session_or_late'
  | 'trade_count_today'
  /** 표 행이 아님 — 스텔라 일상 질문을 같은 판단에 올릴 때만 (stellaLifeAskHit). 감지기는 늘 false. */
  | 'life_ask';

export const STELLA_OBSERVE_DETECTORS: readonly StellaObserveDetector[] = [
  'destroy_or_loss_streak',
  'advice_ignored_then_destroy',
  'hull_low',
  'session_gap_hours',
  'first_bit',
  'advice_followed_then_win',
  'level_multiple',
  'objective_stall',
  'same_planet_combat_run',
  'long_session_or_late',
  'trade_count_today',
];

export type StellaObserveSituationRow = {
  id: string;
  priority: number;
  detector: StellaObserveDetector;
  paramA: number;
  paramB: number;
  motiveId: string;
  channel: StellaObserveChannel;
  cooldownHours: number;
  dutyGate: 'any' | 'off_only';
  enabled: boolean;
  lineKo: string;
  lineEn: string;
  /** 이 상황의 근거가 된 행동 동사. 그 행동이 방금일수록 말할 때다. 비면 지금 상태 자체가 근거. */
  anchorVerb: string;
};

export type StellaObserveInput = {
  digest: Readonly<PlayerObserveDigest>;
  /** 기함 내구도 0..100. 모르면 null. */
  hullPct: number | null;
  /** 이번 결정 순간이 세션 첫 허브 진입인가. */
  sessionStart: boolean;
  /** 직전 세션 마지막 행동부터 지난 시간. sessionStart 일 때만 쓴다. */
  sessionGapHours: number;
  sessionMinutes: number;
  /** 기기 현지 시각 0..23. */
  localHour: number;
  level: number;
  /** 같은 세부미션 목표인 채로 맞은 결정 순간 수 · 그동안 플레이 분. */
  objectiveStallCount: number;
  objectiveStallMinutes: number;
  /** Part A 조언 연결(O6) 전에는 false. */
  adviceIgnoredThenDestroyed: boolean;
  adviceFollowedThenWon: boolean;
  /** 이미 말한 firsts 비트 — 게이트 상태. */
  announcedFirsts: number;
  /** 마지막으로 축하한 레벨 배수 번호 — 게이트 상태. */
  lastLevelMark: number;
};

/** intensity: 문턱을 막 넘으면 1, 더 심할수록 커진다. 게이트가 말하고 싶은 마음에 쓴다. */
export type StellaObserveVars = { nth: number; d: number; intensity: number };

export type StellaObserveHit = { row: StellaObserveSituationRow; vars: StellaObserveVars };

/** 늦은 시간 판정 끝 시각(제외). 시작은 행의 paramB. */
const LATE_END_HOUR = 6;

function matches(row: StellaObserveSituationRow, input: StellaObserveInput, vars: StellaObserveVars): boolean {
  const a = row.paramA;
  const b = row.paramB;
  const dg = input.digest;
  switch (row.detector) {
    case 'destroy_or_loss_streak':
      // 문장은 「실려 왔어」라 오늘 파괴 횟수만 본다. 연패(paramB)는 그 문장에 쓰지 않는다.
      if (a > 0 && dg.dstr >= a) {
        vars.nth = dg.dstr;
        vars.intensity = dg.dstr / a;
        return true;
      }
      return false;
    case 'advice_ignored_then_destroy':
      return input.adviceIgnoredThenDestroyed;
    case 'hull_low':
      if (input.hullPct == null || input.hullPct > a) return false;
      vars.intensity = a > 0 ? 1 + (a - input.hullPct) / a : 1;
      return true;
    case 'session_gap_hours':
      if (!input.sessionStart || input.sessionGapHours < a) return false;
      vars.d = Math.max(1, Math.floor(input.sessionGapHours / 24));
      vars.intensity = a > 0 ? input.sessionGapHours / a : 1;
      return true;
    case 'first_bit':
      return a > 0 && (dg.firsts & a) !== 0 && (input.announcedFirsts & a) === 0;
    case 'advice_followed_then_win':
      return input.adviceFollowedThenWon;
    case 'level_multiple':
      return a > 0 && (dg.c.level ?? 0) > 0 && Math.floor(input.level / a) > input.lastLevelMark;
    case 'objective_stall':
      if (input.objectiveStallCount < a || input.objectiveStallMinutes < b) return false;
      vars.intensity = a > 0 ? input.objectiveStallCount / a : 1;
      return true;
    case 'same_planet_combat_run':
      if (dg.run < a || input.sessionMinutes < b) return false;
      vars.intensity = a > 0 ? dg.run / a : 1;
      return true;
    case 'long_session_or_late': {
      if (input.sessionMinutes >= a) {
        vars.intensity = a > 0 ? input.sessionMinutes / a : 1;
        return true;
      }
      const late = b > 0 && input.localHour >= b && input.localHour < LATE_END_HOUR;
      return late && input.sessionMinutes >= a / 2;
    }
    case 'trade_count_today': {
      const n = dg.c.trade ?? 0;
      if (n < a) return false;
      vars.intensity = a > 0 ? n / a : 1;
      return true;
    }
    default:
      return false;
  }
}

/**
 * 맞는 상황을 우선순위 순으로. rows 는 priority 오름차순이어야 한다.
 * includeDisabled 는 봇 빈도 검증(O4) 전용 — 앱은 쓰지 않는다.
 */
export function detectStellaSituations(
  rows: readonly StellaObserveSituationRow[],
  input: StellaObserveInput,
  opts?: { includeDisabled?: boolean },
): StellaObserveHit[] {
  const out: StellaObserveHit[] = [];
  const all = opts?.includeDisabled === true;
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i]!;
    if (!row.enabled && !all) continue;
    const vars: StellaObserveVars = { nth: 0, d: 0, intensity: 1 };
    if (matches(row, input, vars)) out.push({ row, vars });
  }
  return out;
}

const NTH_KO = ['', '', '두 번째로', '세 번째로', '네 번째로', '다섯 번째로'];
const NTH_EN = ['', '', 'a second time', 'a third time', 'a fourth time', 'a fifth time'];
const DAYS_KO = ['', '하루', '이틀', '사흘', '나흘', '닷새'];
const DAYS_EN = ['', 'a day', 'two days', 'three days', 'four days', 'five days'];

/** 숫자는 5 이하 개인 횟수·날짜만 말로 바꾼다. 그 밖은 수를 말하지 않는다. */
export function renderStellaObserveLine(hit: StellaObserveHit, locale: 'ko' | 'en'): string {
  const en = locale === 'en';
  const line = en ? hit.row.lineEn : hit.row.lineKo;
  const n = hit.vars.nth;
  const d = hit.vars.d;
  const nth = n >= 2 && n <= 5 ? (en ? NTH_EN : NTH_KO)[n]! : en ? 'again' : '또';
  const days = d >= 1 && d <= 5 ? (en ? DAYS_EN : DAYS_KO)[d]! : en ? 'a few days' : '며칠';
  return line.replace('{nth}', nth).replace('{d}', days);
}
