// Headless verification for the Logic Lab (src/logic/). Exercises the Sudoku
// generator/solver/uniqueness and the Mastermind feedback + solver.
import { generate, solve, countSolutions, isValidComplete, conflicts } from "../src/logic/sudoku.ts";
import { feedback, makeSecret, allCodes, consistentGuess, CODE_LENGTH } from "../src/logic/mastermind.ts";
import { generate as nonoGen, satisfies, lineClues } from "../src/logic/nonogram.ts";
import { generate as lightsGen, toggle as lightsToggle, isSolved as lightsSolved } from "../src/logic/lightsout.ts";
import { generate as binGen, countSolutions as binCount, solve as binSolveMaybe, isValid as binValid, conflicts as binConflicts } from "../src/logic/binairo.ts";

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

console.log(`\n[validate-logic] checks=${checks} problems=${problems}`);
process.exit(problems ? 1 : 0);
