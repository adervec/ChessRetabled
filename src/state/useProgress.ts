import { create } from "zustand";
import { persist } from "zustand/middleware";

export type LessonRecord = { completed: boolean; stars: number; ts: number };
export type DrillRecord = { completed: boolean; best: number | null };
export type GameResult = "win" | "loss" | "draw";

export type ProgressState = {
  xp: number;
  puzzle: {
    rating: number;
    solved: number;
    attempted: number;
    currentStreak: number;
    bestStreak: number;
  };
  lessons: Record<string, LessonRecord>;
  drills: Record<string, DrillRecord>;
  games: { played: number; won: number; lost: number; drawn: number };
  streak: { count: number; lastActiveISO: string | null };

  // actions
  addXp: (n: number) => void;
  recordPuzzle: (solved: boolean, ratingDelta: number) => void;
  completeLesson: (id: string, stars: number) => void;
  completeDrill: (id: string, stat?: number) => void;
  recordGame: (result: GameResult) => void;
  touchDay: () => void;
  reset: () => void;
};

const todayISO = () => new Date().toISOString().slice(0, 10);

function dayDiff(aISO: string, bISO: string): number {
  const a = new Date(aISO + "T00:00:00");
  const b = new Date(bISO + "T00:00:00");
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

/** XP curve: level N needs N*150 cumulative-ish. Simple + readable. */
export function levelFromXp(xp: number): { level: number; into: number; need: number } {
  let level = 1;
  let need = 150;
  let acc = 0;
  while (xp >= acc + need) {
    acc += need;
    level++;
    need = Math.round(need * 1.18);
  }
  return { level, into: xp - acc, need };
}

const initial = {
  xp: 0,
  puzzle: { rating: 800, solved: 0, attempted: 0, currentStreak: 0, bestStreak: 0 },
  lessons: {} as Record<string, LessonRecord>,
  drills: {} as Record<string, DrillRecord>,
  games: { played: 0, won: 0, lost: 0, drawn: 0 },
  streak: { count: 0, lastActiveISO: null as string | null },
};

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      ...initial,

      addXp: (n) => set((s) => ({ xp: s.xp + Math.max(0, Math.round(n)) })),

      recordPuzzle: (solved, ratingDelta) =>
        set((s) => {
          const currentStreak = solved ? s.puzzle.currentStreak + 1 : 0;
          return {
            puzzle: {
              rating: Math.max(100, s.puzzle.rating + Math.round(ratingDelta)),
              solved: s.puzzle.solved + (solved ? 1 : 0),
              attempted: s.puzzle.attempted + 1,
              currentStreak,
              bestStreak: Math.max(s.puzzle.bestStreak, currentStreak),
            },
            xp: s.xp + (solved ? 12 : 2),
          };
        }),

      completeLesson: (id, stars) =>
        set((s) => {
          const prev = s.lessons[id];
          const bestStars = Math.max(prev?.stars ?? 0, stars);
          const firstTime = !prev?.completed;
          return {
            lessons: {
              ...s.lessons,
              [id]: { completed: true, stars: bestStars, ts: Date.now() },
            },
            xp: s.xp + (firstTime ? 25 : 5),
          };
        }),

      completeDrill: (id, stat) =>
        set((s) => {
          const prev = s.drills[id];
          const best =
            stat == null
              ? prev?.best ?? null
              : prev?.best == null
              ? stat
              : Math.min(prev.best, stat);
          const firstTime = !prev?.completed;
          return {
            drills: { ...s.drills, [id]: { completed: true, best } },
            xp: s.xp + (firstTime ? 20 : 4),
          };
        }),

      recordGame: (result) =>
        set((s) => ({
          games: {
            played: s.games.played + 1,
            won: s.games.won + (result === "win" ? 1 : 0),
            lost: s.games.lost + (result === "loss" ? 1 : 0),
            drawn: s.games.drawn + (result === "draw" ? 1 : 0),
          },
          xp: s.xp + (result === "win" ? 30 : result === "draw" ? 12 : 6),
        })),

      touchDay: () =>
        set((s) => {
          const today = todayISO();
          const last = s.streak.lastActiveISO;
          if (last === today) return {};
          let count = 1;
          if (last) {
            const d = dayDiff(last, today);
            if (d === 1) count = s.streak.count + 1;
            else if (d <= 0) count = s.streak.count; // clock weirdness; keep
          }
          return { streak: { count, lastActiveISO: today } };
        }),

      reset: () => set({ ...initial }),
    }),
    {
      name: "chessretabled.progress.v1",
      // keep it small; persist everything in the slice by default
    }
  )
);

// Convenience selectors
export const useLevel = () => {
  const xp = useProgress((s) => s.xp);
  return levelFromXp(xp);
};
