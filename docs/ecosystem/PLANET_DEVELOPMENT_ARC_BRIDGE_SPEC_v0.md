# Planet Development Arc Bridge — 스펙 v0 (B-D-0)

> **상태**: Tier 0.2 스펙 초안 · **구현 전**  
> **목표**: fabric·convoy 경제 → `detail.development` 슬롯 **1개**로 수렴 (이중 vault 금지)

---

## 1. 문제

```text
수송선단 금고 → convoy ONLY
fabric reconcile → R/P · supplyStockScale
행성개발 업그레이드 → player.credits + UI
→ Arc 기여·자동 투자 경로 없음
```

---

## 2. Bridge 슬롯 (신규 필드 · `detail.development` 확장)

```typescript
type PlanetDevelopmentArcBridgeSlot = {
  version: 1;
  /** fabric 일 1회 reconcile에서 cap 적용 누적 */
  arcContributionCr: number;
  /** 플레이어 opt-in — 자동 시설 투자 허용 */
  autoInvestEnabled: boolean;
  /** 마지막 배치 투자 시각 */
  lastBatchInvestAtMs: number | null;
};
```

- **새 AsyncStorage vault 금지** — `planetCoreRuntimeStore.detail.development` only
- **수송 금고 → development 직접 이체 금지**

---

## 3. 자금 흐름 (일 1회 배치 only)

| 단계 | 소스 | sink | cap |
|------|------|------|-----|
| B-D-1 | fabric reconcile meta | `arcContributionCr` | CSV `arc_contribution_daily_cap` |
| B-D-2 (opt-in) | `arcContributionCr` + player credits | `startUpgrade` API | 시설 CSV 비용 |

---

## 4. 계정 scope

| 분류 | purgeLocalAccountData |
|------|------------------------|
| `arcContributionCr`, `autoInvestEnabled` | **포함** (플레이어 interactive) |
| faction vault · ArcCore world | **제외** |

---

## 5. 구현 게이트 (DoD)

- [ ] B-D-0 스펙 리뷰 (본 문서)
- [ ] B-D-1 fabric → contribution (Tier 3)
- [ ] B-D-2 opt-in auto invest (Tier 4)
- [ ] `tsc` · `audit:balance-ops` · mem-post-dev-recheck

---

*Related: [`ARCFIRE_DEPTH_LEARNING_ROADMAP_v1.md`](./ARCFIRE_DEPTH_LEARNING_ROADMAP_v1.md) Tier 3*
