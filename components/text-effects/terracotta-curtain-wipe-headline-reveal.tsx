import { useEffect, useRef, useState, type CSSProperties } from "react";

const LINES = ["Thrown by hand,", "fired slowly,", "kept for decades."];

export default function TerracottaCurtainWipeHeadlineReveal() {
  const rootRef = useRef<HTMLElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setPaused(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={rootRef} data-paused={paused || undefined} className="cmw-root px-5 py-20 sm:px-10 sm:py-24">
      <style>{`
        .cmw-root { background: #efe3cf; color: #2b1d14;
          background-image: radial-gradient(90% 70% at 85% 10%, rgba(255,255,255,.55), transparent 60%), radial-gradient(70% 60% at 0% 100%, rgba(180,83,42,.10), transparent 70%); }
        .cmw-h { font-family: Georgia, "Iowan Old Style", "Times New Roman", serif; font-weight: 400;
          font-size: clamp(2.3rem, 7.5vw, 5.4rem); line-height: 1.02; letter-spacing: -.025em; margin: 0; }
        .cmw-line { position: relative; display: block; width: fit-content; overflow: hidden; padding: 0 .06em .06em 0; }
        .cmw-line:nth-child(2) { font-style: italic; color: #8a3b1c; }
        .cmw-text { display: block; animation: cmw-text 8s cubic-bezier(.7,0,.2,1) infinite both; animation-delay: calc(var(--i) * 140ms); }
        .cmw-line::after { content: ""; position: absolute; inset: 0; background: #b4532a;
          transform: translateX(-101%); animation: cmw-curtain 8s cubic-bezier(.7,0,.2,1) infinite both; animation-delay: calc(var(--i) * 140ms); }
        @keyframes cmw-curtain {
          0% { transform: translateX(-101%) } 7% { transform: translateX(0) } 15% { transform: translateX(101%) }
          84% { transform: translateX(101%) } 90% { transform: translateX(0) } 97%, 100% { transform: translateX(-101%) } }
        @keyframes cmw-text { 0%, 6.9% { opacity: 0 } 7%, 89.9% { opacity: 1 } 90%, 100% { opacity: 0 } }
        .cmw-root[data-paused] .cmw-text, .cmw-root[data-paused] .cmw-line::after { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .cmw-text { animation: none; opacity: 1; }
          .cmw-line::after { animation: none; transform: translateX(101%); }
        }
      `}</style>
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8a3b1c]">Kiln and Clay Studio</p>
        <h1 className="cmw-h mt-6">
          {LINES.map((line, i) => (
            <span key={line} className="cmw-line" style={{ "--i": i } as CSSProperties}>
              <span className="cmw-text">{line}</span>
            </span>
          ))}
        </h1>
        <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-md text-base leading-relaxed text-[#5a4433] sm:text-lg">
            Stoneware cups, bowls and serving plates from a two-person workshop. New pieces leave the kiln every second Friday.
          </p>
          <a href="#" className="inline-flex min-h-[44px] w-fit items-center rounded-none border-2 border-[#2b1d14] px-6 text-sm font-semibold tracking-wide transition hover:bg-[#2b1d14] hover:text-[#efe3cf] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b4532a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#efe3cf]">
            Visit the shop
          </a>
        </div>
      </div>
    </section>
  );
}
