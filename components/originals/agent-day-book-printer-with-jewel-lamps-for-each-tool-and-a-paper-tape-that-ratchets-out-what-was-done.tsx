import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

// One lamp per tool. `lines` are what the tape prints, in turn, when that tool is used.
const tools = [
  { name: "Inbox", lines: ["Answered Dee about the rye loaf", "Sent Sol the wedding cake quote", "Told Amir we do nut-free trays"] },
  { name: "Diary", lines: ["Booked a tasting for Friday at 3", "Moved the school visit to Tuesday", "Pencilled in the oven service"] },
  { name: "Stock", lines: ["Flour is low: 4 sacks on the order", "Counted the cake boxes, 60 left", "Ordered more baking paper"] },
  { name: "Till", lines: ["Matched yesterday's takings", "Sent the invoice to Cafe Lumen", "Logged the card machine fee"] },
  { name: "Site", lines: ["Put today's specials on the menu", "Set Saturday's hours on the site", "Took sold-out buns off the menu"] },
];
// The tape as it lies when the page opens, newest first: [tool, line, minutes after midnight].
const OPENING: [number, number, number][] = [[4, 0, 584], [1, 0, 571], [2, 0, 563], [0, 1, 548], [3, 0, 535], [0, 0, 522], [1, 1, 509], [2, 1, 497]];
const AUTO = [0, 3, 2, 0, 1, 4]; // the order the demo runs through the tools
const FIRST_JOB = 2900; // milliseconds before the first new line, so the full tape is seen first
const EVERY = 2500; // milliseconds between jobs when left alone
const ENTRY = 44; // height of one printed entry in design pixels
const W = 464, H = 566; // design size; the whole object scales to its box
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';
const STEEL = "conic-gradient(from 210deg,#f4f6f9,#7d8591,#ffffff,#5c636f,#dfe3e9,#747c88,#f4f6f9)";

type Entry = { id: number; tool: number; text: string; at: number };
const clock = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
// A ratchet: five quick pulls with a rest after each, not one smooth slide.
const ratchet = (t: number) => { const f = t * 5, i = Math.min(4, Math.floor(f)); return (i + Math.min(1, (f - i) * 2.4) ** 0.6) / 5; };

export default function AgentDayBookPrinter() {
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [log, setLog] = useState<Entry[]>(() => OPENING.map(([tool, line, at], i) => ({ id: -i, tool, text: tools[tool].lines[line], at })));
  const [lit, setLit] = useState(OPENING[0][0]);
  const [fed, setFed] = useState(0); // counts feeds; a new value replays the ratchet
  const used = useRef(tools.map((_, t) => OPENING.filter((o) => o[0] === t).length));
  const turn = useRef(0);
  const timer = useRef(0);

  const run = useCallback((tool: number) => {
    const line = tools[tool].lines[used.current[tool] % tools[tool].lines.length];
    used.current[tool] += 1;
    setLit(tool);
    setFed((n) => n + 1);
    setLog((old) => [{ id: old[0].id + old.length + 1, tool, text: line, at: old[0].at + 6 + ((old[0].at * 7) % 9) }, ...old.slice(0, 8)]);
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => setScale(el.getBoundingClientRect().width / W);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Left alone, the agent keeps working through the day.
  const schedule = useCallback((wait: number) => {
    window.clearTimeout(timer.current);
    if (reduce) return;
    timer.current = window.setTimeout(() => {
      if (!document.hidden) { run(AUTO[turn.current % AUTO.length]); turn.current += 1; }
      schedule(EVERY);
    }, wait);
  }, [reduce, run]);
  useEffect(() => { schedule(FIRST_JOB); return () => window.clearTimeout(timer.current); }, [schedule]);

  const feed = reduce ? { duration: 0 } : { duration: 0.72, ease: ratchet };

  return (
    <div style={{ fontFamily: FONT }} className="flex min-h-[640px] w-full items-center justify-center overflow-hidden bg-[#EFECE5] bg-[radial-gradient(85%_70%_at_50%_30%,#fbfaf7_0%,#EFECE5_52%,#d8d3c7_100%)] px-4 py-8 sm:min-h-[800px]">
      <div ref={box} className="relative aspect-[464/566] w-full max-w-[590px]">
        <div style={{ width: W, height: H, transform: `scale(${scale})` }} className="absolute left-0 top-0 origin-top-left">
          {/* the paper tape, lying on the desk and running out from under the machine */}
          <div className="absolute left-[94px] top-[176px] h-[346px] w-[276px] overflow-hidden rounded-b-[3px] bg-[#FBFAF6] shadow-[0_1px_0_rgba(255,255,255,0.9),3px_10px_14px_-4px_rgba(11,13,18,0.28),10px_26px_30px_-12px_rgba(11,13,18,0.3)]">
            <motion.ol key={fed} aria-label="What the agent has done today, newest first" initial={fed ? { y: -ENTRY } : false} animate={{ y: 0 }} transition={feed}
              className="absolute inset-x-0 top-[36px] m-0 list-none bg-[radial-gradient(circle_at_9px_11px,#cfcabd_0,#cfcabd_2.4px,rgba(207,202,189,0)_3px),radial-gradient(circle_at_267px_11px,#cfcabd_0,#cfcabd_2.4px,rgba(207,202,189,0)_3px)] bg-[length:276px_22px] p-0">
              {log.map((e, i) => (
                <li key={e.id} style={{ height: ENTRY }} className="flex flex-col justify-center border-b border-dashed border-[#0B0D12]/10 px-[22px]">
                  <span className="font-mono text-[8.5px] font-bold uppercase leading-[13px] tracking-[0.2em] text-[#4F98FB]">{clock(e.at)} / {tools[e.tool].name}</span>
                  <span className={`whitespace-nowrap font-mono text-[11px] font-semibold leading-[16px] tracking-[-0.02em] transition-colors duration-[1400ms] motion-reduce:transition-none ${i === 0 && fed ? "text-[#2f74dc]" : "text-[#1b2130]"}`}>{e.text}</span>
                </li>
              ))}
            </motion.ol>
            {/* how the light falls on the strip: shade under the machine, a soft roll towards the curl */}
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(11,13,18,0.5)_0px,rgba(11,13,18,0.16)_30px,rgba(11,13,18,0)_58px,rgba(11,13,18,0)_270px,rgba(11,13,18,0.07)_312px,rgba(255,255,255,0.5)_330px,rgba(11,13,18,0.2)_346px)]" />
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(11,13,18,0.07)_0%,rgba(11,13,18,0)_7%,rgba(11,13,18,0)_93%,rgba(11,13,18,0.09)_100%)]" />
          </div>
          {/* the loose end of the tape, curled up on itself */}
          <div aria-hidden="true" style={{ borderRadius: "9px / 26px" }} className="absolute left-[84px] top-[502px] h-[54px] w-[296px] overflow-hidden bg-[#f3f0e8] shadow-[0_2px_2px_rgba(11,13,18,0.25),5px_16px_16px_-4px_rgba(11,13,18,0.42),14px_34px_32px_-12px_rgba(11,13,18,0.38)]">
            <motion.span key={fed} initial={fed ? { backgroundPositionY: "0px" } : false} animate={{ backgroundPositionY: "18px" }} transition={feed} className="absolute inset-0 bg-[repeating-linear-gradient(180deg,rgba(11,13,18,0)_0px,rgba(11,13,18,0)_8px,rgba(11,13,18,0.08)_8.5px,rgba(11,13,18,0)_9px)]" />
            <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,13,18,0.16)_0%,rgba(255,255,255,0.2)_8%,#ffffff_22%,rgba(255,255,255,0.4)_36%,rgba(11,13,18,0.04)_52%,rgba(11,13,18,0.2)_74%,rgba(11,13,18,0.42)_92%,rgba(11,13,18,0.3)_100%)]" />
            <span className="absolute inset-y-0 left-0 w-[10px] bg-[linear-gradient(90deg,rgba(11,13,18,0.3),rgba(11,13,18,0))]" />
            <span className="absolute inset-y-0 right-0 w-[10px] bg-[linear-gradient(270deg,rgba(11,13,18,0.34),rgba(11,13,18,0))]" />
            {/* the lip of the last turn */}
            <span className="absolute inset-x-0 top-[33px] h-[1.5px] bg-[linear-gradient(180deg,rgba(11,13,18,0.28),rgba(255,255,255,0.7))]" />
          </div>

          {/* the knurled feed wheel on the side of the case */}
          <div aria-hidden="true" className="absolute left-[448px] top-[104px] h-[72px] w-[16px] overflow-hidden rounded-r-[6px] shadow-[4px_8px_10px_-2px_rgba(11,13,18,0.55)]">
            <motion.span key={fed} initial={fed ? { backgroundPositionY: "0px" } : false} animate={{ backgroundPositionY: "32px" }} transition={feed} className="absolute inset-0 bg-[repeating-linear-gradient(180deg,#f4f6f9_0px,#f4f6f9_1.2px,#6b727d_1.8px,#3d434c_4px)]" />
            <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,13,18,0.75)_0%,rgba(11,13,18,0)_26%,rgba(255,255,255,0.35)_46%,rgba(11,13,18,0)_66%,rgba(11,13,18,0.8)_100%)]" />
          </div>

          {/* the machine */}
          <div className="absolute left-[12px] top-[6px] h-[196px] w-[440px] rounded-[30px] bg-[#0B0D12] bg-[linear-gradient(165deg,#30343f_0%,#171a22_30%,#0B0D12_70%,#08090d_100%)] shadow-[inset_0_1.5px_0_rgba(255,255,255,0.3),inset_0_0_0_1px_rgba(255,255,255,0.05),inset_0_-3px_2px_rgba(0,0,0,0.7),0_2px_0_#050608,0_4px_0_#030405,0_6px_0_#000000,6px_22px_24px_-8px_rgba(11,13,18,0.55),18px_54px_60px_-24px_rgba(11,13,18,0.6)]">
            <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[30px] bg-[linear-gradient(112deg,rgba(255,255,255,0)_14%,rgba(255,255,255,0.13)_24%,rgba(255,255,255,0)_36%,rgba(255,255,255,0)_66%,rgba(255,255,255,0.05)_76%,rgba(255,255,255,0)_86%)]" />
            {[[16, 16, 30], [416, 16, 115], [16, 172, 80], [416, 172, 10]].map(([x, y, a]) => (
              <span key={`${x}-${y}`} aria-hidden="true" style={{ left: x, top: y, backgroundImage: STEEL }} className="absolute h-[9px] w-[9px] rounded-full shadow-[0_1px_1px_rgba(0,0,0,0.8),inset_0_0_0_0.5px_rgba(0,0,0,0.5)]">
                <span style={{ transform: `rotate(${a}deg)` }} className="absolute left-[1px] top-[3.9px] h-[1.2px] w-[7px] bg-[#0B0D12]/80" />
              </span>
            ))}
            <span className="absolute left-[36px] top-[17px] text-[9px] font-extrabold uppercase leading-none tracking-[0.3em] text-[#F6F4EF]/85 [text-shadow:0_-1px_0_rgba(0,0,0,0.9)]">Day book</span>
            <span className="absolute right-[36px] top-[17px] font-mono text-[8px] font-semibold uppercase leading-none tracking-[0.22em] text-[#F6F4EF]/50 [text-shadow:0_-1px_0_rgba(0,0,0,0.9)]">Crumb Street Bakery</span>
            <span aria-hidden="true" className="absolute inset-x-[22px] top-[36px] h-px bg-black shadow-[0_1px_0_rgba(255,255,255,0.09)]" />

            <ul aria-label="Tools the agent can use" className="absolute inset-0 m-0 list-none p-0">
              {tools.map((t, i) => {
                const on = lit === i;
                return (
                  <li key={t.name}>
                    <button type="button" onClick={() => { run(i); schedule(EVERY + 1200); }} aria-label={`Do a job with ${t.name}`} style={{ left: 52 + i * 84 }}
                      className="group absolute top-[50px] flex h-[88px] w-[68px] -translate-x-1/2 flex-col items-center rounded-[16px] pt-[11px] outline-none focus-visible:ring-2 focus-visible:ring-[#4F98FB]">
                      <span style={{ backgroundImage: STEEL }} className="relative block h-[46px] w-[46px] rounded-full shadow-[0_3px_5px_rgba(0,0,0,0.85),inset_0_0_0_0.5px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.9)] transition-transform duration-100 group-active:translate-y-[1.5px] motion-reduce:transition-none">
                        <span className="absolute inset-[5px] rounded-full bg-[#04060a] shadow-[inset_0_2px_3px_rgba(0,0,0,0.9)]" />
                        <span className={`absolute inset-[7px] rounded-full transition-[box-shadow,opacity] duration-300 motion-reduce:transition-none ${on ? "shadow-[0_0_10px_2px_rgba(79,152,251,0.9),0_0_34px_12px_rgba(79,152,251,0.5)]" : "shadow-none"}`} />
                        <span className="absolute inset-[7px] rounded-full bg-[radial-gradient(circle_at_36%_30%,#4a6190_0%,#1b2a48_45%,#080d18_100%)]" />
                        <span className={`absolute inset-[7px] rounded-full bg-[radial-gradient(circle_at_38%_32%,#ffffff_0%,#cfe4ff_18%,#4F98FB_55%,#1c59bd_100%)] transition-opacity duration-300 motion-reduce:transition-none ${on ? "opacity-100" : "opacity-0"}`} />
                        <span className="absolute left-[13px] top-[11px] h-[8px] w-[13px] -rotate-[28deg] rounded-full bg-white/80 blur-[0.6px]" />
                        <span className="absolute inset-[7px] rounded-full shadow-[inset_0_-3px_4px_rgba(0,0,0,0.45),inset_0_0_0_0.5px_rgba(0,0,0,0.6)]" />
                      </span>
                      <span className={`mt-[10px] text-[9px] font-extrabold uppercase leading-none tracking-[0.22em] transition-colors duration-300 [text-shadow:0_-1px_0_rgba(0,0,0,0.9)] motion-reduce:transition-none ${on ? "text-white" : "text-[#F6F4EF]/60"}`}>{t.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* the print window: a carriage shuttles across while a line is struck */}
            <div aria-hidden="true" className="absolute left-[70px] top-[146px] h-[22px] w-[300px] overflow-hidden rounded-[7px] bg-[#020305] shadow-[inset_0_3px_5px_rgba(0,0,0,1),0_1px_0_rgba(255,255,255,0.14),0_-1px_0_rgba(0,0,0,0.8)]">
              <span className="absolute inset-x-[6px] top-[10px] h-[2px] rounded-full bg-[linear-gradient(180deg,#9aa1ad,#3c424b)]" />
              <motion.span key={fed} initial={fed ? { x: 0 } : false} animate={{ x: fed ? [0, 262, 0, 262, 6] : 6 }} transition={reduce ? { duration: 0 } : { duration: 0.72, ease: "easeInOut" }}
                className="absolute left-[4px] top-[4px] h-[14px] w-[26px] rounded-[3px] bg-[linear-gradient(180deg,#e9ecf0,#6f7782_55%,#2c3038)] shadow-[0_2px_3px_rgba(0,0,0,0.9)]">
                <span className="absolute left-[10px] top-[4px] h-[6px] w-[6px] rounded-full bg-[#4F98FB] shadow-[0_0_8px_3px_rgba(79,152,251,0.8)]" />
              </motion.span>
              <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.13)_0%,rgba(255,255,255,0)_45%)]" />
            </div>
            {/* the steel tear bar the tape runs under */}
            <div aria-hidden="true" className="absolute left-[72px] top-[182px] h-[16px] w-[296px]">
              <span className="absolute inset-x-0 top-0 h-[11px] rounded-t-[2px] bg-[linear-gradient(180deg,#fafbfc_0%,#aab0ba_32%,#6d747f_70%,#c9cdd4_100%)] shadow-[0_-1px_0_rgba(0,0,0,0.7)]" />
              <span className="absolute inset-x-0 top-[11px] h-[5px] bg-[linear-gradient(135deg,#b9bec6_50%,rgba(0,0,0,0)_50%),linear-gradient(225deg,#8e959f_50%,rgba(0,0,0,0)_50%)] bg-[length:8px_5px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
