/** 방문 노드 안쪽 흰원과 동일 — 개척 맥박 최대 반경 */
export function resolveVisitedNodeInnerR(nodeR: number): number {
  return Math.max(2.5, nodeR * 0.42) + 1;
}

/** 성계마다 다른 맥박 주기·시작 오프셋 — 동시 점멸 금지 */
export function colonizePulseTiming(
  systemId: string,
  index: number,
): { delayMs: number; halfMs: number } {
  let h = 2166136261;
  for (let i = 0; i < systemId.length; i += 1) {
    h ^= systemId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const u = h >>> 0;
  const halfMs = 1100 + (u % 800);
  const delayMs = ((u >>> 8) + index * 673) % (halfMs * 2);
  return { delayMs, halfMs };
}
