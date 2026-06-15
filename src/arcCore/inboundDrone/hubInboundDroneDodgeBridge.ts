// ============================================================
// STAGE 1 허브 — 인바운드 드론 colorDodge (성운 Skia 백드롭 전용)
// ============================================================

import type { MissileHitFx } from '../../components/planet/PlanetEdenRaidTestLayer';
import { INBOUND_DRONE_FX_ORBIT_AGE_SLOP_MS } from '../../components/planet/planetSkiaHitFxContract';
import { resolveNebulaDodgeFxDurationMs } from '../../components/planet/planetSkiaHitFxContract';

export const HUB_INBOUND_DRONE_DODGE_FX_MAX = 16;

export const hubInboundDroneDodgeHitFxRef: { current: MissileHitFx[] } = { current: [] };

export function resetHubInboundDroneDodgeBridge(): void {
  hubInboundDroneDodgeHitFxRef.current = [];
}

export function pushHubInboundDroneDodgeFx(fx: MissileHitFx): void {
  hubInboundDroneDodgeHitFxRef.current.push(fx);
  if (hubInboundDroneDodgeHitFxRef.current.length <= HUB_INBOUND_DRONE_DODGE_FX_MAX) return;
  hubInboundDroneDodgeHitFxRef.current.splice(
    0,
    hubInboundDroneDodgeHitFxRef.current.length - HUB_INBOUND_DRONE_DODGE_FX_MAX,
  );
}

export function compactHubInboundDroneDodgeFxInPlace(list: MissileHitFx[], orbitMs: number): void {
  let w = 0;
  for (let r = 0; r < list.length; r += 1) {
    const fx = list[r];
    if (!fx) continue;
    const age = orbitMs - fx.startMs;
    const dur = resolveNebulaDodgeFxDurationMs(fx);
    if (age < -INBOUND_DRONE_FX_ORBIT_AGE_SLOP_MS || age > dur) continue;
    list[w++] = fx;
  }
  list.length = w;
}
