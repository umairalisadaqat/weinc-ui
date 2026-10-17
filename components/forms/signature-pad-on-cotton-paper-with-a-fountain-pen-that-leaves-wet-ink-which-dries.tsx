import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

// What is printed on the sheet. Change these and the paper is reprinted.
const sheet = {
  clause: "14. This agreement is made in two copies, one for each party. By signing below the tenant confirms that pages one to three have been read and that the inventory on page three is correct.",
  role: "Signed by the tenant",
  signer: "Ines Halvorsen",
  date: "11 October 2026",
};
const WET = [8, 16, 50]; // ink straight from the nib, as red, green, blue
const DRY = [70, 86, 138]; // the same ink once the paper has taken it
const DRY_SECONDS = 2.4; // how long a stroke stays glossy
const SCRIPT = '"Snell Roundhand", "Savoye LET", "Apple Chancery", "Segoe Script", "Lucida Handwriting", "Brush Script MT", cursive';

type Pt = { x: number; y: number; w: number; t: number };
type Api = { clear: () => void; write: (name: string) => void; png: () => string };

export default function SignaturePadWithFountainPen() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const api = useRef<Api | null>(null);
  const hidden = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [state, setState] = useState<"demo" | "empty" | "inked" | "signed">("demo");

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const q = Math.min(2, window.devicePixelRatio || 1);
    const dry = document.createElement("canvas"), paper = document.createElement("canvas");
    const dc = dry.getContext("2d"), pc = paper.getContext("2d");
    if (!dc || !pc) return;

    // Layout: a wide sheet on desktops, a squarer one on phones. Everything else is measured from it.
    let W = 720, H = 470, S = 1, PEN = 1.16;
    let P = { x: 0, y: 0, w: 0, h: 0 }, B = { x: 0, y: 0, w: 0, h: 0 }, rule = 0, park = { x: 0, y: 0 };
    let strokes: { pts: Pt[]; baked: number }[] = [];
    let typed: { chars: { ch: string; x: number; t: number }[]; size: number; done: boolean } | null = null;
    let plan: { at: number; x: number; y: number; w: number; start: boolean }[] = [], planAt = 0, planEnd = 0;
    let demo = true, demoT = 0, fade = 1, userInk = false;
    const pen = { x: 0, y: 0, z: 1, tx: 0, ty: 0, tz: 1, a: -0.92, ta: -0.92, down: false, parked: true, lie: 0 };
    let raf = 0, last = 0, seen = true, lastMove = -1e9, clock = 0;

    const mix = (k: number) => `rgb(${(DRY[0] + (WET[0] - DRY[0]) * k) | 0},${(DRY[1] + (WET[1] - DRY[1]) * k) | 0},${(DRY[2] + (WET[2] - DRY[2]) * k) | 0})`;
    let seed = 11;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    const printPaper = () => {
      pc.setTransform(q, 0, 0, q, 0, 0); pc.clearRect(0, 0, W, H);
      seed = 11;
      const leaf = (dx: number, dy: number, turn: number, tone: string, shadow: number) => {
        pc.save(); pc.translate(P.x + P.w / 2 + dx, P.y + P.h / 2 + dy); pc.rotate(turn);
        pc.shadowColor = `rgba(0,0,0,${shadow})`; pc.shadowBlur = 26 * q * S; pc.shadowOffsetY = 14 * q * S;
        pc.fillStyle = tone; pc.fillRect(-P.w / 2, -P.h / 2, P.w, P.h); pc.restore();
      };
      leaf(7 * S, 5 * S, 0.022, "#e2dac6", 0.5); // the copy underneath
      leaf(0, 0, 0, "#f4eddc", 0.42);
      pc.save(); pc.beginPath(); pc.rect(P.x, P.y, P.w, P.h); pc.clip();
      // Cotton paper: a soft fall of light, laid lines from the mould and loose fibres.
      const light = pc.createLinearGradient(P.x, P.y, P.x + P.w, P.y + P.h);
      light.addColorStop(0, "#fbf6e9"); light.addColorStop(0.55, "#f3ecda"); light.addColorStop(1, "#e7dec8");
      pc.fillStyle = light; pc.fillRect(P.x, P.y, P.w, P.h);
      for (let x = P.x; x < P.x + P.w; x += 2.4) { pc.fillStyle = `rgba(120,96,50,${0.012 + rand() * 0.02})`; pc.fillRect(x, P.y, 0.8, P.h); }
      for (let x = P.x + 34 * S; x < P.x + P.w; x += 78 * S) { pc.fillStyle = "rgba(255,255,255,0.28)"; pc.fillRect(x, P.y, 1.2, P.h); }
      for (let i = 0; i < 1500; i++) {
        const x = P.x + rand() * P.w, y = P.y + rand() * P.h, a = rand() * Math.PI, l = 2 + rand() * 7, v = rand();
        pc.strokeStyle = v > 0.45 ? `rgba(255,255,255,${0.1 + v * 0.22})` : `rgba(110,84,40,${0.04 + v * 0.14})`;
        pc.lineWidth = 0.5; pc.beginPath(); pc.moveTo(x, y); pc.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + rand() * 2, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); pc.stroke();
      }
      // The printed part of the page.
      const pad = 34 * S, body = Math.max(10.5, 12.5 * S);
      pc.fillStyle = "#3b352a"; pc.font = `${body}px Georgia, "Times New Roman", serif`; pc.textBaseline = "alphabetic"; pc.textAlign = "left";
      let line = "", y = P.y + pad + body;
      for (const word of sheet.clause.split(" ")) {
        if (pc.measureText(line + word).width > P.w - pad * 2 && line) { pc.fillText(line.trim(), P.x + pad, y); line = ""; y += body * 1.55; }
        line += word + " ";
      }
      pc.fillText(line.trim(), P.x + pad, y);
      const small = `600 ${Math.max(8, 8.5 * S)}px ui-sans-serif, system-ui, "Helvetica Neue", Arial, sans-serif`;
      const caps = (text: string, x: number, yy: number) => { pc.font = small; pc.fillStyle = "#6f6654"; let cx = x; for (const ch of text.toUpperCase()) { pc.fillText(ch, cx, yy); cx += pc.measureText(ch).width + 1.4 * S; } };
      pc.fillStyle = "#4a4336"; pc.fillRect(B.x - 6 * S, rule, B.w + 12 * S, 0.9);
      pc.strokeStyle = "#4a4336"; pc.lineWidth = 1.1; const xx = B.x + 2 * S, xy = rule - 12 * S;
      pc.beginPath(); pc.moveTo(xx - 4 * S, xy - 4 * S); pc.lineTo(xx + 4 * S, xy + 4 * S); pc.moveTo(xx + 4 * S, xy - 4 * S); pc.lineTo(xx - 4 * S, xy + 4 * S); pc.stroke();
      caps(sheet.role, B.x - 6 * S, rule + 17 * S);
      pc.font = `italic ${body}px Georgia, serif`; pc.fillStyle = "#3b352a"; pc.fillText(sheet.signer, B.x - 6 * S, rule + 17 * S + body * 1.45);
      const dx = B.x + B.w + 34 * S, dw = P.x + P.w - pad - dx;
      if (dw > 90 * S) {
        pc.fillStyle = "#4a4336"; pc.fillRect(dx, rule, dw, 0.9);
        caps("Date", dx, rule + 17 * S);
        pc.font = `${body * 1.06}px "Courier New", Courier, monospace`; pc.fillStyle = "#2c2a3a"; pc.fillText(sheet.date, dx + 2 * S, rule - 8 * S);
      }
      // Sheet edge: a lit top and left, a shaded foot.
      pc.restore();
      pc.fillStyle = "rgba(255,255,255,0.75)"; pc.fillRect(P.x, P.y, P.w, 1); pc.fillRect(P.x, P.y, 1, P.h);
      pc.fillStyle = "rgba(90,70,30,0.28)"; pc.fillRect(P.x, P.y + P.h - 1, P.w, 1); pc.fillRect(P.x + P.w - 1, P.y, 1, P.h);
    };

    const nib = (dir: number) => S * 4.3 * (0.4 + 0.7 * Math.abs(Math.sin(dir + 0.72)));
    // The signature the pen writes while nobody is using it: a tall capital, a run of loops and an underline.
    const buildDemo = () => {
      const base = rule - 7 * S, at = (u: number, v: number) => [B.x + u * B.w, base - v * B.h];
      const paths: number[][][] = [];
      const cap = [[0.035, 0.46], [0.075, 0.86], [0.125, 0.97], [0.15, 0.78], [0.118, 0.42], [0.078, 0.05], [0.03, 0.02], [0.022, 0.2], [0.09, 0.33], [0.2, 0.3]].map(([u, v]) => at(u, v));
      const curve: number[][] = [];
      for (let i = 0; i < cap.length - 1; i++) {
        const p0 = cap[Math.max(0, i - 1)], p1 = cap[i], p2 = cap[i + 1], p3 = cap[Math.min(cap.length - 1, i + 2)];
        for (let k = 0; k < 12; k++) { const t = k / 12, t2 = t * t, t3 = t2 * t; curve.push([0, 1].map((d) => 0.5 * (2 * p1[d] + (p2[d] - p0[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (3 * p1[d] - p0[d] - 3 * p2[d] + p3[d]) * t3))); }
      }
      paths.push(curve);
      // Each letter of the run: how tall it stands, how far the pen loops back and how far it travels.
      const letters = [[0.3, 0.004, 0.05], [0.25, 0.015, 0.042], [0.2, 0.004, 0.046], [0.96, 0.021, 0.062], [0.3, 0.013, 0.046], [0.86, 0.023, 0.052], [0.27, 0.004, 0.05], [0.25, 0.014, 0.042], [0.2, 0.004, 0.046], [0.17, 0.011, 0.04], [0.12, 0.003, 0.04], [0.08, 0.003, 0.04]];
      const run: number[][] = []; let u0 = 0.235;
      letters.forEach(([h, loop, adv], i) => {
        const rise = 0.03 + i * 0.012;
        for (let k = 0; k < 18; k++) { const th = (k / 18) * Math.PI * 2, up = (1 - Math.cos(th)) / 2; run.push(at(u0 + adv * (k / 18) - loop * Math.sin(th) + 0.085 * h * up, rise + h * up)); }
        u0 += adv;
      });
      run.push(at(u0 + 0.035, 0.2), at(u0 + 0.09, 0.27));
      paths.push(run);
      const under: number[][] = [];
      for (let k = 0; k <= 24; k++) { const t = k / 24, a = at(0.17, -0.07), c = at(0.6, -0.3), b = at(0.99, 0.04); under.push([0, 1].map((d) => (1 - t) * (1 - t) * a[d] + 2 * t * (1 - t) * c[d] + t * t * b[d])); }
      paths.push(under);
      plan = []; let t = 0.3;
      const speed = [620, 1000, 1300];
      paths.forEach((path, n) => {
        let w = 0;
        path.forEach((p, i) => {
          const prev = path[Math.max(0, i - 1)], next = path[Math.min(path.length - 1, i + 1)];
          if (i) t += Math.hypot(p[0] - prev[0], p[1] - prev[1]) / (speed[n] * S);
          const want = nib(Math.atan2(next[1] - prev[1], next[0] - prev[0]));
          w = i ? w + (want - w) * 0.45 : want * 0.7;
          plan.push({ at: t, x: p[0], y: p[1], w, start: i === 0 });
        });
        t += 0.13;
      });
      planEnd = t; planAt = 0;
    };

    const segment = (c: CanvasRenderingContext2D, a: Pt, b: Pt, k: number) => {
      const w = (a.w + b.w) / 2;
      // Ink pools where the nib is broad, so dry strokes keep some of their depth there.
      c.strokeStyle = mix(Math.max(k, Math.min(0.42, (w / (S * 4.7)) * 0.42))); c.lineWidth = w * (0.84 + 0.2 * k); c.lineCap = "round";
      c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
    };
    const wetness = (t: number) => (reduce ? 0 : Math.max(0, Math.min(1, 1 - (clock - t) / DRY_SECONDS)));
    const scriptFont = (size: number) => `${size}px ${SCRIPT}`;
    const bakeAll = () => {
      dc.setTransform(q, 0, 0, q, 0, 0);
      for (const s of strokes) { for (let i = Math.max(1, s.baked); i < s.pts.length; i++) segment(dc, s.pts[i - 1], s.pts[i], 0); s.baked = s.pts.length; }
      if (typed && !typed.done) { dc.font = scriptFont(typed.size); dc.fillStyle = mix(0); dc.textBaseline = "alphabetic"; for (const ch of typed.chars) dc.fillText(ch.ch, ch.x, rule - 9 * S); typed.done = true; }
    };

    const drawPen = (c: CanvasRenderingContext2D) => {
      const k = PEN, lift = pen.z * 13 * S;
      // Near the top edge the pen tips towards the viewer, which shortens it.
      const sq = Math.max(0.5, Math.min(1, (pen.y - lift - 8) / Math.max(1, 262 * k * Math.abs(Math.sin(pen.a)))));
      // Shadow first: it meets the nib when the pen touches the paper and slides away as the pen lifts.
      c.save();
      c.setTransform(q, 0, 0, q, -6000, 0); c.translate(pen.x + lift * 0.9, pen.y + lift * 1.5); c.rotate(pen.a + 0.2 - pen.lie * 0.15 + pen.z * 0.05); c.scale(k * sq, k);
      c.shadowColor = `rgba(20,14,4,${0.42 - pen.z * 0.14})`; c.shadowOffsetX = 6000; c.shadowBlur = (5 + pen.z * 10) * q;
      c.beginPath(); c.moveTo(0, 0); c.lineTo(30, -6); c.lineTo(92, -10); c.lineTo(250, -9.5); c.lineTo(262, -4); c.lineTo(262, 4); c.lineTo(250, 9.5); c.lineTo(92, 10); c.lineTo(30, 6); c.closePath();
      c.fillStyle = "#000"; c.fill(); c.restore();
      c.save(); c.translate(pen.x, pen.y - lift); c.rotate(pen.a); c.scale(k * sq, k);
      const part = (x0: number, x1: number, h0: number, h1: number, stops: (string | number)[][]) => {
        const g = c.createLinearGradient(0, -Math.max(h0, h1), 0, Math.max(h0, h1));
        for (const [p, col] of stops) g.addColorStop(p as number, col as string);
        c.beginPath(); c.moveTo(x0, -h0); c.lineTo(x1, -h1); c.lineTo(x1, h1); c.lineTo(x0, h0); c.closePath(); c.fillStyle = g; c.fill();
      };
      const resin = [[0, "#000"], [0.13, "#17171b"], [0.22, "#6f717b"], [0.255, "#e9ebf2"], [0.29, "#5b5d66"], [0.38, "#15151a"], [0.62, "#050506"], [0.84, "#0c0c0f"], [0.93, "#3d3f47"], [1, "#000"]];
      const gold = [[0, "#5d3f0c"], [0.16, "#c89a38"], [0.26, "#fff8d8"], [0.36, "#e6bd58"], [0.62, "#94701f"], [0.84, "#d1a646"], [1, "#573b0b"]];
      // Nib: two tines, a slit and a breather hole.
      const ng = c.createLinearGradient(0, -7, 0, 7);
      for (const [p, col] of gold) ng.addColorStop(p as number, col as string);
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(15, -1.2, 26, -6.8); c.lineTo(38, -5.4); c.lineTo(38, 5.4); c.lineTo(26, 6.8); c.quadraticCurveTo(15, 1.2, 0, 0); c.closePath(); c.fillStyle = ng; c.fill();
      c.strokeStyle = "rgba(60,36,4,0.85)"; c.lineWidth = 0.6; c.beginPath(); c.moveTo(1, 0); c.lineTo(22, 0); c.stroke();
      c.beginPath(); c.arc(23, 0, 1.4, 0, Math.PI * 2); c.fillStyle = "#2a1803"; c.fill();
      c.strokeStyle = "rgba(90,58,10,0.5)"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(27, -4.6); c.lineTo(36, -3.8); c.moveTo(27, 4.6); c.lineTo(36, 3.8); c.stroke();
      c.beginPath(); c.arc(0.8, 0, 1.1, 0, Math.PI * 2); c.fillStyle = "#dfe3ea"; c.fill();
      part(35, 84, 5.7, 8.5, resin);
      part(84, 88.5, 9.1, 9.1, gold);
      part(88.5, 100, 8.5, 9, resin);
      c.strokeStyle = "rgba(255,255,255,0.09)"; c.lineWidth = 0.5; for (let x = 90; x < 100; x += 1.7) { c.beginPath(); c.moveTo(x, -8.4); c.lineTo(x, 8.4); c.stroke(); }
      part(100, 238, 9.7, 9.9, resin);
      part(238, 242.5, 10.2, 10.2, gold);
      part(242.5, 256, 9.6, 7.8, resin);
      const end = c.createLinearGradient(0, -7.8, 0, 7.8); for (const [p, col] of resin) end.addColorStop(p as number, col as string);
      c.beginPath(); c.ellipse(256, 0, 4, 7.8, 0, -Math.PI / 2, Math.PI / 2); c.fillStyle = end; c.fill();
      // A soft second reflection along the barrel, as a window would leave.
      const win = c.createLinearGradient(100, 0, 238, 0); win.addColorStop(0, "rgba(255,255,255,0)"); win.addColorStop(0.2, "rgba(255,255,255,0.2)"); win.addColorStop(0.7, "rgba(255,255,255,0.08)"); win.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = win; c.fillRect(100, -6.6, 138, 1.6);
      c.restore();
    };

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(paper, 0, 0);
      ctx.save(); ctx.globalAlpha = fade; ctx.globalCompositeOperation = "multiply"; ctx.drawImage(dry, 0, 0); ctx.restore();
      ctx.setTransform(q, 0, 0, q, 0, 0);
      ctx.save(); ctx.globalAlpha = fade;
      ctx.beginPath(); ctx.rect(P.x, P.y, P.w, P.h); ctx.clip();
      const gloss: [Pt, Pt, number][] = [];
      for (const s of strokes) {
        while (s.baked < s.pts.length - 1 && wetness(s.pts[s.baked + 1].t) <= 0) { dc.setTransform(q, 0, 0, q, 0, 0); if (s.baked + 1 < s.pts.length) segment(dc, s.pts[s.baked], s.pts[s.baked + 1], 0); s.baked++; }
        for (let i = s.baked + 1; i < s.pts.length; i++) { const k = wetness(s.pts[i].t); segment(ctx, s.pts[i - 1], s.pts[i], k); if (k > 0.04) gloss.push([s.pts[i - 1], s.pts[i], k]); }
        if (s.pts.length === 1) { const p = s.pts[0]; ctx.beginPath(); ctx.arc(p.x, p.y, p.w * 0.6, 0, Math.PI * 2); ctx.fillStyle = mix(wetness(p.t)); ctx.fill(); }
      }
      // Wet ink stands proud of the paper, so it carries a thin line of light along its upper edge.
      for (const [a, b, k] of gloss) {
        const w = (a.w + b.w) / 2; if (w < 1.3 * S) continue;
        ctx.strokeStyle = `rgba(206,224,255,${0.8 * k * k})`; ctx.lineWidth = Math.max(0.5, w * 0.2); ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(a.x - w * 0.17, a.y - w * 0.22); ctx.lineTo(b.x - w * 0.17, b.y - w * 0.22); ctx.stroke();
      }
      if (typed && !typed.done) {
        ctx.font = scriptFont(typed.size); ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
        let all = true;
        for (const ch of typed.chars) { if (ch.t > clock) { all = false; continue; } const k = wetness(ch.t); if (k > 0) all = false; ctx.fillStyle = mix(k); ctx.fillText(ch.ch, ch.x, rule - 9 * S); }
        if (all) bakeAll();
      }
      ctx.restore();
      drawPen(ctx);
    };

    const layout = () => {
      const box = cv.getBoundingClientRect();
      const wide = box.width >= 560;
      W = wide ? 720 : 400; H = wide ? 470 : 424; S = wide ? 1 : 0.8; PEN = wide ? 1.16 : 0.9;
      cv.style.aspectRatio = `${W} / ${H}`;
      for (const c of [cv, dry, paper]) { c.width = W * q; c.height = H * q; }
      P = wide ? { x: 60, y: 46, w: 600, h: 366 } : { x: 14, y: 40, w: 372, h: 344 };
      rule = P.y + P.h - (wide ? 84 : 76);
      B = wide ? { x: P.x + 52, y: rule - 132, w: 330, h: 132 } : { x: P.x + 36, y: rule - 118, w: P.w - 72, h: 118 };
      park = wide ? { x: B.x + B.w + 14, y: rule - 30 } : { x: B.x + B.w - 26, y: rule - 44 };
      strokes = []; typed = null; printPaper(); buildDemo();
      pen.x = pen.tx = park.x; pen.y = pen.ty = park.y; pen.z = pen.tz = reduce ? 0 : 1;
      if (demo && reduce) { let cur: Pt[] = []; for (const p of plan) { if (p.start) { cur = []; strokes.push({ pts: cur, baked: 0 }); } cur.push({ x: p.x, y: p.y, w: p.w, t: -99 }); } bakeAll(); }
      demoT = 0; fade = 1;
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.04, (now - last) / 1000 || 0.016); last = now; clock += dt;
      let busy = pen.down || now - lastMove < 2500;
      if (demo && !reduce) {
        busy = true; demoT += dt;
        while (planAt < plan.length && plan[planAt].at <= demoT) {
          const p = plan[planAt++];
          if (p.start) strokes.push({ pts: [], baked: 0 });
          strokes[strokes.length - 1].pts.push({ x: p.x, y: p.y, w: p.w, t: clock });
        }
        if (planAt < plan.length) {
          const next = plan[planAt], prev = plan[Math.max(0, planAt - 1)];
          const span = Math.max(0.001, next.at - prev.at), f = planAt === 0 ? Math.max(0, 1 - (next.at - demoT) / 0.3) : Math.min(1, (demoT - prev.at) / span);
          const from = planAt === 0 ? park : prev;
          pen.tx = from.x + (next.x - from.x) * f; pen.ty = from.y + (next.y - from.y) * f; pen.tz = next.start ? Math.sin(f * Math.PI) * 0.5 + (planAt === 0 ? 1 - f : 0) : 0;
          pen.x = pen.tx; pen.y = pen.ty; pen.z += (pen.tz - pen.z) * Math.min(1, dt * 30); pen.parked = false;
        } else {
          const rest = demoT - planEnd;
          pen.tx = park.x; pen.ty = park.y; pen.tz = rest < 0.7 ? 1 : 0.0;
          if (rest > 4.4) fade = Math.max(0, fade - dt * 2.2);
          if (rest > 5.1) { strokes = []; dc.setTransform(1, 0, 0, 1, 0, 0); dc.clearRect(0, 0, dry.width, dry.height); fade = 1; demoT = 0; planAt = 0; }
        }
      }
      if (typed && !typed.done) {
        busy = true;
        const due = typed.chars.filter((ch) => ch.t <= clock), head = due[due.length - 1];
        if (head && due.length < typed.chars.length) { pen.tx = head.x + typed.size * 0.5; pen.ty = rule - 9 * S - typed.size * (0.18 + 0.12 * Math.sin(clock * 34)); pen.tz = 0; pen.parked = false; }
        else if (due.length === typed.chars.length) { pen.tx = park.x; pen.ty = park.y; pen.tz = clock - (head ? head.t : 0) < 0.6 ? 1 : 0; }
      }
      if (!pen.down && !demo && (!typed || typed.done) && now - lastMove > 1500) { pen.tx = park.x; pen.ty = park.y; pen.tz = now - lastMove > 2100 ? 0 : 1; }
      if (!(demo && planAt < plan.length && !reduce)) {
        const pull = pen.down ? 1 : Math.min(1, dt * 9);
        pen.x += (pen.tx - pen.x) * pull; pen.y += (pen.ty - pen.y) * pull; pen.z += (pen.tz - pen.z) * Math.min(1, dt * 12);
      }
      pen.ta = -0.92 + Math.max(-0.2, Math.min(0.2, (pen.tx - pen.x) * 0.004));
      // Near the right edge the hand turns the pen upright so it never leaves the frame.
      const reach = 262 * PEN, room = W - 12 - pen.x;
      if (Math.cos(pen.ta) * reach > room) pen.ta = -Math.acos(Math.max(-0.4, room / reach));
      pen.a += (pen.ta - pen.a) * Math.min(1, dt * 8);
      if (Math.cos(pen.a) * reach > room) pen.a = -Math.acos(Math.max(-0.4, room / reach));
      // Once it is back beside the date and nobody holds it, the pen is laid flat and its shadow closes up.
      const resting = !pen.down && pen.tz === 0 && Math.hypot(pen.x - park.x, pen.y - park.y) < 3 ? 1 : 0;
      pen.lie += (resting - pen.lie) * Math.min(1, dt * 5); if (Math.abs(resting - pen.lie) > 0.01) busy = true;
      if (Math.abs(pen.x - pen.tx) + Math.abs(pen.y - pen.ty) + Math.abs(pen.z - pen.tz) * 10 + Math.abs(pen.a - pen.ta) * 40 > 0.4) busy = true;
      if (strokes.some((s) => s.baked < s.pts.length - 1)) busy = true;
      draw();
      if (busy && seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const still = () => { pen.x = pen.tx = park.x; pen.y = pen.ty = park.y; pen.z = pen.tz = 0; pen.lie = 1; const room = W - 12 - pen.x; pen.a = pen.ta = Math.cos(-0.92) * 262 * PEN > room ? -Math.acos(Math.max(-0.4, room / (262 * PEN))) : -0.92; draw(); };
    const wipe = () => { strokes = []; typed = null; fade = 1; dc.setTransform(1, 0, 0, 1, 0, 0); dc.clearRect(0, 0, dry.width, dry.height); };
    const takeOver = () => { if (demo) { demo = false; wipe(); } };

    const at = (e: PointerEvent) => { const b = cv.getBoundingClientRect(); return { x: ((e.clientX - b.left) * W) / b.width, y: ((e.clientY - b.top) * H) / b.height }; };
    const inside = (p: { x: number; y: number }) => p.x > P.x + 4 && p.x < P.x + P.w - 4 && p.y > P.y + 4 && p.y < P.y + P.h - 4;
    let lastPt: Pt | null = null;
    const onDown = (e: PointerEvent) => {
      const p = at(e); if (!inside(p)) return;
      e.preventDefault(); cv.setPointerCapture(e.pointerId);
      takeOver(); if (typed) wipe();
      userInk = true; pen.down = true; pen.parked = false; pen.x = pen.tx = p.x; pen.y = pen.ty = p.y; pen.z = pen.tz = 0;
      lastPt = { x: p.x, y: p.y, w: S * 2.6, t: clock }; strokes.push({ pts: [lastPt], baked: 0 });
      lastMove = performance.now(); setState("inked"); if (reduce) draw(); else wake();
    };
    const onMove = (e: PointerEvent) => {
      const p = at(e);
      if (!pen.down) { if (e.pointerType === "mouse" && inside(p) && !reduce && !demo && (!typed || typed.done)) { lastMove = performance.now(); pen.tx = p.x; pen.ty = p.y; pen.tz = 0.8; wake(); } return; }
      lastMove = performance.now();
      const events = typeof e.getCoalescedEvents === "function" ? e.getCoalescedEvents() : [];
      for (const ev of events.length ? events : [e]) {
        const n = at(ev); if (!lastPt) break;
        const d = Math.hypot(n.x - lastPt.x, n.y - lastPt.y); if (d < 1.6 * S) continue;
        // A broad nib: thick on the pull, thin across it, and a little leaner when the hand moves fast.
        const want = nib(Math.atan2(n.y - lastPt.y, n.x - lastPt.x)) * Math.max(0.62, 1.15 - d * 0.02);
        lastPt = { x: Math.max(P.x, Math.min(P.x + P.w, n.x)), y: Math.max(P.y, Math.min(P.y + P.h, n.y)), w: lastPt.w + (want - lastPt.w) * 0.35, t: clock };
        strokes[strokes.length - 1].pts.push(lastPt);
      }
      pen.x = pen.tx = lastPt ? lastPt.x : p.x; pen.y = pen.ty = lastPt ? lastPt.y : p.y;
      if (reduce) { bakeAll(); draw(); } else wake();
    };
    const onUp = () => { if (!pen.down) return; pen.down = false; pen.tz = 1; lastPt = null; lastMove = performance.now(); if (reduce) { bakeAll(); still(); } };
    cv.addEventListener("pointerdown", onDown); cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerup", onUp); cv.addEventListener("pointercancel", onUp);

    api.current = {
      clear: () => { demo = false; wipe(); userInk = false; lastMove = performance.now() - 2200; if (reduce) still(); else wake(); },
      write: (text) => {
        demo = false; wipe(); userInk = false;
        const value = text.trim(); if (!value) { if (reduce) still(); else wake(); return; }
        let size = Math.min(B.h * 0.5, 58 * S);
        ctx.setTransform(q, 0, 0, q, 0, 0); ctx.font = scriptFont(size);
        const full = ctx.measureText(value).width; if (full > B.w - 24 * S) { size *= (B.w - 24 * S) / full; ctx.font = scriptFont(size); }
        let x = B.x + 22 * S; const chars = [...value].map((ch, i) => { const c = { ch, x, t: clock + 0.25 + i * 0.07 }; x += ctx.measureText(ch).width; return c; });
        typed = { chars, size, done: false };
        if (reduce) { bakeAll(); still(); } else wake();
      },
      png: () => {
        bakeAll();
        const out = document.createElement("canvas"); out.width = (B.w + 40 * S) * q; out.height = (B.h + 50 * S) * q;
        out.getContext("2d")?.drawImage(dry, -(B.x - 20 * S) * q, -(B.y - 10 * S) * q);
        return out.toDataURL("image/png");
      },
    };

    layout();
    if (reduce) still(); else wake();
    let width = cv.getBoundingClientRect().width;
    const ro = new ResizeObserver(() => { const w = cv.getBoundingClientRect().width; if ((w >= 560) === (width >= 560)) { width = w; return; } width = w; if (userInk) return; layout(); if (reduce) still(); else wake(); });
    ro.observe(cv);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen && !reduce) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden && !reduce) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); api.current = null; ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis);
      cv.removeEventListener("pointerdown", onDown); cv.removeEventListener("pointermove", onMove); cv.removeEventListener("pointerup", onUp); cv.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const onType = (value: string) => { setName(value); setState(value.trim() ? "inked" : "empty"); api.current?.write(value); };
  const onClear = () => { setName(""); setState("empty"); api.current?.clear(); };
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (state !== "inked") return;
    if (hidden.current && api.current) hidden.current.value = api.current.png(); // the signature as a PNG, ready to post
    setState("signed");
  };
  const note = state === "signed" ? "Signature saved with the agreement" : state === "inked" ? "Ink dries in a moment. Clear it to try again" : state === "empty" ? "Sign above the line with a mouse, a finger or a stylus" : "Draw on the paper, or type your name below";

  return (
    <form onSubmit={onSubmit} className="flex min-h-[640px] w-full flex-col items-center justify-center bg-[#151b2b] bg-[radial-gradient(110%_80%_at_50%_30%,#232c44_0%,#151b2b_66%)] px-4 py-10 sm:min-h-[760px]">
      <canvas ref={canvas} role="img" aria-label={`Signature area for ${sheet.signer}. Draw a signature here or use the name field below.`} className="w-full max-w-[720px] cursor-crosshair touch-none select-none" />
      <input ref={hidden} type="hidden" name="signature" />
      <div className="mt-2 flex w-full max-w-[600px] flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor="signature-pad-typed-name" className="block font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">Or type your name and the pen writes it</label>
          <input id="signature-pad-typed-name" type="text" autoComplete="name" value={name} maxLength={28} onChange={(e) => onType(e.target.value)} placeholder={sheet.signer} className="mt-2 h-11 w-full rounded-md border border-white/15 bg-white/5 px-3 text-[15px] text-slate-100 outline-none placeholder:text-slate-500 focus-visible:border-[#e6bd58] focus-visible:ring-2 focus-visible:ring-[#e6bd58]/60" />
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={onClear} className="h-11 flex-1 rounded-md border border-white/15 px-4 text-sm font-medium text-slate-200 outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-[#e6bd58] motion-reduce:transition-none sm:flex-none">Clear</button>
          <button type="submit" disabled={state !== "inked"} className="h-11 flex-1 rounded-md bg-[#e6bd58] px-4 text-sm font-semibold text-[#1b1608] outline-none transition-colors hover:bg-[#f1cd72] focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-400 motion-reduce:transition-none sm:flex-none">Accept signature</button>
        </div>
      </div>
      <p aria-live="polite" className="mt-5 min-h-[18px] text-center font-mono text-[11px] uppercase tracking-[0.16em] text-slate-400">{note}</p>
    </form>
  );
}
