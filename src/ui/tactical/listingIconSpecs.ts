import { getItemDef } from '../../data/goods';
import type { TradeBuySubTabId } from '../../game/tradeBuySubTab';
import {
  PLANET_HUB_ACTION_ICONS,
  type PlanetHubActionIconSpec,
} from './planetHubActionIcons';

/** 행성개발 catalog id → SF 아이콘 (허브 메뉴와 동일 계열) */
const PLANET_DEV_MODULE_ICONS: Record<string, PlanetHubActionIconSpec> = {
  defense_satellite: PLANET_HUB_ACTION_ICONS.planetDevSatellite,
  dev_orbit_shipyard: PLANET_HUB_ACTION_ICONS.shipyard,
  dev_trade_port: PLANET_HUB_ACTION_ICONS.trade,
  dev_research_lab: PLANET_HUB_ACTION_ICONS.skilltree,
  dev_population_dome: PLANET_HUB_ACTION_ICONS.tavern,
  dev_energy_plant: { family: 'material-community', name: 'flash-outline' },
  dev_mineral_refinery: PLANET_HUB_ACTION_ICONS.mining,
  dev_trade_route: { family: 'material-community', name: 'transit-connection-variant' },
  dev_smart_farm: { family: 'material-community', name: 'sprout-outline' },
  dev_eco_restore: { family: 'material-community', name: 'leaf-circle-outline' },
  dev_fleet_support: { family: 'material-community', name: 'shield-star-outline' },
};

const TRADE_CATEGORY_ICONS: Record<string, PlanetHubActionIconSpec> = {
  food: { family: 'material-community', name: 'barley' },
  mineral: PLANET_HUB_ACTION_ICONS.mining,
  tech: { family: 'material-community', name: 'chip' },
  weapon: { family: 'material-community', name: 'sword-cross' },
  luxury: { family: 'material-community', name: 'diamond-stone' },
  contraband: { family: 'material-community', name: 'alert-octagon-outline' },
};

const TRADE_EQUIPMENT_CATEGORY_ICONS: Record<string, PlanetHubActionIconSpec> = {
  propulsion: PLANET_HUB_ACTION_ICONS.departure,
  defense: { family: 'material-community', name: 'shield-half-full' },
  sensor: PLANET_HUB_ACTION_ICONS.scan,
  ew: { family: 'material-community', name: 'broadcast' },
  support: { family: 'material-community', name: 'wrench-outline' },
  navigation: { family: 'material-community', name: 'compass-outline' },
  mining: PLANET_HUB_ACTION_ICONS.mining,
};

const TRADE_LISTING_FALLBACK: PlanetHubActionIconSpec = {
  family: 'material-community',
  name: 'package-variant-closed',
};

export function resolvePlanetDevModuleIcon(catalogId: string): PlanetHubActionIconSpec {
  return PLANET_DEV_MODULE_ICONS[catalogId] ?? PLANET_HUB_ACTION_ICONS.planetDev;
}

function resolveEquipmentCategoryIcon(
  attrs: Record<string, unknown> | undefined,
): PlanetHubActionIconSpec | null {
  const raw = attrs?.equipmentCategory;
  if (typeof raw !== 'string') return null;
  return TRADE_EQUIPMENT_CATEGORY_ICONS[raw.trim().toLowerCase()] ?? null;
}

export function resolveTradeListingIconSpec(
  goodId: string,
  category: string,
  buySubTab?: TradeBuySubTabId,
): PlanetHubActionIconSpec {
  const def = getItemDef(goodId);
  if (def?.type === 'capital_ship') return PLANET_HUB_ACTION_ICONS.shipyard;
  if (def?.type === 'weapon_module' || buySubTab === 'weapon') {
    return TRADE_CATEGORY_ICONS.weapon;
  }
  if (def?.kind === 'equipment' && def.type !== 'weapon_module') {
    const eqIcon = resolveEquipmentCategoryIcon(def.attrs as Record<string, unknown> | undefined);
    if (eqIcon) return eqIcon;
    return TRADE_CATEGORY_ICONS.tech;
  }
  if (def?.type === 'galactic_pool' || def?.type === 'orbital_mining') {
    return PLANET_HUB_ACTION_ICONS.mining;
  }
  if (def?.type === 'planet_ownership') {
    return { family: 'material-community', name: 'certificate-outline' };
  }
  if (def?.type === 'clan_disband') {
    return { family: 'material-community', name: 'file-document-outline' };
  }
  return TRADE_CATEGORY_ICONS[category] ?? TRADE_LISTING_FALLBACK;
}
