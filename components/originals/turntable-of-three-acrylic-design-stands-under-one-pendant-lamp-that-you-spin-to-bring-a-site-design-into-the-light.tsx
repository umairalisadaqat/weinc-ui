import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";

// One stand is a print PW by PH pixels sealed in clear acrylic. The designs below are drawn at that size.
const PW = 250;
const PH = 330;
const STEP = 120; // degrees between stands
const TILT = 13; // how far the camera looks down on the table, in degrees
const BLUE = "#4F98FB"; // the lit acrylic edges, the index dots on the rim and the active pill
const HOLD = 3800; // how long the self-running demo rests on each design, in milliseconds
const SANS = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

const sentence = "A surf school in a small bay that takes beginners out at sunrise.";

function Photo({ src, alt, tone, focus = "50% 50%", className = "", grey = false }: { src: string; alt: string; tone: string; focus?: string; className?: string; grey?: boolean }) {
  return (
    <div className={`overflow-hidden ${className}`} style={{ backgroundColor: tone }}>
      <img src={src} alt={alt} draggable={false} className="h-full w-full object-cover" style={{ objectPosition: focus, filter: grey ? "grayscale(1) contrast(1.08)" : undefined }} />
    </div>
  );
}

// Three designs of the same invented surf school's homepage.
const designs: { name: string; note: string; page: ReactNode }[] = [
  {
    name: "Tide",
    note: "Full-bleed water, one heavy line",
    page: (
      <div className="relative h-full w-full bg-[#0C7F90] text-white" style={{ fontFamily: SANS }}>
        <Photo className="absolute inset-0" tone="#0C7F90" focus="42% 50%" src="https://images.pexels.com/photos/5232570/pexels-photo-5232570.jpeg?auto=compress&cs=tinysrgb&w=700" alt="A surfer carving a white trail across turquoise water, seen from above" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#04262C]/85 via-[#04262C]/5 to-[#04262C]/35" />
        <div className="absolute inset-x-[14px] top-[13px] flex items-center justify-between text-[6.5px] font-semibold uppercase tracking-[0.14em]">
          <span className="text-[10px] font-black tracking-[0.01em]">SALTLINE</span>
          <span className="flex gap-[9px]"><span>Lessons</span><span>Camps</span><span>Hire</span></span>
        </div>
        <div className="absolute inset-x-[14px] bottom-[16px]">
          <div className="text-[6.5px] font-bold uppercase tracking-[0.2em] text-white/85">Surf school, Pell Bay</div>
          <div className="mt-[6px] text-[47px] font-black leading-[0.86] tracking-[-0.055em]">Learn<br />the wave.</div>
          <div className="mt-[11px] flex items-center gap-[8px]">
            <span className="inline-flex h-[20px] items-center rounded-full bg-white px-[11px] text-[7.5px] font-bold text-[#04262C]">Book a first lesson</span>
            <span className="text-[7px] font-semibold text-white/90">Out at sunrise</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    name: "Dune",
    note: "Sand paper, a slow serif, one arch",
    page: (
      <div className="flex h-full w-full flex-col items-center bg-[#F1E8DA] px-[16px] pt-[13px] text-[#2B2118]" style={{ fontFamily: SERIF }}>
        <div className="flex w-full items-center justify-between text-[6px] font-semibold uppercase tracking-[0.18em] text-[#2B2118]/70" style={{ fontFamily: SANS }}>
          <span>Lessons</span>
          <span className="text-[14px] font-normal normal-case italic tracking-normal text-[#2B2118]" style={{ fontFamily: SERIF }}>Saltline</span>
          <span>Visit</span>
        </div>
        <div className="mt-[9px] h-px w-full bg-[#2B2118]/20" />
        <div className="mt-[15px] text-center text-[25px] leading-[1.02] tracking-[-0.02em]">Mornings in the water, <span className="italic text-[#B4532A]">taught slowly.</span></div>
        <Photo className="mt-[14px] min-h-0 w-[150px] flex-1 rounded-t-full" tone="#D9A77B" focus="50% 22%" src="https://images.pexels.com/photos/36700195/pexels-photo-36700195.jpeg?auto=compress&cs=tinysrgb&w=700" alt="A man leaning beside a tall orange surfboard against a pale wall" />
        <div className="flex w-full justify-between border-t border-[#2B2118]/20 py-[9px] text-[6px] font-semibold uppercase tracking-[0.18em] text-[#2B2118]/75" style={{ fontFamily: SANS }}>
          <span>Beginners</span><span>Board hire</span><span>Summer camps</span>
        </div>
      </div>
    ),
  },
  {
    name: "Deep",
    note: "Black page, monospace, a timetable",
    page: (
      <div className="flex h-full w-full flex-col bg-[#0A0B0D] text-[#ECEAE4]" style={{ fontFamily: MONO }}>
        <div className="relative h-[128px] w-full shrink-0">
          <Photo grey className="absolute inset-0" tone="#3A3C40" focus="50% 24%" src="https://images.pexels.com/photos/16920847/pexels-photo-16920847.jpeg?auto=compress&cs=tinysrgb&w=700" alt="A young surfer in profile at the shoreline, in black and white" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0B0D] via-transparent to-[#0A0B0D]/40" />
          <div className="absolute inset-x-[13px] top-[11px] flex justify-between text-[6px] uppercase tracking-[0.16em]">
            <span>Saltline / surf school</span><span className="text-[#D6FF4A]">[ book ]</span>
          </div>
        </div>
        <div className="px-[13px] text-[21px] font-semibold leading-[1.02] tracking-[-0.04em]" style={{ fontFamily: SANS }}>First light.<br />Flat water.<br /><span className="text-[#D6FF4A]">Your first wave.</span></div>
        <div className="mt-auto px-[13px] pb-[13px] text-[6.5px] uppercase tracking-[0.08em]">
          {[["01", "Dawn beginners", "Sat"], ["02", "Board and suit hire", "Daily"], ["03", "Week-long camp", "July"]].map(([n, t, d]) => (
            <div key={n} className="flex gap-[9px] border-t border-[#ECEAE4]/15 py-[6.5px]">
              <span className="text-[#D6FF4A]">{n}</span><span className="flex-1">{t}</span><span className="text-[#ECEAE4]/65">{d}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

// One printed face of a stand. `back` is the reverse of the same double-sided print.
function Face({ angle, at, back, children }: { angle: MotionValue<number>; at: number; back?: boolean; children: ReactNode }) {
  // How squarely this face looks at the lamp and the viewer: 1 facing, 0 side-on or turned away.
  const facing = (a: number) => Math.max(0, Math.cos(((a + at) * Math.PI) / 180) * (back ? -1 : 1));
  const shade = useTransform(angle, (a) => 0.84 - 0.84 * Math.pow(facing(a), 1.7));
  const sheenX = useTransform(angle, (a) => `${50 + Math.sin(((a + at) * Math.PI) / 180) * (back ? -1 : 1) * 160}% 0%`);
  return (
    <div
      className="absolute overflow-hidden rounded-[3px]"
      style={{ left: -PW / 2, top: -(PH + 16), width: PW, height: PH, transform: `${back ? "rotateY(180deg) " : ""}translateZ(4px)`, backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", backgroundColor: "#15171C" }}
    >
      {children}
      {/* the lamp is overhead: brighter at the top of the sheet */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(255,246,230,0.16) 0%, rgba(255,246,230,0) 28%, rgba(4,6,10,0.22) 100%)" }} />
      {/* the acrylic over the print: a soft band of reflection that slides as the table turns */}
      <motion.div className="pointer-events-none absolute inset-0" style={{ backgroundImage: "linear-gradient(104deg, rgba(255,255,255,0) 38%, rgba(255,255,255,0.2) 47%, rgba(255,255,255,0.04) 53%, rgba(255,255,255,0) 62%)", backgroundSize: "300% 100%", backgroundPosition: sheenX }} />
      <div className="pointer-events-none absolute inset-0 rounded-[3px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22),inset_0_1px_0_1px_rgba(255,255,255,0.3)]" />
      <motion.div className="pointer-events-none absolute inset-0 bg-[#05060A]" style={{ opacity: shade }} />
    </div>
  );
}

function Stand({ angle, index, children }: { angle: MotionValue<number>; index: number; children: ReactNode }) {
  const at = index * STEP;
  const edge = `linear-gradient(180deg, #DDEBFF 0%, ${BLUE} 22%, #2C5FB0 70%, #173566 100%)`;
  const acrylic = "linear-gradient(180deg, rgba(214,230,255,0.5), rgba(120,160,225,0.18))";
  return (
    <>
      {/* contact shadow on the table */}
      <div className="absolute" style={{ left: -(PW / 2 + 50), top: -46, width: PW + 100, height: 92, transform: "translateY(-1px) rotateX(90deg)", background: "radial-gradient(closest-side, rgba(0,0,0,0.7), rgba(0,0,0,0.35) 55%, rgba(0,0,0,0) 100%)" }} />
      <Face angle={angle} at={at}>{children}</Face>
      <Face angle={angle} at={at} back>{children}</Face>
      {/* the polished edges of the sheet catch the lamp */}
      <div className="absolute" style={{ left: -PW / 2 - 4, top: -(PH + 16), width: 8, height: PH, transform: "rotateY(90deg)", background: edge }} />
      <div className="absolute" style={{ left: PW / 2 - 4, top: -(PH + 16), width: 8, height: PH, transform: "rotateY(90deg)", background: edge }} />
      <div className="absolute" style={{ left: -PW / 2, top: -(PH + 16) - 4, width: PW, height: 8, transform: "rotateX(90deg)", background: `linear-gradient(90deg, ${BLUE}, #E8F1FF 50%, ${BLUE})` }} />
      {/* the clear block the sheet is slotted into */}
      <div className="absolute rounded-[2px]" style={{ left: -(PW / 2 + 14), top: -16, width: PW + 28, height: 16, transform: "translateZ(20px)", background: acrylic, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.75), inset 0 -1px 0 rgba(79,152,251,0.55)" }} />
      <div className="absolute rounded-[2px]" style={{ left: -(PW / 2 + 14), top: -16, width: PW + 28, height: 16, transform: "translateZ(-20px)", background: acrylic, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.75), inset 0 -1px 0 rgba(79,152,251,0.55)" }} />
      <div className="absolute" style={{ left: -(PW / 2 + 14), top: -16 - 20, width: PW + 28, height: 40, transform: "rotateX(90deg)", background: "linear-gradient(180deg, rgba(232,241,255,0.34), rgba(150,185,240,0.16) 45%, rgba(232,241,255,0.4))", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.4)" }} />
      <div className="absolute" style={{ left: -(PW / 2 + 14) - 20, top: -16, width: 40, height: 16, transform: "rotateY(90deg)", background: acrylic }} />
      <div className="absolute" style={{ left: PW / 2 + 14 - 20, top: -16, width: 40, height: 16, transform: "rotateY(90deg)", background: acrylic }} />
    </>
  );
}

export default function TurntableOfThreeDesignStands() {
  const reduce = !!useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const angle = useMotionValue(0);
  const [chosen, setChosen] = useState(0);
  const [width, setWidth] = useState(1100);
  const pausedUntil = useRef(0);
  const drag = useRef<{ x: number; a: number; lastX: number; lastT: number; v: number } | null>(null);
  const chosenRef = useRef(0);
  chosenRef.current = chosen;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const ps = Math.max(0.72, Math.min(0.92, width / 1000)); // size of a stand
  const r = Math.max(118, Math.min(240, width * 0.33)); // how far the stands sit from the spindle
  const R = r + 124 * ps; // radius of the platter
  const floorY = Math.round(PH * ps + 124);
  const stageH = Math.round(floorY + R * 0.52 + 22);

  // Turn the table so that design k faces front, by the shortest way round unless `forward` is set.
  const spinTo = (k: number, opts: { forward?: boolean; velocity?: number } = {}) => {
    const cur = angle.get();
    const base = -k * STEP;
    let target = base + Math.round((cur - base) / 360) * 360;
    if (opts.forward && target > cur - 1) target -= 360;
    setChosen(k);
    if (reduce) { angle.set(target); return; }
    animate(angle, target, { type: "spring", stiffness: 42, damping: 9.5, mass: 1.15, velocity: opts.velocity ?? 0, restDelta: 0.02 });
  };

  // Self-running demo: start on the first design, then click the table round one stand at a time.
  useEffect(() => {
    if (reduce) return;
    let seen = true;
    const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; });
    if (rootRef.current) io.observe(rootRef.current);
    const id = window.setInterval(() => {
      if (!seen || document.hidden || drag.current || Date.now() < pausedUntil.current) return;
      spinTo((chosenRef.current + 1) % designs.length, { forward: true });
    }, HOLD);
    return () => { window.clearInterval(id); io.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  const pick = (k: number) => { pausedUntil.current = Date.now() + 9000; spinTo(k); };

  const onKey = (e: ReactKeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = designs.length;
    let to = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") to = (i + 1) % n;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") to = (i + n - 1) % n;
    else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = n - 1;
    if (to < 0) return;
    e.preventDefault();
    pick(to);
    const group = e.currentTarget.parentElement;
    window.requestAnimationFrame(() => (group?.children[to] as HTMLElement | undefined)?.focus());
  };

  const onDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (reduce) return;
    angle.stop();
    drag.current = { x: e.clientX, a: angle.get(), lastX: e.clientX, lastT: performance.now(), v: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const k = 150 / Math.max(r, 1) * 0.42; // degrees of turn for each pixel dragged
    angle.set(d.a + (e.clientX - d.x) * k);
    const now = performance.now();
    const dt = Math.max(1, now - d.lastT);
    d.v = d.v * 0.6 + (((e.clientX - d.lastX) * k) / dt) * 1000 * 0.4;
    d.lastX = e.clientX;
    d.lastT = now;
  };
  const onUp = () => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    pausedUntil.current = Date.now() + 9000;
    // let the platter coast on, then drop into the nearest detent
    const coast = angle.get() + d.v * 0.28;
    const k = Math.round(-coast / STEP);
    const n = designs.length;
    const target = -k * STEP;
    setChosen(((k % n) + n) % n);
    animate(angle, target, { type: "spring", stiffness: 42, damping: 9.5, mass: 1.15, velocity: d.v, restDelta: 0.02 });
  };

  return (
    <section ref={rootRef} className="relative w-full overflow-hidden bg-[#0B0D12] text-[#F6F4EF]" style={{ fontFamily: SANS, backgroundImage: "radial-gradient(120% 70% at 50% 58%, #1B2029 0%, #0F1218 46%, #0B0D12 100%)" }}>
      <style>{`
        @keyframes turntable-of-three-acrylic-design-stands-sway { 0%, 100% { transform: rotate(-0.9deg); } 50% { transform: rotate(0.9deg); } }
        .turntable-of-three-acrylic-design-stands-lamp { transform-origin: 50% 0%; animation: turntable-of-three-acrylic-design-stands-sway 7s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .turntable-of-three-acrylic-design-stands-lamp { animation: none; } }
      `}</style>
      <h2 className="sr-only">Three designs of one website on a turntable</h2>

      <div
        className="relative mx-auto w-full max-w-[1280px] cursor-grab touch-pan-y select-none active:cursor-grabbing"
        style={{ height: stageH, perspective: 1500, perspectiveOrigin: "50% 34%" }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        role="img"
        aria-label={`A turntable under a pendant lamp carrying three acrylic stands, each a different design of a surf school website. The ${designs[chosen].name} design faces the front.`}
      >
        {/* the pendant lamp and its light */}
        <div className="turntable-of-three-acrylic-design-stands-lamp pointer-events-none absolute left-1/2 top-0 z-20 h-0 w-0" aria-hidden="true">
          <div className="absolute left-[-1px] top-0 w-[2px] bg-gradient-to-b from-[#2A2E37] to-[#555B67]" style={{ height: 34 * ps }} />
          <div className="absolute" style={{ left: -11 * ps, top: 32 * ps, width: 22 * ps, height: 14 * ps, borderRadius: "5px 5px 2px 2px", background: "linear-gradient(90deg, #14161B, #5A606C 45%, #23262D 70%, #0D0E12)" }} />
          <div className="absolute" style={{ left: -74 * ps, top: 44 * ps, width: 148 * ps, height: 62 * ps, borderRadius: "50% 50% 8px 8px / 96% 96% 6% 6%", background: "linear-gradient(100deg, #0A0B0E 0%, #262A32 22%, #7C8492 40%, #2D313A 52%, #101216 78%, #1C1F26 100%)", boxShadow: "inset 0 -2px 0 rgba(255,236,200,0.5), 0 14px 40px rgba(255,236,200,0.12)" }} />
          <div className="absolute rounded-[50%]" style={{ left: -66 * ps, top: 100 * ps, width: 132 * ps, height: 13 * ps, background: "radial-gradient(closest-side, #FFFDF6 0%, #FFE9BD 45%, rgba(255,214,150,0.5) 75%, rgba(255,214,150,0) 100%)", boxShadow: "0 0 34px 10px rgba(255,226,170,0.35)" }} />
        </div>
        <div className="pointer-events-none absolute left-1/2 top-0 z-10" aria-hidden="true" style={{ width: R * 2.3, height: floorY + R * 0.3, marginLeft: -R * 1.15, clipPath: `polygon(${50 - (60 * ps * 100) / (R * 2.3)}% ${(104 * ps * 100) / (floorY + R * 0.3)}%, ${50 + (60 * ps * 100) / (R * 2.3)}% ${(104 * ps * 100) / (floorY + R * 0.3)}%, 97% 100%, 3% 100%)`, background: "linear-gradient(180deg, rgba(255,236,200,0.2) 0%, rgba(255,236,200,0.07) 45%, rgba(255,236,200,0) 100%)", filter: "blur(10px)", mixBlendMode: "screen" }} />

        {/* the table and the three stands, in real perspective */}
        <div className="absolute left-1/2 h-0 w-0" style={{ top: floorY, transformStyle: "preserve-3d", transform: `rotateX(${-TILT}deg)` }}>
          {/* the thickness of the platter */}
          <div className="absolute rounded-full" style={{ left: -R * 1.12, top: -R * 1.12, width: R * 2.24, height: R * 2.24, transform: "translateY(34px) rotateX(90deg)", background: "radial-gradient(closest-side, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.8) 84%, rgba(0,0,0,0) 100%)" }} />
          {Array.from({ length: 16 }, (_, k) => (
            <div key={k} className="absolute rounded-full" style={{ left: -R, top: -R, width: R * 2, height: R * 2, transform: `translateY(${(16 - k) * 1.9}px) rotateX(90deg)`, backgroundColor: k >= 14 ? "#59606E" : k === 0 ? "#2A2E37" : k % 5 === 2 ? "#23262E" : "#14161B" }} />
          ))}
          {/* its turned metal face: the highlight belongs to the lamp, so it stays put while the table spins */}
          <div
            className="absolute rounded-full"
            style={{
              left: -R,
              top: -R,
              width: R * 2,
              height: R * 2,
              transform: "rotateX(90deg)",
              backgroundColor: "#1A1D24",
              backgroundImage:
                "radial-gradient(circle at 50% 76%, rgba(255,238,206,0.42) 0%, rgba(255,238,206,0.14) 30%, rgba(255,238,206,0) 60%), conic-gradient(from 90deg, rgba(255,255,255,0) 0deg, rgba(255,255,255,0.13) 70deg, rgba(255,255,255,0.3) 90deg, rgba(255,255,255,0.13) 110deg, rgba(255,255,255,0) 180deg, rgba(255,255,255,0.06) 250deg, rgba(255,255,255,0.14) 270deg, rgba(255,255,255,0.06) 290deg, rgba(255,255,255,0) 360deg), radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 0 61.4%, rgba(0,0,0,0.5) 61.4% 62%, rgba(255,255,255,0.16) 62% 62.5%, rgba(0,0,0,0) 62.5%), repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0) 3px)",
              boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.3), inset 0 0 0 7px rgba(10,11,15,0.55), inset 0 0 0 8px rgba(255,255,255,0.1)",
            }}
          />
          <motion.div className="absolute left-0 top-0 h-0 w-0" style={{ transformStyle: "preserve-3d", rotateY: angle }}>
            {/* what turns with the table: index dots on the rim and the spindle cap */}
            <div className="absolute rounded-full" style={{ left: -R, top: -R, width: R * 2, height: R * 2, transform: "translateY(-0.6px) rotateX(90deg)" }}>
              {designs.map((d, i) => (
                <div key={d.name} className="absolute left-1/2 top-1/2 h-0 w-0" style={{ transform: `rotate(${-i * STEP}deg)` }}>
                  <span className="absolute h-[9px] w-[9px] rounded-full" style={{ left: -4.5, top: R - 26, backgroundColor: BLUE, boxShadow: `0 0 10px 2px rgba(79,152,251,0.7), inset 0 1px 0 rgba(255,255,255,0.6)` }} />
                </div>
              ))}
              <div className="absolute left-1/2 top-1/2 h-[44px] w-[44px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "conic-gradient(from 20deg, #0E1014, #6A7180, #15171C, #8B93A3, #0E1014, #6A7180, #0E1014)", boxShadow: "0 0 0 1px rgba(0,0,0,0.6), 0 0 0 4px rgba(255,255,255,0.05)" }} />
            </div>
            {designs.map((d, i) => (
              <div key={d.name} className="absolute left-0 top-0 h-0 w-0" style={{ transformStyle: "preserve-3d", transform: `rotateY(${i * STEP}deg) translateZ(${r}px) scale3d(${ps}, ${ps}, ${ps})` }}>
                <Stand angle={angle} index={i}>{d.page}</Stand>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <div className="relative z-30 mx-auto flex w-full max-w-[720px] flex-col items-center gap-[14px] px-[16px] pb-[30px]">
        <div role="radiogroup" aria-label="Choose a design" className="flex items-center gap-[6px] rounded-full bg-white/[0.06] p-[5px] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_0_1px_rgba(255,255,255,0.07)]">
          {designs.map((d, i) => (
            <button
              key={d.name}
              type="button"
              role="radio"
              aria-checked={chosen === i}
              tabIndex={chosen === i ? 0 : -1}
              onClick={() => pick(i)}
              onKeyDown={(e) => onKey(e, i)}
              className={`flex h-[40px] items-center gap-[8px] rounded-full px-[17px] text-[13px] font-bold tracking-[-0.01em] transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F98FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0D12] motion-reduce:transition-none ${chosen === i ? "bg-[#F6F4EF] text-[#0B0D12]" : "text-[#F6F4EF]/75 hover:text-[#F6F4EF]"}`}
            >
              <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full transition-colors duration-300 motion-reduce:transition-none" style={{ backgroundColor: chosen === i ? BLUE : "rgba(246,244,239,0.3)" }} />
              {d.name}
            </button>
          ))}
        </div>
        <p aria-live="polite" className="text-[12px] font-semibold tracking-[-0.005em] text-[#F6F4EF]/65">{designs[chosen].note}</p>
        <p className="max-w-[460px] text-center text-[11px] font-medium leading-[1.55] text-[#F6F4EF]/50">&ldquo;{sentence}&rdquo;<br />One sentence, three models. Drag the table to turn it.</p>
      </div>
    </section>
  );
}
