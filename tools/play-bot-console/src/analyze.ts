import type { AnalyzeFinding, AnalyzeReport, JournalEntry, WorldState } from './types';
import {
  CRIMSON_CAPITAL_SYSTEM_ID,
  hopsBetween,
  listSkills,
  listUnresolvedMissionPlaceholders,
} from './catalog';
import { snapshotKpi, sumDevLevels } from './world';
import { analyzeEarlyFeel } from './earlyFeel';

export function analyzeDay(
  world: WorldState,
  dayJournal: readonly JournalEntry[],
): AnalyzeReport {
  const findings: AnalyzeFinding[] = [];
  const kpi = snapshotKpi(world);

  if (world.credits < 400) {
    findings.push({
      severity: 'risk',
      code: 'INSOLVENCY',
      detail: `크레딧 ${world.credits} — 매입·위성 설치가 막힘`,
    });
  }
  if (world.blueVault < 8000 && world.annexOk === 0) {
    findings.push({
      severity: 'warn',
      code: 'VAULT_THIN',
      detail: `블루 금고 ${world.blueVault} — 편입 1회분 미달`,
    });
  }
  if (world.lastHoldStreak >= 4) {
    findings.push({
      severity: 'risk',
      code: 'REPEATED_HOLD',
      detail: `연속 HOLD ${world.lastHoldStreak} · ${world.lastHoldReason}`,
    });
  }
  if (
    world.lastHoldReason === 'no_dest_system'
    || world.lastHoldReason === 'unresolved_placeholder'
    || world.lastHoldReason === 'no_discovery'
  ) {
    findings.push({
      severity: 'risk',
      code: 'PLACEHOLDER_HOLD',
      detail: world.lastHoldReason,
    });
  }
  const unresolvedTokens = listUnresolvedMissionPlaceholders();
  if (unresolvedTokens.length > 0) {
    const shown = unresolvedTokens.slice(0, 4).map((u) => `${u.missionId}:${u.token}`);
    findings.push({
      severity: 'warn',
      code: 'PLACEHOLDER_UNRESOLVED',
      detail: `${unresolvedTokens.length}개 미해석 토큰 · ${shown.join(', ')}`,
    });
  }
  if (kpi.red >= 12) {
    findings.push({
      severity: 'warn',
      code: 'BORDER_RED_SLOPE',
      detail: `코어 RED ${kpi.red}/21 — 크림슨 전선 우세`,
    });
  }
  if (kpi.blue <= 5 && world.day >= 3) {
    findings.push({
      severity: 'warn',
      code: 'BORDER_BLUE_THIN',
      detail: `코어 BLUE ${kpi.blue}/21 — 스텔리움 후방 얇음`,
    });
  }
  if (world.activeQuest && world.day - world.activeQuest.acceptedDay >= 3 && world.stuckTicks >= 6) {
    findings.push({
      severity: 'risk',
      code: 'QUEST_STUCK',
      detail: `${world.activeQuest.missionId} ${world.day - world.activeQuest.acceptedDay}일 미클리어`,
    });
  }
  if (world.combatLosses > world.combatWins + 4 && world.combatWins + world.combatLosses >= 6) {
    findings.push({
      severity: 'warn',
      code: 'COMBAT_UNDERLEVEL',
      detail: `전투 ${world.combatWins}W/${world.combatLosses}L · Lv${world.level}`,
    });
  }
  if (world.questCleared === 0 && world.day >= 2) {
    findings.push({
      severity: 'info',
      code: 'QUEST_SLOW',
      detail: '본편 클리어 0 — 이동/레벨 게이트 가능',
    });
  }

  const holds = dayJournal.filter((e) => e.hold).length;
  if (holds >= 8) {
    findings.push({
      severity: 'warn',
      code: 'DAY_HOLD_SPIKE',
      detail: `당일 HOLD ${holds}건`,
    });
  }

  if (world.skillPoints >= 2) {
    findings.push({
      severity: 'warn',
      code: 'SKILL_BACKLOG',
      detail: `스킬포인트 ${world.skillPoints} · 습득 ${world.learnedSkills.length}/${listSkills().length}`,
    });
  }
  if (world.day >= 4 && kpi.devSum === 0) {
    findings.push({
      severity: 'warn',
      code: 'DEV_STALE',
      detail: `집중성계 ${world.focusPlanetId} 개발합 0`,
    });
  }
  if (world.day >= 6 && !world.capitalDestroyed) {
    const hops = hopsBetween(world.currentSystemId, CRIMSON_CAPITAL_SYSTEM_ID);
    findings.push({
      severity: hops >= 5 ? 'warn' : 'info',
      code: 'CAPITAL_APPROACH',
      detail: `크림슨 수도 core_prime까지 ${hops}홉 · 격파 ${world.capitalDestroyed ? '완료' : '미완'}`,
    });
  }
  if (world.activeQuest && world.lastHoldReason === 'trade_broke') {
    findings.push({
      severity: 'risk',
      code: 'QUEST_BUY',
      detail: `${world.activeQuest.missionId} 매입 HOLD trade_broke`,
    });
  }
  if (world.day >= 3 && kpi.gearScore < 80 && kpi.credits >= 2000) {
    findings.push({
      severity: 'info',
      code: 'GEAR_STALE',
      detail: `장비점수 ${kpi.gearScore} · 크레딧 ${kpi.credits}`,
    });
  }

  if (world.earlyFeelClosed && !world.earlyFeelReported) {
    const early = analyzeEarlyFeel(world);
    for (let i = 0; i < early.length; i += 1) findings.push(early[i]);
    world.earlyFeelReported = true;
  }

  if (findings.length === 0) {
    findings.push({
      severity: 'info',
      code: 'STABLE',
      detail: `Lv${kpi.level} B${kpi.blue}/R${kpi.red} 퀘${kpi.questCleared} 편입${kpi.annexOk}`,
    });
  }

  return { day: world.day, findings, kpi };
}

export function formatAnalyzeMarkdown(reports: readonly AnalyzeReport[], world: WorldState): string {
  const lines: string[] = [
    `# 플레이봇 ANALYZE  ${world.persona}  ${world.runId}`,
    '',
    `- 일수 D${world.day} · 틱 ${world.tick} · 레벨 ${world.level} · exp ${world.totalExp}`,
    `- 크레딧 ${world.credits} · 금고 ${world.blueVault}`,
    `- 전투 ${world.combatWins}W/${world.combatLosses}L · 무역 ${world.trades} · 편입 ${world.annexOk} · 개척 ${world.colonizeOk} · 퀘 ${world.questCleared}`,
    `- 스킬 ${world.learnedSkills.length} SP${world.skillPoints} · 장비 ${Math.round(world.gearScore)} · 개발합 ${sumDevLevels(world)} · 수도격파 ${world.capitalDestroyed ? 'Y' : 'N'}`,
    '',
  ];
  for (const r of reports) {
    lines.push(`## D${r.day}`);
    lines.push(
      `- KPI L${r.kpi.level} B${r.kpi.blue}/R${r.kpi.red}/N${r.kpi.neutral} cr=${r.kpi.credits} vault=${r.kpi.blueVault} hold=${r.kpi.holdCount}`,
    );
    for (const f of r.findings) {
      lines.push(`- **${f.severity}** \`${f.code}\` ${f.detail}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

/** 3단계 — 기울기·파산·반복 HOLD 강화. */
export function analyzeStronger(
  world: WorldState,
  history: readonly AnalyzeReport[],
): AnalyzeFinding[] {
  const extra: AnalyzeFinding[] = [];
  if (history.length >= 3) {
    const a = history[history.length - 3].kpi;
    const b = history[history.length - 1].kpi;
    if (b.red - a.red >= 3) {
      extra.push({
        severity: 'risk',
        code: 'BORDER_RED_ACCEL',
        detail: `3일간 RED ${a.red}→${b.red}`,
      });
    }
    if (b.credits < a.credits - 2500) {
      extra.push({
        severity: 'warn',
        code: 'CREDIT_DRAIN',
        detail: `3일간 크레딧 ${a.credits}→${b.credits}`,
      });
    }
    if (b.questCleared === a.questCleared && world.day >= 4) {
      extra.push({
        severity: 'risk',
        code: 'QUEST_PLATEAU',
        detail: `3일간 퀘스트 클리어 정체 ${a.questCleared}`,
      });
    }
  }
  const insolventDays = history.filter((h) => h.findings.some((f) => f.code === 'INSOLVENCY')).length;
  if (insolventDays >= 2) {
    extra.push({
      severity: 'risk',
      code: 'INSOLVENCY_STREAK',
      detail: `파산 경고 ${insolventDays}일`,
    });
  }
  const holdDays = history.filter((h) => h.findings.some((f) => f.code === 'REPEATED_HOLD')).length;
  if (holdDays >= 2) {
    extra.push({
      severity: 'risk',
      code: 'HOLD_PATTERN',
      detail: `반복 HOLD 패턴 ${holdDays}일 · ${world.lastHoldReason}`,
    });
  }
  return extra;
}
