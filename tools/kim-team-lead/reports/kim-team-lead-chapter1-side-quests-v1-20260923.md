# 김팀장 — 챕터1 주요 서브퀘스트 5종 적용 · 2026-09-23

```text
task_id=chapter1-major-side-quests-design-20260923
verdict=REVIEWED PARTIAL
[pss-pre-dev] hot_path=없음 (CSV·generated 부트 1회) alloc=틱 0 cache=catalog 1회
[pss-pre-dev] stage=해당없음 risk=P3(catalog) 만
[pss-pre-dev] verdict=PASS
```

## 김클로드 초안

`docs/CHAPTER1_MAJOR_SIDE_QUESTS_DESIGN.md` v0.1. 키워드 5 · 가번호 `sandbox_034`~`038` · A/B안 · §8 수락 이동 제안.

## 재검수

| # | 판정 | 근거 |
|---|---|---|
| A안 DSL | AGREE | `talk_npc`/`reach_planet`/`defeat_enemy`만. `collect_item` 없음 |
| 체인 2~5 | AGREE | 5/5/4/4/4. `nextMissionId` + 샌드박스 `advanceMissionChainAfterComplete` |
| 첫 행만 의뢰 | AGREE | 중간·종결 `offerCaptain`/`offerPlanet` 공란. 바가 선행을 안 봄 |
| 본편 비트 비강제 | AGREE | 세계관 분기(솔라 로그·크림슨 보급·깃발 없음·아크코어 조각·빈 선석)만 |
| §8 수락 이동 | DISAGREE (이번) | 베가·타이탄·솔라로 안 옮김. 코어 원안 유지. synth 서쪽은 R1 HOLD |
| 의뢰인=첫 탐문 | PARTIAL | 수락 대사는 idle. 첫 목표는 다른 NPC/착륙. 이중 대화 회피 |

## 적용

- `missions.csv` `sandbox_034`–`055` + `mission_objectives.csv` + combat-ops 4
- `questOnly` 9: 오렌·베일·닐라·톨린·놀·아이비·레아·케이드·리라
- 재사용: 세라(`sirius_border`만 · 다른 행성 의뢰와 비충돌) · 한로 · 스텔라(talk 전용)
- 1차 대사 `story_dialog_obj_s0XX_a` + idle `npc_dialog_sq_*`
- 생성: `node tools/content-tables/build-content-from-csv.mjs` 만
- `missionTableIntegrity` PASS · `tsc` PASS
- `story_*` · `story_001` · 신규 행성 · 보석 · 기존 밸런스 값 미변경

## 의도적 잔여

- §8 수락지(베가 요새 / 타이탄 게이트 / 솔라) 미반영 — 대표님 재지시 시
- B안 `collect_item` · 이상현상 퀘스트 HOLD
- 보석 보상 없음
- 본편 플래그 연동 없음 (q04 이후 고향 우선 노출 등)
