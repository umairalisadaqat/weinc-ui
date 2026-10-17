import { useEffect, useRef, useState } from "react";

// Everything a visitor would edit first.
const product = {
  maker: "Holm & Ash",
  kind: "Stoneware, thrown by hand",
  name: ["Daily", "Mug"],
  price: "$38",
  cta: "Add to bag",
  note: "350 ml, dishwasher safe",
};
// The glazes on offer. `rgb` is the fired colour in linear light (0 to 1); `css` is the same colour for the plain-HTML version.
const glazes = [
  { name: "Cobalt", rgb: [0.006, 0.03, 0.34], css: "#1f45c8" },
  { name: "Rose", rgb: [0.72, 0.27, 0.27], css: "#eba6a4" },
  { name: "Celadon", rgb: [0.12, 0.29, 0.2], css: "#6fa888" },
  { name: "Oat", rgb: [0.72, 0.62, 0.45], css: "#ead9bb" },
  { name: "Ink", rgb: [0.012, 0.013, 0.02], css: "#23252c" },
];
// Colours of the set, in linear light.
const PAPER = [0.9, 0.36, 0.012]; // the paper sweep
const PLINTH = [0.93, 0.17, 0.035]; // the round card the mug stands on
const CLAY = [0.5, 0.35, 0.23]; // the bare foot of the mug
const LINER = [0.84, 0.78, 0.66]; // the glaze inside it
const HERO = -0.5; // resting turn of the mug in radians (the handle points right and a little toward the lens)
const POUR = 1.9; // seconds a new glaze takes to run down
const FONT = '"Inter Tight", "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';

const v3 = (c: number[]) => `vec3(${c.map((n) => n.toFixed(4)).join(", ")})`;

// Where the camera stands for a frame of this size, and where the five glaze dishes sit on the floor.
function frameOf(w: number, h: number) {
  const desk = w >= 1024, wide = w >= 768, aspect = w / h;
  const dist = 8.4, el = desk ? 0.33 : 0.36;
  const foc = desk ? Math.min(2.8, 1.66 * aspect) : wide ? 1.9 * aspect : Math.min(2.4, (dist * aspect) / 3.12);
  const tgt = [0, 0.72, 0];
  const cam = [0, tgt[1] + dist * Math.sin(el), -dist * Math.cos(el)];
  const fx = desk ? 0.655 : wide ? 0.63 : 0.5, fy = desk ? 0.4 : wide ? 0.4 : 0.25;
  const shift = [(fx - 0.5) * aspect, 0.5 - fy];
  const span = desk ? [-33, 47] : wide ? [-36, 42] : [-44, 44], rad = desk ? 1.7 : wide ? 1.7 : 1.56;
  const dishes = glazes.map((_, i) => {
    const a = ((span[0] + ((span[1] - span[0]) * i) / (glazes.length - 1)) * Math.PI) / 180;
    return [rad * Math.sin(a), -rad * Math.cos(a)];
  });
  // the same lens in plain arithmetic, so the buttons can sit exactly over the dishes
  const fw = [0, -Math.sin(el), Math.cos(el)], up = [0, Math.cos(el), Math.sin(el)];
  const project = (x: number, y: number, z: number) => {
    const v = [x - cam[0], y - cam[1], z - cam[2]];
    const d = v[1] * fw[1] + v[2] * fw[2];
    return { x: w / 2 + ((v[0] / d) * foc + shift[0]) * h, y: h / 2 - (((v[1] * up[1] + v[2] * up[2]) / d) * foc + shift[1]) * h, k: (foc / d) * h };
  };
  return { dist, el, foc, tgt, cam, shift, dishes, project };
}

const VERT = `ATTR vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }`;

const TONE = `
vec3 tone(vec3 x){ vec3 c = 1.0 - exp(-max(x, 0.0) * 1.0); c = mix(c, c * c * (3.0 - 2.0 * c), 0.5); return pow(c, vec3(1.0 / 2.2)); }
`;

// The photograph: a paper sweep in hard window light, a hand-thrown mug and five dishes of wet glaze.
const SCENE = `
precision highp float;
uniform vec2 uRes; uniform vec4 uJit; uniform float uSeed; uniform float uDirect;
uniform vec3 uCam; uniform vec3 uTgt; uniform float uFoc; uniform vec2 uShift; uniform float uFocus;
uniform float uRot; uniform float uLift; uniform vec3 uSun;
uniform vec3 uOld; uniform vec3 uNew; uniform float uProg; uniform float uBead; uniform float uGseed;
uniform vec3 uDish[5]; uniform vec3 uTint[5]; uniform float uRipT;
vec3 gRnd;
const float ZW = 3.4; const float RC = 1.2; const float TOP = 9.0; const float TOPR = 1.5;
const float R = 0.7; const float YC = 0.66; const float HY = 0.78; const float YTOP = 1.22; const float WALL = 0.06; const float PH = 0.13; const float PR = 1.2;
const vec3 PAPER = ${v3(PAPER)}; const vec3 PLINTH = ${v3(PLINTH)}; const vec3 CLAY = ${v3(CLAY)}; const vec3 LINER = ${v3(LINER)};
const vec3 SUNC = vec3(1.0, 0.95, 0.86); const float SUNI = 2.7;
${TONE}
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float h31(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float n2(vec2 x){ vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float smin(float a, float b, float k){ float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }
float smax(float a, float b, float k){ return -smin(-a, -b, k); }

// The mug has its own frame: it turns about its axis and can leave the floor.
vec3 toLocalDir(vec3 v){ float s = sin(uRot); float c = cos(uRot); return vec3(c * v.x + s * v.z, v.y, -s * v.x + c * v.z); }
vec3 toWorldDir(vec3 v){ float s = sin(uRot); float c = cos(uRot); return vec3(c * v.x - s * v.z, v.y, s * v.x + c * v.z); }
vec3 toLocal(vec3 p){ return toLocalDir(vec3(p.x, p.y - uLift - PH, p.z)); }

// Where the glaze stops above the bare foot, and how far a fresh pour has run, at each angle round the mug.
float gline(float a){ return 0.25 + 0.03 * sin(a * 2.0 + 0.7) + 0.017 * sin(a * 5.0 + 2.1) + 0.008 * sin(a * 11.0 + 4.0); }
// 1 down the middle of a run of glaze, 0 between runs: tongues with round ends, not icicles
float runs(float a){ return smoothstep(0.3, 0.8, 0.5 + 0.5 * sin(a * 9.0 + uGseed * 1.7)) * (0.55 + 0.45 * sin(a * 2.0 + uGseed * 3.1)); }
float gfront(float a){
  float n = 0.3 * (0.5 + 0.5 * sin(a * 3.0 + uGseed)) + 0.3 * smoothstep(0.4, 0.9, 0.5 + 0.5 * sin(a * 5.0 + uGseed * 2.3)) + 0.55 * runs(a);
  float x = clamp(uProg * (1.0 + 0.95 * n), 0.0, 1.0);
  float e = x * x * (3.0 - 2.0 * x);
  return mix(YTOP + 0.06, gline(a), 1.0 - pow(1.0 - e, 1.7));
}
// The thrown shape before it is hollowed: a soft barrel with no flat anywhere on its side, standing on a cut foot.
float dShape(vec3 q){
  vec2 w = vec2(length(q.xz) / R, abs(q.y - YC) / HY);
  float f = pow(pow(w.x, 2.5) + pow(w.y, 2.5), 0.4);
  return smax((f - 1.0) * 0.64, -q.y, 0.07);
}
float dMug(vec3 q){
  float o = dShape(q);
  vec3 h = q - vec3(R + 0.07, 0.73, 0.0);
  float ring = length(vec2(h.x * 1.12, h.y * 0.9)) - 0.33;
  float hd = length(vec2(ring, h.z * 0.66)) - 0.062;
  float solid = smin(o, hd, 0.1);
  // glaze has thickness: a lip where it stops, and a fat bead riding the front of a pour
  if (o > -0.03) {
    float a = atan(q.z, q.x); float yg = gline(a);
    float t = 0.007 * smoothstep(yg - 0.02, yg + 0.012, q.y);
    if (uBead > 0.001) { float dy = q.y - gfront(a); t += uBead * ((0.011 + 0.012 * runs(a)) * exp(-dy * dy * 380.0) + 0.004 * smoothstep(-0.02, 0.05, dy)); }
    solid -= t;
  }
  return smax(max(solid, -(o + WALL)), q.y - YTOP, 0.022);
}
vec3 nMug(vec3 q){ vec2 e = vec2(0.0018, -0.0018); return normalize(e.xyy * dMug(q + e.xyy) + e.yyx * dMug(q + e.yyx) + e.yxy * dMug(q + e.yxy) + e.xxx * dMug(q + e.xxx)); }

// Five small dishes of glaze on the floor.
float dDishAt(vec3 p, vec2 c){
  float r = length(p.xz - c);
  vec2 w = vec2(r - 0.235 + 0.022 + 0.3 * (0.08 - p.y), abs(p.y - 0.04) - 0.04 + 0.022);
  float d = min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - 0.022;
  vec2 v = vec2(r - 0.205, 0.064 - p.y);
  return smax(d, -(min(max(v.x, v.y), 0.0) + length(max(v, 0.0))), 0.01);
}
float dDish(vec3 p){
  float best = 1e9; vec2 c = vec2(0.0);
  for (int i = 0; i < 5; i++) { vec2 o = p.xz - uDish[i].xy; float d2 = dot(o, o); if (d2 < best) { best = d2; c = uDish[i].xy; } }
  return dDishAt(p, c);
}
// The round card the mug stands on, a finger thick.
float dCard(vec3 p){ vec2 w = vec2(length(p.xz) - PR + 0.02, abs(p.y - 0.5 * PH) - 0.5 * PH + 0.02); return min(max(w.x, w.y), 0.0) + length(max(w, 0.0)) - 0.02; }
float dLow(vec3 p){ return min(dDish(p), dCard(p)); }
vec3 nLow(vec3 p){ vec2 e = vec2(0.0016, -0.0016); return normalize(e.xyy * dLow(p + e.xyy) + e.yyx * dLow(p + e.yyx) + e.yxy * dLow(p + e.yxy) + e.xxx * dLow(p + e.xxx)); }

vec2 bound(vec3 ro, vec3 rd){
  float a = dot(rd.xz, rd.xz); float b = dot(ro.xz, rd.xz); float c = dot(ro.xz, ro.xz) - 1.5;
  float h = b * b - a * c; if (h < 0.0 || a < 1e-6) return vec2(1.0, -1.0);
  h = sqrt(h); float t0 = (-b - h) / a; float t1 = (-b + h) / a;
  float y0 = PH + uLift - 0.01; float y1 = PH + uLift + YTOP + 0.03;
  if (abs(rd.y) > 1e-5) { float ya = (y0 - ro.y) / rd.y; float yb = (y1 - ro.y) / rd.y; t0 = max(t0, min(ya, yb)); t1 = min(t1, max(ya, yb)); }
  else if (ro.y < y0 || ro.y > y1) return vec2(1.0, -1.0);
  return vec2(max(t0, 0.0), t1);
}
float march(vec3 ro, vec3 rd){
  vec2 tb = bound(ro, rd); if (tb.x > tb.y) return -1.0;
  float t = tb.x;
  for (int i = 0; i < 84; i++) { float d = dMug(toLocal(ro + rd * t)); if (d < 0.0007) return t; t += d * 0.85; if (t > tb.y) break; }
  return -1.0;
}
float marchLo(vec3 ro, vec3 rd){
  vec2 tb = bound(ro, rd); if (tb.x > tb.y) return -1.0;
  float t = max(tb.x, 0.012);
  for (int i = 0; i < 30; i++) { float d = dMug(toLocal(ro + rd * t)); if (d < 0.002) return t; t += d * 0.9; if (t > tb.y) break; }
  return -1.0;
}
float marchLow(vec3 ro, vec3 rd){
  if (rd.y > -1e-4) return -1.0;
  float t = max((PH + 0.01 - ro.y) / rd.y, 0.0); float t1 = -ro.y / rd.y;
  for (int i = 0; i < 40; i++) { float d = dLow(ro + rd * t); if (d < 0.0008) return t; t += d * 0.9; if (t > t1) break; }
  return -1.0;
}

// The room the camera stands in: dim and warm, with a window, a strip light, a scrim overhead and the sun in the window.
vec3 env(vec3 rd){
  float el = asin(clamp(rd.y, -1.0, 1.0)); float az = atan(rd.x, -rd.z);
  vec3 c = mix(vec3(0.16, 0.1, 0.04), vec3(0.5, 0.42, 0.3), smoothstep(-0.1, 0.6, rd.y));
  c += vec3(1.0, 0.985, 0.96) * (0.45 * smoothstep(0.42, 0.8, el) + 2.2 * smoothstep(0.86, 1.2, el));
  vec2 w = abs(vec2(az + 0.82, el - 0.5)) - vec2(0.36, 0.3);
  float bars = smoothstep(0.012, 0.026, abs(az + 0.82)) * smoothstep(0.012, 0.026, abs(el - 0.5));
  c += vec3(1.0, 0.98, 0.94) * 7.0 * smoothstep(0.02, -0.02, max(w.x, w.y)) * bars;
  vec2 w2 = abs(vec2(az - 0.95, el - 0.48)) - vec2(0.11, 0.4);
  c += vec3(0.95, 0.98, 1.0) * 4.2 * smoothstep(0.03, -0.03, max(w2.x, w2.y));
  // a long softbox hung above the back of the sweep: wet glaze lying flat in a dish looks straight up into its lower edge
  c += vec3(1.0, 0.985, 0.96) * 1.5 * smoothstep(0.3, 0.36, el) * smoothstep(0.455, 0.42, el) * smoothstep(1.3, 1.7, abs(az));
  c += SUNC * 30.0 * smoothstep(0.9965, 0.9992, dot(rd, uSun));
  return c;
}
// light from everywhere else: the room from above, and from below whatever the thing stands on
vec3 ambient(vec3 n, vec3 ground){ return mix(ground * 1.25 + 0.02, vec3(1.0, 0.985, 0.96) * 0.7, 0.5 + 0.5 * n.y); }

// How much of the sun reaches a point: soft where the thing in the way is far off, crisp where it touches.
float sunVis(vec3 p){
  float res = 1.0;
  vec2 tb = bound(p, uSun);
  if (tb.x < tb.y) {
    float t = max(tb.x, 0.02);
    for (int i = 0; i < 26; i++) { float h = dMug(toLocal(p + uSun * t)); res = min(res, 9.0 * h / t); t += clamp(h, 0.02, 0.3); if (res < 0.004 || t > tb.y) break; }
  }
  if (p.y < PH - 0.02) {
    float t = 0.015;
    for (int i = 0; i < 10; i++) { float h = dLow(p + uSun * t); res = min(res, 12.0 * h / t); t += clamp(h, 0.012, 0.08); if (res < 0.004 || t > 0.4) break; }
  }
  res = clamp(res, 0.0, 1.0); return res * res * (3.0 - 2.0 * res);
}

// Everything that is not an object: floor, cove and wall of one sheet of paper.
float hitStage(vec3 ro, vec3 rd, float top, out vec3 n){
  n = vec3(0.0, 1.0, 0.0);
  if (rd.y < 0.0) { float tf = -ro.y / rd.y; float z = ro.z + rd.z * tf; if (z < ZW - RC) return tf; }
  if (rd.z > 0.0) { float tw = (ZW - ro.z) / rd.z; float y = ro.y + rd.y * tw; if (y > top) return -1.0; if (y > RC) { n = vec3(0.0, 0.0, -1.0); return tw; } }
  vec2 o = ro.yz - vec2(RC, ZW - RC); float a = dot(rd.yz, rd.yz); float b = dot(o, rd.yz); float h = b * b - a * (dot(o, o) - RC * RC);
  if (h > 0.0 && a > 1e-7) { float tc = (-b + sqrt(h)) / a; vec2 pc = ro.yz + rd.yz * tc; if (tc > 0.0 && pc.x < RC + 0.02 && pc.y > ZW - RC - 0.02) { vec2 nn = (vec2(RC, ZW - RC) - pc) / RC; n = vec3(0.0, nn.x, nn.y); return tc; } }
  return -1.0;
}
vec3 stage(vec3 ro, vec3 rd, float full){
  vec3 n; float t = hitStage(ro, rd, full > 0.5 ? TOP : TOPR, n);
  if (t < 0.0) return env(rd);
  vec3 p = ro + rd * t;
  vec2 pq = p.xy + p.z * vec2(0.37, 0.81);
  float tooth = 0.5 * (n2(pq * 150.0) - 0.5) + 0.3 * (n2(pq * 61.0 + 7.0) - 0.5) + 0.35 * (n2(pq * vec2(9.0, 240.0)) - 0.5); float mott = n2(pq * 1.7) - 0.5;
  vec3 alb = PAPER * (1.0 + 0.07 * tooth + 0.1 * mott);
  float ndl = max(dot(n, uSun), 0.0);
  float vis = 1.0; float occ = 1.0;
  if (full > 0.5) {
    vis = ndl > 0.0 ? sunVis(p + n * 0.004) : 0.0;
    float dd = dLow(p + n * 0.02);
    occ = 0.5 + 0.5 * smoothstep(0.0, 0.12, dd);
  } else {
    // seen in the glaze: the card under the mug, and a black flag laid on the floor in front of the set to keep the colour deep
    if (n.y > 0.9) { alb = mix(alb, PLINTH, smoothstep(PR + 0.2, PR - 0.2, length(p.xz))); alb *= mix(0.03, 1.0, smoothstep(-3.1, -0.8, p.z)); }
    vec3 c = vec3(0.0, 0.75 + uLift, 0.0) - p; float b = dot(c, uSun); float d2 = dot(c, c) - b * b;
    vis = b > 0.0 ? smoothstep(0.5, 0.92, sqrt(max(d2, 0.0))) : 1.0;
    occ = 0.5 + 0.5 * smoothstep(0.35, 1.1, length(p.xz));
  }
  // a second lamp washes the backdrop behind the mug and falls away to the corners
  vec2 wq = p.xy - vec2(0.3, 1.1); float wash = exp(-dot(wq, wq) / 20.0);
  vec3 fill = mix(PAPER * 1.5 + 0.1, vec3(1.0, 0.985, 0.96), 0.5 + 0.5 * n.y) * (1.0 + (1.3 * wash - 0.3) * (1.0 - n.y));
  // a flag over the window keeps the top of the backdrop out of the sun, so the light gathers low round the mug
  ndl *= 1.0 - 0.5 * smoothstep(0.5, 2.6, p.y);
  // the key light is a pool, brightest round the mug
  vec2 kq = p.xz - vec2(0.3, -0.2); float pool = 0.7 + 0.42 * exp(-dot(kq, kq) / 26.0);
  return alb * (SUNC * SUNI * pool * ndl * vis + fill * occ * (1.0 - 0.18 * n.y));
}

// What the mug is made of at a point: bare clay, the coloured glaze outside or the pale one inside.
vec4 mugSkin(vec3 q){
  float r = length(q.xz); float a = atan(q.z, q.x);
  float o = dShape(q);
  float sp = 0.0;
  vec3 g = q * 34.0; vec3 gi = floor(g); float hh = h31(gi);
  if (hh < 0.34) { vec3 off = (vec3(h31(gi + 7.1), h31(gi + 13.7), h31(gi + 29.3)) - 0.5) * 0.5; float rr = 0.05 + 0.16 * h31(gi + 3.3); sp = smoothstep(rr, rr * 0.45, length(fract(g) - 0.5 - off)); }
  if (o < -0.03 || (q.y > YTOP - 0.012 && o < -0.5 * WALL)) return vec4(LINER * (1.0 - 0.5 * sp * step(hh, 0.12)), 1.0);
  float yg = gline(a);
  float glazed = smoothstep(yg - 0.004, yg + 0.004, q.y);
  vec3 clay = CLAY * (0.7 + 0.5 * n2(vec2(a * 30.0, q.y * 90.0)) * n2(vec2(a * 7.0, q.y * 21.0)) + 0.16 * n2(vec2(a * 2.0, q.y * 150.0))) * (1.0 - 0.6 * sp * step(hh, 0.22)) + 0.1 * sp * step(0.27, hh);
  vec3 col = mix(uOld, uNew, smoothstep(0.006, -0.006, gfront(a) - q.y));
  // glaze runs thin over the lip and breaks to toffee there, and pools darker where it stops
  float lum = dot(col, vec3(0.3, 0.6, 0.1));
  col = mix(col, mix(vec3(0.4, 0.19, 0.06), col, 0.12) * (0.35 + 1.6 * lum), 0.85 * smoothstep(YTOP - 0.024, YTOP - 0.008, q.y));
  col *= 1.0 - 0.3 * smoothstep(0.05, 0.0, q.y - yg) * glazed;
  col *= 1.0 - 0.6 * sp * step(hh, 0.1);
  // and it is never one flat colour: thinner over each throwing ring, cloudy where it pooled in the kiln
  col *= (0.88 + 0.24 * n2(vec2(a * 3.0, q.y * 5.0))) * (1.0 + 0.035 * sin(q.y * 34.0 + 1.5 * n2(vec2(a * 2.0, q.y * 3.0)))) * (0.96 + 0.08 * n2(vec2(a * 38.0, q.y * 55.0)));
  return vec4(mix(clay, col, glazed), glazed);
}

// A mirror ray off glaze: the mug again, or the set.
vec3 mirror(vec3 ro, vec3 rd){
  float t = marchLo(ro, rd);
  if (t > 0.0) {
    vec3 q = toLocal(ro + rd * t); vec3 n = toWorldDir(nMug(q)); vec4 sk = mugSkin(q);
    return sk.rgb * (SUNC * SUNI * max(dot(n, uSun), 0.0) * 0.55 + ambient(n, PLINTH) * 0.6);
  }
  return stage(ro, rd, 0.0);
}

float aoMug(vec3 p, vec3 n){
  float a = 0.0; float w = 1.0;
  for (int i = 1; i <= 4; i++) { float d = 0.045 * float(i) + 0.012 * float(i * i); float h = min(dMug(toLocal(p + n * d)), p.y + n.y * d - PH); a += w * (d - h); w *= 0.62; }
  return clamp(1.0 - 2.1 * a, 0.0, 1.0);
}

vec3 shadeMug(vec3 p, vec3 rd){
  vec3 q = toLocal(p); vec3 nl = nMug(q); vec3 n = toWorldDir(nl);
  vec4 sk = mugSkin(q);
  float ndl = max(dot(n, uSun), 0.0);
  float vis = ndl > 0.0 ? sunVis(p + n * 0.012) : 0.0;
  float ao = aoMug(p, n);
  vec3 col = sk.rgb * (SUNC * SUNI * ndl * vis + ambient(n, dShape(q) < -0.03 ? vec3(0.8, 0.6, 0.36) : PLINTH) * ao);
  // fired glaze is never optically flat: a slow wobble in the surface, and the rings the potter's fingers left
  float a = atan(q.z, q.x);
  vec3 wob = vec3(n2(vec2(a * 5.0, q.y * 7.0)) - 0.5, 0.0, n2(vec2(a * 5.0 + 17.0, q.y * 7.0)) - 0.5) * 0.035;
  wob.y = 0.014 * sin(q.y * 34.0 + 1.5 * n2(vec2(a * 2.0, q.y * 3.0))) * step(-0.03, dShape(q));
  vec3 ng = normalize(n + toWorldDir(wob) * sk.a);
  float nv = clamp(dot(-rd, ng), 0.0, 1.0);
  float f = (0.04 + 0.96 * pow(1.0 - nv, 5.0)) * (0.06 + 0.94 * sk.a);
  vec3 refl = mirror(p + n * 0.012, normalize(reflect(rd, ng) + gRnd * 0.01));
  return col * (1.0 - f) + refl * f * (0.35 + 0.65 * ao);
}

vec3 shadeLow(vec3 p, vec3 rd){
  if (dCard(p) < dDish(p)) {
    vec3 n = nLow(p);
    float tooth = 0.5 * (n2(p.xz * 150.0) - 0.5) + 0.3 * (n2(p.xz * 61.0 + 7.0) - 0.5) + 0.35 * (n2(p.xz * vec2(9.0, 240.0)) - 0.5);
    vec3 alb = PLINTH * (1.0 + 0.09 * tooth + 0.1 * (n2(p.xz * 2.3) - 0.5));
    float ndl = max(dot(n, uSun), 0.0);
    float vis = ndl > 0.0 ? sunVis(p + n * 0.004) : 0.0;
    float dm = dMug(toLocal(p + n * 0.05));
    float occ = (0.38 + 0.62 * smoothstep(0.0, 0.5, dm)) * (0.6 + 0.4 * smoothstep(0.0, 0.1, p.y + 0.06 * n.y));
    // the glaze throws a little of its own colour back onto the card beside it
    vec3 bleed = mix(uOld, uNew, uProg) * 0.7 * exp(-max(dm, 0.0) * 4.5);
    vec3 fill = mix(PAPER * 1.5 + 0.1, vec3(1.0, 0.985, 0.96), 0.5 + 0.5 * n.y);
    return alb * (SUNC * SUNI * 1.1 * ndl * vis + fill * occ * (1.0 - 0.18 * n.y) + bleed);
  }
  float best = 1e9; vec3 c = vec3(0.0); vec3 tint = vec3(0.0);
  for (int i = 0; i < 5; i++) { vec2 o = p.xz - uDish[i].xy; float d2 = dot(o, o); if (d2 < best) { best = d2; c = uDish[i]; tint = uTint[i]; } }
  vec2 o = p.xz - c.xy; float r = length(o);
  vec3 n = nLow(p);
  float wet = step(r, 0.197) * step(p.y, 0.069);
  vec3 alb = mix(LINER * (0.9 + 0.2 * n2(p.xz * 40.0)) * (1.0 - 0.5 * step(0.93, h21(floor(p.xz * 190.0)))), tint * 0.85, wet);
  // wet glaze climbs the wall of the dish a little, and the dish you picked is still rocking
  if (wet > 0.5) { float m = smoothstep(0.15, 0.197, r); float k = c.z * 0.2 * sin(r * 62.0 - uRipT * 13.0) * smoothstep(0.19, 0.1, r) - 0.7 * m * m; n = normalize(vec3(o.x / max(r, 1e-3) * k, 1.0, o.y / max(r, 1e-3) * k)); }
  float ndl = max(dot(n, uSun), 0.0);
  float vis = ndl > 0.0 ? sunVis(p + n * 0.006) : 0.0;
  float ao = mix(0.55 + 0.45 * smoothstep(0.0, 0.07, p.y), 0.8 + 0.2 * smoothstep(0.2, 0.1, r), step(0.06, p.y));
  vec3 col = alb * (SUNC * SUNI * ndl * vis + ambient(n, PAPER) * ao);
  float nv = clamp(dot(-rd, n), 0.0, 1.0);
  float f = (0.04 + 0.96 * pow(1.0 - nv, 5.0)) * (0.55 + 0.45 * wet);
  return col * (1.0 - f) + mirror(p + n * 0.006, reflect(rd, n)) * f;
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
  gRnd = uSeed > 0.001 ? (vec3(h21(gl_FragCoord.xy + ign * 17.0), h21(gl_FragCoord.yx + ign * 31.0), ign) - 0.5) * 2.0 : vec3(0.0);
  float tm = march(ro, rd); float td = marchLow(ro, rd);
  vec3 col;
  if (tm > 0.0 && (td < 0.0 || tm < td)) col = shadeMug(ro + rd * tm, rd);
  else if (td > 0.0) col = shadeLow(ro + rd * td, rd);
  else col = stage(ro, rd, 1.0);
  col = min(col, vec3(14.0));
  if (uDirect > 0.5) col = tone(col);
  outC = vec4(col, 1.0);
}
`;

// Developing the negative: a little bloom off the hot glints, the film curve, a soft vignette and grain.
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
    b += min(max(s - 3.0, 0.0), vec3(8.0)) * (1.0 - 0.6 * r);
  }
  c += b * 0.014;
  vec2 q = (uv - uCentre) * vec2(uRes.x / uRes.y, 1.0);
  c *= 1.0 - 0.16 * smoothstep(0.4, 1.3, length(q));
  c = tone(c);
  float g = h21(gl_FragCoord.xy + uGrain * 91.7) - 0.5;
  c += g * 0.018 * (1.0 - 0.4 * c.g);
  outC = vec4(c, 1.0);
}
`;

type Spot = { x: number; y: number; k: number };

// No WebGL: the same set built from CSS at the same spot and scale (1em is one unit of the scene), and the new glaze still runs down from the lip.
function Still({ at, sel }: { at: Spot; sel: number }) {
  const side = "linear-gradient(90deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.1) 16%, rgba(0,0,0,0) 40%, rgba(0,0,10,0.28) 80%, rgba(0,0,10,0.5) 100%), linear-gradient(180deg, rgba(0,0,20,0.25) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 62%, rgba(120,40,0,0.3) 100%)";
  return (
    <div aria-hidden="true" className="absolute h-0 w-0" style={{ left: at.x, top: at.y, fontSize: at.k }}>
      {/* the card, with its edge */}
      <div className="absolute left-[-1.2em] top-[-0.27em] h-[0.78em] w-[2.4em] rounded-[50%] bg-[#d9601a] shadow-[0.1em_0.12em_0.12em_rgba(140,70,0,0.5)]" />
      <div className="absolute left-[-1.2em] top-[-0.39em] h-[0.78em] w-[2.4em] overflow-hidden rounded-[50%] bg-[#f58a2c]">
        <div className="absolute left-[1.05em] top-[0.02em] h-[0.5em] w-[1.5em] -rotate-[16deg] rounded-[50%] bg-[#a8470e] opacity-80 blur-[0.05em]" />
      </div>
      <div className="absolute left-[1.02em] top-[-0.62em] h-[0.5em] w-[1.3em] -rotate-[16deg] rounded-[50%] bg-[#b07a10] opacity-60 blur-[0.07em]" />
      {/* handle, foot and body */}
      {glazes.map((g, i) => (
        <div key={g.name} className="absolute left-[0.52em] top-[-0.98em] h-[0.7em] w-[0.6em] rounded-[50%] border-[0.125em] transition-opacity delay-500 duration-700 motion-reduce:transition-none" style={{ borderColor: g.css, opacity: i === sel ? 1 : 0, boxShadow: "inset -0.03em -0.03em 0.05em rgba(0,0,20,0.35), inset 0.02em 0.03em 0.03em rgba(255,255,255,0.5)" }} />
      ))}
      <div className="absolute left-[-0.456em] top-[-0.148em] h-[0.296em] w-[0.912em] rounded-[50%] bg-[#6f4d2f]" />
      <div className="absolute left-[-0.7em] top-[-1.154em] h-[1.154em] w-[1.4em] isolate overflow-hidden rounded-[0.144em_0.144em_0.244em_0.244em/0.55em_0.55em_0.6em_0.6em] bg-[#a17a55]">
        {glazes.map((g, i) => (
          <div key={g.name} className="absolute inset-x-[-0.1em] top-[-0.2em] h-[1.16em] rounded-b-[50%_0.22em] transition-[clip-path] duration-[1400ms] ease-out motion-reduce:transition-none" style={{ backgroundColor: g.css, zIndex: i === sel ? 2 : 1, clipPath: i === sel ? "inset(0 0 0 0)" : "inset(0 0 100% 0)", transitionDelay: i === sel ? "0ms" : "1400ms" }} />
        ))}
        <div className="absolute inset-0 z-[3]" style={{ background: side }} />
        <div className="absolute left-[0.3em] top-[0.2em] z-[3] grid h-[0.24em] w-[0.2em] -skew-y-12 grid-cols-2 gap-[0.016em] opacity-60">
          <span className="rounded-[0.01em] bg-white" /><span className="rounded-[0.01em] bg-white" /><span className="rounded-[0.01em] bg-white" /><span className="rounded-[0.01em] bg-white" />
        </div>
        <div className="absolute right-[0.2em] top-[0.14em] z-[3] h-[0.4em] w-[0.035em] rotate-[8deg] rounded-full bg-white opacity-40 blur-[0.01em]" />
      </div>
      {/* the mouth: lip, then the pale glaze inside */}
      {glazes.map((g, i) => (
        <div key={g.name} className="absolute left-[-0.572em] top-[-1.35em] h-[0.39em] w-[1.144em] rounded-[50%] transition-opacity duration-500 motion-reduce:transition-none" style={{ backgroundColor: g.css, opacity: i === sel ? 1 : 0, boxShadow: "inset 0 0.03em 0.03em rgba(0,0,20,0.4)" }} />
      ))}
      <div className="absolute left-[-0.53em] top-[-1.325em] h-[0.34em] w-[1.06em] rounded-[50%] bg-[#f3ead6]" />
      <div className="absolute left-[-0.5em] top-[-1.305em] h-[0.31em] w-[1em] rounded-[50%]" style={{ background: "radial-gradient(ellipse 70% 90% at 62% 18%, #f1e2c2 0%, #dcc49a 46%, #a98c62 100%)" }} />
    </div>
  );
}

export default function RayMarchedStonewareMugShowcase() {
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const hit = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState<"wait" | "gl" | "still">("wait");
  const [sel, setSel] = useState(0);
  const [bag, setBag] = useState(0);
  const [spots, setSpots] = useState<{ mug: Spot; dishes: Spot[] } | null>(null);
  const api = useRef<{ pour: (i: number) => void; hop: () => void; turn: () => void } | null>(null);

  // Where the lens puts the mug and each dish, in CSS pixels, so real buttons can sit on top of them.
  useEffect(() => {
    const box = stage.current;
    if (!box) return;
    const place = () => {
      const r = box.getBoundingClientRect();
      const f = frameOf(Math.max(1, r.width), Math.max(1, r.height));
      setSpots({ mug: f.project(0, 0.13, 0), dishes: f.dishes.map(([x, z]) => f.project(x, 0.06, z)) });
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(box);
    return () => ro.disconnect();
  }, []);

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
    const still = reduce || software; // nothing plays by itself: draw, refine, then rest

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
    const su = Object.fromEntries(["uRes", "uJit", "uSeed", "uDirect", "uCam", "uTgt", "uFoc", "uShift", "uFocus", "uRot", "uLift", "uSun", "uOld", "uNew", "uProg", "uBead", "uGseed", "uDish", "uTint", "uRipT"].map((n) => [n, U(scene, n)]));
    const pu = post ? Object.fromEntries(["uAcc", "uRes", "uGrain", "uCentre"].map((n) => [n, U(post, n)])) : {};

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // The accumulation plate: every frame is one more exposure blended onto it.
    const acc = canAcc ? gl.createTexture() : null;
    const fbo = canAcc ? gl.createFramebuffer() : null;
    let W = 0, H = 0, scale = 1, cssW = 1, cssH = 1;
    const size = () => {
      const r = box.getBoundingClientRect();
      cssW = Math.max(1, r.width); cssH = Math.max(1, r.height);
      const dpr = Math.min(software ? 1 : 1.75, window.devicePixelRatio || 1) * scale;
      // never more than about two million pixels of tracing
      const k = Math.min(1, Math.sqrt(1.9e6 / (cssW * cssH * dpr * dpr)));
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

    const s = {
      a: HERO, v: 0, rest: HERO as number | null, drag: false, spinT: -1, spinFrom: HERO, spinTo: HERO, spinLen: 1,
      cur: 0, old: 0, prog: 1, bead: 0, gseed: 1.3, rip: 0, ripT: 0, // the pour and the dish it came from
      ly: 0, lv: 0, // height off the floor after a hop
      count: 0, fresh: true, frame: 0, slow: 0,
      visible: true, raf: 0, last: 0, t0: 0, touched: false, demoAt: 0, first: true, alive: true,
    };
    const halton = (i: number, b: number) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };
    const tints = new Float32Array(glazes.flatMap((g) => g.rgb));

    const draw = (alpha: number, sample: number) => {
      const f = frameOf(cssW, cssH);
      const jx = sample ? halton(sample, 2) - 0.5 : 0, jy = sample ? halton(sample, 3) - 0.5 : 0;
      const la = halton(sample, 5) * Math.PI * 2, lr = sample ? Math.sqrt(halton(sample, 7)) * 0.05 : 0;
      // the sun is a disc, not a point: each exposure looks at a slightly different part of it
      const sj = sample ? 0.02 : 0, sa = -0.9 + (halton(sample, 11) - 0.5) * sj, se = 0.6 + (halton(sample, 13) - 0.5) * sj;
      gl.useProgram(scene);
      gl.bindFramebuffer(gl.FRAMEBUFFER, canAcc ? fbo : null);
      gl.viewport(0, 0, W, H);
      if (canAcc && alpha < 1) { gl.enable(gl.BLEND); gl.blendColor(0, 0, 0, alpha); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA); } else gl.disable(gl.BLEND);
      gl.uniform2f(su.uRes, W, H);
      gl.uniform4f(su.uJit, canAcc ? jx : 0, canAcc ? jy : 0, canAcc ? Math.cos(la) * lr : 0, canAcc ? Math.sin(la) * lr : 0);
      gl.uniform1f(su.uSeed, canAcc && sample ? (sample * 0.61803) % 1 || 0.5 : 0);
      gl.uniform1f(su.uDirect, canAcc ? 0 : 1);
      gl.uniform3f(su.uCam, f.cam[0], f.cam[1], f.cam[2]); gl.uniform3f(su.uTgt, f.tgt[0], f.tgt[1], f.tgt[2]);
      gl.uniform1f(su.uFoc, f.foc);
      gl.uniform2f(su.uShift, f.shift[0], f.shift[1]);
      gl.uniform1f(su.uFocus, f.dist);
      gl.uniform1f(su.uRot, s.a); gl.uniform1f(su.uLift, s.ly);
      // the window is camera left and a little in front of the set, so shadows fall back and to the right
      gl.uniform3f(su.uSun, Math.sin(sa) * Math.cos(se), Math.sin(se), -Math.cos(sa) * Math.cos(se));
      const o = glazes[s.old].rgb, n = glazes[s.cur].rgb;
      gl.uniform3f(su.uOld, o[0], o[1], o[2]); gl.uniform3f(su.uNew, n[0], n[1], n[2]);
      gl.uniform1f(su.uProg, s.prog); gl.uniform1f(su.uBead, s.bead); gl.uniform1f(su.uGseed, s.gseed);
      gl.uniform3fv(su.uDish, new Float32Array(f.dishes.flatMap(([x, z], i) => [x, z, i === s.cur ? s.rip : 0])));
      gl.uniform3fv(su.uTint, tints);
      gl.uniform1f(su.uRipT, s.ripT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (canAcc && post) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.disable(gl.BLEND);
        gl.useProgram(post);
        gl.uniform1i(pu.uAcc, 1); gl.uniform2f(pu.uRes, W, H);
        gl.uniform1f(pu.uGrain, still ? 1 : s.frame % 64);
        gl.uniform2f(pu.uCentre, cssW >= 768 ? 0.6 : 0.5, 0.5);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };

    // a turn with a wind-up before it and a lean past the mark after it
    const back = (x: number) => { const c = 1.15; return x < 0.5 ? (Math.pow(2 * x, 2) * ((c + 1) * 2 * x - c)) / 2 : (Math.pow(2 * x - 2, 2) * ((c + 1) * (x * 2 - 2) + c) + 2) / 2; };
    const spin = (by: number, secs: number) => {
      if (s.drag) return;
      const from = s.spinT >= 0 ? s.spinTo : s.rest ?? s.a;
      s.spinT = 0; s.spinFrom = s.a; s.spinTo = from + by; s.spinLen = secs; s.rest = s.spinTo;
    };
    const pour = (i: number, fromUser: boolean) => {
      if (fromUser) s.touched = true;
      if (i === s.cur) return;
      s.old = s.cur; s.cur = i; s.gseed = Math.random() * 6.283;
      if (reduce) { s.prog = 1; s.bead = 0; } else { s.prog = 0; s.bead = 1; s.rip = 1; s.ripT = 0; spin(Math.PI * 2, 2.3); }
      s.count = 0; s.fresh = reduce;
      wake();
    };
    api.current = {
      pour: (i) => pour(i, true),
      hop: () => { s.touched = true; if (!reduce && s.ly < 0.01) { s.lv = 3.5; s.ly = 0.001; s.v += 2.4; wake(); } },
      turn: () => { s.touched = true; if (reduce) { s.a += Math.PI / 2; s.rest = s.a; s.count = 0; s.fresh = true; } else spin(Math.PI / 2, 0.9); wake(); },
    };

    const frame = (now: number) => {
      s.raf = 0;
      if (!s.visible || !s.alive) return;
      const dtRaw = s.last ? (now - s.last) / 1000 : 0.016;
      const dt = Math.min(0.033, dtRaw);
      s.last = now; s.frame++;
      // it opens finished and holds; then, until someone touches it, it tries the next glaze every few seconds
      if (!s.t0) { s.t0 = now; s.demoAt = now + 4600; }
      if (!still && !s.touched && now > s.demoAt) { const next = (s.cur + 1) % glazes.length; pour(next, false); setSel(next); s.demoAt = now + 6400; }

      let moving = false;
      if (!reduce) {
        if (s.spinT >= 0) { s.spinT += dt / s.spinLen; if (s.spinT >= 1) s.spinT = -1; }
        if (!s.drag) {
          if (s.rest !== null) {
            const want = s.spinT >= 0 ? s.spinFrom + (s.spinTo - s.spinFrom) * back(s.spinT) : s.rest;
            const stiff = s.spinT >= 0 ? 150 : 46, damp = s.spinT >= 0 ? 22 : 8;
            for (let i = 0; i < 3; i++) { s.v += (stiff * (want - s.a) - damp * s.v) * (dt / 3); s.a += s.v * (dt / 3); }
            if (s.spinT < 0 && Math.abs(s.v) < 0.003 && Math.abs(want - s.a) < 0.0006) { s.a = want; s.v = 0; } else moving = true;
          } else {
            // let go after a drag: it coasts like something heavy on a banding wheel
            s.v *= Math.exp(-dt * 2.4); s.a += s.v * dt;
            if (Math.abs(s.v) < 0.012) s.v = 0; else moving = true;
          }
        } else moving = true;
        if (s.prog < 1) { s.prog = Math.min(1, s.prog + dt / POUR); moving = true; }
        else if (s.bead > 0.002) { s.bead *= Math.exp(-dt * 3.2); moving = true; } else s.bead = 0;
        if (s.rip > 0.004) { s.rip *= Math.exp(-dt * 1.5); s.ripT += dt; moving = true; } else s.rip = 0;
        if (s.ly > 0 || s.lv !== 0) {
          s.lv -= 26 * dt; s.ly += s.lv * dt;
          if (s.ly <= 0) { s.ly = 0; s.lv = s.lv < -1.3 ? -s.lv * 0.3 : 0; }
          moving = true;
        }
      }
      if (s.fresh || !canAcc) { draw(1, 0); s.fresh = false; s.count = 1; }
      else if (moving) { draw(0.6, 1 + (s.frame % 64)); s.count = 3; }
      else if (s.count < 56) { s.count++; draw(1 / s.count, s.count); }
      if (s.first) { s.first = false; setShown("gl"); }

      // measured, not guessed: if frames run long for a while, give up some resolution
      if (!still && moving && dtRaw > 0.026) s.slow++; else s.slow = Math.max(0, s.slow - 2);
      if (s.slow > 40 && scale > 0.5) { scale *= 0.82; s.slow = 0; size(); }

      if (moving || s.count < 56 || (!still && !s.touched)) s.raf = requestAnimationFrame(frame);
    };
    const wake = () => { if (!s.raf && s.visible && s.alive) { s.last = 0; s.raf = requestAnimationFrame(frame); } };

    size();
    const ro = new ResizeObserver(() => { size(); wake(); });
    ro.observe(box);
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting && !document.hidden; if (s.visible) wake(); }, { threshold: 0.05 });
    io.observe(box);
    const vis = () => { s.visible = !document.hidden; if (s.visible) wake(); };
    document.addEventListener("visibilitychange", vis);

    let downX = 0, id = -1, lastT = 0;
    const down = (e: PointerEvent) => {
      id = e.pointerId; downX = e.clientX; lastT = e.timeStamp; s.drag = true; s.touched = true; s.spinT = -1; s.v = 0; s.rest = null;
      try { pad.setPointerCapture(id); } catch { /* the pointer is already gone */ }
      wake();
    };
    const move = (e: PointerEvent) => {
      if (!s.drag || e.pointerId !== id) return;
      const dx = e.clientX - downX; downX = e.clientX;
      const da = dx * 0.011, dtp = Math.max(0.008, (e.timeStamp - lastT) / 1000); lastT = e.timeStamp;
      s.a += da; s.v = s.v * 0.5 + (da / dtp) * 0.5;
      if (reduce) { s.count = 0; s.fresh = true; }
      wake();
    };
    const upFn = (e: PointerEvent) => {
      if (!s.drag || e.pointerId !== id) return;
      s.drag = false;
      s.v = reduce ? 0 : Math.max(-12, Math.min(12, s.v));
      wake();
    };
    pad.addEventListener("pointerdown", down);
    pad.addEventListener("pointermove", move);
    pad.addEventListener("pointerup", upFn);
    pad.addEventListener("pointercancel", upFn);
    const lost = (e: Event) => { e.preventDefault(); setShown("still"); };
    cv.addEventListener("webglcontextlost", lost);
    wake();

    return () => {
      s.alive = false;
      cancelAnimationFrame(s.raf); ro.disconnect(); io.disconnect();
      document.removeEventListener("visibilitychange", vis);
      pad.removeEventListener("pointerdown", down); pad.removeEventListener("pointermove", move);
      pad.removeEventListener("pointerup", upFn); pad.removeEventListener("pointercancel", upFn);
      cv.removeEventListener("webglcontextlost", lost);
      api.current = null;
    };
  }, []);

  const pick = (i: number) => { setSel(i); api.current?.pour(i); };
  const add = () => { setBag((b) => b + 1); api.current?.hop(); };
  const glaze = glazes[sel];

  return (
    <section className="relative isolate overflow-hidden bg-[#f3b81f] text-[#1d1403]" style={{ fontFamily: FONT }}>
      <style>{`
        @keyframes ray-marched-stoneware-mug-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        .ray-marched-stoneware-mug-rise { animation: ray-marched-stoneware-mug-rise 700ms cubic-bezier(0.2, 0.9, 0.2, 1) both; }
        @keyframes ray-marched-stoneware-mug-name { from { opacity: 0; transform: translateY(0.5em); } to { opacity: 1; transform: none; } }
        .ray-marched-stoneware-mug-name { display: inline-block; animation: ray-marched-stoneware-mug-name 520ms cubic-bezier(0.2, 1.2, 0.3, 1) both; }
        @keyframes ray-marched-stoneware-mug-count { 0% { transform: scale(1); } 35% { transform: scale(1.45); } 100% { transform: scale(1); } }
        .ray-marched-stoneware-mug-count { animation: ray-marched-stoneware-mug-count 420ms cubic-bezier(0.2, 0.9, 0.2, 1) both; }
        @media (prefers-reduced-motion: reduce) { .ray-marched-stoneware-mug-rise, .ray-marched-stoneware-mug-name, .ray-marched-stoneware-mug-count { animation: none; } }
      `}</style>
      <div ref={stage} className="relative mx-auto h-[750px] w-full max-w-[1600px] md:h-[760px]" style={{ background: "linear-gradient(180deg, #e9a814 0%, #f2b71d 26%, #f8cc35 40%, #f9d445 100%)" }}>
        {shown === "still" && spots && <Still at={spots.mug} sel={sel} />}
        <canvas ref={canvas} aria-hidden="true" className={`absolute inset-0 h-full w-full transition-opacity duration-700 motion-reduce:transition-none ${shown === "gl" ? "opacity-100" : "opacity-0"}`} />
        <div ref={hit} aria-hidden="true" className="absolute inset-0 cursor-grab select-none active:cursor-grabbing" style={{ touchAction: "pan-y" }} />

        {/* One real button over each dish of glaze. */}
        <div role="group" aria-label="Glaze colour">
          {spots?.dishes.map((d, i) => {
            const w = Math.max(44, d.k * 0.5), h = Math.max(44, d.k * 0.23);
            return (
              <button key={glazes[i].name} type="button" aria-pressed={i === sel} aria-label={`${glazes[i].name} glaze`} onClick={() => pick(i)} className="group absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-[50%] outline-none focus-visible:ring-2 focus-visible:ring-[#1d1403] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8cc35]" style={{ left: d.x, top: d.y, width: w, height: h }}>
                {shown === "still" && (
                  <span className="absolute inset-0 rounded-[50%] border-[#efe6d0] shadow-[0.4em_0.5em_0.5em_-0.1em_rgba(120,60,0,0.55),inset_0_0.5em_0.4em_-0.3em_rgba(0,0,20,0.35)]" style={{ backgroundColor: glazes[i].css, fontSize: w / 10, borderWidth: w / 11, borderBottomWidth: w / 8 }} />
                )}
                <span aria-hidden="true" className={`absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.26em] transition-opacity duration-300 motion-reduce:transition-none ${i === sel ? "opacity-100" : "opacity-0 group-hover:opacity-60 group-focus-visible:opacity-60"}`}>{glazes[i].name}</span>
              </button>
            );
          })}
        </div>

        <div className="pointer-events-none absolute inset-0 flex flex-col px-6 pb-7 pt-6 md:px-10 md:pb-10 md:pt-8 lg:px-16 lg:pb-12 lg:pt-10">
          <p className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.32em]">
            <span>{product.maker}</span>
            <span className="flex items-center gap-3">
              Bag
              <span key={bag} className={`grid h-7 min-w-[28px] place-items-center rounded-full bg-[#1d1403] px-2 text-[12px] tracking-normal text-[#ffd54a] ${bag ? "ray-marched-stoneware-mug-count" : ""}`}>{bag}</span>
            </span>
          </p>
          <div className="ray-marched-stoneware-mug-rise mt-auto md:mb-auto md:mt-[58px]">
            <p className="text-[17px] italic md:text-[19px] lg:text-[21px]" style={{ fontFamily: SERIF }}>{product.kind}</p>
            <h2 className="mt-1 text-[68px] font-extrabold leading-[0.82] tracking-[-0.055em] md:mt-3 md:text-[104px] lg:text-[148px]">
              {product.name.map((line) => <span key={line} className="block">{line}</span>)}
            </h2>
            <p className="mt-3 text-[20px] italic leading-none md:mt-5 md:text-[25px] lg:mt-6 lg:text-[30px]" style={{ fontFamily: SERIF }}>
              dipped in <span key={glaze.name} className="ray-marched-stoneware-mug-name not-italic font-extrabold tracking-[-0.03em]" style={{ fontFamily: FONT }}>{glaze.name}</span>
            </p>
          </div>
          <div className="ray-marched-stoneware-mug-rise mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 md:mt-0">
            <span className="text-[52px] font-extrabold leading-none tracking-[-0.055em] md:text-[64px] lg:text-[88px]">{product.price}</span>
            <button type="button" onClick={add} className="pointer-events-auto inline-flex h-[60px] items-center gap-3 whitespace-nowrap rounded-full bg-[#1d1403] pl-8 pr-7 text-[19px] font-bold tracking-[-0.02em] text-[#ffd54a] shadow-[0_1px_0_rgba(255,255,255,0.25)_inset,0_16px_30px_-14px_rgba(90,50,0,0.9)] outline-none transition-transform duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#1d1403] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8cc35] active:translate-y-0.5 active:scale-[0.98] motion-reduce:transition-none lg:h-[68px] lg:text-[22px]">
              {product.cta}
              <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 7h11l-.8 9.5H5.3L4.5 7ZM7.3 7V5.7a2.7 2.7 0 0 1 5.4 0V7" /></svg>
            </button>
            <span className="w-full text-[11px] font-semibold uppercase tracking-[0.24em] lg:mt-1">{product.note}</span>
          </div>
        </div>
        <p aria-live="polite" className="sr-only">{bag ? `${bag} in your bag. ${product.name.join(" ")} in ${glaze.name} added.` : ""}</p>
        {shown === "gl" && (
          <button type="button" onClick={() => api.current?.turn()} className="absolute right-3 top-[58px] flex h-10 items-center gap-2 rounded-full px-3 text-[10px] font-semibold uppercase tracking-[0.28em] outline-none hover:text-[#1f45c8] focus-visible:ring-2 focus-visible:ring-[#1d1403] md:right-7 md:top-[66px] md:text-[11px] lg:right-[52px] lg:top-[78px]">
            <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 10a6.5 6.5 0 1 1-2.2-4.9M16.6 3.2v3.4h-3.4" /></svg>
            <span><span className="hidden md:inline">Drag or press to turn</span><span className="md:hidden">Turn</span></span>
          </button>
        )}
      </div>
    </section>
  );
}
