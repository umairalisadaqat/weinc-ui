import { useEffect, useRef, useState } from "react";

// Everything a visitor is likely to change sits here.
const sides = [{ label: "Opened", start: 38 }, { label: "Closed", start: 26 }]; // left end, right end
const CAPTION = "Support tickets this week";
const demo: [number, number][] = [[32, 32], [29, 36], [33, 33], [38, 26]]; // played in turn until somebody touches a button
const DEMO_FIRST = 700, DEMO_EVERY = 3600; // milliseconds
const TILT_GAIN = 40; // degrees of lean for a completely one-sided split
const MAX_TILT = 5; // the shelf stops here
const LEVEL_BAND = 0.075; // share of full lean that still reads as level
const ANODISE = ["#f0633c", "#d4441f", "#a93014"]; // top, middle and bottom of the coloured web
const SPIRIT = ["#a9c414", "#e4f84a", "#cfea2c", "#b4d51a", "#f6ffa0", "#7a9806"]; // the liquid, top to bottom

const TAU = Math.PI * 2;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
// From two numbers to a lean between -1 (left end down) and 1 (right end down).
const lean = (a: number, b: number) => (a + b === 0 ? 0 : clamp((((b - a) / (a + b)) * TILT_GAIN) / MAX_TILT, -1, 1));

const layoutFor = (narrow: boolean) =>
  narrow
    ? { W: 380, H: 236, PX: 186, PY: 150, PL: 326, PT: 14, BL: 304, BH: 80, rail: 8, cap: 13, VL: 116, VR: 14, BW: 34, port: 22, portAt: 106, holes: [] as number[], holeW: 0 }
    : { W: 900, H: 300, PX: 446, PY: 196, PL: 800, PT: 18, BL: 660, BH: 100, rail: 10, cap: 18, VL: 156, VR: 18, BW: 46, port: 29, portAt: 268, holes: [-160, 160], holeW: 92 };

export default function SpiritLevelBalanceIndicator() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [narrow, setNarrow] = useState(false);
  const [vals, setVals] = useState<[number, number]>([sides[0].start, sides[1].start]);
  const [touched, setTouched] = useState(false);
  const live = useRef({ f: lean(sides[0].start, sides[1].start), touched: false });
  const api = useRef<{ poke: (push?: number) => void } | null>(null);

  const show = (next: [number, number]) => { live.current.f = lean(next[0], next[1]); setVals(next); api.current?.poke(); };

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setNarrow(el.clientWidth < 760));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // The self-playing demonstration.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let i = 0, id = 0;
    const next = () => {
      if (live.current.touched) return;
      if (!document.hidden) { show(demo[i % demo.length]); i++; }
      id = window.setTimeout(next, DEMO_EVERY);
    };
    id = window.setTimeout(next, DEMO_FIRST);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const L = layoutFor(narrow);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let k = 1; // canvas pixels per design pixel
    const PAD = 46, RW = L.PL + PAD * 2, RH = L.BH + L.PT + PAD * 2, OY = PAD + L.BH + L.PT / 2; // the sprite that tilts, and where its pivot sits
    const bx = -L.BL / 2, by = -(L.PT / 2 + L.BH), vy = by + L.BH / 2; // body corner and the height of the vials
    const maxPos = L.VL / 2 - L.BW / 2 - 7; // how far the bubble can run from centre
    const winW = L.VL + 30, winH = L.VR * 2 + 22;

    const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    };
    const steel = (c: CanvasRenderingContext2D, x: number, y: number, r: number) => {
      const g = c.createLinearGradient(x - r, y - r, x + r, y + r);
      g.addColorStop(0, "#fbfbfb"); g.addColorStop(0.4, "#a5a8ac"); g.addColorStop(0.6, "#dfe1e3"); g.addColorStop(1, "#6a6d71");
      return g;
    };

    // The shelf and the level body are painted once into a sprite, and so is the shadow they throw on the wall.
    const rig = document.createElement("canvas"), shade = document.createElement("canvas");
    const build = () => {
      const g = rig.getContext("2d"), sc = shade.getContext("2d");
      if (!g || !sc) return;
      rig.width = shade.width = Math.round(RW * k); rig.height = shade.height = Math.round(RH * k);
      g.setTransform(k, 0, 0, k, (RW / 2) * k, OY * k);
      let seed = 23;
      const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

      // Oak shelf, seen edge on.
      const px = -L.PL / 2, py = -L.PT / 2;
      const oak = g.createLinearGradient(0, py, 0, py + L.PT);
      oak.addColorStop(0, "#ecd2a4"); oak.addColorStop(0.16, "#d9b884"); oak.addColorStop(0.7, "#c39c68"); oak.addColorStop(1, "#8e6a3f");
      rr(g, px, py, L.PL, L.PT, 2.5); g.fillStyle = oak; g.fill();
      g.save(); rr(g, px, py, L.PL, L.PT, 2.5); g.clip();
      for (let i = 0; i < 46; i++) {
        const y0 = py + rand() * L.PT, x0 = px + rand() * L.PL * 0.9 - 40, len = 80 + rand() * 340, bend = (rand() - 0.5) * 3.4;
        g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x0 + len / 2, y0 + bend, x0 + len, y0 + (rand() - 0.5) * 1.6);
        g.lineWidth = 0.5 + rand() * 0.7; g.strokeStyle = rand() > 0.3 ? `rgba(92,58,22,${0.1 + rand() * 0.2})` : `rgba(255,240,205,${0.16 + rand() * 0.2})`; g.stroke();
      }
      g.fillStyle = "rgba(255,246,222,0.75)"; g.fillRect(px, py, L.PL, 1);
      g.fillStyle = "rgba(50,30,8,0.4)"; g.fillRect(px, py + L.PT - 1.2, L.PL, 1.2);
      // Where the level rests it keeps the light off the wood.
      const rest = g.createLinearGradient(0, py, 0, py + 5);
      rest.addColorStop(0, "rgba(40,24,4,0.5)"); rest.addColorStop(1, "rgba(40,24,4,0)");
      g.fillStyle = rest; g.fillRect(bx + 2, py, L.BL - 4, 5);
      g.restore();

      // Box-section body: two milled rails and an anodised web between them.
      g.save(); rr(g, bx, by, L.BL, L.BH, 2.5); g.clip();
      const web = g.createLinearGradient(0, by, 0, by + L.BH);
      web.addColorStop(0, ANODISE[0]); web.addColorStop(0.5, ANODISE[1]); web.addColorStop(1, ANODISE[2]);
      g.fillStyle = web; g.fillRect(bx, by, L.BL, L.BH);
      for (let y = by; y < by + L.BH; y += 0.5) {
        const v = rand(), x0 = bx + rand() * L.BL * 0.3, x1 = bx + L.BL - rand() * L.BL * 0.3;
        g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.lineWidth = 0.5;
        g.strokeStyle = v > 0.5 ? `rgba(255,220,200,${(v - 0.5) * 0.3})` : `rgba(70,10,0,${(0.5 - v) * 0.3})`; g.stroke();
      }
      // A long soft reflection running the length of the web, as anodised metal gives.
      const sheen = g.createLinearGradient(0, by + L.rail, 0, by + L.BH - L.rail);
      sheen.addColorStop(0, "rgba(40,6,0,0.4)"); sheen.addColorStop(0.1, "rgba(40,6,0,0)"); sheen.addColorStop(0.24, "rgba(255,226,208,0.3)"); sheen.addColorStop(0.36, "rgba(255,226,208,0)"); sheen.addColorStop(0.88, "rgba(40,6,0,0)"); sheen.addColorStop(1, "rgba(255,190,160,0.35)");
      g.fillStyle = sheen; g.fillRect(bx, by + L.rail, L.BL, L.BH - L.rail * 2);
      for (const top of [true, false]) {
        const y = top ? by : by + L.BH - L.rail, rail = g.createLinearGradient(0, y, 0, y + L.rail);
        if (top) { rail.addColorStop(0, "#ffffff"); rail.addColorStop(0.2, "#e6e8ea"); rail.addColorStop(0.75, "#b8bcc1"); rail.addColorStop(1, "#7f8388"); }
        else { rail.addColorStop(0, "#eceef0"); rail.addColorStop(0.18, "#b3b7bc"); rail.addColorStop(0.8, "#8b8f95"); rail.addColorStop(1, "#5c6065"); }
        g.fillStyle = rail; g.fillRect(bx, y, L.BL, L.rail);
        for (let yy = y; yy < y + L.rail; yy += 0.5) { g.fillStyle = rand() > 0.5 ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"; g.fillRect(bx, yy, L.BL, 0.5); }
      }
      // A millimetre scale engraved along the top rail.
      for (let i = 0, x = bx + L.cap + 6; x < bx + L.BL - L.cap - 5; x += 4, i++) {
        g.fillStyle = "rgba(28,30,34,0.72)"; const th = i % 10 === 0 ? L.rail * 0.72 : i % 5 === 0 ? L.rail * 0.52 : L.rail * 0.32; g.fillRect(x, by + L.rail - th, 0.7, th);
      }
      g.restore();

      // Milled openings: a chamfer ring first, then the pocket.
      const chamfer = (y0: number, y1: number) => { const c = g.createLinearGradient(0, y0, 0, y1); c.addColorStop(0, "#5a1606"); c.addColorStop(0.45, "#a2300f"); c.addColorStop(1, "#ffa583"); return c; };
      const holeH = L.BH * 0.34, holeY = vy - holeH / 2;
      for (const hx of L.holes) { rr(g, hx - L.holeW / 2 - 3, holeY - 3, L.holeW + 6, holeH + 6, holeH / 2 + 3); g.fillStyle = chamfer(holeY - 3, holeY + holeH + 3); g.fill(); }
      rr(g, -winW / 2 - 3.5, vy - winH / 2 - 3.5, winW + 7, winH + 7, 9.5); g.fillStyle = chamfer(vy - winH / 2 - 3.5, vy + winH / 2 + 3.5); g.fill();
      const pocket = (path: () => void, y0: number, h: number) => {
        const p = g.createLinearGradient(0, y0, 0, y0 + h);
        p.addColorStop(0, "#c9ccbd"); p.addColorStop(0.3, "#eef0e4"); p.addColorStop(1, "#fbfcf4");
        path(); g.fillStyle = p; g.fill();
        g.save(); path(); g.clip(); g.shadowColor = "rgba(30,34,10,0.65)"; g.shadowBlur = 7 * k; g.shadowOffsetX = 2 * k; g.shadowOffsetY = 4 * k;
        path(); g.lineWidth = 3; g.strokeStyle = "#20240c"; g.stroke(); g.restore();
      };
      pocket(() => rr(g, -winW / 2, vy - winH / 2, winW, winH, 6), vy - winH / 2, winH);
      for (const s of [-1, 1]) {
        const cx = s * L.portAt;
        g.beginPath(); g.arc(cx, vy, L.port + 3.5, 0, TAU); g.fillStyle = chamfer(vy - L.port - 3.5, vy + L.port + 3.5); g.fill();
        pocket(() => { g.beginPath(); g.arc(cx, vy, L.port, 0, TAU); }, vy - L.port, L.port * 2);
      }
      // Laser-marked legends.
      g.font = `700 ${narrow ? 6.5 : 7.5}px ui-monospace, SFMono-Regular, Menlo, monospace`; g.textBaseline = "middle"; g.fillStyle = "rgba(255,236,224,0.88)";
      if (L.holes.length) {
        g.textAlign = "center";
        g.fillText("600 MM", L.holes[0], by + L.rail + 11); g.fillText("0.5 MM / M", L.holes[1], by + L.rail + 11);
        g.fillText("BOX SECTION", L.holes[0], by + L.BH - L.rail - 10); g.fillText("MILLED BASE", L.holes[1], by + L.BH - L.rail - 10);
      }
      // Two fine arrows pointing at the centre marks.
      for (const s of [-1, 1]) { const ax = s * (winW / 2 + 9); g.beginPath(); g.moveTo(ax, vy); g.lineTo(ax + s * 5, vy - 3); g.lineTo(ax + s * 5, vy + 3); g.closePath(); g.fill(); }

      // Rubber end caps with moulded ribs.
      for (const s of [-1, 1]) {
        const x = s < 0 ? bx - 1.5 : bx + L.BL - L.cap + 1.5;
        const rub = g.createLinearGradient(0, by - 2, 0, by + L.BH + 2);
        rub.addColorStop(0, "#4b4c4f"); rub.addColorStop(0.12, "#2a2b2d"); rub.addColorStop(0.85, "#161617"); rub.addColorStop(1, "#0a0a0a");
        rr(g, x, by - 2, L.cap, L.BH + 3.5, 4); g.fillStyle = rub; g.fill();
        for (let i = 1; i <= 3; i++) {
          const rx = x + (L.cap * i) / 4;
          g.fillStyle = "rgba(0,0,0,0.6)"; g.fillRect(rx - 0.9, by + 6, 1.4, L.BH - 12);
          g.fillStyle = "rgba(255,255,255,0.13)"; g.fillRect(rx + 0.5, by + 6, 0.7, L.BH - 12);
        }
        g.fillStyle = "rgba(255,255,255,0.3)"; g.fillRect(x + 2, by - 1.4, L.cap - 4, 0.8);
      }
      // Cut the hand holes clean through, so the wall and the shadow show behind them.
      g.globalCompositeOperation = "destination-out";
      for (const hx of L.holes) { rr(g, hx - L.holeW / 2, holeY, L.holeW, holeH, holeH / 2); g.fillStyle = "#000"; g.fill(); }
      g.globalCompositeOperation = "source-over";

      sc.setTransform(1, 0, 0, 1, 0, 0); sc.clearRect(0, 0, shade.width, shade.height);
      sc.shadowColor = "rgba(54,40,18,0.5)"; sc.shadowBlur = 15 * k; sc.shadowOffsetX = shade.width * 2;
      sc.drawImage(rig, -shade.width * 2, 0);
    };

    const fit = () => {
      const w = cv.clientWidth || L.W;
      k = (w / L.W) * Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(L.W * k); cv.height = Math.round(L.H * k);
      build();
    };

    // tilt is the shelf's angle in degrees, pos the bubble's distance from centre. Both carry a speed.
    const s = { tilt: live.current.f * MAX_TILT, tv: 0, pos: -live.current.f * maxPos, pv: 0, light: 0 };

    const vial = (x: number, y: number, upright: boolean, len: number, rad: number, pos: number, bw: number, stretch: number) => {
      ctx.save(); ctx.translate(x, y); if (upright) ctx.rotate(-Math.PI / 2);
      const hl = len / 2, r0 = rad * 0.86, cr = rad * 0.62, bulge = 2 * rad - r0;
      const tube = () => {
        ctx.beginPath(); ctx.moveTo(-hl + cr, -r0); ctx.quadraticCurveTo(0, -bulge, hl - cr, -r0); ctx.quadraticCurveTo(hl, -r0, hl, -r0 + cr); ctx.lineTo(hl, r0 - cr);
        ctx.quadraticCurveTo(hl, r0, hl - cr, r0); ctx.quadraticCurveTo(0, bulge, -hl + cr, r0); ctx.quadraticCurveTo(-hl, r0, -hl, r0 - cr); ctx.lineTo(-hl, -r0 + cr); ctx.quadraticCurveTo(-hl, -r0, -hl + cr, -r0); ctx.closePath();
      };
      const liquid = ctx.createLinearGradient(0, -rad, 0, rad);
      [0, 0.13, 0.42, 0.7, 0.86, 1].forEach((o, i) => liquid.addColorStop(o, SPIRIT[i]));
      // The lit liquid throws a pale green glow on the white pocket behind it.
      ctx.save(); ctx.shadowColor = "rgba(92,120,0,0.5)"; ctx.shadowBlur = 6 * k; ctx.shadowOffsetX = 2 * k; ctx.shadowOffsetY = 4 * k; tube(); ctx.fillStyle = liquid; ctx.fill(); ctx.restore();
      ctx.save(); tube(); ctx.clip();
      const ends = ctx.createLinearGradient(-hl, 0, hl, 0);
      ends.addColorStop(0, "rgba(50,70,0,0.6)"); ends.addColorStop(0.1, "rgba(50,70,0,0.06)"); ends.addColorStop(0.9, "rgba(50,70,0,0.06)"); ends.addColorStop(1, "rgba(50,70,0,0.6)");
      ctx.fillStyle = ends; ctx.fillRect(-hl, -rad, len, rad * 2);
      if (!upright) {
        // The two rings the bubble has to sit between.
        for (const lx of [-(L.BW / 2 + 3.5), L.BW / 2 + 3.5]) {
          ctx.fillStyle = "rgba(255,255,220,0.5)"; ctx.fillRect(lx + 0.9, -rad, 0.8, rad * 2);
          ctx.fillStyle = "#15170a"; ctx.fillRect(lx - 0.8, -rad, 1.6, rad * 2);
        }
      }
      // The bubble: pale inside, a dark refracted rim, and the lamp caught twice on its skin.
      const w2 = (bw * stretch) / 2, bh = upright ? rad * 1.5 : rad * 1.16 / Math.sqrt(stretch);
      const wall = -(r0 + (rad - r0) * (1 - (pos / hl) * (pos / hl)));
      const cy = upright ? 0 : wall + bh / 2 + 1.4;
      const air = ctx.createRadialGradient(pos - w2 * 0.2, cy - bh * 0.12, 0.5, pos, cy, w2);
      air.addColorStop(0, "rgba(253,255,236,0.98)"); air.addColorStop(0.62, "rgba(240,252,170,0.95)"); air.addColorStop(0.84, "rgba(150,180,24,0.95)"); air.addColorStop(0.94, "rgba(66,88,0,0.97)"); air.addColorStop(1, "rgba(206,236,70,0.92)");
      ctx.save(); ctx.translate(pos, cy); ctx.scale(1, bh / 2 / w2); ctx.translate(-pos, -cy);
      ctx.beginPath(); ctx.arc(pos, cy, w2, 0, TAU); ctx.fillStyle = air; ctx.fill(); ctx.restore();
      const hx = pos - w2 * (0.34 - s.light * 0.2);
      ctx.beginPath(); ctx.ellipse(hx, cy - bh * 0.2, w2 * 0.3, bh * 0.1, -0.12, 0, TAU); ctx.fillStyle = "rgba(255,255,255,0.96)"; ctx.fill();
      ctx.beginPath(); ctx.ellipse(pos + w2 * 0.46, cy + bh * 0.24, w2 * 0.13, bh * 0.07, -0.3, 0, TAU); ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.fill();
      // The bubble works as a lens and drops a bright patch on the floor of the tube.
      const lens = ctx.createRadialGradient(pos, rad * 0.62, 0, pos, rad * 0.62, w2 * 0.9);
      lens.addColorStop(0, "rgba(255,255,220,0.5)"); lens.addColorStop(1, "rgba(255,255,220,0)");
      ctx.fillStyle = lens; ctx.fillRect(pos - w2, rad * 0.2, w2 * 2, rad * 0.8);
      // Glass: one long hard highlight high on the tube, one faint one low.
      const run = ctx.createLinearGradient(-hl, 0, hl, 0), shift = s.light * 0.12;
      run.addColorStop(0, "rgba(255,255,255,0)"); run.addColorStop(clamp(0.16 + shift, 0.02, 0.4), "rgba(255,255,255,0.9)"); run.addColorStop(clamp(0.6 + shift, 0.45, 0.8), "rgba(255,255,255,0.55)"); run.addColorStop(1, "rgba(255,255,255,0)");
      rr(ctx, -hl + cr * 0.7, -rad * 0.74, len - cr * 1.4, rad * 0.17, rad * 0.085); ctx.fillStyle = run; ctx.fill();
      ctx.globalAlpha = 0.34; rr(ctx, -hl + cr, rad * 0.66, len - cr * 2, rad * 0.08, rad * 0.04); ctx.fill(); ctx.globalAlpha = 1;
      ctx.restore();
      tube(); ctx.lineWidth = 0.9; ctx.strokeStyle = "rgba(48,62,0,0.62)"; ctx.stroke();
      ctx.restore();
    };

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.setTransform(k, 0, 0, k, L.PX * k, L.PY * k);
      const a = (s.tilt * Math.PI) / 180;
      // Shadow on the wall, pushed down and to the right of the thing that throws it.
      ctx.save(); ctx.translate(11, 20); ctx.rotate(a); ctx.drawImage(shade, -RW / 2, -OY, RW, RH); ctx.restore();
      // The bracket the shelf pivots on. It stays put.
      ctx.save(); ctx.shadowColor = "rgba(54,40,18,0.45)"; ctx.shadowBlur = 8 * k; ctx.shadowOffsetX = 5 * k; ctx.shadowOffsetY = 8 * k;
      const arm = ctx.createLinearGradient(-12, 0, 12, 0);
      arm.addColorStop(0, "#5b5e63"); arm.addColorStop(0.3, "#888c91"); arm.addColorStop(0.7, "#4b4e52"); arm.addColorStop(1, "#2f3134");
      ctx.beginPath(); ctx.moveTo(-9, -4); ctx.lineTo(9, -4); ctx.lineTo(12, 50); ctx.quadraticCurveTo(12, 58, 4, 58); ctx.lineTo(-4, 58); ctx.quadraticCurveTo(-12, 58, -12, 50); ctx.closePath(); ctx.fillStyle = arm; ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.moveTo(-8.2, 10); ctx.lineTo(-11.1, 50); ctx.lineWidth = 0.9; ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 44, 4.2, 0, TAU); ctx.fillStyle = steel(ctx, 0, 44, 4.2); ctx.fill();
      ctx.save(); ctx.translate(0, 44); ctx.rotate(0.6); ctx.fillStyle = "rgba(10,10,10,0.8)"; ctx.fillRect(-3.2, -0.6, 6.4, 1.2); ctx.restore();

      ctx.save(); ctx.rotate(a);
      ctx.drawImage(rig, -RW / 2, -OY, RW, RH);
      const speed = Math.min(1, Math.abs(s.pv) / 220);
      vial(0, vy, false, L.VL, L.VR, s.pos, L.BW, 1 + speed * 0.28);
      for (const side of [-1, 1]) {
        const vl = L.port * 1.46, vr = L.port * 0.33, bw = vr * 1.62;
        vial(side * L.portAt, vy, true, vl, vr, vl / 2 - bw / 2 - 2.6 - Math.abs(s.tilt) * 0.3, bw, 1);
      }
      // A sheet of clear plastic over the centre window, catching a streak of light.
      ctx.save(); rr(ctx, -winW / 2, vy - winH / 2, winW, winH, 6); ctx.clip();
      const sx = -winW * 0.3 + s.light * winW * 0.14;
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      ctx.beginPath(); ctx.moveTo(sx, vy - winH / 2); ctx.lineTo(sx + winW * 0.16, vy - winH / 2); ctx.lineTo(sx + winW * 0.16 - winH * 0.5, vy + winH / 2); ctx.lineTo(sx - winH * 0.5, vy + winH / 2); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.restore();

      // Pivot pin through the shelf.
      ctx.save(); ctx.shadowColor = "rgba(40,24,4,0.6)"; ctx.shadowBlur = 3 * k; ctx.shadowOffsetY = 1.5 * k;
      ctx.beginPath(); ctx.arc(0, 0, L.PT * 0.3, 0, TAU); ctx.fillStyle = steel(ctx, 0, 0, L.PT * 0.3); ctx.fill(); ctx.restore();
      ctx.beginPath(); ctx.arc(0, 0, L.PT * 0.1, 0, TAU); ctx.fillStyle = "rgba(20,20,20,0.75)"; ctx.fill();
    };

    let raf = 0, last = 0, seen = true, moved = -1e9;
    const frame = (now: number) => {
      raf = 0;
      if (!last) last = now;
      const dt = Math.min(0.04, (now - last) / 1000); last = now;
      for (let i = 0; i < 4; i++) {
        const h = dt / 4;
        s.tv += (38 * (live.current.f * MAX_TILT - s.tilt) - 4.4 * s.tv) * h; s.tilt += s.tv * h;
        if (Math.abs(s.tilt) > MAX_TILT + 0.6) { s.tilt = Math.sign(s.tilt) * (MAX_TILT + 0.6); s.tv *= -0.35; }
        // The bubble runs uphill and overshoots a little before the spirit drags it back.
        const want = clamp((-s.tilt / MAX_TILT) * maxPos, -maxPos, maxPos);
        s.pv += (74 * (want - s.pos) - 7.6 * s.pv) * h; s.pos += s.pv * h;
        if (Math.abs(s.pos) > maxPos + 2) { s.pos = Math.sign(s.pos) * (maxPos + 2); s.pv *= -0.2; }
      }
      if (now - moved > 2500) s.light += (0.6 * Math.sin(now / 1900) - s.light) * Math.min(1, dt * 4);
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const still = () => { s.tilt = live.current.f * MAX_TILT; s.tv = 0; s.pos = -live.current.f * maxPos; s.pv = 0; draw(); };
    const wake = (push?: number) => {
      if (reduce) { still(); return; }
      if (push) s.tv += push * 26; // a finger pressing one end of the shelf
      if (!raf) { last = 0; raf = requestAnimationFrame(frame); }
    };
    api.current = { poke: wake };
    fit(); wake();

    const onLight = (e: PointerEvent) => { const r = cv.getBoundingClientRect(); moved = performance.now(); s.light = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1); };
    const onPress = (e: PointerEvent) => { const r = cv.getBoundingClientRect(); wake(e.clientX - r.left < r.width / 2 ? -1 : 1); };
    cv.addEventListener("pointermove", onLight); cv.addEventListener("pointerdown", onPress);
    const ro = new ResizeObserver(() => { fit(); if (reduce) still(); else draw(); });
    ro.observe(cv);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); api.current = null;
      cv.removeEventListener("pointermove", onLight); cv.removeEventListener("pointerdown", onPress);
      ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, [narrow]);

  const L = layoutFor(narrow);
  const f = lean(vals[0], vals[1]);
  const isLevel = Math.abs(f) <= LEVEL_BAND;
  const diff = Math.abs(vals[0] - vals[1]);
  const status = isLevel ? "Level" : `${sides[vals[0] > vals[1] ? 0 : 1].label} ahead by ${diff}`;
  const bump = (i: number, by: number) => {
    live.current.touched = true; setTouched(true);
    const next: [number, number] = [vals[0], vals[1]];
    next[i] = clamp(next[i] + by, 0, 999);
    show(next);
  };
  const key = "flex h-11 w-11 items-center justify-center rounded-full border border-stone-400/70 bg-white/70 text-stone-800 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_1px_2px_rgba(60,45,20,0.18)] outline-none transition-transform duration-150 hover:bg-white active:scale-95 focus-visible:ring-2 focus-visible:ring-[#d4441f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e9e6df] motion-reduce:transition-none";

  return (
    <div ref={stage} className="flex min-h-[720px] w-full flex-col items-center justify-center bg-[#e9e6df] bg-[radial-gradient(80%_70%_at_44%_36%,#f6f4ef_0%,#e9e6df_55%,#d6d2c8_100%)] px-4 py-12">
      <div className="w-full" style={{ maxWidth: narrow ? L.W : 1100 }}>
        <canvas ref={canvas} aria-hidden="true" className="block w-full touch-manipulation" style={{ aspectRatio: `${L.W} / ${L.H}` }} />
      </div>
      <div className="mt-2 grid w-full max-w-[640px] grid-cols-[1fr_auto_1fr] items-start gap-x-3">
        {sides.map((side, i) => (
          <div key={side.label} className={`flex flex-col items-center gap-2 ${i === 1 ? "order-3" : "order-1"}`}>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone-600">{side.label}</p>
            <p className="text-5xl font-semibold tabular-nums tracking-tight text-stone-900 sm:text-6xl">{vals[i]}</p>
            <div className="mt-1 flex gap-2">
              <button type="button" onClick={() => bump(i, -1)} aria-label={`One fewer ${side.label.toLowerCase()}`} className={key}>
                <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4"><path d="M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
              <button type="button" onClick={() => bump(i, 1)} aria-label={`One more ${side.label.toLowerCase()}`} className={key}>
                <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4"><path d="M4 10h12M10 4v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            </div>
          </div>
        ))}
        <div className="order-2 flex flex-col items-center gap-2 pt-7 text-center">
          <p aria-live={touched ? "polite" : "off"} className={`rounded-full px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] ${isLevel ? "bg-[#2c3a05] text-[#eaff8a]" : "bg-stone-900/10 text-stone-800"}`}>{status}</p>
          <p className="max-w-[11rem] font-mono text-[10px] uppercase leading-4 tracking-[0.16em] text-stone-600">{CAPTION}</p>
        </div>
      </div>
    </div>
  );
}
