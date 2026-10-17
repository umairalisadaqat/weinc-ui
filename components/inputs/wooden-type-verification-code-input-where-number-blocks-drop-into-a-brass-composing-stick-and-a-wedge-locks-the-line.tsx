import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent, ClipboardEvent } from "react";

// The code this demo accepts. Nothing is sent anywhere: the check happens on this page.
const DEMO_CODE = "472913";
const LENGTH = 6;
const EMAIL = "ines.calder@post.example";
const COPY = {
  eyebrow: "Two-step sign in",
  heading: "Set the six figures in the stick.",
  lede: `We sent a code to ${EMAIL}. Type it, paste it, or tap the stick to bring up the keypad.`,
  ready: "Type the six digits from the email.",
  accepted: "Line locked. Code accepted, you are signed in.",
  wrong: "Those figures do not match. Try the demo code below.",
};
// Motion, in seconds and scene units (one unit is about a centimetre of brass).
const DROP_FROM = 7.5; // how high a block starts its fall
const GRAVITY = 70;
const WEDGE_OUT = 11; // where the wedge waits, out of frame toward the camera
const DEMO_HOLD_MS = 5200; // how long the finished line is held before the demo plays again

const GOBO = [-5.0, -2.76]; // where the window's bars fall on the desk
const FLOOR = 1.45; // block centre height when it sits on the stick
const looseX = (i: number) => -4.8 + i * 1.745 + [0.03, -0.04, 0.05, -0.02, 0.04, -0.03][i];
const tightX = (i: number) => -4.84 + i * 1.72;

const VERT = `#version 300 es
in vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

// Pass one: ray-march the stick, the type and the desk. Alpha carries the blur size for pass two.
const SCENE = `#version 300 es
precision highp float;
uniform vec2 uRes; uniform float uTime;
uniform vec3 uPos, uFwd, uRight, uUp; uniform float uFocal, uShift, uFocus;
uniform vec4 uB[6]; // x, y, roll, digit (below zero: no block)
uniform vec4 uC[6]; // z, yaw, -, -
uniform float uWedge; uniform vec2 uGobo;
uniform sampler2D uAtlas;
out vec4 o;

const vec3 L = normalize(vec3(-0.72, 0.62, -0.32)); // toward the sun
const vec3 SUN = vec3(3.3, 2.55, 1.75);
const vec3 BMIN = vec3(-6.7, 0.0, -2.0), BMAX = vec3(6.7, 10.0, 12.0);

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ s += a * noise(p); p = p * 2.03 + 7.1; a *= 0.5; } return s; }

float sdBox(vec3 p, vec3 b, float r){ vec3 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r; }
vec2 boxHit(vec3 ro, vec3 rd, vec3 mn, vec3 mx){ vec3 inv = 1.0 / rd; vec3 t0 = (mn - ro) * inv, t1 = (mx - ro) * inv;
  vec3 a = min(t0, t1), b = max(t0, t1); return vec2(max(max(a.x, a.y), a.z), min(min(b.x, b.y), b.z)); }

vec3 rotB(vec3 v, int i){ float r = uB[i].z, y = uC[i].y; float c = cos(r), s = sin(r);
  v.xy = vec2(c * v.x + s * v.y, -s * v.x + c * v.y); c = cos(y); s = sin(y);
  v.xz = vec2(c * v.x + s * v.z, -s * v.x + c * v.z); return v; }
vec3 blockLocal(vec3 p, int i){ return rotB(p - vec3(uB[i].x, uB[i].y, uC[i].x), i); }
const vec3 BH = vec3(0.84, 1.15, 1.22);

vec2 map(vec3 p){
  float d = sdBox(p - vec3(0.0, 0.15, 0.05), vec3(6.05, 0.15, 1.6), 0.04);           // base plate
  d = min(d, sdBox(p - vec3(0.0, 1.02, -1.42), vec3(6.05, 0.74, 0.13), 0.035));      // back wall
  d = min(d, sdBox(p - vec3(-5.92, 0.98, 0.05), vec3(0.13, 0.7, 1.6), 0.035));       // fixed knee
  d = min(d, sdBox(p - vec3(5.92, 0.98, 0.05), vec3(0.13, 0.7, 1.6), 0.035));        // far knee
  vec2 r = vec2(d, 1.0);
  if (uWedge < 10.0){
    vec3 q = p - vec3(5.2, 1.12, uWedge);
    float hx = 0.47 + 0.05 * clamp(q.z / 1.4, -1.0, 1.0);
    float w = sdBox(vec3(q.x * 0.47 / hx, q.y, q.z), vec3(0.47, 0.82, 1.4), 0.08);
    if (w < r.x) r = vec2(w, 2.0);
  }
  for (int i = 0; i < 6; i++){
    if (uB[i].w < 0.0) continue;
    vec3 c = vec3(uB[i].x, uB[i].y, uC[i].x);
    if (length(p - c) - 1.9 > r.x) continue;
    float b = sdBox(blockLocal(p, i), BH, 0.06);
    if (b < r.x) r = vec2(b, 10.0 + float(i));
  }
  return r;
}

vec3 normalAt(vec3 p){ vec2 e = vec2(0.0015, 0.0);
  return normalize(vec3(map(p + e.xyy).x - map(p - e.xyy).x, map(p + e.yxy).x - map(p - e.yxy).x, map(p + e.yyx).x - map(p - e.yyx).x)); }

float shadow(vec3 ro, vec3 rd){
  vec2 b = boxHit(ro, rd, BMIN, BMAX); if (b.x > b.y || b.y < 0.0) return 1.0;
  float t = max(b.x, 0.02), res = 1.0;
  for (int i = 0; i < 40; i++){ float h = map(ro + rd * t).x; res = min(res, 9.0 * h / t); t += clamp(h, 0.025, 0.5); if (res < 0.003 || t > b.y) break; }
  res = clamp(res, 0.0, 1.0); return res * res * (3.0 - 2.0 * res);
}
float occl(vec3 p, vec3 n){ float s = 0.0, w = 1.0;
  for (int i = 1; i <= 4; i++){ float h = 0.06 * float(i * i); s += w * (h - map(p + n * h).x); w *= 0.6; } return clamp(1.0 - 1.6 * s, 0.0, 1.0); }

// The window: sun through four panes with glazing bars, and a little leaf shade moving in it.
float window(vec3 p){
  vec3 T1 = normalize(cross(L, vec3(0, 1, 0))), T2 = cross(T1, L);
  vec2 w = vec2(dot(p, T1), dot(p, T2)) - uGobo;
  float pen = 0.18 + 0.05 * p.y;
  vec2 g = abs(mod(w + vec2(5.0, 4.8), vec2(10.0, 9.6)) - vec2(5.0, 4.8));
  float bars = smoothstep(0.17, 0.17 + pen, g.x) * smoothstep(0.17, 0.17 + pen, g.y);
  vec2 f = abs(w - vec2(5.0, 4.8)) - vec2(9.5, 7.0);
  float frame = 1.0 - smoothstep(-1.2, 1.2, max(f.x, f.y));
  float leaf = smoothstep(0.38, 0.62, fbm(w * 0.32 + vec2(uTime * 0.035, uTime * 0.02)));
  return bars * frame * mix(1.0, 0.7, leaf * smoothstep(4.0, 12.0, w.x));
}

vec3 env(vec3 r, float rough){
  vec3 c = mix(vec3(0.016, 0.012, 0.009), vec3(0.075, 0.058, 0.044), smoothstep(-0.3, 0.9, r.y));
  c = mix(c, vec3(0.42, 0.24, 0.1), smoothstep(0.05, -0.25, r.y) * (1.0 - rough * 0.3));
  c += vec3(0.12, 0.08, 0.05) * smoothstep(-0.1, 0.4, r.y) * smoothstep(0.9, 0.2, r.y);
  c += vec3(0.16, 0.12, 0.085) * smoothstep(0.5, 1.0, r.y);
  vec3 Wd = normalize(L + vec3(0.0, 0.08, 0.0)); float a = dot(r, Wd);
  if (a > 0.0){ vec3 T1 = normalize(cross(Wd, vec3(0, 1, 0))), T2 = cross(T1, Wd);
    vec2 q = vec2(dot(r, T1), dot(r, T2)) / a; float s = 0.03 + rough * 0.5;
    float win = (1.0 - smoothstep(0.62 - s, 0.62 + s, abs(q.x))) * (1.0 - smoothstep(0.5 - s, 0.5 + s, abs(q.y)));
    win *= mix(1.0, smoothstep(0.02, 0.02 + s, abs(q.x)) * smoothstep(0.02, 0.02 + s, abs(q.y)), 0.8);
    c += win * vec3(5.0, 4.0, 2.9) * (1.0 - rough * 0.55); }
  return c;
}
float ggx(float ndh, float rough){ float a = rough * rough, a2 = a * a; float d = ndh * ndh * (a2 - 1.0) + 1.0; return a2 / (3.14159 * d * d); }

vec3 light(vec3 p, vec3 n, vec3 v, vec3 alb, float rough, vec3 F0, float metal, float ao, float sh, float envK){
  vec3 h = normalize(L + v); float ndl = max(dot(n, L), 0.0), ndv = max(dot(n, v), 0.001);
  vec3 F = F0 + (1.0 - F0) * pow(1.0 - ndv, 5.0);
  vec3 sun = SUN * sh * window(p);
  vec3 bounce = mix(vec3(0.05, 0.034, 0.022), vec3(0.09, 0.07, 0.052), n.y * 0.5 + 0.5);
  vec3 diff = alb * (1.0 - metal) * (sun * ndl + bounce * ao * 1.4);
  vec3 spec = sun * ndl * ggx(max(dot(n, h), 0.0), rough) * F * 0.25 + env(reflect(-v, n), rough) * F * ao * envK;
  return diff + spec;
}

// Long grain for the sides of a block, rings for its end-grain face.
vec3 woodSide(vec2 q, float seed){
  float g = fbm(vec2(q.x * 3.0 + seed, q.y * 0.35)); float lines = smoothstep(0.35, 0.95, fract(q.x * 9.0 + g * 3.0));
  vec3 base = mix(vec3(0.52, 0.31, 0.15), vec3(0.62, 0.40, 0.2), fbm(vec2(q.y * 0.6, q.x * 2.0 + seed)));
  return base * (1.0 - 0.18 * lines);
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / (0.5 * uRes.y);
  vec3 ro = uPos, rd = normalize(uFwd * uFocal + uRight * uv.x + uUp * (uv.y + uShift));
  float tD = rd.y < 0.0 ? -ro.y / rd.y : 1e4;
  vec2 bx = boxHit(ro, rd, BMIN, BMAX);
  float t = max(bx.x, 0.0), tEnd = min(bx.y, tD), id = -1.0;
  if (bx.x < bx.y && bx.y > 0.0){
    for (int i = 0; i < 110; i++){ vec2 h = map(ro + rd * t); if (h.x < 0.0012 * t){ id = h.y; break; } t += h.x; if (t > tEnd) break; }
  }
  vec3 v = -rd, col;
  float depth;
  if (id < 0.0){
    if (tD > 900.0){ o = vec4(0.02, 0.015, 0.01, 1.0); return; }
    // Oiled oak desk.
    t = tD; depth = t; vec3 p = ro + rd * t;
    vec2 g = vec2(p.x * 0.3, p.z * 4.2 + fbm(p.xz * vec2(0.2, 0.9)) * 3.0);
    float grain = fbm(g * vec2(1.0, 1.6)); float fig = smoothstep(0.45, 0.9, fract(g.y * 0.9 + grain * 1.7));
    vec3 alb = mix(vec3(0.24, 0.12, 0.05), vec3(0.36, 0.2, 0.09), grain) * (1.0 - 0.22 * fig);
    vec3 n = normalize(vec3(0.0, 1.0, 0.0) + vec3(0.0, 0.0, (fbm(g * vec2(1.0, 4.0)) - 0.5) * 0.04));
    float sh = 1.0, ao = 1.0;
    if (p.x > -9.0 && p.x < 10.0 && p.z > -4.0 && p.z < 7.0){ sh = shadow(p + n * 0.01, L);
      vec3 cq = abs(p - vec3(0.0, 0.0, 0.05)) - vec3(6.05, 0.0, 1.6); float dd = length(max(cq.xz, 0.0));
      ao = mix(0.35, 1.0, smoothstep(0.0, 0.9, dd)); }
    col = light(p, n, v, alb, 0.5 + 0.2 * grain, vec3(0.03), 0.0, ao, sh, 0.3);
  } else {
    vec3 p = ro + rd * t; depth = t; vec3 n = normalAt(p);
    float sh = shadow(p + n * 0.01, L), ao = occl(p, n);
    if (id < 1.5){
      // Brass, brushed along the length of the stick, with a little tarnish in the corners.
      float br = noise(vec2(p.x * 2.0, p.y * 38.0 + p.z * 38.0));
      vec3 nb = normalize(n + vec3(0.0, (br - 0.5) * 0.025, (br - 0.5) * 0.025));
      float tarn = smoothstep(0.55, 0.85, fbm(p.xz * 1.7 + p.y)) * (1.0 - ao * 0.6);
      vec3 F0 = mix(vec3(0.98, 0.74, 0.36), vec3(0.45, 0.32, 0.16), tarn * 0.7);
      // An engraved pica scale along the front edge of the stick.
      if (n.z > 0.7 && p.z > 1.55 && p.y > 0.04 && p.x > -5.8 && p.x < 5.8){
        float u = p.x * 2.4; float tick = 1.0 - smoothstep(0.03, 0.09, abs(fract(u) - 0.5));
        float len = mod(floor(u), 6.0) < 0.5 ? 0.42 : (mod(floor(u), 2.0) < 0.5 ? 0.26 : 0.16);
        tick *= step(0.27 - len * 0.5, p.y);
        nb = normalize(nb - vec3(tick * 0.5, 0.0, 0.0)); tarn = max(tarn, tick * 0.9);
        F0 *= 1.0 - tick * 0.6;
      }
      col = light(p, nb, v, vec3(0.0), 0.16 + 0.12 * br + 0.2 * tarn, F0, 1.0, ao, sh, 1.0);
    } else if (id < 2.5){
      // The wedge: dark walnut, oiled.
      vec3 q = p - vec3(5.2, 1.12, uWedge);
      vec3 alb = woodSide(vec2(q.z * 0.6 + q.x, q.y + q.z * 0.2), 9.0) * vec3(0.34, 0.27, 0.24);
      col = light(p, n, v, alb, 0.38, vec3(0.04), 0.0, ao, sh, 1.0);
    } else {
      int i = int(id - 10.0 + 0.5);
      vec3 q = blockLocal(p, i), ln = rotB(n, i);
      float seed = float(i) * 3.7;
      vec3 alb; float rough = 0.55; vec3 nn = n;
      if (ln.y > 0.6){
        // The printing face: end grain, a raised figure carrying old ink, and the counters cut lower.
        vec2 fuv = vec2(q.x / BH.x, q.z / BH.z) * 0.5 + 0.5;
        float dg = uB[i].w; vec2 auv = vec2((dg + clamp(fuv.x, 0.0, 1.0)) / 10.0, clamp(fuv.y, 0.0, 1.0));
        vec4 A = texture(uAtlas, auv);
        float e = 1.0 / 512.0;
        float hx = texture(uAtlas, auv + vec2(e * 0.4, 0.0)).r - texture(uAtlas, auv - vec2(e * 0.4, 0.0)).r;
        float hz = texture(uAtlas, auv + vec2(0.0, e)).r - texture(uAtlas, auv - vec2(0.0, e)).r;
        vec3 lnn = normalize(vec3(-hx * 7.0, 1.0, -hz * 7.0));
        float cx = cos(-uB[i].z), sx = sin(-uB[i].z), cy = cos(-uC[i].y), sy = sin(-uC[i].y);
        lnn.xz = vec2(cy * lnn.x + sy * lnn.z, -sy * lnn.x + cy * lnn.z);
        lnn.xy = vec2(cx * lnn.x + sx * lnn.y, -sx * lnn.x + cx * lnn.y);
        nn = normalize(lnn);
        float ring = smoothstep(0.3, 0.9, fract(length(q.xz - vec2(-2.0 + seed * 0.3, 3.1)) * 7.0 + fbm(q.xz * 3.0) * 1.5));
        vec3 endg = mix(vec3(0.6, 0.4, 0.21), vec3(0.5, 0.31, 0.16), ring);
        float stain = smoothstep(0.35, 0.8, fbm(q.xz * 2.4 + seed)) * 0.55 + 0.25 * A.r;
        vec3 face = mix(endg, vec3(0.13, 0.08, 0.05), stain) * mix(0.62, 1.0, 1.0 - A.r * (1.0 - A.g));
        vec3 ink = vec3(0.022, 0.02, 0.022) + vec3(0.03, 0.02, 0.012) * fbm(q.xz * 9.0);
        alb = mix(face, ink, A.g); rough = mix(0.62, 0.3, A.g);
        ao *= mix(0.7, 1.0, A.g + (1.0 - A.r));
      } else {
        vec2 sq = abs(ln.x) > 0.5 ? vec2(q.z, q.y) : vec2(q.x, q.y);
        alb = woodSide(sq, seed) * (0.9 + 0.2 * fract(seed * 0.618));
        float edge = smoothstep(0.7, 0.84, max(abs(q.x) / BH.x, abs(q.z) / BH.z));
        alb *= 1.0 - 0.25 * edge;
        float top = smoothstep(0.85, 1.12, q.y); alb = mix(alb, vec3(0.1, 0.06, 0.04), top * 0.7);
      }
      col = light(p, nn, v, alb, rough, vec3(0.04), 0.0, ao, sh, 1.0);
    }
  }
  // A little warm haze in the sunlit air.
  col += vec3(0.022, 0.016, 0.01) * smoothstep(0.0, 1.0, dot(rd, L) * 0.5 + 0.5);
  col *= 1.05;
  col = clamp((col * (2.51 * col + 0.03)) / (col * (2.43 * col + 0.59) + 0.14), 0.0, 1.0);
  col = pow(col, vec3(1.0 / 2.2));
  float coc = clamp(abs(depth - uFocus) / depth * 3.2 - 0.04, 0.0, 1.0);
  o = vec4(col, coc);
}`;

// Pass two: gather blur by distance from the focus plane, then grain and a soft vignette.
const POST = `#version 300 es
precision highp float;
uniform sampler2D uScene; uniform vec2 uRes; uniform float uMaxR, uTime;
out vec4 o;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec4 c0 = texture(uScene, uv);
  vec3 acc = c0.rgb; float wsum = 1.0;
  float r0 = c0.a * uMaxR;
  if (r0 > 0.6){
    for (int i = 1; i < 28; i++){
      float fi = float(i); float rr = sqrt(fi / 27.0) * r0; float a = fi * 2.39996;
      vec4 s = texture(uScene, uv + vec2(cos(a), sin(a)) * rr / uRes);
      float w = smoothstep(rr - 1.5, rr, s.a * uMaxR + 1.0);
      acc += s.rgb * w; wsum += w;
    }
  }
  vec3 col = acc / wsum;
  vec2 q = uv - 0.5; col *= 1.0 - 0.55 * dot(q * vec2(0.9, 1.1), q * vec2(0.9, 1.1));
  col += (hash(gl_FragCoord.xy + fract(uTime) * 91.0) - 0.5) * 0.03;
  o = vec4(col, 1.0);
}`;

type Block = { digit: number; y: number; vy: number; roll: number; vr: number; yaw: number; vyaw: number; x: number; vx: number; leaving: boolean; delay: number };
type Engine = { set: (code: string) => void; lock: () => void; reject: () => void; layout: () => { x: number; y: number }[] | null };

function buildAtlas(): HTMLCanvasElement {
  const CW = 256, CH = 372;
  const sharp = document.createElement("canvas"); sharp.width = CW * 10; sharp.height = CH;
  const g = sharp.getContext("2d")!;
  g.fillStyle = "#000"; g.fillRect(0, 0, sharp.width, sharp.height);
  g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "alphabetic";
  g.font = `800 ${Math.round(CH * 0.98)}px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  for (let d = 0; d < 10; d++){ g.save(); g.translate(CW * (d + 0.5), CH * 0.855); g.scale(0.84, 1); g.fillText(String(d), 0, 0); g.restore(); }
  // A soft copy for the shoulders of the raised figure: shrink then grow, which blurs in every browser.
  const half = document.createElement("canvas"); half.width = sharp.width / 2; half.height = Math.round(CH / 2);
  const hg = half.getContext("2d")!; hg.imageSmoothingEnabled = true; hg.imageSmoothingQuality = "high"; hg.drawImage(sharp, 0, 0, half.width, half.height);
  const small = document.createElement("canvas"); small.width = sharp.width / 5; small.height = Math.round(CH / 5);
  const sg = small.getContext("2d")!; sg.imageSmoothingEnabled = true; sg.imageSmoothingQuality = "high"; sg.drawImage(half, 0, 0, small.width, small.height);
  const soft = document.createElement("canvas"); soft.width = sharp.width; soft.height = CH;
  const fg = soft.getContext("2d")!; fg.imageSmoothingEnabled = true; fg.imageSmoothingQuality = "high"; fg.drawImage(small, 0, 0, soft.width, soft.height);
  const a = g.getImageData(0, 0, sharp.width, CH), b = fg.getImageData(0, 0, sharp.width, CH);
  for (let k = 0; k < a.data.length; k += 4){ const s = a.data[k]; a.data[k] = Math.max(b.data[k], s * 0.55); a.data[k + 1] = s; a.data[k + 2] = 0; a.data[k + 3] = 255; }
  g.putImageData(a, 0, 0);
  return sharp;
}

export default function WoodenTypeVerificationCodeInput() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const engine = useRef<Engine | null>(null);
  const demo = useRef({ on: true, timers: [] as number[] });
  const [code, setCode] = useState(DEMO_CODE);
  const [status, setStatus] = useState<"ready" | "accepted" | "wrong">("accepted");
  const [focused, setFocused] = useState(false);
  const [gl, setGl] = useState<"pending" | "on" | "off">("pending");
  const [slots, setSlots] = useState<{ x: number; y: number }[] | null>(null);

  // Scene and physics.
  useEffect(() => {
    const cv = canvas.current, box = wrap.current;
    if (!cv || !box) return;
    const ctx = cv.getContext("webgl2", { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: "high-performance" });
    if (!ctx) { setGl("off"); return; }
    const g = ctx;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const compile = (src: string, type: number) => { const s = g.createShader(type)!; g.shaderSource(s, src); g.compileShader(s); if (!g.getShaderParameter(s, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(s) || "shader"); return s; };
    const program = (fs: string) => { const p = g.createProgram()!; g.attachShader(p, compile(VERT, g.VERTEX_SHADER)); g.attachShader(p, compile(fs, g.FRAGMENT_SHADER)); g.bindAttribLocation(p, 0, "a"); g.linkProgram(p); if (!g.getProgramParameter(p, g.LINK_STATUS)) throw new Error(g.getProgramInfoLog(p) || "link"); return p; };
    let scene: WebGLProgram, post: WebGLProgram;
    try { scene = program(SCENE); post = program(POST); } catch (err) { console.warn(err); setGl("off"); return; }
    const vb = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, vb);
    g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
    g.enableVertexAttribArray(0); g.vertexAttribPointer(0, 2, g.FLOAT, false, 0, 0);

    const atlas = g.createTexture(); g.activeTexture(g.TEXTURE1); g.bindTexture(g.TEXTURE_2D, atlas);
    g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, buildAtlas());
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
    const target = g.createTexture(), fbo = g.createFramebuffer();
    const U = (p: WebGLProgram, n: string) => g.getUniformLocation(p, n);
    const su = Object.fromEntries(["uRes", "uTime", "uPos", "uFwd", "uRight", "uUp", "uFocal", "uShift", "uFocus", "uB", "uC", "uWedge", "uAtlas", "uGobo"].map((n) => [n, U(scene, n)]));
    const pu = Object.fromEntries(["uScene", "uRes", "uMaxR", "uTime"].map((n) => [n, U(post, n)]));

    let W = 0, H = 0, cssW = 1, cssH = 1, scale = 1;
    const resize = () => {
      const r = box.getBoundingClientRect(); cssW = Math.max(1, r.width); cssH = Math.max(1, r.height);
      let dpr = Math.min(window.devicePixelRatio || 1, 1.5) * scale;
      const cap = 1.35e6; if (cssW * cssH * dpr * dpr > cap) dpr = Math.sqrt(cap / (cssW * cssH));
      W = Math.round(cssW * dpr); H = Math.round(cssH * dpr); cv.width = W; cv.height = H;
      g.activeTexture(g.TEXTURE0); g.bindTexture(g.TEXTURE_2D, target);
      g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, W, H, 0, g.RGBA, g.UNSIGNED_BYTE, null);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
      g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE); g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE);
      g.bindFramebuffer(g.FRAMEBUFFER, fbo); g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, target, 0);
      g.bindFramebuffer(g.FRAMEBUFFER, null);
    };

    // The line of type and the wedge.
    const blocks: Block[] = Array.from({ length: LENGTH }, (_, i) => ({ digit: +DEMO_CODE[i], y: FLOOR, vy: 0, roll: 0, vr: 0, yaw: 0, vyaw: 0, x: tightX(i), vx: 0, leaving: false, delay: 0 }));
    const S = { wedge: 0, wv: 0, wedgeIn: true, shake: 0, tap: 0, tapV: 0, px: 0, py: 0, pxT: 0, pyT: 0 };
    const rnd = (k: number) => { const x = Math.sin(k * 91.7 + performance.now() * 0.001) * 43758.5; return x - Math.floor(x); };

    // Camera: framed so the whole stick fits with room to spare at any width.
    const cam = { pos: [0, 0, 0], fwd: [0, 0, 0], right: [0, 0, 0], up: [0, 0, 0], focal: 2.1, shift: 0, focus: 1 };
    const sub = (a: number[], b: number[]) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const norm = (a: number[]) => { const l = Math.hypot(a[0], a[1], a[2]); return [a[0] / l, a[1] / l, a[2] / l]; };
    const cross = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const aim = () => {
      const A = cssW / cssH, phone = cssW < 640;
      const dist = Math.max(phone ? 17 : 13.8, (7.4 * cam.focal) / (A * 0.86));
      const el = (phone ? 40 : 34) * Math.PI / 180, yaw = 0.07 + S.px * 0.05;
      const tgt = [0, 0.9 - S.tap * 0.05, 0.2];
      cam.pos = [tgt[0] + Math.sin(yaw) * Math.cos(el) * dist, tgt[1] + Math.sin(el + S.py * 0.03) * dist, tgt[2] + Math.cos(yaw) * Math.cos(el) * dist];
      cam.fwd = norm(sub(tgt, cam.pos)); cam.right = norm(cross(cam.fwd, [0, 1, 0])); cam.up = cross(cam.right, cam.fwd);
      cam.shift = phone ? 0.12 : 0.2; cam.focus = Math.hypot(...sub(cam.pos, [0, 2.5, -0.1]));
    };
    const project = (P: number[]) => { const v = sub(P, cam.pos); const z = dot(v, cam.fwd);
      const ux = (cam.focal * dot(v, cam.right)) / z, uy = (cam.focal * dot(v, cam.up)) / z - cam.shift;
      return { x: cssW / 2 + ux * cssH / 2, y: cssH / 2 - uy * cssH / 2 }; };

    const B = new Float32Array(24), C = new Float32Array(24);
    let time = 0;
    const draw = () => {
      aim();
      blocks.forEach((b, i) => { B.set([b.x, b.y, b.roll, b.digit], i * 4); C.set([-0.13, b.yaw, 0, 0], i * 4); });
      g.useProgram(scene); g.bindFramebuffer(g.FRAMEBUFFER, fbo); g.viewport(0, 0, W, H);
      g.uniform2f(su.uRes, W, H); g.uniform1f(su.uTime, time);
      g.uniform3fv(su.uPos, cam.pos); g.uniform3fv(su.uFwd, cam.fwd); g.uniform3fv(su.uRight, cam.right); g.uniform3fv(su.uUp, cam.up);
      g.uniform1f(su.uFocal, cam.focal); g.uniform1f(su.uShift, cam.shift); g.uniform1f(su.uFocus, cam.focus);
      g.uniform4fv(su.uB, B); g.uniform4fv(su.uC, C); g.uniform1f(su.uWedge, S.wedge); g.uniform2fv(su.uGobo, GOBO); g.uniform1i(su.uAtlas, 1);
      g.drawArrays(g.TRIANGLES, 0, 3);
      g.useProgram(post); g.bindFramebuffer(g.FRAMEBUFFER, null); g.viewport(0, 0, W, H);
      g.activeTexture(g.TEXTURE0); g.bindTexture(g.TEXTURE_2D, target);
      g.uniform1i(pu.uScene, 0); g.uniform2f(pu.uRes, W, H); g.uniform1f(pu.uMaxR, Math.min(14, H * 0.016)); g.uniform1f(pu.uTime, time);
      g.drawArrays(g.TRIANGLES, 0, 3);
    };

    const settle = () => {
      const tight = S.wedgeIn ? 1 : 0;
      S.wedge = S.wedgeIn ? 0 : WEDGE_OUT;
      blocks.forEach((b, i) => { if (b.leaving) { b.digit = -1; b.leaving = false; } b.y = FLOOR; b.vy = 0; b.roll = 0; b.vr = 0; b.yaw = 0; b.x = tight ? tightX(i) : looseX(i); });
    };

    const step = (dt: number) => {
      // Wedge on a stiff spring; the line closes up as its taper bites.
      const wt = S.wedgeIn ? 0 : WEDGE_OUT;
      const was = S.wedge;
      S.wv += ((S.wedgeIn ? 190 : 90) * (wt - S.wedge) - (S.wedgeIn ? 15 : 14) * S.wv) * dt; S.wedge += S.wv * dt;
      if (S.wedgeIn && S.wedge < -0.04) { S.wedge = -0.04; if (S.wv < -1.5) { S.tapV += 3.2; S.wv *= -0.18; } else S.wv = 0; }
      if (S.wedgeIn && was > 0.25 && S.wedge <= 0.25) blocks.forEach((b) => { if (b.digit >= 0) { b.vr += (rnd(b.x) - 0.5) * 0.8; } });
      const tight = Math.min(1, Math.max(0, 1 - S.wedge / 2.4));
      S.tapV += (-260 * S.tap - 16 * S.tapV) * dt; S.tap += S.tapV * dt;
      S.shake = Math.max(0, S.shake - dt * 1.6);
      S.px += (S.pxT - S.px) * Math.min(1, dt * 3); S.py += (S.pyT - S.py) * Math.min(1, dt * 3);
      blocks.forEach((b, i) => {
        if (b.digit < 0) return;
        if (b.delay > 0) { b.delay -= dt; return; }
        if (b.leaving) { b.vy += 34 * dt; b.y += b.vy * dt; b.vr += (0.6 - b.roll) * dt * 6; b.roll += b.vr * dt * 0.3; if (b.y > 10.5) { b.digit = -1; b.leaving = false; } return; }
        b.vy -= GRAVITY * dt; b.y += b.vy * dt;
        if (b.y < FLOOR) {
          b.y = FLOOR;
          if (b.vy < -4) { b.vr += (b.roll > 0 ? -1 : 1) * Math.min(4, -b.vy * 0.12) + (rnd(i) - 0.5) * 1.5; b.vyaw += (rnd(i + 3) - 0.5) * 1.2; b.vy = -b.vy * 0.18; S.tapV += 0.35; }
          else b.vy = 0;
        }
        const air = b.y > FLOOR + 0.05;
        b.vr += ((air ? 0 : -300) * b.roll - (air ? 0.5 : 18) * b.vr) * dt; b.roll += b.vr * dt;
        if (!air) b.roll = Math.max(-0.08, Math.min(0.08, b.roll));
        b.vyaw += ((air ? 0 : -220) * b.yaw - (air ? 0.4 : 16) * b.vyaw) * dt; b.yaw += b.vyaw * dt;
        const tx = looseX(i) + (tightX(i) - looseX(i)) * tight + Math.sin(time * 55 + i * 1.7) * 0.05 * S.shake;
        b.vx += (420 * (tx - b.x) - 30 * b.vx) * dt; b.x += b.vx * dt;
      });
    };

    let raf = 0, last = 0, seen = true, frames = 0, acc = 0, slow = 0;
    const loop = (now: number) => {
      raf = 0;
      const dt = Math.min(0.033, (now - (last || now)) / 1000); last = now; time += dt;
      for (let k = 0; k < 2; k++) step(dt / 2);
      draw();
      frames++; acc += dt; if (dt > 0.024) slow++;
      if (acc > 1) { cv.dataset.fps = (frames / acc).toFixed(1);
        if (slow > frames * 0.5 && scale > 0.55) { scale *= 0.85; resize(); }
        frames = 0; acc = 0; slow = 0; }
      if (seen && !document.hidden) raf = requestAnimationFrame(loop);
    };
    const wake = () => { if (reduce) { settle(); draw(); return; } if (!raf && seen && !document.hidden) { last = 0; raf = requestAnimationFrame(loop); } };

    engine.current = {
      set: (next) => {
        let leaveOrder = 0;
        for (let i = LENGTH - 1; i >= 0; i--) {
          const b = blocks[i], want = i < next.length ? +next[i] : -1;
          if (want < 0) { if (b.digit >= 0 && !b.leaving) { b.leaving = true; b.vy = 3; b.vr = 0; b.delay = leaveOrder++ * 0.07; } continue; }
          if (b.digit === want && !b.leaving) continue;
          b.digit = want; b.leaving = false; b.delay = 0; b.y = DROP_FROM; b.vy = -3; b.roll = (rnd(i) - 0.5) * 0.5; b.vr = (rnd(i + 1) - 0.5) * 2; b.yaw = (rnd(i + 2) - 0.5) * 0.3;
        }
        if (next.length < LENGTH) S.wedgeIn = false;
        wake();
      },
      lock: () => { S.wedgeIn = true; S.wv = -26; wake(); },
      reject: () => { S.shake = 1; blocks.forEach((b, i) => { b.vr += (i % 2 ? 1 : -1) * 2.5; }); wake(); },
      layout: () => { aim(); return [...blocks.map((_, i) => project([tightX(i), 2.6, -0.13])), project([-6.1, 2.7, -1.5]), project([6.1, 0, 1.7]), project([-6.1, 0, 1.7]), project([6.1, 2.7, -1.5])]; },
    };

    const onResize = () => { resize(); setSlots(engine.current?.layout() ?? null); if (reduce) draw(); else wake(); };
    const ro = new ResizeObserver(onResize); ro.observe(box);
    const onMove = (e: PointerEvent) => { const r = box.getBoundingClientRect(); S.pxT = ((e.clientX - r.left) / r.width - 0.5) * 2; S.pyT = ((e.clientY - r.top) / r.height - 0.5) * 2; };
    box.addEventListener("pointermove", onMove);
    const io = new IntersectionObserver(([en]) => { seen = en.isIntersecting; if (seen) wake(); });
    io.observe(cv);
    const onVis = () => { if (!document.hidden) wake(); };
    document.addEventListener("visibilitychange", onVis);
    resize(); setSlots(engine.current.layout()); draw(); setGl("on"); wake();
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); engine.current = null;
      box.removeEventListener("pointermove", onMove); document.removeEventListener("visibilitychange", onVis);
      g.deleteTexture(atlas); g.deleteTexture(target); g.deleteFramebuffer(fbo); g.deleteBuffer(vb); g.deleteProgram(scene); g.deleteProgram(post);
    };
  }, []);

  // Every change to the field is mirrored in type; a full line is checked here, on the page.
  const prev = useRef(DEMO_CODE);
  useEffect(() => {
    if (prev.current === code) return;
    prev.current = code;
    engine.current?.set(code);
    if (code.length < LENGTH) { setStatus("ready"); return; }
    if (code === DEMO_CODE) { const t = window.setTimeout(() => { engine.current?.lock(); setStatus("accepted"); }, 260); return () => window.clearTimeout(t); }
    engine.current?.reject(); setStatus("wrong");
    const t = window.setTimeout(() => setCode(""), 950);
    return () => window.clearTimeout(t);
  }, [code]);

  // The self-playing demo: hold the locked line, lift it out, set it again. Stops at the first touch.
  const stopDemo = useCallback(() => {
    if (!demo.current.on) return false;
    demo.current.on = false; demo.current.timers.forEach((t) => window.clearTimeout(t)); demo.current.timers = [];
    return true;
  }, []);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const d = demo.current;
    const later = (ms: number, fn: () => void) => { d.timers.push(window.setTimeout(() => { if (d.on) fn(); }, ms)); };
    const cycle = () => {
      later(DEMO_HOLD_MS, () => setCode(""));
      for (let k = 1; k <= LENGTH; k++) later(DEMO_HOLD_MS + 1500 + k * 300, () => setCode(DEMO_CODE.slice(0, k)));
      later(DEMO_HOLD_MS + 1500 + LENGTH * 300 + DEMO_HOLD_MS, () => { d.timers = []; cycle(); });
    };
    cycle();
    return () => { d.timers.forEach((t) => window.clearTimeout(t)); d.timers = []; };
  }, []);

  const take = (raw: string) => setCode(raw.replace(/\D/g, "").slice(0, LENGTH));
  const onChange = (e: ChangeEvent<HTMLInputElement>) => { stopDemo(); take(e.target.value); };
  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => { e.preventDefault(); stopDemo(); take(e.clipboardData.getData("text")); };
  const onFocus = () => { setFocused(true); if (stopDemo()) { setCode(""); } };
  const useDemo = () => { stopDemo(); setCode(""); window.setTimeout(() => { setCode(DEMO_CODE); input.current?.focus(); }, 380); };
  const clear = () => { stopDemo(); setCode(""); input.current?.focus(); };

  const message = status === "accepted" ? COPY.accepted : status === "wrong" ? COPY.wrong : COPY.ready;
  const hull = slots ? slots.slice(LENGTH) : null;
  const caret = slots && code.length < LENGTH ? slots[code.length] : null;
  const pad = hull ? (() => { const xs = hull.map((q) => q.x), ys = hull.map((q) => q.y); const l = Math.min(...xs) - 8, t = Math.min(...ys) - 10; return { left: l, top: t, width: Math.max(...xs) + 8 - l, height: Math.max(...ys) + 10 - t }; })() : null;

  return (
    <div ref={wrap} className="relative isolate min-h-[640px] w-full overflow-hidden bg-[#1a120b] sm:min-h-[720px]">
      <style>{`
        @keyframes wooden-type-otp-caret { 0%, 45% { opacity: 1 } 55%, 100% { opacity: 0.15 } }
        @media (prefers-reduced-motion: reduce) { .wooden-type-otp-caret { animation: none !important } }
      `}</style>
      <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${gl === "on" ? "opacity-100" : "opacity-0"}`} />

      {gl === "off" && (
        // Without WebGL: the same line of type drawn with CSS on the oak desk.
        <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(120%_80%_at_45%_70%,#6b4322_0%,#3a2312_45%,#1a120b_80%)]">
          <div className="absolute left-1/2 top-[64%] w-[min(92%,640px)] -translate-x-1/2 -translate-y-1/2 [perspective:900px]">
            <div className="rounded-md bg-[linear-gradient(180deg,#f2cf86,#b8862f_45%,#7a5418)] p-2 pt-3 shadow-[0_30px_40px_-12px_rgba(0,0,0,0.75)] [transform:rotateX(28deg)]">
              <div className="grid grid-cols-6 gap-1">
                {Array.from({ length: LENGTH }, (_, i) => (
                  <div key={i} className="flex aspect-[0.7] items-center justify-center rounded-[3px] bg-[linear-gradient(160deg,#a8743f,#7b4f27)] shadow-[inset_0_2px_0_rgba(255,226,170,0.35),inset_0_-3px_6px_rgba(0,0,0,0.35)]">
                    <span className="font-sans text-[clamp(28px,9vw,64px)] font-extrabold leading-none text-[#141010] [text-shadow:0_1px_0_rgba(255,220,160,0.35)]">{code[i] ?? ""}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-[#140d07]/80 to-transparent" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[34%] bg-gradient-to-t from-[#140d07]/85 to-transparent" />
      <div className="pointer-events-none relative z-10 mx-auto flex min-h-[640px] max-w-6xl flex-col justify-between px-5 py-8 sm:min-h-[720px] sm:px-10 sm:py-12">
        <div className="max-w-xl">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-[#e2b878]">{COPY.eyebrow}</p>
          <h2 className="mt-3 font-serif text-[34px] font-medium leading-[1.02] tracking-[-0.02em] text-[#f6ead6] [font-family:'Iowan_Old_Style','Palatino_Linotype',Palatino,'Book_Antiqua',Georgia,serif] sm:text-[52px]">{COPY.heading}</h2>
          <p id="wooden-type-otp-lede" className="mt-4 max-w-md text-[15px] leading-6 text-[#d9c6aa] [font-family:'Inter_Tight',Inter,ui-sans-serif,system-ui]">{COPY.lede}</p>
        </div>

        <div className="pointer-events-auto flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p role="status" aria-live="polite" className={`text-[15px] font-medium [font-family:'Inter_Tight',Inter,ui-sans-serif,system-ui] ${status === "accepted" ? "text-[#f3d08a]" : status === "wrong" ? "text-[#ffb59a]" : "text-[#f1e3cc]"}`}>{message}</p>
            <p id="wooden-type-otp-hint" className="mt-1 text-[13px] text-[#c9b18f] [font-family:'Inter_Tight',Inter,ui-sans-serif,system-ui]">
              Demo code <span className="font-mono tracking-[0.18em] text-[#f1e3cc]">{DEMO_CODE}</span>. Nothing leaves this page.
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={useDemo} className="h-11 rounded-full bg-[#f1dcb4] px-5 text-[14px] font-semibold text-[#2a1a0c] shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_8px_20px_-8px_rgba(0,0,0,0.7)] outline-none transition-colors hover:bg-[#f8e7c6] focus-visible:ring-2 focus-visible:ring-[#f3d08a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a120b] [font-family:'Inter_Tight',Inter,ui-sans-serif,system-ui]">Use demo code</button>
            <button type="button" onClick={clear} className="h-11 rounded-full border border-[#8a6a45] bg-[#1a120b]/60 px-5 text-[14px] font-semibold text-[#f1e3cc] outline-none transition-colors hover:bg-[#2a1d12] focus-visible:ring-2 focus-visible:ring-[#f3d08a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1a120b] [font-family:'Inter_Tight',Inter,ui-sans-serif,system-ui]">Clear</button>
          </div>
        </div>
      </div>

      {/* The real field: sized over the stick so a tap there opens the keypad. */}
      <label htmlFor="wooden-type-otp-field" className="sr-only">Six-digit verification code</label>
      <input
        id="wooden-type-otp-field"
        ref={input}
        value={code}
        onChange={onChange}
        onPaste={onPaste}
        onFocus={onFocus}
        onBlur={() => setFocused(false)}
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={LENGTH}
        aria-describedby="wooden-type-otp-lede wooden-type-otp-hint"
        style={pad ? { left: pad.left, top: pad.top, width: pad.width, height: pad.height } : undefined}
        className={`absolute z-20 cursor-text bg-transparent text-transparent caret-transparent outline-none selection:bg-transparent ${pad ? "" : "left-[8%] top-[48%] h-[150px] w-[84%]"}`}
      />
      {focused && pad && (
        <div aria-hidden="true" style={{ left: pad.left - 6, top: pad.top - 6, width: pad.width + 12, height: pad.height + 12 }} className="pointer-events-none absolute z-20 rounded-2xl ring-2 ring-[#f3d08a]/80" />
      )}
      {focused && caret && (
        <div aria-hidden="true" style={{ left: caret.x - 18, top: caret.y - 30 }} className="wooden-type-otp-caret pointer-events-none absolute z-20 h-[3px] w-9 rounded-full bg-[#f3d08a] shadow-[0_0_12px_rgba(243,208,138,0.7)] animate-[wooden-type-otp-caret_1s_steps(1)_infinite]" />
      )}
    </div>
  );
}
