/**
 * 18:00 리포트 후 시급 선별.
 * 보고이슈(승인·FAIL·봇 정지)만 escalate. 그 외는 자체 1안 메모.
 */
import { getMission } from './catalog';
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
  if (story021 >= 44) {
    urgentGame.push('본편 021 게이트가 다시 Lv44 — 기존값 재확인 필요');
    reasons.push('G-1 본편 절벽 재발');
  }
  if (story021 === 28 && story023 === 32 && story030 === 44) {
    autoNotes.push('G-1 본편 게이트 28/32/36/40/44 유지');
  }
  autoNotes.push('트윈: 인접성계 배달·격납고 0이면 보충 (다음 하니스 로드부터)');
  autoNotes.push('학습 목표 유지: 사람 체감 + 정체/반복 해소로 지능 향상. 정책 adapt 유지.');

  const codes = input.findings.map((f) => f.code);
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
