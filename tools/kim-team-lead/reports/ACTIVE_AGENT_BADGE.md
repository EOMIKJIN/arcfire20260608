# Arcfire Active Agent Badge
> **자동 갱신** — 메시지 전송·세션 시작 시 Hook이 갱신합니다. Cursor에서 이 파일을 열어 두면 페르소나를 확인할 수 있습니다.
| 항목 | 값 |
|------|-----|
| **현재 페르소나** | 🛠️ **김팀장** |
| 결정 방식 | 세션 잠금 (session-persona-lock.json) |
| 전담 | UI 팀원 (2026-10-09~) · UI .tsx·간단한 서브작업 — 김플레이 배정분 |
| 위임 | Skia 루프·STAGE·arcCore·일일배치·메모리 구조·크래시 근본 수정·커밋 금지 → 김플레이(메인리더)에게 넘김 |
| 갱신 시각 | 2026-10-08T17:41:45.864Z |
**잠금**: user_explicit_switch · 2026-07-17T01:57:00.000Z
## 전환 명령 (이 채팅에 입력)
- `김경제로 전환` · `@김경제` → **감시·점검 전용** 세션 잠금 (코드 수정 없음)
- `김팀장으로 전환` · `@김팀장` → UI 팀원 세션 잠금 (런타임 대형 작업은 메인리더 김플레이)
- `페이블로 전환` · `@Fable` · `@페이블` → **Table-First 구현** 세션 잠금
## 파일
- 잠금 상태: `.cursor/session-persona-lock.json`
- 정본: `.cursor/rules/gemini-code-agent-routing.mdc`