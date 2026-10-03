# 은하 지도 퀘스트 목적지 마크 — 설계 검토 v1

> **작성**: 2026-10-03 · 김팀장  
> **상태**: **dest-only 반영** (대표님 확인: 미수락 안 찍음 · 바/튜토리얼 제외 · 다이아 유지)  
> **지시**: 수락한 메인·정식 서브만. 현재 세부미션 성계. 안개 성계에도. 메인 파란 · 서브 하얀.  
> **교차**: `src/galaxyMap/galaxyMapQuestAcceptMarks.ts` · `useGalaxyMapQuestAcceptMarks.ts` · `GalaxyMapSystemsSvg.tsx` · `app/(game)/worldmap.tsx`

```text
[pss-pre-dev] hot_path=수락/목표완료 revision 1회 · 렌더는 기존 Path 2개 rewind 배칭
[pss-pre-dev] alloc=활성 퀘스트 성계 id 수 개(주선+부선) · persist 신설 없음 · 전 행성 루프 금지
[pss-pre-dev] cache=revision 키(활성 missionId + 현재 세부미션 id) · planetMemo 아님 · 안개 목록 비의존
[pss-pre-dev] stage=worldmap Svg만 · 허브/전투 무관 · Navigation.replace 불변
[pss-pre-dev] verdict=PASS
```

---

## 0. 확정 규칙

| 항목 | 값 |
|------|-----|
| 찍는 때 | `status='active'` 만 |
| 찍는 곳 | 현재 세부미션 성계 (`getCurrentSequentialObjective`) |
| 안 찍음 | 미수락 · 완료 · 바 `sandbox_001–033` · 튜토리얼 `mission_*` |
| 대상 | ready 메인 `story_*` + 챕터1 정식 서브 13종 |
| 안개 | 노드가 꺼져도 좌표 있으면 찍음 |
| 모양·색 | 기존 다이아 · 메인 `#4DA3FF` · 서브 `#FFFFFF` |
| Offer 층 | **없음** (대표님: 안받은 퀘 찍지 말 것) |

좌표 규칙:

- `reach_system` → 성계 id
- `reach_planet` / `talk_npc` / `deliver_cargo` → 행성(`captainId\|planetId` 포함) → 성계
- 행성/성계를 못 읽으면 마크 없음 (offer 폴백 없음)

---

## 1. 파일

| 파일 | 역할 |
|------|------|
| `galaxyMapQuestAcceptMarks.ts` | dest resolve + revision(활성 obj id) |
| `useGalaxyMapQuestAcceptMarks.ts` | missionStore revision만. 안개 목록 없음 |
| `GalaxyMapSystemsSvg.tsx` | Path 2개 배칭 · `systemById` 좌표 |
| `worldmap.tsx` | 훅 인자 없음 |

---

## 2. HOLD

CSV·서브퀘 신규 행 · story_001 문장 · 색/다이아 크기 변경 없음.
