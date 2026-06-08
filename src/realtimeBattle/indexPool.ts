// ============================================================
// 실시간 전투 — 엔티티 인덱스 풀 (O(1) acquire / release)
// ============================================================

export class BattleIndexPool {
  private readonly free: number[] = [];

  constructor(capacity: number) {
    for (let i = capacity - 1; i >= 0; i--) this.free.push(i);
  }

  acquire(): number | null {
    const id = this.free.pop();
    return id === undefined ? null : id;
  }

  release(id: number): void {
    this.free.push(id);
  }

  get freeCount(): number {
    return this.free.length;
  }
}
