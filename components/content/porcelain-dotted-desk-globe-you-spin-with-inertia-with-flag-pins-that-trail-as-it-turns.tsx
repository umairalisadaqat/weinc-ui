import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** The made-up company and its small world. */
const world = { name: "Small World No. 3", owner: "Aveline and Marrow, shippers" };

/** Flag pins. lat and lon are in degrees; each pin snaps to the nearest dot of land when the globe is made. */
const places = [
  { id: "aveline", name: "Port Aveline", role: "Head office", lat: 34, lon: 8, color: "#e2452c" },
  { id: "tessane", name: "Tessane", role: "Print works", lat: 8, lon: 96, color: "#f2b632" },
  { id: "marrow", name: "Marrow Quay", role: "Warehouse", lat: -22, lon: 178, color: "#1f8a5b" },
  { id: "ostrel", name: "Ostrel", role: "Studio", lat: 46, lon: 250, color: "#17171c" },
  { id: "fenwick", name: "Fenwick Sound", role: "Depot", lat: -6, lon: 318, color: "#ef7fa6" },
];

// Design pixels.
const LW = 640;
const LH = 600;
const R = 196; // radius of the globe
const CX = LW / 2;
const CY = 276;
const TILT = 0.36; // lean of the axis, in radians
const REST = 0.3; // how far the north pole tips toward you at rest
const IDLE = 0.17; // radians a second it turns when left alone
const GRID = 3; // degrees between dots
const DOT = 2.5;
const NEEDLE = 0.22;
const ASIDE = 0.6; // a chosen pin stops this far left of centre, in radians, so it is seen side on // pin length as a share of the radius
const SEA = 0.5; // raise for more ocean, lower for more land
const INK = ["#3b66ea", "#2146c0", "#152c80"]; // dot colour in light, half light and shade
const LIGHT = [-0.5, 0.6, 0.62];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const rad = (d: number) => (d * Math.PI) / 180;

const hash3 = (x: number, y: number, z: number) => {
  let n = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
  n = (n ^ (n >>> 13)) * 1274126177;
  n = n ^ (n >>> 16);
  return ((n >>> 0) % 100000) / 100000;
};
const noise3 = (x: number, y: number, z: number) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const s = (t: number) => t * t * (3 - 2 * t);
  const u = s(x - xi);
  const v = s(y - yi);
  const w = s(z - zi);
  const mix = (a: number, b: number, t: number) => a + (b - a) * t;
  const plane = (k: number) => mix(mix(hash3(xi, yi, zi + k), hash3(xi + 1, yi, zi + k), u), mix(hash3(xi, yi + 1, zi + k), hash3(xi + 1, yi + 1, zi + k), u), v);
  return mix(plane(0), plane(1), w);
};
/** Continents are invented: land is wherever four layers of noise add up past the SEA mark. */
const isLand = (x: number, y: number, z: number) => {
  let sum = 0;
  let amp = 0.5;
  let f = 1.45;
  for (let i = 0; i < 4; i++) {
    sum += amp * noise3(x * f + 5.3, y * f + 1.7, z * f + 9.1);
    amp *= 0.5;
    f *= 2.07;
  }
  return sum / 0.9375 > SEA && Math.abs(y) < 0.985;
};
const onSphere = (lat: number, lon: number) => {
  const c = Math.cos(rad(lat));
  return [c * Math.sin(rad(lon)), Math.sin(rad(lat)), c * Math.cos(rad(lon))];
};

function buildSprites(S: number) {
  const make = (w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) => {
    const cv = document.createElement("canvas");
    cv.width = Math.ceil(w * S);
    cv.height = Math.ceil(h * S);
    const c = cv.getContext("2d")!;
    c.scale(S, S);
    draw(c);
    return cv;
  };
  const standTop = CY + R * 0.86;
  const standRx = R * 0.52;
  const standRy = standRx * 0.27;
  const footY = CY + R * 1.07;
  const footRx = R * 0.66;
  const footRy = footRx * 0.24;
  const brass = (c: CanvasRenderingContext2D, x0: number, x1: number) => {
    const g = c.createLinearGradient(x0, 0, x1, 0);
    [[0, "#6f5220"], [0.12, "#b08a3e"], [0.28, "#f6e3a6"], [0.4, "#c9a352"], [0.58, "#a07a30"], [0.74, "#e8cd86"], [0.9, "#8a6828"], [1, "#5c4318"]].forEach(([o, col]) => g.addColorStop(o as number, col as string));
    return g;
  };

  // everything behind the ball: shadow on the table and the turned brass foot
  const back = make(LW, LH, (c) => {
    c.save();
    c.translate(CX + R * 0.26, footY + 6);
    c.scale(1, 0.2);
    const sh = c.createRadialGradient(0, 0, R * 0.2, 0, 0, R * 1.18);
    sh.addColorStop(0, "rgba(60,48,30,0.42)");
    sh.addColorStop(0.5, "rgba(60,48,30,0.16)");
    sh.addColorStop(1, "rgba(60,48,30,0)");
    c.fillStyle = sh;
    c.fillRect(-R * 1.4, -R * 1.4, R * 2.8, R * 2.8);
    c.restore();
    c.save();
    c.translate(CX + 6, footY + 3);
    c.scale(1, 0.26);
    const contact = c.createRadialGradient(0, 0, footRx * 0.6, 0, 0, footRx * 1.22);
    contact.addColorStop(0, "rgba(40,30,16,0.7)");
    contact.addColorStop(1, "rgba(40,30,16,0)");
    c.fillStyle = contact;
    c.fillRect(-footRx * 1.3, -footRx * 1.3, footRx * 2.6, footRx * 2.6);
    c.restore();
    c.fillStyle = brass(c, CX - footRx, CX + footRx);
    c.beginPath();
    c.ellipse(CX, standTop, standRx, standRy, 0, Math.PI, 0, true);
    c.bezierCurveTo(CX + standRx - 2, standTop + 26, CX + footRx, footY - 14, CX + footRx, footY);
    c.ellipse(CX, footY, footRx, footRy, 0, 0, Math.PI);
    c.bezierCurveTo(CX - footRx, footY - 14, CX - standRx + 2, standTop + 26, CX - standRx, standTop);
    c.fill();
    // lathe lines and the bright lip at the bottom
    c.lineWidth = 0.9;
    for (const [y, rx, a] of [[standTop + 15, standRx + 2.5, 0.32], [footY - 9, footRx - 1.5, 0.4]] as const) {
      c.strokeStyle = `rgba(60,40,10,${a})`;
      c.beginPath();
      c.ellipse(CX, y, rx, rx * 0.25, 0, 0.08, Math.PI - 0.08);
      c.stroke();
      c.strokeStyle = "rgba(255,244,205,0.5)";
      c.beginPath();
      c.ellipse(CX, y + 1.1, rx, rx * 0.25, 0, 0.08, Math.PI - 0.08);
      c.stroke();
    }
    c.strokeStyle = "rgba(255,246,214,0.6)";
    c.lineWidth = 1.2;
    c.beginPath();
    c.ellipse(CX, footY - 0.6, footRx - 0.6, footRy, 0, 0.15, Math.PI - 0.15);
    c.stroke();
  });

  // the porcelain ball with its lamp fixed up and to the left
  const ball = make(LW, LH, (c) => {
    c.beginPath();
    c.arc(CX, CY, R, 0, Math.PI * 2);
    c.clip();
    const body = c.createRadialGradient(CX - R * 0.36, CY - R * 0.42, R * 0.05, CX - R * 0.12, CY - R * 0.14, R * 1.2);
    [[0, "#ffffff"], [0.26, "#fbf8f1"], [0.52, "#ebe5d8"], [0.74, "#d3ccbc"], [0.9, "#b2a997"], [1, "#958c7a"]].forEach(([o, col]) => body.addColorStop(o as number, col as string));
    c.fillStyle = body;
    c.fillRect(0, 0, LW, LH);
    // warm light bounced up off the table and the brass
    const bounce = c.createRadialGradient(CX + R * 0.2, CY + R * 1.05, 0, CX + R * 0.2, CY + R * 1.05, R * 0.95);
    bounce.addColorStop(0, "rgba(255,226,170,0.55)");
    bounce.addColorStop(1, "rgba(255,226,170,0)");
    c.fillStyle = bounce;
    c.fillRect(0, 0, LW, LH);
    const edge = c.createRadialGradient(CX, CY, R * 0.86, CX, CY, R);
    edge.addColorStop(0, "rgba(70,60,45,0)");
    edge.addColorStop(1, "rgba(70,60,45,0.3)");
    c.fillStyle = edge;
    c.fillRect(0, 0, LW, LH);
  });

  // glaze: a soft bloom and the sharp reflection of a window, laid over the dots
  const gloss = make(LW, LH, (c) => {
    c.beginPath();
    c.arc(CX, CY, R, 0, Math.PI * 2);
    c.clip();
    const bloom = c.createRadialGradient(CX - R * 0.4, CY - R * 0.46, 0, CX - R * 0.4, CY - R * 0.46, R * 0.5);
    bloom.addColorStop(0, "rgba(255,255,255,0.75)");
    bloom.addColorStop(0.4, "rgba(255,255,255,0.22)");
    bloom.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = bloom;
    c.fillRect(0, 0, LW, LH);
    c.save();
    c.translate(CX - R * 0.43, CY - R * 0.5);
    c.rotate(-0.72);
    c.fillStyle = "rgba(255,255,255,0.9)";
    for (const dx of [-13, 3]) {
      c.beginPath();
      c.ellipse(dx + 6, 0, 6.5, 17, 0, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
    // the brass foot mirrored faintly in the underside
    const under = c.createLinearGradient(0, CY + R * 0.6, 0, CY + R * 0.9);
    under.addColorStop(0, "rgba(190,150,70,0)");
    under.addColorStop(1, "rgba(190,150,70,0.32)");
    c.fillStyle = under;
    c.fillRect(0, CY + R * 0.6, LW, R * 0.4);
  });

  // the near lip of the foot, which sits in front of the ball
  const lip = make(LW, LH, (c) => {
    c.strokeStyle = "rgba(40,28,8,0.5)";
    c.lineWidth = 5;
    c.beginPath();
    c.ellipse(CX, standTop - 2.4, standRx, standRy, 0, 0.1, Math.PI - 0.1);
    c.stroke();
    c.strokeStyle = brass(c, CX - standRx, CX + standRx);
    c.lineWidth = 4.2;
    c.beginPath();
    c.ellipse(CX, standTop, standRx, standRy, 0, 0, Math.PI);
    c.stroke();
    c.strokeStyle = "rgba(255,248,220,0.75)";
    c.lineWidth = 0.9;
    c.beginPath();
    c.ellipse(CX, standTop - 1.4, standRx, standRy, 0, 0.2, Math.PI - 0.2);
    c.stroke();
  });

  const heads = places.map((p) =>
    make(22, 22, (c) => {
      c.scale(1.375, 1.375);
      const g = c.createRadialGradient(6, 5.4, 0.3, 8, 8, 6.2);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.22, p.color);
      g.addColorStop(1, "rgba(0,0,0,0.9)");
      c.fillStyle = p.color;
      c.beginPath();
      c.arc(8, 8, 5.6, 0, Math.PI * 2);
      c.fill();
      c.globalAlpha = 0.62;
      c.fillStyle = g;
      c.fill();
      c.globalAlpha = 1;
      c.fillStyle = "rgba(255,255,255,0.92)";
      c.beginPath();
      c.ellipse(6.1, 5.6, 1.7, 1.1, -0.6, 0, Math.PI * 2);
      c.fill();
    }),
  );
  return { back, ball, gloss, lip, heads };
}

export default function PorcelainDottedDeskGlobe() {
  const reduce = !!useReducedMotion();
  const boxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [near, setNear] = useState(0);
  const ctl = useRef({ yaw: 0, vel: 0, pitch: REST, pitchTo: REST, goto: -1, hold: 0, dragging: false, touched: false, paused: false, lastX: 0, lastY: 0, lastT: 0, scale: 1 });

  const go = (i: number, byHand: boolean) => {
    const c = ctl.current;
    if (byHand) c.touched = true;
    c.goto = i;
    c.hold = 0;
  };

  useEffect(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    if (!box || !canvas) return;
    const ctx = canvas.getContext("2d")!;
    const c = ctl.current;
    let S = 1;
    let sprites = buildSprites(1);
    const size = () => {
      c.scale = box.clientWidth / LW;
      const next = clamp(c.scale * Math.min(2, window.devicePixelRatio || 1), 0.75, 2);
      if (Math.abs(next - S) < 0.05 && canvas.width > 300) return;
      S = next;
      canvas.width = Math.round(LW * S);
      canvas.height = Math.round(LH * S);
      sprites = buildSprites(S);
    };
    size();
    const ro = new ResizeObserver(() => {
      size();
      if (reduce) frame(performance.now());
    });
    ro.observe(box);

    // dots of land, one ring of latitude at a time
    const pts: number[] = [];
    for (let lat = -87; lat <= 87; lat += GRID) {
      const n = Math.max(1, Math.round((360 * Math.cos(rad(lat))) / GRID));
      for (let k = 0; k < n; k++) {
        const p = onSphere(lat, (k + (Math.round(lat / GRID) % 2) * 0.5) * (360 / n));
        if (isLand(p[0], p[1], p[2])) pts.push(p[0], p[1], p[2]);
      }
    }
    const N = pts.length / 3;
    const land = new Float32Array(pts);
    // each pin moves to the nearest dot of land so it never stands in the sea
    const pins = places.map((pl) => {
      const want = onSphere(pl.lat, pl.lon);
      let best = 0;
      let bestD = -2;
      for (let i = 0; i < N; i++) {
        const d = land[i * 3] * want[0] + land[i * 3 + 1] * want[1] + land[i * 3 + 2] * want[2];
        if (d > bestD) {
          bestD = d;
          best = i;
        }
      }
      const p = [land[best * 3], land[best * 3 + 1], land[best * 3 + 2]];
      return { p, lon: Math.atan2(p[0], p[2]), lat: Math.asin(p[1]), fx: 1, fy: 0, fvx: 0, fvy: 0, px: 0, py: 0, seen: false };
    });
    const bins = [0, 1, 2].map(() => new Float32Array(N * 4));
    // hairlines scored into the glaze: the equator, four parallels and six meridians
    const lines: { pts: number[][]; a: number }[] = [];
    for (const lat of [0, 30, -30, 60, -60]) {
      const pts: number[][] = [];
      for (let lon = 0; lon <= 360; lon += 4) pts.push(onSphere(lat, lon));
      lines.push({ pts, a: lat === 0 ? 0.34 : 0.15 });
    }
    for (let lon = 0; lon < 360; lon += 30) {
      const pts: number[][] = [];
      for (let lat = -84; lat <= 84; lat += 4) pts.push(onSphere(lat, lon));
      lines.push({ pts, a: 0.15 });
    }
    const pole = [0, 1, 0];

    // spin up at the start, then come round to the first pin
    c.yaw = pins[0].lon * -1 - 2.6;
    c.vel = reduce ? 0 : 3.3;
    if (reduce) {
      c.yaw = -pins[0].lon - ASIDE;
      c.pitch = c.pitchTo = REST;
    }
    let raf = 0;
    let seen = true;
    let stopped = false;
    let last = 0;
    let born = 0;
    let shown = -1;
    let nextTour = 0;
    let rot = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    const turn = (p: ArrayLike<number>, o: number, out: number[]) => {
      out[0] = rot[0] * p[o] + rot[1] * p[o + 1] + rot[2] * p[o + 2];
      out[1] = rot[3] * p[o] + rot[4] * p[o + 1] + rot[5] * p[o + 2];
      out[2] = rot[6] * p[o] + rot[7] * p[o + 1] + rot[8] * p[o + 2];
    };
    const v = [0, 0, 0];

    function frame(now: number) {
      raf = 0;
      if (!born) born = now;
      const dt = clamp((now - last) / 1000 || 0.016, 0.001, 0.05);
      last = now;
      const age = (now - born) / 1000;

      // motion: dragging sets the speed; left alone, friction eases it to a slow idle turn
      if (!c.dragging && !reduce) {
        if (c.goto < 0 && !c.touched && !c.paused && age > 0.95 && now > nextTour) {
          c.goto = shown < 0 ? 0 : (shown + 1) % pins.length;
          c.hold = 0;
        }
        if (c.goto >= 0) {
          const pin = pins[c.goto];
          let d = -pin.lon - ASIDE - c.yaw;
          d = ((((d + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
          // a spring that overshoots a little, like a globe caught by hand
          c.vel += (d * 15 - c.vel * 5.2) * dt;
          c.pitchTo = clamp(pin.lat * 0.75 - 0.12, -0.3, 0.7);
          if (Math.abs(d) < 0.02 && Math.abs(c.vel) < 0.04) {
            c.hold += dt;
            if (c.hold > (c.touched ? 4 : 2.6)) {
              shown = c.goto;
              c.goto = -1;
              c.pitchTo = REST;
              nextTour = now + 1500;
            }
          }
        } else c.vel += (IDLE - c.vel) * (1 - Math.exp(-dt / 0.75));
        c.yaw += c.vel * dt;
        c.pitch += (c.pitchTo - c.pitch) * (1 - Math.exp(-dt / 0.35));
      } else if (reduce && c.goto >= 0) {
        c.yaw = -pins[c.goto].lon - ASIDE;
        c.pitch = clamp(pins[c.goto].lat * 0.75 - 0.12, -0.3, 0.7);
        c.goto = -1;
      }

      const cy = Math.cos(c.yaw);
      const sy = Math.sin(c.yaw);
      const ct = Math.cos(TILT);
      const st = Math.sin(TILT);
      const cp = Math.cos(c.pitch);
      const sp = Math.sin(c.pitch);
      // spin about the axis, lean the axis over, then tip the pole toward the viewer
      const a = [cy, 0, sy, 0, 1, 0, -sy, 0, cy];
      const b = [ct * a[0] + st * a[3], ct * a[1] + st * a[4], ct * a[2] + st * a[5], -st * a[0] + ct * a[3], -st * a[1] + ct * a[4], -st * a[2] + ct * a[5], a[6], a[7], a[8]];
      rot = [b[0], b[1], b[2], cp * b[3] - sp * b[6], cp * b[4] - sp * b[7], cp * b[5] - sp * b[8], sp * b[3] + cp * b[6], sp * b[4] + cp * b[7], sp * b[5] + cp * b[8]];

      ctx.setTransform(S, 0, 0, S, 0, 0);
      ctx.clearRect(0, 0, LW, LH);
      ctx.drawImage(sprites.back, 0, 0, LW, LH);

      // pins: work out where each stands, and let its flag trail behind the way it is moving
      let front = -1;
      let frontZ = 0.2;
      const laid = pins.map((pin, i) => {
        turn(pin.p, 0, v);
        const bx = CX + v[0] * R;
        const by = CY - v[1] * R;
        const tx = CX + v[0] * R * (1 + NEEDLE);
        const ty = CY - v[1] * R * (1 + NEEDLE);
        const z = v[2];
        if (z > frontZ) {
          frontZ = z;
          front = i;
        }
        const vx = pin.seen ? (tx - pin.px) / dt : 0;
        const vy = pin.seen ? (ty - pin.py) / dt : 0;
        pin.px = tx;
        pin.py = ty;
        pin.seen = true;
        const flutter = reduce ? 0 : Math.sin(now / 190 + i * 1.7) * 0.1;
        let wx = 1 - vx * 0.011;
        let wy = 0.12 + flutter - vy * 0.011;
        const wl = Math.hypot(wx, wy) || 1;
        wx /= wl;
        wy /= wl;
        if (reduce) {
          pin.fx = wx;
          pin.fy = wy;
        } else {
          pin.fvx += ((wx - pin.fx) * 90 - pin.fvx * 9) * dt;
          pin.fvy += ((wy - pin.fy) * 90 - pin.fvy * 9) * dt;
          pin.fx += pin.fvx * dt;
          pin.fy += pin.fvy * dt;
        }
        return { i, bx, by, tx, ty, z, nx: v[0], ny: v[1] };
      });
      const drawPin = (q: (typeof laid)[number]) => {
        const pin = pins[q.i];
        const hx = q.tx - q.bx;
        const hy = q.ty - q.by;
        ctx.lineCap = "round";
        ctx.strokeStyle = "#6d727a";
        ctx.lineWidth = 2.3;
        ctx.beginPath();
        ctx.moveTo(q.bx, q.by);
        ctx.lineTo(q.tx, q.ty);
        ctx.stroke();
        ctx.strokeStyle = "#eef1f4";
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(q.bx - 0.4, q.by - 0.4);
        ctx.lineTo(q.tx - 0.4, q.ty - 0.4);
        ctx.stroke();
        // the flag: hoisted on the outer part of the needle, flying along (fx, fy)
        let m1x = q.bx + hx * 0.42;
        let m1y = q.by + hy * 0.42;
        const m2x = q.bx + hx * 0.86;
        const m2y = q.by + hy * 0.86;
        if (Math.hypot(m2x - m1x, m2y - m1y) < 12) {
          m1x = m2x;
          m1y = m2y + 12;
        }
        const len = 31;
        const mx = (m1x + m2x) / 2;
        const my = (m1y + m2y) / 2;
        const ex = mx + pin.fx * len;
        const ey = my + pin.fy * len;
        const wave = reduce ? 1.2 : Math.sin(now / 130 + q.i * 2.3) * 2.2;
        const kx = -pin.fy * wave;
        const ky = pin.fx * wave;
        ctx.beginPath();
        ctx.moveTo(m2x, m2y);
        ctx.quadraticCurveTo((m2x + ex) / 2 + kx, (m2y + ey) / 2 + ky, ex, ey - 1.5);
        ctx.lineTo(ex, ey + 1.5);
        ctx.quadraticCurveTo((m1x + ex) / 2 + kx, (m1y + ey) / 2 + ky, m1x, m1y);
        ctx.closePath();
        ctx.fillStyle = places[q.i].color;
        ctx.fill();
        const sh = ctx.createLinearGradient(mx, my, ex, ey);
        sh.addColorStop(0, "rgba(255,255,255,0.28)");
        sh.addColorStop(0.45, "rgba(0,0,0,0)");
        sh.addColorStop(0.7, "rgba(0,0,0,0.2)");
        sh.addColorStop(1, "rgba(255,255,255,0.1)");
        ctx.fillStyle = sh;
        ctx.fill();
        ctx.drawImage(sprites.heads[q.i], q.tx - 11, q.ty - 11, 22, 22);
      };
      laid.filter((q) => q.z <= 0).forEach(drawPin);

      ctx.drawImage(sprites.ball, 0, 0, LW, LH);

      // the dots, sorted into three strengths of blue by how much lamp reaches them
      const count = [0, 0, 0];
      for (let i = 0; i < N; i++) {
        turn(land, i * 3, v);
        if (v[2] <= 0.02) continue;
        const lit = v[0] * LIGHT[0] + v[1] * LIGHT[1] + v[2] * LIGHT[2];
        const k = lit > 0.42 ? 0 : lit > -0.05 ? 1 : 2;
        const o = count[k] * 4;
        bins[k][o] = CX + v[0] * R;
        bins[k][o + 1] = CY - v[1] * R;
        // a round dot on a ball is seen as an ellipse, squashed along the line out from the centre
        bins[k][o + 2] = DOT * Math.max(0.22, v[2]);
        bins[k][o + 3] = Math.atan2(-v[1], v[0]);
        count[k]++;
      }
      // a pale crescent under each dot makes it read as pressed into the glaze
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.beginPath();
      for (let k = 0; k < 3; k++)
        for (let i = 0; i < count[k]; i++) {
          const o = i * 4;
          ctx.moveTo(bins[k][o] + 0.8, bins[k][o + 1] + 0.9);
          ctx.ellipse(bins[k][o] + 0.8, bins[k][o + 1] + 0.9, bins[k][o + 2], DOT, bins[k][o + 3], 0, Math.PI * 2);
        }
      ctx.fill();
      for (let k = 0; k < 3; k++) {
        ctx.fillStyle = INK[k];
        ctx.beginPath();
        for (let i = 0; i < count[k]; i++) {
          const o = i * 4;
          ctx.moveTo(bins[k][o], bins[k][o + 1]);
          ctx.ellipse(bins[k][o], bins[k][o + 1], bins[k][o + 2], DOT, bins[k][o + 3], 0, Math.PI * 2);
        }
        ctx.fill();
      }
      ctx.lineWidth = 0.9;
      for (const line of lines) {
        ctx.strokeStyle = `rgba(33,70,192,${line.a})`;
        ctx.beginPath();
        let pen = false;
        for (const e of line.pts) {
          turn(e, 0, v);
          if (v[2] <= 0.03) {
            pen = false;
            continue;
          }
          pen ? ctx.lineTo(CX + v[0] * R, CY - v[1] * R) : ctx.moveTo(CX + v[0] * R, CY - v[1] * R);
          pen = true;
        }
        ctx.stroke();
      }
      // a brass cap where the axis comes out at the north pole
      turn(pole, 0, v);
      if (v[2] > 0.05) {
        const ang = Math.atan2(-v[1], v[0]);
        const x = CX + v[0] * R;
        const y = CY - v[1] * R;
        ctx.fillStyle = "rgba(60,45,20,0.35)";
        ctx.beginPath();
        ctx.ellipse(x + 1.2, y + 1.6, 7.5 * Math.max(0.25, v[2]), 7.5, ang, 0, Math.PI * 2);
        ctx.fill();
        const cap = ctx.createLinearGradient(x - 6, y - 6, x + 6, y + 6);
        cap.addColorStop(0, "#fbeab4");
        cap.addColorStop(0.5, "#c59c4a");
        cap.addColorStop(1, "#7a5a22");
        ctx.fillStyle = cap;
        ctx.beginPath();
        ctx.ellipse(x, y, 6.6 * Math.max(0.25, v[2]), 6.6, ang, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#5d4418";
        ctx.beginPath();
        ctx.ellipse(x, y, 2 * Math.max(0.25, v[2]), 2, ang, 0, Math.PI * 2);
        ctx.fill();
      }

      // the shadow each near pin lays across the porcelain, then the pins themselves
      const near = laid.filter((q) => q.z > 0).sort((p, q) => p.z - q.z);
      for (const q of near) {
        turn(pins[q.i].p, 0, v);
        const sx = v[0] * (1 + NEEDLE) - LIGHT[0] * NEEDLE * 0.9;
        const syy = v[1] * (1 + NEEDLE) - LIGHT[1] * NEEDLE * 0.9;
        const sz = v[2] * (1 + NEEDLE) - LIGHT[2] * NEEDLE * 0.9;
        const sl = Math.hypot(sx, syy, sz);
        if (sz / sl < 0.05) continue;
        const g = ctx.createLinearGradient(q.bx, q.by, CX + (sx / sl) * R, CY - (syy / sl) * R);
        g.addColorStop(0, "rgba(60,50,35,0.42)");
        g.addColorStop(1, "rgba(60,50,35,0)");
        ctx.strokeStyle = g;
        ctx.lineWidth = 2.6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(q.bx, q.by);
        ctx.lineTo(CX + (sx / sl) * R, CY - (syy / sl) * R);
        ctx.stroke();
      }
      ctx.drawImage(sprites.gloss, 0, 0, LW, LH);
      near.forEach(drawPin);
      ctx.drawImage(sprites.lip, 0, 0, LW, LH);

      const named = c.goto >= 0 ? c.goto : front;
      if (named >= 0 && named !== shownName) {
        shownName = named;
        setNear(named);
      }
      const deg = Math.round((((((c.yaw * 180) / Math.PI) % 360) + 360) % 360) / 5) * 5;
      if (deg !== lastDeg) {
        lastDeg = deg;
        box.setAttribute("aria-valuenow", String(deg));
      }
      if (!reduce && seen && !document.hidden && !stopped) raf = requestAnimationFrame(frame);
    }
    let shownName = -1;
    let lastDeg = -1;
    const kick = () => {
      if (!raf && !stopped) raf = requestAnimationFrame(frame);
    };
    kick();
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting;
      if (seen) kick();
    });
    io.observe(box);
    const onVis = () => !document.hidden && kick();
    document.addEventListener("visibilitychange", onVis);
    // with motion reduced there is no loop: redraw only when something asks for it
    const poll = reduce ? window.setInterval(() => (c.goto >= 0 || c.dragging || c.vel !== 0) && ((c.vel = 0), kick()), 100) : 0;
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      if (poll) window.clearInterval(poll);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [reduce]);

  const onDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const c = ctl.current;
    c.dragging = true;
    c.touched = true;
    c.goto = -1;
    c.pitchTo = c.pitch;
    c.lastX = e.clientX;
    c.lastY = e.clientY;
    c.lastT = performance.now();
    c.vel = reduce ? 1 : 0;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onDrag = (e: React.PointerEvent) => {
    const c = ctl.current;
    if (!c.dragging) return;
    const now = performance.now();
    const k = 1 / (R * c.scale);
    const d = (e.clientX - c.lastX) * k;
    c.yaw += d;
    c.pitch = clamp(c.pitch + (e.clientY - c.lastY) * k, -0.5, 0.95);
    c.pitchTo = c.pitch;
    if (!reduce) c.vel = c.vel * 0.55 + (d / Math.max(0.004, (now - c.lastT) / 1000)) * 0.45;
    else c.vel = 1;
    c.lastX = e.clientX;
    c.lastY = e.clientY;
    c.lastT = now;
  };
  const onUp = () => {
    const c = ctl.current;
    if (!c.dragging) return;
    c.dragging = false;
    if (performance.now() - c.lastT > 90) c.vel = reduce ? 1 : 0;
    c.vel = clamp(c.vel, -14, 14);
  };
  const onKey = (e: React.KeyboardEvent) => {
    const c = ctl.current;
    const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!step) return;
    e.preventDefault();
    c.touched = true;
    c.goto = -1;
    if (reduce) {
      c.yaw += step[0] * 0.26;
      c.vel = 1;
    } else c.vel += step[0] * 1.8;
    c.pitchTo = clamp(c.pitchTo + step[1] * 0.2, -0.5, 0.95);
    if (reduce) c.pitch = c.pitchTo;
  };

  return (
    <section className="relative overflow-hidden bg-[#e7e3da]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(60% 56% at 44% 38%, #f6f3ec 0%, #e9e5dc 48%, #d6d0c3 100%)" }} />
      <div className="relative mx-auto w-full max-w-[720px] px-2 pt-4 sm:pt-6">
        <div
          ref={boxRef}
          role="slider"
          tabIndex={0}
          aria-label={`Spin the globe of ${world.name}. Arrow keys turn and tip it.`}
          aria-valuemin={0}
          aria-valuemax={360}
          aria-valuenow={0}
          aria-valuetext={`${places[near].name} is nearest`}
          onPointerDown={onDown}
          onPointerMove={onDrag}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onPointerEnter={() => (ctl.current.paused = true)}
          onPointerLeave={() => (ctl.current.paused = false)}
          onKeyDown={onKey}
          className="relative w-full cursor-grab touch-pan-y select-none rounded-[28px] outline-none focus-visible:ring-2 focus-visible:ring-[#2146c0] active:cursor-grabbing"
          style={{ aspectRatio: `${LW} / ${LH}` }}
        >
          <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        </div>
      </div>

      <div className="relative flex flex-col gap-3 px-5 pb-6 pt-1 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:pb-8">
        <p className="font-mono text-[11px] uppercase leading-relaxed tracking-[0.18em] text-stone-600">
          <span className="text-stone-900">
            {world.name} / {world.owner}
          </span>
          <span className="block" aria-live="polite">
            {places[near].name}: {places[near].role}
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          {places.map((p, i) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={near === i}
              onClick={() => go(i, true)}
              className={`flex h-10 items-center gap-2 rounded-full px-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#2146c0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e7e3da] ${near === i ? "bg-stone-900 text-white" : "bg-white/70 text-stone-800 hover:bg-white"}`}
            >
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10" style={{ background: p.color }} />
              {p.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
