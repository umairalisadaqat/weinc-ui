import { useEffect, useRef, useState } from "react";

// What is fired into the enamel. An invented bakery.
const plaque = {
  name: "Marlow Lane Bakery",
  lines: ["Now open", "online"],
  address: "marlowlanebakery.example",
};
const BLUE = "#4F98FB";
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';

const W = 720, H = 590; // the stage everything is laid out in
const PAD = 150, DROP = 50; // spare canvas each side and below, for the swing
const CX = 290, CY = 252, R = 128; // the plaque
const PR = 140; // its radius in the units it is drawn in
const HOOK_L = 112, HOOK_R = 532, HOOK_Y = 66; // the two pegs the cloth hangs from
const CARRY = 1150; // milliseconds the loose corner takes to cross from one peg to the other
const COLS = 30, ROWS = 30;
const FULL = 1.04; // the cloth is this much wider than the gap between its pegs, so it swags
const D = ((HOOK_R - HOOK_L) * FULL) / (COLS - 1); // size of one square of cloth
const CORD = 58;
const FIRST = 5200, COVERED = 2300, HOLD = 8200; // the demo
const LIGHT = [-0.42, -0.58, 0.7]; // towards the lamp: up, left and out from the wall

const VERT = `attribute vec3 p; attribute vec3 nrm; attribute vec2 uv; attribute float ao; uniform vec2 size; uniform float pad; varying vec3 vN; varying vec2 vUv; varying float vAo;
void main(){ vN = nrm; vUv = uv; vAo = ao; gl_Position = vec4((p.x + pad) / size.x * 2.0 - 1.0, 1.0 - p.y / size.y * 2.0, -p.z / 700.0, 1.0); }`;
// linen: soft wrapped light, a plain weave, and a stitched hem all round
const FRAG = `precision mediump float; varying vec3 vN; varying vec2 vUv; varying float vAo; uniform vec3 lamp; uniform float threads;
void main(){
  vec3 n = normalize(vN); float under = n.z < 0.0 ? 1.0 : 0.0; if (n.z < 0.0) n = -n;
  float d = dot(n, lamp), wrap = clamp(d * 0.5 + 0.5, 0.0, 1.0);
  float shade = clamp(0.15 + 0.5 * max(d, 0.0) + 0.52 * wrap * wrap + vAo, 0.0, 1.0);
  vec2 t = vUv * threads * 6.2832;
  float weave = 0.965 + 0.035 * sin(t.x) * sin(t.y);
  float e = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
  float hem = 0.95 + 0.05 * smoothstep(0.03, 0.036, e);
  float stitch = 1.0 - 0.13 * (1.0 - smoothstep(0.0, 0.0035, abs(e - 0.03))) * step(0.5, fract(max(vUv.x, vUv.y) * 60.0 + min(vUv.x, vUv.y) * 60.0));
  vec3 c = mix(vec3(0.36, 0.33, 0.31), vec3(0.995, 0.988, 0.968), shade) * weave * hem * stitch * (1.0 - 0.1 * under);
  gl_FragColor = vec4(c, 1.0);
}`;

type Api = { set: (shown: boolean) => void };

export default function EnamelPlaqueUnveiled() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const cloth = useRef<HTMLCanvasElement>(null);
  const cord = useRef<HTMLDivElement>(null);
  const api = useRef<Api | null>(null);
  const [zoom, setZoom] = useState(1);
  const [live, setLive] = useState(true);

  useEffect(() => {
    const st = stage.current, cv = canvas.current, glc = cloth.current, cd = cord.current;
    const ctx = cv?.getContext("2d");
    if (!st || !cv || !ctx || !glc || !cd) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = (W + PAD * 2) * dpr; cv.height = (H + DROP) * dpr;
    const fit = () => setZoom(Math.max(0.46, Math.min(1.06, (st.clientWidth - 12) / W)));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(st);

    // the cloth: a grid of points joined along the weave, across it and over every second thread
    const n = COLS * ROWS;
    const x = new Float32Array(n), y = new Float32Array(n), z = new Float32Array(n);
    const ox = new Float32Array(n), oy = new Float32Array(n), oz = new Float32Array(n);
    const free = new Float32Array(n).fill(1);
    const lay = () => {
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;
        x[i] = ox[i] = HOOK_L + (c * D) / FULL; y[i] = oy[i] = HOOK_Y + r * D * 0.985;
        z[i] = oz[i] = 20 + 9 * Math.sin((c / (COLS - 1)) * Math.PI * 5 + r * 0.12) + 3 * Math.sin(c * 1.7 + r * 0.4);
        if (r === 0 && (c === 0 || c === COLS - 1)) z[i] = oz[i] = 6;
      }
    };
    // folded in half and hung by both top corners from the right-hand peg: where it rests once unveiled
    const hang = () => {
      const half = ((COLS - 1) * D) / 2, th = Math.atan2(half, (ROWS - 1) * D), cs = Math.cos(th), sn = Math.sin(th);
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c, a = D * Math.min(c, COLS - 1 - c), b = r * D;
        x[i] = ox[i] = HOOK_R - 4 + a * cs - b * sn; y[i] = oy[i] = HOOK_Y + 2 + a * sn + b * cs; z[i] = oz[i] = c < COLS / 2 ? 15 : 4;
      }
      x[COLS - 1] = ox[COLS - 1] = HOOK_R; y[COLS - 1] = oy[COLS - 1] = HOOK_Y; z[COLS - 1] = oz[COLS - 1] = 6;
    };
    const ca: number[] = [], cb: number[] = [], cr: number[] = [], ck: number[] = [];
    const link = (a: number, b: number, rest: number, k: number) => { ca.push(a); cb.push(b); cr.push(rest); ck.push(k); };
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c;
      if (c + 1 < COLS) link(i, i + 1, D, 1);
      if (r + 1 < ROWS) link(i, i + COLS, D, 1);
      if (c + 1 < COLS && r + 1 < ROWS) { link(i, i + COLS + 1, D * Math.SQRT2, 0.5); link(i + 1, i + COLS, D * Math.SQRT2, 0.5); }
      if (c + 2 < COLS) link(i, i + 2, D * 2, 0.18);
      if (r + 2 < ROWS) link(i, i + COLS * 2, D * 2, 0.18);
    }
    const NL = ca.length, LEFT = 0, RIGHT = COLS - 1;
    free[RIGHT] = 0; free[LEFT] = 0;
    const bead = { x: HOOK_L, y: HOOK_Y + CORD, px: HOOK_L, py: HOOK_Y + CORD };
    // u: where the corner with the cord is, 0 on the left peg and 1 carried across to the right one
    const s = { u: 1, to: 1, still: 0, live: true, touched: -1e9 };
    const hold = () => {
      const e = s.u * s.u * (3 - 2 * s.u), lift = Math.sin(Math.PI * e);
      x[LEFT] = ox[LEFT] = HOOK_L + (HOOK_R - 7 - HOOK_L) * e; y[LEFT] = oy[LEFT] = HOOK_Y + 3 * e - 54 * lift; z[LEFT] = oz[LEFT] = 6 + 8 * e + 86 * lift;
    };

    const step = (dt: number, passes = 8, drag = 0.991) => {
      const g = 1500 * dt * dt;
      let most = 0;
      for (let i = 0; i < n; i++) {
        if (!free[i]) continue;
        const vx = (x[i] - ox[i]) * drag, vy = (y[i] - oy[i]) * drag, vz = (z[i] - oz[i]) * drag;
        ox[i] = x[i]; oy[i] = y[i]; oz[i] = z[i];
        x[i] += vx; y[i] += vy + g; z[i] += vz;
        const sp = Math.abs(vx) + Math.abs(vy) + Math.abs(vz); if (sp > most) most = sp;
      }
      for (let k = 0; k < passes; k++) {
        for (let j = 0; j < NL; j++) {
          const a = ca[j], b = cb[j], dx = x[b] - x[a], dy = y[b] - y[a], dz = z[b] - z[a];
          const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1, wa = free[a], wb = free[b], ws = wa + wb;
          if (!ws) continue;
          const f = ((d - cr[j]) / d) * ck[j] / ws;
          x[a] += dx * f * wa; y[a] += dy * f * wa; z[a] += dz * f * wa;
          x[b] -= dx * f * wb; y[b] -= dy * f * wb; z[b] -= dz * f * wb;
        }
      }
      // the wall behind, and the plaque standing proud of it
      for (let i = 0; i < n; i++) {
        if (!free[i]) continue;
        const dx = x[i] - CX, dy = y[i] - CY, q = Math.sqrt(dx * dx + dy * dy);
        const t = Math.max(0, Math.min(1, (R + 9 - q) / 12)), floor = 1.5 + 15 * t * t * (3 - 2 * t);
        if (z[i] < floor) { z[i] = floor; ox[i] = x[i] - (x[i] - ox[i]) * 0.95; oy[i] = y[i] - (y[i] - oy[i]) * 0.95; }
      }
      // the cord hangs from the corner that gets carried
      const bx = (bead.x - bead.px) * 0.985, by = (bead.y - bead.py) * 0.985;
      bead.px = bead.x; bead.py = bead.y; bead.x += bx; bead.y += by + g;
      const ex = bead.x - x[LEFT], ey = bead.y - y[LEFT], el = Math.hypot(ex, ey) || 1;
      bead.x = x[LEFT] + (ex / el) * CORD; bead.y = y[LEFT] + (ey / el) * CORD;
      return most;
    };

    const quads = (ROWS - 1) * (COLS - 1);
    // WebGL paints the cloth when it can; the same mesh is filled square by square when it cannot
    const gl = glc.getContext("webgl", { antialias: true, alpha: true, premultipliedAlpha: false, preserveDrawingBuffer: true });
    const nor = new Float32Array(n * 3), pos = new Float32Array(n * 3), hol = new Float32Array(n);
    let bufP: WebGLBuffer | null = null, bufN: WebGLBuffer | null = null, bufA: WebGLBuffer | null = null, ok = false;
    if (gl) {
      const sh = (type: number, src: string) => { const o = gl.createShader(type)!; gl.shaderSource(o, src); gl.compileShader(o); return o; };
      const prog = gl.createProgram()!;
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG)); gl.linkProgram(prog);
      ok = !!gl.getProgramParameter(prog, gl.LINK_STATUS);
      if (ok) {
        gl.useProgram(prog);
        glc.width = (W + PAD * 2) * dpr; glc.height = (H + DROP) * dpr; gl.viewport(0, 0, glc.width, glc.height);
        const uv = new Float32Array(n * 2), ix = new Uint16Array(quads * 6);
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) { uv[(r * COLS + c) * 2] = c / (COLS - 1); uv[(r * COLS + c) * 2 + 1] = r / (ROWS - 1); }
        for (let q = 0; q < quads; q++) { const r = (q / (COLS - 1)) | 0, c = q - r * (COLS - 1), i = r * COLS + c; ix.set([i, i + 1, i + COLS, i + 1, i + COLS + 1, i + COLS], q * 6); }
        const attr = (name: string, size: number, data: Float32Array | null) => { const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); if (data) gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); const loc = gl.getAttribLocation(prog, name); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0); return buf; };
        attr("uv", 2, uv); bufP = attr("p", 3, null); bufN = attr("nrm", 3, null); bufA = attr("ao", 1, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, ix, gl.STATIC_DRAW);
        gl.uniform2f(gl.getUniformLocation(prog, "size"), W + PAD * 2, H + DROP); gl.uniform1f(gl.getUniformLocation(prog, "pad"), PAD);
        gl.uniform3f(gl.getUniformLocation(prog, "lamp"), LIGHT[0], LIGHT[1], LIGHT[2]); gl.uniform1f(gl.getUniformLocation(prog, "threads"), 150);
        gl.enable(gl.DEPTH_TEST); gl.clearColor(0, 0, 0, 0);
      }
    }
    const order = new Uint16Array(quads), depth = new Float32Array(quads), tone = new Float32Array(n);
    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, PAD * dpr, 0);
      ctx.clearRect(-PAD, 0, W + PAD * 2, H + DROP);
      // which way each point of the cloth faces, taken over two threads so creases stay soft
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c, l = i - Math.min(2, c), rr = i + Math.min(2, COLS - 1 - c), u = i - COLS * Math.min(2, r), d = i + COLS * Math.min(2, ROWS - 1 - r);
        const ax = x[rr] - x[l], ay = y[rr] - y[l], az = z[rr] - z[l], bx = x[d] - x[u], by = y[d] - y[u], bz = z[d] - z[u];
        let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1; nx /= len; ny /= len; nz /= len;
        nor[i * 3] = nx; nor[i * 3 + 1] = ny; nor[i * 3 + 2] = nz;
        pos[i * 3] = x[i]; pos[i * 3 + 1] = y[i]; pos[i * 3 + 2] = z[i];
        // the bottoms of folds sit a little darker
        hol[i] = Math.max(-0.1, Math.min(0.04, (z[i] - (z[l] + z[rr] + z[u] + z[d]) / 4) * 0.007));
      }
      // the shadow the whole cloth throws on the wall
      ctx.save();
      ctx.shadowColor = "rgba(58,46,28,0.42)"; ctx.shadowBlur = 24 * dpr; ctx.shadowOffsetX = (5000 + 16) * dpr; ctx.shadowOffsetY = 24 * dpr;
      ctx.beginPath();
      for (let c = 0; c < COLS; c++) { if (c) ctx.lineTo(x[c] - 5000, y[c]); else ctx.moveTo(x[c] - 5000, y[c]); }
      for (let r = 1; r < ROWS; r++) { const i = r * COLS + COLS - 1; ctx.lineTo(x[i] - 5000, y[i]); }
      for (let c = COLS - 2; c >= 0; c--) { const i = (ROWS - 1) * COLS + c; ctx.lineTo(x[i] - 5000, y[i]); }
      for (let r = ROWS - 2; r > 0; r--) { const i = r * COLS; ctx.lineTo(x[i] - 5000, y[i]); }
      ctx.closePath(); ctx.fill("nonzero");
      ctx.restore();
      if (gl && ok) {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.bindBuffer(gl.ARRAY_BUFFER, bufP); gl.bufferData(gl.ARRAY_BUFFER, pos, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, bufN); gl.bufferData(gl.ARRAY_BUFFER, nor, gl.DYNAMIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, bufA); gl.bufferData(gl.ARRAY_BUFFER, hol, gl.DYNAMIC_DRAW);
        gl.drawElements(gl.TRIANGLES, quads * 6, gl.UNSIGNED_SHORT, 0);
      } else {
        // squares of cloth, farthest from the eye first
        for (let q = 0; q < quads; q++) { const r = (q / (COLS - 1)) | 0, c = q - r * (COLS - 1), i = r * COLS + c; order[q] = q; depth[q] = z[i] + z[i + 1] + z[i + COLS] + z[i + COLS + 1]; }
        order.sort((a, b) => depth[a] - depth[b]);
        for (let e = 0; e < n; e++) { const flip = nor[e * 3 + 2] < 0 ? -1 : 1, dd = flip * (nor[e * 3] * LIGHT[0] + nor[e * 3 + 1] * LIGHT[1] + nor[e * 3 + 2] * LIGHT[2]), wr = dd * 0.5 + 0.5; tone[e] = Math.max(0, Math.min(1, 0.15 + 0.5 * Math.max(0, dd) + 0.52 * wr * wr + hol[e] - (flip < 0 ? 0.06 : 0))); }
        const ink = (v: number) => `rgb(${(92 + 162 * v) | 0},${(84 + 168 * v) | 0},${(79 + 168 * v) | 0})`;
        ctx.lineWidth = 0.9; ctx.lineJoin = "round";
        for (let o = 0; o < quads; o++) {
          const q = order[o], r = (q / (COLS - 1)) | 0, c = q - r * (COLS - 1), i = r * COLS + c, j = i + 1, k = i + COLS + 1, m = i + COLS;
          // each square fades from its left pair of corners to its right pair, which is the way the folds run
          const g = ctx.createLinearGradient((x[i] + x[m]) / 2, (y[i] + y[m]) / 2, (x[j] + x[k]) / 2, (y[j] + y[k]) / 2);
          g.addColorStop(0, ink((tone[i] + tone[m]) / 2)); g.addColorStop(1, ink((tone[j] + tone[k]) / 2));
          ctx.fillStyle = g; ctx.strokeStyle = g;
          ctx.beginPath(); ctx.moveTo(x[i], y[i]); ctx.lineTo(x[j], y[j]); ctx.lineTo(x[k], y[k]); ctx.lineTo(x[m], y[m]); ctx.closePath(); ctx.fill(); ctx.stroke();
        }
      }
      // the cord follows its corner
      cd.style.transform = `translate(${x[LEFT].toFixed(1)}px, ${y[LEFT].toFixed(1)}px) rotate(${(Math.atan2(bead.y - y[LEFT], bead.x - x[LEFT]) - Math.PI / 2).toFixed(3)}rad)`;
      cd.style.opacity = "1";
    };

    // coarse and heavily damped to get there quickly, then a few true steps so nothing is left stretched
    const settle = () => { for (let i = 0; i < 110; i++) step(1 / 60, 5, 0.972); for (let i = 0; i < 30; i++) step(1 / 120, 8, 0.975); };
    const tell = (now: boolean) => { if (now !== s.live) { s.live = now; setLive(now); } };
    let raf = 0, last = 0, seen = true, timer = 0, begin = () => {};
    const frame = (now: number) => {
      raf = 0;
      // the corner is carried over the plaque, in front of it, and hooked on the other peg
      const dt = Math.min(0.034, (now - last) / 1000 || 0.016);
      if (s.u !== s.to) { s.u = s.to > s.u ? Math.min(1, s.u + (dt * 1000) / CARRY) : Math.max(0, s.u - (dt * 1000) / CARRY); hold(); }
      step(1 / 120); const most = step(1 / 120);
      s.still = most < 0.006 && s.u === s.to ? s.still + 1 : 0;
      last = now;
      draw();
      if (s.still > 40) return;
      if (seen && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const wake = () => { s.still = 0; if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const go = (shown: boolean) => {
      if (shown === s.live) return;
      tell(shown);
      s.to = shown ? 1 : 0;
      if (reduce) {
        if (shown) hang(); else lay();
        s.u = s.to; hold(); settle();
        draw(); return;
      }
      wake();
    };
    api.current = { set: (v) => { s.touched = performance.now(); go(v); } };

    // open already unveiled: lay the cloth where it will rest, let it drop into its folds, and draw it at once
    hang(); hold(); settle(); draw();
    if (!reduce) {
      wake();
      // The demo: unveiled, cover it, hold, unveil. It stands down while someone is using it.
      const loop = (wait: number, shown: boolean) => { timer = window.setTimeout(() => { if (seen && !document.hidden && performance.now() - s.touched > 9000) go(shown); loop(shown ? HOLD : COVERED, !shown); }, wait); };
      begin = () => loop(FIRST, false);
      if (document.readyState === "complete") begin(); else window.addEventListener("load", begin, { once: true });
    }
    const io = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen && !reduce && s.still <= 40) wake(); });
    io.observe(st);
    const vis = () => { if (!document.hidden && !reduce && s.still <= 40) wake(); };
    document.addEventListener("visibilitychange", vis);
    return () => {
      cancelAnimationFrame(raf); window.clearTimeout(timer); window.removeEventListener("load", begin); api.current = null;
      ro.disconnect(); io.disconnect(); document.removeEventListener("visibilitychange", vis);
    };
  }, []);

  const peg = (px: number) => (
    <div key={px} aria-hidden="true" className="absolute" style={{ left: px - 9, top: HOOK_Y - 9, width: 18, height: 18 }}>
      <div className="absolute rounded-full" style={{ left: 3, top: 7, width: 20, height: 20, background: "radial-gradient(closest-side,rgba(40,30,12,0.5),rgba(40,30,12,0))" }} />
      <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle at 34% 28%,#fffbe2 0%,#f0d283 18%,#c69a3a 48%,#7a5714 80%,#3d2a07 100%)", boxShadow: "0 0 0 0.5px #3a2806, inset -2px -3px 4px rgba(40,26,2,0.5)" }} />
    </div>
  );

  return (
    <div
      className="relative flex min-h-[580px] w-full flex-col items-center justify-center overflow-hidden overflow-clip bg-[#D6D0C4] bg-[radial-gradient(75%_60%_at_38%_28%,#E6E1D7_0%,#D6D0C4_55%,#C2BBAD_100%)] px-2 py-8 text-[#0B0D12] sm:min-h-[780px]"
      style={{ fontFamily: FONT }}
    >
      <style>{`
        @media (prefers-reduced-motion: reduce) { .enamel-plaque-unveiled-root * { transition: none !important; } }
      `}</style>
      {/* plaster */}
      <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.22] mix-blend-multiply">
        <filter id="enamel-plaque-unveiled-plaster" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" />
          <feColorMatrix values="0 0 0 0 0.4  0 0 0 0 0.36  0 0 0 0 0.3  0 0 0 0.55 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#enamel-plaque-unveiled-plaster)" />
      </svg>
      <div ref={stage} className="enamel-plaque-unveiled-root relative flex w-full max-w-[1000px] justify-center" style={{ height: H * zoom }}>
        <div className="relative shrink-0" style={{ width: W, height: H, zoom }}>
          {/* the plaque: vitreous enamel on a domed steel disc */}
          <div aria-hidden="true" className="absolute rounded-full" style={{ left: CX - R + 12, top: CY - R + 20, width: R * 2, height: R * 2, background: "rgba(52,40,22,0.5)", filter: "blur(16px)" }} />
          <svg role="img" aria-label={`Round blue enamel plaque: ${plaque.name}, ${plaque.lines.join(" ")}, ${plaque.address}`} className="absolute" style={{ left: CX - (150 * R) / PR, top: CY - (150 * R) / PR }} width={(300 * R) / PR} height={(300 * R) / PR} viewBox="-150 -150 300 300">
            <defs>
              <radialGradient id="enamel-plaque-unveiled-field" cx="0.36" cy="0.28" r="0.85">
                <stop offset="0" stopColor="#8cc0ff" /><stop offset="0.3" stopColor="#5ba0fc" /><stop offset="0.62" stopColor="#4F98FB" /><stop offset="0.86" stopColor="#3577e0" /><stop offset="1" stopColor="#2459b6" />
              </radialGradient>
              <radialGradient id="enamel-plaque-unveiled-edge" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0.9" stopColor="rgba(12,36,96,0)" /><stop offset="0.975" stopColor="rgba(12,36,96,0.4)" /><stop offset="1" stopColor="rgba(8,24,70,0.8)" />
              </radialGradient>
              <radialGradient id="enamel-plaque-unveiled-gloss" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0" stopColor="rgba(255,255,255,0.7)" /><stop offset="0.45" stopColor="rgba(255,255,255,0.22)" /><stop offset="1" stopColor="rgba(255,255,255,0)" />
              </radialGradient>
              <radialGradient id="enamel-plaque-unveiled-screw" cx="0.36" cy="0.3" r="0.8">
                <stop offset="0" stopColor="#ffffff" /><stop offset="0.45" stopColor="#aeb6c2" /><stop offset="1" stopColor="#3b424e" />
              </radialGradient>
              <path id="enamel-plaque-unveiled-top" d="M -101 0 A 101 101 0 0 1 101 0" />
              <path id="enamel-plaque-unveiled-foot" d="M -112 0 A 112 112 0 0 0 112 0" />
            </defs>
            <circle r={PR} fill="#143a8c" />
            <circle r={PR - 1.6} fill="url(#enamel-plaque-unveiled-field)" />
            <circle r={PR - 1.6} fill="url(#enamel-plaque-unveiled-edge)" />
            {/* white line and lettering, standing a hair proud of the blue */}
            <g fill="#F6F4EF" fontWeight="800" style={{ filter: "drop-shadow(0 1.2px 0 rgba(14,44,110,0.75))" }}>
              <circle r={PR - 17} fill="none" stroke="#F6F4EF" strokeWidth="3.6" />
              <text fontSize="15.5" letterSpacing="3.4" textAnchor="middle"><textPath href="#enamel-plaque-unveiled-top" startOffset="50%">{plaque.name.toUpperCase()}</textPath></text>
              <text y="-4" fontSize="41" letterSpacing="-1.4" textAnchor="middle">{plaque.lines[0].toUpperCase()}</text>
              <text y="34" fontSize="41" letterSpacing="-1.4" textAnchor="middle">{plaque.lines[1].toUpperCase()}</text>
              <rect x="-22" y="48" width="44" height="3" rx="1.5" />
              <text fontSize="10.6" letterSpacing="2" textAnchor="middle" dominantBaseline="hanging"><textPath href="#enamel-plaque-unveiled-foot" startOffset="50%">{plaque.address.toUpperCase()}</textPath></text>
            </g>
            {/* fixing screws, then the glaze catching the window */}
            {[-1, 1].map((d) => (
              <g key={d} transform={`translate(0 ${d * (PR - 8.5)})`}>
                <circle r="5.2" fill="#0f2f78" /><circle r="4.2" fill="url(#enamel-plaque-unveiled-screw)" /><path d="M -2.8 -1.2 L 2.8 1.2" stroke="#2a303a" strokeWidth="1.1" strokeLinecap="round" />
              </g>
            ))}
            <ellipse cx="-52" cy="-74" rx="66" ry="34" transform="rotate(-34 -52 -74)" fill="url(#enamel-plaque-unveiled-gloss)" />
            <path d="M 46 -128 L 92 -104 L 118 -62 L 128 -38 A 134 134 0 0 0 46 -128 Z" fill="rgba(255,255,255,0.13)" />
            <circle r={PR - 0.8} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" strokeDasharray="150 800" strokeDashoffset="-520" strokeLinecap="round" />
          </svg>

          {/* the shadow canvas, then the cloth; click the cloth to carry its corner across */}
          <canvas ref={canvas} aria-hidden="true" className="pointer-events-none absolute top-0" style={{ left: -PAD, width: W + PAD * 2, height: H + DROP }} />
          <canvas ref={cloth} aria-hidden="true" onClick={() => api.current?.set(!live)} className="absolute top-0 cursor-pointer" style={{ left: -PAD, width: W + PAD * 2, height: H + DROP }} />
          {/* blue cord and its turned brass acorn */}
          <div ref={cord} aria-hidden="true" className="pointer-events-none absolute left-0 top-0 opacity-0" style={{ width: 0, height: 0, willChange: "transform" }}>
            <div className="absolute" style={{ left: -1.7, top: 0, width: 3.4, height: CORD, borderRadius: 2, background: "repeating-linear-gradient(160deg,#2f6fd6 0 2px,#7db4ff 2px 3px,#4F98FB 3px 5px)", boxShadow: "0 0 0 0.5px #1d4da6, 4px 6px 4px rgba(40,30,12,0.3)" }} />
            <div className="absolute" style={{ left: -5, top: CORD - 5, width: 10, height: 6, borderRadius: 2, background: "linear-gradient(90deg,#4f370a,#b98d30 22%,#fff4c8 42%,#d2a846 62%,#402c07)" }} />
            <div className="absolute" style={{ left: -7.5, top: CORD, width: 15, height: 21, borderRadius: "46% 46% 50% 50% / 34% 34% 66% 66%", background: "linear-gradient(90deg,#4f370a 0%,#b98d30 20%,#fff4c8 40%,#d2a846 62%,#7a5714 86%,#402c07 100%)", boxShadow: "0 0 0 0.5px #3a2806, 4px 7px 5px rgba(40,30,12,0.35), inset 0 -4px 5px rgba(40,26,2,0.45)" }} />
          </div>
          {[HOOK_L, HOOK_R].map(peg)}
        </div>
      </div>

      <div className="relative mt-2 flex items-center gap-[12px]">
        <span className="flex h-[30px] items-center gap-[8px] rounded-full bg-[#0B0D12]/[0.08] pl-[10px] pr-[13px] text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#0B0D12]">
          <span aria-hidden="true" className="h-[9px] w-[9px] rounded-full" style={{ background: live ? BLUE : "#8d877b", boxShadow: live ? "0 0 0 4px rgba(79,152,251,0.3)" : "none" }} />
          {live ? "Live" : "Draft"}
        </span>
        <button
          type="button"
          aria-pressed={live}
          onClick={() => api.current?.set(!live)}
          className="flex h-[52px] items-center rounded-full bg-[#0B0D12] px-[26px] text-[15px] font-extrabold tracking-[-0.01em] text-[#F6F4EF] shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_18px_28px_-14px_rgba(11,13,18,0.7)] outline-none transition-transform duration-150 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-[#4F98FB] focus-visible:ring-offset-2 focus-visible:ring-offset-[#D6D0C4] motion-reduce:transition-none"
        >
          {live ? "Cover it again" : "Unveil the plaque"}
        </button>
      </div>
      <p aria-live="polite" className="mt-[12px] text-center text-[12px] font-semibold tracking-[-0.005em] text-[#0B0D12]/75">
        {live ? `${plaque.name} is live: cloth off, plaque on the wall` : "Draft: fixed to the wall, still under its cloth"}
      </p>
    </div>
  );
}
