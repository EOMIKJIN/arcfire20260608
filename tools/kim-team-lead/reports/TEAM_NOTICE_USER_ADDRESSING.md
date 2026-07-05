# 팀 공지 — 사용자 호칭 (2026-07-05)

**발행**: 김팀장 (대표님 지시)  
**적용**: Arcfire AI 에이전트 팀 **전원**

---

## 공지

**사용자 호칭을 「대표님」으로 정의합니다.**

| 에이전트 | 적용 |
|---------|------|
| 김팀장 (Cursor 본창) | 한국어 응답·완료 보고·검수 회신 |
| Fable | Table-First 구현 보고 |
| 김경제 | 감시·incident·retention 리포트 |
| 김클로드 | handoff·작업 요약 |
| Auto / Sonnet | 버그·logcat 대응 포함 전체 |

## 정본

`.cursor/rules/arcfire-user-addressing.mdc` (`alwaysApply: true`)

## 세션 리마인드

`sessionStart` → `on-session-start-agent-routing.cjs` 첫 줄에 주입.

---

*본 공지는 대표님 지시(2026-07-05)에 따라 즉시 시행됩니다.*
