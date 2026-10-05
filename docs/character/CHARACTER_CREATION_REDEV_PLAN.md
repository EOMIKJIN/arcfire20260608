# 캐릭터(함장) 생성창 — 히스토리 · 재개발 준비 (보류 중)

> **상태**: ⏸ **보류(deferred)** — 안정 버전 유지 우선. **실제 구현 작업은 진행하지 않음.**
> **목적**: 1차 구현 히스토리를 durable하게 보존하고, 이후 **체계적 재개발**을 위한 기반(파일 인벤토리·플로우·데이터 모델·복구 경로·체크리스트)만 정리.
> **최종 정리일**: 2026-06-16 (김팀장)

---

## 0. 한 줄 요약

스토리 직후 **닉네임 생성 직전**에 들어갈 **캐릭터(함장) 선택 화면**(성별·기본 스탯·성격·특성, 전투 연동)을 1차 구현했으나, 대규모 미커밋 변경(경제·광물·드론)과 **함께 묶여 있던 상황 + 별개의 ArcCore 부트 OOM 회귀**로 혼선이 생겨, **안정 버전(`72a234d`)으로 전체 복구**하면서 캐릭터 생성 코드도 함께 워킹트리에서 내려갔다. 코드는 **유실되지 않았고** 아래 경로로 durable 보존됨.

> ⚠️ **중요**: 캐릭터 생성 작업은 **시작 화면 멈춤/1GB OOM의 원인이 아니다.** 원인은 ArcCore 일일 배치의 부트 동기 실행이며 별도로 수정 완료(`ArcCoreDailyOpsSubCore`/`AiEconomySubCore` onBoot 지연). 재개발 시 이 둘을 **혼동·결합하지 말 것.**

---

## 1. 코드 보존 위치 (durable)

| 보존처 | 값 |
|--------|-----|
| 백업 stash | `stash@{0}` (`backup-before-restore-to-72a234d-20260616`) |
| **durable 태그** | **`archive/character-creation-wip-20260616`** (stash 커밋 `173c59a` 고정 — stash가 drop돼도 보존) |
| 기준 안정 커밋 | `72a234d 국경선 작업버전0616` |

> 이 태그 커밋에는 캐릭터 생성 외에 경제·광물·드론 등 **다른 미커밋 작업도 함께** 들어 있다(혼합 스냅샷). 캐릭터 생성 파일만 선별 복구하려면 아래 §4 명령을 쓴다.

---

## 2. 기능 개요 (1차 구현 기준)

### 진입 플로우
```
타이틀 → intro(스토리, flow=preNickname) → 캐릭터 선택(character-select) → 닉네임(nickname) → 차원항로(continue-warp) → 행성 허브(planet)
```
- 신규 계정만 해당. intro 마지막 페이지 버튼이 `[ 캐릭터 선택 ]`으로 바뀌고, 선택 완료 시 닉네임으로 이동.
- UI 컨셉: 인게임 대화창의 **포트레이트 + 우측 설명** 스타일을 세로로 나열.

### 선택 가능한 함장 3종 (남2·여1)
| id | 이름 | 성별 | combatArchetype | 비고 |
|----|------|------|-----------------|------|
| `prof_striker` | 렌 카제 | male | fighter | 강습·돌파 |
| `prof_scout` | 미아 벨로 | female | ranger | 정찰·회피 |
| `prof_tactician` | 카일 드레이크 | male | neutral | 전술·지휘 |

---

## 3. 파일 인벤토리

### 3-1. 신규 파일 (HEAD에 없음 · 태그 `^3`에 보존)
| 파일 | 역할 |
|------|------|
| `app/(game)/character-select.tsx` | 캐릭터 선택 화면(FlatList + ArcButton) |
| `src/game/playerPilotProfessionModel.ts` | profession 모델·정규화 (Table-First) |
| `src/game/onboardingPilotRegistration.ts` | 등록 단일 파이프라인(`completePilotRegistration`) |
| `src/game/onboardingDraftStorage.ts` | 선택 professionId 초안 AsyncStorage 전달 |
| `src/ui/onboarding/CharacterSelectOptionRow.tsx` | 캐릭터 옵션 행 UI(포트레이트+설명) |
| `src/ui/onboarding/onboardingScreenLayout.ts` | 온보딩 레이아웃 상수 |
| `src/combat/playerPilotStatCombatBridge.ts` | 전투 연동 브릿지(현재 stat은 UI·서사 전용) |
| `src/data/generated/csvPlayerProfessions.ts` | `player_professions.csv` → 생성 TS |

### 3-2. 수정 파일 (HEAD 대비 변경 · 태그 본체에 보존)
| 파일 | 변경 요지 |
|------|-----------|
| `app/(game)/intro.tsx` | preNickname 마지막에 `character-select`로 라우팅 + 레이아웃 상수 |
| `app/(game)/nickname.tsx` | 인라인 생성 제거 → `completePilotRegistration` 사용, profession 없으면 select로 회귀 |
| `src/store/playerStore.ts` | `createPlayer(uid,nick,professionId)`·`pilotProfile`·정규화 |
| `src/types/index.ts` | `PlayerPilotProfile`·`PlayerPilotGender` 타입 |
| `src/firebase/firestore.ts` | `createUserDocOnNicknameConfirm`에 `onboardingProfessionId` 옵션 |
| `src/stages/registry.ts` · `types.ts` | `character_select` STAGE 등록 |
| `tables/content/player_professions.csv` | 함장 3종 정본 (**UTF-8 필수**) |
| `tools/content-tables/build-content-from-csv.mjs` | `player_professions` 빌드 파이프라인 |

---

## 4. 복구 명령 (재개발 시작 시)

```bash
# 신규 파일(미추적) — 태그의 ^3 트리에서
git checkout archive/character-creation-wip-20260616^3 -- "app/(game)/character-select.tsx"
git checkout archive/character-creation-wip-20260616^3 -- src/game/playerPilotProfessionModel.ts
git checkout archive/character-creation-wip-20260616^3 -- src/game/onboardingPilotRegistration.ts
git checkout archive/character-creation-wip-20260616^3 -- src/game/onboardingDraftStorage.ts
git checkout archive/character-creation-wip-20260616^3 -- src/ui/onboarding/CharacterSelectOptionRow.tsx
git checkout archive/character-creation-wip-20260616^3 -- src/ui/onboarding/onboardingScreenLayout.ts
git checkout archive/character-creation-wip-20260616^3 -- src/combat/playerPilotStatCombatBridge.ts
git checkout archive/character-creation-wip-20260616^3 -- src/data/generated/csvPlayerProfessions.ts

# 수정 파일 — 태그 본체에서 (주의: 다른 작업과 묶여 있으니 diff 확인 후 선별 적용)
git show archive/character-creation-wip-20260616:"app/(game)/intro.tsx"
git show archive/character-creation-wip-20260616:src/types/index.ts
# ... 필요한 hunk만 수동 반영 권장 (블랭킷 checkout 금지)
```

> 수정 파일은 그 사이 안정 버전이 갱신됐을 수 있으므로 **블랭킷 덮어쓰기 금지** — `git show ...`로 diff를 보고 **해당 hunk만 수동 반영**한다.

---

## 5. 데이터 모델

```ts
// src/types/index.ts (1차안)
export type PlayerPilotGender = 'male' | 'female';
export interface PlayerPilotProfile {
  professionId: string;
  gender: PlayerPilotGender;
  personalityTag: string;   // CSV personalityKo
  traitIds: string[];       // CSV traitIdsPipe
  combatArchetype: CapitalShipArchetype; // 전투 편향
}
```

`player_professions.csv` 컬럼:
`id, sortOrder, nameKo, labelKo, gender, summaryKo, personalityKo, traitIdsPipe, portraitImageAssetKey, combatArchetype, statWisdom, statCharisma`

> 전투 수치 정본은 **전함 CSV**(`npc_ai_ships.csv`)다. profession은 **사회 스탯(WIS/CHA)·서사·아키타입 편향**만 담당(전함 스탯과 중복 금지).

---

## 6. 체계적 재개발 체크리스트 (구현 시작 시)

> **전제**: 별도 브랜치에서 **캐릭터 생성만** 작업. 경제·ArcCore·드론 변경과 절대 섞지 않는다. 증분 커밋.

1. [ ] 브랜치 생성 (`feature/character-creation`) — 안정 `main`에서 분기
2. [ ] **데이터**: `player_professions.csv`(**UTF-8**) 복구·검증 → `npm run build:content-tables` → `csvPlayerProfessions.ts` 정상 한글 확인
3. [ ] **타입/스토어**: `PlayerPilotProfile`·`createPlayer(professionId)`·정규화 hunk 반영
4. [ ] **화면**: `character-select.tsx` + `CharacterSelectOptionRow` + `onboardingScreenLayout`
5. [ ] **라우팅**: intro(preNickname) → select → nickname (STAGE `character_select` 등록)
6. [ ] **등록 파이프라인**: `onboardingPilotRegistration`·`onboardingDraftStorage`
7. [ ] **전투 연동**: `playerPilotStatCombatBridge` (archetype 편향 범위 확정)
8. [ ] **Firestore**: `onboardingProfessionId` 단발 저장(원격 5초 캡 정책 준수)
9. [ ] 게이트: `npx tsc --noEmit -p tsconfig.client.json` · 신규 계정 플로우 수동 검증
10. [ ] **회귀 확인**: 시작 화면 응답·메모리(부트 OOM과 무관함 재확인)

---

## 7. 가드레일 (재발 방지)

- **인코딩**: 모든 `tables/**.csv`는 **UTF-8**. 빌드 도구는 UTF-8로만 읽는다(`build-content-from-csv.mjs`). EUC-KR/CP949 금지.
- **STAGE 격리**: `character_select`는 온보딩(STAGE 0) 화면. **ArcCore 기동·경제 패스와 무관**하게 둔다.
- **번들 금지**: 캐릭터 생성 PR에 경제·일일배치·드론·Skia 변경을 섞지 않는다(이번 혼선의 핵심 원인).
- **Table-First**: 함장 풀·이름·스탯은 CSV 정본. 코드 하드코딩 금지(v4.0 §1).
- **전투 수치 단일 정본**: 전함 CSV. profession은 사회 스탯·서사·아키타입만.

---

## 8. 관련 작업 (이번 안정화에서 별도로 처리됨)

- ArcCore 부트 OOM 수정: `src/arcCore/subcores/ArcCoreDailyOpsSubCore.ts`·`AiEconomySubCore.ts` — `onBoot` 무거운 패스를 `InteractionManager.runAfterInteractions`로 지연.
- 경제 산출물 부트경로·성능 전수검사 게이트: `.cursor/rules/arcfire-main-lead-agent.mdc`.
- 테이블 인코딩 정리: `npc_ai_captains.csv`(복구)·`npc_ai_ships.csv`(CP949→UTF-8).
