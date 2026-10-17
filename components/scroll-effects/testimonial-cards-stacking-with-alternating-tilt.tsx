import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

const reviews = [
  { quote: "They planted our north bed with ferns and hellebores I would never have picked. Two winters on, it is the part of the garden people ask about.", name: "Imogen Barlow", role: "Garden in Hebden Bridge", initials: "IB", tone: "#c9d8b6" },
  { quote: "The hedge plan came with a watering note pinned to every whip. Not one plant lost in a dry summer, which I did not think possible on our clay.", name: "Dev Rathore", role: "Allotment holder", initials: "DR", tone: "#e6cfa6" },
  { quote: "I asked for low upkeep and they listened. The meadow strip gets one cut in September and looks better every year it is left alone.", name: "Ruth Ellery", role: "Cottage garden, Malton", initials: "RE", tone: "#d9b9a3" },
  { quote: "Clear prices, a day booked and kept, and they swept the path before leaving. Small things, but they are why we called them back.", name: "Tomas Lindqvist", role: "Courtyard in York", initials: "TL", tone: "#bcd2cf" },
];
const TILT_REST = 1.6; // degrees each card keeps once settled (alternates left and right)
const TILT_ARRIVE = 3.5; // extra tilt while a card is still sliding in
const SCALE_STEP = 0.045; // shrink per card on top
const AUTO_PX_PER_SEC = 30; // demo scroll speed; 0 turns it off

export default function TestimonialCardsStackingWithAlternatingTilt() {
  const reduce = useReducedMotion();
  const boxRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    if (!box || reduce) return;
    const cards = Array.from(box.querySelectorAll<HTMLElement>(".w4tst-card"));
    let raf = 0;
    const paint = () => {
      raf = 0;
      const top = box.getBoundingClientRect().top;
      const cover = cards.map((c) => {
        const d = c.getBoundingClientRect().top - top - parseFloat(getComputedStyle(c).top);
        return Math.min(1, Math.max(0, 1 - d / c.offsetHeight));
      });
      cards.forEach((c, i) => {
        let depth = 0;
        for (let j = i + 1; j < cards.length; j++) depth += cover[j];
        const turn = (i % 2 ? 1 : -1) * (TILT_REST + TILT_ARRIVE * (1 - cover[i]));
        (c.firstElementChild as HTMLElement).style.transform = `rotate(${turn}deg) scale(${1 - SCALE_STEP * depth})`;
        c.querySelector<HTMLElement>(".w4tst-shade")!.style.opacity = String(Math.min(0.5, 0.22 * depth));
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
    <section ref={boxRef} tabIndex={0} aria-label="Customer reviews, scrollable" className="w4tst-root">
      <style>{`
        .w4tst-root { height: 620px; overflow-y: auto; overflow-x: hidden; position: relative; background: #1e3a2c; color: #f4efe3; scrollbar-width: thin; scrollbar-color: #47624f transparent; }
        .w4tst-root:focus-visible { outline: 3px solid #e6cfa6; outline-offset: -3px; }
        .w4tst-hint { position: sticky; top: 0; z-index: 20; height: 0; display: flex; justify-content: center; pointer-events: none; transition: opacity .4s ease; }
        .w4tst-hint span { margin-top: 10px; padding: 4px 12px; border-radius: 999px; background: rgba(244,239,227,.92); color: #1e3a2c; font-size: 12px; letter-spacing: .04em; }
        .w4tst-root[data-scrolled] .w4tst-hint { opacity: 0; }
        .w4tst-card { position: sticky; top: 56px; }
        .w4tst-face { transform-origin: 50% 40%; will-change: transform; }
        .w4tst-card:nth-child(odd) .w4tst-face { transform: rotate(-1.6deg); }
        .w4tst-card:nth-child(even) .w4tst-face { transform: rotate(1.6deg); }
        .w4tst-shade { position: absolute; inset: 0; border-radius: inherit; background: #0c1a12; opacity: 0; pointer-events: none; }
        @media (prefers-reduced-motion: reduce) { .w4tst-shade { opacity: 0 !important; } .w4tst-hint { display: none; } }
      `}</style>
      <div className="w4tst-hint" aria-hidden="true"><span>Scroll inside</span></div>
      <div className="mx-auto max-w-2xl px-6 pb-24 pt-12">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e6cfa6]">Brackenfold Gardens</p>
        <h2 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">Notes from the people whose gardens we planted</h2>
        <ul className="mt-10 grid gap-8">
          {reviews.map((r) => (
            <li key={r.name} className="w4tst-card">
              <figure className="w4tst-face relative m-0 rounded-2xl bg-[#f6f1e4] p-7 text-[#1f2a22] shadow-[0_28px_50px_-24px_rgba(0,0,0,0.6)] sm:p-9">
                <svg viewBox="0 0 32 24" className="h-6 w-8 text-[#5b7a52]" aria-hidden="true"><path fill="currentColor" d="M0 24V14C0 6 4 1 12 0l1 4c-4 1-6 4-6 8h6v12H0zm19 0V14c0-8 4-13 12-14l1 4c-4 1-6 4-6 8h6v12H19z" /></svg>
                <blockquote className="mt-5 font-serif text-xl leading-relaxed sm:text-2xl">{r.quote}</blockquote>
                <figcaption className="mt-7 flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full text-sm font-semibold text-[#1f2a22]" style={{ background: r.tone }} aria-hidden="true">{r.initials}</span>
                  <span><span className="block font-semibold">{r.name}</span><span className="block text-sm text-[#55604f]">{r.role}</span></span>
                </figcaption>
                <span className="w4tst-shade" aria-hidden="true" />
              </figure>
            </li>
          ))}
        </ul>
        <a href="#" className="mt-14 inline-flex min-h-[44px] items-center rounded-full bg-[#e6cfa6] px-6 text-sm font-semibold text-[#1e3a2c] transition hover:bg-[#f0dcb8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f4efe3] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1e3a2c]">Book a garden visit</a>
      </div>
    </section>
  );
}
