import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** The prints, in the order they are bound into the book. */
const prints = [
  { title: "Cobalt on ochre", src: "https://images.pexels.com/photos/14792999/pexels-photo-14792999.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Woman in a blue blazer lit with blue light against a deep yellow backdrop", focus: "50% 30%" },
  { title: "White shirt, red room", src: "https://images.pexels.com/photos/2734952/pexels-photo-2734952.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Person with cropped orange hair and hoop earrings in a white shirt against a red backdrop", focus: "55% 25%" },
  { title: "Tangerine halter", src: "https://images.pexels.com/photos/39325164/pexels-photo-39325164.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Woman in an orange halter top and lime skirt seated against a vivid orange backdrop", focus: "50% 30%" },
  { title: "Green sleeve", src: "https://images.pexels.com/photos/21352926/pexels-photo-21352926.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Woman in a green top with a dark jacket slipping off her shoulders against a crimson backdrop", focus: "50% 30%" },
  { title: "Lace gloves", src: "https://images.pexels.com/photos/18763472/pexels-photo-18763472.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Model in an orange jacket covering her eyes with sheer dotted gloves", focus: "50% 35%" },
  { title: "Check coat", src: "https://images.pexels.com/photos/36440745/pexels-photo-36440745.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Man in a grey check coat resting a hand on his temple against a teal backdrop", focus: "50% 25%" },
  { title: "Velvet on magenta", src: "https://images.pexels.com/photos/14938882/pexels-photo-14938882.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Woman in a black velvet dress reclining with one arm raised against a magenta backdrop", focus: "55% 30%" },
  { title: "Pink crop, red wash", src: "https://images.pexels.com/photos/12089098/pexels-photo-12089098.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Woman in a pink crop top and dark trousers lit red against a coral backdrop", focus: "50% 30%" },
  { title: "Blue hour curls", src: "https://images.pexels.com/photos/15817799/pexels-photo-15817799.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Woman with curly hair in a loose sweater under deep blue studio light", focus: "50% 25%" },
];

const N = prints.length;
const SLOTS = N * 2; // panels kept in the page; must be even so the zigzag never breaks
const FOLD = 64; // degrees each panel turns away once it is clear of the centre
const WRAP = 9; // degrees of gentle curve that carries both ends back into the distance
const HOLD_MS = 2600; // pause on each print while it plays by itself

const mod = (a: number, n: number) => ((a % n) + n) % n;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

export default function ConcertinaFoldPhotoBook() {
  const reduce = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const faceRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shadeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const floorRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const sim = useRef({
    pos: -1.4,
    vel: 0,
    target: 0,
    open: 0,
    openVel: 0,
    w: 280,
    dragging: false,
    moved: 0,
    lastX: 0,
    lastT: 0,
    paused: false,
    nextAuto: 0,
    blur: new Array<number>(SLOTS).fill(-1),
    active: 0,
  });

  const step = useCallback((dir: number) => {
    const s = sim.current;
    s.target = Math.round(s.target) + dir;
    s.nextAuto = performance.now() + HOLD_MS * 2;
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const s = sim.current;
    let raf = 0;
    let visible = true;
    let last = performance.now();
    s.nextAuto = last + 1900;
    if (reduce) {
      s.pos = 0;
      s.open = 1;
    }

    const measure = () => {
      const sw = stage.clientWidth;
      s.w = sw < 640 ? Math.round(sw * 0.54) : Math.min(320, Math.round(sw * 0.27));
      stage.style.setProperty("--w", `${s.w}px`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);

    const layout = (now: number) => {
      const w = s.w;
      const idle = reduce ? 0 : Math.sin(now / 1100) * 1.6;
      const stretch = clamp(Math.abs(s.vel) * 0.07, 0, 0.3);
      const fold = (88 + (FOLD - 88) * s.open) * (1 - stretch) + idle;
      const base = Math.round(s.pos);
      const k0 = base - SLOTS / 2;
      const hx: number[] = [0];
      const hz: number[] = [0];
      const th: number[] = [];
      for (let j = 0; j < SLOTS; j++) {
        const k = k0 + j;
        const d = k - s.pos;
        const f = smooth(0.28, 1.2, Math.abs(d));
        // The zigzag, plus a slight wrap so both ends curve away from the viewer.
        const a = (mod(k, 2) === 0 ? 1 : -1) * fold * f + WRAP * Math.tanh(d * 0.9);
        th.push(a);
        const r = (a * Math.PI) / 180;
        hx.push(hx[j] + w * Math.cos(r));
        hz.push(hz[j] - w * Math.sin(r));
      }
      // The point of the strip that should sit dead centre.
      const cj = base - k0;
      const fr = s.pos + 0.5 - base;
      const cr = (th[cj] * Math.PI) / 180;
      const cx = hx[cj] + fr * w * Math.cos(cr);
      // Sit the book back a little so the ridge that folds toward you never outgrows the open panel.
      const cz = hz[cj] - fr * w * Math.sin(cr) + w * 0.4 * Math.sin((fold * Math.PI) / 180);
      for (let j = 0; j < SLOTS; j++) {
        const k = k0 + j;
        const slot = mod(k, SLOTS);
        const el = panelRefs.current[slot];
        if (!el) continue;
        const d = Math.abs(k - s.pos);
        el.style.transform = `translate3d(${(hx[j] - cx).toFixed(2)}px,0,${(hz[j] - cz).toFixed(2)}px) rotateY(${th[j].toFixed(2)}deg)`;
        el.style.opacity = clamp(SLOTS / 2 - 0.4 - d, 0, 1).toFixed(2);
        el.dataset.k = String(k);
        const shade = shadeRefs.current[slot];
        if (shade) shade.style.opacity = Math.abs(Math.sin((th[j] * Math.PI) / 180)).toFixed(3);
        const depth = Math.abs((hz[j] + hz[j + 1]) / 2 - cz + w * 0.4);
        const b = Math.round(clamp((depth - w * 0.55) / (w * 0.4) + (d - 3) * 0.6, 0, 3.5) * 2) / 2;
        if (b !== s.blur[slot]) {
          s.blur[slot] = b;
          const face = faceRefs.current[slot];
          if (face) face.style.filter = b ? `blur(${b}px)` : "none";
        }
      }
      if (floorRef.current) {
        const span = hx[SLOTS] - hx[0];
        floorRef.current.style.width = `${Math.min(span, stage.clientWidth * 1.1).toFixed(0)}px`;
      }
      const a = mod(Math.round(s.pos), N);
      if (a !== s.active) {
        s.active = a;
        setActive(a);
      }
    };

    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      if (reduce) {
        s.pos = s.target;
        s.vel = 0;
        s.open = 1;
      } else {
        if (!s.dragging) {
          const acc = 62 * (s.target - s.pos) - 11.5 * s.vel;
          s.vel += acc * dt;
          s.pos += s.vel * dt;
          if (!s.paused && now > s.nextAuto) {
            s.target = Math.round(s.target) + 1;
            s.nextAuto = now + HOLD_MS;
          }
        }
        const oa = 38 * (1 - s.open) - 9 * s.openVel;
        s.openVel += oa * dt;
        s.open += s.openVel * dt;
      }
      layout(now);
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
    io.observe(stage);
    raf = requestAnimationFrame(tick);

    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      s.dragging = true;
      s.moved = 0;
      s.lastX = e.clientX;
      s.lastT = performance.now();
      s.vel = 0;
      stage.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!s.dragging) return;
      const now = performance.now();
      const dx = e.clientX - s.lastX;
      const dp = -dx / (s.w * 0.78);
      s.pos += dp;
      s.moved += Math.abs(dx);
      const dt = Math.max(1, now - s.lastT) / 1000;
      s.vel = s.vel * 0.6 + (dp / dt) * 0.4;
      s.lastX = e.clientX;
      s.lastT = now;
    };
    const up = (e: PointerEvent) => {
      if (!s.dragging) return;
      s.dragging = false;
      if (s.moved < 6) {
        // A plain tap: bring the tapped panel to the centre.
        const hit = (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest<HTMLElement>("[data-k]");
        if (hit?.dataset.k) s.target = Number(hit.dataset.k);
      } else {
        s.target = Math.round(s.pos + clamp(s.vel, -9, 9) * 0.22);
      }
      s.nextAuto = performance.now() + HOLD_MS * 2;
    };
    stage.addEventListener("pointerdown", down);
    stage.addEventListener("pointermove", move);
    stage.addEventListener("pointerup", up);
    stage.addEventListener("pointercancel", up);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      stage.removeEventListener("pointerdown", down);
      stage.removeEventListener("pointermove", move);
      stage.removeEventListener("pointerup", up);
      stage.removeEventListener("pointercancel", up);
    };
  }, [reduce]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    }
  };

  const pause = (v: boolean) => () => {
    sim.current.paused = v;
    if (!v) sim.current.nextAuto = performance.now() + HOLD_MS;
  };

  return (
    <section className="relative overflow-hidden bg-[#e7e5df] py-10 sm:py-14" onMouseEnter={pause(true)} onMouseLeave={pause(false)} onFocus={pause(true)} onBlur={pause(false)}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(120% 70% at 50% 38%, #f6f5f1 0%, #e9e7e1 48%, #d3d0c8 100%)" }} />
      <div
        ref={stageRef}
        role="group"
        aria-roledescription="carousel"
        aria-label="Concertina photo book. Use the left and right arrow keys to pull it through."
        tabIndex={0}
        onKeyDown={onKey}
        className="relative mx-auto w-full max-w-6xl cursor-grab touch-pan-y select-none outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-4 focus-visible:ring-offset-[#e7e5df] active:cursor-grabbing"
        style={{ height: "calc(var(--w, 280px) * 1.44 + 72px)", perspective: "1900px", perspectiveOrigin: "50% 4%" }}
      >
        <div className="absolute left-1/2 top-6" style={{ transformStyle: "preserve-3d", width: 0, height: "calc(var(--w, 280px) * 1.44)" }}>
          {/* One soft pool of shadow under the whole book */}
          <div
            ref={floorRef}
            aria-hidden="true"
            className="absolute bottom-0 left-0 h-40"
            style={{
              transform: "translateX(-50%) translateY(50%) rotateX(90deg)",
              background: "radial-gradient(closest-side, rgba(40,32,20,0.2), rgba(40,32,20,0.08) 55%, rgba(40,32,20,0) 100%)",
              filter: "blur(10px)",
            }}
          />
          {Array.from({ length: SLOTS }, (_, slot) => {
            const p = prints[slot % N];
            const away = slot % 2 === 0;
            return (
              <div
                key={slot}
                ref={(el) => {
                  panelRefs.current[slot] = el;
                }}
                className="absolute left-0 top-0 h-full"
                style={{ width: "var(--w, 280px)", transformOrigin: "0 50%", transformStyle: "preserve-3d", willChange: "transform" }}
              >
                <div
                  ref={(el) => {
                    faceRefs.current[slot] = el;
                  }}
                  className="absolute inset-0 overflow-hidden rounded-[3px] bg-[#f4f1ea]"
                  style={{ boxShadow: "inset 0 0 0 1px rgba(60,48,30,0.10)", backfaceVisibility: "hidden" }}
                >
                  <div className="absolute inset-[5%] bottom-[13%] overflow-hidden bg-stone-300">
                    <img src={p.src} alt={slot < N ? p.alt : ""} loading="lazy" draggable={false} className="h-full w-full object-cover" style={{ objectPosition: p.focus }} />
                  </div>
                  <div className="absolute inset-x-[6%] bottom-[4.2%] flex items-baseline justify-between font-mono text-[9px] uppercase tracking-[0.14em] text-stone-600 sm:text-[10px]">
                    <span>{p.title}</span>
                    <span>{String((slot % N) + 1).padStart(2, "0")}</span>
                  </div>
                  {/* Light falling across the fold: bright on the ridge, dark in the valley */}
                  <div
                    ref={(el) => {
                      shadeRefs.current[slot] = el;
                    }}
                    aria-hidden="true"
                    className="absolute inset-0"
                    style={{
                      background: away
                        ? "linear-gradient(90deg, rgba(255,255,255,0.10) 0%, rgba(28,20,10,0.30) 30%, rgba(28,20,10,0.72) 100%)"
                        : "linear-gradient(90deg, rgba(28,20,10,0.50) 0%, rgba(28,20,10,0.08) 34%, rgba(255,255,255,0.14) 100%)",
                      opacity: 0,
                    }}
                  />
                </div>
                {/* Contact shadow thrown forward onto the table */}
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-full h-[20%]"
                  style={{ transformOrigin: "50% 0", transform: "rotateX(90deg)", background: "linear-gradient(180deg, rgba(40,32,20,0.42), rgba(40,32,20,0) 85%)", filter: "blur(4px)" }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="relative mx-auto mt-2 flex max-w-md items-center justify-between px-4">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Previous print"
          className="grid h-10 w-10 place-items-center rounded-full text-stone-700 transition hover:bg-stone-900/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 4l-6 6 6 6" />
          </svg>
        </button>
        <p aria-live="polite" className="text-center font-mono text-[11px] uppercase tracking-[0.18em] text-stone-700">
          <span className="tabular-nums">{String(active + 1).padStart(2, "0")}</span>
          <span className="mx-2 text-stone-500">/</span>
          {prints[active].title}
        </p>
        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Next print"
          className="grid h-10 w-10 place-items-center rounded-full text-stone-700 transition hover:bg-stone-900/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900"
        >
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 4l6 6-6 6" />
          </svg>
        </button>
      </div>
    </section>
  );
}
