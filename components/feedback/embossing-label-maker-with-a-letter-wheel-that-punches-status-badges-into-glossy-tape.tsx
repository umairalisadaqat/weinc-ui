import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

// The tape cartridges. `tone` is the vinyl, `name` is read out to screen readers.
const tapes = [
  { name: "Green", tone: "#1c7a4c" },
  { name: "Black", tone: "#1d1d20" },
  { name: "Cobalt", tone: "#1f4fcf" },
  { name: "Red", tone: "#c22f2a" },
  { name: "Mustard", tone: "#cf9318" },
];
// Labels already stuck down when the page opens, newest first.
const starting = [
  { text: "IN TRANSIT", tape: 2 },
  { text: "ON HOLD", tape: 4 },
  { text: "DISPATCHED", tape: 1 },
];
// What the machine prints by itself until someone uses it.
const demo = [
  { text: "PAID", tape: 0 },
  { text: "OVERDUE", tape: 3 },
  { text: "PACKED", tape: 2 },
  { text: "FRAGILE", tape: 1 },
];
const BODY = "#e3562c"; // the moulded shell
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789&-+/"; // round the wheel, clockwise
const MAX = 10; // longest label, in characters

const SW = 540, SH = 478; // scene, in design pixels
const WX = 404, WY = 150; // wheel centre
const SLOT = 196; // where the tape leaves the nose
const CELL = 16, LEAD = 14, TAPE_H = 28;
const STEP = 360 / CHARS.length;
const widthOf = (text: string) => LEAD * 2 + CELL * text.length;
const clean = (raw: string) => raw.toUpperCase().split("").filter((c) => c === " " || CHARS.includes(c)).join("").slice(0, MAX);
const tilt = [-3.2, 2.4, -1.4, 3.1, -2.2, 1.6];
const drift = [-18, 22, -34, 12, 30, -8];
const teeth = (() => {
  const left: string[] = [], right: string[] = [];
  for (let i = 0; i <= 8; i++) { left.push(`${i % 2 ? 1.6 : 0}px ${(i / 8) * 100}%`); right.unshift(`calc(100% - ${i % 2 ? 0 : 1.6}px) ${(i / 8) * 100}%`); }
  return `polygon(${[...left, ...right].join(",")})`;
})();

function Tape({ text, tone }: { text: string; tone: string }) {
  return (
    <span className="block" style={{ filter: "drop-shadow(0 1px 0.6px rgba(40,24,8,0.5)) drop-shadow(0 4px 5px rgba(40,24,8,0.22))" }}>
      <span
        className="relative flex items-center overflow-hidden"
        style={{ width: widthOf(text), height: TAPE_H, paddingLeft: LEAD, clipPath: teeth, background: `linear-gradient(180deg,rgba(255,255,255,0.34) 0%,rgba(255,255,255,0.1) 26%,rgba(255,255,255,0) 44%,rgba(0,0,0,0) 62%,rgba(0,0,0,0.26) 100%),${tone}` }}
      >
        {text.split("").map((c, i) => (
          <span
            key={i}
            className="relative block text-center font-bold leading-none"
            style={{ width: CELL, fontSize: 15, fontFamily: "ui-rounded,'SF Pro Rounded','Arial Rounded MT Bold','Helvetica Neue',Arial,sans-serif", color: "#f6f2e8", textShadow: "0 0 0.8px rgba(255,255,255,0.9),0.7px 1.1px 0 rgba(0,0,0,0.55),-0.4px -0.5px 0 rgba(255,255,255,0.5),0 0 3px rgba(255,255,255,0.16)" }}
          >
            {c === " " ? " " : c}
          </span>
        ))}
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-white/50" />
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-black/35" />
        <span aria-hidden="true" className="embossing-label-maker-glare absolute inset-0" />
      </span>
    </span>
  );
}

export default function EmbossingLabelMaker() {
  const reduce = useReducedMotion();
  const [labels, setLabels] = useState(starting.map((l, i) => ({ id: i, text: l.text, tape: l.tape })));
  const [job, setJob] = useState<{ text: string; tape: number } | null>(null);
  const [out, setOut] = useState(0);
  const [turn, setTurn] = useState({ deg: 0, ms: 0 });
  const [lens, setLens] = useState("A");
  const [punch, setPunch] = useState(false);
  const [cut, setCut] = useState(false);
  const [draft, setDraft] = useState("READY");
  const [tape, setTape] = useState(3);
  const [scale, setScale] = useState(1);
  const [said, setSaid] = useState("");

  const root = useRef<HTMLElement>(null);
  const live = useRef({ busy: false, alive: true, touched: false, seen: true, at: 0, deg: 0, id: 100, step: 0 });

  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const fit = () => setScale(Math.max(0.58, Math.min(1.12, (node.clientWidth - 20) / SW)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(node);
    const io = new IntersectionObserver(([entry]) => { live.current.seen = entry.isIntersecting; });
    io.observe(node);
    const onMove = (e: PointerEvent) => { const b = node.getBoundingClientRect(); node.style.setProperty("--glare", `${(110 - ((e.clientX - b.left) / b.width) * 120).toFixed(1)}%`); node.dataset.lit = "1"; };
    node.addEventListener("pointermove", onMove);
    return () => { ro.disconnect(); io.disconnect(); node.removeEventListener("pointermove", onMove); };
  }, []);

  const print = async (text: string, tapeIndex: number) => {
    const s = live.current;
    if (s.busy || !text.trim()) return;
    const stick = () => { setLabels((prev) => [{ id: s.id++, text, tape: tapeIndex }, ...prev].slice(0, 4)); setSaid(`Printed ${text} on ${tapes[tapeIndex].name.toLowerCase()} tape`); };
    if (reduce) { stick(); return; }
    s.busy = true;
    const wait = (ms: number) => new Promise<void>((done) => window.setTimeout(done, ms));
    setJob({ text, tape: tapeIndex }); setOut(0);
    await wait(90);
    for (let n = 0; n < text.length && s.alive; n++) {
      const to = CHARS.indexOf(text[n]);
      if (to >= 0 && to !== s.at) {
        // Turn the short way round to the next letter; a longer trip takes a little longer.
        let hop = to - s.at; if (hop > CHARS.length / 2) hop -= CHARS.length; if (hop < -CHARS.length / 2) hop += CHARS.length;
        const ms = 80 + Math.abs(hop) * 7;
        s.at = to; s.deg -= hop * STEP;
        setTurn({ deg: s.deg, ms }); setLens(text[n]);
        await wait(ms + 10);
      }
      setPunch(true); setOut(LEAD + (n + 1) * CELL);
      await wait(80);
      setPunch(false);
      await wait(34);
    }
    setOut(widthOf(text));
    await wait(150);
    setCut(true);
    await wait(100);
    if (!s.alive) return;
    stick(); setJob(null); setOut(0); setCut(false);
    await wait(260);
    s.busy = false;
  };
  const printRef = useRef(print);
  printRef.current = print;

  useEffect(() => {
    const s = live.current;
    s.alive = true;
    if (reduce) return;
    const go = () => { if (s.touched || s.busy || !s.seen || document.hidden) return; const next = demo[s.step++ % demo.length]; printRef.current(next.text, next.tape); };
    const first = window.setTimeout(go, 260);
    const loop = window.setInterval(go, 3800);
    return () => { s.alive = false; window.clearTimeout(first); window.clearInterval(loop); };
  }, [reduce]);

  const text = clean(draft).trim();
  const feed = job ? widthOf(job.text) : 0;
  const BOX = widthOf("W".repeat(MAX));

  return (
    <section
      ref={root}
      className="relative flex min-h-[640px] w-full flex-col items-center justify-center overflow-hidden bg-[#e9e1d0] px-2.5 py-10 sm:min-h-[740px]"
      style={{ backgroundImage: "radial-gradient(90% 70% at 42% 30%,#f6f0e3 0%,#e9e1d0 55%,#d6ccb7 100%)" }}
    >
      <style>{`
        @keyframes embossing-label-maker-glare { 0% { background-position: 120% 0; } 55%, 100% { background-position: -20% 0; } }
        .embossing-label-maker-glare { background: linear-gradient(104deg, rgba(255,255,255,0) 42%, rgba(255,255,255,0.42) 50%, rgba(255,255,255,0) 58%) no-repeat; background-size: 260% 100%; background-position: var(--glare, 120%) 0; animation: embossing-label-maker-glare 4.6s ease-in-out infinite; }
        [data-lit="1"] .embossing-label-maker-glare { animation: none; transition: background-position 0.25s ease-out; }
        @media (prefers-reduced-motion: reduce) { .embossing-label-maker-glare { animation: none; background-position: 46% 0; } }
      `}</style>

      <div style={{ width: SW * scale, height: SH * scale }}>
        <div className="relative" style={{ width: SW, height: SH, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
          {/* shadow of the machine on the desk */}
          <svg aria-hidden="true" className="pointer-events-none absolute left-0 top-0" width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} style={{ overflow: "visible" }}>
            <defs>
              <filter id="embossing-label-maker-soft" x="-30%" y="-30%" width="160%" height="170%"><feGaussianBlur stdDeviation="14" /></filter>
              <filter id="embossing-label-maker-tight" x="-30%" y="-30%" width="160%" height="170%"><feGaussianBlur stdDeviation="3.5" /></filter>
            </defs>
            <g fill="#4a2f12">
              <g filter="url(#embossing-label-maker-soft)" opacity="0.42" transform="translate(10 24)"><circle cx={WX} cy={WY} r="104" /><rect x="190" y="104" width="180" height="92" rx="26" /></g>
              <g filter="url(#embossing-label-maker-tight)" opacity="0.5" transform="translate(3 7)"><circle cx={WX} cy={WY} r="103" /><rect x="191" y="105" width="180" height="90" rx="26" /></g>
            </g>
          </svg>

          {/* the tape being fed out, under the nose */}
          <div aria-hidden="true" className="absolute overflow-hidden" style={{ left: SLOT - BOX, top: WY - TAPE_H / 2 - 12, width: BOX, height: TAPE_H + 30 }}>
            {job ? (
              <div className="absolute left-0 top-[12px] motion-reduce:transition-none" style={{ transform: `translateX(${BOX - out}px)`, transition: "transform 95ms cubic-bezier(0.2,1.5,0.4,1)" }}>
                <Tape text={job.text} tone={tapes[job.tape].tone} />
              </div>
            ) : null}
            <div className="absolute right-0 top-[12px] w-4" style={{ height: TAPE_H, background: "linear-gradient(90deg,rgba(40,16,4,0),rgba(40,16,4,0.5))", opacity: feed ? 1 : 0 }} />
          </div>

          {/* printed labels, newest on top */}
          <ul aria-label="Printed labels" className="absolute left-0 top-0 m-0 list-none p-0">
            <AnimatePresence initial={false}>
              {labels.map((l, i) => {
                const w = widthOf(l.text);
                return (
                  <motion.li
                    key={l.id}
                    className="absolute left-0 top-0"
                    style={{ zIndex: 10 - i, transformOrigin: "50% 50%" }}
                    initial={{ x: SLOT - w - 3, y: WY - TAPE_H / 2, rotate: 0, opacity: 1 }}
                    animate={{ x: 266 - w / 2 + drift[l.id % drift.length], y: 294 + i * 45, rotate: tilt[l.id % tilt.length], opacity: 1 }}
                    exit={{ opacity: 0, y: 294 + i * 45 + 18, transition: { duration: 0.25 } }}
                    transition={{ type: "spring", stiffness: 210, damping: 21, mass: 0.9 }}
                  >
                    <span className="sr-only">{l.text}</span>
                    <span aria-hidden="true"><Tape text={l.text} tone={tapes[l.tape].tone} /></span>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>

          {/* the shell */}
          <svg aria-hidden="true" className="pointer-events-none absolute left-0 top-0" width={SW} height={SH} viewBox={`0 0 ${SW} ${SH}`} style={{ overflow: "visible" }}>
            <defs>
              <filter id="embossing-label-maker-plastic" x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB">
                <feGaussianBlur in="SourceAlpha" stdDeviation="5.5" result="bump" />
                <feDiffuseLighting in="bump" surfaceScale="7" diffuseConstant="1.12" lightingColor="#fff6ec" result="shade"><feDistantLight azimuth="232" elevation="58" /></feDiffuseLighting>
                <feComposite in="shade" in2="SourceGraphic" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="lit" />
                <feSpecularLighting in="bump" surfaceScale="7" specularConstant="0.7" specularExponent="26" lightingColor="#ffffff" result="spec"><feDistantLight azimuth="232" elevation="50" /></feSpecularLighting>
                <feComposite in="spec" in2="SourceAlpha" operator="in" result="gloss" />
                <feMerge result="both"><feMergeNode in="lit" /><feMergeNode in="gloss" /></feMerge>
                <feComposite in="both" in2="SourceAlpha" operator="in" />
              </filter>
              <filter id="embossing-label-maker-key" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
                <feGaussianBlur in="SourceAlpha" stdDeviation="2.6" result="bump" />
                <feDiffuseLighting in="bump" surfaceScale="4" diffuseConstant="1.1" lightingColor="#ffffff" result="shade"><feDistantLight azimuth="232" elevation="60" /></feDiffuseLighting>
                <feComposite in="shade" in2="SourceGraphic" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="lit" />
                <feComposite in="lit" in2="SourceAlpha" operator="in" />
              </filter>
              <linearGradient id="embossing-label-maker-steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f4f5f6" /><stop offset="0.35" stopColor="#aeb3b8" /><stop offset="0.6" stopColor="#e3e6e9" /><stop offset="1" stopColor="#6d7278" /></linearGradient>
            </defs>
            <path filter="url(#embossing-label-maker-plastic)" fill={BODY} d={`M${WX} ${WY - 104}a104 104 0 1 1 0 208a104 104 0 1 1 0-208ZM216 104h154v92H216a26 26 0 0 1-26-26v-40a26 26 0 0 1 26-26Z`} />
            {/* moulded lettering */}
            <text x="207" y="120.6" fontSize="6.4" fontWeight="700" letterSpacing="1.9" fontFamily="ui-sans-serif,system-ui,Helvetica,Arial,sans-serif" fill="#ffb08e" opacity="0.7">FINCH M-40</text>
            <text x="207" y="120" fontSize="6.4" fontWeight="700" letterSpacing="1.9" fontFamily="ui-sans-serif,system-ui,Helvetica,Arial,sans-serif" fill="#9c3312">FINCH M-40</text>
            {/* the press key in its well */}
            <rect x="228" y="129" width="62" height="50" rx="13" fill="#7d280c" opacity="0.85" />
            <rect x="228" y="130.5" width="62" height="50" rx="13" fill="none" stroke="#ffb693" strokeOpacity="0.5" strokeWidth="1" />
            <g style={{ transform: punch ? "translate(0.8px,1.4px) scale(0.965)" : "none", transformOrigin: "259px 154px", transition: "transform 70ms ease-out" }}>
              <rect x="231" y="132" width="56" height="44" rx="10.5" fill={punch ? "#e2dccd" : "#f3eee1"} filter="url(#embossing-label-maker-key)" />
              <path d="M252 150.5l7 7 7-7" fill="none" stroke="#8c8674" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M252 151.4l7 7 7-7" fill="none" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
            </g>
            {/* window onto the cartridge */}
            <circle cx="211" cy={WY} r="8.6" fill="#6d2209" />
            <circle cx="211" cy={WY + 0.9} r="9" fill="none" stroke="#ffb693" strokeOpacity="0.5" strokeWidth="1" />
            <circle cx="211" cy={WY} r="6.8" fill={tapes[job ? job.tape : tape].tone} style={{ transition: "fill 200ms" }} />
            <ellipse cx="208.8" cy={WY - 2.6} rx="3.4" ry="2" fill="#ffffff" opacity="0.55" />
            {/* the well the wheel turns in */}
            <circle cx={WX} cy={WY} r="95.5" fill="#571a06" />
            <circle cx={WX} cy={WY + 1.2} r="96" fill="none" stroke="#ffb693" strokeOpacity="0.55" strokeWidth="1.2" />
            {/* serrated blade at the mouth */}
            <g style={{ transform: cut ? "translateX(-3px)" : "none", transition: "transform 60ms ease-out" }}>
              <path fill="url(#embossing-label-maker-steel)" stroke="#4a4e53" strokeWidth="0.5" d={`M194 ${WY - 21}h-4l-2.4 3 2.4 3-2.4 3 2.4 3-2.4 3 2.4 3-2.4 3 2.4 3-2.4 3 2.4 3-2.4 3 2.4 3-2.4 3 2.4 3h4Z`} />
            </g>
          </svg>

          {/* the letter wheel */}
          <div aria-hidden="true" className="absolute" style={{ left: WX - 92, top: WY - 92, width: 184, height: 184, transform: punch ? "scale(0.986)" : "none", transition: "transform 70ms ease-out" }}>
            <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle at 50% 50%,#2b2b2f 0%,#1d1d20 58%,#0e0e10 100%)", boxShadow: "0 5px 9px rgba(20,6,0,0.55), 0 1px 0 rgba(255,255,255,0.25) inset, 0 -2px 3px rgba(0,0,0,0.8) inset" }} />
            <div className="absolute inset-0 rounded-full motion-reduce:transition-none" style={{ transform: `rotate(${turn.deg}deg)`, transition: `transform ${turn.ms}ms cubic-bezier(0.3,1.35,0.5,1)` }}>
              <div className="absolute inset-0 rounded-full" style={{ background: "repeating-conic-gradient(#08080a 0deg 2.1deg,#45454a 2.1deg 3.1deg,#1a1a1d 3.1deg 4.5deg)", WebkitMaskImage: "radial-gradient(circle,transparent 82px,#000 83px,#000 91px,transparent 92px)", maskImage: "radial-gradient(circle,transparent 82px,#000 83px,#000 91px,transparent 92px)" }} />
              {CHARS.split("").map((c, i) => (
                <span key={c} className="absolute left-1/2 top-1/2 block w-[14px] text-center font-bold leading-none text-[#f1ede2]" style={{ fontSize: 10.5, marginLeft: -7, marginTop: -5.5, transform: `rotate(${i * STEP}deg) translateY(-70px)`, fontFamily: "ui-rounded,'SF Pro Rounded','Arial Rounded MT Bold','Helvetica Neue',Arial,sans-serif" }}>{c}</span>
              ))}
              {[0, 120, 240].map((d) => (
                <span key={d} className="absolute left-1/2 top-1/2 block h-[5px] w-[5px] rounded-full bg-[#f1ede2]" style={{ marginLeft: -2.5, marginTop: -2.5, transform: `rotate(${d}deg) translateY(-52px)`, boxShadow: "0 1px 0 rgba(0,0,0,0.6)" }} />
              ))}
            </div>
            {/* light on the wheel does not turn with it */}
            <div className="absolute inset-0 rounded-full" style={{ background: "conic-gradient(from 200deg,rgba(255,255,255,0.3),rgba(255,255,255,0) 11%,rgba(255,255,255,0) 38%,rgba(255,255,255,0.16) 50%,rgba(255,255,255,0) 62%,rgba(255,255,255,0) 89%,rgba(255,255,255,0.3))", mixBlendMode: "screen" }} />
            <div className="absolute rounded-full" style={{ inset: 11, boxShadow: "0 0 0 1px rgba(255,255,255,0.1), 0 0 0 1px rgba(0,0,0,0.6) inset" }} />
            <div className="absolute rounded-full" style={{ inset: 36, boxShadow: "0 0 0 1px rgba(255,255,255,0.08)" }} />
            {/* hub cap with a thumb dish */}
            <div className="absolute rounded-full" style={{ inset: 49, background: `radial-gradient(circle at 36% 28%,#ff9a70 0%,${BODY} 46%,#a83815 100%)`, boxShadow: "0 4px 7px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.55) inset, 0 -2px 3px rgba(90,24,0,0.6) inset" }} />
            <div className="absolute rounded-full" style={{ inset: 62, background: "radial-gradient(circle at 64% 72%,#ff8e63 0%,#d94c22 48%,#9a3010 100%)", boxShadow: "0 1.5px 2px rgba(60,14,0,0.7) inset, 0 -1px 0 rgba(255,255,255,0.4) inset, 0 1px 0 rgba(255,255,255,0.35)" }} />
          </div>

          {/* reading lens over the chosen letter */}
          <div aria-hidden="true" className="absolute" style={{ left: WX - 19, top: WY - 70 - 21, width: 38, height: 38 }}>
            <div className="absolute left-1/2 top-[-17px] h-[22px] w-[14px] -translate-x-1/2 rounded-[3px]" style={{ background: "linear-gradient(90deg,#8d9197,#f5f6f7 38%,#b9bdc2 62%,#70757b)", boxShadow: "0 2px 3px rgba(0,0,0,0.45)" }} />
            <div className="absolute inset-0 rounded-full" style={{ background: "conic-gradient(from 210deg,#ffffff,#8a8f95 18%,#e9ebee 40%,#5f646a 62%,#d7dadd 82%,#ffffff)", boxShadow: "0 4px 6px rgba(0,0,0,0.55), 0 1px 1px rgba(0,0,0,0.5)" }} />
            <div className="absolute flex items-center justify-center overflow-hidden rounded-full font-bold text-[#f6f2e8]" style={{ inset: 4, fontSize: 19, lineHeight: 1, background: "radial-gradient(circle at 50% 40%,#3a3a3f,#101012 78%)", boxShadow: "0 0 5px rgba(0,0,0,0.9) inset", fontFamily: "ui-rounded,'SF Pro Rounded','Arial Rounded MT Bold','Helvetica Neue',Arial,sans-serif" }}>
              {lens}
              <span className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(60% 46% at 34% 22%,rgba(255,255,255,0.6),rgba(255,255,255,0) 70%),radial-gradient(70% 60% at 70% 96%,rgba(255,255,255,0.2),rgba(255,255,255,0) 70%)" }} />
            </div>
          </div>
        </div>
      </div>

      <form
        className="relative mt-3 flex w-full max-w-[460px] flex-wrap items-center justify-center gap-x-3 gap-y-3"
        onSubmit={(e) => { e.preventDefault(); live.current.touched = true; print(text, tape); }}
      >
        <label htmlFor="embossing-label-maker-text" className="sr-only">Label text, up to {MAX} characters</label>
        <input
          id="embossing-label-maker-text"
          value={draft}
          onChange={(e) => { live.current.touched = true; setDraft(clean(e.target.value)); }}
          onFocus={() => { live.current.touched = true; }}
          maxLength={MAX}
          autoComplete="off"
          spellCheck={false}
          className="h-11 w-[150px] rounded-full border border-[#b9ad95] bg-[#fbf8f1] px-4 font-mono text-[14px] font-semibold uppercase tracking-[0.14em] text-[#2a2520] outline-none placeholder:text-[#6f6656] focus-visible:ring-2 focus-visible:ring-[#b23c1a]"
          placeholder="LABEL"
        />
        <div role="radiogroup" aria-label="Tape colour" className="flex items-center">
          {tapes.map((t, i) => (
            <button
              key={t.name}
              type="button"
              role="radio"
              aria-checked={tape === i}
              aria-label={`${t.name} tape`}
              onClick={() => { live.current.touched = true; setTape(i); }}
              className="flex h-10 w-8 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#b23c1a]"
            >
              <span className="block h-[22px] w-[22px] rounded-full transition-transform duration-200 motion-reduce:transition-none" style={{ background: `linear-gradient(160deg,rgba(255,255,255,0.4),rgba(255,255,255,0) 50%),${t.tone}`, boxShadow: tape === i ? "0 0 0 2px #e9e1d0, 0 0 0 4px #2a2520" : "0 1px 2px rgba(40,24,8,0.5)", transform: tape === i ? "scale(0.86)" : "none" }} />
            </button>
          ))}
        </div>
        <button
          type="submit"
          disabled={!text}
          className="h-11 rounded-full bg-[#2a2520] px-6 font-mono text-[12px] font-semibold uppercase tracking-[0.2em] text-[#fbf8f1] outline-none transition-transform duration-150 hover:bg-black focus-visible:ring-2 focus-visible:ring-[#b23c1a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e9e1d0] active:scale-95 disabled:opacity-50 motion-reduce:transition-none"
        >
          Print
        </button>
      </form>
      <p className="sr-only" aria-live="polite">{said}</p>
    </section>
  );
}
