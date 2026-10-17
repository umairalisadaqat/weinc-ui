import { useEffect, useRef } from "react";

const THROW = 0.35; // drag past this share of the card width and it flies off
const FLICK = 9; // or release faster than this (px per frame)
const IDLE = 3000; // idle advance until the first interaction

const plants = [
  { name: "Monstera", note: "Deliciosa, 70 cm", price: "38.00", src: "https://images.pexels.com/photos/12014192/pexels-photo-12014192.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Monstera plant on a black stand beside a sunny window" },
  { name: "Snake plant", note: "White pot, 45 cm", price: "24.00", src: "https://images.pexels.com/photos/29218657/pexels-photo-29218657.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Snake plant in a white ribbed pot on a red table" },
  { name: "Barrel cactus", note: "12 cm terracotta", price: "12.50", src: "https://images.pexels.com/photos/12683407/pexels-photo-12683407.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Small round cactus in a terracotta pot by an open window" },
  { name: "Boston fern", note: "Likes it damp", price: "19.00", src: "https://images.pexels.com/photos/10903261/pexels-photo-10903261.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Lush potted ferns in terracotta in soft sunlight" },
  { name: "Terracotta trio", note: "Three small pots", price: "31.00", src: "https://images.pexels.com/photos/35920773/pexels-photo-35920773.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "A group of leafy plants in terracotta pots on a wooden table" },
];

export default function FlickAwayStackedCardDeckSlider() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const R = root.current;
    if (!R) return;
    const dk = R.querySelector<HTMLElement>(".w2dek-deck")!;
    const cs = Array.from(R.querySelectorAll<HTMLElement>(".w2dek-card"));
    const bt = Array.from(R.querySelectorAll<HTMLButtonElement>(".w2dek-btn"));
    const lv = R.querySelector<HTMLElement>(".w2dek-live")!, ct = R.querySelector<HTMLElement>(".w2dek-count")!;
    const n = cs.length;
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let od = cs.slice(), x = 0, v = 0, raf = 0, dn = false, fly = false, sx = 0, x0 = 0, lt = 0, mv = false, vis = true, au = 0, stopped = false, announce = false;
    const pos = (c: HTMLElement, d: number, t?: boolean) => {
      c.style.transition = t ? "" : "none";
      c.style.zIndex = String(n - d);
      c.style.opacity = d > 3 ? "0" : "1";
      c.inert = d > 0;
      c.style.transform = `translate3d(0,${d * 16}px,0) scale(${1 - d * 0.05})`;
    };
    const lay = (t?: boolean) => {
      if (t != null) od.forEach((c, d) => { if (d > 1) pos(c, d, t); });
      const c = od[0], p = Math.min(Math.abs(x) / dk.offsetWidth, 1);
      c.inert = false; c.style.zIndex = String(n); c.style.opacity = "1";
      c.style.transition = t ? "" : "none";
      c.style.transform = `translate3d(${x}px,${Math.abs(x) * 0.06}px,0) rotate(${x * 0.04}deg)`;
      // the next card rises toward the top as the top one leaves
      od[1].style.transition = t ? "" : "none";
      od[1].style.transform = `translate3d(0,${16 * (1 - p)}px,0) scale(${0.95 + 0.05 * p})`;
    };
    const say = () => {
      const i = cs.indexOf(od[0]);
      ct.textContent = `${i + 1} / ${n}`;
      return `Plant ${i + 1} of ${n}: ${od[0].querySelector("h3")!.textContent}`;
    };
    const loop = () => {
      raf = 0;
      const w = dk.offsetWidth;
      if (!dn) {
        if (fly) {
          x += v; v *= 1.02;
          if (Math.abs(x) > w * 1.7) {
            od = [...od.slice(1), od[0]];
            x = 0; v = 0; fly = false;
            pos(od[n - 1], n - 1);
            const t = say();
            if (announce) lv.textContent = t; // announce once the thrown card has gone
            announce = false; lay(true); return;
          }
        } else {
          v = (v + (0 - x) * 0.12) * 0.74; x += v; // spring back to the centre
          if (Math.abs(x) < 0.5 && Math.abs(v) < 0.5) { x = 0; lay(true); return; }
        }
      }
      lay();
      raf = requestAnimationFrame(loop);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    const next = () => {
      if (rm) { od = [...od.slice(1), od[0]]; say(); lay(false); return; }
      fly = true; v = FLICK * 2; kick();
    };
    const prev = () => {
      od = [od[n - 1], ...od.slice(0, n - 1)]; say();
      if (rm) { lay(false); return; }
      x = -dk.offsetWidth * 1.4; fly = false; v = 0; lay(true); kick();
    };
    const stop = () => { clearTimeout(au); stopped = true; };
    const go = (d: number) => { stop(); if (d > 0) next(); else prev(); if (d < 0 || rm) lv.textContent = say(); else announce = true; };
    dk.onpointerdown = (e) => { if (fly) return; stop(); dn = true; mv = false; sx = e.clientX; x0 = x; v = 0; kick(); };
    dk.onpointermove = (e) => {
      if (!dn) return;
      const d = e.clientX - sx;
      if (Math.abs(d) > 6 && !mv) { mv = true; dk.setPointerCapture(e.pointerId); } // capture once it is a drag, so a tap still opens the link
      v = v * 0.5 + (x0 + d - x) * 0.5; x = x0 + d; lt = e.timeStamp; kick();
    };
    dk.onpointerup = dk.onpointercancel = (e) => {
      if (!dn) return;
      dn = false;
      if (e.timeStamp - lt > 100) v = 0;
      if (Math.abs(x) > dk.offsetWidth * THROW || Math.abs(v) > FLICK) {
        if (rm) { x = 0; next(); } else { fly = true; v = (x < 0 ? -1 : 1) * Math.max(Math.abs(v), FLICK); }
      } else if (rm) x = 0;
      kick();
    };
    const click = (e: MouseEvent) => { if (mv) { e.preventDefault(); e.stopPropagation(); } }; // a drag is not a click
    dk.addEventListener("click", click, true);
    bt.forEach((b) => { b.onclick = () => go(Number(b.dataset.d)); });
    R.onkeydown = (e) => { const d = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : 0; if (d) { e.preventDefault(); go(d); } };
    R.onpointerenter = stop;
    R.addEventListener("focusin", stop);
    const tick = () => { if (stopped) return; if (vis && !fly) next(); au = window.setTimeout(tick, IDLE); };
    const start = () => { if (!stopped) au = window.setTimeout(tick, 2200); };
    const io = new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (!vis) { cancelAnimationFrame(raf); raf = 0; } else if (fly || x) kick(); });
    io.observe(R);
    lay(false);
    if (!rm) { if (document.readyState === "complete") start(); else window.addEventListener("load", start); }
    return () => {
      stop(); io.disconnect(); cancelAnimationFrame(raf); window.removeEventListener("load", start);
      dk.onpointerdown = dk.onpointermove = dk.onpointerup = dk.onpointercancel = null;
      dk.removeEventListener("click", click, true);
      bt.forEach((b) => { b.onclick = null; });
      R.onkeydown = null; R.onpointerenter = null; R.removeEventListener("focusin", stop);
    };
  }, []);

  return (
    <section ref={root} role="region" aria-roledescription="carousel" aria-label="Fernhall plants this week" className="overflow-hidden bg-[#ede3d1] px-4 pb-[72px] pt-14 text-[#2e2a22]">
      <style>{`
        .w2dek-deck { touch-action: pan-y; user-select: none; }
        .w2dek-card { transition: transform .45s cubic-bezier(.2,.8,.2,1), opacity .45s; cursor: grab; will-change: transform; transform-origin: 50% 100%; box-shadow: 0 18px 36px -22px rgba(50,40,20,.5); }
        .w2dek-btn:focus-visible, .w2dek-card a:focus-visible { outline: 2px solid #5d6a2c; outline-offset: 3px; }
        .w2dek-info > * { transition: opacity .3s; }
        .w2dek-card[inert] .w2dek-info > * { opacity: 0; }
        @media (prefers-reduced-motion: reduce) { .w2dek-card { transition: none; } }
      `}</style>
      <div className="mx-auto grid max-w-[980px] grid-cols-[minmax(0,1fr)] items-center gap-10 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#5d6a2c]">Fernhall Plant Shop</p>
          <h2 className="mt-3 font-serif text-[30px] font-semibold leading-tight sm:text-[44px]">On the bench this week</h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-[#5a5245]">Flick the top card away to see the next plant, or use the arrows. Every plant is potted in our back room on Harrow Lane.</p>
          <div className="mt-7 flex items-center gap-2.5">
            {[-1, 1].map((d) => (
              <button key={d} type="button" data-d={d} aria-label={d < 0 ? "Previous plant" : "Next plant"} className="w2dek-btn grid h-12 w-12 place-items-center rounded-full bg-[#2e2a22] text-[#ede3d1] hover:bg-[#4a4437]">
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d={d < 0 ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} fill="none" stroke="currentColor" strokeWidth="2" /></svg>
              </button>
            ))}
            <span className="w2dek-count ml-2 text-sm font-semibold tabular-nums text-[#5a5245]" aria-hidden="true">1 / {plants.length}</span>
          </div>
        </div>
        <div className="w2dek-deck relative mx-auto h-[490px] w-[300px] max-w-full">
          {plants.map((p, i) => (
            <article key={p.name} className="w2dek-card absolute inset-x-0 top-0 h-[440px] overflow-hidden rounded-[18px] bg-[#fbf7ef]" role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${plants.length}`}>
              <img src={p.src} alt={p.alt} draggable={false} className="pointer-events-none block h-[330px] w-full object-cover" />
              <div className="w2dek-info flex h-[110px] items-center justify-between gap-2.5 pl-[18px] pr-3.5">
                <div>
                <h3 className="font-serif text-xl font-semibold">{p.name}</h3>
                <p className="mt-0.5 text-[13px] text-[#5a5245]">{p.note}</p>
                </div>
                <a href="#" className="inline-flex flex-none min-h-[40px] items-center gap-2 rounded-full bg-[#e7dcc6] px-3.5 text-[13px] font-semibold">View plant <span className="text-[#5d6a2c]">{p.price}</span></a>
              </div>
            </article>
          ))}
        </div>
        <p className="w2dek-live sr-only" aria-live="polite" />
      </div>
    </section>
  );
}
