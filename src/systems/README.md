# 시스템 단위 기능 추가 규칙

향후 기능(합성, 도시관리, 포로, 용병, 채광 등)은 화면 파일 하나에 직접 로직을 늘리지 말고, `src/systems` 아래 독립 모듈로 추가한다.

## 원칙

- 기능별 디렉터리를 분리한다. 예: `src/systems/synthesis`, `src/systems/cityManagement`
- 각 시스템은 화면에 필요한 공개 API만 노출한다.
- 화면(`app/(game)/*.tsx`)은 시스템 모듈을 조합만 하고, 내부 비즈니스 로직을 갖지 않는다.
- 시스템별 상태/검증/라우팅 조건을 한 파일에 모아 장애 지점을 빠르게 찾을 수 있게 한다.

## Planet 허브 메뉴 예시

- 메뉴 등록 진입점: `src/systems/planetHub/planetHubFeatureSystems.ts`
- `buildPlanetHubFeatureMenuItems()`에 항목을 추가하면 행성 허브 버튼을 독립적으로 확장할 수 있다.

## 신규 시스템 권장 구조

- `index.ts`: 외부 공개 API
- `types.ts`: 시스템 전용 타입
- `service.ts`: 핵심 규칙/계산
- `adapters/*.ts`: store/router/db 연결

