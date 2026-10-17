import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** The prints. `focus` is the crop centre (0 to 1), `tone` shows until the photo arrives. */
const plates = [
  { title: "Tulle at noon", src: "https://images.pexels.com/photos/25863051/pexels-photo-25863051.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Woman half hidden in a cloud of bright orange tulle against a blue sky", focus: [0.56, 0.5], tone: "#e8721c" },
  { title: "Crosswind", src: "https://images.pexels.com/photos/27582026/pexels-photo-27582026.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Woman in a flowing coral chiffon gown lifted by the wind under a pale blue sky", focus: [0.5, 0.4], tone: "#e9744e" },
  { title: "Made fast", src: "https://images.pexels.com/photos/31041225/pexels-photo-31041225.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Bright yellow cloth tied to a wooden post and pulled tight across a deep blue sky", focus: [0.5, 0.5], tone: "#e9b320" },
  { title: "Red weather", src: "https://images.pexels.com/photos/6053189/pexels-photo-6053189.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Woman in a pleated red dress leaning into the frame beneath scattered white clouds", focus: [0.52, 0.55], tone: "#d8231c" },
  { title: "Cumulus", src: "https://images.pexels.com/photos/6540372/pexels-photo-6540372.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Woman in a long red gown standing against a deep blue sky with a low band of cloud", focus: [0.52, 0.62], tone: "#1f6fc2" },
  { title: "White wall", src: "https://images.pexels.com/photos/9547892/pexels-photo-9547892.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Woman in a short yellow dress standing before a white wall with a wedge of blue sky above", focus: [0.62, 0.6], tone: "#d9d4c8" },
  { title: "Saffron", src: "https://images.pexels.com/photos/13433087/pexels-photo-13433087.jpeg?auto=compress&cs=tinysrgb&w=900", alt: "Woman in profile wrapped in billowing yellow fabric with soft clouds behind her", focus: [0.45, 0.5], tone: "#e3b94a" },
];

const N = plates.length;
const MASTHEAD = "Midi"; // the wordmark, also printed on every sheet
const SERIES = "Summer proofs";
const HOLD_MS = 4400; // rest between automatic changes
const LIFT_SPRING = 18; // pull of a chosen print toward the camera
const LIFT_DAMPING = 4.6; // lower for more overshoot
const DROP_GRAVITY = 8; // how hard a print falls back to the table
const TEX_W = 720;
const TEX_H = 960;
const PAD = 40; // paper margin around the photograph, in texture pixels
const FOOT = 96; // the deeper bottom margin that carries the caption
const SERIF = '"Didot", "Bodoni 72", "Bodoni MT", "Playfair Display", "Libre Bodoni", Georgia, serif';
const GROTESK = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';

const mod = (a: number, n: number) => ((a % n) + n) % n;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// The set, in metres. A print is 21 by 28 cm and lies face up on a stone table.
const HX = 0.105;
const HY = 0.14;
const K_HERO = 0.35; // the gentle arch a lifted sheet keeps
/** Where each print lies: x, z, turn in radians, how far its long edges curl up, and a little twist. */
const slots = [
  [0.05, -0.56, 0.05, 0.75, 0.2],
  [-0.21, -0.28, -0.1, 0.6, -0.25],
  [-0.53, -0.45, 0.1, 1.1, 0.35],
  [-0.47, -0.13, 0.2, 0.95, 0.3],
  [0.34, -0.28, -0.16, 1.0, -0.4],
  [0.6, -0.48, -0.07, 0.9, -0.3],
  [0.48, 0.07, 0.13, 0.7, 0.3],
];

/** The branches whose shadows cross the table: base and direction in the plane of the window, length, bend, and a seed for the leaves. */
const branches = [
  [-0.5, 1.02, 0.74, 0.72, -0.5, 1],
  [-0.5, 0.74, 0.3, 0.5, 0.42, 4],
  [0.66, 2.5, -1.62, 0.62, 0.3, 7],
];
const rnd = (a: number, b: number) => {
  const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const GLSL_HEAD = `#version 300 es
precision highp float;
precision highp sampler2DArray;
const int NP = 7;
const vec2 HS = vec2(${HX}, ${HY});
const vec3 SUN = vec3(-0.52, 0.72, 0.46);
const vec3 SUNC = vec3(1.0, 0.93, 0.8) * 2.0;
const vec3 SKYC = vec3(0.44, 0.65, 1.0) * 0.44;
const vec3 FILL = vec3(0.065, 0.055, 0.045);
uniform vec3 uPc[7];
uniform vec3 uPu[7];
uniform vec3 uPv[7];
uniform vec2 uPk[7];
uniform sampler2DArray uTex;
uniform vec3 uCam, uRt, uUp, uFw;
uniform float uTan, uAspect, uFocus, uAperture;
uniform vec4 uLf[24];
uniform vec2 uLg[24];
uniform vec4 uSt[6];
uniform vec3 uBb[3];

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) { return 0.5 * vnoise(p) + 0.25 * vnoise(p * 2.1 + 7.3) + 0.125 * vnoise(p * 4.3 + 1.7) + 0.0625 * vnoise(p * 8.9); }

// Where a ray meets print i, a sheet bent into a shallow gutter: distance along the ray, and how far outside the sheet it lands.
bool sheet(int i, vec3 P, vec3 D, out float t, out float sd, out vec2 hit) {
  vec3 n = cross(uPu[i], uPv[i]);
  vec3 p = P - uPc[i];
  float pu = dot(p, uPu[i]), pv = dot(p, uPv[i]), pw = dot(p, n);
  float du = dot(D, uPu[i]), dv = dot(D, uPv[i]), dw = dot(D, n);
  if (abs(dw) < 1e-4) return false;
  vec2 k = uPk[i];
  t = -pw / dw;
  for (int j = 0; j < 2; j++) {
    float x = clamp(pu + t * du, -HS.x * 1.4, HS.x * 1.4), y = clamp(pv + t * dv, -HS.y * 1.4, HS.y * 1.4);
    t -= (pw + t * dw - k.x * x * x - k.y * x * y) / (dw - 2.0 * k.x * x * du - k.y * (du * y + x * dv));
  }
  if (t < 2e-4) return false;
  hit = vec2(pu + t * du, pv + t * dv);
  vec2 q = abs(hit) - HS;
  sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
  return true;
}

// The olive branches outside the window, as soft-edged shapes in a plane near the glass. The leaves are posed on the CPU each frame.
float foliage(vec2 q) {
  float d = 1e3;
  for (int b = 0; b < 3; b++) {
    vec3 bb = uBb[b];
    if (length(q - bb.xy) > bb.z) continue;
    for (int j = 0; j < 2; j++) {
      vec4 st = uSt[b * 2 + j];
      vec2 pa = q - st.xy, ba = st.zw - st.xy;
      d = min(d, length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0)) - 0.004);
    }
    for (int j = 0; j < 8; j++) {
      vec4 lf = uLf[b * 8 + j]; vec2 lg = uLg[b * 8 + j];
      vec2 dd = q - lf.xy;
      vec2 l = vec2(dd.x * lf.z + dd.y * lf.w, -dd.x * lf.w + dd.y * lf.z);
      float x = clamp(l.x / lg.x, 0.0, 1.0);
      d = min(d, max(abs(l.y) - lg.y * sqrt(4.0 * x * (1.0 - x)) * (1.2 - 0.55 * x), max(-l.x, l.x - lg.x)));
    }
  }
  return d;
}

// Sunlight that reaches a point before the prints get in the way: a tall window with glazing bars, and a branch swaying outside it.
float gobo(vec3 P) {
  float t = (P.x + 1.5) / -SUN.x;
  vec2 w = vec2(P.z + SUN.z * t, P.y + SUN.y * t);
  float b = 0.0075 * t;
  float open = smoothstep(-0.87 - b, -0.87 + b, w.x) * smoothstep(2.73 + b, 2.73 - b, w.x) * smoothstep(0.86 - b, 0.86 + b, w.y) * smoothstep(3.42 + b, 3.42 - b, w.y);
  float bx = abs(mod(w.x + 0.87, 0.9) - 0.45);
  float by = abs(w.y - 3.02);
  float bars = smoothstep(0.03 - b, 0.03 + b, 0.45 - bx);
  bars *= smoothstep(0.026 - b, 0.026 + b, by);
  float t2 = (P.x + 1.05) / -SUN.x;
  vec2 q = vec2(P.z + SUN.z * t2, P.y + SUN.y * t2);
  float lit = open * bars;
  if (lit < 0.004) return 0.0;
  float lb = 0.0085 * t2;
  return lit * mix(0.06, 1.0, smoothstep(-lb, lb, foliage(q)));
}
float sunVis(vec3 P, int skip) {
  float v = gobo(P);
  if (v < 0.004) return 0.0;
  float t, sd; vec2 h;
  for (int i = 0; i < NP; i++) {
    if (i == skip) continue;
    if (sheet(i, P, SUN, t, sd, h)) { float w = t * 0.021 + 0.0005; v *= smoothstep(-w, w, sd); }
  }
  return v;
}
// How much open sky a point still sees with the prints overhead: a wide, soft shadow that fades as a sheet rises.
float skyVis(vec3 P, int skip) {
  float v = 1.0; float t, sd; vec2 h;
  for (int i = 0; i < NP; i++) {
    if (i == skip) continue;
    if (sheet(i, P, vec3(0.0, 1.0, 0.0), t, sd, h)) { float w = t * 0.85 + 0.0035; v *= 1.0 - (1.0 - smoothstep(-w, w, sd)) / (1.0 + 53.0 * t * t); }
  }
  return v;
}

// The room a glossy sheet mirrors: pale walls, the sunny window on the left and a second window on the far wall.
vec3 env(vec3 ro, vec3 rd, float soft) {
  vec3 c = mix(vec3(0.3, 0.27, 0.24), vec3(0.52, 0.49, 0.45), smoothstep(-0.2, 0.9, rd.y));
  if (rd.z < -1e-3) {
    vec3 p = ro + rd * ((-3.2 - ro.z) / rd.z);
    float m = smoothstep(-1.5 - soft, -1.5 + soft, p.x) * smoothstep(1.7 + soft, 1.7 - soft, p.x) * smoothstep(0.45 - soft, 0.45 + soft, p.y) * smoothstep(4.6 + soft, 4.6 - soft, p.y);
    float bar = mix(1.0, smoothstep(0.0, 0.05 + soft, 0.4 - abs(mod(p.x + 1.5, 0.8) - 0.4)), 0.85);
    c = mix(c, vec3(0.74, 0.86, 1.0) * 3.4, m * bar);
  }
  if (rd.x < -1e-3) {
    vec3 p = ro + rd * ((-1.5 - ro.x) / rd.x);
    float m = smoothstep(-0.87 - soft, -0.87 + soft, p.z) * smoothstep(2.73 + soft, 2.73 - soft, p.z) * smoothstep(1.02 - soft, 1.02 + soft, p.y) * smoothstep(3.42 + soft, 3.42 - soft, p.y);
    float bar = smoothstep(0.0, 0.04 + soft, 0.45 - abs(mod(p.z + 0.87, 0.9) - 0.45)) * smoothstep(0.02, 0.05 + soft, abs(p.y - 3.02));
    c = mix(c, vec3(0.85, 0.92, 1.0) * 6.0, m * mix(1.0, bar, 0.9));
  }
  return c;
}

// exposed for paper in full sun: straight through the mid tones so the photographs keep their colour, with a soft shoulder
vec3 tonemap(vec3 x) { x *= 0.58; vec3 q = x * x; q *= q; return x / pow(1.0 + q, vec3(0.25)); }
vec4 pack(vec3 col, float depth) {
  float coc = clamp(uAperture * (1.0 - uFocus / max(depth, 0.05)), -1.0, 1.0);
  coc = sign(coc) * max(abs(coc) - 0.07, 0.0); // whatever is close to the focal plane stays fully sharp
  return vec4(pow(tonemap(col), vec3(1.0 / 2.2)), 0.5 + 0.5 * coc);
}
`;

const VS_FULL = `#version 300 es
out vec2 vUv;
void main() { vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); vUv = p; gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;

const FS_TABLE = `${GLSL_HEAD}
in vec2 vUv;
out vec4 o;
const vec3 HAZE = vec3(1.25, 1.12, 0.95);
void main() {
  vec2 ndc = vUv * 2.0 - 1.0;
  vec3 rd = normalize(uFw + uRt * (ndc.x * uTan * uAspect) + uUp * (ndc.y * uTan));
  if (rd.y > -1e-3) { o = pack(HAZE, 60.0); return; }
  float t = -uCam.y / rd.y;
  vec3 P = uCam + rd * t;
  float far = smoothstep(0.8, 2.4, t);

  // honed travertine, cut across the bed: cloudy masses of cream and tan, pale calcite veins, and filled pores gathered in the darker stone
  vec2 p = P.xz;
  float w1 = fbm(p * 1.7 + 3.0), w2 = fbm(p * 1.7 + 11.0);
  vec2 wq = p + 0.3 * vec2(w1, w2);
  float cloud = fbm(wq * 3.4);
  float mott = fbm(wq * 10.0 + 5.0);
  float tone = smoothstep(0.3, 0.72, cloud * 0.62 + mott * 0.38);
  vec3 alb = mix(vec3(0.81, 0.725, 0.595), vec3(0.62, 0.51, 0.375), tone);
  float vein = abs(fract(dot(p, vec2(0.62, 0.9)) * 1.1 + w1 * 1.3 + mott * 0.12) - 0.5);
  alb = mix(alb, vec3(0.87, 0.81, 0.71), (1.0 - smoothstep(0.0, 0.014, vein)) * 0.4 * smoothstep(0.3, 0.6, w2));
  vec2 g = wq * vec2(80.0, 110.0);
  vec2 id = floor(g), f = fract(g) - 0.5;
  float cluster = smoothstep(0.42, 0.7, vnoise(wq * 9.0 + 30.0)) * (0.4 + 0.6 * tone);
  float r = step(1.0 - 0.6 * cluster, hash(id)) * (0.16 + 0.3 * hash(id + 7.7));
  vec2 jf = f + (vec2(hash(id + 1.3), hash(id + 2.9)) - 0.5) * 0.5;
  float pit = (1.0 - smoothstep(r - 0.14, r, length(jf))) * step(0.001, r) * (1.0 - far);
  alb = mix(alb, alb * vec3(0.8, 0.8, 0.83), pit * 0.8);
  alb *= 1.0 + (vnoise(p * 420.0) - 0.5) * 0.06 * (1.0 - far);

  // sun on the stone. Paper is not opaque, so each sheet also lets a little light through, tinted by what is printed on it
  float sv = gobo(P);
  vec3 through = vec3(0.0);
  if (sv > 0.004) {
    float lit = sv, ts, sd; vec2 h;
    for (int i = 0; i < NP; i++) {
      if (!sheet(i, P, SUN, ts, sd, h)) continue;
      float w = ts * 0.021 + 0.0005;
      float cover = 1.0 - smoothstep(-w, w, sd);
      if (cover > 0.0) through += pow(textureLod(uTex, vec3(clamp(h / HS * 0.5 + 0.5, 0.02, 0.98), float(i)), 3.0 + 40.0 * ts).rgb, vec3(1.5)) * cover * lit * 0.11;
      sv *= 1.0 - cover;
    }
  }
  float kv = skyVis(P, -1);
  vec3 col = alb * (SUNC * SUN.y * (sv + through) + SKYC * kv + FILL);
  // the faint sheen of honed stone, strongest where the view skims the surface
  vec3 R = reflect(rd, vec3(0.0, 1.0, 0.0));
  float F = 0.04 + 0.96 * pow(1.0 - max(-rd.y, 0.0), 5.0);
  col += env(P, R, 0.45) * F * 0.8 * kv * (1.0 - 0.7 * pit);
  col = mix(col, HAZE, smoothstep(1.5, 3.4, t) * 0.75);
  o = pack(col, dot(rd, uFw) * t);
}`;

const VS_PRINT = `#version 300 es
precision highp float;
layout(location = 0) in vec2 aUv;
uniform vec3 uC, uU, uV, uCam, uRt, uUp, uFw;
uniform vec2 uK;
uniform float uTan, uAspect, uOff;
out vec3 vW; out vec2 vL;
void main() {
  vec2 l = aUv * vec2(${HX}, ${HY});
  vW = uC + uU * l.x + uV * l.y + cross(uU, uV) * (uK.x * l.x * l.x + uK.y * l.x * l.y - uOff);
  vL = l;
  vec3 d = vW - uCam;
  float z = dot(d, uFw);
  gl_Position = vec4(dot(d, uRt) / (uTan * uAspect), dot(d, uUp) / uTan, (z * 20.04 - 1.6) / 19.96, z);
}`;

const FS_PRINT = `${GLSL_HEAD}
uniform vec3 uC, uU, uV;
uniform vec2 uK;
uniform int uIdx;
uniform float uOff;
const vec3 PLATE = vec3(${(HX * (1 - (2 * PAD) / TEX_W) + 0.004).toFixed(5)}, ${(HY * (1 - (PAD + FOOT) / TEX_H) + 0.004).toFixed(5)}, ${((HY * (FOOT - PAD)) / TEX_H).toFixed(5)});
in vec3 vW; in vec2 vL;
out vec4 o;
void main() {
  vec3 pn = cross(uU, uV);
  vec3 N = normalize(pn - uU * (2.0 * uK.x * vL.x + uK.y * vL.y) - uV * (uK.y * vL.x));
  vec3 V = normalize(uCam - vW);
  bool back = dot(N, V) < 0.0;
  // the plate mark: the picture sits in a shallow pressed rectangle whose bevel catches the sun on one side and loses it on the other
  vec2 pq = abs(vL - vec2(0.0, PLATE.z)) - PLATE.xy;
  float pd = length(max(pq, 0.0)) + min(max(pq.x, pq.y), 0.0);
  vec2 pg = pq.x > pq.y ? vec2(sign(vL.x), 0.0) : vec2(0.0, sign(vL.y - PLATE.z));
  float bevel = smoothstep(-0.0001, 0.0002, pd) * (1.0 - smoothstep(0.0007, 0.001, pd));
  if (!back) N = normalize(N - (uU * pg.x + uV * pg.y) * bevel * 0.42);
  float sv = sunVis(vW, uIdx);
  float kv = skyVis(vW, uIdx);
  float nl = dot(N, SUN);
  vec2 uv = vL / HS * 0.5 + 0.5;
  vec3 col;
  if (uOff > 0.0) {
    // the sheet's thickness: a second copy just behind the face, showing as a sliver of raw paper core along the edges turned to the camera
    col = vec3(0.8, 0.765, 0.7) * (SUNC * 0.4 * sv + SKYC * kv * 0.7 + FILL);
  } else if (!back) {
    vec3 alb = texture(uTex, vec3(uv, float(uIdx))).rgb;
    // baryta paper: a tooth you only notice in the margins
    alb *= 0.985 + 0.03 * vnoise(vL * 900.0);
    col = alb * (SUNC * max(nl, 0.0) * sv + SKYC * kv * (0.55 + 0.45 * N.y) + FILL * (1.2 - 0.6 * N.y));
    // satin coat: a soft picture of the room, and a broad sheen where the sheet leans toward the sun
    float F = 0.04 + 0.96 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
    col += env(vW, reflect(-V, N), 0.3) * F * 0.6;
    col += SUNC * pow(max(dot(N, normalize(SUN + V)), 0.0), 60.0) * 0.28 * sv * step(0.0, nl);
    // the cut edge of the sheet
    float e = min(HS.x - abs(vL.x), HS.y - abs(vL.y));
    col *= 1.0 - 0.12 * smoothstep(0.0009, 0.0, e);
  } else {
    N = -N;
    vec3 paper = vec3(0.86, 0.835, 0.78) * (0.97 + 0.06 * vnoise(vL * 500.0));
    // the back of a print lit from the front glows a little with what is printed on it
    vec3 through = texture(uTex, vec3(uv, float(uIdx)), 3.0).rgb;
    col = paper * (SUNC * max(dot(N, SUN), 0.0) * sv + SKYC * kv * (0.55 + 0.45 * N.y) + vec3(0.42, 0.36, 0.28) * (0.5 - 0.5 * N.y))
        + paper * through * SUNC * max(nl, 0.0) * sv * 0.2;
  }
  o = pack(col, dot(vW - uCam, uFw));
}`;

const FS_LENS = `#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform vec2 uPx;
uniform float uMaxR;
in vec2 vUv;
out vec4 o;
float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
void main() {
  vec4 c0 = texture(uScene, vUv);
  float coc0 = abs(c0.a * 2.0 - 1.0);
  vec3 lin0 = pow(c0.rgb, vec3(2.2));
  vec3 acc = lin0; float wsum = 1.0; float spread = coc0;
  float rot = 6.2832 * ign(gl_FragCoord.xy);
  // 40 taps over the whole blur disc, then 14 more packed into the middle so slightly soft edges stay clean
  for (int k = 1; k < 54; k++) {
    float r = k < 40 ? sqrt(float(k) / 40.0) * uMaxR : sqrt(float(k - 39) / 14.0) * min(uMaxR, 3.2);
    float a = float(k) * 2.39996 + rot;
    vec4 s = texture(uScene, vUv + vec2(cos(a), sin(a)) * r * uPx);
    float sc = s.a * 2.0 - 1.0;
    float cs = abs(sc);
    if (sc > c0.a * 2.0 - 1.0) cs = min(cs, coc0 * 1.6 + 0.02);
    vec3 lin = pow(s.rgb, vec3(2.2));
    float w = smoothstep(r - 1.0, r + 1.0, cs * uMaxR);
    acc += lin * w; wsum += w; spread = max(spread, cs * step(0.5, w));
  }
  o = vec4(pow(acc / wsum, vec3(1.0 / 2.2)), spread);
}`;

const FS_PRINTOUT = `#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform vec2 uPx;
uniform float uTime;
in vec2 vUv;
out vec4 o;
float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
void main() {
  // tidy the blur where the lens pass was sparse, let the brightest stone bloom a little, then vignette and grain
  vec4 c = texture(uScene, vUv);
  float r = clamp(c.a * 4.0, 0.0, 1.0) * 1.5;
  vec3 col = c.rgb * 4.0;
  for (int k = 0; k < 8; k++) {
    float a = float(k) * 0.7854;
    col += texture(uScene, vUv + vec2(cos(a), sin(a)) * r * (k % 2 == 0 ? 1.0 : 1.9) * uPx).rgb;
  }
  col /= 12.0;
  vec3 glow = textureLod(uScene, vUv, 5.5).rgb * 0.5 + textureLod(uScene, vUv, 7.0).rgb * 0.5;
  col += pow(glow, vec3(3.0)) * 0.05;
  // a veil of warm flare from the window side, a gentle grade, then vignette and grain
  col += vec3(1.0, 0.82, 0.58) * 0.07 * smoothstep(1.25, 0.0, length(vUv - vec2(0.0, 1.0)));
  float lum = dot(col, vec3(0.3, 0.59, 0.11));
  col = mix(vec3(lum), col, 1.07);
  vec2 q = vUv - 0.5;
  col *= 1.0 - 0.42 * dot(q, q);
  col += (ign(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) * 0.022;
  o = vec4(col, 1.0);
}`;

function program(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const p = gl.createProgram()!;
  for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]] as const) {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
    gl.attachShader(p, s);
  }
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || "link");
  return p;
}

/** A sheet as a fine grid, so the vertex shader can bend it. */
const SEG = 24;
function sheetMesh() {
  const out: number[] = [];
  for (let i = 0; i < SEG; i++) {
    for (let j = 0; j < 4; j++) {
      const x0 = (i / SEG) * 2 - 1, x1 = ((i + 1) / SEG) * 2 - 1, y0 = (j / 4) * 2 - 1, y1 = ((j + 1) / 4) * 2 - 1;
      out.push(x0, y0, x1, y0, x1, y1, x0, y0, x1, y1, x0, y1);
    }
  }
  return new Float32Array(out);
}

/** Lay out one sheet: paper, the photograph cropped around its focus point, and a printed caption in the wide bottom margin. */
function paintSheet(ctx: CanvasRenderingContext2D, i: number, img: HTMLImageElement | null) {
  const p = plates[i];
  ctx.fillStyle = "#f4f1e9";
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  const iw = TEX_W - PAD * 2, ih = TEX_H - PAD - FOOT;
  if (img) {
    const s = Math.max(iw / img.naturalWidth, ih / img.naturalHeight);
    const sw = iw / s, sh = ih / s;
    ctx.drawImage(img, clamp(p.focus[0] * img.naturalWidth - sw / 2, 0, img.naturalWidth - sw), clamp(p.focus[1] * img.naturalHeight - sh / 2, 0, img.naturalHeight - sh), sw, sh, PAD, PAD, iw, ih);
  } else {
    const g = ctx.createLinearGradient(0, PAD, 0, PAD + ih);
    g.addColorStop(0, "#3f7fd0");
    g.addColorStop(1, p.tone);
    ctx.fillStyle = g;
    ctx.fillRect(PAD, PAD, iw, ih);
  }
  const base = TEX_H - FOOT / 2 + 8;
  ctx.fillStyle = "#24211d";
  ctx.textBaseline = "alphabetic";
  (ctx as unknown as { letterSpacing: string }).letterSpacing = "3.4px";
  ctx.font = `600 15px ${GROTESK}`;
  ctx.textAlign = "left";
  ctx.fillText(p.title.toUpperCase(), PAD, base);
  ctx.textAlign = "right";
  ctx.fillText(`${String(i + 1).padStart(2, "0")} / ${String(N).padStart(2, "0")}`, TEX_W - PAD, base);
  (ctx as unknown as { letterSpacing: string }).letterSpacing = "-1px";
  ctx.font = `italic 34px ${SERIF}`;
  ctx.textAlign = "center";
  ctx.fillText(MASTHEAD, TEX_W / 2, base + 4);
}

type V3 = [number, number, number];
const add = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
const mix3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const smooth = (t: number) => {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
};

type Sim = {
  active: number;
  lift: Float32Array; liftV: Float32Array; flex: Float32Array; flexV: Float32Array; hov: Float32Array; wait: Float32Array;
  puffs: { at: number; j: number; imp: number }[];
  hover: number; inside: boolean; px: number; py: number; cx: number; cy: number; downX: number; downY: number;
  focus: number; paused: boolean; nextAuto: number; dirty: boolean;
  pick: (x: number, y: number) => number;
};

export default function SunlitPrintTableGallery() {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(0);
  const [mode, setMode] = useState<"pending" | "gl" | "still">("pending");
  const sim = useRef<Sim>({
    active: 0,
    lift: Float32Array.from({ length: N }, (_, i) => (i === 0 ? 1 : 0)), liftV: new Float32Array(N), flex: new Float32Array(N), flexV: new Float32Array(N), hov: new Float32Array(N), wait: new Float32Array(N),
    puffs: [], hover: -1, inside: false, px: 0, py: 0, cx: 0, cy: 0, downX: 0, downY: 0,
    focus: 0.6, paused: false, nextAuto: 0, dirty: true,
    pick: () => -1,
  });

  /** Put the lifted print down and pick another one up. */
  const choose = useCallback((next: number) => {
    const s = sim.current;
    const to = mod(next, N);
    if (to === s.active) return;
    s.liftV[s.active] += 0.9; // a small toss before it drops
    s.wait[to] = 0.2; // one edge peels off the stone before the sheet leaves it
    s.active = to;
    s.nextAuto = performance.now() + HOLD_MS * 1.6;
    s.dirty = true;
    setActive(to);
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance" });
    if (!gl) {
      setMode("still");
      return;
    }
    const s = sim.current;
    let progTable: WebGLProgram, progPrint: WebGLProgram, progLens: WebGLProgram, progOut: WebGLProgram;
    try {
      progTable = program(gl, VS_FULL, FS_TABLE);
      progPrint = program(gl, VS_PRINT, FS_PRINT);
      progLens = program(gl, VS_FULL, FS_LENS);
      progOut = program(gl, VS_FULL, FS_PRINTOUT);
    } catch {
      setMode("still");
      return;
    }
    setMode("gl");

    // the sheets, one layer each of an sRGB array texture so the light maths is linear
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, Math.floor(Math.log2(TEX_H)) + 1, gl.SRGB8_ALPHA8, TEX_W, TEX_H, N);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
    if (aniso) gl.texParameterf(gl.TEXTURE_2D_ARRAY, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8);
    const scratch = document.createElement("canvas");
    scratch.width = TEX_W;
    scratch.height = TEX_H;
    const sctx = scratch.getContext("2d")!;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    const upload = (layer: number) => {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
      gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, layer, TEX_W, TEX_H, 1, gl.RGBA, gl.UNSIGNED_BYTE, scratch);
      gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
      s.dirty = true;
    };
    let alive = true;
    plates.forEach((p, i) => {
      paintSheet(sctx, i, null);
      upload(i);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (!alive) return;
        paintSheet(sctx, i, img);
        upload(i);
      };
      img.src = p.src;
    });

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, sheetMesh(), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
    gl.bindVertexArray(null);
    const emptyVao = gl.createVertexArray();

    // multisampled scene target, resolved into a texture the lens pass reads (colour + blur size in alpha)
    const msFbo = gl.createFramebuffer();
    const msColor = gl.createRenderbuffer();
    const msDepth = gl.createRenderbuffer();
    const resFbo = gl.createFramebuffer();
    const resTex = gl.createTexture();
    const lensFbo = gl.createFramebuffer();
    const lensTex = gl.createTexture();
    let W = 0, H = 0, scale = Math.min(window.devicePixelRatio || 1, 1.5);
    const samples = Math.min(4, gl.getParameter(gl.MAX_SAMPLES));
    const resize = () => {
      const cw = wrap.clientWidth, ch = wrap.clientHeight;
      let k = scale;
      if (cw * ch * k * k > 1.5e6) k = Math.sqrt(1.5e6 / (cw * ch));
      const w = Math.max(2, Math.round(cw * k)), h = Math.max(2, Math.round(ch * k));
      if (w === W && h === H) return;
      W = w;
      H = h;
      canvas.width = W;
      canvas.height = H;
      gl.bindRenderbuffer(gl.RENDERBUFFER, msColor);
      gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.RGBA8, W, H);
      gl.bindRenderbuffer(gl.RENDERBUFFER, msDepth);
      gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.DEPTH_COMPONENT24, W, H);
      gl.bindFramebuffer(gl.FRAMEBUFFER, msFbo);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, msColor);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, msDepth);
      for (const [unit, t, f, mip] of [[gl.TEXTURE2, resTex, resFbo, false], [gl.TEXTURE3, lensTex, lensFbo, true]] as const) {
        gl.activeTexture(unit);
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.bindFramebuffer(gl.FRAMEBUFFER, f);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      }
      s.dirty = true;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const U = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);
    const pc = new Float32Array(21), pu = new Float32Array(21), pv = new Float32Array(21), pk = new Float32Array(14);
    const TAN = Math.tan((19.5 * Math.PI) / 180);
    const view = { cam: [0, 0.66, 0.62] as V3, rt: [1, 0, 0] as V3, up: [0, 1, 0] as V3, fw: [0, 0, -1] as V3, tan: TAN, aspect: 1.6 };

    /** Camera and every sheet's pose for this instant. */
    const pose = (t: number) => {
      const aspect = W / H;
      const tan = TAN * (aspect < 1.15 ? Math.pow(1.15 / aspect, 0.55) : 1);
      const frame = (cam: V3) => {
        const fw = norm([0 - cam[0], 0.07 - cam[1], 0 - cam[2]]);
        const rt = norm([-fw[2], 0, fw[0]]);
        return { fw, rt, up: cross(rt, fw) };
      };
      // the lifted print is placed against a steady camera, so the real one can drift and lean around it
      const cam0: V3 = [0, 0.66, 0.62];
      const f0 = frame(cam0);
      const drift = reduce ? 0 : 1;
      const cam: V3 = [s.cx * 0.07 + drift * 0.012 * Math.sin(t * 0.33), 0.66 - s.cy * 0.03 + drift * 0.006 * Math.sin(t * 0.27 + 1), 0.62];
      const f = frame(cam);
      view.cam = cam;
      view.fw = f.fw;
      view.rt = f.rt;
      view.up = f.up;
      view.tan = tan;
      view.aspect = aspect;
      const d = Math.max((0.56 * TAN) / tan, HX / (0.64 * tan * aspect));
      const narrow = clamp((aspect - 0.6) / 0.9, 0, 1);
      const bob = drift * Math.sin(t * 0.9);
      const heroC = add(add(add(cam0, f0.fw, d), f0.rt, 0.04 * narrow * d / 0.56), f0.up, 0.014 + 0.004 * bob);
      let heroN = norm(add(add(add([-f0.fw[0], -f0.fw[1], -f0.fw[2]], [0, 1, 0], 0.5), f0.rt, -0.12 + s.cx * 0.2 + drift * 0.03 * Math.sin(t * 0.5)), f0.up, -s.cy * 0.2));
      const heroV0 = norm(add([0, 1, 0], heroN, -heroN[1]));
      const heroU0 = cross(heroV0, heroN);
      const roll = -0.035 + drift * 0.012 * Math.sin(t * 0.41 + 2);
      const heroU = norm(add(add([0, 0, 0], heroU0, Math.cos(roll)), heroV0, Math.sin(roll)));
      const heroV = cross(heroN, heroU);
      heroN = cross(heroU, heroV);
      let best = 0, bestLift = -1;
      for (let i = 0; i < N; i++) {
        const [sx, sz, yaw, curl, twist] = slots[i];
        const l = s.lift[i];
        const x = sx * (0.42 + 0.58 * narrow), z = sz;
        const ey = l < 1 ? 1 - (1 - l) * (1 - l) : 1 + (l - 1) * 0.5;
        const exz = smooth(l) + Math.max(0, l - 1) * 0.4;
        const er = smooth((l - 0.04) / 0.86);
        const u0: V3 = [Math.cos(yaw), 0, -Math.sin(yaw)];
        const v0: V3 = [-Math.sin(yaw), 0, -Math.cos(yaw)];
        let u = norm(mix3(u0, heroU, er));
        // mid flight the sheet rolls a little, as if lifted by one edge
        const tw = 0.3 * Math.sin(Math.PI * clamp(l, 0, 1)) * (i % 2 ? 1 : -1) * (1 - er * 0.4) + s.hov[i] * 0.05;
        let v = mix3(v0, heroV, er);
        v = norm(add(v, u, -dot(u, v)));
        const n0 = cross(u, v);
        u = norm(add(add([0, 0, 0], u, Math.cos(tw)), n0, -Math.sin(tw)));
        const hop = s.hov[i] * 0.014 * (1 - clamp(l, 0, 1));
        const c: V3 = [x + (heroC[0] - x) * exz, 0.0018 + hop + (heroC[1] - 0.0018) * ey, z + (heroC[2] - z) * exz];
        pc.set(c, i * 3);
        pu.set(u, i * 3);
        pv.set(v, i * 3);
        const lc = clamp(l, 0, 1);
        pk[i * 2] = clamp(curl * (1 - lc) + K_HERO * lc + s.flex[i] + s.hov[i] * 0.9 * (1 - lc), -0.25, 3.4);
        pk[i * 2 + 1] = twist * (1 - lc) + s.flex[i] * 0.25;
        if (l > bestLift) {
          bestLift = l;
          best = i;
        }
      }
      const heroDepth = dot(add([pc[best * 3], pc[best * 3 + 1], pc[best * 3 + 2]], cam, -1), f.fw);
      const want = 0.95 + (heroDepth - 0.95) * smooth(bestLift * 1.15);
      s.focus = reduce ? want : s.focus + (want - s.focus) * 0.14;
    };

    /** Which print lies under a point of the stage, or -1. */
    s.pick = (mx: number, my: number) => {
      const rd = norm(add(add(view.fw, view.rt, mx * view.tan * view.aspect), view.up, -my * view.tan));
      let hit = -1, near = 1e9;
      for (let i = 0; i < N; i++) {
        const c: V3 = [pc[i * 3], pc[i * 3 + 1], pc[i * 3 + 2]];
        const u: V3 = [pu[i * 3], pu[i * 3 + 1], pu[i * 3 + 2]];
        const v: V3 = [pv[i * 3], pv[i * 3 + 1], pv[i * 3 + 2]];
        const n = cross(u, v);
        const dn = dot(rd, n);
        if (Math.abs(dn) < 1e-5) continue;
        const t = dot(add(c, view.cam, -1), n) / dn;
        if (t <= 0 || t > near) continue;
        const p = add(add(view.cam, rd, t), c, -1);
        if (Math.abs(dot(p, u)) < HX && Math.abs(dot(p, v)) < HY) {
          near = t;
          hit = i;
        }
      }
      return hit;
    };

    const lf = new Float32Array(96), lg = new Float32Array(48), st = new Float32Array(24), bb = new Float32Array(9);
    /** Pose every leaf for this instant: the branches sway from their base and each leaf flutters at its own pace. */
    const foliage = (t: number) => {
      branches.forEach(([bx, by, ang0, len, bend, seed], b) => {
        const ang = ang0 + (b === 1 ? 1.3 : b === 2 ? 0.8 : 1) * (0.05 * Math.sin(t * 0.62) + 0.02 * Math.sin(t * 1.31 + 1));
        let px = bx, py = by;
        for (let j = 1; j <= 8; j++) {
          const k = (b * 8 + j - 1) * 4;
          if (j < 8) {
            const q = j / 7;
            const ax = bx + Math.cos(ang + bend * q * 0.5) * len * q, ay = by + Math.sin(ang + bend * q * 0.5) * len * q;
            const la = ang + bend * q + (j % 2 ? 1 : -1) * (0.75 + 0.2 * rnd(j, seed)) + 0.12 * Math.sin(t * (1.1 + 0.23 * j) + seed + j * 1.7);
            lf.set([ax, ay, Math.cos(la), Math.sin(la)], k);
            lg.set([0.13 + 0.05 * rnd(seed, j), 0.027], k / 2);
            if (j === 4) st.set([bx, by, ax, ay], b * 8);
            if (j === 7) st.set([st[b * 8 + 2], st[b * 8 + 3], ax, ay], b * 8 + 4);
            px = ax;
            py = ay;
          } else {
            lf.set([px, py, Math.cos(ang + bend), Math.sin(ang + bend)], k);
            lg.set([0.15, 0.026], k / 2);
          }
        }
        bb.set([(bx + px) / 2, (by + py) / 2, Math.hypot(px - bx, py - by) / 2 + 0.24], b * 3);
      });
    };

    const shared = (p: WebGLProgram) => {
      gl.useProgram(p);
      gl.uniform4fv(U(p, "uLf"), lf);
      gl.uniform2fv(U(p, "uLg"), lg);
      gl.uniform4fv(U(p, "uSt"), st);
      gl.uniform3fv(U(p, "uBb"), bb);
      gl.uniform3fv(U(p, "uPc"), pc);
      gl.uniform3fv(U(p, "uPu"), pu);
      gl.uniform3fv(U(p, "uPv"), pv);
      gl.uniform2fv(U(p, "uPk"), pk);
      gl.uniform1i(U(p, "uTex"), 0);
      gl.uniform3fv(U(p, "uCam"), view.cam);
      gl.uniform3fv(U(p, "uRt"), view.rt);
      gl.uniform3fv(U(p, "uUp"), view.up);
      gl.uniform3fv(U(p, "uFw"), view.fw);
      gl.uniform1f(U(p, "uTan"), view.tan);
      gl.uniform1f(U(p, "uAspect"), view.aspect);
      gl.uniform1f(U(p, "uFocus"), s.focus);
      gl.uniform1f(U(p, "uAperture"), 0.72);
    };

    const draw = (t: number) => {
      pose(t);
      foliage(reduce ? 0 : t);
      gl.bindFramebuffer(gl.FRAMEBUFFER, msFbo);
      gl.viewport(0, 0, W, H);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);
      gl.depthMask(false);
      shared(progTable);
      gl.bindVertexArray(emptyVao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(true);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      shared(progPrint);
      gl.bindVertexArray(vao);
      for (let i = 0; i < N; i++) {
        gl.uniform3f(U(progPrint, "uC"), pc[i * 3], pc[i * 3 + 1], pc[i * 3 + 2]);
        gl.uniform3f(U(progPrint, "uU"), pu[i * 3], pu[i * 3 + 1], pu[i * 3 + 2]);
        gl.uniform3f(U(progPrint, "uV"), pv[i * 3], pv[i * 3 + 1], pv[i * 3 + 2]);
        gl.uniform2f(U(progPrint, "uK"), pk[i * 2], pk[i * 2 + 1]);
        gl.uniform1i(U(progPrint, "uIdx"), i);
        gl.uniform1f(U(progPrint, "uOff"), 0);
        gl.drawArrays(gl.TRIANGLES, 0, SEG * 24);
        gl.uniform1f(U(progPrint, "uOff"), 0.0011);
        gl.drawArrays(gl.TRIANGLES, 0, SEG * 24);
      }
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, msFbo);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, resFbo);
      gl.blitFramebuffer(0, 0, W, H, 0, 0, W, H, gl.COLOR_BUFFER_BIT, gl.NEAREST);
      gl.bindFramebuffer(gl.FRAMEBUFFER, lensFbo);
      gl.disable(gl.DEPTH_TEST);
      gl.useProgram(progLens);
      gl.uniform1i(U(progLens, "uScene"), 2);
      gl.uniform2f(U(progLens, "uPx"), 1 / W, 1 / H);
      gl.uniform1f(U(progLens, "uMaxR"), H * 0.012);
      gl.bindVertexArray(emptyVao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, lensTex);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(progOut);
      gl.uniform1i(U(progOut, "uScene"), 3);
      gl.uniform2f(U(progOut, "uPx"), 1 / W, 1 / H);
      gl.uniform1f(U(progOut, "uTime"), reduce ? 0 : t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    /** One small step: the chosen sheet springs up, the others fall, land, and send a puff of air to their neighbours. */
    const physics = (dt: number, now: number) => {
      for (let i = 0; i < N; i++) {
        let a = 0;
        if (i === s.active && s.wait[i] > 0) {
          s.wait[i] -= dt;
        } else if (i === s.active) {
          a = LIFT_SPRING * (1 - s.lift[i]) - LIFT_DAMPING * s.liftV[i];
          s.liftV[i] += a * dt;
          s.lift[i] += s.liftV[i] * dt;
        } else if (s.lift[i] > 0 || s.liftV[i] > 0) {
          a = -DROP_GRAVITY - 1.1 * s.liftV[i];
          s.liftV[i] += a * dt;
          s.lift[i] += s.liftV[i] * dt;
          if (s.lift[i] <= 0) {
            const hit = -s.liftV[i];
            s.lift[i] = 0;
            s.liftV[i] = hit > 1.6 ? hit * 0.15 : 0;
            a = 0;
            if (hit > 0.6) {
              s.flexV[i] -= hit * 5.5; // the sheet slaps flat, then springs back into its curl
              for (let j = 0; j < N; j++) {
                if (j === i || j === s.active) continue;
                const dist = Math.hypot(slots[i][0] - slots[j][0], slots[i][1] - slots[j][1]);
                s.puffs.push({ at: now + (dist / 1.5) * 1000, j, imp: hit * 9 * Math.exp(-dist / 0.34) });
              }
            }
          }
        }
        // the paper's own flutter, shaken by how hard the sheet is being moved
        const fa = -420 * s.flex[i] - 6 * s.flexV[i] - a * 1.5;
        s.flexV[i] += fa * dt;
        s.flex[i] += s.flexV[i] * dt;
        const hv = (s.hover === i && i !== s.active) || s.wait[i] > 0 ? 1 : 0;
        s.hov[i] += (hv - s.hov[i]) * Math.min(1, dt * 9);
      }
      for (let k = s.puffs.length - 1; k >= 0; k--) {
        const p = s.puffs[k];
        if (now < p.at) continue;
        s.flexV[p.j] += p.imp;
        if (s.lift[p.j] <= 0) s.liftV[p.j] += p.imp * 0.045;
        s.puffs.splice(k, 1);
      }
    };

    let raf = 0, visible = true, last = performance.now(), slow = 0, frames = 0;
    s.nextAuto = last + HOLD_MS + 600;
    const tick = (now: number) => {
      const real = now - last;
      const dt = Math.min(0.05, real / 1000);
      last = now;
      if (reduce) {
        for (let i = 0; i < N; i++) {
          const to = i === s.active ? 1 : 0;
          if (s.lift[i] !== to) s.dirty = true;
          s.lift[i] = to;
          s.liftV[i] = 0;
          s.flex[i] = 0;
          s.flexV[i] = 0;
        }
      } else {
        const sub = Math.max(1, Math.ceil(dt / 0.004));
        for (let i = 0; i < sub; i++) physics(dt / sub, now);
        s.cx += (s.px - s.cx) * Math.min(1, dt * 3.2);
        s.cy += (s.py - s.cy) * Math.min(1, dt * 3.2);
        if (s.paused || s.inside) s.nextAuto = Math.max(s.nextAuto, now + 1800); // never change print under someone's pointer
        if (!document.hidden && now > s.nextAuto) {
          choose(s.active + 1);
          s.nextAuto = now + HOLD_MS;
        }
      }
      if (!reduce || s.dirty) {
        draw(now / 1000);
        s.dirty = false;
        // measure, do not guess: if the machine cannot hold the frame rate, render fewer pixels
        if (!reduce && ++frames > 20) {
          slow = slow * 0.92 + (real > 24 ? 1 : 0) * 0.08;
          if (slow > 0.6 && scale > 0.5) {
            scale *= 0.85;
            slow = 0;
            frames = 0;
            resize();
          }
        }
      }
      if (visible) raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      const was = visible;
      visible = e.isIntersecting;
      if (visible && !was) {
        last = performance.now();
        frames = 0;
        raf = requestAnimationFrame(tick);
      }
    });
    io.observe(wrap);
    raf = requestAnimationFrame(tick);

    const at = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      return [clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1), clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1)];
    };
    const move = (e: PointerEvent) => {
      const [x, y] = at(e);
      if (e.pointerType === "mouse") {
        s.px = x;
        s.py = y;
      }
      const h = s.pick(x, y);
      s.hover = h === s.active ? -1 : h;
      s.inside = e.pointerType === "mouse";
      canvas.style.cursor = "pointer";
      s.dirty = true;
    };
    const down = (e: PointerEvent) => {
      s.downX = e.clientX;
      s.downY = e.clientY;
    };
    const up = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - s.downX, e.clientY - s.downY) > 10) return;
      const [x, y] = at(e);
      const h = s.pick(x, y);
      choose(h < 0 || h === s.active ? s.active + 1 : h);
      s.hover = -1;
    };
    const leave = () => {
      s.px = 0;
      s.py = 0;
      s.hover = -1;
      s.inside = false;
    };
    wrap.addEventListener("pointermove", move);
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointerup", up);
    wrap.addEventListener("pointerleave", leave);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      wrap.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointerup", up);
      wrap.removeEventListener("pointerleave", leave);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [reduce, choose]);

  // without WebGL the plain version still changes print by itself
  useEffect(() => {
    if (mode !== "still" || reduce) return;
    const id = window.setInterval(() => {
      if (!sim.current.paused && !document.hidden) choose(sim.current.active + 1);
    }, HOLD_MS);
    return () => window.clearInterval(id);
  }, [mode, reduce, choose]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      choose(sim.current.active + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      choose(sim.current.active - 1);
    }
  };
  const pause = (v: boolean) => () => {
    sim.current.paused = v;
    if (!v) sim.current.nextAuto = performance.now() + HOLD_MS;
  };
  const btn = "grid h-11 w-11 place-items-center rounded-full border border-stone-900/25 bg-white/40 text-stone-900 backdrop-blur-sm transition hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900";

  return (
    <section className="relative overflow-hidden bg-[#e6d9c3]" onFocus={pause(true)} onBlur={pause(false)}>
      <div
        ref={wrapRef}
        role="group"
        aria-roledescription="carousel"
        aria-label="Seven photographic prints on a sunlit stone table. Use the left and right arrow keys to lift the next print."
        tabIndex={0}
        onKeyDown={onKey}
        className="group relative h-[620px] w-full select-none outline-none sm:h-[780px]"
      >
        <canvas ref={canvasRef} aria-hidden="true" className={`absolute inset-0 h-full w-full touch-pan-y ${mode === "still" ? "hidden" : ""}`} />

        {/* the same table built from plain images, for browsers without WebGL 2 */}
        {mode === "still" && (
          <div className="absolute inset-0 overflow-hidden" style={{ background: "radial-gradient(120% 90% at 30% 20%, #f1e6d2 0%, #e4d5bb 55%, #d3c2a5 100%)" }}>
            <style>{`@keyframes sunlit-print-table-float { from { transform: translate(-50%, 0) rotate(-2.6deg); } to { transform: translate(-50%, -12px) rotate(-1.4deg); } } .sunlit-print-table-float { animation: sunlit-print-table-float 3.2s ease-in-out infinite alternate; } @keyframes sunlit-print-table-sway { from { transform: rotate(-2.5deg); } to { transform: rotate(3deg); } } .sunlit-print-table-sway { transform-origin: 0% 0%; animation: sunlit-print-table-sway 4.6s ease-in-out infinite alternate; } @media (prefers-reduced-motion: reduce) { .sunlit-print-table-float, .sunlit-print-table-sway { animation: none; } }`}</style>
            <div className="absolute inset-x-0 top-0 h-[70%]" style={{ perspective: "1200px", perspectiveOrigin: "50% 10%" }}>
              <div className="absolute inset-x-0 top-0 h-[150%]" style={{ transform: "rotateX(52deg)", transformOrigin: "50% 0%" }}>
                {plates.map((p, i) => {
                  if (i === active) return null;
                  const [x, z, yaw] = slots[i];
                  return (
                    <div key={p.src} className="absolute w-[19%] bg-[#f4f1e9] p-[0.8%] pb-[2%] shadow-[10px_8px_10px_rgba(70,58,70,0.42)] sm:w-[13%]" style={{ left: `${50 + x * 70}%`, top: `${60 + z * 82}%`, transform: `translate(-50%, -50%) rotate(${-yaw * 57}deg)` }}>
                      <img src={p.src} alt="" width={900} height={1200} className="aspect-[3/4] w-full object-cover" style={{ background: p.tone, objectPosition: `${p.focus[0] * 100}% ${p.focus[1] * 100}%` }} />
                    </div>
                  );
                })}
              </div>
            </div>
            {/* window bars and an olive branch, as shadows */}
            <div aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(122deg, rgba(74,70,92,0.4) 0%, rgba(74,70,92,0.4) 5%, transparent 5.8%, transparent 30%, rgba(74,70,92,0.26) 30.4%, rgba(74,70,92,0.26) 31.8%, transparent 32.3%, transparent 86%, rgba(74,70,92,0.26) 86.5%, rgba(74,70,92,0.26) 88%, transparent 88.6%)" }} />
            <svg aria-hidden="true" viewBox="0 0 400 200" className="sunlit-print-table-sway absolute left-[12%] top-0 w-[46%] max-w-[560px] opacity-40" style={{ filter: "blur(2.5px)" }}>
              <path d="M10 6 C120 30 230 34 380 14" fill="none" stroke="#4a465c" strokeWidth="3" />
              {[[60, 16, 62], [110, 26, -48], [160, 31, 58], [210, 32, -50], [262, 29, 52], [312, 23, -46], [360, 16, 40]].map(([x, y, r]) => (
                <ellipse key={x} cx={x + 26} cy={y} rx="28" ry="7.5" fill="#4a465c" transform={`rotate(${r} ${x} ${y})`} />
              ))}
            </svg>
            <div key={active} className="sunlit-print-table-float absolute left-1/2 top-[14%] w-[60%] max-w-[330px] bg-[#f4f1e9] p-[14px] pb-[40px] shadow-[90px_70px_26px_-8px_rgba(74,62,78,0.42),0_1px_2px_rgba(60,50,30,0.3)] sm:left-[55%] sm:top-[10%]" style={{ transform: "translate(-50%, 0) rotate(-2.6deg)" }}>
              <img src={plates[active].src} alt={plates[active].alt} width={900} height={1200} className="aspect-[3/4] w-full object-cover" style={{ background: plates[active].tone, objectPosition: `${plates[active].focus[0] * 100}% ${plates[active].focus[1] * 100}%` }} />
              <p aria-hidden="true" className="absolute inset-x-[14px] bottom-[11px] flex items-baseline justify-between text-[8px] font-semibold uppercase tracking-[0.22em] text-stone-800" style={{ fontFamily: GROTESK }}>
                <span>{plates[active].title}</span>
                <span className="text-[16px] font-normal normal-case italic tracking-tight" style={{ fontFamily: SERIF }}>{MASTHEAD}</span>
                <span className="tabular-nums">{String(active + 1).padStart(2, "0")} / {String(N).padStart(2, "0")}</span>
              </p>
            </div>
          </div>
        )}

        {/* keyboard focus ring, drawn above the canvas so it is not covered */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden ring-2 ring-inset ring-stone-900 group-focus-visible:block" />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-baseline justify-between p-5 text-stone-900 sm:p-9">
          <p className="text-[28px] italic leading-none sm:text-[32px]" style={{ fontFamily: SERIF, letterSpacing: "-0.03em" }}>
            {MASTHEAD}
          </p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-stone-800 sm:text-[11px]" style={{ fontFamily: GROTESK }}>
            Pick a print<span className="hidden sm:inline">, or use the arrow keys</span>
          </p>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-9">
          <p aria-live="polite" className="text-stone-900">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-800" style={{ fontFamily: GROTESK }}>
              <span className="tabular-nums">{String(active + 1).padStart(2, "0")}</span>
              <span className="mx-2 text-stone-600">/</span>
              <span className="tabular-nums">{String(N).padStart(2, "0")}</span>
              <span className="ml-4 hidden sm:inline">{SERIES}</span>
            </span>
            <span className="mt-2 block text-[40px] italic leading-[0.92] sm:text-[84px]" style={{ fontFamily: SERIF, letterSpacing: "-0.035em" }}>
              {plates[active].title}
            </span>
            <span className="sr-only">. {plates[active].alt}</span>
          </p>
          <div className="pointer-events-auto flex gap-2">
            <button type="button" onClick={() => choose(sim.current.active - 1)} aria-label="Previous print" className={btn}>
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 4l-6 6 6 6" />
              </svg>
            </button>
            <button type="button" onClick={() => choose(sim.current.active + 1)} aria-label="Next print" className={btn}>
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 4l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
