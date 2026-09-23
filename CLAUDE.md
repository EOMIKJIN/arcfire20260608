# Arcfire Online — 김클로드 온보딩 (개요만)

> **김클로드** = Anthropic **Claude Code** (Cursor ✱ 패널 · 터미널 `claude`). 팀 호출: `@김클로드` · 「김클로드」

React Native · Expo · Firebase **싱글플레이** 우주 전략. 상세 헌법은 필요할 때 `@AGENTS.md` · `@.cursor/rules/Arcfire_Master_Spec_v4.0-*.mdc` 참조.

## 사용자 호칭 (2026-07-05~)

**사용자 = 「대표님」** — handoff·작업 요약·안내 시 **대표님**으로 호칭. 정본: `@.cursor/rules/arcfire-user-addressing.mdc`

## 🚨 김팀장 최종 승인 (필수 · 2026-07-04~)

**김클로드는 초안·구현 보조만.** **git commit · merge · 「완료」 선언 금지.**

작업 종료 시:

1. `tools/kim-team-lead/reports/kim-claude-handoff-pending.md` 갱신
2. **status → `PENDING`**
3. 작업 요약 · 변경 파일 · self-check · 리스크 기록
4. 사용자에게 **「김팀장(Cursor 본창) 검수 요청」** 안내

김팀장이 diff·audit·계약 재검수 후 **유일하게 커밋**한다. handoff **verdict** 기록 후 status `REVIEWED` → `IDLE`.

## 🔎 김팀장 지시 재검수 (필수 · 2026-08-02~)

**김클로드는 김팀장의 분석·원인 진단·READY 지시를 그대로 받아쓰지 않는다.** 구현 착수 전 해당 분석의 전제·원인을 코드/로그로 직접 재검수하고, 맞으면 근거와 함께 진행 · 틀리거나 부분적이면 handoff에 정정 사유를 남기고 정정된 방향으로 진행한다. AGREE/PARTIAL/DISAGREE 판정과 근거(파일:줄 또는 로그 인용)를 handoff에 기록.

- 김팀장이 이미 작성·수정한(미커밋 포함) 코드도 예외 아님 — 그 코드가 이번 작업의 전제라면 동일하게 재검수 대상.
- 재검수 결과 원인이 달랐던 실제 사례(2026-08-02): GPU `onRelease` "release no-op"은 재조사 결과 무해한 진단 계측이었음(dispose 실주입 시 과거 SIGSEGV 재현 위험) · worldmap 이동 버그는 김팀장이 다른 문제 대응으로 추가한 신규 코드(`!landed→강제 허브 복귀` 등)가 오히려 근본 원인이었음.
- 재검수만으로 원인이 안 잡히면 실기 로그(adb logcat 등)까지 직접 확인 후 결론 — 추측으로 "동의" 선언 금지.

## 이게 뭔지 (3줄)

- 로컬 ArcCore가 세계·경제·전투·AI 트래픽 처리. Firestore는 **유저 프로필 단발 read/write**만.
- 화면은 STAGE 1(행성 허브) → 2(은하 지도) → 3(전투). 전환 시 **이전 STAGE 자원 dispose 필수**.
- 데이터는 **CSV Table-First** (`tables/`). 코드에 하드코딩 금지.

## 작업 전 필수 (1순위)

**기능·수정 전 메모리/PSS 리스크 먼저.** STAGE 이탈 dispose · Skia 루프 할당 · tick/persist/부트 동기 실행 여부 확인 후 코딩.  
self-check: `npx tsc --noEmit -p tsconfig.client.json` · Skia 변경 시 `npm run audit:skia-memory`.

## 절대 금지 (Top 5)

1. STAGE 전환 `navigate()` — **`replace()`만**
2. Firestore `onSnapshot` · 실시간 멀티플레이 동기화
3. Skia 프레임 루프에서 `Make()`/`Paint()` · Path `.map()` · Worklet dispose
4. 경제/AABS **고빈도** 실행 — **일 1회** `runArcCoreDailyOpsBatch()` (12:00 KST)
5. Stage 1 레이아웃 상수 임의 변경 (`planetMainStageLayout.ts`)

## 착수 대기 작업 (READY)

| 착수 대기 작업 | handoff | 명세 |
|------|---------|------|
| ~~이동중 전투 Skia 배경 구현+자가검수~~ **REVIEWED PARTIAL** | 정본=`kim-team-lead-transit-backdrop-review-20260916.md` | task_id=`transit-combat-skia-backdrop-fix-20260916` · 구름 풀캔버스 수용 · 헤더 `TF.panelBg` · 크래시 P0 해제 · **재구현 금지** · 베가 TEMP 강제 조우 **해제** · 실기 후 커밋 |
| ~~웨이브 전투 FPS 저하 독립 분석~~ **HOLD (2026-09-18)** | 정본=`HOLD_WAVE_COMBAT_FPS_20260918.md` · 분석=`kim-claude-wave-combat-fps-analysis-20260914.md` | task_id=`wave-combat-fps-improve-20260918` · **별도 관리** · 재지시 전 전투 틱·Skia 패치 **금지** · 1안=기록 Zero-Alloc |
| **인게임 대사창 헤더·하단 크롬 정리 (P0)** | `tools/kim-team-lead/reports/kim-claude-ready-ingame-narrative-dialog-chrome-20260820.md` | task_id=`ingame-narrative-dialog-chrome-20260820` · 바 빗살 헤더 실측 · 하단 흰색 · 미실측 +20 · **commit 금지** · 김팀장 검수만 |
| ~~아크코어 대화 에이전트 기획 공동 검수~~ **REVIEWED** | `kim-claude-handoff-pending.md` 상단 | task_id=`arc-core-backchannel-joint-review-20260814` · 정본 v0.4 · §11 전수 **PASS** · 구현은 대표님 지시 후 |
| **인게임 NL ZERO_BILL** | `ARC_CORE_CHAT_ZERO_BILL_REDESIGN.md` | 종량 $0 강제 · Bedrock LIVE 금지 · free-tier READY |
| **Free-tier NL 연동 (Groq Free+Lambda)** | `READY_ARC_CORE_CHAT_FREE_TIER_NL.md` · `ARC_CORE_CHAT_GROQ_FREE_LAMBDA_OPS.md` | 코드 반영 · **sam deploy+URL+LIVE** 후 인게임 NL |
| ~~인게임 아크코어 NL 전면 HOLD~~ | `ARC_CORE_CHAT_INGAME_NL_HOLD.md` | **개정** = 종량만 HOLD (`HOLD_METERED_ONLY`) |
| **경제 금고 5축 고도화 (A 중립·B 독립+purge 중립)** | `tools/kim-team-lead/reports/kim-claude-ready-economy-vault-5axis-upgrade.md` | task_id=`economy-vault-5axis-upgrade-20260804` · 분석=`docs/economy-evaluation/2026-08-04-vault-5axis-reaudit.md` |
| **김팀장 전체 재검수 공유 → rework boot/warp** | `kim-claude-share-full-reaudit-20260804.md` + `kim-claude-ready-rework-boot-batch-warp-20260804.md` | warp/부트 잔여 R0~R2 · task=`kim-claude-rework-boot-batch-warp-20260804` |
| 시작 화면 버튼 최소 활성 (원본 READY) | `…-title-button-min-activation-continue-prewarm.md` | **rework에 흡수** |
| **일일 배치「시작만·완료 없음」복구 (P0)** | `tools/kim-team-lead/reports/kim-claude-ready-daily-ops-batch-incomplete-fix.md` | task_id=`daily-ops-batch-incomplete-fix-20260803` |
| **팩션 금고 수수료 입금 유실 (hydrate 레이스)** | `tools/kim-team-lead/reports/kim-claude-ready-faction-vault-fee-hydrate-race.md` | CONDITIONAL trade await 잔여 |
| **경제 P0/P1 (밴드 CPH · convoy)** | `tools/kim-team-lead/reports/kim-claude-ready-economy-p0-band-cph-p1-convoy.md` | task_id=`economy-p0-band-cph-p1-convoy-20260803` |
| **분쟁·점령 스택** | `…territorial-stack-consistency-opt.md` | 20260728 |
| **허브 순회 native_heap** | `…hub-hop-native-heap-fix.md` | A안 |

> **2026-08-04 경제**: 금고 5축 재분석 완료 → 김클로드 **`economy-vault-5axis-upgrade`**. ArcCore=RED 동일 유지 · 중립/독립 **신규** · purge 시 **독립국 중립**.  
> **병행**: boot/warp rework 잔여. **commit 금지** until 김팀장 검수.

대표님/김팀장 지시 시 READY 파일부터 읽고 구현 → `kim-claude-handoff-pending.md` **PENDING** · **commit 금지**.

## 어디를 보면 되는지

| 영역 | 경로 |
|------|------|
| 허브 | `app/(game)/planet.tsx` |
| 은하 지도 | `app/(game)/worldmap.tsx` |
| 전투 Skia | `src/components/planet/PlanetEdenRaidOrbitSkiaCombat.tsx` |
| STAGE 세션 | `src/game/planetSessionRegistry.ts` |
| 일일 배치 | `src/arcCore/schedule/runArcCoreDailyOpsBatch.ts` |
| 확장시스템 | `docs/expansion/README.md` · `docs/expansion/아크파이어_확장시스템_설계안.md` |
| CSV | `tables/content/` → `npm run build:content-tables` |
| UI 알림 | `ArcOverlayHost` / `showArcAlert` (RN Modal 산재 금지) |

## 팀 역할

- **김팀장(Cursor 본창)**: 최종 검수 · audit · **커밋** · 완료 선언
- **김클로드(이 세션)**: 초안 구현 · handoff 작성 · **커밋 금지**
- **김경제**: 감시·리포트만 — 코드 수정 금지

깊은 규칙이 필요하면 `@.cursor/rules/arcfire-memory-leak-audit-first.mdc` · `@.cursor/rules/arcfire-skia-memory-lifecycle.mdc` 만 추가로 읽을 것. **전 repo 스캔·전수 조사는 하지 말 것.**
