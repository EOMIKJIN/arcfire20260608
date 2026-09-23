# 미확인 이상현상 — 인스턴스 퀘스트 설계 (v1.1)

> **상태**: 설계 정본 · **코드 미착수** (대표님 승인 후 구현)  
> **날짜**: 2026-09-22 · **개정**: v1.1 (김클로드 유지조건 검수 반영 + 50:50 유물/위협)  
> **축**: 기존 퀘스트 고도화 — 메인스토리 비연결 · Table-First · 착륙 게이트 없는 월드 이벤트  
> **교차**: `MISSION_SYSTEM_HANDOFF.md` · `missionTrack.ts` · `missionObjectiveDsl.ts` · `planetSalvageSearch.ts` · `GalaxyMapContestedZoneRingOverlay.tsx` · `questCombatLock.ts` · `app/(game)/combat.tsx`  
> **검수**: `tools/kim-team-lead/reports/kim-claude-unidentified-anomaly-quest-review-20260922.md`

---

## 0. 한 줄

은하 외곽에서 **식별된 행성**에만 뜨는 **월드 이벤트형 인스턴스**. 동시 1건 · 일 2회. 지도에 보라 링 + 범용 팝업. 바 **이상현상 연구원**에게 수락하면, 그 행성 수색으로 **유물(이익)** 또는 **미확인 위협(위험)** 이 **인스턴스당 50:50**으로 드러난다. 위협은 **이동중 전투와 같은 1:1 STAGE 3**으로 **미확인 물체**(지역 TCL보다 강한 전용 적)와 즉시 붙는다. 유물 특수효과는 기반만.

---

## 0-A. 김클로드 검수 판정 (v1.1에 반영)

| # | 검수 | 등급 | 김팀장 판정 | 반영 |
|---|---|---|---|---|
| 1 | 미션 만료 ↔ anomaly 스토어 비동기 · 부팅 캐치업 없음 | P1 | **APPLY** | §8-4 `settleAnomalyEvent` 단일 정리 + after-settle 훅 + 전역 1 timeout + hydrate 1회 |
| 2 | `collect_item`이 `isCargoObjective`에 없어 만료 회수 실패 | P1 | **APPLY** | §6-1 · §10 P2 게이트 — `isCargoObjective`에 `collect_item` 추가 |
| 3 | `arc_anom_`이 트랙 헬퍼에 안 걸림 | P1 | **APPLY** | §2-1 배선 목록 고정. `isQuestMissionId`(`sandbox_`만)는 **확장하지 않음** |
| 4 | 미수락 TTL 자정 컷 불공평 | P2 | **APPLY (a)** | §3-2 — 고정 12h. 자정 컷 없음 |
| 5 | 동시 1이 수락 후 48h 잠금 · 포기 없음 | P2 | **APPLY (좁은 예외)** | §5-1 — 연구원 재대화 **포기만**. 전 퀘스트 포기 시스템 신설은 비범위 |
| 6 | 트리거 B 재당첨 | P2 | **APPLY** | §3-3 — 최근 해소 행성 3일 제외 · 이력 상한 8 |
| 7 | 로컬 전용 명시 | P3 | **APPLY** | §8-2 — Firestore·프로필 blob 미포함 |
| 8 | clone `timeLimitHours` · dayKey 리셋 | 확인 | **APPLY** | §8-1 · §10 P1 |

---

## 1. 기획 의도 → 기존 시스템에 얹는 위치

| 의도 | 기존 정본 | 이번 위치 |
|---|---|---|
| 인스턴스, 메인퀘 비연결 | `story_*` 그래프 · `isCampaignPrimaryMissionId` | **넣지 않음**. HUD는 부선(quest)만 |
| 지역 행성 생성 | 바 보드 `arc_inst_` + `tq_*` 일일 채움 | **보드 10~16칸을 쓰지 않음**. 별도 이벤트 슬롯 |
| 식별한 행성 | `inspectedPlanetInfoIds` · `tryRevealPlanetInfoOnPresent` | 자격 풀의 **유일한 입장** |
| 외곽 가중 | `planet_leveling_progression.sectorBand` / `zoneIndex` | 정책 CSV 가중 |
| 동시 1 · 일 2 | 바 보드는 행성당 N건 | **은하 전역 이벤트 1 + KST 일 2회 스폰** |
| 지도 링 | 분쟁 `GalaxyMapContestedZoneRingOverlay` | **같은 컴포넌트 · 보라 색만**. 분쟁 빨강 불변 |
| 팝업 | `showArcNotificationAlert` 40초 | 발동 순간. IM 금지 |
| 바 NPC 수락 | `talk_npc` · `acceptQuestMission` · 1차 `NarrativeDialogRow` | 연구원은 NPC → **1차만** (NL 없음) |
| 수색→분기 | `resolvePlanetSalvageSearchOutcome` (판테온 5%) | 수락·이벤트 행성에서만 **30% 페이로드 공개**. 인스턴스 **50:50** 유물/위협 |
| 이익 | 판테온 12좌와 분리된 퀘스트 유물 | `relic_quest_anomaly_01` · effect 훅만 |
| 위험 | `/(game)/combat` 이동중 1:1 · `QuestCombatLock` | **수색 강제만**. `transit_guaranteed` 금지(항로 조우로 새지 않음) |
| 유물 효과 나중 | 판테온 도감 해금 | 새 아이템 · 레지스트리 no-op |

---

## 2. 권장안 (1안) — 트랙·ID

메인스토리·튜토리얼·일반 바 채움과 **접두사를 분리**한다.

| 층 | id | 역할 |
|---|---|---|
| 템플릿 | `tq_anom_01` | `missions.csv` · type=`explore` · `timeLimitHours=48` · 제목「미확인 이상현상」(모호) |
| 런타임 | `arc_anom_{planetId}_{seq}` | clone 1건. `arc_inst_` 고아 정리·바 listed와 분리 |
| 판정 | `isUnidentifiedAnomalyMissionId` | `arc_anom_` 접두. HUD 트랙은 quest 부선 |

수락은 기존 `acceptQuestMission`. `prerequisiteIds` / `nextMissionId`는 비워 **스토리 체인에 넣지 않는다**.

바 `[신규 의뢰]` 10~16칸·카테고리 슬롯은 **그대로**. 이상현상은 그 칸을 먹지 않는다.

클론 시 `timeLimitHours=48`을 템플릿에서 **반드시 복사**한다. 전용 클론 함수를 새로 만들면 이 필드 누락이 만료 워치 미작동으로 이어진다.

### 2-1. 트랙 헬퍼 배선 (구현 체크리스트 · 김클로드 P1-3)

`isQuestMissionId`는 `sandbox_`만 유지한다. `arc_anom_`은 **OR로 꽂는다**.

| 지점 | 지금 | 추가 |
|---|---|---|
| `missionTrack.ts` `resolveMissionTrack` | tutorial / main_story / sandbox / 개인 | `isUnidentifiedAnomalyMissionId` → `'quest'` |
| `missionStore.ts` `findFallbackActiveMissionId` | sandbox · `arc_inst_` · 개인 | `arc_anom_` |
| `barMissionBoard.ts` 진행/완료 탭 | sandbox · `arc_inst_` | `arc_anom_` |
| `missionHudSlots.ts` 부선 핀 | sandbox · `arc_inst_` | `arc_anom_` |
| `missionTimeLimit.ts` 스윕 대상 | sandbox 등 | `arc_anom_` |
| `missionCatalog.ts` `getMissionById` | CSV · `arc_inst_` | materialized `arc_anom_` |
| `questCombatLock.ts` `lookupMissionForQuestLock` | CSV · `arc_inst_` · `cp_` | `arc_anom_` (위협 클론만 defeat_enemy) |
| `acceptQuestMission` 게이트 | sandbox / `arc_inst_` | `arc_anom_` 수락 허용 |

착수 시 `grep isArcCoreInstanceMissionId`로 잔여 지점을 한 번 더 확인한다.

---

## 3. 발동 — 자격·확률·한도

### 3-1. 자격 행성 (AND)

1. **식별됨** — `inspectedPlanetInfoIds`. 식별은 **착륙한 뒤 행성정보를 연 순간**만. 지도 원격 탭은 식별이 아님.  
2. **바 활성** — `listBarEnabledCoreOpenPlanetIds`와 동일 (CSV 바 또는 인구돔).  
3. **외곽 밴드** — `sectorBand`:

| sectorBand | zoneIndex 대략 | 스폰 가중 | 비고 |
|---|---|---|---|
| `early` | 1~4 | **0 (제외)** | 아르카디아~미네르바 |
| `mid_early` | 5~8 | 낮음 (1) | 드라코~시리우스 |
| `mid` | 9~14 | 중간 (3) | 페르세우스~오메가 |
| `late` | 15~21 | 높음 (8) | 나이트폴~제네시스 · 외곽 |

synth도 같은 `zoneIndex`/`sectorBand`. 행성 id 하드코딩 금지.

### 3-2. 한도

| 한도 | 값 | 의미 |
|---|---|---|
| 은하 동시 | **1** | `listed` 또는 `accepted`면 추가 스폰 없음 |
| KST 일일 스폰 | **2** | 완료가 아니라 **발동 횟수** |
| 수락 후 | 템플릿 48h | `expiresAtMs` + 만료 워치 |
| 미수락 TTL | **고정 12시간** | 자정 컷 없음. 23:00 스폰도 다음날 11:00까지 |

일일 카운터 `spawnCountToday` / `spawnDayKeyKst`는 `planetSalvageSearchDaily`와 같이 **스폰 시각의 KST dayKey**로 고정한다. 12h가 자정을 넘어도 그 스폰은 어제 예산 1회로 남는다(이중 집계 없음). 날짜가 바뀌면 카운터만 0.

### 3-3. 스폰 트리거 (착륙 완료가 아님)

백엔드는 접전 패스와 같이 **화면과 무관**하다.

| 트리거 | 때 | 롤 |
|---|---|---|
| A. 신규 식별 | 착륙 후 행성정보 최초 오픈 | 그 행성이 자격이면 가중 주사위 |
| B. 일일 2번째 | 이미 식별된 외곽 풀, 동시 0 · 오늘 스폰 &lt; 2 | 가중 추첨 1행성. **전 행성 60초 스캔 금지** |

**재당첨 배제 (트리거 A/B 공통)**: 최근 **3일(KST)** 안에 해소(완료·만료·포기·실패)된 `planetId`는 가중 0. 이력은 anomaly 스토어에 **최대 8건**. `purgeLocalAccountData` 대상.

타이틀·차원항로·허브 미도착에서는 팝업만 생략. **이벤트 레코드·링 데이터는 기록**. 허브 1회 이후·월드맵에서는 팝업 즉시.

주사위: 정책 CSV `baseSpawnChancePct` × 밴드 가중 / 가중합. late 식별 체감 높음, early는 0.

스폰 순간 `payloadKind`를 **50:50으로 잠근다** (`relic` | `threat`). UI·연구원·링은 공개하지 않는다. 수색 30% 히트에서만 드러난다. §6.

---

## 4. 지도 · 팝업

### 4-1. 보라 링

- `GalaxyMapContestedZoneRingOverlay`에 `variant: 'contested' | 'anomaly'`(또는 `ringTint`)만 추가.  
- **분쟁 빨강 `RING_COLOR` 불변.**  
- 이상현상 보라: `rgba(188, 120, 255, 0.90)` — 점선·두께·14초 회전은 분쟁과 동일.  
- 데이터: 활성 이벤트 `systemId` 1개. 안개 밖이면 링 숨김, 이벤트는 유지.  
- 분쟁과 겹치면 **이상현상 보라 1개**.

링 소거는 **반드시** `settleAnomalyEvent`를 통해서만 한다. 미션 progress 삭제만으로 링이 남으면 동시 1이 영구 잠긴다(김클로드 P1-1).

### 4-2. 팝업

- `showArcNotificationAlert` · 40초 · `setTimeout(0)`.  
- 제목: `미확인 이상현상`  
- 본문: `{planet} 성계에서 미확인 이상현상이 관측되었습니다. 착륙 후 바의 이상현상 연구원을 찾으십시오.`  
- id: `unidentified-anomaly-alert` (동일 id 교체).

발동은 허브·맵 어디서나 같고, 링은 맵에 올라갔을 때 보인다.

---

## 5. 수락 — 이상현상 연구원

| 항목 | 정본 |
|---|---|
| 함장 id | `npc_cpt_anomaly_researcher` |
| 성격 | 바 **접선 NPC**. 후원 종업원·`npc_cpt_bar_ret_*`가 아님 |
| 출현 | 이벤트가 그 행성에 `listed`/`accepted`일 때만. 행성 이탈 시 세션 dispose |
| 대화 | 1차 `NarrativeDialogRow`만. 입(NL) 없음 |
| 수락 | 대화 종료 후 `acceptQuestMission(arc_anom_…)` |
| 브리핑 | **모호**. 「유물일 수도, 위협일 수도」— `payloadKind`를 말하지 않음 |
| 초상 | `docs/NPC_PORTRAIT_PRODUCTION_CANON.md`. 1차는 기존 연구원 톤 재사용 |

바 UI: `[신규 의뢰]`에 섞지 않고 **이벤트 전용 1행**. 수락 전 `listed`, 수락 후 `accepted`. 수락 후 HUD는 수색만(페이로드 공개 전). `talk_npc`를 진행 목표 첫 칸에 두지 않는다.

### 5-1. 포기 (이 퀘스트만 · 전 시스템 포기 아님)

연구원에게 **재대화**하면 「조사 중단」이 있다.

| 상태 | 포기 |
|---|---|
| listed (미수락) | 불필요 — TTL 12h |
| accepted · 페이로드 미공개 | 가능 → `settleAnomalyEvent('abandoned')` · 동시 1 즉시 반납 |
| accepted · 유물 이미 인벤 | 가능 → 유물 회수 + settle |
| accepted · 위협 공개 · 전투 전/패주 후 | 가능 → settle · 실패와 동일하게 유물 없음 |
| 전투 중 (STAGE 3) | **불가** |

전 퀘스트 공통 abandon API는 만들지 않는다.

---

## 6. 퀘스트 내용 — 수색 → 50:50 공개

### 6-0. 리스크 모험 (이번 개정의 본선)

이 퀘스트의 정체성은 **이익이거나 위험**이다. 같은 링·같은 연구원·같은 수색이다.

| | 이익 브랜치 `payloadKind=relic` | 위험 브랜치 `payloadKind=threat` |
|---|---|---|
| 잠금 | 스폰 시 50:50. 공개 전까지 비공개 | 동일 |
| 수색 | 이벤트 행성·수락 중 **30%**로 공개 | 동일 30% |
| 공개 시 | 퀘스트 유물 1개 → `collect_item` 완료 | **미확인 위협** → 즉시 이동중형 전투 |
| 보상 | 유물 + 템플릿 CR/EXP. 전투 없음 | 승리 시 전투 CR/EXP + 템플릿 CR/EXP. **유물 없음** |
| 패배/도주 | — | 퀘스트 **실패** · 슬롯 해제 · 유물 없음 |
| 재시도 | 30% 실패 시 기존 수색(광물/CR/판테온 5%) | 공개 전만. 공개 후 패주면 연구원 포기 또는 실패로 종료 |

한 인스턴스가 유물과 전투를 **둘 다** 주지 않는다. 수색마다 독립 50:50을 굴리지 않는다.

### 6-1. 목표 (DSL 고도화 + 클론 스왑)

v1 DSL은 `buy_goods`가 “인벤 보유”로 끝난다. 의미상 구매와 겹치므로 **`collect_item`을 DSL v1.1로 추가**한다.

템플릿 `tq_anom_01`의 기본 목표는 `collect_item` / `relic_quest_anomaly_01`이다.

**클론 시 `payloadKind`에 따라 목표를 갈라** 한 인스턴스에 목표가 1개만 있게 한다. AND 완료(유물+격파)를 요구하지 않는다.

| payloadKind | clone 목표 | targetId |
|---|---|---|
| `relic` | `collect_item` | `relic_quest_anomaly_01` |
| `threat` | `defeat_enemy` | `unidentified_object` |

제목·설명은 양 브랜치 동일(「미확인 이상현상」). HUD 목표 문구는 공개 후에만 구체화해도 된다. 공개 전 HUD는 「잔해 수색으로 이상현상의 정체를 확인」.

`buy_goods` 배치 감사 대상이 **아님**. 무역소에 유물·위협을 올리지 않는다.

수락 후 48h. 만료 시 기존 만료 워치가 스윕한다. **`isCargoObjective`에 `collect_item`을 추가**해 인벤 유물을 회수한다(김클로드 P1-2). 지금 코드는 `buy_goods`/`deliver_cargo`만 본다.

연구원 재방문 반납·효과 해금 talk는 v1에 없음(포기는 §5-1).

### 6-2. 수색 확률

기존 판테온 5%(`RELIC_DROP_PCT`)는 **퀘스트가 비활성일 때 불변**.

수락된 `arc_anom_*`의 `offerPlanetId` === 수색 행성일 때만, 기존 판테온/광물/CR **앞에**:

```
1) 페이로드 미공개 · 30% → 공개
     relic  → kind=anomaly_relic  (퀘스트 유물 1 · 인스턴스당 1회 · 목표 완료)
     threat → kind=anomaly_threat (인벤 없음 · 즉시 전투)
2) 30% 실패 또는 이미 공개된 relic 이후 추가 수색
     → 기존 판테온 5% → 아니면 광물/CR
3) threat 공개 이후에는 이 행성에서 이상현상 선롤을 다시 하지 않음
     (전투는 수색 히트 1회만 기동. 패주=실패)
```

30%는 정책 CSV `questRelicSalvagePct=30`(이름 유지, 의미는 **페이로드 공개 확률**).  
50:50은 `payloadRelicWeightPct=50` / `payloadThreatWeightPct=50`.  
해시 시드는 기존 `salvageAttemptSeedKey`에 `anom:{instanceId}`를 얹는다.  
`payloadKind` 자체는 스폰 시 한 번만 굴린다(`spawn:{instanceId}`).

일일 수색 100회 한도는 그대로. 공개 히트도 그 한도의 1회로 센다.

`SalvageSearchOutcome`에 종류를 더한다.

```
| { kind: 'relic' | 'cash' | 'item' }          // 기존
| { kind: 'anomaly_relic'; itemId }            // 퀘스트 유물
| { kind: 'anomaly_threat'; instanceId }       // 인벤 없음
```

`planet.tsx` `handlePlanetSalvageSearch`가 `anomaly_threat`면 알림 후 §6-3으로 넘긴다. 기존 relic/cash/item 분기는 그대로.

### 6-3. 미확인 위협 — 이동중 전투와 같은 형태

수색에서 위협이 공개되면 **즉시** 이동중 전투와 **같은 화면·같은 엔진**으로 들어간다. 항로 이동이 아니다.

| 항목 | 정본 |
|---|---|
| 화면 | `app/(game)/combat.tsx` — STAGE 3 · Skia 단일 경로 · 1:1 |
| 배경 | `TransitCombatSkiaParallaxBackdrop` (이벤트 행성 성계) |
| 시드 | `buildTransitCombatSeedSlots` + 전용 레드 슬롯 |
| 진입 | 허브 수색 → `releasePlanetMainStageSession` → `Navigation.replace('/(game)/combat')` |
| 세션 | `useTransitCombatSessionStore.begin`에 `kind: 'anomaly_threat'`, `returnTo: 'planet'`, `planetId` |
| 복귀 | 종료 후 **월드맵이 아니라 수색하던 행성 허브** (`replace` planet) |
| 항로 보장조우 | **없음**. `shouldGuaranteeQuestTransitEncounter`가 이 락을 true로 보면 안 됨 |

#### 왜 `transit_guaranteed`를 쓰지 않는가

위협 클론에 `defeat_enemy`가 있으면 `resolveQuestCombatLock`이 잡을 수 있다. 정책이 `transit_guaranteed`이면 **은하 지도 아무 이동**에서 강제 조우가 새어 나온다. 이 퀘스트의 위험은 **그 행성 수색**에만 있다.

신규 정책 **`anomaly_salvage_forced`**:

- `questCombatLock.ts` `QUEST_COMBAT_ENCOUNTER_POLICIES`에 append  
- venue 매핑 → `'transit'` (완료 판정용)  
- `shouldGuaranteeQuestTransitEncounter` → **false**  
- `canCompleteQuestDefeatEnemy`는 venue=`transit` + `enemyTemplateId===unidentified_object`로 승리 완료  
- `lookupMissionForQuestLock`에 `arc_anom_` 포함  
- `resolveQuestLockTransitEncounterLevel`의 **플레이어 레벨 캡을 이 세션에 적용하지 않음** (강적을 약화시킴)

`mission_quest_combat_ops.csv`에 위협 목표 1행만. 유물 클론에는 combat ops 행이 **없다**.

#### 적 — 미확인 물체 (아주 강함)

판테온·기존 해적 풀을 쓰지 않는다. Table-First **전용 행**.

| 축 | id / 값 |
|---|---|
| 표시명 | 미확인 물체 |
| 함장 | `npc_cpt_unidentified_object` (`npc_ai_captains.csv`) |
| 전함 | `npc_ship_unidentified_object` (`npc_ai_ships.csv` + 장비 슬롯) |
| 목표 targetId | `unidentified_object` |
| 네임플레이트 | 위장 없이 「미확인 물체」. 섀도우 리빌과 무관 |
| 대화 | 전투 전 1차 한 줄만 가능. NL 입 없음 |

강도(기존 행성 TCL 행은 **변경하지 않음**):

```
threatTcl = min(60, resolvePlanetTargetCombatLevel(eventPlanetId) + threatTclAdd)
threatTclAdd 기본 15  (정책 CSV)
```

mid_early TCL 9~18 → 실전 24~33. late 40~60 → 55~60. **그 지역 이동중 해적보다 한 체급 위**. 헐은 권장 함급보다 한 단계 위이거나 전용 실루엣. affinity `heavy` 또는 `shielded`. 함대 1척(이동중과 동일 1:1).

전용 함선 스탯은 CSV 신규 행으로 맞춘다. 기존 `npc_mock_ai_ship_*` 수치를 덮어쓰지 않는다.

#### 전투 결과

| 결과 | 퀘스트 | 이벤트 | 유물 |
|---|---|---|---|
| 승리 | `defeat_enemy` 완료 · 템플릿 보상 | `settleAnomalyEvent('cleared')` · 링 소거 | 없음 |
| 패주/패배 | **실패** (`failed`) | `settleAnomalyEvent('failed')` · 슬롯 해제 | 없음 |

승리 보상은 기존 이동중 전투 CR/EXP + 템플릿 rewards. 위협 승리로 퀘스트 유물을 주지 않는다(그러면 이길 수 있으면 위협이 유물보다 이득).

진입 직전 팝업(짧게): `미확인 위협` / `잔해에서 미확인 물체가 반응합니다.` — `setTimeout(0)` 후 replace. 전투 중 포기는 §5-1대로 불가.

WAVE 전투·허브 궤도 레이드·FPS HOLD 축은 **손대지 않는다**.

---

## 7. 퀘스트 전용 유물 — 기반만

판테온 `relic_seat_*` / 도감과 **분리**. 12좌를 소비하지 않는다.

| 항목 | 값 |
|---|---|
| item id | `relic_quest_anomaly_01` |
| item_defs | `type`/`tagsPipe` = `relic\|quest_anomaly` · 거래 불가 · 스택 1 |
| extras | `{ "questRelicEffectId": "" }` |
| 효과 런타임 | `src/game/questRelic/questRelicEffectRegistry.ts` — `resolveQuestRelicEffect` **no-op** |
| 인벤 진입 훅 | `onQuestRelicAcquired(itemId)` — 목표 완료 + 레지스트리 호출. 효과 본문 비움 |

추후 특수기능 1~2개: `quest_relic_effects.csv`에 `effectId`를 넣고 레지스트리만 채운다. 전투/센서/수색 행운은 **이번 범위 밖**.

클리어 CR/EXP는 `tq_anom_01` rewards. 유물은 보상 칸이 아니라 **이익 브랜치 목표 아이템**.

미확인 위협은 인벤 아이템이 아니다. `anomaly_threat_signal` 같은 더미를 persist하지 않는다.

---

## 8. 데이터 · 스토어 · 메모리

### 8-1. Table-First (신규만, 기존 행 불변)

| 파일 | 내용 |
|---|---|
| `tables/balance/unidentified_anomaly_policy.csv` | concurrent=1, dailySpawn=2, unacceptedTtlHours=12, questRelicSalvagePct=30, payloadRelicWeightPct=50, payloadThreatWeightPct=50, threatTclAdd=15, cooldownDays=3, historyCap=8, band weights, baseSpawnChancePct |
| `tables/content/missions.csv` | `tq_anom_01` 1행 (`timeLimitHours=48`) |
| `tables/content/mission_objectives.csv` | `collect_item` 기본 1행. 위협 목표는 클론 스왑 |
| `tables/content/mission_quest_combat_ops.csv` | 위협 목표 1행 · `anomaly_salvage_forced` · `unidentified_object` |
| `tables/content/item_defs.csv` | `relic_quest_anomaly_01` append |
| `tables/content/npc_ai_captains.csv` | `npc_cpt_anomaly_researcher` · `npc_cpt_unidentified_object` |
| `tables/content/npc_ai_ships.csv` + 장비 슬롯 | `npc_ship_unidentified_object` |
| 대화 페이지 CSV | 연구원 수락/포기 1차 · (선택) 위협 조우 1줄 |

기존 분쟁 링 색 · 판테온 5% · 바 슬롯 · 식별 규칙 · 수색 일 100회 · 행성 TCL 행 · 이동중 해적 테이블은 **변경 없음**.

### 8-2. 계정 스토어

`arcfire_unidentified_anomaly_v1` — **로컬 AsyncStorage만**. Firestore `onSnapshot` 없음. `arcfire_player_v1` 프로필 단발 write·cloud extras에 **포함하지 않음**. 계정 귀속 · `purgeLocalAccountData` 연동.

```
active: {
  planetId, systemId, instanceId,
  spawnedAtMs, unacceptedExpiresAtMs, acceptedExpiresAtMs,
  status,                 // listed | accepted | revealed
  payloadKind,            // relic | threat — UI 비공개 until revealed
  payloadRevealed
}
spawnCountToday, spawnDayKeyKst
recentResolved: { planetId, resolvedAtMs, reason }[]  // cap 8
```

식별 풀은 저장하지 않는다. `inspectedPlanetInfoIds` + band를 그때 계산.

### 8-3. PSS

```
[pss-pre-dev] hot_path=식별 1회 롤 + 일 2번째 프로브 1회 + 수색 클릭 1회 alloc=이벤트 1 + 전투 세션 1 cache=식별 풀 worldStore
[pss-pre-dev] stage=전역 1 timeout(TTL/48h) · 맵 성계 id 1 · 전투는 기존 STAGE 3 replace/dispose risk=P1
[pss-pre-dev] verdict=구현 시 PASS — 60초 전은하 순회 금지 · 전투 루프 Make() 금지 · 새 rAF 없음
```

링은 분쟁과 같이 포그라운드에서만 View. 13번째 서브코어 금지. DailyOps 배치에 넣지 않음.

### 8-4. 이중 스토어 정리 — `settleAnomalyEvent` (김클로드 P1-1)

링·동시 1·이력은 anomaly 스토어, 진행·만료는 `missionStore`다. **한 함수만** 이벤트 수명을 닫는다.

```
settleAnomalyEvent(reason: cleared | expired | abandoned | failed | unaccepted_ttl)
  1) active = null · 링 데이터 제거
  2) recentResolved push (cap 8)
  3) 인벤 퀘스트 유물 회수 (있을 때만)
  4) 해당 arc_anom_* progress가 아직 살아 있으면 만료/실패/클리어에 맞게 정리
```

호출 지점:

| 누가 | 언제 |
|---|---|
| `afterAnomalyMissionSettled` (`afterCaptainPersonalMissionSettled`와 동일 패턴) | 미션 만료 스윕·클리어·실패가 `arc_anom_*`를 지울 때 |
| anomaly 전역 1 `setTimeout` | `unacceptedExpiresAtMs` 또는 `acceptedExpiresAtMs` 도래 |
| hydrate / AppState `active` | 이미 지난 TTL·48h면 **부팅·포그라운드 1회** 캐치업 |
| 연구원 포기 · 위협 패주 | UI 경로에서 직접 |

둘 중 하나만 살아도 슬롯이 풀린다. 두 번 호출돼도 idempotent.

---

## 9. 플레이 흐름

```
외곽 행성 착륙 → 행성정보 식별
        │
        ├─ 주사위 실패 / 한도 / 쿨다운 → 없음
        └─ 성공 → 레코드 1건 · payloadKind 50:50 잠금(비공개) · 팝업 · 보라 링
                │
                ▼
        착륙 → 바 → 연구원(모호 브리핑) → 수락
                │
                ▼
        그 행성 잔해 수색 (30% 공개)
                │
                ├─ relic  → 유물 인벤 → collect_item 완료 → 보상 · settle · 링 소거
                ├─ threat → 「미확인 물체」이동중형 전투
                │              ├─ 승 → defeat_enemy 완료 · 전투+템플릿 보상 · 유물 없음 · settle
                │              └─ 패주/패 → 퀘스트 실패 · settle · 유물 없음
                └─ 미공개 실패 → 기존 수색(광물/CR/판테온 5%) · 재시도
```

만료: 미수락 12h 또는 수락 후 48h → `settleAnomalyEvent` · 링 소거 · 유물 회수.

---

## 10. 구현 단계 (승인 후)

| 단계 | 내용 | 게이트 |
|---|---|---|
| P0 | 정책 CSV · 스토어 · 식별/일일 스폰 · 팝업 · 보라 링 · `settleAnomalyEvent` + 부팅 캐치업 | tsc · 스폰/정리 단위 테스트 |
| P1 | `tq_anom_01` · `arc_anom_` clone(`timeLimitHours`) · §2-1 헬퍼 OR · 연구원 수락/포기 | integrity · 메인스토리 비연결 · 바 탭/HUD 핀 |
| P2 | `collect_item` + `isCargoObjective` · 수색 30% 공개 · 50:50 스왑 · 유물 훅 | salvage 테스트 · 판테온 5% 회귀 · 만료 회수 |
| P2b | `anomaly_salvage_forced` · 미확인 물체 CSV · 허브→combat replace · 복귀 행성 · 항로 비가드 | tsc · `shouldGuaranteeQuestTransitEncounter=false` 테스트 · 기존 이동중 조우 회귀 |
| P3 | 만료 워치 연동 · purge · 일 2회/동시 1/쿨다운 3일 | account reset · 만료 회수 · 이중 스토어 정리 |

---

## 11. 명시적 비범위 (v1.1)

- 메인스토리 bind · 연퀘  
- 바 게시판 칸 잠식 · 연구원 후원/음주  
- 전 퀘스트 공통 포기 API  
- 판테온 좌 대체 · 유물 특수효과 본문  
- 위협 승리 시 유물 지급 · 유물+전투 이중 보상  
- 연구원 재방문 감정/해금  
- 이상현상 전용 월드오브젝트 신설 (수색은 **기존 잔해**)  
- 분쟁 링 색/주기 변경 · 행성 TCL 기존 행 변경  
- 웨이브 디펜스·허브 궤도 레이드·WAVE FPS HOLD 축  
- 항로 `transit_guaranteed`로 위협 전투를 여는 것  

---

## 12. 승인 체크 (구현 전)

- [ ] 동시 1 · 일 2(스폰) · 외곽 가중 · 식별=착륙+행성정보  
- [ ] `arc_anom_` + `tq_anom_01` · 바 슬롯 비침범 · 메인퀘 비연결 · §2-1 헬퍼 배선  
- [ ] 분쟁 링 재사용 · 보라 tint · 팝업 범용 · `settleAnomalyEvent`로만 링/슬롯 해제  
- [ ] 미수락 TTL **고정 12h** · 재당첨 3일 제외 · 연구원 포기(이 퀘스트만)  
- [ ] 스폰 시 payload 50:50 · 수색 30% 공개 · 유물 또는 미확인 물체 전투 (둘 다 아님)  
- [ ] 위협 = 이동중형 STAGE 3 · 복귀는 행성 허브 · `anomaly_salvage_forced`(항로 비가드)  
- [ ] 미확인 물체 전용 CSV · `threatTclAdd=15` · 기존 TCL/판테온 5%/수색 100회 불변  
- [ ] `collect_item` 만료 회수 · 유물 효과 훅만 · 로컬 스토어(클라우드 미포함)  
