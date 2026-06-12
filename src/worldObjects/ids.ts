import type { WorldObjectKind } from './types';

/** 행성·종류·인스턴스 키로 월드오브젝트 id 단일 생성 — CSV·런타임 공통 */
export function makeWorldObjectId(
  planetId: string,
  kind: WorldObjectKind,
  instanceKey: string,
): string {
  return `${planetId}:${kind}:${instanceKey}`;
}

export type ParsedWorldObjectId = {
  planetId: string;
  kind: WorldObjectKind;
  instanceKey: string;
};

/** `eden_prime:defense_satellite:1` → 구성요소. 비표준 id는 null */
export function parseWorldObjectId(objectId: string): ParsedWorldObjectId | null {
  const parts = objectId.split(':');
  if (parts.length < 3) return null;
  const planetId = parts[0]!;
  const kind = parts[1] as WorldObjectKind;
  const instanceKey = parts.slice(2).join(':');
  if (!planetId || !instanceKey) return null;
  return { planetId, kind, instanceKey };
}

export function isWorldObjectIdForPlanet(objectId: string, planetId: string): boolean {
  return objectId.startsWith(`${planetId}:`);
}
