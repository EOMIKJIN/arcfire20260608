// ============================================================
// 아크파이어 온라인 - 게임 루프
// ============================================================

type TickCallback = (delta: number) => void;

class GameLoop {
  private callbacks: TickCallback[] = [];
  private lastTime: number = 0;
  private rafId: number | null = null;
  private running: boolean = false;

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = Date.now();
    this.tick();
  }

  stop() {
    this.running = false;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  subscribe(cb: TickCallback): () => void {
    this.callbacks.push(cb);
    return () => {
      this.callbacks = this.callbacks.filter(c => c !== cb);
    };
  }

  private tick = () => {
    if (!this.running) return;
    const now = Date.now();
    const delta = Math.min((now - this.lastTime) / 1000, 0.05); // max 50ms
    this.lastTime = now;

    for (const cb of this.callbacks) {
      cb(delta);
    }

    this.rafId = requestAnimationFrame(this.tick);
  };
}

export const gameLoop = new GameLoop();
