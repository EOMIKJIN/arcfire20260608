/**
 * 세션 팩 인덱스 재생 — RN/CSV 인덱스 의존 없음.
 */
import type { IngameDialogSession } from './ingameDialogTypes';

export type AdvanceIngameDialogPackResult =
  | { type: 'blocked' }
  | { type: 'advanced'; session: IngameDialogSession }
  | { type: 'completed'; session: IngameDialogSession };

export function advanceIngameDialogSessionByPack(
  session: IngameDialogSession,
): AdvanceIngameDialogPackResult {
  const pack = session.pack;
  if (!pack || pack.steps.length === 0) return { type: 'blocked' };
  if (!session.pageComplete) return { type: 'blocked' };
  const next = (session.stepIndex ?? 0) + 1;
  if (next >= pack.steps.length) return { type: 'completed', session };
  const step = pack.steps[next]!;
  if (session.kind === 'adhoc') {
    return {
      type: 'advanced',
      session: {
        ...session,
        stepIndex: next,
        segmentIndex: step.segmentIndex,
        pageComplete: false,
      },
    };
  }
  return {
    type: 'advanced',
    session: {
      ...session,
      stepIndex: next,
      pageIndex: step.pageIndex,
      segmentIndex: step.segmentIndex,
      pageComplete: false,
    },
  };
}
