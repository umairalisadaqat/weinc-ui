import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";

type Kind = "Website" | "Web app" | "Phone game" | "Agent";
type Ticket = { kind: Kind; name: string; line: string };

// The slips the window serves itself while nobody is typing, and the ticket each one comes back as.
const slips: { sentence: string; ticket: Ticket }[] = [
  { sentence: "A website for a ceramics studio that sells weekend wheel classes", ticket: { kind: "Website", name: "Kiln & Kin", line: "Classes, a shop and a map" } },
  { sentence: "A booking app for a dog groomer with reminders the day before", ticket: { kind: "Web app", name: "Mucky Pup", line: "Diary, clients and reminders" } },
  { sentence: "A phone game where a fox hops rooftops collecting lanterns", ticket: { kind: "Phone game", name: "Lantern Fox", line: "One thumb, endless rooftops" } },
  { sentence: "An agent that sorts enquiries for a kayak hire shop", ticket: { kind: "Agent", name: "Paddle Post", line: "Reads, sorts and drafts replies" } },
];
const BLUE = "#4F98FB";
const PAPER = "#F6F4EF";
const HOLD = 4200; // how long the self-running demo leaves a ticket on the tray
const MAX = 84; // characters that fit on the slip
const W = 560, H = 694; // the scene is drawn at this size and scaled to fit
const GRAIN = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='4'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.42 -0.1'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")";
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';
const BRASS = "linear-gradient(180deg,#fbeab5 0%,#e3bf6c 14%,#b88a35 46%,#d6ae58 72%,#8a6420 100%)";
const BRASS_SIDE = "linear-gradient(90deg,#8a6420 0%,#e3bf6c 18%,#fbeab5 34%,#c79c45 55%,#a67a2c 80%,#6b4c16 100%)";

type Phase = "type" | "in" | "scan" | "out";

// Decide what kind of thing a visitor asked for from the words they used.
const ticketFrom = (words: string): Ticket => {
  const t = words.toLowerCase();
  const kind: Kind = /\bagent\b|assistant|answers|replies|sorts/.test(t) ? "Agent" : /\bgame\b|\bplay|puzzle|arcade/.test(t) ? "Phone game" : /\bapp\b|booking|dashboard|tracker|portal|diary/.test(t) ? "Web app" : "Website";
  const clean = words.trim().replace(/\s+/g, " ");
  return { kind, name: `Your ${kind.toLowerCase()}`, line: clean.length > 44 ? `${clean.slice(0, 42).replace(/\s+\S*$/, "")}...` : clean };
};

// A small drawing of the finished thing for the blue end of the ticket.
function Sketch({ kind }: { kind: Kind }) {
  const s = { fill: "none", stroke: "#fff", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 80 72" className="h-[72px] w-[80px]" aria-hidden="true">
      {kind === "Website" && (<g {...s}><rect x="8" y="8" width="64" height="56" rx="6" /><path d="M8 20h64" /><rect x="15" y="27" width="26" height="18" rx="3" fill="rgba(255,255,255,0.35)" /><path d="M47 29h18M47 36h12M15 54h50" /></g>)}
      {kind === "Web app" && (<g {...s}><rect x="8" y="8" width="64" height="56" rx="6" /><path d="M26 8v56M33 22h32M33 34h32M33 46h20" /><circle cx="17" cy="20" r="3" fill="#fff" /><path d="M14 32h6M14 42h6" /><rect x="52" y="42" width="13" height="9" rx="4.5" fill="#fff" /></g>)}
      {kind === "Phone game" && (<g {...s}><rect x="22" y="4" width="36" height="64" rx="8" /><path d="M28 50l8-10 6 6 10-14" /><circle cx="48" cy="18" r="4" fill="#fff" /><path d="M30 60h20" /></g>)}
      {kind === "Agent" && (<g {...s}><circle cx="40" cy="36" r="10" fill="rgba(255,255,255,0.35)" /><circle cx="14" cy="16" r="5" /><circle cx="66" cy="16" r="5" /><circle cx="14" cy="58" r="5" /><circle cx="66" cy="58" r="5" /><path d="M18 20l14 9M62 20l-14 9M18 54l14-10M62 54l-14-10" /></g>)}
    </svg>
  );
}

export default function BrassTicketWindowPrompt() {
  const reduce = !!useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const [k, setK] = useState(1);
  const [text, setText] = useState(() => slips[0].sentence.slice(0, slips[0].sentence.length - 3));
  const [phase, setPhase] = useState<Phase>("type");
  const [ticket, setTicket] = useState<Ticket | null>(null); // what lies on the tray instead of the slip
  const [said, setSaid] = useState("");
  const mine = useRef(false); // a visitor has taken the slip
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, ms)); };
  const stop = () => { timers.current.forEach((t) => window.clearTimeout(t)); timers.current = []; };

  // Tray in, light across, tray back with a ticket on it.
  const serve = (result: Ticket, after?: () => void) => {
    setSaid("");
    if (reduce) { setTicket(result); setPhase("out"); setSaid(`Ticket issued: ${result.kind}, ${result.name}`); return; }
    setPhase("in");
    later(() => setPhase("scan"), 430);
    later(() => setTicket(result), 430 + 240);
    later(() => { setPhase("out"); setSaid(`Ticket issued: ${result.kind}, ${result.name}`); if (after) after(); }, 430 + 500);
  };

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const fit = () => setK(Math.max(0.5, Math.min(1.1, (el.clientWidth - 16) / W)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    // Reflections on the pane slide against the pointer.
    const move = (e: PointerEvent) => { const r = el.getBoundingClientRect(); el.style.setProperty("--gx", `${((0.5 - (e.clientX - r.left) / r.width) * 46).toFixed(1)}px`); };
    el.addEventListener("pointermove", move);
    return () => { ro.disconnect(); el.removeEventListener("pointermove", move); };
  }, []);

  useEffect(() => {
    if (reduce) { setText(slips[0].sentence); setTicket(slips[0].ticket); setPhase("out"); return; }
    const play = (i: number, from: number) => {
      const s = slips[i].sentence;
      let n = from;
      setTicket(null); setPhase("type"); setText(s.slice(0, n));
      const key = () => {
        if (mine.current) return;
        n += 1; setText(s.slice(0, n));
        if (n < s.length) later(key, 32 + ((n * 41) % 44));
        else later(() => serve(slips[i].ticket, () => later(() => play((i + 1) % slips.length, 0), HOLD)), from ? 120 : 280);
      };
      later(key, from ? 80 : 500);
    };
    play(0, slips[0].sentence.length - 3);
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  const take = () => { mine.current = true; stop(); setTicket(null); setText(""); setPhase("type"); setSaid(""); };
  const submit = () => {
    if (ticket || phase !== "type") { take(); window.setTimeout(() => field.current?.focus(), 30); return; }
    if (!text.trim()) { field.current?.focus(); return; }
    const demo = slips.find((d) => d.sentence === text);
    mine.current = true; stop();
    serve(demo ? demo.ticket : ticketFrom(text));
  };
  const onKey = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => { if (e.key === "Enter") { e.preventDefault(); submit(); } };

  const inside = phase === "in" || phase === "scan";

  return (
    <div ref={root} className="relative flex min-h-[470px] w-full items-center justify-center overflow-hidden bg-[#F6F4EF] py-4 sm:min-h-[760px]" style={{ fontFamily: FONT, backgroundImage: "radial-gradient(90% 60% at 50% 8%,#ffffff 0%,rgba(255,255,255,0) 60%), linear-gradient(180deg,rgba(246,244,239,0) 40%,#e4dfd3 100%)" }}>
      <style>{`
        @keyframes brass-ticket-window-caret { 0%,49% { opacity: 1 } 50%,100% { opacity: 0 } }
        @keyframes brass-ticket-window-sway { 0%,100% { transform: rotate(-1.6deg) } 50% { transform: rotate(1.6deg) } }
        .brass-ticket-window-field::placeholder { color: rgba(11,13,18,0.36); }
        .brass-ticket-window-field::selection { background: rgba(79,152,251,0.3); }
        @media (prefers-reduced-motion: reduce) { .brass-ticket-window-anim { animation: none !important; } }
      `}</style>
      <div style={{ width: W * k, height: H * k }}>
        <div className="relative" style={{ width: W, height: H, transform: `scale(${k})`, transformOrigin: "0 0" }}>

          {/* The room behind the glass: a back wall, a counter that carries on inside and one blue lamp. */}
          <div aria-hidden="true" className="absolute left-[70px] top-[34px] h-[334px] w-[420px] rounded-t-[210px]" style={{ background: BRASS_SIDE, boxShadow: "0 30px 50px -18px rgba(60,40,10,0.45), 0 0 0 1px rgba(90,62,16,0.55), inset 0 0 0 1px rgba(255,246,214,0.9), inset 0 0 0 4px rgba(255,236,170,0.28), inset 0 0 0 5px rgba(80,55,15,0.5), inset 0 0 0 9px rgba(255,236,170,0.16)" }} />
          <div aria-hidden="true" className="absolute left-[84px] top-[48px] h-[320px] w-[392px] overflow-hidden rounded-t-[196px] bg-[#0B0D12]" style={{ boxShadow: "inset 0 0 0 2px rgba(60,40,10,0.9), inset 0 14px 30px rgba(0,0,0,0.9)" }}>
            <div className="absolute inset-0" style={{ background: "repeating-linear-gradient(90deg,rgba(255,255,255,0.028) 0 1px,rgba(0,0,0,0) 1px 56px), linear-gradient(180deg,#07080c 0%,#10141d 48%)" }} />
            <div className="absolute inset-x-0 bottom-0 h-[166px]" style={{ background: "linear-gradient(180deg,#1b2231 0%,#141925 30%,#0c0f16 100%)", boxShadow: "inset 0 1px 0 rgba(160,190,240,0.3)" }} />
            <div className="absolute left-1/2 top-[-40px] h-[330px] w-[330px] -translate-x-1/2 rounded-full transition-opacity duration-300" style={{ background: "radial-gradient(closest-side,rgba(79,152,251,0.62),rgba(79,152,251,0.14) 55%,rgba(79,152,251,0))", opacity: inside ? 1 : 0.5 }} />
            <div className="absolute inset-x-[30px] bottom-[6px] h-[120px] rounded-[50%] transition-opacity duration-300" style={{ background: "radial-gradient(closest-side,rgba(79,152,251,0.5),rgba(79,152,251,0))", opacity: inside ? 1 : 0.35 }} />
            {/* Pendant lamp. */}
            <div className="brass-ticket-window-anim absolute left-1/2 top-0 h-[72px] w-[60px] origin-top" style={{ marginLeft: -30, animation: "brass-ticket-window-sway 6s ease-in-out infinite" }}>
              <span className="absolute left-[29px] top-0 h-[26px] w-[2px] bg-[#6b4c16]" />
              <span className="absolute left-[8px] top-[24px] h-[26px] w-[44px] rounded-t-[22px]" style={{ background: BRASS_SIDE, boxShadow: "inset 0 -2px 3px rgba(0,0,0,0.5)" }} />
              <span className="absolute left-[19px] top-[46px] h-[13px] w-[22px] rounded-b-full" style={{ background: "radial-gradient(circle at 50% 20%,#fff,#b9d8ff 40%,#4F98FB)", boxShadow: `0 0 18px 6px ${BLUE}, 0 0 60px 20px rgba(79,152,251,0.5)` }} />
            </div>
          </div>

          {/* Counter: stone that runs from the wall towards you. */}
          <div aria-hidden="true" className="absolute left-0 top-[376px] h-[228px] w-full" style={{ clipPath: "polygon(52px 0,508px 0,100% 100%,0 100%)", background: `${GRAIN}, radial-gradient(46% 34% at 50% 0%,rgba(227,191,108,0.34),rgba(227,191,108,0) 70%), radial-gradient(70% 60% at 50% 0%,rgba(79,152,251,0.26),rgba(79,152,251,0) 70%), linear-gradient(180deg,#0d1016 0%,#191d27 55%,#2b303c 100%)` }} />
          <div aria-hidden="true" className="absolute left-0 top-[604px] h-[24px] w-full rounded-b-[6px]" style={{ background: `${GRAIN}, linear-gradient(180deg,#6a7286 0%,#2b303c 10%,#171a22 40%,#0b0d12 100%)`, boxShadow: "0 22px 30px -10px rgba(40,30,10,0.5)" }} />

          {/* The tray. It slides away from you, under the rail and behind the glass. */}
          <motion.div className="absolute left-[80px] top-[392px] z-10 h-[204px] w-[400px]" style={{ filter: inside && !reduce ? "blur(0.55px) saturate(0.9)" : "none" }} initial={false} animate={{ y: inside ? -216 : 0, scale: inside ? 0.7 : 1 }} transition={reduce ? { duration: 0 } : inside ? { duration: 0.42, ease: [0.5, 0, 0.3, 1] } : { type: "spring", stiffness: 170, damping: 17, mass: 0.9 }}>
            <div className="absolute inset-0 rounded-[30px]" style={{ background: "linear-gradient(160deg,#fff3c8 0%,#e3bf6c 16%,#b88a35 44%,#e0b961 66%,#8a6420 100%)", boxShadow: "0 26px 36px -12px rgba(0,0,0,0.85), 0 4px 0 #6b4c16, 0 5px 0 rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.8)" }} />
            <div className="absolute inset-[11px] rounded-[21px]" style={{ background: "repeating-linear-gradient(90deg,rgba(255,255,255,0.05) 0 1px,rgba(0,0,0,0.05) 1px 2px,rgba(0,0,0,0) 2px 4px), linear-gradient(180deg,#5b4012 0%,#8f6a26 26%,#b9923f 70%,#cfa850 100%)", boxShadow: "inset 0 10px 14px rgba(40,25,0,0.75), inset 0 -1px 0 rgba(255,240,190,0.7), 0 1px 0 rgba(255,244,205,0.9)" }} />

            {/* What lies in the tray: the slip you write on, or the ticket that came back. */}
            {ticket ? (
              <div className="absolute left-[34px] top-[25px] h-[100px] w-[332px]" style={{ transform: "rotate(1.2deg)", filter: "drop-shadow(0 7px 6px rgba(30,18,0,0.6))" }}>
                <div className="flex h-full w-full overflow-hidden rounded-[9px]" style={{ background: `linear-gradient(180deg,#fefdfb,${PAPER} 70%,#e8e4da)`, WebkitMaskImage: "radial-gradient(circle 8px at 106px 0,transparent 97%,#000), radial-gradient(circle 8px at 106px 100%,transparent 97%,#000)", WebkitMaskComposite: "source-in", maskImage: "radial-gradient(circle 8px at 106px 0,transparent 97%,#000), radial-gradient(circle 8px at 106px 100%,transparent 97%,#000)", maskComposite: "intersect" }}>
                  <div className="flex w-[106px] shrink-0 items-center justify-center" style={{ background: `linear-gradient(150deg,#7fb6ff,${BLUE} 45%,#2f74dc)` }}><Sketch kind={ticket.kind} /></div>
                  <div className="w-0 border-l-[2px] border-dashed border-[#0B0D12]/25" />
                  <div className="min-w-0 flex-1 px-[15px] py-[11px]">
                    <div className="flex items-center justify-between font-mono text-[8.5px] font-bold uppercase tracking-[0.2em]"><span style={{ color: "#2f74dc" }}>{ticket.kind}</span><span className="text-[#0B0D12]/50">Admit one idea</span></div>
                    <div className="mt-[5px] truncate text-[27px] font-black leading-[1] tracking-[-0.045em] text-[#0B0D12]">{ticket.name}</div>
                    <div className="mt-[6px] truncate text-[11px] font-semibold text-[#0B0D12]/65">{ticket.line}</div>
                    <div aria-hidden="true" className="mt-[7px] h-[9px] w-full opacity-70" style={{ background: "repeating-linear-gradient(90deg,#0B0D12 0 2px,transparent 2px 4px,#0B0D12 4px 5px,transparent 5px 9px,#0B0D12 9px 12px,transparent 12px 14px)" }} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="absolute left-[34px] top-[24px] h-[102px] w-[332px] rounded-[5px]" style={{ transform: "rotate(-0.8deg)", background: `linear-gradient(180deg,#fefdfb,${PAPER} 70%,#e8e4da)`, boxShadow: "0 7px 8px -2px rgba(30,18,0,0.65), 0 1px 0 rgba(255,255,255,0.9) inset" }}>
                <span aria-hidden="true" className="absolute left-[14px] right-[14px] top-[9px] flex items-center justify-between font-mono text-[8.5px] font-bold uppercase tracking-[0.2em] text-[#0B0D12]/50"><span style={{ color: "#2f74dc" }}>Request slip</span><span>{String(text.length).padStart(2, "0")} / {MAX}</span></span>
                <label htmlFor="brass-ticket-window-field" className="sr-only">Write what you want built in one sentence</label>
                <textarea
                  id="brass-ticket-window-field"
                  ref={field}
                  value={text}
                  maxLength={MAX}
                  rows={3}
                  spellCheck={false}
                  readOnly={phase !== "type"}
                  placeholder="Write what you want built"
                  onFocus={() => { if (!mine.current) take(); }}
                  onChange={(e) => { mine.current = true; stop(); setText(e.target.value.replace(/\n/g, "")); }}
                  onKeyDown={onKey}
                  className="brass-ticket-window-field absolute left-[14px] top-[25px] h-[72px] w-[306px] resize-none overflow-hidden border-0 bg-transparent p-0 text-[20.5px] font-extrabold leading-[1.16] tracking-[-0.035em] text-[#0B0D12] outline-none"
                  style={{ caretColor: BLUE, fontFamily: FONT }}
                />
                {!mine.current && phase === "type" && <span aria-hidden="true" className="brass-ticket-window-anim absolute bottom-[8px] right-[14px] h-[10px] w-[5px]" style={{ background: BLUE, animation: "brass-ticket-window-caret 1s steps(1) infinite" }} />}
              </div>
            )}

            <button type="button" onClick={submit} className="absolute bottom-[21px] left-1/2 flex h-[40px] w-[196px] -translate-x-1/2 items-center justify-center gap-[9px] rounded-full text-[14px] font-extrabold tracking-[-0.02em] text-white outline-none transition-transform duration-100 focus-visible:ring-2 focus-visible:ring-[#0B0D12] focus-visible:ring-offset-2 focus-visible:ring-offset-[#d6ae58] active:translate-y-[1px]" style={{ background: "linear-gradient(180deg,#2a2e37 0%,#12141a 46%,#07080b 100%)", boxShadow: "0 2px 0 rgba(255,240,190,0.7), 0 -1px 0 rgba(40,25,0,0.6), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -2px 3px rgba(0,0,0,0.8)", fontFamily: FONT }}>
              <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full" style={{ background: BLUE, boxShadow: `0 0 8px 1px ${BLUE}` }} />
              {ticket || phase !== "type" ? "Write another" : "Slide it through"}
            </button>
            {/* Inside the booth the tray sits in blue shade. */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[30px] transition-opacity duration-300" style={{ background: "linear-gradient(180deg,rgba(20,40,90,0.5),rgba(11,13,18,0.55))", opacity: inside ? 1 : 0 }} />
          </motion.div>

          {/* The reading light that crosses the tray. */}
          <motion.div aria-hidden="true" className="pointer-events-none absolute top-[190px] z-[15] h-[170px] w-[70px] rounded-full" style={{ left: 60, background: `linear-gradient(90deg,rgba(79,152,251,0),${BLUE} 45%,#eaf3ff 50%,${BLUE} 55%,rgba(79,152,251,0))`, filter: "blur(7px)", mixBlendMode: "screen" }} initial={false} animate={phase === "scan" && !reduce ? { x: [40, 360], opacity: [0, 1, 1, 0] } : { x: 40, opacity: 0 }} transition={{ duration: 0.5, ease: "easeInOut" }} />

          {/* The pane: a tint, two reflections and a speaking grille. The tray softens itself while it is behind it. */}
          <div aria-hidden="true" className="pointer-events-none absolute left-[84px] top-[48px] z-20 h-[312px] w-[392px] overflow-hidden rounded-t-[196px]" style={{ background: "linear-gradient(180deg,rgba(190,215,255,0.13),rgba(120,160,230,0.05) 60%,rgba(190,215,255,0.12))", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.22), inset 0 -3px 0 rgba(215,232,255,0.6), inset 0 -4px 0 rgba(0,0,0,0.4)" }}>
            <span className="absolute -top-[40px] h-[460px] w-[70px] rotate-[24deg]" style={{ left: 86, transform: "translateX(var(--gx,0px)) rotate(24deg)", background: "linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,0.2) 40%,rgba(255,255,255,0.05) 100%)" }} />
            <span className="absolute -top-[40px] h-[460px] w-[22px]" style={{ left: 176, transform: "translateX(var(--gx,0px)) rotate(24deg)", background: "linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,0.16))" }} />
            <span className="absolute left-0 top-0 h-full w-full rounded-t-[196px]" style={{ boxShadow: "inset 18px 22px 40px -22px rgba(255,255,255,0.5)" }} />
          </div>
          <div aria-hidden="true" className="absolute left-[252px] top-[142px] z-20 h-[56px] w-[56px] rounded-full" style={{ background: BRASS, boxShadow: "0 3px 6px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.8), inset 0 -1px 1px rgba(60,40,10,0.8)" }}>
            <span className="absolute inset-[7px] rounded-full" style={{ backgroundColor: "#0a0c10", backgroundImage: "radial-gradient(circle,#2a3142 1.6px,rgba(0,0,0,0) 2px)", backgroundSize: "9px 9px", backgroundPosition: "center", boxShadow: "inset 0 2px 4px #000, 0 1px 0 rgba(255,240,190,0.7)" }} />
          </div>

          {/* The rail the tray passes under. */}
          <div aria-hidden="true" className="absolute left-[50px] top-[356px] z-30 h-[24px] w-[460px] rounded-[7px]" style={{ background: BRASS, boxShadow: "0 12px 16px -6px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -1px 0 rgba(60,40,10,0.9)" }}>
            <span className="absolute left-1/2 top-[7px] -translate-x-1/2 font-mono text-[8px] font-bold uppercase tracking-[0.34em] text-[#3d2a08]/85" style={{ textShadow: "0 1px 0 rgba(255,240,190,0.7)" }}>One sentence per slip</span>
            <span className="absolute left-[12px] top-[8px] h-[8px] w-[8px] rounded-full" style={{ background: "radial-gradient(circle at 35% 30%,#fff3c8,#a67a2c 60%,#5b4012)", boxShadow: "inset 0 0 0 1px rgba(60,40,10,0.6)" }} />
            <span className="absolute right-[12px] top-[8px] h-[8px] w-[8px] rounded-full" style={{ background: "radial-gradient(circle at 35% 30%,#fff3c8,#a67a2c 60%,#5b4012)", boxShadow: "inset 0 0 0 1px rgba(60,40,10,0.6)" }} />
          </div>

          <p className="absolute left-0 top-[654px] w-full text-center text-[12px] font-semibold tracking-[-0.005em] text-[#4a4f5a]">Write on the slip, then press Enter</p>
          <p className="sr-only" role="status">{said}</p>
        </div>
      </div>
    </div>
  );
}
