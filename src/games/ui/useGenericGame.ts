import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chooseMove } from "../core/ai";
import type {
  CellView,
  Difficulty,
  GameDefinition,
  GameMove,
  GameStatus,
  Player,
} from "../core/types";
import { useSettings, aiThinkFloorMs } from "../../state/useSettings";

/** A rendered piece with a stable id so it animates across moves (no teleport). */
export interface Token {
  id: string;
  cell: number;
  owner: Player;
  crowned?: boolean;
}

export interface GenericGame<S> {
  def: GameDefinition<S>;
  state: S;
  cells: (CellView | null)[];
  /** Placed pieces with stable ids — drive the animated 2.5D renderer. */
  tokens: Token[];
  /** Captured/removed pieces, accumulated for the side graveyard. */
  graveyard: Token[];
  status: GameStatus;
  targets: number[];
  selected: number | null;
  removalTargets: number[];
  lastMove: GameMove | null;
  lastMoveCells: number[];
  thinking: boolean;
  isHumanTurn: boolean;
  interactionModel: "place" | "select";
  /** Every move applied so far, in order — for archival / replay. */
  moveLog: GameMove[];
  onCellClick: (index: number) => void;
  undo: () => void;
  canUndo: boolean;
}

interface Snapshot<S> {
  state: S;
  tokens: Token[];
  graveyard: Token[];
  lastMove: GameMove | null;
}

function moveCells(m: GameMove): number[] {
  const out: number[] = [];
  if (m.from !== undefined) out.push(m.from);
  out.push(m.to);
  if (m.path) out.push(...m.path);
  if (m.affected) out.push(...m.affected);
  if (m.remove !== undefined) out.push(m.remove);
  return out;
}

/** Diff prev tokens against the post-move cells to keep stable ids across a move. */
function reconcile(
  prevTokens: Token[],
  m: GameMove,
  newCells: (CellView | null)[],
  nextId: () => string
): { tokens: Token[]; captured: Token[] } {
  const prevByCell = new Map(prevTokens.map((t) => [t.cell, t]));
  const out = new Map<number, Token>();
  const captured: Token[] = [];
  const consumed = new Set<number>();

  // moving piece keeps its id
  if (m.from !== undefined && prevByCell.has(m.from)) {
    const t = prevByCell.get(m.from)!;
    const nc = newCells[m.to];
    if (nc) out.set(m.to, { ...t, cell: m.to, owner: nc.owner, crowned: nc.crowned });
    consumed.add(m.from);
  } else if (m.from === undefined) {
    const nc = newCells[m.to];
    if (nc) out.set(m.to, { id: nextId(), cell: m.to, owner: nc.owner, crowned: nc.crowned });
  }

  // removals that are now empty -> graveyard
  const removals = [...(m.affected ?? [])];
  if (m.remove !== undefined) removals.push(m.remove);
  for (const c of removals) {
    if (newCells[c] === null && prevByCell.has(c) && !consumed.has(c)) {
      captured.push(prevByCell.get(c)!);
      consumed.add(c);
    }
  }

  // affected cells still occupied -> a flip (reversi): keep id, change owner
  for (const c of m.affected ?? []) {
    if (newCells[c] !== null && prevByCell.has(c) && !consumed.has(c) && !out.has(c)) {
      const t = prevByCell.get(c)!;
      out.set(c, { ...t, owner: newCells[c]!.owner, crowned: newCells[c]!.crowned });
      consumed.add(c);
    }
  }

  // carry over everything unchanged
  for (const t of prevTokens) {
    if (consumed.has(t.cell) || out.has(t.cell)) continue;
    const nc = newCells[t.cell];
    if (nc !== null) out.set(t.cell, { ...t, owner: nc.owner, crowned: nc.crowned });
    else captured.push(t);
  }

  // safety: any occupied cell not yet represented becomes a fresh token
  for (let i = 0; i < newCells.length; i++) {
    if (newCells[i] !== null && !out.has(i)) {
      out.set(i, { id: nextId(), cell: i, owner: newCells[i]!.owner, crowned: newCells[i]!.crowned });
    }
  }

  return { tokens: [...out.values()], captured };
}

export function useGenericGame<S>(
  def: GameDefinition<S>,
  humanPlayer: Player,
  difficulty: Difficulty
): GenericGame<S> {
  const idRef = useRef(0);
  const nextId = useCallback(() => `t${idRef.current++}`, []);

  const buildTokens = useCallback(
    (cells: (CellView | null)[]): Token[] => {
      const out: Token[] = [];
      for (let i = 0; i < cells.length; i++) {
        const c = cells[i];
        if (c) out.push({ id: nextId(), cell: i, owner: c.owner, crowned: c.crowned });
      }
      return out;
    },
    [nextId]
  );

  const [state, setState] = useState<S>(() => def.initial());
  const [tokens, setTokens] = useState<Token[]>(() => buildTokens(def.cells(def.initial())));
  const [graveyard, setGraveyard] = useState<Token[]>([]);
  const [history, setHistory] = useState<Snapshot<S>[]>([]);
  const [moveLog, setMoveLog] = useState<GameMove[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [pending, setPending] = useState<GameMove[] | null>(null);
  const [lastMove, setLastMove] = useState<GameMove | null>(null);
  const [thinking, setThinking] = useState(false);
  const aiToken = useRef(0);

  const animSpeed = useSettings((s) => s.animSpeed);

  const status = useMemo(() => def.status(state), [def, state]);
  const legal = useMemo(() => def.legalMoves(state), [def, state]);
  const cells = useMemo(() => def.cells(state), [def, state]);

  const model: "place" | "select" = def.interactionFor
    ? def.interactionFor(state)
    : def.interaction;

  const isHumanTurn = !status.over && def.currentPlayer(state) === humanPlayer && !thinking;

  const commit = useCallback(
    (m: GameMove, fromState: S, fromTokens: Token[], fromGrave: Token[]) => {
      const newState = def.applyMove(fromState, m);
      const rec = reconcile(fromTokens, m, def.cells(newState), nextId);
      setHistory((h) => [...h, { state: fromState, tokens: fromTokens, graveyard: fromGrave, lastMove }]);
      setMoveLog((l) => [...l, m]);
      setState(newState);
      setTokens(rec.tokens);
      setGraveyard([...fromGrave, ...rec.captured]);
      setLastMove(m);
      setSelected(null);
      setPending(null);
    },
    [def, nextId, lastMove]
  );

  const apply = useCallback(
    (m: GameMove) => commit(m, state, tokens, graveyard),
    [commit, state, tokens, graveyard]
  );

  // Drive the AI; never reply instantly — wait at least one animation.
  useEffect(() => {
    if (status.over) return;
    if (def.currentPlayer(state) === humanPlayer) return;
    const token = ++aiToken.current;
    setThinking(true);
    const floor = aiThinkFloorMs(animSpeed);
    let moveTimer: ReturnType<typeof setTimeout> | undefined;
    const startTimer = setTimeout(() => {
      const t0 = Date.now();
      const choice = chooseMove(def, state, difficulty);
      const wait = Math.max(0, floor - (Date.now() - t0));
      moveTimer = setTimeout(() => {
        if (token !== aiToken.current) return;
        setThinking(false);
        if (choice.move) commit(choice.move, state, tokens, graveyard);
      }, wait);
    }, 30);
    return () => {
      clearTimeout(startTimer);
      if (moveTimer) clearTimeout(moveTimer);
    };
  }, [def, state, humanPlayer, difficulty, status.over, animSpeed, commit, tokens, graveyard]);

  const targets = useMemo(() => {
    if (!isHumanTurn) return [];
    if (pending) return pending.map((m) => m.remove!).filter((x) => x !== undefined);
    if (model === "select") {
      if (selected === null) return [];
      return unique(legal.filter((m) => m.from === selected).map((m) => m.to));
    }
    return unique(legal.filter((m) => m.from === undefined).map((m) => m.to));
  }, [isHumanTurn, pending, model, selected, legal]);

  const removalTargets = useMemo(
    () => (pending ? pending.map((m) => m.remove!).filter((x) => x !== undefined) : []),
    [pending]
  );

  const onCellClick = useCallback(
    (index: number) => {
      if (!isHumanTurn) return;
      if (pending) {
        const m = pending.find((x) => x.remove === index);
        if (m) apply(m);
        return;
      }
      const geo = def.geometry;
      const isDrop = geo.kind === "grid" && geo.dropColumns === true;

      if (model === "place") {
        let matches: GameMove[];
        if (isDrop && geo.kind === "grid") {
          const col = index % geo.cols;
          matches = legal.filter((m) => m.from === undefined && m.to % geo.cols === col);
        } else {
          matches = legal.filter((m) => m.from === undefined && m.to === index);
        }
        if (matches.length === 0) return;
        if (matches.length === 1) apply(matches[0]);
        else setPending(matches);
        return;
      }

      const ownMove = legal.find((m) => m.from === index);
      if (selected === null) {
        if (ownMove) setSelected(index);
        return;
      }
      const matches = legal.filter((m) => m.from === selected && m.to === index);
      if (matches.length === 0) {
        setSelected(ownMove ? index : null);
        return;
      }
      if (matches.length === 1) apply(matches[0]);
      else setPending(matches);
    },
    [isHumanTurn, pending, def, model, legal, selected, apply]
  );

  const undo = useCallback(() => {
    if (thinking) return;
    aiToken.current++;
    setThinking(false);
    setSelected(null);
    setPending(null);
    setHistory((h) => {
      if (h.length === 0) return h;
      const copy = h.slice();
      let snap = copy.pop()!;
      while (copy.length > 0 && def.currentPlayer(snap.state) !== humanPlayer) {
        snap = copy.pop()!;
      }
      setState(snap.state);
      setTokens(snap.tokens);
      setGraveyard(snap.graveyard);
      setLastMove(snap.lastMove);
      setMoveLog((l) => l.slice(0, copy.length));
      return copy;
    });
  }, [thinking, def, humanPlayer]);

  const lastMoveCells = useMemo(() => (lastMove ? moveCells(lastMove) : []), [lastMove]);

  return {
    def,
    state,
    cells,
    tokens,
    graveyard,
    status,
    targets,
    selected,
    removalTargets,
    lastMove,
    lastMoveCells,
    thinking,
    isHumanTurn,
    interactionModel: model,
    moveLog,
    onCellClick,
    undo,
    canUndo: history.length > 0 && !thinking,
  };
}

function unique(xs: number[]): number[] {
  return [...new Set(xs)];
}
