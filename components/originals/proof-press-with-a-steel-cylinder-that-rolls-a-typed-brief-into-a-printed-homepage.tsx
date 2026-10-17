import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useReducedMotion } from "framer-motion";

/** The job on the press. The ticket carries the sentence; the sheet carries the page it turns into. */
const job = {
  sentence: "A surf school in Ericeira with lessons you can book online.",
  brand: "Low Tide Surf School",
  links: ["Lessons", "Boards", "Tides"],
  headline: ["Learn to read", "the water."],
  sub: "Small groups on the north beach, wetsuit and board included.",
  cta: "Book a lesson",
  photo: { src: "https://images.pexels.com/photos/1549180/pexels-photo-1549180.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Surfers carrying longboards on their heads across a sunny beach" },
  lessons: [
    { name: "First waves", when: "Tue and Sat" },
    { name: "Kids club", when: "Sundays" },
    { name: "One to one", when: "By request" },
  ],
};

const BLUE = "#4F98FB";
const INK = "#0B0D12";
// Plan measurements of the press bed in design pixels (looking straight down). The camera tilts it afterwards.
const BED_W = 600;
const BED_L = 856;
const SHEET_X = 84;
const SHEET_Y = 220;
const SHEET_W = 432;
const SHEET_H = 488;
const R = 34; // cylinder radius
const Y0 = 214; // where the cylinder touches the bed before the pull
const Y1 = 812; // and after it
const TILT = 50;
const SCENE_W = 900;
const SCENE_H = 760;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const deboss = "0 1px 0 rgba(255,255,255,0.85), 0 -0.5px 0 rgba(0,0,0,0.28)";

function Bolt({ x, y }: { x: number; y: number }) {
  return (
    <span aria-hidden="true" className="absolute rounded-full" style={{ left: x - 7, top: y - 7, width: 14, height: 14, background: "radial-gradient(circle at 38% 32%, #8b8e96 0%, #3c3e44 45%, #101114 100%)", boxShadow: "0 1px 0 rgba(255,255,255,0.12), 0 0 0 2px rgba(0,0,0,0.5)" }}>
      <span className="absolute left-[3px] right-[3px] top-1/2 h-px -translate-y-1/2 rotate-[32deg] bg-black/70" />
    </span>
  );
}

function Mark({ x, y }: { x: number; y: number }) {
  return (
    <span aria-hidden="true" className="absolute" style={{ left: x - 6, top: y - 6, width: 12, height: 12 }}>
      <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-neutral-900/60" />
      <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-neutral-900/60" />
      <span className="absolute inset-[3px] rounded-full border border-neutral-900/60" />
    </span>
  );
}

export default function ProofPress() {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const bedRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const knurlRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [value, setValue] = useState(100);
  const sim = useRef({ p: 0.5, v: 0, target: 1, dragging: false, y0: 0, p0: 0, scale: 1, next: 0, held: false, shown: 100 });

  useEffect(() => {
    const wrap = wrapRef.current;
    const scene = sceneRef.current;
    const bed = bedRef.current;
    if (!wrap || !scene || !bed) return;
    const s = sim.current;
    let raf = 0;
    let visible = true;
    let last = performance.now();
    s.next = last + 5200;
    if (reduce) s.p = 1;

    const measure = () => {
      const sc = clamp(wrap.clientWidth / 810, 0.4, 1);
      s.scale = sc;
      wrap.style.height = `${Math.round(SCENE_H * sc)}px`;
      scene.style.transform = `translateX(-50%) scale(${sc.toFixed(4)})`;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);

    const paint = () => {
      const y = Y0 + (Y1 - Y0) * s.p;
      bed.style.setProperty("--y", y.toFixed(2));
      bed.style.setProperty("--k", (y - SHEET_Y).toFixed(2));
      const turn = y / R;
      for (let i = 0; i < 2; i++) {
        const el = slotRefs.current[i];
        if (!el) continue;
        const a = (((turn + i * Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const front = a < Math.PI;
        el.style.opacity = front ? Math.min(1, Math.sin(a) * 3).toFixed(2) : "0";
        el.style.transform = `translateY(${(R - R * Math.cos(a) - 2).toFixed(2)}px) scaleY(${Math.max(0.15, Math.sin(a)).toFixed(3)})`;
      }
      for (const k of knurlRefs.current) if (k) k.style.backgroundPositionY = `${(y % 5).toFixed(2)}px`;
      const shown = Math.round(s.p * 100);
      if (shown !== s.shown) {
        s.shown = shown;
        setValue(shown);
      }
    };

    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      if (reduce) {
        s.p = s.target;
      } else if (!s.dragging) {
        // a heavy cylinder: slow to start, no bounce at the stops
        const acc = 16 * (s.target - s.p) - 7.4 * s.v;
        s.v += acc * dt;
        s.p = clamp(s.p + s.v * dt, 0, 1);
        if (!s.held && now > s.next) {
          if (s.target > 0.5) {
            s.target = 0;
            s.next = now + 2600;
          } else {
            s.target = 1;
            s.next = now + 6400;
          }
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
      if (e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
      s.dragging = true;
      s.y0 = e.clientY;
      s.p0 = s.p;
      s.v = 0;
      scene.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!s.dragging) return;
      const travel = (Y1 - Y0) * Math.cos((TILT * Math.PI) / 180) * s.scale * 0.98;
      const next = clamp(s.p0 + (e.clientY - s.y0) / travel, 0, 1);
      s.v = (next - s.p) * 30;
      s.p = next;
    };
    const up = () => {
      if (!s.dragging) return;
      s.dragging = false;
      s.target = s.p + s.v * 0.2 > 0.5 ? 1 : 0;
      s.next = performance.now() + 9000;
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

  const go = (t: number) => {
    const s = sim.current;
    s.target = clamp(t, 0, 1);
    s.next = performance.now() + 9000;
  };
  const onKey = (e: ReactKeyboardEvent) => {
    const s = sim.current;
    const step = e.key === "ArrowDown" || e.key === "ArrowRight" ? 0.1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -0.1 : 0;
    if (step) {
      e.preventDefault();
      go(Math.round((s.target + step) * 10) / 10);
    } else if (e.key === "Home") {
      e.preventDefault();
      go(0);
    } else if (e.key === "End") {
      e.preventDefault();
      go(1);
    }
  };
  const hold = (v: boolean) => () => {
    sim.current.held = v;
    if (!v) sim.current.next = performance.now() + 3500;
  };

  const printed = value > 50;
  const sans = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';
  const steel = "linear-gradient(90deg, #5d6067 0%, #d9dbe0 22%, #f4f5f7 34%, #9da0a7 55%, #5a5d64 80%, #2c2e33 100%)";
  const rack = "repeating-linear-gradient(180deg, rgba(0,0,0,0.5) 0px, rgba(0,0,0,0.5) 2px, rgba(255,255,255,0.18) 2px, rgba(255,255,255,0.18) 3px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 7px)";
  const chrome = "linear-gradient(180deg, #17181b 0%, #5c5f66 5%, #c9ccd2 11%, #ffffff 17%, #e3e5e9 22%, #8f939a 34%, #4b4e55 47%, #1b1c20 55%, #6d6a64 59%, #d8d2c6 68%, #f1ece1 78%, #b9b4a9 88%, #4c4a46 95%, #101012 100%)";
  const knurl = "repeating-linear-gradient(180deg, rgba(0,0,0,0.6) 0px, rgba(0,0,0,0.6) 1.5px, rgba(255,255,255,0.12) 1.5px, rgba(255,255,255,0.12) 2.5px, rgba(0,0,0,0) 2.5px, rgba(0,0,0,0) 5px)";
  const stand = `rotateX(-${TILT}deg)`;

  return (
    <section className="relative overflow-hidden bg-[#D9D6CF]" style={{ fontFamily: sans }} onMouseEnter={hold(true)} onMouseLeave={hold(false)} onFocus={hold(true)} onBlur={hold(false)}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(70% 64% at 46% 34%, #f1efea 0%, #dedbd4 46%, #c4c0b8 100%)" }} />
      <div ref={wrapRef} className="relative mx-auto w-full overflow-hidden" style={{ height: SCENE_H }}>
        <div
          ref={sceneRef}
          role="slider"
          tabIndex={0}
          aria-label="Impression cylinder. Arrow keys roll it along the bed."
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          aria-valuetext={printed ? "Homepage printed" : "Sheet blank, brief on the ticket"}
          onKeyDown={onKey}
          className="absolute left-1/2 top-0 touch-pan-x select-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0B0D12]"
          style={{ width: SCENE_W, height: SCENE_H, transformOrigin: "50% 0", transform: "translateX(-50%)", perspective: "1900px", perspectiveOrigin: "50% 30%", cursor: "grab" }}
        >
          <div
            ref={bedRef}
            className="absolute"
            style={{ left: (SCENE_W - BED_W) / 2, top: -112, width: BED_W, height: BED_L, transformStyle: "preserve-3d", transformOrigin: "50% 42%", transform: `scale(0.9) rotateX(${TILT}deg)`, ["--y" as string]: reduce ? Y1 : (Y0 + Y1) / 2, ["--k" as string]: reduce ? Y1 - SHEET_Y : (Y0 + Y1) / 2 - SHEET_Y }}
          >
            {/* shadow of the press on the table */}
            <div aria-hidden="true" className="absolute" style={{ left: -10, top: 30, width: BED_W + 90, height: BED_L + 20, background: "rgba(40,34,22,0.5)", filter: "blur(30px)", transform: "translateZ(-34px)" }} />
            {/* front and right faces of the bed casting */}
            <div aria-hidden="true" className="absolute" style={{ left: 0, top: BED_L, width: BED_W, height: 34, transformOrigin: "50% 0", transform: "rotateX(-90deg)", borderRadius: "0 0 6px 6px", background: "linear-gradient(180deg, #2f3137 0%, #17181c 30%, #0b0c0f 100%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22)" }} />
            {/* the bed */}
            <div aria-hidden="true" className="absolute inset-0 rounded-[10px]" style={{ background: "linear-gradient(180deg, #17181c 0%, #1f2126 40%, #2a2c32 100%)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07), inset 0 2px 0 rgba(255,255,255,0.10)" }} />
            <div aria-hidden="true" className="absolute rounded-[4px]" style={{ left: 66, top: 126, width: BED_W - 132, height: BED_L - 150, background: "linear-gradient(180deg, #0c0d10 0%, #14161a 100%)", boxShadow: "inset 0 3px 8px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.08)" }} />
            {[16, BED_W - 46].map((x) => (
              <div key={x} aria-hidden="true" className="absolute rounded-[3px]" style={{ left: x, top: 126, width: 30, height: BED_L - 150, backgroundImage: `${rack}, ${steel}`, boxShadow: "0 2px 3px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(0,0,0,0.35)" }} />
            ))}
            <Bolt x={31} y={100} />
            <Bolt x={BED_W - 31} y={100} />
            <Bolt x={31} y={BED_L - 12} />
            <Bolt x={BED_W - 31} y={BED_L - 12} />

            {/* the ticket clamped at the head of the bed: the brief, typed */}
            <div className="absolute" style={{ left: 56, top: 12, width: BED_W - 112, height: 98 }}>
              <div aria-hidden="true" className="absolute inset-0 translate-y-[3px] rounded-[2px] bg-black/70 blur-[4px]" />
              <div className="absolute inset-0 rounded-[2px] bg-[#F6F4EF]" style={{ boxShadow: "inset 0 -1px 0 rgba(0,0,0,0.15), inset 0 1px 0 #fff" }}>
                <span className="absolute left-[42px] top-[12px] font-mono text-[9px] font-bold uppercase tracking-[0.28em]" style={{ color: "#2f6fd0" }}>
                  Brief, one sentence
                </span>
                <p className="absolute left-[42px] right-[36px] top-[30px] font-mono text-[21.5px] font-bold leading-[1.16] tracking-[-0.01em]" style={{ color: INK }}>
                  {job.sentence}
                </p>
              </div>
              {[8, BED_W - 112 - 30].map((x) => (
                <span key={x} aria-hidden="true" className="absolute top-[22px] h-[50px] w-[22px] rounded-[4px]" style={{ left: x, background: "linear-gradient(90deg, #2b2d32, #8d9098 35%, #dfe1e5 50%, #7c7f87 70%, #24262a)", boxShadow: "0 3px 4px rgba(0,0,0,0.55)" }}>
                  <span className="absolute left-1/2 top-1/2 h-[10px] w-[10px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "radial-gradient(circle at 35% 30%, #fff, #7b7e86 60%, #2a2b30)" }} />
                </span>
              ))}
            </div>

            {/* the sheet */}
            <div aria-hidden="true" className="absolute bg-black/80 blur-[5px]" style={{ left: SHEET_X + 3, top: SHEET_Y + 4, width: SHEET_W, height: SHEET_H }} />
            <div className="absolute overflow-hidden bg-[#F6F4EF]" style={{ left: SHEET_X, top: SHEET_Y, width: SHEET_W, height: SHEET_H, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.6)" }}>
              {/* blank stock with pencil guides */}
              <div aria-hidden="true" className="absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(91deg, rgba(110,95,60,0.022) 0px, rgba(110,95,60,0) 4px, rgba(110,95,60,0.016) 9px)" }} />
              {/* the impression: everything the cylinder has passed */}
              <div className="absolute inset-0 bg-[#F6F4EF]" style={{ clipPath: "inset(0 0 calc(100% - var(--k) * 1px) 0)" }}>
                <Mark x={12} y={12} />
                <Mark x={SHEET_W - 12} y={12} />
                <Mark x={12} y={SHEET_H - 12} />
                <Mark x={SHEET_W - 12} y={SHEET_H - 12} />
                <div className="absolute left-[30px] right-[30px] top-[28px] flex items-center justify-between">
                  <span className="flex items-center gap-[7px] text-[12px] font-extrabold tracking-[-0.02em]" style={{ color: INK, textShadow: deboss }}>
                    <span aria-hidden="true" className="h-[9px] w-[9px] rounded-full" style={{ background: BLUE }} />
                    {job.brand}
                  </span>
                  <span className="flex gap-[13px] text-[9.5px] font-bold text-neutral-700" style={{ textShadow: deboss }}>
                    {job.links.map((l) => (
                      <span key={l}>{l}</span>
                    ))}
                  </span>
                </div>
                <h2 className="absolute left-[30px] top-[62px] text-[45px] font-black leading-[0.93] tracking-[-0.055em]" style={{ color: INK, textShadow: deboss }}>
                  {job.headline.map((l) => (
                    <span key={l} className="block">
                      {l}
                    </span>
                  ))}
                </h2>
                <p className="absolute left-[31px] top-[157px] w-[250px] text-[10.5px] font-semibold leading-snug text-neutral-700">{job.sub}</p>
                <div className="absolute left-[30px] right-[30px] top-[196px] h-[150px] overflow-hidden rounded-[3px]" style={{ background: BLUE, mixBlendMode: "multiply", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.35)" }}>
                  <img src={job.photo.src} alt={job.photo.alt} width={340} height={150} draggable={false} className="h-full w-full object-cover" style={{ filter: "grayscale(1) contrast(1.55) brightness(0.82)", mixBlendMode: "screen", objectPosition: "50% 38%" }} />
                </div>
                <ul className="absolute left-[30px] right-[30px] top-[358px] grid grid-cols-3 gap-[8px]">
                  {job.lessons.map((l) => (
                    <li key={l.name} className="rounded-[3px] px-[9px] py-[8px]" style={{ border: `1.5px solid ${INK}` }}>
                      <span className="block text-[11px] font-extrabold leading-none tracking-[-0.02em]" style={{ color: INK }}>
                        {l.name}
                      </span>
                      <span className="mt-[5px] block text-[8.5px] font-bold leading-none text-neutral-700">{l.when}</span>
                    </li>
                  ))}
                </ul>
                <span className="absolute left-[30px] top-[424px] inline-flex h-[32px] items-center gap-[7px] rounded-full px-[16px] text-[11.5px] font-extrabold tracking-[-0.01em]" style={{ background: BLUE, color: INK, boxShadow: "inset 0 1px 2px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.9)" }}>
                  {job.cta}
                  <svg aria-hidden="true" width="11" height="11" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 10h12M11 5l5 5-5 5" />
                  </svg>
                </span>
                <span aria-hidden="true" className="absolute bottom-[26px] right-[30px] flex">
                  {[INK, "#2f6fd0", BLUE, "#9cc4fd", "#d5e6fe"].map((c) => (
                    <span key={c} className="block h-[10px] w-[14px]" style={{ background: c }} />
                  ))}
                </span>
              </div>
              {/* wet ink catching the light just behind the cylinder */}
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[150px]" style={{ transform: "translateY(calc(var(--k) * 1px - 150px))", background: "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.10) 45%, rgba(255,255,255,0.42) 78%, rgba(20,16,8,0.5) 100%)" }} />
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[70px]" style={{ transform: "translateY(calc(var(--k) * 1px))", background: "linear-gradient(180deg, rgba(20,16,8,0.62) 0%, rgba(20,16,8,0.22) 40%, rgba(20,16,8,0) 100%)" }} />
            </div>

            {/* the carriage: cylinder, bearings and their shadow */}
            <div className="absolute left-0 top-0" style={{ width: BED_W, height: 0, transformStyle: "preserve-3d", transform: "translate3d(0, calc(var(--y) * 1px), 0)" }}>
              <div aria-hidden="true" className="absolute" style={{ left: 4, top: -6, width: BED_W - 8, height: 62, background: "linear-gradient(180deg, rgba(0,0,0,0.75), rgba(0,0,0,0))", filter: "blur(6px)", transform: "translateZ(1px)" }} />
              <div aria-hidden="true" className="absolute overflow-hidden rounded-[3px]" style={{ left: 50, top: -R, width: BED_W - 100, height: R * 2, transform: `translateZ(${R}px) ${stand}`, background: chrome, boxShadow: "0 0 0 0.5px rgba(0,0,0,0.6)" }}>
                {[0, 1].map((i) => (
                  <span
                    key={i}
                    ref={(el) => {
                      slotRefs.current[i] = el;
                    }}
                    className="absolute inset-x-[34px] top-0 block h-[5px]"
                    style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.75), rgba(0,0,0,0.9) 55%, rgba(255,255,255,0.75) 56%, rgba(255,255,255,0))", opacity: 0 }}
                  />
                ))}
                {[0, 1].map((e) => (
                  <div
                    key={e}
                    ref={(el) => {
                      knurlRefs.current[e] = el;
                    }}
                    className="absolute inset-y-0 w-[26px]"
                    style={{ [e ? "right" : "left"]: 0, backgroundImage: `${knurl}, linear-gradient(180deg, #050506, #4a4c52 14%, #a9acb3 20%, #3a3c41 44%, #0c0c0e 58%, #5c5952 74%, #151516 100%)`, boxShadow: e ? "inset 2px 0 2px rgba(0,0,0,0.6)" : "inset -2px 0 2px rgba(0,0,0,0.6)" }}
                  />
                ))}
                <span className="absolute inset-y-0 left-[34px] w-[3px]" style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.5), rgba(255,255,255,0.35))" }} />
                <span className="absolute inset-y-0 right-[34px] w-[3px]" style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.5), rgba(255,255,255,0.35))" }} />
              </div>
              {[0, 1].map((e) => (
                <div
                  key={e}
                  aria-hidden="true"
                  className="absolute rounded-[9px]"
                  style={{ left: e ? BED_W - 62 : 2, top: -46, width: 60, height: 92, transform: `translateZ(${R + 3}px) ${stand}`, background: "linear-gradient(180deg, #4a4d55 0%, #2a2c32 16%, #17181c 60%, #0a0b0d 100%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -2px 0 rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.5)" }}
                >
                  <span className="absolute left-1/2 top-[30px] h-[30px] w-[30px] -translate-x-1/2 rounded-full" style={{ background: "conic-gradient(from 210deg, #6d7078, #f1f2f4, #7d8088, #2a2b30, #9a9da4, #6d7078)", boxShadow: "0 0 0 2px #0a0a0c, inset 0 0 0 1px rgba(0,0,0,0.4)" }}>
                    <span className="absolute inset-[9px] rounded-full" style={{ background: BLUE, boxShadow: "inset 0 1px 2px rgba(0,0,0,0.5)" }} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-4 flex justify-center sm:bottom-7">
          <button
            type="button"
            onClick={() => go(printed ? 0 : 1)}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-[#0B0D12] px-5 text-[13px] font-bold tracking-[-0.01em] text-white shadow-[0_8px_20px_rgba(11,13,18,0.28)] transition hover:bg-[#1d2130] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0D12] focus-visible:ring-offset-2 focus-visible:ring-offset-[#D9D6CF]"
          >
            <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: BLUE }} />
            {printed ? "Roll it back" : "Pull the proof"}
          </button>
        </div>
      </div>
    </section>
  );
}
