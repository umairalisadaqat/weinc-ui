import { useEffect, useRef, useState } from "react";

// Everything a visitor is likely to change sits here.
const places = [
  { label: "Work", miles: "2", note: "Selected projects, newest first" },
  { label: "Studio", miles: "¾", note: "Who we are, how a job runs" },
  { label: "Journal", miles: "5", note: "Workshop notes, most weeks" },
  { label: "Contact", miles: "1½", note: "Write, call or come by" },
];
const START = 2; // the arm that points the way at load
const AWAY = [197, 166, 203, 170]; // where each arm rests when it is not chosen (180 is flat left)
const PAINT = "#f6f3ea"; // arm and post
const INK = "#15171a"; // lettering, rims and bands
const SPRING = { pull: 46, drag: 5.4 }; // lower the drag for a looser collar that swings longer
const DEMO = true; // turn the arms by itself until a visitor does

const layoutFor = (narrow: boolean) =>
  narrow
    ? { W: 372, H: 620, cx: 186, len: 168, h: 50, pitch: 66, top: 136, font: 14.5, small: 12, tip: 18, post: 26 }
    : { W: 880, H: 660, cx: 440, len: 330, h: 68, pitch: 88, top: 152, font: 29, small: 23, tip: 30, post: 36 };

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;
const IRON = "linear-gradient(90deg,#030303 0%,#1d1f21 16%,#5a5e62 34%,#787d82 40%,#2c2e30 58%,#0b0b0c 82%,#000 100%)";
const WHITE = "linear-gradient(90deg,#8b8c84 0%,#d9d7cc 12%,#fdfcf6 30%,#ffffff 38%,#f1eee4 56%,#c2c0b4 80%,#8e8e85 100%)";

export default function FingerPostNavigation() {
  const frame = useRef<HTMLDivElement>(null);
  const arms = useRef<(HTMLLIElement | null)[]>([]);
  const [narrow, setNarrow] = useState(false);
  const [scale, setScale] = useState(1);
  const [chosen, setChosen] = useState(START);
  const live = useRef({ chosen: START, hover: -1, touched: false });
  const L = layoutFor(narrow);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const fit = () => {
      const slim = el.clientWidth < 700;
      setNarrow(slim);
      setScale(Math.min(1, el.clientWidth / layoutFor(slim).W));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const goal = (i: number) => (i === live.current.chosen ? 0 : AWAY[i % AWAY.length] - (live.current.hover === i ? 16 : 0));
    // Each arm is a heavy casting on a loose collar: an angle, a speed, and a spring towards where it should point.
    const state = places.map((_, i) => ({ a: goal(i) + (reduce ? 0 : i === START ? 26 : i % 2 ? -7 : 8), v: 0 }));
    const lx = -0.52, lz = 0.64; // the sun: over the left shoulder
    const paint = () => {
      state.forEach((s, i) => {
        const node = arms.current[i];
        if (!node) return;
        const r = (s.a * Math.PI) / 180;
        const facing = Math.cos(r) >= 0 ? 1 : -1;
        const lambert = Math.max(0, facing * (-Math.sin(r) * lx + Math.cos(r) * lz));
        node.style.transform = `rotateY(${(-s.a).toFixed(2)}deg)`;
        node.style.setProperty("--shade", (0.3 * (1 - Math.min(1, lambert / 0.72))).toFixed(3));
        node.style.setProperty("--gloss", `${(50 + facing * Math.sin(r) * 150).toFixed(1)}%`);
      });
    };
    let raf = 0, last = 0, seen = true, timer = 0;
    const tick = (now: number) => {
      raf = 0;
      const dt = Math.min(0.032, last ? (now - last) / 1000 : 0.016);
      last = now;
      state.forEach((s, i) => {
        if (reduce) { s.a = goal(i); return; }
        const wind = Math.sin(now / 900 + i * 1.7) * 3.2 + Math.sin(now / 310 + i * 4.1) * 1.1; // a breeze never lets them sit dead still
        s.v += ((goal(i) - s.a) * SPRING.pull - s.v * SPRING.drag + wind) * dt;
        s.a += s.v * dt;
      });
      paint();
      if (seen && !document.hidden && !reduce) raf = requestAnimationFrame(tick);
    };
    const wake = () => { if (!raf && seen && !document.hidden) { last = 0; raf = requestAnimationFrame(tick); } };
    const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; wake(); });
    io.observe(el);
    document.addEventListener("visibilitychange", wake);
    el.addEventListener("fingerpost-wake", wake);
    if (DEMO && !reduce) {
      timer = window.setTimeout(function next() {
        if (live.current.touched) return;
        live.current.chosen = (live.current.chosen + 1) % places.length;
        setChosen(live.current.chosen);
        timer = window.setTimeout(next, 3100);
      }, 3500);
    }
    paint();
    wake();
    return () => { cancelAnimationFrame(raf); clearTimeout(timer); io.disconnect(); document.removeEventListener("visibilitychange", wake); el.removeEventListener("fingerpost-wake", wake); };
  }, []);

  const point = (i: number) => {
    live.current.touched = true;
    live.current.chosen = i;
    setChosen(i);
    frame.current?.dispatchEvent(new Event("fingerpost-wake"));
  };
  const lean = (i: number) => { live.current.hover = i; frame.current?.dispatchEvent(new Event("fingerpost-wake")); };

  const hub = L.post / 2 - 3; // the arm starts just inside the collar
  const finger = `polygon(0 0, calc(100% - ${L.tip}px) 0, 100% 50%, calc(100% - ${L.tip}px) 100%, 0 100%)`;
  const fingerBack = `polygon(${L.tip}px 0, 100% 0, 100% 100%, ${L.tip}px 100%, 0 50%)`;
  const lettering = { color: INK, fontSize: L.font, letterSpacing: narrow ? "0.03em" : "0.07em", textShadow: "0 1.4px 0.6px rgba(0,0,0,0.38), 0 -0.6px 0 rgba(255,255,255,0.55), 1px 0 0 rgba(0,0,0,0.25)" };

  const face = (p: (typeof places)[number], back: boolean) => (
    <span
      aria-hidden={back || undefined}
      className="absolute inset-0 block"
      style={{ transform: back ? "rotateY(180deg) translateZ(4px)" : "translateZ(4px)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", filter: "drop-shadow(0 1px 0 rgba(0,0,0,0.35))" }}
    >
      {/* the raised rim, then the painted field inside it */}
      <span className="absolute inset-0 block" style={{ clipPath: back ? fingerBack : finger, background: `linear-gradient(180deg,#6a6f74 0,#33363a 3px,${INK} 40%,#000)` }} />
      <span
        className={`absolute block ${back ? "flex-row-reverse" : ""} flex items-center justify-between font-sans font-extrabold uppercase`}
        style={{ inset: 4, clipPath: back ? fingerBack : finger, background: `linear-gradient(180deg,#ffffff 0%,${PAINT} 30%,${PAINT} 66%,#e2decf 100%)`, paddingLeft: back ? L.tip + 2 : L.post * 0.85, paddingRight: back ? L.post * 0.85 : L.tip + 2 }}
      >
        <span className="relative z-10" style={lettering}>{p.label}</span>
        <span className="relative z-10 tabular-nums" style={{ ...lettering, fontSize: L.small, letterSpacing: "0.02em" }}>{p.miles}</span>
        <span className="pointer-events-none absolute inset-0 block mix-blend-multiply opacity-[0.18]" style={{ backgroundImage: GRAIN, backgroundSize: "140px 140px" }} />
        <span className="pointer-events-none absolute inset-0 block" style={{ background: "linear-gradient(180deg,rgba(0,0,0,0.3) 0,rgba(0,0,0,0) 5px,rgba(0,0,0,0) calc(100% - 3px),rgba(255,255,255,0.7) 100%)" }} />
        {/* wet gloss paint: a soft bar of sky that slides along the arm as it turns */}
        <span className="pointer-events-none absolute inset-0 block" style={{ background: "linear-gradient(100deg,rgba(255,255,255,0) 30%,rgba(255,255,255,0.75) 47%,rgba(255,255,255,0.1) 53%,rgba(255,255,255,0) 70%)", backgroundSize: "220% 100%", backgroundPosition: "var(--gloss,50%) 0", opacity: 0.7 }} />
        <span className="pointer-events-none absolute inset-0 block" style={{ background: "#1a2026", opacity: "var(--shade,0)" }} />
      </span>
      {/* the two bolts that clamp the arm to its collar */}
      {[0.27, 0.73].map((y) => (
        <span key={y} className="absolute block rounded-full" style={{ width: 8, height: 8, top: `calc(${y * 100}% - 4px)`, [back ? "right" : "left"]: L.post * 0.36, background: "radial-gradient(circle at 35% 30%,#8d9196,#2a2c2e 55%,#050505)", boxShadow: "0 1px 1px rgba(0,0,0,0.5)" }} />
      ))}
    </span>
  );

  return (
    <div ref={frame} className="relative w-full overflow-clip bg-[#dfe4df]" style={{ minHeight: L.H * scale }}>
      <style>{`
        .finger-post-arm:focus-visible .finger-post-ring { opacity: 1; }
        @media (prefers-reduced-motion: reduce) { .finger-post-note { transition: none !important; } }
      `}</style>
      {/* a hazy morning: sky, far hills out of focus, grain */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(120% 80% at 50% 8%,#f3f4ee 0%,#e3e8e3 45%,#cfd8d2 100%)" }} />
      <div className="pointer-events-none absolute inset-x-[-10%] bottom-[-8%] h-[30%] rounded-[50%] bg-[#a9b8ac]" style={{ filter: "blur(38px)", opacity: 0.75 }} />
      <div className="pointer-events-none absolute bottom-[-12%] left-[38%] h-[26%] w-[80%] rounded-[50%] bg-[#8fa294]" style={{ filter: "blur(46px)", opacity: 0.7 }} />
      <div className="pointer-events-none absolute inset-0 opacity-[0.22] mix-blend-multiply" style={{ backgroundImage: GRAIN }} />

      <div className="absolute left-1/2 top-0" style={{ width: L.W, height: L.H, marginLeft: -(L.W * scale) / 2, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
        <div className="absolute inset-0" style={{ perspective: 1500, perspectiveOrigin: `50% ${L.top - 40}px` }}>
          <div className="pointer-events-none absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
            {/* the post: white gloss over cast iron, black bands at the foot */}
            <div className="absolute" style={{ left: L.cx - L.post / 2, top: L.top - L.h / 2 - 34, width: L.post, bottom: -4, background: WHITE, boxShadow: "0 0 0 0.5px rgba(40,40,30,0.5)" }}>
              <div className="absolute inset-0 opacity-[0.16] mix-blend-multiply" style={{ backgroundImage: GRAIN, backgroundSize: "120px 120px" }} />
              {[0, 2].map((b) => (
                <div key={b} className="absolute inset-x-[-1px]" style={{ top: L.pitch * (places.length - 1) + L.h + 86 + b * 56, height: 56, background: IRON }} />
              ))}
            </div>
            {/* finial: a stepped cap and a painted ball */}
            <div className="absolute rounded-[3px]" style={{ left: L.cx - L.post / 2 - 5, top: L.top - L.h / 2 - 42, width: L.post + 10, height: 10, background: IRON, boxShadow: "0 2px 3px rgba(0,0,0,0.35)" }} />
            <div className="absolute" style={{ left: L.cx - 5, top: L.top - L.h / 2 - 54, width: 10, height: 14, background: IRON }} />
            <div className="absolute rounded-full" style={{ left: L.cx - L.post * 0.62, top: L.top - L.h / 2 - 54 - L.post * 1.16, width: L.post * 1.24, height: L.post * 1.24, background: "radial-gradient(circle at 34% 26%,#ffffff 0%,#ffffff 9%,#f6f3e9 24%,#dedbce 55%,#a5a59a 84%,#7c7d75 100%)", boxShadow: "inset -2px -3px 5px rgba(0,0,0,0.25), 0 2px 3px rgba(0,0,0,0.3)" }}>
              <div className="absolute inset-0 rounded-full opacity-[0.14] mix-blend-multiply" style={{ backgroundImage: GRAIN, backgroundSize: "90px 90px" }} />
            </div>
            {/* one iron collar per arm */}
            {places.map((p, i) => (
              <div key={p.label} className="absolute rounded-[4px]" style={{ left: L.cx - L.post / 2 - 6, top: L.top + i * L.pitch - L.h / 2 - 5, width: L.post + 12, height: L.h + 10, background: IRON, boxShadow: "inset 0 1.5px 0 rgba(255,255,255,0.28), inset 0 -2px 0 rgba(0,0,0,0.6), 0 3px 4px rgba(0,0,0,0.35)" }} />
            ))}

            <nav aria-label="Main" className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
              <ul className="absolute inset-0 m-0 list-none p-0" style={{ transformStyle: "preserve-3d" }}>
                {places.map((p, i) => (
                  <li
                    key={p.label}
                    ref={(n) => { arms.current[i] = n; }}
                    className="absolute"
                    style={{ left: L.cx, top: L.top + i * L.pitch - L.h / 2, width: L.len, height: L.h, transformOrigin: "0 50%", transformStyle: "preserve-3d", transform: `rotateY(${-(i === START ? 0 : AWAY[i % AWAY.length])}deg)`, willChange: "transform" }}
                  >
                    <a
                      href="#"
                      aria-current={i === chosen ? "page" : undefined}
                      onClick={(e) => { e.preventDefault(); point(i); }}
                      onPointerEnter={() => lean(i)}
                      onPointerLeave={() => lean(-1)}
                      onFocus={() => lean(i)}
                      onBlur={() => lean(-1)}
                      className="finger-post-arm pointer-events-auto absolute block outline-none focus-visible:outline-none"
                      style={{ left: hub, right: 0, top: 0, bottom: 0, transformStyle: "preserve-3d" }}
                    >
                      {face(p, false)}
                      {face(p, true)}
                      {/* the top edge of the casting, seen from slightly above */}
                      <span aria-hidden="true" className="absolute left-0 block" style={{ top: 0, right: L.tip, height: 8, transformOrigin: "50% 0", transform: "translateZ(4px) rotateX(-90deg)", background: "linear-gradient(180deg,#2b2d30,#0c0d0e)" }} />
                      <span aria-hidden="true" className="finger-post-ring pointer-events-none absolute -inset-2 block rounded-lg border-[3px] border-[#c2410c] opacity-0" style={{ transform: "translateZ(14px)" }} />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </div>

      <p aria-live="polite" className="finger-post-note absolute inset-x-0 m-0 text-center font-mono text-[10px] uppercase tracking-[0.12em] sm:text-[11px] sm:tracking-[0.18em] text-[#3b4640]" style={{ bottom: 22 }}>
        <span className="inline-block rounded-full bg-[#eef1ec]/90 px-4 py-2 shadow-[0_1px_0_rgba(255,255,255,0.8)_inset,0_6px_18px_-8px_rgba(40,60,50,0.5)]">
          <b className="font-bold text-[#15171a]">{places[chosen].label}</b>
          <span className="mx-2 text-[#7b8a82]">/</span>
          {places[chosen].note}
        </span>
      </p>
    </div>
  );
}
