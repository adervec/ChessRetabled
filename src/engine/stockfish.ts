import {
  type ChessEngine,
  type EngineLevel,
  type EngineMove,
  type EvalScore,
  parseUci,
} from "./types";

// Base-relative so the worker (and the .wasm/.nnue it loads relative to itself)
// resolves under the deploy's base path — "/" in dev, "/<repo>/" on GitHub Pages.
// import.meta.env.BASE_URL always ends in "/", so no leading slash here.
const ENGINE_URL = `${import.meta.env.BASE_URL}engine/stockfish-nnue-16-single.js`;

type LineListener = (line: string) => void;

/** Wraps the single-threaded Stockfish 16 WASM build behind the ChessEngine API. */
export class StockfishEngine implements ChessEngine {
  readonly name = "Stockfish 16";
  private worker: Worker | null = null;
  private listeners: LineListener[] = [];
  private isReady = false;
  private queue: Promise<unknown> = Promise.resolve();

  ready(): boolean {
    return this.isReady && !!this.worker;
  }

  private post(cmd: string) {
    this.worker?.postMessage(cmd);
  }

  private until(
    predicate: (line: string) => boolean,
    timeoutMs: number
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const remove = () => {
        clearTimeout(timer);
        this.listeners = this.listeners.filter((l) => l !== listener);
      };
      const timer = setTimeout(() => {
        remove();
        reject(new Error("engine timeout"));
      }, timeoutMs);
      const listener: LineListener = (line) => {
        if (predicate(line)) {
          remove();
          resolve();
        }
      };
      this.listeners.push(listener);
    });
  }

  async init(): Promise<void> {
    if (this.worker) return;
    const worker = new Worker(ENGINE_URL);
    this.worker = worker;
    worker.onmessage = (e: MessageEvent) => {
      const line =
        typeof e.data === "string"
          ? e.data
          : e.data && typeof e.data.data === "string"
          ? e.data.data
          : String(e.data ?? "");
      for (const l of this.listeners.slice()) l(line);
    };
    worker.onerror = () => {
      this.isReady = false;
    };

    this.post("uci");
    await this.until((l) => l.trim() === "uciok", 10000);
    this.post("setoption name Threads value 1");
    this.post("setoption name Hash value 32");
    this.post("isready");
    // The NNUE net (~39MB) loads here; allow generous time.
    await this.until((l) => l.trim() === "readyok", 30000);
    this.isReady = true;
  }

  private applyLevel(level: EngineLevel) {
    if (level.elo != null) {
      this.post("setoption name UCI_LimitStrength value true");
      this.post(
        "setoption name UCI_Elo value " +
          Math.max(1320, Math.min(2850, Math.round(level.elo)))
      );
      this.post("setoption name Skill Level value 20");
    } else {
      this.post("setoption name UCI_LimitStrength value false");
      this.post(
        "setoption name Skill Level value " +
          Math.max(0, Math.min(20, level.skill ?? 20))
      );
    }
  }

  bestMove(fen: string, level: EngineLevel): Promise<EngineMove | null> {
    const task = this.queue.then(() => this.runBestMove(fen, level));
    this.queue = task.catch(() => undefined);
    return task;
  }

  private async runBestMove(
    fen: string,
    level: EngineLevel
  ): Promise<EngineMove | null> {
    if (!this.worker) throw new Error("engine not initialized");
    this.applyLevel(level);
    this.post("position fen " + fen);
    let best: string | null = null;
    const goCmd =
      level.movetimeMs != null
        ? `go movetime ${level.movetimeMs}`
        : `go depth ${level.depth ?? 12}`;
    this.post(goCmd);
    await this.until((line) => {
      const m = line.match(/^bestmove\s+(\S+)/);
      if (m) {
        best = m[1];
        return true;
      }
      return false;
    }, (level.movetimeMs ?? 8000) + 20000);
    if (!best) return null;
    const parsed = parseUci(best);
    return parsed ? { ...parsed, uci: best } : null;
  }

  evaluate(
    fen: string,
    opts?: { depth?: number; movetimeMs?: number }
  ): Promise<EvalScore> {
    const task = this.queue.then(() => this.runEvaluate(fen, opts));
    this.queue = task.catch(() => undefined);
    return task;
  }

  private async runEvaluate(
    fen: string,
    opts?: { depth?: number; movetimeMs?: number }
  ): Promise<EvalScore> {
    if (!this.worker) throw new Error("engine not initialized");
    this.post("setoption name UCI_LimitStrength value false");
    this.post("setoption name Skill Level value 20");
    this.post("position fen " + fen);
    let score: EvalScore = {};
    const goCmd =
      opts?.movetimeMs != null
        ? `go movetime ${opts.movetimeMs}`
        : `go depth ${opts?.depth ?? 12}`;
    this.post(goCmd);
    await this.until((line) => {
      const sm = line.match(/score (cp|mate) (-?\d+)/);
      if (sm) {
        score = sm[1] === "cp" ? { cp: parseInt(sm[2], 10) } : { mate: parseInt(sm[2], 10) };
      }
      return /^bestmove/.test(line);
    }, (opts?.movetimeMs ?? 6000) + 20000);
    return score;
  }

  stop(): void {
    this.post("stop");
  }

  dispose(): void {
    this.stop();
    this.worker?.terminate();
    this.worker = null;
    this.isReady = false;
    this.listeners = [];
  }
}
