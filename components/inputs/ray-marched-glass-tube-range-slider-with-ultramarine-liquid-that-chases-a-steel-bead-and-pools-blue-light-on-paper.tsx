import { useEffect, useRef, useState } from "react";

// What the tube measures. The printed scale on the paper is redrawn from these.
const MAX = 250; // millilitres at the far end
const START = 168; // the value it opens on
const UNIT = "ml";
const MAJOR = 50; // a numeral every fifty
const MINOR = 10; // a tick every ten
// The line under the number changes as the dose crosses each of these.
const notes: [number, string][] = [
  [0, "Clear water, nothing in the line"],
  [1, "A pale wash for skies"],
  [70, "A glaze, built up in two coats"],
  [140, "Solid colour in a single coat"],
  [215, "Straight from the tube"],
];
const DEMO = [62, 214, 120, START]; // where the self-running demo walks to
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';

// Scene units: where the bead sits at zero and at MAX, along the tube.
const X0 = -2.2, X1 = 2.2, AXIS = 0.7;
const xOf = (v: number) => X0 + (Math.max(0, Math.min(MAX, v)) / MAX) * (X1 - X0);
const vOf = (x: number) => Math.round(((Math.max(X0, Math.min(X1, x)) - X0) / (X1 - X0)) * MAX);
const noteFor = (v: number) => notes.reduce((a, n) => (v >= n[0] ? n[1] : a), notes[0][1]);

const VERT = `ATTR vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

const TONE = `
vec3 tone(vec3 x){ x *= 0.92; vec3 a = x * (2.51 * x + 0.03); vec3 b = x * (2.43 * x + 0.59) + 0.14; return pow(clamp(a / b, 0.0, 1.0), vec3(1.0 / 2.2)); }
`;

// The photograph. The glass, the liquid and the bead are traced exactly (cylinders and spheres have
// closed-form hits), the brass end blocks are signed-distance geometry, and the light on the paper
// is worked out by asking what the tube does to a ray on its way from the softbox.
const SCENE = `
precision highp float;
uniform vec2 uRes; uniform vec4 uJit; uniform float uSeed;
uniform vec3 uCam; uniform vec3 uTgt; uniform float uFoc; uniform vec2 uShift; uniform float uFocus;
uniform float uBall; uniform float uFront; uniform float uTilt; uniform float uKey; uniform vec2 uWave;
uniform sampler2D uTex; uniform float uDirect;
const float H = 0.70; const float R1 = 0.40; const float R2 = 0.31; const float RB = 0.293;
const float XE = 2.62; const float XC = 2.84;
const float MD = 0.3; const float MR = 0.302;
const vec3 LK = vec3(0.0, 0.6225, 0.7826);
const float X0 = -2.2; const float X1 = 2.2; const float TICKS = ${MAX / MINOR}.0;
const vec3 SIG = vec3(6.4, 4.0, 0.3);
const vec3 KEYC = vec3(1.0, 0.96, 0.9);
const vec3 BRASS = vec3(0.96, 0.69, 0.3);
${TONE}
float h11(float p){ p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n1(float x){ float i = floor(x); float f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(h11(i), h11(i + 1.0), f); }
float n2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }

// ---- the two brass end blocks (mirrored in x) ----
float map(vec3 p){
  vec3 q = vec3(abs(p.x) - XC, p.y - 0.61, p.z);
  vec3 e = abs(q) - vec3(0.2, 0.59, 0.54);
  float d = length(max(e, 0.0)) + min(max(e.x, max(e.y, e.z)), 0.0) - 0.02;
  d = max(d, (abs(q.x) + abs(q.z) - 0.73) * 0.7071);
  d = max(d, (abs(q.x) + q.y - 0.78) * 0.7071);
  d = max(d, (abs(q.z) + q.y - 1.1) * 0.7071);
  return d;
}
vec3 calcN(vec3 p){
  vec2 e = vec2(0.0012, -0.0012);
  return normalize(e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) + e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx));
}
vec2 boxSpan(vec3 ro, vec3 rd, vec3 lo, vec3 hi){
  vec3 inv = 1.0 / (rd + vec3(1e-6)); vec3 a = (lo - ro) * inv; vec3 b = (hi - ro) * inv;
  vec3 mn = min(a, b); vec3 mx = max(a, b);
  return vec2(max(max(mn.x, mn.y), max(mn.z, 0.0)), min(mx.x, min(mx.y, mx.z)));
}
float marchSide(vec3 ro, vec3 rd, float sx, int steps){
  vec2 tb = boxSpan(ro, rd, vec3(sx > 0.0 ? 2.58 : -3.1, 0.0, -0.6), vec3(sx > 0.0 ? 3.1 : -2.58, 1.25, 0.6));
  if (tb.x > tb.y) return -1.0;
  float t = tb.x;
  for (int i = 0; i < 56; i++) { if (i >= steps) break; float d = map(ro + rd * t); if (d < 0.0008) return t; t += d * 0.85; if (t > tb.y) break; }
  return -1.0;
}
float marchCap(vec3 ro, vec3 rd, int steps){
  float a = marchSide(ro, rd, -1.0, steps); float b = marchSide(ro, rd, 1.0, steps);
  if (a < 0.0) return b; if (b < 0.0) return a; return min(a, b);
}
float capAO(vec3 p, vec3 n){
  float o = 0.0; float s = 1.0;
  for (int i = 1; i <= 4; i++) { float h = 0.015 + 0.06 * float(i); o += (h - min(map(p + n * h), p.y + n.y * h)) * s; s *= 0.7; }
  return clamp(1.0 - 2.2 * o, 0.0, 1.0);
}
float capShadow(vec3 ro){
  if (abs(ro.x) < 1.9 || abs(ro.x) > 3.9 || ro.z > 0.8 || ro.z < -3.0) return 1.0;
  float res = 1.0; float t = 0.04;
  for (int i = 0; i < 18; i++) { float h = map(ro + LK * t); res = min(res, 7.0 * h / t); t += clamp(h, 0.04, 0.3); if (res < 0.01 || t > 2.6) break; }
  return clamp(res, 0.0, 1.0);
}

// ---- closed-form hits ----
bool cylHit(vec3 ro, vec3 rd, float R, out float t0, out float t1){
  vec2 o = vec2(ro.y - H, ro.z); vec2 d = rd.yz; float a = dot(d, d); t0 = -1.0; t1 = -1.0;
  if (a < 1e-7) return false;
  float b = dot(o, d); float c = dot(o, o) - R * R; float h = b * b - a * c;
  if (h < 0.0) return false;
  h = sqrt(h); t0 = (-b - h) / a; t1 = (-b + h) / a; return true;
}
float ballHit(vec3 ro, vec3 rd){
  vec3 oc = ro - vec3(uBall, H, 0.0); float b = dot(oc, rd); float c = dot(oc, oc) - RB * RB; float h = b * b - c;
  if (h < 0.0) return -1.0;
  return -b - sqrt(h);
}
// The liquid ends in a dished meniscus: a piece of a sphere whose centre sits on the dry side.
vec3 menC(){ return vec3(uFront + MD, H + uTilt, 0.0); }
float menHit(vec3 ro, vec3 rd){
  vec3 mc = menC(); vec3 oc = ro - mc; float b = dot(oc, rd); float c = dot(oc, oc) - MR * MR; float h = b * b - c;
  if (h < 0.0) return -1.0;
  h = sqrt(h);
  float t = -b - h; if (t > 2e-4 && (ro.x + rd.x * t) < mc.x) return t;
  t = -b + h; if (t > 2e-4 && (ro.x + rd.x * t) < mc.x) return t;
  return -1.0;
}
bool inLiq(vec3 p){ vec3 mc = menC(); return p.x < mc.x && length(p - mc) > MR; }

// ---- the room ----
float rectL(vec3 ro, vec3 rd, vec3 c, vec3 n, vec3 u, vec3 v, vec2 hs, float soft){
  float dn = dot(rd, n); if (dn > -1e-4) return 0.0;
  float t = dot(c - ro, n) / dn; if (t < 0.0) return 0.0;
  vec3 q = ro + rd * t - c; float s = soft * t;
  vec2 d = abs(vec2(dot(q, u), dot(q, v))) - hs;
  float cloth = 1.0 - 0.25 * clamp(length(vec2(dot(q, u), dot(q, v)) / hs), 0.0, 1.4);
  return smoothstep(s, -s, d.x) * smoothstep(s, -s, d.y) * cloth;
}
vec3 env(vec3 ro, vec3 rd, float rough){
  float soft = 0.03 + rough * 0.7;
  // a pale cove behind the set, an unlit room behind the camera
  float back = smoothstep(-0.75, 0.3, rd.z);
  vec3 c = mix(vec3(0.05, 0.048, 0.046), vec3(0.8, 0.775, 0.73), back) * (0.1 + 0.9 * smoothstep(0.7, 0.1, rd.y));
  // the foot of the cove is lit from the floor: a bright band right on the horizon
  c += vec3(1.0, 0.96, 0.9) * 0.9 * back * exp(-pow((rd.y - 0.1) / (0.09 + rough * 0.3), 2.0));
  // the key: a big scrim high behind the tube, so the liquid is lit through
  vec3 kn = -LK;
  c += KEYC * 9.0 * rectL(ro, rd, vec3(uKey, 6.6, 8.3), kn, vec3(1.0, 0.0, 0.0), normalize(cross(kn, vec3(1.0, 0.0, 0.0))), vec2(3.4, 1.3), soft);
  // a long strip overhead: it is the line of light that runs the length of the glass
  c += vec3(0.95, 0.97, 1.0) * 6.0 * rectL(ro, rd, vec3(uKey * 0.6, 7.0, -0.9), vec3(0.0, -1.0, 0.0), vec3(1.0, 0.0, 0.0), vec3(0.0, 0.0, 1.0), vec2(5.2, 0.6), soft);
  // a warm card low on the camera's left
  vec3 ln = normalize(vec3(1.0, -0.1, 0.55));
  c += vec3(1.0, 0.9, 0.78) * 2.4 * rectL(ro, rd, vec3(-8.0, 2.4, -4.2), ln, normalize(cross(vec3(0.0, 1.0, 0.0), ln)), vec3(0.0, 1.0, 0.0), vec2(1.1, 2.3), soft);
  return c;
}

// What reaches a point from the key once the tube and the bead have had their say. The filled
// length is a rod lens: it starves its flanks and burns one line of colour down the middle.
vec3 lightT(vec3 g){
  vec2 o = vec2(g.y - H, g.z); vec2 d = vec2(LK.y, LK.z);
  float s = -dot(o, d);
  float u = (o.x * d.y - o.y * d.x) / R1; float au = abs(u);
  float xc = g.x + LK.x * s;
  float inx = smoothstep(XE + 0.04, XE - 0.04, abs(xc)) * step(0.0, s);
  float blur = 0.05 + 0.05 * s;
  float fill = smoothstep(uFront + 0.26 + blur * 0.4, uFront + 0.1 - blur * 0.4, xc);
  float wall = smoothstep(0.6, 0.86, au) * smoothstep(1.0 + blur, 1.0 - blur, au);
  float lip = exp(-pow((au - 0.5) / 0.1, 2.0));
  vec3 Te = vec3(1.0 - 0.66 * wall + 0.2 * lip) * vec3(0.93, 1.0, 0.96);
  float inside = smoothstep(1.0 + blur, 1.0 - blur, au);
  float chord = 2.0 * R2 * sqrt(max(1.0 - au * au, 0.0));
  // after the liquid has been thrown about, its line of light shivers along the paper
  float rip = uWave.x * smoothstep(uFront + 0.3, uFront - 1.6, xc);
  u += rip * 0.12 * (sin(xc * 6.0 + uWave.y) + 0.6 * sin(xc * 13.7 - uWave.y * 1.7 + 1.3));
  float knot = 1.0 + rip * 0.9 * sin(xc * 9.0 - uWave.y * 1.4 + 0.8);
  float w = (0.085 + 0.035 * s) * (1.0 + rip * 0.9 * sin(xc * 9.0 - uWave.y * 1.4));
  vec3 Tl = vec3(0.012, 0.07, 0.5) * (0.55 + 0.45 * chord / (2.0 * R2)) + vec3(0.5, 1.2, 4.2) * knot * exp(-pow(u / w, 2.0)) + vec3(0.02, 0.14, 0.9) * exp(-pow(u / (w * 3.2), 2.0));
  Tl = mix(vec3(1.0), Tl, inside);
  vec3 T = mix(vec3(1.0), mix(Te, Tl, fill), inx);
  // the bead
  vec3 oc = g - vec3(uBall, H, 0.0); float b = dot(oc, LK); float c = dot(oc, oc) - RB * RB; float h = b * b - c;
  float dd = sqrt(max(0.0, RB * RB - h)) - RB; float t = -b - sqrt(max(h, 0.0));
  if (t > 0.0) T *= 0.04 + 0.96 * smoothstep(0.0, 1.0, 9.0 * dd / t + 0.35);
  return T;
}
vec3 paper(vec3 gp){
  float fib = n2(gp.xz * 90.0) * 0.6 + n2(gp.xz * vec2(310.0, 260.0)) * 0.4;
  vec3 alb = vec3(0.8, 0.77, 0.72) * (0.965 + 0.07 * fib);
  vec2 uv = vec2((gp.x + 2.6) / 5.2, (-1.36 - gp.z) / 0.65);
  if (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0) alb = mix(alb, vec3(0.05, 0.052, 0.065), texture2D(uTex, uv).r * 0.96);
  return alb;
}
float groundAO(vec3 gp){
  float tube = exp(-pow(gp.z / 0.45, 2.0)) * smoothstep(XE + 0.3, XE - 0.2, abs(gp.x));
  float cap = smoothstep(0.0, 0.42, map(gp + vec3(0.0, 0.03, 0.0)));
  return (1.0 - 0.34 * tube) * (0.25 + 0.75 * cap);
}
vec3 groundLite(vec3 gp){
  // under the full length of the tube the paper picks up blue from the liquid above it
  float under = exp(-pow((gp.z + 0.1) / 0.5, 2.0)) * smoothstep(uFront + 0.3, uFront, gp.x) * smoothstep(-XE - 0.1, -XE + 0.2, gp.x);
  float pool = 0.22 + 0.78 * smoothstep(8.5, 1.0, length((gp.xz - vec2(0.5, -0.5)) * vec2(0.8, 1.0)));
  return paper(gp) * (KEYC * 1.02 * lightT(gp) * capShadow(gp + vec3(0.0, 0.01, 0.0)) * pool + mix(vec3(0.24, 0.255, 0.29), vec3(0.1, 0.16, 0.5), under * 0.75) * groundAO(gp) * (0.5 + 0.5 * pool));
}
// The room as a shiny thing sees it: lights above, the lit paper below.
vec3 envAll(vec3 p, vec3 r, float rough){
  if (r.y < -0.002) { float t = -p.y / r.y; if (t < 30.0) return mix(groundLite(p + r * t), vec3(0.3), smoothstep(8.0, 30.0, t)); }
  return env(p, r, rough);
}
vec3 fres(vec3 f0, float c){ return f0 + (1.0 - f0) * pow(1.0 - clamp(c, 0.0, 1.0), 5.0); }

// A cheap stand-in for the tube, for the things that mirror it.
vec4 tubeProxy(vec3 ro, vec3 rd){
  float t0; float t1;
  if (cylHit(ro, rd, R1, t0, t1) && t0 > 0.0) {
    vec3 p = ro + rd * t0;
    if (abs(p.x) < XE) {
      vec3 n = normalize(vec3(0.0, p.y - H, p.z)); float rim = pow(1.0 - abs(dot(n, rd)), 2.0);
      float fill = smoothstep(uFront + 0.2, uFront + 0.12, p.x);
      vec3 c = mix(mix(vec3(0.66, 0.65, 0.62), vec3(0.2), rim), mix(vec3(0.03, 0.14, 0.95), vec3(0.01, 0.02, 0.2), rim), fill);
      float tb = ballHit(ro, rd);
      if (tb > 0.0) { vec3 bn = normalize(ro + rd * tb - vec3(uBall, H, 0.0)); c = mix(vec3(0.1), vec3(0.75), smoothstep(-0.5, 0.9, bn.y + bn.z * 0.5)); }
      return vec4(c, t0);
    }
  }
  return vec4(0.0, 0.0, 0.0, -1.0);
}
vec3 shadeCap(vec3 p, vec3 n, vec3 rd, float full){
  vec3 gn = n; float rough = 0.035; float spread = 0.0; vec3 bit = vec3(1.0, 0.0, 0.0); float wide = 0.05;
  vec3 an = abs(n);
  if (max(an.x, max(an.y, an.z)) > 0.97) {
    // the flats are brushed in straight strokes, which drag every light into a streak across them
    float k = an.x > 0.9 ? p.z : p.x;
    bit = an.x > 0.9 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
    n = normalize(n + bit * ((n1(k * 620.0) - 0.5) * 0.07 + (n1(k * 140.0 + 3.0) - 0.5) * 0.04));
    rough = 0.1; spread = 0.3; wide = 0.13;
  }
  // two etched lines run round each block
  float etch = smoothstep(0.011, 0.006, abs(abs(p.y - 0.63) - 0.47)) * step(an.y, 0.5);
  float ao = (full > 0.5 ? capAO(p, gn) : 0.8) * (1.0 - 0.6 * etch);
  if (full < 0.5) wide += 0.3;
  vec3 s = vec3(0.0);
  if (spread > 0.0 && full > 0.5) {
    float w = 0.0;
    for (int i = -4; i <= 4; i++) { float f = float(i) / 4.0; float gg = exp(-2.4 * f * f); s += gg * envAll(p, reflect(rd, normalize(n + bit * f * spread)), rough); w += gg; }
    s /= w;
  } else s = envAll(p, reflect(rd, n), rough + spread * 0.5);
  if (full > 0.5) { vec4 m = tubeProxy(p + gn * 0.01, reflect(rd, n)); if (m.a > 0.0) s = mix(s, m.rgb, 0.85); }
  vec3 dl = KEYC * 1.3 * max(dot(n, LK), 0.0) * lightT(p) + vec3(0.3) * ao;
  return fres(BRASS, dot(-rd, n)) * (s * (0.3 + 0.7 * ao) * (1.0 - 0.5 * etch) + wide * dl);
}

vec3 outside(vec3 ro, vec3 rd){
  float tg = rd.y < -1e-4 ? -ro.y / rd.y : 1e9;
  float ts = marchCap(ro, rd, 30);
  if (ts > 0.0 && ts < tg) { vec3 p = ro + rd * ts; return shadeCap(p, calcN(p), rd, 0.0) * 0.6 + BRASS * 0.22; }
  if (tg < 60.0) return mix(groundLite(ro + rd * tg), vec3(0.37, 0.35, 0.32), smoothstep(14.0, 60.0, tg));
  return env(ro, rd, 0.0);
}

vec3 shadeBall(vec3 p, vec3 rd, float wet, float len){
  vec3 n = normalize(p - vec3(uBall, H, 0.0));
  vec3 r = reflect(rd, n);
  vec3 c = envAll(p, r, 0.02) + vec3(0.14, 0.145, 0.16) * smoothstep(0.0, 0.7, r.y);
  // down the bore it mirrors the column of colour, or the empty glass
  float al = smoothstep(0.72, 0.98, abs(r.x));
  float near = smoothstep(1.3, 0.4, uBall - uFront);
  vec3 bore = r.x < 0.0 ? mix(c * 0.6, vec3(0.012, 0.06, 0.55), near) : c * 0.8;
  c = mix(c, bore, al);
  // light that reaches the wet side of the bead has crossed the liquid to get there
  if (wet > 0.5) c = c * exp(-SIG * min(len, 0.5)) + vec3(0.003, 0.012, 0.09) * smoothstep(0.0, 0.3, len);
  // where the bead all but touches the wall, it sees the glass and not the room
  c *= 1.0 - 0.3 * smoothstep(0.8, 1.0, length(n.yz)) * (1.0 - abs(r.x));
  return fres(vec3(0.6, 0.61, 0.635), dot(-rd, n)) * c;
}

// A few air bubbles ride under the top of the bore, a little way back from the face of the liquid.
vec4 bubble(int i){
  float f = float(i);
  float back = 0.5 + f * 0.37 + 0.2 * h11(f * 7.3);
  float r = 0.014 + 0.017 * h11(f * 3.1 + 1.0);
  float a = (h11(f * 5.7 + 2.0) - 0.5) * 1.1 + 0.25 * uWave.x * sin(uWave.y * 0.7 + f * 2.0);
  float rr = R2 - r - 0.002;
  return vec4(uFront - back + 0.05 * uWave.x * sin(uWave.y + f), H + cos(a) * rr, -sin(a) * rr, r);
}
// One ray through the tube: air, glass wall, bore (liquid or air), wall again, and out.
vec3 shadeTube(vec3 ro, vec3 rd, float t0){
  vec3 o = ro + rd * t0;
  vec3 n = normalize(vec3(0.0, o.y - H, o.z));
  float F = 0.04 + 0.96 * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0);
  vec3 col = F * envAll(o, reflect(rd, n), 0.0);
  vec3 thr = vec3(1.0 - F);
  // white enamel graduations fired onto the outside of the glass
  float gi = (o.x - X0) / (X1 - X0) * TICKS;
  float gk = floor(gi + 0.5);
  if (gk > -0.5 && gk < TICKS + 0.5) {
    float phi = atan(o.y - H, -o.z);
    float major = step(abs(mod(gk + 0.5, 5.0) - 0.5), 0.1);
    float line = smoothstep(0.0075, 0.0045, abs(gi - gk) * (X1 - X0) / TICKS);
    float arc = smoothstep(mix(0.92, 0.6, major), mix(0.95, 0.63, major), phi) * smoothstep(1.3, 1.27, phi);
    float en = line * arc * 0.92;
    col += thr * en * vec3(0.9, 0.9, 0.87) * (KEYC * 1.2 * max(dot(n, LK), 0.0) + vec3(0.42));
    thr *= 1.0 - en;
  }
  vec3 d = refract(rd, n, 1.0 / 1.5);
  int med = 1; bool wet = false;
  const vec3 GA = vec3(1.0, 0.4, 0.66);
  for (int i = 0; i < 9; i++) {
    float a0; float a1; float b0; float b1;
    if (med == 1) {
      bool hi = cylHit(o, d, R2, a0, a1);
      cylHit(o, d, R1, b0, b1);
      if (hi && a0 > 2e-4) {
        o += d * a0; thr *= exp(-GA * a0);
        vec3 nn = normalize(vec3(0.0, o.y - H, o.z));
        wet = inLiq(o - nn * 0.004);
        vec3 r = refract(d, nn, wet ? 1.5 / 1.33 : 1.5);
        if (dot(r, r) < 0.5) d = reflect(d, nn);
        else {
          if (i == 0) col += thr * (wet ? 0.006 : 0.035) * envAll(o, reflect(d, nn), 0.0);
          d = r; med = 2;
        }
      } else {
        float tt = max(b1, 0.0); o += d * tt; thr *= exp(-GA * tt);
        vec3 nn = -normalize(vec3(0.0, o.y - H, o.z));
        vec3 r = refract(d, nn, 1.5);
        if (dot(r, r) < 0.5) d = reflect(d, nn); else { d = r; med = 0; break; }
      }
    } else {
      cylHit(o, d, R2, a0, a1);
      float tw = max(a1, 0.0);
      float te = abs(d.x) > 1e-5 ? ((d.x > 0.0 ? XE : -XE) - o.x) / d.x : 1e9;
      float tb = ballHit(o, d);
      float tf = menHit(o, d);
      float tm = min(tw, te);
      if (wet) {
        float tq = 1e9; vec4 bq = vec4(0.0);
        for (int k = 0; k < 6; k++) {
          vec4 bb = bubble(k); if (bb.x < -XE + 0.05) continue;
          vec3 oc = o - bb.xyz; float bh = dot(oc, d); float hh = bh * bh - dot(oc, oc) + bb.w * bb.w;
          if (hh > 0.0) { float tt = -bh - sqrt(hh); if (tt > 0.0 && tt < tq) { tq = tt; bq = bb; } }
        }
        if (tq < tm && (tb < 0.0 || tq < tb) && (tf < 0.0 || tq < tf)) {
          // air in liquid: clear in the middle, a bright mirror ring round the edge
          vec3 bp = o + d * tq; vec3 bn = normalize(bp - bq.xyz); float e = 1.0 - clamp(dot(-d, bn), 0.0, 1.0);
          thr *= exp(-SIG * tq);
          vec3 ring = envAll(bp, reflect(d, bn), 0.05);
          return col + thr * mix(vec3(0.5, 0.75, 1.6) * 0.55, ring * 1.2, smoothstep(0.25, 0.7, e)) * (1.0 - 0.75 * smoothstep(0.86, 1.0, e));
        }
      }
      if (tb > 0.0 && tb < tm && (tf < 0.0 || tb < tf)) {
        if (wet) thr *= exp(-SIG * tb);
        return col + thr * shadeBall(o + d * tb, d, wet ? 1.0 : 0.0, tb);
      }
      if (tf > 0.0 && tf < tm) {
        o += d * tf; if (wet) thr *= exp(-SIG * tf);
        vec3 nn = normalize(o - menC()); if (dot(nn, d) > 0.0) nn = -nn;
        vec3 r = refract(d, nn, wet ? 1.33 : 1.0 / 1.33);
        if (dot(r, r) < 0.5) d = reflect(d, nn); else { d = r; wet = !wet; }
      } else if (te < tw) {
        if (wet) thr *= exp(-SIG * te);
        return col + thr * BRASS * mix(0.3, 0.72, smoothstep(-R2, R2, (o + d * te).y - H));
      } else {
        o += d * tw; if (wet) thr *= exp(-SIG * tw);
        vec3 nn = -normalize(vec3(0.0, o.y - H, o.z));
        vec3 r = refract(d, nn, wet ? 1.33 / 1.5 : 1.0 / 1.5);
        if (dot(r, r) < 0.5) d = reflect(d, nn); else { d = r; med = 1; }
      }
    }
  }
  if (med == 0) col += thr * outside(o, d); else col += thr * vec3(0.3, 0.29, 0.27);
  return col;
}

// The paper is a satin stock: at a low angle it carries a soft image of what stands on it.
vec4 mirrorLite(vec3 ro, vec3 rd){
  vec4 m = tubeProxy(ro, rd);
  float best = m.a > 0.0 ? m.a : 1e9; vec3 c = m.rgb;
  float ts = marchCap(ro, rd, 26);
  if (ts > 0.0 && ts < best) { best = ts; vec3 p = ro + rd * ts; c = shadeCap(p, calcN(p), rd, 0.0); }
  return vec4(c, best < 1e8 ? exp(-best * 0.55) : 0.0);
}
vec3 shadeGround(vec3 gp, vec3 rd, vec2 rnd, float dist){
  vec3 col = groundLite(gp);
  if (dot(gp.xz, gp.xz) < 40.0) {
    vec3 r = normalize(reflect(rd, vec3(0.0, 1.0, 0.0)) + vec3(rnd.x, 0.0, rnd.y) * 0.035);
    float f = 0.03 + 0.97 * pow(1.0 - clamp(-rd.y, 0.0, 1.0), 5.0);
    vec4 m = mirrorLite(gp + vec3(0.0, 0.002, 0.0), r);
    col = mix(col, m.rgb, clamp(f * m.a * 1.6, 0.0, 0.6));
  }
  return mix(col, vec3(0.37, 0.35, 0.32), smoothstep(14.0, 60.0, dist));
}

void main(){
  vec2 fc = gl_FragCoord.xy + uJit.xy;
  vec2 uv = (fc - 0.5 * uRes) / uRes.y - uShift;
  vec3 fw = normalize(uTgt - uCam); vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), fw)); vec3 up = cross(fw, rt);
  vec3 rd = normalize(fw * uFoc + rt * uv.x + up * uv.y);
  vec3 ro = uCam;
  vec3 fp = ro + rd * (uFocus / dot(rd, fw));
  ro += rt * uJit.z + up * uJit.w; rd = normalize(fp - ro);
  float ign = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))) + uSeed);
  float ang = ign * 6.2831853; float rr = sqrt(fract(ign * 7.13 + uSeed * 3.7));
  vec2 rnd = vec2(cos(ang), sin(ang)) * rr * step(0.001, uSeed);
  float tg = rd.y < 0.0 ? -ro.y / rd.y : 1e9;
  float ts = marchCap(ro, rd, 56);
  float c0; float c1; float tc = -1.0;
  if (cylHit(ro, rd, R1, c0, c1) && c0 > 0.0 && abs(ro.x + rd.x * c0) < XE) tc = c0;
  vec3 col;
  if (ts > 0.0 && ts < tg && (tc < 0.0 || ts < tc)) { vec3 p = ro + rd * ts; col = shadeCap(p, calcN(p), rd, 1.0); }
  else if (tc > 0.0 && tc < tg) col = shadeTube(ro, rd, tc);
  else if (tg < 1e8) col = shadeGround(ro + rd * tg, rd, rnd, tg);
  else col = env(ro, rd, 0.0);
  col = min(col, vec3(24.0));
  if (uDirect > 0.5) col = tone(col);
  outC = vec4(col, 1.0);
}
`;

// Developing the negative: a little bloom off the hot highlights, the filmic curve, vignette, grain.
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
  c = max(c + (c - nb * 0.25) * 0.5, 0.0);
  vec3 b = vec3(0.0);
  for (int i = 0; i < 20; i++) {
    float a = float(i) * 2.39996; float r = sqrt((float(i) + 0.5) / 20.0);
    vec3 s = texture2D(uAcc, uv + vec2(cos(a), sin(a)) * r * 0.022 * vec2(uRes.y / uRes.x, 1.0)).rgb;
    b += min(max(s - 1.5, 0.0), vec3(6.0)) * (1.0 - 0.6 * r);
  }
  c += b * 0.008;
  vec2 q = (uv - uCentre) * vec2(uRes.x / uRes.y, 1.0);
  c *= 1.0 - 0.3 * smoothstep(0.3, 1.2, length(q));
  c = tone(c);
  float g = h21(gl_FragCoord.xy + uGrain * 91.7) - 0.5;
  c += g * 0.02;
  outC = vec4(c, 1.0);
}
`;

// The scale printed on the paper in front of the tube, drawn once as a flat plan.
function scalePrint() {
  const W = 2048, Hh = 256, px = W / 5.2;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = Hh;
  const g = cv.getContext("2d");
  if (!g) return cv;
  g.fillStyle = "#000"; g.fillRect(0, 0, W, Hh);
  g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "top";
  for (let v = 0; v <= MAX; v += MINOR) {
    const major = v % MAJOR === 0;
    const x = (xOf(v) + 2.6) * px, w = (major ? 0.026 : 0.013) * px;
    g.fillRect(x - w / 2, 0.03 * px, w, (major ? 0.2 : 0.1) * px);
    if (major) {
      g.font = `600 ${0.25 * px}px ${FONT}`;
      g.fillText(String(v), x, 0.3 * px);
    }
  }
  return cv;
}

// No WebGL: the same instrument from the side, built from gradients.
function Still({ value }: { value: number }) {
  const f = value / MAX;
  return (
    <div aria-hidden="true" className="absolute left-1/2 top-[30%] h-[200px] w-[620px] -translate-x-1/2 -translate-y-1/2 scale-[0.5] sm:scale-75 lg:top-[66%] lg:scale-125">
      <div className="absolute left-[40px] top-[150px] h-[26px] w-[540px] rounded-full blur-md" style={{ background: `linear-gradient(90deg, rgba(20,60,255,0.75) 0%, rgba(20,60,255,0.75) ${f * 100}%, rgba(60,50,40,0.28) ${f * 100}%, rgba(60,50,40,0.28) 100%)` }} />
      <div className="absolute left-[50px] top-[40px] h-[72px] w-[520px] overflow-hidden rounded-[10px]" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(214,208,196,0.55) 18%, rgba(236,231,221,0.35) 55%, rgba(120,112,100,0.5) 100%)", boxShadow: "inset 0 0 0 1px rgba(60,55,48,0.45), inset 0 9px 0 -4px rgba(255,255,255,0.95)" }}>
        <div className="absolute inset-y-[7px] left-0" style={{ width: `${4 + f * 88}%`, background: "linear-gradient(180deg, #5d86ff 0%, #1a3cf0 22%, #0b1a8f 60%, #2f6bff 88%, #9fc0ff 100%)" }} />
        <div className="absolute top-[7px] h-[58px] w-[58px] -translate-x-1/2 rounded-full" style={{ left: `${4 + f * 88}%`, background: "radial-gradient(circle at 42% 24%, #ffffff 0%, #d9dde2 14%, #7c828b 42%, #2a2d33 70%, #8d8a84 100%)", boxShadow: "inset 0 -6px 10px rgba(20,40,160,0.35)" }} />
      </div>
      {[0, 1].map((i) => (
        <div key={i} className="absolute top-[26px] h-[100px] w-[52px] rounded-[6px]" style={{ left: i ? 548 : 20, background: "linear-gradient(180deg, #fff3cf 0%, #d9b565 14%, #a67c2c 46%, #6b4c16 78%, #c9a04c 100%)", boxShadow: "0 22px 0 -8px #8a6521, 0 30px 18px rgba(40,30,10,0.3)" }} />
      ))}
    </div>
  );
}

export default function RayMarchedGlassTubeSlider() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const hit = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(START);
  const [shown, setShown] = useState<"wait" | "gl" | "still">("wait");
  const valRef = useRef(START);
  const api = useRef<{ go: (v: number, fromUser: boolean) => void } | null>(null);

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
    const still = reduce || software; // no idle drift: draw, refine, then rest

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
    const su = Object.fromEntries(["uRes", "uJit", "uSeed", "uCam", "uTgt", "uFoc", "uShift", "uFocus", "uBall", "uFront", "uTilt", "uKey", "uWave", "uTex", "uDirect"].map((n) => [n, U(scene, n)]));
    const pu = post ? Object.fromEntries(["uAcc", "uRes", "uGrain", "uCentre"].map((n) => [n, U(post, n)])) : {};

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, scalePrint());
    gl.generateMipmap(gl.TEXTURE_2D);
    const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // The accumulation plate: every frame is one more exposure blended onto it.
    const acc = canAcc ? gl.createTexture() : null;
    const fbo = canAcc ? gl.createFramebuffer() : null;
    let W = 0, H = 0, scale = 1, cssW = 1, cssH = 1;
    const x0 = xOf(START);
    const s = {
      xb: x0, vb: 0, xf: x0, vf: 0, tilt: 0, vt: 0, wave: 0, phase: 0, target: x0, drag: false, grab: 0,
      px: 0, py: 0, sx: 0, sy: 0, key: 0.6, count: 0, fresh: true, frame: 0, slow: 0,
      visible: true, raf: 0, last: 0, t0: 0, touched: false, demoAt: 0, demoI: 0, first: true,
    };
    const size = () => {
      const r = box.getBoundingClientRect();
      cssW = Math.max(1, r.width); cssH = Math.max(1, r.height);
      const dpr = Math.min(software ? 1 : 1.5, window.devicePixelRatio || 1) * scale;
      // never more than about a million and a half pixels of tracing
      const k = Math.min(1, Math.sqrt(1.45e6 / (cssW * cssH * dpr * dpr)));
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

    // The camera: a long lens, low and to the left, so the tube runs away from it.
    const camera = () => {
      const wide = cssW >= 1024, aspect = cssW / cssH;
      const el = (wide ? 0.33 : 0.4) - s.sy * 0.012, az = (wide ? -0.58 : -1.02) + s.sx * 0.05, dist = 12;
      const tgt = wide ? [0.2, 0.42, -0.5] : [0.1, 0.45, -0.35];
      const cam = [tgt[0] + dist * Math.sin(az) * Math.cos(el), tgt[1] + dist * Math.sin(el), tgt[2] - dist * Math.cos(az) * Math.cos(el)];
      const foc = wide ? 2.84 * Math.min(1, aspect / 1.55) : 2.5 * Math.min(1, aspect / 0.62);
      const fw = [tgt[0] - cam[0], tgt[1] - cam[1], tgt[2] - cam[2]];
      const fl = Math.hypot(fw[0], fw[1], fw[2]); fw[0] /= fl; fw[1] /= fl; fw[2] /= fl;
      const rt = [fw[2], 0, -fw[0]]; const rl = Math.hypot(rt[0], rt[2]); rt[0] /= rl; rt[2] /= rl;
      const up = [fw[1] * rt[2] - fw[2] * rt[1], fw[2] * rt[0] - fw[0] * rt[2], fw[0] * rt[1] - fw[1] * rt[0]];
      const shift = wide ? [0.1 * aspect, -0.137] : [0, 0.2];
      return { cam, tgt, fw, rt, up, foc, shift, wide };
    };
    // Where along the tube a point on the screen is pointing.
    const pick = (cx: number, cy: number) => {
      const r = box.getBoundingClientRect(), c = camera();
      const ux = (cx - r.left - r.width / 2) / r.height - c.shift[0], uy = (r.height / 2 - (cy - r.top)) / r.height - c.shift[1];
      const d = [0, 1, 2].map((i) => c.fw[i] * c.foc + c.rt[i] * ux + c.up[i] * uy);
      // the point on the tube's axis that passes closest to that ray
      const w = [c.cam[0], c.cam[1] - AXIS, c.cam[2]];
      const dd = d[0] * d[0] + d[1] * d[1] + d[2] * d[2], dw = d[0] * w[0] + d[1] * w[1] + d[2] * w[2];
      const den = dd - d[0] * d[0];
      return den < 1e-6 ? s.xb : (dd * w[0] - d[0] * dw) / den;
    };

    const draw = (alpha: number, sample: number) => {
      const c = camera();
      const jx = sample ? halton(sample, 2) - 0.5 : 0, jy = sample ? halton(sample, 3) - 0.5 : 0;
      const la = halton(sample, 5) * Math.PI * 2, lr = sample ? Math.sqrt(halton(sample, 7)) * 0.062 : 0;
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
      // focus rides on the bead
      gl.uniform1f(su.uFocus, (s.xb - c.cam[0]) * c.fw[0] + (AXIS - c.cam[1]) * c.fw[1] + (-0.2 - c.cam[2]) * c.fw[2]);
      gl.uniform1f(su.uBall, s.xb); gl.uniform1f(su.uFront, s.xf - 0.2); gl.uniform1f(su.uTilt, s.tilt);
      gl.uniform1f(su.uKey, s.key); gl.uniform2f(su.uWave, s.wave, s.phase);
      gl.uniform1i(su.uTex, 0);
      gl.uniform1f(su.uDirect, canAcc ? 0 : 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (canAcc && post) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.disable(gl.BLEND);
        gl.useProgram(post);
        gl.uniform1i(pu.uAcc, 1); gl.uniform2f(pu.uRes, W, H);
        gl.uniform1f(pu.uGrain, still ? 1 : s.frame % 64);
        gl.uniform2f(pu.uCentre, 0.5, c.wide ? 0.4 : 0.66);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };

    const go = (v: number, fromUser: boolean) => {
      const k = Math.max(0, Math.min(MAX, Math.round(v)));
      if (fromUser) s.touched = true;
      s.target = xOf(k);
      if (k !== valRef.current) { valRef.current = k; setValue(k); }
      if (reduce) { s.xb = s.xf = s.target; s.vb = s.vf = 0; s.tilt = 0; s.vt = 0; s.count = 0; }
      wake();
    };
    api.current = { go };

    const frame = (now: number) => {
      s.raf = 0;
      if (!s.visible) return;
      const dtRaw = s.last ? (now - s.last) / 1000 : 0.016;
      const dt = Math.min(0.033, dtRaw);
      s.last = now; s.frame++;
      if (!s.t0) { s.t0 = now; s.demoAt = now + 3800; }

      // the self-running demo: it opens finished, holds, then doses up and down until someone touches it
      if (!still && !s.touched && !s.drag && now > s.demoAt) {
        go(DEMO[s.demoI % DEMO.length], false);
        s.demoI++; s.demoAt = now + 2700;
      }

      let moving = false;
      if (!reduce) {
        const stiff = s.drag ? 620 : 150, damp = s.drag ? 40 : 14.5;
        const steps = 4, h = dt / steps;
        for (let i = 0; i < steps; i++) {
          // the bead: a heavy ball on a spring, one small overshoot
          s.vb += (stiff * (s.target - s.xb) - damp * s.vb) * h; s.xb += s.vb * h;
          // the liquid runs after it, later and looser, and cannot pass it
          const af = 64 * (s.xb - s.xf) - 7.5 * s.vf;
          s.vf += af * h; s.xf += s.vf * h;
          let kick = 0;
          if (s.xf >= s.xb) { if (s.vf > s.vb) { kick = s.vf - s.vb; s.vf = s.vb; } s.xf = s.xb; }
          // and its face rocks: thrown back as it sets off, slapped as it arrives
          s.vt += (-170 * s.tilt - 6.5 * s.vt - af * 0.11) * h + kick * 0.05;
          s.tilt = Math.max(-0.13, Math.min(0.13, s.tilt + s.vt * h));
          s.wave = Math.min(1, s.wave + kick * 0.5 + Math.abs(s.vf) * h * 0.9);
        }
        s.wave *= Math.exp(-dt * 1.9); s.phase += dt * 10.5;
        if (s.wave > 0.004) moving = true; else s.wave = 0;
        if (Math.abs(s.vb) > 0.002 || Math.abs(s.target - s.xb) > 0.0005 || Math.abs(s.xb - s.xf) > 0.0005 || Math.abs(s.vf) > 0.002 || Math.abs(s.tilt) > 0.0008 || Math.abs(s.vt) > 0.004) moving = true;
        else { s.xb = s.xf = s.target; s.vb = s.vf = 0; s.tilt = 0; s.vt = 0; }
      }
      if (!still) {
        s.sx += (s.px - s.sx) * (1 - Math.exp(-dt * 3)); s.sy += (s.py - s.sy) * (1 - Math.exp(-dt * 3));
        const t = (now - s.t0) / 1000;
        s.key = 0.6 + Math.sin(t * 0.4 + 0.4) * 2.2 + s.sx * 2;
        moving = true;
      }

      const fast = Math.abs(s.vb) > 0.12 || Math.abs(s.vf) > 0.12 || Math.abs(s.vt) > 0.25;
      if (s.fresh || !canAcc) { draw(1, 0); s.fresh = false; s.count = 1; }
      else if (moving) { draw(fast ? 0.55 : still ? 0.5 : 0.09, 1 + (s.frame % 64)); s.count = still ? 1 : 6; }
      else if (s.count < 40) { s.count++; draw(1 / s.count, s.count); }
      if (s.first) { s.first = false; setShown("gl"); }

      // measured, not guessed: if frames run long for a while, give up some resolution
      if (!still && dtRaw > 0.026) s.slow++; else s.slow = Math.max(0, s.slow - 2);
      if (s.slow > 45 && scale > 0.5) { scale *= 0.82; s.slow = 0; size(); }

      if (moving || s.count < 40 || (!still && !s.touched)) s.raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!s.raf && s.visible) { s.last = 0; s.raf = requestAnimationFrame(frame); } };

    size();
    const ro = new ResizeObserver(() => { size(); wake(); });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting && !document.hidden; if (s.visible) wake(); }, { threshold: 0.05 });
    io.observe(box);
    const vis = () => { s.visible = !document.hidden; if (s.visible) wake(); };
    document.addEventListener("visibilitychange", vis);

    let id = -1;
    const down = (e: PointerEvent) => {
      id = e.pointerId; s.drag = true; s.touched = true;
      const x = pick(e.clientX, e.clientY);
      // take hold of the bead where it is, or call it over to where you pressed
      s.grab = Math.abs(x - s.xb) < 0.55 ? s.xb - x : 0;
      try { pad.setPointerCapture(id); } catch { /* the pointer is already gone */ }
      go(vOf(x + s.grab), true);
    };
    const move = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      s.px = ((e.clientX - r.left) / r.width) * 2 - 1; s.py = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (s.drag && e.pointerId === id) {
        const x = Math.max(X0, Math.min(X1, pick(e.clientX, e.clientY) + s.grab));
        s.target = x;
        const k = vOf(x);
        if (k !== valRef.current) { valRef.current = k; setValue(k); }
      }
      if (!still || s.drag) wake();
    };
    const upFn = (e: PointerEvent) => {
      if (!s.drag || e.pointerId !== id) return;
      s.drag = false; go(valRef.current, true);
    };
    const leave = () => { s.px = 0; s.py = 0; };
    pad.addEventListener("pointerdown", down);
    box.addEventListener("pointermove", move);
    pad.addEventListener("pointerup", upFn);
    pad.addEventListener("pointercancel", upFn);
    box.addEventListener("pointerleave", leave);
    const lost = (e: Event) => { e.preventDefault(); setShown("still"); };
    cv.addEventListener("webglcontextlost", lost);
    wake();

    return () => {
      cancelAnimationFrame(s.raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      pad.removeEventListener("pointerdown", down); box.removeEventListener("pointermove", move);
      pad.removeEventListener("pointerup", upFn); pad.removeEventListener("pointercancel", upFn);
      box.removeEventListener("pointerleave", leave); cv.removeEventListener("webglcontextlost", lost);
      api.current = null;
    };
  }, []);

  const change = (v: number) => {
    if (api.current) api.current.go(v, true); else { valRef.current = v; setValue(v); }
  };
  const pct = (value / MAX) * 100;

  return (
    <section className="relative isolate overflow-hidden bg-[#d9d4ca] text-[#14161b]" style={{ fontFamily: FONT }}>
      <style>{`
        .ray-marched-glass-tube-range { -webkit-appearance: none; appearance: none; background: transparent; height: 44px; cursor: pointer; }
        .ray-marched-glass-tube-range::-webkit-slider-runnable-track { height: 2px; border-radius: 2px; background: linear-gradient(90deg, #1d3df2 var(--fill), rgba(20,22,27,0.28) var(--fill)); }
        .ray-marched-glass-tube-range::-moz-range-track { height: 2px; border-radius: 2px; background: rgba(20,22,27,0.28); }
        .ray-marched-glass-tube-range::-moz-range-progress { height: 2px; background: #1d3df2; }
        .ray-marched-glass-tube-range::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; margin-top: -8px; border-radius: 50%; border: 0; background: radial-gradient(circle at 38% 30%, #ffffff 0%, #c9ced6 28%, #5a606a 72%, #2a2d33 100%); box-shadow: 0 1px 2px rgba(0,0,0,0.45), 0 0 0 1px rgba(20,22,27,0.35); transition: transform 160ms cubic-bezier(0.2, 0.9, 0.2, 1.4); }
        .ray-marched-glass-tube-range::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; border: 0; background: radial-gradient(circle at 38% 30%, #ffffff 0%, #c9ced6 28%, #5a606a 72%, #2a2d33 100%); box-shadow: 0 1px 2px rgba(0,0,0,0.45), 0 0 0 1px rgba(20,22,27,0.35); }
        .ray-marched-glass-tube-range:active::-webkit-slider-thumb { transform: scale(1.25); }
        .ray-marched-glass-tube-range:focus-visible { outline: 2px solid #1d3df2; outline-offset: 4px; border-radius: 6px; }
        @media (prefers-reduced-motion: reduce) { .ray-marched-glass-tube-range::-webkit-slider-thumb { transition: none; } }
      `}</style>
      <div ref={stage} className="relative mx-auto h-[720px] w-full max-w-[1600px] lg:h-[760px]" style={{ background: "radial-gradient(90% 80% at 55% 65%, #e9e4da 0%, #d6d0c5 55%, #bdb7ab 100%)" }}>
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${shown === "gl" ? "opacity-100" : "opacity-0"}`} />

        {shown === "still" && <Still value={value} />}

        <div ref={hit} className="absolute inset-x-0 top-0 h-[60%] cursor-grab select-none active:cursor-grabbing lg:bottom-0 lg:top-[38%] lg:h-auto" style={{ touchAction: "pan-y" }} />

        <div className="pointer-events-none absolute inset-0 flex flex-col justify-end px-6 pb-7 sm:px-10 lg:justify-start lg:px-16 lg:pb-0 lg:pt-14">
          <p className="hidden text-[11px] font-medium uppercase tracking-[0.34em] text-[#14161b]/60 lg:block">Morrow colour works <span className="mx-2 text-[#14161b]/30">/</span> pigment dose</p>
          <div className="lg:mt-8">
            <p className="flex items-start">
              <span className="text-[112px] font-semibold leading-[0.8] tracking-[-0.065em] tabular-nums sm:text-[150px] lg:text-[184px]">{value}</span>
              <span className="ml-3 mt-1 text-[22px] font-medium tracking-[-0.02em] text-[#1d3df2] lg:ml-4 lg:mt-2 lg:text-[30px]">{UNIT}</span>
            </p>
            <p className="mt-4 w-[24rem] max-w-[82vw] text-[19px] italic leading-snug text-[#14161b]/75 lg:mt-5 lg:text-[23px]" style={{ fontFamily: SERIF }}>{noteFor(value)}</p>
            <div className="pointer-events-auto mt-4 flex w-[19rem] max-w-full items-center gap-4 lg:mt-5">
              <label htmlFor="ray-marched-glass-tube-dose" className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#14161b]/65">Dose</label>
              <input
                id="ray-marched-glass-tube-dose"
                type="range"
                min={0}
                max={MAX}
                step={1}
                value={value}
                onChange={(e) => change(Number(e.target.value))}
                aria-valuetext={`${value} millilitres. ${noteFor(value)}`}
                className="ray-marched-glass-tube-range min-w-0 flex-1"
                style={{ ["--fill" as string]: `${pct}%` }}
              />
              <output htmlFor="ray-marched-glass-tube-dose" className="whitespace-nowrap text-right text-[13px] font-medium tabular-nums tracking-[-0.01em] text-[#14161b]/80">{Math.round(pct)}%</output>
            </div>
          </div>
        </div>
        <p className="pointer-events-none absolute bottom-7 right-6 hidden text-[11px] uppercase tracking-[0.3em] text-[#14161b]/50 sm:right-10 lg:bottom-12 lg:right-16 lg:block">Drag the bead</p>
      </div>
    </section>
  );
}
