import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { motion, useAnimationFrame, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";

// Everything a visitor would change lives here. The photograph must be shot against one plain backdrop colour.
const hero = {
  studio: "Face Value",
  place: "Portrait studio, Leith",
  behind: "FACE",
  inFront: "VALUE",
  line: "One sitter, one hour, one roll of film. Sittings by appointment, Tuesday to Saturday.",
  button: "Book a sitting",
  photo: "https://images.pexels.com/photos/32174976/pexels-photo-32174976.jpeg?auto=compress&cs=tinysrgb&w=1100",
  alt: "A woman with a round afro and tassel earrings in a black top, both hands raised to her hair, looking past the camera",
};

/** How far a pixel must be from the backdrop colour to start counting as the sitter, and where it is fully her. */
const KEY_FROM = 26;
const KEY_TO = 70;
/** Width the backdrop is studied at. The cut-out itself is drawn at the photo's full size. */
const STUDY = 560;
/** Enclosed backdrop-coloured patches smaller than this many studied pixels are kept as part of the sitter. */
const POCKET = 140;

/** Solves a small set of linear equations in place. Used to fit a smooth backdrop colour across the frame. */
function solve(m: number[][], v: number[]) {
  const n = v.length;
  for (let c = 0; c < n; c++) {
    let best = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(m[r][c]) > Math.abs(m[best][c])) best = r;
    [m[c], m[best]] = [m[best], m[c]];
    [v[c], v[best]] = [v[best], v[c]];
    const d = m[c][c] || 1e-9;
    for (let r = c + 1; r < n; r++) {
      const f = m[r][c] / d;
      for (let k = c; k < n; k++) m[r][k] -= f * m[c][k];
      v[r] -= f * v[c];
    }
  }
  const out = new Array<number>(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = v[r];
    for (let k = r + 1; k < n; k++) s -= m[r][k] * out[k];
    out[r] = s / (m[r][r] || 1e-9);
  }
  return out;
}

/**
 * Lifts the sitter off a plain backdrop. It learns the backdrop from the top and side margins of the frame
 * (including any soft falloff of light across it), then keeps everything that is not backdrop, plus any
 * backdrop-coloured patch that the backdrop cannot reach from the edges (lips, a red earring).
 */
function cutOut(img: HTMLImageElement, target: HTMLCanvasElement) {
  const w = STUDY;
  const h = Math.round((STUDY * img.naturalHeight) / img.naturalWidth);
  const small = document.createElement("canvas");
  small.width = w;
  small.height = h;
  const sc = small.getContext("2d", { willReadFrequently: true });
  const out = target.getContext("2d");
  if (!sc || !out) return false;
  sc.drawImage(img, 0, 0, w, h);
  const px = sc.getImageData(0, 0, w, h);
  const d = px.data;

  const terms = (x: number, y: number) => [1, x, y, x * x, y * y, x * y];
  const inMargin = (x: number, y: number) => y < h * 0.8 && (y < h * 0.06 || x < w * 0.04 || x > w * 0.96);
  // A first rough backdrop colour, so that anything else in the margins (a sleeve, a shoulder) is left out of the fit.
  let n = 0;
  const mean = [0, 0, 0];
  for (let y = 0; y < h; y += 3)
    for (let x = 0; x < w; x += 3)
      if (inMargin(x, y) && y < h * 0.3) {
        const i = (y * w + x) * 4;
        mean[0] += d[i];
        mean[1] += d[i + 1];
        mean[2] += d[i + 2];
        n++;
      }
  if (!n) return false;
  mean.forEach((_, c) => (mean[c] /= n));

  const A = Array.from({ length: 6 }, () => new Array<number>(6).fill(0));
  const B = [new Array<number>(6).fill(0), new Array<number>(6).fill(0), new Array<number>(6).fill(0)];
  for (let y = 0; y < h; y += 2)
    for (let x = 0; x < w; x += 2) {
      if (!inMargin(x, y)) continue;
      const i = (y * w + x) * 4;
      if (Math.abs(d[i] - mean[0]) + Math.abs(d[i + 1] - mean[1]) + Math.abs(d[i + 2] - mean[2]) > 110) continue;
      const t = terms(x / w, y / h);
      for (let a = 0; a < 6; a++) {
        for (let b = 0; b < 6; b++) A[a][b] += t[a] * t[b];
        for (let c = 0; c < 3; c++) B[c][a] += t[a] * d[i + c];
      }
    }
  const fit = B.map((b) => solve(A.map((row) => row.slice()), b.slice()));

  const total = w * h;
  const alpha = new Float32Array(total);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const t = terms(x / w, y / h);
      let dist = 0;
      for (let c = 0; c < 3; c++) {
        let bg = 0;
        for (let a = 0; a < 6; a++) bg += fit[c][a] * t[a];
        const diff = d[i * 4 + c] - bg;
        dist += diff * diff;
      }
      const k = Math.min(1, Math.max(0, (Math.sqrt(dist) - KEY_FROM) / (KEY_TO - KEY_FROM)));
      // The top sliver of a studio frame often catches the edge of the paper roll, so it is dropped.
      alpha[i] = y < h * 0.03 ? 0 : k * k * (3 - 2 * k);
    }

  // Flood in from the top and sides: only backdrop that connects to the edge of the frame is removed.
  const reached = new Uint8Array(total);
  const stack = new Int32Array(total);
  let top = 0;
  const visit = (i: number) => {
    if (!reached[i] && alpha[i] < 0.999) {
      reached[i] = 1;
      stack[top++] = i;
    }
  };
  for (let x = 0; x < w; x++) visit(x);
  for (let y = 0; y < h; y++) {
    visit(y * w);
    visit(y * w + w - 1);
  }
  while (top) {
    const i = stack[--top];
    const x = i % w;
    if (x > 0) visit(i - 1);
    if (x < w - 1) visit(i + 1);
    if (i >= w) visit(i - w);
    if (i < total - w) visit(i + w);
  }
  // Backdrop the flood could not reach (the gap between an arm and the neck) is also removed, but only when the
  // patch is clearly backdrop and big enough not to be a mouth or a bead.
  const patch = new Int32Array(total);
  for (let start = 0; start < total; start++) {
    if (reached[start] || alpha[start] > 0.2) continue;
    let size = 0;
    top = 0;
    reached[start] = 2;
    stack[top++] = start;
    while (top) {
      const i = stack[--top];
      patch[size++] = i;
      const x = i % w;
      const near = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w];
      for (const j of near)
        if (j >= 0 && j < total && !reached[j] && alpha[j] <= 0.2) {
          reached[j] = 2;
          stack[top++] = j;
        }
    }
    if (size < POCKET) for (let k = 0; k < size; k++) reached[patch[k]] = 3;
  }
  for (let i = 0; i < total; i++) {
    d[i * 4 + 3] = Math.round((reached[i] === 1 || reached[i] === 2 ? alpha[i] : 1) * 255);
  }
  sc.putImageData(px, 0, 0);

  target.width = img.naturalWidth;
  target.height = img.naturalHeight;
  out.drawImage(img, 0, 0);
  out.globalCompositeOperation = "destination-in";
  out.imageSmoothingEnabled = true;
  out.imageSmoothingQuality = "high";
  out.drawImage(small, 0, 0, target.width, target.height);
  out.globalCompositeOperation = "source-over";
  return true;
}

export default function PortraitStudioHeroWithAGiantHeadlineThatPassesBehindTheSitterAndInFrontOfHer() {
  const reduce = useReducedMotion();
  const stage = useRef<HTMLElement>(null);
  const photo = useRef<HTMLImageElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const backWord = useRef<HTMLSpanElement>(null);
  const frontWord = useRef<HTMLSpanElement>(null);
  /** "cut" once the sitter has been lifted off her backdrop, "plain" if the photo could not be read. */
  const [state, setState] = useState<"wait" | "cut" | "plain">("wait");
  const steered = useRef(-1e6);

  // One shared pointer position, from -1 to 1 each way. Each layer moves by a different amount of it.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 60, damping: 16, mass: 1.1 });
  const sy = useSpring(py, { stiffness: 60, damping: 16, mass: 1.1 });
  /** Narrow screens get a smaller swing, so the front word never leaves the frame. */
  const reach = useRef(1);
  const backX = useTransform(sx, (v) => v * -26 * reach.current);
  const backY = useTransform(sy, (v) => v * -10 * reach.current);
  const midX = useTransform(sx, (v) => v * 12 * reach.current);
  const midY = useTransform(sy, (v) => v * 5 * reach.current);
  const frontX = useTransform(sx, (v) => v * 46 * reach.current);
  const frontY = useTransform(sy, (v) => v * 16 * reach.current);
  const shadow = useTransform([sx, sy], ([x, y]: number[]) => `drop-shadow(${-30 - x * 22}px ${20 - y * 10}px 26px rgba(60,2,6,0.62))`);

  // With nobody steering, the camera drifts a little from side to side so the three layers keep sliding apart.
  useAnimationFrame((t) => {
    if (reduce || performance.now() - steered.current < 2400) return;
    px.set(Math.sin(t / 2300 + 0.9) * 0.8);
    py.set(Math.sin(t / 3100) * 0.5);
  });

  useEffect(() => {
    const img = photo.current;
    const cv = canvas.current;
    if (!img || !cv) return;
    const run = () => {
      if (!img.naturalWidth) return;
      try {
        setState(cutOut(img, cv) ? "cut" : "plain");
      } catch {
        // The photo host did not let the page read the picture: show it uncut, with the whole headline in front.
        setState("plain");
      }
    };
    const fail = () => setState("plain");
    if (img.complete) run();
    img.addEventListener("load", run);
    img.addEventListener("error", fail);
    return () => {
      img.removeEventListener("load", run);
      img.removeEventListener("error", fail);
    };
  }, []);

  // Both words are set to the same measure, like a poster, whatever font the visitor's system supplies.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const fitWords = () => {
      const measure = Math.min(el.clientWidth * 0.8, 960);
      reach.current = Math.min(1, el.clientWidth / 1200);
      [backWord.current, frontWord.current].forEach((word) => {
        if (!word) return;
        word.style.fontSize = "100px";
        const wide = word.getBoundingClientRect().width || 1;
        word.style.fontSize = `${(100 * measure) / wide}px`;
      });
    };
    fitWords();
    const ro = new ResizeObserver(fitWords);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function steer(e: ReactPointerEvent<HTMLElement>) {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set(((e.clientX - r.left) / r.width) * 2 - 1);
    py.set(((e.clientY - r.top) / r.height) * 2 - 1);
    steered.current = performance.now();
  }

  const word = "block whitespace-nowrap font-sans font-black leading-[0.76] tracking-[-0.065em] text-[#fff6ec] will-change-transform";

  return (
    <section
      ref={stage}
      onPointerMove={steer}
      className="relative isolate h-[640px] w-full overflow-hidden bg-[#d62a28] sm:h-[800px]"
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: "radial-gradient(70% 60% at 50% 38%, #ea3a33 0%, #d62a28 45%, #b01c20 100%)" }} />

      <header className="absolute inset-x-0 top-0 z-40 flex items-center justify-between px-5 pt-5 text-[13px] font-medium text-[#fff6ec] sm:px-10 sm:pt-8">
        <span className="font-semibold tracking-tight">{hero.studio}</span>
        <span>{hero.place}</span>
      </header>

      <h1 className="sr-only">
        {hero.behind} {hero.inFront}
      </h1>

      {/* Furthest away: the first word, a touch soft, with the sitter's shadow falling across it. */}
      <motion.div aria-hidden="true" style={{ x: backX, y: backY }} className="absolute inset-x-0 top-[12%] z-10 flex justify-center sm:top-[5%]">
        <span ref={backWord} className={`${word} text-[31vw] blur-[0.6px]`}>
          {hero.behind}
        </span>
      </motion.div>

      {/* In the middle: the sitter, standing on the bottom edge of the section. */}
      <div className="absolute inset-x-0 bottom-[-12px] z-20 flex h-[80%] justify-center sm:h-[94%]">
      <motion.div style={{ x: midX, y: midY }} className="relative aspect-[900/1353] h-full">
        <img
          ref={photo}
          src={hero.photo}
          alt={hero.alt}
          crossOrigin="anonymous"
          width={1100}
          height={1654}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${state === "plain" ? "opacity-100" : "opacity-0"}`}
          style={{ maskImage: "radial-gradient(75% 70% at 50% 55%, #000 60%, transparent 100%)", WebkitMaskImage: "radial-gradient(75% 70% at 50% 55%, #000 60%, transparent 100%)" }}
        />
        <motion.canvas
          ref={canvas}
          aria-hidden="true"
          style={{ filter: shadow }}
          className={`absolute inset-0 h-full w-full transition-opacity duration-500 ${state === "cut" ? "opacity-100" : "opacity-0"}`}
        />
      </motion.div>
      </div>

      {/* Nearest: the second word, crossing in front of her and throwing its own shadow back onto her. */}
      <motion.div aria-hidden="true" style={{ x: frontX, y: frontY }} className="absolute inset-x-0 bottom-[21%] z-30 flex justify-center sm:bottom-[15%]">
        <span ref={frontWord} className={`${word} text-[25vw]`} style={{ textShadow: "-14px 22px 34px rgba(40,2,6,0.55), -2px 3px 4px rgba(40,2,6,0.35)" }}>
          {hero.inFront}
        </span>
      </motion.div>

      <div className="absolute inset-x-0 bottom-0 z-40 flex items-end justify-between gap-4 px-5 pb-5 sm:px-10 sm:pb-8">
        <p className="max-w-[15rem] text-[13px] font-medium leading-snug text-[#fff6ec] sm:max-w-xs sm:text-[15px]">{hero.line}</p>
        <a
          href="#"
          className="inline-flex h-11 shrink-0 items-center rounded-full bg-[#fff6ec] px-5 text-[14px] font-semibold text-[#3a0709] shadow-[0_10px_24px_-10px_rgba(40,2,6,0.8)] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#b01c20] motion-reduce:transition-none sm:h-12 sm:px-7 sm:text-[15px]"
        >
          {hero.button}
        </a>
      </div>
    </section>
  );
}
