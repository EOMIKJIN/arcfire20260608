// ============================================================
// planet_core_stat_authority.csv — ArcCore 5스탯 층(World/Player) 단일 authority
// 이중 규칙 방지: 패스별 ON/OFF가 아니라 context별 허용 축 정의
// ============================================================

import { PlanetCoreStatAuthority_FROM_BALANCE_CSV } from '../../data/balance/generated';

export type PlanetCoreStatAuthorityContext = 'world_default' | 'player_owned' | 'player_home';

export type PlanetCoreStatAuthorityRow = {
  contextKey: PlanetCoreStatAuthorityContext;
  masterBalanceGauge: boolean;
  energyRBlend: number;
  equilibriumDev: boolean;
  economyDecay: boolean;
  npcEconomyDecayMul: number;
  environmentDiversity: boolean;
};

let cachedByContext: Map<PlanetCoreStatAuthorityContext, PlanetCoreStatAuthorityRow> | null = null;

function parseBool(raw: string | undefined): boolean {
  return String(raw ?? '').trim().toLowerCase() === 'true';
}

function parseRow(raw: (typeof PlanetCoreStatAuthority_FROM_BALANCE_CSV)[number]): PlanetCoreStatAuthorityRow {
  const contextKey = String(raw.context_key ?? 'world_default').trim() as PlanetCoreStatAuthorityContext;
  return {
    contextKey,
    masterBalanceGauge: parseBool(raw.master_balance_gauge),
    energyRBlend: Math.max(0, Math.min(1, Number(raw.energy_r_blend) || 0)),
    equilibriumDev: parseBool(raw.equilibrium_dev),
    economyDecay: parseBool(raw.economy_decay),
    npcEconomyDecayMul: Math.max(0, Math.min(1, Number(raw.npc_economy_decay_mul) || 0)),
    environmentDiversity: parseBool(raw.environment_diversity),
  };
}

function getByContextMap(): Map<PlanetCoreStatAuthorityContext, PlanetCoreStatAuthorityRow> {
  if (cachedByContext) return cachedByContext;
  cachedByContext = new Map();
  for (const row of PlanetCoreStatAuthority_FROM_BALANCE_CSV) {
    const parsed = parseRow(row);
    cachedByContext.set(parsed.contextKey, parsed);
  }
  return cachedByContext;
}

const FALLBACK: Record<PlanetCoreStatAuthorityContext, PlanetCoreStatAuthorityRow> = {
  world_default: {
    contextKey: 'world_default',
    masterBalanceGauge: true,
    energyRBlend: 1,
    equilibriumDev: false,
    economyDecay: true,
    npcEconomyDecayMul: 0.55,
    environmentDiversity: true,
  },
  player_owned: {
    contextKey: 'player_owned',
    masterBalanceGauge: false,
    energyRBlend: 0.35,
    equilibriumDev: true,
    economyDecay: true,
    npcEconomyDecayMul: 0,
    environmentDiversity: false,
  },
  player_home: {
    contextKey: 'player_home',
    masterBalanceGauge: false,
    energyRBlend: 0.25,
    equilibriumDev: true,
    economyDecay: true,
    npcEconomyDecayMul: 0,
    environmentDiversity: false,
  },
};

export function resolvePlanetCoreStatAuthority(
  context: PlanetCoreStatAuthorityContext,
): PlanetCoreStatAuthorityRow {
  return getByContextMap().get(context) ?? FALLBACK[context];
}
