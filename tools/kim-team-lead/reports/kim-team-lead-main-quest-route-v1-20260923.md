# 김팀장 — 메인퀘스트 성계 루트 검수 + q02–q06 보완 · 2026-09-23

```text
task_id=main-quest-system-route-audit-20260923
verdict=REVIEWED PARTIAL
[pss-pre-dev] hot_path=없음 (CSV·generated 부트 1회) alloc=틱 0 cache=catalog 1회
[pss-pre-dev] stage=해당없음 risk=없음
[pss-pre-dev] verdict=PASS
```

## 김클로드 초안

`docs/main_quest_template_v3_chapter1_complete.md` §11. 설정만. 코드·CSV 0.

## 재검수

| # | 판정 | 근거 |
|---|---|---|
| 홉 수 | AGREE | 아르카디아↔솔라 1 · →미네르바 솔라 경유 2 · →드라코 베가 경유 2 |
| 성계=행성 | DISAGREE | `solar_port`≠`solar_station` 등 |
| 난이도 | DISAGREE | 지도 `systemEnemyLevel` ≠ TCL |
| q03·q04 국경 | PARTIAL | 가칭 대기 불필요. `vega_base` 확정 |
| q09 3지명 | PARTIAL | 기존 21 재사용 가능 |

## 보완 (이번)

- `story_002`…`story_006` + 목표 + combat-ops 3
- `questOnly` 노아·코발·소사
- 1차 대사 씬
- 스파인 q02–q06 ready · q07–q10 제목만
- q09 매핑: `iron_remnant` · `omega_hub` · `eden_city`
- `story_001` 미변경 · 신규 행성 없음
- 생성: `node tools/content-tables/build-content-from-csv.mjs` 만

## 의도적 잔여

- q07–q30 미션 미생성
- 전멸·데드코러스 다함대 연출 없음 (1척+서사)
- 그리하벤=`shadow_market` 권장만. 세렌 벨트 가칭
- 허브 `defeat_enemy` P2 잔여
