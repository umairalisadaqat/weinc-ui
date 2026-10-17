import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

// The command (28 characters, so steps(28) and --ttw-n: 28) and the lines it prints.
const COMMAND = "shop deploy --env production";
const OUTPUT = [
  { cls: "ttw-dim", text: "  Building 18 pages and 42 images" },
  { cls: "ttw-dim", text: "  Compressing photos for phones" },
  { cls: "ttw-dim", text: "  Checking every link on the site" },
  { cls: "ttw-ok", text: "  Live at fernandfig.shop" },
];

export default function TerminalCommandTypewriter() {
  const rootRef = useRef<HTMLElement>(null);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setPaused(!entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={rootRef} data-paused={paused ? "true" : "false"} data-still={reduce ? "true" : "false"} className="ttw-root" style={{ ["--ttw-n" as string]: COMMAND.length, ["--ttw-cycle" as string]: "9s" }}>
      <style>{`
    .ttw-root { background: #e9ecef; padding: 80px 16px; font-family: ui-sans-serif, system-ui, sans-serif; }
    .ttw-root * { box-sizing: border-box; }
    .ttw-win { max-width: 40rem; margin: 0 auto; border-radius: 14px; background: #1b1e22; box-shadow: 0 1px 0 rgba(255,255,255,0.06) inset, 0 30px 60px -30px rgba(15,20,25,0.55), 0 12px 24px -12px rgba(15,20,25,0.35); overflow: hidden; }
    .ttw-bar { display: flex; align-items: center; gap: 8px; height: 40px; padding: 0 16px; background: #24282d; border-bottom: 1px solid #30353b; }
    .ttw-dot { width: 11px; height: 11px; border-radius: 50%; background: #4a5058; }
    .ttw-title { flex: 1; text-align: center; margin-right: 46px; font-size: 12px; color: #a3abb4; }
    .ttw-body { padding: 22px 16px 26px; font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; font-size: clamp(11px, 2.9vw, 15.5px); line-height: 1.75; color: #e4e4df; white-space: nowrap; }
    .ttw-p { color: #93c3a3; }
    .ttw-dim { color: #a3abb4; }
    .ttw-ok { color: #93c3a3; }
    .ttw-cmd { display: inline-block; overflow: hidden; vertical-align: bottom; width: calc(var(--ttw-n) * 1ch); animation: ttw-type var(--ttw-cycle) infinite; animation-delay: -2.2s; }
    .ttw-caret { display: inline-block; width: 0.6ch; height: 1.15em; vertical-align: -0.2em; background: #e4e4df; animation: ttw-blink 1s steps(1) infinite; }
    .ttw-out { opacity: 0; animation: var(--ttw-cycle) infinite; animation-delay: -2.2s; }
    .ttw-o1 { animation-name: ttw-o1; } .ttw-o2 { animation-name: ttw-o2; } .ttw-o3 { animation-name: ttw-o3; } .ttw-o4 { animation-name: ttw-o4; }
    @keyframes ttw-type { 0% { width: 0; animation-timing-function: steps(28, end); } 22%, 94% { width: calc(var(--ttw-n) * 1ch); } 95%, 100% { width: 0; } }
    @keyframes ttw-o1 { 0%, 27% { opacity: 0; } 28%, 93% { opacity: 1; } 95%, 100% { opacity: 0; } }
    @keyframes ttw-o2 { 0%, 35% { opacity: 0; } 36%, 93% { opacity: 1; } 95%, 100% { opacity: 0; } }
    @keyframes ttw-o3 { 0%, 45% { opacity: 0; } 46%, 93% { opacity: 1; } 95%, 100% { opacity: 0; } }
    @keyframes ttw-o4 { 0%, 55% { opacity: 0; } 56.5%, 93% { opacity: 1; } 95%, 100% { opacity: 0; } }
    @keyframes ttw-blink { 0%, 55% { opacity: 1; } 56%, 100% { opacity: 0; } }
    .ttw-root[data-paused="true"] .ttw-cmd, .ttw-root[data-paused="true"] .ttw-out, .ttw-root[data-paused="true"] .ttw-caret { animation-play-state: paused; }
    .ttw-copy { max-width: 40rem; margin: 22px auto 0; text-align: center; font-size: 15px; color: #475569; }
        .ttw-root[data-still="true"] .ttw-cmd, .ttw-root[data-still="true"] .ttw-caret { animation: none; }
        .ttw-root[data-still="true"] .ttw-out { animation: none; opacity: 1; }
        @media (prefers-reduced-motion: reduce) { .ttw-cmd, .ttw-caret { animation: none; } .ttw-out { animation: none; opacity: 1; } }
      `}</style>
      <h2 className="sr-only">Deploying the Fern and Fig shop</h2>
      <p className="sr-only">Command: {COMMAND}. Output: {OUTPUT.map((l) => l.text.trim()).join(". ")}.</p>
      <div className="ttw-win" aria-hidden="true">
        <div className="ttw-bar">
          <span className="ttw-dot" />
          <span className="ttw-dot" />
          <span className="ttw-dot" />
          <span className="ttw-title">fern-and-fig: zsh</span>
        </div>
        <div className="ttw-body">
          <div>
            <span className="ttw-p">~/fern-and-fig $ </span>
            <span className="ttw-cmd">{COMMAND}</span>
            <span className="ttw-caret" />
          </div>
          {OUTPUT.map((l, k) => (
            <div key={k} className={`ttw-out ttw-o${k + 1} ${l.cls}`}>{k === OUTPUT.length - 1 ? "✓" : "›"}{l.text}</div>
          ))}
        </div>
      </div>
      <p className="ttw-copy">Pure CSS: the command types with steps(), and each line of output fades in on its own beat.</p>
    </section>
  );
}
