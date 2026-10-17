import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/** The painted chips on the rivet: an invented name, a short code printed on the chip, and the paint colour. The first one is out on load. */
const CHIPS = [
  { name: "Morning Blue", code: "No. 01", hex: "#4F98FB", note: "Clear, calm and easy to trust." },
  { name: "Kiln Ember", code: "No. 02", hex: "#E0582E", note: "Warm, loud and hard to miss." },
  { name: "Fig Leaf", code: "No. 03", hex: "#3B8A5A", note: "Green from the shady side of the garden." },
  { name: "Saffron Hour", code: "No. 04", hex: "#EFAE35", note: "Late sun on a whitewashed wall." },
  { name: "Plum Dusk", code: "No. 05", hex: "#7A3C76", note: "Deep, soft and a little theatrical." },
  { name: "Late Ink", code: "No. 06", hex: "#24304A", note: "Almost black, with the blue left in." },
];

const BLUE = "#4F98FB";
const INK = "#0B0D12";
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
/** Seconds the self-playing demo rests on each colour before taking the next chip. */
const HOLD = 5.4;
/** Seconds the wet paint takes to spread across the whole model. */
const SPREAD = 2.4;
/** Lowest and highest render scale (canvas pixels per CSS pixel). The loop steps down when frames run slow. */
const MIN_SCALE = 0.5;
const MAX_SCALE = 1.5;
/** Most pixels ever sent through the ray marcher in one frame. */
const PIXEL_BUDGET = 1.6e6;

/* ---------- the parts of the homepage model that stand proud of the board ----------
   x, y: centre on the board face (the board is 1.72 wide and 1.24 tall, y from its foot);
   w, h: half sizes; r: corner radius; lift: how far it stands out; paint: true for the parts the colour washes over. */
type Part = { x: number; y: number; w: number; h: number; r: number; lift: number; paint: boolean };
const PARTS: Part[] = [
  // menu row
  { x: -0.73, y: 1.12, w: 0.035, h: 0.035, r: 0.035, lift: 0.016, paint: false },
  { x: 0.08, y: 1.12, w: 0.06, h: 0.011, r: 0.011, lift: 0.008, paint: false },
  { x: 0.25, y: 1.12, w: 0.06, h: 0.011, r: 0.011, lift: 0.008, paint: false },
  { x: 0.42, y: 1.12, w: 0.05, h: 0.011, r: 0.011, lift: 0.008, paint: false },
  { x: 0.67, y: 1.12, w: 0.12, h: 0.036, r: 0.036, lift: 0.02, paint: true },
  // headline band, two headline lines on it and a picture block
  { x: 0, y: 0.8, w: 0.79, h: 0.215, r: 0.022, lift: 0.012, paint: true },
  { x: -0.33, y: 0.88, w: 0.4, h: 0.044, r: 0.012, lift: 0.032, paint: false },
  { x: -0.42, y: 0.765, w: 0.31, h: 0.044, r: 0.012, lift: 0.032, paint: false },
  { x: 0.47, y: 0.8, w: 0.25, h: 0.175, r: 0.014, lift: 0.05, paint: false },
  // the two buttons
  { x: -0.6, y: 0.47, w: 0.17, h: 0.046, r: 0.046, lift: 0.026, paint: true },
  { x: -0.22, y: 0.47, w: 0.15, h: 0.046, r: 0.046, lift: 0.014, paint: false },
  // three cards with painted tops
  { x: -0.54, y: 0.2, w: 0.245, h: 0.135, r: 0.016, lift: 0.018, paint: false },
  { x: 0, y: 0.2, w: 0.245, h: 0.135, r: 0.016, lift: 0.018, paint: false },
  { x: 0.54, y: 0.2, w: 0.245, h: 0.135, r: 0.016, lift: 0.018, paint: false },
  { x: -0.54, y: 0.3, w: 0.245, h: 0.032, r: 0.016, lift: 0.026, paint: true },
  { x: 0, y: 0.3, w: 0.245, h: 0.032, r: 0.016, lift: 0.026, paint: true },
  { x: 0.54, y: 0.3, w: 0.245, h: 0.032, r: 0.016, lift: 0.026, paint: true },
];

/* ---------- small helpers ---------- */

const f = (n: number) => n.toFixed(5);
const linear = (hex: string) => [1, 3, 5].map((i) => Math.pow(parseInt(hex.slice(i, i + 2), 16) / 255, 2.2));

/** The fan: the angle of each chip round the rivet while it is in the deck, and the angle of the one that is out. */
const FAN = CHIPS.map((_, i) => 1.02 + i * 0.15);
const OUT = 0.3;
/** Where the rivet and the middle of the model's base sit on the table (x, z), wide screens then phones. */
const PLACE = { wide: { rivet: [-1.5, 0.92], model: [0.66, -0.46] }, phone: { rivet: [-0.85, 1.3], model: [0.3, -0.5] } };
/** How far each chip tips down toward the table from the rivet: in the deck, and once it is out. */
const LIE_DECK = 0.6;
const LIE_OUT = 0.9;

const partsGLSL = (paint: boolean) =>
  PARTS.filter((p) => p.paint === paint)
    .map((p) => `d = min(d, ext(rb2(b.xy - vec2(${f(p.x)}, ${f(p.y)}), vec2(${f(p.w)}, ${f(p.h)}), ${f(p.r)}), b.z - ${f(0.02 + p.lift / 2)}, ${f(p.lift / 2)}, 0.0035));`)
    .join("\n  ");

const VERT = `#version 300 es
in vec2 a; out vec2 vUv;
void main(){ vUv = a * 0.5 + 0.5; gl_Position = vec4(a, 0.0, 1.0); }`;

const SCENE = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform vec2 uRes;
uniform vec3 uCam, uTarget;
uniform float uFov, uTime;
uniform vec4 uChip[6];   // angle round the rivet, lift, how far it lies down onto the table, layer in the stack
uniform vec3 uCol[6];    // paint colours, linear
uniform vec3 uOld, uNew; // colour on the model before and after the wash
uniform float uR, uDry;  // how far the wash has spread, and how dry it is
uniform sampler2D uLab;  // printed names on the chips

const vec3 L = vec3(-0.7010, 0.5842, 0.4089);
const vec3 SUNC = vec3(1.0, 0.93, 0.82);
const float SUNI = 2.15;
uniform vec3 R0;   // the rivet on the table
uniform vec3 BP;   // the middle of the model's base
const float LEAN = 0.2;
const vec3 TABLE = vec3(0.86, 0.85, 0.82);
const vec3 CARD = vec3(0.93, 0.925, 0.91);
const float WALLZ = -3.6;

float gPix, gDist;
int gChip;

float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float n2(vec2 x){ vec2 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++){ s += a * n2(p); p = p * 2.03 + 7.1; a *= 0.5; } return s; }
vec3 tone(vec3 x){ vec3 c = 1.0 - exp(-max(x, 0.0) * 0.82); c = mix(c, c * c * (3.0 - 2.0 * c), 0.34); return pow(c, vec3(1.0 / 2.2)); }

float rb2(vec2 p, vec2 h, float r){ vec2 d = abs(p) - h + r; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r; }
float ext(float d2, float y, float h, float bev){ vec2 w = vec2(d2, abs(y) - h) + bev; return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - bev; }

/* ---- the chips ---- */
float layerY(float k){ return 0.0118 + k * 0.0236; }
// position in the chip's own frame: x along its length from the rivet, y up from its middle, z across
vec3 chipLocal(vec3 p, int i){
  vec4 c = uChip[i];
  vec3 q = p - R0;
  float ca = cos(c.x), sa = sin(c.x);
  float lx = ca * q.x - sa * q.z;
  float lz = sa * q.x + ca * q.z;
  float t = clamp(lx / 1.5, 0.0, 1.0);
  float y0 = layerY(c.w) * (1.0 - c.z * t) + c.y * t;  // a chip is lifted by its far end
  // a card bends to meet the table instead of folding at it
  float k = 0.02; y0 = 0.0112 + 0.5 * ((y0 - 0.0112) + sqrt((y0 - 0.0112) * (y0 - 0.0112) + k * k)) - 0.5 * k;
  return vec3(lx, q.y - y0, lz);
}
float sdChip(vec3 p, int i){
  vec3 l = chipLocal(p, i);
  float d2 = max(rb2(vec2(l.x - 0.67, l.z), vec2(0.8, 0.205), 0.034), 0.05 - length(l.xz));
  return ext(d2, l.y, 0.0102, 0.0034) * 0.85;
}
float sdRivet(vec3 p){
  vec3 q = p - R0;
  float top = layerY(5.0) + 0.012;
  float shaft = max(length(q.xz) - 0.038, abs(q.y - top * 0.5) - top * 0.5);
  vec3 e = (q - vec3(0.0, top, 0.0)) / vec3(0.074, 0.03, 0.074);
  float cap = (length(e) - 1.0) * 0.03;
  return min(shaft, max(cap, top - 0.004 - q.y));
}

/* ---- the board model ---- */
vec3 toB(vec3 p){ vec3 q = p - vec3(BP.x, 0.085, BP.z); float c = cos(LEAN), s = sin(LEAN); return vec3(q.x, c * q.y - s * q.z, s * q.y + c * q.z); }
float sdBase(vec3 p){ return ext(rb2(p.xz - BP.xz, vec2(0.98, 0.18), 0.03), p.y - 0.0425, 0.0425, 0.01); }
float partsW(vec3 b){ float d = 1e5;
  ${partsGLSL(false)}
  return d; }
float partsP(vec3 b){ float d = 1e5;
  ${partsGLSL(true)}
  return d; }

vec2 map(vec3 p){
  vec2 r = vec2(1e5, 0.0);
  // chips and rivet
  float bc = length(p.xz - R0.xz + vec2(-0.5, 0.25)) - 1.35;
  if (p.y > 0.26 || bc > 0.25){ r = vec2(max(bc, p.y - 0.24), 0.0); }
  else {
    for (int i = 0; i < 6; i++){
      float d = sdChip(p, i);
      if (d < r.x){ r = vec2(d, 1.0); gChip = i; }
    }
    float d = sdRivet(p); if (d < r.x) r = vec2(d, 2.0);
  }
  // board on its base
  vec3 b = toB(p);
  float bb = length(b - vec3(0.0, 0.6, 0.0)) - 1.15;
  if (bb > 0.25){ if (bb < r.x) r = vec2(bb, 0.0); return r; }
  float d = sdBase(p); if (d < r.x) r = vec2(d, 3.0);
  d = min(ext(rb2(vec2(b.x, b.y - 0.62), vec2(0.86, 0.62), 0.024), b.z, 0.02, 0.006), partsW(b));
  if (d < r.x) r = vec2(d, 4.0);
  d = partsP(b); if (d < r.x) r = vec2(d, 5.0);
  return r;
}
// the board, its base and the rivet: what the table needs to march for shadow (the chips are done exactly below)
float mapB(vec3 p){
  float d = sdRivet(p);
  vec3 b = toB(p);
  float bb = length(b - vec3(0.0, 0.6, 0.0)) - 1.15;
  if (bb > 0.25) return min(d, bb);
  d = min(d, sdBase(p));
  d = min(d, min(ext(rb2(vec2(b.x, b.y - 0.62), vec2(0.86, 0.62), 0.024), b.z, 0.02, 0.006), min(partsW(b), partsP(b))));
  return d;
}
float shadowB(vec3 ro, vec3 rd){
  float res = 1.0, t = 0.01;
  for (int i = 0; i < 32; i++){
    float h = mapB(ro + rd * t);
    res = min(res, 9.0 * h / t);
    t += clamp(h, 0.01 + t * 0.02, 0.25);
    if (res < 0.003 || t > 4.0) break;
  }
  res = clamp(res, 0.0, 1.0);
  return res * res * (3.0 - 2.0 * res);
}
// Each chip is a flat card a few millimetres up: slide the table point toward the sun to the chip's height and ask whether it lands on the card.
float chipShadow(vec3 p, float above){
  float s = 1.0;
  for (int i = 0; i < 6; i++){
    vec4 c = uChip[i];
    if (c.w <= above) continue;
    float hgt = layerY(c.w) * (1.0 - 0.5 * c.z) + c.y * 0.5 + 0.01 - p.y;
    if (hgt <= 0.0) continue;
    vec3 l = chipLocal(p + L * (hgt / L.y), i);
    float d = max(rb2(vec2(l.x - 0.67, l.z), vec2(0.8, 0.205), 0.034), 0.05 - length(l.xz));
    float pen = 0.003 + hgt * 0.35;
    s *= mix(0.08, 1.0, smoothstep(-pen, pen, d));
  }
  return s;
}
vec3 normal(vec3 p){
  vec2 e = vec2(1.0, -1.0) * 0.0009;
  return normalize(e.xyy * map(p + e.xyy).x + e.yyx * map(p + e.yyx).x + e.yxy * map(p + e.yxy).x + e.xxx * map(p + e.xxx).x);
}
vec2 march(vec3 ro, vec3 rd, float far){
  float t = 0.0; vec2 h = vec2(0.0);
  for (int i = 0; i < 110; i++){
    h = map(ro + rd * t);
    if (h.x < 0.00025 * (1.0 + t * 0.4) || t > far) break;
    t += h.x;
  }
  return vec2(t, (t > far || h.x > 0.01) ? 0.0 : h.y);
}
float shadow(vec3 ro, vec3 rd){
  float res = 1.0, t = 0.006;
  for (int i = 0; i < 36; i++){
    float h = map(ro + rd * t).x;
    res = min(res, 11.0 * h / t);
    t += clamp(h, 0.004 + t * 0.03, 0.25);
    if (res < 0.003 || t > 4.0) break;
  }
  res = clamp(res, 0.0, 1.0);
  return res * res * (3.0 - 2.0 * res);
}
float occ(vec3 p, vec3 n){
  float o = 0.0, s = 1.0;
  for (int i = 0; i < 5; i++){
    float h = 0.004 + 0.06 * float(i) / 4.0;
    o += max(h - map(p + n * h).x, 0.0) * s;
    s *= 0.75;
  }
  return clamp(1.0 - 4.0 * o, 0.0, 1.0);
}

// Leaves outside the window break the sunlight up at the edges of the table; the middle stays in full sun.
float leaves(vec3 p){
  vec2 pp = p.xz - L.xz / L.y * p.y;
  float sway = sin(uTime * 0.45) * 0.035;
  float g = fbm(pp * 1.25 + vec2(sway, sway * 0.6) + 3.0) + 0.25 * n2(pp * 5.0 + sway * 3.0);
  float leafy = smoothstep(0.52, 0.7, g);
  float reach = smoothstep(1.4, 3.0, length((p.xz - vec2(-0.2, -0.05)) * vec2(0.8, 1.15)));
  return 1.0 - 0.62 * leafy * reach;
}
vec3 fillL(vec3 n){ return mix(vec3(0.62, 0.6, 0.58), vec3(0.72, 0.78, 0.9), 0.5 + 0.5 * n.y); }
float rectL(vec3 ro, vec3 rd, vec3 c, vec3 n, vec2 hs, float soft){
  float dn = dot(rd, n); if (dn > -1e-4) return 0.0;
  float t = dot(c - ro, n) / dn; if (t < 0.0) return 0.0;
  vec3 q = ro + rd * t - c; float s = soft * t + 0.02;
  vec3 u = normalize(cross(vec3(0.0, 1.0, 0.0), n)), v = cross(n, u);
  vec2 d = abs(vec2(dot(q, u), dot(q, v))) - hs;
  return smoothstep(s, -s, d.x) * smoothstep(s, -s, d.y);
}
// The bright room around the table: what gloss, brass and wet paint reflect.
vec3 env(vec3 ro, vec3 rd, float rough){
  float soft = 0.03 + rough * 0.8;
  vec3 c = mix(vec3(1.25, 1.2, 1.12), vec3(1.5, 1.5, 1.52), smoothstep(-0.3 - rough * 0.3, 0.6 + rough * 0.3, rd.y));
  c *= 0.75 + 0.25 * smoothstep(-0.6, 0.4, rd.y);
  c += SUNC * 9.0 * rectL(ro, rd, L * 8.0, -L, vec2(1.8, 2.6), soft);
  c += vec3(0.95, 0.97, 1.0) * 2.4 * rectL(ro, rd, vec3(-5.0, 3.8, 6.0), normalize(vec3(5.0, -3.0, -6.0)), vec2(2.2, 1.6), soft + 0.05);
  return c;
}

vec3 sunlight(vec3 p, vec3 n, bool hq){
  float ndl = max(dot(n, L), 0.0);
  if (ndl <= 0.0) return vec3(0.0);
  float sh = hq ? shadow(p + n * 0.003, L) : 1.0;
  return SUNC * SUNI * ndl * sh * leaves(p);
}
float spec(vec3 n, vec3 rd, float rough){
  vec3 h = normalize(L - rd);
  float a = rough * rough;
  float nh = max(dot(n, h), 0.0);
  float dd = nh * nh * (a * a - 1.0) + 1.0;
  return a * a / (3.14159 * dd * dd) * max(dot(n, L), 0.0);
}
float fres(vec3 n, vec3 rd, float f0){ return f0 + (1.0 - f0) * pow(1.0 - max(dot(n, -rd), 0.0), 5.0); }

/* ---- materials ---- */
vec3 shadeChip(vec3 p, vec3 n, int i, vec3 rd, bool hq){
  vec3 l = chipLocal(p, i);
  vec4 c = uChip[i];
  float ca = cos(c.x), sa = sin(c.x);
  vec3 across = vec3(sa, 0.0, ca);
  vec3 along = vec3(ca, 0.0, -sa);
  bool top = n.y > 0.75 && l.y > 0.003;
  bool label = top && l.x > 1.0 && l.x < 1.43 && abs(l.z) < 0.168;
  vec3 alb; float rough = 0.62; float f0 = 0.035;
  if (label){
    vec2 uv = vec2((l.x - 1.0) / 0.43, (float(i) + (l.z + 0.168) / 0.336) / 6.0);
    alb = pow(texture(uLab, uv).rgb, vec3(2.2));
    rough = 0.5;
  } else if (top || l.y > 0.0045){
    // brushed paint: streaks run along the chip, with a little ridge where the bristles dragged
    float seed = float(i) * 13.1;
    vec2 sp = vec2(l.x * 2.2 + seed, l.z * 95.0);
    float s1 = n2(sp) * 0.62 + n2(sp * vec2(2.6, 2.7) + 4.0) * 0.38;
    float s2 = n2(sp + vec2(0.0, 0.18)) * 0.62 + n2((sp + vec2(0.0, 0.18)) * vec2(2.6, 2.7) + 4.0) * 0.38;
    float blot = n2(l.xz * vec2(9.0, 14.0) + seed);
    alb = uCol[i] * (0.9 + 0.17 * s1 + 0.06 * (blot - 0.5));
    if (top) n = normalize(n + across * (s2 - s1) * 0.9 + along * (blot - 0.5) * 0.04);
    rough = 0.55 - 0.1 * s1;
  } else {
    // the card core shows on the cut edges
    alb = CARD * (0.86 + 0.06 * n2(l.xz * 300.0));
    rough = 0.85;
  }
  float ao = hq ? occ(p, n) : 1.0;
  float sh = hq ? shadowB(p + n * 0.003, L) * chipShadow(p, c.w) : 1.0;
  vec3 col = alb * (SUNC * SUNI * max(dot(n, L), 0.0) * sh * leaves(p) + fillL(n) * ao);
  col += spec(n, rd, rough) * SUNC * SUNI * 0.25 * sh;
  col += fres(n, rd, f0) * env(p, reflect(rd, n), rough) * ao * 0.5;
  return col;
}
vec3 shadeRivet(vec3 p, vec3 n, vec3 rd, bool hq){
  vec3 brass = vec3(0.93, 0.66, 0.32);
  float ao = hq ? occ(p, n) : 1.0;
  vec3 r = reflect(rd, n);
  vec3 F = brass + (1.0 - brass) * pow(1.0 - max(dot(n, -rd), 0.0), 5.0);
  vec3 col = F * env(p, r, 0.22) * (0.35 + 0.65 * ao);
  col += F * spec(n, rd, 0.22) * SUNC * SUNI * (hq ? shadow(p + n * 0.003, L) : 1.0);
  col += brass * 0.08 * sunlight(p, n, false);
  return col;
}
// how far the wash has reached at a point on the board, and how wet the paint is there
vec3 wash(vec2 b){
  float d = length((b - vec2(-0.95, -0.05)) * vec2(1.0, 1.15));
  d += (fbm(b * 3.2 + 1.7) - 0.5) * 0.42 + (n2(b * 15.0 + 4.0) - 0.5) * 0.07;
  float k = smoothstep(uR + 0.012, uR - 0.012, d);
  float age = max(uR - d, 0.0);
  float wet = k * exp(-age * 1.3) * (1.0 - uDry);
  float rim = exp(-pow((d - uR + 0.035) / 0.04, 2.0)) * (1.0 - uDry) * step(0.02, uR);
  return vec3(k, wet, rim);
}
vec3 shadeBoard(vec3 p, vec3 n, bool painted, vec3 rd, bool hq){
  vec3 b = toB(p);
  float ao = hq ? occ(p, n) : 1.0;
  vec3 alb; float rough = 0.8; float wet = 0.0;
  if (painted){
    vec3 w = wash(b.xy);
    alb = mix(uOld, uNew, w.x);
    alb *= 1.0 - 0.3 * w.z;               // the bead of paint at the edge is thicker and darker
    alb *= 1.0 - 0.32 * w.y;               // wet paint reads deeper
    alb *= 0.97 + 0.06 * n2(b.xy * 140.0);
    wet = clamp(w.y + w.z, 0.0, 1.0);
    rough = mix(0.5, 0.07, wet);
  } else {
    alb = CARD * (0.97 + 0.03 * n2(b.xy * 220.0));
    // printed lines on the cards and in the picture block
    bool face = b.z > 0.035;
    if (face && b.y < 0.33 && b.y > 0.07){
      float cx = mod(b.x + 0.81, 0.54) - 0.27;
      float row = b.y - 0.13;
      float lines = step(abs(fract(row / 0.04) - 0.5), 0.17) * step(-0.25, cx) * step(cx, 0.15 - 0.14 * step(row, 0.05)) * step(row, 0.11) * step(-0.02, row);
      alb *= 1.0 - 0.32 * lines;
    }
    if (b.z > 0.065 && abs(b.x - 0.47) < 0.23 && abs(b.y - 0.8) < 0.16){
      // the picture block on the model is a soft grey hill under a pale sky
      float hill = smoothstep(0.0, 0.01, (b.y - 0.72) - 0.05 * sin(b.x * 9.0 + 1.0));
      alb = mix(vec3(0.55, 0.56, 0.55), vec3(0.83, 0.84, 0.85), hill);
    }
  }
  vec3 col = alb * (sunlight(p, n, hq) + fillL(n) * ao);
  // colour from the painted band reaches the white card round it
  if (!painted){
    vec3 w = wash(b.xy);
    vec3 nearC = mix(uOld, uNew, w.x);
    float near = smoothstep(0.32, 0.0, abs(b.y - 0.8) - 0.2) * step(abs(b.x), 0.82);
    col += alb * nearC * near * 0.12 * SUNI * (b.z > 0.03 ? 1.0 : 0.3);
  }
  float sh = hq ? shadow(p + n * 0.003, L) : 1.0;
  col += spec(n, rd, rough) * SUNC * SUNI * mix(0.15, 2.4, wet) * sh;
  col += fres(n, rd, mix(0.03, 0.05, wet)) * env(p, reflect(rd, n), rough) * ao * mix(0.4, 1.6, wet);
  if (painted){
    // wet paint holds a soft sheen of the bright room, broken where the film is thin
    float film = smoothstep(0.5, 0.78, fbm(b.xy * vec2(4.0, 11.0) + 2.0));
    col += vec3(0.95, 0.97, 1.0) * wet * film * 0.3 * (0.5 + 0.5 * sh);
  }
  return col;
}
vec3 shade(vec3 p, vec3 n, float id, vec3 rd, bool hq){
  if (id < 1.5) return shadeChip(p, n, gChip, rd, hq);
  if (id < 2.5) return shadeRivet(p, n, rd, hq);
  if (id < 3.5){
    float ao = hq ? occ(p, n) : 1.0;
    return CARD * 0.97 * (sunlight(p, n, hq) + fillL(n) * ao) + fres(n, rd, 0.03) * env(p, reflect(rd, n), 0.7) * 0.4;
  }
  return shadeBoard(p, n, id > 4.5, rd, hq);
}

/* ---- the table and the wall behind it ---- */
vec3 shadeTable(vec3 p, vec3 rd, float t){
  vec3 n = vec3(0.0, 1.0, 0.0);
  // painted oak: grain under a white finish
  float grain = n2(vec2(p.x * 1.6, p.z * 30.0 + n2(p.xz * 2.0) * 3.0));
  vec3 alb = TABLE * (0.975 + 0.04 * grain + 0.015 * (n2(p.xz * 60.0) - 0.5));
  float near = step(t, 12.0);
  float sh = near > 0.5 ? shadowB(p + n * 0.002, L) * chipShadow(p, -1.0) : 1.0;
  float ao = near > 0.5 ? occ(p, n) : 1.0;
  vec3 col = alb * (SUNC * SUNI * max(L.y, 0.0) * sh * leaves(p) + fillL(n) * ao);
  // coloured light thrown down by the painted model and by the chips
  float wf = clamp(uR / 2.3, 0.0, 1.0);
  vec3 bc = mix(uOld, uNew, wf);
  float dz = p.z - (BP.z + 0.16);
  float fr = step(0.0, dz) * exp(-dz * 2.6) * smoothstep(1.25, 0.55, abs(p.x - BP.x));
  col += alb * bc * fr * 1.3 * (0.4 + 0.6 * sh);
  for (int i = 0; i < 6; i++){
    vec3 l = chipLocal(p, i);
    float d = rb2(vec2(l.x - 0.67, l.z), vec2(0.8, 0.205), 0.034);
    col += alb * uCol[i] * exp(-max(d, 0.0) * 22.0) * step(0.0, d) * 0.4 * (0.3 + 0.7 * sh);
  }
  // a satin finish: a soft, faint mirror of the room
  float f = fres(n, rd, 0.02) * 0.5;
  col = mix(col, env(p, reflect(rd, n), 0.45), f);
  return col;
}
vec3 shadeWall(vec3 p, vec3 rd){
  vec3 n = vec3(0.0, 0.0, 1.0);
  vec3 alb = vec3(0.9, 0.885, 0.86) * (0.98 + 0.04 * n2(p.xy * 9.0));
  float ndl = max(dot(n, L), 0.0);
  return alb * (SUNC * SUNI * ndl * leaves(p) * 0.85 + fillL(n));
}

void main(){
  gPix = 2.0 * tan(uFov * 0.5) / uRes.y;
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 fw = normalize(uTarget - uCam), rgt = normalize(cross(fw, vec3(0.0, 1.0, 0.0))), up = cross(rgt, fw);
  vec3 rd = normalize(fw + (uv.x * rgt + uv.y * up) * 2.0 * tan(uFov * 0.5));
  vec3 ro = uCam;
  float tt = rd.y < -1e-5 ? -ro.y / rd.y : 1e9;
  float tw = rd.z < -1e-5 ? (WALLZ - ro.z) / rd.z : 1e9;
  bool tableFirst = tt < tw;
  float ts = min(tt, tw);
  vec2 hit = march(ro, rd, min(ts, 30.0));
  float t; vec3 col;
  if (hit.y > 0.5 && hit.x < ts){
    t = hit.x; vec3 p = ro + rd * t; gDist = t;
    float id = hit.y; int ci = gChip;
    vec3 n = normal(p); gChip = ci;
    col = shade(p, n, id, rd, true);
  } else if (ts < 1e8){
    t = ts; vec3 p = ro + rd * ts;
    col = tableFirst ? shadeTable(p, rd, ts) : shadeWall(p, rd);
  } else { t = 30.0; col = env(ro, rd, 0.3); }
  o = vec4(tone(col), clamp(t / 20.0, 0.0, 1.0));
}`;

const POST = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uSrc;
uniform vec2 uRes;
uniform float uFocus, uTime;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec4 c0 = texture(uSrc, vUv);
  float z = c0.a * 20.0;
  {
    vec2 e = 1.0 / uRes; vec3 Lm = vec3(0.299, 0.587, 0.114);
    float nw = dot(textureLod(uSrc, vUv + vec2(-e.x, -e.y), 0.0).rgb, Lm), ne = dot(textureLod(uSrc, vUv + vec2(e.x, -e.y), 0.0).rgb, Lm);
    float sw = dot(textureLod(uSrc, vUv + vec2(-e.x, e.y), 0.0).rgb, Lm), se = dot(textureLod(uSrc, vUv + e, 0.0).rgb, Lm), lm = dot(c0.rgb, Lm);
    float lo = min(lm, min(min(nw, ne), min(sw, se))), hi = max(lm, max(max(nw, ne), max(sw, se)));
    vec2 dir = vec2(-((nw + ne) - (sw + se)), (nw + sw) - (ne + se));
    float rcp = 1.0 / (min(abs(dir.x), abs(dir.y)) + max((nw + ne + sw + se) * 0.03125, 0.0078));
    dir = clamp(dir * rcp, -8.0, 8.0) * e;
    vec3 a = 0.5 * (textureLod(uSrc, vUv + dir * (1.0 / 3.0 - 0.5), 0.0).rgb + textureLod(uSrc, vUv + dir * (2.0 / 3.0 - 0.5), 0.0).rgb);
    vec3 b = a * 0.5 + 0.25 * (textureLod(uSrc, vUv - dir * 0.5, 0.0).rgb + textureLod(uSrc, vUv + dir * 0.5, 0.0).rgb);
    float lb = dot(b, Lm);
    c0.rgb = (lb < lo || lb > hi) ? a : b;
  }
  float px = uRes.y / 720.0;
  float coc = clamp(abs(z - uFocus) / max(z, 0.1) * (z < uFocus ? 9.0 : 6.5) - 0.35, 0.0, 7.0) * px;
  vec3 acc = c0.rgb; float ws = 1.0;
  float j = hash(gl_FragCoord.xy) * 6.283;
  float lod = log2(max(coc / 3.0, 1.0));
  for (int i = 0; i < 14; i++){
    float fi = (float(i) + 0.5) / 14.0;
    float a = float(i) * 2.39996 + j;
    vec2 off = vec2(cos(a), sin(a)) * sqrt(fi) * coc / uRes;
    acc += textureLod(uSrc, vUv + off, lod).rgb; ws += 1.0;
  }
  vec3 col = acc / ws;
  vec3 bl = textureLod(uSrc, vUv, 4.0).rgb * 0.5 + textureLod(uSrc, vUv, 6.0).rgb * 0.5;
  col += bl * bl * 0.03;
  vec2 v = vUv - 0.5;
  col *= 1.0 - dot(v, v) * 0.16;
  float g = hash(gl_FragCoord.xy + fract(uTime) * 91.7) - 0.5;
  col += g * 0.018 * (1.0 - 0.4 * col);
  o = vec4(col, 1.0);
}`;

/* ---------- motion ---------- */

type Spring = { x: number; v: number; t: number; k: number; c: number };
const spring = (x: number, k: number, c: number): Spring => ({ x, v: 0, t: x, k, c });
const stepSpring = (s: Spring, dt: number) => {
  s.v += (-s.k * (s.x - s.t) - s.c * s.v) * dt;
  s.x += s.v * dt;
};

/** Draw the printed name strip of every chip into one strip of labels, one row per chip. */
function printLabels(cv: HTMLCanvasElement) {
  const c = cv.getContext("2d");
  if (!c) return;
  const W = cv.width;
  const H = cv.height / CHIPS.length;
  CHIPS.forEach((chip, i) => {
    const y = i * H;
    c.fillStyle = "#EFEBE3";
    c.fillRect(0, y, W, H);
    c.fillStyle = chip.hex;
    c.fillRect(0, y, 10, H);
    c.fillStyle = "#1A1C22";
    c.textBaseline = "alphabetic";
    c.font = `800 62px ${FONT}`;
    (c as unknown as { letterSpacing: string }).letterSpacing = "-2px";
    const [a, b] = chip.name.split(" ");
    c.fillText(a, 34, y + 86);
    c.fillText(b ?? "", 34, y + 146);
    c.font = `600 30px ${MONO}`;
    (c as unknown as { letterSpacing: string }).letterSpacing = "0px";
    c.fillStyle = "#4A4E58";
    c.fillText(chip.code, 36, y + H - 26);
  });
}

export default function PaintChipFanColourWash() {
  const reduce = useReducedMotion();
  const [pick, setPick] = useState(0);
  const [ready, setReady] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const want = useRef(0);
  const api = useRef<{ choose: (i: number) => void; at: (x: number, y: number) => number } | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance" });
    if (!gl) return;
    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
      return s;
    };
    const link = (fs: string) => {
      const p = gl.createProgram()!;
      gl.attachShader(p, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
      gl.bindAttribLocation(p, 0, "a");
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || "link");
      return p;
    };
    let scene: WebGLProgram;
    let post: WebGLProgram;
    try {
      scene = link(SCENE);
      post = link(POST);
    } catch (e) {
      console.error(e);
      return;
    }
    const U = (p: WebGLProgram, n: string) => gl.getUniformLocation(p, n);
    const su = Object.fromEntries(["uRes", "uCam", "uTarget", "uFov", "uTime", "uChip", "uCol", "uOld", "uNew", "uR", "uDry", "uLab", "R0", "BP"].map((n) => [n, U(scene, n)]));
    const pu = Object.fromEntries(["uSrc", "uRes", "uFocus", "uTime"].map((n) => [n, U(post, n)]));

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // printed names
    const labCanvas = document.createElement("canvas");
    labCanvas.width = 512;
    labCanvas.height = 256 * CHIPS.length;
    printLabels(labCanvas);
    const labTex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, labTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, labCanvas);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const COLS = new Float32Array(CHIPS.flatMap((c) => linear(c.hex)));
    // chip 0 is on top of the stack
    const layer = CHIPS.map((_, i) => CHIPS.length - 1 - i);
    let chosen = 0;
    const ang = CHIPS.map((_, i) => spring(i === 0 ? OUT : FAN[i], 70, 10.5));
    const lift = CHIPS.map(() => spring(0, 120, 13));
    const lie = CHIPS.map((_, i) => spring(i === 0 ? LIE_OUT : LIE_DECK, 60, 14));
    const old = linear(CHIPS[0].hex);
    const nxt = linear(CHIPS[0].hex);
    let spread = 9;
    let spreading = false;
    let washAge = 99;
    const knock = spring(0, 90, 10);
    const cam = { ax: 0, ay: 0, tx: 0, ty: 0 };
    let demo = !reduce;
    let clock = 0;
    let idleAt = HOLD;
    let wake = Infinity;
    let cues: { at: number; fn: () => void }[] = [];
    let dirty = true;
    const at = (delay: number, fn: () => void) => {
      cues.push({ at: clock + delay, fn });
      cues.sort((a, b) => a.at - b.at);
    };
    // the colour on the model right now, mixed by how far the wash has gone
    const currentMix = () => {
      const w = Math.min(1, Math.max(0, spread / 2.3));
      return old.map((o, k) => o + (nxt[k] - o) * w);
    };
    const startWash = (j: number) => {
      const now = currentMix();
      old.splice(0, 3, ...now);
      nxt.splice(0, 3, ...linear(CHIPS[j].hex));
      spread = 0;
      spreading = true;
      washAge = 0;
      knock.v += 1.4;
      setPick(j);
    };
    const choose = (j: number) => {
      if (j === chosen) return;
      const prev = chosen;
      chosen = j;
      want.current = j;
      if (reduce) {
        ang.forEach((s, i) => (s.x = s.t = i === j ? OUT : FAN[i]));
        lie.forEach((s, i) => (s.x = s.t = i === j ? LIE_OUT : LIE_DECK));
        old.splice(0, 3, ...linear(CHIPS[j].hex));
        nxt.splice(0, 3, ...linear(CHIPS[j].hex));
        spread = 9;
        washAge = 99;
        setPick(j);
        dirty = true;
        return;
      }
      cues = [];
      // the old chip goes home; the new one lifts, hangs back a beat, then swings out and lies down
      ang[prev].t = FAN[prev];
      lie[prev].t = LIE_DECK;
      lift[prev].t = 0.02;
      at(0.35, () => (lift[prev].t = 0));
      // high enough at the tip to ride over every chip above it in the stack
      lift[j].t = 0.05 + (CHIPS.length - 1 - layer[j]) * 0.03;
      ang[j].t = FAN[j] + 0.06;
      at(0.2, () => (ang[j].t = OUT));
      at(0.62, () => {
        lift[j].t = 0;
        lie[j].t = LIE_OUT;
      });
      at(0.78, () => startWash(j));
    };
    const quiet = () => {
      demo = false;
      idleAt = Infinity;
      wake = clock + 14;
    };

    // render target
    const fbo = gl.createFramebuffer();
    const fbTex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, fbTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    let scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, window.devicePixelRatio || 1));
    let cssW = 1;
    let cssH = 1;
    let phone = false;
    let bw = 0;
    let bh = 0;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      cssW = Math.max(1, r.width);
      cssH = Math.max(1, r.height);
      phone = cssW < 768;
      const s = Math.min(scale, Math.sqrt(PIXEL_BUDGET / (cssW * cssH)));
      const w = Math.round(cssW * s);
      const h = Math.round(cssH * s);
      if (w !== bw || h !== bh) {
        bw = w;
        bh = h;
        canvas.width = w;
        canvas.height = h;
        gl.bindTexture(gl.TEXTURE_2D, fbTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fbTex, 0);
      }
      dirty = true;
    };
    resize();

    const CH = new Float32Array(24);
    let camState = { pos: [0, 0, 0], tgt: [0, 0, 0], fov: 0.5 };
    let time = 0;
    const draw = () => {
      const wide = cssW / cssH;
      const fov = phone ? 0.5 : 0.44;
      const tgt = phone ? [0.02, 0.26, 0.32] : [-0.22, 0.4, 0.02];
      const az = (phone ? -0.06 : -0.16) + cam.ax * 0.06 + Math.sin(time * 0.17) * 0.012;
      const el = (phone ? 0.98 : 0.56) - cam.ay * 0.03 + Math.sin(time * 0.23 + 1) * 0.006;
      const dist = (phone ? 5.0 / Math.max(0.42, wide) : 7.0 * Math.max(1, 1.6 / wide)) * (1 - 0.008 * knock.x);
      const pos = [tgt[0] + dist * Math.sin(az) * Math.cos(el), tgt[1] + dist * Math.sin(el), tgt[2] + dist * Math.cos(az) * Math.cos(el)];
      camState = { pos, tgt, fov };
      // focus between the model and the chip that is out
      const fpt = phone ? [0.0, 0.25, 0.2] : [-0.1, 0.25, -0.1];
      const focus = Math.hypot(fpt[0] - pos[0], fpt[1] - pos[1], fpt[2] - pos[2]);
      for (let i = 0; i < CHIPS.length; i++) {
        CH[i * 4] = ang[i].x;
        CH[i * 4 + 1] = Math.max(0, lift[i].x);
        CH[i * 4 + 2] = Math.min(1, Math.max(0, lie[i].x));
        CH[i * 4 + 3] = layer[i];
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, bw, bh);
      gl.useProgram(scene);
      gl.uniform2f(su.uRes, bw, bh);
      gl.uniform3f(su.uCam, pos[0], pos[1], pos[2]);
      gl.uniform3f(su.uTarget, tgt[0], tgt[1], tgt[2]);
      gl.uniform1f(su.uFov, fov);
      gl.uniform1f(su.uTime, reduce ? 0 : time);
      gl.uniform4fv(su.uChip, CH);
      gl.uniform3fv(su.uCol, COLS);
      const place = phone ? PLACE.phone : PLACE.wide;
      gl.uniform3f(su.R0, place.rivet[0], 0, place.rivet[1]);
      gl.uniform3f(su.BP, place.model[0], 0, place.model[1]);
      gl.uniform3f(su.uOld, old[0], old[1], old[2]);
      gl.uniform3f(su.uNew, nxt[0], nxt[1], nxt[2]);
      gl.uniform1f(su.uR, spread);
      gl.uniform1f(su.uDry, Math.min(1, Math.max(0, (washAge - SPREAD) / 1.6)));
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, labTex);
      gl.uniform1i(su.uLab, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, bw, bh);
      gl.useProgram(post);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fbTex);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.uniform1i(pu.uSrc, 0);
      gl.uniform2f(pu.uRes, bw, bh);
      gl.uniform1f(pu.uFocus, focus);
      gl.uniform1f(pu.uTime, reduce ? 0 : time);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    // which chip is under a point on screen: project the middle of each painted face and take the nearest
    const project = (x: number, y: number, z: number) => {
      const { pos, tgt, fov } = camState;
      const fw = [tgt[0] - pos[0], tgt[1] - pos[1], tgt[2] - pos[2]];
      const fl = Math.hypot(fw[0], fw[1], fw[2]);
      fw[0] /= fl; fw[1] /= fl; fw[2] /= fl;
      const rl = Math.hypot(fw[2], fw[0]);
      const rg = [-fw[2] / rl, 0, fw[0] / rl];
      const up = [rg[1] * fw[2] - rg[2] * fw[1], rg[2] * fw[0] - rg[0] * fw[2], rg[0] * fw[1] - rg[1] * fw[0]];
      const v = [x - pos[0], y - pos[1], z - pos[2]];
      const depth = v[0] * fw[0] + v[1] * fw[1] + v[2] * fw[2];
      const k = cssH / (depth * 2 * Math.tan(fov / 2));
      return [cssW / 2 + (v[0] * rg[0] + v[2] * rg[2]) * k, cssH / 2 - (v[0] * up[0] + v[1] * up[1] + v[2] * up[2]) * k];
    };
    const chipAt = (sx: number, sy: number) => {
      let best = -1;
      let bd = 1e9;
      CHIPS.forEach((_, i) => {
        for (const along of [0.45, 0.85, 1.25]) {
          const a = ang[i].x;
          const rv = (phone ? PLACE.phone : PLACE.wide).rivet;
          const [px, py] = project(rv[0] + Math.cos(a) * along, 0.06, rv[1] - Math.sin(a) * along);
          const d = Math.hypot(px - sx, py - sy) - layer[i] * 2;
          if (d < bd) {
            bd = d;
            best = i;
          }
        }
      });
      return bd < 70 ? best : -1;
    };

    api.current = {
      choose: (j) => {
        quiet();
        choose(j);
        kick();
      },
      at: chipAt,
    };

    let raf = 0;
    let last = 0;
    let onScreen = true;
    let slow = 0;
    let first = true;
    const frame = (now: number) => {
      raf = 0;
      const raw = last ? (now - last) / 1000 : 0.016;
      last = now;
      const dt = Math.min(raw, 0.1);
      if (reduce) {
        if (dirty) {
          dirty = false;
          draw();
        }
      } else {
        clock += dt;
        time += dt;
        while (cues.length && cues[0].at <= clock) cues.shift()!.fn();
        if (clock > wake) {
          wake = Infinity;
          demo = true;
          idleAt = clock + 1.2;
        }
        if (demo && clock > idleAt) {
          choose((chosen + 1) % CHIPS.length);
          idleAt = clock + HOLD;
        }
        if (spreading) {
          washAge += dt;
          const u = Math.min(1, washAge / SPREAD);
          spread = 2.6 * (1 - Math.pow(1 - u, 1.6));
          if (u >= 1) spreading = false;
        } else washAge += dt;
        for (let n = 0; n < 4; n++) {
          const h = dt / 4;
          ang.forEach((s) => stepSpring(s, h));
          lift.forEach((s) => stepSpring(s, h));
          lie.forEach((s) => stepSpring(s, h));
          stepSpring(knock, h);
        }
        const kc = 1 - Math.exp(-dt * 3);
        cam.ax += (cam.tx - cam.ax) * kc;
        cam.ay += (cam.ty - cam.ay) * kc;
        draw();
        if (raw > 0.03) slow++;
        else slow = Math.max(0, slow - 1);
        if (slow > 24 && scale > MIN_SCALE) {
          scale = Math.max(MIN_SCALE, scale * 0.84);
          slow = 0;
          resize();
        }
      }
      if (first) {
        first = false;
        setReady(true);
      }
      if (onScreen && !document.hidden && (!reduce || dirty)) raf = requestAnimationFrame(frame);
    };
    function kick() {
      dirty = true;
      if (!raf && onScreen && !document.hidden) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    }
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      kick();
    });
    io.observe(root);
    const ro = new ResizeObserver(() => {
      resize();
      kick();
    });
    ro.observe(canvas);
    const onVis = () => kick();
    document.addEventListener("visibilitychange", onVis);
    const onMove = (e: PointerEvent) => {
      if (reduce) return;
      const r = root.getBoundingClientRect();
      cam.tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      cam.ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
      const r2 = canvas.getBoundingClientRect();
      canvas.style.cursor = chipAt(e.clientX - r2.left, e.clientY - r2.top) >= 0 ? "pointer" : "";
    };
    const onLeave = () => {
      cam.tx = 0;
      cam.ty = 0;
    };
    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    const onLost = (e: Event) => {
      e.preventDefault();
      setReady(false);
      cancelAnimationFrame(raf);
      api.current = null;
    };
    canvas.addEventListener("webglcontextlost", onLost);
    kick();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("webglcontextlost", onLost);
      api.current = null;
      gl.deleteTexture(labTex);
      gl.deleteTexture(fbTex);
      gl.deleteFramebuffer(fbo);
      gl.deleteBuffer(quad);
      gl.deleteProgram(scene);
      gl.deleteProgram(post);
    };
  }, [reduce]);

  const choose = (i: number) => {
    want.current = i;
    if (api.current) api.current.choose(i);
    else setPick(i);
  };
  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = api.current?.at(e.clientX - r.left, e.clientY - r.top) ?? -1;
    if (i >= 0) choose(i);
  };
  const onKeys = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (want.current + step + CHIPS.length) % CHIPS.length;
    choose(next);
    (e.currentTarget.querySelectorAll("button")[next] as HTMLElement | undefined)?.focus();
  };
  const chip = CHIPS[pick];

  return (
    <section ref={rootRef} className="relative isolate h-[720px] w-full overflow-hidden md:h-[740px]" style={{ backgroundColor: "#E9E6E0", color: INK, fontFamily: FONT }}>
      {/* The still: a fan of chips and the model in the chosen colour. Shown before the renderer starts and wherever it cannot run. */}
      <div aria-hidden="true" className={`absolute inset-0 transition-opacity duration-700 ${ready ? "pointer-events-none opacity-0" : "opacity-100"}`} style={{ background: "radial-gradient(120% 90% at 62% 40%, #F7F5F0 0%, #ECE9E3 55%, #DCD8D0 100%)" }}>
        <div className="absolute left-1/2 top-[44%] h-[300px] w-[340px] -translate-x-[8%] -translate-y-1/2 md:left-[58%] md:top-[46%] md:h-[340px] md:w-[460px] md:-translate-x-[10%]">
          <div className="absolute inset-0 rounded-[6px] bg-[#F3F1EC]" style={{ transform: "perspective(900px) rotateX(14deg)", boxShadow: "0 1px 0 #fff inset, 30px 46px 60px -26px rgba(60,52,40,0.45), 6px 10px 16px -6px rgba(60,52,40,0.3)" }}>
            <div className="absolute left-[6%] right-[6%] top-[5%] flex items-center gap-[4%]">
              <span className="h-3 w-3 rounded-full bg-white shadow" />
              <span className="ml-auto h-1.5 w-8 rounded-full bg-[#DAD6CE]" />
              <span className="h-1.5 w-8 rounded-full bg-[#DAD6CE]" />
              <span className="h-4 w-14 rounded-full transition-colors duration-700 motion-reduce:transition-none" style={{ backgroundColor: chip.hex }} />
            </div>
            <div className="absolute left-[6%] right-[6%] top-[15%] h-[34%] rounded-[3px] transition-colors duration-700 motion-reduce:transition-none" style={{ backgroundColor: chip.hex, boxShadow: "0 3px 6px -2px rgba(0,0,0,0.25)" }}>
              <span className="absolute left-[6%] top-[26%] h-[16%] w-[46%] rounded-sm bg-white shadow" />
              <span className="absolute left-[6%] top-[52%] h-[16%] w-[34%] rounded-sm bg-white shadow" />
              <span className="absolute right-[4%] top-[10%] h-[80%] w-[30%] rounded-sm bg-[#C9CBCB] shadow-md" />
            </div>
            <div className="absolute left-[6%] top-[55%] flex gap-2">
              <span className="h-5 w-20 rounded-full transition-colors duration-700 motion-reduce:transition-none" style={{ backgroundColor: chip.hex }} />
              <span className="h-5 w-16 rounded-full bg-white shadow" />
            </div>
            <div className="absolute bottom-[8%] left-[6%] right-[6%] grid grid-cols-3 gap-[4%]">
              {[0, 1, 2].map((k) => (
                <span key={k} className="h-14 overflow-hidden rounded-[3px] bg-white shadow">
                  <span className="block h-3 transition-colors duration-700 motion-reduce:transition-none" style={{ backgroundColor: chip.hex }} />
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="absolute bottom-[26%] left-[8%] h-[40px] w-[40px] md:bottom-[18%] md:left-[16%]">
          {CHIPS.map((c, i) => (
            <span
              key={c.name}
              className="absolute left-[20px] top-[20px] h-[46px] w-[200px] origin-left rounded-[8px] md:h-[54px] md:w-[250px]"
              style={{ backgroundColor: c.hex, transform: `translateY(-50%) rotate(${i === pick ? -14 : -98 + i * 9}deg)`, boxShadow: "0 1px 0 rgba(255,255,255,0.35) inset, 6px 10px 14px -6px rgba(40,30,20,0.45)", zIndex: CHIPS.length - i }}
            />
          ))}
          <span className="absolute left-[8px] top-[8px] z-10 h-6 w-6 rounded-full" style={{ background: "radial-gradient(circle at 35% 30%, #FBE3A6, #C08A3E 55%, #7A5422)", boxShadow: "0 2px 4px rgba(0,0,0,0.35)" }} />
        </div>
      </div>

      <canvas ref={canvasRef} aria-hidden="true" onClick={onCanvasClick} className={`absolute inset-0 h-full w-full touch-manipulation transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`} />

      <div className="pointer-events-none absolute left-5 right-5 top-5 md:left-10 md:right-auto md:top-9">
        <p className="flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#0B0D12]/60 md:text-[11px]">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: BLUE }} />
          Colour <span className="text-[#0B0D12]/30">/</span> one move
        </p>
        <div className="relative mt-1.5 h-[52px] overflow-hidden md:mt-2 md:h-[96px] md:w-[620px]">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.h2
              key={chip.name}
              initial={reduce ? { opacity: 0 } : { y: "75%", opacity: 0 }}
              animate={{ y: "0%", opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { y: "-55%", opacity: 0 }}
              transition={reduce ? { duration: 0.01 } : { y: { type: "spring", stiffness: 200, damping: 22 }, opacity: { duration: 0.26 } }}
              className="absolute left-0 top-0 whitespace-nowrap text-[46px] font-extrabold leading-[1] tracking-[-0.055em] md:text-[92px]"
            >
              {chip.name}
            </motion.h2>
          </AnimatePresence>
        </div>
        <p className="mt-1 flex items-center gap-3 text-[13px] font-medium tracking-tight text-[#0B0D12]/65 md:mt-2 md:text-[16px]">
          <span style={{ fontFamily: MONO }} className="text-[12px] tracking-[0.08em] md:text-[13px]">{chip.hex.toUpperCase()}</span>
          <span>{chip.note}</span>
        </p>
      </div>

      <div className="absolute inset-x-3 bottom-4 z-10 flex flex-col items-center gap-2 md:inset-x-auto md:bottom-9 md:right-10 md:items-end md:gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#0B0D12]/55 md:text-[11px]">Take a chip</span>
        <div
          role="radiogroup"
          aria-label="Paint colour for the homepage model"
          onKeyDown={onKeys}
          className="grid grid-cols-3 gap-1 rounded-[22px] p-1 md:flex md:rounded-full"
          style={{ backgroundColor: "rgba(250,249,246,0.78)", boxShadow: "0 0 0 1px rgba(11,13,18,0.08), 0 14px 30px -14px rgba(40,34,24,0.4)", backdropFilter: "blur(10px)" }}
        >
          {CHIPS.map((c, i) => (
            <button
              key={c.name}
              type="button"
              role="radio"
              aria-checked={i === pick}
              tabIndex={i === pick ? 0 : -1}
              onClick={() => choose(i)}
              className="relative flex h-11 items-center gap-2 whitespace-nowrap rounded-full pl-2.5 pr-3.5 text-[13px] font-bold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0D12] focus-visible:ring-offset-2 md:text-[14px]"
              style={{ color: INK }}
            >
              {i === pick && (
                <motion.span layoutId="paint-chip-fan-pill" className="absolute inset-0 rounded-full bg-white" style={{ boxShadow: "0 0 0 1px rgba(11,13,18,0.1), 0 6px 14px -6px rgba(40,34,24,0.45)" }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 32 }} />
              )}
              <span className="relative h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: c.hex, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.12)" }} />
              <span className="relative">{c.name}</span>
            </button>
          ))}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {chip.name} paint, {chip.hex}, now on the buttons, headline band and card tops of the homepage model. {chip.note}
      </p>
    </section>
  );
}
