import { useEffect, useRef, useState } from "react";

// One bell for each thing the site can send to the back room. An invented bakery: edit the plates and notes.
const bells = [
  { plate: "Bookings", kind: "Booking", notes: ["Table for two, Friday at seven", "Window seat for four on Sunday"] },
  { plate: "Orders", kind: "Order", notes: ["Six cardamom buns to collect", "One seeded loaf, sliced"] },
  { plate: "Messages", kind: "Message", notes: ["Do you cater for birthdays?", "Is the rye baked on Mondays?"] },
  { plate: "Sign-ups", kind: "Sign-up", notes: ["A new name for the bread club", "One more for the Saturday class"] },
];
const SOUND = false; // off by default. Set true to strike a short synthesised bell note on each ring.
const BLUE = "#4F98FB";
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';

const VW = 760, VH = 452; // the drawing
const X0 = 125, GAP = 170, MY = 132; // first bell, spacing, height of the spring mounts
const R1 = 33, TURNS = 2.75 * Math.PI * 2; // outer radius and length of the coiled spring
const ROD = 50; // pendulum length

// the coiled steel strip: fixed at the middle, its free end swings by `a` radians and carries the bell
const coil = (cx: number, a: number) => {
  let d = "";
  for (let k = 0; k <= 44; k++) {
    const u = k / 44, ang = Math.PI / 2 - TURNS + (TURNS + a) * u, r = 5 + (R1 - 5) * u;
    d += (k ? "L" : "M") + (cx + r * Math.cos(ang)).toFixed(2) + " " + (MY + r * Math.sin(ang)).toFixed(2);
  }
  return d;
};
const BELL = "M-10 15C-25 17-30 42-33 60C-35 68-39 72-43 77L43 77C39 72 35 68 33 60C30 42 25 17 10 15Z";

type Api = { ring: (i: number, by?: boolean) => void };

export default function ServantsBellBoard() {
  const stage = useRef<HTMLDivElement>(null);
  const springs = useRef<(SVGPathElement | null)[]>([]);
  const glints = useRef<(SVGPathElement | null)[]>([]);
  const shines = useRef<(SVGPathElement | null)[]>([]);
  const hung = useRef<(SVGGElement | null)[]>([]);
  const shades = useRef<(SVGGElement | null)[]>([]);
  const clappers = useRef<(SVGGElement | null)[]>([]);
  const bobs = useRef<(SVGGElement | null)[]>([]);
  const api = useRef<Api | null>(null);
  const [zoom, setZoom] = useState(1);
  const [last, setLast] = useState({ i: 0, n: 0, tick: 0 });

  useEffect(() => {
    const st = stage.current;
    if (!st) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fit = () => setZoom(Math.max(0.42, Math.min(1.2, (st.clientWidth + 28) / VW)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(st);

    // a: spring arm, b: the bell on its strap, c: clapper, q: pendulum. Each with its speed.
    const s = bells.map((_, i) => ({ a: 0, av: 0, b: 0, bv: 0, c: 0, cv: 0, q: i === 0 && !reduce ? 0.42 : 0, qv: 0, n: 0 }));
    const paint = () => {
      s.forEach((m, i) => {
        const cx = X0 + i * GAP, ex = cx - R1 * Math.sin(m.a), ey = MY + R1 * Math.cos(m.a), d = coil(cx, m.a);
        springs.current[i]?.setAttribute("d", d);
        glints.current[i]?.setAttribute("d", d);
        shines.current[i]?.setAttribute("d", d);
        const turn = ((m.a + m.b) * 180) / Math.PI;
        hung.current[i]?.setAttribute("transform", `translate(${ex.toFixed(2)} ${ey.toFixed(2)}) rotate(${turn.toFixed(2)})`);
        shades.current[i]?.setAttribute("transform", `translate(${(ex + 13).toFixed(2)} ${(ey + 17).toFixed(2)}) rotate(${turn.toFixed(2)})`);
        clappers.current[i]?.setAttribute("transform", `rotate(${((m.c * 180) / Math.PI).toFixed(2)} 0 46)`);
        bobs.current[i]?.setAttribute("transform", `rotate(${((m.q * 180) / Math.PI).toFixed(2)} ${cx} 342)`);
      });
    };
    let raf = 0, lastT = 0, seen = true, ctx: AudioContext | null = null;
    const frame = (now: number) => {
      raf = 0;
      let dt = Math.max(0.004, Math.min(0.032, (now - lastT) / 1000 || 0.016)); lastT = now;
      let live = 0;
      for (let step = 0; step < 2; step++) { // two half steps keep the stiff bell spring stable
        const h = dt / 2;
        for (const m of s) {
          const aa = -430 * m.a - 2.3 * m.av;
          m.av += aa * h; m.a += m.av * h;
          m.bv += (-1150 * m.b - 4.6 * m.bv - 0.9 * aa) * h; m.b += m.bv * h;
          m.cv += (-520 * m.c - 2.6 * m.cv - 1.5 * aa) * h; m.c += m.cv * h;
          if (m.c > 0.5) { m.c = 0.5; m.cv *= -0.45; } else if (m.c < -0.5) { m.c = -0.5; m.cv *= -0.45; }
          m.qv += (-62 * m.q - 0.42 * m.qv + 0.11 * aa) * h; m.q += m.qv * h;
        }
      }
      for (const m of s) live += Math.abs(m.a) + Math.abs(m.av) * 0.05 + Math.abs(m.q) + Math.abs(m.qv) * 0.1 + Math.abs(m.b) + Math.abs(m.c);
      paint();
      if (live > 0.004 && seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { lastT = performance.now(); raf = requestAnimationFrame(frame); } };
    let touched = -1e9, tick = 0;
    const strike = () => {
      if (!SOUND) return;
      try {
        ctx = ctx || new AudioContext();
        const t = ctx.currentTime, g = ctx.createGain();
        g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.4); g.connect(ctx.destination);
        [1320, 2640, 3540].forEach((f) => { const o = ctx!.createOscillator(); o.frequency.value = f; o.connect(g); o.start(t); o.stop(t + 1.4); });
      } catch { /* no audio: the bell still swings */ }
    };
    const ring = (i: number, by = false) => {
      const m = s[i];
      if (by) touched = performance.now();
      m.av += (m.n % 2 ? -1 : 1) * 5.6; m.cv += 3;
      setLast({ i, n: m.n % bells[i].notes.length, tick: ++tick });
      m.n++; strike(); wake();
    };
    api.current = { ring };
    paint();

    // The demo: something arrives every few seconds. It stands down for a while after a visitor rings a bell.
    const order = [1, 2, 0, 3, 1, 0, 2, 3];
    let k = 0, timer = 0;
    const loop = (wait: number) => { timer = window.setTimeout(() => { if (seen && !document.hidden && performance.now() - touched > 7000) ring(order[k++ % order.length]); loop(2900); }, wait); };
    if (!reduce) { wake(); loop(2100); }
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(st);
    const vis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", vis);
    return () => { cancelAnimationFrame(raf); window.clearTimeout(timer); ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", vis); api.current = null; if (ctx) ctx.close(); };
  }, []);

  const note = bells[last.i];
  const id = "servants-bell-board";

  return (
    <div className="relative flex min-h-[600px] w-full flex-col items-center justify-center overflow-hidden bg-[#0B0D12] bg-[radial-gradient(75%_60%_at_50%_36%,#1A1E28_0%,#0B0D12_62%,#060709_100%)] px-4 py-10 text-[#F6F4EF] sm:min-h-[760px]" style={{ fontFamily: FONT }}>
      <style>{`
        @keyframes ${id}-slip { 0% { transform: translateY(-14px) rotate(-1.2deg); opacity: 0; } 60% { transform: translateY(2px) rotate(.4deg); opacity: 1; } 100% { transform: none; opacity: 1; } }
        .${id}-slip { animation: ${id}-slip 420ms cubic-bezier(.2,.9,.3,1) both; }
        @media (prefers-reduced-motion: reduce) { .${id}-slip { animation: none; } }
      `}</style>
      <div ref={stage} className="relative flex w-full max-w-[940px] justify-center" style={{ height: VH * zoom }}>
        <div className="relative shrink-0" style={{ width: VW, height: VH, zoom }}>
          <svg viewBox={`0 0 ${VW} ${VH}`} width={VW} height={VH} aria-hidden="true" className="absolute inset-0 overflow-visible">
            <defs>
              <linearGradient id={`${id}-brass`} gradientUnits="userSpaceOnUse" x1="-43" y1="0" x2="43" y2="0">
                <stop offset="0" stopColor="#3B2608" /><stop offset="0.1" stopColor="#8A621E" /><stop offset="0.27" stopColor="#E3BC60" /><stop offset="0.35" stopColor="#FFF4CC" /><stop offset="0.43" stopColor="#E2B655" />
                <stop offset="0.68" stopColor="#A7772A" /><stop offset="0.86" stopColor="#6B4712" /><stop offset="0.94" stopColor="#5E6C8C" /><stop offset="1" stopColor="#2C1D06" />
              </linearGradient>
              <linearGradient id={`${id}-fall`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1A0F00" stopOpacity="0.55" /><stop offset="0.3" stopColor="#1A0F00" stopOpacity="0" /><stop offset="0.82" stopColor="#1A0F00" stopOpacity="0" /><stop offset="1" stopColor="#1A0F00" stopOpacity="0.4" /></linearGradient>
              <linearGradient id={`${id}-board`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#20242D" /><stop offset="0.32" stopColor="#14171D" /><stop offset="0.5" stopColor="#1C2029" /><stop offset="0.62" stopColor="#11141A" /><stop offset="1" stopColor="#0C0E13" /></linearGradient>
              <linearGradient id={`${id}-rod`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF0BE" /><stop offset="0.35" stopColor="#D2A548" /><stop offset="1" stopColor="#5E3F10" /></linearGradient>
              <radialGradient id={`${id}-boss`} cx="0.35" cy="0.3" r="0.8"><stop offset="0" stopColor="#FFF4CC" /><stop offset="0.4" stopColor="#D2A548" /><stop offset="1" stopColor="#4A300C" /></radialGradient>
              <linearGradient id={`${id}-plate`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFEFB" /><stop offset="0.5" stopColor="#F3F0E9" /><stop offset="1" stopColor="#D9D5CB" /></linearGradient>
              <radialGradient id={`${id}-bob`} cx="0.36" cy="0.3" r="0.85"><stop offset="0" stopColor="#D8E8FF" /><stop offset="0.28" stopColor="#7DB3FD" /><stop offset="0.7" stopColor={BLUE} /><stop offset="1" stopColor="#1F4F9E" /></radialGradient>
              <radialGradient id={`${id}-steel`} cx="0.35" cy="0.3" r="0.8"><stop offset="0" stopColor="#F2F4F7" /><stop offset="0.5" stopColor="#8B919B" /><stop offset="1" stopColor="#2A2D34" /></radialGradient>
              <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="0.6" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.09" /><stop offset="0.45" stopColor="#fff" stopOpacity="0.015" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
              <filter id={`${id}-soft`} x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="7" /></filter>
              <filter id={`${id}-softer`} x="-20%" y="-40%" width="140%" height="200%"><feGaussianBlur stdDeviation="22" /></filter>
            </defs>

            {/* the lacquered board, its shadow on the wall, a raised moulding and a brass rail for the pull wires */}
            <rect x="40" y="70" width="680" height="400" rx="14" fill="#000" opacity="0.7" filter={`url(#${id}-softer)`} />
            <rect x="30" y="34" width="700" height="402" rx="12" fill={`url(#${id}-board)`} />
            <rect x="30.75" y="34.75" width="698.5" height="400.5" rx="11.5" fill="none" stroke="#fff" strokeOpacity="0.16" strokeWidth="1.5" />
            <rect x="30" y="34" width="700" height="402" rx="12" fill="none" stroke="#000" strokeOpacity="0.8" strokeWidth="1" />
            <rect x="46" y="50" width="668" height="370" rx="6" fill="none" stroke="#000" strokeOpacity="0.55" strokeWidth="3" />
            <rect x="48" y="52" width="664" height="366" rx="5" fill="none" stroke="#fff" strokeOpacity="0.07" strokeWidth="1" />
            <rect x="50" y="54" width="660" height="362" rx="4" fill={`url(#${id}-sheen)`} />
            <rect x="74" y="80" width="612" height="8" rx="4" fill="#000" opacity="0.5" />
            <rect x="70" y="72" width="620" height="7" rx="3.5" fill={`url(#${id}-rod)`} />
            {[70, 690].map((x) => <circle key={x} cx={x} cy="75.5" r="8" fill={`url(#${id}-boss)`} stroke="#2C1D06" strokeWidth="0.6" />)}

            {bells.map((b, i) => {
              const cx = X0 + i * GAP, lit = last.i === i;
              return (
                <g key={b.plate}>
                  {/* pull wire, bracket and the shadow the bell throws on the lacquer */}
                  <line x1={cx} y1="79" x2={cx} y2={MY - 16} stroke="#C9CDD4" strokeWidth="1" opacity="0.7" />
                  <g ref={(el) => { shades.current[i] = el; }} opacity="0.55" filter={`url(#${id}-soft)`}><path d={BELL} fill="#000" /></g>
                  <rect x={cx - 13} y={MY - 23} width="26" height="46" rx="5" fill="#000" opacity="0.5" transform="translate(3 4)" />
                  <rect x={cx - 13} y={MY - 23} width="26" height="46" rx="5" fill={`url(#${id}-rod)`} stroke="#2C1D06" strokeWidth="0.6" />
                  {[-16, 16].map((dy) => <g key={dy}><circle cx={cx} cy={MY + dy} r="3.2" fill={`url(#${id}-boss)`} stroke="#2C1D06" strokeWidth="0.5" /><line x1={cx - 2.2} y1={MY + dy - 1} x2={cx + 2.2} y2={MY + dy + 1} stroke="#2C1D06" strokeWidth="0.8" /></g>)}
                  {/* coiled spring, drawn twice: the steel and its highlight */}
                  <path ref={(el) => { springs.current[i] = el; }} d={coil(cx, 0)} fill="none" stroke="#000" strokeOpacity="0.5" strokeWidth="5" transform="translate(4 6)" strokeLinecap="round" />
                  <path d={coil(cx, 0)} fill="none" stroke="#4A4F59" strokeWidth="4.4" strokeLinecap="round" ref={(el) => { glints.current[i] = el; }} />
                  <path ref={(el) => { shines.current[i] = el; }} d={coil(cx, 0)} fill="none" stroke="#DDE1E7" strokeOpacity="0.85" strokeWidth="1.1" strokeLinecap="round" transform="translate(-0.9 -0.9)" />
                  <SpringTop cx={cx} />
                  {/* the bell on its strap */}
                  <g ref={(el) => { hung.current[i] = el; }} transform={`translate(${cx} ${MY + R1})`}>
                    <rect x="-3" y="-3" width="6" height="20" rx="2" fill="#6F747E" stroke="#1B1D22" strokeWidth="0.6" />
                    <circle cx="0" cy="0" r="3.4" fill={`url(#${id}-steel)`} />
                    <ellipse cx="0" cy="77" rx="38" ry="5.5" fill="#1A1004" />
                    <g ref={(el) => { clappers.current[i] = el; }}>
                      <line x1="0" y1="46" x2="0" y2="80" stroke="#22252B" strokeWidth="2.4" />
                      <circle cx="0" cy="84" r="6.5" fill={`url(#${id}-steel)`} />
                    </g>
                    <path d={BELL} fill={`url(#${id}-brass)`} />
                    <path d={BELL} fill={`url(#${id}-fall)`} />
                    <path d="M-43 77C-20 71 20 71 43 77C20 82-20 82-43 77Z" fill={`url(#${id}-brass)`} />
                    <path d="M-41 76.6C-20 72 20 72 41 76.6" fill="none" stroke="#FFF4CC" strokeOpacity="0.75" strokeWidth="0.9" />
                    <path d="M-30 52C-12 49 12 49 30 52M-27.5 43C-11 40.5 11 40.5 27.5 43" fill="none" stroke="#2C1D06" strokeOpacity="0.45" strokeWidth="0.9" />
                    <path d="M-12.5 22C-17 34-19 50-21 66" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="2.2" strokeLinecap="round" />
                    <ellipse cx="0" cy="15.5" rx="10" ry="2.6" fill="#FFF4CC" opacity="0.55" />
                  </g>
                  {/* enamel plate */}
                  <rect x={cx - 62} y="283" width="124" height="36" rx="18" fill="#000" opacity="0.55" transform="translate(2 4)" />
                  <rect x={cx - 62} y="283" width="124" height="36" rx="18" fill={`url(#${id}-plate)`} stroke="#0B0D12" strokeWidth="1" />
                  <rect x={cx - 58.5} y="286.5" width="117" height="29" rx="14.5" fill="none" stroke="#0B0D12" strokeWidth="1.1" />
                  {[-49, 49].map((dx) => <circle key={dx} cx={cx + dx} cy="301" r="2.6" fill={`url(#${id}-steel)`} stroke="#0B0D12" strokeWidth="0.5" />)}
                  <text x={cx} y="305.6" textAnchor="middle" fontSize="12.5" fontWeight="800" letterSpacing="2" fill="#0B0D12" style={{ textTransform: "uppercase" }}>{b.plate}</text>
                  {/* the pendulum that keeps swinging so you can tell which bell rang */}
                  <circle cx={cx} cy="392" r="26" fill={BLUE} opacity={lit ? 0.22 : 0} filter={`url(#${id}-soft)`} style={{ transition: "opacity 500ms" }} />
                  <g ref={(el) => { bobs.current[i] = el; }}>
                    <line x1={cx + 3} y1="346" x2={cx + 3} y2={342 + ROD + 4} stroke="#000" strokeOpacity="0.4" strokeWidth="2" />
                    <circle cx={cx + 5} cy={342 + ROD + 6} r="11.5" fill="#000" opacity="0.45" />
                    <line x1={cx} y1="342" x2={cx} y2={342 + ROD} stroke="#C9CDD4" strokeWidth="1.4" />
                    <circle cx={cx} cy={342 + ROD} r="11.5" fill={`url(#${id}-bob)`} stroke="#0E2C5E" strokeWidth="0.8" opacity={lit ? 1 : 0.62} style={{ transition: "opacity 500ms" }} />
                    <ellipse cx={cx - 3.5} cy={342 + ROD - 4.5} rx="4" ry="2.4" fill="#fff" opacity="0.7" transform={`rotate(-30 ${cx - 3.5} ${342 + ROD - 4.5})`} />
                  </g>
                  <circle cx={cx} cy="342" r="3.6" fill={`url(#${id}-boss)`} stroke="#2C1D06" strokeWidth="0.5" />
                </g>
              );
            })}
          </svg>
          {/* one real button over each bell */}
          {bells.map((b, i) => (
            <button key={b.plate} type="button" onClick={() => api.current?.ring(i, true)} aria-label={`Ring the ${b.plate.toLowerCase()} bell`} className="absolute rounded-[28px] outline-none focus-visible:ring-2 focus-visible:ring-[#4F98FB]" style={{ left: X0 + i * GAP - 76, top: 96, width: 152, height: 326, cursor: "pointer", background: "transparent" }} />
          ))}
        </div>
      </div>

      {/* the slip that says what just came in */}
      <div className="relative z-10 mt-7 flex min-h-[62px] w-full max-w-[460px] items-center justify-center" role="status" aria-live="polite">
        <div key={last.tick} className={`${id}-slip flex w-full items-center gap-3 rounded-[10px] bg-[#F6F4EF] px-4 py-3 text-[#0B0D12] shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_18px_30px_-14px_rgba(0,0,0,0.9)]`}>
          <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: BLUE, boxShadow: "0 0 0 4px rgba(79,152,251,0.18)" }} />
          <span className="text-[11px] font-extrabold uppercase tracking-[0.16em]">{note.kind}</span>
          <span className="min-w-0 flex-1 truncate text-[14px] font-semibold tracking-tight text-[#3A3D45]">{note.notes[last.n]}</span>
        </div>
      </div>
      <p className="relative z-10 mt-4 max-w-[30rem] text-center text-[12px] font-semibold tracking-tight text-[#9EA3AD]">A self-playing demo for Marlow &amp; Fig, an invented bakery. Press any bell to ring it.</p>
    </div>
  );
}

// the brass boss that pins the middle of each coil to its bracket
function SpringTop({ cx }: { cx: number }) {
  return <circle cx={cx} cy={MY} r="5.4" fill="url(#servants-bell-board-boss)" stroke="#2C1D06" strokeWidth="0.6" />;
}
