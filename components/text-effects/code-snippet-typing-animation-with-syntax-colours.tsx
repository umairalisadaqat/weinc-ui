import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

// The snippet as coloured tokens: c comment, k keyword, f function, v name, s string, p punctuation, n new line, t indent.
const TOKENS: [string, string][] = [["c", "// Opening hours for the shop footer"], ["n", "\n"], ["k", "export function "], ["f", "hoursFor"], ["p", "(day) {"], ["n", "\n"], ["t", "  "], ["k", "const "], ["v", "week"], ["p", " = { "], ["v", "sat"], ["p", ": "], ["s", "\"9-4\""], ["p", ", "], ["v", "sun"], ["p", ": "], ["s", "\"shut\""], ["p", " };"], ["n", "\n"], ["t", "  "], ["k", "return "], ["v", "week"], ["p", "[day] ?? "], ["s", "\"8-6\""], ["p", ";"], ["n", "\n"], ["p", "}"], ["n", "\n"], ["n", "\n"], ["v", "footer"], ["p", "."], ["f", "textContent"], ["p", " = "], ["f", "hoursFor"], ["p", "("], ["s", "\"sat\""], ["p", ");"]];
const FULL = TOKENS.map(([, t]) => t).join("");
const LINES = FULL.split("\n").length;
const START_AT = Math.floor(FULL.length * 0.55); // begins part-way so the editor is never empty

// Cut the token list after n characters, keeping each piece's colour.
function slice(n: number) {
  const out: [string, string][] = [];
  let left = n;
  for (const [kind, text] of TOKENS) {
    if (left <= 0) break;
    out.push([kind, text.slice(0, left)]);
    left -= text.length;
  }
  return out;
}

function gapAfter(ch: string) {
  if (ch === "\n") return 260;
  if (ch === " ") return 40 + Math.random() * 50;
  if ("({;".includes(ch)) return 120 + Math.random() * 80;
  return 22 + Math.random() * 30;
}

export default function CodeSnippetTyping() {
  const rootRef = useRef<HTMLElement>(null);
  const [count, setCount] = useState(START_AT);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = rootRef.current;
    if (!el || reduce) { setCount(FULL.length); return; }
    let alive = true;
    let visible = true;
    let timer = 0;
    let resume: null | (() => void) = null;
    const wait = (ms: number) =>
      new Promise<void>((done) => {
        const go = () => { timer = window.setTimeout(done, ms); };
        if (visible) go();
        else resume = go;
      });
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && resume) { const r = resume; resume = null; r(); }
    });
    io.observe(el);
    (async () => {
      let n = START_AT;
      while (alive) {
        while (n < FULL.length && alive) { await wait(gapAfter(FULL[n - 1] ?? "")); n++; setCount(n); }
        await wait(3200);
        n = 0;
        setCount(0);
        await wait(600);
      }
    })();
    return () => { alive = false; window.clearTimeout(timer); io.disconnect(); };
  }, [reduce]);

  return (
    <section ref={rootRef} className="cst-root px-4 py-16 sm:py-24">
      <style>{`
        .cst-root { background: linear-gradient(180deg, #0d1219 0%, #111a24 100%); }
        .cst-win { max-width: 44rem; margin: 0 auto; border-radius: 12px; background: #151c25; border: 1px solid #243040; box-shadow: 0 30px 70px -30px rgba(0,0,0,0.7); overflow: hidden; }
        .cst-tab { display: flex; align-items: center; gap: 10px; height: 40px; padding: 0 16px; background: #10161e; border-bottom: 1px solid #243040; font-size: 12px; color: #9aa7b6; }
        .cst-tab b { font-weight: 500; color: #d7dde5; }
        .cst-code { display: grid; grid-template-columns: auto 1fr; gap: 0 16px; padding: 20px 16px 24px; font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; font-size: clamp(10.5px, 2.8vw, 15px); line-height: 1.75; }
        .cst-nums { color: #5d6b7c; text-align: right; user-select: none; white-space: pre; }
        .cst-stack { display: grid; min-width: 0; overflow-x: auto; }
        .cst-stack > * { grid-area: 1 / 1; white-space: pre; }
        .cst-ghost { visibility: hidden; }
        .cst-c { color: #8996a5; font-style: italic; } .cst-k { color: #d8a26a; } .cst-f { color: #85b6dc; } .cst-v { color: #e2d6bf; } .cst-s { color: #a3c79a; } .cst-p { color: #b6c0cc; } .cst-t { color: inherit; }
        .cst-caret { display: inline-block; width: 2px; height: 1.2em; vertical-align: -0.25em; background: #e8b77a; animation: cst-blink 1s steps(1) infinite; }
        @keyframes cst-blink { 0%, 55% { opacity: 1; } 56%, 100% { opacity: 0; } }
        .cst-note { max-width: 44rem; margin: 18px auto 0; text-align: center; font-size: 14px; color: #a9b4c1; }
        @media (prefers-reduced-motion: reduce) { .cst-caret { animation: none; } }
      `}</style>
      <h2 className="sr-only">Code example: opening hours function</h2>
      <pre className="sr-only">{FULL}</pre>
      <div className="cst-win" aria-hidden="true">
        <div className="cst-tab"><b>hours.js</b><span>footer helpers</span></div>
        <div className="cst-code">
          <div className="cst-nums">{Array.from({ length: LINES }, (_, i) => i + 1).join("\n")}</div>
          <div className="cst-stack">
            <div className="cst-ghost">{FULL}</div>
            <div>
              {slice(count).map(([kind, text], i) => (
                <span key={i} className={`cst-${kind}`}>{text}</span>
              ))}
              <span className="cst-caret" />
            </div>
          </div>
        </div>
      </div>
      <p className="cst-note">Each token keeps its colour while it is being typed.</p>
    </section>
  );
}
