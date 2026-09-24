# 김팀장 최근 작업 — 유사 리스크 총괄 전수 검수

```text
status=REVIEWED
verdict=PASS (신규 P1 1건 · 확산 없음 확인)
date=2026-09-24
reviewer=김클로드
범위=최근 3일 수정 실소스 352개 (생성물 175개 제외)
기준=이상현상 검수에서 나온 F-1·F-2·F-5·F-6·F-13·F-14·F-15 패턴
```

---

## 0. 결론

**같은 계열 신규 P1은 1건**이고, **가장 위험했던 F-13(영구 누적)은 이상현상 단독 사례**로 확인됐다. 확산되지 않았다.

| 패턴 | 결과 |
|---|---|
| F-2 정책 CSV 미배선 | 🔴 **신규 1건** — `arcCorePlanetAttackLevelPolicy` 전체 |
| F-13 persist 영구 누적 | ✅ **이상현상 단독** — 다른 2개 인스턴스 미션은 정상 |
| F-1 하드코딩이 폴백을 가림 | ✅ 30곳 중 실제 가림은 이상현상 1건뿐 |
| F-5 dispose/clear 미호출 | ✅ 2건뿐이고 **둘 다 `*ForTest` 헬퍼** |
| persist 무제한 증가 | ✅ 최근 수정 스토어 15개 전부 정상 |
| Voronoi 회귀 | ✅ **설계대로 반영 확인** (§4) |

---

## 1. 🔴 S-1 (P1) — `arcCorePlanetAttackLevelPolicy` 전체가 미배선

이상현상 F-2와 **형태가 완전히 같다.** CSV에 의미 있는 값이 있는데 게임에 닿지 않는다.

### CSV는 5단계 난이도 배수를 정의한다

```text
attack_level, wave_interval_mul, wave_count_mul, drone_hp_mul, …, transit_encounter_mul
1            1.00               1.00            1.00               1.00   ← BASELINE
5            0.66               1.60            1.35               1.75   ← 최대 강화
```

`notesKo`: 「[BASELINE] 현재 모든 배수 1.0 (동작 변화 없음). 향후 확장 기준」

### 그런데 소비되는 곳이 없다

| export | 실소비(배럴 `index.ts` 제외) |
|---|---|
| `getArcCorePlanetAttackLevelPolicy` | `ArcCoreAttackSubCore.ts` **1건 — 결과를 버린다** |
| `resolveEffectiveInboundDronePolicy` | **0건** |
| `resolveAttackIntensityMul` | **0건** |
| `resolveAttackDailyCapMul` | **0건** |
| `resolveGeneralCombatLevelMul` | **0건** |
| `resolveTransitEncounterMul` | **0건** |

```ts
// ArcCoreAttackSubCore.ts:21 — 유일한 소비처
void getArcCorePlanetAttackLevelPolicy(ARC_ATTACK_LEVEL_BASELINE);
```

**`void`로 결과를 버린다.** 임포트를 살려 두려는 no-op 터치로 보인다. 인자도 baseline(=전 배수 1.0) 고정이다.

내부 배수 9종(`waveIntervalMul`·`waveCountMul`·`droneHpMul`·`inboundDurationMul`·`maxActiveDronesMul`·`impactIntensityMul`·`dailyEventCapMul`·`generalCombatLevelMul`·`transitEncounterMul`)은 **정책 파일 밖에 단 한 번도 등장하지 않는다**(구조분해 포함 전체 이름 검색 확인).

### 판정

**baseline만 쓰는 단계라면 기능 문제는 없다.** 다만 이상현상 F-2와 똑같이 **「CSV에 값이 있는데 안 먹는」 상태**다. 공격 레벨 2~5는 지금 올려도 **아무 일도 일어나지 않는다.**

> **권고**: 이상현상 F-2와 **같은 처리**를 한다.
> 1. 배선하거나,
> 2. CSV `notesKo`와 파일 헤더에 **「미배선 · 향후 확장」**을 명시하고, `void` 터치에 그 사유를 주석으로 남긴다.
>
> 지금은 `void` 한 줄만 보고는 왜 버리는지 알 수 없다.

---

## 2. ✅ F-13(영구 누적)은 이상현상 단독 — 확산 없음

인스턴스 미션 3종을 비교했다. **이상현상만 구멍이 나 있고, 나머지는 각자 방어가 있다.**

| 미션군 | id 규칙 | 키 공간 | 정리 |
|---|---|---|---|
| `arc_inst_*` (바 보드) | — | — | ✅ **`pruneOrphanArcInstProgresses` + `CLEARED_ARC_INST_SNAPSHOT_LIMIT = 32`** |
| `arc_cpt_*` (함장 개인) | `arc_cpt_{id}_{nn}` | **2자리 시퀀스 = 유한** | ✅ 키가 겹쳐 **덮어쓰기됨** |
| `arc_anom_*` (이상현상) | `arc_anom_{planetId}_{startedAtMs}` | **시각 = 무한** | ❌ **정리 없음** |

`missionStore.progresses`에는 상한·삭제가 아예 없다(전수 확인). `arc_inst_`만 별도 모듈로 가지치기를 한다.

> **수정 템플릿이 이미 저장소 안에 있다.** `arcCoreInstanceProgressCleanup.ts`의 `pruneOrphanArcInstProgresses` + 상한 상수를 `arc_anom_*`에 그대로 적용하면 된다. 새로 설계할 것이 없다.

---

## 3. ✅ 나머지 패턴 — 깨끗

### F-1 (하드코딩이 `??` 폴백을 가림)

`?? resolve*|roll*|pick*` 형태 **30곳**을 전수 확인했다. 대부분 **정상적인 선택적 오버라이드**(테스트 주입·상위 계산 재사용)이고, **실제로 폴백을 죽이는 것은 이상현상 `unidentifiedAnomalyStore.ts:231` 1건뿐**이다.

### F-5 (dispose/clear 미호출)

최근 수정분의 `clear|dispose|reset|release|forget|unregister` 계열 export를 전수 대조한 결과, 호출처 0건은 **2건뿐이고 둘 다 테스트 헬퍼**다(`resetStellaLifeAskPendingForTest` · `resetBootPerfForTests`). **수명 관리 규율은 양호하다.**

### persist 무제한 증가

최근 3일 수정된 AsyncStorage 스토어 **15개**를 증가/상한 대조했다. 문제 없음.

- `playerStore` — `capBoundedStringList(…, SEEN_STORY_SCENE_IDS_MAX)` 적용, `shipHangar`는 구매로만 늘어나는 정상 게임 상태
- `arcCoreChatStore`·`barPatronageStore`·`mainStoryProgressStore` — 상한 존재
- `stellaQuestTalkMemory`(신규) — **스칼라 1개 · persist 없음 · `clearStellaQuestTalkMemory` 존재** ✅

### 정책 3종 정상

`sovereignLoanIntentPolicy` · `arcCoreInboundDronePolicy` · `stelliumColonizePolicy` — export 전부 실소비된다.

> 1차 스캔에서 필드 단위로 「미소비」가 잡혔으나, **래퍼 함수로 내부 소비되는 구조**여서 오탐이었다. 래퍼 레벨로 재확인해 정상 판정했다.

---

## 4. ✅ Voronoi — 설계안대로 반영됨 (역회귀 확인)

`docs/GALAXY_VORONOI_FRONTIER_TERRITORY_FIX_DESIGN.md` 기준 재확인.

| 설계 항목 | 반영 |
|---|---|
| 원인 B — 두 빌더 클립 사각형 통일 | ✅ 양쪽 모두 `computeGalaxyVoronoiClipBounds(sites, mapBounds)` |
| 반경을 한 번만 계산해 양쪽에 동일 전달 | ✅ `:121`에서 1회 계산 → 두 빌더에 같은 값 |
| **R을 월드 좌표 기반으로** (줌 불변성) | ✅ `resolveInfluenceRadiusPxFromWorld(systems, toScreen)` |

**내가 §3-3에서 「반드시 결정할 항목」으로 남겼던 R 좌표계 문제가 올바른 쪽(월드 기반)으로 처리됐다.** 화면 픽셀로 잡았다면 줌마다 영토가 변했을 것이다.

---

## 5. 착수 권고

| 순위 | 항목 | 규모 |
|---|---|---|
| 1 | **이상현상 F-13** — `arc_anom_*` 가지치기 (템플릿 재사용) | 소규모 |
| 2 | **S-1** — 공격 레벨 정책 배선 또는 「미배선」 명시 | 주석·CSV 또는 배선 |
| 3 | 이상현상 F-1 (1줄) · F-2 notes | 소규모 |

**차단 사유 없음.** 최근 작업 전반의 수명 관리·상한 규율은 양호하며, 발견된 두 건 모두 **「값은 있는데 배선이 없다」 한 가지 형태**다.

---

**김클로드는 읽기만 했다** — 코드·CSV 변경 0 · 커밋 0.
