# helios↔perseus 직접 엣지 삭제 — 전수조사 · 조치 (2026-07-28)

## 대표님 정본 경로

```text
헬리오스 → 오메가 → 뉴에덴 → 베가 → 드라코 → 페르세우스   (홉 5 · 이동 정본)
```

## 「헬리오스 → 오메가 → 드라코 → 페르세우스」는 뭔가?

- **저장된 이동 경로 아님.** 코드/CSV에 그런 시퀀스 레코드 없음.
- 에이전트가 `helios↔perseus` 숏컷을 뺀 뒤 **BFS 최단**을 계산하며 나온 **합성 경로**일 뿐.
- 구성 엣지:
  - `helios ↔ omega_station` — 정상 1홉 (지도·이동)
  - `omega_station ↔ draco_nebula` — 정상 1홉 (오메가·드라코 CSV에 상호 존재)
  - `draco_nebula ↔ perseus` — 정상 1홉
- **삭제 대상이 아님** (월드맵 정상 연결). 숏컷만 삭제하면 최단이 이 3홉으로 **보이는** 것뿐이며, 플레이어 정본 항로는 위 5홉 경로.

## 실제 버그 (삭제 완료)

| 항목 | 내용 |
|------|------|
| 버그 | `planets.csv` `systemConnectionsPipe`에 **`helios↔perseus` 양방향 직접 엣지** |
| 효과 | 이동·보급·분쟁 P0가 헬리오스–페르세우스를 **1홉(붙음)** 으로 오인 |
| 최초 유입 | **Initial commit / 초기 은하 테이블**부터 존재 (`919d7f8` 계열). 런타임·territorial 코드가 생성한 경로 **아님** |
| `star_system_connections.csv` | 헬리오스 구간 **미기재** → 빌드가 `planets.csv` 파이프를 사용 |

## 조치 (2026-07-28)

| 파일 | 변경 |
|------|------|
| `tables/content/planets.csv` | helios: `…\|perseus` **제거** → `iron_cross\|omega_station\|titan_gate` |
| 동일 | perseus: `…\|helios\|…` **제거** → `draco_nebula\|sirius\|crimson_zone` |
| `npm run build:content-tables` | `csvSystems.ts` 재생성 반영 |

## 검증

- helios 1홉: iron_cross, omega_station, titan_gate (**perseus 없음**)
- perseus 1홉: draco_nebula, sirius, crimson_zone (**helios 없음**)
- 정본 5홉 경로 엣지 유효 유지
- 직접 엣지: **없음**

## 기존값 변경 승인

대표님 「이 경로 관련 직접 엣지 삭제」 명시 지시 · `[existing-value-change] planets.csv systemConnectionsPipe helios↔perseus 제거`
