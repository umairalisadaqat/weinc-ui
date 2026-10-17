import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

// The letter. Line breaks are kept; each new line gets a carriage-return pause.
const LETTER = "Dear Mrs. Okafor,\n\nYour armchair is ready. We kept the original springs and covered it in the moss wool you chose in March.\n\nCollect it any weekday after ten, or we can bring it round on Saturday.\n\nWith thanks,\nRuth Hale";
const START_AT = Math.floor(LETTER.length * 0.5); // begins part-way so the page is never blank

// Same seed every time, so the ink looks uneven but never flickers between renders.
function ink(i: number) {
  const a = Math.sin(i * 12.9898) * 43758.5453;
  const b = Math.sin(i * 78.233) * 12543.1;
  const h1 = a - Math.floor(a);
  const h2 = b - Math.floor(b);
  return { opacity: 0.72 + h1 * 0.28, top: `${((h2 - 0.5) * 0.9).toFixed(2)}px` };
}

function gapAfter(ch: string) {
  if (ch === "\n") return 430;
  if (ch === "." || ch === ",") return 210 + Math.random() * 120;
  if (ch === " ") return 70 + Math.random() * 60;
  return 30 + Math.random() * 40;
}

export default function TypewrittenLetter() {
  const rootRef = useRef<HTMLElement>(null);
  const [count, setCount] = useState(START_AT);
  const [fade, setFade] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = rootRef.current;
    if (!el || reduce) { setCount(LETTER.length); return; }
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
        while (n < LETTER.length && alive) {
          await wait(gapAfter(LETTER[n - 1] ?? ""));
          n++;
          setCount(n);
        }
        await wait(3600);
        setFade(true);
        await wait(700);
        n = 0;
        setCount(0);
        setFade(false);
        await wait(500);
      }
    })();
    return () => { alive = false; window.clearTimeout(timer); io.disconnect(); };
  }, [reduce]);

  return (
    <section ref={rootRef} className="twl-root px-4 py-16 sm:py-20">
      <style>{`
        .twl-root { background: radial-gradient(120% 80% at 50% 0%, #46525a 0%, #2f383e 60%, #262d32 100%); }
        .twl-paper { position: relative; max-width: 36rem; margin: 0 auto; padding: 44px clamp(22px, 6vw, 56px) 52px; border-radius: 3px; color: #1f1b17;
          background: linear-gradient(180deg, rgba(0,0,0,0) 48.6%, rgba(90,70,40,0.07) 49.8%, rgba(255,255,255,0.35) 50.4%, rgba(0,0,0,0) 51.5%), linear-gradient(170deg, #fbf6ea 0%, #f4ecdb 100%);
          box-shadow: 0 1px 1px rgba(0,0,0,0.2), 0 24px 50px -20px rgba(0,0,0,0.6), 0 8px 18px -8px rgba(0,0,0,0.35); }
        .twl-head { font-family: Georgia, serif; font-size: 13px; letter-spacing: 0.16em; text-transform: uppercase; color: #5a4632; border-bottom: 1px solid rgba(90,70,50,0.25); padding-bottom: 14px; margin: 0 0 26px; }
        .twl-type { font-family: "American Typewriter", "Courier Prime", "Courier New", Courier, monospace; font-size: clamp(14px, 3.6vw, 17px); line-height: 1.7; white-space: pre-wrap; overflow-wrap: break-word; }
        .twl-stack { display: grid; }
        .twl-stack > * { grid-area: 1 / 1; }
        .twl-ghost { visibility: hidden; }
        .twl-live { transition: opacity 600ms ease; }
        .twl-live[data-fade="true"] { opacity: 0; }
        .twl-ch { position: relative; text-shadow: 0 0 0.6px rgba(31,27,23,0.55); }
        .twl-caret { display: inline-block; width: 0.55em; height: 2px; vertical-align: -0.2em; background: #1f1b17; opacity: 0.8; animation: twl-blink 0.9s steps(1) infinite; }
        @keyframes twl-blink { 0%, 55% { opacity: 0.8; } 56%, 100% { opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .twl-caret { animation: none; } .twl-live { transition: none; } }
      `}</style>
      <article className="twl-paper">
        <h2 className="twl-head">Hale &amp; Daughter Upholstery</h2>
        <p className="sr-only">{LETTER.replace(/\n+/g, " ")}</p>
        <div className="twl-type twl-stack" aria-hidden="true">
          <div className="twl-ghost">{LETTER}</div>
          <div className="twl-live" data-fade={fade ? "true" : "false"}>
            {[...LETTER.slice(0, count)].map((ch, i) => (
              <span key={i} className="twl-ch" style={ink(i)}>{ch}</span>
            ))}
            <span className="twl-caret" />
          </div>
        </div>
      </article>
    </section>
  );
}
