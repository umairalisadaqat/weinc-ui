import { useEffect, useRef, useState } from "react";

// The three settings. `mark` is signwritten on the plate under its switch.
const switches = [
  { mark: "HALL", label: "Hall pendant", note: "The brass shade over the stairs.", start: true },
  { mark: "LANDING", label: "Landing lamp", note: "Low and warm, for the walk up.", start: true },
  { mark: "PORCH", label: "Porch light", note: "A glow by the front door till late.", start: true },
];
const THROW = 0.5; // radians each dolly leans from straight out, up for on and down for off
const PLATE: [number, number, number] = [0.105, 0.14, 0.095]; // the painted board, linear RGB (sage)
const WALL: [number, number, number] = [0.76, 0.62, 0.47]; // the limewashed wall, linear RGB
const BAKELITE: [number, number, number] = [0.032, 0.011, 0.006]; // the dollies, linear RGB
const LAMP_SPREAD = 0.83; // cosine of the half angle of each lampshade's upward cone (bigger is narrower)
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';

const SX = 1.3; // switch spacing on the plate (scene units)
const SY = 0.16; // height of the switch row above the plate's centre
const PZ = 0.11; // plate thickness

const VERT = `ATTR vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

const TONE = `
vec3 curve(vec3 x){ return clamp(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
vec3 tone(vec3 x){ x *= 0.74; float m = max(max(x.r, x.g), max(x.b, 1e-4)); vec3 h = x * (curve(vec3(m)).r / m); return pow(mix(curve(x), h, 0.4), vec3(1.0 / 2.2)); }
`;

// A painted board on a limewashed wall, three porcelain bases with bakelite dollies, window sun from the
// upper left, and three lampshades out of frame below that throw cones of light up the wall when lit.
const SCENE = `
precision highp float;
uniform vec2 uRes; uniform vec4 uJit; uniform float uSeed;
uniform vec3 uAng; uniform vec3 uLamp; uniform vec3 uCam; uniform vec3 uTgt; uniform float uFoc; uniform vec2 uShift; uniform float uFocus;
uniform vec3 uSunD; uniform float uSunI; uniform vec2 uGobo; uniform float uDirect; uniform sampler2D uTex;
uniform vec3 uPlate; uniform vec3 uWall; uniform vec3 uBak; uniform float uSpread;
const float SX = ${SX.toFixed(3)}; const float SY = ${SY.toFixed(3)}; const float PZ = ${PZ.toFixed(3)};
const vec2 PH = vec2(2.1, 0.98);
const vec3 SUNC = vec3(1.0, 0.86, 0.68);
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float smin(float a, float b, float k){ float h = max(k - abs(a - b), 0.0) / k; return min(a, b) - h * h * k * 0.25; }
float smax(float a, float b, float k){ return -smin(-a, -b, k); }
float sdRRect(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
float sdRBox(vec3 p, vec3 b, float r){ vec3 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r; }
float slab(float d2, float y, float h, float r){ vec2 w = vec2(d2, abs(y - 0.5 * h) - 0.5 * h) + r; return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - r; }

float idxOf(float x){ return clamp(floor(x / SX + 0.5), -1.0, 1.0); }
float pick(vec3 v, float i){ return i < -0.5 ? v.x : (i > 0.5 ? v.z : v.y); }

float sdPlate(vec3 p){ return slab(sdRRect(p.xy, PH, 0.2), p.z, PZ, 0.045); }
float sdBase(vec3 p){
  float i = idxOf(p.x); vec3 q = p - vec3(i * SX, SY, PZ);
  float r = length(q.xy);
  float d = slab(r - 0.45, q.z + 0.02, 0.25, 0.12);
  d = max(d, -(length(vec2(r - 0.27, q.z - 0.228)) - 0.011));
  d = smax(d, -sdRBox(q - vec3(0.0, 0.0, 0.25), vec3(0.088, 0.205, 0.12), 0.05), 0.02);
  return d;
}
vec3 dollyL(vec3 p){
  float i = idxOf(p.x); vec3 u = p - vec3(i * SX, SY, PZ + 0.09);
  float a = pick(uAng, i); float c = cos(a); float s = sin(a);
  return vec3(u.x, c * u.y - s * u.z, s * u.y + c * u.z);
}
float sdDolly(vec3 p){
  vec3 r = dollyL(p);
  float h = clamp(r.z / 0.5, 0.0, 1.0);
  float stem = sdRBox(r - vec3(0.0, 0.0, 0.25), vec3(mix(0.066, 0.05, h), mix(0.052, 0.04, h), 0.25), 0.034);
  vec3 e = (r - vec3(0.0, 0.0, 0.5)) / vec3(0.08, 0.064, 0.072);
  return smin(stem, (length(e) - 1.0) * 0.064, 0.05);
}
float sdScrew(vec3 p){
  vec3 q = vec3(abs(p.x) - SX * 0.5, p.y - SY, p.z - PZ);
  float d = max(length(q + vec3(0.0, 0.0, 0.05)) - 0.082, -q.z);
  float a = p.x > 0.0 ? 0.6 : -0.3;
  return max(d, -max(abs(q.x * cos(a) + q.y * sin(a)) - 0.011, 0.018 - q.z));
}
float map(vec3 p){ return min(min(sdPlate(p), sdBase(p)), min(sdDolly(p), sdScrew(p))); }

vec2 bound(vec3 ro, vec3 rd){
  vec3 inv = 1.0 / (rd + vec3(1e-6)); vec3 lo = (vec3(-2.2, -1.1, 0.0) - ro) * inv; vec3 hi = (vec3(2.2, 1.1, 0.95) - ro) * inv;
  vec3 a = min(lo, hi); vec3 b = max(lo, hi);
  return vec2(max(max(a.x, a.y), max(a.z, 0.0)), min(b.x, min(b.y, b.z)));
}
float march(vec3 ro, vec3 rd, int n){
  vec2 tb = bound(ro, rd); if (tb.x > tb.y) return -1.0;
  float t = tb.x;
  for (int i = 0; i < 90; i++) { if (i >= n) break; float d = map(ro + rd * t); if (d < 0.0006 * (1.0 + t * 0.2)) return t; t += d * 0.85; if (t > tb.y) break; }
  return -1.0;
}
vec3 calcN(vec3 p){
  vec2 e = vec2(0.0011, -0.0011);
  return normalize(e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) + e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx));
}
float calcAO(vec3 p, vec3 n){
  float o = 0.0; float s = 1.0;
  for (int i = 1; i <= 5; i++) { float h = 0.015 + 0.06 * float(i); o += (h - map(p + n * h)) * s; s *= 0.72; }
  return clamp(1.0 - 2.0 * o, 0.0, 1.0);
}
float shadow(vec3 ro, vec3 rd, float k, float tmax){
  float res = 1.0; float t = 0.02;
  for (int i = 0; i < 34; i++) { float h = map(ro + rd * t); res = min(res, k * h / t); t += clamp(h, 0.02, 0.25); if (res < 0.01 || t > tmax) break; }
  return clamp(res, 0.0, 1.0);
}

// The window: its four panes and glazing bars, projected along the sun onto whatever it lands on.
float gobo(vec3 p, float pen){
  vec3 u = normalize(cross(vec3(0.0, 1.0, 0.0), uSunD)); vec3 v = cross(uSunD, u);
  vec2 w = vec2(dot(p, u), dot(p, v)) - uGobo;
  w = vec2(w.x * 0.97 + w.y * 0.24, w.y * 0.97 - w.x * 0.24);
  float frame = smoothstep(pen, -pen, max(abs(w.x) - 1.05, abs(w.y) - 1.5));
  float bars = smoothstep(0.035, 0.035 + pen, abs(w.x - 0.02)) * smoothstep(0.035, 0.035 + pen, abs(w.y + 0.35));
  // the edge of a linen curtain, soft and a little uneven
  float cur = smoothstep(-0.2 - pen * 3.0, 0.2 + pen * 3.0, w.x + 0.75 + 0.1 * sin(w.y * 2.3 + uGobo.x * 4.0));
  return frame * bars * mix(0.25, 1.0, cur);
}
vec3 sunL(vec3 p, vec3 n, float sh){ return SUNC * 2.6 * uSunI * gobo(p, 0.06 + 0.05 * p.z) * max(dot(n, uSunD), 0.0) * sh; }
vec3 fillL(vec3 n, float ao){
  // the room: warm bounce off the floor and walls, a cool trace of sky from the window side
  return 0.7 * (vec3(0.36, 0.31, 0.26) * (0.55 + 0.45 * n.z) + vec3(0.2, 0.22, 0.26) * max(dot(n, normalize(uSunD + vec3(0.0, 0.4, 0.0))), 0.0) + vec3(0.2, 0.13, 0.08) * max(-n.y, 0.0)) * ao * (0.55 + 0.45 * uSunI);
}
vec3 lampPos(float i){ return vec3(i * SX, 2.8, 0.5); }
vec3 lampCol(float l){ return mix(vec3(1.0, 0.26, 0.05), vec3(1.0, 0.5, 0.2), clamp(l, 0.0, 1.0)); }
// Three lampshades below the frame, each throwing a cone of light up the wall.
vec3 lamps(vec3 p, vec3 n, float doShadow){
  vec3 acc = vec3(0.0);
  for (int k = 0; k < 3; k++) {
    float i = float(k) - 1.0; float l = pick(uLamp, i);
    if (l < 0.003) continue;
    vec3 v = p - lampPos(i); float d2 = dot(v, v); vec3 dir = v * inversesqrt(d2);
    float cone = smoothstep(uSpread - 0.008, uSpread + 0.012, -dir.y) * (0.75 + 0.45 * smoothstep(uSpread + 0.016, uSpread, -dir.y) + 0.25 * smoothstep(uSpread + 0.02, 1.0, -dir.y));
    float ndl = max(dot(n, -dir), 0.0);
    if (cone * ndl < 1e-3) continue;
    float sh = doShadow > 0.5 ? shadow(p + n * 0.01, -dir, 7.0, 3.5) : 1.0;
    acc += lampCol(l) * l * 26.0 * cone * ndl * sh / d2;
  }
  return acc;
}

float rectL(vec3 ro, vec3 rd, vec3 c, vec3 n, vec3 u, vec2 hs, float soft){
  float dn = dot(rd, n); if (dn > -1e-4) return 0.0;
  float t = dot(c - ro, n) / dn; if (t < 0.0) return 0.0;
  vec3 q = ro + rd * t - c; vec3 v = cross(n, u); float s = soft * t;
  vec2 d = abs(vec2(dot(q, u), dot(q, v))) - hs + 0.1;
  float e = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - 0.1;
  return smoothstep(s, -s, e);
}
vec3 env(vec3 ro, vec3 rd, float rough){
  vec3 c = mix(vec3(0.17, 0.14, 0.11), vec3(0.34, 0.31, 0.28), smoothstep(-0.4, 0.7, rd.y)) * (0.5 + 0.5 * uSunI);
  vec3 wn = -uSunD; vec3 wu = normalize(cross(vec3(0.0, 1.0, 0.0), wn));
  c += vec3(1.0, 0.94, 0.84) * 9.0 * uSunI * rectL(ro, rd, uTgt + uSunD * 9.0, wn, wu, vec2(1.5, 2.1), 0.006 + rough);
  for (int k = 0; k < 3; k++) {
    float i = float(k) - 1.0; float l = pick(uLamp, i);
    c += lampCol(l) * l * 5.0 * rectL(ro, rd, lampPos(i) + vec3(0.0, 0.25, 0.0), vec3(0.0, 0.0, -1.0), vec3(1.0, 0.0, 0.0), vec2(0.5, 0.32), 0.02 + rough);
  }
  return c;
}

vec3 plateAlb(vec3 p, vec3 n){
  // sage paint laid on with a brush, worn back to the cream undercoat on the arrises
  float brush = n2(vec2(p.x * 3.0, p.y * 60.0)) * 0.6 + n2(vec2(p.x * 9.0, p.y * 140.0)) * 0.4;
  vec3 a = uPlate * (0.96 + 0.035 * brush + 0.1 * n2(p.xy * 2.5));
  float edge = 1.0 - smoothstep(0.55, 0.92, n.z);
  float wear = smoothstep(0.55, 0.75, n2(p.xy * 11.0) * 0.7 + n2(p.xy * 47.0) * 0.3 + edge * 0.45);
  a = mix(a, vec3(0.62, 0.55, 0.42), wear * edge);
  if (n.z > 0.9) {
    vec2 uv = vec2(p.x / (2.0 * PH.x) + 0.5, 0.5 - p.y / (2.0 * PH.y));
    float ink = texture2D(uTex, uv).r;
    a = mix(a, vec3(0.78, 0.7, 0.52), ink * (0.85 + 0.15 * n2(p.xy * 90.0)));
  }
  return a;
}
float wallNoise(vec2 p){ return n2(p * 1.2) * 0.55 + n2(p * 5.0 + 3.0) * 0.3 + n2(p * 22.0) * 0.15; }
vec3 wallN(vec3 p){
  vec2 e = vec2(0.01, 0.0);
  float h = wallNoise(p.xy);
  return normalize(vec3(-(wallNoise(p.xy + e) - h) * 1.6 - (n2(p.xy * 60.0) - 0.5) * 0.06, -(wallNoise(p.xy + e.yx) - h) * 1.6 - (n2(p.yx * 60.0 + 4.0) - 0.5) * 0.06, 1.0));
}
vec3 wallAlb(vec3 p){ return uWall * (0.88 + 0.16 * n2(p.xy * 0.9 + 7.0) + 0.06 * n2(p.xy * 6.0)); }

// Cheap shading for what a reflection sees.
vec3 lite(vec3 p, vec3 n){
  float pl = sdPlate(p); float ba = sdBase(p); float dl = sdDolly(p);
  vec3 alb = pl < min(ba, dl) ? plateAlb(p, n) : (ba < dl ? vec3(0.9, 0.89, 0.85) : uBak);
  return alb * (sunL(p, n, 1.0) + fillL(n, 1.0) + lamps(p, n, 0.0));
}
vec3 wallLite(vec3 p){ vec3 n = vec3(0.0, 0.0, 1.0); return wallAlb(p) * (sunL(p, n, 1.0) + fillL(n, 1.0) + lamps(p, n, 0.0)); }
vec3 trace(vec3 p, vec3 r, float rough){
  float t = march(p, r, 44);
  if (t > 0.0) { vec3 h = p + r * t; return lite(h, calcN(h)); }
  if (r.z < 0.0) return wallLite(p + r * (-p.z / r.z));
  return env(p, r, rough);
}

vec3 shadeObj(vec3 p, vec3 n, vec3 rd, vec2 rnd){
  float pl = sdPlate(p); float ba = sdBase(p); float dl = sdDolly(p); float sc = sdScrew(p);
  float m = min(min(pl, ba), min(dl, sc));
  vec3 gn = n;
  float ao = calcAO(p, gn);
  float sh = shadow(p + gn * 0.01, uSunD, 12.0, 4.0);
  vec3 ll = lamps(p + gn * 0.004, gn, 1.0);
  if (m == sc) {
    vec3 f0 = vec3(0.95, 0.72, 0.38);
    vec3 F = f0 + (1.0 - f0) * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0);
    vec3 r = normalize(reflect(rd, n) + vec3(rnd, rnd.x * rnd.y) * 0.08);
    return F * (trace(p + n * 0.006, r, 0.15) * (0.4 + 0.6 * ao) + 0.25 * (sunL(p, n, sh) + fillL(n, ao) + ll));
  }
  vec3 alb; float f0; float rough; float wrap = 0.0;
  if (m == dl) {
    // phenolic resin: very dark oxblood, a faint swirl from the mould, polished by thumbs
    vec3 q = dollyL(p);
    alb = uBak * (0.75 + 0.55 * n2(q.yz * 26.0 + q.x * 14.0));
    n = normalize(n + (vec3(n2(q.yz * 40.0), n2(q.zx * 40.0), n2(q.xy * 40.0)) - 0.5) * 0.012);
    f0 = 0.05; rough = 0.012;
  } else if (m == ba) {
    // glazed porcelain: white, a hair warm, light soaks in a little
    alb = vec3(0.9, 0.885, 0.84);
    n = normalize(n + (vec3(n2(p.xy * 8.0), n2(p.yz * 8.0 + 2.0), n2(p.zx * 8.0 + 5.0)) - 0.5) * 0.016);
    f0 = 0.045; rough = 0.02; wrap = 0.3;
  } else {
    alb = plateAlb(p, gn);
    float b = n2(vec2(p.x * 3.0, p.y * 60.0));
    n = normalize(n + vec3((n2(p.xy * 30.0) - 0.5) * 0.012, (b - 0.5) * 0.01, 0.0));
    f0 = 0.035; rough = 0.16;
  }
  float ndl = dot(n, uSunD);
  vec3 sun = SUNC * 2.6 * uSunI * gobo(p, 0.06 + 0.05 * p.z) * clamp((ndl + wrap) / (1.0 + wrap), 0.0, 1.0) * mix(sh, 1.0, wrap * 0.15);
  vec3 col = alb * (sun + fillL(n, ao) + ll);
  // a little light passes into the porcelain and comes back warmer
  if (wrap > 0.0) col += vec3(0.95, 0.75, 0.55) * alb * (ll * 0.12 + sun * 0.06);
  float fr = f0 + (1.0 - f0) * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0);
  vec3 r = normalize(reflect(rd, n) + vec3(rnd, rnd.x * rnd.y) * rough);
  float occ = smoothstep(0.0, 0.18, map(p + r * 0.18) + 0.02);
  return col + fr * trace(p + gn * 0.006, r, rough) * mix(ao, 1.0, 0.3) * mix(occ, 1.0, 0.5);
}

vec3 shadeWall(vec3 p, vec3 rd){
  vec3 n = wallN(p);
  vec3 alb = wallAlb(p);
  float near = step(abs(p.x), 6.0) * step(abs(p.y), 4.5);
  float ao = 1.0; float sh = 1.0;
  if (near > 0.5) {
    ao = calcAO(p, vec3(0.0, 0.0, 1.0));
    sh = shadow(p + vec3(0.0, 0.0, 0.004), uSunD, 9.0, 4.0);
  }
  vec3 col = alb * (sunL(p, n, sh) + fillL(n, ao) + lamps(p, n, near));
  // a few grains of sand in the lime that catch the sun
  vec2 cell = floor(p.xy * 40.0); vec2 cp = (cell + 0.2 + 0.6 * vec2(h21(cell + 3.1), h21(cell + 7.7))) / 40.0;
  col += step(0.985, h21(cell)) * smoothstep(0.006, 0.0, length(p.xy - cp)) * sunL(p, n, sh) * 0.5;
  return col;
}

void main(){
  vec2 fc = gl_FragCoord.xy + uJit.xy;
  vec2 uv = (fc - 0.5 * uRes) / uRes.y - uShift;
  vec3 fw = normalize(uTgt - uCam); vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0))); vec3 up = cross(rt, fw);
  vec3 rd = normalize(fw * uFoc + rt * uv.x + up * uv.y);
  vec3 ro = uCam;
  vec3 fp = ro + rd * (uFocus / dot(rd, fw));
  ro += rt * uJit.z + up * uJit.w; rd = normalize(fp - ro);
  float ign = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))) + uSeed);
  float ang = ign * 6.2831853; float rr = sqrt(fract(ign * 7.13 + uSeed * 3.7));
  vec2 rnd = vec2(cos(ang), sin(ang)) * rr * step(0.001, uSeed);
  float t = march(ro, rd, 90);
  float tw = rd.z < 0.0 ? -ro.z / rd.z : 1e9;
  vec3 col;
  if (t > 0.0 && t < tw) { vec3 p = ro + rd * t; col = shadeObj(p, calcN(p), rd, rnd); }
  else if (tw < 1e8) col = shadeWall(ro + rd * tw, rd);
  else col = env(ro, rd, 0.0);
  col = min(col, vec3(24.0));
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
  vec2 px = 1.0 / uRes;
  vec3 nb = texture2D(uAcc, uv + vec2(px.x, 0.0)).rgb + texture2D(uAcc, uv - vec2(px.x, 0.0)).rgb + texture2D(uAcc, uv + vec2(0.0, px.y)).rgb + texture2D(uAcc, uv - vec2(0.0, px.y)).rgb;
  c = max(c + (c - nb * 0.25) * 0.4, 0.0);
  vec3 b = vec3(0.0);
  for (int i = 0; i < 20; i++) {
    float a = float(i) * 2.39996; float r = sqrt((float(i) + 0.5) / 20.0);
    vec3 s = texture2D(uAcc, uv + vec2(cos(a), sin(a)) * r * 0.035 * vec2(uRes.y / uRes.x, 1.0)).rgb;
    b += min(max(s - 3.0, 0.0), vec3(8.0)) * (1.0 - 0.6 * r);
  }
  c += b * 0.006;
  vec2 q = (uv - uCentre) * vec2(uRes.x / uRes.y, 1.0);
  c *= 1.0 - 0.22 * smoothstep(0.35, 1.3, length(q));
  c = tone(c);
  c += (h21(gl_FragCoord.xy + uGrain * 91.7) - 0.5) * 0.018;
  outC = vec4(c, 1.0);
}
`;

// The signwriting under each switch, drawn once as a plan of the plate's face.
function letters() {
  const W = 1024, H = Math.round(1024 * 0.98 / 2.1);
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const g = cv.getContext("2d");
  if (!g) return cv;
  const px = W / 4.2;
  g.fillStyle = "#000"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "middle";
  g.font = `600 ${0.13 * px}px ${SERIF}`;
  switches.forEach((sw, i) => {
    const x = W / 2 + (i - 1) * SX * px, y = H / 2 + (0.66) * px;
    // tracked out by hand, letter by letter, so the spacing follows each glyph's own width
    const chars = sw.mark.split(""); const track = 0.035 * px;
    const widths = chars.map((c) => g.measureText(c).width);
    let cx = x - (widths.reduce((a, b) => a + b, 0) + track * (chars.length - 1)) / 2;
    g.textAlign = "left";
    chars.forEach((c, k) => { g.fillText(c, cx, y); cx += widths[k] + track; });
  });
  return cv;
}

// No WebGL or reduced motion before the first frame: the same plate as a still.
function Still({ on }: { on: boolean[] }) {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <style>{`
        @keyframes porcelain-wall-switch-sun { 0%, 100% { transform: translate(0, 0) rotate(-24deg); } 50% { transform: translate(14px, -8px) rotate(-23deg); } }
        .porcelain-wall-switch-sun { animation: porcelain-wall-switch-sun 9s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .porcelain-wall-switch-sun { animation: none; } }
      `}</style>
      <div className="porcelain-wall-switch-sun absolute left-[38%] top-[-30%] h-[120%] w-[34%] blur-[6px]" style={{ background: "linear-gradient(90deg, rgba(255,226,180,0.6) 0 47%, transparent 47% 51%, rgba(255,226,180,0.6) 51%), linear-gradient(0deg, transparent 0 55%, rgba(120,90,60,0.5) 55% 57%, transparent 57%)", mixBlendMode: "screen" }} />
      <div className="absolute left-1/2 top-1/2 h-[230px] w-[480px] -translate-x-1/2 -translate-y-1/2 scale-[0.68] sm:scale-90 lg:left-[66%] lg:scale-110">
        {on.map((v, i) => (
          <div key={i} className="absolute top-[-250px] h-[420px] w-[300px] blur-[10px] transition-opacity duration-500 motion-reduce:transition-none" style={{ left: 240 + (i - 1) * 156 - 150, opacity: v ? 0.9 : 0, background: "radial-gradient(70% 90% at 50% 0%, rgba(255,196,120,0.95), rgba(255,160,80,0.45) 55%, rgba(255,160,80,0) 75%)", clipPath: "polygon(50% 8%, 100% 100%, 0 100%)" }} />
        ))}
        <div className="absolute inset-0 translate-x-[-16px] translate-y-[18px] rounded-[26px] bg-[#3d2a1c]/35 blur-md" />
        <div className="absolute inset-0 rounded-[26px]" style={{ background: "linear-gradient(160deg, #6f8263, #4f5f45)", boxShadow: "inset 0 2px 0 rgba(255,255,255,0.25), inset 0 -3px 0 rgba(0,0,0,0.25)" }} />
        {on.map((v, i) => (
          <div key={i} className="absolute top-[34px] h-[116px] w-[116px] rounded-full" style={{ left: 240 + (i - 1) * 156 - 58, background: "radial-gradient(70% 70% at 35% 30%, #ffffff, #ece7dc 60%, #cbc3b4)", boxShadow: "-8px 12px 16px rgba(40,26,14,0.4)" }}>
            <div className="absolute left-1/2 top-[22px] h-[72px] w-[26px] -translate-x-1/2 rounded-[13px] bg-[#8d8578]" style={{ boxShadow: "inset 0 3px 6px rgba(0,0,0,0.45)" }} />
            <div className="absolute left-1/2 top-1/2 h-[58px] w-[22px] rounded-full transition-transform duration-300 motion-reduce:transition-none" style={{ transform: `translate(-50%, ${v ? "-92%" : "-8%"})`, background: "linear-gradient(90deg, #3a140a, #1d0804 60%, #120502)", boxShadow: "inset 2px 0 0 rgba(255,210,180,0.35), 0 4px 6px rgba(0,0,0,0.35)" }} />
          </div>
        ))}
        {switches.map((sw, i) => (
          <span key={sw.mark} className="absolute bottom-[22px] w-[140px] -translate-x-1/2 text-center text-[13px] font-semibold tracking-[0.2em] text-[#efe4c8]" style={{ left: 240 + (i - 1) * 156, fontFamily: SERIF }}>{sw.mark}</span>
        ))}
      </div>
    </div>
  );
}

type Api = { set: (i: number, v: boolean, fromUser: boolean) => void };

export default function PorcelainWallSwitchSettings() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [on, setOn] = useState<boolean[]>(() => switches.map((s) => s.start));
  const [shown, setShown] = useState<"wait" | "gl" | "still">("wait");
  const onRef = useRef<boolean[]>(switches.map((s) => s.start));
  const api = useRef<Api | null>(null);

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
    const scene = link(SCENE), post = canAcc ? link(POST) : null;
    if (!scene || (canAcc && !post)) { setShown("still"); return; }
    const names = ["uRes", "uJit", "uSeed", "uAng", "uLamp", "uCam", "uTgt", "uFoc", "uShift", "uFocus", "uSunD", "uSunI", "uGobo", "uDirect", "uTex", "uPlate", "uWall", "uBak", "uSpread"];
    const su = Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(scene, n)]));
    const pu = post ? Object.fromEntries(["uAcc", "uRes", "uGrain", "uCentre"].map((n) => [n, gl.getUniformLocation(post, n)])) : {};

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, letters());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const acc = canAcc ? gl.createTexture() : null;
    const fbo = canAcc ? gl.createFramebuffer() : null;
    let W = 0, H = 0, scale = 1, cssW = 1, cssH = 1;
    const start = onRef.current;
    const s = {
      a: start.map((v) => (v ? THROW : -THROW)), v: [0, 0, 0], want: [...start], lit: [...start], strike: [9, 9, 9], lamp: start.map((v) => (v ? 1 : 0)),
      px: 0, py: 0, sx: 0, sy: 0, count: 0, fresh: true, frame: 0, slow: 0, shake: 0, shakeV: 0,
      visible: true, raf: 0, last: 0, t0: 0, touched: false, demoAt: 0, demoK: 0, first: true,
    };
    const size = () => {
      const r = box.getBoundingClientRect();
      cssW = Math.max(1, r.width); cssH = Math.max(1, r.height);
      const dpr = Math.min(software ? 1 : 1.5, window.devicePixelRatio || 1) * scale;
      const k = Math.min(1, Math.sqrt(1.4e6 / (cssW * cssH * dpr * dpr)));
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

    // The lens: a little to the right of the plate and a touch above it, looking along the wall.
    const view = () => {
      const wide = cssW >= 1024, aspect = cssW / cssH;
      const az = 0.4 + s.sx * 0.06, el = 0.12 - s.sy * 0.04, dist = 10;
      const tgt = [0, 0.05 + s.shake, 0.2];
      const cam = [tgt[0] + dist * Math.sin(az) * Math.cos(el), tgt[1] + dist * Math.sin(el), tgt[2] + dist * Math.cos(az) * Math.cos(el)];
      const foc = wide ? 2.05 : 2.25 * Math.min(1, aspect / 1.35);
      const shift = [wide ? 0.17 * aspect : 0, wide ? 0 : 0.02];
      return { tgt, cam, foc, shift, wide };
    };
    const basis = (cam: number[], tgt: number[]) => {
      const f = [tgt[0] - cam[0], tgt[1] - cam[1], tgt[2] - cam[2]]; const fl = Math.hypot(f[0], f[1], f[2]);
      const fw = f.map((x) => x / fl);
      const r = [-fw[2], 0, fw[0]]; const rl = Math.hypot(r[0], r[2]);
      const rt = r.map((x) => x / rl);
      const up = [rt[1] * fw[2] - rt[2] * fw[1], rt[2] * fw[0] - rt[0] * fw[2], rt[0] * fw[1] - rt[1] * fw[0]];
      return { fw, rt, up };
    };

    const draw = (alpha: number, sample: number) => {
      const { tgt, cam, foc, shift, wide } = view();
      const t = (performance.now() - s.t0) / 1000;
      // the sun is low and the curtain breathes, so the window light on the wall drifts a little
      const sun = [-0.72, 0.5, 0.5]; const sl = Math.hypot(sun[0], sun[1], sun[2]);
      const lit = s.lamp[0] + s.lamp[1] + s.lamp[2];
      const jx = sample ? halton(sample, 2) - 0.5 : 0, jy = sample ? halton(sample, 3) - 0.5 : 0;
      const la = halton(sample, 5) * Math.PI * 2, lr = sample ? Math.sqrt(halton(sample, 7)) * 0.05 : 0;
      gl.useProgram(scene);
      gl.bindFramebuffer(gl.FRAMEBUFFER, canAcc ? fbo : null);
      gl.viewport(0, 0, W, H);
      if (canAcc && alpha < 1) { gl.enable(gl.BLEND); gl.blendColor(0, 0, 0, alpha); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA); } else gl.disable(gl.BLEND);
      gl.uniform2f(su.uRes, W, H);
      gl.uniform4f(su.uJit, canAcc ? jx : 0, canAcc ? jy : 0, canAcc ? Math.cos(la) * lr : 0, canAcc ? Math.sin(la) * lr : 0);
      gl.uniform1f(su.uSeed, canAcc && sample ? (sample * 0.61803) % 1 || 0.5 : 0);
      gl.uniform3f(su.uAng, s.a[0], s.a[1], s.a[2]);
      gl.uniform3f(su.uLamp, s.lamp[0], s.lamp[1], s.lamp[2]);
      gl.uniform3f(su.uCam, cam[0], cam[1], cam[2]); gl.uniform3f(su.uTgt, tgt[0], tgt[1], tgt[2]);
      gl.uniform1f(su.uFoc, foc);
      gl.uniform2f(su.uShift, shift[0], shift[1]);
      gl.uniform1f(su.uFocus, Math.hypot(cam[0] - tgt[0], cam[1] - tgt[1], cam[2] - tgt[2]) - 0.25);
      gl.uniform3f(su.uSunD, sun[0] / sl, sun[1] / sl, sun[2] / sl);
      gl.uniform1f(su.uSunI, 1 - 0.1 * lit);
      gl.uniform2f(su.uGobo, (still ? 0 : Math.sin(t * 0.23) * 0.05) - 0.55, (still ? 0 : Math.sin(t * 0.17 + 1) * 0.03) + 0.35);
      gl.uniform1i(su.uTex, 0);
      gl.uniform3f(su.uPlate, PLATE[0], PLATE[1], PLATE[2]);
      gl.uniform3f(su.uWall, WALL[0], WALL[1], WALL[2]);
      gl.uniform3f(su.uBak, BAKELITE[0], BAKELITE[1], BAKELITE[2]);
      gl.uniform1f(su.uSpread, LAMP_SPREAD);
      gl.uniform1f(su.uDirect, canAcc ? 0 : 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (canAcc && post) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.disable(gl.BLEND);
        gl.useProgram(post);
        gl.uniform1i(pu.uAcc, 1); gl.uniform2f(pu.uRes, W, H);
        gl.uniform1f(pu.uGrain, still ? 1 : s.frame % 64);
        gl.uniform2f(pu.uCentre, wide ? 0.67 : 0.5, 0.5);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };

    const set = (i: number, v: boolean, fromUser: boolean) => {
      if (fromUser) s.touched = true;
      s.want[i] = v;
      if (v !== onRef.current[i]) { const next = onRef.current.map((x, k) => (k === i ? v : x)); onRef.current = next; setOn(next); }
      if (reduce) { s.a[i] = v ? THROW : -THROW; s.v[i] = 0; s.lit[i] = v; s.lamp[i] = v ? 1 : 0; s.strike[i] = 9; s.count = 0; s.fresh = true; }
      else s.v[i] += v ? 1.2 : -1.2; // the finger starts it; the spring inside takes it over centre
      wake();
    };
    api.current = { set };

    const order = [2, 0, 1, 2, 1, 0];
    const frame = (now: number) => {
      s.raf = 0;
      if (!s.visible) return;
      const dtRaw = s.last ? (now - s.last) / 1000 : 0.016;
      const dt = Math.min(0.033, dtRaw);
      s.last = now; s.frame++;
      if (!s.t0) { s.t0 = now; s.demoAt = now + 3800; }

      // the demo opens with every lamp lit, holds, then works the switches one at a time until someone takes over
      if (!still && !s.touched && now > s.demoAt) {
        const i = order[s.demoK % order.length]; s.demoK++;
        set(i, !s.want[i], false);
        s.demoAt = now + (s.demoK % 3 === 0 ? 2600 : 1400);
      }

      let moving = false;
      if (!reduce) {
        for (let i = 0; i < 3; i++) {
          const rest = s.want[i] ? THROW : -THROW;
          const steps = 4, h = dt / steps;
          for (let k = 0; k < steps; k++) {
            // a toggle spring: it resists until the dolly passes centre, then throws it the rest of the way
            const force = 300 * (rest - s.a[i]) + (Math.sign(rest) === Math.sign(s.a[i]) ? 160 * Math.sign(rest) : -60 * Math.sign(rest));
            s.v[i] += (force - 11 * s.v[i]) * h; s.a[i] += s.v[i] * h;
            // the end stop: the dolly lands on the porcelain and kicks back, and the knock reaches the wall
            if (s.a[i] > THROW && s.v[i] > 0) { s.shakeV -= s.v[i] * 0.004; s.a[i] = THROW; s.v[i] *= -0.32; }
            if (s.a[i] < -THROW && s.v[i] < 0) { s.shakeV -= s.v[i] * 0.004; s.a[i] = -THROW; s.v[i] *= -0.32; }
          }
          if (Math.abs(s.v[i]) > 0.003 || Math.abs(rest - s.a[i]) > 0.0005) moving = true;
          else { s.a[i] = rest; s.v[i] = 0; }
          const closed = s.want[i] ? s.lit[i] || s.a[i] > THROW * 0.3 : s.a[i] > THROW * 0.6;
          if (closed && !s.lit[i]) { s.lit[i] = true; s.strike[i] = 0; }
          if (!closed && s.lit[i]) s.lit[i] = false;
          if (s.lit[i]) {
            s.strike[i] += dt;
            // the filament takes a moment to come up through orange, with a flicker as the contacts settle
            const st = s.strike[i];
            const want = (1 - Math.exp(-st * 9)) * (st > 0.05 && st < 0.085 ? 0.45 : 1);
            const d = want - s.lamp[i];
            if (Math.abs(d) > 0.002) { s.lamp[i] += d * (1 - Math.exp(-dt * 40)); moving = true; } else s.lamp[i] = want;
          } else if (s.lamp[i] > 0) {
            s.lamp[i] *= Math.exp(-dt * (s.lamp[i] > 0.2 ? 12 : 5));
            if (s.lamp[i] < 0.003) s.lamp[i] = 0;
            moving = true;
          }
        }
        s.shakeV += (-1800 * s.shake - 40 * s.shakeV) * dt; s.shake += s.shakeV * dt;
        if (Math.abs(s.shake) > 0.00005 || Math.abs(s.shakeV) > 0.002) moving = true; else { s.shake = 0; s.shakeV = 0; }
      }
      if (!still) {
        s.sx += (s.px - s.sx) * (1 - Math.exp(-dt * 3)); s.sy += (s.py - s.sy) * (1 - Math.exp(-dt * 3));
        moving = true;
      }

      const fast = s.v.some((x) => Math.abs(x) > 0.3) || s.lamp.some((l, i) => s.lit[i] ? l < 0.97 : l > 0.02);
      if (s.fresh || !canAcc) { draw(1, 0); s.fresh = false; s.count = 1; }
      else if (moving) { draw(fast ? 0.6 : still ? 0.5 : 0.12, 1 + (s.frame % 64)); s.count = still ? 1 : 6; }
      else if (s.count < 48) { s.count++; draw(1 / s.count, s.count); }
      if (s.first) { s.first = false; setShown("gl"); }

      if (!still && dtRaw > 0.026) s.slow++; else s.slow = Math.max(0, s.slow - 2);
      if (s.slow > 45 && scale > 0.5) { scale *= 0.82; s.slow = 0; size(); }

      if (moving || s.count < 48 || (!still && !s.touched)) s.raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!s.raf && s.visible) { s.last = 0; s.raf = requestAnimationFrame(frame); } };

    size();
    const ro = new ResizeObserver(() => { size(); wake(); });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting && !document.hidden; if (s.visible) wake(); }, { threshold: 0.05 });
    io.observe(box);
    const vis = () => { s.visible = !document.hidden; if (s.visible) wake(); };
    document.addEventListener("visibilitychange", vis);

    // A press on the picture finds the nearest dolly on screen.
    const click = (e: MouseEvent) => {
      const r = box.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      const { tgt, cam, foc, shift } = view();
      const { fw, rt, up } = basis(cam, tgt);
      let best = -1, bd = 1e9;
      for (let i = 0; i < 3; i++) {
        const p = [(i - 1) * SX - cam[0], SY - cam[1], PZ + 0.3 - cam[2]];
        const z = p[0] * fw[0] + p[1] * fw[1] + p[2] * fw[2];
        const sx = ((p[0] * rt[0] + p[2] * rt[2]) / z) * foc + shift[0];
        const sy = ((p[0] * up[0] + p[1] * up[1] + p[2] * up[2]) / z) * foc + shift[1];
        const X = cssW / 2 + sx * cssH, Y = cssH / 2 - sy * cssH;
        const d = Math.hypot(mx - X, (my - Y) * 0.6);
        if (d < bd) { bd = d; best = i; }
      }
      if (best >= 0 && bd < cssH * 0.22) set(best, !onRef.current[best], true);
    };
    const move = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      s.px = ((e.clientX - r.left) / r.width) * 2 - 1; s.py = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (!still) wake();
    };
    const leave = () => { s.px = 0; s.py = 0; };
    box.addEventListener("click", click);
    box.addEventListener("pointermove", move);
    box.addEventListener("pointerleave", leave);
    const lost = (e: Event) => { e.preventDefault(); setShown("still"); };
    cv.addEventListener("webglcontextlost", lost);
    wake();

    return () => {
      cancelAnimationFrame(s.raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      box.removeEventListener("click", click);
      box.removeEventListener("pointermove", move); box.removeEventListener("pointerleave", leave);
      cv.removeEventListener("webglcontextlost", lost);
      api.current = null;
    };
  }, []);

  const toggle = (i: number) => {
    const v = !onRef.current[i];
    if (api.current) api.current.set(i, v, true);
    else { const next = onRef.current.map((x, k) => (k === i ? v : x)); onRef.current = next; setOn(next); }
  };

  const count = on.filter(Boolean).length;
  const summary = count === 3 ? "Every lamp is lit." : count === 0 ? "The house is dark." : `${["", "One", "Two"][count]} of three lamps lit.`;

  return (
    <section className="relative isolate overflow-hidden bg-[#e6d3bd] text-[#2b1d14]" style={{ fontFamily: FONT }}>
      <div className="relative flex flex-col lg:block lg:h-[760px]">
        <div ref={stage} className="relative h-[430px] w-full cursor-pointer select-none sm:h-[520px] lg:absolute lg:inset-0 lg:h-full" style={{ background: "radial-gradient(80% 80% at 66% 45%, #ecdcc6 0%, #dcc5aa 60%, #c9ad8e 100%)", touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}>
          <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${shown === "gl" ? "opacity-100" : "opacity-0"}`} />
          {shown === "still" && <Still on={on} />}
        </div>

        <div className="pointer-events-none relative px-5 pb-10 pt-6 sm:px-10 lg:absolute lg:inset-y-0 lg:left-0 lg:flex lg:w-[40%] lg:flex-col lg:justify-center lg:px-16 lg:py-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[#5a3f2c]">Lights, front of the house</p>
          <h2 className="mt-4 text-[52px] leading-[0.92] tracking-[-0.035em] text-[#2b1d14] sm:text-[64px] lg:text-[84px]" style={{ fontFamily: SERIF }}>
            Leave a<br />light on.
          </h2>
          <p aria-live="polite" className="mt-4 text-[15px] font-medium tracking-[-0.01em] text-[#5a3f2c]">{summary}</p>
          <ul className="pointer-events-auto mt-6 max-w-[26rem] divide-y divide-[#2b1d14]/15 border-y border-[#2b1d14]/15">
            {switches.map((sw, i) => (
              <li key={sw.mark}>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on[i]}
                  onClick={() => toggle(i)}
                  className="group flex min-h-[64px] w-full items-center gap-4 rounded-md py-3 text-left outline-none transition-colors duration-200 hover:bg-[#2b1d14]/[0.04] focus-visible:ring-2 focus-visible:ring-[#2b1d14] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e6d3bd]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[17px] font-semibold tracking-[-0.015em] text-[#2b1d14]">{sw.label}</span>
                    <span className="block text-[14px] leading-snug text-[#5a3f2c]">{sw.note}</span>
                  </span>
                  <span className="w-8 text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-[#5a3f2c]" aria-hidden="true">{on[i] ? "On" : "Off"}</span>
                  <span aria-hidden="true" className={`relative block h-7 w-12 shrink-0 rounded-full ring-1 ring-inset transition-colors duration-200 motion-reduce:transition-none ${on[i] ? "bg-[#4a1a0c] ring-[#4a1a0c]" : "bg-[#f3e8d8] ring-[#2b1d14]/25"}`}>
                    <span className={`absolute left-[3px] top-[3px] block h-[22px] w-[22px] rounded-full shadow-[0_1px_3px_rgba(43,29,20,0.4)] transition-transform duration-300 ease-[cubic-bezier(0.3,1.6,0.5,1)] motion-reduce:transition-none ${on[i] ? "translate-x-5 bg-[#ffd9a0]" : "bg-white"}`} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
