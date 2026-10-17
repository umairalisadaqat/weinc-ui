import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

// Demo data: one reading per period. `value` is on the 0 to 100 scale printed on the dial.
const periods = [
  { label: "Today", long: "today", value: 62, delta: -9, against: "yesterday" },
  { label: "Week", long: "this week", value: 74, delta: 6, against: "last week" },
  { label: "Month", long: "this month", value: 81, delta: 4, against: "last month" },
  { label: "Quarter", long: "this quarter", value: 68, delta: -3, against: "last quarter" },
];
const METRIC = "On-time dispatch";
const UNIT = "%";
const TARGET = 75; // the small brass mark on the dial
const START = 1; // the period it opens on
const ARC = 270; // degrees the printed scale covers
const ZETA = 0.3; // needle damping ratio: 1 stops dead, 0.15 rings for a while
const OMEGA = 7.2; // needle natural frequency (radians a second): higher is a stiffer movement
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';

const rad = (d: number) => (d * Math.PI) / 180;
const valueAngle = (v: number) => rad(-ARC / 2 + (ARC * Math.max(-2, Math.min(102, v))) / 100);

const VERT = `ATTR vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;
const TONE = `
vec3 tone(vec3 x){ x *= 0.9; vec3 a = x * (2.51 * x + 0.03); vec3 b = x * (2.43 * x + 0.59) + 0.14; return pow(clamp(a / b, 0.0, 1.0), vec3(1.0 / 2.2)); }
`;

// The photograph: an instrument lying on an oak desk in a shaft of afternoon sun from a window to the left.
const SCENE = `
precision highp float;
uniform vec2 uRes; uniform vec4 uJit; uniform float uSeed; uniform float uAng; uniform float uTgtAng;
uniform vec3 uCam; uniform vec3 uTgt; uniform float uFoc; uniform vec2 uShift; uniform float uFocus;
uniform sampler2D uTex; uniform float uDirect; uniform float uSway;
const float RC = 1.56; const float HC = 0.30; const float RD = 1.30; const float YD = 0.215;
const float RT = 1.43; const float YT = 0.335; const float rt = 0.105;
const float GR = 4.9; const float GY = 0.47;
const float PI = 3.14159265;
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ float s = 0.0; float a = 0.5; for (int i = 0; i < 4; i++) { s += a * n2(p); p = p * 2.03 + 7.1; a *= 0.5; } return s; }

vec3 sunDir(){ return normalize(vec3(-0.66, 0.70, 0.30)); }
const vec3 SUN = vec3(1.0, 0.82, 0.6) * 3.4;

// Frame of the needle: x across it, y along it from the arbor to the tip.
vec2 nFrame(vec2 xz, float a){ float s = sin(a); float c = cos(a); return vec2(xz.x * c - xz.y * s, xz.x * s + xz.y * c); }

float sdCase(vec3 p){
  float r = length(p.xz);
  vec2 q = vec2(r - (RC - 0.06), p.y - 0.15);
  float body = length(max(abs(q) - vec2(0.0, 0.09), 0.0)) - 0.06;
  body = min(body, max(r - RC + 0.02, max(p.y - 0.2, -p.y)));
  float bez = length(vec2(r - RT, (p.y - YT) * 1.15)) - rt;
  float lip = max(abs(r - (RD + 0.035)) - 0.035, max(p.y - (YD + 0.07), YD - 0.02 - p.y));
  float d = min(min(body, bez), lip);
  // the well the dial sits in
  d = max(d, -max(r - RD, YD - p.y));
  d = min(d, max(r - RD, max(p.y - YD, -p.y)));
  return d;
}
float sdNeedle(vec3 p){
  vec2 k = nFrame(p.xz, uAng);
  float y = p.y - (YD + 0.052);
  float along = clamp(k.y, -0.27, 1.13);
  float w = mix(0.016, 0.0045, clamp((k.y + 0.05) / 1.18, 0.0, 1.0));
  float blade = max(max(abs(k.x) - w, abs(k.y - 0.43) - 0.70), abs(y) - 0.006);
  float tail = max(length(k - vec2(0.0, -0.22)) - 0.058, abs(y) - 0.008);
  float arbor = max(length(p.xz) - 0.085, max(p.y - (YD + 0.068), YD - p.y));
  float cap = length(vec3(p.x, (p.y - (YD + 0.07)) * 1.8, p.z)) - 0.05;
  return min(min(blade, tail), min(arbor, cap)) + along * 0.0;
}
float map(vec3 p){ return min(sdCase(p), sdNeedle(p)); }

vec2 bound(vec3 ro, vec3 rd){
  float a = dot(rd.xz, rd.xz); float b = dot(ro.xz, rd.xz); float c = dot(ro.xz, ro.xz) - 1.6 * 1.6;
  float h = b * b - a * c; if (h < 0.0 || a < 1e-6) return vec2(1.0, -1.0);
  h = sqrt(h); float t0 = (-b - h) / a; float t1 = (-b + h) / a;
  if (abs(rd.y) > 1e-5) { float ya = (0.0 - ro.y) / rd.y; float yb = (0.46 - ro.y) / rd.y; t0 = max(t0, min(ya, yb)); t1 = min(t1, max(ya, yb)); }
  return vec2(max(t0, 0.0), t1);
}
float march(vec3 ro, vec3 rd, int n, float eps){
  vec2 tb = bound(ro, rd); if (tb.x > tb.y) return -1.0;
  float t = tb.x;
  for (int i = 0; i < 96; i++) { if (i >= n) break; float d = map(ro + rd * t); if (d < eps) return t; t += d * 0.8; if (t > tb.y) break; }
  return -1.0;
}
vec3 calcN(vec3 p){
  vec2 e = vec2(0.0007, -0.0007);
  return normalize(e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) + e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx));
}
float calcAO(vec3 p, vec3 n){
  float o = 0.0; float s = 1.0;
  for (int i = 1; i <= 5; i++) { float h = 0.01 + 0.045 * float(i); o += (h - map(p + n * h)) * s; s *= 0.7; }
  return clamp(1.0 - 2.2 * o, 0.0, 1.0);
}
float softShadow(vec3 ro, vec3 rd, float k){
  float res = 1.0; float t = 0.008;
  for (int i = 0; i < 28; i++) { float h = map(ro + rd * t); res = min(res, k * h / t); t += clamp(h, 0.01, 0.2); if (res < 0.005 || t > 3.0) break; }
  return clamp(res, 0.0, 1.0);
}
// The window the sun comes through: glazing bars throw their shadow across the desk and the dial.
float windowGobo(vec3 p, float soft){
  vec3 L = sunDir(); float t = (-6.5 - p.x) / L.x; vec3 q = p + L * t;
  vec2 w = vec2(q.z + 0.2 + uSway, q.y - 1.1);
  float s = soft * t + 0.01;
  float inside = smoothstep(-s, s, w.x + 4.6) * smoothstep(s, -s, w.x - 4.4) * smoothstep(-s, s, w.y) * smoothstep(s, -s, w.y - 9.0);
  vec2 m = abs(fract(w / vec2(2.25, 3.1)) - 0.5) * vec2(2.25, 3.1);
  float bars = smoothstep(0.07 - s, 0.07 + s, m.x) * smoothstep(0.06 - s, 0.06 + s, m.y);
  return inside * bars;
}
vec3 oak(vec2 p){
  float warp = fbm(p * vec2(0.25, 1.1)) * 1.6 + 0.4 * fbm(p * vec2(1.0, 6.0));
  float ring = fract(p.y * 2.6 + warp * 1.8);
  float grain = smoothstep(0.0, 0.12, ring) * smoothstep(1.0, 0.4, ring);
  float fine = n2(p * vec2(1.5, 160.0));
  float pore = smoothstep(0.7, 0.95, n2(p * vec2(4.0, 220.0)));
  vec3 lite = vec3(0.33, 0.17, 0.08); vec3 dark = vec3(0.13, 0.06, 0.028);
  vec3 c = mix(dark, lite, 0.3 + 0.55 * grain + 0.15 * fine);
  c *= 0.85 + 0.3 * fbm(p * vec2(0.4, 2.0) + 3.0);
  return c * (1.0 - 0.35 * pore);
}
// The room as a reflection sees it: warm plaster, the bright window left, the desk below.
vec3 room(vec3 ro, vec3 rd, float rough){
  if (rd.y < 0.0) {
    float t = -ro.y / rd.y; vec3 gp = ro + rd * t;
    float lit = windowGobo(gp, 0.006 + rough * 0.1) * max(sunDir().y, 0.0);
    vec3 a = oak(gp.xz);
    return a * (SUN * lit * 0.9 + vec3(0.55, 0.5, 0.45) * 0.42) * exp(-0.012 * t * t);
  }
  vec3 c = mix(vec3(0.2, 0.15, 0.11), vec3(0.06, 0.05, 0.045), smoothstep(0.05, 0.6, rd.y)) * 0.8;
  // a tall sash window behind the desk, seen as directions: the crystal and the chrome both carry it
  if (rd.z > 0.05) {
    vec2 w = vec2(rd.x / rd.z + 0.73, rd.y / rd.z - 0.8);
    float s = 0.004 + rough * 0.3;
    float inside = smoothstep(-s, s, w.x) * smoothstep(s, -s, w.x - 0.36) * smoothstep(-s, s, w.y) * smoothstep(s, -s, w.y - 0.46);
    vec2 m = abs(fract(w / vec2(0.18, 0.23)) - 0.5) * vec2(0.18, 0.23);
    float bars = smoothstep(0.009 - s, 0.009 + s, m.x) * smoothstep(0.008 - s, 0.008 + s, m.y);
    c = mix(c, mix(vec3(2.4, 2.2, 1.95), vec3(1.3, 1.6, 2.2), smoothstep(0.0, 0.46, w.y)) * 6.5 * (1.0 - 0.8 * smoothstep(0.08, 0.3, rough)), inside * bars);
  }
  // the window on the left wall
  if (rd.x < -0.05) {
    float t = (-6.5 - ro.x) / rd.x; vec3 q = ro + rd * t;
    vec2 w = vec2(q.z + 0.2 + uSway, q.y - 1.1);
    float s = 0.02 + rough * 0.6 * t * 0.15;
    float inside = smoothstep(-s, s, w.x + 4.6) * smoothstep(s, -s, w.x - 4.4) * smoothstep(-s, s, w.y) * smoothstep(s, -s, w.y - 9.0);
    vec2 m = abs(fract(w / vec2(2.25, 3.1)) - 0.5) * vec2(2.25, 3.1);
    float bars = smoothstep(0.07 - s, 0.07 + s, m.x) * smoothstep(0.06 - s, 0.06 + s, m.y);
    vec3 sky = mix(vec3(2.6, 2.4, 2.1), vec3(1.4, 1.7, 2.3), smoothstep(1.0, 8.0, q.y));
    c = mix(c, sky * 1.8, inside * bars);
    c = mix(c, vec3(0.86, 0.8, 0.7) * 0.9, inside * (1.0 - bars));
  }
  // sun on the far wall
  c += vec3(1.0, 0.8, 0.55) * 0.5 * smoothstep(0.2, 0.9, rd.z) * smoothstep(0.1, 0.4, rd.y) * smoothstep(0.7, 0.2, rd.y);
  return c;
}

struct Mat { vec3 alb; vec3 f0; float rough; float kind; };
Mat getMat(vec3 p, inout vec3 n, out vec3 emi){
  Mat m; m.alb = vec3(0.0); m.f0 = vec3(0.04); m.rough = 0.2; m.kind = 0.0; emi = vec3(0.0);
  float r = length(p.xz);
  if (sdNeedle(p) < sdCase(p) + 0.0005) {
    vec2 k = nFrame(p.xz, uAng);
    if (r < 0.088 && p.y > YD + 0.005) { m.f0 = vec3(0.9, 0.87, 0.8); m.rough = 0.08; m.kind = 2.0; return m; }
    // red lacquer, a touch darker where the blade is pressed thin
    m.alb = vec3(0.62, 0.035, 0.025) * (0.85 + 0.15 * smoothstep(1.1, 0.3, k.y)); m.f0 = vec3(0.05); m.rough = 0.18; m.kind = 1.0;
    return m;
  }
  if (r < RD + 0.001 && p.y < YD + 0.004) {
    // vitreous enamel dial: cream, very slightly orange-peeled, printed in black and red
    vec2 uv = vec2(p.x, -p.z) / (2.0 * RD) + 0.5;
    vec4 ink = texture2D(uTex, uv);
    float peel = n2(p.xz * 70.0) - 0.5; float peel2 = n2(p.zx * 70.0 + 4.0) - 0.5;
    n = normalize(n + vec3(peel, 0.0, peel2) * 0.012);
    vec3 cream = vec3(0.80, 0.70, 0.50) * (0.97 + 0.06 * fbm(p.xz * 3.0));
    cream *= 1.0 - 0.12 * smoothstep(0.95, 1.3, r);
    m.alb = mix(cream, vec3(0.012, 0.011, 0.01), ink.r);
    m.alb = mix(m.alb, vec3(0.55, 0.035, 0.02), ink.g);
    m.alb = mix(m.alb, vec3(0.62, 0.45, 0.18), ink.b);
    m.f0 = mix(vec3(0.045), vec3(0.75, 0.55, 0.25), ink.b); m.rough = mix(0.09, 0.3, max(ink.r, ink.g)); m.kind = 1.0;
    return m;
  }
  float bezel = length(vec2(r - RT, (p.y - YT) * 1.15)) - rt;
  if (bezel < 0.004 || (p.y > YD - 0.03 && r < RD + 0.08)) {
    // polished chrome: the bezel and the inner lip
    m.f0 = vec3(0.92, 0.9, 0.86); m.rough = 0.025; m.kind = 2.0;
    return m;
  }
  // stove-enamelled black case
  m.alb = vec3(0.012, 0.012, 0.013); m.f0 = vec3(0.05); m.rough = 0.22; m.kind = 1.0;
  return m;
}
vec3 fres(vec3 f0, float c){ return f0 + (1.0 - f0) * pow(1.0 - clamp(c, 0.0, 1.0), 5.0); }
vec3 direct(vec3 p, vec3 n, vec3 rd, Mat m, float sh, float ao){
  vec3 L = sunDir();
  float ndl = max(dot(n, L), 0.0);
  vec3 h = normalize(L - rd); float a2 = max(m.rough * m.rough, 0.002);
  float nh = max(dot(n, h), 0.0); float d = nh * nh * (a2 - 1.0) + 1.0; float D = a2 / (PI * d * d);
  vec3 spec = fres(m.f0, max(dot(h, -rd), 0.0)) * min(D, 60.0) * 0.25;
  vec3 c = SUN * sh * ndl * (m.alb + spec);
  c += m.alb * (vec3(0.55, 0.5, 0.45) * 0.45 * (0.5 + 0.5 * n.y) + vec3(0.6, 0.45, 0.3) * 0.12 * max(-n.y, 0.0)) * ao;
  return c;
}
vec3 shadeLite(vec3 p, vec3 n, vec3 rd){
  vec3 emi; Mat m = getMat(p, n, emi);
  float g = windowGobo(p, 0.008);
  vec3 r = reflect(rd, n);
  return direct(p, n, rd, m, g, 0.8) + fres(m.f0, dot(-rd, n)) * room(p, r, m.rough);
}
vec3 trace(vec3 p, vec3 r, float rough){
  float t = march(p, r, 40, 0.0015);
  if (t > 0.0) { vec3 hp = p + r * t; return shadeLite(hp, calcN(hp), r); }
  return room(p, r, rough);
}
vec3 shadeObj(vec3 p, vec3 n, vec3 rd, vec2 rnd){
  vec3 gn = n; vec3 emi;
  Mat m = getMat(p, n, emi);
  float ao = calcAO(p, gn);
  float sh = softShadow(p + gn * 0.004, sunDir(), 14.0) * windowGobo(p, 0.008);
  vec3 col = direct(p, n, rd, m, sh, ao);
  vec3 r = reflect(rd, n);
  vec3 jr = normalize(r + vec3(rnd.x, rnd.y, rnd.x * rnd.y) * m.rough * 0.6);
  vec3 s = m.kind == 2.0 ? trace(p + gn * 0.004, jr, m.rough) : room(p, jr, m.rough + 0.05) * (0.3 + 0.7 * ao);
  return col + fres(m.f0, dot(-rd, n)) * s * (0.5 + 0.5 * ao);
}
vec3 shadeDesk(vec3 gp, vec3 rd, vec2 rnd, float dist){
  vec3 a = oak(gp.xz);
  float near = step(length(gp.xz), 6.0);
  float occ = 1.0; float sh = 1.0;
  if (near > 0.5) {
    occ = smoothstep(-0.03, 0.55, map(gp + vec3(0.0, 0.04, 0.0)));
    occ = mix(occ, 1.0, 0.25);
    sh = softShadow(gp + vec3(0.0, 0.002, 0.0), sunDir(), 9.0);
  }
  float g = windowGobo(gp, 0.006);
  vec3 L = sunDir();
  vec3 col = a * (SUN * g * sh * L.y + vec3(0.55, 0.5, 0.45) * 0.42 * occ);
  // oiled finish: a soft sheen of the window and of the instrument
  vec3 n = normalize(vec3((n2(gp.xz * 4.0) - 0.5) * 0.02, 1.0, (n2(gp.zx * 4.0) - 0.5) * 0.02));
  vec3 r = normalize(reflect(rd, n) + vec3(rnd.x, 0.0, rnd.y) * 0.12);
  float f = 0.04 + 0.96 * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0);
  vec3 refl = near > 0.5 ? trace(gp + vec3(0.0, 0.002, 0.0), r, 0.25) : room(gp, r, 0.25);
  col += f * refl * 0.55 * occ;
  col *= mix(1.0, 0.25, smoothstep(9.0, 30.0, dist));
  return col;
}
// The domed crystal: thin glass, so it only adds what it reflects and dims what it lets through.
vec2 glassHit(vec3 ro, vec3 rd){
  vec3 c = vec3(0.0, GY - GR, 0.0); vec3 oc = ro - c;
  float b = dot(oc, rd); float h = b * b - dot(oc, oc) + GR * GR;
  if (h < 0.0) return vec2(-1.0);
  float t = -b - sqrt(h); vec3 p = ro + rd * t;
  if (t < 0.0 || length(p.xz) > RD + 0.07) return vec2(-1.0);
  return vec2(t, length(p.xz));
}
void main(){
  vec2 fc = gl_FragCoord.xy + uJit.xy;
  vec2 uv = (fc - 0.5 * uRes) / uRes.y - uShift;
  vec3 fw = normalize(uTgt - uCam); vec3 rt3 = normalize(cross(vec3(0.0, 1.0, 0.0), fw)); vec3 up = cross(fw, rt3);
  vec3 rd = normalize(fw * uFoc + rt3 * uv.x + up * uv.y);
  vec3 ro = uCam;
  vec3 fp = ro + rd * (uFocus / dot(rd, fw));
  ro += rt3 * uJit.z + up * uJit.w; rd = normalize(fp - ro);
  float ign = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))) + uSeed);
  float ang = ign * 6.2831853; float rr = sqrt(fract(ign * 7.13 + uSeed * 3.7));
  vec2 rnd = vec2(cos(ang), sin(ang)) * rr * step(0.001, uSeed);
  float t = march(ro, rd, 96, 0.0003);
  float tg = rd.y < 0.0 ? -ro.y / rd.y : 1e9;
  vec3 col;
  if (t > 0.0 && t < tg) { vec3 p = ro + rd * t; col = shadeObj(p, calcN(p), rd, rnd); }
  else if (tg < 1e8) col = shadeDesk(ro + rd * tg, rd, rnd, tg);
  else col = room(ro, rd, 0.0);
  vec2 gh = glassHit(ro, rd);
  if (gh.x > 0.0 && (t < 0.0 || gh.x < t)) {
    vec3 gp = ro + rd * gh.x; vec3 gn = normalize(gp - vec3(0.0, GY - GR, 0.0));
    float cs = clamp(dot(-rd, gn), 0.0, 1.0);
    float F = 0.04 + 0.96 * pow(1.0 - cs, 5.0);
    float edge = smoothstep(RD - 0.18, RD + 0.06, gh.y);
    F = mix(F, 0.35, edge * 0.5);
    vec3 gr = reflect(rd, gn);
    vec3 refl = room(gp, normalize(gr + vec3(rnd.x, 0.0, rnd.y) * 0.01), 0.0);
    // a faint film of dust and fingerprints, lit only where the window lands on it
    float smudge = fbm(gp.xz * 2.2 + 11.0) * smoothstep(0.55, 0.85, fbm(gp.zx * 1.3));
    col = col * (1.0 - F) * mix(vec3(1.0), vec3(0.93, 0.96, 0.95), edge) + F * refl + smudge * 0.04 * refl;
  }
  col = min(col, vec3(30.0));
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
    vec3 s = texture2D(uAcc, uv + vec2(cos(a), sin(a)) * r * 0.03 * vec2(uRes.y / uRes.x, 1.0)).rgb;
    b += min(max(s - 1.4, 0.0), vec3(6.0)) * (1.0 - 0.6 * r);
  }
  c += b * vec3(0.011, 0.0095, 0.008);
  vec2 q = (uv - uCentre) * vec2(uRes.x / uRes.y, 1.0);
  c *= 1.0 - 0.3 * smoothstep(0.35, 1.25, length(q));
  c = tone(c);
  float g = h21(gl_FragCoord.xy + uGrain * 91.7) - 0.5;
  c += g * 0.02 * (1.0 - 0.4 * c.g);
  outC = vec4(c, 1.0);
}
`;

// The dial printing as a flat plan: black ink in red, red ink in green, brass in blue.
function dialArt() {
  const S = 2048, RD = 1.3;
  const cv = document.createElement("canvas");
  cv.width = S; cv.height = S;
  const g = cv.getContext("2d");
  if (!g) return cv;
  const px = S / (2 * RD);
  g.fillStyle = "#000"; g.fillRect(0, 0, S, S);
  g.translate(S / 2, S / 2);
  g.textAlign = "center"; g.textBaseline = "middle";
  const at = (v: number) => rad(-ARC / 2 + (ARC * v) / 100);
  // red band below 40
  g.strokeStyle = "#0f0"; g.lineWidth = 0.05 * px; g.lineCap = "butt";
  g.beginPath(); g.arc(0, 0, 1.13 * px, at(0) - Math.PI / 2, at(40) - Math.PI / 2); g.stroke();
  g.strokeStyle = "#f00"; g.lineWidth = 0.008 * px;
  g.beginPath(); g.arc(0, 0, 1.2 * px, at(0) - Math.PI / 2, at(100) - Math.PI / 2); g.stroke();
  for (let i = 0; i <= 100; i++) {
    const major = i % 10 === 0, mid = i % 5 === 0;
    if (!major && !mid && i % 1 !== 0) continue;
    g.save(); g.rotate(at(i));
    const len = major ? 0.17 : mid ? 0.11 : 0.06, w = major ? 0.022 : mid ? 0.013 : 0.007;
    g.fillStyle = "#f00"; g.fillRect((-w * px) / 2, -1.2 * px, w * px, len * px);
    if (major) {
      g.font = `600 ${0.14 * px}px ${FONT}`;
      g.translate(0, -0.9 * px); g.rotate(-at(i));
      g.fillText(String(i), 0, 0);
    }
    g.restore();
  }
  // target mark in brass
  g.save(); g.rotate(at(TARGET)); g.fillStyle = "#00f";
  g.beginPath(); g.moveTo(0, -1.215 * px); g.lineTo(-0.05 * px, -1.295 * px); g.lineTo(0.05 * px, -1.295 * px); g.closePath(); g.fill(); g.restore();
  g.fillStyle = "#f00";
  g.font = `600 ${0.075 * px}px ${FONT}`;
  const track = (text: string, y: number, sp: number) => {
    const chars = text.split(""); const widths = chars.map((c) => g.measureText(c).width);
    const total = widths.reduce((a, b) => a + b, 0) + sp * px * (chars.length - 1);
    let x = -total / 2;
    chars.forEach((c, k) => { g.fillText(c, x + widths[k] / 2, y * px); x += widths[k] + sp * px; });
  };
  track(METRIC.toUpperCase(), 0.42, 0.022);
  g.font = `500 ${0.2 * px}px ${SERIF}`; g.fillText(UNIT, 0, -0.42 * px);
  g.font = `italic 500 ${0.075 * px}px ${SERIF}`;
  g.fillText("Harrow & Peel", 0, 0.56 * px);
  return cv;
}

// No WebGL or reduced motion on a software renderer: the same instrument as an SVG still.
function Still({ value }: { value: number }) {
  const deg = -ARC / 2 + (ARC * value) / 100;
  const ticks = Array.from({ length: 21 }, (_, i) => i * 5);
  return (
    <div aria-hidden="true" className="absolute left-1/2 top-[34%] w-[340px] -translate-x-1/2 -translate-y-1/2 sm:w-[420px] lg:left-[68%] lg:top-1/2 lg:w-[520px]">
      <div className="absolute inset-x-[-10%] bottom-[-12%] top-[30%] rounded-full bg-black/30 blur-2xl" style={{ transform: "translate(14%, 6%) scaleY(0.5)" }} />
      <svg viewBox="-160 -160 320 320" className="relative w-full" style={{ transform: "perspective(900px) rotateX(36deg)" }}>
        <defs>
          <radialGradient id="kpi-gauge-still-cream" cx="40%" cy="35%" r="75%"><stop offset="0" stopColor="#f3e7cc" /><stop offset="0.8" stopColor="#e3d2ad" /><stop offset="1" stopColor="#c9b48a" /></radialGradient>
          <linearGradient id="kpi-gauge-still-chrome" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="0.3" stopColor="#8f9196" /><stop offset="0.55" stopColor="#f4f4f2" /><stop offset="0.8" stopColor="#4a4b50" /><stop offset="1" stopColor="#d9d9d6" /></linearGradient>
          <linearGradient id="kpi-gauge-still-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.55" /><stop offset="0.35" stopColor="#fff" stopOpacity="0.05" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
        </defs>
        <circle r="156" fill="#141313" />
        <circle r="150" fill="none" stroke="url(#kpi-gauge-still-chrome)" strokeWidth="14" />
        <circle r="134" fill="url(#kpi-gauge-still-cream)" />
        <circle r="112" fill="none" stroke="#b3241a" strokeWidth="5" strokeDasharray="211 1000" transform="rotate(-225)" />
        {ticks.map((v) => (
          <g key={v} transform={`rotate(${-ARC / 2 + (ARC * v) / 100})`}>
            <rect x={v % 10 ? -0.7 : -1.2} y={-124} width={v % 10 ? 1.4 : 2.4} height={v % 10 ? 9 : 16} fill="#141210" />
            {v % 10 === 0 && <text y={-96} transform={`rotate(${ARC / 2 - (ARC * v) / 100} 0 -96)`} textAnchor="middle" dominantBaseline="middle" fontSize="14" fontWeight="600" fill="#141210" style={{ fontFamily: FONT }}>{v}</text>}
          </g>
        ))}
        <text y="46" textAnchor="middle" fontSize="8" letterSpacing="2" fontWeight="600" fill="#141210" style={{ fontFamily: FONT }}>{METRIC.toUpperCase()}</text>
        <g transform={`rotate(${deg})`}>
          <path d="M-1.6 22 L-0.5 -118 L0.5 -118 L1.6 22 Z" fill="#9c120c" />
          <circle cy="22" r="6" fill="#9c120c" />
        </g>
        <circle r="9" fill="#cfcfcb" stroke="#6b6b68" />
        <ellipse cx="-40" cy="-60" rx="95" ry="55" fill="url(#kpi-gauge-still-glass)" transform="rotate(-30)" />
      </svg>
    </div>
  );
}

export default function KpiGaugeCardOnSunlitDesk() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const readout = useRef<HTMLSpanElement>(null);
  const radios = useRef<(HTMLButtonElement | null)[]>([]);
  const [period, setPeriod] = useState(START);
  const [shown, setShown] = useState<"wait" | "gl" | "still">("wait");
  const api = useRef<{ go: (i: number, fromUser: boolean) => void } | null>(null);
  const periodRef = useRef(START);

  useEffect(() => {
    const box = stage.current, cv = canvas.current;
    if (!box || !cv) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const s = {
      v: periods[START].value, vel: 0, target: periods[START].value, shown: periods[START].value,
      px: 0, py: 0, sx: 0, sy: 0, count: 0, fresh: true, frame: 0, slow: 0, visible: true, raf: 0, last: 0, t0: 0,
      touched: false, demoAt: 0, first: true, sway: 0,
    };
    const setReadout = (v: number) => { if (readout.current) readout.current.textContent = String(Math.round(v)); };

    const opts = { antialias: false, alpha: false, powerPreference: "high-performance" as const };
    const gl2 = cv.getContext("webgl2", opts) as WebGL2RenderingContext | null;
    const gl = (gl2 ?? cv.getContext("webgl", opts)) as WebGLRenderingContext | null;
    const fallback = () => {
      setShown("still");
      api.current = { go: (i) => { periodRef.current = i; setPeriod(i); setReadout(periods[i].value); } };
    };
    if (!gl) { fallback(); return; }
    const canAcc = !!gl2 && (!!gl2.getExtension("EXT_color_buffer_float") || !!gl2.getExtension("EXT_color_buffer_half_float"));
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    const software = /swiftshader|llvmpipe|software|basic render/i.test(renderer);
    const calm = reduce || software;

    const head = gl2 ? "#version 300 es\n#define ATTR in\n#define texture2D texture\n" : "#define ATTR attribute\n";
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
    if (!scene || (canAcc && !post)) { fallback(); return; }
    const U = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);
    const su = Object.fromEntries(["uRes", "uJit", "uSeed", "uAng", "uTgtAng", "uCam", "uTgt", "uFoc", "uShift", "uFocus", "uTex", "uDirect", "uSway"].map((n) => [n, U(scene, n)]));
    const pu = post ? Object.fromEntries(["uAcc", "uRes", "uGrain", "uCentre"].map((n) => [n, U(post, n)])) : {};

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, dialArt());
    gl.generateMipmap(gl.TEXTURE_2D);
    const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const acc = canAcc ? gl.createTexture() : null;
    const fbo = canAcc ? gl.createFramebuffer() : null;
    let W = 0, H = 0, scale = 1, cssW = 1, cssH = 1;
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

    const draw = (alpha: number, sample: number) => {
      const wide = cssW >= 1024, aspect = cssW / cssH;
      const el = 0.98 - s.sy * 0.04, az = 0.12 + s.sx * 0.06, dist = 9.3;
      const tgt = [0, 0.18, 0];
      const cam = [dist * Math.sin(az) * Math.cos(el), tgt[1] + dist * Math.sin(el), -dist * Math.cos(az) * Math.cos(el)];
      const foc = 2.35 * Math.min(1, aspect / 0.95);
      const jx = sample ? halton(sample, 2) - 0.5 : 0, jy = sample ? halton(sample, 3) - 0.5 : 0;
      const la = halton(sample, 5) * Math.PI * 2, lr = sample ? Math.sqrt(halton(sample, 7)) * 0.05 : 0;
      gl.useProgram(scene);
      gl.bindFramebuffer(gl.FRAMEBUFFER, canAcc ? fbo : null);
      gl.viewport(0, 0, W, H);
      if (canAcc && alpha < 1) { gl.enable(gl.BLEND); gl.blendColor(0, 0, 0, alpha); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA); } else gl.disable(gl.BLEND);
      gl.uniform2f(su.uRes, W, H);
      gl.uniform4f(su.uJit, canAcc ? jx : 0, canAcc ? jy : 0, canAcc ? Math.cos(la) * lr : 0, canAcc ? Math.sin(la) * lr : 0);
      gl.uniform1f(su.uSeed, canAcc && sample ? (sample * 0.61803) % 1 || 0.5 : 0);
      gl.uniform1f(su.uAng, valueAngle(s.v)); gl.uniform1f(su.uTgtAng, valueAngle(TARGET));
      gl.uniform3f(su.uCam, cam[0], cam[1], cam[2]); gl.uniform3f(su.uTgt, tgt[0], tgt[1], tgt[2]);
      gl.uniform1f(su.uFoc, foc);
      gl.uniform2f(su.uShift, wide ? 0.2 * aspect : 0, wide ? 0.0 : 0.17);
      gl.uniform1f(su.uFocus, Math.hypot(cam[0], cam[1] - 0.3, cam[2]));
      gl.uniform1i(su.uTex, 0);
      gl.uniform1f(su.uDirect, canAcc ? 0 : 1);
      gl.uniform1f(su.uSway, s.sway);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (canAcc && post) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.disable(gl.BLEND);
        gl.useProgram(post);
        gl.uniform1i(pu.uAcc, 1); gl.uniform2f(pu.uRes, W, H);
        gl.uniform1f(pu.uGrain, calm ? 1 : s.frame % 64);
        gl.uniform2f(pu.uCentre, wide ? 0.7 : 0.5, wide ? 0.5 : 0.66);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };

    const go = (i: number, fromUser: boolean) => {
      const k = (i + periods.length) % periods.length;
      if (fromUser) s.touched = true;
      s.target = periods[k].value;
      if (k !== periodRef.current) { periodRef.current = k; setPeriod(k); }
      if (reduce) { s.v = s.target; s.vel = 0; s.shown = s.target; setReadout(s.target); s.count = 0; s.fresh = true; }
      wake();
    };
    api.current = { go };

    const frame = (now: number) => {
      s.raf = 0;
      if (!s.visible) return;
      const dtRaw = s.last ? (now - s.last) / 1000 : 0.016;
      const dt = Math.min(0.033, dtRaw);
      s.last = now; s.frame++;
      if (!s.t0) { s.t0 = now; s.demoAt = now + 4200; }
      // self-running demo: opens settled on a reading, holds, then steps through the periods until touched
      if (!calm && !s.touched && now > s.demoAt) { go(periodRef.current + 1, false); s.demoAt = now + 3400; }

      let moving = false;
      if (!reduce) {
        // a damped second-order movement, like a moving-coil meter: it overshoots, rings twice and settles
        const steps = 4, h = dt / steps;
        for (let i = 0; i < steps; i++) {
          const acc2 = OMEGA * OMEGA * (s.target - s.v) - 2 * ZETA * OMEGA * s.vel;
          s.vel += acc2 * h; s.v += s.vel * h;
        }
        if (Math.abs(s.vel) > 0.02 || Math.abs(s.target - s.v) > 0.01) moving = true; else { s.v = s.target; s.vel = 0; }
        // the printed number eases in critically damped, so it never reads a value past the real one
        const ds = s.target - s.shown;
        if (Math.abs(ds) > 0.02) { s.shown += ds * (1 - Math.exp(-dt * 5)); setReadout(s.shown); } else if (s.shown !== s.target) { s.shown = s.target; setReadout(s.target); }
      }
      if (!calm) {
        s.sx += (s.px - s.sx) * (1 - Math.exp(-dt * 2.5)); s.sy += (s.py - s.sy) * (1 - Math.exp(-dt * 2.5));
        if (Math.abs(s.px - s.sx) + Math.abs(s.py - s.sy) > 0.002) moving = true;
      }

      if (s.fresh || !canAcc) { draw(1, 0); s.fresh = false; s.count = 1; }
      else if (moving) { draw(Math.abs(s.vel) > 6 ? 0.55 : 0.2, 1 + (s.frame % 64)); s.count = 4; }
      else if (s.count < 48) { s.count++; draw(1 / s.count, s.count); }
      if (s.first) { s.first = false; setShown("gl"); }

      if (!calm && dtRaw > 0.026) s.slow++; else s.slow = Math.max(0, s.slow - 2);
      if (s.slow > 45 && scale > 0.5) { scale *= 0.82; s.slow = 0; size(); }

      if (moving || s.count < 48 || (!calm && !s.touched)) s.raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!s.raf && s.visible) { s.last = 0; s.raf = requestAnimationFrame(frame); } };

    size();
    const ro = new ResizeObserver(() => { size(); wake(); });
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
    const leave = () => { s.px = 0; s.py = 0; };
    box.addEventListener("pointermove", move);
    box.addEventListener("pointerleave", leave);
    const lost = (e: Event) => { e.preventDefault(); fallback(); };
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

  const pick = (i: number) => {
    if (api.current) api.current.go(i, true); else { periodRef.current = i; setPeriod(i); }
  };
  const onKey = (e: ReactKeyboardEvent<HTMLButtonElement>, i: number) => {
    let k = i;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") k = (i + 1) % periods.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") k = (i - 1 + periods.length) % periods.length;
    else if (e.key === "Home") k = 0;
    else if (e.key === "End") k = periods.length - 1;
    else return;
    e.preventDefault();
    pick(k);
    radios.current[k]?.focus();
  };

  const p = periods[period];
  const up = p.delta >= 0;

  return (
    <section className="relative isolate overflow-hidden bg-[#2a1a10] text-[#1d140d]" style={{ fontFamily: FONT }}>
      <div ref={stage} className="relative mx-auto h-[760px] w-full max-w-[1600px]" style={{ background: "radial-gradient(80% 70% at 66% 45%, #a0683a 0%, #6b4223 55%, #3a2414 100%)" }}>
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${shown === "gl" ? "opacity-100" : "opacity-0"}`} />
        {shown === "still" && (
          <>
            <div aria-hidden="true" className="absolute inset-0" style={{ background: "repeating-linear-gradient(118deg, transparent 0 210px, rgba(30,12,2,0.35) 210px 226px), linear-gradient(28deg, transparent 0 55%, rgba(25,10,2,0.45) 55%)" }} />
            <Still value={p.value} />
          </>
        )}

        <div className="pointer-events-none absolute inset-0 flex flex-col justify-end px-5 pb-7 sm:px-10 lg:justify-center lg:px-16 lg:pb-0">
          <div className="pointer-events-auto w-full max-w-[25rem] rounded-[28px] bg-[#f5ecdc]/[0.93] p-6 shadow-[0_30px_60px_-20px_rgba(30,14,4,0.6),0_2px_0_rgba(255,255,255,0.6)_inset] ring-1 ring-black/5 backdrop-blur-md sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.2em] text-[#5b4636]">{METRIC}</h2>
              <span className="rounded-full border border-[#7a5c45]/40 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[#5b4636]">Demo data</span>
            </div>
            <p className="mt-5 flex items-start leading-none sm:mt-6">
              <span ref={readout} className="text-[104px] font-semibold tabular-nums tracking-[-0.06em] text-[#1d140d] sm:text-[132px]" style={{ lineHeight: 0.82 }}>{p.value}</span>
              <span className="ml-1 mt-2 text-[40px] text-[#5b4636] sm:text-[48px]" style={{ fontFamily: SERIF }}>{UNIT}</span>
            </p>
            <p aria-live="polite" className="mt-4 text-[18px] leading-snug text-[#4a3829] sm:text-[20px]" style={{ fontFamily: SERIF }}>
              <span className="sr-only">{METRIC} {p.long}: {p.value} percent. </span>
              <span className={`font-semibold not-italic ${up ? "text-[#2f6b3a]" : "text-[#9c1f14]"}`} style={{ fontFamily: FONT }}>{up ? "Up" : "Down"} {Math.abs(p.delta)} pts</span>{" "}
              <span className="italic">on {p.against}. Target {TARGET}{UNIT}.</span>
            </p>
            <div role="radiogroup" aria-label="Period" className="mt-6 grid grid-cols-4 gap-1 rounded-full bg-[#e4d6bf] p-1 sm:mt-7">
              {periods.map((pr, i) => (
                <button
                  key={pr.label}
                  ref={(el) => { radios.current[i] = el; }}
                  type="button"
                  role="radio"
                  aria-checked={i === period}
                  tabIndex={i === period ? 0 : -1}
                  onClick={() => pick(i)}
                  onKeyDown={(e) => onKey(e, i)}
                  className={`h-11 rounded-full text-[13px] font-medium outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#9c1f14] focus-visible:ring-offset-2 focus-visible:ring-offset-[#e4d6bf] ${i === period ? "bg-[#1d140d] text-[#f5ecdc]" : "text-[#4a3829] hover:bg-[#d6c5aa]"}`}
                >
                  {pr.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
