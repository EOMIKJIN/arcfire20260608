# 재검수 2 — P0-A/B/C 반영분 (김클로드 · 2026-10-05 16:4x)

```text
task_id=playbot-human-equivalence-v1-20261005 (재검수 2)
kind=REVIEW (코드 변경 0)
판정=PARTIAL — P0-A/B/C·보스 게이트 코드 PASS · 실런 개선 확인 · 새 진행 정지 원인 2건 (설정·호출 인자)
대상 실런=pb-2026-10-05T0733 (하니스 16:33 재기동 · D68 시점)
self-check=client tsc 0 · 테스트 94 PASS
```

## 1. 반영 확인

| 항목 | 판정 | 근거 |
|---|---|---|
| P0-A 화력 = (선체 + 무기) × 게임 숙련 함수 | **PASS** | `liveCombat.fightOdds` · `resolveProficiencyMultiplier`(게임 `src/combat/pilotProficiency`) |
| 보스 DPS 게이트 삭제 · 적 = 게임 행성 적 명단 | **PASS** | `listPlanetWaveEnemySlots` 사용, 없을 때만 폴백 |
| P0-B 지는 퀘스트 전투 우회 | PASS(코드) | 승률 < fairLine → 수련/채굴 · 3연패 후 채굴 |
| P0-C 격납고 0에도 채굴·매도 | **PASS** | 실런 채굴 252 · 매도 112 · 잔액 394 → 2,702 |
| 실런 전투 | 개선 | 이전 7승 2,674패 → **137승 246패** · 장비 구매 24회 |
| tsc · 테스트 | PASS | 0 · 94 |

## 2. 새 진행 정지 (P0)

실런 D68 · L6 · **퀘스트 진행 D2 이후 0** (`sandbox_001` 66일 정지) · **궤도 수련 전투 0회** · 전투는 전부 이동중 조우(143승 268패).

### P0-D 승률 기준선 0.65 — 옛 주사위 모델에 맞춰 올라간 값
- `logs/learned/play-intelligence.json` `fairFightMin=0.65`, `mineCap=16`(07:30Z 기준). 김팀장 「채굴 상한 8 복귀」 이후 FQA 루프가 다시 올린 것으로 보임 — 새 모델에서 초반 패배 증거가 쏟아져 「같은 문제가 늘어남」으로 단계 상승.
- `sandbox_001` = `obj_s001_a defeat_enemy gate_scout` · `hub_orbit` · 솔라 항구(tcl5). 무장 없음 승률 약 61%(재검수 1 프로브) → **0.65 미만이라 영구 우회**. 수련(`trainOrRelocate`)도 같은 선을 써서 궤도 수련 대상 행성이 없다.
- 수정: 전투 모델이 바뀌었으므로 카드 값을 기본(수련선 0.5 · 채굴 8)으로 되돌리고, **새 모델로 증거를 다시 쌓기 전까지 FQA 자동 상승 정지**. 사람 기준: 60% 전투는 도전한다.

### P0-E 조우 확률 과다 — 게임 함수에 퀘스트 진행 인자를 안 넘김
- 봇 `transitEncounterChance`가 `resolveTransitEncounterChance(zone, combatMission, undefined, …)` — `progresses` 미전달. 게임은 퀘스트 전투 락이 `hub_orbit`이면 +0.4 보정을 끈다(`missionCombatEncounter.ts` `lock.venue !== 'transit'` → bump false).
- 결과: 궤도형 전투 퀘스트(`sandbox_001` 등)를 들고 있는 동안 안전 구역 조우가 **게임 10% → 봇 50%**, 중립 30% → 70%. 실런 이동 814홉 중 조우 411회.
- 수정: 봇 활성 퀘스트로 `MissionProgress` 형태를 만들어 넘기거나, 같은 규칙(락 venue가 transit일 때만 보정)을 그대로 적용.

## 3. P1 유지

- 명중 `0.5×(1+attackBonus%)` · 장갑 `armor/100`(상한 0.5) 근사 — 게임 경감 함수 부재로 유지(김팀장 판단 수용, 실기 전투 로그 대조로 보정 후속).

## 4. 내일 전체 체크 기준

P0-D·E 반영 → 하니스 재기동 → 실런: `sandbox_001` 클리어 · 궤도 수련 전투 발생 · 조우 비율 ≈ 구역 기본값(10/30/70%) · L7 `story_002` 진입.
