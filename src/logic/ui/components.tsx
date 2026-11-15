import type { ComponentType } from "react";
import { Sudoku } from "./Sudoku";
import { KenKen } from "./KenKen";
import { Futoshiki } from "./Futoshiki";
import { Nonogram } from "./Nonogram";
import { Binairo } from "./Binairo";
import { Hitori } from "./Hitori";
import { Skyscrapers } from "./Skyscrapers";
import { Hidato } from "./Hidato";
import { Akari } from "./Akari";
import { Kakuro } from "./Kakuro";
import { Suguru } from "./Suguru";
import { StarBattle } from "./StarBattle";
import { Shikaku } from "./Shikaku";
import { Mosaic } from "./Mosaic";
import { Aquarium } from "./Aquarium";
import { Kakurasu } from "./Kakurasu";
import { LightsOut } from "./LightsOut";
import { SlidePuzzle } from "./SlidePuzzle";
import { Mastermind } from "./Mastermind";
import { Slitherlink } from "./Slitherlink";
import { Masyu } from "./Masyu";
import { Nurikabe } from "./Nurikabe";
import { Bridges } from "./Bridges";
import { Tents } from "./Tents";
import { Numberlink } from "./Numberlink";

// id -> puzzle screen. Every puzzle takes the same single prop, which is what
// lets both the Logic Lab lobby and the daily challenge render any of them from
// an id alone instead of each keeping its own 25-line if-chain.
// Keys must match src/logic/registry.ts; validate-daily.mjs checks they do.

export type LogicPuzzleProps = { onExit: () => void };

export const LOGIC_COMPONENTS: Record<string, ComponentType<LogicPuzzleProps>> = {
  sudoku: Sudoku,
  kenken: KenKen,
  futoshiki: Futoshiki,
  nonogram: Nonogram,
  binairo: Binairo,
  hitori: Hitori,
  skyscrapers: Skyscrapers,
  hidato: Hidato,
  akari: Akari,
  kakuro: Kakuro,
  suguru: Suguru,
  starbattle: StarBattle,
  shikaku: Shikaku,
  mosaic: Mosaic,
  aquarium: Aquarium,
  kakurasu: Kakurasu,
  lightsout: LightsOut,
  slide: SlidePuzzle,
  mastermind: Mastermind,
  slitherlink: Slitherlink,
  masyu: Masyu,
  nurikabe: Nurikabe,
  bridges: Bridges,
  tents: Tents,
  numberlink: Numberlink,
};
