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

export interface GenericGame<S> {
  def: GameDefinition<S>;
  state: S;
  cells: (CellView | null)[];
  status: GameStatus;
  /** Highlighted destination/placement dots the human can click right now. */
  targets: number[];
  /** Currently selected origin cell (select-interaction games). */
  selected: number | null;
  /** Enemy cells awaiting a capture pick after a mill (Nine Men's Morris). */
  removalTargets: number[];
  /** Cells touched by the last move, for highlighting. */
  lastMoveCells: number[];
  thinking: boolean;
  isHumanTurn: boolean;
  interactionModel: "place" | "select";
  onCellClick: (index: number) => void;
  undo: () => void;
  canUndo: boolean;
}

function cellsFor(m: GameMove): number[] {
  const out: number[] = [];
  if (m.from !== undefined) out.push(m.from);
  out.push(m.to);
  if (m.path) out.push(...m.path);
  if (m.affected) out.push(...m.affected);
  if (m.remove !== undefined) out.push(m.remove);
  return out;
}

export function useGenericGame<S>(
  def: GameDefinition<S>,
  humanPlayer: Player,
  difficulty: Difficulty
): GenericGame<S> {
  const [state, setState] = useState<S>(() => def.initial());
  const [history, setHistory] = useState<S[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [pending, setPending] = useState<GameMove[] | null>(null); // removal choices
  const [lastMove, setLastMove] = useState<GameMove | null>(null);
  const [thinking, setThinking] = useState(false);
  const aiToken = useRef(0);

  const status = useMemo(() => def.status(state), [def, state]);
  const legal = useMemo(() => def.legalMoves(state), [def, state]);
  const cells = useMemo(() => def.cells(state), [def, state]);

  const model: "place" | "select" = def.interactionFor
    ? def.interactionFor(state)
    : def.interaction;

  const isHumanTurn = !status.over && def.currentPlayer(state) === humanPlayer && !thinking;

  const apply = useCallback(
    (m: GameMove) => {
      setHistory((h) => [...h, state]);
      setState(def.applyMove(state, m));
      setLastMove(m);
      setSelected(null);
      setPending(null);
    },
    [def, state]
  );

  // Drive the AI whenever it is its turn.
  useEffect(() => {
    if (status.over) return;
    if (def.currentPlayer(state) === humanPlayer) return;
    const token = ++aiToken.current;
    setThinking(true);
    const timer = setTimeout(() => {
      const choice = chooseMove(def, state, difficulty);
      if (token !== aiToken.current) return; // superseded (undo / new game)
      setThinking(false);
      if (choice.move) {
        setHistory((h) => [...h, state]);
        setState(def.applyMove(state, choice.move));
        setLastMove(choice.move);
      }
    }, 40);
    return () => clearTimeout(timer);
  }, [def, state, humanPlayer, difficulty, status.over]);

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

      // Resolving a capture choice after forming a mill.
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
        else setPending(matches); // multiple => differ by removal target
        return;
      }

      // select interaction
      const ownMove = legal.find((m) => m.from === index);
      if (selected === null) {
        if (ownMove) setSelected(index);
        return;
      }
      const matches = legal.filter((m) => m.from === selected && m.to === index);
      if (matches.length === 0) {
        // clicked elsewhere — reselect another own piece or clear
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
    aiToken.current++; // cancel any in-flight AI move
    setThinking(false);
    setSelected(null);
    setPending(null);
    setLastMove(null);
    setHistory((h) => {
      if (h.length === 0) return h;
      const copy = h.slice();
      let target = copy.pop()!;
      // rewind to the most recent human decision point
      while (copy.length > 0 && def.currentPlayer(target) !== humanPlayer) {
        target = copy.pop()!;
      }
      setState(target);
      return copy;
    });
  }, [thinking, def, humanPlayer]);

  const lastMoveCells = useMemo(
    () => (lastMove ? cellsFor(lastMove) : []),
    [lastMove]
  );

  return {
    def,
    state,
    cells,
    status,
    targets,
    selected,
    removalTargets,
    lastMoveCells,
    thinking,
    isHumanTurn,
    interactionModel: model,
    onCellClick,
    undo,
    canUndo: history.length > 0 && !thinking,
  };
}

function unique(xs: number[]): number[] {
  return [...new Set(xs)];
}
