# 김클로드 착수 — 성계 노드라인 전수검사 · 이중그래프 연동 재검증·수정

> **배정**: 김팀장 (Cursor 본창) · **2026-07-28**  
> **대표님 지시**: 노드 연동 작업을 **김클로드가 한 번 더 전수검사**하고, 남는 오류·미연동은 **수정**할 것.  
> **선행(김팀장 초안)**: `SYSTEM_NODE_GRAPH_FULL_SYNC_20260728.md` · `HELIOS_PERSEUS_EDGE_REMOVAL_20260728.md` · audit 스크립트들  
> **김클로드 즉시 착수** · handoff **PENDING** · **git commit 금지**  
> **task_id**: `system-node-graph-full-reaudit-20260728`

---

## [pss-pre-dev]

```text
[pss-pre-dev] hot_path=galaxy_graph_gen·부트로드 · alloc=프리컴퓨트1회 · cache=GALAXY_SYSTEMS_PRECOMPUTED
[pss-pre-dev] stage=worldmap+territorial · risk=P1(틱할당없음)·이중그래프
[pss-pre-dev] verdict=PASS — 플레이성계 CSV=지도 보존 검증·잔여숏컷/비대칭 수정·틱경로금지
```

---

## 0. 대표님 정본 (반드시 재확인)

| # | 규칙 |
|---|------|
| R1 | **노드 = 성계**, **라인 = 1홉 `connections`**. 「가깝다/붙다」= 데이터 1홉 · 지도 좌표 거리 아님 |
| R2 | 헬리오스↔페르세우스 **직접 엣지 금지**. 정본 항로: `헬리오스→오메가→뉴에덴→베가→드라코→페르세우스` |
| R3 | **이동(월드맵)** 과 **분쟁/보급 1홉** 이 **플레이 성계↔플레이 성계**에서 **동일 그래프**여야 함 |
| R4 | 잘못된 초기 CSV·부분 `star_system_connections`·차수캡으로 CSV가 지도에서 잘리는 회귀 **금지** |

---

## 1. 김팀장 초안 상태 (재검수 대상 · 맹신 금지)

이미 들어간 변경이 있을 수 있음. **김클로드가 git diff·실측으로 재검증**하고, 미달·회귀면 **수정**.

| 항목 | 초안 주장 | 김클로드 의무 |
|------|-----------|---------------|
| `helios↔perseus` 삭제 | planets 양방향 제거 | grep·BFS로 **직접 엣지 0** 증명 |
| `draco↔sirius` 대칭 | draco pipe에 sirius | 비대칭 0 |
| `star_system_connections.csv` 전량 동기 | 21성계 | planets와 **완전 일치** · 부분 3성계 회귀 금지 |
| `galaxy100.ts` tier0 보존 | 플레이↔플레이 캡 면제 | 재생성 후 mapBase vs CSV **drop/extra=0** |
| `sync-star-system-connections-from-planets.mjs` | 신설 | `build:content-tables`에 **편입 여부** 확인·없으면 추가 |

근거 문서·도구:

- `tools/kim-team-lead/reports/SYSTEM_NODE_GRAPH_FULL_SYNC_20260728.md`
- `tools/kim-team-lead/reports/HELIOS_PERSEUS_EDGE_REMOVAL_20260728.md`
- `tools/debug/audit-system-connections-full.mjs`
- `tools/debug/audit-map-vs-csv-connections.mjs`
- `tools/debug/audit-neutral-adjacency-p0.mjs` (인접 시드 참고)

---

## 2. 범위 (M0~M6)

### ✅ 한다

| # | 내용 |
|---|------|
| **M0** | 노드 소비처 **전수 표** 재작성(파일·어느 그래프). 최소: worldmap / GalaxyMapSystemsSvg / findShortestUnlockedSystemPath / worldStore frontier / territorialSupplyLine / territorialCombatGraph / frontPressure / resolvePlanetSystemPosition. 누락 소비처 있으면 표에 추가 |
| **M1** | `node tools/debug/audit-system-connections-full.mjs` + `audit-map-vs-csv-connections.mjs` 실행. **FAIL이면 수정**: 비대칭, planets≠csvSystems, star 부분덮어쓰기, helios↔perseus, map drop/extra |
| **M2** | 정본 항로 엣지 단위 assert(헬→오메→뉴에덴→베가→드라코→페르). **직접 helios-perseus 없음**. omega→draco는 **정상 1홉**(삭제 대상 아님 — BFS 최단일 뿐) |
| **M3** | `capSystemGraphMaxDegree` — tier0(플레이↔플레이) **보존** 계약 유지·테스트 또는 정적 주석+재생성 검증. synth만 maxDegree. 회귀 시 코드 수정 |
| **M4** | `sync-star-system-connections-from-planets.mjs`를 `build:content-tables` 파이프라인에 **명시 편입**(planets 빌드 직전/직후). 문서 1줄: star CSV는 planets 파생 · 수동 부분편집 금지 |
| **M5** | `npm run build:content-tables` + `npm run gen:galaxy-graph` 후 재감사 PASS. `npx tsc --noEmit -p tsconfig.client.json` PASS |
| **M6** | (권장) `src/arcCore/territorial` 또는 `tools/debug`에 **연결 회귀 단위테스트** 1파일: (1) helios 1홉에 perseus 없음 (2) sirius↔draco 대칭 (3) 정본 5홉 경로 존재 (4) 가능하면 mapBase=CSV gameplay — 생성물 의존 시 audit 스크립트 호출로 대체 가능 |

### ❌ 하지 않는다

- 밸런스/점유 `combatMode`·가중치 CSV 무단 변경  
- `helios↔omega` / `omega↔draco` / `draco↔perseus` 등 **정상 1홉 삭제**(숏컷만 금지)  
- synth 배치 알고리즘 전면 재설계 · Skia/STAGE  
- git commit / 「완료」선언(김팀장 검수 전)

---

## 3. 완료 게이트 (handoff에 붙일 것)

```text
audit-system-connections-full → asymmetric=0 · heliosPerseusDirect=false · planetsVsGenerated=[]
audit-map-vs-csv-connections → dropped=[] · extra=[]
정본항로 헬→오메→뉴에덴→베가→드라코→페르 = OK
tsc PASS · build:content-tables · gen:galaxy-graph 재실행 기록
build 파이프라인에 star sync 편입 여부
```

---

## 4. handoff 형식

```text
status=PENDING
task_id=system-node-graph-full-reaudit-20260728
[pss-pre-dev] 3줄
전수표 · audit 결과 · 수정 파일 · 초안 대비 추가수정 유무
commit 금지
```

김팀장 검수 후 REVIEWED · 커밋은 대표님 지시 시.
