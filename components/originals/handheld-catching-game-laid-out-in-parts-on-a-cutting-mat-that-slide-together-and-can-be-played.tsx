import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

const sentence = "A catching game for my bakery: loaves fall, the baker saves them.";
const gameName = "Loaf Catch";
const TICK = 250; // milliseconds per half step; loaves fall one row every two
const MISSES = 3; // dropped loaves before the game starts over
const BLUE = "#4F98FB";
const W = 600, H = 640; // drawing size; the whole piece is scaled to fit its container
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';

// Where each part rests when the handheld is taken apart, as an offset from its fitted position.
const LAID = {
  body: { x: 0, y: 164, r: 0 },
  bezel: { x: -134, y: -192, r: -2 },
  glass: { x: 146, y: -178, r: 1.5 },
  left: { x: 139, y: -76, r: -14 },
  right: { x: -139, y: -76, r: 12 },
};
const screws = [{ x: 38, y: 198, lx: 286, ly: 262 }, { x: 548, y: 198, lx: 306, ly: 262 }, { x: 38, y: 428, lx: 286, ly: 290 }, { x: 548, y: 428, lx: 306, ly: 290 }];

const LANES = [58, 116, 174], ROWS_Y = [40, 58, 76, 94];
const DIGITS = ["abcdef", "bc", "abged", "abgcd", "fgbc", "afgcd", "afgedc", "abc", "abcdefg", "abcdfg"];
const SEG: Record<string, [number, number, number, number]> = { a: [1.6, 0, 6.8, 2.3], b: [8, 1.5, 2.3, 6.8], c: [8, 9.8, 2.3, 6.8], d: [1.6, 15.8, 6.8, 2.3], e: [-0.3, 9.8, 2.3, 6.8], f: [-0.3, 1.5, 2.3, 6.8], g: [1.6, 7.9, 6.8, 2.3] };
const INK = "#171c15";

type Loaf = { id: number; lane: number; row: number };
type Game = { baker: number; loaves: Loaf[]; score: number; miss: number; step: number; over: number; caught: number };
const fresh = (): Game => ({ baker: 1, loaves: [{ id: 1, lane: 1, row: 2 }, { id: 2, lane: 2, row: 0 }], score: 12, miss: 0, step: 0, over: 0, caught: 0 });

function Part({ apart, at, lay, delay, z, children, className, style }: { apart: boolean; at: { x: number; y: number }; lay: { x: number; y: number; r: number }; delay: [number, number]; z: number; children?: ReactNode; className?: string; style?: CSSProperties }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={false}
      animate={apart ? { x: lay.x, y: lay.y, rotate: lay.r } : { x: 0, y: 0, rotate: 0 }}
      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 150, damping: 19, mass: 1, delay: apart ? delay[0] : delay[1] }}
      style={{ left: at.x, top: at.y, zIndex: z, ...style }}
      className={`absolute ${className || ""}`}
    >
      {children}
    </motion.div>
  );
}

export default function HandheldCatchingGame() {
  const reduce = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [apart, setApart] = useState(false);
  const [power, setPower] = useState<"on" | "test" | "off">("on");
  const [auto, setAuto] = useState(true);
  const [game, setGame] = useState<Game>(fresh);
  const [down, setDown] = useState(0);
  const nextId = useRef(3);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const fit = () => setScale(Math.min(1.15, (el.clientWidth - 24) / W));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Taking it apart cuts the power; fitting it back runs the all-segments test, then the game.
  useEffect(() => {
    if (apart) { setPower("off"); return; }
    if (reduce) { setPower("on"); return; }
    const a = window.setTimeout(() => setPower((p) => (p === "off" ? "test" : p)), 1500);
    const b = window.setTimeout(() => setPower("on"), 2300);
    return () => { window.clearTimeout(a); window.clearTimeout(b); };
  }, [apart, reduce]);

  // The idle demo: play for a while, lay the parts out, put them back.
  useEffect(() => {
    if (!auto || reduce) return;
    const ids: number[] = [];
    const cycle = () => {
      ids.push(window.setTimeout(() => setApart(true), 6800));
      ids.push(window.setTimeout(() => setApart(false), 9800));
      ids.push(window.setTimeout(cycle, 17000));
    };
    cycle();
    return () => ids.forEach((id) => window.clearTimeout(id));
  }, [auto, reduce]);

  // The game clock. With reduced motion it only runs once somebody has taken the controls.
  const running = power === "on" && !(reduce && auto);
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setGame((g) => {
        if (g.over > 0) return g.over === 1 ? { ...fresh(), score: 0, loaves: [] } : { ...g, over: g.over - 1 };
        let { baker, score, miss, caught } = g;
        const step = g.step + 1;
        if (auto) {
          const low = [...g.loaves].sort((p, q) => q.row - p.row)[0];
          if (low && low.lane !== baker) baker += low.lane > baker ? 1 : -1;
        }
        if (step % 2) return { ...g, baker, step, caught: Math.max(0, caught - 1) };
        const loaves: Loaf[] = [];
        for (const l of g.loaves) {
          if (l.row < ROWS_Y.length - 1) loaves.push({ ...l, row: l.row + 1 });
          else if (l.lane === baker) { score = (score + 1) % 1000; caught = 2; }
          else miss += 1;
        }
        if (step % 6 === 0 && loaves.length < 3) {
          const taken = loaves.filter((l) => l.row < 2).map((l) => l.lane);
          const free = [0, 1, 2].filter((n) => !taken.includes(n));
          loaves.push({ id: nextId.current++, lane: free[Math.floor(Math.random() * free.length)] ?? 1, row: 0 });
        }
        return { baker, loaves, score, miss, step, over: miss >= MISSES ? 8 : 0, caught };
      });
    }, TICK);
    return () => window.clearInterval(id);
  }, [running, auto]);

  const move = useCallback((d: number) => {
    setAuto(false);
    if (apart) { setApart(false); return; }
    setGame((g) => (g.over ? g : { ...g, baker: Math.max(0, Math.min(2, g.baker + d)) }));
  }, [apart]);
  const onKey = (e: ReactKeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault(); move(e.key === "ArrowLeft" ? -1 : 1);
  };

  const test = power === "test", off = power === "off";
  const lit = (on: boolean) => (off ? 0.055 : test || on ? 0.92 : 0.055);
  const blink = game.over > 0 && game.over % 2 === 0;
  const score = String(game.score).padStart(3, "0");
  const lift = apart ? "0 14px 18px -6px rgba(0,0,0,0.75), 0 2px 3px rgba(0,0,0,0.6)" : "0 0 0 rgba(0,0,0,0), 0 0 0 rgba(0,0,0,0)";
  const rubber = (pressed: boolean): CSSProperties => ({ background: "radial-gradient(circle at 36% 26%, #a3ccff 0%, #62a5fc 26%, #4F98FB 52%, #2e72d6 100%)", boxShadow: pressed ? "inset 0 3px 6px rgba(12,44,110,0.6), 0 1px 0 #235bb0, 0 2px 3px rgba(0,0,0,0.4)" : "inset 0 -5px 7px rgba(15,50,120,0.45), inset 0 2px 1px rgba(255,255,255,0.55), 0 2px 0 #2a66c2, 0 4px 0 #2358ad, 0 9px 10px rgba(0,0,0,0.45)", transform: pressed ? "translateY(3px)" : "none" });
  const well = "absolute rounded-full bg-[#101318] shadow-[inset_0_4px_7px_rgba(0,0,0,0.9),0_1px_0_rgba(255,255,255,0.9)]";

  return (
    <div ref={root} style={{ fontFamily: FONT, backgroundImage: "radial-gradient(80% 60% at 50% 42%, rgba(79,152,251,0.10) 0%, rgba(11,13,18,0) 70%), linear-gradient(rgba(79,152,251,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(79,152,251,0.16) 1px, transparent 1px), linear-gradient(rgba(79,152,251,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(79,152,251,0.055) 1px, transparent 1px)", backgroundSize: "100% 100%, 120px 120px, 120px 120px, 24px 24px, 24px 24px", backgroundPosition: "center, center, center, center, center" }} className="flex min-h-[840px] w-full flex-col items-center justify-center overflow-hidden bg-[#0B0D12] px-3 py-8">
      <p className="mb-2 max-w-[440px] text-center text-[17px] font-extrabold leading-6 tracking-[-0.03em] text-[#F6F4EF] sm:text-[19px]">{sentence}</p>

      <div style={{ width: W * scale, height: H * scale }} className="relative">
        <div onKeyDown={onKey} style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "0 0" }} className="absolute left-0 top-0">
          {/* The shell, with the sockets the other parts fit into. */}
          <Part apart={apart} at={{ x: 20, y: 180 }} lay={LAID.body} delay={[0.3, 0]} z={1} className="h-[280px] w-[560px] rounded-[46px] bg-[linear-gradient(172deg,#fefdfb_0%,#f3f0e9_50%,#e3dfd5_100%)] shadow-[inset_0_2px_0_#ffffff,inset_0_-4px_5px_rgba(60,50,30,0.12),0_2px_0_#cdc8bc,0_4px_0_#c0bbae,0_6px_0_#b3aea1,0_8px_0_#a6a195,0_40px_44px_-14px_rgba(0,0,0,0.85),0_12px_12px_-4px_rgba(0,0,0,0.6)]">
            <div className="absolute left-[150px] top-[42px] h-[196px] w-[260px] rounded-[15px] bg-[#12151b] shadow-[inset_0_4px_8px_rgba(0,0,0,0.9),0_1px_0_#ffffff]">
              <div className="absolute inset-[16px] rounded-[4px] border border-[#1d5a3a]/0 bg-[linear-gradient(135deg,#0f2a4d_0%,#0c1f3a_100%)] opacity-80" />
              <div className="absolute left-[30px] top-[30px] h-[3px] w-[90px] bg-[#4F98FB]/40" /><div className="absolute left-[30px] top-[40px] h-[3px] w-[60px] bg-[#4F98FB]/30" />
              <div className="absolute bottom-[26px] right-[30px] h-[26px] w-[52px] rounded-[3px] bg-[#07090d] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]" />
              <div className="absolute bottom-[30px] left-[34px] h-[18px] w-[18px] rounded-full bg-[radial-gradient(circle_at_35%_30%,#d9dde3,#8a909b)]" />
            </div>
            <span className={`${well} left-[33px] top-[138px] h-[84px] w-[84px]`} /><span className={`${well} left-[443px] top-[138px] h-[84px] w-[84px]`} />
            {screws.map((s) => <span key={`${s.x}-${s.y}`} className="absolute h-[14px] w-[14px] rounded-full bg-[#14171c] shadow-[inset_0_2px_3px_rgba(0,0,0,0.9),0_1px_0_#ffffff]" style={{ left: s.x - 20 - 7, top: s.y - 180 - 7 }} />)}
            <span className="absolute left-[34px] top-[46px] text-[15px] font-black uppercase leading-none tracking-[-0.02em] text-[#0B0D12]">{gameName}</span>
            <span className="absolute left-[34px] top-[66px] font-mono text-[8px] font-semibold uppercase tracking-[0.22em] text-[#0B0D12]/55">Pocket game 01</span>
            <span className="absolute left-[34px] top-[236px] w-[82px] text-center font-mono text-[8px] font-semibold uppercase tracking-[0.24em] text-[#0B0D12]/55">Left</span>
            <span className="absolute left-[444px] top-[236px] w-[82px] text-center font-mono text-[8px] font-semibold uppercase tracking-[0.24em] text-[#0B0D12]/55">Right</span>
            <span aria-hidden="true" className="absolute right-[40px] top-[44px] grid grid-cols-5 gap-[5px]">{Array.from({ length: 15 }, (_, i) => <i key={i} className="h-[5px] w-[5px] rounded-full bg-[#0B0D12]/80 shadow-[0_1px_0_#ffffff]" />)}</span>
          </Part>

          {/* Brushed metal bezel with the recess for the display. */}
          <Part apart={apart} at={{ x: 170, y: 222 }} lay={LAID.bezel} delay={[0.2, 0.25]} z={2} style={{ boxShadow: `inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(0,0,0,0.35), 0 1px 0 #6d727b, ${lift}`, backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.10) 0 1px, rgba(0,0,0,0.06) 1px 2px, rgba(255,255,255,0) 2px 3px), linear-gradient(178deg, #f1f3f5 0%, #b4bac2 46%, #dfe3e7 62%, #9ba1aa 100%)" }} className="h-[196px] w-[260px] rounded-[15px] bg-[#c4c9d0] transition-shadow duration-500 motion-reduce:transition-none">
            <div className="absolute inset-[13px] rounded-[7px] bg-[#0a0c10] shadow-[inset_0_3px_6px_rgba(0,0,0,0.95),0_1px_0_rgba(255,255,255,0.85)]" />
          </Part>

          {/* The display: every figure the game can show is printed on it once and switched on or off. */}
          <Part apart={apart} at={{ x: 184, y: 236 }} lay={LAID.glass} delay={[0.1, 0.45]} z={3} style={{ boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.35), ${lift}` }} className="h-[168px] w-[232px] overflow-hidden rounded-[6px] bg-[#c3cabd] transition-shadow duration-500 motion-reduce:transition-none">
            <svg viewBox="0 0 232 168" className="block h-full w-full" role="img" aria-label={off ? "Display off" : `${gameName}. Score ${game.score}. ${game.miss} of ${MISSES} loaves dropped.`}>
              <defs>
                <linearGradient id="handheld-catching-game-lcd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#d3d9cd" /><stop offset="1" stopColor="#b5bdae" /></linearGradient>
                <filter id="handheld-catching-game-lift" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="1.1" dy="1.5" stdDeviation="0.5" floodColor="#2c3327" floodOpacity="0.28" /></filter>
              </defs>
              <rect width="232" height="168" fill="url(#handheld-catching-game-lcd)" />
              <g fill="none" stroke={BLUE} strokeWidth="1.6" strokeLinecap="round" opacity="0.7">
                <path d="M8 28h216M8 161h216" />
                {LANES.map((x) => <path key={x} d={`M${x - 15} 28v5M${x + 15} 28v5`} />)}
              </g>
              <g fill={BLUE} opacity="0.85" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="6.5" fontWeight="700" letterSpacing="1.2">
                <text x="56" y="18">MISS</text><text x="152" y="18">SCORE</text>
              </g>
              <g fill={INK} stroke={INK} filter="url(#handheld-catching-game-lift)" style={{ transition: "opacity 60ms" }}>
                {[0, 1, 2].map((i) => <path key={i} d={`M${11 + i * 14} 9l8 8m0-8l-8 8`} strokeWidth="2.6" strokeLinecap="round" fill="none" opacity={lit(game.miss > i)} />)}
                {[0, 1, 2].map((d) => (
                  <g key={d} transform={`translate(${186 + d * 13.5} 6)`} stroke="none">
                    {Object.keys(SEG).map((k) => <rect key={k} x={SEG[k][0]} y={SEG[k][1]} width={SEG[k][2]} height={SEG[k][3]} rx="0.9" opacity={lit(DIGITS[Number(score[d])].includes(k))} />)}
                  </g>
                ))}
                {LANES.map((x, lane) => ROWS_Y.map((y, row) => (
                  <g key={`${lane}-${row}`} opacity={lit(game.loaves.some((l) => l.lane === lane && l.row === row) && !blink)} stroke="none">
                    <path d={`M${x - 12.5} ${y + 1.5}c0-5.5 5.6-8.6 12.5-8.6s12.5 3.1 12.5 8.6c0 3.4-2.2 5.1-4.4 5.1h-16.2c-2.2 0-4.4-1.7-4.4-5.1z`} />
                    <path d={`M${x - 6} ${y - 4.6}l2.6 6M${x - 0.6} ${y - 5.6}l2.6 6.4M${x + 4.8} ${y - 4.8}l2.6 6`} stroke="#c9cfc3" strokeWidth="1.5" strokeLinecap="round" />
                  </g>
                )))}
                {LANES.map((x, lane) => (
                  <g key={lane} opacity={lit(game.baker === lane && !blink)} stroke="none">
                    <rect x={x - 21} y="110" width="42" height="3.8" rx="1.9" />
                    <path d={`M${x - 8.5} 146L${x - 17} 113.5M${x + 8.5} 146L${x + 17} 113.5`} strokeWidth="3.4" strokeLinecap="round" stroke={INK} fill="none" />
                    <circle cx={x} cy="135" r="6.2" />
                    <path d={`M${x - 6} 129.5v-5.2a3.6 3.6 0 0 1 2.2-6.4a4.4 4.4 0 0 1 7.6 0a3.6 3.6 0 0 1 2.2 6.4v5.2z`} />
                    <path d={`M${x - 8} 143h16l3.2 15.5h-22.4z`} />
                  </g>
                ))}
                {LANES.map((x, lane) => <path key={lane} d={`M${x - 26} 104l-4-5M${x + 26} 104l4-5`} strokeWidth="2" strokeLinecap="round" fill="none" opacity={lit(game.caught > 0 && game.baker === lane)} />)}
              </g>
            </svg>
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(118deg,rgba(255,255,255,0.34)_0%,rgba(255,255,255,0.06)_30%,rgba(255,255,255,0)_46%,rgba(255,255,255,0)_70%,rgba(255,255,255,0.10)_100%)] shadow-[inset_0_2px_5px_rgba(0,0,0,0.3)]" />
          </Part>

          {/* The two rubber buttons. */}
          {([[-1, { x: 57, y: 322 }, LAID.left, "Move the baker left"], [1, { x: 467, y: 322 }, LAID.right, "Move the baker right"]] as const).map(([d, at, lay, label]) => (
            <Part key={d} apart={apart} at={at} lay={lay} delay={[0.06, 0.62]} z={4} className="h-[76px] w-[76px]">
              <button type="button" aria-label={label} onPointerDown={() => setDown(d)} onPointerUp={() => setDown(0)} onPointerLeave={() => setDown(0)} onClick={() => move(d)} style={rubber(down === d)} className="flex h-full w-full items-center justify-center rounded-full outline-none transition-[transform,box-shadow] duration-100 focus-visible:ring-2 focus-visible:ring-[#0B0D12] focus-visible:ring-offset-2 focus-visible:ring-offset-[#4F98FB] motion-reduce:transition-none">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7 drop-shadow-[0_1px_0_rgba(255,255,255,0.35)]" fill="#0B0D12" fillOpacity="0.78"><path d={d < 0 ? "M15.5 5.2v13.6a1 1 0 0 1-1.6.8l-8.6-6.8a1 1 0 0 1 0-1.6l8.6-6.8a1 1 0 0 1 1.6.8z" : "M8.5 5.2v13.6a1 1 0 0 0 1.6.8l8.6-6.8a1 1 0 0 0 0-1.6l-8.6-6.8a1 1 0 0 0-1.6.8z"} /></svg>
              </button>
            </Part>
          ))}

          {/* Four screws, turned in last. */}
          {screws.map((s, i) => (
            <Part key={i} apart={apart} at={{ x: s.x - 7, y: s.y - 7 }} lay={{ x: s.lx - s.x, y: s.ly - s.y, r: -540 }} delay={[i * 0.04, 0.85 + i * 0.07]} z={5} style={{ boxShadow: apart ? "0 3px 4px rgba(0,0,0,0.7)" : "0 0 0 rgba(0,0,0,0)" }} className="h-[14px] w-[14px] rounded-full bg-[radial-gradient(circle_at_35%_28%,#f4f5f7_0%,#a9aeb7_50%,#5d626c_100%)] transition-shadow duration-500 motion-reduce:transition-none">
              <span className="absolute left-1/2 top-1/2 h-[1.6px] w-[8px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#23262c]" /><span className="absolute left-1/2 top-1/2 h-[8px] w-[1.6px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#23262c]" />
            </Part>
          ))}
        </div>
      </div>

      <p aria-live="polite" className="sr-only">{apart ? "The handheld is laid out in parts." : game.over ? `Three loaves dropped. Final score ${game.score}.` : ""}</p>
      <div className="mt-2 flex flex-col items-center gap-3">
        <button type="button" aria-pressed={apart} onClick={() => { setAuto(false); setApart((a) => !a); }} className="flex h-10 items-center gap-2 rounded-full bg-[#F6F4EF] px-5 text-[13px] font-bold tracking-[-0.01em] text-[#0B0D12] shadow-[inset_0_-2px_0_rgba(11,13,18,0.14),0_10px_18px_-8px_rgba(0,0,0,0.8)] outline-none transition-colors duration-200 hover:bg-white focus-visible:ring-2 focus-visible:ring-[#4F98FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0B0D12] motion-reduce:transition-none">
          <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke={BLUE} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d={apart ? "M2.5 8h4M13.5 8h-4M6.5 5.5v5M9.5 5.5v5" : "M6 8H2.5m0 0L4.5 6m-2 2l2 2M10 8h3.5m0 0l-2-2m2 2l-2 2"} /></svg>
          {apart ? "Put it together" : "Take it apart"}
        </button>
        <span className="text-center font-mono text-[10px] font-semibold uppercase leading-4 tracking-[0.18em] text-[#F6F4EF]/60">Tap the blue buttons or use the arrow keys</span>
      </div>
    </div>
  );
}
