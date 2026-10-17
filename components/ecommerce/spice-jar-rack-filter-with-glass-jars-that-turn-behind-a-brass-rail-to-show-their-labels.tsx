import { useEffect, useRef, useState } from "react";

// Everything a visitor is likely to change sits here.
// kind: "powder" | "balls" | "flakes" | "crystals" decides how the contents are painted.
const spices = [
  { name: "Smoked paprika", label: "PAPRIKA", note: "SMOKED / 45 G", kind: "powder", color: "#a2331b", grain: 0 },
  { name: "Turmeric", label: "TURMERIC", note: "GROUND / 40 G", kind: "powder", color: "#d6931a", grain: 0 },
  { name: "Black pepper", label: "PEPPER", note: "WHOLE / 50 G", kind: "balls", color: "#2b2523", grain: 3.9 },
  { name: "Oregano", label: "OREGANO", note: "DRIED / 12 G", kind: "flakes", color: "#6d7a3c", grain: 0 },
  { name: "Pink salt", label: "PINK SALT", note: "COARSE / 90 G", kind: "crystals", color: "#e3aa9c", grain: 0 },
  { name: "Mustard seed", label: "MUSTARD", note: "YELLOW / 60 G", kind: "balls", color: "#c08a2a", grain: 2.3 },
];
const START = [0, 2]; // jars that already face the room when the page opens
const R = 46; // jar radius in design pixels
const BH = 160; // height of the glass
const LID = 22; // height of the steel lid
const TILT = 0.17; // how far we look down on the shelf: 0 is dead level
const FILL = 30; // empty glass above the spice
const ACCENT = "#f0c060"; // caption accent (the focus rings use the same value in their class names)

const layoutFor = (narrow: boolean) =>
  narrow
    ? { W: 380, H: 570, rows: [{ y: 222, x0: 8, x1: 372 }, { y: 490, x0: 8, x1: 372 }], jars: [0, 1, 2, 3, 4, 5].map((i) => ({ x: 70 + (i % 3) * 120, y: i < 3 ? 222 : 490 })) }
    : { W: 860, H: 330, rows: [{ y: 232, x0: 30, x1: 830 }], jars: [0, 1, 2, 3, 4, 5].map((i) => ({ x: 105 + i * 130, y: 232 })) };

const tone = (hex: string, amt: number) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt))));
  return `rgb(${ch(n >> 16)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
};

export default function SpiceJarRackFilter() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [narrow, setNarrow] = useState(false);
  const [picked, setPicked] = useState<boolean[]>(() => spices.map((_, i) => START.includes(i)));
  const live = useRef<boolean[]>(picked);
  const api = useRef<{ turn: (i: number) => void; stopDemo: () => void } | null>(null);

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

    // 1. The unrolled surface of every jar: what you would get by slitting the glass and laying it flat.
    const TS = 3, TW = Math.round(2 * Math.PI * R), SPICE_END = BH - 9;
    const LW = 120, LX = TW / 2 - LW / 2, LY = 42, LH = 78;
    const textures = spices.map((sp, idx) => {
      seed = 31 + idx * 977;
      const inner = mk(TW * TS, BH * TS), label = mk(TW * TS, BH * TS);
      const c = inner.getContext("2d"), l = label.getContext("2d");
      if (!c || !l) return { inner, label };
      c.scale(TS, TS); l.scale(TS, TS);
      const tiled = (x: number, fn: (x: number) => void) => { fn(x); fn(x - TW); fn(x + TW); };
      const body = c.createLinearGradient(0, FILL, 0, SPICE_END);
      body.addColorStop(0, tone(sp.color, sp.kind === "balls" ? -0.5 : 0.1)); body.addColorStop(1, tone(sp.color, sp.kind === "balls" ? -0.7 : -0.22));
      c.fillStyle = body; c.fillRect(0, FILL, TW, SPICE_END - FILL);
      const span = SPICE_END - FILL;
      if (sp.kind === "powder") {
        for (let i = 0; i < 5200; i++) {
          const v = rand(), y = FILL + rand() * span;
          c.fillStyle = tone(sp.color, (v - 0.5) * 0.55); c.globalAlpha = 0.5 + rand() * 0.5;
          c.fillRect(rand() * TW, y, 0.5 + rand() * 1.1, 0.5 + rand() * 0.9);
        }
        // Soft tide lines where the powder settled after the last shake.
        for (let i = 0; i < 5; i++) {
          const y = FILL + 8 + rand() * (span - 12), ph = rand() * 6;
          c.beginPath(); for (let x = 0; x <= TW; x += 4) c.lineTo(x, y + Math.sin((x / TW) * Math.PI * 2 * (1 + (i % 2)) + ph) * 3);
          c.globalAlpha = 0.16; c.lineWidth = 2.2; c.strokeStyle = tone(sp.color, i % 2 ? 0.35 : -0.4); c.stroke();
        }
        c.globalAlpha = 1;
      } else if (sp.kind === "balls") {
        const g = sp.grain, count = Math.round((TW * span) / (g * g * 1.9));
        for (let i = 0; i < count; i++) {
          const x = rand() * TW, y = FILL + g * 0.6 + rand() * (span - g), r = g * (0.82 + rand() * 0.36), v = rand();
          tiled(x, (px) => {
            c.beginPath(); c.arc(px + 0.5, y + 0.9, r, 0, Math.PI * 2); c.fillStyle = "rgba(0,0,0,0.45)"; c.fill();
            const ball = c.createRadialGradient(px - r * 0.35, y - r * 0.4, r * 0.1, px, y, r);
            ball.addColorStop(0, tone(sp.color, 0.42 + v * 0.2)); ball.addColorStop(0.45, tone(sp.color, (v - 0.5) * 0.4)); ball.addColorStop(1, tone(sp.color, -0.55));
            c.beginPath(); c.arc(px, y, r, 0, Math.PI * 2); c.fillStyle = ball; c.fill();
          });
        }
      } else if (sp.kind === "flakes") {
        const greens = ["#56672c", "#7d8a45", "#8f9652", "#4a5627", "#a39a5c", "#6b5a36"];
        for (let i = 0; i < 2400; i++) {
          const x = rand() * TW, y = FILL + rand() * span, w = 1.6 + rand() * 4.2, h = 0.8 + rand() * 1.9, a = rand() * Math.PI;
          const col = tone(greens[(rand() * greens.length) | 0], (rand() - 0.6) * 0.5);
          tiled(x, (px) => { c.save(); c.translate(px, y); c.rotate(a); c.fillStyle = "rgba(0,0,0,0.35)"; c.fillRect(-w / 2 + 0.4, -h / 2 + 0.6, w, h); c.fillStyle = col; c.fillRect(-w / 2, -h / 2, w, h); c.restore(); });
        }
      } else {
        for (let i = 0; i < 1500; i++) {
          const x = rand() * TW, y = FILL + rand() * span, r = 1.4 + rand() * 3.4, a0 = rand() * 6, v = rand();
          tiled(x, (px) => {
            c.beginPath(); for (let k2 = 0; k2 < 5; k2++) { const a = a0 + (k2 / 5) * Math.PI * 2, rr2 = r * (0.7 + ((k2 * 37 + i) % 5) * 0.09); c.lineTo(px + Math.cos(a) * rr2, y + Math.sin(a) * rr2); }
            c.closePath(); c.fillStyle = tone(sp.color, (v - 0.35) * 0.9); c.fill();
            c.lineWidth = 0.45; c.strokeStyle = v > 0.5 ? "rgba(255,255,255,0.6)" : "rgba(120,60,50,0.4)"; c.stroke();
          });
        }
      }
      // Dust that clings to the empty glass above the fill line.
      for (let i = 0; i < 130; i++) { const d = rand(); c.globalAlpha = 0.5 * (1 - d); c.fillStyle = tone(sp.color, 0.1); c.fillRect(rand() * TW, FILL - d * 16, 0.7, 0.7); }
      c.globalAlpha = 1;
      // The thick glass foot.
      const foot = c.createLinearGradient(0, SPICE_END, 0, BH);
      foot.addColorStop(0, "rgba(16,24,20,0.9)"); foot.addColorStop(0.25, "rgba(150,185,170,0.5)"); foot.addColorStop(0.6, "rgba(60,82,74,0.75)"); foot.addColorStop(1, "rgba(190,220,208,0.6)");
      c.fillStyle = foot; c.fillRect(0, SPICE_END, TW, BH - SPICE_END);

      // The paper label.
      l.fillStyle = "#efe6d1"; l.fillRect(LX, LY, LW, LH);
      for (let i = 0; i < 900; i++) { l.fillStyle = rand() > 0.5 ? "rgba(255,255,255,0.35)" : "rgba(120,96,60,0.09)"; l.fillRect(LX + rand() * LW, LY + rand() * LH, 0.8, 0.8); }
      l.fillStyle = sp.color; l.fillRect(LX, LY, LW, 7);
      l.strokeStyle = "rgba(70,54,36,0.75)"; l.lineWidth = 0.7; l.strokeRect(LX + 5, LY + 12, LW - 10, LH - 17);
      l.strokeStyle = "rgba(70,54,36,0.35)"; l.lineWidth = 0.4; l.strokeRect(LX + 7, LY + 14, LW - 14, LH - 21);
      l.textAlign = "center"; l.textBaseline = "middle"; l.fillStyle = "#3a2c1e";
      const spaced = (text: string, y: number, font: string, gap: number, max: number) => {
        l.font = font;
        const widths = Array.from(text).map((ch) => l.measureText(ch).width + gap), total = widths.reduce((a, b) => a + b, 0) - gap, sc = Math.min(1, max / total);
        l.save(); l.translate(TW / 2, y); l.scale(sc, 1); let x = -total / 2;
        Array.from(text).forEach((ch, i) => { l.fillText(ch, x + (widths[i] - gap) / 2, 0); x += widths[i]; });
        l.restore();
      };
      spaced(`No. 0${idx + 1}`, LY + 23, "600 6.5px ui-monospace, SFMono-Regular, Menlo, monospace", 1.2, LW - 30);
      spaced(sp.label, LY + 41, "700 17px Georgia, 'Times New Roman', serif", 1.6, LW - 28);
      l.fillRect(TW / 2 - 14, LY + 53.5, 28, 0.7);
      spaced(sp.note, LY + 63, "600 6.5px ui-monospace, SFMono-Regular, Menlo, monospace", 1, LW - 30);
      return { inner, label };
    });

    const body = (c: CanvasRenderingContext2D, cx: number, y0: number, r: number, top: number) => {
      c.beginPath(); c.moveTo(cx - r, top); c.lineTo(cx - r, y0 + BH); c.ellipse(cx, y0 + BH, r, r * TILT, 0, Math.PI, 0, true); c.lineTo(cx + r, top); c.closePath();
    };

    // 2. Layers that never change: wall and shelf behind, glass shine, rail in front.
    let k = 1;
    let base = mk(1, 1), front = mk(1, 1), glass = mk(1, 1);
    const GP = 6; // padding around the glass sprite
    const build = () => {
      base = mk(cv.width, cv.height); front = mk(cv.width, cv.height); glass = mk((R * 2 + GP * 2) * k, (BH + R * TILT + GP * 2) * k);
      const b = base.getContext("2d"), f = front.getContext("2d"), g = glass.getContext("2d");
      if (!b || !f || !g) return;
      b.setTransform(k, 0, 0, k, 0, 0); f.setTransform(k, 0, 0, k, 0, 0); g.setTransform(k, 0, 0, k, 0, 0);
      seed = 5;
      // Wall: painted plaster, lit from the upper left.
      for (const row of L.rows) {
        const top = row.y - R * TILT - 9, lip = row.y + R * TILT + 11, w = row.x1 - row.x0;
        // Shadow the shelf throws down the wall.
        b.save(); b.shadowColor = "rgba(0,0,0,0.6)"; b.shadowBlur = 26 * k; b.shadowOffsetX = 3000 * k; b.shadowOffsetY = 26 * k; b.fillStyle = "#000"; b.fillRect(row.x0 + 10 - 3000, lip, w - 20, 16); b.restore();
        // Shadows the jars throw on the wall.
        b.save(); b.shadowColor = "rgba(0,0,0,0.42)"; b.shadowBlur = 20 * k; b.shadowOffsetX = (22 + 2000) * k; b.shadowOffsetY = 8 * k; b.fillStyle = "#000";
        L.jars.filter((j) => j.y === row.y).forEach((j) => b.fillRect(j.x - R - 2000, j.y - BH - LID + 6, R * 2, BH + LID - 18));
        b.restore();
        // Oak plank: top face, then front edge.
        const face = b.createLinearGradient(0, top, 0, lip);
        face.addColorStop(0, "#7a5230"); face.addColorStop(1, "#b98651");
        b.fillStyle = face; b.fillRect(row.x0, top, w, lip - top);
        const edge = b.createLinearGradient(0, lip, 0, lip + 17);
        edge.addColorStop(0, "#8d6238"); edge.addColorStop(1, "#553519");
        b.fillStyle = edge; b.fillRect(row.x0, lip, w, 17);
        b.save(); b.beginPath(); b.rect(row.x0, top, w, lip - top + 17); b.clip();
        for (let i = 0; i < 150; i++) {
          const y = top + rand() * (lip - top + 17), x = row.x0 + rand() * w, len = 40 + rand() * 260, v = rand();
          b.beginPath(); b.moveTo(x, y); b.bezierCurveTo(x + len * 0.3, y + (rand() - 0.5) * 2.4, x + len * 0.7, y + (rand() - 0.5) * 2.4, x + len, y + (rand() - 0.5) * 1.6);
          b.lineWidth = 0.5 + rand() * 0.6; b.strokeStyle = v > 0.6 ? "rgba(255,226,180,0.13)" : "rgba(52,28,10,0.22)"; b.stroke();
        }
        b.restore();
        b.fillStyle = "rgba(255,232,196,0.5)"; b.fillRect(row.x0, lip - 0.6, w, 1.1);
        b.fillStyle = "rgba(0,0,0,0.5)"; b.fillRect(row.x0, lip + 16.2, w, 0.9);
        b.fillStyle = "rgba(0,0,0,0.3)"; b.fillRect(row.x0, top, w, 2.5);
        // Where each jar touches the wood.
        for (const j of L.jars.filter((q) => q.y === row.y)) {
          const sh = b.createRadialGradient(j.x + 5, j.y + 3, R * 0.5, j.x + 5, j.y + 3, R * 1.45);
          sh.addColorStop(0, "rgba(22,10,2,0.75)"); sh.addColorStop(1, "rgba(22,10,2,0)");
          b.save(); b.translate(j.x + 5, j.y + 3); b.scale(1, TILT * 1.5); b.translate(-(j.x + 5), -(j.y + 3)); b.fillStyle = sh; b.beginPath(); b.arc(j.x + 5, j.y + 3, R * 1.45, 0, Math.PI * 2); b.fill(); b.restore();
        }
        // Light that came through the contents lands on the wood as a faint stain of colour.
        L.jars.forEach((j, i) => {
          if (j.y !== row.y) return;
          b.save(); b.beginPath(); b.rect(row.x0, top, w, lip - top); b.clip(); b.globalAlpha = 0.34; b.globalCompositeOperation = "lighter";
          const glow = b.createRadialGradient(j.x + 30, j.y + 6, 2, j.x + 30, j.y + 6, R * 0.9);
          glow.addColorStop(0, tone(spices[i].color, 0.25)); glow.addColorStop(1, "rgba(0,0,0,0)");
          b.translate(j.x + 30, j.y + 6); b.scale(1, 0.3); b.translate(-(j.x + 30), -(j.y + 6)); b.fillStyle = glow; b.beginPath(); b.arc(j.x + 30, j.y + 6, R * 0.9, 0, Math.PI * 2); b.fill(); b.restore();
        });
        // Brass gallery rail on two turned posts.
        const railY = row.y - 24, px0 = row.x0 + 16, px1 = row.x1 - 16, foot = lip - 3;
        f.save(); f.shadowColor = "rgba(0,0,0,0.5)"; f.shadowBlur = 5 * k; f.shadowOffsetY = 3 * k;
        const rod = f.createLinearGradient(0, railY - 3, 0, railY + 3);
        rod.addColorStop(0, "#8a6218"); rod.addColorStop(0.28, "#fff0b8"); rod.addColorStop(0.5, "#dba63f"); rod.addColorStop(0.8, "#7c5514"); rod.addColorStop(1, "#b98a30");
        f.fillStyle = rod; f.fillRect(px0, railY - 3, px1 - px0, 6); f.restore();
        for (const px of [px0, px1]) {
          const post = f.createLinearGradient(px - 3, 0, px + 3, 0);
          post.addColorStop(0, "#6f4c12"); post.addColorStop(0.35, "#ffe9a6"); post.addColorStop(0.6, "#cf9a36"); post.addColorStop(1, "#5e3f0d");
          f.fillStyle = "rgba(0,0,0,0.4)"; f.beginPath(); f.ellipse(px + 3, foot + 1, 9, 2.6, 0, 0, Math.PI * 2); f.fill();
          f.fillStyle = post; f.fillRect(px - 2.6, railY, 5.2, foot - railY);
          f.beginPath(); f.ellipse(px, foot, 6.5, 2.4, 0, 0, Math.PI * 2); f.fill();
          const ball = f.createRadialGradient(px - 2.2, railY - 2.6, 0.5, px, railY, 7);
          ball.addColorStop(0, "#fff6d2"); ball.addColorStop(0.35, "#e2ad45"); ball.addColorStop(1, "#5c3d0c");
          f.beginPath(); f.arc(px, railY, 6.6, 0, Math.PI * 2); f.fillStyle = ball; f.fill();
        }
      }
      // The shine and the dark refracting edges of one jar, stamped over each in turn.
      const cx = R + GP, y0 = GP;
      g.save(); body(g, cx, y0, R, y0); g.clip();
      const rim = g.createLinearGradient(cx - R, 0, cx + R, 0);
      rim.addColorStop(0, "rgba(0,0,0,0.7)"); rim.addColorStop(0.035, "rgba(0,0,0,0.38)"); rim.addColorStop(0.06, "rgba(255,255,255,0.3)"); rim.addColorStop(0.1, "rgba(255,255,255,0.04)"); rim.addColorStop(0.3, "rgba(0,0,0,0)");
      rim.addColorStop(0.62, "rgba(0,0,0,0.05)"); rim.addColorStop(0.9, "rgba(0,0,0,0.32)"); rim.addColorStop(0.95, "rgba(255,255,255,0.16)"); rim.addColorStop(0.975, "rgba(0,0,0,0.45)"); rim.addColorStop(1, "rgba(0,0,0,0.75)");
      g.fillStyle = rim; g.fillRect(cx - R, y0, R * 2, BH + R * TILT);
      const under = g.createLinearGradient(0, y0, 0, y0 + 16);
      under.addColorStop(0, "rgba(0,0,0,0.6)"); under.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = under; g.fillRect(cx - R, y0, R * 2, 16);
      const streak = (x: number, w: number, a: number, y1: number, y2: number) => {
        const v = g.createLinearGradient(0, y1, 0, y2);
        v.addColorStop(0, "rgba(255,255,255,0)"); v.addColorStop(0.12, `rgba(255,255,255,${a})`); v.addColorStop(0.7, `rgba(255,255,255,${a * 0.7})`); v.addColorStop(1, "rgba(255,255,255,0)");
        g.save(); g.filter = "blur(1.4px)"; g.fillStyle = v; g.beginPath(); g.ellipse(x + w / 2, (y1 + y2) / 2, w / 2, (y2 - y1) / 2, 0, 0, Math.PI * 2); g.fill(); g.restore();
      };
      streak(cx - R * 0.74, 10, 0.62, y0 + 6, y0 + BH - 14);
      // A window somewhere behind the camera, bent by the curve of the glass.
      g.save(); g.filter = "blur(0.6px)"; g.fillStyle = "rgba(255,255,255,0.16)";
      for (const [wx, ww] of [[-0.46, 0.2]]) { g.beginPath(); g.moveTo(cx + R * wx, y0 + 15); g.lineTo(cx + R * (wx + ww), y0 + 17.5); g.lineTo(cx + R * (wx + ww), y0 + 28); g.lineTo(cx + R * wx, y0 + 26.5); g.closePath(); g.fill(); }
      g.restore();
      streak(cx - R * 0.47, 2.4, 0.3, y0 + 14, y0 + BH - 40);
      streak(cx + R * 0.66, 4, 0.22, y0 + 20, y0 + BH - 20);
      g.lineWidth = 1; g.strokeStyle = "rgba(255,255,255,0.5)"; g.beginPath(); g.ellipse(cx, y0 + BH - 1.2, R - 2, R * TILT, 0, Math.PI * 0.95, Math.PI * 0.45, true); g.stroke();
      g.lineWidth = 0.8; g.strokeStyle = "rgba(255,255,255,0.22)"; g.beginPath(); g.ellipse(cx, y0 + BH - 9, R - 3, R * TILT, 0, Math.PI * 0.9, Math.PI * 0.1, true); g.stroke();
      g.restore();
    };

    const fit = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1), w = cv.clientWidth || L.W;
      cv.width = Math.round(w * dpr); cv.height = Math.round((w * dpr * L.H) / L.W); k = cv.width / L.W;
      build();
    };

    const s = {
      a: live.current.map((on) => (on ? 0 : Math.PI)), v: spices.map(() => 0), to: live.current.map((on) => (on ? 0 : Math.PI)),
      peek: spices.map(() => 0), peekTo: spices.map(() => 0),
    };

    const jar = (i: number) => {
      const { x: cx, y: by } = L.jars[i], y0 = by - BH, a = s.a[i] + s.peek[i], tex = textures[i], sp = spices[i];
      // Back wall of the glass, seen through the empty top.
      body(ctx, cx, y0, R, y0 - 2); ctx.fillStyle = "rgba(196,224,212,0.07)"; ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx, y0 + FILL, R - 1.4, R * TILT, 0, 0, Math.PI * 2);
      const topFace = ctx.createLinearGradient(cx - R, 0, cx + R, 0);
      topFace.addColorStop(0, tone(sp.color, sp.kind === "balls" ? -0.45 : -0.3)); topFace.addColorStop(0.4, tone(sp.color, sp.kind === "balls" ? -0.1 : 0.16)); topFace.addColorStop(1, tone(sp.color, -0.5));
      ctx.fillStyle = topFace; ctx.fill();
      // Wrap the flat surface round the cylinder, one thin strip at a time.
      for (let pass = 0; pass < 2; pass++) {
        const img = pass === 0 ? tex.inner : tex.label, step = pass === 0 ? 1 : 0.5;
        if (pass === 1) ctx.drawImage(glass, (cx - R - GP), (y0 - GP), glass.width / k, glass.height / k);
        for (let x = -R + (pass === 0 ? 0.6 : 0); x < R - 0.4; x += step) {
          const xm = Math.min(R - 0.01, x + step / 2), th = Math.asin(xm / R), cos = Math.cos(th);
          let u = (TW / 2 + (th - a) * R) % TW; if (u < 0) u += TW;
          if (pass === 1 && (u < LX - 1 || u > LX + LW + 1)) continue;
          const du = Math.min(step / Math.max(0.08, cos), TW - u), dy = R * TILT * cos;
          ctx.drawImage(img, u * TS, 0, Math.max(1, du * TS), BH * TS, cx + x, y0 + dy, step + 0.35, BH);
          if (pass === 1) {
            // Paper is matte: it falls off towards the sides and catches the lamp on the left.
            const lit = Math.max(0, Math.cos(th + 0.55)), dark = Math.pow(1 - cos, 1.25) * 0.72 + (th > 0 ? th * 0.1 : 0);
            ctx.fillStyle = `rgba(30,18,6,${Math.min(0.85, dark)})`; ctx.fillRect(cx + x, y0 + dy + LY, step + 0.35, LH);
            ctx.fillStyle = `rgba(255,250,235,${Math.pow(lit, 6) * 0.2})`; ctx.fillRect(cx + x, y0 + dy + LY, step + 0.35, LH);
          }
        }
      }
      // Shadow of the rail across the glass.
      const sh = ctx.createLinearGradient(0, by - 20, 0, by - 8);
      sh.addColorStop(0, "rgba(0,0,0,0)"); sh.addColorStop(0.4, "rgba(0,0,0,0.3)"); sh.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = sh; ctx.fillRect(cx - R + 1, by - 20, R * 2 - 2, 12);
      // Steel lid: a ridged skirt that turns with the jar and a brushed top.
      const RL = R + 1.6, yT = y0 - LID + 5, yB = y0 + 5, et = RL * TILT;
      ctx.beginPath(); ctx.moveTo(cx - RL, yT); ctx.lineTo(cx - RL, yB); ctx.ellipse(cx, yB, RL, et, 0, Math.PI, 0, true); ctx.lineTo(cx + RL, yT); ctx.ellipse(cx, yT, RL, et, 0, 0, Math.PI, false); ctx.closePath();
      const skirt = ctx.createLinearGradient(cx - RL, 0, cx + RL, 0);
      skirt.addColorStop(0, "#2c2f32"); skirt.addColorStop(0.1, "#8d9196"); skirt.addColorStop(0.2, "#f3f4f5"); skirt.addColorStop(0.3, "#a1a5aa"); skirt.addColorStop(0.58, "#5f6367"); skirt.addColorStop(0.84, "#a4a8ad"); skirt.addColorStop(1, "#26292c");
      ctx.fillStyle = skirt; ctx.fill();
      ctx.save(); ctx.clip();
      for (let n = 0; n < 60; n++) {
        const th = a + (n / 60) * Math.PI * 2, cos = Math.cos(th);
        if (cos <= 0.04) continue;
        const x = cx + Math.sin(th) * RL, dy = et * cos;
        ctx.fillStyle = `rgba(0,0,0,${0.3 * cos})`; ctx.fillRect(x, yT + dy + 3, 0.9, LID - 5);
        ctx.fillStyle = `rgba(255,255,255,${0.26 * cos})`; ctx.fillRect(x + 0.9, yT + dy + 3, 0.7, LID - 5);
      }
      const hem = ctx.createLinearGradient(0, yB - 2, 0, yB + et + 1);
      hem.addColorStop(0, "rgba(0,0,0,0)"); hem.addColorStop(1, "rgba(0,0,0,0.5)");
      ctx.fillStyle = hem; ctx.fillRect(cx - RL, yB - 2, RL * 2, et + 3);
      ctx.restore();
      ctx.beginPath(); ctx.ellipse(cx, yT, RL, et, 0, 0, Math.PI * 2);
      const cap = ctx.createLinearGradient(cx - RL, yT - et, cx + RL, yT + et);
      cap.addColorStop(0, "#f4f5f6"); cap.addColorStop(0.4, "#b9bcc0"); cap.addColorStop(0.62, "#dcdee0"); cap.addColorStop(1, "#7b7f84");
      ctx.fillStyle = cap; ctx.fill();
      ctx.lineWidth = 0.9; ctx.strokeStyle = "rgba(255,255,255,0.85)"; ctx.beginPath(); ctx.ellipse(cx, yT, RL - 0.5, et - 0.4, 0, Math.PI * 0.05, Math.PI * 0.95); ctx.stroke();
      ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(0,0,0,0.22)"; ctx.beginPath(); ctx.ellipse(cx, yT, RL - 5, et - 1.4, 0, 0, Math.PI * 2); ctx.stroke();
      // A stamped dot on the lid rim marks the label side, so the turn reads from above.
      const mx = cx + Math.sin(a) * (RL - 9), my = yT + Math.cos(a) * (et - 2.4);
      ctx.beginPath(); ctx.ellipse(mx, my, 2.2, 1, 0, 0, Math.PI * 2); ctx.fillStyle = sp.color; ctx.fill();
      ctx.lineWidth = 0.5; ctx.strokeStyle = "rgba(0,0,0,0.4)"; ctx.stroke();
    };

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(base, 0, 0);
      ctx.setTransform(k, 0, 0, k, 0, 0);
      for (let i = 0; i < spices.length; i++) jar(i);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(front, 0, 0);
    };

    // 3. Springs, and a hand that turns a jar now and then until somebody else does.
    let raf = 0, last = 0, t0 = 0, seen = true, demo = !reduce, nextAt = 0.9, step = 0, first = true;
    const order = [4, 0, 3, 2, 5, 4, 1, 3, 0, 5, 2, 1];
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.04, (now - last) / 1000); last = now;
      const t = (now - t0) / 1000;
      if (demo && t > nextAt) {
        const i = order[step % order.length]; step++; nextAt = t + (step === 1 ? 3.4 : 2.3);
        const next = live.current.map((on, j) => (j === i ? !on : on));
        live.current = next; setPicked(next); s.to[i] += Math.PI;
      }
      let moving = first; first = false;
      for (let i = 0; i < spices.length; i++) {
        s.v[i] += (70 * (s.to[i] - s.a[i]) - 10.5 * s.v[i]) * dt; s.a[i] += s.v[i] * dt;
        s.peek[i] += (s.peekTo[i] - s.peek[i]) * Math.min(1, dt * 9);
        if (Math.abs(s.v[i]) > 0.002 || Math.abs(s.to[i] - s.a[i]) > 0.002 || Math.abs(s.peekTo[i] - s.peek[i]) > 0.002) moving = true;
      }
      if (moving) draw();
      if ((moving || demo) && seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const still = () => { for (let i = 0; i < spices.length; i++) { s.a[i] = s.to[i]; s.v[i] = 0; s.peek[i] = 0; } draw(); };
    const wake = () => { first = true; if (reduce) still(); else if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    api.current = { turn: (i) => { s.to[i] += Math.PI; wake(); }, stopDemo: () => { demo = false; } };
    fit(); wake();

    // Running a pointer over a jar nudges it round, enough to see the edge of the label.
    const host = cv.parentElement;
    const onMove = (e: PointerEvent) => {
      const b = cv.getBoundingClientRect(), x = ((e.clientX - b.left) / b.width) * L.W, y = ((e.clientY - b.top) / b.height) * L.H;
      L.jars.forEach((j, i) => { const inside = Math.abs(x - j.x) < R + 8 && y > j.y - BH - LID && y < j.y + 14; s.peekTo[i] = inside ? -Math.max(-1, Math.min(1, (x - j.x) / R)) * 0.42 : 0; });
      wake();
    };
    const onLeave = () => { s.peekTo = spices.map(() => 0); wake(); };
    host?.addEventListener("pointermove", onMove); host?.addEventListener("pointerleave", onLeave);
    const ro = new ResizeObserver(() => { fit(); if (reduce) still(); else { draw(); wake(); } });
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
  }, [narrow]);

  const L = layoutFor(narrow);
  const toggle = (i: number) => {
    api.current?.stopDemo();
    const next = live.current.map((on, j) => (j === i ? !on : on));
    live.current = next; setPicked(next); api.current?.turn(i);
  };
  const clear = () => {
    api.current?.stopDemo();
    live.current.forEach((on, i) => { if (on) api.current?.turn(i); });
    const next = spices.map(() => false); live.current = next; setPicked(next);
  };
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;
  const chosen = spices.filter((_, i) => picked[i]);

  return (
    <div ref={stage} className="flex min-h-[720px] w-full flex-col items-center justify-center bg-[#121714] bg-[radial-gradient(75%_65%_at_34%_30%,#435443_0%,#263129_45%,#121714_100%)] px-3 py-12 sm:px-6">
      <div role="group" aria-label="Filter by spice" className="relative w-full" style={{ maxWidth: narrow ? 420 : 1080, aspectRatio: `${L.W} / ${L.H}` }}>
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        {spices.map((sp, i) => (
          <button
            key={sp.name}
            type="button"
            aria-pressed={picked[i]}
            aria-label={sp.name}
            onClick={() => toggle(i)}
            style={{ left: pct(L.jars[i].x - R - 4, L.W), top: pct(L.jars[i].y - BH - LID, L.H), width: pct(R * 2 + 8, L.W), height: pct(BH + LID + 14, L.H) }}
            className="absolute cursor-pointer rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[#f0c060]"
          />
        ))}
      </div>
      <div className="mt-8 flex min-h-[44px] flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center font-mono text-[11px] uppercase leading-5 tracking-[0.18em] text-stone-400">
        <p aria-live="polite">
          <span style={{ color: ACCENT }}>{chosen.length ? "Cooking with" : "Turn a jar to filter"}</span>
          {chosen.length > 0 && <span className="mx-2 text-stone-600">/</span>}
          <span className="text-stone-200">{chosen.map((sp) => sp.name).join(" + ")}</span>
        </p>
        {chosen.length > 0 && (
          <button type="button" onClick={clear} className="min-h-[40px] rounded-full border border-stone-500 px-4 font-mono text-[11px] uppercase tracking-[0.18em] text-stone-200 outline-none transition-colors hover:border-stone-300 focus-visible:ring-2 focus-visible:ring-[#f0c060]">
            Put all back
          </button>
        )}
      </div>
    </div>
  );
}
