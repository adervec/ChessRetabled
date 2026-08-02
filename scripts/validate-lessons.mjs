// Validates lesson content: every "move" step must have a legal FEN whose side
// to move matches `solver`, and every accepted answer must be a legal move.
// Decorative "text" step boards are rendered without the engine, so they are
// not chess.js-validated here.
import { Chess } from "chess.js";

const { COURSES } = await import("../src/content/lessons.ts");

let problems = 0;
let moveSteps = 0;

for (const course of COURSES) {
  for (const lesson of course.lessons) {
    for (const [i, step] of lesson.steps.entries()) {
      if (step.kind !== "move") continue;
      const where = `${course.id}/${lesson.id}#${i}`;
      if (!step.fen) {
        console.log(`✗ ${where}: move step has no FEN`);
        problems++;
        continue;
      }
      let chess;
      try {
        chess = new Chess(step.fen);
      } catch (e) {
        console.log(`✗ ${where}: invalid FEN — ${e.message}`);
        problems++;
        continue;
      }
      moveSteps++;
      if (chess.turn() !== step.solver) {
        console.log(
          `✗ ${where}: solver='${step.solver}' but side-to-move is '${chess.turn()}'`
        );
        problems++;
      }
      const legal = new Set(chess.moves({ verbose: true }).map((m) => m.lan));
      for (const ans of step.answer) {
        const ok =
          legal.has(ans) ||
          (ans.length === 4 &&
            [...legal].some((l) => l.length === 5 && l.startsWith(ans)));
        if (!ok) {
          console.log(`✗ ${where}: answer '${ans}' is not legal`);
          problems++;
        }
      }
    }
  }
}

console.log(
  `\n[validate-lessons] courses=${COURSES.length} moveSteps=${moveSteps} problems=${problems}`
);
process.exit(problems ? 1 : 0);
