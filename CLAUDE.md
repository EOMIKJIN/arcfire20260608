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
| **일일 배치「시작만·완료 없음」복구 (P0)** | `tools/kim-team-lead/reports/kim-claude-ready-daily-ops-batch-incomplete-fix.md` | task_id=`daily-ops-batch-incomplete-fix-20260803` · 게이트+격리+trend bulk |
| **팩션 금고 수수료 입금 유실 (hydrate 레이스)** | `tools/kim-team-lead/reports/kim-claude-ready-faction-vault-fee-hydrate-race.md` | task_id=`faction-vault-fee-hydrate-race-20260803` · **CONDITIONAL**(trade.tsx await 잔여) · 일일 점유스냅 제외 |
| **경제 P0/P1 (밴드 CPH · convoy · 배치 원자성)** | `tools/kim-team-lead/reports/kim-claude-ready-economy-p0-band-cph-p1-convoy.md` | task_id=`economy-p0-band-cph-p1-convoy-20260803` · 근거 `docs/economy-evaluation/2026-08-03-economy-full-rescan.md` |
| **분쟁·점령 스택 일관성·효율** | `tools/kim-team-lead/reports/kim-claude-ready-territorial-stack-consistency-opt.md` | 감사=`TERRITORIAL_STACK_CONSISTENCY_AUDIT_20260728.md` · task_id=`territorial-stack-consistency-opt-20260728` |
| **허브 순회 native_heap (A안)** | `tools/kim-team-lead/reports/kim-claude-ready-hub-hop-native-heap-fix.md` | A1 Image 다운샘플 + A2 planet_change Fresco trim |

> **최근 REVIEWED**: 지도 native_heap·PSS 재검수+쿨다운영속(`worldmap-native-heap-pss-audit-recheck-20260801`) · 마지노선·F2/F4 · 보급포위 — handoff 상단.  
> **우선 착수(2026-08-03~04)**: **일일 배치 미완료 복구**(`daily-ops-batch-incomplete-fix`) → vault fee trade await 잔여 → 경제 밴드 P0.  
> **유지**: 김경제 **메모리** 검수(`long-run-monitor` · `audit:memory:retention` · `kim-economy-handoff` 관측). 일회성 개발 스캔/전수조사 루프 로그는 삭제됨.

대표님/김팀장 지시 시 READY 파일부터 읽고 구현 → `kim-claude-handoff-pending.md` **PENDING** · **commit 금지**.

## 어디를 보면 되는지

| 영역 | 경로 |
|------|------|
| 허브 | `app/(game)/planet.tsx` |
| 은하 지도 | `app/(game)/worldmap.tsx` |
| 전투 Skia | `src/components/planet/PlanetEdenRaidOrbitSkiaCombat.tsx` |
| STAGE 세션 | `src/game/planetSessionRegistry.ts` |
| 일일 배치 | `src/arcCore/schedule/runArcCoreDailyOpsBatch.ts` |
| CSV | `tables/content/` → `npm run build:content-tables` |
| UI 알림 | `ArcOverlayHost` / `showArcAlert` (RN Modal 산재 금지) |

## 팀 역할

- **김팀장(Cursor 본창)**: 최종 검수 · audit · **커밋** · 완료 선언
- **김클로드(이 세션)**: 초안 구현 · handoff 작성 · **커밋 금지**
- **김경제**: 감시·리포트만 — 코드 수정 금지

깊은 규칙이 필요하면 `@.cursor/rules/arcfire-memory-leak-audit-first.mdc` · `@.cursor/rules/arcfire-skia-memory-lifecycle.mdc` 만 추가로 읽을 것. **전 repo 스캔·전수 조사는 하지 말 것.**
