# 기기대응 UI 설계 v0.2 — 김클로드 보강안 검수 + 대표님 태블릿 참고 반영

```text
status=REVIEWED
task_id=device-adaptive-ui-design-reinforcement-20260923
verdict=PARTIAL
date=2026-09-23
owner=김팀장
code=0
정본=docs/DEVICE_ADAPTIVE_UI_DESIGN.md  (v0.1 → v0.2)
김클로드=tools/kim-team-lead/reports/kim-claude-device-adaptive-ui-design-reinforcement-20260923.md
```

## 0. 김클로드 재검수

방향(Play Frame · 크롬 고정 · 시야 유동)은 **AGREE**. 문서 전체를 다시 쓰지 않고 **각주·절 보강**만 했다. 코드 없음.

| # | 김클로드 제안 | 판정 | 조치 |
|---|---|---|---|
| 1 | §4에 WSC Compact/Medium/Expanded 열 | **AGREE** | v0.2 표에 참고 열 |
| 2 | 공식 701/640/800으로 700 선확정 | **DISAGREE** | QA 기준선만 기록. 공식 8형 min=640은 기존 700 **밖**. 기존값 변경은 2순위 때 재확인 |
| 3 | Play Adaptive Tier 트레이드오프 명문화 | **AGREE** | §4-2. 1순위 유지 |
| 4 | Fold 펼침 vs 커버 화면 분리 | **AGREE** | Fold-Open / Fold-Cover. 구현 3순위 |
| 5 | 좌우 inset 비대칭 각주 | **AGREE** | §3-2 거터를 inset 후 분배로 정리 |
| 6 | 오포 등 표준 안드로이드 | **AGREE** | §4-3 |

공식 테스트 치수(841×701 · 1024×640 · 1280×800)와 Tier 3/2/1은 [Adaptive app quality guidelines](https://developer.android.com/docs/quality-guidelines/adaptive-app-quality)에서 김팀장이 재확인.

## 1. 대표님 참고 (2026-09-23) — 신규 기준

> 화면이 큰 태블릿일 경우 게임화면 전체를 확대하는 기준 적용 등으로 대응하면 된다.

v0.1 「태블릿은 시야만 키우고 버튼 1.0」을 **§3-5로 교체**.

- `playScale = min(availW/390, availH/844)` — Tablet 밴드만
- 논리 ORBIT 320 유지. 렌더·터치만 같은 배율
- 기존 행성 1.22 · width≥900 `tabletBoost`는 2순위 때 이 배율로 흡수(이중 확대 금지)
- 폰 밴드에는 적용 금지

## 2. 김팀장 추가 조사

- `app.json` `orientation: portrait` — 가로는 3순위
- iOS `supportsTablet: false` — 2순위 태블릿 = 안드로이드
- 거터는 성운 채움(검정 레터박스 아님) → Play Tier 3 Ready와 충돌하지 않음

## 3. 구현

승인 전 **코드 없음.** 1순위는 여전히 Phone-R 이웃 · `playScale=1`.
