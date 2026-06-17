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

let problems = 0;
let checks = 0;
function check(cond, msg) {
  checks++;
  if (!cond) { console.log(`  ✗ ${msg}`); problems++; }
}
const SEEDS = [1, 2, 3, 7, 42, 99, 123, 777];

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

console.log(`\n[validate-logic] checks=${checks} problems=${problems}`);
process.exit(problems ? 1 : 0);
