import {
  resolveCapitalPilotLevelBandForZone,
  resolveTradePortNpcShipIdsForZone,
} from '../../src/arcCore/balance/capitalShipTradeListingPolicy';
import { listCapitalShipItemIdsForPlanet } from '../../src/arcCore/balance/tradePortCapitalShipPolicy';
import {
  getTradePortCapitalMinPerPlanet,
  getTradePortCapitalZoneOverlap,
} from '../../src/arcCore/balance/balanceTableRegistry';

const SAMPLE_PLANETS = ['arcadia_prime', 'eden_city', 'draco_haven', 'omega_hub', 'core_prime'] as const;

console.log('minPerPlanet', getTradePortCapitalMinPerPlanet(), 'zoneOverlap', getTradePortCapitalZoneOverlap());

for (const zone of [1, 6, 10, 15, 20]) {
  const band = resolveCapitalPilotLevelBandForZone(zone);
  const ids = resolveTradePortNpcShipIdsForZone(zone);
  const paired = ids.filter((id) => id.includes('hunter') || id.includes('destroyer_mk1'));
  console.log(
    `zone${zone} band=${band.minLv}-${band.maxLv} ships=${ids.length} ids=${ids.join('|')}`,
  );
}

for (const planetId of SAMPLE_PLANETS) {
  const items = listCapitalShipItemIdsForPlanet(planetId);
  console.log(`${planetId}: ${items.length} ships — ${items.map((i) => i.replace('capital_ship_', '')).join(', ')}`);
}

// zone6 vs zone7 overlap — should share some SKUs
const z6 = new Set(resolveTradePortNpcShipIdsForZone(6));
const z7 = new Set(resolveTradePortNpcShipIdsForZone(7));
const overlap = [...z6].filter((id) => z7.has(id));
console.log(`zone6∩zone7 overlap: ${overlap.length} — ${overlap.join(', ')}`);
