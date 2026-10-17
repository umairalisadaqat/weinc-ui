import { useEffect, useRef, useState } from "react";

// What the loader says while it works. `until` is the last percent that line covers.
const stages = [
  { until: 12, note: "Centring the clay" },
  { until: 30, note: "Opening the ball" },
  { until: 58, note: "Pulling up the walls" },
  { until: 84, note: "Easing out the curve" },
  { until: 99, note: "Smoothing the rim" },
  { until: 100, note: "Done. The wheel is stopping" },
];
// The self-running demo after the first bowl: [percent to reach, seconds to get there]. A repeated percent is a pause.
// To show real progress, delete the demo block in the frame loop and write your own number to `s.goal`.
const demo: [number, number][] = [
  [16, 2.0], [16, 0.5], [38, 2.2], [52, 1.6], [52, 0.5], [73, 2.0], [88, 1.6], [100, 1.8],
];
const START = 93; // the percent it opens on: a tall wet bowl, already nearly thrown
const FIRST = 100; // the first run finishes the bowl so the opening seconds show it done
const HOLD = 3.4; // seconds the finished bowl sits on the stopped wheel before the next ball
const CLAY = [0.29, 0.17, 0.11]; // the dry body colour of the stoneware, linear RGB
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';

// The bowl for a progress fraction p from 0 to 1: a ball of clay that opens, then rises and flares.
const shape = (p: number) => {
  const q = Math.max(0, Math.min(1, p));
  const open = q < 0.22 ? (q / 0.22) * (q / 0.22) * (3 - (2 * q) / 0.22) : 1;
  const pull = Math.max(0, Math.min(1, (q - 0.16) / 0.84));
  const ease = 1 - Math.pow(1 - pull, 1.6);
  return {
    H: 0.32 + (0.13 - 0.32) * open + 0.5 * ease, // height of the wall
    rf: 0.46 - 0.14 * ease, // radius where it meets the wheel
    rr: 0.48 + 0.34 * ease, // radius of the rim
    w: (0.15 + (0.042 - 0.15) * ease) * open, // wall thickness
    open,
  };
};

const VERT = `ATTR vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;
const TONE = `
vec3 tone(vec3 x){ x *= 0.9; vec3 a = x * (2.51 * x + 0.03); vec3 b = x * (2.43 * x + 0.59) + 0.14; return pow(clamp(a / b, 0.0, 1.0), vec3(1.0 / 2.2)); }
`;

// The photograph. A potter's wheel stands on a concrete floor in a studio; the sun comes in through a
// window out of frame on the left. The wheel, its pan and the clay are ray marched as solids of revolution.
const SCENE = `
precision highp float;
uniform vec2 uRes; uniform vec4 uJit; uniform vec3 uCam; uniform vec3 uTgt; uniform float uFoc; uniform vec2 uShift; uniform float uFocus;
uniform vec4 uShape; uniform float uOpen; uniform float uSpin; uniform float uWet; uniform float uTime; uniform float uDirect; uniform vec3 uClay;
const float HT = 0.565;      // top of the wheel head
const float WZ = 2.7;        // the wall behind the wheel
const float WX = -5.2;       // the window in the left wall
const vec3 SUN = vec3(-0.70, 0.62, -0.36);
const vec3 SUNC = vec3(1.0, 0.85, 0.66) * 3.3;
const vec3 SKY = vec3(0.62, 0.72, 0.9);
const vec3 BC = vec3(0.0, 0.42, 0.0); // centre of the bounding sphere
${TONE}
float h31(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ return 0.5 * n2(p) + 0.25 * n2(p * 2.03 + 7.1) + 0.125 * n2(p * 4.01 + 3.3) + 0.0625 * n2(p * 8.1 + 1.7); }
float rcyl(vec2 q, float r, float h, float rr){ vec2 d = vec2(q.x - r + rr, abs(q.y) - h + rr); return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - rr; }
float seg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }
float smax(float a, float b, float k){ float h = clamp(0.5 - 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) + k * h * (1.0 - h); }
float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }

// ---- the clay ------------------------------------------------------------------------------------
// outer radius at height y: a squat dome while it is a ball, a flaring bowl once it is opened
float clayR(float y){
  float H = uShape.x; float t = clamp(y / H, 0.0, 1.0);
  float dome = uShape.y * sqrt(max(1.0 - t * t, 0.0) + 0.0004) * (1.0 + 0.08 * t);
  float bowl = uShape.y + (uShape.z - uShape.y) * pow(sin(t * 1.5708), 0.72) + 0.03 * sin(t * 3.14159) * uOpen;
  // throwing lines: the rings the fingers leave as they climb
  float rings = sin(y * 92.0 + 1.7 * sin(y * 23.0)) * (0.6 + 0.4 * sin(y * 31.0 + 2.0));
  return mix(dome, bowl, uOpen) + 0.0022 * rings * uOpen * smoothstep(0.03, 0.12, y) * smoothstep(H, H - 0.08, y);
}
float clayD(vec3 q){
  float rho = length(q.xz); float y = q.y - HT; float H = uShape.x; float w = uShape.w;
  float R = clayR(y);
  float d = max((rho - R) * mix(0.32, 0.62, uOpen), max(-y, y - H));
  if (uOpen > 0.02) {
    float b = mix(H + 0.06, 0.075, uOpen);
    float Ri = R - w + 0.003 * sin(y * 88.0 + 1.3);
    float cav = smax((rho - Ri) * 0.62, b - y, 0.05);
    d = max(d, -cav);
    // a rounded rim, a little proud of the wall
    float br = min(w * 0.5, 0.026);
    vec2 rc = vec2(clayR(H) - w * 0.5, H - br * 0.6);
    d = smin(d, length(vec2(rho, y) - rc) - br, 0.012);
  }
  // a skirt of slurry where the clay meets the wheel
  d = smin(d, rcyl(vec2(rho, y - 0.004), uShape.y + 0.05, 0.006, 0.005), 0.03);
  return d;
}

// ---- the wheel -----------------------------------------------------------------------------------
float headD(vec3 q){ float rho = length(q.xz); return rcyl(vec2(rho, q.y - 0.53), 0.8, 0.035, 0.012); }
float panD(vec3 q){
  vec2 r = vec2(length(q.xz), q.y);
  float d = min(seg(r, vec2(0.25, 0.44), vec2(1.2, 0.44)), seg(r, vec2(1.2, 0.44), vec2(1.36, 0.67))) - 0.016;
  return min(d, length(r - vec2(1.365, 0.675)) - 0.026);
}
float bodyD(vec3 q){
  vec2 r = vec2(length(q.xz), q.y);
  float d = rcyl(r - vec2(0.0, 0.215), 1.0, 0.205, 0.07);
  return min(d, rcyl(r - vec2(0.0, 0.47), 0.16, 0.06, 0.01));
}
vec2 objMap(vec3 q){
  vec2 m = vec2(bodyD(q), 1.0);
  float p = panD(q); if (p < m.x) m = vec2(p, 2.0);
  float h = headD(q); if (h < m.x) m = vec2(h, 3.0);
  float c = clayD(q); if (c < m.x) m = vec2(c, 4.0);
  return m;
}
float sceneD(vec3 q){ return min(min(bodyD(q), panD(q)), min(headD(q), clayD(q))); }

// ---- the window the sun comes through --------------------------------------------------------
float pane(vec2 w, float soft){
  float inside = smoothstep(-soft, soft, w.x - 0.25) * smoothstep(-soft, soft, 6.6 - w.x) * smoothstep(-soft, soft, w.y + 9.0) * smoothstep(-soft, soft, 3.4 - w.y);
  vec2 c = vec2((w.x - 0.25) / 1.45, (w.y + 9.0) / 1.7);
  vec2 e = (0.5 - abs(fract(c) - 0.5)) * vec2(1.45, 1.7);
  return inside * smoothstep(0.045 - soft, 0.045 + soft, e.x) * smoothstep(0.045 - soft, 0.045 + soft, e.y);
}
float sunMask(vec3 p){ float t = (WX - p.x) / SUN.x; vec3 h = p + SUN * t; return pane(h.yz, 0.015 + t * 0.011); }

vec3 env(vec3 rd){
  vec3 c = mix(vec3(0.93, 0.82, 0.68), vec3(0.8, 0.84, 0.92), smoothstep(-0.1, 0.9, rd.y)) * 0.95;
  if (rd.y < -0.02) c = vec3(0.62, 0.55, 0.48) * 1.0;
  if (rd.x < -0.05) {
    float t = WX / rd.x; vec2 w = vec2(1.0 + rd.y * t, rd.z * t);
    c = mix(c, vec3(3.4, 3.6, 3.9), pane(w, 0.06));
  }
  // a big skylight overhead: the long soft highlight on wet clay and on the metal
  c += vec3(2.6, 2.6, 2.5) * smoothstep(0.78, 0.9, rd.y) * smoothstep(0.45, 0.0, abs(rd.x + 0.1));
  return c;
}

float shadow(vec3 ro, vec3 rd){
  vec3 oc = ro - BC; float b = dot(oc, rd); float h = b * b - dot(oc, oc) + 2.2;
  if (h < 0.0) return 1.0;
  h = sqrt(h); float tEnd = -b + h; float t = max(0.004, -b - h);
  float res = 1.0;
  for (int i = 0; i < 52; i++) {
    if (t > tEnd) break;
    float d = sceneD(ro + rd * t);
    res = min(res, 8.0 * d / t);
    if (res < 0.004) break;
    t += clamp(d, 0.006, 0.14);
  }
  return clamp(res, 0.0, 1.0);
}
float objAO(vec3 p, vec3 n){
  float o = 0.0; float w = 1.0;
  for (int i = 1; i <= 5; i++) { float h = 0.03 * float(i * i); float d = sceneD(p + n * h); o += w * max(h - d, 0.0); w *= 0.62; }
  return clamp(1.0 - 1.8 * o, 0.0, 1.0);
}

// ---- the room ----------------------------------------------------------------------------------
vec3 floorC(vec3 p, vec3 rd){
  vec3 n = vec3(0.0, 1.0, 0.0);
  // sealed concrete, trowel clouds, a joint line, and clay dust that collects round the wheel
  float m = fbm(p.xz * 0.9); float f = n2(p.xz * 40.0); float sp = h21(floor(p.xz * 140.0));
  vec3 alb = vec3(0.47, 0.44, 0.41) * (0.82 + 0.3 * m + 0.05 * f) * (1.0 - 0.18 * step(0.985, sp));
  float joint = smoothstep(0.012, 0.0, abs(fract((p.z + 1.6) / 3.2) - 0.5) * 3.2 - 1.588);
  alb *= 1.0 - 0.35 * joint;
  float r = length(p.xz);
  float dust = smoothstep(2.3, 1.0, r) * (0.5 + 0.5 * fbm(p.xz * 3.0 + 4.0));
  alb = mix(alb, uClay * 1.15 + 0.1, 0.35 * dust);
  float sh = shadow(p + n * 0.002, SUN) * sunMask(p);
  float ao = objAO(p, n);
  vec3 col = alb * (SUNC * SUN.y * sh + SKY * 0.42 * ao + vec3(0.9, 0.7, 0.5) * 0.1 * ao);
  vec3 rr = reflect(rd, normalize(n + vec3(f - 0.5, 0.0, m - 0.5) * 0.06));
  float F = 0.04 + 0.96 * pow(1.0 - max(dot(-rd, n), 0.0), 5.0);
  col += F * 0.35 * env(rr) * ao * (1.0 - 0.6 * dust);
  return col;
}
vec3 wallC(vec3 p, vec3 rd){
  vec3 n = vec3(0.0, 0.0, -1.0);
  float m = fbm(p.xy * 1.4); float f = n2(p.xy * 55.0);
  vec3 alb = vec3(0.9, 0.85, 0.77) * (0.88 + 0.14 * m + 0.04 * f);
  float sh = shadow(p + n * 0.002, SUN) * sunMask(p);
  return alb * (SUNC * max(dot(n, SUN), 0.0) * sh + SKY * 0.4 + vec3(1.0, 0.8, 0.6) * 0.2 + vec3(0.7, 0.6, 0.5) * 0.25 * smoothstep(1.2, 0.0, p.y));
}
vec3 room(vec3 ro, vec3 rd){
  float t = 1e9; float kind = 0.0;
  if (rd.y < 0.0) { float tf = -ro.y / rd.y; if (ro.z + rd.z * tf < WZ) { t = tf; kind = 1.0; } }
  if (kind < 0.5 && rd.z > 0.0) { t = (WZ - ro.z) / rd.z; kind = 2.0; }
  if (kind < 0.5) return env(rd);
  vec3 p = ro + rd * t;
  return kind < 1.5 ? floorC(p, rd) : wallC(p, rd);
}

// ---- materials ------------------------------------------------------------------------------------
vec3 light(vec3 p, vec3 n, vec3 rd, vec3 alb, float gloss, float spec, float refl, float sh, float ao){
  float dl = max(dot(n, SUN), 0.0);
  vec3 col = alb * (SUNC * dl * sh + SKY * 0.45 * (0.55 + 0.45 * n.y) * ao + vec3(0.8, 0.6, 0.45) * 0.22 * max(-n.y, 0.0) * ao);
  vec3 hv = normalize(SUN - rd);
  col += SUNC * sh * spec * pow(max(dot(n, hv), 0.0), gloss) * (gloss + 8.0) / 60.0;
  float F = 0.04 + 0.96 * pow(1.0 - max(dot(-rd, n), 0.0), 5.0);
  col += F * refl * env(reflect(rd, n)) * ao;
  return col;
}
vec3 shade(vec3 p, vec3 n, vec3 rd, float id){
  float sh = shadow(p + n * 0.004, SUN) * sunMask(p);
  float ao = objAO(p, n);
  float rho = length(p.xz);
  float a = atan(p.z, p.x);
  if (id < 1.5) {
    // the body: enamelled steel in a deep green-grey, a little worn and splashed
    float m = fbm(vec2(a * 3.0, p.y * 6.0));
    vec3 alb = vec3(0.075, 0.09, 0.085) * (0.85 + 0.3 * m);
    alb = mix(alb, uClay * 0.9, 0.5 * smoothstep(0.72, 0.85, fbm(vec2(a * 9.0, p.y * 14.0) + 3.0)));
    return light(p, n, rd, alb, 60.0, 0.5, 0.55, sh, ao);
  }
  if (id < 2.5) {
    // the splash pan: off-white moulded plastic, slurry in the bottom and flung up the sides
    float m = fbm(vec2(a * 5.0, rho * 8.0));
    vec3 alb = vec3(0.5, 0.52, 0.5) * (0.92 + 0.1 * m);
    float slip = smoothstep(0.5, 0.8, fbm(vec2(a * 6.0, rho * 4.0 + p.y * 9.0)) + 0.3 * smoothstep(0.5, 0.44, p.y) * smoothstep(1.25, 0.95, rho));
    alb = mix(alb, uClay * 1.2 + 0.04, slip * 0.7);
    return light(p, n, rd, alb, mix(30.0, 160.0, slip), mix(0.15, 0.9, slip), mix(0.25, 0.8, slip), sh, ao);
  }
  float as = a + uSpin;
  if (id < 3.5) {
    // the wheel head: cast aluminium, fine lathe rings, and smears of clay that turn with it
    float ring = n2(vec2(rho * 520.0, 1.0)); float cent = smoothstep(0.004, 0.0, abs(fract(rho / 0.16) - 0.5) * 0.16 - 0.076);
    vec3 F0 = vec3(0.86, 0.85, 0.83) * (0.86 + 0.14 * ring) * (1.0 - 0.4 * cent);
    float smear = smoothstep(0.55, 0.8, fbm(vec2(as * 2.2, rho * 6.0))) * smoothstep(0.3, 0.5, rho);
    smear = max(smear, step(0.78, rho) * 0.6 * smoothstep(0.4, 0.7, fbm(vec2(as * 7.0, 2.0))));
    vec3 r = reflect(rd, normalize(n + vec3(ring - 0.5) * 0.03));
    vec3 hv = normalize(SUN - rd);
    vec3 metal = F0 * (0.75 * env(r) * ao + SUNC * sh * 0.6 * pow(max(dot(n, hv), 0.0), 50.0));
    vec3 clay = light(p, n, rd, uClay * 0.7, 120.0, 0.8, 0.7, sh, ao);
    return mix(metal, clay, smear);
  }
  // the clay: wet stoneware. Slip streaks run round the wall and turn with the wheel; the wet sheen
  // breaks into bands where the fingers have just passed, and dulls once the wheel stops.
  float y = p.y - HT;
  float st = fbm(vec2(as * 2.5, y * 34.0)); float fine = n2(vec2(as * 30.0, y * 260.0));
  vec3 alb = uClay * (0.78 + 0.34 * st + 0.08 * fine);
  alb *= mix(1.25, 0.72, uWet); // wet clay is darker
  float wetBand = mix(0.55, 1.0, smoothstep(0.3, 0.7, n2(vec2(as * 1.5, y * 22.0))));
  float wet = uWet * wetBand;
  vec3 nb = normalize(n + vec3(cos(a), 0.0, sin(a)) * (fine - 0.5) * 0.12 * uOpen);
  return light(p, nb, rd, alb, mix(10.0, 260.0, wet), mix(0.05, 1.8, wet), mix(0.03, 1.0, wet), sh, ao);
}

vec3 nObj(vec3 q){ vec2 e = vec2(0.0007, 0.0); return normalize(vec3(objMap(q + e.xyy).x - objMap(q - e.xyy).x, objMap(q + e.yxy).x - objMap(q - e.yxy).x, objMap(q + e.yyx).x - objMap(q - e.yyx).x)); }

vec3 render(vec3 ro, vec3 rd){
  vec3 oc = ro - BC; float b = dot(oc, rd); float h = b * b - dot(oc, oc) + 2.2;
  if (h < 0.0) return room(ro, rd);
  h = sqrt(h); float t = max(0.0, -b - h); float tEnd = -b + h;
  vec2 hit = vec2(0.0);
  for (int i = 0; i < 140; i++) {
    vec2 m = objMap(ro + rd * t);
    if (m.x < 0.0005 * (1.0 + t * 0.1)) { hit = vec2(t, m.y); break; }
    t += m.x * 0.8; if (t > tEnd) break;
  }
  if (hit.y < 0.5) return room(ro, rd);
  vec3 p = ro + rd * hit.x;
  return shade(p, nObj(p), rd, hit.y);
}

void main(){
  vec2 fc = gl_FragCoord.xy + uJit.xy;
  vec2 uv = (fc - 0.5 * uRes) / uRes.y - uShift;
  vec3 fw = normalize(uTgt - uCam); vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)); vec3 up = cross(fw, rt);
  vec3 rd = normalize(fw * uFoc + rt * uv.x + up * uv.y);
  vec3 ro = uCam;
  vec3 fp = ro + rd * (uFocus / dot(rd, fw));
  ro += rt * uJit.z + up * uJit.w; rd = normalize(fp - ro);
  vec3 col = min(render(ro, rd), vec3(30.0));
  if (uDirect > 0.5) col = tone(col);
  outC = vec4(col, 1.0);
}
`;

// Developing the frame: a little bloom off the wet highlights, filmic curve, warm vignette, grain.
const POST = `
precision highp float;
uniform sampler2D uAcc; uniform vec2 uRes; uniform float uGrain; uniform vec2 uCentre;
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 c = texture2D(uAcc, uv).rgb;
  vec2 px = 1.0 / uRes;
  vec3 nb = texture2D(uAcc, uv + vec2(px.x, 0.0)).rgb + texture2D(uAcc, uv - vec2(px.x, 0.0)).rgb + texture2D(uAcc, uv + vec2(0.0, px.y)).rgb + texture2D(uAcc, uv - vec2(0.0, px.y)).rgb;
  c = max(c + (c - nb * 0.25) * 0.25, 0.0);
  vec3 b = vec3(0.0);
  for (int i = 0; i < 16; i++) {
    float a = float(i) * 2.39996; float r = sqrt((float(i) + 0.5) / 16.0);
    vec3 s = texture2D(uAcc, uv + vec2(cos(a), sin(a)) * r * 0.012 * vec2(uRes.y / uRes.x, 1.0)).rgb;
    b += min(max(s - 3.0, 0.0), vec3(8.0)) * (1.0 - 0.6 * r);
  }
  c += b * 0.035;
  vec2 q = (uv - uCentre) * vec2(uRes.x / uRes.y, 1.0);
  c *= mix(vec3(1.0), vec3(0.78, 0.7, 0.62), smoothstep(0.45, 1.25, length(q)));
  c = tone(c);
  float g = h21(gl_FragCoord.xy + uGrain * 91.7) - 0.5;
  c += g * 0.022;
  outC = vec4(c, 1.0);
}
`;

// No WebGL: the same studio as a still made of gradients and clipped shapes.
function Still({ pct }: { pct: number }) {
  const sh = shape(pct / 100);
  const h = 40 + sh.H * 150;
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden" style={{ background: "linear-gradient(180deg, #e8ddcc 0%, #e0d3bf 52%, #8f8378 52.2%, #a2968a 100%)" }}>
      <div className="absolute left-0 top-0 h-[52%] w-full" style={{ background: "repeating-linear-gradient(112deg, rgba(255,240,214,0) 0 90px, rgba(255,244,222,0.5) 90px 260px, rgba(255,240,214,0) 260px 300px)" }} />
      <div className="absolute left-1/2 top-[56%] h-[300px] w-[340px] -translate-x-1/2 -translate-y-1/2 lg:left-[68%]">
        <div className="absolute bottom-0 left-[6%] h-[48%] w-[88%] rounded-[22px]" style={{ background: "linear-gradient(90deg,#1c2321,#33403b 45%,#151a19)" }} />
        <div className="absolute left-0 top-[34%] h-[26%] w-full rounded-[50%]" style={{ background: "radial-gradient(ellipse at 50% 40%, #a07a62 0 38%, #d4d0c6 39% 100%)" }} />
        <div className="absolute left-[24%] top-[38%] h-[14%] w-[52%] rounded-[50%]" style={{ background: "linear-gradient(180deg,#e2e0dc,#9c9a96)" }} />
        <div className="absolute left-1/2 -translate-x-1/2" style={{ bottom: "56%", height: h, width: 150 + sh.rr * 60, background: "linear-gradient(90deg,#5a3423,#9a6648 40%,#6e4029)", clipPath: "polygon(4% 0, 96% 0, 74% 100%, 26% 100%)", borderRadius: "0 0 40% 40%" }} />
      </div>
    </div>
  );
}

export default function PottersWheelBowlLoader() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [pct, setPct] = useState(START);
  const [done, setDone] = useState(false);
  const [shown, setShown] = useState<"wait" | "gl" | "still">("wait");
  const api = useRef<{ press: () => void } | null>(null);

  useEffect(() => {
    const box = stage.current, cv = canvas.current;
    if (!box || !cv) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const opts = { antialias: false, alpha: false, powerPreference: "high-performance" as const };
    const gl2 = cv.getContext("webgl2", opts) as WebGL2RenderingContext | null;
    const gl = (gl2 ?? cv.getContext("webgl", opts)) as WebGLRenderingContext | null;
    const canAcc = !!gl2 && (!!gl2.getExtension("EXT_color_buffer_float") || !!gl2.getExtension("EXT_color_buffer_half_float"));
    const info = gl ? gl.getExtension("WEBGL_debug_renderer_info") : null;
    const software = /swiftshader|llvmpipe|software|basic render/i.test(gl && info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "");

    let scene: WebGLProgram | null = null, post: WebGLProgram | null = null;
    if (gl) {
      const head = gl2 ? "#version 300 es\n#define ATTR in\n" : "#define ATTR attribute\n";
      const fhead = gl2 ? "#version 300 es\n#define texture2D texture\nprecision highp float;\nout vec4 outC;\n" : "#define outC gl_FragColor\n";
      const compile = (type: number, src: string) => {
        const sh = gl.createShader(type);
        if (!sh) return null;
        gl.shaderSource(sh, src); gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(sh)); return null; }
        return sh;
      };
      const link = (frag: string) => {
        const v = compile(gl.VERTEX_SHADER, head + VERT), f = compile(gl.FRAGMENT_SHADER, fhead + frag);
        const p = gl.createProgram();
        if (!v || !f || !p) return null;
        gl.attachShader(p, v); gl.attachShader(p, f); gl.bindAttribLocation(p, 0, "aPos"); gl.linkProgram(p);
        return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
      };
      scene = link(SCENE); post = canAcc ? link(POST) : null;
    }
    const live = !!gl && !!scene && (!canAcc || !!post);
    if (!live) setShown("still");

    const su: Record<string, WebGLUniformLocation | null> = {}, pu: Record<string, WebGLUniformLocation | null> = {};
    let acc: WebGLTexture | null = null, fbo: WebGLFramebuffer | null = null;
    if (live && gl && scene) {
      for (const n of ["uRes", "uJit", "uCam", "uTgt", "uFoc", "uShift", "uFocus", "uShape", "uOpen", "uSpin", "uWet", "uTime", "uDirect", "uClay"]) su[n] = gl.getUniformLocation(scene, n);
      if (post) for (const n of ["uAcc", "uRes", "uGrain", "uCentre"]) pu[n] = gl.getUniformLocation(post, n);
      const quad = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      if (canAcc) { acc = gl.createTexture(); fbo = gl.createFramebuffer(); }
    }

    let W = 0, H = 0, scale = 1, cssW = 1, cssH = 1;
    const s = {
      goal: reduce ? 100 : START, seg: -1, segT: 0, from: START, running: !reduce,
      p: reduce ? 1 : START / 100,
      // phase 0 throwing, 1 done (the wheel coasts to a stop and the bowl rests), 2 a new ball is centred
      phase: 0, hold: 0, omega: reduce ? 0 : 9.5, spin: 0.6, wet: reduce ? 0.7 : 1, reset: 0,
      sx: 0, sy: 0, px: 0, py: 0,
      count: 0, fresh: true, frame: 0, slow: 0, fps: 0, fpsN: 0, fpsT: 0,
      visible: true, raf: 0, last: 0, t: 0, pct: START, first: true, done: false,
    };
    (box as HTMLDivElement & { __fps?: () => number }).__fps = () => s.fps;
    const size = () => {
      const r = box.getBoundingClientRect();
      cssW = Math.max(1, r.width); cssH = Math.max(1, r.height);
      if (!live || !gl) return;
      const dpr = Math.min(software ? 0.55 : 1.25, window.devicePixelRatio || 1) * scale;
      const k = Math.min(1, Math.sqrt(1.0e6 / (cssW * cssH * dpr * dpr)));
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

    // A longish lens looking down into the bowl, the wheel to the right and the figures beside it.
    const camera = () => {
      const aspect = cssW / cssH, wide = cssW >= 1024, roomy = cssW >= 640;
      const el = 0.5 - s.sy * 0.05, az = -0.2 + s.sx * 0.1, dist = 9.2;
      const tgt = [0, 0.62, 0];
      const cam = [tgt[0] + dist * Math.sin(az) * Math.cos(el), tgt[1] + dist * Math.sin(el), tgt[2] - dist * Math.cos(az) * Math.cos(el)];
      const foc = wide ? 2.6 : roomy ? 2.4 : Math.min(2.3, 1.12 + aspect * 0.62);
      const shift = wide ? [0.19 * aspect, -0.02] : roomy ? [0.2 * aspect, 0.02] : [0.0, 0.17];
      return { cam, tgt, foc, shift };
    };

    const draw = (alpha: number, sample: number) => {
      if (!live || !gl || !scene) return;
      const c = camera();
      const jx = sample ? halton(sample, 2) - 0.5 : 0, jy = sample ? halton(sample, 3) - 0.5 : 0;
      const la = halton(sample, 5) * Math.PI * 2, lr = sample ? Math.sqrt(halton(sample, 7)) * 0.07 : 0;
      const sh = shape(s.p);
      gl.useProgram(scene);
      gl.bindFramebuffer(gl.FRAMEBUFFER, canAcc ? fbo : null);
      gl.viewport(0, 0, W, H);
      if (canAcc && alpha < 1) { gl.enable(gl.BLEND); gl.blendColor(0, 0, 0, alpha); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA); } else gl.disable(gl.BLEND);
      gl.uniform2f(su.uRes, W, H);
      gl.uniform4f(su.uJit, canAcc ? jx : 0, canAcc ? jy : 0, canAcc ? Math.cos(la) * lr : 0, canAcc ? Math.sin(la) * lr : 0);
      gl.uniform3f(su.uCam, c.cam[0], c.cam[1], c.cam[2]); gl.uniform3f(su.uTgt, c.tgt[0], c.tgt[1], c.tgt[2]);
      gl.uniform1f(su.uFoc, c.foc); gl.uniform2f(su.uShift, c.shift[0], c.shift[1]);
      gl.uniform1f(su.uFocus, Math.hypot(c.cam[0], c.cam[1] - 0.8, c.cam[2]) - 0.1);
      gl.uniform4f(su.uShape, sh.H, sh.rf, sh.rr, sh.w); gl.uniform1f(su.uOpen, sh.open);
      // while spinning, each accumulated sample sees the wheel at a slightly different angle: that is the motion blur
      gl.uniform1f(su.uSpin, s.spin + (sample ? (halton(sample, 11) - 0.5) * s.omega * 0.03 : 0));
      gl.uniform1f(su.uWet, s.wet); gl.uniform1f(su.uTime, s.t);
      gl.uniform1f(su.uDirect, canAcc ? 0 : 1);
      gl.uniform3f(su.uClay, CLAY[0], CLAY[1], CLAY[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (canAcc && post) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.disable(gl.BLEND);
        gl.useProgram(post);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, acc);
        gl.uniform1i(pu.uAcc, 1); gl.uniform2f(pu.uRes, W, H);
        gl.uniform1f(pu.uGrain, reduce ? 1 : s.frame % 64);
        gl.uniform2f(pu.uCentre, 0.5 + c.shift[0] * (H / W), 0.5 + c.shift[1]);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };

    // the one button: finish the bowl now, or once it is done, wedge a new ball and throw again
    const press = () => {
      if (reduce) {
        s.goal = s.goal >= 100 ? 0 : Math.min(100, Math.round(s.goal / 20) * 20 + 20);
        s.p = s.goal / 100; s.count = 0; s.fresh = true; wake();
        return;
      }
      if (s.phase === 0) { s.seg = -2; s.goal = 100; }
      else if (s.phase === 1) { s.hold = HOLD; }
      wake();
    };
    api.current = { press };

    const frame = (now: number) => {
      s.raf = 0;
      if (!s.visible) return;
      const dtRaw = s.last ? (now - s.last) / 1000 : 0.016;
      const dt = Math.min(0.033, dtRaw);
      s.last = now; s.frame++; s.t += dt;
      s.fpsN++; s.fpsT += dtRaw; if (s.fpsT > 1) { s.fps = s.fpsN / s.fpsT; s.fpsN = 0; s.fpsT = 0; }

      // ---- the demo: walk the script. Replace this block with your own `s.goal = percent`.
      if (s.running && s.phase === 0 && s.seg > -2) {
        s.segT += dt;
        let [to, secs] = s.seg < 0 ? [FIRST, 0.6] : demo[s.seg];
        while (s.seg >= 0 && s.segT >= secs && s.seg < demo.length - 1) {
          s.segT -= secs; s.from = to; s.seg++;
          [to, secs] = demo[s.seg];
        }
        const k = Math.min(1, s.segT / secs), e = k * k * (3 - 2 * k);
        s.goal = s.from + (to - s.from) * e;
      }

      let moving = false;
      if (!reduce) {
        // the clay follows the number with a lag: hands can only pull a wall up so fast
        if (s.phase === 0) {
          s.p += Math.max(-0.5 * dt, Math.min(0.3 * dt, (s.goal / 100 - s.p) * (1 - Math.exp(-dt * 3.4))));
          s.omega += (9.5 - s.omega) * (1 - Math.exp(-dt * 3));
          s.wet += (1 - s.wet) * (1 - Math.exp(-dt * 2));
          if (s.goal >= 100 && s.p > 0.996) { s.p = 1; s.phase = 1; s.hold = 0; }
        } else if (s.phase === 1) {
          // the foot comes off the pedal: the wheel coasts, drags to a stop and rocks back a hair
          s.hold += dt;
          s.omega -= (1.4 + 0.5 * s.omega) * dt * 2.1;
          if (s.omega < 0) s.omega *= 0.8;
          if (s.omega < -0.25) s.omega = -0.25;
          s.wet += (0.5 - s.wet) * (1 - Math.exp(-dt * 0.9));
          if (s.hold > HOLD) { s.phase = 2; s.reset = 0; }
        } else {
          // the bowl is cut off and a fresh ball slapped down: the shape runs back to a centred mound
          s.reset = Math.min(1, s.reset + dt / 1.1);
          const k = s.reset, e = k * k * (3 - 2 * k);
          s.p = 1 - e;
          s.omega += (9.5 - s.omega) * (1 - Math.exp(-dt * 2.5));
          s.wet += (1 - s.wet) * (1 - Math.exp(-dt * 3));
          if (s.reset >= 1) { s.phase = 0; s.p = 0; s.goal = 0; s.from = 0; s.seg = 0; s.segT = 0; }
        }
        s.spin += s.omega * dt;
        s.sx += (s.px - s.sx) * (1 - Math.exp(-dt * 2.5)); s.sy += (s.py - s.sy) * (1 - Math.exp(-dt * 2.5));
        moving = true;
      } else {
        s.p = s.goal / 100; s.omega = 0;
      }

      const pctNow = s.phase === 1 ? 100 : s.phase === 2 ? 0 : Math.round(Math.min(100, s.p * 100 + 0.0001));
      if (pctNow !== s.pct) { s.pct = pctNow; setPct(pctNow); }
      const isDone = s.phase === 1 || (reduce && s.goal >= 100);
      if (isDone !== s.done) { s.done = isDone; setDone(isDone); }

      if (live) {
        if (s.fresh || !canAcc) { draw(1, 0); s.fresh = false; s.count = 1; }
        else if (moving && (Math.abs(s.omega) > 0.02 || s.phase !== 1)) draw(0.4, 1 + (s.frame % 32));
        else if (s.count < 48) { s.count++; draw(1 / s.count, s.count); }
        if (s.first) { s.first = false; setShown("gl"); }
        if (!reduce && !software && dtRaw > 0.026) s.slow++; else s.slow = Math.max(0, s.slow - 2);
        if (s.slow > 40 && scale > 0.45) { scale *= 0.82; s.slow = 0; size(); }
      }
      if (moving || (live && s.count < 48)) s.raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!s.raf && s.visible) { s.last = 0; s.raf = requestAnimationFrame(frame); } };

    size();
    const ro = new ResizeObserver(() => { size(); wake(); });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting && !document.hidden; if (s.visible) wake(); }, { threshold: 0.05 });
    io.observe(box);
    const vis = () => { s.visible = !document.hidden; if (s.visible) wake(); };
    document.addEventListener("visibilitychange", vis);
    // the pointer walks the camera a little round the wheel
    const move = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      s.px = ((e.clientX - r.left) / r.width) * 2 - 1; s.py = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (reduce) { s.count = 0; s.fresh = true; }
      wake();
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
      box.removeEventListener("pointermove", move); box.removeEventListener("pointerleave", leave);
      cv.removeEventListener("webglcontextlost", lost);
      api.current = null;
    };
  }, []);

  const at = Math.max(0, stages.findIndex((st) => pct <= st.until));

  return (
    <section className="relative isolate overflow-hidden bg-[#e4d8c6] text-[#2a1d15]" style={{ fontFamily: FONT }}>
      <style>{`
        @keyframes ray-marched-potters-wheel-loader-rise { from { opacity: 0; transform: translateY(0.4em); filter: blur(4px); } to { opacity: 1; transform: none; filter: blur(0); } }
        .ray-marched-potters-wheel-loader-note { animation: ray-marched-potters-wheel-loader-rise 560ms cubic-bezier(0.2, 0.9, 0.2, 1) both; }
        @media (prefers-reduced-motion: reduce) { .ray-marched-potters-wheel-loader-note { animation: none; } }
      `}</style>
      <div ref={stage} className="relative mx-auto h-[720px] w-full max-w-[1600px] lg:h-[760px]" style={{ background: "linear-gradient(180deg, #ebe0cf 0%, #e1d4c0 50%, #9a8e82 50%, #8c8177 100%)" }}>
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${shown === "gl" ? "opacity-100" : "opacity-0"}`} />
        {shown === "still" && <Still pct={pct} />}

        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between px-6 pb-7 pt-7 sm:px-10 lg:px-16 lg:pb-14 lg:pt-14">
          <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-[#2a1d15]/65">Wrenfold Pottery <span className="mx-2 text-[#2a1d15]/30">/</span> building the shop</p>
          <div className="max-w-[560px]">
            <div
              role="progressbar"
              aria-label="Building the shop"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              aria-valuetext={`${pct} percent. ${stages[at].note}`}
              className="flex items-start font-semibold leading-[0.8] tracking-[-0.065em] text-[#2a1d15]"
              style={{ fontVariantNumeric: "tabular-nums", fontSize: "clamp(112px, 17vw, 248px)" }}
            >
              <span>{pct}</span>
              <span className="ml-[0.06em] mt-[0.04em] text-[0.34em] tracking-normal text-[#9a4e2c]">%</span>
            </div>
            <div className="mt-5 flex items-baseline gap-3 text-[11px] font-medium uppercase tracking-[0.3em] text-[#2a1d15]/60 lg:mt-7">
              <span className="tabular-nums text-[#8f4427]">{String(at + 1).padStart(2, "0")}</span>
              <span className="h-px w-8 self-center bg-[#2a1d15]/25" />
              <span className="tabular-nums">{String(stages.length).padStart(2, "0")}</span>
            </div>
            <p aria-live="polite" className="mt-2 h-[1.3em] text-[22px] italic leading-snug text-[#2a1d15] lg:text-[28px]" style={{ fontFamily: SERIF }}>
              <span key={at} className="ray-marched-potters-wheel-loader-note block">{stages[at].note}</span>
            </p>
            <button
              type="button"
              onClick={() => api.current?.press()}
              className="pointer-events-auto mt-6 inline-flex h-11 items-center gap-2.5 rounded-full bg-[#2a1d15] pl-4 pr-5 text-[13px] font-medium tracking-[-0.01em] text-[#f5ebde] shadow-[0_8px_20px_-8px_rgba(60,30,10,0.6)] outline-none transition-colors duration-200 hover:bg-[#45301f] focus-visible:ring-2 focus-visible:ring-[#9a4e2c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e4d8c6] lg:mt-8"
            >
              <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="10" cy="13" rx="7" ry="2.2" /><path d="M5 12.6c-.6-3 .2-6 1.6-8h6.8c1.4 2 2.2 5 1.6 8" /></svg>
              {done ? "Throw another bowl" : "Finish the bowl"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
