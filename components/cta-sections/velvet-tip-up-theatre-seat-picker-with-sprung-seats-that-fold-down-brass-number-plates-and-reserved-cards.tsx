import { useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

// Everything a visitor is likely to change sits here.
const SHOW = { title: "The Long Goodnight", when: "Fri 21 Nov, 8.15 pm" };
const ROWS = ["D", "C", "B", "A"]; // back row first; A is nearest the screen
const PRICE: Record<string, number> = { A: 16, B: 19, C: 22, D: 22 };
const CURRENCY = "£";
const RESERVED = ["D2", "D3", "C6", "C7", "B1", "A4", "A5"]; // seats with a card hung on them
const START = ["A2", "A3"]; // already folded down when the page loads
const DEMO = ["B3", "B4", "A2", "A3", "C4", "C5", "B3", "B4", "A2", "A3", "C4", "C5"]; // seats the idle demo presses, in order
const VELVET = ["#cf2a3f", "#931424", "#4c0a13"]; // light, mid, shadow
const BRASS = ["#fff2c2", "#d6a94a", "#7d5a17"];

const PITCH = 104, LP = 70, TP = 15, EYE = (31 * Math.PI) / 180; // seat spacing, pan length, pan thickness, how far above the seats you are looking from
const UP = 4, DOWN = 92, PEEK = 22; // pan angle from upright, in degrees

const geometry = (narrow: boolean) => {
  const cols = narrow ? 5 : 7, W0 = narrow ? 600 : 1100, H0 = narrow ? 850 : 690, base = narrow ? 560 : 520;
  const rows = ROWS.map((letter, i) => { const n = ROWS.length - 1 - i; return { letter, s: Math.pow(0.9, n), y: base - [0, 128, 243, 346][n] }; });
  return { cols, W0, H0, rows, cx: W0 / 2 };
};
type Geo = ReturnType<typeof geometry>;
const seatX = (g: Geo, s: number, col: number) => g.cx + (col - (g.cols + 1) / 2) * PITCH * s;

type Ctx = CanvasRenderingContext2D;
const rng = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rr = (c: Ctx, x: number, y: number, w: number, h: number, r: number | number[]) => {
  const [a, b, d, e] = typeof r === "number" ? [r, r, r, r] : r;
  c.beginPath(); c.moveTo(x + a, y); c.arcTo(x + w, y, x + w, y + h, b); c.arcTo(x + w, y + h, x, y + h, d); c.arcTo(x, y + h, x, y, e); c.arcTo(x, y, x + w, y, a); c.closePath();
};

export default function VelvetSeatPicker() {
  const reduce = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);
  const [narrow, setNarrow] = useState(false);
  const [chosen, setChosen] = useState<string[]>(START);
  const live = useRef({ chosen: START, hover: "", touched: false });
  const geo = useMemo(() => geometry(narrow), [narrow]);
  live.current.chosen = chosen;

  useEffect(() => {
    const el = stageRef.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(() => setNarrow(el.clientWidth < 700));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const stage = stageRef.current, cv = cvRef.current;
    if (!stage || !cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const g = geo, L = live.current;
    let k = 1, raf = 0, visible = true, last = performance.now(), nextDemo = last + 3700, demoAt = 0;
    const room = document.createElement("canvas");
    const rowCv = g.rows.map(() => document.createElement("canvas"));
    const noise = document.createElement("canvas"); noise.width = noise.height = 128;
    { const n = noise.getContext("2d")!, r = rng(4); for (let i = 0; i < 5200; i++) { n.fillStyle = `rgba(${r() > 0.55 ? "255,190,190" : "20,0,0"},${0.04 + r() * 0.1})`; n.fillRect(r() * 128, r() * 128, 1, 1 + r()); } }
    const pile = ctx.createPattern(noise, "repeat");
    const reserved = new Set(RESERVED);
    const phi = new Map<string, { a: number; v: number }>();
    for (const row of g.rows) for (let c = 1; c <= g.cols; c++) { const id = row.letter + c; phi.set(id, { a: L.chosen.includes(id) ? DOWN : UP, v: 0 }); }

    /** Fill the current path as velvet: a top-lit body, a pale bloom along both edges, then the pile. */
    const velvet = (c: Ctx, path: () => void, x: number, y: number, w: number, h: number, dim = 0) => {
      const gr = c.createLinearGradient(0, y, 0, y + h);
      gr.addColorStop(0, VELVET[0]); gr.addColorStop(0.42, VELVET[1]); gr.addColorStop(1, VELVET[2]);
      path(); c.fillStyle = gr; c.fill();
      c.save(); path(); c.clip();
      const e = c.createLinearGradient(x, 0, x + w, 0);
      e.addColorStop(0, "rgba(255,170,170,0.3)"); e.addColorStop(0.16, "rgba(255,170,170,0)"); e.addColorStop(0.84, "rgba(255,170,170,0)"); e.addColorStop(1, "rgba(255,170,170,0.2)");
      c.fillStyle = e; c.fillRect(x, y, w, h);
      const t = c.createLinearGradient(0, y, 0, y + Math.min(h, 16)); t.addColorStop(0, "rgba(255,200,200,0.32)"); t.addColorStop(1, "rgba(255,200,200,0)");
      c.fillStyle = t; c.fillRect(x, y, w, Math.min(h, 16));
      if (pile) { c.fillStyle = pile; c.fillRect(x, y, w, h); }
      if (dim) { c.fillStyle = `rgba(10,2,4,${dim})`; c.fillRect(x, y, w, h); }
      c.restore();
    };
    const brass = (c: Ctx, x0: number, y0: number, x1: number, y1: number) => { const b = c.createLinearGradient(x0, y0, x1, y1); b.addColorStop(0, BRASS[0]); b.addColorStop(0.45, BRASS[1]); b.addColorStop(1, BRASS[2]); return b; };
    const wood = (c: Ctx, x0: number, x1: number) => { const w = c.createLinearGradient(x0, 0, x1, 0); w.addColorStop(0, "#2a140c"); w.addColorStop(0.3, "#6d3f24"); w.addColorStop(0.55, "#4a2816"); w.addColorStop(1, "#1c0d07"); return w; };

    const build = () => {
      // The auditorium behind the seats.
      room.width = cv.width; room.height = cv.height;
      const b = room.getContext("2d")!;
      b.setTransform(k, 0, 0, k, 0, 0);
      b.fillStyle = "#130a0d"; b.fillRect(0, 0, g.W0, g.H0);
      const wl = b.createRadialGradient(g.cx, g.H0 * 0.34, 40, g.cx, g.H0 * 0.4, g.W0 * 0.62);
      wl.addColorStop(0, "#3b1c22"); wl.addColorStop(0.55, "#1e0f13"); wl.addColorStop(1, "#130a0d");
      b.fillStyle = wl; b.fillRect(0, 0, g.W0, g.H0);

      // One layer per row: its carpeted step, standards, arm rests, end panels and seat backs.
      g.rows.forEach((row, ri) => {
        const cvs = rowCv[ri]; cvs.width = cv.width; cvs.height = cv.height;
        const c = cvs.getContext("2d")!; const r = rng(100 + ri);
        c.setTransform(k, 0, 0, k, 0, 0);
        const s = row.s, half = (g.cols * PITCH * s) / 2 + 46 * s, fy = row.y + 68 * s, next = g.rows[ri + 1];
        const bottom = next ? next.y + 68 * next.s - 20 * next.s : g.H0;
        // step: tread, brass nosing, riser
        const tread = c.createLinearGradient(0, fy - 24 * s, 0, fy);
        tread.addColorStop(0, "#1c1216"); tread.addColorStop(1, "#33202a");
        c.fillStyle = tread; c.fillRect(g.cx - half - 60, fy - 24 * s, half * 2 + 120, 24 * s);
        const riser = c.createLinearGradient(0, fy, 0, bottom); riser.addColorStop(0, "#150c10"); riser.addColorStop(1, "#0c0608");
        c.fillStyle = riser; c.fillRect(g.cx - half - 60, fy, half * 2 + 120, Math.max(0, bottom - fy));
        for (let i = 0; i < 500; i++) { c.fillStyle = `rgba(${r() > 0.5 ? "255,200,210" : "0,0,0"},${0.03 + r() * 0.05})`; c.fillRect(g.cx - half - 60 + r() * (half * 2 + 120), fy - 24 * s + r() * 24 * s, 1.2, 1); }
        c.fillStyle = brass(c, 0, fy - 1, 0, fy + 3); c.fillRect(g.cx - half - 60, fy - 1, half * 2 + 120, 3 * s);
        // fade the step out towards the walls
        for (const dir of [-1, 1]) { const fx = g.cx + dir * (half + 60), fd = c.createLinearGradient(fx, 0, fx - dir * 90, 0); fd.addColorStop(0, "#130a0d"); fd.addColorStop(1, "rgba(19,10,13,0)"); c.fillStyle = fd; c.fillRect(Math.min(fx, fx - dir * 90), fy - 26 * s, 90, bottom - fy + 28 * s); }

        const local = (x: number) => { c.setTransform(k * s, 0, 0, k * s, x * k, row.y * k); };
        // cast iron standards and wooden arm rests between the seats
        for (let i = 0; i <= g.cols; i++) {
          local(g.cx + (i - g.cols / 2) * PITCH * s);
          const ir = c.createLinearGradient(-5, 0, 5, 0); ir.addColorStop(0, "#0d0b0c"); ir.addColorStop(0.4, "#3b3537"); ir.addColorStop(1, "#090708");
          c.fillStyle = ir; c.fillRect(-4.5, -28, 9, 96);
          c.beginPath(); c.moveTo(-4.5, 56); c.lineTo(-13, 68); c.lineTo(13, 68); c.lineTo(4.5, 56); c.closePath(); c.fill();
          c.save(); c.shadowColor = "rgba(0,0,0,0.7)"; c.shadowBlur = 5 * k; c.shadowOffsetY = 3 * k;
          rr(c, -9, -44, 18, 17, 6); c.fillStyle = wood(c, -9, 9); c.fill(); c.restore();
          c.fillStyle = "rgba(255,210,170,0.3)"; rr(c, -6, -42.5, 12, 2.4, 1.2); c.fill();
        }
        // aisle end panels with the row letter and a step light
        for (const dir of [-1, 1]) {
          local(g.cx + dir * ((g.cols * PITCH * s) / 2 + 24 * s));
          c.save(); c.shadowColor = "rgba(0,0,0,0.75)"; c.shadowBlur = 12 * k; c.shadowOffsetY = 5 * k;
          rr(c, -17, -72, 34, 140, [14, 14, 3, 3]); c.fillStyle = wood(c, -17, 17); c.fill(); c.restore();
          c.save(); rr(c, -17, -72, 34, 140, [14, 14, 3, 3]); c.clip();
          for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(${r() > 0.5 ? "255,200,150" : "0,0,0"},${0.04 + r() * 0.07})`; c.fillRect(-17 + r() * 34, -72, 0.8, 140); }
          const sh = c.createLinearGradient(0, -72, 0, -40); sh.addColorStop(0, "rgba(255,220,190,0.28)"); sh.addColorStop(1, "rgba(255,220,190,0)"); c.fillStyle = sh; c.fillRect(-17, -72, 34, 32);
          c.restore();
          c.strokeStyle = "rgba(0,0,0,0.45)"; c.lineWidth = 1.2; rr(c, -11.5, -64, 23, 124, [9, 9, 2, 2]); c.stroke();
          c.strokeStyle = "rgba(255,220,180,0.14)"; rr(c, -10.5, -63, 23, 124, [9, 9, 2, 2]); c.stroke();
          c.save(); c.shadowColor = "rgba(0,0,0,0.6)"; c.shadowBlur = 3 * k; c.shadowOffsetY = 1.5 * k;
          c.beginPath(); c.arc(0, -40, 9.5, 0, Math.PI * 2); c.fillStyle = brass(c, -8, -48, 8, -32); c.fill(); c.restore();
          c.strokeStyle = "rgba(90,60,10,0.6)"; c.lineWidth = 0.8; c.beginPath(); c.arc(0, -40, 7.4, 0, Math.PI * 2); c.stroke();
          c.fillStyle = "#3d2a08"; c.font = "700 11px Georgia, 'Times New Roman', serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(row.letter, 0, -39.4);
          rr(c, -7, 44, 14, 5, 2); c.fillStyle = "#ffe2a8"; c.shadowColor = "#ffb44a"; c.shadowBlur = 10 * k; c.fill(); c.shadowColor = "transparent"; c.shadowBlur = 0;
          c.globalCompositeOperation = "lighter";
          c.save(); c.translate(0, 66); c.scale(1, 0.32);
          const pool = c.createRadialGradient(0, 0, 2, 0, 0, 62); pool.addColorStop(0, "rgba(255,180,90,0.34)"); pool.addColorStop(1, "rgba(255,180,90,0)"); c.fillStyle = pool; c.beginPath(); c.arc(0, 0, 62, 0, Math.PI * 2); c.fill(); c.restore();
          c.globalCompositeOperation = "source-over";
        }
        // seat backs
        for (let col = 1; col <= g.cols; col++) {
          const id = row.letter + col;
          local(seatX(g, s, col));
          const back = () => rr(c, -42, -112, 84, 122, [24, 24, 5, 5]);
          c.save(); c.shadowColor = "rgba(0,0,0,0.7)"; c.shadowBlur = 14 * k; c.shadowOffsetY = 6 * k; back(); c.fillStyle = VELVET[2]; c.fill(); c.restore();
          velvet(c, back, -42, -112, 84, 122);
          // two stitched channels and the piping round the edge
          for (const sx of [-14, 14]) {
            const ch = c.createLinearGradient(sx - 5, 0, sx + 5, 0); ch.addColorStop(0, "rgba(40,0,6,0)"); ch.addColorStop(0.5, "rgba(40,0,6,0.5)"); ch.addColorStop(0.62, "rgba(255,170,170,0.2)"); ch.addColorStop(1, "rgba(255,170,170,0)");
            c.fillStyle = ch; c.fillRect(sx - 5, -100, 10, 104);
          }
          c.strokeStyle = "rgba(255,150,150,0.38)"; c.lineWidth = 1.1; rr(c, -39, -109, 78, 116, [21, 21, 4, 4]); c.stroke();
          c.strokeStyle = "rgba(30,0,4,0.5)"; rr(c, -37.6, -107.6, 75.2, 113.2, [20, 20, 3, 3]); c.stroke();
          // the dark gap under the seat back
          c.fillStyle = "rgba(6,2,3,0.8)"; c.fillRect(-40, 10, 80, 46);
          if (reserved.has(id)) {
            const tilt = (r() - 0.5) * 0.16;
            c.strokeStyle = "rgba(235,225,205,0.75)"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(-12, -112); c.lineTo(-13, -94); c.moveTo(12, -112); c.lineTo(13, -94); c.stroke();
            c.save(); c.translate(0, -84); c.rotate(tilt);
            c.shadowColor = "rgba(0,0,0,0.6)"; c.shadowBlur = 6 * k; c.shadowOffsetY = 3 * k;
            rr(c, -24, -11, 48, 24, 2); const cd = c.createLinearGradient(0, -11, 0, 13); cd.addColorStop(0, "#fbf5e6"); cd.addColorStop(1, "#dccfb3"); c.fillStyle = cd; c.fill();
            c.shadowColor = "transparent"; c.strokeStyle = "rgba(120,20,30,0.7)"; c.lineWidth = 0.7; c.strokeRect(-21, -8, 42, 18);
            c.fillStyle = "#7a1420"; c.font = "700 6.4px Georgia, 'Times New Roman', serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("RESERVED", 0, 1.2);
            c.restore();
          }
        }
        // rows further back sit in a little more darkness
        c.setTransform(k, 0, 0, k, 0, 0);
        c.globalCompositeOperation = "source-atop"; c.fillStyle = `rgba(10,3,5,${(g.rows.length - 1 - ri) * 0.13})`; c.fillRect(0, 0, g.W0, g.H0); c.globalCompositeOperation = "source-over";
      });
    };

    /** The hinged pan of one seat at angle `deg` from upright, drawn at the hinge. */
    const pan = (id: string, deg: number, dim: number) => {
      const a = (deg * Math.PI) / 180 + EYE, cs = Math.cos(a), sn = Math.sin(a), wide = 1 + 0.1 * Math.sin((deg * Math.PI) / 180);
      const sb = -LP * cs, th = TP * sn;
      ctx.save(); ctx.scale(wide, 1);
      // shadow the pan throws on what is behind and below it
      const drop = Math.max(0, Math.sin((deg * Math.PI) / 180));
      if (drop > 0.05) { const sh = ctx.createLinearGradient(0, sb, 0, sb + 50); sh.addColorStop(0, `rgba(0,0,0,${0.85 * drop})`); sh.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = sh; ctx.fillRect(-44, sb, 88, 50); }
      if (cs > 0) {
        // underside: a pressed steel pan with a brass number plate
        const h = -sb;
        // the cushion is a little larger than the pan, so a rim of velvet shows all round it
        velvet(ctx, () => rr(ctx, -41, sb - th, 82, h + th + 2, [6, 6, 4, 4]), -41, sb - th, 82, h + th + 2, dim + 0.1);
        const body = () => rr(ctx, -36, sb + 3, 72, h - 5, [6, 6, 3, 3]);
        const st = ctx.createLinearGradient(0, sb, 0, 0); st.addColorStop(0, "#4a3c40"); st.addColorStop(0.2, "#2a2023"); st.addColorStop(1, "#120c0e");
        ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.65)"; ctx.shadowBlur = 8 * k; ctx.shadowOffsetY = 3 * k; body(); ctx.fillStyle = st; ctx.fill(); ctx.restore();
        ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth = 1; rr(ctx, -31, sb + h * 0.12, 62, h * 0.76, 5); ctx.stroke();
        ctx.strokeStyle = "rgba(0,0,0,0.5)"; rr(ctx, -30, sb + h * 0.12 + 1, 62, h * 0.76, 5); ctx.stroke();
        ctx.save(); ctx.translate(0, sb + h * 0.5); ctx.scale(1, h / (LP * 0.92));
        ctx.shadowColor = "rgba(0,0,0,0.7)"; ctx.shadowBlur = 3 * k; ctx.shadowOffsetY = 1.5 * k;
        ctx.beginPath(); ctx.ellipse(0, 0, 15, 10, 0, 0, Math.PI * 2); ctx.fillStyle = brass(ctx, -12, -10, 12, 10); ctx.fill(); ctx.shadowColor = "transparent";
        ctx.strokeStyle = "rgba(90,60,10,0.55)"; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.ellipse(0, 0, 12.4, 7.6, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = "#3d2a08"; ctx.font = "700 11px Georgia, 'Times New Roman', serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(id.slice(1), 0, 0.6);
        ctx.fillStyle = "#6a4a12"; for (const dx of [-12.6, 12.6]) { ctx.beginPath(); ctx.arc(dx, 0, 0.9, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
        // the rolled front edge of the cushion, seen end on
        velvet(ctx, () => rr(ctx, -41, sb - th, 82, th + 2, [5, 5, 1, 1]), -41, sb - th, 82, th + 2, dim);
      } else {
        // cushion top, then its front edge
        const top = -th, st = sb - th;
        velvet(ctx, () => rr(ctx, -41, top, 82, st - top + 3, [4, 4, 2, 2]), -41, top, 82, st - top + 3, dim);
        ctx.fillStyle = "rgba(40,0,6,0.35)"; ctx.fillRect(-38, top, 76, 3);
        const fr = () => rr(ctx, -42, st, 84, sb - st, [3, 3, 7, 7]);
        velvet(ctx, fr, -42, st, 84, sb - st, dim + 0.12);
        ctx.strokeStyle = "rgba(255,160,160,0.5)"; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(-40, st + 0.8); ctx.lineTo(40, st + 0.8); ctx.stroke();
      }
      ctx.restore();
    };

    const draw = (now = 0) => {
      const breathe = reduce ? 1 : 0.86 + 0.14 * Math.sin(now / 520); // the torch is hand held
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(room, 0, 0);
      g.rows.forEach((row, ri) => {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(rowCv[ri], 0, 0);
        const dim = (g.rows.length - 1 - ri) * 0.13;
        for (let col = 1; col <= g.cols; col++) {
          const id = row.letter + col, p = phi.get(id)!;
          ctx.setTransform(k * row.s, 0, 0, k * row.s, seatX(g, row.s, col) * k, row.y * k);
          pan(id, p.a, dim);
          const lit = Math.max(0, (p.a - UP) / (DOWN - UP));
          if (lit > 0.02) {
            // an usher's torch: chosen seats sit in a pool of warm light
            ctx.globalCompositeOperation = "lighter";
            const gl = ctx.createRadialGradient(0, -34, 6, 0, -34, 92); gl.addColorStop(0, `rgba(255,190,130,${(0.19 * Math.min(1, lit) * breathe).toFixed(3)})`); gl.addColorStop(1, "rgba(255,190,130,0)");
            ctx.fillStyle = gl; ctx.fillRect(-50, -116, 100, 160);
            ctx.globalCompositeOperation = "source-over";
          }
        }
      });
      // darkness gathering at the edges of the house
      ctx.setTransform(k, 0, 0, k, 0, 0);
      const vg = ctx.createRadialGradient(g.cx, g.H0 * 0.5, g.W0 * 0.3, g.cx, g.H0 * 0.5, g.W0 * 0.75);
      vg.addColorStop(0, "rgba(19,10,13,0)"); vg.addColorStop(1, "rgba(19,10,13,0.9)");
      ctx.fillStyle = vg; ctx.fillRect(0, 0, g.W0, g.H0);
    };

    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      if (!L.touched && now > nextDemo) {
        const id = DEMO[demoAt % DEMO.length]; demoAt++;
        if (phi.has(id) && !reserved.has(id)) setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
        nextDemo = now + (demoAt % 2 ? 620 : 2100);
      }
      phi.forEach((p, id) => {
        const target = L.chosen.includes(id) ? DOWN : L.hover === id && !reserved.has(id) ? PEEK : UP;
        // the pan is a sprung flap: it overshoots, and it knocks against its stops
        for (let n = 0; n < 2; n++) {
          p.v += (170 * (target - p.a) - 11 * p.v) * (dt / 2); p.a += p.v * (dt / 2);
          if (p.a > DOWN + 3) { p.a = DOWN + 3; p.v = -p.v * 0.35; }
          if (p.a < UP - 2) { p.a = UP - 2; p.v = -p.v * 0.35; }
        }
      });
      draw(now);
      if (visible && !document.hidden) raf = requestAnimationFrame(tick);
    };

    const size = () => {
      const w = stage.clientWidth, dpr = Math.min(2, window.devicePixelRatio || 1);
      k = (w / g.W0) * dpr;
      cv.width = Math.round(w * dpr); cv.height = Math.round(((w * g.H0) / g.W0) * dpr);
      build(); settle();
    };
    const settle = () => { if (reduce) { phi.forEach((p, id) => { p.a = L.chosen.includes(id) ? DOWN : UP; p.v = 0; }); } draw(); };
    (L as { redraw?: () => void }).redraw = () => { if (reduce) settle(); };
    size();
    const ro = new ResizeObserver(size); ro.observe(stage);
    const start = () => { cancelAnimationFrame(raf); if (!reduce && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(tick); } };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; start(); });
    io.observe(stage);
    document.addEventListener("visibilitychange", start);
    start();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", start); (L as { redraw?: () => void }).redraw = undefined; };
  }, [geo, reduce]);

  // with reduced motion there is no loop, so repaint when the choice changes
  useEffect(() => { (live.current as { redraw?: () => void }).redraw?.(); }, [chosen]);

  const toggle = (id: string) => { live.current.touched = true; setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id])); };
  const picked = [...chosen].sort();
  const total = picked.reduce((sum, id) => sum + (PRICE[id[0]] || 0), 0);
  const summary = picked.length ? `${picked.join(", ")} / ${CURRENCY}${total}` : "No seats chosen yet";

  return (
    <section className="relative overflow-hidden bg-[#130a0d]">
      <div ref={stageRef} className="relative mx-auto w-full max-w-[1240px]" style={{ aspectRatio: `${geo.W0} / ${geo.H0}` }}>
        <canvas ref={cvRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <div role="group" aria-label={`Seat plan for ${SHOW.title}, ${SHOW.when}. Row A is nearest the screen.`}>
          {geo.rows.map((row) =>
            Array.from({ length: geo.cols }, (_, i) => {
              const col = i + 1, id = row.letter + col, taken = RESERVED.includes(id), on = chosen.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  aria-disabled={taken || undefined}
                  aria-label={taken ? `Row ${row.letter} seat ${col}, reserved` : `Row ${row.letter} seat ${col}, ${CURRENCY}${PRICE[row.letter]}`}
                  onClick={() => { if (!taken) toggle(id); }}
                  onPointerEnter={() => { live.current.hover = id; }}
                  onPointerLeave={() => { if (live.current.hover === id) live.current.hover = ""; }}
                  className={`absolute rounded-t-[22%] rounded-b-md bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#130a0d] ${taken ? "cursor-not-allowed" : "cursor-pointer"}`}
                  style={{
                    left: `${((seatX(geo, row.s, col) - 42 * row.s) / geo.W0) * 100}%`,
                    top: `${((row.y - 112 * row.s) / geo.H0) * 100}%`,
                    width: `${((84 * row.s) / geo.W0) * 100}%`,
                    height: `${((146 * row.s) / geo.H0) * 100}%`,
                  }}
                />
              );
            }),
          )}
        </div>
        <p className="absolute bottom-[72px] left-5 right-5 font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-rose-100/80 sm:bottom-7 sm:left-8">
          <span className="block text-rose-100/70">{SHOW.title} / {SHOW.when}</span>
          <span aria-live="polite" className="block font-semibold tabular-nums text-white">{summary}</span>
        </p>
        <a href="#" className="absolute bottom-4 left-5 right-5 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#f3e3b4] px-5 text-[13px] font-semibold text-[#2a1206] transition hover:bg-[#fff0c4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#130a0d] sm:bottom-6 sm:left-auto sm:right-8">
          Hold these seats
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h12M11 5l5 5-5 5" /></svg>
        </a>
      </div>
    </section>
  );
}
