import { useEffect, useRef, useState } from "react";

const PHRASES = ["heritage wheat.", "whole spelt.", "dark rye."]; // keep them short; the longest sets the width
const LABELS = ["Wheat", "Spelt", "Rye"];
const GLYPHS = "abcdefghkmnprstuvwxyz#/+=";
const STEP = 42; // ms between one letter settling and the next
const LEAD = 180; // ms of noise before the first letter settles
const HOLD = 3600; // ms each phrase rests before the next one
const W = Math.max(...PHRASES.map((p) => p.length));
const pad = (s: string) => s.padEnd(W, " ");

export default function RotatingHeadlineScramblesBetweenThreePhrases() {
  const root = useRef<HTMLElement>(null);
  const out = useRef<HTMLSpanElement>(null);
  const goRef = useRef<(n: number, manual?: boolean) => void>(() => {});
  const [cur, setCur] = useState(0);

  useEffect(() => {
    const el = root.current;
    const o = out.current;
    if (!el || !o) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let n = 0;
    let f = 0;
    let timer = 0;
    let auto = true;
    let on = false;
    const go = (next: number, manual = false) => {
      if (manual) auto = false;
      n = next;
      setCur(next);
      cancelAnimationFrame(f);
      clearTimeout(timer);
      if (reduce) { o.textContent = PHRASES[next]; return; }
      const to = pad(PHRASES[next]);
      const from = pad(o.textContent || "");
      const t0 = performance.now();
      const frame = (now: number) => {
        const t = now - t0;
        let s = "";
        let done = true;
        for (let i = 0; i < W; i++) {
          if (t > LEAD + i * STEP) s += to[i];
          else {
            done = false;
            s += to[i] === " " && from[i] === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
          }
        }
        o.textContent = s;
        f = done ? 0 : requestAnimationFrame(frame);
        if (done && auto && on) timer = window.setTimeout(() => go((n + 1) % PHRASES.length), HOLD);
      };
      frame(t0);
    };
    goRef.current = go;
    if (reduce) return;
    const h = el.querySelector("h2");
    const hover = () => { if (!f) go(n); };
    h?.addEventListener("pointerenter", hover);
    const io = new IntersectionObserver(([e]) => {
      on = e.isIntersecting;
      clearTimeout(timer);
      if (on && auto) go(n);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(f);
      clearTimeout(timer);
      h?.removeEventListener("pointerenter", hover);
    };
  }, []);

  return (
    <section ref={root} className="bg-[#1c2a21] px-5 py-[72px] text-[#f1ead9]">
      <style>{`
        .w3rph-word { font: 600 .82em/1.15 ui-monospace, "SF Mono", Menlo, Consolas, monospace; letter-spacing: -.03em; white-space: pre; }
        .w3rph-pick:focus-visible { outline: 2px solid #e6b860; outline-offset: 3px; }
      `}</style>
      <div className="mx-auto grid max-w-[68rem] items-center gap-10 min-[860px]:grid-cols-[1fr_380px]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a9bba5]">Fennick Mill</p>
          <h2 className="mt-[18px] font-serif text-[clamp(36px,5.6vw,64px)] font-normal leading-[1.08] tracking-[-0.02em]">
            <span className="sr-only">We stone-mill heritage wheat, whole spelt and dark rye.</span>
            <span aria-hidden="true" className="block">We stone-mill</span>
            <span ref={out} aria-hidden="true" className="w3rph-word mt-1.5 block text-[#e6b860]">{pad(PHRASES[0])}</span>
          </h2>
          <p className="mt-6 max-w-[32rem] text-[17px] leading-relaxed text-[#c9cdbd]">
            Grain from three farms within a morning's drive, ground slowly between French burr stones and bagged the same week.
          </p>
          <div className="mt-8 flex gap-2" role="group" aria-label="Show a flour">
            {LABELS.map((l, i) => (
              <button
                key={l}
                type="button"
                aria-pressed={cur === i}
                onClick={() => goRef.current(i, true)}
                className={`w3rph-pick min-h-[44px] rounded-full border px-[18px] text-sm font-medium ${
                  cur === i ? "border-[#f1ead9] bg-[#f1ead9] text-[#1c2a21]" : "border-[#3d5244] hover:border-[#6d8670]"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <img
          src="https://images.pexels.com/photos/6294375/pexels-photo-6294375.jpeg?auto=compress&cs=tinysrgb&w=900"
          alt="A steel scoop resting in an open paper sack of fresh white flour"
          width={900}
          height={1125}
          loading="lazy"
          className="block aspect-[4/5] h-auto w-full max-w-[380px] rounded-[18px] object-cover shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)]"
        />
      </div>
    </section>
  );
}
