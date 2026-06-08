// ============================================================
// NPC·스테이지 결정론 시드 (문자열 → u32) — 궤도·스폰·표시 공용
// ============================================================

/** FNV-1a 32bit — 핫패스에서 할당 없이 동작 */
export function npcDeterministicHash32(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}
