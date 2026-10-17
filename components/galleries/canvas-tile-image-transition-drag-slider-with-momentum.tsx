import { useEffect, useRef } from "react";

const COLS = 8; // tiles across
const ROWS = 5; // tiles down
const DUR = 700; // length of one change in ms
const FRICTION = 0.93; // speed kept each frame after release
const IDLE = 3000; // idle advance until the first interaction

const slides = [
  { name: "Throwing on the wheel", sub: "Tuesday evening class", src: "https://images.pexels.com/photos/31875677/pexels-photo-31875677.jpeg?auto=compress&cs=tinysrgb&w=1400", alt: "Hands shaping a clay pot on a spinning pottery wheel" },
  { name: "Bowls on the drying rack", sub: "Red earthenware", src: "https://images.pexels.com/photos/33703946/pexels-photo-33703946.jpeg?auto=compress&cs=tinysrgb&w=1400", alt: "Stacks of unglazed clay bowls on wooden shelves" },
  { name: "Dotted stoneware vases", sub: "Pressed by hand", src: "https://images.pexels.com/photos/7119222/pexels-photo-7119222.jpeg?auto=compress&cs=tinysrgb&w=1400", alt: "Two stoneware vases with dotted texture against a rust wall" },
  { name: "Glazed bud vases", sub: "Iron red and celadon", src: "https://images.pexels.com/photos/8063852/pexels-photo-8063852.jpeg?auto=compress&cs=tinysrgb&w=1400", alt: "Glazed bud vases in red, grey and cream on a table" },
  { name: "Mugs waiting for glaze", sub: "Bisque fired", src: "https://images.pexels.com/photos/8063803/pexels-photo-8063803.jpeg?auto=compress&cs=tinysrgb&w=1400", alt: "Rows of unglazed white mugs on a studio shelf" },
];

export default function CanvasTileImageTransitionDragSlider() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const R = root.current;
    if (!R) return;
    const Q = (s: string) => Array.from(R.querySelectorAll<HTMLElement>(s));
    const O = "w2til-on";
    const T = (e: Element, b: boolean) => e.classList.toggle(O, b);
    const st = Q(".w2til-stage")[0], tr = Q(".w2til-track")[0], cv = Q(".w2til-cv")[0] as HTMLCanvasElement;
    const im = Q(".w2til-img") as HTMLImageElement[], it = Q(".w2til-item"), bt = Q(".w2til-btn") as HTMLButtonElement[], lv = Q(".w2til-live")[0];
    const views = [st, tr.parentElement as HTMLElement];
    const n = it.length;
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const c2 = cv.getContext("2d");
    let x = 0, v = 0, tx: number | null = 0, raf = 0, dn = false, sx = 0, x0 = 0, lt = 0, cur = 0, sh = 0, t0 = 0, fr = 0, dir = 1, tl = 0, vis = true, au = 0, w = 0, h = 0, stopped = false;
    const W = () => it[0].offsetWidth;
    const cl = (i: number) => Math.max(0, Math.min(n - 1, i));

    const swap = () => {
      im.forEach((e, k) => { T(e, k === cur); e.setAttribute("aria-hidden", String(k !== cur)); });
      sh = cur;
      T(cv, false);
    };
    const show = (i: number) => {
      if (i === cur) return;
      dir = i > cur ? 1 : -1; fr = sh; cur = i;
      it.forEach((e, k) => T(e, k === i));
      bt[0].disabled = i === 0; bt[1].disabled = i === n - 1;
      if (rm || !c2 || !(im[fr].naturalWidth * im[i].naturalWidth)) { swap(); return; }
      w = st.clientWidth; h = st.clientHeight;
      const d = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = w * d; cv.height = h * d; c2.scale(d, d);
      T(im[fr], false);
      t0 = 0;
      if (!tl) tl = requestAnimationFrame(draw);
    };
    const cell = (g: HTMLImageElement, c: number, r: number, o: number, a: number) => {
      const u = g.naturalWidth, y = g.naturalHeight, s = Math.max(w / u, h / y), q = w / COLS, z = h / ROWS;
      c2!.globalAlpha = a;
      c2!.drawImage(g, (u - w / s) / 2 + (c * q) / s, (y - h / s) / 2 + (r * z) / s, q / s, z / s, c * q + o, r * z, q + 0.5, z + 0.5);
    };
    const draw = (now: number) => {
      tl = 0;
      if (!vis) { swap(); return; }
      t0 = t0 || now;
      const p = Math.min((now - t0) / DUR, 1) * 1.05;
      c2!.clearRect(0, 0, w, h);
      T(cv, true);
      for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) {
        // each tile starts a little later across the sweep, slides sideways and crossfades
        let t = Math.max(0, Math.min(1, (p - ((dir > 0 ? c : COLS - 1 - c) / COLS) * 0.5 - (r / ROWS) * 0.15) / 0.4));
        t = t * t * (3 - 2 * t);
        const o = (w / COLS) * 0.45 * dir;
        cell(im[fr], c, r, -o * t, 1 - t);
        cell(im[cur], c, r, o * (1 - t), t);
      }
      if (p < 1.05) tl = requestAnimationFrame(draw); else swap();
    };
    const loop = () => {
      raf = 0;
      const s = W(), m = -(n - 1) * s;
      if (!dn) {
        if (tx == null) { x += v; v *= FRICTION; if (x > 0 || x < m) v *= 0.6; if (Math.abs(v) < 0.5) tx = cl(Math.round(-x / s)); }
        if (tx != null) { const g = -tx * s; x = rm ? g : x + (g - x) * 0.16; if (Math.abs(g - x) < 0.5) x = g; }
      }
      const p = x > 0 ? x * 0.3 : x < m ? m + (x - m) * 0.3 : x; // rubber band past the ends
      tr.style.transform = `translate3d(${p}px,0,0)`;
      show(cl(Math.round(-p / s)));
      if (vis && (dn || tx == null || x !== -tx * s)) raf = requestAnimationFrame(loop);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    const go = (i: number, say?: boolean) => {
      tx = cl(i); v = 0;
      kick();
      if (say) lv.textContent = `Slide ${tx + 1}: ${it[tx].children[1].textContent}`;
    };
    const stop = () => { clearTimeout(au); stopped = true; };
    const up = (e: PointerEvent) => {
      if (!dn) return;
      dn = false;
      if (rm || e.timeStamp - lt > 100) v = 0;
      tx = null;
      kick();
    };
    const downs = views.map((el) => (e: PointerEvent) => { stop(); dn = true; sx = e.clientX; x0 = x; v = 0; el.setPointerCapture(e.pointerId); kick(); });
    const move = (e: PointerEvent) => {
      if (!dn) return;
      const nx = x0 + e.clientX - sx;
      v = v * 0.5 + (nx - x) * 0.5; // smoothed speed of the last few moves
      x = nx; lt = e.timeStamp; kick();
    };
    views.forEach((el, i) => {
      el.addEventListener("pointerdown", downs[i]);
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", up);
      el.addEventListener("pointercancel", up);
    });
    const clicks = bt.map((b) => () => { stop(); go(cur + Number(b.dataset.d), true); });
    bt.forEach((b, i) => b.addEventListener("click", clicks[i]));
    const key = (e: KeyboardEvent) => {
      const i = e.key === "ArrowLeft" ? cur - 1 : e.key === "ArrowRight" ? cur + 1 : null;
      if (i == null) return;
      e.preventDefault(); stop(); go(i, true);
    };
    R.addEventListener("keydown", key);
    R.addEventListener("pointerenter", stop);
    R.addEventListener("focusin", stop);
    const tick = () => { if (stopped) return; if (vis) go((cur + 1) % n); au = window.setTimeout(tick, IDLE); };
    const io = new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis) kick(); });
    io.observe(R);
    // the idle preview starts counting once the photos have loaded
    const start = () => { if (!stopped) au = window.setTimeout(tick, 2200); };
    if (!rm) { if (document.readyState === "complete") start(); else window.addEventListener("load", start); }
    return () => {
      stop(); io.disconnect(); window.removeEventListener("load", start); cancelAnimationFrame(raf); cancelAnimationFrame(tl);
      views.forEach((el, i) => {
        el.removeEventListener("pointerdown", downs[i]);
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerup", up);
        el.removeEventListener("pointercancel", up);
      });
      bt.forEach((b, i) => b.removeEventListener("click", clicks[i]));
      R.removeEventListener("keydown", key);
      R.removeEventListener("pointerenter", stop);
      R.removeEventListener("focusin", stop);
    };
  }, []);

  return (
    <section ref={root} role="region" aria-roledescription="carousel" aria-label="Ondra Clay Studio work" className="w2til overflow-hidden bg-[#f3ece2] px-4 py-12 text-[#2b211b]">
      <style>{`
        .w2til-stage { touch-action: pan-y; cursor: grab; user-select: none; box-shadow: 0 24px 48px -28px rgba(60,35,20,.45); }
        .w2til-img, .w2til-cv { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; }
        .w2til-on.w2til-img, .w2til-on.w2til-cv { opacity: 1; }
        .w2til-view { touch-action: pan-y; cursor: grab; }
        .w2til-track { will-change: transform; }
        .w2til-item { flex: 0 0 230px; border-top: 2px solid rgba(43,33,27,.14); opacity: .5; transition: opacity .3s, border-color .3s; user-select: none; }
        .w2til-item.w2til-on { opacity: 1; border-color: #a4502f; }
        .w2til-btn:disabled { opacity: .35; cursor: default; }
        .w2til-btn:focus-visible, .w2til-stage:focus-visible { outline: 2px solid #a4502f; outline-offset: 3px; }
        @media (prefers-reduced-motion: reduce) { .w2til-item { transition: none; } }
      `}</style>
      <div className="mx-auto max-w-[980px]">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-x-12 gap-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#a4502f]">Ondra Clay Studio</p>
            <h2 className="mt-2.5 max-w-[16em] font-serif text-[28px] font-semibold leading-tight sm:text-[42px]">A year in the studio</h2>
          </div>
          <p className="max-w-sm text-[15px] leading-relaxed text-[#5b4c41]">Drag the photo or the list, or use the arrows. Each change breaks the picture into tiles that slide into the next one.</p>
        </div>
        <div className="w2til-stage relative aspect-[4/3] sm:aspect-[11/5] overflow-hidden rounded-[14px] bg-[#d9cbb9]" tabIndex={0}>
          {slides.map((s, i) => (
            <img key={s.src} className={`w2til-img${i === 0 ? " w2til-on" : ""}`} src={s.src} alt={s.alt} draggable={false} aria-hidden={i !== 0} />
          ))}
          <canvas className="w2til-cv" aria-hidden="true" />
        </div>
        <div className="mt-[22px] flex items-center gap-4">
          <div className="w2til-view min-w-0 flex-1 overflow-hidden">
            <ol className="w2til-track m-0 flex list-none p-0">
              {slides.map((s, i) => (
                <li key={s.name} className={`w2til-item pb-1 pr-[18px] pt-3.5${i === 0 ? " w2til-on" : ""}`} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${slides.length}`}>
                  <span className="block text-xs font-bold text-[#a4502f]">{String(i + 1).padStart(2, "0")}</span>
                  <span className="mt-1 block text-base font-semibold">{s.name}</span>
                  <span className="mt-0.5 block text-[13px] text-[#5b4c41]">{s.sub}</span>
                </li>
              ))}
            </ol>
          </div>
          <div className="flex gap-2">
            {[-1, 1].map((d) => (
              <button key={d} type="button" data-d={d} disabled={d < 0} aria-label={d < 0 ? "Previous slide" : "Next slide"} className="w2til-btn grid h-[46px] w-[46px] place-items-center rounded-full border border-[#2b211b]/25 bg-[#fffaf3] hover:bg-white">
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d={d < 0 ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} fill="none" stroke="currentColor" strokeWidth="2" /></svg>
              </button>
            ))}
          </div>
        </div>
        <p className="w2til-live sr-only" aria-live="polite" />
      </div>
    </section>
  );
}
