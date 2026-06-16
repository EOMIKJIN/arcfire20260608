# 안정화 체크포인트 — 정상 판정 기록 (2026-06-16 23:23 KST)

> **상태**: ✅ **정상 판정(VERIFIED NORMAL)** — 실기기 테스트 통과. **이 시점 코드 기준 기록.**
> **목적**: 추가 개발 없이 다회 테스트를 진행하기 위한 **기준 스냅샷 기록**. 테스트 무문제 시 이 상태를 커밋한다.
> **베이스 커밋**: `a8c4bb5 작업 내용-메모리,경제안정화 작업버전0616` (그 위 미커밋 변경 = 본 체크포인트)
> **기기**: `192.168.45.197:38841` (Android, 디버그 빌드 `expo run:android --device`)

---

## 0. 판정 — 정상

사용자 실기기 테스트로 아래를 **모두 정상 확인**했다. 까만 화면·지연·크래시 없음.

| # | 테스트 시나리오 | 결과 |
|---|------------------|------|
| 1 | 강제종료 → 재시작 → **이어하기 → 메인스테이지 진입** (기존 계정·콜드 스타트) | ✅ 정상 |
| 2 | **캐릭터 삭제 → 신규 진입** (계정 없음 경로) | ✅ 정상 (지연·까만화면 없음) |
| 3 | **방위위성 등 개발 → 삭제 → 재진입** (개발 데이터 누적 후 초기화) | ✅ 정상 (행성개발 초기화 동작) |
| 4 | 타이틀 렌더 (로고·버튼) | ✅ 정상 |

> 보조 근거: logcat `[MEM] planet_main_stage_hub mount` 정상, FATAL/SIGSEGV/HermesGC OOM 없음. 화면 캡처로 타이틀·렌더 파이프라인 정상 확인.

---

## 1. 이 체크포인트에 포함된 변경 (커밋 `a8c4bb5` 이후 미커밋)

### A. 안정화 수정 (이번 세션 · 검증됨)
| 파일 | 내용 |
|------|------|
| `src/game/continueSessionPrewarm.ts` | 차원항로 prewarm `InteractionManager.runAfterInteractions` → 단순 `yieldToUi` (워프→행성 전환 행 제거) |
| `src/account/localAccountReset.ts` | 계정 초기화 시 **행성개발(planetCore)·월드오브젝트·전투텔레메트리·세션·선술집보드·갤럭시(world)** 함께 리셋 |
| `src/store/combatMatchTelemetryStore.ts` | `resetCombatMatchTelemetry()` 추가 |
| `src/store/tavernBoardStore.ts` | `resetLocalBoard()` 추가 (기본 시드 복귀) |
| `.cursor/rules/arcfire-main-lead-agent.mdc` | 「플레이어 계정 최상위」·「주기·틱 메모리」·「경제 부트경로 감사」 규칙 |
| `app/_layout.tsx` | (스플래시 게이팅 추가 후 **롤백 완료** — 순변경 없음) |

### B. 캐릭터 생성 기능 (재적용)
`app/(game)/character-select.tsx`, `src/game/onboardingPilotRegistration.ts`, `onboardingDraftStorage.ts`, `playerPilotProfessionModel.ts`, `src/ui/onboarding/CharacterSelectOptionRow.tsx`, `onboardingScreenLayout.ts`, `src/combat/playerPilotStatCombatBridge.ts`, `src/data/generated/csvPlayerProfessions.ts`, intro/nickname/playerStore/types/firestore/stages(registry·types)/`player_professions.csv`/`build-content-from-csv.mjs`

### C. 행성 PGP·기타 (신규)
`src/world/planetPgpModel.ts`(+`.test.ts`), `src/game/planetHub/planetEconomyInfoSnapshot.ts`(PGP 연동), `src/data/d20tables.ts`, `src/game/sessionLoadingPolicy.ts`, `src/data/generated/index.ts`, `src/ui/overlay/content/PlanetEconomyInfoOverlayContent.tsx`, `tools/session-stability-watch/*`

---

## 2. 게이트 통과 기록

- `npx tsc --noEmit -p tsconfig.client.json` — **PASS** (각 수정 후 확인)
- `npm run audit:skia-memory` — 12/12 PASS (직전 확인)
- 린트 — clean
- 실기기 — §0 시나리오 정상

---

## 3. 테스트 중 유지 원칙

- **추가 개발 금지.** 이 working tree 상태를 고정해 다회 테스트만 진행한다.
- 코드를 건드리면 본 체크포인트 무효 → 재검증 필요.
- 이상 발생 시: 단계(타이틀/스토리/캐릭터선택/닉네임/차원항로/행성) + Metro 빨간 에러 + (가능 시) `[boot-perf]` 기록.

---

## 4. 테스트 통과 후 — 커밋 가이드

테스트 무문제 시 이 상태를 커밋한다(예시):

```
작업 내용-차원항로/계정초기화/캐릭터생성 안정화 검증 0616
```

- 한 커밋으로 묶거나, A(안정화)/B(캐릭터생성)/C(PGP)로 분할 가능.
- 커밋 전 권장: `npx tsc --noEmit -p tsconfig.client.json` 재확인.

## 5. 복구 참고

- 직전 안정 커밋: `a8c4bb5` (이 위에 본 체크포인트가 얹힘)
- 캐릭터 생성 1차 백업 태그: `archive/character-creation-wip-20260616`
- 이 체크포인트는 **미커밋 working tree** 자체 — 추가 안전을 원하면 즉시 커밋 또는 별도 스냅샷 권장.
