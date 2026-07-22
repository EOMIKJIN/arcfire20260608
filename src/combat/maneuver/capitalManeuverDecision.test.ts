/**
 * 전함 기동 판단 계층 — 캐릭터라이제이션 테스트 (Phase 0 행동 불변 검증)
 * npx tsx src/combat/maneuver/capitalManeuverDecision.test.ts
 *
 * 기준: 추출 전 `PlanetEdenRaidTestLayer` 틱 인라인 로직(2026-07-22)과 동일해야 한다.
 */
import assert from 'node:assert/strict';
import { deriveCapitalCombatRangeBands } from '../../game/capitalWeaponRange';
import {
  applyTempoJudge,
  chaseWeightForCombatStage,
  combatMotionStageFromDist,
  createCapitalManeuverDecision,
  KITE_DIST_RESUME_ADVANCE_MS,
  KITE_DIST_STALL_HOLD_MS,
  KITE_DIST_STALL_SPEED_PX_PER_MS,
  resolveCapitalManeuverDecision,
  rpsOutcome,
  TEMPO_KITE_CHASE_WEIGHT,
  TEMPO_PRESS_CHASE_WEIGHT,
  type CapitalManeuverInput,
  type ManeuverAgentState,
  type TempoJudgeAgentState,
} from './capitalManeuverDecision';
import {
  FALLBACK_DEFAULT_TACTIC_DOCTRINE,
  getCaptainTacticDoctrine,
  resolveDoctrineForCaptain,
} from './captainTacticDoctrine';
import {
  createFormationAnchorPose,
  resolveLineFormationAnchor,
} from './capitalFormation';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

/** 레이저 162 / 미사일 240 — 표준적인 밴드 (brawlOuter=162, brawlInner=120) */
const BANDS = deriveCapitalCombatRangeBands(162, 240);
const DETECT_R = 600;

function makeState(overrides: Partial<ManeuverAgentState> = {}): ManeuverAgentState {
  return {
    tempoRole: 'press',
    kiteEvasionMode: 'standoff',
    kiteDistStallSinceMs: null,
    kiteDistResumeAdvanceUntilMs: 0,
    stallChaseBoostUntilMs: 0,
    engageStartDelayMs: 0,
    doctrine: FALLBACK_DEFAULT_TACTIC_DOCTRINE,
    ...overrides,
  };
}

function makeInput(overrides: Partial<CapitalManeuverInput> = {}): CapitalManeuverInput {
  return {
    elapsedMs: 10_000,
    pairDist: 300,
    detectRangePx: DETECT_R,
    bands: BANDS,
    speedPxPerMs: 0.02,
    teamSlot: 0,
    ...overrides,
  };
}

const out = createCapitalManeuverDecision();

test('교전 단계 FSM — 거리 경계값이 추출 전과 동일', () => {
  assert.equal(combatMotionStageFromDist(DETECT_R + 7, DETECT_R, BANDS), 'closing');
  // 미사일 최대(240)+완화(12) 초과 → closing
  assert.equal(combatMotionStageFromDist(253, DETECT_R, BANDS), 'closing');
  assert.equal(combatMotionStageFromDist(252, DETECT_R, BANDS), 'missile_pattern');
  // brawlOuter(162) 초과 → missile_pattern
  assert.equal(combatMotionStageFromDist(163, DETECT_R, BANDS), 'missile_pattern');
  // brawlInner(120)+0.5 초과 → missile_reposition
  assert.equal(combatMotionStageFromDist(161, DETECT_R, BANDS), 'missile_reposition');
  assert.equal(combatMotionStageFromDist(121, DETECT_R, BANDS), 'missile_reposition');
  assert.equal(combatMotionStageFromDist(120, DETECT_R, BANDS), 'brawl');
});

test('단계별 추격 가중 — 상수 동일(1 / 0.42 / 0.16 / 0.3)', () => {
  assert.equal(chaseWeightForCombatStage('closing'), 1);
  assert.equal(chaseWeightForCombatStage('missile_pattern'), 0.42);
  assert.equal(chaseWeightForCombatStage('missile_reposition'), 0.16);
  assert.equal(chaseWeightForCombatStage('brawl'), 0.3);
});

test('press — 추격 하한 0.9 · navStage=거리 판정 유지', () => {
  const st = makeState({ tempoRole: 'press' });
  const d = resolveCapitalManeuverDecision(st, makeInput({ pairDist: 200 }), out);
  assert.equal(d.combatStage, 'missile_pattern');
  assert.equal(d.navStage, 'missile_pattern');
  assert.equal(d.chaseWeight, TEMPO_PRESS_CHASE_WEIGHT);
  assert.equal(d.inKiteDistancing, false);
  assert.equal(d.openingReverseOnly, false);
});

test('kite — navStage 항상 missile_reposition · 추격 상한 0.24 적용 후 0.16', () => {
  const st = makeState({ tempoRole: 'kite' });
  const d = resolveCapitalManeuverDecision(st, makeInput({ pairDist: 400 }), out);
  assert.equal(d.combatStage, 'closing');
  assert.equal(d.navStage, 'missile_reposition');
  // base 0.16 ≤ kite 상한 0.24 → 0.16 유지
  assert.equal(d.chaseWeight, Math.min(0.16, TEMPO_KITE_CHASE_WEIGHT));
  assert.equal(d.inKiteDistancing, true);
});

test('교전 시작 지연 중 — 추격 상한 0.28', () => {
  const st = makeState({ tempoRole: 'press', engageStartDelayMs: 20_000 });
  const d = resolveCapitalManeuverDecision(st, makeInput({ elapsedMs: 10_000 }), out);
  assert.equal(d.engageReady, false);
  assert.equal(d.chaseWeight, 0.28);
});

test('무기 정체 부스트 — press 하한 0.88 · kite 상한 0.32 유지', () => {
  const p = makeState({ tempoRole: 'press', stallChaseBoostUntilMs: 11_000 });
  const dp = resolveCapitalManeuverDecision(p, makeInput({ pairDist: 130 }), out);
  // brawl base 0.3 → press 0.9 → 부스트 max(0.9, 0.88)=0.9
  assert.equal(dp.chaseWeight, 0.9);
  const k = makeState({ tempoRole: 'kite', stallChaseBoostUntilMs: 11_000 });
  const dk = resolveCapitalManeuverDecision(k, makeInput({ pairDist: 130 }), out);
  assert.ok(dk.chaseWeight <= 0.32);
});

test('kite standoff — openingReverseOnly · 슬롯 짝/홀 turnSign', () => {
  const st = makeState({ tempoRole: 'kite', kiteEvasionMode: 'standoff' });
  const d0 = resolveCapitalManeuverDecision(st, makeInput({ teamSlot: 0 }), out);
  assert.equal(d0.openingReverseOnly, true);
  assert.equal(d0.kiteReverseTurnSign, 1);
  const d1 = resolveCapitalManeuverDecision(st, makeInput({ teamSlot: 1 }), out);
  assert.equal(d1.kiteReverseTurnSign, -1);
});

test('kite planet_orbit — 후진 전용 아님', () => {
  const st = makeState({ tempoRole: 'kite', kiteEvasionMode: 'planet_orbit' });
  const d = resolveCapitalManeuverDecision(st, makeInput(), out);
  assert.equal(d.openingReverseOnly, false);
});

test('kite 정체 상태기계 — 저속 유지 → 회복 구간 진입 → 만료 복귀', () => {
  const st = makeState({ tempoRole: 'kite', kiteEvasionMode: 'standoff' });
  const slow = KITE_DIST_STALL_SPEED_PX_PER_MS * 0.5;
  // t=0: 저속 시작 기록
  resolveCapitalManeuverDecision(st, makeInput({ elapsedMs: 0, speedPxPerMs: slow }), out);
  assert.equal(st.kiteDistStallSinceMs, 0);
  // 유지 시간 도달 → 회복 구간 세팅
  const tHold = KITE_DIST_STALL_HOLD_MS;
  const d1 = resolveCapitalManeuverDecision(
    st,
    makeInput({ elapsedMs: tHold, speedPxPerMs: slow }),
    out,
  );
  assert.equal(st.kiteDistStallSinceMs, null);
  assert.equal(st.kiteDistResumeAdvanceUntilMs, tHold + KITE_DIST_RESUME_ADVANCE_MS);
  // 같은 틱 판정: 회복 구간 → 적 방향 전진(후진 금지 해제)
  assert.equal(d1.kiteDistResumeAdvance, true);
  assert.equal(d1.openingReverseOnly, false);
  // 회복 만료 후 → 다시 standoff 후진
  const tAfter = tHold + KITE_DIST_RESUME_ADVANCE_MS;
  const d2 = resolveCapitalManeuverDecision(
    st,
    makeInput({ elapsedMs: tAfter, speedPxPerMs: 0.02 }),
    out,
  );
  assert.equal(st.kiteDistResumeAdvanceUntilMs, 0);
  assert.equal(d2.kiteDistResumeAdvance, false);
  assert.equal(d2.openingReverseOnly, true);
});

test('press 전환 시 — kite 정체 상태 즉시 초기화', () => {
  const st = makeState({
    tempoRole: 'press',
    kiteDistStallSinceMs: 500,
    kiteDistResumeAdvanceUntilMs: 9_000,
  });
  resolveCapitalManeuverDecision(st, makeInput({ elapsedMs: 1_000 }), out);
  assert.equal(st.kiteDistStallSinceMs, null);
  assert.equal(st.kiteDistResumeAdvanceUntilMs, 0);
});

test('기세 판정 — 승자 press·패자 kite 상호 배타', () => {
  assert.equal(rpsOutcome(0, 0), 0);
  assert.equal(rpsOutcome(1, 0), 1);
  assert.equal(rpsOutcome(0, 1), -1);
  for (let i = 0; i < 20; i++) {
    const a: TempoJudgeAgentState = { id: 1, tempoRole: 'press', kiteEvasionMode: 'standoff' };
    const b: TempoJudgeAgentState = { id: 2, tempoRole: 'press', kiteEvasionMode: 'standoff' };
    applyTempoJudge(a, b);
    assert.ok(
      (a.tempoRole === 'press' && b.tempoRole === 'kite') ||
        (a.tempoRole === 'kite' && b.tempoRole === 'press'),
    );
  }
});

// ─── Phase 1~2: 독트린·진형 ────────────────────────────────────────────────

test('독트린 CSV default — 추출 전 하드코딩 상수와 100% 동일(현행 동작 보존)', () => {
  const d = getCaptainTacticDoctrine('default');
  assert.equal(d.chaseClosing, 1);
  assert.equal(d.chaseMissilePattern, 0.42);
  assert.equal(d.chaseReposition, 0.16);
  assert.equal(d.chaseBrawl, 0.3);
  assert.equal(d.pressChaseFloor, 0.9);
  assert.equal(d.kiteChaseCap, 0.24);
  assert.equal(d.preEngageChaseCap, 0.28);
  assert.equal(d.stallBoostPressFloor, 0.88);
  assert.equal(d.stallBoostKiteCap, 0.32);
  assert.equal(d.pressRingOffsetPx, 0);
  assert.equal(d.kiteRingOffsetPx, 0);
  assert.equal(d.targetPriority, 'nearest');
  assert.equal(d.formationType, 'none');
  assert.equal(d.formationCohesion, 0);
  assert.equal(d.tempoWinBiasPct, 0);
});

test('독트린 배정 — 미배정 함장·null·미존재 전술 id 전부 default 폴백', () => {
  assert.equal(resolveDoctrineForCaptain(null).tacticId, 'default');
  assert.equal(resolveDoctrineForCaptain('captain_unknown_zzz').tacticId, 'default');
  assert.equal(getCaptainTacticDoctrine('no_such_tactic').tacticId, 'default');
  assert.equal(getCaptainTacticDoctrine(undefined).tacticId, 'default');
});

test('장거리 유지형(long_range_hold) — kite 링 오프셋 +26 · 결정 출력 반영', () => {
  const doc = getCaptainTacticDoctrine('long_range_hold');
  assert.equal(doc.kiteRingOffsetPx, 26);
  const st = makeState({ tempoRole: 'kite', doctrine: doc });
  const d = resolveCapitalManeuverDecision(st, makeInput(), out);
  assert.equal(d.standoffRingOffsetPx, 26);
  // kite 추격 상한도 독트린 값(0.2) 적용
  assert.ok(d.chaseWeight <= doc.kiteChaseCap);
  const stPress = makeState({ tempoRole: 'press', doctrine: doc });
  const dp = resolveCapitalManeuverDecision(stPress, makeInput(), out);
  assert.equal(dp.standoffRingOffsetPx, doc.pressRingOffsetPx);
});

test('default 독트린 — 링 오프셋 0(현행 스탠드오프 링 그대로)', () => {
  const st = makeState({ tempoRole: 'kite' });
  const d = resolveCapitalManeuverDecision(st, makeInput(), out);
  assert.equal(d.standoffRingOffsetPx, 0);
});

test('근접 강습형(close_assault) — press 하한 0.95 반영', () => {
  const doc = getCaptainTacticDoctrine('close_assault');
  const st = makeState({ tempoRole: 'press', doctrine: doc });
  const d = resolveCapitalManeuverDecision(st, makeInput({ pairDist: 200 }), out);
  assert.equal(d.chaseWeight, 0.95);
  assert.equal(d.standoffRingOffsetPx, -14);
});

test('표적 우선순위 파싱 — skirmish_focus=focus_fire · hunter_finisher=lowest_hull', () => {
  assert.equal(getCaptainTacticDoctrine('skirmish_focus').targetPriority, 'focus_fire');
  assert.equal(getCaptainTacticDoctrine('hunter_finisher').targetPriority, 'lowest_hull');
});

test('라인 진형 앵커 — 좌/우 교차·랭크 후열·맵 클램프', () => {
  const buf = createFormationAnchorPose();
  // 리드가 +x를 보는 상태(heading 0): 수직축 = +y/-y
  const lead = { x: 200, y: 200, headingRad: 0 };
  const a1 = resolveLineFormationAnchor(buf, lead, 1, 64, 16, 400);
  // slot 1: rank 1 · side +1 → y +64, 후열 x -25.6
  assert.ok(Math.abs(a1.x - (200 - 64 * 0.4)) < 1e-9);
  assert.ok(Math.abs(a1.y - 264) < 1e-9);
  const a2 = resolveLineFormationAnchor(buf, lead, 2, 64, 16, 400);
  assert.ok(Math.abs(a2.y - 136) < 1e-9); // side -1
  const a3 = resolveLineFormationAnchor(buf, lead, 3, 64, 16, 400);
  assert.ok(Math.abs(a3.y - 328) < 1e-9); // rank 2 · side +1
  // 맵 경계 클램프
  const edgeLead = { x: 10, y: 10, headingRad: 0 };
  const ae = resolveLineFormationAnchor(buf, edgeLead, 2, 64, 16, 400);
  assert.ok(ae.x >= 16 && ae.y >= 16);
  // 진형 헤딩은 리드 헤딩 동조
  assert.equal(ae.headingRad, 0);
});

test('escort_line — 진형 파라미터 파싱(cohesion 0.35 · spacing 64)', () => {
  const doc = getCaptainTacticDoctrine('escort_line');
  assert.equal(doc.formationType, 'line');
  assert.equal(doc.formationCohesion, 0.35);
  assert.equal(doc.formationSpacingPx, 64);
});

test('기세 바이어스 — 0이면 현행 동일 · 극단 바이어스는 우세 강제 경향', () => {
  // close_assault(+8) vs long_range_hold(-8) → net +16% 확률로 a 강제 승
  const docA = getCaptainTacticDoctrine('close_assault');
  const docB = getCaptainTacticDoctrine('long_range_hold');
  let aWins = 0;
  const N = 4000;
  for (let i = 0; i < N; i++) {
    const a: TempoJudgeAgentState = {
      id: 1,
      tempoRole: 'press',
      kiteEvasionMode: 'standoff',
      doctrine: docA,
    };
    const b: TempoJudgeAgentState = {
      id: 2,
      tempoRole: 'press',
      kiteEvasionMode: 'standoff',
      doctrine: docB,
    };
    applyTempoJudge(a, b);
    if (a.tempoRole === 'press') aWins += 1;
  }
  // 기대 승률 ≈ 0.5 + 0.16/2 = 0.58 — 통계 여유 두고 52% 초과 확인
  assert.ok(aWins / N > 0.52, `aWins=${aWins}/${N}`);
});

console.log('capitalManeuverDecision + doctrine/formation — ALL PASS');
