# 김클로드 검수 — 웨이브 failsafe 패배 처분 분리 (김팀장 구현)

```text
task_id=review-wave-failsafe-impl-20261006
kind=IMPLEMENTATION_REVIEW (코드 변경 0)
대상=waveDefenseStore.ts · useWaveDefenseController.ts · playerWaveDefeatDisposition.ts(+test) · planet.tsx(handleWaveDefenseRunEnded) · PLAYER_WAVE_DEFEAT_CRIMSON_AND_HOME_DESIGN.md
판정=PARTIAL — 구조 AGREE · 격침 경합 1건(P1) · 결과창 표기 대표님 결정 1건
self-check=client tsc 0 · disposition 5/5 · directWaveCombatPriority · hubCombatEndPresentContract 합계 14/14
```

## 1. AGREE

| 항목 | 근거 |
|---|---|
| 결과와 사유 분리 | `waveDefenseStore.ts` `endCause: 'played'|'failsafe'` 별도 필드 · `outcome`은 `'lose'` 유지 → `planet.tsx:1360` 승리 강제 변환 문제 없음 · `startRun`·INITIAL에서 `'played'` 초기화 |
| failsafe 2곳만 표시 | `useWaveDefenseController.ts:130`(10분 정체) · `:141`(45초 미마운트) `endRun('lose','failsafe')` · 진짜 패배(격침·긴급워프)는 `requestEndRun` → `:181` `endRun(outcome)` = played |
| 처분 순수 함수 | `resolvePlayerWaveDefeatDisposition` `failsafe:true` → 3값 false · 테스트 1건 추가 |
| 분쟁 루프 차단 | `territorialAttackLoss`에 `!failsafeLoss` → 패스는 완료(현상 유지), 학습에 red 기록 안 함 |
| 경로 무관 확장 | 김클로드 `crimsonWave` 변경 그대로 유지 |

## 2. P1 — 격침 직후 failsafe가 먼저 끝내면 「격침 안내만 뜨고 격침 처리 없음」

- 진짜 격침: `PlanetEdenRaidTestLayer.tsx:3279-3281` `requestEndRun('lose')` + `markCombatPlayerShipSinkPending()` → 짧은 홀드(`COMBAT_END_HOLD_MS`) 뒤 `:181` `endRun('lose')`.
- 이 홀드 동안 failsafe 타이머는 꺼지지 않는다(정체 타이머는 `active` 유지 중 계속 돌고, 미마운트 타이머는 홀드 중 sim이 내려가면 돎). 정체 9분 59초쯤 격침되면 failsafe가 먼저 `endRun('lose','failsafe')`.
- 그러면 `planet.tsx:1361` `sunk=true`인데 `failsafeLoss=true` → `notice`는 「전함 격침」 표시(`:1423`) · 실제 격침은 `!failsafeLoss`로 막힘(`:1424`) · 처분도 0 → **내구 0 기함이 그 자리에 남고 생존포드 귀환 없음**. 퀘스트 R0(격침=퀘스트 실패 최우선)도 안 탄다.
- 드문 경합이지만 결과가 어긋난다. 수정 제안(1줄씩):
  - 컨트롤러 failsafe 두 곳: `if (s.pendingOutcome) { s.endRun(s.pendingOutcome); return; }` — 이미 정해진 진짜 결과가 있으면 그 결과로(played) 끝냄.
  - 또는 `planet.tsx`: `failsafeLoss = endCause==='failsafe' && outcome==='lose' && !rawSunk`.
  - 앞의 것 권장(원인 지점에서 차단).

## 3. 대표님 결정 — 결과창 표기 (패배 vs 무승부)

- 대표님 질문(10-06): 「드로우 처리해도 되지 않나?」 — 김클로드 제안은 무승부 화면(오버레이 `'draw'` 이미 있음, 튜토리얼 습격 사용).
- 김팀장 구현: 처분만 빼고 **결과창은 「패배」**, 종료 대사도 패배 대사(`ingame_dialog_wave_defense_end`). 협의 문서 Q3은 「무승부(중립) 화면은 범위가 커서 10-07 비권장」.
- 실제 차이: 점유·귀환·격침은 둘 다 없음(같음). 다른 것은 **플레이어가 보는 문구**뿐 — 엔진 문제인데 「패배」로 보임.
- 무승부로 바꾸려면: 웨이브 결과 타입에 `'draw'` 추가 · failsafe 2곳 · `planet.tsx:1360` 변환 · 종료 대사 분기 — 소규모. 대표님 결정 대기.

## 4. 참고 (P3)

- 협의 Q2 권고 「엔진 중단으로 소모된 분쟁 턴을 학습 기록에서 구분」은 미반영 — `publishTerritorialPassLearning`에 사유 없음. 분석 단계에서 진짜 현상 유지와 섞인다. 백로그 수준.
- 플레이봇 반영은 10-07 일괄(`PB-BATCH-1007`).

## 5. 결론

구조는 맞다(결과·사유 분리, 순수 함수, 루프 차단). 격침 경합 P1을 1줄로 막고, 결과창 표기(패배/무승부)만 대표님이 정하면 완결.
