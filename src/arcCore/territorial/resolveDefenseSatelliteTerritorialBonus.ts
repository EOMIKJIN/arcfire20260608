import { readDefenseSatelliteDetailFromPlanet } from '../../game/planetDevelopment/planetDefenseSatelliteRuntime';
import type { TerritorialCombatParticipant } from './arcCoreTerritorialCombatPolicy';
import {
  resolveDefenseSatelliteTerritorialBonusFromDetail,
  type DefenseSatelliteTerritorialBonus,
} from './applyDefenseSatelliteTerritorialAdjustments';

export function resolveDefenseSatelliteTerritorialBonus(
  planetId: string,
  defenderSide: TerritorialCombatParticipant,
): DefenseSatelliteTerritorialBonus {
  const id = planetId?.trim();
  if (!id) {
    return resolveDefenseSatelliteTerritorialBonusFromDetail({
      installed: false,
      level: 0,
      defenderSide,
    });
  }
  const detail = readDefenseSatelliteDetailFromPlanet(id);
  return resolveDefenseSatelliteTerritorialBonusFromDetail({
    installed: detail.installed === true,
    level: detail.level,
    installedBy: detail.installedBy,
    defenderSide,
  });
}
