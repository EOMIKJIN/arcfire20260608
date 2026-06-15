import { ArcCoreInboundDronePolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';

export type ArcCoreInboundDronePolicy = {
  waveIntervalSec: number;
  waveCount: number;
  droneHp: number;
  inboundDurationSec: number;
  staggerSec: number;
  impactRadiusPx: number;
  edgeSpawnRadiusPx: number;
  interceptRangePx: number;
  interceptCooldownSec: number;
  maxActiveDrones: number;
};

function readPolicyValue(key: string, fallback: string): string {
  const row = ArcCoreInboundDronePolicy_FROM_BALANCE_CSV.find((r) => r.key === key);
  const raw = row?.value;
  return typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : fallback;
}

function readPolicyNumber(key: string, fallback: number): number {
  const n = Number(readPolicyValue(key, String(fallback)));
  return Number.isFinite(n) ? n : fallback;
}

let cachedPolicy: ArcCoreInboundDronePolicy | null = null;

export function getArcCoreInboundDronePolicy(): ArcCoreInboundDronePolicy {
  if (cachedPolicy) return cachedPolicy;
  cachedPolicy = {
    waveIntervalSec: Math.max(5, readPolicyNumber('wave_interval_sec', 60)),
    waveCount: Math.max(1, Math.floor(readPolicyNumber('wave_count', 10))),
    droneHp: Math.max(1, Math.floor(readPolicyNumber('drone_hp', 30))),
    inboundDurationSec: Math.max(1, readPolicyNumber('inbound_duration_sec', 18)),
    staggerSec: Math.max(0, readPolicyNumber('stagger_sec', 0.4)),
    impactRadiusPx: Math.max(8, readPolicyNumber('impact_radius_px', 62)),
    edgeSpawnRadiusPx: Math.max(40, readPolicyNumber('edge_spawn_radius_px', 218)),
    interceptRangePx: Math.max(20, readPolicyNumber('intercept_range_px', 200)),
    interceptCooldownSec: Math.max(0.2, readPolicyNumber('intercept_cooldown_sec', 2.4)),
    maxActiveDrones: Math.max(1, Math.floor(readPolicyNumber('max_active_drones', 24))),
  };
  return cachedPolicy;
}
