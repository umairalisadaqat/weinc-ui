import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { RotateCcw } from "lucide-react";

// The sentence that decodes, and the quiet characters it passes through.
const HEADLINE = "Every coastline, decoded by hand.";
const CALM = "·:-=~+/.";
const STEP_MS = 34; // delay between one letter settling and the next
const FLICKER_MS = 70; // how often an unsettled slot changes character
const HOLD_MS = 5200; // how long the finished line rests before decoding again

// Word boundaries, so a scrambled "-" or "/" can never open a new line break.
const WORDS = HEADLINE.split(" ").reduce<{ start: number; len: number }[]>((acc, word) => {
  const prev = acc[acc.length - 1];
  return [...acc, { start: prev ? prev.start + prev.len + 1 : 0, len: word.length }];
}, []);

type Slot = { ch: string; done: boolean };

const settled = (): Slot[] => [...HEADLINE].map((ch) => ({ ch, done: true }));
const pick = () => CALM[Math.floor(Math.random() * CALM.length)];

export default function CalmLetterDecodeScrambleTextReveal() {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const [slots, setSlots] = useState<Slot[]>(() =>
    [...HEADLINE].map((ch) => ({ ch: ch === " " ? " " : pick(), done: ch === " " })),
  );
  const [run, setRun] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduce) {
      setSlots(settled());
      return;
    }
    if (!visible) return;
    let start = performance.now();
    const timer = window.setInterval(() => {
      const t = performance.now() - start;
      const end = 160 + HEADLINE.length * STEP_MS;
      if (t > end + HOLD_MS) start = performance.now();
      setSlots(
        [...HEADLINE].map((ch, i) => {
          const done = ch === " " || t > 160 + i * STEP_MS;
          return { ch: done ? ch : pick(), done };
        }),
      );
    }, FLICKER_MS);
    return () => window.clearInterval(timer);
  }, [reduce, visible, run]);

  return (
    <section ref={rootRef} className="lds-root relative overflow-hidden px-5 py-20 sm:px-10 sm:py-28">
      <style>{`
        .lds-root { background: radial-gradient(120% 90% at 20% 0%, #16302f 0%, #0d1a1c 55%, #0a1315 100%); color: #efe6d2; }
        .lds-grain { position: absolute; inset: 0; opacity: .5; pointer-events: none;
          background-image: radial-gradient(rgba(239,230,210,.05) 1px, transparent 1px); background-size: 3px 3px; }
        .lds-stack { display: grid; }
        .lds-stack > * { grid-area: 1 / 1; }
        .lds-line { font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace; font-weight: 600;
          font-size: clamp(1.7rem, 5.4vw, 3.6rem); line-height: 1.15; letter-spacing: -.01em; }
        .lds-ghost { visibility: hidden; }
        .lds-ch { transition: color .35s ease, opacity .35s ease; }
        .lds-ch[data-done="false"] { color: #7fa39c; opacity: .55; }
        .lds-ch[data-done="true"] { color: #efe6d2; }
        @keyframes lds-caret { 50% { opacity: 0 } }
        .lds-caret { display: inline-block; width: .5ch; height: .9em; margin-left: .15ch; vertical-align: -.08em;
          background: #d9a45b; animation: lds-caret 1.1s steps(1) infinite; }
        @media (prefers-reduced-motion: reduce) { .lds-caret { animation: none; } .lds-ch { transition: none; } }
      `}</style>
      <div className="lds-grain" aria-hidden="true" />
      <div className="relative mx-auto max-w-4xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#d9a45b]">Tidewater Map Archive</p>
        <h1 className="lds-line mt-5">
          <span className="sr-only">{HEADLINE}</span>
          <span className="lds-stack" aria-hidden="true">
            <span className="lds-ghost">{HEADLINE}<span className="lds-caret" /></span>
            <span>
              {WORDS.map(({ start, len }, w) => (
                <span key={w}>
                  {w > 0 && " "}
                  <span className="whitespace-nowrap">
                    {slots.slice(start, start + len).map((s, i) => (
                      <span key={i} className="lds-ch" data-done={s.done}>{s.ch}</span>
                    ))}
                  </span>
                </span>
              ))}
              <span className="lds-caret" />
            </span>
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-[#c9c2b0] sm:text-lg">
          Four hundred hand-drawn charts of the northern shore, scanned at full size and transcribed line by line.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <a href="#" className="inline-flex min-h-[44px] items-center rounded-full bg-[#efe6d2] px-6 text-sm font-semibold text-[#0d1a1c] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9a45b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1a1c]">
            Browse the charts
          </a>
          <button
            type="button"
            onClick={() => setRun((n) => n + 1)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 text-sm font-medium text-[#c9c2b0] transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9a45b]"
          >
            <RotateCcw aria-hidden="true" className="h-4 w-4" /> Replay
          </button>
        </div>
      </div>
    </section>
  );
}
