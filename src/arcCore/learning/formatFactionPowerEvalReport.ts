// ============================================================
// 전력 평가 리포트 — CLI/로그 텍스트
// ============================================================

import type { FactionPowerCompareReport, FactionPowerSnapshot } from './factionPowerTypes';

function n(v: number): string {
  return Math.round(v).toLocaleString('en-US');
}

function vaultText(credits: number | null, note: string): string {
  if (credits == null) return `n/a · ${note}`;
  return `${n(credits)} CR · ${note}`;
}

export function formatFactionPowerEvalReport(input: {
  snapshot: FactionPowerSnapshot;
  compare: FactionPowerCompareReport;
}): string {
  const { snapshot, compare } = input;
  const blue = snapshot.war.BLUE;
  const red = snapshot.war.RED;
  const lines: string[] = [
    `팩션 전력 평가 (${snapshot.source} · core=${snapshot.corePlanetCount})`,
    '',
    '[점유 오버레이 BLUE / RED]',
    `  블루  행성 ${blue.planetCount} · PGP ${n(blue.pgpBmu)} · 점유함대 ${n(blue.occupiedFleetPower)} · 교리함대 ${n(blue.doctrineFleetPower)} · 전투함장 ${blue.combatCaptainCount} · 총독 ${blue.governorCount}(전술합 ${blue.governorTacticsGradeSum})`,
    `        금고 ${vaultText(blue.vaultCredits, blue.vaultLabelKo)}`,
    `  레드  행성 ${red.planetCount} · PGP ${n(red.pgpBmu)} · 점유함대 ${n(red.occupiedFleetPower)} · 교리함대 ${n(red.doctrineFleetPower)} · 전투함장 ${red.combatCaptainCount} · 총독 ${red.governorCount}(전술합 ${red.governorTacticsGradeSum})`,
    `        금고 ${vaultText(red.vaultCredits, red.vaultLabelKo)}`,
    `  우위  행성=${compare.warLeaderByPlanets} · PGP=${compare.warLeaderByPgp} · 함대=${compare.warLeaderByFleet} · 금고=${compare.warLeaderByVault}`,
    '',
    '[4대 항로 국가]',
  ];
  for (const code of ['F1', 'F2', 'F3', 'F4'] as const) {
    const q = snapshot.quad[code];
    lines.push(
      `  ${code} ${q.displayNameKo}(${q.route}) 행성 ${q.planetCount} · PGP ${n(q.pgpBmu)} · 점유 B/R/N/I ${q.holdMix.blue}/${q.holdMix.red}/${q.holdMix.neutral}/${q.holdMix.independent} · 전투함장 ${q.combatCaptainCount}`,
      `      금고 ${vaultText(q.vaultCredits, q.vaultNoteKo)}`,
    );
  }
  lines.push(
    `  우위  PGP=${compare.quadLeaderByPgp} · 행성=${compare.quadLeaderByPlanets}`,
    '',
    `[최근 ${Math.round(compare.windowMs / 3600000)}h 분쟁] 관측 ${compare.outcomeCount} · 블루획득 ${compare.blueCaptures} · 레드획득 ${compare.redCaptures} · 중립화 ${compare.neutralizations} · 현상유지 ${compare.statusQuo} · NPC ${compare.npcAutoCount} · 플레이어웨이브 ${compare.playerWaveCount}`,
  );
  if (compare.divergences.length === 0) {
    lines.push('  괴리 없음');
  } else {
    for (const d of compare.divergences) {
      lines.push(`  괴리 ${d.id}: ${d.summaryKo}`);
    }
  }
  return lines.join('\n');
}
