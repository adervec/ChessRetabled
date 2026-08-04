// The seeded review library: real games worth studying, plus context for the
// games where "famous game" means something other than a move list.
//
// Every chess move list here is replayed by scripts/validate-famous.mjs with
// chess.js — a typo in a SAN string fails the build rather than shipping a game
// that falls apart halfway through. Nothing in this file touches the archive or
// the player's stats; it is a library, not history.

export type FamousKind = "game" | "note";

export interface FamousGame {
  id: string;
  /** Catalogue id, so the review page can use the right analyser. */
  gameId: string;
  title: string;
  /** "Anderssen – Kieseritzky, London 1851" */
  players?: string;
  year?: number;
  /** SAN for chess; omitted for context-only entries. */
  san?: string[];
  kind: FamousKind;
  /** Why this one matters — shown above the board. */
  context: string;
  /** What to watch for while stepping through. */
  lookFor?: string;
}

export const FAMOUS: FamousGame[] = [
  // ---------------------------------------------------------------- chess ---
  {
    id: "opera-game",
    gameId: "chess",
    kind: "game",
    title: "The Opera Game",
    players: "Paul Morphy – Duke of Brunswick & Count Isouard, Paris 1858",
    year: 1858,
    context:
      "Morphy played this in a private box at the Italian Opera House during a performance of Norma, against two amateurs consulting together. It is the most-taught game in chess because every move does exactly one obvious thing: develop, open lines, and aim at the uncastled king.",
    lookFor:
      "Morphy never moves a piece twice in the opening and never grabs material for its own sake. By move 12 every piece he owns is in play and Black has two.",
    san: [
      "e4", "e5", "Nf3", "d6", "d4", "Bg4", "dxe5", "Bxf3", "Qxf3", "dxe5",
      "Bc4", "Nf6", "Qb3", "Qe7", "Nc3", "c6", "Bg5", "b5", "Nxb5", "cxb5",
      "Bxb5+", "Nbd7", "O-O-O", "Rd8", "Rxd7", "Rxd7", "Rd1", "Qe6", "Bxd7+", "Nxd7",
      "Qb8+", "Nxb8", "Rd8#",
    ],
  },
  {
    id: "immortal-game",
    gameId: "chess",
    kind: "game",
    title: "The Immortal Game",
    players: "Adolf Anderssen – Lionel Kieseritzky, London 1851",
    year: 1851,
    context:
      "A casual game played during a break in the first international tournament. Anderssen gives up a bishop, both rooks and the queen, and mates with three minor pieces. It became the emblem of the Romantic era, when attacking was a matter of honour and declining a sacrifice was worse manners than losing.",
    lookFor:
      "Count the material at move 20: Black is a queen and two rooks up. Every one of those captures cost Black a tempo he needed for defence.",
    san: [
      "e4", "e5", "f4", "exf4", "Bc4", "Qh4+", "Kf1", "b5", "Bxb5", "Nf6",
      "Nf3", "Qh6", "d3", "Nh5", "Nh4", "Qg5", "Nf5", "c6", "g4", "Nf6",
      "Rg1", "cxb5", "h4", "Qg6", "h5", "Qg5", "Qf3", "Ng8", "Bxf4", "Qf6",
      "Nc3", "Bc5", "Nd5", "Qxb2", "Bd6", "Bxg1", "e5", "Qxa1+", "Ke2", "Na6",
      "Nxg7+", "Kd8", "Qf6+", "Nxf6", "Be7#",
    ],
  },
  {
    id: "evergreen-game",
    gameId: "chess",
    kind: "game",
    title: "The Evergreen Game",
    players: "Adolf Anderssen – Jean Dufresne, Berlin 1852",
    year: 1852,
    context:
      "Wilhelm Steinitz called it 'evergreen in the laurel crown of the departed chess hero'. The finish — a queen sacrifice on d7 followed by two quiet bishop checks — is one of the most reproduced combinations in the literature.",
    lookFor:
      "Move 19. Rad1 looks like ordinary development; it is the move that makes the whole finish work three moves later.",
    san: [
      "e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "b4", "Bxb4", "c3", "Ba5",
      "d4", "exd4", "O-O", "d3", "Qb3", "Qf6", "e5", "Qg6", "Re1", "Nge7",
      "Ba3", "b5", "Qxb5", "Rb8", "Qa4", "Bb6", "Nbd2", "Bb7", "Ne4", "Qf5",
      "Bxd3", "Qh5", "Nf6+", "gxf6", "exf6", "Rg8", "Rad1", "Qxf3", "Rxe7+", "Nxe7",
      "Qxd7+", "Kxd7", "Bf5+", "Ke8", "Bd7+", "Kf8", "Bxe7#",
    ],
  },
  {
    id: "game-of-the-century",
    gameId: "chess",
    kind: "game",
    title: "The Game of the Century",
    players: "Donald Byrne – Bobby Fischer, New York 1956",
    year: 1956,
    context:
      "Fischer was thirteen. On move 17 he leaves his queen en prise to play Be6, and the resulting 'windmill' of discovered checks nets three minor pieces and a rook for it. Hans Kmoch named the game in Chess Review and the name stuck.",
    lookFor:
      "17...Be6. The engine will tell you it is winning; what it will not tell you is that a thirteen-year-old had to see to the end of a forced sequence eight moves long to know that.",
    san: [
      "Nf3", "Nf6", "c4", "g6", "Nc3", "Bg7", "d4", "O-O", "Bf4", "d5",
      "Qb3", "dxc4", "Qxc4", "c6", "e4", "Nbd7", "Rd1", "Nb6", "Qc5", "Bg4",
      "Bg5", "Na4", "Qa3", "Nxc3", "bxc3", "Nxe4", "Bxe7", "Qb6", "Bc4", "Nxc3",
      "Bc5", "Rfe8+", "Kf1", "Be6", "Bxb6", "Bxc4+", "Kg1", "Ne2+", "Kf1", "Nxd4+",
      "Kg1", "Ne2+", "Kf1", "Nc3+", "Kg1", "axb6", "Qb4", "Ra4", "Qxb6", "Nxd1",
      "h3", "Rxa2", "Kh2", "Nxf2", "Re1", "Rxe1", "Qd8+", "Bf8", "Nxe1", "Bd5",
      "Nf3", "Ne4", "Qb8", "b5", "h4", "h5", "Ne5", "Kg7", "Kg1", "Bc5+",
      "Kf1", "Ng3+", "Ke1", "Bb4+", "Kd1", "Bb3+", "Kc1", "Ne2+", "Kb1", "Nc3+",
      "Kc1", "Rc2#",
    ],
  },
  {
    id: "morphy-paulsen-1857",
    gameId: "chess",
    kind: "game",
    title: "Morphy's queen sacrifice",
    players: "Louis Paulsen – Paul Morphy, New York 1857",
    year: 1857,
    context:
      "The final round of the First American Chess Congress. Morphy plays 17...Qxf3, giving the queen for a pawn, and converts the resulting attack with bishops and rooks against a defence that never gets organised.",
    lookFor:
      "After 17...Qxf3 White is a whole queen up for several moves. Watch how few useful moves that queen actually has.",
    san: [
      "e4", "e5", "Nf3", "Nc6", "Nc3", "Nf6", "Bb5", "Bc5", "O-O", "O-O",
      "Nxe5", "Re8", "Nxc6", "dxc6", "Bc4", "b5", "Be2", "Nxe4", "Nxe4", "Rxe4",
      "Bf3", "Re6", "c3", "Qd3", "b4", "Bb6", "a4", "bxa4", "Qxa4", "Bd7",
      "Ra2", "Rae8", "Qa6", "Qxf3", "gxf3", "Rg6+", "Kh1", "Bh3", "Rd1", "Bg2+",
      "Kg1", "Bxf3+", "Kf1", "Bg2+", "Kg1", "Bh3+", "Kh1", "Bxf2", "Qf1", "Bxf1",
      "Rxf1", "Re2", "Ra1", "Rh6", "d4", "Be3",
    ],
  },
  {
    id: "steinitz-von-bardeleben",
    gameId: "chess",
    kind: "game",
    title: "The game Von Bardeleben walked away from",
    players: "Wilhelm Steinitz – Curt von Bardeleben, Hastings 1895",
    year: 1895,
    context:
      "Steinitz plays 22.Rxe7+, after which every Black capture loses instantly. Von Bardeleben left the playing hall without resigning and let his clock run out. Steinitz then demonstrated the ten-move forced mate to the spectators.",
    lookFor:
      "From move 22 Black's king, rook and knight are all attacked at once and none of them can move. The rook on e7 is untouchable for four consecutive moves.",
    san: [
      "e4", "e5", "Nf3", "Nc6", "Bc4", "Bc5", "c3", "Nf6", "d4", "exd4",
      "cxd4", "Bb4+", "Nc3", "d5", "exd5", "Nxd5", "O-O", "Be6", "Bg5", "Be7",
      "Bxd5", "Bxd5", "Nxd5", "Qxd5", "Bxe7", "Nxe7", "Re1", "f6", "Qe2", "Qd7",
      "Rac1", "c6", "d5", "cxd5", "Nd4", "Kf7", "Ne6", "Rhc8", "Qg4", "g6",
      "Ng5+", "Ke8", "Rxe7+",
    ],
  },
  {
    id: "kasparov-topalov-1999",
    gameId: "chess",
    kind: "game",
    title: "Kasparov's king hunt",
    players: "Garry Kasparov – Veselin Topalov, Wijk aan Zee 1999",
    year: 1999,
    context:
      "Often called the finest game of the computer era. Kasparov gives up a rook on move 24 and drives Topalov's king from b8 to a3 — the length of the board — before mating material even appears. Analysts have argued about whether it was fully sound ever since; nobody argues about whether it was worth playing.",
    lookFor:
      "24.Rxd4. The king walk starts two moves later and does not stop for fifteen moves.",
    san: [
      "e4", "d6", "d4", "Nf6", "Nc3", "g6", "Be3", "Bg7", "Qd2", "c6",
      "f3", "b5", "Nge2", "Nbd7", "Bh6", "Bxh6", "Qxh6", "Bb7", "a3", "e5",
      "O-O-O", "Qe7", "Kb1", "a6", "Nc1", "O-O-O", "Nb3", "exd4", "Rxd4", "c5",
      "Rd1", "Nb6", "g3", "Kb8", "Na5", "Ba8", "Bh3", "d5", "Qf4+", "Ka7",
      "Rhe1", "d4", "Nd5", "Nbxd5", "exd5", "Qd6", "Rxd4", "cxd4", "Re7+", "Kb6",
      "Qxd4+", "Kxa5", "b4+", "Ka4", "Qc3", "Qxd5", "Ra7", "Bb7", "Rxb7", "Qc4",
      "Qxf6", "Kxa3", "Qxa6+", "Kxb4", "c3+", "Kxc3", "Qa1+", "Kd2", "Qb2+", "Kd1",
      "Bf1", "Rd2", "Rd7", "Rxd7", "Bxc4", "bxc4", "Qxh8", "Rd3", "Qa8", "c3",
      "Qa4+", "Ke1", "f4", "f5", "Kc1", "Rd2", "Qa7",
    ],
  },

  // ------------------------------------------------------- board games ------
  {
    id: "checkers-solved",
    gameId: "checkers",
    kind: "note",
    title: "Checkers is a draw, and we know it for certain",
    year: 2007,
    context:
      "In 2007 Jonathan Schaeffer's team at the University of Alberta announced that checkers is *weakly solved*: with perfect play from both sides the game is a draw. It took eighteen years of computation and a database of 39 trillion positions. Chinook, the program behind it, had already drawn a world championship match against Marion Tinsley in 1992 — Tinsley, who lost seven games of checkers in forty years, remains the strongest player the game has produced.",
    lookFor:
      "The AI here is a plain alpha-beta search, not a solved database — which is why it can still be beaten, and why the same opening does not always give the same game.",
  },
  {
    id: "nine-mens-morris-solved",
    gameId: "nine-mens-morris",
    kind: "note",
    title: "Also a draw, since 1993",
    year: 1993,
    context:
      "Ralph Gasser solved Nine Men's Morris in 1993 using retrograde analysis over the full endgame space: perfect play draws. The game is far older than the result — boards are cut into the roofing slabs of the temple at Kurna in Egypt, and it turns up on a Bronze Age tomb in County Wicklow.",
    lookFor:
      "The placement phase decides most games between humans. Try to leave yourself two open mills at once before the last piece goes down.",
  },
  {
    id: "connect-four-solved",
    gameId: "connect-four",
    kind: "note",
    title: "First player wins — but only from the middle",
    year: 1988,
    context:
      "James Allen and Victor Allis independently solved Connect Four in October 1988. The first player wins with perfect play, but *only* by starting in the centre column; opening on either adjacent column draws, and anything wider loses. Allis's thesis introduced the 'knowledge-based' proof-number search that later solved several other games.",
    lookFor:
      "Count odd and even threats. On a seven-by-six board the first player wants odd-numbered rows, the second player wants even ones.",
  },
  {
    id: "hex-strategy-stealing",
    gameId: "hex",
    kind: "note",
    title: "The first player wins, and the proof tells you nothing about how",
    year: 1949,
    context:
      "John Nash showed that Hex cannot be drawn — someone always connects — and that the first player must therefore have a winning strategy, by the strategy-stealing argument: if the second player had one, the first could steal it by making an arbitrary move and then following it. The proof is non-constructive. For boards above 10×10 nobody knows what the winning strategy actually is.",
    lookFor:
      "The bridge — two cells a knight's-move apart sharing two empty neighbours — is the fundamental unit of Hex. It cannot be cut, so you can treat it as already connected.",
  },
  {
    id: "gomoku-solved",
    gameId: "gomoku",
    kind: "note",
    title: "Why tournament Gomoku has handicap rules",
    year: 1993,
    context:
      "Victor Allis proved in 1993 that free-style Gomoku is a first-player win on a 15×15 board. Competitive play therefore uses the Renju or Swap2 openings, which handicap the first player deliberately. The version here is free-style, so black really does have the advantage — that is the game, not a bug.",
    lookFor:
      "An open three (three in a row with both ends free) forces a reply. Two of them at once, made by a single move, wins on the spot.",
  },

  // ------------------------------------------------------------- cards ------
  {
    id: "cribbage-29",
    gameId: "cribbage",
    kind: "note",
    title: "The 29 hand",
    context:
      "The best possible cribbage hand is 29: the three fives matching the suit of the starter, plus the jack of the starter's suit for 'his nobs'. Fifteens make sixteen points, the four-of-a-kind twelve, and the nob one. The odds of being dealt one are roughly 1 in 216,000 — most lifelong players never see one.",
    lookFor:
      "The scorer in this app is verified against exactly this hand; if 29 ever stops coming out, the harness fails.",
  },
  {
    id: "klondike-odds",
    gameId: "klondike",
    kind: "note",
    title: "How many Klondike deals are actually winnable?",
    context:
      "About 79% of Klondike deals are theoretically solvable with perfect information — but a player who cannot see the face-down cards wins far fewer, and the figure for one-card-draw play by good human players sits closer to 43%. The exact solvability rate is still open; the 79% comes from Monte-Carlo work by Ronald Bjarnason and colleagues in 2007.",
    lookFor:
      "The hint here searches from the position as *you* can see it, not from the shuffled truth — so 'no move' sometimes means 'no move you could have known about'.",
  },
  {
    id: "holdem-hand-ranks",
    gameId: "holdem",
    kind: "note",
    title: "Why a flush beats a straight",
    context:
      "Hand rankings are not arbitrary: they are ordered by how rare each hand is from a random five-card deal. There are 10,200 straights in a 52-card deck and only 5,108 flushes, so the flush ranks higher. The same counting explains every step of the ladder, and it is why the order changes in games with wild cards or short decks.",
    lookFor:
      "The evaluator in poker/eval.ts ranks by exactly these categories, then by kickers — the same routine scores Five-Card Draw and best-five-of-seven Hold'em.",
  },

  // ------------------------------------------------------------- logic ------
  {
    id: "sudoku-17",
    gameId: "sudoku",
    kind: "note",
    title: "Seventeen clues, and not one fewer",
    year: 2012,
    context:
      "In 2012 Gary McGuire, Bastian Tugemann and Gilles Civario proved by exhaustive computer search that no valid Sudoku with a unique solution can have fewer than 17 given clues. Puzzles with exactly 17 exist in the thousands; 16 is impossible. The proof took about 7.1 million core-hours.",
    lookFor:
      "The generator here removes clues only while a solution-counter still reports exactly one solution, so every puzzle it hands you is provably unique — usually landing well above 17.",
  },
  {
    id: "nonogram-np",
    gameId: "nonogram",
    kind: "note",
    title: "Nonograms are NP-complete",
    year: 1996,
    context:
      "Nobuhisa Ueda and Tadaaki Nagao showed in 1996 that deciding whether a nonogram has a solution is NP-complete. That is why a hard one can resist every line-by-line deduction and still be solvable — at some point the only honest method left is to assume, follow the consequences, and take it back.",
    lookFor:
      "Every puzzle generated here is solvable by deduction alone; the generator throws away any that need a guess.",
  },
  {
    id: "slitherlink-loop",
    gameId: "slitherlink",
    kind: "note",
    title: "A loop is just the edge of an inside",
    context:
      "The trick that makes Slitherlink generators tractable is a change of viewpoint: instead of drawing a closed curve, colour each cell inside or outside. The loop is then whatever separates the two, and it is closed automatically. This app generates by growing a simply-connected region and verifies uniqueness with a face-colour backtracker — the same idea drives Masyu and Nurikabe.",
    lookFor:
      "When you are stuck, stop thinking about the line and ask which side of it a cell is on.",
  },
];

export const FAMOUS_BY_ID: Record<string, FamousGame> = Object.fromEntries(
  FAMOUS.map((f) => [f.id, f])
);

export function famousFor(gameId: string): FamousGame[] {
  return FAMOUS.filter((f) => f.gameId === gameId);
}
