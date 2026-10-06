# 김클로드 컨설트 — 웨이브 failsafe 패배의 영토 처분 분리

```text
task_id=wave-failsafe-consult-20261006
kind=CONSULT (코드 변경 0 · 판정만)
대상=useWaveDefenseController.ts · waveDefenseStore.ts · planet.tsx(handleWaveDefenseRunEnded) · playerWaveDefeatDisposition.ts · territorialPlayerWavePending.ts
결론=Q1 AGREE · Q2 AGREE(단, 커서 소모 비용 1건 명시) · Q3 PARTIAL(필드는 맞으나 소비처 2곳·outcome 비오염 전제)
self-check=코드 미변경 · 읽기 전용 재검수
```

## 0. 재검수 — 문제 자체는 실재 (AGREE)

- 진짜 패배는 `PlanetEdenRaidTestLayer.tsx:3260/3279/3419`에서만 발생 — 기함 격침·긴급워프 flee → `requestEndRun('lose')` → pendingOutcome → 컨트롤러 `useWaveDefenseController.ts:181` `endRun(outcome)`.
- failsafe 패배는 **두 곳**이 `endRun('lose')`를 **직접** 호출:
  - stall: `useWaveDefenseController.ts:130` (`WAVE_DEFENSE_STALL_FAILSAFE_MS` 10분, :36 — PSS 고착 방지 가드)
  - orphan: `useWaveDefenseController.ts:141` (`WAVE_DEFENSE_COMBAT_NEVER_MOUNTED_MS` 45초, :41 — 전투 sim 미마운트 차단)
- 두 경로 모두 store엔 `outcome='lose'`만 남는다(`waveDefenseStore.ts:125`). 다운스트림에서 **진짜 패배와 구분 불가**.
- `planet.tsx:1366` `crimsonWave: Boolean(endedPlanetId)`로 바뀐 뒤, 이 failsafe 'lose'도 `resolvePlayerWaveDefeatDisposition`에서 `occupyCrimson`+`sendHome`을 켠다(`playerWaveDefeatDisposition.ts:15-16`) → **블루·중립 행성이 엔진 실패만으로 RED 전환 + 기함 모항 이동**. 10-06 검수 §2-2 리스크와 동일 진단. 과거 territorial_turn 1경로에서만 있던 문제가 4경로로 확대된 것 맞음.

→ **failsafe 'lose'의 영토 처분 분리는 필요하다.** 전제 AGREE.

## Q1. failsafe는 점유·귀환(occupyCrimson·sendHome·destroyShip)을 제외한다 — **AGREE**

- 근거: stall(:36 주석 30-34)은 "교전 sim이 ended에 도달 못해 Skia/함대 뷰가 무기한 잔류"하는 **메모리 고착 방지 가드**, orphan(:41)은 "승패 경로가 영구히 안 도는" **마운트 실패 차단**이다. 둘 다 전투 결과를 **관측한 적이 없다**.
- 엔진 실패(캔버스 45초 미마운트·10분 무진행)를 근거로 영토를 RED로 뒤집고 기함을 재배치하는 것은 버그에 실제 페널티를 매기는 것. 제외가 맞다.
- `destroyShip`은 `sendHome && sunk`(`playerWaveDefeatDisposition.ts:20`)라 `sendHome=false`면 자동 차단 — 별도 처리 불필요.

## Q2. 분쟁 패스 완료는 유지하고 red 학습 기록만 뺀다 — **AGREE** (비용 1건 명시)

- **루프 우려는 실재하며, 패스 완료가 정확한 해소책이다.** `territorial_turn`만 방문-1회 가드를 우회한다(`useWaveDefenseController.ts:104/110`). 패스를 완료 안 하면 `getTerritorialPlayerWavePending()`가 살아있어(`planet.tsx:1330-1331`) 트리거가 재발화 → orphan 45초 → `endRun('lose')` 재진입 → **45초 무한 루프**.
  - 다른 경로는 루프 안 함: `chat_armed`은 startRun에서 소모(:118), `planet_assault`은 `clearPlanetAssaultIntent()`(`planet.tsx:1276`), `endgame csv_variant`은 ranThisVisit 가드로 재발화 안 됨. **루프는 territorial_turn 전용** → 패스 완료가 정확히 그 지점을 끊는다.
- 완료 함수가 실제로 pending을 지우는 것 확인: `territorialPlayerWavePending.ts:104` `pending=null` + `markTerritorialCombatPassCompleted`(:106) 순차 커서 전진. → 루프 차단 OK.
- **red 기록 제거는 자동으로 떨어진다(별도 특수분기 불필요):** failsafe를 '진짜 lose'로 안 치면 `planet.tsx:1332` `territorialAttackLoss = territorialAttack && endedOutcome==='lose'`가 false → `passDecision='status_quo'`·`newSide`는 `'red'`가 아니라 `waveNewSide ?? 'unknown'`(`:1333/1351`). 학습 publish는 자연히 status_quo로 기록.
- **명시해야 할 비용(대표님/김팀장 판단):** 패스 완료는 `markTerritorialCombatPassCompleted`로 **순차 커서를 전진**시킨다(:106-113). 즉 엔진 실패로도 분쟁 차례 1턴이 "싸우지 않고" 소모된다. 무한 루프(배터리·PSS·UX)보다 명백히 작은 해악이고 일반 status_quo 패스와 동일 동작이라 수용 권장 — 다만 **"엔진 중단으로 소모된 턴"임을 패스 메타에 남겨 분석에서 진짜 status_quo와 구분**할 것을 권고(Q3 연계).

## Q3. endCause 필드로 충분한가 / 더 나은 구조 — **PARTIAL**

**필드 자체는 맞고 과설계 아님.** 다만 김팀장 초안대로 "disposition에서만 false"로 끝내면 두 군데서 샌다. 아래 3건 보완 전제로 AGREE.

1. **소비처는 1곳이 아니라 2곳이다.** 초안은 disposition(`planet.tsx:1364`)만 언급하나, red 학습 제거(Q2)는 `territorialAttackLoss`(`:1332`)에서 결정된다. endCause는 **disposition 호출과 territorialAttackLoss 계산 양쪽**에서 읽혀야 Q2가 실제로 성립. 한 필드로 충분하되 **읽는 자리가 둘**임을 못 박을 것.

2. **outcome 슬롯을 'failsafe'로 오염시키지 말 것 (초안의 실제 결함).** `endRun('failsafe')`로 `store.outcome='failsafe'`를 넣으면 `planet.tsx:1360` `(s.outcome ?? endedOutcome) === 'lose' ? 'lose' : 'win'`에서 **'win'으로 강제 coerce** → 엔진 실패에 **승리 결과창**이 뜨고 disposition이 outcome='win'으로 들어간다. outcome(win|lose)과 cause(played|failsafe)는 직교축이다. 권고: `endRun(outcome: 'win'|'lose', cause: 'played'|'failsafe' = 'played')` 로 **outcome은 'lose' 유지(정직한 '퇴각' 화면)** + `endCause`는 별도 필드. 결과 UI를 중립 'aborted'로 바꾸는 건 범위가 커서 10-07엔 비권장.

3. **처분은 순수 함수 안에 두어 테스트 유지.** 호출부(`:1381-1418`)에 if-가드를 흩지 말고 `resolvePlayerWaveDefeatDisposition`에 `failsafe: boolean` 입력을 추가해 true면 3값 모두 false 반환. 기존 테스트 4건(`playerWaveDefeatDisposition.test.ts`) 스타일 그대로 1~2케이스 추가 가능 — 단일 정본 유지.

- **더 나은 구조(참고, 10-07 비권장):** failsafe는 본질이 "결과 있는 종료"가 아니라 **teardown/abort**다. 장기적으론 `endRun`과 분리된 `abortRun()`(결과창·disposition·학습 전부 우회, reset만)이 더 정합적. 단 현재 teardown reset은 `planet.tsx:1419` `onResultClosed` 안에 있어, abort 경로도 Skia/함대 reclaim을 **반드시** 타게 재배선해야 함 → 변경폭 큼. 릴리즈(10-07) 기준 **endCause 직교 필드가 실용적 정답**. abortRun은 백로그로.

## 리스크 / self-check

- 코드 미변경. 읽기 전용 재검수.
- Q3-2(outcome coerce)는 초안을 문자 그대로 구현하면 승리창이 뜨는 실결함이라 **구현 전 반드시 반영** 필요.
- 구현 착수 시 CLAUDE.md 계약대로 PENDING·commit 금지. 이 문서는 판정만.
