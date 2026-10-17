import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

// The tools on the lower row of jacks, and what the agent does with each one.
const tools = [
  { name: "Inbox", does: "Reads the new order from Marigold Lane" },
  { name: "Stock", does: "Counts the peonies left in the cooler" },
  { name: "Diary", does: "Finds a free delivery slot on Friday" },
  { name: "Reply", does: "Writes back with the time and the total" },
  { name: "Invoice", does: "Sends the bill for the bouquet" },
];
const START = [0, 2, 1, 3]; // which tool each step is plugged into at the start
const LENGTHS = [540, 500, 452, 506]; // cord lengths in design pixels
const BLUE = "#4F98FB", INK = "#12151c";
const COLOURS = [BLUE, INK, BLUE, INK];
const W = 520, H = 600; // design size; everything scales with the panel
const AX = [116, 212, 308, 404], AY = 126; // step jacks
const BX = [68, 164, 260, 356, 452], BY = 280; // tool jacks
const STEP_TIME = 1.55; // seconds each step takes
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';

type Cord = { p: number[][]; len: number; bx: number; by: number; vx: number; vy: number; tool: number; held: boolean };
type Api = { grab: (i: number) => void; drag: (i: number, x: number, y: number) => void; drop: (i: number) => void; hop: (i: number) => void };

export default function AgentSwitchboard() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const api = useRef<Api | null>(null);
  const press = useRef({ x: 0, y: 0, moved: false });
  const [wires, setWires] = useState(START);
  const [active, setActive] = useState(-1); // -1 waiting, 0 to 3 a step, 4 finished

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const still = document.createElement("canvas");
    let k = 1; // canvas pixels per design pixel

    const N = 34;
    const cords: Cord[] = START.map((tool, i) => ({
      p: Array.from({ length: N }, (_, j) => { const f = j / (N - 1); const x = AX[i] + (BX[tool] - AX[i]) * f, y = AY + (BY - AY) * f + Math.sin(f * Math.PI) * 190; return [x, y, x, y]; }),
      len: LENGTHS[i % LENGTHS.length], bx: BX[tool], by: BY, vx: 0, vy: 0, tool, held: false,
    }));
    const lamps = tools.map(() => 0), lampTo = tools.map(() => 0), leds = START.map(() => 0);
    const seq = { step: -1, t: 0.25, runs: 0, run: 0 };
    let touched = -1e9, clock = 0;

    // Rope: points remember where they were, gravity pulls, then the segments are pulled back to length.
    const rope = (c: Cord, i: number, dt: number) => {
      const seg = c.len / (N - 1);
      for (let j = 1; j < N - 1; j++) {
        const q = c.p[j], vx = (q[0] - q[2]) * 0.988, vy = (q[1] - q[3]) * 0.988;
        q[2] = q[0]; q[3] = q[1];
        q[0] += vx + Math.sin(clock * 0.9 + i * 1.9 + j * 0.3) * 46 * dt * dt;
        q[1] += vy + 1700 * dt * dt;
      }
      for (let n = 0; n < 12; n++) {
        c.p[0][0] = AX[i]; c.p[0][1] = AY; c.p[N - 1][0] = c.bx; c.p[N - 1][1] = c.by;
        for (let j = 0; j < N - 1; j++) {
          const a = c.p[j], b = c.p[j + 1];
          let dx = b[0] - a[0], dy = b[1] - a[1];
          const d = Math.hypot(dx, dy) || 0.001, pull = ((d - seg) / d) * 0.5;
          dx *= pull; dy *= pull;
          if (j > 0) { a[0] += dx; a[1] += dy; }
          if (j < N - 2) { b[0] -= dx; b[1] -= dy; }
        }
      }
    };
    const settle = () => { for (let n = 0; n < 420; n++) cords.forEach((c, i) => { c.bx = BX[c.tool]; c.by = BY; rope(c, i, 1 / 60); }); };

    const mix = (a: number[], b: number[], t: number) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;
    const engrave = (g: CanvasRenderingContext2D, text: string, x: number, y: number, font: string, align: CanvasTextAlign = "center") => {
      g.font = font; g.textAlign = align; g.textBaseline = "middle";
      g.fillStyle = "rgba(255,255,255,0.95)"; g.fillText(text, x, y + 0.9);
      g.fillStyle = "rgba(11,13,18,0.78)"; g.fillText(text, x, y);
    };
    const metal = (g: CanvasRenderingContext2D, x: number, y: number, r: number, flip = false) => {
      const m = g.createLinearGradient(x - r, y - r, x + r, y + r);
      const s = flip ? ["#7c838f", "#e9ecf0", "#9299a5"] : ["#f7f8fa", "#8b929e", "#dfe2e7"];
      m.addColorStop(0, s[0]); m.addColorStop(0.52, s[1]); m.addColorStop(1, s[2]);
      return m;
    };
    const jack = (g: CanvasRenderingContext2D, x: number, y: number, turn: number) => {
      g.save();
      g.shadowColor = "rgba(11,13,18,0.38)"; g.shadowBlur = 6 * k; g.shadowOffsetY = 3 * k;
      g.beginPath(); for (let s = 0; s < 6; s++) { const a = turn + (s * Math.PI) / 3; g.lineTo(x + Math.cos(a) * 16, y + Math.sin(a) * 16); } g.closePath();
      g.fillStyle = metal(g, x, y, 16); g.fill();
      g.restore();
      g.lineWidth = 0.8; g.strokeStyle = "rgba(11,13,18,0.4)"; g.stroke();
      g.beginPath(); g.arc(x, y, 10.5, 0, Math.PI * 2); g.fillStyle = metal(g, x, y, 10.5, true); g.fill();
      g.lineWidth = 0.7; g.strokeStyle = "rgba(11,13,18,0.5)"; g.stroke();
      g.beginPath(); g.arc(x, y, 7, 0, Math.PI * 2); g.fillStyle = "#06070a"; g.fill();
      g.beginPath(); g.arc(x, y, 6.2, 0.25, Math.PI - 0.25); g.lineWidth = 1.2; g.strokeStyle = "rgba(255,255,255,0.3)"; g.stroke();
    };
    const bezel = (g: CanvasRenderingContext2D, x: number, y: number, r: number) => {
      g.beginPath(); g.arc(x, y, r + 3, 0, Math.PI * 2); g.fillStyle = metal(g, x, y, r + 3); g.fill();
      g.lineWidth = 0.7; g.strokeStyle = "rgba(11,13,18,0.45)"; g.stroke();
      g.beginPath(); g.arc(x, y, r + 0.8, 0, Math.PI * 2); g.fillStyle = "#07080b"; g.fill();
    };
    const lamp = (x: number, y: number, r: number, v: number) => {
      if (v > 0.02) {
        const bloom = ctx.createRadialGradient(x, y, 0, x, y, r * 5.5);
        bloom.addColorStop(0, `rgba(79,152,251,${0.5 * v})`); bloom.addColorStop(1, "rgba(79,152,251,0)");
        ctx.fillStyle = bloom; ctx.beginPath(); ctx.arc(x, y, r * 5.5, 0, Math.PI * 2); ctx.fill();
      }
      const dome = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, 0, x, y, r);
      dome.addColorStop(0, mix([58, 78, 116], [240, 248, 255], v)); dome.addColorStop(0.55, mix([28, 40, 66], [79, 152, 251], v)); dome.addColorStop(1, mix([12, 18, 32], [40, 104, 205], v));
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = dome; ctx.fill();
      ctx.beginPath(); ctx.ellipse(x - r * 0.34, y - r * 0.4, r * 0.32, r * 0.2, -0.6, 0, Math.PI * 2); ctx.fillStyle = `rgba(255,255,255,${0.45 + 0.4 * v})`; ctx.fill();
    };
    const cap = (x: number, y: number, lift: number) => {
      const r = 13.5 + lift * 1.6;
      ctx.save(); ctx.shadowColor = "rgba(11,13,18,0.5)"; ctx.shadowBlur = (7 + lift * 12) * k; ctx.shadowOffsetX = (2 + lift * 4) * k; ctx.shadowOffsetY = (4 + lift * 10) * k;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = metal(ctx, x, y, r); ctx.fill(); ctx.restore();
      const body = ctx.createRadialGradient(x - 4, y - 5, 1, x, y, r - 2);
      body.addColorStop(0, "#4a4f5c"); body.addColorStop(0.5, "#1b1e26"); body.addColorStop(1, "#090a0e");
      ctx.beginPath(); ctx.arc(x, y, r - 2.2, 0, Math.PI * 2); ctx.fillStyle = body; ctx.fill();
      ctx.lineWidth = 0.8;
      for (const rr of [r - 4.6, r - 6.6]) { ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.strokeStyle = "rgba(0,0,0,0.7)"; ctx.stroke(); ctx.beginPath(); ctx.arc(x, y + 0.7, rr, 0.5, Math.PI - 0.5); ctx.strokeStyle = "rgba(255,255,255,0.16)"; ctx.stroke(); }
    };
    const trace = (c: Cord, ox = 0, oy = 0) => {
      ctx.beginPath(); ctx.moveTo(c.p[0][0] + ox, c.p[0][1] + oy);
      for (let j = 1; j < N - 1; j++) ctx.quadraticCurveTo(c.p[j][0] + ox, c.p[j][1] + oy, (c.p[j][0] + c.p[j + 1][0]) / 2 + ox, (c.p[j][1] + c.p[j + 1][1]) / 2 + oy);
      ctx.lineTo(c.p[N - 1][0] + ox, c.p[N - 1][1] + oy);
    };

    // Everything that never moves is drawn once: engraving, screws, nuts and lamp bezels.
    const drawStill = () => {
      const g = still.getContext("2d");
      if (!g) return;
      g.setTransform(k, 0, 0, k, 0, 0); g.clearRect(0, 0, W, H);
      if ("letterSpacing" in g) (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "1.6px";
      engrave(g, "ORDER DESK", 48, 40, `800 12px ${FONT}`, "left");
      engrave(g, "RUN", W - 66, 40, "600 9px ui-monospace, SFMono-Regular, Menlo, monospace", "right");
      bezel(g, W - 50, 40, 5);
      g.fillStyle = "rgba(11,13,18,0.2)"; g.fillRect(30, 60, W - 60, 1); g.fillStyle = "rgba(255,255,255,0.9)"; g.fillRect(30, 61, W - 60, 1);
      [[24, 24, 0.6], [W - 24, 24, 2.1], [24, H - 24, 1.2], [W - 24, H - 24, 0.2]].forEach(([x, y, a]) => {
        g.save(); g.shadowColor = "rgba(11,13,18,0.35)"; g.shadowBlur = 3 * k; g.shadowOffsetY = 1.5 * k;
        g.beginPath(); g.arc(x, y, 6.5, 0, Math.PI * 2); g.fillStyle = metal(g, x, y, 6.5); g.fill(); g.restore();
        g.lineWidth = 1.6; g.strokeStyle = "rgba(11,13,18,0.6)"; g.beginPath(); g.moveTo(x - Math.cos(a) * 4.6, y - Math.sin(a) * 4.6); g.lineTo(x + Math.cos(a) * 4.6, y + Math.sin(a) * 4.6); g.stroke();
      });
      AX.forEach((x, i) => { jack(g, x, AY, 0.3 + i * 0.4); engrave(g, `0${i + 1}`, x + 7, 90, "700 10px ui-monospace, SFMono-Regular, Menlo, monospace"); bezel(g, x - 13, 90, 3); });
      BX.forEach((x, i) => { jack(g, x, BY, 0.1 + i * 0.5); engrave(g, tools[i].name.toUpperCase(), x + 0.8, 206, `800 10px ${FONT}`); bezel(g, x, 236, 7); });
    };

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(still, 0, 0);
      ctx.setTransform(k, 0, 0, k, 0, 0);
      lamp(W - 50, 40, 5, seq.step >= 0 && seq.step < 4 ? 0.75 + 0.25 * Math.sin(clock * 9) : seq.step === 4 ? 1 : 0.1);
      leds.forEach((v, i) => lamp(AX[i] - 13, 90, 3, v));
      lamps.forEach((v, i) => lamp(BX[i], 236, 7, v));
      cords.forEach((c, i) => { cap(AX[i], AY, 0); });
      // seated plugs first, then any plug in the hand so it passes over the others
      const order = cords.map((_, i) => i).sort((a, b) => Number(cords[a].held) - Number(cords[b].held));
      for (const i of order) {
        const c = cords[i], lift = c.held ? 1 : Math.min(1, Math.hypot(c.bx - BX[c.tool], c.by - BY) / 50), blue = COLOURS[i % COLOURS.length] === BLUE;
        cap(c.bx, c.by, lift);
        ctx.lineCap = "round"; ctx.lineJoin = "round";
        ctx.save(); ctx.shadowColor = "rgba(11,13,18,0.3)"; ctx.shadowBlur = 9 * k; ctx.shadowOffsetX = 4 * k; ctx.shadowOffsetY = 9 * k;
        trace(c); ctx.lineWidth = 8; ctx.strokeStyle = blue ? "#2f6fcf" : "#050609"; ctx.stroke(); ctx.restore();
        trace(c); ctx.lineWidth = 6.2; ctx.strokeStyle = COLOURS[i % COLOURS.length]; ctx.stroke();
        ctx.save(); ctx.setLineDash([1.6, 3.2]); ctx.lineCap = "butt"; trace(c); ctx.lineWidth = 6.2; ctx.strokeStyle = blue ? "rgba(11,13,18,0.14)" : "rgba(255,255,255,0.1)"; ctx.stroke(); ctx.restore();
        trace(c, -1.3, -1.5); ctx.lineWidth = 1.5; ctx.strokeStyle = blue ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.26)"; ctx.stroke();
        for (const [x, y] of [[AX[i], AY], [c.bx, c.by]]) {
          ctx.beginPath(); ctx.arc(x, y, 5.6, 0, Math.PI * 2); ctx.fillStyle = blue ? "#2f6fcf" : "#000"; ctx.fill();
          ctx.beginPath(); ctx.arc(x - 0.8, y - 1, 3.6, 0, Math.PI * 2); ctx.fillStyle = COLOURS[i % COLOURS.length]; ctx.fill();
          ctx.beginPath(); ctx.arc(x - 1.6, y - 2, 1.2, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.fill();
        }
        if (i === seq.step && seq.t > 0.12 && seq.t < 0.95) {
          // the signal: a bead of light that runs down the cord from the step to its tool
          const f = Math.min(0.999, (seq.t - 0.12) / 0.78), e = f * f * (3 - 2 * f) * (N - 1), j = Math.floor(e), u = e - j;
          const x = c.p[j][0] + (c.p[j + 1][0] - c.p[j][0]) * u, y = c.p[j][1] + (c.p[j + 1][1] - c.p[j][1]) * u;
          const glow = ctx.createRadialGradient(x, y, 0, x, y, 26);
          glow.addColorStop(0, "rgba(255,255,255,0.95)"); glow.addColorStop(0.16, "rgba(190,222,255,0.85)"); glow.addColorStop(0.45, "rgba(79,152,251,0.4)"); glow.addColorStop(1, "rgba(79,152,251,0)");
          ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, 26, 0, Math.PI * 2); ctx.fill();
        }
      }
    };

    const show = (n: number) => setActive((a) => (a === n ? a : n));
    const free = () => tools.findIndex((_, t) => !cords.some((c) => c.tool === t));
    const plug = (i: number, tool: number) => { cords[i].tool = tool; setWires(cords.map((c) => c.tool)); lampTo.fill(0); seq.step = -1; seq.t = 0.5; show(-1); };

    let raf = 0, last = 0, seen = true, acc = 0;
    const frame = (now: number) => {
      raf = 0;
      if (!last) last = now;
      const dt = Math.min(0.05, (now - last) / 1000); last = now; clock += dt;
      // the agent runs its steps in order, one cord at a time
      seq.t += dt;
      if (seq.step === -1 && seq.t > 1) { seq.step = 0; seq.t = 0; show(0); }
      else if (seq.step >= 0 && seq.step < 4) {
        if (seq.t > 0.9) lampTo[cords[seq.step].tool] = 1;
        if (seq.t > STEP_TIME) { seq.step += 1; seq.t = 0; show(seq.step); }
      } else if (seq.step === 4 && seq.t > 2.1) {
        lampTo.fill(0); seq.step = -1; seq.t = 0; seq.runs += 1; show(-1);
        // left alone, the last cord moves itself to the spare jack before the next run
        if (now - touched > 7000) { const spare = free(); if (spare >= 0) { cords[cords.length - 1].tool = spare; setWires(cords.map((c) => c.tool)); } }
      }
      lamps.forEach((v, i) => { lamps[i] = v + (lampTo[i] - v) * Math.min(1, dt * (lampTo[i] ? 16 : 4)); });
      leds.forEach((v, i) => { const to = seq.step === 4 || i < seq.step ? 0.7 : i === seq.step ? 1 : 0; leds[i] = v + (to - v) * Math.min(1, dt * 12); });
      acc = Math.min(0.05, acc + dt);
      while (acc >= 1 / 120) {
        cords.forEach((c, i) => {
          if (!c.held) { c.vx += (300 * (BX[c.tool] - c.bx) - 26 * c.vx) / 120; c.vy += (300 * (BY - c.by) - 26 * c.vy) / 120; c.bx += c.vx / 120; c.by += c.vy / 120; }
          rope(c, i, 1 / 120);
        });
        acc -= 1 / 120;
      }
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = 0; raf = requestAnimationFrame(frame); } };
    const freeze = () => { settle(); cords.forEach((c) => { lamps[c.tool] = 1; }); leds.fill(0.7); seq.step = 4; draw(); };

    api.current = {
      grab: (i) => { touched = performance.now(); if (!reduce) { cords[i].held = true; cords[i].vx = 0; cords[i].vy = 0; } },
      drag: (i, x, y) => {
        const c = cords[i];
        if (!c.held) return;
        let dx = x - AX[i], dy = y - AY; const d = Math.hypot(dx, dy), max = c.len * 0.96;
        if (d > max) { dx *= max / d; dy *= max / d; }
        c.bx = Math.max(18, Math.min(W - 18, AX[i] + dx)); c.by = Math.max(18, Math.min(H - 18, AY + dy));
      },
      drop: (i) => {
        const c = cords[i];
        if (!c.held) return;
        c.held = false; touched = performance.now();
        let best = c.tool, near = 58;
        BX.forEach((x, t) => { const d = Math.hypot(x - c.bx, BY - c.by); if (d < near && (t === c.tool || !cords.some((o) => o.tool === t))) { near = d; best = t; } });
        if (best !== c.tool) plug(i, best);
      },
      hop: (i) => { touched = performance.now(); const spare = free(); if (spare < 0) return; plug(i, spare); if (reduce) { lamps.fill(0); freeze(); show(4); } },
    };

    const fit = () => {
      const b = cv.getBoundingClientRect();
      if (!b.width) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = still.width = Math.round(b.width * dpr); cv.height = still.height = Math.round((b.width * dpr * H) / W);
      k = cv.width / W;
      drawStill(); draw();
    };
    settle();
    fit();
    if (reduce) { freeze(); setActive(4); } else wake();
    const ro = new ResizeObserver(fit);
    ro.observe(cv);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); api.current = null; ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const point = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const b = canvas.current?.getBoundingClientRect();
    return b ? { x: ((e.clientX - b.left) / b.width) * W, y: ((e.clientY - b.top) / b.height) * H } : { x: 0, y: 0 };
  };
  const step = active >= 0 && active < 4 ? active : -1;
  const line = step >= 0 ? tools[wires[step]].does : active === 4 ? "Order handled. Waiting for the next one" : "Listening for a new order";

  return (
    <div style={{ fontFamily: FONT }} className="flex min-h-[640px] w-full items-center justify-center bg-[#D9D5CB] bg-[radial-gradient(80%_70%_at_50%_36%,#eeebe4_0%,#D9D5CB_55%,#c4bfb3_100%)] px-4 py-10 sm:min-h-[800px]">
      <div className="relative aspect-[520/600] w-full max-w-[520px] rounded-[30px] bg-[#F6F4EF] bg-[linear-gradient(165deg,#ffffff_0%,#F6F4EF_42%,#ebe8e0_100%)] shadow-[inset_0_1.5px_0_#ffffff,inset_0_-2px_1px_rgba(11,13,18,0.1),inset_0_0_0_1px_rgba(255,255,255,0.6),0_1px_0_#cbc6ba,0_3px_0_#c1bcb0,0_5px_0_#b7b2a6,0_7px_0_#aeA99d,0_22px_26px_-8px_rgba(11,13,18,0.35),0_60px_70px_-30px_rgba(11,13,18,0.5)] sm:max-w-[590px]">
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[30px] bg-[linear-gradient(118deg,rgba(255,255,255,0)_18%,rgba(255,255,255,0.75)_30%,rgba(255,255,255,0)_44%,rgba(255,255,255,0)_70%,rgba(255,255,255,0.35)_78%,rgba(255,255,255,0)_88%)]" />
        <div className="absolute inset-x-[5.4%] bottom-[4.4%] flex h-[11%] flex-col justify-center overflow-hidden rounded-[12px] bg-[#0B0D12] px-[4%] shadow-[inset_0_3px_6px_rgba(0,0,0,0.9),inset_0_0_0_1px_#000,0_1px_0_rgba(255,255,255,0.95),0_-1px_0_rgba(11,13,18,0.12)]">
          <span className="font-mono text-[9px] font-semibold uppercase leading-4 tracking-[0.22em] text-[#4F98FB] sm:text-[10px]">
            {step >= 0 ? `Step 0${step + 1} / ${tools[wires[step]].name}` : active === 4 ? "Done" : "Ready"}
          </span>
          <span className="truncate text-[13px] font-bold leading-5 tracking-[-0.01em] text-[#F6F4EF] [text-shadow:0_0_12px_rgba(79,152,251,0.55)] sm:text-[16px] sm:leading-6">{line}</span>
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.07)_0%,rgba(255,255,255,0)_45%)]" />
        </div>
        <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />
        <ul aria-label="Which tool each step uses" className="absolute inset-0 m-0 list-none p-0">
          {wires.map((tool, i) => (
            <li key={i}>
              <button
                type="button"
                aria-label={`Step ${i + 1} uses ${tools[tool].name}. Move this cord to the spare jack`}
                style={{ left: `${(BX[tool] / W) * 100}%`, top: `${(BY / H) * 100}%` }}
                onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); press.current = { x: e.clientX, y: e.clientY, moved: false }; api.current?.grab(i); }}
                onPointerMove={(e) => {
                  if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
                  if (Math.hypot(e.clientX - press.current.x, e.clientY - press.current.y) > 5) press.current.moved = true;
                  if (press.current.moved) { const p = point(e); api.current?.drag(i, p.x, p.y); }
                }}
                onPointerUp={() => { api.current?.drop(i); }}
                onPointerCancel={() => { api.current?.drop(i); }}
                onClick={() => { if (!press.current.moved) api.current?.hop(i); press.current.moved = false; }}
                className="absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#4F98FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6F4EF] active:cursor-grabbing"
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
