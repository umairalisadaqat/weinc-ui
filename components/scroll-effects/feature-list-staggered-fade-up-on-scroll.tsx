import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

const ITEMS = [
  { title: "Drivetrain deep clean", text: "Chain, cassette and rings come off and go through the parts washer, so grit leaves the bike instead of moving around it." },
  { title: "Brake bleed and pads", text: "Fresh fluid for hydraulic brakes, new pads where the old ones are under a millimetre, and rotors checked for warp." },
  { title: "Wheel truing", text: "Both wheels go on the stand and get trued and tensioned by hand until they spin straight and sound even." },
  { title: "Bearings and headset", text: "Hubs, bottom bracket and headset are felt for roughness and regreased or replaced, never just sprayed." },
  { title: "Cables and housing", text: "Gear and brake cables are replaced if frayed, and housing is cut square so shifting feels crisp again." },
  { title: "Every bolt torqued", text: "Stem, bars, seatpost and rotors are set with a torque wrench to the maker's figure, not by feel." },
  { title: "Tyres and sealant", text: "Tyres are checked for cuts, tubeless sealant is topped up, and pressures are set for how you actually ride." },
  { title: "Test ride and notes", text: "A mechanic rides it round the yard, then writes down what was done and what to watch over the next few months." },
];
const SPEED = 26; // demo scroll in px per second before anyone touches the box; 0 turns it off

export default function FeatureListStaggeredFadeUpOnScroll() {
  const rootRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let frame = 0;
    let last = 0;
    let pos = root.scrollTop;
    let seen = true;
    let done = !!reduce || !SPEED;
    const step = (t: number) => {
      const dt = last ? Math.min(t - last, 50) : 0;
      last = t;
      pos += (SPEED * dt) / 1000;
      if (pos >= root.scrollHeight - root.clientHeight) pos = 0;
      root.scrollTop = pos;
      frame = requestAnimationFrame(step);
    };
    const play = () => { if (!done && seen && !frame) { last = 0; frame = requestAnimationFrame(step); } };
    const stop = () => { cancelAnimationFrame(frame); frame = 0; };
    const vis = new IntersectionObserver(([e]) => { seen = e.isIntersecting; if (seen) play(); else stop(); });
    vis.observe(root);
    const hand = () => { done = true; stop(); root.setAttribute("data-touched", ""); };
    const evs = ["wheel", "touchstart", "pointerdown", "keydown"] as const;
    evs.forEach((n) => root.addEventListener(n, hand, { passive: true }));
    play();

    // Browsers without scroll-driven animations: reveal each item once as it enters the box.
    let io: IntersectionObserver | null = null;
    if (!reduce && !CSS.supports("animation-timeline: view()")) {
      root.setAttribute("data-fb", "");
      io = new IntersectionObserver((es) => es.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("w1fad-in"); io?.unobserve(e.target); }
      }), { root, rootMargin: "0px 0px -10% 0px" });
      root.querySelectorAll(".w1fad-r").forEach((el) => io?.observe(el));
    }
    return () => {
      stop();
      vis.disconnect();
      io?.disconnect();
      evs.forEach((n) => root.removeEventListener(n, hand));
    };
  }, [reduce]);

  return (
    <section
      ref={rootRef}
      tabIndex={0}
      aria-label="What a full service covers, scrollable"
      className="w1fad relative h-[620px] overflow-y-auto overflow-x-hidden bg-[#f4efe6] text-[#231d16] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[-3px] focus-visible:outline-[#a4471f]"
    >
      <style>{`
        .w1fad { scrollbar-width: thin; }
        .w1fad-hint span { transition: opacity .5s ease; }
        .w1fad[data-touched] .w1fad-hint span { opacity: 0; }
        @media (min-width: 720px) { .w1fad-r:nth-child(even) { --c: 5%; --cd: 120ms; } }
        .w1fad-r > :nth-child(2) { --k: 3%; --kd: 80ms; }
        .w1fad-r > :nth-child(3) { --k: 6%; --kd: 160ms; }
        @keyframes w1fad-up { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: none; } }
        @supports (animation-timeline: view()) {
          .w1fad-r { view-timeline: --w1fad-i block; }
          .w1fad:not([data-fb]) .w1fad-r > * { animation: w1fad-up linear both; animation-timeline: --w1fad-i;
            animation-range: cover calc(var(--c, 0%) + var(--k, 0%) + 2%) cover calc(var(--c, 0%) + var(--k, 0%) + 24%); }
        }
        .w1fad[data-fb] .w1fad-r > * { opacity: 0; transform: translateY(28px);
          transition: opacity .6s ease, transform .8s cubic-bezier(.2,.7,.2,1); transition-delay: calc(var(--cd, 0ms) + var(--kd, 0ms)); }
        .w1fad[data-fb] .w1fad-in > * { opacity: 1; transform: none; }
        @media (prefers-reduced-motion: reduce) {
          .w1fad .w1fad-r > *, .w1fad[data-fb] .w1fad-r > * { animation: none !important; opacity: 1; transform: none; transition: none; }
        }
      `}</style>
      <div className="w1fad-hint pointer-events-none sticky top-0 z-[3] flex h-0 items-start justify-end" aria-hidden="true">
        <span className="mr-3 mt-3 rounded-full bg-[#231d16]/80 px-3 py-[5px] text-xs tracking-wide text-[#f4efe6]">Scroll inside</span>
      </div>
      <div className="mx-auto max-w-5xl px-5 pb-20 pt-[72px] sm:px-10 sm:pb-24 sm:pt-[88px]">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a4471f]">Halden Cycle Works</p>
        <h2 className="mt-3.5 font-serif text-[clamp(2rem,5vw,3.25rem)] font-normal leading-[1.08] tracking-[-0.015em]">What a full service covers</h2>
        <p className="mt-[18px] max-w-[34rem] text-[17px] leading-relaxed text-[#4f4436]">
          Drop your bike off in the morning and collect it the same evening. Every full service runs through the same eight stations, in this order.
        </p>
        <ul className="mt-12 grid gap-x-16 md:grid-cols-2">
          {ITEMS.map((it, i) => (
            <li key={it.title} className="w1fad-r grid grid-cols-[52px_1fr] gap-x-2 border-t border-[#d9cfbf] pb-[30px] pt-[26px]">
              <span className="row-span-2 pt-1 text-[13px] font-bold tabular-nums text-[#a4471f]">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="text-[19px] font-semibold">{it.title}</h3>
              <p className="mt-2 text-[15.5px] leading-relaxed text-[#4f4436]">{it.text}</p>
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 rounded-2xl bg-[#ebe3d5] p-7">
          <p className="text-base leading-normal">Same-day turnaround when you drop off before ten.</p>
          <a href="#" className="inline-flex min-h-[46px] items-center rounded-full bg-[#231d16] px-[22px] text-[15px] font-semibold text-[#f4efe6] transition-colors hover:bg-[#3d3226] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#a4471f]">
            Book a full service
          </a>
        </div>
      </div>
    </section>
  );
}
