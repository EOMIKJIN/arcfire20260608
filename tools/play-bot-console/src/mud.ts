import type { JournalEntry, WorldState } from './types';
import { countPaints, sumDevLevels } from './world';

export function formatMudLine(world: WorldState, entry: JournalEntry): string {
  const tag = entry.hold ? 'HOLD' : entry.kind;
  return `D${world.day}T${(world.tick % world.ticksPerDay).toString().padStart(2, '0')} [${tag}] ${entry.line}`;
}

export function formatHud(world: WorldState): string {
  const p = countPaints(world);
  const q = world.activeQuest
    ? `${world.activeQuest.missionId}#${world.activeQuest.objIndex + 1}`
    : '-';
  return [
    `플레이봇 ${world.persona}  run=${world.runId}`,
    `D${world.day} tick=${world.tick}  ${world.currentPlanetId}  L${world.level} exp=${world.totalExp} cr=${world.credits} vault=${world.blueVault}  격납고 ${world.hangarShips}/${world.hangarMax}`,
    `국경 B${p.blue}/R${p.red}/N${p.neutral}/I${p.independent}  전투 ${world.combatWins}W/${world.combatLosses}L  파괴 ${world.shipDestroys} 재탑승 ${world.reboards}  무역 ${world.trades}  편입 ${world.annexOk}  퀘 ${world.questCleared}  HOLD ${world.holdCount}`,
    `스킬 ${world.learnedSkills.length} SP${world.skillPoints}  장비${Math.round(world.gearScore)}  개발${sumDevLevels(world)}  수도격파 ${world.capitalDestroyed ? 'Y' : 'N'}  집중 ${world.focusPlanetId}`,
    `퀘스트 ${q}  직전=${world.lastAction}`,
  ].join('\n');
}

export function pushMudTail(lines: string[], next: string, cap: number): void {
  lines.push(next);
  if (lines.length > cap) lines.splice(0, lines.length - cap);
}
