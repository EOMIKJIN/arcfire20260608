/** 범용 UI 버튼·탭 라벨 — `[ 확인 ]` 형식 (이미 대괄호면 그대로) */
export function formatArcUniversalButtonLabel(
  label: string,
  options?: { compact?: boolean },
): string {
  const trimmed = label.trim();
  const compact = options?.compact === true;
  if (!trimmed) return compact ? '[]' : '[ ]';
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) return trimmed;
  if (compact) return `[${trimmed}]`;
  return `[ ${trimmed} ]`;
}
