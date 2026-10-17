import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";

// What is locked inside, and the three numbers that open it.
const CODE = "VAULT-20";
const OFFER = "20% off your first order";
const SMALL = "One use per basket. Ends Sunday.";
const COMBO = [24, 68, 37];
const MAKER = "Halden & Pryce";
const SWING = 108; // how far the door opens, in degrees
const BODY = 420; // the safe is built at this size and scaled to fit

const STEP = 3.6; // degrees per number on a 100 number dial
const read = (turn: number) => (((Math.round(-turn / STEP) % 100) + 100) % 100);
const BRASS = "conic-gradient(from 205deg, #fff1c2, #c99b3c 9%, #6d4a12 20%, #dcb65c 31%, #fff3cc 42%, #b08430 52%, #5e3f0d 63%, #d5ad52 76%, #f6dc93 88%, #fff1c2)";
const STEEL = "conic-gradient(from 205deg, #ffffff, #aab2bb 9%, #4c545d 20%, #c4cbd2 31%, #ffffff 42%, #98a1aa 52%, #3d444c 63%, #b9c0c8 76%, #e9edf0 88%, #ffffff)";
const ENAMEL = "linear-gradient(150deg, #3d4f5f 0%, #2b3946 34%, #1d2731 70%, #151c24 100%)";

export default function SteelSafePromoReveal() {
  const [turn, setTurn] = useState(-COMBO[2] * STEP);
  const [set, setSet] = useState(3); // how many numbers are in
  const [lever, setLever] = useState(true);
  const [open, setOpen] = useState(true);
  const [mode, setMode] = useState<"none" | "drag" | "snap" | "auto">("none");
  const [copied, setCopied] = useState(false);
  const [scale, setScale] = useState(1);
  const stage = useRef<HTMLDivElement>(null);
  const dial = useRef<HTMLDivElement>(null);
  const turnRef = useRef(turn);
  const drag = useRef({ on: false, last: 0 });
  const timers = useRef<number[]>([]);
  const touched = useRef(false);
  turnRef.current = turn;

  const later = (ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)); };
  const clear = () => { timers.current.forEach((t) => window.clearTimeout(t)); timers.current = []; };

  const lock = useCallback((instant: boolean) => {
    setMode(instant ? "none" : "auto"); setOpen(false); setCopied(false); setSet(0);
    const home = Math.round(turnRef.current / 360) * 360;
    if (instant) { setLever(false); setTurn(home); return; }
    later(620, () => { setLever(false); setTurn(home); });
  }, []);

  // Spin to each number in turn, alternating direction like a real combination lock.
  const enter = useCallback((lead: number) => {
    let at = turnRef.current;
    COMBO.forEach((n, i) => {
      const base = -n * STEP, dir = i % 2 ? -1 : 1;
      let goal = base + Math.round((at - base) / 360) * 360;
      if (dir > 0 && goal < at + 30) goal += 360;
      if (dir < 0 && goal > at - 30) goal -= 360;
      at = goal;
      later(lead + i * 320, () => { setMode("auto"); setTurn(goal); });
      later(lead + i * 320 + 285, () => setSet(i + 1));
    });
  }, []);

  // Three numbers in: the lever drops, the bolts draw back and the door swings.
  useEffect(() => {
    if (set < 3 || open) return;
    setLever(true);
    const id = window.setTimeout(() => setOpen(true), 170);
    return () => window.clearTimeout(id);
  }, [set, open]);

  // Resting on the next number for a moment counts as entering it.
  useEffect(() => {
    if (open || set >= 3 || mode === "auto" || mode === "none" || read(turn) !== COMBO[set]) return;
    const id = window.setTimeout(() => setSet((s) => s + 1), mode === "drag" ? 520 : 380);
    return () => window.clearTimeout(id);
  }, [turn, set, open, mode]);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const fit = () => setScale(Math.min(1.18, el.clientWidth / 590));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Left alone it locks itself, dials the combination and opens, again and again.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cycle = (first: boolean) => {
      if (touched.current) return;
      lock(first);
      enter(first ? 140 : 1300);
      later(first ? 9000 : 10200, () => cycle(false));
    };
    cycle(true);
    return clear;
  }, [lock, enter]);

  const mine = () => { if (!touched.current) { touched.current = true; clear(); } };
  const angleAt = (e: ReactPointerEvent) => { const b = (dial.current as HTMLDivElement).getBoundingClientRect(); return (Math.atan2(e.clientY - (b.top + b.height / 2), e.clientX - (b.left + b.width / 2)) * 180) / Math.PI; };
  const onDown = (e: ReactPointerEvent) => { if (open) return; mine(); drag.current = { on: true, last: angleAt(e) }; e.currentTarget.setPointerCapture(e.pointerId); setMode("drag"); };
  const onMove = (e: ReactPointerEvent) => {
    if (!drag.current.on) return;
    const a = angleAt(e); let d = a - drag.current.last;
    if (d > 180) d -= 360; if (d < -180) d += 360;
    drag.current.last = a; setTurn((t) => t + d);
  };
  const onUp = () => { if (!drag.current.on) return; drag.current.on = false; setMode("snap"); setTurn((t) => Math.round(t / STEP) * STEP); };
  const onKey = (e: ReactKeyboardEvent) => {
    const by = e.key === "ArrowRight" || e.key === "ArrowUp" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -1 : e.key === "PageUp" ? 10 : e.key === "PageDown" ? -10 : 0;
    if (!by || open) return;
    e.preventDefault(); mine(); setMode("snap"); setTurn((t) => Math.round(t / STEP) * STEP - by * STEP);
  };
  const solve = () => { mine(); if (open) { lock(false); return; } setSet(0); enter(60); };
  const copy = () => { mine(); try { void navigator.clipboard?.writeText(CODE).catch(() => undefined); } catch { /* the code is on screen either way */ } setCopied(true); later(1800, () => setCopied(false)); };

  const value = read(turn);
  const spin = mode === "drag" || mode === "none" ? "none" : mode === "snap" ? "transform 130ms cubic-bezier(.2,.8,.3,1.2)" : "transform 285ms cubic-bezier(.45,.05,.2,1)";
  const still = mode === "none";

  return (
    <div className="flex min-h-[620px] w-full flex-col items-center justify-center overflow-hidden bg-[#c98a6e] bg-[radial-gradient(85%_70%_at_42%_28%,#e0a98e_0%,#c98a6e_52%,#a96c53_100%)] px-4 py-12 sm:min-h-[790px]">
      <style>{`
        @keyframes steel-safe-promo-code-reveal-lens { 0%, 100% { filter: brightness(1) } 50% { filter: brightness(1.35) } }
        .steel-safe-promo-code-reveal-lit { animation: steel-safe-promo-code-reveal-lens 1.6s ease-in-out infinite }
        @media (prefers-reduced-motion: reduce) { .steel-safe-promo-code-reveal-move { transition: none !important } .steel-safe-promo-code-reveal-lit { animation: none } }
      `}</style>
      <div ref={stage} className="w-full max-w-[700px]">
        <div className="relative mx-auto" style={{ width: BODY * scale, height: (BODY + 18) * scale }}>
          <div className="steel-safe-promo-code-reveal-move absolute left-0 top-0 origin-top-left" style={{ width: BODY, height: BODY + 18, transform: `translateX(${open ? 78 * scale : 0}px) scale(${scale})`, transition: still ? "none" : "transform 800ms cubic-bezier(.3,.9,.3,1)" }}>
            {/* Shadow on the floor and the two feet. */}
            <div aria-hidden="true" className="absolute -bottom-5 left-[-6%] h-14 w-[118%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(40,14,4,.55),rgba(40,14,4,.22)_55%,rgba(40,14,4,0))]" />
            <div aria-hidden="true" className="absolute bottom-0 left-[46px] h-[20px] w-[70px] rounded-b-md bg-[linear-gradient(#0d1116,#1b222a)]" />
            <div aria-hidden="true" className="absolute bottom-0 right-[46px] h-[20px] w-[70px] rounded-b-md bg-[linear-gradient(#0d1116,#1b222a)]" />

            {/* The cabinet. */}
            <div className="absolute left-0 top-0 rounded-[26px] shadow-[inset_0_1.5px_0_rgba(255,255,255,.32),inset_0_-3px_4px_rgba(0,0,0,.5),inset_2px_0_2px_rgba(255,255,255,.08),0_30px_50px_-18px_rgba(40,14,4,.7)]" style={{ width: BODY, height: BODY, background: ENAMEL, perspective: 1500, perspectiveOrigin: "50% 42%" }}>
              <div aria-hidden="true" className="absolute inset-0 rounded-[26px] bg-[radial-gradient(120%_60%_at_30%_0%,rgba(255,255,255,.16),rgba(255,255,255,0)_60%)]" />
              {/* Inside. */}
              <div aria-hidden={!open} className="absolute left-[30px] top-[30px] h-[360px] w-[360px] overflow-hidden rounded-[8px] bg-[#070a0d] shadow-[0_0_0_2px_#0a0d11,0_1px_0_3px_rgba(255,255,255,.1)]">
                <div className="absolute inset-0 bg-[#24493d]" />
                <div className="absolute inset-0" style={{ clipPath: "polygon(0 0,100% 0,calc(100% - 44px) 44px,44px 44px)", background: "linear-gradient(#0b1512,#10221c)" }} />
                <div className="absolute inset-0" style={{ clipPath: "polygon(0 0,44px 44px,44px calc(100% - 44px),0 100%)", background: "linear-gradient(90deg,#0c1814,#16302a)" }} />
                <div className="absolute inset-0" style={{ clipPath: "polygon(100% 0,100% 100%,calc(100% - 44px) calc(100% - 44px),calc(100% - 44px) 44px)", background: "linear-gradient(270deg,#11241f,#1c3a32)" }} />
                <div className="absolute inset-0" style={{ clipPath: "polygon(0 100%,44px calc(100% - 44px),calc(100% - 44px) calc(100% - 44px),100% 100%)", background: "linear-gradient(0deg,#1a352d,#2a5648)" }} />
                <div className="steel-safe-promo-code-reveal-move absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_8%,rgba(255,226,170,.72),rgba(255,226,170,.16)_55%,rgba(255,226,170,0)_80%)]" style={{ opacity: open ? 1 : 0, transition: still ? "none" : "opacity 500ms ease-out 200ms" }} />
                {/* Top shelf with banded bundles of invented notes. */}
                <div className="absolute left-[44px] right-[44px] top-[150px] h-[5px] bg-[linear-gradient(#dfe4e8,#7b848d)] shadow-[0_10px_14px_rgba(0,0,0,.5)]" />
                <div className="absolute left-0 right-0 top-[153px] h-[9px] bg-[linear-gradient(#f4f6f8,#aab2ba_30%,#5d666f)] shadow-[0_3px_5px_rgba(0,0,0,.5)]" style={{ clipPath: "polygon(0 100%,44px 0,calc(100% - 44px) 0,100% 100%)" }} />
                {[0, 1, 2, 3, 4].map((b) => (
                  <div key={b} className="absolute h-[19px] w-[104px] rounded-[1.5px] shadow-[0_1px_0_rgba(0,0,0,.45)]" style={{ left: b < 3 ? 70 + (b % 2) * 3 : 190 + (b % 2) * 4, top: 131 - (b < 3 ? b : b - 3) * 20, background: "repeating-linear-gradient(0deg,#a9c9b4 0 1px,#dcebdd 1px 2.4px)" }}>
                    <div className="absolute inset-y-0 left-[38px] w-[26px] bg-[linear-gradient(90deg,#efe6cf,#fbf6e6_40%,#d9cdb0)] shadow-[0_0_2px_rgba(0,0,0,.3)]" />
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,.28),rgba(0,0,0,0)_18%,rgba(255,255,255,.18)_50%,rgba(0,0,0,.2))]" />
                  </div>
                ))}
                {/* The card you came for. */}
                <div className="steel-safe-promo-code-reveal-move absolute bottom-[30px] left-[70px] w-[220px] origin-bottom rounded-[5px] bg-[#f6efdd] p-[7px] shadow-[0_20px_18px_-10px_rgba(0,0,0,.75),0_2px_0_#cfc4a6,inset_0_1px_0_#fff]" style={{ transform: open ? "rotate(-2.5deg) translateY(0)" : "rotate(-2.5deg) translateY(10px)", transition: still ? "none" : "transform 700ms cubic-bezier(.3,1.3,.4,1) 250ms" }}>
                  <div className="rounded-[3px] border border-dashed border-[#7a3f27]/50 px-3.5 pb-3 pt-3">
                    <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-[#7a3f27]">Private sale code</p>
                    <p className="mt-1.5 font-mono text-[32px] font-bold leading-none tracking-[0.03em] text-[#1c1410]">{CODE}</p>
                    <p className="mt-2 text-[13px] font-semibold leading-tight text-[#1c1410]">{OFFER}</p>
                    <p className="mt-0.5 text-[10px] leading-snug text-[#5b4a3c]">{SMALL}</p>
                  </div>
                  <div className="pointer-events-none absolute inset-0 rounded-[5px] bg-[linear-gradient(115deg,rgba(255,255,255,.5),rgba(255,255,255,0)_35%,rgba(120,80,30,.12))]" />
                </div>
                <div className="pointer-events-none absolute inset-0 shadow-[inset_0_14px_26px_rgba(0,0,0,.75),inset_0_0_30px_rgba(0,0,0,.5)]" />
              </div>

              {/* Hinges, fixed to the cabinet. */}
              {[70, 300].map((y) => (
                <div key={y} aria-hidden="true" className="absolute left-[14px] h-[50px] w-[18px] rounded-[5px] shadow-[0_3px_5px_rgba(0,0,0,.6)]" style={{ top: y, background: "linear-gradient(90deg,#20262d,#aeb6be 28%,#f2f4f6 40%,#7c858e 62%,#252b32)" }}>
                  <div className="absolute inset-x-0 top-[16px] h-px bg-black/50" /><div className="absolute inset-x-0 top-[33px] h-px bg-black/50" />
                </div>
              ))}

              {/* The door: a front, a back and the thick edge that carries the bolts. */}
              <div className="steel-safe-promo-code-reveal-move absolute left-[30px] top-[30px] h-[360px] w-[360px]" style={{ transformStyle: "preserve-3d", transformOrigin: "0 50%", transform: `rotateY(${open ? -SWING : 0}deg)`, transition: still ? "none" : open ? "transform 720ms cubic-bezier(.26,1.22,.42,1)" : "transform 600ms cubic-bezier(.55,0,.75,.5)" }}>
                <div className="absolute inset-0 rounded-[8px] shadow-[inset_0_1.5px_0_rgba(255,255,255,.3),inset_1.5px_0_0_rgba(255,255,255,.12),inset_0_-2px_3px_rgba(0,0,0,.6),inset_-2px_0_3px_rgba(0,0,0,.4)]" style={{ background: "linear-gradient(150deg,#445869 0%,#2f3f4d 36%,#202b36 72%,#182029 100%)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", pointerEvents: open ? "none" : "auto" }}>
                  <div aria-hidden="true" className="absolute inset-[14px] rounded-[5px] shadow-[inset_0_1px_0_rgba(0,0,0,.6),inset_1px_0_0_rgba(0,0,0,.4),0_1px_0_rgba(255,255,255,.14),1px_0_0_rgba(255,255,255,.06)]" />
                  <div aria-hidden="true" className="absolute inset-0 rounded-[8px] bg-[radial-gradient(90%_50%_at_25%_0%,rgba(255,255,255,.16),rgba(255,255,255,0)_70%)]" />
                  {/* Maker's plate. */}
                  <div aria-hidden="true" className="absolute left-1/2 top-[26px] flex h-[26px] w-[150px] -translate-x-1/2 items-center justify-center rounded-[3px] shadow-[0_1px_2px_rgba(0,0,0,.7),inset_0_1px_0_rgba(255,255,255,.7)]" style={{ background: "linear-gradient(100deg,#8a6319,#f2d88c 22%,#c79a3b 45%,#f7e3a4 62%,#a87c27 85%,#7a5512)" }}>
                    <span className="absolute left-[5px] h-[4px] w-[4px] rounded-full bg-[#5b3c08] shadow-[inset_0_1px_0_rgba(255,255,255,.5)]" /><span className="absolute right-[5px] h-[4px] w-[4px] rounded-full bg-[#5b3c08] shadow-[inset_0_1px_0_rgba(255,255,255,.5)]" />
                    <span className="font-serif text-[10px] font-bold uppercase tracking-[0.18em] text-[#4a3006] [text-shadow:0_1px_0_rgba(255,245,200,.7)]">{MAKER}</span>
                  </div>
                  {/* Three lenses that light as each number goes in. */}
                  <div aria-hidden="true" className="absolute right-[34px] top-[124px] flex flex-col gap-[14px]">
                    {COMBO.map((n, i) => (
                      <span key={n} className={`steel-safe-promo-code-reveal-move h-[13px] w-[13px] rounded-full shadow-[0_0_0_2.5px_#11161c,0_0_0_3.5px_rgba(255,255,255,.18)] ${set > i ? "steel-safe-promo-code-reveal-lit" : ""}`} style={{ background: set > i ? "radial-gradient(circle at 35% 30%,#f4ffe9,#7fe08a 40%,#1f8f3c)" : "radial-gradient(circle at 35% 30%,#59636d,#1a2027 55%,#0b0f13)", boxShadow: set > i ? "0 0 0 2.5px #11161c,0 0 0 3.5px rgba(255,255,255,.18),0 0 14px 2px rgba(110,230,130,.75)" : undefined, transition: "background 160ms, box-shadow 160ms" }} />
                    ))}
                  </div>
                  {/* The dial. */}
                  <div className="absolute left-[98px] top-[76px] h-[164px] w-[164px]">
                    <div aria-hidden="true" className="absolute -top-[13px] left-1/2 h-0 w-0 -translate-x-1/2 border-x-[7px] border-t-[11px] border-x-transparent border-t-[#f2d88c] drop-shadow-[0_1px_1px_rgba(0,0,0,.8)]" />
                    <div aria-hidden="true" className="absolute inset-0 rounded-full shadow-[0_14px_18px_rgba(0,0,0,.55),0_3px_4px_rgba(0,0,0,.6)]" style={{ background: BRASS }} />
                    <div aria-hidden="true" className="steel-safe-promo-code-reveal-move absolute inset-[7px] rounded-full bg-[#0c0f12] shadow-[inset_0_2px_5px_rgba(0,0,0,.9),0_0_0_1px_rgba(0,0,0,.6)]" style={{ transform: `rotate(${turn}deg)`, transition: spin }}>
                      <svg viewBox="-75 -75 150 150" className="h-full w-full">
                        {Array.from({ length: 100 }, (_, i) => (
                          <line key={i} x1="0" y1={-72} x2="0" y2={i % 10 === 0 ? -61 : i % 5 === 0 ? -64.5 : -67} stroke={i % 10 === 0 ? "#fff" : "#c9ced3"} strokeWidth={i % 10 === 0 ? 1.5 : 0.8} transform={`rotate(${i * STEP})`} />
                        ))}
                        {Array.from({ length: 10 }, (_, i) => (
                          <text key={i} x="0" y={-46.5} textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#f4f1e6" fontFamily="ui-sans-serif, system-ui, sans-serif" transform={`rotate(${i * 36})`}>{i * 10}</text>
                        ))}
                      </svg>
                    </div>
                    <div aria-hidden="true" className="pointer-events-none absolute inset-[7px] rounded-full bg-[linear-gradient(135deg,rgba(255,255,255,.2),rgba(255,255,255,0)_40%,rgba(0,0,0,.25))]" />
                    {/* Knurled knob: the grip turns, the reflections stay with the room. */}
                    <div aria-hidden="true" className="absolute inset-[50px] rounded-full shadow-[0_8px_9px_rgba(0,0,0,.7),0_2px_3px_rgba(0,0,0,.8)]">
                      <div className="steel-safe-promo-code-reveal-move absolute inset-0 rounded-full" style={{ background: "repeating-conic-gradient(#3a3f45 0 3deg,#d9dee3 3deg 6deg)", transform: `rotate(${turn}deg)`, transition: spin }} />
                      <div className="absolute inset-0 rounded-full mix-blend-multiply" style={{ background: STEEL }} />
                      <div className="absolute inset-[7px] rounded-full shadow-[0_0_0_1px_rgba(0,0,0,.5),inset_0_1px_1px_rgba(255,255,255,.9)]" style={{ background: STEEL }} />
                      <div className="steel-safe-promo-code-reveal-move absolute inset-[7px] rounded-full" style={{ transform: `rotate(${turn}deg)`, transition: spin }}>
                        <span className="absolute left-1/2 top-[5px] h-[13px] w-[4px] -translate-x-1/2 rounded-full bg-[#c2452d] shadow-[inset_0_1px_1px_rgba(0,0,0,.5),0_.5px_0_rgba(255,255,255,.7)]" />
                      </div>
                    </div>
                    <div
                      ref={dial}
                      role="slider"
                      tabIndex={open ? -1 : 0}
                      aria-label="Combination dial"
                      aria-valuemin={0}
                      aria-valuemax={99}
                      aria-valuenow={value}
                      aria-valuetext={`${value}. ${set} of 3 numbers entered${set < 3 ? `, next is ${COMBO[set]}` : ""}`}
                      onPointerDown={onDown}
                      onPointerMove={onMove}
                      onPointerUp={onUp}
                      onPointerCancel={onUp}
                      onKeyDown={onKey}
                      className="absolute -inset-2 cursor-grab touch-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#f2d88c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#2b3946] active:cursor-grabbing"
                    />
                  </div>
                  {/* Lever handle. */}
                  <div aria-hidden="true" className="absolute left-[154px] top-[270px] h-[52px] w-[52px]">
                    <div className="absolute inset-0 rounded-full shadow-[0_8px_10px_rgba(0,0,0,.6),0_2px_2px_rgba(0,0,0,.7)]" style={{ background: BRASS }} />
                    <div className="steel-safe-promo-code-reveal-move absolute left-1/2 top-1/2 h-[18px] w-[118px] origin-[9px_50%] -translate-y-1/2 rounded-full shadow-[0_9px_9px_rgba(0,0,0,.55),inset_0_1px_0_rgba(255,255,255,.9),inset_0_-2px_2px_rgba(0,0,0,.45)]" style={{ marginLeft: -9, background: "linear-gradient(#f7f9fa,#c2c9d0 30%,#7d868f 58%,#4a525a 82%,#8f98a1)", transform: `rotate(${lever ? 58 : 0}deg)`, transition: still ? "none" : "transform 210ms cubic-bezier(.4,1.5,.5,1)" }}>
                      <span className="absolute -right-[5px] top-1/2 h-[26px] w-[26px] -translate-y-1/2 rounded-full shadow-[0_5px_6px_rgba(0,0,0,.5)]" style={{ background: "radial-gradient(circle at 34% 28%,#fff,#b9c1c9 38%,#4d555d 82%,#6f7880)" }} />
                    </div>
                    <div className="absolute inset-[15px] rounded-full shadow-[0_1px_2px_rgba(0,0,0,.7),inset_0_1px_0_rgba(255,255,255,.8)]" style={{ background: STEEL }} />
                  </div>
                </div>
                {/* Back of the door. */}
                <div aria-hidden="true" className="absolute inset-0 rounded-[8px]" style={{ background: "linear-gradient(200deg,#55626e,#313c47 55%,#222b34)", transform: "translateZ(-36px) rotateY(180deg)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
                  <div className="absolute inset-[26px] rounded-[4px] shadow-[inset_0_2px_2px_rgba(255,255,255,.3),inset_0_-2px_3px_rgba(0,0,0,.4),0_3px_8px_rgba(0,0,0,.55)]" style={{ background: "linear-gradient(180deg,#8f9aa5,#6a747f 45%,#454e58)" }}>
                    {["left-3 top-3", "right-3 top-3", "left-3 bottom-3", "right-3 bottom-3"].map((p) => <span key={p} className={`absolute ${p} h-[12px] w-[12px] rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff,#7c858e_60%,#2f363d)] shadow-[0_1px_1px_rgba(0,0,0,.6)]`} />)}
                    {[18, 50, 82].map((y) => <div key={y} className="absolute left-0 h-[16px] w-[52%] -translate-y-1/2 bg-[linear-gradient(#f1f3f5,#b4bcc4_35%,#5a636c_80%,#7d868f)] shadow-[0_3px_4px_rgba(0,0,0,.45)]" style={{ top: `${y}%` }} />)}
                    <div className="absolute inset-y-[26px] left-1/2 w-[34px] -translate-x-1/2 rounded-sm bg-[linear-gradient(90deg,#3d454d,#e3e7ea_35%,#8d969f_70%,#3a4148)] shadow-[0_4px_6px_rgba(0,0,0,.5)]" />
                    <div className="absolute left-1/2 top-[44%] h-[70px] w-[70px] -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_5px_8px_rgba(0,0,0,.6)]" style={{ background: STEEL }} />
                    <div className="absolute left-1/2 top-[44%] h-[26px] w-[26px] -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[inset_0_2px_3px_rgba(0,0,0,.7)]" style={{ background: BRASS }} />
                  </div>
                </div>
                {/* The edge, with three bolt ends. */}
                <div aria-hidden="true" className="absolute left-full top-0 h-full w-[36px] origin-left" style={{ transform: "rotateY(90deg)", background: "linear-gradient(90deg,#1d252d,#5f6c78 18%,#8996a2 50%,#56636f 82%,#1b222a)" }}>
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,.28),rgba(255,255,255,0)_30%,rgba(0,0,0,.4))]" />
                  {[18, 50, 82].map((y) => (
                    <span key={y} className="absolute left-1/2 h-[24px] w-[24px] -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_0_2px_rgba(0,0,0,.55),0_2px_3px_rgba(0,0,0,.6)]" style={{ top: `${y}%`, background: STEEL }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-9 flex flex-col items-center gap-4 sm:mt-12">
          <p aria-live="polite" className="text-center font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#3a1a0f]">
            {open ? (
              <>Open <span className="mx-1.5 opacity-50">/</span> your code is {CODE}</>
            ) : (
              <>
                Turn the dial to
                {COMBO.map((n, i) => (
                  <span key={n} className={`ml-2 inline-block rounded px-1.5 py-0.5 ${set > i ? "line-through opacity-60" : set === i ? "bg-[#3a1a0f] text-[#f6dccf]" : ""}`}>{String(n).padStart(2, "0")}</span>
                ))}
              </>
            )}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {open ? (
              <button type="button" onClick={copy} className="h-11 rounded-full bg-[#3a1a0f] px-5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#f6dccf] transition-colors hover:bg-[#1f0d07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3a1a0f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#c98a6e] motion-reduce:transition-none">
                {copied ? "Copied" : "Copy code"}
              </button>
            ) : null}
            <button type="button" onClick={solve} className="h-11 rounded-full border border-[#3a1a0f]/50 px-5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#3a1a0f] transition-colors hover:bg-[#3a1a0f] hover:text-[#f6dccf] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3a1a0f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#c98a6e] motion-reduce:transition-none">
              {open ? "Lock it again" : "Enter the code for me"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
