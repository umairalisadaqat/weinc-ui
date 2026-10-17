import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

// The rotating endings. The longest one sets the reserved box, so nothing below moves.
const PHRASES = ["a north-facing window.", "the shelf the cat ignores.", "people who forget to water."];
const HOLD_MS = 1700; // how long a finished phrase stays
const BASE_MS = 48; // typical gap between letters

// Human rhythm: a little jitter per letter, longer after spaces and punctuation.
function gapAfter(ch: string) {
  const jitter = BASE_MS + Math.random() * 70;
  if (ch === "," || ch === ";") return jitter + 260;
  if (ch === "-") return jitter + 120;
  if (ch === " ") return jitter + (Math.random() < 0.18 ? 240 : 40);
  return jitter;
}

export default function TypeAndDeletePhraseLoop() {
  const rootRef = useRef<HTMLElement>(null);
  const [text, setText] = useState(PHRASES[0]);
  const [typing, setTyping] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = rootRef.current;
    if (!el || reduce) {
      setText(PHRASES[0]);
      return;
    }
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
      let index = 0;
      await wait(900);
      while (alive) {
        const current = PHRASES[index];
        setTyping(true);
        for (let n = current.length; n >= 0 && alive; n--) {
          setText(current.slice(0, n));
          await wait(n > current.length - 4 ? 70 : 26);
        }
        index = (index + 1) % PHRASES.length;
        const next = PHRASES[index];
        await wait(380);
        for (let n = 1; n <= next.length && alive; n++) {
          setText(next.slice(0, n));
          await wait(gapAfter(next[n - 1]));
        }
        if (!alive) break;
        setTyping(false);
        await wait(HOLD_MS);
      }
    })();

    return () => {
      alive = false;
      window.clearTimeout(timer);
      io.disconnect();
    };
  }, [reduce]);

  return (
    <section ref={rootRef} className="tdl-root relative overflow-hidden px-4 py-20 sm:py-28">
      <style>{`
        .tdl-root { background: radial-gradient(120% 90% at 20% 0%, #1f3a2c 0%, #142a20 45%, #0e1f17 100%); }
        .tdl-h { font-family: "Iowan Old Style", Palatino, Georgia, serif; font-weight: 500; font-size: clamp(2.1rem, 6vw, 4rem); line-height: 1.12; color: #f2ecdc; letter-spacing: -0.01em; }
        .tdl-stack { display: grid; }
        .tdl-stack > * { grid-area: 1 / 1; }
        .tdl-ghost { visibility: hidden; }
        .tdl-typed { color: #c9dcb8; font-style: italic; }
        .tdl-caret { display: inline-block; width: 3px; height: 0.95em; margin-left: 3px; vertical-align: -0.08em; background: #c9dcb8; border-radius: 1px; animation: tdl-blink 1.05s steps(1) infinite; }
        [data-typing="true"] .tdl-caret { animation: none; }
        @keyframes tdl-blink { 0%, 55% { opacity: 1; } 56%, 100% { opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .tdl-caret { animation: none; } }
      `}</style>
      <div className="mx-auto max-w-3xl" data-typing={typing ? "true" : "false"}>
        <p className="text-sm font-medium tracking-wide text-[#b9cdb0]">Greenhouse No. 4, Ashby Road</p>
        <h1 className="tdl-h mt-5">
          <span className="sr-only">Plants for {PHRASES.join(", for ")}</span>
          <span aria-hidden="true">
            <span className="block">Plants for</span>
            <span className="tdl-stack">
              {PHRASES.map((p) => (
                <span key={p} className="tdl-ghost tdl-typed">{p}</span>
              ))}
              <span>
                <span className="tdl-typed">{text}</span>
                <span className="tdl-caret" />
              </span>
            </span>
          </span>
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-[#cfd8c8]">Tell us about the light in your room and we will pot up something that will still be thriving next spring.</p>
        <a href="#" className="mt-8 inline-flex h-11 items-center rounded-full bg-[#e9e2cc] px-6 text-sm font-semibold text-[#142a20] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9dcb8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#142a20]">Find my plant</a>
      </div>
    </section>
  );
}
