// Verifies the games-suite learning paths: every challenge's setup move ids must
// be legal in sequence from the initial position, the resulting position must not
// already be over, and every accepted answer must be a legal move there.
import { LEARN_PATHS, getPath } from "../src/games/learn/paths.ts";
import { getGame } from "../src/games/registry.ts";

let problems = 0;
let challenges = 0;

for (const path of LEARN_PATHS) {
  const def = getGame(path.gameId);
  if (!def) {
    console.log(`✗ ${path.gameId}: no such game`);
    problems++;
    continue;
  }
  for (const lesson of path.lessons) {
    for (const [i, step] of lesson.steps.entries()) {
      if (step.kind !== "challenge") continue;
      challenges++;
      const where = `${path.gameId}/${lesson.id}#${i}`;
      let s = def.initial();
      let ok = true;
      for (const id of step.setup) {
        const m = def.legalMoves(s).find((x) => x.id === id);
        if (!m) {
          console.log(`✗ ${where}: setup move '${id}' is not legal`);
          problems++;
          ok = false;
          break;
        }
        s = def.applyMove(s, m);
      }
      if (!ok) continue;
      if (def.status(s).over) {
        console.log(`✗ ${where}: position is already over before the answer`);
        problems++;
        continue;
      }
      if (!step.accept || step.accept.length === 0) {
        console.log(`✗ ${where}: no accepted answers`);
        problems++;
      }
      const legal = new Set(def.legalMoves(s).map((m) => m.id));
      for (const a of step.accept) {
        if (!legal.has(a)) {
          console.log(`✗ ${where}: accepted answer '${a}' is not legal`);
          problems++;
        }
      }
    }
  }
}

// sanity: every game in the suite has a learning path
import { GAMES } from "../src/games/registry.ts";
for (const g of GAMES) {
  if (!getPath(g.id)) {
    console.log(`✗ ${g.id}: no learning path`);
    problems++;
  }
}

console.log(
  `\n[validate-game-lessons] paths=${LEARN_PATHS.length} challenges=${challenges} problems=${problems}`
);
process.exit(problems ? 1 : 0);
