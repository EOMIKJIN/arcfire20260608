# Arcfire — 아키텍처 리스크 레지스터

**최종 갱신**: 2026-06-08  
**소유**: 아크코어·클라이언트 공통  
**연계**: [`Arcfire_Architecture_Audit_2026-06-08.md`](./Arcfire_Architecture_Audit_2026-06-08.md)

---

## 사용 방법

| 심각도 | 의미 |
|--------|------|
| **P0** | 출시·데이터 무결성 직결 — 릴리스 전 완화 또는 명시적 수용 |
| **P1** | 반복 플레이·성능·유지보수 — 스프린트 내 처리 |
| **P2** | 기술 부채·문서 — 백로그 |

**상태**: `OPEN` · `MITIGATED` · `ACCEPTED` · `CLOSED`

---

## 리스크 목록

### R-01 — 클라이언트 관리자 판별 (P0)

| 항목 | 내용 |
|------|------|
| **설명** | `userDataSync.resolveUserType`이 `local-guest`·닉네임 `Representative`를 admin으로 분류. Firestore payload에 `isAdmin` 클라이언트 기록. |
| **영향** | 악의적 클라이언트가 admin 플래그 위조 시도 가능(서버 Rules 미강화 시). |
| **방지책** | ① Firestore Security Rules에서 `isAdmin` 클라이언트 쓰기 **거부** ② 프로덕션은 Firebase Auth 필수, guest는 `__DEV__`만 ③ 관리 기능은 Cloud Functions + Custom Claims |
| **상태** | OPEN (개발 편의 수용 중) |

### R-02 — Firestore 전체 유저 번들 동기화 (P1)

| 항목 | 내용 |
|------|------|
| **설명** | `syncUserDataWithServer`가 player·world·planetCoreRuntime 등 대형 객체 merge. 아크코어 일일 패치 시 스로틀(120s) 적용됨. |
| **영향** | 빈번 동기화 시 배터리·로그 스팸·오프라인 큐 비대화. |
| **방지책** | ① `scheduleUserCloudSync` 최소 간격 유지 ② 행성 코어 persist는 AsyncStorage 정본, 클라우드는 부팅·포그라운드·명시 저장만 ③ 모듈러 Firestore API 완료 |
| **상태** | MITIGATED (2026-06-08 스로틀 + modular doc) |

### R-03 — 마스터 스펙 v2.0 드리프트 (P1)

| 항목 | 내용 |
|------|------|
| **설명** | `aiVirtualPlayerStore` 등 미구현 항목이 스펙·체크리스트에 “완료”로 표기. 신규 개발자가 잘못된 경로 구현 가능. |
| **영향** | 이중 스토어·Firestore 저장 위반·메모리 계약 파괴. |
| **방지책** | ① 마스터 스펙 **§18 구현 정본** ② 에이전트는 `.cursor/rules/Arcfire_Master_Spec_v3.1_Final-1781345284482521549.mdc` 우선 ③ 체크리스트 §15 오표 정정 |
| **상태** | MITIGATED (§18 추가 2026-06-08) |

### R-04 — 전투·시뮬 God 파일 (P1)

| 항목 | 내용 |
|------|------|
| **설명** | `PlanetEdenRaidTestLayer.tsx` ~146KB, `planet.tsx` ~102KB. 레거시 `PlanetEdenRaidOrbitSvgRafCombat` 미사용 블록 잔존. |
| **영향** | rAF/타이머 cleanup 누락 시 회귀 탐지 어려움, 번들·IDE 성능 저하. |
| **방지책** | ① 전투 렌더 **Skia 단일** 규칙 유지 ② 레거시 SVG RAF **삭제 일정** ③ 신규 로직은 `src/combat/` 모듈로만 추가 |
| **상태** | OPEN |

### R-05 — 메모리 예산 미실측 (P2)

| 항목 | 내용 |
|------|------|
| **설명** | 스펙 Stage 1 <200MB 등은 설계 목표이나 자동화된 힙 실측 CI 없음. |
| **영향** | 저사양 기기 크래시 사전 감지 불가. |
| **방지책** | ① `audit:memory` 정적 계약 CI 유지 ② 분기별 Android Profiler 10회 전투 루프 기록 |
| **상태** | OPEN |

### R-06 — functions/ 타입체크 실패 (P2)

| 항목 | 내용 |
|------|------|
| **설명** | `audit:daily` tsc가 `functions/` firebase-admin 누락으로 exit 2. |
| **영향** | 일일 감사 노이즈, 실제 회귀 놓침. |
| **방지책** | ① `tsc -p tsconfig.app.json` 분리 ② functions 전용 workflow |
| **상태** | OPEN |

### R-07 — 오프라인 일일 배치 누락 (P2, ACCEPTED)

| 항목 | 내용 |
|------|------|
| **설명** | 앱이 배치 시각(12:00)에 꺼져 있으면 당일 배치 스킵. 다음날 12:00 이후 1회만 실행. |
| **영향** | 하루치 관측이 다음 배치에 합쳐짐 — 설계 수용 범위. |
| **방지책** | 정책 CSV `observationWindowHours=24` 유지; 필요 시 서버 Cron 백업(로드맵). |
| **상태** | ACCEPTED |

---

## 신규 리스크 등록 템플릿

```markdown
### R-XX — 제목 (P?)
| **설명** | |
| **영향** | |
| **방지책** | |
| **상태** | OPEN |
```

---

## 에이전트·CI 방지책 (고정)

1. **화면 `setInterval`/rAF** → `registerPlanetSessionResource` 또는 `useEffect` cleanup 필수.
2. **행성 정적 데이터** → `memoizePerPlanet` / CSV 인덱스 1회.
3. **세계 규칙·밸런스 패스** → `ArcCoreDailyOpsSubCore` 또는 `dispatchCommand` — 화면 전용 루프 금지.
4. **CSV 엔티티** → `tables/content` 등록 후 `build:*-tables` — 코드 하드코딩 금지.
5. **PR 전** → `npm run audit:memory` + `npx tsc --noEmit` (app·src).
