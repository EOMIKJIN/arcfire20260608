// ============================================================
// 아크코어 스파이 전술 — Table-First (arc_core_spy_policy.csv)
// ============================================================

import { ArcCoreSpyPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';

export type ArcCoreSpyPolicy = {
  enabled: boolean;
  spyPoolFractionPct: number;
  spyPulseIntervalSec: number;
  spyPulseIntensityPerSpy: number;
  playerPlanetOnly: boolean;
  informantCaptainId: string;
  informantDialogSceneId: string;
  spyIntelNotifyPct: number;
  spyIntelAutoOpenDialog: boolean;
  spyDroneRoleFractionPct: number;
  spyDroneLinkEnabled: boolean;
};

let kv: Map<string, string> | null = null;

function getKv(): Map<string, string> {
  if (!kv) {
    kv = new Map(ArcCoreSpyPolicy_FROM_BALANCE_CSV.map((row) => [row.key, row.value] as const));
  }
  return kv;
}

function num(key: string, fallback: number): number {
  const n = Number(getKv().get(key));
  return Number.isFinite(n) ? n : fallback;
}

function bool01(key: string, fallback: boolean): boolean {
  const s = String(getKv().get(key) ?? '').trim().toLowerCase();
  if (s === '1' || s === 'true') return true;
  if (s === '0' || s === 'false') return false;
  return fallback;
}

function str(key: string, fallback: string): string {
  const s = String(getKv().get(key) ?? '').trim();
  return s || fallback;
}

export function resolveArcCoreSpyPolicy(): ArcCoreSpyPolicy {
  return {
    enabled: bool01('enabled', true),
    spyPoolFractionPct: Math.max(0, Math.min(100, num('spy_pool_fraction_pct', 1))),
    spyPulseIntervalSec: Math.max(1, num('spy_pulse_interval_sec', 8)),
    spyPulseIntensityPerSpy: Math.max(0.01, num('spy_pulse_intensity_per_spy', 1)),
    playerPlanetOnly: bool01('player_planet_only', true),
    informantCaptainId: str('informant_captain_id', 'npc_cpt_tavern_ret_01'),
    informantDialogSceneId: str('informant_dialog_scene_id', 'arc_core_spy_intel_alert'),
    spyIntelNotifyPct: Math.max(0, Math.min(100, num('spy_intel_notify_pct', 100))),
    spyIntelAutoOpenDialog: bool01('spy_intel_auto_open_dialog', true),
    spyDroneRoleFractionPct: Math.max(0, Math.min(100, num('spy_drone_role_fraction_pct', 40))),
    spyDroneLinkEnabled: bool01('spy_drone_link_enabled', true),
  };
}

export function invalidateArcCoreSpyPolicyCache(): void {
  kv = null;
}
