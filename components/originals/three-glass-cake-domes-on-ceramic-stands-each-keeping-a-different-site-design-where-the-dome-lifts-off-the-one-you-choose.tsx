import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { motion, useReducedMotion, useSpring, useTransform, useVelocity } from "framer-motion";

// Everything is drawn in these units and scaled to the screen. A stand is SW wide; a card model is CW by CH.
const SW = 300;
const DOME_W = 250;
const DOME_H = 352;
const HEAD = 174; // air above the domes, which the lifted one rises into
const CW = 200;
const CH = 275;
const CARD = 0.88; // size of a card while it is under glass
const LIFT = 148; // how far a dome is raised, in units
const BLUE = "#4F98FB"; // the glass knobs, the enamel line on the plates and the active pill
const HOLD = 3800; // rest between steps of the self-running demo, in milliseconds
const SANS = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif';

const sentence = "A corner bakery that sells out of sourdough and croissants before noon.";

function Photo({ src, alt, tone, focus = "50% 50%", className = "" }: { src: string; alt: string; tone: string; focus?: string; className?: string }) {
  return (
    <div className={`overflow-hidden ${className}`} style={{ backgroundColor: tone }}>
      <img src={src} alt={alt} draggable={false} className="h-full w-full object-cover" style={{ objectPosition: focus }} />
    </div>
  );
}

// Three designs of one invented bakery's homepage, drawn at CW by CH.
const designs: { name: string; note: string; page: ReactNode }[] = [
  {
    name: "Sorbet",
    note: "Pink paper, round heavy type, a sticker",
    page: (
      <div className="relative flex h-full w-full flex-col bg-[#F9C3BC] text-[#5C1420]" style={{ fontFamily: SANS }}>
        <div className="relative h-[150px] w-full shrink-0">
          <Photo className="absolute inset-0" tone="#F4A9A2" focus="50% 40%" src="https://images.pexels.com/photos/31986590/pexels-photo-31986590.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Golden croissants scattered on a pink backdrop" />
          <div className="absolute inset-x-[11px] top-[10px] flex items-center justify-between text-[6px] font-bold uppercase tracking-[0.12em]">
            <span className="rounded-full bg-[#5C1420] px-[7px] py-[3px] text-[#F9C3BC]">Ember</span><span>Menu &nbsp; Find us</span>
          </div>
          <div className="absolute -bottom-[17px] right-[11px] flex h-[40px] w-[40px] rotate-[12deg] items-center justify-center rounded-full bg-[#F4D35E] text-center text-[5.5px] font-black uppercase leading-[1.15] tracking-[0.04em] text-[#5C1420]">Open<br />from 7</div>
        </div>
        <div className="flex flex-1 flex-col px-[11px] pb-[11px] pt-[12px]">
          <div className="text-[27px] font-black leading-[0.88] tracking-[-0.055em]">Butter.<br />Layers.<br />Morning.</div>
          <div className="mt-auto inline-flex h-[18px] w-fit items-center rounded-full bg-[#5C1420] px-[10px] text-[6.5px] font-bold text-[#FBE4E0]">Order for pickup</div>
        </div>
      </div>
    ),
  },
  {
    name: "Crumb",
    note: "Black slate, thin type, flour and crust",
    page: (
      <div className="relative h-full w-full bg-[#0D0C0B] text-[#F3EDE2]" style={{ fontFamily: SANS }}>
        <Photo className="absolute inset-0" tone="#1B1917" focus="50% 42%" src="https://images.pexels.com/photos/4881589/pexels-photo-4881589.jpeg?auto=compress&cs=tinysrgb&w=600" alt="A sliced sourdough loaf on a black table dusted with flour" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0D0C0B]/75 via-transparent via-[42%] to-[#0D0C0B]/95" />
        <div className="absolute inset-x-[12px] top-[12px] flex items-center justify-between text-[5.5px] font-medium uppercase tracking-[0.26em]">
          <span>Ember Bakehouse</span><span className="text-[#E9A23B]">Menu</span>
        </div>
        <div className="absolute inset-x-[12px] bottom-[13px]">
          <div className="text-[25px] font-light leading-[0.98] tracking-[-0.04em]">Bread, baked<br />before <span className="font-semibold text-[#E9A23B]">first light.</span></div>
          <div className="mt-[9px] flex items-center justify-between border-t border-[#F3EDE2]/25 pt-[7px] text-[5.5px] font-medium uppercase tracking-[0.2em] text-[#F3EDE2]/80">
            <span>Sourdough</span><span>Rye</span><span>Reserve a loaf</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    name: "Counter",
    note: "Plain white, a centred serif, a price list",
    page: (
      <div className="flex h-full w-full flex-col items-center bg-[#F5F3EE] px-[13px] pb-[11px] pt-[12px] text-[#1E1B17]" style={{ fontFamily: SERIF }}>
        <div className="text-[5.5px] font-semibold uppercase tracking-[0.3em] text-[#1E1B17]/70" style={{ fontFamily: SANS }}>Ember Bakehouse</div>
        <div className="mt-[7px] text-center text-[19px] leading-[1.05] tracking-[-0.01em]">The morning <span className="italic">counter</span></div>
        <Photo className="mt-[10px] h-[98px] w-full shrink-0 border border-[#1E1B17]/15" tone="#E4DDD6" focus="50% 62%" src="https://images.pexels.com/photos/4828337/pexels-photo-4828337.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Two croissants on a white paper roll against a pale wall" />
        <div className="mt-auto w-full text-[8.5px] leading-none">
          {[["Butter croissant", "4"], ["Country sourdough", "9"], ["Almond twice-baked", "6"]].map(([a, b]) => (
            <div key={a} className="flex items-baseline gap-[4px] py-[4.5px]">
              <span>{a}</span><span className="mb-[2px] flex-1 border-b border-dotted border-[#1E1B17]/45" /><span className="italic">{b}</span>
            </div>
          ))}
        </div>
        <div className="mt-[6px] border-b border-[#1E1B17] pb-[1.5px] text-[6px] font-semibold uppercase tracking-[0.18em]" style={{ fontFamily: SANS }}>Order ahead</div>
      </div>
    ),
  },
];

const DOME_RADIUS = `${DOME_W / 2}px ${DOME_W / 2}px ${DOME_W / 2}px ${DOME_W / 2}px / ${DOME_W / 2}px ${DOME_W / 2}px 18px 18px`;

function Stand({ design, chosen, reduce, delay, left, onPick }: { design: (typeof designs)[number]; chosen: boolean; reduce: boolean; delay: number; left: number; onPick: () => void }) {
  const [peek, setPeek] = useState(false);
  const lift = useSpring(chosen ? 1 : 0, { stiffness: 58, damping: 11, mass: 1 });
  useEffect(() => {
    const to = chosen ? 1 : peek ? 0.07 : 0;
    if (reduce) lift.jump(to);
    else lift.set(to);
  }, [chosen, peek, reduce, lift]);

  const domeY = useTransform(lift, (v) => -v * LIFT);
  // the dome is held by its knob, so it trails behind the hand and swings back
  const speed = useVelocity(lift);
  const swing = useSpring(useTransform(speed, (v) => Math.max(-5, Math.min(5, v * (v > 0 ? 2 : 0.8)))), { stiffness: 46, damping: 6.5 });
  const haze = useTransform(lift, (v) => 1 - Math.min(1, v * 1.5));
  const cardScale = useTransform(lift, (v) => CARD + Math.max(0, v - 0.07) * 0.2);
  const cardY = useTransform(lift, (v) => -Math.max(0, v - 0.07) * 8);
  const glow = useTransform(lift, (v) => Math.max(0, v - 0.07) * 1.05);
  const domeShadow = useTransform(lift, (v) => 0.3 * (1 - Math.min(1, v * 1.4)));
  const plateY = HEAD + DOME_H - 18; // the line the dome rests on

  return (
    <div className="absolute top-0 cursor-pointer" style={{ left, width: SW, height: HEAD + DOME_H + 78 }} onClick={onPick} onPointerEnter={() => setPeek(true)} onPointerLeave={() => setPeek(false)}>
      {/* light that falls on the wall behind the chosen stand */}
      <motion.div className="pointer-events-none absolute" style={{ left: -70, top: HEAD - 70, width: SW + 140, height: DOME_H + 90, opacity: glow, background: "radial-gradient(closest-side, rgba(255,255,255,0.85), rgba(255,255,255,0.3) 55%, rgba(255,255,255,0) 100%)" }} />

      {/* the stand: foot, stem and plate, in glazed white ceramic */}
      <div className="absolute rounded-[50%]" style={{ left: SW / 2 - 118, top: plateY + 50, width: 236, height: 34, background: "radial-gradient(closest-side, rgba(52,44,30,0.5), rgba(52,44,30,0.18) 60%, rgba(52,44,30,0) 100%)" }} />
      <div className="absolute" style={{ left: SW / 2 - 74, top: plateY + 38, width: 148, height: 30, borderRadius: "50% 50% 46% 46% / 86% 86% 34% 34%", background: "linear-gradient(90deg, #BDB6A8 0%, #F4F1EA 22%, #FFFFFF 38%, #E9E5DC 62%, #B4AD9F 100%)", boxShadow: "inset 0 -3px 4px rgba(90,80,60,0.3), inset 0 1px 0 rgba(255,255,255,0.9)" }} />
      <div className="absolute" style={{ left: SW / 2 - 25, top: plateY + 12, width: 50, height: 36, clipPath: "polygon(8% 0, 92% 0, 74% 46%, 100% 100%, 0 100%, 26% 46%)", background: "linear-gradient(90deg, #A8A193 0%, #EFECE4 26%, #FFFFFF 42%, #DDD8CD 66%, #9E9788 100%)" }} />
      <div className="absolute rounded-[50%]" style={{ left: 0, top: plateY - 15, width: SW, height: 46, background: "linear-gradient(180deg, #C9C2B4, #A9A294)", boxShadow: "0 10px 14px -6px rgba(52,44,30,0.45)" }} />
      <div className="absolute rounded-[50%]" style={{ left: 0, top: plateY - 22, width: SW, height: 46, background: "radial-gradient(ellipse at 42% 30%, #FFFFFF 0%, #F6F3EC 46%, #DFDACF 100%)", boxShadow: "inset 0 -2px 0 rgba(255,255,255,0.9), inset 0 2px 5px rgba(90,80,60,0.18)" }}>
        <div className="absolute rounded-[50%]" style={{ inset: "4px 9px 5px 9px", border: `1.5px solid ${BLUE}`, opacity: 0.85 }} />
        <div className="absolute rounded-[50%]" style={{ inset: "9px 26px 10px 26px", boxShadow: "inset 0 2px 4px rgba(90,80,60,0.2)" }} />
      </div>

      {/* the far side of the dome's rim, seen through the glass behind the card */}
      <motion.div className="pointer-events-none absolute" style={{ left: (SW - DOME_W) / 2, top: HEAD, width: DOME_W, height: DOME_H, y: domeY, rotate: swing, transformOrigin: "50% -12%" }}>
        <div className="absolute bottom-0 left-0 h-[36px] w-full rounded-[50%]" style={{ border: "1.5px solid rgba(255,255,255,0.7)", boxShadow: "0 0 0 1px rgba(80,72,58,0.12), inset 0 0 8px rgba(255,255,255,0.35)" }} />
      </motion.div>
      {/* the shadow the dome's rim leaves on the plate while it is down */}
      <motion.div className="pointer-events-none absolute rounded-[50%]" style={{ left: (SW - DOME_W) / 2 - 3, top: plateY - 16, width: DOME_W + 6, height: 38, opacity: domeShadow, boxShadow: "0 3px 5px rgba(60,50,30,0.9)" }} />

      {/* the card model of the page, standing on the plate */}
      <motion.div className="absolute" style={{ left: (SW - CW) / 2, top: plateY - CH + 2, width: CW, height: CH, scale: cardScale, y: cardY, transformOrigin: "50% 100%" }}>
        <div className="absolute -bottom-[7px] left-[-14px] right-[-14px] h-[16px] rounded-[50%]" style={{ background: "radial-gradient(closest-side, rgba(40,32,20,0.55), rgba(40,32,20,0) 100%)" }} />
        <div className="absolute inset-0 overflow-hidden rounded-[2px]" style={{ boxShadow: "1px 0 0 #E9E5DB, 2px 0 0 #D6D0C3, 3px 0 0 #C2BBAC, 4px 1px 0 #A9A294, 0 1px 0 #D6D0C3, 9px 14px 22px -8px rgba(40,32,20,0.45)" }}>
          {design.page}
          <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(255,250,240,0.14), rgba(255,250,240,0) 30%, rgba(30,24,14,0.12))", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.18)" }} />
          <motion.div className="pointer-events-none absolute inset-0" style={{ opacity: haze, background: "linear-gradient(100deg, rgba(240,246,255,0.2), rgba(240,246,255,0.06) 40%, rgba(40,44,52,0.14))" }} />
        </div>
      </motion.div>

      {/* the glass dome */}
      <motion.div className="pointer-events-none absolute" style={{ left: (SW - DOME_W) / 2, top: HEAD, width: DOME_W, height: DOME_H, y: domeY, rotate: swing, transformOrigin: "50% -12%" }}>
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            borderRadius: DOME_RADIUS,
            background: "linear-gradient(90deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.16) 7%, rgba(255,255,255,0.02) 24%, rgba(255,255,255,0) 62%, rgba(255,255,255,0.1) 88%, rgba(255,255,255,0.42) 100%)",
            boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.85), inset 0 0 26px rgba(255,255,255,0.3), inset 7px 0 8px -6px rgba(70,62,46,0.4), inset -7px 0 8px -6px rgba(70,62,46,0.4), inset 0 9px 10px -7px rgba(70,62,46,0.3), 0 0 0 1px rgba(80,72,58,0.2)",
          }}
        >
          {/* a long streak of the studio light down the left shoulder */}
          <div className="absolute rounded-full" style={{ left: 19, top: 92, width: 9, height: 196, background: "linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,0.95) 16%, rgba(255,255,255,0.8) 68%, rgba(255,255,255,0))", filter: "blur(1.2px)" }} />
          <div className="absolute rounded-full" style={{ left: 34, top: 120, width: 3, height: 150, background: "linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,0.7) 30%, rgba(255,255,255,0))", filter: "blur(0.6px)" }} />
          {/* the same light wrapping over the crown */}
          <div className="absolute" style={{ left: 13, top: 12, right: 13, height: 150, borderRadius: `${DOME_W / 2 - 13}px ${DOME_W / 2 - 13}px 0 0`, borderTop: "5px solid rgba(255,255,255,0.9)", borderLeft: "5px solid rgba(255,255,255,0.9)", borderRight: "5px solid rgba(255,255,255,0)", WebkitMaskImage: "linear-gradient(118deg, #000 4%, rgba(0,0,0,0) 44%)", maskImage: "linear-gradient(118deg, #000 4%, rgba(0,0,0,0) 44%)", filter: "blur(1px)" }} />
          {/* a window reflected on the right shoulder */}
          <div className="absolute" style={{ right: 26, top: 74, width: 36, height: 92, borderRadius: "12px 9px 7px 7px", transform: "skewY(-13deg)", background: "linear-gradient(180deg, rgba(255,255,255,0.5), rgba(255,255,255,0.08))", WebkitMaskImage: "linear-gradient(90deg, #000 0 44%, rgba(0,0,0,0) 44% 52%, #000 52%), linear-gradient(180deg, #000 0 46%, rgba(0,0,0,0) 46% 51%, #000 51%)", WebkitMaskComposite: "source-in", maskImage: "linear-gradient(90deg, #000 0 44%, rgba(0,0,0,0) 44% 52%, #000 52%), linear-gradient(180deg, #000 0 46%, rgba(0,0,0,0) 46% 51%, #000 51%)", maskComposite: "intersect" }} />
          {/* a slow glint that crosses the glass */}
          <div className="three-glass-cake-domes-glint absolute inset-y-0 w-[46%]" style={{ animationDelay: `${delay}s`, background: "linear-gradient(100deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 70%)" }} />
        </div>
        {/* the near side of the rim: a thick ground-glass lip */}
        <div className="absolute bottom-0 left-0 h-[36px] w-full rounded-[50%]" style={{ border: "3px solid rgba(255,255,255,0)", borderBottomColor: "rgba(255,255,255,0.95)", boxShadow: "0 1.5px 0 rgba(80,72,58,0.3)" }} />
        {/* the knob: a ball of blue glass on a short neck */}
        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: -9, width: 20, height: 13, borderRadius: "3px 3px 6px 6px", background: "linear-gradient(90deg, rgba(255,255,255,0.85), rgba(170,200,245,0.5) 40%, rgba(60,100,170,0.5))", boxShadow: "0 0 0 1px rgba(80,72,58,0.15)" }} />
        <div className="absolute left-1/2 h-[38px] w-[38px] -translate-x-1/2 rounded-full" style={{ top: -44, background: `radial-gradient(circle at 34% 27%, #F2F8FF 0%, #A9CCFF 13%, ${BLUE} 42%, #2360BE 74%, #123A78 100%)`, boxShadow: "inset -4px -6px 8px rgba(10,30,80,0.45), inset 3px 3px 5px rgba(255,255,255,0.35), 0 5px 9px -3px rgba(20,40,90,0.5)" }}>
          <span className="absolute left-[9px] top-[6px] h-[7px] w-[10px] rotate-[-28deg] rounded-full bg-white/90" style={{ filter: "blur(0.6px)" }} />
          <span className="absolute bottom-[5px] right-[7px] h-[4px] w-[9px] rotate-[-28deg] rounded-full bg-[#BBD7FF]/60" style={{ filter: "blur(1px)" }} />
        </div>
      </motion.div>
    </div>
  );
}

export default function ThreeGlassCakeDomes() {
  const reduce = !!useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const [chosen, setChosen] = useState(1);
  const [width, setWidth] = useState(1100);
  const pausedUntil = useRef(0);
  const chosenRef = useRef(1);
  chosenRef.current = chosen;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Self-running demo: the middle dome starts lifted, then each stand takes its turn.
  useEffect(() => {
    if (reduce) return;
    let seen = true;
    const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; });
    if (rootRef.current) io.observe(rootRef.current);
    const id = window.setInterval(() => {
      if (!seen || document.hidden || Date.now() < pausedUntil.current) return;
      setChosen((chosenRef.current + 1) % designs.length);
    }, HOLD);
    return () => { window.clearInterval(id); io.disconnect(); };
  }, [reduce]);

  const pick = (k: number) => { pausedUntil.current = Date.now() + 9000; setChosen(k); };

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

  const narrow = width < 700; // phones: the chosen stand sits in the middle and its neighbours peek in from the sides
  const gap = narrow ? -34 : 14;
  const s = narrow ? Math.min(0.92, (width - 40) / SW) : Math.min(1, (width - 48) / (SW * 3 + gap * 2));
  const rowW = SW * 3 + gap * 2;
  const H = HEAD + DOME_H + 78;
  const slide = narrow ? (1 - chosen) * (SW + gap) : 0;
  const counterTop = Math.round((HEAD + DOME_H + 18) * s) + 26; // where the wall meets the counter

  return (
    <section ref={rootRef} className="relative w-full overflow-hidden bg-[#D9D4CA] text-[#0B0D12]" style={{ fontFamily: SANS, backgroundImage: `linear-gradient(180deg, #E4E0D7 0px, #D3CEC3 ${counterTop}px, #F3F0E9 ${counterTop + 1}px, #E6E2D9 ${counterTop + 150}px)` }}>
      <style>{`
        @keyframes three-glass-cake-domes-glint { 0%, 62% { transform: translateX(-120%); } 82%, 100% { transform: translateX(340%); } }
        .three-glass-cake-domes-glint { transform: translateX(-120%); animation: three-glass-cake-domes-glint 7s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .three-glass-cake-domes-glint { animation: none; } }
      `}</style>
      <h2 className="sr-only">Three designs of one website kept under glass domes</h2>
      <div className="pointer-events-none absolute inset-x-0 h-[26px]" aria-hidden="true" style={{ top: counterTop, background: "linear-gradient(180deg, rgba(90,80,60,0.16), rgba(90,80,60,0))" }} />

      <div className="relative mx-auto w-full" style={{ height: Math.round(H * s) + 26, marginTop: 18 }} role="img" aria-label={`Three ceramic cake stands with glass domes, each holding a card model of a different design of a bakery website. The dome over the ${designs[chosen].name} design is lifted.`}>
        <div className="absolute left-1/2 top-0" style={{ width: rowW, height: H, marginLeft: -rowW / 2, transform: `scale(${s})`, transformOrigin: "50% 0%" }}>
          <motion.div className="relative h-full w-full" initial={false} animate={{ x: slide }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 70, damping: 16 }}>
            {designs.map((d, i) => (
              <Stand key={d.name} design={d} chosen={chosen === i} reduce={reduce} delay={i * 1.3} left={i * (SW + gap)} onPick={() => pick(i)} />
            ))}
          </motion.div>
        </div>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[720px] flex-col items-center gap-[13px] px-[16px] pb-[24px] pt-[2px]">
        <div role="radiogroup" aria-label="Choose a design" className="flex items-center gap-[4px] rounded-full bg-white/80 p-[5px] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_30px_-12px_rgba(60,45,20,0.4),0_0_0_1px_rgba(11,13,18,0.06)]">
          {designs.map((d, i) => (
            <button
              key={d.name}
              type="button"
              role="radio"
              aria-checked={chosen === i}
              tabIndex={chosen === i ? 0 : -1}
              onClick={() => pick(i)}
              onKeyDown={(e) => onKey(e, i)}
              className={`flex h-[40px] items-center gap-[8px] rounded-full px-[15px] text-[13px] font-bold tracking-[-0.01em] transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F98FB] focus-visible:ring-offset-2 motion-reduce:transition-none ${chosen === i ? "bg-[#0B0D12] text-white" : "text-[#0B0D12]/70 hover:text-[#0B0D12]"}`}
            >
              <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full transition-colors duration-300 motion-reduce:transition-none" style={{ backgroundColor: chosen === i ? BLUE : "rgba(11,13,18,0.22)" }} />
              {d.name}
            </button>
          ))}
        </div>
        <p aria-live="polite" className="text-center text-[12px] font-semibold tracking-[-0.005em] text-[#0B0D12]/70">{designs[chosen].note}</p>
        <p className="max-w-[460px] text-center text-[11px] font-medium leading-[1.55] text-[#0B0D12]/60">&ldquo;{sentence}&rdquo;<br />One sentence, three designs under glass. Lift the one you want.</p>
      </div>
    </section>
  );
}
