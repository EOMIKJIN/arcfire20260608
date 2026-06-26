# ArcCore 클라우드 동기화 계약 v1.0

> **상태**: 정본 (2026-06-26)  
> **원칙**: v4.0 일 1회 ingest · **리스너 금지** · Spark read/write 예산

---

## 1. 이중 저장소 역할 (Firestore vs RTDB)

| 저장소 | 경로 | 용도 | 앱 접근 |
|--------|------|------|---------|
| **Firestore** | `arccore/config`, `schedule`, `subcores` | 앱 업데이트·SubCore 플래그·최초 시드 | boot `getDoc` (기존) |
| **Firestore** | `users/{uid}` | 플레이어 프로필·planet_holds | 단발 read/write |
| **RTDB** | `arccore/config` | `activePolicyPackId`, `learningSyncEnabled`, `safeMode` | boot **1× `.once`** |
| **RTDB** | `arccore/policy_packs/{packId}` | approved SIM `balanceOverlay` | boot **1× `.once`** → pending |
| **RTDB** | `arccore/learning/global` | CI KPI tail mirror | boot **1× `.once`** → local merge |
| **RTDB** | `arccore/learning/devices/{uid}/dailyKpi` | 기기 일일 KPI | **1 write/day** |

**정본 우선순위 (경제 overlay ingest)**  
`RTDB pending pack` → 번들 `economySimOverlayDelta.ts` → skip if same `deltaId`

---

## 2. 로컬 영속 (AsyncStorage)

| 키 | 내용 |
|----|------|
| `arcfire_economy_price_overlay_v1` | ingest 결과 (게임플레이 반영) |
| `arcfire_balance_overlay_delta_ingest_v1` | lastDeltaId |
| `arcfire_arc_core_learning_v1` | kpiTimeline · policyHistory |
| `arcfire_arc_core_rtdb_pending_policy_v1` | boot에서 받은 policy pack |
| `arcfire_arc_core_daily_ops_v1` | lastBatchDayKey |

---

## 3. 라이프사이클

```text
[CI]
  sim:economy → economySimOverlayDelta.ts (git)
  arc-core:rtdb:publish-policy → RTDB policy + learning/global

[App boot · 세션 1회]
  fetchArcCoreRtdbBootSyncOnce
    → pending policy
    → mergeRtdbLearningGlobalIntoStore (persist 1회)

[Daily 12:00 KST]
  ingestBalanceOverlayDeltaIfPending (RTDB pending 우선)
  runArcCoreEconomyLearningDailyPass
  pushArcCoreDailyKpiToRtdbIfDue
```

---

## 4. 금지 (Adoption · v4.0)

- RTDB/Firestore `.on` / `onSnapshot` 실시간 구독
- `/arcfire/global_overlay` 실시간 가격 mirror
- tick·거래마다 cloud write
- policy_packs **앱에서 write** (Admin/CI only)

---

## 5. RTDB Security Rules (정본: `database.rules.json`)

| 경로 | read | write | 비고 |
|------|------|-------|------|
| `worldExpansion/master/state` | **public** | deny | 레거시 그래프 스냅샷 · 앱 미참조(로컬 WorldExpansion 정본) |
| `config` | **public** | deny | Admin/CI publish only |
| `policy_packs/{id}` | **approved만 public** | deny | draft/retired 노출 금지 |
| `learning/global` | **public** | deny | KPI mirror |
| `learning/devices/{uid}/dailyKpi` | deny | **Firebase Auth uid 일치** | ⚠️ 아래 §6 |

**배포**: `firebase deploy --only database`

---

## 6. Firebase Auth 갭 (중요)

앱은 **로컬 guest uid** (`src/firebase/auth.ts`)만 쓰고 **Firebase Auth sign-in은 없음**.

| 기능 | public read 규칙 | 동작 |
|------|------------------|------|
| boot policy/config/global read | ✅ | **동작** |
| `dailyKpi` client write | `auth.uid === $uid` 필요 | **현재 Permission denied** |

**dailyKpi push를 켜려면** (택1):

1. **권장** — 부트 시 `signInAnonymously()` 1회 → RTDB write 규칙 유지 (**2026-06-26 구현** · `firebaseAnonymousAuth.ts`)
2. **보류** — dailyKpi write 규칙 `false` 유지 (Admin만 집계)

---

## 7. 운영 명령

```bash
firebase deploy --only database
npm run arc-core:learning:verify          # 안정성 게이트 (tsc·테스트·dry-run)
npm run arc-core:learning:daily           # pull → merge → sim → publish (전체)
npm run arc-core:learning:daily -- --dry-run --skip-pull --skip-sim
npm run arc-core:rtdb:pull-kpis
npm run sim:arc-core:learning-merge
npm run sim:economy
npm run arc-core:rtdb:publish-policy
npx expo run:android   # @react-native-firebase/auth · database 네이티브
```

**CI**: `.github/workflows/arc-core-learning-daily.yml` (수동 · `FIREBASE_TOKEN` optional)

**Firebase Console**: Authentication → Anonymous sign-in **활성화** (dailyKpi write)

*Related: [`ARCFIRE_DEPTH_LEARNING_ROADMAP_v1.md`](./ARCFIRE_DEPTH_LEARNING_ROADMAP_v1.md)*
