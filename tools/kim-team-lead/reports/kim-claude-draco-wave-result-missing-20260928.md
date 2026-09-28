# 드라코 성운 전투 — 적 전멸 직후 결과창 미표시 · **원인 확정**

```text
status=PENDING
task_id=draco-wave-result-missing-20260928
kind=CODE_AUDIT (김클로드 코드 변경 0 · 커밋 0)
date=2026-09-28
증상(대표님)=드라코 성운 일반 전투 · 적함 파괴 순간 그냥 행성 허브 · 결과창 없음 · 화면 전환 없음
verdict=**원인 확정** — 허브 «비-웨이브» 교전에는 결과창 표시 경로가 «처음부터 없다» (버그 아님 · 기능 부재)
```

---

## 0. 결론 — 타이밍 버그가 아니라 «경로 부재»다

**드라코 성운 일반 전투은 웨이브 디펜스가 아니다.** 허브 **비-웨이브 교전**(`mainStageCombatEnabled` 행성)이고, **이 경로에는 전투 결과창도 종료 대사도 애초에 연결돼 있지 않다.**

대표님이 「화면 전환 없이 그냥 허브」라고 하신 것이 결정적 단서였다 — 전환이 없었다는 건 **아무 종료 연출도 «시도되지 않았다»**는 뜻이다.

---

## 1. 경로 확정 (3단계 근거)

**① 드라코 = `mainStageCombatEnabled` 행성**
`src/combat/dracoCombatTestVenue.ts:1-7` — 테스트 베뉴는 **비활성**(`DRACO_COMBAT_TEST_VENUE_ENABLED = false`).
> 전투는 play_scenario CSV (`targetCombatLevel=9` · **`mainStageCombatEnabled`** · `draco_boss`) 정본.

`DRACO_COMBAT_TEST_PLANET_ID = 'draco_haven'` · `SYSTEM_ID = 'draco_nebula'`

**② `mainStageCombatEnabled` 은 웨이브가 아닌 별도 경로**
`src/game/waveDefense/useWaveDefenseController.ts:10-11` 주석이 명시한다:
> 허브 **비-웨이브 교전**(`PlanetEdenRaidTestLayer`, **`mainStageCombatEnabled` 행성**)은 자동 리스폰 재교전 없이 동일 쿨다운 스토어를 공유 — `planet.tsx` 의 `enemyFleetEntered` 가 진입 시점에 동일하게 게이트한다.

`app/(game)/planet.tsx:716-724` — `enemyFleetEntered` 가 `resolveMainStageCombatEnabled(planet.id)` 로 켜지고 → `usePlanetHubBattleReady` → `capitalCombatOrbitActive` 로 교전이 뜬다. **`useWaveDefenseStore` 와 무관하다.**

**③ 결과창은 «웨이브 종료»에만 붙어 있다**
`useWaveDefenseController.ts:186-194` — `onRunEnded` 는 **`phase === 'ended'`** 일 때만 발화.
`planet.tsx:1183` `handleWaveDefenseRunEnded` → `presentWaveEndResult` → `presentWaveResultOverlay`.
→ **웨이브 런이 시작되지 않았으면 이 경로는 한 줄도 실행되지 않는다.**

---

## 2. 🔴 비-웨이브 승리 핸들러 전문 — 결과 표시가 «없다»

`src/components/planet/PlanetEdenRaidTestLayer.tsx:3252-3296` 이 비-웨이브 교전의 유일한 승리 처리다.

```js
if (winnerTeam === 'blue' && hadPlayerCombat && isFinalWaveOrNonWave) {
  markWaveCombatVictoryCooldown(combatPlanetId);        // 재교전 쿨다운
  applyDefeatEnemyMissionObjectives({ venue: 'hub_orbit', ... });  // 미션 목표 반영
  if (!wdForReveal.active) {
    tryPresentPendingMissionClearDialog();              // «미션 클리어가 대기 중일 때만»
  }
}
maybeTriggerArcCoreShadowRevealOnCombatVictory(...);     // 본진 격파 시 섀도우 공개
```

그 위로는 `applyPostCombatDurabilityWear` · `recordMatchSummary` 뿐이다.

**없는 것**:
- ❌ `presentWaveResultOverlay` — **전투 결과창**
- ❌ `presentIngameDialogScene('ingame_dialog_wave_defense_end')` — **종료 대사**
- ❌ 크레딧·경험치 보상 카드

→ 일반 교전(퀘스트 미션 클리어가 걸려 있지 않은 경우)에서는 **승리해도 화면에 아무 변화가 없다.** 증상과 정확히 일치한다.

> 퀘스트 전투였다면 `tryPresentPendingMissionClearDialog()` 로 대사가 떴을 수 있다. 대표님이 겪은 「일반 전투」는 그 조건이 아니었다.

---

## 3. ⚠️ 김클로드 자기 정정 — 앞선 A·B·C 는 이번 원인이 «아니다»

같은 리포트 이전 판에서 A(1.5초 타이머 취소) · B(`pendingRuns` 누수) · C(abort 시 `onDismiss` 미호출)를 원인 후보로 올렸다. **셋 다 이번 증상의 원인이 아니다** — 그 코드들은 **웨이브 경로**에 있고, 이번 전투는 그 경로를 타지 않는다.

**다만 A·B·C 는 코드 결함으로는 여전히 유효하다**(웨이브 전투에서 재현 가능). 별건으로 남긴다:

| ID | 내용 | 위치 |
|---|---|---|
| A | `dispose` 가 타이머만 끄고 `pendingRuns` 를 실행하지 않음 → 웨이브 결과창 유실 | `ingameDialogFeatureLink.ts:56` |
| B | 같은 `dispose` 가 `pendingRuns` 를 비우지도 않음 → 묵은 결과창이 나중에 표시 | 〃 |
| C | `abortAllOnLeave` 가 `onDismiss` 미호출 → 1번 분기 폴백 없음 | `ingameDialogStore.ts:288` · `planet.tsx:1317` |

---

## 4. 판단이 필요한 지점 — «기능 부재»인가 «설계»인가

비-웨이브 허브 교전에 결과창이 없는 것이 **의도**일 수도 있다:
- 허브 교전은 리스폰형 상시 교전에 가깝고, 매 격파마다 40초 결과창이 뜨면 방해가 된다
- 실제로 `markWaveCombatVictoryCooldown` 으로 **재교전 쿨다운**만 걸고 조용히 끝내는 설계로 읽힌다

**그러나 대표님이 이상하게 느끼셨다는 것 자체가 UX 신호다.** 전투를 이겼는데 아무 피드백이 없으면 「버그로 끝난 것」처럼 보인다.

### 선택지

| 안 | 내용 | 비용 |
|---|---|---|
| **A** | 비-웨이브 승리에 **경량 피드백**(토스트/배너 1~2초: 「교전 종료 · 승리」) | 낮음. 결과창 40초 부담 없음 |
| **B** | 웨이브와 동일한 `presentWaveResultOverlay` 연결 | 중간. 반복 교전 시 피로 |
| C | 현행 유지 + 「의도된 동작」을 문서화 | 최저. 재질문 반복 위험 |

**김클로드 권고 = A.** 승패 피드백은 주되 흐름을 끊지 않는다. `recordMatchSummary` 가 이미 승패를 알고 있어 값은 그 자리에 있다.

---

## 5. 조치 제안

| 순위 | 조치 | 근거 |
|---|---|---|
| **1** | **대표님 결정 필요** — §4 A/B/C 중 선택. 「일반 허브 교전 승리 시 무엇을 보여줄 것인가」 | 설계 판단이라 김클로드가 정할 수 없다 |
| 2 | 선택 후 `PlanetEdenRaidTestLayer.tsx:3275` 블록에 피드백 1줄 추가 | 승패·행성 id 가 그 자리에 이미 있다 |
| 3 | 별건 A·B·C 수정(웨이브 경로 결함) | §3 — 이번 증상과 무관하나 실재 |
| 4 | 허브 교전 종료에 진단 로그 1줄 | 릴리즈에서 `ReactNativeJS` **0건**이라 추적 불가 상태 |

---

## 6. 한계

- **정적 분석이다.** 다만 이번 건은 「경로가 아예 없다」는 **부재의 확인**이라, 타이밍 추정보다 확실하다. 반증하려면 비-웨이브 승리에서 결과창을 띄우는 코드를 찾으면 되는데, `presentWaveResultOverlay` 호출처는 `planet.tsx:1268` **웨이브 경로 1곳뿐**이다.
- 드라코가 **웨이브 트리거로도** 발화하는 조건(분쟁 차례·`draco_boss` 엔드게임)이 따로 있다. 그 경우엔 결과창이 정상이어야 하며, 그때 안 뜨면 §3 A·B·C 를 봐야 한다.
- 실기 로그 확인: `adb logcat` 에서 `ReactNativeJS` **0건**(릴리즈 스트립).

---

**김클로드는 읽고 실기 로그만 확인했다** — 코드 변경 0 · 커밋 0.
