import { useEffect, useRef } from "react";

const FRICTION = 0.94; // speed kept each frame after release
const RUBBER = 0.3; // how far the screen stretches past the first and last drink
const IDLE = 3000; // idle advance until the first interaction

const drinks = [
  { name: "Espresso", note: "Double shot, house blend with notes of cocoa and plum.", price: "3.20", src: "https://images.pexels.com/photos/4921556/pexels-photo-4921556.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Hands holding a small ceramic cup of espresso, seen from above" },
  { name: "Pour-over", note: "Single origin through a cloth filter, brewed to order.", price: "4.60", src: "https://images.pexels.com/photos/29507967/pexels-photo-29507967.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Pour-over coffee through a cloth filter beside a cup on a wooden table" },
  { name: "Latte", note: "Whole or oat milk, poured with a heart.", price: "3.90", src: "https://images.pexels.com/photos/459489/pexels-photo-459489.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Latte with heart latte art in a pale blue cup and saucer" },
  { name: "Iced coffee", note: "Slow steeped overnight, served over ice.", price: "4.10", src: "https://images.pexels.com/photos/39218055/pexels-photo-39218055.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Glass of iced coffee with a straw on a sunlit table" },
  { name: "Cappuccino", note: "Equal thirds, dusted with cocoa if you ask.", price: "3.70", src: "https://images.pexels.com/photos/997670/pexels-photo-997670.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Cappuccino with latte art in a black mug" },
];

export default function VerticalDragMenuSliderInsideAPhoneMockup() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const R = root.current;
    if (!R) return;
    const sc = R.querySelector<HTMLElement>(".w2pho-screen")!, tr = R.querySelector<HTMLElement>(".w2pho-track")!;
    const it = Array.from(R.querySelectorAll<HTMLElement>(".w2pho-slide")), dt = Array.from(R.querySelectorAll<HTMLElement>(".w2pho-dots i"));
    const bt = Array.from(R.querySelectorAll<HTMLButtonElement>(".w2pho-btn")), lv = R.querySelector<HTMLElement>(".w2pho-live")!;
    const n = it.length;
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let y = 0, v = 0, ty: number | null = 0, raf = 0, dn = false, sy = 0, y0 = 0, lt = 0, cur = 0, vis = true, au = 0, stopped = false;
    const cl = (i: number) => Math.max(0, Math.min(n - 1, i));
    const show = (i: number) => {
      if (i === cur) return;
      dt[cur].classList.remove("w2pho-on"); dt[i].classList.add("w2pho-on");
      cur = i;
      bt[0].disabled = i === 0; bt[1].disabled = i === n - 1;
      it.forEach((e, k) => e.setAttribute("aria-hidden", String(k !== i)));
    };
    // vertical track: drag, coast with friction, then ease onto the nearest drink
    const loop = () => {
      raf = 0;
      const s = sc.offsetHeight, m = -(n - 1) * s;
      if (!dn) {
        if (ty == null) { y += v; v *= FRICTION; if (y > 0 || y < m) v *= 0.6; if (Math.abs(v) < 0.5) ty = cl(Math.round(-y / s)); }
        if (ty != null) { const g = -ty * s; y = rm ? g : y + (g - y) * 0.15; if (Math.abs(g - y) < 0.5) y = g; }
      }
      const p = y > 0 ? y * RUBBER : y < m ? m + (y - m) * RUBBER : y;
      tr.style.transform = `translate3d(0,${p}px,0)`;
      show(cl(Math.round(-p / s)));
      if (vis && (dn || ty == null || y !== -ty * s)) raf = requestAnimationFrame(loop);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
    const go = (i: number, say?: boolean) => {
      ty = cl(i); v = 0; kick();
      if (say) lv.textContent = `Drink ${ty + 1} of ${n}: ${it[ty].querySelector("h3")!.textContent}`;
    };
    const stop = () => { clearTimeout(au); stopped = true; };
    const up = (e: PointerEvent) => { if (!dn) return; dn = false; if (rm || e.timeStamp - lt > 100) v = 0; ty = null; kick(); };
    sc.onpointerdown = (e) => { stop(); dn = true; sy = e.clientY; y0 = y; v = 0; sc.setPointerCapture(e.pointerId); kick(); };
    sc.onpointermove = (e) => { if (!dn) return; const d = e.clientY - sy; v = v * 0.5 + (y0 + d - y) * 0.5; y = y0 + d; lt = e.timeStamp; kick(); };
    sc.onpointerup = sc.onpointercancel = up;
    bt.forEach((b) => { b.onclick = () => { stop(); go(cur + Number(b.dataset.d), true); }; });
    const keys: Record<string, number> = { ArrowUp: -1, ArrowLeft: -1, ArrowDown: 1, ArrowRight: 1 };
    R.onkeydown = (e) => {
      const i = e.key === "Home" ? 0 : e.key === "End" ? n - 1 : e.key in keys ? cur + keys[e.key] : null;
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
    return () => {
      stop(); io.disconnect(); cancelAnimationFrame(raf); window.removeEventListener("load", start);
      sc.onpointerdown = sc.onpointermove = sc.onpointerup = sc.onpointercancel = null;
      bt.forEach((b) => { b.onclick = null; });
      R.onkeydown = null; R.onpointerenter = null; R.removeEventListener("focusin", stop);
    };
  }, []);

  return (
    <section ref={root} role="region" aria-roledescription="carousel" aria-label="Marrow Coffee menu" className="overflow-hidden bg-[#26282c] px-4 py-14 text-[#f1ece4]">
      <style>{`
        .w2pho-screen { touch-action: pan-x; cursor: grab; user-select: none; }
        .w2pho-track { will-change: transform; }
        .w2pho-screen:focus-visible, .w2pho-btn:focus-visible { outline: 2px solid #d79a6a; outline-offset: 4px; }
        .w2pho-btn:disabled { opacity: .3; cursor: default; }
        .w2pho-dots i { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,.55); box-shadow: 0 0 0 1px rgba(0,0,0,.15); transition: transform .3s; }
        .w2pho-dots i.w2pho-on { background: #fff; transform: scale(1.5); }
        @media (prefers-reduced-motion: reduce) { .w2pho-dots i { transition: none; } }
      `}</style>
      <div className="mx-auto grid max-w-[940px] grid-cols-[minmax(0,1fr)] items-center gap-10 md:grid-cols-[minmax(0,1fr)_auto] md:gap-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d79a6a]">Marrow Coffee, Leith Walk</p>
          <h2 className="mt-3 text-[28px] font-semibold leading-tight tracking-tight sm:text-[42px]">The bar menu, one drink per screen</h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-[#c3bdb3]">Swipe up and down inside the phone, or use the buttons and arrow keys. A quick flick carries on for a drink or two before it settles.</p>
          <div className="mt-7 flex gap-2.5">
            {[-1, 1].map((d) => (
              <button key={d} type="button" data-d={d} disabled={d < 0} aria-label={d < 0 ? "Previous drink" : "Next drink"} className="w2pho-btn grid h-12 w-12 place-items-center rounded-[14px] border border-[#f1ece4]/30 hover:bg-[#f1ece4]/10">
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d={d < 0 ? "M5 15l7-7 7 7" : "M5 9l7 7 7-7"} fill="none" stroke="currentColor" strokeWidth="2" /></svg>
              </button>
            ))}
          </div>
        </div>
        <div className="box-border h-[550px] w-[270px] justify-self-center rounded-[46px] bg-[#0e0f11] p-3 shadow-[0_0_0_2px_#3a3d42,0_40px_80px_-30px_rgba(0,0,0,.8)] min-[381px]:h-[590px] min-[381px]:w-[290px]">
          <div className="w2pho-screen relative h-full w-full overflow-hidden rounded-[34px] bg-[#f6f1ea]" tabIndex={0}>
            <ol className="w2pho-track m-0 h-full list-none p-0">
              {drinks.map((d, i) => (
                <li key={d.name} className="w2pho-slide relative h-full text-[#26282c]" role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${drinks.length}`} aria-hidden={i > 0}>
                  <img src={d.src} alt={d.alt} draggable={false} className="pointer-events-none block h-[70%] w-full object-cover" />
                  <div className="px-[22px] py-5">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-2xl font-semibold tracking-tight">{d.name}</h3>
                      <span className="text-base font-bold text-[#8a4f26]">{d.price}</span>
                    </div>
                    <p className="mt-1.5 text-sm leading-normal text-[#55514b]">{d.note}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="w2pho-dots absolute right-2.5 top-1/2 grid -translate-y-1/2 gap-1.5" aria-hidden="true">
              {drinks.map((d, i) => <i key={d.name} className={i === 0 ? "w2pho-on" : ""} />)}
            </div>
          </div>
        </div>
        <p className="w2pho-live sr-only" aria-live="polite" />
      </div>
    </section>
  );
}
