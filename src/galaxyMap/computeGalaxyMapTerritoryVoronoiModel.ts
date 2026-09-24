import { resolveClanMapDisplayColor } from '../arcCore/balance/clanMapFactionColorPolicy';
import type { StarSystem } from '../types';
import {
  paintGalaxyBlueRedVoronoiBorderSegments,
  tessellateGalaxyBlueRedVoronoiBorderSegments,
  type GalaxyVoronoiOwnedBorderSegment,
  type GalaxyVoronoiSite,
} from './buildGalaxyBlueRedVoronoiBorders';
import {
  paintGalaxyTerritoryLayers,
  tessellateGalaxyTerritoryGeometry,
  type GalaxyTerritoryFill,
  type GalaxyTerritoryGeometry,
  type GalaxyTerritoryOccupationLabel,
  type GalaxyTerritorySite,
} from './buildGalaxyTerritoryVoronoi';
import {
  VORONOI_INFLUENCE_RADIUS_NN_MUL,
  meanNearestNeighborDist,
} from './clampGalaxyVoronoiInfluenceCell';
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

export type GalaxyMapTerritoryTessellation = {
  geometry: GalaxyTerritoryGeometry | null;
  borderSegments: GalaxyVoronoiOwnedBorderSegment[];
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

function buildVoronoiSites(input: {
  systems: StarSystem[];
  occupierClanIdBySystemId: Record<string, string | undefined>;
  toScreen: (pos: { x: number; y: number }) => { x: number; y: number };
}): { voronoiSites: GalaxyVoronoiSite[]; territorySites: GalaxyTerritorySite[] } {
  const { systems, occupierClanIdBySystemId, toScreen } = input;
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

  return { voronoiSites, territorySites };
}

/** R은 월드 간격으로 정하고 toScreen 배율로 환산 — 줌해도 월드 모양이 안 바뀐다. */
function resolveInfluenceRadiusPxFromWorld(
  systems: StarSystem[],
  toScreen: (pos: { x: number; y: number }) => { x: number; y: number },
): number {
  const worldPts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < systems.length; i += 1) {
    worldPts.push(systems[i]!.position);
  }
  const nn = meanNearestNeighborDist(worldPts);
  if (!(nn > 0)) return 0;
  const origin = toScreen({ x: 0, y: 0 });
  const axisX = toScreen({ x: 1, y: 0 });
  const axisY = toScreen({ x: 0, y: 1 });
  const scale = (Math.abs(axisX.x - origin.x) + Math.abs(axisY.y - origin.y)) * 0.5;
  if (!(scale > 0)) return 0;
  return nn * VORONOI_INFLUENCE_RADIUS_NN_MUL * scale;
}

const EMPTY_TESSELLATION: GalaxyMapTerritoryTessellation = {
  geometry: null,
  borderSegments: [],
};

const EMPTY_MODEL: GalaxyMapTerritoryVoronoiModel = {
  fills: [],
  paths: [],
  occupationLabels: [],
};

export function tessellateGalaxyMapTerritoryVoronoiModel(input: {
  systems: StarSystem[];
  occupierClanIdBySystemId: Record<string, string | undefined>;
  mapBounds: { x0: number; y0: number; x1: number; y1: number };
  toScreen: (pos: { x: number; y: number }) => { x: number; y: number };
}): GalaxyMapTerritoryTessellation {
  const { voronoiSites, territorySites } = buildVoronoiSites(input);
  if (voronoiSites.length < 2) return EMPTY_TESSELLATION;
  const influenceRadiusPx = resolveInfluenceRadiusPxFromWorld(input.systems, input.toScreen);

  return {
    geometry: tessellateGalaxyTerritoryGeometry({
      sites: territorySites,
      bounds: input.mapBounds,
      influenceRadiusPx,
    }),
    borderSegments: tessellateGalaxyBlueRedVoronoiBorderSegments({
      sites: voronoiSites,
      bounds: input.mapBounds,
      influenceRadiusPx,
    }),
  };
}

export function paintGalaxyMapTerritoryVoronoiModel(
  tessellation: GalaxyMapTerritoryTessellation,
  revealedSystemIds?: ReadonlySet<string>,
): GalaxyMapTerritoryVoronoiModel {
  if (!tessellation.geometry) return EMPTY_MODEL;

  const layers = paintGalaxyTerritoryLayers(tessellation.geometry, revealedSystemIds);
  const segments = paintGalaxyBlueRedVoronoiBorderSegments(
    tessellation.borderSegments,
    revealedSystemIds,
  );
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

/** Voronoi 채움·국경·점령 라벨 앵커 — tessellate + paint. worldmap은 둘을 분리 memo. */
export function computeGalaxyMapTerritoryVoronoiModel(input: {
  systems: StarSystem[];
  occupierClanIdBySystemId: Record<string, string | undefined>;
  mapBounds: { x0: number; y0: number; x1: number; y1: number };
  toScreen: (pos: { x: number; y: number }) => { x: number; y: number };
  revealedSystemIds?: ReadonlySet<string>;
}): GalaxyMapTerritoryVoronoiModel {
  return paintGalaxyMapTerritoryVoronoiModel(
    tessellateGalaxyMapTerritoryVoronoiModel(input),
    input.revealedSystemIds,
  );
}
