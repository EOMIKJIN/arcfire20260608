// ============================================================
// ArcCore Observation Bus — 설계 scaffold (런타임 비연동)
// ⚠️ DORMANT: 설계 v1 미완 · 일일 배치 게이트 확정 전 hot path publish 금지
// flush는 명시 호출만 — 자동 debounce persist 없음 (GC·AsyncStorage 폭주 방지)
// @see docs/ARC_CORE_SUSTAINABLE_LEARNING_MODEL_v1.md §4
// ============================================================

import { appendObservationsToLearningStore } from '../learning/arcCoreLearningStore';
import type { ArcCoreObservationEvent } from './arcCoreObservationTypes';

const MAX_BUFFER = 512;

let buffer: ArcCoreObservationEvent[] = [];
let eventSeq = 0;

function makeEventId(): string {
  eventSeq += 1;
  return `obs_${Date.now()}_${eventSeq}_${Math.random().toString(36).slice(2, 8)}`;
}

export function publishArcCoreObservation(
  event: Omit<ArcCoreObservationEvent, 'eventId' | 'wallTimeMs' | 'schemaVersion'>,
): void {
  const full: ArcCoreObservationEvent = {
    schemaVersion: 1,
    eventId: makeEventId(),
    wallTimeMs: Date.now(),
    ...event,
  };
  buffer.push(full);
  if (buffer.length > MAX_BUFFER) {
    buffer.splice(0, buffer.length - MAX_BUFFER);
  }
}

/** 버스 버퍼 → Learning Store tail append. 반환: flush 건수 (일 1회 배치 전용) */
export async function flushObservationsToLearningStore(): Promise<number> {
  if (buffer.length === 0) return 0;
  const batch = buffer.splice(0, buffer.length);
  return appendObservationsToLearningStore(batch);
}

export function getArcCoreObservationBufferSize(): number {
  return buffer.length;
}
