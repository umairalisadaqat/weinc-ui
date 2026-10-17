import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** The mounted transparencies lying on the table, in reading order. `rot`, `dx` and `dy` are how carelessly each was put down. */
const slides = [
  { title: "Lime float", no: "07", date: "JUL 14", src: "https://images.pexels.com/photos/756560/pexels-photo-756560.jpeg?auto=compress&cs=tinysrgb&w=640", alt: "Woman in a red swimsuit and pink sunglasses lying on a lime green pool float", tone: "#12a79a", rot: -3.2, dx: 2, dy: -3 },
  { title: "Silk, surface", no: "11", date: "JUL 14", src: "https://images.pexels.com/photos/8539547/pexels-photo-8539547.jpeg?auto=compress&cs=tinysrgb&w=640", alt: "Woman floating on her back in a pool with a printed dress spreading round her", tone: "#3f9fb5", rot: 2.1, dx: -3, dy: 4 },
  { title: "Lane rope", no: "16", date: "JUL 15", src: "https://images.pexels.com/photos/9635148/pexels-photo-9635148.jpeg?auto=compress&cs=tinysrgb&w=640", alt: "Swimmer in a gauzy orange dress underwater beside a red lane rope", tone: "#1d6f8c", rot: -1.4, dx: 4, dy: 1 },
  { title: "Pink heels", no: "22", date: "JUL 15", src: "https://images.pexels.com/photos/1507351/pexels-photo-1507351.jpeg?auto=compress&cs=tinysrgb&w=640", alt: "Legs in pink high heels stretched out above a bright blue pool", tone: "#49b3d6", rot: 3.6, dx: -2, dy: -2 },
  { title: "Violet, deep end", no: "29", date: "JUL 16", src: "https://images.pexels.com/photos/5978235/pexels-photo-5978235.jpeg?auto=compress&cs=tinysrgb&w=640", alt: "Woman in a purple dress with arms spread wide, waist deep in a blue pool", tone: "#2a62c4", rot: -2.6, dx: 1, dy: 3 },
  { title: "Wet print", no: "34", date: "JUL 16", src: "https://images.pexels.com/photos/8539557/pexels-photo-8539557.jpeg?auto=compress&cs=tinysrgb&w=640", alt: "Woman with curly hair in a floral dress half under the water, looking at the camera", tone: "#7fa9b3", rot: 1.7, dx: -4, dy: -1 },
];

const N = slides.length;
// Design pixels; the table top is scaled to fit its box.
const CELL = 206; // grid pitch
const PAD = 26;
const MOUNT = 172; // a slide mount is square
const WIN_W = 128; // the film window
const WIN_H = 86;
const LENS = 152; // diameter of the glass
const BARREL = 192; // diameter of the black barrel
const SKIRT = 240; // diameter of the clear base
const ZOOM = 2.3;
const HOLD_MS = 2600;
const TOUR = [0, 1, 4, 5, 2, 3]; // the order the loupe wanders in when left alone

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function layout(cols: number) {
  const rows = Math.ceil(N / cols);
  return {
    w: cols * CELL + PAD * 2,
    h: rows * CELL + PAD * 2,
    at: (i: number) => ({ x: PAD + (i % cols) * CELL + CELL / 2 + slides[i].dx, y: PAD + Math.floor(i / cols) * CELL + CELL / 2 + slides[i].dy }),
  };
}

/** One slide: plastic mount, film window and the lab's printing. `real` slides are buttons with a true image; the copy under the glass is decoration. */
function Mount({ i, x, y, real, onPick }: { i: number; x: number; y: number; real: boolean; onPick?: (i: number) => void }) {
  const s = slides[i];
  const body = (
    <>
      {/* moulded recess round the window */}
      <span className="absolute rounded-[5px]" style={{ left: (MOUNT - WIN_W) / 2 - 7, top: (MOUNT - WIN_H) / 2 - 7, width: WIN_W + 14, height: WIN_H + 14, boxShadow: "inset 0 1px 1px rgba(0,0,0,0.16), inset 0 -1px 0 rgba(255,255,255,0.9)", background: "#dfe0dc" }} />
      <span className="absolute overflow-hidden rounded-[2px]" style={{ left: (MOUNT - WIN_W) / 2, top: (MOUNT - WIN_H) / 2, width: WIN_W, height: WIN_H, background: s.tone }}>
        {real ? (
          <img src={s.src} alt={s.alt} width={WIN_W} height={WIN_H} loading="eager" decoding="async" draggable={false} className="h-full w-full object-cover" style={{ filter: "saturate(1.22) contrast(1.06) brightness(1.06)" }} />
        ) : (
          <span className="block h-full w-full bg-cover bg-center" style={{ backgroundImage: `url("${s.src}")`, filter: "saturate(1.22) contrast(1.06) brightness(1.06)" }} />
        )}
        <span className="absolute inset-0" style={{ boxShadow: "inset 0 2px 3px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(0,0,0,0.35)" }} />
      </span>
      <span className="absolute left-[13px] top-[11px] font-mono text-[6.5px] font-semibold uppercase leading-[1.45] tracking-[0.2em] text-neutral-500">
        Halden colour lab
        <br />
        <span className="font-normal">Transparency 24 x 36</span>
      </span>
      <span className="absolute right-[13px] top-[10px] font-mono text-[11px] font-bold tabular-nums leading-none text-[#c8321e]">{s.no}</span>
      <span className="absolute bottom-[11px] left-[13px] font-mono text-[6.5px] uppercase leading-[1.45] tracking-[0.2em] text-neutral-600">
        <span className="font-semibold text-neutral-800">{s.title}</span>
        <br />
        {s.date}
      </span>
      {/* the photographer's dot: bottom left means this way up */}
      <span className="absolute bottom-[12px] right-[13px] h-[9px] w-[9px] rounded-full" style={{ background: "radial-gradient(circle at 35% 30%, #ff8a70, #d2341c 60%, #9c2010)" }} />
    </>
  );
  const style = {
    left: x - MOUNT / 2,
    top: y - MOUNT / 2,
    width: MOUNT,
    height: MOUNT,
    transform: `rotate(${s.rot}deg)`,
    background: "linear-gradient(160deg, #f1f1ee 0%, #e4e5e1 55%, #d6d7d3 100%)",
    boxShadow: "0 0 0 0.5px rgba(40,46,52,0.45), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -2px 2px rgba(0,0,0,0.08), 0 0 26px 7px rgba(255,255,255,0.95), 0 14px 22px -8px rgba(30,44,60,0.28)",
  };
  if (!real) return <span aria-hidden="true" className="absolute block rounded-[7px]" style={style}>{body}</span>;
  return (
    <button type="button" onClick={() => onPick?.(i)} onFocus={() => onPick?.(i)} aria-label={`Put the loupe on slide ${s.no}, ${s.title}`} className="absolute block cursor-pointer rounded-[7px] text-left outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-4 focus-visible:ring-offset-white" style={style}>
      {body}
    </button>
  );
}

export default function LightTableLoupe() {
  const reduce = useReducedMotion();
  const [cols, setCols] = useState(3);
  const [active, setActive] = useState(0);
  const L = useMemo(() => layout(cols), [cols]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const loupeRef = useRef<HTMLDivElement>(null);
  const underRef = useRef<HTMLDivElement>(null);
  const cordRef = useRef<SVGPathElement>(null);
  const cordShadowRef = useRef<SVGPathElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const sim = useRef({ x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, kx: 0, ky: 0, kvx: 0, kvy: 0, scale: 1, follow: false, drag: false, nextAuto: 0, tour: 0, active: 0, init: false });

  const pick = useCallback(
    (i: number) => {
      const s = sim.current;
      const p = L.at(i);
      s.tx = p.x;
      s.ty = p.y;
      s.follow = false;
      s.tour = Math.max(0, TOUR.indexOf(i));
      s.nextAuto = performance.now() + HOLD_MS * 2.5;
    },
    [L],
  );

  useEffect(() => {
    const wrap = wrapRef.current;
    const scene = sceneRef.current;
    const loupe = loupeRef.current;
    const under = underRef.current;
    if (!wrap || !scene || !loupe || !under) return;
    const s = sim.current;
    let raf = 0;
    let visible = true;
    let last = performance.now();
    const t0 = last;

    const measure = () => {
      const w = wrap.clientWidth;
      const want = w < 620 ? 2 : 3;
      if (want !== cols) {
        setCols(want);
        return;
      }
      const gutter = w < 620 ? 22 : 44;
      const sc = clamp((w - gutter * 2) / L.w, 0.5, 1.28);
      s.scale = sc;
      wrap.style.height = `${Math.round(L.h * sc + gutter * 2 + 40)}px`;
      scene.style.transform = `translateX(-50%) scale(${sc.toFixed(4)})`;
      scene.style.top = `${gutter}px`;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);

    const home = L.at(TOUR[s.tour]);
    if (!s.init) {
      s.init = true;
      s.x = reduce ? home.x : home.x + 230;
      s.y = reduce ? home.y : home.y + 150;
      s.kx = s.x + 200;
      s.ky = s.y + 200;
    }
    s.tx = home.x;
    s.ty = home.y;
    s.nextAuto = last + 2100;

    const anchor = { x: L.w + 300, y: L.h * 0.62 };
    const paint = () => {
      loupe.style.transform = `translate3d(${(s.x - SKIRT / 2).toFixed(2)}px,${(s.y - SKIRT / 2).toFixed(2)}px,0)`;
      under.style.transform = `translate3d(${(LENS / 2 - ZOOM * s.x).toFixed(2)}px,${(LENS / 2 - ZOOM * s.y).toFixed(2)}px,0) scale(${ZOOM})`;
      // the neck cord leaves the barrel at the lower right and sags to the edge of the table
      const lx = s.x + (BARREL / 2 - 4) * 0.74;
      const ly = s.y + (BARREL / 2 - 4) * 0.67;
      const d = `M${lx.toFixed(1)} ${ly.toFixed(1)} Q${s.kx.toFixed(1)} ${s.ky.toFixed(1)} ${anchor.x} ${anchor.y}`;
      cordRef.current?.setAttribute("d", d);
      cordShadowRef.current?.setAttribute("d", d);
      if (glareRef.current) glareRef.current.style.transform = `translate3d(${(-s.vx * 0.012).toFixed(2)}px,${(-s.vy * 0.012).toFixed(2)}px,0)`;
      let best = 0;
      let bd = Infinity;
      for (let i = 0; i < N; i++) {
        const p = L.at(i);
        const dd = (p.x - s.x) ** 2 + (p.y - s.y) ** 2;
        if (dd < bd) {
          bd = dd;
          best = i;
        }
      }
      if (best !== s.active) {
        s.active = best;
        setActive(best);
      }
    };

    const tick = (now: number) => {
      const dt = Math.min(0.033, Math.max(0.001, (now - last) / 1000));
      last = now;
      const t = (now - t0) / 1000;
      if (!reduce && !s.follow && !s.drag && now > s.nextAuto) {
        s.tour = (s.tour + 1) % N;
        const p = L.at(TOUR[s.tour]);
        s.tx = p.x;
        s.ty = p.y;
        s.nextAuto = now + HOLD_MS;
      }
      if (reduce) {
        s.x = s.tx;
        s.y = s.ty;
        s.vx = s.vy = 0;
      } else {
        // a hand is never quite still
        const hx = s.follow || s.drag ? 0 : Math.sin(t * 0.9) * 5 + Math.sin(t * 2.3) * 1.5;
        const hy = s.follow || s.drag ? 0 : Math.cos(t * 0.7) * 4;
        const k = s.follow || s.drag ? 210 : 62;
        const c = s.follow || s.drag ? 26 : 13.5;
        s.vx += (k * (s.tx + hx - s.x) - c * s.vx) * dt;
        s.vy += (k * (s.ty + hy - s.y) - c * s.vy) * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
      }
      // the cord's belly trails behind the loupe
      const lx = s.x + BARREL * 0.36;
      const ly = s.y + BARREL * 0.33;
      const mx = (lx + anchor.x) / 2 - 30;
      const my = (ly + anchor.y) / 2 + 120;
      if (reduce) {
        s.kx = mx;
        s.ky = my;
      } else {
        s.kvx += (30 * (mx - s.kx) - 5.2 * s.kvx) * dt;
        s.kvy += (30 * (my - s.ky) - 5.2 * s.kvy) * dt;
        s.kx += s.kvx * dt;
        s.ky += s.kvy * dt;
      }
      paint();
      if (visible) raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(([e]) => {
      const was = visible;
      visible = e.isIntersecting;
      if (visible && !was) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    });
    io.observe(wrap);
    raf = requestAnimationFrame(tick);

    const toScene = (e: PointerEvent) => {
      const r = scene.getBoundingClientRect();
      return { x: clamp((e.clientX - r.left) / s.scale, 0, L.w), y: clamp((e.clientY - r.top) / s.scale, 0, L.h) };
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType === "mouse" || s.drag) {
        const p = toScene(e);
        s.follow = true;
        s.tx = p.x;
        s.ty = p.y;
      }
    };
    const leave = () => {
      if (s.drag) return;
      s.follow = false;
      const p = L.at(s.active);
      s.tx = p.x;
      s.ty = p.y;
      s.tour = Math.max(0, TOUR.indexOf(s.active));
      s.nextAuto = performance.now() + HOLD_MS;
    };
    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse") return;
      s.drag = true;
      loupe.setPointerCapture(e.pointerId);
    };
    const up = () => {
      if (!s.drag) return;
      s.drag = false;
      leave();
    };
    wrap.addEventListener("pointermove", move);
    wrap.addEventListener("pointerleave", leave);
    loupe.addEventListener("pointerdown", down);
    loupe.addEventListener("pointerup", up);
    loupe.addEventListener("pointercancel", up);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      wrap.removeEventListener("pointermove", move);
      wrap.removeEventListener("pointerleave", leave);
      loupe.removeEventListener("pointerdown", down);
      loupe.removeEventListener("pointerup", up);
      loupe.removeEventListener("pointercancel", up);
    };
  }, [reduce, cols, L]);

  const stepBy = (dir: number) => {
    const at = TOUR.indexOf(sim.current.active);
    pick(TOUR[(at + dir + N) % N]);
  };
  const btn = "grid h-10 w-10 place-items-center rounded-full border border-neutral-900/15 bg-white/70 text-neutral-900 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900";
  const ring = (d: number) => ({ left: (SKIRT - d) / 2, top: (SKIRT - d) / 2, width: d, height: d });

  return (
    <section className="relative overflow-hidden bg-[#f1f4f5]">
      {/* the lit acrylic: a hot centre, cooler corners and the faint bars of the tubes underneath */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(70% 78% at 50% 46%, #ffffff 0%, #f8fafb 46%, #e3e9ec 100%)" }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-70" style={{ background: "repeating-linear-gradient(180deg, rgba(255,255,255,0) 0px, rgba(255,255,255,0) 58px, rgba(255,255,255,0.9) 96px, rgba(255,255,255,0) 134px, rgba(255,255,255,0) 150px)" }} />
      {/* brushed metal frame of the light box */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20" style={{ border: "13px solid", borderImage: "linear-gradient(135deg, #eceef0 0%, #a4a9ae 22%, #dfe2e4 45%, #8b9096 70%, #d3d6d9 100%) 1", boxShadow: "inset 0 0 0 1px rgba(30,36,42,0.55), inset 0 3px 10px 2px rgba(50,62,74,0.28)" }} />

      <div ref={wrapRef} className="relative mx-auto w-full max-w-[1100px]" style={{ height: 660 }}>
        <div ref={sceneRef} className="absolute left-1/2 select-none" style={{ top: 44, width: L.w, height: L.h, transformOrigin: "50% 0", transform: "translateX(-50%)" }}>
          {slides.map((_, i) => {
            const p = L.at(i);
            return <Mount key={i} i={i} x={p.x} y={p.y} real onPick={pick} />;
          })}

          {/* neck cord */}
          <svg aria-hidden="true" className="pointer-events-none absolute left-0 top-0 overflow-visible" width={L.w} height={L.h}>
            <path ref={cordShadowRef} fill="none" stroke="rgba(30,44,60,0.22)" strokeWidth="5" strokeLinecap="round" style={{ filter: "blur(3px)", transform: "translate(4px, 7px)" }} />
            <path ref={cordRef} fill="none" stroke="#1a1a1d" strokeWidth="2.8" strokeLinecap="round" />
          </svg>

          {/* the loupe */}
          <div ref={loupeRef} className="absolute left-0 top-0 touch-none" style={{ width: SKIRT, height: SKIRT, willChange: "transform", cursor: "grab" }}>
            <div aria-hidden="true" className="absolute rounded-full bg-[#1e2c3c]" style={{ ...ring(BARREL + 6), transform: "translate(13px, 20px)", filter: "blur(16px)", opacity: 0.42 }} />
            {/* clear acrylic skirt that stands the lens off the film */}
            <div
              aria-hidden="true"
              className="absolute rounded-full"
              style={{ ...ring(SKIRT), background: "radial-gradient(circle, rgba(255,255,255,0) 62%, rgba(255,255,255,0.35) 78%, rgba(190,204,214,0.28) 92%, rgba(120,136,150,0.35) 100%)", boxShadow: "inset 0 0 0 1px rgba(70,84,98,0.5), inset 0 0 0 3px rgba(255,255,255,0.75), inset 0 0 0 4px rgba(70,84,98,0.18), inset 0 -8px 14px -6px rgba(60,74,88,0.3), 0 2px 5px rgba(30,44,60,0.18)" }}
            />
            {/* knurled black barrel */}
            <div aria-hidden="true" className="absolute rounded-full" style={{ ...ring(BARREL), background: "repeating-conic-gradient(from 0deg, #0b0b0c 0deg, #0b0b0c 1.6deg, #2a2b2e 1.6deg, #2a2b2e 3deg)", boxShadow: "0 1px 0 rgba(255,255,255,0.25), 0 6px 10px rgba(10,16,24,0.35)" }} />
            <div aria-hidden="true" className="absolute rounded-full" style={{ ...ring(BARREL), background: "conic-gradient(from 200deg, rgba(255,255,255,0) 0deg, rgba(255,255,255,0.34) 40deg, rgba(255,255,255,0) 86deg, rgba(0,0,0,0.35) 170deg, rgba(255,255,255,0.12) 250deg, rgba(255,255,255,0) 360deg)" }} />
            <div aria-hidden="true" className="absolute rounded-full" style={{ ...ring(BARREL - 16), background: "radial-gradient(circle, #232427 0%, #18191b 72%, #0a0a0b 100%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), 0 0 0 1px #000" }} />
            {/* polished bezel */}
            <div aria-hidden="true" className="absolute rounded-full" style={{ ...ring(LENS + 10), background: "conic-gradient(from 210deg, #f4f5f6, #8e9297 50deg, #2f3134 110deg, #b9bcc0 170deg, #ffffff 215deg, #70747a 270deg, #26282b 320deg, #f4f5f6 360deg)", boxShadow: "0 0 0 1px rgba(0,0,0,0.8)" }} />
            {/* glass */}
            <div className="absolute overflow-hidden rounded-full bg-white" style={ring(LENS)}>
              <div ref={underRef} aria-hidden="true" className="absolute left-0 top-0" style={{ width: L.w, height: L.h, transformOrigin: "0 0", willChange: "transform" }}>
                {slides.map((_, i) => {
                  const p = L.at(i);
                  return <Mount key={i} i={i} x={p.x} y={p.y} real={false} />;
                })}
              </div>
              <div aria-hidden="true" className="absolute inset-0 rounded-full" style={{ boxShadow: "inset 0 0 0 1.5px rgba(0,0,0,0.75), inset 0 0 22px 4px rgba(8,14,22,0.42), inset 3px 4px 10px rgba(255,90,60,0.14), inset -3px -4px 10px rgba(60,140,255,0.16)" }} />
              <div ref={glareRef} aria-hidden="true" className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(42% 30% at 30% 20%, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.18) 55%, rgba(255,255,255,0) 100%), radial-gradient(30% 16% at 70% 86%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 100%)" }} />
            </div>
          </div>
        </div>

        <p aria-live="polite" className="absolute bottom-6 left-7 z-30 font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-neutral-600 sm:bottom-8 sm:left-10">
          <span className="tabular-nums text-neutral-950">Slide {slides[active].no}</span>
          <span className="mx-2 text-neutral-400">/</span>
          <span>{slides[active].date}</span>
          <span className="block text-neutral-950">{slides[active].title}</span>
        </p>
        <div className="absolute bottom-5 right-6 z-30 flex gap-2 sm:bottom-7 sm:right-10">
          <button type="button" onClick={() => stepBy(-1)} aria-label="Move the loupe to the previous slide" className={btn}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4l-6 6 6 6" />
            </svg>
          </button>
          <button type="button" onClick={() => stepBy(1)} aria-label="Move the loupe to the next slide" className={btn}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 4l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
