import { useCallback, useEffect, useMemo, useState } from "react";
import type { GameDefinition, GameMove } from "../core/types";
import type { BoardView, Token } from "../ui/boardView";

export interface LessonGame extends BoardView {
  solved: boolean;
  wrong: boolean;
  reset: () => void;
}

function setupState<S>(def: GameDefinition<S>, setup: string[]): S {
  let s = def.initial();
  for (const id of setup) {
    const m = def.legalMoves(s).find((x) => x.id === id);
    if (m) s = def.applyMove(s, m);
  }
  return s;
}

/**
 * Drives a single challenge position: replays `setup`, lets the learner attempt
 * a move, and accepts iff the chosen move's id is in `accept`. Implements the
 * BoardView surface so the standard GameBoard renders it.
 */
export function useLessonPosition<S>(
  def: GameDefinition<S>,
  setup: string[],
  accept: string[]
): LessonGame {
  const initial = useMemo(() => setupState(def, setup), [def, setup]);
  const [state, setState] = useState<S>(initial);
  const [selected, setSelected] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);
  const [wrong, setWrong] = useState(false);

  const reset = useCallback(() => {
    setState(initial);
    setSelected(null);
    setSolved(false);
    setWrong(false);
  }, [initial]);

  useEffect(() => {
    reset();
  }, [reset]);

  const cells = useMemo(() => def.cells(state), [def, state]);
  const legal = useMemo(() => def.legalMoves(state), [def, state]);
  const model = def.interactionFor ? def.interactionFor(state) : def.interaction;

  const tokens = useMemo<Token[]>(() => {
    const out: Token[] = [];
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      if (c) out.push({ id: `t${i}`, cell: i, owner: c.owner, crowned: c.crowned });
    }
    return out;
  }, [cells]);

  const attempt = useCallback(
    (m: GameMove) => {
      if (accept.includes(m.id)) {
        setState(def.applyMove(state, m));
        setSolved(true);
        setWrong(false);
      } else {
        setWrong(true);
      }
    },
    [accept, def, state]
  );

  const targets = useMemo(() => {
    if (solved) return [];
    if (model === "select") {
      if (selected === null) return [];
      return [...new Set(legal.filter((m) => m.from === selected).map((m) => m.to))];
    }
    return [...new Set(legal.filter((m) => m.from === undefined).map((m) => m.to))];
  }, [solved, model, selected, legal]);

  const onCellClick = useCallback(
    (index: number) => {
      if (solved) return;
      const geo = def.geometry;
      const isDrop = geo.kind === "grid" && geo.dropColumns === true;
      if (model === "place") {
        const match = isDrop && geo.kind === "grid"
          ? legal.find((m) => m.from === undefined && m.to % geo.cols === index % geo.cols)
          : legal.find((m) => m.from === undefined && m.to === index);
        if (match) attempt(match);
        return;
      }
      const ownMove = legal.find((m) => m.from === index);
      if (selected === null) {
        if (ownMove) setSelected(index);
        return;
      }
      const match = legal.find((m) => m.from === selected && m.to === index);
      if (match) attempt(match);
      else setSelected(ownMove ? index : null);
    },
    [solved, def, model, legal, selected, attempt]
  );

  return {
    def: def as unknown as GameDefinition<unknown>,
    cells,
    tokens,
    graveyard: [],
    targets,
    selected,
    removalTargets: [],
    lastMoveCells: [],
    isHumanTurn: !solved,
    onCellClick,
    solved,
    wrong,
    reset,
  };
}
