import { useEffect, useRef, useState } from "react";

// One stack per month. `coins` is how many deposits were made that month.
const months = [
  { label: "Jun", coins: 5 },
  { label: "Jul", coins: 9 },
  { label: "Aug", coins: 7 },
  { label: "Sep", coins: 14 },
  { label: "Oct", coins: 4 },
];
const COIN = 50; // what one coin is worth
const UNIT = "vale"; // an invented currency: rename it to yours
const MAX = 20; // the tallest a stack may grow
const FUND = "Rainy-day fund";

type Coin = { v: number; jx: number; y: number; vy: number; wob: number; wv: number; rest: boolean; wait: number; gone: boolean; a: number; dx: number };

const STOPS: [number, number, number][] = [[70, 40, 8], [140, 92, 22], [203, 150, 48], [240, 203, 106], [255, 246, 208]];
const gold = (t: number, tone = 1) => {
  const p = Math.max(0, Math.min(0.9999, t)) * (STOPS.length - 1), i = Math.floor(p), f = p - i, a = STOPS[i], b = STOPS[i + 1];
  return `rgb(${Math.min(255, (a[0] + (b[0] - a[0]) * f) * tone) | 0},${Math.min(255, (a[1] + (b[1] - a[1]) * f) * tone) | 0},${Math.min(255, (a[2] + (b[2] - a[2]) * f) * (2 - tone)) | 0})`;
};

export default function MintedCoinStacks() {
  const wrap = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLUListElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [counts, setCounts] = useState(months.map((m) => m.coins));
  const [shown, setShown] = useState(months.reduce((n, m) => n + m.coins, 0) * COIN);
  const [last, setLast] = useState<number[]>([]);
  const api = useRef<{ add: (i: number, user: boolean) => void; take: (i: number, user: boolean) => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current, box = wrap.current;
    if (!cv || !box) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const n = months.length;
    let W = 0, H = 0, side = 0, rx = 0, ry = 0, th = 0, ground = 0, sprites: HTMLCanvasElement[] = [], pad = 6;
    let seed = 11;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const make = (wait: number, fall: boolean): Coin => ({ v: Math.floor(rand() * 6), jx: (rand() - 0.5) * 0.09, y: fall ? 1 : 0, vy: 0, wob: 0, wv: 0, rest: !fall, wait, gone: false, a: 1, dx: 0 });
    // Opening: every stack already stands at its value. Coins only fall for deposits made after that.
    const stacks: Coin[][] = months.map((m) => Array.from({ length: m.coins }, () => make(0, false)));
    const leaving: { c: Coin; x: number; y: number; vx: number }[] = [];

    // One coin, drawn once per variant: reeded edge below, struck face above.
    const strike = (v: number) => {
      const sp = document.createElement("canvas");
      const w = rx * 2 + pad * 2, h = ry * 2 + th + pad * 2;
      sp.width = Math.ceil(w * dpr); sp.height = Math.ceil(h * dpr);
      const c = sp.getContext("2d");
      if (!c) return sp;
      c.scale(dpr, dpr);
      const cx = w / 2, cy = pad + ry, tone = 0.93 + (v % 3) * 0.05, turn = v * 1.13 + 0.4;
      // Edge: a band between two half ellipses, lit from the upper left.
      c.beginPath(); c.moveTo(cx - rx, cy); c.lineTo(cx - rx, cy + th); c.ellipse(cx, cy + th, rx, ry, 0, Math.PI, 0, true); c.lineTo(cx + rx, cy); c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI, false); c.closePath();
      const eg = c.createLinearGradient(cx - rx, 0, cx + rx, 0);
      ([[0, 0.16], [0.07, 0.4], [0.2, 0.7], [0.29, 1], [0.36, 0.78], [0.5, 0.52], [0.66, 0.36], [0.8, 0.6], [0.9, 0.36], [1, 0.1]] as [number, number][]).forEach(([p, t]) => eg.addColorStop(p, gold(t, tone)));
      c.fillStyle = eg; c.fill();
      c.save(); c.clip();
      for (let d = -88; d <= 88; d += 2.6) {
        const a = (d * Math.PI) / 180, x = cx + rx * Math.sin(a), y = cy + ry * Math.cos(a);
        c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + th + 1); c.lineWidth = Math.max(0.5, rx * 0.014); c.strokeStyle = "rgba(50,26,0,0.3)"; c.stroke();
        c.beginPath(); c.moveTo(x + rx * 0.014, y); c.lineTo(x + rx * 0.014, y + th + 1); c.lineWidth = Math.max(0.4, rx * 0.01); c.strokeStyle = "rgba(255,240,190,0.3)"; c.stroke();
      }
      const shade = c.createLinearGradient(0, cy, 0, cy + th + ry);
      shade.addColorStop(0, "rgba(255,244,200,0.28)"); shade.addColorStop(0.25, "rgba(0,0,0,0)"); shade.addColorStop(1, "rgba(40,18,0,0.36)");
      c.fillStyle = shade; c.fillRect(0, 0, w, h);
      c.restore();
      // Face, drawn as a circle and squashed into perspective.
      c.save(); c.translate(cx, cy); c.scale(1, ry / rx);
      c.beginPath(); c.arc(0, 0, rx, 0, Math.PI * 2);
      if (typeof c.createConicGradient === "function") {
        const g = c.createConicGradient(-2.3, 0, 0);
        ([[0, 0.98], [0.06, 0.8], [0.15, 0.58], [0.26, 0.44], [0.37, 0.6], [0.47, 0.8], [0.52, 0.7], [0.62, 0.5], [0.74, 0.4], [0.86, 0.56], [0.95, 0.84], [1, 0.98]] as [number, number][]).forEach(([p, t]) => g.addColorStop(p, gold(t, tone)));
        c.fillStyle = g;
      } else c.fillStyle = gold(0.6, tone);
      c.fill();
      // Raised rim with a bright inner shoulder.
      const rim = c.createLinearGradient(-rx, -rx, rx, rx);
      rim.addColorStop(0, gold(1, tone)); rim.addColorStop(0.45, gold(0.62, tone)); rim.addColorStop(1, gold(0.2, tone));
      c.lineWidth = rx * 0.085; c.strokeStyle = rim; c.beginPath(); c.arc(0, 0, rx * 0.955, 0, Math.PI * 2); c.stroke();
      c.lineWidth = Math.max(0.6, rx * 0.016); c.strokeStyle = "rgba(60,30,0,0.55)"; c.beginPath(); c.arc(0, 0, rx * 0.905, 0, Math.PI * 2); c.stroke();
      c.strokeStyle = "rgba(255,246,208,0.5)"; c.beginPath(); c.arc(0, 0, rx * 0.89, 0.6, 3.6); c.stroke();
      c.rotate(turn);
      // A ring of beads, each with its own highlight and shadow.
      for (let i = 0; i < 44; i++) {
        const a = (i / 44) * Math.PI * 2, bx = Math.cos(a) * rx * 0.8, by = Math.sin(a) * rx * 0.8, br = rx * 0.024;
        c.beginPath(); c.arc(bx + br * 0.5, by + br * 0.6, br, 0, Math.PI * 2); c.fillStyle = "rgba(60,30,0,0.5)"; c.fill();
        c.beginPath(); c.arc(bx, by, br, 0, Math.PI * 2); c.fillStyle = gold(0.86, tone); c.fill();
      }
      // The struck numeral: shadow below, highlight above, metal between.
      c.textAlign = "center"; c.textBaseline = "middle";
      const emboss = (text: string, y: number, font: string, d: number) => {
        c.font = font;
        c.fillStyle = "rgba(58,28,0,0.62)"; c.fillText(text, d, y + d * 1.3);
        c.fillStyle = "rgba(255,248,214,0.9)"; c.fillText(text, -d * 0.8, y - d);
        c.fillStyle = gold(0.7, tone); c.fillText(text, 0, y);
      };
      emboss(String(COIN), -rx * 0.07, `700 ${rx * 0.78}px Georgia, "Times New Roman", serif`, rx * 0.022);
      emboss(UNIT.toUpperCase().split("").join(" "), rx * 0.47, `700 ${rx * 0.13}px ui-sans-serif, system-ui, sans-serif`, rx * 0.012);
      c.restore();
      // One soft band of sky across the face ties every coin to the same light.
      c.save(); c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); c.clip();
      const band = c.createLinearGradient(cx - rx, cy - ry, cx + rx * 0.4, cy + ry);
      band.addColorStop(0, "rgba(255,255,255,0.5)"); band.addColorStop(0.32, "rgba(255,255,255,0.06)"); band.addColorStop(1, "rgba(60,26,0,0.22)");
      c.fillStyle = band; c.fillRect(0, 0, w, h); c.restore();
      c.lineWidth = 0.8; c.strokeStyle = "rgba(60,30,0,0.5)"; c.beginPath(); c.ellipse(cx, cy, rx - 0.3, ry - 0.3, 0, 0, Math.PI * 2); c.stroke();
      return sp;
    };

    const layout = () => {
      W = Math.max(280, box.clientWidth); H = W < 600 ? 330 : 520; side = W < 600 ? 4 : 72;
      rx = Math.round(Math.min(78, ((W - side * 2) / n) * 0.45)); ry = rx * 0.36; th = Math.max(5, Math.round(rx * 0.215)); ground = H - (W < 600 ? 36 : 54) - th;
      if (grid.current) { grid.current.style.paddingLeft = `${side}px`; grid.current.style.paddingRight = `${side}px`; }
      cv.width = W * dpr; cv.height = H * dpr; cv.style.height = `${H}px`;
      sprites = Array.from({ length: 6 }, (_, v) => strike(v));
    };
    const colX = (i: number) => side + ((W - side * 2) * (i + 0.5)) / n;
    const blob = (x: number, y: number, sx: number, sy: number, rgb: string, alpha: number) => {
      ctx.save(); ctx.translate(x, y); ctx.scale(sx, sy);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      g.addColorStop(0, `rgba(${rgb},${alpha})`); g.addColorStop(0.55, `rgba(${rgb},${alpha * 0.45})`); g.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    };
    const put = (c: Coin, x: number, yTop: number) => {
      const sp = sprites[c.v], w = rx * 2 + pad * 2, h = ry * 2 + th + pad * 2;
      ctx.save(); ctx.globalAlpha = c.a * (c.rest ? 1 : Math.max(0, Math.min(1, (yTop - H * 0.14) / (H * 0.1)))); ctx.translate(x, yTop + th / 2); ctx.rotate(c.wob);
      ctx.drawImage(sp, -w / 2, -th / 2 - ry - pad, w, h); ctx.restore();
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      const base = ground + th;
      stacks.forEach((st, i) => {
        const x = colX(i), down = st.filter((c) => c.rest || c.y < 4).length, tall = down * th;
        // Warm light bounced off the gold, then the long shadow, then the tight one where metal meets table.
        blob(x, base + ry * 0.3, rx * 1.5, ry * 1.7, "214,150,40", 0.1);
        blob(x + rx * 0.45 + tall * 0.22, base + ry * 0.2 + tall * 0.03, rx * 1.1 + tall * 0.26, ry * 1.25 + tall * 0.03, "60,40,20", 0.24);
        blob(x + rx * 0.05, base + ry * 0.1, rx * 1.16, ry * 1.3, "40,24,8", 0.62);
        blob(x + rx * 0.02, base + ry * 0.02, rx * 1.04, ry * 1.08, "30,16,4", 0.5);
      });
      stacks.forEach((st, i) => {
        const x = colX(i);
        st.forEach((c, j) => {
          if (c.wait > 0) return;
          const yTop = ground - j * th - c.y;
          if (!c.rest && c.y > 2 && c.y < 220) {
            // A falling coin darkens what is under it, tighter the closer it gets.
            const f = 1 - c.y / 220;
            ctx.save(); ctx.beginPath(); ctx.ellipse(x + c.y * 0.1, ground - j * th + th - (j ? 0 : -ry * 0.1), rx * (0.92 + (1 - f) * 0.2), ry * (0.92 + (1 - f) * 0.2), 0, 0, Math.PI * 2); ctx.fillStyle = `rgba(50,26,0,${0.34 * f * f})`; ctx.fill(); ctx.restore();
          }
          put(c, x + c.jx * rx + c.dx, yTop);
        });
      });
      leaving.forEach((l) => put(l.c, l.x, l.y));
    };

    let raf = 0, prev = 0, t0 = 0, seen = true, touched = -1e9, nextDemo = 4200, demoDir = 1, shownNow = months.reduce((s, m) => s + m.coins, 0) * COIN, shownSent = shownNow;
    const total = () => stacks.reduce((s, st) => s + st.length, 0) * COIN;
    const sync = () => setCounts(stacks.map((st) => st.length));

    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; prev = now; }
      const dt = Math.min(0.032, (now - prev) / 1000); prev = now;
      const t = now - t0;
      stacks.forEach((st) => st.forEach((c, j) => {
        if (c.wait > 0) { c.wait -= dt; if (c.wait <= 0) { c.y = ground - j * th + ry + th + 30; c.vy = -260; } return; }
        if (!c.rest) {
          c.vy -= 3400 * dt; c.y += c.vy * dt;
          if (c.y <= 0) {
            c.y = 0;
            const hit = -c.vy;
            if (hit > 260) { c.vy = hit * 0.26; c.wv += (j % 2 ? 1 : -1) * Math.min(4.2, hit * 0.004); for (let b = 0; b < j; b++) { st[b].wv += (rand() - 0.5) * 0.9; st[b].dx += (rand() - 0.5) * 0.5; } }
            else { c.vy = 0; c.rest = true; }
          }
        }
        // The rock a coin makes as it settles flat.
        c.wv += (-520 * c.wob - 13 * c.wv) * dt; c.wob += c.wv * dt;
        c.wob = Math.max(-0.11, Math.min(0.11, c.wob)); c.dx *= 1 - Math.min(1, dt * 6);
      }));
      for (let i = leaving.length - 1; i >= 0; i--) {
        const l = leaving[i];
        l.c.vy += 2200 * dt; l.y += l.c.vy * dt; l.x += l.vx * dt; l.c.wob += l.vx * 0.004 * dt * 8; l.c.a -= dt * 3.2;
        if (l.c.a <= 0) leaving.splice(i, 1); else l.c.a = Math.max(0, l.c.a);
      }
      // Left alone, the newest month keeps saving, then spends back down.
      if (t > nextDemo && now - touched > 6000) {
        const st = stacks[n - 1];
        if (demoDir > 0 && st.length >= Math.min(MAX, months[n - 1].coins + 7)) demoDir = -1;
        if (demoDir < 0 && st.length <= months[n - 1].coins) demoDir = 1;
        if (demoDir > 0) drop(n - 1); else lift(n - 1);
        nextDemo = t + (demoDir > 0 ? 1150 : 520);
      }
      const goal = total();
      if (shownNow !== goal) { shownNow += (goal - shownNow) * Math.min(1, dt * 12); if (Math.abs(goal - shownNow) < 0.6) shownNow = goal; }
      if (Math.round(shownNow) !== shownSent) { shownSent = Math.round(shownNow); setShown(shownSent); }
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { prev = performance.now(); raf = requestAnimationFrame(frame); } };
    const still = () => { stacks.forEach((st) => st.forEach((c) => { c.wait = 0; c.y = 0; c.rest = true; c.wob = 0; })); leaving.length = 0; setShown(total()); draw(); };

    const drop = (i: number) => {
      const st = stacks[i];
      if (st.length >= MAX) return;
      const c = make(0, true); c.y = Math.max(160, ground - st.length * th + ry + th + 30); c.vy = -200;
      st.push(c); sync();
    };
    const lift = (i: number) => {
      const st = stacks[i];
      if (!st.length) return;
      const c = st.pop() as Coin;
      leaving.push({ c: { ...c, vy: -520, wv: 0 }, x: colX(i) + c.jx * rx, y: ground - st.length * th - c.y, vx: 150 });
      sync();
    };
    api.current = {
      add: (i, user) => { if (user) touched = performance.now(); drop(i); if (reduce) still(); else wake(); },
      take: (i, user) => { if (user) touched = performance.now(); lift(i); if (reduce) still(); else wake(); },
    };

    layout();
    if (reduce) still(); else wake();
    const ro = new ResizeObserver(() => { const w = Math.max(280, box.clientWidth); if (w !== W) { layout(); if (reduce || !raf) draw(); } });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => { seen = e.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis); api.current = null; };
  }, []);

  const add = (i: number) => { if (counts[i] >= MAX) return; api.current?.add(i, true); setLast((l) => [...l, i]); };
  const undo = () => {
    const i = last.length ? last[last.length - 1] : counts.reduce((best, c, j) => (c > counts[best] ? j : best), 0);
    if (!counts[i]) return;
    api.current?.take(i, true); setLast((l) => l.slice(0, -1));
  };
  const coins = counts.reduce((a, b) => a + b, 0);

  return (
    <div className="flex min-h-[580px] w-full flex-col items-center justify-center bg-[#ece5d8] bg-[radial-gradient(90%_70%_at_38%_30%,#f8f3ea_0%,#ece5d8_55%,#ddd3c2_100%)] px-4 py-12 sm:min-h-[780px]">
      <div className="w-full max-w-[1040px]">
        <div className="relative z-10 flex items-end justify-between gap-4 px-1 sm:px-[72px]">
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-600">{FUND}</p>
            <p aria-live="polite" aria-atomic="true" className="mt-1 text-[44px] font-semibold leading-none tracking-tight text-stone-900 [font-variant-numeric:tabular-nums] sm:text-[68px]">
              {shown.toLocaleString("en-US")}
              <span className="ml-2 align-baseline font-mono text-[12px] font-semibold uppercase tracking-[0.2em] text-stone-600 sm:text-[13px]">{UNIT}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={undo}
            disabled={!coins}
            className="mb-1 h-10 shrink-0 rounded-full border border-stone-900/20 px-4 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-800 transition-colors hover:bg-stone-900 hover:text-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2 focus-visible:ring-offset-[#ece5d8] disabled:opacity-40 motion-reduce:transition-none"
          >
            Take one back
          </button>
        </div>
        <div ref={wrap} className="relative -mt-14 w-full sm:-mt-24">
          <canvas ref={canvas} aria-hidden="true" className="block h-[330px] w-full sm:h-[520px]" />
          <ul ref={grid} className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))` }}>
            {months.map((m, i) => (
              <li key={m.label} className="flex">
                <button
                  type="button"
                  onClick={() => add(i)}
                  aria-disabled={counts[i] >= MAX}
                  aria-label={`${m.label}: ${(counts[i] * COIN).toLocaleString("en-US")} ${UNIT} in ${counts[i]} coins. Add a ${COIN} ${UNIT} coin.`}
                  className="group flex w-full cursor-pointer flex-col items-center justify-end rounded-2xl pb-0 outline-none focus-visible:ring-2 focus-visible:ring-amber-700"
                >
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-600 transition-colors group-hover:text-stone-900 motion-reduce:transition-none sm:text-[11px]">
                    {m.label}
                    <span className="ml-1.5 text-stone-900 [font-variant-numeric:tabular-nums]">{(counts[i] * COIN).toLocaleString("en-US")}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-5 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-stone-600">
          Tap a month to drop a {COIN} {UNIT} coin <span className="hidden sm:inline"><span className="mx-1.5 text-stone-400">/</span> {coins} coins saved</span>
        </p>
      </div>
    </div>
  );
}
