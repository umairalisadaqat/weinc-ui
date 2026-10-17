import { useEffect, useRef, useState } from "react";

/** Gumball colours as red, green, blue. The machine deals them out at random. */
const COLOURS = ["226,38,44", "250,196,28", "38,112,224", "34,160,96", "246,118,26", "248,244,236", "232,82,152"];
/** How many gumballs start in the globe. 38 fills it a little past half way. */
const COUNT = 38;
/** Enamel colour of the lid, body and foot, as red, green, blue. Every shade and highlight is worked out from it. */
const ENAMEL = "214,30,30";
/** The stage. The chrome and the undersides of the gumballs pick this colour up. */
const STAGE = "#f5c62f";

const GX = 0, GY = 215, GR = 140; // glass globe
const SHELF = 322; // the plate the gumballs lie on
const BALL = 15.5;
const CRANK = { x: 0, y: 420 };
const DOOR = { x: -37, y: 487, w: 74, h: 56 };
const TABLE = 606; // where a rolling gumball's centre sits

export default function GumballMachine() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const hit = useRef<HTMLDivElement>(null);
  const api = useRef<{ turn: () => void } | null>(null);
  const [served, setServed] = useState(0);

  useEffect(() => {
    const cv = canvas.current, pad = hit.current;
    if (!cv || !pad) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dpr = 1, scale = 1, ox = 0, oy = 0, box = cv.getBoundingClientRect();
    let body: HTMLCanvasElement | null = null, lid: HTMLCanvasElement | null = null, rear: HTMLCanvasElement | null = null;
    let sprites: HTMLCanvasElement[] = [];
    let seed = 9;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    // ---------- the pile in the globe (position-based, so it stacks without jitter)
    type Gum = { x: number; y: number; px: number; py: number; c: number };
    const settle = (list: Gum[], h: number, stir: number) => {
      for (const b of list) {
        const vx = (b.x - b.px) * 0.99, vy = (b.y - b.py) * 0.99;
        b.px = b.x; b.py = b.y; b.x += vx; b.y += vy + 1500 * h * h;
        if (stir > 0 && b.y > SHELF - 40) { b.x += (Math.random() - 0.5) * stir; b.y -= Math.random() * stir * 0.5; }
      }
      for (let it = 0; it < 4; it++) {
        for (let i = 0; i < list.length; i++) {
          const a = list[i];
          for (let j = i + 1; j < list.length; j++) {
            const b = list[j], dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
            if (d2 >= BALL * BALL * 4 || d2 === 0) continue;
            const d = Math.sqrt(d2), push = (BALL * 2 - d) / 2 / d;
            a.x -= dx * push; a.y -= dy * push; b.x += dx * push; b.y += dy * push;
          }
          const dx = a.x - GX, dy = a.y - GY, d = Math.hypot(dx, dy), lim = GR - 5 - BALL;
          if (d > lim) { a.x = GX + (dx / d) * lim; a.y = GY + (dy / d) * lim; }
          if (a.y > SHELF - BALL) { a.y = SHELF - BALL; a.px = a.x - (a.x - a.px) * 0.7; }
        }
      }
    };
    const fill = (n: number) => {
      const list: Gum[] = [];
      for (let i = 0; i < n; i++) { const x = (rand() - 0.5) * 150, y = 300 - i * 5 - rand() * 20; list.push({ x, y, px: x, py: y, c: Math.floor(rand() * COLOURS.length) }); }
      for (let i = 0; i < 520; i++) settle(list, 1 / 120, 0);
      return list;
    };
    const pile = fill(COUNT);
    const ghost = fill(Math.max(0, COUNT - 8)); // a second, dimmer pile painted behind the live one so the globe reads as full in depth

    // ---------- everything outside the globe
    const s = {
      crank: 0, crankV: 0, crankTo: 0, drag: false, turns: 0,
      flap: 0, lidHop: 0, light: 0, lightTo: 0,
      out: null as null | { c: number; t: number; dir: number },
      queue: 0,
    };
    type Roll = { x: number; vx: number; c: number; age: number; leave: boolean };
    const table: Roll[] = [{ x: 176, vx: 0, c: 2, age: 9, leave: false }, { x: -204, vx: 0, c: 1, age: 9, leave: false }];
    let dealt = 0, dir = 1;

    const bake = (x0: number, y0: number, w: number, h: number, paint: (c: CanvasRenderingContext2D) => void) => {
      const off = document.createElement("canvas");
      const k = dpr * scale;
      off.width = Math.max(1, Math.ceil(w * k)); off.height = Math.max(1, Math.ceil(h * k));
      const c = off.getContext("2d");
      if (c) { c.setTransform(k, 0, 0, k, -x0 * k, -y0 * k); paint(c); }
      return off;
    };

    const chromeAcross = (c: CanvasRenderingContext2D, x0: number, x1: number) => {
      const g = c.createLinearGradient(x0, 0, x1, 0);
      const stops: [number, string][] = [[0, "#3a3f47"], [0.08, "#a9b0ba"], [0.2, "#f4f6f8"], [0.27, "#ffffff"], [0.36, "#aeb5bf"], [0.5, "#565d68"], [0.62, "#2b3038"], [0.74, "#8e96a1"], [0.86, "#e6e9ed"], [0.94, "#7c838d"], [1, "#454a52"]];
      for (const [p, col] of stops) g.addColorStop(p, col);
      return g;
    };
    const chromeDown = (c: CanvasRenderingContext2D, y0: number, y1: number) => {
      const g = c.createLinearGradient(0, y0, 0, y1);
      const stops: [number, string][] = [[0, "#ffffff"], [0.16, "#dfe4ea"], [0.4, "#9aa3ae"], [0.5, "#3b4049"], [0.56, "#5c5140"], [0.74, "#c9a23a"], [0.9, "#f1d679"], [1, "#8a7a52"]];
      for (const [p, col] of stops) g.addColorStop(p, col);
      return g;
    };
    const enamel = (c: CanvasRenderingContext2D, half: number) => {
      const [r, g, b] = ENAMEL.split(",").map(Number);
      // Below 1 the paint is in shade, above 1 it is catching the lamp.
      const tone = (f: number) => (f <= 1 ? `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)})` : `rgb(${Math.round(r + (255 - r) * (f - 1))},${Math.round(g + (255 - g) * (f - 1))},${Math.round(b + (255 - b) * (f - 1))})`);
      const grad = c.createLinearGradient(-half, 0, half, 0);
      const stops: [number, number][] = [[0, 0.34], [0.06, 0.64], [0.2, 0.97], [0.3, 1.16], [0.44, 0.96], [0.66, 0.74], [0.86, 0.48], [0.95, 0.35], [1, 0.7]];
      for (const [p, f] of stops) grad.addColorStop(p, tone(f));
      return grad;
    };
    // A long soft-edged window reflection lying on a glossy curved surface.
    const streak = (c: CanvasRenderingContext2D, x: number, y0: number, y1: number, w: number, lean: number, alpha: number) => {
      c.save(); c.transform(1, 0, lean, 1, -lean * y0, 0);
      const g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
      g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(0.3, `rgba(255,255,255,${alpha})`); g.addColorStop(0.7, `rgba(255,255,255,${alpha})`); g.addColorStop(1, "rgba(255,255,255,0)");
      c.beginPath(); c.roundRect(x - w / 2, y0, w, y1 - y0, w / 2); c.fillStyle = g; c.fill(); c.restore();
    };
    const bolt = (c: CanvasRenderingContext2D, x: number, y: number, r: number) => {
      c.beginPath(); c.arc(x, y + 0.8, r + 0.8, 0, Math.PI * 2); c.fillStyle = "rgba(0,0,0,0.4)"; c.fill();
      const g = c.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.1, x, y, r); g.addColorStop(0, "#ffffff"); g.addColorStop(0.5, "#aab1bb"); g.addColorStop(1, "#4a4f58");
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = g; c.fill();
    };

    const paintBody = (c: CanvasRenderingContext2D) => {
      // Foot.
      c.save();
      c.beginPath(); c.moveTo(-124, 556); c.bezierCurveTo(-142, 558, -150, 572, -150, 586); c.ellipse(0, 586, 150, 12, 0, Math.PI, 0, true); c.bezierCurveTo(150, 572, 142, 558, 124, 556); c.closePath();
      c.fillStyle = enamel(c, 150); c.fill();
      const fs = c.createLinearGradient(0, 556, 0, 600); fs.addColorStop(0, "rgba(255,255,255,0.3)"); fs.addColorStop(0.25, "rgba(255,255,255,0)"); fs.addColorStop(1, "rgba(0,0,0,0.5)"); c.fillStyle = fs; c.fill();
      // Body: a cast shell that widens toward the foot.
      c.beginPath(); c.moveTo(-98, 342); c.bezierCurveTo(-110, 346, -113, 360, -114, 376); c.lineTo(-126, 552); c.quadraticCurveTo(0, 572, 126, 552); c.lineTo(114, 376); c.bezierCurveTo(113, 360, 110, 346, 98, 342); c.closePath();
      c.fillStyle = enamel(c, 126); c.fill();
      c.save(); c.clip();
      const top = c.createLinearGradient(0, 340, 0, 380); top.addColorStop(0, "rgba(0,0,0,0.6)"); top.addColorStop(0.5, "rgba(255,255,255,0.24)"); top.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = top; c.fillRect(-130, 340, 260, 40);
      const low = c.createLinearGradient(0, 470, 0, 566); low.addColorStop(0, "rgba(0,0,0,0)"); low.addColorStop(1, "rgba(0,0,0,0.5)"); c.fillStyle = low; c.fillRect(-130, 470, 260, 100);
      c.restore(); c.restore();
      streak(c, -86, 368, 546, 13, -0.068, 0.62); streak(c, -68, 380, 540, 4, -0.068, 0.34); streak(c, 96, 372, 546, 16, 0.068, 0.12);
      streak(c, -112, 566, 590, 9, -0.2, 0.5);
      // Chrome band where shell meets foot.
      c.beginPath(); c.moveTo(-126, 548); c.quadraticCurveTo(0, 568, 126, 548); c.lineTo(127, 558); c.quadraticCurveTo(0, 578, -127, 558); c.closePath(); c.fillStyle = chromeAcross(c, -127, 127); c.fill();
      c.lineWidth = 0.8; c.strokeStyle = "rgba(0,0,0,0.4)"; c.stroke();

      // Face plate.
      c.save(); c.shadowColor = "rgba(0,0,0,0.6)"; c.shadowBlur = 8; c.shadowOffsetY = 3 * dpr * scale;
      c.beginPath(); c.roundRect(-56, 372, 112, 98, 14); c.fillStyle = chromeDown(c, 372, 470); c.fill(); c.restore();
      c.lineWidth = 1.2; c.strokeStyle = "rgba(255,255,255,0.9)"; c.beginPath(); c.roundRect(-55, 373, 110, 96, 13); c.stroke();
      c.lineWidth = 1; c.strokeStyle = "rgba(20,22,28,0.45)"; c.beginPath(); c.roundRect(-50, 378, 100, 86, 10); c.stroke();
      for (const [bx, by] of [[-44, 384], [44, 384], [-44, 458], [44, 458]]) bolt(c, bx, by, 2.6);
      // The well the crank turns in.
      const well = c.createRadialGradient(CRANK.x, CRANK.y - 4, 8, CRANK.x, CRANK.y, 36);
      well.addColorStop(0, "#14161a"); well.addColorStop(0.8, "#2a2e35"); well.addColorStop(1, "#0c0d10");
      c.beginPath(); c.arc(CRANK.x, CRANK.y, 35, 0, Math.PI * 2); c.fillStyle = well; c.fill();
      c.lineWidth = 2; c.strokeStyle = chromeDown(c, CRANK.y - 37, CRANK.y + 37); c.beginPath(); c.arc(CRANK.x, CRANK.y, 36, 0, Math.PI * 2); c.stroke();
      c.lineWidth = 1; c.strokeStyle = "rgba(0,0,0,0.5)"; c.beginPath(); c.arc(CRANK.x, CRANK.y, 37.4, 0, Math.PI * 2); c.stroke();

      // Chute: chrome surround and the dark mouth.
      c.save(); c.shadowColor = "rgba(0,0,0,0.6)"; c.shadowBlur = 7; c.shadowOffsetY = 3 * dpr * scale;
      c.beginPath(); c.roundRect(DOOR.x - 7, DOOR.y - 7, DOOR.w + 14, DOOR.h + 14, 13); c.fillStyle = chromeDown(c, DOOR.y - 7, DOOR.y + DOOR.h + 7); c.fill(); c.restore();
      c.lineWidth = 1; c.strokeStyle = "rgba(255,255,255,0.85)"; c.beginPath(); c.roundRect(DOOR.x - 6.4, DOOR.y - 6.4, DOOR.w + 12.8, DOOR.h + 12.8, 12.4); c.stroke();
      const mouth = c.createLinearGradient(0, DOOR.y, 0, DOOR.y + DOOR.h); mouth.addColorStop(0, "#050506"); mouth.addColorStop(0.7, "#1c1a1a"); mouth.addColorStop(1, "#3a2f24");
      c.beginPath(); c.roundRect(DOOR.x, DOOR.y, DOOR.w, DOOR.h, 7); c.fillStyle = mouth; c.fill();
    };

    const collar = (c: CanvasRenderingContext2D) => {
      // The chrome ring the globe is clamped into.
      c.beginPath(); c.ellipse(0, 320, 97, 13, 0, 0, Math.PI); c.lineTo(-101, 340); c.ellipse(0, 340, 101, 14, 0, Math.PI, 0, true); c.closePath();
      c.fillStyle = chromeAcross(c, -101, 101); c.fill();
      c.lineWidth = 1.2; c.strokeStyle = "rgba(255,255,255,0.9)"; c.beginPath(); c.ellipse(0, 320, 97, 13, 0, 0.06, Math.PI - 0.06); c.stroke();
      c.lineWidth = 1; c.strokeStyle = "rgba(10,12,16,0.6)"; c.beginPath(); c.ellipse(0, 340, 101, 14, 0, 0.04, Math.PI - 0.04); c.stroke();
      c.strokeStyle = "rgba(10,12,16,0.3)"; c.beginPath(); c.ellipse(0, 329, 99, 13.5, 0, 0.04, Math.PI - 0.04); c.stroke();
    };

    const paintLid = (c: CanvasRenderingContext2D) => {
      c.save();
      c.beginPath(); c.moveTo(-70, 96); c.bezierCurveTo(-70, 70, -40, 54, 0, 54); c.bezierCurveTo(40, 54, 70, 70, 70, 96); c.ellipse(0, 96, 70, 9, 0, 0, Math.PI); c.closePath();
      c.fillStyle = enamel(c, 70); c.fill();
      const dome = c.createLinearGradient(0, 54, 0, 106); dome.addColorStop(0, "rgba(255,255,255,0.42)"); dome.addColorStop(0.4, "rgba(255,255,255,0)"); dome.addColorStop(1, "rgba(0,0,0,0.45)"); c.fillStyle = dome; c.fill();
      c.restore();
      c.save(); c.beginPath(); c.ellipse(-30, 70, 20, 6, -0.5, 0, Math.PI * 2); const sp = c.createRadialGradient(-30, 70, 0, -30, 70, 20); sp.addColorStop(0, "rgba(255,255,255,0.85)"); sp.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = sp; c.fill(); c.restore();
      c.beginPath(); c.ellipse(0, 92, 71, 9, 0, 0, Math.PI); c.lineTo(-72, 100); c.ellipse(0, 100, 72, 9.5, 0, Math.PI, 0, true); c.closePath(); c.fillStyle = chromeAcross(c, -72, 72); c.fill();
      c.lineWidth = 0.8; c.strokeStyle = "rgba(10,12,16,0.5)"; c.stroke();
      // Finial.
      c.fillStyle = chromeAcross(c, -5, 5); c.fillRect(-4, 44, 8, 12);
      const knob = c.createRadialGradient(-3.5, 33, 1, 0, 37, 11); knob.addColorStop(0, "#ffffff"); knob.addColorStop(0.35, "#c6ccd4"); knob.addColorStop(0.7, "#4b515b"); knob.addColorStop(0.86, "#b99a3c"); knob.addColorStop(1, "#6d6240");
      c.beginPath(); c.arc(0, 37, 10.5, 0, Math.PI * 2); c.fillStyle = knob; c.fill();
    };

    const gumSprite = (rgb: string) => bake(-20, -20, 40, 40, (c) => {
      const [r, g, b] = rgb.split(",").map(Number), r0 = BALL;
      const mix = (k: number, to: number) => `rgb(${Math.round(r + (to - r) * k)},${Math.round(g + (to - g) * k)},${Math.round(b + (to - b) * k)})`;
      const body2 = c.createRadialGradient(-r0 * 0.34, -r0 * 0.4, r0 * 0.05, -r0 * 0.1, -r0 * 0.1, r0 * 1.12);
      body2.addColorStop(0, mix(0.5, 255)); body2.addColorStop(0.3, mix(0.08, 255)); body2.addColorStop(0.72, mix(0.3, 0)); body2.addColorStop(1, mix(0.62, 0));
      c.beginPath(); c.arc(0, 0, r0, 0, Math.PI * 2); c.fillStyle = body2; c.fill();
      c.save(); c.clip();
      const under = c.createRadialGradient(r0 * 0.25, r0 * 0.75, 0, r0 * 0.25, r0 * 0.75, r0 * 0.8); under.addColorStop(0, "rgba(255,236,170,0.5)"); under.addColorStop(1, "rgba(255,236,170,0)");
      c.fillStyle = under; c.fillRect(-r0, -r0, r0 * 2, r0 * 2);
      c.restore();
      c.beginPath(); c.ellipse(-r0 * 0.36, -r0 * 0.46, r0 * 0.3, r0 * 0.17, -0.66, 0, Math.PI * 2);
      const sp = c.createLinearGradient(0, -r0 * 0.8, 0, -r0 * 0.2); sp.addColorStop(0, "rgba(255,255,255,0.98)"); sp.addColorStop(1, "rgba(255,255,255,0.35)"); c.fillStyle = sp; c.fill();
      c.beginPath(); c.arc(-r0 * 0.02, -r0 * 0.66, r0 * 0.06, 0, Math.PI * 2); c.fillStyle = "rgba(255,255,255,0.7)"; c.fill();
    });

    const paintRear = (c: CanvasRenderingContext2D) => {
      c.save(); c.beginPath(); c.arc(GX, GY, GR - 3, 0, Math.PI * 2); c.clip();
      for (const b of ghost) c.drawImage(sprites[b.c], b.x * 0.94 - 18.5, (b.y - GY) * 0.94 + GY - 22, 37, 37);
      c.globalCompositeOperation = "source-atop"; c.fillStyle = "rgba(70,30,0,0.42)"; c.fillRect(GX - GR, GY - GR, GR * 2, GR * 2);
      c.restore();
    };

    const handle = (angle: number) => {
      // The butterfly handle. Its shape turns; the chrome reflections stay where the room is.
      const k = dpr * scale;
      const path = () => {
        ctx.save(); ctx.translate(CRANK.x, CRANK.y); ctx.rotate(angle);
        ctx.beginPath(); ctx.moveTo(-40, -15); ctx.bezierCurveTo(-18, -13, -12, -6, 0, -6); ctx.bezierCurveTo(12, -6, 18, -13, 40, -15);
        ctx.bezierCurveTo(47, -9, 47, 9, 40, 15); ctx.bezierCurveTo(18, 13, 12, 6, 0, 6); ctx.bezierCurveTo(-12, 6, -18, 13, -40, 15); ctx.bezierCurveTo(-47, 9, -47, -9, -40, -15); ctx.closePath();
        ctx.restore();
      };
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 9 * k; ctx.shadowOffsetX = 3 * k; ctx.shadowOffsetY = 6 * k; path(); ctx.fillStyle = "#555"; ctx.fill(); ctx.restore();
      path(); ctx.fillStyle = chromeDown(ctx, CRANK.y - 34, CRANK.y + 36); ctx.fill();
      ctx.save(); ctx.clip();
      const side = ctx.createLinearGradient(CRANK.x - 44, 0, CRANK.x + 44, 0); side.addColorStop(0, "rgba(255,255,255,0.5)"); side.addColorStop(0.3, "rgba(255,255,255,0)"); side.addColorStop(0.75, "rgba(0,0,0,0)"); side.addColorStop(1, "rgba(0,0,0,0.4)");
      ctx.fillStyle = side; ctx.fillRect(CRANK.x - 50, CRANK.y - 50, 100, 100); ctx.restore();
      path(); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.stroke();
      const hub = ctx.createRadialGradient(CRANK.x - 3, CRANK.y - 4, 1, CRANK.x, CRANK.y, 10);
      hub.addColorStop(0, "#ffffff"); hub.addColorStop(0.4, "#b9c0c9"); hub.addColorStop(0.75, "#444a54"); hub.addColorStop(1, "#a8905a");
      ctx.beginPath(); ctx.arc(CRANK.x, CRANK.y, 9, 0, Math.PI * 2); ctx.fillStyle = hub; ctx.fill();
      ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.stroke();
      ctx.save(); ctx.translate(CRANK.x, CRANK.y); ctx.rotate(angle); ctx.fillStyle = "rgba(20,22,26,0.7)"; ctx.fillRect(-5.5, -0.8, 11, 1.6); ctx.restore();
    };

    const gum = (x: number, y: number, c: number, size: number) => ctx.drawImage(sprites[c], x - 20 * size, y - 20 * size, 40 * size, 40 * size);
    const view = () => box.width / 2 / scale; // half the stage width in drawing units

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      const k = dpr * scale;
      ctx.setTransform(k, 0, 0, k, ox * dpr, oy * dpr);

      // Shadow of the machine on the paper.
      const sh = ctx.createRadialGradient(18, 596, 30, 18, 596, 250);
      sh.addColorStop(0, "rgba(120,62,0,0.62)"); sh.addColorStop(0.55, "rgba(120,62,0,0.22)"); sh.addColorStop(1, "rgba(120,62,0,0)");
      ctx.save(); ctx.translate(0, 596); ctx.scale(1, 0.12); ctx.translate(0, -596); ctx.fillStyle = sh; ctx.fillRect(-260, 330, 560, 540); ctx.restore();

      if (body) ctx.drawImage(body, -160, 330, 320, 280);

      // Globe: the paper seen through it, the back of the pile, the live pile, then the glass.
      ctx.save(); ctx.beginPath(); ctx.rect(GX - GR - 4, GY - GR - 4, GR * 2 + 8, 320 - (GY - GR - 4)); ctx.ellipse(0, 320, 97, 13, 0, 0, Math.PI); ctx.clip();
      const air = ctx.createRadialGradient(GX - 30, GY - 40, GR * 0.1, GX, GY, GR);
      air.addColorStop(0, "rgba(255,255,255,0.34)"); air.addColorStop(0.7, "rgba(255,255,255,0.16)"); air.addColorStop(0.93, "rgba(150,90,0,0.1)"); air.addColorStop(1, "rgba(255,255,255,0.5)");
      ctx.beginPath(); ctx.arc(GX, GY, GR, 0, Math.PI * 2); ctx.fillStyle = air; ctx.fill();
      if (rear) ctx.drawImage(rear, GX - GR, GY - GR, GR * 2, GR * 2);
      ctx.save(); ctx.beginPath(); ctx.arc(GX, GY, GR - 2, 0, Math.PI * 2); ctx.clip();
      for (const b of pile) gum(b.x, b.y, b.c, 1);
      const wall = ctx.createRadialGradient(GX, GY, GR * 0.78, GX, GY, GR);
      wall.addColorStop(0, "rgba(60,30,0,0)"); wall.addColorStop(0.84, "rgba(60,30,0,0.16)"); wall.addColorStop(0.96, "rgba(60,30,0,0.05)"); wall.addColorStop(1, "rgba(255,255,255,0.6)");
      ctx.fillStyle = wall; ctx.fillRect(GX - GR, GY - GR, GR * 2, GR * 2);
      const la = -2.28 + s.light;
      ctx.save(); ctx.translate(GX, GY); ctx.rotate(la + Math.PI / 2);
      const pane = ctx.createLinearGradient(0, -GR * 0.94, 0, -GR * 0.5);
      pane.addColorStop(0, "rgba(255,255,255,0.72)"); pane.addColorStop(0.55, "rgba(255,255,255,0.2)"); pane.addColorStop(1, "rgba(255,255,255,0)");
      ctx.beginPath(); ctx.arc(0, 0, GR * 0.93, -Math.PI / 2 - 0.5, -Math.PI / 2 + 0.26); ctx.arc(0, 0, GR * 0.5, -Math.PI / 2 + 0.16, -Math.PI / 2 - 0.36, true); ctx.closePath(); ctx.fillStyle = pane; ctx.fill();
      ctx.rotate(Math.PI - 0.3);
      const bounce = ctx.createLinearGradient(0, -GR * 0.97, 0, -GR * 0.78);
      bounce.addColorStop(0, "rgba(255,244,200,0.7)"); bounce.addColorStop(1, "rgba(255,244,200,0)");
      ctx.beginPath(); ctx.arc(0, 0, GR * 0.97, -Math.PI / 2 - 0.7, -Math.PI / 2 + 0.7); ctx.arc(0, 0, GR * 0.8, -Math.PI / 2 + 0.56, -Math.PI / 2 - 0.56, true); ctx.closePath(); ctx.fillStyle = bounce; ctx.fill();
      ctx.restore();
      const hx = GX + Math.cos(la - 0.56) * GR * 0.8, hy = GY + Math.sin(la - 0.56) * GR * 0.8;
      const hot = ctx.createRadialGradient(hx, hy, 0, hx, hy, 12); hot.addColorStop(0, "rgba(255,255,255,1)"); hot.addColorStop(0.3, "rgba(255,255,255,0.7)"); hot.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = hot; ctx.fillRect(hx - 12, hy - 12, 24, 24);
      ctx.restore();
      const rim = ctx.createLinearGradient(GX - GR, GY - GR, GX + GR, GY + GR);
      rim.addColorStop(0, "rgba(255,255,255,1)"); rim.addColorStop(0.45, "rgba(255,255,255,0.5)"); rim.addColorStop(0.8, "rgba(120,70,0,0.35)"); rim.addColorStop(1, "rgba(255,255,255,0.8)");
      ctx.beginPath(); ctx.arc(GX, GY, GR - 0.7, 0, Math.PI * 2); ctx.lineWidth = 1.8; ctx.strokeStyle = rim; ctx.stroke();
      ctx.restore();
      collar(ctx);
      if (lid) ctx.drawImage(lid, -80, 20 - s.lidHop, 160, 96);

      // Chute: the gumball coming out, then the flap hinged along the top.
      const o = s.out;
      const openH = DOOR.h * (1 - 0.86 * s.flap);
      if (o && o.t > 0.3 && o.t <= 0.52) {
        ctx.save(); ctx.beginPath(); ctx.roundRect(DOOR.x, DOOR.y, DOOR.w, DOOR.h, 7); ctx.clip();
        const q = (o.t - 0.3) / 0.22; gum(DOOR.x + DOOR.w / 2, DOOR.y + 14 + q * q * 26, o.c, 0.84 + q * 0.1); ctx.restore();
      }
      ctx.save(); ctx.beginPath(); ctx.roundRect(DOOR.x + 1.5, DOOR.y + 1, DOOR.w - 3, Math.max(4, openH - 2), [5, 5, 5 + s.flap * 3, 5 + s.flap * 3]);
      ctx.fillStyle = chromeDown(ctx, DOOR.y - 6 - s.flap * 20, DOOR.y + openH + 2); ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = "rgba(255,255,255,0.75)"; ctx.stroke();
      ctx.fillStyle = "rgba(0,0,0,0.45)"; ctx.fillRect(DOOR.x + 1.5, DOOR.y + Math.max(4, openH - 2) + 1, DOOR.w - 3, 2.5 * s.flap);
      ctx.restore();
      ctx.save(); ctx.font = "700 7.5px ui-monospace, SFMono-Regular, Menlo, monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.globalAlpha = 1 - s.flap;
      ctx.fillStyle = "rgba(255,255,255,0.7)"; ctx.fillText("L I F T", 0, DOOR.y + DOOR.h - 11.2); ctx.fillStyle = "rgba(24,26,32,0.8)"; ctx.fillText("L I F T", 0, DOOR.y + DOOR.h - 12); ctx.restore();

      handle(s.crank);

      // Gumballs on the table.
      const shadowAt = (x: number, a: number) => {
        const g = ctx.createRadialGradient(x + 3, TABLE + BALL - 1, 1, x + 3, TABLE + BALL - 1, 24);
        g.addColorStop(0, `rgba(110,56,0,${0.6 * a})`); g.addColorStop(1, "rgba(110,56,0,0)");
        ctx.save(); ctx.translate(0, TABLE + BALL - 1); ctx.scale(1, 0.3); ctx.translate(0, -(TABLE + BALL - 1)); ctx.fillStyle = g; ctx.fillRect(x - 24, TABLE + BALL - 26, 54, 52); ctx.restore();
      };
      for (const r of table) { shadowAt(r.x, 1); gum(r.x, TABLE, r.c, 1); }
      if (o && o.t > 0.52) {
        const q = Math.min(1, (o.t - 0.52) / 0.3), fall = DOOR.y + 40 + (TABLE - DOOR.y - 40) * q * q;
        const hop = o.t > 0.82 ? -14 * Math.abs(Math.sin((o.t - 0.82) * 11)) * Math.exp(-(o.t - 0.82) * 6) : 0;
        shadowAt(o.t > 0.82 ? o.dir * (o.t - 0.82) * 190 : 0, q);
        gum(o.t > 0.82 ? o.dir * (o.t - 0.82) * 190 : 0, fall + hop, o.c, 0.94 + q * 0.06);
      }
    };

    const fit = () => {
      box = cv.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(box.width * dpr); cv.height = Math.round(box.height * dpr);
      const bottom = box.width < 640 ? 100 : 74;
      scale = Math.min(box.width / 400, (box.height - bottom) / 640);
      ox = box.width / 2; oy = Math.max(0, (box.height - bottom - 640 * scale) / 2);
      const d = 104 * scale;
      pad.style.left = `${ox + CRANK.x * scale - d / 2}px`; pad.style.top = `${oy + CRANK.y * scale - d / 2}px`; pad.style.width = `${d}px`; pad.style.height = `${d}px`;
      sprites = COLOURS.map(gumSprite);
      body = bake(-160, 330, 320, 280, paintBody);
      lid = bake(-80, 20, 160, 96, paintLid);
      rear = bake(GX - GR, GY - GR, GR * 2, GR * 2, paintRear);
    };

    // Take the gumball nearest the hole in the shelf and send it down the chute.
    const deal = () => {
      if (!pile.length) return;
      let best = 0, score = -1e9;
      pile.forEach((b, i) => { const v = b.y - Math.abs(b.x) * 0.8; if (v > score) { score = v; best = i; } });
      const [b] = pile.splice(best, 1);
      dir = -dir; s.out = { c: b.c, t: 0, dir };
      dealt += 1; setServed(dealt);
    };
    const refill = (c: number) => { const x = (Math.random() - 0.5) * 30; pile.push({ x, y: 104, px: x, py: 101, c }); s.lidHop = 7; };

    let raf = 0, last = 0, time = 0, acc = 0, seen = true, touched = -1e9, nextDemo = 0.35;
    const step = (dt: number) => {
      time += dt;
      // Crank: a spring toward the next stop. Each full turn deals one gumball.
      if (!s.drag) { s.crankV += (70 * (s.crankTo - s.crank) - 12 * s.crankV) * dt; s.crank += s.crankV * dt; }
      const turns = Math.floor((s.crank + 0.12) / (Math.PI * 2));
      if (turns > s.turns) { s.queue += turns - s.turns; s.turns = turns; }
      if (s.queue > 0 && !s.out) { s.queue -= 1; deal(); }
      if (s.out) {
        const o = s.out; o.t += dt;
        if (o.t > 1.0) { table.push({ x: o.dir * 0.18 * 190, vx: o.dir * (170 + Math.random() * 120), c: o.c, age: 0, leave: false }); s.out = null; }
      }
      const open = s.out && s.out.t > 0.18 && s.out.t < 0.8 ? 1 : 0;
      s.flap += (open - s.flap) * Math.min(1, dt * (open ? 16 : 9));
      s.lidHop += (0 - s.lidHop) * Math.min(1, dt * 9);
      s.light += (s.lightTo - s.light) * Math.min(1, dt * 5);

      // Rolling on the table: friction, bumping, and the oldest one making room.
      const live = table.filter((r) => !r.leave);
      if (live.length > 5) live.sort((a, b) => b.age - a.age)[0].leave = true;
      for (const r of table) {
        r.age += dt;
        if (r.leave) r.vx += (r.x >= 0 ? 1 : -1) * 420 * dt;
        else { const f = 80 * dt; r.vx = Math.abs(r.vx) <= f ? 0 : r.vx - Math.sign(r.vx) * f; }
        r.x += r.vx * dt;
      }
      for (let i = 0; i < table.length; i++) for (let j = i + 1; j < table.length; j++) {
        const a = table[i], b = table[j], dx = b.x - a.x, gap = BALL * 2 - Math.abs(dx);
        if (gap <= 0) continue;
        const sgn = dx >= 0 ? 1 : -1; a.x -= (sgn * gap) / 2; b.x += (sgn * gap) / 2;
        if ((b.vx - a.vx) * sgn < 0) { const av = a.vx; a.vx = b.vx * 0.86; b.vx = av * 0.86; }
      }
      for (let i = table.length - 1; i >= 0; i--) if (Math.abs(table[i].x) > view() + 30) { refill(table[i].c); table.splice(i, 1); }

      acc += dt;
      const stir = Math.min(0.7, Math.abs(s.crankV) * 0.08); // the wheel under the shelf rattles the bottom row
      while (acc >= 1 / 120) { settle(pile, 1 / 120, stir); acc -= 1 / 120; }
    };

    const frame = (now: number) => {
      raf = 0;
      if (!last) last = now;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (time > nextDemo && now - touched > 5000 && !s.drag) { s.crankTo += Math.PI * 2; nextDemo = time + 2.7; }
      step(dt); draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = 0; raf = requestAnimationFrame(frame); } };

    api.current = {
      turn: () => {
        touched = performance.now();
        if (reduce) {
          // No motion: hand over the next gumball and redraw once.
          if (!pile.length) return;
          deal(); const o = s.out; s.out = null;
          if (o) { table.push({ x: o.dir * (60 + table.length * 34), vx: 0, c: o.c, age: 0, leave: false }); if (table.length > 6) { const old = table.shift(); if (old) refill(old.c); s.lidHop = 0; } }
          for (let i = 0; i < 300; i++) settle(pile, 1 / 120, 0);
          draw(); return;
        }
        if (s.crankTo - s.crank < Math.PI * 4) s.crankTo += Math.PI * 2;
        wake();
      },
    };

    const centre = () => ({ x: box.left + ox + CRANK.x * scale, y: box.top + oy + CRANK.y * scale });
    let lastA = 0, moved = 0;
    const onDown = (e: PointerEvent) => {
      if (reduce) return;
      box = cv.getBoundingClientRect();
      const c = centre(); lastA = Math.atan2(e.clientY - c.y, e.clientX - c.x); moved = 0;
      s.drag = true; s.crankV = 0; touched = performance.now();
      pad.setPointerCapture(e.pointerId); e.preventDefault(); wake();
    };
    const onMove = (e: PointerEvent) => {
      if (!s.drag) return;
      const c = centre(), a = Math.atan2(e.clientY - c.y, e.clientX - c.x);
      let d = a - lastA; if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2;
      lastA = a; moved += Math.abs(d); touched = performance.now();
      // A ratchet: it only turns clockwise.
      if (d > 0) { s.crank += d; s.crankV = d * 60; }
    };
    const onUp = () => {
      if (!s.drag) return;
      s.drag = false; touched = performance.now();
      const full = Math.PI * 2, past = s.crank - s.turns * full;
      s.crankTo = moved < 0.06 ? (s.turns + 1) * full : past > 0.5 ? (s.turns + 1) * full : s.turns * full;
      s.crankV = Math.min(s.crankV, 14);
    };
    // A knock on the glass makes the pile jump.
    const onKnock = (e: PointerEvent) => {
      box = cv.getBoundingClientRect();
      const x = (e.clientX - box.left - ox) / scale, y = (e.clientY - box.top - oy) / scale;
      s.lightTo = Math.max(-0.3, Math.min(0.3, x * 0.001));
      if (e.type !== "pointerdown" || reduce || Math.hypot(x - GX, y - GY) > GR) return;
      touched = performance.now();
      for (const b of pile) { b.px = b.x - (Math.random() - 0.5) * 5; b.py = b.y + 1.5 + Math.random() * 4; }
    };
    pad.addEventListener("pointerdown", onDown);
    pad.addEventListener("pointermove", onMove);
    pad.addEventListener("pointerup", onUp);
    pad.addEventListener("pointercancel", onUp);
    cv.addEventListener("pointerdown", onKnock);
    cv.addEventListener("pointermove", onKnock);

    fit();
    if (reduce) draw(); else wake();
    const ro = new ResizeObserver(() => { fit(); if (reduce || !raf) draw(); });
    ro.observe(cv);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); api.current = null;
      pad.removeEventListener("pointerdown", onDown); pad.removeEventListener("pointermove", onMove);
      pad.removeEventListener("pointerup", onUp); pad.removeEventListener("pointercancel", onUp);
      cv.removeEventListener("pointerdown", onKnock); cv.removeEventListener("pointermove", onKnock);
      ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div className="relative flex h-[620px] w-full flex-col overflow-hidden sm:h-[740px]" style={{ backgroundColor: STAGE, backgroundImage: "radial-gradient(90% 70% at 46% 30%, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0) 60%), linear-gradient(180deg, rgba(160,84,0,0) 62%, rgba(160,84,0,0.2) 100%)" }}>
      <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
      <div ref={hit} aria-hidden="true" className="absolute cursor-grab touch-none rounded-full active:cursor-grabbing" />
      <div className="pointer-events-none relative mx-auto mt-auto flex w-full max-w-[880px] flex-col items-center gap-3 px-5 pb-6 text-[13px] sm:flex-row sm:justify-between sm:pb-8">
        <p className="text-center text-[#5b2c02] sm:text-left">
          <span className="font-semibold text-[#3a1a00]">Gumball machine</span>
          <span className="mx-2 opacity-50">/</span>
          turn the handle, or knock on the glass
          <span aria-live="polite" className="sr-only">{served > 0 ? `${served} ${served === 1 ? "gumball" : "gumballs"} out.` : ""}</span>
        </p>
        <button
          type="button"
          onClick={() => api.current?.turn()}
          className="pointer-events-auto min-h-[40px] shrink-0 rounded-full bg-[#b91616] px-5 font-medium text-white shadow-[0_12px_22px_-10px_rgba(120,20,0,0.75)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3a1a00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5c62f] motion-reduce:transition-none"
        >
          Turn the crank
        </button>
      </div>
    </div>
  );
}
