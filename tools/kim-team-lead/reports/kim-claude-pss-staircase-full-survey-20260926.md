# PSS 계단식 누적 — 코드 전수조사 + 실측 재분석

```text
status=PENDING
task_id=pss-staircase-full-survey-20260926
kind=INVESTIGATION (김클로드 코드 변경 0 · 커밋 0)
verdict=계단 «실존 확인» (42/64 세션 · median +271MB · 비가역)
       + 정적 감사가 «전부 PASS» 이므로 감사 커버리지 공백이 본질
       + 판정 도구(run-retention-audit) 결함 4건 발견
date=2026-09-26
```

```text
[pss-pre-dev] hot_path=조사 전용(런타임 경로 미변경) alloc=0 cache=미변경
[pss-pre-dev] stage=미변경 risk=P2(PSS축)·P3(캐시)·P7(감사 공백)
[pss-pre-dev] verdict=PASS — 코드 diff 없음. 조치는 별건 착수 지시 후.
```

---

## 0. 결론 3줄

1. **계단은 실존한다.** 장시간 세션 64개 중 **42개**가 post-warm PSS floor가 **비가역**으로 상승(median **+271MB**, max **+511MB**). 최신 09-17 세션도 **+358MB · 잔류율 100%**.
2. **축은 native_heap이 주범(74%)**, 그리고 **Views가 정확히 «스테이지 트리 1개분»(+264) 잔류**한다. GL은 29%로 부차적.
3. **정적 감사는 전부 PASS다.** 즉 원인 코드는 «금지 패턴 위반»이 아니라 **감사가 모델링하지 않는 축**에 있다. 감사에 «세션 시간축 floor» 개념이 아예 없다.

> ⚠️ 본 조사에서 **김클로드 자신의 1차 판독을 2회 정정**했다(§5). 정정 근거도 같이 남긴다.

---

## 1. 정적 감사 — 전부 PASS (그래서 문제)

| 감사 | 결과 |
|---|---|
| `audit:memory:all` | **PASS 37/37** |
| skia-worklet (chained) | **PASS 31/31** |
| `audit:worklet-contract` | **PASS** |
| `audit:native-reclaim` | **PASS 20/20** |
| `audit:resident-set` | **PASS 7/7** |
| `audit:hot-path` | **PASS (hits=0)** |

**PASS 37/37과 +271MB 계단이 동시에 성립한다.** 현행 감사는 전부 «패턴·시점» 검사이고, **「세션이 길어질수록 floor가 오르는가」를 보는 감사가 하나도 없다.** 이것이 이 문제가 여태 안 잡힌 구조적 이유다.

---

## 2. 실측 재분석 — 계단 실존 확인

`tools/long-run-monitor/logs/mem-timeline.csv` **21,939행 / 유효 17,543행**을 직접 재계산했다.
세션 분리 기준 = **pid 변경 OR 20분 이상 공백** (→ 788 세션, 45분 이상 64개).
판정 = post-warm(앞 25% 제외) 구간 **10분 롤링 윈도 국소 floor**의 `최소→최대→마지막`.

| 판정 | 세션 수 | 의미 |
|---|---|---|
| **STAIRCASE (비가역)** | **42 / 64** | 마지막 floor가 최대치의 **70% 이상** 유지 = 회수 안 됨 |
| SAWTOOTH (회복) | 21 / 64 | 올랐다가 최소 수준으로 되돌아옴 |
| FLAT (span<40MB) | 1 / 64 | 정상 |

대표 사례 (floorMin → floorMax → floorLast):

| pid | 시각 | 지속 | floor 궤적 | 잔류율 |
|---|---|---|---|---|
| 28324 | 09-05 14:19 | 902m | 669 → **1179** → **1179** | **100%** |
| 14983 | 07-27 12:06 | 1064m | 544 → **1056** → **1056** | **100%** |
| 14912 | **09-17** 12:52 | 892m | 703 → **1061** → **1061** | **100%** |
| 29392 | 07-30 00:01 | 2038m | 404 → 934 → 883 | 90% |
| 23962 | 06-26 09:03 | 304m | 559 → 1120 → 1024 | 83% |

**floor가 1,000MB를 넘겨 머문다.** 06-21~09-25 전 구간에 걸쳐 재현되며 최근 데이터에도 남아 있다.

---

## 3. 🔴 축별 분해 — 어디가 올리는가

STAIRCASE 42세션의 `마지막 floor − 최소 floor`:

| 축 | median | mean | max | PSS 대비 |
|---|---|---|---|---|
| `pss_mb` | **+270.7** | +258.0 | +511.4 | 100% |
| **`native_heap_mb`** | **+199.4** | +171.8 | +413.8 | **74%** ← 주범 |
| `gl_mb` | +79.7 | +65.8 | +141.0 | 29% |
| `graphics_mb` | +78.3 | +70.6 | +141.0 | 29% |
| `java_heap_mb` | +14.4 | +17.5 | +67.4 | 5% |
| **`views`** | **+264.0** | +264.6 | +601.0 | — |
| `egl_mb` | 0.0 | +4.7 | +20.9 | 0% |

### 핵심 — Views가 «스테이지 트리 1개분» 통째로 남는다

Views 값 분포가 **명확한 plateau 3단**으로 갈린다:

| plateau | 샘플 수 | 해석 |
|---|---|---|
| **~99–100** | 610 | 루트 셸만 |
| **~281–310** | 약 6,400 | 셸 + **스테이지 1개** |
| ~373–375 | 498 | 셸 + 1스테이지 + 잔여 |
| **~572–577** | 276 | 셸 + **스테이지 2개** |

- 한 스테이지 트리 ≈ **285 views**. 계단의 `views +264`는 **트리 1개분과 일치**한다.
- **~575 plateau는 프로젝트 자체 기준으로 `VIEWS_RETAINED FAIL`(≥450)** 이고, **수백 샘플이 그 자리에 머문다** — 순간 피크가 아니라 정착 상태다.
- 뷰 트리가 남으면 그 트리가 참조하는 **Fresco 비트맵·GL 텍스처가 함께 붙잡힌다.** native +199 / gl +80이 views +264에 **동승**하는 형태이며, native가 74%인 것도 이 구조로 설명된다.

**→ 1순위 가설: 스테이지 뷰 트리 1개가 세션 내내 해제되지 않는다.**

---

## 4. 코드 전수조사 — 「여기는 아니다」 확정 목록

계단 원인으로 **배제**된 축. 각각 근거를 코드로 확인했다.

| # | 축 | 확인 내용 | 판정 |
|---|---|---|---|
| C-1 | **네비게이션** | 앱 전체에서 `router.push`는 **단 1곳** — [planet.tsx:575](app/(game)/planet.tsx#L575) 시설 이동. **스테이지 전환은 전부 `replace()`** (index·character-select·nickname·intro·continue-warp·combat·planet·worldmap 23곳 전수). 시설 복귀는 [useSafeRouterBack.ts:24](src/navigation/useSafeRouterBack.ts#L24) `router.back()` = pop. 고아 `replace`·`dismissAll` **없음** | **정상** |
| C-2 | **영속 배열** | 영속 스토어 15개 전수 — 상한 없는 append는 [worldStore.ts:571](src/store/worldStore.ts#L571) `unlockedSystemIds` **1건뿐**이고 성계 수(~100)로 자연 상한 | **정상** |
| C-3 | **모듈 Skia 캐시** | `_mfCache`·`_burstPaints`·`skColorCache`·`_teamFlameTintCache` 모두 dispose 경로 존재 — [planetSkiaHitFxContract.ts:116](src/components/planet/planetSkiaHitFxContract.ts#L116) + [PlanetEdenRaidOrbitSkiaCombat.tsx:677](src/components/planet/PlanetEdenRaidOrbitSkiaCombat.tsx#L677) `registerCombatSkiaPresentationReclaim` 로 **실제 배선됨** | **정상** |
| C-4 | **planetMemoCache** | 네임스페이스·행성·전체 3단 invalidate + `compactPlanetMemoRegistryShells` — reclaim 경로 **8곳**에서 호출 | **정상** |
| C-5 | **에셋 디코드 예산** | 초상 **296장 전부 240×240**(0.22MB/장, 합 65MB) · 비초상 137장 중 1024×1024가 21장(4MB/장, 84MB). 전량 캐시 시 **약 182MB** — 유한하고 Fresco trim 인프라가 광범위하게 존재 | **유한 · 정상** |
| C-6 | **고빈도 할당** | `audit:hot-path` **hits=0** | **정상** |

**C-1~C-6이 모두 정상이므로, 원인은 「금지 패턴 위반」이 아니다.** 규칙을 지킨 코드가 만들어내는 잔류이며, 그래서 패턴 감사로는 영원히 안 잡힌다.

---

## 5. ⚠️ 김클로드 자기 정정 2건

조사 중 제 1차 판독이 **두 번 틀렸다.** 근거와 함께 남긴다.

**정정 1 — 「pid 교차 비교 때문」은 틀렸다.**
처음에 FAIL baseline(PSS 463.6/views 13)이 이전 pid 22698의 값이라고 판단했다. 실데이터 확인 결과 **pid 31917 자신의 19:50:56 샘플**이었다 — 기동 **48초** 시점. 교차 pid가 아니라 **콜드스타트를 baseline으로 잡은 것**이었다.

**정정 2 — 「계단 없음」은 틀렸다.**
pid로만 묶어 8개 세션을 본 1차 계산에서 「Q2~Q4 평탄 → 계단 없음」이라고 판단했다. 그런데 **pid 재사용이 광범위**(pid 6366이 **1,520시간** 스팬, 15개 pid에서 재사용 확인)해서 서로 다른 세션이 한 덩어리로 뭉쳐 있었다. **pid + 20분 공백**으로 다시 분리하니 **42/64가 계단**으로 드러났다. 제가 근거로 인용한 「pid 20488 43.9h 평탄」도 실은 별개 세션 2개였다.

> 교훈: **이 로그는 pid만으로 세션을 가를 수 없다.** 아래 §6 D-4와 같은 결함이다.

---

## 6. 🔴 판정 도구 결함 4건 — 신호를 가려온 원인

`tools/memory-profiler/run-retention-audit.cjs`. 현행 리포트의 **`Verdict: FAIL` / `retention failures: 20`은 그대로 신뢰할 수 없다.**

| # | 결함 | 근거 | 영향 |
|---|---|---|---|
| **D-1** | **pid를 판정에 안 쓴다** | [run-retention-audit.cjs:156-172](tools/memory-profiler/run-retention-audit.cjs#L156-L172) — `before`/`after`를 **시간창만으로** 필터. `mergeSamples`가 `pid`를 싣고도([:91](tools/memory-profiler/run-retention-audit.cjs#L91)) 미사용 | 창 안에서 프로세스가 재시작하면 판정이 무의미. 실제로 **기동 48초 콜드 프로세스가 baseline**이 됐다 |
| **D-2** | **중복 계상** | `RETENTION_FAIL` 20건 = 서로 다른 측정 **2쌍**(463.6→669.9 **×18**, 669.9→753.6 **×2**) | 심각도가 **10배 과장**. 같은 창의 route_blur 마커마다 같은 측정을 재보고 |
| **D-3** | **staleness 무제한** | `baseline = before[before.length-1]`을 신선도 검사 없이 채택 | 20:17 close의 baseline이 **10.4분 전** 샘플 |
| **D-4** | **pid 재사용 미구분** | pid 6366 스팬 **1,520h**, pid 3031 **1,389h** 등 15건 | pid로 세션을 가르면 서로 다른 세션이 합쳐진다(§5 정정 2의 원인) |

**추가 구조 공백 D-5**: 감사 6종 어디에도 **「세션 경과시간 대비 floor 추세」** 판정이 없다. §2 계산은 김클로드가 이번에 임시 스크립트로 한 것이고 **저장소에 상설 감사가 없다.**

---

## 7. 권고 (우선순위)

착수는 **대표님·김팀장 지시 후.** 김클로드는 코드 변경 0.

| 순위 | 조치 | 이유 |
|---|---|---|
| **P0** | **잔류 뷰 트리 1개를 실기에서 특정** — route별 `views` 라벨 트레이스 + `~575 plateau` 진입/이탈 시점의 `dumpsys meminfo` detail. 「어느 스테이지가 남는가」는 **정적으로 더 좁힐 수 없다** | views +264 = 트리 1개분. 이걸 잡으면 native +199·gl +80이 **동반 회수**될 가능성이 높다 |
| **P1** | **`run-retention-audit.cjs` D-1~D-4 수정** — 세션 키를 `pid + 20분 공백`으로, baseline staleness 상한(예 3분), 동일 측정쌍 dedupe | 지금 리포트는 심각도 10배 과장 + 콜드스타트 오판. **고치기 전엔 이 도구로 판단하면 안 된다** |
| **P2** | **세션 floor 추세 감사 신설**(`audit:memory:session-floor`) — §2 방식(10분 롤링 floor · 잔류율)을 상설화 | PASS 37/37과 +271MB 계단이 공존하는 공백을 닫는다. 재발 방지의 본체 |
| P3 | Views plateau ~575를 **상시 경보**로 — 프로젝트 자체 FAIL 기준(≥450)을 이미 넘는데 감시에 안 걸림 | 기준은 있는데 게이트가 없다 |

### P0 실기 절차 (그대로 실행 가능)

```powershell
# 1) ~575 plateau 재현: 허브 → 시설(바/무역소) → 나가기 반복
adb shell dumpsys meminfo com.arcfire.online | Select-String "TOTAL|Views|GL mtrack|Native Heap"
# 2) plateau 진입 후 route 복귀시켜 views가 285로 안 내려오는 조건 기록
# 3) 안 내려오면 그 시점 View 계층 덤프
adb shell dumpsys activity top | Select-String -Pattern "View|Fragment" -Context 0,2
```

---

## 8. 한계

- §2·§3은 **기존 로그 재분석**이다. 계단의 **존재·규모·축**은 데이터로 확정했으나, **어느 화면의 트리가 남는지는 정적으로 특정하지 못했다.** §7 P0가 필요하다.
- §4 배제 목록은 «해당 축이 계단 원인이 아니다»는 뜻이고, 그 코드가 완벽하다는 뜻은 아니다.
- 임시 분석 스크립트는 스크래치패드에만 있다(저장소 미반영). 상설화는 §7 P2.

---

**김클로드는 읽고 계산만 했다** — 코드 변경 0 · 커밋 0 · 저장소 신규 파일은 본 리포트뿐.
