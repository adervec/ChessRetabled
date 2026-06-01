import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { NavBar } from "./components/ui/NavBar";
import { useProgress } from "./state/useProgress";
import { Home } from "./pages/Home";
import { Play } from "./pages/Play";
import { Puzzles } from "./pages/Puzzles";
import { Learn } from "./pages/Learn";
import { LessonPlayer } from "./pages/LessonPlayer";
import { Practice } from "./pages/Practice";
import { Profile } from "./pages/Profile";

export default function App() {
  const touchDay = useProgress((s) => s.touchDay);
  useEffect(() => {
    touchDay();
  }, [touchDay]);

  return (
    <div className="app-shell">
      <NavBar />
      <main className="grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/play" element={<Play />} />
          <Route path="/puzzles" element={<Puzzles />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/learn/:courseId/:lessonId" element={<LessonPlayer />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
