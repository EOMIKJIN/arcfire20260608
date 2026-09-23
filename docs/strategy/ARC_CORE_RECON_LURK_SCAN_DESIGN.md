# 아크코어 정찰매복 · 스캔 고도화 설계

> **문서 버전**: v0.1  
> **작성**: 2026-09-10  
> **상태**: **설계 정본 · 구현 대기** — 대표님 지시: 설계 후 단계적 기반 코드  
> **헌법**: v4.0 §6-2(궤도 최대 5) · §8·§14 · PSS §0-A · Table-First · **13번째 서브코어 금지**  
> **표시**: 사용자는 「대표님」

```text
[pss-pre-dev] hot_path=스캔완료 1회 롤 / 배치·epoch 배치 1회 alloc=행성당 잠복 슬롯 ≤1(+후 2)
[pss-pre-dev] cache=planetId 키 · 틱 전량 rebuild 금지
[pss-pre-dev] stage=허브 스캔 액션만 · 미발견 시 Skia/Views 추가 없음
[pss-pre-dev] verdict=PASS — 구현은 Phase 1부터. 본 문서는 코드 없음
```

---

## 0. 한 줄

아크코어가 **실제로** 행성에 정찰매복 전함을 잠복시킨다.  
플레이어 **스캔**(기존 버튼)이 스파이와 **다른 축**으로 그 함을 발견·격파·도주 판정한다.  
스킬·연구소는 그 세 확률에만 얹는다.

---

## 1. 지금 있는 것 (깨면 안 됨)

| 축 | 하는 일 | 하지 않는 일 | 정본 |
|----|---------|--------------|------|
| **스캔** | 5~10초 게이지 → 허브 액션 잠금 해제(채굴 등) | 적·스파이 탐지 없음 | `PlanetMainScanActionRow` · `planetHubScanUnlockState` · `handlePlanetScanComplete` |
| **수색** | 잔해(`wreck`) 회수 | 적 탐지 아님 | `handlePlanetSalvageSearch` |
| **스파이** | 전투 비참여 함장 ~1% 태그 · 궤도 체류 시 T 펄스 · 정보원 대화 · 채팅 `get_spy_alert` | 스캔과 미연결 · 색출은 `exposeArcCoreSpyCaptain`(스킬 미연동) | `ArcCoreSpySubCore` · `arc_core_spy_policy.csv` |
| **스킬 예약** | `sensor_array`(`sensor_range`) · `counterintel_array`(`spy_detect`) · 연구소 대테러 | `sensor_range`는 허브 스캔에 **미사용**. `spy_detect`는 정보원 알림만 | `tables/content/skills.csv` |

스파이와 정찰매복은 **같은 적이 아니다.**  
스파이 = 위장 체류·백도어. 정찰매복 = **잠복 중인 적 전함**(정찰·습격 대기).

---

## 2. 목표 · 비목표

### 한다

1. 아크코어 운용으로 행성(기본: 플레이어 정박)에 **잠복 슬롯**이 실제로 있다.
2. 스캔 완료 시 **발견 / 격파 / 도주** 확률을 한 번만 굴린다.
3. 이후 스킬·스캔 업그레이드·연구소가 그 확률에 가산될 **구멍**을 처음부터 연다.
4. 스파이 패턴을 복제한다: Table-First 정책 · 결정론 태그/시드 · expel류 결과 · 입(채팅)은 읽기만.

### 하지 않는다 (본 설계)

- 13번째 서브코어
- 스캔/수색 버튼 신설 · STAGE 1 레이아웃 상수 변경
- 미발견 잠복함을 궤도 5척 트래픽·Skia에 그림
- 스파이 T 펄스·정보원 자동 대화를 정찰매복에 재사용
- 틱마다 재롤 · 고빈도 persist · 전 행성 동기 루프(부트/onBoot)
- 경제 금고·가격·점유 write · 미션 수락/클리어
- ObservationBus / learning-state 필수 의존 (나중 관측 훅만 예약)
- 지금 스킬 CSV 수치 변경 (`sensor_range` 20 등 기존값 유지)

---

## 3. 세계 몸 — 잠복은 연출이 아니라 운용

### 3-1. 왜 스파이 태그만으로 부족한가

스파이 풀은 `operationalState !== 'combat'` 함장에 해시 태그를 붙인다.  
정찰매복은 **전투 가능 정찰함**이어야 하므로 별 풀·별 presence가 필요하다.

### 3-2. 소유 (서브코어 추가 없음)

| 역할 | 기존 축 | 이유 |
|------|---------|------|
| 배치·슬롯 갱신 | `ArcCoreDailyOpsSubCore` 일 1회 패스 **또는** 함장 presence epoch (스파이 태그처럼 동기 틱 없음) | 고빈도 금지 |
| 궤도에 “있음” | `AiNpcSubCore` / captain presence 인덱스 | 세계 출현 단일 계약 |
| 스캔 판정 | 플레이어 스캔 완료 1회 (허브) | 입·액션. 서브코어 틱 아님 |
| 격파·도주 후 이탈 | 기존 `npc_eject_captain_orbit` 명령 + 계정 결과 스토어(스파이 expel과 형제) | 버스 재사용 |

모듈 위치(구현 시): `src/arcCore/reconLurk/` — `spy/` 형제. **새 서브코어 클래스 없음.**

### 3-3. Presence

신규 activity (구현 시 타입 1개만 추가):

`orbit_recon_lurk`

- `hubOrbitCaptainIdsByPlanet` **가시 목록에 넣지 않음** (STAGE 1 5척 예산 유지)
- 별도 `lurkCaptainIdsByPlanet` O(1) 조회
- 스캔으로 **발견됨** 뒤에만 마커/오버레이. 미발견 = 렌더 0

### 3-4. 슬롯 한도

| Phase | 한도 |
|-------|------|
| 1~3 | 플레이어 `currentPlanetId`당 **잠복 0~1** |
| 이후 | 최대 2. 전 은하 상시 스폰 금지 |

`player_planet_only=1`을 스파이와 같이 기본으로 둔다.  
없음이 정상이다. 매 착륙마다 적이 있으면 안 된다.

### 3-5. 풀 (Table-First)

스파이 `spy_pool_fraction_pct`와 같은 방식:

- 정책 CSV: `tables/balance/arc_core_recon_lurk_policy.csv` (구현 Phase 1 · Fable)
- 결정론 해시 `arcCoreReconLurkTag:v1:{captainId}` — 전투 가능 함장/정찰 함급만
- 인스턴스는 CSV를 런타임에 덮어쓰지 않음. 점유만 런타임 슬롯

함 인지 문구는 기존 전함 분류(§7-2)를 따른다. 새 유령 스토어 금지.

### 3-6. 일일/epoch 배치 내용

행성에 슬롯을 둘지(점유율) · 어떤 함장/함선 id · 만료(다음날 또는 epoch).  
**배치에서 발견/격파 롤을 하지 않는다.** 롤은 스캔 완료만.

---

## 4. 스캔 판정 — 한 번의 완료, 세 갈래 확률

기존 `handlePlanetScanComplete` **뒤에** 순수 함수 1회.  
잠금 해제는 그대로. 스캔 실패로 채굴이 잠기지 않는다.

### 4-1. 입력

- 이 행성 잠복 슬롯 (없으면 즉시 return)
- 정책 기본 % + 스킬/연구소 보너스(구멍만, Phase 5)
- 시드: `planetId + lurkId + scanSeq` — 같은 스캔을 틱이 다시 굴리지 않음

### 4-2. 순서 (고정)

```text
1) 발견 롤  fail → 잠복 유지. UI 추가 없음 (스캔 해금만)
2) 발견 성공 → 공개(세션). 그다음 적 반응:
   2a) 도주 롤  success → 이탈 · 「놓쳤다」
   2b) 도주 실패 → 격파 롤
        성공 → expel/이탈 · 「격파」(Phase 3는 전투 없이 판정만)
        실패 → 「발견·잔존」· 교전 제안은 Phase 4
```

말: 평소 짧은 오버레이(`showArcAlert` / compact). 목록·보고서 금지.

### 4-3. 기본 곡선 (구현 시 CSV · 지금 수치 확정 아님)

설계 자리만 연다. **기존 스킬/스파이 %를 덮지 않는다.**

| 키 | 의미 | 가산 예약 |
|----|------|-----------|
| `lurk_detect_pct` | 발견 | `sensor_range` · 이후 `lurk_detect` · 연구소 탐지 |
| `lurk_flee_pct` | 발견 후 도주 | 낮추는 쪽: 스캔 업그레이드 · 방위위성 |
| `lurk_destroy_pct` | 도주 실패 후 즉시 격파 | 이후 `lurk_destroy` · 방위위성 요격 |

Phase 1 정책은 placeholder + `enabled=0`으로 넣어도 된다. 라이브 롤은 Phase 2.

### 4-4. 스킬 구멍 (Phase 5 · 기존값 변경 재확인)

| 기존 | 연결 |
|------|------|
| `sensor_array` / `sensor_range` | 발견 % 가산 (허브 스캔에 처음으로 사용) |
| `counterintel_array` / `spy_detect` | **스파이 전용 유지**. 매복 발견에 섞지 않음 |
| `arc_threat_analyzer` / `anti_terror` | 스파이·드론. 매복 격파에 기본 비사용 |
| 신규 스킬 | 필요 시 `sensor_array` 하위만 추가. 기존 행 수치 변경은 대표님 재승인 |

연구소: 스파이 탐지와 **별 필드**(예: 정찰 탐지 %). 한 숫자로 두 축을 섞지 않음.

---

## 5. UI · 입 · 메모리

### 5-1. UI

- 버튼 추가 없음. 스캔 게이지 완료가 유일한 입구.
- 발견 시 compact 오버레이. `ArcOverlayHost`만.
- 정보원 자동 대화는 스파이 전용. 매복이 대화를 가로채지 않음.
- inbound why에 `recon`을 **당장 넣지 않음** (채팅 축 확장 = 이후).

### 5-2. 영속

| 데이터 | 분류 | 이유 |
|--------|------|------|
| 잠복 슬롯(누가 어디에 숨음) | **아크코어 세계** | 계정 purge에 안 지움 (스파이 태그와 동일 계열) |
| 이 계정 격파·도주시킨 함장 id | **플레이어** | `purgeLocalAccountData` 연동 (스파이 `arcCoreSpyExpelledStore` 형제) |
| 이번 착륙 스캔에서 공개됨 | **세션** | 행성 이탈 시 `planetSessionRegistry` dispose |

persist: 결과 1건당 즉시 JSON 금지. 스파이 expel처럼 이벤트 후 1회.

### 5-3. STAGE / Skia

- 미발견: Path/Canvas/마커 0
- 발견 잔존(Phase 4 전): RN 오버레이 또는 기존 궤도 마커 1. 신규 고프레임 루프 금지
- 교전(Phase 4): 기존 `replace()` → STAGE 3 → dispose 후 복귀

---

## 6. 스파이와의 경계 (혼선 방지)

| | 스파이 | 정찰매복 |
|--|--------|----------|
| 정체 | 위장 체류 함장 | 잠복 적 전함 |
| 가시 | 궤도 트래픽에 섞일 수 있음 | 발견 전 비가시 |
| 피해 | T 펄스 (8초, 플레이어 행성) | 기본 없음. 이후 습격은 별 설계 |
| 알림 | 정보원 · `spy_detect` | 스캔 롤 · `sensor_range` |
| 색출 | `exposeArcCoreSpyCaptain` | 스캔 격파/도주 |
| 채팅 | `get_spy_alert` | Phase 5 이전 도구 추가 없음 |

한 스캔이 스파이 색출을 **겸하지 않는다.**  
스파이 색출을 스캔에 얹는 것은 별 승인(기존 정보원 연출과 충돌).

---

## 7. 단계 (코드는 이 순서만)

| Phase | 담당 | 산출 | 완료 조건 |
|-------|------|------|-----------|
| **0** | 김팀장 | 본 문서 | 대표님 설계 잠금 |
| **1** | Fable + 김팀장 연동 | 정책 CSV · 태그 풀 · presence 슬롯 조회(렌더 0) · `enabled=0` 가능 | tsc · 테이블 빌드 · 틱 할당 없음 |
| **2** | 김팀장 | 스캔 완료 → 발견 롤만. 성공 compact 알림 | 스캔 해금 회귀 없음 · PSS 1차 |
| **3** | 김팀장 | 도주·격파 롤 · eject · 플레이어 결과 스토어 + purge | 계정 초기화 연동 |
| **4** | 김팀장 | 잔존 시 교전 입구(기존 전투 경로만) | Skia audit · `replace()` |
| **5** | Fable 스킬 행 **추가분만** + 김팀장 가산 | `sensor_range`→발견. 신규 stat는 추가 행만 | 기존 스킬 수치 무단 변경 금지 |

Phase 1 착수는 대표님 「기반 코드 진행」 이후.

---

## 8. 금지 · 회귀

1. `Navigation.navigate` · 스캔용 새 STAGE  
2. 허브 스캔 행에 타일 추가 (`planetMainStageLayout` 상수 변경)  
3. 매 프레임/2초 잠복 재배치  
4. `aiVirtualPlayerStore` 부활  
5. 발견 전 Skia 함선  
6. 스파이 `spy_intel_notify_pct`(현재 100) 등 **기존값**을 매복 밸런스 명목으로 변경  
7. 김경제 세션에서 CSV/코드 수정  

---

## 9. 잠근 전제 (더 묻지 않음)

- 입구 = **기존 스캔 버튼** 하나  
- 수색 = 잔해 유지  
- 13좌 서브코어 없음  
- 세계 슬롯 + 플레이어 결과 분리  
- 발견 실패는 조용함 (해금만)  
- 교전은 Phase 4. 그 전 격파는 판정+이탈  

대표님 승인 후 Phase 1부터 착수한다.
