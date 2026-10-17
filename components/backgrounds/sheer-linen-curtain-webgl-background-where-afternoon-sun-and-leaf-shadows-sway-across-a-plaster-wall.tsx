import { useEffect, useRef, useState } from "react";

// The hero copy that sits on the wall. Everything behind it is one traced shader.
const hero = {
  eyebrow: "Halden Row Studio",
  title: "Rooms that keep the afternoon",
  line: "Lime plaster, unbleached linen and furniture made to be lived with. Visits by appointment, Tuesday to Saturday.",
  cta: "Book a visit",
};
const SPEED = 1; // 0.5 is a stiller day, 2 a breezier one
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';

const VERT = `ATTR vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

// A plaster wall (z = 0) meeting an oak floor (y = 0). The sun sits behind the camera on the right.
// Every lit point traces one ray back toward the sun through three layers: the window frame,
// the sheer curtain hanging in it and a tree outside. Each layer is softened by its own distance,
// the way a real sun disc softens a shadow, so near folds stay crisp and far leaves bloom into dapples.
const SCENE = `
precision highp float;
uniform vec2 uRes; uniform float uT; uniform float uGust; uniform vec2 uLean; uniform float uGrain;
const vec3 SUN = vec3(0.70, 0.46, 0.55);       // direction toward the sun (normalised in main)
const vec3 SUNCOL = vec3(1.0, 0.80, 0.58) * 3.3;
const vec3 SKY = vec3(0.50, 0.60, 0.78) * 0.16;
const vec3 PLASTER = vec3(0.84, 0.78, 0.70);
const float DISC = 0.0085;                       // apparent sun radius, a little generous for a soft photograph
const float D_FRAME = 1.6, D_CURTAIN = 1.25, D_TREE = 4.0;

float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), u.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), u.x), u.y); }
float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++){ s += a * vn(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
float box1(float x, float a, float b, float w){ return smoothstep(a - w, a + w, x) - smoothstep(b - w, b + w, x); }

// one layer of leaves: a jittered ellipse per cell, turned to its own angle, fluttering on its stem
// how thick the canopy is in front of wall point s: heavier toward the upper right
float canopy(vec2 s){ return smoothstep(-0.4, 1.1, s.x * 0.45 + s.y * 0.75 - 1.05 + uLean.y * 0.1 + 0.35 * (fbm(s * 1.3) - 0.5)); }
float leafLayer(vec2 p, float w, float sc, vec2 off, float gain, float t, float seed){
  vec2 i0 = floor(p); float c = 0.0;
  for (int j = -1; j <= 1; j++) for (int k = -1; k <= 1; k++){
    vec2 id = i0 + vec2(float(j), float(k)) + seed;
    float h = h21(id), h2 = h21(id + 31.7), h3 = h21(id + 57.3);
    vec2 ctr = id - seed + 0.25 + 0.5 * vec2(h, h2);
    float dens = canopy((ctr - off) / sc) * gain - (gain > 1.28 ? 0.1 : 0.0);  // decided per leaf, never per pixel
    if (h3 > dens) continue;
    ctr += 0.05 * vec2(sin(t * (1.3 + h) + h2 * 6.0), cos(t * (1.1 + h2) + h * 6.0)) * (1.0 + 2.0 * uGust);
    float a = h * 6.283 + 0.25 * sin(t * (0.9 + h3) + h * 9.0) * (0.6 + uGust);
    vec2 d = p - ctr; d = mat2(cos(a), -sin(a), sin(a), cos(a)) * d;
    vec2 rad = vec2(0.46, 0.21) * (0.8 + 0.3 * h2);
    d.x += 0.12 * d.y * d.y / rad.y;                                    // a little curve, like a real leaf
    float e = (length(d / rad) - 1.0) * rad.y;
    c = max(c, 1.0 - smoothstep(-w, w, e));
  }
  return c;
}

// the curtain's folds: depth toward the window, which grows with the drop from the rod and with the breeze
float folds(float x, float y, float t){
  float drop = clamp((2.75 - y) / 2.4, 0.0, 1.0);
  float sway = (0.35 + 0.65 * drop) * (0.6 + uGust);
  float ph = t * 0.55 + sin(t * 0.23) * 1.3;
  return 0.050 * sin(x * 9.0 + 0.8 * sin(y * 1.3 + t * 0.4)) + 0.024 * sin(x * 21.0 - y * 0.7 + 1.7)
       + sway * 0.06 * sin(x * 3.1 - ph + y * 0.9) + sway * 0.025 * sin(x * 6.3 + ph * 1.6);
}

// how much sun passes the window, curtain and tree at wall-aligned point s, from a surface 'dz' off the wall
vec3 sunThrough(vec2 s, float pz, float t, vec3 L){
  float k = 1.0 / L.z;
  // window: a tall two-light garden door, sheared because its wall sits at an angle to ours
  float bFrame = DISC * (D_FRAME - pz) * k;
  vec2 w = vec2(s.x - 0.26 * (s.y - 1.4), s.y);
  float win = box1(w.x, -0.55, 1.75, bFrame) * box1(w.y, -1.1, 2.5, bFrame);
  win *= 1.0 - box1(w.x, 0.56, 0.64, bFrame) ;                // the upright between the lights
  win *= 1.0 - box1(w.y, 1.70, 1.77, bFrame) * 0.97;          // the transom
  if (win < 0.002) return vec3(0.0);

  // curtain: drawn across the left light, its leading edge billows; folds shift the projection
  float bC = DISC * (D_CURTAIN - pz) * k;
  float f = folds(s.x, s.y, t);
  vec2 sc = s - L.xy * k * f;
  float slope = (folds(s.x + 0.004, s.y, t) - f) / 0.004;
  float edge = 0.72 + 0.10 * sin(t * 0.5 + s.y * 1.6) * (0.5 + uGust) + 0.05 * (2.6 - s.y) + uLean.x * 0.08;
  float cover = 1.0 - smoothstep(edge - bC - 0.006, edge + bC + 0.006, sc.x);
  float hem = smoothstep(-0.75 - bC, -0.75 + bC, s.y - L.y / L.z * f * 0.3);        // the hem stops just above the sill
  cover *= hem;
  float path = 1.0 + slope * slope * 2.2;
  float slub = 0.88 + 0.12 * vn(vec2(sc.x * 260.0, sc.y * 4.0)) + 0.05 * vn(vec2(sc.x * 70.0, sc.y * 1.2));
  vec3 linen = exp(-vec3(0.82, 0.90, 1.02) * 0.95 * path * slub);  // unbleached: warms the light it lets through
  float doubled = box1(sc.x, edge - 0.05, edge, bC + 0.004) * cover; // the turned-back edge is two layers thick
  vec3 T = mix(vec3(1.0), linen * (1.0 - 0.35 * doubled), cover);

  // tree: two layers of foliage in the breeze, softened by distance into round dapples
  float bT = DISC * (D_TREE - pz) * k;
  vec2 g = vec2(sin(t * 0.37) + 0.5 * sin(t * 0.91 + 1.0), cos(t * 0.29) * 0.6) * (0.035 + 0.05 * uGust);
  vec2 q = s + g;
  float leaf = leafLayer(q * 6.0, bT * 3.0 + 0.01, 6.0, vec2(0.0), 1.25, t, 0.0);
  leaf = max(leaf, leafLayer(q * 9.5 + 4.0, bT * 4.5 + 0.01, 9.5, vec2(4.0), 1.3, t * 1.2, 11.0) * 0.9);
  // a branch crossing the upper light
  float br = abs(s.y - 2.05 - 0.38 * (s.x - 0.2) - 0.06 * sin(s.x * 3.0 + g.x * 4.0));
  leaf = max(leaf, (1.0 - smoothstep(0.012, 0.012 + bT * 2.2, br)) * smoothstep(-0.6, 0.3, s.x));
  // the far canopy, too distant to show single leaves, only dims the light in broad soft patches
  float far = smoothstep(0.35, 0.75, fbm(s * 0.9 + g * 0.6 + vec2(1.7, 0.0)) + canopy(s) * 0.25);
  return T * win * (1.0 - leaf * 0.93) * (1.0 - 0.42 * far);
}

vec3 tone(vec3 x){ x = (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14); return pow(clamp(x, 0.0, 1.0), vec3(1.0 / 2.2)); }

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uT;
  vec3 L = normalize(SUN);
  // a camera standing back from the wall, turned a few degrees so the wall recedes to the left
  vec3 ro = vec3(0.55 + uLean.x * 0.04, 1.30 + uLean.y * 0.02, 3.7);
  vec3 ta = vec3(0.05, 1.12, 0.0);
  vec3 fw = normalize(ta - ro), rt = normalize(cross(fw, vec3(0, 1, 0))), up = cross(rt, fw);
  float aspect = uRes.x / uRes.y;
  float lensF = 1.55 * clamp(aspect / 1.6, 0.62, 1.0);
  vec3 rd = normalize(fw * lensF + rt * uv.x + up * uv.y);

  float tw = -ro.z / rd.z;
  float tf = rd.y < 0.0 ? -ro.y / rd.y : 1e9;
  bool floorHit = tf < tw;
  vec3 P = ro + rd * min(tw, tf);
  vec3 N = floorHit ? vec3(0, 1, 0) : vec3(0, 0, 1);
  vec3 alb;
  if (floorHit) {
    // pale limed oak in long boards
    float board = floor(P.x * 5.2);
    float gr = fbm(vec2(P.x * 5.2 * 3.0, P.z * 1.4 + board * 7.0)) ;
    alb = vec3(0.74, 0.62, 0.49) * (0.86 + 0.18 * gr + 0.06 * h21(vec2(board, 3.0)));
    alb *= 1.0 - 0.45 * smoothstep(0.47, 0.5, abs(fract(P.x * 5.2) - 0.5));
  } else {
    // lime plaster: trowel clouds in the colour, and a fine relief the low sun rakes across
    vec2 p = P.xy;
    float c = fbm(p * 1.6), c2 = fbm(p * 7.0 + 3.0);
    alb = PLASTER * (0.93 + 0.07 * c + 0.03 * c2) * mix(vec3(1.0), vec3(1.02, 0.99, 0.95), c);
    float e = 0.004, s0 = fbm(p * 26.0) * 0.45 + fbm(p * 5.0) * 0.55;
    float sx = fbm((p + vec2(e, 0)) * 26.0) * 0.45 + fbm((p + vec2(e, 0)) * 5.0) * 0.55;
    float sy = fbm((p + vec2(0, e)) * 26.0) * 0.45 + fbm((p + vec2(0, e)) * 5.0) * 0.55;
    N = normalize(vec3(-(sx - s0) / e * 0.0055, -(sy - s0) / e * 0.0055, 1.0));
    // a skirting board at the foot of the wall
    float sk = 1.0 - smoothstep(0.115, 0.12, P.y);
    alb = mix(alb, vec3(0.80, 0.76, 0.70), sk);
    if (P.y < 0.12) N = normalize(vec3(0, smoothstep(0.10, 0.12, P.y) * 0.8, 1.0));
  }

  vec2 s = P.xy - L.xy / L.z * P.z;   // where this point's sun ray crosses the wall plane
  vec3 sun = sunThrough(s, P.z, t, L);
  float ndl = max(dot(N, L), 0.0);

  // the corner where wall meets floor gathers shade
  float corner = floorHit ? P.z : P.y;
  float ao = 1.0 - 0.55 * exp(-corner / 0.10) - 0.2 * exp(-corner / 0.5);

  // light bounced off the lit patch and the floor: a broad, warm glow around the sun
  vec2 sb = s + vec2(0.0, 0.0);
  float lit = box1(sb.x - 0.26 * (sb.y - 1.4), -0.45, 1.65, 0.7) * box1(sb.y, -0.9, 2.4, 0.6);
  vec3 bounce = vec3(1.0, 0.78, 0.55) * (0.15 * lit + 0.04);
  vec3 amb = (SKY * (0.75 + 0.25 * N.y) + vec3(0.33, 0.27, 0.21) * 0.30 + bounce) * ao;
  vec3 col = alb * (SUNCOL * sun * ndl + amb);
  // the faint haze of light that plaster scatters just under its surface
  col += alb * vec3(1.0, 0.7, 0.45) * 0.035 * length(sun);

  // lens: soft fall-off to the corners, filmic curve, fine grain
  vec2 q = gl_FragCoord.xy / uRes;
  col *= 0.80 + 0.20 * pow(16.0 * q.x * q.y * (1.0 - q.x) * (1.0 - q.y), 0.25);
  vec3 o = tone(col * 0.9);
  o += (h21(gl_FragCoord.xy + uGrain * 13.7) - 0.5) * 0.022;
  outC = vec4(o, 1.0);
}
`;

// What browsers without WebGL see: the same wall, set with CSS gradients. Reduced motion gets one still frame of the shader.
function Still() {
  const spot = (x: number, y: number, w: number, h: number, a: number) => `radial-gradient(${w}px ${h}px at ${x}% ${y}%, rgba(120,98,74,${a}) 55%, transparent 72%)`;
  const leaves = [[62, 12, 60, 20, 0.5], [70, 24, 72, 24, 0.45], [79, 8, 56, 20, 0.5], [85, 31, 70, 22, 0.42], [74, 42, 52, 18, 0.4], [91, 17, 64, 20, 0.5], [66, 34, 48, 16, 0.35], [88, 46, 58, 18, 0.4], [80, 56, 44, 16, 0.35], [72, 4, 50, 18, 0.45], [83, 19, 40, 14, 0.4]] as const;
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden" style={{ background: "linear-gradient(180deg, #8f8172 0%, #9c8d7c 70%, #8a7663 88%, #6f5d4c 100%)" }}>
      <div className="absolute" style={{ left: "37%", top: "-4%", width: "52%", height: "98%", transform: "skewX(-14deg)", filter: "blur(2.5px)", boxShadow: "0 0 80px 20px rgba(240,220,190,0.18)" }}>
        <div className="absolute inset-y-0 left-0 w-[48%]" style={{ background: "repeating-linear-gradient(90deg, rgba(236,218,190,0.95) 0 18px, rgba(220,199,168,0.95) 18px 30px, rgba(240,224,198,0.95) 30px 52px)" }} />
        <div className="absolute inset-y-0 right-0 w-[49%]" style={{ background: "linear-gradient(180deg, #f1e3cc, #f5e9d6)" }} />
        <div className="absolute inset-y-0 left-[48%] w-[3%]" style={{ background: "#a39280" }} />
        <div className="absolute inset-x-0 top-[24%] h-[1.6%]" style={{ background: "#a39280" }} />
      </div>
      <div className="linen-still-leaves absolute inset-0" style={{ filter: "blur(7px)", background: leaves.map((l) => spot(...l)).join(", ") }} />
      <style>{`
        @keyframes sheer-linen-curtain-leaves { from { transform: translate(0, 0) rotate(0deg); } to { transform: translate(6px, 3px) rotate(0.4deg); } }
        .linen-still-leaves { animation: sheer-linen-curtain-leaves 3.2s ease-in-out infinite alternate; }
        @media (prefers-reduced-motion: reduce) { .linen-still-leaves { animation: none; } }
      `}</style>
    </div>
  );
}

export default function SheerLinenCurtainBackground() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [shown, setShown] = useState<"wait" | "gl" | "still">("wait");
  const [paused, setPaused] = useState(false);
  const [live, setLive] = useState(true);
  const api = useRef<{ gust: () => void; pause: (p: boolean) => void } | null>(null);

  useEffect(() => {
    const box = stage.current, cv = canvas.current;
    if (!box || !cv) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const opts = { antialias: false, alpha: false, powerPreference: "high-performance" as const };
    const gl2 = cv.getContext("webgl2", opts) as WebGL2RenderingContext | null;
    const gl = (gl2 ?? cv.getContext("webgl", opts)) as WebGLRenderingContext | null;
    if (!gl) { setShown("still"); setLive(false); return; }
    if (reduce) setLive(false); // one exposure of the shader, then no loop at all
    const head = gl2 ? "#version 300 es\n#define ATTR in\n" : "#define ATTR attribute\n";
    const fhead = gl2 ? "#version 300 es\nprecision highp float;\nout vec4 outC;\n" : "#define outC gl_FragColor\n";
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src); gl.compileShader(sh);
      return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
    };
    const v = compile(gl.VERTEX_SHADER, head + VERT), f = compile(gl.FRAGMENT_SHADER, fhead + SCENE);
    const prog = gl.createProgram();
    if (!v || !f || !prog) { setShown("still"); setLive(false); return; }
    gl.attachShader(prog, v); gl.attachShader(prog, f); gl.bindAttribLocation(prog, 0, "aPos"); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { setShown("still"); setLive(false); return; }
    const u = Object.fromEntries(["uRes", "uT", "uGust", "uLean", "uGrain"].map((n) => [n, gl.getUniformLocation(prog, n)]));
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.useProgram(prog);

    let W = 0, H = 0, scale = 1;
    const s = { t: 12, paused: false, visible: true, raf: 0, last: 0, frame: 0, slow: 0, sum: 0, first: true,
      gust: 0, gv: 0, kick: 0, tx: 0, ty: 0, lx: 0, ly: 0, fps: 0 };
    const size = () => {
      const r = box.getBoundingClientRect();
      const dpr = Math.min(1.5, window.devicePixelRatio || 1) * scale;
      const k = Math.min(1, Math.sqrt(9e5 / (r.width * r.height * dpr * dpr))); // never more than ~0.9 million pixels
      const w = Math.max(2, Math.round(r.width * dpr * k)), h = Math.max(2, Math.round(r.height * dpr * k));
      if (w === W && h === H) return;
      W = w; H = h; cv.width = W; cv.height = H;
    };
    const draw = () => {
      gl.viewport(0, 0, W, H);
      gl.uniform2f(u.uRes, W, H); gl.uniform1f(u.uT, s.t); gl.uniform1f(u.uGust, s.gust);
      gl.uniform2f(u.uLean, s.lx, s.ly); gl.uniform1f(u.uGrain, s.frame % 61);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const frame = (now: number) => {
      s.raf = 0;
      if (!s.visible) return;
      const raw = s.last ? (now - s.last) / 1000 : 0.016;
      const dt = Math.min(0.05, raw);
      s.last = now; s.frame++;
      if (!s.paused && !reduce) {
        // the breeze is a damped spring: a gust swells over a second, overshoots a little and dies away
        s.t += dt * SPEED * (1 + s.gust * 1.4);
        const target = 0.22 + 0.18 * Math.sin(s.t * 0.11) * Math.sin(s.t * 0.07 + 1) + s.kick;
        s.gv += ((target - s.gust) * 3.2 - s.gv * 2.2) * dt; s.gust += s.gv * dt;
        s.kick *= Math.exp(-dt * 0.9);
        s.lx += (s.tx - s.lx) * (1 - Math.exp(-dt * 1.5)); s.ly += (s.ty - s.ly) * (1 - Math.exp(-dt * 1.5));
      }
      draw();
      if (s.first) { s.first = false; setShown("gl"); }
      if (!s.paused && !reduce) {
        if (s.frame > 10 && s.frame <= 40) s.sum += raw;
        if (s.frame === 40) { s.fps = 30 / s.sum; (box as HTMLElement).dataset.fps = s.fps.toFixed(1); if (s.sum / 30 > 0.02) { scale = Math.max(0.4, scale * Math.sqrt(0.0167 / (s.sum / 30))); size(); } }
        if (raw > 0.024) s.slow++; else s.slow = Math.max(0, s.slow - 2);
        if (s.slow > 30 && scale > 0.4) { scale *= 0.85; s.slow = 0; size(); }
        s.raf = requestAnimationFrame(frame);
      }
    };
    const wake = () => { if (!s.raf && s.visible) { s.last = 0; s.raf = requestAnimationFrame(frame); } };
    api.current = {
      gust: () => { s.kick = 0.9; wake(); },
      pause: (p) => { s.paused = p; wake(); },
    };
    size();
    const ro = new ResizeObserver(() => { size(); if (s.paused) { draw(); } wake(); });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting && !document.hidden; if (s.visible) wake(); }, { threshold: 0.02 });
    io.observe(box);
    const vis = () => { s.visible = !document.hidden; if (s.visible) wake(); };
    document.addEventListener("visibilitychange", vis);
    const move = (e: PointerEvent) => { const r = box.getBoundingClientRect(); s.tx = ((e.clientX - r.left) / r.width) * 2 - 1; s.ty = 1 - ((e.clientY - r.top) / r.height) * 2; };
    const leave = () => { s.tx = 0; s.ty = 0; };
    const down = (e: PointerEvent) => { if ((e.target as HTMLElement).closest("a,button")) return; s.kick = 0.7; };
    box.addEventListener("pointermove", move); box.addEventListener("pointerleave", leave); box.addEventListener("pointerdown", down);
    const lost = (e: Event) => { e.preventDefault(); setShown("still"); setLive(false); };
    cv.addEventListener("webglcontextlost", lost);
    wake();
    return () => {
      cancelAnimationFrame(s.raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      box.removeEventListener("pointermove", move); box.removeEventListener("pointerleave", leave); box.removeEventListener("pointerdown", down);
      cv.removeEventListener("webglcontextlost", lost);
      api.current = null;
    };
  }, []);

  const togglePause = () => { const p = !paused; setPaused(p); api.current?.pause(p); };
  const pill = "inline-flex h-10 min-w-[40px] items-center justify-center gap-2 rounded-full border border-stone-900/15 bg-[#efe6da]/70 px-3 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-stone-900 backdrop-blur-sm transition-colors duration-200 hover:bg-[#f6efe5] outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2 focus-visible:ring-offset-[#c9bcab] disabled:opacity-40 sm:px-4";

  return (
    <section className="relative isolate overflow-hidden bg-[#bfb3a3] text-stone-900" style={{ fontFamily: FONT }}>
      <div ref={stage} className="relative h-[680px] w-full lg:h-[760px]" style={{ background: "linear-gradient(180deg, #b9ad9c 0%, #c2b6a5 75%, #8f7a64 100%)", touchAction: "pan-y" }}>
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${shown === "gl" ? "opacity-100" : "opacity-0"}`} />
        {shown === "still" && <Still />}

        <div className="pointer-events-none relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center px-6 sm:px-10 lg:px-14">
          <div className="max-w-[34rem]">
            <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-stone-900/75">
              <span aria-hidden="true" className="h-px w-8 bg-stone-900/50" />
              {hero.eyebrow}
            </p>
            <h1 className="mt-5 text-[46px] font-normal leading-[0.98] tracking-[-0.025em] text-stone-950 sm:text-[64px] lg:text-[80px]" style={{ fontFamily: SERIF }}>
              {hero.title}
            </h1>
            <p className="mt-6 max-w-[26rem] text-[16px] leading-[1.55] text-stone-900/85 sm:text-[17px]">{hero.line}</p>
            <a href="#" className="pointer-events-auto mt-9 inline-flex h-12 items-center gap-3 rounded-full bg-stone-950 pl-6 pr-5 text-[14px] font-medium tracking-[-0.005em] text-[#f4ece1] shadow-[0_14px_30px_-14px_rgba(40,28,15,0.7)] outline-none transition-colors duration-200 hover:bg-stone-800 focus-visible:ring-2 focus-visible:ring-stone-950 focus-visible:ring-offset-2 focus-visible:ring-offset-[#c9bcab]">
              {hero.cta}
              <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h11M11 5.5 15.5 10 11 14.5" /></svg>
            </a>
          </div>
        </div>

        {live && (
          <div className="absolute bottom-6 right-6 z-10 flex gap-1.5 sm:bottom-9 sm:right-10 lg:right-14">
            <button type="button" onClick={() => api.current?.gust()} disabled={paused} aria-label="Let a breeze through the curtain" className={pill}>
              <svg aria-hidden="true" viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M2.5 7.5h9a2.5 2.5 0 1 0-2.5-2.5M2.5 12.5h12a2.5 2.5 0 1 1-2.5 2.5" /></svg>
              <span className="hidden sm:inline">Breeze</span>
            </button>
            <button type="button" onClick={togglePause} aria-pressed={paused} aria-label="Pause the motion" className={pill}>
              <svg aria-hidden="true" viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor">{paused ? <path d="M6 3.5v13l10.5-6.5z" /> : <path d="M5 3.5h3.5v13H5zM11.5 3.5H15v13h-3.5z" />}</svg>
              <span className="hidden sm:inline">{paused ? "Play" : "Pause"}</span>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
