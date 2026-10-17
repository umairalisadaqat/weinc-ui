import { useEffect, useRef, useState } from "react";

// Everything a visitor is likely to change sits here. The figures are invented demo data.
const UNIT = "orders packed";
const FULL = 100; // the reading at the top graduation
const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const sets = [
  { label: "This week", values: [42, 58, 71, 64, 88, 96, 53] },
  { label: "Last week", values: [35, 49, 62, 80, 74, 60, 28] },
];
const dyes = ["#e2336b", "#f05a28", "#f3a31c", "#8cc63f", "#1fb58f", "#2b8be3", "#6a55e0"]; // one dye per tube

const layoutFor = (narrow: boolean) =>
  narrow
    ? { W: 380, H: 430, u: 0.7, tw: 31, gap: 48, x0: 46, top: 54, rail: 80, base: 346 }
    : { W: 820, H: 540, u: 1, tw: 52, gap: 98, x0: 116, top: 60, rail: 98, base: 428 };

const rgb = (hex: string) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
const tone = (hex: string, t: number, a = 1) => {
  const c = rgb(hex), to = t > 0 ? 255 : 0, m = Math.abs(t);
  return `rgba(${c.map((v) => Math.round(v + (to - v) * m)).join(",")},${a})`;
};

export default function GlassTestTubeRackBarChart() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [narrow, setNarrow] = useState(false);
  const [set, setSet] = useState(0);
  const [active, setActive] = useState(-1);
  const [touched, setTouched] = useState(false);
  const live = useRef({ set: 0, active: -1, touched: false });
  const api = useRef<{ poke: () => void; flick: (i: number) => void } | null>(null);

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
    const L = layoutFor(narrow), u = L.u, n = days.length, r = L.tw / 2;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const railH = 20 * u, railF = 13 * u, baseT = 30 * u, baseF = 38 * u; // top faces and front faces of the two slabs
    const bot = L.base + baseT * 0.56; // where a tube rests
    const yFull = L.rail + railH + railF + 16 * u, yZero = bot - r * 0.55; // travel of the liquid surface
    const xl = L.x0 - 70 * u, xr = L.x0 + (n - 1) * L.gap + 70 * u;
    const tx = (i: number) => L.x0 + i * L.gap;
    let k = 1;

    const back = document.createElement("canvas"), front = document.createElement("canvas");

    const brushed = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, a: string, b: string, seed: number) => {
      const g = c.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, a); g.addColorStop(1, b);
      c.fillStyle = g; c.fill();
      c.save(); c.clip();
      let s = seed;
      const rand = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
      for (let yy = y; yy < y + h; yy += 0.5) {
        const v = rand(), a0 = x + rand() * w * 0.5, a1 = x + w - rand() * w * 0.5;
        c.beginPath(); c.moveTo(a0, yy); c.lineTo(a1, yy); c.lineWidth = 0.5;
        c.strokeStyle = v > 0.5 ? `rgba(255,255,255,${(v - 0.5) * 0.5})` : `rgba(40,48,60,${(0.5 - v) * 0.22})`; c.stroke();
      }
      // A long reflection of the studio window across the metal.
      const sh = c.createLinearGradient(x, 0, x + w, 0);
      sh.addColorStop(0, "rgba(255,255,255,0)"); sh.addColorStop(0.22, "rgba(255,255,255,0.42)"); sh.addColorStop(0.36, "rgba(255,255,255,0)");
      sh.addColorStop(0.7, "rgba(255,255,255,0)"); sh.addColorStop(0.82, "rgba(255,255,255,0.2)"); sh.addColorStop(1, "rgba(60,70,84,0.16)");
      c.fillStyle = sh; c.fillRect(x, y, w, h);
      c.restore();
    };
    const trap = (c: CanvasRenderingContext2D, y: number, h: number, inset: number) => {
      c.beginPath(); c.moveTo(xl + inset, y); c.lineTo(xr - inset, y); c.lineTo(xr, y + h); c.lineTo(xl, y + h); c.closePath();
    };
    const holes = (c: CanvasRenderingContext2D) => { for (let i = 0; i < n; i++) c.ellipse(tx(i), L.rail + railH * 0.5, r + 3.2 * u, railH * 0.3, 0, 0, Math.PI * 2); };

    const build = () => {
      for (const cnv of [back, front]) { cnv.width = cv.width; cnv.height = cv.height; }
      const b = back.getContext("2d"), f = front.getContext("2d");
      if (!b || !f) return;
      b.setTransform(k, 0, 0, k, 0, 0); f.setTransform(k, 0, 0, k, 0, 0);
      const inset = 9 * u, cx = (xl + xr) / 2, floor = L.base + baseT + baseF;

      // Shadow of the rack on the sweep: one broad pool and a tight contact line.
      const poolR = Math.min((xr - xl) * 0.6, L.W / 2 - 2);
      b.save(); b.translate(cx, floor + 2 * u); b.scale(1, 0.1);
      const pool = b.createRadialGradient(0, 0, 0, 0, 0, poolR);
      pool.addColorStop(0, "rgba(40,52,70,0.42)"); pool.addColorStop(0.6, "rgba(40,52,70,0.2)"); pool.addColorStop(1, "rgba(40,52,70,0)");
      b.fillStyle = pool; b.beginPath(); b.arc(0, 0, poolR, 0, Math.PI * 2); b.fill(); b.restore();
      const contact = b.createLinearGradient(0, floor - 1, 0, floor + 7 * u);
      contact.addColorStop(0, "rgba(20,28,40,0.5)"); contact.addColorStop(1, "rgba(20,28,40,0)");
      b.fillStyle = contact; b.fillRect(xl + 3, floor - 1, xr - xl - 6, 8 * u);

      // Two steel posts.
      for (const px of [xl + 22 * u, xr - 22 * u]) {
        const g = b.createLinearGradient(px - 5 * u, 0, px + 5 * u, 0);
        g.addColorStop(0, "#5d646e"); g.addColorStop(0.28, "#f6f8fa"); g.addColorStop(0.5, "#aab1ba"); g.addColorStop(0.78, "#69707a"); g.addColorStop(1, "#9aa1aa");
        b.fillStyle = g; b.fillRect(px - 5 * u, L.rail + railH, 10 * u, L.base - L.rail - railH + baseT * 0.5);
      }

      // Base slab: top face, then front face with its lit upper edge.
      trap(b, L.base, baseT, inset); brushed(b, xl, L.base, xr - xl, baseT, "#e9ecef", "#d2d7dd", 7);
      b.beginPath(); b.rect(xl, L.base + baseT, xr - xl, baseF); brushed(b, xl, L.base + baseT, xr - xl, baseF, "#b4bac2", "#6f7782", 23);
      b.fillStyle = "rgba(255,255,255,0.9)"; b.fillRect(xl, L.base + baseT - 0.5, xr - xl, 1.1);
      b.fillStyle = "rgba(30,38,50,0.45)"; b.fillRect(xl, floor - 1, xr - xl, 1);
      // Dimples the tubes stand in, and the day stamped under each.
      b.textAlign = "center"; b.textBaseline = "middle"; b.font = `700 ${Math.max(8.5, 10.5 * u)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      for (let i = 0; i < n; i++) {
        const d = b.createRadialGradient(tx(i), bot - 1, 1, tx(i), bot, r * 1.05);
        d.addColorStop(0, "rgba(40,50,64,0.5)"); d.addColorStop(0.7, "rgba(40,50,64,0.16)"); d.addColorStop(1, "rgba(40,50,64,0)");
        b.save(); b.translate(tx(i), bot); b.scale(1, 0.3); b.translate(-tx(i), -bot);
        b.fillStyle = d; b.beginPath(); b.arc(tx(i), bot, r * 1.05, 0, Math.PI * 2); b.fill(); b.restore();
        const ly = L.base + baseT + baseF * 0.52, label = days[i].toUpperCase();
        b.fillStyle = "rgba(255,255,255,0.75)"; b.fillText(label, tx(i), ly + 0.9);
        b.fillStyle = "rgba(38,46,58,0.82)"; b.fillText(label, tx(i), ly);
      }
      // Rail: the top face goes behind the glass, with the holes bored through it.
      trap(b, L.rail, railH, inset * 0.6); brushed(b, xl, L.rail, xr - xl, railH, "#e6e9ed", "#cdd2d9", 41);
      b.beginPath(); holes(b); b.fillStyle = "rgba(24,30,40,0.72)"; b.fill();
      // Its shadow falling down the posts and across the air behind.
      const under = b.createLinearGradient(0, L.rail + railH + railF, 0, L.rail + railH + railF + 16 * u);
      under.addColorStop(0, "rgba(30,40,56,0.22)"); under.addColorStop(1, "rgba(30,40,56,0)");
      b.fillStyle = under; b.fillRect(xl + 6, L.rail + railH + railF, xr - xl - 12, 16 * u);

      // Front layer: the near half of the rail, drawn over the tubes so they pass through it.
      const half = L.rail + railH * 0.5;
      f.beginPath(); f.moveTo(xl + inset * 0.3, half); f.lineTo(xr - inset * 0.3, half); f.lineTo(xr, L.rail + railH); f.lineTo(xl, L.rail + railH); f.closePath(); holes(f);
      f.save(); f.clip("evenodd");
      f.beginPath(); f.rect(xl, half, xr - xl, railH); brushed(f, xl, L.rail, xr - xl, railH, "#e6e9ed", "#cdd2d9", 41);
      f.restore();
      // Bright chamfer on the near lip of each hole.
      for (let i = 0; i < n; i++) {
        f.beginPath(); f.ellipse(tx(i), half, r + 3.2 * u, railH * 0.3, 0, 0.12 * Math.PI, 0.88 * Math.PI);
        f.lineWidth = 1.1; f.strokeStyle = "rgba(255,255,255,0.95)"; f.stroke();
      }
      f.beginPath(); f.rect(xl, L.rail + railH, xr - xl, railF); brushed(f, xl, L.rail + railH, xr - xl, railF, "#bcc2ca", "#7c848f", 59);
      f.fillStyle = "rgba(255,255,255,0.95)"; f.fillRect(xl, L.rail + railH - 0.5, xr - xl, 1.1);
      f.fillStyle = "rgba(30,38,50,0.4)"; f.fillRect(xl, L.rail + railH + railF - 0.8, xr - xl, 0.8);
    };

    const fit = () => {
      const w = cv.clientWidth || L.W;
      k = (w / L.W) * Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(L.W * k); cv.height = Math.round(L.H * k);
      build();
    };

    type Bubble = { x: number; y: number; r: number; v: number; w: number };
    const s = {
      lv: days.map(() => 0), vel: days.map(() => 0), tilt: days.map(() => 0), tv: days.map(() => 0),
      lift: days.map(() => 0), liftV: days.map(() => 0), shown: days.map(() => 0),
      bub: days.map(() => [] as Bubble[]), light: -0.2, lightTo: -0.2,
    };
    const target = (i: number) => sets[live.current.set].values[i] / FULL;

    const tubePath = (c: CanvasRenderingContext2D, x: number, top: number, bottom: number, rad: number) => {
      c.beginPath(); c.moveTo(x - rad, top); c.lineTo(x - rad, bottom - rad); c.arc(x, bottom - rad, rad, Math.PI, 0, true); c.lineTo(x + rad, top); c.closePath();
    };

    const tube = (i: number) => {
      const x = tx(i), up = s.lift[i], top = L.top - up, bottom = bot - up, dye = dyes[i % dyes.length], lvl = Math.max(0, s.lv[i]);
      const ys = yZero - up - lvl * (yZero - yFull), slope = Math.max(-0.5, Math.min(0.5, s.tilt[i])), wall = 2.2 * u, ri = r - wall;

      // Coloured light the liquid throws onto the base, and the dark ring where glass meets metal.
      ctx.save(); ctx.translate(x + 5 * u, bot + 2 * u); ctx.scale(1, 0.26);
      const pool = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.1);
      pool.addColorStop(0, tone(dye, 0.1, 0.5 * Math.min(1, lvl * 3))); pool.addColorStop(0.5, tone(dye, 0.2, 0.22 * Math.min(1, lvl * 3))); pool.addColorStop(1, tone(dye, 0.2, 0));
      ctx.fillStyle = pool; ctx.beginPath(); ctx.arc(0, 0, r * 2.1, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      if (up > 0.5) {
        ctx.save(); ctx.translate(x, bot); ctx.scale(1, 0.28); ctx.globalAlpha = Math.max(0, 1 - up / (26 * u));
        ctx.fillStyle = "rgba(30,40,56,0.35)"; ctx.beginPath(); ctx.arc(0, 0, r * 0.9, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }

      // A faint reflection of the dye in the glossy sweep under the rack.
      const fl = L.base + baseT + baseF + 4 * u;
      ctx.save(); ctx.translate(x, fl); ctx.scale(1, 0.5 + lvl * 0.7);
      const mirror = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.5);
      mirror.addColorStop(0, tone(dye, 0.15, 0.3)); mirror.addColorStop(0.5, tone(dye, 0.2, 0.12)); mirror.addColorStop(1, tone(dye, 0.2, 0));
      ctx.fillStyle = mirror; ctx.beginPath(); ctx.arc(0, 0, r * 1.5, 0, Math.PI); ctx.fill(); ctx.restore();

      // The glass itself: darker where you look through more of it.
      tubePath(ctx, x, top, bottom, r);
      const glass = ctx.createLinearGradient(x - r, 0, x + r, 0);
      glass.addColorStop(0, "rgba(96,118,138,0.5)"); glass.addColorStop(0.09, "rgba(170,190,205,0.2)"); glass.addColorStop(0.5, "rgba(255,255,255,0.1)"); glass.addColorStop(0.91, "rgba(170,190,205,0.22)"); glass.addColorStop(1, "rgba(96,118,138,0.55)");
      ctx.fillStyle = glass; ctx.fill();

      ctx.save(); tubePath(ctx, x, top, bottom - wall, ri); ctx.clip();
      if (lvl > 0.004) {
        // The body of the liquid, lit like a cylinder: dark at both walls, a bright core left of centre.
        ctx.beginPath(); ctx.moveTo(x - ri, ys - slope * ri); ctx.lineTo(x + ri, ys + slope * ri); ctx.lineTo(x + ri, bottom + 2); ctx.lineTo(x - ri, bottom + 2); ctx.closePath();
        const body = ctx.createLinearGradient(x - ri, 0, x + ri, 0);
        body.addColorStop(0, tone(dye, -0.5, 0.96)); body.addColorStop(0.14, tone(dye, -0.12, 0.94)); body.addColorStop(0.36, tone(dye, 0.3, 0.9)); body.addColorStop(0.62, tone(dye, 0, 0.93)); body.addColorStop(0.88, tone(dye, -0.26, 0.95)); body.addColorStop(1, tone(dye, -0.56, 0.97));
        ctx.fillStyle = body; ctx.fill();
        const depth = ctx.createLinearGradient(0, ys, 0, bottom);
        depth.addColorStop(0, "rgba(255,255,255,0.1)"); depth.addColorStop(0.12, "rgba(255,255,255,0)"); depth.addColorStop(1, "rgba(10,0,30,0.26)");
        ctx.fillStyle = depth; ctx.fill();
        // The round bottom works as a lens and gathers light.
        const lens = ctx.createRadialGradient(x + r * 0.2, bottom - r * 0.62, 0, x + r * 0.2, bottom - r * 0.62, r * 0.75);
        lens.addColorStop(0, tone(dye, 0.75, 0.75)); lens.addColorStop(0.5, tone(dye, 0.4, 0.3)); lens.addColorStop(1, tone(dye, 0.4, 0));
        ctx.fillStyle = lens; ctx.fillRect(x - r, bottom - r * 1.5, L.tw, r * 1.5);
        // Bubbles.
        for (const q of s.bub[i]) {
          if (q.y - up < ys + 3) continue;
          ctx.beginPath(); ctx.arc(q.x + Math.sin(q.w) * 1.4, q.y - up, q.r, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255,255,255,0.2)"; ctx.fill(); ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(255,255,255,0.75)"; ctx.stroke();
          ctx.beginPath(); ctx.arc(q.x + Math.sin(q.w) * 1.4 - q.r * 0.35, q.y - up - q.r * 0.35, q.r * 0.28, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,0.95)"; ctx.fill();
        }
        // The surface, seen a little from above, with the meniscus climbing the wall.
        ctx.save(); ctx.translate(x, ys); ctx.rotate(Math.atan(slope));
        const ry = 5.2 * u, top0 = ctx.createLinearGradient(0, -ry, 0, ry);
        top0.addColorStop(0, tone(dye, -0.18, 0.96)); top0.addColorStop(0.5, tone(dye, 0.34, 0.96)); top0.addColorStop(1, tone(dye, 0.62, 0.96));
        ctx.beginPath(); ctx.ellipse(0, 0, ri, ry, 0, 0, Math.PI * 2); ctx.fillStyle = top0; ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, 0, ri - 0.5, ry - 0.5, 0, 0.08 * Math.PI, 0.92 * Math.PI); ctx.lineWidth = 1.1; ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(-ri * 0.3, -ry * 0.1, ri * 0.34, ry * 0.3, 0, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.fill();
        ctx.restore();
      }
      // Graduations fired onto the glass in blue enamel.
      ctx.lineCap = "butt";
      for (let g = 0; g <= 10; g++) {
        const gy = yZero - up - (g / 10) * (yZero - yFull), long = g % 5 === 0;
        ctx.beginPath(); ctx.moveTo(x + ri - (long ? 15 : 8.5) * u, gy); ctx.lineTo(x + ri - 1.5 * u, gy);
        ctx.lineWidth = long ? 1.3 : 0.9; ctx.strokeStyle = long ? "rgba(246,250,255,0.95)" : "rgba(246,250,255,0.72)"; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + ri - (long ? 15 : 8.5) * u, gy + 0.9); ctx.lineTo(x + ri - 1.5 * u, gy + 0.9);
        ctx.lineWidth = 0.6; ctx.strokeStyle = "rgba(20,40,70,0.38)"; ctx.stroke();
      }
      ctx.restore();

      // Wall, reflections and the rolled lip.
      const edge = ctx.createLinearGradient(x - r, 0, x + r, 0);
      edge.addColorStop(0, "rgba(58,76,94,0.78)"); edge.addColorStop(0.5, "rgba(58,76,94,0.3)"); edge.addColorStop(1, "rgba(58,76,94,0.82)");
      tubePath(ctx, x, top, bottom, r); ctx.lineWidth = 1.1; ctx.strokeStyle = edge; ctx.stroke();
      ctx.beginPath(); ctx.arc(x, bottom - r, r - 0.9, 0.2 * Math.PI, 0.8 * Math.PI); ctx.lineWidth = 1.3; ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.stroke();
      const sx = x - r + L.tw * (0.17 + 0.07 * s.light), sw = L.tw * 0.13, y0 = top + 12 * u, y1 = bottom - r * 0.9;
      const streak = ctx.createLinearGradient(0, y0, 0, y1);
      streak.addColorStop(0, "rgba(255,255,255,0)"); streak.addColorStop(0.08, "rgba(255,255,255,0.95)"); streak.addColorStop(0.55, "rgba(255,255,255,0.72)"); streak.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = streak; ctx.beginPath(); ctx.ellipse(sx + sw / 2, (y0 + y1) / 2, sw / 2, (y1 - y0) / 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.beginPath(); ctx.ellipse(sx + sw * 1.75, (y0 + y1) / 2, sw * 0.2, (y1 - y0) * 0.46, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.beginPath(); ctx.ellipse(x + r - L.tw * (0.1 - 0.03 * s.light), (y0 + y1) / 2, 1.1 * u, (y1 - y0) * 0.44, 0, 0, Math.PI * 2); ctx.fill();
      const lipR = r + 2.6 * u, lipY = 4.6 * u;
      ctx.beginPath(); ctx.ellipse(x, top, lipR, lipY, 0, 0, Math.PI * 2); ctx.fillStyle = "rgba(236,243,248,0.5)"; ctx.fill();
      ctx.lineWidth = 2.2 * u; ctx.strokeStyle = "rgba(92,112,130,0.62)"; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x, top - 0.4, lipR, lipY, 0, 1.08 * Math.PI, 1.62 * Math.PI); ctx.lineWidth = 1.5 * u; ctx.strokeStyle = "rgba(255,255,255,0.98)"; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x, top + 0.6, lipR - 1, lipY - 0.6, 0, 0.1 * Math.PI, 0.5 * Math.PI); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.stroke();

      // The reading above the lip.
      const on = live.current.active === i;
      ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
      ctx.font = `${on ? 800 : 600} ${(on ? 17 : 14) * Math.max(0.8, u)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      ctx.fillStyle = on ? "#0f172a" : "#475569"; ctx.fillText(String(Math.round(s.shown[i])), x, top - 15 * u);
    };

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(back, 0, 0);
      ctx.setTransform(k, 0, 0, k, 0, 0);
      for (let i = 0; i < n; i++) tube(i);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(front, 0, 0);
    };

    let raf = 0, last = 0, t0 = 0, seen = true, moved = -1e9, nextSwap = 6.2;
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.04, (now - last) / 1000); last = now;
      const t = (now - t0) / 1000;
      if (!live.current.touched && t > nextSwap) { nextSwap = t + 5.4; live.current.set = (live.current.set + 1) % sets.length; setSet(live.current.set); }
      if (now - moved > 2600) s.lightTo = 0.7 * Math.sin(t * 0.55);
      s.light += (s.lightTo - s.light) * Math.min(1, dt * 5);
      for (let i = 0; i < n; i++) {
        const goal = t > 0.12 + i * 0.075 ? target(i) : 0, before = s.vel[i];
        s.vel[i] += (70 * (goal - s.lv[i]) - 9.5 * s.vel[i]) * dt; s.lv[i] += s.vel[i] * dt;
        if (s.lv[i] < 0) { s.lv[i] = 0; s.vel[i] = 0; }
        s.shown[i] = Math.max(0, Math.min(FULL, s.lv[i] * FULL));
        if (Math.abs(goal - s.lv[i]) < 0.004 && Math.abs(s.vel[i]) < 0.02) s.shown[i] = goal * FULL;
        // Lifting a tube out of the rack, and the slosh that any change of speed sets off.
        const wantLift = live.current.active === i ? 20 * u : 0, lb = s.liftV[i];
        s.liftV[i] += (260 * (wantLift - s.lift[i]) - 20 * s.liftV[i]) * dt; s.lift[i] += s.liftV[i] * dt;
        s.tv[i] += ((s.vel[i] - before) * 0.4 * (i % 2 ? 1 : -1) + (s.liftV[i] - lb) * 0.006 - 120 * s.tilt[i] * dt - 3.4 * s.tv[i] * dt);
        s.tilt[i] += s.tv[i] * dt;
        const rising = s.vel[i] > 0.12;
        if (rising && Math.random() < dt * 26) s.bub[i].push({ x: tx(i) + (Math.random() - 0.5) * (L.tw - 14 * u), y: bot - 6 - Math.random() * 10, r: (1 + Math.random() * 2.2) * Math.max(0.75, u), v: 60 + Math.random() * 80, w: Math.random() * 6 });
        else if (Math.random() < dt * 0.22 && s.lv[i] > 0.15) s.bub[i].push({ x: tx(i) + (Math.random() - 0.5) * (L.tw - 16 * u), y: bot - 6, r: (0.8 + Math.random() * 1.2) * Math.max(0.75, u), v: 30 + Math.random() * 30, w: Math.random() * 6 });
        const surface = yZero - s.lv[i] * (yZero - yFull);
        s.bub[i] = s.bub[i].filter((q) => { q.y -= q.v * dt; q.w += dt * 7; return q.y > surface; });
      }
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const still = () => {
      for (let i = 0; i < n; i++) { s.lv[i] = target(i); s.shown[i] = s.lv[i] * FULL; s.vel[i] = 0; s.tilt[i] = 0; s.lift[i] = live.current.active === i ? 20 * u : 0; s.bub[i] = []; }
      draw();
    };
    const wake = () => { if (reduce) still(); else if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    api.current = { poke: wake, flick: (i) => { s.tv[i] += (Math.random() > 0.5 ? 1 : -1) * 2.2; wake(); } };
    fit(); wake();

    // Passing the pointer across a tube knocks its liquid; the reflections follow it too.
    const host = cv.parentElement;
    let px = 0, pt = 0;
    const onMove = (e: PointerEvent) => {
      const b = cv.getBoundingClientRect(), x = ((e.clientX - b.left) / b.width) * L.W, now = performance.now();
      moved = now; s.lightTo = Math.max(-1, Math.min(1, (x / L.W) * 2 - 1));
      const speed = pt ? (x - px) / Math.max(8, now - pt) : 0;
      for (let i = 0; i < n; i++) if (Math.abs(x - tx(i)) < r + 4 && Math.abs(px - tx(i)) >= r + 4) s.tv[i] += Math.max(-3, Math.min(3, speed * 2.4));
      px = x; pt = now;
    };
    host?.addEventListener("pointermove", onMove);
    const ro = new ResizeObserver(() => { fit(); if (reduce) still(); });
    ro.observe(cv);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); api.current = null;
      host?.removeEventListener("pointermove", onMove);
      ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, [narrow]);

  const L = layoutFor(narrow);
  const touch = () => { if (!live.current.touched) { live.current.touched = true; setTouched(true); } };
  const choose = (i: number) => { touch(); live.current.set = i; setSet(i); api.current?.poke(); };
  const point = (i: number) => { live.current.active = i; setActive(i); api.current?.poke(); };
  const values = sets[set].values, total = values.reduce((a, b) => a + b, 0);
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;

  return (
    <div ref={stage} className="flex min-h-[640px] w-full flex-col items-center justify-center bg-[#e6e9ed] bg-[radial-gradient(110%_80%_at_50%_30%,#fbfcfd_0%,#e9ecf0_52%,#cfd5dc_100%)] px-4 py-12 sm:min-h-[760px]">
      <div className="relative w-full" style={{ maxWidth: L.W, aspectRatio: `${L.W} / ${L.H}` }}>
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <ul aria-label={`${sets[set].label}, ${UNIT} per day`} className="absolute inset-0">
          {days.map((d, i) => (
            <li key={d}>
              <button
                type="button"
                aria-label={`${dayNames[i]}: ${values[i]} ${UNIT}`}
                onPointerEnter={() => point(i)}
                onPointerLeave={() => point(-1)}
                onFocus={() => { touch(); point(i); }}
                onBlur={() => point(-1)}
                onClick={() => { touch(); point(i); api.current?.flick(i); }}
                style={{ left: pct(L.x0 + i * L.gap - L.gap / 2, L.W), top: pct(L.top - 34 * L.u, L.H), width: pct(L.gap, L.W), height: pct(L.base + 68 * L.u - L.top + 34 * L.u, L.H) }}
                className="absolute cursor-pointer rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-slate-900/70"
              />
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8 flex flex-col items-center gap-4">
        <div role="group" aria-label="Data set" className="flex rounded-full bg-white/70 p-1 shadow-[inset_0_1px_2px_rgba(15,23,42,0.16),0_1px_0_rgba(255,255,255,0.9)]">
          {sets.map((d, i) => (
            <button
              key={d.label}
              type="button"
              aria-pressed={set === i}
              onClick={() => choose(i)}
              className={`h-10 rounded-full px-5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-slate-900 motion-reduce:transition-none ${set === i ? "bg-slate-900 text-white shadow-[0_2px_6px_rgba(15,23,42,0.35)]" : "text-slate-600 hover:text-slate-900"}`}
            >
              {d.label}
            </button>
          ))}
        </div>
        <p aria-live={touched ? "polite" : "off"} className="min-h-[20px] text-center font-mono text-[11px] uppercase leading-5 tracking-[0.16em] text-slate-600">
          <span className="text-slate-900">{active >= 0 ? `${dayNames[active]} ${values[active]}` : `${sets[set].label} ${total}`}</span>
          <span className="mx-2 text-slate-400">/</span>
          {UNIT}, demo data
        </p>
      </div>

      <table className="sr-only">
        <caption>{`${sets[set].label}: ${UNIT} per day (demo data)`}</caption>
        <thead>
          <tr><th scope="col">Day</th><th scope="col">{UNIT}</th></tr>
        </thead>
        <tbody>
          {days.map((d, i) => (
            <tr key={d}><th scope="row">{dayNames[i]}</th><td>{values[i]}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
