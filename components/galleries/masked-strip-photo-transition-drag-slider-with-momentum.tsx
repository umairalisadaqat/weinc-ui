import { useEffect, useRef } from "react";

const STRIPS = 6; // strips each photo is cut into
const FRICTION = 0.93; // speed kept each frame after release
const IDLE = 3000; // idle advance until the first interaction

const cabins = [
  { name: "The boathouse", text: "A jetty over the water and one room above the old boat bay. Sleeps two, from 140 a night.", src: "https://images.pexels.com/photos/19231583/pexels-photo-19231583.jpeg?auto=compress&cs=tinysrgb&w=1000", alt: "Wooden jetty leading to an old boathouse on a lake, framed by branches" },
  { name: "Pine Road pair", text: "Two cabins side by side on the forest track, good for families travelling together.", src: "https://images.pexels.com/photos/30550409/pexels-photo-30550409.jpeg?auto=compress&cs=tinysrgb&w=1000", alt: "Two wooden cabins beside a forest road under tall pines" },
  { name: "The stove room", text: "Pine walls, a hanging wood stove and a basket of split birch by the door.", src: "https://images.pexels.com/photos/33640978/pexels-photo-33640978.jpeg?auto=compress&cs=tinysrgb&w=1000", alt: "Cabin interior with a black wood stove, pine walls and soft curtains" },
  { name: "Winter lodges", text: "Open December to March, with snowshoes in the porch and the trail starting at the gate.", src: "https://images.pexels.com/photos/11148974/pexels-photo-11148974.jpeg?auto=compress&cs=tinysrgb&w=1000", alt: "Wooden cabins among snowy trees in winter" },
  { name: "Red cabin", text: "On the far shore below the hills, reached by a short gravel lane.", src: "https://images.pexels.com/photos/36707272/pexels-photo-36707272.jpeg?auto=compress&cs=tinysrgb&w=1000", alt: "A red cabin at the edge of a calm lake below misty green hills" },
];

export default function MaskedStripPhotoTransitionDragSlider() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const R = root.current;
    if (!R) return;
    const Q = (s: string) => Array.from(R.querySelectorAll<HTMLElement>(s));
    const st = Q(".w2cab-stage")[0], tr = Q(".w2cab-track")[0], ly = Q(".w2cab-layer"), it = Q(".w2cab-item"), bt = Q(".w2cab-btn") as HTMLButtonElement[], lv = Q(".w2cab-live")[0];
    const views = [st, tr.parentElement as HTMLElement];
    const n = it.length;
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let x = 0, v = 0, tx: number | null = 0, raf = 0, dn = false, sx = 0, x0 = 0, lt = 0, f = 1, cur = 0, vis = true, au = 0, stopped = false;
    const cl = (i: number) => Math.max(0, Math.min(n - 1, i));
    const show = (i: number) => {
      if (i === cur) return;
      // the new photo's strips slide in over the old one, which stays put underneath
      ly.forEach((l, k) => {
        l.className = "w2cab-layer absolute inset-0" + (k === i ? " w2cab-on" : k === cur ? " w2cab-was" : "");
        l.setAttribute("aria-hidden", String(k !== i));
      });
      it[cur].classList.remove("w2cab-on"); it[i].classList.add("w2cab-on");
      cur = i;
      bt[0].disabled = i === 0; bt[1].disabled = i === n - 1;
    };
    const loop = () => {
      raf = 0;
      const s = it[0].offsetWidth, m = -(n - 1) * s;
      if (!dn) {
        if (tx == null) { x += v; v *= FRICTION; if (x > 0 || x < m) v *= 0.6; if (Math.abs(v) < 0.5) tx = cl(Math.round(-x / s)); }
        if (tx != null) { const g = -tx * s; x = rm ? g : x + (g - x) * 0.16; if (Math.abs(g - x) < 0.5) x = g; }
      }
      const p = x > 0 ? x * 0.3 : x < m ? m + (x - m) * 0.3 : x;
      tr.style.transform = `translate3d(${p}px,0,0)`;
      show(cl(Math.round(-p / s)));
      if (vis && (dn || tx == null || x !== -tx * s)) raf = requestAnimationFrame(loop);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    const go = (i: number, say?: boolean) => {
      tx = cl(i); v = 0; kick();
      if (say) lv.textContent = `Slide ${tx + 1}: ${it[tx].children[1].textContent}`;
    };
    const stop = () => { clearTimeout(au); stopped = true; };
    const up = (e: PointerEvent) => { if (!dn) return; dn = false; if (rm || e.timeStamp - lt > 100) v = 0; tx = null; kick(); };
    const downs = views.map((el) => (e: PointerEvent) => {
      stop(); dn = true; sx = e.clientX; x0 = x; v = 0;
      f = it[0].offsetWidth / el.offsetWidth; // dragging the photo moves the text rail at its own scale
      el.setPointerCapture(e.pointerId); kick();
    });
    const move = (e: PointerEvent) => {
      if (!dn) return;
      const nx = x0 + (e.clientX - sx) * f;
      v = v * 0.5 + (nx - x) * 0.5; x = nx; lt = e.timeStamp; kick();
    };
    views.forEach((el, i) => {
      el.addEventListener("pointerdown", downs[i]); el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
    });
    const clicks = bt.map((b) => () => { stop(); go(cur + Number(b.dataset.d), true); });
    bt.forEach((b, i) => b.addEventListener("click", clicks[i]));
    const key = (e: KeyboardEvent) => {
      const i = e.key === "ArrowLeft" ? cur - 1 : e.key === "ArrowRight" ? cur + 1 : null;
      if (i == null) return;
      e.preventDefault(); stop(); go(i, true);
    };
    R.addEventListener("keydown", key); R.addEventListener("pointerenter", stop); R.addEventListener("focusin", stop);
    const tick = () => { if (stopped) return; if (vis) go((cur + 1) % n); au = window.setTimeout(tick, IDLE); };
    const start = () => { if (!stopped) au = window.setTimeout(tick, 2200); };
    if (!rm) { if (document.readyState === "complete") start(); else window.addEventListener("load", start); }
    const io = new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis) kick(); });
    io.observe(R);
    return () => {
      stop(); io.disconnect(); cancelAnimationFrame(raf); window.removeEventListener("load", start);
      views.forEach((el, i) => {
        el.removeEventListener("pointerdown", downs[i]); el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up);
      });
      bt.forEach((b, i) => b.removeEventListener("click", clicks[i]));
      R.removeEventListener("keydown", key); R.removeEventListener("pointerenter", stop); R.removeEventListener("focusin", stop);
    };
  }, []);

  return (
    <section ref={root} role="region" aria-roledescription="carousel" aria-label="Hollin Woods cabins" className="overflow-hidden bg-[#1d2720] px-4 py-12 text-[#efe8d8]">
      <style>{`
        .w2cab-stage { touch-action: pan-y; cursor: grab; user-select: none; }
        .w2cab-strip img { transform: translateY(101%); }
        .w2cab-strip:nth-child(even) img { transform: translateY(-101%); }
        .w2cab-was { z-index: 1; }
        .w2cab-was .w2cab-strip img { transform: none; }
        .w2cab-on { z-index: 2; }
        .w2cab-on .w2cab-strip img, .w2cab-on .w2cab-strip:nth-child(even) img { transform: none; transition: transform .8s cubic-bezier(.7,0,.2,1); }
        .w2cab-view { touch-action: pan-y; cursor: grab; }
        .w2cab-track { will-change: transform; }
        .w2cab-item { opacity: .3; transition: opacity .4s; user-select: none; }
        .w2cab-item.w2cab-on { opacity: 1; }
        .w2cab-btn:disabled { opacity: .3; cursor: default; }
        .w2cab-btn:focus-visible, .w2cab-stage:focus-visible { outline: 2px solid #b9c48f; outline-offset: 3px; }
        @media (prefers-reduced-motion: reduce) { .w2cab-on .w2cab-strip img, .w2cab-on .w2cab-strip:nth-child(even) img, .w2cab-item { transition: none; } }
      `}</style>
      <div className="mx-auto grid max-w-[1040px] grid-cols-[minmax(0,1fr)] items-center gap-8 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] md:gap-14">
        <div className="w2cab-stage relative aspect-square md:aspect-[4/5] max-h-[600px] w-full overflow-hidden rounded-md bg-[#2c3a30]" tabIndex={0}>
          {cabins.map((c, k) => (
            <div key={c.src} className={`w2cab-layer absolute inset-0${k === 0 ? " w2cab-on" : ""}`} aria-hidden={k !== 0}>
              {Array.from({ length: STRIPS }, (_, i) => (
                // each strip is a window onto a full-width copy of the photo
                <div key={i} className="w2cab-strip absolute inset-y-0 overflow-hidden" style={{ left: `${(i * 100) / STRIPS}%`, width: `calc(${100 / STRIPS}% + 1px)` }}>
                  <img src={c.src} alt={i === 0 ? c.alt : ""} draggable={false} className="absolute top-0 h-full max-w-none object-cover" style={{ left: `${-i * 100}%`, width: `${STRIPS * 100}%`, transitionDelay: `${i * 70}ms` }} />
                </div>
              ))}
            </div>
          ))}
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b9c48f]">Hollin Woods Cabins</p>
          <h2 className="mb-7 mt-3 font-serif text-[28px] font-medium leading-tight sm:text-[40px]">Five places to stay quiet for a while</h2>
          <div className="w2cab-view overflow-hidden border-t border-[#efe8d8]/20">
            <ol className="w2cab-track m-0 flex list-none p-0">
              {cabins.map((c, i) => (
                <li key={c.name} className={`w2cab-item box-border shrink-0 grow-0 basis-full pb-2 pr-6 pt-[22px]${i === 0 ? " w2cab-on" : ""}`} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${cabins.length}`}>
                  <span className="text-xs font-semibold tracking-[0.12em] text-[#b9c48f]">{`0${i + 1} / 0${cabins.length}`}</span>
                  <h3 className="mt-2.5 font-serif text-[26px] font-medium leading-snug">{c.name}</h3>
                  <p className="mt-2.5 max-w-md text-[15px] leading-relaxed text-[#cfc8b8]">{c.text}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-6 flex gap-2.5">
            {[-1, 1].map((d) => (
              <button key={d} type="button" data-d={d} disabled={d < 0} aria-label={d < 0 ? "Previous slide" : "Next slide"} className="w2cab-btn grid h-12 w-12 place-items-center rounded-full border border-[#efe8d8]/35 hover:bg-[#efe8d8]/10">
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d={d < 0 ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} fill="none" stroke="currentColor" strokeWidth="2" /></svg>
              </button>
            ))}
          </div>
          <p className="w2cab-live sr-only" aria-live="polite" />
        </div>
      </div>
    </section>
  );
}
