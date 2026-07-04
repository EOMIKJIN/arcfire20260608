export {
  CLAN_WAR_MAX_CAPITAL_DEPLOYMENTS_PER_PLANET,
  canClaimAsHomePlanet,
  canDeployCapitalAtPlanet,
  countDeploymentsOnPlanet,
  isNeutralHold,
  soloClanIdForUid,
} from './clanWarRules';

export { resolveGameplayZoneHubPlanet, type ClanWarHubZone } from './resolveZoneHubPlanet';
export { formatClanPlateDisplayName } from './formatClanPlateDisplayName';
export {
  getAiClanRegistryRow,
  isCaptainAiClanAffiliated,
  listAiClanTerritoryHubClans,
  resolveAiClanDisplayName,
  resolveCaptainAiClanDisplayName,
  resolveCaptainAiClanId,
} from './aiClanRegistry';
export { normalizeAiClanId, aiClanIdForCaptainRecord } from './aiNpcClanIds';
export {
  canPurchasePlanetOwnershipDeed,
  isNationDefaultDeedOwnership,
  isNationSeedClanId,
  isPlayerOriginatedClanId,
  isPlayerPlanetDeedOwner,
  migratePlanetHoldOwnershipSplit,
  migratePlanetHoldsOwnershipSplit,
  previewPlanetOwnershipDeedPurchase,
  resolveDeedOwnerClanId,
  resolveNationSeedClanIdForMegaFaction,
  resolvePlanetHoldForOwnershipCheck,
  resolvePlanetHubOwnershipPlate,
  resolveSeedOccupierClanForPlanet,
  resolveTerritorialOccupierClanId,
  resolveTerritorialSideForHold,
} from './planetOwnershipModel';
