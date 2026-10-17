import { useEffect, useRef, useState, type CSSProperties } from "react";

const HEADLINE = "Bread worth waking for.";

export default function WeightedLetterDropHeadlineAnimation() {
  const rootRef = useRef<HTMLElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setPaused(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  let n = 0;
  const words = HEADLINE.split(" ").map((w) => [...w].map((ch) => ({ ch, i: n++ })));

  return (
    <section ref={rootRef} data-paused={paused || undefined} className="wld-root px-5 py-20 sm:px-10 sm:py-24">
      <style>{`
        .wld-root { background: #f2efe6; color: #1f3b2d;
          background-image: linear-gradient(180deg, rgba(255,255,255,.5), transparent 40%), radial-gradient(80% 60% at 100% 100%, rgba(196,148,82,.16), transparent 70%); }
        .wld-h { font-family: Georgia, "Iowan Old Style", "Times New Roman", serif; font-weight: 700;
          font-size: clamp(2.5rem, 8.4vw, 6rem); line-height: 1.02; letter-spacing: -.03em; margin: 0; }
        .wld-word { display: inline-block; white-space: nowrap; }
        .wld-ch { display: inline-block; transform-origin: 50% 100%;
          animation: wld-drop 8s linear infinite both; animation-delay: calc(var(--i) * 42ms); }
        @keyframes wld-drop {
          0% { transform: translateY(-0.55em); opacity: 0; animation-timing-function: cubic-bezier(.5,0,.9,.4) }
          6% { transform: translateY(0) scale(1.06, .9); opacity: 1; animation-timing-function: cubic-bezier(.2,.7,.4,1) }
          8.5% { transform: translateY(-0.07em) scale(.98, 1.03) }
          11%, 88% { transform: none; opacity: 1 }
          94%, 100% { transform: translateY(.18em); opacity: 0 } }
        .wld-root[data-paused] .wld-ch { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .wld-ch { animation: none; } }
      `}</style>
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8a5a24]">Fernhollow Bakery</p>
        <h1 className="wld-h mt-5">
          <span className="sr-only">{HEADLINE}</span>
          <span aria-hidden="true">
            {words.map((letters, w) => (
              <span key={w}>
                {w > 0 && " "}
                <span className="wld-word">
                  {letters.map(({ ch, i }) => (
                    <span key={i} className="wld-ch" style={{ "--i": i } as CSSProperties}>{ch}</span>
                  ))}
                </span>
              </span>
            ))}
          </span>
        </h1>
        <p className="mt-7 max-w-lg text-base leading-relaxed text-[#3c4f44] sm:text-lg">
          Sourdough, rye and seeded loaves from a wood oven lit at four. Collect from the side door until we sell out.
        </p>
        <a href="#" className="mt-8 inline-flex min-h-[44px] items-center rounded-lg bg-[#1f3b2d] px-6 text-sm font-semibold text-[#f2efe6] transition hover:bg-[#2b4f3d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f3b2d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f2efe6]">
          Reserve tomorrow&apos;s loaf
        </a>
      </div>
    </section>
  );
}
