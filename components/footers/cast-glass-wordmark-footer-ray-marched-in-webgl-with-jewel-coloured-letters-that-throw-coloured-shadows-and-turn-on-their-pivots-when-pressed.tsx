import { useEffect, useRef, useState } from "react";

// Everything a visitor would edit first.
const brand = {
  word: "ombra", // cast in glass, as wide as the footer. Letters that hang below the line (g j p q y) are cut off at the floor.
  name: "Ombra Glassworks",
  line: "Letters, lamps and lenses, cast slowly in coloured glass.",
  place: ["Kiln Yard, 18 Tidemill Lane", "Open to visitors Thursday to Saturday"],
  legal: "© 2026 Ombra Glassworks Ltd.",
};
const columns = [
  { title: "Studio", links: ["About", "The furnace", "People", "Careers"] },
  { title: "Work", links: ["Commissions", "Shop signs", "Lighting", "Archive"] },
  { title: "Visit", links: ["Workshop tours", "Open days", "Stockists", "Contact"] },
  { title: "Read", links: ["Journal", "Newsletter", "Press", "Care guide"] },
];
const small = ["Privacy", "Terms", "Cookies"];
// One glass per letter, repeating. Each is how fast the glass swallows red, green and blue per unit of depth.
const GLASS = [
  [3.3, 1.55, 0.06], // cobalt
  [0.05, 1.9, 3.6], // vermilion
  [0.04, 0.8, 3.6], // amber
  [3.2, 0.42, 2.2], // emerald
  [0.2, 3.2, 1.1], // rose
];
// The same five glasses as screen colours, for the still that shows when WebGL is not there.
const TINT = ["#2447d6", "#f0492c", "#f6ae17", "#12a26a", "#ee3d84"];
const DEPTH = 0.3; // half the thickness of a letter, front to back
const SUN = { turn: -0.24, height: 0.64 }; // where the lamp stands, in radians: behind the word and to the left
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';
const WEIGHT = 800;

const TW = 2048, TH = 640, UNIT = 320; // the plate the word is set on: pixels, and pixels per unit of the scene
const BASE = 0.93; // how far down the plate the baseline sits
const MAXL = 8;

const VERT = `#version 300 es
in vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

const TONE = `
vec3 tone(vec3 x){ vec3 c = 1.0 - exp(-max(x, 0.0) * 1.22); c = mix(c, c * c * (3.0 - 2.0 * c), 0.5); return pow(c, vec3(1.0 / 2.2)); }
`;

// The photograph: a white sweep, a lamp behind it, and a word of cast glass traced ray by ray.
const SCENE = `#version 300 es
precision highp float;
out vec4 outC;
uniform vec2 uRes; uniform vec4 uJit; uniform float uSeed; uniform float uDirect;
uniform vec3 uCam; uniform float uFoc; uniform vec2 uShift; uniform float uFocus;
uniform vec3 uSun; uniform sampler2D uSdf; uniform vec4 uPlate; uniform float uReach; uniform vec2 uWide;
uniform vec2 uCol[8]; uniform float uTurn[8]; uniform float uMid[8]; uniform vec3 uAbs[8]; uniform float uBusy;
const float ZW = 10.0; const float RC = 3.4; const float TOP = 90.0;
const float D = ${DEPTH.toFixed(3)};
const float BW = 0.105; const float BZ = 0.075; const float RR = 0.012; const float BL = 0.129035;
const float IOR = 1.5;
const vec3 FLOORC = vec3(0.93, 0.915, 0.89);
const vec3 SUNC = vec3(1.0, 0.95, 0.86);
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }

// Which letter a point belongs to: the word is cut into columns between the glyphs.
int col(float x){ int i = 0; for (int k = 0; k < 7; k++) if (x > uCol[k].y) i = k + 1; return i; }

// Distance to the outline of the word on its plate, read from the baked field.
float sdf2(vec2 q){
  vec2 uv = vec2(q.x / (2.0 * uPlate.x) + 0.5, (q.y - uPlate.z) / uPlate.y);
  vec2 c = clamp(uv, 0.002, 0.998);
  return texture(uSdf, c).r + length((uv - c) * vec2(2.0 * uPlate.x, uPlate.y));
}
// A letter is its outline pushed back through the glass, with a wide cut bevel round both faces.
float shape(float a2, float z){ float a = a2 + RR; float b = abs(z) - D + RR; return max(max(a, b), (a * BZ + b * BW + BW * BZ) / BL) - RR; }
// Each letter stands on its own pivot: this is a point seen from the turned frame of letter n.
vec3 turned(int n, vec3 p, out vec2 cs){
  float th = uTurn[n]; cs = vec2(cos(th), sin(th)); float xx = p.x - uMid[n];
  return vec3(uMid[n] + xx * cs.x - p.z * cs.y, p.y, xx * cs.y + p.z * cs.x);
}
// Letter n by itself. Its outline is only read inside its own column of the plate, so a turning letter never drags its neighbours round.
float letter(int n, vec3 p){
  vec2 cs; vec3 q = turned(n, p, cs);
  float cx = clamp(q.x, uCol[n].x, uCol[n].y); float dx = abs(q.x - cx);
  float a = sdf2(vec2(cx, q.y));
  return shape(dx > 0.0 ? max(dx, a - dx) : a, q.z);
}
// The whole word, and which letter is nearest. While nothing turns it is one read of the plate.
float mapW(vec3 p, out int who){
  who = col(p.x);
  if (uBusy < 0.5) return shape(sdf2(p.xy), p.z);
  float d = letter(who, p);
  int j = p.x - uCol[who].x < uCol[who].y - p.x ? who - 1 : who + 1;
  if (j >= 0 && j < 8) { float e = letter(j, p); if (e < d) { d = e; who = j; } }
  return d;
}
float map(vec3 p){ int w; return mapW(p, w); }
vec2 box(vec3 ro, vec3 rd){
  vec3 c = vec3(0.0, 0.98, 0.0); vec3 b = vec3(uPlate.x, 1.0, D + uReach);
  vec3 m = 1.0 / (rd + vec3(1e-6)); vec3 n = m * (ro - c); vec3 k = abs(m) * b; vec3 a = -n - k; vec3 z = -n + k;
  return vec2(max(max(a.x, a.y), a.z), min(min(z.x, z.y), z.z));
}
float march(vec3 ro, vec3 rd, int steps){
  vec2 tb = box(ro, rd); if (tb.y < max(tb.x, 0.0)) return -1.0;
  float t = max(tb.x, 0.0);
  for (int i = 0; i < steps; i++) { float d = map(ro + rd * t); if (d < 0.0007) return t; t += d; if (t > tb.y) break; }
  return -1.0;
}
// The way a face points, worked out from the same pieces as the solid so that flat faces come out flat and creases crisp.
vec3 nrm(vec3 p, int who){
  vec2 cs; vec3 q = turned(who, p, cs);
  q.x = clamp(q.x, uCol[who].x, uCol[who].y);
  vec2 uv = clamp(vec2(q.x / (2.0 * uPlate.x) + 0.5, (q.y - uPlate.z) / uPlate.y), 0.002, 0.998);
  vec3 tx = texture(uSdf, uv).rgb;
  vec2 g = normalize(tx.gb + 1e-6);
  float sz = q.z < 0.0 ? -1.0 : 1.0;
  float a = tx.r + RR; float b = abs(q.z) - D + RR; float e = (a * BZ + b * BW + BW * BZ) / BL;
  float m = max(max(a, b), e);
  float wa = exp((a - m) * 260.0); float wb = exp((b - m) * 260.0); float we = exp((e - m) * 260.0);
  vec3 n = wa * vec3(g, 0.0) + wb * vec3(0.0, 0.0, sz) + we * vec3(g * BZ, sz * BW) / BL;
  n = normalize(n);
  return vec3(n.x * cs.x + n.z * cs.y, n.y, n.z * cs.x - n.x * cs.y);
}
// How far a point inside the glass is from the face the lamp shines in through.
float toSun(vec3 p){ float t = 0.0; for (int i = 0; i < 9; i++) { float d = -map(p + uSun * t); if (d < 0.003) break; t += max(d, 0.014); } return t; }
// Cast glass is never quite flat: a slow wave on every face.
vec3 wavy(vec3 n, vec3 p){
  vec3 w = vec3(n2(p.xy * 4.3 + p.z * 3.1) - 0.5, n2(p.yx * 4.9 + 11.0 - p.z * 2.7) - 0.5, n2(p.xy * 3.7 + 5.0) - 0.5);
  return normalize(n + 0.05 * w);
}

// The room the glass reflects: a bright studio with a window, a strip light, a scrim overhead and one black card.
vec3 env(vec3 rd){
  float el = asin(clamp(rd.y, -1.0, 1.0)); float az = atan(rd.x, -rd.z);
  vec3 c = mix(vec3(0.3, 0.29, 0.28), vec3(1.25, 1.27, 1.3), smoothstep(-0.2, 0.55, rd.y));
  c += vec3(1.0, 0.99, 0.97) * 12.0 * smoothstep(0.75, 1.1, el);
  vec2 w = abs(vec2(az + 0.7, el - 0.52)) - vec2(0.42, 0.3);
  float bars = smoothstep(0.012, 0.026, abs(az + 0.7)) * smoothstep(0.012, 0.026, abs(el - 0.52));
  c += vec3(1.0, 0.98, 0.95) * 26.0 * smoothstep(0.02, -0.02, max(w.x, w.y)) * bars;
  vec2 w2 = abs(vec2(az - 1.15, el - 0.3)) - vec2(0.09, 0.6);
  c += vec3(0.95, 0.97, 1.0) * 18.0 * smoothstep(0.03, -0.03, max(w2.x, w2.y));
  vec2 w3 = abs(vec2(az - 0.42, el - 0.2)) - vec2(0.26, 0.5);
  c *= 1.0 - 0.9 * smoothstep(0.06, -0.06, max(w3.x, w3.y));
  c += SUNC * 46.0 * smoothstep(0.9962, 0.9989, dot(rd, uSun));
  return c;
}

// How much of the lamp reaches a point on the floor, and in what colour: the light is filtered by every bit of glass it crosses.
vec3 sunVis(vec3 p, float jit){
  vec2 tb = box(p, uSun); if (tb.y < max(tb.x, 0.0)) return vec3(1.0);
  float t0 = max(tb.x, 0.0); float dt = (tb.y - t0) / 22.0; float t = t0 + dt * jit;
  vec3 ab = vec3(0.0); float len = 0.0; float deep = 0.0;
  for (int i = 0; i < 22; i++) {
    vec3 q = p + uSun * t; int who; float d = mapW(q, who); float soft = 0.002 + 0.005 * t;
    float w = smoothstep(soft, -soft, d);
    ab += uAbs[who] * w * dt; len += w * dt; deep = max(deep, -d);
    t += dt;
  }
  if (len < 0.0005) return vec3(1.0);
  // the edge of the glass throws light aside, the bevel just inside it gathers a bright line, and the wave in the faces draws threads
  vec2 al = normalize(uSun.xz); vec2 fq = vec2(dot(p.xz, vec2(-al.y, al.x)), dot(p.xz, al));
  float thread = n2(vec2(fq.x * 17.0 + 1.4 * n2(fq * 1.9), fq.y * 1.1));
  float edge = smoothstep(0.0, 0.035, len);
  float line = exp(-pow((deep - 0.07) / 0.02, 2.0)) * smoothstep(0.1, 0.4, len);
  float core = smoothstep(0.2, 0.7, len);
  // any light that so much as clips a letter comes out coloured: the bevels bend it through more glass than a straight line would
  vec3 thru = exp(-(ab / max(len, 1e-4)) * (len * 1.5 + 0.34 * edge)) * (0.92 + 0.5 * core * thread * thread + 1.1 * line);
  return mix(vec3(1.0), thru, edge);
}

// Everything that is not glass: floor, cove and wall of one white sweep.
vec3 stage(vec3 ro, vec3 rd, float full, float jit){
  float t = 1e9; vec3 n = vec3(0.0, 1.0, 0.0);
  if (rd.y < 0.0) { float tf = -ro.y / rd.y; float z = ro.z + rd.z * tf; if (z < ZW - RC) t = tf; }
  if (t > 1e8 && rd.z > 0.0) { float tw = (ZW - ro.z) / rd.z; float y = ro.y + rd.y * tw; if (y > TOP) return env(rd); if (y > RC) { t = tw; n = vec3(0.0, 0.0, -1.0); } }
  if (t > 1e8) {
    vec2 o = ro.yz - vec2(RC, ZW - RC); float a = dot(rd.yz, rd.yz); float b = dot(o, rd.yz); float h = b * b - a * (dot(o, o) - RC * RC);
    if (h > 0.0 && a > 1e-7) { float tc = (-b + sqrt(h)) / a; vec2 pc = ro.yz + rd.yz * tc; if (tc > 0.0 && pc.x < RC + 0.02 && pc.y > ZW - RC - 0.02) { t = tc; vec2 nn = (vec2(RC, ZW - RC) - pc) / RC; n = vec3(0.0, nn.x, nn.y); } }
  }
  if (t > 1e8) return env(rd);
  vec3 p = ro + rd * t;
  // the sweep is only as big as the picture needs: past its edges the studio is dark, and that is what draws the edges of the glass
  if (abs(p.x - uCam.x) > uWide.x * (p.z - uCam.z) + 0.5 || p.z < uWide.y) return env(rd) * 0.06;
  vec2 pq = p.xz + p.y * vec2(0.37, 0.81);
  float tooth = 0.5 * (n2(pq * 130.0) - 0.5) + 0.3 * (n2(pq * 47.0 + 7.0) - 0.5); float mott = n2(pq * 0.9) - 0.5;
  vec3 alb = FLOORC * (1.0 + 0.035 * tooth + 0.03 * mott);
  vec3 vis = vec3(1.0);
  float near = map(p + n * 0.05);
  if (full > 0.5 && n.y > 0.2) vis = sunVis(p + n * 0.003, jit);
  float occ = 0.5 + 0.5 * smoothstep(0.0, 0.3, near);
  vec3 lit = SUNC * 2.15 * uSun.y * vis + vec3(0.15, 0.17, 0.22) * occ;
  if (full > 0.5 && n.y > 0.99) {
    // the floor is sealed and polished: it carries a soft mirror image of the glass
    vec3 r = normalize(reflect(rd, n) + 0.035 * vec3(jit - 0.5, 0.0, fract(jit * 7.31) - 0.5));
    float tr = march(p + n * 0.004, r, 30);
    if (tr > 0.0) {
      vec3 h = p + r * tr; float fr = 0.04 + 0.96 * pow(1.0 - max(-rd.y, 0.0), 5.0);
      int who; mapW(h, who);
      vec3 gc = exp(-uAbs[who] * 1.1) * 1.5 + 0.08;
      lit = mix(lit, gc / alb, fr * 0.62 * exp(-h.y * 1.1));
    }
  }
  // the wall is a light wall: it glows by itself, brightest behind the word
  float wash = exp(-dot(p.xy - vec2(0.0, 6.0), p.xy - vec2(0.0, 6.0)) / 700.0);
  vec3 glow = vec3(1.5, 1.52, 1.57) * (0.86 + 0.2 * wash);
  return alb * mix(glow, lit, smoothstep(0.0, 0.85, n.y));
}

// What a ray that has left one letter meets next: sometimes another letter, then the sweep.
vec3 beyond(vec3 p, vec3 d, float jit){
  p.y = max(p.y, 0.001);
  vec3 tint = vec3(1.0);
  float t = march(p + d * 0.03, d, 26);
  if (t > 0.0) { int who; mapW(p + d * (t + 0.05), who); tint = exp(-uAbs[who] * 1.0) * 0.9; }
  return stage(p, d, 1.0, jit) * tint;
}

vec3 glass(vec3 p, vec3 rd, float jit){
  int who; mapW(p, who);
  vec3 ab = uAbs[who];
  vec3 n = wavy(nrm(p, who), p);
  float nv = clamp(dot(-rd, n), 0.0, 1.0);
  float f = 0.04 + 0.96 * pow(1.0 - nv, 5.0);
  vec3 refl = stage(p + n * 0.01, reflect(rd, n), 1.0, jit);
  vec3 pos = p - n * 0.012; vec3 dir = refract(rd, n, 1.0 / IOR); float len = 0.0; vec3 glow = vec3(0.0);
  for (int b = 0; b < 5; b++) {
    float t = 0.0;
    for (int i = 0; i < 26; i++) { float d = -map(pos + dir * t); if (d < 0.0016) break; t += max(d, 0.006); }
    if (b == 0) {
      // cast glass is faintly cloudy, so the lamp behind lights it from within: brightest near the faces the light comes in by
      vec3 pa = pos + dir * t * 0.25; vec3 pb = pos + dir * t * 0.7;
      glow = (exp(-ab * 2.6 * (toSun(pa) + t * 0.25)) + exp(-ab * 2.6 * (toSun(pb) + t * 0.7))) * 0.5 * (1.0 - exp(-t * 2.2));
    }
    pos += dir * t; len += t;
    vec3 m = wavy(nrm(pos, who), pos + 3.0); if (dot(m, dir) < 0.0) m = -m;
    vec3 rf = refract(dir, -m, IOR);
    if (dot(rf, rf) < 0.5) { dir = reflect(dir, -m); pos -= m * 0.014; }
    else { dir = rf; pos += m * 0.014; break; }
  }
  vec3 att = exp(-ab * len * 2.4);
  // glass splits colour a little: red leaves bent slightly less than blue
  vec3 dv = (dir - rd) * 0.022;
  vec3 col = beyond(pos, dir, jit);
  col.r = beyond(pos, normalize(dir - dv), jit).r; col.b = beyond(pos, normalize(dir + dv), jit).b;
  return (col * att + glow * SUNC * 0.12) * (1.0 - f) + refl * f;
}

void main(){
  vec2 fc = gl_FragCoord.xy + uJit.xy;
  vec2 uv = (fc - 0.5 * uRes) / uRes.y - uShift;
  vec3 rd = normalize(vec3(uv, uFoc));
  vec3 ro = uCam;
  vec3 fp = ro + rd * (uFocus / rd.z);
  ro.xy += uJit.zw; rd = normalize(fp - ro);
  float ign = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))) + uSeed);
  float t = march(ro, rd, 72);
  vec3 col = t > 0.0 ? glass(ro + rd * t, rd, ign) : stage(ro, rd, 1.0, ign);
  col = min(col, vec3(12.0));
  if (uDirect > 0.5) col = tone(col);
  outC = vec4(col, 1.0);
}
`;

// Developing the negative: a little bloom off the hot glints, the film curve, a soft vignette and grain.
const POST = `#version 300 es
precision highp float;
out vec4 outC;
uniform sampler2D uAcc; uniform vec2 uRes; uniform float uGrain;
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 c = texture(uAcc, uv).rgb;
  vec2 px = 1.0 / uRes;
  vec3 nb = texture(uAcc, uv + vec2(px.x, 0.0)).rgb + texture(uAcc, uv - vec2(px.x, 0.0)).rgb + texture(uAcc, uv + vec2(0.0, px.y)).rgb + texture(uAcc, uv - vec2(0.0, px.y)).rgb;
  c = max(c + (c - nb * 0.25) * 0.35, 0.0);
  vec3 b = vec3(0.0);
  for (int i = 0; i < 20; i++) {
    float a = float(i) * 2.39996; float r = sqrt((float(i) + 0.5) / 20.0);
    vec3 s = texture(uAcc, uv + vec2(cos(a), sin(a)) * r * 0.02 * vec2(uRes.y / uRes.x, 1.0)).rgb;
    b += min(max(s - 3.2, 0.0), vec3(8.0)) * (1.0 - 0.6 * r);
  }
  c += b * 0.02;
  vec2 q = (uv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  c *= 1.0 - 0.1 * smoothstep(0.5, 1.4, length(q));
  c = tone(c);
  float g = h21(gl_FragCoord.xy + uGrain * 91.7) - 0.5;
  c += g * 0.016;
  outC = vec4(c, 1.0);
}
`;

// One pass of the exact squared distance transform (Felzenszwalb and Huttenlocher).
function edt1d(f: Float32Array, n: number, d: Float32Array, v: Int32Array, z: Float32Array) {
  let k = 0;
  v[0] = 0; z[0] = -1e20; z[1] = 1e20;
  for (let q = 1; q < n; q++) {
    let s = 0;
    for (;;) {
      const p = v[k];
      s = (f[q] + q * q - (f[p] + p * p)) / (2 * q - 2 * p);
      if (s <= z[k] && k > 0) k--; else break;
    }
    k++; v[k] = q; z[k] = s; z[k + 1] = 1e20;
  }
  k = 0;
  for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; const p = v[k]; d[q] = (q - p) * (q - p) + f[p]; }
}
function edt(grid: Float32Array, w: number, h: number) {
  const n = Math.max(w, h), f = new Float32Array(n), d = new Float32Array(n), v = new Int32Array(n), z = new Float32Array(n + 1);
  for (let x = 0; x < w; x++) { for (let y = 0; y < h; y++) f[y] = grid[y * w + x]; edt1d(f, h, d, v, z); for (let y = 0; y < h; y++) grid[y * w + x] = d[y]; }
  for (let y = 0; y < h; y++) { for (let x = 0; x < w; x++) f[x] = grid[y * w + x]; edt1d(f, w, d, v, z); for (let x = 0; x < w; x++) grid[y * w + x] = Math.sqrt(d[x]); }
}

// Set the word once on a 2D canvas and turn it into a field of distances the shader can stand up in space.
function bakeWord(text: string) {
  const chars = [...text].slice(0, MAXL);
  const cv = document.createElement("canvas");
  cv.width = TW; cv.height = TH;
  const g = cv.getContext("2d", { willReadFrequently: true });
  const data = new Float32Array(TW * TH * 3);
  for (let i = 0; i < TW * TH; i++) data[i * 3] = 0.5;
  const flat = { data, half: 3, tall: 1.4, edges: chars.slice(1).map((_, i) => ((i + 1) / chars.length) * 6 - 3), spans: chars.map((_, i) => [(i / chars.length) * 6 - 3, ((i + 1) / chars.length) * 6 - 3]) };
  if (!g) return flat;
  const px = 300, track = 0.034 * px;
  g.font = `${WEIGHT} ${px}px ${FONT}`;
  // each letter keeps its kerning against the ones before it, with a hair of air added so the castings stand apart
  const xs = chars.map((_, i) => g.measureText(chars.slice(0, i).join("")).width + i * track);
  const m = g.measureText(chars.join(""));
  const total = m.width + (chars.length - 1) * track;
  const asc = m.actualBoundingBoxAscent || px * 0.74;
  const k = Math.min((TW * 0.95) / total, (TH * 0.86) / asc);
  g.font = `${WEIGHT} ${px * k}px ${FONT}`;
  g.fillStyle = "#fff"; g.textBaseline = "alphabetic";
  const x0 = (TW - total * k) / 2, y0 = Math.round(TH * BASE);
  chars.forEach((ch, i) => g.fillText(ch, x0 + xs[i] * k, y0));
  const spans = chars.map((ch, i) => { const mm = g.measureText(ch); const x = x0 + xs[i] * k; return [(x - (mm.actualBoundingBoxLeft || 0) - TW / 2) / UNIT, (x + (mm.actualBoundingBoxRight || mm.width) - TW / 2) / UNIT]; });
  const edges = spans.slice(1).map((sp, i) => (sp[0] + spans[i][1]) / 2);
  const img = g.getImageData(0, 0, TW, TH).data;
  // rows are stored bottom first so that up on the plate is up in the scene
  const outer = new Float32Array(TW * TH), inner = new Float32Array(TW * TH);
  for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) {
    const a = img[((TH - 1 - y) * TW + x) * 4 + 3] / 255, i = y * TW + x;
    if (a >= 1) { outer[i] = 0; inner[i] = 1e12; } else if (a <= 0) { outer[i] = 1e12; inner[i] = 0; }
    else { const dd = 0.5 - a; outer[i] = dd > 0 ? dd * dd : 0; inner[i] = dd < 0 ? dd * dd : 0; }
  }
  edt(outer, TW, TH); edt(inner, TW, TH);
  for (let i = 0; i < data.length; i++) outer[i] = (outer[i] - inner[i]) / UNIT;
  // three light blurs take the stair steps off the outline, so the walls of the glass come out smooth
  let a = outer, b = inner;
  for (let pass = 0; pass < 4; pass++) {
    b.set(a);
    for (let y = 1; y < TH - 1; y++) for (let x = 1; x < TW - 1; x++) {
      const i = y * TW + x;
      b[i] = (a[i] * 4 + (a[i - 1] + a[i + 1] + a[i - TW] + a[i + TW]) * 2 + a[i - TW - 1] + a[i - TW + 1] + a[i + TW - 1] + a[i + TW + 1]) / 16;
    }
    [a, b] = [b, a];
  }
  // red is the distance; green and blue are the direction it grows in, taken from a softer copy so the walls of the glass are glassy smooth
  const soft = b; soft.set(a);
  const line = new Float32Array(Math.max(TW, TH));
  const R = 3;
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y < TH; y++) {
      const o = y * TW; let sum = 0;
      for (let x = 0; x < TW; x++) line[x] = soft[o + x];
      for (let x = -R; x <= R; x++) sum += line[Math.min(TW - 1, Math.max(0, x))];
      for (let x = 0; x < TW; x++) { soft[o + x] = sum / (2 * R + 1); sum += line[Math.min(TW - 1, x + R + 1)] - line[Math.max(0, x - R)]; }
    }
    for (let x = 0; x < TW; x++) {
      let sum = 0;
      for (let y = 0; y < TH; y++) line[y] = soft[y * TW + x];
      for (let y = -R; y <= R; y++) sum += line[Math.min(TH - 1, Math.max(0, y))];
      for (let y = 0; y < TH; y++) { soft[y * TW + x] = sum / (2 * R + 1); sum += line[Math.min(TH - 1, y + R + 1)] - line[Math.max(0, y - R)]; }
    }
  }
  const inv = UNIT / 2;
  for (let y = 0; y < TH; y++) for (let x = 0; x < TW; x++) {
    const i = y * TW + x, o = i * 3, xl = x > 0 ? i - 1 : i, xr = x < TW - 1 ? i + 1 : i, yd = y > 0 ? i - TW : i, yu = y < TH - 1 ? i + TW : i;
    data[o] = a[i]; data[o + 1] = (soft[xr] - soft[xl]) * inv; data[o + 2] = (soft[yu] - soft[yd]) * inv;
  }
  return { data, half: (total * k) / 2 / UNIT, tall: (asc * k) / UNIT, edges, spans };
}

// No WebGL: the same word set in type, each letter tinted like its glass, with its colour laid out on the floor in front of it.
function Still() {
  const chars = [...brand.word].slice(0, MAXL);
  const row = (shadow: boolean) => chars.map((ch, i) => (
    <span key={i} className={shadow ? "" : "bg-clip-text text-transparent"} style={shadow ? { color: TINT[i % TINT.length] } : { backgroundImage: `linear-gradient(172deg, #ffffff -30%, ${TINT[i % TINT.length]} 26%, ${TINT[i % TINT.length]} 62%, #1a1511 190%)`, WebkitBackgroundClip: "text" }}>{ch}</span>
  ));
  return (
    <div aria-hidden="true" className="absolute inset-x-0 bottom-[150px] flex select-none justify-center lg:bottom-[190px]">
      <div className="relative whitespace-nowrap text-[28vw] font-extrabold leading-[0.72] tracking-[-0.01em] lg:text-[min(28vw,390px)]">
        <div className="absolute inset-0 opacity-60 blur-[2px] lg:blur-[3px]" style={{ transformOrigin: "50% 103.5%", transform: "scaleY(-0.42) skewX(-18deg)", mixBlendMode: "multiply" }}>{row(true)}</div>
        <div className="relative" style={{ filter: "drop-shadow(0 1px 0 rgba(255,255,255,0.8))" }}>{row(false)}</div>
      </div>
    </div>
  );
}

export default function CastGlassWordmarkFooter() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const hit = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState<"wait" | "gl" | "still">("wait");
  const [calm, setCalm] = useState(false);
  const api = useRef<{ nudge: () => void } | null>(null);

  useEffect(() => {
    const box = stage.current, cv = canvas.current, pad = hit.current;
    if (!box || !cv || !pad) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setCalm(reduce);
    const gl = cv.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance" }) as WebGL2RenderingContext | null;
    if (!gl) { setShown("still"); return; }
    const canAcc = !!gl.getExtension("EXT_color_buffer_float") || !!gl.getExtension("EXT_color_buffer_half_float");
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    const software = /swiftshader|llvmpipe|software|basic render/i.test(renderer);
    const still = reduce || software; // nothing plays by itself: draw, refine, then rest

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src); gl.compileShader(sh);
      return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
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
    const U = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);
    const su = Object.fromEntries(["uRes", "uJit", "uSeed", "uDirect", "uCam", "uFoc", "uShift", "uFocus", "uSun", "uSdf", "uPlate", "uReach", "uWide", "uCol", "uTurn", "uMid", "uAbs", "uBusy"].map((n) => [n, U(scene, n)]));
    const pu = post ? Object.fromEntries(["uAcc", "uRes", "uGrain"].map((n) => [n, U(post, n)])) : {};

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // the word, as a plate of distances
    let word = bakeWord(brand.word);
    const sdf = gl.createTexture();
    const plate = () => {
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, sdf);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB16F, TW, TH, 0, gl.RGB, gl.FLOAT, word.data);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };
    plate();
    const count = Math.min(MAXL, [...brand.word].length);
    const absorb = new Float32Array(MAXL * 3);
    for (let i = 0; i < MAXL; i++) absorb.set(GLASS[i % GLASS.length], i * 3);
    const colArr = new Float32Array(MAXL * 2).fill(1e9), turnArr = new Float32Array(MAXL), midArr = new Float32Array(MAXL).fill(1e9);

    // The accumulation plate: every frame is one more exposure blended onto it.
    const acc = canAcc ? gl.createTexture() : null;
    const fbo = canAcc ? gl.createFramebuffer() : null;
    let W = 0, H = 0, scale = 1, cssW = 1, cssH = 1;
    const size = () => {
      const r = box.getBoundingClientRect();
      cssW = Math.max(1, r.width); cssH = Math.max(1, r.height);
      const dpr = Math.min(software ? 1 : 1.75, window.devicePixelRatio || 1) * scale;
      // never more than about one and a half million pixels of tracing
      const k = Math.min(1, Math.sqrt(1.6e6 / (cssW * cssH * dpr * dpr)));
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

    const s = {
      a: new Float32Array(MAXL), v: new Float32Array(MAXL), rest: new Float32Array(MAXL), from: new Float32Array(MAXL), spinT: new Float32Array(MAXL).fill(-1),
      due: [] as { at: number; i: number; v: number; turn: number }[],
      px: 0, py: 0, sx: 0, sy: 0, over: false, count: 0, fresh: true, frame: 0, slow: 0,
      visible: true, raf: 0, last: 0, t0: 0, now: 0, touched: false, demoAt: 0, first: true, alive: true,
    };
    const halton = (i: number, b: number) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };

    // The camera is a view camera: it stands above the word looking level, and the lens is shifted down, so uprights stay upright.
    const DIST = 12, EYE = 3.1;
    const lens = () => {
      const aspect = cssW / cssH, wide = cssW >= 1024;
      const foc = Math.min(((wide ? 0.445 : 0.46) * aspect * DIST) / word.half, (0.4 * DIST) / word.tall);
      const base = wide ? 0.735 : cssW >= 640 ? 0.77 : 0.8; // how far down the frame the word stands
      return { foc, base, shift: 0.5 - base + (foc * EYE) / DIST, cx: s.sx * 0.14 };
    };

    const draw = (alpha: number, sample: number) => {
      const { foc, shift, cx, base } = lens();
      const jx = sample ? halton(sample, 2) - 0.5 : 0, jy = sample ? halton(sample, 3) - 0.5 : 0;
      const la = halton(sample, 5) * Math.PI * 2, lr = sample ? Math.sqrt(halton(sample, 7)) * 0.03 : 0;
      const t = (s.now - s.t0) / 1000;
      const sa = SUN.turn + (still ? 0 : Math.sin(t * 0.21) * 0.13) + s.sx * 0.42, se = SUN.height - s.sy * 0.1;
      gl.useProgram(scene);
      gl.bindFramebuffer(gl.FRAMEBUFFER, canAcc ? fbo : null);
      gl.viewport(0, 0, W, H);
      if (canAcc && alpha < 1) { gl.enable(gl.BLEND); gl.blendColor(0, 0, 0, alpha); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA); } else gl.disable(gl.BLEND);
      gl.uniform2f(su.uRes, W, H);
      gl.uniform4f(su.uJit, canAcc ? jx : 0, canAcc ? jy : 0, canAcc ? Math.cos(la) * lr : 0, canAcc ? Math.sin(la) * lr : 0);
      gl.uniform1f(su.uSeed, canAcc && sample ? (sample * 0.61803) % 1 || 0.5 : 0);
      gl.uniform1f(su.uDirect, canAcc ? 0 : 1);
      gl.uniform3f(su.uCam, cx, EYE, -DIST);
      gl.uniform1f(su.uFoc, foc);
      gl.uniform2f(su.uShift, 0, shift);
      gl.uniform1f(su.uFocus, DIST);
      gl.uniform3f(su.uSun, Math.sin(sa) * Math.cos(se), Math.sin(se), Math.cos(sa) * Math.cos(se));
      gl.uniform4f(su.uPlate, TW / UNIT / 2, TH / UNIT, -(TH * (1 - BASE)) / UNIT, 0);
      for (let i = 0; i < count; i++) { colArr[i * 2] = i ? word.edges[i - 1] : -1e9; colArr[i * 2 + 1] = i < count - 1 ? word.edges[i] : 1e9; }
      let reach = 0;
      for (let i = 0; i < count; i++) {
        const th = s.a[i] - s.rest[i] === 0 && s.spinT[i] < 0 ? 0 : s.a[i] % (Math.PI * 2), hw = (word.spans[i][1] - word.spans[i][0]) / 2;
        turnArr[i] = th; midArr[i] = (word.spans[i][0] + word.spans[i][1]) / 2;
        reach = Math.max(reach, hw * Math.abs(Math.sin(th)) + DEPTH * Math.abs(Math.cos(th)) - DEPTH);
      }
      gl.uniform1f(su.uReach, 0.02 + reach);
      gl.uniform1f(su.uBusy, reach > 0 ? 1 : 0);
      // x: how fast the lit sweep widens with distance from the lens; y: where it ends in front of the word
      gl.uniform2f(su.uWide, ((cssW / cssH) * 0.5 * 1.12) / foc, -DIST + (foc * EYE) / (1 - base + (foc * EYE) / DIST) - 1.3);
      gl.uniform2fv(su.uCol, colArr); gl.uniform1fv(su.uTurn, turnArr); gl.uniform1fv(su.uMid, midArr); gl.uniform3fv(su.uAbs, absorb);
      gl.uniform1i(su.uSdf, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (canAcc && post) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.disable(gl.BLEND);
        gl.useProgram(post);
        gl.uniform1i(pu.uAcc, 1); gl.uniform2f(pu.uRes, W, H);
        gl.uniform1f(pu.uGrain, still ? 1 : s.frame % 64);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };

    // Which letter stands under a point of the frame, or -1.
    const letterAt = (clientX: number, clientY: number) => {
      const r = box.getBoundingClientRect(), { foc, shift, cx } = lens();
      const ux = (clientX - r.left - cssW / 2) / cssH, uy = (cssH / 2 - (clientY - r.top)) / cssH - shift;
      const t = (DIST - DEPTH) / foc, x = cx + ux * t, y = EYE + uy * t;
      if (y < 0 || y > word.tall + 0.1) return { i: -1, side: 1 };
      const i = word.spans.findIndex((sp) => x > sp[0] - 0.03 && x < sp[1] + 0.03);
      return { i, side: i >= 0 && x < (word.spans[i][0] + word.spans[i][1]) / 2 ? -1 : 1 };
    };

    // Every letter stands on a pivot. A push sends it round once: it winds up a little, swings through, leans past the mark and settles.
    // The letters either side feel it a moment later and shiver.
    const back = (x: number) => { const c = 1.15; return x < 0.5 ? (Math.pow(2 * x, 2) * ((c + 1) * 2 * x - c)) / 2 : (Math.pow(2 * x - 2, 2) * ((c + 1) * (x * 2 - 2) + c) + 2) / 2; };
    const spin = (i: number, turn: number) => {
      if (reduce || i < 0 || i >= count || s.spinT[i] >= 0) return;
      s.spinT[i] = 0; s.from[i] = s.rest[i]; s.rest[i] += Math.PI * 2 * turn;
      wake();
    };
    const push = (from: number, turn: number) => {
      for (let i = 0; i < count; i++) { const n = Math.abs(i - from); if (n) s.due.push({ at: s.now + 180 + n * 110, i, v: turn * 2.6 * Math.pow(0.55, n - 1) * (n % 2 ? -1 : 1), turn: 0 }); }
      spin(from, turn);
    };
    const wave = () => { for (let i = 0; i < count; i++) s.due.push({ at: s.now + i * 170, i, v: 0, turn: 1 }); wake(); };
    api.current = { nudge: () => { s.touched = true; wave(); } };

    const frame = (now: number) => {
      s.raf = 0;
      if (!s.visible || !s.alive) return;
      const dtRaw = s.last ? (now - s.last) / 1000 : 0.016;
      const dt = Math.min(0.033, dtRaw);
      s.last = now; s.now = now; s.frame++;
      // it opens finished and holds; then, until someone touches it, a push runs along the word every few seconds
      if (!s.t0) { s.t0 = now; s.demoAt = now + 4300; }
      if (!still && !s.touched && now > s.demoAt) { wave(); s.demoAt = now + 9500; }

      let moving = false, busy = false;
      if (!reduce) {
        for (let n = s.due.length - 1; n >= 0; n--) if (s.due[n].at <= now) { const e = s.due[n]; s.due.splice(n, 1); if (e.turn) spin(e.i, e.turn); else if (s.spinT[e.i] < 0) s.v[e.i] += e.v; }
        if (s.due.length) moving = true;
        for (let i = 0; i < count; i++) {
          let want = s.rest[i];
          const turning = s.spinT[i] >= 0;
          if (turning) {
            s.spinT[i] += dt / 1.85;
            if (s.spinT[i] >= 1) s.spinT[i] = -1; else want = s.from[i] + (s.rest[i] - s.from[i]) * back(s.spinT[i]);
          }
          const stiff = turning ? 170 : 46, damp = turning ? 24 : 5.2;
          for (let k = 0; k < 3; k++) { s.v[i] += (stiff * (want - s.a[i]) - damp * s.v[i]) * (dt / 3); s.a[i] += s.v[i] * (dt / 3); }
          if (turning || Math.abs(s.v[i]) > 0.004 || Math.abs(want - s.a[i]) > 0.0006) { moving = true; busy = true; }
          else { s.a[i] = want; s.v[i] = 0; }
        }
      }
      if (!still) {
        s.sx += (s.px - s.sx) * (1 - Math.exp(-dt * 2.6)); s.sy += (s.py - s.sy) * (1 - Math.exp(-dt * 2.6));
        moving = true;
      }
      const fast = busy || Math.abs(s.px - s.sx) + Math.abs(s.py - s.sy) > 0.02;
      if (s.fresh || !canAcc) { draw(1, 0); s.fresh = false; s.count = 1; }
      else if (moving) { draw(fast ? 0.5 : still ? 0.5 : 0.12, 1 + (s.frame % 64)); s.count = still ? 1 : 6; }
      else if (s.count < 48) { s.count++; draw(1 / s.count, s.count); }
      if (s.first) { s.first = false; setShown("gl"); }

      // measured, not guessed: if frames run long for a while, give up some resolution
      if (!still && dtRaw > 0.026) s.slow++; else s.slow = Math.max(0, s.slow - 2);
      if (s.slow > 45 && scale > 0.45) { scale *= 0.82; s.slow = 0; size(); }

      if (moving || s.count < 48) s.raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!s.raf && s.visible && s.alive) { s.last = 0; s.raf = requestAnimationFrame(frame); } };

    size();
    const ro = new ResizeObserver(() => { size(); wake(); });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting && !document.hidden; if (s.visible) wake(); }, { threshold: 0.05 });
    io.observe(box);
    const vis = () => { s.visible = !document.hidden; if (s.visible) wake(); };
    document.addEventListener("visibilitychange", vis);
    // if a web font arrives after the first frame, cast the word again in it
    const fontIn = () => !!document.fonts?.check(`${WEIGHT} 40px ${FONT.split(",")[0]}`);
    const hadFont = fontIn();
    document.fonts?.ready.then(() => {
      if (!s.alive || fontIn() === hadFont) return;
      word = bakeWord(brand.word); plate();
      s.count = 0; s.fresh = true; wake();
    });

    const move = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      if (e.pointerType !== "touch") { s.px = ((e.clientX - r.left) / r.width) * 2 - 1; s.py = ((e.clientY - r.top) / r.height) * 2 - 1; }
      const on = !reduce && letterAt(e.clientX, e.clientY).i >= 0;
      if (on !== s.over) { s.over = on; pad.style.cursor = on ? "pointer" : ""; }
      if (!still) wake();
    };
    const tap = (e: PointerEvent) => {
      const at = letterAt(e.clientX, e.clientY);
      if (at.i < 0) return;
      s.touched = true;
      // the side that is pressed goes away from you
      push(at.i, -at.side);
    };
    const leave = () => { s.px = 0; s.py = 0; };
    box.addEventListener("pointermove", move);
    pad.addEventListener("pointerdown", tap);
    box.addEventListener("pointerleave", leave);
    const lost = (e: Event) => { e.preventDefault(); setShown("still"); };
    cv.addEventListener("webglcontextlost", lost);
    wake();

    return () => {
      s.alive = false;
      cancelAnimationFrame(s.raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      box.removeEventListener("pointermove", move); pad.removeEventListener("pointerdown", tap);
      box.removeEventListener("pointerleave", leave); cv.removeEventListener("webglcontextlost", lost);
      api.current = null;
    };
  }, []);

  const ring = "outline-none focus-visible:ring-2 focus-visible:ring-[#1a1511] focus-visible:ring-offset-2 focus-visible:ring-offset-[#efece6]";
  return (
    <footer className="relative isolate overflow-hidden bg-[#efece6] text-[#1a1511]" style={{ fontFamily: FONT }}>
      <style>{`
        @keyframes cast-glass-wordmark-footer-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .cast-glass-wordmark-footer-rise { animation: cast-glass-wordmark-footer-rise 700ms cubic-bezier(0.2, 0.9, 0.2, 1) both; }
        .cast-glass-wordmark-footer-link { background-image: linear-gradient(currentColor, currentColor); background-repeat: no-repeat; background-position: 0 100%; background-size: 0% 1.5px; transition: background-size 320ms cubic-bezier(0.2, 0.9, 0.2, 1); }
        .cast-glass-wordmark-footer-link:hover, .cast-glass-wordmark-footer-link:focus-visible { background-size: 100% 1.5px; }
        @media (prefers-reduced-motion: reduce) { .cast-glass-wordmark-footer-rise { animation: none; } .cast-glass-wordmark-footer-link { transition: none; } }
      `}</style>
      <div ref={stage} className="relative h-[900px] w-full sm:h-[860px] lg:h-[840px]" style={{ background: "linear-gradient(180deg, #ebe9e6 0%, #efede9 46%, #f4f1ea 74%, #f1ede5 100%)" }}>
        {shown === "still" && <Still />}
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${shown === "gl" ? "opacity-100" : "opacity-0"}`} />
        <div ref={hit} aria-hidden="true" className="absolute inset-0 select-none" style={{ touchAction: "pan-y" }} />

        <div className="pointer-events-none absolute inset-0 mx-auto flex max-w-[1440px] flex-col justify-between px-6 pb-6 pt-9 sm:px-10 lg:px-16 lg:pb-8 lg:pt-14">
          <div className="cast-glass-wordmark-footer-rise grid gap-x-10 gap-y-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#4a423a]">{brand.name}</p>
              <p className="mt-4 max-w-[17ch] text-[30px] italic leading-[1.06] tracking-[-0.015em] sm:text-[34px] lg:mt-5 lg:text-[44px]" style={{ fontFamily: SERIF }}>{brand.line}</p>
              <p className="mt-5 hidden text-[13px] leading-[1.55] text-[#4a423a] lg:block">{brand.place[0]}<br />{brand.place[1]}</p>
            </div>
            <nav aria-label="Footer" className="pointer-events-auto grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
              {columns.map((col) => (
                <div key={col.title}>
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#4a423a]">{col.title}</h3>
                  <ul className="mt-3 lg:mt-5">
                    {col.links.map((l) => (
                      <li key={l}><a href="#" className={`cast-glass-wordmark-footer-link inline-flex h-10 items-center whitespace-nowrap text-[17px] font-medium tracking-[-0.015em] lg:h-[42px] lg:text-[20px] ${ring}`}>{l}</a></li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-1 text-[12px] font-medium tracking-[0.02em] text-[#3a332c]">
            <p>{brand.legal}</p>
            <div className="pointer-events-auto flex flex-wrap items-center gap-x-6">
              {shown === "gl" && !calm && (
                <button type="button" onClick={() => api.current?.nudge()} className={`hidden h-10 items-center gap-2 rounded-full text-[11px] font-semibold uppercase tracking-[0.24em] sm:inline-flex ${ring}`}>
                  <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 10a6.5 6.5 0 1 1-2.2-4.9M16.6 3.2v3.4h-3.4" /></svg>
                  Turn the letters
                </button>
              )}
              <ul className="flex items-center gap-x-5">
                {small.map((l) => (
                  <li key={l}><a href="#" className={`cast-glass-wordmark-footer-link inline-flex h-10 items-center ${ring}`}>{l}</a></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
