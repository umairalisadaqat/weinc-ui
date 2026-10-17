import { useEffect, useRef, useState } from "react";

// The steps. Each one is a turned brass post standing beside the groove.
const steps = [
  { name: "Survey", when: "Week 1", title: "We measure the room", body: "We come and measure the room, the light and the way people move round the table, then agree a size to the millimetre." },
  { name: "Drawings", when: "Weeks 2 to 3", title: "Drawn at full size", body: "Full-size drawings on brown paper, so you can lay the outline on your floor and walk round it before a board is cut." },
  { name: "Timber", when: "Week 4", title: "Boards from one tree", body: "We pick the boards by hand, from one tree where we can, and stack them to settle in the workshop for a fortnight." },
  { name: "Making", when: "Weeks 5 to 9", title: "One maker, start to end", body: "Every joint is cut and fitted by the same pair of hands, then three coats of hard wax oil go on with a cloth." },
  { name: "Delivery", when: "Week 10", title: "Carried in and levelled", body: "Two of us bring it, carry it in and level the feet on your floor, and we stay until it stands without a rock." },
];
const START = 2; // the step it opens on
const WORKSHOP = "Aldmoor Joinery";
const JOB = "Commission 214, an ash dining table";
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';

// Scene units. Posts stand at PX0, PX0 + PDX, ... along the block.
const PX0 = -3.6, PDX = 1.8, PZ = -0.36, TOP = 0.56;
const N = steps.length;
const LIFT = 0.17; // how far a post rises from its sleeve when the ball reaches it
const END = 4.27; // the ball's centre cannot pass this: the groove ends there
const postX = (i: number) => PX0 + i * PDX * (4 / Math.max(1, N - 1));

const VERT = `ATTR vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;
const TONE = `
vec3 tone(vec3 x){ x *= 0.9; vec3 a = x * (2.51 * x + 0.03); vec3 b = x * (2.43 * x + 0.59) + 0.14; return pow(clamp(a / b, 0.0, 1.0), vec3(1.0 / 2.2)); }
`;

// The photograph: a block of pale oak with a groove milled down it, brass posts turned on a lathe,
// a polished steel ball, all on a chalk floor in low sun that comes through a window behind the set.
const SCENE = `
precision highp float;
uniform vec2 uRes; uniform vec4 uJit; uniform float uSeed;
uniform vec3 uCam; uniform vec3 uTgt; uniform float uFoc; uniform vec2 uShift; uniform float uFocus;
uniform float uBall; uniform vec4 uLiftA; uniform float uLiftB; uniform vec3 uL;
uniform sampler2D uTex; uniform float uDirect;
const float TOP = ${TOP.toFixed(2)}; const float BX = 4.7; const float BZ = 0.8;
const float GZ = 0.16; const float GY = 0.66; const float RG = 0.24; const float GX = 4.3;
const float RB = 0.21; const float BY = 0.63;
const float PZ = ${PZ.toFixed(2)}; const float PX0 = ${PX0.toFixed(2)}; const float PDX = ${(PDX * (4 / Math.max(1, N - 1))).toFixed(4)}; const float NP = ${(N - 1).toFixed(1)};
const vec3 SUN = vec3(1.0, 0.86, 0.68);
const vec3 BRASS = vec3(0.92, 0.68, 0.33);
${TONE}
float h11(float p){ p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n1(float x){ float i = floor(x); float f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(h11(i), h11(i + 1.0), f); }
float n2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }

float sdBox(vec3 p, vec3 b, float r){ vec3 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r; }
float sd2Box(vec2 p, vec2 b, float r){ vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }

// ---- the oak block with its groove ----
float block(vec3 p){
  float d = sdBox(p - vec3(0.0, TOP * 0.5, 0.0), vec3(BX, TOP * 0.5, BZ), 0.035);
  vec3 g = p - vec3(clamp(p.x, -GX, GX), GY, GZ);
  return max(d, RG - length(g));
}
// ---- the brass posts: a fixed flanged sleeve and a turned stem that rises out of it ----
float lift(float i){ return i < 0.5 ? uLiftA.x : i < 1.5 ? uLiftA.y : i < 2.5 ? uLiftA.z : i < 3.5 ? uLiftA.w : uLiftB; }
float postP(vec2 q, float L){
  float d = sd2Box(q - vec2(0.0, 0.016), vec2(0.165, 0.016), 0.008);
  d = smin(d, sd2Box(q - vec2(0.0, 0.1), vec2(0.082, 0.1), 0.01), 0.03);
  d = min(d, length(q - vec2(0.088, 0.165)) - 0.016);
  float y = q.y - L;
  float rs = 0.046 - 0.01 * clamp((y - 0.1) / 0.8, 0.0, 1.0);
  d = min(d, sd2Box(vec2(q.x, y - 0.45), vec2(rs, 0.49), 0.0));
  d = smin(d, length(vec2(q.x - 0.052, y - 0.47)) - 0.02, 0.014);
  d = smin(d, length(vec2(q.x - 0.046, y - 0.86)) - 0.015, 0.01);
  d = smin(d, length(vec2(q.x, y - 1.0)) - 0.1, 0.035);
  d = smin(d, length(vec2(q.x, y - 1.11)) - 0.022, 0.02);
  return d;
}
float posts(vec3 p){
  float db = sdBox(p - vec3(0.0, TOP + 0.7, PZ), vec3(4.0, 0.72, 0.22), 0.0);
  if (db > 0.08) return db;
  float fi = clamp(floor((p.x - PX0) / PDX + 0.5), 0.0, NP);
  vec2 q = vec2(length(p.xz - vec2(PX0 + fi * PDX, PZ)), p.y - TOP);
  return postP(q, lift(fi));
}
vec2 map(vec3 p){
  float a = block(p); float b = posts(p);
  return a < b ? vec2(a, 1.0) : vec2(b, 2.0);
}
vec3 calcN(vec3 p){
  vec2 e = vec2(0.0009, -0.0009);
  return normalize(e.xyy * map(p + e.xyy).x + e.yyx * map(p + e.yyx).x + e.yxy * map(p + e.yxy).x + e.xxx * map(p + e.xxx).x);
}
vec2 boxSpan(vec3 ro, vec3 rd, vec3 lo, vec3 hi){
  vec3 inv = 1.0 / (rd + vec3(1e-6)); vec3 a = (lo - ro) * inv; vec3 b = (hi - ro) * inv;
  vec3 mn = min(a, b); vec3 mx = max(a, b);
  return vec2(max(max(mn.x, mn.y), max(mn.z, 0.0)), min(mx.x, min(mx.y, mx.z)));
}

// ---- the ball, exactly ----
vec3 BC(){ return vec3(uBall, BY, GZ); }
float ballHit(vec3 ro, vec3 rd){
  vec3 oc = ro - BC(); float b = dot(oc, rd); float c = dot(oc, oc) - RB * RB; float h = b * b - c;
  if (h < 0.0) return -1.0;
  return -b - sqrt(h);
}
float ballSoft(vec3 ro, vec3 rd){
  vec3 oc = ro - BC(); float b = dot(oc, rd);
  if (b > 0.0) return 1.0;
  float c = dot(oc, oc) - RB * RB; float h = b * b - c;
  float d = sqrt(max(0.0, RB * RB - h)) - RB; float t = -b - sqrt(max(h, 0.0));
  return smoothstep(0.0, 1.0, 5.0 * d / max(t, 1e-3));
}

// ---- light ----
// The sun comes in through a tall window with glazing bars behind the set; the bars throw soft stripes.
float gobo(vec3 p){
  vec3 u = normalize(cross(uL, vec3(0.0, 1.0, 0.0))); vec3 v = cross(u, uL);
  vec2 w = vec2(dot(p, u), dot(p, v));
  float bx = abs(fract(w.x / 4.6 + 0.62) - 0.5) * 4.6;
  float by = abs(fract(w.y / 3.6 + 0.2) - 0.5) * 3.6;
  float bars = smoothstep(0.03, 0.2, bx) * smoothstep(0.03, 0.18, by);
  return bars * smoothstep(8.5, 6.0, abs(w.x));
}
float shadow(vec3 ro){
  float bs = ballSoft(ro, uL);
  vec2 tb = boxSpan(ro, uL, vec3(-4.8, -0.01, -0.9), vec3(4.8, 1.8, 0.9));
  if (tb.x > tb.y) return bs;
  float res = 1.0; float t = max(tb.x, 0.015);
  for (int i = 0; i < 36; i++) {
    float h = map(ro + uL * t).x;
    res = min(res, 18.0 * h / t);
    t += clamp(h, 0.015, 0.3);
    if (res < 0.002 || t > tb.y) break;
  }
  res = clamp(res, 0.0, 1.0);
  return res * res * (3.0 - 2.0 * res) * bs;
}
float calcAO(vec3 p, vec3 n){
  float o = 0.0; float s = 1.0;
  for (int i = 1; i <= 5; i++) {
    float h = 0.015 + 0.06 * float(i); vec3 q = p + n * h;
    float d = min(min(map(q).x, q.y), length(q - BC()) - RB);
    o += (h - d) * s; s *= 0.72;
  }
  return clamp(1.0 - 1.9 * o, 0.0, 1.0);
}
// What a shiny surface sees: a warm room, a pale ceiling and the bright window with its bars.
vec3 sky(vec3 r, float rough, float vis){
  vec3 c = mix(vec3(0.95, 0.88, 0.78), vec3(0.78, 0.82, 0.9), smoothstep(-0.05, 0.9, r.y)) * 0.9;
  // the room behind the camera is unlit: a dark band of walls and shelves low on the horizon
  float away = smoothstep(-0.15, 0.7, dot(normalize(r.xz + vec2(1e-4)), normalize(uCam.xz - uTgt.xz)));
  c = mix(c, vec3(0.07, 0.06, 0.05), away * smoothstep(0.9, 0.25, r.y) * 0.94);
  // and a pale strip of ceiling light high above
  c += vec3(1.0, 0.97, 0.92) * 1.6 * smoothstep(0.9, 0.97, r.y) * (1.0 - rough);
  float k = dot(r, uL);
  if (k > 0.05) {
    vec3 u = normalize(cross(uL, vec3(0.0, 1.0, 0.0))); vec3 v = cross(u, uL);
    vec2 w = vec2(dot(r, u), dot(r, v)) / k;
    float s = 0.015 + rough * 0.7;
    vec2 a = abs(w) - vec2(0.36, 0.5);
    float win = smoothstep(s, -s, a.x) * smoothstep(s, -s, a.y);
    float bars = smoothstep(0.012, 0.016 + s, abs(w.x)) * smoothstep(0.012, 0.016 + s, abs(w.y - 0.1));
    c += SUN * 16.0 * win * mix(bars, 1.0, smoothstep(0.06, 0.35, rough)) * vis;
  }
  if (r.y < 0.0) c = mix(c, vec3(0.7, 0.62, 0.52), smoothstep(0.0, -0.12, r.y));
  return c;
}
vec3 lighting(vec3 p, vec3 n, float occ, out float sh){
  sh = shadow(p + n * 0.004) * gobo(p);
  float ndl = max(dot(n, uL), 0.0);
  vec3 amb = mix(vec3(0.56, 0.5, 0.44), vec3(0.66, 0.7, 0.8), 0.5 + 0.5 * n.y) * occ * 0.8;
  vec3 bounce = vec3(0.62, 0.5, 0.38) * clamp(0.5 - 0.5 * n.y, 0.0, 1.0) * 0.3 * occ;
  return SUN * 2.7 * ndl * sh + amb * 0.72 + bounce;
}
vec3 fres(vec3 f0, float c){ return f0 + (1.0 - f0) * pow(1.0 - clamp(c, 0.0, 1.0), 5.0); }

// ---- materials ----
vec3 oakAlb(vec3 p){
  float w = n2(vec2(p.x * 0.12, p.z * 1.2)) * 0.9 + n2(vec2(p.x * 0.4, p.z * 3.0)) * 0.15;
  float r = length(vec2(p.y + 1.7, p.z * 1.1 + 0.55 + 0.22 * sin(p.x * 0.31 + 1.0) + w * 0.12));
  float ring = fract(r * 9.0);
  float late = smoothstep(0.62, 0.74, ring) * smoothstep(0.98, 0.86, ring);
  float pores = n2(vec2(p.x * 0.9, (p.z + p.y) * 320.0)) * 0.55 + n2(vec2(p.x * 0.35, (p.z + p.y) * 70.0)) * 0.45;
  float thin = smoothstep(0.025, 0.0, abs(ring - 0.6)) + 0.6 * smoothstep(0.02, 0.0, abs(ring - 0.3));
  vec3 a = vec3(0.7, 0.48, 0.28);
  a = mix(a, vec3(0.46, 0.28, 0.14), late * 0.6 + thin * 0.45);
  a *= 0.84 + 0.24 * pores;
  return a;
}
vec3 shadeOak(vec3 p, vec3 n, vec3 rd, float occ){
  vec3 a = oakAlb(p);
  float rough = 0.62;
  float inG = 1.0 - smoothstep(RG - 0.004, RG + 0.012, length(p - vec3(clamp(p.x, -GX, GX), GY, GZ)));
  a *= mix(1.0, 0.88, inG); rough = mix(rough, 0.14, inG);
  float ink = 0.0; float inlay = 0.0;
  if (n.y > 0.9 && p.z > 0.38 && p.z < 0.78) {
    vec4 tx = texture2D(uTex, vec2((p.x + BX) / (2.0 * BX), (p.z - 0.38) / 0.4));
    ink = tx.r; inlay = tx.g;
  }
  a = mix(a, vec3(0.16, 0.09, 0.05), ink * 0.9);
  float sh; vec3 L = lighting(p, n, occ, sh);
  vec3 col = a * L;
  vec3 r = reflect(rd, n);
  float F = 0.03 + 0.97 * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0);
  col += F * sky(r, rough, sh) * (0.35 + 0.65 * occ) * (1.0 - ink * 0.7) * 0.4;
  if (inlay > 0.01) col = mix(col, fres(BRASS, dot(-rd, n)) * (sky(r, 0.2, sh) * 0.7 + BRASS * L * 0.25), inlay);
  return col;
}
vec3 shadeBrass(vec3 p, vec3 n, vec3 rd, float occ){
  float ring = n1(p.y * 850.0) * 0.6 + n1(p.y * 210.0 + 4.0) * 0.4;
  vec3 nn = normalize(n + vec3(0.0, (ring - 0.5) * 0.06, 0.0));
  vec3 r = reflect(rd, nn);
  float sh = shadow(p + n * 0.005) * gobo(p);
  float rough = 0.08 + 0.1 * ring;
  vec3 e = sky(r, rough, sh);
  // looking down, the brass sees the oak it stands on
  // looking down and toward the camera it sees the dark room; steeply down, the oak it stands on
  float facing = smoothstep(-0.3, 0.5, dot(normalize(r.xz + vec2(1e-4)), normalize(uCam.xz - uTgt.xz)));
  if (r.y < 0.15) e = mix(e, vec3(0.05, 0.045, 0.04), facing * smoothstep(0.15, -0.05, r.y) * 0.9);
  if (r.y < -0.3) e = mix(e, vec3(0.5, 0.34, 0.2) * (0.6 + 1.2 * sh), smoothstep(-0.3, -0.6, r.y));
  vec3 c = fres(BRASS, dot(-rd, nn)) * e * (0.4 + 0.6 * occ);
  c += BRASS * SUN * 0.25 * max(dot(n, uL), 0.0) * sh;
  return c;
}
vec3 floorCol(vec3 p, float t){
  float g = n2(p.xz * 2.0) * 0.5 + n2(p.xz * 19.0) * 0.5;
  vec3 a = vec3(0.86, 0.8, 0.72) * (0.96 + 0.06 * g);
  float occ = 0.45 + 0.55 * smoothstep(0.0, 0.55, map(p + vec3(0.0, 0.03, 0.0)).x);
  occ *= 0.6 + 0.4 * smoothstep(0.0, 0.5, length(p - BC()) - RB);
  float sh; vec3 L = lighting(p, vec3(0.0, 1.0, 0.0), occ, sh);
  return a * L;
}
vec3 backdrop(vec3 rd){ return mix(vec3(1.25, 1.14, 1.0), vec3(0.95, 0.88, 0.78), smoothstep(-0.2, 0.3, rd.y)); }
vec3 shadeFloor(vec3 p, float t, vec3 rd){
  return mix(floorCol(p, t), backdrop(rd), smoothstep(10.0, 34.0, t));
}
// A short second trace for the mirror ball: it really sees the groove, the posts and the floor.
vec3 traceSimple(vec3 ro, vec3 rd){
  float tf = rd.y < 0.0 ? -ro.y / rd.y : 1e9;
  float t = 0.01; float hit = -1.0; float m = 0.0;
  for (int i = 0; i < 48; i++) {
    vec2 h = map(ro + rd * t);
    if (h.x < 0.0015) { hit = t; m = h.y; break; }
    t += h.x; if (t > min(tf, 12.0)) break;
  }
  if (hit > 0.0) {
    vec3 p = ro + rd * hit; vec3 n = calcN(p);
    if (m < 1.5) { float sh; vec3 L = lighting(p, n, 0.75, sh); return oakAlb(p) * L * mix(1.0, 0.88, step(p.y, TOP - 0.01)); }
    vec3 r = reflect(rd, n); float sh = shadow(p + n * 0.01);
    return fres(BRASS, dot(-rd, n)) * sky(r, 0.12, sh) * 0.9;
  }
  if (tf < 1e8) return shadeFloor(ro + rd * tf, tf, rd);
  return sky(rd, 0.0, 1.0);
}
vec3 shadeBall(vec3 p, vec3 rd){
  vec3 n = normalize(p - BC());
  vec3 r = reflect(rd, n);
  vec3 c = traceSimple(p + n * 0.003, r);
  return fres(vec3(0.62, 0.63, 0.66), dot(-rd, n)) * c;
}

void main(){
  vec2 fc = gl_FragCoord.xy + uJit.xy;
  vec2 uv = (fc - 0.5 * uRes) / uRes.y - uShift;
  vec3 fw = normalize(uTgt - uCam); vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0))); vec3 up = cross(rt, fw);
  vec3 rd = normalize(fw * uFoc + rt * uv.x + up * uv.y);
  vec3 ro = uCam;
  vec3 fp = ro + rd * (uFocus / dot(rd, fw));
  ro += rt * uJit.z + up * uJit.w; rd = normalize(fp - ro);
  float tf = rd.y < 0.0 ? -ro.y / rd.y : 1e9;
  vec2 tb = boxSpan(ro, rd, vec3(-4.85, -0.01, -0.95), vec3(4.85, 1.85, 0.95));
  float t = -1.0; float m = 0.0;
  if (tb.x < tb.y) {
    float s = tb.x;
    for (int i = 0; i < 110; i++) {
      vec2 h = map(ro + rd * s);
      if (h.x < 0.0004 * s) { t = s; m = h.y; break; }
      s += h.x; if (s > tb.y) break;
    }
  }
  float tbl = ballHit(ro, rd);
  vec3 col;
  if (tbl > 0.0 && (t < 0.0 || tbl < t)) col = shadeBall(ro + rd * tbl, rd);
  else if (t > 0.0) {
    vec3 p = ro + rd * t; vec3 n = calcN(p); float occ = calcAO(p, n);
    col = m < 1.5 ? shadeOak(p, n, rd, occ) : shadeBrass(p, n, rd, occ);
  }
  else if (tf < 1e8) col = shadeFloor(ro + rd * tf, tf, rd);
  else col = backdrop(rd);
  col = min(col, vec3(24.0));
  if (uDirect > 0.5) col = tone(col);
  outC = vec4(col, 1.0);
}
`;

// Developing: a little bloom off the window highlights, the filmic curve, a soft vignette, grain.
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
    vec3 s = texture2D(uAcc, uv + vec2(cos(a), sin(a)) * r * 0.02 * vec2(uRes.y / uRes.x, 1.0)).rgb;
    b += min(max(s - 2.2, 0.0), vec3(6.0)) * (1.0 - 0.6 * r);
  }
  c += b * 0.01 * vec3(1.0, 0.92, 0.8);
  vec2 q = (uv - uCentre) * vec2(uRes.x / uRes.y, 1.0);
  c *= 1.0 - 0.22 * smoothstep(0.35, 1.25, length(q));
  c = tone(c);
  c += (h21(gl_FragCoord.xy + uGrain * 91.7) - 0.5) * 0.018;
  outC = vec4(c, 1.0);
}
`;

// The numerals burnt into the deck and the brass line inlaid at each stop, drawn once as a flat plan.
// Red is the burnt ink, green the brass.
function deckPrint() {
  const W = 2048, Hh = 128, BX = 4.7;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = Hh;
  const g = cv.getContext("2d");
  if (!g) return cv;
  g.fillStyle = "#000"; g.fillRect(0, 0, W, Hh);
  const pxOf = (x: number) => ((x + BX) / (2 * BX)) * W;
  for (let i = 0; i < N; i++) {
    const x = pxOf(postX(i));
    g.fillStyle = "#0f0"; g.fillRect(x - 2.5, 0, 5, Hh * 0.3);
    g.fillStyle = "#f00"; g.textAlign = "center"; g.textBaseline = "middle";
    g.font = `600 ${Hh * 0.42}px ${FONT}`;
    g.save(); g.translate(x, Hh * 0.64); g.scale(1, 1.9); g.fillText(String(i + 1).padStart(2, "0"), 0, 0); g.restore();
  }
  return cv;
}

// No WebGL: the same set from the front, built from gradients.
const STILL_BOX = "absolute inset-x-6 top-[22%] h-[220px] sm:inset-x-12 lg:inset-x-auto lg:left-[37%] lg:right-[5%] lg:top-[48%]";
function Still({ act }: { act: number }) {
  return (
    <div aria-hidden="true" className={STILL_BOX}>
      <div className="absolute inset-x-0 bottom-0 h-[70px] rounded-[6px]" style={{ background: "linear-gradient(180deg, #e9cfa6 0%, #d8b382 30%, #b98d5c 100%)", boxShadow: "0 30px 40px -12px rgba(90,60,30,0.35), inset 0 2px 0 rgba(255,245,225,0.8)" }}>
        <div className="absolute inset-x-[4%] top-[18px] h-[14px] rounded-full" style={{ background: "linear-gradient(180deg, #8d6640 0%, #c79b68 100%)", boxShadow: "inset 0 3px 4px rgba(60,35,15,0.5)" }} />
      </div>
      {steps.map((s, i) => (
        <div key={s.name} className="absolute bottom-[58px] w-[14px] -translate-x-1/2 rounded-t-full" style={{ left: `${8 + i * (84 / (N - 1))}%`, height: i === act ? 128 : 112, background: "linear-gradient(90deg, #8a6424 0%, #f6dc9a 40%, #c49440 70%, #7a561c 100%)" }}>
          <div className="absolute -top-[14px] left-1/2 h-[24px] w-[24px] -translate-x-1/2 rounded-full" style={{ background: "radial-gradient(circle at 40% 32%, #fff6d8 0%, #e2b85e 35%, #8f6620 100%)" }} />
        </div>
      ))}
      <div className="absolute bottom-[34px] h-[30px] w-[30px] -translate-x-1/2 rounded-full transition-[left] duration-700 ease-[cubic-bezier(0.3,1.4,0.5,1)] motion-reduce:transition-none" style={{ left: `${8 + act * (84 / (N - 1))}%`, background: "radial-gradient(circle at 38% 30%, #ffffff 0%, #d6d9de 18%, #7a7f87 50%, #2b2e33 78%, #b49a76 100%)" }} />
    </div>
  );
}

export default function OakGrooveStepper() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const hit = useRef<HTMLDivElement>(null);
  const tags = useRef<(HTMLButtonElement | null)[]>([]);
  const [act, setAct] = useState(START);
  const [shown, setShown] = useState<"wait" | "gl" | "still">("wait");
  const actRef = useRef(START);
  const api = useRef<{ go: (i: number, fromUser: boolean) => void } | null>(null);

  useEffect(() => {
    const box = stage.current, cv = canvas.current, pad = hit.current;
    if (!box || !cv || !pad) return;
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
      return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
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
    const su = Object.fromEntries(["uRes", "uJit", "uSeed", "uCam", "uTgt", "uFoc", "uShift", "uFocus", "uBall", "uLiftA", "uLiftB", "uL", "uTex", "uDirect"].map((n) => [n, U(scene, n)]));
    const pu = post ? Object.fromEntries(["uAcc", "uRes", "uGrain", "uCentre"].map((n) => [n, U(post, n)])) : {};

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, deckPrint());
    gl.generateMipmap(gl.TEXTURE_2D);
    const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const acc = canAcc ? gl.createTexture() : null;
    const fbo = canAcc ? gl.createFramebuffer() : null;
    let W = 0, H = 0, scale = 1, cssW = 1, cssH = 1;
    const x0 = postX(START);
    const s = {
      x: x0, v: 0, target: x0, lift: steps.map((_, i) => (i === START ? LIFT : 0)), lv: steps.map(() => 0),
      px: 0, py: 0, sx: 0, sy: 0, sun: 0, count: 0, fresh: true, frame: 0, slow: 0,
      visible: true, raf: 0, last: 0, t0: 0, touched: false, demoAt: 0, first: true,
    };
    const size = () => {
      const r = box.getBoundingClientRect();
      cssW = Math.max(1, r.width); cssH = Math.max(1, r.height);
      const dpr = Math.min(software ? 1 : 1.5, window.devicePixelRatio || 1) * scale;
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

    // A long lens, low and to the left, so the block runs away from it toward the window light.
    const camera = () => {
      const wide = cssW >= 1024, aspect = cssW / cssH;
      const el = (wide ? 0.36 : 0.62) - s.sy * 0.015, az = (wide ? -0.62 : -0.62) + s.sx * 0.05, dist = 15;
      const tgt = wide ? [0.3, 0.55, 0.0] : [0.0, 0.6, 0.0];
      const cam = [tgt[0] + dist * Math.sin(az) * Math.cos(el), tgt[1] + dist * Math.sin(el), tgt[2] + dist * Math.cos(az) * Math.cos(el)];
      const foc = wide ? 2.25 * Math.min(1, aspect / 1.6) : 0.98 * Math.min(1.6, aspect / 0.54);
      const fw = [tgt[0] - cam[0], tgt[1] - cam[1], tgt[2] - cam[2]];
      const fl = Math.hypot(fw[0], fw[1], fw[2]); fw[0] /= fl; fw[1] /= fl; fw[2] /= fl;
      const rt = [-fw[2], 0, fw[0]]; const rl = Math.hypot(rt[0], rt[2]); rt[0] /= rl; rt[2] /= rl;
      const up = [rt[1] * fw[2] - rt[2] * fw[1], rt[2] * fw[0] - rt[0] * fw[2], rt[0] * fw[1] - rt[1] * fw[0]];
      const shift = wide ? [0.175 * aspect, -0.215] : [0.02, 0.12];
      return { cam, tgt, fw, rt, up, foc, shift, wide };
    };
    type Cam = ReturnType<typeof camera>;
    // Where a point in the scene lands on the screen, in CSS pixels.
    const project = (c: Cam, p: number[]) => {
      const d = [p[0] - c.cam[0], p[1] - c.cam[1], p[2] - c.cam[2]];
      const z = d[0] * c.fw[0] + d[1] * c.fw[1] + d[2] * c.fw[2];
      const x = (c.foc * (d[0] * c.rt[0] + d[1] * c.rt[1] + d[2] * c.rt[2])) / z + c.shift[0];
      const y = (c.foc * (d[0] * c.up[0] + d[1] * c.up[1] + d[2] * c.up[2])) / z + c.shift[1];
      return [cssW / 2 + x * cssH, cssH / 2 - y * cssH];
    };
    const placeTags = (c: Cam) => {
      for (let i = 0; i < N; i++) {
        const el = tags.current[i];
        if (!el) continue;
        const [x, y] = project(c, [postX(i), TOP + 1.3 + s.lift[i], PZ]);
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
        el.style.opacity = "1";
      }
    };

    const draw = (alpha: number, sample: number) => {
      const c = camera();
      placeTags(c);
      const jx = sample ? halton(sample, 2) - 0.5 : 0, jy = sample ? halton(sample, 3) - 0.5 : 0;
      const la = halton(sample, 5) * Math.PI * 2, lr = sample ? Math.sqrt(halton(sample, 7)) * 0.07 : 0;
      gl.useProgram(scene);
      gl.bindFramebuffer(gl.FRAMEBUFFER, canAcc ? fbo : null);
      gl.viewport(0, 0, W, H);
      if (canAcc && alpha < 1) { gl.enable(gl.BLEND); gl.blendColor(0, 0, 0, alpha); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA); } else gl.disable(gl.BLEND);
      gl.uniform2f(su.uRes, W, H);
      gl.uniform4f(su.uJit, canAcc ? jx : 0, canAcc ? jy : 0, canAcc ? Math.cos(la) * lr : 0, canAcc ? Math.sin(la) * lr : 0);
      gl.uniform1f(su.uSeed, canAcc && sample ? (sample * 0.61803) % 1 || 0.5 : 0);
      gl.uniform3f(su.uCam, c.cam[0], c.cam[1], c.cam[2]); gl.uniform3f(su.uTgt, c.tgt[0], c.tgt[1], c.tgt[2]);
      gl.uniform1f(su.uFoc, c.foc);
      gl.uniform2f(su.uShift, c.shift[0], c.shift[1]);
      // focus rides on the ball
      gl.uniform1f(su.uFocus, (s.x - c.cam[0]) * c.fw[0] + (0.61 - c.cam[1]) * c.fw[1] + (0.16 - c.cam[2]) * c.fw[2]);
      gl.uniform1f(su.uBall, s.x);
      gl.uniform4f(su.uLiftA, s.lift[0] ?? 0, s.lift[1] ?? 0, s.lift[2] ?? 0, s.lift[3] ?? 0);
      gl.uniform1f(su.uLiftB, s.lift[4] ?? 0);
      const sa = -0.9, sz = -0.24 + s.sun, sl = Math.hypot(sa, 0.36, sz);
      gl.uniform3f(su.uL, sa / sl, 0.36 / sl, sz / sl);
      gl.uniform1i(su.uTex, 0);
      gl.uniform1f(su.uDirect, canAcc ? 0 : 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (canAcc && post) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.disable(gl.BLEND);
        gl.useProgram(post);
        gl.uniform1i(pu.uAcc, 1); gl.uniform2f(pu.uRes, W, H);
        gl.uniform1f(pu.uGrain, still ? 1 : s.frame % 64);
        gl.uniform2f(pu.uCentre, c.wide ? 0.6 : 0.5, c.wide ? 0.4 : 0.66);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };

    const go = (i: number, fromUser: boolean) => {
      const k = Math.max(0, Math.min(N - 1, i));
      if (fromUser) s.touched = true;
      s.target = postX(k);
      if (k !== actRef.current) { actRef.current = k; setAct(k); }
      if (reduce) { s.x = s.target; s.v = 0; s.lift = steps.map((_, j) => (j === k ? LIFT : 0)); s.lv = steps.map(() => 0); s.count = 0; }
      wake();
    };
    api.current = { go };

    const frame = (now: number) => {
      s.raf = 0;
      if (!s.visible) return;
      const dtRaw = s.last ? (now - s.last) / 1000 : 0.016;
      const dt = Math.min(0.033, dtRaw);
      s.last = now; s.frame++;
      if (!s.t0) { s.t0 = now; s.demoAt = now + 3600; }

      // the self-running demo: it opens settled on a step, holds, then walks the steps until touched
      if (!still && !s.touched && now > s.demoAt) {
        const order = [3, 4, 1, 0, 2];
        go(order[Math.floor((now - s.t0 - 3600) / 3000) % order.length] ?? START, false);
        s.demoAt = now + 3000;
      }

      let moving = false;
      if (!reduce) {
        const sub = 4, h = dt / sub;
        for (let k = 0; k < sub; k++) {
          // a heavy ball: it can only push so hard, so it builds speed, runs past and rolls back
          const a = Math.max(-26, Math.min(26, 30 * (s.target - s.x) - 5.2 * s.v));
          s.v += a * h; s.x += s.v * h;
          // the milled end of the groove: it knocks the ball back with most of its speed gone
          if (Math.abs(s.x) > END) { s.x = Math.sign(s.x) * END; if (s.v * s.x > 0) s.v *= -0.3; }
          for (let i = 0; i < N; i++) {
            const here = Math.abs(s.x - postX(i)) < 0.22 && Math.abs(postX(i) - s.target) < 0.01;
            s.lv[i] += (260 * ((here ? LIFT : 0) - s.lift[i]) - 15 * s.lv[i]) * h;
            s.lift[i] += s.lv[i] * h;
          }
        }
        if (Math.abs(s.v) > 0.002 || Math.abs(s.target - s.x) > 0.0005 || s.lv.some((v) => Math.abs(v) > 0.002)) moving = true;
        else { s.x = s.target; s.v = 0; }
      }
      if (!still) {
        s.sx += (s.px - s.sx) * (1 - Math.exp(-dt * 3)); s.sy += (s.py - s.sy) * (1 - Math.exp(-dt * 3));
        s.sun = Math.sin((now - s.t0) / 1000 * 0.22) * 0.12 + s.sx * 0.06;
        moving = true;
      }

      const fast = Math.abs(s.v) > 0.3;
      if (s.fresh || !canAcc) { draw(1, 0); s.fresh = false; s.count = 1; }
      else if (moving) { draw(fast ? 0.6 : still ? 0.5 : 0.12, 1 + (s.frame % 64)); s.count = still ? 1 : 6; }
      else if (s.count < 40) { s.count++; draw(1 / s.count, s.count); }
      if (s.first) { s.first = false; setShown("gl"); }

      if (!still && dtRaw > 0.026) s.slow++; else s.slow = Math.max(0, s.slow - 2);
      if (s.slow > 45 && scale > 0.5) { scale *= 0.82; s.slow = 0; size(); }

      if (moving || s.count < 40 || (!still && !s.touched)) s.raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!s.raf && s.visible) { s.last = 0; s.raf = requestAnimationFrame(frame); } };

    size();
    placeTags(camera());
    const ro = new ResizeObserver(() => { size(); placeTags(camera()); wake(); });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting && !document.hidden; if (s.visible) wake(); }, { threshold: 0.05 });
    io.observe(box);
    const vis = () => { s.visible = !document.hidden; if (s.visible) wake(); };
    document.addEventListener("visibilitychange", vis);

    // A press anywhere on the block sends the ball to the nearest post.
    const down = (e: PointerEvent) => {
      const r = box.getBoundingClientRect(), c = camera();
      let best = 0, bd = 1e9;
      for (let i = 0; i < N; i++) {
        const [x, y] = project(c, [postX(i), TOP + 0.4, PZ]);
        const d = Math.hypot(x - (e.clientX - r.left), (y - (e.clientY - r.top)) * 0.5);
        if (d < bd) { bd = d; best = i; }
      }
      go(best, true);
    };
    const move = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      s.px = ((e.clientX - r.left) / r.width) * 2 - 1; s.py = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (!still) wake();
    };
    const leave = () => { s.px = 0; s.py = 0; };
    pad.addEventListener("pointerdown", down);
    box.addEventListener("pointermove", move);
    box.addEventListener("pointerleave", leave);
    const lost = (e: Event) => { e.preventDefault(); setShown("still"); };
    cv.addEventListener("webglcontextlost", lost);
    wake();

    return () => {
      cancelAnimationFrame(s.raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      pad.removeEventListener("pointerdown", down); box.removeEventListener("pointermove", move);
      box.removeEventListener("pointerleave", leave); cv.removeEventListener("webglcontextlost", lost);
      api.current = null;
    };
  }, []);

  const choose = (i: number) => {
    if (api.current) api.current.go(i, true); else { actRef.current = i; setAct(i); }
  };
  const keys = (e: React.KeyboardEvent, i: number) => {
    const next = e.key === "ArrowRight" || e.key === "ArrowDown" ? i + 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? N - 1 : -9;
    if (next === -9) return;
    e.preventDefault();
    const k = Math.max(0, Math.min(N - 1, next));
    choose(k);
    tags.current[k]?.focus();
  };
  const step = steps[act];
  const gl = shown === "gl";

  return (
    <section className="relative isolate overflow-hidden bg-[#efe9df] text-[#1b1712]" style={{ fontFamily: FONT }}>
      <div ref={stage} className="relative mx-auto h-[720px] w-full max-w-[1600px] lg:h-[760px]" style={{ background: "radial-gradient(90% 80% at 60% 60%, #f6f1e8 0%, #ece4d6 60%, #ddd2c0 100%)" }}>
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${gl ? "opacity-100" : "opacity-0"}`} />
        {shown === "still" && <Still act={act} />}
        <div ref={hit} className="absolute inset-x-0 top-0 h-[58%] cursor-pointer lg:inset-y-0 lg:left-[28%] lg:h-auto" />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 px-6 pb-8 sm:px-10 lg:bottom-auto lg:top-0 lg:px-16 lg:pt-14">
          <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-[#1b1712]/60">{WORKSHOP}<span className="mx-2 text-[#1b1712]/30">/</span><span className="hidden sm:inline">{JOB}</span><span className="sm:hidden">No. 214</span></p>
          <div aria-live="polite" className="mt-5 lg:mt-9">
            <p className="flex items-baseline gap-3 text-[13px] font-medium tabular-nums tracking-[-0.01em] text-[#9a6a1f]">
              <span>Step {String(act + 1).padStart(2, "0")} of {String(N).padStart(2, "0")}</span>
              <span className="h-px w-8 bg-[#9a6a1f]/40" />
              <span>{step.when}</span>
            </p>
            <h2 className="mt-3 max-w-[9.5ch] text-[44px] font-semibold leading-[0.92] tracking-[-0.045em] sm:text-[58px] lg:text-[76px]">{step.title}</h2>
            <p className="mt-4 max-w-[25rem] text-[17px] italic leading-snug text-[#1b1712]/75 lg:mt-6 lg:text-[21px]" style={{ fontFamily: SERIF }}>{step.body}</p>
          </div>
        </div>

        <ol aria-label="Commission steps" className={`pointer-events-none ${shown === "still" ? STILL_BOX : "absolute inset-0"}`}>
          {steps.map((s, i) => {
            const on = i === act;
            const fallback = { left: `${8 + i * (84 / (N - 1))}%`, top: on ? "6px" : "22px" };
            return (
              <li key={s.name}>
                <button
                  ref={(el) => { tags.current[i] = el; }}
                  type="button"
                  onClick={() => choose(i)}
                  onKeyDown={(e) => keys(e, i)}
                  aria-current={on ? "step" : undefined}
                  tabIndex={on ? 0 : -1}
                  className={`pointer-events-auto absolute left-0 top-0 flex min-h-[40px] flex-col items-center rounded-md px-2 pb-2 pt-1 text-center opacity-0 outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-[#9a6a1f] focus-visible:ring-offset-2 focus-visible:ring-offset-[#efe9df] motion-reduce:transition-none ${on ? "text-[#1b1712]" : "text-[#1b1712]/55 hover:text-[#1b1712]"}`}
                  style={shown === "still" ? { ...fallback, opacity: 1, transform: "translate(-50%, -100%)" } : undefined}
                >
                  <span className={`text-[12px] font-semibold tabular-nums tracking-[0.04em] ${on ? "text-[#9a6a1f]" : ""}`}>{String(i + 1).padStart(2, "0")}</span>
                  <span className="hidden text-[15px] font-medium tracking-[-0.02em] sm:block">{s.name}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
