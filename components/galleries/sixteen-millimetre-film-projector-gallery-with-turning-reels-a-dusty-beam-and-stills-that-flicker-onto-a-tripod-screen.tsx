import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useReducedMotion } from "framer-motion";

/** The stills on the reel, in running order. `tone` is shown until the picture arrives and tints the beam. */
const stills = [
  { title: "Still water", src: "https://images.pexels.com/photos/4998598/pexels-photo-4998598.jpeg?auto=compress&cs=tinysrgb&w=1000", alt: "Woman in a pale pink dress floating on her back in bright blue pool water", tone: "#2aa7c9" },
  { title: "Two lamps", src: "https://images.pexels.com/photos/12314821/pexels-photo-12314821.jpeg?auto=compress&cs=tinysrgb&w=1000", alt: "Young man lit teal from one side against a red wall", tone: "#b23a30" },
  { title: "Mile marker", src: "https://images.pexels.com/photos/7022880/pexels-photo-7022880.jpeg?auto=compress&cs=tinysrgb&w=1000", alt: "Woman in a white dress standing on an empty desert road under a pale sky", tone: "#a9b7c2" },
  { title: "Red room", src: "https://images.pexels.com/photos/9895319/pexels-photo-9895319.jpeg?auto=compress&cs=tinysrgb&w=1000", alt: "Profile of a person in silhouette against a deep red wall", tone: "#b01a22" },
  { title: "Last tram", src: "https://images.pexels.com/photos/36806859/pexels-photo-36806859.jpeg?auto=compress&cs=tinysrgb&w=1000", alt: "Woman with hair blown across her face on a dark street under rows of ceiling lights", tone: "#2a6672" },
];
const N = stills.length;
const HOLD_MS = 3400; // how long each still stays in the gate
const ENAMEL = ["#8a9d91", "#4a584f", "#1c2420"]; // the projector's paint, light to dark
const SPEED = 150; // film speed in design pixels a second; the reels turn to match

const S = { x: 96, y: -212 }, T = { x: -126, y: -196 }, REEL = 98, HUB = 30; // feed reel, take-up reel
const LENS = { x: 218, y: -24 };

const layoutFor = (narrow: boolean) =>
  narrow
    ? { W: 520, H: 850, proj: { x: 205, y: 596, sc: 0.58, tilt: -48 }, scr: { xL: 30, xR: 490, tl: 44, bl: 338, tr: 44, br: 338 }, table: { x0: 70, x1: 410 }, floor: 772, stand: false }
    : { W: 1200, H: 700, proj: { x: 262, y: 392, sc: 1, tilt: -2 }, scr: { xL: 668, xR: 1142, tl: 150, bl: 446, tr: 96, br: 486 }, table: { x0: 62, x1: 470 }, floor: 628, stand: true };

type Ctx = CanvasRenderingContext2D;
const rng = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const rr = (c: Ctx, x: number, y: number, w: number, h: number, r: number) => {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
};
const chrome = (c: Ctx, x0: number, y0: number, x1: number, y1: number) => {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, "#f4f5f7"); g.addColorStop(0.22, "#8f9299"); g.addColorStop(0.45, "#e2e4e8"); g.addColorStop(0.7, "#4b4e54"); g.addColorStop(1, "#9da0a6");
  return g;
};
const mix = (hex: string, t: number) => {
  const n = parseInt(hex.slice(1), 16), a = [n >> 16, (n >> 8) & 255, n & 255], w = [255, 236, 204];
  return a.map((v, i) => Math.round(v * t + w[i] * (1 - t))).join(",");
};

export default function FilmProjectorGallery() {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(0);
  const ctl = useRef({ target: 0, paused: false, nextAuto: 0, redraw: () => {} });

  const step = useCallback((dir: number) => {
    const c = ctl.current;
    c.target += dir; c.nextAuto = performance.now() + HOLD_MS * 2;
    setActive(((c.target % N) + N) % N);
    c.redraw();
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current, cv = cvRef.current;
    if (!wrap || !cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const c0 = ctl.current;
    let L = layoutFor(false), W = 0, k = 1, ox = 0, box = { x: 0, y: 0 }, raf = 0, visible = true, last = performance.now();
    const body = document.createElement("canvas"), room = document.createElement("canvas");
    // the photographs live in the page as real images with alt text; the canvas only borrows them
    const imgs = Array.from(wrap.querySelectorAll<HTMLImageElement>("[data-still]"));
    const loaded = () => c0.redraw();
    imgs.forEach((im) => im.addEventListener("load", loaded));
    const st = { shown: 0, from: 0, cut: 1, aS: 0.3, aT: 1.1, p: 0, scratchX: 0.3, scratchT: 0 };
    const rnd = rng(9);
    const motes = Array.from({ length: 70 }, () => ({ u: rnd(), v: rnd() * 2 - 1, du: (rnd() - 0.5) * 0.012, dv: (rnd() - 0.5) * 0.05, r: 0.6 + rnd() * 1.3, ph: rnd() * 6.3 }));
    c0.nextAuto = last + 3700;

    /** A point on the projector, in stage coordinates. */
    const at = (x: number, y: number) => {
      const a = (L.proj.tilt * Math.PI) / 180, cs = Math.cos(a), sn = Math.sin(a);
      return { x: L.proj.x + (x * cs - y * sn) * L.proj.sc, y: L.proj.y + (x * sn + y * cs) * L.proj.sc };
    };
    const onProj = (c: Ctx) => { c.translate(L.proj.x, L.proj.y); c.rotate((L.proj.tilt * Math.PI) / 180); c.scale(L.proj.sc, L.proj.sc); };

    const build = () => {
      grainAll.width = cv.width + 192; grainAll.height = cv.height + 192;
      const ga = grainAll.getContext("2d")!, gp = ga.createPattern(grain, "repeat");
      if (gp) { ga.fillStyle = gp; ga.fillRect(0, 0, grainAll.width, grainAll.height); }
      // The room: wall, floor, the side table and the screen's stand.
      room.width = cv.width; room.height = cv.height;
      const b = room.getContext("2d")!;
      b.setTransform(1, 0, 0, 1, 0, 0);
      b.fillStyle = "#0c0b0a"; b.fillRect(0, 0, room.width, room.height);
      b.setTransform(k, 0, 0, k, ox * k, 0);
      const r = rng(3);
      const fl = b.createLinearGradient(0, L.floor, 0, L.H);
      fl.addColorStop(0, "#1a1714"); fl.addColorStop(1, "#090807");
      b.fillStyle = fl; b.fillRect(-2000, L.floor, 5200, L.H - L.floor + 2);
      b.fillStyle = "rgba(255,240,220,0.05)"; b.fillRect(-2000, L.floor, 5200, 1);
      const q = L.scr, mx = (q.xL + q.xR) / 2, by = (q.bl + q.br) / 2;
      // tripod and pole
      if (L.stand) {
        b.strokeStyle = chrome(b, mx - 5, 0, mx + 5, 0); b.lineWidth = 7; b.lineCap = "round";
        b.beginPath(); b.moveTo(mx, Math.min(q.tl, q.tr) - 16); b.lineTo(mx, L.floor - 34); b.stroke();
        b.lineWidth = 5; b.strokeStyle = "#2a2b2e";
        for (const dx of [-88, 0, 96]) { b.beginPath(); b.moveTo(mx, L.floor - 70); b.lineTo(mx + dx, L.floor - (dx ? 0 : -8)); b.stroke(); }
        b.fillStyle = "#16171a"; rr(b, mx - 9, by + 22, 18, 26, 4); b.fill();
      }
      if (L.stand) {
        // side table
        const p0 = at(-166, 122), p1 = at(166, 122), ty = Math.max(p0.y, p1.y) + 2;
        const wd = b.createLinearGradient(0, ty, 0, ty + 16);
        wd.addColorStop(0, "#8a5a36"); wd.addColorStop(0.2, "#5d3a22"); wd.addColorStop(1, "#2a190e");
        b.fillStyle = "rgba(0,0,0,0.55)"; b.beginPath(); b.ellipse((L.table.x0 + L.table.x1) / 2, L.floor + 6, (L.table.x1 - L.table.x0) / 2, 9, 0, 0, Math.PI * 2); b.fill();
        b.fillStyle = "#1b120b";
        for (const [lx, d] of [[L.table.x0 + 36, -14], [L.table.x1 - 36, 14]]) { b.beginPath(); b.moveTo(lx - 7, ty + 12); b.lineTo(lx + 7, ty + 12); b.lineTo(lx + d + 3, L.floor + 4); b.lineTo(lx + d - 3, L.floor + 4); b.closePath(); b.fill(); }
        rr(b, L.table.x0, ty, L.table.x1 - L.table.x0, 16, 4); b.fillStyle = wd; b.fill();
        for (let i = 0; i < 60; i++) { b.fillStyle = `rgba(${r() > 0.5 ? "255,220,180" : "0,0,0"},${0.03 + r() * 0.05})`; b.fillRect(L.table.x0 + 4 + r() * (L.table.x1 - L.table.x0 - 60), ty + 2 + r() * 12, 20 + r() * 50, 0.8); }
        b.fillStyle = "rgba(255,225,190,0.35)"; b.fillRect(L.table.x0 + 4, ty + 0.5, L.table.x1 - L.table.x0 - 8, 1);
        // front elevating leg, so the tilted body still stands on the table
        b.lineCap = "butt"; b.strokeStyle = "#5c5f66"; b.lineWidth = 4 * L.proj.sc + 1; b.beginPath(); b.moveTo(at(140, 110).x, at(140, 110).y); b.lineTo(at(140, 110).x, ty); b.stroke();
        b.fillStyle = "rgba(0,0,0,0.5)"; b.beginPath(); b.ellipse((at(-150, 122).x + at(150, 122).x) / 2, ty + 1, 170 * L.proj.sc, 5, 0, 0, Math.PI * 2); b.fill();
        b.fillStyle = "#111"; b.fillRect(at(140, 110).x - 9, ty - 4, 18, 4); b.fillRect(at(-140, 122).x - 9, ty - 4, 18, 4);
      } else {
        // no room for a table on a phone: the projector rides a tilting head on its own tripod
        const hd = at(0, 122);
        b.lineCap = "round"; b.lineWidth = 5; b.strokeStyle = "#2a2b2e";
        for (const dx of [-74, 0, 80]) { b.beginPath(); b.moveTo(hd.x, L.floor - 62); b.lineTo(hd.x + dx, L.floor - (dx ? 0 : -8)); b.stroke(); }
        b.strokeStyle = chrome(b, hd.x - 5, 0, hd.x + 5, 0); b.lineWidth = 7; b.beginPath(); b.moveTo(hd.x, hd.y + 6); b.lineTo(hd.x, L.floor - 30); b.stroke();
        b.fillStyle = "#141516"; b.beginPath(); b.arc(hd.x, hd.y + 4, 11, 0, Math.PI * 2); b.fill();
      }

      // The projector body: everything on it that does not turn.
      // (its layer is only as big as the machine, so copying it each frame stays cheap)
      const R = 372 * L.proj.sc;
      box = { x: L.proj.x - R, y: L.proj.y - R };
      body.width = body.height = Math.ceil(R * 2 * k);
      const c = body.getContext("2d")!;
      c.setTransform(k, 0, 0, k, -box.x * k, -box.y * k);
      onProj(c);
      const enamel = (x0: number, y0: number, x1: number, y1: number) => { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, ENAMEL[0]); g.addColorStop(0.45, ENAMEL[1]); g.addColorStop(1, ENAMEL[2]); return g; };
      const hammer = (x: number, y: number, w: number, h: number, n: number) => { for (let i = 0; i < n; i++) { c.fillStyle = `rgba(${r() > 0.5 ? "255,255,255" : "0,0,0"},${0.03 + r() * 0.06})`; c.beginPath(); c.arc(x + r() * w, y + r() * h, 0.5 + r() * 1.1, 0, Math.PI * 2); c.fill(); } };
      // reel arms
      for (const [a, bb] of [[{ x: 34, y: -60 }, S], [{ x: -74, y: -60 }, T]] as const) {
        const dx = bb.x - a.x, dy = bb.y - a.y, len = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
        c.save(); c.translate(a.x, a.y); c.rotate(ang);
        c.shadowColor = "rgba(0,0,0,0.6)"; c.shadowBlur = 10 * k; c.shadowOffsetY = 4 * k;
        c.beginPath(); c.moveTo(-10, -19); c.lineTo(len, -12); c.arc(len, 0, 12, -Math.PI / 2, Math.PI / 2); c.lineTo(-10, 19); c.closePath();
        c.fillStyle = enamel(0, -19, 0, 19); c.fill(); c.shadowColor = "transparent";
        c.save(); c.clip(); hammer(-10, -19, len + 22, 38, 260); c.restore();
        c.strokeStyle = "rgba(255,255,255,0.22)"; c.lineWidth = 1; c.beginPath(); c.moveTo(-8, -18); c.lineTo(len, -11.2); c.stroke();
        c.restore();
      }
      // lamp house with glowing vents
      c.save(); c.shadowColor = "rgba(0,0,0,0.7)"; c.shadowBlur = 24 * k; c.shadowOffsetY = 12 * k;
      rr(c, -152, -72, 304, 168, 26); c.fillStyle = enamel(0, -72, 0, 96); c.fill(); c.restore();
      c.save(); rr(c, -152, -72, 304, 168, 26); c.clip();
      hammer(-152, -72, 304, 168, 2600);
      const top = c.createLinearGradient(0, -72, 0, -30); top.addColorStop(0, "rgba(255,255,255,0.42)"); top.addColorStop(0.25, "rgba(255,255,255,0.12)"); top.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = top; c.fillRect(-152, -72, 304, 42);
      const gloss = c.createLinearGradient(0, -34, 0, 4); gloss.addColorStop(0, "rgba(255,255,255,0)"); gloss.addColorStop(0.5, "rgba(255,255,255,0.1)"); gloss.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = gloss; c.fillRect(-152, -34, 304, 38);
      const low = c.createLinearGradient(0, 40, 0, 96); low.addColorStop(0, "rgba(0,0,0,0)"); low.addColorStop(1, "rgba(0,0,0,0.45)"); c.fillStyle = low; c.fillRect(-152, 40, 304, 56);
      const side = c.createLinearGradient(60, 0, 152, 0); side.addColorStop(0, "rgba(255,236,204,0)"); side.addColorStop(1, "rgba(255,236,204,0.26)"); c.fillStyle = side; c.fillRect(60, -72, 92, 168);
      c.restore();
      c.strokeStyle = "rgba(0,0,0,0.5)"; c.lineWidth = 1.5; rr(c, -152, -72, 304, 168, 26); c.stroke();
      for (let i = 0; i < 7; i++) {
        const vx = -132 + i * 11;
        rr(c, vx, -44, 5, 74, 2.5); c.fillStyle = "#0a0605"; c.fill();
        const gl = c.createLinearGradient(0, -44, 0, 30); gl.addColorStop(0, "rgba(255,150,60,0)"); gl.addColorStop(0.55, "rgba(255,170,70,0.95)"); gl.addColorStop(1, "rgba(255,120,40,0.1)");
        rr(c, vx + 1, -42, 3, 70, 1.5); c.fillStyle = gl; c.fill();
      }
      const warm = c.createRadialGradient(-100, -6, 4, -100, -6, 80); warm.addColorStop(0, "rgba(255,150,60,0.22)"); warm.addColorStop(1, "rgba(255,150,60,0)"); c.fillStyle = warm; c.fillRect(-180, -90, 160, 170);
      // film channel: the black plate the film threads across
      rr(c, 86, -98, 58, 150, 10); c.fillStyle = "#101112"; c.fill();
      c.strokeStyle = "rgba(255,255,255,0.14)"; c.lineWidth = 1; rr(c, 86.5, -97.5, 57, 149, 10); c.stroke();
      // chrome waist band, base and name plate
      c.fillStyle = chrome(c, 0, 46, 0, 51); c.fillRect(-152, 46, 238, 4);
      rr(c, -166, 92, 332, 30, 9); c.fillStyle = "#0f1011"; c.fill();
      c.fillStyle = "rgba(255,255,255,0.12)"; c.fillRect(-158, 93, 316, 1);
      rr(c, -44, 71, 66, 15, 3); c.fillStyle = chrome(c, 0, 71, 0, 86); c.fill();
      for (const [hx, hy] of [[-138, -58], [72, -58], [-138, 82], [72, 82]]) { c.beginPath(); c.arc(hx, hy, 3.4, 0, Math.PI * 2); c.fillStyle = chrome(c, hx - 3, hy - 3, hx + 3, hy + 3); c.fill(); c.strokeStyle = "rgba(0,0,0,0.7)"; c.lineWidth = 0.9; c.beginPath(); c.moveTo(hx - 2.2, hy - 1.2); c.lineTo(hx + 2.2, hy + 1.2); c.stroke(); }
      c.fillStyle = "#1d1e20"; c.font = "700 8px Helvetica, Arial, sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("16 MM  24 FPS", -11, 79);
      // knobs
      for (const [kx, ky, kr] of [[-36, 8, 19], [22, 14, 12]]) {
        c.save(); c.shadowColor = "rgba(0,0,0,0.7)"; c.shadowBlur = 6 * k; c.shadowOffsetY = 3 * k;
        c.beginPath(); c.arc(kx, ky, kr, 0, Math.PI * 2); c.fillStyle = "#151617"; c.fill(); c.restore();
        for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2; c.strokeStyle = i % 2 ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.6)"; c.lineWidth = 1; c.beginPath(); c.moveTo(kx + Math.cos(a) * (kr - 4), ky + Math.sin(a) * (kr - 4)); c.lineTo(kx + Math.cos(a) * kr, ky + Math.sin(a) * kr); c.stroke(); }
        c.beginPath(); c.arc(kx, ky, kr - 5, 0, Math.PI * 2); c.fillStyle = chrome(c, kx - kr, ky - kr, kx + kr, ky + kr); c.fill();
        c.strokeStyle = "#1a1b1d"; c.lineWidth = 2; c.beginPath(); c.moveTo(kx, ky); c.lineTo(kx + (kr - 7) * 0.6, ky - (kr - 7) * 0.8); c.stroke();
      }
      // lens barrel
      const lg = c.createLinearGradient(0, -50, 0, 2);
      lg.addColorStop(0, "#5a5c61"); lg.addColorStop(0.18, "#1c1d1f"); lg.addColorStop(0.5, "#0b0b0c"); lg.addColorStop(0.82, "#232426"); lg.addColorStop(1, "#050505");
      c.fillStyle = lg; c.fillRect(142, -48, 62, 48);
      for (let i = 0; i < 14; i++) { c.fillStyle = i % 2 ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.5)"; c.fillRect(160 + i * 2, -48, 1, 48); }
      c.fillStyle = chrome(c, 0, -52, 0, 4); c.fillRect(138, -52, 8, 56); c.fillRect(202, -51, 16, 54);
      c.strokeStyle = "rgba(0,0,0,0.6)"; c.lineWidth = 1; c.strokeRect(202.5, -50.5, 15, 53);
      // the only light in the room comes from the screen side: the back of the machine falls into shadow
      c.globalCompositeOperation = "source-atop";
      const dk = c.createLinearGradient(-170, 0, 150, 0); dk.addColorStop(0, "rgba(4,3,2,0.62)"); dk.addColorStop(0.6, "rgba(4,3,2,0.18)"); dk.addColorStop(1, "rgba(4,3,2,0)");
      c.fillStyle = dk; c.fillRect(-260, -330, 520, 480);
      c.globalCompositeOperation = "source-over";
    };

    // fine grain over the whole picture: it hides gradient banding and moves a little each frame
    const grain = document.createElement("canvas"); grain.width = grain.height = 192;
    { const g = grain.getContext("2d")!, gr = rng(41); for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${gr() > 0.5 ? "255,240,220" : "0,0,0"},${0.012 + gr() * 0.03})`; g.fillRect(gr() * 192, gr() * 192, 1, 1); } }
    const grainAll = document.createElement("canvas"); // the tile laid out once over the whole stage, so a frame only copies it

    const reel = (o: { x: number; y: number }, ang: number, fill: number) => {
      const rp = HUB + 6 + fill * (REEL - 16 - HUB);
      ctx.save(); ctx.translate(o.x, o.y);
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.65)"; ctx.shadowBlur = 16 * k; ctx.shadowOffsetX = -4 * k; ctx.shadowOffsetY = 8 * k;
      ctx.beginPath(); ctx.arc(0, 0, REEL, 0, Math.PI * 2); ctx.fillStyle = "#0b0b0c"; ctx.fill(); ctx.restore();
      // the wound film: dark stock with a sheen that stays put while the reel turns
      const fg = ctx.createRadialGradient(0, 0, HUB, 0, 0, rp);
      fg.addColorStop(0, "#1c120c"); fg.addColorStop(0.85, "#3a2618"); fg.addColorStop(1, "#5a3c26");
      ctx.beginPath(); ctx.arc(0, 0, rp, 0, Math.PI * 2); ctx.fillStyle = fg; ctx.fill();
      ctx.lineWidth = 0.7;
      for (let q = HUB + 4; q < rp; q += 3.2) { ctx.strokeStyle = `rgba(255,214,170,${0.05 + ((q * 7) % 5) * 0.012})`; ctx.beginPath(); ctx.arc(0, 0, q, 0, Math.PI * 2); ctx.stroke(); }
      for (const a of [-0.9, 2.25]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, rp, a - 0.28, a + 0.28); ctx.closePath(); const sg = ctx.createRadialGradient(0, 0, HUB, 0, 0, rp); sg.addColorStop(0, "rgba(255,225,190,0)"); sg.addColorStop(1, "rgba(255,225,190,0.22)"); ctx.fillStyle = sg; ctx.fill(); }
      // the flange: an aluminium disc with four windows
      ctx.save(); ctx.rotate(ang);
      ctx.beginPath(); ctx.arc(0, 0, REEL, 0, Math.PI * 2);
      for (let i = 0; i < 4; i++) { const a0 = (i * Math.PI) / 2 + 0.3, a1 = ((i + 1) * Math.PI) / 2 - 0.3; ctx.moveTo(Math.cos(a0) * (HUB + 10), Math.sin(a0) * (HUB + 10)); ctx.arc(0, 0, REEL - 15, a0, a1); ctx.arc(0, 0, HUB + 10, a1, a0, true); ctx.closePath(); }
      ctx.rotate(-ang);
      let mg: CanvasGradient;
      if (typeof ctx.createConicGradient === "function") {
        mg = ctx.createConicGradient(0.5, 0, 0);
        for (const [p, col] of [[0, "#c9ccd1"], [0.08, "#f6f7f9"], [0.2, "#8e9198"], [0.33, "#d5d8dc"], [0.45, "#6a6d74"], [0.58, "#eceef1"], [0.7, "#84878e"], [0.85, "#b9bcc2"], [1, "#c9ccd1"]] as [number, string][]) mg.addColorStop(p, col);
      } else mg = chrome(ctx, -REEL, -REEL, REEL, REEL);
      ctx.fillStyle = mg; ctx.globalAlpha = 0.97; ctx.fill("evenodd"); ctx.globalAlpha = 1;
      ctx.rotate(ang);
      ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, 0, REEL - 0.8, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = "rgba(0,0,0,0.4)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, 0, REEL - 5, 0, Math.PI * 2); ctx.stroke();
      for (let i = 0; i < 4; i++) { const a0 = (i * Math.PI) / 2 + 0.3, a1 = ((i + 1) * Math.PI) / 2 - 0.3; ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.beginPath(); ctx.arc(0, 0, REEL - 15, a0, a1); ctx.stroke(); ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.beginPath(); ctx.arc(0, 0, HUB + 10, a0, a1); ctx.stroke(); }
      // hub with three drive holes and a keyed spindle
      ctx.beginPath(); ctx.arc(0, 0, HUB - 6, 0, Math.PI * 2); ctx.fillStyle = "#17181a"; ctx.fill();
      ctx.fillStyle = "#050505"; for (let i = 0; i < 3; i++) { const a = (i * Math.PI * 2) / 3; ctx.beginPath(); ctx.arc(Math.cos(a) * 14, Math.sin(a) * 14, 4.2, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
      ctx.beginPath(); ctx.arc(0, 0, 7.5, 0, Math.PI * 2); ctx.fillStyle = chrome(ctx, -7, -7, 7, 7); ctx.fill();
      ctx.save(); ctx.rotate(ang); ctx.fillStyle = "#0a0a0a"; ctx.fillRect(-2.6, -2.6, 5.2, 5.2); ctx.restore();
      // shade the side away from the screen and catch its glow on the near rim
      const shd = ctx.createLinearGradient(-REEL, REEL * 0.4, REEL, -REEL * 0.4); shd.addColorStop(0, "rgba(4,3,2,0.6)"); shd.addColorStop(0.55, "rgba(4,3,2,0.12)"); shd.addColorStop(1, "rgba(4,3,2,0)");
      ctx.beginPath(); ctx.arc(0, 0, REEL + 0.5, 0, Math.PI * 2); ctx.fillStyle = shd; ctx.fill();
      ctx.strokeStyle = "rgba(255,236,204,0.55)"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(0, 0, REEL - 1, -0.9, 0.5); ctx.stroke();
      ctx.restore();
      return rp;
    };

    const draw = (now: number) => {
      const q = L.scr, live = !reduce;
      const fl = live ? 0.9 + 0.1 * Math.sin(now / 41) * Math.sin(now / 173) - (Math.sin(now / 97) > 0.96 ? 0.12 : 0) : 1;
      const tone = stills[((st.shown % N) + N) % N].tone;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(room, 0, 0);
      ctx.setTransform(k, 0, 0, k, ox * k, 0);
      const mx = (q.xL + q.xR) / 2, my = (q.tl + q.tr + q.bl + q.br) / 4;
      // light spilling off the screen onto the wall and floor
      ctx.globalCompositeOperation = "lighter";
      const sp = ctx.createRadialGradient(mx, my, 60, mx, my, (q.xR - q.xL) * 1.05);
      sp.addColorStop(0, `rgba(${mix(tone, 0.7)},${0.2 * fl})`); sp.addColorStop(1, `rgba(${mix(tone, 0.7)},0)`);
      ctx.fillStyle = sp; ctx.fillRect(mx - 700, my - 600, 1400, 1200);
      ctx.save(); ctx.translate(mx, L.floor + 16); ctx.scale(1, 0.09);
      const fr = ctx.createRadialGradient(0, 0, 10, 0, 0, (q.xR - q.xL) * 0.8); fr.addColorStop(0, `rgba(${mix(tone, 0.7)},${0.3 * fl})`); fr.addColorStop(1, `rgba(${mix(tone, 0.7)},0)`);
      ctx.fillStyle = fr; ctx.beginPath(); ctx.arc(0, 0, (q.xR - q.xL) * 0.8, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      // the beam
      const lens = at(LENS.x, LENS.y);
      const bg = ctx.createLinearGradient(lens.x, lens.y, mx, my);
      bg.addColorStop(0, `rgba(${mix(tone, 0.25)},${0.62 * fl})`); bg.addColorStop(0.3, `rgba(${mix(tone, 0.4)},${0.3 * fl})`); bg.addColorStop(1, `rgba(${mix(tone, 0.55)},${0.13 * fl})`);
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.moveTo(lens.x, lens.y); ctx.lineTo(q.xL, q.tl); ctx.lineTo(q.xR, q.tr); ctx.lineTo(q.xR, q.br); ctx.lineTo(q.xL, q.bl); ctx.closePath(); ctx.fill();
      for (let i = 0; i < 6; i++) {
        const f = (i + 0.5) / 6 + (live ? Math.sin(now / 1900 + i * 2.1) * 0.05 : 0), w = 0.03 + (i % 3) * 0.012;
        const ax = q.xL + (q.xR - q.xL) * (i % 2 ? 0.2 : 0.75), y0 = q.tl + (q.bl - q.tl) * (f - w), y1 = q.tl + (q.bl - q.tl) * (f + w);
        ctx.fillStyle = `rgba(${mix(tone, 0.3)},${0.05 * fl})`;
        ctx.beginPath(); ctx.moveTo(lens.x, lens.y); ctx.lineTo(ax, y0); ctx.lineTo(ax, y1); ctx.closePath(); ctx.fill();
      }
      for (const m of motes) {
        const tx = q.xL + (q.xR - q.xL) * 0.5, ty = (q.tl + q.bl) / 2 + ((q.bl - q.tl) / 2) * m.v * 0.9;
        const x = lens.x + (tx - lens.x) * m.u, y = lens.y + (ty - lens.y) * m.u;
        const a = (0.25 + 0.35 * Math.sin(now / 700 + m.ph)) * (1 - m.u * 0.6) * fl;
        if (a > 0) { ctx.fillStyle = `rgba(255,244,222,${a.toFixed(3)})`; ctx.beginPath(); ctx.arc(x, y, m.r, 0, Math.PI * 2); ctx.fill(); }
      }
      ctx.globalCompositeOperation = "source-over";
      // the screen: case tube, black masking, then the picture cut into thin upright slices to follow the slope
      const quad = (inset: number) => { ctx.beginPath(); ctx.moveTo(q.xL + inset, q.tl + inset); ctx.lineTo(q.xR - inset, q.tr + inset); ctx.lineTo(q.xR - inset, q.br - inset); ctx.lineTo(q.xL + inset, q.bl - inset); ctx.closePath(); };
      ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.8)"; ctx.shadowBlur = 30 * k; ctx.shadowOffsetY = 14 * k; quad(-7); ctx.fillStyle = "#070707"; ctx.fill(); ctx.restore();
      ctx.strokeStyle = "rgba(255,255,255,0.13)"; ctx.lineWidth = 1; quad(-6.5); ctx.stroke();
      ctx.lineCap = "round"; ctx.lineWidth = 15; ctx.strokeStyle = "#0d0d0e"; ctx.beginPath(); ctx.moveTo(q.xL - 16, q.bl + 13); ctx.lineTo(q.xR + 16, q.br + 13); ctx.stroke();
      ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.beginPath(); ctx.moveTo(q.xL - 14, q.bl + 8.5); ctx.lineTo(q.xR + 14, q.br + 8.5); ctx.stroke();
      ctx.save(); quad(5); ctx.clip();
      const frame = (idx: number, shift: number) => {
        const i = ((idx % N) + N) % N, im = imgs[i], ok = im.complete && im.naturalWidth > 0;
        const SL = 72, sw = q.xR - q.xL, asp = sw / (((q.bl - q.tl) + (q.br - q.tr)) / 2);
        let cw = 1, ch = 1, cx0 = 0, cy0 = 0;
        if (ok) { const ia = im.naturalWidth / im.naturalHeight; if (ia > asp) { ch = im.naturalHeight; cw = ch * asp; cx0 = (im.naturalWidth - cw) / 2; } else { cw = im.naturalWidth; ch = cw / asp; cy0 = (im.naturalHeight - ch) * 0.4; } }
        for (let n = 0; n < SL; n++) {
          const t0 = n / SL, x = q.xL + sw * t0, y0 = q.tl + (q.tr - q.tl) * t0, h = q.bl + (q.br - q.bl) * t0 - y0, y = y0 + shift * (h + 10);
          if (ok) ctx.drawImage(im, cx0 + cw * t0, cy0, cw / SL, ch, x, y, sw / SL + 0.7, h);
          else { ctx.fillStyle = stills[i].tone; ctx.fillRect(x, y, sw / SL + 0.7, h); }
        }
      };
      const wv = live ? Math.sin(now / 53) * 0.7 + Math.sin(now / 31) * 0.4 : 0;
      ctx.translate(wv * 0.5, wv);
      if (st.cut < 1) { const e = st.cut * st.cut * (3 - 2 * st.cut); frame(st.from, -e); frame(st.shown, 1 - e); } else frame(st.shown, 0);
      ctx.translate(-wv * 0.5, -wv);
      // what the lamp and the print add: hot centre, dark corners, a tramline scratch, specks
      const vg = ctx.createRadialGradient(mx, my, 40, mx, my, (q.xR - q.xL) * 0.72);
      vg.addColorStop(0, "rgba(255,240,214,0.1)"); vg.addColorStop(0.55, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,0.55)");
      ctx.fillStyle = vg; ctx.fillRect(q.xL, 0, q.xR - q.xL, L.H);
      ctx.fillStyle = `rgba(6,4,2,${(1 - fl) * 1.3})`; ctx.fillRect(q.xL, 0, q.xR - q.xL, L.H);
      if (live) {
        ctx.fillStyle = "rgba(255,250,235,0.11)"; ctx.fillRect(q.xL + (q.xR - q.xL) * st.scratchX + Math.sin(now / 60), 0, 0.8, L.H);
        const sr = rng(Math.floor(now / 42));
        for (let i = 0; i < 4; i++) { ctx.fillStyle = `rgba(10,6,2,${0.3 + sr() * 0.4})`; ctx.beginPath(); ctx.ellipse(q.xL + sr() * (q.xR - q.xL), Math.min(q.tl, q.tr) + sr() * (Math.max(q.bl, q.br) - Math.min(q.tl, q.tr)), 0.6 + sr() * 1.6, 0.6 + sr() * 2.4, sr() * 3, 0, Math.PI * 2); ctx.fill(); }
      }
      ctx.restore();
      // projector
      ctx.drawImage(body, box.x, box.y, body.width / k, body.height / k);
      ctx.save(); onProj(ctx);
      const sFill = 0.86 - 0.62 * st.p, tFill = 0.16 + 0.62 * st.p;
      const rS = reel(S, st.aS, sFill), rT = reel(T, -st.aT, tFill);
      // film path: off the feed reel, round the top sprocket, a loop, through the gate, a loop, and back to the take-up
      const jit = live ? Math.sin(now / 21) * 1.6 : 0;
      const path = () => {
        ctx.beginPath(); ctx.moveTo(S.x + rS, S.y);
        ctx.lineTo(126, -92); ctx.quadraticCurveTo(98 - jit, -78, 110, -60 - jit * 0.4); ctx.lineTo(132, -46); ctx.lineTo(132, -4);
        ctx.quadraticCurveTo(94 + jit, 14, 108, 34); ctx.quadraticCurveTo(96, 60, 60, 60); ctx.lineTo(-150, 60); ctx.quadraticCurveTo(-164, 60, -164, 44); ctx.lineTo(T.x - rT, T.y);
      };
      ctx.lineJoin = "round"; ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 6; path(); ctx.stroke();
      ctx.strokeStyle = "#3b2818"; ctx.lineWidth = 3.4; path(); ctx.stroke();
      ctx.strokeStyle = "rgba(255,214,170,0.3)"; ctx.lineWidth = 0.9; path(); ctx.stroke();
      for (const [sx, sy, sr] of [[122, -84, 9], [118, 28, 9], [-154, 52, 8]]) {
        ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fillStyle = chrome(ctx, sx - sr, sy - sr, sx + sr, sy + sr); ctx.fill();
        ctx.save(); ctx.translate(sx, sy); ctx.rotate(st.aS * 3); ctx.fillStyle = "#17181a"; for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.fillRect(sr * 0.45, -1, sr * 0.4, 2); } ctx.restore();
      }
      // gate light leaking past the film, and the hot front element
      ctx.globalCompositeOperation = "lighter";
      const gt = ctx.createRadialGradient(134, -25, 1, 134, -25, 26); gt.addColorStop(0, `rgba(255,236,204,${0.55 * fl})`); gt.addColorStop(1, "rgba(255,236,204,0)"); ctx.fillStyle = gt; ctx.fillRect(100, -60, 60, 70);
      const hot = ctx.createRadialGradient(LENS.x, LENS.y, 2, LENS.x, LENS.y, 78); hot.addColorStop(0, `rgba(255,250,240,${0.95 * fl})`); hot.addColorStop(0.16, `rgba(${mix(tone, 0.25)},${0.6 * fl})`); hot.addColorStop(1, `rgba(${mix(tone, 0.4)},0)`);
      ctx.fillStyle = hot; ctx.beginPath(); ctx.arc(LENS.x, LENS.y, 78, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = `rgba(255,252,244,${0.95 * fl})`; ctx.beginPath(); ctx.ellipse(LENS.x, LENS.y, 5, 22, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = "source-over";
      ctx.restore();
      { const j = live ? Math.floor(now / 50) : 0; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(grainAll, -((j * 37) % 192), -((j * 91) % 192)); }
    };

    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      if (!c0.paused && now > c0.nextAuto) { c0.target += 1; c0.nextAuto = now + HOLD_MS; setActive(((c0.target % N) + N) % N); }
      if (st.cut >= 1 && st.shown !== c0.target) { st.from = st.shown; st.shown += Math.sign(c0.target - st.shown); st.cut = 0; }
      if (st.cut < 1) st.cut = Math.min(1, st.cut + dt / 0.26);
      const want = (((st.shown % N) + N) % N) / (N - 1);
      st.p += (want - st.p) * Math.min(1, dt * 2.2);
      const rS = HUB + 6 + (0.86 - 0.62 * st.p) * (REEL - 16 - HUB), rT = HUB + 6 + (0.16 + 0.62 * st.p) * (REEL - 16 - HUB);
      st.aS += (SPEED / rS) * dt; st.aT += (SPEED / rT) * dt;
      if (now > st.scratchT) { st.scratchX = 0.08 + Math.random() * 0.84; st.scratchT = now + 500 + Math.random() * 2400; }
      for (const m of motes) { m.u += m.du * dt; m.v += m.dv * dt; if (m.u < 0.05 || m.u > 1) m.du = -m.du; if (m.v < -1 || m.v > 1) m.dv = -m.dv; }
      draw(now);
      if (visible && !document.hidden) raf = requestAnimationFrame(tick);
    };

    const size = () => {
      const cw = wrap.clientWidth, narrow = cw < 700;
      L = layoutFor(narrow);
      const sc = Math.min(narrow ? 1 : 1.12, cw / L.W);
      W = cw; ox = (cw / sc - L.W) / 2;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      k = dpr * sc;
      const h = Math.round(L.H * sc);
      wrap.style.height = `${h}px`;
      cv.width = Math.round(W * dpr); cv.height = Math.round(h * dpr);
      build(); draw(performance.now());
    };
    c0.redraw = () => {
      if (!reduce) return;
      st.shown = c0.target; st.cut = 1; st.p = (((st.shown % N) + N) % N) / (N - 1);
      draw(performance.now());
    };
    size();
    const ro = new ResizeObserver(size); ro.observe(wrap);
    const start = () => { cancelAnimationFrame(raf); if (!reduce && visible && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(tick); } };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; start(); });
    io.observe(wrap);
    document.addEventListener("visibilitychange", start);
    start();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", start); c0.redraw = () => {}; imgs.forEach((im) => im.removeEventListener("load", loaded)); };
  }, [reduce]);

  const onKey = (e: ReactKeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); step(1); }
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); step(-1); }
  };
  const pause = (v: boolean) => () => { ctl.current.paused = v; if (!v) ctl.current.nextAuto = performance.now() + HOLD_MS; };
  const btn = "grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-neutral-200 transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200";

  return (
    <section className="relative overflow-hidden bg-[#0c0b0a]" onMouseEnter={pause(true)} onMouseLeave={pause(false)} onFocus={pause(true)} onBlur={pause(false)}>
      <div
        ref={wrapRef}
        role="group"
        aria-roledescription="carousel"
        aria-label="Film projector showing a reel of stills. Use the left and right arrow keys to change the still."
        tabIndex={0}
        onKeyDown={onKey}
        className="relative w-full outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-200/70"
        style={{ height: 700 }}
      >
        <canvas ref={cvRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        <p aria-live="polite" className="absolute bottom-5 left-5 font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-neutral-300 sm:bottom-8 sm:left-8">
          <span className="tabular-nums text-white">{String(active + 1).padStart(2, "0")}</span>
          <span className="mx-2 text-neutral-500">/</span>
          <span className="tabular-nums">{String(N).padStart(2, "0")}</span>
          <span className="block text-neutral-300">{stills[active].title}</span>
        </p>
        <ul className="sr-only">
          {stills.map((s, i) => (
            <li key={s.src} aria-current={i === active ? "true" : undefined}>
              <img data-still="" src={s.src} alt={s.alt} width={1000} height={667} loading="eager" />
            </li>
          ))}
        </ul>
        <div className="absolute bottom-4 right-4 flex gap-2 sm:bottom-7 sm:right-8">
          <button type="button" onClick={() => step(-1)} aria-label="Wind back to the previous still" className={btn}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4l-6 6 6 6" /></svg>
          </button>
          <button type="button" onClick={() => step(1)} aria-label="Run on to the next still" className={btn}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M8 4l6 6-6 6" /></svg>
          </button>
        </div>
      </div>
    </section>
  );
}
