import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

// One roll per plan. `paper` is the colour of the roll, `serial` the number on the first ticket.
const plans = [
  { name: "Pocket", price: 8, paper: "#f5cf55", serial: 417, lines: ["1 newsletter", "500 readers", "Weekly sends"] },
  { name: "Press", price: 19, paper: "#f6f0e2", serial: 1062, lines: ["3 newsletters", "5,000 readers", "Paid issues"] },
  { name: "Bureau", price: 49, paper: "#a5cdea", serial: 238, lines: ["10 newsletters", "25,000 readers", "5 editor seats"] },
];
const PRODUCT = "Lantern"; // the made-up newsletter tool printed on every ticket
const FIRST = 1; // the plan torn off when the page opens
const INK = "#1b2130", RED = "#c5301f"; // print colours
const ENAMEL = ["#ee5a41", "#d23c28", "#a42616"]; // the dispenser, top to bottom

const layoutFor = (narrow: boolean) =>
  narrow
    ? { W: 380, H: 500, u: 0.76, box: { x: 6, y: 16, w: 368, h: 104 }, slots: [66, 190, 314], ledge: { x: 0, w: 380, y: 446 } }
    : { W: 760, H: 640, u: 1, box: { x: 96, y: 26, w: 568, h: 136 }, slots: [208, 380, 552], ledge: { x: 96, w: 568, y: 580 } };

type Loose = { img: HTMLCanvasElement; x: number; y: number; rot: number; vx: number; vy: number; vr: number; lean: number; state: 0 | 1 | 2; alpha: number; bounced: boolean };

export default function TicketRollDispenserPricing() {
  const stage = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const radios = useRef<(HTMLButtonElement | null)[]>([]);
  const [narrow, setNarrow] = useState(false);
  const [plan, setPlan] = useState(FIRST);
  const api = useRef<{ tear: (i: number, fromUser: boolean) => void } | null>(null);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setNarrow(el.clientWidth < 700));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const cv = canvas.current, box = host.current;
    if (!cv || !box) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const L = layoutFor(narrow), u = L.u, TW = 136 * u, TH = 204 * u, B = L.box, SLOT = B.y + B.h - 17 * u;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let k = 1;
    const base = document.createElement("canvas");
    const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    };
    const chrome = (c: CanvasRenderingContext2D, y0: number, y1: number) => {
      const g = c.createLinearGradient(0, y0, 0, y1);
      g.addColorStop(0, "#ffffff"); g.addColorStop(0.3, "#aeb4bc"); g.addColorStop(0.5, "#eef0f3"); g.addColorStop(0.56, "#5f656d"); g.addColorStop(0.85, "#a3a9b1"); g.addColorStop(1, "#d9dce0");
      return g;
    };

    // Paper fibre: a small tile of light and dark specks, laid over every ticket.
    const fibre = document.createElement("canvas"); fibre.width = 96; fibre.height = 96;
    const fx = fibre.getContext("2d");
    if (fx) {
      let seed = 5;
      const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let i = 0; i < 2600; i++) { const v = rand(); fx.fillStyle = v > 0.5 ? `rgba(255,255,255,${(v - 0.5) * 0.5})` : `rgba(40,25,5,${(0.5 - v) * 0.3})`; fx.fillRect(rand() * 96, rand() * 96, 1 + rand() * 1.6, 1); }
    }

    // Print one ticket onto its own small canvas, perforations and all.
    const M = 3;
    const print = (i: number, serial: number) => {
      const p = plans[i], c = document.createElement("canvas");
      c.width = Math.ceil((TW + M * 2) * k); c.height = Math.ceil((TH + M * 2) * k);
      const g = c.getContext("2d");
      if (!g) return c;
      g.setTransform(k, 0, 0, k, M * k, M * k);
      const pitch = TW / 20, bite = pitch * 0.27;
      g.beginPath(); g.moveTo(0, 0);
      for (let n = 0; n < 20; n++) { g.lineTo(n * pitch + pitch / 2 - bite, 0); g.arc(n * pitch + pitch / 2, 0, bite, Math.PI, 0, true); }
      g.lineTo(TW, 0); g.lineTo(TW, TH);
      for (let n = 19; n >= 0; n--) { g.lineTo(n * pitch + pitch / 2 + bite, TH); g.arc(n * pitch + pitch / 2, TH, bite, 0, Math.PI, true); }
      g.lineTo(0, TH); g.closePath();
      g.fillStyle = p.paper; g.fill();
      g.save(); g.clip();
      // The paper remembers the roll: soft bands of light and shade across it.
      const curl = g.createLinearGradient(0, 0, 0, TH);
      curl.addColorStop(0, "rgba(0,0,0,0.13)"); curl.addColorStop(0.07, "rgba(255,255,255,0.2)"); curl.addColorStop(0.3, "rgba(255,255,255,0)"); curl.addColorStop(0.62, "rgba(60,35,5,0.07)"); curl.addColorStop(0.84, "rgba(255,255,255,0.16)"); curl.addColorStop(1, "rgba(60,35,5,0.12)");
      g.fillStyle = curl; g.fillRect(0, 0, TW, TH);
      const pat = g.createPattern(fibre, "repeat");
      if (pat) { g.globalAlpha = 0.5; g.fillStyle = pat; g.fillRect(0, 0, TW, TH); g.globalAlpha = 1; }
      g.restore();
      // Letterpress.
      g.globalAlpha = 0.9; g.strokeStyle = INK; g.fillStyle = INK; g.textBaseline = "middle";
      rr(g, 7 * u, 9 * u, TW - 14 * u, TH - 18 * u, 5 * u); g.lineWidth = 1.5 * u; g.stroke();
      rr(g, 10.5 * u, 12.5 * u, TW - 21 * u, TH - 25 * u, 3 * u); g.lineWidth = 0.5; g.stroke();
      const mono = (size: number, weight = 600) => `${weight} ${size * u}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      const sans = (size: number) => `800 ${size * u}px ui-sans-serif, system-ui, "Helvetica Neue", Arial, sans-serif`;
      g.textAlign = "right"; g.font = mono(7.5); g.fillText(PRODUCT.toUpperCase(), TW - 17 * u, 25 * u);
      g.textAlign = "center"; g.font = sans(22); g.fillText(p.name.toUpperCase(), TW / 2, 51 * u);
      g.lineWidth = 1 * u; g.beginPath(); g.moveTo(18 * u, 68 * u); g.lineTo(TW - 18 * u, 68 * u); g.stroke();
      g.font = sans(54); g.fillText(`$${p.price}`, TW / 2, 105 * u);
      g.font = mono(7.5); g.fillText("A MONTH", TW / 2, 137 * u);
      g.setLineDash([2 * u, 2 * u]); g.lineWidth = 0.8 * u; g.beginPath(); g.moveTo(18 * u, 149 * u); g.lineTo(TW - 18 * u, 149 * u); g.stroke(); g.setLineDash([]);
      g.font = mono(7.6, 500); p.lines.forEach((line, n) => g.fillText(line.toUpperCase(), TW / 2, (161 + n * 11.5) * u));
      // The serial is stamped separately, a hair out of register.
      g.textAlign = "left"; g.font = mono(8.5, 700); g.fillStyle = RED; g.globalAlpha = 0.92;
      g.fillText(`No ${String(serial).padStart(4, "0")}`, 17.6 * u, 25.4 * u);
      g.globalAlpha = 1;
      return c;
    };

    // The parts that never move: enamel box, chrome mouths, the labels, the ledge.
    const build = () => {
      const b = base.getContext("2d");
      if (!b) return;
      base.width = cv.width; base.height = cv.height;
      b.setTransform(k, 0, 0, k, 0, 0);
      b.save(); b.shadowColor = "rgba(70,40,10,0.4)"; b.shadowBlur = 34 * k; b.shadowOffsetY = 20 * k;
      rr(b, B.x, B.y, B.w, B.h, 20 * u); b.fillStyle = ENAMEL[1]; b.fill(); b.restore();
      b.save(); b.shadowColor = "rgba(50,25,5,0.5)"; b.shadowBlur = 5 * k; b.shadowOffsetY = 3 * k;
      rr(b, B.x, B.y, B.w, B.h, 20 * u); b.fillStyle = ENAMEL[1]; b.fill(); b.restore();
      rr(b, B.x, B.y + 9 * u, B.w, B.h, 20 * u); b.fillStyle = "#7c1a0d"; b.fill();
      const body = b.createLinearGradient(0, B.y, 0, B.y + B.h);
      body.addColorStop(0, ENAMEL[0]); body.addColorStop(0.5, ENAMEL[1]); body.addColorStop(1, ENAMEL[2]);
      rr(b, B.x, B.y, B.w, B.h, 20 * u); b.fillStyle = body; b.fill();
      b.save(); b.clip();
      // The window of the room, reflected in the enamel.
      const gl = b.createLinearGradient(0, B.y, 0, B.y + B.h * 0.5);
      gl.addColorStop(0, "rgba(255,255,255,0.34)"); gl.addColorStop(1, "rgba(255,255,255,0.03)");
      b.beginPath(); b.moveTo(B.x, B.y); b.lineTo(B.x + B.w, B.y); b.lineTo(B.x + B.w, B.y + B.h * 0.2); b.quadraticCurveTo(B.x + B.w / 2, B.y + B.h * 0.5, B.x, B.y + B.h * 0.3); b.closePath(); b.fillStyle = gl; b.fill();
      const low = b.createLinearGradient(0, B.y + B.h * 0.8, 0, B.y + B.h);
      low.addColorStop(0, "rgba(255,180,150,0)"); low.addColorStop(1, "rgba(255,190,160,0.22)"); b.fillStyle = low; b.fillRect(B.x, B.y + B.h * 0.8, B.w, B.h * 0.2);
      b.restore();
      const edge = b.createLinearGradient(0, B.y, 0, B.y + B.h);
      edge.addColorStop(0, "rgba(255,255,255,0.85)"); edge.addColorStop(0.12, "rgba(255,255,255,0.1)"); edge.addColorStop(0.9, "rgba(60,10,0,0.3)"); edge.addColorStop(1, "rgba(60,10,0,0.7)");
      rr(b, B.x + 0.7, B.y + 0.7, B.w - 1.4, B.h - 1.4, 19.4 * u); b.lineWidth = 1.4; b.strokeStyle = edge; b.stroke();
      // Chrome screws.
      for (const [sx, sy, turn] of [[B.x + 17 * u, B.y + 17 * u, 0.5], [B.x + B.w - 17 * u, B.y + 17 * u, 2.1]]) {
        b.beginPath(); b.arc(sx, sy + 1, 5.4 * u, 0, Math.PI * 2); b.fillStyle = "rgba(60,10,0,0.55)"; b.fill();
        b.beginPath(); b.arc(sx, sy, 4.8 * u, 0, Math.PI * 2); b.fillStyle = chrome(b, sy - 5 * u, sy + 5 * u); b.fill();
        b.beginPath(); b.moveTo(sx - Math.cos(turn) * 4 * u, sy - Math.sin(turn) * 4 * u); b.lineTo(sx + Math.cos(turn) * 4 * u, sy + Math.sin(turn) * 4 * u); b.lineWidth = 1.2 * u; b.strokeStyle = "rgba(20,22,26,0.85)"; b.stroke();
      }
      // Maker's plate.
      const pw = 168 * u, ph = 24 * u, px = L.W / 2 - pw / 2, py = B.y + 15 * u;
      b.save(); b.shadowColor = "rgba(60,10,0,0.6)"; b.shadowBlur = 3 * k; b.shadowOffsetY = 1.5 * k; rr(b, px, py, pw, ph, 4 * u); b.fillStyle = chrome(b, py, py + ph); b.fill(); b.restore();
      rr(b, px + 2, py + 2, pw - 4, ph - 4, 2.5 * u); const cream = b.createLinearGradient(0, py, 0, py + ph); cream.addColorStop(0, "#fbf5e6"); cream.addColorStop(1, "#e4d8bd"); b.fillStyle = cream; b.fill();
      b.font = `700 ${8.5 * u}px ui-monospace, SFMono-Regular, Menlo, monospace`; b.textAlign = "center"; b.textBaseline = "middle"; b.fillStyle = INK;
      b.fillText(narrow ? "TAKE ONE TICKET" : `${PRODUCT.toUpperCase()}  /  TAKE ONE TICKET`, L.W / 2, py + ph / 2 + 0.5);
      // Three mouths, each with its plan painted above it.
      L.slots.forEach((cx, i) => {
        b.font = `800 ${11.5 * u}px ui-sans-serif, system-ui, "Helvetica Neue", Arial, sans-serif`;
        b.fillStyle = "rgba(90,15,5,0.6)"; b.fillText(plans[i].name.toUpperCase(), cx, SLOT - 29 * u + 1);
        b.fillStyle = "#fff4e2"; b.fillText(plans[i].name.toUpperCase(), cx, SLOT - 29 * u);
        const mw = TW + 30 * u, mh = 25 * u, mx = cx - mw / 2, my = SLOT - 15 * u;
        b.save(); b.shadowColor = "rgba(60,10,0,0.55)"; b.shadowBlur = 4 * k; b.shadowOffsetY = 2 * k; rr(b, mx, my, mw, mh, 8 * u); b.fillStyle = chrome(b, my, my + mh); b.fill(); b.restore();
        rr(b, mx + 0.5, my + 0.5, mw - 1, mh - 1, 7.6 * u); b.lineWidth = 0.7; b.strokeStyle = "rgba(255,255,255,0.8)"; b.stroke();
        const hole = b.createLinearGradient(0, my + 5 * u, 0, my + mh - 5 * u); hole.addColorStop(0, "#000"); hole.addColorStop(1, "#33363b");
        rr(b, mx + 6 * u, my + 5 * u, mw - 12 * u, mh - 10 * u, 3.5 * u); b.fillStyle = hole; b.fill();
      });
      // The oak ledge under the rolls.
      const G = L.ledge, lh = 17 * u;
      b.save(); b.shadowColor = "rgba(70,40,10,0.38)"; b.shadowBlur = 16 * k; b.shadowOffsetY = 12 * k; rr(b, G.x, G.y, G.w, lh, 2); b.fillStyle = "#b9925d"; b.fill(); b.restore();
      const oak = b.createLinearGradient(0, G.y, 0, G.y + lh); oak.addColorStop(0, "#f3e0bb"); oak.addColorStop(0.3, "#e6cc9c"); oak.addColorStop(0.34, "#c9a56e"); oak.addColorStop(1, "#9c7443");
      rr(b, G.x, G.y, G.w, lh, 2); b.fillStyle = oak; b.fill();
      b.save(); b.clip(); let seed = 9; const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let i = 0; i < 26; i++) { const y = G.y + rand() * lh, x0 = G.x + rand() * G.w * 0.5; b.beginPath(); b.moveTo(x0, y); b.lineTo(x0 + 60 + rand() * G.w * 0.5, y + (rand() - 0.5) * 1.5); b.lineWidth = 0.5; b.strokeStyle = `rgba(90,55,15,${0.1 + rand() * 0.2})`; b.stroke(); }
      b.restore();
    };

    const slots = plans.map((p, i) => ({ serial: p.serial, img: null as HTMLCanvasElement | null, feed: 1, a: 0, av: (i - 1) * 0.12 + 0.05, tear: -1, cut: false }));
    let loose: Loose[] = [];
    const REST = L.ledge.y - TH / 2 + 5 * u;

    const fit = () => {
      const w = cv.clientWidth || L.W;
      k = (w / L.W) * Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(L.W * k); cv.height = Math.round(L.H * k);
      build();
      slots.forEach((s, i) => { s.img = print(i, s.serial); });
      loose = loose.filter((t) => t.state !== 2);
    };

    const ease = (t: number) => t * t * (3 - 2 * t);
    const clock = { t: 0 };
    const step = (dt: number) => {
      clock.t += dt;
      slots.forEach((s, i) => {
        s.av += (-34 * s.a - 1.5 * s.av + Math.sin(clock.t * 1.1 + i * 2.1) * 0.05) * dt; s.a += s.av * dt;
        if (s.tear < 0) return;
        s.tear += dt;
        if (!s.cut && s.tear >= 0.42 && s.img) {
          // The last fibres give way: the ticket leaves the roll and a fresh one is printed behind it.
          const th = -0.15, px = L.slots[i] + TW / 2, py = SLOT + 8 * u;
          const lx = -TW / 2, ly = TH / 2;
          loose.push({ img: s.img, x: px + lx * Math.cos(th) - ly * Math.sin(th), y: py + lx * Math.sin(th) + ly * Math.cos(th), rot: th, vx: -24 * u, vy: 160 * u, vr: -0.9, lean: i === 1 ? -0.035 : i === 0 ? 0.045 : -0.06, state: 0, alpha: 1, bounced: false });
          s.cut = true; s.serial += 1; s.img = print(i, s.serial); s.feed = 0; s.av += 0.5;
        }
        if (s.cut) {
          const p = Math.max(0, Math.min(1, (s.tear - 0.6) / 0.62)), n = 5;
          s.feed = p >= 1 ? 1 : (Math.floor(p * n) + ease(Math.min(1, (p * n - Math.floor(p * n)) * 1.5))) / n;
          if (p >= 1) { s.tear = -1; s.cut = false; }
        }
      });
      for (const t of loose) {
        if (t.state === 0) {
          t.vy += 1700 * u * dt; t.vy *= 1 - 0.9 * dt; t.vx *= 1 - 2.4 * dt;
          t.vr += (-22 * (t.rot - t.lean) - 2.2 * t.vr) * dt;
          t.x += t.vx * dt; t.y += t.vy * dt; t.rot += t.vr * dt;
          if (t.y >= REST) { t.y = REST; if (!t.bounced && t.vy > 200 * u) { t.vy = -t.vy * 0.2; t.bounced = true; t.vr += t.lean * 8; } else { t.vy = 0; t.state = 1; } }
        } else if (t.state === 1) {
          t.vr += (-90 * (t.rot - t.lean) - 11 * t.vr) * dt; t.rot += t.vr * dt;
        } else {
          t.vy += 1500 * u * dt; t.y += t.vy * dt; t.x += t.vx * dt; t.rot += t.vr * dt; t.alpha -= dt * 2.8;
        }
      }
      loose = loose.filter((t) => t.alpha > 0);
    };

    const place = (img: HTMLCanvasElement, z: number, alpha: number) => {
      ctx.globalAlpha = alpha; ctx.shadowColor = `rgba(70,40,10,${0.5 / (1 + z * 0.06)})`; ctx.shadowBlur = (2 + z * 1.1) * k; ctx.shadowOffsetY = (1.5 + z * 0.8) * k; ctx.shadowOffsetX = z * 0.3 * k;
      ctx.drawImage(img, -TW / 2 - M, -M, TW + M * 2, TH + M * 2);
    };

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(base, 0, 0);
      ctx.setTransform(k, 0, 0, k, 0, 0);
      slots.forEach((s, i) => {
        if (!s.img) return;
        const cx = L.slots[i];
        ctx.save(); ctx.beginPath(); ctx.rect(0, SLOT, L.W, L.H); ctx.clip();
        if (s.tear >= 0 && !s.cut) {
          const pull = ease(Math.min(1, s.tear / 0.16)) * 8 * u, th = -0.15 * ease(Math.max(0, Math.min(1, (s.tear - 0.16) / 0.26)));
          ctx.translate(cx + TW / 2, SLOT + pull); ctx.rotate(th); ctx.translate(-TW / 2, 0);
          place(s.img, 6, 1);
        } else {
          ctx.translate(cx, SLOT); ctx.rotate(s.a * 0.5); ctx.translate(0, -(1 - s.feed) * TH); ctx.transform(1, 0, s.a * 0.5, 1, 0, 0);
          place(s.img, 5 + Math.abs(s.a) * 30, 1);
        }
        ctx.restore();
        // The toothed bar the paper tears against, in front of the ticket.
        const bw = TW + 16 * u, bx = cx - bw / 2, by = SLOT - 3 * u, bh = 6 * u, teeth = 26;
        ctx.save(); ctx.shadowColor = "rgba(40,20,0,0.5)"; ctx.shadowBlur = 3 * k; ctx.shadowOffsetY = 2 * k;
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + bh);
        for (let n = teeth; n > 0; n--) { ctx.lineTo(bx + ((n - 0.5) * bw) / teeth, by + bh + 3.2 * u); ctx.lineTo(bx + ((n - 1) * bw) / teeth, by + bh); }
        ctx.closePath(); ctx.fillStyle = chrome(ctx, by - 2, by + bh + 3 * u); ctx.fill(); ctx.restore();
        ctx.beginPath(); ctx.moveTo(bx, by + 0.5); ctx.lineTo(bx + bw, by + 0.5); ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.stroke();
      });
      for (const t of loose) {
        ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(t.rot); ctx.translate(0, -TH / 2);
        place(t.img, t.state === 1 ? 4 : t.state === 0 ? 4 + Math.min(14, (REST - t.y) * 0.12) : 10, Math.max(0, t.alpha));
        ctx.restore();
      }
      ctx.globalAlpha = 1; ctx.shadowColor = "transparent";
      // Front lip of the ledge, so a standing ticket sits behind it.
      const G = L.ledge;
      ctx.drawImage(base, G.x * k, (G.y + 4 * u) * k, G.w * k, 13 * u * k, G.x, G.y + 4 * u, G.w, 13 * u);
    };

    let raf = 0, last = 0, t0 = 0, seen = true, touched = -1e9, nextDemo = 450, tour = FIRST;
    const tear = (i: number, fromUser: boolean) => {
      const s = slots[i];
      if (s.tear >= 0) return;
      if (fromUser) { touched = performance.now(); nextDemo = performance.now() - t0 + 5200; }
      for (const t of loose) if (t.state !== 2) { t.state = 2; t.vy = 40; t.vr = t.lean > 0 ? 1.6 : -1.6; t.vx = t.lean > 0 ? 40 : -40; }
      s.tear = 0; s.cut = false; setPlan(i);
      if (reduce) settle(); else wake();
    };
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      if (now - touched > 7000 && now - t0 > nextDemo) { nextDemo = now - t0 + 4200; tear(tour++ % plans.length, false); }
      step(dt / 2); step(dt / 2); draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const settle = () => { for (let i = 0; i < 420; i++) step(1 / 60); slots.forEach((s) => { s.a = 0; s.av = 0; }); draw(); };
    api.current = { tear };

    fit();
    if (reduce) tear(FIRST, false); else wake();

    // Moving the pointer across the hanging tickets stirs them like a draught.
    let lastX = 0;
    const onMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * L.W, y = ((e.clientY - r.top) / r.height) * L.H, dx = x - lastX; lastX = x;
      if (reduce || Math.abs(dx) > 60 || y < SLOT || y > SLOT + TH) return;
      slots.forEach((s, i) => { if (Math.abs(x - L.slots[i]) < TW / 2) s.av += dx * 0.012; });
    };
    box.addEventListener("pointermove", onMove);
    const ro = new ResizeObserver(() => { fit(); if (reduce) draw(); });
    ro.observe(cv);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); api.current = null; box.removeEventListener("pointermove", onMove);
      ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, [narrow]);

  const L = layoutFor(narrow), u = L.u, TW = 136 * u, TH = 204 * u, SLOT = L.box.y + L.box.h - 17 * u;
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;
  const onKey = (e: ReactKeyboardEvent, i: number) => {
    const next = e.key === "ArrowRight" || e.key === "ArrowDown" ? (i + 1) % plans.length : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (i + plans.length - 1) % plans.length : -1;
    if (next < 0) return;
    e.preventDefault(); api.current?.tear(next, true); radios.current[next]?.focus();
  };

  return (
    <div ref={stage} className="flex min-h-[640px] w-full flex-col items-center justify-center bg-[#e9dfcc] bg-[radial-gradient(90%_70%_at_42%_30%,#f7f0e1_0%,#e9dfcc_55%,#d9cdb6_100%)] px-3 py-10 sm:min-h-[860px] sm:px-6">
      <div ref={host} className="relative w-full" style={{ maxWidth: narrow ? L.W : L.W * 1.12, aspectRatio: `${L.W} / ${L.H}` }}>
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <div role="radiogroup" aria-label={`${PRODUCT} plan`}>
          {plans.map((p, i) => (
            <button
              key={p.name}
              ref={(el) => { radios.current[i] = el; }}
              type="button"
              role="radio"
              aria-checked={plan === i}
              aria-label={`${p.name}, $${p.price} a month: ${p.lines.join(", ")}`}
              tabIndex={plan === i ? 0 : -1}
              onClick={() => api.current?.tear(i, true)}
              onKeyDown={(e) => onKey(e, i)}
              style={{ left: pct(L.slots[i] - TW / 2, L.W), top: pct(SLOT - 40 * u, L.H), width: pct(TW, L.W), height: pct(TH + 40 * u, L.H) }}
              className="absolute cursor-pointer rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[#1b2130] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e9dfcc]"
            />
          ))}
        </div>
      </div>
      <p aria-live="polite" className="min-h-[40px] mt-8 max-w-[560px] text-center font-mono text-[11px] uppercase leading-5 tracking-[0.16em] text-stone-600">
        <span className="font-semibold text-stone-900">{plans[plan].name} / ${plans[plan].price} a month</span>
        <span className="mx-2 text-stone-400">/</span>
        {plans[plan].lines.join(", ")}
      </p>
    </div>
  );
}
