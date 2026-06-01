import { useEffect, useRef } from "react";
import type { Move as ChessMove } from "chess.js";
import "./MoveList.css";

export function MoveList({ history }: { history: ChessMove[] }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [history.length]);

  const rows: { n: number; w?: ChessMove; b?: ChessMove }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    rows.push({
      n: i / 2 + 1,
      w: history[i],
      b: history[i + 1],
    });
  }
  const lastIdx = history.length - 1;

  return (
    <div className="movelist scroll-y">
      {rows.length === 0 ? (
        <div className="movelist__empty">No moves yet — make your move!</div>
      ) : (
        <table className="movelist__table">
          <tbody>
            {rows.map((r, ri) => (
              <tr key={r.n}>
                <td className="movelist__num">{r.n}.</td>
                <td
                  className={
                    "movelist__san" + (ri * 2 === lastIdx ? " is-last" : "")
                  }
                >
                  {r.w?.san ?? ""}
                </td>
                <td
                  className={
                    "movelist__san" + (ri * 2 + 1 === lastIdx ? " is-last" : "")
                  }
                >
                  {r.b?.san ?? ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div ref={endRef} />
    </div>
  );
}
