import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

const sentence = "A quote calculator for my window cleaning round.";
const kitName = "Window quote";
const RATE = 4; // price per window on the ground floor
const floors = [{ label: "1", name: "one floor", extra: 0 }, { label: "2", name: "two floors", extra: 0.25 }, { label: "3", name: "three floors", extra: 0.5 }];
const BLUE = "#4F98FB";
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';

// Each moulded part: where it sits on the sprue (s) and where it seats in the calculator (t).
const parts = [
  { id: "plate", w: 256, h: 36, s: { x: 37, y: 36 }, t: { x: 22, y: 22 }, tag: 165, row: 6 },
  { id: "minus", w: 62, h: 62, s: { x: 40, y: 130 }, t: { x: 22, y: 180 }, tag: 108, row: 100 },
  { id: "plus", w: 62, h: 62, s: { x: 228, y: 130 }, t: { x: 216, y: 180 }, tag: 296, row: 100 },
  { id: "thumb", w: 82, h: 42, s: { x: 124, y: 140 }, t: { x: 26, y: 272 }, tag: 200, row: 100 },
  { id: "send", w: 256, h: 62, s: { x: 37, y: 252 }, t: { x: 22, y: 330 }, tag: 165, row: 222 },
];
const SPRUE = { w: 330, h: 420 }, TOOL = { w: 300, h: 412 };
const RUNNERS = "M20 6H310A14 14 0 0 1 324 20V400A14 14 0 0 1 310 414H20A14 14 0 0 1 6 400V20A14 14 0 0 1 20 6ZM6 100H324M6 222H324M6 340H324";
const GATES = "M100 8V38M230 8V38M71 100V132M165 100V142M259 100V132M100 222V254M230 222V254M90 340V366M251 340V370M287 340V370";

const PLASTIC = "linear-gradient(180deg,#7cb7ff 0%,#4F98FB 44%,#3d86ec 100%)";
const EDGE = "inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -2px 2px rgba(18,58,140,0.38), 0 1px 0 #2f6fd6, 0 2px 0 #2a64c6, 0 3px 0 #2459b4";
const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[#0B0D12] focus-visible:ring-offset-2 focus-visible:ring-offset-[#4F98FB]";

function Part({ seated, from, at, w, h, order, children, shift }: { seated: boolean; from: { x: number; y: number }; at: { x: number; y: number }; w: number; h: number; order: number; children: ReactNode; shift?: string }) {
  const reduce = useReducedMotion();
  const dx = from.x - at.x, dy = from.y - at.y;
  // The outer element carries the flight (twist on the gate, lift, drop into the socket); the inner one is the plastic and any press or slide.
  return (
    <motion.div
      initial={false}
      animate={seated ? { x: [dx, dx, dx, 0], y: [dy, dy, dy - 18, 0], rotate: [0, -9, 7, 0], scale: [1, 1, 1.08, 1] } : { x: dx, y: dy, rotate: 0, scale: 1 }}
      transition={reduce ? { duration: 0 } : seated ? { duration: 0.95, times: [0, 0.15, 0.32, 1], ease: ["easeInOut", "easeInOut", [0.3, 1.32, 0.5, 1]] } : { type: "spring", stiffness: 190, damping: 24, delay: order * 0.05 }}
      style={{ left: at.x, top: at.y, width: w, height: h, zIndex: seated ? 3 : 5 }}
      className="absolute"
    >
      <div style={{ background: PLASTIC, transform: shift || "none", boxShadow: `${EDGE}, ${seated ? "0 5px 6px rgba(11,13,18,0.3)" : "0 14px 12px -2px rgba(11,13,18,0.22)"}` }} className={`absolute inset-0 transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.3,1.4,0.5,1)] motion-reduce:transition-none ${h === w ? "rounded-full" : h < 45 ? "rounded-[12px]" : "rounded-[18px]"}`}>
        {children}
      </div>
    </motion.div>
  );
}

export default function MouldedKitSprueCalculator() {
  const reduce = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ wide: true, scale: 1 });
  const [seated, setSeated] = useState(parts.length); // how many parts have been snapped in, in order
  const [windows, setWindows] = useState(10);
  const [floor, setFloor] = useState(0);
  const [sent, setSent] = useState(false);
  const [down, setDown] = useState("");
  const [auto, setAuto] = useState(true);
  const [run, setRun] = useState(0);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const measure = () => { const wide = el.clientWidth >= 780; setFit({ wide, scale: wide ? Math.min(1.12, (el.clientWidth - 32) / 710) : Math.min(0.88, (el.clientWidth - 24) / SPRUE.w) }); };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The demo: work out a quote on the finished tool, put the parts back on the sprue, snap them out one by one, repeat.
  useEffect(() => {
    if (reduce || (!auto && run === 0)) return;
    const ids: number[] = [];
    const at = (ms: number, fn: () => void) => ids.push(window.setTimeout(fn, ms));
    const build = (start: number) => {
      at(start, () => { setSeated(0); setSent(false); if (auto) { setWindows(10); setFloor(0); } });
      parts.forEach((_, i) => at(start + 1300 + i * 640, () => setSeated(i + 1)));
      return start + 1300 + parts.length * 640 + 700;
    };
    const press = (ms: number, id: string, fn: () => void) => { at(ms, () => { setDown(id); fn(); }); at(ms + 170, () => setDown("")); };
    const cycle = () => {
      if (!auto) { build(200); return; }
      // Work out a quote on the finished tool first, so the piece opens complete and alive.
      press(800, "plus", () => setWindows((n) => Math.min(40, n + 1)));
      press(1250, "plus", () => setWindows((n) => Math.min(40, n + 1)));
      at(1900, () => setFloor(1));
      press(3900, "send", () => setSent(true));
      at(build(6400), cycle);
    };
    cycle();
    return () => ids.forEach((id) => window.clearTimeout(id));
  }, [auto, run, reduce]);

  const touch = useCallback(() => { setAuto(false); setRun(0); setSeated(parts.length); setDown(""); }, []);
  const ready = seated >= parts.length;
  const total = windows * RATE * (1 + floors[floor].extra);
  const S = fit.wide ? { x: 0, y: 25 } : { x: 0, y: 0 }, T = fit.wide ? { x: 410, y: 29 } : { x: 15, y: 438 };
  const W = fit.wide ? 710 : SPRUE.w, H = fit.wide ? 470 : 850;
  const on = (i: number) => seated > i;
  const from = (i: number) => ({ x: S.x + parts[i].s.x, y: S.y + parts[i].s.y });
  const seat = (i: number) => ({ x: T.x + parts[i].t.x, y: T.y + parts[i].t.y });
  const legend = "text-[#0B0D12] [text-shadow:0_1px_0_rgba(255,255,255,0.28)]";
  const socket = "absolute bg-[#d6d1c6] shadow-[inset_0_3px_5px_rgba(11,13,18,0.32),inset_0_0_0_1px_rgba(11,13,18,0.08),0_1px_0_#ffffff]";
  const printed = "absolute font-mono text-[8.5px] font-semibold uppercase tracking-[0.24em] text-[#0B0D12]/60";

  return (
    <div ref={root} style={{ fontFamily: FONT }} className="relative flex min-h-[760px] w-full flex-col items-center justify-center overflow-hidden bg-[#E6E2D9] bg-[radial-gradient(85%_70%_at_50%_36%,#f4f1ea_0%,#E6E2D9_58%,#d8d3c8_100%)] px-3 pb-20 pt-10">
      <p className="mb-8 max-w-[520px] text-center text-[19px] font-extrabold leading-6 tracking-[-0.035em] text-[#0B0D12] sm:text-[22px] sm:leading-7">{sentence}</p>

      <div style={{ width: W * fit.scale, height: H * fit.scale }} className="relative">
        <div style={{ width: W, height: H, transform: `scale(${fit.scale})`, transformOrigin: "0 0" }} className="absolute left-0 top-0">
          {/* The sprue: frame, runners, gates, number tabs and the kit tag, all one shot of blue plastic. */}
          <div aria-hidden="true" style={{ left: S.x, top: S.y, width: SPRUE.w, height: SPRUE.h }} className="absolute">
            <svg viewBox={`0 0 ${SPRUE.w} ${SPRUE.h}`} className="absolute inset-0 h-full w-full overflow-visible [filter:drop-shadow(0_9px_5px_rgba(11,13,18,0.2))_drop-shadow(0_2px_1px_rgba(11,13,18,0.25))]" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d={GATES} stroke="#2a64c6" strokeWidth="6" /><path d={GATES} stroke={BLUE} strokeWidth="4.4" transform="translate(-0.5 0)" /><path d={GATES} stroke="#a9cfff" strokeWidth="1.2" transform="translate(-1.5 0)" />
              <path d={RUNNERS} stroke="#2459b4" strokeWidth="10" transform="translate(0 0.8)" /><path d={RUNNERS} stroke={BLUE} strokeWidth="8.4" /><path d={RUNNERS} stroke="#74b1ff" strokeWidth="4.6" transform="translate(0 -1.2)" /><path d={RUNNERS} stroke="#c4defF" strokeWidth="1.3" transform="translate(0 -2.5)" />
            </svg>
            {parts.map((p, i) => (
              <span key={p.id} style={{ left: p.tag - 10, top: p.row - 10, background: PLASTIC, boxShadow: `${EDGE}, 0 8px 6px -2px rgba(11,13,18,0.2)` }} className="absolute flex h-[20px] w-[20px] items-center justify-center rounded-full text-[10px] font-black text-[#1f55ad] [text-shadow:0_1px_0_rgba(255,255,255,0.45)]">{i + 1}</span>
            ))}
            <span style={{ left: 37, top: 364, background: PLASTIC, boxShadow: `${EDGE}, 0 10px 8px -2px rgba(11,13,18,0.2)` }} className="absolute flex h-[34px] w-[176px] items-center justify-center rounded-[8px] font-mono text-[9.5px] font-bold uppercase tracking-[0.22em] text-[#1f55ad] [text-shadow:0_1px_0_rgba(255,255,255,0.45)]">Kit 05 / {kitName}</span>
            {[251, 287].map((x) => <span key={x} style={{ left: x - 12, top: 366, background: PLASTIC, boxShadow: `${EDGE}, 0 10px 8px -2px rgba(11,13,18,0.2)` }} className="absolute h-[24px] w-[24px] rounded-full"><i className="absolute inset-[7px] rounded-full bg-[#2f6fd6] shadow-[inset_0_1px_2px_rgba(11,13,18,0.5)]" /></span>)}
          </div>

          {/* The calculator shell, with a socket for every part. */}
          <div style={{ left: T.x, top: T.y, width: TOOL.w, height: TOOL.h }} className="absolute rounded-[34px] bg-[linear-gradient(172deg,#fffefc_0%,#f4f1ea_52%,#e6e2d8_100%)] shadow-[inset_0_2px_0_#ffffff,inset_0_-3px_4px_rgba(60,50,30,0.1),0_2px_0_#cfcabe,0_4px_0_#c2bdb0,0_6px_0_#b5b0a3,0_34px_34px_-14px_rgba(11,13,18,0.45),0_10px_10px_-4px_rgba(11,13,18,0.3)]">
            <span className={`${socket} left-[20px] top-[20px] h-[41px] w-[260px] rounded-[13px]`} />
            <div className="absolute left-[22px] top-[70px] h-[84px] w-[256px] overflow-hidden rounded-[14px] bg-[linear-gradient(180deg,#090b10_0%,#11151d_100%)] shadow-[inset_0_3px_6px_rgba(0,0,0,0.9),0_1px_0_#ffffff]">
              <span className="absolute left-[14px] top-[12px] font-mono text-[9px] font-semibold uppercase tracking-[0.24em] text-[#4F98FB]">{sent ? "Sent" : "Quote"}</span>
              <span className="absolute left-[14px] top-[52px] font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#F6F4EF]/55">{ready ? `${windows} win / ${floors[floor].label} fl` : "No parts"}</span>
              <span aria-live="polite" aria-atomic="true" className={`absolute bottom-[10px] right-[14px] text-[40px] font-extrabold leading-none tracking-[-0.04em] [font-variant-numeric:tabular-nums] transition-opacity duration-300 motion-reduce:transition-none ${ready ? "text-[#F6F4EF] opacity-100 [text-shadow:0_0_14px_rgba(79,152,251,0.55)]" : "text-[#F6F4EF] opacity-20"}`}>
                <span className="sr-only">{sent ? "Quote sent: " : "Quote: "}</span>{ready ? `$${total.toFixed(2)}` : "$--.--"}
              </span>
              <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(118deg,rgba(255,255,255,0.09)_0%,rgba(255,255,255,0.02)_22%,rgba(255,255,255,0)_30%)]" />
            </div>
            <span className={`${printed} left-[24px] top-[164px]`}>Windows</span>
            <span className={`${socket} left-[20px] top-[178px] h-[67px] w-[66px] rounded-full`} /><span className={`${socket} left-[214px] top-[178px] h-[67px] w-[66px] rounded-full`} />
            <span className="absolute left-[96px] top-[180px] flex h-[62px] w-[108px] items-center justify-center rounded-[16px] bg-[#e9e5dc] text-[30px] font-extrabold tracking-[-0.04em] text-[#0B0D12] shadow-[inset_0_2px_3px_rgba(11,13,18,0.16),0_1px_0_#ffffff] [font-variant-numeric:tabular-nums]">{windows}</span>
            <span className={`${printed} left-[24px] top-[252px]`}>Floors</span>
            <div className={`${socket} left-[22px] top-[268px] flex h-[50px] w-[256px] items-center rounded-[16px]`}>
              {floors.map((f) => <span key={f.label} className="flex-1 text-center text-[15px] font-extrabold text-[#0B0D12]/45">{f.label}</span>)}
            </div>
            <span className={`${socket} left-[20px] top-[328px] h-[67px] w-[260px] rounded-[19px]`} />
          </div>

          {/* 1. Name plate */}
          <Part seated={on(0)} from={from(0)} at={seat(0)} w={parts[0].w} h={parts[0].h} order={0}>
            <span className={`flex h-full items-center justify-between px-4 text-[13px] font-black uppercase tracking-[0.02em] ${legend}`}>{kitName}<span className="font-mono text-[8.5px] font-bold tracking-[0.24em] opacity-70">QC-05</span></span>
          </Part>
          {/* 2 and 3. Fewer and more windows */}
          {([[1, "minus", "One window fewer", -1, "M4 10h12"], [2, "plus", "One window more", 1, "M4 10h12M10 4v12"]] as const).map(([i, id, label, d, icon]) => (
            <Part key={id} seated={on(i)} from={from(i)} at={seat(i)} w={parts[i].w} h={parts[i].h} order={i} shift={down === id ? "translateY(2px)" : undefined}>
              <button type="button" aria-label={label} disabled={!on(i)} onPointerDown={() => setDown(id)} onPointerUp={() => setDown("")} onPointerLeave={() => setDown("")} onClick={() => { touch(); setSent(false); setWindows((n) => Math.max(1, Math.min(40, n + d))); }} className={`flex h-full w-full items-center justify-center rounded-full ${ring}`}>
                <svg aria-hidden="true" viewBox="0 0 20 20" className="h-6 w-6 drop-shadow-[0_1px_0_rgba(255,255,255,0.3)]" fill="none" stroke="#0B0D12" strokeWidth="3" strokeLinecap="round"><path d={icon} /></svg>
              </button>
            </Part>
          ))}
          {/* 4. The slider thumb, which rides in the floors slot once seated */}
          <Part seated={on(3)} from={from(3)} at={seat(3)} w={parts[3].w} h={parts[3].h} order={3} shift={on(3) ? `translateX(${floor * 83}px)` : undefined}>
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center gap-[5px]">{[0, 1, 2].map((n) => <i key={n} className="h-[18px] w-[3px] rounded-full bg-[#2459b4] shadow-[1px_0_0_rgba(255,255,255,0.4)]" />)}</span>
          </Part>
          <div role="radiogroup" aria-label="Floors" style={{ left: seat(3).x, top: seat(3).y, zIndex: 6 }} className="absolute flex h-[42px] w-[249px]">
            {floors.map((f, i) => <button key={f.label} type="button" role="radio" aria-checked={floor === i} aria-label={f.name} disabled={!on(3)} onClick={() => { touch(); setSent(false); setFloor(i); }} className="h-full flex-1 rounded-[12px] outline-none focus-visible:ring-2 focus-visible:ring-[#0B0D12] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6F4EF] disabled:pointer-events-none" />)}
          </div>
          {/* 5. Send */}
          <Part seated={on(4)} from={from(4)} at={seat(4)} w={parts[4].w} h={parts[4].h} order={4} shift={down === "send" ? "translateY(2px)" : undefined}>
            <button type="button" disabled={!on(4)} onPointerDown={() => setDown("send")} onPointerUp={() => setDown("")} onPointerLeave={() => setDown("")} onClick={() => { touch(); setSent((v) => !v); }} className={`flex h-full w-full items-center justify-center gap-2 rounded-[18px] text-[17px] font-extrabold tracking-[-0.02em] ${legend} ${ring}`}>
              {sent ? "Quote sent" : "Send quote"}
              <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">{sent ? <path d="M3 8.5l3.2 3L13 4.5" /> : <path d="M3 8h10M9 4l4 4-4 4" />}</svg>
            </button>
          </Part>
        </div>
      </div>

      <button type="button" onClick={() => { setAuto(false); setSent(false); setRun((r) => r + 1); }} className="absolute bottom-5 left-1/2 flex h-10 -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-[#0B0D12] px-5 text-[13px] font-bold tracking-[-0.01em] text-[#F6F4EF] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_16px_-8px_rgba(11,13,18,0.6)] outline-none transition-colors duration-200 hover:bg-[#1b1f29] focus-visible:ring-2 focus-visible:ring-[#4F98FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#E6E2D9] motion-reduce:transition-none">
        <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke={BLUE} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 8a5 5 0 1 1-1.6-3.7M13 2.5v3h-3" /></svg>
        Snap it out again
      </button>
    </div>
  );
}
