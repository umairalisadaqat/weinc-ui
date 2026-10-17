import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/** The slides loaded in the tray, in the order they drop into the gate. `tone` is the colour the picture throws back into the room. */
const slides = [
  { title: "Four suits, open sky", src: "https://images.pexels.com/photos/10547288/pexels-photo-10547288.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Four models in blue, navy, pink and green suits standing apart under a wide pale sky", tone: "#7fb4d6", focus: "50% 70%" },
  { title: "Pink coat, red earth", src: "https://images.pexels.com/photos/8221274/pexels-photo-8221274.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Model in a pink coat standing on red desert rock beside a mirrored ball", tone: "#d2622a", focus: "50% 55%" },
  { title: "Scarlet train", src: "https://images.pexels.com/photos/8037495/pexels-photo-8037495.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Woman seated on rock with the long train of a red dress thrown out across the frame", tone: "#c8261d", focus: "50% 50%" },
  { title: "Radio at dusk", src: "https://images.pexels.com/photos/19193128/pexels-photo-19193128.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Woman in an orange suit holding a portable radio among old tyres at sunset", tone: "#d08a3a", focus: "50% 45%" },
  { title: "Dune wind", src: "https://images.pexels.com/photos/28601583/pexels-photo-28601583.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Woman in a red dress on a sand dune with a pale scarf streaming out in the wind", tone: "#d9a55c", focus: "50% 50%" },
  { title: "Rust and ivory", src: "https://images.pexels.com/photos/9861699/pexels-photo-9861699.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Two models in rust and ivory suits standing between tall weathered rocks", tone: "#8f7d63", focus: "50% 45%" },
];

const N = slides.length;
const SLOTS = 80; // a full tray
const SLOT = (Math.PI * 2) / SLOTS;
const TRAY = 272; // tray diameter in design pixels
const LAYERS = 12; // discs stacked to give the tray its ribbed wall
const HOLD_MS = 3600;

const mod = (a: number, n: number) => ((a % n) + n) % n;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const KEYFRAMES = `
@keyframes slide-projector-tray-mote { 0% { transform: translate3d(0,0,0); opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { transform: translate3d(var(--mx), var(--my), 0); opacity: 0; } }
@keyframes slide-projector-tray-lamp { 0%, 100% { opacity: 1; } 47% { opacity: 0.965; } 53% { opacity: 1; } 71% { opacity: 0.98; } }
.slide-projector-tray-mote { animation: slide-projector-tray-mote var(--d) linear infinite; animation-delay: var(--w); }
.slide-projector-tray-lamp { animation: slide-projector-tray-lamp 2.7s linear infinite; }
@media (prefers-reduced-motion: reduce) { .slide-projector-tray-mote, .slide-projector-tray-lamp { animation: none; } }
`;

const motes = Array.from({ length: 14 }, (_, i) => ({
  left: 30 + ((i * 53) % 40),
  top: 8 + ((i * 37) % 80),
  size: 1.5 + ((i * 7) % 3) * 0.7,
  mx: `${((i * 29) % 60) - 30}px`,
  my: `${-20 - ((i * 17) % 40)}px`,
  d: `${7 + ((i * 13) % 8)}s`,
  w: `${-((i * 1.9) % 9)}s`,
}));

export default function SlideProjectorCarousel() {
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [prev, setPrev] = useState(-1);
  const idxRef = useRef(0);
  const zoneRef = useRef<HTMLDivElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);
  const hitRef = useRef<HTMLDivElement>(null);
  const sim = useRef({ th: 2.4 * SLOT, vel: 0, dragging: false, lastX: 0, paused: false, nextAuto: 0 });

  const go = useCallback((next: number) => {
    if (next === idxRef.current) return;
    setPrev(mod(idxRef.current, N));
    idxRef.current = next;
    setIdx(next);
  }, []);
  const step = useCallback(
    (dir: number) => {
      go(idxRef.current + dir);
      sim.current.nextAuto = performance.now() + HOLD_MS * 2;
    },
    [go],
  );

  useEffect(() => {
    const zone = zoneRef.current;
    const tray = trayRef.current;
    const hit = hitRef.current;
    if (!zone || !tray || !hit) return;
    const s = sim.current;
    let raf = 0;
    let visible = true;
    let last = performance.now();
    s.nextAuto = last + 2800;
    if (reduce) s.th = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.033, Math.max(0.001, (now - last) / 1000));
      last = now;
      const target = -idxRef.current * SLOT;
      if (reduce) {
        s.th = target;
      } else if (!s.dragging) {
        // a stiff, slightly under-damped spring: the tray knocks into its detent
        const acc = 420 * (target - s.th) - 19 * s.vel;
        s.vel += acc * dt;
        s.th += s.vel * dt;
        if (!s.paused && now > s.nextAuto) {
          go(idxRef.current + 1);
          s.nextAuto = now + HOLD_MS;
        }
      }
      tray.style.setProperty("--a", `${s.th.toFixed(5)}rad`);
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
    io.observe(zone);
    raf = requestAnimationFrame(tick);

    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      s.dragging = true;
      s.lastX = e.clientX;
      s.vel = 0;
      hit.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!s.dragging) return;
      const scale = zone.offsetWidth < 600 ? 0.7 : 1;
      s.th -= (e.clientX - s.lastX) / ((TRAY / 2) * scale) / 2.2;
      s.lastX = e.clientX;
      go(Math.round(-s.th / SLOT));
    };
    const up = () => {
      if (!s.dragging) return;
      s.dragging = false;
      s.nextAuto = performance.now() + HOLD_MS * 2;
    };
    hit.addEventListener("pointerdown", down);
    hit.addEventListener("pointermove", move);
    hit.addEventListener("pointerup", up);
    hit.addEventListener("pointercancel", up);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      hit.removeEventListener("pointerdown", down);
      hit.removeEventListener("pointermove", move);
      hit.removeEventListener("pointerup", up);
      hit.removeEventListener("pointercancel", up);
    };
  }, [reduce, go]);

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

  const cur = mod(idx, N);
  const slide = slides[cur];
  const disc = { left: -TRAY / 2, top: -TRAY / 2 - 14, width: TRAY, height: TRAY };
  const ringMask = "radial-gradient(circle, rgba(0,0,0,0) 52.5%, #000 53.5%, #000 95%, rgba(0,0,0,0) 96%)";
  const btn = "grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/5 text-neutral-200 transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";

  return (
    <section className="relative overflow-hidden bg-[#0a0909]" onMouseEnter={pause(true)} onMouseLeave={pause(false)} onFocus={pause(true)} onBlur={pause(false)}>
      <style>{KEYFRAMES}</style>
      {/* the room: a little of the picture's colour comes back off the wall */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(70% 60% at 50% 38%, #1d1a18 0%, #100e0d 55%, #070606 100%)" }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[78%] transition-colors duration-700" style={{ backgroundColor: slide.tone, opacity: 0.3, filter: "blur(90px)", transform: "scale(0.82)" }} />

      <div role="group" aria-roledescription="carousel" aria-label="Slide projector. Use the left and right arrow keys to change the slide." tabIndex={0} onKeyDown={onKey} className="relative outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70">
        <div className="relative mx-auto w-full max-w-[720px] px-5 pt-8 sm:pt-10">
          {/* the picture on the wall */}
          <div className="slide-projector-tray-lamp relative">
            <div className="relative aspect-[3/2] overflow-hidden rounded-[12px] bg-[#040404] sm:rounded-[18px]">
              {slides.map((s, j) => {
                const state = j === cur ? "in" : j === prev ? "out" : "wait";
                return (
                  <motion.div
                    key={s.src}
                    aria-hidden={j === cur ? undefined : true}
                    className="absolute inset-0"
                    style={{ background: s.tone }}
                    initial={false}
                    animate={reduce ? { opacity: state === "in" ? 1 : 0, y: "0%" } : state === "in" ? { y: "0%", filter: "blur(0px)", opacity: 1 } : state === "out" ? { y: "104%", filter: "blur(5px)", opacity: 1 } : { y: "-104%", filter: "blur(10px)", opacity: 1 }}
                    transition={
                      reduce
                        ? { duration: 0.2 }
                        : state === "in"
                          ? { y: { type: "spring", stiffness: 330, damping: 24, delay: 0.3 }, filter: { duration: 0.8, delay: 0.42, ease: [0.3, 0, 0.2, 1] } }
                          : state === "out"
                            ? { duration: 0.24, ease: [0.5, 0, 0.9, 0.4] }
                            : { duration: 0 }
                    }
                  >
                    <img src={s.src} alt={s.alt} width={1200} height={800} loading="eager" decoding="async" draggable={false} className="h-full w-full object-cover" style={{ objectPosition: s.focus, filter: "saturate(1.12) contrast(1.06) brightness(1.05)" }} />
                  </motion.div>
                );
              })}
              {/* lamp falloff, warm cast and the soft edge of the gate */}
              <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(72% 78% at 50% 47%, rgba(255,236,200,0.10) 0%, rgba(255,236,200,0) 52%, rgba(6,4,2,0.46) 100%)", boxShadow: "inset 0 0 12px 5px rgba(8,7,6,0.9)" }} />
              {/* grain of the painted wall */}
              <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.16] mix-blend-overlay">
                <filter id="slide-projector-tray-grain">
                  <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" />
                  <feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 1.4 -0.2" />
                </filter>
                <rect width="100%" height="100%" filter="url(#slide-projector-tray-grain)" />
              </svg>
              {/* a hair and two specks of dust sitting in the gate: they stay put while the slides change */}
              <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 600 400" preserveAspectRatio="none">
                <path d="M2 71 C 9 68, 12 76, 19 73 S 27 79, 31 76" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="0.8" strokeLinecap="round" />
                <circle cx="548" cy="352" r="2.2" fill="rgba(0,0,0,0.6)" />
                <circle cx="571" cy="41" r="1.4" fill="rgba(0,0,0,0.5)" />
              </svg>
            </div>
          </div>
          <p aria-live="polite" className="mt-4 font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-neutral-400">
            <span className="tabular-nums text-white">{String(cur + 1).padStart(2, "0")}</span>
            <span className="mx-2 text-neutral-600">/</span>
            <span className="tabular-nums">{String(N).padStart(2, "0")}</span>
            <span className="ml-4 text-neutral-200">{slide.title}</span>
          </p>
        </div>

        {/* the projector, seen from behind and above */}
        <div ref={zoneRef} className="relative mx-auto mt-5 h-[190px] w-full max-w-[720px] sm:-mt-1 sm:h-[292px]">
          {/* throw of the beam between the lens and the picture */}
          <div aria-hidden="true" className="slide-projector-tray-lamp pointer-events-none absolute inset-x-5 -top-14 bottom-[60%] sm:-top-10" style={{ filter: "blur(1.5px)", clipPath: "polygon(0 0, 100% 0, 54% 100%, 46% 100%)", background: "linear-gradient(180deg, rgba(255,240,214,0.02) 0%, rgba(255,240,214,0.1) 70%, rgba(255,240,214,0.2) 100%)" }}>
            {motes.map((m, i) => (
              <span key={i} className="slide-projector-tray-mote absolute rounded-full bg-[#fff3dc]" style={{ left: `${m.left}%`, top: `${m.top}%`, width: m.size, height: m.size, ["--mx" as string]: m.mx, ["--my" as string]: m.my, ["--d" as string]: m.d, ["--w" as string]: m.w } as React.CSSProperties} />
            ))}
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[8%] h-[60px] w-[260px] -translate-x-1/2 rounded-[50%]" style={{ background: "radial-gradient(closest-side, rgba(255,238,206,0.55), rgba(255,238,206,0))", filter: "blur(6px)" }} />

          <div className="absolute left-1/2 top-0 origin-top scale-[0.7] sm:scale-100" style={{ width: 0, height: 250, perspective: "1100px", perspectiveOrigin: "0 -60px" }}>
            <div className="absolute left-0" style={{ top: 122, transformStyle: "preserve-3d", transform: "rotateX(63deg)" }}>
              {/* body: top plate */}
              <div aria-hidden="true" className="absolute rounded-[26px]" style={{ left: -178, top: -162, width: 356, height: 316, background: "linear-gradient(180deg, #3a3b3f 0%, #232427 30%, #17181a 100%)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1), inset 0 2px 0 rgba(255,255,255,0.16), inset 0 -10px 24px rgba(0,0,0,0.6)" }}>
                <div className="absolute inset-0 rounded-[26px] transition-colors duration-700" style={{ backgroundColor: slide.tone, opacity: 0.2, WebkitMaskImage: "linear-gradient(180deg, #000 0%, rgba(0,0,0,0) 55%)", maskImage: "linear-gradient(180deg, #000 0%, rgba(0,0,0,0) 55%)" }} />
                {/* index mark and the two transport keys moulded into the plate */}
                <div className="absolute bottom-[10px] left-1/2 h-[11px] w-[3px] -translate-x-1/2 rounded-full bg-[#f1ede4]" />
                <div className="absolute bottom-[12px] left-[26px] h-[16px] w-[44px] rounded-[5px]" style={{ background: "linear-gradient(180deg, #46474c, #1c1d1f)", boxShadow: "0 2px 0 #050506, inset 0 1px 0 rgba(255,255,255,0.25)" }} />
                <div className="absolute bottom-[12px] right-[26px] h-[16px] w-[44px] rounded-[5px]" style={{ background: "linear-gradient(180deg, #46474c, #1c1d1f)", boxShadow: "0 2px 0 #050506, inset 0 1px 0 rgba(255,255,255,0.25)" }} />
              </div>
              {/* body: rear panel with cooling slots */}
              <div aria-hidden="true" className="absolute overflow-hidden rounded-b-[14px]" style={{ left: -178, top: 154, width: 356, height: 150, transformOrigin: "50% 0", transform: "rotateX(-90deg)", background: "linear-gradient(180deg, #2a2b2e 0%, #18191b 22%, #0c0c0d 100%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22), inset 0 0 0 1px rgba(255,255,255,0.05)" }}>
                <div className="absolute left-[34px] top-[26px] h-[62px] w-[150px] rounded-[4px]" style={{ background: "repeating-linear-gradient(180deg, #050506 0px, #050506 4px, #26272a 4px, #26272a 5px, #1a1b1d 5px, #1a1b1d 9px)", boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.8)" }} />
                <div className="absolute right-[34px] top-[26px] font-mono text-[8px] uppercase leading-[1.6] tracking-[0.22em] text-neutral-400">
                  Halden 2050
                  <br />
                  <span className="text-neutral-500">Autofocus / 80 slot</span>
                </div>
                <div className="absolute right-[36px] top-[66px] h-[7px] w-[7px] rounded-full" style={{ background: "radial-gradient(circle at 40% 35%, #ffd2a0, #ff7a1a 55%, #a23a00)", boxShadow: "0 0 10px 2px rgba(255,122,26,0.7)" }} />
                <div className="absolute right-[56px] top-[62px] h-[15px] w-[30px] rounded-[3px]" style={{ background: "linear-gradient(180deg, #050506, #2c2d30)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)" }} />
              </div>

              {/* the tray: a stack of discs gives the wall, the top one carries the slides */}
              <div ref={trayRef} className="absolute left-0 top-0" style={{ transformStyle: "preserve-3d", ["--a" as string]: "0rad" } as React.CSSProperties}>
                <div aria-hidden="true" className="absolute rounded-full bg-black" style={{ ...disc, left: disc.left - 6, width: TRAY + 12, height: TRAY + 12, top: disc.top + 4, transform: "translateZ(1px)", filter: "blur(9px)", opacity: 0.85 }} />
                {Array.from({ length: LAYERS }, (_, k) => (
                  <div key={k} aria-hidden="true" className="absolute overflow-hidden rounded-full" style={{ ...disc, transform: `translateZ(${4 + k * 3.5}px)` }}>
                    <div className="absolute inset-0 rounded-full" style={{ transform: "rotate(var(--a))", background: k >= LAYERS - 3 ? "repeating-conic-gradient(from 0deg, #e9e5da 0deg, #e9e5da 0.7deg, #1b1c1e 0.7deg, #1b1c1e 4.5deg)" : k % 4 === 0 ? "#2a2b2e" : "#1b1c1e" }} />
                    <div className="absolute inset-0 rounded-full" style={{ background: "conic-gradient(from 180deg, rgba(0,0,0,0.1) 0deg, rgba(0,0,0,0.72) 62deg, rgba(0,0,0,0.5) 90deg, rgba(0,0,0,0.5) 270deg, rgba(0,0,0,0.72) 298deg, rgba(0,0,0,0.1) 360deg)" }} />
                    <div className="absolute inset-0 rounded-full" style={{ background: "conic-gradient(from 180deg, rgba(255,255,255,0.0) 0deg, rgba(255,255,255,0.2) 24deg, rgba(255,255,255,0) 50deg, rgba(255,255,255,0) 310deg, rgba(255,255,255,0.14) 338deg, rgba(255,255,255,0) 360deg)" }} />
                  </div>
                ))}
                {/* top of the tray */}
                <div className="absolute rounded-full" style={{ ...disc, transform: `translateZ(${4 + LAYERS * 3.5}px)`, background: "#0c0c0d", boxShadow: "inset 0 0 0 3px #2b2c30, inset 0 0 0 4px rgba(255,255,255,0.16)" }}>
                  <div aria-hidden="true" className="absolute inset-0 rounded-full" style={{ transform: "rotate(var(--a))" }}>
                    {/* eighty slots, each with the pale top edge of a slide mount showing */}
                    <div className="absolute inset-0 rounded-full" style={{ background: "repeating-conic-gradient(from 0deg, #050506 0deg, #050506 1.5deg, #e9e5da 1.5deg, #cfcabd 3deg, #050506 3deg, #050506 4.5deg)", WebkitMaskImage: ringMask, maskImage: ringMask }} />
                    {Array.from({ length: 8 }, (_, q) => (
                      <span key={q} className="absolute left-1/2 top-1/2 block font-mono text-[9px] font-semibold tabular-nums text-neutral-300" style={{ transform: `translate(-50%, -50%) rotate(${q * 45}deg) translateY(${-TRAY * 0.222}px)` }}>
                        {q === 0 ? 80 : q * 10}
                      </span>
                    ))}
                  </div>
                  {/* light off the wall, coloured by the picture, across the far side of the tray */}
                  <div aria-hidden="true" className="absolute inset-0 rounded-full transition-colors duration-700" style={{ backgroundColor: slide.tone, opacity: 0.34, mixBlendMode: "screen", WebkitMaskImage: "linear-gradient(180deg, #000 0%, rgba(0,0,0,0) 62%)", maskImage: "linear-gradient(180deg, #000 0%, rgba(0,0,0,0) 62%)" }} />
                  <div aria-hidden="true" className="absolute inset-0 rounded-full" style={{ background: "linear-gradient(180deg, rgba(255,244,224,0.22) 0%, rgba(255,244,224,0) 40%, rgba(0,0,0,0.5) 100%)" }} />
                  {/* hub and lock ring */}
                  <div aria-hidden="true" className="absolute rounded-full" style={{ inset: "32%", background: "radial-gradient(circle at 50% 30%, #3b3c41 0%, #1c1d1f 55%, #0a0a0b 100%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.28), 0 0 0 1px #000, 0 6px 10px rgba(0,0,0,0.6)" }} />
                  <div aria-hidden="true" className="absolute rounded-full" style={{ inset: "39.5%", background: "conic-gradient(from 150deg, #f2f3f4, #8b8e93 60deg, #2a2c2f 130deg, #c9cccf 200deg, #ffffff 240deg, #6e7277 300deg, #f2f3f4 360deg)", boxShadow: "0 0 0 1px #000, 0 2px 4px rgba(0,0,0,0.6)" }} />
                  <div aria-hidden="true" className="absolute rounded-full" style={{ inset: "43%", background: "radial-gradient(circle at 50% 28%, #2e2f33, #0b0b0c 75%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.25)" }} />
                </div>
                {/* where a hand takes hold of the tray */}
                <div ref={hitRef} role="presentation" className="absolute touch-pan-y rounded-full" style={{ ...disc, transform: `translateZ(${6 + LAYERS * 3.5}px)`, cursor: "grab" }} />
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-4 bottom-4 flex justify-between sm:inset-x-8 sm:bottom-7">
          <button type="button" onClick={() => step(-1)} aria-label="Back one slide" className={`${btn} pointer-events-auto`}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4l-6 6 6 6" />
            </svg>
          </button>
          <button type="button" onClick={() => step(1)} aria-label="Forward one slide" className={`${btn} pointer-events-auto`}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 4l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
