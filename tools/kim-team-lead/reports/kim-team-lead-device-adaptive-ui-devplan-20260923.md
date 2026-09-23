# 기기대응 v0.4 — 현재 UI 코딩 실측 + 개발계획

```text
status=DESIGN_ONLY
date=2026-09-23
owner=김팀장
code=0
정본=docs/DEVICE_ADAPTIVE_UI_DESIGN.md v0.4 §11–§12
```

현행 표시는 Play Frame이 아니라 **StageShell(하단만 SafeArea+72 spacer) + 허브 메트릭 + maxWidth 430 리터럴**이다. 1순위 개발은 식을 `devicePlayFrame`으로 옮기고 값(72/54/320/430/1.1/34/52/140)은 0 변경. 하단 inset은 셸·도크·스크롤 중첩 — 시각 0으로만 한곳. 360 전투 시각 352는 여유 8dp. 퀘스트+짧은 폰은 슬롯<320(Phone-S 이후).
