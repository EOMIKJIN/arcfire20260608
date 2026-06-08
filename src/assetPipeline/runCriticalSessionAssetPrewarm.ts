// ============================================================
// 세션 진입 직전 — 이미지 디코드·캐시 워밍 (테이블/스토어는 `runContinueSessionPrewarm`)
// ============================================================

import { prefetchImageSources } from './prefetchImageSources';
import { listCriticalSessionImageSources } from './criticalSessionImageModules';

let prewarmPromise: Promise<void> | null = null;

/**
 * 타이틀 이어하기 로딩 구간에서 호출.
 * 무거운 테이블 JSON은 이미 번들에 포함; 여기서는 **첫 프레임 이미지 스파이크** 완화가 목표.
 */
export async function runCriticalSessionAssetPrewarm(): Promise<void> {
  if (!prewarmPromise) {
    prewarmPromise = prefetchImageSources(listCriticalSessionImageSources()).catch(() => {
      /* 프리워밍 실패 시 1차 진입 로드로 폴백 */
    });
  }
  await prewarmPromise;
}
