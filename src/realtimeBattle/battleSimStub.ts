// ============================================================
// 실시간 전투 — 최소 적분 스텁 (연결 테스트·프로파일링용)
// 실제 전투는 별도 시스템으로 대체 예정
// ============================================================

import { integrateCapitalShipPlanar, normalizeAngleRad } from '../sim/capitalShipKinematics';
import type { BattleArenaBuffers } from './battleArenaBuffers';

/** 단순 선형 이동 (충돌·무기 없음) */
export function integrateBattleArenaLinear(buf: BattleArenaBuffers, count: number, dtSec: number): void {
  const n = Math.min(count, buf.x.length);
  for (let i = 0; i < n; i++) {
    if (!buf.active[i]) continue;
    buf.x[i] += buf.vx[i] * dtSec;
    buf.y[i] += buf.vy[i] * dtSec;
  }
}

/**
 * 전함식 곡선 이동: (vx,vy) 를 **희망 속도**(방향·크기)로 해석하고,
 * `heading` 은 최소 회전반경으로만 전환한 뒤 그 방향으로 전진.
 * `heading[i]` 는 라디안; 스폰 시 진행 방향과 맞춰 두는 것을 권장.
 */
export function integrateBattleArenaCapitalShips(
  buf: BattleArenaBuffers,
  count: number,
  dtSec: number,
  minTurnRadiusPx: number,
): void {
  const dtMs = dtSec * 1000;
  const n = Math.min(count, buf.x.length);
  for (let i = 0; i < n; i++) {
    if (!buf.active[i]) continue;
    const cmd = Math.hypot(buf.vx[i], buf.vy[i]);
    if (cmd < 1e-8) continue;
    const desired = Math.atan2(buf.vy[i], buf.vx[i]);
    const next = integrateCapitalShipPlanar(buf.x[i], buf.y[i], buf.heading[i], desired, {
      forwardSpeedPxPerMs: cmd,
      minTurnRadiusPx,
      dtMs,
    });
    buf.x[i] = next.x;
    buf.y[i] = next.y;
    buf.heading[i] = normalizeAngleRad(next.headingRad);
  }
}
