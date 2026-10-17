import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** The scarves on the rail, left to right. `tone` is what a scarf is filled with until its print arrives. */
const scarves = [
  { name: "Lagoon", alt: "Marbled paint in turquoise, white and gold", note: "Turquoise marble", price: 120, tone: "#22b8c4", src: "https://images.pexels.com/photos/5112008/pexels-photo-5112008.jpeg?auto=compress&cs=tinysrgb&w=700" },
  { name: "Sorbet", alt: "Marbled paint in fuchsia pink, mint green and white", note: "Fuchsia and mint", price: 120, tone: "#ee4f9d", src: "https://images.pexels.com/photos/1561020/pexels-photo-1561020.jpeg?auto=compress&cs=tinysrgb&w=700" },
  { name: "Regatta", alt: "Poured paint in blue, red, yellow and white", note: "Poured primaries", price: 135, tone: "#2f7fd0", src: "https://images.pexels.com/photos/1579243/pexels-photo-1579243.jpeg?auto=compress&cs=tinysrgb&w=700" },
  { name: "Ember", alt: "Marbled paint in red and black with small blue cells", note: "Red on black", price: 120, tone: "#d3201c", src: "https://images.pexels.com/photos/5112006/pexels-photo-5112006.jpeg?auto=compress&cs=tinysrgb&w=700" },
  { name: "Nacre", alt: "Soft wash of pink, violet and pale blue paint", note: "Shell pink wash", price: 110, tone: "#e9a5d6", src: "https://images.pexels.com/photos/4391611/pexels-photo-4391611.jpeg?auto=compress&cs=tinysrgb&w=700" },
  { name: "Poppy", alt: "Single red poppy against a dark maroon ground", note: "One red bloom", price: 145, tone: "#8c1418", src: "https://images.pexels.com/photos/31739332/pexels-photo-31739332.jpeg?auto=compress&cs=tinysrgb&w=700" },
  { name: "Gladiolus", alt: "White gladiolus flowers with yellow throats on a lilac ground", note: "White on lilac", price: 145, tone: "#b98abf", src: "https://images.pexels.com/photos/33145724/pexels-photo-33145724.jpeg?auto=compress&cs=tinysrgb&w=700" },
];

// Design units for an 1100 wide stage; the whole drawing is scaled to the width it is given.
const STAGE_H = 640;
const RAIL_Y = 84;
const RAIL_R = 10.5;
const GAP = 268; // distance between hangers
const TOP_W = 172; // width of the silk where the clamp grips it
const HEM_W = 236; // width at the hem
const LENGTH = 348;
const COLS = 30;
const ROWS = 5;
const PLEATS = 2.7;
const TEX_W = 270; // each scarf is lit once into a small picture of this size, then that picture is bent
const TEX_H = 400;
const CROP = 0.64; // share of the print's width that shows

const N = scarves.length;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const wrap = (d: number) => ((((d + N / 2) % N) + N) % N) - N / 2;

export default function SilkScarfRail() {
  const reduce = !!useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const printRefs = useRef<(HTMLImageElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [announce, setAnnounce] = useState(false);
  const sim = useRef({
    pos: 0,
    vel: 0,
    goal: 0,
    dragging: false,
    moved: 0,
    startX: 0,
    startPos: 0,
    lastX: 0,
    lastT: 0,
    k: 1,
    touched: false,
    paused: false,
    shown: 0,
    swing: scarves.map((_, i) => ({ a: (i % 2 ? -1 : 1) * 0.07, w: 0, c: (i % 2 ? -1 : 1) * 0.11, cw: 0, ph: i * 1.7 })),
    wake: () => {},
  });

  const go = useCallback((step: number) => {
    const s = sim.current;
    s.goal = Math.round(s.goal) + step;
    s.wake();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!root || !canvas || !ctx) return;
    const s = sim.current;
    let raf = 0;
    let running = false;
    let visible = true;
    let last = 0;
    let W = 1100;
    let S = 1;
    let time = 0;

    const prints = scarves.map((_, i) => printRefs.current[i] as HTMLImageElement);
    // print plus light: the dark and bright faces of each pleat are painted into the cloth once
    const cloths = scarves.map(() => {
      const c = document.createElement("canvas");
      c.width = TEX_W;
      c.height = TEX_H;
      return c;
    });
    const bake = (i: number) => {
      const g = cloths[i].getContext("2d");
      const img = prints[i];
      if (!g) return;
      g.fillStyle = scarves[i].tone;
      g.fillRect(0, 0, TEX_W, TEX_H);
      if (img && img.complete && img.naturalWidth > 0) {
        const iw = Math.min(img.naturalWidth, img.naturalHeight * CROP);
        g.drawImage(img, (img.naturalWidth - iw) / 2, 0, iw, img.naturalHeight, 0, 0, TEX_W, TEX_H);
      }
      const ph = s.swing[i].ph;
      for (let x = 0; x < TEX_W; x += 2) {
        const p = Math.PI * 2 * PLEATS * ((x + 1) / TEX_W) + ph;
        const slope = -Math.sin(p) - 0.69 * Math.sin(p * 2.3 + 1);
        const dark = slope > 0 ? clamp(slope * 0.31, 0, 0.5) : 0;
        const shine = Math.pow(clamp(1 - Math.abs(slope + 0.62) * 1.5, 0, 1), 2) * 0.42;
        if (dark < 0.01 && shine < 0.01) continue;
        const rgb = dark > 0 ? "22,10,30" : "255,251,244";
        const a = dark > 0 ? dark : shine;
        const fall = g.createLinearGradient(0, 0, 0, TEX_H);
        fall.addColorStop(0, `rgba(${rgb},${(a * 0.3).toFixed(3)})`);
        fall.addColorStop(1, `rgba(${rgb},${a.toFixed(3)})`);
        g.fillStyle = fall;
        g.fillRect(x, 0, 2, TEX_H);
      }
    };
    scarves.forEach((_, i) => bake(i));
    const loaded = (e: Event) => {
      bake(prints.indexOf(e.target as HTMLImageElement));
      if (reduce || !running) draw();
    };
    prints.forEach((img) => img.addEventListener("load", loaded));

    const fit = () => {
      const w = root.clientWidth;
      const k = clamp(w / 1100, 0.6, 1.05);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      s.k = k;
      W = w / k;
      S = dpr * k;
      const h = Math.round(STAGE_H * k);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.height = `${h}px`;
      draw();
    };

    // where a point of the silk is: u across, t down, for a scarf whose clamp is at (cx, cy)
    const pts = new Float32Array((COLS + 1) * (ROWS + 1) * 2);
    const lay = (cx: number, cy: number, a: number, c: number, ph: number) => {
      for (let j = 0; j <= COLS; j++) {
        const u = j / COLS;
        const p = Math.PI * 2 * PLEATS * u + ph;
        const zx = Math.sin(p) * 8.5 + Math.sin(p * 2.3 + 1) * 2.4;
        const zy = Math.cos(p) * 8 + Math.cos(p * 2.3 + 1) * 2.5;
        for (let r = 0; r <= ROWS; r++) {
          const t = r / ROWS;
          const ang = a + (c - a) * Math.pow(t, 1.25);
          const lx = (TOP_W + (HEM_W - TOP_W) * Math.pow(t, 0.8)) * (u - 0.5) + zx * (0.25 + 0.75 * t);
          const ly = LENGTH * t + zy * t * t;
          const o = (j * (ROWS + 1) + r) * 2;
          pts[o] = cx + lx * Math.cos(ang) - ly * Math.sin(ang);
          pts[o + 1] = cy + lx * Math.sin(ang) + ly * Math.cos(ang);
        }
      }
    };
    const outline = () => {
      ctx.beginPath();
      ctx.moveTo(pts[0], pts[1]);
      for (let r = 1; r <= ROWS; r++) ctx.lineTo(pts[r * 2], pts[r * 2 + 1]);
      for (let j = 1; j <= COLS; j++) ctx.lineTo(pts[(j * (ROWS + 1) + ROWS) * 2], pts[(j * (ROWS + 1) + ROWS) * 2 + 1]);
      for (let r = ROWS - 1; r >= 0; r--) ctx.lineTo(pts[(COLS * (ROWS + 1) + r) * 2], pts[(COLS * (ROWS + 1) + r) * 2 + 1]);
      ctx.closePath();
    };

    const chrome = (g: CanvasGradient) => {
      [
        [0, "#6b7078"],
        [0.16, "#fbfcfd"],
        [0.3, "#c3c8cf"],
        [0.52, "#565a62"],
        [0.7, "#8e939b"],
        [0.88, "#dfe3e8"],
        [1, "#484b52"],
      ].forEach(([p, col]) => g.addColorStop(p as number, col as string));
      return g;
    };

    const draw = () => {
      const H = STAGE_H;
      ctx.setTransform(S, 0, 0, S, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const mid = W / 2;
      const order = scarves.map((_, i) => ({ i, d: wrap(i - s.pos) })).filter((o) => Math.abs(o.d) * GAP < mid + 190);

      // shadows thrown on the wall, drawn by filling each shape far off canvas and keeping only its shadow
      ctx.save();
      ctx.shadowColor = "rgba(44,38,30,0.26)";
      ctx.shadowBlur = 30 * S;
      ctx.shadowOffsetX = (9000 + 30) * S;
      ctx.shadowOffsetY = 26 * S;
      ctx.fillStyle = "#000";
      ctx.fillRect(-9000, RAIL_Y - RAIL_R, W, RAIL_R * 2);
      for (const o of order) {
        const sw = s.swing[o.i];
        const x = mid + o.d * GAP - 9000;
        lay(x + Math.sin(-sw.a) * 74, RAIL_Y + Math.cos(sw.a) * 74, sw.a, sw.c, sw.ph);
        outline();
        ctx.fill();
      }
      ctx.restore();

      // ceiling rods and the rail
      for (const rx of [W * 0.14, W * 0.86]) {
        ctx.fillStyle = chrome(ctx.createLinearGradient(rx - 4.5, 0, rx + 4.5, 0));
        ctx.fillRect(rx - 4.5, 0, 9, RAIL_Y);
        ctx.fillStyle = chrome(ctx.createLinearGradient(rx - 10, 0, rx + 10, 0));
        ctx.fillRect(rx - 10, RAIL_Y - RAIL_R - 5, 20, RAIL_R * 2 + 10);
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.fillRect(rx - 10, RAIL_Y - RAIL_R - 5, 20, 1);
        ctx.fillRect(rx - 10, RAIL_Y + RAIL_R + 4, 20, 1);
      }
      ctx.fillStyle = chrome(ctx.createLinearGradient(0, RAIL_Y - RAIL_R, 0, RAIL_Y + RAIL_R));
      ctx.fillRect(0, RAIL_Y - RAIL_R, W * 0.14 - 10, RAIL_R * 2);
      ctx.fillRect(W * 0.14 + 10, RAIL_Y - RAIL_R, W * 0.72 - 20, RAIL_R * 2);
      ctx.fillRect(W * 0.86 + 10, RAIL_Y - RAIL_R, W, RAIL_R * 2);

      for (const o of order) {
        const sw = s.swing[o.i];
        const cloth = cloths[o.i];
        const x = mid + o.d * GAP;
        const cx = x - Math.sin(sw.a) * 74;
        const cy = RAIL_Y + Math.cos(sw.a) * 74;
        lay(cx, cy, sw.a, sw.c, sw.ph);

        // the silk, cell by cell: each cell of the lit print is sheared onto its patch of cloth
        const cw = TEX_W / COLS;
        const ch = TEX_H / ROWS;
        for (let j = 0; j < COLS; j++) {
          for (let r = 0; r < ROWS; r++) {
            const o0 = (j * (ROWS + 1) + r) * 2;
            const o1 = ((j + 1) * (ROWS + 1) + r) * 2;
            const x0 = pts[o0];
            const y0 = pts[o0 + 1];
            ctx.setTransform((S * (pts[o1] - x0)) / cw, (S * (pts[o1 + 1] - y0)) / cw, (S * (pts[o0 + 2] - x0)) / ch, (S * (pts[o0 + 3] - y0)) / ch, S * x0, S * y0);
            // drawn a little oversize so no hairline shows between cells; the next cell covers the overlap
            ctx.drawImage(cloth, j * cw, r * ch, cw, ch, 0, 0, j < COLS - 1 ? cw * 1.16 : cw, r < ROWS - 1 ? ch * 1.05 : ch);
          }
        }
        ctx.setTransform(S, 0, 0, S, 0, 0);
        // rolled edge all round, and the shade the clamp throws on the silk
        outline();
        ctx.lineWidth = 1.1;
        ctx.strokeStyle = "rgba(20,12,24,0.38)";
        ctx.stroke();
        ctx.save();
        outline();
        ctx.clip();
        ctx.translate(x, RAIL_Y);
        ctx.rotate(sw.a);
        const under = ctx.createLinearGradient(0, 74, 0, 104);
        under.addColorStop(0, "rgba(20,10,10,0.5)");
        under.addColorStop(1, "rgba(20,10,10,0)");
        ctx.fillStyle = under;
        ctx.fillRect(-TOP_W, 70, TOP_W * 2, 40);
        ctx.restore();

        // the hanger: a wire hook over the rail and a walnut clamp
        ctx.save();
        ctx.translate(x, RAIL_Y);
        ctx.rotate(sw.a);
        ctx.lineCap = "round";
        const hook = () => {
          ctx.beginPath();
          ctx.moveTo(0, 60);
          ctx.lineTo(0, 13.5);
          ctx.arc(0, 0, 13.5, Math.PI / 2, -Math.PI * 1.12, true);
        };
        hook();
        ctx.lineWidth = 5.4;
        ctx.strokeStyle = "#4d5158";
        ctx.stroke();
        hook();
        ctx.lineWidth = 3.4;
        ctx.strokeStyle = "#c9ced5";
        ctx.stroke();
        ctx.translate(-0.9, -0.9);
        hook();
        ctx.lineWidth = 1.1;
        ctx.strokeStyle = "rgba(255,255,255,0.95)";
        ctx.stroke();
        ctx.translate(0.9, 0.9);
        const bw = TOP_W + 26;
        const wood = ctx.createLinearGradient(0, 56, 0, 76);
        wood.addColorStop(0, "#a8733f");
        wood.addColorStop(0.18, "#8f5d31");
        wood.addColorStop(0.5, "#6f4523");
        wood.addColorStop(0.52, "#4a2c14");
        wood.addColorStop(0.58, "#82532b");
        wood.addColorStop(1, "#53331a");
        ctx.shadowColor = "rgba(20,10,0,0.4)";
        ctx.shadowBlur = 5 * S;
        ctx.shadowOffsetY = 3 * S;
        ctx.fillStyle = wood;
        ctx.beginPath();
        ctx.roundRect(-bw / 2, 56, bw, 20, 5);
        ctx.fill();
        ctx.shadowColor = "transparent";
        ctx.fillStyle = "rgba(255,226,186,0.4)";
        ctx.fillRect(-bw / 2 + 5, 57, bw - 10, 1.2);
        // grain
        ctx.strokeStyle = "rgba(40,20,6,0.22)";
        ctx.lineWidth = 0.6;
        for (let g = 0; g < 5; g++) {
          ctx.beginPath();
          ctx.moveTo(-bw / 2 + 8, 59.5 + g * 3.4);
          ctx.bezierCurveTo(-bw / 6, 58.5 + g * 3.4 + (g % 2), bw / 6, 61 + g * 3.4 - (g % 2), bw / 2 - 8, 59.6 + g * 3.4);
          ctx.stroke();
        }
        for (const bx of [-bw / 2 + 13, bw / 2 - 13]) {
          const brass = ctx.createRadialGradient(bx - 1.2, 64.8, 0.4, bx, 66, 4.6);
          brass.addColorStop(0, "#fff3c4");
          brass.addColorStop(0.45, "#d2a546");
          brass.addColorStop(1, "#7a5718");
          ctx.fillStyle = brass;
          ctx.beginPath();
          ctx.arc(bx, 66, 4.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(60,36,4,0.7)";
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.moveTo(bx - 2.6, 67.2);
          ctx.lineTo(bx + 2.6, 64.8);
          ctx.stroke();
        }
        ctx.restore();
      }
    };

    const step = (dt: number) => {
      time += dt;
      const before = s.vel;
      if (!s.dragging) {
        s.vel += ((s.goal - s.pos) * 46 - s.vel * 9.5) * dt;
        s.pos += s.vel * dt;
      }
      const push = ((s.vel - before) / dt) * GAP; // how hard the rail is being shoved, in design units
      let energy = Math.abs(s.vel) + Math.abs(s.goal - s.pos);
      s.swing.forEach((sw, i) => {
        const air = Math.sin(time * 0.9 + i * 2.1) * 0.05;
const f = 1 + (((i * 37) % 7) - 3) * 0.05; // no two hangers swing at quite the same rate
        sw.w += (-34 * f * Math.sin(sw.a) - (1.2 + (i % 3) * 0.25) * sw.w - (clamp(push, -9000, 9000) / 520) * f * Math.cos(sw.a) + air) * dt;
        sw.a = clamp(sw.a + sw.w * dt, -0.7, 0.7);
        sw.cw += (-22 * Math.sin(sw.c) - 30 * (sw.c - sw.a) - 1.7 * sw.cw - clamp(push, -9000, 9000) / (560 + (i % 4) * 60)) * dt;
        sw.c = clamp(sw.c + sw.cw * dt, -1, 1);
        energy += Math.abs(sw.w) + Math.abs(sw.cw) + Math.abs(sw.a) * 2;
      });
      return energy;
    };

    const frame = (now: number) => {
      const dt = Math.min(0.034, (now - last) / 1000);
      last = now;
      step(dt / 2);
      step(dt / 2);
      draw();
      const at = ((Math.round(s.pos) % N) + N) % N;
      if (at !== s.shown) {
        s.shown = at;
        setActive(at);
      }
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (running || reduce || !visible || document.hidden) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    s.wake = () => {
      if (!reduce) return start();
      s.pos = s.goal;
      const at = ((Math.round(s.pos) % N) + N) % N;
      s.shown = at;
      setActive(at);
      draw();
    };
    if (reduce) s.swing.forEach((sw) => (sw.a = sw.c = sw.w = sw.cw = 0));

    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      s.dragging = true;
      s.touched = true;
      s.moved = 0;
      s.startX = s.lastX = e.clientX;
      s.startPos = s.pos;
      s.lastT = performance.now();
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = "grabbing";
    };
    const move = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      if (s.dragging) {
        const now = performance.now();
        const next = s.startPos - (e.clientX - s.startX) / (GAP * s.k);
        const dt = Math.max(0.004, (now - s.lastT) / 1000);
        s.vel = s.vel * 0.5 + ((next - s.pos) / dt) * 0.5;
        s.moved += Math.abs(e.clientX - s.lastX);
        s.pos = next;
        s.lastT = now;
        if (reduce) {
          s.goal = next;
          s.wake();
        }
      } else if (!reduce && e.pointerType !== "touch") {
        // a hand passing through the silk sets it moving
        const px = (e.clientX - r.left) / s.k;
        const py = (e.clientY - r.top) / s.k;
        const dx = (e.clientX - s.lastX) / s.k;
        if (py > RAIL_Y + 80 && py < RAIL_Y + 110 + LENGTH)
          scarves.forEach((_, i) => {
            const x = W / 2 + wrap(i - s.pos) * GAP;
            if (Math.abs(px - x) < HEM_W / 2) s.swing[i].cw += clamp(dx, -40, 40) * 0.03;
          });
      }
      s.lastX = e.clientX;
    };
    const up = () => {
      if (!s.dragging) return;
      s.dragging = false;
      canvas.style.cursor = "grab";
      s.goal = Math.round(s.pos + clamp(s.vel, -6, 6) * 0.22);
      s.wake();
    };

    const timer = window.setInterval(() => {
      if (reduce || s.touched || s.paused || s.dragging || document.hidden || !visible) return;
      s.goal = Math.round(s.goal) + 1;
    }, 2600);
    const first = window.setTimeout(() => {
      if (!reduce && !s.touched) s.goal = 1;
    }, 900);

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(root);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(root);
    const vis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", vis);
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    start();
    return () => {
      stop();
      window.clearInterval(timer);
      window.clearTimeout(first);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      prints.forEach((img) => img.removeEventListener("load", loaded));
    };
  }, [reduce]);

  const press = (stepBy: number) => {
    sim.current.touched = true;
    setAnnounce(true);
    go(stepBy);
  };
  const item = scarves[active];

  return (
    <section
      ref={rootRef}
      className="relative w-full select-none overflow-hidden bg-[#efece6]"
      onPointerEnter={() => (sim.current.paused = true)}
      onPointerLeave={() => (sim.current.paused = false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") press(1);
        if (e.key === "ArrowLeft") press(-1);
      }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(90% 70% at 42% 30%, #fbfaf7 0%, #efece6 55%, #dcd7cd 100%)" }} />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="relative block w-full cursor-grab touch-pan-y"
        style={{ height: STAGE_H }}
      />
      {/* the prints themselves: the canvas draws from these, and they carry the descriptions */}
      <ul className="sr-only">
        {scarves.map((sc, i) => (
          <li key={sc.name}>
            <img
              alt={`${sc.name} scarf: ${sc.alt}`}
              src={sc.src}
              ref={(el) => {
                printRefs.current[i] = el;
              }}
              width={700}
              height={700}
            />
          </li>
        ))}
      </ul>
      <div className="relative -mt-4 flex items-end justify-between gap-4 px-5 pb-5 sm:-mt-10 sm:px-8 sm:pb-8">
        <p className="font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-[#6a6458]" aria-live={announce ? "polite" : "off"}>
          <span className="text-[#1b1915]">
            {String(active + 1).padStart(2, "0")} / {String(N).padStart(2, "0")} {item.name}
          </span>
          <span className="block">
            {item.note}, silk twill, £{item.price}
          </span>
        </p>
        <div className="flex shrink-0 gap-2">
          {[-1, 1].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => press(d)}
              aria-label={d < 0 ? "Slide the rail to the previous scarf" : "Slide the rail to the next scarf"}
              className="grid h-11 w-11 place-items-center rounded-full border border-[#1b1915]/20 bg-white/70 text-[#1b1915] outline-none transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-[#1b1915] focus-visible:ring-offset-2 focus-visible:ring-offset-[#efece6]"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={d < 0 ? "M12.5 4.5 7 10l5.5 5.5" : "M7.5 4.5 13 10l-5.5 5.5"} />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
