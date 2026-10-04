/**
 * 세포 학습 루프. Node 전용.
 * [pss-pre-dev] hot_path=가상일 1회 메모리 갱신 · 사람 로그는 벽시계 10분 · 읽기 전용
 * [pss-pre-dev] alloc=대기 전투 배열을 비운 뒤 세포 상태 1개 cache=가족 키 · 선택 세포는 유지
 * [pss-pre-dev] stage=Node 트윈 risk=P6 파일 1장 · 시드 readOffset 비공유 verdict=PASS
 */
import fs from 'node:fs';
import path from 'node:path';
import { atomicWriteFile } from './learnedIo';
import { parseMemProfileLines, verbOf } from './memProfileToSessionTrace';
import { paintOf } from './world';
import type { WorldState } from './types';

export const CELL_FLUSH_MIN_MS = 10 * 60 * 1000;
const FAMILY_CAP = 32;

export type CellSource = 'human' | 'bot';

export type CellRecord = {
  id: string;
  family: string;
  place: string;
  act: string;
  stop: string;
  use: string;
  source: CellSource;
  evidence: 'seen' | 'partial';
  score: number | null;
  trials: number;
  seenAt: string;
};

export type CellState = {
  version: 1;
  updatedAt: string;
  lap: number;
  declareComplete: false;
  cells: CellRecord[];
  selected: Record<string, string>;
  lastWriteMs: number;
  lastSig: string;
};

type PendingCombat = { place: string; win: boolean };

let live: CellState = emptyCellState();
let pending: PendingCombat[] = [];
let lastHumanReadMs = 0;

export function emptyCellState(): CellState {
  return {
    version: 1,
    updatedAt: new Date(0).toISOString(),
    lap: 0,
    declareComplete: false,
    cells: [],
    selected: {},
    lastWriteMs: 0,
    lastSig: '',
  };
}

export function resetCellLoopForTest(): void {
  live = emptyCellState();
  pending = [];
  lastHumanReadMs = 0;
}

function cellId(family: string, place: string, stop: string, use: string): string {
  return `${family}|${place}|${stop}|${use}`;
}

function sigOf(state: CellState): string {
  const rows: string[] = [];
  for (let i = 0; i < state.cells.length; i += 1) {
    const c = state.cells[i];
    const score = c.score == null ? '' : c.score.toFixed(4);
    rows.push(`${c.id}#${score}#${c.trials}`);
  }
  rows.sort();
  const sel = Object.keys(state.selected).sort().map((k) => `${k}=${state.selected[k]}`);
  return `${rows.join(',')}@${sel.join(',')}`;
}

function upsert(cells: CellRecord[], next: CellRecord): CellRecord[] {
  const out = cells.slice();
  for (let i = 0; i < out.length; i += 1) {
    if (out[i].id !== next.id) continue;
    out[i] = next;
    return out;
  }
  out.push(next);
  return out;
}

function foldCombat(cells: CellRecord[], row: PendingCombat, seenAt: string): CellRecord[] {
  const id = cellId('combat', row.place, '', 'winrate');
  let prev: CellRecord | null = null;
  for (let i = 0; i < cells.length; i += 1) {
    if (cells[i].id === id) prev = cells[i];
  }
  const trials = (prev?.trials ?? 0) + 1;
  const prevSum = (prev?.score ?? 0) * (prev?.trials ?? 0);
  const score = (prevSum + (row.win ? 1 : 0)) / trials;
  return upsert(cells, {
    id,
    family: 'combat',
    place: row.place,
    act: 'combat',
    stop: '',
    use: 'winrate',
    source: 'bot',
    evidence: 'seen',
    score,
    trials,
    seenAt,
  });
}

function foldHuman(cells: CellRecord[], text: string, seenAt: string): CellRecord[] {
  const beats = parseMemProfileLines(text);
  let out = cells;
  for (let i = 0; i < beats.length; i += 1) {
    const b = beats[i];
    const verb = verbOf(b.stage, b.event, b.detail ?? '');
    if (!verb) continue;
    const family = verb === 'combat' ? 'combat' : 'travel';
    const place = b.detail ?? '';
    const id = cellId(family, place, '', 'human');
    let prev: CellRecord | null = null;
    for (let j = 0; j < out.length; j += 1) {
      if (out[j].id === id) prev = out[j];
    }
    out = upsert(out, {
      id,
      family,
      place,
      act: family,
      stop: '',
      use: 'human',
      source: 'human',
      evidence: 'partial',
      score: null,
      trials: prev?.trials ?? 0,
      seenAt,
    });
  }
  return out;
}

function selectFamilies(cells: CellRecord[], prev: Record<string, string>): Record<string, string> {
  const families = new Set<string>();
  for (let i = 0; i < cells.length; i += 1) families.add(cells[i].family);
  const selected: Record<string, string> = {};
  families.forEach((family) => {
    let best: CellRecord | null = null;
    for (let i = 0; i < cells.length; i += 1) {
      const c = cells[i];
      if (c.family !== family || c.score == null) continue;
      if (best == null || best.score == null || c.score > best.score) best = c;
      else if (c.score === best.score && prev[family] === c.id) best = c;
    }
    if (best) selected[family] = best.id;
    else if (prev[family]) selected[family] = prev[family];
  });
  return selected;
}

function evictFamily(cells: CellRecord[], selected: Record<string, string>): CellRecord[] {
  const families = new Set<string>();
  for (let i = 0; i < cells.length; i += 1) families.add(cells[i].family);
  const drop = new Set<string>();
  families.forEach((family) => {
    const group: CellRecord[] = [];
    for (let i = 0; i < cells.length; i += 1) {
      if (cells[i].family === family) group.push(cells[i]);
    }
    if (group.length <= FAMILY_CAP) return;
    const scored = group.filter((c) => c.score != null && selected[family] !== c.id);
    scored.sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
    let over = group.length - FAMILY_CAP;
    for (let i = 0; i < scored.length && over > 0; i += 1) {
      drop.add(scored[i].id);
      over -= 1;
    }
  });
  if (drop.size === 0) return cells;
  return cells.filter((c) => !drop.has(c.id));
}

export function applyCellLap(
  prev: CellState,
  input: { combats: readonly PendingCombat[]; humanText: string; now: number },
): CellState {
  const seenAt = new Date(input.now).toISOString();
  let cells = prev.cells;
  for (let i = 0; i < input.combats.length; i += 1) {
    cells = foldCombat(cells, input.combats[i], seenAt);
  }
  if (input.humanText) cells = foldHuman(cells, input.humanText, seenAt);
  const selected = selectFamilies(cells, prev.selected);
  cells = evictFamily(cells, selected);
  return {
    version: 1,
    updatedAt: seenAt,
    lap: prev.lap + 1,
    declareComplete: false,
    cells,
    selected,
    lastWriteMs: prev.lastWriteMs,
    lastSig: prev.lastSig,
  };
}

export function cellWriteDue(prev: CellState, next: CellState, now: number): boolean {
  if (next.cells.length === 0) return false;
  const sig = sigOf(next);
  if (!prev.lastSig) return true;
  if (now - prev.lastWriteMs < CELL_FLUSH_MIN_MS) return false;
  return sig !== prev.lastSig;
}

export function observeBotCombat(place: string, win: boolean): void {
  if (!place) return;
  pending.push({ place, win });
}

export function selectedCombatPlace(): string {
  const id = live.selected.combat;
  if (!id) return '';
  for (let i = 0; i < live.cells.length; i += 1) {
    if (live.cells[i].id === id) return live.cells[i].place;
  }
  return '';
}

/** 격납고·퀘스트·초반 게이트 밖에서, 합법적인 전투 장소만 옮긴다. */
export function combatRedirectPlace(world: WorldState): string | null {
  const place = selectedCombatPlace();
  if (!place || place === world.currentPlanetId) return null;
  const slot = world.planets[place];
  if (!slot?.combatEnabled) return null;
  if (slot.tcl > world.level + 8) return null;
  const paint = paintOf(slot);
  if (paint !== 'RED' && paint !== 'NEUTRAL' && !slot.contested) return null;
  return place;
}

function readOpenHumanLog(dir: string): string {
  const root = path.join(dir, 'human-raw');
  if (!fs.existsSync(root)) return '';
  const names = fs.readdirSync(root);
  let text = '';
  for (let i = 0; i < names.length; i += 1) {
    const session = path.join(root, names[i]);
    if (!fs.existsSync(path.join(session, 'capture.pid'))) continue;
    const log = path.join(session, 'session.log');
    if (!fs.existsSync(log)) continue;
    try {
      text += fs.readFileSync(log, 'utf8');
    } catch {
      /* 읽는 중 잘린 줄은 다음 바퀴 */
    }
  }
  return text;
}

function cellsPath(dir: string): string {
  return path.join(dir, 'cells-latest.json');
}

function cardPath(dir: string): string {
  return path.join(dir, 'play-card-latest.json');
}

export function loadCellLoop(dir: string): void {
  try {
    const raw = JSON.parse(fs.readFileSync(cellsPath(dir), 'utf8')) as CellState;
    if (raw && raw.version === 1 && Array.isArray(raw.cells)) {
      live = {
        ...emptyCellState(),
        ...raw,
        declareComplete: false,
        cells: raw.cells,
        selected: raw.selected ?? {},
      };
      return;
    }
  } catch {
    /* 없으면 빈 상태 */
  }
  live = emptyCellState();
}

function writeCard(dir: string, state: CellState): void {
  const lines: Array<{ family: string; cellId: string; place: string; note: string }> = [];
  const families = Object.keys(state.selected);
  for (let i = 0; i < families.length; i += 1) {
    const family = families[i];
    const id = state.selected[family];
    let place = '';
    for (let j = 0; j < state.cells.length; j += 1) {
      if (state.cells[j].id === id) place = state.cells[j].place;
    }
    lines.push({
      family,
      cellId: id,
      place,
      note: '사람 partial 은 순위에 넣지 않음. 교역 점수는 보류. 완료 선언 없음.',
    });
  }
  atomicWriteFile(cardPath(dir), `${JSON.stringify({
    version: 1,
    updatedAt: state.updatedAt,
    lap: state.lap,
    declareComplete: false,
    lines,
  }, null, 2)}\n`);
}

export function flushCellLap(dir: string, now: number): { wrote: boolean; lap: number; combatPlace: string } {
  let humanText = '';
  if (now - lastHumanReadMs >= CELL_FLUSH_MIN_MS) {
    humanText = readOpenHumanLog(dir);
    lastHumanReadMs = now;
  }
  const combats = pending;
  pending = [];
  const next = applyCellLap(live, { combats, humanText, now });
  const wrote = cellWriteDue(live, next, now);
  const sig = sigOf(next);
  if (wrote) {
    next.lastWriteMs = now;
    next.lastSig = sig;
    atomicWriteFile(cellsPath(dir), `${JSON.stringify(next, null, 2)}\n`);
    writeCard(dir, next);
  } else {
    next.lastWriteMs = live.lastWriteMs;
    next.lastSig = live.lastSig || sig;
  }
  live = next;
  const combatPlace = selectedCombatPlace();
  return { wrote, lap: live.lap, combatPlace };
}

export function cellLoopSnapshot(): CellState {
  return live;
}
