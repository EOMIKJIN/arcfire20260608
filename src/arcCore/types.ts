/**
 * 아크코어 (Arc Core) — 게임 AI 중추의 공통 타입.
 * 서브코어(도메인 단위) + 프로세스(세부 작업 단위)를 한 벽시계 축으로 구동한다.
 */

import type { ArcCoreCommand } from './ArcCoreCommandBus';

export type ArcCoreTickContext = {
  /** 이 엔티티(서브코어/프로세스)의 누적 벽시계 경과(초) */
  elapsedWallSec: number;
  /** 이번 프레임 경과(초, gameLoop 델타 기반) */
  wallDeltaSec: number;
};

export type ArcCoreWallTickFn = (ctx: ArcCoreTickContext) => void;

/** 서브코어 내부 장기 작업(시간 소모형 단계 진행 단위) */
export interface ArcSubCoreMission {
  readonly id: string;
  readonly name: string;
  /** 전체 단계 수(진행률 계산용) */
  readonly totalSteps: number;
  /** 현재 단계(0-based) */
  readonly currentStep: number;
  /** 단계 내 누적 진행 시간(초) */
  readonly stepElapsedSec: number;
  /** 완료 여부 */
  readonly done: boolean;
}

export interface ArcCoreProcess {
  readonly id: string;
  readonly elapsedWallSec: number;
  timeScale: number;
  paused: boolean;
  onWallTick?: ArcCoreWallTickFn;
  _advanceWallClock(wallDeltaSec: number): void;
}

/** 아크코어 하위 실행 단위(예: AI NPC, AI Planets) */
export interface ArcSubCore {
  readonly id: string;
  readonly displayName: string;
  readonly elapsedWallSec: number;
  timeScale: number;
  paused: boolean;
  onBoot?(): void;
  onShutdown?(): void;
  onWallTick?: ArcCoreWallTickFn;
  listMissions(): ArcSubCoreMission[];
  _advanceWallClock(wallDeltaSec: number): void;
}

export interface ArcCoreHub {
  registerSubCore(subCore: ArcSubCore): void;
  unregisterSubCore(id: string): void;
  getSubCore(id: string): ArcSubCore | undefined;
  listSubCores(): ArcSubCore[];
  registerProcess(process: ArcCoreProcess): void;
  createAndRegisterProcess(
    id: string,
    opts?: { timeScale?: number; onWallTick?: ArcCoreWallTickFn },
  ): ArcCoreProcess;
  unregisterProcess(id: string): void;
  getProcess(id: string): ArcCoreProcess | undefined;
  /** 통합 명령 진입점 — 내부적으로 `dispatchArcCoreCommand` 로 서브코어에 분배 */
  dispatchCommand(command: ArcCoreCommand): void;
  start(): void;
  stop(): void;
  /**
   * 앱이 비활성·종료된 동안 멈춘 벽시계를 실경과 시간만큼 한 번 보정한다(미션·일일 개방 등).
   * gameLoop 델타와 별개로 호출; 상한은 허브 구현이 캡한다.
   */
  applyOfflineCatchUpWallClock(deltaSec: number): void;
}

/*
 * 향후 자율 의사결정: 월드·클랜·미션 상태를 관측하는 프로세스가
 * `dispatchArcCoreCommand`(ArcCoreCommandBus)로 서브코어에 지시를 내리는 축을 둔다.
 * 현재는 테스트·디버그 진입점과 동일 버스를 쓴다.
 */
