# 본편 메인스토리 — 챕터 골격 (2026-08-24)

> **챕터1 서사 재료**: `docs/main_quest_template_v3_chapter1_complete.md` (유일 정본 · 집필 완료분 q01~q06 + 요약 q07~q10) · **맥락 잠금**: `docs/EARLY_STORY_AND_QUEST_SPINE.md`  
> 챕터1 제목: **은폐된 진실** (`ms_ch_01`, 2026-09-12). `story_c01_q01` = `story_001` 유지. `q02`=동기 없는 진실(피해자 신원 공개) · `q03`=대타 출정(신규) · `q04`=예상 밖의 참사(신규) · `q05`=복수는 누가 하는 겁니까? · `q06`=숨은 자와의 대면(신호+대면 통합). **2026-09-15 갱신 — 이전 판의 "q03=복수 도입"은 폐기.**  
> 대표님 작성칸: `docs/MAIN_QUEST_WRITE_TEMPLATE.md`는 구버전(폐기). 최신 정본은 `docs/main_quest_template_v3_chapter1_complete.md` 하나뿐.
> **우선순위 (2026-09-14)**: **핵심 메인퀘스트 · 핵심 스토리 전개만** 지금 구현. 순서 손질·추가 퀘스트·튜토리얼은 추후.  
> **총량 (2026-09-14)**: 퀘스트1 클리어가 짧다. 구조 평균 = 본편 1 × 세부 5. **이름 있는 본편 10개 선개발 후 실측 재산정**. 12·340은 목표가 아님.  
> **지금 하는 일**: 필수 기반만 (`docs/MAIN_QUEST_FOUNDATION.md`). 본편 콘텐츠는 추후 10개까지 쌓은 뒤 실측.  
> **하지 않는 일**: `story_001` 문구/보상 변경, 허브 자동 시네마틱 재생(`endStoryReady=0`), L0 강제 가이드, Zone 미션 이식, **`q31`–`q36` 신설**, 스토리/함장 행 지금 bind.

## 구조

```text
챕터 ms_ch_01 … ms_ch_10
  ├─ 본선 퀘스트 story_cXX_q01 … q30   (순서 진행)
  │    └─ 연퀘 스텝  chain_steps (하위 미션 여러 개)
  ├─ 분기 슬롯   story_cXX_b01 … b04   (선택 경로, 기본 비활성)
  └─ 챕터 엔딩   story_chapter_end_XX  (시작화면과 같은 intro 시네마틱)
```

실기 슬롯은 **챕터1 퀘스트1 = `story_001`** 뿐이다. 나머지는 `contentStatus=skeleton`.  
전투 페이싱 전수(존 TCL·허브/웨이브·q02/q06 드라코)는 `docs/PLAY_SCENARIO_COMBAT_LEVEL_ADVANCEMENT.md`.

## 대표님 시나리오가 오면 채울 곳

| 넣을 내용 | 파일 |
|---|---|
| 챕터 제목·주제 | `tables/content/main_story_chapters.csv` (`titleKo`/`themeKo`) |
| 퀘스트 제목(골격 문구 교체) | `main_story_quests.csv` |
| 실제 수락 미션·보상·목표 | `missions.csv` + `mission_objectives.csv` → `bindMissionId` 연결, `contentStatus=ready` |
| 연퀘 하위 미션 | `main_story_chain_steps.csv` (stepIndex 순) |
| 분기 선택 | `main_story_branches.csv` — `enabled=1`, `conditionKind=flag` |
| 챕터 엔딩 연출 문장 | `story_scenes.csv` / `story_scene_pages.csv` (`story_chapter_end_NN`) 후 `endStoryReady=1` |

## 분기

클리어 후 기본은 **같은 챕터 다음 q**, 마지막 **q30**은 **다음 챕터 q01**.  
**`story_cXX_q31` 이상은 없다.** v3 초안의 q31–q36은 무효.  
`enabled=1` 분기 행이 있고 플래그가 맞으면 그 `toQuestId`로 간다.  
샘플 3행(`br_sample_c01_*`)은 **비활성** — 패턴만 보여 준다.

플래그 API: `useMainStoryProgressStore.getState().setChoiceFlag(key, '1')` (최대 32개).

## 챕터 엔딩 연출

시작화면과 같은 `app/(game)/intro` 경로.

```text
/(game)/intro?sceneId=story_chapter_end_01&flow=chapterEnd
```

`endStoryReady=0`이면 href를 만들지 않는다. 페이지가 비어 있으면 허브로만 돌아간다.  
완료 정책: `return_hub_after_chapter_story` (튜토리얼 재시작 없음).

## 런타임

| 모듈 | 역할 |
|---|---|
| `src/missions/mainStory/mainStoryCatalog.ts` | 부트 1회 Map |
| `resolveMainStoryProgression.ts` | 다음 퀘스트·현재 오퍼·클리어 후 연퀘 |
| `src/store/mainStoryProgressStore.ts` | 분기 플래그·엔딩 대기 · 계정 초기화 연동 |

허브 [대화] 오퍼는 **현재 골격 슬롯이 ready인 bind 미션만**. 지금은 `story_001`.
