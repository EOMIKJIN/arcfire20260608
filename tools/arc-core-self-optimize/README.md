# 아크코어 자기 최적화 × Cursor 에이전트

아크코어 완성 전 단계에서 **일일 점검 결과를 바탕으로**, Cursor 에이전트(Cloud Agent 또는 새 Agent/채팅)가 **아크코어 범위만** 안전하게 손볼 수 있게 **핸드오프 문서**를 만든다.

## 한 번에 패키징

```bash
npm run audit:arc-self-optimize:pack
```

- `audit:daily` 실행
- `outbox/cursor-handoff.md` 생성 (`PROMPT_TEMPLATE.md` + 최신 일일 보고서)

## Cursor 에이전트에 넘기기

1. **Cloud Agent** 또는 새 세션을 연다.
2. **`tools/arc-core-self-optimize/outbox/cursor-handoff.md`** 를 첨부(또는 내용 붙여넣기).
3. 에이전트에게 “첨부 지시문대로만 수정”이라고 한 줄만 추가해도 된다.

## 에이전트 `stop` 훅 (옵트인)

저장소에 `.cursor/hooks.json` 이 포함되어 있다. **기본적으로 아무 일도 하지 않는다.**

다음 파일을 만들면 **다음 에이전트 응답 종료(`stop`) 시 한 번** 안내 메시지가 이어진다.

```powershell
New-Item -ItemType File -Path .cursor/trigger-arc-self-optimize-on-stop -Force
```

- 훅이 파일을 **삭제**하므로 1회 트리거다.
- 자동 루프를 막기 위한 설계다.

## 주의

- 에이전트는 **코드 수정을 자동 승인하지 않는다** — 리뷰 후 커밋.
- CSV 정본·대규모 UI는 템플릿상 금지; 필요 시 사람이 범위를 넓힌다.
