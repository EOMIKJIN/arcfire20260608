// ============================================================
// 앱 부트 완료 신호 — 루트 레이아웃의 로컬 스토리지 하이드레이션 + 월드/코어 부트스트랩이
//   "전부" 끝난 시점에만 true 가 된다. 타이틀 화면은 이 신호로 버튼 활성화를 게이트하여,
//   RN 초기화가 완전히 끝나기 전(무거운 부트가 JS 스레드 점유 중)에는 버튼 입력을 막는다.
//   (버튼이 보이는데 탭 시 처리 지연·렉이 생기는 회귀 방지)
// ============================================================
import { create } from 'zustand';

type AppBootState = {
  /** 로컬 하이드레이션·월드/코어 부트스트랩 완료(네트워크·프리웜 제외) */
  bootReady: boolean;
  setBootReady: (ready: boolean) => void;
};

export const useAppBootStore = create<AppBootState>((set) => ({
  bootReady: false,
  setBootReady: (ready) => set({ bootReady: ready }),
}));
