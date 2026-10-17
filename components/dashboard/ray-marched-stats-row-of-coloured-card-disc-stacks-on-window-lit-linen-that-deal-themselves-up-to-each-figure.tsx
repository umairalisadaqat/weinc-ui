import { useEffect, useRef, useState } from "react";

// DEMO DATA. Three figures for one shop, three periods. Each stack counts in whole discs of `unit`.
const stats = [
  { label: "visitors", unit: 500, colour: "#a9573d" },
  { label: "orders", unit: 10, colour: "#3e6079" },
  { label: "repeat buyers", unit: 5, colour: "#c99a45" },
];
const periods = [
  { key: "Last 30 days", values: [18500, 426, 175] },
  { key: "Previous 30 days", values: [14000, 318, 140] },
  { key: "A year ago", values: [9500, 241, 95] },
];
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';
const S = stats.length;
const FLY = 14; // discs in the air per stack at most
// Scene units: card thickness, disc radius, gap between stacks.
const T = 0.052, R = 0.6, PITCH = 1.78;
const xOf = (i: number) => (i - (S - 1) / 2) * PITCH;
const discs = (k: number, i: number) => Math.round(periods[k].values[i] / stats[i].unit);
const fmt = (n: number) => n.toLocaleString("en-GB");
const lin = (hex: string) => [1, 3, 5].map((o) => Math.pow(parseInt(hex.slice(o, o + 2), 16) / 255, 2.2));

const VERT = `#version 300 es
in vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

const TONE = `
vec3 film(vec3 x){ return clamp(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
vec3 tone(vec3 x){ x *= 0.9; float l = max(x.r, max(x.g, x.b)) + 1e-4; vec3 keep = x / l * film(vec3(l)).r; return pow(mix(film(x), keep, 0.6), vec3(1.0 / 2.2)); }
`;

// Each stack is a pile of thin card discs, each one a rounded cylinder nudged a little off true.
// Resting discs are found from the height of the point, discs in the air are listed one by one.
const SCENE = `#version 300 es
precision highp float;
out vec4 outC;
const int S = ${S}; const int F = ${FLY};
uniform vec2 uRes; uniform vec4 uJit; uniform float uSeed; uniform float uDirect;
uniform vec3 uCam; uniform vec3 uFw; uniform float uFoc; uniform vec2 uShift; uniform float uFocus;
uniform float uRest[S]; uniform float uTop[S]; uniform float uN[S]; uniform vec3 uFly[S * F]; uniform vec3 uCol[S];
uniform vec3 uSun;
const float T = ${T.toFixed(4)}; const float R = ${R.toFixed(3)}; const float P = ${PITCH.toFixed(3)};
const float HH = T * 0.47; const float RR = T * 0.28;
const vec3 SUNC = vec3(1.0, 0.86, 0.68);
const vec3 SKY = vec3(0.6, 0.66, 0.78);
const vec3 HAZE = vec3(0.86, 0.82, 0.76);
const vec3 LINEN = vec3(0.79, 0.74, 0.66);
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float sx(int i){ return (float(i) - float(S - 1) * 0.5) * P; }
// hand-stacked: every disc sits a hair off centre
vec2 jit(float k, int i){ float a = h21(vec2(k * 1.37, float(i) * 9.1 + 2.0)) * 6.2831; float r = 0.003 + 0.011 * h21(vec2(k * 3.1, float(i) + 7.0)); return vec2(cos(a), sin(a)) * r; }
float disc(vec3 q){ vec2 d = vec2(length(q.xz) - R + RR, abs(q.y) - HH + RR); return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - RR; }

float gId; int gSt;
float stack(int i, vec3 p, float best){
  vec3 q = p - vec3(sx(i), 0.0, 0.0);
  float bound = max(length(q.xz) - R - 0.05, q.y - uTop[i]);
  if (bound > best || uTop[i] < 0.001) return best;
  float rest = uRest[i];
  if (rest > 0.5) {
    float k0 = clamp(floor(q.y / T), 0.0, rest - 1.0);
    for (int j = -1; j <= 1; j++) {
      float k = clamp(k0 + float(j), 0.0, rest - 1.0);
      vec2 o = jit(k, i);
      float d = disc(q - vec3(o.x, k * T + T * 0.5, o.y));
      if (d < best) { best = d; gId = k; gSt = i; }
    }
  }
  int n = int(uN[i]);
  for (int j = 0; j < F; j++) {
    if (j >= n) break;
    vec3 f = uFly[i * F + j]; vec2 o = jit(f.y, i);
    vec3 qq = q - vec3(o.x, f.x + T * 0.5, o.y);
    float c = cos(f.z), s = sin(f.z); qq.xy = mat2(c, -s, s, c) * qq.xy;
    float d = disc(qq);
    if (d < best) { best = d; gId = f.y; gSt = i; }
  }
  return best;
}
float map(vec3 p){ float d = 1e9; for (int i = 0; i < S; i++) d = stack(i, p, d); return d; }
vec3 nrm(vec3 p){ vec2 e = vec2(0.0006, -0.0006);
  return normalize(e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) + e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx)); }

// The window: light comes through four tall panes, so the mullions lay soft bars across the cloth.
float window(vec3 p){
  vec3 U = normalize(cross(uSun, vec3(0.0, 1.0, 0.0))); vec3 V = cross(U, uSun);
  vec2 w = vec2(dot(p, U), dot(p, V)) + vec2(1.1, 0.4);
  float soft = 0.06 + 0.03 * p.y;
  vec2 c = abs(fract(w / vec2(2.6, 3.4)) - 0.5) * vec2(2.6, 3.4);
  float bars = mix(1.0, smoothstep(0.03, 0.03 + soft, c.x), 0.85) * mix(1.0, smoothstep(0.025, 0.025 + soft, c.y), 0.7);
  float frame = smoothstep(5.6, 4.6, abs(w.x - 0.3)) * smoothstep(4.4, 3.4, abs(w.y));
  return bars * frame;
}
float shadow(vec3 ro, vec3 rd){
  float r = 1.0; float t = 0.012;
  for (int k = 0; k < 40; k++) {
    float h = map(ro + rd * t);
    r = min(r, 9.0 * h / t);
    t += clamp(h, 0.01, 0.25);
    if (r < 0.002 || t > 5.0) break;
  }
  return clamp(r, 0.0, 1.0);
}
float occl(vec3 p, vec3 n){
  float o = 0.0; float w = 1.0;
  for (int k = 1; k <= 5; k++) { float h = 0.018 * float(k * k); o += (h - map(p + n * h)) * w; w *= 0.62; }
  return clamp(1.0 - 2.2 * o, 0.0, 1.0);
}
// linen: a plain weave, slubbed threads, and a long soft fold in the cloth
vec3 linenN(vec2 g, out float alb){
  vec2 th = g / 0.034;
  float wx = 0.5 + 0.5 * sin(th.x * 3.1416 * 2.0); float wz = 0.5 + 0.5 * sin(th.y * 3.1416 * 2.0);
  float over = step(0.5, fract(floor(th.x) * 0.5 + floor(th.y) * 0.5));
  float slub = n2(vec2(g.x * 2.2, floor(th.y) * 1.7)) * 0.6 + n2(vec2(floor(th.x) * 1.3, g.y * 2.2)) * 0.4;
  slub = slub * slub * 1.6;
  alb = 0.88 + 0.16 * mix(wx, wz, over) + 0.16 * (slub - 0.5) + 0.06 * (n2(g * 2.0) - 0.5);
  float fold = sin(g.x * 0.9 + g.y * 0.35 + 1.2) * 0.5 + sin(g.x * 2.1 - g.y * 1.3) * 0.18;
  vec2 grad = vec2(cos(g.x * 0.9 + g.y * 0.35 + 1.2) * 0.9 * 0.5 + cos(g.x * 2.1 - g.y * 1.3) * 2.1 * 0.18, cos(g.x * 0.9 + g.y * 0.35 + 1.2) * 0.35 * 0.5 - cos(g.x * 2.1 - g.y * 1.3) * 1.3 * 0.18) * 0.05;
  alb *= 1.0 + fold * 0.04;
  grad += vec2(cos(th.x * 6.2832) * mix(0.0, 1.0, over), cos(th.y * 6.2832) * mix(1.0, 0.0, over)) * 0.09;
  return normalize(vec3(-grad.x, 1.0, -grad.y));
}
vec3 ground(vec3 gp, vec3 rd, float dist){
  float a; vec3 n = linenN(gp.xz, a);
  float sh = shadow(gp + vec3(0.0, 0.003, 0.0), uSun);
  float con = 1.0;
  for (int i = 0; i < S; i++) {
    float d = max(length(gp.xz - vec2(sx(i), 0.0)) - R, 0.0);
    con *= 1.0 - 0.62 * exp(-d / 0.035) - 0.22 * exp(-d / 0.4) * min(uTop[i], 1.0);
  }
  float pool = 0.6 + 0.4 * smoothstep(9.0, 1.0, length(gp.xz - vec2(-0.6, 0.4)));
  vec3 c = LINEN * a * (SUNC * 2.9 * max(dot(n, uSun), 0.0) * sh * window(gp) * pool + SKY * 0.4 * con);
  // card colour bounced onto the cloth right by each stack
  for (int i = 0; i < S; i++) {
    float d = max(length(gp.xz - vec2(sx(i), 0.0)) - R, 0.0);
    c += LINEN * uCol[i] * 0.35 * exp(-d / 0.18) * min(uTop[i] * 2.0, 1.0);
  }
  return mix(c, HAZE, smoothstep(5.0, 20.0, dist));
}
vec3 shadeDisc(vec3 p, vec3 rd){
  float id = gId; int st = gSt;
  vec3 n = nrm(p);
  vec3 q = p - vec3(sx(st), 0.0, 0.0);
  float face = smoothstep(0.6, 0.9, abs(n.y));
  // through-dyed card: each sheet from a slightly different batch
  float b = h21(vec2(id * 0.73, float(st) * 4.1));
  vec3 base = mix(vec3(dot(uCol[st], vec3(0.3, 0.55, 0.15))), uCol[st], 0.82);
  vec3 alb = base * (0.86 + 0.2 * b) * mix(vec3(1.0), vec3(1.04, 0.98, 0.95), step(0.7, b));
  float fib = n2(q.xz * 140.0 + id * 13.0) * 0.6 + n2(q.xz * 40.0 + id) * 0.4;
  float edgeFib = n2(vec2(atan(q.z, q.x) * 160.0, q.y * 900.0));
  alb *= mix(0.92 + 0.12 * edgeFib, 0.94 + 0.1 * fib, face);
  // the cut edge of card is a touch paler and rougher than its face
  alb = mix(alb * 1.08 + 0.015, alb, face);
  float sh = shadow(p + n * 0.004, uSun);
  float ao = occl(p, n);
  float wrap = max((dot(n, uSun) + 0.2) / 1.2, 0.0);
  vec3 c = alb * SUNC * 2.1 * wrap * sh * window(p);
  c += alb * SKY * (0.42 + 0.18 * n.y) * ao;
  // warm light coming back up off the linen
  c += alb * LINEN * 0.42 * max(-n.y * 0.6 + 0.4, 0.0) * ao * smoothstep(1.4, 0.0, p.y);
  // paper has only a faint sheen, mostly at grazing angles
  vec3 h = normalize(uSun - rd);
  float sp = pow(max(dot(n, h), 0.0), 26.0) * (0.04 + 0.5 * pow(1.0 - max(dot(n, -rd), 0.0), 5.0));
  c += SUNC * 2.0 * sp * sh * window(p) * face;
  return c;
}
vec3 env(vec3 rd){ return mix(HAZE, HAZE * vec3(0.9, 0.9, 0.93), smoothstep(0.0, 0.5, rd.y)); }

void main(){
  vec2 fc = gl_FragCoord.xy + uJit.xy;
  vec2 uv = (fc - 0.5 * uRes) / uRes.y - uShift;
  vec3 fw = uFw; vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)); vec3 up = cross(fw, rt);
  vec3 rd = normalize(fw * uFoc + rt * uv.x + up * uv.y);
  vec3 ro = uCam;
  vec3 fp = ro + rd * (uFocus / dot(rd, fw));
  ro += rt * uJit.z + up * uJit.w; rd = normalize(fp - ro);
  float tg = rd.y < 0.0 ? -ro.y / rd.y : 1e9;
  // only march inside the box that holds the stacks
  vec3 lo = vec3(-P - R - 0.2, 0.0, -R - 0.2); vec3 hi = vec3(P + R + 0.2, 6.0, R + 0.2);
  vec3 inv = 1.0 / rd; vec3 a = (lo - ro) * inv; vec3 b = (hi - ro) * inv;
  vec3 mn = min(a, b); vec3 mx = max(a, b);
  float t0 = max(max(mn.x, mn.y), max(mn.z, 0.0)); float t1 = min(min(mx.x, mx.y), mx.z);
  vec3 col; bool hit = false;
  if (t1 > t0) {
    float t = t0;
    for (int k = 0; k < 140; k++) {
      vec3 p = ro + rd * t;
      float d = map(p);
      if (d < 0.0004 * t) { hit = true; break; }
      t += d * 0.9;
      if (t > t1 || t > tg) break;
    }
    if (hit && t < tg) col = shadeDisc(ro + rd * t, rd); else hit = false;
  }
  if (!hit) col = tg < 1e8 ? ground(ro + rd * tg, rd, tg) : env(rd);
  col = min(col, vec3(20.0));
  if (uDirect > 0.5) col = tone(col);
  outC = vec4(col, 1.0);
}
`;

const POST = `#version 300 es
precision highp float;
out vec4 outC;
uniform sampler2D uAcc; uniform vec2 uRes; uniform float uGrain; uniform vec2 uCentre;
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 c = texture(uAcc, uv).rgb;
  vec2 px = 1.0 / uRes;
  vec3 nb = texture(uAcc, uv + vec2(px.x, 0.0)).rgb + texture(uAcc, uv - vec2(px.x, 0.0)).rgb + texture(uAcc, uv + vec2(0.0, px.y)).rgb + texture(uAcc, uv - vec2(0.0, px.y)).rgb;
  c = max(c + (c - nb * 0.25) * 0.35, 0.0);
  vec2 q = (uv - uCentre) * vec2(uRes.x / uRes.y, 1.0);
  c *= 1.0 - 0.2 * smoothstep(0.5, 1.4, length(q));
  c = tone(c);
  c = mix(c, c * c * (3.0 - 2.0 * c), 0.18);
  c += (h21(gl_FragCoord.xy + uGrain * 91.7) - 0.5) * 0.02;
  outC = vec4(c, 1.0);
}
`;

// No WebGL: the same three stacks from the front, in striped gradients.
function Still({ counts }: { counts: number[] }) {
  return (
    <div aria-hidden="true" className="absolute inset-x-0 top-[16%] mx-auto flex h-[40%] w-[86%] max-w-[620px] items-end justify-between">
      {counts.map((c, i) => (
        <div key={stats[i].label} className="relative w-[27%]" style={{ height: `${(c / 44) * 100}%` }}>
          <div className="absolute -bottom-[6%] left-[30%] h-[12%] w-[120%] rounded-[50%] bg-[#6b5a45]/25 blur-md" />
          <div className="absolute inset-x-0 bottom-0 top-[6%] rounded-b-[50%/14%]" style={{ background: `repeating-linear-gradient(180deg, rgba(0,0,0,0.16) 0 1px, transparent 1px 4px), linear-gradient(90deg, rgba(0,0,0,0.05), rgba(255,255,255,0.18) 30%, rgba(0,0,0,0.22) 100%), ${stats[i].colour}` }} />
          <div className="absolute inset-x-0 top-0 h-[12%] rounded-[50%]" style={{ background: `linear-gradient(160deg, rgba(255,255,255,0.28), rgba(0,0,0,0.04)), ${stats[i].colour}` }} />
        </div>
      ))}
    </div>
  );
}

type Disc = { y: number; v: number; k: number; tilt: number; out: boolean };

export default function CardDiscStackStatsRow() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const tags = useRef<(HTMLDivElement | null)[]>([]);
  const [period, setPeriod] = useState(0);
  const [shown, setShown] = useState<"wait" | "gl" | "still">("wait");
  const [nums, setNums] = useState<number[]>(periods[0].values);
  const api = useRef<{ go: (k: number, user: boolean) => void; hop: (i: number) => void } | null>(null);

  useEffect(() => {
    const box = stage.current, cv = canvas.current;
    if (!box || !cv) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gl = cv.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance" }) as WebGL2RenderingContext | null;
    if (!gl) { setShown("still"); return; }
    const canAcc = !!gl.getExtension("EXT_color_buffer_float") || !!gl.getExtension("EXT_color_buffer_half_float");
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const software = /swiftshader|llvmpipe|software|basic render/i.test(info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "");
    const calm = reduce || software;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(sh)); return null; }
      return sh;
    };
    const link = (frag: string) => {
      const v = compile(gl.VERTEX_SHADER, VERT), f = compile(gl.FRAGMENT_SHADER, frag);
      const p = gl.createProgram();
      if (!v || !f || !p) return null;
      gl.attachShader(p, v); gl.attachShader(p, f); gl.bindAttribLocation(p, 0, "aPos"); gl.linkProgram(p);
      return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
    };
    const scene = link(SCENE), post = canAcc ? link(POST) : null;
    if (!scene || (canAcc && !post)) { setShown("still"); return; }
    const su = Object.fromEntries(["uRes", "uJit", "uSeed", "uDirect", "uCam", "uFw", "uFoc", "uShift", "uFocus", "uRest", "uTop", "uN", "uFly", "uCol", "uSun"].map((n) => [n, gl.getUniformLocation(scene, n)]));
    const pu = post ? Object.fromEntries(["uAcc", "uRes", "uGrain", "uCentre"].map((n) => [n, gl.getUniformLocation(post, n)])) : {};
    const cols = new Float32Array(stats.flatMap((s) => lin(s.colour)));

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const acc = canAcc ? gl.createTexture() : null;
    const fbo = canAcc ? gl.createFramebuffer() : null;
    let W = 0, H = 0, scale = 1, cssW = 1, cssH = 1;

    // the piles: discs at rest, discs falling in (bottom first) and discs being dealt away
    const st = stats.map((_, i) => ({ rest: discs(0, i), fall: [] as Disc[], away: [] as Disc[], target: discs(0, i), spawn: 0, from: periods[0].values[i], to: periods[0].values[i], c0: discs(0, i) }));
    const s = { k: 0, px: 0, py: 0, sx: 0, sy: 0, count: 0, fresh: true, frame: 0, slow: 0, visible: true, raf: 0, last: 0, t0: 0, touched: false, demoAt: 0, first: true, sent: "", pos: "", xs: [] as number[][] };

    const size = () => {
      const r = box.getBoundingClientRect();
      cssW = Math.max(1, r.width); cssH = Math.max(1, r.height);
      const dpr = Math.min(software ? 1 : 1.5, window.devicePixelRatio || 1) * scale;
      const k = Math.min(1, Math.sqrt(1.1e6 / (cssW * cssH * dpr * dpr)));
      const w = Math.max(2, Math.round(cssW * dpr * k)), h = Math.max(2, Math.round(cssH * dpr * k));
      if (w === W && h === H) return;
      W = w; H = h; cv.width = W; cv.height = H;
      if (acc && fbo) {
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, acc);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, W, H, 0, gl.RGBA, gl.HALF_FLOAT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, acc, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }
      s.count = 0; s.fresh = true;
    };
    const halton = (i: number, b: number) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };

    // A level camera a little above the cloth, the lens shifted so the foot of the stacks sits on a set line.
    const camera = () => {
      const aspect = cssW / cssH, wide = cssW >= 760;
      const el = 0.36 - s.sy * 0.015, az = -0.16 + s.sx * 0.05, dist = 10.5;
      const cam = [dist * Math.sin(az) * Math.cos(el), 0.9 + dist * Math.sin(el), -dist * Math.cos(az) * Math.cos(el)];
      const fl = Math.hypot(cam[0], cam[2]);
      const fw = [-cam[0] / fl, 0, -cam[2] / fl];
      const rt = [fw[2], 0, -fw[0]];
      const foc = Math.min(wide ? 1.95 : 1.9, ((wide ? 0.86 : 0.74) * aspect * dist) / (2 * PITCH + 2 * R));
      const proj = (p: number[], sh: number[]) => {
        const d = [p[0] - cam[0], p[1] - cam[1], p[2] - cam[2]];
        const z = d[0] * fw[0] + d[2] * fw[2];
        return [(foc * (d[0] * rt[0] + d[2] * rt[2])) / z + sh[0], (foc * d[1]) / z + sh[1]];
      };
      const raw = proj([0, 0, 0], [0, 0]);
      const shift = [-raw[0], (wide ? -0.17 : -0.17) - raw[1]];
      return { cam, fw, foc, shift, proj };
    };

    const place = () => {
      const c = camera();
      const xs = stats.map((_, i) => { const u = c.proj([xOf(i), 0, -R], c.shift); return [cssW / 2 + u[0] * cssH, cssH / 2 - u[1] * cssH]; });
      const line = Math.max(...xs.map((p) => p[1]));
      xs.forEach((p) => { p[1] = line; });
      const key = xs.map((p) => p.map(Math.round).join(":")).join(",");
      if (key === s.pos) return;
      s.pos = key; s.xs = xs;
      tags.current.forEach((el, i) => { if (el) { el.style.left = `${xs[i][0]}px`; el.style.top = `${xs[i][1] + 22}px`; } });
    };

    const draw = (alpha: number, sample: number) => {
      const c = camera();
      const jx = sample ? halton(sample, 2) - 0.5 : 0, jy = sample ? halton(sample, 3) - 0.5 : 0;
      const la = halton(sample, 5) * Math.PI * 2, lr = sample ? Math.sqrt(halton(sample, 7)) * 0.05 : 0;
      gl.useProgram(scene);
      gl.bindFramebuffer(gl.FRAMEBUFFER, canAcc ? fbo : null);
      gl.viewport(0, 0, W, H);
      if (canAcc && alpha < 1) { gl.enable(gl.BLEND); gl.blendColor(0, 0, 0, alpha); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA); } else gl.disable(gl.BLEND);
      gl.uniform2f(su.uRes, W, H);
      gl.uniform4f(su.uJit, canAcc ? jx : 0, canAcc ? jy : 0, canAcc ? Math.cos(la) * lr : 0, canAcc ? Math.sin(la) * lr : 0);
      gl.uniform1f(su.uSeed, canAcc && sample ? (sample * 0.61803) % 1 : 0);
      gl.uniform1f(su.uDirect, canAcc ? 0 : 1);
      gl.uniform3f(su.uCam, c.cam[0], c.cam[1], c.cam[2]);
      gl.uniform3f(su.uFw, c.fw[0], c.fw[1], c.fw[2]);
      gl.uniform1f(su.uFoc, c.foc);
      gl.uniform2f(su.uShift, c.shift[0], c.shift[1]);
      gl.uniform1f(su.uFocus, -c.cam[0] * c.fw[0] - c.cam[2] * c.fw[2]);
      const fly = new Float32Array(S * FLY * 3), n = new Float32Array(S), top = new Float32Array(S), rest = new Float32Array(S);
      st.forEach((p, i) => {
        rest[i] = p.rest;
        let t = p.rest * T, j = 0;
        for (const d of [...p.fall, ...p.away]) {
          if (j >= FLY) break;
          fly.set([d.y, d.k, d.tilt], (i * FLY + j) * 3); j++;
          t = Math.max(t, d.y + T + Math.abs(d.tilt) * R);
        }
        n[i] = j; top[i] = t > 0 ? t + 0.02 : 0;
      });
      gl.uniform1fv(su.uRest, rest); gl.uniform1fv(su.uTop, top); gl.uniform1fv(su.uN, n);
      gl.uniform3fv(su.uFly, fly); gl.uniform3fv(su.uCol, cols);
      // late afternoon window, low on the left and a little behind the stacks
      const sa = -1.0 + s.sx * 0.03, se = 0.42;
      gl.uniform3f(su.uSun, Math.sin(sa) * Math.cos(se), Math.sin(se), Math.cos(sa) * Math.cos(se) * 0.55);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (canAcc && post) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.disable(gl.BLEND);
        gl.useProgram(post);
        gl.uniform1i(pu.uAcc, 1); gl.uniform2f(pu.uRes, W, H);
        gl.uniform1f(pu.uGrain, calm ? 1 : s.frame % 64);
        gl.uniform2f(pu.uCentre, 0.5, 0.5);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };

    const go = (k: number, user: boolean) => {
      if (user) s.touched = true;
      if (k === s.k) return;
      s.k = k; setPeriod(k);
      const now = performance.now();
      st.forEach((p, i) => {
        const shownNow = Math.round(p.from + (p.to - p.from) * prog(p));
        p.from = shownNow; p.to = periods[k].values[i];
        p.c0 = p.rest + p.fall.length; p.target = discs(k, i);
        // the stacks start one after another, left to right
        p.spawn = now + i * 140;
        if (reduce) { p.rest = p.target; p.fall = []; p.away = []; p.from = p.to; }
      });
      s.count = 0; wake();
    };
    // tapping a stack throws its top cards up a little; they fall back in order
    const hop = (i: number) => {
      s.touched = true;
      const p = st[i];
      if (reduce || p.fall.length || p.rest < 6) return;
      const m = 7;
      p.rest -= m;
      p.fall = Array.from({ length: m }, (_, j) => ({ y: (p.rest + j) * T, v: 1.1 + j * 0.42, k: p.rest + j, tilt: 0, out: false }));
      s.count = 0; wake();
    };
    api.current = { go, hop };
    const prog = (p: (typeof st)[number]) => {
      const c = p.rest;
      if (p.target === p.c0) return p.rest === p.target ? 1 : 0.5;
      return Math.max(0, Math.min(1, (c - p.c0) / (p.target - p.c0)));
    };

    const step = (dt: number, now: number) => {
      let moving = false;
      st.forEach((p, i) => {
        const have = p.rest + p.fall.length;
        if (now >= p.spawn) {
          if (have < p.target && p.fall.length < FLY - 1 && p.away.length === 0) {
            const k = have;
            const lastY = p.fall.length ? p.fall[p.fall.length - 1].y : p.rest * T;
            p.fall.push({ y: Math.max(k * T + 1.25, lastY + 0.2), v: -0.6, k, tilt: (Math.random() - 0.5) * 0.24, out: false });
            p.spawn = now + 34;
          } else if (have > p.target && p.fall.length === 0 && p.away.length < FLY - 1) {
            p.rest--;
            p.away.push({ y: p.rest * T, v: 2.6 + Math.random() * 0.6, k: p.rest, tilt: 0, out: true });
            p.spawn = now + 42;
          }
        }
        // falling cards: gravity, then each lands on the card below it with a small bounce
        for (let j = 0; j < p.fall.length; j++) {
          const d = p.fall[j];
          d.v -= 19 * dt; d.y += d.v * dt;
          d.tilt *= Math.exp(-dt * (d.y - d.k * T < 0.25 ? 18 : 2));
          const floor = j === 0 ? p.rest * T : p.fall[j - 1].y + T;
          if (d.y < floor) {
            const below = j === 0 ? 0 : p.fall[j - 1].v;
            d.y = floor; d.tilt *= 0.3;
            d.v = d.v - below < -0.55 ? below - (d.v - below) * 0.2 : below;
          }
        }
        while (p.fall.length && Math.abs(p.fall[0].y - p.rest * T) < 0.002 && Math.abs(p.fall[0].v) < 0.05) { p.fall.shift(); p.rest++; }
        // cards dealt away lift off, tip and leave the top of the frame
        for (const d of p.away) { d.v += 24 * dt; d.y += d.v * dt; d.tilt += dt * (d.k % 2 ? 0.5 : -0.5); }
        p.away = p.away.filter((d) => d.y < 5.5);
        if (p.fall.length || p.away.length || p.rest !== p.target) moving = true;
        if (!moving && p.rest === p.target) p.from = p.to;
        void i;
      });
      return moving;
    };

    const frame = (now: number) => {
      s.raf = 0;
      if (!s.visible) return;
      const dtRaw = s.last ? (now - s.last) / 1000 : 0.016;
      const dt = Math.min(0.033, dtRaw);
      s.last = now; s.frame++;
      if (!s.t0) { s.t0 = now; s.demoAt = now + 4200; }
      // opens finished, holds, then walks through the periods until someone takes over
      if (!calm && !s.touched && now > s.demoAt) { go((s.k + 1) % periods.length, false); s.demoAt = now + 4800; }

      let moving = false;
      for (let k = 0; k < 2; k++) moving = step(dt / 2, now) || moving;
      const vals = st.map((p) => (p.rest === p.target && !p.fall.length && !p.away.length ? p.to : Math.round(p.from + (p.to - p.from) * prog(p))));
      const key = vals.join(",");
      if (key !== s.sent) { s.sent = key; setNums(vals); }

      let drift = false;
      if (!calm) {
        const ox = s.sx, oy = s.sy;
        s.sx += (s.px - s.sx) * (1 - Math.exp(-dt * 3)); s.sy += (s.py - s.sy) * (1 - Math.exp(-dt * 3));
        drift = Math.abs(s.sx - ox) + Math.abs(s.sy - oy) > 0.0004;
      }
      place();
      if (s.fresh || !canAcc) { draw(1, 0); s.fresh = false; s.count = 1; }
      else if (moving) { draw(0.92, 1 + (s.frame % 64)); s.count = 2; }
      else if (drift) { draw(0.5, 1 + (s.frame % 64)); s.count = 3; }
      else if (s.count < 40) { s.count++; draw(1 / s.count, s.count); }
      if (s.first) { s.first = false; setShown("gl"); }

      if (!calm && dtRaw > 0.026) s.slow++; else s.slow = Math.max(0, s.slow - 2);
      if (s.slow > 40 && scale > 0.5) { scale *= 0.82; s.slow = 0; size(); }

      if (moving || drift || s.count < 40 || (!calm && !s.touched)) s.raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!s.raf && s.visible) { s.last = 0; s.raf = requestAnimationFrame(frame); } };

    size();
    const ro = new ResizeObserver(() => { size(); s.pos = ""; wake(); });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting && !document.hidden; if (s.visible) wake(); }, { threshold: 0.05 });
    io.observe(box);
    const vis = () => { s.visible = !document.hidden; if (s.visible) wake(); };
    document.addEventListener("visibilitychange", vis);
    const move = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      s.px = ((e.clientX - r.left) / r.width) * 2 - 1; s.py = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (!calm) wake();
    };
    const leave = () => { s.px = 0; s.py = 0; wake(); };
    // pressing a pile itself knocks it too
    const click = (e: MouseEvent) => {
      if (e.target !== cv) return;
      const r = box.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      const gap = s.xs.length > 1 ? (s.xs[1][0] - s.xs[0][0]) / 2 : 100;
      s.xs.forEach((p, i) => { if (Math.abs(x - p[0]) < gap * 0.7 && y < p[1] && y > p[1] - cssH * 0.6) hop(i); });
    };
    cv.addEventListener("click", click);
    box.addEventListener("pointermove", move);
    box.addEventListener("pointerleave", leave);
    const lost = (e: Event) => { e.preventDefault(); setShown("still"); };
    cv.addEventListener("webglcontextlost", lost);
    wake();
    return () => {
      cancelAnimationFrame(s.raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      box.removeEventListener("pointermove", move); box.removeEventListener("pointerleave", leave);
      cv.removeEventListener("webglcontextlost", lost); cv.removeEventListener("click", click);
      api.current = null;
    };
  }, []);

  const choose = (k: number) => {
    if (api.current) api.current.go(k, true);
    else { setPeriod(k); setNums(periods[k].values); }
  };
  const counts = stats.map((_, i) => discs(period, i));

  return (
    <section className="relative isolate overflow-hidden bg-[#e7e0d4] text-[#1d1a16]" style={{ fontFamily: FONT }}>
      <div ref={stage} className="relative mx-auto h-[600px] w-full max-w-[1600px] sm:h-[760px]" style={{ background: "radial-gradient(120% 90% at 35% 40%, #efe9df 0%, #e4ddd1 60%, #d6cdbf 100%)" }}>
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${shown === "gl" ? "opacity-100" : "opacity-0"}`} />
        {shown === "still" && <Still counts={counts} />}

        <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-col gap-4 px-5 pt-6 sm:flex-row sm:items-start sm:justify-between sm:px-10 sm:pt-9 lg:px-14">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#1d1a16]/60">Ferrow Pottery shop <span className="mx-1.5 text-[#1d1a16]/30">/</span> demo data</p>
            <h2 className="mt-2 text-[26px] font-semibold leading-none tracking-[-0.035em] sm:text-[32px]">{periods[period].key}</h2>
          </div>
          <div role="group" aria-label="Period" className="pointer-events-auto inline-flex w-fit rounded-full bg-[#1d1a16]/[0.07] p-1">
            {periods.map((p, k) => (
              <button key={p.key} type="button" aria-pressed={period === k} onClick={() => choose(k)} className={`h-10 whitespace-nowrap rounded-full px-3 text-[12px] font-semibold tracking-[-0.01em] transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d1a16] motion-reduce:transition-none sm:px-4 sm:text-[13px] ${period === k ? "bg-[#1d1a16] text-[#f3eee6]" : "text-[#1d1a16]/70 hover:text-[#1d1a16]"}`}>{p.key}</button>
            ))}
          </div>
        </div>

        <ul className="pointer-events-none absolute inset-0" aria-label={`${periods[period].key}, demo data`}>
          {stats.map((st, i) => (
            <li key={st.label}>
              <div ref={(el) => { tags.current[i] = el; }} className="absolute w-[31%] -translate-x-1/2 text-center sm:w-[26%]" style={{ left: `${20 + i * 30}%`, top: "64%" }}>
                <button type="button" onClick={() => api.current?.hop(i)} aria-label={`${fmt(nums[i])} ${st.label}. One disc is ${fmt(st.unit)}. Tap to knock the stack.`} className="pointer-events-auto w-full rounded-2xl px-1 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d1a16]">
                  <span className="block text-[34px] font-medium leading-[0.86] tracking-[-0.06em] tabular-nums sm:text-[64px] lg:text-[88px]">{fmt(nums[i])}</span>
                  <span className="mt-2 flex items-center justify-center gap-2 text-[15px] italic leading-tight text-[#1d1a16]/80 sm:text-[20px]" style={{ fontFamily: SERIF }}>
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: st.colour }} />{st.label}
                  </span>
                  <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1d1a16]/55 sm:text-[11px]">1 disc = {fmt(st.unit)}</span>
                </button>
              </div>
            </li>
          ))}
        </ul>

        <table className="sr-only">
          <caption>Shop figures by period, demo data</caption>
          <thead><tr><th scope="col">Period</th>{stats.map((s) => <th key={s.label} scope="col">{s.label}</th>)}</tr></thead>
          <tbody>{periods.map((p) => <tr key={p.key}><th scope="row">{p.key}</th>{p.values.map((v, i) => <td key={stats[i].label}>{fmt(v)}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}
