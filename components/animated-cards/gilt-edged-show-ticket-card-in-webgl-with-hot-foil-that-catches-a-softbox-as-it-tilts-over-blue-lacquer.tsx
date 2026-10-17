import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** Everything printed on the card. Change the words here and the foil, the emboss and the captions follow. */
const card = {
  house: "Orvelle",
  line: "AUTUMN SHOW",
  admit: "ADMIT ONE",
  number: "No. 0412",
  venue: "THE GLASSHOUSE, HARROW LANE",
  seat: [
    { label: "ROW", value: "A" },
    { label: "SEAT", value: "14" },
    { label: "DOORS", value: "19:30" },
  ],
  small: "ADMITS ONE GUEST  ·  PLEASE BRING THIS CARD",
  photo: {
    src: "https://images.pexels.com/photos/30755161/pexels-photo-30755161.jpeg?auto=compress&cs=tinysrgb&w=1000",
    alt: "Woman with braided hair built into two tall spheres, hands pressed together, in a pale blue shirt against a cobalt backdrop",
    focusY: 0.0, // 0 keeps the top of the photograph, 1 the bottom
    tone: "#1b3f97",
  },
};
const sides = [
  { tag: "Face", title: "Admit one" },
  { tag: "Reverse", title: "Row A, seat 14" },
];

const TILT = 0.38; // how far the card turns to face the pointer, in radians
const SPRING = 70; // pull toward the pose it is asked for
const DAMPING = 9.5; // lower for more wobble
const FLIP_SPRING = 23;
const FLIP_DAMPING = 4.7; // lower for more overshoot when it turns over
const HOLD_S = 9; // seconds the card holds its resting pose after load before it starts to sway by itself
const SERIF = '"Didot", "Bodoni 72", "Bodoni MT", "Playfair Display", "Libre Bodoni", Georgia, serif';
const GROTESK = '"Inter Tight", "Inter", ui-sans-serif, system-ui, sans-serif';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// The card, in metres: 1.0 wide, 1.5 tall, 30 mm thick board with a small rounded arris.
const HX = 0.5;
const HY = 0.75;
const HT = 0.028;
const CR = 0.055;
const TW = 1024;
const TH = 1536;
// where things sit on the printed face, in texture pixels
const PH = { x: 62, y: 62, w: 900, h: 1010 };
const SEAL = { x: 820, y: 1076, r: 142 };
const toLocal = (x: number, y: number) => [((x / TW) * 2 - 1) * HX, (1 - (y / TH) * 2) * HY];
const SEAL_L = toLocal(SEAL.x, SEAL.y);
const SEAL_R = (SEAL.r / TW) * 2 * HX;
const ROSE = { x: 512, y: 640, r: 300 };
const ROSE_L = toLocal(ROSE.x, ROSE.y);
const ROSE_R = (ROSE.r / TW) * 2 * HX;

const GLSL_HEAD = `#version 300 es
precision highp float;
precision highp sampler2DArray;
const vec2 HS = vec2(${HX}, ${HY});
const float CR = ${CR};
const vec3 KEY = vec3(-2.5, 4.3, 3.1);
const vec3 KAIM = vec3(0.25, 0.0, -0.5);
const vec3 STRIP = vec3(4.2, 1.5, 0.6);
const vec3 TOP = vec3(-0.9, 6.0, 0.5);
const vec3 KICK = vec3(3.4, 0.6, -2.8);
const vec3 GOLD = vec3(1.0, 0.64, 0.2);
uniform vec3 uC, uU, uV, uN;
uniform sampler2DArray uAlb;
uniform sampler2DArray uMat;
uniform vec3 uCam, uRt, uUp, uFw;
uniform float uTan, uAspect, uShift, uFocus, uAperture, uTime;

float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) { return 0.5 * vnoise(p) + 0.25 * vnoise(p * 2.1 + 7.3) + 0.125 * vnoise(p * 4.3 + 1.7) + 0.0625 * vnoise(p * 8.9); }
float sdCard(vec2 p) { vec2 q = abs(p) - HS + CR; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - CR; }

// one rectangular lamp seen in a mirror, with edges that soften as the mirror gets rougher
float lamp(vec3 rd, vec3 c, vec2 half_, float s) {
  float d = dot(rd, c);
  if (d <= 0.02) return 0.0;
  vec3 rt = normalize(cross(vec3(0.0, 1.0, 0.0), c));
  vec3 up = cross(c, rt);
  vec2 e = half_ - abs(vec2(dot(rd, rt), dot(rd, up)) / d);
  return smoothstep(-s, s, e.x) * smoothstep(-s, s, e.y);
}
vec3 floorTint(vec2 xz) {
  vec2 q = (xz - vec2(0.2, -0.5)) / vec2(3.2, 3.0);
  return vec3(0.006, 0.026, 0.2) * (0.12 + 2.2 * exp(-dot(q, q) * 1.6));
}
// The studio as a mirror sees it: a wide softbox low on the front left, the key above it,
// a thin strip on the right, a long bank over the back, and the lit blue floor underneath.
vec3 studio(vec3 ro, vec3 rd, float s) {
  vec3 c = vec3(0.006, 0.008, 0.014);
  float front = lamp(rd, normalize(vec3(-0.88, 0.17, 0.44)), vec2(0.21, 0.46), 0.035 + s);
  vec3 fq = rd - normalize(vec3(-0.88, 0.17, 0.44));
  float bar = 1.0 - 0.8 * smoothstep(0.022 + s, 0.008, abs(rd.y - 0.32 - 0.25 * fq.x * fq.x));
  c += vec3(1.0, 0.95, 0.88) * front * bar * (0.55 + 1.9 * exp(-dot(fq, fq) * 16.0));
  c += vec3(1.0, 0.96, 0.9) * 3.2 * lamp(rd, normalize(KEY - vec3(0.0, 0.9, 0.0)), vec2(0.17, 0.17), 0.02 + s);
  c += vec3(0.9, 0.94, 1.0) * 2.6 * lamp(rd, normalize(STRIP - vec3(0.0, 0.9, 0.0)), vec2(0.05, 0.62), 0.012 + s);
  c += vec3(0.9, 0.94, 1.0) * 1.6 * lamp(rd, normalize(KICK - vec3(0.0, 0.5, 0.0)), vec2(0.03, 0.34), 0.012 + s);
  c += vec3(1.0, 0.97, 0.92) * 4.0 * lamp(rd, normalize(TOP - vec3(0.0, 0.9, 0.0)), vec2(0.1, 0.1), 0.03 + s);
  c += vec3(0.7, 0.8, 1.0) * 0.5 * lamp(rd, normalize(vec3(0.0, 0.5, -0.86)), vec2(1.1, 0.2), 0.2 + s);
  c += vec3(0.01, 0.04, 0.26) * exp(-abs(rd.y) * 9.0) * smoothstep(0.3, -0.5, rd.z) * 0.8;
  if (rd.y < 0.0) {
    vec3 p = ro + rd * (-ro.y / min(rd.y, -1e-3));
    c = mix(c, floorTint(p.xz) * 2.2 + vec3(0.004, 0.006, 0.014), smoothstep(0.0, -0.06 - s, rd.y));
  }
  return c;
}

// light landing on one side of the card
vec3 faceLight(vec3 P, vec3 n) {
  vec3 lk = KEY - P; float r2 = dot(lk, lk); lk *= inversesqrt(r2);
  vec3 c = vec3(1.0, 0.94, 0.86) * (32.0 / r2) * max(dot(n, lk), 0.0);
  c += vec3(0.8, 0.88, 1.0) * 0.22 * max(dot(n, normalize(STRIP - P)), 0.0);
  c += vec3(1.0, 0.97, 0.92) * 0.2 * max(dot(n, normalize(TOP - P)), 0.0);
  c += vec3(1.0, 0.95, 0.88) * 0.3 * max(dot(n, normalize(vec3(-0.88, 0.17, 0.44))), 0.0);
  c += mix(floorTint(P.xz) * 0.9, vec3(0.05, 0.048, 0.045), n.y * 0.5 + 0.5);
  return c;
}

// how much of a round lamp at L a point P can see past the card
float lit(vec3 P, vec3 L, float rl) {
  vec3 d = L - P;
  float dn = dot(d, uN);
  if (abs(dn) < 1e-4) return 1.0;
  float t = dot(uC - P, uN) / dn;
  if (t <= 0.0 || t >= 1.0) return 1.0;
  vec3 q = P + d * t - uC;
  float w = rl * t + 0.003;
  return smoothstep(-w, w, sdCard(vec2(dot(q, uU), dot(q, uV))));
}

vec3 tonemap(vec3 x) { x *= 0.9; return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
vec4 pack(vec3 col, float depth) {
  float coc = clamp(uAperture * (1.0 - uFocus / max(depth, 0.05)), -1.0, 1.0);
  return vec4(pow(tonemap(col), vec3(1.0 / 2.2)), 0.5 + 0.5 * coc);
}
`;

const VS_FULL = `#version 300 es
out vec2 vUv;
void main() { vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); vUv = p; gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }`;

const FS_SET = `${GLSL_HEAD}
in vec2 vUv;
out vec4 o;
void main() {
  vec2 ndc = vUv * 2.0 - 1.0;
  ndc.x -= uShift;
  vec3 rd = normalize(uFw + uRt * (ndc.x * uTan * uAspect) + uUp * (ndc.y * uTan));
  if (rd.y > -2e-3) { o = pack(studio(uCam, rd, 0.08), 80.0); return; }
  float tf = -uCam.y / rd.y;
  vec3 P = uCam + rd * tf;

  // poured lacquer: a near mirror with slow waves, wiped patches that blur the mirror, and dust
  float smudge = fbm(P.xz * 1.15 + 3.1);
  float rough = 0.004 + 0.03 * smudge * smudge + 0.006 * vnoise(P.xz * vec2(2.0, 31.0));
  vec2 wav = vec2(vnoise(P.xz * 1.9 + 11.0), vnoise(P.xz * 1.9 + 37.0)) - 0.5;
  vec3 n = normalize(vec3(wav.x * 0.016, 1.0, wav.y * 0.016));
  vec3 R = reflect(rd, n);
  float F = 0.085 + 0.915 * pow(1.0 - clamp(dot(-rd, n), 0.0, 1.0), 5.0);
  vec3 refl = studio(P, R, 0.02 + rough * 3.0);

  // the card in the mirror: one ray to its plane, softened by distance and by the smudges
  float far = 0.0, seen = 0.0;
  float dn = dot(R, uN);
  float t = dot(uC - P, uN) / dn;
  if (t > 0.0) {
    vec3 q = P + R * t - uC;
    vec2 a = vec2(dot(q, uU), dot(q, uV));
    float w = t * (0.004 + rough * 1.5);
    seen = smoothstep(w, -w, sdCard(a));
    if (seen > 0.0) {
      float side = dn < 0.0 ? 1.0 : -1.0;
      vec2 uv = clamp(a / HS, -1.0, 1.0) * 0.5 + 0.5;
      if (side < 0.0) uv.x = 1.0 - uv.x;
      float layer = side > 0.0 ? 0.0 : 1.0;
      float lod = log2(1.0 + w * 1100.0);
      vec3 alb = textureLod(uAlb, vec3(uv, layer), lod).rgb;
      vec3 m = textureLod(uMat, vec3(uv, layer), lod).rgb;
      vec3 nn = uN * side;
      vec3 Pc = P + R * t;
      vec3 cc = alb * faceLight(Pc, nn);
      cc = mix(cc, GOLD * studio(Pc, reflect(R, nn), 0.12 + rough * 3.0), m.r);
      refl = mix(refl, cc, seen);
      far = t;
    }
  }

  // light on the lacquer itself: the key through its cone, the strip, and the bank overhead, each shadowed by the card
  vec3 lk = KEY - P; float r2 = dot(lk, lk); lk *= inversesqrt(r2);
  float cone = smoothstep(0.84, 0.975, dot(-lk, normalize(KAIM - KEY)));
  vec3 dif = vec3(1.0, 0.955, 0.9) * (120.0 * (0.03 + cone) / r2) * lk.y * lit(P, KEY, 0.36);
  vec3 ls = normalize(STRIP - P);
  dif += vec3(0.8, 0.88, 1.0) * 0.5 * ls.y * lit(P, STRIP, 0.3);
  dif += vec3(0.7, 0.8, 1.0) * 0.3 * lit(P, vec3(uC.x, 7.0, uC.z - 1.0), 3.4);
  vec3 lt = TOP - P;
  dif += vec3(1.0, 0.97, 0.92) * (26.0 * lt.y / pow(dot(lt, lt), 1.5)) * lit(P, TOP, 0.2);
  vec3 alb = vec3(0.006, 0.026, 0.2) * (0.94 + 0.12 * vnoise(P.xz * 90.0));
  vec3 col = alb * dif * (1.0 - F) + refl * F;

  // the foil throws the top lamp back down as a warm patch: mirror the lamp in the card and see whether foil is in the way
  float kn = dot(TOP - uC, uN);
  vec3 dm = TOP - 2.0 * kn * uN - P;
  float tm = dot(uC - P, uN) / dot(dm, uN);
  if (tm > 0.0 && tm < 1.0 && dot(P - uC, uN) * kn > 0.0) {
    vec3 qm = P + dm * tm - uC;
    vec2 am = vec2(dot(qm, uU), dot(qm, uV));
    float wm = 0.22 * tm + 0.006;
    float inside = smoothstep(wm, -wm, sdCard(am));
    vec2 um = clamp(am / HS, -1.0, 1.0) * 0.5 + 0.5;
    if (kn < 0.0) um.x = 1.0 - um.x;
    float leaf = textureLod(uMat, vec3(um, kn > 0.0 ? 0.0 : 1.0), log2(1.0 + wm * 1100.0)).r;
    col += GOLD * (leaf * inside * 42.0 * max(dm.y, 0.0) / pow(dot(dm, dm), 1.5)) * (alb * 0.3 + vec3(0.06, 0.04, 0.014));
  }
  float dust = step(0.9992, hash(floor(P.xz * 380.0))) * smoothstep(8.0, 2.0, tf);
  col += vec3(0.5, 0.6, 0.8) * dust * (0.2 + cone) * 0.3;
  col = mix(col, vec3(0.003, 0.006, 0.02), 1.0 - exp(-max(tf - 4.6, 0.0) * 0.11));
  o = pack(col, dot(rd, uFw) * (tf + far * seen * clamp(F * 3.0, 0.0, 1.0)));
}`;

const VS_CARD = `#version 300 es
precision highp float;
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNor;
uniform vec3 uC, uU, uV, uN, uCam, uRt, uUp, uFw;
uniform float uTan, uAspect, uShift;
out vec3 vW; out vec3 vL; out vec3 vNl;
void main() {
  vW = uC + uU * aPos.x + uV * aPos.y + uN * aPos.z;
  vL = aPos; vNl = aNor;
  vec3 d = vW - uCam;
  float z = dot(d, uFw);
  gl_Position = vec4(dot(d, uRt) / (uTan * uAspect) + uShift * z, dot(d, uUp) / uTan, (z * 60.1 - 12.0) / 59.9, z);
}`;

const FS_CARD = `${GLSL_HEAD}
float glint(vec3 n, vec3 V, vec3 l) { return pow(max(dot(n, normalize(normalize(l) + V)), 0.0), 26.0); }
const vec2 SEAL = vec2(${SEAL_L[0].toFixed(5)}, ${SEAL_L[1].toFixed(5)});
const float SEAL_R = ${SEAL_R.toFixed(5)};
const vec2 ROSE = vec2(${ROSE_L[0].toFixed(5)}, ${ROSE_L[1].toFixed(5)});
const float ROSE_R = ${ROSE_R.toFixed(5)};
in vec3 vW; in vec3 vL; in vec3 vNl;
out vec4 o;
void main() {
  vec3 V = normalize(uCam - vW);
  vec3 nl = normalize(vNl);
  vec3 Ng = normalize(uU * nl.x + uV * nl.y + uN * nl.z);
  float face = smoothstep(0.75, 0.98, abs(nl.z));
  float side = vL.z > 0.0 ? 1.0 : -1.0;
  vec3 col;

  // the gilt edge: burnished leaf over the plies of the board, streaked along its length
  float along = abs(nl.x) > abs(nl.y) ? vL.y : vL.x;
  float streak = vnoise(vec2(vL.z * 520.0, along * 2.5));
  vec3 ne = normalize(Ng + uN * (streak - 0.5) * 0.35 + (uU + uV) * (vnoise(vec2(along * 40.0, vL.z * 300.0)) - 0.5) * 0.04 + (uU + uV) * (vnoise(vec2(along * 4.0, 3.0)) - 0.5) * 0.3);
  vec3 Re = reflect(-V, ne);
  float Fe = pow(1.0 - max(dot(ne, V), 0.0), 5.0);
  vec3 glints = vec3(1.0, 0.95, 0.88) * (1.5 * glint(ne, V, KEY - vW) + 1.2 * glint(ne, V, vec3(-0.88, 0.17, 0.44)) + 1.1 * glint(ne, V, TOP - vW))
    + vec3(0.9, 0.94, 1.0) * (1.3 * glint(ne, V, STRIP - vW) + 1.7 * glint(ne, V, KICK - vW));
  vec3 edge = vec3(1.0, 0.6, 0.17) * (faceLight(vW, ne) * vec3(0.25, 0.2, 0.15) + glints * 1.3) * (0.45 + 1.1 * streak) + mix(GOLD, vec3(1.0), Fe * 0.5) * studio(vW, Re, 0.12) * 0.22;
  edge *= 0.86 + 0.14 * smoothstep(0.0, 0.25, abs(fract(vL.z / ${(HT * 2).toFixed(4)} * 3.0 + 0.5) - 0.5));

  if (face > 0.0) {
    vec2 uv = vL.xy / HS * 0.5 + 0.5;
    if (side < 0.0) uv.x = 1.0 - uv.x;
    float layer = side > 0.0 ? 0.0 : 1.0;
    vec3 alb = texture(uAlb, vec3(uv, layer)).rgb;
    vec3 m = texture(uMat, vec3(uv, layer)).rgb;
    // relief pressed into the board: foil sunk by the die, the photograph in its plate mark, the seal raised
    vec2 e = vec2(1.6 / ${TW}.0, 1.6 / ${TH}.0);
    float hx = texture(uMat, vec3(uv + vec2(e.x, 0.0), layer), 0.7).g - texture(uMat, vec3(uv - vec2(e.x, 0.0), layer), 0.7).g;
    float hy = texture(uMat, vec3(uv + vec2(0.0, e.y), layer), 0.7).g - texture(uMat, vec3(uv - vec2(0.0, e.y), layer), 0.7).g;
    vec2 g = vec2(hx, hy) * 5.5 * (1.0 - 0.5 * smoothstep(0.08, 0.6, m.r)) * clamp(1.6 / (fwidth(uv.x) * ${TW}.0), 0.0, 1.0);
    // cotton paper has a tooth; foil is smooth but never quite flat
    vec2 pp = vL.xy * vec2(side, 1.0);
    vec2 tooth = vec2(fbm(pp * 150.0), fbm(pp * 150.0 + 31.0)) - 0.47;
    vec2 wave = vec2(fbm(pp * 4.0 + 3.0), fbm(pp * 4.0 + 17.0)) - 0.47;
    float foil = smoothstep(0.08, 0.6, m.r);
    float gloss = m.b;
    vec2 tiltP = -g + tooth * mix(0.17, 0.015, max(foil, gloss)) + wave * mix(0.012, 0.03, foil);

    // the seal: a fluted ring of foil, every flute leaning a different way round the circle
    vec2 sp = pp - (side > 0.0 ? SEAL : ROSE);
    float sr = length(sp) / (side > 0.0 ? SEAL_R : ROSE_R);
    float inSeal = smoothstep(0.9, 0.87, sr) * smoothstep(0.37, 0.4, sr) * foil;
    vec2 rad = sp / max(length(sp), 1e-4);
    float ang = atan(sp.y, sp.x);
    float count = side > 0.0 ? 36.0 : 48.0;
    float flute = sin(ang * count + sr * 9.0) * clamp(6.2832 * length(sp) / (count * 4.5 * fwidth(pp.x)) - 0.3, 0.0, 1.0);
    tiltP += vec2(-rad.y, rad.x) * flute * 0.3 * inSeal;
    vec2 tilt = vec2(tiltP.x * side, tiltP.y);

    vec3 N = normalize(Ng + (uU * tilt.x + uV * tilt.y));
    vec3 R = reflect(-V, N);
    float nv = max(dot(N, V), 0.0);
    float fres = pow(1.0 - nv, 5.0);

    // paper and ink
    vec3 light = faceLight(vW, N);
    float fibre = 0.92 + 0.16 * fbm(pp * 60.0) - 0.06 * vnoise(pp * 520.0);
    col = alb * mix(fibre, 1.0, gloss) * light;
    // the photograph carries a satin varnish; the paper only a faint sheen
    col += studio(vW, R, mix(0.5, 0.05, gloss)) * (0.04 + 0.96 * fres) * mix(0.2, 0.2, gloss);
    // hot foil: a metal mirror, warm, with the grain of the paper pressed through it
    vec3 fc = mix(GOLD, vec3(1.0), fres * 0.6) * studio(vW, R, 0.05 + 0.03 * inSeal) * 0.45;
    fc += GOLD * GOLD * light * 0.08;
    fc *= 0.9 + 0.2 * vnoise(pp * 420.0);
    col = mix(col, fc, foil);
    col = mix(edge, col, face);
  } else col = edge;
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
  float s0 = c0.a * 2.0 - 1.0;
  float coc0 = abs(s0);
  vec3 lin0 = pow(c0.rgb, vec3(2.2));
  float w0 = 1.0 / (1.03 - max(lin0.r, max(lin0.g, lin0.b)));
  vec3 acc = lin0 * w0; float wsum = w0;
  float rot = 6.2832 * ign(gl_FragCoord.xy);
  // a disc of taps for the out-of-focus blur, each one only counted if its own blur reaches this pixel
  for (int k = 1; k < 44; k++) {
    float r = k < 32 ? sqrt(float(k) / 32.0) * uMaxR : sqrt(float(k - 31) / 12.0) * min(uMaxR, 3.0);
    float a = float(k) * 2.39996 + rot;
    vec4 s = texture(uScene, vUv + vec2(cos(a), sin(a)) * r * uPx);
    float sc = s.a * 2.0 - 1.0;
    float cs = abs(sc);
    if (sc > s0) cs = min(cs, coc0 * 1.6 + 0.02);
    vec3 lin = pow(s.rgb, vec3(2.2));
    float w = smoothstep(r - 1.0, r + 1.0, cs * uMaxR) / (1.03 - max(lin.r, max(lin.g, lin.b)));
    acc += lin * w; wsum += w;
  }
  o = vec4(pow(acc / wsum, vec3(1.0 / 2.2)), coc0);
}`;

const FS_OUT = `#version 300 es
precision highp float;
uniform sampler2D uScene;
uniform vec2 uPx;
uniform float uTime;
in vec2 vUv;
out vec4 o;
float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
void main() {
  vec4 c = texture(uScene, vUv);
  float r = clamp(c.a * 4.0, 0.0, 1.0) * 1.4;
  vec3 col = c.rgb * 4.0;
  vec3 glow = vec3(0.0);
  float rot = 6.2832 * ign(gl_FragCoord.xy);
  for (int k = 0; k < 8; k++) {
    float a = float(k) * 0.7854;
    col += texture(uScene, vUv + vec2(cos(a), sin(a)) * r * (k % 2 == 0 ? 1.0 : 1.9) * uPx).rgb;
  }
  col /= 12.0;
  // halation: only the hottest foil and gilt bleeds a little into its surroundings
  for (int k = 0; k < 16; k++) {
    float a = float(k) * 2.39996 + rot;
    float d = 3.0 + 22.0 * sqrt(float(k) / 16.0);
    vec3 s = texture(uScene, vUv + vec2(cos(a), sin(a)) * d * uPx).rgb;
    glow += s * smoothstep(0.86, 1.0, min(s.r, s.g));
  }
  col += glow / 16.0 * vec3(0.36, 0.3, 0.2);
  vec2 q = vUv - 0.5;
  col *= 1.0 - 0.75 * dot(q, q);
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

/** The board as triangles: two faces, a flat side, and a quarter-round arris between them. Position + normal. */
function cardMesh() {
  const SEG = 9;
  const B = 0.0042;
  const ring = (d: number, z: number, tilt: number, nz: number) => {
    const out: number[][] = [];
    for (let k = 0; k < 4; k++) {
      const cx = (k === 0 || k === 3 ? 1 : -1) * (HX - CR);
      const cy = (k < 2 ? 1 : -1) * (HY - CR);
      for (let j = 0; j <= SEG; j++) {
        const a = ((k + j / SEG) * Math.PI) / 2;
        const dx = Math.cos(a), dy = Math.sin(a);
        out.push([cx + (CR - d) * dx, cy + (CR - d) * dy, z, dx * tilt, dy * tilt, nz]);
      }
    }
    return out;
  };
  const rings: number[][][] = [];
  for (const sgn of [1, -1]) {
    const order = sgn > 0 ? [0, 30, 60, 90] : [90, 60, 30, 0];
    for (const deg of order) {
      const p = (deg * Math.PI) / 180;
      rings.push(ring(B * (1 - Math.sin(p)), sgn * (HT - B * (1 - Math.cos(p))), Math.sin(p), sgn * Math.cos(p)));
    }
  }
  const v: number[] = [];
  const M = rings[0].length;
  for (let r = 0; r < rings.length - 1; r++) {
    for (let i = 0; i < M; i++) {
      const a = rings[r][i], b = rings[r][(i + 1) % M], c = rings[r + 1][i], d = rings[r + 1][(i + 1) % M];
      v.push(...a, ...b, ...c, ...b, ...d, ...c);
    }
  }
  for (const [r, z] of [[0, 1], [rings.length - 1, -1]]) {
    for (let i = 0; i < M; i++) v.push(0, 0, z * HT, 0, 0, z, ...rings[r][i], ...rings[r][(i + 1) % M]);
  }
  return new Float32Array(v);
}

type Channel = "alb" | "foil" | "height" | "gloss";

/** Draw one side of the card into one channel: its printed colour, where the foil is, how high the surface stands, where the varnish is. */
function paintSide(ctx: CanvasRenderingContext2D, side: number, ch: Channel, photo: HTMLImageElement | null) {
  const PAPER = "#f4ead6";
  const BLUE = "#122a78";
  const INK = "#1d1b18";
  const LEAF = "#b18a4c";
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = { alb: side ? BLUE : PAPER, foil: "#000", height: "#808080", gloss: "#000" }[ch];
  ctx.fillRect(0, 0, TW, TH);
  const put = (c: Partial<Record<Channel, string>>, draw: () => void) => {
    const col = c[ch];
    if (!col) return;
    ctx.fillStyle = col;
    ctx.strokeStyle = col;
    draw();
  };
  const tracked = (s: string, x: number, y: number, font: string, gap: number, align: "left" | "right" | "center" = "left") => {
    ctx.font = font;
    ctx.textAlign = "left";
    const widths = [...s].map((ch2) => ctx.measureText(ch2).width + gap);
    const total = widths.reduce((a, b) => a + b, 0) - gap;
    let cx = align === "left" ? x : align === "right" ? x - total : x - total / 2;
    [...s].forEach((ch2, i) => {
      ctx.fillText(ch2, cx, y);
      cx += widths[i];
    });
  };
  const foil = { alb: LEAF, foil: "#fff", height: "#6c6c6c" };
  const ink = { alb: side ? "#e6dfcf" : INK, height: "#757575" };
  // a foil medal: a domed disc with raised rings and the monogram standing in the middle
  const seal = (cx: number, cy: number, r: number, px: number) => {
    put({ alb: "#8b6a36", foil: "#fff", gloss: "#000" }, () => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 7);
      ctx.fill();
    });
    if (ch === "height") {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      g.addColorStop(0, "#c4c4c4");
      g.addColorStop(0.8, "#b0b0b0");
      g.addColorStop(1, "#9c9c9c");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 7);
      ctx.fill();
      ctx.strokeStyle = "#dedede";
      ctx.lineWidth = Math.max(5, r * 0.03);
      for (const rr of [r * 0.93, r * 0.37]) {
        ctx.beginPath();
        ctx.arc(cx, cy, rr, 0, 7);
        ctx.stroke();
      }
    }
    put({ alb: "#5e4620", height: "#e8e8e8" }, () => {
      ctx.font = `italic ${px}px ${SERIF}`;
      ctx.textAlign = "center";
      ctx.fillText(card.house[0], cx - px * 0.02, cy + px * 0.33);
    });
  };
  ctx.textBaseline = "alphabetic";

  if (side === 0) {
    // the photograph, tipped into a plate mark
    put({ alb: card.photo.tone, height: "#484848", gloss: "#fff" }, () => ctx.fillRect(PH.x, PH.y, PH.w, PH.h));
    if (ch === "alb") {
      ctx.save();
      ctx.beginPath();
      ctx.rect(PH.x, PH.y, PH.w, PH.h);
      ctx.clip();
      if (photo) {
        const s = Math.max(PH.w / photo.naturalWidth, PH.h / photo.naturalHeight);
        const w = photo.naturalWidth * s, h = photo.naturalHeight * s;
        ctx.drawImage(photo, PH.x + (PH.w - w) / 2, PH.y + (PH.h - h) * card.photo.focusY, w, h);
      } else {
        const g = ctx.createLinearGradient(0, PH.y, 0, PH.y + PH.h);
        g.addColorStop(0, "#16337f");
        g.addColorStop(1, card.photo.tone);
        ctx.fillStyle = g;
        ctx.fillRect(PH.x, PH.y, PH.w, PH.h);
      }
      // the wall of the plate mark shades the picture's edge
      for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = `rgba(4,8,24,${0.2 - i * 0.035})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(PH.x + 1 + i * 2, PH.y + 1 + i * 2, PH.w - 2 - i * 4, PH.h - 2 - i * 4);
      }
      ctx.restore();
    }
        put(ink, () => tracked(card.line, PH.x + 2, 1148, `600 25px ${GROTESK}`, 8));
    put(foil, () => {
      ctx.font = `italic 238px ${SERIF}`;
      ctx.textAlign = "left";
      ctx.fillText(card.house, PH.x - 12, 1362);
    });
    put(foil, () => tracked(card.number, PH.x + PH.w, 1362, `500 30px ${GROTESK}`, 5, "right"));
    put(foil, () => ctx.fillRect(PH.x, 1403, PH.w, 4));
    put(ink, () => {
      tracked(card.venue, PH.x + 2, 1462, `600 22px ${GROTESK}`, 6);
      tracked(card.admit, PH.x + PH.w, 1462, `600 22px ${GROTESK}`, 6, "right");
    });
    // the seal, stamped half on the photograph and half on the paper
    seal(SEAL.x, SEAL.y, SEAL.r, 96);
  } else {
    // reverse: cobalt stock, a foil keyline, a large fluted medal, and the seat
    put(foil, () => {
      ctx.lineWidth = 4;
      ctx.strokeRect(62, 62, TW - 124, TH - 124);
    });
    put(foil, () => tracked(card.number, TW / 2, 172, `500 30px ${GROTESK}`, 6, "center"));
    seal(ROSE.x, ROSE.y, ROSE.r, 210);
    put(foil, () => {
      ctx.font = `italic 104px ${SERIF}`;
      ctx.textAlign = "center";
      ctx.fillText(card.house, TW / 2, 1096);
    });
    put(foil, () => ctx.fillRect(140, 1150, TW - 280, 4));
    card.seat.forEach((s, i) => {
      const x = 140 + ((TW - 280) / 3) * (i + 0.5);
      put(ink, () => tracked(s.label, x, 1214, `600 22px ${GROTESK}`, 7, "center"));
      put(foil, () => {
        ctx.font = `104px ${SERIF}`;
        ctx.textAlign = "center";
        ctx.fillText(s.value, x, 1330);
      });
    });
    put(foil, () => ctx.fillRect(140, 1370, TW - 280, 4));
    put(ink, () => tracked(card.small, TW / 2, 1430, `600 19px ${GROTESK}`, 5, "center"));
  }
}

type Sim = {
  yaw: number; vyaw: number; pitch: number; vpitch: number; flip: number; vflip: number; goal: number;
  px: number; py: number; inside: boolean; press: number; pressGoal: number; focus: number; t0: number; dirty: boolean;
};

export default function GiltEdgedShowCard() {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [side, setSide] = useState(0);
  const [mode, setMode] = useState<"pending" | "gl" | "still">("pending");
  const sim = useRef<Sim>({ yaw: 0, vyaw: 0, pitch: 0, vpitch: 0, flip: 0, vflip: 0, goal: 0, px: 0, py: 0, inside: false, press: 0, pressGoal: 0, focus: 4, t0: 0, dirty: true });

  const turn = useCallback(() => {
    const s = sim.current;
    s.goal += 1;
    s.vflip -= 2.4; // a small wind-up the other way before it goes
    s.dirty = true;
    setSide(((s.goal % 2) + 2) % 2);
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
    let progSet: WebGLProgram, progCard: WebGLProgram, progLens: WebGLProgram, progOut: WebGLProgram;
    try {
      progSet = program(gl, VS_FULL, FS_SET);
      progCard = program(gl, VS_CARD, FS_CARD);
      progLens = program(gl, VS_FULL, FS_LENS);
      progOut = program(gl, VS_FULL, FS_OUT);
    } catch {
      setMode("still");
      return;
    }
    setMode("gl");

    // two array textures, a layer per side: printed colour (sRGB) and foil / height / varnish masks
    const levels = Math.floor(Math.log2(TH)) + 1;
    const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
    const makeTex = (unit: number, format: number) => {
      const t = gl.createTexture();
      gl.activeTexture(unit);
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, t);
      gl.texStorage3D(gl.TEXTURE_2D_ARRAY, levels, format, TW, TH, 2);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      if (aniso) gl.texParameterf(gl.TEXTURE_2D_ARRAY, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 8);
      return t;
    };
    const albTex = makeTex(gl.TEXTURE0, gl.SRGB8_ALPHA8);
    const matTex = makeTex(gl.TEXTURE1, gl.RGBA8);
    const scratch = document.createElement("canvas");
    const mix = document.createElement("canvas");
    scratch.width = mix.width = TW;
    scratch.height = mix.height = TH;
    const sctx = scratch.getContext("2d")!;
    const mctx = mix.getContext("2d")!;
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    const push = (unit: number, tex: WebGLTexture | null, layer: number, src: HTMLCanvasElement) => {
      gl.activeTexture(unit);
      gl.bindTexture(gl.TEXTURE_2D_ARRAY, tex);
      gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, layer, TW, TH, 1, gl.RGBA, gl.UNSIGNED_BYTE, src);
      gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
    };
    const paint = (photo: HTMLImageElement | null, withMasks: boolean) => {
      for (let layer = 0; layer < 2; layer++) {
        paintSide(sctx, layer, "alb", photo);
        push(gl.TEXTURE0, albTex, layer, scratch);
        if (!withMasks) continue;
        // three grey drawings become the red, green and blue of one mask texture
        mctx.globalCompositeOperation = "source-over";
        mctx.fillStyle = "#000";
        mctx.fillRect(0, 0, TW, TH);
        for (const [ch, tint] of [["foil", "#f00"], ["height", "#0f0"], ["gloss", "#00f"]] as const) {
          paintSide(sctx, layer, ch, null);
          sctx.globalCompositeOperation = "multiply";
          sctx.fillStyle = tint;
          sctx.fillRect(0, 0, TW, TH);
          mctx.globalCompositeOperation = "lighter";
          mctx.drawImage(scratch, 0, 0);
        }
        push(gl.TEXTURE1, matTex, layer, mix);
      }
      s.dirty = true;
    };
    paint(null, true);
    let alive = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (alive) paint(img, false);
    };
    img.src = card.photo.src;

    const mesh = cardMesh();
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, mesh, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
    gl.bindVertexArray(null);
    const emptyVao = gl.createVertexArray();

    // multisampled scene, resolved to a texture for the lens pass (colour, with blur size in alpha)
    const msFbo = gl.createFramebuffer();
    const msColor = gl.createRenderbuffer();
    const msDepth = gl.createRenderbuffer();
    const resFbo = gl.createFramebuffer();
    const resTex = gl.createTexture();
    const lensFbo = gl.createFramebuffer();
    const lensTex = gl.createTexture();
    let W = 0, H = 0, scale = Math.min(window.devicePixelRatio || 1, 2);
    const samples = Math.min(4, gl.getParameter(gl.MAX_SAMPLES));
    const resize = () => {
      const cw = wrap.clientWidth, ch = wrap.clientHeight;
      let k = scale;
      if (cw * ch * k * k > 2.1e6) k = Math.sqrt(2.1e6 / (cw * ch));
      const w = Math.max(2, Math.round(cw * k)), h = Math.max(2, Math.round(ch * k));
      if (w === W && h === H) return;
      W = w;
      H = h;
      canvas.width = W;
      canvas.height = H;
      gl.bindRenderbuffer(gl.RENDERBUFFER, msColor);
      gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.RGBA8, W, H);
      gl.bindRenderbuffer(gl.RENDERBUFFER, msDepth);
      gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.DEPTH_COMPONENT16, W, H);
      gl.bindFramebuffer(gl.FRAMEBUFFER, msFbo);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, msColor);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, msDepth);
      for (const [unit, t, f] of [[gl.TEXTURE2, resTex, resFbo], [gl.TEXTURE3, lensTex, lensFbo]] as const) {
        gl.activeTexture(unit);
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
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
    const TAN = Math.tan((19 * Math.PI) / 180);
    const LEAN = 0.36;
    const REST_YAW = -0.55;
    const pose = { c: [0, 0, 0], u: [1, 0, 0], v: [0, 1, 0], n: [0, 0, 1] };

    const shared = (p: WebGLProgram, cam: number[], rt: number[], up: number[], fw: number[], shift: number, t: number) => {
      gl.useProgram(p);
      gl.uniform3fv(U(p, "uC"), pose.c);
      gl.uniform3fv(U(p, "uU"), pose.u);
      gl.uniform3fv(U(p, "uV"), pose.v);
      gl.uniform3fv(U(p, "uN"), pose.n);
      gl.uniform1i(U(p, "uAlb"), 0);
      gl.uniform1i(U(p, "uMat"), 1);
      gl.uniform3fv(U(p, "uCam"), cam);
      gl.uniform3fv(U(p, "uRt"), rt);
      gl.uniform3fv(U(p, "uUp"), up);
      gl.uniform3fv(U(p, "uFw"), fw);
      gl.uniform1f(U(p, "uTan"), TAN);
      gl.uniform1f(U(p, "uAspect"), W / H);
      gl.uniform1f(U(p, "uShift"), shift);
      gl.uniform1f(U(p, "uFocus"), s.focus);
      gl.uniform1f(U(p, "uAperture"), 1.5);
      gl.uniform1f(U(p, "uTime"), t);
    };

    const draw = (t: number) => {
      // the card's pose: spin about its own upright, then lean back, with a little roll from the speed of the turn
      const a = REST_YAW + s.yaw + s.flip * Math.PI;
      const lean = LEAN - s.pitch;
      const roll = clamp(-s.vyaw * 0.012 - s.vflip * 0.006, -0.08, 0.08);
      const rot = (x: number, y: number, z: number) => {
        const x1 = x * Math.cos(roll) - y * Math.sin(roll), y1 = x * Math.sin(roll) + y * Math.cos(roll);
        const x2 = x1 * Math.cos(a) + z * Math.sin(a), z2 = -x1 * Math.sin(a) + z * Math.cos(a);
        return [x2, y1 * Math.cos(lean) + z2 * Math.sin(lean), -y1 * Math.sin(lean) + z2 * Math.cos(lean)];
      };
      pose.u = rot(1, 0, 0);
      pose.v = rot(0, 1, 0);
      pose.n = rot(0, 0, 1);
      const spin = Math.sin(clamp(Math.abs(s.flip - Math.round(s.flip)), 0, 0.5) * Math.PI);
      const bob = reduce ? 0 : 0.012 * Math.sin(Math.max(t - HOLD_S, 0) * 0.9);
      pose.c = [0, 0.83 + bob + 0.05 * spin * spin - 0.05 * s.press, 0];

      const aspect = W / H;
      const dist = Math.max(3.5, 0.72 / (TAN * aspect) + 0.6);
      const el = 0.36;
      const drift = reduce ? 0 : 1;
      const cam = [drift * 0.07 * Math.sin(t * 0.27), 0.7 + Math.sin(el) * dist + drift * 0.02 * Math.sin(t * 0.21 + 1), Math.cos(el) * dist];
      let fw = [0 - cam[0], 0.7 - cam[1], 0 - cam[2]];
      const fl = Math.hypot(fw[0], fw[1], fw[2]);
      fw = fw.map((v) => v / fl);
      let rt = [-fw[2], 0, fw[0]];
      const rl = Math.hypot(rt[0], rt[2]);
      rt = rt.map((v) => v / rl);
      const up = [rt[1] * fw[2] - rt[2] * fw[1], rt[2] * fw[0] - rt[0] * fw[2], rt[0] * fw[1] - rt[1] * fw[0]];
      s.focus = (pose.c[0] - cam[0]) * fw[0] + (pose.c[1] - cam[1]) * fw[1] + (pose.c[2] - cam[2]) * fw[2];
      const shift = aspect > 1.25 ? 0.13 : 0;

      gl.bindFramebuffer(gl.FRAMEBUFFER, msFbo);
      gl.viewport(0, 0, W, H);
      gl.disable(gl.DEPTH_TEST);
      gl.depthMask(false);
      shared(progSet, cam, rt, up, fw, shift, t);
      gl.bindVertexArray(emptyVao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.enable(gl.DEPTH_TEST);
      gl.depthMask(true);
      gl.clear(gl.DEPTH_BUFFER_BIT);
      shared(progCard, cam, rt, up, fw, shift, t);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, mesh.length / 6);
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, msFbo);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, resFbo);
      gl.blitFramebuffer(0, 0, W, H, 0, 0, W, H, gl.COLOR_BUFFER_BIT, gl.NEAREST);
      gl.bindFramebuffer(gl.FRAMEBUFFER, lensFbo);
      gl.disable(gl.DEPTH_TEST);
      gl.useProgram(progLens);
      gl.uniform1i(U(progLens, "uScene"), 2);
      gl.uniform2f(U(progLens, "uPx"), 1 / W, 1 / H);
      gl.uniform1f(U(progLens, "uMaxR"), H * 0.011);
      gl.bindVertexArray(emptyVao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(progOut);
      gl.uniform1i(U(progOut, "uScene"), 3);
      gl.uniform2f(U(progOut, "uPx"), 1 / W, 1 / H);
      gl.uniform1f(U(progOut, "uTime"), reduce ? 0 : t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const physics = (dt: number, t: number) => {
      // with nobody steering, the card turns slowly through the softbox so the foil comes alight and fades
      const wake = clamp((t - HOLD_S) / 3, 0, 1);
      const idle = (s.inside ? 0.25 : 1) * wake * wake * (3 - 2 * wake);
      const wantYaw = (s.inside ? s.px * TILT : 0) + idle * 0.15 * Math.sin((t - HOLD_S) * 0.74);
      const wantPitch = (s.inside ? s.py * TILT * 0.5 : 0) + idle * 0.05 * Math.sin((t - HOLD_S) * 0.53);
      s.vyaw += (SPRING * (wantYaw - s.yaw) - DAMPING * s.vyaw) * dt;
      s.yaw += s.vyaw * dt;
      s.vpitch += (SPRING * (wantPitch - s.pitch) - DAMPING * s.vpitch) * dt;
      s.pitch += s.vpitch * dt;
      s.vflip += (FLIP_SPRING * (s.goal - s.flip) - FLIP_DAMPING * s.vflip) * dt;
      s.flip += s.vflip * dt;
      s.press += (s.pressGoal - s.press) * Math.min(1, dt * 18);
    };

    let raf = 0, visible = true, last = performance.now(), slow = 0, frames = 0;
    s.t0 = last;
    const tick = (now: number) => {
      const real = now - last;
      const dt = Math.min(0.05, real / 1000);
      last = now;
      const t = (now - s.t0) / 1000;
      if (reduce) {
        if (s.flip !== s.goal) s.dirty = true;
        s.flip = s.goal;
        s.vflip = 0;
      } else {
        const sub = Math.max(1, Math.ceil(dt / 0.006));
        for (let i = 0; i < sub; i++) physics(dt / sub, t);
      }
      if (!reduce || s.dirty) {
        draw(reduce ? 0 : t);
        s.dirty = false;
        // measure, do not guess: if frames run long, render fewer pixels
        if (!reduce && ++frames > 20) {
          slow = slow * 0.92 + (real > 24 ? 1 : 0) * 0.08;
          if (slow > 0.6 && scale > 0.6) {
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

    let first: number[] | null = null;
    const move = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect();
      s.px = clamp(((e.clientX - r.left) / r.width) * 2 - 1.1, -1, 1);
      s.py = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
      // a pointer that is merely resting over the stage does not steer: it has to travel first
      if (first === null) first = [e.clientX, e.clientY];
      const moved = Math.hypot(e.clientX - first[0], e.clientY - first[1]) > 6;
      if (moved) first = [-1e6, -1e6];
      s.inside = moved && (e.pointerType === "mouse" || s.pressGoal > 0);
    };
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      s.pressGoal = 1;
      move(e);
    };
    const up = () => {
      if (s.pressGoal > 0) turn();
      s.pressGoal = 0;
    };
    const leave = () => {
      s.inside = false;
      s.pressGoal = 0;
    };
    wrap.addEventListener("pointermove", move);
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointerup", up);
    wrap.addEventListener("pointerleave", leave);
    canvas.addEventListener("pointercancel", leave);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      wrap.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointerup", up);
      wrap.removeEventListener("pointerleave", leave);
      canvas.removeEventListener("pointercancel", leave);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [reduce, turn]);

  const onKey = (e: React.KeyboardEvent) => {
    const s = sim.current;
    const nudge = (dx: number, dy: number) => {
      e.preventDefault();
      s.inside = true;
      s.px = clamp(s.px + dx, -1, 1);
      s.py = clamp(s.py + dy, -1, 1);
    };
    if (e.key === "ArrowLeft") nudge(-0.25, 0);
    else if (e.key === "ArrowRight") nudge(0.25, 0);
    else if (e.key === "ArrowUp") nudge(0, -0.25);
    else if (e.key === "ArrowDown") nudge(0, 0.25);
    else if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) {
      e.preventDefault();
      turn();
    }
  };

  const gold = "linear-gradient(100deg, #7a5a22 0%, #f6dc9a 38%, #b88a3a 62%, #f1d28a 100%)";

  return (
    <section className="relative overflow-hidden bg-[#050b24]">
      <div
        ref={wrapRef}
        role="group"
        aria-label="A show ticket printed on thick card with gold foil. Arrow keys tilt it under the light, Enter turns it over."
        tabIndex={0}
        onKeyDown={onKey}
        onBlur={() => (sim.current.inside = false)}
        className="relative h-[620px] w-full select-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70 sm:h-[780px]"
      >
        <canvas ref={canvasRef} aria-hidden="true" className={`absolute inset-0 h-full w-full cursor-pointer touch-pan-y ${mode === "still" ? "hidden" : ""}`} />

        {/* the same card laid out with plain elements, for browsers without WebGL 2 */}
        {mode === "still" && (
          <div className="absolute inset-0" style={{ background: "radial-gradient(52% 44% at 56% 58%, #2a55d6 0%, #12297a 42%, #050b24 100%)", perspective: "1600px" }}>
            <style>{`@keyframes gilt-edged-show-card-sway { from { transform: translateX(-50%) rotateX(8deg) rotateY(-22deg); } to { transform: translateX(-50%) rotateX(5deg) rotateY(-8deg); } } .gilt-edged-show-card-sway { animation: gilt-edged-show-card-sway 5s ease-in-out infinite alternate; } @media (prefers-reduced-motion: reduce) { .gilt-edged-show-card-sway { animation: none; } }`}</style>
            <div className="gilt-edged-show-card-sway absolute left-1/2 top-[13%] h-[62%] sm:left-[56%]" style={{ aspectRatio: "2 / 3", transform: "translateX(-50%) rotateX(8deg) rotateY(-16deg)", transformStyle: "preserve-3d" }}>
              <div aria-hidden="true" className="absolute -bottom-[16%] left-[18%] h-[14%] w-full rounded-[50%] bg-black/60 blur-2xl" />
              <div className="absolute inset-0 flex flex-col rounded-[14px] bg-[#f1ebde] p-[6%] shadow-[5px_0_0_#c9a35a,6px_2px_0_#8a6a2c,0_40px_80px_rgba(0,0,0,0.55)]">
                {side === 0 ? (
                  <>
                    <img src={card.photo.src} alt={card.photo.alt} width={1000} height={1500} className="min-h-0 w-full flex-1 object-cover object-top shadow-[inset_0_0_0_1px_rgba(0,0,0,0.3)]" style={{ background: card.photo.tone }} />
                    <p className="mt-[5%] bg-clip-text text-[clamp(34px,7vw,64px)] italic leading-none text-transparent" style={{ fontFamily: SERIF, backgroundImage: gold, letterSpacing: "-0.03em" }}>
                      {card.house}
                    </p>
                    <p className="mt-[4%] flex justify-between border-t border-[#b18a4c] pt-[3%] text-[8px] font-semibold uppercase tracking-[0.24em] text-[#1d1b18] sm:text-[9px]" style={{ fontFamily: GROTESK }}>
                      <span>{card.line}</span>
                      <span>{card.admit}</span>
                    </p>
                  </>
                ) : (
                  <div className="flex h-full flex-col items-center justify-between border border-[#b18a4c] p-[8%] text-center">
                    <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[#8a6a2c]" style={{ fontFamily: GROTESK }}>{card.number}</p>
                    <p className="bg-clip-text text-[clamp(40px,8vw,72px)] italic leading-none text-transparent" style={{ fontFamily: SERIF, backgroundImage: gold }}>{card.house}</p>
                    <dl className="grid w-full grid-cols-3 border-y border-[#b18a4c] py-[6%]">
                      {card.seat.map((x) => (
                        <div key={x.label}>
                          <dt className="text-[8px] font-semibold uppercase tracking-[0.24em] text-[#1d1b18]" style={{ fontFamily: GROTESK }}>{x.label}</dt>
                          <dd className="mt-1 text-[clamp(22px,4vw,38px)] leading-none text-[#8a6a2c]" style={{ fontFamily: SERIF }}>{x.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-baseline justify-between p-5 text-white sm:p-9">
          <p className="text-[26px] italic leading-none sm:text-[30px]" style={{ fontFamily: SERIF, letterSpacing: "-0.03em" }}>
            {card.house}
          </p>
          <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-white/70 sm:text-[11px]" style={{ fontFamily: GROTESK }}>
            <span className="hidden sm:inline">Move to tilt, press to turn</span>
            <span className="sm:hidden">Tap to turn</span>
          </p>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-9">
          <p aria-live="polite" className="text-white">
            <span className="block text-[11px] font-medium uppercase tracking-[0.28em] text-white/75" style={{ fontFamily: GROTESK }}>
              <span className="tabular-nums text-white">{`0${side + 1}`}</span>
              <span className="mx-2 text-white/40">/</span>
              <span className="tabular-nums">02</span>
              <span className="ml-4">{sides[side].tag}</span>
            </span>
            <span className="mt-2 block text-[40px] italic leading-[0.92] sm:text-[84px]" style={{ fontFamily: SERIF, letterSpacing: "-0.04em" }}>
              {sides[side].title}
            </span>
            <span className="sr-only">{side === 0 ? `. ${card.photo.alt}` : `. ${card.seat.map((x) => `${x.label} ${x.value}`).join(", ")}`}</span>
          </p>
          <button
            type="button"
            onClick={turn}
            aria-pressed={side === 1}
            className="pointer-events-auto inline-flex h-11 items-center gap-2.5 rounded-full border border-white/25 bg-black/30 pl-4 pr-5 text-[12px] font-medium uppercase tracking-[0.2em] text-white backdrop-blur-sm transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            style={{ fontFamily: GROTESK }}
          >
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 10a6 6 0 0 1 10.6-3.8M16 10a6 6 0 0 1-10.6 3.8M14.8 3v3.4h-3.4M5.2 17v-3.4h3.4" />
            </svg>
            Turn over
          </button>
        </div>
      </div>
    </section>
  );
}
