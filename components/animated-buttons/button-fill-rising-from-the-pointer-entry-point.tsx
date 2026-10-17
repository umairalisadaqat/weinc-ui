import { useEffect, useRef } from "react";

const DEMO_EVERY = 1800; // ms between idle fills on the first button
const buttons = ["Book a garden visit", "See planting plans", "Ask about upkeep"];

export default function ButtonFillRisingFromThePointerEntryPoint() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const btns = Array.from(el.querySelectorAll<HTMLAnchorElement>(".w3fil-btn"));
    // puts the circle where the pointer crossed the edge, then lets CSS scale it
    const place = (b: HTMLElement, x: number, y: number) => {
      const dot = b.querySelector<HTMLElement>(".w3fil-dot");
      if (dot) { dot.style.left = `${x}px`; dot.style.top = `${y}px`; }
    };
    const at = (e: PointerEvent) => {
      const b = e.currentTarget as HTMLElement;
      const r = b.getBoundingClientRect();
      place(b, e.clientX - r.left, e.clientY - r.top);
      return b;
    };
    const enter = (e: PointerEvent) => { if (e.pointerType === "mouse") at(e).setAttribute("data-on", ""); };
    const leave = (e: PointerEvent) => { if (e.pointerType === "mouse") at(e).removeAttribute("data-on"); };
    const focus = (e: FocusEvent) => { const b = e.currentTarget as HTMLElement; place(b, b.offsetWidth / 2, b.offsetHeight / 2); };
    btns.forEach((b) => { b.addEventListener("pointerenter", enter); b.addEventListener("pointerleave", leave); b.addEventListener("focus", focus); });

    // idle demo: the first button fills from one edge, empties toward another
    const demo = btns[0];
    const edges = [[0, 0.5], [0.5, 0], [1, 0.5], [0.5, 1]];
    let n = 0, timer = 0, busy = false;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const step = () => {
      if (busy) return;
      const [ex, ey] = edges[n % 4];
      place(demo, ex * demo.offsetWidth, ey * demo.offsetHeight);
      demo.toggleAttribute("data-on");
      n += 1;
    };
    const hold = () => { if (!busy) { busy = true; demo.removeAttribute("data-on"); } };
    const resume = () => { busy = false; };
    el.addEventListener("pointerenter", hold);
    el.addEventListener("pointerleave", resume);
    el.addEventListener("focusin", hold);
    el.addEventListener("focusout", resume);
    const io = new IntersectionObserver(([en]) => {
      window.clearInterval(timer);
      if (en.isIntersecting && !reduce) timer = window.setInterval(step, DEMO_EVERY);
    });
    io.observe(el);
    if (!reduce) step();
    return () => {
      window.clearInterval(timer);
      io.disconnect();
      btns.forEach((b) => { b.removeEventListener("pointerenter", enter); b.removeEventListener("pointerleave", leave); b.removeEventListener("focus", focus); });
      el.removeEventListener("pointerenter", hold);
      el.removeEventListener("pointerleave", resume);
      el.removeEventListener("focusin", hold);
      el.removeEventListener("focusout", resume);
    };
  }, []);

  return (
    <section ref={root} className="bg-[#f6ebe1] px-5 py-16 sm:py-20">
      <style>{`
        .w3fil-btn { position: relative; isolation: isolate; overflow: hidden; }
        .w3fil-dot { position: absolute; left: 50%; top: 50%; width: 230%; aspect-ratio: 1; border-radius: 50%; background: #a4452b; transform: translate(-50%, -50%) scale(0); transition: transform .55s cubic-bezier(.3,.7,.2,1); z-index: -1; }
        .w3fil-on { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #fdf6ef; opacity: 0; transition: opacity .3s ease; }
        .w3fil-off { transition: opacity .3s ease; }
        .w3fil-btn[data-on] .w3fil-dot, .w3fil-btn:focus-visible .w3fil-dot { transform: translate(-50%, -50%) scale(1); }
        .w3fil-btn[data-on] .w3fil-on, .w3fil-btn:focus-visible .w3fil-on { opacity: 1; }
        .w3fil-btn[data-on] .w3fil-off, .w3fil-btn:focus-visible .w3fil-off { opacity: 0; }
        .w3fil-btn:focus-visible { outline: 2px solid #5a2414; outline-offset: 4px; }
        @media (hover: hover) and (pointer: fine) {
          .w3fil-btn:hover .w3fil-dot { transform: translate(-50%, -50%) scale(1); }
          .w3fil-btn:hover .w3fil-on { opacity: 1; }
          .w3fil-btn:hover .w3fil-off { opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) { .w3fil-dot, .w3fil-on, .w3fil-off { transition: none; } }
      `}</style>
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8a3a24]">Redclay Gardens</p>
        <h2 className="mt-4 font-serif text-3xl leading-tight text-[#3a1d14] sm:text-5xl">Dry gardens that look after themselves.</h2>
        <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-[#5e4136]">Gravel beds, grasses and Mediterranean shrubs, planned for clay soil and hot summers, then left to settle.</p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {buttons.map((b) => (
            <a key={b} href="#" className="w3fil-btn inline-flex h-14 w-64 items-center justify-center rounded-full border-2 border-[#a4452b] text-base font-semibold text-[#5a2414] sm:w-auto sm:px-7">
              <span aria-hidden="true" className="w3fil-dot" />
              <span className="w3fil-off">{b}</span>
              <span aria-hidden="true" className="w3fil-on">{b}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
