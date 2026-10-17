import { useEffect, useRef } from "react";

const MAX_TILT = 10; // degrees at the card's edge
const GLARE = 0.55; // brightest glare opacity

export default function TiltCardWithAMovingGlareLayer() {
  const root = useRef<HTMLElement>(null);
  const card = useRef<HTMLAnchorElement>(null);
  const glare = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current, c = card.current, g = glare.current;
    if (!el || !c || !g) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let tx = 0, ty = 0, x = 0, y = 0, live = false, frame = 0, visible = true;
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = c.getBoundingClientRect();
      // -1..1 across the card, clamped so the tilt eases off outside it
      tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
      live = true;
    };
    const leave = () => { live = false; };
    const tick = (now: number) => {
      if (!live) { tx = Math.sin(now / 2100) * 0.8; ty = Math.sin(now / 1500 + 1) * 0.6; }
      x += (tx - x) * 0.08;
      y += (ty - y) * 0.08;
      c.style.transform = `rotateX(${(-y * MAX_TILT).toFixed(2)}deg) rotateY(${(x * MAX_TILT).toFixed(2)}deg)`;
      g.style.transform = `translate(${(x * 30).toFixed(1)}%, ${(y * 30).toFixed(1)}%)`;
      g.style.opacity = (GLARE * (0.35 + 0.65 * Math.min(1, Math.hypot(x, y)))).toFixed(3);
      frame = requestAnimationFrame(tick);
    };
    const play = () => { if (!frame && visible) frame = requestAnimationFrame(tick); };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; };
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) play(); else stop(); });
    io.observe(el);
    if (fine) { el.addEventListener("pointermove", move); el.addEventListener("pointerleave", leave); }
    play();
    return () => {
      stop();
      io.disconnect();
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <section ref={root} className="bg-[#26282b] px-5 py-16 sm:py-20">
      <style>{`
        .w3tlt-stage { perspective: 900px; }
        .w3tlt-card { transform-style: preserve-3d; will-change: transform; }
        .w3tlt-glare { opacity: .25; background: radial-gradient(circle at 50% 50%, rgba(255,255,255,.55), rgba(255,255,255,0) 45%); }
        .w3tlt-card:focus-visible { outline: 2px solid #f1efe9; outline-offset: 6px; }
        @media (prefers-reduced-motion: reduce) { .w3tlt-card { transform: rotateX(4deg) rotateY(-6deg) !important; will-change: auto; } .w3tlt-glare { transform: translate(-15%, -15%) !important; } }
      `}</style>
      <div className="mx-auto grid max-w-5xl items-center gap-12 md:grid-cols-2">
        <div className="text-[#f1efe9]">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#b5b0a5]">Ashgrove Bouldering</p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">One card for every wall in the city.</h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-[#c9c5bc]">Unlimited visits to our three gyms, two guest passes a month and shoe hire included.</p>
        </div>
        <div className="w3tlt-stage flex justify-center">
          <a
            ref={card}
            href="#"
            aria-label="Ashgrove all-gyms membership, 58 dollars a month, view details"
            className="w3tlt-card relative block aspect-[1.586] w-full max-w-sm overflow-hidden rounded-2xl bg-gradient-to-br from-[#4a4d52] via-[#2f3135] to-[#1b1c1f] p-6 text-[#f1efe9] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/10"
          >
            <span aria-hidden="true" className="absolute inset-0 opacity-30" style={{ backgroundImage: "repeating-linear-gradient(115deg, rgba(255,255,255,0.05) 0 2px, transparent 2px 9px)" }} />
            <span aria-hidden="true" className="relative flex h-full flex-col justify-between">
              <span className="flex items-start justify-between">
                <span className="text-sm font-semibold uppercase tracking-[0.2em]">Ashgrove</span>
                <svg viewBox="0 0 32 24" className="h-6 w-8" fill="none" stroke="#d6c49a" strokeWidth="1.6"><path d="M2 22 L11 6 L17 15 L21 9 L30 22 Z" /></svg>
              </span>
              <span>
                <span className="block text-xs uppercase tracking-[0.2em] text-[#c9c5bc]">All gyms · monthly</span>
                <span className="mt-1 flex items-end justify-between">
                  <span className="text-2xl font-semibold">$58</span>
                  <span className="font-mono text-sm tracking-widest text-[#d6c49a]">No. 0412</span>
                </span>
              </span>
            </span>
            <span ref={glare} aria-hidden="true" className="w3tlt-glare pointer-events-none absolute -inset-1/2" />
          </a>
        </div>
      </div>
    </section>
  );
}
