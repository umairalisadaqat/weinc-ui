import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

const steps = [
  { title: "Roof survey", time: "One visit", text: "An installer climbs up, measures every face of the roof and checks the rafters and the fuse board before anything is drawn.", gets: ["Photos of each roof face", "A note on any repairs needed first"] },
  { title: "Panel layout", time: "About three days", text: "We draw where each panel sits, how the cables run and where the inverter hangs, then walk you through it on a call.", gets: ["A drawn layout you can mark up", "A fixed price that will not change"] },
  { title: "Permits and grid sign-off", time: "Two to four weeks", text: "We file the paperwork with the council and the network operator and chase it, so you only hear from us when it is approved.", gets: ["Every form filed for you", "A date for install day"] },
  { title: "Install day", time: "One day", text: "Scaffold goes up early, panels are fixed by lunch and the system is switched on and tested with you before the team leaves.", gets: ["A live system and handover pack", "The monitoring app set up on your phone"] },
];
const BASE = 24; // pin line of the first card, in px
const PEEK = 64; // how much of each earlier card stays visible
const FADE = 0.7; // how far a covered card's body fades
const AUTO_PX_PER_SEC = 32; // demo scroll speed; 0 turns it off

export default function NumberedProcessStepsStackingWithPeekingHeaders() {
  const reduce = useReducedMotion();
  const boxRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    if (!box || reduce) return;
    const cards = Array.from(box.querySelectorAll<HTMLElement>(".w4nps-card"));
    let raf = 0;
    const paint = () => {
      raf = 0;
      const top = box.getBoundingClientRect().top;
      const cover = cards.map((c) => {
        const d = c.getBoundingClientRect().top - top - parseFloat(getComputedStyle(c).top);
        return Math.min(1, Math.max(0, 1 - d / (c.offsetHeight - PEEK)));
      });
      cards.forEach((c, i) => {
        const under = i + 1 < cards.length ? cover[i + 1] : 0;
        c.querySelector<HTMLElement>(".w4nps-body")!.style.opacity = String(1 - FADE * under);
        c.querySelector<HTMLElement>(".w4nps-shade")!.style.opacity = String(under);
      });
      box.toggleAttribute("data-scrolled", box.scrollTop > 8);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(paint); };
    box.addEventListener("scroll", onScroll, { passive: true });
    paint();

    let demo = 0, last = 0, pos = box.scrollTop, seen = true, done = !AUTO_PX_PER_SEC;
    const step = (now: number) => {
      const dt = last ? Math.min(now - last, 50) : 0;
      last = now;
      pos += (AUTO_PX_PER_SEC * dt) / 1000;
      if (pos >= box.scrollHeight - box.clientHeight) { done = true; demo = 0; return; }
      box.scrollTop = pos;
      demo = requestAnimationFrame(step);
    };
    const start = () => { if (!done && seen && !demo) { last = 0; demo = requestAnimationFrame(step); } };
    const stop = () => { cancelAnimationFrame(demo); demo = 0; };
    const handOver = () => { done = true; stop(); };
    const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; if (seen) start(); else stop(); });
    io.observe(box);
    const evs = ["wheel", "touchstart", "pointerdown", "keydown"] as const;
    evs.forEach((ev) => box.addEventListener(ev, handOver, { passive: true }));
    start();
    return () => {
      stop();
      cancelAnimationFrame(raf);
      io.disconnect();
      box.removeEventListener("scroll", onScroll);
      evs.forEach((ev) => box.removeEventListener(ev, handOver));
    };
  }, [reduce]);

  return (
    <section ref={boxRef} tabIndex={0} aria-label="How an install works, scrollable" className="w4nps-root">
      <style>{`
        .w4nps-root { height: 640px; overflow-y: auto; position: relative; background: #0f1d33; color: #eef1f6; scrollbar-width: thin; scrollbar-color: #2c3e5c transparent; }
        .w4nps-root:focus-visible { outline: 3px solid #f2b84b; outline-offset: -3px; }
        .w4nps-hint { position: sticky; top: 0; z-index: 20; height: 0; display: flex; justify-content: center; pointer-events: none; transition: opacity .4s ease; }
        .w4nps-hint span { margin-top: 6px; padding: 3px 12px; border-radius: 999px; background: #f2b84b; color: #0f1d33; font-size: 12px; font-weight: 600; letter-spacing: .04em; }
        .w4nps-root[data-scrolled] .w4nps-hint { opacity: 0; }
        .w4nps-card { position: sticky; }
        .w4nps-shade { position: absolute; inset: 0; border-radius: inherit; background: linear-gradient(#0f1d3300 ${PEEK}px, #0f1d3324); opacity: 0; pointer-events: none; }
        @media (prefers-reduced-motion: reduce) { .w4nps-body { opacity: 1 !important; } .w4nps-shade { opacity: 0 !important; } .w4nps-hint { display: none; } }
      `}</style>
      <div className="w4nps-hint" aria-hidden="true"><span>Scroll inside</span></div>
      <div className="mx-auto max-w-3xl px-5 pb-28 pt-12 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f2b84b]">Northpoint Solar</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">From first visit to switch on</h2>
          </div>
          <a href="#" className="inline-flex min-h-[44px] items-center rounded-lg bg-[#f2b84b] px-5 text-sm font-semibold text-[#0f1d33] transition hover:bg-[#f6c96f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1d33]">Book a roof survey</a>
        </div>
        <ol className="mt-10 grid gap-6">
          {steps.map((s, i) => (
            <li key={s.title} className="w4nps-card" style={{ top: BASE + i * PEEK }}>
              <article className="relative rounded-2xl bg-[#f4f1ea] text-[#13223b] shadow-[0_-12px_30px_-18px_rgba(0,0,0,0.6),0_24px_40px_-24px_rgba(0,0,0,0.6)]">
                <header className="flex h-16 items-center gap-4 border-b border-[#ddd6c8] px-6 sm:px-8">
                  <span className="font-mono text-sm font-semibold text-[#a05f00]">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="min-w-0 flex-1 truncate text-lg font-semibold">{s.title}</h3>
                  <span className="hidden text-sm text-[#4a5568] sm:inline">{s.time}</span>
                </header>
                <div className="w4nps-body grid gap-6 px-6 py-6 sm:grid-cols-[1.3fr_1fr] sm:px-8 sm:py-7">
                  <div>
                    <p className="text-sm font-medium text-[#4a5568] sm:hidden">{s.time}</p>
                    <p className="mt-1 text-[15px] leading-relaxed sm:mt-0">{s.text}</p>
                  </div>
                  <div className="rounded-xl bg-[#e9e3d6] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#4a5568]">You get</p>
                    <ul className="mt-2 grid gap-1.5 text-sm">
                      {s.gets.map((g) => <li key={g}>{g}</li>)}
                    </ul>
                  </div>
                </div>
                <span className="w4nps-shade" aria-hidden="true" />
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
