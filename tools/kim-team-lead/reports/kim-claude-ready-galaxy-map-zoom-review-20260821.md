# READY — 은하 지도 줌 설계 검수

```text
status=REVIEWED
task_id=galaxy-map-zoom-review-20260821
assignee=김클로드
kind=DESIGN_REVIEW
code_changes=NO
commit=FORBIDDEN
post_review=김팀장 재대조 (대표님 지시 2026-08-21)
```

> **배정**: 김팀장 · 2026-08-21  
> **김클로드**: 김팀장 문서를 **받아쓰지 말 것**. `worldmap` 탭·팬·이동 코드와 대조한 뒤 AGREE/PARTIAL/DISAGREE + 근거. **git commit 금지.**  
> **끝나면** `kim-claude-handoff-pending.md` 상단에 `status=PENDING` · 김팀장이 확인.

정본: `docs/은하지도_줌_개발계획.md`  
교차: `docs/은하지도_이동포그_개발계획.md` (포그와 분리) · `app/(game)/worldmap.tsx` (지금 탭/팬)

---

## 검수 범위

설계만. 코드 구현·줌 착수 **아님**.

잠금이 맞는지, 지금 맵 조작과 충돌하는지, PSS/worklet 위험이 있는지만.

| 잠금 | 내용 |
|------|------|
| 5단 | `(최대축소)100% <> 50% <> 0% <> 50% <> 100%(최대확대)` |
| `0%` | 지금 지도 배율 1 |
| 클릭 | `[−]`/`[+]` 한 칸. 끝단까지 4클릭 |
| 핀치 | **없음** (1안) |
| 확대 후 | 탭·선택·이동 = **지금 시스템** |

---

## 확인 목록

1. 기하 5단(`S_min`, `√`, `1`, `√S_max`, `1/S_min`)이 대표님 100/50/0/50/100과 같은가
2. 정보창 위 좌`[−]` 우`[+]`가 하단 `styles.panel`과 겹치지 않는가
3. 확대 단에서 `Gesture.Tap` + 팬 + 이동 메뉴가 배율만 먹고 깨지지 않는가 (`handleMapTapAt` · `toScreen`)
4. 핀치 거부가 월드맵 worklet/SIGSEGV 이력과 맞는가
5. 최대축소 스크롤 0이 `maxScroll` 클램프와 맞는가
6. 포그(차트/프론티어/차폐)와 줌을 섞지 않았는가
7. 세션 배율(persist 없음)이 purge/계정과 충돌 없는가

보강·리스크만 handoff에. 코드 diff 금지.