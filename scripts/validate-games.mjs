// Headless verification for the combinatorial-games suite (src/games/). Imports
// the real game logic via Node 24 type-stripping — same trick the chess content
// scripts use — and exercises rules, terminal detection, and the generic AI.
//
// Run: node scripts/validate-games.mjs
import { GAMES, getGame } from "../src/games/registry.ts";
import { chooseMove } from "../src/games/core/ai.ts";

let problems = 0;
let checks = 0;
function check(cond, msg) {
  checks++;
  if (!cond) {
    console.log(`  ✗ ${msg}`);
    problems++;
  }
}
const STRONG = (depth) => ({ id: "test", name: "test", depth, randomness: 0, timeMs: 500 });
const idx = (c, r, cols) => r * cols + c;

// ---- generic invariants for every game ----
function randomPlayout(def, maxPlies = 2000) {
  let state = def.initial();
  let plies = 0;
  while (plies < maxPlies) {
    const status = def.status(state);
    if (status.over) return { terminated: true, plies, status };
    const legal = def.legalMoves(state);
    if (legal.length === 0) return { terminated: false, plies, reason: "no moves but not over" };
    const m = legal[Math.floor(Math.random() * legal.length)];
    if (typeof m.to !== "number" || m.to < 0) return { terminated: false, plies, reason: "bad move.to" };
    state = def.applyMove(state, m);
    plies++;
  }
  return { terminated: false, plies, reason: "exceeded maxPlies" };
}

function aiReturnsLegal(def) {
  // walk to a few non-terminal midgame states and ask the AI for a move
  for (let trial = 0; trial < 4; trial++) {
    let state = def.initial();
    const steps = 2 + Math.floor(Math.random() * 6);
    let ok = true;
    for (let i = 0; i < steps; i++) {
      if (def.status(state).over) { ok = false; break; }
      const legal = def.legalMoves(state);
      state = def.applyMove(state, legal[Math.floor(Math.random() * legal.length)]);
    }
    if (!ok || def.status(state).over) continue;
    const legalIds = new Set(def.legalMoves(state).map((m) => m.id));
    const choice = chooseMove(def, state, STRONG(2));
    check(choice.move !== null, `${def.id}: AI returned a move in a live position`);
    check(choice.move && legalIds.has(choice.move.id), `${def.id}: AI move is legal`);
  }
}

console.log("Generic invariants:");
for (const def of GAMES) {
  // a few random playouts must terminate cleanly
  let allTerminated = true;
  for (let i = 0; i < 12; i++) {
    const r = randomPlayout(def);
    if (!r.terminated) { allTerminated = false; console.log(`  ✗ ${def.id}: playout did not terminate (${r.reason})`); }
  }
  check(allTerminated, `${def.id}: random playouts terminate`);
  check(def.legalMoves(def.initial()).length > 0, `${def.id}: initial position has legal moves`);
  check(!def.status(def.initial()).over, `${def.id}: initial position is not terminal`);
  aiReturnsLegal(def);
}

// ---- Tic-Tac-Toe ----
console.log("\nTic-Tac-Toe:");
{
  const ttt = getGame("tic-tac-toe");
  // immediate win
  let s = { board: [0, 0, null, null, null, null, null, null, null], turn: 0 };
  let c = chooseMove(ttt, s, STRONG(9));
  check(c.move?.to === 2, "X takes the immediate win at cell 2");
  // forced block
  s = { board: [0, 0, null, null, 1, null, null, null, null], turn: 1 };
  c = chooseMove(ttt, s, STRONG(9));
  check(c.move?.to === 2, "O blocks X's threat at cell 2");
  // perfect play never loses vs random
  let losses = 0;
  for (let g = 0; g < 40; g++) {
    const aiPlayer = g % 2;
    let st = ttt.initial();
    while (!ttt.status(st).over) {
      const mover = ttt.currentPlayer(st);
      const legal = ttt.legalMoves(st);
      const mv = mover === aiPlayer ? chooseMove(ttt, st, STRONG(9)).move : legal[Math.floor(Math.random() * legal.length)];
      st = ttt.applyMove(st, mv);
    }
    const w = ttt.status(st).winner;
    if (w !== null && w !== aiPlayer) losses++;
  }
  check(losses === 0, `perfect AI never loses (losses=${losses}/40)`);
}

// ---- Connect Four ----
console.log("\nConnect Four:");
{
  const c4 = getGame("connect-four");
  const empty = () => Array(42).fill(null);
  // red can complete a vertical four in column 0
  let b = empty();
  b[idx(0, 5, 7)] = 0; b[idx(0, 4, 7)] = 0; b[idx(0, 3, 7)] = 0;
  let c = chooseMove(c4, { board: b, turn: 0 }, STRONG(4));
  check(c.move && c.move.to % 7 === 0, "red completes the vertical four in column 0");
  // red must block yellow's vertical three
  b = empty();
  b[idx(0, 5, 7)] = 1; b[idx(0, 4, 7)] = 1; b[idx(0, 3, 7)] = 1;
  c = chooseMove(c4, { board: b, turn: 0 }, STRONG(4));
  check(c.move && c.move.to % 7 === 0, "red blocks yellow's vertical threat in column 0");
}

// ---- Reversi ----
console.log("\nReversi:");
{
  const rev = getGame("reversi");
  const init = rev.initial();
  check(rev.legalMoves(init).length === 4, "opening position has exactly 4 legal moves");
  const before = init.board.filter((x) => x === 1).length; // white discs
  const after = rev.applyMove(init, rev.legalMoves(init)[0]);
  const blackAfter = after.board.filter((x) => x === 0).length;
  check(blackAfter >= 4, "black's first move flips at least one white disc");
  check(after.board.filter((x) => x === 1).length < before, "white disc count drops after a flip");
}

// ---- Gomoku ----
console.log("\nGomoku:");
{
  const gk = getGame("gomoku");
  const empty = () => Array(225).fill(null);
  // five-in-a-row is detected as a win
  let b = empty();
  for (let c = 0; c < 5; c++) b[idx(c, 7, 15)] = 0;
  check(gk.status({ board: b, turn: 1 }).winner === 0, "five black in a row is a win");
  // AI completes an open four into five
  b = empty();
  for (let c = 0; c < 4; c++) b[idx(c, 7, 15)] = 0;
  // give white a stone nearby so neighbourhood candidates exist around the threat
  b[idx(2, 6, 15)] = 1;
  const choice = chooseMove(gk, { board: b, turn: 0 }, STRONG(2));
  const next = gk.applyMove({ board: b, turn: 0 }, choice.move);
  check(gk.status(next).winner === 0, "black completes five from an open four");
}

// ---- Checkers ----
console.log("\nCheckers:");
{
  const ck = getGame("checkers");
  const empty = () => Array(64).fill(null);
  const man = (owner) => ({ owner, king: false });
  // forced single capture
  let b = empty();
  b[idx(2, 5, 8)] = man(0); // red
  b[idx(3, 4, 8)] = man(1); // white, jumpable to (4,3)
  let moves = ck.legalMoves({ board: b, turn: 0, idle: 0 });
  check(moves.length > 0 && moves.every((m) => (m.affected?.length ?? 0) >= 1), "captures are forced when available");
  check(moves.some((m) => m.to === idx(4, 3, 8)), "the jump lands on (4,3)");
  // double jump
  b = empty();
  b[idx(2, 5, 8)] = man(0);
  b[idx(3, 4, 8)] = man(1);
  b[idx(3, 2, 8)] = man(1);
  moves = ck.legalMoves({ board: b, turn: 0, idle: 0 });
  check(moves.some((m) => (m.affected?.length ?? 0) === 2), "a double jump capturing two pieces exists");
  // promotion to king
  b = empty();
  b[idx(0, 1, 8)] = man(0); // red one step from the crowning row
  const quiet = ck.legalMoves({ board: b, turn: 0, idle: 0 }).find((m) => m.to === idx(1, 0, 8));
  check(!!quiet, "red can step to the crowning row");
  if (quiet) {
    const after = ck.applyMove({ board: b, turn: 0, idle: 0 }, quiet);
    check(after.board[idx(1, 0, 8)]?.king === true, "reaching the back row crowns a king");
  }
}

// ---- Nine Men's Morris ----
console.log("\nNine Men's Morris:");
{
  const nm = getGame("nine-mens-morris");
  check(nm.legalMoves(nm.initial()).length === 24, "opening offers 24 placements");
  // placing the third blue forms a mill and must remove an enemy man
  const nodes = Array(24).fill(null);
  nodes[0] = 0; nodes[1] = 0; // blue, mill at [0,1,2] when node 2 is filled
  nodes[8] = 1; // a lone orange man, removable
  const s = { nodes, turn: 0, placed: [2, 1], idle: 0 };
  const millMoves = nm.legalMoves(s).filter((m) => m.to === 2);
  check(millMoves.length > 0 && millMoves.every((m) => m.remove !== undefined), "completing a mill requires a capture");
  check(millMoves.some((m) => m.remove === 8), "the lone enemy man can be captured");
  // reduced to two men after placement => loss
  const lost = { nodes: [0, 0, ...Array(22).fill(null)], turn: 0, placed: [9, 9], idle: 0 };
  lost.nodes[10] = 1; lost.nodes[12] = 1; lost.nodes[14] = 1;
  const st = nm.status(lost);
  check(st.over && st.winner === 1, "a player with two men after placement loses");
}

// ---- Kōnane ----
console.log("\nKōnane:");
{
  const ko = getGame("konane");
  const init = ko.initial();
  check(init.board.every((x) => x !== null), "board starts completely full");
  const lifts = ko.legalMoves(init);
  check(lifts.length === 4 && lifts.every((m) => m.affected?.[0] === m.to), "Black opens with 4 corner/centre lifts");
  // after both opening lifts it is Black to jump, and a jump exists
  const s1 = ko.applyMove(init, lifts.find((m) => m.to === 0)); // lift corner (0,0)
  check(s1.turn === 1 && s1.opened === 1, "White lifts next");
  const wl = ko.legalMoves(s1);
  check(wl.length > 0 && wl.every((m) => s1.board[m.to] === 1), "White's lift is a stone beside the gap");
  const s2 = ko.applyMove(s1, wl[0]);
  check(s2.opened === 2 && s2.turn === 0, "play begins with Black after two lifts");
  const jumps = ko.legalMoves(s2);
  check(jumps.length > 0 && jumps.every((m) => (m.affected?.length ?? 0) >= 1), "every play move is a capture");
  // a piece with no enemy to hop over has no move => that side loses
  const empty = Array(64).fill(null);
  empty[idx(0, 0, 8)] = 0; // lone Black stone, nothing to jump
  check(ko.status({ board: empty, turn: 0, opened: 2 }).winner === 1, "a player who cannot jump loses");
}

// ---- Breakthrough ----
console.log("\nBreakthrough:");
{
  const bt = getGame("breakthrough");
  const empty = () => Array(64).fill(null);
  // straight ahead into an empty square is legal; straight capture is not
  let b = empty();
  b[idx(3, 4, 8)] = 0; // Light pawn marching up
  b[idx(3, 3, 8)] = 1; // Dark pawn directly ahead — blocks, cannot be captured
  let mv = bt.legalMoves({ board: b, turn: 0 });
  check(!mv.some((m) => m.to === idx(3, 3, 8)), "no straight capture");
  // diagonal capture is legal
  b = empty();
  b[idx(3, 4, 8)] = 0;
  b[idx(2, 3, 8)] = 1; // Dark pawn diagonally ahead
  mv = bt.legalMoves({ board: b, turn: 0 });
  const cap = mv.find((m) => m.to === idx(2, 3, 8));
  check(cap && cap.affected?.length === 1, "diagonal capture removes the enemy");
  // reaching the far edge wins
  b = empty();
  b[idx(0, 0, 8)] = 0;
  check(bt.status({ board: b, turn: 1 }).winner === 0, "Light on the top row wins");
  b = empty();
  b[idx(0, 7, 8)] = 1;
  check(bt.status({ board: b, turn: 0 }).winner === 1, "Dark on the bottom row wins");
}

// ---- Hex ----
console.log("\nHex:");
{
  const hx = getGame("hex");
  const N = 11;
  const empty = () => Array(N * N).fill(null);
  // a full top-to-bottom column of Blue (player 0) connects the edges
  let b = empty();
  for (let r = 0; r < N; r++) b[r * N + 5] = 0;
  check(hx.status({ board: b, turn: 1 }).winner === 0, "Blue's full column connects top to bottom");
  // a full left-to-right row of Red (player 1) connects the edges
  b = empty();
  for (let c = 0; c < N; c++) b[5 * N + c] = 1;
  check(hx.status({ board: b, turn: 0 }).winner === 1, "Red's full row connects left to right");
  // a near-complete Blue column (one gap) is not yet a win but is one stone away
  b = empty();
  for (let r = 0; r < N; r++) if (r !== 6) b[r * N + 5] = 0;
  check(!hx.status({ board: b, turn: 0 }).over, "an unconnected position is not terminal");
  check(hx.legalMoves({ board: b, turn: 0 }).length === N * N - (N - 1), "legal moves = every empty cell");
  // strength: Red (player 1) is one cell from joining left↔right along row 5 (gap
  // at the centre); Blue to move must plug that unique connector to survive.
  b = empty();
  for (let c = 0; c < N; c++) if (c !== 5) b[5 * N + c] = 1;
  const blk = chooseMove(hx, { board: b, turn: 0 }, STRONG(2));
  check(blk.move?.to === 5 * N + 5, "Hex AI blocks the opponent's one-move win");
}

// ---- Lines of Action ----
console.log("\nLines of Action:");
{
  const lo = getGame("loa");
  const init = lo.initial();
  check(init.board.filter((x) => x === 0).length === 12 && init.board.filter((x) => x === 1).length === 12,
    "each side starts with 12 pieces");
  check(!lo.status(init).over, "the split opening setup is not connected");
  // move distance equals the piece count on the line: an opening edge piece on
  // row 0 has 6 pieces on that row, so a horizontal move travels 6 squares — off
  // the board, hence illegal; a vertical move travels 2 (two pieces in that file).
  const v = lo.legalMoves(init).filter((m) => m.from === idx(1, 0, 8));
  check(v.length > 0, "a corner-adjacent edge piece has at least one legal move");
  // a single connected blob is an immediate win
  const blob = Array(64).fill(null);
  blob[idx(3, 3, 8)] = 0; blob[idx(4, 3, 8)] = 0; blob[idx(3, 4, 8)] = 0;
  // give White some scattered pieces so it is White-to-move and not yet connected
  blob[idx(0, 0, 8)] = 1; blob[idx(7, 7, 8)] = 1;
  check(lo.status({ board: blob, turn: 1, ply: 10 }).winner === 0, "a single connected group wins");
  // enemy pieces block a slide (cannot leap the opponent)
  const path = Array(64).fill(null);
  path[idx(0, 3, 8)] = 0; // mover
  path[idx(1, 3, 8)] = 1; path[idx(2, 3, 8)] = 1; // two enemies on the row → distance 3, blocked at step 1
  const horiz = lo.legalMoves({ board: path, turn: 0, ply: 0 }).filter((m) => m.from === idx(0, 3, 8) && Math.floor(m.to / 8) === 3);
  check(horiz.length === 0, "a slide cannot leap over enemy pieces");
}

// ---- Surakarta ----
console.log("\nSurakarta:");
{
  const sk = getGame("surakarta");
  const I = (c, r) => r * 6 + c;
  const init = sk.initial();
  check(init.board.filter((x) => x === 0).length === 12 && init.board.filter((x) => x === 1).length === 12, "12 stones each side");
  // a capture must round a loop: a stone can take an enemy by sliding around the
  // inner TL loop and down column 1
  let b = Array(36).fill(null);
  b[I(0, 1)] = 0; b[I(1, 1)] = 1;
  let caps = sk.legalMoves({ board: b, turn: 0, ply: 0 }).filter((m) => m.affected?.length);
  check(caps.some((m) => m.to === I(1, 1)), "loop capture around the inner circuit is found");
  // the two centre lines carry no loops, so adjacent stones there cannot capture
  b = Array(36).fill(null); b[I(2, 2)] = 0; b[I(2, 3)] = 1;
  caps = sk.legalMoves({ board: b, turn: 0, ply: 0 }).filter((m) => m.affected?.length);
  check(caps.length === 0, "no capture from the loop-less centre cross");
  // ordinary moves never capture
  check(sk.legalMoves(init).every((m) => !m.affected?.length), "opening offers only ordinary (non-capturing) moves");
  // capturing the last enemy stone wins
  b = Array(36).fill(null); b[I(0, 0)] = 0;
  check(sk.status({ board: b, turn: 1, ply: 5 }).winner === 0, "a side with no stones left loses");
}

// ---- Fanorona ----
console.log("\nFanorona:");
{
  const fn = getGame("fanorona");
  const I = (c, r) => r * 9 + c;
  const init = fn.initial();
  check(init.board.filter((x) => x === 0).length === 22 && init.board.filter((x) => x === 1).length === 22, "22 stones each side");
  check(init.board[I(4, 2)] === null, "the centre point starts empty");
  // approach capture takes the whole enemy line
  let b = Array(45).fill(null);
  b[I(2, 2)] = 0; b[I(4, 2)] = 1; b[I(5, 2)] = 1;
  let mv = fn.legalMoves({ board: b, turn: 0, ply: 0 });
  check(mv.every((m) => (m.affected?.length ?? 0) > 0), "captures are compulsory (no paika offered)");
  const ap = mv.find((m) => m.from === I(2, 2) && m.to === I(3, 2));
  check(ap && ap.affected.length === 2, "approach captures the whole line");
  // withdrawal capture takes the line behind
  b = Array(45).fill(null); b[I(3, 2)] = 0; b[I(2, 2)] = 1; b[I(1, 2)] = 1;
  const wd = fn.legalMoves({ board: b, turn: 0, ply: 0 }).find((m) => m.from === I(3, 2) && m.to === I(4, 2));
  check(wd && wd.affected.length === 2, "withdrawal captures the line behind");
  // weak points cannot move diagonally
  b = Array(45).fill(null); b[I(1, 0)] = 0;
  check(fn.legalMoves({ board: b, turn: 0, ply: 0 }).every((m) => m.from % 9 === m.to % 9 || Math.floor(m.from / 9) === Math.floor(m.to / 9)),
    "a weak intersection only moves orthogonally");
  // a chain in two different directions exists and may also stop early
  b = Array(45).fill(null); b[I(0, 0)] = 0; b[I(2, 0)] = 1; b[I(3, 0)] = 1; b[I(1, 2)] = 1; b[I(1, 3)] = 1;
  mv = fn.legalMoves({ board: b, turn: 0, ply: 0 });
  check(mv.some((m) => m.to === I(1, 1) && m.affected.length === 4), "a two-step capture chain is enumerated");
  check(mv.some((m) => m.to === I(1, 0) && m.affected.length === 2), "stopping after one capture is also legal");
}

console.log(`\n[validate-games] games=${GAMES.length} checks=${checks} problems=${problems}`);
process.exit(problems ? 1 : 0);
