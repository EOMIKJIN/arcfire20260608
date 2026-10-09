// ============================================================
// dev 빌드 안정화 — React DevTools 렌더러 연결을 기본으로 끈다 (2026-10-09 · 대표님 지시 「개발 빌드 안정화 1순위」)
//
// 왜: SDK 54(RN 0.81 · React 19.1)부터 DevTools 프런트엔드가 연결되지 않아도 렌더러 인터페이스가
//     커밋마다 fiber 추적 데이터를 보유해, 허브 체류 중 Hermes 힙이 약 0.8MB/분 계단식으로 올랐다.
//     훅 처리를 끄자 증가가 약 70% 줄었다(김플레이 실측 · tools/play-bot-console/logs/soak/retention-probe-20261009/).
// 어떻게: RN 이 InitializeCore 에서 이미 설치한 훅 객체에 isDisabled 만 켠다(객체 교체 금지 —
//     connectToDevTools 가 훅 메서드를 쓴다). React 렌더러와 Skia reconciler 는 injectInternals 에서
//     hook.isDisabled 면 붙지 않는다. 이 모듈은 index.js 에서 expo-router/entry 보다 먼저 import 돼야 한다.
// 다시 켜기(React DevTools · 컴포넌트 패널 · Element Inspector 가 필요할 때):
//     EXPO_PUBLIC_ARC_ENABLE_RDT=1 로 Metro 재시작 (예: PowerShell `$env:EXPO_PUBLIC_ARC_ENABLE_RDT='1'; npx expo start --dev-client`)
//     값은 번들 시점에 인라인되므로 Metro 재시작 + 앱 콜드스타트가 필요하다.
// release: __DEV__ 가 false 라 분기 전체가 번들에서 제거된다.
// ============================================================

if (__DEV__ && process.env.EXPO_PUBLIC_ARC_ENABLE_RDT !== '1') {
  const hook = globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
  if (hook) {
    hook.isDisabled = true;
  }
  // eslint-disable-next-line no-console
  console.log(
    '[arc-dev] React DevTools 렌더러 연결 OFF (dev 메모리 안정화). 필요하면 EXPO_PUBLIC_ARC_ENABLE_RDT=1 로 Metro 재시작.',
  );
}
