// Learning-path content for the games suite. A path is an ordered list of
// lessons; each lesson is a sequence of steps. "text" steps teach a concept;
// "challenge" steps set up a real position (by replaying moves from the game's
// initial state) and ask the learner to find an accepted move.
//
// Challenges are authored only for placement games (Tic-Tac-Toe, Connect Four,
// Gomoku, Reversi), whose move ids are simple and deterministic — so setups and
// answers are stable strings that scripts/validate-game-lessons.mjs can verify.

export type GLessonStep =
  | { kind: "text"; title?: string; body: string }
  | {
      kind: "challenge";
      title?: string;
      body: string;
      /** Move ids applied from def.initial() to reach the challenge position. */
      setup: string[];
      /** Acceptable answer move ids (each must be legal in the setup position). */
      accept: string[];
      success: string;
      hint?: string;
    };

export interface GLesson {
  id: string;
  title: string;
  blurb: string;
  steps: GLessonStep[];
}

export interface GLearnPath {
  gameId: string;
  /** Short tagline shown on the path card. */
  tagline: string;
  lessons: GLesson[];
}
