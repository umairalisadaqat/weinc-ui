import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

// Everything a visitor is likely to change sits here.
// Each source returns its value at a time in seconds. Swap the maths for a number from your own data.
const sources = [
  { name: "Requests", unit: "/s", min: 0, max: 400, at: (t: number) => 215 + 92 * Math.sin(t * 6.1) + 34 * Math.sin(t * 14.3 + 1) + 12 * Math.sin(t * 31 + 2) },
  { name: "Latency", unit: "ms", min: 0, max: 400, at: (t: number) => 70 + 250 * Math.pow(Math.max(0, Math.sin(t * 4.4)), 12) + 46 * Math.pow(Math.max(0, Math.sin(t * 13.2 + 1)), 4) + 7 * Math.sin(t * 47) },
  { name: "Workers", unit: "%", min: 0, max: 100, at: (t: number) => 50 + 27 * Math.tanh(7 * Math.sin(t * 5.2)) + 5 * Math.sin(t * 38) * Math.exp(-((t * 5.2) % Math.PI) * 1.4) },
];
const TIMEBASES = [0.1, 0.2, 0.5]; // seconds for the beam to cross one square
const PERSIST = [{ label: "short", mark: "MIN", tau: 0.3 }, { label: "medium", mark: "MED", tau: 1.1 }, { label: "long", mark: "MAX", tau: 2.8 }]; // seconds for the glow to fade to about a third
const START = { source: 0, time: 1, persist: 2 };
const FRESH = [205, 255, 228], OLD = [128, 236, 84]; // the beam as it is written, and the afterglow it leaves
const MODEL = "MONITOR SCOPE 310";

const DIVS_X = 10, DIVS_Y = 8, TAU = Math.PI * 2;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const stepAngle = (i: number) => ((i - 1) * 52 * Math.PI) / 180;

const layoutFor = (narrow: boolean) =>
  narrow
    ? { W: 380, H: 640, scr: { x: 16, y: 16, w: 348, h: 284 }, inset: 10, div: 32, plate: { x: 16, y: 314, w: 348, h: 286 }, headY: 332, keys: { x: 30, y: 372, w: 100, h: 38, gap: 10 }, knobs: [{ x: 108, y: 532 }, { x: 272, y: 532 }], bnc: null as null | { x: number; y: number }, gnd: null as null | { x: number; y: number }, stripY: 620 }
    : { W: 780, H: 444, scr: { x: 28, y: 28, w: 452, h: 372 }, inset: 18, div: 40, plate: { x: 498, y: 28, w: 254, h: 388 }, headY: 48, keys: { x: 511, y: 92, w: 70, h: 38, gap: 10 }, knobs: [{ x: 563, y: 264 }, { x: 689, y: 264 }], bnc: { x: 563, y: 364 } as null | { x: number; y: number }, gnd: { x: 689, y: 364 } as null | { x: number; y: number }, stripY: 422 };

export default function PhosphorOscilloscopeMetricDisplay() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const figure = useRef<HTMLSpanElement>(null);
  const [narrow, setNarrow] = useState(false);
  const [src, setSrc] = useState(START.source);
  const [tb, setTb] = useState(START.time);
  const [ps, setPs] = useState(START.persist);
  const live = useRef({ src: START.source, tb: START.time, ps: START.persist });
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
    const L = layoutFor(narrow);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hasConic = typeof ctx.createConicGradient === "function";
    let k = 1; // canvas pixels per design pixel
    const gx = L.scr.x + L.inset, gy = L.scr.y + L.inset, gw = L.scr.w - L.inset * 2, gh = L.scr.h - L.inset * 2; // the glass
    const GW = L.div * DIVS_X, GH = L.div * DIVS_Y, ox = gx + (gw - GW) / 2, oy = gy + (gh - GH) / 2; // the ruled area

    const rr = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    };
    const hex = (c: CanvasRenderingContext2D, x: number, y: number, r: number, turn: number) => {
      c.beginPath(); for (let i = 0; i < 6; i++) { const a = turn + (i * Math.PI) / 3; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath();
    };
    // Lettering silk-screened on pale enamel.
    const ink = (c: CanvasRenderingContext2D, text: string, x: number, y: number, size = 8.5, align: CanvasTextAlign = "center", alpha = 0.86) => {
      c.font = `700 ${size}px ui-monospace, SFMono-Regular, Menlo, monospace`; c.textAlign = align; c.textBaseline = "middle";
      c.fillStyle = `rgba(38,34,28,${alpha})`; c.fillText(text, x, y);
    };
    const metal = (c: CanvasRenderingContext2D, x: number, y: number, r: number) => {
      const g = c.createLinearGradient(x - r, y - r, x + r, y + r);
      g.addColorStop(0, "#f6f6f4"); g.addColorStop(0.35, "#9c9d9f"); g.addColorStop(0.55, "#dedfe0"); g.addColorStop(0.8, "#5b5c5f"); g.addColorStop(1, "#adaeb0");
      return g;
    };

    // Layer 1: the enamelled case, the screen hood and every printed legend.
    const base = document.createElement("canvas");
    const build = () => {
      const b = base.getContext("2d");
      if (!b) return;
      base.width = cv.width; base.height = cv.height;
      b.setTransform(k, 0, 0, k, 0, 0);
      const body = b.createLinearGradient(0, 0, 0, L.H);
      body.addColorStop(0, "#ddd7c9"); body.addColorStop(0.55, "#cfc8b8"); body.addColorStop(1, "#b9b2a1");
      rr(b, 0, 0, L.W, L.H, 14); b.fillStyle = body; b.fill();
      b.save(); rr(b, 0, 0, L.W, L.H, 14); b.clip();
      // Powder coat: a fine speckle, and a slow wash of light from the top left.
      let seed = 7;
      const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let i = 0; i < L.W * L.H * 0.06; i++) { const v = rand(); b.fillStyle = v > 0.5 ? `rgba(255,255,255,${(v - 0.5) * 0.24})` : `rgba(60,50,30,${(0.5 - v) * 0.2})`; b.fillRect(rand() * L.W, rand() * L.H, 0.9, 0.9); }
      const wash = b.createLinearGradient(0, 0, L.W, L.H);
      wash.addColorStop(0, "rgba(255,255,255,0.2)"); wash.addColorStop(0.45, "rgba(255,255,255,0)"); wash.addColorStop(1, "rgba(60,48,24,0.14)");
      b.fillStyle = wash; b.fillRect(0, 0, L.W, L.H);
      b.restore();
      const edge = b.createLinearGradient(0, 0, 0, L.H);
      edge.addColorStop(0, "rgba(255,255,255,0.95)"); edge.addColorStop(0.1, "rgba(255,255,255,0.3)"); edge.addColorStop(0.88, "rgba(70,56,30,0.3)"); edge.addColorStop(1, "rgba(50,40,20,0.75)");
      rr(b, 0.7, 0.7, L.W - 1.4, L.H - 1.4, 13.4); b.lineWidth = 1.4; b.strokeStyle = edge; b.stroke();

      // The pressed plate the controls are mounted on.
      const P = L.plate;
      rr(b, P.x, P.y, P.w, P.h, 8); b.fillStyle = "rgba(70,58,34,0.075)"; b.fill();
      rr(b, P.x + 0.5, P.y + 0.5, P.w - 1, P.h - 1, 7.6); b.lineWidth = 1; b.strokeStyle = "rgba(60,48,24,0.42)"; b.stroke();
      rr(b, P.x + 1.6, P.y + 1.6, P.w - 3.2, P.h - 3.2, 6.6); b.lineWidth = 0.8; b.strokeStyle = "rgba(255,255,255,0.55)"; b.stroke();
      for (const [sx, sy] of [[P.x + 11, P.y + 11], [P.x + P.w - 11, P.y + 11], [P.x + 11, P.y + P.h - 11], [P.x + P.w - 11, P.y + P.h - 11]]) {
        b.beginPath(); b.arc(sx, sy + 0.7, 4.3, 0, TAU); b.fillStyle = "rgba(50,40,20,0.5)"; b.fill();
        b.beginPath(); b.arc(sx, sy, 3.8, 0, TAU); b.fillStyle = metal(b, sx, sy, 3.8); b.fill();
        b.save(); b.translate(sx, sy); b.rotate(sx * 0.37 + sy); b.fillStyle = "rgba(20,20,20,0.8)"; b.fillRect(-3, -0.55, 6, 1.1); b.restore();
      }

      // Screen hood: moulded black, deep, with a lit lower lip.
      const S = L.scr;
      b.save(); b.shadowColor = "rgba(255,255,255,0.7)"; b.shadowBlur = 0; b.shadowOffsetY = 1.3 * k;
      rr(b, S.x, S.y, S.w, S.h, 16); b.fillStyle = "#101011"; b.fill(); b.restore();
      const hood = b.createLinearGradient(0, S.y, 0, S.y + S.h);
      hood.addColorStop(0, "#3a3b3d"); hood.addColorStop(0.08, "#232425"); hood.addColorStop(0.9, "#161617"); hood.addColorStop(1, "#2c2d2f");
      rr(b, S.x + 1, S.y + 1, S.w - 2, S.h - 2, 15); b.fillStyle = hood; b.fill();
      const chamfer = b.createLinearGradient(0, gy - 6, 0, gy + gh + 6);
      chamfer.addColorStop(0, "#050505"); chamfer.addColorStop(0.5, "#151516"); chamfer.addColorStop(1, "#4a4b4d");
      rr(b, gx - 6, gy - 6, gw + 12, gh + 12, 24); b.fillStyle = chamfer; b.fill();
      rr(b, S.x + 1.5, S.y + 1.5, S.w - 3, S.h - 3, 14.6); b.lineWidth = 1; b.strokeStyle = "rgba(255,255,255,0.12)"; b.stroke();

      // Section headings with a rule either side.
      const heading = (text: string, x: number, y: number, half: number) => {
        ink(b, text, x, y, 8.5);
        const tw = b.measureText(text).width / 2 + 8;
        b.beginPath(); b.moveTo(x - half, y); b.lineTo(x - tw, y); b.moveTo(x + tw, y); b.lineTo(x + half, y); b.lineWidth = 0.8; b.strokeStyle = "rgba(38,34,28,0.5)"; b.stroke();
      };
      heading("SOURCE", P.x + P.w / 2, L.headY, P.w / 2 - 24);
      sources.forEach((s0, i) => ink(b, s0.name.toUpperCase(), L.keys.x + i * (L.keys.w + L.keys.gap) + L.keys.w / 2, L.keys.y + L.keys.h + 15, 8));
      const legends = [TIMEBASES.map((t) => String(t).replace(/^0/, "")), PERSIST.map((p) => p.mark)];
      L.knobs.forEach((kn, n) => {
        heading(n === 0 ? "TIME / DIV" : "PERSIST", kn.x, kn.y - 76, 54);
        for (let i = 0; i < 3; i++) {
          const a = stepAngle(i), sin = Math.sin(a), cos = -Math.cos(a);
          b.beginPath(); b.moveTo(kn.x + sin * 38, kn.y + cos * 38); b.lineTo(kn.x + sin * 44, kn.y + cos * 44); b.lineWidth = 1.5; b.strokeStyle = "rgba(38,34,28,0.86)"; b.stroke();
          ink(b, legends[n][i], kn.x + sin * 50 + (i - 1) * 3, kn.y + cos * 50 - (i === 1 ? 5 : 0), 8, i === 0 ? "right" : i === 2 ? "left" : "center");
        }
        if (n === 0) ink(b, "SECONDS", kn.x, kn.y + 48, 7, "center", 0.6);
        else ink(b, "AFTERGLOW", kn.x, kn.y + 48, 7, "center", 0.6);
      });

      // Input socket and earth post, for looks.
      if (L.bnc) {
        const { x, y } = L.bnc;
        b.save(); b.shadowColor = "rgba(50,40,20,0.55)"; b.shadowBlur = 5 * k; b.shadowOffsetX = 2 * k; b.shadowOffsetY = 3 * k;
        hex(b, x, y, 17, 0.2); b.fillStyle = metal(b, x, y, 17); b.fill(); b.restore();
        b.fillStyle = metal(b, x, y, 14); b.fillRect(x - 15.5, y - 2.4, 31, 4.8);
        b.beginPath(); b.arc(x, y, 11.5, 0, TAU); b.fillStyle = metal(b, x, y, -11.5); b.fill(); b.lineWidth = 0.7; b.strokeStyle = "rgba(0,0,0,0.5)"; b.stroke();
        b.beginPath(); b.arc(x, y, 8, 0, TAU); b.fillStyle = "#e9e6dc"; b.fill();
        b.beginPath(); b.arc(x, y, 5.4, 0, TAU); b.fillStyle = "#0d0d0d"; b.fill();
        b.beginPath(); b.arc(x, y, 1.9, 0, TAU); b.fillStyle = "#d8b24a"; b.fill();
        ink(b, "INPUT", x, y + 31, 8);
      }
      if (L.gnd) {
        const { x, y } = L.gnd;
        b.save(); b.shadowColor = "rgba(50,40,20,0.55)"; b.shadowBlur = 5 * k; b.shadowOffsetX = 2 * k; b.shadowOffsetY = 3 * k;
        b.beginPath(); b.arc(x, y, 13, 0, TAU); b.fillStyle = "#1b1b1c"; b.fill(); b.restore();
        for (let i = 0; i < 26; i++) { const a = (i / 26) * TAU; b.beginPath(); b.moveTo(x + Math.cos(a) * 9.5, y + Math.sin(a) * 9.5); b.lineTo(x + Math.cos(a) * 13, y + Math.sin(a) * 13); b.lineWidth = 1.1; b.strokeStyle = `rgba(255,255,255,${0.06 + 0.3 * Math.max(0, Math.cos(a + 2.3))})`; b.stroke(); }
        b.beginPath(); b.arc(x, y, 8.6, 0, TAU); b.fillStyle = metal(b, x, y, 8.6); b.fill();
        b.beginPath(); b.arc(x, y, 3.4, 0, TAU); b.fillStyle = "#0b0b0b"; b.fill();
        ink(b, "EARTH", x, y + 31, 8);
      }
      ink(b, MODEL, L.scr.x + 4, L.stripY, 8.5, "left", 0.8);
      ink(b, "ON", L.scr.x + L.scr.w - 22, L.stripY, 8, "right", 0.8);
    };

    const fit = () => {
      const w = cv.clientWidth || L.W;
      k = (w / L.W) * Math.min(2, window.devicePixelRatio || 1);
      cv.width = Math.round(L.W * k); cv.height = Math.round(L.H * k);
      build();
    };

    // The beam leaves a list of dated points behind it. Old ones are drawn dimmer, then dropped.
    type Pt = { t: number; x: number; y: number; b: boolean };
    let pts: Pt[] = [];
    const sim = { t: 0, p: 0, value: 0, press: [0, 0, 0], knob: [stepAngle(live.current.tb), stepAngle(live.current.ps)], light: -0.2 };
    sim.press[live.current.src] = 1;
    const yOf = (v: number, s0: (typeof sources)[number]) => oy + GH * (0.93 - 0.86 * clamp((v - s0.min) / (s0.max - s0.min), -0.04, 1.04));
    const advance = (dt: number) => {
      const T = TIMEBASES[live.current.tb] * DIVS_X, step = T / (GW / 2), s0 = sources[live.current.src];
      let left = dt;
      while (left > 1e-6) {
        const h = Math.min(step, left); left -= h; sim.t += h; sim.p += h / T;
        let b = false; if (sim.p >= 1) { sim.p -= 1; b = true; }
        sim.value = s0.at(sim.t);
        pts.push({ t: sim.t, x: ox + sim.p * GW, y: yOf(sim.value, s0), b });
      }
      let drop = 0; while (drop < pts.length && pts[drop].t < sim.t - 13) drop++;
      if (drop > 200) pts = pts.slice(drop);
    };

    const screen = (flat: boolean) => {
      ctx.save(); rr(ctx, gx, gy, gw, gh, 18); ctx.clip();
      const tube = ctx.createRadialGradient(gx + gw * 0.5, gy + gh * 0.48, 10, gx + gw * 0.5, gy + gh * 0.5, gw * 0.72);
      tube.addColorStop(0, "#1b2d27"); tube.addColorStop(0.6, "#111d19"); tube.addColorStop(1, "#060b09");
      ctx.fillStyle = tube; ctx.fillRect(gx, gy, gw, gh);
      // The graticule, edge lit.
      ctx.lineWidth = 0.6; ctx.strokeStyle = "rgba(170,255,214,0.14)"; ctx.beginPath();
      for (let i = 0; i <= DIVS_X; i++) { ctx.moveTo(ox + i * L.div, oy); ctx.lineTo(ox + i * L.div, oy + GH); }
      for (let j = 0; j <= DIVS_Y; j++) { ctx.moveTo(ox, oy + j * L.div); ctx.lineTo(ox + GW, oy + j * L.div); }
      ctx.stroke();
      ctx.strokeStyle = "rgba(170,255,214,0.3)"; ctx.beginPath();
      ctx.moveTo(ox + GW / 2, oy); ctx.lineTo(ox + GW / 2, oy + GH); ctx.moveTo(ox, oy + GH / 2); ctx.lineTo(ox + GW, oy + GH / 2);
      for (let i = 0; i <= DIVS_X * 5; i++) { const x = ox + (i * L.div) / 5; ctx.moveTo(x, oy + GH / 2 - 3); ctx.lineTo(x, oy + GH / 2 + 3); }
      for (let j = 0; j <= DIVS_Y * 5; j++) { const y = oy + (j * L.div) / 5; ctx.moveTo(ox + GW / 2 - 3, y); ctx.lineTo(ox + GW / 2 + 3, y); }
      ctx.stroke();

      // The trace, oldest light first so the fresh beam sits on top.
      const tau = PERSIST[live.current.ps].tau, maxAge = Math.min(12, tau * 4.4), NB = 40;
      ctx.globalCompositeOperation = "lighter"; ctx.lineJoin = "round"; ctx.lineCap = "round";
      let cur = -1, open = false, prev: Pt | null = null;
      const flush = (bi: number) => {
        if (!open) return;
        open = false;
        const f = (bi + 0.5) / NB, a = flat ? 1 : Math.exp(-(f * maxAge) / tau);
        if (a < 0.012) return;
        const m = flat ? 0 : Math.min(1, f * 2.2), col = FRESH.map((c, i) => Math.round(c + (OLD[i] - c) * m));
        ctx.lineWidth = 9; ctx.strokeStyle = `rgba(${OLD[0] * 0.4},${OLD[1]},${OLD[2] * 1.6},${a * 0.13})`; ctx.stroke();
        ctx.lineWidth = 3.6; ctx.strokeStyle = `rgba(${col[0] * 0.5},${col[1]},${col[2] * 0.8},${a * 0.42})`; ctx.stroke();
        ctx.lineWidth = 1.4; ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${a * 0.95})`; ctx.stroke();
      };
      for (const p of pts) {
        const age = sim.t - p.t;
        if (age > maxAge) { prev = p; continue; }
        const bi = flat ? 0 : Math.min(NB - 1, Math.floor((age / maxAge) * NB));
        if (bi !== cur) {
          flush(cur); cur = bi; ctx.beginPath(); open = true;
          if (prev && !p.b) { ctx.moveTo(prev.x, prev.y); ctx.lineTo(p.x, p.y); } else ctx.moveTo(p.x, p.y);
        } else if (p.b) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        prev = p;
      }
      flush(cur);
      if (!flat && prev) {
        const dot = ctx.createRadialGradient(prev.x, prev.y, 0, prev.x, prev.y, 11);
        dot.addColorStop(0, "rgba(235,255,244,0.95)"); dot.addColorStop(0.25, "rgba(150,255,200,0.5)"); dot.addColorStop(1, "rgba(60,255,150,0)");
        ctx.fillStyle = dot; ctx.fillRect(prev.x - 11, prev.y - 11, 22, 22);
      }
      ctx.globalCompositeOperation = "source-over";

      // The thick curved faceplate: shade under the hood, darker corners, and a window caught in it.
      const lip = ctx.createLinearGradient(0, gy, 0, gy + 34);
      lip.addColorStop(0, "rgba(0,0,0,0.75)"); lip.addColorStop(0.4, "rgba(0,0,0,0.25)"); lip.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = lip; ctx.fillRect(gx, gy, gw, 34);
      const rim = ctx.createRadialGradient(gx + gw / 2, gy + gh / 2, gh * 0.42, gx + gw / 2, gy + gh / 2, gw * 0.74);
      rim.addColorStop(0, "rgba(0,0,0,0)"); rim.addColorStop(1, "rgba(0,0,0,0.6)");
      ctx.fillStyle = rim; ctx.fillRect(gx, gy, gw, gh);
      const sx = gx + gw * (0.2 + 0.14 * sim.light);
      const band = ctx.createLinearGradient(0, gy, 0, gy + gh);
      band.addColorStop(0, "rgba(220,255,240,0.085)"); band.addColorStop(0.55, "rgba(220,255,240,0.025)"); band.addColorStop(1, "rgba(220,255,240,0)");
      ctx.fillStyle = band;
      ctx.beginPath(); ctx.moveTo(sx, gy); ctx.lineTo(sx + gw * 0.17, gy); ctx.lineTo(sx - gw * 0.13, gy + gh); ctx.lineTo(sx - gw * 0.3, gy + gh); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(sx + gw * 0.21, gy); ctx.lineTo(sx + gw * 0.245, gy); ctx.lineTo(sx - gw * 0.055, gy + gh); ctx.lineTo(sx - gw * 0.09, gy + gh); ctx.closePath(); ctx.fill();
      const bulge = ctx.createRadialGradient(gx + gw * 0.3, gy + gh * 0.16, 4, gx + gw * 0.36, gy + gh * 0.26, gw * 0.5);
      bulge.addColorStop(0, "rgba(220,255,240,0.1)"); bulge.addColorStop(1, "rgba(220,255,240,0)");
      ctx.fillStyle = bulge; ctx.fillRect(gx, gy, gw, gh);
      ctx.restore();
      // Green light spilling onto the inside of the hood.
      ctx.save(); rr(ctx, gx - 0.5, gy - 0.5, gw + 1, gh + 1, 18.5); ctx.lineWidth = 1; ctx.strokeStyle = "rgba(120,255,190,0.22)"; ctx.shadowColor = "rgba(90,255,170,0.9)"; ctx.shadowBlur = 10 * k; ctx.stroke(); ctx.restore();
    };

    const knob = (x: number, y: number, a: number) => {
      const la = -2.3;
      ctx.save(); ctx.shadowColor = "rgba(48,38,16,0.6)"; ctx.shadowBlur = 13 * k; ctx.shadowOffsetX = 6 * k; ctx.shadowOffsetY = 10 * k;
      ctx.beginPath(); ctx.arc(x, y, 33, 0, TAU); ctx.fillStyle = "#151516"; ctx.fill(); ctx.restore();
      const skirt = ctx.createLinearGradient(x - 33, y - 33, x + 33, y + 33);
      skirt.addColorStop(0, "#58595c"); skirt.addColorStop(0.45, "#232325"); skirt.addColorStop(1, "#0f0f10");
      ctx.beginPath(); ctx.arc(x, y, 33, 0, TAU); ctx.fillStyle = skirt; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, 32.4, Math.PI * 1.02, Math.PI * 1.55); ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.stroke();
      ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = "#f4f1e8"; ctx.fillRect(-1.3, -32, 2.6, 7.5); ctx.restore();
      const teeth = 22, step = TAU / teeth;
      for (let i = 0; i < teeth; i++) {
        const t0 = a + i * step, f = Math.cos(t0 - la - Math.PI / 2), lit = 0.5 + 0.5 * f, glint = Math.pow(Math.max(0, f), 7);
        for (let h = 0; h < 2; h++) {
          const a0 = t0 + h * step * 0.5 - Math.PI / 2, a1 = a0 + step * 0.5 + 0.004, v = h === 0 ? 34 + lit * 50 + glint * 110 : 12 + lit * 20;
          ctx.beginPath(); ctx.arc(x, y, h === 0 ? 25 : 23, a0, a1); ctx.arc(x, y, 14, a1, a0, true); ctx.closePath();
          ctx.fillStyle = `rgb(${v | 0},${v | 0},${(v + 2) | 0})`; ctx.fill();
        }
      }
      let cap: CanvasGradient;
      if (hasConic) {
        cap = ctx.createConicGradient(la, x, y);
        const stops: [number, number][] = [[0, 250], [0.08, 178], [0.2, 108], [0.3, 152], [0.42, 202], [0.5, 240], [0.58, 152], [0.7, 98], [0.82, 152], [0.93, 216], [1, 250]];
        for (const [o, v] of stops) cap.addColorStop(o, `rgb(${v},${v},${Math.max(0, v - 4)})`);
      } else cap = metal(ctx, x, y, 17);
      ctx.beginPath(); ctx.arc(x, y, 17.6, 0, TAU); ctx.fillStyle = "#0b0b0c"; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, 16.4, 0, TAU); ctx.fillStyle = cap; ctx.fill();
      for (let r = 2.5; r < 16; r += 1.6) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.lineWidth = 0.5; ctx.strokeStyle = (r / 1.6) % 2 < 1 ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.1)"; ctx.stroke(); }
      ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(0, -13.5); ctx.lineWidth = 2.2; ctx.strokeStyle = "#17171a"; ctx.stroke();
      ctx.restore();
    };

    const controls = () => {
      const K = L.keys;
      sources.forEach((_, i) => {
        const x = K.x + i * (K.w + K.gap), q = sim.press[i], y = K.y + q * 3.2, on = i === live.current.src;
        rr(ctx, x - 2, K.y - 1.5, K.w + 4, K.h + 7, 6); ctx.fillStyle = "#2b2822"; ctx.fill();
        rr(ctx, x - 2, K.y - 1.5, K.w + 4, K.h + 7, 6); ctx.lineWidth = 0.8; ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.stroke();
        // The side of the key cap, then its top.
        rr(ctx, x, y + 2, K.w, K.h + 2.6 - q * 3.2 + 0.6, 4); ctx.fillStyle = "#8f897b"; ctx.fill();
        const top = ctx.createLinearGradient(0, y, 0, y + K.h);
        top.addColorStop(0, q > 0.5 ? "#e4e0d5" : "#faf8f2"); top.addColorStop(0.5, q > 0.5 ? "#d5d0c3" : "#e9e5da"); top.addColorStop(1, q > 0.5 ? "#c3bdae" : "#d3cdbf");
        rr(ctx, x, y, K.w, K.h, 4); ctx.fillStyle = top; ctx.fill();
        rr(ctx, x + 0.6, y + 0.6, K.w - 1.2, K.h - 1.2, 3.6); ctx.lineWidth = 0.9; ctx.strokeStyle = `rgba(255,255,255,${0.85 - q * 0.4})`; ctx.stroke();
        // A shallow finger dish.
        const dish = ctx.createLinearGradient(0, y + 8, 0, y + K.h - 8);
        dish.addColorStop(0, "rgba(60,50,30,0.16)"); dish.addColorStop(1, "rgba(255,255,255,0.35)");
        rr(ctx, x + 12, y + 9, K.w - 24, K.h - 18, (K.h - 18) / 2); ctx.fillStyle = dish; ctx.fill();
        // Its lamp.
        const lx = x + K.w / 2, ly = K.y - 20;
        ctx.beginPath(); ctx.arc(lx, ly, 5.6, 0, TAU); ctx.fillStyle = metal(ctx, lx, ly, 5.6); ctx.fill();
        ctx.beginPath(); ctx.arc(lx, ly, 3.9, 0, TAU); ctx.fillStyle = "#101a14"; ctx.fill();
        ctx.save(); if (on) { ctx.shadowColor = "#52ffa6"; ctx.shadowBlur = 12 * k; }
        const lamp = ctx.createRadialGradient(lx - 1, ly - 1.2, 0.3, lx, ly, 3.4);
        lamp.addColorStop(0, on ? "#f2fff7" : "#3d6650"); lamp.addColorStop(0.5, on ? "#52ffa6" : "#234232"); lamp.addColorStop(1, on ? "#12a85a" : "#12251b");
        ctx.beginPath(); ctx.arc(lx, ly, 3.3, 0, TAU); ctx.fillStyle = lamp; ctx.fill(); ctx.restore();
      });
      L.knobs.forEach((kn, n) => knob(kn.x, kn.y, sim.knob[n]));
      // Mains lamp.
      const px = L.scr.x + L.scr.w - 10, py = L.stripY;
      ctx.beginPath(); ctx.arc(px, py, 6.2, 0, TAU); ctx.fillStyle = metal(ctx, px, py, 6.2); ctx.fill();
      ctx.save(); ctx.shadowColor = "#ff9d3c"; ctx.shadowBlur = 12 * k;
      const jewel = ctx.createRadialGradient(px - 1.2, py - 1.4, 0.4, px, py, 4.2);
      jewel.addColorStop(0, "#fff2d6"); jewel.addColorStop(0.5, "#ffa53f"); jewel.addColorStop(1, "#b25a0c");
      ctx.beginPath(); ctx.arc(px, py, 4.2, 0, TAU); ctx.fillStyle = jewel; ctx.fill(); ctx.restore();
    };

    const draw = (flat: boolean) => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(base, 0, 0);
      ctx.setTransform(k, 0, 0, k, 0, 0);
      screen(flat);
      controls();
    };
    const say = () => { if (figure.current) figure.current.textContent = String(Math.round(sim.value)); };

    let raf = 0, last = 0, seen = true, moved = -1e9, spoke = 0;
    const frame = (now: number) => {
      raf = 0;
      if (!last) last = now;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      advance(dt);
      for (let i = 0; i < 3; i++) sim.press[i] += ((i === live.current.src ? 1 : 0) - sim.press[i]) * Math.min(1, dt * 26);
      sim.knob[0] += (stepAngle(live.current.tb) - sim.knob[0]) * Math.min(1, dt * 18);
      sim.knob[1] += (stepAngle(live.current.ps) - sim.knob[1]) * Math.min(1, dt * 18);
      if (now - moved > 2500) sim.light += (0.5 * Math.sin(now / 2300) - sim.light) * Math.min(1, dt * 4);
      draw(false);
      if (now - spoke > 240) { spoke = now; say(); }
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    // With motion reduced the screen shows one whole sweep at full brightness and holds it.
    const still = () => {
      pts = []; sim.t = 0; sim.p = 0;
      advance(TIMEBASES[live.current.tb] * DIVS_X * 0.998);
      sim.press = [0, 0, 0]; sim.press[live.current.src] = 1;
      sim.knob = [stepAngle(live.current.tb), stepAngle(live.current.ps)];
      draw(true); say();
    };
    const wake = () => { if (reduce) still(); else if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };
    api.current = { poke: wake };
    fit();
    if (!reduce) advance(12); // light the tube with the sweeps it would already have drawn
    wake();

    const onLight = (e: PointerEvent) => { const r = cv.getBoundingClientRect(); moved = performance.now(); sim.light = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1); };
    const host = cv.parentElement;
    host?.addEventListener("pointermove", onLight);
    const ro = new ResizeObserver(() => { fit(); if (reduce) still(); });
    ro.observe(cv);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); api.current = null;
      host?.removeEventListener("pointermove", onLight);
      ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", onVis);
    };
  }, [narrow]);

  const L = layoutFor(narrow);
  const pick = (i: number) => { live.current.src = i; setSrc(i); api.current?.poke(); };
  const turn = (n: number, next: number) => {
    const v = clamp(next, 0, 2);
    if (n === 0) { live.current.tb = v; setTb(v); } else { live.current.ps = v; setPs(v); }
    api.current?.poke();
  };
  const onKey = (n: number, cur: number) => (e: ReactKeyboardEvent) => {
    const next = e.key === "ArrowRight" || e.key === "ArrowUp" ? cur + 1 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? cur - 1 : e.key === "Home" ? 0 : e.key === "End" ? 2 : e.key === "Enter" || e.key === " " ? (cur + 1) % 3 : null;
    if (next === null) return;
    e.preventDefault(); turn(n, next);
  };
  const pct = (v: number, of: number) => `${(v / of) * 100}%`;
  const dials = [
    { label: "Time per division", cur: tb, text: `${TIMEBASES[tb]} seconds per division` },
    { label: "Persistence of the trace", cur: ps, text: PERSIST[ps].label },
  ];

  return (
    <div ref={stage} className="flex min-h-[720px] w-full flex-col items-center justify-center bg-[#0d0f11] bg-[radial-gradient(90%_70%_at_50%_40%,#1d2226_0%,#0d0f11_72%)] px-4 py-12">
      <div
        className="relative w-full rounded-[14px] shadow-[0_2px_3px_rgba(0,0,0,0.6),0_20px_32px_-8px_rgba(0,0,0,0.75),0_64px_90px_-22px_rgba(0,0,0,0.9)]"
        style={{ maxWidth: L.W, aspectRatio: `${L.W} / ${L.H}` }}
      >
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full rounded-[14px]" />
        {sources.map((s0, i) => (
          <button
            key={s0.name}
            type="button"
            aria-pressed={i === src}
            aria-label={`Show ${s0.name.toLowerCase()}`}
            onClick={() => pick(i)}
            style={{ left: pct(L.keys.x + i * (L.keys.w + L.keys.gap), L.W), top: pct(L.keys.y - 28, L.H), width: pct(L.keys.w, L.W), height: pct(L.keys.h + 52, L.H) }}
            className="absolute cursor-pointer rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[#1f8f5a]"
          />
        ))}
        {dials.map((d, n) => (
          <div
            key={d.label}
            role="slider"
            tabIndex={0}
            aria-label={d.label}
            aria-valuemin={0}
            aria-valuemax={2}
            aria-valuenow={d.cur}
            aria-valuetext={d.text}
            onKeyDown={onKey(n, d.cur)}
            onClick={() => turn(n, (d.cur + 1) % 3)}
            style={{ left: pct(L.knobs[n].x - 42, L.W), top: pct(L.knobs[n].y - 42, L.H), width: pct(84, L.W), height: pct(84, L.H) }}
            className="absolute cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#1f8f5a]"
          />
        ))}
      </div>
      <p className="mt-9 text-center font-mono text-[11px] uppercase leading-5 tracking-[0.18em] text-slate-400">
        <span className="whitespace-nowrap text-slate-100">{sources[src].name} <span ref={figure} className="inline-block min-w-[3ch] text-right tabular-nums text-[#8dffc0]">0</span> <span className="normal-case">{sources[src].unit}</span></span>
        <span className="mx-2 text-slate-600">/</span>
        <span className="whitespace-nowrap">{TIMEBASES[tb]} s a square</span>
        <span className="mx-2 text-slate-600">/</span>
        <span className="whitespace-nowrap">Glow {PERSIST[ps].label}</span>
      </p>
    </div>
  );
}
