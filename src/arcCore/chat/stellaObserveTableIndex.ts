// 스텔라 관찰 표 — 모듈 1회 파싱. 생성 데이터만 import (플레이봇도 import).
import { STELLA_OBSERVE_SITUATIONS_FROM_CSV } from '../../data/generated/csvStellaObserveSituations';
import { STELLA_OBSERVE_GATE_POLICY_FROM_CSV } from '../../data/generated/csvStellaObserveGatePolicy';
import { STELLA_OBSERVE_GATE_FALLBACK, type StellaObserveGatePolicy } from './stellaObserveGate';
import {
  STELLA_OBSERVE_DETECTORS,
  type StellaObserveChannel,
  type StellaObserveDetector,
  type StellaObserveSituationRow,
} from './stellaObserveSituations';

function num(raw: string, fallback = 0): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function asChannel(raw: string): StellaObserveChannel {
  return raw === 'ask' || raw === 'message' ? raw : 'remark';
}

let rows: StellaObserveSituationRow[] | null = null;
let policy: StellaObserveGatePolicy | null = null;

/** priority 오름차순. 감지기 이름이 표에 없으면 그 행은 버린다. */
export function listStellaObserveSituations(): readonly StellaObserveSituationRow[] {
  if (rows) return rows;
  const out: StellaObserveSituationRow[] = [];
  for (const r of STELLA_OBSERVE_SITUATIONS_FROM_CSV) {
    if (!STELLA_OBSERVE_DETECTORS.includes(r.detector as StellaObserveDetector)) continue;
    out.push({
      id: r.id,
      priority: num(r.priority, 9),
      detector: r.detector as StellaObserveDetector,
      paramA: num(r.paramA),
      paramB: num(r.paramB),
      motiveId: r.motiveId,
      channel: asChannel(r.channel),
      cooldownHours: num(r.cooldownHours),
      dutyGate: r.dutyGate === 'off_only' ? 'off_only' : 'any',
      enabled: String(r.enabled) === '1',
      lineKo: r.lineKo,
      lineEn: r.lineEn,
      anchorVerb: String(r.anchorVerb ?? ''),
    });
  }
  out.sort((a, b) => a.priority - b.priority);
  rows = out;
  return rows;
}

export function getStellaObserveGatePolicy(): StellaObserveGatePolicy {
  if (policy) return policy;
  const p: StellaObserveGatePolicy = { ...STELLA_OBSERVE_GATE_FALLBACK, motiveWeight: {} };
  for (const r of STELLA_OBSERVE_GATE_POLICY_FROM_CSV) {
    const key = String(r.key);
    if (key.startsWith('w_')) {
      p.motiveWeight[key.slice(2)] = num(r.value, 0.5);
      continue;
    }
    if (key === 'motiveWeight' || !(key in p)) continue;
    const k = key as Exclude<keyof StellaObserveGatePolicy, 'motiveWeight'>;
    p[k] = num(r.value, p[k]);
  }
  policy = p;
  return policy;
}
