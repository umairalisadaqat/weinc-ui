import { useEffect, useRef, useState } from "react";

/** What the readerboard says when the page opens, one string per rail. */
const MESSAGE = ["TONIGHT ONLY", "THE GRAND OPENING", "DOORS AT EIGHT"];
/** The bottom rail is re-hung with each of these in turn until the visitor types. */
const LAST_ROW = ["DOORS AT EIGHT", "LIVE BAND AT TEN", "BRING A FRIEND"];
const RED_ROWS = [0]; // rails set in red letters; the rest are black
const MAX = 18; // letters per rail
const HOLD = 4; // seconds the finished sign stands, every lamp lit, before the chase starts
const ENAMEL = ["#c3242d", "#8d1119", "#560810"]; // the painted channel the bulbs sit in: top, middle, bottom
const PATTERNS = ["Chase", "Twinkle", "Steady"] as const;
const SLUG = "cinema-marquee-headline";

type Tile = { ch: string; tint: number; w: number; home: number; x: number; v: number; at: number; a: number; av: number; tilt: number; dy: number };
type Rail = { text: string; tiles: Tile[]; leaving: Tile[] };
type Bulb = { x: number; y: number; v: number; dead: boolean; loose: boolean; to: number };

const clean = (raw: string) =>
  raw.toUpperCase().replace(/[^A-Z0-9 &!?.,'+:\-\n]/g, "").split("\n").slice(0, MESSAGE.length).map((l) => l.slice(0, MAX)).join("\n");

export default function CinemaMarqueeHeadline() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [text, setText] = useState(MESSAGE.join("\n"));
  const [pattern, setPattern] = useState(0);
  const [typed, setTyped] = useState(false);
  const api = useRef<{ words: (lines: string[]) => void; pattern: (n: number) => void } | null>(null);
  const lines = text.split("\n");

  useEffect(() => {
    const cv = canvas.current, box = wrap.current;
    if (!cv || !box) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const base = document.createElement("canvas");
    const sprite = { glow: document.createElement("canvas"), ember: document.createElement("canvas"), hot: document.createElement("canvas"), off: document.createElement("canvas") };
    let seed = 5;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

    // Everything below is measured from the width the sign is given.
    const g = { W: 0, H: 0, sx: 0, sy: 0, sw: 0, sh: 0, t: 0, ch: 0, bx: 0, by: 0, bw: 0, bh: 0, rh: 0, th: 0, r: 0, sp: 0, size: 0, cap: 0, squeeze: 1 };
    let bulbs: Bulb[] = [];
    const rails: Rail[] = MESSAGE.map(() => ({ text: "", tiles: [], leaving: [] }));
    let mode = 0, step = 0, clock = 0, hold = HOLD, pointer = { x: -999, y: -999 };
    const FACE = 'Impact, Haettenschweiler, "Arial Narrow Bold", "Helvetica Neue", Arial, sans-serif';

    const box4 = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
      c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    };
    const chrome = (c: CanvasRenderingContext2D, y0: number, y1: number) => {
      const m = c.createLinearGradient(0, y0, 0, y1);
      ([[0, "#fbfbf8"], [0.07, "#c6c8cb"], [0.2, "#565a61"], [0.34, "#e9eaec"], [0.5, "#8e9299"], [0.66, "#2c2f35"], [0.8, "#b9bcc1"], [0.93, "#5b5f66"], [1, "#16171a"]] as [number, string][]).forEach(([p, col]) => m.addColorStop(p, col));
      return m;
    };

    const paintSprites = () => {
      const r = g.r * dpr;
      const disc = (cv2: HTMLCanvasElement, half: number, stops: [number, string][]) => {
        cv2.width = cv2.height = Math.ceil(half * 2);
        const c = cv2.getContext("2d"); if (!c) return;
        const m = c.createRadialGradient(half, half, 0, half, half, half);
        stops.forEach(([p, col]) => m.addColorStop(p, col));
        c.fillStyle = m; c.fillRect(0, 0, half * 2, half * 2);
      };
      disc(sprite.glow, r * 5.2, [[0, "rgba(255,186,84,0.5)"], [0.16, "rgba(255,150,50,0.26)"], [0.42, "rgba(255,112,30,0.08)"], [1, "rgba(255,90,20,0)"]]);
      disc(sprite.ember, r * 0.98, [[0, "#ffc061"], [0.3, "#f58a25"], [0.6, "rgba(200,70,12,0.72)"], [0.85, "rgba(120,30,6,0.25)"], [1, "rgba(120,30,6,0)"]]);
      disc(sprite.hot, r * 1.7, [[0, "#fffef4"], [0.3, "#fff3c2"], [0.52, "#ffd67a"], [0.7, "rgba(255,176,70,0.75)"], [1, "rgba(255,140,40,0)"]]);
      // The unlit lamp: a brass collar, smoky clear glass, a filament and one window reflection.
      const half = r * 1.5; sprite.off.width = sprite.off.height = Math.ceil(half * 2);
      const c = sprite.off.getContext("2d"); if (!c) return;
      c.translate(half, half);
      c.beginPath(); c.arc(0, r * 0.16, r * 1.34, 0, 7); c.fillStyle = "rgba(0,0,0,0.5)"; c.fill();
      const collar = c.createLinearGradient(-r, -r, r, r); collar.addColorStop(0, "#e2c27c"); collar.addColorStop(0.45, "#8a6a2e"); collar.addColorStop(1, "#3a2a10");
      c.beginPath(); c.arc(0, 0, r * 1.24, 0, 7); c.fillStyle = collar; c.fill();
      c.beginPath(); c.arc(0, 0, r * 1.04, 0, 7); c.fillStyle = "#120807"; c.fill();
      const glass = c.createRadialGradient(-r * 0.3, -r * 0.36, r * 0.05, 0, 0, r);
      glass.addColorStop(0, "#a8998a"); glass.addColorStop(0.4, "#5c4e42"); glass.addColorStop(0.82, "#2b221c"); glass.addColorStop(1, "#4a3e34");
      c.beginPath(); c.arc(0, 0, r, 0, 7); c.fillStyle = glass; c.fill();
      c.lineWidth = Math.max(1, r * 0.09); c.strokeStyle = "rgba(255,170,90,0.5)"; c.beginPath(); c.arc(0, r * 0.08, r * 0.3, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
      c.fillStyle = "rgba(255,255,255,0.72)"; c.beginPath(); c.ellipse(-r * 0.36, -r * 0.42, r * 0.24, r * 0.13, -0.7, 0, 7); c.fill();
      c.lineWidth = Math.max(1, r * 0.07); c.strokeStyle = "rgba(255,255,255,0.2)"; c.beginPath(); c.arc(0, 0, r * 0.95, 0.3, 1.5); c.stroke();
    };

    const paintBase = () => {
      base.width = cv.width; base.height = cv.height;
      const c = base.getContext("2d"); if (!c) return;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      const { sx, sy, sw, sh, t, ch, bx, by, bw, bh, rh } = g, rad = ch * 0.42;
      // The box stands off the wall: a wide soft shadow and a tight one underneath.
      c.save(); c.shadowColor = "rgba(0,0,0,0.85)"; c.shadowBlur = sw * 0.08; c.shadowOffsetY = sw * 0.035 * dpr; box4(c, sx + 6, sy + 6, sw - 12, sh - 12, rad); c.fillStyle = "#000"; c.fill(); c.restore();
      box4(c, sx, sy, sw, sh, rad); c.fillStyle = chrome(c, sy, sy + sh); c.fill();
      // Vitreous enamel channel.
      const en = c.createLinearGradient(0, sy, 0, sy + sh); en.addColorStop(0, ENAMEL[0]); en.addColorStop(0.5, ENAMEL[1]); en.addColorStop(1, ENAMEL[2]);
      box4(c, sx + t, sy + t, sw - t * 2, sh - t * 2, rad - t * 0.5); c.fillStyle = en; c.fill();
      c.save(); c.clip();
      const gloss = c.createLinearGradient(0, sy + t, 0, sy + t + ch); gloss.addColorStop(0, "rgba(255,255,255,0.42)"); gloss.addColorStop(0.16, "rgba(255,255,255,0.1)"); gloss.addColorStop(0.5, "rgba(255,255,255,0)");
      c.fillStyle = gloss; c.fillRect(sx, sy, sw, ch + t);
      const side = c.createLinearGradient(sx, 0, sx + sw, 0); side.addColorStop(0, "rgba(255,255,255,0.16)"); side.addColorStop(0.05, "rgba(255,255,255,0)"); side.addColorStop(0.94, "rgba(0,0,0,0)"); side.addColorStop(1, "rgba(0,0,0,0.4)");
      c.fillStyle = side; c.fillRect(sx, sy, sw, sh);
      c.restore();
      // Polished trim round the light box, then the opal glass.
      const ix = bx - t, iy = by - t, iw = bw + t * 2, ih = bh + t * 2;
      c.save(); c.shadowColor = "rgba(0,0,0,0.7)"; c.shadowBlur = 8 * dpr; c.shadowOffsetY = 3 * dpr; c.fillStyle = "#000"; c.fillRect(ix, iy, iw, ih); c.restore();
      c.fillStyle = chrome(c, iy, iy + ih); c.fillRect(ix, iy, iw, ih);
      const milk = c.createLinearGradient(0, by, 0, by + bh); milk.addColorStop(0, "#f6e6c0"); milk.addColorStop(0.2, "#fff7e2"); milk.addColorStop(0.8, "#fff4da"); milk.addColorStop(1, "#efd9aa");
      c.fillStyle = milk; c.fillRect(bx, by, bw, bh);
      c.save(); c.beginPath(); c.rect(bx, by, bw, bh); c.clip();
      // Fluorescent tubes behind the glass show as soft bright bands.
      for (let i = 0; i < MESSAGE.length; i++) {
        const y = by + rh * (i + 0.5), band = c.createLinearGradient(0, y - rh * 0.5, 0, y + rh * 0.5);
        band.addColorStop(0, "rgba(255,255,255,0)"); band.addColorStop(0.5, "rgba(255,255,255,0.7)"); band.addColorStop(1, "rgba(255,255,255,0)");
        c.fillStyle = band; c.fillRect(bx, y - rh * 0.5, bw, rh);
      }
      const ends = c.createLinearGradient(bx, 0, bx + bw, 0); ends.addColorStop(0, "rgba(196,140,60,0.42)"); ends.addColorStop(0.07, "rgba(196,140,60,0)"); ends.addColorStop(0.93, "rgba(196,140,60,0)"); ends.addColorStop(1, "rgba(196,140,60,0.42)");
      c.fillStyle = ends; c.fillRect(bx, by, bw, bh);
      // Seams between the glass panes, and the rails the letters hang on.
      for (let i = 1; i < 3; i++) { const x = Math.round(bx + (bw * i) / 3); c.fillStyle = "rgba(120,86,36,0.5)"; c.fillRect(x, by, 1, bh); c.fillStyle = "rgba(255,255,255,0.5)"; c.fillRect(x + 1, by, 1, bh); }
      for (let i = 0; i <= MESSAGE.length; i++) {
        const y = Math.round(by + rh * i), h = Math.max(2, rh * 0.045);
        c.fillStyle = "rgba(60,40,14,0.16)"; c.fillRect(bx, y - h * 0.5 + h, bw, h * 1.6);
        const rail = c.createLinearGradient(0, y - h * 0.5, 0, y + h * 0.5); rail.addColorStop(0, "#8d8474"); rail.addColorStop(0.35, "#4b4336"); rail.addColorStop(1, "#1f1a12");
        c.fillStyle = rail; c.fillRect(bx, y - h * 0.5, bw, h);
      }
      const lid = c.createLinearGradient(0, by, 0, by + bh * 0.14); lid.addColorStop(0, "rgba(50,30,8,0.5)"); lid.addColorStop(1, "rgba(50,30,8,0)");
      c.fillStyle = lid; c.fillRect(bx, by, bw, bh * 0.14);
      c.restore();
    };

    const hang = (rail: Rail, row: number, now: number, wait: number, placed = false) => {
      ctx.font = `${g.size}px ${FACE}`;
      const chars = [...rail.text];
      const widths = chars.map((ch) => (ch === " " ? g.th * 0.36 : ctx.measureText(ch).width * g.squeeze + g.th * 0.2));
      const total = widths.reduce((a, b) => a + b, 0), fit = Math.min(1, (g.bw * 0.94) / Math.max(1, total));
      let x = (g.bw - total * fit) / 2;
      rail.tiles = [];
      chars.forEach((ch, i) => {
        const w = widths[i] * fit;
        if (ch !== " ") {
          rail.tiles.push({ ch, tint: 0.03 + rand() * 0.1, w, home: x, x: reduce || placed ? 0 : g.bw - x + 12, v: 0, at: now + wait + rail.tiles.length * 0.04, a: 0, av: 0, tilt: (rand() - 0.5) * 0.034, dy: (rand() - 0.5) * g.th * 0.03 });
        }
        x += w;
      });
      void row;
    };

    const measure = () => {
      const W = Math.min(box.clientWidth, 1040), narrow = W < 560;
      const pad = Math.max(18, Math.min(74, W * 0.07));
      g.W = W; g.sw = Math.min(W - pad * 2, 880); g.sh = Math.round(g.sw * (narrow ? 0.72 : 0.5));
      g.sx = (W - g.sw) / 2; g.sy = pad; g.H = g.sh + pad * 2;
      g.t = Math.max(2.5, g.sw * 0.0075); g.ch = Math.max(17, Math.min(50, g.sw * 0.058));
      g.bx = Math.round(g.sx + g.t * 2 + g.ch); g.by = Math.round(g.sy + g.t * 2 + g.ch);
      g.bw = Math.round(g.sw - (g.t * 2 + g.ch) * 2); g.bh = Math.round(g.sh - (g.t * 2 + g.ch) * 2);
      g.rh = g.bh / MESSAGE.length; g.th = g.rh * 0.86; g.r = g.ch * 0.27;
      cv.width = Math.round(W * dpr); cv.height = Math.round(g.H * dpr);
      cv.style.height = `${g.H}px`;
      // Size the face so its capitals are seven tenths of a tile, and squeeze wide fallbacks to marquee proportions.
      ctx.font = `100px ${FACE}`;
      const probe = ctx.measureText("H"), capOf100 = probe.actualBoundingBoxAscent || 72;
      g.cap = g.th * 0.7; g.size = (g.cap / capOf100) * 100; g.squeeze = Math.min(1, 52 / probe.width);
      // Lamps round the channel, clockwise from the top left, in a count the chase divides evenly.
      const x0 = g.sx + g.t + g.ch / 2, x1 = g.sx + g.sw - g.t - g.ch / 2, y0 = g.sy + g.t + g.ch / 2, y1 = g.sy + g.sh - g.t - g.ch / 2;
      g.sp = g.ch * 0.94;
      let nx = Math.round((x1 - x0) / g.sp); const ny = Math.round((y1 - y0) / g.sp);
      while ((nx + ny) % 3) nx++;
      const old = bulbs; bulbs = [];
      const add = (x: number, y: number) => { const n = bulbs.length; bulbs.push({ x, y, v: old[n]?.v ?? 1, dead: old[n]?.dead ?? false, loose: false, to: 0 }); };
      for (let i = 0; i < nx; i++) add(x0 + ((x1 - x0) * i) / nx, y0);
      for (let i = 0; i < ny; i++) add(x1, y0 + ((y1 - y0) * i) / ny);
      for (let i = 0; i < nx; i++) add(x1 - ((x1 - x0) * i) / nx, y1);
      for (let i = 0; i < ny; i++) add(x0, y1 - ((y1 - y0) * i) / ny);
      bulbs[Math.floor(bulbs.length * 0.62)].loose = true;
      paintSprites(); paintBase();
    };

    const draw = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.drawImage(base, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const { bx, by, bw, bh, rh, th, r } = g;
      // Letter tiles: clear acrylic with an opaque letter, seen against the light.
      ctx.save(); ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip();
      ctx.font = `${g.size}px ${FACE}`; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
      rails.forEach((rail, row) => {
        const cy = by + rh * (row + 0.5), ink = RED_ROWS.includes(row) ? "#b3141c" : "#17120d";
        for (const tile of [...rail.leaving, ...rail.tiles]) {
          const x = bx + tile.home + tile.x;
          if (x > bx + bw || x + tile.w < bx) continue;
          ctx.save(); ctx.translate(x + tile.w / 2, cy - th / 2 + tile.dy); ctx.rotate(tile.tilt + tile.a);
          ctx.fillStyle = `rgba(150,104,40,${tile.tint})`; ctx.fillRect(-tile.w / 2 + 0.5, 0, tile.w - 1, th);
          ctx.fillStyle = "rgba(96,64,20,0.22)"; ctx.fillRect(-tile.w / 2 + 0.5, 0, 1, th); ctx.fillRect(tile.w / 2 - 1.5, 0, 1, th);
          ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.fillRect(-tile.w / 2 + 1.5, 0, 1, th);
          ctx.translate(0, th / 2 + g.cap / 2); ctx.scale(g.squeeze * Math.min(1, (tile.w * 0.9) / Math.max(1, ctx.measureText(tile.ch).width * g.squeeze)), 1);
          ctx.fillStyle = ink; ctx.fillText(tile.ch, 0, 0);
          ctx.restore();
        }
      });
      ctx.restore();
      // Lamps: socket and glass first, then the heat. A filament goes from ember to white as it warms.
      const o = sprite.off.width / dpr, e = sprite.ember.width / dpr, h = sprite.hot.width / dpr, gl = sprite.glow.width / dpr;
      for (const b of bulbs) ctx.drawImage(sprite.off, b.x - o / 2, b.y - o / 2, o, o);
      ctx.globalCompositeOperation = "lighter";
      for (const b of bulbs) { if (b.v < 0.01) continue; ctx.globalAlpha = Math.min(1, Math.pow(b.v, 1.4)); ctx.drawImage(sprite.glow, b.x - gl / 2, b.y - gl / 2, gl, gl); }
      ctx.globalCompositeOperation = "source-over";
      for (const b of bulbs) {
        if (b.v < 0.01) continue;
        ctx.globalAlpha = Math.min(1, b.v * 2.4); ctx.drawImage(sprite.ember, b.x - e / 2, b.y - e / 2, e, e);
        ctx.globalAlpha = Math.max(0, Math.min(1, (b.v - 0.3) / 0.6)); ctx.drawImage(sprite.hot, b.x - h / 2, b.y - h / 2, h, h);
      }
      ctx.globalAlpha = 1;
      for (const b of bulbs) { ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.beginPath(); ctx.ellipse(b.x - r * 0.36, b.y - r * 0.42, r * 0.2, r * 0.1, -0.7, 0, 7); ctx.fill(); }
    };

    let raf = 0, last = 0, seen = true;
    const tick = (dt: number) => {
      clock += dt;
      // Bulbs.
      step += dt * 7.5;
      const s = Math.floor(step);
      bulbs.forEach((b, i) => {
        // The sign opens finished: every lamp is lit and steady until the hold runs out.
        const held = clock < hold;
        let to = held ? 1 : mode === 0 ? ((((i - s) % 3) + 3) % 3 === 0 ? 0.04 : 1) : mode === 1 ? b.to : 1;
        if (mode === 1 && rand() < dt * 2.2) b.to = rand() < 0.62 ? 1 : 0.05;
        const d = Math.hypot(b.x - pointer.x, b.y - pointer.y);
        if (d < g.sp * 2.6) to = 1;
        if (!held && b.loose && Math.sin(clock * 31) * Math.sin(clock * 7.3) > 0.55) to *= 0.25;
        if (b.dead) to = 0;
        b.v += (to - b.v) * Math.min(1, dt * (to > b.v ? 20 : 8.5));
      });
      // Tiles: a spring pulls each one home along its rail, and none may pass the tile in front.
      for (const rail of rails) {
        rail.tiles.forEach((tl, i) => {
          if (clock < tl.at) return;
          tl.v += (-150 * tl.x - 19 * tl.v) * dt; tl.x += tl.v * dt;
          const prev = rail.tiles[i - 1];
          if (prev) {
            const min = prev.home + prev.x + prev.w - tl.home;
            if (tl.x < min) { const rel = tl.v - prev.v; tl.x = min; if (rel < 0) { tl.v -= rel * 0.85; prev.v += rel * 0.4; tl.av -= rel * 0.0011; prev.av += rel * 0.0007; } }
          }
          tl.av += (-320 * tl.a - 11 * tl.av) * dt; tl.a = Math.max(-0.1, Math.min(0.1, tl.a + tl.av * dt));
        });
        rail.leaving.forEach((tl) => { if (clock < tl.at) return; tl.v -= 3400 * dt; tl.x += tl.v * dt; tl.a += (0.05 - tl.a) * dt * 8; });
        rail.leaving = rail.leaving.filter((tl) => tl.home + tl.x + tl.w > -20);
      }
    };
    const settle = () => { bulbs.forEach((b) => { b.v = b.dead ? 0 : 0.92; }); rails.forEach((rl) => { rl.leaving = []; rl.tiles.forEach((tl) => { tl.x = 0; tl.v = 0; tl.a = 0; }); }); draw(); };
    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.033, (now - last) / 1000 || 0.016); last = now;
      tick(dt * 0.5); tick(dt * 0.5); draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (reduce) { settle(); return; } if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };

    const words = (next: string[], first = false) => {
      rails.forEach((rail, row) => {
        const t = (next[row] ?? "").trim();
        if (t === rail.text && !first) return;
        rail.leaving = reduce ? [] : [...rail.leaving, ...rail.tiles.map((tl, i) => ({ ...tl, at: clock + i * 0.022 }))];
        rail.text = t;
        // The opening words are hung in place; every later change slides in from the right.
        hang(rail, row, clock, first ? 0 : rail.leaving.length ? 0.34 : 0, first);
      });
      wake();
    };
    api.current = { words: (l) => words(l), pattern: (n) => { if (n !== mode) hold = 0; mode = n; wake(); } };

    measure(); words(MESSAGE, true);
    const ro = new ResizeObserver(() => { if (Math.min(box.clientWidth, 1040) === g.W) return; measure(); rails.forEach((rail, row) => { rail.leaving = []; hang(rail, row, clock, 0); rail.tiles.forEach((tl) => { tl.x = 0; tl.at = 0; }); }); wake(); });
    ro.observe(box);

    const at = (ev: PointerEvent) => { const b = cv.getBoundingClientRect(); return { x: ev.clientX - b.left, y: ev.clientY - b.top }; };
    const near = (pt: { x: number; y: number }) => bulbs.find((b) => Math.hypot(b.x - pt.x, b.y - pt.y) < g.sp * 0.5);
    const onMove = (ev: PointerEvent) => { pointer = at(ev); cv.style.cursor = near(pointer) ? "pointer" : "default"; if (reduce) draw(); };
    const onLeave = () => { pointer = { x: -999, y: -999 }; };
    // Tap a lamp to unscrew it, tap again to put it back.
    const onDown = (ev: PointerEvent) => { const b = near(at(ev)); if (b) { b.dead = !b.dead; if (!b.dead) b.v = 0.2; wake(); } };
    cv.addEventListener("pointermove", onMove); cv.addEventListener("pointerleave", onLeave); cv.addEventListener("pointerdown", onDown);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); api.current = null; ro.disconnect(); io.disconnect();
      cv.removeEventListener("pointermove", onMove); cv.removeEventListener("pointerleave", onLeave); cv.removeEventListener("pointerdown", onDown);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  useEffect(() => { api.current?.words(text.split("\n")); }, [text]);
  useEffect(() => { api.current?.pattern(pattern); }, [pattern]);
  // Until somebody types, the bottom rail is changed every few seconds.
  useEffect(() => {
    if (typed || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let n = 0;
    const id = window.setInterval(() => { n = (n + 1) % LAST_ROW.length; setText((t) => { const l = t.split("\n"); l[MESSAGE.length - 1] = LAST_ROW[n]; return l.join("\n"); }); }, 5200);
    return () => window.clearInterval(id);
  }, [typed]);

  return (
    <div className="flex min-h-[640px] w-full flex-col items-center justify-center bg-[#0b0809] bg-[radial-gradient(70%_60%_at_50%_40%,#2a1410_0%,#150c0b_45%,#0b0809_100%)] px-4 py-10 sm:min-h-[760px]">
      <h2 className="sr-only">{lines.filter(Boolean).join(". ")}</h2>
      <div ref={wrap} className="w-full max-w-[1040px]">
        <canvas ref={canvas} aria-hidden="true" className="mx-auto block w-full touch-manipulation" style={{ height: 520 }} />
      </div>

      <div className="mt-1 flex w-full max-w-[560px] flex-col items-stretch gap-4 sm:flex-row sm:items-start">
        <div className="flex-1">
          <label htmlFor={`${SLUG}-words`} className="mb-2 block font-mono text-[11px] uppercase tracking-[0.18em] text-[#c9a98a]">
            Hang your own three lines
          </label>
          <textarea
            id={`${SLUG}-words`}
            rows={3}
            value={text}
            spellCheck={false}
            onChange={(e) => { setTyped(true); setText(clean(e.target.value)); }}
            className="w-full resize-none rounded-md border border-[#4a2e25] bg-[#1a100e] px-3 py-2 font-mono text-[12px] uppercase leading-5 tracking-[0.14em] text-[#f6e6c8] outline-none focus-visible:ring-2 focus-visible:ring-[#ffbf55]"
          />
        </div>
        <div role="radiogroup" aria-label="Bulb pattern" className="flex shrink-0 gap-1 sm:mt-[26px]">
          {PATTERNS.map((name, i) => (
            <button
              key={name}
              type="button"
              role="radio"
              aria-checked={pattern === i}
              onClick={() => setPattern(i)}
              className={`h-10 flex-1 rounded-md px-4 font-mono text-[11px] uppercase tracking-[0.18em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#ffbf55] motion-reduce:transition-none sm:flex-none ${pattern === i ? "bg-[#f6e6c8] text-[#1a100e]" : "bg-[#1a100e] text-[#c9a98a] hover:text-[#f6e6c8]"}`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
