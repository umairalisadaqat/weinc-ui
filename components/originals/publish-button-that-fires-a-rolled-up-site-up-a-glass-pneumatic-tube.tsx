import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

// The pages that take turns in the carrier. Each is a rolled print: a photograph over a strip of paper.
const drafts = [
  { name: "Halloway Flowers", paper: "#F3EEE4", ink: "#26221C", tone: "#2E9CC4", focus: "50% 22%", src: "https://images.pexels.com/photos/5254322/pexels-photo-5254322.jpeg?auto=compress&cs=tinysrgb&w=640", alt: "A woman holding white carnations against a blue backdrop, printed on a rolled sheet" },
  { name: "Halloway Flowers, new hero", paper: "#F2552C", ink: "#170803", tone: "#C4621C", focus: "40% 30%", src: "https://images.pexels.com/photos/9956564/pexels-photo-9956564.jpeg?auto=compress&cs=tinysrgb&w=640", alt: "A man in profile holding a bouquet against an orange wall, printed on a rolled sheet" },
  { name: "Halloway Flowers, evening menu", paper: "#15161B", ink: "#EFEBE4", tone: "#0A0A0C", focus: "50% 55%", src: "https://images.pexels.com/photos/17498111/pexels-photo-17498111.jpeg?auto=compress&cs=tinysrgb&w=640", alt: "Poppies in a glass vase against a black background, printed on a rolled sheet" },
];
const BLUE = "#4F98FB";
const RELOAD = 1500; // milliseconds between a carrier leaving and the next one rising into the tube
const EVERY = 4400; // how often the self-running demo presses the button

const STEEL = "linear-gradient(90deg,#15171b 0%,#4a4f58 9%,#aeb5c0 22%,#f1f4f8 31%,#8d949f 44%,#444951 62%,#6f7681 78%,#2a2d33 92%,#111215 100%)";
const RUBBER = `linear-gradient(90deg,#123a7c 0%,#2f74dc 12%,${BLUE} 24%,#b9d8ff 33%,${BLUE} 44%,#2f74dc 66%,#1c4c9c 86%,#0e2d63 100%)`;

function Screw({ className }: { className: string }) {
  return (
    <span aria-hidden="true" className={`absolute h-[10px] w-[10px] rounded-full shadow-[0_1px_1px_rgba(255,255,255,0.12),inset_0_1px_1px_rgba(255,255,255,0.5),inset_0_-1px_1px_rgba(0,0,0,0.6)] ${className}`} style={{ background: "radial-gradient(circle at 35% 30%,#c9ced6,#6b717b 55%,#2b2e34)" }}>
      <span className="absolute left-[1.5px] top-[4.25px] h-[1.5px] w-[7px] rotate-[32deg] rounded-full bg-black/70" />
    </span>
  );
}

function Collar({ bottom, lit, delay, reduce }: { bottom: string; lit: number; delay: number; reduce: boolean }) {
  return (
    <div aria-hidden="true" className="absolute left-1/2 z-20 h-[18px] w-[112px] -translate-x-1/2" style={{ bottom }}>
      <div className="absolute inset-0 rounded-[4px] shadow-[0_6px_10px_-2px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.45),inset_0_-1px_0_rgba(0,0,0,0.6)]" style={{ background: STEEL }} />
      <div className="absolute inset-x-[2px] top-[7px] h-[4px] rounded-full bg-[#06080c] shadow-[inset_0_1px_1px_rgba(0,0,0,0.9)]" />
      {/* A light ring in the collar that flashes as the carrier passes. */}
      <motion.div
        key={lit}
        className="absolute inset-x-[3px] top-[8px] h-[2px] rounded-full"
        style={{ backgroundColor: BLUE, boxShadow: `0 0 10px 2px ${BLUE}, 0 0 26px 6px rgba(79,152,251,0.55)` }}
        initial={{ opacity: 0.12 }}
        animate={{ opacity: lit && !reduce ? [0.12, 1, 0.12] : 0.12 }}
        transition={{ duration: 0.55, delay, times: [0, 0.25, 1] }}
      />
    </div>
  );
}

export default function PublishButtonPneumaticTube() {
  const reduce = !!useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const [sent, setSent] = useState(0); // how many carriers have gone up
  const [busy, setBusy] = useState(false);
  const [down, setDown] = useState(false);
  const [live, setLive] = useState(false);
  const [gone, setGone] = useState(false); // the carrier has left and the next has not arrived
  const [armed, setArmed] = useState(false); // pointer or focus is on the key: the air builds
  const busyRef = useRef(false);
  const touched = useRef(-1e9);
  const timers = useRef<number[]>([]);

  const fire = () => {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true);
    setSent((n) => n + 1);
    timers.current.push(window.setTimeout(() => { setLive(true); setGone(true); }, reduce ? 0 : 560));
    timers.current.push(window.setTimeout(() => { busyRef.current = false; setBusy(false); setGone(false); }, reduce ? 900 : RELOAD + 900));
  };

  useEffect(() => {
    if (reduce) return;
    let seen = true;
    const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; });
    if (root.current) io.observe(root.current);
    let next = performance.now() + 5200;
    const tick = window.setInterval(() => {
      const now = performance.now();
      if (!seen || document.hidden || busyRef.current || now - touched.current < 7000 || now < next) return;
      next = now + EVERY;
      setDown(true);
      timers.current.push(window.setTimeout(() => { setDown(false); fire(); }, 190));
    }, 200);
    return () => { window.clearInterval(tick); io.disconnect(); timers.current.forEach((t) => window.clearTimeout(t)); timers.current = []; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  const d = drafts[sent % drafts.length];

  return (
    <div
      ref={root}
      className="relative flex min-h-[640px] w-full select-none flex-col items-center justify-end overflow-hidden bg-[#0B0D12] bg-[radial-gradient(58%_52%_at_50%_46%,#1b2231_0%,#10141c_46%,#0B0D12_78%)] pb-[58px] text-[#F6F4EF] sm:min-h-[800px] sm:pb-[84px]"
      style={{ fontFamily: '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif' }}
    >
      <style>{`
        @keyframes publish-button-that-fires-a-rolled-up-site-up-a-glass-pneumatic-tube-float { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-5px) } }
        @keyframes publish-button-that-fires-a-rolled-up-site-up-a-glass-pneumatic-tube-rattle { 0%,100% { transform: translateX(0) } 20% { transform: translateX(-1.5px) } 40% { transform: translateX(1.5px) } 60% { transform: translateX(-1px) } 80% { transform: translateX(0.6px) } }
        .publish-tube-float { animation: publish-button-that-fires-a-rolled-up-site-up-a-glass-pneumatic-tube-float 2.8s ease-in-out infinite }
        .publish-tube-rattle { animation: publish-button-that-fires-a-rolled-up-site-up-a-glass-pneumatic-tube-rattle 0.32s linear 2 }
        @media (prefers-reduced-motion: reduce) { .publish-tube-float, .publish-tube-rattle { animation: none } }
      `}</style>

      {/* The station. */}
      <div className="relative z-30 w-[300px] max-w-[calc(100%-32px)] origin-bottom sm:scale-[1.28]">
      {/* The glass tube, from the station up and out of the frame. */}
      <div className="absolute bottom-full left-1/2 mb-[-6px] h-[1100px] w-[92px] -translate-x-1/2">
        <div className="absolute inset-0 overflow-hidden border-x border-white/25" style={{ background: "linear-gradient(90deg,rgba(190,215,255,0.16) 0%,rgba(190,215,255,0.04) 10%,rgba(120,160,230,0.02) 30%,rgba(120,160,230,0.02) 70%,rgba(190,215,255,0.05) 90%,rgba(190,215,255,0.18) 100%),linear-gradient(0deg,rgba(6,9,15,0.5),rgba(6,9,15,0.5))" }}>
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[230px] bg-gradient-to-t from-[#4F98FB]/25 via-[#4F98FB]/[0.06] to-transparent" />
          {/* Air rushing up behind the carrier. */}
          {sent > 0 && !reduce ? [14, 30, 46, 61, 75].map((x, i) => (
            <motion.span key={`${sent}-${x}`} aria-hidden="true" className="absolute bottom-0 w-px rounded-full bg-gradient-to-t from-transparent via-white/70 to-transparent" style={{ left: x, height: 150 + i * 22 }} initial={{ y: 120, opacity: 0 }} animate={{ y: -1000, opacity: [0, 0.8, 0] }} transition={{ duration: 0.62 + i * 0.05, delay: 0.14 + (i % 3) * 0.05, ease: "easeIn" }} />
          )) : null}

          <AnimatePresence initial={false}>
            <motion.div
              key={sent}
              className="absolute bottom-[40px] left-[9px] w-[72px]"
              initial={reduce ? { y: 0, opacity: 0 } : { y: 250, opacity: 1 }}
              animate={{ y: 0, opacity: 1, transition: reduce ? { duration: 0.2, delay: 0.3 } : { type: "spring", stiffness: 120, damping: 13, delay: RELOAD / 1000 } }}
              exit={reduce ? { opacity: 0, transition: { duration: 0.15 } } : { y: [0, 9, -1150], scaleY: [1, 0.95, 1.3], transition: { duration: 0.66, times: [0, 0.24, 1], ease: ["easeOut", [0.6, 0, 0.9, 0.5]] } }}
              style={{ transformOrigin: "50% 100%" }}
            >
              <div className="publish-tube-float relative h-[176px] w-full"><div className="absolute inset-0 transition-transform duration-500 ease-out motion-reduce:transition-none" style={{ transform: `translateY(${armed && !busy ? -9 : 0}px)` }}>
                {/* the carrier: two rubber ends and a clear sleeve */}
                <div className="absolute inset-x-0 top-0 h-[26px] rounded-[9px_9px_5px_5px] shadow-[inset_0_2px_1px_rgba(255,255,255,0.35),inset_0_-3px_4px_rgba(4,18,48,0.55)]" style={{ background: RUBBER }} />
                <div className="absolute inset-x-[3px] top-[26px] h-[5px] bg-[#0b2553]" style={{ backgroundImage: "linear-gradient(90deg,rgba(0,0,0,0.5),rgba(120,170,255,0.35) 30%,rgba(0,0,0,0.15) 55%,rgba(0,0,0,0.6))" }} />
                <div className="absolute inset-x-0 bottom-0 h-[26px] rounded-[5px_5px_9px_9px] shadow-[inset_0_2px_1px_rgba(255,255,255,0.3),inset_0_-3px_4px_rgba(4,18,48,0.6)]" style={{ background: RUBBER }} />
                <div className="absolute inset-x-[3px] bottom-[26px] h-[5px] bg-[#0b2553]" style={{ backgroundImage: "linear-gradient(90deg,rgba(0,0,0,0.5),rgba(120,170,255,0.35) 30%,rgba(0,0,0,0.15) 55%,rgba(0,0,0,0.6))" }} />
                <div className="absolute inset-x-[5px] bottom-[31px] top-[31px] overflow-hidden border-x border-white/30" style={{ background: "linear-gradient(90deg,rgba(255,255,255,0.14),rgba(255,255,255,0.03) 22%,rgba(255,255,255,0.02) 75%,rgba(255,255,255,0.12))" }}>
                  {/* the rolled page */}
                  <div className="absolute inset-x-[6px] bottom-[5px] top-[5px] overflow-hidden" style={{ backgroundColor: d.paper, borderRadius: "25px / 5px" }}>
                    <div className="h-[62%] w-full" style={{ backgroundColor: d.tone }}>
                      <img src={d.src} alt={d.alt} draggable={false} className="h-full w-full object-cover" style={{ objectPosition: d.focus }} />
                    </div>
                    <div className="px-[7px] pt-[6px]" style={{ color: d.ink }}>
                      <div className="text-[6px] font-black leading-none tracking-[-0.02em]">HALLOWAY</div>
                      <div className="mt-[4px] h-[2px] w-[30px] rounded-full bg-current opacity-60" />
                      <div className="mt-[3px] h-[2px] w-[22px] rounded-full bg-current opacity-40" />
                    </div>
                    {/* the curve of the roll, and the loose edge of the sheet */}
                    <div className="absolute inset-0" style={{ background: "linear-gradient(90deg,rgba(0,0,0,0.62) 0%,rgba(0,0,0,0.12) 20%,rgba(255,255,255,0.2) 36%,rgba(255,255,255,0) 52%,rgba(0,0,0,0.28) 80%,rgba(0,0,0,0.7) 100%)" }} />
                    <div className="absolute bottom-0 right-[9px] top-0 w-px bg-black/35" />
                    <div className="absolute bottom-0 right-[8px] top-0 w-px bg-white/25" />
                  </div>
                  <div className="absolute bottom-0 left-[5px] top-0 w-[2px] bg-white/55 blur-[0.5px]" />
                  <div className="absolute bottom-0 left-[10px] top-0 w-[7px] bg-gradient-to-r from-white/20 to-transparent" />
                </div>
              </div></div>
            </motion.div>
          </AnimatePresence>
        </div>
        {/* reflections on the front of the glass */}
        <div key={`glass-${sent}`} aria-hidden="true" className={`pointer-events-none absolute inset-0 ${sent ? "publish-tube-rattle" : ""}`}>
          <div className="absolute bottom-0 left-[7px] top-0 w-[3px] bg-white/60 blur-[0.7px]" />
          <div className="absolute bottom-0 left-[13px] top-0 w-[14px] bg-gradient-to-r from-white/[0.16] to-transparent" />
          <div className="absolute bottom-0 right-[6px] top-0 w-[1.5px] bg-white/35" />
          <div className="absolute bottom-0 right-[10px] top-0 w-[18px] bg-gradient-to-l from-[#9cc6ff]/[0.09] to-transparent" />
        </div>
      </div>
      <Collar bottom="calc(100% + 446px)" lit={sent} delay={0.5} reduce={reduce} />
      <Collar bottom="calc(100% + 262px)" lit={sent} delay={0.4} reduce={reduce} />

      {/* The lamp plate on the top collar. */}
      <div className="absolute bottom-[calc(100%+257px)] left-1/2 z-20 ml-[64px] flex h-[28px] items-center gap-[7px] rounded-[5px] bg-[#0e1014] pl-[9px] pr-[11px] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-1px_0_rgba(0,0,0,0.7),0_8px_14px_-6px_rgba(0,0,0,0.8)]">
        <span aria-hidden="true" className="relative h-[8px] w-[8px] rounded-full bg-[#06080c] shadow-[inset_0_1px_1px_rgba(0,0,0,0.9),0_1px_0_rgba(255,255,255,0.12)]">
          <span className="absolute inset-[1px] rounded-full transition-all duration-500 motion-reduce:transition-none" style={{ backgroundColor: BLUE, opacity: live ? 1 : 0.14, boxShadow: live ? `0 0 10px 3px rgba(79,152,251,0.8)` : "none" }} />
        </span>
        <span className={`text-[10px] font-extrabold uppercase tracking-[0.16em] transition-colors duration-500 motion-reduce:transition-none ${live ? "text-[#F6F4EF]" : "text-[#F6F4EF]/55"}`}>Live</span>
      </div>

        <div aria-hidden="true" className="absolute left-1/2 top-[-14px] h-[26px] w-[136px] -translate-x-1/2 rounded-[6px] shadow-[0_8px_14px_-4px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(0,0,0,0.6)]" style={{ background: STEEL }}>
          <div className="absolute inset-x-[10px] top-[4px] h-[5px] rounded-full bg-[#05070a] shadow-[inset_0_1px_2px_rgba(0,0,0,1)]" />
        </div>
        <div aria-hidden="true" className="absolute inset-x-[18px] bottom-[-26px] h-[40px] rounded-[50%] bg-black/70 blur-[18px]" />
        <motion.div initial={false} animate={{ y: busy && !reduce ? [0, 4, 0] : 0 }} transition={{ duration: 0.34, ease: "easeOut" }} className="relative rounded-[26px] px-[20px] pb-[26px] pt-[32px] shadow-[inset_0_1.5px_0_rgba(255,255,255,0.22),inset_0_10px_14px_-8px_rgba(255,255,255,0.10),inset_0_-10px_14px_-6px_rgba(0,0,0,0.55),inset_0_0_0_1px_rgba(255,255,255,0.05),0_7px_0_#07080a,0_8px_0_rgba(255,255,255,0.06),0_40px_60px_-18px_rgba(0,0,0,0.95)]" style={{ background: "repeating-linear-gradient(90deg,rgba(255,255,255,0.016) 0 1px,rgba(0,0,0,0) 1px 3px),linear-gradient(180deg,#262a31 0%,#191c21 55%,#111317 100%)" }}>
          <Screw className="left-[12px] top-[12px]" /><Screw className="right-[12px] top-[12px]" /><Screw className="bottom-[12px] left-[12px]" /><Screw className="bottom-[12px] right-[12px]" />
          <div className="flex items-center justify-between gap-[14px] px-[6px]">
            {/* pressure gauge */}
            <div aria-hidden="true" className="relative h-[74px] w-[74px] shrink-0 rounded-full p-[5px] shadow-[0_6px_10px_-3px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.5)]" style={{ background: "conic-gradient(from 210deg,#eef1f5,#6d737d,#d5dae1,#3c4047,#b9bfc8,#50555d,#eef1f5)" }}>
              <div className="relative h-full w-full overflow-hidden rounded-full bg-[#F6F4EF] shadow-[inset_0_3px_6px_rgba(0,0,0,0.45)]">
                <div className="absolute inset-[4px] rounded-full" style={{ background: "repeating-conic-gradient(from -120deg,#0B0D12 0deg 1.2deg,transparent 1.2deg 20deg)", WebkitMask: "radial-gradient(circle,transparent 62%,#000 63%)", mask: "radial-gradient(circle,transparent 62%,#000 63%)" }} />
                <div className="absolute inset-[4px] rounded-full" style={{ background: `conic-gradient(from 30deg,${BLUE} 0deg 60deg,transparent 60deg)`, WebkitMask: "radial-gradient(circle,transparent 50%,#000 51%,#000 58%,transparent 59%)", mask: "radial-gradient(circle,transparent 50%,#000 51%,#000 58%,transparent 59%)" }} />
                <div className="absolute inset-x-0 bottom-0 h-[38%] bg-[#F6F4EF]" />
                <div className="absolute inset-x-0 bottom-[9px] text-center text-[5.5px] font-extrabold uppercase tracking-[0.18em] text-[#0B0D12]/70">Air</div>
                <motion.div className="absolute left-1/2 top-1/2 h-[26px] w-[2px] rounded-full bg-[#0B0D12]" style={{ marginLeft: -1, marginTop: -26, transformOrigin: "50% 100%" }} initial={false} animate={{ rotate: busy ? -78 : armed ? 76 : 58 }} transition={reduce ? { duration: 0 } : busy ? { type: "spring", stiffness: 260, damping: 9 } : { type: "spring", stiffness: 40, damping: 9 }} />
                <div className="absolute left-1/2 top-1/2 h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.5)]" style={{ background: "radial-gradient(circle at 35% 30%,#d7dbe1,#5a6069)" }} />
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/60 via-white/0 to-transparent" style={{ WebkitMask: "radial-gradient(120% 120% at 20% 10%,#000 30%,transparent 55%)", mask: "radial-gradient(120% 120% at 20% 10%,#000 30%,transparent 55%)" }} />
              </div>
            </div>

            {/* the button: a thick pill in a milled slot */}
            <div className="relative h-[76px] flex-1 rounded-full bg-[#07090c] shadow-[inset_0_3px_6px_rgba(0,0,0,0.95),inset_0_-1px_0_rgba(255,255,255,0.1),0_1px_0_rgba(255,255,255,0.08)]">
              <div aria-hidden="true" className="pointer-events-none absolute inset-[-10px] rounded-full opacity-70 blur-[16px]" style={{ background: "radial-gradient(closest-side,rgba(79,152,251,0.45),rgba(79,152,251,0))" }} />
              <button
                type="button"
                aria-disabled={busy}
                onPointerDown={() => { touched.current = performance.now(); if (!busy) setDown(true); }}
                onPointerUp={() => setDown(false)}
                onPointerEnter={() => setArmed(true)}
                onPointerLeave={() => { setDown(false); setArmed(false); }}
                onFocus={() => setArmed(true)}
                onKeyDown={(e) => { if ((e.key === " " || e.key === "Enter") && !busy) setDown(true); }}
                onKeyUp={() => setDown(false)}
                onBlur={() => { setDown(false); setArmed(false); }}
                onClick={() => { touched.current = performance.now(); fire(); }}
                className="group absolute inset-[6px] rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#F6F4EF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07090c]"
              >
                {/* side wall of the key, then the cap that travels */}
                <span aria-hidden="true" className="absolute inset-0 rounded-full" style={{ background: "linear-gradient(180deg,#2a66c9,#143a7c)", boxShadow: "0 3px 5px rgba(0,0,0,0.7)" }} />
                <span
                  className="absolute inset-x-0 top-0 flex h-[calc(100%-9px)] items-center justify-center rounded-full text-[19px] font-extrabold tracking-[-0.03em] text-[#0B0D12] transition-transform duration-100 ease-out motion-reduce:transition-none"
                  style={{ transform: `translateY(${down || busy ? 7 : 0}px)`, background: `linear-gradient(180deg,#9cc6ff 0%,#6eabff 14%,${BLUE} 52%,#3f86ec 100%)`, boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.75), inset 0 -3px 5px rgba(12,48,120,0.45), inset 0 0 0 1px rgba(255,255,255,0.14)" }}
                >
                  <span className="absolute inset-x-[14px] top-[4px] h-[38%] rounded-full bg-gradient-to-b from-white/45 to-white/0" aria-hidden="true" />
                  <span className="relative">Publish</span>
                </span>
              </button>
            </div>
          </div>
        </motion.div>
        <p aria-live="polite" className="absolute inset-x-[-40px] top-full mt-[20px] text-center text-[11px] font-bold tracking-[-0.005em] text-[#F6F4EF]/70">
          {gone ? "Sent. The site is live." : `${drafts[(busy && !gone ? sent + drafts.length - 1 : sent) % drafts.length].name}: ready to send`}
        </p>
      </div>
    </div>
  );
}
