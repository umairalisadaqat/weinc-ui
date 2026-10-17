import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

const days = [
  { day: "Day 1", title: "Ashby Gate to Fellmoor", km: "16 km", climb: "340 m up", text: "A gentle start along the old drove road, through two farms and over a stone stile into open moor.", stay: "Fellmoor bunkhouse" },
  { day: "Day 2", title: "Fellmoor to Tarn Hollow", km: "19 km", climb: "520 m up", text: "The longest climb of the week, rewarded with lunch beside a still tarn and a slow walk down.", stay: "The Hollow Inn" },
  { day: "Day 3", title: "Tarn Hollow to Brindle", km: "12 km", climb: "180 m up", text: "A short, easy day through beech woods with time for the village bakery before it closes.", stay: "Mill House rooms" },
  { day: "Day 4", title: "Brindle to Hawes Edge", km: "21 km", climb: "610 m up", text: "Ridge walking with wide views both ways. Carry water; there is no village until the end.", stay: "Edge Farm barn" },
  { day: "Day 5", title: "Hawes Edge to Kirkby", km: "14 km", climb: "90 m up", text: "Downhill nearly all the way to the market square, with a train home from the station.", stay: "Your own bed" },
];
const PEEK = 56; // least amount of the next card that shows at the right edge
const STEP_PX = 380; // scroll distance that brings in one card
const AUTO_PX_PER_SEC = 60; // demo scroll speed; 0 turns it off

export default function HorizontalCardDeckStackingSidewaysInPinnedSection() {
  const reduce = useReducedMotion();
  const boxRef = useRef<HTMLElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    const deck = deckRef.current;
    if (!box || !deck || reduce) return;
    const cards = Array.from(deck.querySelectorAll<HTMLElement>(".w4hds-card"));
    const n = cards.length;
    let raf = 0;
    const paint = () => {
      raf = 0;
      const p = Math.min(n - 1, Math.max(0, box.scrollTop / STEP_PX));
      const w = deck.clientWidth;
      const cw = cards[0].offsetWidth;
      const off = Math.min(28, Math.max(0, (w - cw - 8) / (n - 1)));
      const wait = Math.min(w - PEEK, cw + 40); // where the next card waits
      const enter = cards.map((_, k) => (k ? Math.min(1, p - (k - 1)) : 1));
      cards.forEach((c, k) => {
        const e = enter[k];
        const target = k * off;
        const ease = e > 0 ? 1 - Math.pow(1 - e, 3) : 0;
        const x = e <= 0 ? w - (w - wait) * Math.max(0, 1 + e) : wait + (target - wait) * ease;
        let depth = 0;
        for (let j = k + 1; j < n; j++) depth += Math.max(0, enter[j]);
        c.style.transform = `translateX(${x}px) scale(${1 - 0.05 * depth})`;
        c.querySelector<HTMLElement>(".w4hds-shade")!.style.opacity = String(Math.min(0.55, 0.22 * depth));
      });
      box.toggleAttribute("data-scrolled", box.scrollTop > 8);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(paint); };
    box.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(onScroll);
    ro.observe(deck);
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
      ro.disconnect();
      box.removeEventListener("scroll", onScroll);
      evs.forEach((ev) => box.removeEventListener(ev, handOver));
    };
  }, [reduce]);

  return (
    <section ref={boxRef} tabIndex={0} aria-label="Five day walking route, scrollable" className="w4hds-root">
      <style>{`
        .w4hds-root { height: 620px; overflow-y: auto; overflow-x: hidden; position: relative; background: #6e3020; color: #f8efe3; scrollbar-width: thin; scrollbar-color: #9a5a44 transparent; }
        .w4hds-root:focus-visible { outline: 3px solid #f3c99b; outline-offset: -3px; }
        .w4hds-track { height: calc(620px + ${(days.length - 1) * STEP_PX}px); }
        .w4hds-stage { position: sticky; top: 0; height: 620px; overflow: hidden; }
        .w4hds-hint { position: absolute; top: 10px; left: 0; right: 0; z-index: 20; display: flex; justify-content: center; pointer-events: none; transition: opacity .4s ease; }
        .w4hds-hint span { padding: 4px 12px; border-radius: 999px; background: #f8efe3; color: #6e3020; font-size: 12px; font-weight: 600; letter-spacing: .04em; }
        .w4hds-root[data-scrolled] .w4hds-hint { opacity: 0; }
        .w4hds-deck { overflow: hidden; }
        .w4hds-card { position: absolute; left: 0; top: 0; will-change: transform; transform-origin: 0 50%; }
        .w4hds-card:not(:first-child) { transform: translateX(200%); }
        .w4hds-shade { position: absolute; inset: 0; border-radius: inherit; background: #2a120b; opacity: 0; pointer-events: none; }
        @media (prefers-reduced-motion: reduce) {
          .w4hds-track { height: auto; } .w4hds-stage { position: static; height: auto; } .w4hds-hint { display: none; }
          .w4hds-deck { display: flex; gap: 16px; overflow-x: auto; height: auto !important; padding-bottom: 12px; }
          .w4hds-card { position: relative; flex: 0 0 min(85%, 340px); transform: none !important; }
        }
      `}</style>
      <div className="w4hds-track">
        <div className="w4hds-stage">
          <div className="w4hds-hint" aria-hidden="true"><span>Scroll inside</span></div>
          <div className="mx-auto grid h-full max-w-6xl content-center gap-6 px-5 py-6 md:grid-cols-[260px_minmax(0,1fr)] md:items-center md:gap-10 md:px-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f3c99b]">Coldharbour Walks</p>
              <h2 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">The Hollin Way in five days</h2>
              <p className="mt-3 hidden text-[15px] leading-relaxed text-[#ecd9c6] md:block">Bags carried between stops, rooms booked, a map for each morning. You only walk.</p>
              <a href="#" className="mt-5 inline-flex min-h-[44px] items-center rounded-full bg-[#f8efe3] px-5 text-sm font-semibold text-[#6e3020] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3c99b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#6e3020]">Check spring dates</a>
            </div>
            <div ref={deckRef} className="w4hds-deck relative h-[330px] md:h-[380px]">
              {days.map((d) => (
                <article key={d.day} className="w4hds-card flex h-[320px] w-[min(calc(100%_-_56px),420px)] flex-col rounded-3xl bg-[#fbf5ec] p-6 text-[#3a1d14] shadow-[-18px_0_40px_-24px_rgba(0,0,0,0.6)] sm:p-8 md:h-[380px]">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a4a2e]">{d.day}</p>
                  <h3 className="mt-2 font-serif text-2xl leading-snug sm:text-[28px]">{d.title}</h3>
                  <div className="mt-4 flex gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-[#f1e2d0] px-3 py-1">{d.km}</span>
                    <span className="rounded-full bg-[#f1e2d0] px-3 py-1">{d.climb}</span>
                  </div>
                  <p className="mt-4 text-[15px] leading-relaxed text-[#5c3a2d]">{d.text}</p>
                  <p className="mt-auto border-t border-[#ead8c4] pt-4 text-sm"><span className="text-[#7a5444]">Overnight: </span><span className="font-semibold">{d.stay}</span></p>
                  <span className="w4hds-shade" aria-hidden="true" />
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
