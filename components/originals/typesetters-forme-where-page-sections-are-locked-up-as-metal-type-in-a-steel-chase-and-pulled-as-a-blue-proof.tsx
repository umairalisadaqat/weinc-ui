import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

// The movable blocks of type, top to bottom. The menu line above them is fixed. `h` is the block height in the drawing.
const sections = [
  { id: "hero", name: "Hero", h: 96 },
  { id: "features", name: "Features", h: 62 },
  { id: "pricing", name: "Pricing", h: 62 },
  { id: "footer", name: "Footer", h: 62 },
];
const school = "Saltline";
const headline = "Learn to surf at low tide.";
const photo = { bg: "#8a8f98", src: "https://images.pexels.com/photos/16248182/pexels-photo-16248182.jpeg?auto=compress&cs=tinysrgb&w=400" };
const points = ["Boards included", "Small groups", "All ages"];
const lessons = [
  { name: "Taster", price: "$45" },
  { name: "Week", price: "$190" },
  { name: "Private", price: "$80" },
];

const SW = 176, NAVH = 26, TIGHT = 2, SLACK = 3.5; // type width, menu line height, and the gap between blocks locked and unlocked
const COL = NAVH + sections.reduce((s, x) => s + x.h + TIGHT, 0); // height of the locked column of type
const F = 20, IN = 6; // chase bar thickness and the clearance inside it
const WELL_W = IN + SW + 4 + 14 + 3 + 20 + IN, WELL_H = IN + COL + 4 + 14 + 3 + 20 + IN;
const CW = WELL_W + F * 2, CH = WELL_H + F * 2;
const MX = 16, MY = 20; // paper margins
const PAPER_W = SW + MX * 2, PAPER_H = COL + MY * 2;
const CX = 16, CY = 34, PX = CX + CW + 14, PY = CY + F + IN - MY;
const HINGE = (CX + F + IN + SW + PX + MX) / 2 - PX; // the line the sheet turns over on, measured from its left edge
const W = PX + PAPER_W + 16, H = CY + CH + 34;
const INK = "#2f7df0", PRINT = "#2667d2", SHOULDER = "#8e929b", PAPER = "#F6F4EF";
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';
const P3 = { transformStyle: "preserve-3d" as const };
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
const STEEL = "bg-[#4a505c] bg-[linear-gradient(150deg,#8a92a2_0%,#5a6170_18%,#3a3f4a_55%,#262a33_100%)]";
const WOOD = "bg-[#cdbd9d] bg-[linear-gradient(180deg,#e0d2b5_0%,#cdbd9d_50%,#b3a281_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6),inset_0_-1px_0_rgba(0,0,0,0.3),0_2px_0_#7d6f55,0_3px_4px_rgba(0,0,0,0.6)]";

// One section, drawn once and used twice: as inked metal in the forme (mirrored by its parent) and as the print on the sheet.
function Section({ id, metal }: { id: string; metal: boolean }): ReactNode {
  const ink = metal ? INK : PRINT, ground = metal ? SHOULDER : PAPER;
  const raised: CSSProperties = metal ? { color: ink, textShadow: "0 0.8px 0 rgba(11,13,18,0.6), 0 -0.5px 0 rgba(190,220,255,0.7)" } : { color: ink };
  const solid: CSSProperties = metal ? { background: `linear-gradient(180deg,#5c9bf7,${ink})`, color: "#1c3f7c", boxShadow: "0 1px 0 rgba(11,13,18,0.6), inset 0 0.5px 0 rgba(210,230,255,0.8)" } : { background: ink, color: ground };
  const rule: CSSProperties = metal ? { background: ink, boxShadow: "0 0.8px 0 rgba(11,13,18,0.6)" } : { background: ink };
  if (id === "nav")
    return (
      <span className="absolute inset-0 flex items-center justify-between px-[7px]" style={raised}>
        <span className="text-[11px] font-extrabold tracking-[-0.03em]">{school}</span>
        <span className="flex gap-[7px] text-[6.5px] font-bold"><span>Lessons</span><span>Board hire</span><span>Find us</span></span>
      </span>
    );
  if (id === "hero")
    return (
      <span className="absolute inset-0 block" style={raised}>
        <span className="absolute left-[7px] top-[8px] text-[5.5px] font-bold uppercase tracking-[0.22em]">Surf school</span>
        <span className="absolute left-[7px] top-[19px] w-[92px] text-[16.5px] font-extrabold leading-[0.98] tracking-[-0.045em]">{headline}</span>
        <span className="absolute bottom-[7px] left-[7px] rounded-full px-[7px] py-[2.5px] text-[6.5px] font-extrabold" style={{ ...solid, textShadow: "none" }}>Book a lesson</span>
        <span className="absolute bottom-[6px] right-[6px] top-[6px] w-[68px] overflow-hidden rounded-[2px]" style={{ background: metal ? "#a9adb5" : PAPER, boxShadow: metal ? "0 1px 0 rgba(11,13,18,0.6), inset 0 0 0 0.5px rgba(11,13,18,0.5)" : "none" }}>
          <img src={photo.src} alt="" width={68} height={84} className="absolute inset-0 h-full w-full object-cover object-[62%_50%] contrast-[1.5] grayscale" style={{ background: photo.bg }} />
          <i className="absolute inset-0 mix-blend-screen" style={{ background: ink }} />
          <i className="absolute inset-0 opacity-70 [background:radial-gradient(circle,rgba(255,255,255,0.75)_0.55px,rgba(255,255,255,0)_0.8px)_0_0/2.4px_2.4px]" />
          {!metal && <i className="absolute inset-0 mix-blend-multiply" style={{ background: PAPER }} />}
        </span>
      </span>
    );
  if (id === "features")
    return (
      <span className="absolute inset-0 grid grid-cols-3 gap-[6px] px-[7px] py-[9px]" style={raised}>
        {points.map((p, i) => (
          <span key={p} className="flex flex-col">
            <span className="h-[1.5px] w-full" style={rule} />
            <span className="mt-[5px] font-mono text-[6px] font-bold tracking-[0.08em]">0{i + 1}</span>
            <span className="mt-[3px] text-[9px] font-extrabold leading-[1] tracking-[-0.035em]">{p}</span>
          </span>
        ))}
      </span>
    );
  if (id === "pricing")
    return (
      <span className="absolute inset-0 grid grid-cols-3 gap-[4px] p-[7px]">
        {lessons.map((l, i) => (
          <span key={l.name} className="flex flex-col justify-between rounded-[2px] px-[5px] py-[5px]" style={i === 1 ? solid : { ...raised, boxShadow: `inset 0 0 0 1.2px ${ink}` }}>
            <span className="text-[5.5px] font-bold uppercase tracking-[0.16em]">{l.name}</span>
            <span className="text-[15px] font-extrabold leading-none tracking-[-0.05em]">{l.price}</span>
          </span>
        ))}
      </span>
    );
  return (
    <span className="absolute inset-0 block px-[7px]" style={raised}>
      <span className="absolute inset-x-[7px] top-[8px] h-[3px]" style={rule} />
      <span className="absolute left-[7px] top-[19px] text-[11px] font-extrabold tracking-[-0.03em]">{school} Surf School</span>
      <span className="absolute left-[7px] top-[34px] text-[6.5px] font-semibold">Harbour Road, out at every low tide</span>
      <span className="absolute bottom-[7px] left-[7px] flex gap-[8px] text-[6.5px] font-bold"><span>Tide times</span><span>Vouchers</span><span>Write to us</span></span>
    </span>
  );
}

// A two-part steel quoin seen from above. Locked, the wedges ride up each other and fill the channel.
function Quoin({ locked, style, flat }: { locked: boolean; style: CSSProperties; flat?: boolean }) {
  const reduce = useReducedMotion();
  const t = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 420, damping: 22 };
  return (
    <span aria-hidden="true" style={{ ...style, width: 20, height: 62, transform: flat ? "rotate(-90deg)" : undefined, transformOrigin: "0 0" }} className="absolute block drop-shadow-[0_3px_2px_rgba(0,0,0,0.75)]">
      <motion.i initial={false} animate={{ y: locked ? -4 : 0 }} transition={t} className="absolute inset-0 block">
        <svg viewBox="0 0 20 62" className="absolute inset-0 h-full w-full">
          <defs><linearGradient id="typesetters-forme-qa" x1="0" x2="1"><stop offset="0" stopColor="#aab0bd" /><stop offset="0.5" stopColor="#6d7482" /><stop offset="1" stopColor="#474c58" /></linearGradient></defs>
          <polygon points="0.4,0.4 13,0.4 7,61.6 0.4,61.6" fill="url(#typesetters-forme-qa)" stroke="#07080b" strokeWidth="0.6" />
          <line x1="1.2" y1="1" x2="1.2" y2="61" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="0.7" />
          <line x1="12" y1="2" x2="6.3" y2="60" stroke="#07080b" strokeOpacity="0.8" strokeWidth="1.6" strokeDasharray="1.2 2.2" />
        </svg>
      </motion.i>
      <motion.i initial={false} animate={{ y: locked ? 4 : 0, x: locked ? 0 : -3 }} transition={t} className="absolute inset-0 block">
        <svg viewBox="0 0 20 62" className="absolute inset-0 h-full w-full">
          <defs><linearGradient id="typesetters-forme-qb" x1="0" x2="1"><stop offset="0" stopColor="#dfe3ea" /><stop offset="0.5" stopColor="#9aa1af" /><stop offset="1" stopColor="#5f6572" /></linearGradient></defs>
          <polygon points="13,0.4 19.6,0.4 19.6,61.6 7,61.6" fill="url(#typesetters-forme-qb)" stroke="#07080b" strokeWidth="0.6" />
          <line x1="13.6" y1="1.2" x2="7.9" y2="60.6" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="0.7" />
        </svg>
      </motion.i>
      <i className="absolute left-1/2 top-1/2 h-[11px] w-[11px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,#050609_0_34%,#e3e6ec_40%,#8b92a0_70%,#4d525e_100%)] shadow-[0_0_0_0.6px_rgba(0,0,0,0.8),0_1px_1px_rgba(0,0,0,0.6)]" />
    </span>
  );
}

export default function TypesettersForme() {
  const reduce = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const busy = useRef(false);
  const [scale, setScale] = useState(1);
  const [order, setOrder] = useState<string[]>(sections.map((s) => s.id));
  const [locked, setLocked] = useState(true);
  const [moving, setMoving] = useState<string | null>(null);
  const [sheet, setSheet] = useState<"shown" | "gone" | "laid">("shown");
  const [pulls, setPulls] = useState(1);
  const [auto, setAuto] = useState(true);
  const [said, setSaid] = useState("Locked up and proofed. Press a block of type to move it.");

  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const fit = () => setScale(Math.min(1.36, (el.clientWidth - 12) / W));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const later = (ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)); };
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // Unlock, move one block a place, lock up again, lay a sheet on the type and turn it over.
  const move = (id: string, dir: -1 | 1) => {
    const from = order.indexOf(id), to = from + dir;
    if (busy.current || to < 0 || to >= order.length) return;
    const next = order.slice();
    next[from] = order[to];
    next[to] = id;
    const name = sections.find((s) => s.id === id)?.name ?? "";
    if (reduce) { setOrder(next); setPulls((n) => n + 1); setSaid(`${name} moved to place ${to + 1}. New proof pulled.`); return; }
    busy.current = true;
    setSheet("gone");
    setLocked(false);
    setSaid("Quoins loosened.");
    later(520, () => { setMoving(id); setOrder(next); setSaid(`${name} moved to place ${to + 1} of ${order.length}.`); });
    later(1250, () => { setMoving(null); setLocked(true); setSaid("Locked up tight."); });
    later(1700, () => { setPulls((n) => n + 1); setSheet("laid"); setSaid("Sheet laid on the type."); });
    later(2250, () => { setSheet("shown"); setSaid("New proof pulled. The page reads the right way round."); });
    later(3300, () => { busy.current = false; });
  };
  const moveRef = useRef(move);
  moveRef.current = move;

  // The self-running demo holds the finished proof first, then re-sets the page every few seconds.
  useEffect(() => {
    if (reduce || !auto) return;
    const steps: [string, -1 | 1][] = [["pricing", -1], ["pricing", -1], ["hero", -1], ["features", -1]];
    let n = 0;
    const step = () => { const s = steps[n++ % steps.length]; moveRef.current(s[0], s[1]); };
    let every = 0;
    const first = window.setTimeout(() => { step(); every = window.setInterval(step, 4800); }, 6000);
    return () => { window.clearTimeout(first); window.clearInterval(every); };
  }, [reduce, auto]);

  const press = (id: string) => { setAuto(false); move(id, order.indexOf(id) === 0 ? 1 : -1); };
  const onKey = (e: ReactKeyboardEvent<HTMLButtonElement>, id: string) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    setAuto(false);
    move(id, e.key === "ArrowUp" ? -1 : 1);
  };

  const yOf = (id: string, gap: number) => {
    let y = NAVH + gap;
    for (const o of order) { if (o === id) break; y += (sections.find((s) => s.id === o)?.h ?? 0) + gap; }
    return y;
  };
  const gap = locked ? TIGHT : SLACK;
  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 300, damping: 26 };
  const METAL = "rounded-[2px] bg-[#a4a8b1] bg-[linear-gradient(160deg,#c3c7ce_0%,#9da1aa_45%,#858993_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.75),inset_1px_0_0_rgba(255,255,255,0.35),inset_0_-1px_0_rgba(0,0,0,0.4),0_1.5px_0_#5d6169,0_3px_0_#44474e,0_4px_5px_rgba(0,0,0,0.7)]";

  return (
    <div ref={root} style={{ fontFamily: FONT }} className="relative flex min-h-[420px] w-full flex-col items-center justify-center gap-2 overflow-hidden bg-[#0B0D12] bg-[radial-gradient(70%_60%_at_40%_38%,#232834_0%,#12151c_55%,#0B0D12_100%)] py-6 sm:min-h-[720px]">
      <style>{`@keyframes typesetters-forme-sheen { 0% { transform: translateX(-110%) skewX(-14deg) } 100% { transform: translateX(420%) skewX(-14deg) } } .typesetters-forme-sheen { animation: typesetters-forme-sheen 6.5s cubic-bezier(0.4,0,0.6,1) infinite } @media (prefers-reduced-motion: reduce) { .typesetters-forme-sheen { animation: none; transform: translateX(60%) skewX(-14deg) } }`}</style>
      <div style={{ width: W * scale, height: H * scale }} className="relative">
        <div style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "0 0", perspective: 1500 }} className="absolute left-0 top-0">
          <div style={{ ...P3, transform: "rotateX(13deg)", transformOrigin: "50% 60%" }} className="absolute inset-0">
            {/* the chase: a steel frame standing on the stone */}
            <div style={{ left: CX, top: CY, width: CW, height: CH }} className={`absolute rounded-[5px] ${STEEL} shadow-[inset_0_1.5px_0_rgba(255,255,255,0.6),inset_1.5px_0_0_rgba(255,255,255,0.3),inset_0_-1.5px_0_rgba(0,0,0,0.5),inset_-1.5px_0_0_rgba(0,0,0,0.35),0_2px_0_#15171d,0_4px_0_#111318,0_6px_0_#0c0d11,0_8px_0_#08090c,0_22px_30px_rgba(0,0,0,0.75),18px_30px_50px_rgba(0,0,0,0.5)]`}>
              <i aria-hidden="true" className="absolute inset-0 rounded-[5px] opacity-50 [background:repeating-linear-gradient(98deg,rgba(255,255,255,0.05)_0_1px,rgba(0,0,0,0.07)_1px_3px)]" />
              <span aria-hidden="true" className="absolute left-[26px] top-[5px] font-mono text-[6px] font-bold uppercase tracking-[0.3em] text-black/60 [text-shadow:0_0.6px_0_rgba(255,255,255,0.25)]">Forme 4 / page one</span>
              {/* the well, with the bed of the stone showing where nothing is set */}
              <div style={{ left: F, top: F, width: WELL_W, height: WELL_H }} className="absolute rounded-[2px] bg-[#07080b] shadow-[inset_0_5px_6px_rgba(0,0,0,0.9),inset_4px_0_5px_rgba(0,0,0,0.6),0_1px_0_rgba(255,255,255,0.3),0_0_0_1.5px_rgba(0,0,0,0.45)]">
                {/* the menu line, fixed at the head */}
                <div aria-hidden="true" style={{ left: IN, top: IN, width: SW, height: NAVH }} className={`absolute ${METAL}`}>
                  <span className="absolute inset-0 block [transform:scaleX(-1)]"><Section id="nav" metal /></span>
                </div>
                {sections.map((s, i) => {
                  const slot = order.indexOf(s.id), up = moving === s.id;
                  return (
                    <motion.button
                      key={s.id}
                      type="button"
                      onClick={() => press(s.id)}
                      onKeyDown={(e) => onKey(e, s.id)}
                      aria-label={`${s.name} block of type, place ${slot + 1} of ${order.length}. Press to move it ${slot === 0 ? "down" : "up"} one place, or use the up and down arrow keys.`}
                      initial={false}
                      animate={{ y: yOf(s.id, gap), x: locked ? 0 : [1.2, -1.4, 0.8, -0.6][i], rotate: locked ? 0 : [0.5, -0.4, 0.35, -0.5][i], scale: up ? 1.04 : 1 }}
                      transition={spring}
                      style={{ left: IN, top: IN, width: SW, height: s.h, zIndex: up ? 3 : 1 }}
                      className={`absolute cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#F6F4EF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0D12] ${METAL}`}
                    >
                      <span aria-hidden="true" className="absolute inset-0 block [transform:scaleX(-1)]"><Section id={s.id} metal /></span>
                      <i aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[2px] bg-[linear-gradient(120deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0)_30%)]" />
                    </motion.button>
                  );
                })}
                {/* wooden furniture and the quoins that squeeze it */}
                <motion.span aria-hidden="true" initial={false} animate={{ x: locked ? 0 : 1.5 }} transition={spring} style={{ left: IN + SW + 4, top: IN, width: 14, height: COL }} className={`absolute rounded-[1.5px] ${WOOD}`}>
                  <i className="absolute inset-0 opacity-50 [background:repeating-linear-gradient(180deg,rgba(90,70,40,0.2)_0_1px,rgba(255,255,255,0)_1px_5px)]" />
                </motion.span>
                <motion.span aria-hidden="true" initial={false} animate={{ y: locked ? 0 : 5 }} transition={spring} style={{ left: IN, top: IN + COL + 4, width: SW + 18, height: 14 }} className={`absolute rounded-[1.5px] ${WOOD}`}>
                  <i className="absolute inset-0 opacity-50 [background:repeating-linear-gradient(90deg,rgba(90,70,40,0.2)_0_1px,rgba(255,255,255,0)_1px_7px)]" />
                </motion.span>
                <Quoin locked={locked} style={{ left: IN + SW + 21, top: IN + 36 }} />
                <Quoin locked={locked} style={{ left: IN + SW + 21, top: IN + COL - 104 }} />
                <Quoin locked={locked} flat style={{ left: IN + 22, top: IN + COL + 41 }} />
                <Quoin locked={locked} flat style={{ left: IN + 106, top: IN + COL + 41 }} />
                {/* the quoin key, standing in the lower side quoin */}
                <motion.span aria-hidden="true" initial={false} animate={{ rotate: locked ? 24 : -72 }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 170, damping: 15 }} style={{ left: IN + SW + 31 - 29, top: IN + COL - 73 - 6, width: 58, height: 12 }} className="absolute z-[4] block drop-shadow-[5px_9px_4px_rgba(0,0,0,0.7)]">
                  <i className="absolute inset-y-[1px] left-0 right-0 rounded-full bg-[linear-gradient(180deg,#f1f3f6_0%,#b4bac5_38%,#6a707d_100%)] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.5)]" />
                  <i className="absolute left-1/2 top-1/2 h-[17px] w-[17px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_38%_32%,#ffffff_0%,#c5cad3_30%,#6a707d_100%)] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.5)]" />
                  <i className="absolute left-1/2 top-1/2 h-[6px] w-[6px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4F98FB] shadow-[inset_0_0.5px_1px_rgba(0,0,0,0.5)]" />
                </motion.span>
              </div>
              {/* light from the workshop window drifting over the metal */}
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5] overflow-hidden rounded-[5px] mix-blend-color-dodge">
                <i className="typesetters-forme-sheen absolute -inset-y-[20%] left-0 w-[34%] bg-[linear-gradient(100deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.17)_50%,rgba(255,255,255,0)_100%)]" />
              </span>
            </div>

            {/* the sheet: laid face down on the type, then turned over to the right */}
            <div aria-hidden="true" style={{ ...P3, left: PX, top: PY, width: PAPER_W, height: PAPER_H, transform: "translateZ(4px)" }} className="absolute">
              <motion.div
                initial={false}
                animate={sheet === "shown" ? { rotateY: 0, x: 0, opacity: 1 } : sheet === "laid" ? { rotateY: -180, x: 0, opacity: 1 } : { rotateY: 0, x: 26, opacity: 0 }}
                transition={reduce ? { duration: 0 } : sheet === "shown" ? { rotateY: { duration: 0.95, ease: [0.5, 0, 0.2, 1] } } : sheet === "laid" ? { rotateY: { duration: 0 }, x: { duration: 0 }, opacity: { duration: 0.2 } } : { duration: 0.3 }}
                style={{ ...P3, transformOrigin: `${HINGE}px 50%` }}
                className="absolute inset-0"
              >
                <div style={{ backfaceVisibility: "hidden", background: PAPER }} className="absolute inset-0 rounded-[1.5px] bg-[linear-gradient(140deg,#ffffff_0%,#F6F4EF_45%,#e6e2d8_100%)] shadow-[0_1px_0_#cfcabd,10px_18px_26px_rgba(0,0,0,0.6)]">
                  <span className="absolute block" style={{ left: MX, top: MY, width: SW, height: NAVH }}><Section id="nav" metal={false} /></span>
                  {order.map((id) => (
                    <span key={id} className="absolute block" style={{ left: MX, top: MY + yOf(id, TIGHT), width: SW, height: sections.find((s) => s.id === id)?.h }}><Section id={id} metal={false} /></span>
                  ))}
                  {[[6, 6], [PAPER_W - 12, 6], [6, PAPER_H - 12], [PAPER_W - 12, PAPER_H - 12]].map(([x, y]) => (
                    <i key={`${x}-${y}`} style={{ left: x, top: y }} className="absolute h-[6px] w-[6px] [background:linear-gradient(#0B0D12,#0B0D12)_50%_0/0.6px_100%_no-repeat,linear-gradient(#0B0D12,#0B0D12)_0_50%/100%_0.6px_no-repeat] opacity-50" />
                  ))}
                  <span className="absolute bottom-[6px] left-0 right-0 text-center font-mono text-[5.5px] font-bold uppercase tracking-[0.3em] text-[#0B0D12]/60">Proof {String(pulls).padStart(2, "0")}</span>
                  <i className="pointer-events-none absolute inset-0 opacity-[0.07] [background:repeating-linear-gradient(0deg,#0B0D12_0_0.5px,rgba(0,0,0,0)_0.5px_3px)]" />
                </div>
                <div style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "#ebe7dd" }} className="absolute inset-0 rounded-[1.5px] bg-[linear-gradient(220deg,#f8f6f1_0%,#ebe7dd_50%,#d9d4c8_100%)] shadow-[0_1px_0_#cfcabd]">
                  <i className="absolute rounded-[2px] shadow-[inset_0_1px_1.5px_rgba(11,13,18,0.22),0_1px_0_rgba(255,255,255,0.9)]" style={{ left: MX, top: MY, width: SW, height: COL }} />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
      <p className="relative flex max-w-[92%] items-center justify-center gap-2 text-center text-[12px] font-semibold tracking-[-0.005em] text-[#F6F4EF]/85 sm:text-[13.5px]">
        <span aria-hidden="true" className="h-[7px] w-[7px] shrink-0 rounded-full bg-[#4F98FB] shadow-[0_0_8px_2px_rgba(79,152,251,0.6)]" />
        <span aria-live={auto ? "off" : "polite"}>{said}</span>
      </p>
    </div>
  );
}
