export type MainStoryContentStatus = 'ready' | 'partial' | 'skeleton';
export type MainStoryQuestKind = 'spine' | 'branch';
export type MainStoryBranchConditionKind = 'always' | 'flag';
export type MainStoryChainStepKind = 'mission';

export type MainStoryChapterRow = {
  id: string;
  order: number;
  titleKo: string;
  titleEn: string;
  themeKo: string;
  themeEn: string;
  contentStatus: MainStoryContentStatus;
  endStorySceneId: string;
  endStoryReady: boolean;
  notes: string;
};

export type MainStoryQuestRow = {
  questId: string;
  chapterId: string;
  questIndex: number;
  bindMissionId: string | null;
  contentStatus: MainStoryContentStatus;
  questKind: MainStoryQuestKind;
  isChapterCloser: boolean;
  titlePlaceholderKo: string;
  titlePlaceholderEn: string;
  notes: string;
};

export type MainStoryBranchRow = {
  id: string;
  fromQuestId: string;
  toQuestId: string;
  choiceId: string;
  choiceLabelKo: string;
  choiceLabelEn: string;
  conditionKind: MainStoryBranchConditionKind;
  conditionValue: string;
  priority: number;
  enabled: boolean;
};

export type MainStoryChainStepRow = {
  parentQuestId: string;
  stepIndex: number;
  stepId: string;
  bindMissionId: string | null;
  contentStatus: MainStoryContentStatus;
  stepKind: MainStoryChainStepKind;
  titlePlaceholderKo: string;
  titlePlaceholderEn: string;
};

export type MainStoryNextResolve = {
  fromQuestId: string;
  nextQuestId: string | null;
  reason: 'default' | 'branch' | 'chapter_end' | 'campaign_end' | 'awaiting_content';
  chapterEnded: boolean;
  campaignEnded: boolean;
  usedBranchId: string | null;
};

export type MainStoryAfterMissionComplete = {
  completedQuestId: string | null;
  completedStepId: string | null;
  nextBindMissionId: string | null;
  nextQuestId: string | null;
  chapterEnded: boolean;
  campaignEnded: boolean;
  pendingChapterEndSceneId: string | null;
};
