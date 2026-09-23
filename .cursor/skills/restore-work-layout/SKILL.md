---
name: restore-work-layout
description: Restore the saved Arcfire Cursor work layout (김클로드 center tab, 김팀장 right Agent). Use when the user says 기존작업환경 복구, 작업환경 복구, restore work layout, or Claude Code is stuck as a tiny left-sidebar panel.
---

# 기존작업환경 복구

대표님이 「기존작업환경 복구」라고 하면 아래만 실행한다. 게임 코드는 수정하지 않는다.

## 정본

- 스냅샷: `.cursor/work-layout/WORK_LAYOUT.json`
- 스크립트: `.cursor/work-layout/restore-work-layout.ps1`

## 복구 상태

- 김팀장 = 오른쪽 Cursor Agent 창 (이 세션)
- 김클로드 = 가운데 에디터 탭 (`Claude Code: Open in New Tab`)
- 왼쪽 아래 Claude 아이콘은 쓰지 않음 (사이드바 작은 칸으로 열림)

## 절차

1. 실행:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .cursor/work-layout/restore-work-layout.ps1
```

작업 디렉터리는 저장소 루트(`d:\arcfire20260607`).

2. 스크립트가 설정 반영 + 가운데 탭 오픈 명령을 보낸다.
3. 대표님께 한 줄로 보고한다. 탭이 안 열리면 같은 스크립트를 한 번 더 실행한다.

## 한계

- 채팅 기록·열린 파일 목록·창 픽셀 비율은 복구하지 않는다.
- `claudeCode.preferredLocation=panel` 과 김클로드 가운데 탭만 고정한다.
