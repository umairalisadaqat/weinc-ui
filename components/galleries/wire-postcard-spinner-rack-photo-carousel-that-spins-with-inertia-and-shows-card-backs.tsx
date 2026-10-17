import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";


/** Eight columns of the rack. Each holds two postcards: one in the upper pocket, one in the lower. */
const columns = [
  {
    top: { title: "Tangerine", src: "https://images.pexels.com/photos/39325164/pexels-photo-39325164.jpeg?auto=compress&cs=tinysrgb&w=420", alt: "Woman in an orange top seated against a vivid orange backdrop", tone: "#e8440f", focus: "50% 30%" },
    bottom: { title: "Lime room", src: "https://images.pexels.com/photos/7659286/pexels-photo-7659286.jpeg?auto=compress&cs=tinysrgb&w=420", alt: "Figure in a long dark coat turned away against a lime green backdrop", tone: "#4fa312", focus: "50% 40%" },
  },
  {
    top: { title: "Half sun", src: "https://images.pexels.com/photos/7516560/pexels-photo-7516560.jpeg?auto=compress&cs=tinysrgb&w=420", alt: "Woman in a red dress standing in profile against a yellow and red backdrop", tone: "#e9b416", focus: "50% 35%" },
    bottom: { title: "Rose veil", src: "https://images.pexels.com/photos/31301594/pexels-photo-31301594.jpeg?auto=compress&cs=tinysrgb&w=420", alt: "Woman in a black dress parting sheer red curtains", tone: "#b3214a", focus: "50% 35%" },
  },
  {
    top: { title: "Magenta lean", src: "https://images.pexels.com/photos/21352926/pexels-photo-21352926.jpeg?auto=compress&cs=tinysrgb&w=420", alt: "Woman in a green top and black jacket against a magenta backdrop", tone: "#c4104d", focus: "50% 30%" },
    bottom: { title: "Pearls", src: "https://images.pexels.com/photos/35766171/pexels-photo-35766171.jpeg?auto=compress&cs=tinysrgb&w=420", alt: "Woman in sunglasses, pearls and a yellow top against a black backdrop", tone: "#17151a", focus: "50% 35%" },
  },
  {
    top: { title: "Green curtain", src: "https://images.pexels.com/photos/32174358/pexels-photo-32174358.jpeg?auto=compress&cs=tinysrgb&w=420", alt: "Woman in a teal suit standing between deep green curtains", tone: "#0c6b3a", focus: "50% 40%" },
    bottom: { title: "Black lace", src: "https://images.pexels.com/photos/27834206/pexels-photo-27834206.jpeg?auto=compress&cs=tinysrgb&w=420", alt: "Woman in glasses and a black lace jacket against a yellow backdrop", tone: "#e39a10", focus: "50% 35%" },
  },
  {
    top: { title: "Painted denim", src: "https://images.pexels.com/photos/27820190/pexels-photo-27820190.jpeg?auto=compress&cs=tinysrgb&w=420", alt: "Man in a paint-splashed denim jacket against a yellow and white backdrop", tone: "#e6b21b", focus: "50% 30%" },
    bottom: { title: "Red hour", src: "https://images.pexels.com/photos/14668786/pexels-photo-14668786.jpeg?auto=compress&cs=tinysrgb&w=420", alt: "Woman in a sheer black top lit red against a crimson backdrop", tone: "#b3122f", focus: "50% 35%" },
  },
  {
    top: { title: "Teal and red", src: "https://images.pexels.com/photos/16677542/pexels-photo-16677542.jpeg?auto=compress&cs=tinysrgb&w=420", alt: "Close portrait of a woman with red lips lit in teal and red", tone: "#0d5a4c", focus: "50% 35%" },
    bottom: { title: "Roll neck", src: "https://images.pexels.com/photos/35514244/pexels-photo-35514244.jpeg?auto=compress&cs=tinysrgb&w=420", alt: "Man in a dark roll neck resting his hand on his temple, lit in blue and red", tone: "#3a1420", focus: "50% 30%" },
  },
  {
    top: { title: "Blue cheek", src: "https://images.pexels.com/photos/17784344/pexels-photo-17784344.jpeg?auto=compress&cs=tinysrgb&w=420", alt: "Woman lit in blue on one side against an orange backdrop", tone: "#d2611f", focus: "45% 35%" },
    bottom: { title: "Profile, amber", src: "https://images.pexels.com/photos/7658850/pexels-photo-7658850.jpeg?auto=compress&cs=tinysrgb&w=420", alt: "Woman in profile resting her chin on her hand in amber and green light", tone: "#c26a22", focus: "50% 35%" },
  },
  {
    top: { title: "Jump", src: "https://images.pexels.com/photos/794062/pexels-photo-794062.jpeg?auto=compress&cs=tinysrgb&w=420", alt: "Woman mid-stride in a checked coat against an orange backdrop", tone: "#e8930f", focus: "50% 35%" },
    bottom: { title: "Warm wall", src: "https://images.pexels.com/photos/2872643/pexels-photo-2872643.jpeg?auto=compress&cs=tinysrgb&w=420", alt: "Woman in sunglasses and an orange top against a sunlit yellow wall", tone: "#e3a73c", focus: "50% 30%" },
  },
];

const N = columns.length;
const STEP = (Math.PI * 2) / N;
// Design pixels; the whole rack is scaled to fit its box.
const CW = 140; // postcard width
const CH = 198; // postcard height
const R = 214; // distance from the pole to the face of a card
const TIER_Y = [92, 332]; // top edge of the upper and lower pockets
const POLE_TOP = 34;
const BASE_Y = 596;
const SCENE_W = 620;
const SCENE_H = 700;
const HOLD_MS = 3000;

const mod = (a: number, n: number) => ((a % n) + n) % n;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const WIRE = "#17171a";
const wireGrad = "linear-gradient(180deg, #55565c 0%, #17171a 45%, #050506 100%)";

type Card = { title: string; src: string; alt: string; tone: string; focus: string };

function Postcard({ card, plate, live, refs, slot }: { card: Card; plate: number; live: boolean; refs: React.MutableRefObject<Record<string, HTMLDivElement | null>>; slot: string }) {
  return (
    <>
      {/* printed side */}
      <div className="absolute inset-0 overflow-hidden rounded-[3px] bg-[#fbfaf6]" style={{ backfaceVisibility: "hidden", boxShadow: "0 0 0 0.5px rgba(0,0,0,0.25)" }}>
        <div className="absolute inset-[7px] overflow-hidden" style={{ background: card.tone }}>
          <img src={card.src} alt={live ? card.alt : ""} width={CW - 14} height={CH - 14} loading="eager" decoding="async" draggable={false} className="h-full w-full object-cover" style={{ objectPosition: card.focus }} />
        </div>
        <div
          ref={(el) => {
            refs.current[`${slot}g`] = el;
          }}
          className="pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(104deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.55) 47%, rgba(255,255,255,0.12) 55%, rgba(255,255,255,0) 70%)", opacity: 0 }}
        />
        <div
          ref={(el) => {
            refs.current[`${slot}f`] = el;
          }}
          className="pointer-events-none absolute inset-0 bg-[#1b1206]"
          style={{ opacity: 0 }}
        />
      </div>
      {/* written side, seen when the card is on the far side of the rack */}
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-[3px] bg-[#e9dfcb]" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", boxShadow: "0 0 0 0.5px rgba(0,0,0,0.25)" }}>
        <div className="absolute left-1/2 top-[14px] h-[92px] w-px bg-neutral-500/60" />
        <div className="absolute right-[10px] top-[10px] h-[30px] w-[24px] border border-dashed border-neutral-500/80" />
        {[52, 66, 80, 94].map((y) => (
          <div key={y} className="absolute right-[10px] h-px w-[50px] bg-neutral-500/60" style={{ top: y }} />
        ))}
        <div className="absolute left-[10px] top-[12px] font-mono text-[7px] uppercase leading-[1.5] tracking-[0.14em] text-neutral-600">
          Plate {String(plate).padStart(2, "0")}
          <br />
          {card.title}
        </div>
        <div
          ref={(el) => {
            refs.current[`${slot}b`] = el;
          }}
          className="pointer-events-none absolute inset-0 bg-[#1b1206]"
          style={{ opacity: 0.4 }}
        />
      </div>
    </>
  );
}

export default function PostcardSpinnerRack() {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const rotorRef = useRef<HTMLDivElement>(null);
  const rackRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shade = useRef<Record<string, HTMLDivElement | null>>({});
  const [active, setActive] = useState(0);
  const sim = useRef({
    th: 1.6 * STEP,
    vel: 0,
    target: 0,
    free: false,
    dragging: false,
    lastX: 0,
    lastT: 0,
    scale: 1,
    paused: false,
    nextAuto: 0,
    active: 0,
    lean: new Array(N * 2).fill(0) as number[],
    leanV: new Array(N * 2).fill(0) as number[],
    wob: 0,
    wobV: 0,
  });

  const step = useCallback((dir: number) => {
    const s = sim.current;
    s.free = false;
    s.target = Math.round(s.target / STEP) * STEP - dir * STEP;
    s.nextAuto = performance.now() + HOLD_MS * 2;
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    const scene = sceneRef.current;
    const rotor = rotorRef.current;
    const rack = rackRef.current;
    if (!wrap || !scene || !rotor || !rack) return;
    const s = sim.current;
    let raf = 0;
    let visible = true;
    let last = performance.now();
    s.nextAuto = last + 2600;
    if (reduce) s.th = 0;

    const measure = () => {
      const narrow = wrap.clientWidth < 520;
      const sc = clamp(wrap.clientWidth / 610, 0.56, 1.12);
      s.scale = sc;
      wrap.style.height = `${Math.round(SCENE_H * sc) + (narrow ? 64 : 0)}px`;
      scene.style.transform = `translateX(-50%) scale(${sc.toFixed(4)})`;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);

    const paint = () => {
      rotor.style.transform = `rotateY(${s.th.toFixed(5)}rad)`;
      rack.style.transform = `rotateX(-7deg) rotateZ(${s.wob.toFixed(3)}deg)`;
      for (let i = 0; i < N; i++) {
        let phi = mod(s.th + i * STEP + Math.PI, Math.PI * 2) - Math.PI;
        const f = Math.cos(phi);
        const front = clamp(0.5 * (1 - f), 0, 0.6);
        const back = clamp(0.1 + 0.34 * (1 + f), 0, 0.5);
        const gloss = 0.5 * Math.exp(-Math.pow((phi - 0.62) / 0.3, 2));
        for (let t = 0; t < 2; t++) {
          const k = i * 2 + t;
          const c = cardRefs.current[k];
          if (c) c.style.transform = `rotateZ(${s.lean[k].toFixed(3)}deg)`;
          const fs = shade.current[`${k}f`];
          const bs = shade.current[`${k}b`];
          const gs = shade.current[`${k}g`];
          if (fs) fs.style.opacity = front.toFixed(3);
          if (bs) bs.style.opacity = back.toFixed(3);
          if (gs) gs.style.opacity = gloss.toFixed(3);
        }
        phi = 0;
      }
      const a = mod(Math.round(-s.th / STEP), N);
      if (a !== s.active) {
        s.active = a;
        setActive(a);
      }
    };

    const tick = (now: number) => {
      const dt = Math.min(0.033, Math.max(0.001, (now - last) / 1000));
      last = now;
      const v0 = s.vel;
      if (reduce) {
        s.th = s.target;
        s.vel = 0;
      } else if (!s.dragging) {
        if (s.free) {
          s.th += s.vel * dt;
          s.vel *= Math.exp(-1.25 * dt);
          if (Math.abs(s.vel) < 0.9) {
            s.free = false;
            s.target = Math.round((s.th + s.vel * 0.18) / STEP) * STEP;
          }
        } else {
          const acc = 34 * (s.target - s.th) - 7.4 * s.vel;
          s.vel += acc * dt;
          s.th += s.vel * dt;
          if (!s.paused && now > s.nextAuto) {
            s.target = Math.round(s.target / STEP) * STEP - STEP;
            s.nextAuto = now + HOLD_MS;
          }
        }
      }
      if (!reduce) {
        // the cards lag behind every change of speed, then swing back into their pockets
        const alpha = clamp((s.vel - v0) / dt, -60, 60);
        for (let k = 0; k < N * 2; k++) {
          const loose = 0.75 + 0.5 * (((k * 37) % 11) / 10);
          const a = -150 * s.lean[k] - (9 + loose * 3) * s.leanV[k] - alpha * 2.6 * loose;
          s.leanV[k] += a * dt;
          s.lean[k] = clamp(s.lean[k] + s.leanV[k] * dt, -9, 9);
        }
        const wa = -120 * s.wob - 9 * s.wobV - alpha * 0.28;
        s.wobV += wa * dt;
        s.wob = clamp(s.wob + s.wobV * dt, -1.6, 1.6);
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
      if (e.button !== 0 || !(e.target as HTMLElement).closest("[data-rack]")) return;
      s.dragging = true;
      s.free = false;
      s.lastX = e.clientX;
      s.lastT = performance.now();
      scene.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!s.dragging) return;
      const now = performance.now();
      const d = (e.clientX - s.lastX) / (R * s.scale);
      s.th += d;
      const dt = Math.max(1, now - s.lastT) / 1000;
      s.vel = s.vel * 0.6 + (d / dt) * 0.4;
      s.lastX = e.clientX;
      s.lastT = now;
    };
    const up = () => {
      if (!s.dragging) return;
      s.dragging = false;
      s.vel = clamp(s.vel, -14, 14);
      if (Math.abs(s.vel) > 0.9) s.free = true;
      else s.target = Math.round(s.th / STEP) * STEP;
      s.nextAuto = performance.now() + HOLD_MS * 2.5;
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

  const hoopR = R - 7;
  const hoops = [TIER_Y[0] + CH * 0.5, TIER_Y[0] + CH + 5, TIER_Y[1] + CH * 0.5, TIER_Y[1] + CH + 5];
  const btn = "grid h-10 w-10 place-items-center rounded-full border border-neutral-900/20 bg-white/50 text-neutral-900 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900";
  const col = columns[active];

  return (
    <section className="relative overflow-hidden bg-[#e9e3d6]" onMouseEnter={pause(true)} onMouseLeave={pause(false)} onFocus={pause(true)} onBlur={pause(false)}>
      {/* studio sweep: a soft pool of light behind the rack, falling off to the corners */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(58% 60% at 50% 42%, #faf7f0 0%, #efeadf 42%, #ddd5c5 100%)" }} />
      <div
        ref={wrapRef}
        role="group"
        aria-roledescription="carousel"
        aria-label="Spinner rack of postcards. Use the left and right arrow keys to turn the rack."
        tabIndex={0}
        onKeyDown={onKey}
        className="relative mx-auto w-full overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-900/70"
        style={{ height: SCENE_H }}
      >
        <div
          ref={sceneRef}
          className="absolute left-1/2 top-0 select-none"
          style={{ width: SCENE_W, height: SCENE_H, transformOrigin: "50% 0", transform: "translateX(-50%)", perspective: "1500px", perspectiveOrigin: "50% 38%" }}
        >
          {/* shadow the rack throws on the floor */}
          <div aria-hidden="true" className="absolute left-1/2 rounded-[50%] bg-[#3b2a12]" style={{ top: BASE_Y + 12, width: 520, height: 78, marginLeft: -260, filter: "blur(22px)", opacity: 0.34 }} />
          <div aria-hidden="true" className="absolute left-1/2 rounded-[50%] bg-[#1d1408]" style={{ top: BASE_Y + 22, width: 250, height: 38, marginLeft: -118, filter: "blur(9px)", opacity: 0.5 }} />

          <div ref={rackRef} data-rack="" className="absolute left-1/2 top-0 touch-pan-y" style={{ transformStyle: "preserve-3d", width: 0, height: 0, transformOrigin: `0 ${BASE_Y}px`, transform: "rotateX(-7deg)", cursor: "grab" }}>
            {/* weighted base */}
            <div aria-hidden="true" className="absolute rounded-full" style={{ left: -122, top: BASE_Y + 8 - 122, width: 244, height: 244, transform: "rotateX(90deg)", background: "#050506" }} />
            <div
              aria-hidden="true"
              className="absolute rounded-full"
              style={{ left: -122, top: BASE_Y - 122, width: 244, height: 244, transform: "rotateX(90deg)", background: "radial-gradient(circle at 42% 30%, #6a6b72 0%, #2a2b2f 34%, #121214 70%, #060607 100%)", boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.14), inset 0 0 26px rgba(0,0,0,0.7)" }}
            />
            {/* pole */}
            <div aria-hidden="true" className="absolute" style={{ left: -5, top: POLE_TOP, width: 10, height: BASE_Y - POLE_TOP, background: "linear-gradient(90deg, #050506 0%, #2f3034 28%, #8d8e94 42%, #26272a 62%, #050506 100%)", borderRadius: 3 }} />
            <div aria-hidden="true" className="absolute rounded-full" style={{ left: -13, top: POLE_TOP - 20, width: 26, height: 26, background: "radial-gradient(circle at 36% 30%, #b9bac0 0%, #4a4b50 28%, #141416 68%, #050506 100%)" }} />
            <div aria-hidden="true" className="absolute" style={{ left: -11, top: BASE_Y - 20, width: 22, height: 22, background: "linear-gradient(90deg, #050506 0%, #3a3b40 30%, #8d8e94 44%, #1c1d1f 66%, #050506 100%)", borderRadius: "3px 3px 0 0" }} />

            <div ref={rotorRef} className="absolute left-0 top-0" style={{ transformStyle: "preserve-3d", width: 0, height: 0 }}>
              {/* wire hoops that carry the pockets, with spokes back to the pole */}
              {hoops.map((y, h) => (
                <div key={y} aria-hidden="true" className="absolute left-0 top-0" style={{ transformStyle: "preserve-3d" }}>
                  <div className="absolute rounded-full" style={{ left: -hoopR, top: y - hoopR, width: hoopR * 2, height: hoopR * 2, transform: "rotateX(90deg)", border: `3px solid ${WIRE}` }} />
                  {h % 2 === 1 &&
                    [0, 1, 2, 3].map((k) => (
                      <div key={k} className="absolute" style={{ left: -hoopR, top: y - 1.25, width: hoopR * 2, height: 2.5, background: wireGrad, transform: `rotateY(${k * 45 + 22.5}deg)` }} />
                    ))}
                </div>
              ))}
              {columns.map((c, i) => (
                <div key={i} className="absolute left-0 top-0" style={{ transformStyle: "preserve-3d", transform: `rotateY(${(i * 360) / N}deg) translateZ(${R}px)` }}>
                  {[c.top, c.bottom].map((card, t) => (
                    <div key={t} className="absolute left-0 top-0" style={{ transformStyle: "preserve-3d" }}>
                      <div
                        ref={(el) => {
                          cardRefs.current[i * 2 + t] = el;
                        }}
                        className="absolute"
                        style={{ left: -CW / 2, top: TIER_Y[t], width: CW, height: CH, transformOrigin: "50% 100%", transformStyle: "preserve-3d" }}
                      >
                        <Postcard card={card} plate={i * 2 + t + 1} live refs={shade} slot={String(i * 2 + t)} />
                      </div>
                      {/* the wire pocket in front of the card */}
                      <div
                        aria-hidden="true"
                        className="absolute"
                        style={{ left: -CW / 2 - 4, top: TIER_Y[t] + CH * 0.7, width: CW + 8, height: CH * 0.3 + 6, transform: "translateZ(5px)", border: `2.5px solid ${WIRE}`, borderRadius: "3px 3px 9px 9px", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.28), 0 3px 4px rgba(0,0,0,0.22)" }}
                      >
                        <div className="absolute inset-x-0 top-[46%] h-[2.5px]" style={{ background: WIRE, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.28)" }} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <p aria-live="polite" className="absolute bottom-5 left-5 font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-neutral-700 sm:bottom-8 sm:left-8">
          <span className="tabular-nums text-neutral-950">{String(active + 1).padStart(2, "0")}</span>
          <span className="mx-2 text-neutral-500">/</span>
          <span className="tabular-nums">{String(N).padStart(2, "0")}</span>
          <span className="block text-neutral-950">{col.top.title}</span>
          <span className="block text-neutral-600">{col.bottom.title}</span>
        </p>
        <div className="absolute bottom-4 right-4 flex gap-2 sm:bottom-7 sm:right-8">
          <button type="button" onClick={() => step(-1)} aria-label="Turn the rack back one column" className={btn}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4l-6 6 6 6" />
            </svg>
          </button>
          <button type="button" onClick={() => step(1)} aria-label="Turn the rack on one column" className={btn}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 4l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
