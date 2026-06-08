# World Object 공통 레이어

소행성, 잔해물, 기지 같은 우주 오브젝트를 공통 모델로 다루기 위한 기반 레이어.

## 목표

- 그래픽 표현과 기획 기능(채광/수거/도킹)을 분리한다.
- 화면(`app/(game)`)은 오브젝트 조회/표시/클릭 전달만 담당한다.
- 기능 시스템은 `src/systems/*`에 독립 컴포넌트로 추가한다.

## 현재 구성

- `types.ts`: 공통 오브젝트/인터랙션 타입
- `query.ts`: 행성 기준 오브젝트 목록 조회 진입점
- `index.ts`: 외부 공개 API

## 확장 규칙

- 오브젝트 추가: `listPlanetWorldObjects()`에서 객체 소스를 확장(CSV/DB/아크코어)
- 인터랙션 추가: `src/systems/worldObjects/interactionComponents.tsx`에 독립 컴포넌트 등록
- 채광 시스템은 `src/systems/mining`에서 상태/보상 규칙만 담당하고, 월드오브젝트 레이어는 대상/인터랙션 연결만 담당

