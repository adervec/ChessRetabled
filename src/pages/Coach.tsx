import { useMemo, useRef, useState } from "react";
import { useArchive } from "../state/useArchive";
import { useProgress, useLevel } from "../state/useProgress";
import { buildDashboard } from "../state/stats";
import { deriveArchetype } from "../state/archetype";
import { buildCoachBrief } from "../state/coach";
import "./Coach.css";

// Direct browser call to the Anthropic Messages API with the user's own key —
// no server, no SDK. The dedicated CORS header below is Anthropic's supported
// opt-in for exactly this bring-your-own-key, client-side pattern.
const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-5";

const COACH_SYSTEM = `You are the resident coach of ChessRetabled, a games club
app: chess vs bots, tactics puzzles, lessons, endgame drills, plus the board
games, card games, and logic puzzles catalogued in the player's brief below.
Coach the player: be encouraging but honest, ground every observation in the
brief, and when you recommend training, name specific modes/games/difficulties
that exist in the app. Keep answers compact and practical.`;

type ChatMsg = { role: "user" | "assistant"; content: string };

const STARTERS = [
  "Assess my play — strengths and weaknesses?",
  "Build me a two-week training plan.",
  "What should I try next, and why?",
];

export function Coach() {
  const records = useArchive((a) => a.records);
  const progress = useProgress();
  const { level } = useLevel();

  const { brief, arch } = useMemo(() => {
    const d = buildDashboard(records);
    const arch = deriveArchetype(d);
    const brief = buildCoachBrief(
      d,
      arch,
      {
        level,
        xp: progress.xp,
        puzzleRating: progress.puzzle.rating,
        puzzlesSolved: progress.puzzle.solved,
        dayStreak: progress.streak.count,
        botRecord: {
          won: progress.games.won,
          drawn: progress.games.drawn,
          lost: progress.games.lost,
        },
      },
      new Date().toISOString()
    );
    return { brief, arch };
  }, [records, progress, level]);

  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(brief);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([brief], { type: "text/markdown" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `chessretabled-brief-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---- live chat (bring your own Anthropic API key; key stays in memory) ----
  const [apiKey, setApiKey] = useState("");
  const [consent, setConsent] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const canSend = consent && apiKey.trim().length > 0 && !busy;

  const send = async (text: string) => {
    const msg = text.trim();
    if (!msg || !canSend) return;
    setError(null);
    const next: ChatMsg[] = [...messages, { role: "user", content: msg }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey.trim(),
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1500,
          system: `${COACH_SYSTEM}\n\n---\n\n${brief}`,
          messages: next,
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`API error ${res.status}${body ? ` — ${body.slice(0, 200)}` : ""}`);
      }
      const data = (await res.json()) as {
        content?: { type: string; text?: string }[];
      };
      const reply =
        data.content
          ?.filter((b) => b.type === "text" && b.text)
          .map((b) => b.text)
          .join("") ?? "";
      setMessages([...next, { role: "assistant", content: reply || "(empty reply)" }]);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <h1 className="toon-title">AI Coach</h1>
      <p className="coach__intro text-dim">
        Your play, packaged for a coach. Take the brief to Claude, Cowork, or any
        AI assistant — or plug in your own Anthropic API key and chat right here.
        Everything is generated from data already on this device.
      </p>

      <section className="coach__section">
        <div className="coach__head">
          <h2 className="dash__h2">
            {arch.icon} Coaching brief · <span className="coach__arch">{arch.name}</span>
          </h2>
          <div className="coach__actions">
            <button className="btn btn--sm btn--mint" onClick={copy}>
              {copied ? "✓ Copied" : "📋 Copy"}
            </button>
            <button className="btn btn--sm" onClick={download}>
              ⬇ Download .md
            </button>
          </div>
        </div>
        <pre className="coach__brief scroll-y">{brief}</pre>
        <p className="text-muted coach__hintline">
          Tip: paste a fresh brief into the same AI conversation every week or two
          — ask it to compare briefs and it becomes your progress tracker.
        </p>
      </section>

      <section className="coach__section">
        <h2 className="dash__h2">💬 Live coaching</h2>
        <p className="text-dim coach__chat-sub">
          Bring your own Anthropic API key. The key is held in memory only —
          never saved — and your brief is sent to Anthropic only when you send a
          message.
        </p>

        <div className="coach__keyrow">
          <input
            className="coach__key"
            type="password"
            placeholder="sk-ant-… (your Anthropic API key)"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            autoComplete="off"
          />
          <label className="coach__consent">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            Send my stats brief to Anthropic's API when I chat
          </label>
        </div>

        {messages.length === 0 && (
          <div className="coach__starters">
            {STARTERS.map((s) => (
              <button
                key={s}
                className="chip-btn"
                disabled={!canSend}
                onClick={() => send(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.length > 0 && (
          <div className="coach__chat">
            {messages.map((m, i) => (
              <div key={i} className={"coach__msg coach__msg--" + m.role}>
                {m.content}
              </div>
            ))}
            {busy && <div className="coach__msg coach__msg--assistant">…</div>}
            <div ref={chatEndRef} />
          </div>
        )}

        {error && <div className="coach__error">⚠ {error}</div>}

        <form
          className="coach__inputrow"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <input
            className="coach__input"
            placeholder={canSend ? "Ask your coach…" : "Enter a key and tick consent to chat"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!canSend}
          />
          <button className="btn btn--violet" type="submit" disabled={!canSend || !input.trim()}>
            Send
          </button>
        </form>
      </section>
    </div>
  );
}
