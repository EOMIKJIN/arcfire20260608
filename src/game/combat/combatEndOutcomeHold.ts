/**
 * 전투 종료 파이프라인 진행 중 홀드.
 * 결과창이 떠 있는 동안 미션 클리어·브리지 레벨업이 끼어들지 못하게 한다.
 * 틱/persist 없음. 흐름 시작·종료에만 set.
 */

let held = false;
const listeners = new Set<() => void>();

export function setCombatEndOutcomeHold(next: boolean): void {
  if (held === next) return;
  held = next;
  listeners.forEach((listener) => listener());
}

export function isCombatEndOutcomeHold(): boolean {
  return held;
}

export function subscribeCombatEndOutcomeHold(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}
