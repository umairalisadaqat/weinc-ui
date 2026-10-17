import { useEffect, useRef, useState, type CSSProperties } from "react";

const HEADLINE = "Arrive before the light does, and leave a little lighter.";
const SUBLINE = "Sunrise sessions on the east dock, six mornings a week.";

export default function DawnBlurFadeWordByWordReveal() {
  const rootRef = useRef<HTMLElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setPaused(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const words = HEADLINE.split(" ");

  return (
    <section ref={rootRef} data-paused={paused || undefined} className="bfw-root relative overflow-hidden px-5 py-24 text-center sm:px-10 sm:py-28">
      <style>{`
        .bfw-root { color: #1d2433; background:
          radial-gradient(60% 55% at 50% 108%, rgba(255,196,150,.85), transparent 70%),
          radial-gradient(80% 60% at 15% 0%, rgba(201,214,232,.9), transparent 70%),
          linear-gradient(180deg, #dfe5ee 0%, #f1e2d6 62%, #f6d7c0 100%); }
        .bfw-h { font-family: Georgia, "Iowan Old Style", "Times New Roman", serif; font-weight: 400;
          font-size: clamp(2rem, 5.6vw, 4.1rem); line-height: 1.12; letter-spacing: -.02em; margin: 0 auto; max-width: 15em; }
        .bfw-w { display: inline-block; white-space: pre; will-change: filter, opacity, transform;
          animation: bfw-in 9s cubic-bezier(.22,.8,.3,1) infinite both; animation-delay: calc(var(--i) * 85ms); }
        @keyframes bfw-in {
          0% { opacity: 0; filter: blur(14px); transform: translateY(.28em) }
          11%, 86% { opacity: 1; filter: blur(0); transform: none }
          95%, 100% { opacity: 0; filter: blur(10px); transform: translateY(-.12em) } }
        .bfw-sub { animation: bfw-in 9s cubic-bezier(.22,.8,.3,1) infinite both; animation-delay: 900ms; }
        .bfw-root[data-paused] .bfw-w, .bfw-root[data-paused] .bfw-sub { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .bfw-w, .bfw-sub { animation: none; } }
      `}</style>
      <div className="relative mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#7a4a33]">Low Tide Yoga</p>
        <h1 className="bfw-h mt-6">
          <span className="sr-only">{HEADLINE}</span>
          <span aria-hidden="true">
            {words.map((w, i) => (
              <span key={i} className="bfw-w" style={{ "--i": i } as CSSProperties}>
                {i < words.length - 1 ? `${w} ` : w}
              </span>
            ))}
          </span>
        </h1>
        <p className="bfw-sub mx-auto mt-6 max-w-lg text-base leading-relaxed text-[#444b5a] sm:text-lg">{SUBLINE}</p>
        <a href="#" className="mt-9 inline-flex min-h-[44px] items-center rounded-full bg-[#1d2433] px-7 text-sm font-semibold text-[#f6efe8] transition hover:bg-[#2c364b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d2433] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f1e2d6]">
          Book a first morning
        </a>
      </div>
    </section>
  );
}
