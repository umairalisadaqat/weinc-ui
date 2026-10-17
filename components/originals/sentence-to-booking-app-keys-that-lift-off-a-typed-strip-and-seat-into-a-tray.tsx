import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";

// The sentence. Plain strings are ordinary words; `key` entries become parts of the app, in tray order.
const sentence: (string | { key: number; text: string })[] = [
  "Book a ", { key: 0, text: "surf lesson" }, ". Pick ", { key: 1, text: "a day" }, ", ", { key: 2, text: "a time" },
  " and ", { key: 3, text: "how many" }, ", then pay ", { key: 4, text: "the deposit" }, ".",
];
const days = [{ d: "Thu", n: 12 }, { d: "Fri", n: 13 }, { d: "Sat", n: 14 }, { d: "Sun", n: 15 }, { d: "Mon", n: 16 }];
const times = ["08:00", "10:30", "14:00"];
const school = "Tidewater Surf School";
const PARTS = 5;
const BLUE = "#4F98FB";
const W = 400, H = 596; // the drawing size; the whole piece is scaled to fit its container
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';

const useIsoLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// A key has a top face and a visible side, so the shadow is built in layers: lip, three steps of side, contact shadow, cast shadow.
const side = (a: string, b: string, c: string) => `inset 0 1px 0 rgba(255,255,255,0.85), inset 0 -1px 0 rgba(0,0,0,0.06), 0 1px 0 ${a}, 0 2px 0 ${b}, 0 3px 0 ${c}`;
const WHITE_SIDE = side("#d9d4c8", "#cec9bd", "#c2bdb1");
const BLUE_SIDE = side("#3f82dc", "#3672c6", "#2d62ae");
const SEATED = ", 0 5px 5px rgba(0,0,0,0.6), 0 0 0 rgba(0,0,0,0)";
const LIFTED = ", 0 5px 5px rgba(0,0,0,0), 0 34px 30px rgba(0,0,0,0.5)";

function Key({ on, from, blue, pressed, children }: { on: boolean; from: { x: number; y: number } | null; blue?: boolean; pressed?: boolean; children: ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={false}
      animate={on ? { x: 0, y: pressed ? 2 : 0, scale: 1, opacity: 1, rotate: 0 } : { x: from?.x ?? 0, y: from?.y ?? -120, scale: 0.28, opacity: 0, rotate: -7 }}
      transition={reduce ? { duration: 0 } : on ? { type: "spring", stiffness: 210, damping: 19, mass: 0.9, opacity: { duration: 0.16 } } : { type: "spring", stiffness: 260, damping: 30, opacity: { duration: 0.3, delay: 0.12 } }}
      style={{ boxShadow: (blue ? BLUE_SIDE : WHITE_SIDE) + (on ? SEATED : LIFTED), background: blue ? "linear-gradient(180deg,#63a6ff 0%,#4F98FB 55%,#438be9 100%)" : "linear-gradient(180deg,#fbfaf6 0%,#F6F4EF 60%,#ece9e1 100%)" }}
      className="absolute inset-x-[3px] bottom-[6px] top-[3px] rounded-[15px] transition-shadow duration-500 motion-reduce:transition-none"
    >
      {children}
    </motion.div>
  );
}

export default function SentenceToBookingAppTray() {
  const reduce = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const plane = useRef<HTMLDivElement>(null);
  const words = useRef<(HTMLSpanElement | null)[]>([]);
  const pockets = useRef<(HTMLDivElement | null)[]>([]);
  const timers = useRef<number[]>([]);
  const [scale, setScale] = useState(1);
  const [from, setFrom] = useState<({ x: number; y: number } | null)[]>(Array(PARTS).fill(null));
  const [seated, setSeated] = useState(PARTS);
  const [day, setDay] = useState(2);
  const [time, setTime] = useState(1);
  const [people, setPeople] = useState(2);
  const [press, setPress] = useState(false);
  const [booked, setBooked] = useState(false);
  const [run, setRun] = useState(0);
  const [auto, setAuto] = useState(true);

  // Fit the drawing to the container, and find where each word sits relative to its pocket.
  useIsoLayoutEffect(() => {
    const el = root.current, pl = plane.current;
    if (!el || !pl) return;
    const centre = (node: HTMLElement) => {
      let x = node.offsetWidth / 2, y = node.offsetHeight / 2;
      for (let n: HTMLElement | null = node; n && n !== pl; n = n.offsetParent as HTMLElement | null) { x += n.offsetLeft; y += n.offsetTop; }
      return { x, y };
    };
    const measure = () => {
      const w = el.clientWidth;
      setScale(Math.min(1.2, (w - 28) / W));
      setFrom(Array.from({ length: PARTS }, (_, i) => {
        const a = words.current[i], b = pockets.current[i];
        if (!a || !b) return null;
        const p = centre(a), q = centre(b);
        return { x: p.x - q.x, y: p.y - q.y };
      }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The self-running demo: the keys leave the sentence one by one, then the finished tool takes a booking.
  useIsoLayoutEffect(() => {
    if (reduce || !auto) { setSeated(PARTS); return; }
    const at = (ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)); };
    setSeated(0); setDay(0); setTime(0); setPeople(1); setBooked(false); setPress(false);
    for (let i = 0; i < PARTS; i++) at(260 + i * 400, () => setSeated(i + 1));
    const t = 260 + PARTS * 400 + 380;
    at(t, () => setDay(2));
    at(t + 800, () => setTime(1));
    at(t + 1600, () => setPeople(2));
    at(t + 2500, () => setPress(true));
    at(t + 2720, () => { setPress(false); setBooked(true); });
    at(t + 7400, () => setBooked(false));
    at(t + 8100, () => setSeated(0));
    at(t + 9300, () => setRun((r) => r + 1));
    return () => { timers.current.forEach((id) => window.clearTimeout(id)); timers.current = []; };
  }, [run, reduce, auto]);

  const touch = () => { if (auto) setAuto(false); };
  const replay = () => { if (auto) setRun((r) => r + 1); else setAuto(true); };

  // The tray leans a little towards the pointer.
  const mx = useMotionValue(0), my = useMotionValue(0);
  const rotateY = useSpring(mx, { stiffness: 120, damping: 18 }), rotateX = useSpring(my, { stiffness: 120, damping: 18 });
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType === "touch") return;
    const b = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - b.left) / b.width - 0.5) * 9);
    my.set(13 - ((e.clientY - b.top) / b.height - 0.5) * 8);
  };
  useEffect(() => { my.set(reduce ? 0 : 13); }, [reduce, my]);

  const ready = seated >= PARTS;
  const summary = `${days[day].d} ${days[day].n}, ${times[time]}, ${people} ${people === 1 ? "rider" : "riders"}`;
  const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[#4F98FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6F4EF]";

  return (
    <div
      ref={root}
      onPointerMove={onMove}
      onPointerLeave={() => { mx.set(0); my.set(reduce ? 0 : 13); }}
      style={{ fontFamily: FONT }}
      className="relative flex min-h-[640px] w-full flex-col items-center justify-center overflow-hidden bg-[#F6F4EF] bg-[radial-gradient(90%_70%_at_50%_38%,#ffffff_0%,#F6F4EF_48%,#e6e2d8_100%)] py-10 sm:min-h-[820px]"
    >
      <div style={{ width: W * scale, height: H * scale, perspective: 1400 }} className="relative">
        <motion.div ref={plane} style={{ width: W, height: H, scale, rotateX, rotateY, transformOrigin: "0 0" }} className="absolute left-0 top-0">
          {/* The typed strip */}
          <div className="absolute left-[14px] top-0 w-[372px] -rotate-[1.4deg] rounded-[6px] bg-[#fffdf8] px-5 pb-4 pt-3.5 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_1px_1px_rgba(11,13,18,0.14),0_14px_22px_-10px_rgba(11,13,18,0.28)]">
            <span aria-hidden="true" className="absolute inset-x-0 top-0 h-full rounded-[6px] bg-[linear-gradient(92deg,rgba(11,13,18,0.035)_0%,rgba(11,13,18,0)_9%,rgba(11,13,18,0)_88%,rgba(11,13,18,0.05)_100%)]" />
            <p className="relative text-[21px] font-extrabold leading-[1.28] tracking-[-0.03em] text-[#0B0D12]">
              {sentence.map((part, i) => {
                if (typeof part === "string") return <span key={i}>{part}</span>;
                const used = seated > part.key;
                return (
                  <span key={i} ref={(el) => { words.current[part.key] = el; }} style={{ color: used ? BLUE : undefined, backgroundSize: used ? "100% 3px" : "0% 3px" }} className="bg-[linear-gradient(#4F98FB,#4F98FB)] bg-[position:0_100%] bg-no-repeat pb-[1px] transition-[color,background-size] duration-300 motion-reduce:transition-none">
                    {part.text}
                  </span>
                );
              })}
              <span aria-hidden="true" className="sentence-to-booking-app-caret ml-[3px] inline-block h-[20px] w-[3px] translate-y-[3px] rounded-full bg-[#4F98FB]" />
            </p>
          </div>

          {/* The ticket feeds out from under the tray once a booking is made */}
          <motion.div
            aria-hidden="true"
            initial={false}
            animate={{ y: booked ? 0 : -104, opacity: booked ? 1 : 0 }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 150, damping: 17, opacity: { duration: 0.2 } }}
            className="absolute left-[62px] top-[470px] flex h-[84px] w-[276px] items-end rounded-b-[10px] bg-[#fffdf8] px-4 pb-3 shadow-[0_12px_18px_-8px_rgba(11,13,18,0.35)]"
          >
            <span className="absolute inset-x-3 top-[34px] border-t border-dashed border-[#0B0D12]/20" />
            <span className="flex w-full items-center justify-between">
              <span className="text-[13px] font-bold tracking-[-0.01em] text-[#0B0D12]">{summary}</span>
              <span className="rounded-full bg-[#4F98FB] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#0B0D12]">Booked</span>
            </span>
          </motion.div>

          {/* The tray */}
          <div onPointerDown={touch} onKeyDown={touch} className="absolute left-[10px] top-[132px] w-[380px] rounded-[30px] bg-[#0B0D12] bg-[linear-gradient(168deg,#232733_0%,#12151c_38%,#0B0D12_100%)] p-[14px] pb-[16px] shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-1px_0_rgba(0,0,0,0.8),0_2px_0_#07080b,0_4px_0_#06070a,0_6px_0_#050609,0_8px_0_#040508,0_26px_30px_-10px_rgba(11,13,18,0.5),0_60px_70px_-30px_rgba(11,13,18,0.55)]">
            <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full rounded-[30px] opacity-[0.16] mix-blend-overlay">
              <filter id="sentence-to-booking-app-grain"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed="4" /><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.4 -0.3" /></filter>
              <rect width="100%" height="100%" rx="30" filter="url(#sentence-to-booking-app-grain)" />
            </svg>
            <div className="relative mb-[10px] flex h-[18px] items-center justify-between px-[8px]">
              <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.24em] text-white/40 [text-shadow:0_-1px_0_rgba(0,0,0,0.9)]">Booking / 05 parts</span>
              <span aria-hidden="true" className="flex gap-[6px]">
                {Array.from({ length: PARTS }, (_, i) => (
                  <span key={i} style={{ background: seated > i ? BLUE : "#1d212b", boxShadow: seated > i ? "0 0 8px 1px rgba(79,152,251,0.85), inset 0 1px 0 rgba(255,255,255,0.6)" : "inset 0 1px 1px rgba(0,0,0,0.9), 0 1px 0 rgba(255,255,255,0.08)" }} className="h-[6px] w-[6px] rounded-full transition-[background,box-shadow] duration-300" />
                ))}
              </span>
            </div>

            <div className="relative grid grid-cols-5 gap-[8px]">
              {/* 1. Title */}
              <div ref={(el) => { pockets.current[0] = el; }} data-n="01" className="sentence-to-booking-app-pocket relative col-span-5 h-[68px]">
                <Key on={seated > 0} from={from[0]}>
                  <div className="flex h-full items-center gap-3 px-3.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0B0D12]">
                      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke={BLUE} strokeWidth="2.4" strokeLinecap="round"><path d="M2 14c3-5 6-5 8-1s5 4 7 0 4-3 5-1" /><path d="M4 19c2-2 4-2 6 0s4 2 6 0 3-1 4 0" opacity="0.55" /></svg>
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[17px] font-extrabold leading-5 tracking-[-0.03em] text-[#0B0D12]">Surf lesson</span>
                      <span className="block truncate text-[11px] font-semibold leading-4 text-[#0B0D12]/60">{school}</span>
                    </span>
                    <span className="ml-auto rounded-full bg-[#0B0D12]/[0.07] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#0B0D12]/70">90 min</span>
                  </div>
                </Key>
              </div>

              {/* 2. Day */}
              <div ref={(el) => { pockets.current[1] = el; }} data-n="02" className="sentence-to-booking-app-pocket relative col-span-5 h-[84px]">
                <Key on={seated > 1} from={from[1]}>
                  <div role="radiogroup" aria-label="Day" className="relative flex h-full items-stretch p-[7px]">
                    <motion.span aria-hidden="true" initial={false} animate={{ x: `${day * 100}%` }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 30 }} className="absolute bottom-[7px] left-[7px] top-[7px] w-[calc((100%-14px)/5)] rounded-[10px] bg-[#4F98FB] shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_3px_6px_rgba(47,104,190,0.45)]" />
                    {days.map((d, i) => (
                      <button key={d.d} type="button" role="radio" aria-checked={day === i} disabled={seated <= 1} onClick={() => { touch(); setDay(i); setBooked(false); }} className={`relative flex-1 rounded-[10px] ${ring}`}>
                        <span className={`block text-[10px] font-bold uppercase tracking-[0.12em] ${day === i ? "text-[#0B0D12]" : "text-[#0B0D12]/55"}`}>{d.d}</span>
                        <span className="block text-[22px] font-extrabold leading-7 tracking-[-0.04em] text-[#0B0D12]">{d.n}</span>
                      </button>
                    ))}
                  </div>
                </Key>
              </div>

              {/* 3. Time */}
              <div ref={(el) => { pockets.current[2] = el; }} data-n="03" className="sentence-to-booking-app-pocket relative col-span-5 h-[66px]">
                <Key on={seated > 2} from={from[2]}>
                  <div role="radiogroup" aria-label="Start time" className="flex h-full items-center gap-[6px] p-[7px]">
                    {times.map((t, i) => (
                      <button key={t} type="button" role="radio" aria-checked={time === i} disabled={seated <= 2} onClick={() => { touch(); setTime(i); setBooked(false); }} className={`h-full flex-1 rounded-full text-[14px] font-extrabold tracking-[-0.02em] transition-colors duration-200 ${ring} ${time === i ? "bg-[#0B0D12] text-[#F6F4EF] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]" : "bg-[#0B0D12]/[0.06] text-[#0B0D12] hover:bg-[#0B0D12]/[0.11]"}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </Key>
              </div>

              {/* 4. How many */}
              <div ref={(el) => { pockets.current[3] = el; }} data-n="04" className="sentence-to-booking-app-pocket relative col-span-2 h-[70px]">
                <Key on={seated > 3} from={from[3]}>
                  <div className="flex h-full items-center justify-between px-[7px]">
                    <button type="button" aria-label="One rider fewer" disabled={seated <= 3 || people <= 1} onClick={() => { touch(); setPeople((p) => Math.max(1, p - 1)); setBooked(false); }} className={`flex h-10 w-10 items-center justify-center rounded-full bg-[#0B0D12]/[0.07] text-[20px] font-extrabold leading-none text-[#0B0D12] disabled:opacity-40 ${ring}`}>
                      <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4"><path d="M3 8h10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
                    </button>
                    <span aria-live="polite" aria-label={`${people} ${people === 1 ? "rider" : "riders"}`} className="text-[24px] font-extrabold tracking-[-0.04em] text-[#0B0D12] [font-variant-numeric:tabular-nums]">{people}</span>
                    <button type="button" aria-label="One rider more" disabled={seated <= 3 || people >= 6} onClick={() => { touch(); setPeople((p) => Math.min(6, p + 1)); setBooked(false); }} className={`flex h-10 w-10 items-center justify-center rounded-full bg-[#0B0D12]/[0.07] text-[#0B0D12] disabled:opacity-40 ${ring}`}>
                      <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4"><path d="M3 8h10M8 3v10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
                    </button>
                  </div>
                </Key>
              </div>

              {/* 5. Pay */}
              <div ref={(el) => { pockets.current[4] = el; }} data-n="05" className="sentence-to-booking-app-pocket relative col-span-3 h-[70px]">
                <Key on={seated > 4} from={from[4]} blue pressed={press}>
                  <button
                    type="button"
                    disabled={seated <= 4}
                    onPointerDown={() => setPress(true)}
                    onPointerUp={() => setPress(false)}
                    onPointerLeave={() => setPress(false)}
                    onClick={() => { touch(); setBooked((b) => !b); }}
                    className="flex h-full w-full items-center justify-center gap-2 rounded-[15px] text-[16px] font-extrabold tracking-[-0.02em] text-[#0B0D12] outline-none focus-visible:ring-2 focus-visible:ring-[#0B0D12] focus-visible:ring-offset-2 focus-visible:ring-offset-[#4F98FB]"
                  >
                    {booked ? "Book another" : "Pay deposit"}
                    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">{booked ? <path d="M3 8.5l3.2 3L13 4.5" /> : <path d="M3 8h10M9 4l4 4-4 4" />}</svg>
                  </button>
                </Key>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <p aria-live="polite" className="sr-only">{booked ? `Booked: ${summary}.` : ready ? "The booking tool is ready." : ""}</p>
      <button type="button" onClick={replay} className="absolute bottom-4 left-1/2 flex h-10 -translate-x-1/2 items-center gap-2 rounded-full bg-[#0B0D12] px-5 text-[13px] font-bold tracking-[-0.01em] text-[#F6F4EF] shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_16px_-8px_rgba(11,13,18,0.6)] outline-none transition-colors duration-200 hover:bg-[#1b1f29] focus-visible:ring-2 focus-visible:ring-[#4F98FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6F4EF] motion-reduce:transition-none">
        <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke={BLUE} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 8a5 5 0 1 1-1.6-3.7M13 2.5v3h-3" /></svg>
        Build it again
      </button>

      <style>{`
        .sentence-to-booking-app-pocket { border-radius: 18px; background: #05060a; box-shadow: inset 0 3px 5px rgba(0,0,0,0.95), inset 0 0 0 1px rgba(0,0,0,0.8), 0 1px 0 rgba(255,255,255,0.09); }
        .sentence-to-booking-app-pocket::before { content: attr(data-n); position: absolute; left: 14px; top: 10px; font: 600 9px ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: 0.2em; color: rgba(255,255,255,0.22); }
        @keyframes sentence-to-booking-app-blink { 0%, 55% { opacity: 1 } 56%, 100% { opacity: 0 } }
        .sentence-to-booking-app-caret { animation: sentence-to-booking-app-blink 1.1s steps(1) infinite; }
        @media (prefers-reduced-motion: reduce) { .sentence-to-booking-app-caret { animation: none } }
      `}</style>
    </div>
  );
}
