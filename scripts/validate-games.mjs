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

console.log(`\n[validate-games] games=${GAMES.length} checks=${checks} problems=${problems}`);
process.exit(problems ? 1 : 0);
