import { useEffect, useRef } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { NavBar } from "./components/ui/NavBar";
import { useProgress } from "./state/useProgress";
import { useSettings, ANIM_MS } from "./state/useSettings";
import { resolveLayout } from "./state/orientation";
import { useActiveGameStore } from "./state/activeGame";
import { applyCloudConfig } from "./state/cloudConfig";
import { installUiSfx } from "./state/sfx";
import { Home } from "./pages/Home";
import { Play } from "./pages/Play";
import { Arcade } from "./pages/Arcade";
import { Simul } from "./pages/Simul";
import { Cards } from "./pages/Cards";
import { Logic } from "./pages/Logic";
import { Puzzles } from "./pages/Puzzles";
import { LessonPlayer } from "./pages/LessonPlayer";
import { Academy } from "./pages/Academy";
import { Practice } from "./pages/Practice";
import { Dashboard } from "./pages/Dashboard";
import { Coach } from "./pages/Coach";
import { Review } from "./pages/Review";
import { SessionBar } from "./components/ui/SessionBar";
import { Guide, GuideEntry } from "./pages/Guide";
import { Profile } from "./pages/Profile";

export default function App() {
  const touchDay = useProgress((s) => s.touchDay);
  const theme = useSettings((s) => s.theme);
  const animSpeed = useSettings((s) => s.animSpeed);
  const orientation = useSettings((s) => s.orientation);
  const gameOrientation = useSettings((s) => s.gameOrientation);
  const activeGame = useActiveGameStore((s) => s.id);
  const loc = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    touchDay();
    // Install the cloud SyncAdapter the persisted config resolves to (local
    // mirror unless the user opted into + consented to a cloud provider).
    applyCloudConfig();
    // One delegated listener gives every button/chip/link its click cue.
    return installUiSfx();
  }, [touchDay]);

  // Reflect presentation settings onto the document so CSS can react globally.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.setProperty("--anim-dur", `${ANIM_MS[animSpeed]}ms`);
  }, [theme, animSpeed]);

  // One place decides the layout, so nothing fights over the attribute: the
  // game's own pin, then the app-wide setting, then the game's logical default,
  // and only with no game open at all, the device.
  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia("(orientation: landscape)");
    const apply = () => {
      root.dataset.orient = resolveLayout({
        gameId: activeGame,
        perGame: gameOrientation,
        global: orientation,
        deviceIsLandscape: mq.matches,
      });
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [activeGame, gameOrientation, orientation]);

  // The scroll lives on <main> now, so arriving at a new page has to reset it —
  // the document scroll that used to do this for free is pinned.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [loc.pathname]);

  return (
    <div className="app-shell">
      <NavBar />
      <main className="grow" ref={mainRef}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/play" element={<Play />} />
          <Route path="/games" element={<Arcade />} />
          <Route path="/simul" element={<Simul />} />
          <Route path="/cards" element={<Cards />} />
          <Route path="/logic" element={<Logic />} />
          <Route path="/puzzles" element={<Puzzles />} />
          {/* Learn folded into the Academy — one place to be taught anything. */}
          <Route path="/learn" element={<Navigate to="/academy" replace />} />
          <Route path="/learn/:courseId/:lessonId" element={<LessonPlayer />} />
          <Route path="/academy" element={<Academy />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/coach" element={<Coach />} />
          <Route path="/review" element={<Review />} />
          <Route path="/guide" element={<Guide />} />
          <Route path="/guide/:id" element={<GuideEntry />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <SessionBar />
    </div>
  );
}
