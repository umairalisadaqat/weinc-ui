import { useEffect, useRef } from "react";

const LATITUDE = 52; // degrees: how steeply the polar axis leans above the horizon ring
const SPIN = 0.22; // radians per second the inner sphere turns when left alone
const GLOBE = ["#9fc0ff", "#2c56c8", "#0f2470", "#040a2c"]; // the enamel ball at the centre, light to dark
const LABEL = "Halden Observatory";
const NOTE = "Open nights from dusk, Thursday to Sunday";

const TAU = Math.PI * 2, TILT = ((90 - LATITUDE) * Math.PI) / 180, EPS = (23.44 * Math.PI) / 180;
type V3 = [number, number, number];
type Hoop = { n: V3; c?: V3; R: number; a: number; b: number; N: number; from?: number; to?: number; group: 0 | 1; ticks?: "top" | "outer"; long?: number };
const R0 = 0.8;
// Every ring: `n` is the axis it is wound round, `a` half its radial thickness, `b` half its width along the axis.
const hoops: Hoop[] = [
  { n: [0, 1, 0], R: 1, a: 0.078, b: 0.013, N: 72, group: 0, ticks: "top", long: 6 }, // horizon
  { n: [0, 0, 1], R: 0.9, a: 0.036, b: 0.014, N: 72, group: 0, ticks: "top", long: 6 }, // meridian
  { n: [1, 0, 1], R: 1.0, a: 0.017, b: 0.017, N: 30, from: Math.PI, to: TAU, group: 0 }, // four cradle arms under the horizon
  { n: [1, 0, -1], R: 1.0, a: 0.017, b: 0.017, N: 30, from: Math.PI, to: TAU, group: 0 },
  { n: [0, 1, 0], R: R0 + 0.014, a: 0.007, b: 0.02, N: 72, group: 1 }, // equator
  { n: [Math.sin(EPS), Math.cos(EPS), 0], R: R0 + 0.03, a: 0.007, b: 0.034, N: 72, group: 1, ticks: "outer", long: 6 }, // ecliptic
  { n: [0, 1, 0], c: [0, R0 * Math.sin(EPS), 0], R: R0 * Math.cos(EPS), a: 0.007, b: 0.016, N: 60, group: 1 }, // tropics
  { n: [0, 1, 0], c: [0, -R0 * Math.sin(EPS), 0], R: R0 * Math.cos(EPS), a: 0.007, b: 0.016, N: 60, group: 1 },
  { n: [0, 1, 0], c: [0, R0 * Math.cos(EPS), 0], R: R0 * Math.sin(EPS), a: 0.007, b: 0.014, N: 36, group: 1 }, // polar circles
  { n: [0, 1, 0], c: [0, -R0 * Math.cos(EPS), 0], R: R0 * Math.sin(EPS), a: 0.007, b: 0.014, N: 36, group: 1 },
  { n: [1, 0, 0], R: R0, a: 0.018, b: 0.008, N: 64, group: 1 }, // the two colures that tie the cage together
  { n: [0, 0, 1], R: R0, a: 0.018, b: 0.008, N: 64, group: 1 },
];

export default function BrassArmillarySphereBackground() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = root.current, cv = canvas.current;
    if (!el || !cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const norm = (v: V3): V3 => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
    const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

    // ---- Geometry, built once in each ring's own space: 4 corner rails and 4 faces per segment.
    const rings = hoops.map((h) => {
      const n = norm(h.n), u = norm(cross(Math.abs(n[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0], n)), v = cross(n, u), c = h.c ?? [0, 0, 0];
      const from = h.from ?? 0, to = h.to ?? TAU, N = h.N;
      const pts = new Float32Array((N + 1) * 12), rad = new Float32Array((N + 1) * 3), tan = new Float32Array((N + 1) * 3);
      for (let k = 0; k <= N; k++) {
        const t = from + ((to - from) * k) / N, cs = Math.cos(t), sn = Math.sin(t);
        [[h.R - h.a, -h.b], [h.R + h.a, -h.b], [h.R + h.a, h.b], [h.R - h.a, h.b]].forEach(([r, d], q) => {
          for (let i = 0; i < 3; i++) pts[k * 12 + q * 3 + i] = c[i] + (u[i] * cs + v[i] * sn) * r + n[i] * d;
        });
        for (let i = 0; i < 3; i++) { rad[k * 3 + i] = u[i] * cs + v[i] * sn; tan[k * 3 + i] = -u[i] * sn + v[i] * cs; }
      }
      return { h, n, N, pts, rad, tan, out: new Float32Array((N + 1) * 12), lum: new Float32Array((N + 1) * 4), vr: new Float32Array((N + 1) * 3) };
    });

    // Polished brass, dark to white hot, as ready-made colour strings.
    const stops = [[16, 8, 3], [88, 52, 12], [170, 120, 36], [226, 180, 80], [252, 228, 156], [255, 252, 236]];
    const BRASS: string[] = [];
    for (let i = 0; i < 96; i++) { const x = (i / 95) * (stops.length - 1), j = Math.min(stops.length - 2, Math.floor(x)), f = x - j, p = stops[j], q = stops[j + 1]; BRASS.push(`rgb(${(p[0] + (q[0] - p[0]) * f) | 0},${(p[1] + (q[1] - p[1]) * f) | 0},${(p[2] + (q[2] - p[2]) * f) | 0})`); }
    const L1 = norm([-0.5, 0.78, 0.42]), L2 = norm([0.85, 0.15, -0.35]), H1 = norm([L1[0], L1[1], L1[2] + 1]), H2 = norm([L2[0], L2[1], L2[2] + 1]);
    // What a mirror facing `n` shows of the room, plus the streak that circular brushing adds along `t`.
    const env = (nx: number, ny: number, nz: number, tx: number, ty: number, tz: number) => {
      const rx = 2 * nz * nx, ry = 2 * nz * ny, rz = 2 * nz * nz - 1;
      const k1 = Math.max(0, rx * L1[0] + ry * L1[1] + rz * L1[2]), k2 = Math.max(0, rx * L2[0] + ry * L2[1] + rz * L2[2]);
      let e = 0.11 + 0.4 * k1 * k1 * k1 + 1.0 * Math.pow(k1, 18) + 0.4 * Math.pow(k2, 4);
      e += ry < 0 ? 0.24 * -ry : 0.05 * ry;
      const d1 = tx * H1[0] + ty * H1[1] + tz * H1[2], d2 = tx * H2[0] + ty * H2[1] + tz * H2[2];
      e += 0.75 * Math.pow(1 - d1 * d1, 26) * Math.max(0, nx * L1[0] + ny * L1[1] + nz * L1[2] + 0.25);
      e += 0.28 * Math.pow(1 - d2 * d2, 14) * Math.max(0, nx * L2[0] + ny * L2[1] + nz * L2[2] + 0.2);
      return e + 0.14 * Math.pow(1 - Math.abs(nz), 3);
    };

    const MAXF = 6000, STR = 13;
    const buf = new Float32Array(MAXF * STR), order = new Uint16Array(MAXF);
    let W = 0, Hh = 0, S = 100, cx = 0, cy = 0;
    const s = { spin: 0.9, spinV: 0, yaw: -0.42, pitch: 0.36, yawTo: -0.42, pitchTo: 0.36, drag: false };
    const F = 6.5;
    const m0 = new Float32Array(9), m1 = new Float32Array(9);
    const mats = () => {
      const cyw = Math.cos(s.yaw), syw = Math.sin(s.yaw), cp = Math.cos(s.pitch), sp = Math.sin(s.pitch);
      // view = pitch about X after yaw about Y
      m0.set([cyw, 0, syw, sp * syw, cp, -sp * cyw, -cp * syw, sp, cp * cyw]);
      // inner sphere: spin about its own Y, then lean the axis over, then view
      const ct = Math.cos(TILT), st = Math.sin(TILT), cf = Math.cos(s.spin), sf = Math.sin(s.spin);
      const g = [ct * cf, st, ct * sf, -st * cf, ct, -st * sf, -sf, 0, cf];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) m1[r * 3 + c] = m0[r * 3] * g[c] + m0[r * 3 + 1] * g[3 + c] + m0[r * 3 + 2] * g[6 + c];
    };
    // Points on the stand's centre line recede as they drop, the same way the rings do.
    const ak = (h: number, sp: number) => (F / (F - h * sp)) * S;
    const lathe = (profile: [number, number][], cp: number, sp: number) => {
      // a turned column seen slightly from above: mirrored outline with a rounded underside
      ctx.beginPath();
      profile.forEach(([h, r], i) => { const k = ak(h, sp), x = cx - r * k, y = cy - h * cp * k; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
      const [hb, rb] = profile[profile.length - 1], kb = ak(hb, sp);
      ctx.ellipse(cx, cy - hb * cp * kb, rb * kb, rb * kb * sp, 0, Math.PI, 0, true);
      for (let i = profile.length - 1; i >= 0; i--) { const k = ak(profile[i][0], sp); ctx.lineTo(cx + profile[i][1] * k, cy - profile[i][0] * cp * k); }
      ctx.closePath();
    };
    // Round off a hand-written profile so the knops read as turned, not cut.
    const smooth = (pts: [number, number][]) => { let p = pts; for (let n = 0; n < 2; n++) { const q: [number, number][] = [p[0]]; for (let i = 0; i < p.length - 1; i++) { q.push([p[i][0] * 0.75 + p[i + 1][0] * 0.25, p[i][1] * 0.75 + p[i + 1][1] * 0.25], [p[i][0] * 0.25 + p[i + 1][0] * 0.75, p[i][1] * 0.25 + p[i + 1][1] * 0.75]); } q.push(p[p.length - 1]); p = q; } return p; };
    const FOOT = smooth([[-1.585, 0.1], [-1.6, 0.2], [-1.625, 0.33], [-1.66, 0.4], [-1.7, 0.43], [-1.72, 0.43]]);
    const COLUMN = smooth([[-0.985, 0.03], [-1.03, 0.08], [-1.06, 0.09], [-1.085, 0.045], [-1.12, 0.032], [-1.2, 0.03], [-1.25, 0.04], [-1.3, 0.09], [-1.34, 0.1], [-1.37, 0.05], [-1.42, 0.04], [-1.5, 0.05], [-1.555, 0.09], [-1.59, 0.115], [-1.6, 0.115]]);

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, Hh);
      mats();
      const cp = Math.cos(s.pitch), sp = Math.sin(s.pitch);

      // floor: pool of light, then the stand's shadow
      const fy = cy + 1.72 * cp * ak(-1.72, sp), pool = ctx.createRadialGradient(cx, fy, 0, cx, fy, S * 2.4);
      pool.addColorStop(0, "rgba(255,150,120,0.17)"); pool.addColorStop(0.4, "rgba(255,120,100,0.05)"); pool.addColorStop(1, "rgba(255,120,100,0)");
      ctx.save(); ctx.translate(cx, fy); ctx.scale(1, 0.3); ctx.translate(-cx, -fy); ctx.fillStyle = pool; ctx.fillRect(cx - S * 2.5, fy - S * 2.5, S * 5, S * 5);
      const sh = ctx.createRadialGradient(cx + S * 0.16, fy + S * 0.1, S * 0.2, cx + S * 0.16, fy + S * 0.1, S * 1.25);
      sh.addColorStop(0, "rgba(6,0,2,0.85)"); sh.addColorStop(0.45, "rgba(6,0,2,0.4)"); sh.addColorStop(1, "rgba(6,0,2,0)");
      ctx.fillStyle = sh; ctx.fillRect(cx - S * 2.5, fy - S * 2.5, S * 5, S * 5); ctx.restore();

      // the turned stand
      const run = (half: number, dim = 1) => { const g = ctx.createLinearGradient(cx - half, 0, cx + half, 0); for (const [p, v] of [[0, 0.1], [0.1, 0.3], [0.22, 0.98], [0.3, 0.66], [0.55, 0.34], [0.8, 0.14], [0.93, 0.52], [1, 0.16]]) g.addColorStop(p, BRASS[Math.round(v * dim * 95)]); return g; };
      const hoop = (h: number, r: number, a0: number, a1: number, col: string, dy = 0) => { const k = ak(h, sp); ctx.beginPath(); ctx.ellipse(cx, cy - h * cp * k + dy, r * k, r * k * sp, 0, a0, a1); ctx.lineWidth = 0.9; ctx.strokeStyle = col; ctx.stroke(); };
      lathe(FOOT, cp, sp); ctx.fillStyle = run(0.43 * S, 0.92); ctx.fill(); ctx.lineWidth = 0.6; ctx.strokeStyle = "rgba(10,4,0,0.7)"; ctx.stroke();
      for (const [h, r] of [[-1.6, 0.2], [-1.625, 0.33], [-1.66, 0.4], [-1.7, 0.43]]) { hoop(h, r, 0.1, Math.PI - 0.1, "rgba(20,8,0,0.5)"); hoop(h, r, 0.5, Math.PI - 1.2, "rgba(255,240,200,0.4)", 1); }
      lathe(COLUMN, cp, sp); ctx.fillStyle = run(0.105 * S); ctx.fill(); ctx.lineWidth = 0.6; ctx.strokeStyle = "rgba(10,4,0,0.75)"; ctx.stroke();
      for (const [h, r] of [[-1.045, 0.086], [-1.32, 0.096], [-1.57, 0.1]]) { hoop(h, r, 0.1, Math.PI - 0.1, "rgba(20,8,0,0.6)"); hoop(h, r, 0.6, Math.PI - 1.4, "rgba(255,240,200,0.45)", 1); }

      // ---- rings: transform, cull, shade, then paint far to near
      let nf = 0;
      const put = (z: number, kind: number, a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, col: number, tick: number, w = 0) => {
        if (nf >= MAXF) return; const o = nf * STR;
        buf[o] = z; buf[o + 1] = kind; buf[o + 2] = a; buf[o + 3] = b; buf[o + 4] = c; buf[o + 5] = d; buf[o + 6] = e; buf[o + 7] = f; buf[o + 8] = g; buf[o + 9] = h; buf[o + 10] = col; buf[o + 11] = tick; buf[o + 12] = w; order[nf] = nf; nf++;
      };
      for (const r of rings) {
        const m = r.h.group ? m1 : m0, o = r.out, p = r.pts, n = (r.N + 1) * 4;
        for (let i = 0; i < n; i++) {
          const x = p[i * 3], y = p[i * 3 + 1], z = p[i * 3 + 2];
          const vx = m[0] * x + m[1] * y + m[2] * z, vy = m[3] * x + m[4] * y + m[5] * z, vz = m[6] * x + m[7] * y + m[8] * z, k = (F / (F - vz)) * S;
          o[i * 3] = cx + vx * k; o[i * 3 + 1] = cy - vy * k; o[i * 3 + 2] = vz;
        }
        const ax = m[0] * r.n[0] + m[1] * r.n[1] + m[2] * r.n[2], ay = m[3] * r.n[0] + m[4] * r.n[1] + m[5] * r.n[2], az = m[6] * r.n[0] + m[7] * r.n[1] + m[8] * r.n[2];
        // light is worked out on each edge between segments, then run across the face as a gradient
        const R = r.rad, T = r.tan, vr = r.vr, lum = r.lum;
        for (let k = 0; k <= r.N; k++) {
          const i3 = k * 3;
          const qx = m[0] * R[i3] + m[1] * R[i3 + 1] + m[2] * R[i3 + 2], qy = m[3] * R[i3] + m[4] * R[i3 + 1] + m[5] * R[i3 + 2], qz = m[6] * R[i3] + m[7] * R[i3 + 1] + m[8] * R[i3 + 2];
          const tx = m[0] * T[i3] + m[1] * T[i3 + 1] + m[2] * T[i3 + 2], ty = m[3] * T[i3] + m[4] * T[i3 + 1] + m[5] * T[i3 + 2], tz = m[6] * T[i3] + m[7] * T[i3 + 1] + m[8] * T[i3 + 2];
          vr[i3] = qx; vr[i3 + 1] = qy; vr[i3 + 2] = qz;
          lum[k * 4] = env(qx, qy, qz, tx, ty, tz); lum[k * 4 + 1] = env(-qx, -qy, -qz, tx, ty, tz) * 0.8;
          lum[k * 4 + 2] = env(ax, ay, az, tx, ty, tz); lum[k * 4 + 3] = env(-ax, -ay, -az, tx, ty, tz);
        }
        const tone = (v: number) => Math.max(0, Math.min(95, Math.round(v * 95)));
        for (let k = 0; k < r.N; k++) {
          const a = k * 12, b = a + 12, i3 = k * 3;
          const qx = (vr[i3] + vr[i3 + 3]) / 2, qy = (vr[i3 + 1] + vr[i3 + 4]) / 2, qz = (vr[i3 + 2] + vr[i3 + 5]) / 2;
          // face: the two rails it spans, its normal, which light column it reads, and whether engraving sits on it
          const face = (q0: number, q1: number, nx: number, ny: number, nz: number, li: number, engraved: boolean) => {
            const mx = (o[a + q0] + o[b + q1]) / 2, my = (o[a + q0 + 1] + o[b + q1 + 1]) / 2, mz = (o[a + q0 + 2] + o[b + q1 + 2]) / 2;
            // keep only faces that look toward a camera sitting on the z axis
            if (nz * (F - mz) - (nx * (mx - cx) - ny * (my - cy)) / S <= 0.02) return;
            const tick = engraved ? (k % (r.h.long ?? 5) === 0 ? 2 : 1) : 0;
            const far = 0.72 + 0.28 * Math.min(1, Math.max(0, (mz + 1.05) / 1.6)); // rings at the back sit in a little more shade
            put(mz, 0, o[a + q0], o[a + q0 + 1], o[b + q0], o[b + q0 + 1], o[b + q1], o[b + q1 + 1], o[a + q1], o[a + q1 + 1], tone(lum[k * 4 + li] * far), tick, tone(lum[k * 4 + 4 + li] * far));
          };
          face(3, 6, qx, qy, qz, 0, r.h.ticks === "outer");
          face(9, 0, -qx, -qy, -qz, 1, false);
          face(9, 6, ax, ay, az, 2, r.h.ticks === "top");
          face(0, 3, -ax, -ay, -az, 3, false);
        }
      }
      // the polar axis: a rod through the cage with a ball finial at each end
      const P = (t: number): V3 => { const x = 0, y = t, z = 0; const vx = m1[0] * x + m1[1] * y + m1[2] * z, vy = m1[3] * x + m1[4] * y + m1[5] * z, vz = m1[6] * x + m1[7] * y + m1[8] * z, k = (F / (F - vz)) * S; return [cx + vx * k, cy - vy * k, vz]; };
      for (let i = 0; i < 14; i++) { const a = P(-0.98 + (1.96 * i) / 14), b = P(-0.98 + (1.96 * (i + 1)) / 14); put((a[2] + b[2]) / 2, 1, a[0], a[1], b[0], b[1], 0, 0, 0, 0, 0, 0, S * 0.02); }
      for (const t of [-1.0, 1.0]) { const a = P(t); put(a[2], 2, a[0], a[1], S * 0.034 * (F / (F - a[2])), 1, 0, 0, 0, 0, 0, 0); }
      put(0, 2, cx, cy, S * 0.16, 0, 0, 0, 0, 0, 0, 0);

      const idx = order.subarray(0, nf);
      idx.sort((p, q) => buf[p * STR] - buf[q * STR]);
      ctx.lineJoin = "round";
      for (let i = 0; i < nf; i++) {
        const o = idx[i] * STR, kind = buf[o + 1];
        if (kind === 0) {
          const c0 = buf[o + 10], c1 = buf[o + 12], x0 = buf[o + 2], y0 = buf[o + 3], x1 = buf[o + 4], y1 = buf[o + 5], x2 = buf[o + 6], y2 = buf[o + 7], x3 = buf[o + 8], y3 = buf[o + 9];
          // each face runs half a pixel under the next one, which hides the seams without a second stroke
          const ex = x1 - x0, ey = y1 - y0, el = 0.6 / (Math.hypot(ex, ey) || 1), fx = x2 - x3, fy2 = y2 - y3, fl = 0.6 / (Math.hypot(fx, fy2) || 1);
          const mid = (c0 + c1) >> 1;
          let col: string | CanvasGradient = BRASS[mid];
          if (Math.abs(c0 - c1) > 3) { const g = ctx.createLinearGradient((x0 + x3) / 2, (y0 + y3) / 2, (x1 + x2) / 2, (y1 + y2) / 2); g.addColorStop(0, BRASS[c0]); g.addColorStop(1, BRASS[c1]); col = g; }
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 + ex * el, y1 + ey * el); ctx.lineTo(x2 + fx * fl, y2 + fy2 * fl); ctx.lineTo(x3, y3); ctx.closePath();
          ctx.fillStyle = col; ctx.fill();
          // on faces wide enough to show it, the two long edges are chamfered: one catches the lamp, one falls away
          if (Math.abs(x3 - x0) + Math.abs(y3 - y0) > 2.4) {
            ctx.lineWidth = 0.9;
            ctx.beginPath(); ctx.moveTo(x3, y3); ctx.lineTo(x2, y2); ctx.strokeStyle = BRASS[Math.min(95, mid + 22)]; ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.strokeStyle = BRASS[Math.max(0, mid - 13)]; ctx.stroke();
          }
          const tick = buf[o + 11];
          if (tick) {
            const f0 = tick === 2 ? 0.3 : 0.62, x0 = buf[o + 2] + (buf[o + 8] - buf[o + 2]) * f0, y0 = buf[o + 3] + (buf[o + 9] - buf[o + 3]) * f0, x1 = buf[o + 2] + (buf[o + 8] - buf[o + 2]) * 0.94, y1 = buf[o + 3] + (buf[o + 9] - buf[o + 3]) * 0.94;
            ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineWidth = tick === 2 ? 1.1 : 0.7; ctx.strokeStyle = "rgba(26,10,0,0.7)"; ctx.stroke();
          }
        } else if (kind === 1) {
          const w = buf[o + 12];
          ctx.lineCap = "butt";
          ctx.beginPath(); ctx.moveTo(buf[o + 2], buf[o + 3]); ctx.lineTo(buf[o + 4], buf[o + 5]); ctx.lineWidth = w + 1; ctx.strokeStyle = BRASS[6]; ctx.stroke();
          ctx.lineWidth = w * 0.72; ctx.strokeStyle = BRASS[46]; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(buf[o + 2] - w * 0.16, buf[o + 3] - w * 0.2); ctx.lineTo(buf[o + 4] - w * 0.16, buf[o + 5] - w * 0.2); ctx.lineWidth = w * 0.26; ctx.strokeStyle = BRASS[90]; ctx.stroke();
        } else {
          const x = buf[o + 2], y = buf[o + 3], r = buf[o + 4], metal = buf[o + 5] === 1;
          const g = ctx.createRadialGradient(x - r * 0.36, y - r * 0.42, r * 0.04, x - r * 0.1, y - r * 0.12, r * 1.15);
          const pal = metal ? ["#fff8dc", "#e8bd58", "#8a5c14", "#1c0c02"] : GLOBE;
          g.addColorStop(0, pal[0]); g.addColorStop(0.3, pal[1]); g.addColorStop(0.74, pal[2]); g.addColorStop(1, pal[3]);
          ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fillStyle = g; ctx.fill();
          ctx.save(); ctx.clip();
          const b = ctx.createRadialGradient(x + r * 0.5, y + r * 0.7, 0, x + r * 0.5, y + r * 0.7, r * 0.7);
          b.addColorStop(0, "rgba(255,150,110,0.4)"); b.addColorStop(1, "rgba(255,150,110,0)");
          ctx.fillStyle = b; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
          ctx.lineWidth = 0.6; ctx.strokeStyle = "rgba(0,0,0,0.6)"; ctx.stroke();
          ctx.save(); ctx.translate(x - r * 0.38, y - r * 0.44); ctx.rotate(-0.7); ctx.shadowColor = "#fff"; ctx.shadowBlur = r * 0.3 * dpr;
          ctx.beginPath(); ctx.ellipse(0, 0, r * 0.22, r * 0.12, 0, 0, TAU); ctx.fillStyle = "rgba(255,255,255,0.95)"; ctx.fill(); ctx.restore();
        }
      }
    };

    let raf = 0, last = 0, seen = true, t0 = 0, touched = -1e9, lastX = 0;
    const resize = () => {
      const b = el.getBoundingClientRect(); W = b.width; Hh = b.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(Hh * dpr);
      S = Math.min(W * 0.41, Hh * 0.325); cx = W / 2; cy = Hh * 0.41;
      if (reduce || !raf) draw();
    };
    const frame = (now: number) => {
      raf = 0;
      if (!t0) { t0 = now; last = now; }
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      const idle = now - touched > 4000;
      if (!s.drag) { s.spinV += ((idle ? SPIN : 0) - s.spinV) * Math.min(1, dt * (idle ? 1.2 : 0.9)); s.spin += s.spinV * dt; }
      if (idle) { const t = (now - t0) / 1000; s.yawTo = -0.42 + 0.3 * Math.sin(t * 0.21); s.pitchTo = 0.36 + 0.05 * Math.sin(t * 0.13); }
      s.yaw += (s.yawTo - s.yaw) * Math.min(1, dt * 3.2); s.pitch += (s.pitchTo - s.pitch) * Math.min(1, dt * 3.2);
      draw();
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const ro = new ResizeObserver(resize); ro.observe(el);
    resize(); wake();

    const onMove = (e: PointerEvent) => {
      if (reduce) return;
      const b = el.getBoundingClientRect(), nx = (e.clientX - b.left) / b.width - 0.5, ny = (e.clientY - b.top) / b.height - 0.5;
      touched = performance.now();
      if (s.drag) { const dx = e.clientX - lastX; lastX = e.clientX; s.spin += dx * 0.008; s.spinV = s.spinV * 0.6 + (dx * 0.008 * 60) * 0.4; return; }
      s.yawTo = -0.42 + nx * 0.9; s.pitchTo = 0.36 + ny * 0.3;
    };
    const onDown = (e: PointerEvent) => { if (reduce || e.pointerType === "touch") return; s.drag = true; lastX = e.clientX; touched = performance.now(); el.setPointerCapture(e.pointerId); };
    const onUp = () => { s.drag = false; touched = performance.now(); };
    el.addEventListener("pointermove", onMove); el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp); el.addEventListener("pointercancel", onUp);
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) wake(); });
    io.observe(el);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      el.removeEventListener("pointermove", onMove); el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp); el.removeEventListener("pointercancel", onUp);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div ref={root} className="relative min-h-[640px] w-full overflow-hidden bg-[#1a070a] bg-[radial-gradient(85%_70%_at_50%_38%,#56191f_0%,#2c0c11_46%,#120406_100%)] sm:min-h-[760px]">
      <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 h-full w-full cursor-grab active:cursor-grabbing" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 px-6 pb-6 text-center font-mono text-[11px] uppercase leading-5 tracking-[0.18em] sm:flex-row sm:justify-between sm:pb-7 sm:text-left">
        <p className="text-[#f6dfb4]">{LABEL}</p>
        <p className="text-[#d9b9a4]">{NOTE}</p>
      </div>
    </div>
  );
}
