# 경제 금고 5축 고도화 — 전수 재분석 (2026-08-04)

> **작성**: 김팀장 · 대표님 지시 재분석  
> **범위**: 아키텍처·호환·계정 초기화·개발 가능 여부 (본 문서는 **구현 아님**)  
> **김클로드 실행 지시**: `tools/kim-team-lead/reports/kim-claude-ready-economy-vault-5axis-upgrade.md`

---

## 0. 한 줄 결론

| 질문 | 답 |
|------|----|
| **5축 금고로 고도화 가능?** | **가능 (조건부)** — 이미 3축 + `createFactionVaultStore` 단일 패턴이 있음 |
| **기존 경제 안정 유지?** | **가능** — 수수료율·배치 주기·탄력0·유지비 800 고정 등 정책 **유지**, **라우팅 키만 세분화** |
| **플레이어 독립국 → 계정 초기화 시 중립?** | **가능·필수 계약** — hold 중립화는 purge 경로 존재; **독립국 금고는 purge 시 잔액 처리 규칙 신설** 필요 |
| **권장 접근** | **Phase A 라우팅 정합** (중립 분리·문서화) → **Phase B 독립국 금고** → **Phase C UI·감사** · **일괄 빅뱅 리네임 금지** |

---

## 1. 대표님 목표 모델 vs 현재 구현

| # | 목표 이름 | 개념 정본 | 현재 코드 | 갭 |
|---|-----------|-----------|-----------|-----|
| **1** | 아크코어 금고 (= 중앙은행 = **레드 팩션 금고와 동일**) | RED 점령 행성 수입·RED 유지비 + (의도된) convoy 아크 몫 | `useArcCoreVaultStore` · key `arccore_vault` · storage `arcfire_arc_core_vault_v1` | **RED와 동일** 이미 충족. 다만 **중립·플레이어 클랜 수수료도 동일 금고로 폴백** 중 → 이름과 실체가 혼재 |
| **2** | 아크코어 수송선단 금고 | convoy 매입·순마진 운영 | `useArcCoreTransportFleetBankStore` · `arcfire_arc_core_transport_fleet_bank_v1` | **이미 분리 완료** · 계정 purge **제외(월드 축)** |
| **3** | 블루 팩션 금고 | BLUE 점령 행성의 수익·유지비 | `useBlueTeamSharedVaultStore` · `blue_vault` | **이미 분리 완료** |
| **4** | 중립국 금고 | 중립 행성의 수입 저장 | **없음** — `getVaultKeyByFaction`이 BLUE만 구분, **그 외 전부 arccore** | **신규 스토어 + 라우팅** 필요 |
| **5** | 독립국 금고 | 플레이어 소유권 구매 행성 수입 · 추후 플레이어 관리 UI | **없음** — 유지비는 `player.credits` 직차감; 팩션 수수료는 **arccore 폴백**; `resolveFactionVaultForOccupierClanId(player_clan)` **null** | **신규 스토어 + hold kind/`player_independent` 연동** · purge 시 중립화 계약 |

정본 문서(현행): `docs/ARC_CORE_ECONOMY_FABRIC.md` §9·§11-3 · 코드 `src/arcCore/economy/resolveFactionVault.ts`.

---

## 2. 현재 자금 흐름 (정밀)

```text
                    ┌─────────────────────────────────────┐
  convoy 매입/하역   │  arcCoreTransportFleetBank (2)      │  월드 축 · purge 제외
                    │  순마진 arc_share% → arcCoreVault    │
                    └─────────────────────────────────────┘

  무역 수수료 5% 팩션몫 (즉시)
    BLUE hold     → blueTeamSharedVault (3)
    RED           → arcCoreVault (1)
    neutral       → arcCoreVault (1)  ← 목표 4와 불일치
    player_clan / independent → arcCoreVault (1)  ← 목표 5와 불일치

  일 1회 유지비 upkeep
    isPlayerOwnedHold(deed/소유) → player.credits 차감  (지갑; 독립국 금고 아님)
    blue        → blue vault
    red|neutral → arcCore vault
    player_clan (owner 판별 실패 시) → continue 스킵

  중앙은행 지출 패스 → arcCoreVault (중앙은행 ≡ RED 금고 동일 인스턴스)
```

핵심 라우팅:

```25:86:src/arcCore/economy/resolveFactionVault.ts
export function getVaultKeyByFaction(faction: string): string {
  // blue → blue_vault · else → arccore_vault
}
// resolveTradeFeeFactionVault: player_clan·neutral 모두 arccore 폴백
// resolveFactionVaultForOccupierClanId(player_clan) → null
```

공통 인프라:

- `createFactionVaultStore` — hydrate race 가드, persist 1.5s coalesce, txn cap → **신규 금고는 이 팩토리만 사용**
- 부트: `AiEconomySubCore` deferred hydrate 3금고
- 경제 UI: `PlanetEconomyInfoOverlay` / session revision에 3금고 잔액

---

## 3. 계정 초기화·월드 축 (연동)

| 스토어/원장 | purge (`purgeLocalAccountData`) | 분류 |
|-------------|----------------------------------|------|
| 3× faction/transport vault | **리셋 안 함** (주석: ArcCore 환경·자율 경제) | **월드 축** |
| `planetTradeFeeLedger` | purge 제외(동일 취지) | 월드 |
| player credits / 미션 / 소유 등 | **리셋** | 플레이어 축 |
| `clanWarFoundation` player holds | `purgePlayerAccountWorldState` 등으로 **플레이어 점유 제거·시드 복귀/중립** | 혼합 |
| 독립국 hold (`player_independent`) | 초기화 시 **중립국화** 요구 (대표님 확정) | 반드시 검증·보강 |

대표님 계약: **플레이어 독립국 → 계정 초기화 시 중립국화.**

| 검증 포인트 | 현재 | 필요 |
|-------------|------|------|
| hold `occupierClanId` / `kind` / deed | purge 시 플레이어 클랜 제거 로직 있음 | **명시적으로 `neutral` + kind 리셋** 검수·회귀 테스트 |
| 독립국 금고 잔액 (신설 시) | 없음 | **옵션 1안(권장)**: purge 시 잔액 **0+감사 로그** 또는 **중립 금고 이관 0%** (월드 잔재 남기지 않음 — 싱글 샌드박스). 2안: 월드 잔존 금지 권장 |
| 월드 vault 1~3 | 유지 | 유지 (아크·수송·블루는 세계 경제) |
| 신규 **중립 금고** | — | 월드 축 · **purge 제외** |
| 신규 **독립국 금고** | — | **플레이어 축** 또는 **월드이지만 purge 시 강제 제로** — 김팀장 권장: **계정 귀속 단일 금고 + purge zero** |

기존 김팀장 헌법: 플레이어 진행은 purge 연동, ArcCore 경제 환경은 purge 제외.  
**독립국 금고는 플레이어 인터랙티브 진행**으로 분류하는 것이 대표님 「초기화=중립」과 일치.

---

## 4. 기타 시스템 연동 체크리스트

| 시스템 | 금고 의존 | 5축 시 조치 |
|--------|-----------|------------|
| 일일 배치 `runArcCorePlanetUpkeepDailyPass` | RED/BLUE/player credits | neutral 루프 분기 + independent vault |
| `applyPlanetTradeTransactionFee` | `resolveTradeFeeFactionVault` | 라우팅 표 단일 정본 함수로 확장 |
| convoy `applyConvoyUnloadVaultSettlement` | fleet + **arcCoreVault** share | 1번 금고 유지 (RED/중앙은행) — 변경 최소화 |
| `runArcCoreCentralBankExpenditurePass` | arcCoreVault | 동일 스토어 유지; 표시명만 「RED=중앙은행」 |
| territorial / independent side | 지도·홀드 | 독립국 금고 키 = hold kind/`isPlayerOriginatedClanId` |
| 경제 UI / heavy session revision | 3 balance 필드 | 5 balance 구독 + 라벨 i18n |
| headless `ARCFIRE_HEADLESS_ECONOMY_AUDIT` | fee → arcCore | 의도 유지 또는 시뮬 5축 stub |
| hydrate race (vault fee) | `ensureHydrated` | 신규 vault도 **동일 ensureHydrated** 필수 (기존 task 교훈) |
| SIM `sim:economy` / balance-ops | vault KPI | audit 리포트 컬럼 확장 후순위 |
| Firebase `planet_holds` sync | hold only | 금고는 **로컬 AsyncStorage** 유지 (금고 Firestore 금지) |
| 계정 생성 bootstrap | 시드 vault | independent vault empty seed |

---

## 5. 안정 유지 원칙 (비협상)

1. **`price_elasticity=0`**, 경제 AABS 고빈도 금지 · 유지비/수수료 **CSV 숫자 기존값 무단 변경 금지** (추가 키·시드만 신규 행)  
2. **일 1회** upkeep·수수료 정산 축 유지 · 틱 경로 vault 대량 쓰기 금지  
3. **잔액 즉시 / persist 1.5s coalesce** 패턴 유지  
4. **기존 3 storage key 잔액 소실 금지** — 신규 키로 분리 시 **마이그레이션 1회** (중립 분립 시 과거 혼합 잔액 처리 정책 필요)  
5. 부트 동기 전 행성 vault 연산 금지 — `AiEconomySubCore` deferred hydrate 확장  
6. Table-First: vault 시드·한도는 `arc_core_planet_upkeep_policy` (또는 전용 policy CSV)  

### 중립 분리 시 잔액 마이그레이션 1안 (권장)

| 시점 | 동작 |
|------|------|
| 앱 1회 플래그 | 중립 전용 금고 생성, 시드만 (`neutral_vault_seed_credits`, 기본 0 또는 CSV) |
| **과거 arccore 혼합 잔액** | **이동 않음** (아크코어/RED 잔고 유지) — 단순·안전 |
| 이후 from-date | 중립 행 수수료·유지비만 중립 금고 |

(혼합잔액 배분 시뮬레이션은 과설계 → 1안)

### 독립국 금고 1안 (권장)

| 항목 | 값 |
|------|-----|
| storage | `arcfire_player_independent_nation_vault_v1` (uid 1개 통합 또는 planetId 맵 bounded) |
| 입금 | 소유 행성 **팩션몫 수수료** · (선택) 향후 세금 UI |
| 출금/유지비 | 1차는 **현행 player.credits 유지비 유지** 또는 vault 우선 spend — **대표님 승인 후 1안만** |
| purge | **잔액 0 + hold 중립** · 월드 vault 1~4 손대지 않음 |
| 향후 플레이어 관리 UI | Phase C+ (출금 제한 규칙 테이블화) |

**권장 1차 유지비**: 계속 `player.credits` (회귀 최소) · 독립국 금고는 **수수료 축적만**. 2차에서 vault upkeep 이관.

---

## 6. 개발 가능 여부 · 공수 (김팀장 추정)

| Phase | 내용 | 난이도 | 리스크 | 비고 |
|-------|------|--------|--------|------|
| **P0-Doc** | 정본 표 갱신 · 라우팅 단일 함수 설계 | 낮 | 낮 | 코드 전 |
| **A** | `neutral_vault` store + `getVaultKey` 4분기 + upkeep/fee + hydrate | 중 | 중 (수수료 경로 누락 시 회귀) | 기존값 변경 無 |
| **B** | independent vault + independent hold 감지 + trade fee + purge zero/neutral | 중 | 중 | **초기화 중립 테스트 필수** |
| **C** | 경제 UI 5표기 · balance-ops · 감사 | 낮 | 낮 | |
| **X 금지** | 전 금고 Firestore · 실시간 동기화 · onBoot 전 행성 | — | 헌법 위반 | |

**종합**: 안정 유지하며 세분화 **개발 가능**. 아크코어=RED 동일 스토어 유지가 핵심; 새로 만드는 것은 **중립(4) · 독립(5)** 두 축.

---

## 7. 위험·반쪽 패치 금지

| 금지 | 이유 |
|------|------|
| 중립을 계속 arccore에 두고 UI만 5칸 | 회계 거짓 |
| independent만 분리하고 purge 시 vault 잔존 | 계정 초기화 후 세계 잔잔음 |
| 이중 resolve 함수 산재 | fee/upkeep/ui 불일치 (F-vault race 교훈) |
| 시드 CSV 무단 재밸런스 | existing-value-change |
| transport↔RED 자동 대규모 이체 신설 | 기존 의도「자동 이전 없음」깨짐 |

---

## 8. 권장 목표 라우팅 표 (구현 타깃)

| Hold / kind | 수수료 팩션몫 | 유지비 | Vault |
|-------------|---------------|--------|-------|
| RED / arccore_red | arccore | arccore | **1** |
| BLUE | blue | blue | **3** |
| neutral | **neutral_vault** | **neutral_vault** | **4 NEW** |
| player_independent / 플레이어 소유 | **independent_vault** | player.credits (1차) | **5 NEW** |
| (other) player_clan 비독립 레거시 | independent 또는 arccore 폴백 — 명세에서 1안만 | 동 | |

수송 **2**는 hold 비의존 convoy 전용 유지.

---

## 9. 교차 문서

- `docs/ARC_CORE_ECONOMY_FABRIC.md` §9·§11  
- `docs/PLAYER_INDEPENDENT_NATION_IMPLEMENTATION_SPEC.md` (지도 독립 · 금고 미포함)  
- `docs/economy-evaluation/2026-08-03-economy-full-rescan.md` (3축 확인)  
- `.cursor/rules` 플레이어 계정 purge · 경제 부트경로  

---

**분석 END.** 구현은 김클로드 READY만 착수.
