/**
 * 전투 적 리더 — 2기 이상이면 1기는 반드시 리더.
 * 명시 `isLeader` 우선, 없으면 적 슬롯 첫 함장.
 */

export type CombatEnemyLeaderCandidate = {
  captainId: string;
  isLeader?: boolean;
};

export function resolveCombatEnemyLeader(
  candidates: readonly CombatEnemyLeaderCandidate[],
): CombatEnemyLeaderCandidate | null {
  const list: CombatEnemyLeaderCandidate[] = [];
  for (let i = 0; i < candidates.length; i += 1) {
    const id = candidates[i]!.captainId.trim();
    if (!id) continue;
    list.push({ captainId: id, isLeader: candidates[i]!.isLeader === true });
  }
  if (list.length === 0) return null;
  for (let i = 0; i < list.length; i += 1) {
    if (list[i]!.isLeader) return list[i]!;
  }
  return { captainId: list[0]!.captainId, isLeader: true };
}

export function markFirstHostileFleetLeader<T extends { team: 'red' | 'blue' | 'orange'; isLeader?: boolean }>(
  rows: readonly T[],
): T[] {
  let marked = false;
  const out: T[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i]!;
    if (!marked && row.team !== 'blue') {
      marked = true;
      out.push({ ...row, isLeader: true });
      continue;
    }
    out.push(row);
  }
  return out;
}
