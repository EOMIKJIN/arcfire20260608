import { resolvePlanetMilitaryCommandLevel } from '../../game/planetDevelopment/planetMilitaryCommandListing';
import type { TerritorialCombatParticipant } from './arcCoreTerritorialCombatPolicy';
import {
  resolveMilitaryCommandTerritorialBonusFromLevel,
  type MilitaryCommandTerritorialBonus,
} from './applyMilitaryCommandTerritorialAdjustments';

export function resolveMilitaryCommandTerritorialBonus(
  planetId: string,
  defenderSide: TerritorialCombatParticipant,
): MilitaryCommandTerritorialBonus {
  const id = planetId?.trim();
  if (!id) {
    return resolveMilitaryCommandTerritorialBonusFromLevel({
      installed: false,
      level: 0,
      defenderSide,
    });
  }
  const level = resolvePlanetMilitaryCommandLevel(id);
  return resolveMilitaryCommandTerritorialBonusFromLevel({
    installed: level > 0,
    level,
    defenderSide,
  });
}
