import { useEffect, useRef } from "react";

const PULL = 0.35; // how far the pill follows the pointer (0.35 = 35% of the distance)
const LABEL_PULL = 0.55; // the label follows further than the pill, which gives the depth
const REACH = 90; // px around the pill where the pull starts

export default function MagneticPillButtonWithParallaxLabel() {
  const root = useRef<HTMLElement>(null);
  const pill = useRef<HTMLAnchorElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    const p = pill.current;
    const l = label.current;
    if (!el || !p || !l) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let tx = 0, ty = 0, x = 0, y = 0, frame = 0, visible = true, live = false, hot = false;
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      live = true;
      const r = p.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      hot = Math.abs(dx) < r.width / 2 + REACH && Math.abs(dy) < r.height / 2 + REACH;
      tx = hot ? dx : 0;
      ty = hot ? dy : 0;
    };
    const leave = () => { live = false; hot = false; };
    const tick = (now: number) => {
      if (!live) {
        // idle demo: the pointer seems to circle the pill until a real mouse arrives
        tx = Math.sin(now / 1300) * 60;
        ty = Math.cos(now / 1700) * 26;
      } else if (!hot) { tx = 0; ty = 0; }
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
      p.style.transform = `translate(${(x * PULL).toFixed(2)}px, ${(y * PULL).toFixed(2)}px)`;
      l.style.transform = `translate(${(x * (LABEL_PULL - PULL)).toFixed(2)}px, ${(y * (LABEL_PULL - PULL)).toFixed(2)}px)`;
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
    <section ref={root} className="w3mag relative overflow-hidden bg-[#15171b] px-5 py-20 text-[#efe9df] sm:py-24">
      <style>{`
        .w3mag-pill { will-change: transform; }
        .w3mag-glow { opacity: 0; transition: opacity .35s ease; }
        .w3mag-pill:focus-visible .w3mag-glow { opacity: 1; }
        .w3mag-pill:focus-visible { outline: 2px solid #efe9df; outline-offset: 5px; }
        @media (hover: hover) and (pointer: fine) {
          .w3mag-pill:hover .w3mag-glow { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) { .w3mag-pill, .w3mag-label { transform: none !important; will-change: auto; } }
      `}</style>
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#c9b892]">Halden Wine Room</p>
        <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">Twelve seats at the counter, open until one.</h2>
        <p className="mt-5 max-w-lg text-base leading-relaxed text-[#bdb6aa]">Natural wines by the glass, small plates from a wood oven, and a list that changes every Thursday.</p>
        <div className="mt-14 flex h-40 w-full items-center justify-center">
          <a
            ref={pill}
            href="#"
            className="w3mag-pill relative inline-flex h-16 items-center justify-center overflow-hidden rounded-full bg-[#efe9df] px-12 text-base font-semibold text-[#15171b]"
          >
            <span aria-hidden="true" className="w3mag-glow absolute inset-0 rounded-full bg-[#c9b892]" />
            <span ref={label} className="w3mag-label relative inline-block">Reserve a seat</span>
          </a>
        </div>
        <p className="text-sm text-[#a39c90]">Walk-ins welcome before seven.</p>
      </div>
    </section>
  );
}
