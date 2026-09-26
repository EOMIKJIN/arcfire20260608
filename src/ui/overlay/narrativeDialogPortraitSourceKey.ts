export type NarrativePortraitSourceRef =
  | number
  | { uri?: string }
  | readonly NarrativePortraitSourceRef[]
  | null
  | undefined;

/** 같은 에셋이면 객체 참조가 달라도 동일. Image remount 판정용. */
export function narrativeDialogPortraitSourceKey(
  source?: NarrativePortraitSourceRef,
): string {
  if (source == null) return '';
  if (typeof source === 'number') return `n:${source}`;
  if (Array.isArray(source)) {
    return source.map((item) => narrativeDialogPortraitSourceKey(item)).join(',');
  }
  if (typeof source === 'object' && 'uri' in source && typeof source.uri === 'string') {
    return `u:${source.uri}`;
  }
  return 'other';
}

/** 같은 초상이면 기존 참조를 유지해 Image source 재적용을 막는다. */
export function reuseNarrativeDialogPortraitSource<T>(
  existing: T,
  next: T,
): T {
  if (
    narrativeDialogPortraitSourceKey(existing as NarrativePortraitSourceRef)
    === narrativeDialogPortraitSourceKey(next as NarrativePortraitSourceRef)
  ) {
    return existing;
  }
  return next;
}
