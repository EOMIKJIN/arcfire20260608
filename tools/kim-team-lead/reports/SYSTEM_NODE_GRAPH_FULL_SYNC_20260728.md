# 성계 노드라인 전수조사 · 연동 조치 (2026-07-28)

## [pss-pre-dev]

```text
[pss-pre-dev] hot_path=galaxy_graph_gen·부트로드 · alloc=프리컴퓨트1회 · cache=GALAXY_SYSTEMS_PRECOMPUTED
[pss-pre-dev] stage=worldmap+territorial · risk=P1(틱할당없음)·이중그래프해소
[pss-pre-dev] verdict=PASS — 플레이성계 CSV 엣지 지도 보존·비대칭/숏컷 제거
```

---

## 1. 발견 — 왜 「보이는 노드」와 분쟁이 달랐나

| 축 | 정본 | 역할 |
|----|------|------|
| **이동·월드맵 선** | `GALAXY_SYSTEMS` (`galaxySystems100.generated.ts`) via `worldStore.systems` | 플레이어가 **보는** 노드라인 · BFS 이동 |
| **분쟁·보급 1홉** | `STAR_SYSTEMS` ← `planets.csv` | `listAdjacentSystemIds` · territorial P0 |
| **빌드 함정** | `star_system_connections.csv`에 행이 **있으면** 해당 성계는 `planets` pipe **무시** | 예전 파일은 **3성계만** 부분 기재 |

구 `capSystemGraphMaxDegree`는 플레이 성계도 **차수 3**으로 잘라 CSV 엣지를 지도에서 삭제했음  
→ 예: `new_eden↔iron_cross`, `omega↔draco`, `iron↔titan` 등이 **지도에만 없음**.

---

## 2. 초기 오류 / 불일치 (조치 전)

| 이슈 | 상태 |
|------|------|
| `helios↔perseus` 숏컷 | 이미 삭제(직전 턴) |
| `sirius→draco` 단방향(드라코에 시리우스 없음) | **수정**: draco pipe에 `sirius` 추가 |
| `star_system_connections.csv` 부분 3성계 | **전량 동기화**(21성계·64 directed) |
| 지도 vs CSV gameplay 이웃 불일치 | **해소**(drop/extra = 0) |

---

## 3. 코드 소비처 (전수)

| 경로 | 그래프 |
|------|--------|
| `GalaxyMapSystemsSvg` / `worldmap.tsx` / `findShortestUnlockedSystemPath` | `GALAXY_SYSTEMS` |
| `worldStore` unlock frontier | `GALAXY_SYSTEMS` |
| `territorialSupplyLine` / `territorialCombatGraph` / FrontPressure | `STAR_SYSTEMS` |
| `resolvePlanetSystemPosition` hop | GALAXY (+ STAR fallback) |

연동 후 **플레이 성계↔플레이 성계** 엣지는 두 축이 동일(CSV 보존).

---

## 4. 코드·데이터 변경

| 파일 | 내용 |
|------|------|
| `tables/content/planets.csv` | draco↔sirius 대칭 · helios↔perseus 없음 유지 |
| `tables/content/star_system_connections.csv` | planets와 **전량 동기** |
| `tools/content-tables/sync-star-system-connections-from-planets.mjs` | 동기 스크립트 신설 |
| `src/data/galaxy100.ts` | **tier0(플레이↔플레이) 엣지 무조건 보존** · synth만 maxDegree=3 |
| `csvSystems.ts` / `galaxySystems100.generated.ts` | `build:content-tables` + `gen:galaxy-graph` 재생성 |

---

## 5. 검증

- planets ↔ csvSystems: **diff 0**
- 비대칭: **0**
- helios↔perseus 직접: **없음**
- mapBase vs CSV: **dropped=[] · extra=[]**
- 정본 항로 헬리오스→오메가→뉴에덴→베가→드라코→페르세우스: CSV·지도 모두 1홉 연쇄 **유효**

---

## 6. 앱 반영

⚠️ 중요 — 앱 완전 재시작 권장  
(이유: `GALAXY_SYSTEMS_PRECOMPUTED`·`STAR_SYSTEMS` 모듈 캐시)

`[existing-value-change] planets.csv draco+sirius · star_system_connections 전량동기 · 사용자 노드연동 지시`
