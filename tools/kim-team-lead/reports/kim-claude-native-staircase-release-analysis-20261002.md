# 허브 체류 native heap 계단 — 해제 가능 여부 · 기존 해제 체계 분석 (2026-10-02 21:30~21:50)

```text
task_id=native-staircase-release-analysis-20261002
kind=AUDIT (앱 코드 변경 0 · 플레이 무중단 측정만)
대상=pid 9869 (대표님 아르카디아 허브 체류·채굴 중) · 연결=192.168.45.197
요청=대표님 「계단식 상승 메모리가 다시 해제 가능한지, 기존 할당·해제 관리체계 분석·대응 후 김팀장 보고」
```

## ⚠ 정정 (22:17 · R1 실측 — 대표님 홈 버튼 10초)

- 대표님 홈 10초 → 복귀: **변화 없음**(대표님 확인). 로그상 22:10:44 백그라운드 정상 감지 — `runSoftNativeReclaimPass reason=app_background` 실행 · HWUI `trimMemory(20)` · JS VM은 `TRIM_MEMORY_UI_HIDDEN` 「non-severe」로 GC 생략.
- 22:17 native **490MB**(alloc 560MB) · PSS 897MB — 21:28(473) 대비 오히려 +17.
- **아래 결론 1의 「백그라운드에서 크게 풀린다」는 철회.** 과거 views→15 큰 하락(−168~−222MB)은 짧은 백그라운드가 아닌 다른 사건(추정: 이동중 전투 STAGE 3 진입으로 허브·지도 동시 해제, 또는 장시간 백그라운드)으로 재해석 — 미확인.
- 따라서 **현 체계의 어떤 해제 경로(허브 soft/peak/combat-safe·STAGE 전환·trim·GC·짧은 백그라운드)로도 계단분은 회수되지 않음.** 확실한 회수는 프로세스 재시작뿐. → R2(소유 객체 특정)와 R3(압박 기반 대응·안전지점 재시작) 우선순위 상향.

## ⚙ 추가 조사 (22:19~22:28 · Metro CDP로 Hermes 직접 계측)

| 시험 | 결과 |
|------|------|
| 메인 런타임 `HeapProfiler.collectGarbage` | alloc 566→544MB (**−22MB**) |
| Reanimated UI 런타임 GC | 0 |
| 메인 런타임 힙 스냅샷(226MB) | self 합계 151MB 중 **`native|CodeBlock` 30,219개 = 78.3MB** · `RuntimeModule` 19,716개 4.5MB · Skia HostObject 4,032개는 158KB · `js_externalBytes` 0.8MB |
| UI 런타임 스냅샷 | 2.9MB (무관) |

해석:
- **개발 빌드 전용 상주분**: Hermes가 Metro 원문 번들을 실행 시점에 지연 컴파일 → CodeBlock이 malloc에 남고 해제 API 없음. 새 코드 경로(허브 전투·variant)를 처음 실행할 때마다 증가 → 「전투 때 계단 · 포화」와 형태 일치. **릴리스 빌드(.hbc 사전 컴파일)에는 없는 메모리**. 다만 계단 150MB 중 최대 78MB까지만 설명.
- **나머지 ≈455MB는 JS 밖 네이티브**(RN Fabric/Yoga, Skia, 폰트·HWUI CPU 등) — JS 스냅샷으로 귀속 불가.

다음 단계(대표님 협조): **Perfetto heapprofd**(API 36, 앱 debuggable 확인)를 실행 중 pid에 붙인 상태로 허브 전투 1회 → 전투 중 할당되고 해제 안 된 네이티브 메모리를 **호출 위치별**로 특정. 재시작 불필요.

## 0. 결론 (초안 · 위 정정 우선)

1. **해제 가능하다 — 단, 지금 체계에서는 「앱 백그라운드/타이틀급 전환」 때만 크게 풀린다.** 과거 기록상 views→15 전환에서 −168~−222MB. 허브↔지도 전환(STAGE dispose)으로는 거의 안 풀린다(52건 중앙값 −4MB).
2. **계단은 허브 전투(Skia 전투 화면) 단위로 생기고, 무한 누수는 아니다.** 2시간+ 세션 30건의 native 최대치가 430~580MB에서 포화. 현재 473MB는 그 범위 안.
3. **해제 체계는 「사건 기반」이고 「압박 기반」이 없다.** PSS 예산 상수(소프트 800/하드 950MB)는 정의만 있고 **읽거나 집행하는 코드 0**, 앱에 자기 PSS를 읽는 기능 없음, `restartAppAsync` 호출처 0.

## 1. 실측 (플레이 중단 없이)

| 시험 | 결과 |
|------|------|
| 1시간 추이 | native 359→423(20:59)→468→473MB · PSS 712→877MB · views 396→411~456 |
| 계단 시점 | 20:44 아르카디아→베가→… **허브 전투 포함 전환 연속**(`galaxy_departure_after_combat`, vega 자동교전) · 21:17~21:21 **draco_haven 허브 전투** |
| 인바운드 드론 8분(4회) | 회당 +10~20MB 일시 상승 후 532~535MB로 복귀 — **누적 없음** |
| `send-trim-memory RUNNING_CRITICAL` (RN이 JS VM GC 실행 확인) | −6MB (alloc 537→531) |
| Java 강제 GC (SIGUSR1) | 0MB |
| mallinfo | 할당 중 541MB > native PSS 474MB → **해제 후 미반환이 아니라 살아 있는 참조** |

## 2. 기존 해제 체계 (코드)

| 층 | 무엇을 해제 | 언제 |
|----|------------|------|
| `arcfire-native-memory` (Kotlin) | **Fresco 메모리 캐시만** `clearMemoryCaches()` | 각 reclaim 패스 deferred |
| `runPlanetHubSoftNativeReclaimPass` | Skia dodge 오버레이 해제 신호 · 전투 Path/Paint·SkPicture 프레임 무효화 · 성운 프로필 정리 · deferred Fresco | 허브 5분 주기·드론 settle |
| `runPlanetHubPostSkiaPeakReclaimPass` / CombatSafe | 전투 피크 후 1·2차 회수(90s) | 전투 orbit 종료 |
| `runStageNativeReclaimPass` / galaxy deep | GPU 레이어 해제 · Fresco · 성운 | STAGE 전환·지도 15분 |
| `nativeReclaimBootstrap` | soft + Fresco | 앱 background/foreground |
| **없음** | malloc 반환·rnskia 자원 캐시 purge·**PSS 압박 시 단계적 대응**·재시작 | — |

→ 계단분(허브 전투 Skia 상주분)은 위 패스들이 건드리는 대상 밖이거나, 전투 종료 후에도 참조가 남는다. 백그라운드/타이틀 전환에서만 풀리는 것으로 보아 **마운트된 Skia/RN 화면 계층이 쥔 자원**으로 추정(소유 객체 미특정).

## 3. 대응 (제안 · 구현은 김팀장 승인 후)

| 단계 | 내용 | 규모 |
|------|------|------|
| R1 즉시 검증 | 대표님 협조 시 홈 버튼 10초 → 복귀 1회로 현 pid의 해제량 실측(과거 −170~−220MB 재현 여부) | 0 (조작만) |
| R2 소유자 특정 | Hermes 힙 스냅샷(전투 전/후)으로 JSI SkImage/SkPicture/SkSurface 잔존 수 비교 → 허브 전투 종료 후 살아 있는 Skia 호스트 객체 특정 | 조사 |
| R3 압박 기반 해제 | 네이티브 모듈에 `getProcessPssMb()`(Debug.getPss) 추가 → 지도 유휴·비전투 시점에 PSS>800이면 「백그라운드 경로와 동일한 해제」(soft+Fresco+Skia 오버레이·백드롭 remount) 1회, >950이면 다음 안전 지점(지도·저장 완료)에서 대표님 안내 후 `restartAppAsync` | 중 · 네이티브 재빌드 · pss-pre-dev 게이트 |
| R4 허브 전투 종료 해제 | R2로 특정된 객체를 전투 orbit 종료 경로에서 명시 해제(기존 「Worklet dispose 금지」 규칙 준수 범위) | R2 이후 |

현재 위험도: 무한 누수는 아님(포화 430~580MB). 다만 PSS는 그래픽 피크와 겹치면 과거 1,178~1,443MB까지 도달한 기록이 있어 R3 우선 권고.
