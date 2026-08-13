import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/global.css";
// Last import wins ties in the bundled CSS, and the mobile sheet has to override
// the per-page ones. Keep it below App and global.css.
import "./styles/responsive.css";

// PWA: offline cache + installability (public/sw.js). Production only, so dev
// never serves stale modules; the URL is base-relative for the Pages sub-path.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
  });
}

// Let the app portal (same origin, adervec.github.io) know this app is installed:
// a same-origin localStorage registry, no network. Only written when we're
// actually running as an installed app, never in a normal browser tab.
try {
  const modes = ["standalone", "minimal-ui", "fullscreen", "window-controls-overlay"];
  if (modes.some((m) => matchMedia(`(display-mode: ${m})`).matches)) {
    const key = "portal-installed";
    const reg: Record<string, number> = JSON.parse(localStorage.getItem(key) || "{}");
    reg["ChessRetabled"] = Date.now();
    localStorage.setItem(key, JSON.stringify(reg));
  }
} catch {}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter
      basename={import.meta.env.BASE_URL}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
