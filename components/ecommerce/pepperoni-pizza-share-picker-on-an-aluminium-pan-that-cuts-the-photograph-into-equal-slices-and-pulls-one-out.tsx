import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** The pie on the pan. `cx`, `cy` and `r` say where the pizza sits inside its photograph, as fractions of the picture's width. */
const pizza = {
  name: "Pepperoni, 14 inch",
  price: 19.5,
  currency: "£",
  min: 2,
  max: 8,
  start: 6,
  photo: {
    src: "https://images.pexels.com/photos/29829308/pexels-photo-29829308.jpeg?auto=compress&cs=tinysrgb&w=1000",
    alt: "Whole pepperoni pizza with a charred crust seen from directly above",
    tone: "#c4572b",
    cx: 0.5035,
    cy: 0.5215,
    r: 0.444,
  },
};

// Design pixels. The scene is a square that is scaled down as one object on narrow screens.
const SCENE = 676;
const PAN = 614;
const D = 468; // pizza diameter
const GAP = 7; // how far every slice sits from the centre once cut
const PULL = 58; // extra travel of the slice that is yours
const NUDGE = 13; // lift under the pointer
const STIFF = 190;
const DAMP = 15;
const HOLD_MS = 2600;
const DEMO = [8, 4, 3, 5, 6];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const rad = (d: number) => (d * Math.PI) / 180;

function wedge(a0: number, a1: number) {
  const pts = ["50% 50%"];
  const steps = Math.max(2, Math.ceil((a1 - a0) / 4));
  for (let s = 0; s <= steps; s += 1) {
    const a = rad(a0 + ((a1 - a0) * s) / steps);
    pts.push(`${(50 + 50 * Math.cos(a)).toFixed(3)}% ${(50 + 50 * Math.sin(a)).toFixed(3)}%`);
  }
  return `polygon(${pts.join(",")})`;
}

const WELL = "conic-gradient(from 200deg, #d9dadb 0deg, #9da0a3 34deg, #cfd0d1 70deg, #7e8285 112deg, #bfc1c2 150deg, #8f9396 190deg, #dcdddd 230deg, #868a8d 268deg, #c6c8c9 306deg, #9a9ea1 336deg, #d9dadb 360deg)";
const BRUSHED = "conic-gradient(from 218deg, #f6f6f4 0deg, #b9bbbd 28deg, #e6e7e7 58deg, #8d9093 96deg, #d5d6d6 132deg, #a2a5a8 170deg, #efefee 204deg, #969a9d 244deg, #dcdddd 286deg, #a9acae 322deg, #f6f6f4 360deg)";

export default function PizzaSharePicker() {
  const reduce = !!useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const sliceRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [n, setN] = useState(pizza.start);
  const [mineAt, setMineAt] = useState(18); // compass angle (0 is right, 90 is down) of the slice that is pulled out
  const [focus, setFocus] = useState(-1);
  const live = useRef({ n: pizza.start, mineAt: 18, hover: -1, closed: false, openAt: 0, touched: false, pos: Array(pizza.max).fill(GAP), vel: Array(pizza.max).fill(0) });

  const span = 360 / n;
  const mine = Math.floor((((mineAt + 90) % 360) + 360) % 360 / span) % n;
  live.current.n = n;
  live.current.mineAt = mineAt;

  const bg = useMemo(() => {
    const size = D / (2 * pizza.photo.r);
    return { backgroundImage: `url(${pizza.photo.src})`, backgroundSize: `${size.toFixed(1)}px auto`, backgroundPosition: `${(D / 2 - pizza.photo.cx * size).toFixed(1)}px ${(D / 2 - pizza.photo.cy * size).toFixed(1)}px`, backgroundColor: pizza.photo.tone, filter: "saturate(1.18) contrast(1.06)" };
  }, []);

  // close the pie, cut it again, then let the slices spring apart one after another
  const timer = useRef(0);
  const cut = (to: number) => {
    const next = clamp(to, pizza.min, pizza.max);
    if (next === live.current.n) return;
    if (reduce) {
      setN(next);
      return;
    }
    live.current.closed = true;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setN(next);
      live.current.closed = false;
      live.current.openAt = performance.now();
    }, 300);
  };

  useEffect(() => {
    const wrap = wrapRef.current;
    const scene = sceneRef.current;
    if (!wrap || !scene) return;
    const measure = () => {
      const sc = clamp(wrap.clientWidth / (SCENE - 30), 0.46, 1);
      wrap.style.height = `${Math.round(SCENE * sc)}px`;
      scene.style.transform = `translateX(-50%) scale(${sc.toFixed(4)})`;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const s = live.current;
    let raf = 0;
    let last = performance.now();
    let seen = true;
    const io = new IntersectionObserver(([e]) => (seen = e.isIntersecting));
    if (wrapRef.current) io.observe(wrapRef.current);
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!seen || document.hidden) {
        last = now;
        return;
      }
      const dt = Math.min(0.032, (now - last) / 1000);
      last = now;
      const sp = 360 / s.n;
      const my = Math.floor((((s.mineAt + 90) % 360) + 360) % 360 / sp) % s.n;
      for (let i = 0; i < pizza.max; i += 1) {
        const el = sliceRefs.current[i];
        if (!el || i >= s.n) continue;
        const waiting = now - s.openAt < i * 42;
        const target = s.closed || waiting ? 0 : GAP + (i === my ? PULL : 0) + (i === s.hover ? NUDGE : 0);
        if (reduce) {
          s.pos[i] = target;
          s.vel[i] = 0;
        } else {
          s.vel[i] += (-STIFF * (s.pos[i] - target) - DAMP * s.vel[i]) * dt;
          s.pos[i] += s.vel[i] * dt;
        }
        const mid = rad(-90 + (i + 0.5) * sp);
        const p = s.pos[i];
        const lift = clamp((p - GAP) / PULL, 0, 1.2);
        el.style.transform = `translate(${(Math.cos(mid) * p).toFixed(2)}px, ${(Math.sin(mid) * p).toFixed(2)}px) rotate(${(lift * 3.2).toFixed(2)}deg)`;
        el.style.filter = `drop-shadow(${(2 + lift * 7).toFixed(1)}px ${(3.5 + lift * 11).toFixed(1)}px ${(2.5 + lift * 9).toFixed(1)}px rgba(24,12,4,${(0.7 - lift * 0.25).toFixed(2)}))`;
      }
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [reduce]);

  // the demo: start from the finished picture, then try other head counts until someone touches it
  useEffect(() => {
    if (reduce) return;
    let k = 0;
    let loop = 0;
    // the first hold is longer, so the opening picture is the finished one
    const first = window.setTimeout(() => {
      loop = window.setInterval(() => {
        if (live.current.touched || document.hidden) return;
        cut(DEMO[k % DEMO.length]);
        k += 1;
      }, HOLD_MS);
    }, 2400);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(loop);
      window.clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  const each = (pizza.price / n).toFixed(2);
  const step = (by: number) => {
    live.current.touched = true;
    cut(live.current.n + by);
  };
  const round = "grid h-11 w-11 place-items-center rounded-full bg-[#1d1a16] text-[#f4eee2] transition-transform duration-150 hover:scale-105 active:scale-95 disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b3311b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ebe4d5]";

  return (
    <section className="relative overflow-hidden bg-[#ebe4d5]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(70% 62% at 42% 36%, #f7f2e7 0%, #ebe4d5 55%, #d9d0bd 100%)" }} />
      <div ref={wrapRef} className="relative mx-auto w-full" style={{ height: SCENE }}>
        <div ref={sceneRef} className="absolute left-1/2 top-0 select-none" style={{ width: SCENE, height: SCENE, transformOrigin: "50% 0", transform: "translateX(-50%)" }}>
          {/* the pan: its shadow on the table, the rolled rim, the spun well */}
          <div aria-hidden="true" className="absolute rounded-full" style={{ left: (SCENE - PAN) / 2 + 14, top: (SCENE - PAN) / 2 + 22, width: PAN, height: PAN, background: "rgba(60,40,15,0.5)", filter: "blur(26px)" }} />
          <div aria-hidden="true" className="absolute rounded-full" style={{ left: (SCENE - PAN) / 2 + 3, top: (SCENE - PAN) / 2 + 5, width: PAN, height: PAN, background: "rgba(40,26,10,0.6)", filter: "blur(4px)" }} />
          <div aria-hidden="true" className="absolute rounded-full" style={{ left: (SCENE - PAN) / 2, top: (SCENE - PAN) / 2, width: PAN, height: PAN, background: BRUSHED, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.55), inset 2px 3px 3px rgba(255,255,255,0.85), inset -2px -3px 4px rgba(0,0,0,0.38)" }}>
            <div className="absolute inset-[15px] rounded-full" style={{ background: WELL, boxShadow: "inset 5px 8px 12px rgba(0,0,0,0.5), inset 1px 2px 2px rgba(0,0,0,0.55), inset -3px -4px 4px rgba(255,255,255,0.75), 0 0 0 1px rgba(0,0,0,0.22), 0 0 0 2.5px rgba(255,255,255,0.35)" }}>
              <div className="absolute inset-0 rounded-full" style={{ background: "repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.09) 0 0.6px, rgba(0,0,0,0.05) 0.6px 1.7px, rgba(255,255,255,0) 1.7px 3.1px)" }} />
              <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 60%, rgba(0,0,0,0.14) 100%)" }} />
              {/* knife scores left by other pies */}
              {[[22, 38, 190, 24], [48, 64, 240, -41], [30, 71, 150, 8], [55, 30, 210, 63], [18, 52, 260, -12]].map(([x, y, w, r], i) => (
                <span key={`k${i}`} className="absolute h-px" style={{ left: `${x}%`, top: `${y}%`, width: w, transform: `rotate(${r}deg)`, background: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.55) 30%, rgba(0,0,0,0.2) 70%, rgba(0,0,0,0))" }} />
              ))}
              {/* oil and a few crumbs left where the pie was cut */}
              <div className="absolute rounded-full" style={{ inset: 58, background: "radial-gradient(circle at 46% 44%, rgba(214,120,20,0.1) 0%, rgba(200,104,24,0.07) 58%, rgba(190,110,40,0) 72%), radial-gradient(circle at 62% 60%, rgba(120,60,10,0.1) 0%, rgba(120,60,10,0) 40%)" }} />
              {[
                [44, 31, 5], [57, 68, 4], [29, 55, 3], [66, 40, 4], [49, 52, 5], [38, 72, 3], [71, 60, 3], [52, 24, 3],
              ].map(([x, y, w], i) => (
                <span key={i} className="absolute rounded-full" style={{ left: `${x}%`, top: `${y}%`, width: w, height: w - 1, background: "#a8641f", boxShadow: "0.5px 1px 0.5px rgba(0,0,0,0.45)" }} />
              ))}
            </div>
          </div>

          {/* the pizza: one photograph, cut into wedges */}
          <div role="group" aria-label={`${pizza.name}, cut into ${n} slices`} className="absolute" style={{ left: (SCENE - D) / 2, top: (SCENE - D) / 2, width: D, height: D }}>
            <img src={pizza.photo.src} alt={pizza.photo.alt} className="sr-only" />
            {Array.from({ length: pizza.max }, (_, i) => {
              const on = i < n;
              const a0 = -90 + i * span;
              return (
                <div
                  key={i}
                  ref={(el) => {
                    sliceRefs.current[i] = el;
                  }}
                  className="absolute inset-0"
                  style={{ display: on ? "block" : "none", zIndex: i === mine ? 3 : i === focus ? 2 : 1, willChange: "transform", pointerEvents: "none" }}
                >
                  <button
                    type="button"
                    aria-pressed={i === mine}
                    aria-label={`Slice ${i + 1} of ${n}${i === mine ? ", pulled out" : ", pull this one out"}`}
                    onClick={() => {
                      live.current.touched = true;
                      setMineAt(a0 + span / 2);
                    }}
                    onPointerEnter={() => (live.current.hover = i)}
                    onPointerLeave={() => (live.current.hover = -1)}
                    onFocus={() => {
                      live.current.hover = i;
                      setFocus(i);
                    }}
                    onBlur={() => {
                      live.current.hover = -1;
                      setFocus(-1);
                    }}
                    className="absolute inset-0 block cursor-pointer outline-none"
                    style={{ ...bg, pointerEvents: "auto", clipPath: on ? wedge(a0 + 0.12, a0 + span - 0.12) : undefined }}
                  >
                    {/* light catching the cheese, and the focus mark drawn on the slice itself */}
                    <span className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 50%, rgba(30,10,0,0) 78%, rgba(30,10,0,0.22) 100%)" }} />
                    {i === focus && <span className="absolute inset-0" style={{ boxShadow: "inset 0 0 0 5px #ffffff, inset 0 0 0 9px #1d4ed8", borderRadius: "50%" }} />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="relative mx-auto flex max-w-md flex-col items-center gap-3 px-4 pb-8 pt-1 sm:pb-9">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => step(-1)} disabled={n <= pizza.min} aria-label="One person fewer" className={round}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
          <p className="min-w-[10.5rem] text-center text-[15px] font-medium tracking-tight text-[#2b2620]" aria-live="polite">
            Shared between <span className="inline-block w-[1.1ch] text-center font-semibold tabular-nums text-[#b3311b]">{n}</span>
            <span className="block font-mono text-[11px] uppercase tracking-[0.18em] text-[#5d5446]">
              {pizza.currency}
              {each} a slice
            </span>
          </p>
          <button type="button" onClick={() => step(1)} disabled={n >= pizza.max} aria-label="One person more" className={round}>
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M8 3v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#5d5446]">
          {pizza.name} · {pizza.currency}
          {pizza.price.toFixed(2)}
        </p>
      </div>
    </section>
  );
}
