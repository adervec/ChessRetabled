import type { Color } from "../chess/types";

export type LessonStep =
  | {
      kind: "text";
      title?: string;
      body: string;
      fen?: string; // optional static board to illustrate
      orientation?: Color;
    }
  | {
      kind: "move";
      title?: string;
      body: string;
      fen: string;
      solver: Color;
      answer: string[]; // accepted moves in UCI (e.g. "e2e4")
      success: string; // shown when solved
      hint?: string;
    };

export type Lesson = {
  id: string;
  title: string;
  summary: string;
  steps: LessonStep[];
};

export type Course = {
  id: string;
  title: string;
  icon: string;
  accent: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  description: string;
  lessons: Lesson[];
};

export const COURSES: Course[] = [
  {
    id: "first-steps",
    title: "First Steps",
    icon: "🐣",
    accent: "var(--mint)",
    level: "Beginner",
    description: "Meet the pieces and learn how each one moves and captures.",
    lessons: [
      {
        id: "the-knight",
        title: "The Knight",
        summary: "The tricky L-shaped jumper.",
        steps: [
          {
            kind: "text",
            title: "Meet the Knight",
            body: "The knight moves in an L-shape: two squares in one direction, then one square at a right angle. It is the only piece that can JUMP over other pieces.",
            fen: "8/8/8/8/4N3/8/8/8 w - - 0 1",
          },
          {
            kind: "move",
            title: "Capture the pawn",
            body: "A knight captures by landing on an enemy piece. Hop the knight onto the black pawn.",
            fen: "7k/8/8/3p4/8/4N3/8/4K3 w - - 0 1",
            solver: "w",
            answer: ["e3d5"],
            success: "Nice jump! The knight snags the pawn with an L-shaped hop.",
            hint: "From e3, the knight can reach d5.",
          },
        ],
      },
      {
        id: "the-bishop",
        title: "The Bishop",
        summary: "Sliding on diagonals.",
        steps: [
          {
            kind: "text",
            title: "Meet the Bishop",
            body: "Bishops slide any distance along diagonals. Each bishop stays on one color of square forever.",
            fen: "8/8/8/8/3B4/8/8/8 w - - 0 1",
          },
          {
            kind: "move",
            title: "Win the pawn",
            body: "Slide the bishop along the diagonal to capture the black pawn.",
            fen: "7k/8/8/8/6p1/8/4B3/4K3 w - - 0 1",
            solver: "w",
            answer: ["e2g4"],
            success: "The bishop glides across and grabs the pawn.",
            hint: "Follow the light diagonal from e2 toward the pawn.",
          },
        ],
      },
      {
        id: "rook-queen",
        title: "Rook & Queen",
        summary: "The heavy hitters.",
        steps: [
          {
            kind: "text",
            title: "The Rook",
            body: "Rooks slide any distance along ranks (rows) and files (columns) — straight lines only.",
            fen: "8/8/8/8/8/8/8/R7 w - - 0 1",
          },
          {
            kind: "move",
            title: "Rook takes",
            body: "Capture the pawn with your rook by sliding straight up the file.",
            fen: "7k/8/8/8/8/8/p7/R3K3 w - - 0 1",
            solver: "w",
            answer: ["a1a2"],
            success: "Straight up the file — pawn gone!",
            hint: "The rook on a1 can move up the a-file.",
          },
          {
            kind: "text",
            title: "The Queen",
            body: "The queen combines rook and bishop: she slides any distance in a straight line OR a diagonal. The most powerful piece on the board.",
            fen: "8/8/8/8/8/8/8/3Q4 w - - 0 1",
          },
          {
            kind: "move",
            title: "Queen takes",
            body: "Use the queen's diagonal power to capture the black pawn.",
            fen: "7k/8/8/8/8/2p5/8/Q3K3 w - - 0 1",
            solver: "w",
            answer: ["a1c3"],
            success: "The queen sweeps along the diagonal. Devastating.",
            hint: "From a1, a diagonal leads to c3.",
          },
        ],
      },
      {
        id: "check-and-mate",
        title: "Check & Checkmate",
        summary: "The whole point of the game.",
        steps: [
          {
            kind: "text",
            title: "What is check?",
            body: "When a king is attacked, it is in CHECK. The player must immediately get out of check. If there is no way out, it is CHECKMATE — and the game is over.",
          },
          {
            kind: "move",
            title: "Deliver checkmate",
            body: "The black king is trapped on the back rank by its own pawns. Slide your rook in for checkmate!",
            fen: "6k1/5ppp/8/8/8/8/8/4R2K w - - 0 1",
            solver: "w",
            answer: ["e1e8"],
            success: "Checkmate! The king is attacked and has no escape. You win.",
            hint: "Put the rook on the 8th rank — the king's own pawns trap it.",
          },
        ],
      },
    ],
  },
  {
    id: "checkmate-patterns",
    title: "Checkmate Patterns",
    icon: "👑",
    accent: "var(--gold)",
    level: "Beginner",
    description: "Learn the classic mating patterns every player must know.",
    lessons: [
      {
        id: "back-rank",
        title: "The Back-Rank Mate",
        summary: "Trapped behind a wall of pawns.",
        steps: [
          {
            kind: "text",
            title: "The weak back rank",
            body: "A king castled behind three pawns is safe — until a rook or queen invades the back rank. With no escape squares, it's mate.",
          },
          {
            kind: "move",
            title: "Find the mate",
            body: "Deliver back-rank checkmate with your queen.",
            fen: "6k1/5ppp/8/8/8/8/8/3Q3K w - - 0 1",
            solver: "w",
            answer: ["d1d8"],
            success: "Back-rank mate! Always give your king a 'luft' (escape) to avoid this.",
            hint: "Invade the 8th rank.",
          },
        ],
      },
      {
        id: "two-rook",
        title: "The Lawnmower Mate",
        summary: "Two rooks roll the king to the edge.",
        steps: [
          {
            kind: "text",
            title: "Rolling rooks",
            body: "Two rooks can mate alone. One rook cuts off a rank; the other checks on the next. They 'mow' the king to the edge of the board.",
          },
          {
            kind: "move",
            title: "Finish it",
            body: "One rook already cuts off the 7th rank. Bring the other rook to the 8th for checkmate.",
            fen: "7k/1R6/8/8/8/8/8/R3K3 w - - 0 1",
            solver: "w",
            answer: ["a1a8"],
            success: "Lawnmower mate! The king couldn't escape the rolling rooks.",
            hint: "The b7-rook covers the 7th rank. Check on the 8th.",
          },
        ],
      },
      {
        id: "smothered",
        title: "Smothered Mate",
        summary: "The king buried by its own army.",
        steps: [
          {
            kind: "text",
            title: "A knight's revenge",
            body: "When a king is surrounded by its own pieces, a lone knight can deliver a spectacular 'smothered' checkmate.",
          },
          {
            kind: "move",
            title: "Spring the trap",
            body: "The black king is smothered by its own rook and pawns. Find the knight checkmate.",
            fen: "6rk/6pp/8/6N1/8/8/8/6K1 w - - 0 1",
            solver: "w",
            answer: ["g5f7"],
            success: "Smothered mate! The king is trapped by its own pieces — beautiful.",
            hint: "Jump the knight to f7.",
          },
        ],
      },
    ],
  },
  {
    id: "tactics",
    title: "Winning Tactics",
    icon: "⚔️",
    accent: "var(--coral)",
    level: "Intermediate",
    description: "Forks, pins, and skewers — the tools that win material.",
    lessons: [
      {
        id: "fork",
        title: "The Fork",
        summary: "Attack two things at once.",
        steps: [
          {
            kind: "text",
            title: "Two for one",
            body: "A FORK attacks two enemy pieces at the same time. Knights are the most feared forkers because they can hit pieces that can't defend each other.",
          },
          {
            kind: "move",
            title: "Fork king and rook",
            body: "Find the knight move that checks the king AND attacks the rook. The opponent saves the king and you win the rook.",
            fen: "r3k3/8/8/3N4/8/8/8/4K3 w - - 0 1",
            solver: "w",
            answer: ["d5c7"],
            success: "A royal fork! Check the king, win the rook next move.",
            hint: "A knight on c7 hits both e8 and a8.",
          },
        ],
      },
      {
        id: "pin",
        title: "The Pin",
        summary: "Freeze a piece in place.",
        steps: [
          {
            kind: "text",
            title: "Stuck in place",
            body: "A PIN attacks a piece that can't move because a more valuable piece sits behind it. Bishops, rooks, and queens pin along their lines.",
          },
          {
            kind: "move",
            title: "Pin the knight",
            body: "Place your bishop so the black knight is pinned against its king — it won't be able to move.",
            fen: "4k3/8/2n5/8/8/8/8/4KB2 w - - 0 1",
            solver: "w",
            answer: ["f1b5"],
            success: "Pinned! The knight is frozen — move up and it exposes the king.",
            hint: "Aim the bishop down the a4–e8 diagonal toward the king.",
          },
        ],
      },
      {
        id: "skewer",
        title: "The Skewer",
        summary: "A pin in reverse.",
        steps: [
          {
            kind: "text",
            title: "Front to back",
            body: "A SKEWER is like a pin reversed: the valuable piece is in FRONT. When it moves out of check, you capture the piece behind it.",
          },
          {
            kind: "move",
            title: "Skewer king and queen",
            body: "Check the king with your rook along the rank. When it steps aside, you'll win the queen behind it.",
            fen: "3k3q/8/8/8/8/8/8/3KR3 w - - 0 1",
            solver: "w",
            answer: ["e1e8"],
            success: "Skewer! The king must move and the queen falls.",
            hint: "Check along the 8th rank from e8.",
          },
        ],
      },
    ],
  },
  {
    id: "openings",
    title: "Opening Principles",
    icon: "🚀",
    accent: "var(--sky)",
    level: "Intermediate",
    description: "Start every game with a healthy, active position.",
    lessons: [
      {
        id: "center",
        title: "Control the Center",
        summary: "The four central squares rule the board.",
        steps: [
          {
            kind: "text",
            title: "Why the center?",
            body: "Pieces in the center control more squares and reach both sides of the board faster. Start by claiming the center with a pawn.",
          },
          {
            kind: "move",
            title: "Stake your claim",
            body: "Play a central pawn two squares forward to grab space in the middle.",
            fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            solver: "w",
            answer: ["e2e4", "d2d4"],
            success: "A classic center pawn — now your pieces have room to breathe.",
            hint: "Push the e- or d-pawn two squares.",
          },
        ],
      },
      {
        id: "develop",
        title: "Develop Your Pieces",
        summary: "Knights and bishops, off the back rank.",
        steps: [
          {
            kind: "text",
            title: "Get them out",
            body: "Bring knights and bishops toward the center early. Knights before bishops is a good rule of thumb. Don't move the same piece twice in the opening.",
          },
          {
            kind: "move",
            title: "Develop a knight",
            body: "Develop your kingside knight toward the center — its best square.",
            fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
            solver: "w",
            answer: ["g1f3"],
            success: "Knight to f3 — eyeing the center and ready to castle.",
            hint: "The g1-knight belongs on f3.",
          },
        ],
      },
      {
        id: "castle",
        title: "Castle Early",
        summary: "Tuck your king to safety.",
        steps: [
          {
            kind: "text",
            title: "King safety",
            body: "Castling moves your king to safety and connects your rooks. Aim to castle within the first ~10 moves.",
          },
          {
            kind: "move",
            title: "Castle kingside",
            body: "Everything is ready. Castle your king to safety on the kingside.",
            fen: "rnbqk2r/pppp1ppp/5n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
            solver: "w",
            answer: ["e1g1"],
            success: "Castled! Your king is safe and your rook joins the game.",
            hint: "Move the king two squares toward the h-rook.",
          },
        ],
      },
    ],
  },
  {
    id: "endgames",
    title: "Endgame Essentials",
    icon: "🏁",
    accent: "var(--violet)",
    level: "Advanced",
    description: "Convert your advantage when few pieces remain.",
    lessons: [
      {
        id: "opposition",
        title: "The Opposition",
        summary: "The key to king-and-pawn endgames.",
        steps: [
          {
            kind: "text",
            title: "Kings face off",
            body: "When kings stand two squares apart with one square between them, the player NOT to move 'has the opposition' and controls the other king. It's the secret to promoting pawns.",
            fen: "8/8/4k3/8/4K3/8/8/8 w - - 0 1",
          },
          {
            kind: "move",
            title: "Take the opposition",
            body: "Step your king forward to seize the opposition, forcing the black king to give way.",
            fen: "8/4k3/8/8/4K3/8/8/8 w - - 0 1",
            solver: "w",
            answer: ["e4e5"],
            success: "You hold the opposition — the enemy king must step aside.",
            hint: "March straight toward the enemy king to stand two squares away.",
          },
        ],
      },
      {
        id: "promotion",
        title: "Pawn Promotion",
        summary: "Turn a humble pawn into a queen.",
        steps: [
          {
            kind: "text",
            title: "The pawn's dream",
            body: "A pawn that reaches the far side promotes — usually to a queen. In the endgame, an extra pawn often becomes an extra queen.",
          },
          {
            kind: "move",
            title: "Make a queen",
            body: "Push your pawn to the final rank and promote it.",
            fen: "8/4P1k1/8/8/8/8/8/4K3 w - - 0 1",
            solver: "w",
            answer: ["e7e8q", "e7e8"],
            success: "A brand-new queen! From pawn to powerhouse.",
            hint: "Advance the pawn to the 8th rank.",
          },
        ],
      },
      {
        id: "rook-mate",
        title: "King & Rook Mate",
        summary: "Driving the lone king to the edge.",
        steps: [
          {
            kind: "text",
            title: "The box method",
            body: "With king and rook vs king, use your rook to build a 'box' that shrinks, forcing the enemy king to the edge where you deliver mate. Practice this in the Practice arena!",
          },
          {
            kind: "move",
            title: "Deliver the mate",
            body: "The black king is on the edge and your king guards the escape. Give checkmate with the rook.",
            fen: "4k3/8/4K3/8/8/8/8/7R w - - 0 1",
            solver: "w",
            answer: ["h1h8"],
            success: "Checkmate! King and rook is a must-know technique.",
            hint: "Check along the 8th rank — your king covers the escape squares.",
          },
        ],
      },
    ],
  },
];

export function getCourse(id: string): Course | undefined {
  return COURSES.find((c) => c.id === id);
}

export function getLesson(
  courseId: string,
  lessonId: string
): { course: Course; lesson: Lesson; index: number } | undefined {
  const course = getCourse(courseId);
  if (!course) return undefined;
  const index = course.lessons.findIndex((l) => l.id === lessonId);
  if (index < 0) return undefined;
  return { course, lesson: course.lessons[index], index };
}

export const TOTAL_LESSONS = COURSES.reduce(
  (n, c) => n + c.lessons.length,
  0
);
