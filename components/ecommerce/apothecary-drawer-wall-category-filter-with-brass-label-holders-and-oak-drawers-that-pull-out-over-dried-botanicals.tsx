import { useEffect, useRef, useState } from "react";

// One entry per drawer, read left to right and top to bottom.
// kind decides how the contents are painted: "heads" | "buds" | "petals" | "leaf" | "seeds" | "root" | "berries".
const drawers = [
  { name: "Chamomile", label: "CHAMOMILE", kind: "heads", colors: ["#e6c24a", "#f4ecd4", "#b9952f"] },
  { name: "Lavender", label: "LAVENDER", kind: "buds", colors: ["#7d6aa6", "#a493c4", "#5a4b7c"] },
  { name: "Rose petal", label: "ROSE PETAL", kind: "petals", colors: ["#c9627a", "#e3a0ac", "#9c3d55"] },
  { name: "Peppermint", label: "PEPPERMINT", kind: "leaf", colors: ["#56733a", "#7c9450", "#3d5429"] },
  { name: "Hibiscus", label: "HIBISCUS", kind: "petals", colors: ["#8c1f3a", "#b3304c", "#5e1226"] },
  { name: "Calendula", label: "CALENDULA", kind: "petals", colors: ["#e58a1f", "#f2b33c", "#c0640f"] },
  { name: "Nettle", label: "NETTLE", kind: "leaf", colors: ["#4b6a45", "#6c8a5c", "#34492f"] },
  { name: "Elderflower", label: "ELDERFLOWER", kind: "buds", colors: ["#e9dfb6", "#f6f0d6", "#c2b47c"] },
  { name: "Lemon balm", label: "LEMON BALM", kind: "leaf", colors: ["#8a9a4a", "#aebb66", "#66752f"] },
  { name: "Rosehip", label: "ROSEHIP", kind: "berries", colors: ["#b5391f", "#d4603a", "#7d2212"] },
  { name: "Fennel seed", label: "FENNEL", kind: "seeds", colors: ["#a9a063", "#c6be85", "#7e7642"] },
  { name: "Liquorice root", label: "LIQUORICE", kind: "root", colors: ["#b08a55", "#d0ae7a", "#7b5a32"] },
  { name: "Ginger", label: "GINGER", kind: "root", colors: ["#d6b574", "#ead29c", "#a8843f"] },
  { name: "Cornflower", label: "CORNFLOWER", kind: "petals", colors: ["#3f5fc0", "#6f8ee0", "#2a3f8a"] },
  { name: "Juniper", label: "JUNIPER", kind: "berries", colors: ["#2f3350", "#4a5078", "#1c1f33"] },
];
const START = [1, 9, 12]; // drawers that are already pulled out when the page opens
const PULL = 34; // how far an open drawer comes towards you, in design pixels (a phone uses three quarters of it)
const OAK = "#b78747"; // drawer fronts
const WALNUT = "#472b19"; // the cabinet round them
const ACCENT = "#e9bd62"; // caption accent (the focus rings use the same value in their class names)

const layoutFor = (narrow: boolean) => {
  const g = narrow ? { cols: 3, dw: 108, dh: 84, gap: 12, pad: 8, pull: PULL * 0.76 } : { cols: 5, dw: 150, dh: 104, gap: 16, pad: 20, pull: PULL };
  const rows = Math.ceil(drawers.length / g.cols), top = 12, cornice = 20, plinth = 24;
  const bodyW = g.cols * g.dw + (g.cols + 1) * g.gap, bodyH = rows * g.dh + (rows + 1) * g.gap;
  return { ...g, rows, top, cornice, plinth, bodyW, bodyH, W: bodyW + g.pad * 2, H: top + cornice + bodyH + plinth + 44, bx: g.pad, by: top + cornice };
};
type Layout = ReturnType<typeof layoutFor>;
const slot = (L: Layout, i: number) => ({ x: L.bx + L.gap + (i % L.cols) * (L.dw + L.gap), y: L.by + L.gap + Math.floor(i / L.cols) * (L.dh + L.gap) });

const hex2 = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
// Same as tone, but hands back a hex string so the result can be toned again.
const tone2 = (hex: string, amt: number) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => (amt >= 0 ? v + (255 - v) * amt : v * (1 + amt));
  return `#${hex2(ch(n >> 16))}${hex2(ch((n >> 8) & 255))}${hex2(ch(n & 255))}`;
};
const tone = (hex: string, amt: number) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt))));
  return `rgb(${ch(n >> 16)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
};

export default function ApothecaryDrawerWallFilter() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [narrow, setNarrow] = useState(false);
  const [picked, setPicked] = useState<boolean[]>(() => drawers.map((_, i) => START.includes(i)));
  const live = useRef<boolean[]>(picked);
  const api = useRef<{ wake: () => void; stopDemo: () => void; peek: (i: number, on: boolean) => void } | null>(null);

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
    const L = layoutFor(narrow);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mk = (w: number, h: number) => { const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
    let seed = 7;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };

    // Sawn timber: broad colour bands, long grain lines that flow together, and short dark pores.
    const wood = (c: CanvasRenderingContext2D, w: number, h: number, base0: string, sd: number) => {
      let base = base0;
      seed = sd;
      base = tone2(base, (rand() - 0.5) * 0.2);
      const g = c.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, tone(base, 0.1)); g.addColorStop(1, tone(base, -0.14));
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      const f = ((0.5 + rand() * 0.9) * Math.PI * 2) / w, ph = rand() * 6, lean = (rand() - 0.5) * 0.08, mid = h * (0.25 + rand() * 0.5);
      const line = (y0: number, amp: number) => { c.beginPath(); for (let x = -4; x <= w + 4; x += 5) c.lineTo(x, y0 + x * lean + Math.sin(x * f + ph) * amp * ((y0 - mid) / h) * 2.2); };
      for (let i = 0; i < 12; i++) {
        const y0 = rand() * h;
        line(y0, 9); c.lineWidth = 4 + rand() * 16; c.globalAlpha = 0.06 + rand() * 0.1;
        c.strokeStyle = rand() > 0.5 ? tone(base, 0.4) : tone(base, -0.45); c.stroke();
      }
      for (let i = 0; i < h * 1.1; i++) {
        const y0 = rand() * h, v = rand();
        line(y0, 9); c.lineWidth = 0.3 + rand() * 0.7; c.globalAlpha = 0.05 + rand() * 0.17;
        c.strokeStyle = v > 0.6 ? tone(base, 0.5) : tone(base, -0.6); c.stroke();
      }
      c.globalAlpha = 1;
      for (let i = 0; i < (w * h) / 30; i++) { c.fillStyle = `rgba(40,20,6,${0.1 + rand() * 0.25})`; c.fillRect(rand() * w, rand() * h, 1.5 + rand() * 5, 0.45); }
    };

    // 1. Every drawer front, painted once: oak, worn edges, brass card holder, typed label, brass knob.
    const TS = 3, { dw, dh } = L;
    const hw = Math.min(92, dw * 0.68), hh = narrow ? 25 : 29, hx = dw / 2 - hw / 2, hy = dh * (narrow ? 0.2 : 0.235);
    const kr = narrow ? 8 : 9.5, ky = dh * (narrow ? 0.745 : 0.765);
    const fronts = drawers.map((d, idx) => {
      const cvF = mk(dw * TS, dh * TS), c = cvF.getContext("2d");
      if (!c) return cvF;
      c.scale(TS, TS);
      wood(c, dw, dh, OAK, 101 + idx * 613);
      // Years of hands round the knob, and the eased edges of the board.
      const worn = c.createRadialGradient(dw / 2, ky, kr, dw / 2, ky, kr * 3.6);
      worn.addColorStop(0, "rgba(40,20,5,0.34)"); worn.addColorStop(1, "rgba(40,20,5,0)");
      c.fillStyle = worn; c.fillRect(0, 0, dw, dh);
      const edge = (x0: number, y0: number, x1: number, y1: number, col: string) => { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.fillRect(0, 0, dw, dh); };
      edge(0, 0, 0, 5, "rgba(255,236,196,0.5)"); edge(0, 0, 5, 0, "rgba(255,236,196,0.28)");
      edge(0, dh, 0, dh - 7, "rgba(28,12,2,0.55)"); edge(dw, 0, dw - 6, 0, "rgba(28,12,2,0.42)");
      c.fillStyle = "rgba(255,244,214,0.75)"; c.fillRect(0, 0, dw, 0.8);
      // Brass card holder with two screw tabs.
      const brass = (y0: number, y1: number) => { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, "#fdeeb4"); g.addColorStop(0.18, "#dcae4e"); g.addColorStop(0.5, "#a97a27"); g.addColorStop(0.72, "#d9ad52"); g.addColorStop(1, "#7c5516"); return g; };
      c.save(); c.shadowColor = "rgba(20,8,0,0.6)"; c.shadowBlur = 5 * TS; c.shadowOffsetY = 2.5 * TS; c.shadowOffsetX = 1 * TS;
      rr(c, hx, hy, hw, hh, 2.5); c.fillStyle = "#8a5f1c"; c.fill();
      c.beginPath(); c.arc(hx - 4, hy + hh / 2, 5.2, 0, Math.PI * 2); c.arc(hx + hw + 4, hy + hh / 2, 5.2, 0, Math.PI * 2); c.fill();
      c.restore();
      c.fillStyle = brass(hy, hy + hh);
      c.beginPath(); c.arc(hx - 4, hy + hh / 2, 5.2, 0, Math.PI * 2); c.arc(hx + hw + 4, hy + hh / 2, 5.2, 0, Math.PI * 2); c.fill();
      rr(c, hx, hy, hw, hh, 2.5); c.fill();
      c.lineWidth = 0.7; c.strokeStyle = "rgba(255,246,204,0.9)"; c.beginPath(); c.moveTo(hx + 2, hy + 0.6); c.lineTo(hx + hw - 2, hy + 0.6); c.stroke();
      c.strokeStyle = "rgba(60,36,6,0.7)"; c.beginPath(); c.moveTo(hx + 2, hy + hh - 0.4); c.lineTo(hx + hw - 2, hy + hh - 0.4); c.stroke();
      [hx - 4.4, hx + hw + 4.4].forEach((sx, n) => {
        const sy = hy + hh / 2, g = c.createRadialGradient(sx - 0.8, sy - 0.9, 0.2, sx, sy, 2.7);
        g.addColorStop(0, "#fff3c2"); g.addColorStop(0.6, "#b98a35"); g.addColorStop(1, "#5c3d0d");
        c.beginPath(); c.arc(sx, sy, 2.6, 0, Math.PI * 2); c.fillStyle = g; c.fill();
        const a = 0.5 + n * 1.3 + idx; c.lineWidth = 0.7; c.strokeStyle = "rgba(40,22,2,0.85)";
        c.beginPath(); c.moveTo(sx - Math.cos(a) * 2.1, sy - Math.sin(a) * 2.1); c.lineTo(sx + Math.cos(a) * 2.1, sy + Math.sin(a) * 2.1); c.stroke();
      });
      // The card: cream stock, a shadow from the top lip, typewriter ink that is never quite even.
      const ix = hx + 4, iy = hy + 4, iw = hw - 8, ih = hh - 8;
      const card = c.createLinearGradient(0, iy, 0, iy + ih);
      card.addColorStop(0, "#cfc19c"); card.addColorStop(0.22, "#efe5c8"); card.addColorStop(1, "#e6d9b6");
      c.fillStyle = card; c.fillRect(ix, iy, iw, ih);
      seed = 55 + idx * 31;
      for (let i = 0; i < 70; i++) { c.fillStyle = `rgba(120,96,50,${rand() * 0.16})`; c.fillRect(ix + rand() * iw, iy + rand() * ih, 0.6 + rand() * 1.4, 0.5); }
      c.lineWidth = 0.8; c.strokeStyle = "rgba(50,28,4,0.75)"; c.strokeRect(ix - 0.2, iy - 0.2, iw + 0.4, ih + 0.4);
      const fs = Math.min(narrow ? 8.6 : 10.4, ((iw - 6) / d.label.length) * 1.58);
      c.font = `700 ${fs}px "Courier New", ui-monospace, Menlo, monospace`; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillStyle = "rgba(48,30,20,0.92)"; c.fillText(d.label, dw / 2 + (rand() - 0.5) * 1.2, iy + ih / 2 + 0.6);
      c.fillStyle = "rgba(48,30,20,0.3)"; c.fillText(d.label, dw / 2 + 0.35, iy + ih / 2 + 0.8);
      // The knob: a rose plate, a soft shadow thrown down and right, then the turned brass ball.
      c.beginPath(); c.arc(dw / 2, ky, kr + 3, 0, Math.PI * 2); c.fillStyle = brass(ky - kr - 3, ky + kr + 3); c.fill();
      c.lineWidth = 0.6; c.strokeStyle = "rgba(50,28,4,0.7)"; c.stroke();
      const drop = c.createRadialGradient(dw / 2 + 3.5, ky + 8, kr * 0.3, dw / 2 + 3.5, ky + 8, kr * 1.45); drop.addColorStop(0, "rgba(20,8,0,0.66)"); drop.addColorStop(1, "rgba(20,8,0,0)");
      c.fillStyle = drop; c.fillRect(dw / 2 - kr * 2, ky - kr, kr * 5, kr * 4);
      const ball = c.createRadialGradient(dw / 2 - kr * 0.38, ky - kr * 0.42, kr * 0.05, dw / 2, ky, kr);
      ball.addColorStop(0, "#fffbe2"); ball.addColorStop(0.16, "#f3d37c"); ball.addColorStop(0.55, "#b78430"); ball.addColorStop(0.88, "#6a4412"); ball.addColorStop(1, "#8f6524");
      c.beginPath(); c.arc(dw / 2, ky, kr, 0, Math.PI * 2); c.fillStyle = ball; c.fill();
      c.lineWidth = 1.1; c.strokeStyle = "rgba(255,214,140,0.5)"; c.beginPath(); c.arc(dw / 2, ky, kr - 1.2, Math.PI * 0.12, Math.PI * 0.62); c.stroke();
      c.beginPath(); c.ellipse(dw / 2 - kr * 0.36, ky - kr * 0.42, kr * 0.2, kr * 0.13, -0.6, 0, Math.PI * 2); c.fillStyle = "rgba(255,255,255,0.9)"; c.fill();
      return cvF;
    });

    // 2. What lies in each drawer, seen from above. Only a strip of it ever shows.
    const cw = dw - 14, chh = L.pull + 14;
    const fills = drawers.map((d, idx) => {
      const cvC = mk(cw * TS, chh * TS), c = cvC.getContext("2d");
      if (!c) return cvC;
      c.scale(TS, TS); seed = 911 + idx * 389;
      c.fillStyle = tone(d.colors[2], -0.5); c.fillRect(0, 0, cw, chh);
      const spec = { heads: [150, 3.6, 1], buds: [520, 1.9, 2.1], petals: [230, 4.4, 1.7], leaf: [380, 3.2, 2.2], seeds: [460, 2.3, 3], root: [150, 4.6, 1.6], berries: [130, 4.2, 1.1] }[d.kind] || [300, 3, 1.5];
      const scale = narrow ? 0.84 : 1;
      for (let i = 0; i < spec[0]; i++) {
        const x = rand() * cw, y = rand() * chh, r = spec[1] * scale * (0.7 + rand() * 0.6), long = spec[2] * (0.8 + rand() * 0.4), a = rand() * Math.PI;
        const col = tone(d.colors[(rand() * 3) | 0], (rand() - 0.5) * 0.36);
        c.save(); c.translate(x, y); c.rotate(a);
        c.beginPath(); c.ellipse(0.7, 1.3, r * long * 0.5 + 0.4, r * 0.5 + 0.4, 0, 0, Math.PI * 2); c.fillStyle = "rgba(0,0,0,0.42)"; c.fill();
        c.beginPath();
        if (d.kind === "root") { const w2 = r * long * 0.5, h2 = r * 0.5; c.moveTo(-w2, -h2 * 0.7); c.lineTo(w2 * 0.8, -h2); c.lineTo(w2, h2 * 0.6); c.lineTo(-w2 * 0.7, h2); c.closePath(); }
        else if (d.kind === "petals" || d.kind === "leaf") { const w2 = r * long * 0.5, h2 = r * 0.5; c.moveTo(-w2, 0); c.quadraticCurveTo(-w2 * 0.2, -h2 * 1.5, w2, -h2 * 0.2); c.quadraticCurveTo(w2 * 0.3, h2 * 1.4, -w2, 0); }
        else c.ellipse(0, 0, r * long * 0.5, r * 0.5, 0, 0, Math.PI * 2);
        c.fillStyle = col; c.fill();
        if (d.kind === "heads") { c.beginPath(); c.arc(0, 0, r * 0.22, 0, Math.PI * 2); c.fillStyle = tone(d.colors[2], -0.25); c.fill(); }
        if (d.kind === "berries" || d.kind === "heads") { c.beginPath(); c.arc(-r * 0.16, -r * 0.18, r * 0.13, 0, Math.PI * 2); c.fillStyle = "rgba(255,255,255,0.4)"; c.fill(); }
        if (d.kind === "leaf" || d.kind === "seeds") { c.lineWidth = 0.35; c.strokeStyle = "rgba(255,255,220,0.35)"; c.beginPath(); c.moveTo(-r * long * 0.4, 0); c.lineTo(r * long * 0.4, 0); c.stroke(); }
        c.restore();
      }
      return cvC;
    });
    const lip = mk(dw * TS, 8 * TS);
    { const c = lip.getContext("2d"); if (c) { c.scale(TS, TS); wood(c, dw, 8, tone2(OAK, 0.16), 4242); } }

    // 3. The cabinet itself, painted once per size.
    const base = mk(1, 1);
    let k = 1;
    const fit = () => {
      const w = cv.clientWidth || L.W, dpr = Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(w * dpr); cv.height = Math.round((w * L.H) / L.W * dpr); k = cv.width / L.W;
      base.width = cv.width; base.height = cv.height;
      const c = base.getContext("2d");
      if (!c) return;
      c.setTransform(k, 0, 0, k, 0, 0);
      const { bx, by, bodyW, bodyH, top, cornice, plinth } = L, bot = by + bodyH + plinth;
      // Shadow on the wall behind: one wide, one tight.
      c.save(); c.shadowColor = "rgba(0,0,0,0.55)"; c.shadowBlur = 40 * k; c.shadowOffsetY = 22 * k; c.shadowOffsetX = 10 * k; c.fillStyle = "#000"; c.fillRect(bx + 6, top + 8, bodyW - 12, bot - top - 12); c.restore();
      c.save(); c.shadowColor = "rgba(0,0,0,0.7)"; c.shadowBlur = 8 * k; c.shadowOffsetY = 5 * k; c.fillStyle = "#000"; c.fillRect(bx + 2, top + 4, bodyW - 4, bot - top - 6); c.restore();
      const carcass = mk(bodyW * 2, (bot - top) * 2), cc = carcass.getContext("2d");
      if (cc) { cc.scale(2, 2); wood(cc, bodyW, bot - top, WALNUT, 2024); }
      c.drawImage(carcass, bx, top, bodyW, bot - top);
      // Cornice and plinth mouldings.
      const mould = (y: number, h: number, out: number) => {
        const g = c.createLinearGradient(0, y, 0, y + h);
        g.addColorStop(0, "rgba(255,226,180,0.5)"); g.addColorStop(0.14, "rgba(255,226,180,0.1)"); g.addColorStop(0.55, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,0.6)");
        c.drawImage(carcass, 0, 0, bodyW * 2, h * 2, bx - out, y, bodyW + out * 2, h);
        c.fillStyle = g; c.fillRect(bx - out, y, bodyW + out * 2, h);
        const sh = c.createLinearGradient(0, y + h, 0, y + h + 7); sh.addColorStop(0, "rgba(0,0,0,0.5)"); sh.addColorStop(1, "rgba(0,0,0,0)");
        c.fillStyle = sh; c.fillRect(bx, y + h, bodyW, 7);
      };
      mould(top, cornice * 0.45, 7); mould(top + cornice * 0.45, cornice * 0.55, 3); mould(bot - plinth, plinth * 0.4, 2); mould(bot - plinth * 0.6, plinth * 0.6, 5);
      const side = c.createLinearGradient(bx, 0, bx + bodyW, 0);
      side.addColorStop(0, "rgba(255,226,180,0.2)"); side.addColorStop(0.03, "rgba(0,0,0,0)"); side.addColorStop(0.97, "rgba(0,0,0,0)"); side.addColorStop(1, "rgba(0,0,0,0.4)");
      c.fillStyle = side; c.fillRect(bx, by, bodyW, bodyH);
      // The openings: dark inside, lit along the lower and right-hand lips.
      drawers.forEach((_, i) => {
        const { x, y } = slot(L, i);
        c.fillStyle = "#120a05"; c.fillRect(x - 1.2, y - 1.2, dw + 2.4, dh + 2.4);
        const deep = c.createLinearGradient(0, y, 0, y + dh); deep.addColorStop(0, "#050302"); deep.addColorStop(1, "#2a1a0e");
        c.fillStyle = deep; c.fillRect(x, y, dw, dh);
        c.lineWidth = 0.9; c.strokeStyle = "rgba(255,214,160,0.34)";
        c.beginPath(); c.moveTo(x - 1.6, y + dh + 1.7); c.lineTo(x + dw + 1.7, y + dh + 1.7); c.lineTo(x + dw + 1.7, y - 1.6); c.stroke();
      });
    };

    const s = { p: drawers.map((_, i) => (live.current[i] ? 1 : 0)), v: drawers.map(() => 0), peek: drawers.map(() => 0) };

    const drawer = (i: number) => {
      const { x, y } = slot(L, i), p = Math.max(0, s.p[i]), d = p * L.pull, sc = 1 + 0.045 * p;
      const cx = x + dw / 2, fw = (dw - 2.4) * sc, fh = (dh - 2.4) * sc, fx = cx - fw / 2, fy = y + 1.2 + d;
      if (d > 0.4) {
        // Shadow the open drawer throws on whatever is underneath it.
        ctx.save(); ctx.shadowColor = `rgba(0,0,0,${Math.min(0.8, 0.35 + p * 0.45)})`; ctx.shadowBlur = (5 + 15 * p) * k; ctx.shadowOffsetY = (4 + 16 * p) * k; ctx.shadowOffsetX = 6 * p * k;
        ctx.fillStyle = "#000"; ctx.fillRect(fx + 3, fy + 4, fw - 6, fh - 8); ctx.restore();
        // The box behind the front: two pale sides and the contents between them.
        const bw0 = dw - 5, bw1 = (dw - 5) * sc, y0 = y + 2.2, y1 = fy + 0.5;
        ctx.save();
        ctx.beginPath(); ctx.moveTo(cx - bw0 / 2, y0); ctx.lineTo(cx + bw0 / 2, y0); ctx.lineTo(cx + bw1 / 2, y1); ctx.lineTo(cx - bw1 / 2, y1); ctx.closePath(); ctx.clip();
        ctx.fillStyle = "#d9b983"; ctx.fillRect(cx - bw1 / 2, y0, bw1, y1 - y0);
        ctx.drawImage(fills[i], cx - (cw * sc) / 2, y1 - chh * sc, cw * sc, chh * sc);
        // Each side wall shades the contents next to it; the cabinet shades the far end.
        const wall = ctx.createLinearGradient(cx - bw1 / 2 + 4.5, 0, cx - bw1 / 2 + 15, 0); wall.addColorStop(0, "rgba(0,0,0,0.6)"); wall.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = wall; ctx.fillRect(cx - bw1 / 2 + 4.5, y0, 11, y1 - y0);
        const far = ctx.createLinearGradient(0, y0, 0, y0 + Math.max(10, (y1 - y0) * 0.75)); far.addColorStop(0, "rgba(0,0,0,0.92)"); far.addColorStop(0.35, "rgba(0,0,0,0.5)"); far.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = far; ctx.fillRect(cx - bw1 / 2, y0, bw1, y1 - y0);
        ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(cx - bw1 / 2, y1 - 3.2, bw1, 3.2);
        ctx.restore();
        // Top edge of the front board.
        const lh = 4.2 * Math.min(1, p * 3);
        ctx.drawImage(lip, fx, fy - lh + 0.6, fw, lh);
        ctx.fillStyle = "rgba(255,240,206,0.4)"; ctx.fillRect(fx, fy - lh + 0.6, fw, 0.6);
      }
      ctx.drawImage(fronts[i], fx, fy, fw, fh);
      if (p > 0.05) { ctx.lineWidth = 0.7; ctx.strokeStyle = `rgba(24,10,2,${0.6 * Math.min(1, p)})`; ctx.strokeRect(fx + 0.3, fy + 0.3, fw - 0.6, fh - 0.6); }
      if (p > 0.01) { ctx.fillStyle = `rgba(255,236,200,${0.09 * Math.min(1, p)})`; ctx.fillRect(fx, fy, fw, fh); }
      if (p < 0.98) {
        // A closed drawer sits a hair behind the rails, so the rail above and to the left shades it.
        const a = 1 - Math.min(1, p * 4);
        const t = ctx.createLinearGradient(0, fy, 0, fy + 7); t.addColorStop(0, `rgba(0,0,0,${0.5 * a})`); t.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = t; ctx.fillRect(fx, fy, fw, 7);
        const l = ctx.createLinearGradient(fx, 0, fx + 5, 0); l.addColorStop(0, `rgba(0,0,0,${0.36 * a})`); l.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = l; ctx.fillRect(fx, fy, 5, fh);
      }
    };

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(base, 0, 0);
      ctx.setTransform(k, 0, 0, k, 0, 0);
      // Bottom row first, so a drawer pulled out above overlaps the row beneath it.
      for (let r = L.rows - 1; r >= 0; r--) for (let c = 0; c < L.cols; c++) { const i = r * L.cols + c; if (i < drawers.length) drawer(i); }
      // One lamp, up and to the left, laid over everything that has been painted.
      ctx.globalCompositeOperation = "source-atop";
      const lamp = ctx.createRadialGradient(L.W * 0.26, L.H * 0.1, 10, L.W * 0.4, L.H * 0.4, L.W * 0.8);
      lamp.addColorStop(0, "rgba(255,232,190,0.17)"); lamp.addColorStop(0.45, "rgba(255,232,190,0)"); lamp.addColorStop(1, "rgba(6,10,20,0.3)");
      ctx.fillStyle = lamp; ctx.fillRect(0, 0, L.W, L.H);
      ctx.globalCompositeOperation = "source-over";
    };

    // 4. Springs, and a hand that opens and shuts a drawer now and then until somebody else does.
    let raf = 0, last = 0, t0 = 0, seen = true, demo = !reduce, nextAt = 2.55, step = 0, first = true;
    const order = [6, 1, 14, 3, 9, 6, 10, 12, 1, 14, 5, 3, 9, 10, 12, 5];
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.04, (now - last) / 1000); last = now;
      const t = (now - t0) / 1000;
      if (demo && t > nextAt) {
        const i = order[step % order.length] % drawers.length; step++; nextAt = t + 2;
        const next = live.current.map((on, j) => (j === i ? !on : on));
        live.current = next; setPicked(next);
      }
      let moving = first; first = false;
      for (let i = 0; i < drawers.length; i++) {
        const to = (live.current[i] ? 1 : 0) + (live.current[i] ? 0 : s.peek[i] * 0.16);
        s.v[i] += (150 * (to - s.p[i]) - 15.5 * s.v[i]) * dt; s.p[i] += s.v[i] * dt;
        if (Math.abs(s.v[i]) > 0.002 || Math.abs(to - s.p[i]) > 0.002) moving = true;
      }
      if (moving) draw();
      if ((moving || demo) && seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const still = () => { for (let i = 0; i < drawers.length; i++) { s.p[i] = live.current[i] ? 1 : 0; s.v[i] = 0; } draw(); };
    const wake = () => { first = true; if (reduce) still(); else if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    api.current = { wake, stopDemo: () => { demo = false; }, peek: (i, on) => { s.peek[i] = on ? 1 : 0; wake(); } };
    fit(); wake();

    const ro = new ResizeObserver(() => { fit(); if (reduce) still(); else { draw(); wake(); } });
    ro.observe(cv);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); api.current = null; ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, [narrow]);

  const L = layoutFor(narrow);
  const set = (next: boolean[]) => { api.current?.stopDemo(); live.current = next; setPicked(next); api.current?.wake(); };
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;
  const chosen = drawers.filter((_, i) => picked[i]);

  return (
    <div ref={stage} className="flex min-h-[720px] w-full flex-col items-center justify-center bg-[#141b27] bg-[radial-gradient(80%_70%_at_30%_24%,#3a4960_0%,#222c3d_46%,#141b27_100%)] px-3 py-12 sm:px-6">
      <div role="group" aria-label="Filter by botanical" className="relative w-full" style={{ maxWidth: narrow ? 400 : 980, aspectRatio: `${L.W} / ${L.H}` }}>
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        {drawers.map((d, i) => {
          const at = slot(L, i);
          return (
            <label
              key={d.name}
              onPointerEnter={() => api.current?.peek(i, true)}
              onPointerLeave={() => api.current?.peek(i, false)}
              style={{ left: pct(at.x, L.W), top: pct(at.y, L.H), width: pct(L.dw, L.W), height: pct(L.dh + (picked[i] ? L.pull : 0), L.H) }}
              className="absolute cursor-pointer"
            >
              <input type="checkbox" aria-label={d.name} checked={picked[i]} onChange={() => set(live.current.map((on, j) => (j === i ? !on : on)))} className="peer sr-only" />
              <span aria-hidden="true" className="absolute inset-0 rounded-md peer-focus-visible:ring-2 peer-focus-visible:ring-[#e9bd62] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#141b27]" />
            </label>
          );
        })}
      </div>
      <div className="mt-6 flex min-h-[44px] max-w-[760px] flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center font-mono text-[11px] uppercase leading-5 tracking-[0.18em] text-slate-400">
        <p aria-live="polite">
          <span style={{ color: ACCENT }}>{chosen.length ? `${chosen.length} open` : "Pull a drawer to filter"}</span>
          {chosen.length > 0 && <span className="mx-2 text-slate-600">/</span>}
          <span className="text-slate-100">{chosen.map((d) => d.name).join(" + ")}</span>
        </p>
        {chosen.length > 0 && (
          <button type="button" onClick={() => set(drawers.map(() => false))} className="min-h-[40px] rounded-full border border-slate-500 px-4 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-100 outline-none transition-colors hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-[#e9bd62]">
            Shut them all
          </button>
        )}
      </div>
    </div>
  );
}
