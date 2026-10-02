# 최종 메모리 대응방안 — 허브 native 계단 (2026-10-02 22:35)

```text
task_id=native-staircase-final-plan-20261002
kind=PLAN (코드 0 · 구현은 본 방안 Phase 2 조건 충족 후)
pid=9869 (동일 세션)
```

```text
[pss-pre-dev] hot_path=분석만 alloc=0 cache=해당없음
[pss-pre-dev] stage=planet_hub risk=P2
[pss-pre-dev] verdict=PASS — 구현 보류 (원인 축 미분리)
```

정본 입력: `kim-claude-native-staircase-release-analysis-20261002.md` (21:50 + 22:17 정정 + 22:28 Hermes) · 김팀장 R1 실측 · logcat/mem-timeline/dumpsys.

---

## 0. 한 줄

**지금 코드를 넣지 않는다.** 계단은 실존하고 기존 회수로 안 내려가지만, 넣을 패치의 대상(누구의 몇 MB인지)이 아직 갈린다.

---

## 1. 확정 (잠금)

| # | 사실 | 근거 |
|---|---|---|
| F1 | 계단 단위는 **허브 전투(+hop)**. 인바운드 드론은 일시 상승 후 복귀 | 20:43→20:59 +64(베가 왕복+아르카디아 전투) · 21:15→21:31 +33(드라코 전투) · 드론 8분 누적 0 |
| F2 | 회수 **함수는 호출된다**. 계단분은 **안 내려간다** | `hub_combat_orbit_end` + post-peak + Fresco trim · `app_background` 22:10:44 실행 |
| F3 | **홈 10초는 무효** (김클로드 결론1 철회 수용) | Views 412→411 · Native 466→471 · PSS 832→831 |
| F4 | JS/Java GC·trim CRITICAL로는 계단 전체 불가 | trim −6 · Java GC 0 · Hermes `collectGarbage` −22 |
| F5 | mallinfo 할당 > native PSS → **살아 있는 참조** (프리리스트 누수 아님) | 김클로드 21:50 |
| F6 | 무한 누수는 아님. 2h+ 세션 native 상한 대략 430~580 | 역사 30건. 현 세션은 22:35 **512**로 상한 근처 |
| F7 | PSS 800/950 상수는 **미집행**. 유휴 재시작 가드는 **꺼짐** | `PROCESS_PSS_*` 참조 0 · `IDLE_SESSION_RESTART_ENABLED=false` |
| F8 | 950 하드실링은 **모니터 force-stop**이 이미 있음 | `start-watch-30m.ps1` |

현재(22:35~ dumpsys, 같은 pid 9869): Native **511** · PSS **863** · Views **412** · GL **24**. 전투 이후 허브 체류 중.

---

## 2. 김클로드 제안 — 항목별 최종 의견

| 제안 | 김팀장 | 이유 |
|---|---|---|
| 계단=전투 단위, 드론 비누적 | **채택** | logcat·timeline 일치. 21:28 I1 「드론 +64」는 폐기 |
| 짧은 백그라운드에서 크게 풀린다 | **기각** (김클로드 22:17 철회 수용) | R1 실측 |
| 확실한 전량 회수=프로세스 재시작뿐 | **채택** | 현 경로 전부 실패 |
| Hermes CodeBlock ~78MB = 개발 빌드 지연 컴파일 | **채택(부분 설명)** | 전투 첫 진입 계단과 형태 맞음. **릴리스 .hbc에는 없음**. 계단 150 중 최대 78만 설명 |
| Skia JS HostObject가 주범 | **기각** | 스냅샷 4,032개 **158KB** |
| 나머지 ≈455MB는 JS 밖 네이티브 | **채택** | 스냅샷으로 귀속 불가 |
| R2 전투 전후 소유자 특정 | **채택 · 선행** | JS 스냅샷만으로는 부족 → **heapprofd 또는 전투 3점 dumpsys** |
| R3 PSS 폴링 + 800 remount + 950 앱 재시작 | **기각** | 800 remount=이번 상관 축과 동일. 950은 모니터가 함. 틱 PSS 읽기는 P1 |
| R4 특정 객체만 전투 종료 해제 | **조건부 채택** | R2가 대상을 가리킨 뒤에만 |
| 전투 종료 백드롭 remount 제거 (김팀장 초안) | **보류** | 시간 상관은 있음(20:46 epoch=1, 21:21 epoch=2). 인과 미증명. HostObject 158KB와 불일치. remount 없는 22:19→22:35 +42는 CDP 스냅샷 가능성 |

김클로드 원문 §0 결론 1(「백그라운드에서 풀린다」)은 **폐기**. 문서 상단 정정만 정본.

---

## 3. 축 분리 (패치 전에 갈라야 함)

```text
native 상승 ≈ [A 개발 CodeBlock] + [B JS밖 네이티브(미특정)] + [C remount/Fresco 상관]
```

| 축 | 예상 | 코드로 지금 손대면 |
|---|---|---|
| A | Metro 지연 컴파일, 해제 API 없음 | 디버그 전용 메모리. 패치해도 릴리스에 의미 없음 |
| B | Skia C++ / Fabric / 폰트 / HWUI 등 | 대상 모르면 반쪽 패치·SIGSEGV 위험 |
| C | 전투 종료 `hubBackdropNativeRemount` | **2026-10-02 22:52 적용** — peak remount 제거. A+B는 남음. 「전체 해결」 선언 금지 |

그래서 **대응안이 아직 구현  cond를 못 넘는다.**

---

## 4. 단계 (코드는 Phase 2만)

### Phase 1 — 원인 닫기 (코드 없음 · 필수)

다음 중 **하나**. 둘 다 재시작 불필요.

1. **권장**: 실행 중 pid에 Perfetto **heapprofd**를 붙이고 허브 전투 **1회**. 전투 중 할당·미해제 스택을 호출 위치로 나눔. (김클로드 22:28)
2. **보조**: 허브 전투 직전 / `hub_combat_orbit_end` 직후 / +2분에 dumpsys 3점. remount 유무와 native Δ만  pot.

완료 조건: A/B/C 중 **어느 축이 이번 계단의 주성분인지** 숫자로 남김.

### Phase 2 — 코드 1건만 (Phase 1 이후 · 승인 후)

| Phase 1 결과 | 패치 |
|---|---|
| C가 주성분 | 전투 종료 remount만 제거 (드론과 동일). 그 외 remount/폴링 없음 |
| B가 주성분 | 해당 네이티브만 JS 스레드에서 해제. Worklet dispose 금지 · crash-fix 게이트 |
| A만 큼 | **앱 패치 없음**. 릴리스 soak로 확인 |
| 혼합 | 주성분 1축만. 2축 동시 패치 금지 |

### Phase 3 — 안전망 (Phase 2로도 950 근접 시만)

- 앱 틱에서 PSS 읽기 **금지**
- 800 remount **금지**
- 950은 모니터 유지. 앱 재시작을 넣을 거면 **지도·저장 후 안내**만. 전투 중 금지

---

## 5. 지금 운영

- 플레이 유지. 홈 실험 반복 없음
- pid 9869 PSS ~860 · 950 미만
- A-2 HOLD 유지

---

## 6. 구현 착수 조건 (이게 아니면 코드 금지)

- [ ] Phase 1이 A/B/C 주성분을 숫자로 가리킴
- [ ] 패치 1축만
- [ ] `[pss-pre-dev]` verdict=PASS (대상이 remount/해제이지 폴링이 아님)
- [ ] Skia/worklet이면 crash-fix 게이트 3줄
