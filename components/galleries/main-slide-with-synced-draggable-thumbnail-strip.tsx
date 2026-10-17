import { useEffect, useRef } from "react";

const FRICTION = 0.93; // speed kept each frame after release
const RUBBER = 0.3; // stretch past the ends of either rail
const IDLE = 3000; // idle advance until the first interaction

const pieces = [
  { name: "Spindle back chair", note: "Cherry with a linen pad, 340.00", src: "https://images.pexels.com/photos/28529915/pexels-photo-28529915.jpeg?auto=compress&cs=tinysrgb&w=1400", thumb: "https://images.pexels.com/photos/28529915/pexels-photo-28529915.jpeg?auto=compress&cs=tinysrgb&w=300", alt: "Wooden spindle back chair with a white seat cushion in a sunlit room" },
  { name: "Three-seat sofa", note: "Grey woven cover, 2,150.00", src: "https://images.pexels.com/photos/6758245/pexels-photo-6758245.jpeg?auto=compress&cs=tinysrgb&w=1400", thumb: "https://images.pexels.com/photos/6758245/pexels-photo-6758245.jpeg?auto=compress&cs=tinysrgb&w=300", alt: "Grey three-seat sofa with patterned cushions in front of a leafy mural" },
  { name: "Ring vase and globe lamp", note: "Matte ceramic and opal glass, 95.00 and 160.00", src: "https://images.pexels.com/photos/6952339/pexels-photo-6952339.jpeg?auto=compress&cs=tinysrgb&w=1400", thumb: "https://images.pexels.com/photos/6952339/pexels-photo-6952339.jpeg?auto=compress&cs=tinysrgb&w=300", alt: "White ring vase with dried grass beside a glass globe lamp on a white table" },
  { name: "Pleated shade lamp", note: "Brass base, warm bulb, 210.00", src: "https://images.pexels.com/photos/36799079/pexels-photo-36799079.jpeg?auto=compress&cs=tinysrgb&w=1400", thumb: "https://images.pexels.com/photos/36799079/pexels-photo-36799079.jpeg?auto=compress&cs=tinysrgb&w=300", alt: "Table lamp with a pleated shade glowing in a cosy living room corner" },
  { name: "Stoneware tableware", note: "Speckled white glaze, from 18.00", src: "https://images.pexels.com/photos/14341984/pexels-photo-14341984.jpeg?auto=compress&cs=tinysrgb&w=1400", thumb: "https://images.pexels.com/photos/14341984/pexels-photo-14341984.jpeg?auto=compress&cs=tinysrgb&w=300", alt: "Speckled white stoneware plates, bowls and mugs laid out on linen" },
  { name: "Glazed mugs and plates", note: "Twelve colours, from 14.00", src: "https://images.pexels.com/photos/38243203/pexels-photo-38243203.jpeg?auto=compress&cs=tinysrgb&w=1400", thumb: "https://images.pexels.com/photos/38243203/pexels-photo-38243203.jpeg?auto=compress&cs=tinysrgb&w=300", alt: "Shelves of colourful glazed mugs and stacked plates" },
];

type Rail = { x: number; v: number; t: number | null; dn: boolean; k: () => void; lim: () => number; off: () => void };

export default function MainSlideWithSyncedDraggableThumbnailStrip() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const R = root.current;
    if (!R) return;
    const main = R.querySelector<HTMLElement>(".w2thm-main")!, strip = R.querySelector<HTMLElement>(".w2thm-strip")!;
    const sl = Array.from(R.querySelectorAll<HTMLElement>(".w2thm-slide")), th = Array.from(R.querySelectorAll<HTMLButtonElement>(".w2thm-th"));
    const bt = Array.from(R.querySelectorAll<HTMLButtonElement>(".w2thm-btn")), lv = R.querySelector<HTMLElement>(".w2thm-live")!;
    const n = sl.length;
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cur = 0, vis = true, au = 0, mv = false, stopped = false;
    const cl = (i: number) => Math.max(0, Math.min(n - 1, i));
    const stop = () => { clearTimeout(au); stopped = true; };

    // one small physics routine shared by both rails; snap lands on whole slides, otherwise it coasts and stops
    const rail = (vw: HTMLElement, tr: HTMLElement, snap: boolean, cb?: (f: number) => void): Rail => {
      let raf = 0, sx = 0, x0 = 0, lt = 0;
      const lim = () => Math.min(0, vw.offsetWidth - tr.scrollWidth);
      const o: Rail = { x: 0, v: 0, t: 0, dn: false, k: () => { if (!raf) raf = requestAnimationFrame(loop); }, lim, off: () => cancelAnimationFrame(raf) };
      function loop() {
        raf = 0;
        const m = lim(), s = vw.offsetWidth;
        if (!o.dn) {
          if (o.t == null) { o.x += o.v; o.v *= FRICTION; if (o.x > 0 || o.x < m) o.v *= 0.6; if (Math.abs(o.v) < 0.5) o.t = snap ? -cl(Math.round(-o.x / s)) * s : Math.max(m, Math.min(0, o.x)); }
          if (o.t != null) { o.x = rm ? o.t : o.x + (o.t - o.x) * 0.15; if (Math.abs(o.t - o.x) < 0.5) o.x = o.t; }
        }
        const p = o.x > 0 ? o.x * RUBBER : o.x < m ? m + (o.x - m) * RUBBER : o.x;
        tr.style.transform = `translate3d(${p}px,0,0)`;
        if (cb) cb(p / s);
        if (vis && (o.dn || o.t == null || o.x !== o.t)) raf = requestAnimationFrame(loop);
      }
      vw.onpointerdown = (e) => { stop(); o.dn = true; mv = false; sx = e.clientX; x0 = o.x; o.v = 0; o.k(); };
      vw.onpointermove = (e) => {
        if (!o.dn) return;
        const d = e.clientX - sx;
        if (Math.abs(d) > 6 && !mv) { mv = true; vw.setPointerCapture(e.pointerId); } // capture only once it is a drag, so a tap still clicks a thumbnail
        o.v = o.v * 0.5 + (x0 + d - o.x) * 0.5; o.x = x0 + d; lt = e.timeStamp; o.k();
      };
      vw.onpointerup = vw.onpointercancel = (e) => { if (!o.dn) return; o.dn = false; if (rm || e.timeStamp - lt > 100) o.v = 0; o.t = null; o.k(); };
      return o;
    };
    const B = rail(strip, R.querySelector<HTMLElement>(".w2thm-thumbs")!, false);
    // keep the active thumbnail centred in the strip unless someone is dragging the strip
    const centre = (i: number) => {
      if (B.dn) return;
      const t = th[i];
      B.t = Math.max(B.lim(), Math.min(0, strip.offsetWidth / 2 - t.offsetLeft - t.offsetWidth / 2));
      B.v = 0; B.k();
    };
    const show = (i: number) => {
      if (i === cur) return;
      th[cur].removeAttribute("aria-current"); th[i].setAttribute("aria-current", "true");
      sl.forEach((e, k) => e.setAttribute("aria-hidden", String(k !== i)));
      cur = i;
      bt[0].disabled = i === 0; bt[1].disabled = i === n - 1;
      centre(i);
    };
    const A = rail(main, R.querySelector<HTMLElement>(".w2thm-track")!, true, (f) => show(cl(Math.round(-f))));
    const go = (i: number, say?: boolean) => {
      const j = cl(i);
      A.t = -j * main.offsetWidth; A.v = 0; A.k();
      if (say) lv.textContent = `Piece ${j + 1} of ${n}: ${sl[j].querySelector("h3")!.textContent}`;
    };
    const clicks = th.map((t, i) => (e: MouseEvent) => { if (mv) { e.preventDefault(); return; } stop(); go(i, true); });
    const focuses = th.map((t, i) => () => centre(i));
    th.forEach((t, i) => { t.addEventListener("click", clicks[i]); t.addEventListener("focus", focuses[i]); });
    bt.forEach((b) => { b.onclick = () => { stop(); go(cur + Number(b.dataset.d), true); }; });
    R.onkeydown = (e) => {
      const i = e.key === "ArrowLeft" ? cur - 1 : e.key === "ArrowRight" ? cur + 1 : null;
      if (i == null) return;
      e.preventDefault(); stop(); go(i, true);
    };
    R.onpointerenter = stop;
    R.addEventListener("focusin", stop);
    const tick = () => { if (stopped) return; if (vis) go((cur + 1) % n); au = window.setTimeout(tick, IDLE); };
    const start = () => { if (!stopped) au = window.setTimeout(tick, 2200); };
    if (!rm) { if (document.readyState === "complete") start(); else window.addEventListener("load", start); }
    const io = new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis) { A.k(); B.k(); } });
    io.observe(R);
    return () => {
      stop(); io.disconnect(); A.off(); B.off(); window.removeEventListener("load", start);
      [main, strip].forEach((el) => { el.onpointerdown = el.onpointermove = el.onpointerup = el.onpointercancel = null; });
      th.forEach((t, i) => { t.removeEventListener("click", clicks[i]); t.removeEventListener("focus", focuses[i]); });
      bt.forEach((b) => { b.onclick = null; });
      R.onkeydown = null; R.onpointerenter = null; R.removeEventListener("focusin", stop);
    };
  }, []);

  return (
    <section ref={root} role="region" aria-roledescription="carousel" aria-label="Oxbow Home pieces" className="overflow-hidden bg-[#f5f6f8] px-4 py-12 text-[#1c2430]">
      <style>{`
        .w2thm-main, .w2thm-strip { touch-action: pan-y; cursor: grab; user-select: none; }
        .w2thm-track, .w2thm-thumbs { will-change: transform; }
        .w2thm-th { opacity: .55; transition: opacity .3s; }
        .w2thm-th::after { content: ""; position: absolute; inset: 0; border-radius: 8px; box-shadow: inset 0 0 0 3px #3d5a80; opacity: 0; transition: opacity .3s; }
        .w2thm-th[aria-current="true"], .w2thm-th[aria-current="true"]::after { opacity: 1; }
        .w2thm-th:hover { opacity: .85; }
        .w2thm-btn:disabled { opacity: .35; cursor: default; }
        .w2thm-btn:focus-visible, .w2thm-th:focus-visible, .w2thm-main:focus-visible { outline: 2px solid #3d5a80; outline-offset: 3px; }
        @media (prefers-reduced-motion: reduce) { .w2thm-th, .w2thm-th::after { transition: none; } }
      `}</style>
      <div className="mx-auto max-w-[960px]">
        <div className="mb-[22px] flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#3d5a80]">Oxbow Home</p>
            <h2 className="mt-2 text-[26px] font-semibold tracking-tight sm:text-4xl">New in the showroom</h2>
          </div>
          <div className="flex gap-2">
            {[-1, 1].map((d) => (
              <button key={d} type="button" data-d={d} disabled={d < 0} aria-label={d < 0 ? "Previous piece" : "Next piece"} className="w2thm-btn grid h-11 w-11 place-items-center rounded-[10px] border border-[#c9d0db] bg-white hover:border-[#3d5a80]">
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d={d < 0 ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} fill="none" stroke="currentColor" strokeWidth="2" /></svg>
              </button>
            ))}
          </div>
        </div>
        <div className="w2thm-main relative aspect-[4/3] overflow-hidden rounded-xl bg-[#dfe3ea] sm:aspect-video" tabIndex={0}>
          <ol className="w2thm-track m-0 flex h-full list-none p-0">
            {pieces.map((p, i) => (
              <li key={p.name} className="w2thm-slide relative h-full shrink-0 grow-0 basis-full" role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${pieces.length}`} aria-hidden={i > 0}>
                <img src={p.src} alt={p.alt} draggable={false} className="pointer-events-none block h-full w-full object-cover" />
                <div className="absolute bottom-4 left-4 box-border max-w-[calc(100%-32px)] rounded-[10px] bg-white/95 px-4 py-3">
                  <h3 className="text-[17px] font-semibold">{p.name}</h3>
                  <p className="mt-0.5 text-[13px] text-[#4a5568]">{p.note}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="w2thm-strip mt-3.5 overflow-hidden">
          <div className="w2thm-thumbs flex w-max gap-2.5">
            {pieces.map((p, i) => (
              <button key={p.name} type="button" className="w2thm-th relative w-24 flex-none cursor-pointer overflow-hidden rounded-lg bg-[#dfe3ea] p-0 sm:w-[150px]" aria-label={`Show ${p.name}`} aria-current={i === 0 ? "true" : undefined}>
                <img src={p.thumb} alt="" draggable={false} className="pointer-events-none block aspect-[3/2] w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
        <p className="w2thm-live sr-only" aria-live="polite" />
      </div>
    </section>
  );
}
