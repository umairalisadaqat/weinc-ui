import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** The word in the slab when the page loads. */
const START_WORD = "SOLID";
/** Longest word the field accepts. */
const MAX_LETTERS = 8;
/** How dry the slab is on load, from 0 (just poured) to 1 (cured). */
const CURE_START = 0.5;
/** Seconds from poured to fully cured. */
const CURE_SECONDS = 34;
/** Concrete colours as red, green, blue: wet, then cured. */
const WET: [number, number, number] = [64, 66, 68];
const DRY: [number, number, number] = [204, 198, 185];
/** The ground around the formwork. */
const GROUND = "#1d1b18";

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

const ease = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

export default function WetConcreteStampedWord() {
  const reduce = useReducedMotion();
  const [word, setWord] = useState(START_WORD);
  const [pour, setPour] = useState(0);
  const [status, setStatus] = useState<"wet" | "cured" | "working">(reduce ? "cured" : "wet");
  const slab = useRef<HTMLDivElement>(null);
  const wetCv = useRef<HTMLCanvasElement>(null);
  const dryCv = useRef<HTMLCanvasElement>(null);
  const trowel = useRef<HTMLDivElement>(null);
  const block = useRef<HTMLDivElement>(null);
  const glint = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const cured = useRef(CURE_START);

  useEffect(() => {
    const el = slab.current, wc = wetCv.current, dc = dryCv.current;
    if (!el || !wc || !dc) return;
    const wctx = wc.getContext("2d"), dctx = dc.getContext("2d");
    if (!wctx || !dctx) return;
    const initial = first.current;
    first.current = false;

    let W = 0, Hh = 0, u = 1;
    let base = new Float32Array(0), grain = new Float32Array(0), patch = new Float32Array(0), fleck = new Float32Array(0);
    let inner = new Float32Array(0), lip = new Float32Array(0), scr = new Float32Array(0), H = new Float32Array(0);
    let stamp = new Uint8Array(0);
    let wetImg: ImageData | null = null, dryImg: ImageData | null = null;
    let boxes: Array<[number, number, number, number]> = [];

    // Light comes low from the top left, so pressed letters fill with shadow on that side.
    const lx = -0.62, ly = -0.66, lz = 0.42;
    const hl = Math.hypot(lx, ly, lz + 1);
    const hx = lx / hl, hy = ly / hl, hz = (lz + 1) / hl;

    const level = (x0: number, y0: number, x1: number, y1: number) => {
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = y * W + x;
          let v = base[i];
          if (stamp[i]) {
            const e = inner[i];
            v += -13 * u * ease((e - 0.2) / 0.6) + 2.4 * u * lip[i] * (1 - e) + (patch[i] - 0.5) * 2 * u * e;
          }
          const s = scr[i];
          if (s > 0) v += (-5.5 * s * s * s + 2.6 * s * (1 - s)) * u;
          H[i] = v;
        }
      }
    };
    const shade = (ax0: number, ay0: number, ax1: number, ay1: number) => {
      if (!wetImg || !dryImg) return;
      const x0 = Math.max(1, Math.floor(ax0)), y0 = Math.max(1, Math.floor(ay0));
      const x1 = Math.min(W - 1, Math.ceil(ax1)), y1 = Math.min(Hh - 1, Math.ceil(ay1));
      if (x1 <= x0 || y1 <= y0) return;
      const wd = wetImg.data, dd = dryImg.data;
      const reach = Math.round(5 * u) * W + Math.round(4.5 * u);
      for (let y = y0; y < y1; y++) {
        const sky = 1 - y / Hh;
        for (let x = x0; x < x1; x++) {
          const i = y * W + x;
          let nx = -(H[i + 1] - H[i - 1]) * 0.75;
          let ny = -(H[i + W] - H[i - W]) * 0.75;
          const nl = Math.hypot(nx, ny, 1);
          nx /= nl;
          ny /= nl;
          const nz = 1 / nl;
          const diff = Math.max(0, nx * lx + ny * ly + nz * lz);
          const nh = Math.max(0, nx * hx + ny * hy + nz * hz);
          const s = scr[i];
          const floor = stamp[i] ? ease((inner[i] - 0.2) / 0.6) : 0;
          // The wall nearest the lamp throws its shadow across the floor of each letter.
          const cast = floor > 0 && i > reach * 3 ? floor * (1 - (ease((inner[i - reach] - 0.2) / 0.6) + ease((inner[i - reach * 2] - 0.2) / 0.6) + ease((inner[i - reach * 3] - 0.2) / 0.6)) / 3) : 0;
          const sunk = Math.min(1, Math.max(floor * 0.3 + cast * 0.95, s * s * 0.55));
          const o = i * 4;
          // Cured: matt, pale, speckled with sand and the odd dark stone.
          const stone = fleck[i] > 0.83 ? -26 * (fleck[i] - 0.83) * 6 : 0;
          const dl = (0.3 + 1.63 * diff) * (1 - 0.5 * sunk);
          const dn = grain[i] * 9 + (patch[i] - 0.5) * 20 + stone;
          dd[o] = Math.min(255, Math.max(0, DRY[0] * dl + dn));
          dd[o + 1] = Math.min(255, Math.max(0, DRY[1] * dl + dn));
          dd[o + 2] = Math.min(255, Math.max(0, DRY[2] * dl + dn * 0.9));
          dd[o + 3] = 255;
          // Wet: dark, with a hard sheen and a little sky in every surface that faces up.
          const wl = (0.28 + 1.37 * diff) * (1 - 0.62 * sunk);
          const spec = Math.pow(nh, 22) * 0.3 + Math.pow(nz, 12) * (0.05 + 0.13 * sky);
          const wn = grain[i] * 5 + (patch[i] - 0.5) * 16;
          wd[o] = Math.min(255, Math.max(0, WET[0] * wl + 235 * spec + wn));
          wd[o + 1] = Math.min(255, Math.max(0, WET[1] * wl + 242 * spec + wn));
          wd[o + 2] = Math.min(255, Math.max(0, WET[2] * wl + 255 * spec + wn));
          wd[o + 3] = 255;
        }
      }
      wctx.putImageData(wetImg, 0, 0, x0, y0, x1 - x0, y1 - y0);
      dctx.putImageData(dryImg, 0, 0, x0, y0, x1 - x0, y1 - y0);
    };
    const rework = (x0: number, y0: number, x1: number, y1: number) => {
      const a = Math.max(0, Math.floor(x0)), b = Math.max(0, Math.floor(y0));
      const c = Math.min(W, Math.ceil(x1)), d = Math.min(Hh, Math.ceil(y1));
      level(a, b, c, d);
      shade(a - 1, b - 1, c + 1, d + 1);
    };

    /** Sizes the canvases, lays the trowelled surface and cuts the word. Returns true if the canvases were reset. */
    const prepare = () => {
      const cw = el.clientWidth, ch = el.clientHeight;
      const nW = Math.max(240, Math.min(1280, Math.round(cw * Math.min(2, window.devicePixelRatio || 1))));
      const nH = Math.max(160, Math.round((nW * ch) / cw));
      const resized = nW !== wc.width || nH !== wc.height;
      W = nW;
      Hh = nH;
      u = W / 1000;
      if (resized) {
        wc.width = dc.width = W;
        wc.height = dc.height = Hh;
      }
      wetImg = wctx.createImageData(W, Hh);
      dryImg = dctx.createImageData(W, Hh);
      const rnd = random(90210);
      const n = W * Hh;
      grain = new Float32Array(n);
      for (let i = 0; i < n; i++) grain[i] = rnd() * 2 - 1;
      patch = blotches(W, Hh, Math.round(90 * u), rnd);
      fleck = blotches(W, Hh, Math.max(2, Math.round(3 * u)), rnd);
      const soft = blotches(W, Hh, Math.round(34 * u), rnd);
      base = new Float32Array(n);
      // The float leaves long overlapping arcs. Three sets, each from a centre well off the slab.
      const arcs = [
        [-0.3 * W, 1.6 * Hh, 13 * u],
        [1.25 * W, 1.9 * Hh, 17 * u],
        [0.4 * W, -1.5 * Hh, 22 * u],
      ];
      for (let y = 0; y < Hh; y++) {
        for (let x = 0; x < W; x++) {
          const i = y * W + x;
          let v = (soft[i] - 0.5) * 0.75 * u;
          for (let k = 0; k < 3; k++) {
            const d = Math.hypot(x - arcs[k][0], y - arcs[k][1]);
            v += Math.sin(d / arcs[k][2]) * 0.3 * u * (k === 0 ? patch[i] : 1 - patch[i] * 0.6);
          }
          base[i] = v;
        }
      }
      // Air holes.
      for (let k = 0; k < Math.round(n / 16000); k++) {
        const px = Math.floor(rnd() * (W - 8)) + 4, py = Math.floor(rnd() * (Hh - 8)) + 4, r = (0.8 + rnd() * 1.2) * u, deep = (1.5 + rnd() * 2.5) * u;
        for (let y = py - 4; y <= py + 4; y++) for (let x = px - 4; x <= px + 4; x++) base[y * W + x] -= deep * Math.exp(-((x - px) ** 2 + (y - py) ** 2) / (r * r));
      }

      // The word, set by hand: each stamp a little off line and a little turned.
      const letters = word.split("");
      const rows = Hh / W > 0.8 && letters.length > 4 ? 2 : 1;
      const perRow = Math.ceil(letters.length / rows);
      const mc = document.createElement("canvas");
      mc.width = W;
      mc.height = Hh;
      const m = mc.getContext("2d", { willReadFrequently: true });
      boxes = [];
      inner = new Float32Array(n);
      lip = new Float32Array(n);
      if (m && letters.length) {
        const face = (px: number) => `900 ${px}px "Arial Black", "Helvetica Neue", Helvetica, Arial, sans-serif`;
        m.font = face(100);
        const widths = letters.map((c) => m.measureText(c).width);
        const track = 7;
        const rowW = (r: number) => widths.slice(r * perRow, (r + 1) * perRow).reduce((a, b) => a + b + track, -track);
        const widest = Math.max(1, rowW(0), rows > 1 ? rowW(1) : 0);
        const fs = Math.min(((W * 0.8) / widest) * 100, ((rows > 1 ? 0.3 : 0.52) * Hh) / 0.72);
        const k = fs / 100;
        m.font = face(fs);
        m.fillStyle = "#fff";
        m.textBaseline = "alphabetic";
        m.textAlign = "center";
        const lineH = fs * 0.92;
        const jit = random(word.length * 131 + (word.charCodeAt(0) || 1) * 17);
        for (let r = 0; r < rows; r++) {
          let x = W / 2 - (rowW(r) * k) / 2;
          const baseY = Hh * 0.5 + fs * 0.36 - ((rows - 1) * lineH) / 2 + r * lineH;
          letters.slice(r * perRow, (r + 1) * perRow).forEach((c, j) => {
            const wdt = widths[r * perRow + j] * k;
            const cx = x + wdt / 2, cy = baseY - fs * 0.36 + (jit() - 0.5) * fs * 0.05;
            m.save();
            m.translate(cx, cy);
            m.rotate((jit() - 0.5) * 0.07);
            m.fillText(c, 0, fs * 0.36);
            m.restore();
            const mg = 16 * u;
            boxes.push([cx - wdt / 2 - mg, cy - fs * 0.42 - mg, cx + wdt / 2 + mg, cy + fs * 0.42 + mg]);
            x += wdt + track * k;
          });
        }
        const px = m.getImageData(0, 0, W, Hh).data;
        const hard = new Float32Array(n);
        for (let i = 0; i < n; i++) hard[i] = px[i * 4 + 3] / 255;
        inner = boxBlur(hard, W, Hh, Math.max(1, Math.round(1.6 * u)));
        lip = boxBlur(hard, W, Hh, Math.max(2, Math.round(6 * u)));
      }
      scr = new Float32Array(n);
      stamp = new Uint8Array(n);
      H = new Float32Array(n);
      return resized;
    };
    const everything = () => {
      stamp.fill(1);
      level(0, 0, W, Hh);
      shade(0, 0, W, Hh);
    };

    let cure = reduce ? 1 : initial ? CURE_START : cured.current;
    let shown = -1;
    let said: "wet" | "cured" | "working" | "" = "";
    const say = (s: "wet" | "cured" | "working") => {
      if (s !== said) {
        said = s;
        setStatus(s);
      }
    };
    const dry = (force?: boolean) => {
      cured.current = cure;
      if (!force && Math.abs(cure - shown) < 0.004) return;
      shown = cure;
      // It dries from the edges in, so the dry picture is revealed through a closing ring.
      const edge = (1 - ease(cure)) * 118;
      const core = Math.pow(cure, 3);
      const mask = cure >= 1 ? "none" : `radial-gradient(125% 125% at 47% 56%, rgba(0,0,0,${core.toFixed(3)}) ${Math.max(0, edge - 34).toFixed(1)}%, #000 ${edge.toFixed(1)}%)`;
      dc.style.setProperty("-webkit-mask-image", mask);
      dc.style.setProperty("mask-image", mask);
      dc.style.opacity = cure <= 0 ? "0" : "1";
      if (glint.current) glint.current.style.opacity = String(Math.max(0, 1 - cure * 1.5));
    };

    // The job list: trowel across, then press each letter, then leave it to cure.
    type Mode = "idle" | "wipe" | "stamp";
    let mode: Mode = "idle";
    let t = 0, wiped = 0, next = 0;
    const WIPE = 1.5, GAP = 0.36;

    const resized = prepare();
    if (initial || reduce || resized) {
      everything();
      say(cure >= 1 ? "cured" : "wet");
    } else {
      mode = "wipe";
      level(0, 0, W, Hh);
      say("working");
    }
    dry(true);

    const press = (k: number) => {
      const b = boxes[k];
      if (!b) return;
      const x0 = Math.max(0, Math.floor(b[0])), y0 = Math.max(0, Math.floor(b[1])), x1 = Math.min(W, Math.ceil(b[2])), y1 = Math.min(Hh, Math.ceil(b[3]));
      for (let y = y0; y < y1; y++) stamp.fill(1, y * W + x0, y * W + x1);
      rework(x0, y0, x1, y1);
    };
    const showBlock = (k: number) => {
      const b = boxes[k], node = block.current;
      if (!b || !node || !node.animate) return;
      const s = el.clientWidth / W;
      node.style.left = `${(b[0] + 8 * u) * s}px`;
      node.style.top = `${(b[1] + 8 * u) * s}px`;
      node.style.width = `${(b[2] - b[0] - 16 * u) * s}px`;
      node.style.height = `${(b[3] - b[1] - 16 * u) * s}px`;
      node.animate(
        [
          { opacity: 0, transform: "scale(1.22) rotate(-2deg)", boxShadow: "30px 40px 40px rgba(0,0,0,0.35)" },
          { opacity: 1, transform: "scale(1) rotate(0deg)", boxShadow: "2px 3px 4px rgba(0,0,0,0.6)", offset: 0.38 },
          { opacity: 1, transform: "scale(1) rotate(0deg)", boxShadow: "2px 3px 4px rgba(0,0,0,0.6)", offset: 0.55 },
          { opacity: 0, transform: "scale(1.26) rotate(1.5deg)", boxShadow: "34px 44px 44px rgba(0,0,0,0.3)" },
        ],
        { duration: 520, easing: "ease-in-out" },
      );
    };

    let raf = 0, last = 0, visible = true;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
      last = now;
      if (mode === "wipe") {
        t += dt;
        // Fresh mix goes down dark, so the dry picture fades as the float starts across.
        cure = Math.max(0, cure - dt * 2.4);
        const p = ease(t / WIPE);
        const x = -0.16 * W + p * 1.32 * W;
        const upTo = Math.min(W, Math.max(0, Math.floor(x)));
        if (upTo > wiped) {
          level(wiped, 0, upTo, Hh);
          shade(wiped - 1, 0, upTo, Hh);
          wiped = upTo;
        }
        if (trowel.current) {
          const s = el.clientWidth / W;
          trowel.current.style.opacity = t < 0.12 ? String(t / 0.12) : t > WIPE - 0.15 ? String(Math.max(0, (WIPE - t) / 0.15)) : "1";
          trowel.current.style.transform = `translate3d(${x * s}px, ${Math.sin(p * 3.1416) * -10}px, 0) rotate(${-7 + p * 5}deg)`;
        }
        if (t >= WIPE) {
          mode = "stamp";
          t = 0;
          next = 0;
          cure = 0;
          if (trowel.current) trowel.current.style.opacity = "0";
        }
      } else if (mode === "stamp") {
        t += dt;
        while (next < boxes.length * 2 && t >= Math.floor(next / 2) * GAP + (next % 2 ? 0.2 : 0)) {
          if (next % 2) press((next - 1) / 2);
          else showBlock(next / 2);
          next++;
        }
        if (next >= boxes.length * 2 && t > (boxes.length - 1) * GAP + 0.6) {
          mode = "idle";
          say("wet");
        }
      } else if (cure < 1) {
        cure = Math.min(1, cure + dt / CURE_SECONDS);
        say(cure > 0.8 ? "cured" : "wet");
      }
      dry();
    };
    const wake = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      if (visible && !document.hidden && !reduce) {
        last = 0;
        raf = requestAnimationFrame(loop);
      }
    };

    // A finger in wet concrete.
    let drawing = false, px = 0, py = 0;
    const at = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * Hh];
    };
    const drag = (x: number, y: number) => {
      const r = 10 * u;
      const pad = r * 2.6;
      const x0 = Math.max(0, Math.floor(Math.min(px, x) - pad)), x1 = Math.min(W, Math.ceil(Math.max(px, x) + pad));
      const y0 = Math.max(0, Math.floor(Math.min(py, y) - pad)), y1 = Math.min(Hh, Math.ceil(Math.max(py, y) + pad));
      const dx = x - px, dy = y - py;
      const len = dx * dx + dy * dy || 1;
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = x0; xx < x1; xx++) {
          // Distance from this pixel to the stroke just made.
          const k = Math.min(1, Math.max(0, ((xx - px) * dx + (yy - py) * dy) / len));
          const ox = xx - (px + dx * k), oy = yy - (py + dy * k);
          const v = Math.exp(-(ox * ox + oy * oy) / (r * r));
          const i = yy * W + xx;
          if (v > 0.01 && v > scr[i]) scr[i] = v;
        }
      }
      rework(x0, y0, x1, y1);
      px = x;
      py = y;
    };
    const down = (e: PointerEvent) => {
      if (mode !== "idle" || cure > 0.8) return;
      drawing = true;
      [px, py] = at(e);
      drag(px + 0.01, py);
    };
    const move = (e: PointerEvent) => {
      if (!drawing) return;
      const [x, y] = at(e);
      drag(x, y);
    };
    const up = () => {
      drawing = false;
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);

    let settle = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        const cw = el.clientWidth;
        const nW = Math.max(240, Math.min(1280, Math.round(cw * Math.min(2, window.devicePixelRatio || 1))));
        const nH = Math.max(160, Math.round((nW * el.clientHeight) / cw));
        if (nW === W && nH === Hh) return;
        prepare();
        mode = "idle";
        if (trowel.current) trowel.current.style.opacity = "0";
        everything();
        dry(true);
      }, 160);
    });
    ro.observe(el);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      wake();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", wake);
    wake();
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", wake);
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [word, pour, reduce]);

  const board = "repeating-linear-gradient(90deg, rgba(92,58,22,0) 0px, rgba(92,58,22,0.13) 1px, rgba(92,58,22,0) 3px, rgba(92,58,22,0) 11px, rgba(92,58,22,0.09) 12px, rgba(92,58,22,0) 17px), linear-gradient(180deg, #e2c08c 0%, #cfa568 45%, #b98d52 100%)";
  const post = "repeating-linear-gradient(0deg, rgba(92,58,22,0) 0px, rgba(92,58,22,0.13) 1px, rgba(92,58,22,0) 3px, rgba(92,58,22,0) 13px, rgba(92,58,22,0.09) 14px, rgba(92,58,22,0) 19px), linear-gradient(90deg, #dcb983 0%, #c99f62 50%, #b3874d 100%)";

  return (
    <section className="relative isolate flex min-h-[680px] w-full flex-col items-center overflow-hidden px-4 pt-12 sm:px-8" style={{ backgroundColor: GROUND }}>
      <style>{`
        @keyframes word-stamped-into-wet-concrete-glint { from { transform: translate3d(-70%, 0, 0); } to { transform: translate3d(70%, 0, 0); } }
        .word-stamped-into-wet-concrete-glint { animation: word-stamped-into-wet-concrete-glint 9s ease-in-out infinite alternate; }
        @media (prefers-reduced-motion: reduce) { .word-stamped-into-wet-concrete-glint { animation: none; opacity: 0; } }
      `}</style>
      <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: "radial-gradient(80% 60% at 35% 25%, rgba(255,240,215,0.1) 0%, rgba(255,240,215,0) 65%), linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,0.35) 100%)" }} />

      <h2 className="sr-only">{word}</h2>

      {/* Timber formwork round the pour. */}
      <div className="relative w-full max-w-[1080px] p-[18px] sm:p-[22px]" style={{ filter: "drop-shadow(0 34px 30px rgba(0,0,0,0.55))" }}>
        <div aria-hidden="true" className="absolute inset-y-0 left-0 w-[18px] rounded-[3px] sm:w-[22px]" style={{ background: post, boxShadow: "inset 1px 0 0 rgba(255,255,255,0.35), inset -1px 0 0 rgba(60,36,10,0.5)" }} />
        <div aria-hidden="true" className="absolute inset-y-0 right-0 w-[18px] rounded-[3px] sm:w-[22px]" style={{ background: post, boxShadow: "inset 1px 0 0 rgba(255,255,255,0.35), inset -1px 0 0 rgba(60,36,10,0.5)" }} />
        <div aria-hidden="true" className="absolute inset-x-[18px] top-0 h-[18px] sm:inset-x-[22px] sm:h-[22px]" style={{ background: board, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(60,36,10,0.5)" }} />
        <div aria-hidden="true" className="absolute inset-x-[18px] bottom-0 h-[18px] sm:inset-x-[22px] sm:h-[22px]" style={{ background: board, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(60,36,10,0.5)" }} />
        {["left-[5px] top-[5px]", "right-[5px] top-[5px]", "left-[5px] bottom-[5px]", "right-[5px] bottom-[5px]"].map((p) => (
          <span key={p} aria-hidden="true" className={`absolute ${p} h-[8px] w-[8px] rounded-full sm:h-[10px] sm:w-[10px]`} style={{ background: "radial-gradient(circle at 35% 30%, #f1f3f4 0%, #8b9094 55%, #3d4144 100%)", boxShadow: "1px 1.5px 1.5px rgba(40,24,6,0.6)" }} />
        ))}

        <div ref={slab} className="relative h-[450px] w-full touch-pan-y select-none overflow-hidden sm:h-[420px]" style={{ backgroundColor: "#5c5e5f", cursor: status === "wet" ? "crosshair" : "default" }}>
          <canvas ref={wetCv} aria-hidden="true" className="absolute inset-0 h-full w-full" />
          <canvas ref={dryCv} aria-hidden="true" className="absolute inset-0 h-full w-full" />
          <div ref={glint} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden" style={{ mixBlendMode: "screen" }}>
            <div className="word-stamped-into-wet-concrete-glint absolute inset-y-0 left-0 w-full" style={{ background: "linear-gradient(104deg, rgba(210,225,240,0) 34%, rgba(210,225,240,0.12) 44%, rgba(235,244,255,0.2) 50%, rgba(210,225,240,0.12) 56%, rgba(210,225,240,0) 66%)" }} />
          </div>
          {/* The boards stand proud of the pour and shade its top and left edges. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ boxShadow: "inset 9px 10px 12px -4px rgba(0,0,0,0.55), inset -2px -2px 3px rgba(255,255,255,0.12)" }} />
          <div ref={block} aria-hidden="true" className="pointer-events-none absolute rounded-[5px] opacity-0" style={{ background: post }}>
            <span className="absolute left-1/2 top-1/2 h-[34%] w-[26%] -translate-x-1/2 -translate-y-1/2 rounded-[4px]" style={{ background: "linear-gradient(135deg, #8a5a2b 0%, #5e3a17 100%)", boxShadow: "3px 5px 6px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.25)" }} />
          </div>
          <div ref={trowel} aria-hidden="true" className="pointer-events-none absolute left-[-120px] top-[9%] h-[82%] w-[120px] opacity-0">
            <div className="absolute inset-0 rounded-[7px]" style={{ background: "linear-gradient(90deg, #6f7679 0%, #dfe4e6 14%, #aeb5b8 40%, #eef1f2 62%, #8d9497 100%)", boxShadow: "16px 20px 22px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.35)" }} />
            <div className="absolute left-1/2 top-[18%] h-[64%] w-[30px] -translate-x-1/2 rounded-[14px]" style={{ background: "linear-gradient(90deg, #5a3413 0%, #a56a30 35%, #c98a48 50%, #8a5424 80%, #4d2c10 100%)", boxShadow: "8px 10px 10px rgba(0,0,0,0.4)" }} />
          </div>
        </div>
      </div>

      <div className="relative mt-auto flex w-full max-w-[1080px] flex-wrap items-center justify-between gap-x-6 gap-y-3 pb-8 pt-7 text-[13px]">
        <p className="text-[#cfc9bf]" aria-live="polite">
          <span className="font-semibold text-white">Stamped concrete</span>
          <span className="mx-2 opacity-50">/</span>
          {status === "working" ? "floating it off and stamping" : status === "wet" ? "still wet, drag a finger through it" : "cured, pour again to change it"}
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor="word-stamped-into-wet-concrete-word" className="sr-only">
            Word to stamp into the concrete
          </label>
          <input
            id="word-stamped-into-wet-concrete-word"
            value={word}
            maxLength={MAX_LETTERS}
            onChange={(e) => setWord(e.target.value.toUpperCase().replace(/[^A-Z0-9!?&]/g, "").slice(0, MAX_LETTERS))}
            autoComplete="off"
            spellCheck={false}
            className="h-11 w-[150px] rounded-[6px] border border-white/25 bg-[#12110f] px-4 text-[14px] font-semibold tracking-[0.18em] text-white outline-none focus-visible:ring-2 focus-visible:ring-[#f2b632]"
          />
          <button
            type="button"
            onClick={() => setPour((n) => n + 1)}
            className="h-11 shrink-0 rounded-[6px] bg-[#f2b632] px-5 font-semibold text-[#1d1b18] shadow-[0_10px_20px_-10px_rgba(0,0,0,0.8)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f2b632] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1d1b18] motion-reduce:transition-none"
          >
            Pour again
          </button>
        </div>
      </div>
    </section>
  );
}
