import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useReducedMotion } from "framer-motion";

// The words the piece plays through by itself until a visitor types one.
const WORDS = ["LIQUID", "CHROME", "MOLTEN"];
const MAX_LETTERS = 8;
// Interface type only. The chrome word never touches a font: see GLYPHS.
const FACE = '"Inter Tight", "Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
/*
 * The typeface, drawn here so every device makes the same letters. Each glyph is the centre
 * line of a round-ended stroke: [advance width, SVG path]. The box is 74 units tall (0 is the
 * top of the centre line, 74 the bottom) and the stroke is STEM units thick, so a capital is
 * 74 + STEM = 100 units high.
 */
const STEM = 26;
const GAP = 9;
const O = "M37 0A37 37 0 1 0 37 74A37 37 0 1 0 37 0";
const GLYPHS: Record<string, [number, string]> = {
  A: [62, "M0 74L31 0L62 74M13 50L49 50"],
  B: [50, "M0 0L0 74M0 0L28 0A18 18 0 0 1 28 36L0 36M28 36L31 36A19 19 0 0 1 31 74L0 74"],
  C: [64, "M63 10.7A37 37 0 1 0 63 63.3"],
  D: [56, "M0 0L0 74L19 74A37 37 0 0 0 19 0Z"],
  E: [44, "M44 0L0 0L0 74L44 74M0 37L38 37"],
  F: [44, "M44 0L0 0L0 74M0 37L36 37"],
  G: [74, "M63 10.7A37 37 0 1 0 74 37L42 37"],
  H: [54, "M0 0L0 74M54 0L54 74M0 37L54 37"],
  I: [0, "M0 0L0 74"],
  J: [40, "M40 0L40 54A20 20 0 0 1 0 54"],
  K: [52, "M0 0L0 74M50 0L0 44M18 30L52 74"],
  L: [42, "M0 0L0 74L42 74"],
  M: [72, "M0 74L0 0L36 52L72 0L72 74"],
  N: [56, "M0 74L0 0L56 74L56 0"],
  O: [74, O],
  P: [48, "M0 74L0 0L27 0A20 20 0 0 1 27 40L0 40"],
  Q: [74, O + "M58 58L75 79"],
  R: [50, "M0 74L0 0L27 0A20 20 0 0 1 27 40L0 40M24 40L50 74"],
  S: [46, "M44 12C40 2 32 0 24 0C10 0 3 9 3 19C3 30 12 34 24 37C36 40 45 44 45 55C45 65 38 74 24 74C14 74 5 70 1 60"],
  T: [54, "M0 0L54 0M27 0L27 74"],
  U: [54, "M0 0L0 47A27 27 0 0 0 54 47L54 0"],
  V: [60, "M0 0L30 74L60 0"],
  W: [88, "M0 0L22 74L44 14L66 74L88 0"],
  X: [54, "M0 0L54 74M54 0L0 74"],
  Y: [58, "M0 0L29 38L58 0M29 38L29 74"],
  Z: [50, "M0 0L50 0L0 74L50 74"],
  "0": [50, "M25 0A25 37 0 1 0 25 74A25 37 0 1 0 25 0"],
  "1": [22, "M0 14L22 0L22 74"],
  "2": [48, "M2 18A22 20 0 1 1 40 34L0 74L48 74"],
  "3": [46, "M3 9C10 2 16 0 24 0C36 0 44 8 44 18C44 30 34 37 20 37C36 37 46 44 46 55C46 66 37 74 24 74C14 74 6 71 0 63"],
  "4": [54, "M40 74L40 0L0 52L54 52"],
  "5": [46, "M42 0L6 0L3 32C10 27 16 26 23 26C37 26 46 36 46 50C46 64 37 74 23 74C13 74 5 70 0 62"],
  "6": [48, "M38 2C16 2 0 22 0 50A24 24 0 1 0 48 50A24 24 0 1 0 0 50"],
  "7": [48, "M0 0L48 0L18 74"],
  "8": [46, "M23 0A17 17.5 0 1 0 23 35A17 17.5 0 1 0 23 0M23 35A23 19.5 0 1 0 23 74A23 19.5 0 1 0 23 35"],
  "9": [48, "M10 72C32 72 48 52 48 24A24 24 0 1 0 0 24A24 24 0 1 0 48 24"],
  "&": [60, "M58 74L14 22C8 14 12 0 24 0C36 0 40 14 32 22L10 42C0 52 4 74 24 74C40 74 52 60 56 40"],
  "!": [0, "M0 0L0 44M0 73L0 74"],
  "?": [40, "M0 14C2 4 10 0 20 0C32 0 40 8 40 18C40 34 20 32 20 50M20 73L20 74"],
  "+": [44, "M0 37L44 37M22 15L22 59"],
  "-": [30, "M0 40L30 40"],
};
/* Lay a word out: where each centre line starts, and the full inked width, in glyph units. */
function setWord(word: string) {
  const out: { x: number; d: string }[] = [];
  let x = STEM / 2;
  for (const ch of word) {
    const g = GLYPHS[ch];
    if (!g) continue;
    out.push({ x, d: g[1] });
    x += g[0] + STEM + GAP;
  }
  return { glyphs: out, width: Math.max(STEM, x - STEM / 2 - GAP) };
}
// How fat the letters are blown. 1 gives round tubes, 1.5 is swollen.
const INFLATE = 1.45;
// Where the camera stands, in radians round the word. 0 is square on.
const YAW = 0.24;
// Seconds a word takes to melt into the next one.
const MELT = 1.15;

// The glyph field: 4 units wide, 1 unit tall, baseline 0.2 up from the bottom edge.
const TW = 2048;
const TH = 512;
const BASE = 0.2;
const CAP = 0.6;

const clean = (s: string) => s.toUpperCase().replace(/[^A-Z0-9&!?+\-]/g, "").slice(0, MAX_LETTERS);

/* One dimensional squared distance transform (Felzenszwalb and Huttenlocher). */
function edt1d(f: Float32Array, n: number, d: Float32Array, v: Int32Array, z: Float32Array) {
  let k = 0;
  v[0] = 0;
  z[0] = -1e20;
  z[1] = 1e20;
  for (let q = 1; q < n; q++) {
    let s = 0;
    for (;;) {
      const p = v[k];
      s = (f[q] + q * q - (f[p] + p * p)) / (2 * q - 2 * p);
      if (s <= z[k] && k > 0) k--;
      else break;
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = 1e20;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    const p = v[k];
    d[q] = (q - p) * (q - p) + f[p];
  }
}

/* Relax the membrane equation (laplacian h = -1, h = 0 outside the ink) in place. */
function relax(h: Float32Array, ink: Uint8Array, w: number, hgt: number, cell: number, omega: number, rounds: number) {
  const c2 = cell * cell;
  for (let it = 0; it < rounds; it++) {
    for (let y = 1; y < hgt - 1; y++) {
      const row = y * w;
      for (let x = 1; x < w - 1; x++) {
        const i = row + x;
        if (ink[i]) h[i] += omega * ((h[i - 1] + h[i + 1] + h[i - w] + h[i + w] + c2) * 0.25 - h[i]);
      }
    }
  }
}

function shrinkInk(src: Uint8Array, w: number, hgt: number) {
  const W = w >> 1;
  const H = hgt >> 1;
  const out = new Uint8Array(W * H);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const i = y * 2 * w + x * 2;
      out[y * W + x] = src[i] + src[i + 1] + src[i + w] + src[i + w + 1] >= 2 ? 1 : 0;
    }
  return out;
}

function grow(src: Float32Array, W: number, H: number, ink: Uint8Array) {
  const w = W * 2;
  const h = H * 2;
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const fy = Math.min(H - 1.001, Math.max(0, (y - 0.5) / 2));
    const y0 = fy | 0;
    const ty = fy - y0;
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!ink[i]) continue;
      const fx = Math.min(W - 1.001, Math.max(0, (x - 0.5) / 2));
      const x0 = fx | 0;
      const tx = fx - x0;
      const a = y0 * W + x0;
      out[i] = (src[a] * (1 - tx) + src[a + 1] * tx) * (1 - ty) + (src[a + W] * (1 - tx) + src[a + W + 1] * tx) * ty;
    }
  }
  return out;
}

/*
 * Bake a word into a field the shader can ray-march.
 * Red holds an inflation height h: inside the ink it is the shape of a soap film blown up
 * through the letter outline, so sqrt(2h) is a round, seamless cushion. Outside it falls
 * away with distance. Green and blue hold the slope of h, so one texture read gives the
 * shader both the surface and the way to it.
 */
function bake(word: string, scratch: HTMLCanvasElement): { data: Float32Array; half: number } {
  scratch.width = TW;
  scratch.height = TH;
  const c = scratch.getContext("2d", { willReadFrequently: true })!;
  c.clearRect(0, 0, TW, TH);
  const data = new Float32Array(TW * TH * 4);
  const set = setWord(word);
  const unit = Math.min((CAP * TH) / (74 + STEM), (TW - 230) / set.width);
  const width = set.width * unit;
  const left = TW / 2 - width / 2;
  const top = TH * (1 - BASE) - (74 + STEM / 2) * unit;
  c.strokeStyle = "#fff";
  c.lineWidth = STEM;
  c.lineCap = "round";
  c.lineJoin = "round";
  for (const g of set.glyphs) {
    c.setTransform(unit, 0, 0, unit, left + g.x * unit, top);
    c.stroke(new Path2D(g.d));
  }
  c.setTransform(1, 0, 0, 1, 0, 0);
  const px = c.getImageData(0, 0, TW, TH).data;

  // Ink mask, stored bottom row first so +y is up.
  const ink0 = new Uint8Array(TW * TH);
  for (let y = 0; y < TH; y++) {
    const src = (TH - 1 - y) * TW * 4 + 3;
    for (let x = 0; x < TW; x++) ink0[y * TW + x] = px[src + x * 4] > 127 ? 1 : 0;
  }
  for (let x = 0; x < TW; x++) ink0[x] = ink0[(TH - 1) * TW + x] = 0;
  const ink1 = shrinkInk(ink0, TW, TH);
  const ink2 = shrinkInk(ink1, TW >> 1, TH >> 1);
  const cell = 1 / TH;

  // Coarse to fine: the slow, wide part of the answer is found on the small grid.
  let h2 = new Float32Array((TW >> 2) * (TH >> 2));
  relax(h2, ink2, TW >> 2, TH >> 2, cell * 4, 1.86, 110);
  let h1 = grow(h2, TW >> 2, TH >> 2, ink1);
  relax(h1, ink1, TW >> 1, TH >> 1, cell * 2, 1.5, 22);
  const h0 = grow(h1, TW >> 1, TH >> 1, ink0);
  relax(h0, ink0, TW, TH, cell, 1.25, 7);
  h2 = h1 = new Float32Array(0);

  // Distance to the ink, at half size, for everything outside the letters.
  const W1 = TW >> 1;
  const H1 = TH >> 1;
  const far = new Float32Array(W1 * H1);
  for (let i = 0; i < far.length; i++) far[i] = ink1[i] ? 0 : 1e12;
  const n = Math.max(W1, H1);
  const f = new Float32Array(n);
  const d = new Float32Array(n);
  const v = new Int32Array(n);
  const z = new Float32Array(n + 1);
  for (let x = 0; x < W1; x++) {
    for (let y = 0; y < H1; y++) f[y] = far[y * W1 + x];
    edt1d(f, H1, d, v, z);
    for (let y = 0; y < H1; y++) far[y * W1 + x] = d[y];
  }
  for (let y = 0; y < H1; y++) {
    for (let x = 0; x < W1; x++) f[x] = far[y * W1 + x];
    edt1d(f, W1, d, v, z);
    for (let x = 0; x < W1; x++) far[y * W1 + x] = Math.sqrt(d[x]) * cell * 2;
  }
  const field = new Float32Array(TW * TH);
  const reach = 0.18;
  const lean = 0.075;
  for (let y = 0; y < TH; y++)
    for (let x = 0; x < TW; x++) {
      const i = y * TW + x;
      if (ink0[i]) {
        field[i] = h0[i];
        continue;
      }
      const fx = Math.min(W1 - 1.001, Math.max(0, (x - 0.5) / 2));
      const fy = Math.min(H1 - 1.001, Math.max(0, (y - 0.5) / 2));
      const x0 = fx | 0;
      const y0 = fy | 0;
      const tx = fx - x0;
      const ty = fy - y0;
      const a = y0 * W1 + x0;
      const dist = Math.min(reach, (far[a] * (1 - tx) + far[a + 1] * tx) * (1 - ty) + (far[a + W1] * (1 - tx) + far[a + W1 + 1] * tx) * ty);
      field[i] = -(dist * dist * 0.5 + lean * dist);
    }
  // Two light box blurs take the stair steps off the outline.
  const tmp = new Float32Array(TW * TH);
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < TH; y++) {
      const r = y * TW;
      for (let x = 2; x < TW - 2; x++) tmp[r + x] = (field[r + x - 2] + field[r + x - 1] + field[r + x] + field[r + x + 1] + field[r + x + 2]) * 0.2;
    }
    for (let y = 2; y < TH - 2; y++) {
      const r = y * TW;
      for (let x = 2; x < TW - 2; x++) field[r + x] = (tmp[r + x - 2 * TW] + tmp[r + x - TW] + tmp[r + x] + tmp[r + x + TW] + tmp[r + x + 2 * TW]) * 0.2;
    }
  }
  const inv = 0.5 / cell;
  for (let y = 1; y < TH - 1; y++)
    for (let x = 1; x < TW - 1; x++) {
      const i = y * TW + x;
      const o = i * 4;
      data[o] = field[i];
      data[o + 1] = (field[i + 1] - field[i - 1]) * inv;
      data[o + 2] = (field[i + TW] - field[i - TW]) * inv;
    }
  const edge = -(reach * reach * 0.5 + lean * reach);
  for (let x = 0; x < TW; x++) data[x * 4] = data[((TH - 1) * TW + x) * 4] = edge;
  for (let y = 0; y < TH; y++) data[y * TW * 4] = data[(y * TW + TW - 1) * 4] = edge;
  return { data, half: Math.max(0.3, (width / TW) * 2) };
}

const VERT = `#version 300 es
in vec2 p;
void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
out vec4 outColor;
uniform sampler2D uA, uB;
uniform vec2 uRes;
uniform float uT, uMix, uSwell, uK, uHW, uFl;
uniform vec3 uRo, uRt, uUp, uFw;
uniform vec4 uHead, uTail, uRip, uPush;

const float FLOOR = 0.016;
const float BASE = ${BASE.toFixed(2)};
const vec2 TS = vec2(${TW}.0, ${TH}.0);
const float WALL = 2.7;
const vec3 CHROME = vec3(0.90, 0.92, 0.96);

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++){ s += a * noise(p); p = p * 2.03 + 7.1; a *= 0.5; } return s; }

/* Smooth (cubic B-spline) read of the glyph field in four taps. */
vec4 bic(sampler2D s, vec2 uv){
  vec2 x = uv * TS - 0.5, f = fract(x); x -= f;
  vec2 f2 = f * f, f3 = f2 * f;
  vec2 w0 = (1.0 - f) * (1.0 - f) * (1.0 - f) / 6.0;
  vec2 w1 = (3.0 * f3 - 6.0 * f2 + 4.0) / 6.0;
  vec2 w3 = f3 / 6.0;
  vec2 w2 = 1.0 - w0 - w1 - w3;
  vec2 g0 = w0 + w1, g1 = w2 + w3;
  vec2 a = (x + w1 / g0 - 0.5) / TS, b = (x + w3 / g1 + 1.5) / TS;
  return (texture(s, a) * g0.x + texture(s, vec2(b.x, a.y)) * g1.x) * g0.y + (texture(s, vec2(a.x, b.y)) * g0.x + texture(s, b) * g1.x) * g1.y;
}
vec4 glyph(vec2 q, bool hq){
  vec2 uv = vec2(q.x * 0.25 + 0.5, q.y + BASE);
  vec4 a = hq ? bic(uA, uv) : texture(uA, uv);
  if (uMix > 0.001){ vec4 b = hq ? bic(uB, uv) : texture(uB, uv); a = mix(a, b, uMix); }
  return a;
}
float letters(vec3 p, bool hq){
  vec2 q = p.xy, dd = q - uPush.xy;
  q -= uPush.zw * exp(-dot(dd, dd) * 5.0);
  vec4 f = glyph(q, hq);
  float k = uK * (1.0 + 0.05 * sin(q.x * 2.3 + uT * 1.1));
  if (uRip.w > 0.001){ float l = length(q - uRip.xy); k *= 1.0 + uRip.w * sin(24.0 * l - 15.0 * uRip.z) * exp(-2.0 * l); }
  float G = 2.0 * k * (f.x + uSwell) - p.z * p.z;
  vec3 g = vec3(2.0 * k * f.yz, 2.0 * p.z);
  return -G / max(length(g), 2.0 * sqrt(max(-G, 1e-5)));
}
float bead(vec3 p){
  vec3 pa = p - uHead.xyz, ba = uTail.xyz - uHead.xyz;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0.0, 1.0);
  return length(pa - ba * h) - mix(uHead.w, uTail.w, h);
}
float smin(float a, float b, float k){ float h = max(k - abs(a - b), 0.0) / k; return min(a, b) - h * h * h * k / 6.0; }
float map(vec3 p, bool hq){ return smin(letters(p, hq), bead(p), 0.11); }

vec3 normalAt(vec3 p, bool hq){
  float e = hq ? 0.0022 : 0.004;
  const vec2 k = vec2(1, -1);
  return normalize(k.xyy * map(p + k.xyy * e, hq) + k.yyx * map(p + k.yyx * e, hq) + k.yxy * map(p + k.yxy * e, hq) + k.xxx * map(p + k.xxx * e, hq));
}

bool slab(vec3 ro, vec3 rd, out float t0, out float t1){
  vec3 c = vec3(0.0, 0.42, 0.0), b = vec3(uHW + 0.34, 0.46, 0.3);
  vec3 m = 1.0 / rd, n = m * (ro - c), k = abs(m) * b;
  vec3 a = -n - k, z = -n + k;
  t0 = max(max(a.x, a.y), a.z); t1 = min(min(z.x, z.y), z.z);
  return t1 > max(t0, 0.0);
}
/* Sphere trace inside the word's box. cov is how much of the pixel the surface covers. */
float march(vec3 ro, vec3 rd, int steps, float px, out float cov){
  cov = 0.0;
  float t0, t1;
  if (!slab(ro, rd, t0, t1)) return -1.0;
  float t = max(t0, 0.0), best = 1e9, bt = t;
  for (int i = 0; i < steps; i++){
    float d = map(ro + rd * t, false);
    if (d < 0.0005 + 0.0004 * t){ cov = 1.0; return t; }
    float m = d / (px * (t + 0.3) + 1e-6);
    if (m < best){ best = m; bt = t; }
    t += d * 0.9;
    if (t > t1) break;
  }
  if (best < 1.0){ cov = 1.0 - best; return bt; }
  return -1.0;
}

float card(vec3 rd, vec3 c, vec2 s, float e){
  float a = dot(rd, c);
  if (a <= 0.0) return 0.0;
  vec3 u = normalize(cross(vec3(0.0, 1.0, 0.001), c)), v = cross(c, u);
  vec2 q = vec2(dot(rd, u), dot(rd, v)) / a;
  vec2 m = smoothstep(s, s - e, abs(q));
  return m.x * m.y * (0.72 + 0.28 * exp(-dot(q / s, q / s) * 1.4));
}
/* The painted back wall: a low ember sun on near-black plum paper. */
vec3 wall(vec3 P){
  vec2 d = P.xy - vec2(0.0, 0.5);
  float r = length(d);
  float disc = smoothstep(1.36, 1.02, r);
  float halo = exp(-pow(r / 1.75, 2.0) * 3.0);
  vec3 c = mix(vec3(0.42, 0.035, 0.03), vec3(0.82, 0.2, 0.035), smoothstep(1.3, 0.2, r));
  c = mix(c, vec3(1.0, 0.42, 0.09), smoothstep(0.85, 0.0, length(d - vec2(0.0, -0.45))) * 0.85);
  vec3 col = c * disc + vec3(0.3, 0.015, 0.05) * halo * (1.0 - disc) * 0.5;
  col += vec3(0.012, 0.005, 0.016);
  col *= 0.96 + 0.08 * noise(P.xy * 70.0);
  return col;
}
/* Everything that is not the word or the floor: wall, softboxes, strip lights. */
vec3 dome(vec3 ro, vec3 rd){
  vec3 col = vec3(0.005, 0.005, 0.009);
  if (rd.z < -0.02){
    vec3 P = ro + rd * ((-WALL - ro.z) / rd.z);
    col += wall(P) * smoothstep(-0.02, -0.22, rd.z);
  }
  // key softbox overhead
  col += vec3(1.0, 0.98, 0.95) * 6.5 * card(rd, normalize(vec3(0.06, 0.88, 0.46)), vec2(1.0, 0.3), 0.08);
  // the camera side of the room is one long sweep of white paper, bright on the left and
  // falling away to the right, with a black flag standing in it. This is what gives every
  // stroke a broad silver body and one clean dark band.
  float az = atan(rd.x, rd.z);
  float sweep = smoothstep(2.0, 1.45, abs(az)) * smoothstep(-0.2, 0.05, rd.y) * mix(1.0, 0.5, smoothstep(0.15, 0.8, rd.y));
  float body = mix(2.1, 0.42, smoothstep(-1.5, 1.0, az));
  body *= 1.0 - 0.9 * smoothstep(0.5, 0.6, az) * smoothstep(1.02, 0.9, az);
  col += vec3(0.9, 0.94, 1.0) * body * sweep;
  // soft amber wash right and two wide rim glows behind the word, all out of frame
  col += vec3(1.0, 0.5, 0.2) * 2.6 * card(rd, normalize(vec3(0.96, 0.3, 0.1)), vec2(0.3, 0.75), 0.2);
  col += vec3(0.5, 0.74, 1.0) * 1.6 * card(rd, normalize(vec3(0.85, 0.3, -0.55)), vec2(0.22, 0.6), 0.16);
  col += vec3(1.0, 0.5, 0.28) * 1.3 * card(rd, normalize(vec3(-0.88, 0.34, -0.5)), vec2(0.2, 0.6), 0.16);
  // one small bare lamp for glints
  col += vec3(1.0, 0.96, 0.9) * 12.0 * card(rd, normalize(vec3(0.5, 0.5, 0.72)), vec2(0.05, 0.05), 0.02);
  return col;
}
vec3 floorGlow(vec3 p){
  vec2 q = (p.xz - vec2(0.0, 0.15)) * vec2(0.4, 0.7);
  vec3 lit = vec3(0.03, 0.022, 0.024) * exp(-dot(q, q));
  lit += vec3(0.3, 0.07, 0.03) * exp(-(p.z + WALL) * 0.9) * exp(-p.x * p.x * 0.22);
  return lit;
}
/* Cheap floor, for what the chrome sees of it. */
vec3 floorLite(vec3 p, vec3 rd){
  vec3 r = reflect(rd, vec3(0.0, 1.0, 0.0));
  float F = 0.05 + 0.95 * pow(1.0 - clamp(-rd.y, 0.0, 1.0), 5.0);
  float near = clamp(letters(p + vec3(0.0, 0.03, 0.0), false) / 0.22, 0.0, 1.0);
  return (floorGlow(p) + F * dome(p, r)) * mix(0.22, 1.0, near);
}
vec3 sky(vec3 p, vec3 r){
  if (r.y < -0.0005){ vec3 f = p + r * ((FLOOR - p.y) / r.y); if (f.z > -WALL) return floorLite(f, r); }
  return dome(p, r);
}
vec3 chrome(vec3 p, vec3 rd, vec3 n, bool first, float px){
  vec3 r = reflect(rd, n);
  float ndv = clamp(dot(n, -rd), 0.0, 1.0);
  vec3 e = sky(p, r);
  if (first){
    // one more bounce, so letters show in each other
    vec3 o = p + n * 0.02;
    float cov, t = march(o, r, 40, 0.0, cov);
    float tf = r.y < 0.0 ? (FLOOR - p.y) / r.y : 1e9;
    if (cov > 0.5 && t < tf){
      vec3 q = o + r * t, m = normalAt(q, false);
      e = mix(e, sky(q, reflect(r, m)) * CHROME * 0.9, smoothstep(0.05, 0.16, t) * smoothstep(1.2, 0.5, t) * smoothstep(0.2, 0.5, ndv));
    }
  }
  float ao = clamp(map(p + n * 0.06, false) / 0.06, 0.0, 1.0);
  vec3 F = mix(CHROME, vec3(1.0), pow(1.0 - ndv, 5.0));
  return e * F * mix(0.5, 1.0, ao);
}
float shadow(vec3 p, vec3 l){
  float t0, t1;
  if (!slab(p, l, t0, t1)) return 1.0;
  float t = max(t0, 0.02), s = 1.0;
  for (int i = 0; i < 18; i++){
    float d = map(p + l * t, false);
    s = min(s, 7.0 * d / t);
    t += clamp(d, 0.012, 0.12);
    if (s < 0.01 || t > t1) break;
  }
  return clamp(s, 0.0, 1.0);
}
vec3 floorFull(vec3 p, vec3 rd, float px){
  float grain = fbm(p.xz * vec2(2.6, 5.5));
  float wav = fbm(p.xz * 1.7 + 3.0);
  vec3 n = normalize(vec3((wav - 0.5) * 0.03, 1.0, (fbm(p.xz * 1.7 - 9.0) - 0.5) * 0.03));
  vec3 r = reflect(rd, n);
  float F = 0.055 + 0.945 * pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 5.0);
  vec3 refl = dome(p, r);
  float cov, t = march(p + vec3(0.0, 0.003, 0.0), r, 44, px * 2.0, cov);
  if (t > 0.0){
    vec3 q = p + r * t;
    vec3 c = chrome(q, r, normalAt(q, false), false, px);
    refl = mix(refl, c, cov * mix(0.8, 0.04, smoothstep(0.0, 0.6, q.y)));
  }
  refl *= mix(0.7, 0.95, smoothstep(0.25, 0.7, grain));
  float sh = shadow(p + vec3(0.0, 0.004, 0.0), normalize(vec3(-0.22, 0.8, 0.52)));
  float near = clamp(map(p + vec3(0.0, 0.02, 0.0), false) / 0.1, 0.0, 1.0);
  vec3 diff = floorGlow(p) * mix(0.25, 1.0, sh) * (0.85 + 0.3 * grain);
  vec3 col = (diff + F * refl) * mix(0.3, 1.0, near);
  float fog = smoothstep(-0.9, -WALL, p.z);
  return mix(col, wall(vec3(p.x, 0.02, -WALL)), fog * fog * 0.92);
}
vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }

void main(){
  vec2 uv = (gl_FragCoord.xy * 2.0 - uRes) / uRes.y;
  vec3 rd = normalize(uv.x * uRt + uv.y * uUp + uFl * uFw);
  float px = 2.0 / (uRes.y * uFl);
  float tf = rd.y < 0.0 ? (FLOOR - uRo.y) / rd.y : 1e9;
  float cov, t = march(uRo, rd, 84, px, cov);
  bool hit = t > 0.0 && t < tf;
  vec3 col = vec3(0.0);
  if (!hit || cov < 0.999){
    vec3 fp = uRo + rd * tf;
    col = tf < 1e8 && fp.z > -WALL ? floorFull(fp, rd, px) : dome(uRo, rd);
  }
  if (hit){
    vec3 p = uRo + rd * t;
    col = mix(col, chrome(p, rd, normalAt(p, true), true, px), cov);
  }
  col = aces(col * 1.08);
  col = pow(col, vec3(1.0 / 2.2));
  vec2 v = gl_FragCoord.xy / uRes - 0.5;
  col *= 1.0 - dot(v, v) * 0.75;
  col += (hash(gl_FragCoord.xy + fract(uT) * 91.7) - 0.5) * 0.028;
  outColor = vec4(col, 1.0);
}`;

export default function LiquidChromeWord() {
  const reduce = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [typed, setTyped] = useState(WORDS[0]);
  const [live, setLive] = useState(false);
  const word = clean(typed) || WORDS[0];
  const api = useRef<{ set: (w: string) => void; strike: (x?: number, y?: number) => void } | null>(null);
  const pointer = useRef({ x: 0, y: 0, at: -1e9, down: false, inside: false });
  const hands = useRef(false); // true once a visitor has typed, which stops the self-playing words
  const typedRef = useRef(typed);
  typedRef.current = typed;

  useEffect(() => {
    const cv = canvas.current;
    const el = stage.current;
    if (!cv || !el) return;
    const gl = cv.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance" });
    if (!gl) return; // no WebGL 2: the still composition underneath stays
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n: string) => gl.getUniformLocation(prog, n);
    const u = { res: U("uRes"), t: U("uT"), mix: U("uMix"), swell: U("uSwell"), k: U("uK"), hw: U("uHW"), fl: U("uFl"), ro: U("uRo"), rt: U("uRt"), up: U("uUp"), fw: U("uFw"), head: U("uHead"), tail: U("uTail"), rip: U("uRip"), push: U("uPush") };
    const tex = [0, 1].map((i) => {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    });
    const scratch = document.createElement("canvas");
    let slotA = 0; // which texture unit holds the word on show
    let halfA = 1.4;
    let halfB = 1.4;
    let melt = -1; // seconds into a melt, or -1
    let ready = false;
    const upload = (unit: number, w: string) => {
      const b = bake(w, scratch);
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex[unit]);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, TW, TH, 0, gl.RGBA, gl.FLOAT, b.data);
      return b.half;
    };

    // Springs. Positions are in the word's own units: x across, y up from the floor, z toward the camera.
    const s = {
      hx: 0.9, hy: 0.48, hz: 0.07, hvx: 0, hvy: 0,
      tx: 0.9, ty: 0.48, tvx: 0, tvy: 0,
      px: 0, py: 0,
      yaw: YAW, pitch: 0.13, dist: 5, half: 1.4,
      j: 0, jv: 0,
      ripX: 0, ripY: 0.3, ripAt: -10,
    };
    // Always drawn at 1.5 times the layout size: on an ordinary screen that is supersampling, which is what keeps rims clean.
    let scale = 1.5;
    let w = 0;
    let h = 0;
    const VT = Math.tan((30 * Math.PI) / 360);
    const fit = (half: number) => Math.max((half * 2 + 0.86) / (2 * VT * (w / Math.max(h, 1))), 1.34 / (2 * VT));
    const layout = () => {
      const r = el.getBoundingClientRect();
      w = r.width;
      h = r.height;
      cv.width = Math.max(2, Math.round(w * scale));
      cv.height = Math.max(2, Math.round(h * scale));
      gl.viewport(0, 0, cv.width, cv.height);
    };
    const cam = { ro: [0, 0, 5], rt: [1, 0, 0], up: [0, 1, 0], fw: [0, 0, -1] };
    const aim = () => {
      const ta = [0.19, 0.17, 0];
      const cp = Math.cos(s.pitch);
      const ro = [ta[0] + s.dist * Math.sin(s.yaw) * cp, ta[1] + s.dist * Math.sin(s.pitch), ta[2] + s.dist * Math.cos(s.yaw) * cp];
      const f = [ta[0] - ro[0], ta[1] - ro[1], ta[2] - ro[2]];
      const fl = Math.hypot(f[0], f[1], f[2]);
      const fw = [f[0] / fl, f[1] / fl, f[2] / fl];
      const rl = Math.hypot(fw[2], fw[0]);
      const rt = [-fw[2] / rl, 0, fw[0] / rl];
      const up = [rt[1] * fw[2] - rt[2] * fw[1], rt[2] * fw[0] - rt[0] * fw[2], rt[0] * fw[1] - rt[1] * fw[0]];
      cam.ro = ro;
      cam.rt = rt;
      cam.up = up;
      cam.fw = fw;
    };
    // Where a pointer position lands on the upright plane the word stands in.
    const toWord = (cx: number, cy: number) => {
      const ux = ((cx / w) * 2 - 1) * (w / h);
      const uy = 1 - (cy / h) * 2;
      const f = 1 / VT;
      const d = [ux * cam.rt[0] + uy * cam.up[0] + f * cam.fw[0], ux * cam.rt[1] + uy * cam.up[1] + f * cam.fw[1], ux * cam.rt[2] + uy * cam.up[2] + f * cam.fw[2]];
      const t = -cam.ro[2] / d[2];
      return [cam.ro[0] + d[0] * t, cam.ro[1] + d[1] * t];
    };

    let clock = 0;
    const draw = () => {
      aim();
      const m = melt < 0 ? 0 : Math.min(1, melt / MELT);
      const e = m < 0.5 ? 4 * m * m * m : 1 - Math.pow(-2 * m + 2, 3) / 2;
      gl.uniform1i(U("uA"), slotA);
      gl.uniform1i(U("uB"), 1 - slotA);
      gl.uniform2f(u.res, cv.width, cv.height);
      gl.uniform1f(u.t, clock);
      gl.uniform1f(u.mix, e);
      gl.uniform1f(u.swell, Math.sin(Math.PI * e) * 0.0032);
      gl.uniform1f(u.k, INFLATE * (1 + s.j));
      gl.uniform1f(u.hw, Math.max(halfA, halfB) + 0.1);
      gl.uniform1f(u.fl, 1 / VT);
      gl.uniform3fv(u.ro, cam.ro);
      gl.uniform3fv(u.rt, cam.rt);
      gl.uniform3fv(u.up, cam.up);
      gl.uniform3fv(u.fw, cam.fw);
      const sp = Math.hypot(s.hvx, s.hvy);
      gl.uniform4f(u.head, s.hx, s.hy, s.hz, 0.082 / (1 + sp * 0.05));
      gl.uniform4f(u.tail, s.tx, s.ty, s.hz - 0.01, 0.05);
      const age = clock - s.ripAt;
      gl.uniform4f(u.rip, s.ripX, s.ripY, age, age < 3 ? 0.55 * Math.exp(-2.3 * age) : 0);
      gl.uniform4f(u.push, s.hx, s.hy, s.px, s.py);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    let raf = 0;
    let last = 0;
    let visible = true;
    let slow = 0;
    let nextAuto = 4.4;
    let auto = 0;
    const step = (dt: number) => {
      clock += dt;
      const p = pointer.current;
      const idle = !p.inside || performance.now() - p.at > 2600;
      const reachX = s.half + 0.25;
      let gx: number;
      let gy: number;
      if (idle) {
        // left alone, the bead rolls home and sits on the floor after the last letter, as a full stop
        gx = s.half + 0.2;
        gy = 0.1;
      } else {
        const q = toWord(p.x, p.y);
        gx = Math.max(-reachX, Math.min(reachX, q[0]));
        gy = Math.max(0.1, Math.min(0.76, q[1]));
      }
      const hk = idle ? 26 : 120;
      const hc = idle ? 9 : 13;
      s.hvx += ((gx - s.hx) * hk - s.hvx * hc) * dt;
      s.hvy += ((gy - s.hy) * hk - s.hvy * hc) * dt;
      s.hx += s.hvx * dt;
      s.hy += s.hvy * dt;
      s.tvx += ((s.hx - s.tx) * 70 - s.tvx * 10) * dt;
      s.tvy += ((s.hy - s.ty) * 70 - s.tvy * 10) * dt;
      s.tx += s.tvx * dt;
      s.ty += s.tvy * dt;
      const pl = Math.min(1, 0.075 / Math.max(1e-4, Math.hypot(s.hvx, s.hvy) * 0.03));
      s.px += (s.hvx * 0.03 * pl - s.px) * Math.min(1, dt * 9);
      s.py += (s.hvy * 0.03 * pl - s.py) * Math.min(1, dt * 9);
      s.jv += (-s.j * 240 - s.jv * 7.5) * dt;
      s.j += s.jv * dt;
      const yawTo = idle ? YAW + Math.sin(clock * 0.23) * 0.07 : YAW * 0.5 + ((p.x / w) * 2 - 1) * -0.2;
      const pitchTo = idle ? 0.13 + Math.sin(clock * 0.31) * 0.012 : 0.13 + ((p.y / h) * 2 - 1) * 0.045;
      s.yaw += (yawTo - s.yaw) * Math.min(1, dt * 2.6);
      s.pitch += (pitchTo - s.pitch) * Math.min(1, dt * 2.6);
      if (melt >= 0) {
        melt += dt;
        const k = Math.min(1, melt / MELT);
        s.half = halfA + (halfB - halfA) * k;
        if (melt >= MELT) {
          slotA = 1 - slotA;
          halfA = halfB;
          melt = -1;
          s.jv += 2.6; // the new word lands fat, then settles
        }
      }
      s.dist += (fit(s.half) - s.dist) * Math.min(1, dt * 3.2);
      if (!hands.current && clock > nextAuto && melt < 0) {
        auto = (auto + 1) % WORDS.length;
        nextAuto = clock + 5.4;
        setTyped(WORDS[auto]);
      }
    };
    const frame = (now: number) => {
      raf = 0;
      if (!ready || !visible || document.hidden) return;
      const raw = last ? (now - last) / 1000 : 1 / 60;
      last = now;
      // Too slow on this machine: drop the drawing size a notch and stretch it instead.
      if (raw > 0.026 && raw < 0.25) slow++;
      else slow = Math.max(0, slow - 1);
      if (slow > 24 && scale > 0.55) {
        scale *= 0.84;
        slow = 0;
        layout();
      }
      const dt = Math.min(raw, 1 / 30);
      step(dt * 0.5);
      step(dt * 0.5);
      draw();
      raf = requestAnimationFrame(frame);
    };
    const wake = () => {
      if (reduce) {
        if (ready) draw();
        return;
      }
      last = 0;
      if (!raf) raf = requestAnimationFrame(frame);
    };

    api.current = {
      set: (next: string) => {
        if (!ready) return;
        if (melt >= 0) {
          slotA = 1 - slotA;
          halfA = halfB;
          melt = -1;
        }
        if (reduce) {
          halfA = halfB = s.half = upload(slotA, next);
          s.dist = fit(s.half);
          draw();
          return;
        }
        halfB = upload(1 - slotA, next);
        melt = 0;
      },
      strike: (cx?: number, cy?: number) => {
        if (reduce || !ready) return;
        const q = cx === undefined || cy === undefined ? [s.hx, s.hy] : toWord(cx, cy);
        s.ripX = q[0];
        s.ripY = q[1];
        s.ripAt = clock;
        s.jv += 1.9;
      },
    };

    const start = () => {
      layout();
      halfA = halfB = s.half = upload(0, clean(typedRef.current) || WORDS[0]);
      upload(1, clean(typedRef.current) || WORDS[0]);
      s.dist = fit(s.half);
      s.hx = s.tx = s.half + 0.2;
      s.hy = s.ty = 0.1;
      ready = true;
      setLive(true);
      wake();
    };
    start();

    const ro = new ResizeObserver(() => {
      layout();
      if (ready) {
        if (reduce) {
          s.dist = fit(s.half);
          draw();
        } else wake();
      }
    });
    ro.observe(el);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      wake();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", wake);
    return () => {
      api.current = null;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", wake);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [reduce]);

  // Re-bake a moment after the word changes, so fast typing melts once and not per key.
  const shown = useRef(word);
  useEffect(() => {
    if (shown.current === word) return;
    const id = window.setTimeout(() => {
      shown.current = word;
      api.current?.set(word);
    }, hands.current ? 160 : 0);
    return () => window.clearTimeout(id);
  }, [word]);

  function track(e: ReactPointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const p = pointer.current;
    p.x = e.clientX - r.left;
    p.y = e.clientY - r.top;
    p.at = performance.now();
    p.inside = e.type !== "pointerleave";
    if (e.type === "pointerdown") api.current?.strike(p.x, p.y);
  }

  // The still: the same word, typeface and set, drawn as layered SVG strokes.
  const set = setWord(word);
  const vbW = set.width + 46;
  const layer = (stroke: string, widthPx: number, dx: number, dy: number, opacity = 1, cls = "") => (
    <g fill="none" stroke={stroke} strokeWidth={widthPx} strokeLinecap="round" strokeLinejoin="round" opacity={opacity} transform={`translate(${dx} ${dy})`} className={cls} filter={opacity < 1 ? "url(#rmlc-edge)" : undefined}>
      {set.glyphs.map((g, n) => (
        <path key={n} d={g.d} transform={`translate(${g.x} ${STEM / 2})`} />
      ))}
    </g>
  );
  const metal = (
    <>
      {layer("#131019", STEM, 0, 0)}
      {layer("url(#rmlc-body)", STEM - 3, -1, -0.8)}
      {layer("#ff8a40", 2.2, 9.4, 1.2, 0.5)}
      {layer("#0c0d14", 3.2, 5.4, 1.6, 0.8)}
      {layer("url(#rmlc-light)", 7.5, -4.8, -2.6, 0.97, "rmlc-glint")}
      <circle cx={set.width + 26} cy={87} r={13} fill="url(#rmlc-bead)" />
    </>
  );

  return (
    <section className="relative isolate h-[560px] w-full overflow-hidden bg-[#0b070d] sm:h-[720px]">
      <style>{`
        @keyframes ray-marched-liquid-chrome-word-glint { from { translate: -0.6px -0.4px; opacity: 0.86; } to { translate: 1.4px 0.6px; opacity: 1; } }
        .rmlc-glint { animation: ray-marched-liquid-chrome-word-glint 2.8s ease-in-out infinite alternate; }
        @media (prefers-reduced-motion: reduce) { .rmlc-glint { animation: none; } }
      `}</style>
      {/* The real word. Assistive technology and search read this; everything drawn is decoration for it. */}
      <h2 className="sr-only">{word}</h2>

      {/* The still. It shows first, and stays if WebGL 2 is missing. */}
      <div aria-hidden="true" className={`absolute inset-0 transition-opacity duration-700 ${live ? "opacity-0" : "opacity-100"}`}>
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 56% 40%, #e98a2f 0%, #d9611f 14%, #b5301c 27%, #6d1420 36%, rgba(60,10,32,0.5) 44%, rgba(22,10,28,0.9) 60%, #120a18 100%)" }} />
        <div className="absolute inset-x-0 bottom-0 top-[59%]" style={{ background: "linear-gradient(180deg, rgba(120,44,20,0.85) 0%, rgba(52,20,18,0.92) 18%, #170c10 55%, #0b070d 100%)" }} />
        <div className="absolute inset-x-0 bottom-0 top-[59%]" style={{ background: "radial-gradient(60% 120% at 56% 0%, rgba(240,120,40,0.6) 0%, rgba(190,50,30,0.32) 40%, rgba(0,0,0,0) 72%)" }} />
        <svg viewBox={`-23 -6 ${vbW} 212`} className="absolute left-1/2 top-[59%] w-[88%] max-w-[1080px] -translate-x-1/2 overflow-visible" style={{ transform: "translate(-50%, -50%)" }}>
          <defs>
            <linearGradient id="rmlc-body" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100">
              <stop offset="0" stopColor="#f6f8fc" />
              <stop offset="0.5" stopColor="#c9d0dc" />
              <stop offset="0.8" stopColor="#7e8696" />
              <stop offset="1" stopColor="#5a3a34" />
            </linearGradient>
            <linearGradient id="rmlc-light" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="100">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#e6ebf3" />
            </linearGradient>
            <radialGradient id="rmlc-bead" cx="0.36" cy="0.32" r="0.75">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="0.3" stopColor="#c5ccd8" />
              <stop offset="0.62" stopColor="#15151d" />
              <stop offset="0.86" stopColor="#3a1c18" />
              <stop offset="1" stopColor="#ff9a52" />
            </radialGradient>
            <linearGradient id="rmlc-fade" gradientUnits="userSpaceOnUse" x1="0" y1="100" x2="0" y2="200">
              <stop offset="0" stopColor="#fff" stopOpacity="0.62" />
              <stop offset="0.75" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <mask id="rmlc-mask" maskUnits="userSpaceOnUse" x="-40" y="100" width={vbW + 80} height="110">
              <rect x="-40" y="100" width={vbW + 80} height="110" fill="url(#rmlc-fade)" />
            </mask>
            <filter id="rmlc-edge" x="-5%" y="-5%" width="110%" height="110%">
              <feGaussianBlur stdDeviation="0.55" />
            </filter>
            <filter id="rmlc-soft" x="-5%" y="-5%" width="110%" height="110%">
              <feGaussianBlur stdDeviation="0.5 1.3" />
            </filter>
          </defs>
          <ellipse cx={vbW / 2 - 23} cy="100" rx={vbW / 2} ry="5" fill="#000" opacity="0.5" filter="url(#rmlc-soft)" />
          <g mask="url(#rmlc-mask)">
            <g transform="translate(0 200) scale(1 -1)" filter="url(#rmlc-soft)">
              {metal}
            </g>
          </g>
          {metal}
        </svg>
      </div>

      <div ref={stage} onPointerMove={track} onPointerDown={track} onPointerLeave={track} className="absolute inset-0 touch-pan-y">
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${live ? "opacity-100" : "opacity-0"}`} />
      </div>

      <form
        className="absolute inset-x-0 bottom-5 flex flex-col items-center gap-3 px-5 sm:bottom-8"
        onSubmit={(e) => {
          e.preventDefault();
          api.current?.strike();
        }}
      >
        <div className="flex h-[52px] items-center rounded-full border border-white/[0.14] bg-[#0d080c]/60 pl-6 pr-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_18px_40px_-18px_rgba(0,0,0,0.9)] backdrop-blur-xl transition-colors focus-within:border-white/40">
          <label htmlFor="rmlc-word" className="whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.28em] text-white/50" style={{ fontFamily: FACE }}>
            Set a word
          </label>
          <span aria-hidden="true" className="mx-4 h-5 w-px bg-white/15" />
          <input
            id="rmlc-word"
            type="text"
            value={typed}
            maxLength={MAX_LETTERS}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            onFocus={() => (hands.current = true)}
            onChange={(e) => {
              hands.current = true;
              setTyped(clean(e.target.value));
            }}
            className="w-[10ch] min-w-0 bg-transparent text-[18px] font-semibold uppercase tracking-[0.24em] text-white caret-[#ff8a4c] outline-none placeholder:text-white/30 sm:w-[12ch]"
            style={{ fontFamily: FACE }}
            placeholder={WORDS[0]}
          />
          <button
            type="submit"
            aria-label="Strike the letters"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-[#0b070d] shadow-[inset_0_-2px_0_rgba(0,0,0,0.12)] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a4c] focus-visible:ring-offset-2 focus-visible:ring-offset-black active:scale-90"
          >
            <svg aria-hidden="true" viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5v4a3 3 0 0 1-3 3H5" />
              <path d="M8 9l-3 3 3 3" />
            </svg>
          </button>
        </div>
        {!reduce && (
          <p className="pointer-events-none hidden text-[10px] font-medium uppercase tracking-[0.28em] text-white/40 sm:block" style={{ fontFamily: FACE }}>
            Drag the full stop through it <span className="mx-1 text-white/20">/</span> click to strike
          </p>
        )}
      </form>
    </section>
  );
}
