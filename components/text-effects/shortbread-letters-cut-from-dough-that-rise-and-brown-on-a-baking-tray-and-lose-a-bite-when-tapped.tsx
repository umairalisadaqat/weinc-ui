import { useEffect, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { useReducedMotion } from "framer-motion";

/** The word on the tray when the page loads. */
const START_WORD = "THANKS";
/** Longest word the field accepts. */
const MAX_LETTERS = 8;
/** Worktop colour around the tray. */
const WORKTOP = "#27382f";
/** Baked biscuit: the pale middle and the browned rim. */
const GOLD: [number, number, number] = [229, 180, 106];
const BROWN: [number, number, number] = [166, 98, 40];
/** Raw dough. */
const DOUGH: [number, number, number] = [238, 224, 190];
/** Seconds the oven light stays on. */
const BAKE_SECONDS = 2.8;

/** Height of a capital in the baked sprite, in pixels. */
const CAP = 200;
const PAD = 26;

function boxBlur(src: Float32Array, w: number, h: number, r: number): Float32Array {
  const out = new Float32Array(src.length);
  const tmp = new Float32Array(src.length);
  const span = 2 * r + 1;
  let from = src;
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y < h; y++) {
      const row = y * w;
      let sum = 0;
      for (let x = -r; x <= r; x++) sum += from[row + Math.min(w - 1, Math.max(0, x))];
      for (let x = 0; x < w; x++) {
        tmp[row + x] = sum / span;
        sum += from[row + Math.min(w - 1, x + r + 1)] - from[row + Math.max(0, x - r)];
      }
    }
    for (let x = 0; x < w; x++) {
      let sum = 0;
      for (let y = -r; y <= r; y++) sum += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
      for (let y = 0; y < h; y++) {
        out[y * w + x] = sum / span;
        sum += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
      }
    }
    from = out;
  }
  return out;
}

function random(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** Smooth blotches between 0 and 1, one value per pixel. */
function blotches(w: number, h: number, cell: number, rnd: () => number): Float32Array {
  const gw = Math.ceil(w / cell) + 2;
  const gh = Math.ceil(h / cell) + 2;
  const grid = new Float32Array(gw * gh);
  for (let i = 0; i < grid.length; i++) grid[i] = rnd();
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const gy = Math.floor(y / cell);
    let fy = y / cell - gy;
    fy = fy * fy * (3 - 2 * fy);
    for (let x = 0; x < w; x++) {
      const gx = Math.floor(x / cell);
      let fx = x / cell - gx;
      fx = fx * fx * (3 - 2 * fx);
      const i = gy * gw + gx;
      const top = grid[i] + (grid[i + 1] - grid[i]) * fx;
      const bot = grid[i + gw] + (grid[i + gw + 1] - grid[i + gw]) * fx;
      out[y * w + x] = top + (bot - top) * fy;
    }
  }
  return out;
}

type Baked = { w: number; h: number; bw: number; edges: Array<[number, number]>; tops: Array<[number, number]> };

/**
 * Cuts one letter and draws it twice, as raw dough and as a baked biscuit.
 * The outline is roughened so no two edges match, puffed into a pillow,
 * pricked with a fork, and browned most where the dough is thinnest.
 */
function cut(rawCv: HTMLCanvasElement, bakedCv: HTMLCanvasElement, ch: string, seed: number): Baked | null {
  const face = `900 ${Math.round(CAP / 0.72)}px "Arial Rounded MT Bold", "Helvetica Neue", Helvetica, Arial, sans-serif`;
  const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!probe) return null;
  probe.font = face;
  const m = probe.measureText(ch);
  const left = Math.ceil(m.actualBoundingBoxLeft);
  const bw = Math.max(40, Math.ceil(m.actualBoundingBoxLeft + m.actualBoundingBoxRight));
  const asc = Math.ceil(m.actualBoundingBoxAscent);
  const bh = Math.max(40, Math.ceil(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent));
  const w = bw + PAD * 2;
  const h = bh + PAD * 2;
  probe.canvas.width = w;
  probe.canvas.height = h;
  probe.font = face;
  probe.fillStyle = "#fff";
  probe.strokeStyle = "#fff";
  probe.lineJoin = "round";
  probe.lineWidth = CAP * 0.06;
  probe.strokeText(ch, PAD + left, PAD + asc);
  probe.fillText(ch, PAD + left, PAD + asc);
  const px = probe.getImageData(0, 0, w, h).data;
  const hard = new Float32Array(w * h);
  for (let i = 0; i < hard.length; i++) hard[i] = px[i * 4 + 3] / 255;

  const rnd = random(seed);
  const wobble = blotches(w, h, 15, rnd);
  const lumps = blotches(w, h, 22, rnd);
  const pores = blotches(w, h, 5, rnd);
  const patch = blotches(w, h, 46, rnd);
  // Dough spreads in the oven: soften the outline, then cut it again along a wandering line.
  const softened = boxBlur(hard, w, h, 3);
  const a = new Float32Array(w * h);
  for (let i = 0; i < a.length; i++) {
    const v = (softened[i] + (wobble[i] - 0.5) * 0.22 - 0.42) * 7;
    a[i] = Math.min(1, Math.max(0, v));
  }
  const edge = boxBlur(a, w, h, 8);
  const dome = boxBlur(a, w, h, 24);

  // Fork holes, only where the stroke is wide enough to take one.
  const holes: Array<[number, number]> = [];
  const pitch = 30;
  for (let gy = PAD; gy < h - PAD; gy += pitch) {
    for (let gx = PAD; gx < w - PAD; gx += pitch) {
      let best = 0, bx = 0, by = 0;
      for (let k = 0; k < 14; k++) {
        const x = Math.floor(gx + rnd() * pitch), y = Math.floor(gy + rnd() * pitch);
        const v = x < w && y < h ? edge[y * w + x] : 0;
        if (v > best) { best = v; bx = x; by = y; }
      }
      if (best > 0.968 && !holes.some(([hx, hy]) => Math.hypot(hx - bx, hy - by) < 21)) holes.push([bx, by]);
    }
  }
  const pit = new Float32Array(w * h);
  for (const [hx, hy] of holes) {
    for (let y = hy - 9; y <= hy + 9; y++) {
      for (let x = hx - 9; x <= hx + 9; x++) {
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        const d = Math.hypot(x - hx, y - hy);
        pit[y * w + x] = Math.max(pit[y * w + x], Math.exp(-(d * d) / 11));
      }
    }
  }

  const edges: Array<[number, number]> = [];
  const tops: Array<[number, number]> = [];
  const lx = -0.46, ly = -0.56, lz = 0.69;
  const hl = Math.hypot(lx, ly, lz + 1);
  const hx = lx / hl, hy = ly / hl, hz = (lz + 1) / hl;

  const paint = (cv: HTMLCanvasElement, baked: boolean) => {
    cv.width = w;
    cv.height = h;
    const c = cv.getContext("2d");
    if (!c) return;
    const rise = baked ? 1 : 0.55;
    const hgt = new Float32Array(w * h);
    for (let i = 0; i < hgt.length; i++) {
      const t = Math.min(1, Math.max(0, (edge[i] - 0.5) * 2.05));
      hgt[i] =
        (Math.sqrt(1 - (1 - t) * (1 - t)) * 15 + dome[i] * 13) * rise +
        (lumps[i] - 0.5) * (baked ? 3.6 : 1.4) +
        (pores[i] - 0.5) * (baked ? 1.5 : 0.6) -
        pit[i] * (baked ? 6.5 : 8.5);
    }
    const out = c.createImageData(w, h);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        if (a[i] <= 0) continue;
        let nx = -(hgt[i + 1] - hgt[i - 1]) * 0.6;
        let ny = -(hgt[i + w] - hgt[i - w]) * 0.6;
        const nl = Math.hypot(nx, ny, 1);
        nx /= nl;
        ny /= nl;
        const nz = 1 / nl;
        const diff = Math.max(0, nx * lx + ny * ly + nz * lz);
        const nh = Math.max(0, nx * hx + ny * hy + nz * hz);
        const rim = 1 - Math.min(1, Math.max(0, (edge[i] - 0.5) * 2.05));
        let r: number, g: number, b: number;
        if (baked) {
          const k = Math.min(1, Math.pow(rim, 1.2) * 1.05 + (patch[i] - 0.45) * 0.34 + (pores[i] - 0.5) * 0.12);
          const kk = Math.max(0, k);
          r = GOLD[0] + (BROWN[0] - GOLD[0]) * kk;
          g = GOLD[1] + (BROWN[1] - GOLD[1]) * kk;
          b = GOLD[2] + (BROWN[2] - GOLD[2]) * kk;
        } else {
          const kk = rim * 0.12 + (patch[i] - 0.5) * 0.05;
          r = DOUGH[0] * (1 - kk);
          g = DOUGH[1] * (1 - kk);
          b = DOUGH[2] * (1 - kk * 1.3);
        }
        const dark = 1 - pit[i] * (baked ? 0.42 : 0.3);
        const shade = (0.47 + 0.78 * diff) * dark;
        const spec = Math.pow(nh, 18) * (baked ? 0.1 : 0.05);
        const grain = (rnd() - 0.5) * (baked ? 6 : 4);
        const o = i * 4;
        out.data[o] = Math.min(255, r * shade + 255 * spec + grain);
        out.data[o + 1] = Math.min(255, g * shade + 255 * spec + grain);
        out.data[o + 2] = Math.min(255, b * shade + 255 * spec + grain * 0.7);
        out.data[o + 3] = a[i] * 255;
        if (baked && edge[i] > 0.46 && edge[i] < 0.6 && a[i] > 0.9 && rnd() < 0.004) edges.push([x, y]);
        if (baked && edge[i] > 0.9 && pit[i] < 0.05 && rnd() < 0.0012) tops.push([x / w, y / h]);
      }
    }
    c.putImageData(out, 0, 0);
    // Sugar on the baked ones, flour on the raw ones.
    c.globalCompositeOperation = "source-atop";
    const grains = Math.round((w * h) / (baked ? 900 : 900));
    for (let n = 0; n < grains; n++) {
      const x = rnd() * w, y = rnd() * h;
      const s = baked ? 1.2 + rnd() * 1.8 : 0.8 + rnd() * 1.2;
      c.fillStyle = baked ? `rgba(255,250,236,${0.5 + rnd() * 0.45})` : `rgba(255,255,255,${0.35 + rnd() * 0.3})`;
      c.fillRect(x, y, s, s);
      if (baked) {
        c.fillStyle = "rgba(110,60,20,0.3)";
        c.fillRect(x + s * 0.6, y + s, s * 0.8, 0.8);
      }
    }
    c.globalCompositeOperation = "source-over";
  };
  paint(rawCv, false);
  paint(bakedCv, true);
  return { w, h, bw, edges, tops };
}

type Crumb = { x: number; y: number; s: number; r: number };

export default function ShortbreadLetters() {
  const reduce = useReducedMotion();
  const [word, setWord] = useState(START_WORD);
  const [batch, setBatch] = useState(0);
  const [phase, setPhase] = useState<"raw" | "baking" | "baked">("baked");
  const [crumbs, setCrumbs] = useState<Crumb[]>([]);
  const [bites, setBites] = useState(0);
  const [glints, setGlints] = useState<Array<Array<[number, number]>>>([]);
  const tray = useRef<HTMLDivElement>(null);
  const sprites = useRef<Array<Baked & { el: HTMLButtonElement; scale: number }>>([]);
  const first = useRef(true);
  const letters = word.split("");

  useEffect(() => {
    const el = tray.current;
    if (!el) return;
    const initial = first.current;
    first.current = false;
    setCrumbs([]);
    setBites(0);
    const buttons = Array.from(el.querySelectorAll<HTMLButtonElement>("[data-biscuit]"));
    const list: Array<Baked & { el: HTMLButtonElement; scale: number; seed: number }> = [];
    buttons.forEach((b, i) => {
      const cvs = b.querySelectorAll("canvas");
      const ch = b.dataset.biscuit || "";
      const seed = (i + 1) * 7919 + ch.charCodeAt(0) * 104729 + batch * 31;
      const size = cvs.length === 2 ? cut(cvs[0], cvs[1], ch, seed) : null;
      if (size) list.push({ el: b, ...size, scale: 1, seed: random(seed)() });
    });
    sprites.current = list;
    setGlints(list.map((b) => b.tops.slice(0, 3)));

    const layout = () => {
      const W = el.clientWidth, H = el.clientHeight;
      const rows = W < 560 && list.length > 4 ? 2 : 1;
      const perRow = Math.ceil(list.length / rows);
      const gap = CAP * 0.16;
      const rowWidth = (r: number) => list.slice(r * perRow, (r + 1) * perRow).reduce((sum, b) => sum + b.bw + gap, -gap);
      const widest = Math.max(1, rowWidth(0), rows > 1 ? rowWidth(1) : 0);
      const scale = Math.min((W * 0.84) / widest, (H * (rows > 1 ? 0.34 : 0.6)) / CAP, 1.1);
      const lineH = CAP * 1.24 * scale;
      const top = H * 0.5 - ((rows - 1) * lineH) / 2;
      for (let r = 0; r < rows; r++) {
        let x = W / 2 - (rowWidth(r) * scale) / 2;
        list.slice(r * perRow, (r + 1) * perRow).forEach((b) => {
          const cx = x + (b.bw * scale) / 2;
          const cy = top + r * lineH + (b.seed - 0.5) * 18 * scale;
          const turn = (((b.seed * 5.17) % 1) - 0.5) * 9;
          x += (b.bw + gap) * scale;
          b.scale = scale;
          b.el.style.width = `${b.w * scale}px`;
          b.el.style.height = `${b.h * scale}px`;
          b.el.style.transform = `translate3d(${cx - (b.w * scale) / 2}px, ${cy - (b.h * scale) / 2}px, 0) rotate(${turn}deg)`;
          b.el.style.opacity = "1";
        });
      }
    };
    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(el);

    // The first tray arrives baked. Every later one goes in raw and is baked while you watch.
    const timers: number[] = [];
    if (initial || reduce) {
      setPhase("baked");
    } else {
      setPhase("raw");
      timers.push(window.setTimeout(() => setPhase("baking"), 950));
      timers.push(window.setTimeout(() => setPhase("baked"), 950 + BAKE_SECONDS * 1000));
    }
    return () => {
      ro.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [word, batch, reduce]);

  function bite(i: number, e: ReactMouseEvent<HTMLButtonElement>) {
    const b = sprites.current[i];
    if (!b || phase !== "baked") return;
    let x: number, y: number;
    if (e.detail === 0 || !b.edges.length) {
      // From the keyboard: bite somewhere on the rim.
      const p = b.edges[(bites * 7 + i * 3) % Math.max(1, b.edges.length)] || [b.w / 2, b.h / 2];
      x = p[0];
      y = p[1];
    } else {
      // The sprite is rotated a few degrees; undo that to find the spot in its own pixels.
      const r = b.el.getBoundingClientRect();
      const turn = (parseFloat((b.el.style.transform.match(/rotate\(([-\d.]+)deg\)/) || ["", "0"])[1]) * Math.PI) / 180;
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      x = b.w / 2 + (dx * Math.cos(-turn) - dy * Math.sin(-turn)) / b.scale;
      y = b.h / 2 + (dx * Math.sin(-turn) + dy * Math.cos(-turn)) / b.scale;
    }
    const R = CAP * 0.17;
    b.el.querySelectorAll("canvas").forEach((cv, n) => {
      const c = cv.getContext("2d");
      if (!c) return;
      const teeth = (grow: number) => {
        c.beginPath();
        c.arc(x, y, R + grow, 0, 6.2832);
        for (let k = 0; k < 6; k++) {
          const t = (k / 6) * 6.2832 + i;
          const tx = x + Math.cos(t) * R * 0.92, ty = y + Math.sin(t) * R * 0.92;
          c.moveTo(tx + R * 0.36 + grow, ty);
          c.arc(tx, ty, R * 0.36 + grow, 0, 6.2832);
        }
      };
      // The pale crumb inside shows as a rim round the bite.
      c.globalCompositeOperation = "source-atop";
      c.fillStyle = "rgba(96,54,18,0.45)";
      teeth(6.5);
      c.fill();
      c.fillStyle = n ? "#f3dcae" : "#f4ecd6";
      teeth(4.5);
      c.fill();
      c.globalCompositeOperation = "destination-out";
      c.fillStyle = "#000";
      teeth(0);
      c.fill();
      c.globalCompositeOperation = "source-over";
    });
    const host = tray.current?.getBoundingClientRect();
    const r = b.el.getBoundingClientRect();
    if (host) {
      const turn = (parseFloat((b.el.style.transform.match(/rotate\(([-\d.]+)deg\)/) || ["", "0"])[1]) * Math.PI) / 180;
      const ox = (x - b.w / 2) * b.scale, oy = (y - b.h / 2) * b.scale;
      const cx = r.left + r.width / 2 - host.left + ox * Math.cos(turn) - oy * Math.sin(turn);
      const cy = r.top + r.height / 2 - host.top + ox * Math.sin(turn) + oy * Math.cos(turn);
      const rnd = random(bites * 97 + i * 13 + 5);
      const fresh: Crumb[] = Array.from({ length: 7 }, () => {
        const t = rnd() * 6.2832, d = (0.2 + rnd() * 1.1) * R * b.scale;
        return { x: cx + Math.cos(t) * d, y: cy + Math.sin(t) * d, s: 2 + rnd() * 5, r: rnd() * 180 };
      });
      setCrumbs((c) => [...c.slice(-60), ...fresh]);
    }
    setBites((n) => n + 1);
  }

  return (
    <section className="relative isolate flex min-h-[660px] w-full flex-col items-center overflow-hidden px-4 pt-14 sm:px-8" style={{ backgroundColor: WORKTOP }}>
      <style>{`
        @keyframes shortbread-letters-cut-from-dough-land { 0% { transform: scale(1.14); opacity: 0; } 60% { opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes shortbread-letters-cut-from-dough-steam { 0% { transform: translate3d(0, 30px, 0) scale(0.7, 0.8); opacity: 0; } 25% { opacity: 0.5; } 60% { transform: translate3d(14px, -70px, 0) scale(1.15, 1.25); opacity: 0.3; } 100% { transform: translate3d(-10px, -170px, 0) scale(1.6, 1.7); opacity: 0; } }
        @keyframes shortbread-letters-cut-from-dough-glint { 0%, 62%, 100% { opacity: 0; transform: scale(0.3); } 80% { opacity: 1; transform: scale(1); } }
        @keyframes shortbread-letters-cut-from-dough-crumb { from { transform: scale(0.2); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .shortbread-letters-b { position: absolute; left: 0; top: 0; opacity: 0; cursor: pointer; border-radius: 16px; -webkit-tap-highlight-color: transparent; }
        .shortbread-letters-b .sl-land, .shortbread-letters-b .sl-puff { position: absolute; inset: 0; display: block; }
        .shortbread-letters-b .sl-puff { filter: drop-shadow(0 2px 1.5px rgba(70,44,12,0.45)) drop-shadow(4px 9px 8px rgba(70,44,12,0.22)); transition: transform ${BAKE_SECONDS}s cubic-bezier(0.3, 0.7, 0.3, 1); }
        .shortbread-letters-b canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
        .shortbread-letters-b .sl-done { transition: opacity ${BAKE_SECONDS}s ease-in-out; }
        [data-phase="raw"] .sl-done { opacity: 0; transition: none; }
        [data-phase="raw"] .sl-puff { transform: scale(0.94); transition: none; }
        [data-phase="raw"] .sl-land { animation: shortbread-letters-cut-from-dough-land 420ms cubic-bezier(0.2, 0.9, 0.3, 1.2) both; animation-delay: calc(var(--i) * 80ms); }
        .shortbread-letters-heat { opacity: 0; transition: opacity 900ms ease-in-out; }
        [data-phase="baking"] .shortbread-letters-heat { opacity: 1; }
        .shortbread-letters-steam { opacity: 0; }
        [data-phase="baked"] .shortbread-letters-steam { animation: shortbread-letters-cut-from-dough-steam 5.2s ease-out infinite; }
        .shortbread-letters-glint { position: absolute; width: 3px; height: 3px; margin: -1.5px; border-radius: 9999px; background: #fff; box-shadow: 0 0 5px 1.5px rgba(255,248,225,0.9); opacity: 0; pointer-events: none; }
        [data-phase="baked"] .shortbread-letters-glint { animation: shortbread-letters-cut-from-dough-glint 3.4s ease-in-out infinite; }
        .shortbread-letters-crumb { animation: shortbread-letters-cut-from-dough-crumb 260ms ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .shortbread-letters-b .sl-puff, .shortbread-letters-b .sl-done, .shortbread-letters-heat { transition: none; }
          [data-phase] .sl-land, [data-phase] .shortbread-letters-steam, [data-phase] .shortbread-letters-glint, .shortbread-letters-crumb { animation: none; }
        }
      `}</style>
      <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: "radial-gradient(90% 70% at 38% 30%, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0) 60%), linear-gradient(180deg, rgba(0,0,0,0) 55%, rgba(0,0,0,0.28) 100%)" }} />

      <h2 className="sr-only">{word}</h2>

      {/* The baking sheet: rolled steel rim, a dark well and a sheet of parchment. */}
      <div
        data-phase={phase}
        className="relative w-full max-w-[1060px] rounded-[30px] p-[13px]"
        style={{
          background: "linear-gradient(145deg, #a9aeb1 0%, #6d7276 16%, #3c4043 50%, #25282a 84%, #54595c 100%)",
          boxShadow: "0 50px 60px -30px rgba(0,0,0,0.65), 0 18px 24px -10px rgba(0,0,0,0.4), inset 0 1.5px 0 rgba(255,255,255,0.45), inset 0 -2px 3px rgba(0,0,0,0.5)",
        }}
      >
        <div className="relative rounded-[19px] p-[10px] sm:p-[16px]" style={{ background: "linear-gradient(160deg, #1b1d1f 0%, #2d3033 60%, #3a3e41 100%)", boxShadow: "inset 0 6px 10px rgba(0,0,0,0.65), inset 0 -1px 0 rgba(255,255,255,0.12)" }}>
          <div
            ref={tray}
            className="relative h-[470px] w-full overflow-hidden rounded-[4px] sm:h-[390px]"
            style={{
              backgroundColor: "#f0e7d3",
              backgroundImage:
                "linear-gradient(99deg, rgba(120,96,56,0) 23.7%, rgba(120,96,56,0.1) 24%, rgba(255,255,255,0.4) 24.3%, rgba(255,255,255,0) 26.5%), linear-gradient(83deg, rgba(120,96,56,0) 73.7%, rgba(120,96,56,0.08) 74%, rgba(255,255,255,0.35) 74.3%, rgba(255,255,255,0) 77%), radial-gradient(22% 30% at 12% 82%, rgba(190,150,80,0.16) 0%, rgba(190,150,80,0) 100%), radial-gradient(18% 24% at 86% 18%, rgba(190,150,80,0.13) 0%, rgba(190,150,80,0) 100%), linear-gradient(135deg, #f8f1e1 0%, #ebe0c8 100%)",
              boxShadow: "0 2px 5px rgba(0,0,0,0.5), inset 0 0 40px rgba(150,120,70,0.14)",
            }}
          >
            {crumbs.map((c, i) => (
              <span key={i} aria-hidden="true" className="shortbread-letters-crumb absolute rounded-[40%]" style={{ left: c.x, top: c.y, width: c.s, height: c.s * 0.8, rotate: `${c.r}deg`, background: "radial-gradient(circle at 35% 30%, #edc98a, #b77a35)", boxShadow: "0.5px 1px 1px rgba(70,44,12,0.4)" }} />
            ))}
            {letters.map((ch, i) => (
              <button
                key={`${word}-${batch}-${i}`}
                type="button"
                data-biscuit={ch}
                onClick={(e) => bite(i, e)}
                aria-label={`Biscuit ${i + 1} of ${letters.length}, letter ${ch}. Press to take a bite.`}
                className="shortbread-letters-b focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#27382f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f0e7d3]"
                style={{ ["--i" as string]: i }}
              >
                <span className="sl-land">
                  <span className="sl-puff">
                    <canvas aria-hidden="true" />
                    <canvas aria-hidden="true" className="sl-done" />
                    {(glints[i] || []).map(([gx, gy], n) => (
                      <span key={n} aria-hidden="true" className="shortbread-letters-glint" style={{ left: `${gx * 100}%`, top: `${gy * 100}%`, animationDelay: `${-((i * 0.83 + n * 1.37) % 3.4)}s` }} />
                    ))}
                  </span>
                </span>
              </button>
            ))}
            <div aria-hidden="true" className="shortbread-letters-heat pointer-events-none absolute inset-0" style={{ background: "radial-gradient(80% 90% at 50% 45%, rgba(255,150,40,0.42) 0%, rgba(255,96,20,0.3) 60%, rgba(200,50,10,0.38) 100%)", mixBlendMode: "multiply" }} />
          </div>
        </div>
        {[18, 37, 55, 71, 86].map((x, i) => (
          <span
            key={x}
            aria-hidden="true"
            className="shortbread-letters-steam pointer-events-none absolute top-[6%] h-[190px] w-[90px] rounded-full"
            style={{ left: `${x}%`, background: "radial-gradient(closest-side, rgba(255,255,255,0.34), rgba(255,255,255,0))", filter: "blur(18px)", animationDelay: `${-i * 1.07}s` }}
          />
        ))}
      </div>

      <div className="relative mt-auto flex w-full max-w-[1060px] flex-wrap items-center justify-between gap-x-6 gap-y-3 pb-8 pt-7 text-[13px]">
        <p className="text-[#c9d6cc]" aria-live="polite">
          <span className="font-semibold text-white">Shortbread letters</span>
          <span className="mx-2 opacity-50">/</span>
          {phase === "raw" ? "cut and on the tray" : phase === "baking" ? "in the oven" : bites ? `${bites} ${bites === 1 ? "bite" : "bites"} gone` : "warm from the oven, tap one to bite it"}
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor="shortbread-letters-word" className="sr-only">
            Word to cut from the dough
          </label>
          <input
            id="shortbread-letters-word"
            value={word}
            maxLength={MAX_LETTERS}
            onChange={(e) => setWord(e.target.value.toUpperCase().replace(/[^A-Z0-9!?&]/g, "").slice(0, MAX_LETTERS))}
            autoComplete="off"
            spellCheck={false}
            className="h-11 w-[150px] rounded-full border border-white/25 bg-[#1b2921] px-4 text-[14px] font-semibold tracking-[0.18em] text-white outline-none placeholder:text-white/50 focus-visible:ring-2 focus-visible:ring-[#f0d9a8]"
          />
          <button
            type="button"
            onClick={() => setBatch((n) => n + 1)}
            className="h-11 shrink-0 rounded-full bg-[#f0d9a8] px-5 font-semibold text-[#2a1c0a] shadow-[0_10px_20px_-10px_rgba(0,0,0,0.7)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f0d9a8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#27382f] motion-reduce:transition-none"
          >
            Bake a fresh tray
          </button>
        </div>
      </div>
    </section>
  );
}
