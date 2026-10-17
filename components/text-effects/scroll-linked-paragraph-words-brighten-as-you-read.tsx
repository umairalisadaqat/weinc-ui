import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

const PASSAGE =
  "We print forty copies of every book, sewn by hand at a long table under the north window. The paper comes from a mill two valleys over, still damp when it arrives. Nobody here is in a hurry. A book takes the time it takes, and then it goes out into the world to be read slowly, in good light, by someone who chose it on purpose.";
const AUTO_PX_PER_SEC = 22; // speed of the gentle demo scroll before anyone touches it

export default function ScrollLinkedParagraphWordsBrightenAsYouRead() {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // Fallback for browsers without scroll-driven animations: light each word once it passes the reading line.
  useEffect(() => {
    const box = boxRef.current;
    if (!box || reduce || CSS.supports("animation-timeline: view()")) return;
    box.setAttribute("data-fallback", "");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.classList.toggle("swb-lit", e.isIntersecting || e.boundingClientRect.top < (e.rootBounds?.top ?? 0))),
      { root: box, rootMargin: "0px 0px -45% 0px" },
    );
    box.querySelectorAll(".swb-w").forEach((w) => io.observe(w));
    return () => io.disconnect();
  }, [reduce]);

  // A slow demo scroll so the effect is visible without input; any touch, wheel or key hands control back.
  useEffect(() => {
    const box = boxRef.current;
    const root = rootRef.current;
    if (!box || !root || reduce) return;
    let frame = 0;
    let last = 0;
    let pos = box.scrollTop;
    let onScreen = true;
    let stopped = false;
    const step = (now: number) => {
      const dt = last ? Math.min(now - last, 50) : 0;
      last = now;
      pos += (AUTO_PX_PER_SEC * dt) / 1000;
      if (pos >= box.scrollHeight - box.clientHeight) pos = 0;
      box.scrollTop = pos;
      frame = requestAnimationFrame(step);
    };
    const start = () => { if (!stopped && onScreen && !frame) { last = 0; frame = requestAnimationFrame(step); } };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; };
    const handOver = () => { stopped = true; stop(); };
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; if (onScreen) start(); else stop(); });
    io.observe(root);
    const events = ["wheel", "touchstart", "pointerdown", "keydown"] as const;
    events.forEach((ev) => box.addEventListener(ev, handOver, { passive: true }));
    start();
    return () => {
      stop();
      io.disconnect();
      events.forEach((ev) => box.removeEventListener(ev, handOver));
    };
  }, [reduce]);

  return (
    <section ref={rootRef} className="swb-root px-5 py-16 sm:px-10 sm:py-20">
      <style>{`
        .swb-root { background: #f3ede1; color: #2a2118; }
        .swb-box { height: 360px; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #c8bba3 transparent;
          -webkit-mask-image: linear-gradient(transparent, #000 14%, #000 80%, transparent);
          mask-image: linear-gradient(transparent, #000 14%, #000 80%, transparent); }
        .swb-box:focus-visible { outline: 2px solid #9a5b2e; outline-offset: 6px; border-radius: 8px; }
        .swb-text { font-family: Georgia, "Iowan Old Style", "Times New Roman", serif; font-size: clamp(1.45rem, 3.4vw, 2.25rem);
          line-height: 1.45; letter-spacing: -.005em; padding: 120px 0 260px; margin: 0; }
        .swb-w { opacity: .2; }
        @supports (animation-timeline: view()) {
          .swb-w { animation: swb-lit linear both; animation-timeline: view(); animation-range: cover 18% cover 48%; }
        }
        @keyframes swb-lit { from { opacity: .2 } to { opacity: 1 } }
        .swb-box[data-fallback] .swb-w { animation: none; transition: opacity .6s ease; }
        .swb-box[data-fallback] .swb-w.swb-lit { opacity: 1; }
        @media (prefers-reduced-motion: reduce) { .swb-w, .swb-box[data-fallback] .swb-w { animation: none; opacity: 1; transition: none; } }
      `}</style>
      <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[220px_1fr]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8a4f26]">Saltmarsh Press</p>
          <h2 className="mt-3 text-2xl font-semibold leading-snug">A note from the bindery</h2>
          <p className="mt-3 text-sm leading-relaxed text-[#5b4d3d]">Scroll the passage. Each word brightens as it reaches your reading line.</p>
          <a href="#" className="mt-6 inline-flex min-h-[44px] items-center rounded-md bg-[#2a2118] px-5 text-sm font-semibold text-[#f3ede1] transition hover:bg-[#3b2f23] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9a5b2e] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f3ede1]">
            See the autumn list
          </a>
        </div>
        <div ref={boxRef} className="swb-box" tabIndex={0} role="region" aria-label="A note from the bindery, scrollable">
          <p className="swb-text">
            {PASSAGE.split(" ").map((w, i) => (
              <span key={i}>
                <span className="swb-w">{w}</span>{" "}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}
