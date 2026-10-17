import { useEffect, useRef, useState } from "react";

// DEMO DATA. Six columns, two sets. One scene unit of glass is SCALE bookings.
const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const months = ["January", "February", "March", "April", "May", "June"];
const sets = [
  { key: "This year", noun: "bookings this half", values: [92, 118, 104, 163, 207, 248] },
  { key: "Last year", noun: "bookings, same half last year", values: [121, 84, 146, 132, 188, 171] },
];
// The colour of white paper seen through each column, front face to back face (red, green, blue from 0 to 1).
const glass: [number, number, number][] = [
  [1.0, 0.7, 0.08],
  [1.0, 0.52, 0.06],
  [1.0, 0.34, 0.08],
  [0.95, 0.2, 0.12],
  [0.84, 0.1, 0.16],
  [0.64, 0.05, 0.2],
];
const SCALE = 100;
const N = labels.length;
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';

// Scene units.
const PITCH = 0.8, HALF = 0.2;
const xOf = (i: number) => (i - (N - 1) / 2) * PITCH;
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const fmt = (n: number) => n.toLocaleString("en-GB");

const VERT = `#version 300 es
in vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

const TONE = `
vec3 film(vec3 x){ return clamp(x * (2.51 * x + 0.03) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
vec3 tone(vec3 x){ x *= 0.86; float l = max(x.r, max(x.g, x.b)) + 1e-4; vec3 keep = x / l * film(vec3(l)).r; return pow(mix(film(x), keep, 0.55), vec3(1.0 / 2.2)); }
`;

// The photograph. Every column is a box, so a ray meets it in closed form: in through one face,
// bounced off the inside of the others for as long as the angle is past critical, and out. The
// coloured light on the floor is found by walking from the floor toward the sun through the glass.
const SCENE = `#version 300 es
precision highp float;
out vec4 outC;
const int N = ${N};
uniform vec2 uRes; uniform vec4 uJit; uniform float uSeed;
uniform vec3 uCam; uniform vec3 uTgt; uniform float uFoc; uniform vec2 uShift; uniform float uFocus;
uniform float uH[N]; uniform vec3 uSig[N]; uniform float uSel; uniform vec3 uSun;
uniform sampler2D uTex; uniform float uDirect;
const float P = ${PITCH.toFixed(3)}; const float HW = ${HALF.toFixed(3)};
const float CW = ${(HALF + 0.036).toFixed(3)}; const float CH = 0.03;
const float BEV = 0.022;
const vec3 SUNC = vec3(1.0, 0.93, 0.82);
const vec3 HAZE = vec3(0.98, 0.955, 0.925);
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float barX(int i){ return (float(i) - float(N - 1) * 0.5) * P; }
float fres(float c){ return 0.04 + 0.96 * pow(1.0 - clamp(c, 0.0, 1.0), 5.0); }
// the faces are bloomed like a lens, so head-on they give back very little
float fresG(float c){ return 0.018 + 0.982 * pow(1.0 - clamp(c, 0.0, 1.0), 5.0); }

bool boxHit(vec3 ro, vec3 rd, vec3 lo, vec3 hi, out float tN, out float tF, out vec3 nN, out vec3 nF){
  vec3 s = vec3(rd.x < 0.0 ? -1.0 : 1.0, rd.y < 0.0 ? -1.0 : 1.0, rd.z < 0.0 ? -1.0 : 1.0);
  vec3 inv = 1.0 / (s * max(abs(rd), vec3(1e-6)));
  vec3 a = (lo - ro) * inv; vec3 b = (hi - ro) * inv; vec3 mn = min(a, b); vec3 mx = max(a, b);
  tN = max(mn.x, max(mn.y, mn.z)); tF = min(mx.x, min(mx.y, mx.z));
  nN = -s * step(mn.yzx, mn.xyz) * step(mn.zxy, mn.xyz);
  nF = s * step(mx.xyz, mx.yzx) * step(mx.xyz, mx.zxy);
  return tF > max(tN, 0.0);
}
// The arrises are ground and polished: near an edge the normal rolls over to the next face.
vec3 bevel(vec3 p, vec3 c, vec3 b, vec3 n, float r){
  vec3 q = p - c; vec3 d = (b - abs(q)) / r;
  vec3 w = (1.0 - abs(n)) * pow(clamp(1.0 - d, 0.0, 1.0), vec3(2.0));
  return normalize(n + sign(q) * w * 2.2);
}
float arris(vec3 p, vec3 c, vec3 b, vec3 n, float r){
  vec3 w = (1.0 - abs(n)) * clamp(1.0 - (b - abs(p - c)) / r, 0.0, 1.0);
  return max(w.x, max(w.y, w.z));
}
// Seeds: the few small bubbles any cast block keeps. They ride up and down with the glass.
vec4 seed(int i, int k){
  float f = float(i) * 7.31 + float(k) * 3.17;
  vec3 r = fract(sin(vec3(f * 12.9898, f * 78.233 + 1.3, f * 37.719 + 2.1)) * 43758.5453);
  return vec4(barX(i) + (r.x - 0.5) * (HW * 1.5), uH[i] - 0.12 - r.y * 0.75, (r.z - 0.5) * (HW * 1.5), 0.007 + 0.009 * fract(f * 0.37));
}
// Cast glass is never quite flat.
vec3 wob(vec3 n, vec3 p){
  vec3 g = vec3(sin(p.y * 5.3 + p.z * 9.0 + p.x * 2.0), sin(p.x * 8.0 + p.z * 7.0 + 1.7), sin(p.y * 6.1 + p.x * 9.5 + 0.6));
  return normalize(n + (g - n * dot(g, n)) * 0.012);
}

// ---- the room ----
float rectL(vec3 rd, vec3 c, vec3 n, vec3 u, vec3 v, vec2 hs, float soft){
  float dn = dot(rd, n); if (dn > -1e-4) return 0.0;
  float t = dot(c, n) / dn; if (t < 0.0) return 0.0;
  vec3 q = rd * t - c; float s = soft * t;
  vec2 d = abs(vec2(dot(q, u), dot(q, v))) - hs;
  return smoothstep(s, -s, d.x) * smoothstep(s, -s, d.y);
}
vec3 env(vec3 rd){
  float up = smoothstep(-0.05, 0.75, rd.y);
  vec3 c = mix(vec3(1.02, 0.985, 0.94), vec3(0.6, 0.72, 0.95), up);
  // behind the camera the studio is unlit: it is what gives the glass its dark edges
  c *= mix(0.16, 1.0, smoothstep(-0.85, 0.1, rd.z + rd.x * 0.25));
  // a tall soft light behind the camera's right shoulder: the sheen on the faces that look at the lens
  vec3 fn = normalize(vec3(-0.5, -0.1, 1.0));
  c += vec3(1.0, 0.98, 0.95) * 4.0 * rectL(rd, vec3(6.5, 3.0, -11.0), fn, normalize(cross(vec3(0.0, 1.0, 0.0), fn)), vec3(0.0, 1.0, 0.0), vec2(1.3, 4.5), 0.09);
  // the far window, low on the right: it is what the polished tops mirror, glazing bars and all
  vec3 tn = -normalize(vec3(0.45, 0.2, 0.85));
  vec3 tu = normalize(cross(vec3(0.0, 1.0, 0.0), tn)); vec3 tv = cross(tn, tu);
  vec3 tq = rd * (20.0 / max(dot(rd, -tn), 1e-3)) + tn * 20.0;
  vec2 tw = vec2(dot(tq, tu), dot(tq, tv) - 1.6);
  float pane = smoothstep(0.17, 0.14, abs(fract(tw.x / 0.8 + 0.1) - 0.5));
  float inWin = step(0.0, dot(rd, -tn)) * smoothstep(0.03, -0.03, abs(tw.x) - 5.2) * smoothstep(0.03, -0.03, abs(tw.y) - 2.3);
  c = mix(c, c * 0.22 + vec3(1.0, 0.985, 0.95) * (2.2 + 2.0 * smoothstep(-2.3, 2.3, tw.y)) * pane, inWin);
  // a tall window on the camera's left, with one glazing bar
  vec3 wn = normalize(vec3(1.0, 0.0, -0.75));
  vec3 wu = normalize(cross(vec3(0.0, 1.0, 0.0), wn));
  float win = rectL(rd, vec3(-9.0, 2.6, 7.0), wn, wu, vec3(0.0, 1.0, 0.0), vec2(2.4, 2.6), 0.012);
  float barV = rectL(rd, vec3(-9.0, 2.6, 7.0), wn, wu, vec3(0.0, 1.0, 0.0), vec2(0.1, 2.6), 0.006);
  c += vec3(0.95, 0.98, 1.0) * 3.4 * win * (1.0 - barV);
  // one small hard lamp high over the camera: the hot line along every top front arris
  c += vec3(1.0, 0.97, 0.9) * 46.0 * smoothstep(0.9965, 0.9992, dot(rd, normalize(vec3(0.42, 0.86, -0.28))));
  // the sun
  float s = dot(rd, uSun);
  c += SUNC * (70.0 * smoothstep(0.9988, 0.9996, s) + 1.6 * pow(max(s, 0.0), 180.0));
  return c;
}

// What the sun delivers to a point on the floor once the glass has had its say. Through a pair of
// parallel faces the light arrives straight and coloured. Through a corner it is thrown wide, so
// that part of the shadow only sees coloured sky.
vec3 gL; vec3 gL2; vec3 gOcc; bool gTwo;
// The sun comes in through an opening: behind the row the floor is in open shade.
float sunMask(vec2 g){ float d = 2.9 + 0.3 * g.x - g.y; return smoothstep(-0.2, 0.2, d); }
vec3 sunT(vec3 gp, vec3 L){
  vec3 T = vec3(1.0); gOcc = vec3(1.0);
  for (int i = 0; i < N; i++) {
    float x = barX(i); float h = uH[i];
    if (h < 0.004) continue;
    vec3 lo = vec3(x - HW, 0.0, -HW); vec3 hi = vec3(x + HW, h, HW);
    float a; float b; vec3 n1; vec3 n2;
    if (!boxHit(gp, L, lo, hi, a, b, n1, n2)) continue;
    gOcc *= exp(-uSig[i] * 0.3);
    if (a <= 0.0) { T *= exp(-uSig[i] * b) * 0.9; continue; }
    vec3 pe = gp + L * a;
    vec3 d = refract(L, n1, 1.0 / 1.5);
    float a2; float b2; vec3 m1; vec3 m2;
    boxHit(pe - n1 * 1e-4, d, lo, hi, a2, b2, m1, m2);
    b2 = max(b2, 0.0);
    float par = step(dot(m2, n1), -0.5);
    // the ground arris bends light away: a thin dark line down each side of the shadow
    vec3 q = pe - vec3(x, 0.0, 0.0); vec3 e = (vec3(HW, h, HW) - abs(q)) * (1.0 - abs(n1));
    float edge = min(min(e.x + abs(n1.x), e.y + abs(n1.y)), e.z + abs(n1.z));
    float dark = smoothstep(0.0, BEV, edge);
    // and lays what it took as a bright seam just inside
    float seam = exp(-pow((edge - BEV * 1.9) / (BEV * 0.7), 2.0));
    T *= exp(-uSig[i] * b2) * mix(0.3, 0.94, par) * mix(0.4, 1.0, dark) * (1.0 + 0.55 * seam * par);
  }
  return T;
}
// The sunlit side of every column is also a weak mirror: it lays a pale patch of sun on the floor beside it.
float glint(vec3 gp){
  vec3 d = vec3(-uSun.x, uSun.y, uSun.z); float g = 0.0;
  if (d.x < 0.05) return 0.0;
  for (int i = 0; i < N; i++) {
    float t = (barX(i) - HW - gp.x) / d.x;
    if (t <= 0.0) continue;
    float y = d.y * t; float z = gp.z + d.z * t;
    g += smoothstep(uH[i] + 0.02, uH[i] - 0.02, y) * smoothstep(HW + 0.015, HW - 0.015, abs(z));
  }
  return g;
}
float contact(vec3 gp){
  float o = 1.0;
  for (int i = 0; i < N; i++) {
    vec2 q = abs(gp.xz - vec2(barX(i), 0.0)) - vec2(CW);
    float d = length(max(q, 0.0));
    o *= 1.0 - 0.5 * exp(-d / 0.05) - 0.16 * exp(-d / 0.3) * min(uH[i], 1.0);
  }
  return o;
}
vec3 paper(vec3 gp){
  float fib = n2(gp.xz * 70.0) * 0.55 + n2(gp.xz * vec2(260.0, 230.0)) * 0.45;
  float trowel = n2(gp.xz * 0.9 + 3.0) * 0.6 + n2(gp.xz * vec2(2.6, 1.7)) * 0.4;
  vec3 alb = vec3(0.905, 0.9, 0.89) * (0.975 + 0.05 * fib) * (0.94 + 0.11 * trowel) * (1.0 - 0.1 * smoothstep(0.86, 0.97, n2(gp.xz * 38.0)));
  vec2 uv = vec2((gp.x - 0.27 + 2.6) / 5.2, (-0.34 - gp.z) / 0.325);
  if (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0) {
    float col = floor((gp.x - 0.27) / P + float(N) * 0.5);
    float on = uSel < -0.5 ? 0.92 : (abs(col - uSel) < 0.5 ? 0.97 : 0.3);
    alb = mix(alb, vec3(0.06, 0.06, 0.075), texture(uTex, uv).r * on);
  }
  return alb;
}
vec3 floorLite(vec3 gp){
  float pool = 0.5 + 0.5 * smoothstep(13.0, 2.0, length((gp.xz - vec2(0.6, -0.6)) * vec2(0.75, 1.0)));
  vec3 T = sunT(gp, gL);
  if (gTwo) T = 0.5 * (T + sunT(gp, gL2));
  T *= sunMask(gp.xz);
  vec3 sky = vec3(0.55, 0.55, 0.59) * contact(gp) * mix(vec3(1.0), gOcc, 0.94);
  return paper(gp) * (SUNC * 1.75 * uSun.y * (T + 0.1 * glint(gp) * sunMask(gp.xz)) * pool + sky * (0.7 + 0.3 * pool));
}
vec3 floorFar(vec3 gp, float dist){ return mix(floorLite(gp), HAZE, smoothstep(9.0, 40.0, dist)); }
vec3 envR(vec3 p, vec3 r){
  if (r.y < -0.002) { float t = -p.y / r.y; return floorFar(p + r * t, t); }
  return env(r);
}

void nearest(vec3 ro, vec3 rd, int skip, out float tb, out float te, out int ib, out vec3 nb){
  tb = 1e9; te = 1e9; ib = -1; nb = vec3(0.0);
  for (int i = 0; i < N; i++) {
    if (i == skip || uH[i] < 0.004) continue;
    float x = barX(i); float a; float b; vec3 n1; vec3 n2;
    if (boxHit(ro, rd, vec3(x - HW, 0.0, -HW), vec3(x + HW, uH[i], HW), a, b, n1, n2) && a > 0.0 && a < tb) { tb = a; te = b; ib = i; nb = n1; }
  }
}
// A column as another column sees it: tinted straight through, with a sheen.
vec3 simpleBar(int i, vec3 ro, vec3 rd, float t, float te, vec3 n){
  vec3 p = ro + rd * t;
  vec3 nn = bevel(p, vec3(barX(i), 0.0, 0.0), vec3(HW, uH[i], HW), n, BEV);
  float F = fresG(dot(-rd, nn));
  return F * envR(p, reflect(rd, nn)) + (1.0 - F) * exp(-uSig[i] * (te - t)) * 0.92 * envR(ro + rd * te, rd);
}
vec3 outside(vec3 ro, vec3 rd, int self){
  float tb; float te; int ib; vec3 nb; nearest(ro, rd, self, tb, te, ib, nb);
  float tg = rd.y < -1e-4 ? -ro.y / rd.y : 1e9;
  if (ib >= 0 && tb < tg) return simpleBar(ib, ro, rd, tb, te, nb);
  if (tg < 1e8) return floorFar(ro + rd * tg, tg);
  return env(rd);
}

// One ray into a column and every way it can leave.
vec3 shadeBar(int i, vec3 ro, vec3 rd, float t, vec3 nf){
  float x = barX(i); float h = uH[i];
  vec3 c = vec3(x, 0.0, 0.0); vec3 b = vec3(HW, h, HW);
  vec3 lo = vec3(x - HW, 0.0, -HW); vec3 hi = vec3(x + HW, h, HW);
  vec3 p = ro + rd * t;
  vec3 n = wob(bevel(p, c, b, nf, BEV), p);
  float F = fresG(dot(-rd, n));
  vec3 col = F * outside(p + nf * 1e-3, reflect(rd, n), i);
  // looking down the length of a column the colour would go to black: the tops are read at a shallower depth
  vec3 thr = vec3(1.0 - F); vec3 sig = uSig[i] * (nf.y > 0.5 ? 0.3 : 1.0);
  // a polished arris is a thin window onto the sky: light gets through it by the short way
  float ar = arris(p, c, b, nf, BEV);
  col += thr * ar * ar * exp(-sig * 0.07) * vec3(1.25, 1.2, 1.1);
  thr *= 1.0 - 0.7 * ar * ar;
  vec3 d = refract(rd, n, 1.0 / 1.5); vec3 o = p - nf * 1e-4;
  for (int k = 0; k < 6; k++) {
    float a; float e; vec3 n1; vec3 n2;
    boxHit(o, d, lo, hi, a, e, n1, n2);
    e = max(e, 0.0);
    if (k == 0) {
      for (int j = 0; j < 5; j++) {
        vec4 sd = seed(i, j); if (sd.y < CH + 0.05) continue;
        vec3 oc = o - sd.xyz; float bb = dot(oc, d); float hh = bb * bb - dot(oc, oc) + sd.w * sd.w;
        if (hh > 0.0) { float ts = -bb - sqrt(hh); if (ts > 0.0 && ts < e) {
          vec3 bn = normalize(o + d * ts - sd.xyz); float rim = 1.0 - clamp(dot(-d, bn), 0.0, 1.0);
          vec3 tt = thr * exp(-sig * ts);
          // air in glass: clear in the middle, a mirror ring round the edge
          col += tt * smoothstep(0.3, 0.75, rim) * (0.25 + 0.75 * env(reflect(d, bn))) * 0.9;
          thr *= 1.0 - 0.8 * smoothstep(0.3, 0.75, rim);
        } }
      }
    }
    o += d * e; thr *= exp(-sig * e);
    if (n2.y < -0.5) return col + thr * floorLite(vec3(o.x, 0.0, o.z));
    if (o.y < CH) return col + thr * vec3(0.3, 0.3, 0.32);
    vec3 nn = wob(bevel(o, c, b, n2, BEV), o);
    vec3 r = refract(d, -nn, 1.5);
    if (dot(r, r) < 0.5) { d = reflect(d, -n2); o -= n2 * 1e-4; continue; }
    float Fo = fres(dot(r, nn));
    col += thr * (1.0 - Fo) * outside(o + n2 * 1e-3, r, i);
    thr *= Fo;
    if (max(thr.r, max(thr.g, thr.b)) < 0.03) return col;
    d = reflect(d, -n2); o -= n2 * 1e-4;
  }
  return col + thr * vec3(0.4);
}

// The stainless collar each column slides through.
float collarHit(vec3 ro, vec3 rd, out int ic, out vec3 nc){
  float tb = 1e9; ic = -1; nc = vec3(0.0);
  for (int i = 0; i < N; i++) {
    float x = barX(i); float a; float b; vec3 n1; vec3 n2;
    if (boxHit(ro, rd, vec3(x - CW, 0.0, -CW), vec3(x + CW, CH, CW), a, b, n1, n2) && a > 0.0 && a < tb) { tb = a; ic = i; nc = n1; }
  }
  return tb;
}
vec3 shadeCollar(int i, vec3 p, vec3 nf, vec3 rd){
  vec3 q = p - vec3(barX(i), 0.0, 0.0);
  // flush with the floor: the glass shows in the frame as a tile
  if (nf.y > 0.5 && max(abs(q.x), abs(q.z)) < HW) return floorLite(vec3(p.x, 0.0, p.z)) * exp(-uSig[i] * 0.35) + fres(-rd.y) * env(reflect(rd, nf));
  vec3 n = bevel(p, vec3(barX(i), 0.0, 0.0), vec3(CW, CH, CW), nf, 0.012);
  float inner = nf.y > 0.5 ? smoothstep(HW + 0.012, HW, max(abs(q.x), abs(q.z))) : 0.0;
  vec3 s = outside(p + nf * 1e-3, reflect(rd, n), -1);
  vec3 f0 = vec3(0.62, 0.63, 0.65);
  vec3 f = f0 + (1.0 - f0) * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0);
  return f * s * (1.0 - 0.75 * inner) + vec3(0.05) * max(dot(n, uSun), 0.0);
}

vec3 shadeGround(vec3 gp, vec3 rd, vec2 rnd, float dist){
  gTwo = true; vec3 col = floorLite(gp); gTwo = false;
  if (dot(gp.xz, gp.xz) < 60.0) {
    // a satin floor: at a low angle it carries a soft image of what stands on it
    vec3 r = normalize(reflect(rd, vec3(0.0, 1.0, 0.0)) + vec3(rnd.x, 0.0, rnd.y) * 0.03);
    float f = fres(-rd.y);
    float tb; float te; int ib; vec3 nb; nearest(gp + vec3(0.0, 0.002, 0.0), r, -1, tb, te, ib, nb);
    if (ib >= 0) {
      vec3 m = simpleBar(ib, gp + vec3(0.0, 0.002, 0.0), r, tb, te, nb);
      col = mix(col, m, clamp(f * 1.7 * exp(-tb * 0.5), 0.0, 0.5));
    }
  }
  return mix(col, HAZE, smoothstep(9.0, 40.0, dist));
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
  // the sun has a width: each exposure looks at a different part of its disc
  vec3 su = normalize(cross(uSun, vec3(0.0, 1.0, 0.0))); vec3 sv = cross(su, uSun);
  gL = normalize(uSun + (su * rnd.x + sv * rnd.y) * 0.015);
  gL2 = normalize(uSun - (su * rnd.x + sv * rnd.y) * 0.015); gTwo = false;

  float tg = rd.y < 0.0 ? -ro.y / rd.y : 1e9;
  float tb; float te; int ib; vec3 nb; nearest(ro, rd, -1, tb, te, ib, nb);
  int ic; vec3 nc; float tc = collarHit(ro, rd, ic, nc);
  vec3 col;
  if (ic >= 0 && tc < tb && tc < tg) col = shadeCollar(ic, ro + rd * tc, nc, rd);
  else if (ib >= 0 && tb < tg) col = shadeBar(ib, ro, rd, tb, nb);
  else if (tg < 1e8) col = shadeGround(ro + rd * tg, rd, rnd, tg);
  else col = env(rd);
  col = min(col, vec3(24.0));
  if (uDirect > 0.5) col = tone(col);
  outC = vec4(col, 1.0);
}
`;

// Developing the negative: a little bloom off the hot highlights, the filmic curve, vignette, grain.
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
  c = max(c + (c - nb * 0.25) * 0.45, 0.0);
  vec3 b = vec3(0.0);
  for (int i = 0; i < 20; i++) {
    float a = float(i) * 2.39996; float r = sqrt((float(i) + 0.5) / 20.0);
    vec3 s = texture(uAcc, uv + vec2(cos(a), sin(a)) * r * 0.02 * vec2(uRes.y / uRes.x, 1.0)).rgb;
    b += min(max(s - 1.7, 0.0), vec3(6.0)) * (1.0 - 0.6 * r);
  }
  c += b * 0.01;
  vec2 q = (uv - uCentre) * vec2(uRes.x / uRes.y, 1.0);
  c *= 1.0 - 0.24 * smoothstep(0.4, 1.3, length(q));
  c = tone(c);
  // printed a touch harder and richer than the negative
  c = mix(vec3(dot(c, vec3(0.299, 0.587, 0.114))), c, 1.14);
  c = mix(c, c * c * (3.0 - 2.0 * c), 0.22);
  c += (h21(gl_FragCoord.xy + uGrain * 91.7) - 0.5) * 0.018;
  outC = vec4(c, 1.0);
}
`;

// The month names printed on the floor in front of the columns, drawn once as a flat plan.
function floorPrint() {
  const W = 2048, H = 128, px = W / 5.2;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const g = cv.getContext("2d");
  if (!g) return cv;
  g.fillStyle = "#000"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#fff"; g.textAlign = "center"; g.textBaseline = "top";
  g.font = `700 ${0.165 * px}px ${FONT}`;
  labels.forEach((l, i) => g.fillText(l.toUpperCase().split("").join("\u200A"), (xOf(i) + 2.6) * px, 0.05 * px));
  return cv;
}

const css = (c: [number, number, number], k = 1) => `rgb(${c.map((v) => Math.round(Math.min(1, v * k) * 255)).join(",")})`;

// No WebGL: the same chart from the front, built from gradients.
function Still({ values }: { values: number[] }) {
  const top = Math.max(...sets.flatMap((s) => s.values));
  return (
    <div aria-hidden="true" className="absolute inset-x-0 top-[6%] mx-auto flex h-[46%] w-[86%] max-w-[560px] items-end justify-between lg:left-auto lg:right-[8%] lg:top-[18%] lg:mx-0 lg:h-[56%] lg:w-[46%]">
      {values.map((v, i) => (
        <div key={labels[i]} className="relative w-[11%]" style={{ height: `${(v / top) * 100}%` }}>
          <div className="absolute left-0 top-full h-[70%] w-full origin-top-left skew-x-[52deg] blur-[3px]" style={{ background: `linear-gradient(180deg, ${css(glass[i])} 0%, transparent 100%)`, opacity: 0.75 }} />
          <div className="absolute inset-0 rounded-[2px]" style={{ background: `linear-gradient(90deg, ${css(glass[i], 0.7)} 0%, ${css(glass[i], 1.15)} 5%, ${css(glass[i])} 9%, ${css(glass[i], 1.08)} 78%, ${css(glass[i], 0.72)} 80%, ${css(glass[i], 0.86)} 100%)`, boxShadow: "inset 0 2px 0 rgba(255,255,255,0.85), inset 1px 0 0 rgba(255,255,255,0.5), inset -1px 0 0 rgba(0,0,0,0.2)" }} />
          <div className="absolute -inset-x-[9%] bottom-0 h-[5px] rounded-[1px]" style={{ background: "linear-gradient(180deg, #f4f5f6 0%, #8d9299 60%, #c9ccd1 100%)" }} />
        </div>
      ))}
    </div>
  );
}

export default function RayTracedCastGlassColumnBarChart() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const hit = useRef<HTMLDivElement>(null);
  const [set, setSet] = useState(0);
  const [sel, setSel] = useState(-1);
  const [hover, setHover] = useState(-1);
  const [live, setLive] = useState<number[]>(sets[0].values);
  const [shown, setShown] = useState<"wait" | "gl" | "still">("wait");
  const api = useRef<{ go: (k: number, fromUser: boolean) => void; press: (i: number) => void; mark: (i: number) => void } | null>(null);
  const selRef = useRef(-1);

  useEffect(() => {
    const box = stage.current, cv = canvas.current, pad = hit.current;
    if (!box || !cv || !pad) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gl = cv.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance" }) as WebGL2RenderingContext | null;
    if (!gl) { setShown("still"); return; }
    const canAcc = !!gl.getExtension("EXT_color_buffer_float") || !!gl.getExtension("EXT_color_buffer_half_float");
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    const software = /swiftshader|llvmpipe|software|basic render/i.test(renderer);
    const still = reduce || software; // no idle drift: draw, refine, then rest

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
    const su = Object.fromEntries(["uRes", "uJit", "uSeed", "uCam", "uTgt", "uFoc", "uShift", "uFocus", "uH", "uSig", "uSel", "uSun", "uTex", "uDirect"].map((n) => [n, gl.getUniformLocation(scene, n)]));
    const pu = post ? Object.fromEntries(["uAcc", "uRes", "uGrain", "uCentre"].map((n) => [n, gl.getUniformLocation(post, n)])) : {};
    // absorption per unit of depth, from the colour that survives one column's thickness
    const sig = new Float32Array(glass.flatMap((c) => c.map((v) => -Math.log(Math.max(0.003, Math.min(0.995, Math.pow(v, 2.2)))) / (HALF * 2))));

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, floorPrint());
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
    const start = sets[0].values.map((v) => v / SCALE);
    const s = {
      h: start.slice(), v: start.map(() => 0), to: start.slice(), next: start.slice(), at: start.map(() => 0),
      dip: start.map(() => 0), dv: start.map(() => 0), set: 0,
      px: 0, py: 0, sx: 0, sy: 0, sun: 0, count: 0, fresh: true, frame: 0, slow: 0, hover: -1,
      visible: true, raf: 0, last: 0, t0: 0, touched: false, demoAt: 0, first: true, sent: "",
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

    // The camera: a long lens, low and off to the left, so the row runs away from it.
    const camera = () => {
      const wide = cssW >= 1024, aspect = cssW / cssH;
      const el = (wide ? 0.27 : 0.36) - s.sy * 0.012, az = (wide ? -0.5 : -0.3) + s.sx * 0.04, dist = 13;
      const tgt = wide ? [0.3, 0.8, 0] : [0, 0.9, 0];
      const cam = [tgt[0] + dist * Math.sin(az) * Math.cos(el), tgt[1] + dist * Math.sin(el), tgt[2] - dist * Math.cos(az) * Math.cos(el)];
      const foc = wide ? 2.8 * Math.min(1, aspect / 1.55) : 1.28 * Math.min(1, aspect / 0.52);
      // the camera stays level and the lens is shifted down instead, as for architecture: verticals stay vertical
      const fall = ((cam[1] - tgt[1]) / Math.hypot(tgt[0] - cam[0], tgt[2] - cam[2])) * foc;
      const fw = [tgt[0] - cam[0], 0, tgt[2] - cam[2]];
      const fl = Math.hypot(fw[0], fw[1], fw[2]); fw[0] /= fl; fw[1] /= fl; fw[2] /= fl;
      const rt = [fw[2], 0, -fw[0]]; const rl = Math.hypot(rt[0], rt[2]); rt[0] /= rl; rt[2] /= rl;
      const up = [fw[1] * rt[2] - fw[2] * rt[1], fw[2] * rt[0] - fw[0] * rt[2], fw[0] * rt[1] - fw[1] * rt[0]];
      const shift = wide ? [0.165 * aspect, -0.07 + fall] : [0, 0.2 + fall];
      return { cam, tgt, fw, rt, up, foc, shift, wide };
    };
    // Which column a point on the screen is over.
    const pick = (cx: number, cy: number) => {
      const r = box.getBoundingClientRect(), c = camera();
      const ux = (cx - r.left - r.width / 2) / r.height - c.shift[0], uy = (r.height / 2 - (cy - r.top)) / r.height - c.shift[1];
      const d = [0, 1, 2].map((i) => c.fw[i] * c.foc + c.rt[i] * ux + c.up[i] * uy);
      let best = -1, bt = 1e9;
      for (let i = 0; i < N; i++) {
        const lo = [xOf(i) - HALF - 0.04, 0, -HALF - 0.04], hi = [xOf(i) + HALF + 0.04, Math.max(s.h[i], 0.25), HALF + 0.04];
        let tn = -1e9, tf = 1e9;
        for (let a = 0; a < 3; a++) {
          const inv = 1 / (Math.abs(d[a]) < 1e-6 ? 1e-6 : d[a]);
          const t1 = (lo[a] - c.cam[a]) * inv, t2 = (hi[a] - c.cam[a]) * inv;
          tn = Math.max(tn, Math.min(t1, t2)); tf = Math.min(tf, Math.max(t1, t2));
        }
        if (tf > Math.max(tn, 0) && tn < bt) { bt = tn; best = i; }
      }
      return best;
    };

    const draw = (alpha: number, sample: number) => {
      const c = camera();
      const jx = sample ? halton(sample, 2) - 0.5 : 0, jy = sample ? halton(sample, 3) - 0.5 : 0;
      const la = halton(sample, 5) * Math.PI * 2, lr = sample ? Math.sqrt(halton(sample, 7)) * 0.065 : 0;
      gl.useProgram(scene);
      gl.bindFramebuffer(gl.FRAMEBUFFER, canAcc ? fbo : null);
      gl.viewport(0, 0, W, H);
      if (canAcc && alpha < 1) { gl.enable(gl.BLEND); gl.blendColor(0, 0, 0, alpha); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA); } else gl.disable(gl.BLEND);
      gl.uniform2f(su.uRes, W, H);
      gl.uniform4f(su.uJit, canAcc ? jx : 0, canAcc ? jy : 0, canAcc ? Math.cos(la) * lr : 0, canAcc ? Math.sin(la) * lr : 0);
      gl.uniform1f(su.uSeed, canAcc && sample ? (sample * 0.61803) % 1 || 0.5 : 0);
      gl.uniform3f(su.uCam, c.cam[0], c.cam[1], c.cam[2]); gl.uniform3f(su.uTgt, c.tgt[0], c.cam[1], c.tgt[2]);
      gl.uniform1f(su.uFoc, c.foc);
      gl.uniform2f(su.uShift, c.shift[0], c.shift[1]);
      gl.uniform1f(su.uFocus, (0.3 - c.cam[0]) * c.fw[0] + (0.8 - c.cam[1]) * c.fw[1] + (-0.2 - c.cam[2]) * c.fw[2]);
      gl.uniform1fv(su.uH, s.h.map((h, i) => Math.max(0, h + s.dip[i])));
      gl.uniform3fv(su.uSig, sig);
      gl.uniform1f(su.uSel, s.hover >= 0 ? s.hover : selRef.current);
      // the sun: behind the row and to the left, drifting a little
      const sa = -0.62 + s.sun, se = 0.66;
      gl.uniform3f(su.uSun, Math.sin(sa) * Math.cos(se), Math.sin(se), Math.cos(sa) * Math.cos(se));
      gl.uniform1i(su.uTex, 0);
      gl.uniform1f(su.uDirect, canAcc ? 0 : 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (canAcc && post) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.disable(gl.BLEND);
        gl.useProgram(post);
        gl.uniform1i(pu.uAcc, 1); gl.uniform2f(pu.uRes, W, H);
        gl.uniform1f(pu.uGrain, still ? 1 : s.frame % 64);
        gl.uniform2f(pu.uCentre, c.wide ? 0.6 : 0.5, c.wide ? 0.45 : 0.66);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };

    const go = (k: number, fromUser: boolean) => {
      if (fromUser) s.touched = true;
      if (k === s.set) return;
      s.set = k; setSet(k);
      const now = performance.now();
      // the change runs down the row: each column sets off a beat after the one before
      sets[k].values.forEach((v, i) => { s.next[i] = v / SCALE; s.at[i] = now + i * 105; });
      if (reduce) { s.next.forEach((v, i) => { s.h[i] = s.to[i] = v; s.v[i] = 0; }); s.count = 0; }
      wake();
    };
    const press = (i: number) => { s.touched = true; if (!reduce) s.dv[i] -= 0.9; s.count = 0; wake(); };
    const mark = () => { s.touched = true; s.count = Math.min(s.count, 1); wake(); };
    api.current = { go, press, mark };

    const frame = (now: number) => {
      s.raf = 0;
      if (!s.visible) return;
      const dtRaw = s.last ? (now - s.last) / 1000 : 0.016;
      const dt = Math.min(0.033, dtRaw);
      s.last = now; s.frame++;
      if (!s.t0) { s.t0 = now; s.demoAt = now + 3800; }

      // the self-running demo: it opens finished, holds, then swaps the two sets until someone touches it
      if (!still && !s.touched && now > s.demoAt) { go(1 - s.set, false); s.demoAt = now + 4600; }

      let moving = false, fast = false;
      if (!reduce) {
        const steps = 3, hh = dt / steps;
        for (let i = 0; i < N; i++) {
          if (s.to[i] !== s.next[i] && now >= s.at[i]) s.to[i] = s.next[i];
          for (let k = 0; k < steps; k++) {
            // heavy glass on a spring: it arrives late, goes a little past, and comes back once
            const down = s.to[i] < s.h[i] - 0.002 || (s.v[i] < 0 && s.to[i] <= s.h[i] + 0.05);
            s.v[i] += ((down ? 150 : 82) * (s.to[i] - s.h[i]) - (down ? 9.5 : 11.5) * s.v[i]) * hh; s.h[i] += s.v[i] * hh;
            s.dv[i] += (-520 * s.dip[i] - 26 * s.dv[i]) * hh; s.dip[i] += s.dv[i] * hh;
          }
          if (Math.abs(s.v[i]) > 0.002 || Math.abs(s.to[i] - s.h[i]) > 0.0006 || s.to[i] !== s.next[i] || Math.abs(s.dip[i]) > 0.0006 || Math.abs(s.dv[i]) > 0.004) moving = true;
          else { s.h[i] = s.to[i]; s.v[i] = 0; s.dip[i] = 0; s.dv[i] = 0; }
          if (Math.abs(s.v[i]) > 0.1 || Math.abs(s.dv[i]) > 0.1) fast = true;
        }
      }
      // the numbers on the page are read off the glass
      const vals = s.h.map((h) => Math.round(h * SCALE));
      const key = vals.join(",");
      if (key !== s.sent) { s.sent = key; setLive(vals); }

      if (!still) {
        s.sx += (s.px - s.sx) * (1 - Math.exp(-dt * 3)); s.sy += (s.py - s.sy) * (1 - Math.exp(-dt * 3));
        const t = (now - s.t0) / 1000;
        s.sun = Math.sin(t * 0.33) * 0.09 + s.sx * 0.05;
        moving = true;
      }

      if (s.fresh || !canAcc) { draw(1, 0); s.fresh = false; s.count = 1; }
      else if (moving) { draw(fast ? 0.6 : still ? 0.5 : 0.1, 1 + (s.frame % 64)); s.count = still ? 1 : 6; }
      else if (s.count < 48) { s.count++; draw(1 / s.count, s.count); }
      if (s.first) { s.first = false; setShown("gl"); }

      // measured, not guessed: if frames run long for a while, give up some resolution
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

    const over = (i: number) => { if (i !== s.hover) { s.hover = i; setHover(i); pad.style.cursor = i >= 0 ? "pointer" : "default"; s.count = Math.min(s.count, 1); wake(); } };
    const move = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      s.px = ((e.clientX - r.left) / r.width) * 2 - 1; s.py = ((e.clientY - r.top) / r.height) * 2 - 1;
      if (e.pointerType === "mouse") over(e.target === pad ? pick(e.clientX, e.clientY) : -1);
      if (!still) wake();
    };
    const click = (e: MouseEvent) => {
      const i = pick(e.clientX, e.clientY);
      s.touched = true;
      const nextSel = i < 0 || i === selRef.current ? -1 : i;
      selRef.current = nextSel; setSel(nextSel);
      if (i >= 0) press(i); else mark();
    };
    const leave = () => { s.px = 0; s.py = 0; over(-1); };
    box.addEventListener("pointermove", move);
    pad.addEventListener("click", click);
    box.addEventListener("pointerleave", leave);
    const lost = (e: Event) => { e.preventDefault(); setShown("still"); };
    cv.addEventListener("webglcontextlost", lost);
    wake();

    return () => {
      cancelAnimationFrame(s.raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      box.removeEventListener("pointermove", move); pad.removeEventListener("click", click);
      box.removeEventListener("pointerleave", leave); cv.removeEventListener("webglcontextlost", lost);
      api.current = null;
    };
  }, []);

  const choose = (k: number) => {
    if (api.current) api.current.go(k, true); else { setSet(k); setLive(sets[k].values); }
  };
  const toggleDay = (i: number) => {
    const next = sel === i ? -1 : i;
    selRef.current = next; setSel(next);
    if (api.current) { if (next >= 0) api.current.press(i); else api.current.mark(i); }
  };

  const focus = hover >= 0 ? hover : sel;
  const other = sets[1 - set];
  const number = focus >= 0 ? live[focus] : sum(live);
  const now = focus >= 0 ? sets[set].values[focus] : sum(sets[set].values);
  const then = focus >= 0 ? other.values[focus] : sum(other.values);
  const change = Math.round(((now - then) / then) * 100);
  const line = focus >= 0 ? `bookings in ${months[focus]}` : sets[set].noun;

  return (
    <section className="relative isolate overflow-hidden bg-[#eeebe6] text-[#131419]" style={{ fontFamily: FONT }}>
      <div ref={stage} className="relative mx-auto h-[760px] w-full max-w-[1600px]" style={{ background: "radial-gradient(90% 80% at 60% 60%, #f7f4ef 0%, #ece8e2 60%, #dcd7cf 100%)" }}>
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${shown === "gl" ? "opacity-100" : "opacity-0"}`} />

        {shown === "still" && <Still values={live} />}

        <div ref={hit} aria-hidden="true" className="absolute inset-x-0 top-0 h-[54%] select-none lg:inset-y-0 lg:left-[34%] lg:h-auto" />

        <div className="pointer-events-none absolute inset-0 flex flex-col justify-end px-6 pb-7 sm:px-10 lg:justify-between lg:px-16 lg:pb-12 lg:pt-14">
          <div>
            <p className="hidden text-[11px] font-medium uppercase tracking-[0.34em] text-[#131419]/60 lg:block">Halden Rooms <span className="mx-2 text-[#131419]/30">/</span> bookings by month <span className="mx-2 text-[#131419]/30">/</span> demo data</p>
            <div className="lg:mt-9">
              <p className="text-[104px] font-medium leading-[0.8] tracking-[-0.07em] tabular-nums sm:text-[150px] lg:text-[208px]" aria-live="off">{fmt(number)}</p>
              <p className="mt-4 flex max-w-[84vw] flex-wrap items-baseline gap-x-3 gap-y-1 lg:mt-6">
                <span className="text-[20px] italic leading-snug text-[#131419]/80 lg:text-[25px]" style={{ fontFamily: SERIF }}>{line}</span>
                <span className="text-[13px] font-semibold tabular-nums tracking-[-0.01em]" style={{ color: change >= 0 ? "#b3260f" : "#5b5f6b" }}>{change >= 0 ? "+" : "−"}{Math.abs(change)}% on {other.key.toLowerCase()}</span>
              </p>
            </div>
          </div>

          <div className="pointer-events-auto mt-5 lg:mt-0">
            <div role="group" aria-label="Data set" className="inline-flex rounded-full bg-[#131419]/[0.07] p-1">
              {sets.map((d, k) => (
                <button key={d.key} type="button" aria-pressed={set === k} onClick={() => choose(k)} className={`h-10 rounded-full px-5 text-[13px] font-semibold tracking-[-0.01em] transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#131419] motion-reduce:transition-none ${set === k ? "bg-[#131419] text-white" : "text-[#131419]/70 hover:text-[#131419]"}`}>{d.key}</button>
              ))}
            </div>
            <ul className="mt-3 grid max-w-[26rem] grid-cols-6 gap-x-0.5" aria-label={`${sets[set].key}, bookings by month, demo data`}>
              {labels.map((l, i) => (
                <li key={l}>
                  <button type="button" aria-pressed={sel === i} aria-label={`${months[i]}: ${sets[set].values[i]} bookings`} onClick={() => toggleDay(i)} className={`flex h-11 w-full flex-col items-start justify-center rounded-[10px] px-1.5 text-left sm:px-2.5 transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#131419] motion-reduce:transition-none ${focus === i ? "bg-[#131419]/[0.08]" : "hover:bg-[#131419]/[0.05]"}`}>
                    <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#131419]/60 sm:tracking-[0.2em]"><span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: css(glass[i], 0.92) }} />{l}</span>
                    <span className="text-[14px] font-semibold tabular-nums tracking-[-0.02em]">{sets[set].values[i]}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="pointer-events-none absolute bottom-12 right-16 hidden text-[11px] uppercase tracking-[0.3em] text-[#131419]/50 lg:block">Press a column</p>

        <table className="sr-only">
          <caption>Bookings by month, demo data</caption>
          <thead><tr><th scope="col">Month</th>{sets.map((d) => <th key={d.key} scope="col">{d.key}</th>)}</tr></thead>
          <tbody>
            {months.map((m, i) => <tr key={m}><th scope="row">{m}</th>{sets.map((d) => <td key={d.key}>{d.values[i]}</td>)}</tr>)}
            <tr><th scope="row">Total</th>{sets.map((d) => <td key={d.key}>{sum(d.values)}</td>)}</tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
