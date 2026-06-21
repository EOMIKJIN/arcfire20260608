// ============================================================
// 인게임 대화 — 페이지·세그먼트 상태기계 (순수 함수)
// ============================================================

import type { StorySceneDef } from '../../types';
import { filterIngameDialogPages } from './ingameDialogSceneIndex';
import type { IngameDialogSession } from './ingameDialogTypes';

export type IngameDialogStepFlags = {
  isLastPage: boolean;
  isLastSegment: boolean;
  isFinalStep: boolean;
  pageCount: number;
  segmentCount: number;
};

export function resolveIngameDialogStepFlags(
  session: Extract<IngameDialogSession, { kind: 'csv_scene' }>,
  scene: StorySceneDef,
  segmentCount: number,
): IngameDialogStepFlags {
  const pages = filterIngameDialogPages(scene);
  const pageCount = pages.length;
  const isLastPage = session.pageIndex >= Math.max(0, pageCount - 1);
  const isLastSegment = session.segmentIndex >= Math.max(0, segmentCount - 1);
  return {
    isLastPage,
    isLastSegment,
    isFinalStep: isLastPage && isLastSegment,
    pageCount,
    segmentCount,
  };
}

export type AdvanceIngameDialogResult =
  | { type: 'blocked' }
  | { type: 'advanced'; session: IngameDialogSession }
  | { type: 'completed'; session: IngameDialogSession };

export function advanceIngameDialogSession(
  session: IngameDialogSession,
  scene: StorySceneDef | null,
  segmentCount: number,
): AdvanceIngameDialogResult {
  if (session.kind === 'adhoc') {
    if (!session.pageComplete) return { type: 'blocked' };
    return { type: 'completed', session };
  }
  if (!scene) return { type: 'blocked' };
  const flags = resolveIngameDialogStepFlags(session, scene, segmentCount);
  if (!session.pageComplete) return { type: 'blocked' };
  if (!flags.isLastSegment) {
    return {
      type: 'advanced',
      session: {
        ...session,
        segmentIndex: session.segmentIndex + 1,
        pageComplete: false,
      },
    };
  }
  if (!flags.isLastPage) {
    return {
      type: 'advanced',
      session: {
        ...session,
        pageIndex: session.pageIndex + 1,
        segmentIndex: 0,
        pageComplete: false,
      },
    };
  }
  return { type: 'completed', session };
}
