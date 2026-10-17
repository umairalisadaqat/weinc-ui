import { useEffect, useRef, useState } from "react";

// The three lines of the day. `at` is how far through the scroll (0 dawn, 1 dusk) each one arrives.
const hours = [
  { label: "Morning", time: "06:40", line: "First light finds the glaze before it finds the room.", at: 0.12 },
  { label: "Noon", time: "12:30", line: "At midday the plaster goes white and the vase keeps its own shade.", at: 0.5 },
  { label: "Evening", time: "19:15", line: "By evening the wall turns to honey and the day is put away.", at: 0.86 },
];
const STUDIO = "Casa Orvell";
const PLACE = "The east room";
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';

const sm = (a: number, b: number, x: number) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mix3 = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t);
// Colour of the sun and of the sky fill through the day: rose dawn, white noon, amber dusk.
const SUNS = [[1.0, 0.52, 0.36], [1.0, 0.8, 0.6], [1.0, 0.97, 0.92], [1.0, 0.72, 0.42], [1.0, 0.36, 0.1]];
const SKIES = [[0.46, 0.42, 0.56], [0.56, 0.55, 0.6], [0.6, 0.6, 0.6], [0.56, 0.48, 0.5], [0.4, 0.28, 0.4]];
const along = (tab: number[][], p: number) => {
  const x = Math.max(0, Math.min(0.9999, p)) * (tab.length - 1), i = Math.floor(x);
  return mix3(tab[i], tab[i + 1], sm(0, 1, x - i));
};
// minutes since midnight at dawn, at each line, and at dusk, so the clock reads each line's own time
const CLOCK = [[0, 350], [0.12, 400], [0.5, 750], [0.86, 1155], [1, 1205]];
const clock = (p: number) => {
  let k = 0;
  while (k < CLOCK.length - 2 && p > CLOCK[k + 1][0]) k++;
  const [a, ma] = CLOCK[k], [b, mb] = CLOCK[k + 1];
  const m = Math.round(ma + (mb - ma) * Math.max(0, Math.min(1, (p - a) / (b - a))));
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

const VERT = `ATTR vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;
const TONE = `
vec3 tone(vec3 x){ vec3 a = x * (2.51 * x + 0.03); vec3 b = x * (2.43 * x + 0.59) + 0.14; return pow(clamp(a / b, 0.0, 1.0), vec3(1.0 / 2.2)); }
`;

// A lime-plaster wall with an arched niche, a glazed vase standing in it, a stone floor below.
// The sun comes through a two-pane window behind the camera; its patch, colour and shadows move with uL.
const SCENE = `
precision highp float;
uniform vec2 uRes; uniform vec4 uJit; uniform float uT;
uniform vec3 uCam; uniform vec3 uTgt; uniform float uFoc; uniform vec2 uShift; uniform float uFocus;
uniform vec3 uL; uniform float uWin; uniform vec3 uSun; uniform vec3 uSky; uniform float uDirect;
const float ZW = 9.0;
const float FLOOR = -2.3;
const vec3 VASE = vec3(0.0, -0.62, -0.3);
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * n2(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p; a *= 0.5; } return s; }
float smax(float a, float b, float k){ float h = clamp(0.5 - 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) + k * h * (1.0 - h); }

// arch outline in the wall plane: a box up to the spring line with a half circle on top
float arch(vec2 p){
  const float w = 0.78, y0 = -0.62, y1 = 0.72;
  vec2 q = vec2(abs(p.x), p.y);
  return max(length(vec2(q.x, max(q.y - y1, 0.0))) - w, y0 - q.y);
}
float wall(vec3 p){
  float hole = max(arch(p.xy), -0.56 - p.z);
  return smax(p.z, -hole, 0.025);
}
// a lathe-turned vase: round belly, narrow neck, a small turned-out lip
float vaseR(float h){
  float belly = 0.36 * pow(max(sin(3.14159 * clamp(h / 0.86, 0.0, 1.0)), 0.0), 0.7);
  float neck = 0.085 + 0.03 * smoothstep(0.98, 1.12, h);
  return max(belly * (1.0 - smoothstep(0.72, 0.9, h)), neck) + 0.06 * (1.0 - smoothstep(0.0, 0.08, h)) * 0.0;
}
float vase(vec3 p){
  vec3 q = (p - VASE) / 1.22;
  float h = q.y;
  float r = vaseR(clamp(h, 0.0, 1.12));
  float d = (length(q.xz) - r) * 0.72;
  d = max(d, max(-h, h - 1.12));
  float lip = length(vec2(length(q.xz) - 0.112, h - 1.11)) - 0.022;
  return min(d, lip) * 1.22;
}
float map(vec3 p, out float id){
  float w = wall(p), f = p.y - FLOOR, v = vase(p);
  float hh = clamp(0.5 + 0.5 * (f - w) / 0.07, 0.0, 1.0);
  float d = mix(f, w, hh) - 0.07 * hh * (1.0 - hh); id = w < f ? 0.0 : 1.0;
  if (v < d) { d = v; id = 2.0; }
  return d;
}
float mapD(vec3 p){ float i; return map(p, i); }
vec3 nrm(vec3 p){ const vec2 k = vec2(1.0, -1.0); const float e = 0.0012;
  return normalize(k.xyy * mapD(p + k.xyy * e) + k.yyx * mapD(p + k.yyx * e) + k.yxy * mapD(p + k.yxy * e) + k.xxx * mapD(p + k.xxx * e)); }
float shadow(vec3 ro, vec3 rd){
  float r = 1.0, t = 0.015;
  for (int i = 0; i < 40; i++) {
    float h = mapD(ro + rd * t);
    r = min(r, 9.0 * h / t);
    t += clamp(h, 0.012, 0.25);
    if (r < 0.002 || t > 6.0) break;
  }
  return clamp(r, 0.0, 1.0);
}
float ao(vec3 p, vec3 n){ float o = 0.0, s = 1.0; for (int i = 1; i <= 5; i++) { float h = 0.03 + 0.07 * float(i); o += (h - mapD(p + n * h)) * s; s *= 0.62; } return clamp(1.0 - 1.5 * o, 0.0, 1.0); }
// how much sun gets through the window: two casements with a mullion, transom and a moving leaf dapple
float window(vec3 p){
  vec3 nw = normalize(vec3(-0.45 * uWin, 0.0, 1.0));
  vec3 w0 = vec3(0.0, 6.1, ZW);
  float dn = dot(uL, nw);
  if (dn < 0.05) return 0.0;
  float t = dot(w0 - p, nw) / dn;
  vec3 hit = p + uL * t - w0;
  vec3 ua = normalize(cross(vec3(0.0, 1.0, 0.0), nw));
  vec2 q = vec2(dot(hit, ua) * 1.35, hit.y);
  float pen = 0.007 * t + 0.012;
  float frame = smoothstep(-pen, pen, 1.05 - abs(q.x)) * smoothstep(-pen, pen, 1.45 - abs(q.y));
  float mull = smoothstep(-pen, pen, abs(q.x) - 0.045);
  float tran = smoothstep(-pen, pen, abs(q.y - 0.55) - 0.04);
  float bars = smoothstep(-pen, pen, abs(abs(q.x) - 0.62) - 0.018) * smoothstep(-pen, pen, abs(q.y + 0.6) - 0.018);
  vec2 lq = q * 0.9 + vec2(sin(uT * 0.31) * 0.12, cos(uT * 0.23) * 0.06);
  float leaf = smoothstep(0.48, 0.72, fbm(lq * 1.6 + vec2(3.1, 7.7)));
  float dap = 1.0 - 0.55 * leaf * smoothstep(-0.2, 1.2, q.x + q.y * 0.4);
  return frame * mull * tran * bars * dap;
}
vec3 plaster(vec2 p, float fine){
  float big = fbm(p * vec2(0.55, 0.8) + 4.0);
  float cloud = fbm(p * 1.7 + big * 1.5);
  float trowel = fbm(vec2(p.x * 2.2 + p.y * 0.8, p.y * 6.0) * 0.7);
  float a = 0.86 + 0.14 * big + 0.08 * cloud - 0.06 * trowel + 0.035 * fine;
  return vec3(0.93, 0.85, 0.72) * a;
}
vec3 env(vec3 d){
  // a room behind the camera: one bright window, warm walls
  float w = smoothstep(0.92, 0.985, dot(d, uL));
  vec3 room = mix(vec3(0.3, 0.24, 0.17), uSky * 0.35 + vec3(0.12, 0.1, 0.07), smoothstep(-0.2, 0.6, d.y));
  return room * 0.6 + uSun * w * 1.6;
}
vec3 shade(vec3 ro, vec3 rd){
  float t = 0.0, id = 0.0;
  for (int i = 0; i < 120; i++) {
    float d = map(ro + rd * t, id);
    if (d < 0.0008 * t || t > 30.0) break;
    t += d * 0.9;
  }
  if (t > 30.0) return vec3(0.0);
  vec3 p = ro + rd * t, n = nrm(p);
  vec3 alb; float rough = 1.0, spec = 0.0;
  if (id < 0.5) {
    float fine = n2(p.xy * 70.0);
    vec2 e = vec2(0.02, 0.0);
    float b0 = fbm(p.xy * 3.0), bx = fbm((p.xy + e.xy) * 3.0), by = fbm((p.xy + e.yx) * 3.0);
    float f2 = n2(p.xy * 26.0), f2x = n2((p.xy + e.xy * 0.2) * 26.0), f2y = n2((p.xy + e.yx * 0.2) * 26.0);
    n = normalize(n + (vec3(-(bx - b0), -(by - b0), 0.0) * 0.85 + vec3(-(f2x - f2), -(f2y - f2), 0.0) * 0.12) * (abs(n.z) > 0.5 ? 1.0 : 0.4));
    alb = plaster(p.xy, fine);
    if (p.z < -0.02) alb *= 0.97;
  } else if (id < 1.5) {
    float g = fbm(p.xz * vec2(1.2, 3.0));
    alb = vec3(0.56, 0.47, 0.38) * (0.86 + 0.18 * g);
    float joint = smoothstep(0.01, 0.0, abs(fract(p.x * 0.3 + 0.5) - 0.5) / 0.3);
    alb *= 1.0 - 0.25 * joint;
    spec = 0.04; rough = 0.5;
  } else {
    vec3 q = (p - VASE) / 1.22;
    float h = q.y;
    vec3 body = vec3(0.05, 0.068, 0.058);
    vec3 bare = vec3(0.62, 0.36, 0.24);
    float drip = smoothstep(0.02, -0.02, h - 0.16 - 0.06 * n2(vec2(atan(q.z, q.x) * 6.0, 0.0)));
    float pool = smoothstep(0.3, 0.9, fbm(vec2(atan(q.z, q.x) * 2.0, h * 4.0)));
    alb = mix(mix(body, vec3(0.15, 0.17, 0.13), pool * 0.8), bare, drip);
    spec = mix(0.9, 0.0, drip); rough = mix(0.22, 0.9, drip);
  }
  float sh = shadow(p + n * 0.025, uL);
  float win = window(p);
  float dif = max(dot(n, uL), 0.0);
  float o = ao(p, n);
  vec3 sun = uSun * dif * sh * win * 2.6;
  // the lit patch bounces warm light back into the room
  vec3 bounce = uSun * vec3(1.0, 0.9, 0.78) * (0.3 + 0.12 * max(n.y, 0.0)) * (0.6 + 0.4 * smoothstep(-1.0, 1.0, n.z));
  vec3 sky = uSky * (0.3 + 0.1 * n.y);
  vec3 col = alb * (sun + (bounce + sky) * o * (0.55 + 0.45 * o));
  // subsurface softness of lime plaster in the light
  if (id < 0.5) col += alb * uSun * win * sh * 0.08 * (1.0 - dif);
  if (spec > 0.0) {
    vec3 r = reflect(rd, n);
    float fr = 0.04 + 0.96 * pow(1.0 - max(dot(n, -rd), 0.0), 5.0);
    vec3 refl = env(r) * o;
    float hl = pow(max(dot(r, uL), 0.0), mix(900.0, 20.0, rough)) * sh * win * 14.0;
    col = mix(col, refl, fr * spec) + uSun * hl * spec;
  }
  // room haze, a touch of air between camera and wall
  col = mix(col, uSky * 0.12 + uSun * 0.03, 1.0 - exp(-t * 0.008));
  return col;
}
void main(){
  vec2 px = gl_FragCoord.xy + uJit.xy;
  vec2 uv = (2.0 * px - uRes) / uRes.y - uShift;
  vec3 ww = normalize(uTgt - uCam), uu = normalize(cross(ww, vec3(0.0, 1.0, 0.0))), vv = cross(uu, ww);
  vec3 rd = normalize(uv.x * uu + uv.y * vv + uFoc * ww);
  vec3 fp = uCam + rd * (uFocus / dot(rd, ww));
  vec3 ro = uCam + (uu * uJit.z + vv * uJit.w);
  rd = normalize(fp - ro);
  vec3 c = shade(ro, rd);
  if (uDirect > 0.5) {
    vec2 q = gl_FragCoord.xy / uRes - 0.5;
    c *= 1.0 - 0.35 * dot(q, q);
    c = tone(c);
    outC = vec4(c, 1.0);
  } else outC = vec4(c, 1.0);
}
`;

const POST = `
precision highp float;
uniform sampler2D uAcc; uniform vec2 uRes; uniform float uGrain;
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 c = texture2D(uAcc, uv).rgb;
  vec3 b = vec3(0.0);
  for (int i = 0; i < 12; i++) {
    float a = float(i) * 2.39996; float r = sqrt((float(i) + 0.5) / 12.0);
    vec3 s = texture2D(uAcc, uv + vec2(cos(a), sin(a)) * r * 0.03 * vec2(uRes.y / uRes.x, 1.0)).rgb;
    b += max(s - 1.1, 0.0);
  }
  c += b * 0.012;
  vec2 q = uv - 0.5;
  c *= 1.0 - 0.22 * dot(q, q);
  c = tone(c);
  c += (h21(gl_FragCoord.xy + uGrain * 91.7) - 0.5) * 0.018;
  outC = vec4(c, 1.0);
}
`;

// No WebGL: the wall at noon, drawn with gradients so the section still looks like a room.
function Still() {
  return (
    <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(180deg, #d9cdb9 0%, #e6dbc8 55%, #cbbca6 82%, #a99883 82.4%, #bba994 100%)" }}>
      <div className="absolute left-[18%] top-[34%] h-[46%] w-[46%] -skew-x-6 rounded-sm opacity-70 blur-md sm:left-[48%]" style={{ background: "linear-gradient(160deg, #fbf3e6, #f2e6d2)" }} />
      <div className="absolute left-1/2 top-[18%] h-[56%] w-[30%] max-w-[240px] -translate-x-1/2 rounded-t-full sm:left-[66%]" style={{ background: "linear-gradient(180deg, #b9ab95, #d6c9b3 60%, #cdbfa9)", boxShadow: "inset 18px 22px 30px rgba(80,60,40,0.35)" }}>
        <svg viewBox="0 0 100 120" className="absolute bottom-0 left-1/2 w-[62%] -translate-x-1/2">
          <path d="M44 6 h12 v8 c0 6 22 18 24 46 c2 30 -12 52 -30 56 c-18 -4 -32 -26 -30 -56 c2 -28 24 -40 24 -46 z" fill="#14271f" />
          <path d="M60 30 c8 8 12 20 11 34" stroke="#f3e7d0" strokeOpacity="0.45" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

export default function PlasterWallNicheDawnToDusk() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const [p, setPState] = useState(0.5);
  const [shown, setShown] = useState<"wait" | "gl" | "still">("wait");
  const api = useRef<{ go: (p: number) => void } | null>(null);
  const pRef = useRef(0.5);

  useEffect(() => {
    const box = stage.current, cv = canvas.current;
    if (!box || !cv) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const opts = { antialias: false, alpha: false, powerPreference: "high-performance" as const };
    const gl2 = cv.getContext("webgl2", opts) as WebGL2RenderingContext | null;
    const gl = (gl2 ?? cv.getContext("webgl", opts)) as WebGLRenderingContext | null;
    if (!gl) { setShown("still"); return; }
    const canAcc = !!gl2 && (!!gl2.getExtension("EXT_color_buffer_float") || !!gl2.getExtension("EXT_color_buffer_half_float"));
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    const software = /swiftshader|llvmpipe|software|basic render/i.test(renderer);

    const head = gl2 ? "#version 300 es\n#define ATTR in\n" : "#define ATTR attribute\n";
    const fhead = gl2 ? "#version 300 es\n#define texture2D texture\nprecision highp float;\nout vec4 outC;\n" : "#define outC gl_FragColor\n";
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { box.dataset.err = String(gl.getShaderInfoLog(sh)); return null; }
      return sh;
    };
    const link = (frag: string) => {
      const v = compile(gl.VERTEX_SHADER, head + VERT), f = compile(gl.FRAGMENT_SHADER, fhead + frag);
      const pr = gl.createProgram();
      if (!v || !f || !pr) return null;
      gl.attachShader(pr, v); gl.attachShader(pr, f); gl.bindAttribLocation(pr, 0, "aPos"); gl.linkProgram(pr);
      return gl.getProgramParameter(pr, gl.LINK_STATUS) ? pr : null;
    };
    const scene = link(SCENE), post = canAcc ? link(POST) : null;
    if (!scene || (canAcc && !post)) { setShown("still"); return; }
    const U = (pr: WebGLProgram, n: string) => gl.getUniformLocation(pr, n);
    const su = Object.fromEntries(["uRes", "uJit", "uT", "uCam", "uTgt", "uFoc", "uShift", "uFocus", "uL", "uWin", "uSun", "uSky", "uDirect"].map((n) => [n, U(scene, n)]));
    const pu = post ? Object.fromEntries(["uAcc", "uRes", "uGrain"].map((n) => [n, U(post, n)])) : {};

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const acc = canAcc ? gl.createTexture() : null;
    const fbo = canAcc ? gl.createFramebuffer() : null;
    let W = 0, H = 0, scale = 1, cssW = 1, cssH = 1;
    const s = {
      p: 0.5, T: 0.5, px: 0, py: 0, sx: 0, sy: 0, count: 0, fresh: true, frame: 0, slow: 0,
      visible: true, raf: 0, last: 0, t0: 0, touched: false, first: true, fpsN: 0, fpsT: 0, time: 0,
    };
    const size = () => {
      const r = box.getBoundingClientRect();
      cssW = Math.max(1, r.width); cssH = Math.max(1, r.height);
      const dpr = Math.min(software ? 1 : 1.5, window.devicePixelRatio || 1) * scale;
      const k = Math.min(1, Math.sqrt(1.5e6 / (cssW * cssH * dpr * dpr)));
      const w = Math.max(2, Math.round(cssW * dpr * k)), h = Math.max(2, Math.round(cssH * dpr * k));
      if (w === W && h === H) return;
      W = w; H = h; cv.width = W; cv.height = H;
      if (gl2 && acc && fbo) {
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, acc);
        gl2.texImage2D(gl.TEXTURE_2D, 0, gl2.RGBA16F, W, H, 0, gl.RGBA, gl2.HALF_FLOAT, null);
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

    // The sun swings from low in the east, over the top, to low in the west.
    const sunDir = (p: number) => {
      const a = (p - 0.5) * 2;
      const lx = a * 0.13, ly = 0.38 + 0.38 * (1 - a * a), lz = 1;
      const l = Math.hypot(lx, ly, lz);
      return [lx / l, ly / l, lz / l];
    };
    const camera = () => {
      const wide = cssW >= 1024, aspect = cssW / cssH;
      const cam = [0.55 + s.sx * 0.35, 0.1 - s.sy * 0.18, 7.4];
      const tgt = [0, -0.15, 0];
      const foc = wide ? 2.85 : 2.1 * Math.min(1.25, aspect / 0.55);
      const shift = wide ? [0.42 * aspect / 1.68, 0.02] : [0, 0.24];
      return { cam, tgt, foc, shift };
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
      gl.uniform1f(su.uT, s.time);
      gl.uniform3f(su.uCam, c.cam[0], c.cam[1], c.cam[2]); gl.uniform3f(su.uTgt, c.tgt[0], c.tgt[1], c.tgt[2]);
      gl.uniform1f(su.uFoc, c.foc);
      gl.uniform2f(su.uShift, c.shift[0], c.shift[1]);
      gl.uniform1f(su.uFocus, Math.hypot(c.cam[0], c.cam[1] + 0.2, c.cam[2] + 0.3));
      const L = sunDir(s.p);
      gl.uniform3f(su.uL, L[0], L[1], L[2]);
      gl.uniform1f(su.uWin, 1);
      // the sun dims and warms as it drops toward either horizon
      const elev = 1 - Math.pow((s.p - 0.5) * 2, 2);
      const sun = along(SUNS, s.p).map((v) => v * (0.66 + 0.3 * elev));
      gl.uniform3f(su.uSun, sun[0], sun[1], sun[2]);
      const sky = along(SKIES, s.p).map((v) => v * (0.75 + 0.35 * elev));
      gl.uniform3f(su.uSky, sky[0], sky[1], sky[2]);
      gl.uniform1f(su.uDirect, canAcc ? 0 : 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (canAcc && post) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.disable(gl.BLEND);
        gl.useProgram(post);
        gl.uniform1i(pu.uAcc, 1); gl.uniform2f(pu.uRes, W, H);
        gl.uniform1f(pu.uGrain, reduce ? 1 : s.frame % 64);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };

    const setP = (p: number) => {
      s.T = Math.max(0, Math.min(1, p));
      if (reduce) { s.p = s.T; s.count = 0; }
      wake();
    };
    api.current = { go: (p: number) => { s.touched = true; setP(p); } };

    // The self-running day: hold noon, then let the light walk from dawn to dusk and back.
    const demo = (ms: number) => {
      if (ms < 4200) return 0.5;
      const t = (ms - 4200) / 1000;
      return 0.5 - 0.5 * Math.sin((t / 22) * Math.PI * 2);
    };

    const frame = (now: number) => {
      s.raf = 0;
      if (!s.visible) return;
      const dtRaw = s.last ? (now - s.last) / 1000 : 0.016;
      const dt = Math.min(0.033, dtRaw);
      s.last = now; s.frame++;
      if (!s.t0) s.t0 = now;
      if (!reduce && !s.touched) s.T = demo(now - s.t0);

      let moving = false;
      if (!reduce) {
        s.time += dt;
        s.p += (s.T - s.p) * (1 - Math.exp(-dt * 3.2));
        if (Math.abs(s.T - s.p) < 0.0004) s.p = s.T; else moving = true;
        const ox = s.sx, oy = s.sy;
        s.sx += (s.px - s.sx) * (1 - Math.exp(-dt * 2.5)); s.sy += (s.py - s.sy) * (1 - Math.exp(-dt * 2.5));
        if (Math.abs(s.sx - ox) + Math.abs(s.sy - oy) > 1e-4) moving = true;
      }
      if (Math.abs(pRef.current - s.p) > 0.002) {
        pRef.current = s.p; setPState(Math.round(s.p * 500) / 500);
      }
      if (timeRef.current) timeRef.current.textContent = clock(s.p);

      // leaves keep swaying, so motion renders blend a few jittered samples; a still day piles up 48
      if (s.fresh || !canAcc) { draw(1, 0); s.fresh = false; s.count = 1; }
      else if (moving || !reduce) { draw(moving ? 0.5 : 0.22, 1 + (s.frame % 32)); s.count = 3; }
      else if (s.count < 48) { s.count++; draw(1 / s.count, s.count); }
      if (s.first) { s.first = false; setShown("gl"); }

      if (!reduce && dtRaw > 0.026) s.slow++; else s.slow = Math.max(0, s.slow - 2);
      if (!software && s.slow > 45 && scale > 0.45) { scale *= 0.82; s.slow = 0; size(); }
      s.fpsN++; if (now - s.fpsT > 1000) { box.dataset.fps = String(Math.round((s.fpsN * 1000) / (now - s.fpsT))); s.fpsN = 0; s.fpsT = now; }

      if (!reduce || s.count < 48) s.raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!s.raf && s.visible) { s.last = 0; s.raf = requestAnimationFrame(frame); } };

    // Scroll is the clock: dawn as the wall rises into view, dusk as it leaves.
    const onScroll = () => {
      const r = box.getBoundingClientRect(), vh = window.innerHeight || 800;
      if (r.bottom < 0 || r.top > vh) return;
      s.touched = true;
      setP((vh - r.top) / (vh + r.height) * 1.3 - 0.15);
    };

    size();
    const ro = new ResizeObserver(() => { size(); wake(); });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting && !document.hidden; if (s.visible) wake(); }, { threshold: 0.02 });
    io.observe(box);
    const vis = () => { s.visible = !document.hidden; if (s.visible) wake(); };
    document.addEventListener("visibilitychange", vis);
    window.addEventListener("scroll", onScroll, { passive: true });
    const move = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      s.px = ((e.clientX - r.left) / r.width) * 2 - 1; s.py = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (!reduce) wake();
    };
    const leave = () => { s.px = 0; s.py = 0; };
    box.addEventListener("pointermove", move);
    box.addEventListener("pointerleave", leave);
    const lost = (e: Event) => { e.preventDefault(); setShown("still"); };
    cv.addEventListener("webglcontextlost", lost);
    wake();

    return () => {
      cancelAnimationFrame(s.raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      window.removeEventListener("scroll", onScroll);
      box.removeEventListener("pointermove", move); box.removeEventListener("pointerleave", leave);
      cv.removeEventListener("webglcontextlost", lost);
      api.current = null;
    };
  }, []);

  const current = p < 0.31 ? 0 : p < 0.68 ? 1 : 2;
  const choose = (i: number) => { if (api.current) api.current.go(hours[i].at); else { pRef.current = hours[i].at; setPState(hours[i].at); } };
  const keys = (e: React.KeyboardEvent, i: number) => {
    const next = e.key === "ArrowRight" || e.key === "ArrowDown" ? i + 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? hours.length - 1 : -9;
    if (next === -9) return;
    e.preventDefault();
    const k = Math.max(0, Math.min(hours.length - 1, next));
    choose(k);
    document.getElementById(`pwn-hour-${k}`)?.focus();
  };

  return (
    <section className="relative isolate overflow-hidden bg-[#d8cbb6] text-[#231c14]" style={{ fontFamily: FONT }}>
      <div ref={stage} className="relative mx-auto h-[820px] w-full max-w-[1600px] lg:h-[760px]" style={{ background: "linear-gradient(180deg, #d9cdb9, #e3d7c3 60%, #c3b39c)" }}>
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${shown === "gl" ? "opacity-100" : "opacity-0"}`} />
        {shown === "still" && <Still />}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 px-6 pb-8 sm:px-10 lg:bottom-auto lg:top-0 lg:w-[46%] lg:px-16 lg:pt-16">
          <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-[#231c14]/70">{STUDIO}<span className="mx-2 text-[#231c14]/30">/</span>{PLACE}</p>
          <h2 className="mt-4 text-[40px] font-semibold leading-[0.95] tracking-[-0.045em] sm:text-[52px] lg:mt-8 lg:text-[72px]">One wall,<br />one day.</h2>
          <p className="mt-3 flex items-baseline gap-3 text-[13px] font-medium tabular-nums text-[#7a3f17]">
            <span ref={timeRef}>{clock(p)}</span><span className="h-px w-8 bg-[#7a3f17]/40" /><span>{hours[current].label}</span>
          </p>
          <ol aria-live="polite" className="mt-5 space-y-3 lg:mt-8 lg:space-y-4">
            {hours.map((h, i) => {
              const seen = sm(h.at - 0.12, h.at - 0.02, p);
              const now = i === current;
              return (
                <li key={h.label} className="max-w-[26rem] text-[17px] italic leading-snug transition-[color] duration-500 lg:text-[21px]" style={{ fontFamily: SERIF, opacity: seen * (now ? 1 : 0.5), transform: `translateY(${(1 - seen) * 10}px)`, color: now ? "#231c14" : "#3d3226" }} aria-hidden={seen < 0.5}>
                  {h.line}
                </li>
              );
            })}
          </ol>
          <div role="group" aria-label="Time of day" className="pointer-events-auto mt-6 flex gap-2 lg:mt-10">
            {hours.map((h, i) => (
              <button
                key={h.label}
                id={`pwn-hour-${i}`}
                type="button"
                aria-pressed={i === current}
                tabIndex={i === current ? 0 : -1}
                onClick={() => choose(i)}
                onKeyDown={(e) => keys(e, i)}
                className={`flex min-h-[44px] items-center gap-2 rounded-full border px-4 text-[14px] font-medium tracking-[-0.01em] outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-[#7a3f17] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e3d7c3] motion-reduce:transition-none ${i === current ? "border-[#231c14] bg-[#231c14] text-[#f4ece0]" : "border-[#231c14]/30 bg-[#f4ece0]/30 text-[#231c14]/80 hover:border-[#231c14]/60 hover:text-[#231c14]"}`}
              >
                <span className="hidden text-[11px] tabular-nums opacity-70 sm:inline">{h.time}</span>
                {h.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
