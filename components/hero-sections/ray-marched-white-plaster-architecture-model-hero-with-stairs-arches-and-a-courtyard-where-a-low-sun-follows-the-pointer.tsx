import { useEffect, useRef, useState } from "react";

// Everything a visitor would edit first.
const brand = {
  name: "Halden & Ruse",
  trade: "Architects",
  eyebrow: "Houses, courtyards and quiet public rooms",
  headline: ["Rooms", "shaped by", "the sun."],
  accentWord: "sun.",
  line: "We draw every building around the light it will catch, then test it in plaster before a single wall goes up.",
  cta: "Start a project",
  second: "See the work",
  caption: "Casa do Pátio, study model 1:100, cast plaster",
};
// Colours in linear light (0 to 1), not screen values.
const PLASTER = [0.82, 0.79, 0.74]; // cast plaster, a touch warm
const CLAY = [0.5, 0.17, 0.08]; // the one terracotta element: the courtyard floor
const SUN = [1.0, 0.8, 0.58]; // colour of the low sun
const START = 0.8; // where the sun opens on its arc, 0 is early morning, 1 is evening
const SERIF = '"Canela", "Ogg", "GT Sectra", "Cormorant Garamond", "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, "Times New Roman", serif';
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';

const v3 = (c: number[]) => `vec3(${c.map((n) => n.toFixed(4)).join(", ")})`;

const VERT = `ATTR vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;
const TONE = `
vec3 tone(vec3 x){ vec3 c = 1.0 - exp(-max(x, 0.0) * 1.05); c = mix(c, c * c * (3.0 - 2.0 * c), 0.3); return pow(c, vec3(1.0 / 2.2)); }
`;

// A plaster plinth carrying an arcade, a wing wall with slot windows, a pergola of columns,
// a terracotta courtyard floor, and a stair climbing to a terrace in front of a tower with a deep niche.
const SCENE = `
precision highp float;
uniform vec2 uRes; uniform vec4 uJit; uniform float uSeed; uniform float uDirect;
uniform vec3 uCam; uniform vec3 uTgt; uniform float uFoc; uniform vec2 uShift; uniform float uFocus;
uniform vec3 uSun;
const float BT = 0.1;
const vec3 PLAS = ${v3(PLASTER)}; const vec3 CLAYC = ${v3(CLAY)}; const vec3 SUNC = ${v3(SUN)};
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float box(vec3 p, vec3 b, float r){ vec3 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r; }
// a round-headed opening in 2D: a rectangle of half width w from the floor to height h, capped by a half circle
float archHole(vec2 p, float w, float h){
  vec2 q = vec2(abs(p.x) - w, max(p.y - h, -p.y - 1.0) );
  float rect = length(max(vec2(abs(p.x) - w, abs(p.y - h * 0.5) - h * 0.5), 0.0)) + min(max(abs(p.x) - w, abs(p.y - h * 0.5) - h * 0.5), 0.0);
  float cap = length(p - vec2(0.0, h)) - w;
  return min(rect, cap) + 0.0 * q.x;
}
float plinth(vec3 p){ return box(p - vec3(0.0, BT * 0.5, 0.0), vec3(1.72, BT * 0.5, 1.18), 0.006); }
float arcade(vec3 p){
  vec3 q = p - vec3(-0.45, BT, 0.78);
  float wall = box(q - vec3(0.0, 0.47, 0.0), vec3(0.98, 0.47, 0.075), 0.007);
  float P = 0.36; float xr = q.x - P * clamp(floor(q.x / P + 0.5), -2.0, 2.0);
  float hole = max(archHole(vec2(xr, q.y), 0.105, 0.42), abs(q.z) - 0.2);
  return max(wall, -hole);
}
float wing(vec3 p){
  vec3 q = p - vec3(-1.36, BT, 0.06);
  float wall = box(q - vec3(0.0, 0.33, 0.0), vec3(0.075, 0.33, 0.795), 0.007);
  float P = 0.3; float zr = q.z - P * clamp(floor(q.z / P + 0.5), -2.0, 1.0);
  float slot = box(vec3(q.x, q.y - 0.3, zr), vec3(0.2, 0.2, 0.03), 0.0);
  return max(wall, -slot);
}
float pergola(vec3 p){
  vec3 q = p - vec3(-0.45, BT, -0.6);
  float P = 0.36; float xr = q.x - P * clamp(floor(q.x / P + 0.5), -2.0, 2.0);
  float col = max(length(vec2(xr, q.z)) - 0.034, abs(q.y - 0.27) - 0.27);
  float beam = box(q - vec3(0.0, 0.57, 0.0), vec3(0.86, 0.03, 0.05), 0.003);
  // thin rafters running back from the beam toward the arcade, a striped roof of shade
  float R = 0.12; float xs = q.x - R * clamp(floor(q.x / R + 0.5), -7.0, 7.0);
  float raft = box(vec3(xs, q.y - 0.615, q.z - 0.3), vec3(0.012, 0.015, 0.36), 0.002);
  return min(min(col, beam), raft);
}
float floorSlab(vec3 p){ return box(p - vec3(-0.45, BT + 0.006, 0.08), vec3(0.83, 0.006, 0.63), 0.002); }
float stairs(vec3 p){
  // eight steps climbing toward the tower terrace
  float d = 1e9;
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    float x0 = 0.36 + fi * 0.06;
    d = min(d, box(p - vec3((x0 + 0.86) * 0.5, BT + (fi + 1.0) * 0.025, -0.3), vec3((0.86 - x0) * 0.5, (fi + 1.0) * 0.025, 0.28), 0.0015));
  }
  return d;
}
float tower(vec3 p){
  float terrace = box(p - vec3(1.2, BT + 0.2, -0.3), vec3(0.36, 0.2, 0.3), 0.007);
  vec3 q = p - vec3(1.2, BT, 0.42);
  float t = box(q - vec3(0.0, 0.66, 0.0), vec3(0.36, 0.66, 0.42), 0.008);
  float niche = max(archHole(vec2(q.x, q.y - 0.4), 0.11, 0.5), abs(q.z + 0.42) - 0.16);
  // a slit high on the side facing the courtyard
  float slit = box(q - vec3(-0.36, 1.0, 0.1), vec3(0.05, 0.17, 0.02), 0.002);
  float parapet = box(q - vec3(0.0, 0.5, -0.71), vec3(0.36, 0.1, 0.012), 0.002);
  return min(min(max(t, -min(niche, slit)), terrace), parapet);
}
vec2 U(vec2 a, vec2 b){ return a.x < b.x ? a : b; }
vec2 mapId(vec3 p){
  vec2 r = vec2(plinth(p), 1.0);
  r = U(r, vec2(arcade(p), 2.0));
  r = U(r, vec2(wing(p), 2.0));
  r = U(r, vec2(pergola(p), 2.0));
  r = U(r, vec2(stairs(p), 2.0));
  r = U(r, vec2(tower(p), 2.0));
  r = U(r, vec2(floorSlab(p), 3.0));
  return r;
}
float map(vec3 p){
  float d = min(plinth(p), arcade(p));
  d = min(d, wing(p)); d = min(d, pergola(p)); d = min(d, floorSlab(p));
  if (p.x > 0.2) d = min(d, min(stairs(p), tower(p)));
  return d;
}
vec3 nrm(vec3 p){ vec2 e = vec2(0.0008, -0.0008); return normalize(e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) + e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx)); }

const vec3 BMIN = vec3(-1.76, 0.0, -1.22); const vec3 BMAX = vec3(1.76, 1.44, 1.22);
vec2 bound(vec3 ro, vec3 rd){
  vec3 inv = 1.0 / rd; vec3 a = (BMIN - ro) * inv; vec3 b = (BMAX - ro) * inv;
  vec3 lo = min(a, b); vec3 hi = max(a, b);
  return vec2(max(max(lo.x, lo.y), max(lo.z, 0.0)), min(hi.x, min(hi.y, hi.z)));
}
float march(vec3 ro, vec3 rd){
  vec2 tb = bound(ro, rd); if (tb.x > tb.y) return -1.0;
  float t = tb.x;
  for (int i = 0; i < 140; i++) { float d = map(ro + rd * t); if (d < 0.0004 * (1.0 + t * 0.1)) return t; t += d * 0.9; if (t > tb.y) break; }
  return -1.0;
}
// crisp, nearly hard sun shadows: the sun is small and far away
float shadow(vec3 p, vec3 l){
  vec2 tb = bound(p, l); if (tb.x > tb.y) return 1.0;
  float res = 1.0; float t = max(tb.x, 0.004); float ph = 1e9;
  for (int i = 0; i < 72; i++) {
    float h = map(p + l * t);
    float y = h * h / (2.0 * ph); float d = sqrt(max(h * h - y * y, 0.0));
    res = min(res, 60.0 * d / max(t - y, 1e-4)); ph = h;
    t += clamp(h, 0.004, 0.2); if (res < 0.001 || t > tb.y) break;
  }
  res = clamp(res, 0.0, 1.0); return res * res * (3.0 - 2.0 * res);
}
float occl(vec3 p, vec3 n){
  float o = 0.0; float w = 1.0;
  for (int i = 1; i <= 5; i++) { float h = 0.012 + 0.03 * float(i * i) * 0.5; o += (h - map(p + n * h)) * w; w *= 0.6; }
  return clamp(1.0 - 3.0 * o, 0.0, 1.0);
}

// The studio beyond the table, far out of focus: a warm white paper sweep, brighter where the sun rakes it.
vec3 env(vec3 rd){
  vec3 c = mix(vec3(0.78, 0.74, 0.68), vec3(0.96, 0.93, 0.88), smoothstep(-0.15, 0.35, rd.y));
  c *= 1.0 + 0.35 * pow(max(dot(rd, normalize(vec3(uSun.x, max(uSun.y, 0.1), uSun.z))), 0.0), 4.0) * SUNC;
  return c;
}

vec3 light(vec3 n, vec3 rd, vec3 alb, float sh, float ao, float spec, float shin, float wrap){
  float ndl = dot(n, uSun);
  float diff = max((ndl + wrap) / (1.0 + wrap), 0.0);
  vec3 sunL = SUNC * 4.2;
  // the sky fill is a little cooler than the sun, so shade reads grey-violet next to warm light
  vec3 sky = vec3(0.34, 0.35, 0.39) * (0.55 + 0.45 * n.y) * ao;
  vec3 bounce = vec3(0.6, 0.52, 0.44) * 0.22 * (0.5 - 0.5 * n.y) * ao;
  // light bounced off sunlit plaster walls into the shade
  vec3 fill = SUNC * 0.12 * ao * max(dot(n, -vec3(uSun.x, 0.0, uSun.z)), 0.0);
  vec3 col = alb * (sunL * diff * sh + sky + bounce + fill);
  vec3 hv = normalize(uSun - rd);
  col += sunL * sh * max(ndl, 0.0) * spec * pow(max(dot(n, hv), 0.0), shin) * (shin + 8.0) / 25.0;
  return col;
}

vec3 shadeHit(vec3 p, vec3 rd){
  float id = mapId(p).y;
  vec3 n = nrm(p);
  vec3 alb = PLAS; float spec = 0.015; float shin = 10.0; float wrap = 0.06;
  if (id < 2.5) {
    // cast plaster: chalky, with faint trowel drag, pinholes and a soft tide line from the mould
    vec2 uvp = abs(n.y) > 0.6 ? p.xz : abs(n.x) > 0.6 ? p.zy : p.xy;
    float f = n2(uvp * 70.0) * 0.5 + n2(uvp * 13.0) * 0.5;
    float pin = smoothstep(0.93, 0.98, h21(floor(uvp * 260.0)));
    alb = PLAS * (0.965 + 0.04 * f) * (1.0 - 0.14 * pin);
    n = normalize(n + 0.03 * vec3(n2(uvp * 160.0) - 0.5, n2(uvp * 160.0 + 4.0) - 0.5, n2(uvp * 160.0 + 9.0) - 0.5));
    if (id < 1.5 && p.y < BT - 0.004) alb *= 0.97;
  } else {
    // the terracotta floor: small fired tiles with pale grout
    vec2 g = (p.xz - vec2(-0.45, 0.08)) * 16.0;
    vec2 cell = floor(g); vec2 f = abs(fract(g) - 0.5);
    float grout = smoothstep(0.44, 0.47, max(f.x, f.y));
    float v = h21(cell);
    alb = CLAYC * (0.82 + 0.3 * v) * (0.92 + 0.12 * n2(p.xz * 90.0));
    alb = mix(alb, PLAS * 0.8, grout);
    spec = 0.05; shin = 30.0; wrap = 0.0;
  }
  float sh = shadow(p + n * 0.0045, uSun);
  float ao = occl(p, n);
  return light(n, rd, alb, sh, ao, spec, shin, wrap);
}

// The table: heavy pale paper on a board, so the model's long shadow lies across it like a sundial.
vec3 shadeTable(vec3 p, vec3 rd){
  vec2 g = p.xz;
  float fib = n2(g * vec2(40.0, 9.0)) * 0.5 + n2(g * 140.0) * 0.5;
  vec3 alb = vec3(0.74, 0.71, 0.66) * (0.96 + 0.06 * fib);
  vec3 n = vec3(0.0, 1.0, 0.0);
  float sh = shadow(p + n * 0.002, uSun);
  float d = plinth(p);
  float ao = 0.45 + 0.55 * smoothstep(0.0, 0.18, d);
  vec3 col = light(n, rd, alb, sh, ao, 0.0, 1.0, 0.0);
  float f = 0.02 + 0.98 * pow(1.0 - max(dot(-rd, n), 0.0), 5.0);
  col += env(reflect(rd, n)) * f * 0.25 * ao;
  return col;
}

void main(){
  vec2 fc = gl_FragCoord.xy + uJit.xy;
  vec2 uv = (fc - 0.5 * uRes) / uRes.y - uShift;
  vec3 fw = normalize(uTgt - uCam); vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)); vec3 up = cross(fw, rt);
  vec3 rd = normalize(fw * uFoc + rt * uv.x + up * uv.y);
  vec3 ro = uCam;
  vec3 fp = ro + rd * (uFocus / dot(rd, fw));
  ro += rt * uJit.z + up * uJit.w; rd = normalize(fp - ro);
  float t = march(ro, rd);
  vec3 col; float dist;
  if (t > 0.0) { col = shadeHit(ro + rd * t, rd); dist = t; }
  else if (rd.y < 0.0) { float tf = -ro.y / rd.y; dist = tf; col = shadeTable(ro + rd * tf, rd); }
  else { col = env(rd); dist = 60.0; }
  col = mix(col, env(rd), 1.0 - exp(-max(dist - 9.0, 0.0) * 0.12));
  col = min(col, vec3(10.0));
  if (uDirect > 0.5) col = tone(col);
  outC = vec4(col, 1.0);
}
`;

const POST = `
precision highp float;
uniform sampler2D uAcc; uniform vec2 uRes; uniform float uGrain; uniform vec2 uCentre;
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 c = texture2D(uAcc, uv).rgb;
  vec2 q = (uv - uCentre) * vec2(uRes.x / uRes.y, 1.0);
  c *= 1.0 - 0.12 * smoothstep(0.5, 1.4, length(q));
  c = tone(c);
  c += (h21(gl_FragCoord.xy + uGrain * 91.7) - 0.5) * 0.016;
  outC = vec4(c, 1.0);
}
`;

// No WebGL: the same model drawn as flat planes of plaster in its late light, with its long shadow.
function Still() {
  return (
    <div aria-hidden="true" className="absolute bottom-[6%] right-[3%] aspect-[16/11] w-[94%] max-w-[780px] lg:bottom-[10%] lg:w-[56%]">
      <div className="absolute bottom-[4%] left-[-6%] h-[30%] w-[80%] -skew-x-[38deg] bg-[#b9b0a4]/45 blur-[2px]" />
      <div className="absolute inset-x-[6%] bottom-[10%] h-[34%] [transform:perspective(900px)_rotateX(60deg)]" style={{ background: "linear-gradient(180deg,#ece6dc,#d9d1c4)", boxShadow: "0 14px 0 -2px #cfc6b8, 0 26px 40px rgba(60,40,20,0.18)" }} />
      <div className="absolute bottom-[26%] left-[18%] h-[12%] w-[44%] [transform:perspective(900px)_rotateX(60deg)] bg-[#9a4a2c]" />
      <div className="absolute bottom-[30%] left-[12%] flex h-[34%] w-[50%] items-end justify-around bg-[#efe9df] px-[3%]" style={{ boxShadow: "inset -30px 0 40px -20px rgba(120,100,80,0.25)" }}>
        {[0, 1, 2, 3, 4].map((i) => <div key={i} className="h-[72%] w-[11%] rounded-t-full bg-[#c9bfb1]" style={{ boxShadow: "inset 6px 0 0 #b3a897" }} />)}
      </div>
      <div className="absolute bottom-[30%] left-[66%] h-[62%] w-[20%] bg-[#f3eee6]" style={{ boxShadow: "inset -18px 0 0 #d6cdbf" }}>
        <div className="absolute bottom-[34%] left-[32%] h-[36%] w-[30%] rounded-t-full bg-[#cfc5b6]" />
      </div>
      <div className="absolute bottom-[30%] left-[58%] h-[16%] w-[10%]" style={{ background: "repeating-linear-gradient(180deg,#f1ebe2 0 12%,#d4cbbd 12% 16%)" }} />
    </div>
  );
}

export default function PlasterArchitectureModelHero() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [shown, setShown] = useState<"wait" | "gl" | "still">("wait");
  const [sun, setSun] = useState(Math.round(START * 100));
  const sunRef = useRef(START);
  const touched = useRef(false);

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
    const still = reduce || software;

    const head = gl2 ? "#version 300 es\n#define ATTR in\n" : "#define ATTR attribute\n";
    const fhead = gl2 ? "#version 300 es\n#define texture2D texture\nprecision highp float;\nout vec4 outC;\n" : "#define outC gl_FragColor\n";
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(sh)); return null; }
      return sh;
    };
    const link = (frag: string) => {
      const v = compile(gl.VERTEX_SHADER, head + VERT), f = compile(gl.FRAGMENT_SHADER, fhead + frag);
      const p = gl.createProgram();
      if (!v || !f || !p) return null;
      gl.attachShader(p, v); gl.attachShader(p, f); gl.bindAttribLocation(p, 0, "aPos"); gl.linkProgram(p);
      return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
    };
    const scene = link(SCENE), post = canAcc ? link(POST) : null;
    if (!scene || (canAcc && !post)) { setShown("still"); return; }
    const U = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);
    const su = Object.fromEntries(["uRes", "uJit", "uSeed", "uDirect", "uCam", "uTgt", "uFoc", "uShift", "uFocus", "uSun"].map((n) => [n, U(scene, n)]));
    const pu = post ? Object.fromEntries(["uAcc", "uRes", "uGrain", "uCentre"].map((n) => [n, U(post, n)])) : {};

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // The accumulation plate: every frame is one more exposure blended onto it.
    const acc = canAcc ? gl.createTexture() : null;
    const fbo = canAcc ? gl.createFramebuffer() : null;
    let W = 0, H = 0, scale = 1, cssW = 1, cssH = 1;
    const s = {
      sun: START, px: 0, sx: 0, py: 0, sy: 0, hover: false, count: 0, fresh: true, frame: 0, slow: 0,
      visible: true, raf: 0, last: 0, t0: 0, alive: true, first: true, fps: 0, fpsN: 0, fpsT: 0,
    };
    const size = () => {
      const r = box.getBoundingClientRect();
      cssW = Math.max(1, r.width); cssH = Math.max(1, r.height);
      const dpr = Math.min(software ? 1 : 1.5, window.devicePixelRatio || 1) * scale;
      // never more than about 1.3 million pixels of tracing
      const k = Math.min(1, Math.sqrt(1.3e6 / (cssW * cssH * dpr * dpr)));
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

    const draw = (alpha: number, sample: number, time: number) => {
      const wide = cssW >= 900, aspect = cssW / cssH;
      // the camera breathes a little, like a photographer shifting their weight
      const drift = still ? 0 : time;
      const az = -0.62 + Math.sin(drift * 0.09) * 0.05 + s.sx * 0.04;
      const el = 0.56 + Math.sin(drift * 0.07 + 1.0) * 0.015 - s.sy * 0.02;
      const dist = 7.4;
      const tgt = [0.05, 0.42, 0.1];
      const cam = [tgt[0] + dist * Math.sin(az) * Math.cos(el), tgt[1] + dist * Math.sin(el), tgt[2] - dist * Math.cos(az) * Math.cos(el)];
      const foc = wide ? 1.42 : Math.max(0.56, Math.min(1.42, aspect * 1.38));
      const shift = wide ? [0.2 * aspect, -0.01] : [0, -0.27];
      const jx = sample ? halton(sample, 2) - 0.5 : 0, jy = sample ? halton(sample, 3) - 0.5 : 0;
      const la = halton(sample, 5) * Math.PI * 2, lr = sample ? Math.sqrt(halton(sample, 7)) * 0.07 : 0;
      gl.useProgram(scene);
      gl.bindFramebuffer(gl.FRAMEBUFFER, canAcc ? fbo : null);
      gl.viewport(0, 0, W, H);
      if (canAcc && alpha < 1) { gl.enable(gl.BLEND); gl.blendColor(0, 0, 0, alpha); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA); } else gl.disable(gl.BLEND);
      gl.uniform2f(su.uRes, W, H);
      gl.uniform4f(su.uJit, canAcc ? jx : 0, canAcc ? jy : 0, canAcc ? Math.cos(la) * lr : 0, canAcc ? Math.sin(la) * lr : 0);
      gl.uniform1f(su.uSeed, canAcc && sample ? (sample * 0.61803) % 1 || 0.5 : 0);
      gl.uniform1f(su.uDirect, canAcc ? 0 : 1);
      gl.uniform3f(su.uCam, cam[0], cam[1], cam[2]); gl.uniform3f(su.uTgt, tgt[0], tgt[1], tgt[2]);
      gl.uniform1f(su.uFoc, foc);
      gl.uniform2f(su.uShift, shift[0], shift[1]);
      gl.uniform1f(su.uFocus, dist);
      const d = sunDir(s.sun);
      gl.uniform3f(su.uSun, d[0], d[1], d[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (canAcc && post) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.disable(gl.BLEND);
        gl.useProgram(post);
        gl.uniform1i(pu.uAcc, 1); gl.uniform2f(pu.uRes, W, H);
        gl.uniform1f(pu.uGrain, still ? 1 : s.frame % 64);
        gl.uniform2f(pu.uCentre, wide ? 0.66 : 0.5, 0.42);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };

    const frame = (now: number) => {
      s.raf = 0;
      if (!s.visible || !s.alive) return;
      const dtRaw = s.last ? (now - s.last) / 1000 : 0.016;
      const dt = Math.min(0.05, dtRaw);
      s.last = now; s.frame++;
      if (!s.t0) s.t0 = now;
      const t = (now - s.t0) / 1000;
      // the sun follows the pointer; left alone, it holds for a moment and then swings slowly like a day passing
      let want = sunRef.current;
      if (s.hover) want = 0.5 + s.px * 0.5;
      else if (!touched.current && !still && t > 3.2) want = START - 0.26 * Math.sin((t - 3.2) * 0.22);
      want = Math.max(0, Math.min(1, want));
      const before = s.sun;
      if (still) s.sun = want; else s.sun += (want - s.sun) * (1 - Math.exp(-dt * 2.4));
      s.sx += (s.px - s.sx) * (1 - Math.exp(-dt * 2)); s.sy += (s.py - s.sy) * (1 - Math.exp(-dt * 2));
      const sunMoved = Math.abs(s.sun - before) > 0.0003;
      if (still && sunMoved) { s.count = 0; s.fresh = true; }
      const moving = !still;
      if (s.fresh || !canAcc) { draw(1, 0, t); s.fresh = false; s.count = 1; }
      else if (moving) { draw(sunMoved ? 0.4 : 0.22, 1 + (s.frame % 64), t); s.count = 6; }
      else if (s.count < 32) { s.count++; draw(1 / s.count, s.count, t); }
      if (s.first) { s.first = false; setShown("gl"); }
      readout.current?.(s.sun);

      // measured, not guessed: frame rate is kept on the canvas, and long frames cost resolution
      s.fpsN++; if (now - s.fpsT > 1000) { s.fps = Math.round((s.fpsN * 1000) / (now - s.fpsT)); s.fpsN = 0; s.fpsT = now; cv.dataset.fps = String(s.fps); }
      if (!still && dtRaw > 0.024) s.slow++; else s.slow = Math.max(0, s.slow - 2);
      if (s.slow > 40 && scale > 0.45) { scale *= 0.82; s.slow = 0; size(); }

      if (moving || s.count < 32) s.raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!s.raf && s.visible && s.alive) { s.last = 0; s.raf = requestAnimationFrame(frame); } };
    (box as HTMLDivElement & { wake?: () => void }).wake = wake;

    size();
    const ro = new ResizeObserver(() => { size(); wake(); });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting && !document.hidden; if (s.visible) wake(); }, { threshold: 0.02 });
    io.observe(box);
    const vis = () => { s.visible = !document.hidden; if (s.visible) wake(); };
    document.addEventListener("visibilitychange", vis);
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const r = box.getBoundingClientRect();
      s.px = ((e.clientX - r.left) / r.width) * 2 - 1; s.py = ((e.clientY - r.top) / r.height) * 2 - 1;
      s.hover = true; touched.current = true;
      // keep the slider thumb under the same sun the pointer is setting
      const v = Math.round(Math.max(0, Math.min(1, 0.5 + s.px * 0.5)) * 100);
      setSun((old) => (old === v ? old : v));
      wake();
    };
    const leave = () => {
      // the sun stays where the visitor left it
      if (s.hover) { sunRef.current = Math.max(0, Math.min(1, 0.5 + s.px * 0.5)); setSun(Math.round(sunRef.current * 100)); }
      s.hover = false; s.px = 0; s.py = 0; wake();
    };
    box.addEventListener("pointermove", move);
    box.addEventListener("pointerleave", leave);
    const lost = (e: Event) => { e.preventDefault(); setShown("still"); };
    cv.addEventListener("webglcontextlost", lost);
    wake();

    return () => {
      s.alive = false;
      cancelAnimationFrame(s.raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      box.removeEventListener("pointermove", move); box.removeEventListener("pointerleave", leave);
      cv.removeEventListener("webglcontextlost", lost);
    };
  }, []);

  // the little sundial readout under the model, written straight to the DOM so it does not re-render React each frame
  const timeEl = useRef<HTMLSpanElement>(null);
  const readout = useRef<((k: number) => void) | null>(null);
  readout.current = (k: number) => { if (timeEl.current) timeEl.current.textContent = clock(k); };

  const onSun = (v: number) => {
    setSun(v);
    sunRef.current = v / 100;
    touched.current = true;
    (stage.current as (HTMLDivElement & { wake?: () => void }) | null)?.wake?.();
  };

  return (
    <section className="relative isolate overflow-hidden bg-[#ece7df] text-[#211b16]" style={{ fontFamily: FONT }}>
      <style>{`
        @keyframes plaster-model-hero-rise { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: none; } }
        .plaster-model-hero-rise { animation: plaster-model-hero-rise 900ms cubic-bezier(0.2, 0.9, 0.2, 1) both; }
        .plaster-model-hero-range { -webkit-appearance: none; appearance: none; background: transparent; }
        .plaster-model-hero-range::-webkit-slider-runnable-track { height: 2px; background: #211b16; opacity: 0.55; }
        .plaster-model-hero-range::-moz-range-track { height: 2px; background: rgba(33,27,22,0.55); }
        .plaster-model-hero-range::-webkit-slider-thumb { -webkit-appearance: none; margin-top: -8px; height: 18px; width: 18px; border-radius: 9999px; background: #a5432a; box-shadow: 0 0 0 4px #ece7df; }
        .plaster-model-hero-range::-moz-range-thumb { border: 0; height: 18px; width: 18px; border-radius: 9999px; background: #a5432a; box-shadow: 0 0 0 4px #ece7df; }
        @media (prefers-reduced-motion: reduce) { .plaster-model-hero-rise { animation: none; } }
      `}</style>
      <div ref={stage} className="relative mx-auto h-[900px] w-full max-w-[1600px] lg:h-[780px]" style={{ background: "linear-gradient(180deg, #efebe4 0%, #e8e2d8 60%, #d8d0c4 100%)" }}>
        {shown === "still" && <Still />}
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${shown === "gl" ? "opacity-100" : "opacity-0"}`} />

        <div className="pointer-events-none relative flex h-full flex-col px-6 pb-8 pt-7 sm:px-10 lg:px-16 lg:pb-12 lg:pt-10">
          <p className="flex items-baseline gap-2 text-[15px] tracking-[-0.01em]">
            <span className="text-[22px] italic leading-none" style={{ fontFamily: SERIF }}>{brand.name}</span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#5c5148]">{brand.trade}</span>
          </p>
          <div className="plaster-model-hero-rise mt-10 max-w-[36rem] lg:mt-[64px]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[#5c5148]">{brand.eyebrow}</p>
            <h1 className="mt-4 text-[64px] font-normal leading-[0.86] tracking-[-0.035em] text-[#1b1612] sm:text-[88px] lg:text-[118px]" style={{ fontFamily: SERIF, fontFeatureSettings: '"kern", "liga", "dlig"' }}>
              {brand.headline.map((l) => (
                <span key={l} className="block">
                  {l.endsWith(brand.accentWord) ? <>{l.slice(0, -brand.accentWord.length)}<em className="italic text-[#a5432a]">{brand.accentWord.replace(".", "")}</em>.</> : l}
                </span>
              ))}
            </h1>
            <p className="mt-6 max-w-[25rem] text-[17px] leading-[1.55] text-[#3d342d] lg:mt-8">{brand.line}</p>
            <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-3">
              <a href="#" className="pointer-events-auto inline-flex h-[52px] items-center gap-3 rounded-full bg-[#a5432a] pl-7 pr-6 text-[15px] font-semibold text-[#fbf3ea] shadow-[0_1px_0_rgba(255,255,255,0.22)_inset,0_16px_30px_-14px_rgba(120,40,15,0.75)] outline-none transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#a5432a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ece7df] motion-reduce:transition-none">
                {brand.cta}
                <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h12M11 5l5 5-5 5" /></svg>
              </a>
              <a href="#" className="pointer-events-auto inline-flex h-11 items-center text-[15px] font-semibold text-[#211b16] underline decoration-[#211b16]/30 decoration-1 underline-offset-[7px] outline-none hover:decoration-[#211b16] focus-visible:ring-2 focus-visible:ring-[#211b16] focus-visible:ring-offset-2 focus-visible:ring-offset-[#ece7df]">{brand.second}</a>
            </div>
          </div>
          <div className="mt-auto flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="pointer-events-auto flex w-full max-w-[19rem] items-center gap-4">
              <label htmlFor="plaster-model-hero-sun" className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5c5148]">Sun</label>
              <input id="plaster-model-hero-sun" type="range" min={0} max={100} value={sun} onChange={(e) => onSun(Number(e.target.value))} aria-valuetext={`Sun at about ${clock(sun / 100)}`} className="plaster-model-hero-range h-9 w-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#a5432a] focus-visible:ring-offset-4 focus-visible:ring-offset-[#ece7df]" />
              <span ref={timeEl} className="w-[3.4rem] shrink-0 text-right text-[13px] font-medium tabular-nums text-[#3d342d]">{clock(sun / 100)}</span>
            </div>
            <p className="text-[12px] text-[#5c5148] lg:text-right"><span className="italic" style={{ fontFamily: SERIF }}>{brand.caption}</span></p>
          </div>
        </div>
      </div>
    </section>
  );
}

// 0 is seven in the morning with the sun low on the left of the picture, 1 is seven in the evening low on the right and behind
function sunDir(k: number) {
  const sa = -1.35 - 2.25 * k;
  const se = 0.17 + 0.13 * Math.sin(Math.PI * Math.min(1, Math.max(0, k)));
  return [Math.sin(sa) * Math.cos(se), Math.sin(se), Math.cos(sa) * Math.cos(se)];
}
function clock(k: number) {
  const m = Math.round((7 + Math.min(1, Math.max(0, k)) * 12) * 60);
  const h = Math.floor(m / 60), mm = Math.floor((m % 60) / 5) * 5;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
