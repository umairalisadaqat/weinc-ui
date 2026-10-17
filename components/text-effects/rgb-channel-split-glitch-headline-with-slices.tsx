import { useEffect, useRef, useState } from "react";

const headline = "Static after midnight";

export default function RgbChannelSplitGlitchHeadline() {
  const root = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={root}
      data-paused={visible ? "false" : "true"}
      className="w10rgb relative overflow-hidden bg-[#0f1113] px-5 py-20 sm:px-10 sm:py-28"
    >
      <style>{`
        .w10rgb { --w10rgb-red: #ff4766; --w10rgb-cyan: #2fd3ff; --w10rgb-cycle: 4.6s; }
        .w10rgb-glow { background: radial-gradient(60% 55% at 50% 42%, rgba(70, 92, 110, 0.35), transparent 70%), radial-gradient(40% 40% at 80% 90%, rgba(255, 71, 102, 0.08), transparent 70%); }
        .w10rgb-lines { background: repeating-linear-gradient(to bottom, rgba(255,255,255,0.035) 0 1px, transparent 1px 3px); }
        .w10rgb-word { position: relative; display: inline-block; }
        .w10rgb-word::before, .w10rgb-word::after { content: attr(data-text); position: absolute; inset: 0; pointer-events: none; mix-blend-mode: screen; }
        .w10rgb-word::before { color: var(--w10rgb-red); transform: translate(-2px, 0); animation: w10rgb-red var(--w10rgb-cycle) steps(1, end) infinite; }
        .w10rgb-word::after { color: var(--w10rgb-cyan); transform: translate(2px, 0); animation: w10rgb-cyan var(--w10rgb-cycle) steps(1, end) infinite; }
        .w10rgb-shift { display: inline-block; animation: w10rgb-shift var(--w10rgb-cycle) steps(1, end) infinite; }
        @keyframes w10rgb-red {
          0% { clip-path: inset(0 0 0 0); transform: translate(-2px, 0); }
          3% { clip-path: inset(14% 0 62% 0); transform: translate(-11px, 0); }
          5% { clip-path: inset(61% 0 21% 0); transform: translate(8px, 0); }
          7% { clip-path: inset(36% 0 44% 0); transform: translate(-6px, 0); }
          9% { clip-path: inset(0 0 0 0); transform: translate(-2px, 0); }
          55% { clip-path: inset(72% 0 8% 0); transform: translate(12px, 0); }
          57% { clip-path: inset(0 0 0 0); transform: translate(-2px, 0); }
        }
        @keyframes w10rgb-cyan {
          0% { clip-path: inset(0 0 0 0); transform: translate(2px, 0); }
          3% { clip-path: inset(48% 0 30% 0); transform: translate(10px, 0); }
          5% { clip-path: inset(8% 0 74% 0); transform: translate(-9px, 0); }
          7% { clip-path: inset(66% 0 12% 0); transform: translate(5px, 0); }
          9% { clip-path: inset(0 0 0 0); transform: translate(2px, 0); }
          55% { clip-path: inset(20% 0 64% 0); transform: translate(-10px, 0); }
          57% { clip-path: inset(0 0 0 0); transform: translate(2px, 0); }
        }
        @keyframes w10rgb-shift {
          0% { transform: none; }
          4% { transform: translateX(3px) skewX(-4deg); }
          6% { transform: translateX(-2px); }
          8% { transform: none; }
        }
        .w10rgb[data-paused="true"] .w10rgb-word::before, .w10rgb[data-paused="true"] .w10rgb-word::after, .w10rgb[data-paused="true"] .w10rgb-shift { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .w10rgb-word::before, .w10rgb-word::after, .w10rgb-shift { animation: none; }
        }
      `}</style>
      <div aria-hidden="true" className="w10rgb-glow pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="w10rgb-lines pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-5xl text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#9aa6b0]">Nightshift Radio · 98.4 FM</p>
        <h1 className="mt-6 text-[clamp(44px,9vw,112px)] font-extrabold leading-[0.95] tracking-tight text-[#eeece6]">
          <span className="sr-only">{headline}</span>
          <span aria-hidden="true" className="w10rgb-shift">
            <span className="w10rgb-word" data-text={headline}>{headline}</span>
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-[#b9c1c8] sm:text-lg">
          Independent late-night radio from a converted bakery basement. New mixes every Friday from eleven.
        </p>
        <a
          href="#"
          className="mt-9 inline-flex h-12 items-center rounded-full bg-[#eeece6] px-7 text-sm font-semibold text-[#0f1113] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2fd3ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1113]"
        >
          Listen live
        </a>
      </div>
    </section>
  );
}
