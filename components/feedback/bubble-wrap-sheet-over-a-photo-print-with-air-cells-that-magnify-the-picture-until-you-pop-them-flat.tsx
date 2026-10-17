import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/** The wrapped print and the words round it. */
const wrap = {
  title: "Packing your print",
  note: "Pop a few while the label prints",
  photo: { src: "https://images.pexels.com/photos/7035194/pexels-photo-7035194.jpeg?auto=compress&cs=tinysrgb&w=1200", alt: "Woman in a coral jacket framing her face with her hands in front of a blue velvet curtain", tone: "#2f66a8" },
};

/** Sound is off. Set to true for a short dry click on every pop. */
const POP_SOUND_ON = false;

const CELL = 40; // diameter of one air cell
const PITCH = 46; // centre to centre along a row
const ROW = 40; // centre to centre between rows
const ROWS = 10;
const EDGE = 15; // film left over round the cells
const LENS = 1.1; // how much a full cell magnifies the picture under it
const MAX_COLS = 14;
const MIN_COLS = 6;

// creased film for a popped cell: a lit noise field, laid over the picture with a blend mode
const creased = `url("data:image/svg+xml,${encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='150' height='150'><filter id='c' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='0.04 0.055' numOctaves='3' seed='4' stitchTiles='stitch'/><feDiffuseLighting surfaceScale='7' diffuseConstant='1' lighting-color='#ffffff'><feDistantLight azimuth='225' elevation='52'/></feDiffuseLighting><feColorMatrix values='1 0 0 0 -0.2  0 1 0 0 -0.2  0 0 1 0 -0.2  0 0 0 1 0'/></filter><rect width='150' height='150' filter='url(#c)'/></svg>",
)}")`;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

type Cell = { i: number; r: number; c: number; x: number; y: number };

function layout(cols: number) {
  const cells: Cell[] = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < cols; c++) cells.push({ i: cells.length, r, c, x: EDGE + c * PITCH + (r % 2 ? PITCH / 2 : 0), y: EDGE + r * ROW });
  return { cells, w: EDGE * 2 + cols * PITCH + PITCH / 2 - (PITCH - CELL), h: EDGE * 2 + (ROWS - 1) * ROW + CELL };
}

/** The order a bored hand would pop them in: always a cell next to the last one, wandering. */
function walk(cells: Cell[], popped: Set<number>, from: number, step: number) {
  let best = -1;
  let score = Infinity;
  const a = cells[from];
  for (const b of cells) {
    if (popped.has(b.i)) continue;
    const d = Math.hypot(a.x - b.x, a.y - b.y) + ((b.i * 37 + step * 53) % 29);
    if (d < score) {
      score = d;
      best = b.i;
    }
  }
  return best;
}
function starter(cells: Cell[], cols: number, sheet: number) {
  const set = new Set<number>();
  let at = Math.min(cells.length - 1, (3 + (sheet % 3)) * cols + Math.floor(cols * 0.62));
  const n = Math.round(cells.length * 0.17);
  for (let k = 0; k < n; k++) {
    set.add(at);
    const next = walk(cells, set, at, k + sheet * 7);
    if (next < 0) break;
    at = next;
  }
  return { set, at };
}

export default function BubbleWrapSheet() {
  const reduce = !!useReducedMotion();
  const holder = useRef<HTMLDivElement>(null);
  const audio = useRef<AudioContext | null>(null);
  const [cols, setCols] = useState(MAX_COLS);
  const [sheet, setSheet] = useState(1);
  const grid = useMemo(() => layout(cols), [cols]);
  const first = useMemo(() => starter(grid.cells, cols, sheet), [grid, cols, sheet]);
  const [popped, setPopped] = useState<Set<number>>(first.set);
  const [focus, setFocus] = useState(0);
  const live = useRef({ popped: first.set, at: first.at, step: 0, touched: false, down: false, hidden: false });

  // a new sheet, or a narrower one on a phone, starts from its own part-popped pattern
  useEffect(() => {
    live.current.popped = first.set;
    live.current.at = first.at;
    live.current.step = 0;
    setPopped(first.set);
  }, [first]);

  useEffect(() => {
    const el = holder.current;
    if (!el) return;
    const measure = () => setCols(clamp(Math.floor((el.clientWidth - 32 - EDGE * 2 - PITCH / 2) / PITCH), MIN_COLS, MAX_COLS));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => (live.current.hidden = !e.isIntersecting));
    io.observe(el);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  const click = useCallback(() => {
    if (!POP_SOUND_ON) return;
    const Ctx = window.AudioContext;
    if (!Ctx) return;
    const ctx = audio.current ?? (audio.current = new Ctx());
    const len = Math.floor(ctx.sampleRate * 0.05);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let k = 0; k < len; k++) d[k] = (Math.random() * 2 - 1) * Math.pow(1 - k / len, 5);
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.value = 0.35;
    src.buffer = buf;
    src.connect(gain).connect(ctx.destination);
    src.start();
  }, []);
  useEffect(() => () => void audio.current?.close(), []);

  const pop = useCallback(
    (i: number) => {
      const s = live.current;
      if (s.popped.has(i)) return;
      const next = new Set(s.popped);
      next.add(i);
      s.popped = next;
      s.at = i;
      setPopped(next);
      click();
    },
    [click],
  );
  const fresh = useCallback(() => setSheet((n) => n + 1), []);

  // idle hand: pops a neighbouring cell every so often until a person joins in
  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => {
      const s = live.current;
      if (s.touched || s.hidden || document.hidden) return;
      s.step += 1;
      const next = walk(grid.cells, s.popped, s.at, s.step + sheet * 7);
      if (next >= 0) pop(next);
    }, 620);
    return () => window.clearInterval(id);
  }, [grid, pop, reduce, sheet]);

  // when every cell is flat the sheet is swapped for a new one
  const total = grid.cells.length;
  const done = popped.size >= total;
  useEffect(() => {
    if (!done) return;
    const id = window.setTimeout(fresh, 1100);
    return () => window.clearTimeout(id);
  }, [done, fresh]);

  useEffect(() => {
    const up = () => (live.current.down = false);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, []);

  const onKey = (e: React.KeyboardEvent, cell: Cell) => {
    const move = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[e.key];
    if (!move) return;
    e.preventDefault();
    const r = clamp(cell.r + move[0], 0, ROWS - 1);
    const c = clamp(cell.c + move[1], 0, cols - 1);
    const to = r * cols + c;
    setFocus(to);
    holder.current?.querySelector<HTMLButtonElement>(`[data-cell="${to}"]`)?.focus();
  };

  const lensSize = `${(grid.w * LENS).toFixed(1)}px ${(grid.h * LENS).toFixed(1)}px`;

  return (
    <section className="relative overflow-hidden bg-[#e7e2d9]">
      <style>{`
        @keyframes bubble-wrap-sheet-pop { 0% { transform: scale(1); } 28% { transform: scale(0.8, 0.84); } 62% { transform: scale(1.03, 0.99); } 100% { transform: scale(0.97); } }
        @keyframes bubble-wrap-sheet-ring { 0% { opacity: 0.9; transform: scale(0.5); } 100% { opacity: 0; transform: scale(1.5); } }
        .bubble-wrap-sheet-flat { animation: bubble-wrap-sheet-pop 260ms cubic-bezier(0.2, 0.9, 0.3, 1) both; }
        .bubble-wrap-sheet-flat::after { content: ""; position: absolute; inset: 0; border-radius: 9999px; border: 2px solid rgba(255,255,255,0.9); opacity: 0; animation: bubble-wrap-sheet-ring 320ms ease-out both; pointer-events: none; }
        @media (prefers-reduced-motion: reduce) { .bubble-wrap-sheet-flat, .bubble-wrap-sheet-flat::after { animation: none; } .bubble-wrap-sheet-flat { transform: scale(0.97); } }
      `}</style>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(70% 62% at 42% 38%, #f6f3ec 0%, #e9e4db 52%, #d3ccc0 100%)" }} />
      <div ref={holder} className="relative mx-auto flex min-h-[640px] w-full max-w-5xl flex-col items-center justify-center px-4 pb-24 pt-14">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.div
            key={`${sheet}-${cols}`}
            initial={reduce ? false : { x: -90, y: -26, rotate: -9, opacity: 0 }}
            animate={{ x: 0, y: 0, rotate: -3, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { x: 150, y: 40, rotate: 7, opacity: 0, transition: { duration: 0.34, ease: [0.5, 0, 0.9, 0.4] } }}
            transition={{ type: "spring", stiffness: 120, damping: 15 }}
            className="relative select-none"
            style={{ width: grid.w, height: grid.h }}
          >
            {/* the print, and its shadow on the table */}
            <div aria-hidden="true" className="absolute bg-black" style={{ inset: "10px -2px -16px 12px", filter: "blur(22px)", opacity: 0.3 }} />
            <div aria-hidden="true" className="absolute bg-black" style={{ inset: "3px 1px -3px 3px", filter: "blur(4px)", opacity: 0.32 }} />
            <div className="absolute overflow-hidden rounded-[2px]" style={{ inset: 5, backgroundColor: wrap.photo.tone }}>
              <img src={wrap.photo.src} alt={wrap.photo.alt} draggable={false} className="absolute max-w-none" style={{ left: -5, top: -5, width: grid.w, height: grid.h, filter: "saturate(0.94)" }} />
            </div>
            {/* the film between the cells: a milky veil, long reflections and a welded edge */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[3px]" style={{ background: "linear-gradient(112deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 16%, rgba(255,255,255,0.22) 27%, rgba(255,255,255,0.04) 36%, rgba(255,255,255,0.06) 58%, rgba(255,255,255,0.24) 70%, rgba(255,255,255,0.04) 80%, rgba(255,255,255,0.14) 100%)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.6), inset 0 0 0 5px rgba(255,255,255,0.14), 0 1px 1px rgba(0,0,0,0.18)" }} />

            <div role="group" aria-label={`Bubble wrap, ${popped.size} of ${total} cells popped`} className="absolute inset-0">
              {grid.cells.map((cell) => {
                const flat = popped.has(cell.i);
                const cx = cell.x + CELL / 2;
                const cy = cell.y + CELL / 2;
                const j = (cell.i * 53) % 7;
                const shape = ["48% 52% 46% 54% / 53% 47% 55% 45%", "53% 47% 52% 48% / 46% 54% 47% 53%", "50% 50% 54% 46% / 52% 48% 50% 50%"][j % 3];
                return (
                  <button
                    key={cell.i}
                    type="button"
                    data-cell={cell.i}
                    tabIndex={cell.i === focus ? 0 : -1}
                    aria-pressed={flat}
                    aria-label={`Row ${cell.r + 1}, cell ${cell.c + 1}, ${flat ? "popped" : "full"}`}
                    onFocus={() => setFocus(cell.i)}
                    onKeyDown={(e) => onKey(e, cell)}
                    onClick={() => {
                      live.current.touched = true;
                      pop(cell.i);
                    }}
                    onPointerDown={(e) => {
                      live.current.touched = true;
                      live.current.down = true;
                      e.currentTarget.releasePointerCapture?.(e.pointerId);
                      pop(cell.i);
                    }}
                    onPointerEnter={() => live.current.down && pop(cell.i)}
                    className="absolute block cursor-pointer touch-none rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                    style={{ left: cell.x, top: cell.y, width: CELL, height: CELL }}
                  >
                    {flat ? (
                      <>
                        <span className="bubble-wrap-sheet-flat absolute inset-[1px] block" style={{ borderRadius: shape, backgroundImage: creased, backgroundSize: "150px 150px", backgroundPosition: `${-(cell.i * 37) % 150}px ${-(cell.i * 61) % 150}px`, mixBlendMode: "soft-light" }} />
                        <span
                          className="bubble-wrap-sheet-flat absolute inset-[1px] block"
                          style={{
                            borderRadius: shape,
                            background: `radial-gradient(circle at ${40 + j * 4}% ${42 + ((j * 5) % 16)}%, rgba(255,255,255,0.4) 0 4%, rgba(255,255,255,0.05) 24%, rgba(255,255,255,0.05) 62%, rgba(255,255,255,0.22) 100%)`,
                            boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,0.55), inset 2px 2.5px 2px rgba(20,30,40,0.22), inset -1.5px -2px 2px rgba(255,255,255,0.4), 0 0.5px 1px rgba(0,0,0,0.26)",
                          }}
                        />
                      </>
                    ) : (
                      <>
                        <span className="absolute inset-0 block rounded-full" style={{ boxShadow: "2px 3.5px 4px rgba(10,20,35,0.24), 0.5px 1px 1px rgba(10,20,35,0.22)" }} />
                        <span
                          className="absolute inset-0 block rounded-full"
                          style={{ backgroundColor: wrap.photo.tone, backgroundImage: `url(${wrap.photo.src})`, backgroundSize: lensSize, backgroundPosition: `${(-(cx * LENS - CELL / 2)).toFixed(1)}px ${(-(cy * LENS - CELL / 2)).toFixed(1)}px`, filter: "brightness(1.05)" }}
                        />
                        <span
                          className="absolute inset-0 block rounded-full"
                          style={{
                            background:
                              "radial-gradient(ellipse 20% 10% at 36% 25%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.3) 60%, rgba(255,255,255,0) 100%), linear-gradient(140deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.05) 38%, rgba(255,255,255,0) 62%, rgba(255,255,255,0.16) 100%), radial-gradient(ellipse 40% 16% at 64% 84%, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0) 100%)",
                            boxShadow: "0 0 0 1px rgba(255,255,255,0.4), inset 2.5px 3.5px 3px -2px rgba(255,255,255,0.7), inset -3px -4px 5px -2px rgba(10,20,35,0.17), inset 0 0 6px rgba(255,255,255,0.2)",
                          }}
                        />
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-x-4 bottom-5 flex flex-wrap items-end justify-between gap-3 sm:inset-x-8 sm:bottom-8">
          <p className="font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-neutral-600">
            <span className="text-neutral-900">{wrap.title}</span>
            <span className="block">
              Sheet {sheet}, {popped.size} of {total} popped
            </span>
            <span className="hidden sm:block">{wrap.note}</span>
          </p>
          <button
            type="button"
            onClick={() => {
              live.current.touched = true;
              fresh();
            }}
            className="min-h-[44px] rounded-full bg-neutral-900 px-5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white shadow-[0_6px_16px_rgba(0,0,0,0.25)] outline-none transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-neutral-900/40 active:translate-y-0 motion-reduce:transition-none"
          >
            Fresh sheet
          </button>
        </div>
      </div>
    </section>
  );
}
