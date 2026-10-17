import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";

// The switches, left to right. `lamp` is the colour of the legend light above each one.
const switches = [
  { label: "BATTERY", note: "Main bus live", lamp: "#63f29a", on: true },
  { label: "FUEL PUMP", note: "Boost pump running", lamp: "#63f29a", on: false },
  { label: "BEACON", note: "Red beacon flashing", lamp: "#63f29a", on: true },
  { label: "STARTER", note: "Starter armed", lamp: "#ffb22e", on: false },
];
const TITLE = "ENGINE START"; // painted in the gap of the white outline
const GUARD = ["#ef4a3a", "#c4201a", "#6f0a07"]; // cover paint: lit, body, shade
const PANEL = ["#646b73", "#4c5259", "#3a3f45"]; // panel paint, top to bottom
const RELAX = 4200; // a lifted cover drops shut after this many milliseconds if the switch is left off
const OPEN = (118 * Math.PI) / 180; // how far a cover swings up

const layoutFor = (narrow: boolean) => {
  const n = switches.length;
  if (narrow) { const rows = Math.ceil(n / 2); return { W: 380, H: 60 + rows * 296, units: switches.map((_, i) => ({ x: i % 2 === 0 ? 108 : 272, y: 226 + Math.floor(i / 2) * 296 })) }; }
  const W = Math.max(480, 84 + n * 156);
  return { W, H: 396, units: switches.map((_, i) => ({ x: W / 2 + (i - (n - 1) / 2) * 156, y: 244 })) };
};

export default function GuardedToggleSwitchRow() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [narrow, setNarrow] = useState(false);
  const [state, setState] = useState(() => switches.map((s) => ({ up: s.on, on: s.on })));
  const [said, setSaid] = useState("Lift a red cover, then flip the switch under it");
  const live = useRef(state.map((s) => ({ ...s, since: 0 })));
  const api = useRef<{ poke: () => void } | null>(null);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setNarrow(el.clientWidth < 640));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // One place that changes a switch, used by clicks, keys and the idle demo alike.
  const act = (i: number, what: "step" | "shut", quiet = false) => {
    const cur = live.current[i], sw = switches[i];
    let line = "";
    if (what === "shut" || (cur.up && cur.on)) { if (!cur.up && !cur.on) return; cur.up = false; cur.on = false; line = `${sw.label} off, cover shut`; }
    else if (!cur.up) { cur.up = true; line = `${sw.label} cover lifted. Press again to switch on`; }
    else { cur.on = true; line = `${sw.label} on. ${sw.note}`; }
    cur.since = performance.now();
    setState(live.current.map((s) => ({ up: s.up, on: s.on })));
    if (!quiet) setSaid(line);
    api.current?.poke();
  };

  const touched = useRef(-1e9);
  const actRef = useRef(act);
  actRef.current = act;

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const L = layoutFor(narrow);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let k = 1;
    const base = document.createElement("canvas");
    const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace", SANS = "ui-sans-serif, system-ui, 'Helvetica Neue', Arial, sans-serif";
    const GW = 48, GL = 96, GD = 30, Z0 = 12, EYE = 560, HINGE = -50, LEVER = 34; // cover width, length, depth; hinge stand-off; viewing distance

    const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    };
    const hex = (c: CanvasRenderingContext2D, x: number, y: number, r: number, turn: number) => { c.beginPath(); for (let i = 0; i < 6; i++) { const a = turn + (i * Math.PI) / 3; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); };
    const steel = (c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) => {
      const g = c.createLinearGradient(x0, y0, x1, y1);
      for (const [p, v] of [[0, "#fafbfc"], [0.22, "#b9bdc3"], [0.42, "#6d7177"], [0.56, "#e4e6e9"], [0.78, "#55585e"], [1, "#a5a9af"]] as [number, string][]) g.addColorStop(p, v);
      return g;
    };
    const legend = (c: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, alpha = 0.92) => {
      c.font = `700 ${size}px ${SANS}`; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillStyle = "rgba(0,0,0,0.45)"; c.fillText(text, x, y + 0.9);
      c.fillStyle = `rgba(240,242,244,${alpha})`; c.fillText(text, x, y);
    };

    const build = () => {
      const b = base.getContext("2d");
      if (!b) return;
      base.width = cv.width; base.height = cv.height;
      b.setTransform(k, 0, 0, k, 0, 0);
      let seed = 97;
      const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      const X = 2, Y = 2, PW = L.W - 4, PH = L.H - 4;

      // The panel: sprayed grey paint with a fine orange-peel speckle and a worn bright edge.
      const paint = b.createLinearGradient(0, Y, 0, Y + PH);
      paint.addColorStop(0, PANEL[0]); paint.addColorStop(0.35, PANEL[1]); paint.addColorStop(1, PANEL[2]);
      rr(b, X, Y, PW, PH, 12); b.fillStyle = paint; b.fill();
      b.save(); rr(b, X, Y, PW, PH, 12); b.clip();
      const dots = Math.round((L.W * L.H) / 14);
      for (let i = 0; i < dots; i++) { const v = rand(); b.fillStyle = v > 0.5 ? `rgba(255,255,255,${(v - 0.5) * 0.12})` : `rgba(0,0,0,${(0.5 - v) * 0.16})`; b.fillRect(rand() * L.W, rand() * L.H, 0.9 + rand() * 0.9, 0.9 + rand() * 0.9); }
      const wash = b.createLinearGradient(X, Y, X + PW, Y + PH);
      wash.addColorStop(0, "rgba(255,255,255,0.1)"); wash.addColorStop(0.4, "rgba(255,255,255,0)"); wash.addColorStop(1, "rgba(0,0,0,0.14)");
      b.fillStyle = wash; b.fillRect(X, Y, PW, PH);
      b.restore();
      const edge = b.createLinearGradient(0, Y, 0, Y + PH);
      edge.addColorStop(0, "rgba(255,255,255,0.7)"); edge.addColorStop(0.06, "rgba(255,255,255,0.16)"); edge.addColorStop(0.92, "rgba(0,0,0,0.25)"); edge.addColorStop(1, "rgba(0,0,0,0.6)");
      rr(b, X + 0.7, Y + 0.7, PW - 1.4, PH - 1.4, 11.3); b.lineWidth = 1.4; b.strokeStyle = edge; b.stroke();

      // Quarter-turn fasteners in the corners.
      [[X + 22, Y + 22, 0.4], [X + PW - 22, Y + 22, 1.9], [X + 22, Y + PH - 22, 2.6], [X + PW - 22, Y + PH - 22, 1.1]].forEach(([x, y, turn]) => {
        b.beginPath(); b.arc(x, y + 1, 9.6, 0, Math.PI * 2); b.fillStyle = "rgba(0,0,0,0.5)"; b.fill();
        b.beginPath(); b.arc(x, y, 9, 0, Math.PI * 2); b.fillStyle = steel(b, x - 9, y - 9, x + 9, y + 9); b.fill();
        b.beginPath(); b.arc(x, y, 6.3, 0, Math.PI * 2); b.fillStyle = steel(b, x + 6, y + 6, x - 6, y - 6); b.fill();
        b.save(); b.translate(x, y); b.rotate(turn); b.fillStyle = "#121315"; rr(b, -5.4, -1.3, 10.8, 2.6, 1.2); b.fill(); b.fillStyle = "rgba(255,255,255,0.5)"; b.fillRect(-5, 1.3, 10, 0.6); b.restore();
      });

      // The painted outline that groups the row, broken for its title.
      const xs = L.units.map((u) => u.x), ys = L.units.map((u) => u.y);
      const ox = Math.min(...xs) - 62, oy = Math.min(...ys) - 194, ow = Math.max(...xs) - Math.min(...xs) + 124, oh = Math.max(...ys) - Math.min(...ys) + 290;
      rr(b, ox, oy, ow, oh, 9); b.lineWidth = 1.5; b.strokeStyle = "rgba(240,242,244,0.78)"; b.stroke();
      b.font = `700 9.5px ${SANS}`; const tw = b.measureText(TITLE).width + 22;
      b.fillStyle = PANEL[0]; b.fillRect(L.W / 2 - tw / 2, oy - 5, tw, 10);
      b.save(); b.beginPath(); b.rect(L.W / 2 - tw / 2, oy - 5, tw, 10); b.clip();
      for (let i = 0; i < 160; i++) { const v = rand(); b.fillStyle = v > 0.5 ? `rgba(255,255,255,${(v - 0.5) * 0.12})` : `rgba(0,0,0,${(0.5 - v) * 0.16})`; b.fillRect(L.W / 2 - tw / 2 + rand() * tw, oy - 5 + rand() * 10, 1.2, 1.2); }
      b.restore();
      legend(b, TITLE, L.W / 2, oy + 0.5, 9.5);

      L.units.forEach((u, i) => {
        // Legend light housing.
        const lx = u.x - 29, ly = u.y - 178;
        rr(b, lx - 3, ly - 3, 64, 30, 5); b.fillStyle = "#17181a"; b.fill();
        const lb = b.createLinearGradient(0, ly - 3, 0, ly + 27); lb.addColorStop(0, "rgba(0,0,0,0.9)"); lb.addColorStop(1, "rgba(255,255,255,0.45)");
        rr(b, lx - 3, ly - 3, 64, 30, 5); b.lineWidth = 1.2; b.strokeStyle = lb; b.stroke();
        // Label, and the two positions painted either side of the nut.
        legend(b, switches[i].label, u.x, u.y + 70, 10.5);
        legend(b, "ON", u.x - 41, u.y - 22, 7.5, 0.7); legend(b, "OFF", u.x - 41, u.y + 23, 7.5, 0.7);
        // Hex nut, lock washer and collar of the switch.
        b.beginPath(); b.arc(u.x, u.y, 21, 0, Math.PI * 2); b.fillStyle = "rgba(0,0,0,0.28)"; b.fill();
        b.beginPath(); b.arc(u.x, u.y, 20, 0, Math.PI * 2); b.fillStyle = steel(b, u.x + 20, u.y - 20, u.x - 20, u.y + 20); b.fill();
        b.save(); b.shadowColor = "rgba(0,0,0,0.6)"; b.shadowBlur = 4 * k; b.shadowOffsetY = 2 * k;
        hex(b, u.x, u.y, 17, 0.5 + i * 0.37); b.fillStyle = steel(b, u.x - 17, u.y - 17, u.x + 17, u.y + 17); b.fill(); b.restore();
        hex(b, u.x, u.y, 17, 0.5 + i * 0.37); b.lineWidth = 0.8; b.strokeStyle = "rgba(0,0,0,0.45)"; b.stroke();
        b.beginPath(); b.arc(u.x, u.y, 11, 0, Math.PI * 2); b.fillStyle = steel(b, u.x + 11, u.y + 11, u.x - 11, u.y - 11); b.fill();
        b.beginPath(); b.arc(u.x, u.y, 7.6, 0, Math.PI * 2); b.fillStyle = "#070708"; b.fill();
        // Hinge bracket riveted to the panel.
        const hy = u.y + HINGE;
        b.save(); b.shadowColor = "rgba(0,0,0,0.55)"; b.shadowBlur = 4 * k; b.shadowOffsetY = 2 * k;
        rr(b, u.x - 33, hy - 8, 66, 14, 3); b.fillStyle = steel(b, u.x - 33, hy - 8, u.x + 33, hy + 6); b.fill(); b.restore();
        for (const rx of [u.x - 28, u.x + 28]) { b.beginPath(); b.arc(rx, hy - 1, 2.6, 0, Math.PI * 2); b.fillStyle = "#3a3c40"; b.fill(); b.beginPath(); b.arc(rx - 0.5, hy - 1.6, 1.5, 0, Math.PI * 2); b.fillStyle = "#e8eaec"; b.fill(); }
      });
    };

    const u0 = live.current;
    const s = u0.map((v) => ({ th: v.up ? OPEN : 0, thv: 0, ph: v.on ? 0.5 : -0.5, phv: 0, lit: v.on ? 1 : 0 }));
    const mix = (a: string, c: string, t: number) => { const p = (h: string) => [1, 3, 5].map((j) => parseInt(h.slice(j, j + 2), 16)), x = p(a), y = p(c), q = Math.max(0, Math.min(1, t)); return `rgb(${x.map((v, j) => Math.round(v + (y[j] - v) * q)).join(",")})`; };

    const unit = (i: number) => {
      const u = L.units[i], st = s[i], sw = switches[i], hy = u.y + HINGE;
      // Legend light.
      const lx = u.x - 29, ly = u.y - 178, lit = st.lit;
      const glassG = ctx.createLinearGradient(0, ly, 0, ly + 24); glassG.addColorStop(0, "#0b0c0d"); glassG.addColorStop(1, "#1a1b1d");
      rr(ctx, lx, ly, 58, 24, 3); ctx.fillStyle = glassG; ctx.fill();
      ctx.save(); rr(ctx, lx, ly, 58, 24, 3); ctx.clip();
      ctx.globalAlpha = lit * 0.3; ctx.fillStyle = sw.lamp; ctx.fillRect(lx, ly, 58, 24);
      ctx.globalAlpha = 0.14 + 0.86 * lit; ctx.shadowColor = sw.lamp; ctx.shadowBlur = 10 * lit * k;
      ctx.font = `700 11px ${SANS}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = lit > 0.5 ? mix(sw.lamp, "#ffffff", 0.35) : sw.lamp; ctx.fillText("ON", u.x, ly + 12.5);
      ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      const gl = ctx.createLinearGradient(lx, ly, lx + 40, ly + 24); gl.addColorStop(0, "rgba(255,255,255,0.22)"); gl.addColorStop(0.45, "rgba(255,255,255,0.03)"); gl.addColorStop(0.46, "rgba(255,255,255,0)");
      ctx.fillStyle = gl; ctx.fillRect(lx, ly, 58, 24); ctx.restore();
      if (lit > 0.05) { const halo = ctx.createRadialGradient(u.x, ly + 12, 6, u.x, ly + 12, 54); halo.addColorStop(0, mix("#000000", sw.lamp, 1).replace("rgb(", "rgba(").replace(")", `,${0.2 * lit})`)); halo.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = halo; ctx.fillRect(u.x - 56, ly - 44, 112, 112); }

      // Bat-handle lever, seen almost end on.
      const lz = LEVER * Math.cos(st.ph) + 6, sc = EYE / (EYE - lz), ty = u.y - LEVER * Math.sin(st.ph) * sc * 1.25, tr = 9 * sc;
      const shd = ctx.createRadialGradient(u.x + 7, ty + 13, 2, u.x + 7, ty + 13, 20); shd.addColorStop(0, "rgba(0,0,0,0.5)"); shd.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = shd; ctx.fillRect(u.x - 16, ty - 10, 46, 46);
      ctx.beginPath(); ctx.moveTo(u.x - 5.4, u.y); ctx.lineTo(u.x - tr, ty); ctx.lineTo(u.x + tr, ty); ctx.lineTo(u.x + 5.4, u.y); ctx.closePath();
      ctx.fillStyle = steel(ctx, u.x - tr, 0, u.x + tr, 0); ctx.fill();
      const tip = ctx.createRadialGradient(u.x - tr * 0.35, ty - tr * 0.4, 0.5, u.x, ty, tr);
      tip.addColorStop(0, "#ffffff"); tip.addColorStop(0.3, "#d5d8dc"); tip.addColorStop(0.7, "#8b8f95"); tip.addColorStop(0.92, "#4b4e53"); tip.addColorStop(1, "#a9adb3");
      ctx.beginPath(); ctx.arc(u.x, ty, tr, 0, Math.PI * 2); ctx.fillStyle = tip; ctx.fill();
      ctx.lineWidth = 0.7; ctx.strokeStyle = "rgba(0,0,0,0.45)"; ctx.stroke();

      // The cover: a pressed channel turning on the hinge pin, projected with a little perspective.
      const th = st.th, cos = Math.cos(th), sin = Math.sin(th);
      const P = (a: number, v: number, n: number) => { const y = v * cos - n * sin, z = v * sin + n * cos + Z0, f = EYE / (EYE - z); return { x: u.x + a * f, y: hy + y * f, z }; };
      const quad = (pts: { x: number; y: number }[]) => { ctx.beginPath(); pts.forEach((p, j) => (j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); };
      const h = GW / 2, A = P(-h, 0, GD), B = P(h, 0, GD), C = P(h, GL, GD), E = P(-h, GL, GD), a0 = P(-h, 0, 0), b0 = P(h, 0, 0), c0 = P(h, GL, 0), e0 = P(-h, GL, 0);
      // Its shadow falls where the light, above and in front, would put it.
      const drop = (p: { x: number; y: number; z: number }) => ({ x: p.x + p.z * 0.1, y: p.y + p.z * 0.42 });
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 12 * k; ctx.shadowOffsetX = 4000 * k; quad([A, B, C, E].map(drop).map((p) => ({ x: p.x - 4000, y: p.y }))); ctx.fillStyle = "#000"; ctx.fill(); ctx.restore();
      const outer = cos > 0, light = Math.max(0, 0.6 * sin + 0.8 * cos);
      const walls = () => {
        for (const [p, q, r2, t2] of [[a0, A, E, e0], [b0, B, C, c0]]) { quad([p, q, r2, t2]); ctx.fillStyle = mix(GUARD[2], GUARD[1], outer ? 0.2 : 0.55); ctx.fill(); ctx.lineWidth = 1.6; ctx.lineJoin = "round"; ctx.strokeStyle = mix(GUARD[2], GUARD[1], outer ? 0.2 : 0.7); ctx.stroke(); }
      };
      const plate = () => {
        const g = ctx.createLinearGradient(0, A.y, 0, E.y);
        if (outer) {
          const band = Math.max(0.08, Math.min(0.92, 0.22 + th * 0.75));
          g.addColorStop(0, mix(GUARD[2], GUARD[1], 0.4 + light * 0.6)); g.addColorStop(Math.max(0, band - 0.2), mix(GUARD[1], GUARD[0], light * 0.7));
          g.addColorStop(band, mix(GUARD[0], "#ffd9d2", 0.25 + light * 0.3)); g.addColorStop(Math.min(1, band + 0.22), mix(GUARD[1], GUARD[0], light * 0.5)); g.addColorStop(1, mix(GUARD[2], GUARD[1], 0.75));
        } else { g.addColorStop(0, mix(GUARD[2], "#000000", 0.45)); g.addColorStop(0.5, mix(GUARD[2], GUARD[1], 0.25)); g.addColorStop(1, mix(GUARD[2], GUARD[1], 0.7)); }
        ctx.lineJoin = "round"; quad([A, B, C, E]); ctx.lineWidth = 5; ctx.strokeStyle = outer ? mix(GUARD[2], GUARD[1], 0.5 + light * 0.4) : mix(GUARD[2], GUARD[1], 0.3); ctx.stroke();
        quad([A, B, C, E]); ctx.fillStyle = g; ctx.fill();
        if (outer) {
          // A pressed rib down the middle and a bright line where the paint rolls over the long edge.
          const m0 = P(0, GL * 0.16, GD), m1 = P(0, GL * 0.86, GD), wd = (E.x - C.x) * -0.2;
          ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(m0.x + 1.2, m0.y); ctx.lineTo(m1.x + 1.2, m1.y); ctx.lineWidth = wd; ctx.strokeStyle = "rgba(60,0,0,0.35)"; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(m0.x - 0.6, m0.y); ctx.lineTo(m1.x - 0.6, m1.y); ctx.lineWidth = wd * 0.72; ctx.strokeStyle = mix(GUARD[1], GUARD[0], 0.4 + light * 0.6); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(m0.x - wd * 0.18, m0.y + 2); ctx.lineTo(m1.x - wd * 0.18, m1.y - 2); ctx.lineWidth = 1.4; ctx.strokeStyle = `rgba(255,235,230,${0.3 + light * 0.45})`; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(A.x + 1, A.y + 3); ctx.lineTo(E.x + 1, E.y - 4); ctx.lineWidth = 1.3; ctx.strokeStyle = `rgba(255,225,220,${0.25 + light * 0.5})`; ctx.stroke(); ctx.lineCap = "butt";
          // The finger lip at the free end, rolled outwards.
          const l0 = P(-h, GL - 9, GD), l1 = P(h, GL - 9, GD);
          const lip = ctx.createLinearGradient(0, l0.y, 0, E.y); lip.addColorStop(0, "rgba(60,0,0,0.4)"); lip.addColorStop(0.25, `rgba(255,220,214,${0.2 + light * 0.4})`); lip.addColorStop(1, "rgba(60,0,0,0.3)");
          quad([l0, l1, C, E]); ctx.fillStyle = lip; ctx.fill();
        } else {
          // Looking up into the channel: a lit lip at the far end and the shade of the side walls.
          ctx.beginPath(); ctx.moveTo(E.x + 2, E.y); ctx.lineTo(C.x - 2, C.y); ctx.lineWidth = 2; ctx.strokeStyle = mix(GUARD[1], GUARD[0], 0.6); ctx.stroke();
          const sg = ctx.createLinearGradient(E.x, 0, C.x, 0); sg.addColorStop(0, "rgba(0,0,0,0.4)"); sg.addColorStop(0.25, "rgba(0,0,0,0)"); sg.addColorStop(0.75, "rgba(0,0,0,0)"); sg.addColorStop(1, "rgba(0,0,0,0.4)");
          quad([A, B, C, E]); ctx.fillStyle = sg; ctx.fill();
          const m0 = P(0, GL * 0.16, GD), m1 = P(0, GL * 0.86, GD);
          ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(m0.x, m0.y); ctx.lineTo(m1.x, m1.y); ctx.lineWidth = 7; ctx.strokeStyle = "rgba(0,0,0,0.3)"; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(m0.x + 2.6, m0.y); ctx.lineTo(m1.x + 3, m1.y); ctx.lineWidth = 1.2; ctx.strokeStyle = mix(GUARD[1], GUARD[0], 0.3); ctx.stroke(); ctx.lineCap = "butt";
        }
      };
      if (outer) { walls(); plate(); } else { plate(); walls(); }
      // Hinge pin and the coil of its return spring, in front of everything.
      const pin = ctx.createLinearGradient(0, hy - 5, 0, hy + 5); pin.addColorStop(0, "#fbfcfc"); pin.addColorStop(0.35, "#a9adb3"); pin.addColorStop(0.7, "#4b4e53"); pin.addColorStop(1, "#8b8f95");
      rr(ctx, u.x - 27, hy - 4.5, 54, 9, 4.5); ctx.fillStyle = pin; ctx.fill(); ctx.lineWidth = 0.6; ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.stroke();
      for (let c = -18; c <= 18; c += 4) { ctx.beginPath(); ctx.moveTo(u.x + c, hy - 4.2); ctx.lineTo(u.x + c + 1.6, hy + 4.2); ctx.lineWidth = 0.9; ctx.strokeStyle = Math.abs(c) < 9 ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0)"; ctx.stroke(); }
    };

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(base, 0, 0);
      ctx.setTransform(k, 0, 0, k, 0, 0);
      for (let i = 0; i < switches.length; i++) unit(i);
    };

    let raf = 0, last = 0, seen = true, t0 = 0, cue = 0, lap = 0;
    // The idle demo, as [seconds, switch, action] on a twenty second loop.
    const script: [number, number, "step" | "shut"][] = [[0.5, 1, "step"], [1.3, 1, "step"], [5, 3, "step"], [5.9, 3, "step"], [8, 0, "shut"], [9.5, 2, "shut"], [11, 1, "shut"], [12.5, 3, "shut"], [14, 0, "step"], [14.8, 0, "step"], [16, 2, "step"], [16.8, 2, "step"]];
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const idle = now - touched.current > 8000;
      const T = (now - t0) / 1000 - lap * 20;
      while (cue < script.length && script[cue][0] <= T) {
        const [, i, what] = script[cue]; cue++;
        if (idle && i < switches.length) { const c = live.current[i]; if (what === "shut" ? c.up || c.on : !(c.up && c.on)) actRef.current(i, what, true); }
      }
      if (T >= 20) { lap++; cue = 0; }
      live.current.forEach((c, i) => {
        const st = s[i];
        if (!idle && c.up && !c.on && now - c.since > RELAX) actRef.current(i, "shut");
        // Cover: a sprung flap that bounces off both of its stops.
        st.thv += (150 * ((c.up ? OPEN : 0) - st.th) - 11 * st.thv) * dt; st.th += st.thv * dt;
        if (st.th < 0) { st.th = 0; st.thv = -st.thv * 0.38; } else if (st.th > OPEN) { st.th = OPEN; st.thv = -st.thv * 0.3; }
        // Lever: a quick over-centre snap that can only stay up while the cover is clear of it.
        const want = c.on && st.th > 0.9 ? 0.5 : -0.5;
        st.phv += (900 * (want - st.ph) - 30 * st.phv) * dt; st.ph += st.phv * dt;
        st.lit += ((st.ph > 0.1 ? 1 : 0) - st.lit) * Math.min(1, dt * (st.ph > 0.1 ? 22 : 12));
      });
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const settle = () => { live.current.forEach((c, i) => { s[i] = { th: c.up ? OPEN : 0, thv: 0, ph: c.on ? 0.5 : -0.5, phv: 0, lit: c.on ? 1 : 0 }; }); draw(); };

    const size = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1), wpx = Math.max(200, cv.clientWidth);
      cv.width = Math.round(wpx * dpr); cv.height = Math.round((wpx * dpr * L.H) / L.W); k = cv.width / L.W;
      build(); draw();
    };
    size();
    const ro = new ResizeObserver(size); ro.observe(cv);
    api.current = { poke: () => { if (reduce) settle(); else wake(); } };
    if (reduce) settle(); else wake();
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { cancelAnimationFrame(raf); api.current = null; ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis); };
  }, [narrow]);

  const L = layoutFor(narrow);
  const onClick = (e: ReactMouseEvent<HTMLButtonElement>, i: number) => {
    touched.current = performance.now();
    const r = e.currentTarget.getBoundingClientRect();
    // A pointer click on a raised cover pushes it back down; anywhere else takes the next step.
    const onCover = e.detail > 0 && live.current[i].up && (e.clientY - r.top) / r.height < 0.48;
    act(i, onCover ? "shut" : "step");
  };

  return (
    <div ref={stage} className="flex min-h-[640px] w-full flex-col items-center justify-center bg-[#d6d2c9] bg-[radial-gradient(100%_80%_at_50%_30%,#efede8_0%,#d6d2c9_70%)] px-4 py-10 sm:min-h-[720px]">
      <div className={`relative w-full ${narrow ? "max-w-[330px]" : "max-w-[800px]"}`} style={{ aspectRatio: `${L.W} / ${L.H}` }}>
        <div aria-hidden="true" className="absolute inset-[3px] rounded-xl shadow-[0_26px_50px_-6px_rgba(46,38,26,0.55),0_6px_12px_rgba(46,38,26,0.3)]" />
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <div role="group" aria-label={TITLE.toLowerCase()} className="absolute inset-0">
          {switches.map((sw, i) => (
            <button
              key={sw.label}
              type="button"
              role="switch"
              aria-checked={state[i].on}
              aria-label={sw.label.toLowerCase()}
              aria-describedby="gtsr-how"
              onClick={(e) => onClick(e, i)}
              onKeyDown={(e) => { if (e.key === "Escape") { touched.current = performance.now(); act(i, "shut"); } }}
              style={{ left: `${((L.units[i].x - 54) / L.W) * 100}%`, top: `${((L.units[i].y - 186) / L.H) * 100}%`, width: `${(108 / L.W) * 100}%`, height: `${(272 / L.H) * 100}%` }}
              className="absolute cursor-pointer touch-manipulation rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#4c5259]"
            />
          ))}
        </div>
      </div>
      <p id="gtsr-how" className="sr-only">Covered switch. The first press lifts the cover, the second switches on, the third switches off and shuts the cover. Escape shuts it at any time.</p>
      <p aria-live="polite" className="mt-9 min-h-[20px] max-w-[340px] text-center font-mono text-[11px] uppercase leading-5 tracking-[0.16em] text-stone-700 sm:max-w-[560px]">{said}</p>
    </div>
  );
}
