export type NarrativeOverlayWrite = 'dismiss' | 'present' | 'patch' | 'none';

export function isNarrativeOverlayContentChanged(input: {
  existingTypewriterKey: string;
  existingText: string;
  existingLabel: string;
  existingPortraitScale: number | undefined;
  nextTypewriterKey: string;
  nextText: string;
  nextLabel: string;
  nextPortraitScale: number | undefined;
  imageChanged: boolean;
}): boolean {
  return (
    input.existingTypewriterKey !== input.nextTypewriterKey
    || input.existingText !== input.nextText
    || input.existingLabel !== input.nextLabel
    || input.existingPortraitScale !== input.nextPortraitScale
    || input.imageChanged
  );
}

/** 페이지 변경은 patch. dismiss 는 visible=false / 언마운트만. */
export function resolveNarrativeOverlayWrite(
  visible: boolean,
  hasConfig: boolean,
  hasExistingNarrative: boolean,
  contentChanged: boolean,
): NarrativeOverlayWrite {
  if (!visible || !hasConfig) return 'dismiss';
  if (!hasExistingNarrative) return 'present';
  if (contentChanged) return 'patch';
  return 'none';
}
