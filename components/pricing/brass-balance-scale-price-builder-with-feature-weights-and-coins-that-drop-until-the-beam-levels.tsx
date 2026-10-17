import { useEffect, useRef, useState } from "react";

// What can go on the scale. The first entry is the plan itself and never leaves the pan.
const weights = [
  { label: "Booking page", price: 12 },
  { label: "Card payments", price: 8 },
  { label: "Text reminders", price: 4 },
  { label: "Staff calendars", price: 8 },
  { label: "Gift vouchers", price: 4 },
];
const START = [true, true, true, false, false]; // what is already weighed when the page opens
const COIN = 4; // dollars one coin is worth. Every price above must divide by it.
const PRODUCT = "Halden"; // the made-up booking tool being priced
const TOUR = [3, 4, 1, 2]; // the order the self-running demo flips the optional weights

// Where each weight stands inside the pan (x across, y towards the viewer), in pan units.
const SEAT = [{ x: -42, y: -3 }, { x: 4, y: -4 }, { x: -16, y: 6 }, { x: 44, y: -2 }, { x: 24, y: 7 }];
const BRASS = ["#3f2b0b", "#8a6519", "#dcb552", "#fff2c2", "#cfa23a", "#8d6a1d", "#553a0f", "#7c5c1d"];
const STEEL = ["#343940", "#858c96", "#dde2e8", "#ffffff", "#b4bbc4", "#6a717a", "#3d4249", "#7a818a"];

const layoutFor = (narrow: boolean) =>
  narrow
    ? { W: 380, H: 520, px: 190, py: 92, half: 122, hang: 158, rx: 62, u: 0.74, pointer: 176, plinth: { x: 12, w: 356, y: 376, face: 40 }, rest: [0, 50, 124, 256, 330], key: { top: 334, h: 180, w: 72 } }
    : { W: 760, H: 600, px: 380, py: 112, half: 214, hang: 198, rx: 86, u: 1, pointer: 222, plinth: { x: 110, w: 540, y: 452, face: 46 }, rest: [0, 178, 286, 474, 582], key: { top: 404, h: 190, w: 104 } };

export default function BrassBalanceScalePriceBuilder() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [narrow, setNarrow] = useState(false);
  const [on, setOn] = useState<boolean[]>(START);
  const live = useRef<boolean[]>(START);
  const api = useRef<{ poke: (fromUser: boolean) => void } | null>(null);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setNarrow(el.clientWidth < 700));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const L = layoutFor(narrow), u = L.u;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let k = 1;
    const base = document.createElement("canvas");

    // A band of light down a turned part: dark edge, hot stripe, dark edge, a little rim light.
    const sheen = (c: CanvasRenderingContext2D, x0: number, x1: number, p: string[], shift = 0) => {
      const g = c.createLinearGradient(x0, 0, x1, 0);
      [0, 0.1, 0.27, 0.36, 0.47, 0.72, 0.9, 1].forEach((q, i) => g.addColorStop(i === 0 || i === 7 ? q : Math.max(0.02, Math.min(0.98, q + shift)), p[i]));
      return g;
    };
    // An upright cylinder seen from a little above: lit side, then the top face.
    const cyl = (c: CanvasRenderingContext2D, x: number, top: number, w: number, h: number, p: string[], shift = 0) => {
      const r = w / 2, ry = Math.max(1, w * 0.15);
      c.beginPath(); c.moveTo(x - r, top); c.lineTo(x - r, top + h); c.ellipse(x, top + h, r, ry, 0, Math.PI, 0, true); c.lineTo(x + r, top); c.closePath();
      c.fillStyle = sheen(c, x - r, x + r, p, shift); c.fill();
      c.beginPath(); c.ellipse(x, top, r, ry, 0, 0, Math.PI * 2);
      const g = c.createLinearGradient(x - r, top - ry, x + r, top + ry);
      g.addColorStop(0, p[3]); g.addColorStop(0.45, p[2]); g.addColorStop(1, p[5]);
      c.fillStyle = g; c.fill(); c.lineWidth = 0.6; c.strokeStyle = "rgba(0,0,0,0.38)"; c.stroke();
    };
    const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    };

    const sizeOf = (price: number) => (price >= 12 ? 42 : price >= 8 ? 33 : 26) * u;
    const weight = (c: CanvasRenderingContext2D, x: number, foot: number, price: number, lift = 0) => {
      const w = sizeOf(price), h = w * 1.02, top = foot - h;
      // Contact shadow, wider and fainter the higher the weight is off the surface.
      c.beginPath(); c.ellipse(x + 3 * u + lift * 0.12, foot + 1.5 + lift, w * (0.58 + lift * 0.004), w * 0.17, 0, 0, Math.PI * 2);
      c.fillStyle = `rgba(0,0,0,${0.42 / (1 + lift * 0.03)})`; c.fill();
      cyl(c, x, top, w, h, BRASS);
      for (const y of [top + h * 0.13, foot - h * 0.1]) {
        c.beginPath(); c.ellipse(x, y, w / 2, w * 0.15, 0, 0, Math.PI); c.lineWidth = 0.9; c.strokeStyle = "rgba(48,30,4,0.55)"; c.stroke();
        c.beginPath(); c.ellipse(x, y + 1, w / 2, w * 0.15, 0, 0.5, Math.PI - 0.5); c.lineWidth = 0.6; c.strokeStyle = "rgba(255,244,200,0.5)"; c.stroke();
      }
      c.beginPath(); c.ellipse(x, top, w * 0.36, w * 0.105, 0, 0, Math.PI * 2); c.lineWidth = 0.7; c.strokeStyle = "rgba(60,38,5,0.45)"; c.stroke();
      cyl(c, x, top - w * 0.15, w * 0.26, w * 0.15, BRASS);
      const kx = x, ky = top - w * 0.27, kr = w * 0.25;
      const g = c.createRadialGradient(kx - kr * 0.35, ky - kr * 0.4, 0.5, kx, ky, kr);
      g.addColorStop(0, "#fff8d8"); g.addColorStop(0.3, "#e0b852"); g.addColorStop(0.75, "#8a6519"); g.addColorStop(1, "#4a330c");
      c.beginPath(); c.ellipse(kx, ky, kr, kr * 0.74, 0, 0, Math.PI * 2); c.fillStyle = g; c.fill();
      c.font = `700 ${w * 0.36}px Georgia, "Times New Roman", serif`; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillStyle = "rgba(255,244,200,0.55)"; c.fillText(String(price), x - w * 0.02, foot - h * 0.44 + 0.8);
      c.fillStyle = "rgba(52,32,4,0.88)"; c.fillText(String(price), x - w * 0.02, foot - h * 0.44);
    };
    const coin = (c: CanvasRenderingContext2D, x: number, foot: number) => {
      const w = 36 * u, t = 4.6 * u;
      cyl(c, x, foot - t, w, t, STEEL);
      c.beginPath(); c.ellipse(x, foot, w / 2, w * 0.15, 0, 0.08, Math.PI - 0.08); c.lineWidth = 0.9; c.strokeStyle = "rgba(24,28,34,0.7)"; c.stroke();
      c.beginPath(); c.ellipse(x, foot - t, w * 0.37, w * 0.108, 0, 0, Math.PI * 2); c.lineWidth = 0.6; c.strokeStyle = "rgba(40,46,54,0.5)"; c.stroke();
      c.beginPath(); c.ellipse(x, foot - t + 0.6, w * 0.37, w * 0.108, 0, 0.3, Math.PI - 0.3); c.strokeStyle = "rgba(255,255,255,0.7)"; c.stroke();
    };

    // Everything that never moves: the shadow on the table, the walnut plinth, the turned column, the ivory scale.
    const build = () => {
      const b = base.getContext("2d");
      if (!b) return;
      base.width = cv.width; base.height = cv.height;
      b.setTransform(k, 0, 0, k, 0, 0);
      const P = L.plinth, top = 26 * u, bottom = P.y + top + P.face;
      b.save(); b.translate(L.px, bottom + 6); b.scale(1, 0.1);
      const sh = b.createRadialGradient(0, 0, P.w * 0.2, 0, 0, P.w * 0.66);
      sh.addColorStop(0, "rgba(0,0,0,0.75)"); sh.addColorStop(1, "rgba(0,0,0,0)");
      b.fillStyle = sh; b.fillRect(-P.w, -P.w, P.w * 2, P.w * 2); b.restore();
      for (const fx of [P.x + 44 * u, P.x + P.w - 44 * u]) cyl(b, fx, bottom - 3, 34 * u, 7, BRASS);

      let seed = 23;
      const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      const grain = (y0: number, y1: number, n: number) => {
        for (let i = 0; i < n; i++) {
          const y = y0 + rand() * (y1 - y0), v = rand(), amp = 0.6 + rand() * 1.6, f = 0.008 + rand() * 0.012, ph = rand() * 6;
          b.beginPath();
          for (let x = P.x; x <= P.x + P.w; x += 8) b.lineTo(x, y + Math.sin(x * f + ph) * amp);
          b.lineWidth = 0.5 + rand() * 0.7; b.strokeStyle = v > 0.7 ? `rgba(255,214,160,${(v - 0.7) * 0.4})` : `rgba(20,8,0,${0.08 + v * 0.22})`; b.stroke();
        }
      };
      // Top surface, seen at a shallow angle.
      b.save(); b.beginPath(); b.moveTo(P.x + 12 * u, P.y); b.lineTo(P.x + P.w - 12 * u, P.y); b.lineTo(P.x + P.w, P.y + top); b.lineTo(P.x, P.y + top); b.closePath();
      const tg = b.createLinearGradient(0, P.y, 0, P.y + top); tg.addColorStop(0, "#5a3619"); tg.addColorStop(1, "#8a5a30");
      b.fillStyle = tg; b.fill(); b.clip(); grain(P.y, P.y + top, 18);
      const pool = b.createRadialGradient(L.px, P.y + top * 0.5, 10, L.px, P.y + top * 0.5, P.w * 0.5);
      pool.addColorStop(0, "rgba(255,226,170,0.2)"); pool.addColorStop(1, "rgba(0,0,0,0.22)");
      b.fillStyle = pool; b.fillRect(P.x, P.y, P.w, top); b.restore();
      // Front face.
      b.save(); rr(b, P.x, P.y + top, P.w, P.face, 4);
      const fg = b.createLinearGradient(0, P.y + top, 0, bottom); fg.addColorStop(0, "#5b3518"); fg.addColorStop(0.5, "#3e2210"); fg.addColorStop(1, "#231207");
      b.fillStyle = fg; b.fill(); b.clip(); grain(P.y + top, bottom, 34);
      const side = b.createLinearGradient(P.x, 0, P.x + P.w, 0);
      side.addColorStop(0, "rgba(0,0,0,0.4)"); side.addColorStop(0.2, "rgba(0,0,0,0)"); side.addColorStop(0.8, "rgba(0,0,0,0)"); side.addColorStop(1, "rgba(0,0,0,0.45)");
      b.fillStyle = side; b.fillRect(P.x, P.y + top, P.w, P.face); b.restore();
      b.beginPath(); b.moveTo(P.x + 2, P.y + top + 0.6); b.lineTo(P.x + P.w - 2, P.y + top + 0.6); b.lineWidth = 1.1; b.strokeStyle = "rgba(255,220,170,0.42)"; b.stroke();

      // Turned foot, column and collars.
      const stand = P.y + top * 0.5;
      b.beginPath(); b.ellipse(L.px + 5 * u, stand + 3, 58 * u, 9 * u, 0, 0, Math.PI * 2); b.fillStyle = "rgba(0,0,0,0.4)"; b.fill();
      cyl(b, L.px, stand - 8 * u, 96 * u, 8 * u, BRASS);
      cyl(b, L.px, stand - 17 * u, 64 * u, 9 * u, BRASS);
      cyl(b, L.px, stand - 30 * u, 36 * u, 13 * u, BRASS);
      cyl(b, L.px, L.py + 4, 13 * u, stand - 30 * u - L.py - 4, BRASS);
      for (const f of [0.16, 0.2, 0.86, 0.9]) cyl(b, L.px, L.py + (stand - L.py) * f, 21 * u, 5 * u, BRASS);
      cyl(b, L.px, L.py - 20 * u, 24 * u, 26 * u, BRASS);
      cyl(b, L.px, L.py - 27 * u, 12 * u, 7 * u, BRASS);
      const fy = L.py - 36 * u, fg2 = b.createRadialGradient(L.px - 3 * u, fy - 3 * u, 0.5, L.px, fy, 9 * u);
      fg2.addColorStop(0, "#fff8d8"); fg2.addColorStop(0.3, "#e0b852"); fg2.addColorStop(0.75, "#8a6519"); fg2.addColorStop(1, "#4a330c");
      b.beginPath(); b.arc(L.px, fy, 8.5 * u, 0, Math.PI * 2); b.fillStyle = fg2; b.fill();

      // The ivory scale the pointer reads against.
      const R = L.pointer, pw = 124 * u, pt = L.py + R - 30 * u, ph = 42 * u;
      b.save(); b.shadowColor = "rgba(0,0,0,0.55)"; b.shadowBlur = 8 * k; b.shadowOffsetY = 3 * k;
      rr(b, L.px - pw / 2, pt, pw, ph, 5 * u); b.fillStyle = "#b08a2c"; b.fill(); b.restore();
      rr(b, L.px - pw / 2, pt, pw, ph, 5 * u); const rim = b.createLinearGradient(0, pt, 0, pt + ph); rim.addColorStop(0, "#f6dc8a"); rim.addColorStop(1, "#7b5a17"); b.fillStyle = rim; b.fill();
      rr(b, L.px - pw / 2 + 2.5, pt + 2.5, pw - 5, ph - 5, 3.5 * u); const iv = b.createLinearGradient(0, pt, 0, pt + ph); iv.addColorStop(0, "#f8f0dc"); iv.addColorStop(1, "#dccfae"); b.fillStyle = iv; b.fill();
      for (let i = -10; i <= 10; i++) {
        const a = i * 0.021, long = i % 5 === 0, r0 = R - (long ? 15 : 10) * u, r1 = R - 3 * u;
        b.beginPath(); b.moveTo(L.px + Math.sin(a) * r0, L.py + Math.cos(a) * r0); b.lineTo(L.px + Math.sin(a) * r1, L.py + Math.cos(a) * r1);
        b.lineWidth = i === 0 ? 1.5 : long ? 1.1 : 0.7; b.strokeStyle = i === 0 ? "#a3271b" : "#2a2114"; b.stroke();
      }
      b.font = `600 ${6.5 * u + 1}px ui-monospace, SFMono-Regular, Menlo, monospace`; b.textAlign = "center"; b.textBaseline = "middle"; b.fillStyle = "rgba(42,33,20,0.75)";
      b.fillText("LEVEL", L.px, pt + ph - 7 * u);
      for (const sx of [L.px - pw / 2 + 8 * u, L.px + pw / 2 - 8 * u]) { b.beginPath(); b.arc(sx, pt + ph - 8 * u, 2.2 * u, 0, Math.PI * 2); b.fillStyle = "#8a6519"; b.fill(); b.beginPath(); b.arc(sx - 0.5, pt + ph - 8.5 * u, 0.9 * u, 0, Math.PI * 2); b.fillStyle = "#fff2c2"; b.fill(); }
    };

    const fit = () => {
      const w = cv.clientWidth || L.W;
      k = (w / L.W) * Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(L.W * k); cv.height = Math.round(L.H * k);
      build();
    };

    // t: how far each weight is from its stand (0) to the pan (1). a: beam angle, positive with the weights down.
    const coinsFor = (t: number[]) => weights.reduce((n, w, i) => n + (t[i] >= 1 ? w.price : 0), 0) / COIN;
    const s = {
      t: weights.map((_, i) => (live.current[i] ? 1 : 0)), a: 0, av: 0, ph: [0, 0], phv: [0.25, -0.2], cool: 0,
      coins: [] as { y: number; v: number; down: boolean }[], gone: [] as { i: number; y: number; v: number }[],
    };
    for (let i = 0; i < coinsFor(s.t); i++) s.coins.push({ y: 0, v: 0, down: true });
    const ends = () => [
      { x: L.px - Math.cos(s.a) * L.half, y: L.py + Math.sin(s.a) * L.half + 9 * u },
      { x: L.px + Math.cos(s.a) * L.half, y: L.py - Math.sin(s.a) * L.half + 9 * u },
    ];
    const dropFrom = -(L.py + L.hang + 90);

    const step = (dt: number) => {
      weights.forEach((_, i) => {
        const want = live.current[i] ? 1 : 0, was = s.t[i];
        if (was === want) return;
        s.t[i] = want > was ? Math.min(1, was + dt / 0.62) : Math.max(0, was - dt / 0.5);
        if (s.t[i] === 1) { s.av += 0.2; s.phv[0] += SEAT[i].x > 0 ? -0.5 : 0.5; }
        if (was === 1) { s.av -= 0.12; s.phv[0] += 0.3; }
      });
      const need = coinsFor(s.t);
      s.cool -= dt;
      if (s.cool <= 0 && s.coins.length < need) { s.coins.push({ y: dropFrom, v: 300, down: false }); s.cool = 0.14; }
      else if (s.cool <= 0 && s.coins.length > need) { s.coins.pop(); s.gone.push({ i: s.coins.length, y: 0, v: -260 }); s.cool = 0.11; s.av += 0.05; }
      for (const c of s.coins) {
        if (c.down) continue;
        c.v += 3000 * dt; c.y += c.v * dt;
        if (c.y >= 0) { c.y = 0; c.down = true; s.av -= 0.11; s.phv[1] += (s.coins.indexOf(c) % 3 - 1) * 0.35 + 0.1; }
      }
      for (const g of s.gone) { g.v -= 3400 * dt; g.y += g.v * dt; }
      s.gone = s.gone.filter((g) => g.y > dropFrom);
      const left = coinsFor(s.t) * COIN, right = s.coins.filter((c) => c.down).length * COIN;
      const target = Math.max(-0.19, Math.min(0.19, (left - right) * 0.024));
      s.av += (30 * (target - s.a) - 2.7 * s.av) * dt; s.a += s.av * dt;
      if (Math.abs(s.a) > 0.2) { s.a = Math.sign(s.a) * 0.2; s.av *= -0.3; }
      for (const p of [0, 1]) { s.phv[p] += (-36 * s.ph[p] - 1.7 * s.phv[p]) * dt; s.ph[p] += s.phv[p] * dt; }
    };

    const pan = (e: { x: number; y: number }, sway: number, fill: () => void) => {
      const rx = L.rx, ry = rx * 0.17, cy = L.hang;
      ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(sway);
      // Three chains from the stirrup to the rim.
      for (const [tx, ty] of [[0, cy - ry + 1], [-rx + 3, cy], [rx - 3, cy]]) {
        ctx.setLineDash([]); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(tx, ty); ctx.lineWidth = 1.7 * u + 0.3; ctx.strokeStyle = "#3a2709"; ctx.stroke();
        ctx.setLineDash([2.4 * u, 2.2 * u]); ctx.lineWidth = 1.1 * u + 0.2; ctx.strokeStyle = "#e9c96d"; ctx.stroke();
      }
      ctx.setLineDash([]);
      // Outside of the dish, in its own shade.
      ctx.beginPath(); ctx.moveTo(-rx, cy); ctx.bezierCurveTo(-rx * 0.86, cy + ry * 2.5, rx * 0.86, cy + ry * 2.5, rx, cy); ctx.ellipse(0, cy, rx, ry, 0, 0, Math.PI); ctx.closePath();
      ctx.fillStyle = sheen(ctx, -rx, rx, BRASS, -0.06); ctx.fill();
      const under = ctx.createLinearGradient(0, cy, 0, cy + ry * 2.2); under.addColorStop(0, "rgba(30,18,2,0.1)"); under.addColorStop(1, "rgba(30,18,2,0.72)"); ctx.fillStyle = under; ctx.fill();
      // Inside of the dish.
      ctx.beginPath(); ctx.ellipse(0, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = sheen(ctx, -rx, rx, BRASS, 0.1); ctx.fill();
      const bowl = ctx.createRadialGradient(0, cy + ry * 0.5, rx * 0.1, 0, cy, rx);
      bowl.addColorStop(0, "rgba(255,240,190,0.22)"); bowl.addColorStop(0.6, "rgba(60,38,5,0.28)"); bowl.addColorStop(1, "rgba(40,24,2,0.62)"); ctx.fillStyle = bowl; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = "#fff0b8"; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, cy + 1.3, rx, ry, 0, 0.15, Math.PI - 0.15); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(48,30,4,0.7)"; ctx.stroke();
      fill();
      ctx.restore();
    };

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(base, 0, 0);
      ctx.setTransform(k, 0, 0, k, 0, 0);
      const P = L.plinth, stand = P.y + 13 * u + 3 * u, [le, re] = ends();
      // Price plate on the front of the plinth: it reads the coins in the pan.
      const price = s.coins.filter((c) => c.down).length * COIN, bw = 150 * u, bh = 25 * u + 3, by = P.y + 26 * u + (P.face - bh) / 2;
      rr(ctx, L.px - bw / 2, by, bw, bh, 3); const pg = ctx.createLinearGradient(0, by, 0, by + bh); pg.addColorStop(0, "#f3d67f"); pg.addColorStop(0.5, "#c99c36"); pg.addColorStop(1, "#8a6519"); ctx.fillStyle = pg; ctx.fill();
      ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(255,246,208,0.8)"; ctx.stroke();
      ctx.font = `700 ${13 * u + 2}px Georgia, "Times New Roman", serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      const text = `$${price} a month`;
      ctx.fillStyle = "rgba(255,246,208,0.6)"; ctx.fillText(text, L.px, by + bh / 2 + 1.6);
      ctx.fillStyle = "#33210a"; ctx.fillText(text, L.px, by + bh / 2 + 0.8);

      weights.forEach((w, i) => { if (s.t[i] === 0 && i > 0) weight(ctx, L.rest[i], stand, w.price); });

      pan(le, s.ph[0], () => {
        [0, 1, 3, 2, 4].forEach((i) => { if (s.t[i] >= 1) weight(ctx, SEAT[i].x * u * (L.rx / (86 * u)), L.hang + SEAT[i].y * u * 0.8, weights[i].price); });
      });
      pan(re, s.ph[1], () => {
        const at = (i: number) => ({ x: ((i % 3) - 1) * 40 * u * (L.rx / (86 * u)), y: L.hang + (i % 3 === 1 ? 5 : -1) * u - Math.floor(i / 3) * 4.6 * u });
        ctx.beginPath(); ctx.ellipse(4 * u, L.hang + 4 * u, L.rx * 0.74, L.rx * 0.1, 0, 0, Math.PI * 2); ctx.fillStyle = s.coins.length ? "rgba(30,18,2,0.3)" : "rgba(0,0,0,0)"; ctx.fill();
        const order = s.coins.map((c, i) => i).sort((a, b) => Math.floor(a / 3) - Math.floor(b / 3) || (a % 3 === 1 ? 1 : 0) - (b % 3 === 1 ? 1 : 0));
        for (const i of order) { const q = at(i); coin(ctx, q.x, q.y + s.coins[i].y); }
        for (const g of s.gone) { const q = at(g.i); coin(ctx, q.x, q.y + g.y); }
      });

      // Beam, stirrups, pivot and the long pointer, all one rigid piece.
      ctx.save(); ctx.translate(L.px, L.py); ctx.rotate(-s.a);
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 6 * k; ctx.shadowOffsetY = 5 * k;
      const H = L.half, bt = 10 * u;
      ctx.beginPath(); ctx.moveTo(-H - 4, -3 * u); ctx.quadraticCurveTo(0, -bt * 1.5, H + 4, -3 * u); ctx.lineTo(H + 4, 3 * u); ctx.quadraticCurveTo(0, bt * 1.1, -H - 4, 3 * u); ctx.closePath();
      const bg = ctx.createLinearGradient(0, -bt, 0, bt * 0.8); bg.addColorStop(0, "#fff2c2"); bg.addColorStop(0.22, "#dcb552"); bg.addColorStop(0.6, "#a47b23"); bg.addColorStop(1, "#4f370d");
      ctx.fillStyle = bg; ctx.fill(); ctx.restore();
      ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(48,30,4,0.6)"; ctx.stroke();
      for (let x = -H + 14; x <= H - 14; x += 9 * u) { if (Math.abs(x) < 20 * u) continue; const tall = Math.round((x + H - 14) / (9 * u)) % 5 === 0; ctx.beginPath(); ctx.moveTo(x, 1.5 * u); ctx.lineTo(x, 1.5 * u - (tall ? 5 : 3) * u); ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(48,30,4,0.55)"; ctx.stroke(); }
      // Pointer.
      const R = L.pointer - 6 * u;
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 4 * k; ctx.shadowOffsetX = 3 * k; ctx.shadowOffsetY = 2 * k;
      ctx.beginPath(); ctx.moveTo(-2.6 * u, 8); ctx.lineTo(-0.5, R); ctx.lineTo(0.5, R); ctx.lineTo(2.6 * u, 8); ctx.closePath(); ctx.fillStyle = "#17202b"; ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.moveTo(-1.2 * u, 10); ctx.lineTo(-0.2, R - 4); ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(160,196,232,0.75)"; ctx.stroke();
      const boss = ctx.createRadialGradient(-4 * u, -5 * u, 1, 0, 0, 14 * u); boss.addColorStop(0, "#fff8d8"); boss.addColorStop(0.35, "#dcb552"); boss.addColorStop(0.8, "#8a6519"); boss.addColorStop(1, "#4a330c");
      ctx.beginPath(); ctx.arc(0, 0, 13 * u, 0, Math.PI * 2); ctx.fillStyle = boss; ctx.fill(); ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(48,30,4,0.7)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, 4.2 * u, 0, Math.PI * 2); ctx.fillStyle = "#1b222b"; ctx.fill();
      ctx.beginPath(); ctx.arc(-1.2 * u, -1.3 * u, 1.3 * u, 0, Math.PI * 2); ctx.fillStyle = "rgba(220,236,255,0.85)"; ctx.fill();
      ctx.restore();
      for (const e of [le, re]) {
        ctx.beginPath(); ctx.arc(e.x, e.y - 4 * u, 5 * u, 0, Math.PI * 2); ctx.lineWidth = 2.4 * u; ctx.strokeStyle = "#5a3f10"; ctx.stroke();
        ctx.beginPath(); ctx.arc(e.x, e.y - 4 * u, 5 * u, 3.4, 5.4); ctx.lineWidth = 1.2 * u; ctx.strokeStyle = "#fff0b8"; ctx.stroke();
      }

      // Weights on their way between the stand and the pan.
      weights.forEach((w, i) => {
        const t = s.t[i];
        if (t <= 0 || t >= 1) return;
        const e = t * t * (3 - 2 * t), sx = SEAT[i].x * u * (L.rx / (86 * u)), sy = L.hang + SEAT[i].y * u * 0.8;
        const tx = le.x + sx * Math.cos(s.ph[0]) - sy * Math.sin(s.ph[0]), ty = le.y + sx * Math.sin(s.ph[0]) + sy * Math.cos(s.ph[0]);
        const lift = Math.sin(Math.PI * e) * 70 * u;
        weight(ctx, L.rest[i] + (tx - L.rest[i]) * e, stand + (ty - stand) * e - lift, w.price, lift * 0.5);
      });
    };

    let raf = 0, last = 0, t0 = 0, seen = true, touched = -1e9, nextDemo = 900, tour = 0;
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      if (now - touched > 7000 && now - t0 > nextDemo) {
        const i = TOUR[tour++ % TOUR.length];
        const next = live.current.map((v, j) => (j === i ? !v : v)); live.current = next; setOn(next);
        nextDemo = now - t0 + 3000;
      }
      step(dt / 2); step(dt / 2); draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const settle = () => { for (let i = 0; i < 900; i++) step(1 / 60); s.a = 0; s.av = 0; s.ph = [0, 0]; draw(); };
    api.current = { poke: (fromUser) => { if (fromUser) { touched = performance.now(); nextDemo = performance.now() - t0 + 3000; } if (reduce) settle(); else wake(); } };

    fit();
    if (reduce) settle(); else wake();

    // Brushing a pan with the pointer sets it swinging.
    let lastX = 0;
    const onMove = (e: PointerEvent) => {
      const b = cv.getBoundingClientRect(), x = ((e.clientX - b.left) / b.width) * L.W, y = ((e.clientY - b.top) / b.height) * L.H, dx = x - lastX; lastX = x;
      if (reduce || Math.abs(dx) > 60) return;
      ends().forEach((p, i) => { if (Math.abs(x - p.x) < L.rx && Math.abs(y - (p.y + L.hang)) < 46 * u) s.phv[i] -= dx * 0.012; });
    };
    cv.addEventListener("pointermove", onMove);
    const ro = new ResizeObserver(() => { fit(); if (reduce) draw(); });
    ro.observe(cv);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); api.current = null; cv.removeEventListener("pointermove", onMove);
      ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, [narrow]);

  const L = layoutFor(narrow);
  const flip = (i: number) => { const next = live.current.map((v, j) => (j === i ? !v : v)); live.current = next; setOn(next); api.current?.poke(true); };
  const total = weights.reduce((n, w, i) => n + (on[i] ? w.price : 0), 0);
  const extras = weights.filter((_, i) => i > 0 && on[i]).map((w) => w.label.toLowerCase());
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;

  return (
    <div ref={stage} className="flex min-h-[640px] w-full flex-col items-center justify-center bg-[#0d1624] bg-[radial-gradient(80%_60%_at_50%_40%,#263a55_0%,#0d1624_74%)] px-3 py-10 sm:min-h-[860px] sm:px-6">
      <div className="relative w-full" style={{ maxWidth: narrow ? L.W : L.W * 1.16, aspectRatio: `${L.W} / ${L.H}` }}>
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <div role="group" aria-label={`${PRODUCT} extras`}>
          {weights.map((w, i) =>
            i === 0 ? null : (
              <button
                key={w.label}
                type="button"
                role="switch"
                aria-checked={on[i]}
                onClick={() => flip(i)}
                style={{ left: pct(L.rest[i] - L.key.w / 2, L.W), top: pct(L.key.top, L.H), width: pct(L.key.w, L.W), height: pct(L.key.h, L.H) }}
                className="group absolute flex cursor-pointer flex-col items-center justify-end rounded-lg pb-1 text-center outline-none focus-visible:ring-2 focus-visible:ring-[#f3d67f]"
              >
                <span className={`flex min-h-[32px] items-end font-mono text-[9px] font-semibold uppercase leading-4 tracking-[0.12em] transition-colors duration-300 motion-reduce:transition-none sm:text-[10px] sm:tracking-[0.16em] ${on[i] ? "text-[#f3d67f]" : "text-slate-300 group-hover:text-white"}`}>
                  {w.label}
                </span>
                <span className="font-mono text-[9px] uppercase leading-4 tracking-[0.16em] text-slate-400 sm:text-[10px]">
                  {on[i] ? "On the pan" : `Add $${w.price}`}
                </span>
              </button>
            ),
          )}
        </div>
      </div>
      <p aria-live="polite" className="min-h-[40px] mt-8 max-w-[560px] text-center font-mono text-[11px] uppercase leading-5 tracking-[0.16em] text-slate-400">
        <span className="text-slate-100">{PRODUCT} / ${total} a month</span>
        <span className="mx-2 text-slate-600">/</span>
        {weights[0].label}
        {extras.length ? ` with ${extras.join(", ")}` : " on its own"}
      </p>
    </div>
  );
}
