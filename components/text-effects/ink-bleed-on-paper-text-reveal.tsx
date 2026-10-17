import { useEffect, useRef, useState, type CSSProperties } from "react";

const HEADLINE = "Letters that dry slowly and keep for a lifetime.";

export default function InkBleedOnPaperTextReveal() {
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
    <section ref={rootRef} data-paused={paused || undefined} className="ibp-root relative overflow-hidden px-5 py-20 sm:px-10 sm:py-24">
      <style>{`
        @property --ibp-r { syntax: "<percentage>"; inherits: false; initial-value: 0%; }
        .ibp-root { background: #f4efe4; color: #1b1f2a; }
        .ibp-paper { position: absolute; inset: 0; width: 100%; height: 100%; opacity: .55; pointer-events: none; }
        .ibp-h { font-family: Georgia, "Iowan Old Style", "Times New Roman", serif; font-weight: 400; font-style: italic;
          font-size: clamp(2.1rem, 6.4vw, 4.6rem); line-height: 1.1; letter-spacing: -.015em; margin: 0; filter: url(#ibp-fibre); }
        .ibp-w { display: inline-block; white-space: pre; padding: 0 .04em;
          -webkit-mask-image: radial-gradient(circle at 30% 60%, #000 var(--ibp-r), transparent calc(var(--ibp-r) + 22%));
          mask-image: radial-gradient(circle at 30% 60%, #000 var(--ibp-r), transparent calc(var(--ibp-r) + 22%));
          animation: ibp-bleed 9s cubic-bezier(.3,.6,.2,1) infinite both; animation-delay: calc(var(--i) * 120ms); }
        @keyframes ibp-bleed {
          0% { --ibp-r: 0%; filter: blur(3px); opacity: .2 }
          12% { --ibp-r: 130%; filter: blur(0); opacity: 1 }
          86% { --ibp-r: 130%; filter: blur(0); opacity: 1 }
          96%, 100% { --ibp-r: 130%; filter: blur(2px); opacity: 0 } }
        .ibp-root[data-paused] .ibp-w { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) { .ibp-w { animation: none; --ibp-r: 130%; } }
      `}</style>
      <svg className="ibp-paper" aria-hidden="true" focusable="false">
        <filter id="ibp-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 0 0.28  0 0 0 0.22 0" />
        </filter>
        <filter id="ibp-fibre">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" />
        </filter>
        <rect width="100%" height="100%" filter="url(#ibp-grain)" />
      </svg>
      <div className="relative mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7b3f2a]">Marrow and Quill Stationers</p>
        <h1 className="ibp-h mt-6">
          <span className="sr-only">{HEADLINE}</span>
          <span aria-hidden="true">
            {words.map((w, i) => (
              <span key={i} className="ibp-w" style={{ "--i": i } as CSSProperties}>
                {i < words.length - 1 ? `${w} ` : w}
              </span>
            ))}
          </span>
        </h1>
        <p className="mt-7 max-w-lg text-base leading-relaxed text-[#4a4438] sm:text-lg">
          Iron gall and walnut inks mixed in small batches, with cotton paper heavy enough to hold a wet nib without feathering.
        </p>
        <a href="#" className="mt-8 inline-flex min-h-[44px] items-center rounded-sm bg-[#1b1f2a] px-6 text-sm font-semibold text-[#f4efe4] transition hover:bg-[#2c3242] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1b1f2a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f4efe4]">
          Order a sample set
        </a>
      </div>
    </section>
  );
}
