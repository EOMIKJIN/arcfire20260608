// firebase/* 얕은 모크 — daily batch 재현에서 실제 네트워크·RN Firebase SDK 내부 크래시 회피.
// 배치 로직 자체(행성 코어·경제 등)는 firebase를 거의 안 씀 — 최소 스텁으로 충분.
module.exports = new Proxy(
  {
    getCurrentUser: () => ({ uid: 'debug_repro_uid' }),
    isArcCoreRtdbAvailableForSession: () => false,
  },
  {
    get(target, prop) {
      if (prop in target) return target[prop];
      return (..._args) => undefined;
    },
  },
);
