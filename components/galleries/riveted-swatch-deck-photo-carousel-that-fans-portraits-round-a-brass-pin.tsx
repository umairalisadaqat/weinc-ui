import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** One leaf per backdrop paper: the colour chip, its name and roll code, and a portrait shot on it. Top of the deck first. */
const leaves = [
  { name: "Marigold", code: "BP 114", chip: "#f5a00c", src: "https://images.pexels.com/photos/11493115/pexels-photo-11493115.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Woman in a white top and black trousers sitting on a step ladder against an orange backdrop", focus: "38% 50%" },
  { name: "Fern", code: "BP 207", chip: "#3d8a3c", src: "https://images.pexels.com/photos/12104261/pexels-photo-12104261.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Man in black with a silver chain standing against a green backdrop", focus: "55% 50%" },
  { name: "Poppy", code: "BP 031", chip: "#e0362c", src: "https://images.pexels.com/photos/32174989/pexels-photo-32174989.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Woman holding out a pleated metallic skirt against a red backdrop", focus: "52% 50%" },
  { name: "Lagoon", code: "BP 162", chip: "#12aebf", src: "https://images.pexels.com/photos/33231184/pexels-photo-33231184.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Woman in yellow heart shaped sunglasses with her arms raised against a turquoise backdrop", focus: "55% 50%" },
  { name: "Cobalt", code: "BP 188", chip: "#1d50b6", src: "https://images.pexels.com/photos/30755172/pexels-photo-30755172.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Person in pale blue crouching against a deep blue backdrop", focus: "45% 50%" },
  { name: "Canary", code: "BP 102", chip: "#fdd31d", src: "https://images.pexels.com/photos/35511773/pexels-photo-35511773.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Woman in a grey check blazer leaning on a bright yellow wall", focus: "62% 50%" },
  { name: "Apricot", code: "BP 046", chip: "#f08a55", src: "https://images.pexels.com/photos/6923372/pexels-photo-6923372.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Woman in a ruffled orange outfit and red sunglasses against an apricot backdrop", focus: "55% 50%" },
  { name: "Emerald", code: "BP 213", chip: "#0d8748", src: "https://images.pexels.com/photos/32174358/pexels-photo-32174358.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Woman in a teal suit and pink heels standing beside green curtains", focus: "42% 50%" },
  { name: "Pine", code: "BP 229", chip: "#1e4a47", src: "https://images.pexels.com/photos/4823731/pexels-photo-4823731.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Woman in a brown blazer standing in front of a dark green painted backdrop", focus: "50% 50%" },
];

const N = leaves.length;
// Design pixels; the scene is scaled as one piece to fit narrow screens.
const SCENE_W = 880;
const SCENE_H = 566;
const PX = SCENE_W / 2; // the pin
const PY = 490;
const LW = 124; // leaf width
const LH = 470; // leaf length
const PIN = 440; // distance from the top of a leaf to its hole
const GAP = 36; // degrees the leaf above the open one is pushed aside
const HOLD_MS = 2300;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const ease = (t: number) => t * t * (3 - 2 * t);

/** Resting angle of a leaf that is `d` places from the open one (negative: above it, swung left). */
function angleFor(d: number) {
  if (d < 0) {
    const m = -d;
    if (m <= 1) return -GAP * ease(m);
    return -(GAP + 38 * (1 - Math.exp(-(m - 1) * 0.38)));
  }
  return 60 * (1 - Math.exp(-d * 0.34));
}

export default function RivetedSwatchDeck() {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef<HTMLDivElement>(null);
  const leafRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sheenRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(4);
  const sim = useRef({
    c: 4,
    cv: 0,
    target: 4,
    a: new Array<number>(N).fill(0),
    v: new Array<number>(N).fill(0),
    tx: 0,
    ty: 0,
    px: 0,
    py: 0,
    dragging: false,
    moved: 0,
    lastX: 0,
    lastT: 0,
    scale: 1,
    paused: false,
    nextAuto: 0,
    active: 4,
  });

  const go = useCallback((to: number) => {
    const s = sim.current;
    s.target = clamp(to, 0, N - 1);
    s.nextAuto = performance.now() + HOLD_MS * 2;
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    const scene = sceneRef.current;
    const deck = deckRef.current;
    if (!wrap || !scene || !deck) return;
    const s = sim.current;
    let raf = 0;
    let visible = true;
    let last = performance.now();
    s.nextAuto = last + 2400;

    const measure = () => {
      const sc = clamp(wrap.clientWidth / 800, 0.56, 1);
      s.scale = sc;
      wrap.style.height = `${Math.round(SCENE_H * sc)}px`;
      scene.style.transform = `translateX(-50%) scale(${sc.toFixed(4)})`;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);

    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      if (reduce) {
        s.c = s.target;
        s.cv = 0;
      } else if (!s.dragging) {
        const acc = 34 * (s.target - s.c) - 10.5 * s.cv;
        s.cv += acc * dt;
        s.c += s.cv * dt;
        if (!s.paused && now > s.nextAuto) {
          // thumb through to the bottom leaf, then let the whole deck sweep back
          s.target = s.target >= N - 1 ? 0 : s.target + 1;
          s.nextAuto = now + (s.target === 0 ? HOLD_MS * 1.5 : HOLD_MS);
        }
      }
      // keep the fan centred over the pin whichever leaf is open
      const bias = (0.5 - s.c / (N - 1)) * -14 + 3;
      const sway = reduce ? 0 : Math.sin(now / 1400) * 0.7;
      for (let i = 0; i < N; i++) {
        const want = angleFor(i - s.c) + bias + sway * (1 + Math.abs(i - s.c) * 0.25);
        if (reduce) {
          s.a[i] = want;
          s.v[i] = 0;
        } else {
          // leaves further from the open one are looser, so they trail behind it
          const k = 150 - Math.min(5, Math.abs(i - s.c)) * 13;
          const acc = k * (want - s.a[i]) - 15 * s.v[i];
          s.v[i] += acc * dt;
          s.a[i] += s.v[i] * dt;
        }
        const el = leafRefs.current[i];
        if (!el) continue;
        const a = s.a[i];
        const r = (a * Math.PI) / 180;
        const lift = clamp(Math.abs(s.v[i]) * 0.06, 0, 10);
        el.style.transform = `translateZ(${((N - i) * 1.6 + lift).toFixed(2)}px) rotate(${a.toFixed(3)}deg)`;
        // the light stays put while the leaf turns, so the shadow is counter-rotated
        const sx = 5 + lift * 0.6;
        const sy = 9 + lift;
        const lx = sx * Math.cos(r) + sy * Math.sin(r);
        const ly = -sx * Math.sin(r) + sy * Math.cos(r);
        el.style.boxShadow = `0 0 0 0.5px rgba(40,34,24,0.22), ${lx.toFixed(1)}px ${ly.toFixed(1)}px ${(16 + lift * 2).toFixed(0)}px rgba(30,28,40,0.2), ${(lx * 0.2).toFixed(1)}px ${(ly * 0.2).toFixed(1)}px 2px rgba(30,28,40,0.22)`;
        const sh = sheenRefs.current[i];
        if (sh) sh.style.backgroundPosition = `${(50 + a * 1.7 + s.px * 30).toFixed(1)}% 0`;
      }
      s.px += (s.tx - s.px) * Math.min(1, dt * 6);
      s.py += (s.ty - s.py) * Math.min(1, dt * 6);
      deck.style.transform = `rotateX(${(15 - s.py * 5).toFixed(2)}deg) rotateY(${(s.px * 7).toFixed(2)}deg)`;
      const a = clamp(Math.round(s.c), 0, N - 1);
      if (a !== s.active) {
        s.active = a;
        setActive(a);
      }
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

    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      s.dragging = true;
      s.moved = 0;
      s.lastX = e.clientX;
      s.lastT = performance.now();
      s.cv = 0;
      wrap.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      const rect = wrap.getBoundingClientRect();
      if (e.pointerType === "mouse" && !reduce) {
        s.tx = clamp((e.clientX - rect.left) / rect.width - 0.5, -0.5, 0.5) * 2;
        s.ty = clamp((e.clientY - rect.top) / rect.height - 0.5, -0.5, 0.5) * 2;
      }
      if (!s.dragging) return;
      const now = performance.now();
      const dx = e.clientX - s.lastX;
      const dc = dx / (120 * s.scale);
      s.c = clamp(s.c + dc, -0.35, N - 0.65);
      s.moved += Math.abs(dx);
      const dt = Math.max(1, now - s.lastT) / 1000;
      s.cv = s.cv * 0.6 + (dc / dt) * 0.4;
      s.lastX = e.clientX;
      s.lastT = now;
    };
    const up = (e: PointerEvent) => {
      if (!s.dragging) return;
      s.dragging = false;
      if (s.moved < 6) {
        const hit = (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest<HTMLElement>("[data-leaf]");
        if (hit?.dataset.leaf) s.target = Number(hit.dataset.leaf);
      } else {
        s.target = clamp(Math.round(s.c + clamp(s.cv, -8, 8) * 0.2), 0, N - 1);
      }
      s.nextAuto = performance.now() + HOLD_MS * 2;
    };
    const leave = () => {
      s.tx = 0;
      s.ty = 0;
    };
    wrap.addEventListener("pointerdown", down);
    wrap.addEventListener("pointermove", move);
    wrap.addEventListener("pointerup", up);
    wrap.addEventListener("pointercancel", up);
    wrap.addEventListener("pointerleave", leave);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      wrap.removeEventListener("pointerdown", down);
      wrap.removeEventListener("pointermove", move);
      wrap.removeEventListener("pointerup", up);
      wrap.removeEventListener("pointercancel", up);
      wrap.removeEventListener("pointerleave", leave);
    };
  }, [reduce]);

  const onKey = (e: React.KeyboardEvent) => {
    const t = sim.current.target;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      go(t + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      go(t - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      go(0);
    } else if (e.key === "End") {
      e.preventDefault();
      go(N - 1);
    }
  };
  const pause = (v: boolean) => () => {
    sim.current.paused = v;
    if (!v) sim.current.nextAuto = performance.now() + HOLD_MS;
  };

  const btn = "grid h-10 w-10 place-items-center rounded-full text-slate-700 transition hover:bg-slate-900/10 disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900";
  const cur = leaves[active];

  return (
    <section className="relative overflow-hidden bg-[#dfe3ec] pb-8 pt-6" onMouseEnter={pause(true)} onMouseLeave={pause(false)} onFocus={pause(true)} onBlur={pause(false)}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(70% 80% at 50% 45%, #f1f3f8 0%, #dfe3ec 55%, #c9cedb 100%)" }} />
      <div
        ref={wrapRef}
        role="group"
        aria-roledescription="carousel"
        aria-label="Swatch deck of portraits. Use the left and right arrow keys to thumb through the leaves."
        tabIndex={0}
        onKeyDown={onKey}
        className="relative mx-auto w-full cursor-grab touch-pan-y select-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-900/70 active:cursor-grabbing"
        style={{ height: SCENE_H }}
      >
        <div ref={sceneRef} className="absolute left-1/2 top-0" style={{ width: SCENE_W, height: SCENE_H, transformOrigin: "50% 0", transform: "translateX(-50%)", perspective: "1500px", perspectiveOrigin: "50% 40%" }}>
          <div ref={deckRef} className="absolute inset-0" style={{ transformStyle: "preserve-3d", transformOrigin: `${PX}px ${PY}px`, transform: "rotateX(15deg)" }}>
            {/* soft pool of shadow on the table under the pin */}
            <div aria-hidden="true" className="absolute rounded-full" style={{ left: PX - 300, top: PY - 250, width: 600, height: 340, background: "radial-gradient(closest-side, rgba(40,44,70,0.22), rgba(40,44,70,0))", transform: "translateZ(-2px)" }} />
            {leaves.map((l, i) => (
              <div
                key={l.name}
                ref={(el) => {
                  leafRefs.current[i] = el;
                }}
                data-leaf={i}
                className="absolute rounded-[13px] bg-[#fbf9f4]"
                style={{ left: PX - LW / 2, top: PY - PIN, width: LW, height: LH, transformOrigin: `${LW / 2}px ${PIN}px`, zIndex: N - i, willChange: "transform" }}
              >
                <div className="absolute left-[6px] right-[6px] top-[6px] h-[292px] overflow-hidden rounded-[8px] bg-slate-300">
                  <img src={l.src} alt={l.alt} loading="lazy" draggable={false} className="h-full w-full object-cover" style={{ objectPosition: l.focus }} />
                  {/* a band of gloss that slides across the laminate as the leaf turns */}
                  <div
                    ref={(el) => {
                      sheenRefs.current[i] = el;
                    }}
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{ backgroundImage: "linear-gradient(105deg, rgba(255,255,255,0) 35%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0) 65%)", backgroundSize: "300% 100%", backgroundPosition: "50% 0" }}
                  />
                  <div aria-hidden="true" className="absolute inset-0 rounded-[8px]" style={{ boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)" }} />
                </div>
                <div className="absolute left-[6px] right-[6px] top-[304px] h-[38px] rounded-[4px]" style={{ background: l.chip, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)" }} />
                <div className="absolute left-[9px] right-[9px] top-[350px]">
                  <div className="text-[13px] font-semibold leading-tight tracking-tight text-slate-900">{l.name}</div>
                  <div className="mt-0.5 font-mono text-[8.5px] uppercase tracking-[0.14em] text-slate-600">{l.code}</div>
                </div>
                <div className="absolute left-[9px] top-[392px] font-mono text-[7px] uppercase leading-[1.5] tracking-[0.14em] text-slate-500">
                  2.72 m roll
                  <br />
                  Matte
                </div>
                {/* edge highlight so each leaf reads as a slip of card with thickness */}
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[13px]" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1.5px 0 rgba(120,110,95,0.35)" }} />
              </div>
            ))}
            {/* the brass pin that holds the deck */}
            <div
              aria-hidden="true"
              className="absolute rounded-full"
              style={{
                left: PX - 13,
                top: PY - 13,
                width: 26,
                height: 26,
                zIndex: N + 2,
                transform: "translateZ(22px)",
                background: "radial-gradient(circle at 34% 28%, #fff6cf 0%, #f0cf74 22%, #c8962f 52%, #7c5512 86%, #5b3d0b 100%)",
                boxShadow: "0 3px 5px rgba(30,24,10,0.45), 0 0 0 1px rgba(80,54,10,0.5), inset 0 -2px 3px rgba(60,40,6,0.55)",
              }}
            >
              <div className="absolute left-1/2 top-1/2 h-[11px] w-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "radial-gradient(circle at 60% 66%, #f7dc8c, #a8791f 70%)", boxShadow: "inset 0 1px 2px rgba(60,40,6,0.7)" }} />
            </div>
          </div>
        </div>
      </div>

      <div className="relative mx-auto flex max-w-sm items-center justify-between px-4">
        <button type="button" onClick={() => go(sim.current.target - 1)} disabled={active === 0} aria-label="Previous leaf" className={btn}>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 4l-6 6 6 6" />
          </svg>
        </button>
        <p aria-live="polite" className="flex items-center gap-2.5 text-[13px] font-medium text-slate-800">
          <span aria-hidden="true" className="h-3 w-3 rounded-full" style={{ background: cur.chip, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.12)" }} />
          {cur.name}
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-600">{cur.code}</span>
        </p>
        <button type="button" onClick={() => go(sim.current.target + 1)} disabled={active === N - 1} aria-label="Next leaf" className={btn}>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 4l6 6-6 6" />
          </svg>
        </button>
      </div>
    </section>
  );
}
