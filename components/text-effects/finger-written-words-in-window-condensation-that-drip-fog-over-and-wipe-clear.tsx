import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useReducedMotion } from "framer-motion";

// The lines a finger writes on the glass, one after another. Short ones read best.
const phrases = ["grow slow", "stay a while", "open late"];

const photo = {
  src: "https://images.pexels.com/photos/19516025/pexels-photo-19516025.jpeg?auto=compress&cs=tinysrgb&w=1600",
  alt: "A mossy walkway running between dense tropical plants under the glass roof of a greenhouse",
};

/** Colour the mist is tinted with. A warmer value reads as a kitchen window, a bluer one as a winter morning. */
const MIST = "224, 238, 231";
/** Seconds a wiped patch stays clear before the mist starts to creep back, and how long it takes to close. */
const WIPE_HOLD = 2.6;
const WIPE_CLOSE = 3.4;

type Swipe = { x0: number; y0: number; x1: number; y1: number; at: number; w: number };
type Drip = { x: number; y: number; from: number; r: number; speed: number; wait: number; born: number; end: number; trail: number[]; phase: number };
type Line = { text: string; x0: number; x1: number; y: number };

function bead(c: CanvasRenderingContext2D, x: number, y: number, r: number, alpha: number) {
  c.globalAlpha = alpha;
  const g = c.createRadialGradient(x - r * 0.32, y - r * 0.38, r * 0.05, x, y, r);
  g.addColorStop(0, "rgba(255,255,255,0.95)");
  g.addColorStop(0.22, "rgba(255,255,255,0.22)");
  g.addColorStop(0.7, "rgba(14,36,26,0.1)");
  g.addColorStop(1, "rgba(8,22,16,0.42)");
  c.fillStyle = g;
  c.beginPath();
  c.ellipse(x, y, r * 0.92, r * 1.08, 0, 0, Math.PI * 2);
  c.fill();
  // Light that has gone through the drop gathers on its lower edge.
  c.strokeStyle = "rgba(255,255,255,0.6)";
  c.lineWidth = Math.max(0.6, r * 0.2);
  c.beginPath();
  c.arc(x, y, r * 0.66, Math.PI * 0.18, Math.PI * 0.7);
  c.stroke();
  c.globalAlpha = 1;
}

export default function FingerWrittenWordsInWindowCondensationThatDripFogOverAndWipeClear() {
  const reduce = useReducedMotion();
  const pane = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const picture = useRef<HTMLImageElement>(null);
  const swipes = useRef<Swipe[]>([]);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const skip = useRef(0);
  const redraw = useRef<() => void>(() => {});
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const el = pane.current;
    const cv = canvas.current;
    const img = picture.current;
    if (!el || !cv || !img) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const make = () => document.createElement("canvas");
    const fog = make();
    const word = make();
    const rim = make();
    const cut = make();
    const cutRim = make();
    let W = 0;
    let H = 0;
    let ratio = 1;
    let lines: Line[] = [];
    let finger = 14;
    let size = 100;
    let current = 0;
    let began = performance.now();
    let drips: Drip[] = [];
    let raf = 0;
    let visible = true;
    let seenSkip = skip.current;

    /** Small repeatable random numbers, so the same phrase always wobbles the same way. */
    const noise = (n: number) => {
      const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
      return s - Math.floor(s);
    };

    const buildFog = () => {
      fog.width = cv.width;
      fog.height = cv.height;
      const f = fog.getContext("2d")!;
      f.setTransform(ratio, 0, 0, ratio, 0, 0);
      const back = f.createLinearGradient(0, 0, 0, H);
      back.addColorStop(0, "#7fa692");
      back.addColorStop(1, "#3d5f4c");
      f.fillStyle = back;
      f.fillRect(0, 0, W, H);
      if (img.complete && img.naturalWidth) {
        // The view through misted glass: the photograph shrunk to a few dozen pixels and stretched back out.
        const tiny = make();
        tiny.width = 28;
        tiny.height = Math.max(8, Math.round((28 * H) / W));
        const iw = img.naturalWidth;
        const ih = img.naturalHeight;
        const scale = Math.max(W / iw, H / ih);
        const sw = W / scale;
        const sh = H / scale;
        try {
          tiny.getContext("2d")!.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, 0, 0, tiny.width, tiny.height);
          // Doubling it a step at a time keeps the smear smooth instead of blocky.
          let step = tiny;
          while (step.width < W / 2) {
            const bigger = make();
            bigger.width = step.width * 2;
            bigger.height = step.height * 2;
            const b = bigger.getContext("2d")!;
            b.imageSmoothingQuality = "high";
            b.drawImage(step, 0, 0, bigger.width, bigger.height);
            step = bigger;
          }
          f.imageSmoothingQuality = "high";
          f.drawImage(step, 0, 0, W, H);
        } catch {
          // The gradient above stands in for the picture.
        }
      }
      f.fillStyle = `rgba(${MIST}, 0.66)`;
      f.fillRect(0, 0, W, H);
      // Mist sits thicker toward the cold edges of the pane.
      const edge = f.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.72);
      edge.addColorStop(0, `rgba(${MIST}, 0)`);
      edge.addColorStop(1, `rgba(${MIST}, 0.5)`);
      f.fillStyle = edge;
      f.fillRect(0, 0, W, H);
      // The mist is thousands of tiny beads: a pale speck with a darker one beside it.
      const specks = Math.round((W * H) / 26);
      for (let i = 0; i < specks; i++) {
        const x = noise(i * 1.31) * W;
        const y = noise(i * 2.17 + 9) * H;
        const r = 0.35 + noise(i * 3.3) * 0.75;
        f.fillStyle = "rgba(255,255,255,0.16)";
        f.fillRect(x, y, r, r);
        f.fillStyle = "rgba(20,48,36,0.07)";
        f.fillRect(x + r, y + r, r, r);
      }
      // A few fat drops that have already gathered and are sitting still.
      const fat = Math.round((W * H) / 8000);
      for (let i = 0; i < fat; i++) {
        bead(f, noise(i * 7.7 + 2) * W, noise(i * 5.1 + 4) * H, 0.9 + noise(i * 9.9) * noise(i * 3.1) * 3.6, 0.7);
      }
    };

    const buildWord = () => {
      const phrase = phrases[current % phrases.length];
      const parts = W < 560 ? phrase.split(" ") : [phrase];
      const font = (px: number) => `100 ${px}px "Helvetica Neue", "Segoe UI", Roboto, system-ui, sans-serif`;
      const w = word.getContext("2d")!;
      size = Math.min(H * (parts.length > 1 ? 0.21 : 0.36), 210);
      w.setTransform(1, 0, 0, 1, 0, 0);
      w.font = font(size);
      const gap = 0.07;
      const widest = Math.max(...parts.map((p) => w.measureText(p).width + p.length * size * gap));
      size *= Math.min(1, (W * 0.78) / widest);
      finger = Math.max(6, size * 0.07);
      const lead = size * 1.06;
      const top = H * 0.46 - ((parts.length - 1) * lead) / 2;

      lines = [];
      for (const c of [word, rim]) {
        c.width = cv.width;
        c.height = cv.height;
      }
      const r = rim.getContext("2d")!;
      const draw = (c: CanvasRenderingContext2D, width: number) => {
        c.setTransform(ratio, 0, 0, ratio, 0, 0);
        c.clearRect(0, 0, W, H);
        c.font = font(size);
        c.lineJoin = "round";
        c.lineCap = "round";
        c.lineWidth = width;
        c.strokeStyle = "#fff";
        c.fillStyle = "#fff";
        c.textBaseline = "middle";
        parts.forEach((text, row) => {
          const full = c.measureText(text).width + text.length * size * gap;
          let x = (W - full) / 2;
          const y = top + row * lead;
          if (c === w) lines.push({ text, x0: x - finger, x1: x + full + finger, y });
          [...text].forEach((ch, i) => {
            const seed = current * 31 + row * 17 + i;
            const adv = c.measureText(ch).width + size * gap;
            c.save();
            // Each letter leans and sits a touch off the line, the way a hand writes on a wall of glass.
            c.translate(x + adv / 2, y + (noise(seed) - 0.5) * size * 0.045);
            c.rotate((noise(seed + 0.5) - 0.5) * 0.055);
            c.transform(1, 0, -0.14, 1, 0, 0);
            c.strokeText(ch, -adv / 2 + (size * gap) / 2, 0);
            c.fillText(ch, -adv / 2 + (size * gap) / 2, 0);
            c.restore();
            x += adv;
          });
        });
      };
      draw(w, finger);
      // The bank of water a fingertip pushes to each side of its stroke.
      draw(r, finger + 3.2);
      r.globalCompositeOperation = "destination-out";
      const hold = make();
      hold.width = cv.width;
      hold.height = cv.height;
      const h = hold.getContext("2d")!;
      draw(h, Math.max(2, finger - 0.5));
      r.setTransform(1, 0, 0, 1, 0, 0);
      r.drawImage(hold, 0, 0);
      r.globalCompositeOperation = "source-over";

      // Where the drops will let go: the lowest wet point under a handful of columns.
      drips = [];
      const data = w.getImageData(0, 0, word.width, word.height).data;
      const wanted = Math.max(3, Math.round(W / 170));
      const span = lines.reduce((a, l) => ({ x0: Math.min(a.x0, l.x0), x1: Math.max(a.x1, l.x1) }), { x0: W, x1: 0 });
      for (let i = 0; i < wanted * 3 && drips.length < wanted; i++) {
        const x = span.x0 + finger + noise(current * 13 + i * 3.7) * (span.x1 - span.x0 - finger * 2);
        const px = Math.round(x * ratio);
        let bottom = -1;
        for (let y = word.height - 1; y > 0; y--) {
          if (data[(y * word.width + px) * 4 + 3] > 200) {
            bottom = y / ratio;
            break;
          }
        }
        if (bottom < 0 || drips.some((d) => Math.abs(d.x - x) < finger * 1.6)) continue;
        const k = noise(i * 4.4 + current);
        drips.push({
          x,
          y: bottom - 1,
          from: bottom - 1,
          r: 2 + k * 2.6,
          speed: 46 + noise(i + 3.3) * 90,
          wait: 0,
          born: 0.25 + noise(i * 2.2 + 1) * 3.4,
          end: Math.min(H - 6, bottom + H * (0.1 + noise(i * 6.1) * 0.34)),
          trail: [],
          phase: noise(i * 8.8) * 6,
        });
      }
    };

    const resize = () => {
      W = el.clientWidth;
      H = el.clientHeight;
      if (!W || !H) return;
      ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      for (const c of [cv, cut, cutRim]) {
        c.width = Math.round(W * ratio);
        c.height = Math.round(H * ratio);
      }
      buildFog();
      buildWord();
      paint(performance.now());
    };

    /** Copy a layer, keeping only what the finger has reached so far. */
    const reveal = (target: HTMLCanvasElement, source: HTMLCanvasElement, written: number) => {
      const c = target.getContext("2d")!;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.globalCompositeOperation = "copy";
      c.drawImage(source, 0, 0);
      c.globalCompositeOperation = "destination-out";
      c.setTransform(ratio, 0, 0, ratio, 0, 0);
      let done = 0;
      const soft = finger * 1.4;
      for (const line of lines) {
        const n = line.text.length;
        const part = Math.min(1, Math.max(0, (written - done) / n));
        done += n;
        if (part >= 1) continue;
        const pen = line.x0 + (line.x1 - line.x0 + soft) * part;
        const g = c.createLinearGradient(pen - soft, 0, pen, 0);
        g.addColorStop(0, "rgba(0,0,0,0)");
        g.addColorStop(1, "rgba(0,0,0,1)");
        c.fillStyle = g;
        c.fillRect(pen - soft, line.y - size * 0.53, W, size * 1.06);
      }
      c.globalCompositeOperation = "source-over";
    };

    let lastStamp = 0;
    const paint = (stamp: number) => {
      if (!W) return;
      const dt = Math.min(lastStamp ? (stamp - lastStamp) / 1000 : 0.016, 0.05);
      lastStamp = stamp;
      const letters = lines.reduce((n, l) => n + l.text.length, 0);
      const writeFor = letters * 0.15;
      const t = reduce ? 1e3 : (stamp - began) / 1000;
      const holdUntil = writeFor + 7.2;
      const written = reduce ? letters : Math.max(0, t / 0.15);
      const ink = reduce ? 1 : 1 - Math.min(1, Math.max(0, (t - holdUntil) / 2.2));

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = "copy";
      ctx.drawImage(fog, 0, 0);
      ctx.globalCompositeOperation = "destination-out";

      // The word.
      const whole = written >= letters;
      if (!whole) {
        reveal(cut, word, written);
        reveal(cutRim, rim, written);
      }
      ctx.globalAlpha = ink;
      ctx.drawImage(whole ? word : cut, 0, 0);
      ctx.globalAlpha = 1;

      // Patches wiped by hand, closing over as the mist returns.
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const now = stamp / 1000;
      swipes.current = swipes.current.filter((s) => now - s.at < WIPE_HOLD + WIPE_CLOSE);
      for (const s of swipes.current) {
        const age = now - s.at;
        const shut = reduce ? 0 : Math.max(0, (age - WIPE_HOLD) / WIPE_CLOSE);
        if (shut >= 1) continue;
        ctx.strokeStyle = "#000";
        // A patch closes by narrowing, because mist grows back in from its edges.
        ctx.lineWidth = s.w * Math.pow(1 - shut, 0.7);
        ctx.beginPath();
        ctx.moveTo(s.x0, s.y0);
        ctx.lineTo(s.x1, s.y1 + 0.01);
        ctx.stroke();
      }

      // Runs of water falling from the letters.
      const dripping = !reduce && whole;
      for (const d of drips) {
        const age = t - writeFor - d.born;
        if (!dripping || age < 0) continue;
        if (d.y < d.end) {
          // Stick and slip: a drop hesitates, then lets go again.
          d.wait -= dt;
          if (d.wait <= 0) {
            d.y += d.speed * dt * (0.6 + 0.4 * Math.sin(age * 3.1 + d.phase));
            if (noise(Math.floor(age * 6) + d.phase) > 0.93) d.wait = 0.12 + noise(age) * 0.5;
          }
          const sway = Math.sin(d.y * 0.045 + d.phase) * 2.2 + Math.sin(d.y * 0.013 + d.phase * 2) * 3;
          const n = d.trail.length;
          if (!n || d.y - d.trail[n - 1] > 3) d.trail.push(d.x + sway, d.y);
        }
        if (d.trail.length >= 4) {
          ctx.strokeStyle = `rgba(0,0,0,${0.92 * ink})`;
          ctx.lineWidth = d.r * 1.35;
          ctx.beginPath();
          ctx.moveTo(d.x, d.from - finger * 0.3);
          for (let i = 0; i < d.trail.length; i += 2) ctx.lineTo(d.trail[i], d.trail[i + 1]);
          ctx.stroke();
        }
      }

      ctx.globalCompositeOperation = "source-over";
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 0.34 * ink;
      ctx.drawImage(whole ? rim : cutRim, 0, 0);
      ctx.globalAlpha = 1;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      for (const d of drips) {
        const n = d.trail.length;
        if (!dripping || n < 2) continue;
        bead(ctx, d.trail[n - 2], d.trail[n - 1] + d.r * 0.4, d.r * (d.y < d.end ? 1.25 : 1.05), ink);
        // Small beads left behind along the run.
        for (let i = 6; i < n - 6; i += 14) {
          if (noise(i + d.phase) > 0.45) bead(ctx, d.trail[i] + (noise(i) - 0.5) * 2, d.trail[i + 1], d.r * 0.34, ink * 0.8);
        }
      }

      if (!reduce && (t > holdUntil + 2.5 || seenSkip !== skip.current)) {
        seenSkip = skip.current;
        current += 1;
        setIndex(current % phrases.length);
        began = stamp;
        buildWord();
      }
    };

    const loop = (stamp: number) => {
      paint(stamp);
      raf = visible && !document.hidden && !reduce ? requestAnimationFrame(loop) : 0;
    };
    const wake = () => {
      if (!raf && visible && !document.hidden && !reduce) {
        lastStamp = 0;
        raf = requestAnimationFrame(loop);
      }
    };
    redraw.current = () => {
      if (!reduce) return;
      if (seenSkip !== skip.current) {
        seenSkip = skip.current;
        current += 1;
        setIndex(current % phrases.length);
        swipes.current = [];
        buildWord();
      }
      paint(performance.now());
    };

    // The first line is already half written when the pane appears.
    began = performance.now() - phrases[0].length * 0.15 * 0.62 * 1000;
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      wake();
    });
    io.observe(el);
    const loaded = () => {
      buildFog();
      paint(performance.now());
    };
    img.addEventListener("load", loaded);
    document.addEventListener("visibilitychange", wake);
    resize();
    wake();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      img.removeEventListener("load", loaded);
      document.removeEventListener("visibilitychange", wake);
    };
  }, [reduce]);

  function wipe(e: ReactPointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const p = { x: e.clientX - r.left, y: e.clientY - r.top };
    const from = lastPoint.current ?? p;
    if (lastPoint.current && e.type === "pointermove" && Math.hypot(p.x - from.x, p.y - from.y) < 3) return;
    const list = swipes.current;
    list.push({ x0: from.x, y0: from.y, x1: p.x, y1: p.y, at: performance.now() / 1000, w: Math.min(64, Math.max(34, r.width * 0.07)) });
    if (list.length > 260) list.splice(0, list.length - 260);
    lastPoint.current = p;
    redraw.current();
  }

  function next() {
    skip.current += 1;
    redraw.current();
  }

  const phrase = phrases[index];

  return (
    <section className="relative isolate flex min-h-[760px] w-full flex-col items-center justify-center overflow-hidden bg-[#0b0f0d] px-4 py-14">
      <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: "radial-gradient(70% 55% at 50% 40%, #18211c 0%, #0b0f0d 72%)" }} />

      {/* The window: a painted steel frame, the view, and the misted glass in front of it. */}
      <div style={{ background: "linear-gradient(180deg, #3a4f45 0%, #1f2d27 38%, #131c18 100%)" }} className="w-full max-w-[880px] rounded-[5px] bg-[#1d2a24] p-[12px] shadow-[0_70px_100px_-50px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-1px_0_rgba(0,0,0,0.6),0_0_0_1px_rgba(0,0,0,0.7)] sm:p-[20px]">
        <div
          ref={pane}
          onPointerMove={wipe}
          onPointerDown={wipe}
          onPointerEnter={() => (lastPoint.current = null)}
          onPointerLeave={() => (lastPoint.current = null)}
          className="relative aspect-[4/5] w-full cursor-crosshair touch-pan-y overflow-hidden rounded-[2px] bg-[#27503a] shadow-[0_0_0_1px_rgba(0,0,0,0.8),0_0_0_3px_#0f1713,0_1px_0_3px_rgba(255,255,255,0.12)] sm:aspect-[16/10]"
        >
          <img ref={picture} src={photo.src} alt={photo.alt} width={1600} height={1067} className="absolute inset-0 h-full w-full object-cover" />
          <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
          {/* Daylight on the outer face of the glass, and the frame's shadow falling across its top edge. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(112deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0) 26%, rgba(255,255,255,0) 68%, rgba(255,255,255,0.07) 100%)" }} />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 shadow-[inset_0_14px_22px_-10px_rgba(0,0,0,0.55),inset_0_0_40px_rgba(6,20,14,0.35)]" />
          <h2 className="sr-only" aria-live="polite">
            {phrase}
          </h2>
        </div>
      </div>

      <div className="mt-7 flex w-full max-w-[880px] items-center justify-between gap-4 px-1 text-[13px]">
        <p className="text-zinc-400">
          <span className="font-semibold text-zinc-100">Condensation</span>
          <span className="mx-2 text-zinc-600">/</span>
          drag across the glass to wipe it
        </p>
        <button
          type="button"
          onClick={next}
          className="min-h-[40px] shrink-0 rounded-full border border-white/15 px-4 text-zinc-100 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0f0d]"
        >
          Write the next line
        </button>
      </div>
    </section>
  );
}
