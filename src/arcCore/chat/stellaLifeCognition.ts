import { listStellaLifeCognitionBands, type StellaLifeCognitionBandRow } from './stellaLifeTableIndex';
import { STELLA_LIFE_EMA_ALPHA } from './stellaLifeSnapshot';
import type { StellaLifeCognition, StellaLifeCognitionDay, StellaLifeSnapshot } from './stellaLifeTypes';
import { stellaLifeDayKey } from './stellaLifeClock';

export type StellaLifeCognitionObserveInput = {
  operatorTurn: boolean;
  humanFirst: boolean;
  usedLifeLine: boolean;
  h5Pref: boolean;
  topicFollow: boolean;
  correction: boolean;
};

function clamp100(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

const STELLA_LIFE_COGNITION_SESSION_CAP = 8;

function bumpSession(n: number): number {
  return Math.min(STELLA_LIFE_COGNITION_SESSION_CAP, n + 1);
}

function emaClamped(prev: number, sample: number): number {
  const next = prev * (1 - STELLA_LIFE_EMA_ALPHA) + sample * STELLA_LIFE_EMA_ALPHA;
  const delta = Math.max(-8, Math.min(8, next - prev));
  return clamp100(prev + delta);
}

const CORRECTION_RE = /그게\s*아냐|아니야|틀렸|잘못/;

export function isStellaLifeCorrectionText(userText: string): boolean {
  return CORRECTION_RE.test(userText.trim());
}

export function observeStellaLifeCognition(
  life: StellaLifeSnapshot,
  input: StellaLifeCognitionObserveInput,
): StellaLifeSnapshot {
  if (!input.operatorTurn) return life;
  const sess = { ...life.cognitionSession };
  if (input.h5Pref) sess.h5 = bumpSession(sess.h5);
  if (input.topicFollow) sess.topic = bumpSession(sess.topic);
  if (input.humanFirst && !input.usedLifeLine) sess.casual = bumpSession(sess.casual);
  if (input.humanFirst && input.usedLifeLine) sess.dump = bumpSession(sess.dump);
  if (input.correction) sess.corr = bumpSession(sess.corr);
  return { ...life, cognitionSession: sess };
}

export function ingestStellaLifeCognition(life: StellaLifeSnapshot, nowMs: number): StellaLifeSnapshot {
  const day = stellaLifeDayKey(nowMs);
  if (life.cognition.lastIngestDay === day) return life;
  const s = life.cognitionSession;
  const sampleRecall = s.h5 > 0 ? 70 : s.dump > 0 ? 30 : 50;
  const sampleAsk = s.topic > 0 ? 70 : s.dump > 0 ? 35 : 50;
  const sampleGround = s.dump > 0 ? 30 : s.casual > 0 ? 70 : 50;
  const sampleCasual = s.casual > 0 ? 75 : s.dump > 0 ? 25 : 50;
  const evRow: StellaLifeCognitionDay = {
    d: day,
    h5: s.h5,
    topic: s.topic,
    casual: s.casual,
    dump: s.dump,
    corr: s.corr,
  };
  const ev = [...life.cognition.ev, evRow].slice(-8);
  const cognition: StellaLifeCognition = {
    recall: emaClamped(life.cognition.recall, sampleRecall),
    askDepth: emaClamped(life.cognition.askDepth, sampleAsk),
    grounding: emaClamped(life.cognition.grounding, sampleGround),
    casualFirst: emaClamped(life.cognition.casualFirst, sampleCasual),
    lastIngestDay: day,
    ev,
  };
  return {
    ...life,
    cognition,
    cognitionSession: { h5: 0, topic: 0, casual: 0, dump: 0, corr: 0 },
  };
}

export function resolveStellaLifeCognitionBand(
  axis: StellaLifeCognitionBandRow['axis'],
  value: number,
): StellaLifeCognitionBandRow | null {
  const rows = listStellaLifeCognitionBands();
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i]!;
    if (row.axis !== axis) continue;
    if (value >= row.lo && value <= row.hi) return row;
  }
  return null;
}

export function stellaLifePackAnchorBudget(life: StellaLifeSnapshot, humanFirst: boolean): number {
  if (humanFirst) return 0;
  const casual = resolveStellaLifeCognitionBand('casualFirst', life.cognition.casualFirst);
  if (casual?.forceHumanFirst) return 0;
  const recall = resolveStellaLifeCognitionBand('recall', life.cognition.recall);
  const ground = resolveStellaLifeCognitionBand('grounding', life.cognition.grounding);
  const recallN = recall?.packAnchors ?? 1;
  const groundN = ground?.packAnchors ?? 1;
  return Math.min(recallN, groundN);
}

export function stellaLifeAllowsLead(life: StellaLifeSnapshot): boolean {
  const casual = resolveStellaLifeCognitionBand('casualFirst', life.cognition.casualFirst);
  if (casual?.forceHumanFirst) return false;
  const ask = resolveStellaLifeCognitionBand('askDepth', life.cognition.askDepth);
  const recall = resolveStellaLifeCognitionBand('recall', life.cognition.recall);
  return Boolean(ask?.allowLead || recall?.allowLead);
}

export function stellaLifeAllowsLifeLine(life: StellaLifeSnapshot, humanFirst: boolean): boolean {
  if (humanFirst) return false;
  const casual = resolveStellaLifeCognitionBand('casualFirst', life.cognition.casualFirst);
  if (casual?.forceHumanFirst) return false;
  const band = resolveStellaLifeCognitionBand('recall', life.cognition.recall);
  return band?.allowLifeLine !== false;
}
