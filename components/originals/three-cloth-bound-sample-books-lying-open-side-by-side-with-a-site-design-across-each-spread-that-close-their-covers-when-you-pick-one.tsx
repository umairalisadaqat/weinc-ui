import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

// One book is two boards HALF wide and BH tall. A design is printed across the two pages at DW by DH.
const HALF = 176;
const BH = 250;
const EDGE = 9; // cloth turn-in plus the visible block of page edges at the fore-edge
const DW = (HALF - EDGE) * 2;
const DH = BH - 12;
const THICK = 14; // how far a closed cover sits above the pages it lands on
const BLUE = "#4F98FB"; // the ribbon markers, the foil and the active pill
const HOLD = 4200; // rest between steps of the self-running demo, in milliseconds
const SANS = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

const sentence = "A ceramics studio that sells small-batch tableware and runs wheel classes.";

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0'/></filter><rect width='140' height='140' filter='url(%23n)'/></svg>\")";
const WEAVE = "repeating-linear-gradient(0deg, rgba(255,255,255,0.07) 0 1px, rgba(0,0,0,0) 1px 2px), repeating-linear-gradient(90deg, rgba(0,0,0,0.12) 0 1px, rgba(0,0,0,0) 1px 2px)";
const PAGES = "repeating-linear-gradient(180deg, #F3EFE6 0px, #F3EFE6 1px, #B9B2A3 1px, #B9B2A3 2px)";

function Photo({ src, alt, tone, focus = "50% 50%", className = "" }: { src: string; alt: string; tone: string; focus?: string; className?: string }) {
  return (
    <div className={`overflow-hidden ${className}`} style={{ backgroundColor: tone }}>
      <img src={src} alt={alt} draggable={false} className="h-full w-full object-cover" style={{ objectPosition: focus }} />
    </div>
  );
}

// Three designs of one invented ceramics studio's homepage, each laid out across a two-page spread.
const books: { name: string; note: string; cloth: string; foil: string; ribbon: string; spread: ReactNode }[] = [
  {
    name: "Plinth",
    note: "White space, black grotesque, one picture",
    cloth: "#CFC7B8",
    foil: "#1B1D22",
    ribbon: BLUE,
    spread: (
      <div className="flex h-full w-full bg-[#F8F6F1] text-[#101114]" style={{ fontFamily: SANS }}>
        <div className="flex w-1/2 flex-col p-[13px]">
          <div className="flex items-center justify-between text-[5.5px] font-semibold uppercase tracking-[0.16em]">
            <span className="text-[9px] font-black tracking-[0.02em]">OSTRA</span><span className="text-[#101114]/60">Shop &nbsp; Classes</span>
          </div>
          <div className="mt-auto text-[27px] font-black leading-[0.9] tracking-[-0.05em]">Pots for the everyday table.</div>
          <div className="mt-[8px] text-[6.5px] font-medium leading-[1.45] text-[#101114]/70">Stoneware thrown in small batches<br />on Calder Row.</div>
          <div className="mt-[9px] inline-flex h-[17px] w-fit items-center rounded-full bg-[#101114] px-[10px] text-[6.5px] font-bold text-white">Shop the shelf</div>
        </div>
        <div className="flex w-1/2 flex-col p-[13px] pl-[15px]">
          <Photo className="min-h-0 flex-1 rounded-[2px]" tone="#E9B48E" focus="50% 55%" src="https://images.pexels.com/photos/5199152/pexels-photo-5199152.jpeg?auto=compress&cs=tinysrgb&w=700" alt="A white jug, a striped jar and a pomegranate on blue and peach paper" />
          <div className="mt-[7px] flex justify-between text-[5.5px] font-semibold uppercase tracking-[0.14em] text-[#101114]/70"><span>The pouring jug</span><span>No. 14</span></div>
        </div>
      </div>
    ),
  },
  {
    name: "Kiln",
    note: "Midnight blue, an italic serif, a still life",
    cloth: "#14171E",
    foil: BLUE,
    ribbon: BLUE,
    spread: (
      <div className="relative h-full w-full bg-[#0A1526] text-[#F1ECE2]" style={{ fontFamily: SERIF }}>
        <Photo className="absolute inset-y-0 right-0 w-[56%]" tone="#12305A" focus="50% 62%" src="https://images.pexels.com/photos/40085654/pexels-photo-40085654.jpeg?auto=compress&cs=tinysrgb&w=700" alt="White vases and paper forms arranged against a deep blue cloth" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A1526] from-[42%] via-[#0A1526]/70 via-[54%] to-transparent to-[70%]" />
        <div className="absolute inset-[8px] border border-[#F1ECE2]/25" />
        <div className="absolute inset-x-[19px] top-[18px] flex justify-between text-[5.5px] font-semibold uppercase tracking-[0.24em] text-[#F1ECE2]/80" style={{ fontFamily: SANS }}>
          <span>Ostra Ceramics</span><span>Collection &nbsp; Studio &nbsp; Visit</span>
        </div>
        <div className="absolute bottom-[20px] left-[19px] w-[41%]">
          <div className="text-[21px] italic leading-[1.04] tracking-[-0.015em]">Thrown, glazed and fired by hand.</div>
          <div className="mt-[9px] inline-block border-b border-[#F1ECE2]/70 pb-[1.5px] text-[6.5px] font-medium" style={{ fontFamily: SANS }}>See the autumn collection</div>
        </div>
      </div>
    ),
  },
  {
    name: "Slip",
    note: "Clay red and custard, round shapes, typewriter labels",
    cloth: "#3F7FD9",
    foil: "#F6F4EF",
    ribbon: "#F6F4EF",
    spread: (
      <div className="flex h-full w-full" style={{ fontFamily: MONO }}>
        <div className="relative flex w-1/2 flex-col bg-[#C24E2C] p-[13px] text-[#FBEBD2]">
          <div className="text-[5.5px] uppercase tracking-[0.14em]">(studio + shop)</div>
          <div className="mt-[10px] text-[54px] font-black leading-[0.8] tracking-[-0.07em]" style={{ fontFamily: SANS }}>os<br />tra</div>
          <div className="mt-auto flex items-center gap-[7px]">
            <span className="inline-flex h-[18px] items-center rounded-full bg-[#FBEBD2] px-[10px] text-[6px] font-bold uppercase tracking-[0.06em] text-[#7A2A12]">Join a class</span>
            <span className="h-[18px] w-[18px] rounded-full bg-[#F2B93B]" />
          </div>
        </div>
        <div className="flex w-1/2 flex-col bg-[#F3E4C3] p-[13px] pl-[15px] text-[#3A1D10]">
          <Photo className="mx-auto h-[112px] w-[112px] shrink-0 rounded-full" tone="#C9A27F" focus="50% 40%" src="https://images.pexels.com/photos/20362430/pexels-photo-20362430.jpeg?auto=compress&cs=tinysrgb&w=700" alt="Two clay-covered hands shaping a small pot on a spinning wheel" />
          <div className="mt-auto text-[6px] uppercase tracking-[0.06em]">
            {[["Wheel night", "Thu"], ["Glaze day", "Sat"], ["Open shelf", "Sun"]].map(([a, b]) => (
              <div key={a} className="flex justify-between border-t border-dashed border-[#3A1D10]/45 py-[5px]"><span>{a}</span><span>{b}</span></div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
];

// The visible half of a spread: `side` picks the left or the right page of the same drawing.
function Page({ side, children }: { side: "left" | "right"; children: ReactNode }) {
  const left = side === "left";
  return (
    <div className="absolute overflow-hidden bg-[#F3EFE6]" style={{ top: 6, height: DH, width: DW / 2, left: left ? EDGE : 0, borderRadius: left ? "2px 0 0 2px" : "0 2px 2px 0" }}>
      <div className="absolute top-0 h-full" style={{ width: DW, left: left ? 0 : -DW / 2 }}>{children}</div>
      {/* the page swells up from the fore-edge and dives into the gutter */}
      <div className="pointer-events-none absolute inset-0" style={{ background: left ? "linear-gradient(90deg, rgba(0,0,0,0.1) 0%, rgba(255,255,255,0) 7%, rgba(255,255,255,0) 52%, rgba(255,255,255,0.2) 76%, rgba(0,0,0,0.05) 88%, rgba(0,0,0,0.42) 100%)" : "linear-gradient(270deg, rgba(0,0,0,0.1) 0%, rgba(255,255,255,0) 7%, rgba(255,255,255,0) 52%, rgba(255,255,255,0.2) 76%, rgba(0,0,0,0.05) 88%, rgba(0,0,0,0.42) 100%)" }} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.22] mix-blend-multiply" style={{ backgroundImage: GRAIN }} />
    </div>
  );
}

// One cloth-covered board seen from the inside, with the block of page edges along its outer side.
function Board({ side, cloth, children }: { side: "left" | "right"; cloth: string; children: ReactNode }) {
  const left = side === "left";
  return (
    <div className="absolute inset-0" style={{ backgroundColor: cloth, backgroundImage: `${WEAVE}, ${GRAIN}`, borderRadius: left ? "4px 0 0 4px" : "0 4px 4px 0", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.14), inset 0 1px 0 rgba(255,255,255,0.3)" }}>
      <div className="absolute" style={{ top: 5, height: DH + 2, width: 6, left: left ? 4 : undefined, right: left ? undefined : 4, backgroundImage: "repeating-linear-gradient(90deg, #F6F2E9 0px, #F6F2E9 1px, #B5AE9E 1px, #B5AE9E 2px)", borderRadius: 1 }} />
      {children}
    </div>
  );
}

// The front edge of a board and its pages, which the camera sees because it looks down the table at an angle.
function Lip({ cloth, deep }: { cloth: string; deep: number }) {
  return (
    <div className="absolute left-0 w-full" style={{ top: BH - 1, height: deep, borderRadius: "0 0 3px 3px", background: `linear-gradient(180deg, rgba(0,0,0,0.1), rgba(0,0,0,0.38)), ${PAGES}`, boxShadow: `inset 0 -2.5px 0 ${cloth}, inset 0 -3.5px 0 rgba(0,0,0,0.35), inset 3px 0 0 ${cloth}, inset -3px 0 0 ${cloth}` }} />
  );
}

function Book({ book, index, closed, lifted, reduce, flat, onPick }: { book: (typeof books)[number]; index: number; closed: boolean; lifted: boolean; reduce: boolean; flat: boolean; onPick: () => void }) {
  const target = useMotionValue(closed ? 1 : 0);
  const fold = useSpring(target, { stiffness: 62, damping: 13.5, mass: 1 });
  const lift = useSpring(0, { stiffness: 140, damping: 16 });
  useEffect(() => {
    target.set(closed ? 1 : 0);
    if (reduce) fold.jump(closed ? 1 : 0);
  }, [closed, reduce, fold, target]);
  useEffect(() => {
    if (reduce) lift.jump(lifted ? 1 : 0);
    else lift.set(lifted ? 1 : 0);
  }, [lifted, reduce, lift]);

  const rot = useTransform(fold, (v) => v * 180);
  const innerShade = useTransform(fold, (v) => Math.sin(Math.min(Math.max(v, 0), 0.5) * Math.PI) * 0.5);
  const outerShade = useTransform(fold, (v) => Math.max(0, Math.sin(Math.min(Math.max(v, 0.5), 1) * Math.PI)) * 0.55);
  const shiftX = useTransform(fold, (v) => -v * (HALF / 2)); // a closed book is half as wide, so it slides back to its own centre
  const z = useTransform(lift, (v) => v * 22);
  const scale = useTransform(lift, (v) => 1 + v * 0.035);
  const shadow = useTransform(lift, (v) => `${14 + v * 16}px ${20 + v * 26}px ${30 + v * 30}px -${10 + v * 4}px rgba(66,48,20,${0.4 - v * 0.08}), 3px 5px 8px rgba(66,48,20,0.22)`);
  const leafShadow = useTransform(fold, (v) => `${14 * (1 - v)}px ${20 * (1 - v)}px ${30 * (1 - v)}px -10px rgba(66,48,20,${0.4 * (1 - v)}), 3px 5px 8px rgba(66,48,20,${0.22 * (1 - v)})`);
  const stamp = { color: book.foil, textShadow: book.foil === "#1B1D22" ? "0 1px 0 rgba(255,255,255,0.35)" : "0 -1px 0 rgba(0,0,0,0.35), 0 0 6px rgba(255,255,255,0.12)" };

  return (
    <motion.div
      onClick={onPick}
      className="relative shrink-0 cursor-pointer"
      style={{ width: HALF * 2, height: BH + THICK, transformStyle: "preserve-3d", x: shiftX, z: flat ? 0 : z, scale, rotate: flat ? 0 : [-1.6, 0.5, 1.9][index % 3] }}
    >
      {/* the back board with the right-hand pages: this half never moves */}
      <motion.div className="absolute" style={{ left: HALF, top: 0, width: HALF, height: BH, boxShadow: shadow, borderRadius: "0 4px 4px 0" }}>
        <Lip cloth={book.cloth} deep={THICK} />
        <Board side="right" cloth={book.cloth}><Page side="right">{book.spread}</Page></Board>
      </motion.div>
      {/* the ribbon marker, sewn in at the head and trailing out of the tail */}
      <div className="absolute" style={{ left: HALF - 4, top: BH - 20, width: 8, height: 58, transform: "translateZ(1px) rotate(4deg)", transformOrigin: "50% 0%", background: `linear-gradient(90deg, rgba(0,0,0,0.28), rgba(255,255,255,0.3) 38%, rgba(0,0,0,0.12) 70%, rgba(0,0,0,0.3)), ${book.ribbon}`, clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 7px), 0 100%)", filter: "drop-shadow(1px 2px 1px rgba(40,30,10,0.35))" }} />
      {/* the front board with the left-hand pages: it swings over on the spine to close the book */}
      <motion.div className="absolute left-0 top-0" style={{ width: HALF, height: BH, transformStyle: "preserve-3d", transformOrigin: `100% 50% ${THICK / 2}px`, rotateY: rot }}>
        <motion.div className="absolute inset-0" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", boxShadow: leafShadow, borderRadius: "4px 0 0 4px" }}>
          <Lip cloth={book.cloth} deep={THICK} />
          <Board side="left" cloth={book.cloth}><Page side="left">{book.spread}</Page></Board>
          <motion.div className="pointer-events-none absolute inset-0 rounded-l-[4px] bg-[#1A1206]" style={{ opacity: innerShade }} />
        </motion.div>
        {/* its outside: bookcloth with a blind-stamped frame and a foil title */}
        <div className="absolute inset-0" style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
          <Lip cloth={book.cloth} deep={THICK} />
          <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: book.cloth, backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.42) 0px, rgba(255,255,255,0.16) 5px, rgba(0,0,0,0.3) 11px, rgba(0,0,0,0) 15px), linear-gradient(135deg, rgba(255,255,255,0.14), rgba(0,0,0,0.12)), ${WEAVE}, ${GRAIN}`, borderRadius: "2px 5px 5px 2px", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.16), inset 0 1px 0 rgba(255,255,255,0.32), 16px 22px 34px -10px rgba(66,48,20,0.42), 3px 5px 8px rgba(66,48,20,0.25)" }}>
            <div className="absolute rounded-[2px]" style={{ inset: "14px 13px 14px 26px", boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.3), inset 0 0 0 2px rgba(255,255,255,0.09)" }} />
            <div className="absolute left-[40px] top-[32px]" style={{ ...stamp, fontFamily: SANS }}>
              <div className="text-[7px] font-bold uppercase tracking-[0.26em] opacity-90">Design no. {index + 1}</div>
              <div className="mt-[7px] text-[31px] font-black leading-[0.9] tracking-[-0.045em]">{book.name}</div>
            </div>
            <div className="absolute bottom-[30px] left-[40px] h-[2px] w-[26px]" style={{ backgroundColor: book.foil, opacity: 0.9 }} />
          </div>
          <motion.div className="pointer-events-none absolute inset-0 rounded-[4px] bg-[#1A1206]" style={{ opacity: outerShade }} />
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ThreeClothBoundSampleBooks() {
  const reduce = !!useReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const [chosen, setChosen] = useState<number | null>(null); // null means all three lie open for comparison
  const [width, setWidth] = useState(1100);
  const pausedUntil = useRef(0);
  const step = useRef(0);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Self-running demo: all open, pick one, all open, pick the next.
  useEffect(() => {
    if (reduce) return;
    let seen = true;
    const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; });
    if (rootRef.current) io.observe(rootRef.current);
    const order = [1, null, 0, null, 2, null];
    const id = window.setInterval(() => {
      if (!seen || document.hidden || Date.now() < pausedUntil.current) return;
      setChosen(order[step.current % order.length]);
      step.current += 1;
    }, HOLD);
    return () => { window.clearInterval(id); io.disconnect(); };
  }, [reduce]);

  const pick = (k: number | null) => { pausedUntil.current = Date.now() + 9000; setChosen(k); };

  const onKey = (e: ReactKeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = books.length;
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

  const column = width < 760; // phones: the books lie one above the other, seen from straight overhead
  const gap = column ? 26 : 34;
  const s = column ? Math.min(1.05, (width - 40) / (HALF * 2)) : Math.min(1.02, (width - 96 - gap * 2) / (HALF * 6));
  const tableW = column ? HALF * 2 : HALF * 6 + gap * 2;
  const SLIP = 78; // room at the head of the table for the typed brief
  const tableH = SLIP + (column ? (BH + THICK) * 3 + gap * 2 + 40 : BH + THICK + 40);
  const tilt = column ? 0 : 27;
  const stageH = Math.round(tableH * s * (column ? 1 : 0.93) + (column ? 50 : 150));

  return (
    <section ref={rootRef} className="relative w-full overflow-hidden bg-[#F6F4EF] text-[#0B0D12]" style={{ fontFamily: SANS, backgroundImage: "radial-gradient(90% 80% at 50% 38%, #FFFFFF 0%, #F6F4EF 46%, #E7E2D8 100%)" }}>
      <h2 className="sr-only">Three sample books, each holding a different design of the same website</h2>
      <div className="relative mx-auto w-full" style={{ height: stageH, perspective: 1800, perspectiveOrigin: "50% 0%" }} role="img" aria-label={chosen === null ? "A typed brief pinned above three cloth-bound sample books that lie open side by side. Each spread is a different design of a ceramics studio website." : `Three cloth-bound sample books. The ${books[chosen].name} design lies open and the other two books are closed.`}>
        <div className="absolute left-1/2" style={{ top: column ? 26 : 56, width: tableW, height: tableH, marginLeft: -tableW / 2, transformStyle: "preserve-3d", transformOrigin: "50% 0%", transform: `scale3d(${s}, ${s}, ${s}) rotateX(${tilt}deg)` }}>
          {/* the brief: one typed sentence on a slip of paper, held by a blue pin */}
          <div className="absolute left-1/2 top-[6px] w-[300px] -translate-x-1/2 -rotate-[1.5deg] rounded-[1px] bg-[#FFFDF8] px-[16px] py-[11px] text-center text-[9.5px] font-medium leading-[1.5] text-[#0B0D12]/85 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,6px_10px_16px_-6px_rgba(66,48,20,0.35),1px_2px_3px_rgba(66,48,20,0.18)]" style={{ fontFamily: MONO }}>
            <span aria-hidden="true" className="absolute left-1/2 top-[-6px] h-[12px] w-[12px] -translate-x-1/2 rounded-full" style={{ background: `radial-gradient(circle at 35% 30%, #CFE3FF 0%, ${BLUE} 42%, #1F4F9E 100%)`, boxShadow: "2px 4px 4px rgba(40,30,10,0.4)" }} />
            {sentence}
          </div>
          <div className={`flex ${column ? "flex-col" : "flex-row"} items-start justify-center`} style={{ gap, transformStyle: "preserve-3d", paddingTop: SLIP }}>
            {books.map((b, i) => (
              <Book key={b.name} book={b} index={i} closed={chosen !== null && chosen !== i} lifted={chosen === i} reduce={reduce} flat={column} onPick={() => pick(i)} />
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[720px] flex-col items-center gap-[13px] px-[16px] pb-[34px]">
        <div className="flex flex-wrap items-center justify-center gap-[8px]">
          <div role="radiogroup" aria-label="Choose a design" className="flex items-center gap-[4px] rounded-full bg-white/75 p-[5px] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_30px_-12px_rgba(60,45,20,0.35),0_0_0_1px_rgba(11,13,18,0.06)]">
            {books.map((b, i) => (
              <button
                key={b.name}
                type="button"
                role="radio"
                aria-checked={chosen === i}
                tabIndex={chosen === i || (chosen === null && i === 0) ? 0 : -1}
                onClick={() => pick(i)}
                onKeyDown={(e) => onKey(e, i)}
                className={`flex h-[40px] items-center gap-[8px] rounded-full px-[15px] text-[13px] font-bold tracking-[-0.01em] transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F98FB] focus-visible:ring-offset-2 motion-reduce:transition-none ${chosen === i ? "bg-[#0B0D12] text-white" : "text-[#0B0D12]/70 hover:text-[#0B0D12]"}`}
              >
                <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full transition-colors duration-300 motion-reduce:transition-none" style={{ backgroundColor: chosen === i ? BLUE : "rgba(11,13,18,0.22)" }} />
                {b.name}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => pick(null)} aria-pressed={chosen === null} className={`h-[40px] rounded-full px-[16px] text-[13px] font-bold tracking-[-0.01em] transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F98FB] focus-visible:ring-offset-2 motion-reduce:transition-none ${chosen === null ? "bg-[#0B0D12]/[0.08] text-[#0B0D12]" : "text-[#0B0D12]/70 hover:text-[#0B0D12]"}`}>
            Open all three
          </button>
        </div>
        <p aria-live="polite" className="text-center text-[12px] font-semibold tracking-[-0.005em] text-[#0B0D12]/65">{chosen === null ? "Three designs of the same site, open for comparison" : books[chosen].note}</p>
      </div>
    </section>
  );
}
