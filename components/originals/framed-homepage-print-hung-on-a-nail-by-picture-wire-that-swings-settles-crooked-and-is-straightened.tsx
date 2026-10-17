import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";

// The homepage inside the frame. An invented florist.
const site = {
  name: "Marlowe & Fern",
  links: ["Shop", "Weddings", "Visit"],
  headline: "Flowers for the week ahead.",
  copy: "Seasonal bunches, wrapped in paper and ready from eight.",
  cta: "Order a bunch",
  photo: "https://images.pexels.com/photos/5409736/pexels-photo-5409736.jpeg?auto=compress&cs=tinysrgb&w=900",
};
const BLUE = "#4F98FB";
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';

const FW = 430, FH = 540, M = 30; // frame size and the width of its moulding
const DROP = 52; // how far the frame hangs below the nail
const SWING = 40, DAMP = 3.3; // pendulum stiffness and how fast it dies away
const SLIP = 0.3; // how much of a push the wire keeps as a crooked resting angle
const LEVEL = 0.004; // radians either side of true that still read as level

// Oak: two grain patterns of different pitch over a honey base, then the rounded profile of the moulding.
const grain = (deg: number) =>
  `repeating-linear-gradient(${deg}deg,rgba(104,66,26,0) 0 5px,rgba(104,66,26,0.16) 5px 6px,rgba(104,66,26,0) 6px 13px,rgba(88,52,18,0.2) 13px 14.5px,rgba(104,66,26,0) 14.5px 17px),repeating-linear-gradient(${deg}deg,rgba(255,236,200,0.22) 0 2px,rgba(255,236,200,0) 2px 7px),linear-gradient(${deg}deg,#c99a5f,#d8ae74 30%,#c08d52 55%,#d3a66b 80%,#b98549)`;
const sides: { key: string; style: CSSProperties; shade: string }[] = [
  { key: "top", style: { left: 0, top: 0, width: FW, height: M, clipPath: `polygon(0 0,100% 0,calc(100% - ${M}px) 100%,${M}px 100%)`, backgroundImage: grain(0) }, shade: "linear-gradient(180deg,rgba(255,255,255,0.55) 0,rgba(255,255,255,0.12) 22%,rgba(255,255,255,0) 50%,rgba(60,32,6,0.16) 82%,rgba(40,20,2,0.55) 100%)" },
  { key: "bottom", style: { left: 0, top: FH - M, width: FW, height: M, clipPath: `polygon(${M}px 0,calc(100% - ${M}px) 0,100% 100%,0 100%)`, backgroundImage: grain(0) }, shade: "linear-gradient(180deg,rgba(255,255,255,0.5) 0,rgba(255,255,255,0.1) 14%,rgba(60,32,6,0.1) 50%,rgba(60,32,6,0.3) 80%,rgba(40,20,2,0.6) 100%)" },
  { key: "left", style: { left: 0, top: 0, width: M, height: FH, clipPath: `polygon(0 0,100% ${M}px,100% calc(100% - ${M}px),0 100%)`, backgroundImage: grain(90) }, shade: "linear-gradient(90deg,rgba(255,255,255,0.45) 0,rgba(255,255,255,0.1) 22%,rgba(255,255,255,0) 50%,rgba(60,32,6,0.14) 82%,rgba(40,20,2,0.5) 100%)" },
  { key: "right", style: { left: FW - M, top: 0, width: M, height: FH, clipPath: `polygon(0 ${M}px,100% 0,100% 100%,0 calc(100% - ${M}px))`, backgroundImage: grain(90) }, shade: "linear-gradient(90deg,rgba(255,255,255,0.4) 0,rgba(255,255,255,0.06) 14%,rgba(60,32,6,0.12) 50%,rgba(60,32,6,0.32) 80%,rgba(40,20,2,0.62) 100%)" },
];

type Api = { straighten: () => void; nudge: () => void };

export default function FramedHomepagePrint() {
  const stage = useRef<HTMLDivElement>(null);
  const hang = useRef<HTMLDivElement>(null);
  const glass = useRef<HTMLDivElement>(null);
  const bubble = useRef<HTMLSpanElement>(null);
  const api = useRef<Api | null>(null);
  const [zoom, setZoom] = useState(1);
  const [level, setLevel] = useState(false);

  useEffect(() => {
    const st = stage.current, el = hang.current;
    if (!st || !el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fit = () => setZoom(Math.max(0.5, Math.min(1, (st.clientWidth - 28) / (FW + 60))));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(st);

    // a: angle about the nail. rest: the crooked angle the wire has slipped to. y: how far above its hook the frame still is.
    const s = { a: reduce ? 0 : 0.13, av: 0, rest: reduce ? 0 : 0.045, y: reduce ? 0 : -86, yv: 0, drag: false, grabX: 0, grabA: 0, lastX: 0, lastT: 0, isLevel: false, touched: -1e9, light: 0.5 };
    const paint = () => {
      el.style.transform = `translateY(${s.y.toFixed(2)}px) rotate(${s.a.toFixed(4)}rad)`;
      el.style.opacity = String(Math.max(0, Math.min(1, 1 + (s.y + 40) / 46)));
      if (glass.current) glass.current.style.setProperty("--g", `${(s.light * 100 - s.a * 520).toFixed(1)}%`);
      if (bubble.current) bubble.current.style.transform = `translateX(${Math.max(-34, Math.min(34, -s.a * 700)).toFixed(1)}px)`;
      const ok = Math.abs(s.a) < LEVEL && Math.abs(s.av) < 0.02 && !s.drag;
      if (ok !== s.isLevel) { s.isLevel = ok; setLevel(ok); }
    };

    let raf = 0, last = 0, seen = true, auto = 0, draught = 0, started = reduce, begin = () => {};
    const frame = (now: number) => {
      raf = 0;
      const dt = Math.max(0.004, Math.min(0.032, (now - last) / 1000 || 0.016)); last = now;
      if (!s.drag) {
        s.av += (-SWING * (s.a - s.rest) - DAMP * s.av) * dt; s.a += s.av * dt;
        // the frame drops onto the wire and bounces once on it
        s.yv += (-120 * s.y - 9.5 * s.yv) * dt; s.y += s.yv * dt;
      }
      paint();
      const quiet = !s.drag && Math.abs(s.av) < 0.0015 && Math.abs(s.a - s.rest) < 0.0006 && Math.abs(s.y) < 0.05 && Math.abs(s.yv) < 0.05;
      if (quiet) { s.a = s.rest; s.y = 0; paint(); return; }
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (reduce) { s.a = s.rest; s.av = 0; s.y = 0; paint(); return; } if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };

    api.current = {
      straighten: () => { s.touched = performance.now(); s.rest = 0; s.av += s.a > 0 ? -0.05 : 0.05; wake(); },
      nudge: () => { s.touched = performance.now(); const dir = s.rest > 0 ? -1 : 1; s.rest = dir * (0.03 + Math.random() * 0.025); s.av += dir * 0.75; wake(); },
    };

    const down = (e: PointerEvent) => {
      if (reduce) return;
      s.drag = true; s.touched = performance.now(); s.grabX = e.clientX; s.grabA = s.a; s.lastX = e.clientX; s.lastT = performance.now(); s.av = 0;
      el.setPointerCapture(e.pointerId); wake();
    };
    const move = (e: PointerEvent) => {
      const box = st.getBoundingClientRect();
      s.light = (e.clientX - box.left) / box.width;
      if (!s.drag) { if (!raf) paint(); return; }
      const now = performance.now(), next = Math.max(-0.42, Math.min(0.42, s.grabA - (e.clientX - s.grabX) / (FH * 0.9 * zoomNow())));
      s.av = (next - s.a) / Math.max(0.008, (now - s.lastT) / 1000) * 0.6; s.a = next; s.lastT = now;
    };
    const up = () => {
      if (!s.drag) return;
      s.drag = false; s.touched = performance.now();
      s.av = Math.max(-3, Math.min(3, s.av));
      s.rest = Math.max(-0.07, Math.min(0.07, s.a * SLIP));
      wake();
    };
    const zoomNow = () => Math.max(0.5, Math.min(1, (st.clientWidth - 28) / (FW + 60)));
    el.addEventListener("pointerdown", down);
    st.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);

    paint();
    if (!reduce) {
      // The demo, once the photograph has arrived: hung a touch crooked, then put right. After that a draught moves it now and then.
      begin = () => { started = true; wake(); auto = window.setTimeout(() => { if (s.touched < 0) { s.rest = 0; s.av -= 0.05; wake(); } }, 900); };
      if (document.readyState === "complete") begin(); else window.addEventListener("load", begin, { once: true });
      draught = window.setInterval(() => { if (seen && !document.hidden && !s.drag && performance.now() - s.touched > 9000 && Math.abs(s.rest) < LEVEL) { s.av += (Math.random() > 0.5 ? 1 : -1) * 0.2; wake(); } }, 5200);
    }
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen && started) wake(); });
    io.observe(st);
    const vis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", vis);
    return () => {
      cancelAnimationFrame(raf); window.clearTimeout(auto); window.clearInterval(draught); window.removeEventListener("load", begin); api.current = null;
      ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", vis);
      el.removeEventListener("pointerdown", down); st.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up);
    };
  }, []);

  const HW = FW + 60, HH = FH + DROP + 50; // the box the hanging group is laid out in

  return (
    <div
      className="relative flex min-h-[600px] w-full flex-col items-center justify-center overflow-hidden bg-[#D9D5CB] bg-[linear-gradient(180deg,#E2DED5_0%,#D9D5CB_60%,#CFCABF_100%)] px-3 py-6 text-[#0B0D12] sm:min-h-[800px]"
      style={{ fontFamily: FONT }}
    >
      <style>{`
        @keyframes framed-homepage-print-light { 0%,100% { transform: skewX(-20deg) translateX(0); opacity: 0.9; } 50% { transform: skewX(-20deg) translateX(26px); opacity: 1; } }
        .framed-homepage-print-light { animation: framed-homepage-print-light 14s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .framed-homepage-print-light { animation: none; } }
      `}</style>

      {/* afternoon light from a window off to the left, crossed by its glazing bars */}
      <div aria-hidden="true" className="framed-homepage-print-light pointer-events-none absolute left-[8%] top-[-6%] h-[112%] w-[58%]" style={{ transform: "skewX(-20deg)", filter: "blur(14px)", background: "linear-gradient(90deg,rgba(255,248,230,0) 0%,rgba(255,248,230,0.62) 6%,rgba(255,248,230,0.62) 30%,rgba(120,100,70,0.1) 31.5%,rgba(120,100,70,0.1) 34%,rgba(255,248,230,0.6) 35.5%,rgba(255,248,230,0.6) 62%,rgba(120,100,70,0.1) 63.5%,rgba(120,100,70,0.1) 66%,rgba(255,248,230,0.55) 67.5%,rgba(255,248,230,0.5) 94%,rgba(255,248,230,0) 100%)" }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.5] mix-blend-multiply" style={{ backgroundImage: "radial-gradient(rgba(90,80,60,0.16) 0.6px,transparent 0.9px),radial-gradient(rgba(255,255,255,0.5) 0.5px,transparent 0.8px)", backgroundSize: "5px 5px,7px 7px", backgroundPosition: "0 0,3px 2px" }} />

      <div ref={stage} className="relative flex w-full max-w-[900px] justify-center" style={{ height: HH * zoom }}>
        <div className="relative shrink-0" style={{ width: HW, height: HH, zoom }}>
          {/* the nail */}
          <div aria-hidden="true" className="absolute rounded-full" style={{ left: HW / 2 - 5.5, top: 14.5, width: 11, height: 11, background: "radial-gradient(circle at 36% 30%,#ffffff 0%,#c8ccd2 30%,#70767e 68%,#3d4249 100%)", boxShadow: "3px 5px 5px rgba(40,28,10,0.45), inset 0 0 0 0.5px rgba(20,24,30,0.5)" }} />

          <div ref={hang} className="absolute left-0 top-0 touch-none select-none" style={{ width: HW, height: HH, transformOrigin: `${HW / 2}px 20px`, willChange: "transform", cursor: "grab" }}>
            {/* picture wire, with the line of shadow it throws on the plaster */}
            <svg aria-hidden="true" className="absolute left-0 top-0 overflow-visible" width={HW} height={DROP + 30} fill="none">
              <path d={`M${HW / 2 - 118} ${DROP + 22} L${HW / 2} 20 L${HW / 2 + 118} ${DROP + 22}`} stroke="rgba(40,28,10,0.22)" strokeWidth="2.4" transform="translate(5 8)" style={{ filter: "blur(1.6px)" }} />
              <path d={`M${HW / 2 - 118} ${DROP + 22} L${HW / 2} 20 L${HW / 2 + 118} ${DROP + 22}`} stroke="#6f747b" strokeWidth="2" strokeLinejoin="round" />
              <path d={`M${HW / 2 - 118} ${DROP + 22} L${HW / 2} 20 L${HW / 2 + 118} ${DROP + 22}`} stroke="#eef0f2" strokeWidth="0.8" strokeDasharray="1.6 2.2" strokeLinejoin="round" />
            </svg>

            {/* the frame stands off the wall, so it throws a soft shadow and a tight one */}
            <div aria-hidden="true" className="absolute" style={{ left: 30 + 20, top: DROP + 34, width: FW - 10, height: FH - 4, background: "rgba(54,38,14,0.42)", filter: "blur(26px)" }} />
            <div aria-hidden="true" className="absolute" style={{ left: 30 + 6, top: DROP + 9, width: FW - 2, height: FH, background: "rgba(40,26,8,0.5)", filter: "blur(6px)" }} />

            <div role="img" aria-label={`A framed print of the ${site.name} homepage in an oak frame, hanging from a nail by picture wire`} className="absolute" style={{ left: 30, top: DROP, width: FW, height: FH }}>
              {/* mount board with a bevel-cut window */}
              <div className="absolute bg-[#F5F2EB]" style={{ left: M - 1, top: M - 1, width: FW - M * 2 + 2, height: FH - M * 2 + 2, backgroundImage: "radial-gradient(rgba(120,110,90,0.1) 0.5px,transparent 0.8px)", backgroundSize: "3px 3px" }}>
                <div className="absolute overflow-hidden bg-[#FBFAF7]" style={{ left: 44, top: 38, width: 284, height: 384, boxShadow: "0 0 0 1px rgba(120,110,92,0.35), -1.5px -1.5px 0 2.5px #dcd7cc, 1.5px 1.5px 0 2.5px #ffffff, inset 2px 3px 5px rgba(60,48,24,0.28)" }}>
                  {/* the print: a whole homepage */}
                  <div className="absolute inset-0">
                    <div className="absolute left-[12px] right-[12px] top-0 flex h-[30px] items-center justify-between">
                      <span className="flex items-center gap-[5px] whitespace-nowrap text-[10.5px] font-extrabold tracking-[-0.03em]"><span className="h-[7px] w-[7px] rounded-full" style={{ background: BLUE }} />{site.name}</span>
                      <span className="flex gap-[10px] text-[8px] font-bold text-[#0B0D12]/70">{site.links.map((l) => <span key={l}>{l}</span>)}</span>
                    </div>
                    <div className="absolute left-[10px] top-[30px] h-[196px] w-[264px] overflow-hidden rounded-[10px] bg-[#8fa598]">
                      <img src={site.photo} alt="" width={900} height={1350} draggable={false} className="h-full w-full object-cover" style={{ objectPosition: "50% 22%" }} />
                    </div>
                    <div className="absolute left-[12px] top-[238px] w-[250px] text-[26px] font-extrabold leading-[0.98] tracking-[-0.045em]">{site.headline}</div>
                    <div className="absolute left-[12px] top-[298px] w-[210px] text-[9.5px] font-semibold leading-[1.35] text-[#0B0D12]/70">{site.copy}</div>
                    <div className="absolute left-[12px] top-[338px] flex h-[28px] items-center rounded-full px-[14px] text-[10px] font-extrabold tracking-[-0.01em] text-[#0B0D12]" style={{ background: BLUE }}>{site.cta}</div>
                    <div className="absolute right-[12px] top-[346px] text-[7.5px] font-bold uppercase tracking-[0.14em] text-[#0B0D12]/45">Studio proof</div>
                  </div>
                </div>
                {/* shadow the moulding drops onto the board */}
                <div className="absolute inset-0" style={{ boxShadow: "inset 0 9px 10px -5px rgba(46,30,8,0.55), inset 7px 0 9px -5px rgba(46,30,8,0.4), inset -3px 0 5px -3px rgba(46,30,8,0.2), inset 0 -2px 4px -2px rgba(46,30,8,0.18)" }} />
                {/* glazing: the window reflected, and a band of light that slides as the frame turns */}
                <div ref={glass} className="absolute inset-0" style={{ ["--g" as string]: "50%", background: "linear-gradient(108deg,rgba(255,255,255,0) calc(var(--g) - 34%),rgba(255,255,255,0.2) calc(var(--g) - 12%),rgba(255,255,255,0.07) calc(var(--g) - 4%),rgba(255,255,255,0.14) calc(var(--g) + 2%),rgba(255,255,255,0) calc(var(--g) + 16%)),linear-gradient(180deg,rgba(190,214,240,0.12),rgba(190,214,240,0) 40%)" }} />
              </div>
              {sides.map((side) => (
                <div key={side.key} className="absolute" style={side.style}><div className="absolute inset-0" style={{ background: side.shade }} /></div>
              ))}
              {/* the four mitre joints */}
              <svg aria-hidden="true" className="absolute inset-0" width={FW} height={FH} stroke="rgba(52,28,4,0.5)" strokeWidth="0.7">
                <path d={`M0.5 0.5 L${M} ${M} M${FW - 0.5} 0.5 L${FW - M} ${M} M0.5 ${FH - 0.5} L${M} ${FH - M} M${FW - 0.5} ${FH - 0.5} L${FW - M} ${FH - M}`} />
              </svg>
              <div className="absolute inset-0" style={{ boxShadow: "inset 0 0 0 0.5px rgba(60,34,8,0.7)" }} />
              {/* brass plate pinned to the bottom rail */}
              <div className="absolute flex items-center justify-center rounded-[2px]" style={{ left: FW / 2 - 62, top: FH - M + 7, width: 124, height: 16, background: "linear-gradient(180deg,#f3e2a8 0%,#d9bd6b 34%,#b8964a 62%,#e6cf8c 100%)", boxShadow: "0 1px 1.5px rgba(40,22,2,0.7), inset 0 0 0 0.5px rgba(90,62,12,0.8), inset 0 1px 0 rgba(255,255,255,0.7)" }}>
                <span className="absolute left-[4px] h-[3.5px] w-[3.5px] rounded-full" style={{ background: "radial-gradient(circle at 35% 30%,#fff6d0,#7c5f1e)" }} />
                <span className="absolute right-[4px] h-[3.5px] w-[3.5px] rounded-full" style={{ background: "radial-gradient(circle at 35% 30%,#fff6d0,#7c5f1e)" }} />
                <span className="whitespace-nowrap text-[7.5px] font-extrabold uppercase tracking-[0.2em] text-[#4a3609]" style={{ textShadow: "0 0.6px 0 rgba(255,244,200,0.8)" }}>{site.name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* a spirit level and the two things a hand can do to a hung picture */}
      <div className="relative mt-1 flex flex-wrap items-center justify-center gap-[10px]">
        <div aria-hidden="true" className="relative flex h-[50px] w-[136px] items-center justify-center rounded-full" style={{ background: "linear-gradient(180deg,#f0dea0 0%,#d2b461 30%,#a98a3e 62%,#dcc47c 100%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.75), inset 0 0 0 1px rgba(92,66,14,0.6), 0 14px 22px -12px rgba(46,30,8,0.7)" }}>
          <div className="relative h-[24px] w-[104px] overflow-hidden rounded-full" style={{ background: "linear-gradient(180deg,#2f6fd0 0%,#4F98FB 38%,#8fc0ff 70%,#3b82ea 100%)", boxShadow: "inset 0 2px 4px rgba(6,26,70,0.75), inset 0 -1px 1px rgba(255,255,255,0.5), 0 1px 0 rgba(255,255,255,0.6)" }}>
            <span ref={bubble} className="absolute left-[38px] top-[4px] block h-[16px] w-[28px] rounded-full" style={{ background: "radial-gradient(ellipse at 40% 30%,rgba(255,255,255,0.98) 0%,rgba(222,238,255,0.8) 40%,rgba(160,200,255,0.42) 100%)", boxShadow: "inset 0 -1.5px 2px rgba(10,40,100,0.4), 0 0 0 0.5px rgba(255,255,255,0.75)" }} />
            <span className="absolute left-[35px] top-0 h-full w-[1.5px] bg-[#0B0D12]/70" /><span className="absolute left-[67.5px] top-0 h-full w-[1.5px] bg-[#0B0D12]/70" />
            <span className="absolute inset-x-[6px] top-[2px] h-[5px] rounded-full bg-white/50" />
          </div>
        </div>
        <button type="button" onClick={() => api.current?.straighten()} className="flex h-[50px] items-center gap-[8px] rounded-full bg-[#0B0D12] px-[22px] text-[14px] font-extrabold tracking-[-0.01em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_14px_22px_-12px_rgba(20,14,4,0.8)] outline-none transition-transform duration-150 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-[#4F98FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#D9D5CB] motion-reduce:transition-none">
          <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full" style={{ background: BLUE }} />Straighten
        </button>
        <button type="button" onClick={() => api.current?.nudge()} className="h-[50px] rounded-full bg-[#F6F4EF] px-[20px] text-[14px] font-extrabold tracking-[-0.01em] text-[#0B0D12] shadow-[inset_0_1px_0_#fff,0_0_0_1px_rgba(11,13,18,0.08),0_14px_22px_-14px_rgba(20,14,4,0.6)] outline-none transition-transform duration-150 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-[#4F98FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#D9D5CB] motion-reduce:transition-none">
          Knock it
        </button>
      </div>
      <p aria-live="polite" className="mt-[12px] text-center text-[12px] font-semibold tracking-[-0.005em] text-[#0B0D12]/70">
        {level ? `${site.name}: framed, hung and level` : "Hanging a little crooked. Drag it, or press Straighten."}
      </p>
    </div>
  );
}
