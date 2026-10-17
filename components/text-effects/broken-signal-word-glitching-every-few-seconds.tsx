import { useEffect, useRef, useState } from "react";

const before = "Your website is";
const word = "broken";
const after = "We will mend it by Friday.";

export default function BrokenSignalWordGlitch() {
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
    <section ref={root} data-paused={visible ? "false" : "true"} className="w10sig bg-[#f3efe6] px-5 py-20 sm:px-10 sm:py-28">
      <style>{`
        .w10sig { --w10sig-ink: #1d1b18; --w10sig-rose: #d1495b; --w10sig-teal: #1f8a82; --w10sig-every: 5s; }
        .w10sig-word { position: relative; display: inline-block; color: var(--w10sig-ink); animation: w10sig-jolt var(--w10sig-every) steps(1, end) infinite; }
        .w10sig-word::before, .w10sig-word::after { content: attr(data-text); position: absolute; inset: 0; pointer-events: none; mix-blend-mode: multiply; opacity: 0; }
        .w10sig-word::before { color: var(--w10sig-rose); animation: w10sig-a var(--w10sig-every) steps(1, end) infinite; }
        .w10sig-word::after { color: var(--w10sig-teal); animation: w10sig-b var(--w10sig-every) steps(1, end) infinite; }
        .w10sig-mark { background: linear-gradient(transparent 62%, rgba(209,73,91,0.22) 62% 92%, transparent 92%); }
        @keyframes w10sig-jolt { 0% { transform: none; } 30% { transform: translateX(-3px) skewX(6deg); } 32% { transform: translateX(4px); } 34% { transform: translateX(-1px) skewX(-3deg); } 36% { transform: none; } }
        @keyframes w10sig-a {
          0% { opacity: 0; clip-path: inset(0 0 0 0); transform: none; }
          30% { opacity: 1; clip-path: inset(10% 0 58% 0); transform: translateX(-12px); }
          32% { opacity: 1; clip-path: inset(55% 0 20% 0); transform: translateX(9px); }
          34% { opacity: 1; clip-path: inset(30% 0 42% 0); transform: translateX(-5px); }
          36% { opacity: 0; clip-path: inset(0 0 0 0); transform: none; }
        }
        @keyframes w10sig-b {
          0% { opacity: 0; clip-path: inset(0 0 0 0); transform: none; }
          30% { opacity: 1; clip-path: inset(60% 0 12% 0); transform: translateX(10px); }
          32% { opacity: 1; clip-path: inset(18% 0 60% 0); transform: translateX(-8px); }
          34% { opacity: 1; clip-path: inset(70% 0 4% 0); transform: translateX(6px); }
          36% { opacity: 0; clip-path: inset(0 0 0 0); transform: none; }
        }
        .w10sig[data-paused="true"] .w10sig-word, .w10sig[data-paused="true"] .w10sig-word::before, .w10sig[data-paused="true"] .w10sig-word::after { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .w10sig-word, .w10sig-word::before, .w10sig-word::after { animation: none; }
        }
      `}</style>
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#6b5f52]">Patchwork Web Repair</p>
        <h1 className="mt-5 font-serif text-[clamp(40px,7.4vw,92px)] font-medium leading-[1.02] tracking-tight text-[#1d1b18]">
          {before}{" "}
          <span className="w10sig-mark whitespace-nowrap">
            <span className="sr-only">{word}.</span>
            <span aria-hidden="true" className="w10sig-word" data-text={word}>{word}</span>
            <span aria-hidden="true">.</span>
          </span>{" "}
          <span className="text-[#5b5248]">{after}</span>
        </h1>
        <p className="mt-8 max-w-xl text-lg leading-relaxed text-[#4a433b]">
          Dead links, a contact form that stopped sending, a checkout that hangs on phones. Send us the address and we will send back a fixed site and a plain list of what was wrong.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a
            href="#"
            className="inline-flex h-12 items-center rounded-lg bg-[#1d1b18] px-6 text-sm font-semibold text-[#f3efe6] transition hover:bg-[#33302b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d1495b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3efe6]"
          >
            Get a repair quote
          </a>
          <span className="text-sm text-[#5b5248]">Fixed price, quoted within a day</span>
        </div>
      </div>
    </section>
  );
}
