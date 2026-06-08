import type { ArcCoreWallTickFn, ArcSubCore, ArcSubCoreMission } from '../types';

type TimedMissionRuntime = {
  id: string;
  name: string;
  stepDurationsSec: number[];
  currentStep: number;
  stepElapsedSec: number;
  done: boolean;
  onStepCompleted?: (stepIndex: number) => void;
  onCompleted?: () => void;
  repeat: boolean;
};

export abstract class BaseArcSubCore implements ArcSubCore {
  readonly id: string;
  readonly displayName: string;
  timeScale = 1;
  paused = false;
  onWallTick?: ArcCoreWallTickFn;
  private _elapsedWallSec = 0;
  private readonly missions = new Map<string, TimedMissionRuntime>();

  protected constructor(
    id: string,
    displayName: string,
    opts?: { timeScale?: number; onWallTick?: ArcCoreWallTickFn },
  ) {
    this.id = id;
    this.displayName = displayName;
    if (opts?.timeScale !== undefined) this.timeScale = opts.timeScale;
    this.onWallTick = opts?.onWallTick;
  }

  get elapsedWallSec(): number {
    return this._elapsedWallSec;
  }

  onBoot?(): void;

  onShutdown?(): void;

  listMissions(): ArcSubCoreMission[] {
    return Array.from(this.missions.values()).map((m) => ({
      id: m.id,
      name: m.name,
      totalSteps: m.stepDurationsSec.length,
      currentStep: m.currentStep,
      stepElapsedSec: m.stepElapsedSec,
      done: m.done,
    }));
  }

  protected registerTimedMission(input: {
    id: string;
    name: string;
    stepDurationsSec: number[];
    onStepCompleted?: (stepIndex: number) => void;
    onCompleted?: () => void;
    repeat?: boolean;
  }): void {
    this.missions.set(input.id, {
      id: input.id,
      name: input.name,
      stepDurationsSec: input.stepDurationsSec,
      currentStep: 0,
      stepElapsedSec: 0,
      done: input.stepDurationsSec.length === 0,
      onStepCompleted: input.onStepCompleted,
      onCompleted: input.onCompleted,
      repeat: Boolean(input.repeat),
    });
  }

  private tickMissions(dtSec: number): void {
    for (const m of this.missions.values()) {
      if (m.done || m.currentStep >= m.stepDurationsSec.length) continue;
      m.stepElapsedSec += dtSec;
      const stepTarget = m.stepDurationsSec[m.currentStep] ?? 0;
      if (m.stepElapsedSec < stepTarget) continue;
      m.stepElapsedSec = 0;
      m.onStepCompleted?.(m.currentStep);
      m.currentStep += 1;
      if (m.currentStep >= m.stepDurationsSec.length) {
        if (m.repeat) {
          m.currentStep = 0;
          m.stepElapsedSec = 0;
          m.done = false;
          m.onCompleted?.();
          continue;
        }
        m.done = true;
        m.onCompleted?.();
      }
    }
  }

  _advanceWallClock(wallDeltaSec: number): void {
    if (this.paused || wallDeltaSec <= 0) return;
    const dt = wallDeltaSec * this.timeScale;
    this._elapsedWallSec += dt;
    this.tickMissions(dt);
    this.onWallTick?.({ elapsedWallSec: this._elapsedWallSec, wallDeltaSec: dt });
  }
}
