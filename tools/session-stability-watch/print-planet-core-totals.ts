import { getPlanetMasterBalanceDetailForPlanet } from '../../src/arcCore/planetBalance/planetZoneIndexRegistry';
import { deriveMasterBalanceCoreTargets } from '../../src/arcCore/planetBalance/deriveMasterBalanceCoreTargets';
import { planetCsvBaselineToRuntime } from '../../src/store/planetCoreRuntimeStore';
import { useWorldStore } from '../../src/store/worldStore';

function sum(g: {
  resource: number;
  population: number;
  defense: number;
  technology: number;
  environment: number;
}) {
  return g.resource + g.population + g.defense + g.technology + g.environment;
}

for (const id of ['arcadia_prime', 'vega_base'] as const) {
  const sys = Object.values(useWorldStore.getState().systems).find((s) =>
    s.planets.some((p) => p.id === id),
  );
  const planet = sys?.planets.find((p) => p.id === id);
  const mb = getPlanetMasterBalanceDetailForPlanet(id, sys ?? null);
  const target = deriveMasterBalanceCoreTargets(mb);
  const base = planet ? planetCsvBaselineToRuntime(planet) : null;
  console.log(
    JSON.stringify(
      {
        id,
        nameKo: planet?.name,
        zoneIndex: mb.zoneIndex,
        recommendedPilotLevel: mb.recommendedPilotLevel,
        csvSeed: base
          ? { R: base.resource, P: base.population, D: base.defense, T: base.technology, E: base.environment, total: sum(base) }
          : null,
        economyEcosystemTarget: {
          R: target.resource,
          P: target.population,
          D: target.defense,
          T: target.technology,
          E: target.environment,
          total: sum(target),
        },
      },
      null,
      2,
    ),
  );
}
