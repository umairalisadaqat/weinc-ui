import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

// The blocks, in the order they start in (top of the page first). `h` is the block height in the drawing.
type Finish = "resin" | "ceramic" | "metal" | "lacquer";
const blocks: { id: string; name: string; finish: Finish; h: number; dx: number; turn: number }[] = [
  { id: "hero", name: "Hero", finish: "resin", h: 104, dx: 0, turn: 0.8 },
  { id: "features", name: "Features", finish: "ceramic", h: 70, dx: -7, turn: -2.2 },
  { id: "pricing", name: "Pricing", finish: "metal", h: 84, dx: 6, turn: 1.6 },
  { id: "footer", name: "Footer", finish: "lacquer", h: 58, dx: -3, turn: -0.7 },
];
const shop = "Fern & Vetch";
const headline = "Flowers cut this morning.";
const heroPhoto = { bg: "#d9b9c0", src: "https://images.pexels.com/photos/4499921/pexels-photo-4499921.jpeg?auto=compress&cs=tinysrgb&w=600" };
const perks = ["Same-day bunches", "Wedding flowers", "Sunday workshops"];
const sizes = [
  { name: "Posy", price: "$24" },
  { name: "Bunch", price: "$42" },
  { name: "Armful", price: "$68" },
];

const BLUE = "#4F98FB";
const BW = 240, BD = 150, PAD = 9; // block width, depth, and the margin of material around each inlaid panel
const OUT = BD + 36; // how far a block is drawn forward before it changes place
const TOTAL = blocks.reduce((s, b) => s + b.h, 0);
const NAV = 26, SG = 3; // page menu height and the gap between page sections
const PW = BW - PAD * 2;
const PAGE_H = NAV + blocks.reduce((s, b) => s + b.h - PAD * 2 + SG, 0) + 6;
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';
const P3 = { transformStyle: "preserve-3d" as const };
const RX = -23, RY = 29;
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Front, top and side of each material. The side is seen in shade, the top catches the light.
const FINISH: Record<Finish, { front: string; top: string; side: string; chip: string }> = {
  resin: {
    front: "bg-[#4F98FB] bg-[radial-gradient(130%_100%_at_50%_118%,#b9d8ff_0%,#6aaafc_34%,#4F98FB_58%,#2f6fd3_100%)] shadow-[inset_0_1.5px_0_rgba(255,255,255,0.9),inset_2px_0_0_rgba(255,255,255,0.45),inset_0_0_20px_rgba(214,232,255,0.55),inset_0_-2px_1px_rgba(214,232,255,0.7)]",
    top: "bg-[#8bbcff] bg-[linear-gradient(118deg,#d4e6ff_0%,#8fbeff_30%,#5fa3fc_62%,#4F98FB_100%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7),inset_0_0_26px_rgba(255,255,255,0.45)]",
    side: "bg-[#2b68c9] bg-[linear-gradient(180deg,#2459b3_0%,#2f6fd3_45%,#5a9bf2_100%)] shadow-[inset_0_1px_0_rgba(214,232,255,0.8),inset_0_0_20px_rgba(160,200,255,0.4),inset_0_-2px_1px_rgba(214,232,255,0.6)]",
    chip: "#4F98FB",
  },
  ceramic: {
    front: "bg-[#F6F4EF] bg-[linear-gradient(180deg,#ffffff_0%,#F6F4EF_36%,#e4e0d6_100%)] shadow-[inset_0_1px_0_#ffffff,inset_0_-2px_0_rgba(11,13,18,0.14)]",
    top: "bg-[#fbfaf7] bg-[linear-gradient(118deg,#ffffff_0%,#fbfaf7_45%,#ebe8df_100%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.9)]",
    side: "bg-[#cfcabd] bg-[linear-gradient(90deg,#dedacf_0%,#cbc6b9_40%,#b4afa2_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]",
    chip: "#F6F4EF",
  },
  metal: {
    front: "bg-[#b3b9c4] bg-[linear-gradient(180deg,#dfe3ea_0%,#bcc2cd_30%,#a3a9b5_72%,#8a909c_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-2px_0_rgba(11,13,18,0.28)]",
    top: "bg-[#d3d8e0] bg-[linear-gradient(118deg,#f4f6f9_0%,#d3d8e0_40%,#b4bac5_100%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.75)]",
    side: "bg-[#7d838f] bg-[linear-gradient(90deg,#959ba7_0%,#7d838f_40%,#676d79_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]",
    chip: "#b3b9c4",
  },
  lacquer: {
    front: "bg-[#0B0D12] bg-[linear-gradient(180deg,#343945_0%,#161920_22%,#0B0D12_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-2px_0_rgba(0,0,0,0.6)]",
    top: "bg-[#1b1e27] bg-[linear-gradient(118deg,#6b7282_0%,#2a2e39_26%,#14161d_60%,#0B0D12_100%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22)]",
    side: "bg-[#07080b] bg-[linear-gradient(90deg,#15181f_0%,#090a0e_50%,#040507_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]",
    chip: "#0B0D12",
  },
};
const BRUSH = "[background:repeating-linear-gradient(90deg,rgba(255,255,255,0.16)_0_1px,rgba(0,0,0,0.05)_1px_3px)]";

const order0 = blocks.map((b) => b.id);
const byId = (id: string) => blocks.find((b) => b.id === id) ?? blocks[0];

// One section of the florist's page. The same drawing is inlaid in a block and laid out on the live page.
function Section({ id }: { id: string }): ReactNode {
  if (id === "hero")
    return (
      <span className="absolute inset-0 block overflow-hidden" style={{ background: heroPhoto.bg }}>
        <img src={heroPhoto.src} alt="" width={222} height={86} className="absolute inset-0 h-full w-full object-cover object-[50%_40%]" />
        <span className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,13,18,0.74)_0%,rgba(11,13,18,0.38)_52%,rgba(11,13,18,0)_86%)]" />
        <span className="absolute left-[10px] top-[11px] w-[120px] text-[16px] font-extrabold leading-[1.02] tracking-[-0.045em] text-white">{headline}</span>
        <span className="absolute bottom-[9px] left-[10px] rounded-full bg-[#4F98FB] px-[8px] py-[3px] text-[7.5px] font-extrabold text-[#0B0D12]">Order a bunch</span>
      </span>
    );
  if (id === "features")
    return (
      <span className="absolute inset-0 grid grid-cols-3 items-center bg-[#fffdf8] px-[6px]">
        {perks.map((p, i) => (
          <span key={p} className="flex flex-col items-center gap-[4px] text-center">
            <span className="flex h-[17px] w-[17px] items-center justify-center rounded-full bg-[#0B0D12]">
              <svg viewBox="0 0 20 20" className="h-[10px] w-[10px]" fill="none" stroke={BLUE} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                {i === 0 ? <path d="M10 4v6l4 2" /> : i === 1 ? <path d="M10 16s-6-3.6-6-8a3.2 3.2 0 0 1 6-1.4A3.2 3.2 0 0 1 16 8c0 4.4-6 8-6 8z" /> : <path d="M4 15l4-9 3 6 2-3 3 6" />}
              </svg>
            </span>
            <span className="text-[7.5px] font-extrabold leading-[1.05] tracking-[-0.02em] text-[#0B0D12]">{p}</span>
          </span>
        ))}
      </span>
    );
  if (id === "pricing")
    return (
      <span className="absolute inset-0 grid grid-cols-3 gap-[5px] bg-[#fffdf8] p-[7px]">
        {sizes.map((s, i) => (
          <span key={s.name} className={`flex flex-col justify-between rounded-[5px] px-[6px] py-[5px] ${i === 1 ? "bg-[#0B0D12] text-[#F6F4EF]" : "bg-[#0B0D12]/[0.06] text-[#0B0D12] shadow-[inset_0_0_0_1px_rgba(11,13,18,0.1)]"}`}>
            <span className="text-[7px] font-bold uppercase tracking-[0.14em] opacity-75">{s.name}</span>
            <span className="flex items-end justify-between">
              <span className="text-[15px] font-extrabold leading-none tracking-[-0.05em]">{s.price}</span>
              <span className="h-[7px] w-[7px] rounded-full" style={{ background: i === 1 ? BLUE : "rgba(11,13,18,0.2)" }} />
            </span>
          </span>
        ))}
      </span>
    );
  return (
    <span className="absolute inset-0 flex items-center justify-between bg-[#0B0D12] px-[10px]">
      <span>
        <span className="block text-[10px] font-extrabold tracking-[-0.03em] text-[#F6F4EF]">{shop}</span>
        <span className="block text-[6.5px] font-semibold text-[#F6F4EF]/70">9 Mill Lane, open Tuesday to Sunday</span>
      </span>
      <span className="flex gap-[7px] text-[7px] font-bold text-[#F6F4EF]/80"><span>Visit</span><span>Care</span><span style={{ color: BLUE }}>Write</span></span>
    </span>
  );
}

export default function PageSectionBlockStack() {
  const reduce = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const busy = useRef(false);
  const [box, setBox] = useState({ scale: 1, narrow: false });
  const [order, setOrder] = useState<string[]>(order0);
  const [lifted, setLifted] = useState<string | null>(null);
  const [closed, setClosed] = useState(false); // true while the pile has closed up over the space the lifted block left
  const [auto, setAuto] = useState(true);
  const [said, setSaid] = useState("Four blocks, one page. Lift any block to move its section.");

  const W = box.narrow ? 400 : 800, H = box.narrow ? 836 : 520;
  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const fit = () => {
      const narrow = el.clientWidth < 700;
      setBox({ narrow, scale: Math.min(1.3, (el.clientWidth - 16) / (narrow ? 400 : 800)) });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const later = (ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)); };
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // Draw a block forward, let the others settle into the space, then seat it in its new place.
  const move = (id: string, to: number) => {
    const from = order.indexOf(id);
    if (busy.current || from === to || to < 0 || to >= order.length) return;
    const next = order.filter((x) => x !== id);
    next.splice(to, 0, id);
    const b = byId(id);
    if (reduce) { setOrder(next); setSaid(`${b.name} moved to place ${to + 1} of ${order.length}.`); return; }
    busy.current = true;
    setLifted(id);
    setSaid(`${b.name} lifted out.`);
    later(420, () => { setClosed(true); setSaid(`${b.name} lifted out. The stack settles.`); });
    later(960, () => { setOrder(next); setClosed(false); });
    later(1400, () => { setLifted(null); setSaid(`${b.name} seated in place ${to + 1}. The page follows.`); });
    later(1800, () => { busy.current = false; });
  };
  const moveRef = useRef(move);
  moveRef.current = move;

  // The self-running demo starts from the finished page, holds it, then shuffles a block every few seconds.
  useEffect(() => {
    if (reduce || !auto) return;
    const steps: [string, number][] = [["pricing", 1], ["pricing", 0], ["hero", 0], ["features", 1]];
    let n = 0;
    const step = () => { const s = steps[n++ % steps.length]; moveRef.current(s[0], s[1]); };
    let every = 0;
    const first = window.setTimeout(() => { step(); every = window.setInterval(step, 3600); }, 5000);
    return () => { window.clearTimeout(first); window.clearInterval(every); };
  }, [reduce, auto]);

  const press = (id: string) => { setAuto(false); move(id, order.indexOf(id) === 0 ? order.length - 1 : 0); };
  const onKey = (e: ReactKeyboardEvent<HTMLButtonElement>, id: string) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();
    setAuto(false);
    move(id, order.indexOf(id) + (e.key === "ArrowUp" ? -1 : 1));
  };

  // The stack turns a few degrees towards the pointer.
  const px = useMotionValue(RY), py = useMotionValue(RX);
  const rotateY = useSpring(px, { stiffness: 90, damping: 16 }), rotateX = useSpring(py, { stiffness: 90, damping: 16 });
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set(RY + ((e.clientX - r.left) / r.width - 0.5) * 10);
    py.set(RX + ((e.clientY - r.top) / r.height - 0.5) * 7);
  };

  // Page sections are measured from the top. Blocks are measured up from the plinth, so taking one out lets the ones above it drop.
  const pageY = (id: string) => {
    let y = 0;
    for (const o of order) { if (o === id) break; y += byId(o).h - PAD * 2 + SG; }
    return y;
  };
  const blockY = (id: string) => {
    let y = TOTAL;
    for (let i = order.length - 1; i >= 0; i--) {
      const o = order[i];
      if (closed && o === lifted && o !== id) continue;
      y -= byId(o).h;
      if (o === id) break;
    }
    return y;
  };
  const stackAt = box.narrow ? { left: 82, top: 62 } : { left: 138, top: 112 };
  const pageAt = box.narrow ? { left: 67, top: 424 } : { left: 488, top: 74 };

  return (
    <div ref={root} onPointerMove={onMove} onPointerLeave={() => { px.set(RY); py.set(RX); }} style={{ fontFamily: FONT }} className="relative flex min-h-[640px] w-full items-center justify-center overflow-hidden bg-[#E3E6EC] bg-[radial-gradient(78%_64%_at_42%_40%,#fbfcfe_0%,#E3E6EC_52%,#c6ccd8_100%)] py-6 sm:min-h-[700px]">
      <style>{`@keyframes page-section-blocks-sway { 0% { transform: rotateY(-3.5deg) } 100% { transform: rotateY(3.5deg) } } .page-section-blocks-sway { animation: page-section-blocks-sway 5s ease-in-out infinite alternate } @media (prefers-reduced-motion: reduce) { .page-section-blocks-sway { animation: none } }`}</style>
      <div style={{ width: W * box.scale, height: H * box.scale }} className="relative">
        <div style={{ width: W, height: H, transform: `scale(${box.scale})`, transformOrigin: "0 0" }} className="absolute left-0 top-0">
          {/* the stack */}
          <div style={{ ...stackAt, width: BW, height: TOTAL, perspective: 1500 }} className="absolute">
            <motion.div style={{ ...P3, rotateX: reduce ? RX : rotateX, rotateY: reduce ? RY : rotateY }} className="absolute inset-0">
              <div style={P3} className="page-section-blocks-sway absolute inset-0">
              {/* shadow on the table, then the plinth */}
              <span aria-hidden="true" style={{ width: BW + 190, height: BD + 230, left: -150, top: TOTAL + 15, transformOrigin: "50% 0", transform: `translateZ(${-(BD + 70)}px) rotateX(90deg)` }} className="absolute rounded-[50px] bg-[radial-gradient(closest-side,rgba(24,32,52,0.6),rgba(24,32,52,0.28)_58%,rgba(24,32,52,0))] blur-[12px]" />
              <span aria-hidden="true" style={{ ...P3, width: BW + 44, height: 14, left: -22, top: TOTAL, transform: "translateZ(22px)" }} className="absolute">
                <i style={{ width: BW + 44, height: BD + 44, transformOrigin: "50% 0", transform: `translateZ(${-(BD + 44)}px) rotateX(90deg)` }} className="absolute left-0 top-0 rounded-[2px] bg-[#1b1e27] bg-[linear-gradient(118deg,#5a6070_0%,#262a34_30%,#12141a_100%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)]" />
                <i style={{ width: BD + 44, height: 14, transformOrigin: "0 50%", transform: "rotateY(90deg)" }} className="absolute left-0 top-0 bg-[#050609] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]" />
                <i className="absolute inset-0 bg-[#0B0D12] bg-[linear-gradient(180deg,#2a2e39_0%,#0B0D12_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]" />
              </span>

              {blocks.map((b) => {
                const slot = order.indexOf(b.id), up = lifted === b.id, f = FINISH[b.finish];
                return (
                  <motion.div
                    key={b.id}
                    initial={false}
                    animate={{ y: blockY(b.id), z: up ? OUT : 0, x: up ? 0 : b.dx, rotateY: up ? 0 : b.turn }}
                    transition={reduce ? { duration: 0 } : {
                      y: up ? { type: "spring", stiffness: 170, damping: 22 } : closed ? { type: "spring", stiffness: 430, damping: 14, mass: 1.1, delay: 0.05 * (order.length - 1 - slot) } : { type: "spring", stiffness: 230, damping: 22 },
                      z: up ? { type: "spring", stiffness: 190, damping: 21 } : { type: "spring", stiffness: 300, damping: 24 },
                      default: { type: "spring", stiffness: 200, damping: 20 },
                    }}
                    style={{ ...P3, width: BW, height: b.h }}
                    className="absolute left-0 top-0"
                  >
                    <span aria-hidden="true" style={{ width: BW, height: BD, transformOrigin: "50% 0", transform: `translateZ(${-BD}px) rotateX(90deg)` }} className={`absolute left-0 top-0 overflow-hidden ${f.top}`}>
                      {b.finish === "metal" && <i className={`absolute inset-0 opacity-70 ${BRUSH}`} />}
                      {b.finish === "resin" && <i className="absolute left-[18px] top-[16px] h-[70px] w-[120px] rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.85),rgba(255,255,255,0))] blur-[6px]" />}
                      {b.finish === "lacquer" && <i className="absolute -left-[20px] top-[10px] h-[36px] w-[220px] -rotate-[14deg] bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(255,255,255,0.3),rgba(255,255,255,0))] blur-[3px]" />}
                      {b.finish === "resin" && <i className="absolute bottom-[8px] left-[9px] right-[9px] h-[4px] rounded-full bg-[#1c4a99]/55 blur-[1px]" />}
                      <i className="absolute inset-x-0 bottom-0 h-[2px] bg-white/70" />
                      <i className="absolute inset-y-0 left-0 w-[2px] bg-white/45" />
                      <span className={`absolute bottom-[16px] left-[14px] origin-bottom-left scale-y-[2.6] text-[16px] font-extrabold uppercase tracking-[-0.01em] ${b.finish === "lacquer" || b.finish === "resin" ? "text-white/90" : "text-[#0B0D12]/80"}`}>{b.name}</span>
                    </span>
                    <span aria-hidden="true" style={{ width: BD, height: b.h, transformOrigin: "0 50%", transform: "rotateY(90deg)" }} className={`absolute left-0 top-0 overflow-hidden ${f.side}`}>
                      {b.finish === "metal" && <i className={`absolute inset-0 opacity-40 ${BRUSH}`} />}
                      {b.finish === "resin" && <i className="absolute inset-y-[10%] left-[8px] w-[5px] rounded-full bg-[#173f86]/50 blur-[1.5px]" />}
                      <i className="absolute inset-y-0 left-0 w-[2px] bg-white/40" />
                      {slot > 0 && <i className="absolute inset-x-0 top-0 h-[9px] bg-[linear-gradient(180deg,rgba(5,8,16,0.42),rgba(5,8,16,0))]" />}
                    </span>
                    <button
                      type="button"
                      onClick={() => press(b.id)}
                      onKeyDown={(e) => onKey(e, b.id)}
                      aria-label={`${b.name} block, place ${slot + 1} of ${order.length}. Press to lift it to the ${slot === 0 ? "bottom" : "top"}, or use the up and down arrow keys.`}
                      className={`group absolute inset-0 cursor-pointer text-left outline-none focus-visible:ring-2 focus-visible:ring-[#0B0D12] focus-visible:ring-offset-2 focus-visible:ring-offset-white ${f.front}`}
                    >
                      {b.finish === "metal" && <i aria-hidden="true" className={`absolute inset-0 opacity-60 ${BRUSH}`} />}
                      {b.finish === "resin" && <i aria-hidden="true" className="pointer-events-none absolute inset-x-[3px] top-[2px] h-[10px] rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.75),rgba(255,255,255,0))]" />}
                      {slot > 0 && <i aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[8px] bg-[linear-gradient(180deg,rgba(5,8,16,0.34),rgba(5,8,16,0))]" />}
                      <span aria-hidden="true" style={{ inset: PAD }} className={`absolute overflow-hidden rounded-[5px] transition-transform duration-200 group-hover:scale-[1.012] motion-reduce:transition-none ${b.finish === "resin" ? "shadow-[0_0_0_1px_rgba(16,44,96,0.9),5px_7px_12px_rgba(16,44,96,0.6),-2px_-2px_8px_rgba(214,232,255,0.6)]" : "shadow-[0_1px_0_1px_rgba(255,255,255,0.6),0_-1px_0_1px_rgba(11,13,18,0.3)]"}`}>
                        <Section id={b.id} />
                        <i className="pointer-events-none absolute inset-0 rounded-[5px] bg-[linear-gradient(116deg,rgba(255,255,255,0.3)_0%,rgba(255,255,255,0.06)_18%,rgba(255,255,255,0)_32%)] shadow-[inset_0_2px_3px_rgba(5,8,16,0.5),inset_0_0_0_1px_rgba(5,8,16,0.35)]" />
                      </span>
                    </button>
                  </motion.div>
                );
              })}
              </div>
            </motion.div>
          </div>

          {/* the live page */}
          <div aria-hidden="true" style={{ ...pageAt, width: PW + 16, height: PAGE_H + 16, transform: "scale(1.2)", transformOrigin: "0 0" }} className="absolute rounded-[13px] bg-[#0B0D12] shadow-[0_1px_0_rgba(255,255,255,0.5)_inset,0_30px_44px_-18px_rgba(24,32,52,0.55),0_8px_14px_-6px_rgba(24,32,52,0.35)]">
            <span className="absolute inset-[8px] overflow-hidden rounded-[6px] bg-[#fffdf8]">
              <span className="absolute inset-x-0 top-0 flex items-center justify-between px-[9px]" style={{ height: NAV }}>
                <span className="text-[10.5px] font-extrabold tracking-[-0.03em] text-[#0B0D12]">{shop}</span>
                <span className="flex gap-[8px] text-[7.5px] font-bold text-[#0B0D12]/75"><span>Shop</span><span>Weddings</span><span>Visit</span></span>
              </span>
              {blocks.map((b) => (
                <motion.span
                  key={b.id}
                  initial={false}
                  animate={{ y: NAV + pageY(b.id), scale: lifted === b.id ? 1.035 : 1, boxShadow: lifted === b.id ? "0 10px 18px -6px rgba(11,13,18,0.45)" : "0 0px 0px 0px rgba(11,13,18,0)" }}
                  transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 210, damping: 24, delay: lifted ? 0 : 0.05 }}
                  style={{ height: b.h - PAD * 2, left: 3, right: 3, zIndex: lifted === b.id ? 2 : 1 }}
                  className="absolute top-0 block overflow-hidden rounded-[5px]"
                >
                  <Section id={b.id} />
                  <i className="absolute left-0 top-0 h-full w-[3px] transition-opacity duration-300 motion-reduce:transition-none" style={{ background: BLUE, opacity: lifted === b.id ? 1 : 0 }} />
                </motion.span>
              ))}
            </span>
          </div>

          <p style={box.narrow ? { left: 0, right: 0, top: H - 34 } : { left: 60, top: H - 40, width: 400 }} className="absolute flex items-center justify-center gap-[8px] text-[12px] font-semibold tracking-[-0.01em] text-[#0B0D12]/80">
            <span aria-hidden="true" className="h-[7px] w-[7px] shrink-0 rounded-full bg-[#4F98FB]" />
            <span aria-live={auto ? "off" : "polite"}>{said}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
