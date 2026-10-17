import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

const WORD = "Lantern";
const COLORS = ["#efdcbc", "#d9a35b", "#f7ecd8"]; // sand, amber, pale cream
const ASSEMBLE_MS = 1500; // how long the dust takes to settle into letters
const CYCLE_MS = 11000; // full loop: assemble, rest, drift apart
const MAX_DOTS = 4200; // upper limit on particles, keeps each frame cheap

export default function ParticleHeadlineAssemblingIntoLetters() {
  const box = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = box.current;
    if (!canvas || !host) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let n = 0;
    let tx = new Float32Array(0);
    let ty = new Float32Array(0);
    let sx = new Float32Array(0);
    let sy = new Float32Array(0);
    let ox = new Float32Array(0);
    let oy = new Float32Array(0);
    let delay = new Float32Array(0);
    let tone = new Uint8Array(0);
    let size = new Float32Array(0);
    let frame = 0;
    let visible = true;
    let start = performance.now();
    const pointer = { x: -1e4, y: -1e4 };

    const build = () => {
      const r = host.getBoundingClientRect();
      w = Math.max(1, r.width);
      h = Math.max(1, r.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const off = document.createElement("canvas");
      off.width = Math.ceil(w);
      off.height = Math.ceil(h);
      const o = off.getContext("2d", { willReadFrequently: true });
      if (!o) return;
      let fs = h * 0.78;
      o.font = `700 ${fs}px ui-serif, Georgia, "Times New Roman", serif`;
      const tw = o.measureText(WORD).width;
      if (tw > w * 0.92) fs *= (w * 0.92) / tw;
      o.font = `700 ${fs}px ui-serif, Georgia, "Times New Roman", serif`;
      o.textAlign = "center";
      o.textBaseline = "middle";
      o.fillStyle = "#000";
      o.fillText(WORD, w / 2, h * 0.53);
      const data = o.getImageData(0, 0, off.width, off.height).data;
      const gap = w < 640 ? 2.5 : 3.5;
      const xs: number[] = [];
      const ys: number[] = [];
      for (let y = 0; y < off.height; y += gap) {
        for (let x = 0; x < off.width; x += gap) {
          if (data[(Math.floor(y) * off.width + Math.floor(x)) * 4 + 3] > 140) {
            xs.push(x + (Math.random() - 0.5) * 0.8);
            ys.push(y + (Math.random() - 0.5) * 0.8);
          }
        }
      }
      const stride = Math.max(1, Math.ceil(xs.length / MAX_DOTS));
      tx = Float32Array.from(xs.filter((_, i) => i % stride === 0));
      ty = Float32Array.from(ys.filter((_, i) => i % stride === 0));
      n = tx.length;
      sx = new Float32Array(n);
      sy = new Float32Array(n);
      ox = new Float32Array(n);
      oy = new Float32Array(n);
      delay = new Float32Array(n);
      tone = new Uint8Array(n);
      size = new Float32Array(n);
      for (let i = 0; i < n; i += 1) {
        const a = Math.random() * Math.PI * 2;
        const d = 0.35 + Math.random() * 0.75;
        sx[i] = w / 2 + Math.cos(a) * w * 0.55 * d;
        sy[i] = h / 2 + Math.sin(a) * h * 0.9 * d;
        delay[i] = (tx[i] / w) * 380 + Math.random() * 260;
        const roll = Math.random();
        tone[i] = roll < 0.62 ? 0 : roll < 0.9 ? 1 : 2;
        size[i] = gap * (0.62 + Math.random() * 0.4);
      }
    };

    const ease = (p: number) => 1 - Math.pow(1 - p, 3);

    const draw = (now: number, still: boolean) => {
      const t = still ? ASSEMBLE_MS + 2000 : (now - start) % CYCLE_MS;
      ctx.clearRect(0, 0, w, h);
      const out = CYCLE_MS - 1400;
      for (let c = 0; c < COLORS.length; c += 1) {
        ctx.fillStyle = COLORS[c];
        for (let i = 0; i < n; i += 1) {
          if (tone[i] !== c) continue;
          let p = Math.min(1, Math.max(0, (t - delay[i]) / (ASSEMBLE_MS - 600)));
          if (t > out) p = 1 - Math.min(1, (t - out) / 1300) * 0.85;
          const e = ease(p);
          let x = sx[i] + (tx[i] - sx[i]) * e;
          let y = sy[i] + (ty[i] - sy[i]) * e;
          if (!still) {
            x += Math.sin(now * 0.0011 + i) * 0.45;
            y += Math.cos(now * 0.0013 + i * 1.7) * 0.45;
            const dx = x - pointer.x;
            const dy = y - pointer.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < 3600) {
              const f = (1 - d2 / 3600) * 2.2;
              const d = Math.sqrt(d2) || 1;
              ox[i] += (dx / d) * f;
              oy[i] += (dy / d) * f;
            }
            ox[i] *= 0.9;
            oy[i] *= 0.9;
            x += ox[i];
            y += oy[i];
          }
          ctx.globalAlpha = 0.35 + 0.65 * e;
          ctx.fillRect(x, y, size[i], size[i]);
        }
      }
      ctx.globalAlpha = 1;
    };

    const loop = (now: number) => {
      draw(now, false);
      frame = requestAnimationFrame(loop);
    };
    const play = () => {
      if (!frame && visible && !reduce) frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    build();
    if (reduce) draw(0, true);
    else play();

    const ro = new ResizeObserver(() => {
      build();
      if (reduce) draw(0, true);
    });
    ro.observe(host);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) play();
      else stop();
    });
    io.observe(host);
    const move = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    };
    const leave = () => {
      pointer.x = -1e4;
      pointer.y = -1e4;
    };
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerleave", leave);
    start = performance.now();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", leave);
    };
  }, [reduce]);

  return (
    <section className="relative overflow-hidden bg-[#15110e] px-5 py-16 sm:px-10 sm:py-20">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(55%_50%_at_50%_42%,rgba(217,163,91,0.16),transparent_70%)]" />
      <div className="relative mx-auto max-w-5xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#c9b08a]">Small-batch coffee roasters</p>
        <h1 className="sr-only">{WORD}</h1>
        <div ref={box} className="relative mx-auto mt-4 h-[150px] w-full touch-pan-y sm:h-[240px] lg:h-[280px]">
          <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        </div>
        <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-[#d8c6aa] sm:text-lg">
          Beans roasted every Tuesday in a converted boathouse, shipped the same afternoon so they reach you within the week.
        </p>
        <a
          href="#"
          className="mt-8 inline-flex h-12 items-center rounded-full bg-[#efdcbc] px-7 text-sm font-semibold text-[#15110e] transition hover:bg-[#f7ecd8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d9a35b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#15110e]"
        >
          Choose this week&apos;s roast
        </a>
      </div>
    </section>
  );
}
