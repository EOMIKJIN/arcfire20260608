// ============================================================
// 아크코어 (Arc Core) — 아크파이어 세계의 근원 마스터 AI 축(최종 허브)
// - 세계층: 테이블 정본 + 서브코어·프로세스·명령으로 환경·경제·NPC 등을 구동
// - 플레이어층: UI·계정 경험은 그 위에서 상호작용
// - 서브코어(도메인): AI NPC, AI Planets, 경제(무역소) …
// - 프로세스(세부 작업): 서브코어 하위 실행 단위
// - 단일 벽시계 축(gameLoop) — 연출·관측은 실시간, 운영·밸런스 재배치는 ArcCoreDailyOpsSubCore 일 1회 배치
// ============================================================

import { AppState, type AppStateStatus } from 'react-native';
import { gameLoop } from '../engine/GameLoop';
import type { ArcCoreHub, ArcCoreProcess, ArcCoreWallTickFn, ArcSubCore } from './types';
import { dispatchArcCoreCommand, type ArcCoreCommand } from './ArcCoreCommandBus';
import { registerDefaultArcSubCores } from './subcores/registerDefaultArcSubCores';
import { yieldJsThread } from './schedule/yieldJsThread';

class ProcessImpl implements ArcCoreProcess {
  timeScale = 1;
  paused = false;
  onWallTick?: ArcCoreWallTickFn;
  private _elapsedWallSec = 0;

  constructor(
    readonly id: string,
    opts?: { timeScale?: number; onWallTick?: ArcCoreWallTickFn },
  ) {
    if (opts?.timeScale !== undefined) this.timeScale = opts.timeScale;
    this.onWallTick = opts?.onWallTick;
  }

  get elapsedWallSec(): number {
    return this._elapsedWallSec;
  }

  _advanceWallClock(wallDeltaSec: number): void {
    if (this.paused || wallDeltaSec <= 0) return;
    const dt = wallDeltaSec * this.timeScale;
    this._elapsedWallSec += dt;
    this.onWallTick?.({ elapsedWallSec: this._elapsedWallSec, wallDeltaSec: dt });
  }
}

class ArcCoreHubImpl implements ArcCoreHub {
  private readonly subCores = new Map<string, ArcSubCore>();
  private readonly processes = new Map<string, ArcCoreProcess>();
  private unsubGameLoop: (() => void) | null = null;
  private unsubAppState: { remove: () => void } | null = null;
  /** 백그라운드일 때 true — 벽시계 분배만 멈춤 */
  private suspendWallClock = false;
  private defaultSubCoresBootstrapped = false;

  bootstrapDefaultSubCores(): void {
    if (this.defaultSubCoresBootstrapped) return;
    registerDefaultArcSubCores(this);
    this.defaultSubCoresBootstrapped = true;
  }

  registerSubCore(subCore: ArcSubCore): void {
    this.subCores.set(subCore.id, subCore);
  }

  unregisterSubCore(id: string): void {
    const subCore = this.subCores.get(id);
    subCore?.onShutdown?.();
    this.subCores.delete(id);
  }

  getSubCore(id: string): ArcSubCore | undefined {
    return this.subCores.get(id);
  }

  listSubCores(): ArcSubCore[] {
    return Array.from(this.subCores.values());
  }

  registerProcess(process: ArcCoreProcess): void {
    this.processes.set(process.id, process);
  }

  createAndRegisterProcess(
    id: string,
    opts?: { timeScale?: number; onWallTick?: ArcCoreWallTickFn },
  ): ArcCoreProcess {
    const p = new ProcessImpl(id, opts);
    this.registerProcess(p);
    return p;
  }

  unregisterProcess(id: string): void {
    this.processes.delete(id);
  }

  getProcess(id: string): ArcCoreProcess | undefined {
    return this.processes.get(id);
  }

  dispatchCommand(command: ArcCoreCommand): void {
    dispatchArcCoreCommand(command);
  }

  /** 백그라운드·종료 구간을 벽시계에 반영할 때 상한(48h) — 과도한 일괄 진행 방지 */
  private static readonly MAX_OFFLINE_CATCH_UP_SEC = 48 * 60 * 60;

  /**
   * 오프라인 catch-up — 서브코어/프로세스 하나 처리할 때마다 매크로태스크 경계로
   * 이벤트 루프를 비워, 타이틀 버튼 탭 등 사용자 입력이 한 덩어리 동기 fan-out
   * (최대 48h분 onWallTick 연쇄)에 막히지 않게 한다.
   * (2026-07-19 타이틀 「버튼 활성화 후 탭 2~3초 무반응」 근본 조치 — 동기판 폐기)
   */
  async applyOfflineCatchUpWallClockChunked(deltaSec: number): Promise<void> {
    const raw = Number.isFinite(deltaSec) ? deltaSec : 0;
    const capped = Math.min(Math.max(raw, 0), ArcCoreHubImpl.MAX_OFFLINE_CATCH_UP_SEC);
    if (capped <= 0) return;
    for (const subCore of this.subCores.values()) {
      subCore._advanceWallClock(capped);
      await yieldJsThread();
    }
    for (const p of this.processes.values()) {
      p._advanceWallClock(capped);
      await yieldJsThread();
    }
  }

  start(): void {
    if (this.unsubGameLoop) return;

    for (const subCore of this.subCores.values()) {
      subCore.onBoot?.();
    }

    this.unsubGameLoop = gameLoop.subscribe((wallDeltaSec) => {
      if (this.suspendWallClock) return;
      for (const subCore of this.subCores.values()) {
        subCore._advanceWallClock(wallDeltaSec);
      }
      for (const p of this.processes.values()) {
        p._advanceWallClock(wallDeltaSec);
      }
    });
    gameLoop.start();

    this.unsubAppState = AppState.addEventListener('change', (next: AppStateStatus) => {
      this.suspendWallClock = next !== 'active';
    });
  }

  stop(): void {
    if (this.unsubAppState) {
      this.unsubAppState.remove();
      this.unsubAppState = null;
    }
    if (this.unsubGameLoop) {
      this.unsubGameLoop();
      this.unsubGameLoop = null;
    }
    for (const subCore of this.subCores.values()) {
      subCore.onShutdown?.();
    }
    gameLoop.stop();
  }
}

/** 앱 전역 단일 아크코어 허브 */
export const arcCoreHub = new ArcCoreHubImpl();
