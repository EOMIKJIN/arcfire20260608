# 미션 시스템 작업 인수인계 (2026-06-18)

> **정본 데이터**: `tables/content/missions.csv` · `mission_objectives.csv` · `mission_combat_captains.csv`  
> **빌드**: `npm run build:content-tables` → `src/data/generated/csvMissions.ts` 등  
> **런타임 진입점**: `src/missions/missionCatalog.ts` · `src/store/missionStore.ts`

---

## 완료된 작업

### 데이터·카탈로그
- [x] CSV 단일 정본 — 레거시 `src/data/missions.ts` **삭제** (2026-06-18)
- [x] `mission_combat_captains.csv` 빌드 → `csvMissionCombatCaptains.ts`
- [x] `Mission` 타입 확장: `offerCaptainId`, `offerPlanetId`, `levelRequired`, `clearDialogSceneId`
- [x] `SCHEMA.md` §3 미션·전투 매핑 문서화

### 런타임 코어
- [x] `missionCatalog.ts` — `getMissionById`, story/instance 목록 헬퍼
- [x] `missionCategory.ts` — `deriveMissionPlayCategory()` (objectives 파생)
- [x] `missionActiveBundles.ts` — 다중 활성 미션 (`listActiveMissionBundles`)
- [x] `resolveMissionCombatCaptain.ts` — 테이블 기반 적 함장 리졸버
- [x] `missionCombatEncounter.ts` — 전투 미션 시 transit 조우 확률 보정

### 목표 완료 연동 (다중 활성)
| objective | 파일 |
|-----------|------|
| `reach_planet` | `missionPlanetHubSync.ts` |
| `reach_system` + 배달 | `worldmap.tsx` |
| `buy_goods` | `trade.tsx` |
| `defeat_enemy` | `combat.tsx` + combat captain 리졸버 |

### 선술집 UI
- [x] 탭 3개: 공지판 · 미션현황 · 신규미션
- [x] `TavernMissionStatusTab` — 진행/완료 목록
- [x] `TavernNewMissionTab` — 행성별 sandbox 목록 + **수락**
- [x] `missionStore.acceptInstanceMission()` — 레벨·행성·선행·중복 검증

### 스토리 미션
- [x] `initMissions()` → `mission_001` 자동 시작
- [x] 체인 `nextMissionId` · 클리어 대화(`mission_clear_*`) · 행성 허브에서만 clear dialog

---

## 미완료 / 다음 스프린트

### P2 — 이벤트 미션
- [ ] objective 타입 `talk_npc` (또는 `dialog_scene`) DSL v2 정의
- [ ] `story_scenes.csv` 트리거: `mission_accept`, `npc_talk` 등
- [ ] `npc_ai_captains.mainStageMissionTriggerId` 런타임 소비
- [ ] `deriveMissionPlayCategory` → `event` 분기 실연동

### P2 — 전투 확장
- [ ] 행성 궤도 전투(`planet.tsx`) 승리 → `defeat_enemy` 완료 연동
- [ ] 미션별 **강제 인카운터** (현재는 확률 보정만)
- [ ] `defeat_enemy.quantity` 다수 격파 (v1: 1체 고정)

### P2 — 정리·품질
- [ ] `Mission.clearDialogSceneId` CSV 컬럼 → `resolveMissionClearDialogSceneId` 직접 사용
- [ ] `deliver_cargo` objective 또는 배달 조합 DSL 공식 문서화 (`missionObjectiveDsl.ts`)
- [ ] `MissionEngine.ts` — store/헬퍼로 흡수 또는 실사용처 연결
- [ ] QuestHUD: 스토리 주 미션 + 인스턴스 병행 시 표시 정책
- [ ] sandbox i18n 키 `mission.sandbox_*` (선택 — 현재 CSV title/description 폴백)

### P3 — 검증
- [ ] 인스턴스 전투 15건 E2E (수락 → 조우 → 승리 → 완료)
- [ ] 인스턴스 배달 15건 E2E (구매 → 이동 → 화물 차감)
- [ ] 스토리 체인 `mission_001`~`005` 회귀

---

## 파일 맵 (빠른 탐색)

```text
tables/content/
  missions.csv
  mission_objectives.csv
  mission_combat_captains.csv
  enemy_templates.csv

src/missions/
  missionCatalog.ts          ← 조회 정본
  missionCategory.ts
  missionActiveBundles.ts
  missionObjectiveDsl.ts
  missionPlanetHubSync.ts
  resolveMissionCombatCaptain.ts
  missionCombatEncounter.ts
  tavernMissionBoard.ts

src/store/missionStore.ts

app/(game)/
  tavern.tsx
  combat.tsx / worldmap.tsx / trade.tsx / planet.tsx

src/components/tavern/
  TavernMissionStatusTab.tsx
  TavernNewMissionTab.tsx
```

---

## 로컬 검증 체크리스트

1. `npm run build:content-tables` (CSV 변경 시)
2. `npx tsc --noEmit -p tsconfig.client.json`
3. Metro `r` 리로드
4. 선술집 → 신규미션 → 수락 → 미션현황 확인
5. 전투형: 은하 이동 조우 → 승리 후 objective ✓
6. 배달형: 무역 구매 → 목표 성계 도착

---

## 다음 세션 권장 순서

1. **이벤트 미션 DSL v2** — `talk_npc` 타입 + `story_scenes` 트리거 1건 파일럿
2. **궤도 전투 → defeat_enemy** — `planet.tsx` combat gate 연동
3. **QuestHUD 병행 표시** — 주 미션(스토리) + 인스턴스 서브 라인
4. E2E 수동 테스트 후 sandbox i18n 보강

---

*마지막 갱신: 2026-06-18 · 레거시 `missions.ts` 제거 완료*
