import { useEffect, useRef, useState } from "react";

// Everything a visitor is likely to change sits here.
const trail = ["Home", "Shop", "Kitchen", "Stoneware", "Ash-Glazed Jar"]; // first is the root, last is the page you are on
const BLUE = "#17377a"; // enamel on the signs you can go back to
const CREAM = "#f4ecd6"; // enamel on the sign for the page you are on
const MAROON = "#6e1d1a"; // lettering on the cream side
const SWING = { rate: 6.1, drag: 1.05, reach: 205 }; // pendulum speed, how fast it dies down, and how hard a moving trolley throws it (lower = wilder)
const DEMO = true; // walk up and down the trail by itself until a visitor does

const layoutFor = (narrow: boolean) =>
  narrow
    ? { W: 360, H: 640, rows: [[0, 1, 2], [3, 4]], rails: [128, 300], h: 56, font: 14, char: 10.3, pad: 15, arrow: 16, gap: 12, chain: 34, tag: 0 }
    : { W: 1180, H: 640, rows: [[0, 1, 2, 3, 4]], rails: [190], h: 84, font: 25, char: 17, pad: 24, arrow: 28, gap: 24, chain: 52, tag: 9 };
type Layout = ReturnType<typeof layoutFor>;
const place = (L: Layout) => {
  const out: { x: number; y: number; w: number }[] = [];
  L.rows.forEach((row, r) => {
    const ws = row.map((i) => Math.round(L.pad * 2 + trail[i].length * L.char + L.arrow));
    let x = (L.W - ws.reduce((a, b) => a + b, 0) - L.gap * (row.length - 1)) / 2;
    row.forEach((i, n) => { out[i] = { x: x + ws[n] / 2, y: L.rails[r], w: ws[n] }; x += ws[n] + L.gap; });
  });
  return out;
};

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .5 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;
const CHAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='16'%3E%3Crect x='1.6' y='.6' width='4.8' height='9.4' rx='2.4' fill='none' stroke='%23212325' stroke-width='1.7'/%3E%3Cpath d='M2.3 3v4' stroke='%23989da2' stroke-width='.7'/%3E%3Crect x='3.1' y='8' width='1.8' height='9' rx='.9' fill='%23303336'/%3E%3C/svg%3E")`;
const STEEL = "linear-gradient(180deg,#0a0b0c 0%,#34383c 22%,#8d949a 40%,#4a4f54 55%,#131516 82%,#000 100%)";
const enamel = (base: string) => ({
  background: `linear-gradient(114deg,rgba(255,255,255,0.4) 0%,rgba(255,255,255,0.13) 25%,rgba(255,255,255,0) 25.6%),radial-gradient(130% 160% at 26% -12%,rgba(255,255,255,0.16),rgba(255,255,255,0) 46%,rgba(0,0,0,0.3) 100%),${base}`,
  boxShadow: "inset 0 0 0 1px rgba(12,10,8,0.9), inset 0 2px 1px 1px rgba(255,255,255,0.4), inset 0 -2.5px 2px 1px rgba(0,0,0,0.38)",
});
const chips = [
  { left: "3%", top: "70%", w: 7, h: 9 }, { left: "91%", top: "6%", w: 9, h: 6 }, { left: "62%", top: "88%", w: 10, h: 6 },
  { left: "1.5%", top: "12%", w: 6, h: 7 }, { left: "30%", top: "-2%", w: 11, h: 5 },
];

export default function PlatformSignBreadcrumbs() {
  const frame = useRef<HTMLDivElement>(null);
  const hangs = useRef<(HTMLLIElement | null)[]>([]);
  const [narrow, setNarrow] = useState(false);
  const [scale, setScale] = useState(1);
  const [here, setHere] = useState(trail.length - 1);
  const live = useRef({ here: trail.length - 1, touched: false, go: (_n: number) => {}, nudge: (_i: number, _push: number) => {} });
  const L = layoutFor(narrow);
  const spots = place(L);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const fit = () => {
      const slim = el.clientWidth < 760;
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
    const Lay = layoutFor(narrow), at = place(Lay);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const away = (i: number) => Lay.W - at[i].x + at[i].w / 2 + 90; // far enough along the rail to be off the wall
    // Per sign: the trolley (x, vx), the pendulum under it (th, vth) and the turn on its swivel (phi, vphi).
    const s = trail.map((_, i) => {
      const gone = i > live.current.here;
      return { x: gone ? away(i) : 0, vx: 0, goal: gone ? away(i) : 0, th: reduce || gone ? 0 : (i % 2 ? -0.07 : 0.085) * (1 + i * 0.12), vth: 0, phi: i === live.current.here ? 180 : 0, vphi: 0, turn: i === live.current.here ? 180 : 0, due: 0, flipDue: 0, next: 0, nextTurn: 0 };
    });
    const paint = () => {
      s.forEach((p, i) => {
        const li = hangs.current[i];
        if (!li) return;
        li.style.transform = `translate3d(${p.x.toFixed(2)}px,0,0)`;
        li.style.setProperty("--th", `${p.th.toFixed(4)}rad`);
        li.style.setProperty("--phi", `${p.phi.toFixed(2)}deg`);
        li.style.setProperty("--roll", `${(p.x / 9).toFixed(3)}rad`);
        li.style.setProperty("--thin", Math.max(0.04, Math.abs(Math.cos((p.phi * Math.PI) / 180))).toFixed(3));
        li.style.visibility = p.x > away(i) - 6 ? "hidden" : "visible";
      });
    };
    let raf = 0, last = 0, seen = true, timer = 0;
    const tick = (now: number) => {
      raf = 0;
      const dt = Math.min(0.03, last ? (now - last) / 1000 : 0.016);
      last = now;
      s.forEach((p, i) => {
        if (p.due && now >= p.due) { p.goal = p.next; p.due = 0; }
        if (p.flipDue && now >= p.flipDue) { p.turn = p.nextTurn; p.flipDue = 0; }
        if (reduce) { p.x = p.due ? p.x : p.goal; p.phi = p.flipDue ? p.phi : p.turn; p.th = 0; return; }
        const ax = Math.max(-2600, Math.min(2600, (p.goal - p.x) * 24 - p.vx * 8.6));
        p.vx += ax * dt; p.x += p.vx * dt;
        const draught = Math.sin(now / 1300 + i * 2.1) * 0.05 + Math.sin(now / 470 + i) * 0.02;
        p.vth += (-SWING.rate * SWING.rate * Math.sin(p.th) - (ax / SWING.reach) * Math.cos(p.th) - SWING.drag * p.vth + draught) * dt;
        p.th += p.vth * dt;
        p.vphi += ((p.turn - p.phi) * 64 - p.vphi * 8.5) * dt;
        p.phi += p.vphi * dt;
      });
      paint();
      const waiting = s.some((p) => p.due || p.flipDue);
      if (seen && !document.hidden && (!reduce || waiting)) raf = requestAnimationFrame(tick);
    };
    const wake = () => { if (!raf && seen && !document.hidden) { last = 0; raf = requestAnimationFrame(tick); } };
    live.current.go = (n: number) => {
      const was = live.current.here, now = performance.now();
      live.current.here = n;
      s.forEach((p, i) => {
        const out = i > n;
        // The far end leaves first; coming back, the nearest sign arrives first.
        if (out !== p.next > 0 || p.due) { p.next = out ? away(i) : 0; p.due = now + 1 + (reduce ? 0 : out ? (trail.length - 1 - i) * 120 : Math.max(0, i - was - 1) * 170); }
        const turn = i === n ? 180 : 0;
        if (turn !== p.nextTurn || p.flipDue) { p.nextTurn = turn; p.flipDue = now + 1 + (reduce ? 0 : turn ? 300 + Math.max(0, i - was) * 170 : 0); }
      });
      wake();
    };
    s.forEach((p) => { p.next = p.goal; p.nextTurn = p.turn; });
    live.current.nudge = (i: number, push: number) => { if (!reduce) { s[i].vth += push; wake(); } };
    const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; wake(); });
    io.observe(el);
    document.addEventListener("visibilitychange", wake);
    if (DEMO && !reduce && !live.current.touched) {
      const route = [2, trail.length - 1, 1, trail.length - 1];
      let step = 0;
      timer = window.setTimeout(function next() {
        if (live.current.touched) return;
        const n = route[step++ % route.length];
        live.current.go(n); setHere(n);
        timer = window.setTimeout(next, 3300);
      }, 3600);
    }
    paint();
    wake();
    return () => { cancelAnimationFrame(raf); clearTimeout(timer); io.disconnect(); document.removeEventListener("visibilitychange", wake); };
  }, [narrow]);

  const walkTo = (n: number) => { live.current.touched = true; live.current.go(n); setHere(n); };
  const lettering = { fontSize: L.font, letterSpacing: "0.075em", lineHeight: 1 };

  return (
    <div ref={frame} className="relative w-full overflow-clip bg-[#e6dfcf]" style={{ minHeight: L.H * scale }}>
      <style>{`
        .platform-sign-pend { transform: rotate(calc(var(--th, 0rad) * -1)); }
        .platform-sign-plate { transform: perspective(1100px) rotateY(var(--phi, 0deg)); }
        .platform-sign-shadow { transform: scaleX(var(--thin, 1)); }
        .platform-sign-wheel { transform: rotate(var(--roll, 0rad)); }
        .platform-sign-plate:focus-visible .platform-sign-ring { opacity: 1; }
        @media (prefers-reduced-motion: reduce) { .platform-sign-pend { transform: none; } }
      `}</style>
      {/* the platform wall: cream plaster above a painted dado, lit from the top left */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(110% 90% at 30% 0%,#f4eee0 0%,#e7e0cf 48%,#cfc6b1 100%)" }} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[21%]" style={{ background: "linear-gradient(180deg,#22302e 0,#40534f 3px,#475b56 40%,#33443f 100%)", boxShadow: "0 -1px 0 rgba(255,255,255,0.35), 0 -5px 0 #7a2a22, 0 -6px 0 rgba(0,0,0,0.25)" }}>
        <div className="absolute inset-0" style={{ background: "linear-gradient(100deg,rgba(255,255,255,0.14),rgba(255,255,255,0) 40%,rgba(0,0,0,0.18))" }} />
      </div>
      <div className="pointer-events-none absolute inset-0 opacity-30 mix-blend-multiply" style={{ backgroundImage: GRAIN }} />

      <div className="absolute left-1/2 top-0" style={{ width: L.W, height: L.H, marginLeft: -(L.W * scale) / 2, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
        {L.rails.map((y) => (
          <div key={y} aria-hidden="true">
            {/* the rail, its shadow on the wall and the two stand-offs that hold it clear */}
            <div className="absolute rounded-full bg-[#2a2118]" style={{ left: -400, right: -400, top: y + 26, height: 10, filter: "blur(7px)", opacity: 0.3, transform: "translateX(22px)" }} />
            {[0.03, 0.97].map((f) => (
              <div key={f} className="absolute rounded-full" style={{ left: L.W * f - 15, top: y - 15, width: 30, height: 30, background: "radial-gradient(circle at 36% 30%,#7d848a,#2b2e31 55%,#060606)", boxShadow: "0 0 0 1px rgba(0,0,0,0.6), 12px 16px 14px rgba(40,30,15,0.35)" }} />
            ))}
            <div className="absolute" style={{ left: -400, right: -400, top: y - 6, height: 12, background: STEEL, boxShadow: "0 1px 0 rgba(0,0,0,0.5)" }} />
          </div>
        ))}

        <nav aria-label="Breadcrumb" className="absolute inset-0">
          <ol className="absolute inset-0 m-0 list-none p-0">
            {trail.map((label, i) => {
              const sp = spots[i], gone = i > here;
              return (
                <li key={label} ref={(n) => { hangs.current[i] = n; }} aria-hidden={gone || undefined} className="absolute h-0 w-0" style={{ left: sp.x, top: sp.y, willChange: "transform" }}>
                  {/* trolley: two wheels on the rail and a strap that drops to the swivel */}
                  <span aria-hidden="true" className="absolute rounded-b-[9px] rounded-t-[2px]" style={{ left: -17, top: -15, width: 34, height: 33, background: "linear-gradient(180deg,#6b7278 0%,#4a5056 30%,#2c3033 70%,#17191b 100%)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), inset 0 0 0 1px rgba(0,0,0,0.55), 0 2px 3px rgba(0,0,0,0.45), 9px 13px 10px rgba(40,30,15,0.3)" }}>
                    <span className="absolute bottom-[3px] left-[13px] block h-[8px] w-[8px] rounded-full bg-[#08090a] shadow-[0_1px_0_rgba(255,255,255,0.25)]" />
                  </span>
                  {[-11, 11].map((dx) => (
                    <span key={dx} aria-hidden="true" className="platform-sign-wheel absolute rounded-full" style={{ left: dx - 9, top: -24, width: 18, height: 18, background: "radial-gradient(circle at 50% 50%,#0c0d0e 0 1.6px,#33373b 2.2px 6.6px,#15171a 7.2px)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 2px rgba(0,0,0,0.6)" }}>
                      <span className="absolute left-[8px] top-[2px] block h-[3px] w-[2px] rounded-full bg-[#8a9096]" />
                      <span className="absolute bottom-[2px] left-[8px] block h-[3px] w-[2px] rounded-full bg-[#8a9096]" />
                    </span>
                  ))}
                  <span className="platform-sign-pend absolute left-0 block h-0 w-0" style={{ top: 14, transformOrigin: "0 0" }}>
                    <span aria-hidden="true" className="absolute block" style={{ left: -4, top: 0, width: 8, height: L.chain, backgroundImage: CHAIN, backgroundSize: "8px 16px" }} />
                    <span aria-hidden="true" className="platform-sign-shadow absolute block rounded-lg bg-[#2a2118]" style={{ left: -sp.w / 2 + 20, top: L.chain + 26, width: sp.w, height: L.h, filter: "blur(11px)", opacity: 0.34 }} />
                    <span aria-hidden="true" className="absolute block rounded-t-[4px]" style={{ left: -7, top: L.chain - 9, width: 14, height: 13, background: "linear-gradient(90deg,#1b1d1f,#6d7379 45%,#232527)", boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.5)" }}>
                      <span className="absolute left-[4px] top-[2.5px] block h-[6px] w-[6px] rounded-full bg-[#0b0b0b]" />
                    </span>
                    <a
                      href="#"
                      tabIndex={gone ? -1 : undefined}
                      aria-current={i === here ? "page" : undefined}
                      onClick={(e) => { e.preventDefault(); if (!gone) walkTo(i); }}
                      onPointerEnter={(e) => live.current.nudge(i, e.movementX < 0 ? 1.5 : -1.5)}
                      className="platform-sign-plate absolute block outline-none focus-visible:outline-none"
                      style={{ left: -sp.w / 2, top: L.chain, width: sp.w, height: L.h, transformStyle: "preserve-3d" }}
                    >
                      {[false, true].map((back) => (
                        <span
                          key={String(back)}
                          aria-hidden={back || undefined}
                          className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-[8px] font-sans font-extrabold uppercase"
                          style={{ ...enamel(back ? CREAM : BLUE), color: back ? MAROON : "#f7f3e8", transform: back ? "rotateY(180deg) translateZ(1.5px)" : "translateZ(1.5px)", backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", gap: L.arrow * 0.42, paddingTop: back && L.tag ? L.tag + 5 : 0 }}
                        >
                          <span className="pointer-events-none absolute rounded-[4px]" style={{ inset: L.h * 0.075, border: `${narrow ? 1.5 : 2}px solid ${back ? MAROON : "#f7f3e8"}`, opacity: 0.92 }} />
                          {back && L.tag > 0 && (
                            <span className="absolute inset-x-0 text-center font-bold text-[#b3261c]" style={{ top: L.h * 0.2, fontSize: L.tag, letterSpacing: "0.3em" }}>You are here</span>
                          )}
                          <span className="relative whitespace-nowrap" style={{ ...lettering, textShadow: back ? "0 1px 0 rgba(255,255,255,0.5)" : "0 1px 1px rgba(0,0,20,0.45)" }}>{label}</span>
                          {!back && (
                            <svg aria-hidden="true" viewBox="0 0 24 16" className="relative shrink-0" style={{ width: L.arrow * 0.72, height: L.arrow * 0.48 }}>
                              <path d="M1 8h18M13 2l7 6-7 6" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="square" strokeLinejoin="miter" />
                            </svg>
                          )}
                          {chips.slice(back ? 3 : (i * 2) % 3, back ? 5 : ((i * 2) % 3) + 2).map((c) => (
                            <span key={c.left} className="pointer-events-none absolute block" style={{ left: c.left, top: c.top, width: c.w, height: c.h, borderRadius: "58% 42% 50% 46% / 44% 60% 40% 56%", background: "radial-gradient(circle at 40% 40%,#5b3a22,#2a1a10)", boxShadow: "0 0 0 1px rgba(150,84,34,0.55), inset 0 1px 1px rgba(0,0,0,0.6)" }} />
                          ))}
                        </span>
                      ))}
                      <span aria-hidden="true" className="platform-sign-ring pointer-events-none absolute -inset-2 block rounded-xl opacity-0 ring-4 ring-[#f59e0b]" style={{ transform: "translateZ(3px)" }} />
                    </a>
                  </span>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      <div className="absolute inset-x-0 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-4 font-mono text-[10px] uppercase tracking-[0.16em] text-[#e9efe9] sm:text-[11px]" style={{ bottom: `calc(10.5% - 20px)` }}>
        <p aria-live="polite" className="m-0 text-center leading-5">
          {trail.slice(0, here + 1).map((t, i) => (
            <span key={t} className={i === here ? "font-bold text-white" : "text-[#c5d2cc]"}>{i > 0 && <span className="mx-1.5 text-[#93a59e]">/</span>}{t}</span>
          ))}
        </p>
        <button
          type="button"
          disabled={here === trail.length - 1}
          onClick={() => walkTo(trail.length - 1)}
          className="min-h-[40px] rounded-full border border-white/35 bg-white/10 px-4 font-mono text-[10px] uppercase tracking-[0.16em] text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f59e0b] disabled:opacity-45 motion-reduce:transition-none sm:text-[11px]"
        >
          Rehang the trail
        </button>
      </div>
    </div>
  );
}
