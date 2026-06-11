import {
  resolvePlanetAsteroidAssignedMineralIds,
  resolvePlanetAsteroidOrbitCount,
} from '../world/mineralDepositModel';
import { useWorldObjectRuntimeStore } from '../store/worldObjectRuntimeStore';
import type { WorldObject } from './types';

type PlanetLike = { id: string; name?: string };
type SystemLike = { id: string };

export interface PlanetWorldObjectQueryInput {
  planet: PlanetLike;
  system: SystemLike;
  nowMs?: number;
}

/**
 * 월드오브젝트 공통 조회 진입점.
 * 현재는 소행성 골격만 생성하며, 추후 CSV/DB 기반 객체(기지/잔해물)를 여기에 합류시킨다.
 */
export function listPlanetWorldObjects(input: PlanetWorldObjectQueryInput): WorldObject[] {
  const fallbackOrbitCount = resolvePlanetAsteroidOrbitCount(input.planet.id);
  const runtime = useWorldObjectRuntimeStore.getState();
  const orbitCount = runtime.getAsteroidOrbitCount(input.planet.id, fallbackOrbitCount);
  const fallbackAssigned = resolvePlanetAsteroidAssignedMineralIds(input.planet.id, orbitCount);
  const assignedMineralIds = runtime.getAsteroidAssignedMineralItemIds(
    input.planet.id,
    orbitCount,
    fallbackAssigned,
  );
  const wreck: WorldObject = {
    id: `${input.planet.id}:wreck:1`,
    kind: 'wreck',
    planetId: input.planet.id,
    systemId: input.system.id,
    title: '잔해',
    description: '궤도 표류 잔해 — 수색 시 회수품 획득 가능(기초)',
    transform: {
      orbitSlotIndex: 960,
      radiusScale: 0.78,
      phaseBias: 0.41,
    },
    interactions: [
      { kind: 'salvage', enabled: true },
      { kind: 'scan', enabled: true },
    ],
    state: {
      depleted: false,
      cooldownUntilMs: null,
    },
    tags: ['world_object', 'wreck', 'salvage_stub'],
  };

  const asteroids: WorldObject[] = Array.from({ length: orbitCount }, (_, i) => {
    const n = i + 1;
    const mineralItemId = assignedMineralIds[i] ?? 'ore_ferrite';
    return {
      id: `${input.planet.id}:asteroid:${n}`,
      kind: 'asteroid',
      planetId: input.planet.id,
      systemId: input.system.id,
      mineralItemId,
      title: `소행성 ${n}`,
      description: `채광 가능 · 표시 광물(참고): ${mineralItemId}`,
      transform: {
        orbitSlotIndex: i,
        radiusScale: 0.58 + i * 0.035,
        phaseBias: (i * 0.13) % 1,
      },
      interactions: [
        {
          kind: 'mining',
          enabled: true,
        },
        {
          kind: 'scan',
          enabled: true,
        },
      ],
      state: {
        depleted: false,
        cooldownUntilMs: null,
      },
      tags: ['world_object', 'asteroid'],
    };
  });

  return [...asteroids, wreck];
}

