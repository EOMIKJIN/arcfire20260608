# P0 — 은하계 지도 체류 중 메모리 계단 상승 (김플레이 → 김팀장 · 2026-10-08 18:40)

status: **OPEN — 김팀장 코드 조치 · 김플레이 검수** (대표님 지시 18:28: 1순위)

## 역할

- 코드 수정: **김팀장** (크래시·메모리 구조 게이트 `arcfire-crash-fix-structural-gate` · `[pss-pre-dev]` 3줄 선행)
- 검수: **김플레이** — diff 계약 검수 · 같은 재현 경로 실기 재측 · logcat
- 김경제: 수정 반영 후 `mem-post-dev-recheck`

## 실측 (pid 14101 · 디버그 빌드 · SDK 54 · 같은 프로세스 6시간+)

mem-timeline (`tools/long-run-monitor/logs/mem-timeline.csv`):

| 시각 | PSS MB | GL MB | Native Heap 추정 | Views | 위치 |
|---|---|---|---|---|---|
| 16:10 | 752.9 | 55.9 | (기준) | 375 | 허브 |
| 16:26 | 781.4 | 71.4 | +100 | 375 | 허브 · GL_SPIKE |
| 16:42 | 807.7 | 60.6 | +292 | 407 | 허브 |
| 16:58 | 860.9 | 68.2 | +332 | 360 | 허브 |
| 17:14 | 808.6 | 52.5 | +307 | 360 | 허브 |
| **17:30** | **1388.8** | **179.1** | **+757** | 197 | **은하계 지도** (17:27:54 진입 후 무조작) |
| 17:46 / 18:02 / 18:18 | 1398 / 1375 / 1371 | 179.1 | 유지 | 200 | 은하계 지도 무조작 |

18:27~18:28 직접 측정 (20초 간격 4회): TOTAL PSS ≈ 1,405~1,409MB · **Native Heap 768.0 → 769.2MB (분당 약 +1.2MB 계속 증가)** · GL mtrack 183.5MB 고정 · Hermes 72~80MB 고정(JS 힙 아님 → **네이티브/GL 축**).

증거 파일: `tools/play-bot-console/logs/sdk54-upgrade/meminfo-galaxy-leak-20261008-1835.txt` · `gfxinfo-galaxy-leak-20261008-1835.txt` · `sdk54-device.txt`

## 계단이 생긴 순간 (17:27:30~17:27:54 빠른 왕복)

```
17:27:30 planet_main_stage_hub disposed → galaxy_map mount (synth_052_p 출발)
17:27:37 transit_hop_start synth_052 → arcadia
17:27:43 system_change synth_073
17:27:49 galaxy_map disposed → planet_main_stage_hub mount (arcadia_prime 착륙 · PLAY_VERB land)
17:27:53 departure_preflight arcadia_prime   ← 허브 체류 약 5초
17:27:54 planet_main_stage_hub disposed → galaxy_map mount
이후 무조작 · galaxy_map_periodic(_deep) reclaim 5분마다 실행되지만 PSS·GL 회수 없음
```

→ 허브 진입 직후 약 5초 만에 재출발한 경로에서 **약 +450MB 네이티브 + GL +127MB가 회수되지 않고 남음**. 그 전 16:26~17:14 허브 체류 중에도 네이티브가 +300MB 쌓임(인바운드 드론 70초 주기 반복 · 매번 `backdropRemount peak skip`).

## 핵심 단서 — 은하계 지도에서 전투 시뮬 루프가 계속 돎

- `[combat-hitch]` 로그는 `src/components/planet/PlanetEdenRaidTestLayer.tsx:4059` **전투 sim rAF 루프 안에서만** 찍힘.
- 은하계 지도 무조작 구간(17:28~18:28)에도 **분당 약 420~460회** 계속 찍힘 (gcΔ 동반). 16:33~16:36 은하계 지도 체류 3분에도 130회.
- 전투 렌더러 JSX 마운트처는 `combat.tsx` · `planetCapitalCombatHeavyUi.tsx`(허브) 두 곳뿐이고, 허브→은하계 지도는 `router.replace` + `freezeOnBlur`.
- 즉 **허브 dispose 후에도 전투 sim 루프(및 그 클로저가 잡은 agents·missiles·Skia 리소스)가 살아 있음** 이 가장 유력. GL 179MB 고정·네이티브 지속 증가와 일치.

검증 요청(코드 전):
1. 은하계 지도에서 살아 있는 루프가 어느 마운트 인스턴스인지 — `usePlanetEdenRaidSim` 효과에 마운트 id를 붙여 `[combat-hitch]`에 함께 찍어 확인.
2. 허브 5초 체류 후 출발 경로에서 `haltForGalaxyDeparture` · 효과 cleanup(`cancelAnimationFrame`) 순서가 보장되는지. 루프 본문의 `combatOrbitPostStepRef.current?.()` 이후 `raf = requestAnimationFrame(loop)` 재예약이 cleanup 뒤에 일어날 수 있는지(halted·disposed 플래그 없이 raf id만 취소).
3. 허브 화면이 실제로 언마운트되는지(`freezeOnBlur`로 얼려진 채 남는지) — Views 375→197은 줄었으나 sim 루프는 화면 언마운트와 별개로 살아날 수 있음.
4. 인바운드 드론 반복 시 `backdropRemount peak skip`이 매번 skip되는 게 의도인지(허브 체류 중 +300MB 누적 축).

## 19:35 김플레이 실시간 검수 1차 — SVG 비트맵 패치 **FAIL** (김팀장 수정 요청)

패치(`patches/react-native-svg+15.12.1.patch`)는 APK dex에 들어간 것 확인(`classes5.dex`: `mBitmapDirty` · `ensureBitmap`). 새 프로세스 pid 7521 (19:07 설치).

30초 샘플 (`tools/play-bot-console/logs/sdk54-upgrade/p0-recheck-mem.csv`):

| 시각 | 위치 | PSS | Native | GL | Views |
|---|---|---:|---:|---:|---:|
| 19:12:32 | 허브 (직후 galaxy_map mount 19:12:32) | 717 | 368 | 28 | 387 |
| **19:13:03** | 은하계 지도 30초 | **1275** | **807** | 28 | 177 |
| 19:13~19:28 | 은하계 지도 무조작 17분 | 1254~1287 | 803~836 | 28 | 177~180 |
| 19:29:21 | galaxy_map disposed → 허브 | | | | |
| 19:30~19:32 | 허브 | 724~744 | 374~394 | 28~43 | 394~446 |

판정:
- 기준(허브 대비 native +88MB 안팎) **FAIL** — 진입 **30초 안에 +438MB**(≈ 88MB × 5장). 패치 전(17:27 +450MB)과 같은 크기.
- 지도 체류 중 추가 증가는 없음(평탄) · **지도를 나가면 회수됨**(native 394) → 누수가 아니라 **지도 진입 순간 큰 할당 5장**.
- 즉 원인은 「같은 크기 재그리기마다 새 비트맵」이 아님. 진입 직후 레이아웃 동안 **SvgView 크기가 여러 번 바뀌어 크기 불일치 경로로 새 비트맵을 연속 할당**하거나(이전 것은 recycle 돼도 scudo secondary 캐시에 상주), **SvgView가 여러 개**이거나, 한 번 그리기 안에서 레이어 할당이 있는 쪽을 의심.
- GL은 이번엔 28MB 그대로(패치 전 +127MB) — GL 축은 개선됨.
- 은하계 지도 `[combat-hitch]` **0건**(이번 프로세스 허브·지도 모두). 이전 프로세스의 지도 내 전투 루프는 재현 안 됨 → 계속 관찰.

김팀장 수정 요청:
1. `ensureBitmap` 할당 경로에 개발 빌드 한정 로그(크기·할당 횟수·SvgView 인스턴스 id)를 넣어 진입 30초 동안 몇 번, 어떤 크기로 `drawOutput`이 불리는지 확정.
2. 확인 결과가 「크기 여러 번 변경」이면 최종 크기 확정 전에는 그리지 않게(레이아웃 안정 후 1회) · 「인스턴스 여러 개」면 마운트 지점 정리.
3. 근본적으로 4598×5034 ARGB 1장 88MB 자체가 출시 메모리 기준에 큼 → 래스터 배율·타일링·Skia 경로 등 축소안 별도 검토(대표님 확인 필요한 기존값 변경이면 사전 질의).

추가 관찰: 허브 Views **461(19:10)·450(19:11)** — 새로 켠 허브에서 실패 기준(≥450) 도달. 오전 허브 389. 오버레이 하단 보정 diff 영향 여부 확인 요청.

### 19:45 재현 경로 1~4단계 결과 (pid 7521)

| 단계 | 결과 |
|---|---|
| 1 허브 4분 · 드론 3회 | native 374~394 평탄 · combat-hitch 0 · Views 394~446 → PASS(단기) |
| 2 지도 진입 19:33:46 | native 394 → 857 (**+463**) · 재현 확정 → FAIL 유지 |
| 3 착륙 → 6초 내 재출발 19:34:20~26 | 추가 계단 없음(852) → PASS |
| 4 지도 무조작 10분 19:34~19:44 | native 835~879 톱니(±30MB)·추세 없음(852→837) · GL 28 고정 · combat-hitch 0 · FATAL 0 → 누적 PASS |

남은 P0 = **지도 진입 시 +440~460MB 일괄 할당 1건**. 무조작 지도에서 ±30MB 톱니가 있음 → 지도가 idle 중에도 주기적으로 큰 할당·해제를 함(재그리기 여부 함께 확인 요청).

## 19:50 김팀장 조치 — 그룹 opacity 전체 비트맵 제거

판정 동의. SvgView 같은 크기 재사용은 진입 5장을 막지 못했다. 5장은 재그리기 누수가 아니라 **지도가 떠 있는 동안 살아있는 전체 크기 비트맵**이다.

원인: `react-native-svg` `GroupView`/`TextView`는 `opacity ≠ 1`이면 `canvas` 전체(4598×5034 ARGB ≈ 88MB)를 `mLayerBitmap`으로 들고, 다시 그릴 때 `recycle`+`createBitmap` 한다. 성계 라벨 `SvgText opacity={0.95|0.75}`, 흐린 노드 `<G opacity>`, 점령 국가명 `opacity={0.7}`가 그 경로다. 개방 성계 라벨 4개 + 루트 1장 ≈ +440MB. 지도를 나가면 뷰와 함께 회수되는 것과 맞다.

수정 (JS만 · 래스터 배율 1 유지):
- `GalaxyMapSystemsSvg` — 노드 `G`/`SvgText` opacity 제거, 같은 농도를 fill/stroke 알파로
- `GalaxyMapTerritoryOccupationLabelsSvg` — 국가명 opacity 제거, fill/stroke 알파로
- 선·별빛 `Path opacity`는 `RenderableView` 페인트 알파라 비트맵을 만들지 않아 유지

기대: 지도 진입 native는 루트 SvgView 1장(약 +88MB)만. 라벨이 늘어도 88MB가 더 쌓이지 않음. idle 톱니(레이어 recycle/create)도 이 경로에서는 사라져야 함.

허브 Views 450~461은 이 비트맵 수정과 별개. 이번 패치에서 뷰를 더 만들지 않음. 재측 때 허브 Views를 같이 적어 주면 이어서 본다.

재측: Metro `r` (네이티브 재빌드 불필요). 허브 → 지도 30초 native Δ, 지도 이탈 후 회수, 무조작 10분 톱니.

## 20:27 김팀장 실측 — 5장 할당 **해소** (pid 12451)

대표님 6단계 진행. 샘플 `p0-recheck-mem.csv` (GL 정본) · 단계 시각은 `sdk54-device.txt`.

| 구간 | 시각 | PSS | Native | GL | Views |
|---|---|---:|---:|---:|---:|
| 허브 (드론 구간, 19:59 기동) | 20:03:00 | 664 | 350 | 28 | 334 |
| 지도 진입 20초 | 20:03:32 | 830 | 376 | 28 | 180 |
| 지도 무조작 | 20:03~20:25 | 804~857 | 361~398 | 28 | 178 |
| 나갔다가 재진입 | 20:25:37~20:27:11 | 851~886 | 373~410 | 28 | 178 |

- 진입 native **+26** (이전 FAIL **+463**). GL은 허브와 같이 28.
- 20:03:38 착륙 → 20:03:45 재출발. 추가 계단 없음.
- 재진입도 native가 같은 톱니 안. 5장으로 다시 쌓이지 않음.
- pid 12451 `[combat-hitch]` 19:00~20:30 **0건**.
- 성계 이름·점령 라벨은 대표님 육안 확인(이상 보고 없음).

판정: 지도 진입 5장(+440MB) P0는 이번 실측에서 재발하지 않음. 지도에 있는 동안 PSS는 허브보다 약 +170 높고, 그건 체류 22분 동안 더 오르지 않음.

## 김플레이 검수 기준 (PASS 조건)

- 정적: `npx tsc --noEmit -p tsconfig.client.json` · `npm run audit:skia-memory` · `npm run audit:worklet-contract` · `npm run audit:memory:all`
- 실기 재현 경로: **허브 체류(인바운드 드론 2~3회) → 출발 → 다른 행성 착륙 → 5초 내 재출발 → 은하계 지도 무조작 15분**
  - 은하계 지도에서 `[combat-hitch]` **0건**
  - 은하계 지도 진입 후 GL mtrack이 허브 대비 **회수(Δ ±15MB)** · PSS floor 상승 **≤ +25MB** · Native Heap 분당 증가 없음
  - FATAL 0
- 앱은 지금 상태(1.4GB)를 증거로 유지 중. 김팀장이 추가 스냅샷이 필요 없으면 수정 반영 전 앱 완전 재시작 후 재측.
