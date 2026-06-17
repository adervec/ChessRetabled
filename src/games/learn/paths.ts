import type { GLearnPath } from "./types";

// One learning path per game: rules → tactics → strategy. Challenge steps use
// placement-game move ids (verified by scripts/validate-game-lessons.mjs).

const ticTacToe: GLearnPath = {
  gameId: "tic-tac-toe",
  tagline: "The 3×3 classic — and why it's always a draw.",
  lessons: [
    {
      id: "ttt-basics",
      title: "How to play",
      blurb: "Rules and the goal.",
      steps: [
        { kind: "text", title: "The goal", body: "Two players take turns marking empty squares. The first to line up three of their marks — across, down, or diagonally — wins. Fill the board with no line and it's a draw." },
        { kind: "text", title: "The centre is king", body: "The centre square sits on four of the eight winning lines — more than any other cell. When you move first, taking the centre is the strongest opening." },
      ],
    },
    {
      id: "ttt-win",
      title: "Spot the win",
      blurb: "Always take a free win.",
      steps: [
        { kind: "text", title: "Two-in-a-row", body: "Before anything else, check: do you already have two in a line with the third square empty? If so, take it and win. Never miss a free win to set up a 'better' one." },
        {
          kind: "challenge",
          title: "Your move — finish it",
          body: "You are Crosses. You have two along the top row. Complete the line.",
          setup: ["p0", "p4", "p1", "p5"],
          accept: ["p2"],
          success: "Three in a row — that's the game.",
          hint: "Look along the top edge.",
        },
      ],
    },
    {
      id: "ttt-block",
      title: "Block the threat",
      blurb: "Stop their win before making your own.",
      steps: [
        { kind: "text", title: "Defence first", body: "If you can't win this turn, check whether your opponent threatens to win next turn — and block it. A missed block loses immediately." },
        {
          kind: "challenge",
          title: "Your move — defend",
          body: "You are Noughts. Crosses threatens three along the top. Block the open square.",
          setup: ["p0", "p4", "p1"],
          accept: ["p2"],
          success: "Blocked! With perfect play from here the game is a draw.",
          hint: "Where would Crosses play to win?",
        },
      ],
    },
  ],
};

const connectFour: GLearnPath = {
  gameId: "connect-four",
  tagline: "Drop, connect four, and set traps with double threats.",
  lessons: [
    {
      id: "c4-basics",
      title: "How to play",
      blurb: "Gravity, columns, and the goal.",
      steps: [
        { kind: "text", title: "Dropping discs", body: "Pick a column; your disc falls to the lowest empty slot. Connect four of your colour in any direction — horizontal, vertical, or diagonal — to win." },
        { kind: "text", title: "Play the centre", body: "The centre column takes part in the most possible four-in-a-rows. Controlling it early gives you the most threats and the most flexibility." },
      ],
    },
    {
      id: "c4-win",
      title: "Complete four",
      blurb: "Convert a stack into a win.",
      steps: [
        {
          kind: "challenge",
          title: "Your move — stack the win",
          body: "You are Red with three discs stacked in the leftmost column. Top it off.",
          setup: ["c0", "c1", "c0", "c1", "c0", "c1"],
          accept: ["c0"],
          success: "Four in a column — won!",
          hint: "Keep building the tall stack.",
        },
      ],
    },
    {
      id: "c4-block",
      title: "Block and double threats",
      blurb: "Defence, and the winning idea.",
      steps: [
        {
          kind: "challenge",
          title: "Your move — block",
          body: "Yellow has three stacked on the left and will win next turn. Stop it.",
          setup: ["c1", "c0", "c1", "c0", "c2", "c0"],
          accept: ["c0"],
          success: "Defused. Now look for your own threats.",
          hint: "Cap the tall enemy stack.",
        },
        { kind: "text", title: "The double threat", body: "The way to actually win is to create two threats at once — two squares that each complete a four. Your opponent can only block one. Open rows on the bottom and odd/even square control are how strong players engineer these." },
      ],
    },
  ],
};

const gomoku: GLearnPath = {
  gameId: "gomoku",
  tagline: "Five in a row — build open threats faster than they can block.",
  lessons: [
    {
      id: "gomoku-basics",
      title: "How to play",
      blurb: "Stones, rows, and open ends.",
      steps: [
        { kind: "text", title: "The goal", body: "Place a stone on any empty point. First to an unbroken row of five — in any direction — wins." },
        { kind: "text", title: "Open vs closed", body: "An 'open three' (three in a row with both ends free) is powerful: ignored, it becomes an open four that wins on either side. A row blocked on one end is far weaker. Build open threats; block your opponent's." },
      ],
    },
    {
      id: "gomoku-win",
      title: "Finish five",
      blurb: "Convert an open four.",
      steps: [
        {
          kind: "challenge",
          title: "Your move — make five",
          body: "You are Black with four in a row and both ends open. Complete it.",
          setup: ["p108", "p123", "p109", "p124", "p110", "p125", "p111", "p126"],
          accept: ["p112", "p107"],
          success: "Five in a row — an open four is unstoppable.",
          hint: "Extend the row at either end.",
        },
      ],
    },
    {
      id: "gomoku-strategy",
      title: "Threats and forks",
      blurb: "Why open fours win.",
      steps: [
        { kind: "text", title: "The double-three fork", body: "Make a move that creates two open threes at once and your opponent cannot stop both — one becomes an open four and wins. Much of Gomoku is engineering, and spotting, these forks." },
        { kind: "text", title: "Defence", body: "Treat every enemy open three as urgent. An unblocked open three is one move from an open four, and an open four is already lost. Block early, before it forks." },
      ],
    },
  ],
};

const reversi: GLearnPath = {
  gameId: "reversi",
  tagline: "Flip discs, grab corners, and win the endgame.",
  lessons: [
    {
      id: "reversi-basics",
      title: "How to play",
      blurb: "Outflanking and flipping.",
      steps: [
        { kind: "text", title: "Outflanking", body: "Place a disc so that one or more of your opponent's discs sit in a straight line between your new disc and another of yours. Every trapped disc flips to your colour. You must move so at least one disc flips; if you can't, you pass." },
        {
          kind: "challenge",
          title: "Your move — open the game",
          body: "You are Black. Make a legal opening move — each of the four flips one disc.",
          setup: [],
          accept: ["m19", "m26", "m37", "m44"],
          success: "Nice — that disc flipped to your colour.",
          hint: "Play next to a white disc that you can trap.",
        },
      ],
    },
    {
      id: "reversi-corners",
      title: "Corners and edges",
      blurb: "Why corners decide games.",
      steps: [
        { kind: "text", title: "Corners are permanent", body: "A disc in a corner can never be flipped — nothing can outflank it. Corners are the single most valuable squares; anchor lines from them and they stay yours all game." },
        { kind: "text", title: "Beware the X-squares", body: "The squares diagonally next to a corner (the 'X-squares') are traps: occupying one early often hands your opponent the corner. Avoid them until forced." },
      ],
    },
    {
      id: "reversi-mobility",
      title: "Mobility, not greed",
      blurb: "Fewer discs can be better.",
      steps: [
        { kind: "text", title: "Don't flip too much", body: "Flipping the most discs early is usually a mistake — it gives your opponent fewer of your discs to attack and reduces YOUR future options. Strong players keep their disc count low in the midgame to preserve mobility (legal moves)." },
        { kind: "text", title: "The endgame swing", body: "Discs only count at the very end. The final few moves can flip huge lines, so count parity and save safe moves for last. Quiet positional play beats greedy flipping." },
      ],
    },
  ],
};

const checkers: GLearnPath = {
  gameId: "checkers",
  tagline: "Forced captures, kings, and trading down to win.",
  lessons: [
    {
      id: "checkers-basics",
      title: "How to play",
      blurb: "Moves, jumps, and crowning.",
      steps: [
        { kind: "text", title: "Moving and jumping", body: "Men move one square diagonally forward onto a dark square. You capture by jumping an adjacent enemy into the empty square beyond — and captures are forced: if you can take, you must, and you must keep jumping with that piece while more jumps exist." },
        { kind: "text", title: "Kings", body: "Reach the far row and your man is crowned a King, which moves and jumps both forward and backward. Kings are far stronger; getting one is often the game's turning point." },
      ],
    },
    {
      id: "checkers-tactics",
      title: "The forced-capture trick",
      blurb: "Use 'must capture' against them.",
      steps: [
        { kind: "text", title: "Shots", body: "Because captures are forced, you can offer a piece so that after your opponent must take, you jump back and capture two or more. Giving up one to win two is the heart of checkers tactics — always check what their forced reply lets YOU do." },
        { kind: "text", title: "Don't get forked", body: "Before you move, ask whether you're leaving a piece where a single enemy jump starts a multi-capture chain. The forced-capture rule cuts both ways." },
      ],
    },
    {
      id: "checkers-strategy",
      title: "Strategy",
      blurb: "Trade when ahead; hold the back row.",
      steps: [
        { kind: "text", title: "Trade down when ahead", body: "Up a piece? Trade pieces evenly. Fewer pieces on the board magnifies your extra material until it's decisive — the same idea as simplifying in chess." },
        { kind: "text", title: "Guard the back row", body: "Keep men on your back row early: they stop your opponent from crowning. But don't cling to them so long that the rest of your position gets squeezed." },
        { kind: "text", title: "Control the centre", body: "Central squares give your pieces more diagonals and more mobility. Pushing a lone piece to the edge too early often just makes it a target." },
      ],
    },
  ],
};

const morris: GLearnPath = {
  gameId: "nine-mens-morris",
  tagline: "Form mills, make a swinging mill, and squeeze them out.",
  lessons: [
    {
      id: "morris-basics",
      title: "How to play",
      blurb: "The three phases.",
      steps: [
        { kind: "text", title: "Place, move, fly", body: "Phase 1: take turns placing your nine men on empty points. Phase 2: slide a man along a line to an adjacent empty point. When you're down to three men you may 'fly' to any empty point. Reduce your opponent to two men, or leave them with no legal move, to win." },
        { kind: "text", title: "Mills", body: "Line up three of your men along a marked line to form a mill, and you remove one enemy man — but not one already inside a mill, unless every enemy man is in a mill." },
      ],
    },
    {
      id: "morris-placing",
      title: "The placing phase",
      blurb: "Where to put your nine men.",
      steps: [
        { kind: "text", title: "Take the crossings", body: "The four points where a spoke meets a ring touch four lines each — the most valuable points on the board, like the centre in other games. Grabbing these gives you the most ways to build mills." },
        { kind: "text", title: "Two threats at once", body: "Place so you threaten to complete two different mills next turn. Your opponent can only block one, so the other becomes a mill and a capture." },
      ],
    },
    {
      id: "morris-swing",
      title: "The swinging mill",
      blurb: "The winning weapon.",
      steps: [
        { kind: "text", title: "Open and close", body: "Arrange two mills sharing a man so that sliding it out breaks one mill and sliding it back forms the other. Each swing forms a mill and captures a piece — a 'running' mill can dismantle an opponent in a few moves." },
        { kind: "text", title: "Deny their swing", body: "Watch for your opponent building the same trap, and block the empty point their mill needs before it starts swinging. Restricting their moves toward a stalemate is itself a way to win." },
      ],
    },
  ],
};

export const LEARN_PATHS: GLearnPath[] = [
  ticTacToe,
  connectFour,
  gomoku,
  reversi,
  checkers,
  morris,
];

export function getPath(gameId: string): GLearnPath | undefined {
  return LEARN_PATHS.find((p) => p.gameId === gameId);
}
