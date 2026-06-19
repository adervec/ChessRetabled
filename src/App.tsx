import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { NavBar } from "./components/ui/NavBar";
import { useProgress } from "./state/useProgress";
import { useSettings, ANIM_MS } from "./state/useSettings";
import { Home } from "./pages/Home";
import { Play } from "./pages/Play";
import { Arcade } from "./pages/Arcade";
import { Simul } from "./pages/Simul";
import { Cards } from "./pages/Cards";
import { Logic } from "./pages/Logic";
import { Puzzles } from "./pages/Puzzles";
import { Learn } from "./pages/Learn";
import { LessonPlayer } from "./pages/LessonPlayer";
import { Academy } from "./pages/Academy";
import { Practice } from "./pages/Practice";
import { Dashboard } from "./pages/Dashboard";
import { Profile } from "./pages/Profile";

export default function App() {
  const touchDay = useProgress((s) => s.touchDay);
  const theme = useSettings((s) => s.theme);
  const animSpeed = useSettings((s) => s.animSpeed);

  useEffect(() => {
    touchDay();
  }, [touchDay]);

  // Reflect presentation settings onto the document so CSS can react globally.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.setProperty("--anim-dur", `${ANIM_MS[animSpeed]}ms`);
  }, [theme, animSpeed]);

  return (
    <div className="app-shell">
      <NavBar />
      <main className="grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/play" element={<Play />} />
          <Route path="/games" element={<Arcade />} />
          <Route path="/simul" element={<Simul />} />
          <Route path="/cards" element={<Cards />} />
          <Route path="/logic" element={<Logic />} />
          <Route path="/puzzles" element={<Puzzles />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/learn/:courseId/:lessonId" element={<LessonPlayer />} />
          <Route path="/academy" element={<Academy />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
