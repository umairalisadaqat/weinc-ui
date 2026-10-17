import { useEffect, useRef } from "react";

const FRICTION = 0.93; // speed kept each frame after release
const RUBBER = 0.3; // stretch past the first and last tour
const IDLE = 3000; // idle advance until the first interaction

const tours = [
  { city: "Lisbon", name: "Baixa after dark", note: "2 hours, from Praça da Figueira", src: "https://images.pexels.com/photos/33944600/pexels-photo-33944600.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "A red tram on a street of old buildings in downtown Lisbon" },
  { city: "Porto", name: "Douro at dusk", note: "90 minutes, Ribeira to the bridge", src: "https://images.pexels.com/photos/16180699/pexels-photo-16180699.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Porto rooftops and riverside buildings along the Douro at sunset" },
  { city: "Marsaxlokk", name: "Fishing boats", note: "1 hour, along the harbour wall", src: "https://images.pexels.com/photos/34065721/pexels-photo-34065721.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Colourful fishing boats moored in Marsaxlokk harbour" },
  { city: "Birgu", name: "Marina and bastions", note: "2 hours, ferry included", src: "https://images.pexels.com/photos/36901145/pexels-photo-36901145.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Birgu marina with a classic boat and limestone buildings across the water" },
  { city: "Barcelona", name: "Side streets", note: "2 hours, small groups of eight", src: "https://images.pexels.com/photos/20358173/pexels-photo-20358173.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "A quiet narrow street in Barcelona with a parked scooter and old stone buildings" },
];

export default function TwoLinkedDragRailsMovingAtDifferentSpeeds() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const R = root.current;
    if (!R) return;
    const A = R.querySelector<HTMLElement>(".w2rai-a")!, B = R.querySelector<HTMLElement>(".w2rai-b")!;
    const cs = Array.from(R.querySelectorAll<HTMLElement>(".w2rai-card")), nm = Array.from(R.querySelectorAll<HTMLElement>(".w2rai-b li"));
    const vw = Array.from(R.querySelectorAll<HTMLElement>(".w2rai-view")), bt = Array.from(R.querySelectorAll<HTMLButtonElement>(".w2rai-btn"));
    const lv = R.querySelector<HTMLElement>(".w2rai-live")!;
    const n = cs.length;
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let x = 0, v = 0, tx: number | null = 0, raf = 0, dn = false, sx = 0, x0 = 0, lt = 0, mv = false, f = 1, cur = -1, vis = true, au = 0, stopped = false;
    const cl = (i: number) => Math.max(0, Math.min(n - 1, i));
    const show = (i: number) => {
      if (i === cur) return;
      cs.forEach((e, k) => { e.classList.toggle("w2rai-on", k === i); nm[k].classList.toggle("w2rai-on", k === i); });
      cur = i;
      bt[0].disabled = i === 0; bt[1].disabled = i === n - 1;
    };
    // x drives the photo rail; the names rail moves by the ratio of the two widths, so it travels slower but lands in step
    const loop = () => {
      raf = 0;
      const s = cs[0].offsetWidth, m = -(n - 1) * s;
      if (!dn) {
        if (tx == null) { x += v; v *= FRICTION; if (x > 0 || x < m) v *= 0.6; if (Math.abs(v) < 0.5) tx = cl(Math.round(-x / s)); }
        if (tx != null) { const g = -tx * s; x = rm ? g : x + (g - x) * 0.15; if (Math.abs(g - x) < 0.5) x = g; }
      }
      const p = x > 0 ? x * RUBBER : x < m ? m + (x - m) * RUBBER : x;
      A.style.transform = `translate3d(${p}px,0,0)`;
      B.style.transform = `translate3d(${(p * nm[0].offsetWidth) / s}px,0,0)`;
      show(cl(Math.round(-p / s)));
      if (vis && (dn || tx == null || x !== -tx * s)) raf = requestAnimationFrame(loop);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    const go = (i: number, say?: boolean) => {
      tx = cl(i); v = 0; kick();
      if (say) lv.textContent = `Tour ${tx + 1} of ${n}: ${cs[tx].querySelector("h3")!.textContent}`;
    };
    const stop = () => { clearTimeout(au); stopped = true; };
    const up = (e: PointerEvent) => { if (!dn) return; dn = false; if (rm || e.timeStamp - lt > 100) v = 0; tx = null; kick(); };
    const click = (e: MouseEvent) => { if (mv) { e.preventDefault(); e.stopPropagation(); } }; // a drag is not a click
    vw.forEach((el, j) => {
      el.onpointerdown = (e) => {
        stop(); dn = true; mv = false; sx = e.clientX; x0 = x; v = 0;
        f = j ? cs[0].offsetWidth / nm[0].offsetWidth : 1; // dragging the slower rail moves the pair at its own pace
        kick();
      };
      el.onpointermove = (e) => {
        if (!dn) return;
        const d = (e.clientX - sx) * f;
        if (Math.abs(d) > 6 && !mv) { mv = true; el.setPointerCapture(e.pointerId); } // capture only once it is a drag, so a tap still clicks the link
        v = v * 0.5 + (x0 + d - x) * 0.5; x = x0 + d; lt = e.timeStamp; kick();
      };
      el.onpointerup = el.onpointercancel = up;
      el.addEventListener("click", click, true);
    });
    // tabbing to a link in a card brings that card into place
    const focuses = cs.map((c, i) => () => { R.scrollLeft = 0; go(i); });
    cs.forEach((c, i) => c.addEventListener("focusin", focuses[i]));
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
    const io = new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis) kick(); });
    io.observe(R);
    kick();
    return () => {
      stop(); io.disconnect(); cancelAnimationFrame(raf); window.removeEventListener("load", start);
      vw.forEach((el) => { el.onpointerdown = el.onpointermove = el.onpointerup = el.onpointercancel = null; el.removeEventListener("click", click, true); });
      cs.forEach((c, i) => c.removeEventListener("focusin", focuses[i]));
      bt.forEach((b) => { b.onclick = null; });
      R.onkeydown = null; R.onpointerenter = null; R.removeEventListener("focusin", stop);
    };
  }, []);

  return (
    <section ref={root} role="region" aria-roledescription="carousel" aria-label="Lantern Walks tours" className="overflow-hidden bg-[#13203a] pb-10 pt-[52px] text-[#eef1f6]">
      <style>{`
        .w2rai-view { touch-action: pan-y; cursor: grab; user-select: none; }
        .w2rai-a, .w2rai-b { will-change: transform; }
        .w2rai-card { opacity: .55; transition: opacity .35s; }
        .w2rai-card.w2rai-on { opacity: 1; }
        .w2rai-b li { color: rgba(238,241,246,.28); transition: color .35s; }
        .w2rai-b li.w2rai-on { color: #eef1f6; }
        .w2rai-btn:disabled { opacity: .3; cursor: default; }
        .w2rai-btn:focus-visible, .w2rai-card a:focus-visible { outline: 2px solid #e8b85c; outline-offset: 3px; }
        @media (prefers-reduced-motion: reduce) { .w2rai-card, .w2rai-b li { transition: none; } }
      `}</style>
      <div className="mx-auto max-w-[1120px] px-4">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#e8b85c]">Lantern Walks</p>
            <h2 className="mt-2.5 text-[26px] font-semibold leading-tight tracking-tight sm:text-[40px]">Evening walking tours by the water</h2>
          </div>
          <div className="flex gap-2.5">
            {[-1, 1].map((d) => (
              <button key={d} type="button" data-d={d} disabled={d < 0} aria-label={d < 0 ? "Previous tour" : "Next tour"} className="w2rai-btn grid h-12 w-12 place-items-center rounded-full border border-[#eef1f6]/35 hover:bg-[#eef1f6]/10">
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d={d < 0 ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} fill="none" stroke="currentColor" strokeWidth="2" /></svg>
              </button>
            ))}
          </div>
        </div>
        <div className="w2rai-view">
          <ol className="w2rai-a m-0 flex list-none p-0">
            {tours.map((t, i) => (
              <li key={t.name} className="w2rai-card box-border max-w-[82vw] shrink-0 grow-0 basis-[360px] pr-5" role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${tours.length}`}>
                <img src={t.src} alt={t.alt} draggable={false} className="pointer-events-none block aspect-[4/3] w-full rounded-[10px] object-cover" />
                <div className="pt-3.5">
                  <h3 className="text-lg font-semibold">{t.name}</h3>
                  <p className="mt-1 text-sm text-[#b9c2d3]">{t.note}</p>
                  <a href="#" className="mt-1.5 inline-flex min-h-[40px] items-center text-sm font-semibold text-[#e8b85c] hover:underline">Tour details</a>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="w2rai-view mt-[18px] border-t border-[#eef1f6]/15 pt-3.5" aria-hidden="true">
          <ol className="w2rai-b m-0 flex list-none p-0">
            {tours.map((t) => (
              <li key={t.city} className="shrink-0 grow-0 basis-[280px] whitespace-nowrap font-serif text-[30px] font-medium italic leading-tight lg:text-[44px]">{t.city}</li>
            ))}
          </ol>
        </div>
        <p className="w2rai-live sr-only" aria-live="polite" />
      </div>
    </section>
  );
}
