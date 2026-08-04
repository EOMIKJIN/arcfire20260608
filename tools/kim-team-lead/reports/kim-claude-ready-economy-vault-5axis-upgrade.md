# 김클로드 착수 — 경제 금고 5축 고도화 (라우팅·신규 2축 · 계정 초기화 중립)

> **배정**: 김팀장 · **2026-08-04** · 대표님 「금고 시스템 고도화 전수 조사 후 김클로드 작업지시」  
> **task_id**: `economy-vault-5axis-upgrade-20260804`  
> **분석 정본**: `docs/economy-evaluation/2026-08-04-vault-5axis-reaudit.md`  
> **김클로드**: 정본 §1~§8 재검수(AGREE/PARTIAL/DISAGREE) → Phase 구현 → handoff **PENDING** · **git commit 금지**

---

## 0. [pss-pre-dev]

```text
[pss-pre-dev] hot_path=무역수수료·일1회upkeep·금고 hydrate · alloc=txn append only · cache=vault persist 1.5s
[pss-pre-dev] stage=월드 금고(1~4)·플레이어 독립 금고(5)·계정 purge · risk=P6 persist·P5 landing·P1 아님
[pss-pre-dev] verdict=PASS — 라우팅 세분화·신규 store 2개·purge 계약; onBoot 대연산 금지
```

---

## 1. 목표 (대표님 정본 5축)

| # | 금고 | storage (신규 시) | purge |
|---|------|-------------------|-------|
| 1 | **아크코어=RED=중앙은행** (동일 인스턴스) | 기존 `arcfire_arc_core_vault_v1` | 월드 · **유지** |
| 2 | **아크코어 수송선단** | 기존 fleet bank | 월드 · **유지** |
| 3 | **블루 팩션** | 기존 blue vault | 월드 · **유지** |
| 4 | **중립국** | `arcfire_neutral_nation_vault_v1` **NEW** | 월드 · **유지** |
| 5 | **독립국**(소유권 구매 행성) | `arcfire_player_independent_nation_vault_v1` **NEW** | **purge 시 제로** + 행성 **중립국화** |

**비협상**: 기존 수수료율·유지비 800·price_elasticity=0·일1회 배치 · **기존 3키 잔액 강제 리셋/재시드 금지**(중립 분리 시 과거 arccore 잔액 **이동 안 함** — 분석 1안).

---

## 2. Phase (순서 고정 · 반쪽 금지)

### Phase 0 — 재검수·정본 동기 (코드 최소)

1. 분석 문서 §2·§8 라우팅과 코드 `resolveFactionVault.ts` / upkeep / fee 대조.  
2. handoff에 AGREE/PARTIAL + 줄번호 근거.  
3. `docs/ARC_CORE_ECONOMY_FABRIC.md` §9·§11 에 **5축 표 초안 패치**(분석과 동일).

### Phase A — 중립 금고 (#4) (필수 · 안정 우선)

| ID | 작업 |
|----|------|
| A1 | `neutralNationVaultStore.ts` = `createFactionVaultStore` · seed CSV optional `neutral_vault_seed_credits` (기본 **0** 또는 분석 승인과 동일 — **existing seed 키 무단 변경 금지**, 신규 키만) |
| A2 | `VAULT_KEY_NEUTRAL = 'neutral_vault'` · `getVaultKeyByFaction` / `resolveTradeFeeFactionVault` / upkeep 루프 **neutral → 4** |
| A3 | `AiEconomySubCore` deferred hydrate에 중립 vault 추가 |
| A4 | fee `ensureHydrated` 후 append — 기존 hydrate-race 패턴 유지 |
| A5 | unit: neutral hold 수수료·유지비가 **arccore에 안 들어가고** neutral만 증가 |

**금지**: RED 시드/잔액을 중립으로 이전; blue·transport 수정 범위 확대.

### Phase B — 독립국 금고 (#5) + purge 중립 (필수)

| ID | 작업 |
|----|------|
| B1 | `playerIndependentNationVaultStore` · createFactionVault 패턴 |
| B2 | routing: `kind==='player_independent'` 또는 `isPlayerOriginatedClanId(occupier)` → vault **5** (fee) |
| B3 | **유지비 1차**: 기존 `isPlayerOwnedHold` → **player.credits 유지** (회귀 최소). vault upkeep 이관 **이번 Phase 금지** unless 대표님 추가 승인 |
| B4 | `purgeLocalAccountData` / `purgePlayerAccountWorldState`:  
|    | · 플레이어 independent hold → **occupier=neutral · kind 중립 · deed 클리어** (대표님 계약)  
|    | · independent vault **balance 0 + seed 없이 persist** (플레이어 축)  
| B5 | 통합 테스트 또는 스크립트: 구매 시뮬 → fee → purge → hold neutral · vault 0 · arccore/blue/fleet 불변 |

**금지**: 독립국 잔액을 월드 vault로 강제 병합 정책 없이 방치.

### Phase C — UI·관측 (권장 동봉)

| ID | 작업 |
|----|------|
| C1 | `planetEconomyInfo` snapshot / overlay: 5축 잔액 또는 접는 섹션 (한국어 라벨) |
| C2 | heavy session revision 토큰에 vault 5 반영 |
| C3 | (선택) `npm run audit:balance-ops` input에 vault keys 주석만 |

### 명시 제외 (후속 별 task)

- 플레이어 금고 **관리 UI**(출금·이체·세금 슬라이더) — “추후 관리 개발”  
- 수송선단→RED 자동 이전  
- Firestore 금고 동기화  
- 기존 CSV 시드 재밸런스 without existing-value 승인  

---

## 3. 라우팅 정본 함수 (구현 타깃)

`resolveFactionVault.ts` (또는 1파일 확장)에 **단일 함수**:

```ts
// 의사코드 — 분기 밖 중복 금지
type VaultRoute =
  | 'arc_core_red'      // #1
  | 'transport_fleet'   // #2 — fee 경로 제외, convoy only
  | 'blue'              // #3
  | 'neutral'           // #4
  | 'player_independent';// #5
  | 'player_wallet';     // upkeep only 1차
```

모든 fee·upkeep·UI balance 조회는 이 라우터/키만 사용.

---

## 4. self-check / 합격

```bash
npx tsc --noEmit -p tsconfig.client.json
# 가능 시 vault unit / 라우팅 스모크
```

| 합격 | 기준 |
|------|------|
| A | 중립 행성 fee/upkeep **neutral vault만** 변동; RED 시드 키 동일 |
| B | independent fee → 5; purge 후 hold **neutral**, vault **0**; 1~3 vault 잔액 변화 없음 |
| C | UI/빌드 깨짐 없음 · tsc PASS |
| 헌법 | onBoot 전 행성 O(N) vault rebuild 없음 · onSnapshot 없음 |

---

## 5. handoff 템플릿

```text
status=PENDING
task_id=economy-vault-5axis-upgrade-20260804
team_lead_recheck=AGREE|PARTIAL|DISAGREE
code_changes=YES
commit 금지
phases=A|B|C 완료 범위
변경 파일: ...
purge_test: hold_neutral=Y/N vault5_zero=Y/N world_vaults_preserved=Y/N
tsc=...
김팀장 검수 요청
```

---

## 6. 파일 맵 (예상)

| 신규 | 수정 |
|------|------|
| `src/store/factionVault/neutralNationVaultStore.ts` | `resolveFactionVault.ts` |
| `src/store/factionVault/playerIndependentNationVaultStore.ts` | `runArcCorePlanetUpkeepDailyPass.ts` |
| (선택) 라우팅 policy CSV seed key | `applyPlanetTradeTransactionFee.ts` |
| | `AiEconomySubCore.ts` hydrate |
| | `localAccountReset.ts` / clanWar purge |
| | economy overlay/session |
| | `ARC_CORE_ECONOMY_FABRIC.md` |

---

**끝.** 분석 재검수 없이 Phase B purge를 추측 구현하지 말 것. 대표님 「독립국=초기화 시 중립」을 DoD 최상위에 둘 것.
