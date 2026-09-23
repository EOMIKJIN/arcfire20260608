import { clampStellaLifeSnapshotToMaxBytes, emptyStellaLifeSnapshot, parseStellaLifeSnapshot } from './stellaLifeSnapshot';
import type { StellaLifeSnapshot } from './stellaLifeTypes';

let life: StellaLifeSnapshot = emptyStellaLifeSnapshot();

export function hydrateStellaLifeMemory(raw: unknown): void {
  life = parseStellaLifeSnapshot(raw);
}

export function snapshotStellaLifeMemory(): StellaLifeSnapshot {
  return life;
}

export function resetStellaLifeMemory(): void {
  life = emptyStellaLifeSnapshot();
}

export function patchStellaLifeMemory(next: StellaLifeSnapshot): void {
  life = clampStellaLifeSnapshotToMaxBytes(next);
}

export function mutateStellaLifeMemory(fn: (cur: StellaLifeSnapshot) => StellaLifeSnapshot): void {
  life = clampStellaLifeSnapshotToMaxBytes(fn(life));
}
