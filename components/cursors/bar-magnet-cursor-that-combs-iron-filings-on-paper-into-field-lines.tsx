import { useEffect, useRef } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { useReducedMotion } from "framer-motion";

/** One filing for roughly this many square pixels of paper. Lower is denser and slower. */
const AREA_PER_FILING = 58;
const MAX_FILINGS = 7000;
/** How many field lines leave the magnet. The filings bunch onto them near the poles. */
const LINES = 40;
/** How far the field combs the filings straight. Raise it and the whole sheet lines up. */
const REACH = 240;
const INK = ["#17171b", "#3d3d45"];
const PAPER_GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.35 0 0 0 0 0.32 0 0 0 0 0.28 0 0 0 0.09 0'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)'/%3E%3C/svg%3E\")";

export default function BarMagnetCursorThatCombsIronFilingsOnPaperIntoFieldLines() {
  const reduce = useReducedMotion();
  const sheet = useRef<HTMLButtonElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  /** Where the magnet is being led (0 to 1 each way), when a person last led it, and quarter turns still owed. */
  const aim = useRef({ x: 0.62, y: 0.46, at: -1e6, spin: 0 });

  useEffect(() => {
    const el = sheet.current;
    const cv = canvas.current;
    if (!el || !cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    let W = 1;
    let H = 1;
    let ratio = 1;
    let n = 0;
    let hx = new Float32Array(0);
    let hy = new Float32Array(0);
    let px = new Float32Array(0);
    let py = new Float32Array(0);
    let vx = new Float32Array(0);
    let vy = new Float32Array(0);
    let dx = new Float32Array(0);
    let dy = new Float32Array(0);
    let ox = new Float32Array(0);
    let oy = new Float32Array(0);
    let len = new Float32Array(0);
    let quick = new Float32Array(0);
    // The magnet: position, speed, heading and length, in pixels of the sheet.
    const mag = { x: 0, y: 0, vx: 0, vy: 0, phi: -0.5, len: 96 };
    let placed = false;

    const scatter = () => {
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      W = el.clientWidth;
      H = el.clientHeight;
      cv.width = Math.round(W * ratio);
      cv.height = Math.round(H * ratio);
      mag.len = Math.max(74, Math.min(128, W * 0.18));
      n = Math.min(MAX_FILINGS, Math.round((W * H) / AREA_PER_FILING));
      const cols = Math.ceil(Math.sqrt((n * W) / H));
      const rows = Math.ceil(n / cols);
      n = cols * rows;
      hx = new Float32Array(n);
      hy = new Float32Array(n);
      px = new Float32Array(n);
      py = new Float32Array(n);
      vx = new Float32Array(n);
      vy = new Float32Array(n);
      dx = new Float32Array(n);
      dy = new Float32Array(n);
      ox = new Float32Array(n);
      oy = new Float32Array(n);
      len = new Float32Array(n);
      quick = new Float32Array(n);
      let seed = 11;
      const rnd = () => {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
      };
      // Sprinkled evenly but not in a grid: one filing somewhere in each small cell.
      for (let i = 0; i < n; i++) {
        hx[i] = (((i % cols) + rnd()) / cols) * W;
        hy[i] = ((Math.floor(i / cols) + rnd()) / rows) * H;
        px[i] = hx[i];
        py[i] = hy[i];
        const a = rnd() * Math.PI;
        ox[i] = Math.cos(a);
        oy[i] = Math.sin(a);
        dx[i] = ox[i];
        dy[i] = oy[i];
        len[i] = rnd() < 0.16 ? 1.2 + rnd() * 1.6 : 3.4 + rnd() * rnd() * 9;
        quick[i] = 45 + rnd() * 110;
      }
      if (!placed) {
        mag.x = aim.current.x * W;
        mag.y = aim.current.y * H;
        placed = true;
      }
    };

    const step = (dt: number, settle: boolean) => {
      const half = mag.len / 2 - 7;
      const ux = Math.cos(mag.phi);
      const uy = Math.sin(mag.phi);
      const nx = mag.x + ux * half;
      const ny = mag.y + uy * half;
      const sx = mag.x - ux * half;
      const sy = mag.y - uy * half;
      const gap = (Math.PI * 2) / LINES;
      const keep = mag.len * 0.2;
      for (let i = 0; i < n; i++) {
        const ax = hx[i] - nx;
        const ay = hy[i] - ny;
        const bx = hx[i] - sx;
        const by = hy[i] - sy;
        const r1 = ax * ax + ay * ay + 40;
        const r2 = bx * bx + by * by + 40;
        // The field at this filing: out of the north pole, into the south.
        const fx = ax / r1 - bx / r2;
        const fy = ay / r1 - by / r2;
        const f2 = fx * fx + fy * fy + 1e-12;
        const f = Math.sqrt(f2);
        // Far from the magnet a filing keeps the angle it fell at. Close in, it turns along the field.
        const comb = Math.min(1, Math.pow(f * REACH, 0.75));
        let rx = ox[i];
        let ry = oy[i];
        if (rx * fx + ry * fy < 0) {
          rx = -rx;
          ry = -ry;
        }
        let tx = rx + (fx / f - rx) * comb;
        let ty = ry + (fy / f - ry) * comb;
        if (tx * dx[i] + ty * dy[i] < 0) {
          tx = -tx;
          ty = -ty;
        }
        // Filings chain end to end, so they gather onto separate lines with bare paper between. Slide each one sideways to its nearest line.
        const psi = Math.atan2(ay, ax) - Math.atan2(by, bx);
        const off = psi - Math.round(psi / gap) * gap;
        const apart = gap / f;
        const hold = Math.max(0, Math.min(1, (30 - apart) / 16));
        let mx = (off * fy * hold) / f2;
        let my = (-off * fx * hold) / f2;
        const far = Math.hypot(mx, my);
        if (far > 9) {
          mx *= 9 / far;
          my *= 9 / far;
        }
        // The nearest ones are dragged right up to the poles and bristle there.
        const d1 = Math.sqrt(r1);
        const d2 = Math.sqrt(r2);
        // They stop a little short of the pole itself, so they pile up round the end of the bar and not at one point under it.
        const p1 = Math.min(30 * Math.exp(-d1 / 44), Math.max(0, d1 - keep));
        const p2 = Math.min(30 * Math.exp(-d2 / 44), Math.max(0, d2 - keep));
        const gx = hx[i] + mx - (ax / d1) * p1 - (bx / d2) * p2;
        const gy = hy[i] + my - (ay / d1) * p1 - (by / d2) * p2;
        if (settle) {
          px[i] = gx;
          py[i] = gy;
          const m = Math.hypot(tx, ty) || 1;
          dx[i] = tx / m;
          dy[i] = ty / m;
          continue;
        }
        const k = quick[i];
        vx[i] += ((gx - px[i]) * k - vx[i] * 1.5 * Math.sqrt(k)) * dt;
        vy[i] += ((gy - py[i]) * k - vy[i] * 1.5 * Math.sqrt(k)) * dt;
        px[i] += vx[i] * dt;
        py[i] += vy[i] * dt;
        const turn = Math.min(1, dt * k * 0.1);
        const qx = dx[i] + (tx - dx[i]) * turn;
        const qy = dy[i] + (ty - dy[i]) * turn;
        const m = Math.hypot(qx, qy) || 1;
        dx[i] = qx / m;
        dy[i] = qy / m;
      }
    };

    const rounded = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    const paint = () => {
      const flat = () => ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const turned = () => {
        flat();
        ctx.translate(mag.x, mag.y);
        ctx.rotate(mag.phi);
      };
      flat();
      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = "round";
      // Each filing lies on the paper, so it has a faint shadow on the side away from the lamp.
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const l = len[i] / 2;
        ctx.moveTo(px[i] - dx[i] * l + 0.9, py[i] - dy[i] * l + 1.3);
        ctx.lineTo(px[i] + dx[i] * l + 0.9, py[i] + dy[i] * l + 1.3);
      }
      ctx.strokeStyle = "rgba(70,58,40,0.16)";
      ctx.lineWidth = 1.6;
      ctx.stroke();
      // The filings themselves, in two weights of grey so the sheet does not look printed.
      for (let tone = 0; tone < 2; tone++) {
        ctx.beginPath();
        for (let i = tone; i < n; i += 2) {
          const l = len[i] / 2;
          ctx.moveTo(px[i] - dx[i] * l, py[i] - dy[i] * l);
          ctx.lineTo(px[i] + dx[i] * l, py[i] + dy[i] * l);
        }
        ctx.strokeStyle = INK[tone];
        ctx.lineWidth = tone ? 0.9 : 1.35;
        ctx.stroke();
      }

      // The magnet. Its shape turns, but every gradient is laid down in sheet coordinates, so the light stays where the lamp is.
      const L = mag.len;
      const T = L * 0.3;
      const lit = ctx.createLinearGradient(mag.x - L * 0.5, mag.y - L * 0.5, mag.x + L * 0.5, mag.y + L * 0.5);
      turned();
      ctx.shadowColor = "rgba(20,18,14,0.42)";
      ctx.shadowBlur = 16 * ratio;
      ctx.shadowOffsetX = 5 * ratio;
      ctx.shadowOffsetY = 10 * ratio;
      rounded(-L / 2, -T / 2, L, T, T * 0.2);
      flat();
      lit.addColorStop(0, "#fbfbfc");
      lit.addColorStop(0.45, "#b6bac2");
      lit.addColorStop(1, "#6f747e");
      ctx.fillStyle = lit;
      ctx.fill();
      ctx.shadowColor = "transparent";
      // North half in red enamel.
      turned();
      ctx.save();
      rounded(-L / 2, -T / 2, L, T, T * 0.2);
      ctx.clip();
      ctx.beginPath();
      ctx.rect(0, -T / 2, L / 2, T);
      flat();
      const red = ctx.createLinearGradient(mag.x - L * 0.5, mag.y - L * 0.5, mag.x + L * 0.5, mag.y + L * 0.5);
      red.addColorStop(0, "#ff7a6b");
      red.addColorStop(0.45, "#d8362b");
      red.addColorStop(1, "#8e1711");
      ctx.fillStyle = red;
      ctx.fill();
      ctx.restore();
      // A flat top face inside a chamfer: lighter than the body, with a lit and a shaded edge.
      turned();
      rounded(-L / 2 + 2.5, -T / 2 + 2.5, L - 5, T - 5, T * 0.14);
      flat();
      const face = ctx.createLinearGradient(mag.x - L * 0.5, mag.y - L * 0.5, mag.x + L * 0.5, mag.y + L * 0.5);
      face.addColorStop(0, "rgba(255,255,255,0.34)");
      face.addColorStop(0.5, "rgba(255,255,255,0.10)");
      face.addColorStop(1, "rgba(0,0,0,0.10)");
      ctx.fillStyle = face;
      ctx.fill();
      const edge = ctx.createLinearGradient(mag.x - L * 0.4, mag.y - L * 0.4, mag.x + L * 0.4, mag.y + L * 0.4);
      edge.addColorStop(0, "rgba(255,255,255,0.95)");
      edge.addColorStop(0.5, "rgba(255,255,255,0.12)");
      edge.addColorStop(1, "rgba(0,0,0,0.42)");
      ctx.strokeStyle = edge;
      ctx.lineWidth = 1;
      ctx.stroke();
      turned();
      rounded(-L / 2, -T / 2, L, T, T * 0.2);
      flat();
      ctx.strokeStyle = "rgba(30,26,22,0.55)";
      ctx.lineWidth = 0.8;
      ctx.stroke();
      // The seam between the halves, a long glint on whichever long edge faces the lamp, and the stamped letters.
      turned();
      ctx.beginPath();
      ctx.moveTo(0, -T / 2 + 1);
      ctx.lineTo(0, T / 2 - 1);
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
      const side = -Math.sin(mag.phi) * -0.6 + Math.cos(mag.phi) * -0.8 > 0 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(-L / 2 + T * 0.35, side * T * 0.2);
      ctx.lineTo(L / 2 - T * 0.35, side * T * 0.2);
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = T * 0.09;
      ctx.stroke();
      ctx.font = `700 ${Math.round(T * 0.46)}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const [letter, at, ink] of [["N", L * 0.27, "rgba(70,8,4,0.8)"], ["S", -L * 0.27, "rgba(40,44,52,0.75)"]] as const) {
        ctx.save();
        ctx.translate(at, 0);
        ctx.rotate(-mag.phi);
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fillText(letter, 0.6, 1.1);
        ctx.fillStyle = ink;
        ctx.fillText(letter, 0, 0.4);
        ctx.restore();
      }
      flat();
    };

    let visible = true;
    let raf = 0;
    let last = 0;
    const started = performance.now();

    const loop = (stamp: number) => {
      const t = (stamp - started) / 1000;
      const dt = Math.min(last ? (stamp - last) / 1000 : 0.016, 0.033);
      last = stamp;
      const a = aim.current;
      let tx = a.x * W;
      let ty = a.y * H;
      // Left alone, the magnet is led round the sheet in a slow loop.
      if (stamp - a.at > 2400) {
        tx = W * (0.5 + 0.3 * Math.sin(t * 0.52 + 0.9) + 0.04 * Math.sin(t * 1.7));
        ty = H * (0.5 + 0.24 * Math.sin(t * 0.83 + 2.4));
      }
      // It has weight: it lags the pointer, overshoots a touch and trails its long side into the direction of travel.
      mag.vx += ((tx - mag.x) * 70 - mag.vx * 13) * dt;
      mag.vy += ((ty - mag.y) * 70 - mag.vy * 13) * dt;
      mag.x += mag.vx * dt;
      mag.y += mag.vy * dt;
      const speed = Math.hypot(mag.vx, mag.vy);
      if (speed > 8) {
        let lean = Math.atan2(mag.vy, mag.vx) - mag.phi;
        lean -= Math.round(lean / Math.PI) * Math.PI;
        mag.phi += lean * Math.min(1, speed / 500) * Math.min(1, dt * 5);
      }
      const owed = a.spin * Math.min(1, dt * 7);
      mag.phi += owed;
      a.spin -= owed;
      step(dt, false);
      paint();
      raf = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
    };
    const wake = () => {
      if (reduce) {
        mag.phi += aim.current.spin;
        aim.current.spin = 0;
        mag.x = aim.current.x * W;
        mag.y = aim.current.y * H;
        step(0, true);
        paint();
        return;
      }
      if (!raf && visible && !document.hidden) {
        last = 0;
        raf = requestAnimationFrame(loop);
      }
    };

    const ro = new ResizeObserver(() => {
      scatter();
      step(0, true);
      paint();
    });
    ro.observe(el);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      wake();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", wake);
    // With motion reduced nothing loops: the sheet redraws once, settled, each time the magnet is moved or turned.
    el.addEventListener("magnet-moved", wake);
    scatter();
    step(0, true);
    paint();
    wake();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", wake);
      el.removeEventListener("magnet-moved", wake);
    };
  }, [reduce]);

  const moved = () => sheet.current?.dispatchEvent(new Event("magnet-moved"));

  function lead(e: ReactPointerEvent<HTMLButtonElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    aim.current = { ...aim.current, x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height, at: performance.now() };
    moved();
  }
  /** Arrow keys slide the magnet. Enter and Space, like a click, give it a quarter turn. */
  function onKey(e: ReactKeyboardEvent<HTMLButtonElement>) {
    const by = ({ ArrowLeft: [-0.06, 0], ArrowRight: [0.06, 0], ArrowUp: [0, -0.07], ArrowDown: [0, 0.07] } as Record<string, [number, number]>)[e.key];
    if (!by) return;
    e.preventDefault();
    const a = aim.current;
    aim.current = { ...a, x: Math.min(0.92, Math.max(0.08, a.x + by[0])), y: Math.min(0.9, Math.max(0.1, a.y + by[1])), at: performance.now() + 6000 };
    moved();
  }
  function quarterTurn() {
    aim.current = { ...aim.current, spin: aim.current.spin + Math.PI / 2, at: Math.max(aim.current.at, performance.now()) };
    moved();
  }

  return (
    <section className="relative isolate flex min-h-[760px] w-full flex-col items-center justify-center overflow-hidden bg-[#dcd9d3] px-4 py-14">
      <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: "radial-gradient(70% 60% at 42% 36%, #eeece8 0%, #dcd9d3 60%, #cfcbc4 100%)" }} />
      <button
        ref={sheet}
        type="button"
        onClick={quarterTurn}
        onPointerMove={lead}
        onPointerDown={lead}
        onKeyDown={onKey}
        aria-label="A bar magnet on a sheet of paper covered in iron filings. Arrow keys slide the magnet, Enter gives it a quarter turn."
        className="relative block aspect-[4/5] w-[min(92vw,720px)] cursor-grab touch-pan-y overflow-hidden rounded-[3px] bg-[#fbfaf6] shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_1px_2px_rgba(40,34,24,0.18),0_18px_30px_-12px_rgba(40,34,24,0.28),0_50px_80px_-30px_rgba(40,34,24,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-4 focus-visible:ring-offset-[#dcd9d3] active:cursor-grabbing sm:aspect-[3/2]"
        style={{ backgroundImage: PAPER_GRAIN }}
      >
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <span className="pointer-events-none absolute bottom-3 left-4 rounded-sm bg-[#fbfaf6]/85 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-700">Plate 7 / Field of a bar magnet</span>
        <span className="pointer-events-none absolute bottom-3 right-4 hidden rounded-sm bg-[#fbfaf6]/85 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-700 sm:block">Click to turn</span>
      </button>
    </section>
  );
}
