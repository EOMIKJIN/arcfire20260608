import { execFileSync } from 'child_process';
import { getTerritorialCombatPolicy } from '../../../src/arcCore/territorial/arcCoreTerritorialCombatPolicy';
import { resolveEffectiveTerritorialCombatMode } from '../../../src/arcCore/territorial/resolveEffectiveTerritorialCombatMode';
import { isTerritorialProcessPlanet } from '../../../src/arcCore/territorial/isTerritorialProcessPlanet';
import { resolveAdjacentSystemFactionPresence } from '../../../src/arcCore/territorial/territorialCombatGraph';

const sqlite = 'C:/Users/eomsp/AppData/Local/Android/Sdk/platform-tools/sqlite3.exe';
const db = 'tools/long-run-monitor/logs/RKStorage-ok.db';
const war = JSON.parse(
  execFileSync(sqlite, [db, "SELECT value FROM catalystLocalStorage WHERE key='arcfire_clan_war_foundation_v2';"], {
    encoding: 'utf8',
  }),
);
const holds = (war.data || war).planetHolds;
const policy = getTerritorialCombatPolicy('omega_hub')!;
const adj = resolveAdjacentSystemFactionPresence({ systemId: 'omega_station', holds });
// supply counts: presence 1-hop only (enough for P0 asymmetry)
const supply = {
  blue: adj.hasBlue ? 1 : 0,
  red: adj.hasRed ? 1 : 0,
};
const effective = resolveEffectiveTerritorialCombatMode({
  holdSide: 'NEUTRAL',
  policyCombatMode: policy.combatMode,
  supplyAdjacency: supply,
});

console.log(
  JSON.stringify(
    {
      policy: {
        combatMode: policy.combatMode,
        contestedZone: policy.contestedZone,
        weights: {
          battle: policy.battleWeightPct,
          neutralDeclare: policy.neutralDeclareWeightPct,
          statusQuo: policy.statusQuoWeightPct,
          dominant: policy.dominantSideWeightPct,
        },
        campaign: policy.campaignGroup,
        order: policy.campaignOrder,
      },
      isTerritorialProcessPlanet: isTerritorialProcessPlanet('omega_hub'),
      adjacentPresence: adj,
      supplyAdjacencyApprox: supply,
      effectiveCombatMode: effective,
      hold: holds.omega_hub,
    },
    null,
    2,
  ),
);
