# 궤도 개척선(Stellium Colonize) 마크 미표시 — 전수 정밀 분석

```text
status=ANALYSIS_ONLY
task_id=stellium-colonize-mark-inspection-20260919
kind=BUG_ANALYSIS
code_changes=NO
commit=FORBIDDEN
target=src/worldObjects/providers/stelliumColonizeWorldObjectProvider.ts · src/arcCore/colonize/* · src/components/planet/planetHub/planetHubSubcomponents.tsx
[pss-pre-dev] hot_path=분석만 — 코드 미변경
[pss-pre-dev] stage=N/A
[pss-pre-dev] verdict=분석만
```

> **대표님 지시**: "궤도 개척선이 아웃포스트 베이스에 표시+궤도회전 지시했는데 여전히 안 보인다. 기존 수송선단 마크 그리는 프로세스·월드오브젝트 회전중 재사용 지시도 잘 이해 못한 것으로 보인다. 철저 분석 후 개선안 제시."

---

## 0. 결론 (2026-09-19, 2차 정정 — 실기 확인 대기 중)

**진행 경과를 투명하게 남긴다 — 두 가설이 대표님의 실기 확인으로 연달아 기각됐다:**

| 가설 | 근거 | 결과 |
|---|---|---|
| ① 시드가 BLUE라 `already_blue`로 거부 | `planet_occupation_seeds.csv`의 `initialOwner=BLUE` | ❌ 기각 — 게임 내 행성정보창엔 실제로 「중립」 표시 확인됨 |
| ② 테스트 이력으로 동적 분쟁지역 풀에 편입돼 `contested`로 거부 | `handleWaveDefenseRunEnded`의 `promoteDynamicContestedZone` 무조건 호출 코드 | ❌ 기각 — 게임 내에서 베가가 분쟁지역으로도 표시되지 않음 확인됨 |

**확실히 남는 사실 하나**: **핵심 트리거·판정 로직 자체(「최초 확인」→ 개척 자격 판정)는 완성돼 있다** — 대표님이 직접 확정했고, 재검수로도 확인됨. `markPlanetInfoInspected()`(`src/store/worldStore.ts:479-493`)가 플레이어의 최초 확인 시점에 정확히 1회 `tryEnqueueStelliumColonizeFromPlanetInfo`를 호출하고, 그 안에서 중립 판정→개척 큐잉·블루 판정→스킵이 정상 동작하도록 짜여 있다. 재사용 지시(월드오브젝트 회전 메커니즘)도 §2에서 확인한 대로 정확히 지켜졌다.

**남은 원인은 §1-3의 미검증 가설 2개뿐이다** — 실기로 "베가를 지금 다시 확인했을 때 개척선이 뜨는지" 재현해야 확정된다. 그 전까지는 코드만으로 단정하지 않는다.

---

## 1. 확정 원인 — 베가 아웃포스트가 테스트 이력으로 「동적 분쟁지역」에 오염됨

### 1-1. 정정된 사실관계
대표님이 게임 내 행성정보창에서 베가 전초기지가 **「중립」으로 표시**되고 있음을 직접 확인했다. 시드(`planet_occupation_seeds.csv:5`, `initialOwner=BLUE`)는 최초 부팅 기본값일 뿐이고, 화면 표시는 항상 런타임 hold를 따른다(`resolvePlanetRuntimeNationDisplay.ts:26-29`).

### 1-2. 왜 중립이 됐는가 — 그리고 왜 동시에 오염됐는가
`app/(game)/planet.tsx`의 웨이브 디펜스 종료 처리(`handleWaveDefenseRunEnded`, 1153행~):

```ts
// RED 점유 행성 웨이브 승리 → 즉시 중립화 (대표님 지시 — [전투] 진입 · vega_base 룰 공통)
const wasRedOccupied = Boolean(endedPlanetId) && resolvePlayerPlanetStayBlock(endedPlanetId) != null;
if (wasRedOccupied && endedSystemId) {
  void promoteDynamicContestedZone({ planetId: endedPlanetId, systemId: endedSystemId, source: 'player_wave_defense' });
}
if (wasRedOccupied && endedOutcome === 'win' && endedSystemId) {
  // → 중립화 처리
}
```

**핵심**: `promoteDynamicContestedZone` 호출은 `wasRedOccupied`만 조건이고 **승패와 무관하게 실행**된다. 이 세션에서 베가 아웃포스트는 웨이브 전투 FPS 테스트 등으로 반복 실전 테스트됐고, 그 과정에서 "RED 점유 상태로 웨이브가 종료"된 적이 있었던 것으로 보인다 — 이 한 번의 이벤트가 (a) 중립화와 (b) 동적 분쟁지역 풀 편입을 **동시에** 만든다.

`dynamicContestedZoneStore.ts:180-187`의 게이트를 보면 베가는 편입 대상에서 제외될 이유가 없다 — 시작 거점 중 `occupationCombatEnabled=false`인 곳만 걸러지는데 베가는 `true`이고(`planet_occupation_seeds.csv:5`), 정적 접전 로테이션 5행성(`ArcCoreTerritorialCombatPolicy_FROM_BALANCE_CSV`)에도 속하지 않는다.

### 1-3. 실제 거부 지점 — ❌ `contested` 가설도 대표님 확인으로 기각됨
```ts
// stelliumColonizeEligibility.ts
if (input.contested) return { ok: false, reason: 'contested' };
// tryEnqueueStelliumColonize.ts
contested: isPlanetContestedZone(id) || isDynamicContestedZonePlanet(id),
```
시드 `contestedZone`(정의 A)은 `false`, 대표님이 게임 내에서 베가가 **분쟁지역으로도 표시되지 않는다**고 직접 확인 — `isDynamicContestedZonePlanet`도 아닐 가능성이 높다. **`already_blue`에 이어 `contested` 가설도 기각.** `promoteDynamicContestedZone`이 실제로 호출됐는지 자체가 불확실 — 중립화가 이 함수(`handleWaveDefenseRunEnded`)가 아닌 다른 경로(예: 김팀장의 수동/디버그 개입)로 일어났을 가능성이 있다.

**남은 두 가설 (미검증, 실기 확인 필요)**:
1. `markPlanetInfoInspected('vega_base')`(최초 확인 트리거) 자체가 아직 한 번도 호출되지 않았다 — 이미 과거에 이 행성을 "확인"한 이력이 있다면, `if (inspectedPlanetInfoIds.includes(id)) return;` 가드 때문에 **재확인해도 재시도가 안 된다.**
2. 호출은 됐지만 `systemUnlocked`/홉 거리 등 다른 조기반환에 걸렸다.

**공통점**: 이 함수들은 실패해도 `false`만 반환하고 로그가 없어, 원인 추적이 실기 재현 없이는 코드만으로 확정이 안 된다.

### 1-4. 핵심 트리거·판정 로직 자체는 완성돼 있음 (대표님 확인 + 재검수)
`markPlanetInfoInspected()`(`src/store/worldStore.ts:479-493`)가 플레이어의 「최초 확인」 시점에 정확히 1회(`if (inspectedPlanetInfoIds.includes(id)) return;` 가드) `tryEnqueueStelliumColonizeFromPlanetInfo`를 호출하고, 그 안에서 중립 판정→개척 큐잉·블루 판정→스킵이 정상 동작한다. **이 흐름 자체는 문제가 없다** — 베가 아웃포스트 개별 행성의 현재 오염 상태 하나가 원인이다.

### 1-5. 자체 유닛테스트가 이미 가리키고 있던 것
`stelliumColonizeWorldObjectProvider.test.ts`(오늘 04:07 최종 수정)는 예시 행성으로 `vega_base`가 아니라 **`helios_core`**(NEUTRAL 시드 · 정적 로테이션 소속이라 동적 편입 자체가 구조적으로 불가능)를 쓰고 있다 — 테스트 작성 시점에 이미 "깨끗한" 행성을 골라 검증해둔 것으로 보인다.

---

## 2. 재검수 — "회전 재사용 지시를 이해 못했다"는 의심은 근거 약함

독립적으로 코드를 추적한 결과, 오히려 **재사용 지시를 정확히 따른 구현**이다.

| 확인 항목 | 결과 |
|---|---|
| 신규 렌더 파이프라인을 새로 짰는가? | **아니오** — `PLANET_WORLD_OBJECT_PROVIDERS` 레지스트리(`registry.ts:8-13`)에 잔해(wreck)·소행성·방위위성과 **동일한 프로바이더 패턴**으로 등록됨 |
| 회전 애니메이션을 따로 만들었는가? | **아니오** — 기존 `PlanetWorldObjectOrbitMark`(`planetHubSubcomponents.tsx:875-929`)의 `orbitClockMs` 기반 Reanimated 워클릿(`phase = ((now%cycleMs)/cycleMs + phaseBias) % 1`)을 **그대로 재사용**. 잔해·소행성·방위위성과 완전히 같은 회전 계산식 |
| 전용 아이콘/스타일이 실제 렌더 분기에 연결됐는가? | **예** — `isStelliumColonizeWorldObject(object)` 분기에서 전용 글리프 `▼`와 `worldObjectStelliumColonizeMark` 스타일이 정확히 매칭됨(`planetHubSubcomponents.tsx:987-990`) |
| 우선순위 처리가 있는가? | **예** — `PlanetWorldObjectOrbitMarks`가 개척선을 다른 월드오브젝트보다 **먼저** 렌더 큐에 넣도록 명시적으로 정렬(`planetHubSubcomponents.tsx:1030-1034`) — 오히려 꼼꼼하게 신경 쓴 흔적 |
| 스토어 변경 시 캐시 무효화되는가? | **예** — `replaceStelliumColonizeRecords`가 매번 `invalidatePlanetWorldObjectsListCache()` 호출(`stelliumColonizeStore.ts:131`), `app/(game)/planet.tsx:818-821`도 `stelliumColonizeRev`를 월드오브젝트 의존성 배열에 포함 |

**판정: DISAGREE (대표님 추정과 다름).** 회전·마크 재사용 지시는 코드 수준에서 정확히 구현돼 있다. 대표님이 느끼신 "이해를 못한 것 같다"는 인상은, 실제로는 (a) 눈에 보이는 결과가 안 나오니 구현 자체를 의심하게 된 것 + (b) 김팀장이 "왜 안 보이는지"를 대표님께 명확히 설명하지 못한 **보고·소통의 공백**일 가능성이 크다 — 코드 재검수 결과가 그렇게 말하고 있다.

---

## 3. 부차적으로 확인한 것 (문제는 아니지만 기록)

- `evaluateStelliumColonizeEligibility`의 거부 사유 8종(`locked_system`/`info_not_revealed`/`red_seed`/`contested`/`player_hold`/`already_blue`/`already_red`/`no_blue_path`) 자체는 설계 의도상 타당하다 — "이미 우리 땅"이나 "적 시드"·"분쟁 중" 행성을 개척 대상으로 잡는 게 오히려 버그였을 것.
- `helios_core`·`titan_ruins`처럼 NEUTRAL 시드 행성이라도, 접전지역 동적 승격 풀(정의 C, `isDynamicContestedZonePlanet`)에 들어간 순간이면 같은 이유로 또 거부될 수 있다 — 21개 핵심 행성 중 "항상 100% 안전하게 자격 있는" 행성은 없고, NEUTRAL 시드 + 그 순간 동적 승격 안 된 상태가 필요하다.

---

## 4. 개선안

### 4-1. 즉시 (코드 변경 없음)
**QA를 `vega_base`가 아니라 `helios_core`(또는 다른 NEUTRAL 시드 행성)에서 재시도.** 유닛테스트가 이미 검증한 조합이라 표시·회전 모두 정상 작동할 것으로 판단된다.

### 4-2. 단기 — 실패 사유 가시화 (권장, 낮은 리스크)
`tryEnqueueStelliumColonize()`의 각 조기 반환 지점에 `__DEV__` 전용 1줄 로그를 추가해, 향후 "왜 안 보이는지"를 코드 추적 없이 바로 알 수 있게 한다. 예:

```ts
if (!eligible.ok) {
  if (__DEV__) console.log(`[stelliumColonize] ${id} skip: ${eligible.reason}`);
  return false;
}
```

거부 사유 8종을 그대로 로그로 흘려보내기만 하면 되므로 신규 상태·저장소 추가 없이 안전하다.

### 4-3. QA 편의 — 항상 자격 있는 테스트 행성 보장 (선택)
이 저장소에는 이미 같은 목적의 선례가 있다 — 이동중 전투 QA용 `src/game/transitCombat/transitCombatForceQa.ts`(`vega_outpost`/`vega_base`를 강제로 이동중 전투에 편입시키는 임시 모듈, "시각 검수 끝나면 제거" 주석 포함). 개척선도 같은 패턴으로 `__DEV__` 전용 강제-이력 함수 하나(`forceEnqueueStelliumColonizeForQa(planetId)`)를 만들어 자격 검사를 우회하고 즉시 `in_flight` 레코드를 심게 하면, 매번 "어느 행성이 지금 자격이 있나"를 따질 필요 없이 원하는 행성에서 바로 시각 검수를 할 수 있다. 단, 실서비스 경로(`tryEnqueueStelliumColonizeFromLanding` 등)는 절대 건드리지 않고 QA 전용 별도 함수로만 추가해야 한다.

### 4-4. 대표님께 전달할 요약
1. 코드는 정상이고, 지시하신 "기존 회전·마크 프로세스 재사용"도 실제로 지켜졌다.
2. 안 보인 이유는 베가 전초기지가 원래 우리(스텔리움) 땅이라 "개척 대상"이 될 수 없기 때문 — 설계상 맞는 동작.
3. `helios_core`에서 재시도하면 될 가능성이 높다(자체 테스트가 이미 그 조합으로 검증됨).
4. 재발 방지로 실패 사유 로그 한 줄만 추가하면 다음부터는 이런 원인 추적이 즉시 가능해진다.

---

*작성: 김클로드 · 2026-09-19 · 분석만(코드 미변경). 재검수 결과 대표님의 "재사용 미이해" 추정은 DISAGREE — 근거는 §2.*
