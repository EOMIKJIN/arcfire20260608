/** 본편 메인스토리 골격 — 챕터·퀘스트 id 규약. 콘텐츠 제목은 CSV. */

export const MAIN_STORY_CHAPTER_COUNT = 10;
export const MAIN_STORY_SPINE_QUESTS_PER_CHAPTER = 30;
export const MAIN_STORY_BRANCH_SLOTS_PER_CHAPTER = 4;

export const MAIN_STORY_CHAPTER_ID_PREFIX = 'ms_ch_';
export const MAIN_STORY_QUEST_ID_RE = /^story_c(\d{2})_q(\d{2})$/;
export const MAIN_STORY_BRANCH_QUEST_ID_RE = /^story_c(\d{2})_b(\d{2})$/;

export function padMainStoryIndex(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatMainStoryChapterId(chapterOrder: number): string {
  return `${MAIN_STORY_CHAPTER_ID_PREFIX}${padMainStoryIndex(chapterOrder)}`;
}

export function formatMainStoryQuestId(chapterOrder: number, questIndex: number): string {
  return `story_c${padMainStoryIndex(chapterOrder)}_q${padMainStoryIndex(questIndex)}`;
}

export function formatMainStoryBranchQuestId(chapterOrder: number, branchIndex: number): string {
  return `story_c${padMainStoryIndex(chapterOrder)}_b${padMainStoryIndex(branchIndex)}`;
}

export function formatMainStoryChapterEndSceneId(chapterOrder: number): string {
  return `story_chapter_end_${padMainStoryIndex(chapterOrder)}`;
}

export function parseMainStoryChapterOrder(chapterId: string): number | null {
  if (!chapterId.startsWith(MAIN_STORY_CHAPTER_ID_PREFIX)) return null;
  const n = Number.parseInt(chapterId.slice(MAIN_STORY_CHAPTER_ID_PREFIX.length), 10);
  return Number.isFinite(n) && n >= 1 ? n : null;
}
