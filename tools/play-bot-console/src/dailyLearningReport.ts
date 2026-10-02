import type { LearningState } from './learn';
import type { PolicyFile } from './policy';
import type { AnalyzeFinding, KpiSnapshot } from './types';

export type DailyKpiLite = Pick<
  KpiSnapshot,
  | 'day'
  | 'level'
  | 'totalExp'
  | 'credits'
  | 'questCleared'
  | 'holdCount'
  | 'combatWins'
  | 'combatLosses'
  | 'skills'
  | 'gearScore'
  | 'devSum'
  | 'capitalDestroyed'
  | 'annexOk'
  | 'blue'
  | 'red'
>;

export type DailySnapshot = {
  at: string;
  runId: string;
  persona: string;
  generation: number;
  kpi: DailyKpiLite;
  codeCounts: Record<string, number>;
};

export type PlaybotStatusLite = {
  recording?: boolean;
  updatedAt?: string;
  runId?: string;
  persona?: string;
  planet?: string;
  lastHold?: string;
  quest?: { missionId?: string; objIndex?: number; title?: string } | null;
  kpi?: Partial<KpiSnapshot> | null;
  lastAnalyze?: { findings?: AnalyzeFinding[] } | null;
};

export type DailyLearningVerdict = 'OK' | 'WARN' | 'FAIL';

export type DailyLearningReport = {
  verdict: DailyLearningVerdict;
  markdown: string;
  chatBrief: string;
  snapshot: DailySnapshot;
  dateKey: string;
};

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function delta(cur: number, prev: number | undefined): string {
  if (prev == null) return `${cur}`;
  const d = cur - prev;
  const sign = d > 0 ? '+' : '';
  return `${cur} (${sign}${d})`;
}

function topCodes(counts: Record<string, number>, cap: number): string[] {
  const keys = Object.keys(counts);
  keys.sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0));
  const out: string[] = [];
  for (let i = 0; i < keys.length && out.length < cap; i += 1) {
    out.push(`${keys[i]} ${counts[keys[i]]}`);
  }
  return out;
}

function lastGrowthWindow(state: LearningState, n: number): LearningState['growth'] {
  if (state.growth.length <= n) return state.growth;
  return state.growth.slice(state.growth.length - n);
}

function kpiFromStatus(status: PlaybotStatusLite | null, learning: LearningState): DailyKpiLite {
  const k = status?.kpi ?? {};
  const last = learning.growth[learning.growth.length - 1];
  return {
    day: num(k.day, last?.day ?? 0),
    level: num(k.level, last?.level ?? 0),
    totalExp: num(k.totalExp, last?.totalExp ?? 0),
    credits: num(k.credits, last?.credits ?? 0),
    questCleared: num(k.questCleared, last?.questCleared ?? 0),
    holdCount: num(k.holdCount, last?.holdCount ?? 0),
    combatWins: num(k.combatWins, last?.combatWins ?? 0),
    combatLosses: num(k.combatLosses, last?.combatLosses ?? 0),
    skills: num(k.skills, last?.skills ?? 0),
    gearScore: num(k.gearScore, last?.gearScore ?? 0),
    devSum: num(k.devSum, last?.devSum ?? 0),
    capitalDestroyed: num(k.capitalDestroyed, last?.capitalDestroyed ?? 0),
    annexOk: num(k.annexOk, last?.annexOk ?? 0),
    blue: num(k.blue, 0),
    red: num(k.red, 0),
  };
}

function decideVerdict(input: {
  hasLearning: boolean;
  botAlive: boolean;
  findings: AnalyzeFinding[];
  dQuest: number;
  dLevel: number;
  staleHours: number;
  policyStuck?: boolean;
}): DailyLearningVerdict {
  if (!input.hasLearning && !input.botAlive) return 'FAIL';
  if (input.staleHours >= 8 && !input.botAlive) return 'FAIL';
  if (input.policyStuck) return 'WARN';
  const risk = input.findings.some((f) => f.severity === 'risk');
  const plateau = input.findings.some((f) => f.code === 'QUEST_PLATEAU' || f.code === 'QUEST_STUCK');
  if (risk || (plateau && input.dQuest <= 0 && input.dLevel <= 0)) return 'WARN';
  if (input.dQuest > 0 || input.dLevel > 0) return 'OK';
  if (input.botAlive) return 'WARN';
  return 'OK';
}

export function buildDailyLearningReport(input: {
  status: PlaybotStatusLite | null;
  learning: LearningState;
  policy: PolicyFile | null;
  prev: DailySnapshot | null;
  botAlive: boolean;
  nowIso: string;
  dateKey: string;
  humanSeedLine?: string;
}): DailyLearningReport {
  const kpi = kpiFromStatus(input.status, input.learning);
  const prevK = input.prev?.kpi;
  const dQuest = kpi.questCleared - (prevK?.questCleared ?? kpi.questCleared);
  const dLevel = kpi.level - (prevK?.level ?? kpi.level);
  const findings = input.status?.lastAnalyze?.findings ?? [];
  const staleHours = (() => {
    const raw = input.status?.updatedAt ?? input.learning.updatedAt;
    const t = Date.parse(raw ?? '');
    if (!Number.isFinite(t)) return 99;
    return (Date.parse(input.nowIso) - t) / 3_600_000;
  })();
  const window = lastGrowthWindow(input.learning, 16);
  const first = window[0];
  const last = window[window.length - 1];
  const policyStuck = input.policy?.health?.stuck === true || input.policy?.health?.equalWeights === true;
  const verdict = decideVerdict({
    hasLearning: input.learning.growth.length > 0 || input.learning.runs.length > 0,
    botAlive: input.botAlive,
    findings,
    dQuest: prevK ? dQuest : (last && first ? last.questCleared - first.questCleared : 0),
    dLevel: prevK ? dLevel : (last && first ? last.level - first.level : 0),
    staleHours,
    policyStuck,
  });

  const snapshot: DailySnapshot = {
    at: input.nowIso,
    runId: input.status?.runId ?? input.prev?.runId ?? '',
    persona: input.status?.persona ?? Object.keys(input.policy?.personas ?? {})[0] ?? 'mixed_ref',
    generation: input.policy?.generation ?? 0,
    kpi,
    codeCounts: { ...input.learning.codeCounts },
  };

  const quest = input.status?.quest;
  const rec = verdict === 'FAIL'
    ? '학습 데이터·콘솔 상태를 확인하고 `npm run playbot:ensure-daily-18` 후 콘솔 재기동'
    : verdict === 'WARN'
      ? '퀘스트 정체·HOLD·전투열세를 ANALYZE 코드 기준으로 다음날 정책 바닥값 유지'
      : '1일 학습 추이 정상 — 18:00 스케줄 유지';

  const wallDelta = prevK
    ? [
        `| 가상일 | ${delta(kpi.day, prevK.day)} |`,
        `| 레벨 | ${delta(kpi.level, prevK.level)} |`,
        `| 경험치 | ${delta(kpi.totalExp, prevK.totalExp)} |`,
        `| 퀘스트 | ${delta(kpi.questCleared, prevK.questCleared)} |`,
        `| 스킬 | ${delta(kpi.skills, prevK.skills)} |`,
        `| 장비 | ${delta(kpi.gearScore, prevK.gearScore)} |`,
        `| 개발합 | ${delta(kpi.devSum, prevK.devSum)} |`,
        `| 편입 | ${delta(kpi.annexOk, prevK.annexOk)} |`,
        `| 수도격파 | ${delta(kpi.capitalDestroyed, prevK.capitalDestroyed)} |`,
        `| HOLD | ${delta(kpi.holdCount, prevK.holdCount)} |`,
        `| 전투 | ${kpi.combatWins}W/${kpi.combatLosses}L |`,
        `| 국경 | B${kpi.blue}/R${kpi.red} |`,
      ]
    : [
        `| 가상일 | D${kpi.day} (전일 스냅샷 없음 · 첫 18:00) |`,
        `| 레벨 | ${kpi.level} |`,
        `| 퀘스트 | ${kpi.questCleared} |`,
        `| 스킬/장비/개발 | ${kpi.skills} / ${kpi.gearScore} / ${kpi.devSum} |`,
      ];

  const vDay = first && last
    ? `가상 최근 16샘플 D${first.day}→D${last.day} · 퀘 ${first.questCleared}→${last.questCleared} · L${first.level}→${last.level} · exp ${first.totalExp}→${last.totalExp}`
    : '가상 일별 성장 샘플 없음';

  const codes = findings.map((f) => `\`${f.severity}\` ${f.code} — ${f.detail}`);
  const policyNotes = (input.policy?.lastNotes ?? []).slice(0, 4);
  const top = topCodes(input.learning.codeCounts, 6);

  const markdown = [
    `# 플레이봇 1일 학습 데일리  ${input.dateKey} 18:00 KST`,
    '',
    `- **판정**: **${verdict}**`,
    `- 런 ${input.status?.runId ?? '-'} · 페르소나 ${input.status?.persona ?? '-'} · 녹화 ${input.status?.recording ? 'ON' : 'OFF'} · 봇 ${input.botAlive ? '가동' : '정지'}`,
    `- 행성 ${input.status?.planet ?? '-'} · 퀘스트 ${quest?.missionId ?? '-'}#${(quest?.objIndex ?? 0) + 1} · HOLD ${input.status?.lastHold || '-'}`,
    `- 정책 generation ${input.policy?.generation ?? 0} · 적응주기 ${input.policy?.adaptEveryDays ?? '-'}일 · 고착 ${policyStuck ? 'YES' : 'NO'}`,
    `- ${input.humanSeedLine ?? '대표님 시드 없음'}`,
    '',
    '## 벽시계 1일 델타 (직전 18:00 스냅샷 대비)',
    '',
    '| 항목 | 값 |',
    '|------|-----|',
    ...wallDelta,
    '',
    '## 가상일 학습 창 (최근 16샘플 ≈ 가상 1일)',
    '',
    vDay,
    '',
    '## 초반 3분 유저체감',
    '',
    (() => {
      const e = input.learning.earlyFeels[input.learning.earlyFeels.length - 1];
      if (!e) return '초반 3분 샘플 없음 — 신규 런 첫 창 닫힘 후 기록';
      return `런 ${e.runId} · ${e.feelSec}초 · 스파인 ${e.spineBeats}/${e.beatCount} · 이탈비트 ${e.offSpineBeats} · 파괴 ${e.destroyBeats} · 대사 ${e.dialogBeats} · ${e.codes.join(', ')}`;
    })(),
    '',
    '## ANALYZE',
    '',
    ...(codes.length ? codes.map((c) => `- ${c}`) : ['- (없음)']),
    '',
    '## 정책 메모',
    '',
    ...(policyNotes.length ? policyNotes.map((n) => `- ${n}`) : ['- (없음)']),
    '',
    '## 창 학습 코드 (최근 90가상일)',
    '',
    top.length ? top.join(' · ') : '(없음)',
    '',
    '## 권장 1안',
    '',
    rec,
    '',
  ].join('\n');

  const chatBrief = [
    `# [18:00] 플레이봇 1일 학습 데일리`,
    '',
    `**시각 (KST)**: ${input.dateKey} 18:00`,
    `**판정**: **${verdict}**`,
    '',
    '| 항목 | 값 |',
    '|------|-----|',
    `| 런 | ${input.status?.runId ?? '-'} |`,
    `| 녹화/봇 | ${input.status?.recording ? 'ON' : 'OFF'} / ${input.botAlive ? '가동' : '정지'} |`,
    `| 레벨·퀘 | L${kpi.level} · 퀘 ${prevK ? delta(kpi.questCleared, prevK.questCleared) : kpi.questCleared} |`,
    `| 스킬·장비·개발 | ${kpi.skills} / ${kpi.gearScore} / ${kpi.devSum} |`,
    `| ANALYZE | ${findings.map((f) => f.code).join(', ') || '-'} |`,
    `| 상세 | \`tools/play-bot-console/logs/DAILY_18_PLAYBOT_LEARNING_LATEST.md\` |`,
    '',
    '## 권장 (김팀장 1안)',
    rec,
    '',
    '---',
    '**P0**: 이 보고를 **사용자 Cursor 대화창에 즉시 게시**할 것. 파일만 갱신하고 채팅 생략 **금지**.',
    '',
  ].join('\n');

  return { verdict, markdown, chatBrief, snapshot, dateKey: input.dateKey };
}
