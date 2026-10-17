import { useEffect, useRef, useState } from "react";

// Everything a visitor is likely to change sits here. The figures are invented demo data.
const UNIT = "share of cheese sold";
const cheeses = [
  { name: "Red wax gouda", rind: "#c7261c", paste: "#f2b632", gloss: 1, kind: "crystal" },
  { name: "Alpine", rind: "#c99442", paste: "#f6e39a", gloss: 0.22, kind: "holes" },
  { name: "Blue", rind: "#e6dfd0", paste: "#f4edd8", gloss: 0.1, kind: "veins" },
  { name: "Black wax cheddar", rind: "#222226", paste: "#f0922b", gloss: 1, kind: "crumb" },
  { name: "Sage", rind: "#4c7a37", paste: "#ece5b2", gloss: 0.8, kind: "flecks" },
];
const sets = [
  { label: "Market stall", values: [34, 24, 18, 14, 10] },
  { label: "Online shop", values: [20, 15, 12, 30, 23] },
];

const layoutFor = (narrow: boolean) =>
  narrow
    ? { W: 380, H: 340, cx: 172, cy: 150, R: 112, h: 42, board: 176, pull: 26, u: 0.7 }
    : { W: 860, H: 520, cx: 404, cy: 232, R: 198, h: 70, board: 322, pull: 62, u: 1 };
const E = 0.52; // how far the circle is squashed by the camera angle

const rgb = (hex: string) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
const shade = (hex: string, f: number, a = 1) => {
  const c = rgb(hex).map((v) => (f <= 1 ? v * f : v + (255 - v) * Math.min(1, f - 1)));
  return `rgba(${c.map((v) => Math.round(Math.max(0, Math.min(255, v)))).join(",")},${a})`;
};
const spans = (values: number[]) => {
  const total = values.reduce((a, b) => a + b, 0);
  let a = -0.3 - (values[0] / total) * Math.PI; // the first wedge points to the right and a little away, so its cut face shows when it slides out
  return values.map((v) => { const a0 = a; a += (v / total) * Math.PI * 2; return [a0, a]; });
};

export default function CheeseWheelPieChart() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [narrow, setNarrow] = useState(false);
  const [set, setSet] = useState(0);
  const [sel, setSel] = useState(-1);
  const [touched, setTouched] = useState(false);
  const live = useRef({ set: 0, sel: -1, hover: -1, touched: false });
  const api = useRef<{ poke: () => void } | null>(null);

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
    const L = layoutFor(narrow), n = cheeses.length, { cx, cy, R, h, u } = L;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
    let k = 1;
    const rnd = (seed: number) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; };

    // The marble board never changes, so it is painted once.
    const base = document.createElement("canvas");
    const build = () => {
      base.width = cv.width; base.height = cv.height;
      const b = base.getContext("2d");
      if (!b) return;
      b.setTransform(k, 0, 0, k, 0, 0);
      const bx = cx + 26 * u, by = cy + h + 6 * u, br = L.board, th = 15 * u;
      // Shadow of the board on the table.
      b.save(); b.translate(bx + 10 * u, by + th + 16 * u); b.scale(1, E);
      const sh = b.createRadialGradient(0, 0, br * 0.6, 0, 0, br * 1.22);
      sh.addColorStop(0, "rgba(2,6,14,0.75)"); sh.addColorStop(0.55, "rgba(2,6,14,0.4)"); sh.addColorStop(1, "rgba(2,6,14,0)");
      b.fillStyle = sh; b.beginPath(); b.arc(0, 0, br * 1.22, 0, Math.PI * 2); b.fill(); b.restore();
      // Edge of the slab.
      const side = b.createLinearGradient(bx - br, 0, bx + br, 0);
      side.addColorStop(0, "#b9bcc2"); side.addColorStop(0.3, "#eceef0"); side.addColorStop(0.62, "#b3b6bd"); side.addColorStop(1, "#7c8088");
      b.beginPath(); b.ellipse(bx, by + th, br, br * E, 0, 0, Math.PI); b.lineTo(bx - br, by); b.ellipse(bx, by, br, br * E, 0, Math.PI, 0, true); b.closePath(); b.fillStyle = side; b.fill();
      // Top of the slab with veining.
      const top = b.createRadialGradient(bx - br * 0.35, by - br * E * 0.5, 10, bx, by, br * 1.1);
      top.addColorStop(0, "#ffffff"); top.addColorStop(0.6, "#f1f1ee"); top.addColorStop(1, "#dcdcd8");
      b.beginPath(); b.ellipse(bx, by, br, br * E, 0, 0, Math.PI * 2); b.fillStyle = top; b.fill();
      b.save(); b.clip();
      const r = rnd(31);
      for (let v = 0; v < 7; v++) {
        let x = bx - br + r() * br * 2, y = by - br * E + r() * br * E * 2, dir = 0.5 + (r() - 0.5) * 0.9;
        const width = 0.4 + r() * 0.9;
        b.beginPath(); b.moveTo(x, y);
        for (let sgm = 0; sgm < 9; sgm++) {
          dir += (r() - 0.5) * 0.7;
          const mx = x + Math.cos(dir + (r() - 0.5)) * 30 * u, my = y + Math.sin(dir + (r() - 0.5)) * 15 * u;
          x += Math.cos(dir) * 62 * u; y += Math.sin(dir) * 31 * u; b.quadraticCurveTo(mx, my, x, y);
        }
        b.lineJoin = "round"; b.lineCap = "round";
        b.lineWidth = width * 16; b.strokeStyle = "rgba(128,134,150,0.03)"; b.stroke();
        b.lineWidth = width * 6; b.strokeStyle = "rgba(128,134,150,0.05)"; b.stroke();
        b.lineWidth = width; b.strokeStyle = `rgba(110,116,132,${0.1 + r() * 0.12})`; b.stroke();
      }
      b.restore();
      b.beginPath(); b.ellipse(bx, by, br - 0.8, br * E - 0.8, 0, Math.PI * 0.9, Math.PI * 1.9); b.lineWidth = 1.4; b.strokeStyle = "rgba(255,255,255,0.95)"; b.stroke();
      b.beginPath(); b.ellipse(bx, by, br - 0.5, br * E - 0.5, 0, 0, Math.PI); b.lineWidth = 1; b.strokeStyle = "rgba(255,255,255,0.7)"; b.stroke();
    };

    const fit = () => {
      const w = cv.clientWidth || L.W;
      k = (w / L.W) * Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(L.W * k); cv.height = Math.round(L.H * k);
      build();
    };

    const s = {
      share: sets[live.current.set].values.slice() as number[], sv: cheeses.map(() => 0),
      out: cheeses.map(() => 0), ov: cheeses.map(() => 0), sway: cheeses.map(() => 0), swv: cheeses.map(() => 0),
      light: -0.2, lightTo: -0.2,
    };

    type G = { i: number; a0: number; a1: number; am: number; ox: number; oy: number };
    const geom = (): G[] => spans(s.share).map(([a0, a1], i) => { const am = (a0 + a1) / 2; return { i, a0, a1, am, ox: Math.cos(am) * s.out[i], oy: Math.sin(am) * s.out[i] * E }; });
    const pt = (g: G, a: number, rad = 1): [number, number] => [cx + g.ox + Math.cos(a) * R * rad, cy + g.oy + Math.sin(a) * R * rad * E];
    const sector = (g: G, dy = 0, rad = 1) => {
      ctx.beginPath(); ctx.moveTo(cx + g.ox, cy + g.oy + dy); ctx.ellipse(cx + g.ox, cy + g.oy + dy, R * rad, R * rad * E, 0, g.a0, g.a1); ctx.closePath();
    };

    // One cut face: the paste, what is in it, and the rind seen edge-on.
    const face = (g: G, a: number, seed: number, nx: number) => {
      const c = cheeses[g.i], [bxp, byp] = pt(g, a), ax = cx + g.ox, ay = cy + g.oy;
      ctx.save(); ctx.transform(bxp - ax, byp - ay, 0, h, ax, ay);
      ctx.beginPath(); ctx.rect(0, 0, 1, 1); ctx.clip();
      const lit = 0.9 - nx * 0.14;
      const paste = ctx.createLinearGradient(0, 0, 0, 1);
      paste.addColorStop(0, shade(c.paste, lit * 1.06)); paste.addColorStop(0.7, shade(c.paste, lit * 0.97)); paste.addColorStop(1, shade(c.paste, lit * 0.78));
      ctx.fillStyle = paste; ctx.fillRect(0, 0, 1, 1);
      const r = rnd(seed), ex = 1 / R, ey = 1 / h;
      if (c.kind === "holes") for (let q = 0; q < 9; q++) {
        const x = 0.08 + r() * 0.8, y = 0.16 + r() * 0.66, rad = (3 + r() * 6.5) * u;
        const hole = ctx.createLinearGradient(0, y - rad * ey, 0, y + rad * ey);
        hole.addColorStop(0, shade(c.paste, lit * 0.56)); hole.addColorStop(0.6, shade(c.paste, lit * 0.84)); hole.addColorStop(1, shade(c.paste, lit * 1.02));
        ctx.beginPath(); ctx.ellipse(x, y, rad * ex, rad * ey, 0, 0, Math.PI * 2); ctx.fillStyle = hole; ctx.fill();
        ctx.beginPath(); ctx.ellipse(x, y, rad * ex, rad * ey, 0, 0.1 * Math.PI, 0.9 * Math.PI); ctx.lineWidth = 0.02; ctx.strokeStyle = "rgba(255,255,255,0.75)"; ctx.stroke();
      }
      if (c.kind === "veins") for (let q = 0; q < 16; q++) {
        let x = 0.05 + r() * 0.85, y = 0.12 + r() * 0.76;
        ctx.beginPath(); ctx.moveTo(x, y);
        for (let j = 0; j < 4; j++) { x += (r() - 0.5) * 16 * ex * u; y += (r() - 0.5) * 16 * ey * u; ctx.lineTo(x, y); }
        ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.lineWidth = (1.6 + r() * 2.6) * ey * u * 0.5; ctx.strokeStyle = `rgba(54,104,118,${0.4 + r() * 0.4})`; ctx.stroke();
        ctx.lineWidth *= 2.6; ctx.strokeStyle = "rgba(74,124,128,0.14)"; ctx.stroke();
      }
      if (c.kind === "flecks") for (let q = 0; q < 46; q++) {
        ctx.beginPath(); ctx.ellipse(0.03 + r() * 0.9, 0.1 + r() * 0.82, (0.8 + r() * 1.8) * ex * u, (0.6 + r() * 1.2) * ey * u, 0, 0, Math.PI * 2); ctx.fillStyle = `rgba(74,118,52,${0.45 + r() * 0.5})`; ctx.fill();
      }
      if (c.kind === "crystal") for (let q = 0; q < 26; q++) {
        ctx.beginPath(); ctx.ellipse(0.04 + r() * 0.88, 0.1 + r() * 0.8, (0.6 + r()) * ex * u, (0.6 + r()) * ey * u, 0, 0, Math.PI * 2); ctx.fillStyle = `rgba(255,250,225,${0.5 + r() * 0.45})`; ctx.fill();
      }
      if (c.kind === "crumb") for (let q = 0; q < 18; q++) {
        const x = 0.05 + r() * 0.82, y = 0.12 + r() * 0.76, len = (4 + r() * 12) * ex * u;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + len / 2, y + (r() - 0.5) * 5 * ey, x + len, y + (r() - 0.5) * 3 * ey);
        ctx.lineWidth = 0.9 * ey; ctx.strokeStyle = `rgba(150,70,8,${0.2 + r() * 0.24})`; ctx.stroke();
      }
      // Rind: along the top, down the outer end and along the foot.
      const rw = (c.gloss > 0.5 ? 4 : 5.5) * u;
      ctx.fillStyle = shade(c.rind, lit * 0.95); ctx.fillRect(1 - rw * ex, 0, rw * ex, 1); ctx.fillRect(0, 0, 1, rw * 0.7 * ey); ctx.fillRect(0, 1 - rw * 0.6 * ey, 1, rw * 0.6 * ey);
      const blend = ctx.createLinearGradient(1 - rw * 2.6 * ex, 0, 1 - rw * ex, 0);
      blend.addColorStop(0, shade(c.paste, lit * 0.8, 0)); blend.addColorStop(1, shade(c.paste, lit * 0.7, 0.6));
      ctx.fillStyle = blend; ctx.fillRect(1 - rw * 2.6 * ex, 0, rw * 1.6 * ex, 1);
      // Contact shade where the wedge meets the stone, and a little light along the top arris.
      const foot = ctx.createLinearGradient(0, 0.62, 0, 1);
      foot.addColorStop(0, "rgba(40,20,0,0)"); foot.addColorStop(1, "rgba(40,20,0,0.3)");
      ctx.fillStyle = foot; ctx.fillRect(0, 0.62, 1, 0.38);
      ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.fillRect(0, 0, 1, 1.1 * ey);
      ctx.restore();
    };

    const wedge = (g: G) => {
      const c = cheeses[g.i], la = 2.25 - s.light * 0.5;
      // Cut faces that look towards the camera.
      if (Math.cos(g.a0) < -0.02) face(g, g.a0, 100 + g.i * 7, Math.sin(g.a0));
      if (Math.cos(g.a1) > 0.02) face(g, g.a1, 200 + g.i * 7, -Math.sin(g.a1));
      // Outer wall, painted in thin staves so the light goes round it.
      const from = Math.max(g.a0, 0), to = Math.min(g.a1, Math.PI);
      if (to > from) {
        const steps = Math.max(1, Math.ceil((to - from) / 0.035));
        for (let q = 0; q < steps; q++) {
          const s0 = from + ((to - from) * q) / steps, s1 = Math.min(to, from + ((to - from) * (q + 1)) / steps + 0.014), mid = (s0 + s1) / 2;
          const lit = 0.56 + 0.44 * Math.max(0, Math.cos(mid - la)), spec = Math.pow(Math.max(0, Math.cos(mid - la)), 22) * c.gloss;
          const [x0, y0] = pt(g, s0), [x1, y1] = pt(g, s1), ym = Math.min(y0, y1);
          const wall = ctx.createLinearGradient(0, ym, 0, ym + h);
          wall.addColorStop(0, shade(c.rind, lit * 1.1)); wall.addColorStop(0.07, shade(c.rind, lit * 1.02)); wall.addColorStop(0.16, shade(c.rind, lit * 0.96 + spec * 0.7)); wall.addColorStop(0.3, shade(c.rind, lit * 0.94 + spec * 0.25)); wall.addColorStop(0.8, shade(c.rind, lit * 0.82)); wall.addColorStop(1, shade(c.rind, lit * 0.46));
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x1, y1 + h); ctx.lineTo(x0, y0 + h); ctx.closePath(); ctx.fillStyle = wall; ctx.fill();
        }
      }
      if (to > from) {
        // Light catching the shoulder where wall meets top, and the dark seam where it meets the stone.
        ctx.beginPath(); ctx.ellipse(cx + g.ox, cy + g.oy + 1.2 * u, R, R * E, 0, from, to); ctx.lineWidth = 1.6 * u; ctx.strokeStyle = `rgba(255,255,255,${0.22 + 0.36 * c.gloss})`; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(cx + g.ox, cy + g.oy + h - 1, R, R * E, 0, from, to); ctx.lineWidth = 2 * u; ctx.strokeStyle = "rgba(10,6,14,0.4)"; ctx.stroke();
      }
      // Top of the wedge.
      sector(g);
      const top = ctx.createRadialGradient(cx - R * 0.5, cy - R * E * 0.7, R * 0.1, cx, cy, R * 1.25);
      top.addColorStop(0, shade(c.rind, 1.16 + 0.1 * c.gloss)); top.addColorStop(0.55, shade(c.rind, 1)); top.addColorStop(1, shade(c.rind, 0.8));
      ctx.fillStyle = top; ctx.fill();
      ctx.save(); sector(g); ctx.clip();
      // Texture of the rind: pores and mould marks, placed relative to the wedge so they travel with it.
      const r = rnd(900 + g.i * 13), dark = c.rind === "#222226";
      for (let q = 0; q < (c.gloss > 0.5 ? 26 : 150); q++) {
        const a = g.a0 + r() * (g.a1 - g.a0), rad = Math.sqrt(r()), [x, y] = pt(g, a, rad), sz = (0.5 + r() * (c.gloss > 0.5 ? 1.2 : 2.4)) * u;
        ctx.beginPath(); ctx.ellipse(x, y, sz, sz * E, 0, 0, Math.PI * 2);
        ctx.fillStyle = r() > 0.5 ? `rgba(255,255,255,${c.gloss > 0.5 ? 0.1 : 0.22})` : `rgba(${dark ? "0,0,0" : "70,40,10"},${c.gloss > 0.5 ? 0.12 : 0.14})`; ctx.fill();
      }
      for (let ring = 0.2; ring < 1; ring += 0.2) { ctx.beginPath(); ctx.ellipse(cx + g.ox, cy + g.oy, R * ring, R * ring * E, 0, 0, Math.PI * 2); ctx.lineWidth = 0.8; ctx.strokeStyle = `rgba(${dark ? "255,255,255" : "40,20,0"},${dark ? 0.05 : 0.07})`; ctx.stroke(); }
      // Sheen of the wax: a broad window reflection and a tighter hot spot, both sliding with the light.
      const [mx, my] = pt(g, g.am, 0.56), gx = mx - R * (0.1 + 0.14 * s.light), gy = my - R * E * 0.1;
      ctx.save(); ctx.translate(gx, gy); ctx.rotate(-0.3); ctx.scale(1, 0.3);
      const sheen = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.5);
      sheen.addColorStop(0, `rgba(255,255,255,${0.62 * c.gloss + 0.06})`); sheen.addColorStop(0.35, `rgba(255,255,255,${0.26 * c.gloss + 0.03})`); sheen.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = sheen; ctx.beginPath(); ctx.arc(0, 0, R * 0.5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      // The rounded shoulder: bright on the far rim, dark on the near one.
      ctx.beginPath(); ctx.ellipse(cx + g.ox, cy + g.oy, R - 2.2 * u, (R - 2.2 * u) * E, 0, Math.PI, Math.PI * 2); ctx.lineWidth = 3 * u; ctx.strokeStyle = `rgba(255,255,255,${0.12 + 0.3 * c.gloss})`; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx + g.ox, cy + g.oy, R - 1.6 * u, (R - 1.6 * u) * E, 0, 0, Math.PI); ctx.lineWidth = 3.4 * u; ctx.strokeStyle = "rgba(0,0,0,0.16)"; ctx.stroke();
      ctx.restore();
      // Knife-cut arrises catch the light.
      const [ex0, ey0] = pt(g, g.a0), [ex1, ey1] = pt(g, g.a1);
      ctx.beginPath(); ctx.moveTo(ex0, ey0); ctx.lineTo(cx + g.ox, cy + g.oy); ctx.lineTo(ex1, ey1); ctx.lineWidth = 0.9; ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.stroke();
    };

    // The little paper flag on a cocktail stick that carries the figure.
    const flag = (g: G) => {
      const [x, y] = pt(g, g.am, 0.6), tall = 52 * u, sw = s.sway[g.i], fw = 48 * u, fh = 24 * u;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 22 * u, y + 9 * u); ctx.lineWidth = 2 * u; ctx.strokeStyle = "rgba(0,0,0,0.22)"; ctx.lineCap = "round"; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x, y, 2.4 * u, 1.3 * u, 0, 0, Math.PI * 2); ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fill();
      ctx.save(); ctx.translate(x, y); ctx.rotate(sw);
      const stick = ctx.createLinearGradient(-1.4 * u, 0, 1.4 * u, 0);
      stick.addColorStop(0, "#f3d9a4"); stick.addColorStop(0.5, "#d9b06a"); stick.addColorStop(1, "#8f6a30");
      ctx.fillStyle = stick; ctx.fillRect(-1.3 * u, -tall, 2.6 * u, tall);
      ctx.beginPath(); ctx.moveTo(-1.3 * u, -tall); ctx.lineTo(0, -tall - 5 * u); ctx.lineTo(1.3 * u, -tall); ctx.fillStyle = "#d9b06a"; ctx.fill();
      // Paper, folded round the stick, with the far half a touch darker.
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.35)"; ctx.shadowBlur = 5 * k; ctx.shadowOffsetX = 3 * k; ctx.shadowOffsetY = 4 * k;
      ctx.beginPath(); ctx.moveTo(0, -tall + 3 * u); ctx.lineTo(fw, -tall + 1 * u); ctx.lineTo(fw - 7 * u, -tall + 3 * u + fh / 2); ctx.lineTo(fw, -tall + 5 * u + fh); ctx.lineTo(0, -tall + 3 * u + fh); ctx.closePath();
      const sheet = ctx.createLinearGradient(0, 0, fw, 0);
      sheet.addColorStop(0, "#fffdf6"); sheet.addColorStop(0.55, "#f7f1e2"); sheet.addColorStop(1, "#e3dac4");
      ctx.fillStyle = sheet; ctx.fill(); ctx.restore();
      ctx.fillStyle = "rgba(0,0,0,0.1)"; ctx.fillRect(0, -tall + 3 * u, 2.6 * u, fh);
      ctx.fillStyle = cheeses[g.i].rind === "#e6dfd0" ? "#8f8672" : cheeses[g.i].rind; ctx.fillRect(4.5 * u, -tall + 3 * u + fh - 5 * u, fw - 16 * u, 2.2 * u);
      ctx.font = `800 ${Math.max(10, 13.5 * u)}px ${MONO}`; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillStyle = "#1c1917";
      ctx.fillText(`${Math.round(s.share[g.i])}%`, 5 * u, -tall + 3 * u + fh * 0.4);
      ctx.restore();
    };

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(base, 0, 0);
      ctx.setTransform(k, 0, 0, k, 0, 0);
      const gs = geom();
      // Shadows on the stone: a soft cast shadow and a tight one under each foot.
      for (const g of gs) {
        ctx.save(); ctx.shadowColor = "rgba(30,26,44,0.5)"; ctx.shadowBlur = 26 * k * u; ctx.shadowOffsetX = 22 * k * u; ctx.shadowOffsetY = 20 * k * u; sector(g, h, 0.98); ctx.fillStyle = "#3a3440"; ctx.fill(); ctx.restore();
        ctx.save(); ctx.shadowColor = "rgba(20,14,24,0.75)"; ctx.shadowBlur = 9 * k * u; ctx.shadowOffsetX = 3 * k * u; ctx.shadowOffsetY = 4 * k * u; sector(g, h, 0.99); ctx.fillStyle = "#2a2430"; ctx.fill(); ctx.restore();
      }
      const order = gs.slice().sort((p, q) => Math.sin(p.am) * (R + s.out[p.i]) - Math.sin(q.am) * (R + s.out[q.i]));
      for (const g of order) wedge(g);
      for (const g of order) flag(g);
    };

    let raf = 0, last = 0, t0 = 0, seen = true, moved = -1e9, step = 0, nextStep = 0.35;
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.04, (now - last) / 1000); last = now;
      const t = (now - t0) / 1000;
      // The self-running demo: pull each wedge in turn, then change the data set.
      if (!live.current.touched && t > nextStep) {
        if (step < n) { live.current.sel = step; setSel(step); step++; nextStep = t + (step === 1 ? 3.4 : 2.3); }
        else { step = 0; nextStep = t + 1.5; live.current.sel = -1; setSel(-1); live.current.set = (live.current.set + 1) % sets.length; setSet(live.current.set); }
      }
      if (now - moved > 2600) s.lightTo = 0.7 * Math.sin(t * 0.5);
      s.light += (s.lightTo - s.light) * Math.min(1, dt * 5);
      const goal = sets[live.current.set].values;
      for (let i = 0; i < n; i++) {
        s.sv[i] += (60 * (goal[i] - s.share[i]) - 13 * s.sv[i]) * dt; s.share[i] = Math.max(1, s.share[i] + s.sv[i] * dt);
        const want = live.current.sel === i ? L.pull : live.current.hover === i ? L.pull * 0.2 : 0, before = s.ov[i];
        s.ov[i] += (170 * (want - s.out[i]) - 17 * s.ov[i]) * dt; s.out[i] = Math.max(0, s.out[i] + s.ov[i] * dt);
        // The flag lags behind its wedge and wags as it stops.
        s.swv[i] += (-(s.ov[i] - before) * 0.012 * Math.cos((spans(s.share)[i][0] + spans(s.share)[i][1]) / 2) - 90 * s.sway[i] * dt - 5 * s.swv[i] * dt);
        s.sway[i] += s.swv[i] * dt;
      }
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const still = () => {
      const goal = sets[live.current.set].values;
      for (let i = 0; i < n; i++) { s.share[i] = goal[i]; s.out[i] = live.current.sel === i ? L.pull : 0; s.sway[i] = 0; }
      draw();
    };
    const wake = () => { if (reduce) still(); else if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    api.current = { poke: wake };
    if (reduce && live.current.sel < 0 && !live.current.touched) { live.current.sel = 0; setSel(0); }
    fit(); wake();

    // Which wedge is under the pointer: test the top of each one, then its wall.
    const hit = (e: PointerEvent) => {
      const b = cv.getBoundingClientRect(), x = ((e.clientX - b.left) / b.width) * L.W, y = ((e.clientY - b.top) / b.height) * L.H;
      for (const g of geom()) for (const drop of [0, h * 0.5, h]) {
        const dx = (x - cx - g.ox) / R, dy = (y - drop - cy - g.oy) / (R * E);
        if (dx * dx + dy * dy > 1) continue;
        let a = Math.atan2(dy, dx); while (a < g.a0) a += Math.PI * 2;
        if (a <= g.a1) return g.i;
      }
      return -1;
    };
    const onMove = (e: PointerEvent) => {
      const b = cv.getBoundingClientRect(); moved = performance.now();
      s.lightTo = Math.max(-1, Math.min(1, ((e.clientX - b.left) / b.width) * 2 - 1));
      const i = hit(e); live.current.hover = i; cv.style.cursor = i >= 0 ? "pointer" : "default";
    };
    const onLeave = () => { live.current.hover = -1; };
    const onDown = (e: PointerEvent) => {
      const i = hit(e); if (i < 0) return;
      live.current.touched = true; setTouched(true);
      live.current.sel = live.current.sel === i ? -1 : i; setSel(live.current.sel); wake();
    };
    cv.addEventListener("pointermove", onMove); cv.addEventListener("pointerleave", onLeave); cv.addEventListener("pointerdown", onDown);
    const ro = new ResizeObserver(() => { fit(); if (reduce) still(); });
    ro.observe(cv);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); api.current = null;
      cv.removeEventListener("pointermove", onMove); cv.removeEventListener("pointerleave", onLeave); cv.removeEventListener("pointerdown", onDown);
      ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, [narrow]);

  const L = layoutFor(narrow);
  const touch = () => { if (!live.current.touched) { live.current.touched = true; setTouched(true); } };
  const choose = (i: number) => { touch(); live.current.set = i; setSet(i); api.current?.poke(); };
  const pick = (i: number) => { touch(); live.current.sel = live.current.sel === i ? -1 : i; setSel(live.current.sel); api.current?.poke(); };
  const values = sets[set].values;

  return (
    <div ref={stage} className="flex min-h-[640px] w-full flex-col items-center justify-center bg-[#121a2b] sm:min-h-[760px] bg-[radial-gradient(100%_70%_at_50%_36%,#2a3c5c_0%,#121a2b_66%)] px-4 py-10">
      <div className="relative w-full" style={{ maxWidth: L.W, aspectRatio: `${L.W} / ${L.H}` }}>
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full touch-manipulation" />
      </div>

      <div className="mt-4 flex w-full max-w-[900px] flex-col items-center gap-4">
        <div role="group" aria-label="Data set" className="flex rounded-full bg-black/30 p-1 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6),0_1px_0_rgba(255,255,255,0.08)]">
          {sets.map((d, i) => (
            <button
              key={d.label}
              type="button"
              aria-pressed={set === i}
              onClick={() => choose(i)}
              className={`h-10 rounded-full px-5 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-amber-300 motion-reduce:transition-none ${set === i ? "bg-[#f6efe0] text-stone-900 shadow-[0_2px_6px_rgba(0,0,0,0.5)]" : "text-slate-300 hover:text-white"}`}
            >
              {d.label}
            </button>
          ))}
        </div>
        <ul aria-label={`${sets[set].label}: ${UNIT}, demo data`} className="flex flex-wrap justify-center gap-x-1 gap-y-1">
          {cheeses.map((c, i) => (
            <li key={c.name}>
              <button
                type="button"
                aria-pressed={sel === i}
                onClick={() => pick(i)}
                className={`flex h-10 items-center gap-2 rounded-full px-3 font-mono text-[11px] uppercase tracking-[0.12em] outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-amber-300 motion-reduce:transition-none ${sel === i ? "bg-white/15 text-white" : "text-slate-300 hover:text-white"}`}
              >
                <span aria-hidden="true" className="h-3 w-3 rounded-full ring-1 ring-white/40" style={{ background: c.rind }} />
                {c.name}
                <span className="font-semibold text-white">{values[i]}%</span>
              </button>
            </li>
          ))}
        </ul>
        <p aria-live={touched ? "polite" : "off"} className="min-h-[20px] text-center font-mono text-[11px] uppercase leading-5 tracking-[0.16em] text-slate-400">
          <span className="text-slate-100">{sel >= 0 ? `${cheeses[sel].name} ${values[sel]}%` : sets[set].label}</span>
          <span className="mx-2 text-slate-600">/</span>
          {UNIT}, demo data
        </p>
      </div>
    </div>
  );
}
