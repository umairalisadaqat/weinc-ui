import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** The word on the door when the page loads. */
const START_WORD = "SUNDAY";
/** Longest word the field accepts. */
const MAX_LETTERS = 8;
/** Plastic colours, used in order and repeated. */
const COLOURS = ["#e23a2e", "#f6b40c", "#1d6fd8", "#2c9d55", "#f26c1d", "#8a43c6"];
/** The enamel of the door. */
const DOOR = "#edf0ea";
/** Seconds a letter stays where it was dropped before it slides home. */
const HOLD = 1.4;

/** Height of a capital in the baked sprite, in pixels. The sprite is scaled down to fit the stage. */
const CAP = 220;
const PAD = 30;
const DEPTH = 13;

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

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/**
 * Moulds one letter: the glyph is fattened with a round stroke, blurred into a
 * height (a rounded shoulder plus a slight dome), lit from the top left as
 * glossy plastic and given a darker side wall underneath.
 */
function mould(target: HTMLCanvasElement, ch: string, colour: string) {
  const face = `900 ${Math.round(CAP / 0.72)}px "Arial Rounded MT Bold", "Helvetica Neue", Helvetica, Arial, sans-serif`;
  const probe = document.createElement("canvas").getContext("2d");
  if (!probe) return null;
  probe.font = face;
  const m = probe.measureText(ch);
  const left = Math.ceil(m.actualBoundingBoxLeft);
  const bw = Math.max(40, Math.ceil(m.actualBoundingBoxLeft + m.actualBoundingBoxRight));
  const asc = Math.ceil(m.actualBoundingBoxAscent);
  const bh = Math.max(40, Math.ceil(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent));
  const w = bw + PAD * 2;
  const h = bh + PAD * 2 + DEPTH;

  const mask = document.createElement("canvas");
  mask.width = w;
  mask.height = h;
  const mc = mask.getContext("2d", { willReadFrequently: true });
  if (!mc) return null;
  mc.font = face;
  mc.fillStyle = "#fff";
  mc.strokeStyle = "#fff";
  mc.lineJoin = "round";
  mc.lineWidth = CAP * 0.075;
  mc.strokeText(ch, PAD + left, PAD + asc);
  mc.fillText(ch, PAD + left, PAD + asc);
  const px = mc.getImageData(0, 0, w, h);
  const a = new Float32Array(w * h);
  for (let i = 0; i < a.length; i++) a[i] = px.data[i * 4 + 3] / 255;

  const edge = boxBlur(a, w, h, 6);
  const dome = boxBlur(a, w, h, 24);
  const hgt = new Float32Array(w * h);
  for (let i = 0; i < hgt.length; i++) {
    const t = Math.min(1, Math.max(0, (edge[i] - 0.5) * 2.3));
    hgt[i] = Math.sqrt(1 - (1 - t) * (1 - t)) * 11 + dome[i] * 7;
  }

  const [cr, cg, cb] = hexToRgb(colour);
  // Light from the top left, a little in front of the door.
  const lx = -0.5, ly = -0.62, lz = 0.6;
  const hl = Math.hypot(lx, ly, lz + 1);
  const hx = lx / hl, hy = ly / hl, hz = (lz + 1) / hl;
  const out = mc.createImageData(w, h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (a[i] <= 0) continue;
      let nx = -(hgt[i + 1] - hgt[i - 1]) * 0.85;
      let ny = -(hgt[i + w] - hgt[i - w]) * 0.85;
      const nl = Math.hypot(nx, ny, 1);
      nx /= nl;
      ny /= nl;
      const nz = 1 / nl;
      const diff = Math.max(0, nx * lx + ny * ly + nz * lz);
      const nh = Math.max(0, nx * hx + ny * hy + nz * hz);
      const spec = Math.pow(nh, 46) * 0.9 + Math.pow(nh, 9) * 0.1;
      const fill = Math.pow(Math.max(0, nx * 0.6 + ny * 0.52 + nz * 0.6), 5) * 0.16;
      // A soft window in the gloss: brighter towards the top of the letter.
      const sky = 0.1 * (1 - (y - PAD) / bh);
      const shade = 0.36 + 1.02 * diff + sky;
      const o = i * 4;
      out.data[o] = Math.min(255, cr * shade + 255 * (spec + fill));
      out.data[o + 1] = Math.min(255, cg * shade + 255 * (spec + fill));
      out.data[o + 2] = Math.min(255, cb * shade + 255 * (spec + fill));
      out.data[o + 3] = a[i] * 255;
    }
  }
  mc.putImageData(out, 0, 0);

  // The side wall: the same outline in a darker plastic, stacked downwards.
  const wall = document.createElement("canvas");
  wall.width = w;
  wall.height = h;
  const wc = wall.getContext("2d");
  target.width = w;
  target.height = h;
  const tc = target.getContext("2d");
  if (!wc || !tc) return null;
  for (let d = DEPTH; d >= 1; d--) {
    const k = 0.4 + 0.12 * (1 - d / DEPTH);
    wc.globalCompositeOperation = "source-over";
    wc.clearRect(0, 0, w, h);
    wc.drawImage(mask, 0, 0);
    wc.globalCompositeOperation = "source-in";
    wc.fillStyle = `rgb(${Math.round(cr * k)},${Math.round(cg * k)},${Math.round(cb * k)})`;
    wc.fillRect(0, 0, w, h);
    tc.drawImage(wall, 0, d);
  }
  tc.drawImage(mask, 0, 0);
  return { w, h, bw };
}

type Body = {
  el: HTMLButtonElement;
  w: number;
  h: number;
  bw: number;
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  vr: number;
  hx: number;
  hy: number;
  hr: number;
  held: boolean;
  free: number;
  wait: number;
  gx: number;
  gy: number;
  tx: number;
  ty: number;
  seed: number;
};

export default function MagneticFridgeLetters() {
  const reduce = useReducedMotion();
  const [word, setWord] = useState(START_WORD);
  const stage = useRef<HTMLDivElement>(null);
  const first = useRef(true);
  const scatter = useRef<() => void>(() => {});
  const letters = word.split("");

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const initial = first.current;
    first.current = false;
    const buttons = Array.from(el.querySelectorAll<HTMLButtonElement>("[data-magnet]"));
    const list: Body[] = [];
    buttons.forEach((b, i) => {
      const cv = b.querySelector("canvas");
      const ch = b.dataset.magnet || "";
      const size = cv ? mould(cv, ch, COLOURS[i % COLOURS.length]) : null;
      if (!size) return;
      const s = Math.sin((i + 1) * 12.9898 + ch.charCodeAt(0) * 78.233) * 43758.5453;
      list.push({ el: b, ...size, x: 0, y: 0, r: 0, vx: 0, vy: 0, vr: 0, hx: 0, hy: 0, hr: 0, held: false, free: 0, wait: 0, gx: 0, gy: 0, tx: 0, ty: 0, seed: s - Math.floor(s) });
    });

    let W = 0, H = 0, scale = 1;
    const layout = () => {
      W = el.clientWidth;
      H = el.clientHeight;
      const rows = W < 560 && list.length > 4 ? 2 : 1;
      const perRow = Math.ceil(list.length / rows);
      const gap = CAP * 0.19;
      const rowWidth = (r: number) => list.slice(r * perRow, (r + 1) * perRow).reduce((sum, b) => sum + b.bw + gap, -gap);
      const widest = Math.max(1, rowWidth(0), rows > 1 ? rowWidth(1) : 0);
      scale = Math.min((W * 0.8) / widest, (H * (rows > 1 ? 0.2 : 0.37)) / CAP, 1.15);
      const lineH = CAP * 1.22 * scale;
      const top = H * 0.44 - ((rows - 1) * lineH) / 2;
      for (let r = 0; r < rows; r++) {
        let x = W / 2 - (rowWidth(r) * scale) / 2;
        list.slice(r * perRow, (r + 1) * perRow).forEach((b) => {
          b.hx = x + (b.bw * scale) / 2;
          b.hy = top + r * lineH + (b.seed - 0.5) * 16 * scale;
          b.hr = (((b.seed * 7.31) % 1) - 0.5) * 0.2;
          x += (b.bw + gap) * scale;
          b.el.style.width = `${b.w * scale}px`;
          b.el.style.height = `${b.h * scale}px`;
        });
      }
    };
    const place = (b: Body) => {
      b.el.style.transform = `translate3d(${b.x - (b.w * scale) / 2}px, ${b.y - (b.h * scale) / 2}px, 0) rotate(${b.r}rad) scale(${b.held ? 1.06 : 1})`;
    };
    layout();
    list.forEach((b, i) => {
      b.x = b.hx;
      b.y = b.hy;
      b.r = b.hr;
      if (!initial && !reduce) {
        // A new word is slapped on from above, one letter after another.
        b.y = -b.h * scale;
        b.r = b.hr + (b.seed - 0.5) * 1.2;
        b.wait = i * 0.07;
      }
      place(b);
      b.el.style.opacity = "1";
    });

    let quiet = 0;
    let top = 10;
    const cleanups: Array<() => void> = [];
    list.forEach((b) => {
      const at = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        return [e.clientX - r.left, e.clientY - r.top];
      };
      const down = (e: PointerEvent) => {
        const [x, y] = at(e);
        b.held = true;
        b.wait = 0;
        b.gx = b.x - x;
        b.gy = b.y - y;
        b.tx = b.x;
        b.ty = b.y;
        b.el.dataset.held = "1";
        b.el.style.zIndex = String(++top);
        b.el.setPointerCapture(e.pointerId);
        quiet = 8;
      };
      const move = (e: PointerEvent) => {
        if (!b.held) return;
        const [x, y] = at(e);
        b.tx = x + b.gx;
        b.ty = y + b.gy;
      };
      const up = () => {
        if (!b.held) return;
        b.held = false;
        b.free = HOLD;
        delete b.el.dataset.held;
        if (reduce) {
          b.vx = 0;
          b.vy = 0;
        }
        quiet = 8;
      };
      const key = (e: KeyboardEvent) => {
        const step = 28;
        const d: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
        if (d[e.key]) {
          e.preventDefault();
          b.x += d[e.key][0];
          b.y += d[e.key][1];
          b.vx = 0;
          b.vy = 0;
          b.free = HOLD;
          quiet = 8;
        }
      };
      const flick = () => {
        if (b.free > 0 || reduce) return;
        b.vx = (b.seed - 0.5) * 900;
        b.vy = 380 + b.seed * 260;
        b.vr = (b.seed - 0.5) * 9;
        b.free = HOLD;
        quiet = 8;
      };
      b.el.addEventListener("pointerdown", down);
      b.el.addEventListener("pointermove", move);
      b.el.addEventListener("pointerup", up);
      b.el.addEventListener("pointercancel", up);
      b.el.addEventListener("keydown", key);
      b.el.addEventListener("click", flick);
      cleanups.push(() => {
        b.el.removeEventListener("pointerdown", down);
        b.el.removeEventListener("pointermove", move);
        b.el.removeEventListener("pointerup", up);
        b.el.removeEventListener("pointercancel", up);
        b.el.removeEventListener("keydown", key);
        b.el.removeEventListener("click", flick);
      });
    });

    const shove = (b: Body, power: number) => {
      const a = b.seed * 6.283 + clock * 1.7;
      b.vx = Math.cos(a) * power;
      b.vy = Math.abs(Math.sin(a)) * power * 0.8 + power * 0.25;
      b.vr = (((b.seed * 3.7) % 1) - 0.5) * 10;
      b.free = HOLD * 0.75;
    };
    let clock = 0;
    scatter.current = () => {
      quiet = 5;
      list.forEach((b) => !b.held && shove(b, reduce ? 0 : 620 + b.seed * 500));
    };

    let raf = 0, last = 0, visible = true, rippled = !initial, nextDemo = 3.5, turn = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.033, last ? (now - last) / 1000 : 0.016);
      last = now;
      clock += dt;
      quiet -= dt;
      if (!reduce) {
        if (!rippled && clock > 0.9) {
          // A knock on the door: every letter rocks once and settles.
          rippled = true;
          list.forEach((b, i) => (b.vr += (i % 2 ? 1 : -1) * (1.6 + b.seed)));
        }
        if (clock > nextDemo && quiet <= 0 && list.length) {
          nextDemo = clock + 3.6;
          const b = list[(turn = (turn + 1 + Math.floor(list.length / 2)) % list.length)];
          if (!b.held && b.free <= 0) shove(b, 520 * Math.max(0.5, scale));
        }
      }
      for (const b of list) {
        if (b.wait > 0) {
          b.wait -= dt;
          continue;
        }
        if (b.held) {
          const nx = b.x + (b.tx - b.x) * Math.min(1, dt * 28);
          const ny = b.y + (b.ty - b.y) * Math.min(1, dt * 28);
          b.vx = (nx - b.x) / dt;
          b.vy = (ny - b.y) / dt;
          b.x = nx;
          b.y = ny;
          const lean = Math.max(-0.4, Math.min(0.4, b.vx * 0.0005));
          b.r += (b.hr + lean - b.r) * Math.min(1, dt * 12);
        } else if (b.free > 0) {
          // Let go: it skids on the enamel and stops, as a magnet does.
          const drag = Math.exp(-7 * dt);
          b.vx *= drag;
          b.vy *= drag;
          b.vr *= drag;
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.r += b.vr * dt;
          b.free -= dt;
          if (b.free <= 0 && reduce) {
            b.x = b.hx;
            b.y = b.hy;
            b.r = b.hr;
          }
        } else {
          b.vx += ((b.hx - b.x) * 95 - b.vx * 13) * dt;
          b.vy += ((b.hy - b.y) * 95 - b.vy * 13) * dt;
          b.vr += ((b.hr - b.r) * 120 - b.vr * 9) * dt;
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.r += b.vr * dt;
        }
        if (b.wait <= 0 && (b.held || b.free > 0)) {
          const mx = (b.bw * scale) / 2, my = (CAP * scale) / 2;
          if (b.x < mx) { b.x = mx; b.vx = Math.abs(b.vx) * 0.4; }
          if (b.x > W - mx) { b.x = W - mx; b.vx = -Math.abs(b.vx) * 0.4; }
          if (b.y < my) { b.y = my; b.vy = Math.abs(b.vy) * 0.4; }
          if (b.y > H - my - 84) { b.y = H - my - 84; b.vy = -Math.abs(b.vy) * 0.4; }
        }
        place(b);
      }
    };
    const wake = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      if (visible && !document.hidden) {
        last = 0;
        raf = requestAnimationFrame(loop);
      }
    };
    const ro = new ResizeObserver(() => {
      layout();
      list.forEach((b) => {
        if (!b.held && b.free <= 0 && b.wait <= 0) {
          b.x = b.hx;
          b.y = b.hy;
        }
        place(b);
      });
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
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", wake);
      cleanups.forEach((fn) => fn());
    };
  }, [word, reduce]);

  return (
    <section className="relative isolate flex min-h-[680px] w-full flex-col overflow-hidden" style={{ backgroundColor: DOOR }}>
      <style>{`
        .magnetic-fridge-letters-m { position: absolute; left: 0; top: 0; opacity: 0; touch-action: none; cursor: grab; border-radius: 18px; will-change: transform; -webkit-tap-highlight-color: transparent; }
        .magnetic-fridge-letters-m canvas { display: block; width: 100%; height: 100%; pointer-events: none; filter: drop-shadow(0 2px 1.5px rgba(38,48,40,0.42)) drop-shadow(3px 9px 9px rgba(38,48,40,0.2)); transition: filter 160ms ease-out; }
        .magnetic-fridge-letters-m[data-held="1"] { cursor: grabbing; }
        .magnetic-fridge-letters-m[data-held="1"] canvas { filter: drop-shadow(0 4px 3px rgba(38,48,40,0.3)) drop-shadow(10px 26px 20px rgba(38,48,40,0.24)); }
        @media (prefers-reduced-motion: reduce) { .magnetic-fridge-letters-m canvas { transition: none; } }
      `}</style>

      {/* The door: enamel sheen, the reflection of a window, the gap under the freezer door and a handle. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(101deg, rgba(255,255,255,0) 18%, rgba(255,255,255,0.75) 27%, rgba(255,255,255,0.2) 33%, rgba(255,255,255,0.6) 36%, rgba(255,255,255,0) 46%), radial-gradient(120% 90% at 30% 20%, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0) 60%), linear-gradient(180deg, rgba(120,135,120,0) 50%, rgba(120,135,120,0.2) 100%)",
        }}
      />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-[58px]" style={{ background: "linear-gradient(180deg, #dfe3dc 0%, #eef1eb 70%, #f7f8f5 100%)" }} />
      <div aria-hidden="true" className="absolute inset-x-0 top-[58px] -z-10 h-[9px]" style={{ background: "linear-gradient(180deg, #7d857c 0%, #262b27 35%, #1a1e1b 70%, #5d655d 100%)", boxShadow: "0 1px 0 rgba(255,255,255,0.9), 0 10px 18px rgba(60,72,62,0.16)" }} />
      <div aria-hidden="true" className="absolute left-7 top-[104px] -z-10 hidden h-[300px] w-[18px] rounded-full lg:block" style={{ background: "linear-gradient(90deg, #8d948f 0%, #f4f6f4 28%, #c9cecb 46%, #7c837e 72%, #b9bfbb 100%)", boxShadow: "8px 10px 14px rgba(50,60,52,0.28), 1px 0 0 rgba(255,255,255,0.6) inset" }} />

      <h2 className="sr-only">{word}</h2>
      <div ref={stage} aria-hidden={letters.length ? undefined : true} className="absolute inset-0 touch-pan-y">
        {letters.map((ch, i) => (
          <button
            key={`${word}-${i}`}
            type="button"
            data-magnet={ch}
            aria-label={`Magnet ${i + 1} of ${letters.length}, letter ${ch}. Arrow keys slide it, Enter flicks it.`}
            className="magnetic-fridge-letters-m focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-4 focus-visible:ring-offset-[#edf0ea]"
          >
            <canvas aria-hidden="true" />
          </button>
        ))}
      </div>

      <div className="pointer-events-none relative mx-auto mt-auto flex w-full max-w-[920px] flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 pb-8 text-[13px]">
        <p className="text-slate-600">
          <span className="font-semibold text-slate-900">Fridge letters</span>
          <span className="mx-2 opacity-50">/</span>
          drag one off, let go, and it slides home
        </p>
        <div className="pointer-events-auto flex items-center gap-2">
          <label htmlFor="magnetic-fridge-letters-word" className="sr-only">
            Word to spell on the fridge
          </label>
          <input
            id="magnetic-fridge-letters-word"
            value={word}
            maxLength={MAX_LETTERS}
            onChange={(e) => setWord(e.target.value.toUpperCase().replace(/[^A-Z0-9!?&]/g, "").slice(0, MAX_LETTERS))}
            autoComplete="off"
            spellCheck={false}
            className="h-11 w-[150px] rounded-full border border-slate-300 bg-white px-4 text-[14px] font-semibold tracking-[0.18em] text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.08)] outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
          />
          <button
            type="button"
            onClick={() => scatter.current()}
            className="h-11 shrink-0 rounded-full bg-slate-900 px-5 font-medium text-white shadow-[0_10px_20px_-10px_rgba(15,23,42,0.7)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus-visible:ring-offset-[#edf0ea] motion-reduce:transition-none"
          >
            Knock them off
          </button>
        </div>
      </div>
    </section>
  );
}
