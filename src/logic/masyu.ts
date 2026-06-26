import { makeRng, shuffle, type Rng } from "../cards/core/rng.ts";

// Masyu. Draw one closed loop through cell centres so it passes through every
// pearl: a WHITE pearl the loop runs straight through, but it must turn in at
// least one of the cells just before or after; a BLACK pearl the loop turns on,
// and must run straight for at least one cell on both sides. Same engine as
// Slitherlink: a loop through the Rm×Cm cell-grid is the boundary of an inside
// region of the (Rm-1)×(Cm-1) faces between the cells, so we generate by growing
// such a region, read the loop's shape to place candidate pearls, and drop
// pearls while a face-colour backtracker confirms the solution stays unique.

export const NONE = 0, WHITE = 1, BLACK = 2;

export interface Puzzle {
  rows: number; // Rm cells
  cols: number; // Cm cells
  pearl: number[]; // length rows*cols: NONE | WHITE | BLACK
  inside: boolean[]; // length (rows-1)*(cols-1): the solution face region
}

const faceDims = (rows: number, cols: number) => [rows - 1, cols - 1] as const;

function insideAt(inside: boolean[], FC: number, FR: number, fr: number, fc: number): boolean {
  return fr >= 0 && fr < FR && fc >= 0 && fc < FC ? inside[fr * FC + fc] : false;
}

/** The four loop edges at cell (cr,cc) derived from the surrounding faces. */
function edgesAt(inside: boolean[], rows: number, cols: number, cr: number, cc: number) {
  const [FR, FC] = faceDims(rows, cols);
  const I = (fr: number, fc: number) => insideAt(inside, FC, FR, fr, fc);
  const E = I(cr - 1, cc) !== I(cr, cc);
  const W = I(cr - 1, cc - 1) !== I(cr, cc - 1);
  const Nn = I(cr - 1, cc - 1) !== I(cr - 1, cc);
  const S = I(cr, cc - 1) !== I(cr, cc);
  const deg = (E ? 1 : 0) + (W ? 1 : 0) + (Nn ? 1 : 0) + (S ? 1 : 0);
  return { E, W, N: Nn, S, deg };
}

const isStraight = (e: ReturnType<typeof edgesAt>) => e.deg === 2 && ((e.E && e.W) || (e.N && e.S));
const isTurn = (e: ReturnType<typeof edgesAt>) => e.deg === 2 && !((e.E && e.W) || (e.N && e.S));

/** Does the face region's boundary form exactly one simple loop? */
function singleLoop(inside: boolean[], rows: number, cols: number): boolean {
  const [FR, FC] = faceDims(rows, cols);
  const n = FR * FC;
  const ins: number[] = [], outs: number[] = [];
  for (let i = 0; i < n; i++) (inside[i] ? ins : outs).push(i);
  if (ins.length === 0) return false;
  const nb = (i: number): number[] => {
    const r = Math.floor(i / FC), c = i % FC, out: number[] = [];
    if (r > 0) out.push(i - FC); if (r < FR - 1) out.push(i + FC);
    if (c > 0) out.push(i - 1); if (c < FC - 1) out.push(i + 1);
    return out;
  };
  const flood = (seed: number[], want: (i: number) => boolean) => {
    const seen = new Set(seed); const st = [...seed];
    while (st.length) { const i = st.pop()!; for (const j of nb(i)) if (want(j) && !seen.has(j)) { seen.add(j); st.push(j); } }
    return seen;
  };
  if (flood([ins[0]], (i) => inside[i]).size !== ins.length) return false; // inside connected
  const border = outs.filter((i) => { const r = Math.floor(i / FC), c = i % FC; return r === 0 || c === 0 || r === FR - 1 || c === FC - 1; });
  if (outs.length > 0 && flood(border, (i) => !inside[i]).size !== outs.length) return false; // outside connected to exterior
  // no self-touching pinch: every cell has loop-degree 0 or 2 (never 4)
  for (let cr = 0; cr < rows; cr++) for (let cc = 0; cc < cols; cc++) if (edgesAt(inside, rows, cols, cr, cc).deg === 4) return false;
  return true;
}

/** Full Masyu correctness of a face region against the pearls. */
function satisfies(inside: boolean[], rows: number, cols: number, pearl: number[]): boolean {
  if (!singleLoop(inside, rows, cols)) return false;
  for (let cr = 0; cr < rows; cr++) for (let cc = 0; cc < cols; cc++) {
    const p = pearl[cr * cols + cc];
    if (p === NONE) continue;
    const e = edgesAt(inside, rows, cols, cr, cc);
    if (e.deg !== 2) return false;
    if (p === WHITE) {
      if (!isStraight(e)) return false;
      const horiz = e.E && e.W;
      const a = horiz ? edgesAt(inside, rows, cols, cr, cc - 1) : edgesAt(inside, rows, cols, cr - 1, cc);
      const b = horiz ? edgesAt(inside, rows, cols, cr, cc + 1) : edgesAt(inside, rows, cols, cr + 1, cc);
      if (!(isTurn(a) || isTurn(b))) return false; // must bend within one cell on at least one side
    } else {
      if (!isTurn(e)) return false;
      // both legs must run straight in the next cell
      const legs: [number, number, boolean][] = [];
      if (e.E) legs.push([cr, cc + 1, true]); if (e.W) legs.push([cr, cc - 1, true]);
      if (e.N) legs.push([cr - 1, cc, false]); if (e.S) legs.push([cr + 1, cc, false]);
      for (const [nr, nc, horiz] of legs) {
        const ne = edgesAt(inside, rows, cols, nr, nc);
        if (!(ne.deg === 2 && (horiz ? ne.E && ne.W : ne.N && ne.S))) return false;
      }
    }
  }
  return true;
}

export function countSolutions(pearl: number[], rows: number, cols: number, limit = 2): number {
  const [FR, FC] = faceDims(rows, cols);
  const nF = FR * FC;
  const color = new Array<boolean | null>(nF).fill(null);
  // own-cell prune: each pearl forces its cell onto the loop with the right shape,
  // checkable once the four faces around it are coloured.
  const checkAt: number[][] = Array.from({ length: nF }, () => []);
  const pearlCells: { cr: number; cc: number; p: number }[] = [];
  for (let cr = 0; cr < rows; cr++) for (let cc = 0; cc < cols; cc++) {
    const p = pearl[cr * cols + cc];
    if (p === NONE) continue;
    pearlCells.push({ cr, cc, p });
    let maxF = -1;
    for (const [fr, fc] of [[cr - 1, cc - 1], [cr - 1, cc], [cr, cc - 1], [cr, cc]] as [number, number][])
      if (fr >= 0 && fr < FR && fc >= 0 && fc < FC) maxF = Math.max(maxF, fr * FC + fc);
    if (maxF >= 0) checkAt[maxF].push(pearlCells.length - 1);
  }
  const asBool = () => color.map((x) => x === true);
  let count = 0, steps = 0, capped = false;

  const ownOk = (pc: { cr: number; cc: number; p: number }): boolean => {
    const e = edgesAt(asBool(), rows, cols, pc.cr, pc.cc);
    return pc.p === WHITE ? isStraight(e) : isTurn(e);
  };

  const rec = (i: number): void => {
    if (count >= limit || capped) return;
    if (++steps > 250000) { capped = true; return; }
    if (i === nF) {
      if (satisfies(asBool(), rows, cols, pearl)) count++;
      return;
    }
    for (const v of [false, true]) {
      color[i] = v;
      let ok = true;
      for (const pi of checkAt[i]) if (!ownOk(pearlCells[pi])) { ok = false; break; }
      if (ok) rec(i + 1);
      color[i] = null;
      if (count >= limit || capped) return;
    }
  };
  rec(0);
  return capped ? limit : count;
}

function growRegion(rows: number, cols: number, rng: Rng): boolean[] {
  const [FR, FC] = faceDims(rows, cols);
  const n = FR * FC;
  const inside = new Array<boolean>(n).fill(false);
  inside[rng.int(n)] = true;
  let size = 1;
  const target = Math.floor(n * (0.35 + rng.next() * 0.3));
  while (size < target) {
    const frontier: number[] = [];
    for (let i = 0; i < n; i++) if (inside[i]) {
      const r = Math.floor(i / FC), c = i % FC;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as [number, number][]) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < FR && nc >= 0 && nc < FC && !inside[nr * FC + nc]) frontier.push(nr * FC + nc);
      }
    }
    if (frontier.length === 0) break;
    inside[frontier[rng.int(frontier.length)]] = true;
    size++;
  }
  return inside;
}

export function generate(seed: number, rows = 6, cols = 6): Puzzle {
  const rng = makeRng(seed);
  const n = rows * cols;
  for (let attempt = 0; attempt < 250; attempt++) {
    const inside = growRegion(rows, cols, rng);
    if (!singleLoop(inside, rows, cols)) continue;
    // candidate pearls read off the loop shape
    const full = new Array<number>(n).fill(NONE);
    for (let cr = 0; cr < rows; cr++) for (let cc = 0; cc < cols; cc++) {
      const e = edgesAt(inside, rows, cols, cr, cc);
      if (e.deg !== 2) continue;
      if (isStraight(e)) {
        const horiz = e.E && e.W;
        const a = horiz ? edgesAt(inside, rows, cols, cr, cc - 1) : edgesAt(inside, rows, cols, cr - 1, cc);
        const b = horiz ? edgesAt(inside, rows, cols, cr, cc + 1) : edgesAt(inside, rows, cols, cr + 1, cc);
        if (isTurn(a) || isTurn(b)) full[cr * cols + cc] = WHITE;
      } else {
        const legs: [number, number, boolean][] = [];
        if (e.E) legs.push([cr, cc + 1, true]); if (e.W) legs.push([cr, cc - 1, true]);
        if (e.N) legs.push([cr - 1, cc, false]); if (e.S) legs.push([cr + 1, cc, false]);
        if (legs.every(([nr, nc, h]) => { const ne = edgesAt(inside, rows, cols, nr, nc); return ne.deg === 2 && (h ? ne.E && ne.W : ne.N && ne.S); }))
          full[cr * cols + cc] = BLACK;
      }
    }
    if (full.every((p) => p === NONE)) continue; // a loop with no placeable pearls
    if (countSolutions(full, rows, cols, 2) !== 1) continue;
    const pearl = full.slice();
    for (const j of shuffle([...Array(n).keys()], rng)) {
      if (pearl[j] === NONE) continue;
      const saved = pearl[j];
      pearl[j] = NONE;
      if (countSolutions(pearl, rows, cols, 2) !== 1) pearl[j] = saved;
    }
    return { rows, cols, pearl, inside };
  }
  // Fallback: a 2×2 face block → a small square loop with two black pearls.
  const inside = new Array<boolean>(faceDims(rows, cols)[0] * faceDims(rows, cols)[1]).fill(false);
  const FC = faceDims(rows, cols)[1];
  inside[0] = inside[1] = inside[FC] = inside[FC + 1] = true;
  const pearl = new Array<number>(n).fill(NONE);
  return { rows, cols, pearl, inside };
}

// ---- player-edge helpers (loop drawn between adjacent cells) ----
// Horizontal segment between (cr,cc)-(cr,cc+1): index cr*(cols-1)+cc.
// Vertical segment between (cr,cc)-(cr+1,cc): index cr*cols+cc.
export const hSegCount = (rows: number, cols: number) => rows * (cols - 1);
export const vSegCount = (rows: number, cols: number) => (rows - 1) * cols;

export function solutionEdges(p: Puzzle): { h: boolean[]; v: boolean[] } {
  const { rows, cols, inside } = p;
  const h = new Array<boolean>(hSegCount(rows, cols)).fill(false);
  const v = new Array<boolean>(vSegCount(rows, cols)).fill(false);
  for (let cr = 0; cr < rows; cr++) for (let cc = 0; cc < cols; cc++) {
    const e = edgesAt(inside, rows, cols, cr, cc);
    if (e.E && cc < cols - 1) h[cr * (cols - 1) + cc] = true;
    if (e.S && cr < rows - 1) v[cr * cols + cc] = true;
  }
  return { h, v };
}

function degAt(h: boolean[], v: boolean[], rows: number, cols: number, cr: number, cc: number) {
  const e = cc < cols - 1 && h[cr * (cols - 1) + cc];
  const w = cc > 0 && h[cr * (cols - 1) + cc - 1];
  const s = cr < rows - 1 && v[cr * cols + cc];
  const nn = cr > 0 && v[(cr - 1) * cols + cc];
  return { E: e, W: w, S: s, N: nn, deg: (e ? 1 : 0) + (w ? 1 : 0) + (s ? 1 : 0) + (nn ? 1 : 0) };
}

/** Does the player's drawn loop solve the puzzle? */
export function isSolved(h: boolean[], v: boolean[], pearl: number[], rows: number, cols: number): boolean {
  let used = 0, start = -1;
  for (let cr = 0; cr < rows; cr++) for (let cc = 0; cc < cols; cc++) {
    const d = degAt(h, v, rows, cols, cr, cc).deg;
    if (d !== 0 && d !== 2) return false;
    if (d === 2) { used++; if (start < 0) start = cr * cols + cc; }
  }
  if (used === 0) return false;
  // single loop: walk from start, every degree-2 cell must be reached
  const seen = new Set<number>([start]); const st = [start];
  while (st.length) {
    const i = st.pop()!; const cr = Math.floor(i / cols), cc = i % cols;
    const d = degAt(h, v, rows, cols, cr, cc);
    const nbrs: number[] = [];
    if (d.E) nbrs.push(i + 1); if (d.W) nbrs.push(i - 1);
    if (d.S) nbrs.push(i + cols); if (d.N) nbrs.push(i - cols);
    for (const j of nbrs) if (!seen.has(j)) { seen.add(j); st.push(j); }
  }
  if (seen.size !== used) return false;
  // pearl constraints
  for (let cr = 0; cr < rows; cr++) for (let cc = 0; cc < cols; cc++) {
    const p = pearl[cr * cols + cc];
    if (p === NONE) continue;
    const e = degAt(h, v, rows, cols, cr, cc);
    if (e.deg !== 2) return false;
    const straight = (e.E && e.W) || (e.N && e.S);
    if (p === WHITE) {
      if (!straight) return false;
      const horiz = e.E && e.W;
      const a = horiz ? degAt(h, v, rows, cols, cr, cc - 1) : degAt(h, v, rows, cols, cr - 1, cc);
      const b = horiz ? degAt(h, v, rows, cols, cr, cc + 1) : degAt(h, v, rows, cols, cr + 1, cc);
      const turnA = a.deg === 2 && !((a.E && a.W) || (a.N && a.S));
      const turnB = b.deg === 2 && !((b.E && b.W) || (b.N && b.S));
      if (!(turnA || turnB)) return false;
    } else {
      if (straight) return false;
      const legs: [number, number, boolean][] = [];
      if (e.E) legs.push([cr, cc + 1, true]); if (e.W) legs.push([cr, cc - 1, true]);
      if (e.N) legs.push([cr - 1, cc, false]); if (e.S) legs.push([cr + 1, cc, false]);
      for (const [nr, nc, h2] of legs) {
        const ne = degAt(h, v, rows, cols, nr, nc);
        if (!(ne.deg === 2 && (h2 ? ne.E && ne.W : ne.N && ne.S))) return false;
      }
    }
  }
  return true;
}
