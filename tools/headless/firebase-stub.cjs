/**
 * Headless @react-native-firebase/* stub — 경제 감사·CI(tsx 경로 치환) 전용.
 * 실모듈은 import 시 react-native를 끌어와 esbuild 변환이 실패한다
 * (2026-10-03: planetUniqueDeedLock → firestore → app → react-native, 3h 감사 TransformError).
 * 어떤 이름을 꺼내도 no-op 함수를 돌려준다. 감사 경로는 Firebase를 실제로 호출하지 않는다.
 */
'use strict';

const noop = new Proxy(function headlessFirebaseNoop() {}, {
  get(_t, prop) {
    if (prop === 'then') return undefined; // thenable 오인 방지
    if (prop === Symbol.toPrimitive) return () => '';
    return noop;
  },
  apply() {
    return noop;
  },
  construct() {
    return noop;
  },
});

module.exports = new Proxy(
  { __esModule: true, default: noop },
  {
    get(target, prop) {
      if (prop in target) return target[prop];
      return noop;
    },
  },
);
