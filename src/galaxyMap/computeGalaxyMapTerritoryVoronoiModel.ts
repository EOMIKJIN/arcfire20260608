import { resolveClanMapDisplayColor } from '../arcCore/balance/clanMapFactionColorPolicy';
import type { StarSystem } from '../types';
import {
  buildGalaxyBlueRedVoronoiBorderSegments,
  type GalaxyVoronoiSite,
} from './buildGalaxyBlueRedVoronoiBorders';
import {
  buildGalaxyTerritoryVoronoiLayers,
  type GalaxyTerritoryFill,
  type GalaxyTerritoryOccupationLabel,
  type GalaxyTerritorySite,
} from './buildGalaxyTerritoryVoronoi';
import { chainAndChamferGalaxyBorders } from './chainAndChamferGalaxyBorders';
import { resolveMapFactionSideFromClanId } from './resolveMapFactionSide';

export type GalaxyTerritoryVoronoiPath = {
  key: string;
  color: string;
  coreColor: string;
  d: string;
};

export type GalaxyMapTerritoryVoronoiModel = {
  fills: GalaxyTerritoryFill[];
  paths: GalaxyTerritoryVoronoiPath[];
  occupationLabels: GalaxyTerritoryOccupationLabel[];
};

function polylineToPath(points: [number, number][], closed: boolean): string {
  const finite = points.filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  if (finite.length < 2) return '';
  const [first, ...rest] = finite;
  const body = `M${first[0].toFixed(2)} ${first[1].toFixed(2)}${rest
    .map(([x, y]) => ` L${x.toFixed(2)} ${y.toFixed(2)}`)
    .join('')}`;
  return closed ? `${body} Z` : body;
}

function borderCoreStrokeColor(baseColor: string): string {
  return baseColor;
}

/** Voronoi 채움·국경·점령 라벨 앵커 — worldmap 1회 useMemo 전용 */
export function computeGalaxyMapTerritoryVoronoiModel(input: {
  systems: StarSystem[];
  occupierClanIdBySystemId: Record<string, string | undefined>;
  mapBounds: { x0: number; y0: number; x1: number; y1: number };
  toScreen: (pos: { x: number; y: number }) => { x: number; y: number };
}): GalaxyMapTerritoryVoronoiModel {
  const { systems, occupierClanIdBySystemId, mapBounds, toScreen } = input;
  const voronoiSites: GalaxyVoronoiSite[] = [];
  const territorySites: GalaxyTerritorySite[] = [];

  for (const sys of systems) {
    const clanId = occupierClanIdBySystemId[sys.id];
    const side = resolveMapFactionSideFromClanId(clanId);
    const pos = toScreen(sys.position);
    if (!Number.isFinite(pos.x) || !Number.isFinite(pos.y)) continue;
    voronoiSites.push({ systemId: sys.id, x: pos.x, y: pos.y, side });
    territorySites.push({
      systemId: sys.id,
      x: pos.x,
      y: pos.y,
      factionSide: side,
      displayColor: clanId ? resolveClanMapDisplayColor(clanId) : '#9AA8C4',
    });
  }

  if (voronoiSites.length < 2) {
    return { fills: [], paths: [], occupationLabels: [] };
  }

  const layers = buildGalaxyTerritoryVoronoiLayers({
    sites: territorySites,
    bounds: mapBounds,
  });

  const segments = buildGalaxyBlueRedVoronoiBorderSegments({ sites: voronoiSites, bounds: mapBounds });
  const polylines = chainAndChamferGalaxyBorders(segments);
  const paths = polylines
    .map((pl, idx) => ({
      key: `${pl.kind}-${idx}`,
      color: pl.color,
      coreColor: borderCoreStrokeColor(pl.color),
      d: polylineToPath(pl.points, pl.closed),
    }))
    .filter((p) => p.d.length > 0 && !p.d.includes('NaN'));

  return {
    fills: layers.fills,
    paths,
    occupationLabels: layers.occupationLabels,
  };
}
