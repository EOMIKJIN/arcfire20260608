# 김클로드 → 김팀장 검수 handoff

## 🟠 PENDING — PSS 계단식 누적 코드 전수조사 (계단 실존 확인) · 2026-09-26

```text
status=PENDING (P0 실기 특정 필요 · 도구 결함 4건 수정 필요)
task_id=pss-staircase-full-survey-20260926
kind=INVESTIGATION (김클로드 코드 변경 0 · 커밋 0)
verdict=계단 «실존» 42/64 세션 · median +271MB · 비가역
리포트=tools/kim-team-lead/reports/kim-claude-pss-staircase-full-survey-20260926.md
```

```text
[pss-pre-dev] hot_path=조사 전용(런타임 미변경) alloc=0 cache=미변경
[pss-pre-dev] stage=미변경 risk=P2(PSS축)·P3(캐시)·P7(감사 공백)
[pss-pre-dev] verdict=PASS — 코드 diff 없음
```

**정적 감사는 전부 PASS** — memory:all **37/37** · skia-worklet **31/31** · worklet-contract **PASS** · native-reclaim **20/20** · resident-set **7/7** · hot-path **hits=0**.

**그런데 계단은 실존한다.** `mem-timeline.csv` 21,939행 재분석(세션 = pid + 20분 공백 → 45분 이상 64개):
- **STAIRCASE(비가역) 42 / SAWTOOTH 21 / FLAT 1**
- PSS floor median **+271MB** · max **+511MB** · floor가 **1,000MB 넘겨 정착**
- 최신 **09-17 세션도 +358MB · 잔류율 100%**

**축 분해 (STAIRCASE 42세션, 마지막 floor − 최소 floor)**
- **`native_heap` +199MB = PSS 상승의 74%** ← 주범 · `gl` +80MB(29%) · `java` +14MB(5%)
- **`views` +264 = 스테이지 트리 «정확히 1개분»**. Views plateau가 **~99(셸) / ~285(1스테이지) / ~575(2스테이지)** 3단으로 갈리고 **~575에 수백 샘플이 정착** — 프로젝트 자체 `VIEWS_RETAINED FAIL`(≥450) 초과인데 게이트에 안 걸린다.
- → **1순위 가설: 스테이지 뷰 트리 1개가 세션 내내 미해제**, 그에 붙은 Fresco 비트맵·GL이 동승.

**코드로 «배제» 확정 (C-1~C-6)**: 네비게이션(앱 전체 `push` 단 1곳 [planet.tsx:575](app/(game)/planet.tsx#L575), 스테이지 전환 전부 `replace()`, 복귀 `router.back()`, 고아 replace 없음) · 영속 배열(무상한 append 1건, 성계 수로 자연 상한) · 모듈 Skia 캐시(dispose 실배선 확인) · planetMemoCache(8곳 invalidate) · 에셋 예산(초상 296장 전부 240×240, 전량 캐시 시 182MB 유한) · hot-path 0.
**→ 원인은 「금지 패턴 위반」이 아니다.** 규칙을 지킨 코드의 잔류라서 패턴 감사로는 안 잡힌다.

**🔴 판정 도구 결함 4건 — 현행 retention 리포트 `FAIL/20건`은 신뢰 불가**
- **D-1** `run-retention-audit.cjs:156-172` — `before/after`를 **시간창만으로** 필터, **pid 미사용**(`mergeSamples`는 pid를 싣는데도). 실제로 **기동 48초 콜드 프로세스가 baseline**이 됐다
- **D-2** **중복 계상** — FAIL 20건 = 측정 **2쌍**(×18, ×2). 심각도 **10배 과장**
- **D-3** baseline staleness 무제한 — 20:17 close의 baseline이 **10.4분 전**
- **D-4** **pid 재사용 미구분** — pid 6366 스팬 **1,520h** 등 15건
- **D-5** 감사 6종에 **「세션 경과 대비 floor 추세」 판정이 아예 없다** (PASS 37/37과 +271MB 공존의 구조적 이유)

**⚠️ 김클로드 자기 정정 2건** — ① 「pid 교차 비교 탓」 오판 → 실제는 콜드스타트 baseline ② pid로만 묶어 「계단 없음」이라 판단했다가, pid 재사용 확인 후 재분리하여 **42/64 계단**으로 정정. 근거로 든 「pid 20488 43.9h 평탄」도 별개 세션 2개였다.

**요청 (착수는 지시 후)**
1. **P0** 잔류 뷰 트리 1개 **실기 특정** — route별 views 라벨 트레이스 + ~575 plateau 시점 `dumpsys meminfo` detail. **정적으로는 더 좁힐 수 없다**
2. **P1** `run-retention-audit.cjs` D-1~D-4 수정 — 세션 키 `pid+20분 공백`, staleness 상한, 측정쌍 dedupe. **고치기 전엔 이 도구로 판단 금지**
3. **P2** `audit:memory:session-floor` 신설 — 10분 롤링 floor·잔류율 상설화 (재발 방지 본체)
4. P3 Views ~575 상시 경보

**한계**: 계단의 존재·규모·축은 데이터로 확정. **어느 화면 트리가 남는지는 미특정** → P0 필요.

---

## ✅ REVIEWED — 대사창 초상 깜박임 재검수 · 2026-09-26

```text
status=REVIEWED
task_id=dialog-portrait-flicker-recheck-20260926
kind=CODE_FIX (김팀장)
verdict=PARTIAL → 수정 반영
리포트=tools/kim-team-lead/reports/kim-claude-dialog-portrait-flicker-recheck-20260926.md
```

**김클로드 재검수 판정**
- **AGREE** — 인포창과 달리 대사창만 `renderToHardwareTextureAndroid`를 씀. 정지 초상에 부적합. **제거함.**
- **DISAGREE(바)** — 「React 리마운트 여지 0」은 팩 내부 [다음]에만 맞음. 바는 `session=null` → `finishSession` → `presentAdHoc`라 overlay가 닫혔다 다시 열림. 같은 초상이라도 Image가 다시 마운트됨.

**김팀장 수정**
1. `NarrativeDialogPortrait` 하드웨어 레이어 제거
2. `replaceActiveAdhoc` — 바 턴 체인은 같은 `adhocId`·`ready`로 교체, overlay dismiss 없음
3. `onDismiss`가 Promise면 await — `showNext`의 줄 해석 동안 창을 비우지 않음
4. 게이트 — portrait/session-pack/leave 14/14 PASS · `tsc` PASS

---

## ✅ REVIEWED — NPC 함장 설정 텍스트(profileKo) 전수 마무리 · 2026-09-26

```text
status=REVIEWED
task_id=npc-captain-profile-ko-20260926
kind=TABLE_TEXT + Table-First 배선
verdict=DONE (김클로드 텍스트 262/262 · 김팀장 게이트 연결)
```

김클로드가 토큰 한도로 끊긴 작업: `npc_ai_captains.csv` `profileKo` (포트레이트 발주 + 스토리 배경, 사건 백본 E1~E7).  
CSV는 **262/262 이미 채워져 있었고**, 런타임 타입·생성·빌드 게이트가 빠져 정본이 고아였다.

**김팀장 마무리**: `NpcCaptain.profileKo` · `build-content-from-csv` emit + 누락 assert · `resolveNpcCaptainProfileKo` · integrity 테스트.  
`bioShort` 스텁(「테이블 등록 전용」 등)은 **기존값**이라 이번엔 안 바꿈.

---


> **정본 프로세스**: `docs/KIM_TEAM_LEAD_AGENT.md` §김클로드 검수 게이트 · `CLAUDE.md` §김팀장 최종 승인  
> **김클로드** = Anthropic Claude Code (Cursor ✱ 패널 · 터미널 `claude`)

---

## 🟠 PENDING — 제로로딩 P0+P1 구현 검수 결과 (실기 1 · P3 2) · 2026-09-25

```text
status=PENDING (실기 확인 1건 · P3 2건)
task_id=zero-load-implementation-review-20260925
kind=CODE_REVIEW (김클로드 코드 변경 0)
verdict=PASS (차단 0)
리포트=tools/kim-team-lead/reports/kim-claude-zero-load-implementation-review-20260925.md
```

**게이트 전부 통과**: 테스트 **17/17 PASS** · `tsc` **EXIT=0** · `audit:hot-path` **PASS(hits=0)**.

**R-1~R-4 전부 반영 확인**
- **R-1** → 신규 `IngameDialogPortraitWarmer`(오프스크린 240 `<Image>`). `prefetchImageSources`는 **best-effort로 병행**(`Host:103`) — 둘 중 하나를 버리지 않은 계층 분리가 정확
- **R-2** → `INGAME_DIALOG_READY_TIMEOUT_MS=400` + **`readyGen` 세대 가드**(store:80-89)로 stale 타이머 무시
- **R-3** → 회전 수용을 문서 비범위에 명시
- **R-4** → intro 완전 포함(자체 타임아웃 `:105` · 워머 `:259` · `typewriterActive` `:301` · **ready 전 버튼 disabled** `:318,:328`)

**계약 충족 코드 확인**
- `overlayVisible = session?.ready === true`(`Host:106`) → **ViewModel 빌드 자체가 ready 이후**(`:109`) → ready 전 split/resolve **0**. `typewriterActive: true` 하드코딩(`:121`)도 config가 ready 이후에만 만들어져 정확
- `pressNext`는 **인덱스 증가·경계검사뿐**(`ingameDialogSessionAdvancePack.ts:17-18`), `resolveIngameDialogSegmentCount` 호출 없음 → **P1 충족**
- ViewModel은 팩 있으면 **조기 반환**(`:158-160`), 레거시 split/resolve는 **degrade 폴백 전용**
- 상한 STEP 64 · PORTRAIT 12 · **`clearReadyWatch()` 11곳** 배선(누수 없음) · `pack: null` 해제 · **신규 Skia 0 · setInterval 0**
- 워머가 `onLoad`·`onError`를 **둘 다** 카운트 → 깨진 에셋에서 영원히 안 끝나는 상황 방지

**🟡 실기 확인 1건 — R-1 핵심 가정은 정적으로 증명 불가**

**「`opacity: 0` 오프스크린 `<Image>`가 릴리즈 Android에서 실제로 디코드를 끝내는가」는 기기에서만 확인된다.** 플랫폼이 완전 투명 뷰의 디코드를 지연시키면 `onLoad`가 와도 본 카드에서 비용이 다시 난다. **R-1 해결 전체가 이 한 점에 걸려 있다.**
→ 화자 10회 교체 긴 씬을 **릴리즈 빌드 실기**로 확인. 남으면 `opacity: 0.01` 또는 `left: -9999` 배치로 전환. **PSS도 같이 측정** 권고(워머가 세션 동안 상주 — unique 12장 ≈ 2.7MB, 의도된 트레이드오프이나 CLAUDE.md 메모리 우선 기준상 1회 실측 권장).

**🟢 P3 2건**
- **O-1** `IngameDialogPortraitWarmer.tsx:20` — `onWarmedRef.current = onWarmed;`가 **렌더 본문 실행**. 현 렌더러에서 동작하나 effect로 옮기면 안전
- **O-2** 워머 effect deps가 `[total]` — **길이 같고 내용만 다른** sources 교체 시 `firedRef` 미리셋. `key` + 세션 null 언마운트로 막혀 실질 위험 낮으나 deps에 sources 신원 포함이 구조적

**총평**: 설계 검토 → 구현 → 문서 v0.2 갱신 고리가 완결됐다. 특히 ①R-1을 계층으로 푼 것 ②degrade에 세대 가드를 넣은 것 ③intro에서 **버튼까지** ready로 잠근 것(설계에 없던 디테일 — 안 잠그면 ready 전 `pressNext`로 상태가 꼬인다)이 좋았다.

**self-check**: 리포트 1개 신설 + 이 handoff. 코드·CSV·생성물 변경 0 · 커밋 0.

---

## ✅ REVIEWED — 인게임 대사 제로로딩 P0+P1 구현 · 2026-09-25

```text
status=REVIEWED
task_id=ingame-dialog-zero-load-design-review-20260925
kind=IMPLEMENTATION (김팀장 · 김클로드 검수 R-1~R-4 반영)
verdict=IMPLEMENTED
대상=docs/INGAME_DIALOG_ZERO_LOAD_DESIGN.md (v0.2)
리포트=tools/kim-team-lead/reports/kim-claude-ingame-dialog-zero-load-design-review-20260925.md
```

**R-1** 오프스크린 `IngameDialogPortraitWarmer`를 P0 신뢰 경로로 채택. `Image.prefetch`는 Metro best-effort만(ready 게이트 아님).  
**R-2** `INGAME_DIALOG_READY_TIMEOUT_MS=400` 후 degrade present.  
**R-3** 진행 중 회전 재분할 금지 — 설계 §9 명시, Host/intro 팩 1회 잠금.  
**R-4** intro `ingame_dialog` 동일 팩·워머·`typewriterActive`. cinematic은 즉시.

---

## ⚪ ARCHIVED — 인게임 대사 제로로딩 설계 v0.1 검토 · 2026-09-25

```text
status=REVIEWED (설계 수정 1건 · 보완 3건 → 김팀장 구현 반영)
task_id=ingame-dialog-zero-load-design-review-20260925
kind=DESIGN_REVIEW (김클로드 코드 변경 0)
verdict=AGREE (방향·진단 타당) · 착수 전 R-1 결론 필요
대상=docs/INGAME_DIALOG_ZERO_LOAD_DESIGN.md
리포트=tools/kim-team-lead/reports/kim-claude-ingame-dialog-zero-load-design-review-20260925.md
```

**진단 전수 검증 통과** — 문서 §1의 사실 주장을 코드로 전부 확인했다. `TypewriterText` rAF+slice(`:79-105`) · **`typewriterActive` 두 렌더러 어디서도 미전달**(전역 검색) · `splitNarrativeDialogSegments` 뷰모델 빌드마다(`ingameDialogViewModel.ts:135,173`) · 초상 resolve 페이지마다(`:166`) · `resolveIngameDialogSegmentCount` 매 클릭(`ingameDialogStore.ts:262`). **「글이 늦은 게 아니라 초상 디코드·계산·타이핑이 한 순간에 만난다」는 원인 규정이 정확하다.**

**🔴 R-1 (설계 수정 필요) — `Image.prefetch`가 릴리즈에서 no-op일 수 있다**

설계 게이트는 「prefetch 완료 await 후 `ready=true`」인데, 재사용 대상 `prefetchImageSources.ts:12-18`은

```ts
const resolved = Image.resolveAssetSource(src);
if (resolved?.uri) { await Image.prefetch(resolved.uri); } catch { /* 무시 */ }
```

- **dev(Metro)**: uri가 `http://localhost:8081/...` → 동작
- **release(번들 드로어블)**: uri가 리소스명·스킴 없음 → **실패를 catch가 삼킴** → await 즉시 resolve → `ready` 켜진 뒤 **첫 `<Image>`에서 디코드** → 없애려던 A·B 지점이 살아남는다
- 파일 주석 자체가 「플랫폼에 따라 **도움이 될 수 있음**(실패는 무시)」로 best-effort 인정

**가장 나쁜 실패 형태** — dev에서는 고쳐진 것처럼 보이고 **스토어 빌드에서만 재발**한다.

또한 §6-3의 대안(오프스크린 `<Image>` 마운트)은 **「재사용」이 아니다.** `src/assetPipeline/` 6파일 전수 확인 결과 **오프스크린 디코드 수단 0건** → 신규 구현이며 **P0 공수 재산정 필요**.

> **권고**: ①릴리즈 빌드에서 prefetch 실효성 **먼저 실측** → ②안 들으면 오프스크린 워머를 P0에 포함. 측정 없이 워머부터 만들면 불필요한 기계를 얹게 된다.

**🟡 보완 3건**
- **R-2** `ready` 대기에 **상한·폴백 없음**. 「스피너 금지」 + 「present 자체를 미룸」이라 느리면 **무반응 구간**이 생긴다 → 300~500ms 상한 초과 시 **현행 동작으로 degrade**. 「끊기는 자막」보다 「안 열리는 창」이 나쁘다
- **R-3** 대사 중 회전 시 **이전 폭 기준 3줄 분할이 그대로 보인다**(§4 진행 중 재분할 금지). 타당한 트레이드오프이나 **§9 비범위에 명시**할 것
- **R-4** `intro.tsx`는 **자체 경로**(`:98` 초상 resolve 직접 · `:226` Row 직접 렌더)인데 §10 단계표에 없다 → **P0에 「intro 포함」 명시**

**✅ 설계가 놓친 유리한 사실 — P0가 생각보다 싸다**

`active` 배선이 **이미 end-to-end로 존재**한다(`TypewriterText.active` ← `NarrativeDialogRow.typewriterActive` 선언·기본값·전달). **「ready 전 타이핑 금지」는 신규 기계가 아니라 배선 한 줄**이다. 또 `NarrativeDialogRow`가 `memo`라 **글자당 setState가 Row·Image까지 번지지 않는다** — 정상 상태 비용이 이미 낮다는 뜻이고, 「문제는 열기 전 로딩」이라는 진단이 구조적으로도 맞다.

**착수 순서 권고**: ①`typewriterActive={session.ready}` 배선(**팩 없이 단독으로도 의미 있음** — 창 뜨자마자 타이핑과 첫 디코드가 같은 틱에서 만나는 것만 떼어내도 첫 페이지 체감이 바뀐다) → ②R-1 결론 → ③세션 팩 P0·P1 → ④문서 보완.

**self-check**: 리포트 1개 신설 + 이 handoff. 코드·CSV·생성물 변경 0 · 커밋 0.

---

## 🟠 PENDING — 데일리 빌드 절전·전원 내성 보강 (김클로드 직접 수정) · 2026-09-25

```text
status=PENDING (김팀장 검수 · 코드 3파일 수정됨)
task_id=daily-build-power-resilience-20260925
kind=INFRA_FIX
권한=대표님 「데일리빌드 커밋및 푸시 완료성공프로세스는 직접 수정해도 된다」
```

**대표님 지시**: 어제 데일리 빌드가 최종 푸시까지 실패. 김팀장 수정으로 오늘부터 정상 동작해야 하는데 **PC 잠자기 모드 등 상태 영향이 없는지** 확인하고, 문제가 있으면 직접 수정.

### 오늘(09-25 00:00) 실패 원인 — 김팀장이 이미 해결

`run-daily-release.cjs`가 `require('./run-daily-commit.cjs')`만 하고 **`main()`을 호출하지 않았다.** 어제 `f069d63`에서 `if (require.main === module)` 가드가 신규 도입되면서, release 경로는 `require.main !== module`이 되어 **main()이 아예 안 돌았다** → 아무 일도 안 하고 `exit 0`.

- 증상: 로그 **87바이트**(npm 배너만) · 커밋 없음 · 스케줄러 `LastResult=0`
- **김팀장이 `ccdfbf9`(01:41)에서 `require('./run-daily-commit.cjs').main();`으로 수정 완료.** 독립 재검수로 동일 진단 확인.
- 검증: `export main = function` · `release가 main() 호출 = true`

### 절전·전원 — 오늘 원인은 아니나 **잠재 위험은 실재했다**

전원 이벤트 조회(09-24 21:00~09-25 04:00) 결과 **절전/복귀 0건** — 오늘은 PC가 깨어 있었다. 그러나 설정은 위험했다.

| 항목 | 수정 전 | 수정 후 |
|---|---|---|
| **StartWhenAvailable** | **False** — 자정 놓치면 **따라잡기 없음** | **True** ← 가장 중요 |
| **WakeToRun** | False — 절전 중 안 깨움 | True |
| DisallowStartIfOnBatteries | True | False |
| StopIfGoingOnBatteries | True | False |
| ExecutionTimeLimit | PT72H | PT2H |

부수 확인: 시간대 **KST 정합** ✅ · `STANDBYIDLE=0`(자동 절전 안 함)이라 데스크톱이 스스로 잠들진 않음 ✅

### 수정한 파일 3개

1. **스케줄러 라이브 설정** — 위 표대로 적용 완료(`Set-ScheduledTask`)
2. **`register-windows-task.ps1`** — `schtasks /Create` 기본값이 위 위험 설정이라, **재등록해도 유지되도록** `Set-ScheduledTask` 블록 추가
3. **`daily-commit.ps1`** — **완료 검증 3단 신설.** 종료코드만 믿지 않는다
   - (1) 파이프라인 자체 로그가 **0줄이면 no-op 실패** ← **오늘 실패를 정확히 잡는다**(시뮬레이션 확인)
   - (2) 오늘 스냅샷 커밋이 없고 정당한 skip 사유(`no working tree changes`/`already exists`/`nothing staged`)도 없으면 실패
   - (3) `@{u}..HEAD` 미푸시 커밋이 남으면 실패
   - 실패 시 `exit 2` → 김팀장이 만든 `write-daily-commit-failure-pending.cjs` 통보 경로로 연결

> **이번 실패의 본질은 「exit 0인데 아무 일도 안 함」**이었다. 김팀장의 실패 통보는 `exit != 0`에서만 동작하므로 오늘 같은 무동작은 못 잡는다. (3단 검증이 그 구멍을 메운다.)

### 🟡 대표님 판단 필요 1건 — 깨우기 타이머

전원 구성표가 **「절전」**이고 **깨우기 타이머(RTCWAKE)가 「사용 안 함」**(AC/DC 모두 `0x00000000`)이다. 따라서 **`WakeToRun=True`를 켜도 실제로는 PC를 깨우지 못한다.**

- 다만 **`StartWhenAvailable=True`만으로 커밋 누락은 막힌다** — 자정에 꺼져/잠들어 있었으면 **다음에 켜질 때 실행**된다.
- 「매일 자정 정각」을 원하시면 `powercfg`로 깨우기 타이머를 켜야 하는데, **PC가 매일 밤 스스로 깨어나는 동작**이라 대표님 판단 사항으로 남긴다. 김클로드가 임의로 바꾸지 않았다.

**self-check**: `register-windows-task.ps1`·`daily-commit.ps1` 수정 + 스케줄러 설정 + 이 handoff. ps1 **구문 검사 통과** · 검증 로직을 **오늘 실패 로그로 시뮬레이션해 FAIL 판정 확인**. **커밋 없음** — 변경분은 오늘 밤 데일리 빌드가 담는다.

---

## 🟠 PENDING — 피드백 반영 최종 전수 검증 (잔여 3건) · 2026-09-24

```text
status=PENDING (잔여 3건 · 전부 P3·문서)
task_id=final-feedback-verification-20260924
kind=VERIFICATION (김클로드 코드 변경 0)
verdict=PASS (반영 14 · 의도적 보류 1 · 미반영 3)
리포트=tools/kim-team-lead/reports/kim-claude-final-feedback-verification-20260924.md
```

**대표님 지시**: 김팀장 모든 피드백 작업 완료 — 최종 전수 검사하고 이전 보고가 잘 반영됐는지 확인.
**방법**: 주장이 아닌 **실제 코드·CSV 대조**. 관련 테스트 **8종 전부 PASS** · `tsc` **EXIT=0**.

**✅ 반영 완료 14건**

- **F-13 progress 영구 누적** → `pruneSettledUnidentifiedAnomalyProgresses.ts` **신규 모듈 + 전용 테스트** + `missionStore.ts:600`(로드)·`:726`(런타임) **2곳 배선**
- **F-14 status 인자 무시** → **근본 해결.** `failed` 표시가 아니라 **`delete nextProgresses[missionId]`로 행 삭제**, 파라미터는 `_status`로 명시적 미사용 표기. **F-7이 덤으로 자연 소멸**
- **F-6 유물 효과 해제** → `onQuestRelicLost` 신설 + `settleAnomalyEvent.ts:39` **실제 배선**
- **F-2·F-3·F-15** → CSV `notesKo` 전건 「(미적용 · 본선 스폰 승격 시 사용)」 + 주석 정정. `history_cap`은 「코드 상수와 동기」로 별도 정확 기술
- **F-4** description 하드코딩 제거 · **F-8** 콜백을 `if (presented)` 안으로 이동
- **F-9·F-10·F-11 연구원 대사** → 「이상현상 조사반이다.」 / 「이 건은 즉시 닫힌다」 / 「조사를 맡기겠다」
- **S-1 공격 레벨 정책** → 헤더에 **「기반작업 · inert」 + 「아직 어떤 런타임 경로도 본 모듈을 호출하지 않는다」**
- **Voronoi 국경선** → **완전 반영.** `edgeKey` 좌표 짝짓기 **0건** · `:114 delaunay.neighbors(i)` 성계쌍 · `clipGalaxyVoronoiBisectorToInfluenceDisks.ts` 신규 + 전용 테스트. **대표님 지적(「성계가 확실히 있는 쪽은 그려야」)이 구조적으로 해결**

**🟡 의도적 보류 1건 — F-1 (판단이 더 맞다)**

내 권고는 「한 줄 빼면 50:50이 산다」였으나 김팀장은 **「스폰 계층 승격 때 함께」**로 판단하고 `unidentifiedAnomalyTestPolicy.ts:4`에 명시했다. **이쪽이 옳다** — payloadKind만 먼저 풀면 TTL·일 2회·쿨다운이 빠진 채 threat가 나와 반쪽이 된다. F-2·F-3와 한 덩어리로 묶은 처리가 일관적이다.

**❌ 미반영 3건 — 전부 P3·문서, 차단 아님**

| # | 내용 | 판단 |
|---|---|---|
| F-5 | `isAnomalyResearcherVisibleOnPlanet` 호출처 0 | 쓰거나 지울 것 |
| F-12 | 연구원 캐릭터 목소리 축 | **성별 로스터 확정 후가 맞다** — 지금 보류 타당 |
| **가이드 진입점** | `CLAUDE.md`에 `docs/QUEST_DIALOGUE_AUTHORING_GUIDE.md` 한 줄 | **가이드가 진입점에서 안 보이면 지켜지지 않는다 — 재요청** |

**신규 관찰 1건(P3)**: `closeAnomalyMission`의 타입 시그니처에 `status`가 남아 있고 호출측(`settleAnomalyEvent.ts:51`)이 **계산해서 버린다.** 다음 정리 때 시그니처와 함께 제거 권장.

**총평**: 품질이 높다. ①F-13을 상한이 아니라 **행 삭제 구조**로 풀어 F-14까지 해결 ②F-1·F-2·F-3을 **하나의 결정**으로 묶어 CSV·주석·코드가 같은 이야기를 함 ③Voronoi를 패치가 아니라 **구조 교체**로 처리.

**self-check**: 리포트 1개 신설 + 이 handoff. 코드·CSV·생성물 변경 0 · 커밋 0.

---

## ✅ REVIEWED — 최근 작업 전반 유사 리스크 총괄 전수 검수 · 2026-09-24

```text
status=PENDING (김팀장 수정 요청 1건)
task_id=recent-work-risk-sweep-20260924
kind=CODE_REVIEW (김클로드 코드 변경 0)
verdict=PASS (신규 P1 1건 · 확산 없음)
리포트=tools/kim-team-lead/reports/kim-claude-recent-work-risk-sweep-20260924.md
범위=최근 3일 수정 실소스 352개 (생성물 175 제외)
```

**대표님 지시**: 이상현상 검수에서 나온 리스크가 최근 작업 전반에 유사하게 있는지 전수 정밀 검수.

**결론 — 같은 계열 신규 P1은 1건, 가장 위험했던 누적 문제는 확산되지 않았다.**

**🔴 S-1 (P1) — `arcCorePlanetAttackLevelPolicy` 전체 미배선** (이상현상 F-2와 동형)

CSV는 공격 레벨 1~5의 난이도 배수 9종을 정의한다(`wave_count ×1.6` · `drone_hp ×1.35` · `general_combat_level ×1.7` · `transit_encounter ×1.75` 등). 그런데 export 6개 중 **5개가 배럴 재수출뿐 실소비 0**이고, 유일 소비처가

```ts
ArcCoreAttackSubCore.ts:21   void getArcCorePlanetAttackLevelPolicy(ARC_ATTACK_LEVEL_BASELINE);
```

**`void`로 결과를 버린다.** 배수 9종은 정책 파일 밖에 **단 한 번도 등장하지 않는다**(구조분해 포함 전체 이름 검색 확인). **공격 레벨 2~5를 올려도 아무 일도 일어나지 않는다.**
→ 배선하거나, CSV `notesKo`·파일 헤더에 **「미배선·향후 확장」**을 명시하고 `void` 터치에 사유 주석을 남길 것. 지금은 왜 버리는지 알 수 없다.

**✅ F-13(영구 누적)은 이상현상 단독 — 확산 없음**

| 미션군 | 키 공간 | 정리 |
|---|---|---|
| `arc_inst_*` | — | ✅ `pruneOrphanArcInstProgresses` + `CLEARED_ARC_INST_SNAPSHOT_LIMIT=32` |
| `arc_cpt_*` | `_{nn}` 2자리 **유한** | ✅ 덮어쓰기됨 |
| `arc_anom_*` | `_{startedAtMs}` **무한** | ❌ 정리 없음 |

**수정 템플릿이 이미 저장소에 있다** — `arcCoreInstanceProgressCleanup.ts`를 `arc_anom_*`에 그대로 적용하면 된다. 새로 설계할 것 없음.

**✅ 나머지 패턴 전부 정상**
- **F-1**: `?? resolve|roll|pick` 30곳 전수 확인 — 실제로 폴백을 죽이는 건 이상현상 1건뿐
- **F-5**: clear/dispose 계열 export 중 미호출 **2건뿐이고 둘 다 `*ForTest`** — 수명 관리 규율 양호
- **persist 증가**: 최근 수정 스토어 15개 전부 상한 정상. 신규 `stellaQuestTalkMemory`는 스칼라 1개·persist 없음·clear 존재 ✅
- **정책 3종**(sovereignLoan·inboundDrone·colonize) export 전부 실소비 — 1차 필드 스캔의 「미소비」는 **래퍼 내부 소비 구조에 의한 오탐**이라 래퍼 레벨로 재확인해 정상 판정

**✅ Voronoi 역회귀 확인 — 설계안대로 반영됨**
클립 사각형 **양쪽 통일**(원인 B 해소) · 반경 **1회 계산 후 두 빌더에 동일 전달** · **`resolveInfluenceRadiusPxFromWorld`로 월드 좌표 기반**(내가 §3-3에서 「반드시 결정할 항목」으로 남긴 줌 불변성이 올바른 쪽으로 처리됨).

**착수 권고**: ①이상현상 F-13(템플릿 재사용) → ②S-1 배선 또는 명시 → ③이상현상 F-1·F-2. **차단 사유 없음.**

**self-check**: 리포트 1개 신설 + 이 handoff. 코드·CSV·생성물 변경 0 · 커밋 0.

---

## ✅ REVIEWED — 이상현상 수색·연구원·유물 본선 정밀 코드 검수 · 2026-09-24

```text
status=REVIEWED
task_id=unidentified-anomaly-mainline-review-20260924
kind=CODE_REVIEW (김클로드 코드 변경 0 · 김팀장 반영)
verdict=APPLIED (F-13 P0 persist 누적 차단 · F-2/3/4/6/8/9/10/11 · F-1 보류)
리포트=tools/kim-team-lead/reports/kim-claude-unidentified-anomaly-mainline-code-review-20260924.md
```

**검증**: `unidentifiedAnomalyMainline.test.ts` PASS · `unidentifiedAnomalyTestRotation.test.ts` PASS · `tsc --noEmit -p tsconfig.client.json` **EXIT=0**.

**배선 확인 — 본선 4경로 전부 연결됨**: 연구원 대화(`BarNewMissionTab.tsx:179`) · 유물 지급(`planet.tsx:1554`) · 수색 공개(`planetSalvageSearch.ts:112-135`) · 미션 materialize(`missionStore.ts:602`). **`collect_item` DSL도 구현 완료**(`applyBuyGoodsMissionObjectives.ts:21` + 타입 유니온 + 무결성 테스트 정합) — 이전에 「제안만 되고 코드에 없다」던 항목이 해소됐다.

**잘 된 점**: `settleAnomalyEvent` 3중 idempotent 가드 · watch 전역 timeout 1개 + `ticking` 재진입 가드 + `MAX_TIMER_DELAY_MS` 클램프 + 빈 풀 0ms 재스케줄 금지 · `useEffect(..., [])` 마운트 1회(타이머 thrash 없음) · 정책 캐시/무효화 쌍 · persist 스키마 버전.

**🔴 P1 2건**

| # | 내용 |
|---|---|
| **F-1** | **threat 페이로드가 실기에서 절대 안 나온다.** watch`:104`이 `payloadKind: 'relic'`을 명시 전달 → store`:231` `input.payloadKind ?? rollAnomalyPayloadKind(...)`의 `??`가 넘어가지 않는다. `payload_threat_weight_pct=50` 무효 · resolver threat 분기(`defeat_enemy`) 사문화 · `planetSalvageSearch.ts:137` 도달 불가 · `threatTclAdd`·`ANOMALY_THREAT_TARGET_ID` 미사용. **watch에서 `payloadKind`를 넘기지 않으면 50:50이 그대로 산다 — 한 줄.** |
| **F-2** | **정책 CSV 스폰 계열 전부 미적용.** 실소비는 `questRelicSalvagePct` 1개뿐(+`payloadRelicWeightPct`는 F-1로 무효). 미적용: `dailySpawn`·`unacceptedTtlHours`·`concurrent`·`cooldownDays`·`historyCap`·`threatTclAdd`·band 4종·`baseSpawnChancePct`. 스폰 계층이 `unidentifiedAnomalyTestPolicy.ts`(30분/10분)라서다. store`:238` `unacceptedExpiresAtMs = expiresAtMs`라 **TTL도 12h가 아니라 10분**. 의도된 단계면 기능 문제는 없으나 **CSV에 값이 있는데 안 먹는 상태**는 「바꿨는데 왜 안 바뀌지」 사고를 부른다 → 정책 승격 또는 `notesKo`에 「(미적용)」 명시. |

**🟡 P2 4건**: F-3 `unidentifiedAnomalyTestPolicy.ts:2-3` **「본선 미착수」 주석이 실제와 어긋남**(연구원·수색·유물은 완료 — 「스폰 주기만 테스트 단계」로 정정) · F-4 `unidentifiedAnomalyResolver.ts:31-32` **목표 설명문 한/영 하드코딩**(Table-First 위반, threat 분기만 비대칭) · **F-9 연구원 첫 대사에 화자 소개 없음** · **F-10 「슬롯」은 개발 용어**.

**🟢 P3 6건**: F-5 `isAnomalyResearcherVisibleOnPlanet` 호출처 0 · **F-6 유물 효과 해제 경로 없음**(현재 registry가 v1 no-op이라 무해하나 `quest_relic_effects.csv`를 채우는 순간 desync — `onQuestRelicLost` 자리 선점 권고) · F-7 abandon이 'expired'로 기록 · F-8 콜백이 present 실패 시에도 잔존 · F-11 「조사권」 초출 미설명 · F-12 캐릭터 목소리 축 부재.

**연구원 대사는 규격 통과**(3줄·21자) — 다만 신규 `docs/QUEST_DIALOGUE_AUTHORING_GUIDE.md` 기준 §0-4 기술1(첫 줄에 화자) 위반과 개발 용어 노출 2건. 권고 문구는 리포트 §4에 있다.

**착수 순서 권고**: ①F-1(1줄) → ②F-3 주석 + F-2 notes → ③F-9·F-10 대사 2줄 → ④F-4·F-6 → ⑤나머지. **차단 사유 없음.**

**self-check**: 리포트 1개 신설 + 이 handoff. 코드·CSV·생성물 변경 0 · 커밋 0. 빌드/테스트는 검증 목적 실행.

---

## 🟠 PENDING — 퀘스트 대사 집필 가이드 정본 수립 · 2026-09-24

```text
status=PENDING (문서 수립 완료 · 김팀장 반영 요청 1건)
task_id=quest-dialogue-authoring-guide-20260924
kind=STANDARD_DOC (코드·CSV 변경 0)
문서=docs/QUEST_DIALOGUE_AUTHORING_GUIDE.md (신설)
```

**대표님 지시**: 침묵형 주인공·선택지 기반 시스템(BG3/Skyrim/P5 레퍼런스)을 참고해 **적용 방안**과 **향후 퀘스트 생성 시 대사 생성 기준**을 세우고 문서화. **추가 퀘스트 생성 시 가이드로 사용하도록 명시.**

**핵심 진단 — 우리는 이미 침묵형 주인공이다**

참조 규격을 현재 구현과 전수 대조한 결과 **핵심 3원칙은 이미 충족**, 갭은 선택지 확장 하나뿐이다.

| 참조 규격 | 우리 상태 | 근거 |
|---|---|---|
| 플레이어 대사 배제 | ✅ 충족 | 대사 101p 전수 확인 — **플레이어 대사 0건** |
| NPC 주도 서사 | ✅ 충족 | 정보·감정·지시 전부 NPC 발화 |
| 선택 → 상태값 변환 | ✅ 충족 | `IngameDialogCompletionAction`(accept_quest_mission · record_orbit_comm{outcome}) |
| 2지 선택(수락/거절) | ✅ 충족 | `ingameDialogTypes.ts:78-85` · `'[ 수락 ]'`/`'[ 의뢰 수락 ]'` · `onCancel` |
| **2~4개 선택지 배열** | ❌ 미구현 | 자료구조·CSV 칸 없음 |
| **선택별 NPC 분기** | ❌ 미구현 | `pageIndex` 선형 진행만 |
| 런타임 LLM 대사 생성 | ⛔ **HOLD** | **ZERO_BILL 위반.** 참조 규격 §3은 **런타임이 아니라 집필 기준**으로 전환 적용 |

**문서 구성** — §4 집필 체크리스트 + §5 템플릿이 실사용 부분

- **§2 원칙**: 화자 격리(플레이어 대사 절대 금지) · **NPC는 선택지를 복창하지 않는다**(의도에 반응) · 2게이트 준수
- **§3 표시 규격**: 3줄 × **21자 상한**(320dp), 집필 목표 20자
- **§4-1 절대 금지 6가지**: 실제로 96p를 고치게 만든 결함(뜻 깨진 용어 · 받는 말 없는 은유 · 주어 생략 · 허공 지시대명사 · **고유명사 충돌** · 번역투) + **자가 점검 3문**
- **§4-2 용어 표준 12건** · **§4-3 캐릭터 목소리 4축**(성별을 어미로 가르지 않는다 — 계급이 우선) · **§4-4 대명사 회피**
- **§4-5 서사 연결**: 복선은 호명 · 전환에는 계기 · 반전 미리 소진 금지 · **메타 용어 금지**
- **§5 템플릿**: 수락 씬 / 진행 씬 / 목표문 / 미션 설명문
- **§6 선택지 확장 단계안**: **1단계(2지를 이야기에 적극 활용)는 코드 변경 0으로 지금 가능.** 2~4단계는 대표님 지시 시. 분기 폭발(N^D) 경고 포함
- **§7 사용 규칙**: 새 퀘스트 작성 전 필독 · 개별 설계안과 충돌 시 **이 문서 우선**

**🔴 김팀장 반영 요청 1건**

가이드가 실제로 지켜지려면 **진입점에서 보여야 한다.** `CLAUDE.md` §「어디를 보면 되는지」 표에 한 줄 추가를 제안한다(CLAUDE.md는 프로젝트 헌법이라 김클로드가 직접 수정하지 않음).

```
| 퀘스트 대사 집필 | `docs/QUEST_DIALOGUE_AUTHORING_GUIDE.md` |
```

**self-check**: 문서 1개 신설 + 이 handoff. 코드·CSV·생성물 변경 0 · 커밋 0. 구현 상태는 `ingameDialogTypes.ts`·`CONVERSATION_TWO_GATE_DESIGN.md`·CSV 헤더 **실측 대조**로 확인했다.

---

## ✅ REVIEWED — Voronoi 국경선: 이웃 있는 쪽이 안 그려지는 버그 · 2026-09-24

```text
status=REVIEWED
verdict=AGREE (§8 원인·규칙) · 김팀장 구현
task_id=galaxy-voronoi-border-edge-pairing-fix-20260924
문서=docs/GALAXY_VORONOI_FRONTIER_TERRITORY_FIX_DESIGN.md §8
```

**김팀장**: 클램프 후 `edgeKey` 짝짓기 → 한쪽만 잘리면 `owners.length===1`로 양쪽 버림 **AGREE**. 채움·R(1.35) 유지. 국경은 Delaunay 성계 쌍 + 클램프 전 이등분선 ∩ 원(i)∩원(j). 빈 우주·거리 2R 초과는 선 없음. 게이트: pairing·territory·clamp 테스트 PASS · tsc PASS.

---

## 🗂 ARCHIVE — Voronoi 국경 짝짓기 설계 원문 · 2026-09-24

```text
status=ARCHIVED
task_id=galaxy-voronoi-border-edge-pairing-fix-20260924
kind=BUGFIX (김클로드 코드 변경 0)
문서=docs/GALAXY_VORONOI_FRONTIER_TERRITORY_FIX_DESIGN.md §8
선행=2단계(원 클램프) 적용 완료 상태 기준
```

**대표님 지시**: 「잘린 쪽은 안 그리는 게 맞는데, **성계가 확실히 있는 쪽은 그려야** 일관성 있지 않은가」 → **맞다. 지금 안 그려지는 것은 의도가 아니라 버그.**

**현상**

| 항목 | 현재 | 판정 |
|---|---|---|
| 요새 베이스 채움 (반경 절단) | 정상 | ✅ |
| 서쪽(빈 우주) 외곽선 미표시 | 정상 | ✅ |
| **이웃 성계가 있는 쪽 국경선** | **안 그려짐** | ❌ **버그** |

**원인 — 좌표로 변을 짝짓는데 클램프가 한쪽만 자른다**

- `buildGalaxyBlueRedVoronoiBorders.ts:105` 변을 **좌표 문자열**(`toFixed(2)`)로 키 생성 → `:122` 짝 못 찾으면 버림
- `clampGalaxyVoronoiInfluenceCell.ts:140` **셀이 원 안이면 원본 그대로 반환**

```text
요새 베이스 셀 → 잘림     → 변 끝점 «이동»
이웃 셀        → 원본 반환 → 변 끝점 «그대로»
```

**같은 이등분선인데 좌표가 어긋나** 각각 `owners.length === 1`이 되어 **둘 다 버려진다.** `buildGalaxyTerritoryVoronoi.ts:353`도 동일 패턴.

**확정 규칙 — 두 줄, 예외 없음**

```text
1. 변이 이등분선이고 «양쪽 원 안»  →  실선 (진영 색)
2. 그 외 모든 변                   →  페이드
```

「이웃인데 멀어서 사이에 빈 공간이 끼는」 경우는 **별도 규칙이 아니라 2번의 자동 귀결**이다. 근거: 기존 국경선 색(노랑=blue↔red · 파랑=blue↔neutral · 빨강=red↔neutral · 녹색=independent)이 전부 **「양쪽에 누가 있는가」**를 인코딩한다 — 반대편이 빈 우주면 **칠할 색이 정의되지 않는다.**

**수정 방향 — 좌표 대신 「성계 쌍」으로 짝짓기**

```text
Delaunay 이웃 (i, j)에 대해:
  공유 이등분선 구간을 «클램프 이전» 셀에서 구한다   ← 양쪽이 반드시 동일
  그 구간을 «원(i) ∩ 원(j)» 로 자른다                ← 대칭
  남으면 → 국경선(owners={i,j}) · 비면 → 없음(2번 규칙)
```

대칭 연산이라 **비대칭 절단이 원천적으로 불가능**하고 좌표 비교가 사라진다.

**하지 말 것**
- **채움(fill)은 손대지 말 것** — 클램프 폴리곤 그대로. 이미 정상이다.
- **R을 키우지 말 것** — `VORONOI_INFLUENCE_RADIUS_NN_MUL = 1.35`는 **평균 최근접 간격의 2.7배 미만이면 맞닿게** 하는 값이라, 「떨어짐」은 요새 베이스 서쪽처럼 진짜 이웃이 없는 곳에서만 생긴다. 국경선을 그리려고 R을 키우면 **원인 A의 분할 모델로 회귀**하고 폭주가 형태만 바꿔 재발한다.

**검증 (§8-5)**: ①이웃 쪽 segment 생성 ②빈 우주 쪽 미생성 ③i→j와 j→i 좌표 동일(대칭) ④거리 2R 초과 쌍은 미생성 ⑤기존 `blue/red 대륙 라벨 회귀 없음` 계속 통과.

**self-check**: 설계안 §8 신설 + 이 handoff. 코드·CSV 변경 0 · 커밋 0. Voronoi 파일은 읽기만 했다.

---

## ✅ REVIEWED — 은하 지도 Voronoi 변경 영역 폭주 · 1단계만 적용 · 2026-09-24

```text
status=REVIEWED PARTIAL
verdict=AGREE (원인 A·B·C)
task_id=galaxy-voronoi-frontier-territory-fix-20260924
적용=§5 1단계(원인 B 클립 통일)만 · 2단계 원클램프는 실기 후
```

**김팀장**: 원인 A(무한 셀)·B(채움=`computeClipBounds` / 국경=`mapBounds`)·C(bbox 클립 이동) **코드 재검수 AGREE**. 4파일은 이미 `ddf2fa5`와 동일 → 0단계 불필요. **1단계**: `computeGalaxyVoronoiClipBounds` 공용, 두 빌더 동일 사각형. 원 ∩ 셀·외곽 페이드는 §7대로 **실기 확인 후** 2단계.

---

## 🗂 ARCHIVE — 설계 승인 원문 · 2026-09-24

```text
status=ARCHIVED
task_id=galaxy-voronoi-frontier-territory-fix-20260924
kind=DESIGN_APPROVED
문서=docs/GALAXY_VORONOI_FRONTIER_TERRITORY_FIX_DESIGN.md
```

**증상**: 개척선이 사령부를 세워 블루로 편입된 **요새 베이스(synth_078)**가 서쪽으로 비정상적으로 넓은 국경 영역을 표시. 수정 시도 중 기존 국경선까지 망가지고 코드가 엉킴. 가상 성계 추가·영역 잘라내기 모두 실패.

**원인 3건 — 코드로 특정**

| # | 원인 | 위치 |
|---|---|---|
| **A** 근본 | **Voronoi에 「영향 반경」 개념이 없다.** 셀은 이웃이 나타날 때까지 무한히 뻗는다. 서쪽에 가까운 성계가 없어 먼 사이트(서쪽 팔 관문 등)와의 이등분선까지 밀려남. **기하학적으로는 정상, 의미상으로만 틀림** | `buildGalaxyTerritoryVoronoi.ts:323-334` |
| **B** 치명·**별개 버그** | **채움과 국경선이 서로 다른 Voronoi로 그려진다.** 채움=`computeClipBounds`(사이트 bbox+48) · 국경선=`mapBounds` 원본. 호출부는 같은 값을 넘기는데 **한쪽만 내부에서 축소**. 내부 셀은 동일하나 **변경 셀 모양이 달라** 채움/국경선이 어긋남 → **「고치느라 국경선이 망가진」 직접 원인.** 요새 베이스와 무관하게 원래 있던 결함 | `buildGalaxyTerritoryVoronoi.ts:323` vs `buildGalaxyBlueRedVoronoiBorders.ts:77` |
| **C** 불안정 | 클립 사각형이 **사이트 bbox** 기반이라 성계 해금·점령 때마다 전역으로 움직임 → **가상 성계 추가가 무효였던 이유**(bbox가 같이 넓어짐) | `buildGalaxyTerritoryVoronoi.ts:82-100` |

**해결 — 영역 = Voronoi 셀 ∩ 원(중심=성계, 반지름 R)**

셀을 **깎는** 연산이라 **이등분선이 움직이지 않는다.** 내부 성계는 셀이 R보다 작아 `셀 ∩ 원 = 셀` — **결과가 1픽셀도 안 바뀐다.** 「다른 성계까지 엉키는」 일이 구조적으로 불가능. 원을 24~32각형으로 근사하면 볼록∩볼록=볼록이라 `polygonAreaCentroid`·`polyToPointsAttr`·라벨 앵커가 **수정 없이 동작**한다.

**대표님 확정 3건 (§7)**
1. **R = v1 전 성계 공통 상수** (성계 간 평균 간격 × 1.2~1.5). 개척 단계 연동은 v1 안정화 후 별건.
2. **외곽 경계 = 페이드 아웃.** 미개척 방향에는 **실선 국경 금지** — 국경선은 「반대편에 누군가 있다」는 뜻이라 빈 우주에는 그으면 안 된다.
3. **적용 순서 §5 그대로** — **1단계(원인 B) 단독 완료 + 실기 확인 후** 2단계 착수. **합치지 말 것.**

**적용 순서**
- **0** 되돌리기 — Voronoi 4파일을 마지막 정상 상태로. `ddf2fa5`(01:49 커밋·푸시 완료)라 안전
- **1** **원인 B만** 수정(두 빌더 클립 사각형 통일) → **실기 확인**
- **2** 반경 클램프 — `cellPolygon(i)` 직후 **한 곳**에서 적용(삽입 지점 단일 = 회귀 범위 좁음)
- **3** 외곽 변 분류·페이드 연출 분리
- **4** 클립 사각형은 안전망으로만 → 원인 C 해소

**착수 전 기술 결정 1건 (김팀장 판단)**: **R의 좌표계.** `buildVoronoiSites`가 `toScreen`을 먼저 적용해 사이트가 이미 화면 좌표다. R을 화면 픽셀로 잡으면 **줌할 때 영토 모양이 변한다.** 배율 인자를 넘길지 월드 좌표를 같이 실을지 택일 후 **줌 불변성 테스트**로 검증.

**검증**: 기존 `buildGalaxyTerritoryVoronoi.test.ts`의 **「blue/red 대륙 라벨 회귀 없음」**이 2단계 후 통과해야 한다 — 「내부 셀은 안 바뀐다」의 직접 검증. 추가 권장 4종은 문서 §6.

**self-check**: 문서 1개 신설 + 이 handoff. 코드·CSV 변경 0 · 커밋 0. Voronoi 파일은 **읽기만** 했다.

---

## ✅ REVIEWED — 데일리 커밋 46일 실패 수정 · 2026-09-24

```text
status=REVIEWED
verdict=AGREE (gitignore pathspec :! → git 2.47+ exit 1)
task_id=daily-commit-process-integrity-20260924
```

**김팀장**: `gitAddAllWithRetry` 가 ignore된 `tools/long-run-monitor/logs/*` 11개를 `:!`로 지목해 8/10~09-24 자정 커밋이 매일 실패. ignore 경로는 pathspec에서 제외. 실패 로그는 ignored/fatal 우선. `daily-commit.ps1` 은 `cmd /c`로 npm exit 보존 + 실패 시 `CHAT_REPORT_PENDING`. 스케줄러 `ArcfireOnline_DailyCommit` 이미 `-Push -RunAudit`. `npm run audit:daily-commit-process` PASS.

---

## 🔴 URGENT — 복구 중 상태 동시 점검 (0시 기준) · 2026-09-24 01:50

```text
status=OBSERVED (읽기 전용 · 파일 변경 0)
task_id=recovery-state-observation-20260924
kind=STATE_DIAGNOSIS
verdict=코드 건전 · 커밋 보호 없음
```

**대표님 지시**: 김팀장 코드 복구 중 — 상태를 동시 확인. 복구기준일 = 0시.

### 건전성 — 이상 없음

| 항목 | 결과 |
|---|---|
| 충돌 마커(`<<<<<<<`/`>>>>>>>`) | `src`·`tables`·`tools`·`app` 전역 **0건** |
| 미추적 잔여 파일 | **0건** |
| `story_scene_pages.csv` | **230p** 정상(증감 없음) |
| 병합·리베이스 진행 흔적 | 없음 |
| `tsc --noEmit -p tsconfig.client.json` | **EXIT=0** |
| `buildGalaxyTerritoryVoronoi.test.ts` | **PASS** (작업 중 파일인데도 green) |
| `missionTableIntegrity.test.ts` | **PASS** |

### 대사 작업 전량 생존 확인

§12 정정 + §13 성별 말투가 **모두 살아 있고 구버전 잔존 0건**이다.

- 생존: 테오 혼(2) · 살인범과 동일인 · 내 얘기부터 · 닐라 「새고 있어」 · 이사 벤트 「허가해 줬다」 · 한로 「한로일세」 · 세레나 「걷어내 줘」 · 레아 「대조할게」 · 대명사 수정
- 잔존 0: 「그 손이다」 0 · 「다렐 혼」 0
- 적용 스크립트 2종 확인: `_apply-quest-dialogue-rewrite-20260923.mjs`(29KB) · `_apply-quest-dialogue-gender-voice-20260923.mjs`(12KB)

### 타임라인 (0시 이후)

- **01:30:08~01:30:19** — 대규모 일괄 복원·적용. 대사·설계문서·경제·디바이스UI·IAP 전 영역 동시 타임스탬프.
- **01:40:53~01:41:31** — `buildGalaxyBlueRedVoronoiBorders.ts` · `buildGalaxyTerritoryVoronoi.ts` 등 **Voronoi 영토 렌더링 4파일** 작업 중(unstaged · +233/−33).

### 🔴 진짜 위험 — 46일치 작업이 커밋 없이 인덱스에만 있다

```text
HEAD = c06b29b  chore(daily): snapshot 2026-08-09 (KST)  @ 2026-08-09 00:02 +0900
현재 = 2026-09-24 01:50  →  마지막 커밋으로부터 46일
staged   = 2,517 files  (+159,084 / −2,473,750)
unstaged = 6 files      (+233 / −33 · galaxyMap voronoi 작업 중)
```

**8/09 이후 커밋이 한 건도 없다.** 대규모 삭제(−247만 줄)는 `.expo-tmp-bundle-test/` 정리분이라 정상이지만, **46일치 실작업 전부가 git 인덱스와 작업 트리에만 존재**한다. 인덱스가 날아가면 복구 경로가 없다.

> `stash@{0} = backup-before-restore-to-72a234d-20260616` — **6/16에도 같은 유형의 복구 사고** 흔적이 있다. 반복되고 있다.

**권고 (커밋 권한은 김팀장)**
1. 복구 안정화 즉시 **중간 스냅샷 커밋 1회**. 완벽하지 않아도 `chore(daily): snapshot 2026-09-24 (KST)`로 끊어 두는 편이 낫다.
2. 아래 **자동 커밋 고장**을 먼저 고칠 것 — 안 고치면 오늘 커밋해도 내일부터 다시 안 쌓인다.
3. 커밋 전이라도 작업 트리 사본을 **저장소 밖에 1회 백업**.

---

### 🔴 근본 원인 확정 — 일일 자동 커밋이 46일째 매일 실패 중

**대표님 질문**: 「매일 커밋을 하지 않고 있었나?」 → **하고 있었다. 자동으로, 매일 자정. 다만 8/10부터 46일 연속 실패했고 아무도 몰랐다.**

| 구간 | 결과 |
|---|---|
| ~2026-08-09 | 자정 자동 커밋 **46일 연속 성공** (로그 균일 694B) |
| 2026-08-10 ~ 09-24 | **46일 연속 실패** (`git add failed` 37건 + 다른 형태 10건 · 로그 8~40KB로 폭증) |

**스케줄러는 지금도 살아 있다** — `ArcfireOnline_DailyCommit` · state=Ready · **last=2026-09-24 00:00:00 · result=1(실패)** · next=09-25 00:00. 매일 돌고 매일 실패한다.

**원인 — `git add` pathspec이 gitignore된 경로를 가리켜 exit 1**

`run-daily-commit.cjs:78-98` `gitAddAllWithRetry()`가 실행하는 명령:

```
git add -A -- . :!tools/long-run-monitor/logs/MONITOR_DASHBOARD_LATEST.html …(11개)
```

그런데 `.gitignore:67-68`이 `tools/long-run-monitor/logs/` 를 **디렉터리째 무시**한다. git 2.47.3은 pathspec이 무시된 경로를 지목하면 오류로 처리한다:

```
The following paths are ignored by one of your .gitignore files:
tools/long-run-monitor/logs
hint: Use -f if you really want to add them.
```

**인덱스를 건드리지 않고 `--dry-run`으로 재현 확인**:
- `git add -A -n -- . :!…(11개)` → **EXIT=1** (실패 재현)
- `git add -A -n -- .` (제외목록 없이) → **EXIT=0** (정상)

이어서 `isTransientGitAddFailure()`(:71-75)의 정규식(`short read|index.lock|…`)에 이 오류가 **매칭되지 않아 재시도 없이 즉시 반환** → `main()`이 커밋 전에 중단된다.

**왜 46일간 아무도 몰랐나 — 로그가 엉뚱한 범인을 지목한다**

```
[2026-08-09T15:00:53.351Z] git add failed: warning: in the working copy of
'app/(game)/planet.tsx', LF will be replaced by CRLF the next time Git touches it
```

stderr 첫 줄인 **무해한 CRLF 경고**를 실패 사유로 출력한다. 진짜 오류(ignored paths)는 그 뒤에 묻힌다. 로그만 보면 "줄바꿈 경고 때문에 실패"로 읽혀 원인 추적이 막힌다.

**수정안 (김팀장 · 코드 3줄 수준)**

`VOLATILE_SKIP_STAGE` 12개 중 **11개는 이미 gitignore 대상**이라 `:!` 제외가 **애초에 불필요**하다(`git check-ignore`로 확인). `git add -A`가 어차피 스테이징하지 않는다.

1. `gitAddAllWithRetry()`의 제외 목록에서 `tools/long-run-monitor/logs/...` **11개를 빼고**, gitignore 대상이 아닌 **`tools/kim-team-lead/reports/.kim-claude-auto-review-followup.json` 1개만 남긴다.** → dry-run 기준 EXIT=0 확인 완료.
2. 11개는 `unstageSensitivePaths()`(:137-143)에 그대로 두면 이중 방어가 유지된다(그쪽은 `git reset`이라 무해).
3. 부수: `logLine('git add failed: …')`가 stderr 첫 줄만 찍지 말고 **ignored/fatal 줄을 우선 출력**하도록 고치면 재발 시 즉시 진단된다.
4. 부수: 스케줄러 `result != 0`이 **아무 데도 통보되지 않는다.** 실패 시 알림(기존 `tools/long-run-monitor` 경로 재사용)을 붙일 것.

> 8/09→8/10 전환 시점의 정확한 방아쇠는 **특정하지 못했다.** 스크립트·`.gitignore`·대상 파일 존재·추적 상태 모두 HEAD 이후 무변경이라, git 버전 업데이트로 pathspec-ignore 검사가 엄격해졌을 가능성이 가장 높다(현재 2.47.3). 다만 **현상·원인·수정은 재현으로 확정**됐으므로 방아쇠 규명은 수정의 선행 조건이 아니다.

**김클로드는 읽기만 했다** — 파일 변경 0 · 스테이징 0 · 커밋 0. 이 handoff 항목만 추가.

---

## ✅ REVIEWED — 남녀 NPC 말투 차별화 반영 · 2026-09-23

```text
status=REVIEWED
verdict=AGREE (gender 컬럼·초상 HOLD)
task_id=quest-dialogue-gender-voice-20260923
kind=TEXT_REWRITE_APPLIED
문서=docs/QUEST_DIALOGUE_REWRITE_PROPOSAL.md §13
기준=§12-4 김팀장 반영 완료본
```

**김팀장**: A안·계급>성별·`~요` 금지 **AGREE**. 로스터 **남 11 / 여 10** 확정(베일=여 · 켓=남 · 벤트=여). `story_scene_pages.csv` `text` **45p** 반영(말투 표 전량 + 벤트 여 전환 2p + 대명사 1). 닐라 p0 L1 22자→18자 단축. `gender` 컬럼·초상·E-3 온보딩 **HOLD**. 빌드=`build-content-from-csv.mjs` · id·체인·목표 불변.

**대표님 10:03 「초상과 상관없이 재수정안 반영」**: 초상 미변경. 이름+배역 재수정안은 이미 CSV 일치 — 재실행 `changed=0` / expected=45.

[pss-pre-dev] hot_path=이벤트(대화 오픈) alloc=문자열 상수만 cache=CSV 빌드 1회
[pss-pre-dev] stage=해당없음(대사 컬럼만) risk=P1·P6 해당없음
[pss-pre-dev] verdict=PASS

---

## 🗂 ARCHIVE — 남녀 말투 제안 원문 · 2026-09-23

```text
status=ARCHIVED
task_id=quest-dialogue-gender-voice-20260923
kind=TEXT_REWRITE_PROPOSAL (반영 완료)
문서=docs/QUEST_DIALOGUE_REWRITE_PROPOSAL.md §13
기준=§12-4 김팀장 반영 완료본
```

**대표님 지시**: 남자 NPC와 여자 NPC의 말투는 달라야 한다. 전수 조사하여 수정.
**대표님 선택**: 말투=**A안 캐릭터 기반 차별화** · 성별=**이름 기준 확정 + 초상 재배정 요청**

**대표님 추가 지시(2026-09-23)**: 「일단 초상은 임시이고, 모두 **이름과 스토리 부여 설정**으로 남녀 구분하라.」 → **초상을 성별 근거에서 완전히 제외**하고 이름 어감 + 스토리 배역으로 **전원 확정**. 되물을 미결 인물 없음.

**성별 로스터 확정 — 남 11 / 여 10** (§13-1)
- 이름이 중성이던 3인도 배역 근거로 확정: **베일 훅=여**(오렌과 「군 vs 민간 / 남 vs 여」 이중 대비) · **켓 미온=남**(바 단골 `세라 미온`과 성씨 공유 → 남매 · 아우라 국경 성비 2:2) · **이사 벤트=여**(이름 어감 `Isa` + 메인 성비 5:5).
- **이사 벤트만 이전 판정에서 변경**(남→여). 항만사령이라 계급은 유지하고 연결어미·관찰 나열로만 여성축을 드러냄 — `obj_story_001_e` 2p 추가 치환.
- 팩 단위 성비도 쏠리지 않음: 아우라 국경 2:2 · 코어 항로 2:2 · 암흑 팩 1:1.

**초상은 이번 작업 대상 아님** — 임시 자산 확정. 다만 실제 초상 제작 시점 참조용으로 불일치 4건만 기록해 둠: **다렐 소사**(남 ← 은발 노년 여성 제독) · **레아 빈**(여 ← 이안 코발과 동일한 백발 남성 제독) · **하르만 돌**(남 ← 스텔라 아리스 본인 초상) · **한로 크레인**(남 ← 흑발 장발 젊은 여성). 남성 초상이 2종뿐이라 제작 시 5~6종 추가 필요.

**데이터 권고(선택)**: `npc_ai_captains.csv` 39개 컬럼에 성별 필드가 없어 §13-1이 최초의 성별 정본이 된다. `gender` 컬럼 신설은 김팀장 판단.

**차별화 원칙 — 「~요」를 쓰지 않는다**

여성이라고 존댓말·`~요` 계열을 붙이면 엘렌·세레나 같은 **여성 지휘관이 부하에게 존댓말**을 쓰게 되어 계급이 무너지고 번역체 여성어가 된다. 대신 4축: **종결**(남=체언 종결 / 여=동사 종결) · **연결**(남=단문 나열 / 여=`~고`·`~는데`·`~더군`) · **정보 순서**(남=결론 먼저 / 여=근거 먼저) · **지시**(남=명령형 / 여=계급 없으면 부탁형). **계급이 성별보다 우선** — 명령 장면은 남녀 모두 단정체 유지.

**🔴 부수 발견 2건**
- **대명사 성별 오류 1건**: `npc_dialog_sq_orren_bask` p2 「베일 훅이 맡는다 / **그를** 찾아가」 — 베일 훅은 여성. → 「찾아가서 입구부터 확인해라」(대명사 제거가 가장 자연스러운 국어). 전수 확인 결과 대명사는 3건뿐이고 나머지 2건(「그자」=노아, 「그를」=다렐 소사)은 정상.
- **한로 크레인 말투 불일치**: 대기 대사는 노년 하게체(「한 잔 하시려나 / 비어 있네」)인데 **퀘스트 대사는 단정체**(「한로다 / 봤다 / 해라」). **같은 인물이 장면마다 다른 사람처럼 말한다.**

**반영 범위**: `story_scene_pages.csv` `text` **40p**(말투 37 + 이사 벤트 여성 전환 2 + 대명사 1). id·구조·목표·보상 변경 0 · 페이지 수 불변 · 전 대체문 3줄 21자 이내 · **쉼표 신규 삽입 없음**(§10 따옴표 이슈 해당 없음) · 영문 컬럼 미수정(영어엔 어미 구분이 없어 원문 유지가 맞다).

**유지 판단**: 하르만 돌(남성 기준선) · 이안 코발 · 이사 벤트 · 다렐 소사 · 노아 프릭 · 미아 벨로 · 톨린 그레이브 · 케이드 림 · 켓 미온 · 칼 릿지 — 이미 성별·연령에 맞는 목소리다. 톨린의 **위장(친근 반말)→발각(냉정 단정체)** 전환은 그대로 두는 편이 낫다.

**대표님 확인**: 성별 로스터는 **전원 확정 · 미결 없음**. 남은 선택은 `gender` 컬럼 신설 여부 1건뿐이며 김팀장 판단으로 넘겨도 무방하다.

**self-check**: 문서 2개(제안서 §13 신설 + 이 handoff). 코드·CSV·생성물 변경 0 · 커밋 없음.

---

## ✅ REVIEWED — 퀘스트 대사 재검수 재반영 · 2026-09-23

```text
status=REVIEWED
verdict=AGREE (E-3 HOLD)
task_id=quest-dialogue-rewrite-20260923
kind=POST_APPLY_REVIEW
문서=docs/QUEST_DIALOGUE_REWRITE_PROPOSAL.md §12·§12-4
```

**김팀장**: §12 전량 검토. E-1·E-2·E-4·R-2·R-3 **반영**. R-1 **의도 수용·21자 재절단**. E-3 **HOLD**(온보딩 별도 전수).

---

## 🗂 ARCHIVE — 재검수 요청 원문 · 2026-09-23

```text
status=ARCHIVED
task_id=quest-dialogue-rewrite-20260923
kind=POST_APPLY_REVIEW (재반영 완료)
문서=docs/QUEST_DIALOGUE_REWRITE_PROPOSAL.md §12
```

**대표님 지시**: 김팀장 작업 완료 후 일괄 재검수·반복 검사하여 오류를 찾아 수정. **§11 체크리스트 12단계 전량 수행, 9단계 완전 통과.**

- 행 수 보존(`story_scene_pages` **230** 불변 — 페이지 증가 0) · 열 수 균일(**CSV 파손 0**) · §10 따옴표 위험 10건 정상 인용 · 치환 누락 0 · 퀘스트 범위 구용어 0(「대역」 과잉 치환 없음) · `talk_npc` 함장 참조 **28건 유효** · 빌드 OK · `missionTableIntegrity` PASS · `tsc` EXIT=0.
- **서사 통독 결과 N-1~N-8 여덟 건 모두 의도대로 작동.** 테오 혼/다렐 소사 혼동 해소 · 메인↔서브 연결 성립(오렌·칼 릿지) · 톨린 발각 계기로 켓 대조 보상 · 「관문」 3회 후 주제문 착지 확인.
- 김팀장 자체 보강(「챕터1 분기 정본」 본편 5자국↔서브 5분기 대응표)과 자체 발견 오류 2건(오렌 보고 요새→캠프, 닐라 증언 아우라→요새) 수정도 **적절**.

**🔴 재반영 9곳 — 전부 문자열 치환, 구조 변경 0**

| # | 내용 | 곳 |
|---|---|---|
| **E-1** | **줄 길이 22자 초과 3건** — 실제 상한은 21자(`resolveNarrativeDialogCharsPerLine` = `floor((W−28)/12.7)−1`, 320dp). 320dp에서 자동 분할돼 페이지가 늘어난다. `npc_dialog_sq_orren_bask` p1 · `npc_dialog_sq_noll_pass` p1 · `mission_clear_mission_001` p0 | 3 |
| **E-2** | `docs/EARLY_STORY_AND_QUEST_SPINE.md:344-345` 미동기화 — 「다렐 혼」·「대타 출정」 잔존 + 「미바인드/skeleton」(실제는 `story_002`~`006` bind 완료) | 3 |
| **R-1** | q01 «시신 신원은 확인됐다» ↔ q02 «죽은 사람은 테오 혼이다»(설계상 **최초 공개 반전**). **반전이 앞 대사에 미리 소진**돼 있다. 노아 p1 → «이름은 이미 알 거다. / 테오 혼 — 국경 방어 함대 함장 내정자였다.»로 **직책이 반전임을 명확화** | 1 |
| **R-2** | 코발이 «먼저 **내 질문**부터 들어라» 예고 후 **끝내 묻지 않고**, 다음 씬에서 플레이어가 물은 것(«물었지»)으로 바뀐다. `story_005` p1 → «먼저 **내 얘기**부터 들어라» | 1 |
| **R-3** | 리라 «오늘은 그 기록을 펴지 않는다»·«수사도 없었고» ↔ «칼 릿지가 한 말은 **적어 뒀다**» 모순. `obj_s038_c` p1 → «칼 릿지 얘긴 흘려들었다» | 1 |
| **E-4** | 🔴 **대표님 지적** — «아르카디아 살인사건 때 **그 손**이다» 의미 불명. **내 오류**: 「손」을 범인의 환유로 쓰고 「그」가 가리킬 대상을 안 깔았다(§0-1 결함 #2·#4를 내가 그대로 반복). `obj_s034_e` p0 → «**아르카디아 살인범과 동일인이다.**» · `sandbox_034` 설명문 «같은 손이다» → «**똑같다. 같은 자가 국경까지 왔다는 뜻이다.**» 부수로 「손을 타다」 2곳(`rhea_vin` p0 · `sandbox_037` 설명문) → «손댄»으로 통일 권고 | 4 |

> **R-1은 원문에도 있었고 두 차례 수정에서 모두 살아남은** 서사 결함이다.

**E-3 (범위 밖 · 대표님 판단 대기)**: 김팀장이 「범위 밖 유지」로 기록한 `early_route_arcadia_hub` 「호출부」 외에 2건 추가 발견 — `early_route_eden_bar` 1p 「튜토리얼 종료—이제 **본편**이다」(**N-4와 동일한 메타 용어 노출**) · `npc_dialog_vega_watch_01` 0p 「초계」. **김팀장 작업은 범위대로 정확**했다. `early_route_*` 32p 전수는 별도 배치 권장.

**자기 정정 2건**
- 내 문서 §8 컬럼명 3건이 전부 오기였다 — `bodyKo`→**`text`**, `labelKo`→**`description`**, `targetRef`→**`targetId`**. 실물 기준 작업이라 반영엔 지장 없었으나 **문서만 보고 스크립트를 짜면 전 항목이 빈 값으로 나온다**(내 1차 검수가 실제로 전건 FAIL). §0-2 상한도 20자→**21자**로 정정.
- 목표문 건수도 내 표는 35, 김팀장 실측 **37**이 맞다(김팀장 지적 수용).

**self-check**: 문서 2개(제안서 §12 신설 + 이 handoff). 코드·CSV·생성물 변경 0 · 커밋 없음. 빌드는 검증 목적 1회 실행 — 생성물은 김팀장 반영분과 동일.

---

## ✅ REVIEWED — 퀘스트 대사 전수 재구성 반영 · 2026-09-23

```text
status=REVIEWED
verdict=AGREE
task_id=quest-dialogue-rewrite-20260923
kind=TEXT_REWRITE_APPLIED
문서=docs/QUEST_DIALOGUE_REWRITE_PROPOSAL.md (v2.0 · APPLIED)
```

**김팀장 검수**: 수정안 N-1~N-8·§9 용어표 5건을 현행 CSV와 대조 후 **전부 AGREE**. 대표님 「모두 확인후 반영하라」를 §9 일괄 승인으로 해석해 한국어 문자열만 반영함.

**반영량**
- `story_scene_pages.csv` `text` **96p** (유지 5p: `story_004` 0·1, `obj_story_004_b` 0, `intro01` 1·2)
- `missions.csv` description **14** + title `story_003` 대타→**대행 출정**
- `mission_objectives.csv` description **37** (제안 §8의 35는 표 집계 오차, 치환 목록은 37)
- 정합: `main_story_quests`/`main_story_chain_steps` 제목 · `story_scenes` displayName 3 · `npc_ai_captains` bioShort 2(오렌·켓)
- 설계: `main_quest_template_v3` · `아크파이어_메인스토리.md` · `CHAPTER1_MAJOR_SIDE_QUESTS_DESIGN.md` — 테오 혼·대행 출정·식별 신호
- 빌드: `node tools/content-tables/build-content-from-csv.mjs` · `tsc --noEmit -p tsconfig.client.json` **PASS**
- **영문 컬럼 미수정** · id·체인·목표 타입·수락 지점·보상·함장 id **0 변경**
- 범위 밖 유지: `early_route_arcadia_hub` 「호출부」

**[pss-pre-dev]** hot_path=없음(CSV 문자열+빌드 1회) alloc=0 cache=generated 재생성
**[pss-pre-dev]** stage=해당없음 risk=없음
**[pss-pre-dev]** verdict=PASS
**[existing-value-change]** 한국어 대사·설명·목표문 · 대표님 일괄 승인
**[econ-boot-audit]** 해당없음(콘텐츠 문자열)

**김클로드 §11 재검수** 대기(대표님 지시). CSV 직접 수정 금지 · 오류는 문서 「반영 후 정정」으로.

---

## 🟠 PENDING — 김팀장 v1.1 적용분 재검수 + 설정 문서 정합 · 2026-09-23

```text
status=PENDING
task_id=chapter1-side-quests-frontier-route-20260923
kind=SETTING_DOC_RECONCILE (코드·CSV 변경 0)
verdict=AGREE (PARTIAL 1건)
문서=docs/CHAPTER1_MAJOR_SIDE_QUESTS_DESIGN.md §11 (신규)
```

**대표님 지시**: "김팀장 작업이 끝나면 설정문서 내용도 모두 김팀장 작업내용으로 업데이트하라."

**한 일** — 김팀장 리포트를 받아쓰지 않고 실물 CSV를 직접 대조(CLAUDE.md 재검수 계약). §11 신설.

- **AGREE**: `missions.csv:46-67` 22행 · `mission_objectives.csv:79-100`(`collect_item` 0건) · `npc_ai_captains.csv:252-262` questOnly 11명 + `activityPlanetIds` · 4거점 TCL(1/5/9/28) · 팩 첫 행만 오퍼 · `galaxy100.ts:524` `_p` 규칙 — **리포트 주장 전부 실물과 일치**.
- **자기 오류 정정(§11-2)**: 내 §9-2 "synth는 전부 무명 stub" = **틀림**. `tables/balance/synth_system_colonization.csv`가 `synth_001`~`079`(+`706`/`732`)에 실명·TCL·사분면을 이미 부여하고 있고, `worldStore.ts:208-222`가 CSV를 우선 적용한다. `galaxy100.ts`의 "미개척-N"은 CSV 행 부재 시 폴백이었다. 대표님이 드신 예시 지명은 실명 인용이었다. §8·§9·§10 전부 기각·이력 확정.

**⚠️ PARTIAL 1건 — 대표님/김팀장 판단 필요**

대표님 지시 원문은 「**글로우 국경** → 요새베이스 → 코어항로 → 캠프 베이스」인데 적용분 1단은 **아우라 국경(`synth_052`)**이다. 리포트에 치환 사유 없음.

- `tradeProfile`은 사분면 **정본**이다 — `worldStore.ts:216`이 좌표 사분면을 덮어쓰고 `resolveFactionForQuadrant()`로 귀속 세력까지 결정.
- 적용분 = 아우라(**west**) → 요새(east) → 코어항로(east) → 캠프(south). **1→2단에서 은하 중심을 가로질러 반대 팔로 건너뛴다**(`sandbox_039`→`sandbox_040`이 그 구간). "동선을 따라 뻗어나가게"라는 지시와 어긋남.
- 지시대로 글로우 국경(`synth_054`, **east**, TCL 3)을 쓰면 east/east/east/south가 되어 앞 3단이 같은 팔·같은 귀속 세력에 놓이고 TCL도 3→5→9→28 단조 상승.

**권고(설정)**: 팩별 분리 — **이중인격자**(`sandbox_039`–`043`, lv5) 수락만 `synth_052_p`→**`synth_054_p`**로 이동(함장 `nila_shol`·`kett_mion` `offerPlanetId`/`activityPlanetIds` 동반). **마음의 고향**(lv1)은 TCL 1 정합 + 귀환점 역할이므로 **아우라 유지**. 대표님이 "(예시)"라 쓰신 만큼 아우라 유지도 선택지 — 그 경우 "의도적 치환"으로 확정 기록.

**김팀장 조치**: 위 판단 확정 전까지 `sandbox_039`–`043` CSV **현 상태 유지**. 판단 후 CSV 반영은 김팀장 소관.

**self-check**: 문서 3개만 수정(설계 문서 §9-2 경고 + §11 신설 + 헤더). 코드·CSV·생성물 변경 0 · 커밋 없음.

---

## ✅ REVIEWED PARTIAL — 서브퀘스트 프론티어 재개발 (김팀장 주도) · 2026-09-23

```text
status=REVIEWED
task_id=chapter1-side-quests-frontier-route-20260923
kind=CONTENT_REBIND
verdict=PARTIAL
정본=docs/CHAPTER1_MAJOR_SIDE_QUESTS_DESIGN.md (APPLIED frontier v1.1)
김팀장=tools/kim-team-lead/reports/kim-team-lead-chapter1-side-quests-frontier-v1-20260923.md
```

**김팀장 (2026-09-23)**: 김클로드 §10 **DISAGREE**. 국경/요새/코어항로/캠프 = `synth_052_p`/`synth_078_p`/`synth_070_p`/`synth_075_p`. Vega 다리 미작성. `sandbox_034`–`055` 수락·탐문·전투를 코어 21 밖으로 재배치. questOnly 11. 바가 닫혀도 허브 INFO/대화로 수락.

**잔여**: 4성계가 아직 미해금이면 기존 월드맵 해금 규칙으로만 착륙 가능(강제 unlock 없음). 실기 착륙 수락 확인.

---

## 🟠 PENDING — 서브퀘스트 국경→요새→코어항로→캠프 4단 동선 설정 수정요청 · 2026-09-23 (이력)

```text
status=REVIEWED (이력 — 위 프론티어 재개발이 정본)
task_id=chapter1-side-quests-frontier-route-20260923
kind=SETTING_REVISION_REQUEST (코드·CSV 변경 0 — 당시)
문서=docs/CHAPTER1_MAJOR_SIDE_QUESTS_DESIGN.md §10
```

**요약**
- 대표님 지시: 서브퀘스트 설정을 「국경(예시: 글로우 국경) → 요새베이스 → 코어항로 → 캠프 베이스」 동선에 배치해 시나리오가 이쪽으로 뻗어나가게 수정. **진행 방식은 대표님 지정대로 설정=김클로드 지금 확정, CSV 반영=김팀장이 §0 적용 작업 마무리 후** 이 절을 수정요청으로 받아 진행.
- 김팀장이 이미 적용한 `sandbox_034`~`055`(22행) 실데이터를 직접 대조 — **4단 중 3단이 이미 우연히 들어맞아 있음을 확인**: 국경=시리우스(이중인격자 전체) · 코어항로=오메가(코어의 파편 전체) · 캠프=크림슨 구역(암흑으로 진입 수락·종결). **요새베이스(베가 전초기지)만 5팩 중 어디도 안 씀.**
- 수정 요청 핵심: 세 팩을 강제 병합하지 않고 **대사 훅 + 신규 2단 다리 팩**(`sandbox_056`~`057` 가번호, 베가 전초기지 수락, 전투 없이 대화만)으로 연결 — 닐라(이중인격자 종결)→요새 다리→레아(코어의 파편 종결)가 "이 경로가 캠프까지 이어진다"로 자연스럽게 이어지게 로그라인만 보강.
- 부의근원(섀도우 넥서스)·마음의 고향(아르카디아)은 이 4단 동선과 역할이 달라 **변경 없음** 권장(섀도우 넥서스는 캠프 너머 곁가지, 아르카디아는 귀환점 대비).
- 다리 팩 `levelRequired`(가안 12~14)가 베가 원래 낮은 난이도(3)와 어긋나는 점만 반영 시 재조정 필요 항목으로 명시.

**이력**: 김클로드 §10은 김팀장이 DISAGREE 후 프론티어 v1.1로 재개발. Vega 다리·코어 재매핑은 적용하지 않음.

---

## ✅ REVIEWED PARTIAL — 챕터1 주요 서브퀘스트 5종 적용 · 2026-09-23

```text
status=REVIEWED
task_id=chapter1-major-side-quests-design-20260923
kind=CONTENT_BIND
verdict=PARTIAL
정본=docs/CHAPTER1_MAJOR_SIDE_QUESTS_DESIGN.md (APPLIED v1.0)
김팀장=tools/kim-team-lead/reports/kim-team-lead-chapter1-side-quests-v1-20260923.md
```

**김팀장 (2026-09-23)**: A안 DSL. 1차 코어 21 배치. **프론티어 v1.1에 의해 SUPERSEDED.**

**잔여**: 상단 프론티어 재개발 블록 참고.

---

## 🟠 PENDING — 챕터1 주요 서브퀘스트 5종 설계 초안 (이력) · 2026-09-23

```text
status=REVIEWED (이력 — 위 적용 블록이 정본)
task_id=chapter1-major-side-quests-design-20260923
kind=NEW_DESIGN_DRAFT (코드·CSV 변경 0 — 당시)
문서=docs/CHAPTER1_MAJOR_SIDE_QUESTS_DESIGN.md
```

**요약**
- 대표님이 주신 스토리 키워드 5개(암흑으로 진입·이중인격자·부의근원·코어의 파편·마음의 고향)를 `sandbox_*` 서브퀘스트 5개(`sandbox_034`~`038` 가번호)로 설계.
- 시스템 배치는 §11 성계 루트 전수검사와 같은 방법으로 검증 — **5개 전부 신규 지명 없이 실재 성계**에 배치(다크 리프트·시리우스·섀도우 넥서스·오메가 스테이션·아르카디아), `systemEnemyLevel`(1/8/10/16/17)이 테마 난이도와 일치. 4곳은 이미 유사 톤의 기존 `sandbox_*` 계약이 있어 배경 충돌 없음.
- 대표님이 주신 1~5 번호는 퀘스트 식별로 유지하되, 실제 추천 진입 난이도 순서(마음의고향→코어의파편→이중인격자→부의근원→암흑으로진입)를 별도 표로 제시.
- **핵심 결정 필요**: "부의근원"·"코어의 파편" 2건은 A안(기존 DSL만, 즉시 구현 가능)과 B안(이상현상 퀘스트 v1.1에서 제안된 미구현 `collect_item` DSL 필요) 중 선택 필요 — A안 채택 시 5개 전부 지금 구현 착수 가능.
- 신규 NPC 4명은 전부 `questOnly=TRUE` 기존 계약 준수, 기존 함장 이름과 미충돌 확인 필요 항목으로 남김.

**추가 (2026-09-23, 같은 날 후속 지시) — §8 수락지점 동선 재배치**
- 대표님 지시: 서브퀘스트 수락지점을 서쪽 라인·요새베이스·허브항로 점프베이스 동선을 따라 재배치 가능한지 확인. **설정=김클로드, 구현=김팀장**으로 역할 분리해 진행.
- 은하 21개 성계 좌표 전수 확인 결과 **미네르바·아르카디아가 이미 은하 최서단** — 신규 성계 없이 "서쪽 라인" 순수 확장은 불가능함을 확인(중요 제약, 문서 §8-2에 명시).
- 요새베이스=베가 전초기지(`federation_military` 유일 요새) · 허브항로 점프베이스=타이탄 게이트("게이트 유적", 아직 어떤 퀘스트도 안 닿은 신규 커버리지) · 서쪽(연방 안전지대 해석)=솔라 항구로 확정.
- 재배치안 3건: ①"암흑으로 진입" 수락지점 크림슨 구역→베가 전초기지(부수효과로 원안의 "적진에서 반크림슨 작전 브리핑" 설정 어색함도 같이 해소) ②"코어의 파편" 수락+목표를 오메가→타이탄 게이트로 통합(난이도 8→10 소폭 상승, 재확인 필요) ③"이중인격자" 수락만 시리우스→솔라 항구로 당기고 대면·처단은 시리우스 유지(여정형 구조, 난이도 불변). "부의근원"·"마음의 고향"은 3라인과 무관해 원안 유지.
- 구현 시 체크리스트(build 스크립트 재확인 등) §8-5에 기록.

**정정 (2026-09-23, 대표님 지적) — §9 신설, §8-2 오류 수정**
- 대표님 지적: §8-2의 "21개가 은하 전체"라는 전제가 틀렸다 — 실제 그래프는 `galaxy100.ts` 기준 **~757~760개**(코어 21 + synth 계열). 재분석 지시.
- 재확인 결과: 은하는 십자(+) 형태 — 중앙 존5(코어21+미개척76=97, 지금 화면) + 동서남북 4개 팔(각 165개=관문4+미발견161), 대각 4칸은 성계 없음. **서쪽(존4)에 165개가 실제로 존재** — §8-2의 "서쪽 확장 불가" 결론은 21개만 보고 낸 오분석이었음을 인정·정정.
- 그런데도 지금 당장 서쪽에 못 놓는 진짜 이유 3가지 확인: ①자리는 있음(공간 문제 아님) ②서쪽 165개 전부 `galaxy100.ts` 자동생성 완전 무명 stub(이름 "미개척-N"/"미발견-N", 세력 unknown, 스탯 전부 50 고정 — 서사 자체가 없어 퀘스트를 놓으려면 성계 하나하나 이름·세력·설명을 새로 써야 함, 위치이동이 아니라 콘텐츠 제작) ③존4는 현재 "미발견"(지도에도 안 보임) — 이를 가시로 승격하는 기능은 `docs/성계700_전개방_메모리_운영_설계.md` §16이 이미 설계까지 해놓고 **대표님 지시로 안정화 이후로 홀드**해 둔 상태(2026-08-21, R1 HOLD).
- 재수립한 계획: §8(21코어 내 재배치)은 그대로 유지·지금 착수 가능. 진짜 "서쪽 라인"은 성계700 로드맵의 R1(미발견→미개척 표시) 홀드 해제 여부가 먼저 결정돼야 함 — **이건 이 서브퀘스트 문서가 아니라 `성계700_전개방_메모리_운영_설계.md` §10 소관**이라고 명시. 재개 시 서쪽 첫 관문 `synth_083`을 요새 라인 최전방으로 명명하는 안만 후보로 기록해 둠(착수 아님).

**김팀장(Cursor 본창) — §7·§8은 그대로 착수 판단 가능. §9의 "R1 홀드 해제 여부"는 대표님께 별도 상정 필요.**

**김팀장(Cursor 본창) 검수 요청 — §7 A/B안 + §8 재배치안 둘 다 판단 요청.**

---

## ✅ REVIEWED PARTIAL — 메인퀘스트 성계 루트 검수 + q02–q06 bind · 2026-09-23

```text
status=REVIEWED
task_id=main-quest-system-route-audit-20260923
kind=CONTENT_BIND
verdict=PARTIAL
정본=docs/main_quest_template_v3_chapter1_complete.md §11
김팀장=tools/kim-team-lead/reports/kim-team-lead-main-quest-route-v1-20260923.md
```

**김팀장 (2026-09-23)**: 홉 AGREE. 성계id≠행성id · 지도Lv≠TCL DISAGREE. 국경=`vega_base`. q09=`iron_remnant`/`omega_hub`/`eden_city`. **q02–q06 `story_002`…`006` bind**. `story_001` 동결. q07+ skeleton. 신규 행성 없음.

**잔여**: q07–q30 미션 미생성 · 전멸/데드코러스 다함대 서사 대행 · 그리하벤 권장=`shadow_market` 문서만.

---

## ✅ REVIEWED PARTIAL — 구글 플레이 인앱상점 연동 설계 v1.0 · 2026-09-23

```text
status=REVIEWED
task_id=google-play-billing-iap-foundation-design-20260923
kind=DESIGN_READY (코드 변경 0)
verdict=PARTIAL
정본=docs/GOOGLE_PLAY_BILLING_IAP_FOUNDATION_DESIGN.md v1.0
김팀장=tools/kim-team-lead/reports/kim-team-lead-google-play-iap-foundation-v1-20260923.md
```

**김팀장 (2026-09-23)**: 결제 0%·coming soon·더미 증서 AGREE. `purchaseHistory`/`gems.balance` 미구현·실코드 `player.gems` number — DISAGREE(스키마). 검증 C/A1 기각. B 또는 A2(기존 Lambda) 대표님 선택. 관련실=§3 SKU·§4 콘솔 지금 가능. 승인 전 코드 없음.

**요약**
- 실측 결과: 결제 연동 수준 **0%**. `react-native-iap`/`expo-iap`/RevenueCat 등 결제 라이브러리 전무. 실제 구글 플레이 상품 ID 없음(`gem_pack_catalog.csv`의 `iapPriceKey`가 전부 `mock_*`).
- 반대로 경제·카탈로그·UI 계층(`src/bm/*`, 상점 오버레이, 보석 지갑, 보석→크레딧 교환+원장)은 **실동작 수준으로 성숙**함을 확인 — 결제 배관만 없는 상태.
- `BmShopOverlayContent.tsx:handlePremiumAction` 확인: 보석팩 등 전 상품이 "준비 중" 알림만 뜨고 끝남. 행성증서권 한 건만 `grantPlanetDeedPurchaseDummy()`(함수명 자체가 더미)로 이어짐 — 결제 없이 화폐를 몰래 지급하는 코드는 없어 안전하게 비어 있는 상태.
- **중요**: 기존 `BUILD_PACKAGING_ANDROID_PLAY_RESCAN_2026-08-03.md`(7주 전, No-Go 판정)를 재확인한 결과 Expo/RN 스택이 그때와 동일 — 그 문서가 경고한 **target API 36 기한(2026-08-31)이 이미 지남.** 결제 연동보다 스토어 제출 게이트 자체 재확인이 먼저일 수 있음(콘솔 접근 권한자 확인 필요).
- 핵심 설계 쟁점 1건 도출: 이 프로젝트의 "서버리스 헌법(Cloud Functions 없음)"과 "결제 영수증은 서버에서 검증해야 한다"는 업계 원칙이 충돌 — RevenueCat류 제3자 위탁 서비스를 쓰면 자체 서버 없이 양쪽을 동시에 만족시킬 수 있음을 확인, 권장안으로 제시.
- 신규 설계문서(P0~P4 단계별 계획 + 대표님 확인 필요 4항목 포함)를 `docs/GOOGLE_PLAY_BILLING_IAP_FOUNDATION_DESIGN.md`로 작성 완료. 김클로드 초안이라 **검수 후 문서 소유권 전환 필요**(다른 설계문서와 달리 author가 김팀장이 아님).

**김팀장(Cursor 본창) 검수 요청 — 특히 §1-4(스토어 제출 게이트 시간경과) 우선 확인 요청.**

---

## ✅ REVIEWED PARTIAL — 기기대응 UI 설계 v0.2 (김클로드 보강 + 태블릿 전체 확대) · 2026-09-23

```text
status=REVIEWED
task_id=device-adaptive-ui-design-reinforcement-20260923
kind=DESIGN_ONLY (코드 변경 0)
verdict=PARTIAL
정본=docs/DEVICE_ADAPTIVE_UI_DESIGN.md v0.2
김클로드=tools/kim-team-lead/reports/kim-claude-device-adaptive-ui-design-reinforcement-20260923.md
김팀장=tools/kim-team-lead/reports/kim-team-lead-device-adaptive-ui-v02-20260923.md
```

**김팀장 (2026-09-23)**: Play Frame 방향 AGREE. WSC 열·Play Tier 명문화·Fold 커버 분리·inset 비대칭·오포=표준 API AGREE. 「공식 640/701로 700 선확정」은 **DISAGREE**(8형 min=640은 기존 700 밖 · 기존값). 대표님 참고 반영 — 대형 태블릿은 §3-5 `playScale=min(availW/390,availH/844)` 전체 확대. 폰 밴드 scale 금지. 승인 전 코드 없음.

---

## 🟠 PENDING — 파이어베이스 DB·리얼타임데이터 back단 구조 전수조사 · 2026-09-23

```text
status=PENDING
task_id=firebase-backend-structure-audit-20260923
kind=AUDIT (코드 변경 0)
전문=tools/kim-team-lead/reports/kim-claude-firebase-backend-structure-audit-20260923.md
```

**요약**
- 절대금지(onSnapshot·실시간 멀티플레이) 위반 0건 확인. Firestore·RTDB 리스너 실사용 코드 전무(전수 grep, 오탐만 있었음).
- 구조 전반 견고: 보안 규칙(list 차단으로 uid 열거 봉쇄) 양호 · 프로필 동기화(120초+900ms)와 백업(6시간) 두 계층이 목적별로 명확히 분리 · 모든 Firestore 호출에 타임아웃 레이스 적용돼 back단 장애가 로컬 플레이를 안 막음.
- **쓰레기 파일 1 + 죽은 코드 2 확정(0참조 증거)**: `src/firebase/config.ts`(완전히 빈 파일, import 0건) · `loadPlayerFromFirestore()`(firestore.ts, @deprecated·호출 0건) · `estimateGameSaveSnapshotCharSize()`(collectLocalGameSaveSnapshot.ts, @deprecated·호출 0건). 즉시 삭제 가능.
- 이전 감사(2026-07-08 메모리)에서 이미 발견된 미해결 건 재확인: 백업 청크 전량 성공 후 메타 문서 쓰기 직전 앱 종료 시 `payload_chunks` 고아 문서가 영구히 안 지워지는 경로 — 여전히 그대로. 낮은 빈도, 참고용.
- 백업 슬림화 6개 키 목록에 `arcfire_missions_v1` 미포함 — 최근 퀘스트 id재사용 수정으로 완화됐으나 관찰 목록에 추가 권장.
- 라이브 Firestore 문서(실제 DB 내용)는 이 세션에서 조회 불가 — 코드/스키마 레벨 감사임을 명시.

**김팀장(Cursor 본창) — 쓰레기 파일·죽은 코드 3건 삭제부터 처리 요청.**

---

## ✅ REVIEWED APPLY — 무기/전함 구매 광물 소모 제거 · 2026-09-23

```text
status=REVIEWED
task_id=trade-mineral-sink-removal-review-20260923
kind=A안 적용 + 가격·매매 전수
verdict=APPLY
김클로드=tools/kim-team-lead/reports/kim-claude-trade-mineral-sink-removal-review-20260923.md
김팀장=tools/kim-team-lead/reports/kim-team-lead-trade-mineral-sink-removal-20260923.md
```

**김팀장 (2026-09-23)**: 김클로드 AGREE. 대표님 의도=구매 광물 관문 제거. **A안 적용**(CSV 데이터 행 비움 · generated `[]` · 가격/수수료/판매식 미변경). B안(모듈 삭제) 보류. 조선소 ferrite/silicate/crystal 업그레이드·채굴 `ore_ferrite`·Macro SIM KPI 싱크는 별축 유지. `[existing-value-change]` sink qty 8/120→없음 · 대표님 승인(내의도).

---

## ✅ REVIEWED APPLY — 무기 전량 해제해도 전투에서 발사됨 · 2026-09-23

```text
status=REVIEWED
task_id=weapon-unequip-still-fires-audit-20260922
kind=BUG_FIX
verdict=APPLY
전문=tools/kim-team-lead/reports/kim-claude-weapon-unequip-still-fires-audit-20260922.md
```

**김팀장 (2026-09-23)**: §5 AGREE. 조선소 수동 해제도 `UNEQUIPPED_WEAPON_ITEM_ID('0')` 확인. §7은 대표님 요구대로 **비무장 진입 허용 · 발사 없음**. `resolvePlayerCombatWeaponChannels` 공용화(허브/이동중 + 섀도우 스냅샷). NPC `createCapitalAgentBase` 근접 폴백은 유지. 단위테스트 4건 PASS.

---

## 🟠 PENDING — 미확인 이상현상 v1.1 재검수 · 위협 전투 통합 P0 2건 · 2026-09-22

```text
status=PENDING
task_id=unidentified-anomaly-quest-v1.1-review-20260922
kind=DESIGN_REVIEW (코드 변경 0)
전문=tools/kim-team-lead/reports/kim-claude-unidentified-anomaly-quest-v1.1-review-20260922.md
대상=docs/UNIDENTIFIED_ANOMALY_QUEST_DESIGN.md v1.1
```

**요약**
- v1.0 검수 8건(P1×3·P2×3·P3×1·확인 1)은 v1.1에 전부 반영 확인. `settleAnomalyEvent` idempotent 가드 명문화만 P3로 잔존.
- v1.1 신규 본선(§6-0 50:50 유물/위협)의 **§6-3 위협 전투 통합에서 P0 2건** 발견 — 그대로 구현하면 동작 안 함:
  1. `shouldGuaranteeQuestTransitEncounter`를 "항로 누수 방지(false 필요)"와 "STAGE 3 화면 진입 시 적 선택 게이트(true 필요)" 두 용도에 동시에 씀. 설계가 요구한 false로 고정하면 `combat.tsx`가 무작위 일반 해적을 띄우고, 이겨도 `canCompleteQuestDefeatEnemy` 템플릿 불일치로 퀘스트가 안 끝남.
  2. `useTransitCombatSessionStore`(`transitCombatSession.ts`) 실제 타입에 `kind`/`returnTo` 필드가 없고, `commitArrival()`은 성계 간 이동 도착을 전제로 `moveToSystem`+worldmap 도착 연출을 무조건 실행. `combat.tsx`의 승리/도주/격침 종료 분기 전부 worldmap 또는 planet으로 하드코딩돼 있어 "수색하던 행성 허브로 복귀"를 지원하는 경로가 없음.
  3. (P1) 시드로 지목한 `buildTransitCombatSeedSlots`는 실제로 다른 화면(`PlanetEdenRaidTestLayer.tsx`, venue=`hub_orbit`) 소속 — `app/(game)/combat.tsx`(venue=`transit`)는 안 씀. 어느 화면을 쓸지부터 재확정 필요.
- 보완 방향(§4) 제시: 엔트리 게이팅 분리 · 완료 판정 전용 함수 · 복귀 전용 종료 분기 · 화면 재확정.

**김팀장(Cursor 본창) 검수 요청.**

---

## ✅ REVIEWED APPLY — 미확인 이상현상 퀘스트 설계 검토 · 2026-09-22

```text
status=REVIEWED
task_id=unidentified-anomaly-quest-design-review-20260922
kind=DESIGN_REVIEW
verdict=APPLY
전문=tools/kim-team-lead/reports/kim-claude-unidentified-anomaly-quest-review-20260922.md
정본=docs/UNIDENTIFIED_ANOMALY_QUEST_DESIGN.md (v1.1)
```

**김팀장 (2026-09-22)**: P1 3건 전부 설계 반영. P2는 (a) TTL 고정 12h · 이 퀘스트만 연구원 포기 · 해소 행성 3일 쿨다운. P3 로컬 전용 명시. 대표님 추가 지시로 수색 공개는 인스턴스당 50:50 유물/미확인 위협(이동중형 전투 · 미확인 물체 · 항로 guaranteed 금지). **코드는 설계 승인 후.**

---

## 🟠 PENDING — 방어위성 등 행성개발 완료 실시간성 조사 · 2026-09-22

```text
status=PENDING
task_id=planet-dev-realtime-completion-audit-20260922
kind=AUDIT (코드 변경 0)
전문=tools/kim-team-lead/reports/kim-claude-planet-dev-realtime-completion-audit-20260922.md
대표님 보고=방어위성 1레벨 완료·개척선 발진이 착륙 순간에만 발생
commit=NOT_REQUESTED
```

**요약**
- 대표님 진단 AGREE: HEAD 기준 완료 판정은 착륙·개발목록 열람·ArcCore RED 60초 틱(플레이어 행성 제외) 3곳에서만 호출됨 → 벽시계 완료가 실제로 UI 트리거 전까지 미반영 상태로 남아있었음.
- **이미 워킹트리에 미커밋 WIP로 수정판이 존재함** (`planetDevJobRealtimeWatch.ts` 신규 + `_layout.tsx`·`planetCoreRuntimeStore.ts`·방어위성/범용모듈/코어스탯RD/광물강화 쓰기 경로에 배선). 대표님이 보신 증상은 이 WIP 반영 전 빌드로 추정.
- 재검수 결과 결함 1건: `writeFacilityModuleDetail`이 내부 `patchPlanetCore`의 조용한 실패(행성이 worldStore에 없을 때)를 확인 안 함 → 팬텀 완료 알림·중복 알림 가능성(P2, 좁은 트리거 조건).
- 유사 시스템도 동일 패턴으로 이미 미커밋 수정됨: 의뢰 만료(`missionExpireRealtimeWatch.ts`)·바 후원 만료(`barPatronageExpireRealtimeWatch.ts`). 스텔리움 개척 도착은 이전부터 이미 실시간.
- 실기 재현은 세션 제약으로 미실시 — 김팀장 확인 요청.

**김팀장(Cursor 본창) 검수 요청.**

---

## 🟠 PENDING — 최근 적용분(퀘스트 0/1단계) 재검수 중 발견 · O(P×M) 재스캔 패턴 · 2026-09-22

```text
status=PENDING
task_id=quest-refactor-stage0-1-postapply-recheck-20260922
kind=SPOT_CHECK (코드 변경 0)
대상=src/missions/arcCoreInstanceMissionGenerator.ts:26-34,221-224
```

A1(id 재사용) 적용분 재확인 중 발견. `peekArcInstProgressIds()`가 `useMissionStore.progresses` 전체를 캐시 없이 매번 `Object.keys`+filter로 훑고, 이 함수가 `computeReplenishedPlanetEntries` 안에서 **행성마다** 호출된다(`runArcCoreBarInstanceBoardReplenishPass`가 전 코어 개방 행성을 순회). 같은 파일 206-209행 주석이 바로 이 클래스(행성마다 전체 배열 재스캔 → O(P×N))를 일일 배치 tailGroup 17.5초 지연의 원인으로 지목하며 경계하고 있는데, 이번 수정이 `progresses`에 대해 같은 패턴을 새로 들여왔다.

- **현재 규모 실측 근거로는 무해**: 코어 개방 바 행성 21개(실측) × `progresses` 통상 수백 건 → 전체 배치 1회 총 비용 1ms 미만 추정(이전 조사의 stringify/scan 벤치 기준 환산). tsc PASS, 테스트 19/19 PASS.
- **리스크는 규모**: 행성 수 확장 또는 계정 진행 기록이 커지면(예: 활성 미션이 수천 건) 같은 배치 안에서 재차 느려질 수 있는 구조. 지금 당장 막을 필요는 없으나 **행성 루프 밖에서 1회만 계산해 넘기는 형태로 정리** 권장(같은 파일의 `computeReplenishedPlanetEntries` 다른 인자들과 동일 패턴).
- 수정 필요 없음(P3) — 다음에 이 파일을 만질 때 같이 정리 권장. 급함 없음.

---

## ✅ REVIEWED APPLY — 잔해 수색 크레딧·한도 전수조사 · 2026-09-22

```text
status=REVIEWED
task_id=salvage-search-credit-cap-audit-20260922
kind=IMPL_AUDIT + TEAMLEAD_APPLY
전문=tools/kim-team-lead/reports/kim-claude-salvage-search-credit-cap-audit-20260922.md
적용=tools/kim-team-lead/reports/kim-team-lead-salvage-search-credit-cap-apply-20260922.md
verdict=APPLY — A grantSalvageCredits · B enabled=한도게이트 · C dayKey+count 시드 · D 기기시계 유지
```

**김팀장 (2026-09-22)**: 핵심 경로 동의. 시세 CR·AABS 미적용 유지. 한도는 enabled 일 때만. 시드는 persist 된 일일 카운트. Firestore는 player blob. **커밋은 대표님 지시 시.**

---

## ✅ REVIEWED APPLY — 퀘스트 리팩터 0·1단계 코드 · 2026-09-22

```text
status=REVIEWED
task_id=quest-system-refactor-stage0-1-20260922
정본=docs/코드작업을_위한_퀘스트_시스템_리팩토링.md
verdict=APPLY — A1 prune+id회피 · A2 persist-first+rewardedAt · A3 qty=1 · A4 cloud retry · persist coalesce · reset cancel · AppState flush
tsc=PASS
tests=18/18
```

**김팀장**: 2단계 형식 분리는 설계대로 재판정 후 미착수. **커밋은 대표님 지시 시.**

---

## ✅ REVIEWED — 퀘스트 시스템 정밀 전수 조사 + 리팩터 설계 개정 · 2026-09-22

```text
status=REVIEWED
task_id=quest-system-audit-and-redesign-review-20260922
kind=AUDIT + DESIGN_REVIEW + TEAMLEAD_REVISE
전문=tools/kim-team-lead/reports/kim-claude-quest-system-audit-20260922.md
검수=tools/kim-team-lead/reports/kim-team-lead-quest-refactor-design-review-20260922.md
정본=docs/코드작업을_위한_퀘스트_시스템_리팩토링.md
verdict=DESIGN_REVISED — 코드 0
```

**김팀장 (2026-09-22)**: A1 P0 인정·(a) 정리. A2는 완료 즉시 저장 후 보상. 활성 인덱스 보류. reset=cancel. 수량·반복은 범위 밖. **코드는 0단계 착수 지시 후.**

---

## 🟡 SUPERSEDED 검수 원문 — 퀘스트 전수 조사 (아래는 김클로드 · 설계 정본은 위 REVIEWED)

```text
status=SUPERSEDED
task_id=quest-system-audit-and-redesign-review-20260922
kind=AUDIT + DESIGN_REVIEW (코드 변경 0)
전문=tools/kim-team-lead/reports/kim-claude-quest-system-audit-20260922.md
대상=docs/코드작업을_위한_퀘스트_시스템_리팩토링.md
```

**요약**
- 설계 전제 판정: AGREE 4 · PARTIAL 3 · DISAGREE 3 (활성 인덱스 이득 무의미 실측 · 클라우드 sync 이미 디바운스 · 앱 사망 시 대사는 복구됨 · reset은 cancel이어야 함).
- **A1 P0 후보**: 주간 갱신(`accepted`만 유지) 후 `arc_inst_*` id 재사용 → 이전 완료 진행과 충돌 → 새 의뢰 「완료」 표시·수락 불가.
- **A2 P1**: 보상 지급과 미션 완료 저장이 독립 → 1.5초 코얼레스가 보상 재지급 창을 확대.

---

## ✅ REVIEWED PARTIAL_APPLY — 스텔라 아리스 라이프 **구현** 전수 검수 · 2026-09-21

```text
status=REVIEWED
task_id=stella-aris-life-impl-audit-20260921
kind=IMPL_AUDIT + TEAMLEAD_APPLY
전문=tools/kim-team-lead/reports/kim-claude-stella-aris-life-impl-audit-20260921.md
적용=tools/kim-team-lead/reports/kim-team-lead-stella-impl-audit-apply-20260921.md
verdict=PARTIAL_APPLY — I1·I2·I3·I4(done)·I5·I6(검역문구)·I7·I8 반영 · I4서사CSV·I6실닉·I9·I10 HOLD
tsc=PASS
life_tests=17/17
```

**김팀장 (2026-09-21)**: 잠금 19건 준수 동의. 효과 확정분만 코드 반영. 가짜 3일·취소 쿨다운·UTF-8 3KB 클램프·EN done·「원래」오탐·비매칭 EMA 제외. 서사 CSV 240·짝 실닉 대조는 보류. **커밋은 대표님 지시 시.**

---

## 🟡 SUPERSEDED 검수 원문 — 스텔라 아리스 라이프 구현 전수 (아래는 김클로드 · 적용 정본은 위 REVIEWED)

```text
status=SUPERSEDED
task_id=stella-aris-life-impl-audit-20260921
kind=IMPL_AUDIT
전문=tools/kim-team-lead/reports/kim-claude-stella-aris-life-impl-audit-20260921.md
대상=v0.2 구현분 (소스 24 · CSV 6 · generated 6)
verdict=PARTIAL — 잠금 19건 전부 준수 · 중대 3 · 보강 4 · 경미 3
```

**대표님 지시**: 김팀장 구현완료분 전수 정밀 조사 검수.

**결론**: **v0.2가 잠근 구조는 하나도 뚫리지 않았다.** 게이트 함수가 실제로 배선돼 있고(존재만 하고 안 불리는 결함 없음), 테스트가 D7·humanFirst·멱등·결정론을 실제로 고정한다. 깨진 것은 **경계조건 3건**.

**중대 3건 (실행으로 확정)**

| # | 내용 | 근거 |
|---|---|---|
| **I1** | **신규 계정이 「설치 전 3일」 일상을 가짐** — 실행: digest 3건(9/18·19·20) + done「잠깐 끼니를 때우고 있어」 생성. `lastConsolidatedDayKey`가 빈 값일 때 `from = 어제-3일`이라 **결번 백필과 최초 생성이 같은 경로**를 탐. 스텔라가 플레이어 만나기 전을 기억 → §0-H·L11 「세계가 틀림」 | `stellaLifeDigest.ts:102-104` |
| **I2** | **`[취소]`가 `lastAskDay`를 안 씀** → 행성 hop마다 같은 질문 재배지. v0.2 §16-4 「예의 쿨다운 달력 1일」 우회. §16-0이 없애려던 「무작위로 말 걸기」로 회귀. 수락만 세면 **거절당할수록 더 자주 묻는** 구조 | `planetHubTalkRoster.ts:369-371` |
| **I3** | **3KB 안전장치 무효** — 상수는 **테스트에서만** 참조(런타임 강제 0) · `stellaLifeSnapshotBytes`는 이름과 달리 **UTF-16 length**를 잼 · 테스트는 빈/파싱직후만 검증. 실측 40일 포화 = length 2,254 / **실제 3,028B(상한의 98.6%, 여유 44B)**. parse 상한 포화는 **7,190B**인데 감지 안 됨 | `stellaLifeSnapshot.ts:3,139` |

> **수정 순서 주의**: I3을 **I4보다 먼저**. narrative를 CSV 240자로 옮기면(I4) 3KB가 **즉시 초과**한다. 지금 안 터지는 이유는 하드코딩 문장이 11자라서다.

**보강 4**: I4 문장 하드코딩(narrative en 없음 · `done`이 `activityEn` 버림 → **영문 팩에 한국어**) · I5 `PAY_RE` 오탐(실행: 「원래 짧게 말해」 차단, 「원 단위로」 통과) · I6 섀도우 차단이 짝 **닉네임**을 못 막음(단 `get_shadow_nick` 금지와 구조적 충돌) · I7 traits 평균회귀로 narrative 40일 후에도 기본값.

**경미 3**: I8 도달 불가 분기(`stellaLifeDigest.ts:88-90`) · I9 중복 조건 · I10 인자 드리프트(무해).

**self-check (게이트 실행)**
- `npx tsc --noEmit -p tsconfig.client.json` — **통과**
- 라이프 전용 테스트 **13/13 통과**
- arcCore chat 전체 **134/135** — `arcCoreChatGmBeat.test.ts` 1건 실패. 원인 = tsx/esbuild가 `react-native/index.js` Flow 변환 실패(**실행 환경 문제, 로직 아님**). 라이프 모듈은 RN 비의존이라 **인과 아님**으로 판단하나, 기능셋 전체가 미커밋(`A`)이라 HEAD 비교 불가 → **김팀장 확인 필요**

**정합 확인 19건**: 신규 persist 키 0 · schema 5 · C5/D7 입 격리(호출처 확인) · 타이머 0 · fetch 0 · ObservationBus 0 · SubCore 0 · AsyncStorage 직접접근 0 · K2 호출처 1곳 · B8 검역 배선 · 튜토리얼 2중 차단 · 2게이트 · 팩 ≤400 · humanFirst · STAGE dispose · 배치 훅 말미+catch · 백필 멱등 · 시계 역행 no-op · Skia 해당없음.

**리스크**: I1·I2는 플레이어가 **첫날**과 **행성 이동**에서 바로 만나는 경로. 실기 전 수정 권장. 전부 국소 수정이며 **설계 변경 불필요**.

**변경 파일**: 검수 보고서 1개 신규 · 본 handoff. **코드 0.**

---

## ✅ REVIEWED — 스텔라 아리스 프로젝트 · 에이전트 라이프 시스템 설계 · 2026-09-21

```text
status=REVIEWED
task_id=stella-aris-life-system-design-20260921
kind=DESIGN_DRAFT + DESIGN_SELF_AUDIT + TEAMLEAD_UPGRADE
초안=docs/STELLA_ARIS_PROJECT_LIFE_SYSTEM_v0.1.md
정본=docs/STELLA_ARIS_PROJECT_LIFE_SYSTEM_v0.2.md
감사=tools/kim-team-lead/reports/kim-claude-stella-aris-life-design-full-audit-20260921.md
검수=tools/kim-team-lead/reports/kim-team-lead-stella-aris-life-design-v02-20260921.md
audit_verdict=PARTIAL_AGREE · C5 추가 · 구현은 v0.2만
```

**김팀장 검수 (2026-09-21)**: 골자 채택. C1~C4 동의. **C5 신규** — `inbound_request`는 근원체 입(`resolveChatReplySpeaker.ts:28`). 라이프를 기존 inbound에 실으면 적이 스텔라 일상을 말함. S0–S4 선제 없음 · schemaVersion 5 · 3요소는 내부 파이프. **코드 0.**

---

## 🟡 SUPERSEDED 초안 메모 — 스텔라 아리스 v0.1 (아래는 김클로드 원문 · 구현에 쓰지 말 것)

```text
status=SUPERSEDED
task_id=stella-aris-life-system-design-20260921
kind=DESIGN_DRAFT + DESIGN_SELF_AUDIT
전문=docs/STELLA_ARIS_PROJECT_LIFE_SYSTEM_v0.1.md
감사=tools/kim-team-lead/reports/kim-claude-stella-aris-life-design-full-audit-20260921.md
audit_verdict=PARTIAL (중대 4 · 보강 4 · 사실오류 4 · 정합 18)
```

**추가 지시 (2026-09-21)**: 전체 설계를 게임 모든 정본과 대조해 전수 정밀 조사 → **완료**. 정본 16건(문서 12 + 코드 4) 대조.

**감사 결과 — 중대 4건 (구현 착수 전 정정 필수)**

| # | 내용 | 정본 근거 |
|---|---|---|
| C1 | **신규 persist 키 제안이 역행** — 정본 §11-2 「키 분리보다 한 키가 purge 누락 적다」 · L2가 키 이름 명시 · 코드는 schemaVersion **4**로 judgment/speaker까지 같은 키 누적 | 구현정본 §11-2·L2 · `arcCoreChatStore.ts:35` |
| C2 | **2게이트 누락** — 라이프 선제 연락이 메신저 직행처럼 읽힘 | `CONVERSATION_TWO_GATE_DESIGN.md` §5 금지1 |
| C3 | **일일 배치는 접속한 날만 돈다** — L1 「14일」이 실제로 「최근 접속 14회」. 오래 비운 플레이어에게 세계가 틀림 | Master Spec:279 · `runArcCoreDailyOpsBatch` |
| C4 | **등록 지점 오기 + `bootstrapAccountData` 누락** — 내가 4번으로 적은 `arcCoreMemoryRegistry`는 **미구현 계획물** | 구현정본 §11-1 · `arcfire-main-lead-agent.mdc:241` |

**C1 채택 시 C4가 자동 해소**된다 — `arcfire_arc_core_chat_v1`은 이미 5곳 전부에 등록돼 있고 slim 비대상(passthrough)이라 클라우드까지 원형 전달. **C3은 D1 결정론으로 해소** — 안 산 날도 사후 계산 가능(백필 ≤3일).

**보강 4건**: B5 환경변수가 L8 화이트리스트 초과(배치·팩션 → 2차) · B6 튜토리얼 계약 누락 · B7 §0-H 「기분 질문에 라이프 덤프」 가드 없음 · B8 anchors 입력측 검역 부재(기존 검역은 출력 전용, §16-A 섀도우 닉 위험).

**사실오류 4건**: A9 백업주기 30분→**실제 6시간**(`GAME_SAVE_BACKUP_MIN_INTERVAL_MS`) · A10 pss-pre-dev `risk=` 누락 · A11(C3 흡수) · A12 별건.

**정합 확인 18건**: 입≠몸 · 채널1 · 13좌없음 · 온디바이스없음 · 턴당LLM1 · ZERO_BILL · onSnapshot없음 · 고빈도없음 · Learning분리 · 친밀도미도입 · 로맨스배제 · 상점GM미도입 · Table-First · i18n · 팩예산 · 오버레이1 · STAGE해당없음 · 레이아웃불변.

**김팀장 별건 2건 (라이프 무관 · 정본 문구 정리 필요 · 김클로드가 고치지 않음)**
1. 구현정본 **§12-A 미개정** — 「Bedrock 전용」이 ZERO_BILL 「Bedrock 금지」와 정면 충돌
2. 구현정본 **§0-I 튜토리얼 행 미개정** — 「NL 명단 침묵」이 dual mouth v0.4·코드(`arcCoreChatTutorialForce.ts:1`)와 불일치

**대표님 지시**: 스텔라 아리스가 하루 일상을 행동·학습·저장·기억하고, 그것이 플레이어 대화 맥락에 반영되게 한다. LLM + 기존 템플릿 체계와 이어지는 사고수준. 과도한 데이터 금지 · 최대 저장일 + 고도화 교체. 기획의도·기술가능성·설계안정성·적용현실성 분석. **코드작업 금지**.

**결론**: 구현 가능. 단 핵심 결정 1개가 대표님 제시 수단과 다르다 — **「10분/30분/1시간 주기 작동」을 타이머로 구현하면 실패한다.**

**재검수 판정 (기존 정본 대비)**

| 축 | 판정 | 근거 |
|---|---|---|
| 주기 틱 | **DISAGREE(수단)** | `setInterval`은 CLAUDE.md 절대금지4 · PSS §0-A 위반이고, Android 백그라운드에서 JS 타이머가 애초에 안 돌아 **기능 자체가 실패**. → 결정론적 가상 시계(지연 평가)로 교체. 상태는 실제로 30분마다 변하되 CPU 주기 실행 0 |
| 라이프 LLM 생성 | **DISAGREE(수단)** | 48슬롯/일 호출은 ZERO_BILL·무료 티어 쿼터 붕괴. → 라이프는 100% 로컬 CSV 결정론, LLM 홉 **추가 0** |
| 친밀도/호감 수치 | **AGREE(김팀장 HOLD)** | `STELLA_ARIS_OPERATOR_DIALOG_DEPTH_VERDICT_20260913.md` §7-3 HOLD 존중 — 수치 게이지 대신 anchors(기억) |
| Learning 축 연동 | **AGREE(기존 잠금)** | `arcCoreChatJudgmentMemory.ts` 주석 계약대로 publish 금지 · 단방향 읽기만 |
| 「게임 내 실제 행동기반」 | **PARTIAL** | 발화·선제대화·화제선택에는 반영(본선). **월드 write는 입≠몸으로 계속 기각**. 제안 편향은 B 스위치와 함께 예약 |

**설계 골자**: 가상 시계(48슬롯/일) · 사고 변수 7개 · 3계층 기억(L0 세션 / L1 14일 / L2 고정) · 일 1회 배치에서 EMA α=0.15 합본 후 **원본 폐기** → 총 **≤3KB 고정** · 팩 주입 ≤400자 · 신규 CSV 3장 · Firestore 신규 컬렉션 0(기존 세이브 편승) · G3 폴백도 같은 재료.

**변경 파일**: `docs/STELLA_ARIS_PROJECT_LIFE_SYSTEM_v0.1.md` (신규) · `tools/kim-team-lead/reports/kim-claude-stella-aris-life-design-full-audit-20260921.md` (신규) · 본 handoff. **코드 0.**

설계 문서에는 **사실오류 2건만 정정**(A9 6시간 · A10 risk=P2)하고 감사 배너를 달았다. 중대 4건·보강 4건은 **본문 미반영** — v0.2 개정은 김팀장 검수 후.

**self-check**: 문서만 작성 — 소스 미변경으로 `tsc`/audit 실행 대상 없음. 정본 **16건** 대조(구현정본 L1~L12·§0-H·§0-I·§7·§8·§10·§11·§12-A / 2게이트 / dual mouth v0.4 / agent world domain / sustainable learning / 김팀장 09-13 판정 / ZERO_BILL / Master Spec v4.0 / memory-leak-audit-first §0-A / main-lead-agent §230-241 / overlay·dialog·shadow 규칙 / `arcCoreChatStore.ts` / `gameSaveBackup/*` / `arcCoreChatTutorialForce.ts` / `runArcCoreDailyOpsBatch.ts`).

**리스크**: v0.1 그대로 구현에 넘기면 **C1·C2·C4에서 회귀**. v0.2 정정 후 착수 권장. 설계 골자(가상시계·로컬결정론·3계층·EMA합본·3KB·입≠몸)는 정정해도 **불변**.

**대표님 결정 5건**(§12) 여전히 필요 — 슬롯 해상도(권장 30분) · L1 보존일(권장 14일) · purge 범위(권장 player scope) · 친밀도 수치(권장 미도입) · 월드 반영(권장 지금 열지 않음). **C1 채택 시 3번은 자동 결정**(기존 채팅 키 = player scope).

---

## 🟡 PENDING — 이동중 전투 배경 성운·구름 연출 코드 전수조사 · 2026-09-20

```text
status=PENDING
task_id=transit-combat-backdrop-audit-20260920
kind=CODE_AUDIT
전문=tools/kim-team-lead/reports/kim-claude-transit-combat-backdrop-audit-20260920.md
```

**대표님 지시**: 이동중 전투 배경 구름성운·연출 코드 안정화 여부 전수조사 — 프레임/메모리/연출효과 구현 코드단 조사만.

**결론**: 확정 결함 없음. 프레임(전투 rAF와 배경 120ms 틱 분리, 실측 튜닝 근거 코드 내 주석+회귀테스트로 고정) · 메모리(Paint/Rect/Float32Array 전부 모듈 스크래치 재사용, SkPicture/SkImage 수동 dispose 금지 계약 준수) 모두 정상.

**경미 1건**: 이 컴포넌트가 STAGE reclaim 정리 함수를 `registerSkPictureFrameInvalidate`·`registerCombatSkiaPresentationReclaim` 두 레지스트리에 중복 등록 — STAGE 이탈 1회당 동일 cleanup이 2번 실행됨(멱등이라 안전, 낭비만). §2 참고.

**변경 파일**: 없음(분석만, 코드 수정 없음).

**self-check**: 코드 리뷰만 진행 — `tsc`/audit 스크립트 실행 대상 변경 없어 미실행.

**리스크**: 없음.

---

## 🟢 REVIEWED — 개척선 시스템 고도화 코드 전수 감사 · 2026-09-19

```text
status=REVIEWED
verdict=AGREE_PARTIAL
task_id=stellium-colonize-full-audit-20260919
kind=KIM_TEAM_LEAD_REVIEW
전문=tools/kim-team-lead/reports/kim-claude-stellium-colonize-full-audit-20260919.md
```

**김클로드 §1 5분 핸드오프 미영속**: AGREE — 이미 store `fleetReadyAtMs` 왕복으로 반영됨(본 검수 전 구현).

**김클로드 §2 전초기지 워치 중복**: AGREE — 행성당 모듈 타이머 1개로 합침. 허브 세션 dispose에 묶지 않음(벽시계 5분은 행성 이탈 후에도 유지). 핸드오프 출항 후 다른 행성 `in_flight`에도 워치. 퍼지 시 clear.

**김팀장 추가**: 즉시 핸드오프는 queued+ready+캡 여유일 때만. 재진입 가드.

---

## 🟢 REVIEWED — 궤도 개척선 마크 미표시 분석 · 2026-09-19

```text
status=REVIEWED
verdict=AGREE_PARTIAL
task_id=stellium-colonize-mark-inspection-20260919
kind=KIM_TEAM_LEAD_REVIEW
전문=tools/kim-team-lead/reports/kim-claude-stellium-colonize-mark-inspection-20260919.md
```

**회전 재사용 DISAGREE(미이해 추정)**: AGREE — WO 공용 궤도 재사용이 맞음. 추가 파이프라인 없음.

**already_blue / contested 가설**: 대표님 실기로 기각. 코드로 재적용하지 않음.

**§4-2 DEV 스킵 로그**: AGREE — `disabled`/`no_system`/자격사유/`no_hop`만. 이미 추적 중인 행성 착륙 스팸은 생략.

**§4-3 QA 강제 주입**: DISAGREE — 자격 우회. 착륙·도착·런타임 코어 그래프가 정본.

**정보창 1회 가드**: 착륙·성계 도착·일 배치 backfill이 재시도. 별도 우회 없음.

---

## 🟢 REVIEWED — 「세축 반응·잔상·세계 변화」설계 김클로드 검토 · 2026-09-17

```text
status=REVIEWED
verdict=AGREE_WITH_AMENDMENTS
task_id=three-axis-world-change-design-review-20260917
kind=KIM_TEAM_LEAD_REVIEW
code_changes=NO (설계 문서만 v1.1)
commit=FORBIDDEN
target=docs/세축_반응_잔상_세계변화_설계.md (v1.1)
전문=tools/kim-team-lead/reports/kim-claude-review-three-axis-world-change-design-20260917.md
```

**김클로드**: 코드 근거 13건 AGREE. 구조 결함 없음. 질문 2건은 블로커 아님. Phase 1 착수 동의.

**김팀장 반영 (v1.1)**: (1) `__revisit` 1씬+토큰 = **의도 잠금**. 잔상은 팝업 2키. `__revisit_from`은 후속 여지. (2) 방문 캡 **16→24** (코어 21+synth 3). 소유 핀 금지. (3) L9 국호 표 오독 수정. (4) 3h 상수 파일 위치 정정. (5) `complete_talk_npc` 재사용 기각. (6) `holdSig`에 증서. (7) W3는 허브 세션 진입 — 대사 착륙 가드와 비공유.

Phase 1 착수는 대표님 지시 후. src/tables 미변경.

---

## 🟢 REVIEWED — 이동중 전투 Skia 배경 · 2026-09-16 19:30

| 항목 | 값 |
|---|---|
| **status** | **`REVIEWED`** |
| **task_id** | `transit-combat-skia-backdrop-fix-20260916` |
| **verdict** | `PARTIAL` |

```text
status=REVIEWED
verdict=PARTIAL
task_id=transit-combat-skia-backdrop-fix-20260916
kind=KIM_TEAM_LEAD_REVIEW
code_changes=NO (검수 턴 — 기능 패치 없음)
commit=FORBIDDEN
next=실기 1회 후 대표님 커밋 지시
정본=tools/kim-team-lead/reports/kim-team-lead-transit-backdrop-review-20260916.md
ready=CLOSED tools/kim-team-lead/reports/kim-claude-ready-transit-combat-skia-backdrop-20260916.md
[pss-pre-dev] hot_path=none alloc=0 cache=n/a
[pss-pre-dev] stage=검수 정리 risk=없음
[pss-pre-dev] verdict=PASS
```

**김팀장 판정 PARTIAL**: 김클로드 구름 raw 캔버스 + safe-area flush 제거는 **수용**. 헤더 원본 `TF.panelBg` 유지. 크래시 P0 해제(대표님 확인). 이 축 **재구현·추가 패치 금지**. 실기(끊김·띠·헤더)만 남음. 커밋은 대표님 지시 후.

---

## ⚪ 이력 — PENDING(구현+자가검수 완료) — 이동중 전투 Skia 배경 풀블리드 수정 · 2026-09-16

```text
status=SUPERSEDED_BY_REVIEWED
task_id=transit-combat-skia-backdrop-fix-20260916
kind=IMPLEMENT + SELF_REVIEW
code_changes=YES
commit=FORBIDDEN
files=src/components/combat/TransitCombatSkiaParallaxBackdrop.tsx · tools/memory-audit/run-skia-worklet-memory-audit.cjs
ready=tools/kim-team-lead/reports/kim-claude-ready-transit-combat-skia-backdrop-20260916.md
전문=tools/kim-team-lead/reports/kim-claude-transit-combat-skia-backdrop-inspection-20260916.md (§8)
[pss-pre-dev] hot_path=flushPicture() 80ms setInterval alloc=신규 없음(기존 모듈 스크래치 재사용) cache=Picture 1장(state)
[pss-pre-dev] stage=combat STAGE3 risk=P1(레이아웃) — 크래시 신규 가능성 없음(변경은 위치·범위 계산뿐)
[pss-pre-dev] verdict=PASS
```

**READY §2 재검수(받아쓰지 않음)**: A=**PARTIAL**(공백 원인 진단은 맞았으나, 도착 시점 디스크는 이미 컨테이너는 풀블리드로 고쳐져 있었고 **구름만 여전히 `resolveTransitFullscreenContentBox`로 인셋**돼 있어 잔여 공백이 남아있었음 — 근본원인 진단은 맞되 당시 남은 증상은 다른 지점이었음) · B=**AGREE, 이미 반영됨**(`as any` 캐스팅 확인) · C=**PARTIAL**(`useEffect` 래핑은 이미 복원돼 있었음. `clipRect`/`width()` 재도입 없음 확인).

**구현 요약**: 대표님 확인 결과 "구름 3겹 교차 흐름이 끊기고, 위아래 공백이 남는다"는 잔여 문제 재분석 — `PlanetNebulaImageBackdrop.tsx`(허브 실제 배경, `absoluteFillObject` 전체 화면)를 대조 기준 삼아 **구름 레이어도 flat-fill/베이크 성운과 동일하게 풀캔버스(raw `canvasW/canvasH`) 기준으로 그리도록 변경** — `resolveTransitFullscreenContentBox` 기반 콘텐츠박스 인셋을 구름 드로잉에서 제거. 이 인셋이 `useSafeAreaInsets().bottom`(비동기 값)에 의존해 매 변경마다 `flushPicture` 콜백 재생성 → 인터벌 재시작을 유발하던 것도 같이 제거돼, "끊기는" 문제의 유력 원인 하나(safe-area 값 변화 → 타일 크기 재계산 → 시각적 점프, 기존 `skipFlushTicksRef` 2틱 스킵 가드는 `gfxSize` 리사이즈만 커버하고 이 경로는 못 잡았음)도 함께 제거됨.

`tools/memory-audit/run-skia-worklet-memory-audit.cjs`의 관련 체크 1개가 옛 설계(구름 content-box 유지)를 전제로 작성돼 있어 **불일치 실패** — 새 설계 기준으로 체크 로직 갱신(풀캔버스 일치 검증)해 29/29 PASS.

**자가검수**: `npx tsc --noEmit` 클린 · `npx tsx src/combat/transitCombatParallaxPlan.test.ts` 17/17 PASS · `npm run audit:skia-memory` 29/29 PASS.

**실기 미확인 — 명시**: 코드·정적 검사로는 근본원인(안전영역 비동기 값 의존)을 제거했다고 판단하나, "끊기는" 체감이 실제로 해소됐는지는 **기기 재생 확인이 필요**(대표님 재테스트 대상). 크래시는 현재 미재현 상태(대표님 확인) — 이번 변경은 레이아웃·범위 계산만 건드려 신규 크래시 경로 유발 가능성 낮다고 판단하나 이것도 실기로 재확인 요망.

src/tables 외 변경 없음. **commit 없음** — 대표님 지시 후 김팀장 커밋.

---

## ⚪ 이력 — READY(구현+자가검수 이관, 처리 완료) — 이동중 전투 Skia 배경 · 2026-09-16

```text
status=CLOSED
task_id=transit-combat-skia-backdrop-fix-20260916
kind=IMPLEMENT + SELF_REVIEW
assignee=CLOSED
kim_team_lead_code=STOP
commit=FORBIDDEN
READY=CLOSED
분석=tools/kim-team-lead/reports/kim-claude-transit-combat-skia-backdrop-inspection-20260916.md
```

**대표님 지시 (2026-09-16 19:01)**: 「지금 수정이 안되는 중이므로 김클로드가 이어서 구현하고 검수하는 쪽으로 변경한다.」

김팀장 이 축 **코드 패치 중단**. 김클로드는 READY를 읽고 구현 + 같은 턴 자가검수 → 본 파일 상단을 **PENDING**으로 갱신. **commit 금지.** 김팀장 패치 받아쓰기 금지.

---

## ⚪ 이력 — PENDING(재검수 완료 · 2/3 미수정) — 이동중 전투 배경 Skia 레이어 전수 정밀조사 (크래시 2건 실측) · 2026-09-16

```text
status=PENDING
task_id=transit-combat-skia-backdrop-inspection-20260916
kind=RE_VERIFICATION_AFTER_FIX
code_changes=NO
commit=FORBIDDEN
target=src/components/combat/TransitCombatSkiaParallaxBackdrop.tsx
전문=tools/kim-team-lead/reports/kim-claude-transit-combat-skia-backdrop-inspection-20260916.md (§6 재검수)
```

**대표님 지시**: "지금 좀전에 수정이 끝났는데 한번더 전수 검사해봐라." — 아래 최초 리포트(§1~3)의 3개 항목을 수정 후 코드로 재대조.

**결과 — 1/3만 수정됨**:
- ✅ **tsc TS2345 해소** — `useImage((bakedSource ?? null) as never)`로 수정 확인. `npx tsc --noEmit` 재실행 에러 0건.
- ❌ **위아래 공백 미수정** — `TransitCombatSkiaParallaxBackdrop.tsx:396`의 `top:chromePad.topPx/bottom:chromePad.bottomPx` 컨테이너 인셋 그대로. 테스트도 이 동작을 여전히 "의도"로 단언(`transitCombatParallaxPlan.test.ts:108-120`). **계속 재현될 가능성 높음.**
- ❌ **크래시 유력 후보(ref 동기화 useEffect 밖 대입) 미수정** — `:251-255` 그대로. 새 크래시 tombstone도 없음(단, 수정 후 실기 재현 시도 자체가 없었던 것으로 보여 "해결 확인"과는 다름 — 재테스트 필요).
- `tools/memory-audit/reports/skia-worklet-latest.md`(26/26 PASS)는 이번 수정 후 재실행되지 않았고, 애초에 텍스트 패턴 스캔이라 공백/useEffect 문제를 잡아낼 수 있는 검사가 아님 — PASS가 근거가 되지 않음.

상세는 전문 §6. src/tables 미변경, commit 없음.

---

## 🔴 PENDING(1차 분석, 참고용) — 이동중 전투 배경 Skia 레이어 전수 정밀조사 (크래시 2건 실측) · 2026-09-16 (재검수는 위 항목 참조)

```text
status=PENDING
task_id=transit-combat-skia-backdrop-inspection-20260916
kind=CRASH_INVESTIGATION
code_changes=NO
commit=FORBIDDEN
target=src/components/combat/TransitCombatSkiaParallaxBackdrop.tsx · src/combat/transitCombatParallax*.ts
전문=tools/kim-team-lead/reports/kim-claude-transit-combat-skia-backdrop-inspection-20260916.md
```

**대표님 지시**: "김팀장이 이동중 전투 배경그래픽(Skia) 레이어 구현중. 위아래 공백 + 크래시. 현재 구현 전수 정밀조사, 분석만."

**⚠️ 조사 중 파일이 실시간으로 편집됨** — 두 번 읽는 사이 `stageInsets`→`chromePad` 리팩터로 내용이 바뀌는 것을 직접 목격(그 과도기에 `tsc`가 `Cannot find name 'stageInsets'`를 순간 띄움). 아래는 **최신 스냅샷 기준**이며 이 문서를 읽는 시점엔 또 바뀌어 있을 수 있음.

**확정 사실 3건**:
1. **위아래 공백 원인 확정** — `TransitCombatSkiaParallaxBackdrop.tsx:396`가 이미 풀블리드인 `StageShell.backgroundOverlay`(`StageShell.tsx:98` absoluteFillObject) 컨테이너를 `top:72/bottom:54` 만큼 자체적으로 다시 인셋시켜, 그 띠 구간엔 Canvas 자체가 없음(단색 `#05070e`만 노출). `resolveTransitBackdropChromePad`(원래 "구름이 여백에 안 들어가게" 의도)가 View 위치에 잘못 적용됨.
2. **`tsc` 실패 재현됨** — `TransitCombatSkiaParallaxBackdrop.tsx:241` TS2345(`useImage(bakedSource ?? null)`). 기존 정상 동작 sibling `SkiaPlanetNebulaShaderBackdrop.tsx:140-141`은 `as any` 캐스팅으로 이미 우회 중 — 신규 파일에 캐스팅 누락.
3. **오늘자 실제 크래시 tombstone 2건 확보**(`.tmp-crash-buf.txt`/`buf2.txt`) — 18:10:16 `JsiSkCanvas::clipRect` assert(SIGABRT), 18:19:29 `JsiSkImage::width()` SIGSEGV. 단, `src/` 전수 grep 결과 두 크래시 모두 **애플리케이션 코드에서 정확한 호출부를 확정하지 못함**(앱에 `clipRect` 호출 0건, `.width()`는 이 컴포넌트가 도달하지 않는 다른 함수에만 존재). 최유력 가설: 5개 `useImage()` 동시 사용 + 이미지 ref 동기화가 (조사 중 목격한 최신 변경으로) `useEffect` 밖 렌더 본문에서 직접 대입되고 있어, 80ms 인터벌이 Skia가 폐기 중인 이미지 핸들을 참조할 레이스 가능성. 확정 아님, 정황 근거로만 제시.

권고(미적용): (1) 인셋을 컨테이너가 아닌 구름 타일 그리기에만 적용, (2) `as any` 캐스팅 추가, (3) 이미지 ref 동기화를 `useEffect`로 원복. 전문에 상세 근거·재현 커맨드 기재. src/tables 미변경, commit 없음.

---

## ✅ REVIEWED — 전쟁·경제 연동 설계 v0.2 재검수 반영 · Phase 0–1.5 착수 · 2026-09-14

```text
status=REVIEWED
task_id=war-economy-theater-v02-review-20260914
kind=DESIGN_REVIEW + IMPLEMENT
kim_team_lead_verdict=AGREE_WITH_FIXES
code_changes=YES
commit=NOT_REQUESTED
target=docs/strategy/WAR_ECONOMY_THEATER_AUDIT_AND_UPGRADE_DESIGN.md (v0.2.1)
전문=tools/kim-team-lead/reports/WAR_ECONOMY_THEATER_V02_REVIEW_20260914.md
```

김클로드 3건 반영: 쿨다운 예시 5.3h · vault 함수명 `resolveFactionVaultForPlanetId` · 주둔 배율은 수비 화력만(`defenderGarrisonMul`).  
구현: `resolveWarTheaterState` · 여파/WDI theater 합류 · 주둔 persist(월드 축) · NPC 승리금/잔존 · 일 배치 `runTheaterGarrisonDailyPass`. 플레이어 웨이브 밸런스 불변.

---

## 🔴 PENDING(참고자료 · 김팀장 확인 대기) — 전투 연출·이펙트 아트 디렉션 참고 가이드 (HighFleet) · 2026-09-16

```text
status=PENDING
task_id=combat-vfx-art-direction-highfleet-20260916
kind=ART_DIRECTION_REFERENCE
code_changes=NO
commit=FORBIDDEN
전문=docs/COMBAT_VFX_ART_DIRECTION_REFERENCE_HIGHFLEET_20260916.md
```

**대표님 지시**: 유튜브 전투영상(HighFleet, "Sevastopol Veteran Gunner" 근접포격 장면)의 연출·효과·분위기·색감을 분석해 아크파이어 그래픽 전반(전투 이펙트/색감/연출 톤)에 참고할 개발가이드 작성. 이후 **대표님이 실제 전투 스크린샷 1장을 첨부**해 실측 분석으로 보강.

**요약**: 1차는 영상 제목/메타데이터 + HighFleet 공개 아트 디렉션 자료 기반이었으나, 첨부 스크린샷을 직접 분석해 §2에 실측 HEX 팔레트(배경 `#5B6672`~`#7A8590` 슬레이트 블루그레이, 대폭발 3단 그라디언트 `#FFF7E0→#FDBA74→#F97316`, 트레이서 `#FB7185`/`#F97316`+하이라이트 `#FEF3C7`, 함미화염 `#FDE047→#F59E0B→#C2410C`, UI 라임그린 `#BEF264`~`#D9F99D`)와 구도 관찰(광원=이펙트뿐·트레이서는 점이 아닌 선분·대기원근·파편 방사낙하·UI 3요소 단색)을 반영해 전면 보강했다.

핵심 제안: **연사 무기 발사 리듬에 미세 지터 + 크로스파이어 밀도 구간에서 최근 발사탄만 하이라이트**해 "쏟아붓는" 인상 강화. 명중 섬광 3단 그라디언트, 저HP/화재 상태 `statusTintHex` 시간 보간 등도 기존 `weapon_special_fx_policy.csv`·`buildLaserBolt()` 구조 안에서만 조정하는 방향으로 제안. **모두 Skia 루프 무할당 원칙 준수 — 신규 렌더 파이프라인 없음.**

**한계**: 스크린샷 1장 기준 — 다른 장면(원거리·완전야간·격침 직전 등) 색감 편차 가능성 있음. 추가 스크린샷 있으면 더 정교화 가능. 착수는 별도 지시 후 READY 분리.

src/tables 미변경. commit 없음.

---

## 🔴 PENDING(분석 완료 · 김팀장 판정 대기) — 전쟁·경제 연동 설계 v0.2 독립 재검수 · 2026-09-14 (이력)

```text
status=REVIEWED
task_id=war-economy-theater-v02-review-20260914
kind=DESIGN_REVIEW
code_changes=NO
commit=FORBIDDEN
target=docs/strategy/WAR_ECONOMY_THEATER_AUDIT_AND_UPGRADE_DESIGN.md (v0.2)
전문=tools/kim-team-lead/reports/WAR_ECONOMY_THEATER_V02_REVIEW_20260914.md
```

**대표님 지시**: "김팀장이 수립한 전쟁·경제 연동설계 v0.2를 분석 검수하고 업데이트 요소나 리스크요소를 정리해 김팀장에게 보고하라."

**요약**: 문서 핵심 뼈대(분쟁 삼중 정의·연결맵·헌법 8원칙·`resolveWarTheaterState` 아키텍처·전선 주둔 프록시)를 코드/CSV 직접 대조로 재검수. 스팟체크 6건 중 5건 **AGREE**(정의 A/B/C, 여파 CSV 수치, `allySupplyEnabled` NO-LINK 전부 코드와 정확히 일치), 1건 **DISAGREE**(§1 쿨다운 예시 "풀8→10.7시간"은 문서가 인용한 공식 자체로 계산하면 약 5.3시간 — 계산 오류, 신규 발견).

업데이트 요소 3건(쿨다운 수치 정정 · §10-4 함수명 정밀화 `resolveFactionVaultForPlanetId` · `resolveWarTheaterState`의 캐시-의존성 명시) + 리스크 요소 3건(관측버퍼/주둔맵 캡 강제 실장 확인 · 주둔 배율 삽입점 중복계산 가능성 · 60개 체크리스트 전항목은 이번 라운드 미검증) 상세는 전문 참조. 종합 판정: **착수 가능**, 단 §8 질문3(로테이션 유지) 답변 전 쿨다운 수치 정정 권장.

src/tables 미변경. commit 없음.

---

## 🔴 PENDING(분석 완료 · 김팀장 판정 대기) — 웨이브 전투 FPS 저하 독립 재검수 · 2026-09-14

```text
status=PENDING
task_id=wave-combat-fps-analysis-20260914
kind=RE_VERIFICATION
code_changes=NO
commit=FORBIDDEN
kim_team_lead_verdict=PARTIAL
ready=tools/kim-team-lead/reports/kim-claude-ready-wave-combat-fps-20260914.md
전문=tools/kim-team-lead/reports/kim-claude-wave-combat-fps-analysis-20260914.md
reviewed_at=2026-09-14
```

김팀장 판정 **PARTIAL** → **2026-09-14 00:33 정정**: 대표님 — 아르카디아 전투 없음(블루). 재현=**베가 `vega_base` L3**. 어느 성계든 전투 시 프레임 저하.

L3 적 픽은 **특수FX 없음**. Type C `012` AoE는 **이번 재현 1순위 아님**. 공통 바닥=STAGE3 상시 신규 패키지.

**김팀장 보완 적용 (2026-09-14)**: 연출/FX/CSV 불변. 베가 1웨이브 rAF — 빈 스킬·빈 크래프트 skip, filter 제거, prevPts·clamp in-place. 전문 §7-2. `tsc` PASS.

김팀장 1차 분석(§1-1~1-6) 받아쓰지 않고 코드·git diff·`npx tsx` 실측으로 재검수 완료. 1차 리포트 보완·확장판.

---

**판정 표 (전 항목):**

| 항목 | 판정 | 한 줄 요약 |
|------|------|-----------|
| §1-1 플레이어 기본무기 특수FX 기각 | **AGREE** | w_laser_heavy_01 / w_missile_guided_triple_01 / w_missile_arc_005 모두 FX policy 행 없음, 기각 확정 |
| §1-2/1-3 Type C `w_laser_arc_012` AoE | **AGREE (확정도↑)** | L1에서 rocket 패밀리 requiredLevel≤1 없음 → 폴백 100% 확정. hit당 O(N) AoE + 800ms Skia tint. npx tsx 실측 일치 |
| §1-4 `tickPlayerAutoCombatSkills` NEW | **AGREE (NEW, cheap)** | HEAD 없음 확인, 스킬 0개 시 비교연산 ~10개만, 단독 영향 미미 |
| §1-4 `tickCapitalCrafts` NEW | **DISAGREE (이번 무관)** | NEW지만 풀 항상 비어있어 0비용 (플레이어/L1적 모두 drone/carrier 없음) |
| §1-4 `quadBezier` 요격 루프 NEW | **DISAGREE (이번 무관)** | craft alive 없어 루프 진입 안 함 |
| §1-4 `writeCapitalHeavyTurnLaw` NEW | **NEW, negligible** | HEAD 없음, 산술연산만, 1에이전트당 microsecond 이하 |
| §1-4 `agents.filter().length` (3134) | **AGREE (기존)** | `git show HEAD` 검색됨 — 김팀장 "기존" 동의 |
| §1-4 Skia statusTint per-frame | **AGREE (NEW 비용, 추가 확인)** | HEAD에 FX 없어 tinted=false였음. working tree에서 AoE hit → 800ms 매프레임 draw.circle 추가. 피격 최대 5에이전트 × 800ms = 24,000 draw/레이저1회 |
| §1-5 근접 8연사 `w_missile_arc_005` 신규 | **DISAGREE (신규 아님)** | `git diff HEAD -- combatWeaponSlots.ts` 출력 없음. HEAD부터 기존 |
| §1-6 L5+ 후반행성 | **실측 완료 (추가)** | L5: A+B=w_laser_arc_011(cutting_beam FX×4명), B+C=w_missile_arc_009(shrapnel AoE 36px, double scan 가능성). L1보다 훨씬 심각 |

**김팀장 놓친 것:**
- **Skia tint per-frame 연속 비용**: FX 판정(hit-time O(N))만 언급, AoE 이후 800ms×매프레임 draw.circle 비용 별도 명시 안 됨
- **L2가 L1보다 오히려 싸다**: npx tsx 실측에서 L2 Type C → `w_missile_arc_005`(무FX)로 전환. 비선형 패턴(L1폴백FX → L2무FX → L5다중FX)

**순위 3 (L1 기준):**
1. Type C 레이저 hit → `applySpecialWeaponAoeAroundPoint` O(N) NEW + 800ms Skia tint NEW (확정)
2. `tickPlayerAutoCombatSkills` 등 신규 루프 합산 (중첩 기여)
3. Skia tint draw.circle per-frame 연속 비용 (실기 미측정)

**실기로 가를 질문 (2개):**
1. 재현이 아르카디아(L1)만인지, L5+ 행성도 포함인지 — L5+면 `w_missile_arc_009` double-scan이 추가 원인
2. FPS 저하가 교전 직후부터인지 vs. 첫 Type C 레이저 hit 이후 점진적인지 — 후자면 틴트 per-frame 비용이 주범

패치 1안(제안, 미구현): `hostile_enemy_weapon_loadout_policy.csv` 신규 행 추가 (L1 전용 폴백=`w_laser_arc_007`, 무FX). 기존 `second_burst` FX 데이터 변경 없음.

코드·CSV·commit 전부 무변경.

---

## 🟢 READY — 웨이브 전투 프레임 저하 독립 분석 · 2026-09-14

```text
status=READY
task_id=wave-combat-fps-analysis-20260914
assignee=김클로드
kind=ANALYSIS_ONLY
commit=FORBIDDEN
code_changes=FORBIDDEN
ready=tools/kim-team-lead/reports/kim-claude-ready-wave-combat-fps-20260914.md
assigned_at=2026-09-14
```

대표님 지시: 프레임 저하를 김클로드에 공유하고 **분석만**. 플레이어는 **기본무기만**(추가 무기 무관).  
김클로드는 김팀장 1차 분석을 **받아쓰지 말고** 코드·피커 재검수 → 리포트 `kim-claude-wave-combat-fps-analysis-20260914.md` → 본 파일 상단 `PENDING`. **패치·커밋 금지.**

---

## ✅ REVIEWED — 스텔라 아리스 인앱 LLM 대화 고도화 · 2026-09-13

```text
status=REVIEWED
task_id=stella-aris-operator-shop-guide-ethical-design-20260913
kim_team_lead_verdict=PARTIAL
applied=§7-2 op_persona_perspective/humor/boundary · pack/Lambda cap 12
already=§7-4 memory tags 공유 rollingSummary
held=§2–5 shop GM · §7-3 친밀도 4단계 · §7-5 미연시 regex
reviewed_at=2026-09-13
전문=tools/kim-team-lead/reports/STELLA_ARIS_OPERATOR_SHOP_GUIDE_ETHICAL_DESIGN_20260913.md
판정=tools/kim-team-lead/reports/STELLA_ARIS_OPERATOR_DIALOG_DEPTH_VERDICT_20260913.md
```

김클로드 설계 §0 윤리는 **잠금**. 대화수준 고도화는 **관점 3행만** 적용. 상점 안내·친밀도 기계는 HOLD.

---

## ✅ REVIEWED — 스킬트리 36종 설계 반영 · 2026-09-13

```text
status=REVIEWED
task_id=skill-tree-36-undeveloped-design-20260913
kim_team_lead_verdict=PARTIAL
applied=요새화 HP≤30% 게이트 · 액티브 스태거 · 수리드론 허브 내구 · 정찰 안개+1홉/위협미리보기/수색시간 · 시장감지 가격 · 암시장 밀수 진열 · 웜홀탐색 결정론 홉스킵 · jump_speed=이동시간
held=영구 웜홀 포탈 · 월드 시세 조작 · 다중록온 추가 미사일 · 싱귤래리티 전용 탄
rejected=autoTriggerCondition CSV 컬럼 · wingman=capitalCraftPool(대표님 B안=블루 전함)
reviewed_at=2026-09-13
전문=tools/kim-team-lead/reports/SKILL_TREE_36_UNDEVELOPED_DESIGN_20260913.md
```

김클로드 36종 설계 §2~§5 재검수 후 김팀장 결정:

| 주장 | 판정 | 조치 |
|---|---|---|
| active≠발동 버튼 · 자동전투 수식 | **AGREE** | 기존 잠금 유지 |
| `jump_speed` 소비처 미확인 | **AGREE→해소** | `SHIP_TRANSIT_DURATION_MS` × 0.7 |
| `sensor_range` 판정 위치 미확인 | **AGREE→해소** | 스캔/수색 시간 · 이동 안개 +1홉 · 위협 미리보기 |
| `repair_drone` 비전투 1회 | **AGREE** | 허브 착륙 60s 간격 내구 +1%p |
| 요새화 HP 트리거 | **AGREE** | 쿨 준비 + 선체 ≤30%. CSV 컬럼 없음 |
| `market_sense` 가격 미리보기 | **AGREE** | 인접 성계 대표 SKU 매입가 |
| `black_market_boss` 진열 게이트 | **AGREE** | 섹터와 무관 `contraband` 추가 |
| `wormhole_finder` 홉 절감 | **AGREE** | 결정론 15% 1홉. 실패 시 연료 −15% |
| `autoTriggerCondition` 컬럼 | **DISAGREE** | 정책+쿨로 충분 |
| 윙맨=함재기 풀 | **DISAGREE** | 대표님 B안 블루 전함 |
| 독점=월드 물가 | **DISAGREE** | `price_elasticity=0` · 개인 매입만 |
| 영구 웜홀 포탈 | **HOLD** | 홉 스킵 유지 |

---

## 🗄 SUPERSEDED — 스킬트리 미개발 36종 개별 개발안 · 2026-09-13 (김클로드 원문)

```text
status=SUPERSEDED
task_id=skill-tree-36-undeveloped-design-20260913
kind=DESIGN_PROPOSAL (36개 개별)
code_changes=NO
전문=tools/kim-team-lead/reports/SKILL_TREE_36_UNDEVELOPED_DESIGN_20260913.md
```

대표님 지시: 김팀장 스킬 개발 중 — 미개발 36종에 김클로드가 기획·설계 채워 개발문서 작성 후 전달.

**36종 수치 재확인(AGREE)**: `skills.csv` 45종 중 `skillRuntimeStatus.ts`의 `COMPLETE_IDS`(8)+`PARTIAL`(1)을 뺀 정확히 36종 — 대표님 수치와 일치.

**핵심 재검수 결과**: CSV `effectType=active` 라벨만 보고 "플레이어 발동형 액티브 스킬 시스템"을 새로 만들어야 한다고 오판하기 쉬운데, 실제로는 이 게임 전투가 자동전투라 **15개 "active" 중 5개는 그냥 자동전투 수식에 계수 추가**(A그룹 패시브 21개와 구현 난이도 동일), 6개만 `capitalWeaponImpact.ts`에 이미 있는 `statusTintUntilMs`/`speedSlowUntilMs` 같은 기존 "임시상태 타이머" 필드 패턴 재사용으로 해결 가능, 1개(`wingman`)는 어제 정밀검사한 `capitalCraftPool.ts` 함재기 풀을 그대로 재사용 가능, 나머지 3개만 전투 시뮬 밖 도메인(은하이동·무역경제)이라 별도 설계 필요.

**설계 구성**: A그룹(패시브 21종) — 전투 2종·무역 6종은 기존 Bind 파일에 필드만 추가, 항법 4종·함대 9종은 신규 Bind 파일 2개 필요(기존 패턴 복붙 수준). B그룹(액티브 15종) — 5가지 성격으로 재분류(자동전투수식형/임시상태형/소환형/아웃오브컴뱃형/조건부자동트리거형), 전문 §3에 각 성격별 구체 소비 지점·필드명까지 제시.

**이번 설계에서 유일하게 "기반 작업"이 필요한 지점**: B-2 임시상태형 6종을 위한 `Agent` 신규 상태 필드 4~5개(`stanceMode`/`stealthUntilTurn`/`invincibleUntilMs`/`speedBoostMul`/`speedBoostUntilMs`) + 선택적 CSV `autoTriggerCondition` 신규 컬럼. 그 외 34종은 기존 컬럼·기존 패턴만으로 충분.

**미확인 2건(김팀장 확인 요청)**: `jump_speed`(점프가속) 소비처가 이미 있는지, `sensor_range`(정찰센서) 구체 판정 로직 위치.

코드·CSV 전부 무변경. 전문 §4 우선순위 참고해 반영 판단 요청.

---

## ✅ REVIEWED — 특수무기류 정밀검사 대안 반영 · 2026-09-13

```text
status=REVIEWED
task_id=weapon-special-fx-system-inspection-20260913
kim_team_lead_verdict=PARTIAL
applied=연출만 4행 플래그 보강 · 누락 8+1행 신규 · 제네시스 아군치유 · 함재기 ignoreArmor 연동
held=실제 탈취 · 함대증발 · 아다만틴 ignoreShield 0→1
rejected=048=카스(오인 — 039가 카스) · 036 ignoreShield 오기정정(IgnoreDR=장갑)
reviewed_at=2026-09-13
전문=tools/kim-team-lead/reports/WEAPON_SPECIAL_FX_SYSTEM_INSPECTION_20260913.md
```

김클로드 §1~§4 재검수 후 김팀장 결정:

| 주장 | 판정 | 조치 |
|---|---|---|
| 34종 실제 판정·메모리 OK | **AGREE** | 유지 |
| 연출만 4종 CSV 플래그 보강 | **AGREE** | `056` 실드박탈 · `059` 광역+감속 · `068` 광역 · `069` 감속 |
| 사거리 플레이버 3종 틴트만 | **AGREE** | `022`/`040`/`051` 신규 행 |
| 옴니·월드에코 광역 근사 | **AGREE** | `060` r=60 · `061` r=56 |
| 제네시스 적 광역+아군 치유 | **AGREE** | `063` aoe+`allyHealPct` · `applyAllyHealAroundPoint` |
| 카스 감속=`048` | **DISAGREE** | `048`은 신격학살. 감속은 `039`에 적용. `048`은 광역 근사만 |
| 아다만틴 `ignoreShield` 0→1 | **DISAGREE** | IgnoreDR=장갑. `ignoreArmor=1` 특수행 + 크래프트 타격 연동 |
| `listWeaponTradeItemIds` 삭제 | **HOLD** | 낮은 우선순위 · 이번 턴 미삭제 |
| 실제 탈취·함대증발 | **HOLD** | 기존 방침 유지 |

---

## 🗄 SUPERSEDED — 특수무기류 정밀검사 + 미완부분 대안 제시 · 2026-09-13 (김클로드 원문)

```text
status=SUPERSEDED
task_id=weapon-special-fx-system-inspection-20260913
kind=DEVELOPMENT_QA + GAP_REMEDIATION_PROPOSAL
code_changes=NO
전문=tools/kim-team-lead/reports/WEAPON_SPECIAL_FX_SYSTEM_INSPECTION_20260913.md
```

대표님 지시: 김팀장이 개발한 특수무기류의 연출·완성도·메모리효율·리스크 전수정밀검사 + 전체 무기리스트 미완부분에 기능작동 가능한 대안 제시 후 김팀장 전달.

**연출·기능 검사(AGREE — 실제 전투에 반영됨)**: `weaponSpecialFxPolicy.ts`+`weapon_special_fx_policy.csv`(34개 무기) 확인 — `capitalWeaponImpact.ts`에서 ignoreShield/ignoreArmor가 실제 데미지 계산에 전달되고, AoE·감속·실드박탈·요격이 전부 진짜 수치를 조작함(색만 다른 게 아님). `npx tsx src/combat/weaponSpecialFxPolicy.test.ts` 13/13 PASS 직접 재확인.

**메모리·리스크 전수검사(문제 없음)**: 정책·프레젠테이션 둘 다 Map 캐시, 틱 루프 전부 for문(신규 배열 생성 없음) — 이 프로젝트 Zero-Alloc 관례 준수 확인. 어제 발견한 드라코 VMock/웨이브 테스트 무기 12개가 특수무기 경로로 상점에 새는지도 확인 — `isCanonicalTradePortWeapon()`의 `tradePortListed` 필터로 정상 차단됨(리스크 없음). 부수로 `weaponItemBridge.ts`의 `listWeaponTradeItemIds()` 죽은 코드 1건 발견(낮은 우선순위).

**미완 부분 실측**: 34개 중 4개는 CSV 자신이 "연출만(예: 하이어라키=탈취 미구현)"이라 명시. 추가로 설명문에 강한 특수능력이 있는데 정책 테이블에 행 자체가 없는 무기 8개 발견(장거리순항·초광속·차원도약·옴니조준·월드에코·제네시스모함·카스의파멸·아다만틴함재기).

**대안(전부 기존 CSV 컬럼만 채우면 되는 안, 코드변경 없음)**: 전문 §4에 무기별 구체 값 제시 — 코스믹/신격 티어는 기존 최상급 광역+감속 조합으로 격 맞춤, 사거리로 이미 반영된 것(Global/Distant/Warp)은 아이콘·틴트만 추가, 아다만틴 함재기는 `ignoreShield` 값 오기 정정. **유일하게 코드 추가가 필요한 예외**: 제네시스 모함의 "아군 치유" 절반은 기존 AoE 함수가 적 팀만 순회하도록 짜여 있어 CSV만으로 불가 — 신규 소규모 함수(10줄 내외) 필요함을 명시.

코드·CSV값 전부 무변경. 전문 검토 후 반영 판단 요청.

---

## ✅ REVIEWED — 무기체계 전수검사·드론/함재기 검수안 반영 · 2026-09-13

```text
status=REVIEWED
task_id=weapon-drone-carrier-system-inventory-20260913
kim_team_lead_verdict=PARTIAL
applied=풀상한 항창 회수 · trySpawnCapitalCraftVolley · 본선 발사 경로 테스트 · 파이프라인 주석 정정
held=드라코 __DEV__ 가드 · CSV 밸런스 수치 변경
rejected=본선 미연결(오진 — TestLayer=본선 시뮬)
reviewed_at=2026-09-13
전문=tools/kim-team-lead/reports/WEAPON_DRONE_CARRIER_SYSTEM_INVENTORY_20260913.md
```

김클로드 1단계 인벤토리 §2-층4·§5 재검수 후 김팀장 결정:

| 주장 | 판정 | 조치 |
|---|---|---|
| 층4 본선 미연결 | **DISAGREE** | `PlanetEdenRaidTestLayer`는 허브·웨이브·STAGE3 **본선 시뮬**. 스폰/틱은 `pushCapitalProjectileMissile`에 이미 연결 |
| 재장전 2200ms vs 선회수명·poolHardCap | **AGREE** | `trySpawnCapitalCraftVolley` — 상한이면 가장 오래된 동패밀리 기체 회수 후 재스폰. weapon_list 곡선 미변경 |
| 본선 연결 테스트 부재 | **AGREE** | 프로덕션·VMock loiter active + 일제 스폰 회수 테스트 추가 |
| 파이프라인 주석이 테스트벤만 가리킴 | **PARTIAL** | 본선 시뮬·항창 회수 한 줄 명시 |
| 드라코 `__DEV__` 가드 | **HOLD** | 대표님 시험 베뉴 지시와 충돌. Metro 실기 유지 |
| 12개 CSV 프로필 밸런스 재조정 | **HOLD** | 기존값 변경 재확인 대상. 이번 턴 수치 안 건드림 |

---

## 🗄 SUPERSEDED — 무기체계 전수검사·드론/함재기 개발현황 · 2026-09-13 (김클로드 원문)

```text
status=SUPERSEDED
task_id=weapon-drone-carrier-system-inventory-20260913
kind=SYSTEM_INVENTORY (1단계)
code_changes=NO
전문=tools/kim-team-lead/reports/WEAPON_DRONE_CARRIER_SYSTEM_INVENTORY_20260913.md
```

대표님 지시: 김팀장이 드론·함재기 기초연출·기능 개발 중 — 먼저 전체 무기체계 전수검사 + 개발현황 파악, 완료되면 2단계 재검사·보고.

**전체 무기체계**: `weapon_list.csv` 82개 프로덕션(laser/missile/rocket/drone/carrier) + 신규 "드라코 VMock" 테스트 무기 10개(레이저+함재기/레이저+드론 5쌍) — 어제 PSS 조사에서 찾은 `dracoCombatTestVenue.ts`(`draco_haven`)와 같은 계열로 확인.

**드론·함재기 개발현황(3층 확인, 4층에서 미완성 발견)**:
1. 데이터(`weapon_craft_loiter_policy.csv`) — **완료**, 프로덕션 7드론+5함재기 전부 개별 튜닝 완료
2. 시뮬레이션 엔진(`capitalCraftPool.ts`) — **완료**, FSM 7단계·특수플래그 전부 구현·사전할당(Zero-Alloc 준수). `npx tsx --test` 재실행 **5/5 PASS**
3. 렌더링(`PlanetEdenRaidOrbitSkiaCombat.tsx:899-921`) — **완료**, 프로덕션 Skia 렌더러에 이미 드론(원)·함재기(오벌) 그리기 있음, 풀링된 Path 재사용(Make() 없음)
4. **본선 연결 — 미완성**: `tickCapitalCrafts`/`trySpawnCapitalCraft` 호출부가 `PlanetEdenRaidTestLayer.tsx`(드라코 테스트) **단 한 곳뿐** — 실제 플레이어 vs 실제 적 전투 시뮬레이션에는 아직 스폰/틱이 안 붙어 있음. `capitalWeaponPipeline.ts` 헤더 주석은 drone/carrier "연출O·전투O"라 적어놨는데, 이건 테스트 벤 기준이고 본선 기준으로는 이르다고 판단됨.

**2단계(개발 완료 후) 재검사 예정 항목**: 본선 훅에 스폰/틱 연결 여부 재확인, 발사주기-풀상한(8) 상충 여부, 어제 발견한 드라코 벤 프로덕션 노출 이슈가 이 타이밍에 정리됐는지, 신규 12개 CSV 프로필 밸런스, 본선 연결부 신규 테스트 존재 여부.

코드는 건드리지 않았다. 김팀장 개발 완료 신호 오면 2단계 진행.

---

## ✅ REVIEWED — PSS 대응 정밀 설계(A/B/C) · 2026-09-12 김팀장 결정

```text
status=REVIEWED
task_id=pss-1gb-memory-spike-investigation-20260911
kim_team_lead_verdict=PARTIAL
applied=C only (08:00 memory-budget-ledger)
held=A account_reset Fresco trim · B reset repro (2h map soak 중)
rejected=purge setTimeout yield · NativeReclaimStage에 account_reset 가짜 STAGE
reviewed_at=2026-09-12
```

김클로드 §8-5 재검수 후 김팀장 결정:

| 안 | 판정 | 이유 |
|---|---|---|
| **A** 리셋 후 `account_reset` trim | **HOLD** | 인용 줄은 맞음. 그러나 trim은 Fresco 비트맵. 09-11 스파이크는 native 330→504→623(카탈로그/Hermes 규모). STAGE union에 계정 리셋 섞는 건 계약 오염. 효과 검증(B) 전에 넣지 않음 |
| **B** 계정 리셋 재현 | **HOLD** | 지금 은하 지도 2h 정밀감시 중(PID 23159). 리셋하면 곡선 파기. soak 종료 후 별도 재현 |
| **C** 08:00 원장 | **APPLY** | 앱 무영향 · verdict 불변 · 2.5개월 방치 방지. `schedule-8am-kim-daily-auto-report.cjs`에 `shSafe`+handoff 한 줄 반영 |
| 2단계 purge `setTimeout(0)` | **REJECT** | 일을 줄이지 않고 레이스만 키움. 다음 런타임 1안은 **이미 enroll된 synth `set_catalog` 재실행 skip**(동일 버스트를 3번 돌리는 쪽) |
| Draco 벤 프로덕션 | 메모리 무관 · 별도 QA | 이번 반영 아님 |

---

## 🗄 SUPERSEDED — PSS 대응 정밀 설계(A/B/C) · 2026-09-12 (김클로드 원문)

```text
status=SUPERSEDED
task_id=pss-1gb-memory-spike-investigation-20260911
kind=IMPLEMENTATION_READY_DESIGN (라운드 4)
code_changes=NO
전문=tools/kim-team-lead/reports/PSS_1GB_OVER_MEMORY_SPIKE_INVESTIGATION_20260911.md §8-5
```

라운드 3의 느슨한 제안 2개를 **바로 diff로 옮길 수 있는 수준**까지 코드 재확인 후 구체화했다.

**A. 계정 리셋 직후 네이티브 트림 (3곳)**:
1. `nativeReclaimContracts.ts:3` — `NativeReclaimStage` union에 `'account_reset'` 추가
2. `nativeReclaimBootstrap.ts:30,46` — 기존 두 리스너(`nebula-lru-deferred`·`fresco-trim-deferred`) `stages` 배열에 `'account_reset'` 추가(로직 변경 없음)
3. `localAccountReset.ts` `finalizeLocalAccountResetNavigation`의 `navigateToTitle()`(314행) 직후 `scheduleDeferredNativeReclaimPass({stage:'account_reset', reason:'account_reset_complete'})` 한 줄 — 기존 IM+2×rAF+지연 게이트를 그대로 재사용, 신규 메커니즘 없음

**솔직한 한계**: 이 trim은 확인상 Fresco 비트맵 캐시 축(`trimNativeBitmapCachesAsync`, `arcfire-native-memory` 네이티브 모듈)이다. 안드로이드 dumpsys가 Hermes JS 힙도 종종 "Native Heap"으로 잡기 때문에, **이게 실제로 이번 스파이크에 효과 있을지는 적용 전 B로 먼저 검증 필요** — 과신하지 않고 검증 절차를 우선순위 1번으로 배치했다.

**B. 검증 절차**: 계정 리셋 재현하며 `mem-timeline.csv` 실시간 관찰 — native_heap이 리셋 직후 뛰는지 vs 허브 재진입 시점에 뛰는지로 A가 맞는 지점인지 먼저 확정.

**C. 메모리 예산 원장 정기화 (1곳)**: `schedule-8am-kim-daily-auto-report.cjs`의 `runDailyReport()` — 이미 상시 가동 중인 데일리 08:00 스케줄러(영구 루프 확인됨) 안, 기존 `shSafe()` 안전 패턴으로 `build-arc-memory-budget-ledger.ps1` 재실행을 끼워 넣고 결과를 매일 handoff 블록에 자동 기록. FAIL/OK 판정 로직은 안 건드림(원장 실패가 데일리 보고 자체를 막지 않게). 이러면 이번처럼 2.5개월 방치되는 게 구조적으로 막힘.

전문 §8-5-D에 우선순위(검증→A→C→문서정리→QA전달) 정리. 전부 기존 패턴 재사용, 신규 아키텍처 없음 — 김팀장이 그대로 diff화 가능.

---

## 🟡 PENDING(참고용, 코드 없음 — 읽기·측정만) — PSS 스파이크 전체 작업코드 전수검사 · 2026-09-12

```text
status=PENDING
task_id=pss-1gb-memory-spike-investigation-20260911
kind=MEMORY_INVESTIGATION (라운드 3 — 대표님 지시 「전체 작업코드 정밀 전수검사 + 관련 문서 재학습」)
code_changes=NO
전문=tools/kim-team-lead/reports/PSS_1GB_OVER_MEMORY_SPIKE_INVESTIGATION_20260911.md §8
```

오늘(09-11) 신규/변경된 5개 시스템(전투·웨이브디펜스 Draco 벤·행성체류·BM상점·선술집음성·은하지도) 전부 + 김팀장이 지목한 계정리셋/WorldExpansion 경로(`purgeLocalAccountData`·`syncArcCoreGlobalWorldExpansionSync`·`set_catalog`·런타임 원반베이크 큐)를 직접 읽고, Explore 서브에이전트로 나머지 4개 시스템을 독립 재검사했다.

**결론**: **어느 하나에서도 고전적 누수 버그(dispose 누락·무한누적·매프레임 재할당)를 못 찾았다** — 전부 이 프로젝트 관례(캡·메모이제이션·dispose 토큰)를 지키고 있었다. 유일한 실제 결함은 메모리와 무관: **Draco 전투 테스트 벤이 `__DEV__` 가드 없이 실제 은하(`draco_haven`)에 라이브로 연결돼 전 플레이어에게 노출됨**(QA 이슈로 별도 전달 권고).

**문서 재학습에서 나온 중요 사실**: `docs/MEMORY_REFACTOR_MASTER_PLAN.md`의 마지막 실측이 **6월 27일**(석 달 전)이고 그때도 이미 목표 초과였음(PSS p50 937.9/목표750·native p50 565.5/목표350). `npm run audit:memory-budget-ledger`(읽기전용, 기기 연결 확인 후 직접 재실행)로 **지금 재측정**: PSS p50 **792.8MB**·native p50 **374.3MB** — 6월보다 상당히 개선됐지만 목표엔 살짝 못 미침. 이 재측정으로 **어젯밤 1179MB 스파이크가 "원래 이랬다"가 아니라 평소보다 튄 이상치임을 확인** — 김팀장의 "계정리셋+WorldExpansion" 연관이 여전히 최유력.

**현재 최선의 가설(버그 아님)**: 개별 조각은 전부 가벼운데(`set_catalog`=문자열배열 교체, 원반베이크 큐=QUEUE_MAX 2로 강제 제한), `purgeLocalAccountData`(30여 스토어 순차 리셋)+`syncArcCoreGlobalWorldExpansionSync`(78성계 일괄 재통합)가 **동시에 몰리는 일회성 버스트 총합**이 원인일 가능성이 가장 높음 — 안드로이드 네이티브 할당기가 압박 전엔 즉시 반환 안 하는 특성과 겹침.

**제안(미실행)**: 계정리셋 완료 직후 기존 `runPlanetHubSoftNativeReclaimPass`류 패턴으로 native trim 1회 추가 검토, 리셋 실기 재현으로 native_heap 실시간 관찰(리셋 즉시 vs 재진입 시점 구분), `audit:memory-budget-ledger` 정기 재실행 관례화, 깨진 문서 참조(`docs/2.1.memory.md` 등) 정리.

---

## ✅ REVIEWED — PSS 1GB 스파이크 조사 (김클로드 분석 재대조) · 2026-09-11

```text
status=REVIEWED
task_id=pss-1gb-memory-spike-investigation-20260911
kim_team_lead_verdict=PARTIAL
kim_claude_verdict=ANALYSIS_ONLY
reviewed_at=2026-09-11
code_changes=NO — 플래그/80장 PNG 끄지 않음(주원인 아님)
전문=tools/kim-team-lead/reports/PSS_1GB_OVER_MEMORY_SPIKE_INVESTIGATION_20260911.md
```

김클로드 전제 재검수(코드·파일 헤더·mem-timeline 원자료):

| 주장 | 판정 | 근거 |
|---|---|---|
| 오늘 PSS 1GB 3회 · 09-06~10엔 없음 | **AGREE** | 22:15 1179 / 22:48 1056 / 23:03 1133 |
| GL 회복해도 PSS가 안 내려감 · 범인은 native_heap | **AGREE** | 23:03→23:19 GL 150→46.7, native 485→457, PSS 1133→1016. 재시동 후에야 663 |
| 모니터 GL/Skia 추정이 이번 건은 빗나감 | **AGREE** | 지도 Voronoi/별빛 최적화는 JS·Delaunay 축. native floor와 별개 |
| `TEMP_ADMIN_ARCADIA_GLOBE_BAKE=true` · 80장 신규 | **AGREE** | 플래그 true · 80 PNG 실재 |
| 80장 베이크가 native_heap 1GB의 최유력 원인 | **DISAGREE** | 전부 **256×256**, 디스크 합 **6.1MB**. 80장 전량 디코드해도 RGBA ≈ **21MB**. 485~623MB native와 자릿수가 안 맞음 |
| Fresco/reclaim이 이 경로에 미연결 | **PARTIAL** | 주석 "prewarm·remount 키 미연결"은 맞음. 다만 `trimNativeBitmapCachesAsync`는 hub soft/planet_change/map ingress에 **이미 배선**. 마운트 중 Image 1장(~84px 표시)은 trim이 안 지움 — 그게 500MB는 아님 |
| 채증 로그가 재시작 직후라 확정 못 함 | **AGREE** | `incident-logcat-20260911-232018` = POST_REMEDIATION |

**김팀장 결론**: 김클로드가 맞춘 축은 **「GL 회복 ≠ PSS 회복 · native_heap floor」**. 원인 지목(허브 원반 80장)은 용량이 안 되어 기각. 플래그 A/B로 끌 이유 없음(시각만 사라지고 floor는 남을 가능성 큼).

오늘 실측과 맞는 잔여 축(다음 조치 후보, 이번 턴 미착수):
- 22:02 계정 리셋 + `WorldExpansion target=78` + `set_catalog` 152+93+169행성 — native 330→504→623 점프와 시각이 맞음
- 허브 복귀 Views 393(21:28은 669) — Yoga/네이티브 뷰 잔류
- 지도 쪽은 해금 성계 Voronoi/별빛 사이트 캡·존 컬링은 이미 반영(JS 피크). native floor 본축은 아님

---

## 🗄 SUPERSEDED — PSS 1GB 초과 메모리 스파이크 조사 · 2026-09-11 (김클로드 원문)

```text
status=SUPERSEDED
task_id=pss-1gb-memory-spike-investigation-20260911
kind=MEMORY_INVESTIGATION
code_changes=NO
전문=tools/kim-team-lead/reports/PSS_1GB_OVER_MEMORY_SPIKE_INVESTIGATION_20260911.md
```

대표님 지시: "오늘 김팀장 작업분량 적용으로 PSS가 1GB를 넘고 있다. 최적화 가능한 부분 전수 정밀 조사 후 별도 보고."

**실측 확인(AGREE)**: `tools/long-run-monitor/logs/mem-timeline.csv` 원자료 직접 판독 — 오늘 22:15~23:04 **PSS 1179.5MB·1056.7MB·1133.3MB 3회 1GB 초과**, 09-06~09-10 로그엔 없던 패턴(전부 200MB대 이하) — "오늘부터"라는 진단과 시점 일치.

**중요 발견 — 기존 자동회복이 진짜 범인을 못 잡고 있음**: 스파이크 컬럼을 분해하니 `gl_mb`는 150→46.7로 정상 회복(`GL_RECOVERED`)했는데 `pss_mb`는 거의 안 내려감(1133.3→1016.5) — **`native_heap_mb`(485~623MB, PSS 절반 이상)가 회복 이벤트에도 그대로 남아있었다.** 프로세스 강제 재시작 후에야(663MB) 정상화. 기존 모니터의 "GL/Skia" 추정 자체가 이번 건은 과녁이 빗나가 있다.

**최유력 후보(미확정)**: 오늘 `assets/images/planet/baked/*.png` 80장이 신규 추가되고 `TEMP_ADMIN_ARCADIA_GLOBE_BAKE=true`로 켜져, 허브 초상이 SVG(비트맵 0)에서 베이크 PNG `<Image>` 디코드로 전환된 것으로 보임(`planetHubSubcomponents.tsx:228-266`). 이 기능의 소스 파일(`tempAdminArcadiaGlobeBake.ts:4`) 자체 주석이 "prewarm·remount 키 미연결"이라고 명시 — 기존 Fresco/native reclaim 파이프라인(`runPlanetHubSoftNativeReclaimPass.ts`)이 이 신규 이미지 경로를 제대로 회수하는지 설계 시점에 검증 안 됐을 가능성. **단, 오늘 채증 로그가 스파이크 순간이 아니라 재시작 직후를 찍어서(§5-3, 채증 타이밍 갭) 실기로 100% 확정은 못 함** — 확정 재현 절차(플래그 off 후 A/B 비교)를 전문 §4에 제안.

**부수 발견**: `nebula/baked` 21장 재베이크로 평균 900KB→530KB(이전 세션 에셋 감사 권고 반영, 좋은 방향이나 530KB는 600KB 캡에 근접해 개별 파일 재점검 여지 있음). 정적 `audit:memory:all`은 오늘도 37/37 PASS — 이런 실측 스파이크는 애초에 그 감사망 밖.

읽기·측정만 했고 코드/설정/플래그 전부 무변경. 전문 §4(재현 절차)·§6(요약) 참고.

---

## ✅ REVIEWED — inbound 질문 안 B + human-first P0~P3 반영 · 2026-09-10

```text
status=REVIEWED
task_id=arc-core-chat-inbound-proactive-question-review-20260909
kim_team_lead_verdict=REVIEWED
applied=안 B 수락 시 클라우드 질문 1회 + 로컬 질문 폴백 · P1 키워드/intent 조임 · P2 잡담 로테이션 · P3 주석 · P0 테이블 재빌드
reviewed_at=2026-09-10
```

김클로드 전제 **AGREE** 후 김팀장 반영:
- inbound why 문구를 질문형 폴백으로 교체. 수락 `onPress`는 opener 확정 뒤에만 채널 오픈.
- 팩 `inboundWhy` + Lambda Inbound open 지시. `QUOTA_PER_MIN`은 uid당 POST 전체(전송·inbound 공유).
- P1: topics CSV + `classifyArcCoreChatIntent`에서 맨몸 `여기`/`결과`/`활력`/`누구` 제거.
- P2: smalltalk 3+2 로테이션. P3: worldProposal 주석 정정.

---

## ✅ REVIEWED — "성인 남성 자연대화+시스템연동" 재검수 라운드 2 반영 · 2026-09-10

```text
status=REVIEWED
task_id=arc-core-chat-human-first-intelligence-verification-20260909
kind=RE_VERIFICATION (라운드 2) → 김팀장 반영
kim_claude_verdict=PARTIAL
kim_team_lead_verdict=REVIEWED
applied=P0 유지 재빌드 · P1/P2/P3 코드 반영
```

---

## 🗄 SUPERSEDED — "성인 남성 자연대화+시스템연동" 재검수 라운드 2 (이력 · 2026-09-10 당시)

```text
status=SUPERSEDED
task_id=arc-core-chat-human-first-intelligence-verification-20260909
kind=RE_VERIFICATION (라운드 2) — 이후 김팀장 P1/P2/P3 반영 · 상단 REVIEWED
code_changes=NO (당시 읽기 전용)
kim_claude_verdict=PARTIAL — 당시 P1/P2/P3 미착수. 2026-09-10 김팀장 반영 후 상단 REVIEWED
전문=tools/kim-team-lead/reports/ARC_CORE_CHAT_HUMAN_FIRST_INTELLIGENCE_VERIFICATION_20260909.md §10~13
```

대표님 지시: "김팀장 작업 완료. 재검수하라."

**실측 재확인 — P0 해결됨(AGREE)**: `npm run build:content-tables` 재실행 확인(생성 파일 타임스탬프가 소스 CSV보다 최신으로 갱신됨). `npx tsx --test arcCoreChatConversation.test.ts` 재실행 — **24/24 전부 PASS**(라운드1 FAIL이던 "asked seats and trade…" 통과). "12좌가 뭐야?" 류 시스템 질문은 이제 정상 작동.

**보너스 확인**: `arc_core_chat_persona.csv` 전체가 "성인 남자" 톤으로 다시 쓰임(temperament/goal/style/tone 4행) — 요청 범위 밖이었지만 잘 반영됨.

**미해결 — 라운드1 P1이 실측 재현으로 격상됨(DISAGREE, 아직 안 고쳐짐)**: `hintArcCoreChatTopicId`(단어경계 없는 부분일치)를 **직접 호출해 실측** — `"오늘 좀 활력이 없다"`→`cores`, `"숙제 결과 어때"`→`combat`, `"누구 왔어?"`→`self`, `"나 요즘 여기 되게 심심해"`→`location`. **순수 일상 말 4건 전부 시스템 축으로 오분류되는 걸 이번에 실측으로 재현**했다 — §0-H의 "일상 말에 시스템 가로채기 금지" 약속이 이 케이스들에서 실제로 깨짐. 라운드1엔 "위험"이었는데 이번엔 "확정 결함"이다.

**나머지 미해결(코드 무변경 확인)**: P2(로컬 캐주얼 폴백 고정 문장 2개, `ko.ts:838-839` byte-identical) · P3(`arcCoreChatWorldProposal.ts` 헤더 주석-동작 불일치, 파일 byte-identical) — 둘 다 라운드1 그대로.

**종합**: 이번 "작업 완료"는 P0(빌드)+페르소나 톤, 두 가지 범위였던 것으로 보임. P1(오분류, 최우선 승격 권고)·P2·P3는 아직 손 안 댐 — 전문 §12에 우선순위 갱신.

---

## 🗄 SUPERSEDED — 아크코어 선제대화(inbound) 질문형 전환 = 안 B 채택 · 2026-09-09 (이력)

```text
status=SUPERSEDED
task_id=arc-core-chat-inbound-proactive-question-review-20260909
kind=DESIGN_REVIEW → DIRECTIVE — 이후 김팀장 안 B 구현 · 상단 REVIEWED
code_changes=NO (당시 설계만)
directive=대표님 명시 — 안 B 채택. 2026-09-10 김팀장 반영 완료
전문=tools/kim-team-lead/reports/ARC_CORE_CHAT_PROACTIVE_QUESTION_DESIGN_REVIEW_20260909.md §6
```

대표님 지시: 아크코어가 먼저 질문/일상대화를 시도하는 설계가 되고 있는지 검토(대표님 관찰: "지금은 단순 규칙 알림창만, 질문·대화 시도는 안 함").

**확인 결과 대표님 관찰이 정확함**: `arcCoreInboundTalkRequest.ts`(45~90초 최초 지연·8~15분 쿨다운·safe-slot 타이머)가 "왜 열렸는지" 이유 5종(spy/combat/story/observe/idle)은 판정하지만, `arcCoreInboundTalkWhy.ts:18-42`의 실제 문구 5개 전부 **마침표로 끝나는 통보문**이고 물음표(질문)가 하나도 없음(story만 GM steerLine으로 약간 동적, 나머지 4개 완전 고정). `arcCoreChatOpenSpeech.ts:20-23`가 이 텍스트를 가공 없이 그대로 첫 대사로 꽂아 **클라우드 LLM을 아예 안 거침** — §0-H "성인 남성 자연대화" 파이프라인은 플레이어가 먼저 말 걸 때만 작동하고, 아크코어가 먼저 걸 때는 전혀 연결 안 돼 있음.

**대표님이 안 B를 채택**했다 — 수락 시점에 새 F1(클라우드) 호출 지점을 열어 그 순간 상황에 맞는 질문을 LLM이 즉석에서 짓는 방식. **지금 바로 착수 아님** — 김팀장의 현재 진행 중인 전수검사 완료 후, 대표님이 별도로 실행 지시를 다시 내린 뒤 진행. 착수 전 선결 확인 사항(전문 §6에 정리): 서버 쿼터(`QUOTA_PER_MIN=8`)가 inbound 수락도 같은 카운터를 타는지, `npm run audit:arc-core-chat-billing`이 새 호출 지점을 전제해도 유효한지, PSS `hot_path`를 "전송 1회"에서 "전송 1회 + inbound 수락 1회"로 갱신해야 하는지.

---

## 🗄 SUPERSEDED — "성인 남성 자연대화+시스템연동" 재검수 · 2026-09-09 (이력)

```text
status=SUPERSEDED
task_id=arc-core-chat-human-first-intelligence-verification-20260909
kind=RE_VERIFICATION — 이후 P0~P3 반영 · 상단 REVIEWED
code_changes=NO (대표님 지시 — 코드/빌드 실행도 포함해 엄격히 미착수)
kim_claude_verdict=PARTIAL — §0-H/§0-H-2 설계·라우팅 로직 자체는 AGREE(방향 맞음), 그러나 실제 런타임 동작은 DISAGREE(핵심 기능 4종 죽어 있음)
전문=tools/kim-team-lead/reports/ARC_CORE_CHAT_HUMAN_FIRST_INTELLIGENCE_VERIFICATION_20260909.md
```

대표님 지시: "성인 남성 수준 자연대화 + 게임 시스템 지적 대화" 의도가 실제로 코드·설계에 반영됐는지 집중 검증(코드 작업 없이).

**P0(최우선, 실측 재현됨)**: `tables/content/arc_core_chat_topics.csv`·`arc_core_chat_knowledge.csv`가 `seats`(12좌)·`cores`(행성지표)·`trade`(무역소)·`shipyard`(조선소) 4개 신규 지식축을 담고 있는데, **`npm run build:content-tables`가 그 이후 재실행되지 않아** `src/data/generated/csvArcCoreChatTopics.ts`·`csvArcCoreChatKnowledge.ts`(CSV보다 78~99분 더 오래됨)에 이 4개가 통째로 빠져 있음 — **지금 앱에서 "12좌가 뭐야"/"무역소 있어?" 류 질문이 전부 인식 안 됨.** `npx tsx --test src/arcCore/chat/arcCoreChatConversation.test.ts` 직접 실행해 **24개 중 1개 FAIL로 실측 재현**(`asked seats and trade stay knowledge talk` — topicId expected 'seats' got 'other'). §0-H-2가 약속한 6개 시스템 지식축 중 4개가 지금 죽어 있다는 뜻 — 대표님이 "지적 수준 대화 확인 못 함"이라 느낀 핵심 원인일 가능성 높음. **`npm run build:content-tables` 재실행 + 테스트 재확인이 최우선.**

**P1**: `arcCoreChatTableIndex.ts:169` `hintArcCoreChatTopicId`가 단어경계 없는 부분일치(`includes`)라 "여기 되게 심심해"(location `여기`)·"활력이 없다"(cores `활력`)·"결과 어때"(combat `결과`) 같은 일상 문장이 시스템 축으로 오분류될 위험 재현 가능(코드 추적으로 확인, 실기 미목격·테스트 0건).

**P2**: 로컬(오프라인) 캐주얼 폴백이 `arcCoreChat.reply.smalltalk`/`smalltalkAgain` 고정 문장 2개뿐 — 클라우드 실패 시(쿼터·타임아웃 등, 이전 라운드에서 이미 실측됨) 이 문서 자신의 불합격 기준("매 턴 같은 말")에 정확히 걸림.

**P3(낮음)**: `arcCoreChatWorldProposal.ts` 헤더 주석("LIVE=false면 제안 항상 null")과 실제 사용 함수(`suggestArcCoreChatWorldProposal`, LIVE 플래그 미참조)가 불일치 — 지금은 무해(집행 함수 없음)하나 향후 오해 소지.

잘 된 부분(AGREE)도 기록: Lambda 프롬프트 Layer 0/1 계층화(`pack.ts`)는 브리핑 강제 방지가 실제로 프롬프트에 반영됨, 인간우선 게이트 자체 단위 로직은 정확함(문제는 입력 topicId 신뢰성), world-write 경계 전부 준수.

전문 §7에 다음 단계 제안(재빌드 최우선) 정리. 이번 세션은 지시대로 **`npm run build:content-tables`조차 실행하지 않음** — 김팀장 확인 후 직접 재빌드 권장.

---

## 🟡 PENDING(참고용, 코드 없음) — 아크코어 인격·지적능력·대화수준 고도화 설계 · 2026-09-09

```text
status=PENDING
task_id=arc-core-chat-personality-intelligence-upgrade-design-20260909
kind=DESIGN_ANALYSIS
code_changes=NO (대표님 명시 — "코드작업은 하지말것")
전문=tools/kim-team-lead/reports/ARC_CORE_CHAT_PERSONALITY_INTELLIGENCE_UPGRADE_DESIGN_20260909.md
```

대표님 지시: NL 연동 완료 후 "아크코어 인격·지적능력·대화수준 고도화" 가능성 전수 조사 + 설계(코드 미착수).

**중요 발견 1**: `docs/대화형_아크코어_구현.md` §0-F의 H1~H6 인격화 로드맵(일화 태그·톤 고정·문장분할·DND·선호추출·뉘앙스힌트) + §0-G GM 축이 **전부 이미 코드로 구현·가동 중**임을 직접 대조 확인(문서 표기는 아직 "대기"처럼 보임 — 문서가 실제보다 뒤처짐).

**중요 발견 2**: 지금 아크코어가 "관측"하는 시스템은 위치·스파이·전투1건·현재행성코어5값·공지1건·미션1건뿐 — 경제(금고)·팩션/외교·은하이동·함선보유·캡틴관계·전투태세 등은 전부 안 보임. Explore 서브에이전트로 전 저장소를 재조사해 8개 신규 read-tool 후보(팩션소속+관계·이동상태·식민단계·함선격납고개수·캡틴호감도·미션게시판규모·전투태세·파일럿레벨)를 스칼라/라벨/개수만 노출하는 형태로 설계함 — 전부 §6 기존 화이트리스트(전 행성/프로필/금고/함선 스냅샷 금지) 안에서.

**자체 오류 정정 기록**: 1차 조사에서 "함선 보유·캡틴 관계 시스템이 없다"고 잘못 판단했다가, Explore 재조사로 실제 존재를 확인하고 문서 내에서 직접 정정함(§3-1).

**하지 않기로 한 것**: 경제(금고 잔액) 노출은 능력 문제가 아니라 헌법상 의도적 금지로 유지 권고. 코드 변경 없음 — 순수 설계·우선순위 제안 문서.

---

## ✅ REVIEWED — 인게임 아크코어 NL 관측성 플러밍 라운드 4 · 2026-09-09

```text
status=REVIEWED
task_id=arc-core-chat-nl-template-fallback-analysis-20260909
kind=BUG_FIX + OBSERVABILITY
code_changes=YES
kim_claude_verdict=PARTIAL (로그 경로 AGREE · 「미배포」 DISAGREE)
kim_team_lead_verdict=REVIEWED
reviewed_at=2026-09-09
applied=providerId/fallbackUsed UI 플러밍 수용 · __DEV__ [dev] cloud|local 배지 유지
scope=src/arcCore/chat/arcCoreBackchannelReply.ts, src/arcCore/chat/presentArcCoreBackchannel.ts, src/ui/overlay/content/ArcCoreChatOverlayContent.tsx
```

김팀장 판정:
- **로그가 UI까지 버려짐** — **AGREE**. `buildArcCoreBackchannelReply`가 text만 넘기던 구조 확인. 객체 반환 + submit 통과 + `__DEV__` 배지·`lastDebug`는 persist 없음 · footer deps에 `lastDebug` 포함. 호출부 1곳.
- **「라운드3 미배포」** — **DISAGREE**. Lambda는 이미 `update-function-code`로 반영됨(KeyLen=56). git 미커밋 ≠ 미배포. 라운드4는 클라 전용이라 추가 Lambda 배포 불필요.
- 인게임이 템플릿처럼 보인 최근 원인은 미연결이 아니라 Groq가 G3 문장을 복붙한 것(실기 저장 대화). 프롬프트 금지 문구는 김팀장이 Lambda에 반영함.

개발 빌드 `r` 후 입력창 위 `[dev] cloud` / `[dev] local(fallback)` 로 경로 확인.

---

## ✅ REVIEWED — 인게임 아크코어 NL 간헐 `no_model` 수정 적용 라운드 3 · 2026-09-09

```text
status=REVIEWED
task_id=arc-core-chat-nl-template-fallback-analysis-20260909
kind=BUG_FIX
code_changes=YES
kim_claude_verdict=AGREE (§9-1 원인 · §10-D 패치)
kim_team_lead_verdict=REVIEWED
reviewed_at=2026-09-09
applied=groqInvoke D안 수용 · Lambda code-only 재배포(키 유지) · Groq 실호출 6/6 ok
scope=aws/arc-core-chat/src/groqInvoke.ts, aws/arc-core-chat/src/handler.test.ts
self_check=handler.test 17/17 PASS · Groq probe 6/6 finish=stop empty=0 · KeyLen=56
```

김팀장 판정: **AGREE**. gpt-oss 추론 토큰이 `max_tokens` 예산을 잠식해 빈 content→`no_model`이 되는 설명은 이전 CloudWatch `ok`/`no_model` 혼재와 맞다. 패치(`max_completion_tokens=384` · `reasoning_effort=low` · `reasoning_format=hidden` · gpt-oss만 게이팅 · `<think>` 스트립 유지)는 최소 diff이고 비추론 모델에 파라미터를 안 붙인 점도 맞다. `llama-3.1-8b-instant` 회귀 보류는 이 계정 모델 목록에 해당 id가 없어 **AGREE**.

배포는 `sam deploy`가 아니라 **`update-function-code`만**(template env `''`로 키를 덮지 않음). Groq 동일 바디 실호출 **6/6 content 있음 · empty 0**.

인게임 최종 확인: Metro `r` 후 `[arcCoreChat] cloud ok`.

---

## ✅ REVIEWED(참고) — 인게임 아크코어 NL 간헐 `no_model` 원인 재검수 라운드 2 · 2026-09-09

```text
status=PENDING
task_id=arc-core-chat-nl-template-fallback-analysis-20260909
kind=BUG_ANALYSIS (코드 변경 없음 — 이 영역은 김팀장 활성 작업, 임의 구현 안 함)
code_changes=NO
전문=tools/kim-team-lead/reports/ARC_CORE_CHAT_NL_TEMPLATE_FALLBACK_ANALYSIS_20260909.md §7~12
```

대표님 지시: "김팀장 수정 완료. 전수 정밀 검사 + 최종 목표(인앱 NL) 재분석."

**라운드 1 판정 재확인(AGREE)**: 김팀장이 적용했다는 A-1(배포 스크립트 자동 키주입·`no_key` reason 분리·`hasKey` 로그)을 코드로 직접 재확인 — `deploy-groq-free-tier.ps1`·`llmInvoke.ts`·`handler.ts` 전부 정확히 반영됨. `npx tsx --test aws/arc-core-chat/src/handler.test.ts` 12/12 PASS 재실행 확인. 김팀장의 "지금은 no_key 상시 아님(키 있음·ok/no_model 혼재)" 정정에도 AGREE.

**라운드 2 신규 발견(최유력, 코드 미확인이었던 영역)**: `groqInvoke.ts:3`의 `DEFAULT_GROQ_MODEL='openai/gpt-oss-20b'`는 **추론(reasoning) 모델**인데, 숨은 추론 토큰이 응답 토큰 예산(`max_tokens: 256`, 실제 Groq 파라미터명은 `max_completion_tokens`)을 그대로 잡아먹고, `reasoning_effort`(기본 medium)·`reasoning_format`을 코드가 지정하지 않아 프롬프트마다 추론 분량이 달라짐 — 어떤 턴은 추론 후 답변까지 나와 `ok`, 어떤 턴은 추론만으로 예산이 바닥나 content가 빈 문자열이 되어 `no_model`. **김팀장이 관측한 "ok/no_model 혼재" 패턴과 정확히 일치**(Groq 공식 문서 `console.groq.com/docs/reasoning` 직접 조회로 검증). 부수로, 추론 도중(닫는 `</think>` 전) 예산이 바닥나면 `<think>` 스트립 정규식이 못 지워 **모델 사고 과정 원문이 플레이어에게 그대로 노출될 위험**도 코드상 열려 있음(아직 실기 목격 안 됨). 또한 원 설계 문서(`READY_ARC_CORE_CHAT_FREE_TIER_NL.md:29`)는 비추론 모델 `llama-3.1-8b-instant`를 명시했는데 실제 코드는 `gpt-oss-20b`로 바뀌어 있음 — 변경 사유 문서 없음.

**제안(미적용)**: `groqInvoke.ts`에 `reasoning_effort:'low'`·`reasoning_format:'hidden'` 추가 + `max_tokens`→`max_completion_tokens` 파라미터명 정정. 또는 원 설계대로 `llama-3.1-8b-instant`로 회귀 검토(대표님/김팀장 판단 필요 — 품질 트레이드오프 있음). 상세 근거·검증 방법은 전문 §9~11.

---

## ✅ REVIEWED — 인게임 아크코어 NL 템플릿 고착 원인 분석 · 2026-09-09

```text
status=REVIEWED
task_id=arc-core-chat-nl-template-fallback-analysis-20260909
kind=BUG_ANALYSIS
code_changes=NO (분석) → 김팀장 후속: deploy 스크립트 A-1 + OPS 문서 + Lambda 진단로그
kim_claude_verdict=PARTIAL (배포스크립트 결함 AGREE · 「현재 항상 no_key」는 DISAGREE)
kim_team_lead_verdict=REVIEWED
reviewed_at=2026-09-09
applied=deploy-groq-free-tier.ps1 A-1(키 자동주입) · OPS §B 정정 · llm no_key 구분·hasKey 로그
```

### 김팀장 실측 재검수

| 주장 | 판정 | 근거 |
|------|------|------|
| `deploy-groq-free-tier.ps1`가 없는 CFN `GroqApiKey`를 override · 배포 후 키 주입 안내 누락 | **AGREE** | 스크립트·OPS §B 확인. A-1 반영 완료 |
| **지금** Lambda 키가 비어 `no_key`→항상 템플릿 | **DISAGREE** | `KeyLen=56` · CloudWatch `ok`(textLen 40/48)와 `no_model` **혼재** |
| 호출 경로 cloud→실패→local G3 | **AGREE** | `completeArcCoreChatReply` 경로 재확인 |
| Firebase 익명 미비 가능 | **미확정** | 요청이 서버에 도달하므로 전량 unauthenticated는 아님 |
| `getArcCoreChatReplyProvider` 죽은 코드 | **AGREE**(원인 아님) | 호출 0 · 정리 후보 |

**현재 남은 문제**: 서버는 이미 간헐 NL(`ok`)인데, 턴마다 `no_model`도 나와 그 턴은 템플릿 폴백. 인게임이 “항상 템플릿”처럼 보이면 (1) Metro 미반영 (2) `no_model` 비율 (3) 클라 quarantine. 대표님께 Metro `r` 후 `[arcCoreChat] cloud ok` 확인 요청.

전문: `tools/kim-team-lead/reports/ARC_CORE_CHAT_NL_TEMPLATE_FALLBACK_ANALYSIS_20260909.md`

---

## 📝 원문 보관 — PENDING 분석 요약 · 2026-09-09

```text
status=PENDING (archived after REVIEWED)
task_id=arc-core-chat-nl-template-fallback-analysis-20260909
kind=BUG_ANALYSIS (코드 변경 없음 — 대표님 지시로 착수 보류 중)
code_changes=NO
전문=tools/kim-team-lead/reports/ARC_CORE_CHAT_NL_TEMPLATE_FALLBACK_ANALYSIS_20260909.md
```

대표님 지시: 김팀장 Lambda/Groq 인게임 NL 연동 작업이 계속 템플릿 대화만 나오는 버그로 안 되고 있어 별도 분석 요청 — **코드는 아직 건드리지 말 것**(김팀장 작업 완료 후 또는 반복 실패 시에만 착수).

**최유력 원인**(김클로드): `template.yaml`에 `Parameters: GroqApiKey` 없는데 deploy/OPS가 `--parameter-overrides GroqApiKey=...` — 키 빈 값 → `no_key`→템플릿. (김팀장: 프로세스 위험은 맞으나 **현재 실기는 키 있음·ok 혼재**로 수정 판정.)

---

## ✅ REVIEWED — 설치 용량 최적화 기반작업(에셋 크기 예산 감사 툴) 신규 · 2026-09-06

```text
status=REVIEWED
task_id=asset-size-budget-audit-foundation-20260906
kim_team_lead_verdict=REVIEWED
applied=audit툴수용 · FAIL에셋압축(npc/ship/nebula/pip) · bar Image resizeMethod · memory:all 편입보류
reviewed_at=2026-09-06
```

김팀장 판정: 기반툴(CSV 정책·`audit:asset-size-budget`·npm script)은 AGREE로 수용한다. 하드캡 FAIL 에셋은 npc/ship/nebula/pip 압축을 이미 진행했고, 바 라운지·공연 `<Image>`에 Android `resizeMethod="resize"`를 추가했다(표시 로직 변경 없음). `audit:memory:all` 편입은 잔여 WARN 정리·재베이크 정책 확정 후로 보류한다. 유니크초상 맵 자동생성은 후속.

---

## 📝 원문 보관 — 설치 용량 기반작업 PENDING 본문 · 2026-09-06

```text
status=PENDING (archived after REVIEWED)
task_id=asset-size-budget-audit-foundation-20260906
kind=NEW_TOOLING (감사 스크립트 신규 · 게임 로직 변경 없음)
code_changes=YES (신규 파일만, 기존 파일 수정 0건 — package.json scripts 1줄 추가 제외)
kim_claude_verdict=N/A (신규 조사·툴링, 기존 설계 재검수 대상 아님)
scope=tables/content/asset_size_budget_policy.csv(신규), tools/debug/audit-asset-size-budget.mjs(신규), package.json(스크립트 1줄 추가), docs/바_종업원_유니크초상_로딩전략_검토.md(신규, 별건이나 같은 세션)
self_check=tsc --noEmit -p tsconfig.client.json 0에러 · npm run audit:asset-size-budget 정상 실행(의도된 FAIL, 아래 참고) · 기존 audit:memory:all·package.json 기존 스크립트 무변경
risk=낮음 — 신규 독립 스크립트, 어떤 런타임 코드도 import하지 않음. audit:memory:all 체인에 편입하지 않았음(기존 콘텐츠 다수가 하드캡 초과라 즉시 편입 시 그 체인 자체가 항상 FAIL 상태가 됨 — 편입 여부는 대표님/김팀장 판단 대기)
```

**대표님 지시**: 「설치용량의 최적화를 위한 기반작업이 가능한가?」

### 결론 — 가능. 실제로 만들어서 돌려보니 구체적 문제 목록이 바로 나왔다

`tools/debug/audit-planet-globe-assets.ts`(기존 허브 원반 베이크 감사)를 템플릿 삼아, `assets/images/` 전수를 카테고리별 용량 예산(warn/hardCap)으로 점검하는 범용 감사 스크립트를 새로 만들었다. 정책은 Table-First 원칙에 따라 CSV(`asset_size_budget_policy.csv`)로 분리했다 — 카테고리별 warnKb/hardCapKb는 실측(`npc_portrait`는 기존 `NPC_CAPTAIN_PORTRAIT_ASSET_CONTRACT.md`의 "145px contain" 표시 기준, `planet_globe_baked`는 기존 `audit:planet-globe-assets`의 256KB 계약과 동일하게 맞춤)에 근거했다.

`npm run audit:asset-size-budget` 실행 결과(신규 등록):

- 총 165개 이미지 · 36.1MB
- 카테고리별: `nebula_backdrop` 21개/18.7MB(최대), `planet_globe_baked` 80개/6.2MB, `npc_portrait` 25개/5.0MB, `ship_portrait` 13개/4.4MB, `planet_backdrop` 14개/1.9MB, `misc` 6개/0.6MB, `effects` 6개/0.1MB
- **WARN 13건**(권장 초과, 즉시 실패 아님)
- **FAIL 49건**(하드캡 초과, exit 1) — 가장 큰 단일 기회는 `assets/images/nebula/baked/*.png` **21개 전부**(819~980KB, 캡 600KB) 약 18.7MB. 다음은 `assets/images/ship/*.png` 5개가 캡(200KB) 대비 3.5~4배(696~756KB). `npc_portrait` 15건도 캡(150KB) 초과 — 이 중 `bar_att_char006~015.png`(10개, 162~195KB)는 **직접 파일을 열어 재확인한 결과 orphan이 아니라 `src/game/barAttendantPortraitAssets.ts`에 이미 실제로 wiring된 신규 샘플 10장 순환**(김팀장이 이전 5장 bargirl 순환을 교체, 파일 내 주석 "샘플 10장 판정용" 확인)이었다 — 즉 최근 실제 배포 자산이지 방치된 미사용 파일이 아니다.

### 다음 단계 제안(선택, 미실행)

1. `nebula/baked/*`는 절차적 베이크 산출물(이전 세션에서 확인한 `planetGlobeBakeSample.ts` 계열 파이프라인 추정) — 원본 아트 리사이즈보다 **베이크 타겟 해상도를 낮춰 재생성**하는 쪽이 더 쉬울 가능성이 높음(미확인, 재확인 필요).
2. `ship/*` 5개, `npc_portrait` 15개는 실제 아트 파일 재압축/리사이즈(표시 크기 기준)로 해결.
3. `audit:asset-size-budget`을 `audit:memory:all` 등 필수 체인에 편입할지 여부 — 지금 편입하면 기존 콘텐츠 부채 때문에 그 체인이 항상 FAIL로 바뀌므로, 편입은 위 1·2 remediation 이후로 미루는 걸 권장.
4. 커밋 없음 — 신규 파일 3개(CSV·mjs·doc) + package.json 스크립트 1줄, 전부 검수 대기.

---

## ✅ REVIEWED — 바 종업원 구조 업그레이드(은하 전역화) 전수 검사 · 2026-09-05 3차

```text
status=REVIEWED
task_id=bar-attendant-galaxy-upgrade-review-20260905-r3
kind=CODE_REVIEW
code_changes=NO
kim_claude_verdict=AGREE
scope=tools/content-tables/seed-bar-attendants-galaxy.mjs, tables/content/bar_attendants.csv(288행)·bar_songs.csv(신규), src/game/barAttendantPortraitAssets.ts, src/game/bar/patronage/*, src/components/bar/BarPatronagePerformView.tsx
self_check=tsc 0에러 · barPatronageTables.test.ts 6/6 PASS(신규) · audit:memory:all 전부 PASS · build:content-tables 정상(attendants=288·songs=5·drinks=3·planetDrinkPrices=54)
kim_team_lead_verdict=REVIEWED
applied=§15-7 실효상한16·trim분기문서화 · soft-cap/낭비경고 미적용(상품보류)
reviewed_at=2026-09-05
```

김팀장 판정: 김클로드 AGREE를 수용한다. 은하 시드 288·로스터 단순화·song 텍스트 전용·초상 5장 순환·endSession/PerformView 가드는 재확인했고 런타임 결함 없음. §7 참고(시드 16이라 roster_max=20이어도 실효 노출 최대 16, trim은 16 초과 시드 시에만 활성)만 설계 §15-7·`buildBarPatronageRoster` 주석에 문서화했다. 시드 16(288) 유지·20명 풀 확장은 별도 지시 시. r2와 동일하게 낭비구매 경고·초장기 세션 soft-cap은 상품 보류(대표님 추가 지시 전 미적용). 커밋 없음.

대표님 지시: 「바 종업원 구조 업그레이드 전수검사」. 2차 검수 이후 추가된 은하 전역 종업원 시딩·로스터 알고리즘 재작성·노래(song) 필드·초상 자산 구조를 전부 코드로 재확인했습니다.

### 1. 은하 전역 시딩 — AGREE

`seed-bar-attendants-galaxy.mjs`가 `hasBar=true` 18행성 × 16명 = 288명을 생성하며, 스크립트 자체에 `EXPECTED_BAR_PLANETS`/`EXPECTED_TOTAL` 어설션과 id/이름 중복 검사가 내장돼 있어 재실행해도 사고가 나기 어려운 구조입니다. `planetId='*'`(유랑 풀)은 완전히 제거되고 전원 행성 고정 — 신규 테스트(`barPatronageTables.test.ts:46-82`)가 288개 전수(중복 id/이름/초상 0건, 행성당 정확히 16명)를 직접 검증하고, 실행해서 6/6 PASS 확인했습니다.

### 2. 로스터 알고리즘 재작성 — AGREE(직접 재계산·테스트 실행으로 검증)

`resolveRosterSize`가 `rosterMin+level-1`(12~20, 대표님 2026-09-05 지시로 5→12·15→20 변경 확인)로, `buildBarPatronageRoster`는 가중치 랜덤 뽑기 대신 "후보가 목표 이하면 전원, 초과하면 가중치+일별시드 정렬 후 자르기"로 단순해졌습니다. 처음엔 손계산으로 레벨10에서 20명이 나와야 하는데 테스트가 16명을 기대해 불일치로 의심했으나, 실제로는 **행성당 후보가 16명뿐이라 목표(20)보다 항상 적어 전원 반환되는 게 맞는 동작**임을 코드 재확인 + 테스트 재실행(PASS)으로 확인했습니다 — 제 첫 암산이 틀렸던 것이었습니다.

### 3. 노래(song) 필드 — AGREE, 크래시 위험 없음

`bar_songs.csv`(5개, 전부 `note=placeholder`)의 `assetKey`는 실제 오디오 파일을 가리키지 않는데, 코드 전체를 grep한 결과 `Audio.Sound`/`expo-av` 등 오디오 재생 시도가 전혀 없고 `BarPatronagePerformView.tsx:114-115`에서 **곡 제목을 텍스트로만** 표시합니다 — 존재하지 않는 에셋을 로드하려다 크래시할 경로가 없습니다.

### 4. 초상 자산(288 슬롯 → PNG 5장 순환) — AGREE, 메모리 안전

`barAttendantPortraitAssets.ts`가 288개 키를 전부 `require()`로 이미 로드된 PNG 5장 중 하나에 매핑합니다. `require()`는 같은 모듈을 매번 같은 참조로 반환하므로, 288명 중 누가 뜨든 RN 이미지 캐시엔 실질적으로 **5장만** 상주합니다 — 슬롯 수가 288이라고 메모리가 288배로 늘지 않습니다.

### 5. 공연 화면 UI 개편("영상통화" 프레임) — AGREE

정적 초상 풀스크린 + LIVE 칩 + ♪ 오버레이로 바뀌었지만 여전히 Skia 없이 순수 RN `Image`/`Animated`만 사용합니다(파일 헤더 주석에도 "Skia 금지" 명시).

### 6. 이전 지적 반영 확인

2차 검수에서 지적했던 `endSession()`의 죽은 이중 `set()`(`phase:'ended'` 쓰고 바로 `null`로 덮어쓰던 것)이 이번에 **단일 `set({activeSession:null})`으로 정리**됐습니다 — 반영 확인.

### 7. 참고용 — 사소

`buildBarPatronageRoster`의 "후보 > 목표" 분기(가중치+시드 정렬 후 자르기)는 현재 CSV로는 **도달 불가능**합니다(행성당 후보 수가 레벨에 따라 12→16으로 늘고 목표도 같은 속도로 12→20까지 늘어서, 후보가 목표를 넘는 조합이 없음). 지금은 무해한 대비 코드이고, 향후 행성당 인원을 16명 초과로 늘리면 그때 실제로 동작합니다.

### 결론

은하 전역화·로스터 재작성·노래 필드·초상 순환 전부 코드와 신규 테스트로 직접 확인했고 이견 없습니다. 지난 검수 지적사항도 반영됐습니다.

코드 수정 없음(검토만). 대표님께: 「김팀장(Cursor 본창) 검수 요청」 안내 부탁드립니다.

---

## ✅ REVIEWED — 바 후원시스템 보강분 재검수 · 2026-09-05 2차

```text
status=REVIEWED
task_id=bar-patronage-system-review-20260905-r2
kind=CODE_REVIEW
code_changes=NO
kim_claude_verdict=AGREE (판단 요청 1건 · 경미 1건 유지)
design_doc=docs/바_후원시스템_설계.md §5 갱신 확인
scope=src/store/barPatronageStore.ts, src/game/bar/patronage/barPatronageTables.ts, app/(game)/bar.tsx, src/components/bar/BarPatronage*.tsx, tables/content/bar_planet_drink_prices.csv(신규)
self_check=tsc 0에러 · audit:memory:all 전부 PASS
kim_team_lead_verdict=REVIEWED
applied=endSession null-only · PerformView session timer guard
product=세션잔수캡없음·1000 UI 유지(대표님 기존 지시) · 낭비구매경고·초장기세션 soft-cap은 미적용(추가 지시 시)
```

1차 검수(`bar-patronage-system-review-20260905`) 이후 김팀장이 보강한 분을 다시 코드로 전수 대조했습니다. 이전 지적사항 상태 갱신 + 신규 변경분 재검수입니다.

### 1. 신규 보강 — 전부 AGREE

- **행성별 정찰 단가**(`bar_planet_drink_prices.csv` 신규, 21개 행성×3술): `resolveBarDrinkUnitPrice(planetId, drinkId)`가 라운지 표시가(`BarPatronageLoungeTab.tsx:45-48`)와 실제 결제 계산(`barPatronageStore.ts:270-271`) **양쪽에서 동일하게 호출**됩니다 — 표시가와 청구가가 다를 수 있는 구조적 위험을 확인했으나 실제로는 일치합니다.
- **주인 대사 순서 개선**: 이제 맞이+요청 대사(`presentBarDialogTurns`)가 먼저 재생되고, 끝난 뒤 `onDismiss`로 수락/거절 확인창이 뜹니다(`bar.tsx:202-213`) — 이전엔 대사 없이 바로 확인창이었던 것보다 자연스럽습니다.
- **인기도·지출 원장 추가**(`popularityByAttendantId`/`spendByPlanetId`/`spendLedger`): `spendLedger`는 `BAR_PATRONAGE_SPEND_LEDGER_CAP=200`으로 상한이 걸려 있고 로드 시에도 `sanitizeLedger`가 초과분을 잘라냅니다 — 무한 누적 위험 없음.
- **구세이브 마이그레이션**: `migrateLoad`가 옛 필드명(`affinityByAttendantId`)을 새 필드(`drinksBoughtByAttendantId`)로 옮겨줘서, 1차 검수 때 봤던 구 스키마 세이브도 깨지지 않습니다.
- **`expireSessionIfNeeded` 신설**: 로드·포커스·수락 시점마다 호출돼 만료된 세션을 능동적으로 `null` 처리 — 이전에 지적했던 "공연 화면이 죽은 세션을 붙들고 15초마다 헛도는" 경미 사항이, `bar.tsx`의 신규 `showPerformTab` 가드(`activeSession` 비활성 시 자동으로 `perform` 탭 이탈 → 컴포넌트 언마운트 → 인터벌 정리)로 **부수적으로 해소**됐습니다. `BarPatronagePerformView` 자체에 `if (!session) return;` 가드는 여전히 없지만, 이제 그 상태에 도달할 경로가 없습니다.

### 2. ⚠️ 판단 요청 — 세션당 잔수 상한 제거(설계 문서 §5 갱신 확인, 부작용 2가지)

`bar_patronage_policy.csv`에서 `max_drinks_per_session` 행 자체가 삭제됐고, `startOrExtendSession`에서도 세션 잔수 캡 체크가 완전히 빠졌습니다. `resolvePatronageDrinkMaxQty()`는 이제 인자 없이 **UI 안전 상한 1000**만 반환하고, 실제 제약은 `spendCredits`의 잔액 확인뿐입니다. 설계 문서 §5도 "상한(1차) — UI 피커 1000 상한 · confirm 시 크레딧만 실제 차감(세션 잔수 캡 없음)"으로 **이미 갱신돼 있어 의도된 변경**임을 확인했습니다(제가 처음엔 회귀로 의심했다가 문서 대조로 정정).

의도된 변경이라는 전제 하에, 구현상 부작용 2가지만 확인 요청드립니다 — 크래시·메모리 문제는 아니고 상품/UX 판단입니다:
1. **낭비 구매 무경고**: `unlockedBundleTier`는 CSV에 정의된 티어 수만큼만 실제로 대사가 늘어나고 그 이상은 효과가 없는데, 잔 수 피커에는 "이미 최고 티어를 넘는 구매는 효과 없음" 같은 경고가 없습니다. 예를 들어 티어가 4개뿐인데 50잔을 사면 49잔 분 크레딧이 그대로 낭비됩니다.
2. **극단적 세션 길이**: 잔 수가 커지면 `durationMs`가 그대로 비례해서(예: 1000잔×15분 ≈ 10.4일) 세션이 며칠~열흘 단위로 "활성" 상태가 됩니다. 크래시·틱 위험은 없음을 확인했지만(백그라운드에서 폴링하지 않고 `endsAtMs` 차이만 계산), "세션 1회 ≈ 15~60분"이라는 원래 UX 프레이밍과는 크게 달라진 결과라 의도한 그림인지 확인 부탁드립니다.

### 3. 이전 지적 재확인 — 아직 남아있음(경미, 유지)

`endSession()`(`barPatronageStore.ts:340-348`)이 `phase:'ended'`로 `set()`한 직후 같은 함수에서 바로 `activeSession: null`로 덮어써서, "ended" 기록이 1.5초 뒤 코얼레싱 persist에 반영되지 않는 문제는 그대로입니다. 지금도 이 기록을 읽는 곳이 없어 기능 영향은 없습니다.

### 결론

보강분은 전부 견고하고, 1차 때 지적한 경미 사항 중 하나는 부수적으로 해소됐습니다. 유일한 확인 요청은 "세션 잔수 캡 제거"가 문서화된 의도임을 확인했으니 코드 자체엔 이견 없고, 다만 그로 인한 낭비구매·초장기세션 두 가지가 상품 의도와 맞는지만 회신 부탁드립니다.

코드 수정 없음(검토만). 대표님께: 「김팀장(Cursor 본창) 검수 요청」 안내 부탁드립니다.

---

## ✅ REVIEWED — 바 후원시스템(종업원 술 사주기) 전수 검수 · 2026-09-05

```text
status=REVIEWED
task_id=bar-patronage-system-review-20260905
kind=CODE_REVIEW
code_changes=NO
kim_claude_verdict=AGREE (경미 항목 3건)
design_doc=docs/바_후원시스템_설계.md (impl=P1_LIVE)
scope=src/store/barPatronageStore.ts, src/game/bar/patronage/*, src/components/bar/BarPatronage*.tsx, app/(game)/bar.tsx, tables/content/bar_*.csv
self_check=tsc 0에러 · audit:memory:all 전부 PASS · 자동 테스트 없음(신규 갭, 아래 참고)
kim_team_lead_verdict=REVIEWED
applied=endSession null-only · PerformView session timer guard
product=세션잔수캡없음·1000 UI 유지(대표님 기존 지시) · 낭비구매경고·초장기세션 soft-cap은 미적용(추가 지시 시)
```

대표님 지시: 「김팀장이 구현한 바 후원시스템 종업원 술 사주기 시스템이 잘 구현되었는지 검수하라」. 설계 문서(`docs/바_후원시스템_설계.md`, P1_LIVE)의 계약 사항을 코드로 직접 대조했습니다.

### 1. 핵심 계약 준수 — AGREE

- **STAGE dispose**: `usePlanetSubStageMemory('bar', () => {...pauseSession()...})`(`bar.tsx:218-222`)가 블러 시 세션을 pause하고 탭을 `lounge`로 되돌립니다. `BarPatronagePerformView`는 `activeTab==='perform'`일 때만 마운트되는 조건부 렌더라, 탭이 바뀌면 그 안의 `setInterval`·`Animated.loop`가 React 언마운트로 자연히 정리됩니다 — STAGE 이탈 시 실제로 타이머·애니메이션이 살아남지 않습니다.
- **틱 규율**: `bar_patronage_policy.csv`의 `timer_ui_tick_sec=15`가 실제로 쓰이고(`BarPatronagePerformView.tsx:56` `Math.max(5_000, policy.timerUiTickSec*1000)`), 세션 종료는 벽시계 `endsAtMs` 기준이라 백그라운드 복귀 후에도 재계산만으로 정확합니다(틱에 의존하지 않음).
- **경제 안전성**: `spendCredits`(`playerStore.ts:666-671`)가 잔액 확인+차감을 한 번에 처리하는 원자적 구현이고, `startOrExtendSession`(`barPatronageStore.ts:117-172`)이 UI가 계산한 `maxQty`와 별개로 **스토어 자체에서도** `maxDrinksPerSession` 캡을 재검증합니다(방어 이중화) — UI 버그로 세션 한도를 넘겨 구매하는 경로가 없습니다.
- **로스터 결정성**: `buildBarPatronageRoster`(`barPatronageTables.ts:74-116`)가 `planetId+dayKey` 해시 시드(mulberry32)로 당일 고정 샘플링 — 설계의 "당일 roster 시드 고정, 깜빡임 방지"와 일치.
- **NL 훅 안전성**: `resolveBarDialogLine`(`barPatronageDialog.ts:44-61`)이 `delivery=nl_preferred`일 때만 resolver를 시도하고, 실패·빈 문자열 시 CSV 스크립트로 폴백(`try/catch` + `trimmed || fallback`) — NL이 아직 없어도(현재 `nlLineResolver=null`) 항상 스크립트 경로로 정상 동작.
- **purge 연동**: `useBarPatronageStore.getState().resetLocal()`이 `localAccountReset.ts:244`에 실제로 등록돼 있음 — 계정 초기화 시 정상 삭제됩니다(최초 grep으로는 놓칠 뻔해서 파일 직접 열어 재확인).
- **Skia 미사용**: `BarPatronagePerformView`의 "춤" 연출은 순수 RN `Animated`(`translateY`/`rotate` 크로스페이드류)뿐 — 설계의 "Skia 금지(1차)" 그대로.

### 2. 경미 항목 (참고용, 급하지 않음)

- **`endSession()`의 죽은 대입**(`barPatronageStore.ts:196-204`): `phase:'ended'`로 먼저 `set()`한 직후 같은 함수 안에서 바로 `activeSession: null`로 또 `set()`해서, "ended" 상태는 어떤 구독자도 관측할 기회 없이 곧장 덮어써집니다. 1.5초 뒤 코얼레싱된 persist도 그 시점엔 이미 `null`을 읽어 저장하므로, "이 세션이 방금 종료됐다"는 기록 자체가 저장소에 안 남습니다. 지금은 이 기록을 읽는 곳이 없어 기능상 문제는 없지만, 나중에 종료 로그·통계를 붙이려 하면 바로 걸릴 코드입니다 — 첫 `set()` 줄만 지워도 됩니다.
- **공연 뷰 타이머가 세션 종료 후에도 계속 재무장**(`BarPatronagePerformView.tsx:55-66`): 세션이 자연 만료돼 `session`이 `null`이 돼도 이 `useEffect`는 `if (!session) return;` 가드가 없어서, 플레이어가 '공연' 탭에 그대로 머물러 있으면 15초마다 `remainingMs()`/`endSession()` 빈 호출을 계속 반복합니다(둘 다 내부에서 조용히 no-op이라 크래시·오작동은 없음). 탭 전환·화면 이탈 시엔 정상 정리되니 STAGE 계약 위반은 아니지만, 가드 한 줄 추가하면 깔끔합니다.
- **자동 테스트 부재**: 로스터 시드 결정성(`buildBarPatronageRoster`), 잔 수 상한 계산(`resolvePatronageDrinkMaxQty`), 세션 연장 로직(`startOrExtendSession`) 전부 순수 함수라 테스트하기 쉬운데, 이번 세션 다른 시스템들(`resolveMissionClearNpcContext.test.ts` 등)과 달리 `.test.ts`가 없습니다. 지금 당장 깨진 건 없지만 회귀 방지용으로 권장합니다.

### 결론

설계 문서의 필수 계약(STAGE dispose·틱 규율·경제 원자성·로스터 결정성·NL 폴백·purge 연동·Skia 금지) 전부 코드로 직접 확인했고 정확히 지켜지고 있습니다. 위 3개는 전부 코드 품질/견고성 참고 사항이며 지금 플레이에 영향을 주는 결함은 아닙니다.

코드 수정 없음(검토만). 대표님께: 「김팀장(Cursor 본창) 검수 요청」 안내 부탁드립니다.

---

## 📋 PENDING — 경제고도화(P1-P5) 배포분 전면 정밀 재검수 · 2026-08-25 2차

```text
status=PENDING
task_id=arccore-fiscal-military-review-20260825-r2
kind=CODE_REVIEW (배포분)
code_changes=NO
kim_claude_verdict=PARTIAL AGREE (유지) — 김팀장 8-1 반박 인정, 리스크는 P1→P2로 재귀속 확인
review_doc=docs/economy-evaluation/2026-08-25-kim-claude-fiscal-military-review.md §8
self_check=tsc 0에러 · computeArcCoreFiscalOpexProxy.test.ts 3/3 · tradeRouteSectorCategories.test.ts 2/2 · audit:memory:all 전부 PASS · audit:balance-ops Overall FAIL(기존과 동일 사유, esbuild 도구 FAIL — 신규 아님)
```

대표님 지시: 「현재 김팀장의 경제고도화 작업을 전면 정밀 재검수하라」. 1차 검수 이후 P1-P5가 전부 **오늘 라이브 배포**(`arc_core_fiscal_opex_policy.csv` `shadow_mode=false`·`enabled=true` 직접 확인)됐음을 확인해, 설계 재검토가 아니라 배포된 코드 전체로 범위를 넓혔습니다.

### 1. 김팀장의 8-1 반박 — 재확인 결과 AGREE(정정 인정)

"P1 vault 지출이 fiscal WARN을 키운다"는 제 1차 지적은 틀렸습니다. `planetFiscalKpi.ts`의 `buildPlanetFiscalSnapshot` 입력은 `dailyArcFeeCredits`/`dailyUpkeepCredits`뿐이고 vault 잔액을 전혀 안 봅니다 — 코드로 직접 재확인, 김팀장 말이 맞습니다.

### 2. ⚠️ 그러나 리스크는 사라진 게 아니라 **P1이 아니라 P2로 재귀속** — CONFIRMED, 관측 공백 있음

`runPlanetFiscalBalanceClosedLoopPass.ts:15,59`가 `computePlanetDevelopmentUpkeepBreakdown`(P2로 오늘 조선소·연구소·무역소·거주돔 유지비까지 확장됨)을 **직접 import해 `dailyUpkeepCredits`에 합산**합니다. 즉 P2 시설 유지비 신설 → upkeep 상승 → fee/upkeep 비율 하락 → WARN/FAIL 연속일 증가 → 기존에 이미 실전 연결된 `trade_route` 가격 자동 인하로 이어질 수 있는 경로가 실재하고, **오늘부터 활성 상태**입니다. 원 설계 문서도 이 상호작용을 "그때(P2 시점) 재확인"하겠다고 예견했는데, 그 시점이 이미 왔습니다.

방금 `audit:balance-ops`를 재실행했는데, `fiscal WARN — max fee/upkeep 3.09× gini=0.379` 수치가 **배포 전 관측치와 완전히 동일**했습니다 — 이 감사는 실시간 시뮬이 아니라 마지막 실제 배치(하루 1회 12:00 KST) 결과를 읽는 구조라, **P1/P2가 라이브로 바뀐 뒤 배치가 한 번도 새로 안 돌았다는 뜻**입니다. 시설 유지비 신설이 실제로 재정 지표·자동 가격조정에 얼마나 영향을 주는지는 다음 배치 전까지 아무도 관측한 적이 없습니다.

**제안**: 다음 12:00 KST 배치 직후 `audit:balance-ops`를 재실행해 `fiscalOverall`/`gini`/`maxFeeUpkeepRatio`가 배포 전 대비 얼마나 움직였는지 꼭 확인 요청드립니다. 의도된 효과(국가가 시설비를 문다)일 수도 있지만, 첫 관측 없이 지나가면 나중에 "왜 무역로 가격이 자동으로 깎였지"를 원인 불명 상태로 재조사하게 됩니다.

### 3. 구현 품질 스팟체크 — 전부 AGREE(안전장치 정상)

시드 보호(`spendableAboveSeed`+`Math.min` 캡), P3 개발예산 락 멱등성(같은 날 재실행 시 재차감 없음), P4 계수 힌트 0.85~1.15 하드 캡, F1 이중소각 방지(`skip_empty_central_bank_burn_when_live`), F7 범위 준수(정량만, 코드 미수정) — 전부 코드로 직접 확인했고 견고합니다.

### 결론

구현 자체는 견고하고 자체 검사도 깨끗합니다. 유일한 공백은 "P2 배포 후 첫 실제 배치 관측이 아직 없다"는 점 — 코드 결함이 아니라 관측 타이밍 문제입니다. **PARTIAL AGREE 유지** — 다음 배치 직후 지표 재확인만 요청.

코드 수정 없음(검토만). 대표님께: 「김팀장(Cursor 본창) 검수 요청」 안내 부탁드립니다.

---

## ✅ REVIEWED — 아크코어 재정·군사 구조 설계안 재검수 · 김팀장 재대조 · 2026-08-25

```text
status=REVIEWED
task_id=arccore-fiscal-military-review-20260825
kind=DESIGN_REVIEW
code_changes=YES (문서+정산 파일 주석 1줄. P1 게임 로직 없음)
kim_claude_verdict=PARTIAL AGREE — 구조·방향 승인, 착수 전 확정 요청 3건
kim_team_verdict=PARTIAL — 30/70·삽입점·폐회로 존재 AGREE · P1→가격인하 메커니즘 DISAGREE · F7은 정량만
reviewed_at=2026-08-25
design_doc=docs/economy-evaluation/2026-08-25-arccore-fiscal-military-structure.md
review_doc=docs/economy-evaluation/2026-08-25-kim-claude-fiscal-military-review.md
```

**김팀장 재확인 (코드 직접 대조):**

| 김클로드 주장 | 판정 | 근거 |
|---|---|---|
| 빈 소각 · 위성만 유지비 · 5축 | **AGREE** | `arcCoreCentralBank.ts:53-69` · `planetDevelopmentUpkeep.ts` · `resolveFactionVault.ts` |
| 원문서 90/10은 오류 · CSV **30/70** | **AGREE** | `trade_route_transport_policy.csv:12` · settlement 56–59. 헤더 주석이 10%로 문서 오염 |
| 학습 두 함수는 기록만 · 인접 폐회로 있음 | **AGREE** | `runPlanetFiscalBalanceClosedLoopPass.ts:88-101` `trade_route` overlay |
| P1 지출 → fiscal WARN → 가격 인하 | **DISAGREE** | `planetFiscalKpi.ts` 입력 = fee/upkeep. vault 없음. 결합은 **P2 시설 유지비** |
| 삽입 = 게이지 후 · 트렌드 커밋 전 | **AGREE** | `runArcCoreDailyOpsBatch.ts` 382–395 |
| F7을 P1보다 먼저 구현 | **PARTIAL** | R1 `pickNextPlanetId` gather 우선 **잔존**. 유실 정량만 P1 계수 전. 코드 수정은 P2 |

**반영:** 설계 문서·FABRIC 30/70·폐회로·삽입점 · `applyConvoyUnloadVaultSettlement.ts` 주석. P1 코드·수수료/800/탄력0 미변경.

---

## 📋 REVIEWED (원문 보존) — 아크코어 재정·군사 구조 설계안 재검수 + 보완설계 · 2026-08-25

```text
status=REVIEWED
task_id=arccore-fiscal-military-review-20260825
kind=DESIGN_REVIEW
code_changes=NO
kim_claude_verdict=PARTIAL AGREE — 구조·방향 승인, 착수 전 확정 요청 3건
design_doc=docs/economy-evaluation/2026-08-25-arccore-fiscal-military-structure.md
review_doc=docs/economy-evaluation/2026-08-25-kim-claude-fiscal-military-review.md (전체 내용은 이 문서 참조)
```

대표님 지시: 「김팀장이 전수설계한 경제개선안을 김클로드 입장에서 전수정밀조사한 후 의견과 보완설계를 작성 후 김팀장에게 검수 받아라」. 문서의 모든 사실 주장을 코드로 직접 재확인했습니다(원문서를 그대로 신뢰하지 않고 파일:줄 단위 대조).

### 총평: PARTIAL AGREE

진단(중앙은행=군사·함선 재정부가 아니라 빈 소각 장치, 시설 유지비 방위위성만 실물, 5축 라우팅 정상 동작)은 **코드와 정확히 일치**하며, 목표 구조(프록시 일일 지출 패스, 일 1회·틱 없음, 기존 수수료/유지비/탄력0 불변)도 방향에 이견 없습니다.

### 재검수 중 발견한 3가지 — P1 착수 전 확정 요청 (상세 근거는 `review_doc` 참조)

1. **사실 오류(수치)**: 원문서가 "수송 순마진 90%가 선단에 남고 RED는 10%"라고 썼지만, 실제 CSV 정본(`tables/balance/trade_route_transport_policy.csv:12` `convoy_net_margin_arc_core_share_pct=30`)은 **RED 30% / 선단 잔류 70%**입니다. 코드(`applyConvoyUnloadVaultSettlement.ts:56-59`)는 CSV를 정확히 읽고 있고, 문제는 같은 파일 2행의 **낡은 헤더 주석**("10%")을 원문서가 그대로 인용한 것으로 보입니다. §3-3 선단 적립 억제 계수는 실제값(70%) 기준으로 재계산 필요.
2. **상호작용 미검토**: `runPlanetFiscalBalanceClosedLoopPass.ts:74-102`가 **이미 실전 가동 중인 가격 폐회로**로, 학습 스토어의 WARN/FAIL 연속일수가 임계치를 넘으면 무역로 가격을 자동으로 낮춥니다. P1이 매일 새 유출(군사·함선·함장·R&D 프록시)을 만들면 이 스트릭이 늘어나 **의도치 않은 무역로 가격 자동 인하가 연쇄**될 수 있습니다 — 원문서 "학습은 개회로" 결론은 이 인접 폐회로를 놓치고 있습니다. P1 첫 배포는 실지출 없는 shadow 모드로 스트릭 영향을 먼저 관측할 것을 제안합니다.
3. **삽입 지점 특정 필요**: 원문서 "배치 말미"는 실제로 한 지점으로 좁혀야 합니다 — `runArcCoreDailyOpsBatch.ts`의 진짜 마지막은 `planetCoreGaugeComposition`(383)→`commitPlanetCoreStatOpsTrendAfterBatch`(391)이고, 이 사이(게이지 확정 후·트렌드 커밋 전)에 P1을 넣어야 프록시 계수가 그날 최신값을 읽고 그날 지출 효과가 그날 트렌드에 커밋됩니다.

### 그 외 제안

F7(convoy 원금 유실, 원문서 P2 예정)은 P1의 "수입−지출 항등식" 전제와 순서가 얽혀 있어, P1보다 먼저 고치거나 최소한 유실 규모를 P1 계수 산정 전에 정량화해두길 권합니다(우선순위 재조정이 아니라 순서 문제).

코드 수정 없음(문서만). 대표님께: 「김팀장(Cursor 본창) 검수 요청」 안내 부탁드립니다.

---

## ✅ REVIEWED — 퀘스트 시스템 현재 시점 재점검 · 김팀장 재대조 · 2026-08-25

```text
status=REVIEWED
task_id=mission-system-current-state-recheck-20260825
kind=CODE_REVIEW
code_changes=NO
kim_claude_verdict=PARTIAL — 검증된 결함 1건(만료 스윕이 완료 대기중 미션도 삭제)
kim_team_verdict=PARTIAL — 메커니즘 AGREE · 「미검토 결함」DISAGREE · 재현 경로 과장 정정 · (a)/(b)는 정책 변경이라 미적용
reviewed_at=2026-08-25
```

**김팀장 재확인 (코드 직접 대조):**

| 김클로드 주장 | 판정 | 근거 |
|---|---|---|
| `status==='active'`만 건너뛰고 allDone도 만료 삭제 | **AGREE** | `computeExpiredMissionSweep` 148–173 · `completeObjective` allDone은 `active` 유지 · `finalizeMissionCompletion`에서만 `complete` |
| `dropExpiredPendingClears`는 삭제 후 큐 정리만 | **AGREE** | `missionStore.ts:111-131` |
| 인스턴스 만료 시 `listed` 복귀 | **AGREE** | 같은 로컬 보드. 「다른 플레이어」는 **틀림**(싱글 샌드박스) |
| 바 주인에게 말해야 클리어 대사가 뜸 | **DISAGREE** | 허브 `sweep → applyLanded → tryPresentPendingMissionClearDialog`가 **전 미션** 자동 present. 바 주인은 **놓쳤을 때 안전망** |
| 만료×클리어 큐 상호작용이 미검토 | **DISAGREE** | `docs/MISSION_TIME_LIMIT_DESIGN.md` §3에 「클리어 대화 대기열에서 제거」명시. **만료 우선이 설계** |
| (a) allDone 만료 제외 · (b) 완료 시 기한 해제 | **보류** | 기존 1.1안 변경. 대표님 승인 전 코드 금지 |

남는 UX(설계 가장자리, 이중 구현 아님): 목표가 끝났는데 클리어 대사를 **끝까지 안 닫고** 벽시계가 지나면 보상 없이 삭제. 착륙 직후 대사가 뜨는 정상 경로와는 별개.

---

## 📋 REVIEWED (원문 보존) — 퀘스트 시스템 현재 시점 재점검(2026-08-25)

```text
status=REVIEWED
task_id=mission-system-current-state-recheck-20260825
kind=CODE_REVIEW
code_changes=NO
kim_claude_verdict=PARTIAL — 검증된 결함 1건(만료 스윕이 완료 대기중 미션도 삭제)
scope=src/store/missionStore.ts(sweepExpiredMissions), src/missions/missionTimeLimit.ts, src/missions/pendingMissionClearQueue.ts, src/game/planetHubTalkRoster.ts, 그 외 미션/대화 관련 신규 테스트 전체
self_check=tsc 0에러 · 미션/대화 관련 테스트 10파일 40/40 PASS · build:content-tables 정상(npc-fleet·mission-quest-placements 감사 PASS) · audit:memory:all 전부 PASS
```

대표님 지시: 「현재 시점으로 문제가 없는지 다시 전수 조사하라」. 하룻밤 사이 김팀장이 미션 시스템을 대폭 확장(신규 `missionTimeLimit.ts` 만료 스윕, `mainStory/` 모듈, `missionNeighborReach*`, NPC 영구사망 설계 문서 등)했음을 확인 — 이번 검수는 직전 작업(퀘스트 완료 담당자 대화)과 직접 맞물리는 범위(미션 상태·만료·클리어 큐·대화목록)에 집중했고, 무관한 신규 모듈(mainStory 콘텐츠, NPC 영구사망 등)은 전수 조사 범위 밖입니다.

### 1. 전체 상태 — AGREE (회귀 없음)

`tsc` 0에러, 미션/인게임대화 관련 테스트 10개 파일 40개 케이스 전부 PASS(신규 `missionNeighborReach.test.ts`·`missionTimeLimit.test.ts`·`arcCoreInstanceMissionGenerator.test.ts`·`mainStoryProgression.test.ts` 포함), `build:content-tables` 정상 재생성 및 자체 감사(`audit:npc-fleet`·`audit:mission-quest-placements`) 전부 PASS, 메모리 오디트 6종 전부 PASS. 지난 턴의 타입 수정(`MissionClearContactInput`/`isMissionClearContactAtPlanet`에 `id` 추가)이 그대로 안정적으로 유지되고 있습니다.

### 2. ⚠️ 신규 결함 — 만료 스윕이 "완료 대기 중"(담당자 대화 대기) 미션도 삭제할 수 있음 (CONFIRMED)

- 신규 `missionTimeLimit.ts`의 `computeExpiredMissionSweep`(`missionTimeLimit.ts:148-173`)은 `progress.status !== 'active'`인 것만 건너뛰고, `expiresAtMs`가 지났으면 나머지는 전부 삭제 대상으로 봅니다.
- 그런데 **objective가 전부 끝났지만(`buildPendingClearDialog`로 클리어 대화가 큐잉된 상태)도 `status`는 여전히 `'active'`입니다** — `'complete'`로 바뀌는 건 `finalizeMissionCompletion`(대화 종료·`grant_mission_rewards`)에서만입니다(`missionStore.ts:565-609` 부근). 즉 **"이미 배달을 마쳤지만 아직 담당자와 대화를 안 한" 미션은 만료 스윕 대상에서 제외되지 않습니다.**
- `expiresAtMs`는 수락 시점(`startedAt + N시간`)에 고정되고, objective 완료 시점에 갱신·해제되지 않습니다(`missionStore.ts:99-109` `createActiveMissionProgress`, `backfillMissingExpiresAt`). `dropExpiredPendingClears`(`missionStore.ts:111-131`)는 만료 판정 **이후** 큐 참조만 정리할 뿐, 만료 판정 자체를 막지는 않습니다.
- **재현 조건**: 배달형(72h 만료) 퀘스트를 수락 → 마감 직전에 화물 배달·`reach_system` objective 자동완료(허브 착륙 시 그대로 자동 진행되는 현행 설계) → 그런데 그 미션이 `isAnyNeighborReachMission`(인접 성계 배달, 예: 「광물 샘플운송」류 ArcCore 인스턴스) 계열이라 완료 대화는 **바 주인에게 직접 말을 걸어야만** 뜸(`tryPresentBarNeighborMissionClear`, `planetHubTalkRoster.ts:47-85`) → 플레이어가 만료 시점(수락 후 72h)까지 그 담당자에게 다시 말을 안 걸면 → `sweepExpiredMissions`가 **이미 다 배달한 미션을 "만료"로 지우고 보상은 지급되지 않습니다.**
- 이번 세션에서 만든 "담당자 대화로 완료" 안전망 기능(대표님 지시, 2026-08-24)과 신규 만료 스윕(김팀장, 2026-08-24~25 사이 추가)이 **서로 독립적으로 짜여 있어 상호작용이 검토되지 않은 것**으로 보입니다 — 각자 따로는 멀쩡하지만 조합하면 "다 했는데 못 받는" 케이스가 생깁니다.
- **제안**(코드 미수정, 판단 요청): (a) `computeExpiredMissionSweep`에서 `isActiveMissionAllObjectivesDone(mission, progress)`(이미 존재하는 헬퍼)인 미션은 만료 대상에서 제외 — 가장 간단. (b) objective 전부 완료 시 `expiresAtMs`를 해제(또는 클리어 대화 큐잉 시점으로 유예 연장). 어느 쪽이든 "이미 끝낸 일이 조용히 사라지는" 케이스만 막으면 됩니다.

### 3. 그 외 확인 — 참고용

- `dropExpiredPendingClears`가 헤드/큐에서 만료된 미션의 대화 참조를 정리하는 로직 자체는 정확합니다(헤드 만료 시 다음 큐로 승격, 큐 항목 삭제 시 나머지 보존) — §2 결함은 "삭제 이후 뒷정리"가 아니라 "애초에 삭제 대상 판정" 쪽 문제입니다.
- ArcCore 인스턴스 미션이 만료되면 `restoreListedInstanceIds`로 보드에 재게시되는데(`missionTimeLimit.ts:170-172`, `missionStore.ts:493-496`), §2 케이스처럼 실수로 삭제된 경우도 동일하게 재게시되어 **다른 플레이어(또는 같은 플레이어가 재수락)에게 같은 인스턴스가 다시 뜰 수 있음** — §2가 고쳐지면 자연히 해소됩니다.
- 지난 턴 handoff에 남겨둔 "안전망(`tryPresentBarNeighborMissionClear`)이 ArcCore 인접배달에만 적용되고 고정 목적지 CSV 배달엔 없는 게 의도인지" 질문은 아직 코드상 그대로입니다 — 재확인 부탁드립니다.

### 결론

지난 턴 타입 수정 이후 전체적으로 안정적이고 회귀 없음. §2(만료 스윕 vs 완료대기 미션)만 신규로 확인된 실질적 리스크이며, 발생 조건이 좁아(배달 만료 임박 + 대화 미이행) 긴급하진 않지만 "완료해도 보상을 못 받는" 부류라 우선순위 있게 봐주시길 권합니다.

코드 수정 없음(검토만). 대표님께: 「김팀장(Cursor 본창) 검수 요청」 안내 부탁드립니다.

---

## ✅ REVIEWED — 퀘스트 완료 담당자 수동 인터랙션 · 김팀장 재대조 · 2026-08-25

```text
status=REVIEWED
task_id=mission-clear-npc-manual-interaction-20260824
kind=COLLISION_RESOLUTION + 타입버그 수정
kim_claude_verdict=AGREE (되돌림+타입만 · 범위 질문 남김)
kim_team_verdict=AGREE+CLOSE — 되돌림 올바름 · 타입 `id` 유지 · 고정목적지 안전망 미확장은 의도
code_changes=YES (김클로드: 타입만. 경쟁 구현 없음)
reviewed_at=2026-08-25
```

**김팀장:** `completeMissionContactHandoff.ts` 없음. `applyLandedMissionObjectives` 착륙 자동완료 유지. `MissionClearContactInput`에 `id` 있음.

**범위 질문 답:** `tryPresentBarNeighborMissionClear`가 `isAnyNeighborReachMission`만 보는 것은 **의도**. 인접 배달은 수락 때 담당자를 못 찍음 → 착륙 행성 바 주인으로 다시 품. `sandbox_006`/`sandbox_012`는 목적지 확정 → 수락 스냅샷 + 허브 `quest_contact` + 착륙 시 클리어 대사 자동 present. neighbor 안전망을 고정 목적지로 넓히면 발송지 바에서 오완료될 수 있어 **확장하지 않음**.

---

## 📋 REVIEWED (원문 보존) — 퀘스트 완료 "담당자 대화 수동 인터랙션" — 실시간 동시편집 정리 · 2026-08-24

```text
status=REVIEWED
task_id=mission-clear-npc-manual-interaction-20260824
kind=COLLISION_RESOLUTION + 타입버그 수정
code_changes=YES (김팀장 진행분 보존, 제 경쟁 구현은 되돌림, 컴파일 에러 2건만 수정)
files_touched=src/missions/resolveMissionClearNpcContext.ts(+test) — id 필드 타입 보강만
files_reverted_by_me=src/missions/applyLandedMissionObjectives.ts, applyReachSystemMissionObjectives.ts(git checkout -- 로 김팀장 스테이지 버전 복원), src/missions/completeMissionContactHandoff.ts(신규 파일 삭제)
self_check=tsc 0에러 · missionCategory/pendingMissionClearQueue/resolveHudCurrentObjective/resolveMissionClearNpcContext(16/16) 전부 PASS · audit:memory:all 전부 PASS
```

대표님 지시: 「담당자 지목 퀘스트는 성계 이동→스캔→대화목록에서 NPC 확인→대화로 완료하는 수동 인터랙션 추가. 기존 자동완료(행성허브 도착시)는 테스트 편의용이었고, 여러 NPC 겹침 시 우선순위 꼬임 방지용 수동 안전 프로세스로 고도화. 작업완료 후 김팀장 검수 요청.」

### 상황 — 작업 중 김팀장과 동일 파일 실시간 동시편집 충돌 발견, 제 쪽을 되돌림

착수 직후 `src/store/missionStore.ts`·`src/missions/resolveMissionClearNpcContext.ts`·`src/game/planetHubTalkRoster.ts`가 제가 읽는 도중에도 계속 바뀌고 있어, 김팀장이 **바로 지금 이 기능을 실시간으로 구현 중**임을 확인했습니다. 대표님이 저와 김팀장 양쪽에 같은 지시를 거의 동시에 내리신 것으로 보입니다.

제가 처음 설계한 접근(담당자 배정 미션은 `applyLandedMissionObjectives`/`applyReachSystemMissionObjectives`에서 **자동완료 자체를 막고** 대화목록에서만 완료)과, 김팀장이 이미 구현 중인 접근(자동완료는 그대로 두고, `planetHubTalkRoster.ts`의 `tryPresentBarNeighborMissionClear`로 **완료 대화 노출**을 대화목록 수동 선택에 안전망으로 얹는 방식)이 **서로 다른 설계**임을 발견했습니다. 제 쪽으로 밀어붙이면 김팀장의 "자동완료된 미션을 나중에 대화로 다시 띄운다"는 전제(`allDone`을 재조회하는 `requeueMissionClearDialogIfReady`)가 깨져 **오히려 퀘스트가 영원히 완료 안 되는 신규 리스크**가 생기는 걸 확인했습니다(대표님이 정확히 우려하신 그 유형의 버그를 제가 만들 뻔했습니다).

**조치**: 제 게이팅 변경분을 `git checkout --`로 되돌려 `applyLandedMissionObjectives.ts`/`applyReachSystemMissionObjectives.ts`를 김팀장 스테이지 버전으로 복원했고, 제가 새로 만든 미배선 파일 `completeMissionContactHandoff.ts`는 삭제했습니다. 대신 김팀장 작업 중 발생한 **실제 컴파일 에러 2건**(`resolveMissionClearNpcContext.ts`의 `MissionClearContactInput`/`isMissionClearContactAtPlanet` 파라미터 타입이 `id` 없이 선언돼 내부에서 `id`를 쓰는 `resolveMissionDestinationPlanetId`/`isAnyNeighborReachMission` 호출과 충돌)을 `id` 필드 추가로 수정했고, 이미 김팀장이 새로 갈아엎은 제 테스트 파일(`resolveMissionClearNpcContext.test.ts`, 16개 케이스로 확장돼 있었음)도 같은 타입 불일치로 깨져 있어 헬퍼 시그니처만 `Partial`로 보정했습니다. **로직은 전혀 바꾸지 않았습니다** — 전부 타입 선언 보강뿐입니다.

### 김팀장 구현 이해 — 제가 재구성한 그림(교차 확인 요청)

- 담당자 배정(`assignedClearNpcCaptainId`)은 수락 시점 스냅샷 그대로 유지. **단, `isAnyNeighborReachMission`(ArcCore 인스턴스 배달 전부 포함)인 미션은 목적지가 모호해 스냅샷 자체를 비워두고**, 완료 대화 화자를 프레젠테이션 시점에 "착륙한 행성의 바 주인"으로 다시 푸는 방식(`resolveClearDialogSpeakerCaptainId`)으로 처리하고 있습니다.
- 객체 완료(reach_system/reach_planet, 화물 소모)는 **여전히 착륙 시 자동**입니다(제가 막으려던 부분을 김팀장은 그대로 둠) — 자동완료된 순간 `pendingMissionClearDialog`가 즉시 큐잉·프레젠트되는 기존 경로도 그대로입니다.
- `tryPresentBarNeighborMissionClear`(대화목록에서 바 주인과 대화 시)는 **"안전망"** 역할로 보입니다: 자동 프레젠트가 다른 착륙 트리거들과 우선순위가 꼬여 놓쳤을 경우, 대화목록에서 그 담당자를 직접 선택하면 pending을 다시 present하거나(`allDone`인데 아직 안 떴으면) `requeueMissionClearDialogIfReady`로 재등록 후 present합니다.
- **범위가 `isAnyNeighborReachMission`(ArcCore 인스턴스 배달)로 한정**돼 있어, 손으로 쓴 고정 목적지 CSV 배달 미션(`sandbox_006`/`sandbox_012` 등 `type=delivery`, 목적지 확정)에는 이 안전망이 적용되지 않는 것으로 보입니다. 이게 의도인지(고정 목적지는 우선순위 충돌이 애초에 안 난다는 판단인지) 확인이 필요해 보여 남겨둡니다 — 제가 임의로 확장하지 않았습니다.

### 결론

로직 구현은 김팀장이 실시간으로 진행 중이라 제가 중복·경쟁 구현을 만들지 않고 **되돌림 + 컴파일 에러 수정**으로 역할을 좁혔습니다. 현재 전체 상태는 `tsc` 0에러·관련 테스트 전부 PASS·메모리 오디트 전부 PASS로 안전합니다. 위 "범위" 질문 외에는 이견 없습니다.

코드 수정 최소(타입 보강만). 대표님께: 「김팀장(Cursor 본창) 검수 요청」 — 특히 지금 실시간으로 작업 중이시면 이 handoff는 참고만 하시고 계속 진행하셔도 됩니다.

---

## ✅ REVIEWED — 퀘스트 완료 담당자 · 김팀장 정정 구현 · 2026-08-24

```text
status=REVIEWED
task_id=mission-clear-npc-dialog-implementation-20260824
kind=IMPLEMENTATION
kim_claude_verdict=PARTIAL — 인프라(스냅샷·제네릭 씬·토큰)는 재사용. 「목적지 있으면 바 주인 전원 배정」은 대표님 정본과 불일치
kim_team_verdict=DISAGREE+FIX — 오퍼레이터 기본. shouldAssignClearContact 게이트. 배달·접선만 미션에 담당자 stamp. 허브는 그 담당자만 활성화
code_changes=YES (김팀장 직접)
```

대표님 지시: 일반 퀘스트는 오퍼레이터. 발송지→배송지 담당이 있을 퀘스트만 생성 시 미션에 담당자를 적고, 그 경우에만 담당자 대화가 켜지게 구분하라.

**김클로드 초안에서 유지:** 수락 스냅샷 `assignedClearNpcCaptainId`, 씬 3단(맞춤 > NPC 템플릿 > 오퍼레이터), `[담당자]` 토큰, 맞춤 씬 `mission_001`~`003` 최우선, 완료 판정 비침습.

**김클로드 초안에서 기각·정정:** `resolveMissionClearAssignedNpcCaptainId`가 탐험/이동에도 목적지 바 주인을 붙이던 부분. `mission_004`/`tq_oth_01` 같은 일반 이동이 NPC 클리어로 바뀌면 안 됨.

**김팀장 반영:** `shouldAssignClearContact` · CSV `requiresClearContact`(접선 `mission_001`/`tq_oth_05`) · 인스턴스 설명 stamp · 허브 `quest_contact` · hydrate 백필.

---

## 📋 REVIEWED (원문 보존) — 퀘스트 완료 담당자(NPC) 대화 구현 완료 · 2026-08-24

```text
status=REVIEWED
task_id=mission-clear-npc-dialog-implementation-20260824
kind=IMPLEMENTATION
code_changes=YES
kim_team_note=상단 REVIEWED 정정안이 정본. 아래는 김클로드 원문.
files_modified=src/types/index.ts, src/store/missionStore.ts, src/game/ingameDialog/{ingameDialogTypes,ingameDialogViewModel,ingameDialogSceneIndex,resolveIngameDialogPortraitSource}.ts, src/missions/arcCoreInstanceMissionResolver.ts, tables/content/{story_scenes,story_scene_pages}.csv(+생성 재빌드)
files_added=src/missions/resolveMissionClearNpcContext.ts(+test)
self_check=tsc 0에러 · resolveMissionClearNpcContext.test.ts 9/9 · missionCategory/pendingMissionClearQueue/resolveHudCurrentObjective/ingameDialogAutoDismiss/barInstanceMissionDifficulty 전체 PASS(회귀 0건) · build:content-tables 정상(신규 CSV 2행 반영) · audit:memory:all 전부 PASS
```

전 turn 설계(`mission-clear-npc-dialog-design-20260824`)를 대표님 지시("광물 샘플운송 예시 — 인접 성계 배달지의 바 주인이 기본, 특별 퀘스트는 추가 배정. 유사 퀘스트 완료 안 되는 리스크도 점검. 구현 진행")에 맞춰 실제 구현했습니다. **`missionStore.ts`/`ingameDialog*` 등 김팀장이 동시 편집 중이던 파일도 이번엔 직접 수정**(대표님 명시 구현 지시)했고, 문자열 단위 정밀 편집으로 김팀장의 기존 스테이지된 변경분(§2 클리어 큐, `resolveHudCurrentObjective` 등)은 그대로 보존한 채 그 위에 얹었습니다 — 관련 테스트 전부 회귀 0건으로 확인.

### 설계 반영 — 대표님 정정사항 그대로 구현

- **기본 담당자 = 목적지 행성의 "바 주인"**(대표님 지시대로, 설계 초안의 governor 대신). `resolveBarHostCaptainAtPlanet(planetId)`(기존 인프라, `barPlanetIds` 기반)를 재사용 — 신규 NPC 배정 체계를 만들지 않음.
- **특별한 퀘스트 = 명시 오버라이드**: `Mission.clearNpcCaptainId?`(신규 optional 필드) — CSV에 지금은 채워진 값 없음(전부 기본=바 주인 경로), 특정 미션에 별도 캐릭터를 배정하고 싶으면 이 필드만 채우면 즉시 동작.
- **배정 시점 = 수락 시 스냅샷**: `MissionProgress.assignedClearNpcCaptainId?`(신규 optional) — `acceptQuestMission`(ArcCore 인스턴스·일반 sandbox 양쪽) · `acceptMainStoryMission` · `initTutorialStory` · 체인 진행(`advanceMissionChainAfterComplete`) **5개 진행-생성 지점 전부**에서 스냅샷. ArcCore 인스턴스 미션(`tq_*` 템플릿)도 `clearNpcCaptainId`가 템플릿→인스턴스 복제 시 전파되도록 `arcCoreInstanceMissionResolver.ts` 1줄 추가.
- **씬 선택 3단 우선순위**(`resolveMissionClearDialogSceneId` 확장): 미션별 맞춤 씬(기존, 최우선) → 담당 NPC 배정 시 `mission_clear_npc_delivery`/`mission_clear_npc_arrival`(신규 CSV 2건, `[담당자]`/`[미션제목]`/`[닉네임]` 토큰) → 오퍼레이터 기본(기존 폴백). 기존 mission_001~003 손대사는 전혀 안 바뀜.
- **동적 화자**: `IngameDialogTextContext`에 `npcCaptainId/npcName(En)` 추가, `resolveIngameDialogPortraitSource`가 씬 고정 `speakerNpcCaptainId`보다 컨텍스트 오버라이드를 우선하도록 수정, 라벨("[ AI 오퍼레이터 ]" 위치)도 `applyTextContext`를 타도록 해 `[담당자]` 토큰이 이름으로 치환됨.

### 광물 샘플 운송(`tq_del_03`) 검증

목표 2개(`buy_goods minerals×3` → `reach_system __neighbor_system__`)로, ArcCore 인스턴스 미션이라 수락 시 `__neighbor_system__`이 실제 인접 성계로 치환된 상태의 Mission이 `getMissionById`에서 반환됨을 확인 — 제 리졸버는 이 materialize된 실제 목표를 그대로 받아 목적지 행성(성계의 첫 행성)을 해석하므로 정상 동작합니다. `sceneKind`는 `buy_goods` 동반이라 `delivery`로 판정 — 완료 시 목적지 행성 바 주인이 "화물 확인했다" 계열 대사로 응답합니다.

### 유사 퀘스트 "완료 안 되는 리스크" 점검 결과

이번 기능은 **완료 판정 로직(`completeObjective`/objectives/allDone)을 전혀 건드리지 않습니다** — 어떤 씬·NPC가 보여지는지만 바꿉니다. 따라서 이전에 보고한 §2(동시 완료 슬롯 덮어쓰기, 김팀장 조치완료)·§3-B/3-C(식량팩 배달 재검증, `resolveHudCurrentObjective.ts`로 대응 중인 것으로 보임 — 관련 테스트 파일 확인) 외에 신규로 "완료 안 되는" 리스크를 추가하지 않았음을 코드 경로 추적으로 확인했습니다. 유일한 부작용 리스크는 화자 데이터 누락 시(예: 담당 NPC가 나중에 로스터에서 삭제됨) `[담당자]` 토큰이 빈 문자열로 나오는 **표시상 결함**뿐이며, 완료 자체는 막지 않습니다(오퍼레이터 폴백 체인이 씬 선택 실패 시에도 항상 동작).

### 커밋 전 체크리스트

CSV 2건(`mission_clear_npc_delivery`/`_arrival`)과 재생성된 `csvStoryScenes.ts`가 함께 커밋되어야 합니다(빌드 스크립트로 재생성 가능하지만 diff에 포함 확인 권장).

코드 구현 완료 — 대표님께: 「김팀장(Cursor 본창) 검수 요청」 안내 부탁드립니다.

---

## 📋 REVIEWED — 퀘스트 완료 담당자(NPC) 대화 고도화 설계 · 2026-08-24

```text
status=REVIEWED
task_id=mission-clear-npc-dialog-design-20260824
kim_team_verdict=PARTIAL — 스냅샷·3단 씬은 채택. governor 기본·목적지 전원 배정은 대표님 정본으로 정정
```

## 📋 PENDING — 퀘스트 완료 담당자(NPC) 대화 고도화 설계 · 2026-08-24 (원문 보존)

```text
status=REVIEWED
task_id=mission-clear-npc-dialog-design-20260824
kind=DESIGN + 신규 파일 준비(비침습)
code_changes=YES (신규 파일 3개만 — 기존 파일 0건 수정)
files_added=docs/퀘스트_완료_담당자_대화_고도화_설계.md, src/missions/resolveMissionClearNpcContext.ts, src/missions/resolveMissionClearNpcContext.test.ts
self_check=tsc 0에러 · resolveMissionClearNpcContext.test.ts 8/8 PASS
```

대표님 지시: 「퀘스트 완료조건마다 오퍼레이터 대화가 기본조건 — 각 퀘스트마다 배달지·도착 행성의 담당자(수락 시부터 배정)가 대화에 응답하는 프로세스를 추가. 기존 시스템 철저 분석 후 고도화 설계·구현 준비.」

### 분석 결론 — 신규 인프라 대부분 불필요

전수 분석 결과 필요한 인프라가 **이미 대부분 존재**합니다: 행성별 고정 담당자(`planet_governor_commanders.csv` + `planetGovernorRegistry.ts`, 점령 변경 런타임 오버라이드까지 지원), 대화 텍스트 토큰 치환(`[미션제목]`/`[닉네임]`), 화자 초상 동적 해석(`speakerNpcCaptainId`). 신규로 필요한 건 "이 인프라를 퀘스트 완료 대화에 연결하는 다리"뿐입니다. 부수 발견: `Mission.clearDialogSceneId` 필드가 CSV엔 채워지는데 실제 resolver가 이 필드를 안 읽고 문자열을 재계산합니다(死필드) — 이번 설계는 이 선례를 반복하지 않고 실제로 읽는 필드로 만들었습니다.

### 핵심 결정 3가지 (문서 §2 상세)

1. **오퍼레이터=기본/폴백, 담당자=향상 레이어** — 담당자를 못 찾으면(미배정·talkEnabled=false·전투형처럼 목적지 없는 미션) 지금과 100% 동일하게 오퍼레이터 유지. 무엇도 깨지지 않는 구조.
2. **배정 시점=수락 시 스냅샷** — 담당자는 점령전으로 런타임에 바뀔 수 있어서, 완료 시점에 다시 조회하면 우호 NPC였다가 적대로 바뀐 채 응답하는 모순이 생깁니다. `MissionProgress`에 신규 optional 필드(`assignedClearNpcCaptainId`)로 수락 순간 스냅샷 — 대표님 "수락 시부터 배정" 지시와 정확히 일치.
3. **씬 우선순위 3단**: 미션별 맞춤 씬(기존, 최우선 유지) > 담당자 배정 시 제네릭 템플릿 2종("배달 수령"/"도착 보고", `[담당자]` 토큰) > 오퍼레이터 기본(기존 폴백). 기존에 손으로 쓴 mission_001~003 완료 대사는 전혀 안 바뀝니다.

### 이번 턴 준비물 — 신규 파일만, 기존 파일 무수정

`missionStore.ts`/`ingameDialogTypes.ts`/`ingameDialogViewModel.ts`/`ingameDialogSceneIndex.ts` 실통합은 **일부러 이번 턴에 안 했습니다** — 지금 이 파일들이 김팀장의 §2 클리어 큐·§3-C 식량팩 작업으로 동시 편집 중이라 충돌 방지 차원입니다. 대신 아무 데서도 아직 안 쓰이는 순수 함수 모듈만 준비했습니다:
- `src/missions/resolveMissionClearNpcContext.ts` — 목적지 행성 해석(reach_planet 직접/reach_system→시스템 첫 행성) + governor 조회(talkEnabled 확인) + 씬 종류(배달/도착) 판정. 스토어·CSV I/O 전혀 없는 순수 함수라 안전하게 리뷰·재사용 가능.
- 테스트 8/8 PASS(reach_planet/reach_system/목적지 없음/governor 미배정/talkEnabled=false 등 전 케이스).

문서 §5에 실제 통합 시 손댈 5개 파일과 변경 요지를 표로 정리해뒀습니다 — 김팀장 검수 후 그대로 진행 가능한 규모(신규 아키텍처·신규 트리거 없음, 기존 완료 파이프라인에 씬 선택 우선순위 1단만 추가).

코드 변경은 신규 파일 3개뿐(기존 파일 무영향). 대표님께: 「김팀장(Cursor 본창) 검수 요청」 안내 부탁드립니다.

---

## ✅ REVIEWED — 퀘스트 전수검사 §2·§3·§3-B · 김팀장 재대조 마감 · 2026-08-25

```text
status=REVIEWED
task_id=mission-system-full-integrity-review-20260823
kind=CODE_REVIEW
kim_claude_verdict=PARTIAL — §2·§3 조치 후 §3-B·§3-C 남김
kim_team_verdict=§2 AGREE+FIX · §3 AGREE+DOC · §3-B AGREE+FIX · §3-C OPEN(식량팩, 퀘스트 파이프와 별축 · 신규 실측 없으면 재개 금지)
reviewed_at=2026-08-25
```

재대조: `pendingMissionClearQueue` 동작 · `missionObjectiveDsl`는 `hub_landing` 정본 · HUD `resolveHudCurrentObjective` + `mission.hud.cargoShort` 유지. §3-C는 당시 관찰만 — 이번 재검토에서 재현·패치 없음.

---

## 📋 REVIEWED (원문 보존) — 퀘스트(미션) 시스템 수락~진행~완료 전수 정밀검사 · 2026-08-23 (실사용 제보 §3-B·3-C 추가)

```text
status=REVIEWED
task_id=mission-system-full-integrity-review-20260823
kind=CODE_REVIEW
code_changes=YES (김팀장 §2·§3 후속 완료) + §3-B HUD 화물부족 표시 적용 · §3-C 다음 단계
kim_claude_verdict=PARTIAL — §2·§3은 김팀장 조치 완료. §3-B(원인 확정) · §3-C(원인 미확정, 김팀장 진행 중인 식량팩 아이템 수정과 연관 추정) 신규 판단 필요
kim_team_verdict=§2·§3 AGREE+FIX · §3-B AGREE+(a) HUD 화물부족 재표시 · §3-C 다음 단계
scope=src/store/missionStore.ts, src/engine/MissionEngine.ts, src/missions/*(수락/진행/완료 전체 체인), app/(game)/{worldmap,combat,trade}.tsx·planet.tsx 소비부, tables/content/mission*.csv, 식량팩(food) 아이템 인벤토리 파이프라인
self_check=tsc 0에러 · missionCategory.test.ts · pendingMissionClearQueue.test.ts · resolveHudCurrentObjective.test.ts
```

**김팀장 재확인·조치 (2026-08-23):**  
§2 동시 완료 덮어쓰기 **AGREE** — `pendingMissionClearQueue`(상한 8, persist 없음)로 헤드를 보존하고, hydrate는 막힌 미션을 한 번에 전부 복구. 이동전투 postFlow는 성공 후 다음 헤드를 이어 present.  
§3 계약 문서 **이미 hub_landing 정본**이었음(김클로드 검수 시점과 어긋난 구문서는 해소). `system_arrival` 전용 분기는 만들지 않음 — DSL·`missionCategory`에 「향후 플래그 추가」만 명시.  
`MISSION_SYSTEM_HANDOFF.md` 목표 표도 허브 착륙으로 정합.

**대표님 지시(2026-08-23, 이 시점 추가): 「식량팩 아이템은 김팀장이 별도로 수정 중. 현재까지 확인된 문제를 모두 김팀장에게 보고하라.」** → 아래 §3-B·§3-C가 그 보고 대상입니다. §3-C는 진행 중인 식량팩 아이템 수정과 겹칠 가능성이 높아 제가 추가로 원인을 파고들지 않고 관찰 사실만 남겼습니다.

대표님 지시: 「퀘스트 시스템 수락→단계별 체크 업데이트→퀘스트 종류별 수행·처리 무결성 전수 검사」. 김팀장이 선작업 중인 시스템이라, Explore 서브에이전트로 전체 파일 지도를 먼저 뽑은 뒤 **에이전트 보고를 그대로 믿지 않고 핵심 파일 전부를 제가 직접 읽어 재검증**했습니다(아래 §2에 실제로 에이전트 보고가 틀렸던 사례 기록).

### 1. 수락(Accept) — AGREE

`missionStore.ts`의 `acceptQuestMission`/`acceptMainStoryMission`(+deprecated alias `acceptInstanceMission`) 모두 존재/objective 有無/트랙 일치/행성/레벨/선행미션/캡틴/보드 상태(ArcCore 인스턴스 전용 `not_on_board`) 순으로 촘촘히 가드하고 있고, 실패 사유가 문자열 유니온 타입(`AcceptQuestMissionResult` 등)으로 전부 명시돼 있어 UI가 사유별 분기하기 쉽습니다. `activeMissionId`(QuestHUD 주선 핀) 승계 로직도 트랙 우선순위(튜토리얼 > 메인스토리 > 의뢰)가 3개 수락 함수에서 일관됩니다.

### 2. ⚠️ 핵심 결함 — 동시 완료 시 `pendingMissionClearDialog` 단일 슬롯이 서로를 덮어씀 (CONFIRMED)

- `completeObjective`(`missionStore.ts:470-517`)는 마지막 objective가 완료되면 보상 지급 없이 `pendingMissionDialogId`/`pendingMissionClearDialog`(스토어에 **딱 1개 슬롯**)만 세팅하고 리턴합니다. 실제 보상 지급·`status:'complete'` 전환·체인 진행은 전부 `finalizeMissionCompletion`(대화 종료 후 `grant_mission_rewards` 액션이 호출)에서만 일어납니다.
- **모든 미션이 이 경로를 탑니다** — `resolveMissionClearDialogSceneId`가 특정 클리어씬이 없으면 `mission_clear_default`로 폴백하는데, 이 씬이 실제로 `csvStoryScenes.ts`에 존재함을 확인했습니다. 즉 `completeObjective` 안의 "클리어씬 없으면 즉시 완료" 분기(519-530행)는 **도달 불가능한 죽은 코드**이고, 사실상 전 미션이 단일 슬롯 경로를 씁니다.
- 그런데 `buy_goods`(`applyBuyGoodsMissionObjectives.ts`) · `reach_planet`/`reach_system`(`missionPlanetHubSync.ts`→`applyReachSystemMissionObjectives.ts`) · `defeat_enemy`(`applyDefeatEnemyMissionObjectives.ts`) 4개 진행-갱신 함수 **전부**가 `listActiveMissionBundles()`로 활성 미션 전체를 순회하며 조건 충족 시 `completeObjective`를 동기 루프 안에서 호출합니다. **같은 이벤트(구매 1회·착륙 1회·전투 승리 1회) 안에서 서로 다른 두 활성 미션이 동시에 마지막 objective를 채우면**, 두 번째 `completeObjective` 호출이 `pendingMissionDialogId`/`pendingMissionClearDialog`를 덮어써 첫 번째 미션의 클리어 등록이 사라집니다.
- **결과**: 덮어써진 미션은 `progresses[id].objectives`가 전부 `true`인데 `status`는 계속 `'active'`로 남고, 대화·보상·체인 진행이 전부 보류된 채 QuestHUD에 "다 깼는데 안 사라지는" 퀘스트로 남습니다. 크래시·에러 로그는 없어 조용히 발생합니다.
- **완전히 유실되지는 않음**(정확성을 위해 정정): 앱 재부팅 시 `loadLocalMissions()`(261-277행)가 "활성+전 objective 완료+pending 없음" 미션을 찾아 클리어 대화를 재등록하는 스윕이 있어 **다음 세션에서 자연 복구**됩니다. 다만 이 스윕은 **한 번에 1건만**(`break`) 복구하므로, 동시에 2건 이상 막혀 있으면 재부팅을 여러 번 해야 전부 풀립니다 — 세션 내내 완료가 안 되는 게 아니라 "재부팅해야 완료된다"는 지연/UX 결함입니다.
- **재현 조건 예**: 서로 다른 두 활성 미션이 같은 최종 objective를 동시에 만족 — 예) 두 sandbox 의뢰가 동시에 같은 재화(`food` 등) 구매를 마지막 목표로 두거나, 튜토리얼/메인스토리/의뢰가 같은 행성에 착륙하는 것을 각자의 마지막 objective로 두는 경우. 지금 21개 미션 CSV에서 이런 조합이 동시에 활성 상태가 되는 실제 사례를 콘텐츠 단에서 특정하진 않았으나, **QuestHUD가 이미 "동시에 여러 의뢰 활성" 설계(스크롤 리스트)로 확장돼 있어** 콘텐츠가 늘어날수록 재현 확률이 올라가는 구조적 리스크입니다.
- **제안**(코드 미수정, 판단 요청): `pendingMissionClearDialog`를 단일 값 대신 큐(배열)로 바꾸거나, `completeObjective`가 기존 pending을 덮어쓰기 전에 먼저 큐에 밀어넣는 처리만 추가하면 근본 해결됩니다. 수정 여부·방식은 김팀장 판단에 맡깁니다.

### 3. `reach_system` 게이트 — 문서(v1 동결 계약)와 실제 동작 불일치 (문서 결함, 코드는 의도된 동작)

- `src/missions/missionObjectiveDsl.ts`(§`reach_system`, "v1 동결" 계약 문서)는 "완료 조건(비배송): `worldmap.tsx` `doMove` 종료 시 성계 id 일치"라고 명시하지만, 실제 `shouldApplyReachSystemObjective`(`missionCategory.ts:27-32`)는 `_mission` 파라미터를 아예 쓰지 않고 `gate === 'hub_landing'`만 봅니다. `worldmap.tsx:1589`·`transitCombatSession.ts:60`(둘 다 성계 도착 시점, `gate` 미지정→기본값 `'system_arrival'`)에서 호출하면 **모든 미션이 스킵**되고, `reach_system`은 배송이든 단순 이동이든 **행성 허브 착륙에서만** 완료됩니다.
- 이건 버그가 아니라 **의도된 현재 동작**입니다 — `missionCategory.test.ts`가 정확히 이 동작("all reach_system complete on hub landing only")을 테스트로 고정해뒀고, 직접 실행해 PASS를 확인했습니다. 다만 `missionObjectiveDsl.ts`(계약 문서, "v1 동결"이라 신뢰되는 문서)가 이 결정과 **정반대 내용을 여전히 적어두고 있어** 향후 미션 콘텐츠 작성 시 오해 소지가 큽니다.
- 실사용 영향은 제한적입니다 — 허브 기반 게임이라 목적 성계 도착 후 대개 착륙하므로 대부분 "도착=완료"처럼 보이지만, **착륙할 행성 허브가 없는 성계를 목표로 하는 순수 이동형 미션**(현재 CSV의 `mission_004`/`mission_005`/`tq_oth_01`/`tq_oth_06` 등 "도착"류)이 있다면 해당 성계에 착륙 가능한 행성이 없는 한 영구히 완료 불가할 수 있습니다 — 대상 성계들이 전부 착륙 가능한 행성을 가졌는지는 이번 검수 범위 밖(월드 데이터 대조 필요)입니다.
- **제안**(판단 요청): (a) 계약 문서를 실제 동작("전부 hub_landing")에 맞춰 갱신, 또는 (b) 원래 의도대로 비배송은 system_arrival에서도 완료되게 `shouldApplyReachSystemObjective`에 `isDeliveryHubLandingMission(mission)` 분기를 되살리는 것 — 둘 중 방향 결정이 필요합니다.

**3-A. 대표님 확인(2026-08-23)**: 「이동 퀘스트는 거의 90%가 행성허브 도착으로 생성될 것이고, 단순 성계(지도상) 이동 시 발생하는 퀘스트·이벤트 처리가 있을 수 있다」— 즉 현재 코드의 "전부 hub_landing" 동작이 대다수(90%) 케이스에는 **의도와 맞습니다**(§3의 (a) 방향, 문서만 고치면 됨). 다만 향후 "성계 지도 이동만으로 트리거되는" 소수 퀘스트·이벤트를 만들 계획이 있다면 주의가 필요합니다 — `shouldApplyReachSystemObjective`는 `gate==='system_arrival'`일 때 **미션 종류와 무관하게 무조건 false**를 반환해, `worldmap.tsx:1589`·`transitCombatSession.ts:60`(성계 도착 시점 호출)의 `reach_system` 완료 경로가 **현재 100% 죽어있는 상태**입니다. 즉 지금 코드베이스엔 "성계 도착만으로 완료"되는 목표를 만들 수단이 전혀 없습니다 — 나중에 그런 소수 케이스가 필요해지면 문서 정정과 별개로 `shouldApplyReachSystemObjective`에 실제 분기(예: 미션에 `arrival_only` 플래그나 `isDeliveryHubLandingMission` 역방향 체크)를 새로 만들어야 합니다. 지금 당장 막힌 콘텐츠는 없어 급하지 않지만, 이 캐퍼빌리티 자체가 비어있다는 걸 김팀장이 인지하고 있어야 향후 설계 시 놓치지 않습니다.

### 3-B. 실사용 제보(2026-08-23) — 「외곽항로 점검(`sandbox_002`) 배달 목표가 도착해도 완료 안 됨」 — **근본원인 확정(CONFIRMED)**

대표님이 실기 테스트 중 보고. 처음엔 `mission_001`로 추정했으나 대표님이 "외곽항로 점검" 퀘스트라고 특정 정정 — 실제로는 **`sandbox_002`**(CSV title "외곽 항로 점검"/"Outer Route Check", `type=delivery`)였습니다. 목표 2개: `obj_s002_a`(`buy_goods`, food×3) · `obj_s002_b`(`reach_system`, `vega_outpost`, "베가 전초기지로 이동").

**게임 내 실제 상태를 대표님께 직접 확인받아 근본원인을 확정했습니다**(추정이 아님): 미션 진행 목록에 "식량 팩 3개 구매"는 이미 체크된 상태인데, **현재 인벤토리엔 식량팩이 0개**입니다.

**원인**: `applyReachSystemMissionObjectives`(`applyReachSystemMissionObjectives.ts:36-78`)는 배송형(buy_goods 동반) `reach_system` 목표를 완료 처리할 때, **이미 체크된 `buy_goods` progress 플래그를 신뢰하지 않고 도착 시점의 실제 인벤토리를 다시 확인·소모**합니다(51-64행: `countGoodInInventory(...) >= required` 재검증 후 `removeGoodFromInventorySlots`로 실제 차감). 즉:
1. 식량팩 3개 구매 → `obj_s002_a` 영구 체크(정상, 여기까진 의도대로 동작).
2. 그 후 어떤 이유로든(판매·소모·다른 활동 등) 식량팩이 인벤토리에서 사라짐 — **objective 체크는 그대로 유지된 채**.
3. 베가 전초기지 도착 → `obj_s002_b` 완료를 시도하지만, 51-56행의 재검증에서 `countGoodInInventory('food') < 3`으로 `canDeliver=false` → **완료되지 않고 조용히 스킵**(`applyReachSystemMissionObjectives.ts:66-72`가 `deliverFailTitle`/`deliverFailBody` 알림을 띄우도록 되어 있으나, 대표님이 알림을 언급하지 않으신 걸 보면 놓쳤거나 알림 자체가 눈에 띄지 않았을 가능성 — 이 부분은 별도 확인 필요).

**즉 "허브에 도착해도 갱신이 안 된다"는 정확한 관찰이었고, 원인은 버그라기보다 설계 허점입니다**: HUD는 `buy_goods` 체크를 영구 완료처럼 보여주지만(`QuestHUD.tsx:67` `mission.objectives.find(obj => !progress.objectives[obj.id])` — 이미 true인 objective는 표시 목록에서 사라짐), 실제 배달 로직은 그 체크를 신뢰하지 않고 매번 재검증합니다. 플레이어 입장에선 "이미 다 했다"고 표시된 목표가 실은 "그 재화를 계속 갖고 있어야 완료된다"는 숨은 조건이 있는 셈이라 혼란을 유발합니다.

**대표님 조치(즉시)**: 식량팩을 다시 3개 이상 구매한 뒤 베가 전초기지에 재입장하면 정상 완료될 것으로 예상됩니다(코드 로직상 재검증만 통과하면 바로 `completeObjective` 호출).

**제안**(판단 요청, 코드 미수정): (a) 현재 동작 유지 — "배송 시점에 실제로 화물을 갖고 있어야 한다"는 설계 의도라면, 대신 HUD가 `buy_goods` 체크를 "영구 완료"가 아니라 "현재 보유량 부족" 상태를 다시 드러내도록 개선(예: 재화 부족해지면 체크 해제 또는 경고 표시). (b) 원래 "한 번 사면 그걸로 충분"이 의도라면 도착 시 재검증·소모 로직을 없애고 `progress.objectives[obj_s002_a]===true`만으로 완료 처리. 김팀장 판단 필요.

**김팀장 조치(2026-08-23, 1단계만):** (a) 채택 — 배달은 실화물 재검증 유지(허브 실패 팝업은 넣지 않음). HUD만 `resolveHudCurrentObjective`로, 이동 목표가 아직 남았는데 화물이 부족하면 구매 목표를 다시 보여 `· 부족`을 붙인다. persist 플래그는 그대로 둔다(배달 직후 클리어 대기 중 구매 목표가 되살아나지 않게, 미완료 reach가 있을 때만). §3-C는 다음 단계.

### 3-C. 실사용 제보(2026-08-23) — 「식량팩 10개 구매 직후 인벤토리에 식량팩이 안 보임」 — **원인 미확정, 김팀장 진행 중인 식량팩 아이템 수정과 연관 가능성**

§3-B 확인 직후 대표님이 베가 전초기지(도착 상태)에서 식량팩 10개를 구매 → **인벤토리에 식량팩 0개**, "외곽항로 점검" 퀘스트도 **여전히 미완료**로 확인.

**§3-B 메커니즘만으로는 이 결과가 설명되지 않습니다** — 코드를 따라가면 다음이 예상됩니다: `trade.tsx:566-568`에서 구매분(+10)을 `setPlayer`로 반영 → 곧바로 `trade.tsx:584` `reconcileActiveMissionProgressAfterEvent()` → (도착 상태이므로) `applyLandedMissionObjectives('vega_base')` → `applyReachSystemMissionObjectives`가 재검증에서 이번엔 `countGoodInInventory('food') = 10 ≥ 3`을 통과해 3개를 `removeGoodFromInventorySlots`로 소모하고 `obj_s002_b` `completeObjective` 호출 — **즉 코드 흐름대로면 "7개 남고 퀘스트는 자동 완료"가 정상 예상값**입니다. 그런데 실제로는 0개·미완료라 **예상과 다릅니다.**

가능성 있는 지점(코드 미수정, 우선순위 판단·추가 조사는 김팀장):
1. `addToInventorySlotsMax`(구매 시 인벤토리 추가 함수, `trade.tsx:551`)가 `food` goodId에 대해 실제로는 슬롯에 추가하지 못하고 있을 가능성(꽉 찬 슬롯·아이템 정의 이슈 등) — 대표님이 "식량팩 아이템은 김팀장이 수정 중"이라고 하신 것과 겹칠 가능성이 높습니다.
2. 인벤토리 UI 표시 쪽이 최신 `player.inventorySlots`를 반영하지 못하는 별개의 렌더링/구독 문제일 가능성.
3. §3-B의 배달 재검증 로직이 `food` 아이템 정의 쪽 문제와 맞물려 예상보다 많이(또는 전량) 소모하고 있을 가능성.

**제가 더 파고들지 않은 이유**: 대표님이 "식량팩 아이템은 김팀장이 별도로 수정 중"이라고 명시하셔서, 이미 진행 중인 작업과 중복/충돌하지 않도록 관찰 사실만 기록하고 원인 조사는 김팀장께 맡깁니다. 다만 이 관찰(0개·미완료)이 §3-B의 배달 재검증 설계(코드 로직상 정상이라면 7개가 남아야 함)와 어긋난다는 점은, 김팀장이 진행 중인 식량팩 수정이 **§3-B의 증상까지 함께 해결/설명**할 가능성을 시사하므로 교차 참고해 주시기 바랍니다.

### 4. 그 외 확인 — 참고용

- **Explore 에이전트 보고 오류 1건 발견·직접 정정**: 최초 지도 작성 에이전트가 "`applyDefeatEnemyMissionObjectives.ts`는 어디서도 호출되지 않는 죽은 코드"라고 보고했으나, 제가 직접 grep·코드 대조한 결과 `app/(game)/combat.tsx:217`(`handleVictory`)과 `PlanetEdenRaidTestLayer.tsx:2932`에서 실제로 호출되고 있어 **에이전트 보고가 틀렸음을 확인, 정정**했습니다(CLAUDE.md 재검수 원칙에 따라 에이전트 산출물도 그대로 신뢰하지 않고 직접 검증).
- `defeat_enemy`도 동일한 `listActiveMissionBundles` 순회 + `completeObjective` 동기 호출 패턴이라 §2와 같은 리스크를 공유합니다(적 1체 격파가 서로 다른 두 미션의 마지막 목표를 동시에 만족하는 경우).
- `deliver_cargo` 타입은 문서·타입 정의만 있고 실제 CSV 미션 어디에도 쓰이지 않음(0건) — "미구현"이라는 문서 설명과 실제가 일치, 현재 살아있는 결함 아님.
- 튜토리얼 체인 종단 처리(`markTutorialCompleteIfChainEnded`)·세이브 로드 소급(`reconcileTutorialCompleteFromProgress`)·ArcCore 인스턴스 의뢰(보드 상태·`markBoardEntryAccepted`/`Cleared`) 연동은 별도 결함 없음.

### 결론

수락 경로는 견고합니다. §2·§3은 김팀장이 이미 조치 완료(위 기록). **남은 판단 대상은 §3-B(배달형 목표의 재검증·소모 설계 — 원인 확정, 방향 결정만 필요)와 §3-C(식량팩 구매 직후 인벤토리 소실 — 원인 미확정, 김팀장 진행 중인 식량팩 아이템 수정과 연관 가능성 높음)** 입니다.

코드 수정 없음(§3-B·3-C 모두 검토·관찰만). 대표님께: 「김팀장(Cursor 본창) 검수 요청」 안내 부탁드립니다.

---

## 📋 REVIEWED — 행성허브 원형행성 그래픽 베이크 전수 검수 · 2026-08-22

```text
status=REVIEWED
task_id=planet-hub-globe-bake-review-20260822
kind=CODE_REVIEW
code_changes=YES (김팀장 후속: 중복 스크립트 제거 · 룩 유니크 테스트)
kim_claude_verdict=AGREE (경미 항목)
kim_team_verdict=AGREE+CORRECT
scope=src/game/planetGlobeLookCanon.ts, planetGlobeBakeSample.ts, tempAdminArcadiaGlobeBake.ts, tools/planet-globe-bake/*, src/data/generated/planetGlobeBakedAssets.ts, assets/images/planet/baked/*.png, planetHubSubcomponents.tsx의 PlanetDot 소비부
self_check=tsc PASS · test:planet-globe-look · bake-arcadia 삭제 · sample 런타임 import 0
```

**김팀장 재확인 (2026-08-22 후속):** 구조·킬스위치·PlanetDot 틱 미연결 **AGREE**.  
정정: `require`는 번들 포함만 — 허브 마운트 시 Fresco **1장 디코드**는 있음(성운 1024와 다른 256급).  
채택: `bake-arcadia-globe.ts` 중복 제거 · `planetGlobeLookCanon.test.ts` 결정론·kind 내 샘플 불일치.  
커밋은 대표님 지시 시에만(PNG 21장 동반).

대표님 지시: 「행성허브 그래픽 원형행성만, 그래픽 베이크 작업전체를 전수 검사하라」. 김팀장이 신규로 만든 "허브 중앙 원형행성(구체) 이미지 베이크" 파이프라인을 빌드타임 스크립트→생성 자산→런타임 소비까지 전 구간 코드로 추적했습니다.

### 1. 구조 — 빌드타임 전용, 런타임은 정적 PNG만 소비 (AGREE)

- `planetGlobeBakeSample.ts`(순수 FBM 노이즈 구체 셰이더 함수, `habit/arid/barren/volcanic/gas/umbral/aether/station` 8종)에 "런타임 틱·Skia 루프에서 import 금지" 주석이 있는데, **grep으로 직접 확인**: 실제 임포터가 `tools/planet-globe-bake/bake-core-planet-globes.ts`·`bake-arcadia-globe.ts` 2곳(둘 다 Node 빌드 스크립트, `sharp`로 PNG 인코딩)뿐 — 런타임 코드 임포트 0건. 주석과 실제가 일치합니다.
- 생성된 21개 PNG(256×256, 총 ~1.42MB, `assets/images/planet/baked/`)는 `src/data/generated/planetGlobeBakedAssets.ts`에 `require()`로 정적 매핑 — RN 표준 정적 자산 경로라 런타임에 새 디코드/할당을 유발하지 않습니다.
- 소비부(`planetHubSubcomponents.tsx:198,217-224` `PlanetDot`)는 허브 중앙 행성 1개만 렌더 — 궤도 함선/오브젝트처럼 매 프레임(`orbitClockMs`) 갱신되는 레이어가 아니라, `orbitClockMs`가 `SharedValue<number>`(Reanimated, UI스레드 전용)로만 하위 궤도 컴포넌트에 전달되고 `PlanetDot`에는 애초에 전달되지 않는 것을 직접 확인 — **틱마다 재렌더/재디코드되지 않습니다.**
- `<Image resizeMode="cover" resizeMethod="resize" .../>`: `resizeMethod="resize"`가 안드로이드에서 원본을 전체 디코드 후 스케일하지 않고 네이티브 다운샘플 디코드를 쓰게 하는 기존 모범 패턴 — 256px 소스를 84px 표시 크기로 줄이는 이 용도에 정확히 맞게 적용됨.

### 2. 킬스위치·폴백 체인 — AGREE

`TEMP_ADMIN_ARCADIA_GLOBE_BAKE`(`tempAdminArcadiaGlobeBake.ts:11`) `false` 1줄로 즉시 복구(→ 기존 SVG 초상 경로). `combatMuted` 시에도 `resolveArcadiaGlobeBakeSource`가 `null`을 반환해 자동으로 SVG 초상(전투 회색 톤 지원)으로 폴백 — PNG는 정적 색상이라 전투 뮤트 틴트를 표현할 수 없는데, 그 상황만 골라 기존 경로로 우회하는 설계가 정확합니다. `tempAdminArcadiaPlanetPortraitOverride.ts`(블루그린 틴트, 기존 임시 기능)도 베이크 활성 시 `derived` 그대로 반환하며 조용히 비활성화 — 두 임시 기능 간 충돌 없음.

### 3. 경미 항목 (참고용, 급하지 않음)

- **미커밋 신규 자산**: `assets/images/planet/baked/*.png`(21개) · `src/data/generated/planetGlobeBakedAssets.ts` · `tools/planet-globe-bake/*` · `src/game/planetGlobeLookCanon.ts`·`planetGlobeBakeSample.ts`·`tempAdminArcadiaGlobeBake.ts` 전부 git 미추적(`??`/신규) 상태입니다. 커밋 시 PNG 21개를 함께 `git add`하지 않으면 다른 환경에서 `require('.../assets/images/planet/baked/xxx.png')`가 깨집니다 — 커밋 전 체크리스트에 추가 권고.
- **`bake-arcadia-globe.ts` 중복**: `arcadia_prime`이 이미 `PLANET_GLOBE_LOOK_CANON`(21행성 정본)에 포함돼 `bake-core-planet-globes.ts` 배치 실행만으로도 같은 파일(`arcadia_prime.png`)이 동일 함수로 재생성됩니다. 초기 프로토타입용 단일 스크립트로 보이는데, 지금은 사실상 중복 — 둘 다 남겨둬도 결과물이 어긋나진 않지만(같은 샘플 함수 사용), 유지보수 관점에서 하나로 정리하는 걸 권고(선택).
- 신규 로직(`planetGlobeBakeSample.ts`의 노이즈/FBM 함수들)에 대한 자동 테스트는 없음 — 빌드타임 전용·순수 함수라 리스크는 낮지만, 결정론적 시드 기반이라 회귀 테스트를 붙이기 쉬운 대상입니다(선택 권고).

### 결론

전체 파이프라인이 CLAUDE.md 메모리 1순위 규칙과 정합합니다 — 신규 Skia 없음, 프레임 루프 할당 없음, 빌드타임/런타임 경계가 실제 코드(주석뿐 아니라 import 그래프)로 지켜지고 있고, 킬스위치·폴백 체인도 정상 동작합니다. 위 3개는 전부 코드 품질 관점의 경미한 참고 사항이며 즉시 조치가 필요한 리스크는 없습니다.

코드 수정 없음(검토만). 대표님께: 「김팀장(Cursor 본창) 검수 요청」 안내 부탁드립니다.

---

## 📋 REVIEWED — 은하 지도 줌 인/아웃 구현(코드) 전수 검수 · 2026-08-22

```text
status=REVIEWED
task_id=galaxy-map-zoom-implementation-review-20260822
kind=CODE_REVIEW
code_changes=NO
kim_claude_verdict=AGREE
kim_team_verdict=AGREE
design_doc=docs/은하지도_줌_개발계획.md
scope=src/galaxyMap/galaxyMapZoomLadder.ts(+test), GalaxyMapZoomControls.tsx(신규), app/(game)/worldmap.tsx 줌 연동분
self_check=tsc 0에러 · audit:memory:all 37/37·20/20·PASS·20/20·7/7·hot-path 0hit 전부 PASS · galaxyMapZoomLadder.test.ts 9/9 PASS
```

**김팀장 재확인 (2026-08-23):** 구현 AGREE. 잔여 문서 §8·Z5를 사용 단 1..3(`[−]` 2회) 기준으로 맞춤.

대표님 지시: 「김팀장의 줌인아웃 구현이 끝났다. 코드상의 구현을 검수하라」. 이전 세션(2026-08-21, `galaxy-map-zoom-plan-review-20260821`)은 설계 문서 단계 검수였고, 이번엔 실제 완성 코드를 대조했습니다.

### 1. 지난 설계검수 지적 2건 — 둘 다 정확히 해소됨 (AGREE)

- **`NODE_HIT_R` 스케일 미반영 우려** → `resolveGalaxyMapNodeHitRadius(baseHitR, scale)`(`galaxyMapZoomLadder.ts:87-98`)가 `baseHitR/scale` + 최소 반경 클램프로 정확히 구현. `worldmap.tsx`의 탭 히트 루프가 고정 `NODE_HIT_R` 대신 `nodeHitRRef.current`(스케일 반영값)를 씀 — 확인.
- **`mapLayout.w/h` 다지점 불일치 우려** → 실제 구조는 제 우려보다 더 안전한 방식으로 해소: `toScreen`/`mapContentSize`/`galaxyBounds`는 **전부 1x 그대로 유지**, 줌은 래퍼 View 하나에 순수 네이티브 `transform:[{translateX},{translateY},{scale}]`(`worldmap.tsx:1174-1191`, `zoomCameraStyle`)만 적용. SVG 콘텐츠 좌표계 자체는 절대 커지지 않아 Android SvgView 비정상 크기 크래시 이력과 원천 차단됨. `computeScrollTargetForSystem`/`resolveGalaxyMapZoomMaxScroll`엔 `scale`을 별도 파라미터로 명시 전달 — `toScreen`과의 "식 중복"도 발생하지 않음.
- 탭 좌표 변환(`mapViewportTapToContent`)도 `zoomScaleRef`/`zoomLetterXRef`/`zoomLetterYRef` 등 ref 경유 — JS에서 SharedValue `.value` 직접 읽기 없음(executeSync SIGSEGV 방어 유지, §0-A 계약 그대로).

### 2. `GALAXY_MAP_ZOOM_ENABLED` 킬스위치 — AGREE

`false` 1줄로 버튼 미표시·배율 1 고정 복구 가능(§9 그대로 구현). 신규 persist 없음(세션 한정) 확인.

### 3. 사용 가능 줌 단이 3단(1~3)뿐 — 원본 잠금(§0) 5단(0~4)과 다름 — **대표님 확인 완료, AGREE**

- 코드: `GALAXY_MAP_ZOOM_STEP_MIN=1` / `GALAXY_MAP_ZOOM_STEP_MAX=3`(`galaxyMapZoomLadder.ts:15-17`) — 단 0(최대축소)·단 4(최대확대)는 `stepGalaxyMapZoom()`에서 도달 불가로 클램프. 버튼도 `canZoomOut={zoomStep > 1}`/`canZoomIn={zoomStep < 3}`(`worldmap.tsx:2118-2119`)로 실기에서 항상 비활성. 테스트(`galaxyMapZoomLadder.test.ts:53-70`)도 이 3단 제한을 의도로 못박음.
- 최초 검수 시 이 축소가 §0 "잠금(대표님 정본)"의 5단 요구와 달라 근거 불명으로 PARTIAL 플래그했으나, **대표님이 직접 3단 제한 본인 지시임을 확인** — 문제없음. `kim_claude_verdict=AGREE`로 정정.
- 잔여 사소 항목(코드 수정 불필요, 참고용): 문서 `docs/은하지도_줌_개발계획.md` **§8 완료 게이트**가 옛 5단 기준("최대확대에서 `[−]` 4회 = 최대축소")을 그대로 남겨둬 최상단 "마무리(1..3단)" 선언과 문서 내부적으로 모순 — 다음 문서 정리 시 §8도 3단 기준으로 맞춰두면 향후 재검수 혼선을 줄일 수 있음.

### 결론

메모리·크래시 방어·조작 정합성 전부 우수하게 구현됐고 지난 설계검수 지적사항도 정확히 반영됐습니다. 3단 축소는 대표님 확인 완료 — **전체 AGREE**.

코드 수정 없음(검토만). 대표님께: 「김팀장(Cursor 본창) 검수 요청」 안내 부탁드립니다.

---

## 📋 REVIEWED — 은하 지도 줌 개발계획 · 김팀장 재대조 · 2026-08-22

```text
status=REVIEWED
task_id=galaxy-map-zoom-plan-review-20260821
kind=DESIGN_REVIEW
code_changes=NO
kim_claude_verdict=AGREE
kim_team_verdict=AGREE+CORRECT
design_doc=docs/은하지도_줌_개발계획.md
```

김팀장 재대조(`worldmap.tsx` 줄 확인). SIGSEGV 주석·`clampDim` 8192·`NODE_HIT_R=28`·`toScreen`/`computeScrollTarget` 식 중복 **AGREE**.  
정정: `mapLayout.w/h`를 전부 ×scale 하면 안 됨 — **콘텐츠만** scale, **뷰포트는 불변**.  
채택: hitR 스케일+클램프 · `mapContentSize` clamp 재사용 · Z4 `mapLayout` 전수. 계획 §4-A·§4-B 반영. 코드 미착수.

---

## 📋 (원문 보관) 김클로드 PENDING — 은하 지도 줌 개발계획 독립 재검수 · 2026-08-21

```text
status=REVIEWED
task_id=galaxy-map-zoom-plan-review-20260821
kind=DESIGN_REVIEW
code_changes=NO
verdict=AGREE
design_doc=docs/은하지도_줌_개발계획.md (상태: 코드 미착수)
```

대표님 지시: 「은하지도 줌 개발계획 전수 검사, 특히 메모리·조작 리스크 확인」. 코드가 아직 없는 순수 설계 문서라, 문서가 전제로 삼은 기존 코드 사실들을 직접 코드로 재확인하는 방식으로 검수했습니다.

### 총평

**AGREE.** 핀치 대신 5단 버튼(사다리) 방식을 택한 근거(§0-A)가 실제 코드의 **진짜 크래시 이력**에 기반해 있고, 설계가 제시한 제약("JS에서 SharedValue `.value` 읽기 금지" 등)이 기존 방어 패턴과 **문구까지 정확히 일치**합니다. Skia·신규 persist·레이아웃 상수 변경도 없어 이번 세션 내내 강조된 메모리 1순위 규칙과 정합합니다. 다만 실제 Z4(탭 히트 동기화) 구현 시 놓치기 쉬운 지점 2개를 찾아 아래에 남깁니다.

### 1. §0-A "Pan/Tap worklet executeSync SIGSEGV 이력" — AGREE (실재 확인)

문서가 핀치 대신 버튼을 택한 핵심 근거인데, 지어낸 이유가 아니라 **코드에 지금도 남아있는 실제 방어 패턴**입니다:
- `app/(game)/worldmap.tsx:172` — `/** UI 스레드 전용 — JS useEffect에서 scroll SharedValue 읽기 금지 (executeSync SIGSEGV) */`
- `app/(game)/worldmap.tsx:304` — `/** runOnUI 스크롤 — scrollAlive=1 이전에 실행하면 executeSync SIGSEGV (장기 idle 후 출발) */`
- `app/(game)/worldmap.tsx:471,547` — 2×rAF 이후에만 제스처 arm, `scrollAlive` 게이트로 방지
- `src/game/galaxyMapScrollLifecycle.ts:27` — `// JS에서 scrollAlive=0을 먼저 내린 뒤 UI에서 decay 취소 — blur 직후 제스처 이벤트 SIGSEGV 방지`

설계 §4의 "스크롤 SharedValue는 버튼 탭 후에만 기존 `runOnUI` 클램프로 갱신. JS에서 `.value` 읽기 금지"가 이 기존 규율과 **정확히 같은 문구·같은 이유**로 되어 있어, 새 사고를 유발할 새 패턴을 만들지 않고 기존 안전장치에 올라타는 설계임을 확인했습니다.

### 2. 메모리 — AGREE (신규 위험 없음)

- 은하 지도는 Skia가 아니라 `react-native-svg`(`GalaxyMapSystemsSvg`/`Voronoi`/`UndiscoveredStarlight` 전부 `Path`/`Polygon`) — §0의 "신규 Canvas/핀치 제스처 없음" 주장과 일치, Skia Zero-Allocation 규칙 대상이 아님.
- `mapContentSize`(`worldmap.tsx:996-1008`)에 이미 `Math.max(span, 0.001)`(0분모 방지) + `clampDim([1,8192])`(안드로이드 비정상 크기 네이티브 크래시 방지)가 있음 — **`S_min`/`S_max` 계산이 이 기존 가드를 재사용**하면 새 엣지케이스(bbox 퇴화·과대 캔버스)를 만들지 않습니다. 문서가 "S_min은 뷰포트·bbox로 계산, 상수 금지"라고만 하고 이 기존 가드 재사용을 명시하진 않아 — Z1 구현 시 `mapContentSize`와 같은 clamp를 쓰라고 못박아두길 권고.
- persist 없음(세션 한정, 이탈 시 `1`로 복귀) — 계정 데이터 증가 없음.

### 3. 조작(操作) — AGREE 방향, 구현 시 놓치기 쉬운 지점 2개

- **`NODE_HIT_R`(28px 고정 상수, `worldmap.tsx:155`) 스케일 미언급**: `touchTargets`(탭 히트 판정)의 좌표는 `toScreen`을 타므로 배율이 적용되지만, 비교 대상인 히트 반경 `NODE_HIT_R`는 별개 고정값입니다. 문서 §4는 "히트 박스는 스케일된 좌표"라고만 해서 **좌표만** 스케일하는 것처럼 읽히는데, 그러면 최대축소(노드 간격 좁아짐)에서 인접 노드 오탭, 최대확대(노드 간격 넓어짐)에서 반경이 상대적으로 너무 좁아지는 체감이 생길 수 있습니다. Z4에서 `NODE_HIT_R`도 같이 스케일(또는 최소/최대 클램프)하는 걸 명시해두길 권고.
- **`mapLayout.w`/`mapLayout.h` 직접 참조 지점이 여러 곳**: `toScreen`(958-964줄) 외에도 `mapContentSize`(996-1008줄)·`computeScrollTargetForSystem`(1033-1040줄) 등 **최소 3곳 이상**이 `mapLayout.w`/`h`를 직접 곱해 좌표를 계산합니다. 배율을 `toScreen` 한 곳에만 넣으면 탭 이동 목적지·콘텐츠 크기·실제 렌더 좌표가 서로 어긋날 수 있습니다. Z4 완료 게이트에 "`mapLayout.w`/`h`를 참조하는 모든 지점 목록화 후 배율 동시 적용 확인"을 체크리스트 항목으로 추가 권고(문서 §8엔 "탭 히트·toScreen 동기"만 있고 전수 목록화는 없음).

### 4. 그 외 — AGREE

- 핀치·연속 슬라이더·3클릭 이상 배제(§6), 최대축소에서 700 미발견 풀노드 미전개, `planetMainStageLayout` 불변, 신규 persist 없음 — 전부 리스크를 줄이는 방향의 결정으로 이견 없음.
- 포그·존 로딩과 배율을 독립 축으로 분리(§5)한 것도 설계상 깔끔 — 다만 §4의 `toScreen`이 지난번 검수한 존 로딩의 `starlightSystems` 필터(`isHiddenSystemInGalaxyMapStarlightPayload`)에도 쓰이므로, 배율 도입 후 그 필터가 여전히 "스크롤/포커스 시에만 재계산"(틱 없음) 원칙을 지키는지는 **Z1 구현 후 별도로 한 번 더 확인 필요**(버튼 탭도 트리거에 추가되는 것 자체는 설계 의도상 정상).

### 결론

설계 방향은 그대로 채택 가능. 위 2·3번 세부사항(히트 반경 스케일, `mapLayout.w/h` 전수 목록화)을 Z1/Z4 체크리스트에 한 줄씩 추가해두면 구현 턴에서 재검수가 더 빠르게 끝납니다.

코드 수정 없음(검토만). 대표님께: 「김팀장(Cursor 본창) 검수 요청」 안내 부탁드립니다.

---

## 📋 REVIEWED — 은하 지도 존 분할로딩 전수재점검 · 김팀장 재대조 · 2026-08-21

```text
status=REVIEWED
task_id=galaxy-map-zone-load-review-20260821
kind=CODE_REVIEW
code_changes=NO
kim_claude_verdict=AGREE
kim_team_verdict=AGREE+CORRECT
design_doc=docs/성계700_전개방_메모리_운영_설계.md v0.3 §16-17
scope=src/galaxyMap/galaxyMapZoneContract.ts, galaxyMapZoneLoadSession.ts (+테스트), app/(game)/worldmap.tsx 존 로딩 연동분
```

김팀장 재대조(코드·§16-17). 기하·히스테리시스·별빛 필터·리셋 훅 **AGREE**.  
정정: `visibleSystemsList` ≠ 존5 97 — **코어+레거시+관문16(+해금) ≈ 113**. `galaxyBounds`는 관문까지 포함. 존 필터로 가시 노드를 줄이면 관문이 사라짐.  
범위: Z1 레지스트리 + 로드 세션(별빛만). Z2는 대표님 줌 제외·현행 비주얼 고정이라 **지금 착수하지 않음**.

---

## 📋 (원문 보관) 김클로드 PENDING — 은하 지도 존 분할로딩(Z1) 메모리관리 체계 전수재점검 · 2026-08-21

```text
status=REVIEWED
task_id=galaxy-map-zone-load-review-20260821
kind=CODE_REVIEW
code_changes=NO
verdict=AGREE
design_doc=docs/성계700_전개방_메모리_운영_설계.md v0.3 §16-17
scope=src/galaxyMap/galaxyMapZoneContract.ts, galaxyMapZoneLoadSession.ts (+테스트), app/(game)/worldmap.tsx 존 로딩 연동분
```

대표님 지시: 「은하계지도 분할로딩 메모리관리 체계 전수재점검」. `성계700_전개방_메모리_운영_설계.md`가 오늘 v0.3까지 갱신돼 있어(§16 개발순서 잠금·§17 존 기하 9칸 실측) 최신 설계와 실제 코드를 같이 대조했습니다.

### 총평

**AGREE.** 설계 문서 §17이 못박은 9칸 존 기하 수치(전체 757·존5=97[코어21+레거시76]·십자 4존 각 165[관문4+미발견161]·코너 0)가 **실제 그래프 데이터와 정확히 일치**하고, 히스테리시스(반대 존 즉시 언로드 금지) 로직도 설계 §17-2 그대로 구현돼 있습니다. 신규 테스트 16/16 통과, `tsc` 0에러, `audit:memory:all`(37/37·20/20·20/20·20/20·7/7·hot-path 0hit) 전부 PASS — 회귀 없음을 확인했습니다.

### 1. `galaxyMapZoneContract.ts` (Z1 존 분류) — AGREE

- 9칸 정규화 분류(`resolveGalaxyMapZoneIdFromPosition`)가 그래프 전체 bbox 기준으로 정확히 동작 — 테스트로 전수 검증: 존5=97(코어21+레거시76 정확히 일치), 4개 십자존 각 165(관문4+미발견161), 코너 1/3/7/9는 0(설계 §17-1과 일치).
- 주 관문 매핑(`GALAXY_MAP_PRIMARY_GATEWAY_BY_ZONE`: 2→synth_092, 4→synth_083, 6→synth_085, 8→synth_090)이 설계 §17-2 표와 정확히 일치, 각 관문이 실제로 해당 존에 속하는지도 테스트로 확인됨.
- 순수 함수·모듈 캐시(`boundsCache`/`zoneIdsByZoneCache`) 구조라 매 프레임 재계산 없음 — PSS 정합.

### 2. `galaxyMapZoneLoadSession.ts` (로드 세션) — AGREE

- 초기 상태 = 존5만(설계 §16-4 Z1 계약과 일치).
- 히스테리시스: 현재/선택 성계가 새 방향으로 트리거되면 그 존을 추가하되, **반대 존은 활성 트리거가 반대로 바뀌기 전까진 유지** — 테스트로 north↔south, east↔west 전환 케이스 전부 확인.
- `isHiddenSystemInGalaxyMapStarlightPayload`: 존이 로드됐으면 표시, 아니면 화면 콘텐츠 bbox±48px 마진 폴백 — `worldmap.tsx`의 `galaxyBounds`가 **가시 시스템만의 좁은 bbox**라서 존 5 밖 성계는 자연스럽게 콘텐츠 범위 밖으로 좌표가 밀려나 마진 체크가 의도대로 "가깝/멂"을 가른다는 것을 좌표 계산 직접 추적으로 확인(테스트의 극단값 -400 케이스와 일치).

### 3. `worldmap.tsx` 연동 — AGREE

- `loadedZoneIds` state가 기존 STAGE-safe 리셋 훅(`registerGalaxyMapDeferredTileReset`/`registerGalaxyMapPresentationReset`)에 그대로 얹혀 있어 **새 리셋 경로를 발명하지 않음**.
- `applyZoneLoadState`는 `useCallback([])` + ref 패턴으로 안정적 — 존 변경 감지 `useEffect`가 `currentSystemId`/`selectedSystemId` 변경시에만 재계산.
- `sameGalaxyMapZoneIdList`로 동일 목록이면 `setState` 자체를 생략 — 불필요 리렌더 방지.
- `starlightSystems`의 `useMemo` deps에 `toScreen`이 있는데, `toScreen`이 스크롤 위치가 아니라 레이아웃 치수(`galaxyBounds`/`mapLayout`)에만 의존하는 안정 콜백임을 확인 — **스크롤마다 재계산되지 않음**(설계 §16-5 "스크롤/포커스 시에만" 요구와 일치).

### 4. 범위 확인 — 착각 방지용 (착수 안 함, 정상)

같은 커밋 묶음에 `GalaxyMapContestedZoneRingOverlay.tsx`·`GalaxyMapSystemsSvg.tsx`·`GalaxyMapTerritoryVoronoiSvg.tsx`·`GalaxyMapUndiscoveredStarlightSvg.tsx` 4개 파일도 수정돼 있어서 존 로딩과 관련된 줄 알고 diff를 봤는데, **전부 무관한 별개 수정**(React key 중복 경고 수정 — 동일 systemId 중복 입력 제거, SVG 형제 레이어 간 key 네임스페이스 분리)이었습니다. 존 로딩 관련 import는 이 4개 파일 어디에도 없음(grep 0건) — 헷갈리지 않으시도록 명시해 둡니다.

**지금 구현 범위는 설계 §16-4의 Z1(존 레지스트리)까지이고, 미발견 별빛(starlight) 레이어에만 필터가 붙어 있습니다.** 코어+레거시 가시 노드를 그리는 `GalaxyMapSystemsSvg`·Voronoi·contested-ring은 아직 `visibleSystemsList`(존 5, ~97개, 항상 전량)를 그대로 쓰고 있어 이번 존 로딩의 직접적 절감 대상이 아닙니다 — 이는 설계 §17("존 5는 상시, 가시 노드 불변")이 원래 의도한 범위이지, 빠뜨린 게 아닙니다. Z2(뷰포트 컬링으로 가시 노드 자체를 줄이는 단계)는 아직 착수 전입니다.

### 5. 결론

Z1 단계 구현은 설계와 코드가 정확히 일치하고, 회귀·리스크를 찾지 못했습니다. 다음 단계(Z2 뷰포트 컬링, §16-4)로 넘어가기 전 이 정도 스코프에서는 추가 보강할 점이 없습니다.

코드 수정 없음(재검수만). 대표님께: 「김팀장(Cursor 본창) 검수 요청」 안내 부탁드립니다.

---

```text
status=REVIEWED
task_id=tutorial-system-design-review-20260821
kind=DESIGN_REVIEW
code_changes=NO
kim_claude_verdict=PARTIAL
kim_team_verdict=AGREE+ADD
design_doc=docs/튜토리얼_시스템.md v0.3
```

김팀장 재대조: P0-1·P0-2·P1·P2 **코드 일치(AGREE)**.  
추가: `app/index.tsx` 이어하기 `initTutorialStory()`는 김클로드 목록에 없었으나 동일 P0. 설계 v0.3에 세 발화점·스파이·배틀레디·뱃지 3소스를 흡수함. 게임 코드는 아직 없음.

---

## 📋 (원문 보관) 김클로드 PENDING — 튜토리얼 시스템 설계(v0.2) 독립 재검수 · 2026-08-21

```text
status=REVIEWED
task_id=tutorial-system-design-review-20260821
kind=DESIGN_REVIEW
code_changes=NO
verdict=PARTIAL
design_doc=docs/튜토리얼_시스템.md v0.2 → v0.3
```

대표님 지시: 「선행 앞단 튜토리얼 시스템(김팀장 설계) 재분석·검수 — 보강할 점과 리스크 확인」. 문서 §2·§3의 팩트 주장은 Explore 서브에이전트 2개로 코드 대조, §1-A-3 "침묵 목록"(끼어들면 안 되는 시스템)의 완전성은 `planet.tsx` 전수 grep으로 별도 검증했습니다.

### 총평

설계 자체(강제 순차·화이트리스트 잠금·Table-First 스텝·§12 "0단계=대표님 승인 후 착수")는 v4.0 헌법·PSS와 정합하고 구조가 탄탄합니다. `docs/성계700...`·`ARC_CORE_...` 계열처럼 **코드 착수 전 리뷰 게이트를 스스로 요구**한 점도 좋습니다. 다만 재검수 결과, 착수 전에 반드시 메워야 할 **구멍 2개(P0)**를 찾았습니다 — 둘 다 지금 이대로 구현하면 "튜토리얼 중 아무것도 안 끼어든다"는 문서의 최우선 전제가 실기에서 깨집니다.

### P0-1. `initTutorialStory()` 실제 발화 시점이 문서 가정과 다름 (가장 중요)

문서 §2-1·§6-2는 "인트로 완료(ingame_dialog_01) 시점에 initTutorialStory() 호출"을 전제로 "인트로 완료 → 호출 안 함, D2에서 호출"(1안)을 제안합니다. 그런데 실제로는:

- `src/game/onboardingPilotRegistration.ts:223` — **캐릭터 생성 직후(인트로 시네마틱이 뜨기도 전)** 이미 `useMissionStore.getState().initTutorialStory()`가 호출됨.
- `ingameDialogCompletion.ts:55,69`의 호출은 `initTutorialStory()` 내부 `activeMissionId` 가드에 막혀 사실상 no-op.

즉 `mission_001`(베가 이동)은 실제로 **캐릭터 생성 즉시** 활성화됩니다. §6-2 1안대로 `ingameDialogCompletion.ts` 쪽만 고치면 `onboardingPilotRegistration.ts:223`이 그대로 남아 "D2 전 QuestHUD에 베가 이동이 뜨면 안 된다"는 §4-4 요구가 **바로 깨집니다.** §14 코드 앵커 목록에도 이 파일이 빠져 있습니다. `firstMissionStarted` 플래그는 grep 결과 다른 곳에서 읽는 코드가 없어(세터 2곳뿐) 발화 시점을 늦겨도 부작용은 없어 보입니다 — 이 파일을 앵커에 추가하고 1안 조치 대상에 포함시키면 됩니다.

### P0-2. 스파이 정보원 자동 오픈이 침묵 목록에서 완전히 빠짐

`app/(game)/planet.tsx:1273-1279`:
```js
useEffect(() => {
  if (!planet?.id) return;
  if (!resolveArcCoreSpyPolicy().spyIntelAutoOpenDialog) return;
  if (isIngameDialogActive()) return;
  if (!hasUnacknowledgedPlanetHubSpyIntelAlert(planet.id)) return;
  presentPlanetHubSpyIntelDialog(planet.id);
}, [planet?.id, spyIntelAlertRev, hubDialogBadgeRev]);
```
`spyIntelAutoOpenDialog` 기본값 **true**(`arcCoreSpyPolicy.ts:57`). 가드가 `isIngameDialogActive()`뿐이라 `isHubTutorialActive()` 개념이 전혀 없습니다. A0~D2 도중 스파이 경보 조건만 맞으면 오퍼레이터 대사창을 밀어내고 끼어들 수 있는 실제 경로인데, §1-A-3 표 어디에도 이름이 없습니다.

### P1. "배틀레디"(전투 진입 배너/카운트다운) 완전 누락

`usePlanetHubBattleReady.ts:39-51,75-78` — 적대 함대 궤도 진입(`evaluateHubMainStageCombatEntered`) 시 자동으로 점멸 배너·카운트다운이 뜨고 만료되면 전투 오비트가 열립니다. `useWaveDefenseController`와는 **별개 판정 경로**라서 §1-A-3의 "웨이브 디펜스 자동 시작 금지" 항목이 이걸 커버하지 못합니다. 아르카디아에 적대 세력이 뜨는 조건이면 튜토리얼 중 화면을 가릴 수 있습니다.

### P2. 배지 소스 표현이 실제보다 뭉뚱그려짐

문서는 "명단 배지·무역 뱃지"라고만 쓰지만 실제로는 `mining/service.ts:89`(무역)·`barBoardStore.ts:307,330`(**바**)·`hubDialogBadgeRev`(명단) **3곳**입니다. 기능적 위험은 낮지만(다 숨기면 되므로) 구현 체크리스트 누락 방지를 위해 표를 "무역·바·명단"으로 구체화 권고.

### §2-1·§3 그 외 항목 — AGREE (코드로 확인)

인트로→허브 흐름, `ingame_dialog_01` `planet_landed` 트리거, `planetHubScanUnlockState`가 세션 Map(persist 아님)이라는 서술, 채굴 게이트가 범용 규칙이라는 서술, `tutorialComplete` 플래그 로직, 오퍼레이터 NPC 데이터, `PlanetMainScanActionRow.tsx`의 6개 타일 잠금 조건, `planetHubFeatureSystems.ts`의 5개 시설 CSV 게이트 — 전부 파일:줄 대조로 정확함을 확인했습니다(controlId의 snake_case 표기는 설계 단계 가칭이고 실제 코드는 camelCase — §2-2 "없는 것"에 이미 명시돼 있어 문제 아님).

### 참고 — 최근 QuestHUD 변경과의 정합

이번 세션에서 제가 QuestHUD를 "활성 미션 0개면 완전히 숨김"으로 바꿔둔 게(`bundles.length === 0 return null`), P0-1이 고쳐지면 "D2 전 QuestHUD 안 뜸" 요구를 **추가 게이트 없이 자동으로 만족**시킵니다 — 참고하시면 구현 범위가 줄어듭니다.

### 결론

설계 골격은 그대로 채택 가능하나, **P0-1·P0-2를 §6-2/§14와 §1-A-3에 흡수한 뒤 착수**를 권고합니다. P1은 §1-A-3에 항목 추가, P2는 표 문구만 수정하면 됩니다. 코드는 건드리지 않았습니다.

대표님께: 「김팀장(Cursor 본창) 검수 요청」 안내 부탁드립니다.

---

## 김팀장 검수 — QuestHUD 중복 헤더 (후속 7~10) · 2026-08-20

```text
status=REVIEWED
scope=quest-hud-followups-7-10
verdict=CONDITIONAL_PASS
commit=NOT_DONE
```

- 헤더 1개(「진행 중인 임무」) + 1행 스냅 스크롤 + 무채색 카운트 배지: **지시와 정합**. 트랙라벨을 미션마다 반복하던 「헤더 여러 개」는 해소.
- 검수 중 김팀장 수정: `hasQuestHud`를 `getActiveMission()` → `hasAnyActiveMissionBundle(progresses)` (HUD 가시와 배경 paddingTop 동기). 목표 없는 행 `minHeight` 고정(스냅 깨짐 방지). `listAllMissionHudBundles`는 `listActiveMissionBundles` 재사용.
- `tsc --noEmit -p tsconfig.client.json` **PASS**.
- **미승인·미변경**: `PLANET_MAIN_QUEST_HUD_ACTIVE_EST_PX`(현재 92). 새 HUD 실측 ≈ 헤더26 + 스크롤47 + 보더2 ≈ **75**. 16px 과대 예약. 레이아웃 상수라 대표님 승인 전 미수정.
- 인게임 대사창 크롬(`ingame-narrative-dialog-chrome-20260820`)은 **이 검수 범위 밖** — 아래 PENDING 유지.

---

## 📋 PENDING — 인게임 대사창(narrative) 헤더·하단 크롬 정리 · 김클로드 · 2026-08-20

```text
status=PENDING
task_id=ingame-narrative-dialog-chrome-20260820
kind=UI_FIX
code_changes=YES
commit=FORBIDDEN
```

### 후속 10 — 헤더 우측 카운트 배지 추가 (2026-08-20)

「'진행 중인 임무' 제목 오른쪽 끝에 리스트 숫자를 라운드 배경으로 표시」 → 이후 「무채색으로」 정정.

**변경**: `src/components/QuestHUD.tsx`
- `headerBar`를 `justifyContent:'space-between'`으로 바꾸고, 아이콘+제목을 `headerTitleRow`(`flex:1`)로 묶어 우측에 여백 확보.
- 우측 끝에 `headerCountBadge`(원형, `borderRadius:9`, `minWidth:18`) + `headerCountText`(`ordered.length`) 신규 추가.
- 배지 색은 처음 시안(청록 accent) → 대표님 지시로 **무채색**(`rgba(210,216,224,0.9)` 배경 + 짙은 회색 텍스트)으로 정정, 패널의 나머지 그레이 톤(`chromeBg`/`chromeBorder`/`chromeInk`)과 통일.

**self-check**: `tsc` 에러 0.

### 후속 9 — 가시 높이 1행으로 정정 + 스냅 스크롤 (2026-08-20)

대표님 재지시: 「220px로 보이게 하지 말라 — 헤더(진행 중인 임무) 아래 미션 1개(제목+목표 설명 1줄)만 보이고 나머지는 스크롤」. 제가 임의로 잡은 220px가 3개를 한 번에 보여줘서 "헤더 3개"로 보였던 근본 원인이었음을 재확인.

**변경**: `src/components/QuestHUD.tsx`
- `QUEST_HUD_SCROLL_MAX_HEIGHT_PX`를 임의값(220) 대신 **행 1개 실측 공식**으로 교체: `paddingVertical*2 + 제목 lineHeight + 목표 gap + 목표 lineHeight + 구분선` = 6*2+16+2+16+1 = **47px**. 스크롤 영역이 정확히 미션 1개 분량만 보이게 됨.
- 후속 지시(같은 턴, 「스냅으로 붙게」): `ScrollView`에 `snapToInterval`(행 1개 단위)·`snapToAlignment="start"`·`decelerationRate="fast"`·`disableIntervalMomentum` 추가. 첫 행도 구분선과 같은 높이의 투명 스페이서를 넣어 **모든 행의 단위 높이를 동일하게 맞춰** 스냅 간격이 어긋나지 않게 함.

**self-check**: `tsc` 에러 0.

### 후속 8 — 헤더 1개 + 목록 행 스크롤로 재구조화 (2026-08-20)

「헤더는 1개로 보이고, [나머지는] 스크롤해서 리스트화하라」 — 후속 7에서 각 미션마다 자기 `header` 스타일(아이콘+트랙라벨+제목, 굵게)을 그대로 반복해서 "헤더 3개"처럼 보였던 게 원인.

**변경**: `src/components/QuestHUD.tsx` 전체 재작성.
- 컨테이너 맨 위에 **고정 헤더 1개**만(`🗒️` + `mission.hud.title` 공용 캡션, 밑줄 구분선) — 특정 미션에 종속되지 않는 범용 라벨.
- 개별 미션은 `HudMissionBlock`(헤더 트리트먼트) → `HudMissionRow`로 교체 — 아이콘+제목 한 줄 + 목표 한 줄, 트랙라벨(굵은 텍스트) 제거해 "헤더처럼" 안 보이게 단순화. `ScrollView`(maxHeight 220) 안에 구분선으로만 나뉘어 나열.
- `src/i18n/locales/ko.ts`/`en.ts`에 `mission.hud.title`(「진행 중인 임무」/"Active Missions") 신규 키 추가.

**self-check**: `tsc` 에러 0 · `npm run audit:i18n` **패리티 PASS**(KO/EN 신규 키 정상 대응 확인).

### 후속 7 — "헤더 중복" 원인 규명 + QuestHUD 스크롤 리스트화 (2026-08-20)

대표님 지적: 「인앱 대화창이 메인 헤더창 오류 중복을 만드는지 확인」 → 「튜토리얼 퀘스트 헤더, accepted quest 헤더가 두 개 동시에 나타난다」.

**원인 규명(코드 확인, "중복 렌더 버그" 아님)**: 두 "헤더"는 실제로는 `src/components/QuestHUD.tsx`의 **주선(primary)+부선(secondary) 두 슬롯**입니다 — 튜토리얼(📖)과 수락한 의뢰(📋)가 동시에 활성이면 원래부터 함께 표시되는 **의도된 설계**(`missionHudSlots.ts` 주석: "주선이 의뢰면 부선 생략(중복 방지)" 로직 존재 확인). `QuestHUD`는 `app/(game)/planet.tsx`·`worldmap.tsx`·`combat.tsx`에서 상시 렌더되고 `isIngameDialogActive()` 같은 가드가 전혀 없습니다(`planet.tsx:1723` 확인) — 즉 지금까지 이 두 슬롯이 안 보이거나 덜 보였던 건 순전히 **인앱 대화창 카드가 그 화면 위치를 우연히 가려주고 있었기 때문**입니다. 제가 이번 요청들에서 오프셋을 15→18→20→30, 거기에 상단 흰 여백 +10까지 누적으로 카드를 밑으로 밀면서, 카드가 예전만큼 위쪽을 덮지 않게 됐고 — 원래 항상 그 자리에 있던 QuestHUD 주+부선이 새로 드러나 "헤더 두 개가 갑자기 나타난" 것으로 보입니다. **즉 제 누적 오프셋 튜닝의 부작용이 맞고, QuestHUD 자체는 버그가 아닙니다.**

**대표님 후속 지시**: 「겹치는 퀘스트 진행이면 한 영역 안에서 스크롤로 리스트화하라」 → 2슬롯(주선/부선) 고정 구조를 **전체 활성 미션 스크롤 리스트**로 교체.

**변경**:
- `src/missions/missionHudSlots.ts` — `listAllMissionHudBundles()` 신규 export(기존 정렬 로직 재사용, 개수 제한 없음). 기존 `resolveMissionHudSlots`는 그대로 유지(하위 호환, 다른 소비처 없음 확인).
- `src/components/QuestHUD.tsx` — 주/부선 고정 2슬롯 → `ScrollView`(`maxHeight=220px`) 안에 전체 활성 미션 리스트로 교체. `activeMissionId` 핀은 목록 맨 위로 유지. 2개 초과일 때만 스크롤 인디케이터 표시.

**self-check**: `npx tsc --noEmit -p tsconfig.client.json` 에러 0. (관련 기존 테스트 없음 — `missionHudSlots.ts`/`QuestHUD.tsx` 둘 다 테스트 파일 없었음, 신규 작성은 이번 범위 밖으로 판단해 생략)

**주의**: 이건 "메인 헤더창 중복" 자체를 없앤 게 아니라, 여러 개 겹칠 때 화면을 침범하지 않도록 스크롤 영역에 가두는 처방입니다. 인앱 대화창 오프셋(30+10)을 더 키우면 QuestHUD가 계속 드러난 채로 남아있을 수 있으니, 이후 오프셋을 추가로 조정하실 때는 이 부분도 같이 실기 확인 부탁드립니다.

### 후속 6 — 상단 흰색 여백 10px 추가 (2026-08-20)

「NPC 인앱대화창(아크코어 채팅 아님) 프레임 위쪽에도 하단과 동일하게 흰색 여백 10px 추가 — 지금은 포트레이트만 보여서 잘린 것처럼 보임」

**변경**:
- `narrativeDialogLayout.ts` — `NARRATIVE_DIALOG_TOP_WHITE_MARGIN_PX = 10` 신규 상수. `NarrativeDialogStageFillMetrics`에 `topWhiteMarginPx` 필드 추가. 헤더 실측 스페이서(투명, 헤더 노출)와 카드 사이에 이 값을 끼워 넣고, `bottomBleedPx`에서 같은 만큼 빼서 합(windowHeight) 불변 유지 — 기존 offset 보정과 동일 패턴.
- `NarrativeDialogRow.tsx` — spacer(투명)와 카드 사이에 `topWhiteMargin`(흰색, `bottomWhite`/`reservedWhite`와 동일 색) View 신규 삽입.
- `narrativeDialogLayout.test.ts` — `topWhiteMarginPx` 단정 추가, 불변식 테스트에 이 필드 포함하도록 갱신.

**주의**: 헤더(빗살무늬)는 이 여백보다 **위**(스페이서 구간)에서 그대로 노출되므로 이 변경으로 헤더가 가려지지 않음 — 헤더와 카드 사이에 흰 띠 하나가 새로 끼는 것뿐.

**self-check**: `tsc` 에러 0 · `narrativeDialogLayout.test.ts` 6/6 pass · `audit:ui-overlay` PASS.

### 후속 5 — 전체 코드 재검수 (대표님 지시: "코드가 잘 적용되었는지 검수부터") · 2026-08-20

렌더 체인 전체(`ArcOverlayHost.tsx` → `NarrativeOverlayContent.tsx` → `NarrativeDialogRow.tsx` → `narrativeDialogLayout.ts`, + `StageShell.tsx`·`facilityHatchHeaderMeasure.ts`·`PlanetFacilityTitleHeader.tsx`)를 처음부터 다시 전부 읽고 재확인했습니다.

**확인된 것 (코드상 정상)**:
- `narrativeDialogLayout.ts`: offset=30, `bottomBleedPx` 반대보정 로직 그대로 저장돼 있음 — 파일 내용 재확인.
- `ArcOverlayHost.tsx` passthrough 분기(178-207행): `paddingTop` 자체가 없어 `stageFillRoot`가 화면 Y=0부터 시작 — `narrativeDialogLayout.ts`의 절대좌표 가정과 정합.
- `NarrativeDialogRow.tsx`(158-167행): spacer→card→(bleed)→reserved 순서, `bottomWhite`/`reservedWhite` 둘 다 동일 색상·경계없음 — 화면상 카드 바로 아래부터 화면 끝까지 이음새 없는 흰 블록 하나로 보임(재확인).
- `StageShell.tsx`의 `STAGE_BOTTOM_MIN_INSET_PX`(54) 기반 자체 하단 패딩 관례와 `resolveNarrativeDialogReservedBottomPx`(동일하게 54 하한)가 일치 — 별도 상수 불일치 없음.
- 루트(`app/_layout.tsx`) 트리 순서상 `<ArcOverlayHost/>`가 `<Stack/>` **뒤**(형제로 나중)에 렌더 — 안드로이드 elevation 0끼리는 문서 순서가 그리기 순서를 결정하므로, Stack 내부 화면 콘텐츠가 이 오버레이보다 위에 그려질 구조적 경로는 못 찾음.
- `tsc --noEmit`·`npm run audit:ui-overlay`(PASS)·`narrativeDialogLayout.test.ts`(6/6) 전부 재실행 통과.

**확인 못 한 것 (디바이스 없이는 못 잡음, 솔직히 말씀드립니다)**:
- 실제 기기에서 `hatchMeasured`가 진짜 true로 잡히는지(코드상 레이스 가능성은 있으나 지속 실패의 구조적 증거는 못 찾음 — 이전 §1 표).
- 실제 기기의 `insets.bottom` 실측값이 코드가 가정하는 범위와 맞는지.
- 안드로이드 실제 컴포지팅 결과(정적 분석으로는 elevation 문제 재현 불가).

**결론**: 코드는 설계 의도대로 일관되게 작성·저장돼 있고 정적 검증(tsc/테스트/오디트)은 전부 통과합니다. 그런데도 대표님이 실기에서 여전히 하단 노출을 보고 계시다면, 코드 로직 자체보다 **제가 접근 불가능한 실기 값**(실측 성공 여부, 실제 safe-area 값) 쪽 문제일 가능성이 높습니다. 스크린샷 1장이나 `hatchMeasured`/`insets.bottom` 콘솔 로그 한 줄이면 다음 단계를 바로 좁힐 수 있습니다.

### 후속 4 — 실기 반복 튜닝: 18 → 20 → 30 (2026-08-20)

대표님 연속 지시(실기 육안 확인하며 값만 지정) — `NARRATIVE_DIALOG_EXTRA_TOP_OFFSET_PX`: 18 → 「20으로 반영」 → 「30으로 반영」 → 최종 **`30`**. 매 값마다 `tsc`·테스트 6/6 재확인(자기완결성 보정이 있어 값이 뭐든 최하단 배경 노출 없음).

### 후속 3 — 3px 추가 하향: 18 (2026-08-20)

「3px 더 아래로」 → `NARRATIVE_DIALOG_EXTRA_TOP_OFFSET_PX = 15` → **`18`**. `tsc`·테스트 6/6 재확인 완료.

### 후속 2 — 방향 오적용 정정: +15(아래) (2026-08-20)

직전 항목에서 대표님이 「아래로 15px」라 하신 걸 제가 **-15(위)로 잘못 적용**했습니다. 즉시 `NARRATIVE_DIALOG_EXTRA_TOP_OFFSET_PX = 15`(아래 방향)로 정정. `tsc`·테스트 6/6 재확인 완료.

### 후속 1 — 오프셋 -15로 확대 (2026-08-20, 대표님 실기 확인 후, 방향 오적용 — 위 항목에서 정정됨)

대표님: 「5px 어떻든간에 정상이 아니다. 실측을 못하는 거 같은데 그냥 이 상태에서 -15px 옮겨라.」  
→ `NARRATIVE_DIALOG_EXTRA_TOP_OFFSET_PX`를 `0` → **`-15`**로 변경(위로 15px 추가). 자기완결성 보정 로직(§0, `bottomBleedPx` 반대 보정)은 그대로라 이 값에서도 `spacer+card+bleed+reserved = windowHeight` 불변 — `tsc`·테스트(6/6, 심볼릭 상수라 자동 반영) 재확인 완료.

**"실측을 못하는 것 같다"는 의심은 별도로 열어둡니다** — 이번 코드 재검수에서 `hatchMeasured`가 *지속적으로* false가 될 구조적 원인(예: 동일 `PlanetFacilityTitleHeader`를 쓰는 다른 시설 화면이 언마운트되며 전역 `hatchBottomY`를 `null`로 되돌리는 순서 문제 등)은 못 찾았고, 찾은 건 최초 1~2프레임짜리 일시적 레이스뿐이었습니다(이전 §1 표 참고). 다만 저는 디바이스가 없어 실기로 `hatchMeasured` 값 자체를 확인할 방법이 없습니다 — 대표님/김팀장 쪽에서 로그 한 줄(`hatchMeasured`/`hatchBottomY` 콘솔 출력) 찍어서 실측이 정말 안 되는지 확인해주시면, 그게 사실이면 오프셋 튜닝이 아니라 측정 파이프라인 자체를 고쳐야 합니다.

정본: `tools/kim-team-lead/reports/kim-claude-ready-ingame-narrative-dialog-chrome-20260820.md`. `narrative-dialog-position-tune-20260820`(−5px 조각) **흡수 완료**, 이력은 아래 남김.

### 0. 총평

**근본 원인은 제가 직전에 넣은 `-5px` 오프셋 자체였습니다.** `resolveNarrativeDialogStageFill()`은 스페이서(`headerBottomPx`)+카드(`imageHeightPx`)+여유백(`bottomBleedPx`)+절대보호영역(`reservedBottomPx`)의 합이 정확히 `windowHeight`가 되도록 설계된 자기완결 시스템인데, `headerBottomPx`에만 −5를 더하고 `bottomBleedPx`는 그대로 둬서 합이 5px 부족해졌습니다. 그 결과가 대표님이 보신 두 증상과 정확히 일치합니다: ① 카드가 5px 위로 밀려 실측 헤더 하단(`hatchBottomY`)보다 위로 올라가 헤더를 침범, ② 합계 부족으로 최하단에 5px 빈틈이 생겨 뒤 배경이 노출. **오프셋을 0(원본 정확 정렬)으로 되돌리고, `bottomBleedPx`를 반대 부호로 같이 보정하는 로직을 추가**해 앞으로 다시 오프셋을 조정해도 이 자기완결성이 깨지지 않게 했습니다(수치 검증 §3).

### 1. §2 김팀장 실패 경위 재검수 (AGREE/PARTIAL/DISAGREE, 근거)

| # | 항목 | 판정 | 근거 |
|---|------|------|------|
| 1 | 행성 탑바 `STAGE_TOP_INSET+topBar−lift` 오적용 | **AGREE** | 코드 전체 grep — 해당 패턴 0건, 이미 제거됨. 바은 `PlanetFacilityTitleHeader`(별개 컴포넌트)를 쓰므로 애초에 행성 허브 탑바와 무관 |
| 2 | `planetFacilityHeaderMetrics`(추정 px) 삭제됨 | **AGREE** | grep 0건, 실제로 삭제 확인. 지금 유일한 소스는 `measureInWindow`(`PlanetFacilityTitleHeader.tsx:38-45`) |
| 3-6 | 하단 흰색/검정/투명 시행착오 | **AGREE(현재 코드 기준)** | 지금 `NarrativeDialogRow.tsx:180-187`은 `bottomWhite`/`reservedWhite` 둘 다 `TACTICAL_OVERLAY.cardBg`(불투명 흰색) 고정, `card`(포트레이트) 배경만 `#05070d`(어두움)로 분리돼 있어 — 검정/투명이 보호영역을 침범하던 과거 실패 패턴은 구조적으로 재발 불가능한 상태. 다만 삭제된 과거 시도 자체는 코드에 남아있지 않아 1:1로 재현·재검증은 못 함 |
| — | "레이스면 실측이 대사보다 늦게 들어와 헤더가 계속 가려질 수 있다" | **PARTIAL** | `app/(game)/bar.tsx:110-114` `useEffect`가 `hostDialogVisible` true 시 `presentIngameDialogScene` 호출 — `PlanetFacilityTitleHeader`의 `onLayout→requestAnimationFrame→measureInWindow`(네이티브 라운드트립) 완료보다 **먼저 실행될 개연성이 높음**(RN에서 `useEffect`는 JS 커밋 직후, `onLayout`은 네이티브 레이아웃 확정 후 브릿지로 돌아옴). 다만 `NarrativeOverlayContent.tsx:24-35`가 `useFacilityHatchHeaderWindowBottom()`(`useSyncExternalStore`)을 `useMemo` dep으로 구독하고 있어, 측정값이 `null→실측` 으로 바뀌는 순간 **자동 재렌더로 즉시 자가교정**됩니다. 즉 레이스는 존재하나 **최초 1~2프레임의 일시적 플래시**로 그치고, 대표님이 보신 것처럼 "계속 가려진" 지속 상태는 이 레이스만으로는 설명이 안 되고 위 0번(제 −5px 버그)이 주원인이라고 판단합니다. `presentIngameDialogScene`을 `onLayout` 이후로 지연시키는 구조 변경은 **적용하지 않았습니다** — 이미 있는 구독 기반 자가교정이 충분하고, present 타이밍을 건드리면 다른 게임 흐름(미션 클리어 대사 등과의 경합)에 영향을 줄 위험이 더 크다고 판단 |

### 2. §5 권장 1안 재검수

| 항목 | 채택 여부 | 근거 |
|------|-----------|------|
| 1. 헤더 하단 Y = `measureInWindow`만, 상수 합산 금지 | **PARTIAL(현행 유지)** | 현재 `headerBottomPx = min(hatchBottomY, pinBottomPx − hudHeight)` 클램프가 있음. windowHeight=800 기준 실측 `pinBottomPx−hudHeight ≈ 510`인데, 바 헤더(제목+부제 2줄)는 실측상 100~150px대라 **이 클램프는 사실상 발동하지 않음**(수치로 확인, §3). 즉 "상수 합산이 헤더를 가린다"는 현재 코드에선 재현되지 않는 걱정이라 판단해 클램프는 안전장치로 유지하고 제거하지 않았습니다. 발동 사례가 실기에서 확인되면 그때 제거 권고 |
| 2. 레이스면 present를 onLayout 이후로 지연 | **DISAGREE(비채택)** | 위 1번 표 참고 — 이미 있는 구독 기반 자가교정으로 충분 판단 |
| 3. 하단 흰색·투명/검정 금지 | **AGREE·이미 충족** | 현재 코드 구조 그대로 |
| 4. Host fill 컬럼 유지, 김팀장 `ArcOverlayHost` fill 변경과 한 덩어리로 | **AGREE·미접촉** | `ArcOverlayHost.tsx`는 이번에도 건드리지 않았습니다(김팀장 uncommitted 작업 영역과 충돌 방지) |

### 3. 수치 검증 (offset 0/±N 모두 자기완결성 유지 확인)

```
node -e 계산 결과 (windowHeight=800, hatchBottomY=300, reservedBottomPx=24):
offset=0  → headerBottomPx=300 imageHeightPx=386 bottomBleedPx=90 total=800
offset=-5 → headerBottomPx=295 imageHeightPx=386 bottomBleedPx=95 total=800
offset=12 → headerBottomPx=312 imageHeightPx=386 bottomBleedPx=78 total=800
```
어떤 offset 값에서도 total(=스페이서+카드+여유백+보호영역)이 정확히 windowHeight로 불변 — 최하단 배경 노출 버그가 구조적으로 재발하지 않습니다.

### 4. 변경 파일

- `src/ui/overlay/narrativeDialogLayout.ts` — `NARRATIVE_DIALOG_EXTRA_TOP_OFFSET_PX = 0`(원복) + `bottomBleedPx`에 `-offset` 보정 추가(실측/미실측 두 분기 동일 패턴).
- `src/ui/overlay/narrativeDialogLayout.test.ts` — 기존 2개 단정문을 offset 반영 공식으로 일반화 + **신규 회귀 테스트**("spacer+card+bleed+reserved always sums to windowHeight regardless of offset") 추가.
- `src/ui/overlay/ArcOverlayHost.tsx` — **미접촉**(김팀장 작업 영역).

### 5. self-check

- `npx tsc --noEmit -p tsconfig.client.json` — 에러 0
- `npx tsx --test src/ui/overlay/narrativeDialogLayout.test.ts` — **6/6 pass**(신규 회귀 테스트 포함)

### 6. §7 완료 조건 체크

- [x] 미실측 경로: 크기 540·+20만 유지(미접촉, 회귀 없음)
- [x] intro·arcCoreChat 무변경(grep 재확인 — 두 경로 모두 `narrativeDialogLayout.ts` 변경분과 무관)
- [x] 테스트 + tsc
- [x] handoff PENDING · commit 금지
- [x] 김팀장 분석 AGREE/PARTIAL/DISAGREE + 근거 (위 §1·§2)
- [ ] **바 실기 확인 필요** — 헤더 완전 노출·하단 흰색·미션 리스트 비침 없음, 3가지 육안 확인은 실기가 없어 대표님/김팀장 확인 부탁드립니다.

### 이전 이력 (참고용, 흡수 완료)

아래는 이번 READY로 흡수되기 전 진행 경위입니다:

[pss-pre-dev] hot_path=없음(정적 상수 1개, `resolveNarrativeDialogStageFill` 호출당 덧셈 1회) alloc=0  
[pss-pre-dev] stage=오버레이 레이어만(`NarrativeDialogRow`/`narrativeDialogLayout.ts`) — STAGE/Skia/게임화면 트리 미접촉  
[pss-pre-dev] verdict=PASS

### 지시 경위

1차: 「인앱대화창만 30px 낮게」→ 아크코어 채팅창(`arcCoreChat`)으로 오인, 작업 후 대표님이 "그게 아니다" 정정 → **즉시 원복**(별도 REVERTED 이력, 아래 참고).  
2차: 「NPC 대사창(narrative dialog) = 인앱게임대화창」으로 명확화 + 「범용 UI니까 기존 시스템 재분석 후 수정」 지시.  
3차(작업 중 실시간 정정): 「5px 정도 위로 올리면 딱 맞다. 기준은 빗살무늬 헤더 하단 ~ 최하단 완전공백 사이에 카드가 맞물리는 것」 → 방향을 30px 하향에서 **5px 상향**으로 전환.

### 기존 시스템 재분석 (핵심 발견)

NPC 대사창 위치는 단순 패딩이 아니라 **실측 기반 정밀 계산**입니다.

- `src/ui/planetFacility/facilityHatchHeaderMeasure.ts` — 빗살무늬 시설 헤더(`PlanetFacilityTitleHeader`)의 화면상 실제 하단 Y좌표를 `measureInWindow`로 실측해 전역에 보고(`hatchBottomY`).
- `src/ui/overlay/narrativeDialogLayout.ts`의 `resolveNarrativeDialogStageFill()` — `hatchBottomY`가 있으면(허브·시설 화면 대부분) 그 실측값을 카드 상단 기준으로 직접 사용, 없으면 `resolveNarrativeDialogPinTopPx()` 공식(+20px)으로 폴백.
- `NarrativeDialogRow.tsx`는 이 결과(`headerBottomPx`=spacer 높이, `imageHeightPx`=카드 높이, `bottomBleedPx`/`reservedBottomPx`=하단 여백)를 그대로 flex 컬럼에 쌓아 렌더 — 즉 **대표님이 말씀하신 "기준"(헤더 하단~최하단 공백 사이)이 이미 이 시스템의 설계 의도** 그 자체였습니다.
- **`ArcOverlayHost.tsx`는 건드리지 않았습니다.** 이 파일에 김팀장의 별도 uncommitted 작업(narrative wrap `narrativeCenterSlot/-Wrap` → `narrativeFillSlot/-Wrap` 리네임, `isCenterNarrativeFill` 분기)이 이미 걸려 있어(REVERTED 이력에서 발견), 같은 파일을 동시에 건드리면 충돌 위험이 있다고 판단해 **`narrativeDialogLayout.ts` 한 곳에만 격리**해서 수정했습니다.

### 변경

- `src/ui/overlay/narrativeDialogLayout.ts` — `NARRATIVE_DIALOG_EXTRA_TOP_OFFSET_PX = -5` 신규 상수. `resolveNarrativeDialogStageFill()`의 두 분기(실측/미실측) 모두 최종 `headerBottomPx`에만 이 값을 더함 — `imageHeightPx`(카드 높이)·`pinBottomPx`(bottomBleed 계산용 내부값)는 손대지 않아 카드 크기·하단 여백 계산 로직은 그대로 유지, 카드 시작 위치만 순수하게 5px 위로 이동.
- `src/ui/overlay/narrativeDialogLayout.test.ts` — 위 변경에 맞춰 기존 2개 단정문 값 보정(±offset 반영). 실측/미실측 분기 모두 회귀 없음.

**적용 범위**: `entry.anchor === 'center'`로 열리는 narrative(NPC 대사) 오버레이에만 적용됩니다. `stageFill`을 안 쓰는 intro 컷신 대사·`anchor==='bottom'` 대사·아크코어 채팅창(`arcCoreChat`, 완전히 다른 kind)에는 **영향 없음**.

### self-check

- `npx tsc --noEmit -p tsconfig.client.json` — 에러 0
- `npx tsx --test src/ui/overlay/narrativeDialogLayout.test.ts` — **5/5 pass**

### 리스크·주의

- `ArcOverlayHost.tsx`에 김팀장의 관련 작업이 동시 진행 중입니다(narrative wrap 리네임 — 위 "재분석" 항목 참고). 그쪽 작업이 완료·반영된 뒤 **실기에서 같이 확인**이 필요합니다 — 두 변경이 겹치는 영역(narrative 오버레이 레이아웃)이라 따로따로 검증하면 최종 위치가 예상과 다를 수 있습니다.
- -5px는 대표님이 실측 없이 육안으로 판단해주신 값입니다. 실기 확인 후 미세 조정이 더 필요하면 `NARRATIVE_DIALOG_EXTRA_TOP_OFFSET_PX` 값만 바꾸면 됩니다(다른 곳 수정 불필요).

commit 금지. 대표님께: 「김팀장(Cursor 본창) 검수 요청」 안내 부탁드립니다.

---

## ⛔ REVERTED — 아크코어 인앱대화창 세로 위치 30px 하향 (대상 착오) · 김클로드 · 2026-08-20

```text
status=REVERTED
task_id=arc-core-chat-window-offset-20260820
kind=UI_FIX
code_changes=NO (변경 후 즉시 원복 완료)
```

대표님 정정: 「아크코어 인앱대화창을 이야기한 게 아니다. 전체 작업 복구하라.」  
→ `src/ui/overlay/overlayPanelLayout.ts`(`OVERLAY_FILL_TOP_OFFSET_PX` 추가분 전부)와 `src/ui/overlay/ArcOverlayHost.tsx`(import·`paddingTop` 1줄)를 **정확히 원복**. `git diff` 재확인 결과 `overlayPanelLayout.ts`는 변경 0, `ArcOverlayHost.tsx`는 제 손을 댄 부분만 깨끗이 사라졌음(`tsc` 재확인 통과).

**주의(김팀장 확인 필요)**: 원복 과정에서 `ArcOverlayHost.tsx`에 **김팀장의 기존 작업 중인 변경분**(narrative 오버레이 `narrativeCenterSlot/-Wrap` → `narrativeFillSlot/-Wrap` 리네임 + `isCenterNarrativeFill` 분기, 이번 handoff와 무관)이 이미 uncommitted 상태로 걸려 있는 걸 확인했습니다. 이건 건드리지 않고 그대로 뒀습니다 — 아마 대표님이 말씀하신 "인앱대화창"이 이 narrative(NPC 대사창) 쪽 작업일 가능성이 있어 보입니다.

---

## 📋 PENDING — 하이브리드(웹+앱) 서비스 기반 작업 가능성 검토 · 김클로드 · 2026-08-20

```text
status=PENDING
task_id=hybrid-web-app-feasibility-review-20260820
kind=ARCHITECTURE_REVIEW
code_changes=NO
verdict=CONDITIONAL — 가능하나 현재 착수점은 0, Skia가 최대 리스크
```

### 총평

**"기반 작업이 가능한가"의 답: 기술적으로 가능하지만, 지금은 완전한 0에서 시작.** `react-native-web`·`react-dom`이 `package.json`에 아예 없고, `app.json`에 `expo.web` 블록 자체가 없어 **웹 익스포트를 한 번도 시도한 적 없는 상태**다. 코드베이스 전체에 `Platform.OS === 'web'` 분기, `.native.ts`/`.web.ts` 분리 파일이 **0건** — 웹을 염두에 둔 흔적이 전혀 없다. 가장 큰 리스크는 이 게임의 핵심 렌더링(STAGE 1 허브·STAGE 3 전투)이 전부 `@shopify/react-native-skia`인데, 웹에서는 CanvasKit(WASM) 런타임으로 완전히 다르게 동작하고 — 이 프로젝트 1순위 규칙인 "메모리 누수 전수조사"가 전제하는 GL ceiling·native_heap 개념 자체가 브라우저에는 없어 실측 없이는 안전성을 보장할 수 없다.

### 계층별 검토 (코드/설정 파일 직접 확인)

| 계층 | 현재 상태 | 웹 호환 판정 |
|------|-----------|--------------|
| Expo/RN 코어(Router·Reanimated·gesture-handler·SVG) | `expo ~51.0.0`, `react-native 0.74.5` — 버전상 `react-native-web` 페어링 가능 | **호환 가능** (표준 지원 대상), 단 설치·설정 0 |
| `expo.web` 설정 | `app.json`에 `web` 블록 없음, `react-native-web`/`react-dom` devDependency 없음 | **미착수** — 가장 먼저 해야 할 일 |
| Firebase | `@react-native-firebase/*`(analytics/app/auth/database/firestore) — 네이티브 브리지 전용, 12개 파일에서 사용(`src/firebase/*`, `arcCore/chat/cloudConversationalProvider.ts` 등) | **웹에서 전혀 동작 안 함** — Firebase JS SDK로 별도 계층·플랫폼 어댑터 신규 설계 필요 |
| Skia 렌더링 | `@shopify/react-native-skia` 1.2.3, 9개 파일(`PlanetEdenRaidOrbitSkiaCombat.tsx` 등 STAGE 1·3 핵심) | **최대 리스크** — 웹은 CanvasKit 별도 런타임. 프레임 예산·dispose 타이밍이 이 프로젝트의 Zero-Allocation 규칙과 동일하게 적용될지 실측 전에는 불명 |
| `arcfire-native-memory`(커스텀 네이티브 모듈) | native reclaim 파이프라인 12개 파일에서 사용(`src/game/nativeReclaim/*`) — GL ceiling·native_heap 진단 | **웹에 대응 개념 없음** — 전부 no-op/Platform 가드 필요. 이 프로젝트 메모리 감시 체계(`audit:skia-memory`·`audit:native-reclaim` 등) 전체가 네이티브 힙 전제라 웹에서는 별도 기준 필요 |
| 게임 로직/스토어(zustand·AsyncStorage·CSV 런타임) | 순수 JS/RN 표준 API 위주 | **호환 가능성 높음** — 별도 이슈 없어 보임 |
| Firebase Hosting | `firebase.json`에 `hosting` 섹션 없음 | **배포 인프라 미착수** |

### 권장 착수 순서 (제안, 미구현 — 대표님 승인 후 김팀장 착수)

1. `react-native-web`+`react-dom` 설치 + `app.json` `expo.web` 블록 추가 후 `expo start --web` **1회 실측** — 지금은 추측만 가능하고 실측 데이터가 전혀 없음. 뭐가 깨지는지부터 확인해야 이후 범위를 잡을 수 있음.
2. Firebase 계층을 native/web 어댑터로 분리(우선 로그인·프로필 read/write만).
3. **Skia STAGE 렌더 웹 호환성 실측** — 여기가 실질적 승부처. 안 되면 "하이브리드"를 웹에서는 비-Skia 화면(허브 UI·월드맵 등)만으로 축소하는 것도 옵션.
4. `arcfire-native-memory`/native reclaim 계열은 웹 빌드에서 전부 no-op 처리.

코드 수정 없음(검토만). 대표님께: 「김팀장(Cursor 본창) 검수 요청」 안내 부탁드립니다.

### 후속 — 준비 단계 문서화 완료 (2026-08-20)

대표님 지시: 위 분석을 **「웹서비스 개발준비 단계」 문서로 정리 + 개발항목 명기, 이번엔 준비 단계만 진행.**  
→ `docs/웹서비스_개발준비_단계.md` v0.1 신규 작성 완료. 준비 단계 항목 P1~P6 표로 정리(§4), 이번 단계 제외 항목 명시(§5), DoD·리스크 레지스터 포함.  
**코드/설정 파일 변경 없음** — P1(웹 타겟 최소 활성화: `react-native-web` 설치·`app.json` `expo.web` 블록 추가)도 문서에만 정의, 실행은 대표님 별도 승인 후.

---

## ✅ REVIEWED — 아크코어 에이전트 A경로 구현 + 전수 재검수 · 김팀장·김클로드 · 2026-08-20

| 항목 | 값 |
|------|-----|
| **status** | **`REVIEWED`** |
| **task_id** | `arc-core-agent-world-domain-impl-20260820` |

```text
status=REVIEWED
task_id=arc-core-agent-world-domain-impl-20260820
kind=IMPL + FULL_REAUDIT
code_changes=YES
verdict=AGREE
reviewed_by=김팀장 + 김클로드 병행
design_doc=docs/ARC_CORE_AGENT_WORLD_DOMAIN_DESIGN.md v0.2
```

### 구현 범위

- 세계 콘트롤 **A(관측만)** · B `WORLD_PROPOSAL_LIVE=false`
- 페르소나 핵 temperament/office/purpose · stance observe/warn/refuse/inquire
- 로컬 회신 근원체 톤 · CLOUD_LIVE=false

### 전수 재검수

| 게이트 | 결과 |
|--------|------|
| 클라 채팅 테스트 | 36/36 PASS |
| AWS 테스트 | 11/11 PASS |
| tsc client | PASS |
| audit:memory:all | PASS |
| 김클로드 10항 | **AGREE** · P0/P1/P2 없음 |

김팀장 잔여 P2(완료 차단 아님): 세션 오프너 `arcCoreChat.session.welcome`은 잠금 A2 인사. 회신 키만 근원체 톤으로 바꿈.

[existing-value-change] `arc_core_chat_persona.csv` persona_goal 문구 · i18n `reply.greet/greetAgain/other/otherAgain/self` · 대표님 「설계대로 개발」 승인

---

## 📋 원본 — 아크코어 에이전트 「이중세계 도메인」 설계 독립 재검수 · 김클로드 · 2026-08-20

```text
status=REVIEWED
task_id=arc-core-agent-world-domain-review-20260820
kind=DESIGN_REVIEW
code_changes=NO (원본) / YES (위 구현)
verdict=AGREE
design_doc=docs/ARC_CORE_AGENT_WORLD_DOMAIN_DESIGN.md v0.1 (+ docs/대화형_아크코어_구현.md §0-E)
```

대표님이 「현실세계=기존 상용 에이전트, 게임세계=아크코어 에이전트」 지시를 김팀장과 김클로드 **양쪽에 동시 하달**하셨습니다. 김팀장이 이미 `ARC_CORE_AGENT_WORLD_DOMAIN_DESIGN.md` v0.1을 작성해 두어, 그 결과물을 **받아쓰지 않고 코드·CSV로 직접 재검수**했습니다.

### 총평

**AGREE.** 김팀장 설계는 기존 잠금(L1 입≠몸·12좌 고정·온디바이스 금지·상용 툴 루프 없음)을 전부 유지한 채로 페르소나 핵·아크코어 자체 의도(`ArcCoreStance`)·세계 콘트롤 깊이(A/B/C)를 분리해 제안했고, C안(입이 직접 write)을 스스로 기각한 뒤 A/B 선택만 대표님께 되묻는 구조 — 설계 절차상 흠이 없습니다. 아래 2개는 검수 중 코드로 발견한 세부 구현 시 주의사항(차단 사유 아님)입니다.

### 1. 사실관계 검증 (코드/CSV 직접 대조)

| 도메인 문서 주장 | 검증 | 판정 |
|---|---|---|
| 현재 `persona_goal`은 「돕는다」(안내원 톤) | `tables/content/arc_core_chat_persona.csv:5` `persona_goal,4,goal,관측한 사실로만 돕는다...` — 원문 그대로 인용 정확 | AGREE |
| 지금은 유저 의도만 분류하고 아크코어 자신의 의도(축)는 없음 | `arcCoreChatIntent.ts:3-10` `ARC_CORE_CHAT_INTENTS`가 `refuse/location/spy/combat/greet/other` 6종 **PlayerIntent만** — `ArcCoreStance`류 자체 목적 축은 코드에 0건 | AGREE |
| 세계 콘트롤 경로 없음(관측만) | `arcCoreChatReadTools.ts:15-21` `ALLOWED_TOOLS` 5개 전부 읽기 전용, dispatch/unlock/credit 계열 0건(2026-08-20 이전 검수 재확인) | AGREE |
| C안(입 write)은 L1과 충돌 | 기존 handoff `arc-core-chat-aws-readiness-review-20260820`에서 이미 확인한 worldWrite 이중검증(클라+서버)과 정합 — C안 채택 시 그 방어선을 스스로 허무는 셈이라 기각 판단이 맞음 | AGREE |

### 2. 구현 시 주의(발견한 갭, 지금 당장 결정 불필요)

1. **persona 행에는 리빌 게이팅이 없다.** knowledge 카드는 `speakIf`(`revealed_shadow`/`never_before_reveal` 등)로 리빌 전후를 걸러내지만(`arcCoreAgentPack.ts:52-63` `knowledgeAllowed`), persona는 `listArcCoreChatPersonaRows().slice(0,8)`(`arcCoreAgentPack.ts:74-77`)로 **무조건 전부** 팩에 실린다. 도메인 문서 §3 "②리빌 후 한 줄만 인간에 가까움"을 구현하려면 persona 행에도 knowledge와 같은 `speakIf` 필터를 먼저 추가해야 함 — 지금 파이프라인엔 그 자리가 없음.
2. **B안(제안→확인→몸) 채택 시 오버레이 시퀀싱 미정.** "적용은 `ArcOverlayHost` 확인 또는 기존 시설 화면"이라고만 돼 있는데, 지금 `arcCoreChat` 패널이 열려 있는 상태에서 제안을 확정해 다른 화면(무역소·조선소 등)을 띄우려면 기존 `combat_end`처럼 **채팅 패널 dismiss 후** present하는 시퀀싱이 필요(§13 "명단+채팅+스크립트 동시 스택 금지"와 동일 원칙). B안 구현 시 이 시퀀싱을 §5-1 제안 화이트리스트 표 옆에 한 줄 명시해 두는 걸 권고.

### 3. 결론

의도 반영 가능 여부: **가능** (김팀장 판정에 동의). A/B 선택은 대표님 몫이며, 코드 착수 전 위 2개를 설계 문서에 흡수해 두면 구현 턴에서 다시 막히지 않습니다.

코드 수정 없음. 대표님께: 「김팀장(Cursor 본창) 검수 요청」 안내 부탁드립니다.

---

## ✅ REVIEWED — 아크코어 대화 LLM/AWS 연동 전수 재검수 · 김팀장 흡수·고도화 · 2026-08-20

| 항목 | 값 |
|------|-----|
| **status** | **`REVIEWED`** |
| **task_id** | `arc-core-chat-aws-readiness-review-20260820` |

```text
status=REVIEWED
task_id=arc-core-chat-aws-readiness-review-20260820
kind=CODE_REVIEW
code_changes=YES (김팀장 고도화)
verdict=PARTIAL_ABSORBED
reviewed_by=김팀장(글록 4.5) · 2026-08-20
design_doc=docs/대화형_아크코어_구현.md §12-A
scope=src/arcCore/chat/**, src/store/arcCoreChatStore*, aws/arc-core-chat/**, functions/src/arcCoreChatTurn.ts
```

### 김클로드 판정 재확인

| # | 김클로드 | 김팀장 |
|---|----------|--------|
| 클라 G3 | AGREE · 실기 배포 가능 | **동의** · `CLOUD_LIVE=false` 유지 |
| **P0 Bearer 실서명 없음** | 키 연결 전 JWT 검증 필수 | **흡수·구현** · JWKS RS256 후에만 Bedrock. 위조 Bearer=`unauthenticated` |
| P1 Lambda 아티팩트 없음 | IaC/번들 필요 | **흡수·구현** · `lambdaEntry` + esbuild CJS `dist/index.js` + SAM `template.yaml` |
| P2 quota 인스턴스 Map | 정보성 | **유지** · Dynamo는 과도. 트래픽 낮음. JWT 검증이 비용 창을 닫음 |

`CLOUD_LIVE`·URL은 여전히 꺼 둠. 키를 먼저 열지 않는다.

### 김팀장 추가 고도화 (P2)

- Bedrock fetch 12초 abort
- 공지 제목 i18n · 호칭 로케일 · `hasCombatRecord` lastMatch 동기 캐시
- `lastArcQuestion` persist · 클라우드 질문 검역
- 바/미션 스토어 lazy require · persist 중 purge 시 removeItem
- Firebase 옵션 경로 서버 검역

---

## 📋 원본 재검수 — 아크코어 대화 LLM/AWS 연동 전수 (김클로드 · 2026-08-20 · 코드 수정 없음)

```text
status=REVIEWED
task_id=arc-core-chat-aws-readiness-review-20260820
kind=CODE_REVIEW
code_changes=NO (원본 재검수) / YES (아래 김팀장 고도화)
verdict=PARTIAL
design_doc=docs/대화형_아크코어_구현.md v1.1.6
scope=src/arcCore/chat/**, src/store/arcCoreChatStore*, aws/arc-core-chat/**, functions/src/arcCoreChatTurn.ts, src/ui/overlay(chat 연동분)
```

### 총평 (5줄 이내)

클라이언트 쪽(로컬 G3 "본선")은 **완성도 높고 실기 테스트 가능한 수준**이다 — 키 미보유·worldWrite:false 이중 검증·검역·STAGE/오버레이 가드·purge/backup 4곳 등록·CSV Table-First 인덱싱까지 코드로 전부 확인했고 tsc·테스트(client 32건 + AWS 4건) 전부 통과했다. 다만 **AWS 연동 자체("중요 키·계정만 연결하면 바로 실기")는 아직 아니다** — Lambda 핸들러가 Bearer 토큰의 **실서명 검증을 하지 않아**, 실제 Function URL+Bedrock 키를 연결하는 순간 누구나 임의 문자열로 유료 Bedrock 호출을 무제한에 가깝게 소비할 수 있는 상태다(quota가 그 위조 토큰 문자열로 우회됨). 이 1건만 막으면 나머지는 실기 연동 테스트로 넘어가도 안전하다.

### 1. 클라이언트 — 키/월드write/검역/STAGE (전부 AGREE, 코드 확인)

| 확인 항목 | 근거 (파일:줄) | 판정 |
|-----------|----------------|------|
| 클라에 벤더 키/SDK 없음 | `cloudConversationalProvider.ts` — `fetch(cloudUrl, {Authorization: Bearer <Firebase idToken>})`만, AWS SDK/키 문자열 전무 | AGREE |
| 클라우드 게이트 dark | `arcCoreChatCloudGate.ts:3,11` `ARC_CORE_CHAT_CLOUD_LIVE=false` · `ARC_CORE_CHAT_AWS_TURN_URL=''` — 지금 실호출 0건 | AGREE |
| worldWrite 이중 검증 | 클라 `arcCoreAgentPack.ts:124` 하드코딩 `false` **+** 서버 `aws/arc-core-chat/src/pack.ts:35`·`functions/src/arcCoreChatTurn.ts:57` `worldWrite===true`면 즉시 null/reject | AGREE |
| 읽기 도구 화이트리스트 ≤4 | `arcCoreChatReadTools.ts:15-21` `ALLOWED_TOOLS` 5개(get_location/callsign/spy_alert/last_combat/planet_cores)뿐, dispatch/unlock/credit 계열 전무(grep 0건) | AGREE |
| 검역 | `quarantineArcCoreChatReply.ts` — 운용실행 암시·섀도우 닉·시스템/JSON 누설 정규식 3종 + 500자 clamp, 로컬·클라우드 공통 경로 | AGREE |
| STAGE 가드 | `app/(game)/planet.tsx:1084-1104` waveResult `onClose` 내부 **`queueMicrotask`**로 `combat_end` 지연 발화 확인(동기 present 아님) · 캡틀레이드는 grep 0건(슬롯만, 설계와 일치) | AGREE |
| 오버레이 kind 3곳 | `tacticalOverlayRollout.ts:36,38` · `overlayChrome.ts:53,61` · `ArcOverlayHost.tsx:300,306` 모두 등록, `npm run audit:ui-overlay` **PASS** | AGREE |
| barrel 누출 없음 | `src/arcCore/index.ts` 전체에 `./chat` import/export 0건 | AGREE |
| purge/backup/restore 4곳 | `localAccountReset.ts:241` `resetArcCoreChatForAccountPurge()` · `gameSaveBackupKeys.ts:19` 키 포함 · `applyLocalGameSaveSnapshot.ts:82` restore 시 `hydrate()` 재호출 — 3곳 실등록 확인(4번째 "reset 함수"는 스토어 자체 export이므로 사실상 동일 지점) | AGREE |
| Table-First 인덱싱 | `arcCoreChatTableIndex.ts` 모듈 캐시 1회, 매 턴 CSV find 없음. `build:content-tables`에 `build-arc-core-chat-tables.mjs` 체이닝 확인(`package.json:17`) | AGREE |
| 컴파일·테스트 | `npx tsc --noEmit -p tsconfig.client.json` 에러 0 · `src/arcCore/chat`+`src/store/arcCoreChat*`+overlay 테스트 10개 파일 32 케이스 전부 pass(`tsx --test`, 이 프로젝트 컨벤션) | AGREE |
| i18n | `arcCoreChat.*` 키 KO/EN 완전 대응(29개 키 확인) | AGREE |

### 2. AWS 연동 — 실기 테스트 전 반드시 막아야 할 것

| # | 문제 | 근거 | 판정 |
|---|------|------|------|
| **1 (P0)** | **Bearer 토큰 실서명 미검증.** `aws/arc-core-chat/src/handler.ts:74-81` — 주석부터 "Firebase JWT 실검증은 토큰 수령 후. 지금은 Bearer 존재만 본다." `readBearer()`가 헤더 존재만 확인하고, `uid = 'bearer:'+token.slice(0,16)`을 그대로 quota 키로 씀(43-54행). **실제 Function URL+Bedrock 키를 연결하는 순간**, 인증되지 않은 임의 문자열 Bearer로 유료 Bedrock 호출이 가능하고, quota도 토큰 문자열을 매번 바꿔 우회 가능(분당 8회 제한이 사실상 무의미) | 설계문서 자체도 이 순서를 "토큰 수령 후"로 미뤄뒀으나, **문의 의도("연동해도 안전한 수준")상 이 검증은 키를 연결하기 전에 먼저 있어야 함**. Firebase Admin SDK(`verifyIdToken`) 또는 Firebase JWKS 수동 검증을 handler.ts에 추가 권고 | **PARTIAL** — 코드 품질 자체는 문제 없으나 순서가 위험 |
| 2 (P1) | Lambda 배포 아티팩트 없음 | `aws/arc-core-chat/package.json`에 런타임 의존성·빌드 스크립트 없음(테스트만 `tsx --test`). IaC(SAM/CDK/serverless.yml) 없음, Lambda가 요구하는 handler 진입점(`exports.handler` 또는 ESM 규약) 빌드 산출물이 없음 — README도 "지금은 소스만"이라 명시해 **알려진 상태**지만, "바로 실기 테스트"로 넘어가려면 별도 빌드/패키징 단계가 먼저 필요 | 정보성(설계상 이미 인지된 갭) |
| 3 (P2) | quota가 Lambda 인스턴스 메모리(`Map`)에만 존재 | `handler.ts:23-24` `quotaByUid` 모듈 전역 — 콜드스타트·다중 인스턴스 시 유저별 분당 상한이 인스턴스마다 리셋됨. 트래픽 낮은 싱글플레이 게임 특성상 치명적이진 않으나, #1과 결합하면 비용 노출이 커짐 | 정보성 |

### 3. 결론

**클라이언트(G3 본선)는 그대로 실기 배포해도 안전.** AWS 쪽은 **#1(JWT 검증)을 먼저 넣은 뒤** Function URL·Bedrock 키를 연결하는 순서를 권고한다 — 지금 순서대로(키부터 연결 후 나중에 검증 추가) 진행하면 짧게라도 무인증 유료 엔드포인트가 인터넷에 노출되는 창이 생긴다. #2·#3은 차단 사유는 아니고 배포 준비 시 같이 처리하면 되는 항목.

코드 수정은 하지 않았습니다(재검수 지시 범위). 대표님께: 「김팀장(Cursor 본창) 검수 요청」 안내 부탁드립니다.

---

## ✅ REVIEWED — 아크코어 대화 에이전트 기획 공동 검수 · 김팀장 흡수 · 2026-08-14

| 항목 | 값 |
|------|-----|
| **status** | **`REVIEWED`** |
| **task_id** | `arc-core-backchannel-joint-review-20260814` |

```text
status=REVIEWED
task_id=arc-core-backchannel-joint-review-20260814
kind=DESIGN_REVIEW
code_changes=NO (문서만 · v0.4 흡수)
verdict=PARTIAL_ABSORBED
reviewed_by=김팀장(글록 4.5) · 2026-08-14
design_doc=docs/ARC_CORE_BACKCHANNEL_AND_HUB_TALK_ROSTER.md v0.4
full_audit=PASS · kim-team-lead-ready-arc-core-backchannel-post-review-full-audit.md
impl=HOLD — 대표님 구현 지시 대기
```

### 김팀장 검수·반영

김클로드 `PARTIAL` 15 AGREE + 5 PARTIAL. 코드 재확인 후 **문서 전량 흡수**.  
C18 「`arcCore/index.ts` 없음」만 **정정**(파일 존재). 순환 가드는 유지.  
메모리·누적·채팅기록 §11 재확인 **PASS**. 게임 코드 미착수.

| 흡수 | 반영처 |
|------|--------|
| 궤도 상한 5→8 | §2-1 |
| C4 WaveDefense `onClose` / 캡틀레이드 dispose 분리 | §8 · C4 |
| C5 blanket dismissAll · narrative 별 세션 | §5-0-3 · C5 |
| C13 최초 TextInput · 실기 키보드 | §6-1 |
| C17 kind 등록 3곳 · audit 미검사 | §8 · C17 |
| C18 배럴 존재 + SubCore 정적 import 금지 | C18 |
| C19 비동기 join | C19 |
| hydrate 타이틀 금지 | §6-3 |

원본 김클로드 총평·C1~C20 표는 아래 유지.

---

## 📋 원본 — 아크코어 대화 에이전트 기획 공동 검수 · 김클로드 · 2026-08-14

```text
status=ABSORBED
task_id=arc-core-backchannel-joint-review-20260814
kind=DESIGN_REVIEW
code_changes=NO
verdict=PARTIAL
design_doc=docs/ARC_CORE_BACKCHANNEL_AND_HUB_TALK_ROSTER.md v0.3 (당시)
```

### 1. 총평 (5줄 이내)

기획 자체는 **구현해도 되는 설계**다. §10 C1~C20 중 **15건 AGREE**, 나머지 **5건 PARTIAL**이며 전부 P0 차단 사유가 아니라 "문서가 인용한 기존 코드 근거를 좀 더 정확히" 고치면 되는 수준이다(수치 오기, 실재하지 않는 자동 감사 장치를 근거로 든 것, 신규 규율을 기존 관례처럼 서술한 것). C4(전투 종료 트리거)만 실제 구현 시 추가 조사가 필요한 진짜 갭 — 결과 오버레이와 캡틀레이드 Skia dispose를 잇는 기존 배선이 코드에 없다. 12좌·명령버스·일일배치·섀도우·뉴스보드·persist 축은 전부 코드로 직접 대조해 문서 주장과 일치함을 확인했다. **결론: 구현 착수해도 좋으나, 아래 §3 정정 + §4 가드를 문서에 먼저 흡수한 뒤 착수 권장.**

### 2. §10 C1~C20 재검수 (코드 직접 확인, 파일:줄)

| ID | 판정 | 근거 |
|----|------|------|
| C1 | **AGREE** | `src/arcCore/subcores/registerDefaultArcSubCores.ts:20-31` — `registerSubCore` 정확히 12회. `node_eternal_throne`은 서브코어 클래스가 아니라 `tables/content/arc_core_world_nodes.csv:2` CSV 로우로만 존재(12좌 밖 개념은 데이터 레벨) |
| C2 | **AGREE** | `src/arcCore/ArcCoreCommandBus.ts:13-19` `ArcCoreCommandOrigin`에 `player_chat` 없음. 113행 `dispatchArcCoreCommand` 시그니처 확인 |
| C3 | **AGREE** | `runArcCoreDailyOpsBatch.ts:97-393` 본문에 UI/overlay 호출 0건. `continueSessionPrewarm.ts:76,80` join 지점 확인. `arcCoreDailyOpsPolicy.ts:137,144,161` 12:00 KST 게이트 확인 |
| C4 | **PARTIAL** | 변수명은 `postStepRef`가 아니라 `combatOrbitPostStepRef`(`PlanetEdenRaidTestLayer.tsx:2567,2641`, 표기 오차·사소). 더 중요한 점: "결과 오버레이 = dispose 이후"를 잇는 기존 배선이 캡틀레이드 Skia 경로에 없음 — `presentWaveResultOverlay`는 별개 시스템인 WaveDefense(`app/(game)/planet.tsx:990-1058`) 소속이라 capital-raid dispose와 직접 연결되지 않음. `combat_end` 트리거를 캡틀레이드에 걸려면 dispose 완료 시점(974-975, 2706-2709, 3374-3376행 null 대입 지점) 중 어디에 훅을 걸지 **구현 시 신규로 정해야 함** |
| C5 | **PARTIAL** | `resolvePendingArcOverlaysForStageExit`(`arcOverlayStore.ts:311-324`)는 "kind별 게이트"가 아니라 `levelUp/reward/waveResult`만 `onClose()` 실행 후 스택 **전체**를 `dismissAll()`로 비우는 blanket 방식. 결론(채팅·명단이 STAGE 이탈 시 자동으로 닫힘)은 여전히 성립하지만, 이 함수는 `narrative`(ingameDialogStore, 별도 세션)를 다루지 않음 — 미션클리어 대사 유실 방지는 이 함수 범위 밖(기존부터 그랬음, 채팅 기획과 무관한 기존 갭) |
| C6 | **AGREE** | `present()`(`arcOverlayStore.ts:223-226`)는 스택에 append. `dismissWhere`(238-240) 존재. `presentWaveResultOverlay`가 이미 "dismissWhere 후 present 1장" 패턴을 쓰고 있어 채팅에 그대로 재사용 가능한 선례 |
| C7 | **AGREE** | `transitCombatPostFlow.ts:210-247` — `waitForIngameDialogIdle`→`waitForArcOverlayKindsIdle(['reward'])`→레벨업→미션클리어 순차 idle-wait 패턴이 이미 존재. 채팅 트리거도 이 헬퍼 재사용 권장 |
| C8 | **AGREE** | `missionPlanetHubSync.ts:17` `tryPresentPendingMissionClearDialog`가 이미 `isIngameDialogActive()` 가드 사용 중 |
| C9 | **AGREE** | `app/(game)/planet.tsx:1196-1202` 스파이 자동오픈이 이미 `isIngameDialogActive()` 가드로 보호됨 |
| C10 | **AGREE** | `aabsPolicyStore.ts:158-172` 배율 함수 확인. 환불 버그는 가상의 경고가 아니라 실제 이력(`docs/AABS_능동밸런싱_시스템_전수조사.md:82,188-190,292-294`) — 근거 탄탄 |
| C11 | **AGREE** | `arcCoreShadowReveal.ts:29-30` `revealedAtMs` 게이트 확인. `planetHubSpyIntelDialog.ts`는 섀도우 스토어 import 안 함(현재 겹침 없음) |
| C12 | **AGREE** | `ArcNewsBoardSubCore.ts:27-124` 일방 `pushNotice`만, 24h 주기(`BOARD_SUMMARY_INTERVAL_SEC`), 채팅형 상호작용 없음 |
| C13 | **AGREE** | `planetMainStageLayout` 임포터 13개 중 `src/ui/overlay/` 소속 0개 — 레이아웃 상수와 오버레이 계층은 이미 분리. 단, `ArcOverlayCard.tsx`에 `KeyboardAvoidingView` 선례가 전무(`keyboardShouldPersistTaps`뿐) — 채팅 패널이 **ArcOverlayHost 사상 최초의 TextInput 오버레이**라 키보드 회피는 선례 없이 새로 구현·양 플랫폼 실기 검증 필요(가드로 추가 권장) |
| C14 | **AGREE** | `localAccountReset.ts:199-244` 20여개 개별 reset 호출 패턴 확인(섀도우만 의도적 예외). `gameSaveBackupKeys.ts:5-28` 정적 키 배열 — 신규 스토어는 여기 등록 안 하면 백업 누락 |
| C15 | **AGREE** | `src/ui/overlay/` 전체에 `missionStore` 직접 참조 0건(grep) — "미션은 API만 호출" 분리가 이미 구조적으로 지켜지는 중 |
| C16 | **AGREE** | `runHeavyUiDataSession.ts`는 preflight/hydrateSteps/build 범용 프레임이지만 실사용처(`planetEconomyInfoSession`, `tradeScreenSession`)가 전부 허브 시설 화면 전용 — 월드맵/전투후에서도 떠야 하는 채팅에 이 프레임을 억지로 태우면 안 된다는 문서 판단이 맞음 |
| C17 | **PARTIAL** | `audit:ui-overlay`(`tools/ui-overlay-audit/run-ui-overlay-audit.cjs`)는 RN Modal/Alert 안티패턴 grep일 뿐 kind 테이블 완전성은 검사 **안 함**. 실제 컴파일 강제 지점은 `tacticalOverlayRollout.ts:22` `TACTICAL_OVERLAY_KIND_FLAGS: Record<ArcOverlayKind, boolean>` 1곳뿐 — `overlayChrome.ts`의 switch는 `default` 폴백이 있어 누락돼도 컴파일 통과(alert로 조용히 폴백), `ArcOverlayHost.tsx`도 exhaustive가 아닌 조건부 JSX라 누락 시 컴파일 에러 없이 그냥 렌더 안 됨. 즉 신규 kind 2개 등록 지점 3곳 중 **1곳만 컴파일러가 강제**, 나머지 2곳은 수동 체크리스트로 관리해야 함 |
| C18 | **PARTIAL** | `arcCore/index.ts` 배럴 파일 자체가 존재하지 않아 문서가 우려하는 순환 경로는 코드상 없음. 다만 "SubCore가 UI를 직접 부르지 않는다"는 게 기존 관례가 아니라 **새로 세우는 규율**임을 명시해야 함 — `src/arcCore/territorial/showTerritorialOccupationChangeAlert.ts:3-4`가 이미 overlay/alert 함수를 정적 import해 territorial SubCore 경로(`runTerritorialCombatPass.ts`)에서 호출하는 선례가 존재하기 때문 |
| C19 | **PARTIAL** | `arcCoreWallClockCatchUpGate.ts`는 "부트 시 동기 스냅샷 재빌드"가 아니라 단순 join 게이트. 실제 catch-up 작업은 `app/_layout.tsx:302,326`에서 비동기 백그라운드로 시작되고 `continueSessionPrewarm`에서 join되는 구조. 결론("오픈/전송 시 1회 읽기, 틱 재수집 금지")은 daily-batch·catch-up의 "1회 비동기 join, 재수집 없음" 관례로 여전히 뒷받침되지만, 문서가 "동기 재빌드"라고 표현한 부분은 과장 |
| C20 | **AGREE** | `src/`·`app/` 전체 `onSnapshot` 실사용 0건(매치 3건은 전부 "금지" 명시 주석 또는 무관한 타입명) |

### 3. 김팀장 전제 정정 (틀렸거나 부분적인 것만)

1. **§2-1 궤도 동시 트래픽 상한 수치** — 문서 "약 5척"은 오기. 실제 `PLANET_HUB_ORBIT_CAPITAL_RENDER_MAX = 8`(`planetHubOrbitRenderBudget.ts:10`), `ARC_ORBIT_PRESENCE_FILL_MAX = 8`(`arcNpcTrafficTableRegistry.ts:10`). "명단 N이 bounded"라는 결론엔 영향 없음, 수치만 8로 정정.
2. **C17 근거 오귀속** — 위 표 참조. `audit:ui-overlay`가 아니라 `tacticalOverlayRollout.ts`의 `Record<ArcOverlayKind, boolean>`이 실제 컴파일 강제 지점.
3. **C19 "동기 재빌드" 표현** — 위 표 참조. 실제는 비동기 백그라운드 + prewarm join.
4. **C18 "SubCore는 chat을 정적 import 안 함"** — 기존 관례 확인이 아니라 신규 자체 규율. territorial alert 선례가 이미 이 원칙을 어기고 있으므로 "왜 채팅만 예외적으로 더 엄격한가"를 문서에 한 줄 남겨두는 게 좋음(추적 가능성).

### 4. 구현 전 추가 가드 (문서에 흡수 요청)

1. **C4 실제 훅 지점 명시** — `combat_end` 트리거를 캡틀레이드(`PlanetEdenRaidOrbitSkiaCombat.tsx`)와 WaveDefense(`planet.tsx:990-1058`) 중 어느 결과 화면에 걸지, dispose 완료 콜백(`combatOrbitPostStepRef=null` 3곳 중 어디)에서 트리거를 fire할지 §8 파일 지도에 구체 지점 추가.
2. **C17 등록 체크리스트 3곳 명시** — `ArcOverlayKind` 유니온 추가 시 (a) `tacticalOverlayRollout.ts` `TACTICAL_OVERLAY_KIND_FLAGS`(컴파일 강제) (b) `overlayChrome.ts` switch (c) `ArcOverlayHost.tsx` 렌더 분기 — 3곳 모두 §8 파일 지도에 명시. (b)(c)는 누락돼도 컴파일 통과하므로 수동 확인 필수.
3. **C13 키보드 회피 신규 구현 명시** — ArcOverlayHost 사상 최초 TextInput이므로 §6-1에 "Android soft-input 모드·iOS KeyboardAvoidingView 양쪽 실기 검증" 한 줄 추가 권장.
4. **C5 narrative 미커버 사실 명시** — `resolvePendingArcOverlaysForStageExit`가 `narrative` kind를 안 다룬다는 사실을 §5-0-3 "동시성" 절에 각주로 남겨(채팅 자체는 문제 없음, 기존 갭이 채팅 때문에 새로 생긴 것처럼 오독되지 않도록).

### 5. 구현하지 말 것 (재확인)

문서 §10-5 그대로 유지 확인: `runArcCoreDailyOpsBatch`·`AiNpcSubCore`/`ArcInboundDroneSubCore` 틱·AABS 정렬·`planetMainStageLayout`·`NARRATIVE_DIALOG_LAYOUT`·스파이 정책 CSV·12좌 CSV·명령 타입 추가 — 전부 코드로 재확인했고 이번 기획이 건드릴 이유 없음. 온디바이스 LLM·`player_chat` 명령버스 origin·13번째 SubCore 제안으로 구현 착수 금지도 동일 유지.

대표님께: 「김팀장(Cursor 본창) 검수 요청」 안내 부탁드립니다.

---

## ✅ REVIEWED — 성계700 전개방 설계 문서 독립 재검수 · 김클로드 · 2026-08-12

```text
status=REVIEWED
task_id=galaxy700-design-review-20260812
verdict=AGREE_WITH_IMPROVEMENTS_ABSORBED
reviewed_by=김팀장(글록 4.5) · 2026-08-12
code_changes=NO (문서·READY·앵커만)
impl_followup=tools/kim-team-lead/reports/kim-team-lead-ready-galaxy700-scale-ops.md (HOLD)
design_doc=docs/성계700_전개방_메모리_운영_설계.md v0.1.3
```

### 김팀장 검수·반영

김클로드 §14·§14-6 개선안 5건 **전량 문서 반영**(v0.1.3).  
향후 개발용 Wave I1~I5·파일 맵·DoD는 READY(홀드)에 고정.  
**게임 코드 미착수** — 대표님 구현 승인 시 READY `HOLD`→`READY` 후 I1부터.

| §14-6 | 반영처 |
|-------|--------|
| Persist ~760·slim 재사용 | 설계 §4-5 · READY **I1** |
| colonization 전복제·우선↑ | 설계 §4-3 · READY **I2** |
| warmedPlanetCatalogIds | 설계 §4-1 · READY **I3** |
| R1 실측 각주 | 설계 §6 |
| §3-1 네 축 | v0.1.2 완료 |

원본 분석 요지(byPlanetId~760 · systems 전복제 · slim/warm 선례)는 설계 §14에 유지.

---

## 📋 PENDING — 행성허브 월드오브젝트(잔해·방위위성·소행성) 표시명 로케일 미전환 수정 · 김클로드 · 2026-08-04

```text
status=PENDING
task_id=planet-hub-worldobject-title-i18n-20260804
parent=대표님 지시 — "행성허브의 잔해, 방위위성 행성 1 등의 표시 명이 번역 전환이
  안된 상태이다. 확인하라"
code_changes=YES — 8개 파일(신규 파일 없음, 전부 i18n 키 정합화)
commit 금지
[pss-pre-dev] hot_path=아님(행성 허브 진입 시 provider 목록 1회 빌드 + 로케일 전환 시
  React 재렌더로만 갱신, 틱 경로 무관) · alloc=무변경(문자열 리터럴 → i18n 키 리터럴로
  교체만, 신규 객체/루프 없음) · stage=행성 허브 월드오브젝트 렌더(STAGE 1) ·
  risk=P4(순수 표시 텍스트 치환 — provider가 반환하는 kind/interactions/state 등
  게임 로직 데이터는 전혀 무변경, title 문자열의 "의미"만 원문 텍스트→i18n 키로 변경) ·
  verdict=PASS
```

### 원인 (코드로 확인)

행성 허브 월드오브젝트 3종 provider가 표시명을 **원문 한국어 문자열로 직접 하드코딩**하고 있었습니다:
- `src/worldObjects/providers/wreckWorldObjectProvider.ts` — `title: '잔해'`
- `src/systems/planetaryDefense/buildPlanetDefenseSatelliteObjects.ts` — `title: \`방위위성 ${i+1}\`` (대표님이 보신 "방위위성 행성 1"이 이것)
- `src/worldObjects/providers/asteroidWorldObjectProvider.ts` — `title: \`소행성 ${n}\`` (같은 패턴, 대표님이 언급하신 "등"에 해당)

렌더 소비처(`planetHubSubcomponents.tsx:957`의 화면 표시 캡션, `interactionComponents.tsx:29`의 접근성 라벨) 둘 다 이 `title` 값을 **그대로** 찍고 있어서, 로케일을 영어로 바꿔도 이 캡션들만 한국어로 고정돼 있었습니다. 바로 옆의 `accessibilityLabel={t('hubBg.wreck')}`(939행)·`t('hubBg.defenseSatellite')`(941행)는 이미 정상적으로 i18n 처리돼 있어 — 화면 소비처 자체는 i18n 인프라가 갖춰져 있었는데, provider가 **번역 키가 아니라 완성된 한국어 문자열**을 `title`에 채워 넣던 게 근본 원인이었습니다.

### 수정

`WorldObject.title`의 계약을 "완성된 표시 문자열" → "**i18n 키**"로 정정하고, 번호가 붙는 표시명(방위위성·소행성)은 신규 `titleOrdinal?: number` 필드로 분리해 `t(title, {n: titleOrdinal})` 형태로 렌더 시점에 해석하도록 바꿨습니다.

| 파일 | 변경 |
|------|------|
| `src/worldObjects/types.ts` | `title` 주석을 "i18n 키" 계약으로 명시, `titleOrdinal?: number` 필드 신규 추가 |
| `wreckWorldObjectProvider.ts` | `title: '잔해'` → `title: 'hubBg.wreck'`(기존 키 재사용, 번호 없음) |
| `buildPlanetDefenseSatelliteObjects.ts` | `title: \`방위위성 ${i+1}\`` → `title: 'hubBg.defenseSatelliteTitle', titleOrdinal: i+1`(신규 키) |
| `asteroidWorldObjectProvider.ts` | `title: \`소행성 ${n}\`` → `title: 'hubBg.asteroidTitle', titleOrdinal: n`(신규 키) |
| `src/i18n/locales/ko.ts` / `en.ts` | `hubBg.defenseSatelliteTitle`('방위위성 {n}'/'Defense Satellite {n}'), `hubBg.asteroidTitle`('소행성 {n}'/'Asteroid {n}') 신규 추가 |
| `planetHubSubcomponents.tsx` | 957행 `{object.title}` → `{t(object.title, ...)}`로 렌더 시점 해석(이 컴포넌트는 이미 `useT()` 사용 중이라 반응형으로 로케일 전환 시 즉시 갱신) |
| `interactionComponents.tsx` | `PlaceholderActionButton`에 `useT()` 추가해 접근성 라벨도 동일하게 해석 |

**소비처가 딱 2곳뿐임을 grep으로 확인** 후 진행 — `title` 필드의 의미를 바꾸는 변경이라 블라스트 반경을 먼저 확인했습니다. `description` 필드(같은 provider들이 하드코딩)는 화면에 렌더되는 곳이 없어(grep 확인) 이번 범위에서 제외했습니다.

### self-check

```
npx tsc --noEmit -p tsconfig.client.json   → PASS(에러 0)
grep 확인: WorldObject.title 소비처 2곳(위 표) 외 없음, 하드코딩 원문 문자열 참조하는
  테스트 없음
```

### 미완·보류

- 실기 확인 필요 — 행성 허브에서 로케일을 영어로 전환한 뒤 잔해/방위위성/소행성 캡션이 즉시 영문으로 바뀌는지, 숫자(N번째)가 정확히 유지되는지.
- `description` 필드는 현재 화면에 안 쓰여 이번엔 안 건드림 — 나중에 노출 UI가 생기면 같은 패턴(i18n 키화)으로 처리 필요.
- `WorldObjectKind`에 정의만 있고 provider가 없는 `station`/`anomaly`는 이번 조사에서 발견되지 않아 해당 없음(현재 미사용 kind로 보임).

---

## 📋 PENDING — 최초 시작 스토리(intro01) 스킵 버튼 — 마지막 페이지 즉시 전체 표시 · 김클로드 · 2026-08-04

```text
status=PENDING
task_id=intro-story-skip-instant-reveal-20260804
parent=대표님 지시 — "스킵버튼의 처리가 제대로 연출을 스킵시키는지 확인하라" →
  확인 결과 "스킵이 마지막 페이지로만 이동하고 그 페이지 타이핑 애니메이션이 처음부터
  다시 재생돼 실질 2번 더 탭해야 진입됨"을 보고 → 대표님 결정: "마지막 페이지 이동은
  유지, 텍스트는 이미 다 드러난 상태로 표시해 탭 1번만 더 필요하게"
code_changes=YES — 4개 파일(신규 파일 없음, 전부 옵션 prop 추가)
commit 금지
[pss-pre-dev] hot_path=아님(스토리 화면 최초 1회 진입 경로, 틱/렌더루프 아님) ·
  alloc=무변경(기존 useEffect 분기만 추가, 신규 상태 1개는 intro.tsx 로컬 useState) ·
  stage=intro 스토리 화면(app/(game)/intro.tsx) 전용, STAGE 1/행성허브 무관 ·
  risk=P5(옵션 prop 전부 기본값 false — 스킵 미사용 시 기존 동작 100% 동일, 다른
  TypewriterText/NarrativeDialogRow 호출부 전부 영향 없음) · verdict=PASS
```

### 확인된 원인 (재검수 결과, 이전 턴에서 이미 보고)

`app/(game)/intro.tsx`의 `handleSkipScene`이 `setPage(pages.length-1)`로 마지막 페이지로만 이동시키는데, `TypewriterText`가 `key={pageKey}`로 리마운트되며 그 페이지 텍스트가 **처음부터 다시 타이핑 애니메이션**됨 — 플레이어가 스킵을 눌러도 (1) 마지막 페이지 타이핑을 기다리거나 한 번 더 스킵(다음 버튼이 "스킵 타이핑"으로 표시)하고 (2) 그 다음에야 "게임 시작"이 눌리는 2단계 추가 조작이 필요했음.

### 수정 (대표님 지시안 그대로 — 마지막 페이지 이동 유지 + 텍스트 즉시 전체 표시)

| 파일 | 변경 |
|------|------|
| `src/components/TypewriterText.tsx` | `skipAnimation?: boolean`(기본 false) prop 추가 — true면 애니메이션 루프 없이 `setDisplayed(text); setDone(true); onComplete()`를 즉시 호출. 기존 호출부(스킵 미지정)는 전부 동일 동작 |
| `src/ui/onboarding/CinematicPrologueScene.tsx` | 동일 prop 추가해 `TypewriterText`로 전달(시네마틱 페이지 경로) |
| `src/ui/overlay/NarrativeDialogRow.tsx` | 동일 prop 추가해 `TypewriterText`로 전달(ingame_dialog 페이지 경로 — `handleSkipScene`이 두 경로에 공유되므로 일관성 위해 같이 반영) |
| `app/(game)/intro.tsx` | `skipRevealPage: number\|null` state 신규 — `handleSkipScene`이 마지막 페이지 인덱스를 여기 기록. `skipRevealActive = skipRevealPage === page && segmentIndex === 0`를 계산해 두 렌더 분기(`CinematicPrologueScene`/`NarrativeDialogRow`) 모두에 `skipAnimation`으로 전달 |

**건드리지 않은 것**: 마지막 페이지 도달 후 "게임 시작" 버튼이 눌리기까지의 짧은 `nextButtonRevealDelayMs` 딜레이(기존에도 모든 페이지 완료 시 동일하게 있던 것, 스킵 전용 아님) — 그대로 유지. 스킵을 안 쓰는 일반 진행(페이지 0→1→2→3→4 순차 진행)은 전부 기존과 동일하게 타이핑 애니메이션 재생.

### self-check

```
npx tsc --noEmit -p tsconfig.client.json   → PASS(에러 0)
```

### 미완·보류

- 실기 확인 필요 — 신규 계정 생성 → intro01 진입 → 1페이지에서 스킵 탭 → 마지막 페이지 텍스트가 애니메이션 없이 즉시 전체 표시되는지, "게임 시작" 버튼이 잠깐(기존 딜레이)의 후 눌려서 정상적으로 `/(game)/planet`(차원항로 경유)까지 진입하는지 확인.
- 이미 마지막 페이지에 있을 때 스킵을 다시 누르면(엣지 케이스) `pageComplete`가 로컬에서 false로 재설정돼 "게임 시작" 버튼이 한 번 더 탭을 요구할 수 있음(락 아님, 텍스트도 이미 즉시 표시 상태라 무해) — 이전 턴에서 발견한 기존 동작이라 이번 수정 범위 밖으로 유지.

---

## ✅ 김팀장 구현 — 서비스 개시 월드 경제 리셋 E1 · 2026-08-04 22:03 KST

```text
status=IMPLEMENTED_BY_KIM_LEAD
task_id=economy-service-launch-world-reset-20260804
assignee=김팀장(글록 4.5) 직접
code_changes=YES
commit=미요청
tsc=PASS
verify=_verify-service-launch-world-reset.cjs ALL PASS
onBoot=미연결(의도)
```

### 변경

| 파일 | 내용 |
|------|------|
| **신규** `src/arcCore/economy/resetArcCoreWorldEconomyForServiceLaunch.ts` | `full`/`soft` API |
| `arcCoreDailyOpsState` · summary · fee ledger · overlay · ingest · central ledger | clear/reseed 헬퍼 |
| `runArcCoreConvoyDailySettlementPass.ts` | E12 neutral/independent ensureHydrated |

대표님: 운영 호출만 · 계정 purge·synth hardReset과 분리. 커밋은 지시 시.

---

## 📊 김팀장 보고 — 경제 시스템 전수 구조 감사 FINAL · 2026-08-04 22:00 KST

```text
status=AUDIT_FINAL→E1_IMPLEMENTED
task=economy-system-full-structure-audit-3loop
report=docs/economy-evaluation/2026-08-04-economy-system-full-structure-audit-FINAL.md
ready_p0=tools/kim-team-lead/reports/kim-claude-ready-economy-service-launch-world-reset.md
```

---

## ✅ REVIEWED — 경제 금고 5축 Phase A+B · 김팀장 검수 · 2026-08-04 17:18 KST

```text
status=REVIEWED
task_id=economy-vault-5axis-upgrade-20260804
verdict=AGREE_WITH_FIX
code_changes=YES (김클로드 A+B + 김팀장 라우터 이중경로 1건 정정)
commit=미요청 · 대표님 지시 시 커밋 패키지 (debug 스크립트·로그 제외 권장)
tsc=PASS
verify=_verify-vault-5axis.cjs ALL PASS 16/16
device_PASS=없음 (오프라인 검증만)
phase_C=보류 (경제 UI 중립/독립 라벨)
```

### 김팀장 검수 요약

| 축 | 판정 | 메모 |
|----|------|------|
| A 중립 vault + fee/upkeep 라우팅 | **AGREE** | `createFactionVaultStore` · seed 0 · 기존 3키 이전 없음 |
| B 독립 vault + purge zero | **AGREE** | `localAccountReset` 연동 · hold 중립=`releasePlayerPlanetHolds` 기존 로직 **확인** |
| 유지비 1차 player.credits | **AGREE** | `isPlayerOwnedHold` 분기 무변경 |
| 수송·블루·아크 월드 purge 제외 | **AGREE** | independent만 리셋 |
| 단일 라우터 (READY §3) | **FIX 반영** | `resolveFactionVaultForOccupierClanId`/`ForPlanetId` 가 still neutral→arccore·player null 붕괴 → **김팀장 수정** (fee/upkeep와 일치) |
| Phase C UI | **DEFER** | `planetEconomyInfoSnapshot` red/blue 라벨만 — 후속 READY 또는 동 작업 확장 |
| 운영 효과 | **주의** | 중립 vault 시드 0 → 당분간 중립 유지비 shortfall 증가 가능(의도: 이후 수수료 적립 전용). 아크코어 잔고 유출 감소 |

### 김팀장 정정 파일

- `src/arcCore/economy/resolveFactionVault.ts` — UI/공용 resolve도 neutral·independent 동일 라우팅

### 후속 (커밋·다음 작업 — 대표님 지시 시)

1. **Phase C**: econSnap 중립/독립 라벨 + heavy hydrate revision (선택)
2. **device**: 무역·일일유지비·계정초기화 실기 1회
3. 커밋 시: `tools/debug/_verify*` 및 long-run logs **제외** · vault src + account + upkeep + subcore만

---

## 📋 PENDING(원본 · 김클로드) — 경제 금고 5축 고도화 Phase A+B · 2026-08-04

```text
status=PENDING→superseded_by_REVIEWED
task_id=economy-vault-5axis-upgrade-20260804
team_lead_recheck=AGREE(대부분) + PARTIAL 정정 1건(§3 독립국 purge 중립화 — 이미 구현돼 있었음, 근거 아래)
code_changes=YES — 신규 2파일 + 기존 4파일 수정 + 검증 스크립트 1개(커밋 제외)
commit 금지
[pss-pre-dev] hot_path=아님(무역 수수료=거래 시점만·유지비=일1회) · alloc=신규 스토어 2개
  (createFactionVaultStore 재사용, txn append-only, 기존 3금고와 동일 프로파일) ·
  cache=persist 1.5s coalesce(팩토리 그대로) · stage=일1회 upkeep 배치 + 무역 수수료 경로 +
  AiEconomySubCore deferred hydrate + 계정 purge · risk=P3(신규 분기만 추가, 기존
  RED/BLUE 라우팅 무변경 확인) · verdict=PASS
```

### 재검수 결과 (분석 문서 §1~§8 대조, 파일:줄 근거)

| 분석 문서 항목 | 판정 | 근거 |
|----------------|------|------|
| §2 라우팅 — neutral·player_clan 전부 arccore로 폴백 | **AGREE** | `resolveFactionVault.ts`(수정 전) `getVaultKeyByFaction`이 blue만 구분(25-30행 구버전) · `resolveTradeFeeFactionVault`/`runArcCorePlanetUpkeepDailyPass.ts`가 `faction === 'blue' ? 'blue' : 'red'` 삼항으로 neutral을 항상 red로 붕괴시키는 것 직접 확인 |
| §3 "독립국 hold는 purge 시 중립화 **검증·보강 필요**" | **PARTIAL 정정** | `src/clanWar/planetHoldReleasePolicy.ts:78-87` `restoreHoldAfterPlayerRelease`에 `hold.kind==='player_independent'` 전용 분기가 **이미 존재**(주석상 2026-07-28 `account-purge-ownership-neutralize` 도입 — occupier/kind→neutral, deed 클리어, `neutralizedAt` 마킹까지 전부 구현됨). "검증·보강 필요"가 아니라 **재사용만 하면 되는 기존 기능**이었음 — 새로 구현하지 않고 검증 스크립트로 재확인만 함(아래) |
| §8 목표 라우팅 표(신규 4·5, 기존 1~3 유지) | **AGREE** | 구현 그대로 반영 |
| §5 "기존 3키 잔액 강제 이전 금지" | **AGREE, 준수** | 신규 2금고 모두 `migrationStashKey` 미설정·시드 0 고정 — 기존 arccore/blue/transport 스토리지 키 무변경 확인(검증 스크립트에서 arccore 잔액 8,997,612 그대로 유지 실측) |
| §5 "유지비 1차는 player.credits 유지" | **AGREE, 준수** | `runArcCorePlanetUpkeepDailyPass.ts`의 `isPlayerOwnedHold` 분기(플레이어 소유 hold → player.credits)는 **손대지 않음** — neutral 분기만 추가 |

### 구현 (Phase A + B, Phase C(UI)는 미착수 — 아래 "다음")

| 파일 | 변경 |
|------|------|
| **신규** `src/store/factionVault/neutralNationVaultStore.ts` | `createFactionVaultStore` 재사용 · storageKey `arcfire_neutral_nation_vault_v1` · 시드 0 |
| **신규** `src/store/factionVault/playerIndependentNationVaultStore.ts` | 동일 패턴 · storageKey `arcfire_player_independent_nation_vault_v1` · 시드 0 · `resetPlayerIndependentNationVaultForAccountPurge()` export(purge 전용) |
| `src/arcCore/economy/resolveFactionVault.ts` | `VAULT_KEY_NEUTRAL`/`VAULT_KEY_PLAYER_INDEPENDENT` 추가 · `getVaultKeyByFaction` neutral 분기 추가 · `isPlayerIndependentHold(hold)`(kind 우선, `isPlayerOriginatedClanId` 폴백) 신규 · `resolveTradeFeeFactionVault`가 독립국 우선 판정 후 blue/neutral/red 라우팅 |
| `src/arcCore/economy/runArcCorePlanetUpkeepDailyPass.ts` | neutral vault hydrate 추가 · neutral hold 유지비를 neutral vault에서 차감(기존 red/blue 분기 옆에 추가) · 결과 타입에 `neutralUpkeepChargedCredits`/`neutralUpkeepFailedCredits` 필드 추가(기존 필드 무변경) |
| `src/arcCore/subcores/AiEconomySubCore.ts` | deferred boot hydrate 체인에 신규 2금고 hydrate 추가(기존 3금고와 동일 위치·패턴) |
| `src/account/localAccountReset.ts` | `purgeLocalAccountData`에 `resetPlayerIndependentNationVaultForAccountPurge()` 호출 추가(플레이어 축 섹션) — hold 중립화는 기존 `purgePlayerAccountWorldState`가 이미 처리하므로 잔액만 정리 |

**건드리지 않은 것**: 기존 3금고(arccore/blue/transport)의 storageKey·시드·마이그레이션 로직, RED/BLUE 라우팅 분기, `resolveFactionVaultForOccupierClanId`/`resolveFactionVaultForPlanetId`(UI 전용, Phase C 대상), CSV 유지비/수수료율 숫자.

### 실행 검증 (코드 읽기 아님 — 실제 실행, `tools/debug/_verify-vault-5axis.cjs` — 커밋 제외)

실기 세이브(RKStorage.db) 백업을 로드해 순수 로직 16건 전부 실행·확인:

```
getVaultKeyByFaction: blue/neutral/red/폴백 4건 PASS
isPlayerIndependentHold: 4건 PASS
purge_account releasePlayerPlanetHolds(독립국 hold): occupier/kind→neutral, deed/homePlayerUid→null 5건 PASS
독립국 금고: inflow 5000 적립 → purge reset → 잔액 0·txns 0 3건 PASS
arccore vault 잔액(8,997,612) — purge 대상 아님, 그대로 유지 확인
ALL PASS (16/16)
```

### self-check

```
npx tsc --noEmit -p tsconfig.client.json   → PASS(에러 0)
npx tsx tools/debug/_verify-vault-5axis.cjs → ALL PASS (16/16)
```

### 미완·보류

- **Phase C(UI)** 미착수 — `planetEconomyInfoSnapshot.ts`의 `resolveFactionVaultForOccupierClanId` 호출부가 아직 red/blue만 라벨링(242-251행 부근), neutral/독립국은 라벨 없음. 원하시면 이어서 진행하겠습니다.
- **실기(디바이스) 검증 없음** — 위는 전부 오프라인 순수 로직 실행 검증. 실제 무역소 거래·유지비 배치·계정 초기화 버튼을 실기에서 눌러본 결과는 아닙니다.
- CSV `neutral_vault_seed_credits`/`player_independent_vault_seed_credits` 같은 전용 시드 키는 추가하지 않음 — 코드가 `() => 0` 고정이라 필요 시에만 나중에 CSV 정책 키로 승격 가능(existing-value 변경 아님, 순수 추가라 안전).

---

## 📋 ASSIGNED → 김클로드 — 경제 금고 5축 고도화 · 2026-08-04

```text
status=ASSIGNED
assignee=김클로드
task_id=economy-vault-5axis-upgrade-20260804
ready=tools/kim-team-lead/reports/kim-claude-ready-economy-vault-5axis-upgrade.md
analysis=docs/economy-evaluation/2026-08-04-vault-5axis-reaudit.md
commit 금지
```

### 한 줄

아크코어=RED 동일(1) · 수송(2) · 블루(3) **유지** + **중립 vault(4)·독립국 vault(5)** · purge 시 **독립국 중립·vault 제로**.

### 김클로드 지시 전문 (복사)

```text
@김클로드 경제 금고 5축.

분석: docs/economy-evaluation/2026-08-04-vault-5axis-reaudit.md
READY: tools/kim-team-lead/reports/kim-claude-ready-economy-vault-5axis-upgrade.md
task_id=economy-vault-5axis-upgrade-20260804

Phase A 중립 vault → B 독립 vault+purge 중립 → C UI.
createFactionVaultStore만 · 기존 3키 잔액 강제 이전 금지.
유지비 1차는 player.credits 유지. tsc · purge 검증 · commit 금지.
```

---

## 📋 김팀장 → 김클로드 공유 — 전체 재검수 결과 · 2026-08-04

> **대표님 지시**: 전수검사 내용을 김클로드에게 공유하라.  
> **정본(본문 전부)**: [`kim-claude-share-full-reaudit-20260804.md`](./kim-claude-share-full-reaudit-20260804.md)  
> **실행 DoD**: [`kim-claude-ready-rework-boot-batch-warp-20260804.md`](./kim-claude-ready-rework-boot-batch-warp-20260804.md)

```text
status=SHARED_TO_KIM_CLAUDE
assignee=김클로드
task_next=kim-claude-rework-boot-batch-warp-20260804  (R0→R1→R2)
tsc=PASS (전수검사 시점)
src_commit=미커밋 (금지)
device_PASS=없음
```

### 요약 (김클로드 필독)

| 판정 | 내용 |
|------|------|
| **코드 AGREE** | 타이틀 즉시 · prewarm 합류 · RTDB 6s · join 12/45s · LogBox warn↓ · batch TOCTOU · Wave A 완료게이트 · territorial worldmap · 규칙 재명기 |
| **미완** | R0 handoff 1블록 · R1 join 20~25s · R2 catalog 로그 · **전체 device_PASS** |
| **DEFER** | auth device uid 재시도 상수 — **변경 금지** |
| **커밋** | src/app OK 패키지 가능하나 **device 전 · rework R0 전 · 디버그/로그 제외** |

김클로드는 **공유 정본 §7 지시문**을 복사해 착수하고, 완료 시 본 파일 상단을 **PENDING 1블록**으로 교체할 것.

---

## 📋 PENDING — 오늘(2026-08-04) 부팅/차원항로/일일배치 전 작업 통합 · Wave R0 정리 · 김클로드

> 대표님 지시(2026-08-04 오후): 김팀장 전수검사 내용을 참고로 학습 완료. **분석·우선순위 정리 위주로 전환**,
> 추가 코드 작업은 **오늘 저녁 PM 5시 이후 재확인 후 진행**. 아래는 그 전까지의 최종 상태 스냅샷.

```text
status=PENDING
task_id=kim-claude-rework-boot-batch-warp-20260804 (R0 완료 · R1/R2 완료 · 하위 항목은 아래 표)
code_changes=YES — 누적 다수 파일(아래 "오늘 변경 파일 전체" 표)
commit 금지
team_lead_recheck=AGREE_CODE (race/title/RTDB/join-cap/territorial) · AGREE_SOFT (territorial) ·
  DEFER (auth device retry) — 근거: kim-claude-share-full-reaudit-20260804.md §2·§5
[pss-pre-dev] hot_path=아님(부팅 1회·이어하기 1회 진입 경로) · alloc=무변경(타임아웃 race·
  로그 합산·게이트 flag 등 소규모 헬퍼만, 신규 순환 없음) · stage=title 부트 게이트 /
  차원항로 prewarm / 일일배치 SubCore·economy·territorial · risk=혼합(P2~P5, 표 참고) ·
  verdict=PASS (tsc 전부 clean, 오프라인 harness로 배치 완주 재확인)
```

### 오늘 무엇을 했는가 (완료·검증됨)

| # | 항목 | 상태 | 핵심 근거 |
|---|------|------|-----------|
| 1 | 타이틀 버튼 즉시 활성 (`postBootSettled` 즉시) | ✅ 완료 (김팀장 초안+김클로드 재검수) | `app/_layout.tsx` — 12s deadline·daily/catch-up wait 전부 제거 |
| 2 | catch-up·일일배치 join → 차원항로(`continueSessionPrewarm`) 전담 | ✅ 완료 | `arcCoreWallClockCatchUpGate.ts`(신규) + `arcCoreDailyBatchGate.ts` |
| 3 | 일일배치 TOCTOU 동시 중복 실행 레이스 | ✅ 완료 | `ArcCoreDailyOpsSubCore.ts` — `batchRunning=true`를 await 이전으로, 상위 try/finally |
| 4 | RTDB daily KPI write 무한 대기(오프라인 시 SDK가 안 풂) → 차원항로 영구 고착 | ✅ 완료 | `pushArcCoreDailyKpiToRtdb.ts` 6s 타임아웃 + `continueSessionPrewarm.ts` join 상한(catch-up 12s·daily 24s) 이중 방어 |
| 5 | RTDB skip 시 `console.warn`이 LogBox 경고창으로 뜨던 것 | ✅ 완료 | 동일 파일 — `__DEV__` `console.log`로 하향(기존 `ensureFirebaseAnonymousAuth` 관례와 통일) |
| 6 | 교전지역(영유권) 팝업이 타이틀 화면에 뜨던 것 | ✅ 완료 | `territorialAlertGalaxyMapGate.ts`(신규) — 은하계 허브(worldmap) 포커스 중일 때만 즉시 표시, 아니면 보류 후 진입 시 노출(최신 1건) |
| 7 | (Wave R1) daily join 상한 45s → 24s 하향 + 단계별 상시 계측 | ✅ 완료 | `continueSessionPrewarm.ts` — `DAILY_BATCH_JOIN_TIMEOUT_MS=24_000`, `markBootPerf`로 join_catchup/join_daily/assets/bootstrap 4구간 `__DEV__` 상시 마킹(임시 아님) |
| 8 | (Wave R2) 무역소 카탈로그 resync DEV 로그가 행성당(최대 757줄) 폭주 | ✅ 완료(로그만) | `AiEconomySubCore.ts` — 같은 (action,origin,reason) 커맨드를 0ms 창 안에서 합산해 1줄로 출력(동작 무변경, 로그 표현만 압축) |
| 9 | 일일배치 O(N²)/중복호출 5건(findPlanetInSystems, bar replenish, hostCaptain 재조회, orbit candidates dedup, unlockedPlanetIds 반복호출) | ✅ 완료(이전 라운드, 김팀장 AGREE 기록됨) | 오프라인 harness 41.6s → 32.5s |
| 10 | Wave A~C′ (일일배치 미완료 근본 수정 — 게이트/격리/O(N) bulk) | ✅ 완료(이전 라운드, 김팀장 AGREE 기록됨) | `lastBatchCompletedDayKey` 완료 기준 게이트 등 |

### 발견했으나 손대지 않은 것 (우선순위 정리용)

| # | 항목 | 판정 | 사유 |
|---|------|------|------|
| A | `src/firebase/auth.ts` `resolveDeviceScopedUid()` — 기기 id 조회 최악 ≈3.2s가 `bootReady`를 막음 | **DEFER — 값 변경 금지** (김팀장 재확인) | 기기 식별 무결성 로직 — 대표님/김팀장 별도 승인 전 손대지 않음 |
| B | `syncTradePortCatalogFromBalance`가 "bulk" 커맨드를 행성 1개 배열로 반복 호출(실질 per-item) | **원인 AGREE, 수정 미착수(P2)** | 로그 스로틀(#8)로 증상은 없앴으나, 호출 자체를 진짜 다건 배치로 합치는 건 더 큰 변경 — `AiEconomySubCore.onBoot()`의 `resyncAllCoreOpenTradePortCatalogs()`(warm 캐시 플래그까지 건드림)와 의미론이 100% 같은지 추가 확인 필요해 보류 |
| C | 부팅 시 무역소 전행성 resync가 boot(`resyncAllCoreOpenTradePortCatalogs`)와 일일배치(`syncTradePortCatalogFromBalance`) 두 경로에서 세션 겹칠 때 중복될 가능성 | **조사만, 미수정** | 두 경로가 캐시/warm 플래그 의미론이 달라 단순 통합이 안전한지 불확실 — 손대지 말고 별도 ready로 다룰 것 권장 |

### 오늘 변경 파일 전체 (커밋 대상 후보 — 커밋은 금지, 목록만)

`app/_layout.tsx` · `app/index.tsx` · `app/(game)/worldmap.tsx` · `src/store/appBootStore.ts` ·
`src/game/continueSessionPrewarm.ts` · `src/game/bootPerformance.ts` ·
`src/arcCore/schedule/arcCoreDailyBatchGate.ts` · `src/arcCore/schedule/arcCoreWallClockCatchUpGate.ts`(신규) ·
`src/arcCore/schedule/arcCoreDailyOpsPolicy.ts` · `src/arcCore/schedule/arcCoreDailyOpsState.ts` ·
`src/arcCore/schedule/runArcCoreDailyOpsBatch.ts` · `src/arcCore/subcores/ArcCoreDailyOpsSubCore.ts` ·
`src/arcCore/subcores/AiEconomySubCore.ts` ·
`src/arcCore/territorial/showTerritorialOccupationChangeAlert.ts` ·
`src/arcCore/territorial/territorialAlertGalaxyMapGate.ts`(신규) ·
`src/arcCore/learning/pushArcCoreDailyKpiToRtdb.ts` · `src/firebase/arccoreRtdbConfig.ts` ·
`src/arcCore/captainPresence/buildCaptainPresenceWorldIndex.ts` ·
`src/arcCore/orbitPresence/captainOrbitPlanetAssignment.ts` ·
`src/arcCore/economy/runPlanetPgpDailyPass.ts` · `src/missions/arcCoreInstanceMissionGenerator.ts` ·
`src/store/planetCoreRuntimeStore.ts`

### self-check (오늘 최종)

```
npx tsc --noEmit -p tsconfig.client.json   → PASS(에러 0)
오프라인 harness(757행성 실데이터, 최신 코드 전부 반영) → BATCH COMPLETED OK, 32.8s
grep waitForArcCoreDailyBatchIdle app/_layout.tsx → 0건(타이틀 경로 wait 없음 확인)
```

### 다음(오늘 저녁 5시 이후 재개 시 우선순위 — 대표님 결정 대기)

1. **최우선 — 실기(디바이스) 검증**: 콜드 기동 버튼 즉시 활성 / 이어하기→차원항로 24s 이내 완주 / 오프라인 시 LogBox 경고 미표시 / 영유권 팝업 타이틀 미노출·worldmap 진입 시 노출 / micro-adjust·trade-route 로그 중복 소실. **이번 세션은 오프라인 harness·정적 코드 검수까지만 — device_PASS 전부 미검증.**
2. 위 표의 **A(기기 uid 재시도)**: 그대로 둘지, 재시도 상수를 낮출지 대표님 판단.
3. 위 표의 **B/C(무역소 카탈로그 resync 통합 여부)**: 필요성 낮음 판단되면 그대로 종결, 우선순위 있으면 별도 ready로.
4. `docs/BOOT_INIT_OPTIMIZATION_ROADMAP.md` 등 규칙 문서와 코드 최종 정합 여부 — 코드는 완료, 문서 쪽 별도 확인 안 함(범위 밖으로 유지했음).

### 위 ASSIGNED(`title-button-min-activation-continue-prewarm-20260804`)는 본 통합 PENDING에 흡수·마감

---

## 📋 김팀장 검수+추가 패치 — 시작화면 12s 잠금 (초안 이력 · 김클로드 재검수 대상) · 2026-08-04

| 항목 | 결과 |
|------|------|
| **verdict** | 초안 존재 가능 · **김클로드 READY DoD 재검수·보완 후 PENDING으로 넘길 것** |
| note | 아래 REVIEWED 블록은 배정 전 세션 초안. 최종 코드 소유·self-check는 김클로드. |

## 📋 김팀장 검수 — daily-ops 후속 O(N²)/중복호출 5건 · 2026-08-04

| 항목 | 결과 |
|------|------|
| **verdict** | **AGREE (코드)** · 실기 초 단위 단축·device PASS는 **미확정** |
| parent | Wave A~C′ **AGREE_CODE** 유지 · 본 라운드는 **성능 후속**만 |
| #1 planetIndex Map bulk | **AGREE** — `buildPlanetIndexFromSystems` + O(N) 대입, find 선형 제거 |
| #2 bar replenish batch | **AGREE** — `computeReplenishedPlanetEntries` + 행성 Map 그룹 · single-planet `ensure*` 동등 병합 확인 |
| #3 hostCaptain 1회 | **AGREE** — 벌크 path 파라미터 전달 · default 하위호환 |
| #4 Set dedup orbit candidates | **AGREE** — sort 후 집합 동일 방향 |
| #5 unlockedPlanetIds 1회 (presence index) | **AGREE** — 지배 병목 지점 합리적 · options 생략 시 기존 경로 유지 |
| 출력 의미론 | **AGREE** — listed/cleared 분리·보드 병합 규칙 등가(정적 재검) |
| TIMING 잔존 | **AGREE** — src 내 `[ArcCore/DailyOps][TIMING]` **0건** |
| tsc | **PASS** (김팀장 재실행 exit 0) |
| soft | 오프라인 41.6→32.5s **자체 재측정은 생략**(알고리즘 근거로 AGREE) · **실기 배치 중복 실행·항로 로딩 경합**은 본 patch 범위 밖 잔여 P1 · `tools/debug/_repro*` 커밋 제외 |
| **다음** | (1) 앱 1회 cold + 배치 완주 logcat (2) 완료 dayKey/AtMs/trend (3) 지시 시 **통합 커밋**(Wave A~C′ + 본 후속) |

```text
status=REVIEWED
team_lead_verdict=AGREE_CODE_FOLLOWUP · device_PASS_pending
task_id=daily-ops-batch-incomplete-fix-20260803 (follow-up perf)
commit=보류
```

---

## 📋 PENDING — 일일 배치 40~70초 소요 후속 O(N²) 3건 추가 발견·수정 · 김클로드 · 2026-08-04

```text
status=PENDING
task_id=daily-ops-batch-incomplete-fix-20260803
parent=위 REVIEWED 섹션(Wave A~C′, AGREE)의 후속 — "device_PASS_pending" 상태에서
  대표님이 오프라인 harness로 "정상 완료까지 40~70초" 재확인·질문 → 원인 정밀 추적
code_changes=YES — 5개 파일 추가 수정(아래 목록)
commit 금지
[pss-pre-dev] hot_path=아님(일 1회 배치) · alloc=무변경(전부 조회·dedup 최적화, 새 상태 없음) ·
  cache=arcfire_arc_core_daily_ops_v1 스키마 무변경(이번 라운드는 순수 알고리즘 성능) ·
  stage=arcCore 일일배치+바 인스턴스 의뢰+함장 presence 인덱스 · risk=P4(판정로직·
  출력 데이터 셋 무변경, 정렬·반환 결과 동일함을 각 함수별로 확인 후 반영) · verdict=PASS
```

### 무엇을 왜 했는가

REVIEWED 처리된 Wave C/C′(4개 함수 O(N²) 스프레드→O(N))가 실측 26ms→2ms(N=757)로 작아서, "그럼 실측 40~70초는 어디서 오는가"를 대표님이 다시 물으셨습니다. 오프라인 harness(`tools/debug/_repro-daily-batch.cjs`, 실제 세이브 757행성 데이터)에 이번엔 **단계별 타이밍을 임시로 촘촘히 삽입**해 실측하며 추적했고(작업 완료 후 전부 원복·제거), 아래 3건의 **별도 O(N²)/중복호출 버그**를 코드로 확인·수정했습니다. 전부 Wave C/C′와 무관한, 이번 세션에 처음 발견한 항목입니다.

| # | 파일:함수 | 문제 | 수정 |
|---|-----------|------|------|
| 1 | `store/planetCoreRuntimeStore.ts` — `patchPlanetCoresBulk`·`patchPlanetMasterBalanceBulk` | 벌크 패스 루프 안에서 행성마다 `findPlanetInSystems`(전 시스템 선형 탐색, O(N))를 호출 → O(N²) | `buildPlanetIndexFromSystems(systems): Map` O(1) 인덱스를 루프 밖에서 1회만 빌드 후 `.get()` 조회로 교체 |
| 2 | `missions/arcCoreInstanceMissionGenerator.ts` — `runArcCoreBarInstanceBoardReplenishPass`·`ensurePlanetBarInstanceBoard` | 일일 배치가 바 활성 행성마다 `ensurePlanetBarInstanceBoard`를 호출했는데, 그 안에서 매번 전체 `entries`(최대 757×10건)를 `filter`/재조립 → O(P×N) | 공통 코어(`computeReplenishedPlanetEntries`)를 추출해 `entries`를 행성별로 1회만 그룹핑(Map)한 뒤 각 행성은 자기 그룹만 처리 |
| 3 | 같은 파일 — `buildArcCoreInstanceMissionEntry` 호출부 | 신규 의뢰 entry 1건(행성당 최대 10건)마다 `resolveBarHostCaptainAtPlanet`(함장 presence 전역 인덱스 조회)을 재호출 — 결과가 같은 행성이면 항상 동일한데 10배 중복 호출 | 행성당 1회만 조회해 `hostCaptain` 파라미터로 전달(함수 내부 기본값은 하위호환 유지) |
| 4 | `arcCore/orbitPresence/captainOrbitPlanetAssignment.ts` — `listCaptainOrbitPlanetCandidates` | 함장 궤도 후보 목록에 개방 행성(최대 757개)을 하나씩 넣으며 `out.includes(pid)`(배열 선형 탐색)로 dedup → O(P²) per 함장 | `Set` 기반 dedup으로 교체(끝에 `.sort()`하므로 결과 집합·순서 100% 동일, 동작 무변화) |
| 5 | `arcCore/captainPresence/buildCaptainPresenceWorldIndex.ts` — `getCaptainPresenceWorldIndex` | 위 #4가 호출하는 `listUnlockedPlanetIdsForOrbitPresence()`(전 시스템 순회, 가벼운 연산 아님)를 **비전투 함장마다**(CSV 함장 247명) 반복 호출 — 인덱스 캐시가 있어도 최초 1회 빌드 자체가 이 반복 호출로 수 초 소요 | `getCaptainPresenceWorldIndex`에서 1회만 계산해 `resolveCaptainTableOrbitPlanetId(captain, {epochBucket, unlockedPlanetIds})`로 전달 |

### 실측 (오프라인 harness, 757행성 실데이터, 단계별)

- 1번만 반영: `perPlanetGroup`·`tailGroup` 변화 거의 없음(측정 노이즈 수준) — findPlanetInSystems 자체는 이 harness 조건(빈 보드 최초 실행)에서는 부수 기여자였음.
- 2·3번 반영 후: `arcCoreInstanceMissionDaily` 17.4s → 16.3s(호출 수는 10배 줄었으나 아래 4·5번이 진짜 지배 요인이었음이 이 시점에 드러남).
- 4번만 반영: 거의 무변화(dedup 메커니즘 자체보다 **호출 반복 횟수**가 지배적이었음 — 정직하게 원인 오판을 인정하고 5번까지 추적).
- 5번까지 반영: 전체 배치 완주 시간 **41.6s → 32.5s**(같은 harness·같은 데이터로 직접 비교, 약 22% 단축).

**중요한 한계**: 이 harness는 Node/tsx 위에서 도는 오프라인 재현이라, `require()` 호출 비용 등 일부 오버헤드가 실기(Metro+Hermes 번들, `require`가 숫자 인덱스로 사전 컴파일됨)보다 부풀려졌을 가능성이 있습니다. 위 5건은 전부 **알고리즘적으로 명백한 버그**(O(N²)·불필요 반복 호출)라 실기에서도 방향은 동일하게 개선되지만, 정확한 초 단위 개선폭은 실기 실측이 필요합니다.

### 남은 것 (조사했으나 원인 아님으로 확인)

`economyFabric`(~2.6s)·`planetMasterBalance`(~2s)·`scenarioEconomy`(~1.7s)·`convoyDailySettlement`(~3.2s) 등은 각각 757행성 규모의 정상적인 O(N) 작업으로 보이며, 이번 라운드에서 추가 O(N²) 패턴은 못 찾았습니다(얕은 확인만 — 전수 조사는 범위 밖). 32초는 이제 한 곳의 지배적 병목이 아니라 여러 패스에 고르게 분산돼 있습니다.

### self-check

```
npx tsc --noEmit -p tsconfig.client.json   → PASS(에러 0, 5개 변경 파일 반영 후)
오프라인 harness(757행성 실데이터)          → BATCH COMPLETED OK, 41.6s → 32.5s
임시 진단 계측(TIMING 로그·__PROF·globalThis 카운터) → 전부 원복·제거 확인(grep 0건)
```

### 대표님 질문("40~70초 때문에 오류가 많다면 어떻게 고치나")에 대한 답

1. 32.5초(실기는 더 짧을 가능성)는 기존에 확인된 "app_background→JS 리로드가 2~10분마다 발생"하는 주기보다 충분히 짧아, **정상 조건이라면 한 번의 연속 실행 창 안에 완주 가능**합니다.
2. REVIEWED된 Wave A 게이트(완료 기준 재시도)가 이미 있어, 설령 이번에도 중간에 죽더라도 다음 기회에 자동 재시도됩니다 — "영구 미완료"는 이제 구조적으로 막혀 있습니다.
3. 남은 리스크는 이번 task 범위 밖인 "왜 2~10분마다 리로드되는가"(OS/기기 레벨) — 이건 별도 조사가 필요합니다.

---

## 📋 김팀장 검수 — daily-ops-batch-incomplete-fix-20260803 · 2026-08-04

| 항목 | 결과 |
|------|------|
| **verdict** | **AGREE (코드)** · **실기 PASS 전 완료·커밋 보류** |
| task_id | `daily-ops-batch-incomplete-fix-20260803` |
| Wave A 게이트 | **AGREE** — `shouldRun` → `lastBatchCompletedDayKey` · migrate from `lastBatchAtMs` · markStarted는 gate 미사용 |
| Wave A′ SubCore catch | **AGREE** — catch + 10m 쿨다운 · markCompleted는 성공 경로만 |
| Wave B 격리 | **AGREE** — 기존 패스 try/catch 유지 |
| Wave B′ preamble | **AGREE** — bootstrap/begin* 개별 try/catch |
| Wave C/C′ bulk | **AGREE** — 4곳 O(N) in-place · 김클로드 「late OOM 단독 root 아님」하향 **수용**(여전히 가치 있는 수정) |
| 호출부 정합 | **AGREE** — `shouldRun` 입력 필드 단일 경로(SubCore만) |
| tsc | **PASS** (김팀장 재실행 exit 0) |
| READY 범위 | **AGREE** — vault fee·CSV 미침범 |
| soft | 실기 배치 완주·statOpsTrend day 갱신 미실측 · 백그라운드 재시작 40~70s 배치 간섭은 후속 관측 · `tools/debug/_repro*`/`_bench*` 일회 도구 **커밋 제외** |
| 리셋 | 마이그레이션으로 수동 RKStorage 리셋 **불필요**(완료 day=AtMs 기준 재시도) · 실패 시만 승인 후 키 리셋 |
| **다음** | 앱 리로드 후 배치 1회 · logcat `[ArcCore/DailyOps]` · storage `completedDayKey`+AtMs+trend kstDay · 이상 시 리셋/재검 |

```text
status=REVIEWED
team_lead_verdict=AGREE_CODE · device_PASS_pending
task_id=daily-ops-batch-incomplete-fix-20260803
commit=보류(실기 검증 후 · 사용자 지시 시)
```

---

## 📋 PENDING — 일일 배치 미완료 통합 수정(Wave A·A′·B·B′·C·C′) · 김클로드

```text
status=PENDING
task_id=daily-ops-batch-incomplete-fix-20260803
recheck=AGREE(A/A′/B/B′) + PARTIAL 정정(C/C′ — 근거 실측, 타이밍 크기 다름, 근거 아래)
waves=A,A′,B,B′,C,C′ 전부 구현
code_changes=YES — 6개 파일(schedule 3·subcores 1·store 1·economy 1)
commit 금지
[pss-pre-dev] hot_path=아님(일 1회 배치) · alloc=무변경(게이트·격리만, bulk는 오히려 감소) ·
  cache=arcfire_arc_core_daily_ops_v1 스키마 필드 추가(마이그레이션 포함) ·
  stage=arcCore 일일배치 · risk=P4(배치 호출빈도·CSV·판정로직 전부 무변경, 게이트 기준과
  실패 격리 범위만 확장) · verdict=PASS
```

### 재검수 (READY 원문 대비, 파일:줄 근거)

김팀장 READY(`kim-claude-ready-daily-ops-batch-incomplete-fix.md`)는 정확했고 그대로 구현했습니다. RECON 문서(`DAILY_OPS_BATCH_INCOMPLETE_RECON_20260803.md`)는 참조 경로가 깨져 있어(파일 자체가 실제로 없음) 못 열었고, READY 본문만으로 재검수·구현했습니다.

| Wave | 판정 | 근거 |
|------|------|------|
| **A(게이트)** | **AGREE** | `arcCoreDailyOpsState.ts`의 `markDailyBatchDayKey`가 시작 시점에 `lastBatchDayKey`를 선기록하고, `shouldRunArcCoreDailyBatch`가 이 값으로 게이트하는 걸 코드로 직접 확인 — 시작만 되고 중단되면 그 날 영구 차단됨. 실기로도 재현(어제·오늘 둘 다 `lastBatchDayKey=당일`인데 `lastBatchAtMs` 불변). |
| **A′(SubCore catch)** | **AGREE** | `probeDailyBatch`의 `batchWork`가 `try/finally`만 있고 `catch`가 없어 throw 시 `markCompleted` 여부와 무관하게 예외가 상위로 전파(제 어제 Wave B 격리가 batch 내부 25패스는 막았지만 preamble·SubCore 레벨은 안 막았음)됨을 확인. |
| **B(격리, 흡수)** | **AGREE, 기존 초안 유지** | 어제 구현분(`daily-ops-batch-step-isolation-20260803`) 그대로 — READY도 "격리만으로 완료 선언 금지"라 명시, C/A와 함께여야 완성. |
| **B′(preamble 가드)** | **AGREE** | `bootstrapFromWorldAsync`/`beginPlanetCoreStatOpsTrendSnapshot`/`beginPlanetCoreGaugeIntentBatch`가 기존 25패스 try/catch **밖**(앞)에 있어 여기서 던지면 전부 스킵됨을 확인. |
| **C/C′(O(N²) bulk)** | **PARTIAL 정정** | 4개 함수(`patchPlanetCoresBulk`·`patchPlanetMasterBalanceBulk`·`patchPlanetCoreStatOpsTrendBulk`·`runPlanetPgpDailyPass`) 전부 `next = {...next, [key]: ...}` 루프 내 재스프레드 O(N²) 패턴 **코드로 100% 확인** — 수정 자체는 명백히 옳음(무손실 O(N) 전환). **단, 마이크로벤치(`tools/debug/_bench-on2-vs-on.cjs`) 실측 결과 N=757에서 old=26ms·new=2ms — READY가 "late-stage 폭주 유력 후보"로 표현한 것보다 훨씬 작은 규모.** 이 패턴 단독으로 며칠씩 이어지는 미완료를 설명하긴 어려움 — 고쳐두는 게 명백히 이득(공짜 개선)이라 그대로 반영했지만, "유력 후보"에서 "저비용 개선(효과는 제한적)"으로 하향 정정. |

### 실기 재현·검증 (오프라인 harness — 실제 세이브 757행성 데이터 사용)

`tools/debug/_repro-daily-batch.cjs`(+ AsyncStorage/react-native/firebase 모크 3종) — 기기에서 pull한 RKStorage.db를 그대로 로드해 `runArcCoreDailyOpsBatch()`를 Node에서 직접 실행:
- 수정 후: **완료(BATCH COMPLETED OK)**, firebase-mock 관련 1건만 격리되어 로그로 남고 나머지 24개 패스 정상.
- 수정 전(C/C′만 되돌려 비교): 완료는 했지만(예외 없음) **총 소요시간 자체가 40~70초대**(1회성 비교라 노이즈 큼, 정밀 비교는 아님).

### 새로 발견한 사실 — 더 유력한 후보(추정, 미확정)

전체 배치 1회 완주가 오프라인에서도 **40~70초** 걸립니다. 이 중 상당수는 Firestore/RTDB `Promise.race` 타임아웃(예: `AUTH_TIMEOUT_MS=6000`·`ARCORE_SEED_PROBE_MS=4000`) 대기로 추정됩니다(오프라인 모크는 즉시 실패하지만, 실기는 실제 타임아웃 시간만큼 기다림 — 이런 지점이 여러 곳). **8/1~8/3 재검수 세션에서 이미 확인한 「app_background → JS 리로드/프로세스 재시작이 2~10분 간격으로 반복」 현상과 겹치면, 배치가 1~2분씩 걸리는 동안 리로드가 끼어들어 매번 죽는 시나리오가 이번 O(N²)보다 더 그럴듯합니다.** 이건 그 자체로 별도 조사가 필요한 OS/기기 레벨 이슈라 이번 task 범위 밖으로 남겨둡니다 — 다만 이번 Wave A 게이트 수정으로 "죽어도 다음 기회에 재시도"는 이제 보장되므로, 원인이 무엇이든 완료될 때까지 자연히 재시도됩니다.

### self-check

```
npx tsc --noEmit -p tsconfig.client.json   → PASS(에러 0, 전체 6개 변경 파일 반영 후)
오프라인 harness(757행성 실데이터)          → BATCH COMPLETED OK
마이크로벤치(O(N²) vs O(N), N=757)          → 26ms → 2ms
```

### 마이그레이션 주의

`arcfire_arc_core_daily_ops_v1`에 신규 필드 `lastBatchCompletedDayKey` 추가 — 기존 저장값엔 없으므로, `hydrateArcCoreDailyOpsState()`에서 `lastBatchAtMs`가 있으면 그 시각의 KST dayKey로 역산해 채우고, 없으면 null(즉시 재시도 대상)로 둠. 기존 세이브(예: 지금 실기의 `lastBatchAtMs≈2026-07-17T15:00Z`)는 마이그레이션되면 `completedDayKey="2026-07-18"`이 되어 오늘 재시도 대상으로 정확히 잡힘 — 별도 수동 리셋 불필요(어제 여쭤봤던 RKStorage 직접 조작은 이제 필요 없음).

### soft

- RECON 문서를 못 읽어서 그 안에 있었을 수 있는 추가 근거(§1-§3 상세표, 8/2 unlock·7/22 upkeep 성공 로그 등)는 READY 요약(§1)만으로 대체 검증 — 문서 경로 복구되면 대조 권장.
- 오프라인 harness는 AsyncStorage/react-native/firebase를 모크하므로 실기 100% 재현은 아님 — 실제 기기에서 다음 배치 완료 여부는 로그(`[ArcCore/DailyOps]`)로 재확인 필요.
- Firebase Auth/Firestore rules 연관은 READY도 "약함"으로 분류했고, 이번 조사로도 직접 증거는 못 찾음 — 배제는 아니지만 우선순위 낮춤.

**git commit 안 함** — 김팀장(Cursor 본창) 검수 요청.

---

## 📋 NOTE — 대표님 지시(2026-08-03): 22:00 재검수 종료 · 도구 일괄 제거 완료

- 소스 전수재검수 루프·`code-reaudit*`·`CODE_REAUDIT_*` 산출물 **삭제 완료** (2026-08-03 22:00 KST).
- 최종 고정 결과(제거 전): **FAIL 11** (F1 F2 F3 F4 F6 F7 F9 F10 F11 F12 F16) · **WARN 3** (F13–15) · **PASS 2** (F5 F8) · 틱 중 NEW_FAIL 없음.
- **유지**: 김경제 메모리 축 · READY 본문(수정 과제 F1~F16).
- **우선 READY**: `daily-ops-batch-incomplete-fix` · `faction-vault-fee-hydrate-race` CONDITIONAL.

---

## 📋 PENDING — 일일 배치(runArcCoreDailyOpsBatch) 7/18 이후 미완료 회귀 · 패스 격리 수정 · 김클로드

> ⚠ 내일 작업은 통합 READY(`daily-ops-batch-incomplete-fix`)로 진행.  
> 본 isolation 블록은 Wave B 초안 이력 — **격리만 PASS/완료 선언 금지**.

```text
status=PENDING
task_id=daily-ops-batch-step-isolation-20260803
superseded_by=daily-ops-batch-incomplete-fix-20260803
verdict=대표님 최초 제보("블루행성만 5대스탯 0.0")를 재조사한 결과 블루/레드 코드분기 아님 —
        실기 세이브에서 daily ops 배치가 2026-07-18 이후 매일 "시작"만 되고 "완료"는 한 번도
        못한 것을 실측 확인. 원인 후보는 같은 날짜(7/18) Firestore/Auth 전면개편(대표님 제공
        정보)이지만 정확한 throw 지점은 미확정 — 대신 패스 격리로 회귀 자체를 구조적으로 차단.
code_changes=YES — runArcCoreDailyOpsBatch.ts(패스별 try/catch 격리) · planetCoreStatOpsTrend.ts(스킵 로그 2줄)
commit 금지
```

### 조사 과정 (실기 세이브 직접 검증)

1. **최초 제보**: 블루 점유 행성만 행성정보창 5대 스탯이 화살표 없이 "0.0" — 레드·독립국은 정상.
2. **정적 코드 조사**(Explore 서브에이전트 + 직접 재확인): `resolvePlanetCoreStatAuthorityContext`가 BLUE/RED hold를 동일하게 `world_default`로 처리 — **팩션을 분기하는 코드 지점 없음**. `arcadia_prime`(BLUE) 홀드도 `deedOwnerClanId`/`homePlayerUid` 둘 다 null이라 `player_owned` 아님을 직접 확인.
3. **실기 데이터 직접 검증**(adb로 기기 AsyncStorage(RKStorage.db) pull → `better-sqlite3`로 파싱):
   - `arcfire_planet_core_runtime_v1`의 `detail.statOpsTrend`: 표본 추출한 BLUE/RED 행성 전부 **`kstDayKey:"2026-07-18"`** — 즉 블루·레드 무관하게 마지막 실제 갱신이 7/18. 레드가 화살표 보이는 건 "오늘 갱신"이 아니라 2주 전 값이 우연히 0이 아니었던 잔재.
   - **결정적 증거**: `arcfire_arc_core_daily_ops_v1` = `{"lastBatchDayKey":"2026-08-03","lastBatchAtMs":1784300406991}`. `lastBatchDayKey`는 조회 당일(오늘)인데 `lastBatchAtMs`를 변환하면 **2026-07-17T15:00Z(=7/18 00:00 KST)** — 16일 전. `ArcCoreDailyOpsSubCore.ts`의 설계(배치 **시작** 시 dayKey 선기록, **완료** 시에만 AtMs 갱신 — 중단 시 같은 날 무한 재시도 방지용)와 대조하면, **배치가 매일 "시작"은 되지만 끝까지 "완료"는 7/18 이후 한 번도 못 하고 있음**이 명확.
4. **대표님 제보**: 7/18 작업이 Firebase Anonymous Auth 정식 도입(auth.uid 정본화 + 기존 Android ID 계정 마이그레이션) + Firestore rules 전면 교체(catch-all 제거, `users/{uid}` 본인만 쓰기)였음 — **날짜가 정확히 일치**. 유력 후보로 기록하나, 실기 크래시 스택트레이스를 logcat에서 못 찾았고(버퍼 순환 추정) 오프라인 재현도 완전한 실기 재현엔 한계가 있어 **정확한 throw 지점은 미확정**으로 남김(아래 soft 참고).

### [pss-pre-dev]

```text
[pss-pre-dev] hot_path=아님(일 1회 배치 자체 — 호출 빈도 무변경, 패스 내부에 try/catch만 추가) ·
              alloc=미미(catch 시 err 객체 1개, 실패 시에만) · cache=없음
[pss-pre-dev] stage=arcCore 일일배치 · Skia/STAGE/worldmap 무관 · risk=P4(경제 배치 로직 자체는 무변경,
              실행 순서·조건·CSV 전부 동일 — 실패 시 해당 패스만 skip되고 이후 패스는 원래대로 진행)
[pss-pre-dev] verdict=PASS — "일 1회" 배치 호출 빈도·트리거 조건 무변경. 패스 개수·순서·CSV·판정 로직
              전부 동일, 실패 격리(try/catch)만 추가 — 새 동기 실행·신규 패스·신규 스케줄 없음
```

### 수정

**`runArcCoreDailyOpsBatch.ts`** — 기존에 보호되지 않던 약 20개 패스 호출 전부를 개별 `try/catch`로 감쌈. 패스 하나가 던져도 `reportDailyOpsStepFailure(step, err)`로 로그만 남기고(`console.error`, 항상 — `__DEV__` 무관) 다음 패스로 계속 진행. 이전엔 학습/RTDB 구간(`economyLearning`)만 보호돼 있었고 나머지는 무방비라, **아무 패스나 하나 던지면 그 뒤의 `commitPlanetCoreStatOpsTrendAfterBatch()`·`ArcCoreDailyOpsSubCore`의 `markArcCoreDailyBatchCompleted()`까지 전부 못 갔던 게 이번 회귀의 구조적 원인**이었음. `result.xxx` 필드는 실패 시 초기값(false)으로 남아 어떤 패스가 실패했는지 반환값으로도 드러남.

**`planetCoreStatOpsTrend.ts`** — `beginPlanetCoreStatOpsTrendSnapshot`/`commitPlanetCoreStatOpsTrendAfterBatch`의 기존 조용한 조기 return 2곳에 `console.warn` 추가(동작 변경 없음, 원인 특정용).

### 검증

- `npx tsc --noEmit -p tsconfig.client.json` → PASS(에러 0)
- **오프라인 재현 harness**: (삭제됨 · 대표님 지시 2026-08-03 개발 스캔/일회 디버그 도구 일괄 제거) 배포 후 실기 dayKey/AtMs·`statOpsTrend` 검증으로 대체.
- 대표님 원 제보(블루 5대 스탯 0.0)는 이번 배치가 정상 완료되기 시작하면 **자연히 해소**될 것으로 판단 — 별도 블루 전용 수정 불필요(코드에 그런 분기 자체가 없었음을 확인).

**git commit 안 함** — 김팀장(Cursor 본창) 검수 요청.

---

## 📋 PENDING — 팩션 금고 수수료 입금 hydrate 레이스(B1·B2) 수정 · 김클로드

### 김팀장 검수 (본창 · 2026-08-03 · 대표님 「검수하라」)

| 항목 | 결과 |
|------|------|
| **verdict** | **CONDITIONAL** — B1/B2 핵심 **AGREE** · **플레이어 무역 호출부 누락 FAIL 잔여** |
| **task_id** | `faction-vault-fee-hydrate-race-20260803` |
| B1 `ensureHydrated` + fee await 입금 | **AGREE** — `createFactionVaultStore.ts` Promise 공유 · 중복 hydrate 차단 |
| B1 원인 보강(재호출 hydrate vs 부트 미hydrate) | **AGREE** — 김클로드 재검수 합리 |
| B2 convoy 배치 arc+blue vault pre-hydrate | **AGREE** — + `executeArcConvoyRoundTrip` await 정합 |
| async 전파 (dwell→roundTrip→audit mjs) | **AGREE** — `tools/audit-convoy-coverage.mjs` await OK |
| 테스트 4/4 원본 버그 재현 | **AGREE** — 김팀장 재실행 PASS |
| tsc | **PASS** (김팀장 재실행 exit 0) |
| READY 범위 준수(CSV·일일스냅·유지비정책 무변경) | **AGREE** |
| **잔여 FAIL** | `app/(game)/trade.tsx` **405·748행** — `applyPlanetTradeTransactionFee` **await 없이** 호출(async 함수 fire-and-forget). 구매 직후 동기 path에서 `rollbackTradeBuyFailure`→`void reverse…` 가 **fee accumulate보다 먼저** 돌면 롤백 무력·수수료 유령 입금 가능. READY “모든 호출부 await” 미충족 |
| soft | `void settleArcTransportDwellTrade` tick fire-and-forget은 내부 await로 B1 해소 유지(순서 위험 낮음). `hydrate()` 자체는 이미 hydrated여도 재로드 가능(호출부 대부분 `!hydrated` 가드) — 후속 harden 가능 |
| **다음** | 김클로드 **trade.tsx 2곳 `await`**(핸들러 async화) 또는 `void`라도 구매 실패 롤백 전 fee Promise 완료 보장 — 보완 후 재검수. **완료·커밋 보류** |

| 필드 | 값 |
|------|-----|
| **status** | **`PENDING`** (잔여 FAIL — 완료 PASS·커밋 금지) |
| **updated** | 2026-08-03 (김팀장 검수 CONDITIONAL) |

---

## 📋 PENDING (김클로드 원문) — faction-vault-fee-hydrate-race

```text
status=PENDING
task_id=faction-vault-fee-hydrate-race-20260803
verdict=AGREE(원인) + PARTIAL 정정(구현 범위 — README "3개 호출부"보다 async 전파 범위가 더 넓음, 근거 아래)
code_changes=YES — B1/B2만(READY 범위 준수). CSV·유지비·일일스냅 정책 무변경.
[vault-fee-hydrate] B1=ensureHydrated · B2=convoy_pre_hydrate_vaults · tsc=PASS · deferred_policy=occupation_daily_snap_out_of_scope
commit 금지
```

### 재검수 판정 (CLAUDE.md 「김팀장 지시 재검수」 필수 절차)

| 항목 | 판정 | 근거 |
|------|------|------|
| B1 원인(fire-and-forget hydrate가 appendInflow를 덮어씀) | **AGREE** | `applyPlanetTradeTransactionFee.ts:63`(수정 전) `void factionVault.hydrate();` 확인. `createFactionVaultStore.ts:120-126`의 `hydrate()`가 `set({ balanceCredits: parsed... })`로 **무조건 전량 교체**(hydrated 여부 무관, 재호출 가드 없음)하는 것도 코드로 직접 확인 |
| B1 정밀화(원인의 실제 지배적 트리거) | **AGREE + 보강** | `AiEconomySubCore.ts:42-53`에서 **부트 시 이미 4개 스토어(fleet/arcVault/blueVault/ledger) 전부 await hydrate 완료**함을 확인 — 즉 "최초 1회 hydrate 전 호출" 레이스보다, **매 거래마다 `factionVault.hydrate()`가 무조건(hydrated 가드 없이) 재호출**돼 직전 `appendInflow`가 코얼레싱 대기 중(1500ms, `VAULT_PERSIST_COALESCE_MS`)인 디스크 구버전으로 덮어써지는 **반복 레이스**가 실측 갭(레저≫금고)의 더 직접적 설명. 수정 방향(ensureHydrated)은 두 레이스 모두 동일하게 해소 — 설계 변경 불필요 |
| B2 원인 | **AGREE** | `runArcCoreConvoyDailySettlementPass.ts:41-46`(수정 전) fleet·ledger만 await hydrate, 팩션 금고(arcVault/blueVault) hydrate 호출 자체가 없음을 확인 |
| 구현 범위("호출부 3곳") | **PARTIAL 정정** | `applyPlanetTradeTransactionFee`를 async화하니 `settleArcTransportDwellTrade`(내부에서 fee 함수 2회 호출) → `executeArcConvoyRoundTrip`(내부에서 dwell 2회 호출) → `AiEconomySubCore.onArcCoreCommand`(경제 커맨드 핸들러) 순으로 **3단 전파**가 필요했음. `AiEconomySubCore`는 tick성 커맨드 디스패처라 여기서부터는 `void`로 fire-and-forget(내부 await가 이미 순서를 보장하므로 안전) — README에 이 전파 경로가 명시돼 있지 않아 보강 |

### 수정 내용

**B1** — `createFactionVaultStore.ts`에 `ensureHydrated(): Promise<void>` 추가(이미 hydrated면 즉시 resolve · 진행 중이면 동일 Promise 공유로 중복 hydrate 방지). `applyPlanetTradeTransactionFee`/`reversePlanetTradeTransactionFee`를 async화해 `factionVault.ensureHydrated()`를 `appendInflow`/`trySpend` **직전** await. 이 async 전파가 `settleArcTransportDwellTrade`(async화) → `executeArcConvoyRoundTrip`(async화)까지 이어짐. 최종 호출부:
- `AiEconomySubCore.ts` 커맨드 핸들러 — `void settleArcTransportDwellTrade(...)`(fire-and-forget, 내부 순서는 보장됨)
- `tradeScreenPolicy.ts`의 `rollbackTradeBuyFailure`(sync 계약 유지, UI 다수 호출부라 시그니처 안 바꿈) — `void reversePlanetTradeTransactionFee(...)`
- `tools/audit-convoy-coverage.mjs`(README 미언급, grep으로 추가 발견) — `await executeArcConvoyRoundTrip(...)`로 수정(안 고치면 Promise를 sync 값처럼 써서 깨짐)

**B2** — `runArcCoreConvoyDailySettlementPass.ts` 시작부에 `useArcCoreVaultStore.ensureHydrated()` · `useBlueTeamSharedVaultStore.ensureHydrated()` 추가(fleet·ledger와 동일 위치), 내부 `executeArcConvoyRoundTrip` 호출 2곳에 `await` 추가.

### self-check

```
npx tsc --noEmit -p tsconfig.client.json                                          → PASS(에러 0)
npx tsx --test src/store/factionVault/createFactionVaultStore.test.ts             → PASS 4/4
```

### 판별력 — 신규 테스트가 실제로 원본 버그를 재현하는지

테스트 1)은 **수정 전 코드와 동일한 패턴**(`void hydrate(); appendInflow(500)`)을 직접 재현 — hydrate가 나중에 끝나며 500이 디스크값으로 덮어써 유실됨을 실측(assert). 테스트 2)~4)는 `ensureHydrated` 경유 시 유실 없음·dedup 확인. AsyncStorage 실사용 부분은 tsx(node ESM) 하에서 `@react-native-async-storage/async-storage`의 default export가 이중 래핑돼(esModuleInterop 미적용) `getItem`/`setItem`이 `undefined`로 잡히는 환경 한계로 zustand `setState`로 hydrate/persist를 대체해 검증(이 저장소의 다른 AsyncStorage 스토어들도 동일 이유로 테스트 파일 없음 — 기존 제약).

### 금지 항목 준수

일일 점유 스냅 입금 정책 미도입(§7 후속 별도 READY 대상, 손 안 댐) · 유지비 0-캡/마이너스 정책 무변경 · `price_elasticity`·수수료 CSV 무변경 · Headless 강제 분기(`ARCFIRE_HEADLESS_ECONOMY_AUDIT`) 프로덕션 미유입 · SKIA/STAGE/worldmap 무관.

### soft

- README 검증 항목 3(헤드리스/로그로 "BLUE hold 행성 fee가 블루 금고 totalInflow에 반영" 실측)은 미실기 — 코드 경로상 확실하나 실기 convoy settle 1회 후 로그 확인 권장(`tools/long-run-monitor` 다음 정오 배치에서 관찰 가능).
- `settleArcTransportDwellTrade`/`executeArcConvoyRoundTrip` async화가 이 세션에서 새로 만든 전파 범위라, 위 항목 표의 "PARTIAL 정정"대로 실기(특히 `AiEconomySubCore`의 tick 커맨드 처리량이 많은 시간대) 회귀 여부 확인 권장 — 로직상 fire-and-forget 지점의 순서 보장은 내부 await로 유지되나, 처음 도입하는 비동기 경계라 보수적으로 재확인 요청.

**git commit 안 함** — 김팀장(Cursor 본창) 검수 요청.

---

## ✅ REVIEWED — crimson_base effective≠runtimeGraph LogBox 원인 수정(R1b) · 김클로드 → 김팀장

### 김팀장 검수 (본창 · 2026-08-02 · 대표님 「검수하라」· Composer/글록 검수만)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** |
| **task_id** | `territorial-effective-graph-mismatch-warn-20260802` |
| 원인 진단 (템플릿 blue_red 단측 고착) | **AGREE** |
| R1b: contested 단측 → `*_neutral` | **AGREE** — graph와 정합 · warn 삭제 아님 |
| R1 both→blue_red · NEUTRAL P0 · contestedZone=false | **AGREE** — 회귀 유지 |
| 테스트 9/9b + stash 판별력 | **AGREE** |
| Maginot/CSV/warn 제거 금지 | **AGREE** |
| self-check (김팀장 재실행) | `tsx --test` PASS · `tsc` PASS |
| soft | 단측+템플릿 blue_red는 quick combat→binary dominance로 경로 변경(의도된 정합). 실기 crimson_base LogBox 1회 확인 권장 |
| 커밋 | 대표님 지시 시 (Composer 커밋 금지) |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED` → `IDLE` 가능** |
| **updated** | 2026-08-02 (김팀장 검수 PASS) |

---

## 📋 PENDING (archived) — crimson_base R1b · 김클로드 원문

```text
status=PENDING (archived → REVIEWED 2026-08-02)
task_id=territorial-effective-graph-mismatch-warn-20260802
verdict=김클로드 구현 — READY 권장 1안(R1b) 그대로. warn 삭제 아님, effective 산출을 graph에 정합.
code_changes=YES — resolveEffectiveTerritorialCombatMode.ts(1) + 동명 test.ts(신규 2케이스 + 기존 2건 설명 갱신)
commit 금지(당시)
```

### 원인 · 수정 (김클로드 요약)

비중립+contestedZone 단측 인접 시 policy blue_red 고착 → R1b로 `red_neutral`/`blue_neutral`. warn은 조건 소멸로 미표시. 테스트 9/9b·stash FAIL 증명.

---

## ✅ REVIEWED — 독립국 maintained 알림 「중립」 오표기 최소 패치 · 김클로드 → 김팀장

### 김팀장 검수 (본창 · 2026-08-02 · 대표님 「검수하라」· Composer/글록 검수만)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** |
| **task_id** | `territorial-independent-maintained-alert-20260802` |
| sideKey `independent` 분기 | **AGREE** — blue/red 외 전부 폴백 제거 |
| battle → `maintained.independentBody` | **AGREE** — 템플릿 ``.${sideKey}Body`` |
| diplomatic → `diplomaticBody` (neutralBody 아님) | **AGREE** — `sideKey!=='neutral'` 경로 |
| i18n ko/en independentBody | **AGREE** — blue/red 동일 패턴 |
| 범위 | **AGREE** — 판정/홀드/CSV/Maginot 무변경 |
| self-check | 김팀장 재실행 `tsc` — 아래 결과 |
| soft | 실기 드라코 방어 유지 알림 1회 확인 권장 |
| 커밋 | Opus API 복구 후 또는 대표님 지시 시 (Composer 커밋 금지) |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED` → `IDLE` 가능** |
| **updated** | 2026-08-02 (김팀장 검수 PASS) |

---

## 📋 PENDING (archived) — 독립국 maintained 알림 · 김클로드 원문

```text
status=PENDING (archived → REVIEWED 2026-08-02)
task_id=territorial-independent-maintained-alert-20260802
verdict=김클로드 구현 — READY 최소 범위(sideKey·i18n) 그대로, 판정/홀드/CSV 무변경
code_changes=YES — showTerritorialOccupationChangeAlert.ts(1) · i18n ko.ts/en.ts(각 1줄)
commit 금지(당시)
```

**배정 경위**: READY 1순위=Opus, 2순위=김클로드(Opus API 불가 시). 대표님 「김클로드가 진행」로 착수.

### 원인 · 수정 (김클로드)

`sideKey`에 `independent` 분기 + `maintained.independentBody` i18n. battle는 independentBody, diplomatic는 diplomaticBody. 판정/홀드/CSV 무변경.

### self-check (김클로드)

```
npx tsc --noEmit -p tsconfig.client.json   → PASS(에러 0)
```

### soft

- 실기 알림 문구 노출 확인 권장.

---

## 📋 PENDING — 은하계 지도 성계이동 3건 · 김클로드 (김팀장 검수: ①②③ AGREE · 잔여 1건 FAIL)

### 김팀장 검수 (본창 · 2026-08-02 · 대표님 「검수만 하라」)

| 항목 | 결과 |
|------|------|
| **verdict** | **CONDITIONAL** — 김클로드 ①②③ **AGREE** · **잔여 동일축 1건 FAIL** (유료 Opus 패치 대기) |
| **task_id** | `worldmap-transit-duplicate-move-fix-20260802` |
| ① AppState active `isMoving` 강제 해제 제거 | **AGREE** — 중복 `doMoveAlongPath` 경합 차단. `hubNavGate.reset`·제스처 rearm 유지 OK |
| ② 일반 도착 `moveToSystem`+`persist` 애니메이션 전 커밋 | **AGREE** — 조우전은 애니 후 `begin`/전투 진입 유지 |
| ③ blur cleanup `!landed → finalize…` 제거 | **AGREE** — `moveToSystem`→`currentPlanetId=null` 정상과 충돌. logcat 원복 설명 일치 |
| **잔여 FAIL** | `persistGalaxyMapSessionOnBackground` → 여전히 `resumePlayerToLastHubPlanet`. 조기 커밋 후 AppState `inactive`/`background` 시 **③과 동일 허브 원복**. 수정안: `systemId && !planetId`면 persist만, hub resume 스킵 (`galaxyMapSessionResume.ts`) |
| self-check (재실행) | 김클로드 트리 기준 `tsc` PASS · `audit:memory` 37/37 PASS — **잔여 FAIL로 완료·커밋 선언 보류** |
| soft | 실기 이동·착륙 · 조우전 · 주기 `app_background` 근본은 범위 밖 |
| 다음 | **Opus(김팀장)** 로 잔여 1건 패치 후 `REVIEWED`/`IDLE` · 커밋은 대표님 지시 시 |

| 필드 | 값 |
|------|-----|
| **status** | **`PENDING`** (잔여 FAIL — Composer 코드 수정·PASS 선언 금지) |
| **updated** | 2026-08-02 (김팀장 검수 CONDITIONAL) |

---

## 📋 PENDING (김클로드 원문 요지) — 은하계 지도 성계이동 3건

```text
status=PENDING
task_id=worldmap-transit-duplicate-move-fix-20260802
verdict=김클로드 자체진단 — 3건 모두 원인 특정·수정 완료. ③이 "로딩 나타나며 여전히 이동 안 됨" 증상의 실제 근본 원인.
code_changes=YES — app/(game)/worldmap.tsx (① AppState active 2줄 제거 ② doMoveAlongPath 커밋순서 재배치 ③ blur cleanup 강제원복 로직 제거)
commit 금지
```

### 배경 (대표님 실측, 2026-08-02, 순차 보고 3건)

1. 「전함 마크이동도 두번반복되는 버그가 있다. 어제이후 생긴것이다.」→ 버그① 수정.
2. 「모두 수정하라」→ 이전 턴에 진단만 하고 미뤄뒀던 도착 커밋 유실 버그도 이어서 수정 → 버그② 수정.
3. ①·②를 고친 뒤에도 「이동시 로딩이 나타나면서 여전히 이동이 안된다. 로딩이 나타나는 이유부터 전수검사」→ **실기 adb logcat을 직접 떠서 전수검사**, `system_change` 이벤트가 `arcadia→vega_outpost→arcadia→...` 패턴으로 반복되는 걸 확인 → 추적 결과 **버그②가 의도치 않게 노출시킨 기존 경합이 버그③, 이게 실제 근본 원인**.

`worldmap.tsx`·`galaxyMapSessionResume.ts`에 **미커밋 상태로 김팀장이 작업 중인 변경**(hubNavGate/mapInteractionReady 「고착」 회귀 대응, 코드 주석상 2026-08-02)이 있어, 그 변경분을 기반으로 진단·수정.

---

## 버그① 전함 마크 2회 중복 이동

### [pss-pre-dev]

```text
[pss-pre-dev] hot_path=없음(AppState 'active' 이벤트 콜백 — 포그라운드 복귀 시 1회) ·
              alloc=0(라인 삭제만, 신규 객체 없음) · cache=해당없음
[pss-pre-dev] stage=galaxy_map STAGE2 이동(doMoveAlongPath) · Skia 비접촉 · risk=P1(락 로직만, 렌더/틱 무관)
[pss-pre-dev] verdict=PASS — 기존 fallback 타이머(SHIP_TRANSIT_DURATION_MS+40ms)가 이미 자연 해제를 보장하므로
              이 2줄 제거로 새로 stuck 되는 경로 없음(아래 근거)
```

### 원인 (파일:줄 근거)

`worldmap.tsx:652-665`(김팀장 미커밋분) — 포그라운드 복귀(`AppState` `next==='active'`) 시마다:
```ts
hubNavGate.reset();
setIsMoving(false);
isMovingRef.current = false;   // ← 문제의 2줄(제거 대상)
armGalaxyMapScrollGestures();
```
이 무조건 실행됨. 그런데 `doMoveAlongPath()`(`worldmap.tsx:1359`)는 홉 애니메이션 대기를 **fallback 타이머로 항상 자체 해제**(`transitFallbackTimerRef.current = setTimeout(..., SHIP_TRANSIT_DURATION_MS+40)` → `settleTransitWait(true)`)하므로, 정상 진행 중인 이동이 "영구 stuck"이 되는 경우는 원래 없음 — 단, **백그라운드 중 JS 타이머가 스로틀돼 지연**될 수 있어, 그 사이 `next==='active'`가 먼저 도착하면 이 핸들러가 **아직 살아있는 `doMoveAlongPath` 실행 도중** `isMovingRef.current`를 강제로 `false`로 되돌림. 이 순간 대표님이 재탭하면 `handleMove()`의 게이트(`if (isMovingRef.current || isMoving) return;`)를 통과해 **두 번째 `doMoveAlongPath`가 첫 번째와 동시에 실행** — 둘 다 같은 `moveProgress`/`setShipTransit`를 건드려 전함 마크 이동 애니메이션이 중복 재생됨.

### 수정

`hubNavGate.reset()`·`armGalaxyMapScrollGestures()`는 유지(게이트/제스처 고착 방지, 이동 락과 무관한 별개 계약). `setIsMoving(false); isMovingRef.current = false;` 2줄만 제거 — 이동 락은 `doMoveAlongPath` 자신의 fallback 타이머·`finally`에만 맡김.

---

## 버그② 이동 후 도착 커밋 유실(아르카디아에 그대로 남음)

### [pss-pre-dev]

```text
[pss-pre-dev] hot_path=없음(탭당 1회 실행되는 doMoveAlongPath, 렌더/틱 루프 아님) · alloc=0(기존 호출 재배치만) · cache=해당없음
[pss-pre-dev] stage=galaxy_map STAGE2 이동 커밋 순서만 · Skia 비접촉 · risk=P2(전투 조우 분기 동작 유지 여부가 핵심 검증 포인트)
[pss-pre-dev] verdict=PASS — 조우전 분기(begin/selectSystem/navigateToCombatAfterTeardown)는 순서·가드 100% 동일 유지, 일반 도착 분기만 애니메이션 앞으로 이동
```

### 원인

`doMoveAlongPath()`가 좌표 커밋(`moveToSystem`+`persist`)을 **홉 애니메이션(3초/홉) 전부가 끝난 뒤**에만 실행하고 있었음. 애니메이션 대기 도중 `app_background`→JS 리로드/프로세스 재시작(2~10분 간격으로 반복되는 현상, 별도 미해결)이 끼어들면 `isMountedRef`/`isFocusedRef`가 꺼져 `allFinished=false`로 함수가 조용히 `return`돼 커밋이 통째로 유실됨.

### 수정

일반 도착(조우전 아닌 경우)의 `moveToSystem`+`markVisited`+미션 오브젝티브+`persist()`를 **연료 차감 직후, 애니메이션 루프 진입 전**으로 이동. 조우전 분기는 `willEncounter`(순수 확률 롤)만 미리 계산해두고, 실제 `begin()`/`navigateToCombatAfterTeardown()` 호출은 기존과 동일하게 애니메이션 뒤 `allFinished` 확인 후에만 실행 — 조우전 타이밍·확률·가드 전부 동작 변경 없음.

---

## 버그③(진짜 근본 원인) — blur cleanup의 "착륙 안 함→강제 원복"이 버그②가 만든 커밋을 매번 되돌림

①·②만으로는 안 고쳐져서 adb logcat을 직접 떠 `system_change` 이벤트를 시간순 추적 — `route_blur` → `system_change detail=arcadia` → `system_change detail=vega_outpost` 클러스터가 반복 발생하는 걸 확인(즉 arcadia→vega_outpost로 이동했다가 곧바로 다시 arcadia로 되돌아감).

### [pss-pre-dev]

```text
[pss-pre-dev] hot_path=없음(useFocusEffect cleanup — blur/deps 재실행 시 1회) · alloc=0(코드 제거만) · cache=해당없음
[pss-pre-dev] stage=galaxy_map STAGE2 blur 처리 · Skia 비접촉 · risk=P1(명시적 「마지막 허브로 복귀」 버튼 경로는 무변경 확인)
[pss-pre-dev] verdict=PASS — 제거 대상 로직은 2026-08-02 신설분(미커밋)이라 커밋된 기존 계약을 되돌리는 게 아님
```

### 원인 (파일:줄 근거)

`worldmap.tsx:675-678`(김팀장 미커밋분, 신설) — `useFocusEffect`(652행) cleanup에서:
```ts
const landed = usePlayerStore.getState().player?.currentPlanetId;
if (!landed) {
  finalizeGalaxyMapSessionForExit({ persist: true });  // → resumePlayerToLastHubPlanet → 아르카디아로 강제 이동
}
```
`playerStore.ts:633`의 `moveToSystem()`은 항상 `currentPlanetId: null`을 세팅한다(주석: "moveToSystem은 currentPlanetId를 null로 두므로"). 버그②로 `moveToSystem()`이 **애니메이션 전**에 먼저 실행되도록 바뀌면서, "성계 이동 성공 직후 아직 어디에도 착륙 안 한, 완전히 정상적인 상태"에서도 `!landed`가 **항상 참**이 됨. 이 상태에서 `useFocusEffect`가 cleanup을 타는 순간(진짜 화면 이탈이 아니어도 deps `[armGalaxyMapScrollGestures, hubNavGate]` 재평가·재포커스 등으로도 발동 가능) `finalizeGalaxyMapSessionForExit()` → `resumePlayerToLastHubPlanet()`이 실행되어 방금 커밋된 목적지를 **매번 아르카디아로 되돌림**. `releaseGalaxyMapStageMemory()`도 같이 호출돼 이게 "로딩화면"으로 보이는 것도 설명됨.

이 `!landed` 안전망 자체가 **틀린 전제**였다 — "착륙 안 함(currentPlanetId=null)"을 "이상 상태(이동이 중간에 끊김)"의 신호로 썼지만, moveToSystem 이후엔 착륙하기 전까지 항상 null인 게 **정상**이라 이상 상태와 구분이 안 됨. 리로드 도중 유실 방지는 이미 버그②의 조기 커밋(moveToSystem+persist)이 담당하므로 이 안전망은 불필요.

### 수정

`worldmap.tsx:675-678`(신설분) 제거 — cleanup은 `appSub.remove(); worldmapInternalNavRef.current = false;`만 수행. 명시적 「마지막 허브로 복귀」 버튼(`handleReturnToLastHub`, 427행)과 타이틀 복귀(`handleExitToTitle`)의 `finalizeGalaxyMapSessionForExit` 호출은 그대로 유지 — **의도적/명시적 사용자 행동에서만** 발동하도록 범위를 좁힘.

### self-check (3건 공통, 최종 상태 기준)

```
npx tsc --noEmit -p tsconfig.client.json   → PASS(에러 0)
npm run audit:memory                        → PASS 37/37 (+ skia-worklet 20/20)
```

### soft(실기 미확인, 3건 공통)

- 유닛 테스트 미작성 — `worldmap.tsx`는 RN 컴포넌트(react-native-gesture-handler·reanimated 등 다중 import)라 `tsx --test` 실행 불가(기존 제약, 이 파일 전체가 원래 테스트 커버리지 없음).
- 버그③ 제거로 "화면을 이탈했는데 착륙도 안 하고 아무 복귀 로직도 없는" 진짜 이상 상태(예: 리로드 자체가 실패하는 극단 케이스)에 대한 안전망이 약해질 가능성은 이론상 있음 — 다만 버그②의 조기 커밋이 이미 정상 이동을 원자적으로 보존하므로 실질적 리스크는 낮다고 판단.
- 조우전 발동 케이스(버그② 변경분) 실기 회귀 확인은 여전히 권장(발생 빈도 낮음).
- 근본 원인인 `app_background` 자체가 왜 2~10분 간격으로 반복되는지는 여전히 미해결(OS/기기 레벨, 범위 밖) — 이번 3건은 그 리로드가 나더라도 "성계 이동" 기능 자체가 깨지지 않도록 하는 수정.

**git commit 안 함** — 김팀장(Cursor 본창) 검수 요청.

---

## ✅ REVIEWED — 은하계 지도 native_heap·PSS 분석 재검수 + remount 쿨다운 영속 · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-08-01 · 대표님 「검수하라」)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** (분석 PARTIAL 수용 · 코드 1건 유지) |
| **task_id** | `worldmap-native-heap-pss-audit-recheck-20260801` |
| 스테이지 | **AGREE** — 17:34~21:05 `galaxy_map_periodic*` · 허브 드론 로그 전무 |
| native_heap 본축 | **AGREE** — floor→21:57 native Δ+137.7 · PSS Δ+170 (≈81%) |
| GPU onRelease | **AGREE(무해·미수정)** — 진단 카운트 전용 · 이중 dispose SIGSEGV 위험 → 주입 금지 정정 OK |
| 21:10 사건 | **AGREE** — `app_background`→`Running "main" rootTag:41`(PID 29412) JS 루트 리로드 로그 실측 |
| remount | **AGREE** — 21:12:22 `hubBackdropNativeRemount epoch=1`(쿨다운 무력) → 21:13~ skip 정상 |
| 코드 | `runDeepNativeReclaimPass.ts`만 — AsyncStorage `arcfire_hub_backdrop_remount_cooldown_v1` 영속 · 판정 로직 무변경 |
| self-check | 김팀장 재실행 `tsc` PASS · `audit:native-reclaim` 20/20 PASS |
| soft | ① READY 원문은 코드금지였으나 김클로드 세션 「안정 개선 가능 시 진행」으로 범위 확대 — 패치는 좁아 **유지** · ② 지도 수시간 GL~140 floor·`app_background→JS리로드` 근본 원인은 **미해결**(증상 완화) · ③ hydrate 경합 fail-open · ④ 키는 월드축(계정 purge 비대상) OK |
| 커밋 | 대표님 지시 시 |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED` → `IDLE` 가능** |
| **updated** | 2026-08-01 (김팀장 검수 PASS) |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-worldmap-native-heap-pss-audit-recheck.md` |

---

## 📋 PENDING (archived) — 은하계 지도 native_heap 재검수 · 김클로드 원문

```text
status=PENDING (archived → REVIEWED 2026-08-01)
task_id=worldmap-native-heap-pss-audit-recheck-20260801
verdict=PARTIAL + code(cooldown persist)
commit 금지(당시)
```

### 재검수 판정표 (김클로드)

| 항목 | 판정 |
|------|------|
| 스테이지 17:34~21:05=지도 | AGREE |
| native_heap 본축 | AGREE |
| GPU release no-op | PARTIAL→DISAGREE(무해) · 코드 미변경 |
| remount cooldown / JS 리로드 | AGREE · 원인 재정의 |
| 김팀장 1안 | 수정제안(리로드 경계) |
| territorial 무관 | DISAGREE(무관) |

(상세 근거·코드 설명은 아래 archived 본문.)

---

## ✅ REVIEWED — 마지노선(N≤5)·외부팩션(F2·F4) 국가보급·전황 진동(M0~M8) · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-08-01 · 대표님 「검수하라」)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** (김팀장 보정 1건 포함) — READY M0~M5·M7·M8 충족 · M6 soft |
| **task_id** | `maginot-external-faction-supply-oscillation-20260801` |
| M1~M3 | 21코어 N집계 · hard/support/cool · reclaim 판정(보급선·COOL 게이트) · F2\|F4=라벨(NEUTRAL/INDEPENDENT 아님) |
| M4 | `runTerritorialCombatPass` 배선 · HARD→`*_neutral`+`hardFinalOccupyPct` · SUPPORT battle 가산 · envelope와 holdSide 배타 |
| **김팀장 보정** | HARD인데 `rollDecision≠battle`이면 **battle 강제** + HARD 시 **전술 역전 스킵** — due 최종 수복이 `P(battle)×0.8`로 붕괴하던 계약 위반 수정 |
| M5 | 연결수&lt;3 + HARD+인접≥1 → 80% 강제 unit · planetId 하드코딩 없음 |
| M6 | ActivePool HARD 전선 가산 — soft 미착수(후속) |
| M7 | 신규 `arc_core_maginot_external_supply_policy.csv` only · territorial combat 기존행 **diff 없음** |
| M8 | maginot 11 · envelope/eligibility/governor 회귀 · **tsc PASS** |
| soft | 실기 N≤5 미네르바 수복 로그 · F2\|F4는 기계적 점유 연동 없이 문서/정책 라벨 · operationMeta defenderSide 라벨 부정확(기능 무영향) |
| 커밋 | 대표님 지시 시 |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED` → `IDLE` 가능** |
| **updated** | 2026-08-01 (김팀장 검수 PASS + 보정) |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-maginot-external-faction-supply-oscillation.md` |

---

## 📋 PENDING (archived) — 마지노선·외부보급 · 김클로드 구현 원문

```text
status=PENDING (archived → REVIEWED 2026-08-01)
task_id=maginot-external-faction-supply-oscillation-20260801
verdict=PASS (김팀장 · battle강제+전술역전스킵 보정)
commit 금지(당시)
```

| 필드 | 값 |
|------|-----|
| **status** | **`PENDING`(archived)** |
| **updated** | 2026-08-01 (김클로드 구현) |
| **task_id** | `maginot-external-faction-supply-oscillation-20260801` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-maginot-external-faction-supply-oscillation.md` |

### [pss-pre-dev]

```text
[pss-pre-dev] hot_path=territorial due 1회 · N집계 O(21) dirty/캐시 · alloc=밴드해석1회 · cache=hold-revision
[pss-pre-dev] stage=arcCore territorial · Skia/UI 무관 · risk=P1(틱금지)·P6(persist불필요·파생만)
[pss-pre-dev] verdict=PASS — onBoot 전은하 스캔 금지 · 21코어 hold 카운트만 · 기존 CSV combat 행 무단변경 금지
```

### 구현 요약 (M0~M8)

| M | 내용 | 파일 |
|---|------|------|
| M0 | `docs/strategy/…` §6-5 신설(진동 밴드·F1-F4·§6-4 envelope와 우선순위 다이어그램 갱신) | `docs/strategy/ARC_CORE_TACTICAL_AUTOMATION_AND_GALAXY_STRATEGY.md` |
| M1 | `listScenarioCorePlanetIds()`(21코어, synth 제외, occupation seed CSV 정본) + `countFactionSystemsInCore(holds, side)` — 독립국·순수중립은 어느 N에도 미포함 | `resolveMaginotExternalSupply.ts`(신규) |
| M2 | `resolveMaginotBand({n, floorSystems, paritySystems})` → `'hard'\|'support'\|'cool'`. N≤5 hard·N≥10 cool·그 사이 support. 블루·레드 완전 대칭(동일 함수, side 파라미터 없음 — 호출측이 각자 N으로 독립 호출) | 상동 |
| M3 | `resolveMaginotReclaimDecision` — 반대(수복시도)측 밴드+보급선(≥1)만 보고 판정. **HARD**: `forceHardReclaim=true` → 호출측이 `effectiveCombatMode`를 (수복측)_neutral로 강제하고 `dominantSideWeightPct`를 CSV `hardFinalOccupyPct`(기본 80%)로 오버라이드 — §6-4 envelope에서 이미 검증된 `resolveBinaryDominantHoldTarget` 경로를 100% 재사용(신규 확률 메커니즘 없음, 실패 시 기존 홀더 유지가 자연히 성립). **SUPPORT**: `supportBattleWeightBoostPct`(기본 15)만 가산 | 상동 |
| M4 | `runTerritorialCombatPassForPlanet`에 배선 — supplyAdjacency 계산 직후(§6-4 envelope보다 먼저) N밴드·reclaim 판정 → rollDecision 가중치(SUPPORT) → `effectiveCombatMode`/`dominantSideWeightPct` 오버라이드(HARD). `envelopeDominantOverridePct`와 마지노선 오버라이드는 holdSide 조건이 서로 배타(envelope=NEUTRAL 전용·마지노선=BLUE/RED 전용)라 `??`로 안전하게 결합 | `runTerritorialCombatPass.ts` |
| M5 | 미네르바급(연결수<3, 3포위 STRONG 구조적 불가) 실측 재현 테스트 — HARD+아군인접=2면 여전히 80% 강제 수복 발동함을 직접 증명. `if (planetId==='minerva_deep')` 없음(정적 grep 테스트) | `resolveMaginotExternalSupply.test.ts` #8 |
| M6 | **선택 항목 — soft로 미착수.** ActivePool 승격 우선순위에 "HARD 약세측 전선" 가산은 범위가 커 이번엔 보류. `contestedPoolGovernor.ts` 기존 티어(중립 최우선, 2 tasks 전)와 충돌 없이 별도 가산항 추가하는 방향을 권장 — §6-5 문서·본 handoff에 후속 과제로 기록 | 미착수(문서만) |
| M7 | 신규 `tables/balance/arc_core_maginot_external_supply_policy.csv`(corePlanetCountScope=scenario21·floorSystems=5·paritySystems=10·hardFinalOccupyPct=80·minAdjacentFriendlyForReclaim=1·supportBattleWeightBoostPct=15·externalFactionCodes=F2\|F4) + `arcCoreMaginotExternalSupplyPolicy.ts` O(1) 로더 | 신규 CSV·로더 |
| M8 | unit 11케이스 신규 + 기존 territorial 11개 테스트 파일 전체 회귀 PASS + `tsc` PASS | 아래 self-check |

### HARD 80% 근거 (수식·가중)

새 확률 메커니즘을 만들지 않고 **기존에 검증된 binary-dominance 경로**(`resolveBinaryDominantHoldTarget`, §6-4 envelope 작업에서 이미 unit으로 증명됨)를 재사용한다: `effectiveCombatMode`를 (수복측)_neutral로 강제하면 `dominant = 수복측`, `dominantWins = Math.random()*100 < dominantSideWeightPct`. `dominantSideWeightPct`를 `hardFinalOccupyPct`(CSV 80)로 오버라이드하므로 **이 due에서 수복측이 이길 확률이 정확히 80%**이고, 지면(20%) 기존 홀더가 그대로 유지된다(코드: `resolveBinaryDominantHoldTarget`의 `if (dominantWins) return dominant; if (holdSide !== 'NEUTRAL') return holdSide;`). fleet/quickCombat 경로를 타지 않아 함대 구성과 무관하게 확률이 보장된다.

### 미네르바급 검증 (연결수<3 갭 해소)

`resolveSupplyEnvelope.test.ts`류 3포위(§6-4)는 연결 수 3 미만인 성계(예: 연결 2개)에서 구조적으로 STRONG이 될 수 없다 — `resolveMaginotExternalSupply.test.ts` #8이 이 정확한 상황(연결<3, envelope='none')에서도 마지노선 HARD+아군인접≥1이면 여전히 80% 강제 수복이 발동함을 직접 증명한다.

### self-check 결과

```
npx tsc --noEmit -p tsconfig.client.json                              → PASS(에러 0)
npx tsx --test resolveMaginotExternalSupply.test.ts                    → PASS 11/11(신규, 미네르바급·대칭·배선 확인 포함)
npx tsx --test resolveSupplyEnvelope.test.ts                           → PASS 12/12(회귀)
npx tsx --test resolveEffectiveTerritorialCombatMode.test.ts           → PASS 15/15(회귀)
npx tsx --test contestedEligibility.test.ts                            → PASS 11/11(회귀)
npx tsx --test contestedPoolGovernor.test.ts                           → PASS 11/11(회귀)
npx tsx --test contestedActivePool.test.ts                             → PASS 5/5(회귀)
npx tsx --test geoFlankHeliosTitanOccupation.test.ts                   → PASS 7/7(회귀)
npx tsx --test territorialStackConsistency.test.ts                     → PASS 6/6(회귀)
npx tsx --test territorialSupplyLine.test.ts                           → PASS 16/16(회귀)
npx tsx --test frontPressureIndex.test.ts                              → PASS 5/5(회귀)
npx tsx --test seedPlanetOccupationFromBalance.test.ts                 → PASS(회귀)
npx tsx --test planetHoldReleasePolicy.test.ts                         → PASS 6/6(회귀)
```

### 회귀 판별력 검증

`runTerritorialCombatPass.ts`의 마지노선 배선을 `git stash`로 일시 되돌려 정적 테스트 #11이 **FAIL**(HARD여도 effectiveCombatMode/dominant% 강제 오버라이드 없음) 확인 → `git stash pop` 복원 후 **PASS** 재확인.

### CSV / 기존값 변경 여부

`arc_core_territorial_combat_policy.csv`(정적 5행) · `arc_core_supply_envelope_policy.csv`(§6-4, 유지) · `faction_political_relations.csv` · `planet_occupation_seeds.csv` · `planet_trade_route_profile.csv` **전부 git diff 없음**. 신규 CSV(`arc_core_maginot_external_supply_policy.csv`) 1개만 추가, `build:balance-tables` 반영 완료. `if (planetId==='minerva_deep'|'iron_remnant')` 류 하드코딩 없음(정적 grep 테스트로 고정). 외부팩션은 `galaxyRouteFactionPolicy.ts`의 실제 F2(`mega_mercurium_coalition`)·F4(`mega_aurelium_guild`) 코드를 CSV 라벨로만 참조 — `NEUTRAL`/`INDEPENDENT` 치환 없음. `trade_coalition`/`miners_guild`는 flavor이며 국가 id가 아니다.

### 리스크 · soft(실기 미확인) · 해석적 결정

- **M6 미착수**(위 표 참고) — ActivePool 승격 가산은 다음 세션 후속 과제.
- **operationMeta 감사 필드 소폭 부정확** — 기존 `resolveAttackerDefenderSides`의 `blue_neutral`/`red_neutral` 분기는 원래 "진짜 NEUTRAL hold"만 가정하고 설계돼 있어, 마지노선이 이 모드를 BLUE/RED-hold에 강제로 씌우면 `operationMeta.defenderSide`가 실제 이전 홀더 대신 `'NEUTRAL'`로 기록될 수 있음(순수 로그/감사 필드 — 실제 점유 판정 로직인 `resolveBinaryDominantHoldTarget`은 `holdSide`를 직접 받아 정확하게 처리하므로 **기능에는 영향 없음**). 원한다면 후속으로 `resolveAttackerDefenderSides`를 확장해 정확한 라벨을 남길 수 있음.
- **실기 미확인**: 실제로 N이 5 이하로 떨어졌을 때 다음 due에서 80% 근처로 수복되는지, N이 10 이상 회복됐을 때 외부보급이 정말 감쇠하는지는 unit·정적 검증만 — 확률 기반이라 여러 due 표본 필요(20분 간격 due 특성상 실기 검증에 시간이 걸림).
- CSV 수치(`floorSystems=5`·`paritySystems=10`·`hardFinalOccupyPct=80`·`supportBattleWeightBoostPct=15`)는 대표님 정본 문서의 기본값을 그대로 채택 — 실기 체감 후 조정은 CSV만 바꾸면 됨.

**git commit 안 함** — 김팀장(Cursor 본창) 검수·커밋 요청.

---

## ✅ REVIEWED — 보급 3성계 포위 점령 우세·중립화=내부 반란 우선(M0~M7) · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-08-01 · 대표님 「검수하라」)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** — READY M0~M7 충족 · 아이언 `neutral_declare` 회귀 경로 차단(동측 STRONG) |
| **task_id** | `supply-envelope-occupy-rebellion-neutral-20260801` |
| M1~M4 | `resolveSupplyEnvelope` · 가중치 보정 · dominate 88% · BLUE+STRONG → neutral_declare=0 |
| M5 | 반란 일일패스 `envelopeRebellionOverthrowMul` 최종 mul만 · wealth CSV 무변경 |
| M6 | 신규 `arc_core_supply_envelope_policy.csv` only · territorial combat 기존행 **diff 없음** |
| M7 | envelope 12 · effective/eligibility/governor/ActivePool 회귀 · **tsc PASS** |
| soft | NEUTRAL+STRONG due 1회 점유 기대≈0.69(78%×88%) — READY 「≥0.75 권장」보다 약간 낮음 · CSV boost/occupy만으로 상향 가능 · 실기 순차 1바퀴 로그 확인 권장 |
| 커밋 | 대표님 지시 시 |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED` → `IDLE` 가능** |
| **updated** | 2026-08-01 (김팀장 검수 PASS) |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-supply-envelope-occupy-rebellion-neutral.md` |

---

## 📋 PENDING (archived) — 보급 3성계 포위 · 김클로드 구현 원문

```text
status=PENDING (archived → REVIEWED 2026-08-01)
task_id=supply-envelope-occupy-rebellion-neutral-20260801
verdict=PASS (김팀장)
commit 금지(당시)
```

### [pss-pre-dev]

```text
[pss-pre-dev] hot_path=territorial_pass due 1회(이미 있음) · alloc=보급카운트 O(인접)·가중치 해석 1회 · cache=없음(기존 revision 재사용)
[pss-pre-dev] stage=arcCore territorial + (선택) rebellion daily 배치 가산만 · Skia/UI 무관 · risk=P1·기존값CSV무단변경
[pss-pre-dev] verdict=PASS — rollDecision/effectiveMode/반란 일일패스에 연결 · onBoot 동기 전수 금지 · planetId 하드코딩 금지
```

### 구현 요약 (M0~M7)

| M | 내용 | 파일 |
|---|------|------|
| M0 | `docs/strategy/…` §6-4 신설(스택 내 위치 다이어그램·CSV 무변경 명시) + 코드 주석(아래 M2/M3) | `docs/strategy/ARC_CORE_TACTICAL_AUTOMATION_AND_GALAXY_STRATEGY.md` |
| M1 | 순수 `resolveSupplyEnvelope({adjacency, threshold})` → `'blue_strong'\|'red_strong'\|'none'`. threshold(기본 3) 이상 인접 + 반대 팩션 인접 0. 연결 수<3인 성계는 구조적으로 STRONG 불가(자연 폴백) | `resolveSupplyEnvelope.ts`(신규) |
| M2 | `applySupplyEnvelopeDecisionWeights` — NEUTRAL+STRONG(A)이면 battle 상향+status_quo 하향(neutral_declare는 NEUTRAL hold에 실질 no-op이라 미조정), BLUE/RED hold+동측 STRONG(B)이면 neutral_declare에 `envelopeNeutralDeclareMul`(기본 0) 적용 · 제거분은 status_quo가 흡수. `runTerritorialCombatPassForPlanet`에서 `supplyAdjacency` 계산을 rollDecision **이전**으로 이동(기존엔 battle 진입 후에만 계산돼 있었음)해 재사용 | `resolveSupplyEnvelope.ts`·`runTerritorialCombatPass.ts` |
| M3 | `resolveSupplyEnvelopeDominantOverridePct` — NEUTRAL+STRONG일 때만 `dominantSideWeightPct`를 CSV `occupyHighWeightPct`(기본 88)로 오버라이드. `policyForDominance`(policy 얕은 복제)로만 적용, CSV 정적행 자체는 무변경 | 상동 |
| M4 | 아이언크로스 회귀 재현 테스트로 직접 증명(BLUE hold+blueEnv=3·redEnv=0 → neutral_declare 가중 0, status_quo 42로 흡수) | `resolveSupplyEnvelope.test.ts` #6 |
| M5(선택) | `runPlanetRebellionResolutionDailyPass.ts` — 동측 STRONG hold의 반란 전복 확률에 `envelopeRebellionOverthrowMul`(기본 1.35)을 최종 `factionMul`에만 곱함. wealth 곡선(`overthrowBaseProbAtDanger` 등) 자체는 무변경. `isPlanetContestedZone` 스킵(정적 5행)은 그대로 유지 — 동적 편입(iron_remnant 등)만 이 가산의 실질 대상 | `runPlanetRebellionResolutionDailyPass.ts` |
| M6 | 신규 `tables/balance/arc_core_supply_envelope_policy.csv`(단일 행, envelopeMinSystems=3·occupyHighWeightPct=88·envelopeBattleWeightBoostPct=20·envelopeNeutralDeclareMul=0·envelopeRebellionOverthrowMul=1.35) + `arcCoreSupplyEnvelopePolicy.ts` 로더(O(1) 캐시). 로직이 `runTerritorialCombatPassForPlanet`(모든 ActivePool planetId 공용 진입점) 안에 있어 CSV 정적행·동적 편입(iron_remnant 등) **전부 자동 적용** — 별도 분기 없음 | 신규 CSV·`arcCoreSupplyEnvelopePolicy.ts` |
| M7 | unit 25케이스 신규 + 기존 territorial 10개 테스트 파일 전체 회귀 PASS + `tsc` PASS | 아래 self-check |

### 아이언크로스 회귀 방지 (수용 기준 핵심)

`resolveSupplyEnvelope.test.ts` #6 — BLUE hold + blueEnv=3·redEnv=0(STRONG)이면 `neutral_declare` 가중치가 CSV 12%에서 **0**으로 억제되고 그만큼 `status_quo`가 흡수(30→42)함을 직접 assert. 정적 배선 테스트(#11)로 `runTerritorialCombatPass.ts`가 이 보정값을 실제 `rollDecision`에 전달하는지도 확인.

### self-check 결과

```
npx tsc --noEmit -p tsconfig.client.json                              → PASS(에러 0)
npx tsx --test resolveSupplyEnvelope.test.ts                           → PASS 12/12(신규, 아이언 회귀 재현 포함)
npx tsx --test resolveEffectiveTerritorialCombatMode.test.ts           → PASS 15/15(회귀)
npx tsx --test contestedEligibility.test.ts                            → PASS 11/11(회귀)
npx tsx --test contestedPoolGovernor.test.ts                           → PASS 11/11(회귀)
npx tsx --test contestedActivePool.test.ts                             → PASS 5/5(회귀)
npx tsx --test geoFlankHeliosTitanOccupation.test.ts                   → PASS 7/7(회귀)
npx tsx --test territorialStackConsistency.test.ts                     → PASS 6/6(회귀)
npx tsx --test territorialSupplyLine.test.ts                           → PASS 16/16(회귀)
npx tsx --test frontPressureIndex.test.ts                              → PASS 5/5(회귀)
npx tsx --test seedPlanetOccupationFromBalance.test.ts                 → PASS(회귀)
npx tsx --test planetHoldReleasePolicy.test.ts                         → PASS 6/6(회귀)
```

### 회귀 판별력 검증

`runTerritorialCombatPass.ts`의 envelope 배선을 `git stash`로 일시 되돌려 정적 테스트 #11이 **FAIL**(rollDecision이 여전히 CSV 원본 가중치만 사용) 확인 → `git stash pop` 복원 후 **PASS** 재확인.

### CSV / 기존값 변경 여부

`arc_core_territorial_combat_policy.csv`(정적 5행 battle/neutral/statusQuo/combatMode) **git diff 없음**. `faction_political_relations.csv`·`planet_occupation_seeds.csv` 무변경. wealth/반란 곡선 CSV(`overthrowBaseProbAtDanger` 등) 무변경 — M5는 최종 `factionMul`에만 배율을 곱함. 신규 CSV(`arc_core_supply_envelope_policy.csv`) 1개만 추가, `build:balance-tables` 반영 완료. `if (planetId === 'iron_remnant')` 류 하드코딩 없음(정적 grep 테스트로 고정).

### 리스크 · soft(실기 미확인)

- 실기 1바퀴 순차(20분 간격)에서 실제로 NEUTRAL+3포위가 다음 due에 고확률 점유되는지, iron_remnant류가 실제로 neutral_declare에서 안전한지는 unit·정적 검증만 — 실기 로그(`[territorial] ... 보급포위 envelope=...`) 확인은 김팀장/대표님 몫.
- M5(반란 가산)는 "선택" 항목으로 구현했으나, `isPlanetContestedZone`이 CSV 정적 5행만 스킵하고 동적 편입은 스킵하지 않는다는 기존 동작을 그대로 활용 — 새로 만든 조건 분기 없음(기존 계약 재사용).
- `occupyHighWeightPct`(88%)·`envelopeBattleWeightBoostPct`(20)·`envelopeRebellionOverthrowMul`(1.35) 등 신규 CSV 수치는 대표님 정본 문서의 기본값을 그대로 채택 — 실기 체감 후 조정 필요 시 CSV 값만 바꾸면 됨(코드 변경 불필요).

**git commit 안 함** — 김팀장(Cursor 본창) 검수·커밋 요청.

---

## ✅ REVIEWED — 분쟁 ActivePool·UI 정합 수정(M0~M6) · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-07-31 · 대표님 「검수하라」)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** — READY M0~M6 충족 · 대표님 지적(SAFE인데 목록/링 잔존 · iron_remnant 우선 승격) 해소 |
| **task_id** | `contested-active-pool-ui-fix-20260731` |
| M1~M2 | suspend 오버레이 + `listTerritorialCombatPolicies` 단일 필터 → 캠페인·예고 링 파생 반영 |
| M4 | `PROMOTE_TIER` strategic_neutral 최우선 · 1b 테스트(iron vs eternal_throne) |
| M5 | 후보 우주 = occupation seed + 해금 `synth_*` |
| M6 | `contestedActivePool` 5 · governor/eligibility · territorial 회귀 · **tsc PASS** |
| CSV | `arc_core_territorial_combat_policy.csv` **무변경**(런타임 suspend만) |
| **검수 수정** | `arcCoreTerritorialCombatPolicy.ts` — `getPlanetOccupationSeedRow` import를 함수 선언 **앞**으로 정리(모듈 중간 import) |
| soft | `getTerritorialCombatPolicy`·`listContestedZoneSystemIds`/`isContestedZoneSystemId`는 suspend 비인지(시드·설계 조회용 · UI 예고는 preview 경로) · 실기 Shadow 링 사라짐 확인 권장 |
| 커밋 | 대표님 지시 시 |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED` → `IDLE` 가능** |
| **updated** | 2026-07-31 (김팀장 검수 PASS) |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-contested-active-pool-ui-fix.md` |
| **선행** | `contested-eligibility-pool-governor-20260731` |

---

## 📋 PENDING (archived) — ActivePool·UI 정합 · 김클로드 구현 원문

```text
status=PENDING (archived → REVIEWED 2026-07-31)
task_id=contested-active-pool-ui-fix-20260731
verdict=PASS (김팀장)
commit 금지(당시)
```

### [pss-pre-dev]

```text
[pss-pre-dev] hot_path=territorial dirty rebalance 1회 · ActivePool revision 캐시 · alloc=후보 bounded
[pss-pre-dev] stage=arcCore territorial + worldmap preview 읽기만 · Skia 무관 · risk=P1·P6
[pss-pre-dev] verdict=PASS — onBoot 동기 전수 금지 · CSV 정적 행 파일 삭제 금지 · suspend/ActivePool 필터만
```

### 구현 요약 (M0~M6)

| M | 내용 | 파일 |
|---|------|------|
| M0 | 소비처 표(아래) | 본 항목 |
| M1 | `setSuspendedStaticPlanetIds`/`isSuspendedStaticPlanetId`(신규) — SAFE로 판정된 CSV 정적행을 담는 런타임 오버레이(파일 무변경, in-memory·revision 추적, persist 불필요한 파생 캐시) | `dynamicContestedZoneStore.ts` |
| M2 | **ActivePool 정본 단일화** — `listTerritorialCombatPolicies()`가 suspend된 CSV 정적행을 결과에서 제외하도록 필터 추가(dynamic SAFE 항목은 기존 거버너가 이미 store remove하므로 별도 처리 불필요). `listTerritorialCombatPoliciesForCampaign`·`resolveContestedZonePreviewSystemIds`는 전부 이 함수 파생이라 **단일 지점 수정으로 캠페인 due·지도 예고 링에 자동 반영** — 섀도우 SAFE면 링에도 안 뜸 | `arcCoreTerritorialCombatPolicy.ts`(캐시 키에 suspend revision 결합) |
| M3 | 캠페인 due: Active 목록 자체에 SAFE가 없는 게 정본(M2) — 기존 M2(이전 task) 스킵 루프는 **안전망으로 그대로 유지**(이중 방어, 코드 변경 없음) | 변경 없음(`runTerritorialCombatPass.ts`) |
| M4 | **min8 우선순위 하드 티어 신설** — `PROMOTE_TIER_BY_CLASSIFICATION`(strategic_neutral=0 최우선 · front=1 · independent_front=2)를 점수보다 먼저 비교해 정렬. 점수만으로는 보너스(연속+15·최근전투+10)가 겹치면 FRONT가 STRATEGIC_NEUTRAL 기본값을 역전할 수 있어 "중립 후보 있으면 무조건 먼저"를 못 지켰던 문제를 하드 티어로 해결. `scoreContestedEligibilityCandidate`도 STRATEGIC_NEUTRAL=120(FRONT 100보다 높게) 갱신(문서 일관성용, 강제는 티어가 담당) | `contestedPoolGovernor.ts` |
| M5 | 승격 후보 우주 확장 — 21코어(occupation seed) **+ 현재 해금된 synth 프론티어 성계**(`worldStore.unlockedSystemIds` 중 `synth_*`, 대표 planetId=`systems[id].planets[0]`). 대부분 NEUTRAL 시작(`seedSynthFrontierNeutralHold`)이라 "외곽 국경 중립" 후보 풀이 넓어져 FRONT 땜빵 없이도 min8을 채우기 쉬워짐 | `contestedPoolGovernorSync.ts`(`buildSystemUniverse`) |
| M6 | unit 16케이스 신규(이번 task) + 기존 territorial 10개 테스트 파일 전체 회귀 PASS + `tsc` PASS | 아래 self-check |

### M0 — 소비처 표

| 경로 | 역할 | 이번 task 영향 |
|------|------|----------------|
| `arcCoreTerritorialCombatPolicy.ts`(`listTerritorialCombatPolicies`) | ActivePool 정본 | suspend 필터 추가(단일 지점) |
| `listTerritorialCombatPoliciesForCampaign` | 캠페인 due 후보 목록 | `listTerritorialCombatPolicies()` 파생이라 자동 반영, 캐시 키만 suspend revision 포함하도록 갱신 |
| `resolveContestedZonePreviewSystemIds.ts` | 지도 예고 링 | 무변경(파생 자동 반영) — 직접 unit 테스트로 shadow_nexus 미표시 확인 |
| `contestedPoolGovernorSync.ts`(`rebalanceContestedPoolsNow`) | rebalance 오케스트레이션 | 그룹 루프 종료 후 `safeStaticPlanetIds` 집계해 `setSuspendedStaticPlanetIds` 1회 호출. 그룹 목록은 **원본 CSV**에서 뽑도록 변경(정적 5행이 전부 동시 SAFE로 suspend돼도 그룹 자체가 사라져 재평가 기회를 잃지 않게) |
| `dynamicContestedZoneStore.ts` | suspend 오버레이 저장소 | 신규 3함수 추가, zustand 의존 없음(순환참조 안전) |
| `getTerritorialCombatPolicy(planetId)` (단일 조회) | 시드 reconcile(`isTerritorialProcessPlanet` 등)·기존 테스트가 CSV 설계값 그대로 기대 | **의도적으로 미변경** — Active 목록(List) 함수만 suspend-aware, 단일 lookup은 "정책 존재 여부(설계 사실)"라는 별개 의미라 손대면 시드 reconcile·geoFlank/seed 테스트가 깨짐(scope 경계로 판단) |

### self-check 결과

```
npx tsc --noEmit -p tsconfig.client.json                              → PASS(에러 0)
npx tsx --test contestedActivePool.test.ts                             → PASS 5/5(신규 — ActivePool·지도 링·CSV 파일 보존)
npx tsx --test contestedPoolGovernor.test.ts                           → PASS 11/11(4 신규 티어케이스 포함)
npx tsx --test contestedEligibility.test.ts                            → PASS 11/11(회귀)
npx tsx --test resolveEffectiveTerritorialCombatMode.test.ts           → PASS 15/15(회귀)
npx tsx --test geoFlankHeliosTitanOccupation.test.ts                   → PASS 7/7(회귀)
npx tsx --test territorialStackConsistency.test.ts                     → PASS 6/6(회귀)
npx tsx --test territorialSupplyLine.test.ts                           → PASS 16/16(회귀)
npx tsx --test frontPressureIndex.test.ts                              → PASS 5/5(회귀)
npx tsx --test seedPlanetOccupationFromBalance.test.ts                 → PASS(회귀)
npx tsx --test planetHoldReleasePolicy.test.ts                         → PASS 6/6(회귀)
```

### 회귀 판별력 검증

- M2(ActivePool suspend 필터)를 임시로 되돌려 `contestedActivePool.test.ts`가 **FAIL**(suspend해도 목록에 남음) 확인 → 복원 후 **PASS**.
- M4(하드 티어)를 임시로 점수-only 정렬로 되돌려 `contestedPoolGovernor.test.ts` 1b가 **정확히 iron_remnant를 승격**하는 실패로 재현(대표님이 지적한 바로 그 버그) 확인 → 복원 후 **PASS**.

### CSV / 기존값 변경 여부

`arc_core_territorial_combat_policy.csv`(정적 5행) **git diff 없음** — CSV 원본 파일에 shadow_market 등 정적행이 그대로 남아있음을 테스트로 직접 확인(`contestedActivePool.test.ts` #4, 파일 텍스트 read). `faction_political_relations.csv`·`planet_occupation_seeds.csv` 무변경. 신규 CSV 추가 없음(이전 task의 `arc_core_contested_pool_policy.csv`만 유지, 이번엔 수치 변경 없음).

### 리스크 · soft(실기 미확인) · 참고

- 이번 세션 중 `contestedPoolGovernorSync.ts`에 **외부(김팀장/훅)가 이미 추가해 둔** "stepMax로 1회에 min/max 미도달 시 dirty 재마킹" 로직(A안 수렴 보정)을 발견 — 손대지 않고 그 위에 M1~M5를 얹었음. 이 로직 덕분에 min8 도달까지 여러 패스에 걸쳐 자동으로 재시도됨(제 예상 리스크였던 "step 상한 도달 후 고착" 문제가 이미 해결돼 있었음).
- 실기 미확인: 실제 기기에서 섀도우 넥서스가 지도 링·캠페인에서 사라지는지, min8 보충이 실제로 중립(예: eternal_throne/genesis_origin/해금 synth)만으로 채워지는지는 unit·정적 검증만.
- `getTerritorialCombatPolicy` 단일 조회는 의도적으로 suspend 비인지 상태로 남김(위 M0 표 근거) — 김팀장 검수 시 이 경계가 제품 의도와 맞는지 확인 요청.

**git commit 안 함** — 김팀장(Cursor 본창) 검수·커밋 요청.

---

## ✅ REVIEWED — 분쟁지역 Eligibility·풀 거버너(A안, M0~M7) · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-07-31 · 대표님 「검수하라」)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** — READY M0~M7 충족 · A안 min8 수렴 **1건 검수 중 수정** |
| **task_id** | `contested-eligibility-pool-governor-20260731` |
| M1 | SAFE/FRONT/중립/독립국 분류 · 섀도우 RED 완포위 → `safe_hinterland` 테스트 |
| M2 | SAFE 스킵 + `advanceTerritorialCampaignCursorForSkip`(due 창 미소비) |
| M3~M5 | 풀 거버너 순수 plan · CSV 정적 강등 금지 · demote/쿨다운 · 신규 CSV min8/max12/step2 |
| M6 | dirty rebalance · purge 시 `arc_*` 보존 · onBoot 동기 전수 없음 |
| M7 | tsc PASS · eligibility/governor + territorial 회귀 PASS |
| CSV | `arc_core_territorial_combat_policy.csv` **무변경** · `arc_core_contested_pool_policy.csv` **추가만** |
| **검수 수정** | `contestedPoolGovernorSync.ts` — stepMax로 1회에 min/max 미달 시 **dirty 재마킹**(5→7 고착 방지, A안 8 수렴) |
| 커밋 | 대표님 지시 시 · soft: 실기 로그(`[territorial] SAFE 스킵` / `풀 거버너 승격`) 확인 권장 |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED` → `IDLE` 가능** |
| **updated** | 2026-07-31 (김팀장 검수 PASS) |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-contested-eligibility-pool-governor.md` |

---

## 📋 PENDING (archived) — 분쟁 Eligibility 거버너 · 김클로드 구현 원문

```text
status=PENDING (archived → REVIEWED 2026-07-31)
task_id=contested-eligibility-pool-governor-20260731
```

| 필드 | 값 |
|------|-----|
| **status** | archived |
| **updated** | 2026-07-31 (김클로드 구현) |
| **task_id** | `contested-eligibility-pool-governor-20260731` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-contested-eligibility-pool-governor.md` |

### [pss-pre-dev]

```text
[pss-pre-dev] hot_path=territorial rebalance(캠페인1바퀴·hold변경 dirty) 1회 · alloc=후보스코어 bounded(21계) · cache=revision+adjacency
[pss-pre-dev] stage=arcCore territorial only · Skia/UI 무관 · risk=P1(빈도)·P6(persist coalesce)
[pss-pre-dev] verdict=PASS — onBoot 동기 전은하 스캔 금지 · SAFE 스킵+거버너만 · 기존 pass 스택 유지
```

### 구현 요약 (M0~M7)

| M | 내용 | 파일 |
|---|------|------|
| M0 | 소비처 표(아래) — policy list·campaign state·dynamic store·probe/pass 진입점·purge. 전 repo 스캔 없이 READY §1 힌트 경로만 확인 | 본 항목 |
| M1 | 순수 `classifyContestedEligibility`/`resolveContestedEligibilityForSystem` — SAFE_HINTERLAND(BLUE/RED hold+적대 인접 0, `hasAdjacentHostileFactionSystem` 재사용)·ELIGIBLE_FRONT(양쪽 인접, holdSide 무관)·ELIGIBLE_STRATEGIC_NEUTRAL(NEUTRAL+한쪽만)·ELIGIBLE_INDEPENDENT_FRONT(INDEPENDENT+적대 인접)·INELIGIBLE. **섀도우 넥서스 RED 완포위 실측 재현 테스트로 safe 확인**(수용기준 1) | `contestedEligibility.ts`(신규)·`.test.ts` |
| M2 | 캠페인 due 판정에서 SAFE면 판정 0회 스킵 — `advanceTerritorialCampaignCursorForSkip`(신규, `lastPassAtMs` 불변·`nextPreviewOrderIndex`만 전진)로 같은 pass 내 다음 ELIGIBLE로 즉시 재시도(빈 슬롯 정지 금지), 그룹 길이만큼만 시도(무한루프 방지) | `arcCoreTerritorialCombatState.ts`·`runTerritorialCombatPass.ts` |
| M3 | ActivePool = (CSV enabled·contestedZone 행 ∪ dynamic 항목) − SAFE. `planContestedPoolRebalance`(순수) — N<min이면 승격, N>max면 강등, **CSV 정적행은 강등 대상에서 원천 제외**(파일 삭제 금지·SAFE는 M2 스킵으로만 제외) | `contestedPoolGovernor.ts`(신규) |
| M4 | 승격 스코어: FRONT=100·STRATEGIC_NEUTRAL=60·**INDEPENDENT_FRONT=80(문서 미명시 — front/strategic_neutral 중간값 채택, soft)**·Active 1홉 연속 +15·플레이어 최근 전투 +10(`isWaveCombatCooldownActive` 재사용). 동점은 planetId 사전순 결정적. `promoteDynamicContestedZone` 재사용(템플릿 합성) — **NEUTRAL 승격의 initial combatMode는 별도 곡선 없이 템플릿 기본값(blue_red) 유지**: 기존 P0(2026-07-28)가 매 패스 런타임 인접으로 재계산하므로 정적 초기값이 무의미해짐(문서 "추가 밸런스 곡선 금지"와 일치). `source` 태그 `arc_frontline`/`arc_strategic_neutral`(INDEPENDENT_FRONT도 `arc_frontline`로 태깅, soft) | `contestedPoolGovernorSync.ts`(신규, glue) |
| M5 | 강등: CSV 정적은 파일 무변경(스킵 게이트만) · 동적(arc_*·player 무관)은 `demoteDynamicContestedZone`(신규)로 store remove + `recentlyDemoted` 쿨다운 기록. 쿨다운 = `cooldownLaps × 현재 활성 정책 수 × passIntervalSec`(신규 CSV `arc_core_contested_pool_policy.csv`: min8/max12/step2/cooldownLaps2) | `dynamicContestedZoneStore.ts`(확장)·`arcCoreContestedPoolPolicy.ts`(신규 로더)·신규 CSV |
| M6 | 주기: onBoot 동기 전수 스캔 없음 — `markContestedPoolDirty()`를 `applyArcCoreTerritorialHold`/`claimPlanetOwnershipByPurchase`/purge-pipeline 3곳(기존 `invalidateFrontPressure` 호출부와 동일 지점)에 추가, `runTerritorialCombatPass()`가 매 probe에서 `rebalanceContestedPoolsIfDirty()`로 dirty일 때만 1회 실행. **계정 purge 계약 변경**: `resetDynamicContestedZonesForAccountPurge`가 이제 `source` 접두 `arc_`(거버너 승격)는 **보존**, `player_wave*`만 기존대로 제거(월드축 vs 플레이어 귀속 진행 분리) | `dynamicContestedZoneStore.ts`·`clanWarFoundationStore.ts`(3곳)·`runTerritorialCombatPass.ts` |
| M7 | unit 27케이스(신규) + 기존 territorial 9개 테스트 파일 전체 회귀 PASS + `tsc` PASS | 아래 self-check |

### M0 — 소비처 표

| 경로 | 역할 | 이번 task 영향 |
|------|------|----------------|
| `arcCoreTerritorialCombatPolicy.ts`(`listTerritorialCombatPolicies`/`ForCampaign`) | CSV+dynamic 병합 정책 목록 | **무변경**(M3가 `listTerritorialCombatPolicies()` 결과를 읽기만) |
| `arcCoreTerritorialCombatState.ts` | 캠페인 순차 due·커서 | `advanceTerritorialCampaignCursorForSkip` 신규 함수만 추가 |
| `dynamicContestedZoneStore.ts` | 동적 편입 저장(AsyncStorage) | `demoteDynamicContestedZone`·`isRecentlyDemoted`·`pruneExpiredRecentlyDemoted`·dirty 플래그 3종 추가, purge 로직 변경(M6) |
| `runTerritorialCombatPass.ts` | 판정 스택 진입점 | 캠페인 루프에 SAFE 스킵 + dirty rebalance 호출 추가. **내부 P0/R1/전술역전 로직 무변경** |
| `localAccountReset.ts`(purge) | `resetDynamicContestedZonesForAccountPurge` 호출 | 함수 시그니처 무변경, 내부 동작만 변경(arc_* 보존) — 호출측 무수정 |
| `waveCombatCooldownStore.ts`(`isWaveCombatCooldownActive`) | 최근 전투 신호 | 읽기만(M4 스코어링) |
| `factionPoliticalRelations.ts`/`territorialSupplyLine.ts` | 적대관계·인접 카운트 | 읽기만(재사용, 신규 로직 없음) |

### self-check 결과

```
npx tsc --noEmit -p tsconfig.client.json                              → PASS(에러 0)
npx tsx --test contestedEligibility.test.ts                            → PASS 11/11(신규, 섀도우 완포위 실측 재현 포함)
npx tsx --test contestedPoolGovernor.test.ts                           → PASS 8/8(신규, 순수 로직)
npx tsx --test resolveEffectiveTerritorialCombatMode.test.ts           → PASS 15/15(회귀)
npx tsx --test geoFlankHeliosTitanOccupation.test.ts                   → PASS 7/7(회귀)
npx tsx --test territorialStackConsistency.test.ts                     → PASS 6/6(회귀)
npx tsx --test territorialSupplyLine.test.ts                           → PASS 16/16(회귀)
npx tsx --test frontPressureIndex.test.ts                              → PASS 5/5(회귀)
npx tsx --test seedPlanetOccupationFromBalance.test.ts                 → PASS(회귀, 동적 캠페인 순번 무관)
npx tsx --test planetHoldReleasePolicy.test.ts                         → PASS 6/6(회귀, purge 무관 확인)
```

### 회귀 판별력 검증

M2/M6 배선(`runTerritorialCombatPass.ts`)을 `git stash`로 일시 되돌려 정적 배선 테스트가 **FAIL**(SAFE 스킵/dirty rebalance 호출부 부재) 확인 → `git stash pop` 복원 후 **PASS** 재확인. 풀 거버너 순수 로직(`contestedPoolGovernor.test.ts`)은 승격/강등 목록의 구체적 내용·길이·순서를 assert(에러 유무만 체크 아님)해 트리비얼 통과가 아님.

### CSV / 기존값 변경 여부

`arc_core_territorial_combat_policy.csv`(정적 5행 combatMode/가중치/passInterval) **무변경**(git diff 없음). `faction_political_relations.csv`·`planet_occupation_seeds.csv` **무변경**(읽기만). 신규 추가만: `tables/balance/arc_core_contested_pool_policy.csv`(poolMin=8/poolMax=12/stepMax=2/cooldownLaps=2) — `npm run build:balance-tables`로 generated 반영 완료(자동 CSV→TS 파이프라인, 별도 배선 불필요). `planetId==='shadow_market'` 류 하드코딩 없음(정적 grep 테스트로 고정).

### 리스크 · soft(실기 미확인) · 해석적 결정

- **INDEPENDENT_FRONT 스코어(+80)** — READY M4 표에 명시 없음. front(100)/strategic_neutral(60) 중간값을 안전 기본으로 채택. 실제 게임플레이 체감상 우선순위 조정 필요하면 `contestedPoolGovernor.ts`의 `scoreContestedEligibilityCandidate` 한 줄만 수정하면 됨(밸런스 CSV화는 이번 범위 밖).
- **쿨다운 산식**(`cooldownLaps × 활성정책수 × passIntervalSec`)은 "캠페인 2바퀴"의 근사치 — 실제 캠페인 길이(8~12 변동)를 그때그때 반영해 재계산하므로 풀이 커질수록 쿨다운도 길어짐(의도된 근사, 별도 상수 하드코딩 아님).
- **실기 미확인**: 부트 후 실제 기기에서 ActivePool이 실제로 8까지 자동 채워지는지, 섀도우 넥서스가 실제로 로테이션에서 스킵되는지는 unit·정적 검증만 — 실기 로그(`[territorial] ... SAFE(완포위) 스킵`/`풀 거버너 승격`) 확인은 김팀장/대표님 몫.
- `eligible_independent_front` 승격이 `runIndependentHoldInvasionJudgment`(기존, 미변경)에 판정 기회를 부여하는 유일한 경로임을 코드 추적으로 확인(정책 없는 행성은애초 `runTerritorialCombatPassForPlanet` 진입 자체가 안 됨) — 부수 효과지만 의도된 것으로 판단, 문제 시 M4 스코어를 낮춰 억제 가능.
- 계정 purge 계약 변경(arc_* 보존)은 `localAccountReset.ts` 호출부 코드 변경 없이 내부 동작만 바뀜 — 김팀장 검수 시 실제 purge 흐름(로그인 계정 초기화)에서 arc_frontline 항목이 남는지 실기 확인 권장.

**git commit 안 함** — 김팀장(Cursor 본창) 검수·커밋 요청.

---

## ✅ REVIEWED — omega_hub `combatMode` 프로세스 충돌 재수정(M0~M5) · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-07-30 · 대표님 「검수하라」)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** — READY R1~R5·M0~M5 충족 · 검수 중 코드 수정 없음 |
| **task_id** | `omega-combatmode-runtime-conflict-20260729` |
| M1 | BLUE/RED hold + contested + 양쪽 인접 → `effective=blue_red` (R1) · NEUTRAL P0 회귀 유지 |
| M2 | early `policy vs graph` warn 제거 · battle 경로에서 `effective vs runtimeGraph`만 비교(R4) |
| M3 | unit 15케이스 PASS(오메가 재현 7·7b 포함) · 하드코딩 없음 |
| M4 | geoFlank 7/7 · stackConsistency 6/6 회귀 PASS |
| M5 | `tsc --noEmit -p tsconfig.client.json` PASS |
| CSV | `omega_hub` `blue_neutral` **무변경**(런타임 effective만) |
| 커밋 | 일부 daily snapshot에 포함됐을 수 있음 · 추가 커밋은 대표님 지시 시 |
| soft | 실기 1패스(RED attacker 실측) 미확인 · warn은 battle 진입 시에만(status_quo면 무관) |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED` → `IDLE` 가능** |
| **updated** | 2026-07-30 (김팀장 검수 PASS) |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-omega-combatmode-runtime-conflict.md` |

### 검수 메모

- 재발 핵심(BLUE 홀드 + CSV `blue_neutral` → RED 배제) **코드상 해소**: `effective=blue_red` → `attacker=RED, defender=BLUE`.
- 「참고용 경고」 오진 경로 제거됨 — 최종 effective가 runtime과 같으면 warn 없음.

---

## 📋 PENDING (archived) — omega combatMode 재수정 · 김클로드 구현 원문

```text
status=PENDING→REVIEWED
task_id=omega-combatmode-runtime-conflict-20260729
verdict=PASS (김팀장 2026-07-30)
commit 금지(검수 시)
재발원인: P0(NEUTRAL 전용)는 BLUE/RED hold가 되면 CSV combatMode가 영구 고정 → 양쪽 인접(접전)이어도 반대편이 battle에서 배제. 이전 조치는 warn 문구 완화·INDEPENDENT skip만 손대 실효 모드는 안 고쳐 재발.
실측대응: BLUE(또는 RED) hold + 블루·레드 둘 다 인접(contestedZone) → effective=blue_red(holdSide 무관, R1 신설)
self-check: tsc=PASS · unit=territorial 전체 PASS(신규 9케이스 포함)
```

| 필드 | 값 |
|------|-----|
| **status** | ~~PENDING~~ → **REVIEWED** |
| **updated** | 2026-07-29 (김클로드 구현) |
| **task_id** | `omega-combatmode-runtime-conflict-20260729` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-omega-combatmode-runtime-conflict.md` |

### [pss-pre-dev]

```text
[pss-pre-dev] hot_path=territorial_pass 1행성 · alloc=adjacency·effective 1회 · cache=세션 warn Set
[pss-pre-dev] stage=arcCore_territorial · risk=P1(틱금지)·CSV기존행무단변경금지
[pss-pre-dev] verdict=PASS — effectiveMode만 런타임 접전 정렬·planetId 하드코딩 금지
```

### 재발 원인 (3줄)

`resolveEffectiveTerritorialCombatMode`의 P0는 **NEUTRAL hold 전용**이라, omega_hub가 한 번 BLUE 점유가 되면 CSV `blue_neutral`이 **영구 고정**돼 타이탄(RED) 인접이 있어도 매 battle에서 RED가 배제됐다(`resolveAttackerDefenderSides(BLUE, blue_neutral)` → attacker=NEUTRAL/defender=BLUE, RED 진입 불가). 이전 조치는 DEV 경고 문구를 "참고용"으로 완화하고 INDEPENDENT hold의 그래프 검증만 skip해 **드라코 독립국 경고만 해소**했을 뿐, 이 실효 모드 고착 자체는 손대지 않아 오메가에서 그대로 재발했다.

### 구현 요약 (M0~M5)

| M | 내용 | 파일 |
|---|------|------|
| M0 | READY §0~§1 요약(위 재발 원인 3줄) · 소비처 확인: `resolveEffectiveTerritorialCombatMode`(핵심 수정) · `runTerritorialCombatPassForPlanet`(배선) · `inferTerritorialCombatModeFromGraph`(런타임 그래프 참고, 재사용만·중복 로직 없음) | 본 항목 |
| M1 | **R1 신설** — `contestedZone && hasBlue && hasRed`면 **holdSide 무관** `effective='blue_red'`. NEUTRAL hold의 기존 P0(2026-07-28, contestedZone 무관 "양쪽>0→blue_red")는 **그대로 보존**(회귀 없음) — R1은 BLUE/RED(비중립) hold에만 새로 추가된 분기. `planetId` 미입력 구조 유지(하드코딩 불가) | `resolveEffectiveTerritorialCombatMode.ts` |
| M2 | `runTerritorialCombatPassForPlanet` — 이미 배선된 `effectiveCombatMode` 호출부에 `contestedZone: policy.contestedZone` 인자 추가. **R4**: 독립국 분기 직후에 있던 옛 조기 그래프 경고(`policy.combatMode` vs runtimeGraph, effective 계산 전)를 **삭제**하고, `effectiveCombatMode` 계산 직후(battle 경로 진입 지점)로 이동해 **`effectiveCombatMode` vs runtimeGraph**를 비교하도록 정정 — 최종 effective가 런타임과 일치하면 경고 없음(이전엔 CSV 원본만 비교해 effective가 이미 맞아도 계속 오탐 경고가 났음) | `runTerritorialCombatPass.ts` |
| M3 | unit 9케이스 신규: (7)오메가 실측 재현(BLUE hold+blue_neutral CSV+양쪽인접→blue_red) (7b)RED hold도 동일 (7c)contestedZone=false면 R1 미적용(비중립 CSV 유지) (7d)contestedZone=false+NEUTRAL+양쪽인접은 기존 P0 경로로 여전히 blue_red(회귀 없음 고정) (8)R4 배선 정적확인(옛 조기경고 제거+새 위치가 effectiveCombatMode 사용) + 기존 1~6c 케이스 `contestedZone` 파라미터 추가 갱신 | `resolveEffectiveTerritorialCombatMode.test.ts` · `territorialStackConsistency.test.ts`(호출부 갱신) |
| M4 | 기존 geo-flank·P0·stack-consistency·supplyLine·frontPressure 회귀 테스트 전부 재실행 PASS(신규 로직이 기존 케이스에 영향 없음 확인) | — |
| M5 | self-check(아래) 전부 PASS | — |

### 회귀 판별력 검증

M1(R1) 핵심 수정을 `git stash`로 일시 되돌려 신규 테스트 7번이 **FAIL**(`actual: 'blue_neutral', expected: 'blue_red'` — 오메가 재발 시나리오 그대로 재현) 확인 → `git stash pop` 복원 후 **PASS** 재확인. 트리비얼 통과 아님.

### self-check 결과

```
npx tsc --noEmit -p tsconfig.client.json                                → PASS(에러 0)
npx tsx --test resolveEffectiveTerritorialCombatMode.test.ts            → PASS 15/15(9 신규 포함)
npx tsx --test geoFlankHeliosTitanOccupation.test.ts                    → PASS 7/7(회귀)
npx tsx --test territorialStackConsistency.test.ts                      → PASS 6/6(회귀)
npx tsx --test territorialSupplyLine.test.ts                            → PASS 16/16(회귀)
npx tsx --test frontPressureIndex.test.ts                               → PASS 5/5(회귀)
```

### CSV / 기존값 변경 여부

`arc_core_territorial_combat_policy.csv`(omega_hub `blue_neutral` 포함 전 행) **git diff 없음** — 런타임 effective만 조정, CSV `combatMode`/가중치/`dominantSideWeightPct` 등 전부 무변경. `planetId==='omega_hub'` 류 하드코딩 없음(6b 회귀 테스트로 고정).

### 리스크 · soft(실기 미확인)

- 실기(오메가 실제 1패스 battle 진입 시 RED가 attacker로 잡히는지·`[territorial] omega_hub 최종 effective=... != runtimeGraph=...` 경고가 실제로 사라지는지)는 **미확인** — unit·정적 검증만.
- R1은 `policy.contestedZone`에 의존하는데, 현재 CSV 전 행이 `contestedZone=true`라 실질적으로 전부 적용됨(향후 비분쟁 고정 행이 추가되면 R1 미적용 — 의도된 게이트).
- 독립국(INDEPENDENT) 침공 분기는 이 리졸버를 아예 거치지 않음(제어 흐름상 항상 그 전에 return) — 변경·영향 없음, 회귀 테스트(territorialStackConsistency #2)로 재확인.

**git commit 안 함** — 김팀장(Cursor 본창) 검수·커밋 요청.

---

## ✅ REVIEWED — 정식 서비스 성계 개방·세대 리셋(M0~M6) · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-07-29 · 대표님 「검수하라」)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** — READY M0~M6 충족 · 검수 중 코드 수정 없음 |
| **task_id** | `service-launch-world-expansion-reset-20260729` |
| M1 | `resolveWorldExpansionHardReset` — gen/epoch mismatch · `null`→hardReset · `undefined`→false(안전) |
| M2~M3 | `preserveAlreadyUnlocked=false` 시 targetCount 축소 · 일상 `true`면 기존 unlock 보존(테스트 a/a-대조/b) |
| M4 | `clearSynthFrontierNeutralHold` — 순수 neutral만 삭제 · 21코어/분쟁 hold 비대상 |
| M5~M6 | schedule 11/11 · resetDetection 5/5 · `tsc --noEmit -p tsconfig.client.json` PASS |
| CSV | `world_expansion_timing_policy`·territorial **무변경** (epoch=`2026-06-26` gen=`2` 유지) |
| 커밋 | **미커밋** — 대표님 지시 시 김팀장 커밋 |
| soft | 실기 hardReset 미확인 · Sync 경로 applied 캐시 1틱 지연 가능 · 결함 C(정책 캐시 하이드레이트 Sync 미배선) 후속 P1 · async `syncArcCoreGlobalWorldExpansion` dead 유지 |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED` → `IDLE` 가능** |
| **updated** | 2026-07-29 (김팀장 검수 PASS) |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-service-launch-world-expansion-reset.md` |

### 검수 메모

- 핵심 레버(세대 bump → 초과 synth 잠금 → epoch 재개방) **코드상 성립**.
- 정식일 반영은 여전히 **운영 체크리스트**(epochDayKey·resetGeneration·RTDB) — 본 패치는 레버만.
- handoff M0 표기 `epochDayKey=2026-06-01`은 오기 · 실 CSV는 **`2026-06-26`**.

---

## 📋 PENDING (archived) — 정식 서비스 성계 개방·세대 리셋 · 김클로드 구현 원문

```text
status=PENDING→REVIEWED
task_id=service-launch-world-expansion-reset-20260729
verdict=PASS (김팀장 2026-07-29)
commit 금지(검수 시)
```

| 필드 | 값 |
|------|-----|
| **status** | ~~PENDING~~ → **REVIEWED** |
| **updated** | 2026-07-29 (김클로드 구현) |
| **task_id** | `service-launch-world-expansion-reset-20260729` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-service-launch-world-expansion-reset.md` |
| **prompt** | `tools/kim-team-lead/reports/kim-claude-task-prompt-latest.txt` |

### [pss-pre-dev]

```text
[pss-pre-dev] hot_path=부트·일일배치1회 sync · alloc=reconcile시 unlocked배열1회 · cache=정책캐시·applied상태
[pss-pre-dev] stage=worldmap unlock 집합 · risk=P6(persist)·세대리셋시대량 remove
[pss-pre-dev] verdict=PASS — 틱/루프 신규 없음 · gen mismatch 때만 강제 reconcile · 21코어·분쟁 CSV 무단변경 없음
```

### 확정된 근본 원인 (재확인)

`buildDeterministicGlobalSynthUnlockSchedule`가 `alreadyUnlockedSynthIds`를 **`maxSynthUnlockCount` 체크 없이** schedule 접두로 무조건 밀어넣어, `targetCount`가 줄어도(세대 리셋) 결과 집합이 절대 줄어들지 않았음(결함 A). `syncArcCoreGlobalWorldExpansionSync`(실제 호출되는 유일한 경로 — 아래 M0 참고)는 `resetGeneration`을 **쓰기만** 하고 비교하지 않았음(결함 B) — 즉 세대 bump 레버 자체가 무의미했다.

### 구현 요약 (M0~M6)

| M | 내용 | 파일 |
|---|------|------|
| M0 | 소비처·저장키 표(아래) — **`syncArcCoreGlobalWorldExpansion`(async)은 실제로 어디서도 호출되지 않는 죽은 함수**임을 확인(진짜 호출부는 전부 `...Sync`). 이 사실이 hardReset 감지 설계(동기 캐시 필요)의 핵심 전제 | 아래 표 |
| M1 | `resolveWorldExpansionHardReset(applied, policy)` 신설(순수 함수, 신규 파일) — `applied` 없음(과거 기록 無+정책 存) 또는 `resetGeneration`/`epochDayKey` 불일치 → `hardReset=true`. 동기 호출 경로는 모듈 로드 시 백그라운드로 미리 읽어둔 인메모리 캐시(`appliedStateCache`)로 비교(레이스 시 안전 기본값 `false`, 다음 호출에서 자기 교정) — 비동기 경로는 항상 `await`로 실측 비교 | `src/arcCore/worldExpansionGlobalResetDetection.ts`(신규) · `syncArcCoreGlobalWorldExpansion.ts` |
| M2 | `hardReset=true`면 `buildGlobalSynthUnlockTargetIds(..., preserveAlreadyUnlocked=false)` — 접두 고정을 끄고 baseline+결정적 pick만으로 `targetCount`개를 순수 계산 → `reconcileGlobalSynthUnlocks`가 초과분을 정확히 remove | `worldExpansionGlobalSchedule.ts`(`preserveAlreadyUnlocked` 신규 파라미터, 기본 `true`=기존 동작) |
| M3 | `hardReset=false`(일상)면 `preserveAlreadyUnlocked=true`(기본값) — 기존 증분 접두 유지, 이미 연 성계가 되돌아가지 않음. 신규 unit(a-대조)으로 고정 | 상동 |
| M4 | `removed`(잠긴 synth) 각각에 대해 `clearSynthFrontierNeutralHold(planetId)` 신규 스토어 액션 호출 — `seedSynthFrontierNeutralHold`가 만든 **순수 neutral 자리표만** 제거(`kind==='neutral' && occupierClanId==='neutral'` 가드), player_home·독립국·클랜 점유는 절대 안 건드림. 21코어·BLUE/RED 시드 planetHolds는 애초에 `removed`(synth_* 한정)에 없으므로 무관 | `src/store/clanWarFoundationStore.ts`(`clearSynthFrontierNeutralHold` 신규 액션) · `syncArcCoreGlobalWorldExpansion.ts`(`clearRemovedSynthFrontierHolds` 헬퍼, 양쪽 sync 함수에서 호출) |
| M5 | unit 11케이스: (a) 세대bump→5개가 targetCount(2)로 축소 (a-대조) preserve=true면 5개 그대로(회귀 금지 고정) (b) 세대동일+1일→기존 유지+1개만 추가 (c) epoch전날→targetCount=0→빈 스케줄(hardReset 무관) (d) GAMEPLAY_SYSTEM_IDS는 스케줄 결과물에 안 나옴 (d-2) worldStore.ts 소스에 21코어 baseline 제외 필터가 실제 있는지 정적 확인 + `resolveWorldExpansionHardReset` 5케이스(mismatch 3종·일치·미하이드레이트) | `worldExpansionGlobalSchedule.test.ts`(확장) · `worldExpansionGlobalResetDetection.test.ts`(신규) |
| M6 | self-check(아래) 전부 PASS | — |

### M0 — 소비처·저장키 표

| 항목 | 역할 | 비고 |
|------|------|------|
| `arcfire_world_expansion_global_applied_v1`(AsyncStorage) | 직전 sync 결과({resetGeneration,epochDayKey,targetCount,lastSyncedAtMs}) | 이번에 **처음으로 실제 비교 대상**이 됨(M1) |
| `arcfire_world_expansion_global_policy_v1`(AsyncStorage) | RTDB origin 정책 캐시(`rtdbPolicyOverride` 하이드레이트) | **운영 주의**: `hydrateWorldExpansionGlobalPolicyCache()`는 여전히 미사용(dead) 비동기 함수 `syncArcCoreGlobalWorldExpansion`에서만 호출됨 — 실제(동기) 경로는 RTDB 캐시를 부트 시 하이드레이트하지 않음(결함 C, 본 task 범위 밖·후속 P1로 남김). RTDB `ingestRtdbWorldExpansionMasterState`가 라이브 세션 중 직접 override를 세팅하므로 정상 운영 중엔 큰 문제 없으나, "재시작 직후·RTDB 접속 전" 창에서는 CSV 폴백을 씀 |
| `tables/balance/world_expansion_timing_policy.csv` | CSV 폴백 정책(`globalScheduleEnabled/epochDayKey/resetGeneration/systemsPerDay`) | **읽기만**, 값 변경 없음(현재 `epochDayKey=2026-06-26` · `resetGeneration=2`) |
| `arcfire_world_v1`(worldStore AsyncStorage) | `unlockedSystemIds`/`systems`/`synthColonizationPhaseByPlanetId` | `reconcileGlobalSynthUnlocks`가 갱신(기존 함수, 변경 없음 — 이미 baseline 21코어 보존 로직 있음을 재확인) |
| clanWarFoundationDb(로컬 영속) | `planetHolds` | 신규 `clearSynthFrontierNeutralHold` 액션이 removed synth 자리표만 정리 |
| `WorldExpansionSubCore.onBoot()` | 부트 1회 호출 — `syncArcCoreGlobalWorldExpansionSync()` | `arcCoreHub.start()`가 `bootReady`(월드스토어 hydrate 포함 병렬 로드 완료) 이후에만 실행돼 `world.loaded` 보장됨 — 모듈 로드 시 시작한 applied-state 백그라운드 하이드레이트가 이 시점까지 끝날 여유 확보 |
| `tryArcCoreWorldDailyUnlock()`(`worldExpansionDailyUnlock.ts`) | 일일 운영 배치(`runArcCoreDailyOpsBatch`)에서 호출 | 반환값(`added.length>0`) 사용 — 시그니처 변경 없음(하위호환) |
| `localAccountReset.ts`(계정 초기화) | 초기화 후 `syncArcCoreGlobalWorldExpansionSync()` 재호출 | 변경 없음 |
| `fetchArcCoreRtdbOnce.ts`(RTDB ingest) | ingest 성공 후 `syncArcCoreGlobalWorldExpansionSync()` | 변경 없음 |
| `syncArcCoreGlobalWorldExpansion`(async, export) | **실사용처 0곳 확인**(재확인용 죽은 함수) | M1 로직은 정확성을 위해 여기서도 `await`로 실측 비교하도록 구현했지만, 실제 앱에서 호출되지 않으므로 이 함수의 hardReset 판정은 현재 아무 데도 영향 없음 — 향후 배선 여부는 본 task 범위 밖 |

### self-check 결과

```
npx tsc --noEmit -p tsconfig.client.json                              → PASS(에러 0)
npx tsx src/arcCore/worldExpansionGlobalSchedule.test.ts               → PASS 11/11(5 기존+6 신규)
npx tsx src/arcCore/worldExpansionGlobalResetDetection.test.ts         → PASS 5/5(신규)
```

### 회귀 판별력 검증

M2 핵심 수정(`preserveAlreadyUnlocked`)을 `git stash`로 일시 되돌려 (a) 테스트가 **FAIL**(`5 !== 2`, 정확히 결함 A 재현) 확인 → `git stash pop` 복원 후 **PASS** 재확인. 트리비얼 통과 아님.

### CSV / 기존값 변경 여부

`tables/balance/world_expansion_timing_policy.csv`(`epochDayKey`/`resetGeneration` 등) **무변경** — 현재 값 그대로 유지, 실제 "정식일" 확정은 본 task 밖(김팀장/대표님 승인 후 운영 반영). `arc_core_territorial_combat_policy.csv`·21코어 시드 CSV **무변경**. combatMode/가중치/passInterval **무변경**.

### 운영 체크리스트 (§4, 실행은 김팀장/운영 — 코드 레버는 이미 동작하게 완료)

```text
[ ] epochDayKey = 정식 시작일(KST YYYY-MM-DD)
[ ] resetGeneration = 이전 값 + 1
[ ] systemsPerDay = 1 · globalScheduleEnabled = true
[ ] build:balance-tables
[ ] RTDB worldExpansion/master/state 동일 값 publish (캐시 덮어쓰기)
[ ] 기존 기기: 부트/일일배치 후 synth unlock 수 == 경과일치 · 21코어 유지
[ ] 분쟁 3~5행성 로테이션·hold 시드 회귀 없음(본 task 무변경 확인)
```

### 리스크 · soft(실기 미확인)

- 실기(실제 기기 재시작 → hardReset 발동 → synth 잠금·hold 정리) 체감은 **미확인** — unit·정적 검증만.
- 동기 경로의 "미하이드레이트 시 안전 기본값 false" 레이스는 이론상 최초 부트 딱 1회 hardReset 판정을 1틱 늦출 수 있음(다음 호출에서 자기 교정) — `arcCoreHub.start()`가 `bootReady`(world hydrate 완료) 이후에만 실행되는 기존 부트 시퀀스상 실제 발생 가능성은 낮음.
- 정책 캐시(RTDB AsyncStorage) 하이드레이트 미배선(결함 C)은 **본 task 범위 밖**으로 남김 — 위 M0 표에 운영 주의로 기록.
- `syncArcCoreGlobalWorldExpansion`(async) 자체가 dead code — 삭제 여부는 김팀장 판단(본 task는 로직만 정합화, 삭제는 별건 "가비지 코드" 정리로 남김).

**git commit 안 함** — 김팀장(Cursor 본창) 검수·커밋 요청.

---

## ✅ REVIEWED — 성계 노드라인 전수검사·연동 재검증(M0~M6) · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-07-28 · 대표님 「김클로드 작업도 완료됬다 재검수하라」)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** — READY M0~M6 충족 · 검수 중 코드 수정 없음 |
| **task_id** | `system-node-graph-full-reaudit-20260728` |
| M0 | 소비처 표 OK · `runPlanetEnvironmentDiversityPass` GALAXY 일관(수정 불필요) |
| M1 | `audit-system-connections-full` asymmetric=[] · heliosPerseusDirect=false · withoutStarRows=[] |
| M2 | 정본 5홉·`omega↔draco` 유지 · planets.csv 키 엣지 실측 OK |
| M3 | `capSystemGraphMaxDegree` Pass1 tier0 keep · map-vs-csv drop/extra=[] |
| M4 | `build:content-tables`에 `sync-star-system-connections-from-planets.mjs` 편입 확인 · build 주석 OK |
| M5~M6 | `systemNodeGraphRegression` 7/7 PASS · supplyLine·geoFlank·stackConsistency 회귀 PASS · tsc PASS |
| CSV | combatMode/가중치 **무변경**(본 task) · star/planets는 선행 sync 계열 |
| 커밋 | **미커밋** — 대표님 지시 시 김팀장 커밋 |
| soft | 실기 월드맵 미확인 · 앱 완전 재시작 권장(`GALAXY_SYSTEMS_PRECOMPUTED` 모듈 캐시) |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED` → 이어서 `IDLE` 가능** |
| **updated** | 2026-07-28 (김팀장 검수 PASS) |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-system-node-graph-full-reaudit.md` |
| **prompt** | `tools/kim-team-lead/reports/kim-claude-task-prompt-latest.txt` |
| **선행(재검증 대상)** | `SYSTEM_NODE_GRAPH_FULL_SYNC_20260728.md` · `HELIOS_PERSEUS_EDGE_REMOVAL_20260728.md` |

### [pss-pre-dev]

```text
[pss-pre-dev] hot_path=galaxy_graph_gen·부트 · alloc=프리컴퓨트1회 · cache=GALAXY_SYSTEMS_PRECOMPUTED
[pss-pre-dev] stage=worldmap+territorial · risk=P1·이중그래프
[pss-pre-dev] verdict=PASS — CSV=지도 플레이엣지 일치·숏컷/비대칭 수정·틱금지
```

### 재검증 결론 — 김팀장 초안 주장 5개 전부 **실측 확인**(맹신 없이 재검증)

| 초안 주장 | 재검증 방법 | 결과 |
|-----------|-------------|------|
| helios↔perseus 직접 엣지 삭제 | `audit-system-connections-full.mjs` `heliosPerseusDirect` | **false**(없음) 확인 |
| draco↔sirius 대칭 | 동일 audit `asymmetricPlanets`/`asymmetricGenerated` | **[]**(비대칭 0) 확인 |
| star_system_connections.csv 21성계 전량 동기 | `starCoverage.withoutStarRows` | **[]**(21개 전부 star 행 보유) 확인 |
| galaxy100 tier0 보존(플레이↔플레이 무손실) | `audit-map-vs-csv-connections.mjs` + 코드 리뷰(`capSystemGraphMaxDegree` Pass1이 tier0을 maxDegree/교차 무시하고 무조건 keep) | drop=**[]** · extra=**[]** 확인, 코드도 실제 그렇게 구현됨 |
| `sync-star-system-connections-from-planets.mjs` 신설 | 파일 존재 확인 | 존재하나 **`build:content-tables`에 미편입**(진짜 빌드 함정 잔존) — **이번 task에서 M4로 수정** |

### 구현 요약 (M0~M6)

| M | 내용 | 파일 |
|---|------|------|
| M0 | 노드 소비처 전수 표 재작성(아래 표) — 초안이 놓친 신규 소비처 2곳 추가 발견(`runPlanetEnvironmentDiversityPass.ts`) | 본 handoff 하단 표 |
| M1 | `audit-system-connections-full.mjs` + `audit-map-vs-csv-connections.mjs` 실행 — **둘 다 FAIL 없음**(수정 불필요, 초안이 이미 정상 상태로 만들어 놓음) | 변경 없음(검증만) |
| M2 | 정본 항로 5홉 엣지(헬→오메→뉴에덴→베가→드라코→페르) 전부 유효·양방향 확인, `omega_station↔draco_nebula` 정상 1홉 유지 확인 | `systemNodeGraphRegression.test.ts` 3·4번 |
| M3 | `capSystemGraphMaxDegree` tier0 보존 계약 — 코드 리뷰(Pass1 무조건 keep) + 실측(drop/extra=0) 이중 확인. 회귀 아님 — 수정 불필요 | 변경 없음(검증만) |
| M4 | **실제 수정** — `sync-star-system-connections-from-planets.mjs`를 `build:content-tables`에 편입(`patch-planets-en.mjs`·`sync-synth-ownership-into-item-defs.mjs` 이후, `build-content-from-csv.mjs` 직전 — planets.csv 최종 확정 후 star CSV 재생성 후 빌드). `build-content-from-csv.mjs`에 "star CSV는 planets 파생·수동 부분편집 금지" 1줄 주석 추가 | `package.json`(`build:content-tables` 스크립트) · `tools/content-tables/build-content-from-csv.mjs`(주석) |
| M5 | `npm run build:content-tables` + `npm run gen:galaxy-graph` 재실행 → 두 audit 재실행 **PASS**(diff 0), `npx tsc --noEmit` **PASS** | 재생성물: `star_system_connections.csv`·`csvSystems.ts`·`galaxySystems100.generated.ts`(git diff는 초안의 기존 미커밋 수정과 동일 계열 — 새 회귀 없음, 아래 확인 참고) |
| M6 | `systemNodeGraphRegression.test.ts` 7케이스: helios-perseus 직접없음, sirius-draco 대칭, 정본5홉, omega-draco 정상유지, 전역비대칭0, **tier0 drop/extra=0**(플레이↔플레이 이동=분쟁그래프 동일), star CSV 21성계 전량 | `src/galaxyMap/systemNodeGraphRegression.test.ts`(신규) |

### M0 — 노드 소비처 전수 표

| 경로 | 그래프 | 확인 |
|------|--------|------|
| `worldStore.systems`(worldmap.tsx·GalaxyMapSystemsSvg·findShortestUnlockedSystemPath) | `GALAXY_SYSTEMS_PRECOMPUTED`(galaxy100) | import 직접 확인 |
| `resolvePlanetSystemPosition.ts` / `resolvePlanetById.ts` | GALAXY 우선 + STAR 폴백(순환참조 방지 주석 명시) | 소스 확인 |
| `territorialSupplyLine.ts`(`listAdjacentSystemIds`) / `territorialCombatGraph.ts` / FrontPressure | `STAR_SYSTEMS_FROM_CSV`(csvSystems, planets.csv 파생) | import 직접 확인 |
| `worldExpansionFrontier.ts` / `worldExpansionUnlockDispatch.ts` / `worldExpansionFreshStartSeed.ts` / `coreOpenGameplayPlanets.ts` | `GAMEPLAY_SYSTEM_IDS`/`GALAXY_SYSTEMS`(월드 확장 synth 프런티어) | import 직접 확인 |
| `mineralDepositModel.ts` | `GALAXY_SYSTEMS`(좌표·자원 배치, 그래프 순회 아님) | import 직접 확인 |
| **`runPlanetEnvironmentDiversityPass.ts`**(초안 표에 없던 소비처, 이번에 발견) | `useWorldStore`(GALAXY 계열) — 현재 성계·연결 성계 주변 행성 리밸런스 | grep으로 신규 발견, GALAXY축과 일관 사용 중이라 **수정 불필요**(누락 발견만) |
| `data/systems.ts`(`STAR_SYSTEMS`) | `STAR_SYSTEMS_FROM_CSV` 단순 재노출 | 소스 확인 |

### 완료 게이트 결과

```text
audit-system-connections-full → asymmetric=0 · heliosPerseusDirect=false · planetsVsGenerated=[]
audit-map-vs-csv-connections → dropped=[] · extra=[]
정본항로 헬→오메→뉴에덴→베가→드라코→페르 = OK(엣지 5개 양방향 확인)
tsc PASS · build:content-tables 재실행(sync 스크립트 편입 후) · gen:galaxy-graph 재실행 기록 완료
build 파이프라인 star sync 편입 = **이번 task에서 완료**(이전엔 미편입 — 진짜 발견된 잔여 결함)
```

### 회귀 판별력 검증

`systemNodeGraphRegression.test.ts`의 6번(tier0 drop/extra) 테스트는 생성물(`galaxySystems100.generated.ts`)에서 `iron_cross→new_eden` tier0 엣지 하나를 일시 제거해 **FAIL**(`actual: ['iron_cross->new_eden']`) 확인 → `npm run gen:galaxy-graph` 재생성으로 복원 후 **PASS** 재확인. 트리비얼 통과 아님.

### self-check 결과

```
npx tsc --noEmit -p tsconfig.client.json                    → PASS(에러 0)
node tools/debug/audit-system-connections-full.mjs           → PASS(FAIL 없음)
node tools/debug/audit-map-vs-csv-connections.mjs             → PASS(dropped=[]·extra=[])
npx tsx --test src/galaxyMap/systemNodeGraphRegression.test.ts → PASS 7/7(신규)
npx tsx --test src/arcCore/territorial/territorialSupplyLine.test.ts → PASS(회귀, STAR_SYSTEMS 소비처 무관)
npx tsx --test src/arcCore/territorial/geoFlankHeliosTitanOccupation.test.ts → PASS(회귀)
npx tsx --test src/arcCore/territorial/territorialStackConsistency.test.ts → PASS(회귀)
```

### CSV / 기존값 변경 여부

`combatMode`/가중치 CSV **무변경**. `planets.csv`·`star_system_connections.csv`는 **초안(김팀장 이전 세션)이 이미 수정한 값 그대로**(이번 task에서 값 자체를 추가 변경하지 않음) — 이번 재실행으로 재생성된 `star_system_connections.csv`/`csvSystems.ts`/`galaxySystems100.generated.ts`의 git diff는 초안이 만든 수정과 동일 계열(helios-perseus 제거·sirius-draco 대칭·tier0 복원)이며 신규 회귀 없음(audit·unit 전부 diff 0 확인). 정상 1홉(`helios↔omega`/`omega↔draco`/`draco↔perseus` 등) **삭제 없음**. synth 배치 알고리즘 무변경. Skia/STAGE 무관.

### 참고 — 동시 진행 중인 별건 변경(무관, 미개입)

세션 중 `src/arcCore/territorial/territorialCombatGraph.ts`가 외부(김팀장/훅)에 의해 별도로 수정됨(`resolveAdjacentSystemFactionPresence`가 런타임 holds 인자를 받도록 확장 — 본 task와 무관한 territorial 판정 개선). 본 task는 이 파일을 건드리지 않았고, tsc·회귀 테스트로 상호 충돌 없음만 확인.

### 리스크 · soft(실기 미확인)

- 앱 완전 재시작 권장(초안 경고 유지) — `GALAXY_SYSTEMS_PRECOMPUTED`/`STAR_SYSTEMS` 모듈 캐시 특성상, 실기(월드맵 렌더·이동·분쟁 판정 실제 화면) 확인은 **미실시**(정적 데이터·audit·unit만).
- M4(빌드 파이프라인 편입)가 유일한 실질 코드/설정 변경 — 나머지는 초안 상태 재검증(대부분 이미 정상). 향후 `planets.csv`를 손으로 고치고 빌드를 돌리면 이제 자동으로 `star_system_connections.csv`까지 갱신되므로, "부분 3성계만 기재" 재발 가능성이 구조적으로 낮아짐.

**git commit 안 함** — 김팀장(Cursor 본창) 검수·커밋 요청.

---
## ✅ REVIEWED — ArcCore 분쟁·점령 스택 일관성·효율 최적화(M0~M4) · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-07-28 · 대표님 「김클로드 작업 끝 검수하라」)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** — READY M0~M4 충족 · 검수 중 코드 수정 없음 |
| M0 | strategy §6-3 파이프라인·P0~P4·감사 교차참조 OK |
| M1 | `DRACO_FRONT_CAMPAIGN_PLANET_ORDER` 삭제 · CSV `campaignOrder` 주석 OK · src 잔존 없음(테스트 문자열만) |
| M2 | policy/campaign revision 캐시 · `setMem` 3곳 bump · dyn Set O(1) · `invalidate` 클리어 OK |
| M3 | 시드 owner 모듈 1회 인덱스 · DEV warn 세션당 systemId 1회 · 판정 로직 무변경 OK |
| M4 | `territorialStackConsistency` 6/6 PASS · P0 resolver 회귀 10/10 PASS |
| CSV | 본 task 수치/가중치 **무변경**(helios/titan CSV diff는 직전 geo-flank 미커밋) |
| 게이트 | `tsc` PASS · unit PASS |
| 커밋 | **미커밋** — 대표님 지시 시 김팀장 커밋 |
| soft | M5 미착수(지시 범위) · 실기 힙/CPU 미프로파일 · warn Set 모듈 전역(로그용만) |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED`** |
| **updated** | 2026-07-28 (김팀장 검수) · 2026-07-28(김클로드 구현) |
| **task_id** | `territorial-stack-consistency-opt-20260728` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-territorial-stack-consistency-opt.md` |
| **audit** | `tools/kim-team-lead/reports/TERRITORIAL_STACK_CONSISTENCY_AUDIT_20260728.md` |
| **범위** | M0~M4 · **M5 미착수**(다음 회차 가능) |

### [pss-pre-dev]

```text
[pss-pre-dev] hot_path=territorial_probe_60s·pass_1h · alloc=정책목록캐시·시드인덱스1회 · cache=revision
[pss-pre-dev] stage=arcCore_territorial · risk=P1(틱전량재스캔금지)·P6(persist빈도유지)
[pss-pre-dev] verdict=PASS — 밸런스CSV수치무단변경금지·순수캐시/데드코드/문서·회귀테스트
```

**git commit 안 함** — 대표님 지시 시 김팀장 커밋.

---

## ✅ REVIEWED — 중립 점령 런타임 인접(보급) P0(M0~M5) · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-07-28 · 대표님 「검수하라」)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** — READY 핵심(중립+한쪽만 인접→우세 축) 충족 · 검수 중 코드 수정 없음 |
| M0 | strategy §6-2 · geo-flank와 충돌 시 **런타임 P0 우선** 명시 OK |
| M1 | `resolveEffectiveTerritorialCombatMode` 순수함수 · planetId 없음 · 블루만/레드만/둘다/고립 OK |
| M2 | battle 경로 attacker·binary·holdTarget·dominant 전부 `effectiveCombatMode` · meta에 policyCombatMode OK |
| M3 | blue_red 공격자 확정과 이중 충돌 없음(주석) OK |
| M4 | unit 10/10 PASS · 타이탄 CSV red_neutral+블루만→`blue_neutral` · 배선 grep OK |
| M5 | §6-2에 geo-flank=접전/고립 폴백 명시 OK |
| CSV | 본 task로 combatMode/가중치 **추가 변경 없음**(런타임 오버라이드만) |
| 게이트 | `tsc` PASS · unit PASS |
| 커밋 | **미커밋** — 대표님 지시 시 김팀장 커밋 |
| soft | 고립(둘다0)은 READY의 status_quo 강제 대신 **CSV P1 폴백**(허용 범위) · 실기 1h 미확인 · P0는 **battle 분기**에서만 적용(status_quo면 여전히 미진입) |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED`** |
| **updated** | 2026-07-28 (김팀장 검수) · 2026-07-28(김클로드 구현) |
| **task_id** | `neutral-adjacency-occupation-priority-20260728` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-neutral-adjacency-occupation-priority.md` |

### [pss-pre-dev]

```text
[pss-pre-dev] hot_path=territorial_pass_1h · alloc=보급카운트O(인접)·모드해석1회 · cache=없음
[pss-pre-dev] stage=arcCore_territorial · risk=P1(틱추가금지)·planetId하드코딩금지
[pss-pre-dev] verdict=PASS — NEUTRAL hold에서만 effectiveMode 해석·CSV행무단변경금지(런타임오버라이드)
```

### 김클로드 구현 요약 (ARCHIVE)

- M1: `resolveEffectiveTerritorialCombatMode.ts`
- M2: `runTerritorialCombatPass.ts` effective 배선
- M4: unit 10 · M0/M5 strategy §6-2

---

## ✅ REVIEWED — 계정 초기화 시 소유권 성계 중립화(M0~M5) · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-07-28 · 대표님 「클로드 김 작업 검수하라」)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** — READY M0~M5 충족 · 검수 중 코드 수정 없음 |
| M0 | 시드복원≠중립화 · 시리우스 `red_territory` · `purge_all_non_ai` 과잉 — 원인 서술 OK |
| M1 | `player_independent` → `neutral`+`neutralizedAt`+deed/home 클리어 · CSV 시드 복원 우회 OK |
| M2 | `purge_all_non_ai` → 플레이어 유래만 · 국가 시드 hold 보존(iron_remnant 테스트) OK |
| M3 | purge_account→시드파이프→purge_all_non_ai 연타 후에도 neutral 유지 OK |
| M4 | unit 6케이스 PASS · 하드코딩 grep OK · 시리우스 재구매 `red_territory` 아님 |
| M5 | dissolve 동일 중립화 · FrontPressure invalidate(occupier 변경 시) OK |
| 게이트 | `tsc` PASS · `planetHoldReleasePolicy.test.ts` PASS |
| 커밋 | **미커밋** — 대표님 지시 시 김팀장 커밋 |
| soft | 실기 미확인 · `homePlayerUid`는 uid 일치 시에만 null(정상 purge 경로 OK) · clans 맵 non-ai 삭제 범위는 별건 · nebula purge 구멍은 **본 task 범위 외**(이전 재검수 P0) |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED`** |
| **updated** | 2026-07-28 (김팀장 검수) · 2026-07-28(김클로드 구현) |
| **task_id** | `account-purge-ownership-neutralize-20260728` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-account-purge-ownership-neutralize.md` |
| **요청자** | 대표님 점검 → 김팀장 READY → 김클로드 착수 |

### [pss-pre-dev]

```text
[pss-pre-dev] hot_path=계정purge1회 · alloc=holds맵부분갱신 · cache=없음
[pss-pre-dev] stage=타이틀복귀전 · risk=P6(persist1회)·ArcCore월드축오삭제금지
[pss-pre-dev] verdict=PASS — 틱/루프추가금지·player_independent해제만·시드팩션영토진행보존
```

### 김클로드 구현 요약 (ARCHIVE)

- M1: `planetHoldReleasePolicy` 독립국→중립화
- M2: `purge_all_non_ai` 플레이어 유래만
- M4: unit 6 · M5 dissolve+FrontPressure
- 변경: `planetHoldReleasePolicy.ts` · `clanWarFoundationStore.ts` · 신규 test

---

## ✅ REVIEWED — 헬리오스·타이탄 게이트 지리 우세 점령(M0~M5) · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-07-28 · 대표님 「검수하라」)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** — READY M0~M5 충족 · 검수 중 코드 수정 없음 |
| M0 | `docs/strategy/…` §6-1 geo-flank 실구현 표(순차4·5·combatMode·지리 근거) · §6 제안과 구분 OK |
| M1 | CSV `helios_core` blue_neutral 70% order4 · `titan_ruins` red_neutral 70% order5 · omega/shadow/draco **기존행 무변경** · seeds **미변경** |
| M2 | generated 정책 2행 · `draco_front` 길이 5 · 순번 1…5 단위테스트 OK |
| M3 | 동적 `sirius_border` 첫 슬롯 **4→6** · 리셋 후 정적 길이 **5** assertion 갱신 OK |
| M4 | `geoFlankHeliosTitanOccupation.test.ts` 정책·순서·회귀·하드코딩 grep PASS |
| M5 | iron_cross→helios BLUE 보급 · shadow_nexus→titan_gate RED 보급 병행 PASS |
| 게이트 | `tsc` PASS · unit(geoFlank+seed) PASS · (김클로드 self-check: build:balance-tables · audit:memory:all) |
| 커밋 | **미커밋** — 대표님 지시 시 김팀장 커밋 |
| soft | 실기 1h territorial 체감 미확인 · 로테이션 5→6 희석(handoff 리스크 동의) · 70% 상향은 대표님 확인 후 |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED`** |
| **updated** | 2026-07-28 (김팀장 검수) · 2026-07-28(김클로드 구현) |
| **task_id** | `geo-flank-helios-titan-occupation-20260728` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-geo-flank-helios-titan-occupation.md` |
| **요청자** | 대표님 기획 → 김팀장 REFLECTABLE → 김클로드 착수 |

### [pss-pre-dev]

```text
[pss-pre-dev] hot_path=territorial_pass_1h · alloc=정책Map부트1회 · cache=policy_O1
[pss-pre-dev] stage=arcCore_territorial · risk=P1(틱추가금지)·부트동기패스금지
[pss-pre-dev] verdict=PASS — CSV행추가+로더/캠페인정렬·planetId하드코딩분기금지
```

### 김클로드 구현 요약 (ARCHIVE)

- M0: strategy §6-1 실구현 표
- M1: policy CSV +2행 (헬리오스 블루70%·타이탄 레드70%)
- M2~M4: build · 동적 order 6 · unit+하드코딩 금지
- M5: 보급 병행 2케이스
- 변경: CSV · generated · seed 테스트 · geoFlank 테스트 · strategy 문서

---

## ✅ REVIEWED — 은하 지도 플레이어 독립국 국가명 라벨 (M0~M4) · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-07-27 · 대표님 「검수하라」)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** — READY M0~M4 충족 · 검수 중 코드 수정 없음 |
| M0 | 원인=`MIN_LABEL_COMPONENT_AREA_PX2` 공용 적용 → 소형 independent skip · 단위테스트 재현 근거 OK |
| M1 | `MIN_LABEL_COMPONENT_AREA_INDEPENDENT_PX2=0` · blue/red 12_000 **유지** |
| M2 | `buildOccupationLabels` 위치식 무수정 · `TERRITORY_LABEL` 공용 유지 |
| M3 | i18n/`worldmap.tsx` 무수정 |
| M4 | unit 3케이스 PASS · import→`mapFactionSideCore` (tsx 테스트용·동작 동일) OK |
| 게이트 | `tsc` PASS · unit PASS |
| 커밋 | **미커밋** — 대표님 지시 시 김팀장 커밋 |
| soft | 실기(월드맵) 미확인 · 극소 셀에서도 라벨 표시(의도) |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED`** |
| **updated** | 2026-07-27 (김팀장 검수) · 2026-07-27(김클로드 구현) |
| **task_id** | `galaxy-map-independent-nation-label-20260727` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-galaxy-map-independent-nation-label.md` |

### [pss-pre-dev]
```
[pss-pre-dev] hot_path=worldmap_useMemo_1회 · alloc=라벨배열N개상한 · cache=voronoi모델기존
[pss-pre-dev] stage=galaxy_map · risk=P1(틱금지)·P3(memo deps)
[pss-pre-dev] verdict=PASS — 렌더/틱 신규루프금지·기존 occupationLabels 파이프라인확장만
```

---

## 📦 ARCHIVE — 김클로드 원문 (독립국 국가명 라벨 · status→REVIEWED)

| 필드 | 값 |
|------|-----|
| **status** | ~~PENDING~~ → **REVIEWED** (상단 참조) |
| **updated** | 2026-07-27 (김클로드) |
| **task_id** | `galaxy-map-independent-nation-label-20260727` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-galaxy-map-independent-nation-label.md` |

### M0~M4 요약 (김클로드)
- M0: 면적 게이트로 independent 1성계 skip
- M1: independent만 하한 0
- M2~M3: 위치·폰트·i18n 기존 유지
- M4: unit 3 + mapFactionSideCore import

---

## ✅ REVIEWED — 아크코어 수송선단 체류 튕김·부자연 회전 (M0~M4) · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-07-27 · 대표님 「검수하라」)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** — READY M0~M2·M4 충족 · M3 미착수(허용) · 검수 중 코드 수정 없음 |
| M0 | `publishSnapshot`의 `orbitAngleRad+=`·`readPlanetOrbitClockMs` 제거 · worklet 단일 적분 |
| M1 | dwelling 반경 재할당 삭제 · entering 시작 시 `orbitRadiusPx`/`orbitAngleRad` 확정 |
| M2 | `orbitAng += (phaseEl0+dt)*rate` · unit 3케이스 PASS(재-pack 연속) |
| M3 | 타원 각속도 — **미착수**(선택·기존값 재확인 대상) OK |
| M4 | AiNpc / worklets / SkiaLayer 계약 주석 OK |
| 게이트 | `tsc` PASS · unit PASS · `audit:worklet-contract` PASS |
| 커밋 | **미커밋** — 대표님 지시 시 김팀장 커밋 |
| soft | 실기 30초+ 미확인 · wall(`phaseElapsedSec`) vs orbit SharedValue(`dt`) 잔여 드리프트 가능 · M3 후속 |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED`** |
| **updated** | 2026-07-27 (김팀장 검수) · 2026-07-27(김클로드 구현) |
| **task_id** | `arc-transport-dwell-jank-20260727` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-arc-transport-dwell-jank.md` |

### [pss-pre-dev]
```
[pss-pre-dev] hot_path=orbit_worklet_60fps·snapshot_0.25s · alloc=flat재팩시점만 · cache=arcPackSig
[pss-pre-dev] stage=planet_hub_orbit · risk=P1(이중적분)·P3(전함재팩동기화)
[pss-pre-dev] verdict=PASS — 틱당 신규할당금지·sync/적분 단일화만
```

---

## 📦 ARCHIVE — 김클로드 원문 (수송 체류 튕김 · status→REVIEWED)

| 필드 | 값 |
|------|-----|
| **status** | ~~PENDING~~ → **REVIEWED** (상단 참조) |
| **updated** | 2026-07-27 (김클로드) |
| **task_id** | `arc-transport-dwell-jank-20260727` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-arc-transport-dwell-jank.md` |

### M0~M4 요약 (김클로드)
- M0: JS 이중적분 삭제 · worklet-only
- M1: dwelling 반경 점프 제거
- M2: phaseEl 앵커 공식 + unit test
- M3: 미착수 · M4: 주석

---

## ✅ REVIEWED — 점령·중립화·소유권 후 「국가」표시 연동 (M0~M5) · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-07-27 · 대표님 「김팀장 검수시작」)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** — READY M0~M5 충족 · 검수 중 코드 수정 없음 |
| M0 | Core/글루 분리 · `resolveMapFactionSideFromClanId` 재사용 · independent=`worldmap.territory.nation.independent` |
| M1 | strip ko/en + reprefix · neutral→접두 제거 |
| M2 | `resolvePlanetTableDescription` 반환 직전 단일 주입 OK |
| M3 | C1~C7 코드추적+단위테스트 근거 수용 |
| M4 | `occupierFactionLabelKo` independent→동일 i18n 키 |
| M5 | unit 10케이스 PASS |
| P3 | Overlay `planetDescription` memo에 hold deps 추가 확인 |
| 게이트 | `tsc` PASS · unit PASS · `planets.csv` diff 없음 |
| 커밋 | **미커밋** — 대표님 지시 시 김팀장 커밋 |
| soft | 실기(시리우스) 미확인 · stage 설명에도 접두 신규 부착(의도적·되돌리기 용이) · hold 미시드 시 neutral로 접두 제거 가능(시드 파이프라인 전제) |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED`** |
| **updated** | 2026-07-27 (김팀장 검수) · 2026-07-27(김클로드 구현) |
| **task_id** | `planet-nation-display-sync-20260727` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-planet-nation-display-sync.md` |

### [pss-pre-dev]
```
[pss-pre-dev] hot_path=행성정보오버레이오픈·스냅샷1회 · alloc=문자열치환1회 · cache=hold키미사용금지
[pss-pre-dev] stage=dispose불필요(순수표시) · risk=P3(설명memo시hold미포함)·P1(틱경로금지)
[pss-pre-dev] verdict=PASS — CSV기존값불변·런타임접두만재작성·틱/persist추가금지
```

---

## 📦 ARCHIVE — 김클로드 원문 (국가 표시 연동 · status→REVIEWED)

| 필드 | 값 |
|------|-----|
| **status** | ~~PENDING~~ → **REVIEWED** (상단 참조) |
| **updated** | 2026-07-27 (김클로드) |
| **task_id** | `planet-nation-display-sync-20260727` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-planet-nation-display-sync.md` |
| **요청자** | 대표님 — 시리우스 점령→중립화→소유권 구매 후 국경 OK · 행성정보 `[국가:…]` CSV 고정 |

### M0~M5 요약 (김클로드)

- M0~M1: `resolvePlanetRuntimeNationDisplay(Core)` · strip/reprefix
- M2: `resolvePlanetTableDescription` 단일 주입
- M3~M4: C1~C7 · 점유 팩션 independent 라벨 정렬 · Overlay hold deps
- M5: unit 10 PASS · csv 무수정 · commit 안 함

---

## ✅ REVIEWED — 허브 10초 리스폰 삭제 · 30분 재개대기 범용 (M0~M4) · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-07-27)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** — ready M0~M4 충족 · 검수 중 소수정정 1건 |
| M0 | `RESPAWN_DELAY`·`respawnDestroyedAgents`·스케줄 전량 삭제 · repo 잔존 grep 0 |
| M1 | 블루 승+플레이어 참전 시 `markWaveCombatVictoryCooldown` · 30분 상수 유지 |
| M2 | `enemyFleetEntered`에 `!isWaveCombatCooldownActive` · 진행 중 웨이브는 게이트 밖 |
| M3 | 웨이브 정합 코드 추적 OK · 실기 soft |
| M4 | 스토어·컨트롤러 헤더 계약 주석 OK |
| **검수 수정** | 웨이브 **중간** 클리어마다 mark → 패배해도 30분 잔존 위험 → **허브·최종웨이브만** mark |
| 게이트 | `tsc` PASS · `audit:memory:all` PASS |
| 커밋 | **미커밋** — 대표님 지시 시 김팀장 커밋 |
| soft | 실기(드라코) 미확인 · `respawnAtWallRef` 필드 잔존(항상 null) |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED`** |
| **updated** | 2026-07-27 (김팀장 검수) · 2026-07-27(김클로드 구현) |
| **task_id** | `hub-combat-cooldown-universal-20260727` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-hub-combat-cooldown-universal.md` |

### [pss-pre-dev]
```
[pss-pre-dev] hot_path=교전종료1회·쿨다운조회sync · alloc=틱당리스폰예약금지 · cache=waveCombatCooldown_O1_Map
[pss-pre-dev] stage=planet_hub_combat·account_purge연동유지 · risk=P1(틱할당금지)·P6(persist저빈도)
[pss-pre-dev] verdict=PASS — 10초 리스폰 루프 제거·쿨다운은 이벤트1회 mark만
```

---

## 📦 ARCHIVE — 김클로드 원문 (허브 쿨다운 · status→REVIEWED)

| 필드 | 값 |
|------|-----|
| **status** | ~~PENDING~~ → **REVIEWED** (상단 참조) |
| **updated** | 2026-07-27 (김클로드) |
| **task_id** | `hub-combat-cooldown-universal-20260727` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-hub-combat-cooldown-universal.md` |

### M0~M4 요약 (김클로드)

- M0: RESPAWN 10초·`respawnDestroyedAgents` 삭제 · resume도 null 고정
- M1: 허브 블루 승+플레이어 mark (검수에서 최종웨이브 게이트 추가)
- M2: `enemyFleetEntered` 쿨다운 게이트
- M3~M4: 웨이브 정합·주석
- 패배 쿨다운: 미확장(승리만)

---

## ✅ REVIEWED — 전선 압박(FrontPressure)·공격 전술 자동전환 (M0~M6) · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-07-26 · 대표님 「끝나면 자동 검수」)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** — ready M0~M6 충족 · 코드 수정 없음 |
| M0 | 독립국·blue_red 양쪽 supply mul 전달 · 시리우스형/공격자 보급 단위 테스트 OK |
| M1 | `arc_core_front_pressure_policy.csv` + generated + loader · territorial policy **무수정** |
| M2~M3 | `frontPressureIndex` O(1) 캐시 · holds 인자 주입(RN 비의존) · invalidate 2경로 · planetId 하드코딩 없음 |
| M4 | `isTerritorialPassDueForPlanet` + window 카운터 bounded · aggressive→2 · 캠페인 미적용(허용) |
| M5 | supply/battleWeight aggressive 가산 · cap 존중 |
| M6 | `FRONT_PRESSURE_TACTICS_v0.md` OK |
| M7 | 미착수(선택·명시 OK) |
| 게이트 | `tsc` PASS · `audit:memory:all` PASS · unit tests PASS |
| 커밋 | **미커밋** — 대표님 지시 시 김팀장 커밋 |
| soft | invalidate 일부 경로 TTL 의존 · `passIntervalMulAggressive` 미배선(CSV=1) · 실기 미확인 |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED`** |
| **updated** | 2026-07-26 (김팀장 검수) · 2026-07-26(김클로드 구현) |
| **task_id** | `front-pressure-tactics-20260726` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-front-pressure-tactics.md` |

### [pss-pre-dev]
```
[pss-pre-dev] hot_path=holds변경1회·territorial_pass게이트 · alloc=틱당금지·dirty성계만 · cache=FrontPressure_O1_Map
[pss-pre-dev] stage=월드축(ArcCore)·purge분류명시 · risk=P1(틱금지)·P3(holds invalidate)
[pss-pre-dev] verdict=PASS — 60s probe에서 전은하 재스캔 금지·자세는 이벤트 재계산만
```

---

## 📦 ARCHIVE — 김클로드 원문 (FrontPressure · status→REVIEWED)

| 필드 | 값 |
|------|-----|
| **status** | ~~PENDING~~ → **REVIEWED** (상단 참조) |
| **updated** | 2026-07-26 (김클로드) |
| **task_id** | `front-pressure-tactics-20260726` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-front-pressure-tactics.md` |
| **문서** | `docs/strategy/FRONT_PRESSURE_TACTICS_v0.md`(M6 신규) · `docs/strategy/ARC_CORE_TACTICAL_AUTOMATION_AND_GALAXY_STRATEGY.md`(교차) |
| **요청자** | 대표님 「김클로드가 개발」→ 김팀장 배정 → "@김클로드 ... M0~M6 구현" |

### [pss-pre-dev]

```text
[pss-pre-dev] hot_path=holds변경1회·territorial_pass게이트 · alloc=틱당금지·dirty성계만 · cache=FrontPressure_O1_Map
[pss-pre-dev] stage=월드축(ArcCore)·purge분류명시 · risk=P1(틱금지)·P3(holds invalidate)
[pss-pre-dev] verdict=PASS — 60s probe에서 전은하 재스캔 금지·자세는 이벤트 재계산만
```

### M0 — 보급 mul 배선 검증: **이미 정상, 갭 없음**

`resolveTerritorialQuickCombat`가 일반·독립국 경로 모두 supply 전달 — 누락 없음. 시리우스형 고립·공격자 보급 단위 테스트 추가.

### M1 — Table-First

`tables/balance/arc_core_front_pressure_policy.csv` → generated + `arcCoreFrontPressurePolicy.ts`. 기존 territorial combat policy **무수정**.

### M2~M3 — FrontPressure 모듈

`frontPressureIndex.ts` — holds 주입·캐시·invalidate(`applyArcCoreTerritorialHold`·`claimPlanetOwnershipByPurchase`).

### M4 — battlesPerInterval

창 단위 카운터 · aggressive=2 · 캠페인 그룹 미적용.

### M5 — 보급 연동

aggressive 시 defender supply·battleWeight 가산(캡 존중).

### M6 — 문서

`docs/strategy/FRONT_PRESSURE_TACTICS_v0.md`.

### M7 — **미착수** (선택·명시)

### self-check (김클로드)

- [x] tsc · audit:memory:all · build:balance-tables · unit tests · commit 안 함

### 리스크·주의 (김클로드)

invalidate 일부 경로 TTL 의존 · 캠페인 battlesPerInterval 미적용 · 실기 미확인.

---

## ✅ REVIEWED — 아크코어 판테온 12좌 · 잔해 유물 (M1~M6) · 김클로드

### 김팀장 검수 (본창 Cursor · 2026-07-24 ~23:05 KST)

| 항목 | 결과 |
|------|------|
| **verdict** | **PASS** — ready M1~M6 충족 · 검수 중 소수정정 2건 |
| M1 | world_nodes 13 · relics 12 · item_defs `relic_seat_*` · registry O(1) Map OK |
| M2 | Trade 미등록 · Attack 등록·`onWallTick` 없음 · displayName 신명 12 · 등록 수 12 |
| M3 | salvage 5% · 미해금 좌만 · 인벤+unlockGod+alert · 실행 1회 |
| M4 | codex store · purge · backup keys · hydrate OK |
| M5 | `relicLore` overlay · trade 탭(unsellable) 열람 · 맵 비노출 · 선택 도감 패널 생략(허용) |
| M6 | stub만 — **검수 수정**: 도감 해금≠전점유 오판 → `return false` 고정 |
| 기타 수정 | `ArcCoreAttackSubCore` 「미등록」주석 정정 |
| 게이트 | `tsc` PASS · `audit:memory:all` PASS (재실행) |
| 커밋 | **미커밋** — 대표님 지시 시 김팀장 커밋 |
| soft | `allowedPlanetPool`/`dropWeight` CSV 미강제(MVP) · 실기 salvage 미확인 |

| 필드 | 값 |
|------|-----|
| **status** | **`REVIEWED`** |
| **updated** | 2026-07-24 (김팀장 검수) · 2026-07-24(김클로드 구현) |
| **task_id** | `arc-core-pantheon-relics-20260724` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-arc-core-pantheon-relics.md` |

### [pss-pre-dev]
```
[pss-pre-dev] hot_path=salvage실행1회드롭·허브wall_tick(등록수유지) · alloc=틱당신규금지·codex는이벤트시만 · cache=world_nodes·relics_O1_Map
[pss-pre-dev] stage=planet_hub_wreck·account_purge · risk=P1(틱금지)·P6(persist코얼레싱)
[pss-pre-dev] verdict=PASS — Attack onWallTick 비활성·맵상시마커금지·전행성폴링금지
```

---

## 📦 ARCHIVE — 김클로드 원문 (판테온 · status→REVIEWED)

| 필드 | 값 |
|------|-----|
| **status** | ~~PENDING~~ → **REVIEWED** (상단 참조) |
| **updated** | 2026-07-24 (김클로드) |
| **task_id** | `arc-core-pantheon-relics-20260724` |
| **ready** | `tools/kim-team-lead/reports/kim-claude-ready-arc-core-pantheon-relics.md` |
| **기획** | `docs/ARC_CORE_SUBCORE_PANTHEON_OPTIMIZATION_PLAN.md` |
| **요청자** | 대표님 「김클로드가 해당 전체 내용 개발」→ 김팀장 배정 → "@김클로드 ... M1~M6 전체 구현" |

### [pss-pre-dev]

```text
[pss-pre-dev] hot_path=salvage실행1회드롭·허브wall_tick(등록수유지) · alloc=틱당신규금지·codex는이벤트시만 · cache=world_nodes·relics_O1_Map
[pss-pre-dev] stage=planet_hub_wreck·account_purge · risk=P1(틱금지)·P6(persist코얼레싱)
[pss-pre-dev] verdict=PASS — Attack onWallTick 비활성·맵상시마커금지·전행성폴링금지
```

### M1 — Table-First

- `tables/content/arc_core_world_nodes.csv`(신규, 13행: prime 1 + subcore 12) · `tables/content/arc_core_pantheon_relics.csv`(신규, 12행) — `npm run build:content-tables`로 `src/data/generated/csvArcCoreWorldNodes.ts`·`csvArcCorePantheonRelics.ts` 생성 확인(기존 `buildAiClanRegistry` 패턴 그대로 `build-content-from-csv.mjs`에 함수 2개 추가).
- `tables/content/item_defs.csv`에 `relic_seat_*` 12행 추가(기존 행 무수정) — `category=luxury`(기존 enum 내), `kind=misc`, `type=pantheon_relic`, `tradeable=false`·`sellable=false`·`nonRepurchase=true`(계정당 1회 확정 해금과 정합), `attrsJson={"pantheonGodId":"..."}`.
- `src/types/index.ts`에 `ArcCoreWorldNodeRow`·`ArcCorePantheonRelicRow` 타입 추가.
- 레지스트리(모듈 레벨 Map 1회, 틱당 재구성 없음): `src/arcCore/pantheon/arcCoreWorldNodeRegistry.ts`(`getArcCoreWorldNodeByGodId`/`listArcCoreSubcoreNodes`) · `arcCorePantheonRelicRegistry.ts`(`getArcCorePantheonRelicByGodId`/`getArcCorePantheonRelicByItemId`/`listArcCorePantheonRelics`).
- 외곽 배치·비문은 ready 문서 §1 표 그대로(신명 12 ↔ subCoreId ↔ systemId/planetId) — planetId/systemId 직서는 CSV·레지스트리에만 존재, `loreBodyKo`엔 성계 별칭(EN)+방위만(예: "남쪽 어딘가 '유령 에너지 벨트'") — 실 id 비노출.

### M2 — 서브코어 12개 재편

- `AiTradePortLevelPolicySubCore` — **파일 유지(삭제 안 함)**, `@deprecated` 주석 추가 + `registerDefaultArcSubCores`에서 등록 제거. 이유: `tools/memory-audit/run-resident-set-audit.cjs`가 이 파일 경로를 직접 `read()`해서 onBoot 내용을 검사하므로 삭제 시 감사 스크립트가 깨짐 — ready 문서의 "삭제 **또는** deprecated" 중 안전한 쪽 선택.
- `ArcCoreAttackSubCore` 등록 추가 — `onWallTick` **정의하지 않음**(등록 전과 동일하게 완전 inert, onBoot 정책 워밍만 기존 유지).
- `registerDefaultArcSubCores.ts` 등록 수 — Trade 제거 + Attack 추가로 **12개 그대로**(코드로 직접 카운트 확인: `registerSubCore` 호출 12줄).
- 12개 전부 `displayName` → 신명(ready §1 표) 반영: 크로노스·아레스·테미스·헤르메스·아폴론·닉스·가이아·플루토스·아테나·이리스·아스트라이아·야누스. `id`는 전부 기존 유지(코드 SubCore 물리 이전 없음, 아폴론=`arc_inbound_drone_subcore` 그대로).

### M3 — 잔해 수색 → 유물

- `src/game/planetSalvageSearch.ts` `pickSalvageLootItemId` 확장(신규 병렬 함수 아님, 기존 함수 그대로 확장) — 저확률(`RELIC_DROP_PCT=5`, ≤5% MVP 상수) 해시 판정 통과 시 `listArcCorePantheonRelics()`에서 **아직 미해금(codex 기준) 좌만** 후보로 결정적 해시 선택, 실패/전부해금이면 기존 광물 풀로 그대로 폴백.
- 판정은 salvage 버튼 `onPress` 콜백(`app/(game)/planet.tsx` 기존 핸들러) 내 **1회만** — interval/틱/전행성 스캔 없음(신규 코드 없음, 기존 단일 호출 지점 그대로 재사용).
- 획득 시 `useArcCorePantheonCodexStore.getState().unlockGod(godId, revealLevelDefault)` + `showArcAlert('유물을 회수했다', '{신명}의 흔적을 발견했다.')` — 해금 직후만 표시(재획득 없음, `unlockGod`이 이미 해금된 god는 no-op).

### M4 — `arcCorePantheonCodexStore`

- `src/arcCore/pantheon/arcCorePantheonCodexStore.ts` — AsyncStorage 키 `arcfire_arc_core_pantheon_codex_v1`. API 스펙대로 `hydrate`·`unlockGod`·`isUnlocked`·`listUnlocked`·`resetForAccountPurge`.
- persist: `unlockGod` 성공(신규 해금) 시에만 `persistLocal()` 1회 — 이미 해금된 god 재호출은 상태변경·persist 둘 다 no-op(틱 없는 저빈도 이벤트라 이 가드가 곧 코얼레싱).
- 부트 hydrate: `src/firebase/gameSaveBackup/applyLocalGameSaveSnapshot.ts`의 `reloadAllLocalGameSaveStores()`(부트·클라우드 복구 공용 경로, 기존 `useArcCoreSpyExpelledStore.loadLocal()` 바로 옆)에 추가.
- 클라우드 백업 포함: `gameSaveBackupKeys.ts`의 `PLAYER_GAME_SAVE_BACKUP_KEYS`에 키 추가(안 하면 기기 변경 시 유물 진행 소실 — 계정 귀속 요구사항과 배치돼 추가함, ready 문서에 명시는 없었으나 기존 계정귀속 스토어 전부 이 목록에 있어 동일 패턴 적용).
- `src/account/localAccountReset.ts` `purgeLocalAccountData`에 `resetForAccountPurge()` 호출 추가(계정 초기화 시 도감도 함께 리셋).

### M5 — UI (최소)

- 신규 `ArcOverlayKind: 'relicLore'` + `ArcOverlayRelicLoreEntry`(`src/ui/overlay/arcOverlayStore.ts`) + `presentRelicLoreOverlay(godNameKo, loreBodyKo)` + `RelicLoreOverlayContent.tsx`(`ArcOverlayCard` 사용, 신명·비문만 — 좌표·기술id 없음) + `ArcOverlayHost.tsx`·`tacticalOverlayRollout.ts` 배선.
- 진입점: `app/(game)/trade.tsx` `handleSell` 최상단 — 탭한 아이템이 `getArcCorePantheonRelicByItemId()`에 걸리면(= relic) 기존 판매 플로우 전부 건너뛰고 lore 오버레이만 띄우고 `return`(유물은 `tradeable=false`라 원래도 판매 대상이 아니었음 — 판매 시도 대신 열람으로 대체).
