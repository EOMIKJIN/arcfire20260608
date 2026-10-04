/**
 * 18:00 리포트 후 시급 선별.
 * 보고이슈(승인·FAIL·봇 정지)만 escalate. 그 외는 자체 1안 메모.
 */
import { getMission, listUnresolvedMissionPlaceholders } from './catalog';
import type { DailyLearningVerdict } from './dailyLearningReport';
import type { AnalyzeFinding } from './types';

export type DailyTriage = {
  escalate: boolean;
  reasons: string[];
  autoNotes: string[];
  urgentGame: string[];
  markdown: string;
};

export function buildDailyTriage(input: {
  verdict: DailyLearningVerdict;
  botAlive: boolean;
  recording: boolean;
  findings: readonly AnalyzeFinding[];
  questCleared: number;
  level: number;
  credits: number;
  policyStuck?: boolean;
  equalWeights?: boolean;
  sameNotes?: string;
  saturated?: boolean;
  twinBorder?: boolean;
  persistRecovered?: boolean;
}): DailyTriage {
  const reasons: string[] = [];
  const autoNotes: string[] = [];
  const urgentGame: string[] = [];
  const story021 = getMission('story_021')?.levelRequired ?? 0;
  const story023 = getMission('story_023')?.levelRequired ?? 0;
  const story030 = getMission('story_030')?.levelRequired ?? 0;

  if (input.verdict === 'FAIL') reasons.push('18:00 판정 FAIL');
  if (!input.botAlive) reasons.push('플레이봇 프로세스 정지');
  if (!input.recording) reasons.push('녹화 OFF');
  if (input.policyStuck || input.equalWeights) {
    reasons.push(`정책 고착 — ${input.sameNotes || '같은 메모·동일 가중'}`);
  }
  if (input.persistRecovered) reasons.push('학습파일 손상 → bak 복구됨');
  if (story021 >= 44) {
    urgentGame.push('본편 021 게이트가 다시 Lv44 — 기존값 재확인 필요');
    reasons.push('G-1 본편 절벽 재발');
  }
  if (story021 === 28 && story023 === 32 && story030 === 44) {
    autoNotes.push('G-1 본편 게이트 28/32/36/40/44 유지');
  }
  if (input.saturated) autoNotes.push('포화 구간(L캡·퀘스트 정체) — 학습 범프 제외 · 같은 세계는 유지');
  if (input.twinBorder) autoNotes.push('국경 BORDER_* 는 트윈 전용. adapt 입력에서 제외');
  autoNotes.push('플레이스홀더 HOLD는 자체 1안: 해석기 등록분 이동 · 미해석 토큰 퀘 스킵. 인게임 CSV 불변.');

  const codes = input.findings.map((f) => f.code);
  if (codes.includes('PLACEHOLDER_HOLD') || codes.includes('PLACEHOLDER_UNRESOLVED')) {
    const unresolved = listUnresolvedMissionPlaceholders();
    const tokenNote = unresolved.length
      ? unresolved.slice(0, 3).map((u) => `${u.missionId}:${u.token}`).join(', ')
      : '등록 토큰 해석됨';
    autoNotes.push(`퀘 토큰 HOLD — 자체 1안 적용 (${tokenNote})`);
  }
  if (codes.includes('QUEST_STUCK') && codes.includes('PLACEHOLDER_HOLD')) {
    autoNotes.push('QUEST_STUCK+토큰 — 미해석 퀘 스킵 후 다음 의뢰. 보고이슈 아님');
  }
  if (codes.includes('QUEST_PLATEAU') && input.questCleared > 0 && input.level + 4 < (getMission('story_021')?.levelRequired ?? 28)) {
    autoNotes.push(`퀘 정체 ${input.questCleared} · L${input.level} — 수련·게이트는 정책 바닥`);
  }
  if (input.credits < 400) {
    reasons.push(`현금 ${input.credits} — INSOLVENCY`);
  }

  const escalate = reasons.length > 0;
  const lines = [
    `# 플레이봇 18:00 시급 선별`,
    '',
    `- **escalate**: ${escalate ? 'YES · 대표님 보고' : 'NO · 자체 1안'}`,
    `- 봇 ${input.botAlive ? '가동' : '정지'} · 녹화 ${input.recording ? 'ON' : 'OFF'} · 판정 ${input.verdict}`,
    '',
    '## 보고이슈',
    ...(reasons.length ? reasons.map((r) => `- ${r}`) : ['- (없음)']),
    '',
    '## 게임 시급',
    ...(urgentGame.length ? urgentGame.map((r) => `- ${r}`) : ['- (없음)']),
    '',
    '## 자체 1안',
    ...autoNotes.map((r) => `- ${r}`),
    '',
  ];
  return { escalate, reasons, autoNotes, urgentGame, markdown: lines.join('\n') };
}
