# 김클로드 착수 — 계정 초기화 시 소유권 구매 성계 **중립화**

> **배정**: 김팀장 (Cursor 본창) · **2026-07-28**  
> **대표님 점검 요청**: 소유권 구매 성계 **2곳**(드라코 성운 `draco_haven` · 시리우스 `sirius_border`)이 **계정 삭제/초기화** 시 **중립화**되는지. 불명확하면 초기화 처리 보강.  
> **김팀장 전수검사 결론**: **불명확·미충족** — 현재는 「중립화」가 아니라 **CSV 시드 팩션 복원**이며, 후속 안전망이 시리우스 재구매 경로를 막음. **추가 작업 필요.**  
> **김클로드 즉시 착수** · 완료 후 handoff **PENDING** · **git commit 금지**  
> **task_id**: `account-purge-ownership-neutralize-20260728`

---

## [pss-pre-dev]

```text
[pss-pre-dev] hot_path=계정purge1회 · alloc=holds맵부분갱신 · cache=없음
[pss-pre-dev] stage=타이틀복귀전 · risk=P6(persist1회)·ArcCore월드축오삭제금지
[pss-pre-dev] verdict=PASS — 틱/루프추가금지·player_independent해제만·시드팩션영토진행보존
```

---

## 0. 김팀장 점검 결과 (코드 근거)

### 0-1. 대표님 시나리오

| 성계 | planetId | 구매 후 | 기대(대표님 「중립화」) |
|------|----------|---------|------------------------|
| 드라코 성운 | `draco_haven` | `player_independent` | 계정 삭제 후 **플레이어 독립국 해제 + 중립** |
| 시리우스 | `sirius_border` | `player_independent` | 동일 |

### 0-2. 현재 purge 경로

`purgeLocalAccountData` (`src/account/localAccountReset.ts`):

1. `purgePlayerAccountWorldState` → `releasePlayerPlanetHolds(mode: purge_account)`
2. `purgeAllNonAiClanWorldState` → `releasePlayerPlanetHolds(mode: purge_all_non_ai)`
3. `resetDynamicContestedZonesForAccountPurge` (동적 분쟁 복귀)

### 0-3. 복원 정책 = **시드 복원** (중립화 아님)

`restoreHoldAfterPlayerRelease` (`planetHoldReleasePolicy.ts`):

```text
occupierClanId / kind ← resolveSeedOccupierClanForPlanet(planetId)  // CSV initialOwner
deedOwnerClanId ← null
```

| planetId | CSV `initialOwner` | purge 후 실제 | 「중립」? |
|----------|-------------------|---------------|-----------|
| `draco_haven` | **BLUE** | BLUE `clan_hold` | ❌ |
| `sirius_border` | **RED** | RED `clan_hold` | ❌ |

구매 해제(독립국 라벨 제거)는 되지만, **전투/증서 의미의 중립화(`occupier=neutral` · `neutralizedAt`)는 아님**.

### 0-4. 시리우스 재구매 구멍 (제품 리스크)

`canPurchasePlanetOwnershipDeed` — `territorialSide === 'red'` → **구매 거부**.

- 시리우스 시드 = RED → purge 후 RED 복원 → **신규 계정에서 소유권 재구매 불가**(다시 전투 중립화 필요).
- 드라코는 BLUE 시드라 재구매는 가능하나, 그것도 「중립화」는 아님.

### 0-5. `purge_all_non_ai` 과잉 범위 (동반 결함)

```text
mode === 'purge_all_non_ai' → !occupierClanId.startsWith('ai_clan_')
```

→ **국가 시드 BLUE/RED·중립 hold까지** 전부 release 후 **CSV 시드 재적용**.  
계정 초기화 예외(ArcCore 월드 축 유지)와 충돌 — ArcCore 영토 판정 진행을 purge가 지울 수 있음.  
또한 1단계에서 중립화해도 2단계에서 **시드 덮어쓰기**로 되돌아갈 수 있음.

### 0-6. 주석/코드 불일치

`dissolvePlayerClanByPurchase` JSDoc: 「점유 행성 **neutral(디폴트) 복귀**」  
실제: **시드 복원**과 동일 경로.

### 0-7. 테스트 공백

`planetHoldReleasePolicy` **단위테스트 없음**.  
`draco_haven`/`sirius_border` 구매 → purge → hold 상태 assertion **없음**.

---

## 1. 제품 1안 (김팀장 · 대표님 「중립화」에 맞춤 — 고정)

| 해제 대상 | purge / 클랜 해산 후 hold |
|-----------|---------------------------|
| `kind === 'player_independent'` | `occupierClanId='neutral'`, `kind='neutral'`, `deedOwnerClanId=null`, `homePlayerUid=null`, **`neutralizedAt=Date.now()`** (또는 purge 시각) |
| `kind === 'player_home'` (거점) | 기존 dissolve와 정합 — hold 제거 또는 동일 중립화(구현 시 dissolve 경로와 **한 정책**) |
| ArcCore/국가 시드 BLUE·RED 영토 | **건드리지 않음** (플레이어 유래가 아니면 release 금지) |

**금지**: 플레이어 독립국 해제를 CSV `initialOwner` BLUE/RED로 되돌리기(현행).  
**허용**: `resetDynamicContestedZonesForAccountPurge` 유지(시리우스 동적 분쟁 편입 해제).

---

## 2. 범위 (M0~M5)

### ✅ 김클로드

| # | 내용 |
|---|------|
| **M0** | 본 READY §0을 handoff에 3~6줄로 인용 · 「시드복원≠중립화」·시리우스 RED 재구매 구멍 명시 |
| **M1** | `planetHoldReleasePolicy.ts` — `restoreHoldAfterPlayerRelease`를 **모드·hold.kind 분기**: `player_independent`(및 플레이어 증서 점유) → **§1 중립화**; CSV 시드 복원은 **국가/AI 영토용으로만** 쓰거나 플레이어 해제 경로에서 제거 |
| **M2** | `purge_all_non_ai`의 `shouldReleaseHold`를 **플레이어 유래만**으로 축소 (`isPlayerOriginatedClanId(occupier|deedOwner)` · `player_independent` · `player_home` · orphan 플레이어 클랜). **`balance_seed_faction_*` / 순수 국가 시드 hold는 release하지 않음** |
| **M3** | `localAccountReset` 연동 확인 — 1→2단계 후에도 `draco_haven`/`sirius_border`가 **neutral 유지**(시드로 덮이지 않음). persist·클라우드 삭제 기존 유지 |
| **M4** | 단위테스트 신설 `planetHoldReleasePolicy.test.ts` (또는 동등): (1) 두 행성 독립국 hold → `purge_account` → neutral+neutralizedAt·deed null (2) 동일 입력 후 `purge_all_non_ai` 연타해도 neutral 유지·시드 BLUE/RED **미복귀** (3) 인접 국가 시드 hold(예: `iron_remnant` BLUE)는 purge_all_non_ai에 **불변** (4) 하드코딩 `if (planetId==='draco_haven')` 금지 — 일반 규칙으로만 |
| **M5** | (선택) dissolve 경로도 동일 중립화로 주석·동작 일치 · FrontPressure invalidate는 systemId 있을 때 기존 패턴 재사용 |

### ❌ 금지

- `planet_occupation_seeds.csv` / territorial policy **기존행 무단 변경**
- ArcCore 일일배치·가격탄력·Skia/STAGE UI 대공사
- `purgeLocalAccountData`에서 faction vault·무역 수수료·섀도우 페어 등 **월드축 예외** 삭제
- planetId 하드코딩 분기 · git commit · 「완료」선언

---

## 3. self-check (김클로드)

```bash
npx tsc --noEmit -p tsconfig.client.json
npx tsx --test src/clanWar/planetHoldReleasePolicy.test.ts
# (연관 있으면) seedPlanetOccupation / ownership 테스트 회귀
```

handoff에 `[pss-pre-dev]` 3줄 · M0~M4 결과 · soft(실기 계정초기화 미확인 여부) 기록.

---

## 4. 김팀장 검수 포인트

- [ ] 드라코·시리우스 독립국 → purge 후 **neutral** (BLUE/RED 시드 복귀 ❌)
- [ ] `neutralizedAt` 설정 · 증서/`deedOwner`/`homePlayerUid` 클리어
- [ ] `purge_all_non_ai`가 국가 시드 영토를 지우지 않음
- [ ] 시리우스: purge 후 신규 계정이 **neutral이라 증서 재구매 가능**(red_territory 거부 해소)
- [ ] tsc · unit PASS · commit 없음
