# 김클로드 검수 — 퀘스트 협동·보호·성공/실패 설계 v1

```text
task_id=review-quest-ally-coop-protect-design-20261004
대상=docs/quest/QUEST_ALLY_COOP_PROTECT_OUTCOME_DESIGN.md (김팀장 2026-10-03 · 설계만)
kind=REVIEW (코드 변경 0)
판정=PARTIAL — 현황 진단은 정확. 구현 전 설계 보완 2건(P0) 필요
```

## 1. 현황 진단 재검수 — AGREE

| 설계 주장 | 확인 근거 |
|-----------|-----------|
| 퀘스트 허브 전투 시드 = 레드 1 + 플레이어 블루 1 | `src/combat/questHubOrbitCombatSeed.ts:33-48` |
| 성공 = 락 베뉴+템플릿 일치만, 생존 미확인 | `src/missions/applyDefeatEnemyMissionObjectives.ts:12-21` |
| `failed` 상태는 타입만, 본편·서브 전투에서 기록 없음 | `types/index.ts:831` · 기록처는 이상 미션·아크 인스턴스뿐 |
| 승패 = 생존 팀 수 | `PlanetEdenRaidTestLayer.tsx:3267-3268` |
| 블루 상한 3 | `npc/edenCapitalFleetConfig.ts:9` |
| 협동 대상 4목표 모두 `hub_orbit` | `mission_quest_combat_ops.csv` (002_c minerva_deep · 006_a draco_haven · s034_d synth_075_p · s056_d synth_031_p) |
| 동료 셀라·벡터-7 = 블루 · 스텔리움 연합 소속 | `npc_ai_captains.csv` combatTeam=blue · `ai_clan_registry.csv` miners_convoy/research_convoy → `mega_stellium_alliance` |
| `sandbox_064` 신설 가능 | `missions.csv` 최대 `sandbox_063` |
| `fail_mission` 후 재수락 가능 | `missionStore.ts:854-855,894-895` — active/complete만 차단, failed는 통과 |
| 제외 목록(004_a 전멸 서사 · 튜토리얼 · 바) | 서사 근거 타당 |

## 2. 보완 필요

### P0-1 협동 전투에서 플레이어가 격침돼도 퀘스트가 완료됨

- 플레이어 격침 시 스킬 윙맨은 함께 제거되지만(`PlanetEdenRaidTestLayer.tsx:3233-3236`), 퀘스트 동료는 다른 captainId라 **살아서 전투가 계속**된다.
- 동료가 적을 끝내면 `winnerTeam='blue'`, `hadPlayerCombat`은 **죽은 플레이어도 포함**(`:3292`) → `applyDefeatEnemyMissionObjectives` 호출(`:3319-3332`) → **목표 완료**.
- 동시에 결과창은 `pendingDestroy`로 **패배**(`:3365`)이고 기함 파괴 처리까지 적용 → 「졌는데 퀘스트는 깼다」 모순.
- 설계 §3-5 146행은 「플레이어 전멸 = 미완료(지금과 같음)」을 전제하나, 동료가 생기면 그 전제가 깨진다. 협동 기본 `failWhen=none`(§3-4)이라 막을 장치도 없다.
- **보완안**: (a) 퀘스트 전투에서 플레이어 격침 시 퀘스트 동료도 윙맨과 같이 퇴장 → 기존 「격침=미완료·재도전」 유지 **권장**, 또는 (b) 협동·보호 전 행에 `playerMustSurvive=1` 강제 + 완료 게이트에서 플레이어 생존 확인. (a)가 현행 결과창·파괴 흐름과 맞음.

### P0-2 보호 실패 「전투 중 즉시 종료(블루 패)」 경로가 엔진에 없음

- 전투 종료는 생존 팀 수로만 판정된다(`:3267-3268`). 특정 아군 격침으로 끝내는 경로는 없다.
- 블루를 전부 `alive=false`로 만들어 끝내면 플레이어 격침 분기(`:3243-3262`)가 돌아 **기함 침몰 표시·내구 마모·기함 파괴**가 붙는다. 동료를 잃은 실패에 기함 파괴 벌칙은 과하다.
- **보완안**: 보호 실패 전용 종료 플래그(플레이어 격침 분기와 분리) + 결과창 `outcome=lose`, `applyCapitalShipDestruction=false`, 보호 실패 문구 1장. 틱에서는 격침 순간 1회 판정(할당 0).

### P1-3 플레이어 생존 조건 기본값이 문서 안에서 엇갈림

§3-1은 `all_red_dead_and_player_alive`를 「기본 보호/협동에 켬」이라 쓰고, §3-4 역할표·§4-1 예시·§6-1 배치에는 그 값이 없다. P0-1 결론에 맞춰 한 곳으로 정리 필요.

### P1-4 동료 함선이 플레이어 기함과 같을 수 있음

셀라 `npc_blue_fleet_3`, 벡터-7 `npc_blue_fleet_2`. 플레이어 기함 id(`questHubOrbitCombatSeed.ts:29`)가 같으면 같은 함선 2척이 뜬다. 겹칠 때 대체 함선 규칙 1줄 추가.

### P2

- 보호 실패 후 재도전 진입 방법(재착륙 시 재교전) 명시. 퀘스트 전투는 웨이브 쿨다운을 남기지 않음(`:3321`) — 재도전 막힘은 없음.
- §3 98행 문장 깨짐(「…을  squashes.」).
- 지시 범위 대비: 대표님 지시는 「전투 퀘스트가 있으면 협동으로 수정 또는 신설」. 1차는 12개 전투 목표 중 4개만 협동(나머지는 서사·후반 사유로 제외). 범위가 의도에 맞는지 대표님 확인 항목으로 둘 것.

## 2-1. 대표님 결정 (2026-10-04 02:45) — 설계 반영 필수

> 「한번에 모두 바꾸는 게 아니라, 여러 전투방식이 혼합되고 퀘스트 임무 자체도 다양해야 한다. 내가 파괴될 경우는 퀘스트 실패·전투 실패로 가는 조건이 되어야 하고, 모든 퀘스트 임무 조건 룰에 우선되어야 한다.」

**R0 (최우선 룰) — 플레이어 기함 격침 = 전투 실패 + 퀘스트 실패**

- 모든 전투 목표에 무조건 적용. `winWhen`·`failWhen`·`allyRole` 어떤 정책 행보다 **먼저** 평가하고, 정책 CSV로 끌 수 없다.
- 격침 순간 전투 종료(패배). 퀘스트 동료·윙맨이 살아 있어도 이어서 싸우지 않는다 → P0-1 자동 해소.
- 같은 전투에서 적이 동시에 전멸해도 플레이어 격침이 이긴다(완료 금지).
- 현행 「격침 = 미완료 유지」는 R0로 **변경**. 정책표에서 `player_dead` · `player_or_protected_dead` · `playerMustSurvive` · `all_red_dead_and_player_alive`는 R0에 흡수되어 **삭제**(중복 옵션 금지).
- 실패 후 처리(김클로드 제안 · 김팀장 확정 필요): 정식 서브·신설 = `fail_mission`(실패 기록 → 오퍼 NPC 재수락). 본편 = 체인 보존 위해 `retry_objective`이되 결과창·기록은 **「퀘스트 실패」로 표시**.

**다양성 — 일괄 전환 금지**

- 전투 목표마다 방식을 섞는다: 단독(1v1) · 협동 · 보호 · (차기) 다수 적 등. 1차 4칸 협동 + 보호 신설 1은 이 방향과 맞음 — 「12개 중 4개」는 축소가 아니라 **혼합 배치 원칙**으로 문서에 명시.
- 정책 CSV에 `combatMode`(solo/coop/protect…) 열을 두고, 감사에서 같은 챕터·같은 앵커 연속 동일 방식 편중을 경고하는 규칙 추가 권장.

## 3. 결론

현황 분석·테이블 구조·잠금 규칙은 코드와 일치하고 방향(새 엔진 없이 시드 +1 · 정책 CSV)도 타당하다. **구현 착수 전 P0-1·P0-2를 설계에 반영**해야 한다. 둘 다 1차 구현 1단계(outcome policy)에서 바로 부딪히는 경로다.
