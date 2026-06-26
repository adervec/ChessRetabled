// Headless verification for the Logic Lab (src/logic/). Exercises the Sudoku
// generator/solver/uniqueness and the Mastermind feedback + solver.
import { generate, solve, countSolutions, isValidComplete, conflicts } from "../src/logic/sudoku.ts";
import { feedback, makeSecret, allCodes, consistentGuess, CODE_LENGTH } from "../src/logic/mastermind.ts";
import { generate as nonoGen, satisfies, lineClues } from "../src/logic/nonogram.ts";
import { generate as lightsGen, toggle as lightsToggle, isSolved as lightsSolved } from "../src/logic/lightsout.ts";
import { generate as binGen, countSolutions as binCount, solve as binSolveMaybe, isValid as binValid, conflicts as binConflicts } from "../src/logic/binairo.ts";
import { initSlide, slide, neighbors, isSolved as slideSolved, isSolvable, solvedTiles } from "../src/logic/slide.ts";
import { generate as futGen, countSolutions as futCount, solve as futSolve, conflicts as futConflicts } from "../src/logic/futoshiki.ts";
import { generate as kkGen, countSolutions as kkCount, solve as kkSolve, isSolved as kkSolved } from "../src/logic/kenken.ts";
import { generate as hitGen, isSolved as hitSolved } from "../src/logic/hitori.ts";
import { generate as skyGen, countSolutions as skyCount, solve as skySolve, isSolved as skySolved, visible } from "../src/logic/skyscrapers.ts";
import { generate as hidGen, countSolutions as hidCount, isSolved as hidSolved } from "../src/logic/hidato.ts";
import { generate as kkrGen, countSolutions as kkrCount, isSolved as kkrSolved, rowTargetsOf, colTargetsOf } from "../src/logic/kakurasu.ts";
import { generate as akGen, countSolutions as akCount, solve as akSolve, isSolved as akSolved } from "../src/logic/akari.ts";
import { generate as sugGen, countSolutions as sugCount, solve as sugSolve, isSolved as sugSolved } from "../src/logic/suguru.ts";
import { generate as kkuGen, countSolutions as kkuCount, solve as kkuSolve, isSolved as kkuSolved } from "../src/logic/kakuro.ts";
import { generate as sbGen, countSolutions as sbCount, solve as sbSolve, isSolved as sbSolved } from "../src/logic/starbattle.ts";
import { generate as shkGen, countSolutions as shkCount, solve as shkSolve, isSolved as shkSolved } from "../src/logic/shikaku.ts";
import { generate as mosGen, countSolutions as mosCount, cluesOf, isSolved as mosSolved } from "../src/logic/mosaic.ts";
import { generate as aqGen, countSolutions as aqCount, isSolved as aqSolved } from "../src/logic/aquarium.ts";
import { generate as slGen, countSolutions as slCount, solutionEdges as slEdges, isSolved as slSolved } from "../src/logic/slitherlink.ts";
import { generate as msGen, countSolutions as msCount, solutionEdges as msEdges, isSolved as msSolved, WHITE as MS_W, BLACK as MS_B } from "../src/logic/masyu.ts";
import { generate as nkGen, countSolutions as nkCount, isSolved as nkSolved } from "../src/logic/nurikabe.ts";
import { generate as brGen, countSolutions as brCount, isSolved as brSolved } from "../src/logic/bridges.ts";
import { generate as teGen, countSolutions as teCount, isSolved as teSolved } from "../src/logic/tents.ts";

let problems = 0;
let checks = 0;
function check(cond, msg) {
  checks++;
  if (!cond) { console.log(`  ✗ ${msg}`); problems++; }
}
// A handful of seeds per puzzle — enough to exercise the generators/solvers
// without the heaviest puzzles (Kakuro/Suguru) dominating CI time.
const SEEDS = [1, 7, 42, 777];

console.log("Sudoku:");
for (const seed of SEEDS) {
  for (const diff of ["easy", "medium", "hard"]) {
    const { puzzle, solution, givens } = generate(seed, diff);
    check(isValidComplete(solution), `sudoku ${seed}/${diff}: solution is a valid complete grid`);
    check(countSolutions(puzzle, 2) === 1, `sudoku ${seed}/${diff}: puzzle has a unique solution`);
    const solved = solve(puzzle);
    check(solved !== null && solved.join() === solution.join(), `sudoku ${seed}/${diff}: solver recovers the solution`);
    check(givens.every((g, i) => g === (puzzle[i] !== 0)), `sudoku ${seed}/${diff}: givens mark the clues`);
    check(puzzle.every((v, i) => v === 0 || v === solution[i]), `sudoku ${seed}/${diff}: clues agree with the solution`);
    check(conflicts(puzzle).every((b) => !b), `sudoku ${seed}/${diff}: a fresh puzzle has no conflicts`);
  }
}
// a deliberately broken grid is detected
{
  const bad = new Array(81).fill(0);
  bad[0] = 5; bad[1] = 5;
  check(conflicts(bad)[0] && conflicts(bad)[1], "sudoku: duplicate in a row flagged as a conflict");
}

console.log("\nMastermind:");
check(JSON.stringify(feedback([1, 2, 3, 4], [1, 2, 3, 4])) === JSON.stringify({ black: 4, white: 0 }), "exact match = 4 black");
check(JSON.stringify(feedback([1, 1, 2, 2], [2, 2, 1, 1])) === JSON.stringify({ black: 0, white: 4 }), "all displaced = 4 white");
check(JSON.stringify(feedback([1, 2, 3, 4], [4, 3, 2, 1])) === JSON.stringify({ black: 0, white: 4 }), "reverse = 4 white");
check(JSON.stringify(feedback([1, 1, 1, 1], [1, 2, 3, 4])) === JSON.stringify({ black: 1, white: 0 }), "over-guessed colour counted once");
check(JSON.stringify(feedback([5, 6, 1, 1], [1, 1, 2, 3])) === JSON.stringify({ black: 0, white: 2 }), "white pegs respect multiplicity");

const pool = allCodes();
check(pool.length === 1296, "mastermind: 1296 possible codes");
let worst = 0;
for (const seed of SEEDS) {
  const secret = makeSecret(seed);
  const history = [];
  let cracked = false;
  for (let t = 0; t < 12; t++) {
    const guess = consistentGuess(history, pool);
    const fb = feedback(guess, secret);
    history.push({ guess, fb });
    if (fb.black === CODE_LENGTH) { cracked = true; worst = Math.max(worst, t + 1); break; }
  }
  check(cracked, `mastermind seed ${seed}: solver cracks the code`);
}
check(worst <= 10, `mastermind: solver always cracks within 10 guesses (worst ${worst})`);

console.log("\nNonogram:");
check(JSON.stringify(lineClues([1, 1, 0, 1, 1, 1])) === JSON.stringify([2, 3]), "run lengths computed");
check(JSON.stringify(lineClues([0, 0, 0])) === JSON.stringify([0]), "empty line clue is [0]");
for (const seed of SEEDS) {
  const p = nonoGen(seed, 10);
  check(p.rows.length === 10 && p.cols.length === 10, `nonogram ${seed}: 10×10 clues`);
  check(satisfies(p.solution, p), `nonogram ${seed}: the generating picture satisfies its own clues`);
  check(!satisfies(new Array(100).fill(0), p), `nonogram ${seed}: an empty grid fails the clues`);
}

console.log("\nLights Out:");
for (const seed of SEEDS) {
  const p = lightsGen(seed, 5, 6);
  check(!lightsSolved(p.grid), `lights ${seed}: puzzle starts unsolved`);
  let g = p.grid.slice();
  for (const i of p.solution) g = lightsToggle(g, p.size, i);
  check(lightsSolved(g), `lights ${seed}: recorded solution turns everything off`);
  // toggling a cell twice is a no-op
  const twice = lightsToggle(lightsToggle(p.grid, p.size, 12), p.size, 12);
  check(twice.join() === p.grid.join(), `lights ${seed}: a double toggle cancels`);
}

console.log("\nBinairo:");
for (const seed of SEEDS) {
  const { puzzle, solution, givens } = binGen(seed, 6, "medium");
  check(binValid(solution, 6), `binairo ${seed}: solution obeys all rules`);
  check(binCount(puzzle, 6, 2) === 1, `binairo ${seed}: puzzle has a unique solution`);
  const solved = binSolveMaybe(puzzle, 6);
  check(solved !== null && solved.join() === solution.join(), `binairo ${seed}: solver recovers the solution`);
  check(givens.every((g, i) => g === (puzzle[i] !== -1)), `binairo ${seed}: givens mark clues`);
  check(binConflicts(puzzle, 6).every((b) => !b), `binairo ${seed}: fresh puzzle has no conflicts`);
}
// three-in-a-row is flagged
{
  const g = new Array(36).fill(-1);
  g[0] = 1; g[1] = 1; g[2] = 1;
  check(binConflicts(g, 6)[0] && binConflicts(g, 6)[2], "binairo: three-in-a-row flagged");
}

console.log("\n15-puzzle:");
for (const seed of SEEDS) {
  const s = initSlide(seed, 4, 120);
  const sorted = s.tiles.slice().sort((a, b) => a - b);
  check(sorted.join() === [...Array(16).keys()].join(), `slide ${seed}: tiles are a permutation of 0..15`);
  check(isSolvable(s.tiles, 4), `slide ${seed}: scramble is solvable`);
  check(!slideSolved(s), `slide ${seed}: starts unsolved`);
  check(s.tiles[s.blank] === 0, `slide ${seed}: blank index is consistent`);
  // sliding a neighbour then sliding back returns the original
  const n0 = neighbors(s.blank, 4)[0];
  const there = slide(s, n0);
  const back = slide(there, s.blank);
  check(back.tiles.join() === s.tiles.join(), `slide ${seed}: a slide and its reverse cancel`);
}
{
  const goal = { size: 4, tiles: solvedTiles(4), blank: 15, moves: 0 };
  check(slideSolved(goal), "slide: the ordered arrangement is solved");
}

console.log("\nFutoshiki:");
for (const seed of SEEDS) {
  const { puzzle, solution, givens, constraints, size } = futGen(seed, 5);
  // solution is a Latin square
  let latin = true;
  for (let r = 0; r < size; r++) {
    const rs = new Set(), cs = new Set();
    for (let c = 0; c < size; c++) { rs.add(solution[r * size + c]); cs.add(solution[c * size + r]); }
    if (rs.size !== size || cs.size !== size) latin = false;
  }
  check(latin, `futoshiki ${seed}: solution is a Latin square`);
  check(constraints.every((k) => solution[k.a] < solution[k.b]), `futoshiki ${seed}: constraints hold for the solution`);
  check(futCount(puzzle, size, constraints, 2) === 1, `futoshiki ${seed}: puzzle has a unique solution`);
  const solved = futSolve(puzzle, size, constraints);
  check(solved !== null && solved.join() === solution.join(), `futoshiki ${seed}: solver recovers the solution`);
  check(givens.every((g, i) => g === (puzzle[i] !== 0)), `futoshiki ${seed}: givens mark clues`);
  check(futConflicts(puzzle, size, constraints).every((b) => !b), `futoshiki ${seed}: fresh puzzle has no conflicts`);
}

console.log("\nKenKen:");
for (const seed of SEEDS) {
  const p = kkGen(seed, 5);
  // solution is a Latin square
  let latin = true;
  for (let r = 0; r < 5; r++) {
    const rs = new Set(), cs = new Set();
    for (let c = 0; c < 5; c++) { rs.add(p.solution[r * 5 + c]); cs.add(p.solution[c * 5 + r]); }
    if (rs.size !== 5 || cs.size !== 5) latin = false;
  }
  check(latin, `kenken ${seed}: solution is a Latin square`);
  check(p.cellCage.length === 25 && p.cellCage.every((id) => id >= 0), `kenken ${seed}: every cell is in a cage`);
  check(kkSolved(p.solution, p), `kenken ${seed}: the solution satisfies every cage`);
  check(kkCount(p, 2) === 1, `kenken ${seed}: puzzle has a unique solution`);
  const solved = kkSolve(p);
  check(solved !== null && solved.join() === p.solution.join(), `kenken ${seed}: solver recovers the solution`);
}

console.log("\nHitori:");
for (const seed of SEEDS) {
  const p = hitGen(seed, 6);
  check(p.board.length === 36, `hitori ${seed}: 6×6 board`);
  check(p.solution.some(Boolean), `hitori ${seed}: at least one cell is shaded`);
  check(hitSolved(p.board, p.solution, 6), `hitori ${seed}: the baked-in shading satisfies all rules`);
  // shading nothing should fail (the board has forced duplicates)
  check(!hitSolved(p.board, new Array(36).fill(false), 6), `hitori ${seed}: shading nothing is not a solution`);
}

console.log("\nSkyscrapers:");
check(visible([1, 2, 3, 4, 5]) === 5, "ascending row: all 5 visible");
check(visible([5, 4, 3, 2, 1]) === 1, "descending row: 1 visible");
check(visible([2, 1, 4, 3, 5]) === 3, "visibility counts new maxima");
for (const seed of SEEDS) {
  const { size, solution, clues } = skyGen(seed, 5);
  let latin = true;
  for (let r = 0; r < size; r++) {
    const rs = new Set(), cs = new Set();
    for (let c = 0; c < size; c++) { rs.add(solution[r * size + c]); cs.add(solution[c * size + r]); }
    if (rs.size !== size || cs.size !== size) latin = false;
  }
  check(latin, `skyscrapers ${seed}: solution is a Latin square`);
  check(skySolved(solution, size, clues), `skyscrapers ${seed}: solution satisfies its clues`);
  check(skyCount(size, clues, 2) === 1, `skyscrapers ${seed}: unique solution`);
  const solved = skySolve(size, clues);
  check(solved !== null && solved.join() === solution.join(), `skyscrapers ${seed}: solver recovers the solution`);
}

console.log("\nHidato:");
for (const seed of SEEDS) {
  const { size, board, solution, givens } = hidGen(seed, 6);
  check(hidSolved(solution, size), `hidato ${seed}: solution is a valid consecutive path`);
  check(board[solution.indexOf(1)] === 1 && board[solution.indexOf(size * size)] === size * size, `hidato ${seed}: endpoints are given`);
  check(hidCount(board, size, 2) === 1, `hidato ${seed}: unique reconstruction`);
  check(givens.every((g, i) => g === (board[i] !== 0)), `hidato ${seed}: givens mark clues`);
  check(board.every((v, i) => v === 0 || v === solution[i]), `hidato ${seed}: clues agree with the solution`);
}

console.log("\nKakurasu:");
for (const seed of SEEDS) {
  const { size, solution, rowTargets, colTargets } = kkrGen(seed, 5);
  check(rowTargetsOf(solution, size).join() === rowTargets.join(), `kakurasu ${seed}: row targets match the solution`);
  check(colTargetsOf(solution, size).join() === colTargets.join(), `kakurasu ${seed}: col targets match the solution`);
  check(kkrSolved(solution, size, rowTargets, colTargets), `kakurasu ${seed}: solution satisfies its clues`);
  check(kkrCount(size, rowTargets, colTargets, 2) === 1, `kakurasu ${seed}: unique solution`);
}

console.log("\nAkari:");
for (const seed of SEEDS) {
  const { size, walls, solution } = akGen(seed, 7);
  check(akSolved(walls, solution, 7), `akari ${seed}: baked solution lights the board legally`);
  check(akCount(walls, 7, 2) === 1, `akari ${seed}: unique solution`);
  const solved = akSolve(walls, 7);
  check(solved !== null && akSolved(walls, solved, 7), `akari ${seed}: solver finds a valid solution`);
  // a board with no bulbs is not solved (something must be lit)
  check(!akSolved(walls, new Array(size * size).fill(false), 7), `akari ${seed}: empty board is not a solution`);
}

console.log("\nSuguru:");
for (const seed of SEEDS) {
  const { size, solution, puzzle, givens, regionId, regionSize } = sugGen(seed, 6);
  check(sugSolved(solution, size, regionId, regionSize), `suguru ${seed}: solution obeys region + adjacency rules`);
  check(solution.every((v, i) => v >= 1 && v <= regionSize[i]), `suguru ${seed}: each region uses 1..size`);
  check(sugCount(puzzle, size, regionId, regionSize, 2) === 1, `suguru ${seed}: unique solution`);
  const solved = sugSolve(puzzle, size, regionId, regionSize);
  check(solved !== null && solved.join() === solution.join(), `suguru ${seed}: solver recovers the solution`);
  check(givens.every((g, i) => g === (puzzle[i] !== 0)), `suguru ${seed}: givens mark clues`);
}

console.log("\nKakuro:");
for (const seed of SEEDS) {
  const p = kkuGen(seed, 7);
  check(kkuSolved(p.solution, p), `kakuro ${seed}: solution satisfies every run (distinct + sum)`);
  check(kkuCount(p, 2) === 1, `kakuro ${seed}: unique solution`);
  const solved = kkuSolve(p);
  check(solved !== null && kkuSolved(solved, p), `kakuro ${seed}: solver finds a valid solution`);
}

console.log("\nStar Battle:");
for (const seed of SEEDS) {
  const { size, regionId, solution } = sbGen(seed, 6);
  check(sbSolved(solution, regionId, size), `starbattle ${seed}: solution has 1 star per row/col/region, none touching`);
  check(solution.filter(Boolean).length === size, `starbattle ${seed}: exactly ${6} stars`);
  check(sbCount(regionId, size, 2) === 1, `starbattle ${seed}: unique solution`);
  const solved = sbSolve(regionId, size);
  check(solved !== null && solved.join() === solution.join(), `starbattle ${seed}: solver recovers the solution`);
}

console.log("\nShikaku:");
for (const seed of SEEDS) {
  const p = shkGen(seed, 6);
  check(p.numbers.reduce((a, b) => a + b, 0) === 36, `shikaku ${seed}: clue areas tile the 6×6 grid`);
  check(shkCount(p, 2) === 1, `shikaku ${seed}: unique solution`);
  const assign = shkSolve(p);
  check(assign !== null && isSolvedFromAssign(assign, p, shkSolved), `shikaku ${seed}: solver yields a valid partition`);
}
function isSolvedFromAssign(assign, p, fn) { return fn(assign, p); }

console.log("\nMosaic:");
for (const seed of SEEDS) {
  const { size, clues, solution } = mosGen(seed, 7);
  check(cluesOf(solution, size).join() === clues.join(), `mosaic ${seed}: clues match the picture`);
  check(mosSolved(solution, clues, size), `mosaic ${seed}: solution satisfies its clues`);
  check(mosCount(clues, size, 2) === 1, `mosaic ${seed}: unique solution`);
  check(!mosSolved(new Array(size * size).fill(false), clues, size) || solution.every((s) => !s), `mosaic ${seed}: an empty grid isn't a (false) solution`);
}

console.log("\nAquarium:");
for (const seed of SEEDS) {
  const { size, regionId, rowClue, colClue, solution } = aqGen(seed, 6);
  check(aqSolved(solution, size, rowClue, colClue), `aquarium ${seed}: solution matches its row/col clues`);
  check(aqCount(regionId, size, rowClue, colClue, 2) === 1, `aquarium ${seed}: unique solution`);
  check(rowClue.reduce((a, b) => a + b, 0) === colClue.reduce((a, b) => a + b, 0), `aquarium ${seed}: row and col totals agree`);
}

console.log("\nSlitherlink:");
for (const seed of SEEDS) {
  const p = slGen(seed, 6, 6);
  check(slCount(p.clue, 6, 6, 2) === 1, `slitherlink ${seed}: unique solution`);
  const { h, v } = slEdges(p);
  check(slSolved(h, v, p.clue, 6, 6), `slitherlink ${seed}: the solution loop satisfies every clue`);
  check(p.clue.every((k) => k === -1 || (k >= 0 && k <= 3)), `slitherlink ${seed}: clues are blank or 0–3`);
  // an empty board (no lines drawn) is not a finished loop
  check(!slSolved(h.map(() => false), v.map(() => false), p.clue, 6, 6), `slitherlink ${seed}: a blank grid is not solved`);
}
// two separate small loops must NOT count as solved even with no clues
{
  const blank = new Array(36).fill(-1);
  const { h, v } = slEdges(slGen(99, 6, 6));
  // flipping one solution edge off breaks the single loop → no longer solved
  const hi = h.findIndex((x) => x);
  if (hi >= 0) { const broken = h.slice(); broken[hi] = false; check(!slSolved(broken, v, blank, 6, 6), "slitherlink: an open path is not a closed loop"); }
}

console.log("\nMasyu:");
for (const seed of SEEDS) {
  const p = msGen(seed, 6, 6);
  check(msCount(p.pearl, 6, 6, 2) === 1, `masyu ${seed}: unique solution`);
  const { h, v } = msEdges(p);
  check(msSolved(h, v, p.pearl, 6, 6), `masyu ${seed}: the solution loop satisfies every pearl`);
  check(p.pearl.some((x) => x === MS_W || x === MS_B), `masyu ${seed}: has at least one pearl`);
  check(p.pearl.every((x) => x === 0 || x === MS_W || x === MS_B), `masyu ${seed}: pearls are white/black only`);
  // an empty board is not a finished loop
  check(!msSolved(h.map(() => false), v.map(() => false), p.pearl, 6, 6), `masyu ${seed}: a blank grid is not solved`);
}

console.log("\nNurikabe:");
for (const seed of SEEDS) {
  const p = nkGen(seed, 6, 6);
  check(nkCount(p.clues, 6, 6, 2) === 1, `nurikabe ${seed}: unique solution`);
  check(nkSolved(p.solution, p.clues, 6, 6), `nurikabe ${seed}: the generated sea is a valid solution`);
  check(p.clues.length >= 2, `nurikabe ${seed}: at least two islands`);
  check(p.clues.reduce((a, c) => a + c.size, 0) === p.solution.filter((s) => !s).length, `nurikabe ${seed}: island sizes equal the land count`);
  check(!nkSolved(new Array(36).fill(true), p.clues, 6, 6), `nurikabe ${seed}: an all-sea board is rejected`);
}

console.log("\nBridges:");
for (const seed of SEEDS) {
  const p = brGen(seed, 7, 7);
  check(brCount(p.islands, p.edges, p.cross, 2) === 1, `bridges ${seed}: unique solution`);
  check(brSolved(p.solution, p), `bridges ${seed}: the generated bridges are a valid solution`);
  check(p.islands.length >= 4 && p.islands.every((is) => is.count >= 1 && is.count <= 8), `bridges ${seed}: sensible island counts`);
  check(!brSolved(p.edges.map(() => 0), p), `bridges ${seed}: an empty board is not solved`);
  // the solution never crosses two bridges
  check(p.cross.every(([i, j]) => p.solution[i] === 0 || p.solution[j] === 0), `bridges ${seed}: the solution has no crossing bridges`);
}

console.log("\nTents:");
for (const seed of SEEDS) {
  const p = teGen(seed, 7);
  check(teCount(p.tree, 7, p.rowClue, p.colClue, 2) === 1, `tents ${seed}: unique solution`);
  check(teSolved(p.solution, p.tree, 7, p.rowClue, p.colClue), `tents ${seed}: the generated camp is a valid solution`);
  const tents = p.solution.filter(Boolean).length, trees = p.tree.filter(Boolean).length;
  check(tents === trees, `tents ${seed}: tents equal trees`);
  check(p.rowClue.reduce((a, b) => a + b, 0) === tents, `tents ${seed}: row clues total the tents`);
  check(!teSolved(new Array(49).fill(false), p.tree, 7, p.rowClue, p.colClue), `tents ${seed}: an empty board is not solved`);
}

console.log(`\n[validate-logic] checks=${checks} problems=${problems}`);
process.exit(problems ? 1 : 0);
