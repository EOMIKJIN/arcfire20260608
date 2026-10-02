/**
 * 초반 3분 유저 체감 — 가상일/틱이 아니라 초 단위 비트.
 * persist는 창이 닫힌 뒤 학습 1회만. 틱마다 디스크 금지.
 */
import type { AnalyzeFinding, JournalEntry, WorldState } from './types';

export const USER_FEEL_WINDOW_SEC = 180;
export const EARLY_BEAT_CAP = 48;
export const TYPEWRITER_MS_PER_CHAR = 35;

export type EarlyFeelBeat = {
  tSec: number;
  kind: string;
  line: string;
  feelSec: number;
  spine: boolean;
};

export type EarlyFeelSample = {
  runId: string;
  at: string;
  feelSec: number;
  beatCount: number;
  spineBeats: number;
  offSpineBeats: number;
  destroyBeats: number;
  holdBeats: number;
  dialogBeats: number;
  questAccepted: number;
  questCleared: number;
  codes: string[];
  dwellByKind: Record<string, number>;
};

const ZERO_FEEL = new Set([
  'TERRITORIAL',
  'DAILY',
  'LEARN',
  'ANALYZE',
]);

function pageFeelSec(chars: number, pages: number, tapSec: number): number {
  const typeSec = (Math.max(8, chars) * TYPEWRITER_MS_PER_CHAR) / 1000;
  const per = Math.max(5.5, typeSec + 2.2 + tapSec);
  return Math.round(per * pages * 10) / 10;
}

/** 실기 L0 — intro01 3장 + 항로 + 착륙 + A0 + 스캔 + 스텔라 A1–D2. C만 본기능 2게이트. */
export function listOpeningFeelBeats(): EarlyFeelBeat[] {
  const rows: Array<{ kind: string; line: string; feelSec: number }> = [
    { kind: 'INTRO', line: 'intro01 크림슨·스텔리움·아크코어 3장', feelSec: 24 },
    { kind: 'WARP', line: '차원항로 워프·프리웜', feelSec: 8 },
    { kind: 'LAND', line: '아르카디아 첫 착륙', feelSec: 5 },
    { kind: 'DIALOG', line: 'ingame_dialog_01 A0 스텔라 스캔 지시', feelSec: 7 },
    { kind: 'SCAN', line: '첫 스캔 탭·대기', feelSec: 12 },
    { kind: 'DIALOG', line: 'ingame_dialog_scan_main_quest A1 허브 안내', feelSec: 7 },
    { kind: 'DIALOG', line: 'hub_tut_a2 A2 채굴', feelSec: 5 },
    { kind: 'MINE', line: '궤도 채굴 1사이클·광물 1', feelSec: 30 },
    { kind: 'DIALOG', line: 'hub_tut_a3 A3 광물·무역', feelSec: 5 },
    { kind: 'DIALOG', line: 'hub_tut_a4 A4 무역소 판매', feelSec: 5 },
    { kind: 'TRADE', line: '광물 판매 1회', feelSec: 5 },
    { kind: 'DIALOG', line: 'hub_tut_a5 A5 판매 확인', feelSec: 5 },
    { kind: 'DIALOG', line: 'hub_tut_b1 B1 조선소', feelSec: 5 },
    { kind: 'DIALOG', line: 'hub_tut_c1 C1 대화 안내', feelSec: 5 },
    { kind: 'TALK', line: '대화 2게이트 통신·메신저 또는 클로징', feelSec: 12 },
    { kind: 'DIALOG', line: 'hub_tut_c2 C2 바 열람', feelSec: 5 },
    { kind: 'DIALOG', line: 'hub_tut_d1 D1 정리', feelSec: 5 },
    { kind: 'DIALOG', line: 'hub_tut_d2 D2 출발', feelSec: 5 },
  ];
  let t = 0;
  const out: EarlyFeelBeat[] = [];
  for (let i = 0; i < rows.length; i += 1) {
    const r = rows[i];
    t += r.feelSec;
    out.push({
      tSec: Math.round(t * 10) / 10,
      kind: r.kind,
      line: r.line,
      feelSec: r.feelSec,
      spine: true,
    });
  }
  return out;
}

export function estimateEntryFeel(entry: JournalEntry): { feelSec: number; spine: boolean } {
  if (entry.silent || ZERO_FEEL.has(entry.kind)) return { feelSec: 0, spine: true };
  const line = entry.line;
  if (entry.kind === 'QUEST') {
    if (line.startsWith('수락 story_001')) return { feelSec: pageFeelSec(38, 3, 0.9), spine: true };
    if (line.startsWith('수락 ')) return { feelSec: 8, spine: true };
    if (line.includes('obj_story_001_b') || line.includes('obj_story_001_d') || line.includes('obj_story_001_e')) {
      return { feelSec: pageFeelSec(40, 2, 0.9), spine: true };
    }
    if (line.includes('talk_npc') || line.includes('deliver_cargo')) return { feelSec: 10, spine: true };
    if (line.includes('도착') || line.includes('인접성계') || line.includes('탐사거점')) {
      return { feelSec: 3, spine: true };
    }
    if (line.startsWith('클리어 ') || line.includes('스킵 ')) return { feelSec: 5, spine: true };
    if (line.includes('레벨게이트') || line.includes('초반 3분 서사 유지')) {
      return { feelSec: 4, spine: true };
    }
    return { feelSec: 4, spine: true };
  }
  if (entry.kind === 'LEVEL' && line.includes('클리어')) return { feelSec: 5, spine: true };
  if (entry.kind === 'LAND') {
    if (line.includes('이미 착륙') || line === '....') return { feelSec: 1, spine: false };
    return { feelSec: 16, spine: true };
  }
  if (entry.kind === 'TRAVEL') return { feelSec: 14, spine: true };
  if (entry.kind === 'COMBAT') {
    if (line.includes('수련')) return { feelSec: 28, spine: false };
    if (line.includes('퀘스트')) return { feelSec: 28, spine: true };
    return { feelSec: 28, spine: false };
  }
  if (entry.kind === 'DESTROY') return { feelSec: 16, spine: false };
  if (entry.kind === 'HOLD') return { feelSec: 5, spine: false };
  if (
    entry.kind === 'GEAR'
    || entry.kind === 'SKILL'
    || entry.kind === 'DEVELOP'
    || entry.kind === 'SAT'
  ) {
    return { feelSec: 8, spine: false };
  }
  if (entry.kind === 'TRADE') {
    if (line.includes('광물') || line.includes('판매')) return { feelSec: 8, spine: true };
    return { feelSec: 8, spine: false };
  }
  if (entry.kind === 'ANNEX' || entry.kind === 'COLONIZE' || entry.kind === 'CAPITAL') {
    return { feelSec: 10, spine: false };
  }
  return { feelSec: 3, spine: false };
}

function pushBeat(world: WorldState, beat: EarlyFeelBeat): void {
  world.earlyFeelSec = Math.round((world.earlyFeelSec + beat.feelSec) * 10) / 10;
  beat.tSec = world.earlyFeelSec;
  if (world.earlyFeelBeats.length < EARLY_BEAT_CAP) {
    world.earlyFeelBeats.push(beat);
  }
  if (world.earlyFeelSec >= USER_FEEL_WINDOW_SEC) {
    world.earlyFeelClosed = true;
  }
}

export function applyOpeningFeelIfNeeded(world: WorldState): void {
  if (world.earlyFeelOpeningApplied || world.earlyFeelClosed) return;
  world.earlyFeelOpeningApplied = true;
  const open = listOpeningFeelBeats();
  for (let i = 0; i < open.length; i += 1) {
    if (world.earlyFeelClosed) break;
    pushBeat(world, { ...open[i] });
  }
}

export function absorbEarlyFeel(world: WorldState, entry: JournalEntry): void {
  if (world.earlyFeelClosed) return;
  applyOpeningFeelIfNeeded(world);
  if (world.earlyFeelClosed) return;
  const est = estimateEntryFeel(entry);
  if (est.feelSec <= 0) return;
  pushBeat(world, {
    tSec: 0,
    kind: entry.kind,
    line: entry.line.slice(0, 80),
    feelSec: est.feelSec,
    spine: est.spine,
  });
}

function countBeats(beats: readonly EarlyFeelBeat[]): {
  spine: number;
  off: number;
  destroy: number;
  hold: number;
  dialog: number;
  dwell: Record<string, number>;
} {
  let spine = 0;
  let off = 0;
  let destroy = 0;
  let hold = 0;
  let dialog = 0;
  const dwell: Record<string, number> = {};
  for (let i = 0; i < beats.length; i += 1) {
    const b = beats[i];
    dwell[b.kind] = (dwell[b.kind] ?? 0) + b.feelSec;
    if (b.spine) spine += 1;
    else off += 1;
    if (b.kind === 'DESTROY') destroy += 1;
    if (b.kind === 'HOLD') hold += 1;
    if (b.kind === 'DIALOG' || (b.kind === 'QUEST' && (b.line.includes('talk_npc') || b.line.startsWith('수락 ')))) {
      dialog += 1;
    }
  }
  return { spine, off, destroy, hold, dialog, dwell };
}

export function analyzeEarlyFeel(world: WorldState): AnalyzeFinding[] {
  const c = countBeats(world.earlyFeelBeats);
  const out: AnalyzeFinding[] = [];
  if (c.off >= 2) {
    out.push({
      severity: 'risk',
      code: 'EARLY_OFF_SPINE',
      detail: `초반 ${USER_FEEL_WINDOW_SEC}초 창에서 스파인 밖 ${c.off}비트 (장비·개발·수련 끼어들기)`,
    });
  }
  if (c.destroy >= 1) {
    out.push({
      severity: 'risk',
      code: 'EARLY_HANGAR_WIPE',
      detail: `초반 3분에 전함 파괴 ${c.destroy}회 — 이탈 위험`,
    });
  }
  if (c.hold >= 1) {
    out.push({
      severity: 'risk',
      code: 'EARLY_DEAD_AIR',
      detail: `초반 3분 HOLD ${c.hold}회 · ${world.lastHoldReason || 'dead_air'}`,
    });
  }
  if (world.earlyFeelClosed && c.spine < 4) {
    out.push({
      severity: 'warn',
      code: 'EARLY_DENSITY_THIN',
      detail: `초반 스파인 비트 ${c.spine} — 대사·도착 밀도가 얇음`,
    });
  }
  if (world.earlyFeelClosed && world.questAccepted === 0) {
    out.push({
      severity: 'risk',
      code: 'EARLY_QUEST_GAP',
      detail: '초반 3분에 본편 수락이 없음',
    });
  }
  const hasGuide = world.earlyFeelBeats.some((b) => b.line.includes('hub_tut_') || b.line.includes('A2'));
  if (hasGuide) {
    out.push({
      severity: 'info',
      code: 'EARLY_L0_GUIDE_OK',
      detail: '스텔라 A2–D2 가이드가 초반 창에 포함됨. C는 본기능 2게이트',
    });
  } else {
    out.push({
      severity: 'risk',
      code: 'EARLY_L0_GUIDE_GAP',
      detail: 'A2–D2 스텔라 인게임 가이드가 초반 창에 없음',
    });
  }
  if (!out.some((f) => f.severity === 'risk' || f.severity === 'warn')) {
    out.unshift({
      severity: 'info',
      code: 'EARLY_SPINE_OK',
      detail: `초반 ${world.earlyFeelSec}초 · 스파인 ${c.spine} · 대사 ${c.dialog}`,
    });
  }
  return out;
}

export function summarizeEarlyFeel(world: WorldState): EarlyFeelSample {
  const c = countBeats(world.earlyFeelBeats);
  const findings = analyzeEarlyFeel(world);
  return {
    runId: world.runId,
    at: new Date().toISOString(),
    feelSec: world.earlyFeelSec,
    beatCount: world.earlyFeelBeats.length,
    spineBeats: c.spine,
    offSpineBeats: c.off,
    destroyBeats: c.destroy,
    holdBeats: c.hold,
    dialogBeats: c.dialog,
    questAccepted: world.questAccepted,
    questCleared: world.questCleared,
    codes: findings.map((f) => f.code),
    dwellByKind: c.dwell,
  };
}

export function emptyEarlyFeelWorldPatch(): Pick<
  WorldState,
  | 'earlyFeelSec'
  | 'earlyFeelClosed'
  | 'earlyFeelOpeningApplied'
  | 'earlyFeelReported'
  | 'earlyFeelBeats'
> {
  return {
    earlyFeelSec: 0,
    earlyFeelClosed: false,
    earlyFeelOpeningApplied: false,
    earlyFeelReported: false,
    earlyFeelBeats: [],
  };
}
