import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

// The fixed start of the headline and the words that get swapped in.
// A word with a "typo" is typed wrong first, then corrected with the backspace key.
const LEAD = "Sourdough, baked before";
const WORDS = [
  { word: "sunrise.", typo: "sunrsie" },
  { word: "the school run.", typo: "" },
  { word: "you wake up.", typo: "" },
];

export default function RetypedWordHeadline() {
  const rootRef = useRef<HTMLElement>(null);
  const [word, setWord] = useState(WORDS[WORDS.length - 1].word);
  const [selected, setSelected] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = rootRef.current;
    if (!el || reduce) { setWord(WORDS[WORDS.length - 1].word); setSelected(false); return; }
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
    const typeOut = async (from: string, to: string) => {
      for (let n = from.length + 1; n <= to.length && alive; n++) {
        setWord(to.slice(0, n));
        await wait(60 + Math.random() * 70);
      }
    };
    (async () => {
      let i = WORDS.length - 1;
      await wait(700);
      while (alive) {
        setSelected(true);
        await wait(520);
        setSelected(false);
        setWord("");
        await wait(180);
        i = (i + 1) % WORDS.length;
        const { word: w, typo } = WORDS[i];
        if (typo) {
          await typeOut("", typo);
          await wait(420);
          let keep = 0;
          while (keep < typo.length && typo[keep] === w[keep]) keep++;
          for (let n = typo.length - 1; n >= keep && alive; n--) { setWord(typo.slice(0, n)); await wait(90); }
          await wait(160);
          await typeOut(w.slice(0, keep), w);
        } else {
          await typeOut("", w);
        }
        await wait(1900);
      }
    })();
    return () => { alive = false; window.clearTimeout(timer); io.disconnect(); };
  }, [reduce]);

  return (
    <section ref={rootRef} className="rwh-root px-4 py-20 sm:py-28">
      <style>{`
        .rwh-root { background: radial-gradient(130% 100% at 80% 0%, #f6eddc 0%, #efe3cc 55%, #e6d6ba 100%); }
        .rwh-h { font-family: "Iowan Old Style", Palatino, Georgia, serif; font-weight: 600; font-size: clamp(2.2rem, 6.4vw, 4.6rem); line-height: 1.06; letter-spacing: -0.02em; color: #2d241a; }
        .rwh-stack { display: grid; }
        .rwh-stack > * { grid-area: 1 / 1; }
        .rwh-ghost { visibility: hidden; }
        .rwh-word { color: #8a4a1f; border-radius: 4px; transition: background-color 120ms; }
        .rwh-word[data-sel="true"] { background: #e3c39c; }
        .rwh-caret { display: inline-block; width: 3px; height: 0.9em; margin-left: 2px; vertical-align: -0.06em; background: #8a4a1f; animation: rwh-blink 1.05s steps(1) infinite; }
        @keyframes rwh-blink { 0%, 55% { opacity: 1; } 56%, 100% { opacity: 0; } }
        @media (prefers-reduced-motion: reduce) { .rwh-caret { animation: none; } .rwh-word { transition: none; } }
      `}</style>
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#6b4a2a]">Crumb &amp; Kiln</p>
        <h1 className="rwh-h mt-5">
          <span className="sr-only">{LEAD} sunrise, before the school run, before you wake up.</span>
          <span aria-hidden="true" className="rwh-stack">
            {WORDS.map((w) => (
              <span key={w.word} className="rwh-ghost">{LEAD} <span>{w.word}</span>&nbsp;</span>
            ))}
            <span>
              {LEAD} <span className="rwh-word" data-sel={selected ? "true" : "false"}>{word}</span>
              <span className="rwh-caret" />
            </span>
          </span>
        </h1>
        <p className="mt-6 max-w-lg text-base leading-relaxed text-[#4f3d2b]">Long-fermented loaves from a wood-fired oven on Mill Row. Collect warm from seven, or have them left on your step.</p>
        <a href="#" className="mt-8 inline-flex h-11 items-center rounded-lg bg-[#2d241a] px-6 text-sm font-semibold text-[#f6eddc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8a4a1f] focus-visible:ring-offset-2">Reserve a loaf</a>
      </div>
    </section>
  );
}
