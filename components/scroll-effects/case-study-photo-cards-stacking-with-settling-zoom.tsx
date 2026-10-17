import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

const projects = [
  { kind: "Restaurant fit-out", title: "Cedar Row Kitchen", text: "A dark former print shop became a dining room of warm timber, with a sunken courtyard and a ceiling of slatted pine to soften the noise of a full Friday.", facts: ["Lisbon", "Interior and joinery", "2025"], img: "https://images.pexels.com/photos/14590691/pexels-photo-14590691.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Restaurant interior with a slatted pine ceiling, round wooden tables and dark metal chairs" },
  { kind: "Workshop", title: "Kilnhouse Ceramics", text: "We fitted out a working pottery with deep oak shelving for drying ware, a wash station by the window and storage that keeps finished pieces out of the dust.", facts: ["Porto", "Shelving and layout", "2024"], img: "https://images.pexels.com/photos/15122649/pexels-photo-15122649.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "A potter placing a wrapped bowl on tall wooden shelves in a bright ceramics studio" },
  { kind: "Private house", title: "Ashgrove Residence", text: "A family home of pale stone and dark framing, set behind a low garden of clipped trees so the street side stays quiet and green through the year.", facts: ["Coimbra", "Facade and landscape", "2025"], img: "https://images.pexels.com/photos/18273285/pexels-photo-18273285.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Modern two-storey house with stone cladding, a black gate and young trees in the front garden" },
];
const SCALE_STEP = 0.07; // shrink per covering card
const DIM_STEP = 0.3; // darkness per covering card
const ZOOM = 0.1; // extra photo zoom while a card is still arriving
const AUTO_PX_PER_SEC = 0; // demo scroll speed; 0 turns it off

export default function CaseStudyPhotoCardsStackingWithSettlingZoom() {
  const reduce = useReducedMotion();
  const boxRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    if (!box || reduce) return;
    const cards = Array.from(box.querySelectorAll<HTMLElement>(".w4ccp-card"));
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
        (c.firstElementChild as HTMLElement).style.transform = `scale(${1 - SCALE_STEP * depth})`;
        c.querySelector<HTMLElement>(".w4ccp-shade")!.style.opacity = String(Math.min(0.6, DIM_STEP * depth));
        c.querySelector<HTMLElement>("img")!.style.transform = `scale(${1 + ZOOM * (1 - cover[i])})`;
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
    <section ref={boxRef} tabIndex={0} aria-label="Selected projects, scrollable" className="w4ccp-root">
      <style>{`
        .w4ccp-root { height: 660px; overflow-y: auto; position: relative; background: #ebe2d3; color: #2d221b; scrollbar-width: thin; scrollbar-color: #c7b79f transparent; }
        .w4ccp-root:focus-visible { outline: 3px solid #9c4a2c; outline-offset: -3px; }
        .w4ccp-hint { position: sticky; top: 0; z-index: 20; height: 0; display: flex; justify-content: center; pointer-events: none; transition: opacity .4s ease; }
        .w4ccp-hint span { margin-top: 10px; padding: 4px 12px; border-radius: 999px; background: rgba(45,34,27,.85); color: #faf6ef; font-size: 12px; letter-spacing: .04em; }
        .w4ccp-root[data-scrolled] .w4ccp-hint { opacity: 0; }
        .w4ccp-card { position: sticky; top: 28px; }
        .w4ccp-face { transform-origin: 50% 0; will-change: transform; }
        .w4ccp-face img { transform: scale(1.1); will-change: transform; }
        .w4ccp-shade { position: absolute; inset: 0; border-radius: inherit; background: #1d150f; opacity: 0; pointer-events: none; }
        @media (prefers-reduced-motion: reduce) { .w4ccp-face, .w4ccp-face img { transform: none !important; } .w4ccp-shade { opacity: 0 !important; } .w4ccp-hint { display: none; } }
      `}</style>
      <div className="w4ccp-hint" aria-hidden="true"><span>Scroll inside</span></div>
      <div className="mx-auto max-w-5xl px-5 pb-20 pt-10 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a3f24]">Fenwick and Oduya, studio</p>
            <h2 className="mt-2 font-serif text-3xl leading-tight sm:text-4xl">Rooms we finished recently</h2>
          </div>
          <a href="#" className="inline-flex min-h-[44px] items-center rounded-full border border-[#2d221b] px-5 text-sm font-semibold transition hover:bg-[#2d221b] hover:text-[#faf6ef] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9c4a2c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ebe2d3]">All projects</a>
        </div>
        <ul className="mt-8 grid gap-6">
          {projects.map((p, n) => (
            <li key={p.title} className="w4ccp-card">
              <article className="w4ccp-face relative grid overflow-hidden rounded-3xl bg-[#faf6ef] shadow-[0_30px_60px_-30px_rgba(45,34,27,0.55)] md:grid-cols-[1.15fr_1fr]">
                <div className="aspect-[16/10] overflow-hidden md:aspect-auto md:h-[440px]">
                  <img src={p.img} alt={p.alt} loading={n === 0 ? "eager" : "lazy"} width={1200} height={800} className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-col p-6 sm:p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8a3f24]">{p.kind}</p>
                  <h3 className="mt-2 font-serif text-2xl sm:text-3xl">{p.title}</h3>
                  <p className="mt-3 text-[15px] leading-relaxed text-[#5b4a3d]">{p.text}</p>
                  <dl className="mt-6 grid md:mt-auto grid-cols-3 gap-3 border-t border-[#e2d6c3] pt-5 text-sm">
                    {["Place", "Scope", "Year"].map((k, i) => (
                      <div key={k}><dt className="text-xs text-[#6b5847]">{k}</dt><dd className="mt-1 font-medium">{p.facts[i]}</dd></div>
                    ))}
                  </dl>
                </div>
                <span className="w4ccp-shade" aria-hidden="true" />
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
