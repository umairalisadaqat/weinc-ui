import { useEffect, useRef, useState } from "react";

// Everything a visitor is likely to change sits here.
const demoNames = ["Maya", "Jonas", "Priya"]; // typed by themselves until somebody uses the field
const MAX = 9; // longest name the cup has room for
const BAND = "#1f4d3a"; // the printed stripe near the foot of the cup
const BAND_TEXT = "MORNING SHIFT COFFEE BAR  /  ROASTED ON THE PREMISES  /  "; // repeated round the stripe
const boxes = ["DECAF", "OAT", "EXTRA SHOT", "SYRUP", "ICED"]; // the order panel printed on the side
const TICKED = 1; // which of those boxes the barista has crossed
const INK = "#18171b"; // marker colour
const HAND = "'Marker Felt', 'Bradley Hand', 'Segoe Print', 'Comic Sans MS', 'Chalkboard SE', cursive"; // handwriting stack, all local fonts
const SPEED = 250; // how fast the marker travels along the name

// The cup in design pixels: a 620 by 470 stage.
const W = 620, H = 470, CX = 262, YT = 150, YB = 400, RT = 98, RB = 67, TILT = 0.16;
const PEN = 1.42; // size of the marker against the cup

export default function PaperCoffeeCupNameField() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [name, setName] = useState("");
  const api = useRef<{ write: (next: string) => void; stopDemo: () => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mk = (w: number, h: number) => { const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
    let seed = 3;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    // 1. The cup wall unrolled flat: across is the way round, down is top to bottom.
    const TS = 2, TW = Math.round(2 * Math.PI * RT), TH = YB - YT;
    const U0 = TW / 2 - 78, BASE = 112, SIZE = 50; // where the name starts and the line it sits on
    const paper = mk(TW * TS, TH * TS), ink = mk(TW * TS, TH * TS), swoosh = mk(TW * TS, TH * TS), flat = mk(TW * TS, TH * TS);
    {
      const c = paper.getContext("2d");
      if (c) {
        c.scale(TS, TS);
        c.fillStyle = "#f7f2e9"; c.fillRect(0, 0, TW, TH);
        for (let i = 0; i < 1400; i++) { c.fillStyle = rand() > 0.5 ? "rgba(255,255,255,0.4)" : "rgba(128,104,70,0.035)"; c.fillRect(rand() * TW, rand() * TH, 1.5 + rand() * 3, 1.2); }
        // The glued seam at the back.
        const seam = c.createLinearGradient(8, 0, 14, 0);
        seam.addColorStop(0, "rgba(80,60,40,0)"); seam.addColorStop(0.5, "rgba(80,60,40,0.22)"); seam.addColorStop(0.6, "rgba(255,255,255,0.7)"); seam.addColorStop(1, "rgba(255,255,255,0)");
        c.fillStyle = seam; c.fillRect(8, 0, 6, TH);
        // Printed stripe with small type running all the way round.
        c.fillStyle = BAND; c.fillRect(0, 188, TW, 38);
        c.fillStyle = "rgba(247,242,233,0.9)"; c.fillRect(0, 192, TW, 0.8); c.fillRect(0, 221.4, TW, 0.8);
        c.font = "600 8.5px ui-monospace, SFMono-Regular, Menlo, monospace"; c.textBaseline = "middle"; c.fillStyle = "#f7f2e9";
        let x = 0, n = 0;
        while (x < TW + 300) { for (const ch of BAND_TEXT) { c.fillText(ch, x, 207.4); x += c.measureText(ch).width + 1.3; } n++; if (n > 8) break; }
        // The rolled foot of the cup.
        const roll = c.createLinearGradient(0, TH - 9, 0, TH);
        roll.addColorStop(0, "rgba(90,66,40,0)"); roll.addColorStop(0.3, "rgba(90,66,40,0.3)"); roll.addColorStop(0.45, "rgba(255,255,255,0.8)"); roll.addColorStop(1, "rgba(120,96,70,0.25)");
        c.fillStyle = roll; c.fillRect(0, TH - 9, TW, 9);
        // The order panel, printed to the left of where the name starts.
        const px = TW / 2 - 184, py = 46, pw = 82, ph = 22 + boxes.length * 15;
        c.strokeStyle = BAND; c.lineWidth = 1; c.strokeRect(px, py, pw, ph);
        c.fillStyle = BAND; c.fillRect(px, py, pw, 13);
        c.font = "700 6.5px ui-monospace, SFMono-Regular, Menlo, monospace"; c.fillStyle = "#f7f2e9"; c.fillText("ORDER", px + 6, py + 7);
        boxes.forEach((b, i) => {
          const y = py + 24 + i * 15;
          c.strokeStyle = BAND; c.lineWidth = 0.9; c.strokeRect(px + 7, y - 4.5, 9, 9);
          c.fillStyle = BAND; c.font = "600 6.5px ui-monospace, SFMono-Regular, Menlo, monospace"; c.fillText(b, px + 22, y + 0.4);
          if (i === TICKED) { c.strokeStyle = INK; c.lineWidth = 2; c.lineCap = "round"; c.beginPath(); c.moveTo(px + 5.5, y - 5.5); c.lineTo(px + 17, y + 5); c.moveTo(px + 17.5, y - 6); c.lineTo(px + 6, y + 5.5); c.stroke(); }
        });
      }
    }

    // 2. What the marker has to write. `ends` holds where each letter finishes.
    let cupName = "", ends: number[] = [], penU = U0, flU = 0, flEnd = 0, flourished = false, flourishing = false, idle = 0;
    const lastEnd = () => (ends.length ? ends[ends.length - 1] : U0);
    const rebuild = () => {
      const c = ink.getContext("2d");
      if (!c) return;
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, ink.width, ink.height); c.setTransform(TS, 0, 0, TS, 0, 0);
      c.font = `400 ${SIZE}px ${HAND}`; c.textBaseline = "alphabetic"; c.lineJoin = "round";
      ends = Array.from(cupName).map((_, i) => U0 + c.measureText(cupName.slice(0, i + 1)).width + 3);
      c.save(); c.translate(U0, BASE); c.rotate(-0.045);
      c.fillStyle = INK; c.strokeStyle = INK; c.lineWidth = 1.3; c.globalAlpha = 0.94;
      c.strokeText(cupName, 0, 0); c.fillText(cupName, 0, 0);
      c.restore();
    };
    const drawSwoosh = () => {
      const c = swoosh.getContext("2d");
      if (!c) return;
      c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, swoosh.width, swoosh.height); c.setTransform(TS, 0, 0, TS, 0, 0);
      const a = U0 - 4, b = lastEnd() + 6; flEnd = b + 2;
      c.strokeStyle = INK; c.lineCap = "round"; c.globalAlpha = 0.94;
      for (let i = 0; i < 24; i++) {
        const t0 = i / 24, t1 = (i + 1) / 24, y = (t: number) => BASE + 15 + Math.sin(t * Math.PI) * 5 - t * 9;
        c.lineWidth = 4.2 - t0 * 2.2; c.beginPath(); c.moveTo(a + (b - a) * t0, y(t0)); c.lineTo(a + (b - a) * t1, y(t1)); c.stroke();
      }
    };

    // 3. Geometry. A point on the unrolled wall lands here on the turned cup.
    let k = 1;
    const at = (u: number, v: number, rot: number, ox: number) => {
      const th = (u - TW / 2) / RT + rot, f = v / TH, rad = RT + (RB - RT) * f;
      return { x: CX + ox + rad * Math.sin(th), y: YT + TH * f + TILT * rad * Math.cos(th) };
    };
    const outline = (c: CanvasRenderingContext2D, ox: number) => {
      c.beginPath(); c.moveTo(CX + ox - RT, YT - 4); c.lineTo(CX + ox - RB, YB); c.ellipse(CX + ox, YB, RB, RB * TILT, 0, Math.PI, 0, true); c.lineTo(CX + ox + RT, YT - 4); c.closePath();
    };
    let layer = mk(1, 1);
    const fit = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1), w = cv.clientWidth || W;
      cv.width = Math.round(w * dpr); cv.height = Math.round((w * dpr * H) / W); k = cv.width / W;
      layer = mk(cv.width, cv.height);
    };

    const cup = (c: CanvasRenderingContext2D, rot: number) => {
      // Lay the paper, the ink so far and the underline into one flat sheet.
      const f = flat.getContext("2d");
      if (f) {
        f.clearRect(0, 0, flat.width, flat.height); f.drawImage(paper, 0, 0);
        const w1 = Math.max(0, Math.min(TW, penU)) * TS; if (w1 > 0) f.drawImage(ink, 0, 0, w1, flat.height, 0, 0, w1, flat.height);
        const w2 = Math.max(0, Math.min(TW, flU)) * TS; if (w2 > 0) f.drawImage(swoosh, 0, 0, w2, flat.height, 0, 0, w2, flat.height);
      }
      c.setTransform(k, 0, 0, k, 0, 0);
      // Roll it round the cone in thin slices.
      const N = 170, d = Math.PI / N;
      for (let i = 0; i < N; i++) {
        const th = -Math.PI / 2 + i * d, sin = Math.sin(th), cos = Math.cos(th + d / 2);
        let u = (TW / 2 + (th - rot) * RT) % TW; if (u < 0) u += TW;
        const du = Math.min(d * RT, TW - u), xt = CX + RT * sin, yt = YT + TILT * RT * cos, xb = CX + RB * sin, yb = YB + TILT * RB * cos;
        const wt = RT * (Math.sin(th + d) - sin) + 0.4;
        c.setTransform((k * wt) / du, 0, (k * (xb - xt)) / TH, (k * (yb - yt)) / TH, k * xt, k * yt);
        c.drawImage(flat, u * TS, 0, Math.max(1, du * TS), TH * TS, 0, 0, du, TH);
      }
      c.setTransform(k, 0, 0, k, 0, 0);
      // Paper is matte: one broad soft light on the left, falling away to the right.
      c.save(); outline(c, 0); c.clip();
      const side = c.createLinearGradient(CX - RT, 0, CX + RT, 0);
      side.addColorStop(0, "rgba(70,40,24,0.62)"); side.addColorStop(0.06, "rgba(70,40,24,0.34)"); side.addColorStop(0.17, "rgba(70,40,24,0.06)"); side.addColorStop(0.28, "rgba(255,255,255,0.3)"); side.addColorStop(0.42, "rgba(255,255,255,0)");
      side.addColorStop(0.55, "rgba(60,34,20,0.1)"); side.addColorStop(0.74, "rgba(60,34,20,0.3)"); side.addColorStop(0.88, "rgba(56,30,18,0.52)"); side.addColorStop(0.96, "rgba(214,110,76,0.42)"); side.addColorStop(1, "rgba(50,26,14,0.7)");
      c.fillStyle = side; c.fillRect(CX - RT, YT - 6, RT * 2, TH + 40);
      const under = c.createLinearGradient(0, YT, 0, YT + 38);
      under.addColorStop(0, "rgba(40,22,12,0.62)"); under.addColorStop(0.45, "rgba(40,22,12,0.16)"); under.addColorStop(1, "rgba(40,22,12,0)");
      c.fillStyle = under; c.fillRect(CX - RT, YT - 6, RT * 2, 46);
      const footShade = c.createLinearGradient(0, YB - 12, 0, YB + RB * TILT);
      footShade.addColorStop(0, "rgba(40,22,12,0)"); footShade.addColorStop(1, "rgba(40,22,12,0.4)");
      c.fillStyle = footShade; c.fillRect(CX - RT, YB - 12, RT * 2, 30);
      c.restore();

      // The lid: a skirt that grips the rolled rim, a bead, a raised deck and a sip hole.
      const RL = RT + 6, yS = YT - 15, e = TILT;
      const plastic = (x0: number, x1: number) => {
        const g = c.createLinearGradient(x0, 0, x1, 0);
        g.addColorStop(0, "#050506"); g.addColorStop(0.1, "#2a2a2d"); g.addColorStop(0.2, "#8a8a90"); g.addColorStop(0.25, "#d9d9de"); g.addColorStop(0.31, "#4a4a4e"); g.addColorStop(0.5, "#19191b"); g.addColorStop(0.78, "#0d0d0e"); g.addColorStop(0.9, "#3a3a3e"); g.addColorStop(1, "#050506");
        return g;
      };
      const band = (r: number, y1: number, y2: number, r2 = r) => {
        c.beginPath(); c.moveTo(CX - r, y1); c.lineTo(CX - r2, y2); c.ellipse(CX, y2, r2, r2 * e, 0, Math.PI, 0, true); c.lineTo(CX + r, y1); c.ellipse(CX, y1, r, r * e, 0, 0, Math.PI, false); c.closePath();
      };
      band(RL, yS, YT + 5, RL - 1.5); c.fillStyle = plastic(CX - RL, CX + RL); c.fill();
      c.lineWidth = 1; c.strokeStyle = "rgba(255,255,255,0.22)"; c.beginPath(); c.ellipse(CX, YT + 4.2, RL - 2, (RL - 2) * e, 0, Math.PI * 0.92, Math.PI * 0.55, true); c.stroke();
      c.beginPath(); c.ellipse(CX, yS, RL, RL * e, 0, 0, Math.PI * 2);
      const bead = c.createLinearGradient(CX - RL, yS - RL * e, CX + RL, yS + RL * e);
      bead.addColorStop(0, "#77777c"); bead.addColorStop(0.3, "#2b2b2e"); bead.addColorStop(1, "#070708");
      c.fillStyle = bead; c.fill();
      c.lineWidth = 1.2; c.strokeStyle = "rgba(255,255,255,0.55)"; c.beginPath(); c.ellipse(CX, yS, RL - 1, RL * e - 0.6, 0, Math.PI * 0.62, Math.PI * 1.02); c.stroke();
      c.lineWidth = 1; c.strokeStyle = "rgba(255,255,255,0.3)"; c.beginPath(); c.ellipse(CX, yS, RL - 1, RL * e - 0.6, 0, Math.PI * 0.1, Math.PI * 0.6); c.stroke();
      // The trough inside the bead, then the deck rising out of it.
      const RD = RT - 9, yD = yS - 15;
      c.beginPath(); c.ellipse(CX, yS, RL - 7, (RL - 7) * e, 0, 0, Math.PI * 2); c.fillStyle = "#040405"; c.fill();
      band(RD, yD, yS + 1, RD + 3); c.fillStyle = plastic(CX - RD - 3, CX + RD + 3); c.fill();
      c.beginPath(); c.ellipse(CX, yD, RD, RD * e, 0, 0, Math.PI * 2);
      const deck = c.createLinearGradient(CX - RD, yD - RD * e, CX + RD * 0.6, yD + RD * e);
      deck.addColorStop(0, "#5c5c61"); deck.addColorStop(0.35, "#28282b"); deck.addColorStop(1, "#111113");
      c.fillStyle = deck; c.fill();
      c.lineWidth = 1.1; c.strokeStyle = "rgba(255,255,255,0.5)"; c.beginPath(); c.ellipse(CX, yD, RD - 0.8, RD * e - 0.5, 0, Math.PI * 0.5, Math.PI * 1.05); c.stroke();
      c.beginPath(); c.ellipse(CX, yD + 0.6, RD - 13, (RD - 13) * e, 0, 0, Math.PI * 2);
      const dish = c.createLinearGradient(CX - RD, yD - RD * e, CX + RD, yD + RD * e);
      dish.addColorStop(0, "#0b0b0c"); dish.addColorStop(0.6, "#202023"); dish.addColorStop(1, "#3c3c40");
      c.fillStyle = dish; c.fill();
      c.lineWidth = 0.8; c.strokeStyle = "rgba(255,255,255,0.16)"; c.beginPath(); c.ellipse(CX, yD + 0.6, RD - 13, (RD - 13) * e, 0, 0, Math.PI); c.stroke();
      // Sip hole near the front edge and the pin vent at the back.
      const hy = yD + (RD - 7) * e * 0.99;
      c.beginPath(); c.ellipse(CX + 4, hy - 1.2, 10, 2.5, 0, 0, Math.PI * 2); c.fillStyle = "#000"; c.fill();
      c.lineWidth = 0.9; c.strokeStyle = "rgba(255,255,255,0.4)"; c.beginPath(); c.ellipse(CX + 4, hy - 1.2, 10, 2.5, 0, 0, Math.PI); c.stroke();
      c.beginPath(); c.ellipse(CX - 6, yD - (RD - 22) * e, 1.6, 0.7, 0, 0, Math.PI * 2); c.fillStyle = "#000"; c.fill();
      // A long soft sheen across the deck from the studio light.
      c.save(); c.beginPath(); c.ellipse(CX, yD, RD - 14, (RD - 14) * e, 0, 0, Math.PI * 2); c.clip();
      const sheen = c.createLinearGradient(CX - RD, yD - 8, CX + RD * 0.2, yD + 12);
      sheen.addColorStop(0, "rgba(255,255,255,0)"); sheen.addColorStop(0.42, "rgba(255,255,255,0.2)"); sheen.addColorStop(0.5, "rgba(255,255,255,0.03)"); sheen.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = sheen; c.fillRect(CX - RD, yD - 20, RD * 2, 40); c.restore();
    };

    const marker = (c: CanvasRenderingContext2D, x: number, y: number, lean: number) => {
      c.save(); c.translate(x, y); c.rotate(lean); c.scale(PEN, PEN);
      const across = (h: number, stops: [number, string][]) => { const g = c.createLinearGradient(0, -h, 0, h); for (const [o, col] of stops) g.addColorStop(o, col); return g; };
      // Felt tip.
      c.beginPath(); c.moveTo(0, 0.6); c.lineTo(3, -2.6); c.lineTo(11, -3); c.lineTo(11, 3); c.lineTo(2, 2.6); c.closePath(); c.fillStyle = "#101012"; c.fill();
      // Tapered collar.
      c.beginPath(); c.moveTo(10, -3.4); c.lineTo(27, -8.6); c.lineTo(27, 8.6); c.lineTo(10, 3.4); c.closePath();
      c.fillStyle = across(8.6, [[0, "#3a3a3e"], [0.25, "#c8c8cd"], [0.4, "#7d7d83"], [0.75, "#2a2a2d"], [1, "#101012"]]); c.fill();
      // Barrel.
      const bar = across(9.5, [[0, "#070708"], [0.16, "#3b3b3f"], [0.27, "#e6e6ea"], [0.34, "#56565b"], [0.55, "#151517"], [0.86, "#0a0a0b"], [0.94, "#34343a"], [1, "#050506"]]);
      c.beginPath(); c.moveTo(27, -9.5); c.lineTo(156, -9.5); c.arcTo(164, -9.5, 164, 0, 7); c.arcTo(164, 9.5, 156, 9.5, 7); c.lineTo(27, 9.5); c.closePath(); c.fillStyle = bar; c.fill();
      // Wrapped paper label with a few lines of small print.
      c.beginPath(); c.rect(58, -9.5, 62, 19);
      c.fillStyle = across(9.5, [[0, "#7c7a74"], [0.2, "#efece4"], [0.34, "#fbf9f3"], [0.7, "#bdb9af"], [1, "#6d6a63"]]); c.fill();
      c.fillStyle = "rgba(24,23,27,0.8)"; c.fillRect(64, -4.2, 30, 2.6); c.fillRect(64, 0.6, 44, 1); c.fillRect(64, 3, 36, 1);
      c.fillStyle = "rgba(0,0,0,0.5)"; c.fillRect(27, -9.5, 1, 19); c.fillRect(134, -9.5, 1, 19);
      c.restore();
    };

    // 4. The loop: type, write, underline, and swap the cup when a letter is taken back.
    const s = { rot: 0, rotTo: 0, hover: 0, px: CX + 204, py: YT + 96, lift: 1, lean: -1.02, slide: 0 };
    let swap: null | { phase: "out" | "in"; p: number; next: string } = null;
    let raf = 0, last = 0, t0 = 0, seen = true, demo = !reduce, demoAt = 0.25, demoName = 0, demoChar = 0;

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
      const ox = s.slide * 150, alpha = 1 - Math.min(1, Math.abs(s.slide) * 1.15);
      ctx.setTransform(k, 0, 0, k, 0, 0);
      // Shadow on the sweep of the backdrop: a tight dark core and a long soft tail to the right.
      ctx.globalAlpha = alpha;
      for (const [dx, rx, ry, a] of [[70, 190, 26, 0.3], [18, 96, 17, 0.5], [3, 70, 11, 0.6]]) {
        const cx2 = CX + ox + dx, cy = YB + 10, g = ctx.createRadialGradient(cx2, cy, 0, cx2, cy, rx);
        g.addColorStop(0, `rgba(62,16,4,${a})`); g.addColorStop(0.5, `rgba(62,16,4,${a * 0.45})`); g.addColorStop(1, "rgba(62,16,4,0)");
        ctx.save(); ctx.translate(cx2, cy); ctx.scale(1, ry / rx); ctx.translate(-cx2, -cy); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx2, cy, rx, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      const lc = layer.getContext("2d");
      if (lc) {
        lc.setTransform(1, 0, 0, 1, 0, 0); lc.clearRect(0, 0, layer.width, layer.height);
        cup(lc, s.rot + s.hover);
        // The marker's shadow falls only on the cup.
        lc.setTransform(k, 0, 0, k, 0, 0); lc.save(); outline(lc, 0); lc.clip();
        lc.globalAlpha = 0.34 - s.lift * 0.16; lc.filter = `blur(${(2 + s.lift * 7).toFixed(1)}px)`;
        lc.translate(s.px - ox + 9 + s.lift * 30, s.py + 7 + s.lift * 22); lc.rotate(s.lean); lc.scale(PEN, PEN); lc.fillStyle = "#1a0a04";
        lc.beginPath(); lc.moveTo(0, 0); lc.lineTo(27, -8.6); lc.lineTo(160, -9.5); lc.lineTo(160, 9.5); lc.lineTo(27, 8.6); lc.closePath(); lc.fill(); lc.restore();
        ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(layer, ox * k, 0);
      }
      ctx.globalAlpha = 1; ctx.setTransform(k, 0, 0, k, 0, 0);
      marker(ctx, s.px, s.py - s.lift * 3, s.lean);
    };

    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.04, (now - last) / 1000); last = now;
      const t = (now - t0) / 1000;
      // The demonstration types into the real field, one key at a time.
      if (demo && t > demoAt) {
        const word = demoNames[demoName % demoNames.length];
        if (demoChar < word.length) { demoChar++; const next = word.slice(0, demoChar); setName(next); write(next); demoAt = t + 0.15; }
        else { demoChar = 0; demoName++; demoAt = t + 4.6; }
      }
      const rest = cv.clientWidth < 520 ? 146 : 178;
      let tx = CX + rest, ty = YT + 96 + Math.sin(t * 1.3) * 4, lift = 1, lean = -1.02, follow = 5;
      if (swap) {
        swap.p += dt / 0.3;
        if (swap.phase === "out") { s.slide = swap.p * swap.p; if (swap.p >= 1) { cupName = swap.next; rebuild(); penU = U0; flU = 0; flourished = false; flourishing = false; s.rot = 0; s.rotTo = 0; swap = { phase: "in", p: 0, next: swap.next }; s.slide = -1; } }
        else { const q = 1 - Math.min(1, swap.p); s.slide = -(q * q); if (swap.p >= 1) { s.slide = 0; swap = null; } }
      } else {
        const end = lastEnd();
        if (cupName && penU < end) {
          penU = Math.min(end, penU + SPEED * dt); idle = 0;
          const p = at(penU, BASE - 15 + Math.sin(penU * 0.27) * 12, s.rot + s.hover, 0);
          tx = p.x; ty = p.y; lift = 0; lean = -0.98 + Math.sin(penU * 0.27) * 0.05; follow = 26;
          s.rotTo = -((penU - TW / 2) / RT) * 0.72;
        } else if (cupName && !flourished) {
          idle += dt;
          if (idle > 0.3 || flourishing) {
            if (!flourishing) { flourishing = true; drawSwoosh(); flU = U0 - 6; }
            flU = Math.min(flEnd, flU + SPEED * 2.1 * dt);
            const f2 = (flU - U0) / Math.max(1, flEnd - U0), p = at(flU, BASE + 15 + Math.sin(f2 * Math.PI) * 5 - f2 * 9, s.rot + s.hover, 0);
            tx = p.x; ty = p.y; lift = 0; lean = -0.95; follow = 26;
            if (flU >= flEnd) { flourished = true; flourishing = false; }
          }
          s.rotTo = -(((U0 + end) / 2 - TW / 2) / RT);
        } else if (cupName) s.rotTo = -(((U0 + end) / 2 - TW / 2) / RT) + Math.sin(t * 0.7) * 0.07;
        else s.rotTo = Math.sin(t * 0.7) * 0.07;
      }
      s.rot += (s.rotTo - s.rot) * Math.min(1, dt * 5);
      s.px += (tx - s.px) * Math.min(1, dt * follow); s.py += (ty - s.py) * Math.min(1, dt * follow);
      s.lift += (lift - s.lift) * Math.min(1, dt * 12); s.lean += (lean - s.lean) * Math.min(1, dt * 10);
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const still = () => {
      const end = lastEnd();
      penU = end; drawSwoosh(); flU = cupName ? flEnd : 0; flourished = true; s.slide = 0;
      s.rot = cupName ? -(((U0 + end) / 2 - TW / 2) / RT) : 0; s.px = CX + (cv.clientWidth < 520 ? 146 : 178); s.py = YT + 96; s.lift = 1;
      draw();
    };
    const write = (next: string) => {
      if (reduce) { cupName = next; rebuild(); still(); return; }
      if (swap) { swap.next = next; return; }
      if (next.startsWith(cupName) && next !== "") {
        if (next !== cupName && (flourished || flourishing)) { flourished = false; flourishing = false; flU = 0; }
        cupName = next; rebuild(); idle = 0;
      } else if (next !== cupName) swap = { phase: "out", p: 0, next };
    };
    const wake = () => { if (reduce) still(); else if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    api.current = { write: (next) => { write(next); wake(); }, stopDemo: () => { demo = false; } };
    fit();
    if (reduce) { setName(demoNames[0]); cupName = demoNames[0]; rebuild(); }
    wake();

    // Moving across the stage turns the cup a little, as if it were in your other hand.
    const host = cv.parentElement;
    const onMove = (e: PointerEvent) => { const b = cv.getBoundingClientRect(); s.hover = (Math.max(0, Math.min(1, (e.clientX - b.left) / b.width)) - 0.5) * -0.5; if (reduce) draw(); };
    const onLeave = () => { s.hover = 0; if (reduce) draw(); };
    host?.addEventListener("pointermove", onMove); host?.addEventListener("pointerleave", onLeave);
    const ro = new ResizeObserver(() => { fit(); if (reduce) still(); else draw(); });
    ro.observe(cv);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); api.current = null;
      host?.removeEventListener("pointermove", onMove); host?.removeEventListener("pointerleave", onLeave);
      ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const change = (value: string) => {
    const next = value.replace(/\s+/g, " ").slice(0, MAX);
    api.current?.stopDemo(); setName(next); api.current?.write(next.trim());
  };

  return (
    <div className="flex min-h-[640px] w-full flex-col overflow-hidden sm:min-h-[800px] items-center justify-center bg-[#c9563a] bg-[radial-gradient(80%_70%_at_42%_38%,#ec9069_0%,#d86a48_42%,#b4452c_100%)] px-4 py-10">
      <div className="relative aspect-[430/470] w-full max-w-[800px] sm:aspect-[620/470]">
        <canvas ref={canvas} role="img" aria-label={name.trim() ? `A paper coffee cup with the name ${name.trim()} written on it in marker` : "A blank paper coffee cup and a marker"} className="absolute inset-y-0 left-[-21.9%] h-full w-[144.2%] max-w-none sm:left-0 sm:w-full" />
      </div>
      <div className="mt-2 w-full max-w-[340px]">
        <label htmlFor="cup-name-field" className="block text-center font-mono text-[11px] uppercase tracking-[0.2em] text-[#3d1408]">
          Name for the cup
        </label>
        <input
          id="cup-name-field"
          type="text"
          value={name}
          maxLength={MAX}
          autoComplete="off"
          spellCheck={false}
          placeholder="Who is it for?"
          onFocus={() => api.current?.stopDemo()}
          onChange={(e) => change(e.target.value)}
          className="mt-3 h-14 w-full rounded-full border border-[#7c2a14]/30 bg-[#fbf4ea] px-6 text-center text-xl font-medium text-[#2a1109] shadow-[inset_0_2px_4px_rgba(90,30,10,0.18),0_10px_24px_-10px_rgba(70,18,4,0.6)] outline-none placeholder:text-[#8a5a48] focus-visible:ring-2 focus-visible:ring-[#2a1109] focus-visible:ring-offset-2 focus-visible:ring-offset-[#d86a48]"
        />
        <p className="mt-3 text-center font-mono text-[11px] uppercase leading-5 tracking-[0.16em] text-[#3d1408]">
          Marker does not rub out. Change a letter and you get a fresh cup.
        </p>
      </div>
    </div>
  );
}
