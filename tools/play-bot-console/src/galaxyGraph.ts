/** 2단계 — synth 사이드 항로. 코어 영토 1홉은 csvSystems 유지. */
import { GALAXY_SYSTEMS_PRECOMPUTED } from '../../../src/data/generated/galaxySystems100.generated';

let ready = false;
const planetSys = new Map<string, string>();
const sysPlanet = new Map<string, string>();
const adj = new Map<string, string[]>();

function ensure(): void {
  if (ready) return;
  const ids = Object.keys(GALAXY_SYSTEMS_PRECOMPUTED);
  for (let i = 0; i < ids.length; i += 1) {
    const sys = GALAXY_SYSTEMS_PRECOMPUTED[ids[i]];
    if (!sys) continue;
    const conns: string[] = [];
    for (const c of sys.connections ?? []) {
      if (c && c !== sys.id && !conns.includes(c)) conns.push(c);
    }
    adj.set(sys.id, conns);
    for (const p of sys.planets ?? []) {
      planetSys.set(p.id, sys.id);
      if (!sysPlanet.has(sys.id)) sysPlanet.set(sys.id, p.id);
    }
  }
  ready = true;
}

export function galaxySystemOf(planetId: string): string | null {
  ensure();
  return planetSys.get(planetId) ?? null;
}

export function galaxyPrimaryPlanet(systemId: string): string | null {
  ensure();
  return sysPlanet.get(systemId) ?? null;
}

export function galaxyBfsNext(fromSystem: string, toSystem: string): string | null {
  ensure();
  if (fromSystem === toSystem) return null;
  const q: string[] = [fromSystem];
  const prev = new Map<string, string | null>([[fromSystem, null]]);
  let qi = 0;
  while (qi < q.length) {
    const cur = q[qi];
    qi += 1;
    const nexts = adj.get(cur) ?? [];
    for (let i = 0; i < nexts.length; i += 1) {
      const n = nexts[i];
      if (prev.has(n)) continue;
      prev.set(n, cur);
      if (n === toSystem) {
        let walk = n;
        let p = prev.get(walk) ?? null;
        while (p && p !== fromSystem) {
          walk = p;
          p = prev.get(walk) ?? null;
        }
        return walk;
      }
      q.push(n);
    }
  }
  return null;
}

export function galaxyHops(fromSystem: string, toSystem: string): number {
  ensure();
  if (fromSystem === toSystem) return 0;
  const q: string[] = [fromSystem];
  const dist = new Map<string, number>([[fromSystem, 0]]);
  let qi = 0;
  while (qi < q.length) {
    const cur = q[qi];
    qi += 1;
    const d = dist.get(cur) ?? 0;
    const nexts = adj.get(cur) ?? [];
    for (let i = 0; i < nexts.length; i += 1) {
      const n = nexts[i];
      if (dist.has(n)) continue;
      dist.set(n, d + 1);
      if (n === toSystem) return d + 1;
      q.push(n);
    }
  }
  return -1;
}
