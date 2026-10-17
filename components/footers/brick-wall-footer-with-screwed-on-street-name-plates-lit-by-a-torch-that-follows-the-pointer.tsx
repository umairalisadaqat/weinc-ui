import { useEffect, useRef } from "react";

// Everything a visitor is likely to change sits here.
const BRAND = "Aldous & Reeve"; // painted across the top of the wall, long since faded
const quarters = [
  { title: "Shop", finish: "white", links: [["Catalogue", "Row"], ["Seconds", "Yard"], ["Gift Cards", "Lane"]] },
  { title: "Studio", finish: "blue", links: [["About", "Street"], ["Journal", "Walk"], ["Open Days", "Court"]] },
  { title: "Help", finish: "iron", links: [["Contact", "Place"], ["Delivery", "Mews"], ["Returns", "Passage"]] },
] as const;
const small = ["Privacy", "Terms", "Trade accounts"];
const BRICKS = ["#7c3a2b", "#8b4633", "#6d3024", "#96503a", "#5c2a22", "#a25a40", "#743427"]; // the mix of fired clay in the wall
const TORCH = { warm: "255,206,142", night: 0.48, reach: 430 }; // light colour, how dark the unlit wall gets (0 to 0.6), and the pool's radius in pixels
const DRIFT = true; // let the light wander by itself until a pointer or the keyboard takes it

const GRAIN = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .6 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;
const finishes = {
  white: { face: "#f4f1e8", ink: "#141518", line: "#141518", sub: "#b3261c", gloss: 0.62, font: '"Arial Narrow", "Helvetica Neue", Helvetica, Arial, sans-serif', raised: false },
  blue: { face: "#143278", ink: "#f8f5ec", line: "#f8f5ec", sub: "#c9d6f2", gloss: 0.5, font: '"Arial Narrow", "Helvetica Neue", Helvetica, Arial, sans-serif', raised: false },
  iron: { face: "#1c1d20", ink: "#f1ead9", line: "#f1ead9", sub: "#d8cfba", gloss: 0.16, font: 'Georgia, "Times New Roman", serif', raised: true },
};
const TILT = [-0.5, 0.35, -0.2, 0.3, -0.4, 0.15, 0.45, -0.3, 0.2];

// Lays the wall once: mortar bed, bricks in stretcher bond, the faded painted name, and two sets of
// edge lines (lit from the left, lit from the right) that the moving light fades between.
function layWall(base: HTMLCanvasElement, fromLeft: HTMLCanvasElement, fromRight: HTMLCanvasElement, W: number, H: number, k: number) {
  for (const c of [base, fromLeft, fromRight]) { c.width = Math.ceil(W * k); c.height = Math.ceil(H * k); }
  const c = base.getContext("2d"), l = fromLeft.getContext("2d"), r = fromRight.getContext("2d");
  if (!c || !l || !r) return;
  for (const x of [c, l, r]) x.setTransform(k, 0, 0, k, 0, 0);
  let seed = 11;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const rr = (x: number, y: number, w: number, h: number, q: number) => { c.beginPath(); c.moveTo(x + q, y); c.arcTo(x + w, y, x + w, y + h, q); c.arcTo(x + w, y + h, x, y + h, q); c.arcTo(x, y + h, x, y, q); c.arcTo(x, y, x + w, y, q); c.closePath(); };
  c.fillStyle = "#81776a"; c.fillRect(0, 0, W, H);
  for (let i = 0; i < (W * H) / 26; i++) { c.fillStyle = rand() > 0.5 ? "rgba(255,245,225,0.09)" : "rgba(0,0,0,0.13)"; c.fillRect(rand() * W, rand() * H, 1 + rand(), 1 + rand()); }
  const BW = W < 700 ? 70 : 88, BH = W < 700 ? 21 : 26, M = W < 700 ? 3.2 : 4;
  for (let y = -BH * 0.4, row = 0; y < H; y += BH + M, row++) {
    for (let x = row % 2 ? -(BW + M) / 2 : -rand() * 3; x < W; x += BW + M) {
      const w = BW + (rand() - 0.5) * 1.6, h = BH + (rand() - 0.5) * 1.2, yy = y + (rand() - 0.5) * 0.9;
      const tone = rand() < 0.07 ? "#3b2723" : BRICKS[Math.floor(rand() * BRICKS.length)];
      c.fillStyle = "rgba(0,0,0,0.42)"; rr(x + 0.4, yy + 1.8, w, h, 2); c.fill(); // the brick's own shadow on the raked joint below
      c.fillStyle = tone; rr(x, yy, w, h, 2.2); c.fill();
      c.save(); c.clip();
      const face = c.createLinearGradient(0, yy, 0, yy + h);
      face.addColorStop(0, "rgba(255,226,196,0.2)"); face.addColorStop(0.35, "rgba(255,226,196,0)"); face.addColorStop(1, "rgba(0,0,0,0.24)");
      c.fillStyle = face; c.fillRect(x, yy, w, h);
      for (let i = 0; i < 4; i++) { c.fillStyle = `rgba(${rand() > 0.5 ? "255,196,150" : "24,8,6"},${0.02 + rand() * 0.05})`; c.beginPath(); c.ellipse(x + rand() * w, yy + rand() * h, 14 + rand() * 30, 5 + rand() * 9, rand() * 3, 0, 6.3); c.fill(); }
      for (let i = 0; i < 34; i++) { c.fillStyle = rand() > 0.55 ? `rgba(20,8,6,${0.12 + rand() * 0.25})` : `rgba(255,220,190,${0.06 + rand() * 0.14})`; c.fillRect(x + rand() * w, yy + rand() * h, 0.7 + rand() * 1.3, 0.7 + rand() * 1.1); }
      if (rand() < 0.12) { c.fillStyle = "rgba(238,228,206,0.1)"; c.fillRect(x, yy, w, h); } // a touch of lime bloom
      c.restore();
      l.fillStyle = "rgba(255,216,170,0.6)"; l.fillRect(x, yy + 1.5, 1.5, h - 3); l.fillStyle = "rgba(0,0,0,0.55)"; l.fillRect(x + w - 0.5, yy + 1, 2.6, h);
      r.fillStyle = "rgba(255,216,170,0.6)"; r.fillRect(x + w - 1.5, yy + 1.5, 1.5, h - 3); r.fillStyle = "rgba(0,0,0,0.55)"; r.fillRect(x - 2.1, yy + 1, 2.6, h);
    }
  }
  // The old painted name: cream lead paint that has let go of the joints and flaked off the faces.
  const ghost = document.createElement("canvas");
  ghost.width = base.width; ghost.height = base.height;
  const g = ghost.getContext("2d");
  if (g) {
    g.setTransform(k, 0, 0, k, 0, 0);
    let size = Math.min(104, W / 9.2);
    g.font = `700 ${size}px Georgia, "Times New Roman", serif`;
    const fit = (W - 48) / g.measureText(BRAND.toUpperCase()).width;
    if (fit < 1) { size *= fit; g.font = `700 ${size}px Georgia, "Times New Roman", serif`; }
    g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = "#efe5cd";
    const cy = W < 700 ? 62 : 92;
    g.fillText(BRAND.toUpperCase(), W / 2, cy);
    g.fillRect(W / 2 - size * 2.2, cy + size * 0.62, size * 4.4, Math.max(2, size * 0.045));
    g.globalCompositeOperation = "destination-out";
    for (let y = -BH * 0.4 + BH; y < cy + size; y += BH + M) { g.fillStyle = "rgba(0,0,0,0.8)"; g.fillRect(0, y - 0.5, W, M + 1); }
    for (let i = 0; i < W * 2.2; i++) { g.fillStyle = `rgba(0,0,0,${0.3 + rand() * 0.7})`; g.beginPath(); g.ellipse(rand() * W, cy - size + rand() * size * 2, 0.6 + rand() * 3.6, 0.5 + rand() * 2.2, rand() * 3, 0, 6.3); g.fill(); }
    c.globalAlpha = 0.62; c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(ghost, 0, 0); c.setTransform(k, 0, 0, k, 0, 0); c.globalAlpha = 1;
  }
  const soot = c.createLinearGradient(0, 0, 0, H);
  soot.addColorStop(0, "rgba(10,6,8,0.2)"); soot.addColorStop(0.2, "rgba(10,6,8,0)"); soot.addColorStop(0.75, "rgba(10,6,8,0)"); soot.addColorStop(1, "rgba(10,6,8,0.36)");
  c.fillStyle = soot; c.fillRect(0, 0, W, H);
}

export default function BrickWallFooter() {
  const root = useRef<HTMLElement>(null);
  const layers = useRef<(HTMLCanvasElement | null)[]>([]);
  const plates = useRef<(HTMLAnchorElement | null)[]>([]);
  const aim = useRef<(x: number, y: number, hold: boolean) => void>(() => {});

  useEffect(() => {
    const el = root.current, [base, fromLeft, fromRight] = layers.current;
    if (!el || !base || !fromLeft || !fromRight) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, raf = 0, seen = true, last = 0;
    let rects: { x: number; y: number; w: number; h: number }[] = [];
    const light = { x: 0, y: 0, tx: 0, ty: 0, held: 0, born: performance.now() };
    const measure = () => {
      const box = el.getBoundingClientRect();
      rects = plates.current.map((p) => { const b = p ? p.getBoundingClientRect() : box; return { x: b.left - box.left, y: b.top - box.top, w: b.width, h: b.height }; });
      if (Math.abs(box.width - W) < 1 && Math.abs(box.height - H) < 1) return;
      const first = !W;
      W = box.width; H = box.height;
      layWall(base, fromLeft, fromRight, W, H, Math.min(1.5, window.devicePixelRatio || 1));
      if (first) { light.x = light.tx = W * 0.36; light.y = light.ty = H * 0.44; }
    };
    const paint = () => {
      el.style.setProperty("--lx", `${light.x.toFixed(1)}px`);
      el.style.setProperty("--ly", `${light.y.toFixed(1)}px`);
      rects.forEach((b, i) => {
        const p = plates.current[i];
        if (!p) return;
        const dx = b.x + b.w / 2 - light.x, dy = b.y + b.h / 2 - light.y, d = Math.hypot(dx, dy) || 1, far = Math.min(1, d / 260);
        p.style.setProperty("--gx", `${(light.x - b.x).toFixed(1)}px`);
        p.style.setProperty("--gy", `${(light.y - b.y).toFixed(1)}px`);
        p.style.setProperty("--sx", ((dx / d) * far).toFixed(3));
        p.style.setProperty("--sy", ((dy / d) * far * 0.8 + 0.25).toFixed(3)); // the street lamp overhead keeps a little shadow underneath
      });
    };
    const tick = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016), t = (now - light.born) / 1000;
      last = now;
      if (DRIFT && now > light.held) { light.tx = W * (0.5 + 0.33 * Math.sin(t * 0.46 - 1.55)); light.ty = H * (0.47 + 0.19 * Math.sin(t * 0.71 + 0.4)); }
      const ease = 1 - Math.exp(-dt * (now > light.held ? 2.2 : 11));
      light.x += (light.tx - light.x) * ease; light.y += (light.ty - light.y) * ease;
      paint();
      if (seen && !document.hidden) raf = requestAnimationFrame(tick);
    };
    const wake = () => { if (!reduce && !raf && seen && !document.hidden) { last = 0; raf = requestAnimationFrame(tick); } };
    aim.current = (x, y, hold) => {
      const box = el.getBoundingClientRect();
      light.tx = x - box.left; light.ty = y - box.top;
      light.held = hold ? performance.now() + 1600 : 0;
      if (reduce) { light.x = light.tx; light.y = light.ty; paint(); }
    };
    const ro = new ResizeObserver(() => { measure(); paint(); });
    ro.observe(el);
    const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; wake(); });
    io.observe(el);
    document.addEventListener("visibilitychange", wake);
    measure(); paint(); wake();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", wake); };
  }, []);

  const mask = (side: "left" | "right") => {
    const m = side === "left" ? "linear-gradient(90deg,transparent calc(var(--lx) - 30px),#000 calc(var(--lx) + 170px))" : "linear-gradient(90deg,#000 calc(var(--lx) - 170px),transparent calc(var(--lx) + 30px))";
    return { maskImage: m, WebkitMaskImage: m };
  };
  let n = 0;

  return (
    <footer
      ref={root}
      onPointerMove={(e) => aim.current(e.clientX, e.clientY, true)}
      onPointerDown={(e) => aim.current(e.clientX, e.clientY, true)}
      className="relative isolate w-full overflow-clip bg-[#5d2c23] text-[#f1ead9]"
      style={{ ["--lx" as string]: "36%", ["--ly" as string]: "44%" }}
    >
      {[0, 1, 2].map((i) => (
        <canvas key={i} ref={(c) => { layers.current[i] = c; }} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 h-full w-full" style={i === 1 ? mask("left") : i === 2 ? mask("right") : undefined} />
      ))}

      <div className="relative mx-auto flex min-h-[660px] max-w-5xl flex-col px-4 pb-6 pt-[124px] sm:px-8 sm:pt-[196px]">
        <p className="sr-only">{BRAND}, potters</p>
        <div className="grid grid-cols-1 gap-x-9 gap-y-7 sm:grid-cols-3">
          {quarters.map((q) => {
            const f = finishes[q.finish];
            return (
              <nav key={q.title} aria-label={q.title}>
                <h2 className="relative z-20 mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.34em] text-[#f1ead9]" style={{ textShadow: "0 1px 1px rgba(0,0,0,0.6)" }}>{q.title}</h2>
                <ul className="m-0 flex list-none flex-col gap-4 p-0">
                  {q.links.map(([name, kind], row) => {
                    const i = n++;
                    return (
                      <li key={name}>
                        <a
                          href="#"
                          ref={(a) => { plates.current[i] = a; }}
                          onFocus={(e) => { const b = e.currentTarget.getBoundingClientRect(); aim.current(b.left + b.width * 0.3, b.top + b.height * 0.4, true); }}
                          className="group relative block min-h-[68px] rounded-[7px] transition-transform duration-200 ease-out hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-[#fbbf24] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                          style={{
                            rotate: `${TILT[i % TILT.length]}deg`,
                            color: f.ink,
                            background: `radial-gradient(140% 170% at 24% -20%,rgba(255,255,255,${f.raised ? 0.1 : 0.2}),rgba(255,255,255,0) 46%,rgba(0,0,0,0.26) 100%),${f.face}`,
                            boxShadow: `inset 0 0 0 1px rgba(8,8,8,0.9), inset 0 2px 1px 1px rgba(255,255,255,${f.raised ? 0.22 : 0.45}), inset 0 -2.5px 2px 1px rgba(0,0,0,0.4), calc(var(--sx,0.2) * 2px) calc(var(--sy,0.4) * 2px) 2px rgba(0,0,0,0.55), calc(var(--sx,0.2) * 11px) calc(var(--sy,0.4) * 11px) 14px rgba(0,0,0,0.5)`,
                          }}
                        >
                          {f.raised && <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[7px] opacity-70 mix-blend-overlay" style={{ backgroundImage: GRAIN, backgroundSize: "110px 110px" }} />}
                          <span aria-hidden="true" className="pointer-events-none absolute inset-[6px] rounded-[3px]" style={{ border: `2px solid ${f.line}`, boxShadow: f.raised ? "calc(var(--sx,0.2) * 1.4px) calc(var(--sy,0.4) * 1.4px) 0.5px rgba(0,0,0,0.7)" : undefined }} />
                          {/* the torch's hot spot on the glaze, exactly where the beam lands */}
                          <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[7px]" style={{ background: `radial-gradient(circle 190px at var(--gx,30%) var(--gy,40%),rgba(255,250,236,${f.gloss}) 0,rgba(255,250,236,${f.gloss * 0.42}) 22%,rgba(255,250,236,0) 62%)`, mixBlendMode: f.raised ? "screen" : "normal" }} />
                          <span className="relative flex min-h-[68px] flex-col justify-center px-9 py-2">
                            <span className={`block whitespace-nowrap font-extrabold uppercase leading-none ${f.raised ? "text-[21px] sm:text-[17px] lg:text-[20px]" : "text-[25px] sm:text-[22px] lg:text-[27px]"}`} style={{ fontFamily: f.font, letterSpacing: f.raised ? "0.05em" : "0.045em", textShadow: f.raised ? "calc(var(--sx,0.2) * 1.6px) calc(var(--sy,0.4) * 1.6px) 0.6px rgba(0,0,0,0.85), calc(var(--sx,0.2) * -0.8px) calc(var(--sy,0.4) * -0.8px) 0 rgba(255,255,255,0.55)" : "0 0.6px 0 rgba(0,0,0,0.25)" }}>
                              {name} {kind}
                            </span>
                            <span aria-hidden="true" className="mt-[7px] flex justify-between text-[9.5px] font-bold uppercase leading-none tracking-[0.2em]" style={{ color: f.sub }}>
                              <span>{q.title} quarter</span>
                              <span>{q.title[0]}{row + 1}</span>
                            </span>
                          </span>
                          {[["left-[13px]", 28], ["right-[13px]", 118]].map(([side, turn]) => (
                            <span key={side} aria-hidden="true" className={`pointer-events-none absolute top-1/2 -mt-[5px] block h-[10px] w-[10px] rounded-full ${side}`} style={{ background: "radial-gradient(circle at 36% 30%,#f2f2ee,#9a9c9c 45%,#3d3f41)", boxShadow: "0 0 0 1px rgba(0,0,0,0.55), calc(var(--sx,0.2) * 1.5px) calc(var(--sy,0.4) * 1.5px) 1px rgba(0,0,0,0.5)" }}>
                              <span className="absolute left-[1.5px] top-[4.2px] block h-[1.6px] w-[7px] bg-[#1d1e20]" style={{ rotate: `${Number(turn) + i * 37}deg` }} />
                            </span>
                          ))}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            );
          })}
        </div>

        <div className="relative z-20 mt-auto flex flex-wrap items-center justify-between gap-x-6 gap-y-1 pt-10 font-mono text-[11px] uppercase tracking-[0.2em] text-[#f1ead9]" style={{ textShadow: "0 1px 1px rgba(0,0,0,0.7)" }}>
          <p className="m-0 py-2">© 2026 {BRAND}</p>
          <ul className="m-0 flex list-none flex-wrap gap-x-5 p-0">
            {small.map((s) => (
              <li key={s}>
                <a href="#" className="inline-flex min-h-[40px] items-center rounded underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fbbf24]">{s}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* night, and the pool of torchlight that pushes it back */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10" style={{ background: `radial-gradient(circle ${TORCH.reach * 1.9}px at var(--lx) var(--ly),rgba(9,7,14,0) 0,rgba(9,7,14,${TORCH.night * 0.45}) 38%,rgba(9,7,14,${TORCH.night}) 78%)` }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 mix-blend-overlay" style={{ background: `radial-gradient(circle ${TORCH.reach}px at var(--lx) var(--ly),rgba(${TORCH.warm},0.62) 0,rgba(${TORCH.warm},0.26) 42%,rgba(${TORCH.warm},0) 100%)` }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 mix-blend-soft-light" style={{ background: `radial-gradient(circle ${TORCH.reach * 0.42}px at var(--lx) var(--ly),rgba(255,244,214,0.5) 0,rgba(255,244,214,0) 100%)` }} />
    </footer>
  );
}
