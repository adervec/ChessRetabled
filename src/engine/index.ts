import { StockfishEngine } from "./stockfish";
import { MinimaxEngine } from "./minimax";
import type { ChessEngine, EngineLevel, EngineMove, EvalScore } from "./types";

export type { EngineLevel, EngineMove, EvalScore } from "./types";

/**
 * Unified engine manager. Prefers Stockfish (WASM); if it fails to load or dies
 * mid-session, transparently falls back to the built-in minimax AI so play never
 * breaks.
 */
export class GameEngine {
  private engine: ChessEngine | null = null;
  private initPromise: Promise<void> | null = null;
  usingFallback = false;
  backendName = "loading…";

  init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = (async () => {
      const sf = new StockfishEngine();
      try {
        await sf.init();
        this.engine = sf;
        this.backendName = sf.name;
        this.usingFallback = false;
        // eslint-disable-next-line no-console
        console.info("[engine] Stockfish ready");
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("[engine] Stockfish unavailable, using built-in AI", e);
        sf.dispose();
        const mm = new MinimaxEngine();
        await mm.init();
        this.engine = mm;
        this.backendName = mm.name;
        this.usingFallback = true;
      }
    })();
    return this.initPromise;
  }

  private async ensure(): Promise<ChessEngine> {
    if (!this.engine) await this.init();
    if (!this.engine) throw new Error("no engine available");
    return this.engine;
  }

  private async fallback(): Promise<ChessEngine> {
    const mm = new MinimaxEngine();
    await mm.init();
    this.engine = mm;
    this.usingFallback = true;
    this.backendName = mm.name;
    return mm;
  }

  async bestMove(fen: string, level: EngineLevel): Promise<EngineMove | null> {
    const e = await this.ensure();
    try {
      return await e.bestMove(fen, level);
    } catch (err) {
      if (!this.usingFallback) {
        // eslint-disable-next-line no-console
        console.warn("[engine] runtime failure; switching to fallback", err);
        const mm = await this.fallback();
        return mm.bestMove(fen, level);
      }
      throw err;
    }
  }

  async evaluate(
    fen: string,
    opts?: { depth?: number; movetimeMs?: number }
  ): Promise<EvalScore> {
    try {
      const e = await this.ensure();
      return await e.evaluate(fen, opts);
    } catch {
      return {};
    }
  }

  stop(): void {
    this.engine?.stop();
  }
}

let instance: GameEngine | null = null;

export function getEngine(): GameEngine {
  if (!instance) {
    instance = new GameEngine();
    if (import.meta.env.DEV) {
      (window as unknown as { __engine?: GameEngine }).__engine = instance;
    }
  }
  return instance;
}
