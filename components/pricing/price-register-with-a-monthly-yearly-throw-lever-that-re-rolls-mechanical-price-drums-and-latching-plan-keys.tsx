import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, MouseEvent as ReactMouseEvent } from "react";

// One window per plan. Both prices are per month and must stay under 100: each window has two drums.
const plans = [
  { name: "Solo", monthly: 12, yearly: 10, note: "One writer, unlimited notebooks" },
  { name: "Team", monthly: 29, yearly: 24, note: "Ten seats and shared folders" },
  { name: "Firm", monthly: 79, yearly: 66, note: "Fifty seats, roles and audit log" },
];
const PRODUCT = "Fieldnote"; // the made-up notes app this register prices
const KNOB = ["#ffa391", "#e2331d", "#9a1508", "#560a03"]; // lever ball, highlight to shadow
const LAMP = "#ffb648"; // jewel above the latched key, and the focus ring
const BODY = ["#bccab0", "#a3b497", "#86987a"]; // enamel housing, top to bottom

const layoutFor = (narrow: boolean) =>
  narrow
    ? { W: 380, H: 660, u: 0.8, body: { x: 8, y: 8, w: 364, h: 612 }, fascia: { x: 22, y: 26, w: 336, h: 190 }, wins: [84, 190, 296], win: { y: 66, h: 84, dw: 37 }, flag: { x: 70, y: 170, w: 240, h: 26 }, keys: { y: 284, r: 25 }, lever: { x: 190, y0: 336, y1: 604, w: 84, travel: 86 } }
    : { W: 760, H: 540, u: 1, body: { x: 22, y: 16, w: 716, h: 468 }, fascia: { x: 58, y: 52, w: 508, h: 244 }, wins: [152, 312, 472], win: { y: 104, h: 112, dw: 51 }, flag: { x: 172, y: 240, w: 280, h: 30 }, keys: { y: 384, r: 31 }, lever: { x: 652, y0: 52, y1: 448, w: 96, travel: 126 } };

export default function PriceRegisterWithThrowLever() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const radios = useRef<(HTMLButtonElement | null)[]>([]);
  const [narrow, setNarrow] = useState(false);
  const [yearly, setYearly] = useState(false);
  const [plan, setPlan] = useState(1);
  const live = useRef({ yearly: false, plan: 1 });
  const grip = useRef({ on: false, moved: 0, startY: 0 });
  const api = useRef<{ poke: () => void; drag: (y: number | null) => void; throwTo: (yearly: boolean) => void } | null>(null);

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
    const L = layoutFor(narrow), u = L.u, PIVOT = (L.lever.y0 + L.lever.y1) / 2;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let k = 1;
    const base = document.createElement("canvas");
    const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    };
    const chrome = (c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) => {
      const g = c.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, "#ffffff"); g.addColorStop(0.28, "#a9afb7"); g.addColorStop(0.48, "#f1f3f5"); g.addColorStop(0.55, "#596069"); g.addColorStop(0.84, "#a0a6ae"); g.addColorStop(1, "#dde0e4");
      return g;
    };
    const stamp = (c: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, ink = "rgba(38,48,34,0.78)", light = "rgba(255,255,255,0.45)") => {
      c.font = `700 ${size}px ui-monospace, SFMono-Regular, Menlo, monospace`; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillStyle = light; c.fillText(text, x, y + 0.9); c.fillStyle = ink; c.fillText(text, x, y);
    };

    // Everything bolted down: housing, black fascia, chrome window frames, key collars, the lever gate.
    const build = () => {
      const b = base.getContext("2d");
      if (!b) return;
      base.width = cv.width; base.height = cv.height;
      b.setTransform(k, 0, 0, k, 0, 0);
      const B = L.body, F = L.fascia, G = L.lever;
      b.save(); b.shadowColor = "rgba(90,40,30,0.42)"; b.shadowBlur = 36 * k; b.shadowOffsetY = 24 * k; rr(b, B.x + 10, B.y + 10, B.w - 20, B.h - 10, 30 * u); b.fillStyle = "#6f7f64"; b.fill(); b.restore();
      rr(b, B.x, B.y + 9 * u, B.w, B.h, 30 * u); b.fillStyle = "#5f6f56"; b.fill();
      const body = b.createLinearGradient(0, B.y, 0, B.y + B.h); body.addColorStop(0, BODY[0]); body.addColorStop(0.45, BODY[1]); body.addColorStop(1, BODY[2]);
      rr(b, B.x, B.y, B.w, B.h, 30 * u); b.fillStyle = body; b.fill();
      b.save(); b.clip();
      // Hammered enamel: soft dimples of light and shade.
      let seed = 31;
      const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let i = 0; i < (narrow ? 1500 : 2300); i++) {
        const x = B.x + rand() * B.w, y = B.y + rand() * B.h, r = (2.5 + rand() * 6) * u, v = rand();
        const g = b.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
        g.addColorStop(0, v > 0.5 ? `rgba(255,255,255,${0.04 + (v - 0.5) * 0.14})` : `rgba(30,45,25,${0.015 + (0.5 - v) * 0.07})`); g.addColorStop(1, "rgba(0,0,0,0)");
        b.fillStyle = g; b.fillRect(x - r, y - r, r * 2, r * 2);
      }
      const glow = b.createLinearGradient(B.x, B.y, B.x + B.w * 0.7, B.y + B.h);
      glow.addColorStop(0, "rgba(255,255,255,0.3)"); glow.addColorStop(0.3, "rgba(255,255,255,0)"); glow.addColorStop(1, "rgba(30,45,25,0.14)"); b.fillStyle = glow; b.fillRect(B.x, B.y, B.w, B.h);
      b.restore();
      const edge = b.createLinearGradient(0, B.y, 0, B.y + B.h);
      edge.addColorStop(0, "rgba(255,255,255,0.9)"); edge.addColorStop(0.1, "rgba(255,255,255,0.15)"); edge.addColorStop(0.92, "rgba(30,45,25,0.25)"); edge.addColorStop(1, "rgba(30,45,25,0.6)");
      rr(b, B.x + 0.8, B.y + 0.8, B.w - 1.6, B.h - 1.6, 29.2 * u); b.lineWidth = 1.6; b.strokeStyle = edge; b.stroke();

      // Fascia: black glass in a chrome frame.
      b.save(); b.shadowColor = "rgba(30,45,25,0.5)"; b.shadowBlur = 5 * k; b.shadowOffsetY = 2.5 * k; rr(b, F.x - 5 * u, F.y - 5 * u, F.w + 10 * u, F.h + 10 * u, 17 * u); b.fillStyle = chrome(b, 0, F.y - 5 * u, 0, F.y + F.h + 5 * u); b.fill(); b.restore();
      rr(b, F.x - 4.4 * u, F.y - 4.4 * u, F.w + 8.8 * u, F.h + 8.8 * u, 16.5 * u); b.lineWidth = 0.7; b.strokeStyle = "rgba(255,255,255,0.9)"; b.stroke();
      const glass = b.createLinearGradient(0, F.y, 0, F.y + F.h); glass.addColorStop(0, "#26282b"); glass.addColorStop(1, "#0e0f11");
      rr(b, F.x, F.y, F.w, F.h, 12 * u); b.fillStyle = glass; b.fill();
      b.save(); b.clip(); b.beginPath(); b.moveTo(F.x, F.y); b.lineTo(F.x + F.w * 0.42, F.y); b.lineTo(F.x + F.w * 0.24, F.y + F.h); b.lineTo(F.x, F.y + F.h); b.closePath();
      const ref = b.createLinearGradient(F.x, 0, F.x + F.w * 0.4, 0); ref.addColorStop(0, "rgba(255,255,255,0.07)"); ref.addColorStop(1, "rgba(255,255,255,0.015)"); b.fillStyle = ref; b.fill(); b.restore();
      L.wins.forEach((cx, i) => {
        const w = L.win.dw * 2 + 2, x = cx - w / 2, y = L.win.y, h = L.win.h;
        b.font = `700 ${9.5 * u}px ui-monospace, SFMono-Regular, Menlo, monospace`; b.textAlign = "center"; b.textBaseline = "middle"; b.fillStyle = "rgba(240,232,214,0.92)";
        b.fillText(plans[i].name.toUpperCase(), cx, y - 21 * u);
        b.font = `600 ${24 * u}px Georgia, "Times New Roman", serif`; b.fillStyle = "rgba(240,232,214,0.9)"; b.fillText("$", x - 15 * u, y + h / 2 + 1);
        rr(b, x - 5 * u, y - 5 * u, w + 10 * u, h + 10 * u, 8 * u); b.fillStyle = chrome(b, 0, y - 5 * u, 0, y + h + 5 * u); b.fill();
        rr(b, x - 1.5, y - 1.5, w + 3, h + 3, 4 * u); b.fillStyle = "#030303"; b.fill();
      });
      const Q = L.flag;
      rr(b, Q.x - 4 * u, Q.y - 4 * u, Q.w + 8 * u, Q.h + 8 * u, 7 * u); b.fillStyle = chrome(b, 0, Q.y - 4 * u, 0, Q.y + Q.h + 4 * u); b.fill();
      rr(b, Q.x - 1, Q.y - 1, Q.w + 2, Q.h + 2, 3.5 * u); b.fillStyle = "#030303"; b.fill();

      // Key collars and lamp bezels.
      L.wins.forEach((cx) => {
        const r = L.keys.r, y = L.keys.y;
        b.save(); b.shadowColor = "rgba(30,45,25,0.55)"; b.shadowBlur = 6 * k; b.shadowOffsetY = 3 * k; b.beginPath(); b.arc(cx, y, r + 5 * u, 0, Math.PI * 2); b.fillStyle = chrome(b, cx - r, y - r, cx + r, y + r); b.fill(); b.restore();
        b.beginPath(); b.arc(cx, y, r + 4.4 * u, 0, Math.PI * 2); b.lineWidth = 0.7; b.strokeStyle = "rgba(255,255,255,0.9)"; b.stroke();
        b.beginPath(); b.arc(cx, y, r, 0, Math.PI * 2); const well = b.createLinearGradient(0, y - r, 0, y + r); well.addColorStop(0, "#050505"); well.addColorStop(1, "#3a3c40"); b.fillStyle = well; b.fill();
        const ly = y - r - 21 * u;
        b.beginPath(); b.arc(cx, ly, 6.4 * u, 0, Math.PI * 2); b.fillStyle = chrome(b, cx - 6, ly - 6, cx + 6, ly + 6); b.fill();
        b.beginPath(); b.arc(cx, ly, 4.4 * u, 0, Math.PI * 2); b.fillStyle = "#140c04"; b.fill();
      });

      // Lever gate: a chrome plate with a slot, a painted legend at each end of the travel.
      const gx = G.x - G.w / 2, gh = G.y1 - G.y0;
      b.save(); b.shadowColor = "rgba(30,45,25,0.55)"; b.shadowBlur = 6 * k; b.shadowOffsetY = 3 * k; rr(b, gx, G.y0, G.w, gh, 16 * u); b.fillStyle = chrome(b, gx, 0, gx + G.w, 0); b.fill(); b.restore();
      b.save(); rr(b, gx, G.y0, G.w, gh, 16 * u); b.clip();
      for (let y = G.y0; y < G.y1; y += 0.6) { const v = rand(); b.beginPath(); b.moveTo(gx, y); b.lineTo(gx + G.w, y); b.lineWidth = 0.5; b.strokeStyle = v > 0.5 ? `rgba(255,255,255,${(v - 0.5) * 0.35})` : `rgba(0,0,0,${(0.5 - v) * 0.2})`; b.stroke(); }
      const fade = b.createLinearGradient(0, G.y0, 0, G.y1); fade.addColorStop(0, "rgba(255,255,255,0.35)"); fade.addColorStop(0.5, "rgba(255,255,255,0)"); fade.addColorStop(1, "rgba(0,0,0,0.22)"); b.fillStyle = fade; b.fillRect(gx, G.y0, G.w, gh);
      b.restore();
      rr(b, gx + 0.6, G.y0 + 0.6, G.w - 1.2, gh - 1.2, 15.5 * u); b.lineWidth = 1; b.strokeStyle = "rgba(255,255,255,0.9)"; b.stroke();
      const sw = 21 * u, sy0 = PIVOT - G.travel - 15 * u, sh = G.travel * 2 + 30 * u;
      rr(b, G.x - sw / 2 - 1.2, sy0 - 1.2, sw + 2.4, sh + 2.4, sw / 2 + 1); b.fillStyle = "rgba(255,255,255,0.85)"; b.fill();
      const slot = b.createLinearGradient(G.x - sw / 2, 0, G.x + sw / 2, 0); slot.addColorStop(0, "#000"); slot.addColorStop(0.6, "#15161a"); slot.addColorStop(1, "#3b3d42");
      rr(b, G.x - sw / 2, sy0, sw, sh, sw / 2); b.fillStyle = slot; b.fill();
      stamp(b, "MONTHLY", G.x, G.y0 + 17 * u, 8.5 * u, "rgba(20,22,26,0.85)", "rgba(255,255,255,0.7)");
      stamp(b, "YEARLY", G.x, G.y1 - 16 * u, 8.5 * u, "rgba(20,22,26,0.85)", "rgba(255,255,255,0.7)");
      for (const sx of [gx + 13 * u, gx + G.w - 13 * u]) for (const sy of [G.y0 + 17 * u, G.y1 - 16 * u]) {
        if (narrow && Math.abs(sx - G.x) < 40) continue;
        b.beginPath(); b.arc(sx, sy, 3.6 * u, 0, Math.PI * 2); b.fillStyle = "#4a5058"; b.fill(); b.beginPath(); b.arc(sx - 0.6, sy - 0.8, 2.6 * u, 0, Math.PI * 2); b.fillStyle = "#e9ecef"; b.fill();
        b.beginPath(); b.moveTo(sx - 2.4 * u, sy - 1.2 * u); b.lineTo(sx + 2.4 * u, sy + 1.2 * u); b.lineWidth = 0.9; b.strokeStyle = "#30343a"; b.stroke();
      }
      // Maker's legend pressed into the enamel.
      if (narrow) { stamp(b, PRODUCT.toUpperCase(), 76, PIVOT - 8, 9); stamp(b, "PRICE REGISTER", 76, PIVOT + 8, 7); stamp(b, "THROW TO", 304, PIVOT - 8, 7); stamp(b, "RE-PRICE", 304, PIVOT + 8, 7); }
      else stamp(b, `${PRODUCT.toUpperCase()}  /  PRICE REGISTER  /  THREE WINDOW`, (F.x + F.x + F.w) / 2, B.y + B.h - 22, 8);
    };

    const fit = () => {
      const w = cv.clientWidth || L.W;
      k = (w / L.W) * Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(L.W * k); cv.height = Math.round(L.H * k);
      build();
    };

    const digits = (i: number) => { const v = live.current.yearly ? plans[i].yearly : plans[i].monthly; return [Math.floor(v / 10), v % 10]; };
    const s = {
      x: live.current.yearly ? 1 : -1, v: 0, drag: null as number | null, side: live.current.yearly,
      drums: plans.map((_, i) => digits(i).map((d) => ({ p: d, v: 0, to: d, wait: 0 }))),
      flag: live.current.yearly ? 1 : 0, flagV: 0, key: plans.map((_, i) => (i === live.current.plan ? 1 : 0)), keyV: plans.map(() => 0), lamp: plans.map((_, i) => (i === live.current.plan ? 1 : 0)), shake: 0, shakeV: 0,
    };
    // The lever has gone over centre: every drum is sent round to its new figure, left to right.
    const reroll = () => {
      s.drums.forEach((pair, i) => digits(i).forEach((d, j) => {
        const m = pair[j], delta = (((d - m.to) % 10) + 10) % 10;
        m.to += delta + 10 * (j + 1); m.wait = (i * 2 + j) * 0.085;
      }));
      s.shakeV += 60;
    };

    const step = (dt: number) => {
      if (s.drag !== null) { s.v = (s.drag - s.x) / Math.max(dt, 0.001) * 0.3; s.x += (s.drag - s.x) * Math.min(1, dt * 28); }
      else {
        const home = live.current.yearly ? 1 : -1;
        s.v += (190 * (home - s.x) - 9 * s.v) * dt; s.x += s.v * dt;
        if (Math.abs(s.x) > 1) { s.x = Math.sign(s.x); if (Math.abs(s.v) > 1.2) s.shakeV += Math.abs(s.v) * 9; s.v *= -0.28; }
      }
      const side = s.x > 0;
      if (side !== s.side) { s.side = side; if (s.drag !== null) live.current.yearly = side; setYearly(side); reroll(); }
      for (const pair of s.drums) for (const m of pair) {
        if (m.wait > 0) { m.wait -= dt; continue; }
        m.v += (70 * (m.to - m.p) - 12.5 * m.v) * dt; m.v = Math.min(m.v, 34); m.p += m.v * dt;
      }
      const ft = live.current.yearly ? 1 : 0; s.flagV += (120 * (ft - s.flag) - 13 * s.flagV) * dt; s.flag += s.flagV * dt;
      plans.forEach((_, i) => {
        const to = i === live.current.plan ? 1 : 0;
        s.keyV[i] += (620 * (to - s.key[i]) - 30 * s.keyV[i]) * dt; s.key[i] += s.keyV[i] * dt;
        s.lamp[i] += (to - s.lamp[i]) * Math.min(1, dt * (to ? 16 : 7));
      });
      s.shakeV += (-900 * s.shake - 28 * s.shakeV) * dt; s.shake += s.shakeV * dt;
    };

    const drum = (x: number, y: number, w: number, h: number, p: number, cells: number, label: (n: number) => string, font: string) => {
      const R = h * 0.9, pitch = (Math.PI * 2) / cells;
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      const g = ctx.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, "#3d382d"); g.addColorStop(0.14, "#b9af95"); g.addColorStop(0.4, "#f6f0dd"); g.addColorStop(0.52, "#fffaea"); g.addColorStop(0.7, "#ded5bb"); g.addColorStop(0.9, "#8f866f"); g.addColorStop(1, "#353026");
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
      const near = Math.round(p);
      for (let n = near - 2; n <= near + 2; n++) {
        const a = (n - p) * pitch;
        if (Math.abs(a) > 1.45) continue;
        const cy = y + h / 2 - Math.sin(a) * R, squash = Math.cos(a);
        ctx.save(); ctx.translate(x + w / 2, cy); ctx.scale(1, squash);
        ctx.font = font; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = `rgba(26,22,14,${0.35 + 0.6 * squash})`;
        ctx.fillText(label(((n % cells) + cells) % cells), 0, h * 0.035);
        ctx.restore();
        const sa = a + pitch / 2, sy = y + h / 2 - Math.sin(sa) * R;
        if (Math.abs(sa) < 1.5) { ctx.beginPath(); ctx.moveTo(x, sy); ctx.lineTo(x + w, sy); ctx.lineWidth = Math.max(0.4, Math.cos(sa) * 0.9); ctx.strokeStyle = "rgba(60,50,30,0.28)"; ctx.stroke(); }
      }
      const shade = ctx.createLinearGradient(x, 0, x + w, 0); shade.addColorStop(0, "rgba(0,0,0,0.3)"); shade.addColorStop(0.1, "rgba(0,0,0,0)"); shade.addColorStop(0.9, "rgba(0,0,0,0)"); shade.addColorStop(1, "rgba(0,0,0,0.28)");
      ctx.fillStyle = shade; ctx.fillRect(x, y, w, h);
      ctx.restore();
    };
    const glaze = (x: number, y: number, w: number, h: number) => {
      ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      const top = ctx.createLinearGradient(0, y, 0, y + h * 0.3); top.addColorStop(0, "rgba(0,0,0,0.6)"); top.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = top; ctx.fillRect(x, y, w, h * 0.3);
      ctx.beginPath(); ctx.moveTo(x + w * 0.52, y); ctx.lineTo(x + w * 0.8, y); ctx.lineTo(x + w * 0.56, y + h); ctx.lineTo(x + w * 0.28, y + h); ctx.closePath(); ctx.fillStyle = "rgba(255,255,255,0.11)"; ctx.fill();
      ctx.beginPath(); ctx.moveTo(x + w * 0.84, y); ctx.lineTo(x + w * 0.89, y); ctx.lineTo(x + w * 0.65, y + h); ctx.lineTo(x + w * 0.6, y + h); ctx.closePath(); ctx.fill();
      ctx.restore();
    };

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
      const dy = s.shake;
      ctx.drawImage(base, 0, Math.round(dy * k));
      ctx.setTransform(k, 0, 0, k, 0, dy * k);
      const font = `800 ${L.win.h * 0.56}px ui-sans-serif, system-ui, "Helvetica Neue", Arial, sans-serif`;
      L.wins.forEach((cx, i) => {
        const w = L.win.dw, x = cx - w - 1;
        s.drums[i].forEach((m, j) => drum(x + j * (w + 2), L.win.y, w, L.win.h, m.p, 10, (n) => String(n), font));
        glaze(x, L.win.y, w * 2 + 2, L.win.h);
      });
      const Q = L.flag;
      drum(Q.x, Q.y, Q.w, Q.h, s.flag, 6, (n) => (n === 0 ? "PER MONTH, PAID MONTHLY" : n === 1 ? "PER MONTH, PAID YEARLY" : ""), `700 ${Q.h * 0.4}px ui-monospace, SFMono-Regular, Menlo, monospace`);
      glaze(Q.x, Q.y, Q.w, Q.h);

      // Latching keys: the chosen one stays down and its jewel lights.
      L.wins.forEach((cx, i) => {
        const r = L.keys.r, d = Math.max(-0.2, s.key[i]), y = L.keys.y - 5 * u + d * 4.5 * u, rc = r - 3.5 * u - d * 0.8 * u;
        ctx.save(); ctx.beginPath(); ctx.arc(cx, L.keys.y, r, 0, Math.PI * 2); ctx.clip();
        ctx.beginPath(); ctx.arc(cx + 2 * u, y + (9 - d * 6) * u, rc, 0, Math.PI * 2); ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fill();
        ctx.beginPath(); ctx.arc(cx, y + 4 * u, rc, 0, Math.PI * 2); ctx.fillStyle = "#8d8570"; ctx.fill();
        const cap = ctx.createRadialGradient(cx - rc * 0.3, y - rc * 0.45, rc * 0.1, cx, y, rc * 1.1);
        cap.addColorStop(0, d > 0.5 ? "#f3ecd8" : "#fffdf4"); cap.addColorStop(0.7, d > 0.5 ? "#d9cfb4" : "#ece3ca"); cap.addColorStop(1, "#b5ab90");
        ctx.beginPath(); ctx.arc(cx, y, rc, 0, Math.PI * 2); ctx.fillStyle = cap; ctx.fill();
        ctx.beginPath(); ctx.arc(cx, y, rc * 0.8, 0, Math.PI * 2); const dish = ctx.createLinearGradient(0, y - rc * 0.8, 0, y + rc * 0.8); dish.addColorStop(0, "rgba(90,80,55,0.26)"); dish.addColorStop(0.5, "rgba(255,255,255,0)"); dish.addColorStop(1, "rgba(255,255,255,0.6)"); ctx.fillStyle = dish; ctx.fill();
        ctx.font = `800 ${9.5 * u}px ui-sans-serif, system-ui, "Helvetica Neue", Arial, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#231f16"; ctx.fillText(plans[i].name.toUpperCase(), cx, y + 0.5);
        ctx.restore();
        const ly = L.keys.y - r - 21 * u, on = s.lamp[i];
        ctx.save(); ctx.shadowColor = LAMP; ctx.shadowBlur = 18 * on * k; ctx.globalAlpha = 0.14 + 0.86 * on; ctx.beginPath(); ctx.arc(cx, ly, 4 * u, 0, Math.PI * 2); ctx.fillStyle = LAMP; ctx.fill(); ctx.restore();
        ctx.beginPath(); ctx.arc(cx - 1.2 * u, ly - 1.4 * u, 1.2 * u, 0, Math.PI * 2); ctx.fillStyle = `rgba(255,255,255,${0.2 + 0.6 * on})`; ctx.fill();
      });

      // The lever: a chrome stalk coming out of the slot towards you, with a ball on the end.
      const G = L.lever, a = s.x * 0.62, near = Math.cos(a), ky = PIVOT + (Math.sin(a) / Math.sin(0.62)) * G.travel, by = PIVOT + (Math.sin(a) / Math.sin(0.62)) * G.travel * 0.26, kr = 31 * u * (0.88 + 0.18 * near), sw2 = (0.8 + 0.5 * near);
      ctx.beginPath(); ctx.ellipse(G.x, by, 8.5 * u, 13 * u, 0, 0, Math.PI * 2); ctx.fillStyle = "#050506"; ctx.fill();
      ctx.beginPath(); ctx.ellipse(G.x, by, 8.5 * u, 13 * u, 0, 0.3, Math.PI - 0.3); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.stroke();
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = (8 + near * 10) * k; ctx.shadowOffsetX = (4 + near * 10) * k; ctx.shadowOffsetY = (6 + near * 14) * k;
      ctx.beginPath(); ctx.arc(G.x, ky, kr * 0.92, 0, Math.PI * 2); ctx.fillStyle = "rgba(0,0,0,0.9)"; ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.moveTo(G.x - 5.5 * u, by); ctx.lineTo(G.x - 7 * u * sw2, ky); ctx.lineTo(G.x + 7 * u * sw2, ky); ctx.lineTo(G.x + 5.5 * u, by); ctx.closePath();
      ctx.fillStyle = chrome(ctx, G.x - 8 * u, 0, G.x + 8 * u, 0); ctx.fill(); ctx.lineWidth = 0.6; ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.stroke();
      const ball = ctx.createRadialGradient(G.x - kr * 0.36, ky - kr * 0.42, kr * 0.05, G.x, ky, kr);
      ball.addColorStop(0, KNOB[0]); ball.addColorStop(0.34, KNOB[1]); ball.addColorStop(0.8, KNOB[2]); ball.addColorStop(1, KNOB[3]);
      ctx.beginPath(); ctx.arc(G.x, ky, kr, 0, Math.PI * 2); ctx.fillStyle = ball; ctx.fill();
      ctx.save(); ctx.translate(G.x - kr * 0.36, ky - kr * 0.48); ctx.rotate(-0.6); ctx.beginPath(); ctx.ellipse(0, 0, kr * 0.26, kr * 0.13, 0, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,0.88)"; ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.arc(G.x, ky, kr - 1.6, 0.5, 2.2); ctx.lineWidth = 1.6 * u; ctx.strokeStyle = "rgba(255,190,170,0.4)"; ctx.stroke();
    };

    let raf = 0, last = 0, t0 = 0, seen = true, touched = -1e9, nextDemo = 650, tour = 0;
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      if (now - touched > 7000 && now - t0 > nextDemo && s.drag === null) {
        // The demo alternates: throw the lever, then latch the next key.
        if (tour % 2 === 0) live.current.yearly = !live.current.yearly;
        else { live.current.plan = (live.current.plan + 1) % plans.length; setPlan(live.current.plan); }
        tour++; nextDemo = now - t0 + 3300;
      }
      step(dt / 2); step(dt / 2); draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const settle = () => { for (let i = 0; i < 600; i++) step(1 / 60); s.shake = 0; draw(); };
    api.current = {
      poke: () => { touched = performance.now(); if (reduce) settle(); else wake(); },
      drag: (y) => {
        touched = performance.now();
        if (y === null) { if (s.drag !== null) { live.current.yearly = s.x > 0; setYearly(live.current.yearly); } s.drag = null; }
        else { const b = cv.getBoundingClientRect(), py = ((y - b.top) / b.height) * L.H; s.drag = Math.max(-1.04, Math.min(1.04, (py - PIVOT) / L.lever.travel)); }
        if (reduce) settle(); else wake();
      },
      throwTo: (to) => { touched = performance.now(); s.drag = null; live.current.yearly = to; if (reduce) settle(); else wake(); },
    };

    fit();
    if (reduce) settle(); else wake();
    const ro = new ResizeObserver(() => { fit(); if (reduce) draw(); });
    ro.observe(cv);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); api.current = null; ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, [narrow]);

  const L = layoutFor(narrow), u = L.u;
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;
  const choose = (i: number) => { live.current.plan = i; setPlan(i); api.current?.poke(); };
  const onKey = (e: ReactKeyboardEvent, i: number) => {
    const next = e.key === "ArrowRight" || e.key === "ArrowDown" ? (i + 1) % plans.length : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i + plans.length - 1) % plans.length : -1;
    if (next < 0) return;
    e.preventDefault(); choose(next); radios.current[next]?.focus();
  };
  const down = (e: ReactPointerEvent<HTMLButtonElement>) => { grip.current = { on: true, moved: 0, startY: e.clientY }; e.currentTarget.setPointerCapture(e.pointerId); };
  const move = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const g = grip.current;
    if (!g.on) return;
    g.moved = Math.max(g.moved, Math.abs(e.clientY - g.startY));
    if (g.moved > 5) api.current?.drag(e.clientY);
  };
  const up = () => {
    const g = grip.current;
    if (!g.on) return;
    g.on = false;
    if (g.moved > 5) api.current?.drag(null); else api.current?.throwTo(!live.current.yearly);
  };
  const click = (e: ReactMouseEvent) => { if (e.detail === 0) api.current?.throwTo(!live.current.yearly); }; // keyboard only: the pointer is handled above
  const price = yearly ? plans[plan].yearly : plans[plan].monthly;

  return (
    <div ref={stage} className="flex min-h-[640px] w-full flex-col items-center justify-center bg-[#e7cdc3] bg-[radial-gradient(90%_70%_at_45%_32%,#f3e1d9_0%,#e7cdc3_58%,#d9b9ad_100%)] px-3 py-10 sm:min-h-[800px] sm:px-6">
      <div className="relative w-full" style={{ maxWidth: narrow ? L.W : L.W * 1.14, aspectRatio: `${L.W} / ${L.H}` }}>
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <div role="radiogroup" aria-label={`${PRODUCT} plan`}>
          {plans.map((p, i) => (
            <button
              key={p.name}
              ref={(el) => { radios.current[i] = el; }}
              type="button"
              role="radio"
              aria-checked={plan === i}
              aria-label={`${p.name}, $${yearly ? p.yearly : p.monthly} a month`}
              tabIndex={plan === i ? 0 : -1}
              onClick={() => choose(i)}
              onKeyDown={(e) => onKey(e, i)}
              style={{ left: pct(L.wins[i] - L.keys.r - 6 * u, L.W), top: pct(L.keys.y - L.keys.r - 6 * u, L.H), width: pct((L.keys.r + 6 * u) * 2, L.W), height: pct((L.keys.r + 6 * u) * 2, L.H) }}
              className="absolute cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#ffb648] focus-visible:ring-offset-2 focus-visible:ring-offset-[#a3b497]"
            />
          ))}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={yearly}
          aria-label="Pay yearly"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          onClick={click}
          style={{ left: pct(L.lever.x - L.lever.w / 2, L.W), top: pct(L.lever.y0, L.H), width: pct(L.lever.w, L.W), height: pct(L.lever.y1 - L.lever.y0, L.H) }}
          className="absolute cursor-grab touch-none rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[#1c1d20] focus-visible:ring-offset-2 focus-visible:ring-offset-[#a3b497] active:cursor-grabbing"
        />
      </div>
      <p aria-live="polite" className="min-h-[40px] mt-6 max-w-[560px] text-center font-mono text-[11px] uppercase leading-5 tracking-[0.16em] text-stone-700">
        <span className="font-semibold text-stone-950">{plans[plan].name} / ${price} a month</span>
        <span className="mx-2 text-stone-500">/</span>
        {yearly ? `Paid yearly, $${price * 12} a year` : "Paid monthly"}
        <span className="mx-2 text-stone-500">/</span>
        {plans[plan].note}
      </p>
    </div>
  );
}
