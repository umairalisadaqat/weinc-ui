import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

// The tiles: where each starts (column, row), how many cells it covers and what it is glazed with.
type Glaze = "photo" | "white" | "blue" | "black" | "stone";
const tiles: { id: string; name: string; c: number; r: number; w: number; h: number; glaze: Glaze }[] = [
  { id: "hero", name: "Hero", c: 0, r: 0, w: 2, h: 2, glaze: "photo" },
  { id: "cone", name: "Photo", c: 2, r: 0, w: 1, h: 2, glaze: "photo" },
  { id: "flavours", name: "Flavours", c: 0, r: 2, w: 2, h: 1, glaze: "white" },
  { id: "order", name: "Order", c: 2, r: 2, w: 1, h: 1, glaze: "blue" },
  { id: "hours", name: "Hours", c: 0, r: 3, w: 1, h: 1, glaze: "black" },
  { id: "tubs", name: "Tubs", c: 1, r: 3, w: 2, h: 1, glaze: "stone" },
  { id: "map", name: "Address", c: 1, r: 4, w: 1, h: 1, glaze: "white" },
];
const shop = "Pico Gelato";
const headline = "Gelato, churned at dawn.";
const flavours = ["Pistachio", "Fior di latte", "Blood orange"];
const photos = {
  hero: { bg: "#d8456a", src: "https://images.pexels.com/photos/5535554/pexels-photo-5535554.jpeg?auto=compress&cs=tinysrgb&w=500", at: "50% 40%" },
  cone: { bg: "#e9e4de", src: "https://images.pexels.com/photos/7761650/pexels-photo-7761650.jpeg?auto=compress&cs=tinysrgb&w=400", at: "42% 46%" },
};

const COLS = 3, ROWS = 5, P = 78, G = 4; // grid, cell pitch and the gap between tiles
const BW = G + COLS * P, BH = G + ROWS * P; // the board inside the tray
const RIM = 17, TW = BW + RIM * 2, TH = BH + RIM * 2;
const K = 0.72; // the phone shows the same board at this scale
const HEAD = 26, BEZ = 7, PHW = BW * K + BEZ * 2, PHH = BH * K + HEAD + BEZ * 2;
const W = 16 + TW + 34 + PHW + 16, H = TH + 40;
const TX = 16, TY = 10, PHX = TX + TW + 34, PHY = TY + (TH - PHH) / 2 + 6;
const BLUE = "#4F98FB";
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';
const RX = 31, RZ = -5;
const DIRS = { up: [0, -1], left: [-1, 0], right: [1, 0], down: [0, 1] } as const;
type Dir = keyof typeof DIRS;
type Pos = Record<string, { c: number; r: number }>;
const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const start: Pos = Object.fromEntries(tiles.map((t) => [t.id, { c: t.c, r: t.r }]));
const extrude = (edge: string, n: number, cast: string) => `inset 0 1px 0 rgba(255,255,255,0.75), inset 0 -1px 0 rgba(0,0,0,0.18), ${Array.from({ length: n }, (_, i) => `0 ${i + 1}px 0 ${edge}`).join(", ")}, ${cast}`;
const GLAZE: Record<Glaze, { face: string; edge: string }> = {
  photo: { face: "#F6F4EF", edge: "#b9b4a6" },
  white: { face: "linear-gradient(165deg,#ffffff 0%,#F6F4EF 55%,#e9e5db 100%)", edge: "#b9b4a6" },
  blue: { face: "linear-gradient(165deg,#86b9ff 0%,#4F98FB 50%,#3f86ee 100%)", edge: "#2459b3" },
  black: { face: "linear-gradient(165deg,#3a3f4b 0%,#14171e 40%,#0B0D12 100%)", edge: "#000000" },
  stone: { face: "linear-gradient(165deg,#ebe6da 0%,#d9d3c4 60%,#cbc4b3 100%)", edge: "#9d9684" },
};

// Can this tile move one cell that way without leaving the board or meeting another tile?
function free(pos: Pos, id: string, dir: Dir) {
  const t = tiles.find((x) => x.id === id);
  if (!t) return false;
  const [dc, dr] = DIRS[dir], c = pos[id].c + dc, r = pos[id].r + dr;
  if (c < 0 || r < 0 || c + t.w > COLS || r + t.h > ROWS) return false;
  return tiles.every((o) => o.id === id || c + t.w <= pos[o.id].c || pos[o.id].c + o.w <= c || r + t.h <= pos[o.id].r || pos[o.id].r + o.h <= r);
}
const back: Record<Dir, Dir> = { up: "down", down: "up", left: "right", right: "left" };

// What is printed on each tile. Drawn at tray size; the phone shows the same drawing scaled down.
function Face({ id }: { id: string }): ReactNode {
  if (id === "hero" || id === "cone") {
    const p = photos[id];
    return (
      <span className="absolute inset-0 block" style={{ background: p.bg }}>
        <img src={p.src} alt="" width={id === "hero" ? 152 : 74} height={152} className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: p.at }} />
        {id === "hero" && (
          <>
            <span className="absolute inset-0 bg-[linear-gradient(200deg,rgba(11,13,18,0)_38%,rgba(11,13,18,0.82)_100%)]" />
            <span className="absolute bottom-[11px] left-[11px] w-[118px] text-[19px] font-extrabold leading-[0.98] tracking-[-0.05em] text-white">{headline}</span>
          </>
        )}
      </span>
    );
  }
  if (id === "flavours")
    return (
      <span className="absolute inset-0 flex flex-col justify-between p-[10px]">
        <span className="text-[6.5px] font-bold uppercase tracking-[0.2em] text-[#0B0D12]/70">In the cabinet today</span>
        <span className="flex flex-wrap gap-[4px]">
          {flavours.map((f, i) => <span key={f} className={`rounded-full px-[7px] py-[3px] text-[8px] font-extrabold tracking-[-0.02em] ${i === 0 ? "bg-[#0B0D12] text-[#F6F4EF]" : "text-[#0B0D12] shadow-[inset_0_0_0_1.2px_rgba(11,13,18,0.8)]"}`}>{f}</span>)}
        </span>
      </span>
    );
  if (id === "order")
    return (
      <span className="absolute inset-0 block p-[9px]">
        <span className="block text-[13px] font-extrabold leading-[1] tracking-[-0.045em] text-[#0B0D12]">Order ahead</span>
        <span className="absolute bottom-[8px] right-[8px] flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#0B0D12]">
          <svg viewBox="0 0 20 20" className="h-[11px] w-[11px]" fill="none" stroke={BLUE} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 15L15 5M8 5h7v7" /></svg>
        </span>
      </span>
    );
  if (id === "hours")
    return (
      <span className="absolute inset-0 flex flex-col justify-between p-[9px] text-[#F6F4EF]">
        <span className="flex items-center gap-[4px] text-[6.5px] font-bold uppercase tracking-[0.2em]"><i className="h-[5px] w-[5px] rounded-full bg-[#4F98FB]" />Open</span>
        <span>
          <span className="block text-[15px] font-extrabold leading-[1] tracking-[-0.05em]">11 to 10</span>
          <span className="block text-[7px] font-semibold opacity-75">every day</span>
        </span>
      </span>
    );
  if (id === "tubs")
    return (
      <span className="absolute inset-0 flex items-center justify-between p-[10px]">
        <span>
          <span className="block w-[86px] text-[14px] font-extrabold leading-[1] tracking-[-0.045em] text-[#0B0D12]">Take a tub home</span>
          <span className="mt-[5px] block text-[7px] font-semibold text-[#0B0D12]/75">Half litre or a full one</span>
        </span>
        <svg viewBox="0 0 40 40" className="h-[40px] w-[40px]" aria-hidden="true">
          <path d="M8 15h24l-3 19H11z" fill="#0B0D12" />
          <rect x="5.5" y="9" width="29" height="6" rx="2" fill="#0B0D12" />
          <rect x="13" y="20" width="14" height="8" rx="4" fill={BLUE} />
        </svg>
      </span>
    );
  return (
    <span className="absolute inset-0 flex flex-col justify-between p-[9px]">
      <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" aria-hidden="true"><path d="M10 18s6-5.2 6-9.6A6 6 0 0 0 4 8.4C4 12.800 10 18 10 18z" fill={BLUE} /><circle cx="10" cy="8.3" r="2.2" fill="#0B0D12" /></svg>
      <span className="text-[10.5px] font-extrabold leading-[1.02] tracking-[-0.04em] text-[#0B0D12]">14 Quay Street</span>
    </span>
  );
}

export default function SlidingSectionTray() {
  const reduce = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState<Pos>(start);
  const posRef = useRef(pos);
  posRef.current = pos;
  const [auto, setAuto] = useState(true);
  const [stuck, setStuck] = useState<string | null>(null);
  const [said, setSaid] = useState("Seven tiles, two free cells. Slide a tile and the homepage follows.");
  const drag = useRef<{ id: string; x: number; y: number } | null>(null);
  const swiped = useRef(false);

  useIsoLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const fit = () => setScale(Math.min(1.34, (el.clientWidth - 12) / W));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const slide = (id: string, dir: Dir, quiet = false) => {
    const p = posRef.current;
    if (!free(p, id, dir)) return false;
    const [dc, dr] = DIRS[dir];
    const next = { ...p, [id]: { c: p[id].c + dc, r: p[id].r + dr } };
    posRef.current = next;
    setPos(next);
    if (!quiet) setSaid(`${tiles.find((t) => t.id === id)?.name} tile slid ${dir}. Now in column ${next[id].c + 1}, row ${next[id].r + 1}.`);
    return true;
  };
  const refuse = (id: string) => {
    setSaid(`${tiles.find((t) => t.id === id)?.name} tile is boxed in. Clear a space beside it first.`);
    if (reduce) return;
    setStuck(id);
    window.setTimeout(() => setStuck((s) => (s === id ? null : s)), 320);
  };
  const attempt = (id: string, dir?: Dir) => {
    setAuto(false);
    const d = dir ?? (Object.keys(DIRS) as Dir[]).find((k) => free(posRef.current, id, k));
    if (!d || !slide(id, d)) refuse(id);
  };

  // The self-running demo: hold the finished page, make a few legal moves, then take them back in reverse.
  useEffect(() => {
    if (reduce || !auto) return;
    const done: { id: string; dir: Dir }[] = [];
    let forward = true, rest = 4, seed = 7;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const tick = () => {
      if (rest > 0) { rest--; return; }
      if (forward) {
        const last = done[done.length - 1];
        const options = tiles.flatMap((t) => (Object.keys(DIRS) as Dir[]).filter((d) => free(posRef.current, t.id, d) && !(last && last.id === t.id && back[last.dir] === d)).map((d) => ({ id: t.id, dir: d })));
        const pick = options[Math.floor(rand() * options.length)];
        if (pick && slide(pick.id, pick.dir, true)) done.push(pick);
        if (done.length >= 6) { forward = false; rest = 1; }
      } else {
        const m = done.pop();
        if (m) slide(m.id, back[m.dir], true);
        if (!done.length) { forward = true; rest = 3; }
      }
    };
    const id = window.setInterval(tick, 1150);
    return () => window.clearInterval(id);
  }, [reduce, auto]);

  const onKey = (e: ReactKeyboardEvent<HTMLButtonElement>, id: string) => {
    const d = ({ ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" } as Record<string, Dir | undefined>)[e.key];
    if (!d) return;
    e.preventDefault();
    attempt(id, d);
  };
  const onUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d || e.pointerType === "touch") return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 14) return;
    swiped.current = true;
    attempt(d.id, Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up");
  };

  // The table top leans a little towards the pointer.
  const px = useMotionValue(RZ), py = useMotionValue(RX);
  const rotateZ = useSpring(px, { stiffness: 80, damping: 16 }), rotateX = useSpring(py, { stiffness: 80, damping: 16 });
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType === "touch") return;
    const b = e.currentTarget.getBoundingClientRect();
    px.set(RZ + ((e.clientX - b.left) / b.width - 0.5) * 4);
    py.set(RX - ((e.clientY - b.top) / b.height - 0.5) * 6);
  };
  const spring = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 520, damping: 34, mass: 0.9 };

  return (
    <div ref={root} onPointerMove={onMove} onPointerLeave={() => { px.set(RZ); py.set(RX); }} style={{ fontFamily: FONT }} className="relative flex min-h-[400px] w-full flex-col items-center justify-center gap-1 overflow-hidden bg-[#E4DFD4] bg-[radial-gradient(72%_62%_at_46%_40%,#faf8f2_0%,#E4DFD4_55%,#cbc5b6_100%)] py-6 sm:min-h-[700px]">
      <style>{`@keyframes sliding-block-puzzle-tray-shake { 0%,100% { transform: translateX(0) } 25% { transform: translateX(-3px) } 60% { transform: translateX(3px) } 85% { transform: translateX(-1px) } } @keyframes sliding-block-puzzle-tray-drift { 0% { transform: rotate(-1.6deg) } 100% { transform: rotate(1.6deg) } } .sliding-block-puzzle-tray-drift { animation: sliding-block-puzzle-tray-drift 6s ease-in-out infinite alternate } @media (prefers-reduced-motion: reduce) { .sliding-block-puzzle-tray-drift { animation: none } }`}</style>
      <div style={{ width: W * scale, height: H * scale }} className="relative">
        <div style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "0 0", perspective: 1500 }} className="absolute left-0 top-0">
          <motion.div style={{ rotateX: reduce ? RX : rotateX, rotateZ: reduce ? RZ : rotateZ, transformOrigin: "50% 50%" }} className="absolute inset-0">
            <div className="sliding-block-puzzle-tray-drift absolute inset-0">
            {/* the tray */}
            <div style={{ left: TX, top: TY, width: TW, height: TH, boxShadow: `inset 0 1.5px 0 rgba(255,255,255,0.5), inset 1.5px 0 0 rgba(255,255,255,0.16), ${Array.from({ length: 13 }, (_, i) => `0 ${i + 1}px 0 ${i < 2 ? "#23262f" : "#050608"}`).join(", ")}, 0 34px 34px rgba(60,48,26,0.45), 22px 60px 70px rgba(60,48,26,0.4)` }} className="absolute rounded-[22px] bg-[#14171e] bg-[linear-gradient(160deg,#4a505d_0%,#1d2029_24%,#0B0D12_100%)]">
              <i aria-hidden="true" className="pointer-events-none absolute -left-[10px] top-[30px] h-[60px] w-[340px] -rotate-[24deg] bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(255,255,255,0.16),rgba(255,255,255,0))] blur-[5px]" />
              {/* the floor of the tray */}
              <div style={{ left: RIM, top: RIM, width: BW, height: BH }} className="absolute rounded-[9px] bg-[#1b2030] bg-[radial-gradient(120%_90%_at_50%_100%,#27304a_0%,#1b2030_50%,#131725_100%)] shadow-[inset_0_10px_10px_rgba(0,0,0,0.85),inset_6px_0_8px_rgba(0,0,0,0.5),inset_-6px_0_8px_rgba(0,0,0,0.4),0_1.5px_0_rgba(255,255,255,0.22)]">
                <i aria-hidden="true" className="absolute inset-0 rounded-[9px] opacity-40 [background:radial-gradient(circle,rgba(255,255,255,0.2)_0.5px,rgba(255,255,255,0)_0.9px)_0_0/3px_3px]" />
                {tiles.map((t) => {
                  const g = GLAZE[t.glaze], w = t.w * P - G, h = t.h * P - G;
                  return (
                    <motion.button
                      key={t.id}
                      type="button"
                      initial={false}
                      animate={{ x: G + pos[t.id].c * P, y: G + pos[t.id].r * P - 5 }}
                      transition={spring}
                      onClick={() => { if (swiped.current) { swiped.current = false; return; } attempt(t.id); }}
                      onKeyDown={(e) => onKey(e, t.id)}
                      onPointerDown={(e) => { drag.current = { id: t.id, x: e.clientX, y: e.clientY }; }}
                      onPointerUp={onUp}
                      aria-label={`${t.name} tile, column ${pos[t.id].c + 1}, row ${pos[t.id].r + 1}. Press to slide it into a free space, or use the arrow keys.`}
                      style={{ width: w, height: h }}
                      className="group absolute left-0 top-0 cursor-pointer rounded-[10px] outline-none focus-visible:ring-2 focus-visible:ring-[#4F98FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1b2030]"
                    >
                      <span aria-hidden="true" style={{ background: g.face, boxShadow: extrude(g.edge, 8, "0 14px 9px rgba(0,0,0,0.6)"), animation: stuck === t.id ? "sliding-block-puzzle-tray-shake 0.3s ease-in-out" : undefined }} className="absolute inset-0 block overflow-hidden rounded-[10px] transition-transform duration-150 group-active:translate-y-[2px] motion-reduce:transition-none">
                        <Face id={t.id} />
                        <i className="pointer-events-none absolute inset-0 rounded-[10px] bg-[linear-gradient(128deg,rgba(255,255,255,0.5)_0%,rgba(255,255,255,0.1)_22%,rgba(255,255,255,0)_40%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.7),inset_0_0_0_1px_rgba(255,255,255,0.12)]" />
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* the phone lying beside it, showing the same arrangement as a page */}
            <div aria-hidden="true" style={{ left: PHX, top: PHY, width: PHW, height: PHH, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.45), ${Array.from({ length: 6 }, (_, i) => `0 ${i + 1}px 0 ${i < 1 ? "#3a3f4b" : "#050608"}`).join(", ")}, 0 20px 22px rgba(60,48,26,0.45), 14px 36px 44px rgba(60,48,26,0.35)` }} className="absolute rounded-[24px] bg-[#0B0D12]">
              <span style={{ inset: BEZ }} className="absolute overflow-hidden rounded-[18px] bg-[#fffdf8]">
                <span className="absolute inset-x-0 top-0 flex items-center justify-between px-[11px]" style={{ height: HEAD }}>
                  <span className="text-[10px] font-extrabold tracking-[-0.03em] text-[#0B0D12]">{shop}</span>
                  <span className="flex flex-col gap-[2.5px]"><i className="block h-[1.5px] w-[11px] rounded-full bg-[#0B0D12]" /><i className="block h-[1.5px] w-[11px] rounded-full bg-[#0B0D12]" /></span>
                </span>
                <span style={{ top: HEAD - 2, width: BW, height: BH, transform: `scale(${K})`, transformOrigin: "0 0" }} className="absolute left-0 block">
                  {tiles.map((t) => (
                    <motion.span key={t.id} initial={false} animate={{ x: G + pos[t.id].c * P, y: G + pos[t.id].r * P }} transition={spring} style={{ width: t.w * P - G, height: t.h * P - G, background: GLAZE[t.glaze].face }} className="absolute left-0 top-0 block overflow-hidden rounded-[10px] shadow-[inset_0_0_0_1px_rgba(11,13,18,0.08)]">
                      <Face id={t.id} />
                    </motion.span>
                  ))}
                </span>
                <i className="pointer-events-none absolute inset-0 bg-[linear-gradient(122deg,rgba(255,255,255,0.4)_0%,rgba(255,255,255,0.05)_24%,rgba(255,255,255,0)_38%)]" />
              </span>
            </div>
            </div>
          </motion.div>
        </div>
      </div>
      <p className="relative flex max-w-[92%] items-center justify-center gap-2 text-center text-[12px] font-semibold tracking-[-0.005em] text-[#0B0D12]/85 sm:text-[13.5px]">
        <span aria-hidden="true" className="h-[7px] w-[7px] shrink-0 rounded-full bg-[#4F98FB]" />
        <span aria-live={auto ? "off" : "polite"}>{said}</span>
      </p>
    </div>
  );
}
