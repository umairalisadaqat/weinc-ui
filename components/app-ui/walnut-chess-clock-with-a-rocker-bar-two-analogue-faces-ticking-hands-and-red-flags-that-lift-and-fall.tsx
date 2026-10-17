import { useEffect, useRef, useState } from "react";

const players = ["White", "Black"]; // left clock, right clock
const CONTROLS = [1, 3, 5]; // minutes offered for each side
const START = 1; // which of CONTROLS is chosen at first
const DEMO = [8.4, 21]; // seconds left on each clock while the piece plays by itself
const FLAG = "#c9281c";
const MAKER = "HOLLIS & WREN";
const W = 720, H = 520; // drawing size in CSS pixels

type View = { t: number[]; turn: number; fallen: number };
const clockText = (s: number) => `${Math.floor(Math.ceil(s) / 60)}:${String(Math.ceil(s) % 60).padStart(2, "0")}`;

export default function WalnutChessClock() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const api = useRef<{ press: (side: number) => void; reset: (minutes?: number) => void; pause: () => void } | null>(null);
  const [view, setView] = useState<View>({ t: DEMO.map(Math.ceil), turn: 0, fallen: -1 });
  const [choice, setChoice] = useState(START);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = W * dpr; cv.height = H * dpr;
    const DIAL = [[215, 302], [505, 302]], R = 104, BEZEL = 119, HAND = R * 0.7, PIVOT = [360, 92], REACH = 146;
    // The flag hangs from a rivet just before twelve. Its length is set so the minute hand lets go of it exactly on the hour.
    const PA = (-16 * Math.PI) / 180, PX = Math.sin(PA) * R * 0.88, PY = -Math.cos(PA) * R * 0.88, LF = Math.hypot(PX, PY + HAND);
    const layer = () => { const c = document.createElement("canvas"); c.width = cv.width; c.height = cv.height; const x = c.getContext("2d"); if (x) x.scale(dpr, dpr); return [c, x] as const; };
    const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
    let seed = 5;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const brass = (c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) => { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, "#fbe7a8"); g.addColorStop(0.22, "#c79a42"); g.addColorStop(0.45, "#f3d687"); g.addColorStop(0.7, "#8f6722"); g.addColorStop(1, "#dcb962"); return g; };
    const ring = (c: CanvasRenderingContext2D, x: number, y: number, turn: number) => {
      if (typeof c.createConicGradient !== "function") return brass(c, x - BEZEL, y - BEZEL, x + BEZEL, y + BEZEL);
      const g = c.createConicGradient(turn, x, y);
      const stops: [number, string][] = [[0, "#fff1c2"], [0.07, "#d9b25a"], [0.16, "#8c6420"], [0.27, "#c79a42"], [0.36, "#f6dc92"], [0.46, "#a67c2e"], [0.55, "#6f4d15"], [0.66, "#b88b38"], [0.76, "#f1d384"], [0.86, "#a17628"], [0.94, "#e3c172"], [1, "#fff1c2"]];
      for (const [p, v] of stops) g.addColorStop(p, v);
      return g;
    };
    const grain = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, n: number) => {
      for (let i = 0; i < n; i++) {
        const y0 = y + rnd() * h, amp = 1 + rnd() * 4, ph = rnd() * 6, len = 0.003 + rnd() * 0.007, x0 = x + rnd() * w * 0.8 - 60, span = 140 + rnd() * 420;
        c.beginPath();
        for (let d = 0; d <= span; d += 8) { const yy = y0 + Math.sin(ph + (x0 + d) * len * 3) * amp; if (d === 0) c.moveTo(x0, yy); else c.lineTo(x0 + d, yy); }
        c.lineWidth = 0.5 + rnd() * 1.2; c.strokeStyle = rnd() > 0.3 ? `rgba(24,10,4,${0.07 + rnd() * 0.2})` : `rgba(226,160,100,${0.04 + rnd() * 0.1})`; c.stroke();
      }
    };

    // Everything that never moves is painted once: the case, the bezels and the printed faces.
    const [base, b] = layer();
    if (b) {
      b.save(); b.shadowColor = "rgba(60,40,20,0.42)"; b.shadowBlur = 44 * dpr; b.shadowOffsetY = 26 * dpr; rr(b, 86, 300, 548, 138, 20); b.fillStyle = "#3b2414"; b.fill(); b.restore();
      b.save(); b.shadowColor = "rgba(40,24,10,0.6)"; b.shadowBlur = 10 * dpr; b.shadowOffsetY = 5 * dpr; rr(b, 78, 380, 564, 62, 14); b.fillStyle = "#3b2414"; b.fill(); b.restore();
      for (const x of [104, 568]) { rr(b, x, 436, 48, 13, 4); b.fillStyle = "#17100b"; b.fill(); }
      // Top of the case, seen slightly from above.
      b.save(); b.beginPath(); b.moveTo(80, 126); b.lineTo(640, 126); b.lineTo(650, 152); b.lineTo(70, 152); b.closePath(); b.clip();
      const topWood = b.createLinearGradient(0, 126, 0, 152); topWood.addColorStop(0, "#8b5a34"); topWood.addColorStop(1, "#a06a3e");
      b.fillStyle = topWood; b.fillRect(70, 126, 580, 26); grain(b, 70, 126, 580, 26, 40); b.restore();
      // Front of the case.
      b.save(); rr(b, 70, 150, 580, 290, 16); b.clip();
      const wood = b.createLinearGradient(70, 150, 650, 440); wood.addColorStop(0, "#7c4a28"); wood.addColorStop(0.5, "#643a1e"); wood.addColorStop(1, "#4c2a14");
      b.fillStyle = wood; b.fillRect(70, 150, 580, 290); grain(b, 70, 150, 580, 290, 300);
      const fall = b.createLinearGradient(0, 150, 0, 440); fall.addColorStop(0, "rgba(255,220,170,0.16)"); fall.addColorStop(0.25, "rgba(255,220,170,0)"); fall.addColorStop(0.7, "rgba(0,0,0,0)"); fall.addColorStop(1, "rgba(0,0,0,0.4)");
      b.fillStyle = fall; b.fillRect(70, 150, 580, 290);
      b.restore();
      b.fillStyle = "rgba(255,228,186,0.55)"; b.fillRect(72, 151, 576, 1.2);
      rr(b, 70.5, 150.5, 579, 289, 16); b.lineWidth = 1; b.strokeStyle = "rgba(20,8,2,0.55)"; b.stroke();
      rr(b, 84, 164, 552, 262, 9); b.lineWidth = 2.2; b.strokeStyle = "rgba(20,8,2,0.4)"; b.stroke();
      rr(b, 84, 165.3, 552, 262, 9); b.lineWidth = 1; b.strokeStyle = "rgba(255,214,160,0.2)"; b.stroke();
      // The maker's plate.
      b.save(); b.shadowColor = "rgba(0,0,0,0.5)"; b.shadowBlur = 3 * dpr; b.shadowOffsetY = 1.5 * dpr; rr(b, 310, 398, 100, 20, 3); b.fillStyle = brass(b, 310, 398, 410, 418); b.fill(); b.restore();
      b.font = "700 7.5px Georgia, 'Times New Roman', serif"; b.textAlign = "center"; b.textBaseline = "middle"; b.fillStyle = "rgba(60,36,6,0.9)"; b.fillText(MAKER, 360, 408.6);
      for (const x of [316, 404]) { b.beginPath(); b.arc(x, 408, 1.5, 0, Math.PI * 2); b.fillStyle = "#6f4d15"; b.fill(); }
      // Where the post and the two pins enter the top.
      for (const x of [PIVOT[0] - REACH, PIVOT[0], PIVOT[0] + REACH]) { b.beginPath(); b.ellipse(x, 136, x === PIVOT[0] ? 15 : 10, x === PIVOT[0] ? 5.5 : 4, 0, 0, Math.PI * 2); b.fillStyle = brass(b, x - 14, 130, x + 14, 142); b.fill(); b.lineWidth = 0.8; b.strokeStyle = "rgba(40,22,4,0.7)"; b.stroke(); }

      DIAL.forEach(([cx, cy]) => {
        b.save(); b.shadowColor = "rgba(10,4,0,0.7)"; b.shadowBlur = 16 * dpr; b.shadowOffsetY = 8 * dpr; b.beginPath(); b.arc(cx, cy, BEZEL, 0, Math.PI * 2); b.fillStyle = "#3a2a12"; b.fill(); b.restore();
        b.beginPath(); b.arc(cx, cy, BEZEL, 0, Math.PI * 2); b.fillStyle = ring(b, cx, cy, -2.3); b.fill();
        b.lineWidth = 1; b.strokeStyle = "rgba(50,30,6,0.8)"; b.stroke();
        b.beginPath(); b.arc(cx, cy, BEZEL - 5, 0, Math.PI * 2); b.lineWidth = 1; b.strokeStyle = "rgba(255,244,200,0.55)"; b.stroke();
        b.beginPath(); b.arc(cx, cy, R + 5, 0, Math.PI * 2); b.fillStyle = ring(b, cx, cy, 0.9); b.fill();
        b.beginPath(); b.arc(cx, cy, R + 1.5, 0, Math.PI * 2); b.fillStyle = "#2a1c08"; b.fill();
        const face = b.createRadialGradient(cx - 20, cy - 26, 10, cx, cy, R); face.addColorStop(0, "#fbf5e4"); face.addColorStop(0.7, "#f1e8cf"); face.addColorStop(1, "#dfd3b3");
        b.beginPath(); b.arc(cx, cy, R, 0, Math.PI * 2); b.fillStyle = face; b.fill();
        b.save(); b.beginPath(); b.arc(cx, cy, R, 0, Math.PI * 2); b.clip();
        for (let i = 0; i < 1600; i++) { b.fillStyle = rnd() > 0.5 ? "rgba(120,96,50,0.05)" : "rgba(255,255,255,0.08)"; b.fillRect(cx - R + rnd() * R * 2, cy - R + rnd() * R * 2, 1, 1); }
        b.restore();
        b.beginPath(); b.arc(cx, cy, R - 6, 0, Math.PI * 2); b.lineWidth = 0.8; b.strokeStyle = "#221a12"; b.stroke();
        b.beginPath(); b.arc(cx, cy, R - 14, 0, Math.PI * 2); b.stroke();
        for (let i = 0; i < 60; i++) {
          const a = (i * Math.PI) / 30, five = i % 5 === 0, s = Math.sin(a), c = -Math.cos(a);
          b.beginPath(); b.moveTo(cx + s * (R - 14), cy + c * (R - 14)); b.lineTo(cx + s * (R - 6), cy + c * (R - 6)); b.lineWidth = five ? 2.6 : 0.8; b.strokeStyle = "#221a12"; b.stroke();
        }
        b.font = "700 19px Georgia, 'Times New Roman', serif"; b.fillStyle = "#1c1611";
        for (let n = 1; n <= 12; n++) { const a = (n * Math.PI) / 6; b.fillText(String(n), cx + Math.sin(a) * (R - 32), cy - Math.cos(a) * (R - 32) + 1); }
        b.font = "700 6.5px Georgia, 'Times New Roman', serif"; b.fillStyle = "rgba(28,22,17,0.8)"; b.fillText("TOURNAMENT", cx, cy + 57);
      });
    }
    const [glass, g] = layer();
    if (g) DIAL.forEach(([cx, cy]) => {
      g.save(); g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.clip();
      const inner = g.createRadialGradient(cx + 5, cy + 9, R - 22, cx, cy, R + 2); inner.addColorStop(0, "rgba(30,18,4,0)"); inner.addColorStop(1, "rgba(30,18,4,0.42)");
      g.fillStyle = inner; g.fillRect(cx - R, cy - R, R * 2, R * 2);
      const shine = g.createLinearGradient(cx - R, cy - R, cx + R * 0.3, cy + R * 0.5); shine.addColorStop(0, "rgba(255,255,255,0.5)"); shine.addColorStop(0.42, "rgba(255,255,255,0.06)"); shine.addColorStop(0.43, "rgba(255,255,255,0)");
      g.beginPath(); g.arc(cx, cy, R - 3, Math.PI * 0.95, Math.PI * 1.6); g.arc(cx + 34, cy + 40, R + 16, Math.PI * 1.46, Math.PI * 1.06, true); g.closePath(); g.fillStyle = shine; g.fill();
      g.beginPath(); g.arc(cx, cy, R - 7, Math.PI * 0.12, Math.PI * 0.4); g.lineWidth = 2.5; g.lineCap = "round"; g.strokeStyle = "rgba(255,255,255,0.3)"; g.stroke();
      g.restore();
    });

    const full = () => CONTROLS[minutesIndex] * 60;
    let minutesIndex = START;
    const s = { t: DEMO.slice(), turn: 0, fallen: -1, demo: true, clock: 0, wait: 0, tilt: 1, tiltV: 0, sec: [0, 0].map((_, i) => ({ a: -Math.ceil(DEMO[i]) * (Math.PI / 30), v: 0 })), flag: [{ a: 0, v: 0 }, { a: 0, v: 0 }] };
    const hits = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number, dx: number, dy: number) => { const o = (px: number, py: number, qx: number, qy: number, rx: number, ry: number) => (ry - py) * (qx - px) > (qy - py) * (rx - px); return o(ax, ay, cx, cy, dx, dy) !== o(bx, by, cx, cy, dx, dy) && o(ax, ay, bx, by, cx, cy) !== o(ax, ay, bx, by, dx, dy); };
    // How far the minute hand is holding the flag up, found by trying each angle in turn.
    const held = (left: number) => {
      if (left <= 0) return 0;
      const th = (-left / 3600) * Math.PI * 2, hx = Math.sin(th) * HAND, hy = -Math.cos(th) * HAND;
      let best = 0;
      for (let d = 0; d <= 75; d += 0.5) { const f = (d * Math.PI) / 180; if (hits(0, 0, hx, hy, PX, PY, PX + Math.sin(f) * LF, PY + Math.cos(f) * LF)) best = f + 0.012; }
      return best;
    };
    const push = () => setView((v) => { const t = s.t.map(Math.ceil); return v.t[0] === t[0] && v.t[1] === t[1] && v.turn === s.turn && v.fallen === s.fallen ? v : { t, turn: s.turn, fallen: s.fallen }; });
    const snap = () => { s.tilt = s.turn === 0 ? 1 : s.turn === 1 ? -1 : 0; s.tiltV = 0; s.sec.forEach((h, i) => { h.a = -Math.ceil(s.t[i]) * (Math.PI / 30); h.v = 0; }); s.flag.forEach((f, i) => { f.a = held(s.t[i]); f.v = 0; }); };
    const setTimes = (a: number, c: number) => { s.t = [a, c]; s.fallen = -1; s.sec.forEach((h, i) => { h.a = -Math.ceil(s.t[i]) * (Math.PI / 30); h.v = 0; }); s.flag.forEach((f, i) => { f.a = Math.max(f.a, held(s.t[i])); }); };

    const hand = (len: number, tail: number, wide: number, tip: number, angle: number, cx: number, cy: number, fill: string) => {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle);
      ctx.beginPath(); ctx.moveTo(-wide / 2, tail); ctx.lineTo(-wide / 2, -len * 0.2); ctx.quadraticCurveTo(-wide * 1.05, -len * 0.5, -tip / 2, -len); ctx.lineTo(tip / 2, -len); ctx.quadraticCurveTo(wide * 1.05, -len * 0.5, wide / 2, -len * 0.2); ctx.lineTo(wide / 2, tail); ctx.closePath();
      ctx.fillStyle = fill; ctx.fill(); ctx.restore();
    };
    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(base, 0, 0); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      DIAL.forEach(([cx, cy], i) => {
        const left = s.t[i], mh = (-left / 3600) * Math.PI * 2, hh = Math.PI - (left / 3600) * (Math.PI / 6);
        for (const pass of [0, 1]) { // a shadow pass under the hands, then the hands
          const ox = pass ? 0 : 2.5, oy = pass ? 0 : 4, ink = pass ? "#15110d" : "rgba(40,26,8,0.26)";
          // flag
          ctx.save(); ctx.translate(cx + PX + ox * 0.6, cy + PY + oy * 0.6); ctx.rotate(-s.flag[i].a);
          rr(ctx, -1.6, -3, 3.2, LF * 0.6, 1.5); ctx.fillStyle = pass ? "#8f1a12" : ink; ctx.fill();
          rr(ctx, -4.2, LF * 0.42, 8.4, LF * 0.58, 2.6); ctx.fillStyle = pass ? FLAG : ink; ctx.fill();
          if (pass) { ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.fillRect(-3, LF * 0.48, 1.4, LF * 0.46); ctx.beginPath(); ctx.arc(0, 0, 2.6, 0, Math.PI * 2); ctx.fillStyle = "#c79a42"; ctx.fill(); ctx.lineWidth = 0.6; ctx.strokeStyle = "#4f370c"; ctx.stroke(); }
          ctx.restore();
          hand(R * 0.44, 10, 7, 2.2, hh, cx + ox * 0.7, cy + oy * 0.7, ink);
          hand(HAND, 13, 5, 1.6, mh, cx + ox, cy + oy, ink);
          ctx.save(); ctx.translate(cx + ox * 1.3, cy + oy * 1.3); ctx.rotate(s.sec[i].a);
          ctx.fillStyle = pass ? "#b3261e" : ink; ctx.fillRect(-0.7, -R * 0.8, 1.4, R * 0.8 + 24); ctx.beginPath(); ctx.arc(0, 17, 3.6, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
        const cap = ctx.createRadialGradient(cx - 1.5, cy - 2, 0.5, cx, cy, 6); cap.addColorStop(0, "#fff1c2"); cap.addColorStop(0.6, "#c79a42"); cap.addColorStop(1, "#6f4d15");
        ctx.beginPath(); ctx.arc(cx, cy, 5.5, 0, Math.PI * 2); ctx.fillStyle = cap; ctx.fill();
      });
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(glass, 0, 0); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // The rocker: a post, two pins and a bar that can only have one end down.
      const tilt = (s.tilt * 5.4 * Math.PI) / 180, [px, py] = PIVOT;
      for (const side of [-1, 1]) {
        const ex = px + side * REACH * Math.cos(tilt), ey = py + side * REACH * Math.sin(tilt);
        ctx.fillStyle = brass(ctx, ex - 5, 0, ex + 5, 0); ctx.fillRect(ex - 4, ey, 8, 136 - ey);
        ctx.fillStyle = "rgba(40,22,4,0.35)"; ctx.fillRect(ex + 2.4, ey, 1.6, 136 - ey);
      }
      ctx.fillStyle = brass(ctx, px - 8, 0, px + 8, 0); ctx.fillRect(px - 7, py, 14, 136 - py); ctx.fillStyle = "rgba(40,22,4,0.35)"; ctx.fillRect(px + 4, py, 3, 136 - py);
      ctx.save(); ctx.translate(px, py); ctx.rotate(tilt);
      ctx.save(); ctx.shadowColor = "rgba(40,24,8,0.4)"; ctx.shadowBlur = 8 * dpr; ctx.shadowOffsetY = 5 * dpr; rr(ctx, -198, -8, 396, 16, 8); ctx.fillStyle = "#101012"; ctx.fill(); ctx.restore();
      const bar = ctx.createLinearGradient(0, -8, 0, 8); bar.addColorStop(0, "#4a4a50"); bar.addColorStop(0.18, "#26262a"); bar.addColorStop(0.7, "#101012"); bar.addColorStop(1, "#050506");
      rr(ctx, -198, -8, 396, 16, 8); ctx.fillStyle = bar; ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.38)"; rr(ctx, -188, -6.4, 376, 1.6, 0.8); ctx.fill();
      [-1, 1].forEach((side) => { // one ivory cap, one ebony cap
        const x = side * REACH, ivory = side < 0;
        const capG = ctx.createLinearGradient(0, -30, 0, -8);
        if (ivory) { capG.addColorStop(0, "#fffaf0"); capG.addColorStop(0.5, "#efe4cd"); capG.addColorStop(1, "#b9a987"); } else { capG.addColorStop(0, "#5b5b62"); capG.addColorStop(0.3, "#26262a"); capG.addColorStop(1, "#060607"); }
        ctx.beginPath(); ctx.moveTo(x - 36, -8); ctx.lineTo(x - 36, -17); ctx.quadraticCurveTo(x - 34, -29, x, -30); ctx.quadraticCurveTo(x + 34, -29, x + 36, -17); ctx.lineTo(x + 36, -8); ctx.closePath(); ctx.fillStyle = capG; ctx.fill();
        ctx.lineWidth = 0.8; ctx.strokeStyle = ivory ? "rgba(90,70,40,0.6)" : "rgba(0,0,0,0.8)"; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(x - 8, -24.5, 17, 2.3, 0, 0, Math.PI * 2); ctx.fillStyle = ivory ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.34)"; ctx.fill();
        ctx.fillStyle = brass(ctx, x - 36, 0, x + 36, 0); ctx.fillRect(x - 36, -10.5, 72, 2.5);
      });
      const screw = ctx.createRadialGradient(-2, -2, 1, 0, 0, 8); screw.addColorStop(0, "#fff1c2"); screw.addColorStop(0.55, "#c79a42"); screw.addColorStop(1, "#6f4d15");
      ctx.beginPath(); ctx.arc(0, 0, 7.5, 0, Math.PI * 2); ctx.fillStyle = screw; ctx.fill(); ctx.lineWidth = 0.8; ctx.strokeStyle = "#4f370c"; ctx.stroke();
      ctx.fillStyle = "#4f370c"; ctx.fillRect(-5.5, -0.8, 11, 1.6);
      ctx.restore();
    };

    const press = (side: number, user: boolean) => {
      if (user && s.demo) { s.demo = false; setTimes(full(), full()); s.turn = -1; }
      if (s.fallen >= 0) return;
      s.turn = 1 - side; // your button down, the other clock running
      push();
    };
    const run = (dt: number) => {
      if (s.turn >= 0 && s.fallen < 0) {
        s.t[s.turn] = Math.max(0, s.t[s.turn] - dt);
        if (s.t[s.turn] === 0) { s.fallen = s.turn; s.wait = 0; }
      }
      if (s.demo) {
        const before = s.clock; s.clock += dt;
        if (before < 3 && s.clock >= 3) press(0, false);
        if (before < 5.6 && s.clock >= 5.6) press(1, false);
        if (s.fallen >= 0) { s.wait += dt; if (s.wait > 3.6) { setTimes(DEMO[0], DEMO[1]); s.turn = 0; s.clock = 0; } }
      }
      push();
    };
    const springs = (dt: number) => {
      const goal = s.turn === 0 ? 1 : s.turn === 1 ? -1 : 0;
      s.tiltV += (620 * (goal - s.tilt) - 21 * s.tiltV) * dt; s.tilt += s.tiltV * dt;
      if (Math.abs(s.tilt) > 1) { s.tilt = Math.sign(s.tilt); s.tiltV *= -0.3; } // the low end lands on the case with a small bounce
      s.sec.forEach((h, i) => { const to = -Math.ceil(s.t[i]) * (Math.PI / 30); h.v += (2600 * (to - h.a) - 46 * h.v) * dt; h.a += h.v * dt; });
      s.flag.forEach((f, i) => {
        const floor = held(s.t[i]);
        f.v += (-95 * Math.sin(f.a) - 1.5 * f.v) * dt; f.a += f.v * dt;
        if (f.a < floor) { f.a = floor; f.v = Math.max(0, f.v); }
      });
    };

    let raf = 0, last = 0, seen = true, timer = 0;
    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      run(dt);
      for (let i = 0; i < 4; i++) springs(dt / 4);
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    if (reduce) {
      // Motion reduced: no self-play and no springs, but the clocks still keep time four times a second.
      s.demo = false; setTimes(full(), full()); s.turn = -1; snap(); draw(); push();
      let prev = performance.now();
      timer = window.setInterval(() => { const now = performance.now(); run((now - prev) / 1000); prev = now; snap(); draw(); }, 250);
    } else { snap(); wake(); }
    api.current = {
      press: (side) => { press(side, true); if (reduce) { snap(); draw(); } else wake(); },
      reset: (m) => { if (m !== undefined) minutesIndex = m; s.demo = false; setTimes(full(), full()); s.turn = -1; push(); if (reduce) { snap(); draw(); } else wake(); },
      pause: () => { if (s.demo) { s.demo = false; } s.turn = -1; push(); if (reduce) { snap(); draw(); } else wake(); },
    };
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); window.clearInterval(timer); api.current = null; io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const status = view.fallen >= 0
    ? `${players[view.fallen]}'s flag has fallen. ${players[1 - view.fallen]} wins on time.`
    : view.turn < 0 ? "Rocker level. Press a button to start the other clock." : `${players[view.turn]} to move`;
  const text = "h-10 rounded-full px-3 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#8a4b1d] motion-reduce:transition-none";

  return (
    <div className="flex min-h-[560px] w-full flex-col items-center justify-center bg-[#e7e1d6] bg-[radial-gradient(110%_80%_at_50%_30%,#f6f2ea_0%,#e7e1d6_55%,#d6cec0_100%)] px-4 py-10 sm:min-h-[720px]">
      <div className="relative w-full max-w-[720px]" style={{ aspectRatio: `${W} / ${H}` }}>
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        {players.map((name, i) => (
          <button
            key={name}
            type="button"
            aria-pressed={view.turn === 1 - i}
            aria-label={`${name}'s button: stops ${name}'s clock and starts ${players[1 - i]}'s`}
            onClick={() => api.current?.press(i)}
            className={`absolute top-[8%] h-[80%] w-[40%] cursor-pointer rounded-[28px] outline-none focus-visible:ring-2 focus-visible:ring-[#8a4b1d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e7e1d6] ${i === 0 ? "left-[10%]" : "right-[10%]"}`}
          />
        ))}
      </div>
      <p role="timer" className="mt-1 text-center font-mono text-[12px] uppercase tracking-[0.18em] text-stone-600">
        {players.map((name, i) => (
          <span key={name} className={view.turn === i && view.fallen < 0 ? "text-stone-900" : ""}>
            {i > 0 && <span className="mx-3 text-stone-400">/</span>}
            {name} <span className="font-semibold tabular-nums">{clockText(view.t[i])}</span>
          </span>
        ))}
      </p>
      <p aria-live="polite" className="mt-2 min-h-[20px] max-w-[340px] text-center font-mono text-[11px] uppercase leading-5 tracking-[0.16em] text-stone-900">{status}</p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-1">
        <div role="group" aria-label="Minutes on each clock" className="flex items-center">
          {CONTROLS.map((m, i) => (
            <button
              key={m}
              type="button"
              aria-pressed={choice === i}
              onClick={() => { setChoice(i); api.current?.reset(i); }}
              className={`${text} ${choice === i ? "bg-stone-900 text-stone-50" : "text-stone-600 hover:text-stone-900"}`}
            >
              {m} min
            </button>
          ))}
        </div>
        <span aria-hidden="true" className="mx-1 h-4 w-px bg-stone-400" />
        <button type="button" onClick={() => api.current?.pause()} className={`${text} text-stone-600 hover:text-stone-900`}>Pause</button>
        <button type="button" onClick={() => api.current?.reset()} className={`${text} text-stone-600 hover:text-stone-900`}>Reset</button>
      </div>
    </div>
  );
}
