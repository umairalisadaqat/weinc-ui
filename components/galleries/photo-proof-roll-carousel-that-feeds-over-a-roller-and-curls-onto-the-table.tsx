import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** The frames printed down the roll, top to bottom in the order they come off the roller. */
const frames = [
  { title: "Veil, vermilion", src: "https://images.pexels.com/photos/18506117/pexels-photo-18506117.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Woman in sunglasses under a sheer orange veil against a vermilion backdrop", focus: "50% 30%" },
  { title: "Two neons", src: "https://images.pexels.com/photos/9998656/pexels-photo-9998656.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Young woman standing in a haze of blue and red studio light", focus: "50% 50%" },
  { title: "Bandaged gloves", src: "https://images.pexels.com/photos/39325157/pexels-photo-39325157.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Woman in an orange top and wrapped white gloves posing against an orange backdrop", focus: "50% 40%" },
  { title: "Green room", src: "https://images.pexels.com/photos/7659347/pexels-photo-7659347.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Woman in a dark suit in profile against a saturated green backdrop", focus: "50% 30%" },
  { title: "Rust bodysuit", src: "https://images.pexels.com/photos/14999126/pexels-photo-14999126.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Woman with cropped blonde hair in a rust bodysuit against a deep red backdrop", focus: "50% 30%" },
  { title: "Yellow wall", src: "https://images.pexels.com/photos/35511773/pexels-photo-35511773.jpeg?auto=compress&cs=tinysrgb&w=700", alt: "Woman in a grey check blazer leaning one hand on a bright yellow wall", focus: "50% 40%" },
];

const N = frames.length;
// Everything below is in design pixels for a 300 wide roll; the whole scene is scaled to fit.
const W = 300; // paper width
const PHOTO = 396; // printed photo height
const BAND = 58; // white band under each photo that carries the plate caption
const PERIOD = PHOTO + BAND;
const TOTAL = PERIOD * N;
const R1 = 30; // roller radius
const RUN = 476; // flat length that hangs facing you
const R2 = 86; // radius of the curl where the paper meets the table
const TABLE = 330; // length lying on the table
const TOP_PAD = 46;
const SCENE_W = 760;
const SCENE_H = 790;
const HOLD_MS = 2800;

const mod = (a: number, n: number) => ((a % n) + n) % n;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const rad = (d: number) => (d * Math.PI) / 180;

type Strip = { s: number; h: number; y: number; z: number; a: number; shade: string };

/** Cut the paper path into flat strips: many thin ones round the two curves, one each for the flat runs. */
function buildStrips(): Strip[] {
  const out: Strip[] = [];
  const yc = TOP_PAD + R1;
  const yb = yc + RUN;
  let s = 0;
  const topFrom = 104;
  const nTop = 9;
  for (let i = 0; i < nTop; i++) {
    const a0 = topFrom - (topFrom / nTop) * i;
    const a1 = topFrom - (topFrom / nTop) * (i + 1);
    const am = (a0 + a1) / 2;
    const h = R1 * rad(a0 - a1);
    const dark = 0.62 * Math.pow(Math.sin(rad(clamp(am, 0, 90))), 1.3);
    const glint = 0.2 * Math.exp(-Math.pow((am - 30) / 16, 2));
    out.push({
      s,
      h,
      y: yc - R1 * Math.sin(rad(a0)),
      z: -R1 + R1 * Math.cos(rad(a0)),
      a: am,
      shade: `linear-gradient(rgba(255,255,255,${glint.toFixed(3)}),rgba(255,255,255,${glint.toFixed(3)})),linear-gradient(rgba(8,8,10,${dark.toFixed(3)}),rgba(8,8,10,${dark.toFixed(3)}))`,
    });
    s += h;
  }
  out.push({ s, h: RUN, y: yc, z: 0, a: 0, shade: "linear-gradient(180deg, rgba(8,8,10,0.30) 0%, rgba(8,8,10,0.06) 7%, rgba(8,8,10,0) 16%, rgba(8,8,10,0) 88%, rgba(255,255,255,0.05) 100%), linear-gradient(102deg, rgba(255,255,255,0) 38%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0) 63%)" });
  s += RUN;
  const nBot = 16;
  for (let i = 0; i < nBot; i++) {
    const a0 = (90 / nBot) * i;
    const a1 = (90 / nBot) * (i + 1);
    const am = (a0 + a1) / 2;
    const h = R2 * rad(a1 - a0);
    const glint = 0.05 + 0.2 * Math.exp(-Math.pow((am - 52) / 24, 2));
    out.push({
      s,
      h,
      y: yb + R2 * Math.sin(rad(a0)),
      z: R2 - R2 * Math.cos(rad(a0)),
      a: am,
      shade: `linear-gradient(rgba(255,255,255,${glint.toFixed(3)}),rgba(255,255,255,${glint.toFixed(3)}))`,
    });
    s += h;
  }
  out.push({ s, h: TABLE, y: yb + R2, z: R2, a: 90, shade: "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 30%, rgba(8,8,10,0.2) 100%)" });
  return out;
}

const S_CENTRE = R1 * rad(104) + RUN / 2; // where along the path a frame sits when it is "current"

/** One printed frame: the photograph, crop marks, and the caption band with a colour control strip. */
function Frame({ row, real }: { row: number; real: boolean }) {
  const i = mod(-row, N);
  const f = frames[i];
  return (
    <div className="absolute left-0 w-full" style={{ top: row * PERIOD, height: PERIOD }}>
      <div className="absolute left-[20px] right-[20px] top-0 overflow-hidden bg-neutral-300" style={{ height: PHOTO }}>
        {real ? (
          <img src={f.src} alt={row < N ? f.alt : ""} loading="lazy" draggable={false} className="h-full w-full object-cover" style={{ objectPosition: f.focus }} />
        ) : (
          <div className="h-full w-full bg-cover" style={{ backgroundImage: `url("${f.src}")`, backgroundPosition: f.focus }} />
        )}
      </div>
      {/* crop marks in the margins */}
      <span className="absolute left-[6px] top-0 h-px w-[9px] bg-neutral-800/70" />
      <span className="absolute right-[6px] top-0 h-px w-[9px] bg-neutral-800/70" />
      <span className="absolute left-[6px] h-px w-[9px] bg-neutral-800/70" style={{ top: PHOTO - 1 }} />
      <span className="absolute right-[6px] h-px w-[9px] bg-neutral-800/70" style={{ top: PHOTO - 1 }} />
      <div className="absolute left-[20px] right-[20px] flex items-center justify-between" style={{ top: PHOTO, height: BAND }}>
        <div className="font-mono text-[8px] uppercase leading-[1.5] tracking-[0.16em] text-neutral-800">
          <div className="font-semibold">Plate {String(i + 1).padStart(2, "0")}</div>
          <div className="text-neutral-600">{f.title}</div>
        </div>
        <div className="flex">
          {["#19b5e8", "#e6177d", "#f6d915", "#141414", "#8a8a8a", "#c9c9c9"].map((c) => (
            <span key={c} className="block h-[9px] w-[9px]" style={{ background: c }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PhotoProofRoll() {
  const reduce = useReducedMotion();
  const strips = useMemo(buildStrips, []);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const tapeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const knurlRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const sim = useRef({ n: -1.25, vel: 0, target: 0, dragging: false, lastY: 0, lastT: 0, scale: 1, paused: false, nextAuto: 0, active: 0 });

  const step = useCallback((dir: number) => {
    const s = sim.current;
    s.target = Math.round(s.target) + dir;
    s.nextAuto = performance.now() + HOLD_MS * 2;
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    const scene = sceneRef.current;
    if (!wrap || !scene) return;
    const s = sim.current;
    let raf = 0;
    let visible = true;
    let last = performance.now();
    s.nextAuto = last + 2200;
    if (reduce) s.n = 0;

    const measure = () => {
      const sc = clamp(wrap.clientWidth / 540, 0.6, 1);
      s.scale = sc;
      wrap.style.height = `${Math.round(SCENE_H * sc)}px`;
      scene.style.transform = `translateX(-50%) scale(${sc.toFixed(4)})`;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);

    const paint = () => {
      for (let i = 0; i < strips.length; i++) {
        const tape = tapeRefs.current[i];
        if (!tape) continue;
        const off = mod(strips[i].s - S_CENTRE + PERIOD / 2 - s.n * PERIOD, TOTAL);
        tape.style.transform = `translate3d(0,${(-off).toFixed(2)}px,0)`;
      }
      const turn = mod(s.n * PERIOD, 6);
      for (const k of knurlRefs.current) if (k) k.style.backgroundPositionY = `${turn.toFixed(2)}px`;
      const a = mod(Math.round(s.n), N);
      if (a !== s.active) {
        s.active = a;
        setActive(a);
      }
    };

    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      if (reduce) {
        s.n = s.target;
        s.vel = 0;
      } else if (!s.dragging) {
        const acc = 46 * (s.target - s.n) - 9.6 * s.vel;
        s.vel += acc * dt;
        s.n += s.vel * dt;
        if (!s.paused && now > s.nextAuto) {
          s.target = Math.round(s.target) + 1;
          s.nextAuto = now + HOLD_MS;
        }
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

    const down = (e: PointerEvent) => {
      if (e.button !== 0 || !(e.target as HTMLElement).closest("[data-paper]")) return;
      s.dragging = true;
      s.lastY = e.clientY;
      s.lastT = performance.now();
      s.vel = 0;
      scene.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!s.dragging) return;
      const now = performance.now();
      const dn = (e.clientY - s.lastY) / (PERIOD * s.scale);
      s.n += dn;
      const dt = Math.max(1, now - s.lastT) / 1000;
      s.vel = s.vel * 0.6 + (dn / dt) * 0.4;
      s.lastY = e.clientY;
      s.lastT = now;
    };
    const up = () => {
      if (!s.dragging) return;
      s.dragging = false;
      s.target = Math.round(s.n + clamp(s.vel, -6, 6) * 0.24);
      s.nextAuto = performance.now() + HOLD_MS * 2;
    };
    scene.addEventListener("pointerdown", down);
    scene.addEventListener("pointermove", move);
    scene.addEventListener("pointerup", up);
    scene.addEventListener("pointercancel", up);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      scene.removeEventListener("pointerdown", down);
      scene.removeEventListener("pointermove", move);
      scene.removeEventListener("pointerup", up);
      scene.removeEventListener("pointercancel", up);
    };
  }, [reduce, strips]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    }
  };
  const pause = (v: boolean) => () => {
    sim.current.paused = v;
    if (!v) sim.current.nextAuto = performance.now() + HOLD_MS;
  };

  const yc = TOP_PAD + R1;
  const yTable = yc + RUN + R2;
  const barW = W + 132;
  const chrome = "linear-gradient(180deg, #0b0b0c 0%, #2c2d31 14%, #e4e5e8 27%, #9a9ba0 36%, #3a3b40 58%, #17181a 82%, #050506 100%)";
  const knurl = "repeating-linear-gradient(180deg, rgba(0,0,0,0.55) 0px, rgba(0,0,0,0.55) 1.5px, rgba(255,255,255,0.10) 1.5px, rgba(255,255,255,0.10) 3px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 6px)";
  const btn = "grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-neutral-200 transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";

  return (
    <section className="relative overflow-hidden bg-[#0d0d0f]" onMouseEnter={pause(true)} onMouseLeave={pause(false)} onFocus={pause(true)} onBlur={pause(false)}>
      {/* a pool of light on the wall behind the roll */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(60% 62% at 50% 40%, #3b3c41 0%, #25262a 38%, #131315 72%, #0b0b0d 100%)" }} />
      <div
        ref={wrapRef}
        role="group"
        aria-roledescription="carousel"
        aria-label="Roll of photo proofs. Use the up and down arrow keys to feed the paper."
        tabIndex={0}
        onKeyDown={onKey}
        className="relative mx-auto w-full overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70"
        style={{ height: SCENE_H }}
      >
        <div
          ref={sceneRef}
          className="absolute left-1/2 top-0 select-none"
          style={{ width: SCENE_W, height: SCENE_H, transformOrigin: "50% 0", transform: "translateX(-50%)", perspective: "1400px", perspectiveOrigin: "50% 19%" }}
        >
          <div className="absolute left-1/2 top-0" style={{ transformStyle: "preserve-3d", width: 0, height: 0 }}>
            {/* table top, meeting the wall just behind the roller */}
            <div
              aria-hidden="true"
              className="absolute"
              style={{
                left: -1500,
                top: yTable + 1,
                width: 3000,
                height: 1000,
                transformOrigin: "50% 0",
                transform: "translateZ(-130px) rotateX(90deg)",
                background: "radial-gradient(22% 44% at 50% 30%, #4c4d53 0%, #2a2b2f 45%, #121214 100%)",
                boxShadow: "inset 0 26px 30px -12px rgba(0,0,0,0.75)",
              }}
            />
            {/* shadow of the hanging paper on the wall */}
            <div
              aria-hidden="true"
              className="absolute bg-black"
              style={{ left: -W / 2 + 46, top: yc + 4, width: W, height: RUN + R2, transform: "translateZ(-128px)", filter: "blur(26px)", opacity: 0.6 }}
            />
            {/* shadow under the paper lying on the table */}
            <div
              aria-hidden="true"
              className="absolute bg-black"
              style={{ left: -W / 2 - 4, top: yTable + 0.5, width: W + 46, height: TABLE + 60, transformOrigin: "50% 0", transform: "translateZ(-10px) rotateX(90deg)", filter: "blur(14px)", opacity: 0.85 }}
            />
            {/* the two arms that carry the roller */}
            {[-1, 1].map((side) => (
              <div
                key={side}
                aria-hidden="true"
                className="absolute"
                style={{ left: side * (barW / 2 - 13) - 7, top: -40, width: 14, height: yc + 40 + 6, transform: `translateZ(${-R1 - 3}px)`, background: "linear-gradient(90deg, #0a0a0b, #4a4b50 40%, #1a1a1c 75%, #060607)", borderRadius: "0 0 7px 7px" }}
              />
            ))}
            {/* the roller */}
            <div aria-hidden="true" className="absolute overflow-hidden rounded-[3px]" style={{ left: -barW / 2, top: yc - R1, width: barW, height: R1 * 2, transform: `translateZ(${-R1 - 1}px)`, background: chrome }}>
              {[0, 1].map((e) => (
                <div
                  key={e}
                  ref={(el) => {
                    knurlRefs.current[e] = el;
                  }}
                  className="absolute inset-y-0 w-[30px]"
                  style={{ [e ? "right" : "left"]: 0, backgroundImage: `${knurl}, linear-gradient(180deg, #050506, #3c3d42 26%, #77787d 32%, #1d1e20 60%, #050506)` }}
                />
              ))}
            </div>
            {/* the paper */}
            {strips.map((st, i) => {
              const big = st.h > 100;
              const rows = Math.ceil((TOTAL + st.h) / PERIOD);
              return (
                <div
                  key={i}
                  data-paper=""
                  className="absolute touch-none overflow-hidden bg-[#f5f3ee]"
                  style={{
                    left: -W / 2,
                    top: 0,
                    width: W,
                    height: st.h + (big ? 0 : 1.8),
                    transformOrigin: "50% 0",
                    transform: `translate3d(0,${st.y.toFixed(2)}px,${st.z.toFixed(2)}px) rotateX(${st.a.toFixed(2)}deg)`,
                    backfaceVisibility: "hidden",
                    cursor: "grab",
                  }}
                >
                  <div
                    ref={(el) => {
                      tapeRefs.current[i] = el;
                    }}
                    aria-hidden={i === 9 ? undefined : true}
                    className="absolute left-0 top-0 w-full"
                    style={{ height: rows * PERIOD, willChange: big ? "transform" : undefined }}
                  >
                    {Array.from({ length: rows }, (_, row) => (
                      <Frame key={row} row={row} real={i === 9} />
                    ))}
                  </div>
                  <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: st.shade, boxShadow: "inset 1px 0 0 rgba(255,255,255,0.5), inset -1px 0 0 rgba(0,0,0,0.12)" }} />
                </div>
              );
            })}
          </div>
        </div>
        {/* the far end of the table falls out of the light */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-16" style={{ background: "linear-gradient(180deg, rgba(13,13,15,0), rgba(13,13,15,0.7))" }} />

        <p aria-live="polite" className="absolute bottom-5 left-5 font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-neutral-300 sm:bottom-8 sm:left-8">
          <span className="tabular-nums text-white">{String(active + 1).padStart(2, "0")}</span>
          <span className="mx-2 text-neutral-500">/</span>
          <span className="tabular-nums">{String(N).padStart(2, "0")}</span>
          <span className="block text-neutral-400">{frames[active].title}</span>
        </p>
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 sm:bottom-7 sm:right-8">
          <button type="button" onClick={() => step(-1)} aria-label="Wind back to the previous proof" className={btn}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12l6-6 6 6" />
            </svg>
          </button>
          <button type="button" onClick={() => step(1)} aria-label="Feed the next proof" className={btn}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 8l6 6 6-6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
