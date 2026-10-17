import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";

// Each proof is one sheet folded in three. PW and PH are the size of a single fold.
const PW = 300;
const PH = 184;
const PIN = "#4F98FB"; // the pin pushed through the chosen proof, and the dot in the active pill
const HOLD = 3600; // how long the self-running demo leaves a page open, in milliseconds

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.5 0'/></filter><rect width='160' height='160' filter='url(%23n)'/></svg>\")";

function Photo({ src, alt, tone, focus = "50% 50%", className = "" }: { src: string; alt: string; tone: string; focus?: string; className?: string }) {
  return (
    <div className={`overflow-hidden ${className}`} style={{ backgroundColor: tone }}>
      <img src={src} alt={alt} draggable={false} className="h-full w-full object-cover" style={{ objectPosition: focus }} />
    </div>
  );
}

// The three designs for one invented florist. Every design is three folds: top, middle, bottom.
const designs: { name: string; note: string; paper: string; folds: ReactNode[] }[] = [
  {
    name: "Poster",
    note: "Loud colour, one huge line",
    paper: "#F2552C",
    folds: [
      <div key="a" className="relative h-full w-full bg-[#C4621C] text-white">
        <Photo className="absolute inset-0" tone="#C4621C" focus="50% 30%" src="https://images.pexels.com/photos/9956564/pexels-photo-9956564.jpeg?auto=compress&cs=tinysrgb&w=640" alt="A man in profile holding a bouquet against an orange wall" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/25" />
        <div className="absolute inset-x-[12px] top-[10px] flex items-center justify-between text-[6.5px] font-semibold uppercase tracking-[0.14em]">
          <span className="text-[8px] font-black tracking-[0.02em]">HALLOWAY</span>
          <span className="flex gap-[9px]"><span>Shop</span><span>Weddings</span><span>Visit</span></span>
        </div>
        <div className="absolute inset-x-[12px] bottom-[12px]">
          <div className="text-[29px] font-black leading-[0.9] tracking-[-0.045em]">Flowers that<br />show up loud.</div>
          <div className="mt-[8px] inline-flex h-[15px] items-center rounded-full bg-white px-[8px] text-[6.5px] font-bold text-black">Order a bouquet</div>
        </div>
      </div>,
      <div key="b" className="flex h-full w-full gap-[12px] bg-[#F2552C] p-[12px] text-[#170803]">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="text-[6px] font-bold uppercase tracking-[0.18em]">In the buckets this week</div>
          <div className="mt-auto">
            {[["Dahlias", "$38"], ["Ranunculus", "$42"], ["Marigold", "$24"]].map(([n, p]) => (
              <div key={n} className="flex items-baseline justify-between border-t border-[#170803]/40 py-[5px]">
                <span className="text-[19px] font-black leading-none tracking-[-0.04em]">{n}</span>
                <span className="text-[7px] font-bold">{p}</span>
              </div>
            ))}
          </div>
        </div>
        <Photo className="h-full w-[96px] shrink-0 rounded-[48px]" tone="#E23B4E" focus="50% 30%" src="https://images.pexels.com/photos/31686694/pexels-photo-31686694.jpeg?auto=compress&cs=tinysrgb&w=640" alt="A woman in a green dress holding flowers against a red backdrop" />
      </div>,
      <div key="c" className="relative h-full w-full overflow-hidden bg-[#120906] p-[12px] text-[#FFE9DD]">
        <div className="text-[22px] font-black leading-[0.92] tracking-[-0.045em]">Come by<br />the shop.</div>
        <div className="mt-[7px] text-[6.5px] font-medium leading-[1.5] text-[#FFE9DD]/80">14 Wren Street, by the tram stop<br />Tuesday to Sunday, from eight</div>
        <div className="absolute inset-x-[12px] bottom-[34px] flex justify-between border-t border-[#FFE9DD]/25 pt-[5px] text-[6px] font-semibold uppercase tracking-[0.14em] text-[#FFE9DD]/75"><span>Delivery</span><span>Care notes</span><span>Journal</span></div>
        <div className="absolute -bottom-[13px] left-[9px] whitespace-nowrap text-[50px] font-black leading-none tracking-[-0.06em] text-[#F2552C]">HALLOWAY</div>
      </div>,
    ],
  },
  {
    name: "Journal",
    note: "Cream paper, quiet serif",
    paper: "#F3EEE4",
    folds: [
      <div key="a" className="flex h-full w-full flex-col bg-[#F3EEE4] px-[14px] pt-[10px] font-serif text-[#26221C]">
        <div className="flex items-center justify-between font-sans text-[6px] font-medium uppercase tracking-[0.16em] text-[#26221C]/70">
          <span className="font-serif text-[11px] normal-case italic tracking-normal text-[#26221C]">Halloway</span><span className="flex gap-[10px]"><span>Weddings</span><span>Visit us</span></span>
        </div>
        <div className="mt-[10px] flex min-h-0 flex-1 items-end gap-[12px]">
          <div className="flex-1 pb-[14px]">
            <div className="font-sans text-[5.5px] font-semibold uppercase tracking-[0.2em] text-[#8B5E34]">Florist on Wren Street</div>
            <div className="mt-[6px] text-[22px] leading-[1.02] tracking-[-0.02em]">Seasonal stems, <span className="italic">arranged by hand.</span></div>
            <div className="mt-[8px] inline-block border-b border-[#26221C] pb-[1px] font-sans text-[6.5px] font-medium">See this week&rsquo;s bunches</div>
          </div>
          <Photo className="h-full w-[104px] shrink-0 rounded-t-full" tone="#2E9CC4" focus="50% 20%" src="https://images.pexels.com/photos/5254322/pexels-photo-5254322.jpeg?auto=compress&cs=tinysrgb&w=640" alt="A woman with closed eyes holding white carnations against a blue backdrop" />
        </div>
      </div>,
      <div key="b" className="flex h-full w-full flex-col bg-[#F3EEE4] px-[14px] py-[12px] font-serif text-[#26221C]">
        <div className="flex items-baseline justify-between border-b border-[#26221C]/25 pb-[5px]">
          <span className="text-[11px] italic">From the bench</span>
          <span className="font-sans text-[5.5px] font-semibold uppercase tracking-[0.2em] text-[#26221C]/60">No. 12</span>
        </div>
        <div className="mt-[9px] grid min-h-0 flex-1 grid-cols-3 gap-[8px]">
          {[
            { t: "The table bunch", tone: "#8FA7AE", f: "50% 50%", src: "https://images.pexels.com/photos/3148500/pexels-photo-3148500.jpeg?auto=compress&cs=tinysrgb&w=640", alt: "A bouquet of gerberas and chrysanthemums against a grey blue backdrop" },
            { t: "Wedding work", tone: "#D9D9DA", f: "50% 40%", src: "https://images.pexels.com/photos/13697230/pexels-photo-13697230.jpeg?auto=compress&cs=tinysrgb&w=640", alt: "A woman in a pale suit balancing a bouquet against a white wall" },
            { t: "Kept and dried", tone: "#69B5EE", f: "50% 60%", src: "https://images.pexels.com/photos/7698525/pexels-photo-7698525.jpeg?auto=compress&cs=tinysrgb&w=640", alt: "A figure in a pale costume holding a red rose in front of a painted sky" },
          ].map((p) => (
            <div key={p.t} className="flex min-h-0 flex-col">
              <Photo className="min-h-0 flex-1" tone={p.tone} focus={p.f} src={p.src} alt={p.alt} />
              <div className="mt-[4px] text-[7px] italic leading-none">{p.t}</div>
            </div>
          ))}
        </div>
      </div>,
      <div key="c" className="flex h-full w-full flex-col items-center bg-[#F3EEE4] px-[26px] pt-[20px] text-center font-serif text-[#26221C]">
        <div className="text-[13px] leading-[1.28] tracking-[-0.01em]">We buy from growers we know by name, and we write every card <span className="italic">by hand.</span></div>
        <div className="mt-[10px] h-[18px] w-px bg-[#26221C]/40" />
        <div className="mt-[8px] inline-flex h-[17px] items-center rounded-full border border-[#26221C] px-[10px] font-sans text-[6.5px] font-semibold">Reserve a bunch</div>
        <div className="mt-auto flex w-full justify-between border-t border-[#26221C]/25 py-[7px] font-sans text-[5.5px] font-medium uppercase tracking-[0.18em] text-[#26221C]/70"><span>14 Wren Street</span><span>Care notes</span><span>Open from eight</span></div>
      </div>,
    ],
  },
  {
    name: "Midnight",
    note: "Dark room, flowers lit like a still life",
    paper: "#0E0F13",
    folds: [
      <div key="a" className="relative h-full w-full bg-[#0A0A0C] text-[#EFEBE4]">
        <Photo className="absolute inset-y-0 right-0 w-[58%]" tone="#0A0A0C" focus="50% 55%" src="https://images.pexels.com/photos/17498111/pexels-photo-17498111.jpeg?auto=compress&cs=tinysrgb&w=640" alt="Poppies and ranunculus in a glass vase against a black background" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0C] from-[38%] via-[#0A0A0C]/60 via-[56%] to-transparent" />
        <div className="absolute inset-x-[13px] top-[10px] flex items-center justify-between text-[6px] font-medium uppercase tracking-[0.2em] text-[#EFEBE4]/75">
          <span className="text-[#EFEBE4]">Halloway</span><span>Menu</span>
        </div>
        <div className="absolute bottom-[13px] left-[13px] w-[58%]">
          <div className="text-[23px] font-semibold leading-[0.98] tracking-[-0.04em]">Night-cut flowers for long tables.</div>
          <div className="mt-[9px] inline-flex h-[16px] items-center rounded-full border border-[#EFEBE4]/60 px-[9px] text-[6.5px] font-medium">Book a table piece</div>
        </div>
      </div>,
      <div key="b" className="flex h-full w-full flex-col bg-[#0E0F13] px-[13px] py-[12px] text-[#EFEBE4]">
        <div className="text-[5.5px] font-medium uppercase tracking-[0.22em] text-[#EFEBE4]/60">What we make</div>
        <div className="mt-auto">
          {[["01", "Table pieces", "from $64"], ["02", "The Sunday bunch", "from $28"], ["03", "Weddings", "by request"]].map(([n, t, p]) => (
            <div key={n} className="flex items-baseline gap-[10px] border-t border-[#EFEBE4]/15 py-[9px]">
              <span className="text-[6px] font-medium text-[#F3A9C4]">{n}</span>
              <span className="flex-1 text-[15px] font-medium leading-none tracking-[-0.03em]">{t}</span>
              <span className="text-[6.5px] text-[#EFEBE4]/70">{p}</span>
            </div>
          ))}
        </div>
      </div>,
      <div key="c" className="relative h-full w-full bg-[#1A0D12] text-[#EFEBE4]">
        <Photo className="absolute inset-0" tone="#3A1620" focus="50% 22%" src="https://images.pexels.com/photos/25208549/pexels-photo-25208549.jpeg?auto=compress&cs=tinysrgb&w=640" alt="A woman in a red dress holding an orange lily over her face in a smoky studio" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C] via-[#0A0A0C]/35 to-transparent" />
        <div className="absolute inset-x-[13px] bottom-[11px] flex items-end justify-between">
          <div className="text-[17px] font-semibold leading-[1] tracking-[-0.04em]">Open late<br />on Fridays.</div>
          <div className="text-right text-[5.5px] font-medium uppercase leading-[1.7] tracking-[0.18em] text-[#EFEBE4]/75">14 Wren Street<br />Tuesday to Sunday</div>
        </div>
      </div>,
    ],
  },
];

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function Face({ children, crease }: { children: ReactNode; crease?: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[2.5px]" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
      {children}
      <div className="pointer-events-none absolute inset-0 mix-blend-multiply opacity-[0.11]" style={{ backgroundImage: GRAIN }} />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.09] via-transparent to-black/[0.07]" />
      <div className="pointer-events-none absolute inset-0 rounded-[2.5px] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.28)]" />
      {crease ? (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[16px] bg-gradient-to-b from-black/25 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-black/35" />
          <div className="pointer-events-none absolute inset-x-0 top-px h-px bg-white/30" />
        </>
      ) : null}
    </div>
  );
}

function PaperBack() {
  return (
    <div className="absolute inset-0 rounded-[2.5px] bg-[#EFECE4]" style={{ transform: "rotateX(180deg)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
      <div className="absolute inset-0 mix-blend-multiply opacity-40" style={{ backgroundImage: GRAIN }} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/25" />
    </div>
  );
}

type Place = { x: number; y: number; rotate: number; scale: number; z: number };

function Proof({ d, place, open, chosen, flex, reduce, onPick }: { d: (typeof designs)[number]; place: Place; open: boolean; chosen: boolean; flex: MotionValue<number>; reduce: boolean; onPick: () => void }) {
  const pB = useSpring(open ? 1 : 0, { stiffness: 120, damping: 15, mass: 1 });
  const pC = useSpring(open ? 1 : 0, { stiffness: 105, damping: 13, mass: 1 });
  useEffect(() => {
    if (reduce) { pB.jump(open ? 1 : 0); pC.jump(open ? 1 : 0); return; }
    // Opening: the middle fold drops first and the last one peels off it. Closing runs the other way round.
    const first = open ? pB : pC, second = open ? pC : pB;
    first.set(open ? 1 : 0);
    const t = window.setTimeout(() => second.set(open ? 1 : 0), open ? 230 : 190);
    return () => window.clearTimeout(t);
  }, [open, reduce, pB, pC]);

  // A sheet that has been folded never lies quite flat again: the folds rest a few degrees open and flex with the pointer.
  const rotB = useTransform([pB, flex], ([p, f]: number[]) => -179.3 + clamp(p, 0, 1.12) * (170.3 - 4 * f));
  const rotC = useTransform([pC, flex], ([p, f]: number[]) => 178.6 - clamp(p, 0, 1.1) * (163.6 - 7 * f));
  const shadeB = useTransform(rotB, [-179, -90, -12, 0], [0.6, 0.5, 0.12, 0.02]);
  const sheenC = useTransform(rotC, [178, 80, 22, 0], [0, 0.42, 0.02, 0]);
  const shadeC = useTransform(rotC, [178, 100, 30], [0.35, 0.12, 0]);
  const reach = useTransform([pB, pC], ([b, c]: number[]) => 1 + clamp(b, 0, 1) * 0.96 + clamp(c, 0, 1) * 0.94);
  const stack = useTransform(pB, [0, 0.25], [1, 0]);
  const move = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 150, damping: 19, mass: 1 };

  return (
    <motion.div
      className="absolute left-0 top-0"
      style={{ width: PW, height: PH, marginLeft: -PW / 2, zIndex: place.z }}
      initial={false}
      animate={{ x: place.x, y: place.y, rotate: place.rotate, scale: place.scale }}
      transition={move}
    >
      <motion.div
        className={chosen ? "relative h-full w-full" : "relative h-full w-full cursor-pointer"}
        whileHover={chosen || reduce ? undefined : { y: -12, rotate: -1.2 }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
        onClick={chosen ? undefined : onPick}
      >
        {/* Shadow on the table: it stretches as the sheet opens. */}
        <motion.div className="absolute inset-x-[10px] top-[10px] rounded-[6px] bg-[#3A2F1E]/40 blur-[22px]" style={{ height: PH, scaleY: reach, transformOrigin: "50% 0%", y: 22 }} />
        <motion.div className="absolute inset-x-[3px] top-[3px] rounded-[4px] bg-[#2A2114]/45 blur-[5px]" style={{ height: PH, scaleY: reach, transformOrigin: "50% 0%", y: 3 }} />
        {/* The edges of the two folds tucked behind, seen as a thin stack under the top fold. */}
        <motion.div className="absolute inset-x-[1px] rounded-b-[3px]" style={{ top: PH - 1, height: 4, opacity: stack, background: "linear-gradient(#F4F1EA 0 1px,#BDB6A8 1px 1.5px,#F1EEE6 1.5px 2.5px,#B4AD9F 2.5px 3px,#E9E5DC 3px)" }} />

        <div className="absolute inset-0" style={{ perspective: 1150, perspectiveOrigin: `50% ${PH * 1.5}px` }}>
          <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
            <div className="absolute inset-0" style={{ backgroundColor: d.paper }}>
              <Face>{d.folds[0]}</Face>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[10px] bg-gradient-to-t from-black/20 to-transparent" />
            </div>
            <motion.div className="absolute left-0 w-full" style={{ top: PH, height: PH, rotateX: rotB, transformOrigin: "50% 0%", transformStyle: "preserve-3d" }}>
              <PaperBack />
              <Face crease>{d.folds[1]}<motion.div className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: shadeB }} /></Face>
              <motion.div className="absolute left-0 w-full" style={{ top: PH, height: PH, rotateX: rotC, transformOrigin: "50% 0%", transformStyle: "preserve-3d" }}>
                <PaperBack />
                <Face crease>
                  {d.folds[2]}
                  <motion.div className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: shadeC }} />
                  <motion.div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-white to-white/20" style={{ opacity: sheenC }} />
                </Face>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* The pin that marks the choice. */}
        <motion.div
          className="pointer-events-none absolute left-1/2 top-[3px] h-[20px] w-[20px]"
          style={{ marginLeft: -10 }}
          initial={false}
          animate={chosen && open ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -46, scale: 1.5 }}
          transition={reduce ? { duration: 0 } : chosen && open ? { type: "spring", stiffness: 420, damping: 17, delay: 0.75 } : { duration: 0.16 }}
        >
          <span className="absolute left-[7px] top-[9px] h-[17px] w-[17px] rounded-full bg-black/45 blur-[4px]" />
          <span className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle at 34% 28%, #DCEBFF 0%, #8FBFFF 16%, ${PIN} 42%, #2C6FD6 78%, #1B4EA3 100%)`, boxShadow: "inset 0 -2px 3px rgba(8,30,80,0.5), 0 1px 1px rgba(0,0,0,0.35)" }} />
          <span className="absolute left-[5px] top-[3.5px] h-[5px] w-[6px] rounded-full bg-white/90 blur-[0.6px]" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default function ThreeFoldedDesignProofs() {
  const reduce = !!useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const radios = useRef<(HTMLButtonElement | null)[]>([]);
  const [chosen, setChosen] = useState(1);
  const [open, setOpen] = useState(true);
  const [hand, setHand] = useState(false);
  const [width, setWidth] = useState(1280);
  const timers = useRef<number[]>([]);
  const touched = useRef(-1e9);
  const busy = useRef(0); // the demo waits until this moment before it moves again
  const chosenRef = useRef(1);
  const flexRaw = useMotionValue(0);
  const flex = useSpring(flexRaw, { stiffness: 60, damping: 12 });

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // With nobody near, the open page breathes a little, as paper does in moving air.
  const breath = useRef<{ stop: () => void } | null>(null);
  const breathe = () => { breath.current?.stop(); if (!reduce) breath.current = animate(flexRaw, [-0.75, 0.75], { duration: 2.6, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }); };
  useEffect(() => { breathe(); return () => breath.current?.stop(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [reduce]);

  const clear = () => { timers.current.forEach((t) => window.clearTimeout(t)); timers.current = []; };
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };

  // Fold the open page away, bring the next proof to the middle, then open it.
  const show = (i: number, viaHand: boolean) => {
    clear();
    if (reduce) { chosenRef.current = i; setChosen(i); setHand(false); setOpen(true); return; }
    busy.current = performance.now() + (viaHand ? 2250 : 1080) + HOLD;
    setOpen(false);
    if (viaHand) {
      later(() => setHand(true), 760);
      later(() => { chosenRef.current = i; setChosen(i); setHand(false); }, 1750);
      later(() => setOpen(true), 2250);
    } else {
      later(() => { chosenRef.current = i; setChosen(i); setHand(false); }, 620);
      later(() => setOpen(true), 1080);
    }
  };

  // Self-running demo: deals the hand again and picks the next design, until someone takes over.
  useEffect(() => {
    if (reduce) return;
    let seen = true;
    const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; });
    if (stage.current) io.observe(stage.current);
    const tick = window.setInterval(() => {
      const now = performance.now();
      if (!seen || document.hidden || now - touched.current < 9000 || now < busy.current) return;
      show((chosenRef.current + 1) % designs.length, true);
    }, 400);
    busy.current = performance.now() + HOLD + 2600;
    return () => { window.clearInterval(tick); io.disconnect(); clear(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  const pick = (i: number) => {
    touched.current = performance.now();
    if (i === chosenRef.current && !hand) { clear(); setOpen(true); return; }
    show(i, false);
  };
  const onKey = (e: ReactKeyboardEvent, i: number) => {
    const n = designs.length;
    const next = e.key === "ArrowRight" || e.key === "ArrowDown" ? (i + 1) % n : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i + n - 1) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (next < 0) return;
    e.preventDefault(); pick(next); radios.current[next]?.focus();
  };

  const compact = width < 640;
  const s = compact ? Math.min(0.82, (width - 24) / 400) : 1;
  const half = width / 2 / s;
  const sideX = Math.min(392, half - 96);
  const handX = Math.min(236, half - 158);
  const rest = designs.map((_, i) => i).filter((i) => i !== chosen);
  const placeOf = (i: number): Place => {
    if (hand) return { x: (i - 1) * handX, y: 176 + Math.abs(i - 1) * 20, rotate: (i - 1) * 8, scale: 1, z: 2 + i };
    if (i === chosen) return { x: 0, y: 0, rotate: 0, scale: 1, z: 12 };
    const side = rest.indexOf(i) === 0 ? -1 : 1;
    return { x: side * sideX, y: compact ? 318 : 214, rotate: side * (compact ? 13 : 9), scale: compact ? 0.9 : 0.96, z: 2 + i };
  };

  return (
    <div
      ref={stage}
      onPointerMove={(e) => { breath.current?.stop(); breath.current = null; const b = e.currentTarget.getBoundingClientRect(); flexRaw.set(clamp(((e.clientY - b.top) / b.height) * 2 - 1, -1, 1)); }}
      onPointerLeave={breathe}
      className="relative min-h-[620px] w-full select-none overflow-hidden bg-[#F6F4EF] bg-[radial-gradient(90%_70%_at_38%_22%,#FDFCF9_0%,#F6F4EF_45%,#E7E2D7_100%)] text-[#0B0D12] sm:min-h-[800px]"
      style={{ fontFamily: '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif' }}
    >
      <div className="absolute left-1/2 top-[34px] sm:top-[56px]" style={{ transform: `scale(${s})`, transformOrigin: "50% 0%" }} role="img" aria-label={`Three printed proofs of a florist website. The ${designs[chosen].name} design is unfolded into a full page.`}>
        {designs.map((d, i) => (
          <Proof key={d.name} d={d} place={placeOf(i)} open={open && !hand && i === chosen} chosen={!hand && i === chosen} flex={flex} reduce={reduce} onPick={() => pick(i)} />
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-[26px] flex flex-col items-center gap-[14px] px-4 sm:bottom-[44px]">
        <div role="radiogroup" aria-label="Choose a design" className="flex items-center gap-[6px] rounded-full bg-white/70 p-[5px] shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_10px_30px_-12px_rgba(60,45,20,0.35),0_0_0_1px_rgba(11,13,18,0.06)]">
          {designs.map((d, i) => (
            <button
              key={d.name}
              ref={(el) => { radios.current[i] = el; }}
              type="button"
              role="radio"
              aria-checked={chosen === i}
              tabIndex={chosen === i ? 0 : -1}
              onClick={() => pick(i)}
              onKeyDown={(e) => onKey(e, i)}
              className={`flex h-[40px] items-center gap-[8px] rounded-full px-[16px] text-[13px] font-bold tracking-[-0.01em] outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-[#4F98FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6F4EF] motion-reduce:transition-none ${chosen === i ? "bg-[#0B0D12] text-white" : "text-[#0B0D12] hover:bg-[#0B0D12]/[0.06]"}`}
            >
              <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full transition-colors duration-300 motion-reduce:transition-none" style={{ backgroundColor: chosen === i ? PIN : "rgba(11,13,18,0.22)" }} />
              {d.name}
            </button>
          ))}
        </div>
        <p aria-live="polite" className="text-[12px] font-semibold tracking-[-0.005em] text-[#0B0D12]/60">{designs[chosen].note}</p>
      </div>
    </div>
  );
}
