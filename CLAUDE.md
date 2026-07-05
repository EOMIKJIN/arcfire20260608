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
