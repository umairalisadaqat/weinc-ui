import { useEffect, useRef, useState, type CSSProperties } from "react";

// The edits, in the order the demo types them. The doorway starts in the state the first one describes.
// Each edit changes one thing: the door paint, the name on the sign, or the hour on the clock plate.
const edits = [
  { say: "Paint the front door blue", door: 1 },
  { say: "Rename the shop Fig & Thistle", name: 1 },
  { say: "Open at eight, not nine", hour: 8 },
  { say: "Make the door black", door: 0 },
  { say: "Call it Marlow & Fig again", name: 0 },
  { say: "Go back to opening at nine", hour: 9 },
] as { say: string; door?: number; name?: number; hour?: number }[];
const names = [["Marlow", "& Fig"], ["Fig &", "Thistle"]];
const paints = ["#15171D", "#4F98FB"]; // black gloss, blue gloss
const hourWord: Record<number, string> = { 8: "eight", 9: "nine" };
const NUMBER = "14";
const BLUE = "#4F98FB";
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';

const BW = 760, BH = 540, FLOOR = 506; // layout box and the line where wall meets pavement
const DX = 270, DY = 176, DW = 220, DH = 328; // the door leaf
const PX = 638, PY = 127; // where the sign hangs from its bracket

const BRASS = "linear-gradient(180deg,#FFF1C2 0%,#D8AC4E 38%,#9A6E22 78%,#5E3F10 100%)";
const raised: CSSProperties = { boxShadow: "inset 1.5px 1.5px 0 rgba(255,255,255,0.34), inset -1.5px -1.5px 0 rgba(0,0,0,0.42), 0 0 0 1px rgba(0,0,0,0.28), 0 0 0 2.5px rgba(255,255,255,0.1)", background: "linear-gradient(135deg,rgba(255,255,255,0.1),rgba(255,255,255,0) 45%,rgba(0,0,0,0.12))" };

export default function EditedDoorway() {
  const stage = useRef<HTMLDivElement>(null);
  const swing = useRef<HTMLDivElement>(null);
  const run = useRef<(kind: "door" | "name" | "hour") => void>(() => {});
  const [zoom, setZoom] = useState(1);
  const [typed, setTyped] = useState(edits[0].say);
  const [typing, setTyping] = useState(false);
  const [door, setDoor] = useState({ from: 1, to: 1, key: 0 });
  const [sign, setSign] = useState({ was: 0, now: 0, key: 0 });
  const [hour, setHour] = useState(9);

  useEffect(() => {
    const st = stage.current, sw = swing.current;
    if (!st || !sw) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fit = () => setZoom(Math.max(0.44, Math.min(1.16, (st.clientWidth + 16) / BW)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(st);

    // the sign is a pendulum on two chains: a little wind, and a hard knock when a new board is hung
    const s = { a: reduce ? 0 : 0.07, v: 0, gust: 0 };
    let raf = 0, last = 0, seen = true;
    const frame = (now: number) => {
      raf = 0;
      const dt = Math.max(0.004, Math.min(0.032, (now - last) / 1000 || 0.016)); last = now;
      if (now > s.gust) { s.v += (Math.random() - 0.4) * 0.5; s.gust = now + 2200 + Math.random() * 2600; }
      s.v += (-30 * s.a - 0.9 * s.v) * dt; s.a += s.v * dt;
      sw.style.transform = `rotate(${((s.a * 180) / Math.PI).toFixed(3)}deg)`;
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };

    const cur = { door: 1, name: 0, hour: 9 };
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => { timers.push(window.setTimeout(fn, ms)); };
    const apply = (e: (typeof edits)[number]) => {
      if (e.door !== undefined && e.door !== cur.door) { const from = cur.door; cur.door = e.door; setDoor((d) => ({ from, to: e.door as number, key: d.key + 1 })); }
      if (e.name !== undefined && e.name !== cur.name) { const was = cur.name; cur.name = e.name; setSign((g) => ({ was, now: e.name as number, key: g.key + 1 })); later(() => { s.v += 2.1; wake(); }, reduce ? 0 : 700); }
      if (e.hour !== undefined && e.hour !== cur.hour) { cur.hour = e.hour; setHour(e.hour); }
    };
    let touched = -1e9, at = 1, typer = 0;
    const type = (e: (typeof edits)[number], done: () => void) => {
      window.clearInterval(typer);
      if (reduce) { setTyped(e.say); setTyping(false); apply(e); done(); return; }
      let n = 0; setTyping(true); setTyped("");
      typer = window.setInterval(() => {
        n++; setTyped(e.say.slice(0, n));
        if (n >= e.say.length) { window.clearInterval(typer); setTyping(false); later(() => apply(e), 260); done(); }
      }, 34);
    };
    // The demo: hold the finished doorway, then type and apply one edit after another.
    const loop = (wait: number) => later(() => {
      if (seen && !document.hidden && performance.now() - touched > 9000) { const e = edits[at]; at = (at + 1) % edits.length; type(e, () => loop(3600)); } else loop(1200);
    }, wait);
    if (!reduce) loop(3600);
    // A visitor's button: find the edit that changes that one thing from where it is now.
    run.current = (kind) => {
      touched = performance.now();
      const e = edits.find((x) => x[kind] !== undefined && x[kind] !== cur[kind]);
      if (e) type(e, () => {});
    };

    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(st);
    const vis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", vis);
    wake();
    return () => { cancelAnimationFrame(raf); window.clearInterval(typer); timers.forEach((t) => window.clearTimeout(t)); ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", vis); };
  }, []);

  const id = "edited-doorway";
  const board = (lines: string[]) => (
    <div className="absolute" style={{ left: -62, top: 22, width: 124, height: 100 }}>
      <div className="absolute inset-0 rounded-[10px]" style={{ background: "linear-gradient(160deg,#2A2E38 0%,#12141A 45%,#0B0D12 100%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.22), inset 0 -2px 0 rgba(0,0,0,0.6), 0 0 0 1px #000" }} />
      <div className="absolute rounded-[6px]" style={{ inset: 7, border: "1.5px solid #F6F4EF", opacity: 0.9 }} />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-[19px] font-extrabold uppercase leading-[1.08] tracking-[0.06em] text-[#F6F4EF]">
        <span>{lines[0]}</span><span>{lines[1]}</span>
        <span className="mt-1.5 block h-[3px] w-7 rounded-full" style={{ background: BLUE }} />
      </div>
      {[26, 98].map((x) => <div key={x} className="absolute rounded-full" style={{ left: x - 4, top: -3, width: 8, height: 8, border: "2px solid #7C828D", background: "#0B0D12" }} />)}
    </div>
  );

  return (
    <div className="relative flex min-h-[640px] w-full flex-col items-center justify-center overflow-hidden bg-[#DAD6CC] bg-[radial-gradient(90%_70%_at_30%_18%,#EAE7DF_0%,#DAD6CC_55%,#C9C4B9_100%)] px-4 py-10 text-[#0B0D12] sm:min-h-[780px]" style={{ fontFamily: FONT }}>
      <style>{`
        @keyframes ${id}-coat { 0% { clip-path: inset(0 0 100% 0); } 78%, 100% { clip-path: inset(0 0 0 0); } }
        @keyframes ${id}-roll { 0% { transform: translateY(-30px); opacity: 0; } 10% { opacity: 1; } 78% { transform: translateY(${DH - 26}px); opacity: 1; } 100% { transform: translateY(${DH - 26}px); opacity: 0; } }
        @keyframes ${id}-wet { from { opacity: .55; } to { opacity: 0; } }
        @keyframes ${id}-fall { 0% { transform: rotate(0); opacity: 1; } 30% { transform: rotate(13deg); opacity: 1; } 100% { transform: translate(30px,300px) rotate(46deg); opacity: 0; } }
        @keyframes ${id}-hang { 0% { transform: translateY(-54px); opacity: 0; } 55% { transform: translateY(3px); opacity: 1; } 78% { transform: translateY(-2px); } 100% { transform: none; opacity: 1; } }
        @keyframes ${id}-caret { 50% { opacity: 0; } }
        .${id}-coat { animation: ${id}-coat 1500ms linear both; }
        .${id}-roll { animation: ${id}-roll 1500ms linear both; }
        .${id}-wet { opacity: 0; animation: ${id}-wet 2600ms 900ms ease-out forwards; }
        .${id}-fall { animation: ${id}-fall 620ms cubic-bezier(.5,0,.9,.4) both; transform-origin: -36px 20px; }
        .${id}-hang { animation: ${id}-hang 520ms 420ms cubic-bezier(.3,.9,.4,1) both; }
        .${id}-hand { transition: transform 900ms cubic-bezier(.3,1.7,.45,1); }
        .${id}-caret { animation: ${id}-caret 1s steps(1) infinite; }
        @media (prefers-reduced-motion: reduce) {
          .${id}-coat, .${id}-hang, .${id}-caret { animation: none; }
          .${id}-roll, .${id}-wet, .${id}-fall { animation: none; opacity: 0; }
          .${id}-hand { transition: none; }
        }
      `}</style>

      <div className="relative w-full max-w-[900px]">
        {/* the pavement runs the full width of the stage, from the foot of the wall down */}
        <div aria-hidden="true" className="pointer-events-none absolute" style={{ left: -2000, right: -2000, top: FLOOR * zoom, height: 2400, background: "linear-gradient(180deg,#8F8A7E 0px,#B5B0A4 7px,#C4BFB4 60px,#CFCBC1 400px)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)" }} />

        <div ref={stage} className="relative flex w-full justify-center" style={{ height: BH * zoom }}>
          <div aria-hidden="true" className="relative shrink-0" style={{ width: BW, height: BH, zoom }}>
            {/* shadows the doorcase throws on the wall */}
            <div className="absolute" style={{ left: 250, top: 96, width: 320, height: FLOOR - 96, background: "linear-gradient(90deg,rgba(60,52,36,0) 0%,rgba(60,52,36,0.3) 70%,rgba(60,52,36,0) 100%)", filter: "blur(12px)" }} />
            {/* hood, doorcase and the dark of the opening */}
            <div className="absolute" style={{ left: 232, top: 80, width: 296, height: FLOOR - 80, background: "linear-gradient(90deg,#FFFFFF 0%,#F6F4EF 10%,#F2EFE8 60%,#DEDAD1 100%)", boxShadow: "inset 0 0 0 1px rgba(60,52,36,0.18), inset 9px 0 0 -8px rgba(60,52,36,0.14), inset -9px 0 0 -8px rgba(60,52,36,0.2)" }}>
              <div className="absolute" style={{ left: 12, right: 12, top: 10, bottom: 0, boxShadow: "inset 1px 1px 0 rgba(60,52,36,0.2), inset -1px 0 0 rgba(255,255,255,0.9), 1px 0 0 rgba(60,52,36,0.14), -1px -1px 0 rgba(255,255,255,0.9)" }} />
            </div>
            <div className="absolute" style={{ left: 212, top: 60, width: 336, height: 22, borderRadius: 2, background: "linear-gradient(180deg,#FFFFFF 0%,#F6F4EF 55%,#D5D1C7 100%)", boxShadow: "0 1px 0 rgba(60,52,36,0.35), 0 16px 18px -8px rgba(40,34,20,0.55), 12px 10px 20px -6px rgba(40,34,20,0.3)" }} />
            <div className="absolute" style={{ left: 224, top: 82, width: 312, height: 8, background: "linear-gradient(180deg,#CFCBC1,#EFECE5)", boxShadow: "0 1px 0 rgba(60,52,36,0.25)" }} />
            <div className="absolute" style={{ left: 262, top: 106, width: 236, height: FLOOR - 106, background: "#1B1D22", boxShadow: "inset 0 14px 18px rgba(0,0,0,0.75), inset 10px 0 14px rgba(0,0,0,0.55), inset -3px 0 6px rgba(0,0,0,0.4)" }} />
            {/* fanlight with the street number, lit from the hall behind */}
            <div className="absolute overflow-hidden" style={{ left: DX, top: 114, width: DW, height: 52, background: "radial-gradient(120% 160% at 50% 110%,#FFFDF6 0%,#F3EEDD 45%,#C9C2AC 100%)", boxShadow: "inset 0 6px 10px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(0,0,0,0.5)" }}>
              <div className="absolute inset-0 flex items-center justify-center text-[25px] font-extrabold tracking-[0.04em] text-[#0B0D12]">{NUMBER}</div>
              <div className="absolute" style={{ left: -20, top: -30, width: 90, height: 140, transform: "rotate(28deg)", background: "linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,0.5),rgba(255,255,255,0))" }} />
            </div>
            <div className="absolute" style={{ left: 262, top: 166, width: 236, height: 10, background: "linear-gradient(180deg,#FFFFFF,#DAD6CC)", boxShadow: "0 3px 5px rgba(0,0,0,0.5)" }} />

            {/* the door: old paint, the new coat rolled over it, then everything fixed to its face */}
            <div className="absolute overflow-hidden" style={{ left: DX, top: DY, width: DW, height: DH, background: paints[door.from], boxShadow: "0 0 0 1px rgba(0,0,0,0.6)" }}>
              <div key={door.key} className={"absolute inset-0 " + (door.key ? `${id}-coat` : "")} style={{ background: paints[door.to] }} />
              <div key={"w" + door.key} className={"absolute inset-0 " + (door.key ? `${id}-wet` : "opacity-0")} style={{ background: "linear-gradient(100deg,rgba(255,255,255,0) 20%,rgba(255,255,255,0.55) 42%,rgba(255,255,255,0) 60%)" }} />
              {/* gloss: light from the upper left, the hood's shadow across the top, dusk at the foot */}
              <div className="absolute inset-0" style={{ background: "linear-gradient(96deg,rgba(255,255,255,0.2) 0%,rgba(255,255,255,0.04) 26%,rgba(255,255,255,0) 50%,rgba(0,0,0,0.2) 100%)" }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,rgba(0,0,0,0.42) 0%,rgba(0,0,0,0) 13%,rgba(0,0,0,0) 80%,rgba(0,0,0,0.25) 100%)" }} />
              {/* glazed upper panel */}
              <div className="absolute" style={{ left: 26, top: 24, width: 168, height: 122, ...raised }} />
              <div className="absolute overflow-hidden" style={{ left: 34, top: 32, width: 152, height: 106, background: "radial-gradient(110% 120% at 50% 100%,#FFFDF6 0%,#EFE9D8 40%,#B7B09B 100%)", boxShadow: "inset 0 5px 9px rgba(0,0,0,0.55), inset 3px 0 6px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(0,0,0,0.55)" }}>
                <div className="absolute" style={{ left: 75, top: 0, width: 2.5, height: 106, background: "rgba(11,13,18,0.5)" }} />
                <div className="absolute" style={{ left: 16, top: -30, width: 46, height: 190, transform: "rotate(24deg)", background: "linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,0.6),rgba(255,255,255,0))" }} />
                <div className="absolute" style={{ left: 70, top: -30, width: 14, height: 190, transform: "rotate(24deg)", background: "rgba(255,255,255,0.35)" }} />
              </div>
              {/* two fielded panels */}
              {[26, 116].map((x) => (
                <div key={x} className="absolute" style={{ left: x, top: 192, width: 78, height: 112, ...raised }}>
                  <div className="absolute" style={{ inset: 9, boxShadow: "inset -1.5px -1.5px 0 rgba(255,255,255,0.28), inset 1.5px 1.5px 0 rgba(0,0,0,0.4)", background: "linear-gradient(135deg,rgba(0,0,0,0.1),rgba(255,255,255,0.05))" }} />
                </div>
              ))}
              {/* letter plate and knob */}
              <div className="absolute rounded-[3px]" style={{ left: 64, top: 158, width: 92, height: 20, background: BRASS, boxShadow: "0 2px 3px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.7), inset 0 0 0 0.5px #4A300C" }}>
                <div className="absolute rounded-[2px]" style={{ left: 10, right: 10, top: 6, height: 8, background: "linear-gradient(180deg,#3B2608,#8A621E)", boxShadow: "inset 0 2px 2px rgba(0,0,0,0.7)" }} />
              </div>
              <div className="absolute rounded-full" style={{ left: 186, top: 158, width: 24, height: 24, background: "rgba(0,0,0,0.5)", filter: "blur(3px)", transform: "translate(4px,6px)" }} />
              <div className="absolute rounded-full" style={{ left: 184, top: 156, width: 26, height: 26, background: "radial-gradient(circle at 36% 30%,#FFF6D2 0%,#E3BC60 28%,#A7772A 62%,#4A300C 100%)", boxShadow: "inset 0 0 0 0.5px #3B2608" }} />
            </div>
            {/* the roller that lays the new coat */}
            {door.key > 0 && (
              <div key={"r" + door.key} className={`${id}-roll pointer-events-none absolute`} style={{ left: DX - 8, top: DY, width: DW + 16, height: 30 }}>
                <svg className="absolute overflow-visible" width={DW + 16} height="30" viewBox={`0 0 ${DW + 16} 30`}>
                  <path d={`M${DW + 12} 15H${DW + 34}V-50H${DW / 2 + 8}V-74`} fill="none" stroke="#2A2D34" strokeWidth="6" strokeLinejoin="round" transform="translate(3 4)" opacity="0.4" />
                  <path d={`M${DW + 12} 15H${DW + 34}V-50H${DW / 2 + 8}V-74`} fill="none" stroke="#9EA4AE" strokeWidth="5" strokeLinejoin="round" />
                  <path d={`M${DW + 12} 14H${DW + 33}V-51H${DW / 2 + 8}`} fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="1.2" />
                  <rect x={DW / 2 - 4} y="-156" width="24" height="84" rx="10" fill="#15171D" />
                  <rect x={DW / 2 - 4} y="-91" width="24" height="7" fill={BLUE} />
                  <rect x={DW / 2} y="-151" width="4" height="74" rx="2" fill="#fff" opacity="0.18" />
                </svg>
                <div className="absolute inset-0 rounded-[15px]" style={{ background: paints[door.to], boxShadow: "0 8px 10px -2px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(0,0,0,0.35)" }} />
                <div className="absolute inset-0 rounded-[15px]" style={{ background: "linear-gradient(180deg,rgba(255,255,255,0.5) 0%,rgba(255,255,255,0.1) 30%,rgba(0,0,0,0) 55%,rgba(0,0,0,0.45) 100%), repeating-linear-gradient(90deg,rgba(255,255,255,0.1) 0 1.5px,rgba(0,0,0,0.08) 1.5px 3px)" }} />
              </div>
            )}
            {/* stone step */}
            <div className="absolute" style={{ left: 228, top: FLOOR + 12, width: 320, height: 16, background: "rgba(40,34,20,0.4)", filter: "blur(7px)" }} />
            <div className="absolute" style={{ left: 236, top: FLOOR - 4, width: 288, height: 18, borderRadius: 2, background: "linear-gradient(180deg,#FFFFFF 0%,#F0EDE6 30%,#D2CEC4 34%,#C2BDB2 100%)", boxShadow: "0 0 0 0.5px rgba(60,52,36,0.4)" }} />

            {/* enamel plate with the opening clock */}
            <div className="absolute rounded-[12px]" style={{ left: 74, top: 234, width: 118, height: 150, background: "rgba(40,34,20,0.38)", filter: "blur(7px)", transform: "translate(8px,10px)" }} />
            <div className="absolute rounded-[12px]" style={{ left: 74, top: 234, width: 118, height: 150, background: "linear-gradient(165deg,#FFFFFF 0%,#F6F4EF 40%,#E2DED5 100%)", boxShadow: "inset 0 0 0 1px #0B0D12, inset 0 0 0 5px #F6F4EF, inset 0 0 0 6.5px #0B0D12, inset 0 2px 0 6px rgba(255,255,255,0.9), 0 1px 0 rgba(0,0,0,0.5)" }}>
              {[[12, 12], [106, 12], [12, 138], [106, 138]].map(([x, y]) => <div key={x + "-" + y} className="absolute rounded-full" style={{ left: x - 3, top: y - 3, width: 6, height: 6, background: "radial-gradient(circle at 35% 30%,#fff,#8B919B 60%,#2A2D34)" }} />)}
              <div className="absolute left-0 right-0 text-center text-[10px] font-extrabold uppercase tracking-[0.2em]" style={{ top: 19 }}>Opens at</div>
              <svg className="absolute" style={{ left: 23, top: 37 }} width="72" height="72" viewBox="-36 -36 72 72">
                <circle r="34" fill="#FDFCF9" stroke="#0B0D12" strokeWidth="2" />
                {Array.from({ length: 12 }, (_, k) => <line key={k} y1="-30" y2={k % 3 ? -27 : -24} stroke="#0B0D12" strokeWidth={k % 3 ? 1.2 : 2.4} transform={`rotate(${k * 30})`} />)}
                <line y1="4" y2="-25" stroke="#0B0D12" strokeWidth="2.6" strokeLinecap="round" />
                <g className={`${id}-hand`} style={{ transform: `rotate(${hour * 30}deg)` }}>
                  <line y1="5" y2="-17" stroke="#000" strokeOpacity="0.25" strokeWidth="5" strokeLinecap="round" transform="translate(1.5 2)" />
                  <line y1="5" y2="-17" stroke={BLUE} strokeWidth="5" strokeLinecap="round" />
                </g>
                <circle r="3.6" fill="#0B0D12" /><circle r="1.2" fill="#F6F4EF" />
              </svg>
              <div className="absolute left-0 right-0 text-center text-[13px] font-extrabold uppercase tracking-[0.12em]" style={{ top: 116 }}>{hourWord[hour] || hour}</div>
            </div>

            {/* iron bracket, and the sign on its two chains */}
            <svg className="absolute overflow-visible" style={{ left: 0, top: 0 }} width={BW} height={BH} viewBox={`0 0 ${BW} ${BH}`}>
              <g transform="translate(9 12)" opacity="0.3" style={{ filter: "blur(5px)" }}><path d="M562 96V200M562 124H716M566 196C566 150 610 130 660 127" fill="none" stroke="#28220F" strokeWidth="7" /></g>
              <rect x="556" y="92" width="12" height="112" rx="3" fill="#15171D" stroke="#000" strokeWidth="0.6" />
              <rect x="557.5" y="93" width="2.5" height="110" rx="1" fill="#fff" opacity="0.22" />
              {[102, 194].map((y) => <circle key={y} cx="562" cy={y} r="2.6" fill="#5B606A" stroke="#000" strokeWidth="0.5" />)}
              <path d="M568 124H712" stroke="#15171D" strokeWidth="7" strokeLinecap="round" />
              <path d="M568 122H712" stroke="#fff" strokeOpacity="0.28" strokeWidth="1.4" strokeLinecap="round" />
              <path d="M568 196C568 152 612 131 664 128" fill="none" stroke="#15171D" strokeWidth="5" strokeLinecap="round" />
              <path d="M604 168a12 12 0 1 0 10-17" fill="none" stroke="#15171D" strokeWidth="4" strokeLinecap="round" />
              <circle cx="718" cy="124" r="7" fill="#15171D" /><circle cx="715.5" cy="121.5" r="2" fill="#fff" opacity="0.4" />
            </svg>
            <div ref={swing} className="absolute" style={{ left: PX, top: PY, width: 0, height: 0 }}>
              <div className="absolute rounded-[10px]" style={{ left: -48, top: 40, width: 124, height: 100, background: "rgba(40,34,20,0.42)", filter: "blur(9px)" }} />
              {[-36, 36].map((x) => (
                <div key={x} className="absolute" style={{ left: x - 2.5, top: -3, width: 5, height: 26, background: "repeating-linear-gradient(180deg,#3A3E47 0 5px,#9AA0AA 5px 6.5px,#15171D 6.5px 8.5px)", borderRadius: 2.5, boxShadow: "1px 0 0 rgba(255,255,255,0.25) inset" }} />
              ))}
              {sign.key > 0 && <div key={"o" + sign.key} className={`${id}-fall absolute left-0 top-0`}>{board(names[sign.was])}</div>}
              <div key={"n" + sign.key} className={"absolute left-0 top-0 " + (sign.key ? `${id}-hang` : "")}>{board(names[sign.now])}</div>
            </div>
          </div>
        </div>

        {/* the edit being typed, and one button for each thing it can change */}
        <div className="relative z-10 mx-auto mt-7 flex w-full max-w-[520px] flex-col items-center">
          <div className="flex min-h-[54px] w-full items-center gap-3 rounded-full bg-white px-5 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_1px_2px_rgba(40,34,20,0.2),0_16px_30px_-14px_rgba(40,34,20,0.55)]" role="status" aria-live="polite">
            <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: BLUE, boxShadow: "0 0 0 4px rgba(79,152,251,0.18)" }} />
            <span className="min-w-0 truncate text-[16px] font-bold tracking-tight">{typed}</span>
            <span aria-hidden="true" className={`${id}-caret -ml-2 h-5 w-[2px] shrink-0 rounded-full`} style={{ background: BLUE, visibility: typing ? "visible" : "hidden" }} />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {([["door", "Repaint the door"], ["name", "Rehang the sign"], ["hour", "Move the clock"]] as const).map(([kind, label]) => (
              <button key={kind} type="button" onClick={() => run.current(kind)} className="min-h-[42px] rounded-full bg-[#0B0D12] px-4 text-[13px] font-bold tracking-tight text-[#F6F4EF] shadow-[0_1px_0_rgba(255,255,255,0.18)_inset,0_10px_18px_-10px_rgba(11,13,18,0.9)] outline-none transition-transform focus-visible:ring-2 focus-visible:ring-[#0B0D12] focus-visible:ring-offset-2 focus-visible:ring-offset-[#C9C5BA] active:scale-[0.97] motion-reduce:transition-none">
                {label}
              </button>
            ))}
          </div>
          <p className="mt-4 text-center text-[12px] font-semibold tracking-tight text-[#4B473F]">A self-playing demo: the edits and the shop are invented.</p>
        </div>
      </div>
    </div>
  );
}
