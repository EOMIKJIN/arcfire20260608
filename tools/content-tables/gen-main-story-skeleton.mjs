/**
 * 본편 메인스토리 골격 CSV 1회 생성.
 * 정본은 생성 후 tables/content/*.csv — 제목·주제는 대표님 시나리오 확정 시 CSV만 수정.
 * 기존 story_001 행은 건드리지 않는다(퀘스트 슬롯 bind만).
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const OUT = resolve(ROOT, 'tables', 'content');

const CHAPTERS = 10;
const SPINE = 30;
const BRANCH_SLOTS = 4;

function pad(n) {
  return String(n).padStart(2, '0');
}

function csvEscape(v) {
  const s = String(v ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function writeCsv(name, header, rows) {
  const lines = [header.join(',')];
  for (const row of rows) {
    lines.push(header.map((key) => csvEscape(row[key] ?? '')).join(','));
  }
  writeFileSync(resolve(OUT, name), `${lines.join('\n')}\n`, 'utf8');
}

function buildChapters() {
  const rows = [];
  for (let i = 1; i <= CHAPTERS; i += 1) {
    rows.push({
      id: `ms_ch_${pad(i)}`,
      order: i,
      titleKo: `챕터 ${i} (시나리오 대기)`,
      titleEn: `Chapter ${i} (scenario pending)`,
      themeKo: '대표님 시나리오·제목·주제 확정 후 기입',
      themeEn: 'Fill after the owner supplies the scenario title and theme',
      contentStatus: i === 1 ? 'partial' : 'skeleton',
      endStorySceneId: `story_chapter_end_${pad(i)}`,
      endStoryReady: 0,
      notes: i === 1 ? 'q01=story_001 실기. 나머지 슬롯 골격' : '본선 30+분기 4 슬롯 예약',
    });
  }
  return rows;
}

function buildQuests() {
  const rows = [];
  for (let c = 1; c <= CHAPTERS; c += 1) {
    const chapterId = `ms_ch_${pad(c)}`;
    for (let q = 1; q <= SPINE; q += 1) {
      const isFirstLive = c === 1 && q === 1;
      rows.push({
        questId: `story_c${pad(c)}_q${pad(q)}`,
        chapterId,
        questIndex: q,
        bindMissionId: isFirstLive ? 'story_001' : '',
        contentStatus: isFirstLive ? 'ready' : 'skeleton',
        questKind: 'spine',
        isChapterCloser: q === SPINE ? 1 : 0,
        titlePlaceholderKo: isFirstLive
          ? '동기가 확인되지 않는 살인사건'
          : `[골격] 챕터${c}-${pad(q)}`,
        titlePlaceholderEn: isFirstLive
          ? 'Unmotivated Murder Case'
          : `[Skeleton] C${c}-Q${pad(q)}`,
        notes: isFirstLive
          ? '기존 missions.csv story_001. 제목·보상 변경 금지'
          : q === SPINE
            ? '챕터 엔딩 시네마틱 훅(endStoryReady=0이면 재생 없음)'
            : '',
      });
    }
    for (let b = 1; b <= BRANCH_SLOTS; b += 1) {
      rows.push({
        questId: `story_c${pad(c)}_b${pad(b)}`,
        chapterId,
        questIndex: 100 + b,
        bindMissionId: '',
        contentStatus: 'skeleton',
        questKind: 'branch',
        isChapterCloser: 0,
        titlePlaceholderKo: `[분기 골격] 챕터${c}-B${pad(b)}`,
        titlePlaceholderEn: `[Branch] C${c}-B${pad(b)}`,
        notes: '본선 30과 별도. 분기 CSV enabled=1일 때만 진입',
      });
    }
  }
  return rows;
}

function buildBranches() {
  return [
    {
      id: 'br_sample_c01_flag_a',
      fromQuestId: 'story_c01_q05',
      toQuestId: 'story_c01_b01',
      choiceId: 'choice_a',
      choiceLabelKo: '샘플 분기 A (비활성)',
      choiceLabelEn: 'Sample branch A (disabled)',
      conditionKind: 'flag',
      conditionValue: 'sample_path_a',
      priority: 10,
      enabled: 0,
    },
    {
      id: 'br_sample_c01_flag_b',
      fromQuestId: 'story_c01_q05',
      toQuestId: 'story_c01_q06',
      choiceId: 'choice_b',
      choiceLabelKo: '샘플 분기 B 본선 (비활성)',
      choiceLabelEn: 'Sample branch B spine (disabled)',
      conditionKind: 'flag',
      conditionValue: 'sample_path_b',
      priority: 10,
      enabled: 0,
    },
    {
      id: 'br_sample_c01_rejoin',
      fromQuestId: 'story_c01_b01',
      toQuestId: 'story_c01_q08',
      choiceId: 'rejoin',
      choiceLabelKo: '샘플 본선 재합류 (비활성)',
      choiceLabelEn: 'Sample rejoin (disabled)',
      conditionKind: 'always',
      conditionValue: '',
      priority: 5,
      enabled: 0,
    },
  ];
}

function buildChainSteps() {
  return [
    {
      parentQuestId: 'story_c01_q01',
      stepIndex: 1,
      stepId: 'story_c01_q01_s01',
      bindMissionId: 'story_001',
      contentStatus: 'ready',
      stepKind: 'mission',
      titlePlaceholderKo: '동기가 확인되지 않는 살인사건',
      titlePlaceholderEn: 'Unmotivated Murder Case',
    },
    {
      parentQuestId: 'story_c01_q02',
      stepIndex: 1,
      stepId: 'story_c01_q02_s01',
      bindMissionId: '',
      contentStatus: 'skeleton',
      stepKind: 'mission',
      titlePlaceholderKo: '[연퀘 골격] 챕터1-02 1/3',
      titlePlaceholderEn: '[Chain] C1-Q02 1/3',
    },
    {
      parentQuestId: 'story_c01_q02',
      stepIndex: 2,
      stepId: 'story_c01_q02_s02',
      bindMissionId: '',
      contentStatus: 'skeleton',
      stepKind: 'mission',
      titlePlaceholderKo: '[연퀘 골격] 챕터1-02 2/3',
      titlePlaceholderEn: '[Chain] C1-Q02 2/3',
    },
    {
      parentQuestId: 'story_c01_q02',
      stepIndex: 3,
      stepId: 'story_c01_q02_s03',
      bindMissionId: '',
      contentStatus: 'skeleton',
      stepKind: 'mission',
      titlePlaceholderKo: '[연퀘 골격] 챕터1-02 3/3',
      titlePlaceholderEn: '[Chain] C1-Q02 3/3',
    },
  ];
}

writeCsv(
  'main_story_chapters.csv',
  [
    'id',
    'order',
    'titleKo',
    'titleEn',
    'themeKo',
    'themeEn',
    'contentStatus',
    'endStorySceneId',
    'endStoryReady',
    'notes',
  ],
  buildChapters(),
);
writeCsv(
  'main_story_quests.csv',
  [
    'questId',
    'chapterId',
    'questIndex',
    'bindMissionId',
    'contentStatus',
    'questKind',
    'isChapterCloser',
    'titlePlaceholderKo',
    'titlePlaceholderEn',
    'notes',
  ],
  buildQuests(),
);
writeCsv(
  'main_story_branches.csv',
  [
    'id',
    'fromQuestId',
    'toQuestId',
    'choiceId',
    'choiceLabelKo',
    'choiceLabelEn',
    'conditionKind',
    'conditionValue',
    'priority',
    'enabled',
  ],
  buildBranches(),
);
writeCsv(
  'main_story_chain_steps.csv',
  [
    'parentQuestId',
    'stepIndex',
    'stepId',
    'bindMissionId',
    'contentStatus',
    'stepKind',
    'titlePlaceholderKo',
    'titlePlaceholderEn',
  ],
  buildChainSteps(),
);

console.log('Wrote main_story_chapters/quests/branches/chain_steps.csv');
