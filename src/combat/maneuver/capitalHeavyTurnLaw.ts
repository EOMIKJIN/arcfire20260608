/**
 * 전함 육중 선회 법칙 — 이동속도 대비 요율·각가속 상한.
 *
 * CSV `maxTurnRateRadPerMs` 는 그대로 두고, 적분기가 이 상한을 한 번 더 켠다.
 * 표 값이 더 느리면 표를 존중한다(기존값 덮어쓰기 아님).
 *
 * 틱당 신규 객체 없음 — `writeCapitalHeavyTurnLaw` 가 out 버퍼만 갱신.
 */

export type CapitalHeavyTurnLaw = {
  maxTurnRateRadPerMs: number;
  turnAccelRadPerMs2: number;
  minTurnRadiusPx: number;
};

/** 기준 함급(sizeClass 8) 최소 선회 반경 — 약 2~3 헐 길이 */
export const CAPITAL_HEAVY_BASE_MIN_TURN_RADIUS_PX = 52;
export const CAPITAL_HEAVY_MIN_TURN_RADIUS_FLOOR_PX = 40;
export const CAPITAL_HEAVY_MIN_TURN_RADIUS_CEIL_PX = 78;
/** 절대 요율 상한 ≈ 36°/s — 표 0.0013~0.0024(74~137°/s) 대비 육중 */
export const CAPITAL_HEAVY_MAX_YAW_RAD_PER_MS = 0.00063;
/** 0 → 최대 요까지 상승 시간 */
export const CAPITAL_HEAVY_YAW_RISE_MS = 480;
/** 이 헤딩 오차에서 유효 최대 요(그 이하는 비례 조타) ≈ 18° */
export const CAPITAL_HEAVY_FULL_RUDDER_RAD = 0.32;

export function createCapitalHeavyTurnLaw(): CapitalHeavyTurnLaw {
  return {
    maxTurnRateRadPerMs: CAPITAL_HEAVY_MAX_YAW_RAD_PER_MS,
    turnAccelRadPerMs2: CAPITAL_HEAVY_MAX_YAW_RAD_PER_MS / CAPITAL_HEAVY_YAW_RISE_MS,
    minTurnRadiusPx: CAPITAL_HEAVY_BASE_MIN_TURN_RADIUS_PX,
  };
}

export function headingAlignGainForMaxYaw(maxTurnRateRadPerMs: number): number {
  return Math.max(0, maxTurnRateRadPerMs) / CAPITAL_HEAVY_FULL_RUDDER_RAD;
}

export function writeCapitalHeavyTurnLaw(
  maxMoveSpeedPxPerMs: number,
  tableMaxTurnRateRadPerMs: number,
  tableTurnAccelRadPerMs2: number,
  sizeClass: number,
  out: CapitalHeavyTurnLaw,
): void {
  const size = Number.isFinite(sizeClass) ? sizeClass : 8;
  const minTurnRadiusPx = Math.max(
    CAPITAL_HEAVY_MIN_TURN_RADIUS_FLOOR_PX,
    Math.min(
      CAPITAL_HEAVY_MIN_TURN_RADIUS_CEIL_PX,
      CAPITAL_HEAVY_BASE_MIN_TURN_RADIUS_PX + (size - 8) * 2.2,
    ),
  );
  const speed = Math.max(1e-6, maxMoveSpeedPxPerMs);
  const yawFromRadius = speed / minTurnRadiusPx;
  const tableYaw = Math.max(1e-8, tableMaxTurnRateRadPerMs);
  const maxTurnRateRadPerMs = Math.min(
    tableYaw,
    yawFromRadius,
    CAPITAL_HEAVY_MAX_YAW_RAD_PER_MS,
  );
  const accelFromRise = maxTurnRateRadPerMs / CAPITAL_HEAVY_YAW_RISE_MS;
  const tableAccel = tableTurnAccelRadPerMs2 > 0 ? tableTurnAccelRadPerMs2 : accelFromRise;
  out.maxTurnRateRadPerMs = maxTurnRateRadPerMs;
  out.turnAccelRadPerMs2 = Math.min(tableAccel, accelFromRise);
  out.minTurnRadiusPx = speed / maxTurnRateRadPerMs;
}
