# 김팀장 검수 — NPC 대사 자연화 2026-10-01

```text
task_id=npc-dialogue-naturalness-20261001
verdict=PASS
[pss-pre-dev] hot_path=없음 alloc=0 cache=csvStoryScenes 1회
[pss-pre-dev] stage=해당없음 risk=없음
[pss-pre-dev] verdict=PASS
```

## 목표 분량

| 축 | 정본 | 상태 |
|---|---|---|
| 전투 종료 55 | `tables/balance/transit_combat_end_dialog.csv` | 적용됨 · 계약 테스트 PASS |
| 퀘스트 목표 187 | `tables/content/story_scene_pages.csv` §5-3 | 김팀장 전량 적용 |

## 검수

- 김클로드 진단(전투 코퍼스 이상치 · 3줄 오독) **AGREE**
- 55행 대체문과 CSV 일치 확인
- 187행 패치 4파일 키 187/187 · KO 줄당 ≤21자 · ≤3줄 · 따옴표 0
- §5-2 모호 5행은 `missions.csv`/`mission_objectives.csv`로 뜻 확정 후 반영
- 허브 인사·early_route·바/스텔라는 제안 범위 밖 → 미변경

## 게이트

- `node tools/content-tables/build-content-from-csv.mjs` 성공
- `npx tsx src/game/transitCombat/resolveTransitCombatEndDialog.test.ts` PASS

## 커밋

대표님 지시 전 금지.
