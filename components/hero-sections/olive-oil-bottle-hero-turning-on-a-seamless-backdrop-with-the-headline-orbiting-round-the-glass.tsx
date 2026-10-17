import { useEffect, useRef } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import { useReducedMotion } from "framer-motion";

// The words on the page and on the bottle. The headline is set twice round the ring so half of it always faces you.
const hero = {
  maker: "Halden Grove",
  note: "Early harvest, 500 ml",
  headline: "Worth the wait",
  line: "One grove, picked green in the first week of November and pressed the same night.",
  button: "Reserve a bottle",
  label: { top: "EARLY HARVEST", name: "Halden", sub: "GROVE", foot: "EXTRA VIRGIN OLIVE OIL", lot: "Lot 14  ·  500 ml" },
  back: ["Pressed within six hours", "of picking. Unfiltered.", "Keep cool and out of", "the light. Shake gently."],
};

/** How far the camera looks down on the bottle. It bends the label edges, the base and the ring of type together. */
const TILT = 0.15;
/** Seconds for one unaided turn of the bottle, and of the ring of type going the other way. */
const BOTTLE_TURN = 26;
const RING_TURN = 46;
/** Bottle height in units of its own body radius. */
const TALL = 7.2;
const LABEL_TOP = 4.25;
const LABEL_TALL = 2.3;
const TEX_W = 1536;
const TEX_H = Math.round((TEX_W * LABEL_TALL) / (Math.PI * 2));

const step = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Radius of the bottle at a height measured down from the top of the cap, both in body radii. */
function profile(y: number) {
  if (y < 0 || y > TALL) return 0;
  if (y < 0.82) return 0.375 - 0.05 * Math.pow(Math.max(0, 1 - y / 0.07), 2);
  if (y < 0.98) return 0.405;
  if (y < 1.9) return 0.315 + 0.03 * ((y - 0.98) / 0.92);
  if (y < 3.0) {
    const t = (y - 1.9) / 1.1;
    return 0.345 + 0.655 * Math.sqrt(1 - (1 - t) * (1 - t));
  }
  if (y < 7.0) return 1;
  const t = (y - 7.0) / 0.2;
  return 0.9 + 0.1 * Math.sqrt(Math.max(0, 1 - t * t));
}

/** What the glass mirrors: a tall window on the left with a glazing bar, a dim card on the right, a pale ceiling. */
function studio(rx: number, ry: number, rz: number) {
  const az = (Math.atan2(rx, rz) * 180) / Math.PI;
  const el = (Math.asin(Math.max(-1, Math.min(1, -ry))) * 180) / Math.PI;
  let light = 0.5 + 0.35 * step(-40, 60, el);
  const tall = step(-34, -22, el) * (1 - step(62, 80, el));
  const win = step(-74, -69, az) * (1 - step(-33, -29, az)) * tall;
  const bar = 1 - 0.85 * step(-56, -54.5, az) * (1 - step(-51.5, -50, az));
  light += 15 * win * bar;
  light += 2.4 * step(36, 44, az) * (1 - step(70, 82, az)) * tall;
  light += 5 * step(96, 104, az) * (1 - step(118, 126, az)) * tall;
  light += 1.6 * step(58, 78, el);
  return light;
}

/** Paints the bottle once, without its paper: black capsule, dark green glass, reflections and its shadow on the floor. */
function paintBottle(cv: HTMLCanvasElement, R: number, cx: number, top: number) {
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  const W = cv.width;
  const H = cv.height;
  ctx.clearRect(0, 0, W, H);

  // Shadow first: a tight dark pool under the base and a long soft one thrown to the right, away from the window.
  const floor = top + (TALL + TILT * 0.45) * R;
  const pool = (dx: number, sx: number, sy: number, a: number) => {
    ctx.save();
    ctx.translate(cx + dx * R, floor);
    ctx.scale(sx, sy);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
    g.addColorStop(0, `rgba(58,44,8,${a})`);
    g.addColorStop(0.55, `rgba(58,44,8,${a * 0.45})`);
    g.addColorStop(1, "rgba(58,44,8,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  pool(1.5, 2.9, 0.2, 0.3);
  pool(0.5, 1.7, 0.2, 0.42);
  pool(0.05, 1.12, 0.17, 0.85);
  // Light that has come through the oil lands as a green smear inside the long shadow.
  ctx.save();
  ctx.translate(cx + 1.25 * R, floor + 0.02 * R);
  ctx.scale(1.3, 0.1);
  const through = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
  through.addColorStop(0, "rgba(150,160,30,0.5)");
  through.addColorStop(1, "rgba(150,160,30,0)");
  ctx.fillStyle = through;
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const x0 = Math.max(0, Math.floor(cx - R - 2));
  const x1 = Math.min(W, Math.ceil(cx + R + 2));
  const y0 = Math.max(0, Math.floor(top - TILT * R - 2));
  const y1 = Math.min(H, Math.ceil(top + (TALL + TILT) * R + 2));
  const img = ctx.getImageData(x0, y0, x1 - x0, y1 - y0);
  const d = img.data;
  const capR = profile(0.1);

  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) {
      const xs = (px + 0.5 - cx) / R;
      const ys = (py + 0.5 - top) / R;
      // Each ring of the bottle is seen as a shallow ellipse, so find the height whose front edge passes through this pixel.
      let y = ys;
      for (let k = 0; k < 4; k++) {
        const r = profile(y);
        y = ys - TILT * Math.sqrt(Math.max(0, r * r - xs * xs));
      }
      const r = profile(y);
      let cr = 0;
      let cg = 0;
      let cb = 0;
      let cover = 0;
      if (y >= 0 && y <= TALL && Math.abs(xs) < r) {
        cover = Math.min(1, (r - Math.abs(xs)) * R);
        const slope = (profile(y + 0.012) - profile(y - 0.012)) / 0.024;
        const side = xs / r;
        const facing = Math.sqrt(Math.max(0, 1 - side * side));
        const len = Math.sqrt(1 + slope * slope);
        const nx = side / len;
        const ny = -slope / len;
        const nz = facing / len;
        // Mirror the view direction in the surface to see which part of the studio this point shows.
        const env = studio(2 * nz * nx, 2 * nz * ny, 2 * nz * nz - 1);
        const fres = 0.045 + 0.955 * Math.pow(1 - nz, 5);
        if (y < 0.98) {
          // Matte black capsule with fine vertical ribs and one soft sheen.
          const rib = 0.86 + 0.14 * Math.sin(Math.asin(side) * 46);
          const lit = 0.3 + 0.9 * Math.max(0, nx * -0.5 + ny * -0.42 + nz * 0.76);
          const sheen = Math.pow(Math.max(0, nx * -0.36 + ny * -0.3 + nz * 0.88), 26) * 70;
          const v = 24 * lit * rib + sheen + env * fres * 3;
          cr = v;
          cg = v;
          cb = v * 1.02;
          if (y > 0.82 && y < 0.86) {
            cr *= 0.5;
            cg *= 0.5;
            cb *= 0.5;
          }
        } else {
          // Dark green glass: nearly black face on, the room mirrored on top, and oil glowing where light gets through.
          const glow = step(0.1, 0.98, side) * 0.55 + step(6.55, 7.1, y) * (0.35 + 0.65 * step(-0.6, 0.9, side)) * 0.9;
          const thin = y < 3 ? 0.55 : 1;
          cr = 9 + 96 * glow * thin + env * fres * 236;
          cg = 17 + 112 * glow * thin + env * fres * 232;
          cb = 12 + 12 * glow * thin + env * fres * 214;
          // The thick base ring shows as a darker line just above the foot.
          const foot = step(6.93, 6.97, y) * (1 - step(7.0, 7.04, y));
          cr *= 1 - 0.45 * foot;
          cg *= 1 - 0.4 * foot;
          cb *= 1 - 0.45 * foot;
        }
      } else if (ys < TILT * capR) {
        // The flat top of the capsule, seen as a thin ellipse.
        const ex = xs / capR;
        const ey = ys / (TILT * capR);
        const q = ex * ex + ey * ey;
        if (q < 1) {
          cover = Math.min(1, (1 - Math.sqrt(q)) * capR * R);
          const v = 58 - 16 * ex;
          cr = v;
          cg = v;
          cb = v + 1;
        }
      }
      if (cover > 0) {
        const i = ((py - y0) * (x1 - x0) + (px - x0)) * 4;
        const under = d[i + 3] / 255;
        const keep = (1 - cover) * under;
        const a = cover + keep;
        d[i] = (Math.min(255, cr) * cover + d[i] * keep) / a;
        d[i + 1] = (Math.min(255, cg) * cover + d[i + 1] * keep) / a;
        d[i + 2] = (Math.min(255, cb) * cover + d[i + 2] * keep) / a;
        d[i + 3] = a * 255;
      }
    }
  }
  ctx.putImageData(img, x0, y0);
}

/** The light and shade that lies over the paper wherever it happens to be: darker toward the edges, a faint window sheen. */
function paintPaperLight(cv: HTMLCanvasElement, R: number) {
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  const img = ctx.createImageData(cv.width, cv.height);
  const d = img.data;
  for (let px = 0; px < cv.width; px++) {
    const side = Math.max(-0.999, Math.min(0.999, (px + 0.5 - R) / R));
    const nz = Math.sqrt(1 - side * side);
    const lit = (0.56 + 0.62 * Math.max(0, side * -0.42 + nz * 0.84)) * (0.6 + 0.4 * Math.pow(nz, 0.7));
    const az = (Math.asin(side) * 360) / Math.PI;
    const sheen = 0.045 * step(-84, -58, az) * (1 - step(-44, -18, az));
    for (let py = 0; py < cv.height; py++) {
      const i = (py * cv.width + px) * 4;
      if (lit < 1) {
        d[i] = 34;
        d[i + 1] = 30;
        d[i + 2] = 8;
        d[i + 3] = (1 - lit) * 255 * (1 - sheen * 3);
      } else {
        d[i] = d[i + 1] = d[i + 2] = 255;
        d[i + 3] = Math.min(1, (lit - 1) * 0.8 + sheen) * 255;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}

/** Prints the front and back labels flat, as one strip that wraps the whole way round the bottle (twice, so it can be read past the seam). */
function printLabels(): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = TEX_W * 2;
  cv.height = TEX_H;
  const c = cv.getContext("2d");
  if (!c) return cv;
  const ink = "#1f3a29";
  const serif = 'Georgia, "Times New Roman", serif';
  const paper = (x: number, y: number, w: number, h: number) => {
    c.fillStyle = "#f2ead6";
    c.fillRect(x, y, w, h);
    // Laid paper: faint darker fibres.
    for (let k = 0; k < 900; k++) {
      c.fillStyle = `rgba(120,100,60,${0.03 + Math.random() * 0.05})`;
      const long = 1 + Math.random() * 14;
      c.fillRect(x + Math.random() * (w - long), y + Math.random() * (h - 1), long, 1);
    }
  };
  for (let copy = 0; copy < 2; copy++) {
    const o = copy * TEX_W;
    // Front label, centred on the start of the strip, so it is drawn in two halves across the seam.
    const fw = TEX_W * 0.4;
    for (const fx of [o - fw / 2, o + TEX_W - fw / 2]) {
      const mid = fx + fw / 2;
      paper(fx, 0, fw, TEX_H);
      c.fillStyle = "#c8452b";
      c.fillRect(fx, 0, fw, TEX_H * 0.045);
      c.strokeStyle = ink;
      c.lineWidth = 3;
      c.strokeRect(fx + 24, TEX_H * 0.045 + 22, fw - 48, TEX_H * 0.955 - 46);
      c.fillStyle = ink;
      c.textAlign = "center";
      c.textBaseline = "middle";
      const spaced = (text: string, y: number, size: number, gap: number, weight = "600") => {
        c.font = `${weight} ${size}px ${serif}`;
        const widths = [...text].map((ch) => c.measureText(ch).width + gap);
        let x = mid - widths.reduce((a, b) => a + b, 0) / 2;
        [...text].forEach((ch, i) => {
          c.fillText(ch, x + widths[i] / 2, y);
          x += widths[i];
        });
      };
      spaced(hero.label.top, TEX_H * 0.17, 23, 9);
      // An olive sprig: a bowed stem, leaves in pairs, two fruit.
      c.save();
      c.translate(mid, TEX_H * 0.33);
      c.strokeStyle = ink;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(-120, 16);
      c.quadraticCurveTo(0, -22, 120, 10);
      c.stroke();
      for (let k = 0; k < 7; k++) {
        const t = k / 6;
        const lx = -112 + t * 224;
        const ly = 16 - 26 * Math.sin(t * Math.PI) * 0.9 + (t > 0.5 ? (t - 0.5) * -8 : 0);
        for (const up of [-1, 1]) {
          c.save();
          c.translate(lx, ly);
          c.rotate(up * (0.75 - t * 0.25) - 0.1);
          c.beginPath();
          c.ellipse(21, 0, 23, 6.5, 0, 0, Math.PI * 2);
          c.fillStyle = up < 0 ? ink : "#55713a";
          c.fill();
          c.restore();
        }
      }
      c.fillStyle = "#c8452b";
      for (const [ox, oy] of [[-34, 34], [46, 30]]) {
        c.beginPath();
        c.ellipse(ox, oy, 10, 13, 0.2, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
      c.fillStyle = ink;
      c.font = `italic 400 ${Math.round(TEX_H * 0.27)}px ${serif}`;
      c.fillText(hero.label.name, mid, TEX_H * 0.575);
      spaced(hero.label.sub, TEX_H * 0.735, 34, 22, "400");
      c.fillRect(mid - 26, TEX_H * 0.805, 52, 2);
      spaced(hero.label.foot, TEX_H * 0.865, 17, 5);
      spaced(hero.label.lot, TEX_H * 0.925, 16, 3, "400");
    }
    // Back label: smaller, lower, plain.
    const bw = TEX_W * 0.2;
    const bx = o + TEX_W * 0.5 - bw / 2;
    const by = TEX_H * 0.24;
    const bh = TEX_H * 0.6;
    paper(bx, by, bw, bh);
    c.fillStyle = ink;
    c.textAlign = "left";
    c.font = `italic 400 30px ${serif}`;
    c.fillText(hero.label.name, bx + 26, by + 44);
    c.fillRect(bx + 26, by + 70, bw - 52, 1.5);
    c.font = `400 17px ${serif}`;
    hero.back.forEach((text, i) => c.fillText(text, bx + 26, by + 104 + i * 27));
    c.fillRect(bx + 26, by + bh - 74, bw - 52, 1.5);
    c.font = `600 15px ${serif}`;
    c.fillText(hero.label.lot, bx + 26, by + bh - 42);
  }
  return cv;
}

export default function OliveOilBottleHeroTurningOnASeamlessBackdropWithTheHeadlineOrbitingRoundTheGlass() {
  const reduce = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  /** Bottle angle in turns, its spin in turns per second, and the drag in progress if there is one. */
  const spin = useRef({ angle: 0, speed: 0, ringAngle: 0, dragX: null as number | null, dragAt: 0, radius: 70 });

  const once = [...hero.headline, " ", "•", " "];
  const letters = [...once, ...once];

  useEffect(() => {
    const el = stage.current;
    const cv = canvas.current;
    const band = ring.current;
    if (!el || !cv || !band) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const glyphs = Array.from(band.children) as HTMLElement[];
    const texture = printLabels();
    const body = document.createElement("canvas");
    const paper = document.createElement("canvas");
    const light = document.createElement("canvas");
    const idle = reduce ? 0 : 1 / BOTTLE_TURN;
    const s = spin.current;
    // Start a little before the label faces front, so it is square on a couple of seconds in.
    s.angle = reduce ? -0.02 : -0.02 - idle * 2.6;
    s.speed = idle;
    s.ringAngle = reduce ? 0 : 2.6 / RING_TURN;

    let R = 70;
    let cx = 0;
    let top = 0;
    let ringR = 300;
    let ringY = 0;
    let offsets: number[] = [];
    let widths: number[] = [];
    let glyphH = 0;
    let visible = true;
    let raf = 0;
    let last = 0;
    let drawn = NaN;

    const layout = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const r = Math.min(h * 0.122, w * 0.15, 82);
      R = Math.round(r * ratio);
      s.radius = r;
      cv.width = Math.round(w * ratio);
      cv.height = Math.round(h * ratio);
      cx = Math.round(cv.width / 2);
      top = Math.round(h * 0.035 * ratio + TILT * R);
      body.width = cv.width;
      body.height = cv.height;
      paintBottle(body, R, cx, top);
      paper.width = light.width = R * 2;
      paper.height = light.height = Math.ceil((LABEL_TALL + TILT) * R) + 2;
      paintPaperLight(light, R);

      // Set the type so that the whole string exactly closes the ring.
      ringR = Math.min(w * 0.4, 430);
      ringY = top / ratio + 2.95 * r;
      band.style.fontSize = "100px";
      glyphs.forEach((g) => (g.style.transform = "none"));
      const raw = glyphs.map((g) => g.getBoundingClientRect().width);
      const total = raw.reduce((a, b) => a + b, 0) || 1;
      const size = (100 * Math.PI * 2 * ringR) / total;
      band.style.fontSize = `${size}px`;
      widths = raw.map((v) => (v * size) / 100);
      glyphH = glyphs[0] ? glyphs[0].offsetHeight : size;
      let run = 0;
      offsets = widths.map((v) => {
        const mid = run + v / 2;
        run += v;
        return mid / ((total * size) / 100);
      });
      drawn = NaN;
    };

    const draw = () => {
      const turn = s.angle - Math.floor(s.angle);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(body, 0, 0);
      // The paper: one thin slice of the flat print per column, squeezed toward the edges as the glass curves away.
      const pc = paper.getContext("2d");
      if (pc) {
        pc.globalCompositeOperation = "source-over";
        pc.clearRect(0, 0, paper.width, paper.height);
        const tall = LABEL_TALL * R;
        for (let px = 0; px < R * 2; px++) {
          const a = Math.max(-1, Math.min(1, (px - R) / R));
          const b = Math.max(-1, Math.min(1, (px + 1 - R) / R));
          const ua = Math.asin(a) / (Math.PI * 2);
          const ub = Math.asin(b) / (Math.PI * 2);
          const from = (((ua - turn) % 1) + 1) % 1;
          const facing = Math.sqrt(1 - ((a + b) / 2) * ((a + b) / 2));
          pc.drawImage(texture, from * TEX_W, 0, Math.max(0.5, (ub - ua) * TEX_W), TEX_H, px, Math.round(TILT * R * facing), 1, Math.round(tall));
        }
        pc.globalCompositeOperation = "source-atop";
        pc.drawImage(light, 0, 0);
        ctx.drawImage(paper, cx - R, top + LABEL_TOP * R);
      }

      // The headline: each letter rides a tilted circle, shrinks and mirrors as it goes round the back, and drops behind the glass.
      const cssX = el.clientWidth / 2;
      for (let i = 0; i < glyphs.length; i++) {
        const th = (offsets[i] - 0.22 + s.ringAngle) * Math.PI * 2;
        const z = Math.cos(th);
        const depth = 1 + 0.13 * z;
        const x = cssX + ringR * Math.sin(th) - widths[i] / 2;
        const y = ringY + TILT * ringR * z - glyphH / 2;
        const g = glyphs[i];
        g.style.transform = `matrix(${(depth * z).toFixed(4)},${(-depth * TILT * Math.sin(th)).toFixed(4)},0,${depth.toFixed(4)},${x.toFixed(2)},${y.toFixed(2)})`;
        // Edge on, a letter is a sliver, so it fades out for the moment it turns over.
        g.style.opacity = ((0.34 + 0.66 * step(-0.3, 0.2, z)) * step(0.04, 0.22, Math.abs(z))).toFixed(3);
        g.style.zIndex = z > 0 ? "30" : "10";
      }
    };

    const loop = (stamp: number) => {
      const dt = Math.min(last ? (stamp - last) / 1000 : 0.016, 0.05);
      last = stamp;
      if (s.dragX === null) {
        // Let go, the bottle coasts and settles back to its slow unaided turn.
        s.speed += (idle - s.speed) * Math.min(1, dt * 1.1);
        s.angle += s.speed * dt;
      }
      if (!reduce) s.ringAngle += (-1 / RING_TURN - (s.speed - idle) * 0.22) * dt;
      else s.ringAngle -= s.speed * 0.22 * dt;
      const key = s.angle * 7 + s.ringAngle;
      if (key !== drawn) {
        draw();
        drawn = key;
      }
      raf = visible && !document.hidden ? requestAnimationFrame(loop) : 0;
    };
    const wake = () => {
      if (!raf && visible && !document.hidden) {
        last = 0;
        raf = requestAnimationFrame(loop);
      }
    };

    layout();
    draw();
    const ro = new ResizeObserver(() => {
      layout();
      draw();
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
    };
  }, [reduce]);

  function grab(e: ReactPointerEvent<HTMLButtonElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    spin.current.dragX = e.clientX;
    spin.current.dragAt = performance.now();
    spin.current.speed = 0;
  }
  function drag(e: ReactPointerEvent<HTMLButtonElement>) {
    const s = spin.current;
    if (s.dragX === null) return;
    const now = performance.now();
    // Moving the hand one bottle radius turns the surface by the same distance.
    const turned = (e.clientX - s.dragX) / (s.radius * Math.PI * 2);
    const dt = Math.max(0.008, (now - s.dragAt) / 1000);
    s.angle += turned;
    s.speed = s.speed * 0.6 + (turned / dt) * 0.4;
    s.dragX = e.clientX;
    s.dragAt = now;
  }
  function release() {
    const s = spin.current;
    s.dragX = null;
    s.speed = Math.max(-1.6, Math.min(1.6, s.speed));
  }
  function onKey(e: ReactKeyboardEvent<HTMLButtonElement>) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    spin.current.speed = e.key === "ArrowRight" ? 0.5 : -0.5;
    if (reduce) spin.current.angle += e.key === "ArrowRight" ? 0.06 : -0.06;
  }

  return (
    <section className="relative isolate h-[700px] w-full overflow-hidden bg-[#e6d49c] sm:h-[820px]">
      <style>{`
        .oob-glyph { position: absolute; left: 0; top: 0; display: block; white-space: pre; line-height: 1; transform-origin: 50% 50%; will-change: transform, opacity; }
      `}</style>
      {/* The paper sweep: wall above, floor below, with no visible join. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10" style={{ background: "radial-gradient(90% 55% at 42% 30%, #f3e6b8 0%, #e6d49c 55%, #d6c184 100%)" }} />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-[30%]" style={{ background: "linear-gradient(180deg, rgba(214,193,132,0) 0%, rgba(201,178,112,0.75) 100%)" }} />

      <header className="absolute inset-x-0 top-0 z-40 flex items-center justify-between px-5 pt-5 text-[13px] font-medium text-[#1f3a29] sm:px-10 sm:pt-8">
        <span className="font-serif text-[17px] italic">{hero.maker}</span>
        <span>{hero.note}</span>
      </header>

      <h1 className="sr-only">{hero.headline}</h1>

      <div ref={stage} className="absolute inset-x-0 top-[52px] h-[470px] sm:top-[40px] sm:h-[640px]">
        <div ref={ring} aria-hidden="true" className="pointer-events-none absolute inset-0 select-none font-serif text-[#bd3a1f]">
          {letters.map((ch, i) => (
            <span key={i} className="oob-glyph">
              {ch}
            </span>
          ))}
        </div>
        <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 h-full w-full" />
        <button
          type="button"
          aria-label="Turn the bottle. Drag it sideways, or use the left and right arrow keys."
          onPointerDown={grab}
          onPointerMove={drag}
          onPointerUp={release}
          onPointerCancel={release}
          onKeyDown={onKey}
          className="absolute left-1/2 top-[3%] z-40 h-[94%] w-[150px] -translate-x-1/2 cursor-grab touch-pan-y rounded-[40px] active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f3a29] focus-visible:ring-offset-4 focus-visible:ring-offset-[#e6d49c] sm:w-[190px]"
        />
      </div>

      <div className="absolute inset-x-0 bottom-0 z-40 flex flex-col items-center gap-5 px-6 pb-7 text-center sm:pb-9">
        <p className="max-w-[21rem] text-[14px] font-medium leading-snug text-[#1f3a29] sm:max-w-md sm:text-[15px]">{hero.line}</p>
        <a
          href="#"
          className="inline-flex h-12 items-center rounded-full bg-[#1f3a29] px-7 text-[15px] font-semibold text-[#f6efd6] shadow-[0_14px_26px_-14px_rgba(31,58,41,0.9)] transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1f3a29] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e6d49c] motion-reduce:transition-none"
        >
          {hero.button}
        </a>
      </div>
    </section>
  );
}
