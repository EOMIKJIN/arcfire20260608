# 아크파이어 운영시 필수조치 피쳐리스트

> **관리자**: 김클로드(Anthropic Claude Code) 전담 — 이 문서의 신설·갱신·정리는 김클로드가 담당한다.
> **생성**: 2026-07-18 (대표님 지시 — firestore.rules 재검수 중 발견한 항목을 계기로 신설)

## 이 문서의 목적

코드 검수·분석 중 발견되지만 **① 지금 당장 고칠 필요는 없고, ② 한 줄짜리 단순 버그도 아닌** — 즉 별도의 설계·검토가 필요한 "피쳐 단위" 개선 항목을 누적 관리한다.

- **여기 안 들어가는 것**: 즉시 고칠 수 있는 단순 버그(기존처럼 발견 즉시 `tools/kim-team-lead/reports/kim-claude-handoff-pending.md`에 PENDING으로 올려 바로 처리).
- **여기 들어가는 것**: 운영(정식 서비스 가동) 관점에서 언젠가는 반드시 다뤄야 하지만, 설계 판단이 필요하거나·범위가 넓거나·지금 진행 중인 다른 작업과 겹쳐서 지금 당장 손대면 리스크가 있는 항목.
- **처리 절차**: 이 목록의 항목에 실제 착수하기로 결정되면, 설계·구현은 기존 절차(김클로드 초안 → `kim-claude-handoff-pending.md` PENDING → 김팀장 검수·커밋)를 그대로 따른다. 이 문서는 "착수 전 대기 상태"만 추적한다.
- **상태 값**: 🔴 미착수 · 🟡 검토중(설계 필요) · 🟢 설계완료(착수 대기) · ✅ 해결(착수해 반영 완료 — 완료 후에도 이력으로 남겨둠, 삭제하지 않음)

---

## OPS-001 — `arc_core_shadow_profiles/{uid}` Firestore 쓰기 권한 미비

| 필드 | 내용 |
|---|---|
| **상태** | 🔴 미착수 |
| **분류** | 보안 · 데이터 무결성 |
| **발견** | 2026-07-18, 폴더구조 리팩토링 반영분 재검수 중(firestore.rules 정식출시본 검토) |
| **문제** | `match /arc_core_shadow_profiles/{uid} { allow create, update: if authed(); ... }` — 소유권(`request.auth.uid == uid`) 체크·필드 제한·불변성 전부 없음. 짝 유저의 uid를 아는 클라이언트(정상 매칭만으로 자기 짝의 uid를 로컬에 갖게 됨 — 아래 OPS-002와 동일 전제)가 그 사람의 `arc_core_shadow_profiles` 문서(전투 스탯 스냅샷)를 임의로 덮어써서, 그 사람의 아크코어 본진 보스전(짝 유저 복제 보스) 난이도를 조작할 수 있음. |
| **왜 즉시수정이 아닌가** | 이 문서를 publish하는 코드(`publishArcCoreShadowShipProfile`)가 항상 자기 자신의 uid로만 쓴다는 게 사실이면 `request.auth.uid == uid` 한 줄로 끝나는 단순 수정일 가능성이 높음 — 다만 이게 정말 유일한 쓰기 경로인지(향후 확장 시에도 유지되는 불변식인지) 설계 확인이 필요해서 일단 이 목록에 올려둠. 확인되면 단순 버그로 재분류해 바로 처리해도 됨. |
| **관련 파일** | `firestore.rules`, `src/firebase/arcCoreShadowPairing.ts`(`publishArcCoreShadowShipProfile`), `src/arcCore/shadow/runArcCoreShadowPairingPass.ts` |
| **제안 방향(잠정)** | `allow create, update: if authed() && request.auth.uid == uid;` 로 교체 — 단, publish 호출부가 전부 self-uid인지 재확인 후 적용. |

## OPS-002 — `users/{uid}` Firestore 쓰기에 소유권 검증 부재

| 필드 | 내용 |
|---|---|
| **상태** | 🔴 미착수 |
| **분류** | 보안 |
| **발견** | 2026-07-18, 동일 검수 |
| **문제** | `match /users/{uid} { allow create, update, delete: if authed(); ... }` — `request.auth.uid == uid` 체크가 없어, 인증된 아무 클라이언트나 다른 유저의 uid를 알면 그 문서를 수정·삭제 가능. 하위 컬렉션 `game_save_backups`는 이미 이 체크가 있어서, 부모 문서만 빠진 비대칭. |
| **공격 경로(재확인됨)** | 섀도우 페어링 매칭 시 짝 유저의 실제 uid가 `arcCoreShadowIdentityStore`(AsyncStorage)에 평문 저장됨 — 정상 플레이만으로 "내가 아는 uid 1개"가 생김. 그 외(닉네임 해시만 저장, list 전면 차단 등) 경로로는 uid 획득 불가 확인. 즉 공격 대상은 "임의의 유저"가 아니라 "나와 매칭된 그 1명"으로 한정됨(2026-07-18 대표님 질의로 정정 확인). |
| **왜 즉시수정이 아닌가** | `users/{uid}`는 전체 유저 기반 핵심 문서라 영향 범위가 넓고, `request.auth.uid == uid` 하나만 추가해도 되는지(예: 향후 관리자/서버 기능이 타 유저 문서를 써야 하는 케이스가 있는지) 설계 확인 필요. |
| **관련 파일** | `firestore.rules` |
| **제안 방향(잠정)** | `allow create, update, delete: if authed() && request.auth.uid == uid;` — `game_save_backups`와 동일 패턴 통일. |

## OPS-003 — `arc_core_shadow_pool/{slotId}` · `arccore/{docId}` 쓰기 보호 부재(영향 범위 미확인)

| 필드 | 내용 |
|---|---|
| **상태** | 🔴 미착수 |
| **분류** | 보안 · (arccore는) 운영 안정성 |
| **발견** | 2026-07-18, 동일 검수 |
| **문제** | 둘 다 `allow create, update, delete: if authed();`(소유권 체크 없음). `arc_core_shadow_pool`은 매칭 대기열(샤딩 슬롯) — 남용 시 매칭 방해 정도로 영향 제한적. `arccore/{docId}`는 `config`·`schedule`·`subcores` 3개 **전역 공유** 문서(유저별 아님) — `enabled`/`safeMode`/`tickScale` 필드를 담음. |
| **왜 즉시수정이 아닌가 / 확인 필요** | `arccore/*` 필드들이 실제로 클라이언트에서 "살아있는 게이트"로 읽혀 전체 유저 동작에 영향을 주는지, 아니면 최초 시드 후 아무도 읽지 않는 값인지 **아직 추적 못함**. 전자면 임의 유저가 전체 게임을 끄거나(`enabled:false`) tick을 0으로 만들 수 있는 심각한 문제, 후자면 사실상 무해. 이 확인이 선행돼야 조치 방향(쓰기 완전 차단 vs 소유권 체크)을 정할 수 있어서 설계 검토 항목으로 분류. |
| **관련 파일** | `firestore.rules`, `src/firebase/arccoreFirestoreBootstrap.ts` |
| **제안 방향(잠정)** | 우선 `arccore/{docId}`가 최초 시드 후 실제로 읽혀 쓰이는지 콜사이트 추적 → 안 쓰이면 시드 완료 후 쓰기 전면 차단, 쓰이면 별도 보호 설계. `arc_core_shadow_pool`은 우선순위 낮음. |

---

## 다음 항목 추가 시 형식

새 항목은 `OPS-NNN`(3자리 순번)으로 위에 이어서 추가한다. 필드 구성(상태·분류·발견·문제·왜 즉시수정이 아닌가·관련 파일·제안 방향)은 위 3개 항목과 동일하게 유지 — 형식을 바꾸지 말고 계속 이 틀로 누적한다.
