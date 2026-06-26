// Shared metadata for the Logic Lab puzzles — used by the lobby (pages/Logic.tsx)
// and the unified catalog (src/catalog.ts) that powers the dashboard.

export interface LogicPuzzleMeta {
  id: string;
  name: string;
  icon: string;
  blurb: string;
}

export const LOGIC_PUZZLES: LogicPuzzleMeta[] = [
  { id: "sudoku", name: "Sudoku", icon: "🔢", blurb: "Fill the 9×9 so every row, column, and box holds 1–9. Unique solution, always." },
  { id: "kenken", name: "KenKen", icon: "✳", blurb: "A Latin square split into arithmetic cages — hit every cage's target." },
  { id: "futoshiki", name: "Futoshiki", icon: "⟨⟩", blurb: "A 5×5 Latin square that also obeys the greater-than signs between cells." },
  { id: "nonogram", name: "Nonogram", icon: "🖼", blurb: "Reveal the hidden picture from the row and column run clues." },
  { id: "binairo", name: "Binairo", icon: "⚫", blurb: "Fill 0s and 1s: no three in a row, balanced lines, all rows unique." },
  { id: "hitori", name: "Hitori", icon: "▦", blurb: "Shade out duplicates so no number repeats — and the rest stays joined." },
  { id: "skyscrapers", name: "Skyscrapers", icon: "🏙", blurb: "A Latin square of heights; each edge clue counts the buildings you can see." },
  { id: "hidato", name: "Hidato", icon: "🐍", blurb: "Fill 1…36 so consecutive numbers are always neighbours (diagonals count)." },
  { id: "akari", name: "Akari", icon: "🔦", blurb: "Place bulbs to light every square; numbers count adjacent bulbs." },
  { id: "kakuro", name: "Kakuro", icon: "➗", blurb: "Fill runs with distinct digits 1–9 that add up to each crossing clue." },
  { id: "suguru", name: "Suguru", icon: "🧩", blurb: "Fill each cage 1…size; no equal digits may touch, even diagonally." },
  { id: "starbattle", name: "Star Battle", icon: "⭐", blurb: "One star per row, column, and region — and no two may touch." },
  { id: "shikaku", name: "Shikaku", icon: "▭", blurb: "Cut the grid into rectangles, each holding one number = its area." },
  { id: "mosaic", name: "Mosaic", icon: "🖌", blurb: "Shade cells so every number equals the shaded count in its 3×3." },
  { id: "aquarium", name: "Aquarium", icon: "💧", blurb: "Flood the tanks so each row and column holds the clued amount of water." },
  { id: "kakurasu", name: "Kakurasu", icon: "➕", blurb: "Shade cells so each row and column hits its weighted-sum clue." },
  { id: "lightsout", name: "Lights Out", icon: "💡", blurb: "Tap to toggle crosses of lights — turn the whole board off." },
  { id: "slide", name: "15-Puzzle", icon: "🧩", blurb: "Slide the tiles through the gap to put them back in order." },
  { id: "mastermind", name: "Mastermind", icon: "🎯", blurb: "Crack the hidden 4-colour code from the black/white peg clues." },
  { id: "slitherlink", name: "Slitherlink", icon: "➰", blurb: "Draw one closed loop so every number has that many lines on its sides." },
  { id: "masyu", name: "Masyu", icon: "⚪", blurb: "One loop through every pearl — white runs straight, black turns." },
  { id: "nurikabe", name: "Nurikabe", icon: "🌊", blurb: "Shade a connected sea so each number is its own island of that size." },
];
