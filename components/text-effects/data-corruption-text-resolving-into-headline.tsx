import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

const headline = "Your files, restored intact.";
const NOISE = "#%&*+=/<>?!01$@{}[]";
const RESOLVE_MS = 1500; // time for the line to settle, left to right
const HOLD_MS = 4200; // how long the clean line stays before it breaks again
const BREAK_MS = 700; // how long the corruption takes to spread

export default function DataCorruptionTextResolvingIntoHeadline() {
  const root = useRef<HTMLElement>(null);
  const chars = useRef<(HTMLSpanElement | null)[]>([]);
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const spans = chars.current;
    const letters = headline.split("");
    const show = (i: number, clean: boolean) => {
      const s = spans[i];
      if (!s || letters[i] === " ") return;
      s.textContent = clean ? letters[i] : NOISE[Math.floor(Math.random() * NOISE.length)];
      s.dataset.state = clean ? "clean" : "noise";
    };
    if (reduce || !visible) {
      letters.forEach((_, i) => show(i, true));
      return;
    }
    const n = letters.length;
    const order = letters.map((_, i) => i / n);
    const breakAt = letters.map(() => Math.random());
    const cycle = RESOLVE_MS + HOLD_MS + BREAK_MS;
    const start = performance.now();
    let last = 0;
    let frame = 0;
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (now - last < 55) return;
      last = now;
      const t = (now - start) % cycle;
      for (let i = 0; i < n; i += 1) {
        let clean: boolean;
        if (t < RESOLVE_MS) clean = t > 150 + order[i] * (RESOLVE_MS - 350);
        else if (t < RESOLVE_MS + HOLD_MS) clean = true;
        else clean = (t - RESOLVE_MS - HOLD_MS) / BREAK_MS < breakAt[i];
        show(i, clean);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduce, visible]);

  return (
    <section ref={root} className="w10dcr relative overflow-hidden bg-[#0b1322] px-5 py-20 sm:px-10 sm:py-28">
      <style>{`
        .w10dcr-grid { background-image: linear-gradient(rgba(148,233,200,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148,233,200,0.05) 1px, transparent 1px); background-size: 32px 32px; mask-image: radial-gradient(70% 70% at 50% 45%, #000, transparent); -webkit-mask-image: radial-gradient(70% 70% at 50% 45%, #000, transparent); }
        .w10dcr-c[data-state="noise"] { color: #3f8f78; }
        .w10dcr-c[data-state="clean"] { color: #b9f5dc; text-shadow: 0 0 18px rgba(120, 240, 190, 0.25); }
        @media (prefers-reduced-motion: reduce) { .w10dcr-c { transition: none; } }
      `}</style>
      <div aria-hidden="true" className="w10dcr-grid pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-4xl">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#7fb8a6]">Coldvault · offsite backup</p>
        <h1 className="mt-6 font-mono text-[clamp(32px,6.2vw,72px)] font-bold leading-[1.1] tracking-tight text-[#b9f5dc]">
          <span className="sr-only">{headline}</span>
          <span aria-hidden="true">
            {headline.split("").map((ch, i) => (
              <span key={i} ref={(el) => { chars.current[i] = el; }} className="w10dcr-c" data-state="clean">{ch}</span>
            ))}
          </span>
        </h1>
        <p className="mt-7 max-w-xl text-base leading-relaxed text-[#a9c4bb] sm:text-lg">
          Encrypted nightly copies of every laptop in the office, checked byte for byte each week so a restore is never a gamble.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-5">
          <a
            href="#"
            className="inline-flex h-12 items-center rounded-md bg-[#b9f5dc] px-6 font-mono text-sm font-semibold text-[#0b1322] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b9f5dc] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1322]"
          >
            Run a test restore
          </a>
          <span className="font-mono text-xs uppercase tracking-widest text-[#7fb8a6]">Last check passed 06:00</span>
        </div>
      </div>
    </section>
  );
}
