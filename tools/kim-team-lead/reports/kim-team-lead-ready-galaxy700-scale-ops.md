# 김팀장 READY — 성계 700 전개방 스케일 운영

> **status**: `Z1_DONE` — 존 분할로딩 마감. **R1~R3 HOLD (안정화 이후)**  
> **task_id**: `galaxy700-scale-ops-impl-hold-20260812`  
> **설계 정본**: `docs/성계700_전개방_메모리_운영_설계.md` **v0.3.1 §16**  
> **순서 잠금**: Z1 **완료** → (안정화: Z2·Z4·Z5) → **그다음** R1~R3. I3·I4는 R 이후.  
> **앵커**: `GALAXY_700_SCALE_DESIGN_ANCHOR.json`  
> **대표님 2026-08-21**: 현재 상태 마감. 미발견→미개척은 추후. 줌 제외.  
> **담당**: 김팀장(글록 4.5)  
> **commit**: 요청 시에만

---

## 0. 목적

700 코어개방 누적 시에도 **현재 게임 기능이 동일하게 작동**하도록  
**먼저** 맵 존/뷰포트·persist/phase 안정(체감 불변)을 넣고, **그다음** 미발견→미개척 표시를 일일 후보에 첨가한다.

| 게이트 | 조건 |
|--------|------|
| 착수 | 대표님 「구현 진행」명시 + 섹터 축 등 §10 미결 중 **I1/I2에 불필요한 것**은 보류 가능 |
| 코딩 전 | `[pss-pre-dev]` 3줄 · `arcfire-memory-leak-audit-first` |
| 완료 | `tsc` · 해당 wave audit · 기능축 §4-6 체크리스트 |

---

## 1. 김클로드 개선안 → Wave 매핑 (구현 순서)

| Wave | 김클로드 우선순위 | 내용 | 기능 동일 계약 |
|------|------------------|------|----------------|
| **I1** | 최상 (§4-5) | 로컬 `planetCoreRuntime` persist에 `retainPlanetIds`/`hasPlanetCoreBackupValue` **재사용** · Cold stub 디스크 제외 | hydrate 시 baseline 재시드 · 방문/상세 행성 데이터 무손실 |
| **I2** | 상 (§4-3) | `applySynthColonizationPhase` **전 systems 얕은 복제 제거** · in-place/부분 패치 · (가능 시) 쿼터 | phase 일일 진행 체감 동일 · 배치 CPU↓ |
| **I3** | 중 (§4-1) | Hot/Cold · `warmedPlanetCatalogIds` 연동 · economy enroll **증분/활성만** | 허브·무역 체감 동일 · 전량 enroll 금지 |
| **I4** | R1 | DailyOps deep = Hot ∪ TodaySectorSample · 청크+yield | 타이틀 게이트 분리 유지 · 방문 행성 게이지 동일 |
| **I5** | R3 | 맵 LOD/클러스터 · Voronoi 가시∩핫 | 항로·선택·근접 풀노드 · 원거리 LOD |

**현재 (v0.3.1)**: Z1 존레지스트리+로드 세션 **완료**.  
**다음(안정화 후, 별도 승인)**: Z2(줌 없이 이득 있을 때만) · Z4 I2 · Z5 I1.  
**그다음**: R1 미발견→미개척 표시 · R2 후보 첨가 · R3 존 태움.  
**탐사 포그(Stellaris형)**: **HOLD (2026-08-22)** — 안정성 설계 확보 후 재구현. `docs/은하지도_이동포그_개발계획.md`. 코드 금지.  
I3·I4·강제 4칸 언로드·개방 주기 변경·줌은 이 묶음 밖.

---

## 2. 파일 맵 (착수 시 1차 후보)

### I1 — Persist slim (로컬)

| 경로 | 역할 |
|------|------|
| `src/firebase/gameSaveBackup/slimGameSaveSnapshotForUpload.ts` | **재사용 정본** (`retainPlanetIds` / `hasPlanetCoreBackupValue`) — invent 금지 |
| `src/store/planetCoreRuntimeStore.ts` (또는 persist 경로) | 로컬 write에 slim 필터 적용 · coalesce 유지 |
| 검증 | persist bytes before/after · cold 재진입 hydrate |

### I2 — Colonization 비용

| 경로 | 역할 |
|------|------|
| `src/store/worldStore.ts` — `applySynthColonizationPhase` | `{...state.systems}` 전량 복제 **제거** |
| colonization advance pass 호출부 | 쿼터/섹터(설계 §5)는 I2b로 분리 가능 |
| 검증 | phase+1 결과 동일 · 배치 시간 Δ |

### I3 — Hot/Cold + economy

| 경로 | 역할 |
|------|------|
| `src/arcCore/memory/residentSetRegistry.ts` | Hot 집합 확장 |
| `src/world/coreOpenGameplayPlanets.ts` | deep pass 대상 vs open 풀 분리(설계) |
| `src/arcCore/economy/synthFrontierConvoyTradeBridge.ts` | `ensureUnlockedSynthFrontierEconomyEnrollment` — force 전량 재빌드 제거 |
| 검증 | 무역소 첫 방문 enroll · 비방문 미등록 |

### I4 — DailyOps 섹터

| 경로 | 역할 |
|------|------|
| `src/arcCore/schedule/runArcCoreDailyOpsBatch.ts` | 섹터 로테이션·슬라이스 |
| `forEachCoreOpen*` 소비 패스군 | deep vs light 분기 |
| 검증 | join 타임아웃·타이틀 비차단 · H 행성 게이지 |

### I5 — 맵 LOD

| 경로 | 역할 |
|------|------|
| `app/(game)/worldmap.tsx` | V soft120/hard200 · 클러스터 |
| Voronoi 모델 | dirty · 가시∩핫 |
| `GalaxyMapUndiscoveredStarlightSvg` | 잠금 축 **유지**(이미 O(1)) |

---

## 3. `[pss-pre-dev]` 템플릿 (Wave별 복붙)

```text
[pss-pre-dev] hot_path=<I1:persist coalesce / I2:daily batch / I4:batch slices / I5:map memo>
[pss-pre-dev] alloc=<틱당 신규 금지 · systems 전복제 금지 · Path.map 금지>
[pss-pre-dev] cache=<planetId|revision · warmed set · slim retain>
[pss-pre-dev] stage=Hub-1 dispose 유지 · title 게이트 분리 · replace()
[pss-pre-dev] risk=P1,P3,P6 (해당 Wave)
[pss-pre-dev] verdict=PASS|REDESIGN
```

---

## 4. DoD / 완료 게이트 (Wave 공통)

- [ ] 기능축 §4-6 체크리스트 해당 항목 PASS
- [ ] `npx tsc --noEmit -p tsconfig.client.json`
- [ ] STAGE/맵 변경 시 `audit:memory:all` (해당 시)
- [ ] Skia 변경 시 `audit:skia-memory` (해당 시)
- [ ] R1 관련: 배치 시간·join 타임아웃 메모 (실측 가능 시)
- [ ] R2 관련: persist bytes / slim 적용 전후
- [ ] 해금 가속(5% 등) **미포함** (별도 정책 승인)
- [ ] 김경제 `mem-post-dev-recheck` handoff (src 반영 시)

---

## 5. 명시적 비범위 (지금 하지 않음)

| 제외 | 이유 |
|------|------|
| `systemsPerDay`·5% 랜덤 해금 | §10 별도 결정 · R5 |
| 타이틀에 배치/prewarm 합류 | 헌법 위반 |
| Hot/Cold **신규** 필터 invent | slim·warmed **재사용만** |
| trade CSV `sectorBand` 와 Sector Ops 혼용 | R6 용어 분리 |
| 미발견→미개척 표시(R1) | **지금 금지** · 안정화 이후 별도 승인 |
| 줌 인아웃 | 재설계 `docs/은하지도_줌_개발계획.md` · 코드 미착수 |
| 가시 노드 존 필터 | 관문 소실. 금지 |

---

## 6. 대표님 미결 (§10) — Wave 의존

| 결정 | I1 | I2 | I3 | I4 | I5 |
|------|----|----|----|----|-----|
| 섹터 축 | — | 부분(쿼터) | — | **필요** | 부분 |
| 핫 상한 80 vs 120 | — | — | **필요** | 사용 | — |
| 맵 “전부 보임” 정의 | — | — | — | — | **필요** |
| 콜드 경제 동결 vs light | — | — | **필요** | light | — |
| 해금 속도 | — | — | — | 참고 | — |

→ **I1·I2는 미결 없이도 착수 가능**(승인만 있으면).

---

## 7. 상태 전환

| status | 의미 |
|--------|------|
| `HOLD` | 문서·준비만 |
| `Z1_DONE` | 존 분할로딩 마감 (현재) |
| `READY` | 다음 Wave 승인됨 |
| `IN_PROGRESS` | 김팀장 코딩 중 |
| `DONE` | Wave 완료·게이트 PASS |

R1 착수는 상단을 `READY`로 바꾸고 대표님 승인 후에만.

---

**END — galaxy700-scale-ops-impl-hold**
