// ============================================================
// 궤도 주둔(3h) — worldStore 개방 성계 행성 풀 (STAR_SYSTEMS + unlocked synth)
// worldStore는 lazy require — 순환 참조 방지
// ============================================================

/** 개방 성계(기본 21 + unlocked synth)에 속한 행성 id — 테이블 주둔 3h 순환 풀 */
export function listUnlockedPlanetIdsForOrbitPresence(): string[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useWorldStore } = require('../../store/worldStore') as typeof import('../../store/worldStore');
  const world = useWorldStore.getState();
  const out: string[] = [];
  const seen = new Set<string>();
  for (const systemId of world.unlockedSystemIds) {
    const sys = world.systems[systemId];
    if (!sys) continue;
    for (const planet of sys.planets) {
      const pid = String(planet.id ?? '').trim();
      if (!pid || seen.has(pid)) continue;
      seen.add(pid);
      out.push(pid);
    }
  }
  out.sort();
  return out;
}

/** presence world index 캐시 키 — 개방 집합 변경 시 무효화 */
export function readUnlockedPlanetIdsSig(): string {
  return listUnlockedPlanetIdsForOrbitPresence().join(',');
}
