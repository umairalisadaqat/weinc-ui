import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useReducedMotion } from "framer-motion";

/** The print on the wall. */
const PHOTO = "https://images.pexels.com/photos/15759123/pexels-photo-15759123.jpeg?auto=compress&cs=tinysrgb&w=1200";
const PHOTO_ALT = "Studio portrait of a woman in round sunglasses and a pale jacket, seen in profile with a long ponytail";

/**
 * Sets of coloured gels for the three spotlights. Each lamp has a colour and the
 * direction it shines from, as seen from the ball: right, down, towards you.
 * Lamps set to the side or overhead throw the squarest flecks on the wall.
 */
const gels = [
  { name: "Late set", lamps: [{ tint: [255, 236, 205], from: [-0.2, -1, 0.34] }, { tint: [255, 62, 150], from: [-1, -0.34, 0.26] }, { tint: [70, 170, 255], from: [1, -0.16, 0.3] }] },
  { name: "Amber room", lamps: [{ tint: [255, 222, 170], from: [-0.2, -1, 0.34] }, { tint: [255, 120, 40], from: [-1, -0.34, 0.26] }, { tint: [255, 60, 70], from: [1, -0.16, 0.3] }] },
  { name: "Cold blue", lamps: [{ tint: [235, 244, 255], from: [-0.2, -1, 0.34] }, { tint: [80, 110, 255], from: [-1, -0.34, 0.26] }, { tint: [60, 230, 210], from: [1, -0.16, 0.3] }] },
];

const ball = {
  /** Rows of mirror tiles from pole to pole, and tiles round the equator. */
  rows: 23,
  around: 46,
  /** How unevenly the tiles are glued on, in radians. This is what makes the flecks irregular. */
  wobble: 0.014,
  /** Resting speed in turns of a radian per second. */
  idle: 0.42,
  /** How far the ball hangs from the wall, as a share of the stage height. */
  standoff: 0.4,
  /** How much of full daylight the room keeps. The flecks show the print at full brightness. */
  room: 0.3,
};

type Tile = { c: number[]; n: number[]; q: number[][]; silver: number };

function buildTiles(): Tile[] {
  const tiles: Tile[] = [];
  let seed = 7;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const at = (lat: number, lon: number) => [Math.cos(lat) * Math.sin(lon), -Math.sin(lat), Math.cos(lat) * Math.cos(lon)];
  const band = (Math.PI * 0.93) / ball.rows;
  for (let j = 0; j < ball.rows; j++) {
    const lat = -Math.PI * 0.465 + band * (j + 0.5);
    const count = Math.max(6, Math.round(ball.around * Math.cos(lat)));
    const step = (Math.PI * 2) / count;
    const shift = rnd() * step * 0.5;
    for (let i = 0; i < count; i++) {
      const lon = shift + i * step;
      const g = 0.46; // a tile fills 92% of its cell; the rest is the dark gap between tiles
      const q = [at(lat - band * g, lon - step * g), at(lat - band * g, lon + step * g), at(lat + band * g, lon + step * g), at(lat + band * g, lon - step * g)];
      const c = at(lat, lon);
      const n = [c[0] + (rnd() - 0.5) * 2 * ball.wobble, c[1] + (rnd() - 0.5) * 2 * ball.wobble, c[2] + (rnd() - 0.5) * 2 * ball.wobble];
      const l = Math.hypot(n[0], n[1], n[2]);
      tiles.push({ c, n: [n[0] / l, n[1] / l, n[2] / l], q, silver: 0.72 + rnd() * 0.4 });
    }
  }
  return tiles;
}

const unit = (v: number[]) => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};

export default function MirrorBallPortrait() {
  const reduce = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const print = useRef<HTMLImageElement>(null);
  const orb = useRef<HTMLButtonElement>(null);
  const [gel, setGel] = useState(0);
  const gelNow = useRef(0);
  gelNow.current = gel;
  const spin = useRef({ speed: ball.idle, dir: 1, drag: false, lastX: 0, lastT: 0, travelled: 0 });
  const spot = useRef({ x: 0, y: 0 });
  const redraw = useRef<() => void>(() => {});

  useEffect(() => {
    const cv = canvas.current;
    const el = stage.current;
    const img = print.current;
    const orbEl = orb.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !el || !img || !orbEl || !ctx) return;

    const tiles = buildTiles();
    const dim = document.createElement("canvas");
    const lit = document.createElement("canvas");
    const light = document.createElement("canvas");
    const px = light.getContext("2d")!;
    const mask = document.createElement("canvas");
    const mx2 = mask.getContext("2d")!;
    const glowDot = document.createElement("canvas");
    glowDot.width = glowDot.height = 64;
    {
      const g = glowDot.getContext("2d")!;
      const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, "rgba(255,255,255,1)");
      grad.addColorStop(0.18, "rgba(255,255,255,0.55)");
      grad.addColorStop(0.5, "rgba(255,255,255,0.1)");
      grad.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, 64, 64);
    }

    const grainTile = document.createElement("canvas");
    grainTile.width = grainTile.height = 128;
    {
      const g = grainTile.getContext("2d")!;
      const data = g.createImageData(128, 128);
      let seed = 11;
      for (let i = 0; i < data.data.length; i += 4) {
        seed = (seed * 16807) % 2147483647;
        const v = seed % 256;
        data.data[i] = data.data[i + 1] = data.data[i + 2] = v;
        data.data[i + 3] = 255;
      }
      g.putImageData(data, 0, 0);
    }

    // One soft disc of light per lamp, white-hot in the middle.
    const blobs: { key: string; cv: HTMLCanvasElement }[] = [];
    const blobFor = (k: number, tint: number[]) => {
      const key = tint.join(",");
      if (blobs[k]?.key === key) return blobs[k].cv;
      const c = document.createElement("canvas");
      c.width = c.height = 96;
      const g = c.getContext("2d")!;
      const grad = g.createRadialGradient(48, 48, 0, 48, 48, 48);
      const hot = tint.map((v) => Math.round(v + (255 - v) * 0.55)).join(",");
      grad.addColorStop(0, `rgba(${hot},1)`);
      grad.addColorStop(0.55, `rgba(${key},1)`);
      grad.addColorStop(0.74, `rgba(${key},0.72)`);
      grad.addColorStop(0.88, `rgba(${key},0.12)`);
      grad.addColorStop(1, `rgba(${key},0)`);
      g.fillStyle = grad;
      g.fillRect(0, 0, 96, 96);
      blobs[k] = { key, cv: c };
      return c;
    };

    let W = 1;
    let H = 1;
    let dpr = 1;
    let bx = 0;
    let by = 0;
    let R = 60;
    let angle = 0.6;
    let raf = 0;
    let visible = true;
    let before = 0;
    const key = { x: 0, y: 0 };

    /** The room twice over: once as it looks in the dark, once as it would look fully lit. */
    const paintRoom = () => {
      const s = el.getBoundingClientRect();
      const p = img.getBoundingClientRect();
      const px = p.left - s.left;
      const py = p.top - s.top;
      const edge = Math.max(5, p.width * 0.026);
      for (const [target, bright] of [[dim, false], [lit, true]] as const) {
        target.width = cv.width;
        target.height = cv.height;
        const c = target.getContext("2d")!;
        c.setTransform(dpr, 0, 0, dpr, 0, 0);
        // The painted wall, a little lighter where the room's own light pools.
        const wall = c.createRadialGradient(W * 0.5, H * 0.46, 0, W * 0.5, H * 0.46, Math.max(W, H) * 0.75);
        if (bright) {
          wall.addColorStop(0, "#b9b0bd");
          wall.addColorStop(1, "#8f8695");
        } else {
          wall.addColorStop(0, "#191520");
          wall.addColorStop(1, "#0a080d");
        }
        c.fillStyle = wall;
        c.fillRect(0, 0, W, H);
        // Fine plaster grain, which also keeps the dark gradient from showing bands.
        c.globalAlpha = bright ? 0.04 : 0.03;
        c.fillStyle = c.createPattern(grainTile, "repeat")!;
        c.fillRect(0, 0, W, H);
        c.globalAlpha = 1;
        // The print: a soft shadow under it, its white paper border, then the photograph.
        if (!bright) {
          c.shadowColor = "rgba(0,0,0,0.75)";
          c.shadowBlur = 44;
          c.shadowOffsetY = 22;
        }
        c.fillStyle = bright ? "#f6f2ea" : "#2f2c33";
        c.fillRect(px - edge, py - edge, p.width + edge * 2, p.height + edge * 2);
        c.shadowColor = "transparent";
        if (img.complete && img.naturalWidth > 0) {
          const scale = Math.max(p.width / img.naturalWidth, p.height / img.naturalHeight);
          const sw = p.width / scale;
          const sh = p.height / scale;
          c.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) * 0.3, sw, sh, px, py, p.width, p.height);
        } else {
          c.fillStyle = "#8d8a8c";
          c.fillRect(px, py, p.width, p.height);
        }
        if (!bright) {
          c.fillStyle = `rgba(9,7,16,${1 - ball.room})`;
          c.fillRect(px, py, p.width, p.height);
        }
      }
    };

    const resize = () => {
      const s = el.getBoundingClientRect();
      W = Math.max(1, s.width);
      H = Math.max(1, s.height);
      dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), 1.5);
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      light.width = cv.width;
      light.height = cv.height;
      mask.width = Math.ceil(cv.width / 2);
      mask.height = Math.ceil(cv.height / 2);
      const o = orbEl.getBoundingClientRect();
      R = o.width / 2;
      bx = o.left - s.left + R;
      by = o.top - s.top + R;
      paintRoom();
      draw();
    };

    const draw = () => {
      const lamps = gels[gelNow.current].lamps;
      const D = H * ball.standoff;
      const far = H * 0.95;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const turn = (v: number[]) => [v[0] * cos + v[2] * sin, v[1], -v[0] * sin + v[2] * cos];
      const lampAt = lamps.map((l, k) => {
        const d = unit(k === 0 ? [l.from[0] + key.x * 0.5, l.from[1] + key.y * 0.4, l.from[2]] : l.from);
        return { dir: d, pos: [bx + d[0] * far, by + d[1] * far, D + d[2] * far], tint: l.tint };
      });

      // 1. The flecks, drawn white-hot in each lamp's colour on black.
      const lx = mx2;
      lx.setTransform(dpr * 0.5, 0, 0, dpr * 0.5, 0, 0);
      lx.globalCompositeOperation = "source-over";
      lx.fillStyle = "#000";
      lx.fillRect(0, 0, W, H);
      lx.globalCompositeOperation = "lighter";
      const side = (R * Math.PI * 2) / ball.around;
      const flashes: number[][] = [];
      const turned = tiles.map((t) => ({ c: turn(t.c), n: turn(t.n), q: t.q.map(turn), silver: t.silver }));
      lampAt.forEach((lamp, k) => {
        const blob = blobFor(k, lamp.tint);
        for (const t of turned) {
          const cx = bx + t.c[0] * R;
          const cy = by + t.c[1] * R;
          const cz = D + t.c[2] * R;
          let ix = cx - lamp.pos[0];
          let iy = cy - lamp.pos[1];
          let iz = cz - lamp.pos[2];
          // The tile must be on the lit side of the ball and face the lamp.
          if (ix * t.c[0] + iy * t.c[1] + iz * t.c[2] >= 0) continue;
          const il = Math.hypot(ix, iy, iz);
          ix /= il; iy /= il; iz /= il;
          const dn = ix * t.n[0] + iy * t.n[1] + iz * t.n[2];
          if (dn >= 0) continue;
          const rx = ix - 2 * dn * t.n[0];
          const ry = iy - 2 * dn * t.n[1];
          const rz = iz - 2 * dn * t.n[2];
          if (rz > -0.2) continue; // heading away from the wall, or skimming it
          const reach = -cz / rz;
          const x = cx + rx * reach;
          const y = cy + ry * reach;
          if (x < -90 || x > W + 90 || y < -90 || y > H + 90) continue;
          // A fleck is a small picture of the lamp, so it is round, grows with distance
          // and stretches where it lands on the wall at a slant.
          const rad = side * (0.5 + (0.46 * reach) / D);
          const stretch = Math.min(1 / -rz, 3);
          lx.globalAlpha = Math.min(1, Math.max(0.2, (1.3 * D) / reach)) * Math.min(1, 1.7 / stretch) * t.silver;
          lx.save();
          lx.translate(x, y);
          lx.rotate(Math.atan2(ry, rx));
          lx.scale(stretch, 1);
          lx.drawImage(blob, -rad, -rad, rad * 2, rad * 2);
          lx.restore();
        }
      });
      lx.globalAlpha = 1;
      // The flecks were drawn at half size, so scaling them up softens their edges a touch.
      px.setTransform(1, 0, 0, 1, 0, 0);
      px.globalCompositeOperation = "source-over";
      px.imageSmoothingQuality = "high";
      px.drawImage(mask, 0, 0, light.width, light.height);
      px.globalCompositeOperation = "multiply";
      px.drawImage(lit, 0, 0);

      // 3. The dark room, plus the light.
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(dim, 0, 0);
      ctx.globalCompositeOperation = "lighter";
      ctx.drawImage(light, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // 4. A trace of haze in each beam on its way to the ball.
      for (const lamp of lampAt) {
        const ox = bx + lamp.dir[0] * far * 0.9;
        const oy = by + lamp.dir[1] * far * 0.9;
        const len = Math.hypot(ox - bx, oy - by) || 1;
        const nx = (-(oy - by) / len) * R;
        const ny = ((ox - bx) / len) * R;
        const grad = ctx.createLinearGradient(ox, oy, bx, by);
        grad.addColorStop(0, `rgba(${lamp.tint.join(",")},0)`);
        grad.addColorStop(1, `rgba(${lamp.tint.join(",")},0.11)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(ox + nx * 0.35, oy + ny * 0.35);
        ctx.lineTo(bx + nx, by + ny);
        ctx.lineTo(bx - nx, by - ny);
        ctx.lineTo(ox - nx * 0.35, oy - ny * 0.35);
        ctx.closePath();
        ctx.fill();
      }

      // 5. The ball: its chain and cap, a dark core, then every tile that faces us.
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = "#57525c";
      ctx.lineWidth = 1.6;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(bx, 0);
      ctx.lineTo(bx, by - R - 6);
      ctx.stroke();
      ctx.setLineDash([]);
      const cap = ctx.createLinearGradient(bx - R * 0.2, 0, bx + R * 0.2, 0);
      cap.addColorStop(0, "#2b282f");
      cap.addColorStop(0.4, "#b9b4bd");
      cap.addColorStop(1, "#3a363e");
      ctx.fillStyle = cap;
      ctx.fillRect(bx - R * 0.16, by - R - 8, R * 0.32, 12);
      ctx.fillStyle = "#07060a";
      ctx.beginPath();
      ctx.arc(bx, by, R * 0.995, 0, Math.PI * 2);
      ctx.fill();
      for (const t of turned) {
        if (t.c[2] < 0.03) continue;
        // What this tile mirrors back at the viewer.
        const nz = t.n[2];
        const rx = 2 * nz * t.n[0];
        const ry = 2 * nz * t.n[1];
        const rz = 2 * nz * nz - 1;
        let r = 20 + 54 * Math.max(0, -ry);
        let g = 19 + 50 * Math.max(0, -ry);
        let b = 26 + 60 * Math.max(0, -ry);
        if (rz < 0) { r += 26; g += 22; b += 30; }
        let hot = 0;
        for (const lamp of lampAt) {
          const d = Math.max(0, rx * lamp.dir[0] + ry * lamp.dir[1] + rz * lamp.dir[2]);
          const wash = d * d * 0.5;
          const flash = Math.pow(d, 150) * 3.2;
          r += lamp.tint[0] * (wash + flash);
          g += lamp.tint[1] * (wash + flash);
          b += lamp.tint[2] * (wash + flash);
          if (flash > 0.9) { hot = Math.max(hot, flash); flashes.push([bx + t.c[0] * R, by + t.c[1] * R, Math.min(1, flash / 2.4), lamp.tint[0], lamp.tint[1], lamp.tint[2]]); }
        }
        const k = t.silver * (0.55 + 0.45 * t.c[2]);
        ctx.fillStyle = hot > 1.6 ? "#fff" : `rgb(${Math.min(255, r * k) | 0},${Math.min(255, g * k) | 0},${Math.min(255, b * k) | 0})`;
        ctx.beginPath();
        ctx.moveTo(bx + t.q[0][0] * R, by + t.q[0][1] * R);
        ctx.lineTo(bx + t.q[1][0] * R, by + t.q[1][1] * R);
        ctx.lineTo(bx + t.q[2][0] * R, by + t.q[2][1] * R);
        ctx.lineTo(bx + t.q[3][0] * R, by + t.q[3][1] * R);
        ctx.closePath();
        ctx.fill();
      }
      // Roundness: the rim falls away from the light, with a faint sheen up and to the left.
      const shade = ctx.createRadialGradient(bx - R * 0.28, by - R * 0.34, R * 0.1, bx, by, R);
      shade.addColorStop(0, "rgba(255,255,255,0.1)");
      shade.addColorStop(0.45, "rgba(0,0,0,0)");
      shade.addColorStop(0.86, "rgba(0,0,0,0.3)");
      shade.addColorStop(1, "rgba(0,0,0,0.72)");
      ctx.fillStyle = shade;
      ctx.beginPath();
      ctx.arc(bx, by, R, 0, Math.PI * 2);
      ctx.fill();
      // The tiles that catch a lamp head-on flare.
      ctx.globalCompositeOperation = "lighter";
      for (const f of flashes) {
        const size = R * (0.5 + f[2] * 0.9);
        ctx.globalAlpha = 0.35 + f[2] * 0.6;
        ctx.drawImage(glowDot, f[0] - size / 2, f[1] - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };
    redraw.current = draw;

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min((now - (before || now)) / 1000, 0.05);
      before = now;
      const s = spin.current;
      // Friction brings a flicked ball back to its resting speed, in whichever direction it was sent.
      if (!s.drag) s.speed += (ball.idle * s.dir - s.speed) * (1 - Math.exp(-dt * 0.9));
      angle += s.speed * dt;
      const k = 1 - Math.exp(-dt * 3.5);
      key.x += (spot.current.x - key.x) * k;
      key.y += (spot.current.y - key.y) * k;
      draw();
    };
    const wake = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      before = 0;
      if (reduce) draw();
      else if (visible && !document.hidden) raf = requestAnimationFrame(loop);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(el);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      wake();
    });
    io.observe(el);
    const arrived = () => {
      paintRoom();
      draw();
    };
    img.addEventListener("load", arrived);
    document.addEventListener("visibilitychange", wake);
    resize();
    wake();
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      img.removeEventListener("load", arrived);
      document.removeEventListener("visibilitychange", wake);
    };
  }, [reduce]);

  useEffect(() => {
    redraw.current();
  }, [gel]);

  function down(e: ReactPointerEvent<HTMLDivElement>) {
    spin.current.drag = true;
    spin.current.lastX = e.clientX;
    spin.current.lastT = performance.now();
    spin.current.travelled = 0;
  }
  function move(e: ReactPointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    spot.current = { x: ((e.clientX - r.left) / r.width) * 2 - 1, y: ((e.clientY - r.top) / r.height) * 2 - 1 };
    const s = spin.current;
    if (!s.drag || reduce) return;
    const now = performance.now();
    const dt = Math.max(8, now - s.lastT) / 1000;
    const pushed = (e.clientX - s.lastX) / dt / 90;
    s.speed = Math.max(-7, Math.min(7, s.speed * 0.6 + pushed * 0.4));
    if (Math.abs(s.speed) > 0.2) s.dir = Math.sign(s.speed);
    s.travelled += Math.abs(e.clientX - s.lastX);
    s.lastX = e.clientX;
    s.lastT = now;
  }
  function up() {
    spin.current.drag = false;
  }
  /** A click or key press on the ball is a shove against the way it is turning. */
  function shove() {
    const s = spin.current;
    if (s.travelled > 8) return; // that was a flick, not a press
    s.dir = -s.dir;
    s.speed = reduce ? ball.idle * s.dir : 5.5 * s.dir;
    if (reduce) redraw.current();
  }

  return (
    <section className="relative isolate w-full overflow-hidden bg-[#0a080d]">
      <div
        ref={stage}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
        onPointerCancel={up}
        className="relative h-[620px] w-full cursor-grab touch-pan-y select-none active:cursor-grabbing md:h-[700px]"
      >
        <img
          ref={print}
          src={PHOTO}
          alt={PHOTO_ALT}
          width={800}
          height={1200}
          draggable={false}
          className="absolute left-1/2 top-[52%] aspect-[2/3] h-[68%] w-auto max-w-[78%] -translate-x-1/2 -translate-y-1/2 bg-[#8d8a8c] object-cover object-[50%_30%] md:left-[56%] md:h-[80%]"
        />
        <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <button
          ref={orb}
          type="button"
          onClick={shove}
          aria-label="Mirror ball. Press to shove it the other way round."
          className="absolute left-[9%] top-[8%] aspect-square w-[30%] max-w-[150px] rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#0a080d] md:left-[28%] md:top-[8%] md:w-[190px] md:max-w-none"
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 px-5 pb-5 sm:px-8 sm:pb-7">
        <p className="text-[13px] leading-5 text-[#cfc8d6]">
          <span className="font-semibold text-white">Mirror ball</span>
          <span className="mx-2 text-[#7d7587]">/</span>
          flick it sideways to spin
        </p>
        <button
          type="button"
          onClick={() => setGel((g) => (g + 1) % gels.length)}
          className="pointer-events-auto inline-flex h-10 shrink-0 items-center gap-2.5 rounded-full bg-black/50 pl-3 pr-4 text-[13px] font-medium text-white ring-1 ring-white/15 backdrop-blur transition-colors hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <span aria-hidden="true" className="flex -space-x-1">
            {gels[gel].lamps.map((l, i) => (
              <span key={i} className="h-3 w-3 rounded-full ring-1 ring-black/40" style={{ backgroundColor: `rgb(${l.tint.join(",")})` }} />
            ))}
          </span>
          <span>
            <span className="sr-only">Change the lamp colours. Now showing </span>
            {gels[gel].name}
          </span>
        </button>
      </div>
    </section>
  );
}
