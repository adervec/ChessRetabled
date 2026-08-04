// The famous-games library is content, and content that claims to be a real game
// has to actually be one. Every chess move list is replayed through chess.js: an
// illegal or mistyped move fails here rather than falling apart under the user
// halfway through a replay.
//
//   node scripts/validate-famous.mjs

import { Chess } from "chess.js";
import { FAMOUS } from "../src/content/famous.ts";
import { CATALOG_BY_ID } from "../src/catalog.ts";

let checks = 0;
let problems = 0;
const fail = (msg) => {
  problems++;
  console.error("  FAIL " + msg);
};
const check = (cond, msg) => {
  checks++;
  if (!cond) fail(msg);
};

const seen = new Set();
for (const f of FAMOUS) {
  check(!seen.has(f.id), `duplicate id "${f.id}"`);
  seen.add(f.id);

  check(!!CATALOG_BY_ID[f.gameId], `${f.id}: gameId "${f.gameId}" is not in the catalogue`);
  check(f.title.length > 0, `${f.id}: needs a title`);
  check(f.context.length > 80, `${f.id}: context is too thin to be worth showing`);
  check(f.kind === "game" || f.kind === "note", `${f.id}: unknown kind`);

  if (f.kind === "note") {
    check(!f.san, `${f.id}: a note must not carry a move list`);
    continue;
  }

  check(Array.isArray(f.san) && f.san.length > 0, `${f.id}: a game needs moves`);
  if (!Array.isArray(f.san)) continue;

  // Replay. chess.js throws on an illegal move, so report the ply that broke.
  const chess = new Chess();
  let ply = 0;
  let broke = null;
  for (const san of f.san) {
    ply++;
    try {
      const m = chess.move(san);
      if (!m) {
        broke = san;
        break;
      }
    } catch {
      broke = san;
      break;
    }
  }
  checks++;
  if (broke !== null) {
    fail(`${f.id}: illegal move at ply ${ply} ("${broke}") — position was ${chess.fen()}`);
    continue;
  }

  // A game people remember ends in something: mate, or a position worth the
  // walk. Only insist that the replay is long enough to be a real game.
  check(f.san.length >= 20, `${f.id}: only ${f.san.length} plies — too short to be the game claimed`);

  const last = f.san[f.san.length - 1];
  if (last.endsWith("#")) {
    checks++;
    if (!chess.isCheckmate()) fail(`${f.id}: last move is written as mate but the position is not checkmate`);
  }
}

const games = FAMOUS.filter((f) => f.kind === "game").length;
const notes = FAMOUS.filter((f) => f.kind === "note").length;
const wings = new Set(FAMOUS.map((f) => CATALOG_BY_ID[f.gameId]?.category).filter(Boolean));
check(wings.size === 4, `library covers ${wings.size}/4 wings (${[...wings].join(", ")})`);

console.log(`\n[validate-famous] games=${games} notes=${notes} wings=${wings.size} checks=${checks} problems=${problems}`);
if (problems > 0) process.exit(1);
